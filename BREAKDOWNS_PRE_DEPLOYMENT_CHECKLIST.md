# BM-P1: Breakdown Management Phase 1 — Pre-Deployment Verification Checklist

**Project:** Breakdown Management Phase 1 (BM-P1)  
**Status:** Pre-Deployment Verification (72h window)  
**Deadline:** 2026-06-02 18:00 KST  
**Verifier:** QA Specialist (Phase C #14)  

---

## Executive Summary

BM-P1 is a complete Breakdown Management API with:
- **Database:** 1 main table (breakdown_reports) + 1 analytical view (breakdown_analysis)
- **Indexes:** 8 indexes on critical query paths
- **RLS Policies:** 3 policies (view_all, create, update_own)
- **API Endpoints:** 5 endpoints (GET list, POST create, GET detail, PATCH update, GET analytics)
- **Validation:** Zod schemas for all inputs
- **Triggers:** Auto-update trigger for updated_at timestamp

---

## SECTION 1: Database Schema Verification (8 items)

### ✅ 1.1 Table Existence
- [ ] **breakdown_reports table exists** — Verify with: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'breakdown_reports';`
  - Expected: 1 row

### ✅ 1.2 Core Columns
- [ ] **UUID primary key (id)** — `SELECT column_name FROM information_schema.columns WHERE table_name='breakdown_reports' AND column_name='id';`
- [ ] **Foreign key asset_id → assets(id)** — Check constraint existence
- [ ] **Status column with CHECK constraint** — Values: reported, acknowledged, in_progress, resolved, won_fix
- [ ] **Severity column with CHECK constraint** — Values: minor, normal, major, line_down
- [ ] **Category column with CHECK constraint** — Values: mechanical, electrical, hydraulic, software, operator_error, unknown
- [ ] **Timestamp columns** — reported_at, started_at, resolved_at, created_at, updated_at
- [ ] **Soft delete column (deleted_at)** — NULL when active

### ✅ 1.3 Generated Columns
- [ ] **duration_minutes GENERATED column** — Formula: `(resolved_at - started_at) / 60` minutes
  - Verification: Insert test row, check auto-calculation

### ✅ 1.4 Foreign Keys
- [ ] **asset_id → assets(id)** — ON DELETE RESTRICT
- [ ] **reported_by → auth.users(id)** — ON DELETE SET NULL
- [ ] **assigned_to → auth.users(id)** — ON DELETE SET NULL
- [ ] **resolved_by → auth.users(id)** — ON DELETE SET NULL

### ✅ 1.5 Indexes
- [ ] **idx_breakdown_reports_asset_id** — (asset_id)
- [ ] **idx_breakdown_reports_status** — (status) WHERE deleted_at IS NULL
- [ ] **idx_breakdown_reports_severity** — (severity) WHERE deleted_at IS NULL
- [ ] **idx_breakdown_reports_reported_at** — (reported_at DESC)
- [ ] **idx_breakdown_reports_resolved_at** — (resolved_at DESC) WHERE resolved_at IS NOT NULL
- [ ] **idx_breakdown_reports_asset_month** — (asset_id, DATE_TRUNC('month', reported_at))
- [ ] **idx_breakdown_reports_reported_by** — (reported_by)
- [ ] **idx_breakdown_reports_assigned_to** — (assigned_to)

Query: `SELECT indexname FROM pg_indexes WHERE tablename = 'breakdown_reports' ORDER BY indexname;`

### ✅ 1.6 Trigger
- [ ] **breakdown_reports_updated_at_trigger** — Updates updated_at on every UPDATE
  - Verification: Update record, check updated_at changes

### ✅ 1.7 View
- [ ] **breakdown_analysis view exists** — `SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'breakdown_analysis';`
  - Columns: asset_id, machine_asset_number, asset_name, month, resolved_count, open_count, total_count, severity distribution, avg_mttr_minutes, avg_mtbf_hours, total_downtime_minutes

### ✅ 1.8 Row Level Security
- [ ] **breakdown_reports has RLS enabled** — `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'breakdown_reports';`
  - Expected: relrowsecurity = true

---

## SECTION 2: RLS Policy Testing (4 items)

### ✅ 2.1 Policy: users_view_all_breakdowns (SELECT)
- [ ] **All non-deleted breakdowns visible**
  - Test: `SELECT * FROM breakdown_reports WHERE deleted_at IS NULL` (as authenticated user)
  - Expected: All rows returned

- [ ] **Deleted breakdowns hidden**
  - Test: Mark row as deleted, query, verify excluded
  - Expected: Row not in results

### ✅ 2.2 Policy: users_create_breakdowns (INSERT)
- [ ] **Authenticated user can create**
  - Test: POST with valid JWT token
  - Expected: 201 Created

- [ ] **Anonymous user blocked**
  - Test: POST without Bearer token
  - Expected: 401 Unauthorized

### ✅ 2.3 Policy: users_update_own_breakdowns (UPDATE)
- [ ] **Reporter can update own breakdown**
  - Test: User A creates breakdown, updates as User A
  - Expected: 200 OK

- [ ] **Assigned technician can update**
  - Test: Set assigned_to = User B, update as User B
  - Expected: 200 OK

- [ ] **Admin can update any breakdown**
  - Test: Admin user updates any breakdown
  - Expected: 200 OK

- [ ] **Non-owner cannot update**
  - Test: User A creates, User B (non-owner) tries to update
  - Expected: 403 Forbidden or 0 rows affected

### ✅ 2.4 Hard Delete Prevention
- [ ] **Hard delete via DELETE blocked**
  - Test: Try direct DELETE statement
  - Expected: RLS policy blocks (0 rows deleted)

- [ ] **Soft delete via deleted_at works**
  - Test: UPDATE breakdown SET deleted_at = now()
  - Expected: 200 OK, row hidden from queries

---

## SECTION 3: API Endpoint Testing (5 endpoints × 6 tests = 30 items)

### Endpoint 1: GET /api/bm/breakdowns (List with filters)

#### 3.1.1 Basic List
- [ ] **GET /api/bm/breakdowns returns list**
  - Status: 200 OK
  - Response: { data: [...], pagination: { total, limit, offset, has_more } }

#### 3.1.2 Pagination
- [ ] **limit parameter works** (test: ?limit=10)
  - Expected: 10 records max
  - Verify: pagination.limit = 10

- [ ] **offset parameter works** (test: ?offset=10)
  - Expected: Skip first 10, return next batch
  - Verify: pagination.offset = 10

- [ ] **limit capped at 500** (test: ?limit=1000)
  - Expected: Actual limit = 500

#### 3.1.3 Filters
- [ ] **Filter by asset_id** (test: ?asset_id=UUID)
  - Expected: Only records matching asset_id

- [ ] **Filter by status** (test: ?status=resolved,in_progress)
  - Expected: Only matching statuses (comma-separated)

- [ ] **Filter by severity** (test: ?severity=line_down,major)
  - Expected: Only matching severities

- [ ] **Date range filters** (test: ?reported_from=2026-05-01T00:00:00Z&reported_to=2026-05-31T23:59:59Z)
  - Expected: Records within date range

#### 3.1.4 Sorting
- [ ] **Sort by reported_at DESC (default)**
  - Expected: Newest first

- [ ] **Sort by reported_at ASC** (test: ?sort_dir=asc)
  - Expected: Oldest first

#### 3.1.5 Response Format
- [ ] **Asset relationship expanded**
  - Response includes: machine_asset_number, asset_name (from assets table)

#### 3.1.6 Empty Results
- [ ] **No data returns empty array**
  - Test: Query with non-matching filter
  - Expected: { data: [], pagination: { total: 0, ... } }

### Endpoint 2: POST /api/bm/breakdowns (Create)

#### 3.2.1 Valid Creation
- [ ] **Create with required fields**
  - Body: { asset_id, description, severity, category }
  - Expected: 201 Created, returns created breakdown with ID

- [ ] **reported_at auto-set to now()**
  - Expected: reported_at ≈ current timestamp

- [ ] **Status defaults to reported**
  - Expected: status = 'reported'

- [ ] **reported_by set from JWT token**
  - Expected: reported_by matches authenticated user ID

#### 3.2.2 Optional Fields
- [ ] **description_ta (Tamil) optional**
  - Test: POST without description_ta
  - Expected: 201 Created

- [ ] **category optional**
  - Test: POST without category
  - Expected: 201 Created

- [ ] **started_at optional**
  - Test: POST without started_at
  - Expected: started_at = reported_at

- [ ] **Photos array optional**
  - Test: POST without photos
  - Expected: photos = []

#### 3.2.3 Validation
- [ ] **asset_id must be UUID**
  - Test: ?asset_id=invalid
  - Expected: 400, error details

- [ ] **description required**
  - Test: { asset_id, description: '' }
  - Expected: 400, validation error

- [ ] **severity enum validation**
  - Test: ?severity=invalid_level
  - Expected: 400

- [ ] **Asset must exist**
  - Test: POST with non-existent asset_id
  - Expected: 404 Asset not found

#### 3.2.4 Authentication
- [ ] **Requires Bearer token**
  - Test: POST without Authorization header
  - Expected: 401 Unauthorized

- [ ] **Invalid token rejected**
  - Test: Bearer token_invalid
  - Expected: 401 Unauthorized

#### 3.2.5 Photo URLs
- [ ] **Photos must be valid URLs**
  - Test: { photos: ['not-a-url'] }
  - Expected: 400 validation error

#### 3.2.6 Response Format
- [ ] **Returns full breakdown object**
  - Includes: id, asset_id, machine_asset_number, asset_name, status, severity, etc.

### Endpoint 3: GET /api/bm/breakdowns/{id} (Retrieve Single)

#### 3.3.1 Success Case
- [ ] **Get existing breakdown**
  - Expected: 200 OK, full breakdown object

#### 3.3.2 Not Found
- [ ] **Get non-existent breakdown**
  - Test: GET /api/bm/breakdowns/invalid-uuid
  - Expected: 404 Breakdown not found

#### 3.3.3 Soft Delete
- [ ] **Deleted breakdown hidden**
  - Test: Set deleted_at, then GET
  - Expected: 404 not found

#### 3.3.4 Asset Relationship
- [ ] **Asset details included**
  - Expected: machine_asset_number, asset_name populated

#### 3.3.5 All Fields
- [ ] **All columns returned**
  - Verify: id, asset_id, status, severity, description, category, started_at, resolved_at, reported_at, duration_minutes, assigned_to, reported_by, resolved_by, root_cause, action_taken, photos, documents, created_at, updated_at

#### 3.3.6 Timestamp Formatting
- [ ] **ISO 8601 format for timestamps**
  - Example: 2026-05-30T07:22:00.000Z

### Endpoint 4: PATCH /api/bm/breakdowns/{id} (Update)

#### 3.4.1 Valid Updates
- [ ] **Update status**
  - Test: PATCH with { status: 'resolved' }
  - Expected: 200 OK

- [ ] **Update severity**
  - Test: PATCH with { severity: 'major' }
  - Expected: 200 OK

- [ ] **Update assigned_to**
  - Test: PATCH with { assigned_to: 'UUID' }
  - Expected: 200 OK

- [ ] **Update resolved_at**
  - Test: PATCH with { resolved_at: ISO_DATETIME }
  - Expected: 200 OK, duration_minutes auto-calculated

#### 3.4.2 Status Transitions
- [ ] **Valid transition: reported → acknowledged**
  - Expected: 200 OK

- [ ] **Valid transition: acknowledged → in_progress**
  - Expected: 200 OK

- [ ] **Valid transition: in_progress → resolved**
  - Expected: 200 OK

- [ ] **Invalid transition: resolved → reported**
  - Expected: 400 Invalid status transition

#### 3.4.3 Validation
- [ ] **Invalid status rejected**
  - Test: { status: 'invalid_status' }
  - Expected: 400

- [ ] **UUID validation for assigned_to**
  - Test: { assigned_to: 'not-uuid' }
  - Expected: 400

#### 3.4.4 Authorization
- [ ] **Only reporter/assigned/admin can update**
  - Test: User C (non-owner) updates
  - Expected: 403 Forbidden or 0 rows affected

#### 3.4.5 Duration Calculation
- [ ] **duration_minutes auto-calculated on resolved**
  - Test: Set resolved_at, verify duration_minutes populated
  - Expected: (resolved_at - started_at) in minutes

#### 3.4.6 Not Found
- [ ] **Update non-existent breakdown**
  - Test: PATCH /api/bm/breakdowns/invalid-uuid
  - Expected: 404 Not found

### Endpoint 5: GET /api/bm/breakdowns/analytics/summary (Analytics)

#### 3.5.1 Overall Metrics
- [ ] **GET /api/bm/breakdowns/analytics/summary returns overall_metrics**
  - Fields: total_breakdowns, resolved_count, open_count, resolution_rate, severity_distribution, total_downtime_minutes
  - Expected: 200 OK

#### 3.5.2 Asset Filter
- [ ] **Filter by asset_id**
  - Test: ?asset_id=UUID
  - Expected: Only data for that asset

#### 3.5.3 Month Filter
- [ ] **Filter by specific month**
  - Test: ?month=2026-05-01
  - Expected: Only data for May 2026

#### 3.5.4 Severity Distribution
- [ ] **Breakdown by severity**
  - Fields: line_down_count, major_count, normal_count, minor_count
  - Expected: Counts match breakdown_reports

#### 3.5.5 Performance Metrics
- [ ] **MTTR (Mean Time To Repair)**
  - Expected: avg(duration_minutes) for resolved breakdowns

- [ ] **MTBF (Mean Time Between Failures)**
  - Expected: Calculated from report frequency

#### 3.5.6 Pagination
- [ ] **Pagination on analytics data**
  - Test: ?limit=5&offset=0
  - Expected: 5 records, with has_more indicator

---

## SECTION 4: UI Integration & Mock Data (4 items)

### ✅ 4.1 Mock Data Creation
- [ ] **Prepare 20+ breakdown records** with varied:
  - Status: reported (5), acknowledged (3), in_progress (4), resolved (5), won_fix (3)
  - Severity: minor (3), normal (8), major (6), line_down (3)
  - Category: mechanical (8), electrical (5), hydraulic (4), software (2), operator_error (1)

### ✅ 4.2 Component Verification
- [ ] **List view displays breakdowns correctly**
- [ ] **Detail view shows all fields**
- [ ] **Status badge colors correct**
- [ ] **Severity indicators display properly**

### ✅ 4.3 Photo/Document Upload
- [ ] **Photos array stored and retrieved correctly**
- [ ] **Document URLs persist after update**

### ✅ 4.4 Date/Time Display
- [ ] **Timestamps formatted consistently (ISO 8601)**
- [ ] **Duration display in minutes**

---

## SECTION 5: Performance & Load Testing (4 items)

### ✅ 5.1 Response Times
- [ ] **GET /api/bm/breakdowns < 500ms**
  - Test: With 100+ records
  - Measure: Server response time

- [ ] **POST /api/bm/breakdowns < 500ms**
  - Measure: Create request latency

- [ ] **GET /api/bm/breakdowns/{id} < 300ms**
  - Measure: Single record retrieval

- [ ] **GET /api/bm/breakdowns/analytics/summary < 500ms**
  - Test: With multiple assets/months

### ✅ 5.2 Concurrent Load Test
- [ ] **Handle 10 concurrent requests**
  - Test: Parallel GETs
  - Expected: All succeed

- [ ] **Handle 50 concurrent requests**
  - Expected: No timeouts, error rate < 1%

- [ ] **Handle 100 concurrent requests**
  - Expected: Graceful degradation, no crashes

### ✅ 5.3 Database Performance
- [ ] **Index usage verified**
  - Query: EXPLAIN ANALYZE on filter queries
  - Expected: Index scans, not full table scans

- [ ] **Query plan optimal**
  - Expected: < 5ms for indexed queries

### ✅ 5.4 Large Dataset
- [ ] **1000+ records handled**
  - Test: List with 1000 records, pagination works
  - Expected: Fast pagination, correct counts

---

## SECTION 6: Security & Compliance (6 items)

### ✅ 6.1 SQL Injection Prevention
- [ ] **Parameterized queries used**
  - Code review: All DB queries use Supabase SDK (no string concatenation)
  - Test: Description with SQL: "'; DROP TABLE--"
  - Expected: Stored as literal, not executed

### ✅ 6.2 JWT Validation
- [ ] **Invalid tokens rejected**
  - Test: POST with expired/invalid JWT
  - Expected: 401 Unauthorized

- [ ] **Token signature verified**
  - Verify: jwt.verify() uses jwtSecret

### ✅ 6.3 RLS Enforcement
- [ ] **Service-role key used server-side**
  - Verify: Routes use supabaseServiceKey, not client key

- [ ] **Client-side calls respects RLS**
  - Expected: Any client without proper permissions gets 403

### ✅ 6.4 Input Validation
- [ ] **Zod schemas validate all inputs**
  - Verify: CreateBreakdownSchema, UpdateBreakdownSchema
  - Test: Invalid enum, format, length
  - Expected: 400 with details

### ✅ 6.5 CORS Headers
- [ ] **CORS properly configured**
  - Expected: Only allowed origins

### ✅ 6.6 Audit Trail
- [ ] **created_at recorded for all inserts**
- [ ] **updated_at auto-updated on changes**
- [ ] **reported_by, resolved_by tracked**

---

## SECTION 7: Error Handling (6 items)

### ✅ 7.1 Invalid Inputs
- [ ] **Bad UUID format**
  - Test: asset_id = "not-a-uuid"
  - Expected: 400 Validation failed

- [ ] **Invalid enum value**
  - Test: status = "invalid_status"
  - Expected: 400 with error details

- [ ] **Missing required fields**
  - Test: POST without description
  - Expected: 400 validation error

### ✅ 7.2 Foreign Key Constraints
- [ ] **Non-existent asset_id**
  - Expected: 404 Asset not found

- [ ] **Non-existent assigned_to user**
  - Expected: Record created with NULL assigned_to, or 400 (depending on schema)

### ✅ 7.3 Business Logic
- [ ] **Invalid status transition**
  - Test: Jump from reported → resolved
  - Expected: 400 Invalid status transition

- [ ] **Cannot resolve already resolved**
  - Test: PATCH already resolved breakdown
  - Expected: 400 or 409 Conflict

### ✅ 7.4 Database Errors
- [ ] **Connection loss handled**
  - Expected: 500 Internal server error (not crash)

- [ ] **Timeout handled**
  - Expected: 504 Gateway Timeout

### ✅ 7.5 Concurrency
- [ ] **Simultaneous updates merge correctly**
  - Test: Two users update same field simultaneously
  - Expected: Last-write-wins, consistent state

### ✅ 7.6 Soft Delete Safety
- [ ] **Cannot update deleted breakdown**
  - Test: PATCH deleted record
  - Expected: 404 Not found

---

## SECTION 8: Final Deployment Sign-Offs (2 items)

### ✅ 8.1 DevOps Engineer Approval (Phase C #12)
- [ ] **Infrastructure readiness confirmed**
  - Database: Supabase project, RLS policies enabled, backups configured
  - API: Vercel environment vars set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET)
  - Monitoring: Error tracking, performance monitoring configured
  - Approval signature: __________

### ✅ 8.2 QA Specialist Approval (Phase C #14)
- [ ] **All test cases passed**
  - Database schema: ✓ (8/8)
  - RLS policies: ✓ (4/4)
  - API endpoints: ✓ (30/30)
  - UI integration: ✓ (4/4)
  - Performance: ✓ (4/4)
  - Security: ✓ (6/6)
  - Error handling: ✓ (6/6)
  - **Total: 62/62 items verified**
- [ ] **No blockers remaining**
- [ ] **Approval signature: __________**

---

## Deliverables Status

### 📋 Pre-Deployment Checklist
- [ ] **32 items verified** (current: 0/32)
- [ ] **All sections passing** (DB Schema, RLS, API, UI, Performance, Security, Error Handling)

### 📊 Test Results Document
- [ ] **API endpoint tests** — All 5 endpoints, 30 test cases
- [ ] **Performance metrics** — Response times, load test results
- [ ] **Security validation** — SQL injection, JWT, RLS enforcement, input validation
- [ ] **Database verification** — Schema, indexes, triggers, view

### 📄 Deployment Readiness Report
- [ ] **DevOps sign-off** — Infrastructure readiness ✓
- [ ] **QA sign-off** — All test cases passed ✓
- [ ] **Production readiness confirmation**
- [ ] **Risk assessment** (if any)

### 🚀 Production Deployment SOP
- [ ] **Step-by-step Vercel deployment**
- [ ] **Database schema migration (if needed)**
- [ ] **Environment variables setup**
- [ ] **Rollback procedures**
- [ ] **Post-deployment verification**

---

## Verification Timeline

- **Start:** 2026-05-30 07:22 KST
- **DB Schema Verification:** 2026-05-30 08:00 KST
- **RLS Policy Testing:** 2026-05-30 09:00 KST
- **API Endpoint Testing:** 2026-05-30 12:00 KST
- **UI Integration & Mock Data:** 2026-05-30 16:00 KST
- **Performance & Security Testing:** 2026-05-31 10:00 KST
- **Documentation & Sign-offs:** 2026-06-01 14:00 KST
- **Final Review:** 2026-06-02 10:00 KST
- **Deployment Ready:** 2026-06-02 18:00 KST

---

**Status:** 🟡 IN PROGRESS  
**Progress:** Section 1 (Database Verification) — Starting now...
