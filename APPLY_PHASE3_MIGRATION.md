# 🚀 Apply Phase 3 Personal History Database Migration

**Status:** ✅ READY TO APPLY  
**Blocked:** Database migration execution (5 minutes required)  
**Project:** Phase 3 Personal History (Companies, Projects, Achievements CRUD)

## What This Migration Creates

The migration creates three core tables for personal history management:
- `user_companies` — Employment history
- `user_projects` — Project portfolio  
- `user_achievements` — Certifications, awards, recognitions

Plus Row-Level Security (RLS) policies ensuring users can only access their own data.

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended - 5 minutes)

**Step 1:** Open Supabase SQL Editor
```
https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql/new
```

**Step 2:** Copy the entire content from:
```
/home/jeepney/.openclaw/workspace-dev/supabase/migrations/1780993077000_jeepney_phase3_personal_history.sql
```

**Step 3:** Paste into the SQL editor and click **Run**

**Expected output:**
```
✓ Migration applied successfully
✓ 3 tables created (user_companies, user_projects, user_achievements)
✓ 12 RLS policies created
✓ 3 indexes created
```

### Option 2: Via Supabase CLI (If configured)

```bash
cd /home/jeepney/.openclaw/workspace-dev
npx supabase db push
```

## After Migration Execution

### ✅ Verify Tables Created
Go to [Supabase Tables](https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/editor) and confirm:
- [ ] `user_companies` table exists
- [ ] `user_projects` table exists  
- [ ] `user_achievements` table exists
- [ ] All three have RLS enabled (row_security = on)

### ✅ Verify RLS Policies
Navigate to each table's RLS section and confirm 4 policies per table:
- SELECT (users can view own data)
- INSERT (users can create)
- UPDATE (users can modify own data)
- DELETE (users can remove own data)

## What Happens Next

1. **UI Testing** — Test CRUD operations in browser:
   - Navigate to `/jeepney-personal/career/companies`
   - Try creating, editing, deleting a company
   - Verify data appears after save

2. **API Testing** — Verify Bearer token authentication works:
   ```bash
   curl -X GET http://localhost:3000/api/career/companies \
     -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
   ```

3. **Deployment** — Once verified locally, the code is ready for Vercel

## Files Ready for Phase 3

### ✅ API Endpoints (6 routes, 18 handlers)
- `/api/career/companies` — GET all, POST new
- `/api/career/companies/[id]` — GET, PUT, DELETE
- `/api/career/projects` — GET all, POST new
- `/api/career/projects/[id]` — GET, PUT, DELETE
- `/api/career/achievements` — GET all, POST new
- `/api/career/achievements/[id]` — GET, PUT, DELETE

### ✅ UI Pages (11 pages + 1 layout)
- `/jeepney-personal/career/` — Overview page
- `/jeepney-personal/career/companies` — List + /new + /[id]
- `/jeepney-personal/career/projects` — List + /new + /[id]
- `/jeepney-personal/career/achievements` — List + /new + /[id]

### ✅ Database Schema
- Migration file: `supabase/migrations/1780993077000_jeepney_phase3_personal_history.sql`

## Timeline

| Step | Status | Time |
|------|--------|------|
| Code Implementation | ✅ Complete | 2 hours |
| Build Verification | ✅ Complete | 15 min |
| Migration File Creation | ✅ Complete | 10 min |
| **Migration Execution** | ⏳ Waiting | 5 min |
| Local Testing | ⏳ Ready | 20 min |
| Deployment | ⏳ Ready | 10 min |

## SQL Migration Details

**Timestamp:** `1780993077000` (same as other migrations in project)  
**Tables:** 3 (user_companies, user_projects, user_achievements)  
**RLS Policies:** 12 (4 per table)  
**Indexes:** 3 (user_id FK on each table)  

## After You Apply the Migration

1. Execute the SQL via Supabase dashboard ↑
2. Wait for success message
3. Then reply here, and I'll:
   - Start local UI testing
   - Verify all CRUD operations work
   - Test authentication flows
   - Final go/no-go for production

---

**Next Action:** Click the Supabase link above → Paste SQL → Click Run → Reply when done ✅
