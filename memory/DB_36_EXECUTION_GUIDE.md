# 🚀 DB/36 Supabase Migration — Execution Guide

**Status:** ⏳ PENDING USER ACTION  
**Deadline:** 2026-06-06 18:00 KST  
**Time Remaining:** ~13 hours  
**Blocking:** Team Dashboard P2 UI completion  

---

## **Quick Execution (2-3 minutes)**

1. **Go to Supabase Console**
   - URL: https://app.supabase.com
   - Select your project (DSC FMS Portal)

2. **Navigate to SQL Editor**
   - Left sidebar → "SQL Editor"

3. **Create New Query** or paste the following SQL:

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

4. **Click "Run"** (green button, top-right)

5. **Verify Success**
   - Console should show: "Executed successfully"
   - No error messages
   - Check "Table Editor" → should see 4 new tables: `team_members`, `team_structure`, `portfolio_items`, `activity_log`

---

## **What This Creates**

| Table | Purpose | Rows |
|-------|---------|------|
| **team_members** | Store team member profiles (name, email, role, etc.) | Main entity |
| **team_structure** | Track reporting hierarchy (who reports to whom) | Relationship |
| **portfolio_items** | Store member project/portfolio entries | Child of members |
| **activity_log** | Audit trail of member activities | Logging |

---

## **After Execution**

Once you've executed the SQL:

1. **Notify the system**: Reply with "✅ DB/36 migration complete"
2. **Impact**: Unblocks Web-Builder #2 to complete Team Dashboard P2 UI (currently 65%)
3. **Next deadline**: Team Dashboard P2 completion by 2026-06-10 18:00

---

**Source File:** `/db/36_team_dashboard_v2.sql`  
**Last Updated:** 2026-06-06 05:00 KST  
**Type:** CREATE TABLE + RLS policies
