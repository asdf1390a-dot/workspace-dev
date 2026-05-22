# Asset Master Phase 2 - Import API Testing Guide

**Status:** ✅ All 4 Import endpoints implemented and tested (2026-05-21 23:45 KST)  
**Commit:** 43586f5 (feat(api): complete Asset Master Phase 2 Day 5 import endpoints)  
**Branch:** integrate/pm-phase1-main

---

## Quick Start

### Setup Prerequisites

```bash
# 1. Get JWT token (from app or generate fresh one)
export BEARER_TOKEN="eyJhbGc..." 

# 2. Set deploy URL (local or production)
export DEPLOY_URL="http://localhost:3000"  # or https://dsc-fms-portal.vercel.app

# 3. Prepare sample Excel file
# Use existing ./sample-assets.xlsx or create one
```

### Run Complete Test Suite

```bash
./test-import-api-endpoints.sh
```

Or run individual curl commands from:

```bash
./curl-examples-import-api.sh
```

---

## API Endpoints Overview

### 1. POST /api/assets/import/preview
**Purpose:** Validate Excel file, create pending batch, preview first 20 rows

**Request:**
```bash
curl -X POST "http://localhost:3000/api/assets/import/preview" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -F "file=@./sample-assets.xlsx"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "batch_id": "550e8400-e29b-41d4-a716-446655440000",
    "file_name": "sample-assets.xlsx",
    "total_rows": 100,
    "valid_rows": 98,
    "invalid_rows": 2,
    "global_errors": [],
    "validation_summary": {
      "ready_to_import": 98,
      "has_errors": 2,
      "duplicate_tags": 5,
      "duplicate_in_file": 1,
      "invalid_class_codes": 1
    },
    "preview": [
      {
        "row_number": 2,
        "data": { "machine_asset_number": "TAG-001", ... },
        "errors": []
      },
      ...
    ]
  }
}
```

**Error Cases:**
- 400: Invalid file (missing, empty, wrong format)
- 401: Missing/invalid token
- 500: Excel parse error or DB error

---

### 2. GET /api/assets/import/batches
**Purpose:** List all import batches with pagination

**Request:**
```bash
curl -X GET "http://localhost:3000/api/assets/import/batches?page=1&per_page=20&status=pending" \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `status` (optional: pending|processing|completed|failed)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "batch_name": "sample-assets.xlsx",
      "file_name": "sample-assets.xlsx",
      "file_size_bytes": 5242,
      "status": "pending",
      "total_rows": 100,
      "processed_count": null,
      "success_count": null,
      "error_count": null,
      "created_at": "2026-05-21T14:30:00Z",
      "created_by": "user-id-uuid"
    },
    ...
  ],
  "total": 5,
  "page": 1,
  "per_page": 20,
  "total_pages": 1
}
```

---

### 3. GET /api/assets/import/batches/:batchId
**Purpose:** Get batch metadata and items with pagination

**Request:**
```bash
curl -X GET "http://localhost:3000/api/assets/import/batches/{batchId}?include_items=1&item_status=success&item_page=1&item_per_page=50" \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

**Query Parameters:**
- `include_items` (0 or 1, default: 1)
- `item_status` (filter: success|error|pending|validating|skipped)
- `item_page` (default: 1)
- `item_per_page` (default: 50, max: 200)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "batch_name": "sample-assets.xlsx",
      "status": "completed",
      "total_rows": 100,
      "processed_count": 100,
      "success_count": 98,
      "error_count": 2,
      "created_at": "2026-05-21T14:30:00Z"
    },
    "items": [
      {
        "id": "item-uuid-1",
        "batch_id": "550e8400-e29b-41d4-a716-446655440000",
        "row_number": 2,
        "status": "success",
        "raw_data": { "machine_asset_number": "TAG-001", ... },
        "validation_errors": null,
        "asset_id": "asset-uuid-1",
        "action": "create",
        "processed_at": "2026-05-21T14:35:00Z"
      },
      ...
    ],
    "items_total": 100,
    "item_page": 1,
    "item_per_page": 50,
    "item_total_pages": 2
  }
}
```

---

### 4. POST /api/assets/import/execute
**Purpose:** Execute batch import - insert pending items as assets

**Request:**
```bash
curl -X POST "http://localhost:3000/api/assets/import/execute" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batch_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Request Body:**
```json
{
  "batch_id": "uuid-here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "batch_id": "550e8400-e29b-41d4-a716-446655440000",
    "processed": 100,
    "inserted": 98,
    "failed": 2,
    "errors": [
      { "row": 5, "error": "Duplicate machine_asset_number" },
      { "row": 12, "error": "Unknown asset_class_code" }
    ]
  },
  "message": "Import complete"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid batch_id
- 401: Unauthorized
- 404: Batch not found
- 409: Batch already completed/processing
- 500: Server error

---

## Source Code

### API Route Implementations

**GitHub Raw Links (validated ✓):**

1. **Preview Endpoint**
   - Local: `app/api/assets/import/preview/route.ts`
   - Remote: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/app/api/assets/import/preview/route.ts

2. **Execute Endpoint**
   - Local: `app/api/assets/import/execute/route.ts`
   - Remote: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/app/api/assets/import/execute/route.ts

3. **Batches List Endpoint**
   - Local: `app/api/assets/import/batches/route.ts`
   - Remote: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/app/api/assets/import/batches/route.ts

4. **Batch Detail Endpoint**
   - Local: `app/api/assets/import/batches/[batchId]/route.ts`
   - Remote: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/app/api/assets/import/batches/%5BbatchId%5D/route.ts

### Supporting Libraries

**Import Helpers** (validation, duplicate detection, constants)
- Local: `lib/assets/import-helpers.ts`
- Remote: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/lib/assets/import-helpers.ts

**Import Parser** (Excel parsing logic)
- Local: `lib/assets/import-parser.ts`
- Remote: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/lib/assets/import-parser.ts

**Import Validator** (field-level validation)
- Local: `lib/assets/import-validator.ts`
- Remote: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/lib/assets/import-validator.ts

**Unit Tests**
- Helper tests: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/lib/assets/__tests__/import-helpers.test.ts
- Parser tests: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/lib/assets/__tests__/import-parser.test.ts

### Database Schema

**Migration file (db/29)**
- Local: `db/29_asset_master_v2_phase2.sql`
- Remote: https://github.com/asdf1390a-dot/dsc-fms-portal/raw/integrate/pm-phase1-main/db/29_asset_master_v2_phase2.sql

**Tables created:**
- `asset_import_batches` — batch metadata (status, file info, counts)
- `asset_import_items` — per-row validation (status, errors, asset_id)

---

## Testing Strategy

### Test Scenarios

| Scenario | Test Method | Expected Result |
|----------|-------------|-----------------|
| Valid Excel upload | POST /preview with 100-row file | 200 OK, batch created |
| Duplicate tag detection | Upload file with duplicate tags | Detected in validation_summary |
| Invalid class code | Upload rows with unknown codes | Marked as errors, excluded from import |
| File size validation | Upload >5MB file | 400 Bad Request |
| Invalid file format | Upload .csv or .doc | 400 Bad Request |
| Batch execution | POST /execute on pending batch | Assets inserted, batch marked completed |
| Idempotency | POST /execute twice on same batch | 409 Conflict on second call |
| Pagination | GET /batches?page=2&per_page=10 | Correct subset returned |
| Item filtering | GET /batches/:id?item_status=error | Only error items returned |
| Authentication | Missing/invalid token | 401 Unauthorized |

### Test Data Requirements

**Sample Excel format:**
```
machine_asset_number | asset_name | asset_class_code | location_code | condition
TAG-001             | Lathe A    | MACHINERY        | SHOP-01      | Good
TAG-002             | CNC Router | MACHINERY        | SHOP-02      | Good
TAG-003             | Press      | MACHINERY        | SHOP-01      | Fair
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/expired token | Refresh token, check Bearer format |
| 404 Batch not found | Invalid batch_id | Copy batch_id from preview response |
| 409 Already completed | Re-executing completed batch | Normal behavior, create new batch |
| 5MB limit exceeded | File too large | Compress Excel or split into multiple files |
| PGRST205 (table not found) | DB migration not applied | Ensure db/29 migration ran in Supabase |
| Parse error | Corrupted Excel file | Re-export from source, verify .xlsx format |

---

## Performance Notes

- **Chunking:** 100 items per chunk during insertion (configurable)
- **Pagination:** Max 100 items per page for batches, 200 for items
- **File limit:** 5MB max (1,000+ row Excel files)
- **Timeout:** 60 seconds per request
- **Database:** Uses Supabase RLS policies for org-level isolation

---

## Related Documentation

- **Asset Master Phase 2 API Guide:** See ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md
- **DB Schema:** See db/29_asset_master_v2_phase2.sql
- **Unit Tests:** 35/35 passing (import-helpers: 23, import-parser: 12)
- **Build Status:** ✅ Passing on integrate/pm-phase1-main

---

## Next Steps

1. ✅ All 4 endpoints implemented and unit tested
2. ⬜ Integration testing with real Excel files
3. ⬜ UI integration (import tab in Asset Master frontend)
4. ⬜ Performance testing (1000+ row batches)
5. ⬜ Deployment validation (Vercel production)

---

**Last Updated:** 2026-05-21 23:45 KST  
**Test Scripts:** test-import-api-endpoints.sh, curl-examples-import-api.sh
