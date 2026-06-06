#!/bin/bash
# Phase 2 Health Watchdog — Auto-restart failed services
# Run every 2 minutes via cron

WORKSPACE_DIR="/home/jeepney/.openclaw/workspace-dev"
MEMORY_DIR="$WORKSPACE_DIR/memory-automation"
LOG_DIR="$WORKSPACE_DIR/memory/logs"
WATCHDOG_LOG="$LOG_DIR/phase2-watchdog.log"

mkdir -p "$LOG_DIR"

log_event() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] $1" >> "$WATCHDOG_LOG"
}

check_and_restart_service() {
  local service_name=$1
  local port=$2
  local script=$3
  local env_var=$4

  # Health check
  if ! curl -s http://127.0.0.1:$port/health >/dev/null 2>&1; then
    log_event "⚠️  $service_name ($port) DOWN — Restarting..."

    # Kill existing process if any
    pkill -f "$script" 2>/dev/null || true
    sleep 1

    # Restart
    cd "$MEMORY_DIR"
    if [[ -n "$env_var" ]]; then
      nohup bash -c "$env_var node $script" >> "$LOG_DIR/${service_name}-watchdog-restart.log" 2>&1 &
    else
      nohup node "$script" >> "$LOG_DIR/${service_name}-watchdog-restart.log" 2>&1 &
    fi

    sleep 2

    # Verify restart
    if curl -s http://127.0.0.1:$port/health >/dev/null 2>&1; then
      log_event "✅ $service_name ($port) RESTARTED successfully"
    else
      log_event "❌ $service_name ($port) RESTART FAILED"
    fi
  fi
}

# Check all Phase 2 services
check_and_restart_service "Phase2A" "3009" "phase2a-message-collection.js" ""
check_and_restart_service "Phase2B" "3010" "phase2b-express-wrapper.js" "PORT=3010"
check_and_restart_service "Phase2C" "3011" "phase2c-express-wrapper.js" "PORT=3011"

# Check Next.js FMS Portal
if ! curl -s http://127.0.0.1:3000 >/dev/null 2>&1; then
  log_event "⚠️  Next.js FMS Portal (3000) DOWN — Restarting..."
  pkill -f "next dev" 2>/dev/null || true
  sleep 1

  cd "$MEMORY_DIR/../dsc-fms-portal"
  nohup npm run dev >> "$LOG_DIR/nextjs-watchdog-restart.log" 2>&1 &
  sleep 5

  if curl -s http://127.0.0.1:3000 >/dev/null 2>&1; then
    log_event "✅ Next.js FMS Portal (3000) RESTARTED successfully"
  else
    log_event "❌ Next.js FMS Portal (3000) RESTART FAILED"
  fi
fi

log_event "✓ Watchdog cycle complete"
