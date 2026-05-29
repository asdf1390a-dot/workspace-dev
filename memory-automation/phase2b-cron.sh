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
readonly TIMEOUT_SECS=180  # 3분
readonly MAX_RETRIES=1
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

# 배치 프로세서 실행
run_batch_processor() {
  log "INFO" "Starting Phase 2B batch processor..."

  if [[ ! -f "${SCRIPT_DIR}/phase2b-duplicate-detection.js" ]]; then
    log_error "phase2b-duplicate-detection.js not found"
    return 1
  fi

  timeout $TIMEOUT_SECS node "${SCRIPT_DIR}/phase2b-duplicate-detection.js" 2>&1 | tee -a "$LOG_FILE"
  local exit_code=$?

  if [[ $exit_code -eq 0 ]]; then
    log "INFO" "Phase 2B batch processor completed successfully ✓"
    return 0
  else
    log_error "Phase 2B batch processor failed with exit code $exit_code"
    return 1
  fi
}

# 메모리 파일 수집
count_memory_files() {
  find "$MEMORY_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l
}

# 중복 감지 결과 검증
verify_duplicates_result() {
  if [[ ! -f "${MEMORY_DIR}/messages_deduplicated.jsonl" ]]; then
    log_error "Output file not created: messages_deduplicated.jsonl"
    return 1
  fi

  local output_lines=$(wc -l < "${MEMORY_DIR}/messages_deduplicated.jsonl")
  log "INFO" "Output file created with $output_lines entries"
  return 0
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

# 2. 배치 프로세서 실행
if ! run_batch_processor; then
  log_error "Step 2: Batch processor execution failed"

  {
    echo ""
    echo "### $(date '+%Y-%m-%d %H:%M:%S') - Cron Run (FAILED)"
    echo "- **Status:** ❌ Failed"
    echo "- **Files Scanned:** $FILE_COUNT"
    echo "- **Error:** Batch processor failed"
    echo ""
  } >> "$DUPLICATES_LOG" 2>/dev/null || true

  log "INFO" "========== Phase 2B Cron Job End (FAILED) =========="
  exit 1
fi

log "INFO" "Step 2: Batch processor execution passed ✓"

# 3. 결과 검증
if ! verify_duplicates_result; then
  log_error "Step 3: Result verification failed"

  {
    echo ""
    echo "### $(date '+%Y-%m-%d %H:%M:%S') - Cron Run (FAILED)"
    echo "- **Status:** ❌ Failed"
    echo "- **Files Scanned:** $FILE_COUNT"
    echo "- **Error:** Output file not created"
    echo ""
  } >> "$DUPLICATES_LOG" 2>/dev/null || true

  log "INFO" "========== Phase 2B Cron Job End (FAILED) =========="
  exit 1
fi

# 4. 결과 처리
OUTPUT_LINES=$(wc -l < "${MEMORY_DIR}/messages_deduplicated.jsonl")
log "INFO" "✓ SUCCESS: Batch processing completed"
log "INFO" "Files Scanned: $FILE_COUNT"
log "INFO" "Deduplicated Entries: $OUTPUT_LINES"
log "INFO" "Step 3: Duplicate detection completed ✓"

{
  echo ""
  echo "### $(date '+%Y-%m-%d %H:%M:%S') - Cron Run"
  echo "- **Status:** ✅ Success"
  echo "- **Files Scanned:** $FILE_COUNT"
  echo "- **Deduplicated Entries:** $OUTPUT_LINES"
  echo ""
} >> "$DUPLICATES_LOG" 2>/dev/null || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2B run succeeded - $OUTPUT_LINES entries" >> "$LOG_FILE"

log "INFO" "========== Phase 2B Cron Job End =========="
exit 0
