#!/bin/bash
################################################################################
# CTB 폴링 사이클 자동 커밋 생성 (한글 전용)
# 역할: 5분 주기 폴링 결과를 한글 커밋 메시지로 자동 등록
#
# 한글 규칙 (100% 준수):
#   - 모든 커밋 메시지는 한글로 작성
#   - 상태, 통계는 한글 표현
#   - 영어 프로젝트명은 그대로 유지 가능 (AUDIT, DISCORD-BOT 등)
#
# 2026-06-09 확정: 평가자 메모리 검증 규칙 적용
################################################################################

set -uo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
MEMORY_DIR="$WORKSPACE_DIR/memory"
CTB_STATE="$WORKSPACE_DIR/.ctb-state.json"
LOG_FILE="$MEMORY_DIR/logs/ctb-polling-commit.log"

mkdir -p "$(dirname "$LOG_FILE")"

# 로그 함수
log() {
  local msg="$1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

# CTB 상태 읽기
read_ctb_state() {
  if [[ ! -f "$CTB_STATE" ]]; then
    log "❌ CTB 상태 파일 없음: $CTB_STATE"
    return 1
  fi

  cat "$CTB_STATE"
}

# 한글 상태 메시지 생성
generate_korean_message() {
  local ctb_json="$1"
  local cycle_num=$(($(date +%s) / 300))  # 5분 주기 카운트

  # JSON 파싱 (python 사용)
  local status=$(echo "$ctb_json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))" 2>/dev/null || echo "0")
  local phase2a=$(echo "$ctb_json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('services', {}).get('phase2a', '불명'))" 2>/dev/null || echo "불명")
  local phase2b=$(echo "$ctb_json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('services', {}).get('phase2b', '불명'))" 2>/dev/null || echo "불명")
  local phase2c=$(echo "$ctb_json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('services', {}).get('phase2c', '불명'))" 2>/dev/null || echo "불명")
  local vercel=$(echo "$ctb_json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('production', {}).get('vercel', '불명'))" 2>/dev/null || echo "불명")

  # 상태 평가
  local stability_status=""
  if [[ "$status" == "100" ]] && [[ "$vercel" == "OK" ]]; then
    stability_status="완벽한 안정성 유지"
  elif [[ "$status" -ge 75 ]]; then
    stability_status="시스템 정상"
  else
    stability_status="부분 장애"
  fi

  # 현재 시간 (KST)
  local kst_time=$(TZ='Asia/Seoul' date '+%H:%M')
  local kst_date=$(TZ='Asia/Seoul' date '+%Y년 %m월 %d일')

  # 한글 커밋 메시지 생성
  local msg="chore(ctb): 폴링 사이클 $cycle_num @ ${kst_time} KST ($kst_date) — ${stability_status}. "
  msg+="시스템 진행률: ${status}% | Phase2A=${phase2a} | Phase2B=${phase2b} | Phase2C=${phase2c} | 프로덕션=${vercel}"

  echo "$msg"
}

# Vercel 배포 검증 (P0 개선사항: 3회 연속 확인 + 오탐 방지)
verify_vercel_deployment() {
  log "🔍 Vercel 배포 검증 시작 (3회 연속 확인)..."

  local endpoints=(
    "https://dsc-fms-portal-audit.vercel.app"
    "https://dsc-fms-portal-discord.vercel.app"
    "https://dsc-fms-portal-bm.vercel.app"
    "https://dsc-fms-portal-travel.vercel.app"
  )

  local success_count=0
  local max_checks=3

  for check in $(seq 1 $max_checks); do
    log "📍 상태 확인 $check/$max_checks..."
    local check_healthy=true

    for endpoint in "${endpoints[@]}"; do
      http_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10 2>/dev/null || echo "000")
      if [[ "$http_code" != "200" ]]; then
        log "   ❌ $endpoint → HTTP $http_code"
        check_healthy=false
      else
        log "   ✅ $endpoint → HTTP 200"
      fi
    done

    if [[ "$check_healthy" == "true" ]]; then
      ((success_count++))
      log "✅ 확인 $check 성공 ($success_count/$max_checks)"
    else
      success_count=0
      log "⚠️  확인 $check 실패 (카운트 리셋)"
    fi

    if [[ $success_count -eq $max_checks ]]; then
      log "🎉 3회 연속 확인 성공 - 상태 변경 승인"
      return 0
    fi

    sleep 10  # 10초 대기 후 재확인
  done

  log "🔴 Vercel 배포 검증 실패 (3회 연속 성공 불가)"
  return 1
}

# 깃 커밋 실행
commit_ctb_status() {
  local msg="$1"

  # 작업 디렉토리 변경
  cd "$WORKSPACE_DIR" || {
    log "❌ 작업 디렉토리 접근 실패: $WORKSPACE_DIR"
    return 1
  }

  # 깃 설정 확인
  if ! git config user.email > /dev/null 2>&1; then
    git config user.name "System" || true
    git config user.email "system@localhost" || true
  fi

  # CTB 상태 파일 스테이징 (변경사항이 있을 경우)
  if git diff --quiet .ctb-state.json 2>/dev/null; then
    log "ℹ️  CTB 상태 변경 없음"
    return 0
  fi

  # 커밋 실행
  if git add .ctb-state.json && git commit -m "$msg" 2>/dev/null; then
    log "✅ 커밋 성공: $msg"

    # P0 개선사항: git push 후 Vercel 배포 검증
    log "🚀 git push 실행..."
    if git push origin main 2>/dev/null; then
      log "✅ git push 성공"
      verify_vercel_deployment || {
        log "🔴 Vercel 배포 검증 실패 - 수동 개입 필요"
        return 1
      }
    fi
    return 0
  else
    log "⚠️  커밋 실패 (변경사항 없음 또는 에러)"
    return 1
  fi
}

# 메인 루틴
main() {
  log "🔄 CTB 폴링 커밋 생성 시작..."

  # Phase 1: 규칙 상기 (Autonomous Proceed Rule 준수)
  log "📋 규칙 점검 실행 중..."
  bash "$WORKSPACE_DIR/memory-automation/rule-reminder.sh" >> "$LOG_FILE" 2>&1 || {
    log "⚠️  규칙 점검 실패 (계속 진행)"
  }

  # CTB 상태 읽기
  ctb_data=$(read_ctb_state) || {
    log "❌ CTB 상태 읽기 실패"
    return 1
  }

  # 한글 커밋 메시지 생성
  commit_msg=$(generate_korean_message "$ctb_data") || {
    log "❌ 메시지 생성 실패"
    return 1
  }

  log "생성된 메시지: $commit_msg"

  # 깃 커밋 실행
  commit_ctb_status "$commit_msg" || {
    log "❌ 커밋 실행 실패"
    return 1
  }

  log "✅ 폴링 커밋 완료"
}

main "$@"
exit $?
