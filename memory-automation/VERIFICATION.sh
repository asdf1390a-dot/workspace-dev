#!/bin/bash

###############################################################################
# Phase 2 Refactoring — Verification Script
# Validates all new modules, tests, and integration
###############################################################################

set -uo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

function check() {
  local name=$1
  local cmd=$2

  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $name"
    ((FAIL++))
  fi
}

function checkFileExists() {
  local file=$1
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} File exists: $file"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} File missing: $file"
    ((FAIL++))
  fi
}

function checkModuleLoads() {
  local module=$1
  if node -e "require('./$module')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Module loads: $module"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} Module fails to load: $module"
    ((FAIL++))
  fi
}

echo "========== Phase 2 Refactoring Verification =========="
echo ""

# =========================================================================
# 1. New Modules Exist
# =========================================================================
echo "1. New Modules"
checkFileExists "queue.js"
checkFileExists "logger.js"
checkFileExists "monitoring.js"
checkFileExists "cron-orchestrator.js"
echo ""

# =========================================================================
# 2. Modules Load Without Errors
# =========================================================================
echo "2. Module Loading"
checkModuleLoads "queue.js"
checkModuleLoads "logger.js"
checkModuleLoads "monitoring.js"
checkModuleLoads "cron-orchestrator.js"
echo ""

# =========================================================================
# 3. Refactored Modules Exist
# =========================================================================
echo "3. Refactored Modules"
checkFileExists "phase2a-message-collection.js"
checkFileExists "phase2b-duplicate-detection.js"
checkFileExists "phase2c-trust-score-calculator.js"
echo ""

# =========================================================================
# 4. Test Suite Exists and Passes
# =========================================================================
echo "4. Test Suite"
checkFileExists "test-refactoring.js"
check "All 35 tests pass" "node test-refactoring.js 2>&1 | grep -q 'All tests passed'"
echo ""

# =========================================================================
# 5. Documentation Complete
# =========================================================================
echo "5. Documentation"
checkFileExists "DEPLOYMENT_CHECKLIST.md"
checkFileExists "MONITORING_GUIDE.md"
checkFileExists "REFACTORING_SUMMARY.md"
echo ""

# =========================================================================
# 6. New Directories Created
# =========================================================================
echo "6. Directory Structure"
check "Queue directory exists" "[ -d './queue' ]"
check "Metrics directory exists" "[ -d './metrics' ]"
check "Logs directory exists" "[ -d './logs' ]"
echo ""

# =========================================================================
# 7. Phase2a Integration (if running)
# =========================================================================
echo "7. Phase2a Runtime Integration"
if pgrep -f "phase2a-message-collection" > /dev/null; then
  echo -e "${GREEN}✓${NC} phase2a process running"
  ((PASS++))

  # Check health endpoint
  if curl -s http://localhost:3009/health 2>/dev/null | grep -q "ready"; then
    echo -e "${GREEN}✓${NC} phase2a health endpoint responds"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} phase2a health endpoint not responding"
    ((FAIL++))
  fi

  # Check status endpoint has queue info
  if curl -s http://localhost:3009/api/status 2>/dev/null | grep -q "queue"; then
    echo -e "${GREEN}✓${NC} phase2a status includes queue info"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} phase2a status missing queue info"
    ((FAIL++))
  fi
else
  echo -e "${YELLOW}⊝${NC} phase2a not running (optional for verification)"
fi
echo ""

# =========================================================================
# 8. Queue Operations (if not running, test offline)
# =========================================================================
echo "8. Queue Operations"
check "Queue can enqueue" "node -e \"const {FileQueue} = require('./queue'); const q = new FileQueue('./test-queue-verify'); q.enqueue({test:'msg'}); process.exit(q.length() === 1 ? 0 : 1)\""
check "Queue can dequeue" "node -e \"const {FileQueue} = require('./queue'); const q = new FileQueue('./test-queue-verify'); const msgs = q.dequeueAll(); process.exit(msgs.length === 1 ? 0 : 1)\""
echo ""

# =========================================================================
# 9. Logger Operations
# =========================================================================
echo "9. Logger Operations"
check "Logger creates error log" "node -e \"const {Logger} = require('./logger'); const l = new Logger('./test-logs-verify'); l.error('test'); process.exit(0)\" && [ -f './test-logs-verify/errors-'*'.log' ]"
check "Logger has required methods" "node -e \"const {Logger} = require('./logger'); const l = new Logger('./test-logs-verify'); process.exit((typeof l.debug === 'function' && typeof l.warn === 'function' && typeof l.error === 'function' && typeof l.critical === 'function') ? 0 : 1)\""
echo ""

# =========================================================================
# 10. Monitoring Operations
# =========================================================================
echo "10. Monitoring Operations"
check "Monitoring tracks metrics" "node -e \"const {Monitoring} = require('./monitoring'); const m = new Monitoring('./test-metrics-verify'); m.recordMemory(); m.recordError('test', true); process.exit((m.metrics.memory.rss_mb > 0 && m.metrics.errors.test) ? 0 : 1)\""
check "Monitoring saves to file" "node -e \"const {Monitoring} = require('./monitoring'); const m = new Monitoring('./test-metrics-verify'); m.saveMetrics(); process.exit(0)\" && [ -f './test-metrics-verify/metrics.json' ]"
echo ""

# =========================================================================
# 11. Git Commits
# =========================================================================
echo "11. Git Commits"
check "Refactoring commit exists" "(cd .. && git log --oneline | grep -E 'refactor.*phase2')"
check "Test commit exists" "(cd .. && git log --oneline | grep -E 'test.*phase2')"
check "Documentation commits exist" "(cd .. && git log --oneline | grep -E 'docs.*phase2')"
echo ""

# =========================================================================
# Cleanup
# =========================================================================
rm -rf ./test-queue-verify ./test-logs-verify ./test-metrics-verify 2>/dev/null

# =========================================================================
# Summary
# =========================================================================
echo "========== Summary =========="
TOTAL=$((PASS + FAIL))
echo "Passed: ${GREEN}${PASS}${NC}/$TOTAL"
if [ $FAIL -gt 0 ]; then
  echo "Failed: ${RED}${FAIL}${NC}/$TOTAL"
  exit 1
else
  echo "${GREEN}✓ All checks passed!${NC}"
  exit 0
fi
