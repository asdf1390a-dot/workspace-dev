#!/bin/bash
################################################################################
# P1-A 로컬 버전: GitHub Actions 필요 없음 (Cron job으로 5분 주기 실행)
# GitHub 토큰 필요 없음 - 순수 로컬 자동화
################################################################################

set -uo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
LOG_FILE="$WORKSPACE_DIR/memory/logs/local-p1-monitor.log"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# P1 엔드포인트 3회 연속 확인
check_p1_endpoints() {
  local endpoints=(
    "https://dsc-fms-portal-audit.vercel.app"
    "https://dsc-fms-portal-discord.vercel.app"
    "https://dsc-fms-portal-bm.vercel.app"
    "https://dsc-fms-portal-travel.vercel.app"
  )

  local names=(
    "AUDIT-P1"
    "DISCORD-BOT-P1"
    "BM-P1"
    "TRAVEL-P2-UI"
  )

  local success_count=0
  local max_checks=3
  local overall_healthy=0
  local overall_down=0

  log "🔍 P1 엔드포인트 3회 연속 확인 시작..."

  for check in $(seq 1 $max_checks); do
    log "📍 확인 $check/$max_checks..."
    local check_healthy=true
    local healthy_this_check=0
    local down_this_check=0

    for i in "${!endpoints[@]}"; do
      endpoint="${endpoints[$i]}"
      name="${names[$i]}"
      http_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10 2>/dev/null || echo "000")

      if [[ "$http_code" == "200" ]]; then
        log "   ✅ $name → HTTP 200"
        ((healthy_this_check++))
      else
        log "   ❌ $name → HTTP $http_code"
        check_healthy=false
        ((down_this_check++))
      fi
    done

    if [[ "$check_healthy" == "true" ]]; then
      ((success_count++))
      log "✅ 확인 $check 성공 ($success_count/$max_checks)"
      overall_healthy=$healthy_this_check
    else
      success_count=0
      log "⚠️  확인 $check 실패 (카운트 리셋)"
      overall_down=$down_this_check
    fi

    if [[ $success_count -eq $max_checks ]]; then
      log "🎉 3회 연속 확인 성공 - 상태 변경 승인"
      log "📊 최종 상태: 4/4 UP (HEALTHY)"
      return 0
    fi

    if [[ $check -lt $max_checks ]]; then
      sleep 10  # 10초 대기
    fi
  done

  log "🔴 P1 엔드포인트 3회 연속 확인 실패"
  log "📊 최종 상태: $overall_down/4 DOWN (UNHEALTHY)"
  return 1
}

# Discord 알림 (선택사항 - secrets 필요)
send_discord_alert() {
  local webhook_url="${DISCORD_WEBHOOK_URL:-}"

  if [[ -z "$webhook_url" ]]; then
    log "⚠️  DISCORD_WEBHOOK_URL 미설정 (알림 스킵)"
    return 0
  fi

  log "📢 Discord 알림 전송 중..."

  curl -s -X POST "$webhook_url" \
    -H 'Content-Type: application/json' \
    -d '{
      "text": "🔴 P1 엔드포인트 DOWN 감지",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*P1 로컬 모니터링 알림*\n\n4개 P1 엔드포인트 중 일부가 다운됨\n\n• AUDIT-P1: 404\n• DISCORD-BOT-P1: 404\n• BM-P1: 404\n• TRAVEL-P2-UI: 404\n\n[자동 복구 진행 중... 수동 개입 필요할 수 있음]"
          }
        }
      ]
    }' > /dev/null

  log "✅ Discord 알림 완료"
}

# Git 커밋 (상태 기록)
commit_status() {
  local status="$1"

  cd "$WORKSPACE_DIR" || return 1

  git config user.name "P1-Local-Monitor" 2>/dev/null || true
  git config user.email "p1-local@localhost" 2>/dev/null || true

  cat > p1_local_monitor_result.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "$status",
  "monitor_type": "local_cron",
  "check_time": "$(date '+%Y-%m-%d %H:%M:%S %Z')"
}
EOF

  if ! git diff --quiet p1_local_monitor_result.json 2>/dev/null; then
    git add p1_local_monitor_result.json 2>/dev/null || true
    git commit -m "🟢 P1 로컬 모니터링: $status ($(date '+%H:%M %Z'))" 2>/dev/null || true
  fi
}

# 메인 루틴
main() {
  log "🔄 P1 로컬 모니터링 시작 (GitHub 토큰 불필요)..."

  if check_p1_endpoints; then
    log "✅ P1 엔드포인트 정상"
    commit_status "HEALTHY"
    exit 0
  else
    log "❌ P1 엔드포인트 장애"
    commit_status "UNHEALTHY"
    send_discord_alert  # 선택사항
    exit 1
  fi
}

main "$@"
