#!/bin/bash
#
# Asset Master Phase 2 - Import API Curl Examples
# Quick reference for testing all 4 endpoints with curl
#
# Prerequisite: Set BEARER_TOKEN and DEPLOY_URL environment variables
#
# Example setup:
#   export BEARER_TOKEN="eyJhbGc..."   # Your JWT token
#   export DEPLOY_URL="http://localhost:3000"  # or https://dsc-fms-portal.vercel.app

set -e

DEPLOY_URL="${DEPLOY_URL:-http://localhost:3000}"
BEARER_TOKEN="${BEARER_TOKEN:-}"

if [ -z "$BEARER_TOKEN" ]; then
  echo "ERROR: BEARER_TOKEN not set"
  echo "export BEARER_TOKEN=\"your_jwt_token_here\""
  exit 1
fi

echo "Using DEPLOY_URL: $DEPLOY_URL"
echo ""

# ============================================================================
# ENDPOINT 1: POST /api/assets/import/preview
# ============================================================================
echo "=== ENDPOINT 1: POST /api/assets/import/preview ==="
echo ""
echo "Upload Excel file, validate, create pending batch, preview first 20 rows"
echo ""
echo "Command:"
echo 'curl -X POST '"$DEPLOY_URL"'/api/assets/import/preview \'
echo '  -H "Authorization: Bearer '"$BEARER_TOKEN"'" \'
echo '  -F "file=@./sample-assets.xlsx"'
echo ""

# ============================================================================
# ENDPOINT 2: GET /api/assets/import/batches
# ============================================================================
echo "=== ENDPOINT 2: GET /api/assets/import/batches ==="
echo ""
echo "List all import batches with pagination and optional status filter"
echo ""
echo "Command (basic):"
echo 'curl -X GET '"$DEPLOY_URL"'/api/assets/import/batches \'
echo '  -H "Authorization: Bearer '"$BEARER_TOKEN"'"'
echo ""
echo "Command (with filters):"
echo 'curl -X GET "'"$DEPLOY_URL"'/api/assets/import/batches?page=1&per_page=20&status=pending" \'
echo '  -H "Authorization: Bearer '"$BEARER_TOKEN"'"'
echo ""
echo "Query parameters:"
echo "  - page (default: 1)"
echo "  - per_page (default: 20, max: 100)"
echo "  - status (optional: pending|processing|completed|failed)"
echo ""

# ============================================================================
# ENDPOINT 3: GET /api/assets/import/batches/:batchId
# ============================================================================
echo "=== ENDPOINT 3: GET /api/assets/import/batches/:batchId ==="
echo ""
echo "Fetch batch metadata and items (with pagination)"
echo ""
echo "Command (basic):"
echo 'curl -X GET "'"$DEPLOY_URL"'/api/assets/import/batches/{batchId}" \'
echo '  -H "Authorization: Bearer '"$BEARER_TOKEN"'"'
echo ""
echo "Command (with item filters):"
echo 'curl -X GET "'"$DEPLOY_URL"'/api/assets/import/batches/{batchId}?include_items=1&item_status=success&item_page=1&item_per_page=50" \'
echo '  -H "Authorization: Bearer '"$BEARER_TOKEN"'"'
echo ""
echo "Query parameters:"
echo "  - include_items (0 = omit items, 1 = include, default: 1)"
echo "  - item_status (filter: success|error|pending|validating|skipped)"
echo "  - item_page (default: 1)"
echo "  - item_per_page (default: 50, max: 200)"
echo ""

# ============================================================================
# ENDPOINT 4: POST /api/assets/import/execute
# ============================================================================
echo "=== ENDPOINT 4: POST /api/assets/import/execute ==="
echo ""
echo "Execute batch import: insert pending items as assets"
echo ""
echo "Command:"
echo 'curl -X POST '"$DEPLOY_URL"'/api/assets/import/execute \'
echo '  -H "Authorization: Bearer '"$BEARER_TOKEN"'" \'
echo '  -H "Content-Type: application/json" \'
echo "  -d '{\"batch_id\": \"{batchId}\"}'\"
echo ""
echo "Request body:"
echo "  { batch_id: \"<uuid>\" }"
echo ""
echo "Response status codes:"
echo "  - 200: Success"
echo "  - 401: Unauthorized (missing/invalid token)"
echo "  - 404: Batch not found"
echo "  - 409: Batch already completed or currently processing"
echo "  - 500: Server error"
echo ""

# ============================================================================
# QUICK TEST FLOW
# ============================================================================
echo ""
echo "=== QUICK TEST FLOW ==="
echo ""
echo "1. Upload Excel file:"
echo "   BATCH_ID=\$(curl -s -X POST \"$DEPLOY_URL/api/assets/import/preview\" \\"
echo "     -H \"Authorization: Bearer $BEARER_TOKEN\" \\"
echo "     -F \"file=@./sample-assets.xlsx\" \\"
echo "     | grep -o '\"batch_id\":\"[^\"]*' | cut -d'\"' -f4)"
echo ""
echo "2. Check batch status:"
echo "   curl -s -X GET \"$DEPLOY_URL/api/assets/import/batches/\$BATCH_ID\" \\"
echo "     -H \"Authorization: Bearer $BEARER_TOKEN\""
echo ""
echo "3. Execute batch import:"
echo "   curl -s -X POST \"$DEPLOY_URL/api/assets/import/execute\" \\"
echo "     -H \"Authorization: Bearer $BEARER_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"batch_id\": \"\$BATCH_ID\"}'"
echo ""
echo "4. Verify completed batch:"
echo "   curl -s -X GET \"$DEPLOY_URL/api/assets/import/batches?status=completed\" \\"
echo "     -H \"Authorization: Bearer $BEARER_TOKEN\""
echo ""
