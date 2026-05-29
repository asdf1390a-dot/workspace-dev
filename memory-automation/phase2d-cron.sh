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

  # Request message collection
  local payload='{}'
  local response=$(api_call "POST" "$PHASE2A_URL/api/collect-and-deduplicate" "$payload" "Phase 2A")

  # Parse response
  local success=$(echo "$response" | jq -r '.success // false' 2>/dev/null)
  local messages_count=$(echo "$response" | jq -r '.messagesCollected // 0' 2>/dev/null)
  local error=$(echo "$response" | jq -r '.error // ""' 2>/dev/null)

  if [[ "$success" != "true" ]]; then
    log "ERROR" "Phase 2A collection failed: $error"
    log_activity "PHASE2A" "FAILED" 0 "{\"error\":\"$error\"}"
    return 1
  fi

  local duration_ms=$(( ($(date +%s%N) - start_time) / 1000000 ))
  log "INFO" "Phase 2A collected $messages_count messages in ${duration_ms}ms"
  log_activity "PHASE2A" "SUCCESS" "$duration_ms" "{\"messages_collected\":$messages_count}"

  # Save response to file
  local collection_file="$COLLECTIONS_DIR/messages_$TIMESTAMP_SHORT.jsonl"
  if echo "$response" | jq '.messages[]? // empty' 2>/dev/null | \
     while read -r msg; do echo "$msg"; done > "$collection_file" 2>/dev/null; then
    log "INFO" "Messages saved to: $(basename $collection_file)"
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

  # Collect all memory files as input
  local memory_files=$(find "$MEMORY_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)

  # Request duplicate detection
  local payload="{\"memoryDir\":\"$MEMORY_DIR\",\"options\":{\"threshold\":0.85,\"enableSemantic\":false}}"
  local response=$(api_call "POST" "$PHASE2B_URL/api/detect-duplicates" "$payload" "Phase 2B")

  # Parse response
  local success=$(echo "$response" | jq -r '.success // false' 2>/dev/null)
  local clusters=$(echo "$response" | jq -r '.duplicateClusters | length // 0' 2>/dev/null)
  local error=$(echo "$response" | jq -r '.error // ""' 2>/dev/null)

  if [[ "$success" != "true" ]]; then
    log "ERROR" "Phase 2B detection failed: $error"
    log_activity "PHASE2B" "FAILED" 0 "{\"error\":\"$error\"}"
    return 1
  fi

  local duration_ms=$(( ($(date +%s%N) - start_time) / 1000000 ))
  log "INFO" "Phase 2B detected $clusters duplicate clusters across $memory_files files in ${duration_ms}ms"
  log_activity "PHASE2B" "SUCCESS" "$duration_ms" "{\"clusters_found\":$clusters,\"memory_files\":$memory_files}"

  # Save duplicates report
  local dups_file="$COLLECTIONS_DIR/duplicates_$TIMESTAMP_SHORT.jsonl"
  if echo "$response" | jq '.duplicateClusters[]? // empty' 2>/dev/null | \
     while read -r cluster; do echo "$cluster"; done > "$dups_file" 2>/dev/null; then
    log "INFO" "Duplicate clusters saved to: $(basename $dups_file)"
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

  # Get latest collected messages (from Phase 2A)
  local latest_collection=$(ls -1t "$COLLECTIONS_DIR"/messages_*.jsonl 2>/dev/null | head -1)

  if [[ -z "$latest_collection" ]]; then
    log "WARNING" "No collected messages found, skipping trust score calculation"
    log_activity "PHASE2C" "SKIPPED_NO_DATA" 0 '{"reason":"no_messages"}'
    return 1
  fi

  # Read messages from collection file
  local messages=()
  local msg_count=0
  while IFS= read -r line; do
    messages+=("$line")
    ((msg_count++))
  done < "$latest_collection"

  if [[ $msg_count -eq 0 ]]; then
    log "INFO" "No messages to score (collection empty)"
    log_activity "PHASE2C" "SKIPPED_EMPTY" 0 '{"reason":"no_messages_in_collection"}'
    return 0
  fi

  # Batch calculate trust scores
  # Note: Phase 2C API expects array of messages with specific schema
  local batch_payload='{"messages":['
  local first=true
  for msg in "${messages[@]}"; do
    if [[ "$first" == "true" ]]; then
      batch_payload="$batch_payload$msg"
      first=false
    else
      batch_payload="$batch_payload,$msg"
    fi
  done
  batch_payload="$batch_payload]}"

  local response=$(api_call "POST" "$PHASE2C_URL/api/calculate-trust-scores" "$batch_payload" "Phase 2C")

  # Parse response
  local success=$(echo "$response" | jq -r '.success // false' 2>/dev/null)
  local accepted=$(echo "$response" | jq -r '.summary.accepted // 0' 2>/dev/null)
  local quarantined=$(echo "$response" | jq -r '.summary.quarantined // 0' 2>/dev/null)
  local rejected=$(echo "$response" | jq -r '.summary.rejected // 0' 2>/dev/null)
  local error=$(echo "$response" | jq -r '.error // ""' 2>/dev/null)

  if [[ "$success" != "true" ]]; then
    log "ERROR" "Phase 2C scoring failed: $error"
    log_activity "PHASE2C" "FAILED" 0 "{\"error\":\"$error\"}"
    return 1
  fi

  local duration_ms=$(( ($(date +%s%N) - start_time) / 1000000 ))
  log "INFO" "Phase 2C processed $msg_count messages in ${duration_ms}ms: $accepted accepted, $quarantined quarantined, $rejected rejected"
  log_activity "PHASE2C" "SUCCESS" "$duration_ms" "{\"accepted\":$accepted,\"quarantined\":$quarantined,\"rejected\":$rejected,\"total\":$msg_count}"

  # Save trust scores
  local scores_file="$COLLECTIONS_DIR/trust_scores_$TIMESTAMP_SHORT.jsonl"
  if echo "$response" | jq '.results[]? // empty' 2>/dev/null | \
     while read -r result; do echo "$result"; done > "$scores_file" 2>/dev/null; then
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
  local scores_file=$(ls -1t "$COLLECTIONS_DIR"/trust_scores_*.jsonl 2>/dev/null | head -1)

  if [[ -z "$scores_file" ]] || [[ ! -f "$scores_file" ]]; then
    log "INFO" "No trust scores to merge, MEMORY.md unchanged"
    return 0
  fi

  local accepted_count=0
  local merge_entries=()

  while IFS= read -r line; do
    local decision=$(echo "$line" | jq -r '.decision // ""' 2>/dev/null)
    local score=$(echo "$line" | jq -r '.trustScore // 0' 2>/dev/null)

    # Only merge entries with ACCEPT decision and trust score >= threshold
    if [[ "$decision" == "ACCEPT" ]] && (( $(echo "$score >= $TRUST_SCORE_THRESHOLD" | bc -l) )); then
      merge_entries+=("$line")
      ((accepted_count++))
    fi
  done < "$scores_file"

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
    local msg_id=$(echo "$entry" | jq -r '.messageId // "unknown"' 2>/dev/null)
    local score=$(echo "$entry" | jq -r '.trustScore // 0' 2>/dev/null)
    local source=$(echo "$entry" | jq -r '.source // "unknown"' 2>/dev/null)

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
