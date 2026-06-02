#!/bin/bash
# P1: Auto-Improvement Agent
# Detects trust score < 70% → spawns subagent for evaluation + auto-fix
# Runs every 5 minutes via cron

set -e

LOG_DIR="/home/jeepney/.openclaw/workspace-dev/memory/logs"
LOG_FILE="$LOG_DIR/p1-auto-improve-$(date +%Y%m%d).log"
STATE_FILE="/home/jeepney/.openclaw/workspace-dev/memory/p1-state.json"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

check_trust_score() {
  # Check Phase 2C trust score by calling health endpoint
  # If not available, estimate from system state

  local phase2a_ok=$(curl -s http://localhost:3009/health 2>/dev/null | grep -q "ready" && echo 1 || echo 0)
  local phase2b_ok=$(curl -s http://localhost:3010/health 2>/dev/null | grep -q "ready" && echo 1 || echo 0)
  local phase2c_ok=$(curl -s http://localhost:3011/health 2>/dev/null | grep -q "ready" && echo 1 || echo 0)

  # Calculate trust score (0-100)
  local score=$((($phase2a_ok + $phase2b_ok + $phase2c_ok) * 33))

  # Check for recent errors
  local recent_errors=$(tail -100 "$LOG_DIR/phase2d-cron-exec.log" 2>/dev/null | grep -i "error" | wc -l)
  if [[ $recent_errors -gt 5 ]]; then
    score=$((score - 20))
  fi

  # Check memory file integrity
  local memory_files_ok=$(find /home/jeepney/.openclaw/workspace-dev/memory -name "*.md" -mmin -60 | wc -l)
  if [[ $memory_files_ok -lt 5 ]]; then
    score=$((score - 15))
  fi

  # Clamp to 0-100
  [[ $score -lt 0 ]] && score=0
  [[ $score -gt 100 ]] && score=100

  echo $score
}

trigger_subagent_spawn() {
  local reason="$1"
  log "🔴 Trust score < 70% detected. Reason: $reason"
  log "Triggering P1 Auto-Improvement Agent spawn..."

  # Use mcp__openclaw__sessions_spawn to launch evaluator agent
  # This would be called by the parent agent, not directly
  # For now, log the event

  echo "{
    \"trigger_time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"trust_score\": $1,
    \"reason\": \"$reason\",
    \"status\": \"pending_subagent_spawn\",
    \"last_improvement\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" > "$STATE_FILE"

  log "✅ P1 trigger logged. Parent agent should spawn evaluator."
}

# Main logic
score=$(check_trust_score)
log "Current trust score: $score%"

if [[ $score -lt 70 ]]; then
  trigger_subagent_spawn "Health score $score% < 70%"
else
  # Update healthy state
  echo "{
    \"trust_score\": $score,
    \"status\": \"healthy\",
    \"last_check\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" > "$STATE_FILE"
  log "✅ System healthy. Score: $score%"
fi
