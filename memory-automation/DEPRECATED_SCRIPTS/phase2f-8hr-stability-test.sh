#!/bin/bash

# Phase 2F Gate — 8-Hour Stability Test
# Time window: 22:00 KST (2026-05-31) → 06:00 KST (2026-06-01)
# Purpose: Continuous monitoring, performance tracking, alert routing verification
# Target: Maintain 100% uptime across all 4 services with < 5000ms cycle time

set -e

STABILITY_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-stability-test.log"
ALERTS_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-alerts.log"
METRICS_DIR="/home/jeepney/.openclaw/workspace-dev/memory/logs/stability-metrics"
CYCLES_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-cycles.jsonl"
HOURLY_REPORT="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-hourly-report.txt"

# Configuration
TEST_DURATION_SECONDS=$((8 * 3600))  # 8 hours
CYCLE_INTERVAL=30                     # Check every 30 seconds (matches cron × 6)
PERFORMANCE_THRESHOLD=5000            # Max cycle time in ms
UPTIME_THRESHOLD=95                   # Min uptime percentage

# Service configuration
declare -A SERVICES=(
  ["phase2a"]="3009"
  ["phase2b"]="3010"
  ["phase2c"]="3011"
  ["dispatcher"]="9000"
)

# Initialize
mkdir -p "$METRICS_DIR"
exec 1> >(tee -a "$STABILITY_LOG")
exec 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 2F GATE - 8-HOUR STABILITY TEST ==="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Duration: $TEST_DURATION_SECONDS seconds (8 hours)"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Monitoring interval: $CYCLE_INTERVAL seconds"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Performance threshold: ${PERFORMANCE_THRESHOLD}ms"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Uptime threshold: ${UPTIME_THRESHOLD}%"
echo ""

# State tracking
declare -A service_uptime
declare -A service_last_check
declare -A service_total_checks
declare -A service_failed_checks

for service in "${!SERVICES[@]}"; do
  service_uptime["$service"]=100
  service_total_checks["$service"]=0
  service_failed_checks["$service"]=0
done

# Metrics
total_cycles=0
successful_cycles=0
failed_cycles=0
total_cycle_time=0
peak_cycle_time=0
alert_count=0
start_time=$(date +%s)

# Function: Check service health
check_service_health() {
  local service=$1
  local port=${SERVICES[$service]}

  if curl -sf http://127.0.0.1:$port/health > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Function: Run orchestration cycle
run_orchestration_cycle() {
  local cycle_start=$(date +%s%N)
  local phase2a_ok=0
  local phase2b_ok=0
  local phase2c_ok=0

  # Phase 2A: Collect messages
  if curl -sf -X POST http://127.0.0.1:3009/api/collect-memory \
    -H "Content-Type: application/json" \
    -d '{"path":"MEMORY.md","lines":100}' > /tmp/phase2a_cycle.json 2>&1; then
    phase2a_ok=1
  fi

  # Phase 2B: Detect duplicates (if 2A succeeded)
  if [ $phase2a_ok -eq 1 ]; then
    MESSAGES=$(python3 -c "import json; data=json.load(open('/tmp/phase2a_cycle.json')); print(json.dumps([{'id': 'mem', 'content': data.get('content', '')}]))" 2>/dev/null || echo "[]")

    if curl -sf -X POST http://127.0.0.1:3010/api/detect-duplicates \
      -H "Content-Type: application/json" \
      -d "{\"messages\": $MESSAGES}" > /tmp/phase2b_cycle.json 2>&1; then
      phase2b_ok=1
    fi
  fi

  # Phase 2C: Calculate trust scores (if 2B succeeded)
  if [ $phase2b_ok -eq 1 ]; then
    UNIQUE=$(python3 -c "import json; data=json.load(open('/tmp/phase2b_cycle.json')); print(json.dumps(data.get('unique', [])))" 2>/dev/null || echo "[]")

    if curl -sf -X POST http://127.0.0.1:3011/api/calculate-trust-scores \
      -H "Content-Type: application/json" \
      -d "{\"entries\": $UNIQUE, \"duplicates\": []}" > /tmp/phase2c_cycle.json 2>&1; then
      phase2c_ok=1
    fi
  fi

  local cycle_end=$(date +%s%N)
  local cycle_time=$(( (cycle_end - cycle_start) / 1000000 ))  # nanoseconds to milliseconds

  total_cycles=$((total_cycles + 1))
  total_cycle_time=$((total_cycle_time + cycle_time))

  if [ $cycle_time -gt $peak_cycle_time ]; then
    peak_cycle_time=$cycle_time
  fi

  if [ $phase2a_ok -eq 1 ] && [ $phase2b_ok -eq 1 ] && [ $phase2c_ok -eq 1 ]; then
    successful_cycles=$((successful_cycles + 1))

    # Log successful cycle
    echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"cycle\":$total_cycles,\"status\":\"success\",\"cycle_time_ms\":$cycle_time,\"phase2a\":\"ok\",\"phase2b\":\"ok\",\"phase2c\":\"ok\"}" >> "$CYCLES_LOG"

    return 0
  else
    failed_cycles=$((failed_cycles + 1))

    # Log failed cycle
    echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"cycle\":$total_cycles,\"status\":\"failed\",\"phase2a\":$([ $phase2a_ok -eq 1 ] && echo '"ok"' || echo '"failed"'),\"phase2b\":$([ $phase2b_ok -eq 1 ] && echo '"ok"' || echo '"failed"'),\"phase2c\":$([ $phase2c_ok -eq 1 ] && echo '"ok"' || echo '"failed"')}" >> "$CYCLES_LOG"

    # Send alert if critical
    if [ $failed_cycles -gt 3 ]; then
      send_alert "CRITICAL" "Pipeline Failure" "Phase 2 pipeline failed in cycles $((total_cycles - 3))-$total_cycles" "error_spike"
    fi

    return 1
  fi
}

# Function: Send alert
send_alert() {
  local severity=$1
  local name=$2
  local condition=$3
  local rule_id=$4

  alert_count=$((alert_count + 1))

  local alert_msg="{\"name\":\"$name\",\"severity\":\"$severity\",\"service\":\"Phase2Pipeline\",\"condition\":\"$condition\",\"message\":\"Alert #$alert_count at $(date '+%H:%M:%S')\"}"

  # Route to dispatcher
  curl -s -X POST http://127.0.0.1:9000/api/alert \
    -H "Content-Type: application/json" \
    -d "$alert_msg" > /dev/null 2>&1 &

  # Log alert
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  ALERT #$alert_count: $severity - $name ($rule_id)" >> "$ALERTS_LOG"
}

# Function: Generate hourly report
generate_hourly_report() {
  local hour_num=$1
  local avg_cycle_time=0

  if [ $successful_cycles -gt 0 ]; then
    avg_cycle_time=$((total_cycle_time / successful_cycles))
  fi

  local cycle_success_rate=0
  if [ $total_cycles -gt 0 ]; then
    cycle_success_rate=$((successful_cycles * 100 / total_cycles))
  fi

  {
    echo "========== HOURLY REPORT #$hour_num =========="
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "Cycle Statistics:"
    echo "  Total cycles: $total_cycles"
    echo "  Successful: $successful_cycles"
    echo "  Failed: $failed_cycles"
    echo "  Success rate: ${cycle_success_rate}%"
    echo ""
    echo "Performance:"
    echo "  Avg cycle time: ${avg_cycle_time}ms"
    echo "  Peak cycle time: ${peak_cycle_time}ms"
    echo "  Target: < ${PERFORMANCE_THRESHOLD}ms"
    echo ""
    echo "Alerts:"
    echo "  Total alerts: $alert_count"
    echo ""

    # Service uptime
    echo "Service Health:"
    for service in "${!SERVICES[@]}"; do
      local port=${SERVICES[$service]}
      if check_service_health "$service"; then
        echo "  ✅ $service (port $port): UP"
      else
        echo "  ❌ $service (port $port): DOWN"
      fi
    done
    echo ""
  } | tee -a "$HOURLY_REPORT"
}

# Function: Check for performance degradation
check_performance_degradation() {
  local avg_cycle_time=0

  if [ $successful_cycles -gt 0 ]; then
    avg_cycle_time=$((total_cycle_time / successful_cycles))
  fi

  if [ $avg_cycle_time -gt $PERFORMANCE_THRESHOLD ]; then
    send_alert "WARNING" "Slow Cycle Execution" "Average cycle time ${avg_cycle_time}ms exceeds ${PERFORMANCE_THRESHOLD}ms threshold" "slow_cycle"
  fi
}

# Function: Check for service downtime
check_service_downtime() {
  for service in "${!SERVICES[@]}"; do
    local port=${SERVICES[$service]}
    service_total_checks["$service"]=$((${service_total_checks["$service"]} + 1))

    if check_service_health "$service"; then
      # Service is up
      :
    else
      service_failed_checks["$service"]=$((${service_failed_checks["$service"]} + 1))
      send_alert "CRITICAL" "Service Down" "$service (port $port) not responding" "service_down"
    fi
  done
}

# Main monitoring loop
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting stability test loop..."
echo ""

current_hour=0
loop_start=$(date +%s)
last_hourly_report=$(date +%s)

while true; do
  current_time=$(date +%s)
  elapsed=$((current_time - loop_start))

  # Check if test duration exceeded
  if [ $elapsed -ge $TEST_DURATION_SECONDS ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stability test duration completed (${elapsed}s)"
    break
  fi

  # Run orchestration cycle
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cycle #$((total_cycles + 1))..."
  run_orchestration_cycle
  cycle_result=$?

  # Check service health
  check_service_downtime

  # Generate hourly report every hour
  hours_elapsed=$((elapsed / 3600))
  if [ $hours_elapsed -gt $current_hour ]; then
    current_hour=$hours_elapsed
    generate_hourly_report $((current_hour))
    check_performance_degradation
    echo ""
  fi

  # Wait before next cycle
  sleep $CYCLE_INTERVAL
done

# Final summary
echo ""
echo "========== STABILITY TEST SUMMARY =========="
echo "[$(date '+%Y-%m-%d %H:%M:%S')]"
echo ""

final_success_rate=0
if [ $total_cycles -gt 0 ]; then
  final_success_rate=$((successful_cycles * 100 / total_cycles))
fi

final_avg_time=0
if [ $successful_cycles -gt 0 ]; then
  final_avg_time=$((total_cycle_time / successful_cycles))
fi

echo "Test Duration: $((elapsed / 3600))h $((( elapsed % 3600 ) / 60))m"
echo ""
echo "Cycle Performance:"
echo "  Total cycles: $total_cycles"
echo "  Successful: $successful_cycles ($final_success_rate%)"
echo "  Failed: $failed_cycles"
echo "  Avg time: ${final_avg_time}ms"
echo "  Peak time: ${peak_cycle_time}ms"
echo ""
echo "Alerts Triggered: $alert_count"
echo ""

# Final decision
if [ $final_success_rate -ge $UPTIME_THRESHOLD ] && [ $peak_cycle_time -lt $PERFORMANCE_THRESHOLD ]; then
  echo "🟢 STABILITY TEST PASSED"
  echo ""
  echo "System is production-ready. Proceeding to Phase 6."
  exit 0
else
  echo "🔴 STABILITY TEST FAILED"
  echo ""
  if [ $final_success_rate -lt $UPTIME_THRESHOLD ]; then
    echo "❌ Uptime below threshold: ${final_success_rate}% < ${UPTIME_THRESHOLD}%"
  fi
  if [ $peak_cycle_time -ge $PERFORMANCE_THRESHOLD ]; then
    echo "❌ Performance below threshold: ${peak_cycle_time}ms >= ${PERFORMANCE_THRESHOLD}ms"
  fi
  exit 1
fi
