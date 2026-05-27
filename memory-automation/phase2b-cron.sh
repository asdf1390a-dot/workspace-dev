#!/bin/bash
################################################################################
# Phase 2B Cron Job - Duplicate Detection (4시간 주기)
# 주기: 02:00, 06:00, 10:00, 14:00, 18:00, 22:00 KST
# 목적: 메모리 파일에서 중복 자동 감지 (3-layer: Pattern/Fuzzy/Semantic)
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
readonly PHASE2B_URL="${PHASE2B_URL:-http://localhost:3010}"
readonly TIMEOUT_SECS=180  # 3분
readonly MAX_RETRIES=3
readonly RETRY_DELAY=5

# 초기화
mkdir -p "$LOG_DIR"
readonly TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
readonly LOG_FILE="$LOG_DIR/phase2b-cron-$(date +%Y%m%d).log"
readonly ERROR_LOG="$LOG_DIR/phase2b-errors.log"
readonly DUPLICATES_LOG="$MEMORY_DIR/DUPLICATES_DETECTED_LOG.md"

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
    if curl -s -m 5 "$PHASE2B_URL/health" > /dev/null 2>&1; then
      log "INFO" "Phase 2B service is running ✓"
      return 0
    else
      if [[ $attempt -lt $MAX_RETRIES ]]; then
        log "WARN" "Health check attempt $attempt failed, retrying in ${RETRY_DELAY}s..."
        sleep "$RETRY_DELAY"
      fi
    fi
    ((attempt++))
  done

  log_error "Phase 2B service not responding after $MAX_RETRIES attempts"
  return 1
}

# 메모리 파일 수집
count_memory_files() {
  find "$MEMORY_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l
}

# 중복 감지 요청
detect_duplicates() {
  log "INFO" "Calling Phase 2B API for duplicate detection..."

  local payload="{\"memoryDir\": \"$MEMORY_DIR\"}"

  local response
  response=$(timeout $TIMEOUT_SECS curl -s -X POST "$PHASE2B_URL/api/detect-duplicates" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>/dev/null || echo '{"success": false, "error": "Request timeout or network error"}')

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

log "INFO" "========== Phase 2B Cron Job Start =========="
log "INFO" "Run ID: $(date +%s)"
log "INFO" "Memory Dir: $MEMORY_DIR"

# 1. 시작 전 확인
if [[ ! -d "$MEMORY_DIR" ]]; then
  log_error "Memory directory not found: $MEMORY_DIR"
  exit 1
fi

FILE_COUNT=$(count_memory_files)
log "INFO" "Found $FILE_COUNT memory files to analyze"

if [[ $FILE_COUNT -eq 0 ]]; then
  log "WARN" "No memory files found, skipping duplicate detection"
  exit 0
fi

log "INFO" "Step 1: Pre-flight checks passed ✓"

# 2. 헬스 체크
if ! check_health; then
  log_error "Cannot proceed without Phase 2B service"
  exit 1
fi

log "INFO" "Step 2: Service health check passed ✓"

# 3. 중복 감지 요청
RESPONSE=$(detect_duplicates)

# jq 사용 가능한지 확인
if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
  CLUSTERS=$(echo "$RESPONSE" | jq -r '.duplicateClusters | length // 0')
  EXEC_TIME=$(echo "$RESPONSE" | jq -r '.executionTime // 0')
  ERROR=$(echo "$RESPONSE" | jq -r '.error // ""')
  PROCESSED=$(echo "$RESPONSE" | jq -r '.entriesProcessed // 0')
else
  # jq 없으면 간단한 grep 사용
  SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' | wc -l)
  CLUSTERS=$(extract_json_value "$RESPONSE" "duplicateClusters")
  EXEC_TIME=$(extract_json_value "$RESPONSE" "executionTime")
  ERROR=$(extract_json_value "$RESPONSE" "error")
  PROCESSED=$(extract_json_value "$RESPONSE" "entriesProcessed")

  if [[ $SUCCESS -gt 0 ]]; then
    SUCCESS="true"
  else
    SUCCESS="false"
  fi
fi

# 4. 결과 처리
if [[ "$SUCCESS" == "true" ]]; then
  log "INFO" "✓ SUCCESS: Found $CLUSTERS duplicate clusters across $FILE_COUNT files in ${EXEC_TIME}ms"
  log "INFO" "Entries Processed: $PROCESSED"
  log "INFO" "Step 3: Duplicate detection completed ✓"

  # 마스터 로그 업데이트
  {
    echo ""
    echo "### $(date '+%Y-%m-%d %H:%M:%S') - Cron Run"
    echo "- **Status:** ✅ Success"
    echo "- **Files Scanned:** $FILE_COUNT"
    echo "- **Duplicate Clusters Found:** $CLUSTERS"
    echo "- **Entries Processed:** $PROCESSED"
    echo "- **Processing Time:** ${EXEC_TIME}ms"
    echo ""
  } >> "$DUPLICATES_LOG" 2>/dev/null || true

  # 타임스탬프 기록
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2B run succeeded - $CLUSTERS clusters found" >> "$LOG_FILE"

  log "INFO" "========== Phase 2B Cron Job End =========="
  exit 0
else
  log_error "Step 3: Duplicate detection failed"
  log_error "Error: $ERROR"
  log_error "Response: $RESPONSE"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2B run failed - $ERROR" >> "$ERROR_LOG"

  # 마스터 로그 업데이트
  {
    echo ""
    echo "### $(date '+%Y-%m-%d %H:%M:%S') - Cron Run (FAILED)"
    echo "- **Status:** ❌ Failed"
    echo "- **Files Scanned:** $FILE_COUNT"
    echo "- **Error:** $ERROR"
    echo ""
  } >> "$DUPLICATES_LOG" 2>/dev/null || true

  log "INFO" "========== Phase 2B Cron Job End (FAILED) =========="
  exit 1
fi
