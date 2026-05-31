#!/bin/bash

# Phase 2F Continuous Monitoring (12:31 - 17:00 KST)
# Monitors Phase 2A/2B health, system resources, and logs

BASE_DIR="/home/jeepney/.openclaw/workspace-dev"
LOG_DIR="$BASE_DIR/memory/logs"
MONITOR_LOG="$LOG_DIR/phase2f-monitoring-$(date +%Y%m%d).log"

log_entry() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S KST')
  echo "[$timestamp] $1" | tee -a "$MONITOR_LOG"
}

check_health() {
  log_entry "=== Health Check ==="

  # Phase 2A
  local phase2a=$(curl -s http://localhost:3009/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  if [ -z "$phase2a" ]; then
    log_entry "🔴 Phase 2A NOT RESPONDING"
  else
    log_entry "✅ Phase 2A: $phase2a"
  fi

  # Phase 2B
  local phase2b=$(curl -s http://localhost:3010/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  if [ -z "$phase2b" ]; then
    log_entry "🔴 Phase 2B NOT RESPONDING"
  else
    log_entry "✅ Phase 2B: $phase2b"
  fi

  # System resources
  local disk=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  local memory=$(free -h | awk '/^Mem:/ {print $3 "/" $2}')
  log_entry "Disk: $disk% | Memory: $memory"

  log_entry ""
}

# Run initial check
check_health

# Schedule next check in 30 minutes
next_check=$(( $(date +%s) + 1800 ))
log_entry "Next check scheduled at $(date -d @$next_check '+%H:%M:%S KST')"

# Keep script running for monitoring
while true; do
  current_time=$(date +%s)
  if [ $current_time -ge $next_check ]; then
    check_health
    next_check=$(( $(date +%s) + 1800 ))
    log_entry "Next check scheduled at $(date -d @$next_check '+%H:%M:%S KST')"
  fi
  sleep 30
done
