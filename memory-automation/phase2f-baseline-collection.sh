#!/bin/bash

# Phase 2F Gate — Baseline Collection
# Time window: 06:00-08:00 KST (2026-06-01)
# Purpose: Capture performance metrics after 8-hour stability test
# Deliverable: Baseline metrics for performance regression detection

set -e

BASELINE_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-collection.log"
BASELINE_DIR="/home/jeepney/.openclaw/workspace-dev/memory/logs/baseline-metrics"
BASELINE_REPORT="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json"

mkdir -p "$BASELINE_DIR"
exec 1> >(tee -a "$BASELINE_LOG")
exec 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 2F GATE - BASELINE COLLECTION ==="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Capturing performance metrics from 8-hour stability test"
echo ""

# Collect stability test metrics
collect_stability_metrics() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Analyzing 8-hour stability test logs..."

  if [ ! -f /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-stability-test.log ]; then
    echo "⚠️  Stability test log not found"
    return 1
  fi

  # Parse key metrics
  local total_cycles=$(grep -c "Cycle #" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-stability-test.log || echo "0")
  local total_alerts=$(grep -c "⚠️  ALERT" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-stability-test.log || echo "0")

  echo "✅ Collected: ${total_cycles} cycles, ${total_alerts} alerts"
  echo "$total_cycles $total_alerts"
}

# Collect cycle metrics from JSONL
collect_cycle_metrics() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Parsing cycle performance metrics..."

  local cycles_file="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-cycles.jsonl"

  if [ ! -f "$cycles_file" ]; then
    echo "⚠️  Cycles log not found"
    return 1
  fi

  local total_lines=$(wc -l < "$cycles_file")
  local successful=$(grep -c '"status":"success"' "$cycles_file" || echo "0")
  local failed=$(grep -c '"status":"failed"' "$cycles_file" || echo "0")

  # Calculate average cycle time
  local avg_time=0
  if [ $successful -gt 0 ]; then
    avg_time=$(python3 << 'PYTHON_EOF'
import json
total_time = 0
count = 0
with open('/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-cycles.jsonl') as f:
  for line in f:
    try:
      data = json.loads(line)
      if data.get('status') == 'success' and 'cycle_time_ms' in data:
        total_time += data['cycle_time_ms']
        count += 1
    except:
      pass
if count > 0:
  print(int(total_time / count))
else:
  print(0)
PYTHON_EOF
)
  fi

  echo "✅ Cycles: $successful successful, $failed failed (avg: ${avg_time}ms)"
  echo "$successful $failed $avg_time"
}

# Collect service uptime metrics
collect_service_uptime() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Calculating service uptime metrics..."

  local uptime_file="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-hourly-report.txt"

  if [ ! -f "$uptime_file" ]; then
    echo "⚠️  Hourly report not found, estimating from cycles"
    echo "0 0 0"
    return
  fi

  # Extract final service status
  local phase2a="UP"
  local phase2b="UP"
  local phase2c="UP"
  local dispatcher="UP"

  if grep -q "phase2a.*DOWN" "$uptime_file"; then
    phase2a="DOWN"
  fi
  if grep -q "phase2b.*DOWN" "$uptime_file"; then
    phase2b="DOWN"
  fi
  if grep -q "phase2c.*DOWN" "$uptime_file"; then
    phase2c="DOWN"
  fi
  if grep -q "dispatcher.*DOWN" "$uptime_file"; then
    dispatcher="DOWN"
  fi

  echo "✅ Services: Phase2A=$phase2a, Phase2B=$phase2b, Phase2C=$phase2c, Dispatcher=$dispatcher"
  echo "$phase2a $phase2b $phase2c $dispatcher"
}

# Collect memory state
collect_memory_state() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Capturing memory file baseline..."

  local memory_file="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/MEMORY.md"

  if [ ! -f "$memory_file" ]; then
    echo "⚠️  MEMORY.md not found"
    return 1
  fi

  local line_count=$(wc -l < "$memory_file")
  local checksum=$(md5sum "$memory_file" | awk '{print $1}')
  local size=$(du -h "$memory_file" | awk '{print $1}')

  echo "✅ MEMORY.md: $line_count lines, ${size}, checksum=$checksum"
  echo "$line_count $size $checksum"
}

# Collect system resources
collect_system_resources() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Capturing system resource metrics..."

  # Disk usage
  local disk_usage=$(df -h / | awk 'NR==2 {print $5}')

  # Memory usage (approximate from free)
  local memory_used=$(free -h | awk 'NR==2 {print $3}')

  # Check log directory size
  local logs_size=$(du -sh /home/jeepney/.openclaw/workspace-dev/memory/logs 2>/dev/null | awk '{print $1}')

  echo "✅ Resources: Disk ${disk_usage}, Memory ${memory_used}, Logs ${logs_size}"
  echo "$disk_usage $memory_used $logs_size"
}

# Create baseline JSON report
create_baseline_report() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Generating baseline report..."

  read total_cycles total_alerts < <(collect_stability_metrics)
  read successful failed avg_time < <(collect_cycle_metrics)
  read p2a p2b p2c disp < <(collect_service_uptime)
  read mem_lines mem_size mem_checksum < <(collect_memory_state)
  read disk_usage mem_usage logs_size < <(collect_system_resources)

  cat > "$BASELINE_REPORT" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "phase": "2F_baseline_collection",
  "stability_test": {
    "total_cycles": $total_cycles,
    "total_alerts": $total_alerts
  },
  "cycle_performance": {
    "successful": $successful,
    "failed": $failed,
    "average_cycle_time_ms": $avg_time,
    "success_rate_percent": $([ $((successful + failed)) -gt 0 ] && echo $((successful * 100 / (successful + failed))) || echo 0)
  },
  "service_uptime": {
    "phase2a": "$p2a",
    "phase2b": "$p2b",
    "phase2c": "$p2c",
    "dispatcher": "$disp"
  },
  "memory_metrics": {
    "line_count": $mem_lines,
    "size": "$mem_size",
    "checksum": "$mem_checksum"
  },
  "system_resources": {
    "disk_usage_percent": "$disk_usage",
    "memory_used": "$mem_usage",
    "logs_size": "$logs_size"
  },
  "regression_thresholds": {
    "cycle_time_max_ms": 5000,
    "uptime_min_percent": 95,
    "services_min_up": 4
  }
}
EOF

  echo "✅ Baseline report created: $BASELINE_REPORT"
}

# Main execution
main() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting baseline collection..."
  echo ""

  create_baseline_report

  echo ""
  echo "========== BASELINE COLLECTION COMPLETE =========="
  echo ""
  echo "Baseline metrics captured:"
  echo "  ✅ Stability test summary"
  echo "  ✅ Cycle performance metrics"
  echo "  ✅ Service uptime status"
  echo "  ✅ Memory file state"
  echo "  ✅ System resource usage"
  echo ""
  echo "Baseline report: $BASELINE_REPORT"
  echo ""
  echo "These metrics will be used for:"
  echo "  - Regression detection in future deployments"
  echo "  - Performance baseline comparisons"
  echo "  - Capacity planning"
  echo ""
  echo "Next phase (08:00 KST):"
  echo "  Final Validation — Regression testing and sign-off"
  echo ""
}

main
