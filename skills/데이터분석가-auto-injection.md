---
name: 데이터분석가-auto-injection
description: Auto-injection template for data-analyst role. Provides 5-step validation + SQL templates.
type: agent-system-instructions
phase: 4
applies_to: data-analyst
activation_pattern: data-validation, fullstack-feature
---

# 데이터분석가 (Data-Analyst) — Auto-Injection Template

**Auto-loaded when:** Task mentions validate/migration/verify/api AND agentRole=data-analyst

---

## 🔴 API 검증 5단계 체크리스트 (REQUIRED ORDER)

Every API must complete these 5 steps in sequence before sign-off:

### Step 1️⃣ : Schema Validation
**Goal:** Verify API response schema matches contract

**Actions:**
- [ ] Check API response structure (JSON)
- [ ] Compare against documented API contract
- [ ] Verify all required fields present
- [ ] Verify field types correct (string/number/boolean/object/array)
- [ ] Check nullable fields marked correctly
- [ ] Verify no unexpected fields in response

**Query template (SQL):**
```sql
-- Check table schema matches API contract
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'your_table'
ORDER BY ordinal_position;
```

**Defect examples:**
- ❌ API returns `user_id` as string, but database stores integer
- ❌ Required field `email` is sometimes NULL
- ❌ Extra field `internal_debug_info` leaked in response

---

### Step 2️⃣ : Response Format Validation
**Goal:** Verify response follows expected format (pagination, error structure, etc.)

**Actions:**
- [ ] Verify list responses include pagination (limit, offset, total_count)
- [ ] Verify error responses have consistent structure
- [ ] Check success/error distinction (200 vs 400/500)
- [ ] Verify timestamps in ISO 8601 format
- [ ] Check array responses don't return more than limit

**Query template (SQL):**
```sql
-- Check row counts for pagination
SELECT COUNT(*) as total_count
FROM your_table
WHERE created_at >= '2026-06-01';

-- Expected: total_count matches API response total_count
```

**Defect examples:**
- ❌ List response returns 1000 records when limit=10 requested
- ❌ Error response structure differs between endpoints
- ❌ Timestamps in wrong format (UNIX vs ISO 8601)

---

### Step 3️⃣ : Edge Case Value Validation
**Goal:** Verify API handles edge cases (NULL, empty, very large values)

**Actions:**
- [ ] Test with NULL values (API doesn't return "null" string)
- [ ] Test with empty arrays (returns [] not null)
- [ ] Test with very long strings (check truncation/validation)
- [ ] Test with negative numbers (if applicable)
- [ ] Test with special characters (quotes, newlines, etc.)
- [ ] Test with zero values (0 treated as valid, not NULL)

**Query template (SQL):**
```sql
-- Find records with NULL in key fields
SELECT id, name, email
FROM your_table
WHERE name IS NULL OR email IS NULL
LIMIT 10;

-- Verify API handles these correctly
```

**Defect examples:**
- ❌ API returns `{"name": null}` for NULL database value (should return true null)
- ❌ API crashes on very long strings (>1000 chars)
- ❌ Special characters not escaped in JSON (causes parsing errors)

---

### Step 4️⃣ : RLS Enforcement Validation
**Goal:** Verify Row-Level Security policies block unauthorized access

**Actions:**
- [ ] Test: Authorized user can read their own records
- [ ] Test: Unauthorized user gets 403 Forbidden (not 200)
- [ ] Test: Admin user can read all records (if role permits)
- [ ] Test: RLS policy doesn't leak data in error messages
- [ ] Test: RLS works with filters (`?user_id=X`)

**Query template (SQL):**
```sql
-- Check RLS policies enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'your_table';

-- Run SELECT as different users to verify RLS
SELECT * FROM your_table; -- As regular user
-- Expected: Only rows where user_id = current_user_id

SELECT * FROM your_table; -- As admin
-- Expected: All rows (if admin role has bypass)
```

**Defect examples:**
- ❌ Regular user can see other users' records
- ❌ RLS returns 500 error instead of 403 Forbidden
- ❌ Error message reveals database structure ("table.user_id =...")

---

### Step 5️⃣ : Post-Deployment Verification
**Goal:** After API deployed to production, verify live behavior

**Actions:**
- [ ] Call API in production environment (not staging)
- [ ] Verify response time < SLA (e.g., <2 seconds)
- [ ] Check logs for errors (no 500s in past hour)
- [ ] Run 10-record spot check (verify sample data intact)
- [ ] Monitor metrics (request count, error rate)

**Query template (SQL for spot checks post-deployment):**
```sql
-- Spot check: Verify migration didn't lose data
SELECT COUNT(*) as original_count FROM your_table_backup;
SELECT COUNT(*) as deployed_count FROM your_table;
-- Both counts should match (within 1-2 rows for recent activity)

-- Spot check: Verify calculations still work
SELECT 
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  MAX(amount) as max_amount
FROM your_table
WHERE created_at >= CURRENT_DATE - INTERVAL 1 DAY;
```

**Defect examples:**
- ❌ API returns data but takes 10+ seconds (SLA violated)
- ❌ Logs show 20% error rate (vs. 0% in staging)
- ❌ Spot check finds 50 missing records (migration data loss)

---

## 🟡 General Rules (Guidelines)

### Rule 1: Data Completeness
For any data migration or API change:
- Count records before & after
- Before ≠ After? Investigate why (deleted records, filtered results, etc.)
- Document count difference in validation report

### Rule 2: Calculation Accuracy
When API returns calculated fields (totals, averages, etc.):
- Manually verify 3+ samples using SQL
- Example: API returns `order.total = $150`
  - SELECT SUM(amount) FROM order_items WHERE order_id = X should = $150
- If calculations don't match: Block deployment

### Rule 3: NULL Handling
Check how API treats NULL values:
- ❌ Don't return string "null"
- ❌ Don't return empty string ""
- ✅ Return actual null (JSON null, not string)
- ✅ Or return 0 (for numeric fields with default zero)

### Rule 4: Timestamp Consistency
All API timestamps must:
- Be in ISO 8601 format: `2026-06-05T11:45:00Z`
- Include timezone (UTC recommended)
- Match database field type (TIMESTAMP vs DATE)

### Rule 5: Error Message Privacy
API error responses must NOT leak:
- Database column names
- SQL query structure
- User IDs of other users
- Internal API architecture

### Rule 6: Performance Baseline
Every API must meet minimum performance:
- Single record fetch: <500ms
- List (10 records): <1s
- List (100 records): <2s
- List (1000 records): <3s

---

## 📋 Data Validation Checklist

**Before signing off on any API/migration:**

### Pre-Validation (5 min)
- [ ] API code reviewed + approved
- [ ] Database migrations have run in target environment
- [ ] Test data available (minimum 10 sample records)
- [ ] SQL access available to validate

### 5-Step Validation (30-45 min)
- [ ] Step 1: Schema validation complete
- [ ] Step 2: Response format validation complete
- [ ] Step 3: Edge case value validation complete
- [ ] Step 4: RLS enforcement verified
- [ ] Step 5: Post-deployment spot check ready

### Data Quality Assessment (10 min)
- [ ] Before/after record counts match (or difference explained)
- [ ] Calculations manually verified (3+ samples)
- [ ] NULL handling verified (actual null, not string)
- [ ] Timestamps in correct format
- [ ] Error messages don't leak internal info

### Deployment Readiness (5 min)
- [ ] All 5 steps complete
- [ ] No data quality issues found
- [ ] Performance baseline met
- [ ] 🟢 **SIGN-OFF: Ready for QA** OR 🔴 **BLOCKED: Requires fixes**

---

## 🔗 Integration with Other Roles

### Input from Web-Builder
- Receive: API routes + database migrations
- Validate: Schema matches contract, RLS implemented
- Pass: Validation report + SQL test suite

### Input from Evaluator
- Receive: QA test results
- Cross-check: API contract validation + test coverage
- Coordinate: Ensure data quality checks included in QA

### Output to Secretary
- Submit: Data validation report (5-step complete)
- Notify: Any data quality issues or migration concerns
- Flag: If deployment requires data correction

---

## 🚨 Common Data Validation Defects

### Defect 1: Missing RLS on Sensitive Table
- **Symptom:** User can query other users' records
- **Fix:** Add RLS policy to table
- **Validation:** Test SELECT as different user IDs

### Defect 2: NULL Confusion in JSON
- **Symptom:** API returns `"field": "null"` (string, not null)
- **Fix:** Return actual JSON null or 0 (not string "null")
- **Validation:** Spot check JSON parsing doesn't break

### Defect 3: Migration Data Loss
- **Symptom:** Deployed to production, 50 records missing
- **Fix:** Fix migration logic + backfill missing records
- **Validation:** Before/after count verification

### Defect 4: Calculation Mismatch
- **Symptom:** API returns subtotal=$100, manual calc=$95
- **Fix:** Correct calculation logic (check discount/tax handling)
- **Validation:** Manually verify all sample records

### Defect 5: Performance Regression
- **Symptom:** New API takes 10+ seconds (vs. 1s for old API)
- **Fix:** Add database index, optimize query, limit result set
- **Validation:** Performance test with 1000+ records

---

## 📊 Data Validation Report Template

```markdown
# Data Validation Report — [Feature Name]

**Date:** [Date]  
**Analyst:** [Name]  
**API:** [Endpoint path]  
**Status:** 🟢 APPROVED / 🔴 BLOCKED

## 5-Step Validation

### Step 1: Schema Validation ✅
- Response structure matches contract
- All required fields present
- Field types correct (string/number/etc.)
- No unexpected fields

### Step 2: Response Format ✅
- Pagination includes limit, offset, total_count
- Error responses have consistent structure
- Timestamps in ISO 8601 format
- Array responses respect limit

### Step 3: Edge Case Values ✅
- NULL values handled correctly (actual null, not "null")
- Empty arrays return [] (not null)
- Long strings truncated properly
- Special characters escaped

### Step 4: RLS Enforcement ✅
- Authorized user can access own records
- Unauthorized user gets 403 Forbidden
- RLS policy prevents data leakage
- Admin bypass works (if applicable)

### Step 5: Post-Deployment Verification ✅
- Live API response matches staging
- Performance < 2 seconds
- No errors in logs (past hour)
- Spot checks: [list 10 sample record IDs verified]

## Data Quality Assessment

| Check | Result | Notes |
|-------|--------|-------|
| Before/After count | ✅ Match (1234 → 1234) | No data loss |
| Calculations verified | ✅ Spot checked 5 records | Totals accurate |
| NULL handling | ✅ JSON null, not string | Correct format |
| Timestamp format | ✅ ISO 8601 UTC | Consistent |
| Error privacy | ✅ No schema leakage | Generic messages |
| Performance | ✅ 1.2s for 100 records | Within SLA |

## Defects Found

### Blockers
- [ ] None

### Minor Issues
- [ ] [Issue 1]: [description, fix]

## Sign-Off

- [ ] All 5 steps complete
- [ ] Data quality verified
- [ ] Zero blockers
- [ ] Ready for QA

**Approved by:** [Analyst name]  
**Date:** [Date]
```

---

**Auto-loaded for:** `data-validation` + `fullstack-feature` task patterns  
**Version:** Phase 4.0  
**Last Updated:** 2026-06-05
