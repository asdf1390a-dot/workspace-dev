#!/bin/bash
################################################################################
# 다중채널 검증 게이트 (Phase 2 개선안 #3)
# 역할: 상태 변경 보고 전 3개 채널 일치 검증
#
# 규칙:
#   - HEALTHY 전환: 3회 연속 일치 필요 (보수적)
#   - DOWN 전환: 1회 확인 가능 (빠른 대응)
#   - Voting logic: 3채널 다수결
#
# 2026-06-16 18:00 KST 배포 (개선안 #3)
################################################################################

set -uo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
LOG_FILE="$WORKSPACE_DIR/memory/logs/multi-channel-verification.log"
VERIFICATION_STATE="$WORKSPACE_DIR/.verification-state.json"

mkdir -p "$(dirname "$LOG_FILE")"

# 로그 함수
log() {
  local msg="$1"
  echo "[$(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S KST')] $msg" >> "$LOG_FILE"
}

# 채널 1: 자동 모니터링 신호 (CTB 폴링 결과)
check_channel_1_ctb() {
  log "📡 Channel 1: CTB 폴링 신호 확인..."

  local endpoints=(
    "https://dsc-fms-portal.vercel.app"
    "https://dsc-audit-p1.vercel.app"
    "https://dsc-discord-bot-p1.vercel.app"
    "https://dsc-travel-p2-ui.vercel.app"
  )

  local healthy_count=0
  for endpoint in "${endpoints[@]}"; do
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10 2>/dev/null || echo "000")
    if [[ "$http_code" == "200" ]]; then
      ((healthy_count++))
    fi
  done

  if [[ $healthy_count -eq 4 ]]; then
    echo "HEALTHY"
    log "  ✅ Channel 1: HEALTHY (4/4 endpoints OK)"
    return 0
  else
    echo "DOWN"
    log "  ❌ Channel 1: DOWN ($healthy_count/4 endpoints OK)"
    return 1
  fi
}

# 채널 2: 수동 curl 테스트 (3회 연속)
check_channel_2_manual() {
  log "📡 Channel 2: 수동 curl 테스트 (3회 연속)..."

  local endpoints=(
    "https://dsc-fms-portal.vercel.app"
    "https://dsc-audit-p1.vercel.app"
    "https://dsc-discord-bot-p1.vercel.app"
    "https://dsc-travel-p2-ui.vercel.app"
  )

  local success_count=0
  for check in 1 2 3; do
    local all_healthy=true

    for endpoint in "${endpoints[@]}"; do
      local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10 2>/dev/null || echo "000")
      if [[ "$http_code" != "200" ]]; then
        all_healthy=false
        break
      fi
    done

    if [[ "$all_healthy" == "true" ]]; then
      ((success_count++))
      log "  ✅ 확인 $check/3: HEALTHY"
    else
      log "  ❌ 확인 $check/3: DOWN (카운트 리셋)"
      success_count=0
    fi

    sleep 10  # 10초 간격
  done

  if [[ $success_count -eq 3 ]]; then
    echo "HEALTHY"
    log "  ✅ Channel 2: HEALTHY (3회 연속 일치)"
    return 0
  else
    echo "DOWN"
    log "  ❌ Channel 2: DOWN (3회 연속 불가)"
    return 1
  fi
}

# 채널 3: 로그 이력 확인 (상태 변화 일관성)
check_channel_3_logs() {
  log "📡 Channel 3: 로그 이력 검증..."

  local recent_log="$WORKSPACE_DIR/memory/logs/ctb-polling-commit.log"

  if [[ ! -f "$recent_log" ]]; then
    log "  ⚠️  로그 파일 없음"
    echo "UNKNOWN"
    return 2
  fi

  # 마지막 5개 항목에서 상태 패턴 분석
  local last_5_states=$(tail -5 "$recent_log" | grep -o "HEALTHY\|DOWN\|HTTP [0-9]*" | tail -5 || echo "")

  # 모두 일치하는지 확인
  local unique_states=$(echo "$last_5_states" | sort | uniq | wc -l)

  if [[ $unique_states -le 1 ]]; then
    echo "HEALTHY"
    log "  ✅ Channel 3: HEALTHY (로그 일관성 확인)"
    return 0
  else
    echo "DOWN"
    log "  ❌ Channel 3: DOWN (로그 불일치 감지: $unique_states 가지 상태)"
    return 1
  fi
}

# Voting logic: 다중 검증 결과 통합
verify_by_voting() {
  log ""
  log "🗳️  Voting Logic 실행..."

  # 각 채널 확인
  local channel1=$(check_channel_1_ctb)
  local channel2=$(check_channel_2_manual)
  local channel3=$(check_channel_3_logs)

  log ""
  log "📊 Voting 결과:"
  log "  Channel 1 (CTB): $channel1"
  log "  Channel 2 (Manual): $channel2"
  log "  Channel 3 (Logs): $channel3"

  # 다수결 계산
  local healthy_votes=0
  local down_votes=0
  local unknown_votes=0

  [[ "$channel1" == "HEALTHY" ]] && ((healthy_votes++)) || ((down_votes++))
  [[ "$channel2" == "HEALTHY" ]] && ((healthy_votes++)) || ((down_votes++))

  if [[ "$channel3" == "HEALTHY" ]]; then
    ((healthy_votes++))
  elif [[ "$channel3" == "DOWN" ]]; then
    ((down_votes++))
  else
    ((unknown_votes++))
  fi

  log ""
  log "📈 투표 결과: HEALTHY=$healthy_votes | DOWN=$down_votes | UNKNOWN=$unknown_votes"

  # 결정 규칙
  if [[ $healthy_votes -ge 2 ]] && [[ $down_votes -eq 0 ]]; then
    log "✅ 결정: HEALTHY (승인)"
    echo "HEALTHY"
    return 0
  elif [[ $healthy_votes -eq 0 ]] && [[ $down_votes -ge 1 ]]; then
    log "⚠️  결정: DOWN (빠른 대응)"
    echo "DOWN"
    return 1
  else
    log "❓ 결정: UNCERTAIN (수동 검증 필요)"
    echo "UNCERTAIN"
    return 2
  fi
}

# 상태 변경 승인 게이트
approve_status_change() {
  local new_status="$1"
  local current_status="$2"

  # 상태 변경 없으면 통과
  if [[ "$new_status" == "$current_status" ]]; then
    log "✅ 상태 변경 없음 (승인 자동 통과)"
    return 0
  fi

  log ""
  log "🚨 상태 변경 감지: $current_status → $new_status"

  # HEALTHY로의 전환: 보수적 검증 필요
  if [[ "$new_status" == "HEALTHY" ]]; then
    log "📋 게이트 #1: HEALTHY 전환 (3회 연속 일치 필요)..."

    for check in 1 2 3; do
      local status=$(verify_by_voting)
      if [[ "$status" != "HEALTHY" ]]; then
        log "❌ 게이트 #1 실패: $check/3 failed"
        return 1
      fi
      log "✅ 게이트 #1 통과: $check/3"
    done

    log "✅ HEALTHY 전환 승인"
    return 0
  fi

  # DOWN으로의 전환: 빠른 대응 허용
  if [[ "$new_status" == "DOWN" ]]; then
    log "📋 게이트 #2: DOWN 전환 (1회 확인)..."

    local status=$(verify_by_voting)
    if [[ "$status" == "DOWN" ]]; then
      log "✅ DOWN 전환 승인"
      return 0
    else
      log "❌ 게이트 #2 실패: 상태 불일치"
      return 1
    fi
  fi

  log "❌ 알 수 없는 상태 전환"
  return 1
}

# 상태 저장
save_verification_state() {
  local status="$1"

  cat > "$VERIFICATION_STATE" <<EOF
{
  "status": "$status",
  "timestamp": "$(TZ='Asia/Seoul' date -u +%s)",
  "last_verified": "$(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S KST')",
  "verified": true
}
EOF

  log "💾 검증 상태 저장: $status"
}

# Main
main() {
  log "================================================================"
  log "🎯 다중채널 검증 게이트 시작 (Phase 2 #3)"
  log "================================================================"

  # 기존 상태 읽기
  local current_status="DOWN"
  if [[ -f "$VERIFICATION_STATE" ]]; then
    current_status=$(cat "$VERIFICATION_STATE" | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "DOWN")
  fi

  # 검증 실행
  local new_status=$(verify_by_voting)

  log ""
  log "📋 최종 검증 결과: $new_status"

  # 상태 변경 승인 확인
  if approve_status_change "$new_status" "$current_status"; then
    save_verification_state "$new_status"
    log "✅ 검증 완료: 상태 변경 승인"
    exit 0
  else
    log "❌ 검증 실패: 상태 변경 거부"
    log "⚠️  관리자 수동 검증 필요"
    exit 1
  fi
}

# 커맨드라인 인자로 실행 방식 결정
if [[ "${1:-}" == "verify" ]]; then
  main
elif [[ "${1:-}" == "channel-1" ]]; then
  check_channel_1_ctb
elif [[ "${1:-}" == "channel-2" ]]; then
  check_channel_2_manual
elif [[ "${1:-}" == "channel-3" ]]; then
  check_channel_3_logs
elif [[ "${1:-}" == "vote" ]]; then
  verify_by_voting
else
  echo "Usage: $0 {verify|channel-1|channel-2|channel-3|vote}"
  exit 1
fi
