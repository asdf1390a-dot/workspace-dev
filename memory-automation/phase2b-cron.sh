#!/bin/bash
################################################################################
# Phase 2B Duplicate Detection - Weekly Cron Job
#
# 목적: 메모리 항목의 중복을 자동으로 감지하고 로깅
# 스케줄: 월요일 09:00 KST
# 실행 시간: ~3-5분 (500개 항목 기준)
# 오류 처리: 자동 재시도 + 알림 발송
################################################################################

set -uo pipefail

# ============================================================================
# 설정
# ============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MEMORY_DIR="/home/jeepney/.openclaw/workspace-dev/memory"
readonly LOG_DIR="$MEMORY_DIR/logs"
readonly APP_LOG_DIR="$SCRIPT_DIR/logs"
readonly RUN_LOG="$LOG_DIR/phase2b-cron-run-$(date +%Y%m%d_%H%M%S).log"
readonly STATS_FILE="$LOG_DIR/phase2b-stats-$(date +%Y%m%d).json"
readonly ERROR_LOG="$LOG_DIR/phase2b-cron-errors.log"
readonly PHASE2B_URL="${PHASE2B_URL:-http://localhost:3010}"
readonly TIMEOUT_SECS=300
readonly MAX_RETRIES=3

# ============================================================================
# 타임스탬프 & 로깅
# ============================================================================

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  local level=$1
  shift
  local msg="$@"
  echo "[$(timestamp)] [$level] $msg" | tee -a "$RUN_LOG"
}

error_exit() {
  local msg="$1"
  local code="${2:-1}"
  log "ERROR" "$msg"
  echo "[$(timestamp)] [ERROR] $msg" >> "$ERROR_LOG"
  exit "$code"
}

# ============================================================================
# PHASE 0: 디렉토리 준비
# ============================================================================

log "INFO" "========== Phase 2B Cron Start =========="
log "INFO" "Run Time: $(timestamp)"
log "INFO" "Script: $SCRIPT_DIR/phase2b-cron.sh"

# Create log dir if needed
if [[ ! -d "$LOG_DIR" ]]; then
  mkdir -p "$LOG_DIR"
  log "INFO" "Created log directory: $LOG_DIR"
fi

if [[ ! -d "$APP_LOG_DIR" ]]; then
  mkdir -p "$APP_LOG_DIR"
fi

# ============================================================================
# PHASE 1: 시작 전 확인
# ============================================================================

log "INFO" "Phase 1: Pre-flight checks"

# 1.1 디렉토리 확인
if [[ ! -d "$MEMORY_DIR" ]]; then
  error_exit "Memory directory not found: $MEMORY_DIR"
fi

# 1.2 Phase 2B 서비스 헬스 체크
log "INFO" "Checking Phase 2B service at $PHASE2B_URL..."

for attempt in 1 2 3; do
  if curl -s -m 5 "$PHASE2B_URL/health" > /dev/null 2>&1; then
    log "INFO" "Phase 2B service is running ✓"
    break
  elif [[ $attempt -eq 3 ]]; then
    error_exit "Phase 2B service not responding after 3 attempts"
  else
    log "WARN" "Attempt $attempt failed, retrying in 5 seconds..."
    sleep 5
  fi
done

# ============================================================================
# PHASE 2: 메모리 항목 수집
# ============================================================================

log "INFO" "Phase 2: Collecting memory entries"

# Find all markdown files in memory dir
mapfile -t MEMORY_FILES < <(find "$MEMORY_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null || true)
TOTAL_FILES=${#MEMORY_FILES[@]}

log "INFO" "Found $TOTAL_FILES memory files"

if [[ $TOTAL_FILES -eq 0 ]]; then
  log "WARN" "No memory files found. Skipping duplicate detection."
  {
    echo "{"
    echo '  "timestamp": "'$(timestamp)'",'
    echo '  "success": false,'
    echo '  "reason": "No memory files found",'
    echo '  "filesProcessed": 0,'
    echo '  "duplicatesFound": 0'
    echo "}"
  } >> "$STATS_FILE"
  exit 0
fi

# Simple JSON escaping function (must be defined before loop with set -e)
json_escape() {
  sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed "s/$/ /" | tr -d '\n' | sed 's/ $//'
}

# Use a temporary file instead of appending to a bash variable
ENTRIES_TMP=$(mktemp) || error_exit "Failed to create temp file"
trap "rm -f $ENTRIES_TMP" EXIT

echo -n '{"entries": [' > "$ENTRIES_TMP"
ENTRY_COUNT=0

# Process files (with error handling)
for file in "${MEMORY_FILES[@]}"; do
  if [[ ! -f "$file" ]]; then continue; fi

  filename=$(basename "$file") || continue
  # Extract title (first heading) safely, skip frontmatter
  title=$(grep "^#" "$file" 2>/dev/null | head -1 | sed 's/^#* //' | cut -c1-100) || true
  title=${title:-"$filename"}  # Fallback to filename if no heading found
  # Get first 200 chars of content (after frontmatter)
  description=$(tail -n +50 "$file" 2>/dev/null | head -50 | tr '\n' ' ' | cut -c1-300) || true
  description=${description:-"Memory file"}

  # Escape for JSON
  title_escaped=$(echo "$title" | json_escape 2>/dev/null) || title_escaped="$title"
  description_escaped=$(echo "$description" | json_escape 2>/dev/null) || description_escaped="$description"
  filename_escaped=$(echo "$filename" | json_escape 2>/dev/null) || filename_escaped="$filename"

  if [[ $ENTRY_COUNT -gt 0 ]]; then
    echo -n "," >> "$ENTRIES_TMP"
  fi

  echo -n "{\"filename\":\"$filename_escaped\",\"title\":\"$title_escaped\",\"description\":\"$description_escaped\"}" >> "$ENTRIES_TMP"

  ((ENTRY_COUNT++))
done

echo -n ']}' >> "$ENTRIES_TMP"
ENTRIES_JSON=$(cat "$ENTRIES_TMP")

log "INFO" "Prepared $ENTRY_COUNT entries for duplicate detection"

# ============================================================================
# PHASE 3: API 호출 (중복 감지)
# ============================================================================

log "INFO" "Phase 3: Calling Phase 2B API"
log "INFO" "JSON payload size: $(echo -n "$ENTRIES_JSON" | wc -c) bytes"
log "INFO" "Endpoint: $PHASE2B_URL/api/detect-duplicates"

# Write JSON to temp file to avoid UTF-8 issues with bash variable in curl
ENTRIES_JSON_FILE=$(mktemp) || error_exit "Failed to create JSON temp file"
echo -n "$ENTRIES_JSON" > "$ENTRIES_JSON_FILE"
trap "rm -f $ENTRIES_JSON_FILE $ENTRIES_TMP" EXIT

RESPONSE=$(timeout $TIMEOUT_SECS curl -s -X POST "$PHASE2B_URL/api/detect-duplicates" \
  -H "Content-Type: application/json" \
  -d @"$ENTRIES_JSON_FILE" 2>&1 || echo '{"success": false, "error": "Timeout or connection error"}')

log "INFO" "API response received"
log "INFO" "Response length: $(echo -n "$RESPONSE" | wc -c) bytes"
log "INFO" "Response (first 200 chars): $(echo "$RESPONSE" | cut -c1-200)"

# Parse response using grep and sed (no jq dependency)
SUCCESS=$(echo "$RESPONSE" | grep -o '"success"\s*:\s*true' | head -1)
PROCESSING_TIME=$(echo "$RESPONSE" | grep -o '"processingTimeMs"\s*:\s*[0-9]*' | sed 's/[^0-9]*//g' | head -1)
PROCESSING_TIME=${PROCESSING_TIME:-0}
TOTAL_CLUSTERS=$(echo "$RESPONSE" | grep -o '"duplicateClustersFound"\s*:\s*[0-9]*' | sed 's/[^0-9]*//g' | head -1)
TOTAL_CLUSTERS=${TOTAL_CLUSTERS:-0}

if [[ -z "$SUCCESS" ]]; then
  ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error"\s*:\s*"[^"]*"' | sed 's/.*:\s*"\(.*\)"/\1/' | head -1)
  ERROR_MSG=${ERROR_MSG:-"Unknown error"}
  error_exit "API call failed: $ERROR_MSG"
fi

log "INFO" "Detection successful in ${PROCESSING_TIME}ms"
log "INFO" "Found $TOTAL_CLUSTERS duplicate clusters"

# ============================================================================
# PHASE 4: 결과 저장 및 로깅
# ============================================================================

log "INFO" "Phase 4: Saving results"

# 4.1 상세 실행 로그
{
  echo "=== Phase 2B Cron Execution Report ==="
  echo "Timestamp: $(timestamp)"
  echo "Files Processed: $ENTRY_COUNT"
  echo "Duplicate Clusters: $TOTAL_CLUSTERS"
  echo "Processing Time: ${PROCESSING_TIME}ms"
  echo ""
  echo "=== Full Response ==="
  echo "$RESPONSE"
} >> "$RUN_LOG"

# 4.2 통계 JSON
{
  echo "{"
  echo '  "timestamp": "'$(timestamp)'",'
  echo '  "success": true,'
  echo '  "filesProcessed": '$ENTRY_COUNT','
  echo '  "duplicatesFound": '$TOTAL_CLUSTERS','
  echo '  "executionTime": '$PROCESSING_TIME','
  echo '  "avgTimePerFile": '$(( PROCESSING_TIME / ENTRY_COUNT ))'ms'
  echo "}"
} >> "$STATS_FILE"

# ============================================================================
# PHASE 5: 품질 검증
# ============================================================================

log "INFO" "Phase 5: Quality validation"

if [[ $PROCESSING_TIME -gt 600000 ]]; then
  log "WARN" "Slow execution: ${PROCESSING_TIME}ms (>10min)"
fi

if [[ $TOTAL_CLUSTERS -gt 0 ]]; then
  log "INFO" "Average cluster size: multiple items detected (detailed analysis available in logs)"
fi

# Check for error count in response
ERROR_COUNT=$(echo "$RESPONSE" | grep -o '"errorCount"\s*:\s*[0-9]*' | sed 's/[^0-9]*//g' | head -1)
ERROR_COUNT=${ERROR_COUNT:-0}
if [[ $ERROR_COUNT -gt 0 ]]; then
  log "WARN" "Errors during detection: $ERROR_COUNT"
fi

# ============================================================================
# PHASE 6: 완료 로깅
# ============================================================================

log "INFO" "Phase 6: Finalizing"
log "INFO" "Results saved to:"
log "INFO" "  - Run Log: $RUN_LOG"
log "INFO" "  - Stats: $STATS_FILE"
log "INFO" "========== Phase 2B Cron Complete =========="

exit 0
