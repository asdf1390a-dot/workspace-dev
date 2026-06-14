#!/bin/bash
################################################################################
# Cron Job Retry Wrapper (P2 개선사항)
# 역할: 모든 cron job에 에러 처리 및 자동 재시도 기능 제공
#
# 사용법:
#   bash cron-retry-wrapper.sh "script-name" "command to run"
#
# 기능:
#   - 최대 3회 자동 재시도
#   - 각 시도 사이 5초 대기
#   - 최종 실패시 로그 기록
#   - 성공 시 상태 업데이트
#
# 2026-06-15 추가: Cron 안정화 시스템
################################################################################

set -uo pipefail

SCRIPT_NAME="${1:-unknown}"
COMMAND="${2:-}"
WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
MEMORY_DIR="$WORKSPACE_DIR/memory"
LOG_FILE="$MEMORY_DIR/logs/cron-retry-wrapper.log"
MAX_RETRIES=3
RETRY_DELAY=5

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  local msg="$1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

# 명령 실행 및 재시도
run_with_retry() {
  local script="$1"
  local max_tries="$2"
  local attempt=1

  log "🔄 [$script] 시작 (시도 1/$max_tries)..."

  while [[ $attempt -le $max_tries ]]; do
    log "📌 [$script] 시도 $attempt/$max_tries 실행..."

    # 명령 실행
    if bash "$script" >> "$LOG_FILE" 2>&1; then
      log "✅ [$script] 성공 (시도 $attempt/$max_tries)"
      return 0
    else
      local exit_code=$?
      log "⚠️  [$script] 실패 (종료코드: $exit_code)"

      if [[ $attempt -lt $max_tries ]]; then
        log "⏳ [$script] ${RETRY_DELAY}초 대기 후 재시도..."
        sleep "$RETRY_DELAY"
      fi
    fi

    ((attempt++))
  done

  log "❌ [$script] 최종 실패 (3회 모두 실패)"
  return 1
}

# 메인 루틴
main() {
  if [[ -z "$COMMAND" ]]; then
    log "❌ 사용법: cron-retry-wrapper.sh <script-name> <command>"
    exit 1
  fi

  log "═══════════════════════════════════════════════════"
  log "🔄 Cron 재시도 래퍼 시작 [$SCRIPT_NAME]"
  log "═══════════════════════════════════════════════════"

  run_with_retry "$COMMAND" "$MAX_RETRIES" || {
    # 최종 실패시 알림 (필요시 추가 처리)
    log "🚨 [$SCRIPT_NAME] 최종 실패 - 수동 확인 필요"
    return 1
  }

  log "═══════════════════════════════════════════════════"
  log "✅ Cron 재시도 래퍼 완료 [$SCRIPT_NAME]"
  log "═══════════════════════════════════════════════════"
}

main "$@"
exit $?
