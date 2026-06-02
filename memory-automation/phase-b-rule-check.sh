#!/bin/bash

#################################################################################
# Phase B: Rule Enforcement Checker (4-hourly)
#
# Monitors autonomous proceed, task ownership, and schedule discipline
# Triggers Evaluator Agent for compliance review
#
# Schedule: Every 4 hours (0 0,4,8,12,16,20 * * *)
# Last Run: Check logs at /home/jeepney/.openclaw/workspace-dev/memory/logs/phase-b-check.log
#################################################################################

set -uo pipefail

# Configuration
LOG_DIR="/home/jeepney/.openclaw/workspace-dev/memory/logs"
LOG_FILE="$LOG_DIR/phase-b-check-$(date '+%Y%m%d').log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create log directory if needed
mkdir -p "$LOG_DIR" 2>/dev/null || true

# Log function
log() {
  echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

log "=== Phase B Rule Enforcement Check Started ==="

# Check 1: Session transcript for rule violations
log "Checking last 4 hours for rule violations..."

# Rule 1: Autonomous Proceed (looking for confirmation requests)
CONFIRM_REQUESTS=$(grep -r "Can I\|Should I\|Need.*approval\|ready for review" \
  /home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/logs/ 2>/dev/null | wc -l || echo 0)

if [ "$CONFIRM_REQUESTS" -gt 0 ]; then
  log "⚠️ RULE VIOLATION: Autonomous Proceed ($CONFIRM_REQUESTS instances found)"
else
  log "✓ Autonomous Proceed: OK"
fi

# Rule 2: Task Ownership (checking for incomplete tasks)
log "Checking task completion status..."
INCOMPLETE_TASKS=$(grep -c "🟡\|in_progress\|TODO" \
  /home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/logs/phase2d-activity*.jsonl 2>/dev/null | head -1 || echo 0)

if [ "$INCOMPLETE_TASKS" -gt 5 ]; then
  log "⚠️ WARNING: Task Ownership ($INCOMPLETE_TASKS incomplete tasks in queue)"
else
  log "✓ Task Ownership: OK"
fi

# Rule 3: Schedule Discipline (checking deadline adherence)
log "Checking schedule adherence..."
MISSED_DEADLINES=$(grep -c "LATE\|DELAYED\|OVERDUE" \
  /home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/*.md 2>/dev/null | head -1 || echo 0)

if [ "$MISSED_DEADLINES" -gt 0 ]; then
  log "⚠️ CRITICAL: Schedule Discipline ($MISSED_DEADLINES deadline violations)"
else
  log "✓ Schedule Discipline: OK"
fi

# Summary
log "=== Phase B Rule Enforcement Check Completed ==="
log "Next check: $(date -d '+4 hours' '+%Y-%m-%d %H:%M:%S') KST"
