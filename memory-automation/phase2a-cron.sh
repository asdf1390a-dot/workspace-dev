#!/bin/bash
################################################################################
# Phase 2A Cron Job - Message Collection (6시간 주기)
# 주기: 00:00, 06:00, 12:00, 18:00 KST
# 목적: Telegram, Discord, GitHub에서 메시지 자동 수집
#
# 작성: Automation Specialist
# 버전: 1.0
# 최종 수정: 2026-05-28
################################################################################

set -euo pipefail

# 설정값
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MEMORY_DIR="${MEMORY_DIR:-/home/jeepney/.openclaw/workspace-dev/memory}"
readonly LOG_DIR="${MEMORY_DIR}/logs"
readonly PHASE2A_URL="${PHASE2A_URL:-http://localhost:3009}"
readonly TIMEOUT_SECS=300  # 5분
readonly MAX_RETRIES=3
readonly RETRY_DELAY=5

# 초기화
mkdir -p "$LOG_DIR"
readonly TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
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

# 상태 확인
check_health() {
  local attempt=1
  while [[ $attempt -le $MAX_RETRIES ]]; do
    if curl -s -m 5 "$PHASE2A_URL/health" > /dev/null 2>&1; then
      log "INFO" "Phase 2A service is running ✓"
      return 0
    else
      if [[ $attempt -lt $MAX_RETRIES ]]; then
        log "WARN" "Health check attempt $attempt failed, retrying in ${RETRY_DELAY}s..."
        sleep "$RETRY_DELAY"
      fi
    fi
    ((attempt++))
  done

  log_error "Phase 2A service not responding after $MAX_RETRIES attempts"
  return 1
}

# 메시지 수집 요청
collect_messages() {
  log "INFO" "Requesting message collection from Phase 2A..."

  local response
  response=$(timeout $TIMEOUT_SECS curl -s -X POST "$PHASE2A_URL/api/collect-messages" \
    -H "Content-Type: application/json" \
    -d '{"sessionKey":"main","limit":100}' 2>/dev/null || echo '{"success": false, "error": "Request timeout or network error"}')

  echo "$response"
}

# JSON 파싱 (jq 없는 경우 대비)
extract_json_value() {
  local json="$1"
  local key="$2"
  echo "$json" | grep -o "\"$key\":[^,}]*" | cut -d':' -f2- | tr -d ' "' || echo "unknown"
}

################################################################################
# 메인 로직
################################################################################

log "INFO" "========== Phase 2A Cron Job Start =========="
log "INFO" "Run ID: $(date +%s)"
log "INFO" "Memory Dir: $MEMORY_DIR"

# 1. 시작 전 확인
if [[ ! -d "$MEMORY_DIR" ]]; then
  log_error "Memory directory not found: $MEMORY_DIR"
  exit 1
fi

log "INFO" "Step 1: Pre-flight checks passed ✓"

# 2. 헬스 체크
if ! check_health; then
  log_error "Cannot proceed without Phase 2A service"
  exit 1
fi

log "INFO" "Step 2: Service health check passed ✓"

# 3. 메시지 수집
RESPONSE=$(collect_messages)

# jq 사용 가능한지 확인
if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
  MESSAGES=$(echo "$RESPONSE" | jq -r '.count // 0')
  ERROR=$(echo "$RESPONSE" | jq -r '.error // ""')
  COLLECTED_AT=$(echo "$RESPONSE" | jq -r '.collectedAt // "unknown"')
else
  # jq 없으면 간단한 grep 사용
  SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' | wc -l)
  MESSAGES=$(extract_json_value "$RESPONSE" "count")
  ERROR=$(extract_json_value "$RESPONSE" "error")
  COLLECTED_AT="unknown"

  if [[ $SUCCESS -gt 0 ]]; then
    SUCCESS="true"
  else
    SUCCESS="false"
  fi
fi

# 4. 결과 처리
if [[ "$SUCCESS" == "true" ]]; then
  log "INFO" "✓ SUCCESS: $MESSAGES messages collected"
  log "INFO" "Collected at: $COLLECTED_AT"
  log "INFO" "Step 3: Message collection completed ✓"

  # 타임스탬프 기록
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2A run succeeded - $MESSAGES messages" >> "$LOG_FILE"

  log "INFO" "========== Phase 2A Cron Job End =========="
  exit 0
else
  log_error "Step 3: Message collection failed"
  [[ -n "$ERROR" ]] && log_error "Error: $ERROR"
  log_error "Response: $RESPONSE"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2A run failed - $ERROR" >> "$ERROR_LOG"

  log "INFO" "========== Phase 2A Cron Job End (FAILED) =========="
  exit 1
fi
