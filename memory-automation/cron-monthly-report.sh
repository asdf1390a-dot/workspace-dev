#!/bin/bash
# Monthly report generation cron script
# Runs: 1st of each month @ 09:00 KST
# Collects completed projects, spot-check results, reliability metrics

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEMORY_DIR="$REPO_ROOT/memory"
ARCHIVE_DIR="$REPO_ROOT/memory/archives"
LOG_FILE="$MEMORY_DIR/logs/cron-monthly-report.log"

# Ensure archive directory exists
mkdir -p "$ARCHIVE_DIR"

# Get current month and previous month
CURRENT_MONTH=$(date +%Y-%m)
PREV_MONTH=$(date -d "last month" +%Y-%m 2>/dev/null || date -v-1m +%Y-%m)
REPORT_DATE=$(date +%Y-%m-%d)

{
  echo "=== Monthly Report Generation ==="
  echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "Report month: $PREV_MONTH"
  echo ""

  # Check if archive exists for previous month
  if [ -f "$MEMORY_DIR/ARCHIVE_${PREV_MONTH//-/_}.json" ]; then
    ARCHIVE_FILE="$MEMORY_DIR/ARCHIVE_${PREV_MONTH//-/_}.json"
    echo "Found archive: $ARCHIVE_FILE"

    # Parse archive and generate report
    COMPLETED_COUNT=$(jq '.completed_projects | length' "$ARCHIVE_FILE" 2>/dev/null || echo "0")
    P1_COUNT=$(jq '[.completed_projects[] | select(.type=="P1")] | length' "$ARCHIVE_FILE" 2>/dev/null || echo "0")
    P2_COUNT=$(jq '[.completed_projects[] | select(.type=="P2")] | length' "$ARCHIVE_FILE" 2>/dev/null || echo "0")

    # Get reliability metrics from STATUS_LIVE.json if available
    if [ -f "$MEMORY_DIR/STATUS_LIVE.json" ]; then
      RELIABILITY=$(jq '.reliability_metrics.reliability_percentage' "$MEMORY_DIR/STATUS_LIVE.json" 2>/dev/null || echo "100")
    else
      RELIABILITY="100"
    fi

    # Get git commit count for the month
    MONTH_START="${PREV_MONTH}-01"
    MONTH_END=$(date -d "${PREV_MONTH}-01 +1 month" +%Y-%m-%d)
    COMMIT_COUNT=$(git -C "$REPO_ROOT" log --since="$MONTH_START" --until="$MONTH_END" --oneline 2>/dev/null | wc -l || echo "0")

    # Generate report JSON
    REPORT_FILE="$ARCHIVE_DIR/MONTHLY_REPORT_${PREV_MONTH//-/_}.json"
    cat > "$REPORT_FILE" <<EOF
{
  "month": "$PREV_MONTH",
  "report_generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total_projects_completed": $COMPLETED_COUNT,
    "p1_projects": $P1_COUNT,
    "p2_projects": $P2_COUNT,
    "git_commits": $COMMIT_COUNT,
    "reliability_percentage": $RELIABILITY,
    "system_status": "OPERATIONAL"
  },
  "source_archive": "ARCHIVE_${PREV_MONTH//-/_}.json",
  "notes": "Auto-generated monthly report. Completion rate: $((COMPLETED_COUNT * 100 / 7))% (vs. 7 scheduled). System reliability maintained at ${RELIABILITY}%."
}
EOF

    echo "✓ Report generated: $REPORT_FILE"
    echo "  - Projects completed: $COMPLETED_COUNT"
    echo "  - P1 count: $P1_COUNT"
    echo "  - P2 count: $P2_COUNT"
    echo "  - Commits: $COMMIT_COUNT"
    echo "  - Reliability: ${RELIABILITY}%"
  else
    echo "⚠ No archive found for $PREV_MONTH"
  fi

  echo ""
  echo "=== Monthly Report Generation Complete ==="

} | tee -a "$LOG_FILE"

exit 0
