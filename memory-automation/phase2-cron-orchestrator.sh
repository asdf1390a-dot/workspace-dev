#!/bin/bash
# Phase 2 Cron Orchestrator — Coordinates all monitoring and watchdog activities
# Replaces phase2-health-watchdog.sh with enhanced monitoring pipeline
# Run every 2 minutes via cron

set -e

WORKSPACE_DIR="/home/jeepney/.openclaw/workspace-dev"
MEMORY_DIR="$WORKSPACE_DIR/memory-automation"
LOGS_DIR="$WORKSPACE_DIR/memory/logs"

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_event() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "[${timestamp}] $1" | tee -a "$LOGS_DIR/phase2-orchestrator.log"
}

# Step 1: Run health monitor (memory/FD tracking)
log_event "📊 Running Phase 2 health monitor..."
if cd "$MEMORY_DIR" && node phase2-health-monitor.js >> "$LOGS_DIR/phase2-monitor.log" 2>&1; then
  log_event "✅ Health monitor complete"
else
  log_event "❌ Health monitor failed"
fi

# Step 2: Run enhanced watchdog (predictive restart + reactive health checks)
log_event "🔄 Running Phase 2 enhanced watchdog..."
if cd "$MEMORY_DIR" && node phase2-watchdog-enhanced.js >> "$LOGS_DIR/phase2-watchdog-enhanced.log" 2>&1; then
  log_event "✅ Enhanced watchdog complete"
else
  log_event "⚠️  Enhanced watchdog encountered issues"
fi

# Step 3: Run crash analysis every 10 cycles (every 20 minutes)
# Check if we should run analysis (store cycle counter in temp file)
CYCLE_COUNTER_FILE="$MEMORY_DIR/.phase2-cycle-counter"
CURRENT_CYCLE=$(cat "$CYCLE_COUNTER_FILE" 2>/dev/null || echo "0")
NEXT_CYCLE=$((CURRENT_CYCLE + 1))

if [ $NEXT_CYCLE -ge 10 ]; then
  log_event "📈 Running Phase 2 crash analysis..."
  if cd "$MEMORY_DIR" && node phase2-crash-analysis.js >> "$LOGS_DIR/phase2-analysis.log" 2>&1; then
    log_event "✅ Crash analysis complete"
  else
    log_event "⚠️  Crash analysis encountered issues"
  fi
  NEXT_CYCLE=0
fi

echo "$NEXT_CYCLE" > "$CYCLE_COUNTER_FILE"

log_event "✓ Phase 2 orchestration cycle complete"
