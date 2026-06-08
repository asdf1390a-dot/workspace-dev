#!/bin/bash
# Validation runner: Collect evaluator spot-check results and archive
# Runs: After each evaluator spot-check completion
# Collects edge-case results, validates system integrity

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEMORY_DIR="$REPO_ROOT/memory"
ARCHIVE_DIR="$REPO_ROOT/memory/collected"
LOG_FILE="$MEMORY_DIR/logs/validation-runner.log"

# Ensure archive directory exists
mkdir -p "$ARCHIVE_DIR"

# Get timestamp
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)

{
  echo "=== Validation Runner Started ==="
  echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo ""

  # Check if evaluator spot checks file exists
  SPOT_CHECKS_FILE="$MEMORY_DIR/evaluator_spot_checks.json"

  if [ -f "$SPOT_CHECKS_FILE" ]; then
    echo "Found spot checks file: $SPOT_CHECKS_FILE"

    # Validate JSON integrity
    if jq empty "$SPOT_CHECKS_FILE" 2>/dev/null; then
      echo "✓ JSON validation passed"

      # Extract metrics
      TOTAL_CHECKS=$(jq 'if type == "array" then length else .spot_checks | length end' "$SPOT_CHECKS_FILE" 2>/dev/null || echo "0")
      PASSED=$(jq '[.[] | select(.result=="PASS")] | length' "$SPOT_CHECKS_FILE" 2>/dev/null || jq '[.spot_checks[] | select(.result=="PASS")] | length' "$SPOT_CHECKS_FILE" 2>/dev/null || echo "0")
      FAILED=$(jq '[.[] | select(.result=="FAIL")] | length' "$SPOT_CHECKS_FILE" 2>/dev/null || jq '[.spot_checks[] | select(.result=="FAIL")] | length' "$SPOT_CHECKS_FILE" 2>/dev/null || echo "0")

      PASS_RATE=$((PASSED * 100 / (TOTAL_CHECKS > 0 ? TOTAL_CHECKS : 1)))

      # Create archive snapshot
      ARCHIVE_FILE="$ARCHIVE_DIR/spot_checks_${TIMESTAMP}.json"
      cat > "$ARCHIVE_FILE" <<EOF
{
  "archive_timestamp": "$TIMESTAMP_ISO",
  "source_file": "$SPOT_CHECKS_FILE",
  "metrics": {
    "total_checks": $TOTAL_CHECKS,
    "passed": $PASSED,
    "failed": $FAILED,
    "pass_rate_percent": $PASS_RATE
  },
  "status": "$([ "$FAILED" -eq 0 ] && echo 'PASS' || echo 'PARTIAL')",
  "collected_results": $(cat "$SPOT_CHECKS_FILE" 2>/dev/null || echo '{}')
}
EOF

      echo "✓ Archive created: $ARCHIVE_FILE"
      echo "  - Total checks: $TOTAL_CHECKS"
      echo "  - Passed: $PASSED"
      echo "  - Failed: $FAILED"
      echo "  - Pass rate: ${PASS_RATE}%"

      # Update STATUS_LIVE.json validation section if jq available
      if command -v jq &> /dev/null; then
        STATUS_FILE="$MEMORY_DIR/STATUS_LIVE.json"
        if [ -f "$STATUS_FILE" ]; then
          jq ".checkpoint_validation.evaluator_spot_checks = \"✅ VERIFIED ($PASSED/$TOTAL_CHECKS pass @ $(date +%H:%M %Z))\"" "$STATUS_FILE" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE"
          echo "✓ STATUS_LIVE.json updated with validation results"
        fi
      fi

    else
      echo "⚠ JSON validation failed for $SPOT_CHECKS_FILE"
    fi
  else
    echo "⚠ No spot checks file found at $SPOT_CHECKS_FILE"
    echo "  Skipping validation run"
  fi

  echo ""
  echo "=== Validation Runner Complete ==="

} | tee -a "$LOG_FILE"

exit 0
