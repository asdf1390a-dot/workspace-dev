#!/bin/bash
# Asset Master Phase 2 — db/29 Migration Health Check
# Usage: ./scripts/monitor_db29_migration.sh
# This script checks if the asset_import_batches table exists in Supabase

set -e

# Load environment
cd "$(dirname "$0")/.."
SUPABASE_URL="https://pzkvhomhztikhkgwgqzr.supabase.co"
ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" dsc-fms-portal/.env.local | cut -d'"' -f2)

# Current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')
DEADLINE="2026-05-22 23:59 KST"
DEADLINE_MS=1779550740000

# Calculate remaining time
CURRENT_MS=$(date +%s%N | cut -b1-13)
REMAINING_MS=$((DEADLINE_MS - CURRENT_MS))
REMAINING_HOURS=$((REMAINING_MS / 3600000))
REMAINING_MINS=$(((REMAINING_MS % 3600000) / 60000))

echo "🤖 Asset Master Phase 2 — db/29 Migration Status Check"
echo "📍 Time: $TIMESTAMP"
echo "⏰ Deadline: $DEADLINE ($REMAINING_HOURS"h" "$REMAINING_MINS"m remaining)"
echo ""

# Perform health check
RESPONSE=$(timeout 5 curl -s "${SUPABASE_URL}/rest/v1/asset_import_batches?select=1&limit=1" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}" 2>&1)

HTTP_STATUS=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response:"
echo "$BODY" | head -5

if [ "$HTTP_STATUS" = "200" ]; then
  echo ""
  echo "✅ **MIGRATION APPLIED** — asset_import_batches table exists!"
  echo "HTTP Status: 200"
  echo "Next action: Execute Phase 1-3 verification..."
  exit 0
elif [ "$HTTP_STATUS" = "404" ]; then
  echo ""
  echo "❌ **MIGRATION NOT APPLIED** — table not found (PGRST205)"
  echo "HTTP Status: 404"
  echo "Next action: Continue monitoring at 5-minute intervals"
  exit 1
else
  echo ""
  echo "⚠️  Network error or unexpected response"
  echo "HTTP Status: $HTTP_STATUS"
  exit 2
fi
