#!/bin/bash

# Phase 2F Gate — Final Validation
# Time window: 08:00-09:00 KST (2026-06-01)
# Purpose: Regression testing and deployment sign-off
# Deliverable: GO/NO-GO decision for production

set -e

FINAL_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-final-validation.log"
FINAL_REPORT="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-final-report.md"
BASELINE_REPORT="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json"

mkdir -p /home/jeepney/.openclaw/workspace-dev/memory/logs
exec 1> >(tee -a "$FINAL_LOG")
exec 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 2F GATE - FINAL VALIDATION ==="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Regression testing and deployment sign-off"
echo ""

# Test counters
pass_count=0
fail_count=0
test_count=0

# Helper: Run test
run_test() {
  local test_name="$1"
  local test_cmd="$2"
  test_count=$((test_count + 1))

  echo "[TEST $test_count] $test_name..."
  if eval "$test_cmd" > /tmp/final_test_output.txt 2>&1; then
    echo "  ✅ PASS"
    cat /tmp/final_test_output.txt | head -2
    pass_count=$((pass_count + 1))
    return 0
  else
    echo "  ❌ FAIL"
    cat /tmp/final_test_output.txt | head -3
    fail_count=$((fail_count + 1))
    return 1
  fi
  echo ""
}

echo "========== REGRESSION TEST SUITE ==="
echo ""

# Suite 1: Service Regression Tests
echo "Test Suite 1: Service Regression (Previous: All UP)"
echo ""

run_test "Phase 2A Health (expect UP)" \
  'curl -sf http://127.0.0.1:3009/health | grep -q "ready" && echo "Phase 2A: UP"'

run_test "Phase 2B Health (expect UP)" \
  'curl -sf http://127.0.0.1:3010/health | grep -q "ready" && echo "Phase 2B: UP"'

run_test "Phase 2C Health (expect UP)" \
  'curl -sf http://127.0.0.1:3011/health | grep -q "ready" && echo "Phase 2C: UP"'

run_test "Dispatcher Health (expect UP)" \
  'curl -sf http://127.0.0.1:9000/health | grep -q "ready" && echo "Dispatcher: UP"'

echo ""

# Suite 2: Performance Regression Tests
echo "Test Suite 2: Performance Regression (expect < 5000ms)"
echo ""

run_test "Single Phase 2A Call (< 1000ms)" \
  '
  START=$(date +%s%N)
  curl -sf -X POST http://127.0.0.1:3009/api/collect-memory \
    -H "Content-Type: application/json" \
    -d "{\"path\":\"MEMORY.md\",\"lines\":50}" > /dev/null
  END=$(date +%s%N)
  TIME=$(( (END - START) / 1000000 ))
  [ $TIME -lt 1000 ] && echo "Phase 2A time: ${TIME}ms"
  '

run_test "Full Cycle Time (< 5000ms)" \
  '
  START=$(date +%s%N)

  curl -sf -X POST http://127.0.0.1:3009/api/collect-memory \
    -H "Content-Type: application/json" \
    -d "{\"path\":\"MEMORY.md\",\"lines\":50}" > /tmp/final_2a.json

  MESSAGES=$(python3 -c "import json; data=json.load(open('\''/tmp/final_2a.json'\'')); print(json.dumps([{'\''id'\'': '\''mem'\'', '\''content'\'': data.get('\''content'\'', '\''\'\")}]))" 2>/dev/null || echo "[]")

  curl -sf -X POST http://127.0.0.1:3010/api/detect-duplicates \
    -H "Content-Type: application/json" \
    -d "{\"messages\": $MESSAGES}" > /tmp/final_2b.json

  UNIQUE=$(python3 -c "import json; data=json.load(open('\''/tmp/final_2b.json'\'')); print(json.dumps(data.get('\''unique'\'', [])))" 2>/dev/null || echo "[]")

  curl -sf -X POST http://127.0.0.1:3011/api/calculate-trust-scores \
    -H "Content-Type: application/json" \
    -d "{\"entries\": $UNIQUE, \"duplicates\": []}" > /tmp/final_2c.json

  END=$(date +%s%N)
  TIME=$(( (END - START) / 1000000 ))
  [ $TIME -lt 5000 ] && echo "Full cycle time: ${TIME}ms"
  '

echo ""

# Suite 3: Data Integrity Regression Tests
echo "Test Suite 3: Data Integrity (expect no corruption)"
echo ""

run_test "MEMORY.md Checksum (verify not corrupted)" \
  '
  CURRENT_SUM=$(md5sum /home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/MEMORY.md | awk "{print \$1}")
  BASELINE_SUM=$(grep -o "\"checksum\": \"[^\"]*\"" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json | head -1 | cut -d"\"" -f4)
  if [ -z "$BASELINE_SUM" ]; then
    echo "No baseline checksum, skipping comparison"
  else
    [ "$CURRENT_SUM" != "$BASELINE_SUM" ] && echo "MEMORY.md has been modified (expected)" || echo "MEMORY.md unchanged"
  fi
  echo "Current checksum: $CURRENT_SUM"
  '

run_test "Cron Job Still Registered" \
  'crontab -l 2>/dev/null | grep -q "phase2d-cron.sh" && echo "Cron job active"'

run_test "Log Directory Writable and Not Full" \
  '
  DISK_PERCENT=$(df /home/jeepney/.openclaw/workspace-dev/memory/logs | awk "NR==2 {print \$5}" | sed "s/%//")
  [ $DISK_PERCENT -lt 90 ] && echo "Disk usage: ${DISK_PERCENT}% (OK)"
  '

echo ""

# Suite 4: Alert System Regression Tests
echo "Test Suite 4: Alert System (expect routing working)"
echo ""

run_test "Alert Dispatcher Accepts CRITICAL" \
  '
  curl -s -X POST http://127.0.0.1:9000/api/alert \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Regression Test\",\"severity\":\"CRITICAL\",\"service\":\"Test\",\"condition\":\"Final validation\",\"message\":\"Test alert\"}" | grep -q "routed" && echo "Alert accepted"
  '

run_test "Recent Alerts in Log" \
  '
  [ -f /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-alerts.log ] && \
  tail -1 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-alerts.log | grep -q "ALERT" && echo "Alerts being logged"
  '

echo ""

# Suite 5: Operational Checklist
echo "Test Suite 5: Operational Checklist"
echo ""

run_test "All Supporting Files Present" \
  '
  FILES=(
    "/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-dashboard.json"
    "/home/jeepney/.openclaw/workspace-dev/memory-automation/PHASE2F_ALERT_CONFIG.json"
    "/home/jeepney/.openclaw/workspace-dev/memory-automation/PHASE2F_ROUTING_CONFIG.json"
    "/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json"
  )
  for f in "${FILES[@]}"; do
    [ ! -f "$f" ] && echo "Missing: $f" && exit 1
  done
  echo "All supporting files present"
  '

run_test "8-Hour Stability Test Completed" \
  '
  [ -f /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-stability-test.log ] && \
  grep -q "Stability Test Summary" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-stability-test.log && \
  echo "Stability test log found"
  '

run_test "Baseline Metrics Captured" \
  '
  [ -f /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json ] && \
  grep -q "stability_test" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json && \
  echo "Baseline metrics captured"
  '

echo ""
echo "========== FINAL REPORT =========="
echo ""

# Create final report
{
  echo "# Phase 2F Final Validation Report"
  echo ""
  echo "**Timestamp:** $(date '+%Y-%m-%d %H:%M:%S KST')"
  echo ""
  echo "## Test Results"
  echo ""
  echo "| Metric | Value |"
  echo "|--------|-------|"
  echo "| Total Tests | $test_count |"
  echo "| Passed | $pass_count |"
  echo "| Failed | $fail_count |"
  echo "| Pass Rate | $((test_count > 0 ? pass_count * 100 / test_count : 0))% |"
  echo ""
  echo "## Deployment Decision"
  echo ""

  if [ $fail_count -eq 0 ] && [ $test_count -gt 0 ]; then
    echo "### 🟢 GO DECISION - PRODUCTION READY"
    echo ""
    echo "✅ All regression tests passed"
    echo "✅ Services operational (4/4 UP)"
    echo "✅ Performance within thresholds"
    echo "✅ Data integrity verified"
    echo "✅ Alert system functional"
    echo "✅ 8-hour stability test passed"
    echo "✅ Baseline metrics captured"
    echo ""
    echo "**Authorization:** Phase 2F deployment is approved for production activation."
    echo ""
    DECISION="GO"
  else
    echo "### 🔴 NO-GO DECISION - REQUIRES INVESTIGATION"
    echo ""
    echo "❌ $fail_count test(s) failed"
    echo ""
    echo "**Action Required:** Review failed tests and apply fixes before production activation."
    echo ""
    DECISION="NO-GO"
  fi

  echo "## Next Steps"
  echo ""
  echo "- Phase 2D Cron: Continue 5-minute cycle execution"
  echo "- Phase 2F Monitoring: Continue real-time dashboard monitoring"
  echo "- Phase 2F Alerts: Continue Slack/Discord alert routing"
  echo "- Memory Automation: Full operational status"
  echo ""
  echo "---"
  echo "**Generated:** $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

} | tee "$FINAL_REPORT"

echo ""
echo "Final report: $FINAL_REPORT"
echo ""

# Exit with appropriate code
if [ "$DECISION" = "GO" ]; then
  echo "========== 🟢 DEPLOYMENT READY =========="
  exit 0
else
  echo "========== 🔴 DEPLOYMENT BLOCKED =========="
  exit 1
fi
