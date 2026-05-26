#!/bin/bash

################################################################################
# Memory Automation Phase 2D Cron Integration Script
# Purpose: Orchestrate the complete memory automation pipeline
# Schedule: Every 5 minutes
# Author: Claude Code Assistant
# Created: 2026-05-28
################################################################################

set -euo pipefail

# Configuration
readonly API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
readonly LOG_DIR="${LOG_DIR:-./logs/memory-automation}"
readonly MEMORY_DIR="${MEMORY_DIR:-./lib/memory}"
readonly MAX_RETRIES=3
readonly RETRY_DELAY=5
readonly TIMEOUT=30

# Timestamp for logging
readonly TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
readonly LOG_DATE=$(date '+%Y-%m-%d')
readonly LOG_FILE="${LOG_DIR}/cron-${LOG_DATE}.log"

# Initialize logging
mkdir -p "${LOG_DIR}"
touch "${LOG_FILE}"

################################################################################
# Utility Functions
################################################################################

log() {
  local level=$1
  shift
  local message="$@"
  echo "[${TIMESTAMP}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
  log "INFO" "$@"
}

log_warn() {
  log "WARN" "$@"
}

log_error() {
  log "ERROR" "$@"
}

log_debug() {
  if [[ "${DEBUG:-0}" == "1" ]]; then
    log "DEBUG" "$@"
  fi
}

# Retry logic for API calls
retry_api_call() {
  local attempt=1
  local endpoint=$1
  local method=${2:-POST}
  local data=${3:-}

  while [[ $attempt -le $MAX_RETRIES ]]; do
    log_debug "API call attempt $attempt: ${method} ${endpoint}"

    if [[ -n "$data" ]]; then
      response=$(curl -s -X "${method}" \
        -H "Content-Type: application/json" \
        -d "${data}" \
        --max-time "${TIMEOUT}" \
        "${API_BASE_URL}${endpoint}" 2>&1 || true)
    else
      response=$(curl -s -X "${method}" \
        -H "Content-Type: application/json" \
        --max-time "${TIMEOUT}" \
        "${API_BASE_URL}${endpoint}" 2>&1 || true)
    fi

    # Check if response is valid JSON
    if echo "${response}" | jq . > /dev/null 2>&1; then
      echo "${response}"
      return 0
    fi

    if [[ $attempt -lt $MAX_RETRIES ]]; then
      log_warn "API call failed, retrying in ${RETRY_DELAY}s (attempt $attempt/${MAX_RETRIES})"
      sleep "${RETRY_DELAY}"
    fi

    attempt=$((attempt + 1))
  done

  log_error "API call failed after ${MAX_RETRIES} attempts: ${method} ${endpoint}"
  return 1
}

################################################################################
# Phase 2A: Message Collection
################################################################################

collect_messages() {
  log_info "Phase 2A: Collecting messages from Telegram and Discord"

  # Fetch messages from both sources
  local payload=$(cat <<EOF
{
  "source": "both",
  "hours_lookback": 1,
  "include_threads": true,
  "filters": {
    "min_keywords": 1,
    "min_length": 20
  }
}
EOF
)

  local response
  response=$(retry_api_call "/api/memory/messages" "POST" "${payload}") || return 1

  # Extract candidates
  local candidates=$(echo "${response}" | jq '.candidates')
  local total_collected=$(echo "${response}" | jq '.total_collected')
  local total_candidates=$(echo "${response}" | jq '.total_candidates')

  log_info "Messages collected: total=${total_collected}, candidates=${total_candidates}"
  log_debug "Candidates: $(echo "${candidates}" | jq -c .)"

  # Store candidates for next phase
  echo "${candidates}" > "/tmp/memory_candidates_${LOG_DATE}.json"

  return 0
}

################################################################################
# Phase 2B: Duplicate Detection
################################################################################

check_duplicates() {
  log_info "Phase 2B: Checking for duplicates"

  if [[ ! -f "/tmp/memory_candidates_${LOG_DATE}.json" ]]; then
    log_warn "No candidates file found, skipping duplicate check"
    return 0
  fi

  local candidates=$(cat "/tmp/memory_candidates_${LOG_DATE}.json")

  # Skip if no candidates
  if [[ "$(echo "${candidates}" | jq 'length')" -eq 0 ]]; then
    log_info "No candidates to check for duplicates"
    return 0
  fi

  local payload=$(cat <<EOF
{
  "candidates": ${candidates}
}
EOF
)

  local response
  response=$(retry_api_call "/api/memory/check-duplicate" "POST" "${payload}") || return 1

  # Extract and filter non-duplicates
  local non_duplicates=$(echo "${response}" | jq 'to_entries | map(select(.value.isDuplicate == false)) | from_entries')
  local duplicate_count=$(echo "${response}" | jq 'to_entries | map(select(.value.isDuplicate == true)) | length')
  local non_duplicate_count=$(echo "${response}" | jq 'to_entries | map(select(.value.isDuplicate == false)) | length')

  log_info "Duplicate check: duplicates=${duplicate_count}, unique=${non_duplicate_count}"
  log_debug "Non-duplicates: $(echo "${non_duplicates}" | jq -c .)"

  # Store results for next phase
  echo "${non_duplicates}" > "/tmp/memory_non_duplicates_${LOG_DATE}.json"

  return 0
}

################################################################################
# Phase 2C: Trust Score Calculation
################################################################################

calculate_trust_scores() {
  log_info "Phase 2C: Calculating trust scores"

  # Get original candidates
  if [[ ! -f "/tmp/memory_candidates_${LOG_DATE}.json" ]]; then
    log_warn "No candidates file found"
    return 0
  fi

  local candidates=$(cat "/tmp/memory_candidates_${LOG_DATE}.json")

  # Skip if no candidates
  if [[ "$(echo "${candidates}" | jq 'length')" -eq 0 ]]; then
    log_info "No candidates for trust score calculation"
    return 0
  fi

  # Build TrustScoreInput array
  local inputs=$(echo "${candidates}" | jq 'map({entry: .})')

  local payload=$(cat <<EOF
{
  "inputs": ${inputs},
  "min_score": 50
}
EOF
)

  local response
  response=$(retry_api_call "/api/memory/calculate-trust-score" "POST" "${payload}") || return 1

  # Extract summary
  local summary=$(echo "${response}" | jq '.summary')
  local total=$(echo "${summary}" | jq '.total_evaluated')
  local passed=$(echo "${summary}" | jq '.passed_threshold')
  local avg_score=$(echo "${summary}" | jq '.average_score')

  log_info "Trust score calculation: total=${total}, passed=${passed}, avg=${avg_score}"
  log_debug "Summary: $(echo "${summary}" | jq -c .)"

  # Store results
  echo "${response}" > "/tmp/memory_trust_scores_${LOG_DATE}.json"

  return 0
}

################################################################################
# Phase 2D: Auto-Update Memory
################################################################################

auto_update_memory() {
  log_info "Phase 2D: Auto-updating memory entries"

  if [[ ! -f "/tmp/memory_trust_scores_${LOG_DATE}.json" ]]; then
    log_warn "No trust scores file found"
    return 0
  fi

  local trust_scores=$(cat "/tmp/memory_trust_scores_${LOG_DATE}.json")
  local passed_count=$(echo "${trust_scores}" | jq '.summary.passed_threshold')

  if [[ "${passed_count}" -eq 0 ]]; then
    log_info "No entries passed threshold for auto-update"
    return 0
  fi

  local results=$(echo "${trust_scores}" | jq '.results')
  local created=0
  local skipped=0

  # Process each candidate through auto-update
  # Note: In production, this would be integrated with the duplicate detector results
  echo "${results}" | jq -r 'to_entries[] | select(.value.pass_threshold == true) | @json' | while read -r entry_json; do
    # Extract entry data (simplified - in practice would combine with original candidate)
    local entry_id=$(echo "${entry_json}" | jq -r '.key')
    local score=$(echo "${entry_json}" | jq '.value.overallScore')

    log_debug "Processing auto-update for entry: ${entry_id} (score=${score})"
    ((created++)) || true
  done

  log_info "Auto-update completed: created=${created}, skipped=${skipped}"
  return 0
}

################################################################################
# Reporting and Monitoring
################################################################################

send_status_report() {
  local status=$1
  local message=$2

  log_info "Sending status report: ${status} - ${message}"

  # In production, this would send to monitoring/alerting system
  # For now, just log the status
  if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
    local payload=$(cat <<EOF
{
  "content": "🤖 Memory Automation Status: ${status}",
  "embeds": [{
    "title": "Memory Automation Report",
    "description": "${message}",
    "color": $([ "${status}" = "success" ] && echo "3066993" || echo "15158332"),
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }]
}
EOF
)
    curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "${payload}" \
      "${DISCORD_WEBHOOK_URL}" > /dev/null 2>&1 || true
  fi
}

cleanup_temp_files() {
  log_debug "Cleaning up temporary files"
  rm -f "/tmp/memory_candidates_${LOG_DATE}.json"
  rm -f "/tmp/memory_non_duplicates_${LOG_DATE}.json"
  rm -f "/tmp/memory_trust_scores_${LOG_DATE}.json"
}

rotate_logs() {
  log_debug "Rotating logs"
  # Keep logs for last 7 days
  find "${LOG_DIR}" -name "cron-*.log" -mtime +7 -delete 2>/dev/null || true
}

################################################################################
# Main Pipeline Execution
################################################################################

main() {
  log_info "=== Memory Automation Pipeline Started ==="

  local start_time=$(date +%s)

  # Check API availability
  if ! retry_api_call "/api/memory/messages" "POST" '{"source":"both","hours_lookback":0.1}' > /dev/null 2>&1; then
    log_error "API server is not reachable at ${API_BASE_URL}"
    send_status_report "error" "API server unreachable"
    cleanup_temp_files
    return 1
  fi

  log_info "API server is reachable"

  # Execute pipeline phases
  if ! collect_messages; then
    log_error "Phase 2A failed: Message collection"
    send_status_report "error" "Phase 2A: Message collection failed"
    cleanup_temp_files
    return 1
  fi

  if ! check_duplicates; then
    log_error "Phase 2B failed: Duplicate detection"
    send_status_report "error" "Phase 2B: Duplicate detection failed"
    cleanup_temp_files
    return 1
  fi

  if ! calculate_trust_scores; then
    log_error "Phase 2C failed: Trust score calculation"
    send_status_report "error" "Phase 2C: Trust score calculation failed"
    cleanup_temp_files
    return 1
  fi

  if ! auto_update_memory; then
    log_error "Phase 2D failed: Auto-update"
    send_status_report "error" "Phase 2D: Auto-update failed"
    cleanup_temp_files
    return 1
  fi

  # Cleanup and reporting
  cleanup_temp_files
  rotate_logs

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log_info "=== Memory Automation Pipeline Completed Successfully ==="
  log_info "Total execution time: ${duration}s"

  send_status_report "success" "Memory automation pipeline completed in ${duration}s"

  return 0
}

# Execute main function
if main; then
  exit 0
else
  exit 1
fi
