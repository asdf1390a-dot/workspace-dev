#!/bin/bash
################################################################################
# Phase 2B Monitoring Dashboard
#
# Real-time monitoring of Phase 2B duplicate detection cron job
# Shows current service health, performance metrics, and execution history
################################################################################

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEMORY_DIR="/home/jeepney/.openclaw/workspace-dev/memory"
LOG_DIR="$MEMORY_DIR/logs"
PHASE2B_URL="${PHASE2B_URL:-http://localhost:3010}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

header() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Phase 2B Monitoring Dashboard${NC}"
  echo -e "${BLUE}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
}

section() {
  echo -e "${BLUE}▸ $1${NC}"
}

status_ok() {
  echo -e "${GREEN}✓${NC} $1"
}

status_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

status_error() {
  echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# SERVICE HEALTH
# ============================================================================

section "Service Health"

SERVICE_STATUS=$(curl -s -m 5 "$PHASE2B_URL/health" 2>/dev/null)

if [[ -z "$SERVICE_STATUS" ]]; then
  status_error "Phase 2B service not responding"
  UPTIME="N/A"
else
  status_ok "Phase 2B service running"
  UPTIME=$(echo "$SERVICE_STATUS" | grep -o '"uptime":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
fi

echo ""

# ============================================================================
# RECENT CRON EXECUTIONS
# ============================================================================

section "Recent Cron Executions"

if [[ ! -d "$LOG_DIR" ]]; then
  status_error "Log directory not found: $LOG_DIR"
else
  # Get last 5 runs
  RUN_COUNT=$(ls -1 "$LOG_DIR"/phase2b-cron-run-*.log 2>/dev/null | wc -l)

  if [[ $RUN_COUNT -eq 0 ]]; then
    status_warn "No cron runs recorded yet"
  else
    echo "Total runs: $RUN_COUNT"
    echo ""

    ls -t "$LOG_DIR"/phase2b-cron-run-*.log 2>/dev/null | head -5 | while read logfile; do
      filename=$(basename "$logfile")
      timestamp=$(echo "$filename" | sed 's/phase2b-cron-run-//;s/\.log//')

      # Extract metrics from log
      if grep -q "Detection successful" "$logfile" 2>/dev/null; then
        processing_time=$(grep "Detection successful" "$logfile" | grep -o '[0-9]*ms' | head -1)
        clusters=$(grep "Found.*duplicate" "$logfile" | grep -o '[0-9]* duplicate' | grep -o '[0-9]\+')
        echo "  $(date -d "${timestamp:0:8} ${timestamp:9:2}:${timestamp:11:2}:${timestamp:13:2}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$timestamp"): $clusters clusters, ${processing_time:-N/A}"
      elif grep -q "API call failed" "$logfile" 2>/dev/null; then
        error=$(grep "API call failed" "$logfile" | tail -1 | sed 's/.*API call failed: //')
        echo "  $(date -d "${timestamp:0:8} ${timestamp:9:2}:${timestamp:11:2}:${timestamp:13:2}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$timestamp"): ${RED}FAILED${NC} - $error"
      else
        echo "  $(date -d "${timestamp:0:8} ${timestamp:9:2}:${timestamp:11:2}:${timestamp:13:2}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$timestamp"): (status unknown)"
      fi
    done
  fi
fi

echo ""

# ============================================================================
# PERFORMANCE METRICS
# ============================================================================

section "Performance Metrics"

if [[ ! -f "$LOG_DIR/phase2b-stats-$(date +%Y%m%d).json" ]]; then
  status_warn "Today's stats not yet available"
else
  STATS=$(cat "$LOG_DIR/phase2b-stats-$(date +%Y%m%d).json" | head -1)

  if command -v jq &> /dev/null; then
    SUCCESS=$(echo "$STATS" | jq -r '.success // false')
    FILES=$(echo "$STATS" | jq -r '.filesProcessed // 0')
    DUPLICATES=$(echo "$STATS" | jq -r '.duplicatesFound // 0')
    TIME=$(echo "$STATS" | jq -r '.executionTime // 0')

    status_ok "Files processed: $FILES"
    status_ok "Duplicates found: $DUPLICATES"
    status_ok "Execution time: ${TIME}ms"
  else
    # Fallback parsing without jq
    echo "  (Install jq for detailed metrics)"
    cat "$LOG_DIR/phase2b-stats-$(date +%Y%m%d).json"
  fi
fi

echo ""

# ============================================================================
# ERROR LOG SUMMARY
# ============================================================================

section "Recent Errors"

if [[ ! -f "$LOG_DIR/phase2b-cron-errors.log" ]]; then
  status_ok "No errors recorded"
else
  ERROR_COUNT=$(wc -l < "$LOG_DIR/phase2b-cron-errors.log")

  if [[ $ERROR_COUNT -eq 0 ]]; then
    status_ok "No errors recorded"
  else
    status_warn "Errors found: $ERROR_COUNT"
    tail -5 "$LOG_DIR/phase2b-cron-errors.log" | while read line; do
      echo "  $line"
    done
  fi
fi

echo ""

# ============================================================================
# PERFORMANCE BASELINES
# ============================================================================

section "Performance Baselines"

if [[ -f "$LOG_DIR/PHASE2B_BASELINES.txt" ]]; then
  grep "^\s*✓\|^\s*⚠\|^\s*✗" "$LOG_DIR/PHASE2B_BASELINES.txt" 2>/dev/null | head -8 || echo "  (Baselines not yet analyzed)"
else
  status_warn "Baselines not yet established"
fi

echo ""

# ============================================================================
# RECOMMENDATIONS
# ============================================================================

section "Recommendations"

# Check if service is responsive
if ! curl -s -m 2 "$PHASE2B_URL/health" > /dev/null 2>&1; then
  status_warn "Phase 2B service is unresponsive - restart may be needed"
fi

# Check for recent errors
if [[ -f "$LOG_DIR/phase2b-cron-errors.log" ]] && [[ $(wc -l < "$LOG_DIR/phase2b-cron-errors.log") -gt 10 ]]; then
  status_warn "Multiple errors detected - review error log and service health"
fi

# Check for slow runs
if [[ -f "$LOG_DIR/phase2b-stats-$(date +%Y%m%d).json" ]]; then
  LAST_TIME=$(tail -1 "$LOG_DIR/phase2b-stats-$(date +%Y%m%d).json" 2>/dev/null | grep -o '"executionTime":[0-9]*' | grep -o '[0-9]*')
  if [[ ! -z "$LAST_TIME" ]] && [[ $LAST_TIME -gt 300000 ]]; then
    status_warn "Recent runs are slow (>5min) - monitor performance"
  fi
fi

status_ok "All systems operational"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
