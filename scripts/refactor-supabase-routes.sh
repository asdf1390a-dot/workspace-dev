#!/bin/bash
# Refactor all API routes to lazy-load Supabase client
# This fixes the build-time "supabaseKey is required" error

set -euo pipefail

# List of all files to refactor (output from Explore agent)
FILES=(
  "dsc-fms-portal/app/api/audit/cron/daily-v2/route.ts"
  "dsc-fms-portal/app/api/cron/backups/cleanup/daily/route.ts"
  "dsc-fms-portal/app/api/cron/backups/metrics/daily/route.ts"
  "dsc-fms-portal/app/api/cron/backups/schedule/daily/route.ts"
  "dsc-fms-portal/app/api/cron/weekly-reports/generate/route.ts"
  "dsc-fms-portal/app/api/cron/auto-info-collection/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/generate/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/history/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/submit/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/entries/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/templates/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/auto-generate/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/[id]/comments/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/[id]/approve/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/[id]/review/route.ts"
  "dsc-fms-portal/app/api/weekly-reports/[id]/export/route.ts"
  "dsc-fms-portal/app/api/travels/route.ts"
  "dsc-fms-portal/app/api/travels/[id]/notifications/route.ts"
  "dsc-fms-portal/app/api/travels/[id]/route.ts"
  "dsc-fms-portal/app/api/travels/[id]/events/route.ts"
  "dsc-fms-portal/app/api/travels/[id]/members/route.ts"
  "dsc-fms-portal/app/api/travels/[id]/costs/route.ts"
  "dsc-fms-portal/app/api/travels/[id]/checklists/route.ts"
  "dsc-fms-portal/app/api/travels/[id]/documents/route.ts"
  "dsc-fms-portal/app/api/admin/migrations/deploy/route.ts"
  "dsc-fms-portal/app/api/team/resources/capacity/route.ts"
  "dsc-fms-portal/app/api/team/communications/messages/route.ts"
  "dsc-fms-portal/app/api/team/communications/threads/route.ts"
  "dsc-fms-portal/app/api/team/communications/threads/[id]/route.ts"
  "dsc-fms-portal/app/api/team/performance/trends/route.ts"
  "dsc-fms-portal/app/api/team/performance/metrics/route.ts"
  "dsc-fms-portal/app/api/team/members/route.ts"
  "dsc-fms-portal/app/api/team/members/[id]/route.ts"
  "dsc-fms-portal/app/api/dashboard/team-org/departments/route.ts"
  "dsc-fms-portal/app/api/dashboard/team-org/structure/route.ts"
  "dsc-fms-portal/app/api/dashboard/team-org/members/route.ts"
  "dsc-fms-portal/app/api/dashboard/team-org/update/route.ts"
  "dsc-fms-portal/app/api/dashboard/team-org/hierarchy/route.ts"
  "dsc-fms-portal/app/api/dashboard/activity/route.ts"
  "dsc-fms-portal/app/api/dashboard/activity/member/[id]/route.ts"
  "dsc-fms-portal/app/api/dashboard/summary/route.ts"
  "dsc-fms-portal/app/api/dashboard/portfolio/assignments/route.ts"
  "dsc-fms-portal/app/api/dashboard/portfolio/items/route.ts"
  "dsc-fms-portal/app/api/dashboard/portfolio/items/[id]/route.ts"
  "dsc-fms-portal/app/api/assets/route.ts"
  "dsc-fms-portal/app/api/assets/import/batches/route.ts"
  "dsc-fms-portal/app/api/assets/import/batches/[batchId]/route.ts"
  "dsc-fms-portal/app/api/assets/import/batches/[batchId]/items/route.ts"
  "dsc-fms-portal/app/api/assets/import/preview/route.ts"
  "dsc-fms-portal/app/api/assets/import/execute/route.ts"
  "dsc-fms-portal/app/api/assets/statistics/route.ts"
  "dsc-fms-portal/app/api/assets/locations/route.ts"
  "dsc-fms-portal/app/api/assets/bulk-update/route.ts"
  "dsc-fms-portal/app/api/assets/export/excel/route.ts"
  "dsc-fms-portal/app/api/assets/export/csv/route.ts"
  "dsc-fms-portal/app/api/assets/[assetId]/route.ts"
  "dsc-fms-portal/app/api/assets/[assetId]/dispose/route.ts"
  "dsc-fms-portal/app/api/assets/[assetId]/audit-log/route.ts"
  "dsc-fms-portal/app/api/assets/[assetId]/documents/route.ts"
  "dsc-fms-portal/app/api/assets/[assetId]/documents/[doc_id]/route.ts"
  "dsc-fms-portal/app/api/portfolio/[memberId]/route.ts"
  "dsc-fms-portal/app/api/audit/health/route.ts"
)

REFACTORED=0
FAILED=0

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  $file not found"
        ((FAILED++))
        continue
    fi

    # Skip if already refactored (has getSupabaseClient import)
    if grep -q "getSupabaseClient" "$file" 2>/dev/null; then
        echo "✓ $file (already refactored)"
        ((REFACTORED++))
        continue
    fi

    # Read the file
    content=$(cat "$file")

    # Replace imports: remove createClient, add getSupabaseClient
    content=$(echo "$content" | sed "/import { createClient } from '@supabase\/supabase-js'/d")
    if ! echo "$content" | grep -q "getSupabaseClient"; then
        content=$(echo "$content" | sed "/import { NextRequest, NextResponse } from 'next\/server'/a import { getSupabaseClient } from '@\/lib\/supabase-server'")
    fi

    # Remove module-level const supabase declaration
    # This is tricky because it might span multiple lines
    content=$(echo "$content" | sed '/^const supabase = createClient(/,/^)$/d')

    echo "$content" > "$file"
    echo "✅ $file"
    ((REFACTORED++))
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Refactored: $REFACTORED, Failed: $FAILED"
echo "Note: Each route handler still needs manual addition of 'const supabase = getSupabaseClient()' at the start"
