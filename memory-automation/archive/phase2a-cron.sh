#!/bin/bash
################################################################################
# Phase 2A Cron Job - Message Collection (6시간 주기)
# 주기: 00:00, 06:00, 12:00, 18:00 KST
# 목적: 로컬 메모리 파일에서 메시지 자동 수집 (MEMORY.md + memory/*.md)
#
# 작성: Automation Specialist
# 버전: 2.0 (로컬 파일 기반으로 재설계)
# 최종 수정: 2026-05-29
################################################################################

set -euo pipefail

# 설정값
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEMORY_DIR="${MEMORY_DIR:-/home/jeepney/.openclaw/workspace-dev/memory}"
readonly LOG_DIR="${MEMORY_DIR}/logs"
readonly COLLECTOR_SCRIPT="${SCRIPT_DIR}/phase2a-local-collector.js"

# 초기화
mkdir -p "$LOG_DIR"
readonly LOG_FILE="$LOG_DIR/phase2a-cron-$(date +%Y%m%d).log"
readonly ERROR_LOG="$LOG_DIR/phase2a-errors.log"

################################################################################
# 함수 정의
################################################################################

# 로깅 함수
log() {
  local level="$1"
  shift
  local msg="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $msg" | tee -a "$LOG_FILE"
}

# 오류 로깅
log_error() {
  local msg="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [ERROR] $msg" | tee -a "$ERROR_LOG" >&2
}

################################################################################
# 메인 로직
################################################################################

log "INFO" "========== Phase 2A Cron Job Start =========="
log "INFO" "Run ID: $(date +%s)"
log "INFO" "Memory Dir: $MEMORY_DIR"
log "INFO" "Collector: $COLLECTOR_SCRIPT"

# 1. 시작 전 확인
if [[ ! -d "$MEMORY_DIR" ]]; then
  log_error "Memory directory not found: $MEMORY_DIR"
  exit 1
fi

if [[ ! -f "$COLLECTOR_SCRIPT" ]]; then
  log_error "Collector script not found: $COLLECTOR_SCRIPT"
  exit 1
fi

log "INFO" "Step 1: Pre-flight checks passed ✓"

# 2. 메시지 수집 실행
log "INFO" "Step 2: Running local message collector..."

if MEMORY_DIR="$MEMORY_DIR" node "$COLLECTOR_SCRIPT"; then
  log "INFO" "✓ SUCCESS: Local message collection completed"
  log "INFO" "Step 3: Message collection completed ✓"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2A run succeeded" >> "$LOG_FILE"

  log "INFO" "========== Phase 2A Cron Job End =========="
  exit 0
else
  log_error "Step 2: Local message collection failed (exit code: $?)"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2A run failed - see error log for details" >> "$ERROR_LOG"

  log "INFO" "========== Phase 2A Cron Job End (FAILED) =========="
  exit 1
fi
