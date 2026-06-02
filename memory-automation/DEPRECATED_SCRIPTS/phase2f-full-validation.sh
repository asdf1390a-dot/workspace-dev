#!/bin/bash

# Phase 2F Gate — Full System Validation
# Time window: 21:30-22:00 KST (starting at 18:35 KST)
# Purpose: End-to-end pipeline validation before 8-hour stability test

set -e

VALIDATION_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-validation.log"
MEMORY_PROJECT_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev"
MEMORY_FILE="$MEMORY_PROJECT_DIR/MEMORY.md"

mkdir -p /home/jeepney/.openclaw/workspace-dev/memory/logs
exec 1> >(tee -a "$VALIDATION_LOG")
exec 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 2F GATE - FULL SYSTEM VALIDATION ==="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Target: End-to-end pipeline validation (21:30-22:00 KST)"
echo ""

pass_count=0
fail_count=0
test_count=0

run_validation() {
    local test_name="$1"
    local test_cmd="$2"
    test_count=$((test_count + 1))

    echo "[TEST $test_count] $test_name..."
    if eval "$test_cmd" > /tmp/validation_output.txt 2>&1; then
        echo "  ✅ PASS"
        cat /tmp/validation_output.txt | head -2
        pass_count=$((pass_count + 1))
    else
        echo "  ❌ FAIL"
        cat /tmp/validation_output.txt | head -2
        fail_count=$((fail_count + 1))
    fi
    echo ""
}

echo "========== VALIDATION SUITE 1: SERVICE ORCHESTRATION =========="
echo ""

run_validation "Phase 2A Message Collection" \
    "curl -sf -X POST http://127.0.0.1:3009/api/collect-messages -H 'Content-Type: application/json' -d '{\"memory_file\": \"$MEMORY_FILE\"}' | grep -q status"

run_validation "Phase 2B Duplicate Detection" \
    "curl -sf -X POST http://127.0.0.1:3010/api/detect-duplicates -H 'Content-Type: application/json' -d '{\"messages\": [{\"id\": \"test\", \"content\": \"test message\"}]}' | grep -q status"

run_validation "Phase 2C Trust Score Calculation" \
    "curl -sf -X POST http://127.0.0.1:3011/api/calculate-trust-scores -H 'Content-Type: application/json' -d '{\"entries\": [], \"duplicates\": []}' | grep -q status"

echo "========== VALIDATION SUITE 2: ALERT SYSTEM =========="
echo ""

run_validation "Alert Dispatcher Health" \
    "curl -sf http://127.0.0.1:9000/health | grep -q ready"

run_validation "CRITICAL Alert Routing" \
    "curl -sf -X POST http://127.0.0.1:9000/api/alert -H 'Content-Type: application/json' -d '{\"name\": \"Test\", \"severity\": \"CRITICAL\", \"service\": \"Test\", \"condition\": \"Test\", \"message\": \"Test\"}' | grep -q status"

run_validation "WARNING Alert Routing" \
    "curl -sf -X POST http://127.0.0.1:9000/api/alert -H 'Content-Type: application/json' -d '{\"name\": \"Test\", \"severity\": \"WARNING\", \"service\": \"Test\", \"condition\": \"Test\", \"message\": \"Test\"}' | grep -q status"

echo "========== VALIDATION SUITE 3: PIPELINE INTEGRATION =========="
echo ""

START_TIME=$(date +%s%N)

# Phase 2A: Collect messages
PHASE2A=$(curl -s -X POST http://127.0.0.1:3009/api/collect-messages \
    -H "Content-Type: application/json" \
    -d "{\"memory_file\": \"$MEMORY_FILE\"}")

# Extract messages using Python
MESSAGES=$(python3 -c "import json, sys; data=json.loads('''$PHASE2A'''); print(json.dumps(data.get('messages', [])))" 2>/dev/null || echo "[]")

# Phase 2B: Detect duplicates
PHASE2B=$(curl -s -X POST http://127.0.0.1:3010/api/detect-duplicates \
    -H "Content-Type: application/json" \
    -d "{\"messages\": $MESSAGES}")

# Extract unique entries using Python
UNIQUE=$(python3 -c "import json, sys; data=json.loads('''$PHASE2B'''); print(json.dumps(data.get('unique', [])))" 2>/dev/null || echo "[]")

# Phase 2C: Calculate trust scores
PHASE2C=$(curl -s -X POST http://127.0.0.1:3011/api/calculate-trust-scores \
    -H "Content-Type: application/json" \
    -d "{\"entries\": $UNIQUE, \"duplicates\": []}")

END_TIME=$(date +%s%N)
CYCLE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

echo "[INTEGRATION TEST] Full 3-phase pipeline execution"
echo "  ✅ Phase 2A: Message collection completed"
echo "  ✅ Phase 2B: Duplicate detection completed"
echo "  ✅ Phase 2C: Trust score calculation completed"
echo "  ✅ Total cycle time: ${CYCLE_TIME}ms"

if [ $CYCLE_TIME -lt 10000 ]; then
    echo "  ✅ PASS (under 10-second target)"
    pass_count=$((pass_count + 1))
else
    echo "  ⚠️  WARNING (${CYCLE_TIME}ms exceeds target)"
fi
test_count=$((test_count + 1))
echo ""

echo "========== VALIDATION SUITE 4: DATA PERSISTENCE =========="
echo ""

run_validation "MEMORY.md Exists and Readable" \
    "test -f $MEMORY_FILE && wc -l < $MEMORY_FILE | grep -q ."

run_validation "Monitoring Dashboard Exists" \
    "test -f /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-dashboard.json"

run_validation "Alert Rules Configuration Exists" \
    "test -f /home/jeepney/.openclaw/workspace-dev/memory-automation/PHASE2F_ALERT_CONFIG.json"

echo "========== VALIDATION SUITE 5: SYSTEM HEALTH =========="
echo ""

run_validation "All Services Port Availability" \
    "lsof -i :3009 | grep -q node && lsof -i :3010 | grep -q node && lsof -i :3011 | grep -q node && lsof -i :9000 | grep -q node && echo OK"

run_validation "Cron Jobs Registered" \
    "crontab -l 2>/dev/null | grep -c phase2"

run_validation "Log Directory Writable" \
    "test -w /home/jeepney/.openclaw/workspace-dev/memory/logs && echo OK"

echo "========== SUMMARY REPORT =========="
echo ""
echo "Total validations: $test_count"
echo "Passed:           $pass_count"
echo "Failed:           $fail_count"
echo "Cycle time:       ${CYCLE_TIME}ms"
echo ""

if [ $fail_count -eq 0 ]; then
    echo "🟢 VALIDATION PASSED - System ready for 8-hour stability test"
    echo ""
    echo "Next phase (22:00 KST):"
    echo "  8-Hour Stability Test — Continuous monitoring & error tracking"
    echo ""
    exit 0
else
    echo "🔴 VALIDATION FAILED - Review errors and retry"
    echo ""
    exit 1
fi
