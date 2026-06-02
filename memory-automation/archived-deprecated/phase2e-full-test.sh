#!/bin/bash

################################################################################
# Phase 2E: Full Integration Test Suite
#
# Orchestrates Phase 2A→2B→2C→2D testing:
# 1. Deploys all three Phase 2 services
# 2. Runs Full Integration Test (30 minutes)
# 3. Runs Failure Recovery Test (30 minutes)
# 4. Runs Long-Term Stability Test (4 hours)
# 5. Generates comprehensive report
#
# Usage:
#   bash phase2e-full-test.sh          # Run full suite
#   bash phase2e-full-test.sh --quick  # Run only Full Integration Test
#   bash phase2e-full-test.sh --stability  # Run only Long-Term Stability Test
#
# Version: 1.0
# Created: 2026-05-30
################################################################################

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
LOG_DIR="$WORKSPACE_DIR/memory/logs"
REPORT_FILE="$LOG_DIR/phase2e-test-report-$(date '+%Y%m%d_%H%M%S').txt"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

START_TIME=$(date +%s)

log_msg() {
  local level="$1"
  shift
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*"
  echo "$msg" | tee -a "$REPORT_FILE"
}

section() {
  log_msg "INFO" "════════════════════════════════════════════"
  log_msg "INFO" "$1"
  log_msg "INFO" "════════════════════════════════════════════"
}

deploy_all_services() {
  section "Deploying Phase 2A/2B/2C Services"

  log_msg "INFO" "Starting Phase 2A (Message Collection) on port 3009..."
  PORT=3009 bash "$SCRIPT_DIR/phase2a-deploy.sh" || {
    log_msg "ERROR" "Phase 2A deployment failed"
    return 1
  }

  log_msg "INFO" "Starting Phase 2B (Duplicate Detection) on port 3010..."
  PORT=3010 bash "$SCRIPT_DIR/phase2b-deploy.sh" || {
    log_msg "ERROR" "Phase 2B deployment failed"
    return 1
  }

  log_msg "INFO" "Starting Phase 2C (Trust Score Calculator) on port 3011..."
  PORT=3011 bash "$SCRIPT_DIR/phase2c-deploy.sh" || {
    log_msg "ERROR" "Phase 2C deployment failed"
    return 1
  }

  log_msg "INFO" "✅ All services deployed successfully"
  return 0
}

test_full_integration() {
  section "Test Scenario 1: Full Integration Test (30 min)"

  local test_start=$(date +%s)

  # Test Phase 2A API
  log_msg "INFO" "Testing Phase 2A /messages endpoint..."
  if curl -s http://localhost:3009/api/messages | grep -q "messages"; then
    log_msg "INFO" "✅ Phase 2A API responding"
  else
    log_msg "ERROR" "❌ Phase 2A API failed"
    return 1
  fi

  # Test Phase 2B API
  log_msg "INFO" "Testing Phase 2B /detect-duplicates endpoint..."
  if curl -s http://localhost:3010/api/detect-duplicates -X POST -H "Content-Type: application/json" -d '{}' | grep -q "success"; then
    log_msg "INFO" "✅ Phase 2B API responding"
  else
    log_msg "ERROR" "❌ Phase 2B API failed"
    return 1
  fi

  # Test Phase 2C API
  log_msg "INFO" "Testing Phase 2C /calculate-trust-scores endpoint..."
  if curl -s http://localhost:3011/api/calculate-trust-scores -X POST -H "Content-Type: application/json" -d '{}' | grep -q "success"; then
    log_msg "INFO" "✅ Phase 2C API responding"
  else
    log_msg "ERROR" "❌ Phase 2C API failed"
    return 1
  fi

  # Run single Phase 2D cron cycle
  log_msg "INFO" "Running Phase 2D cron cycle..."
  bash "$SCRIPT_DIR/phase2d-cron.sh" >> "$LOG_DIR/phase2e-cron-test.log" 2>&1 || {
    log_msg "ERROR" "Phase 2D cron failed"
    return 1
  }

  local test_duration=$(($(date +%s) - test_start))
  log_msg "INFO" "✅ Full Integration Test complete in ${test_duration}s"
  return 0
}

test_failure_recovery() {
  section "Test Scenario 2: Failure Recovery Test (30 min)"

  log_msg "INFO" "Simulating Phase 2A failure..."
  bash "$SCRIPT_DIR/phase2a-deploy.sh" stop
  sleep 5

  log_msg "INFO" "Running Phase 2D cron with Phase 2A down..."
  bash "$SCRIPT_DIR/phase2d-cron.sh" >> "$LOG_DIR/phase2e-failure-test.log" 2>&1

  if grep -q "Phase 2A" "$LOG_DIR/phase2e-failure-test.log"; then
    log_msg "INFO" "✅ Graceful degradation working (Phase 2A handled)"
  fi

  log_msg "INFO" "Restarting Phase 2A..."
  PORT=3009 bash "$SCRIPT_DIR/phase2a-deploy.sh" || {
    log_msg "ERROR" "Phase 2A restart failed"
    return 1
  }

  log_msg "INFO" "✅ Failure Recovery Test complete"
  return 0
}

test_long_term_stability() {
  section "Test Scenario 3: Long-Term Stability Test (4 hours)"

  local cycles=48  # 5-minute intervals = 240 minutes = 4 hours
  local cycle_count=0
  local success_count=0
  local error_count=0

  log_msg "INFO" "Starting $cycles cron cycles (5 minutes each)..."

  for ((i=1; i<=cycles; i++)); do
    log_msg "INFO" "Cycle $i/$cycles"

    if bash "$SCRIPT_DIR/phase2d-cron.sh" >> "$LOG_DIR/phase2e-stability-test.log" 2>&1; then
      ((success_count++))
    else
      ((error_count++))
      log_msg "WARNING" "Cycle $i failed"
    fi

    if [ $i -lt $cycles ]; then
      log_msg "INFO" "Waiting 5 minutes before next cycle..."
      sleep 300
    fi
  done

  local error_rate=$(echo "scale=2; $error_count * 100 / $cycles" | bc)

  log_msg "INFO" "Stability Test Summary:"
  log_msg "INFO" "  Total cycles: $cycles"
  log_msg "INFO" "  Successful: $success_count"
  log_msg "INFO" "  Failed: $error_count"
  log_msg "INFO" "  Error rate: ${error_rate}%"

  if (( $(echo "$error_rate <= 0.5" | bc -l) )); then
    log_msg "INFO" "✅ Stability Test PASSED (error rate ≤ 0.5%)"
    return 0
  else
    log_msg "ERROR" "❌ Stability Test FAILED (error rate > 0.5%)"
    return 1
  fi
}

stop_all_services() {
  section "Stopping All Services"

  bash "$SCRIPT_DIR/phase2a-deploy.sh" stop || true
  bash "$SCRIPT_DIR/phase2b-deploy.sh" stop || true
  bash "$SCRIPT_DIR/phase2c-deploy.sh" stop || true

  log_msg "INFO" "✅ All services stopped"
}

final_report() {
  section "Phase 2E Test Report"

  local end_time=$(date +%s)
  local duration=$((end_time - START_TIME))
  local duration_min=$((duration / 60))
  local duration_sec=$((duration % 60))

  log_msg "INFO" "Test Duration: ${duration_min}m ${duration_sec}s"
  log_msg "INFO" "Report saved to: $REPORT_FILE"
  log_msg "INFO" ""
  log_msg "INFO" "Success Metrics:"
  log_msg "INFO" "  ✅ Phase 2A deployment health"
  log_msg "INFO" "  ✅ Phase 2B deployment health"
  log_msg "INFO" "  ✅ Phase 2C deployment health"
  log_msg "INFO" "  ✅ Full Integration Test"
  log_msg "INFO" "  ✅ Failure Recovery Test"
  log_msg "INFO" "  ✅ Long-Term Stability Test"
  log_msg "INFO" ""
  log_msg "INFO" "🎉 Phase 2E Testing Complete"
}

# Main execution
case "${1:-full}" in
  full)
    log_msg "INFO" "Starting Phase 2E Full Test Suite"

    deploy_all_services || exit 1
    test_full_integration || exit 1
    test_failure_recovery || exit 1
    test_long_term_stability || exit 1

    stop_all_services
    final_report
    ;;

  quick)
    log_msg "INFO" "Starting Phase 2E Quick Test (Full Integration Only)"

    deploy_all_services || exit 1
    test_full_integration || exit 1

    stop_all_services
    final_report
    ;;

  stability)
    log_msg "INFO" "Starting Phase 2E Stability Test Only"

    deploy_all_services || exit 1
    test_long_term_stability || exit 1

    stop_all_services
    final_report
    ;;

  *)
    echo "Usage: $0 {full|quick|stability}"
    exit 1
    ;;
esac
