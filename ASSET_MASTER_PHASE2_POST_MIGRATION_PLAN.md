---
name: Asset Master Phase 2 — Post-Migration Execution Plan
description: Action steps after user executes db/29 migration in Supabase SQL Editor
type: project
date: 2026-05-20 20:50 KST
status: READY_FOR_EXECUTION
---

# Asset Master Phase 2 — Post-Migration Execution Plan

## 📋 Background

**Current State (as of 2026-05-20 20:50 KST):**
- ✅ All 16 Asset APIs implemented in codebase (app/api/assets)
- ✅ Build passes (0 TypeScript errors)
- ✅ db/14 (BM-P1 technicians migration) applied to Supabase
- ❌ db/29 (Asset Master import tables) NOT YET applied
- ❌ 4 import endpoints return 500 (missing tables)

**Blocker:** User must execute db/29 migration in Supabase SQL Editor  
**Documentation:** USER_ACTION_ASSET_MASTER_DB_MIGRATION.md

---

## 🚀 Phase 1: Verify Migration Success (Immediate)

**Who:** Assistant (autonomous verification)  
**When:** Immediately after user reports migration completion  
**Duration:** 5 minutes

### Step 1.1: Check Supabase Schema
Run verification query in Supabase SQL Editor:
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('asset_import_batches', 'asset_import_items')
ORDER BY tablename;
```

**Expected Result:** 2 rows  
- asset_import_batches
- asset_import_items

### Step 1.2: Verify Index Creation
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('asset_import_batches', 'asset_import_items')
ORDER BY indexname;
```

**Expected Result:** 8 indexes  
- asset_import_batches_created_at_idx
- asset_import_batches_file_hash_idx
- asset_import_batches_org_id_idx
- asset_import_batches_status_idx
- asset_import_items_asset_idx
- asset_import_items_batch_idx
- asset_import_items_batch_status_idx
- asset_import_items_status_idx

### Step 1.3: Test RLS Policy
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('asset_import_batches', 'asset_import_items');
```

**Expected Result:** rowsecurity = true for both tables

---

## 🔄 Phase 2: Integration Testing (10 minutes)

**Who:** Web-Builder AI Agent  
**When:** After Step 1.3 verification passes  
**Duration:** 15 minutes

### Test Case 1: Preview Import Endpoint
```bash
curl -X POST http://localhost:3000/api/assets/import/preview \
  -H "Authorization: Bearer <test_token>" \
  -F "file=@test_import.xlsx"
```

**Expected:** 
- Status 200
- Returns: batch_id, total_rows, valid_rows, preview data

### Test Case 2: Batch List Endpoint
```bash
curl http://localhost:3000/api/assets/import/batches \
  -H "Authorization: Bearer <test_token>"
```

**Expected:**
- Status 200
- Returns: Array of batch records

### Test Case 3: Bulk Insert RPC Function
```sql
SELECT public.bulk_insert_assets(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '[{"item_id":"...", "row_number":1, ...}]'::jsonb
);
```

**Expected:** 
- Status: Success with result counts

---

## 📊 Phase 3: Development Continuation (Day 5-7)

**Who:** Web-Builder AI Agent  
**When:** After Phase 2 tests pass  
**Deliverables:**

### API Integration Tests
- [ ] Import preview validation (duplicate detection, schema validation)
- [ ] Batch processing with RLS isolation
- [ ] Error handling and rollback scenarios
- [ ] Bulk insert atomicity verification

### UI Feature Readiness
- [ ] Import form component ready for preview
- [ ] Batch status dashboard
- [ ] Error report visualization

### Performance Baseline
- [ ] Record import time for 100 rows
- [ ] Record import time for 1000 rows
- [ ] Verify index usage in slow query logs

---

## ✅ Success Criteria

| Item | Status | Verification |
|------|--------|---------------|
| Tables created | ✅ | pg_tables query returns 2 rows |
| Indexes created | ✅ | pg_indexes query returns 8 rows |
| RLS enabled | ✅ | rowsecurity = true |
| Import preview works | ✅ | curl returns 200 + batch_id |
| Batch list works | ✅ | curl returns 200 + array |
| RPC function works | ✅ | psql query returns result |
| All 16 APIs compile | ✅ | `npm run build` passes |
| No 500 errors | ✅ | Endpoints respond with 200/400/401 |

---

## 🎯 Timeline

| Step | Dependency | Owner | ETA |
|------|-----------|-------|-----|
| User executes db/29 | User action | — | 2026-05-20 21:00 KST |
| Verify migration | db/29 applied | Assistant | +5 min |
| Integration tests | Verification passes | Web-Builder AI | +15 min |
| Dev continuation | Tests pass | Web-Builder AI | 2026-05-21 onwards |

---

## 📝 Related Files

- `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/db/29_asset_master_v2_phase2.sql` — Migration SQL
- `/home/jeepney/.openclaw/workspace-dev/USER_ACTION_ASSET_MASTER_DB_MIGRATION.md` — User action instructions
- `/home/jeepney/.openclaw/workspace-dev/memory/project_asset_master_phase2_roadmap.md` — Development roadmap
- `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/app/api/assets/import/preview/route.ts` — Import preview endpoint
- `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/app/api/assets/import/execute/route.ts` — Import execute endpoint

---

## 🔗 Next Action

**Waiting for:** User to complete USER_ACTION_ASSET_MASTER_DB_MIGRATION.md  
**Notify:** Assistant immediately upon completion  
**Trigger:** Automatic verification + integration testing
