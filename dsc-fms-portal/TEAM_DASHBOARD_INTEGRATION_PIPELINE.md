# Team Dashboard Phase 2 — Integration Testing Pipeline

**Status:** Implementation Ready  
**Last Updated:** 2026-06-07  
**Target:** Full API integration verification

---

## Overview

This document defines the complete integration testing pipeline for Team Dashboard Phase 2 APIs. The pipeline includes:

1. **Unit Tests** - Individual endpoint validation
2. **Integration Tests** - Cross-endpoint data flow verification
3. **Schema Tests** - Database integrity verification
4. **Auth Tests** - Authentication and authorization
5. **Performance Tests** - Response time validation

---

## Phase 1: Unit Endpoint Testing

### 1.1 Member Endpoints

#### GET /api/team/members (List)
```bash
# Test: List with defaults
curl -s http://localhost:3000/api/team/members \
  | jq '.success, .data | length'

# Expected: true, (>0 or 0)
```

**Validation Points:**
- [x] Returns 200 status
- [x] Response has `success: true`
- [x] Response has `data` array
- [x] Response has `pagination` object
- [ ] Pagination contains: page, limit, total, totalPages

**Test Cases:**
1. Default params: page=1, limit=20
2. Custom page: page=2, limit=5
3. Search filter: search=keyword
4. Department filter: department=기술
5. Active filter: active=true
6. Clamping: page=0 → page=1, limit=10000 → limit=100

---

#### POST /api/team/members (Create)
```bash
# Test: Create new member
curl -s -X POST http://localhost:3000/api/team/members \
  -H "authorization: Bearer $JWT" \
  -H "content-type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "department": "기술",
    "start_date": "2026-01-01"
  }' | jq '.success, .data.id'

# Expected: true, <uuid>
```

**Validation Points:**
- [x] Returns 201 status on success
- [x] Returns 401 without auth
- [x] Returns 400 with missing required fields
- [ ] Created record has UUID id
- [ ] Created record appears in list query
- [ ] Email is unique (or handled appropriately)

**Test Cases:**
1. Valid creation with all fields
2. Valid creation with minimal fields (name, email)
3. Missing name → 400
4. Missing email → 400
5. Invalid email format → validation
6. Duplicate email → unique constraint
7. Department validation
8. Date format validation

---

#### GET /api/team/members/:id (Retrieve)
```bash
# Test: Get single member
curl -s http://localhost:3000/api/team/members/$MEMBER_ID \
  | jq '.success, .data.id'

# Expected: true, $MEMBER_ID
```

**Validation Points:**
- [ ] Returns 200 for existing member
- [ ] Returns 404 for nonexistent member
- [ ] Includes related team_structure data
- [ ] Includes related portfolio_items
- [ ] Includes related activity_log

---

#### PUT /api/team/members/:id (Update)
```bash
# Test: Update member
curl -s -X PUT http://localhost:3000/api/team/members/$MEMBER_ID \
  -H "authorization: Bearer $JWT" \
  -H "content-type: application/json" \
  -d '{"name": "Updated Name"}' \
  | jq '.success, .data.name'

# Expected: true, "Updated Name"
```

**Validation Points:**
- [ ] Returns 200 on success
- [ ] Returns 401 without auth
- [ ] Partial update supported
- [ ] Only modifies specified fields
- [ ] Returns updated record
- [ ] Changes reflected in list query

---

#### DELETE /api/team/members/:id (Delete)
```bash
# Test: Delete member
curl -s -X DELETE http://localhost:3000/api/team/members/$MEMBER_ID \
  -H "authorization: Bearer $JWT" \
  | jq '.success, .data.id'

# Expected: true, $MEMBER_ID
```

**Validation Points:**
- [ ] Returns 200 on success
- [ ] Returns 401 without auth
- [ ] Record removed from list
- [ ] Subsequent GET returns 404
- [ ] Related records handled appropriately

---

### 1.2 Structure Endpoints

#### GET /api/team/structure
```bash
# Test: Get org structure tree
curl -s http://localhost:3000/api/team/structure \
  | jq '.data | keys'

# Expected: ["tree", "flat"]
```

**Validation Points:**
- [x] Returns 200 status
- [x] Response has tree structure
- [x] Tree has root nodes
- [ ] Each node has children array
- [ ] Flat array matches tree structure
- [ ] Orphans properly surfaced as roots

---

#### POST /api/team/structure (Upsert)
```bash
# Test: Add structure relationship
curl -s -X POST http://localhost:3000/api/team/structure \
  -H "authorization: Bearer $JWT" \
  -H "content-type: application/json" \
  -d '{
    "member_id": "'$MEMBER_ID'",
    "reports_to_id": null,
    "position_level": 0
  }' | jq '.success, .data.member_id'

# Expected: true, $MEMBER_ID
```

**Validation Points:**
- [ ] Returns 201 on creation
- [ ] Returns 200 on update
- [ ] Creates hierarchy relationships
- [ ] Validates member_id exists
- [ ] Position level is numeric
- [ ] Reports_to_id is optional

---

### 1.3 Portfolio Endpoints

#### GET /api/team/portfolio
```bash
# Test: List all portfolio items
curl -s http://localhost:3000/api/team/portfolio \
  | jq '.success, .data | length'

# Expected: true, (>=0)
```

**Validation Points:**
- [x] Returns 200 status
- [x] Response is array or empty
- [ ] Supports memberId filter
- [ ] Supports status filter
- [ ] Returns expected fields

---

#### POST /api/portfolio/:memberId (Create)
```bash
# Test: Add portfolio item
curl -s -X POST http://localhost:3000/api/portfolio/$MEMBER_ID \
  -H "authorization: Bearer $JWT" \
  -H "content-type: application/json" \
  -d '{
    "project_name": "Test Project",
    "description": "Test description",
    "role": "Lead Developer",
    "status": "completed"
  }' | jq '.success, .data.project_name'

# Expected: true, "Test Project"
```

**Known Issues:**
- Schema cache missing 'image_url' column — needs refresh

**Validation Points:**
- [ ] Returns 201 on success
- [ ] Returns 401 without auth
- [ ] Returns 400 without project_name
- [ ] Returns created item
- [ ] Status defaults to 'in_progress'

---

### 1.4 Activity Endpoints

#### GET /api/team/activity
```bash
# Test: List activity log
curl -s http://localhost:3000/api/team/activity?limit=10 \
  | jq '.success, .data | length'

# Expected: true, (<=10)
```

**Validation Points:**
- [x] Returns 200 status
- [x] Respects limit parameter
- [x] Max limit enforced (200)
- [ ] Supports memberId filter
- [ ] Supports activity_type filter
- [ ] Ordered by timestamp DESC

---

#### POST /api/team/activity (Log)
```bash
# Test: Log activity
curl -s -X POST http://localhost:3000/api/team/activity \
  -H "authorization: Bearer $JWT" \
  -H "content-type: application/json" \
  -d '{
    "member_id": "'$MEMBER_ID'",
    "activity_type": "login",
    "details": "Logged in from web"
  }' | jq '.success, .data.activity_type'

# Expected: true, "login"
```

**Known Issues:**
- Schema cache missing 'activity_type' column — needs refresh

**Validation Points:**
- [ ] Returns 201 on success
- [ ] Returns 400 without member_id
- [ ] Returns 400 without activity_type
- [ ] Timestamp auto-generated

---

## Phase 2: Integration Testing

### 2.1 Complete Member Lifecycle

```javascript
// Pseudocode: Full member lifecycle test
1. Create member → get ID
2. Verify in list → found with correct data
3. Update member → name changed
4. Verify update → list shows new name
5. Create portfolio item for member
6. Log activity for member
7. Verify all related data accessible via GET :id
8. Delete member
9. Verify removed from list
10. Verify related records cleaned up
```

### 2.2 Organizational Structure Flow

```javascript
// Pseudocode: Org structure test
1. Create CEO member (reports_to_id = null)
2. Create Manager member (reports_to_id = CEO.id)
3. Create IC member (reports_to_id = Manager.id)
4. Get structure tree
5. Verify:
   - CEO is root
   - Manager is under CEO
   - IC is under Manager
   - Tree hierarchy correct
6. Update Manager's reporting
7. Verify tree reflects change
```

### 2.3 Data Integrity Cross-Checks

```javascript
// Pseudocode: Data integrity checks
1. Create member
2. Add portfolio items
3. Log activities
4. Fetch member by ID (includes related data)
5. Verify:
   - Member data matches creation
   - Portfolio items match inserted data
   - Activity log contains logged actions
   - No data loss or corruption
```

---

## Phase 3: Schema Validation Tests

### 3.1 Required Tables

```sql
-- Verify all required tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
AND table_name IN (
  'team_members',
  'team_structure',
  'portfolio_items',
  'activity_log'
);
-- Expected: 4 rows
```

### 3.2 Required Columns

```sql
-- team_members columns
SELECT column_name FROM information_schema.columns
WHERE table_name='team_members'
ORDER BY ordinal_position;
-- Must include: id, name, email, department, active, created_at, updated_at

-- portfolio_items columns
SELECT column_name FROM information_schema.columns
WHERE table_name='portfolio_items'
ORDER BY ordinal_position;
-- Must include: id, member_id, project_name, status, image_url, created_at

-- activity_log columns
SELECT column_name FROM information_schema.columns
WHERE table_name='activity_log'
ORDER BY ordinal_position;
-- Must include: id, member_id, activity_type, details, created_at
```

### 3.3 RLS Policies

```sql
-- Verify RLS policies exist
SELECT policy_name, permissive, operation
FROM pg_policies
WHERE schemaname='public'
ORDER BY tablename, policy_name;
-- Expected:
-- - team_members: SELECT (public), INSERT/UPDATE/DELETE (authenticated)
-- - portfolio_items: SELECT (public), INSERT/UPDATE/DELETE (authenticated)
-- - activity_log: SELECT (public), INSERT (authenticated)
-- - team_structure: SELECT (public), INSERT/UPDATE/DELETE (authenticated)
```

---

## Phase 4: Authentication Tests

### 4.1 JWT Token Validation

```javascript
// Valid token (not expired)
const validJWT = makeJwt({
  sub: 'user-123',
  exp: Math.floor(Date.now() / 1000) + 3600,
  email: 'user@example.com'
});

// Expired token
const expiredJWT = makeJwt({
  sub: 'user-123',
  exp: 1
});

// Tests:
// 1. Valid JWT → request succeeds (201)
// 2. Expired JWT → 401 unauthorized
// 3. Missing JWT → 401 unauthorized
// 4. Malformed JWT → 401 unauthorized
// 5. JWT without Bearer prefix → 401 unauthorized
```

### 4.2 Authorization Tests

```javascript
// Test: User can only modify own data?
// Test: Only admins can delete members?
// Test: Public endpoints don't require auth?
```

---

## Phase 5: Performance Tests

### 5.1 Response Time Targets

```javascript
// Target: All endpoints <200ms (excluding network)

// List endpoints: <100ms
// - GET /api/team/members (with 100 records)
// - GET /api/team/portfolio
// - GET /api/team/activity

// Single record: <50ms
// - GET /api/team/members/:id
// - GET /api/portfolio/:memberId

// Create operations: <150ms
// - POST /api/team/members
// - POST /api/portfolio/:memberId
// - POST /api/team/activity

// Pagination: <100ms at page=100, limit=20
```

### 5.2 Load Testing

```bash
# Load test 100 concurrent requests
ab -n 100 -c 10 http://localhost:3000/api/team/members?limit=1

# Expected: <5% failure rate, avg response <200ms
```

---

## Continuous Integration Setup

### GitHub Actions Workflow

```yaml
name: Team Dashboard API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start dev server
        run: npm run dev &
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SERVICE_ROLE_KEY }}
      
      - name: Run API verification
        run: node scripts/verify-team-dashboard-comprehensive.js
      
      - name: Run integration tests
        run: npm run test -- __tests__/api/team-dashboard-phase2.test.ts
```

---

## Test Execution Checklist

### Before Each Deployment

- [ ] Run comprehensive API verification
- [ ] Check build success (npm run build)
- [ ] Verify all endpoints accessible
- [ ] Confirm auth working
- [ ] Test at least one full member lifecycle
- [ ] Verify database schema current
- [ ] Check error messages meaningful

### Pre-Production

- [ ] Load testing (100+ concurrent)
- [ ] Full integration test suite passing
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Error handling comprehensive
- [ ] Rollback plan documented

---

## Troubleshooting Guide

### Issue: 500 Error on POST /api/portfolio

**Symptom:** "Could not find the 'image_url' column of 'portfolio_items' in the schema cache"

**Solution:**
```sql
-- Option 1: Refresh schema cache
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Option 2: Check column exists
SELECT column_name FROM information_schema.columns
WHERE table_name='portfolio_items';

-- Option 3: Check Supabase dashboard directly
-- Navigate to: Database → portfolio_items → Columns
```

### Issue: 400 Error on POST /api/team/activity

**Symptom:** "Could not find the 'activity_type' column of 'activity_log' in the schema cache"

**Solution:**
```sql
-- Verify activity_log schema
SELECT column_name FROM information_schema.columns
WHERE table_name='activity_log'
ORDER BY ordinal_position;
```

### Issue: Authentication Failing

**Symptom:** 401 on POST with valid JWT

**Solution:**
1. Verify env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
2. Check token not expired (exp claim)
3. Verify Authorization header format: `Bearer <token>`
4. Check lib/team/auth.ts is parsing correctly

---

## Test Data Cleanup

```sql
-- Clean up test data (Supabase SQL Editor)
DELETE FROM activity_log WHERE member_id IN (
  SELECT id FROM team_members
  WHERE email LIKE 'test-%@example.com'
);

DELETE FROM portfolio_items WHERE member_id IN (
  SELECT id FROM team_members
  WHERE email LIKE 'test-%@example.com'
);

DELETE FROM team_structure WHERE member_id IN (
  SELECT id FROM team_members
  WHERE email LIKE 'test-%@example.com'
);

DELETE FROM team_members
WHERE email LIKE 'test-%@example.com';
```

---

## References

- Deployment Checklist: `db/DEPLOY_CHECKLIST_team_dashboard_phase2.md`
- API Verification Report: `TEAM_DASHBOARD_API_VERIFICATION.md`
- Test File: `__tests__/api/team-dashboard-phase2.test.ts`
- Verification Scripts: `scripts/verify-team-dashboard-*.js`

---

**Status:** Ready for implementation  
**Next Step:** Run comprehensive verification and address schema issues
