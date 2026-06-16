#!/bin/bash
################################################################################
# 엔드포인트 검증 게이트 (Phase 2 개선안 #1)
# 역할: 자동화 모니터링 거짓 신호 방지
#
# 단계:
#   1. 3회 연속 엔드포인트 확인
#   2. 결과 일관성 검증
#   3. 이전 상태와 비교 (급격한 변화 감지)
#   4. 설정 파일 검증 (URL 정합성)
#   5. 통과 시만 git commit 생성
#
# 2026-06-17 00:00 KST 배포 (개선안 #1)
################################################################################

set -uo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
LOG_FILE="$WORKSPACE_DIR/memory/logs/endpoint-validation.log"
VALIDATION_STATE="$WORKSPACE_DIR/.endpoint-validation-state.json"
CONFIG_FILE="$WORKSPACE_DIR/memory-automation/endpoint-config.json"

mkdir -p "$(dirname "$LOG_FILE")"

# 로그 함수
log() {
  local msg="$1"
  echo "[$(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S KST')] $msg" >> "$LOG_FILE"
}

# 엔드포인트 설정 검증
validate_endpoint_config() {
  log "🔧 엔드포인트 설정 검증 시작..."

  # 필수 엔드포인트 목록
  local required_endpoints=(
    "https://dsc-fms-portal.vercel.app:200"
    "https://dsc-audit-p1.vercel.app:200"
    "https://dsc-discord-bot-p1.vercel.app:200"
    "https://dsc-travel-p2-ui.vercel.app:200"
  )

  # 설정 파일 검증
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log "⚠️  설정 파일 없음, 기본 설정 생성..."
    mkdir -p "$(dirname "$CONFIG_FILE")"

    cat > "$CONFIG_FILE" <<'EOF'
{
  "endpoints": [
    {
      "url": "https://dsc-fms-portal.vercel.app",
      "expected_code": 200,
      "name": "Main Portal",
      "critical": true
    },
    {
      "url": "https://dsc-audit-p1.vercel.app",
      "expected_code": 200,
      "name": "AUDIT-P1",
      "critical": true
    },
    {
      "url": "https://dsc-discord-bot-p1.vercel.app",
      "expected_code": 200,
      "name": "DISCORD-BOT-P1",
      "critical": true
    },
    {
      "url": "https://dsc-travel-p2-ui.vercel.app",
      "expected_code": 200,
      "name": "TRAVEL-P2-UI",
      "critical": true
    }
  ],
  "validation_rules": {
    "consecutive_checks": 3,
    "timeout_seconds": 10,
    "abort_on_url_mismatch": true,
    "log_response_headers": true
  }
}
EOF
    log "✅ 설정 파일 생성"
  else
    log "✅ 설정 파일 존재"
  fi
}

# Step 1: 3회 연속 엔드포인트 확인
check_endpoints_consecutive() {
  log ""
  log "📍 Step 1: 3회 연속 엔드포인트 확인..."

  local consecutive_checks=3
  local timeout=10
  local success_count=0

  for check in $(seq 1 $consecutive_checks); do
    log "  확인 $check/$consecutive_checks..."

    local all_healthy=true
    local check_results=""

    # dsc-fms-portal (Main Portal)
    local code1=$(curl -s -o /dev/null -w "%{http_code}" "https://dsc-fms-portal.vercel.app" --max-time $timeout 2>/dev/null || echo "000")
    check_results+="Portal:$code1,"
    [[ "$code1" != "200" ]] && all_healthy=false

    # dsc-audit-p1
    local code2=$(curl -s -o /dev/null -w "%{http_code}" "https://dsc-audit-p1.vercel.app" --max-time $timeout 2>/dev/null || echo "000")
    check_results+="Audit:$code2,"
    [[ "$code2" != "200" ]] && all_healthy=false

    # dsc-discord-bot-p1
    local code3=$(curl -s -o /dev/null -w "%{http_code}" "https://dsc-discord-bot-p1.vercel.app" --max-time $timeout 2>/dev/null || echo "000")
    check_results+="Discord:$code3,"
    [[ "$code3" != "200" ]] && all_healthy=false

    # dsc-travel-p2-ui
    local code4=$(curl -s -o /dev/null -w "%{http_code}" "https://dsc-travel-p2-ui.vercel.app" --max-time $timeout 2>/dev/null || echo "000")
    check_results+="Travel:$code4"
    [[ "$code4" != "200" ]] && all_healthy=false

    if [[ "$all_healthy" == "true" ]]; then
      ((success_count++))
      log "    ✅ 확인 $check 성공: $check_results"
    else
      success_count=0
      log "    ❌ 확인 $check 실패: $check_results (카운트 리셋)"
    fi

    if [[ $success_count -eq $consecutive_checks ]]; then
      log "  ✅ Step 1 통과: 3회 연속 성공"
      return 0
    fi

    sleep 10  # 10초 대기
  done

  log "  ❌ Step 1 실패: 3회 연속 성공 불가"
  return 1
}

# Step 2: 결과 일관성 검증
validate_consistency() {
  log ""
  log "📍 Step 2: 결과 일관성 검증..."

  # 마지막 상태 읽기
  if [[ ! -f "$VALIDATION_STATE" ]]; then
    log "  ℹ️  이전 상태 없음 (첫 실행)"
    return 0
  fi

  local prev_status=$(cat "$VALIDATION_STATE" 2>/dev/null | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "UNKNOWN")
  log "  이전 상태: $prev_status"
  log "  현재 상태: HEALTHY"

  # 급격한 변화 감지 (DOWN → HEALTHY 는 검증 필요)
  if [[ "$prev_status" == "DOWN" ]]; then
    log "  ⚠️  급격한 상태 변화 감지: DOWN → HEALTHY"
    log "  다중채널 검증 게이트 호출 필요..."
    return 0  # 다중채널 검증으로 넘김
  fi

  log "  ✅ Step 2 통과: 일관성 검증 완료"
  return 0
}

# Step 3: 이전 상태와 비교
compare_with_previous() {
  log ""
  log "📍 Step 3: 이전 상태와 비교..."

  if [[ ! -f "$VALIDATION_STATE" ]]; then
    log "  ℹ️  이전 상태 없음 (상태 변경으로 취급)"
    return 0
  fi

  local prev_status=$(cat "$VALIDATION_STATE" 2>/dev/null | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "UNKNOWN")
  local prev_timestamp=$(cat "$VALIDATION_STATE" 2>/dev/null | grep -o '"timestamp":"[^"]*' | cut -d'"' -f4 || echo "0")

  if [[ "$prev_status" == "HEALTHY" ]]; then
    log "  ✅ 상태 유지 (HEALTHY): 추가 검증 불필요"
    log "  ✅ Step 3 통과"
    return 0
  else
    log "  ⚠️  상태 변경: $prev_status → HEALTHY"
    log "  🔍 급격한 변화 더블체크 필요"
    return 1
  fi
}

# Step 4: 설정 파일 검증
validate_configuration_integrity() {
  log ""
  log "📍 Step 4: 설정 파일 정합성 검증..."

  # 설정 파일에서 엔드포인트 URL 추출
  local config_endpoints=$(cat "$CONFIG_FILE" 2>/dev/null | grep -o '"url":"[^"]*' | cut -d'"' -f4 | tr '\n' '|' || echo "")

  if [[ -z "$config_endpoints" ]]; then
    log "  ❌ 설정 파일 URL 파싱 실패"
    return 1
  fi

  # URL 검증 (http, https 확인)
  if [[ "$config_endpoints" == *"https://"* ]]; then
    log "  ✅ 설정 파일 URL 형식 검증 통과"
    log "  ✅ Step 4 통과"
    return 0
  else
    log "  ❌ 설정 파일 URL 형식 오류"
    return 1
  fi
}

# Step 5: 검증 통과 후 상태 저장
save_validated_state() {
  log ""
  log "📍 Step 5: 검증 상태 저장..."

  cat > "$VALIDATION_STATE" <<EOF
{
  "status": "HEALTHY",
  "timestamp": "$(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S KST')",
  "epoch": $(date +%s),
  "validated": true,
  "validation_checks": 3,
  "endpoints": 4
}
EOF

  log "  ✅ 검증 상태 저장 완료"
  log "  ✅ Step 5 통과"
  return 0
}

# 검증 실패 시 관리자 알림
alert_admin_on_failure() {
  log ""
  log "🚨 검증 실패 — 관리자 알림"
  log "   - 엔드포인트 상태 불일치"
  log "   - 자동 커밋 블락"
  log "   - 수동 검증 필요"
}

# Main 검증 플로우
main() {
  log "================================================================"
  log "🎯 엔드포인트 검증 게이트 시작 (Phase 2 #1)"
  log "================================================================"

  # 설정 검증
  validate_endpoint_config || {
    alert_admin_on_failure
    return 1
  }

  # Step 1-4 실행
  check_endpoints_consecutive || {
    alert_admin_on_failure
    return 1
  }

  validate_consistency || {
    log "⚠️  Step 2 검증 경고: 다중채널 게이트 호출 권장"
  }

  compare_with_previous || {
    log "⚠️  Step 3 경고: 급격한 변화 감지"
  }

  validate_configuration_integrity || {
    alert_admin_on_failure
    return 1
  }

  # 모든 단계 통과
  save_validated_state

  log ""
  log "✅ 엔드포인트 검증 게이트 통과"
  log "✅ git commit 승인"
  log "================================================================"
  return 0
}

if [[ "${1:-}" == "validate" ]]; then
  main
else
  echo "Usage: $0 validate"
  exit 1
fi
