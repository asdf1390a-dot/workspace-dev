#!/bin/bash
################################################################################
# Phase 2B Log Analysis
#
# Analyzes Phase 2B cron execution logs and generates performance reports
# Supports daily, weekly, and monthly analysis modes
################################################################################

set -uo pipefail

MEMORY_DIR="/home/jeepney/.openclaw/workspace-dev/memory"
LOG_DIR="$MEMORY_DIR/logs"
ANALYSIS_MODE="${1:-daily}"
REPORT_DATE="${2:-$(date +%Y%m%d)}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

header() {
  echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Phase 2B Log Analysis Report ($(echo $ANALYSIS_MODE | tr '[:lower:]' '[:upper:]'))${NC}"
  echo -e "${BLUE}  Generated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
  echo ""
}

section() {
  echo -e "${BLUE}▸ $1${NC}"
}

# ============================================================================
# DAILY ANALYSIS
# ============================================================================

analyze_daily() {
  local date=$1
  local day_logs=$(ls "$LOG_DIR"/phase2b-cron-run-${date}*.log 2>/dev/null || true)
  local day_stats="$LOG_DIR/phase2b-stats-${date}.json"

  section "Daily Execution Summary ($date)"

  if [[ -z "$day_logs" ]]; then
    echo "  No runs recorded for $date"
    return
  fi

  # Count runs
  local run_count=$(echo "$day_logs" | wc -w)
  echo "  Total runs: $run_count"
  echo ""

  # Analyze each run
  echo "  Run Details:"
  echo "$day_logs" | tr ' ' '\n' | while read logfile; do
    if [[ ! -f "$logfile" ]]; then continue; fi

    local timestamp=$(basename "$logfile" | sed 's/phase2b-cron-run-//;s/\.log//')
    local files=0
    local duplicates=0
    local time_ms=0
    local status="UNKNOWN"

    if grep -q "Detection successful" "$logfile" 2>/dev/null; then
      status="SUCCESS"
      files=$(grep "Prepared.*entries" "$logfile" | grep -o '[0-9]\+ entries' | grep -o '[0-9]\+' | tail -1)
      duplicates=$(grep "Found.*duplicate" "$logfile" | grep -o '[0-9]* duplicate' | grep -o '[0-9]\+' | tail -1)
      time_ms=$(grep "Detection successful" "$logfile" | grep -o '[0-9]*ms' | head -1 | sed 's/ms//')
    elif grep -q "API call failed" "$logfile" 2>/dev/null; then
      status="FAILED"
    fi

    local ts_readable=$(echo "${timestamp}" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
    printf "    %s: %-10s (%s files, %s clusters, %sms)\n" "$ts_readable" "$status" "${files:-0}" "${duplicates:-0}" "${time_ms:-0}"
  done

  # Stats summary
  if [[ -f "$day_stats" ]]; then
    echo ""
    section "Daily Statistics"
    if command -v jq &> /dev/null; then
      tail -1 "$day_stats" | jq -r '"  Files processed: \(.filesProcessed) | Duplicates: \(.duplicatesFound) | Time: \(.executionTime)ms"'
    else
      echo "  (Install jq for detailed stats)"
      tail -1 "$day_stats"
    fi
  fi
}

# ============================================================================
# WEEKLY ANALYSIS
# ============================================================================

analyze_weekly() {
  local start_date=$(date -d "$(date +%Y-%m-%d) - 7 days" +%Y%m%d)
  local end_date=$(date +%Y%m%d)

  section "Weekly Performance Summary"

  # Find all stats files from past week
  local stats_files=$(ls "$LOG_DIR"/phase2b-stats-*.json 2>/dev/null | xargs -I {} bash -c "
    file_date=\$(basename {} | sed 's/phase2b-stats-//;s/\.json//')
    if [[ \$file_date -ge $start_date ]] && [[ \$file_date -le $end_date ]]; then
      echo {}
    fi
  ")

  if [[ -z "$stats_files" ]]; then
    echo "  No data for past week"
    return
  fi

  # Calculate aggregates
  if command -v jq &> /dev/null; then
    echo ""
    echo "  Aggregated Metrics:"
    echo "$stats_files" | xargs jq -s '{
      totalRuns: length,
      successfulRuns: map(select(.success == true)) | length,
      totalFilesProcessed: map(.filesProcessed // 0) | add,
      totalDuplicatesFound: map(.duplicatesFound // 0) | add,
      avgProcessingTime: (map(.executionTime // 0) | add / length),
      maxProcessingTime: (map(.executionTime // 0) | max),
      minProcessingTime: (map(.executionTime // 0) | min),
      successRate: ((map(select(.success == true)) | length) / length * 100)
    }' | jq -r '"    Total Runs: \(.totalRuns) | Success Rate: \(.successRate | round)%\n    Avg Time: \(.avgProcessingTime | round)ms | Max: \(.maxProcessingTime)ms\n    Files Processed: \(.totalFilesProcessed) | Duplicates: \(.totalDuplicatesFound)"'
  fi

  # Error summary
  echo ""
  section "Weekly Error Summary"
  local error_lines=$(wc -l < "$LOG_DIR/phase2b-cron-errors.log" 2>/dev/null || echo 0)
  if [[ $error_lines -eq 0 ]]; then
    echo "  ✓ No errors recorded"
  else
    echo "  ⚠ Total errors: $error_lines"
    echo "  Recent errors:"
    tail -5 "$LOG_DIR/phase2b-cron-errors.log" | while read line; do
      echo "    $line"
    done
  fi
}

# ============================================================================
# MONTHLY ANALYSIS
# ============================================================================

analyze_monthly() {
  local month=$(date -d "$(date +%Y-%m-01)" +%Y%m)
  local year=${month:0:4}
  local month_num=${month:4:2}

  section "Monthly Performance Report ($month)"

  # Find all stats files for this month
  local stats_files=$(ls "$LOG_DIR"/phase2b-stats-${month}*.json 2>/dev/null || true)

  if [[ -z "$stats_files" ]]; then
    echo "  No data for this month"
    return
  fi

  if command -v jq &> /dev/null; then
    echo ""
    echo "$stats_files" | xargs jq -s '{
      totalRuns: length,
      successRate: ((map(select(.success == true)) | length) / length * 100),
      totalFilesProcessed: map(.filesProcessed // 0) | add,
      totalDuplicatesFound: map(.duplicatesFound // 0) | add,
      avgTime: (map(.executionTime // 0) | add / length),
      maxTime: (map(.executionTime // 0) | max)
    }' | jq -r '"  Runs: \(.totalRuns) | Success: \(.successRate | round)% | Avg Time: \(.avgTime | round)ms | Max: \(.maxTime)ms\n  Files: \(.totalFilesProcessed) | Duplicates: \(.totalDuplicatesFound)"'
  fi

  # Trend analysis
  echo ""
  section "Trend Analysis"
  echo "  Performance trend:"
  ls "$LOG_DIR"/phase2b-stats-${month}*.json 2>/dev/null | head -5 | xargs -I {} bash -c "
    date_label=\$(basename {} | sed 's/phase2b-stats-//;s/\.json//')
    if command -v jq &> /dev/null; then
      avg_time=\$(jq -r '.executionTime // 0' {})
      files=\$(jq -r '.filesProcessed // 0' {})
      echo \"    \${date_label:0:8}: \${files} files in \${avg_time}ms\"
    fi
  "
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

header

case "$ANALYSIS_MODE" in
  daily)
    analyze_daily "$REPORT_DATE"
    ;;
  weekly)
    analyze_weekly
    ;;
  monthly)
    analyze_monthly
    ;;
  *)
    echo "Unknown analysis mode: $ANALYSIS_MODE"
    echo "Usage: $0 [daily|weekly|monthly] [date for daily mode]"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
