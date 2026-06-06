# 🔴 DB/36 URGENT EXECUTION — MUST COMPLETE BY 18:00 KST TODAY

**Status:** ⏳ AWAITING USER ACTION (CRITICAL)  
**Deadline:** 2026-06-06 18:00 KST  
**Time Remaining:** ~5.5 hours  
**Blocking:** Team Dashboard P2 completion, API integration testing, E2E verification

---

## WHAT IS db/36?

Database migration to create 4 Supabase tables:
- `team_members` — Team member profiles (name, email, role, etc.)
- `team_structure` — Reporting hierarchy (who reports to whom)
- `portfolio_items` — Member project/portfolio entries
- `activity_log` — Audit trail of member activities

**Why it matters:** Phase 2C UI pages (just created) reference these tables. Without them:
- ❌ API endpoints won't return data
- ❌ UI components can't render real information
- ❌ Testing can't proceed
- ❌ P2 deadline at risk

---

## EXECUTION STEPS (3-5 MINUTES)

### Step 1: Open Supabase Console
Go to: https://app.supabase.com
- Log in with your account
- Select project: **DSC FMS Portal**

### Step 2: Navigate to SQL Editor
- Left sidebar → **SQL Editor**
- Click **"Create New Query"** (or paste into existing query box)

### Step 3: Copy and Paste This SQL

```sql
-- Team Dashboard Phase 2: Team Management Tables
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  start_date DATE,
  avatar_url TEXT,
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  reports_to_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  position_level INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  role TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'completed',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_structure_member_id ON team_structure(member_id);
CREATE INDEX IF NOT EXISTS idx_team_structure_reports_to ON team_structure(reports_to_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_member_id ON portfolio_items(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_member_id ON activity_log(member_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON team_members;
DROP POLICY IF EXISTS "Public read access" ON team_structure;
DROP POLICY IF EXISTS "Public read access" ON portfolio_items;
DROP POLICY IF EXISTS "Public read access" ON activity_log;

CREATE POLICY "Public read access" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON team_structure FOR SELECT USING (true);
CREATE POLICY "Public read access" ON portfolio_items FOR SELECT USING (true);
CREATE POLICY "Public read access" ON activity_log FOR SELECT USING (true);
```

### Step 4: Execute the SQL
- Click **"Run"** button (green, top-right)
- Wait for success message: "Executed successfully"

### Step 5: Verify Success

Navigate to **Table Editor** (left sidebar) and confirm you see:

| Table Name | Status | Columns |
|-----------|--------|---------|
| team_members | ✅ Created | id, name, email, role, department, start_date, avatar_url, bio, active, created_at, updated_at |
| team_structure | ✅ Created | id, member_id, reports_to_id, position_level, created_at, updated_at |
| portfolio_items | ✅ Created | id, member_id, project_name, description, role, start_date, end_date, status, image_url, created_at |
| activity_log | ✅ Created | id, member_id, activity_type, activity_description, metadata, created_at |

---

## AFTER EXECUTION

1. **Reply with:** `✅ DB/36 migration complete`
2. **Next steps will be:**
   - Test API endpoints with real database data
   - Verify UI components connect properly
   - Run E2E tests for Team Dashboard P2
   - Complete P2 by 2026-06-10 deadline

---

## TROUBLESHOOTING

**If you get an error:**
1. Check Supabase project is selected (top-left dropdown)
2. Verify you have admin permissions
3. Copy the SQL again (no hidden characters)
4. Run in a new query window

**If tables already exist:**
- That's OK! Script uses `CREATE TABLE IF NOT EXISTS` → safe to re-run
- Just verify all 4 tables are present with correct columns

---

## WHY THIS MATTERS (CONTEXT)

- ✅ Phase 2C UI pages created (4 pages, 899 LOC) and committed
- ✅ API endpoints created (commit 23566ae0)
- ❌ Database tables not created yet (this step)
- ⏳ Must complete by 18:00 KST to keep Team Dashboard P2 on schedule

**Without this step:**
- API endpoints return empty results
- UI pages have no data to display
- Cannot test or verify Phase 2 completion

---

**Source:** `/db/36_team_dashboard_v2.sql`  
**Last Updated:** 2026-06-06 13:00 KST  
**Type:** Supabase SQL migration (4 tables + RLS + indexes)
