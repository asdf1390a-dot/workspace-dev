#!/bin/bash

################################################################################
# Phase 2C: Trust Score Calculator Service — Deployment Script
#
# Starts the Phase 2C trust score calculator service on port 3011
# Validates health check and logs deployment status
#
# Usage:
#   bash phase2c-deploy.sh          # Start service
#   bash phase2c-deploy.sh --check  # Health check only
#   bash phase2c-deploy.sh --stop   # Stop service
#
# Version: 1.0
# Created: 2026-05-30
################################################################################

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
LOG_DIR="$WORKSPACE_DIR/memory/logs"
SERVICE_NAME="Phase 2C Trust Score Calculator"
PORT="${PORT:-3011}"
URL="http://localhost:$PORT"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

log_msg() {
  local level="$1"
  shift
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_DIR/phase2c-deploy.log"
}

health_check() {
  log_msg "INFO" "Checking health at $URL/health"
  if curl -s "$URL/health" | grep -q '"status":"ready"'; then
    log_msg "INFO" "$SERVICE_NAME health check PASSED"
    return 0
  else
    log_msg "WARNING" "$SERVICE_NAME health check FAILED"
    return 1
  fi
}

case "${1:-start}" in
  start)
    log_msg "INFO" "Starting $SERVICE_NAME on port $PORT"
    cd "$SCRIPT_DIR"
    PORT=$PORT npm start phase2c-trust-score-calculator.js >> "$LOG_DIR/phase2c-service.log" 2>&1 &
    echo $! > "$LOG_DIR/phase2c.pid"
    log_msg "INFO" "Process started with PID: $(cat "$LOG_DIR/phase2c.pid")"

    # Wait for startup
    sleep 3
    for i in {1..10}; do
      if health_check; then
        log_msg "INFO" "✅ $SERVICE_NAME deployment successful"
        exit 0
      fi
      if [ $i -lt 10 ]; then
        log_msg "WARNING" "Waiting for service... ($i/10)"
        sleep 1
      fi
    done
    log_msg "ERROR" "❌ Service failed to become healthy after 10 retries"
    exit 1
    ;;

  stop)
    if [ -f "$LOG_DIR/phase2c.pid" ]; then
      PID=$(cat "$LOG_DIR/phase2c.pid")
      log_msg "INFO" "Stopping $SERVICE_NAME (PID: $PID)"
      kill $PID 2>/dev/null || true
      rm -f "$LOG_DIR/phase2c.pid"
      log_msg "INFO" "✅ Service stopped"
    else
      log_msg "WARNING" "No PID file found, service may not be running"
    fi
    ;;

  check)
    health_check
    exit $?
    ;;

  *)
    echo "Usage: $0 {start|stop|check}"
    exit 1
    ;;
esac
