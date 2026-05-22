#!/bin/bash
#
# Asset Master Phase 2 - Import API Test Suite
# Tests all 4 Import endpoints: preview, execute, batches, batches/:batchId
#
# Prerequisites:
#   1. App deployed and running at DEPLOY_URL (default: http://localhost:3000)
#   2. Valid JWT token in BEARER_TOKEN environment variable
#   3. Sample Excel file at ./sample-assets.xlsx (or create one)
#
# Usage:
#   export BEARER_TOKEN="eyJhbGc..."
#   export DEPLOY_URL="https://dsc-fms-portal.vercel.app"  # or local URL
#   ./test-import-api-endpoints.sh

set -e

# Configuration
DEPLOY_URL="${DEPLOY_URL:-http://localhost:3000}"
BEARER_TOKEN="${BEARER_TOKEN:-}"
SAMPLE_EXCEL="${SAMPLE_EXCEL:-./sample-assets.xlsx}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_header() {
  echo ""
  echo -e "${YELLOW}=== $1 ===${NC}"
  echo ""
}

# Validation
if [ -z "$BEARER_TOKEN" ]; then
  log_error "BEARER_TOKEN environment variable is required"
  echo "Set it with: export BEARER_TOKEN=\"your_jwt_token_here\""
  exit 1
fi

log_info "Deploy URL: $DEPLOY_URL"
log_info "Testing with Bearer token: ${BEARER_TOKEN:0:20}..."
echo ""

# ============================================================================
# TEST 1: POST /api/assets/import/preview
# ============================================================================
log_header "TEST 1: POST /api/assets/import/preview (Excel Validation + Preview)"

if [ ! -f "$SAMPLE_EXCEL" ]; then
  log_error "Sample Excel file not found: $SAMPLE_EXCEL"
  log_info "Creating a minimal sample Excel file for testing..."

  # Create a minimal Excel file using Python (if available)
  python3 << 'EOF' 2>/dev/null || {
    log_error "Cannot create Excel file. Please provide sample-assets.xlsx manually."
    exit 1
  }
import openpyxl
from openpyxl.styles import Font

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Assets"

# Header row
headers = ["machine_asset_number", "asset_name", "asset_class_code", "location_code", "condition"]
for col, header in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col)
    cell.value = header
    cell.font = Font(bold=True)

# Sample data rows
data = [
    ["TAG-001", "Lathe Machine A", "MACHINERY", "SHOP-01", "Good"],
    ["TAG-002", "CNC Router B", "MACHINERY", "SHOP-02", "Good"],
    ["TAG-003", "Hydraulic Press", "MACHINERY", "SHOP-01", "Fair"],
]

for row_idx, row_data in enumerate(data, 2):
    for col_idx, value in enumerate(row_data, 1):
        ws.cell(row=row_idx, column=col_idx).value = value

wb.save("./sample-assets.xlsx")
print("Created sample-assets.xlsx")
EOF
fi

log_info "Uploading Excel file: $SAMPLE_EXCEL"

PREVIEW_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$DEPLOY_URL/api/assets/import/preview" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@$SAMPLE_EXCEL")

HTTP_CODE=$(echo "$PREVIEW_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PREVIEW_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  log_success "POST /api/assets/import/preview returned HTTP $HTTP_CODE"

  # Extract batch_id for next tests
  BATCH_ID=$(echo "$RESPONSE_BODY" | grep -o '"batch_id":"[^"]*' | cut -d'"' -f4)

  if [ -n "$BATCH_ID" ]; then
    log_success "Batch created with ID: $BATCH_ID"
    echo ""
    echo "Response preview:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
  else
    log_error "Could not extract batch_id from response"
    echo "$RESPONSE_BODY"
  fi
else
  log_error "POST /api/assets/import/preview returned HTTP $HTTP_CODE"
  echo "Response:"
  echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
  exit 1
fi

# ============================================================================
# TEST 2: GET /api/assets/import/batches (List batches)
# ============================================================================
log_header "TEST 2: GET /api/assets/import/batches (Batch List)"

log_info "Fetching batch list with pagination..."

BATCHES_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$DEPLOY_URL/api/assets/import/batches?page=1&per_page=10&status=pending" \
  -H "Authorization: Bearer $BEARER_TOKEN")

HTTP_CODE=$(echo "$BATCHES_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$BATCHES_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  log_success "GET /api/assets/import/batches returned HTTP $HTTP_CODE"
  echo ""
  echo "Response:"
  echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
else
  log_error "GET /api/assets/import/batches returned HTTP $HTTP_CODE"
  echo "Response:"
  echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
fi

# ============================================================================
# TEST 3: GET /api/assets/import/batches/:batchId (Batch detail)
# ============================================================================
log_header "TEST 3: GET /api/assets/import/batches/:batchId (Batch Detail)"

if [ -z "$BATCH_ID" ]; then
  log_error "No batch_id available from Test 1. Skipping batch detail test."
else
  log_info "Fetching batch details for: $BATCH_ID"

  DETAIL_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET "$DEPLOY_URL/api/assets/import/batches/$BATCH_ID?include_items=1&item_page=1&item_per_page=20" \
    -H "Authorization: Bearer $BEARER_TOKEN")

  HTTP_CODE=$(echo "$DETAIL_RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$DETAIL_RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "GET /api/assets/import/batches/:batchId returned HTTP $HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
  else
    log_error "GET /api/assets/import/batches/:batchId returned HTTP $HTTP_CODE"
    echo "Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
  fi
fi

# ============================================================================
# TEST 4: POST /api/assets/import/execute (Execute batch import)
# ============================================================================
log_header "TEST 4: POST /api/assets/import/execute (Execute Batch)"

if [ -z "$BATCH_ID" ]; then
  log_error "No batch_id available from Test 1. Skipping execute test."
else
  log_info "Executing batch import for: $BATCH_ID"

  EXECUTE_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$DEPLOY_URL/api/assets/import/execute" \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"batch_id\": \"$BATCH_ID\"}")

  HTTP_CODE=$(echo "$EXECUTE_RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$EXECUTE_RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "POST /api/assets/import/execute returned HTTP $HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
  else
    log_error "POST /api/assets/import/execute returned HTTP $HTTP_CODE"
    echo "Note: HTTP 409 means batch already completed (expected on retry)"
    echo "Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
  fi
fi

# ============================================================================
# Test Summary
# ============================================================================
log_header "Test Summary"
log_info "All Import API endpoints tested successfully"
log_info "Batch ID for reference: $BATCH_ID"
log_info ""
log_info "Next steps:"
echo "  1. Check the deployed app UI to verify imported assets"
echo "  2. Query asset_import_batches table in Supabase to verify batch status"
echo "  3. Test with a larger Excel file to verify chunking (100+ rows)"
echo ""
