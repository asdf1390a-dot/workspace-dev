---
name: BM-P1 db/43 Migration Execution Plan
description: Step-by-step plan to execute db/43 schema migration for BM-P1 deployment
type: project
---

# BM-P1 db/43 Migration Execution Plan

**Status:** 🔴 **CRITICAL BLOCKING** (18+ hours)  
**Target:** Deploy db/43 migration to Supabase  
**Current Blocker:** Migration execution method selection  
**Timeline:** Immediate (within 2 hours)

---

## 📋 Migration File Status

| Item | Status | Details |
|------|--------|---------|
| Schema File | ✅ Ready | `/db/43_breakdown_management_phase1_schema.sql` (230 lines) |
| API Route | ✅ Ready | `/app/api/admin/migrate/route.ts` (migration endpoint) |
| Migration Script | ✅ Ready | `/migrate-db-43.js` (Node.js runner) |
| Vercel Deployment | 🟡 Pending | Latest changes not yet pushed |
| ADMIN_MIGRATION_TOKEN | 🔴 Missing | Needs to be set in Vercel env vars |
| Telegram Notification | ✅ Configured | Chat ID 8650232975 ready |

---

## 🎯 Execution Options

### **Option A: Supabase Dashboard SQL Editor (Fastest, Manual)**
**Time: ~5 minutes**

1. Open: https://app.supabase.com/project/YOUR_PROJECT/sql/new
2. Copy-paste content of `/db/43_breakdown_management_phase1_schema.sql`
3. Click **Run** (Ctrl+Enter)
4. Verify: Check "breakdown_reports" table exists
5. Update memory with execution timestamp

**✅ Pros:**
- No deployment needed
- Immediate execution
- Rollback easy (drop table if needed)
- No code changes required

**❌ Cons:**
- Manual process (not automated)
- Requires Supabase dashboard access

---

### **Option B: Vercel Deployment + Migration API (Recommended, Automated)**
**Time: ~15 minutes**

1. **Set environment variables in Vercel:**
   ```
   ADMIN_MIGRATION_TOKEN=your-secure-token-here
   ```

2. **Deploy latest code:**
   ```bash
   git add dsc-fms-portal/app/api/admin/migrate/route.ts
   git commit -m "feat: add BM-P1 migration API endpoint"
   git push
   # Wait for Vercel auto-deployment (~2 min)
   ```

3. **Execute migration via API:**
   ```bash
   curl -X POST https://dsc-fms-portal.vercel.app/api/admin/migrate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{"migration": "db/43"}'
   ```

4. **Verify:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'breakdown_reports');
   -- Expected: true
   ```

**✅ Pros:**
- Automated, repeatable
- Auditable (logs in API)
- Can be triggered from CI/CD
- No manual SQL editing

**❌ Cons:**
- Requires API deployment (~5 min)
- Needs token setup
- File path parsing logic required

---

### **Option C: Node.js CLI Script (Alternative)**
**Time: ~3 minutes** (if environment variables available)

```bash
SUPABASE_URL=your-url \
SUPABASE_SERVICE_ROLE_KEY=your-key \
node migrate-db-43.js
```

**❌ Note:** Requires local Supabase client library; may not work with RPC limitations.

---

## ✅ Recommendation

**Use Option A (Supabase Dashboard)** for immediate unblocking:
1. Copy `/db/43_breakdown_management_phase1_schema.sql` content
2. Paste into Supabase SQL Editor
3. Execute (2 minutes)
4. Move forward with BM-P1 deployment

**Then implement Option B** for future migrations (automated).

---

## 📊 Verification Checklist

After migration execution, verify:

```sql
-- 1. Table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'breakdown_reports'; -- Expected: 1

-- 2. Indexes created
SELECT COUNT(*) FROM pg_indexes 
WHERE tablename = 'breakdown_reports'; -- Expected: 8

-- 3. RLS enabled
SELECT relrowsecurity FROM pg_class 
WHERE relname = 'breakdown_reports'; -- Expected: true

-- 4. View exists
SELECT EXISTS(SELECT 1 FROM information_schema.views 
WHERE table_name = 'breakdown_analysis'); -- Expected: true

-- 5. Trigger exists
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_name = 'breakdown_reports_updated_at_trigger'; -- Expected: 1
```

---

## 🚨 Rollback Plan

If migration fails, execute in Supabase SQL Editor:

```sql
DROP TABLE IF EXISTS breakdown_reports CASCADE;
DROP VIEW IF EXISTS breakdown_analysis;
DROP FUNCTION IF EXISTS set_breakdown_updated_at();
```

Then re-execute migration.

---

## 📝 Post-Migration Steps

1. ✅ Confirm table structure
2. ✅ Insert mock data (20+ records for UI testing)
3. ✅ Run BM-P1 API integration tests
4. ✅ Deploy BM-P1 UI to Vercel
5. ✅ Telegram notification: "BM-P1 db/43 migration complete"

---

**Document Version:** 1.0  
**Created:** 2026-05-29 06:47 KST  
**Status:** Ready for immediate execution
