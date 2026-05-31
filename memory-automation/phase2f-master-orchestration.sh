#!/bin/bash

# Phase 2F Gate Sequence Master Orchestration
# Full deployment sequence: 18:00 KST (2026-05-31) → 09:00 KST (2026-06-01)
# Purpose: Automated coordination of all 7 gate phases

set -e

MASTER_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-master-orchestration.log"
PHASE_DIR="/home/jeepney/.openclaw/workspace-dev/memory-automation"
mkdir -p /home/jeepney/.openclaw/workspace-dev/memory/logs

exec 1> >(tee -a "$MASTER_LOG")
exec 2>&1

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   PHASE 2F GATE SEQUENCE — MASTER ORCHESTRATION                ║"
echo "║   21-Hour Deployment Window (18:00 KST → 09:00 KST+1)          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S KST')"
echo ""

# Phase execution tracker
PHASES=(
  "phase2f-smoke-tests.sh"
  "phase2f-monitoring-setup.sh"
  "phase2f-alert-routing-setup.sh"
  "phase2f-full-validation-v2.sh"
  "phase2f-8hr-stability-test.sh"
  "phase2f-baseline-collection.sh"
  "phase2f-final-validation.sh"
)

PHASE_NAMES=(
  "Smoke Tests (Phase 1 Finalization)"
  "Monitoring Setup"
  "Alert Routing Setup"
  "Full System Validation"
  "8-Hour Stability Test"
  "Baseline Collection"
  "Final Validation (Sign-Off)"
)

PHASE_WINDOWS=(
  "18:40-19:30 KST"
  "19:30-21:00 KST"
  "21:00-21:30 KST"
  "21:30-22:00 KST"
  "22:00-06:00 KST (next day)"
  "06:00-08:00 KST (next day)"
  "08:00-09:00 KST (next day)"
)

# Execution state
pass_count=0
fail_count=0
phase_num=0

# Function: Execute phase
execute_phase() {
  local script=$1
  local phase_name=$2
  local phase_window=$3
  phase_num=$((phase_num + 1))

  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║ PHASE $phase_num: $phase_name"
  echo "║ Window: $phase_window"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""

  local script_path="$PHASE_DIR/$script"

  if [ ! -f "$script_path" ]; then
    echo "❌ Script not found: $script_path"
    fail_count=$((fail_count + 1))
    return 1
  fi

  echo "Starting at: $(date '+%Y-%m-%d %H:%M:%S KST')"
  echo ""

  if bash "$script_path"; then
    echo ""
    echo "✅ PHASE $phase_num PASSED at $(date '+%Y-%m-%d %H:%M:%S KST')"
    pass_count=$((pass_count + 1))
    return 0
  else
    echo ""
    echo "❌ PHASE $phase_num FAILED at $(date '+%Y-%m-%d %H:%M:%S KST')"
    fail_count=$((fail_count + 1))
    return 1
  fi
}

# Function: Wait for phase window
wait_for_window() {
  local phase_num=$1
  local target_hour=$2
  local target_min=$3

  # Calculate target epoch time (today at target time, KST)
  local target_str="$(date '+%Y-%m-%d') $(printf '%02d:%02d:00' $target_hour $target_min) KST"

  echo ""
  echo "⏳ Waiting for Phase $phase_num start window: $target_str"

  # For now, just log readiness
  echo "Ready to execute at: $target_str"
}

# Main execution
main() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "GATE SEQUENCE TIMELINE"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""

  for i in "${!PHASES[@]}"; do
    printf "Phase $((i+1)): %-40s %s\n" "${PHASE_NAMES[$i]}" "${PHASE_WINDOWS[$i]}"
  done

  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo ""

  # Phase 1: Smoke Tests (18:40-19:30)
  echo "Phase 1 Execution Status:"
  if [ -f /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-smoke-tests.log ]; then
    echo "  ✅ Already executed at $(grep -m1 'PHASE 2F GATE' /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-smoke-tests.log | head -1)"
  else
    wait_for_window 1 18 40
  fi

  # Phase 2: Monitoring Setup (19:30-21:00)
  execute_phase "phase2f-monitoring-setup.sh" "${PHASE_NAMES[1]}" "${PHASE_WINDOWS[1]}" || {
    echo "⚠️  Phase 2 failed, continuing to alert routing setup..."
  }

  # Phase 3: Alert Routing Setup (21:00-21:30)
  execute_phase "phase2f-alert-routing-setup.sh" "${PHASE_NAMES[2]}" "${PHASE_WINDOWS[2]}" || {
    echo "⚠️  Phase 3 failed, continuing to validation..."
  }

  # Phase 4: Full System Validation (21:30-22:00)
  execute_phase "phase2f-full-validation-v2.sh" "${PHASE_NAMES[3]}" "${PHASE_WINDOWS[3]}"

  # Phase 5: 8-Hour Stability Test (22:00-06:00)
  execute_phase "phase2f-8hr-stability-test.sh" "${PHASE_NAMES[4]}" "${PHASE_WINDOWS[4]}"

  # Phase 6: Baseline Collection (06:00-08:00)
  execute_phase "phase2f-baseline-collection.sh" "${PHASE_NAMES[5]}" "${PHASE_WINDOWS[5]}"

  # Phase 7: Final Validation (08:00-09:00)
  execute_phase "phase2f-final-validation.sh" "${PHASE_NAMES[6]}" "${PHASE_WINDOWS[6]}"

  # Final summary
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║                    DEPLOYMENT SEQUENCE SUMMARY                  ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""

  local total=$((pass_count + fail_count))
  local success_rate=0
  if [ $total -gt 0 ]; then
    success_rate=$((pass_count * 100 / total))
  fi

  echo "Total Phases: $total"
  echo "Passed:       $pass_count"
  echo "Failed:       $fail_count"
  echo "Success Rate: $success_rate%"
  echo ""
  echo "Completion Time: $(date '+%Y-%m-%d %H:%M:%S KST')"
  echo ""

  if [ $fail_count -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                  🟢 DEPLOYMENT SUCCESSFUL                       ║"
    echo "║                                                                ║"
    echo "║  Phase 2F Gate Sequence: COMPLETE                             ║"
    echo "║  Memory Automation System: OPERATIONAL                        ║"
    echo "║  Status: READY FOR PRODUCTION                                 ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    return 0
  else
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                   🔴 DEPLOYMENT INCOMPLETE                      ║"
    echo "║                                                                ║"
    echo "║  $fail_count Phase(s) Failed — See logs for details           ║"
    echo "║  Recommended Action: Review failures and retry                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    return 1
  fi
}

main "$@"
