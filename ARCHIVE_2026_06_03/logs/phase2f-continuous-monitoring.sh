#!/bin/bash

#===============================================================================
# Phase 2F: Continuous Deployment Monitoring (21-hour window)
# 2026-05-31 18:00 → 2026-06-01 09:00 KST
#
# Purpose: Real-time health tracking + 30-min checkpoints + system baseline
# Owner: DevOps Engineer + Memory Specialist
#===============================================================================

set -uo pipefail

WORKSPACE_DIR="/home/jeepney/.openclaw/workspace-dev"
LOG_DIR="$WORKSPACE_DIR/memory/logs"
REPORT_FILE="$LOG_DIR/phase2f-monitoring-$(date +%Y%m%d).log"

# Service URLs
PHASE2A_URL="http://localhost:3009"
PHASE2B_URL="http://localhost:3010"
PHASE2C_URL="http://localhost:3011"

# Checkpoint interval (seconds)
CHECKPOINT_INTERVAL=1800  # 30 minutes

# Initialize
CHECKPOINT_COUNT=0
START_TIME=$(date +%s)
DEPLOYMENT_WINDOW_END=$((START_TIME + 75600))  # 21 hours = 75600 seconds

#===============================================================================
# Monitoring Functions
#===============================================================================

log_checkpoint() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S KST')
  local checkpoint_num=$1

  {
    echo ""
    echo "[$timestamp] === CHECKPOINT #$checkpoint_num ==="

    # Phase 2A Health
    local phase2a=$(curl -s --connect-timeout 5 "$PHASE2A_URL/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$phase2a" ]; then
      echo "[$timestamp] Phase 2A: ✅ $phase2a"
    else
      echo "[$timestamp] Phase 2A: 🔴 NOT RESPONDING"
    fi

    # Phase 2B Health
    local phase2b=$(curl -s --connect-timeout 5 "$PHASE2B_URL/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$phase2b" ]; then
      echo "[$timestamp] Phase 2B: ✅ $phase2b"
    else
      echo "[$timestamp] Phase 2B: 🔴 NOT RESPONDING"
    fi

    # Phase 2C Health
    local phase2c=$(curl -s --connect-timeout 5 "$PHASE2C_URL/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$phase2c" ]; then
      echo "[$timestamp] Phase 2C: ✅ $phase2c"
    else
      echo "[$timestamp] Phase 2C: 🔴 NOT RESPONDING"
    fi

    # System Resources
    local disk=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    local mem=$(free -h | grep Mem | awk '{print $3 "/" $2}')
    local cpu=$(uptime | awk -F'load average:' '{print $2}')
    echo "[$timestamp] Resources: Disk $disk% | Memory $mem | CPU Load$cpu"

    # Process count
    local process_count=$(ps aux | grep -E "phase2[abc]|node.*phase2" | grep -v grep | wc -l)
    echo "[$timestamp] Active Phase processes: $process_count"

    echo "[$timestamp] === CHECKPOINT COMPLETE ==="

  } | tee -a "$REPORT_FILE"
}

#===============================================================================
# Main Monitoring Loop
#===============================================================================

echo "Starting Phase 2F Continuous Monitoring..."
echo "Window: 21 hours ($(date '+%Y-%m-%d %H:%M:%S KST') → 2026-06-01 09:00:00 KST)"
echo "Checkpoint interval: 30 minutes"
echo "Log file: $REPORT_FILE"
echo ""

# Create log file if it doesn't exist
touch "$REPORT_FILE"

# Initial checkpoint
log_checkpoint 1
CHECKPOINT_COUNT=2

# Continuous monitoring loop
while true; do
  current_time=$(date +%s)

  # Check if deployment window has ended
  if [ $current_time -ge $DEPLOYMENT_WINDOW_END ]; then
    echo ""
    echo "[$(date '+%Y-%m-%d %H:%M:%S KST')] === PHASE 2F DEPLOYMENT WINDOW CLOSED ==="
    echo "[$(date '+%Y-%m-%d %H:%M:%S KST')] Total checkpoints: $CHECKPOINT_COUNT"
    break
  fi

  # Run checkpoint every 30 minutes
  sleep 5
  current_time=$(date +%s)

  if [ $((current_time - START_TIME)) -ge $((CHECKPOINT_COUNT * CHECKPOINT_INTERVAL)) ] && [ $current_time -lt $DEPLOYMENT_WINDOW_END ]; then
    log_checkpoint $CHECKPOINT_COUNT
    CHECKPOINT_COUNT=$((CHECKPOINT_COUNT + 1))
  fi
done

echo "Monitoring complete. Full report: $REPORT_FILE"
