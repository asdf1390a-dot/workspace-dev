#!/bin/bash

################################################################################
# Memory Archive Rotation Cron Wrapper
# Purpose: Orchestrate daily archive rotation at 00:05 KST
# Author: Claude Code Assistant
# Created: 2026-06-05
################################################################################

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
readonly NODE_SCRIPT="${SCRIPT_DIR}/archive-rotate.js"
readonly LOG_DIR="${PROJECT_ROOT}/memory/logs"
readonly LOG_FILE="${LOG_DIR}/archive-rotate-cron-$(date '+%Y%m%d').log"

# Ensure log directory exists
mkdir -p "${LOG_DIR}"

# Load environment variables
if [[ -f "${PROJECT_ROOT}/dsc-fms-portal/.env.local" ]]; then
  set -o allexport
  source "${PROJECT_ROOT}/dsc-fms-portal/.env.local"
  set +o allexport
fi

################################################################################
# Logging
################################################################################

log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
  log "INFO" "$@"
}

log_error() {
  log "ERROR" "$@"
}

################################################################################
# Main execution
################################################################################

main() {
  log_info "=== Archive Rotation Cron Started ==="
  log_info "Working directory: ${PROJECT_ROOT}"

  # Check if node script exists
  if [[ ! -f "${NODE_SCRIPT}" ]]; then
    log_error "Node script not found: ${NODE_SCRIPT}"
    return 1
  fi

  # Run the archive rotation script
  cd "${PROJECT_ROOT}"

  if node "${NODE_SCRIPT}"; then
    log_info "Archive rotation completed successfully"
    return 0
  else
    log_error "Archive rotation failed"
    return 1
  fi
}

# Execute
main "$@"
exit $?
