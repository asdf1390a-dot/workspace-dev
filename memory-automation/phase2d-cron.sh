#!/bin/bash

################################################################################
# Phase 2D: Cron Integration — Complete Cycle Automation
#
# Orchestrates Phase 2A (Message Collection) → Phase 2B (Duplicate Detection) →
# Phase 2C (Trust Score Calculation) → MEMORY.md Auto-Update
#
# Schedule: Every 5 minutes (configurable)
# Purpose: Auto-update MEMORY.md with new entries, maintain 95%+ trust score
#
# Error Handling:
#   - Graceful degradation on API failures
#   - File-level atomic writes (temp + rename)
#   - Comprehensive logging with timestamps
#   - No mid-cycle abort (resilient execution)
#
# Author: Automation Specialist (Memory-Automation Team)
# Version: 1.0
# Created: 2026-05-30
################################################################################

set -uo pipefail

#===============================================================================
# CONFIGURATION
#===============================================================================

# Directory structure
WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
MEMORY_DIR="$WORKSPACE_DIR/memory"
SCRIPT_DIR="$WORKSPACE_DIR/memory-automation"
LOG_DIR="$MEMORY_DIR/logs"
COLLECTIONS_DIR="$MEMORY_DIR/collected"

# Service URLs & ports
PHASE2A_URL="${PHASE2A_URL:-http://localhost:3009}"
PHASE2B_URL="${PHASE2B_URL:-http://localhost:3010}"
PHASE2C_URL="${PHASE2C_URL:-http://localhost:3011}"

# Timeouts (milliseconds)
CURL_TIMEOUT=10
API_TIMEOUT=30000

# Thresholds
TRUST_SCORE_THRESHOLD=60  # Min score to accept entry
DUPLICATE_CONFIDENCE_THRESHOLD=0.80  # Min confidence to merge

# File naming
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
TIMESTAMP_SHORT=$(date '+%Y%m%d_%H%M%S')
DATE_SHORT=$(date '+%Y%m%d')

# Log files
LOG_FILE="$LOG_DIR/phase2d-cron-$DATE_SHORT.log"
ERROR_LOG="$LOG_DIR/phase2d-errors-$DATE_SHORT.log"
ACTIVITY_LOG="$LOG_DIR/phase2d-activity-$DATE_SHORT.jsonl"

# Memory backups (for safety)
MEMORY_BACKUP_DIR="$MEMORY_DIR/backups"
MEMORY_FILE="$MEMORY_DIR/MEMORY.md"
MEMORY_BACKUP="$MEMORY_BACKUP_DIR/MEMORY_$(date '+%Y%m%d_%H%M%S').md.bak"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

#===============================================================================
# UTILITY FUNCTIONS
#===============================================================================

# Initialize directories
init_directories() {
  mkdir -p "$LOG_DIR" "$COLLECTIONS_DIR" "$MEMORY_BACKUP_DIR" 2>/dev/null || true
}

# Log with timestamp and level
log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"

  # Also log to stdout for monitoring (only WARNING/ERROR)
  if [[ "$level" == "ERROR" || "$level" == "CRITICAL" ]]; then
    echo -e "${RED}[$timestamp] [$level] $message${NC}" >&2
  elif [[ "$level" == "WARNING" ]]; then
    echo -e "${YELLOW}[$timestamp] [$level] $message${NC}" >&2
  fi
}

# Log activity to JSONL (for analytics)
log_activity() {
  local phase=$1
  local status=$2
  local duration_ms=$3
  local details=$4

  local entry="{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"phase\":\"$phase\",\"status\":\"$status\",\"duration_ms\":$duration_ms,\"details\":$details}"
  echo "$entry" >> "$ACTIVITY_LOG"
}

# Health check for service
health_check() {
  local service_url=$1
  local service_name=$2
  local max_retries=3
  local retry_delay=2

  for attempt in $(seq 1 $max_retries); do
    if curl -s --connect-timeout "$CURL_TIMEOUT" "$service_url/health" > /dev/null 2>&1; then
      log "INFO" "$service_name health check PASSED"
      return 0
    fi

    if [[ $attempt -lt $max_retries ]]; then
      log "WARNING" "$service_name health check failed (attempt $attempt/$max_retries), retrying in ${retry_delay}s..."
      sleep "$retry_delay"
    fi
  done

  log "ERROR" "$service_name health check FAILED after $max_retries attempts"
  return 1
}

# Call API with timeout and error handling
api_call() {
  local method=$1
  local endpoint=$2
  local payload=$3
  local service_name=$4

  local url="$endpoint"
  local timeout=$((CURL_TIMEOUT + 5))

  if [[ "$method" == "POST" ]]; then
    response=$(curl -s --connect-timeout "$timeout" -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$payload" 2>&1)
  else
    response=$(curl -s --connect-timeout "$timeout" "$url" 2>&1)
  fi

  local exit_code=$?

  if [[ $exit_code -ne 0 ]]; then
    log "ERROR" "API call to $service_name failed (exit code: $exit_code)"
    echo "{\"success\":false,\"error\":\"Connection failed\"}"
    return 1
  fi

  echo "$response"
  return 0
}

# Create atomic file write (temp + rename)
atomic_write() {
  local target_file=$1
  local content=$2
  local temp_file="${target_file}.tmp.$$"

  # Write to temp file
  if ! echo "$content" > "$temp_file"; then
    log "ERROR" "Failed to write temporary file: $temp_file"
    rm -f "$temp_file"
    return 1
  fi

  # Atomic rename
  if ! mv "$temp_file" "$target_file" 2>/dev/null; then
    log "ERROR" "Failed to atomically rename $temp_file → $target_file"
    rm -f "$temp_file"
    return 1
  fi

  return 0
}

# Backup MEMORY.md before modifications
backup_memory() {
  if [[ -f "$MEMORY_FILE" ]]; then
    if cp "$MEMORY_FILE" "$MEMORY_BACKUP" 2>/dev/null; then
      log "INFO" "Memory backup created: $(basename $MEMORY_BACKUP)"
      return 0
    else
      log "WARNING" "Failed to create memory backup"
      return 1
    fi
  fi
}

#===============================================================================
# PHASE 2A: MESSAGE COLLECTION
#===============================================================================

phase2a_collect_messages() {
  log "INFO" "=== PHASE 2A: Message Collection ==="
  local start_time=$(date +%s%N)

  # Health check
  if ! health_check "$PHASE2A_URL" "Phase 2A"; then
    log "WARNING" "Phase 2A unavailable, skipping message collection"
    log_activity "PHASE2A" "SKIPPED_DOWN" 0 '{"reason":"service_down"}'
    return 1
  fi

  # Request memory collection (using correct endpoint: /api/collect-memory)
  # Collects raw memory files from the memory directory for processing
  local payload='{"path":"MEMORY.md","lines":100}'
  local response=$(api_call "POST" "$PHASE2A_URL/api/collect-memory" "$payload" "Phase 2A")

  # Parse response (using grep/sed since jq not available)
  local success=$(echo "$response" | grep -o '"success":\(true\|false\)' | cut -d':' -f2)
  local messages_count=$(echo "$response" | grep -o '"contentLength":[0-9]*' | cut -d':' -f2)
  local error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)

  # Fallback defaults
  success=${success:-false}
  messages_count=${messages_count:-0}
  error=${error:-}

  if [[ "$success" != "true" ]]; then
    log "ERROR" "Phase 2A memory collection failed: $error"
    log_activity "PHASE2A" "FAILED" 0 "{\"error\":\"$error\"}"
    return 1
  fi

  local duration_ms=$(( ($(date +%s%N) - start_time) / 1000000 ))
  log "INFO" "Phase 2A collected memory content ($messages_count bytes) in ${duration_ms}ms"
  log_activity "PHASE2A" "SUCCESS" "$duration_ms" "{\"content_size\":$messages_count}"

  # Save response to file (raw JSON, no jq needed)
  local collection_file="$COLLECTIONS_DIR/memory_$TIMESTAMP_SHORT.json"
  if echo "$response" > "$collection_file"; then
    log "INFO" "Memory collection saved to: $(basename $collection_file)"
  fi

  return 0
}

#===============================================================================
# PHASE 2B: DUPLICATE DETECTION
#===============================================================================

phase2b_detect_duplicates() {
  log "INFO" "=== PHASE 2B: Duplicate Detection ==="
  local start_time=$(date +%s%N)

  # Health check
  if ! health_check "$PHASE2B_URL" "Phase 2B"; then
    log "WARNING" "Phase 2B unavailable, skipping duplicate detection"
    log_activity "PHASE2B" "SKIPPED_DOWN" 0 '{"reason":"service_down"}'
    return 1
  fi

  # Get Phase 2A collected data (most recent collection file)
  local phase2a_file=$(find "$COLLECTIONS_DIR" -name "memory_*.json" -type f 2>/dev/null | sort -r | head -1)
  if [[ -z "$phase2a_file" ]]; then
    log "ERROR" "Phase 2B: No Phase 2A collection file found"
    log_activity "PHASE2B" "FAILED" 0 '{"error":"no_phase2a_data"}'
    return 1
  fi

  # Read Phase 2A response and wrap in entries array for Phase 2B API
  local phase2a_data=$(cat "$phase2a_file" 2>/dev/null)
  if [[ -z "$phase2a_data" ]]; then
    log "ERROR" "Phase 2B: Failed to read Phase 2A data"
    log_activity "PHASE2B" "FAILED" 0 '{"error":"cannot_read_phase2a_file"}'
    return 1
  fi

  # Build entries array: Phase 2B expects {"entries":[...array of entry objects...]}
  local payload="{\"entries\":[${phase2a_data}]}"

  # Request duplicate detection
  local response=$(api_call "POST" "$PHASE2B_URL/api/detect-duplicates" "$payload" "Phase 2B")

  # Parse response (using grep/sed instead of jq)
  # Phase 2B returns: {"unique":[...], "duplicates":[...], "count":X, "removed":Y}
  local success=$(echo "$response" | grep -o '"count":[0-9]*' | head -1 | cut -d':' -f2)
  success=${success:-0}

  # Extract duplicate count
  local duplicates=$(echo "$response" | grep -o '"removed":[0-9]*' | cut -d':' -f2)
  duplicates=${duplicates:-0}

  local error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)

  if [[ -z "$success" ]] || [[ $success -lt 0 ]]; then
    log "ERROR" "Phase 2B detection failed: $error"
    log_activity "PHASE2B" "FAILED" 0 "{\"error\":\"$error\"}"
    return 1
  fi

  local duration_ms=$(( ($(date +%s%N) - start_time) / 1000000 ))
  log "INFO" "Phase 2B processed $success unique entries, $duplicates duplicates removed in ${duration_ms}ms"
  log_activity "PHASE2B" "SUCCESS" "$duration_ms" "{\"unique_count\":$success,\"duplicates_removed\":$duplicates}"

  # Save duplicates report (raw response)
  local dups_file="$COLLECTIONS_DIR/duplicates_$TIMESTAMP_SHORT.json"
  if echo "$response" > "$dups_file"; then
    log "INFO" "Duplicate detection result saved to: $(basename $dups_file)"
  fi

  return 0
}

#===============================================================================
# PHASE 2C: TRUST SCORE CALCULATION
#===============================================================================

phase2c_calculate_trust_scores() {
  log "INFO" "=== PHASE 2C: Trust Score Calculation ==="
  local start_time=$(date +%s%N)

  # Health check
  if ! health_check "$PHASE2C_URL" "Phase 2C"; then
    log "WARNING" "Phase 2C unavailable, skipping trust score calculation"
    log_activity "PHASE2C" "SKIPPED_DOWN" 0 '{"reason":"service_down"}'
    return 1
  fi

  # Get Phase 2B result (duplicate detection output)
  # This contains the deduplicated entries that need trust scoring
  local latest_duplicates=$(ls -1t "$COLLECTIONS_DIR"/duplicates_*.json 2>/dev/null | head -1)

  if [[ -z "$latest_duplicates" ]]; then
    # Fall back to Phase 2A collection if Phase 2B hasn't run yet
    latest_duplicates=$(ls -1t "$COLLECTIONS_DIR"/memory_*.json 2>/dev/null | head -1)
  fi

  if [[ -z "$latest_duplicates" ]]; then
    log "WARNING" "No collected messages found, skipping trust score calculation"
    log_activity "PHASE2C" "SKIPPED_NO_DATA" 0 '{"reason":"no_messages"}'
    return 1
  fi

  # Read the Phase 2B output (which contains "unique" array of deduplicated entries)
  # or Phase 2A output (single entry) and wrap in entries array for Phase 2C API
  local phase2b_data=$(cat "$latest_duplicates" 2>/dev/null)
  if [[ -z "$phase2b_data" ]]; then
    log "ERROR" "Phase 2C: Failed to read phase2b/phase2a data"
    log_activity "PHASE2C" "FAILED" 0 '{"error":"cannot_read_phase2b_data"}'
    return 1
  fi

  # Check if this is Phase 2B output (has "unique" field) or Phase 2A output
  if echo "$phase2b_data" | grep -q '"unique"'; then
    # Extract unique entries array from Phase 2B output using Python JSON parser
    local unique_array=$(python3 -c "import json, sys; data = json.load(sys.stdin); print(json.dumps(data.get('unique', [])))" <<< "$phase2b_data" 2>/dev/null)
    if [[ -z "$unique_array" ]] || [[ "$unique_array" == "null" ]]; then
      log "ERROR" "Phase 2C: Failed to extract unique array from Phase 2B"
      log_activity "PHASE2C" "FAILED" 0 '{"error":"cannot_extract_unique_array"}'
      return 1
    fi
    local payload="{\"entries\":${unique_array}}"
  else
    # This is Phase 2A single entry, wrap it in entries array
    local payload="{\"entries\":[${phase2b_data}]}"
  fi

  local response=$(api_call "POST" "$PHASE2C_URL/api/calculate-trust-scores" "$payload" "Phase 2C")

  # Parse response
  local success=$(echo "$response" | grep -o '"success":\(true\|false\)' | cut -d':' -f2)
  success=${success:-false}

  local accepted=$(echo "$response" | grep -o '"accepted":[0-9]*' | cut -d':' -f2)
  accepted=${accepted:-0}

  local quarantined=$(echo "$response" | grep -o '"quarantined":[0-9]*' | cut -d':' -f2)
  quarantined=${quarantined:-0}

  local rejected=$(echo "$response" | grep -o '"rejected":[0-9]*' | cut -d':' -f2)
  rejected=${rejected:-0}

  local error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  error=${error:-}

  if [[ "$success" != "true" ]]; then
    log "ERROR" "Phase 2C scoring failed: $error"
    log_activity "PHASE2C" "FAILED" 0 "{\"error\":\"$error\"}"
    return 1
  fi

  local total=$((accepted + quarantined + rejected))
  local duration_ms=$(( ($(date +%s%N) - start_time) / 1000000 ))
  log "INFO" "Phase 2C processed $total entries in ${duration_ms}ms: $accepted accepted, $quarantined quarantined, $rejected rejected"
  log_activity "PHASE2C" "SUCCESS" "$duration_ms" "{\"accepted\":$accepted,\"quarantined\":$quarantined,\"rejected\":$rejected,\"total\":$total}"

  # Save trust scores (raw response JSON)
  local scores_file="$COLLECTIONS_DIR/trust_scores_$TIMESTAMP_SHORT.json"
  if echo "$response" > "$scores_file"; then
    log "INFO" "Trust scores saved to: $(basename $scores_file)"
  fi

  return 0
}

#===============================================================================
# MEMORY.md UPDATE & MERGE
#===============================================================================

update_memory_file() {
  log "INFO" "=== MEMORY.md Auto-Update ==="

  # Backup before modification
  if ! backup_memory; then
    log "WARNING" "Memory backup failed, proceeding with caution"
  fi

  # Collect all scored messages that were ACCEPTED
  local scores_file=$(ls -1t "$COLLECTIONS_DIR"/trust_scores_*.json 2>/dev/null | head -1)

  if [[ -z "$scores_file" ]] || [[ ! -f "$scores_file" ]]; then
    log "INFO" "No trust scores to merge, MEMORY.md unchanged"
    return 0
  fi

  local accepted_count=0
  local merge_entries=()

  # Extract results array from JSON and process each result entry
  # Simple approach: extract entries between [ and ] and split by },{
  local results_section=$(sed -n '/"results":\[/,/\]/p' "$scores_file")

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    # Extract decision and trust score using grep
    local decision=$(echo "$line" | grep -o '"decision":"[^"]*"' | cut -d'"' -f4)
    local score=$(echo "$line" | grep -o '"trustScore":[0-9.]*' | cut -d':' -f2)

    # Fallback defaults
    decision=${decision:-}
    score=${score:-0}

    # Only merge entries with ACCEPT decision and trust score >= threshold
    # Use awk for floating-point comparison since bash arithmetic is integer-only
    if [[ "$decision" == "ACCEPT" ]]; then
      local should_merge=$(awk -v score="$score" -v threshold="$TRUST_SCORE_THRESHOLD" 'BEGIN {print (score >= threshold ? 1 : 0)}')
      if [[ "$should_merge" == "1" ]]; then
        merge_entries+=("$line")
        ((accepted_count++))
      fi
    fi
  done <<< "$results_section"

  if [[ $accepted_count -eq 0 ]]; then
    log "INFO" "No entries eligible for merge (all below threshold or not ACCEPTED)"
    log_activity "MEMORY_UPDATE" "SKIPPED" 0 '{"reason":"no_eligible_entries"}'
    return 0
  fi

  # Update MEMORY.md with new entries
  # Strategy: Append new entries with auto-update flag
  # This prevents conflicts by using append-only semantics

  local update_section=""
  local timestamp_iso=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  local update_count=0

  for entry in "${merge_entries[@]}"; do
    # Extract fields using grep (JSON object parsing without jq)
    local msg_id=$(echo "$entry" | grep -o '"messageId":"[^"]*"' | cut -d'"' -f4)
    msg_id=${msg_id:-unknown}

    local score=$(echo "$entry" | grep -o '"trustScore":[0-9.]*' | cut -d':' -f2)
    score=${score:-0}

    local source=$(echo "$entry" | grep -o '"source":"[^"]*"' | cut -d'"' -f4)
    source=${source:-unknown}

    # Create markdown entry
    update_section+=$'- [✅ Auto-Collected] '
    update_section+="Message $msg_id (score: $score, source: $source, auto_update: true) — $timestamp_iso"$'\n'
    ((update_count++))
  done

  if [[ -z "$update_section" ]]; then
    log "WARNING" "Failed to format update section"
    return 1
  fi

  # Read current MEMORY file
  local current_memory=""
  if [[ -f "$MEMORY_FILE" ]]; then
    current_memory=$(cat "$MEMORY_FILE")
  else
    log "WARNING" "MEMORY.md not found, creating new file"
    current_memory="# メモリ インデックス (MEMORY.md)\n\n"
  fi

  # Append new entries to a separate section (Auto-Collected Entries)
  local updated_memory="$current_memory"
  updated_memory+=$'\n\n## 🤖 Auto-Collected Entries (Phase 2D) — '"$(date '+%Y-%m-%d %H:%M:%S KST')"$'\n'
  updated_memory+="$update_section"

  # Write atomically
  if atomic_write "$MEMORY_FILE" "$updated_memory"; then
    log "INFO" "MEMORY.md updated with $update_count new entries"
    log_activity "MEMORY_UPDATE" "SUCCESS" 0 "{\"entries_added\":$update_count,\"accepted\":$accepted_count}"
    return 0
  else
    log "ERROR" "Failed to update MEMORY.md atomically"
    log_activity "MEMORY_UPDATE" "FAILED" 0 '{"reason":"atomic_write_failed"}'
    return 1
  fi
}

#===============================================================================
# SUMMARY & REPORTING
#===============================================================================

generate_summary() {
  log "INFO" "=== Cron Cycle Complete ==="

  local total_duration_ms=$(( ($(date +%s%N) - CYCLE_START_TIME) / 1000000 ))

  # Count entries in activity log from this cycle
  local activity_count=$(grep "$TIMESTAMP" "$ACTIVITY_LOG" 2>/dev/null | wc -l)

  log "INFO" "Cycle duration: ${total_duration_ms}ms, activities logged: $activity_count"
  log_activity "CYCLE_COMPLETE" "SUCCESS" "$total_duration_ms" '{"cycle":"phase2d_full"}'
}

#===============================================================================
# MAIN EXECUTION
#===============================================================================

main() {
  init_directories

  local CYCLE_START_TIME=$(date +%s%N)

  log "INFO" "╔════════════════════════════════════════════════════════╗"
  log "INFO" "║  Phase 2D: Cron Integration — Full Cycle              ║"
  log "INFO" "║  Start: $(date '+%Y-%m-%d %H:%M:%S %Z')                    ║"
  log "INFO" "╚════════════════════════════════════════════════════════╝"

  # Execute phases in sequence
  phase2a_collect_messages
  phase2b_detect_duplicates
  phase2c_calculate_trust_scores
  update_memory_file

  generate_summary

  log "INFO" "╔════════════════════════════════════════════════════════╗"
  log "INFO" "║  Cycle Complete — Check logs for details              ║"
  log "INFO" "║  Log file: $LOG_FILE              ║"
  log "INFO" "╚════════════════════════════════════════════════════════╝"
}

# Entry point
main "$@"
exit $?
