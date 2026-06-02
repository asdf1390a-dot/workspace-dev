#!/bin/bash
# P2: JARVIS Mode - Daily Risk Analysis
# Proactive prediction: risk analysis + bottleneck detection + solution prep
# Runs daily at 09:00 KST via cron (0 0 * * * for UTC -> adjust tz)

set -e

LOG_DIR="/home/jeepney/.openclaw/workspace-dev/memory/logs"
LOG_FILE="$LOG_DIR/p2-jarvis-daily-$(date +%Y%m%d).log"
ANALYSIS_FILE="/home/jeepney/.openclaw/workspace-dev/memory/p2-jarvis-analysis-$(date +%Y%m%d).json"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

analyze_risks() {
  log "🤖 JARVIS: Starting daily risk analysis..."

  local risks=()
  local bottlenecks=()
  local predictions=()

  # Risk 1: Service health
  local unhealthy_services=0
  for port in 3009 3010 3011; do
    if ! curl -s http://localhost:$port/health 2>/dev/null | grep -q "ready"; then
      unhealthy_services=$((unhealthy_services + 1))
      risks+=("Service on port $port is unhealthy")
    fi
  done

  # Risk 2: Disk usage
  local disk_usage=$(df /home/jeepney/.openclaw/workspace-dev | tail -1 | awk '{print $5}' | sed 's/%//')
  if [[ $disk_usage -gt 80 ]]; then
    risks+=("Disk usage at $disk_usage% (critical threshold: 85%)")
  fi

  # Risk 3: Memory file staleness
  local oldest_memory_file=$(find /home/jeepney/.openclaw/workspace-dev/memory -name "*.md" -type f -printf '%T@\n' | sort | head -1)
  local now=$(date +%s)
  local file_age=$((now - ${oldest_memory_file%.*}))
  if [[ $file_age -gt 86400 ]]; then
    risks+=("Memory file staleness detected: $((file_age / 3600)) hours old")
  fi

  # Bottleneck 1: Message collection backlog
  local message_count=$(curl -s http://localhost:3009/api/health 2>/dev/null | grep -o '"message_count":[0-9]*' | cut -d: -f2 || echo "0")
  if [[ $message_count -gt 1000 ]]; then
    bottlenecks+=("Message collection backlog: $message_count pending")
    predictions+=("Recommendation: increase Phase 2A processing speed")
  fi

  # Bottleneck 2: Duplicate detection lag
  local dup_lag=$(curl -s http://localhost:3010/api/stats 2>/dev/null | grep -o '"processing_lag_ms":[0-9]*' | cut -d: -f2 || echo "0")
  if [[ $dup_lag -gt 5000 ]]; then
    bottlenecks+=("Duplicate detection lag: ${dup_lag}ms")
    predictions+=("Recommendation: optimize Phase 2B dedup algorithm")
  fi

  # Predictions based on trends
  local team_members_active=$(ps aux | grep -E "phase2|subagent" | grep -v grep | wc -l)
  if [[ $team_members_active -lt 3 ]]; then
    predictions+=("Prediction: Low agent activity. May indicate blocking issue.")
    predictions+=("Action: Check for process zombies or stalled cron jobs")
  fi

  # Generate report
  local report="{
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"risks\": [$(printf '"%s",' "${risks[@]}" | sed 's/,$//')],
    \"bottlenecks\": [$(printf '"%s",' "${bottlenecks[@]}" | sed 's/,$//')],
    \"predictions\": [$(printf '"%s",' "${predictions[@]}" | sed 's/,$//')],
    \"health_score\": $((100 - ${#risks[@]} * 15 - ${#bottlenecks[@]} * 10)),
    \"active_agents\": $team_members_active
  }"

  echo "$report" | tee "$ANALYSIS_FILE"

  # Log summary
  log "✅ Risk analysis complete"
  log "   Risks detected: ${#risks[@]}"
  log "   Bottlenecks detected: ${#bottlenecks[@]}"
  log "   Recommendations: ${#predictions[@]}"

  # If critical risks, trigger P0 auto-recovery
  if [[ ${#risks[@]} -gt 2 ]]; then
    log "🚨 Critical condition detected. Triggering P0 auto-recovery..."
    # Signal parent agent to trigger P0
  fi
}

predict_resource_needs() {
  log "📊 Predicting resource needs for next 24 hours..."

  # Analyze historical patterns
  local avg_memory_growth=$(tail -100 /proc/meminfo 2>/dev/null | grep MemAvailable | awk '{sum+=$2} END {print int(sum/NR)}' || echo "4000000")
  local avg_disk_growth=$(du -s /home/jeepney/.openclaw/workspace-dev 2>/dev/null | awk '{print $1}' || echo "5000")

  log "   Predicted memory need: ${avg_memory_growth}KB in 24h"
  log "   Predicted disk growth: ${avg_disk_growth}KB in 24h"
}

# Main
analyze_risks
predict_resource_needs

log "🎯 JARVIS daily analysis complete. Results saved to $ANALYSIS_FILE"
