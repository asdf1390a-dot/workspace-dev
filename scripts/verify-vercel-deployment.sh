#!/bin/bash
# Vercel Deployment Verification Script
# Tests actual endpoint responses to confirm real deployment (not just build success)

set -euo pipefail

VERCEL_URL="https://dsc-fms-portal.vercel.app"
TIMEOUT=5

echo "🚀 Starting Vercel Deployment Verification..."
echo "Target: $VERCEL_URL"
echo ""

# Array of critical endpoints to verify
declare -a ENDPOINTS=(
    "/api/team/members"              # Team Dashboard P2
    "/api/asset-categories"          # Asset Master P1
    "/api/backup/settings"           # Backup App P2
    "/api/dashboard/team-org/structure"  # Team Dashboard detail
)

PASSED=0
FAILED=0

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "Testing $endpoint ... "

    if response=$(curl -s -w "\n%{http_code}" -m $TIMEOUT "$VERCEL_URL$endpoint" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n 1)
        body=$(echo "$response" | head -n -1)

        # Accept 200, 401 (auth needed), 400 (bad request) as "deployed"
        # Reject 404 (not found), 503 (service unavailable), 502 (bad gateway), timeout
        if [[ "$http_code" =~ ^(200|400|401)$ ]]; then
            echo "✅ HTTP $http_code"
            ((PASSED++))
        else
            echo "❌ HTTP $http_code"
            ((FAILED++))
        fi
    else
        echo "❌ Connection failed / Timeout"
        ((FAILED++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $PASSED passed, $FAILED failed"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ DEPLOYMENT VERIFIED — All critical endpoints responding"
    exit 0
else
    echo "❌ DEPLOYMENT INCOMPLETE — Some endpoints failed"
    exit 1
fi
