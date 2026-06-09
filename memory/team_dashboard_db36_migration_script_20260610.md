---
name: Team Dashboard db/36 Supabase Migration Script (Ready-to-Run)
description: SQL migration for Portfolio View + Milestones table — copy/paste into Supabase SQL Editor
type: reference
---

# Team Dashboard db/36 Migration Script

**Status:** ✅ Ready to execute in Supabase SQL Editor  
**Generated:** 2026-06-10 02:56 KST  
**Execution Time:** ~3-5 minutes  
**Current Blocker:** Waiting for user to run this script

---

## 🚀 Quick Start

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy the entire SQL script** (below)
3. **Paste into editor**
4. **Click "Run"**
5. **Verify:** No errors, new table appears in schema

---

## 📝 SQL Migration Script

```sql
-- ============================================================================
-- Team Dashboard P1 db/36 Migration
-- Created: 2026-06-10 02:56 KST
-- Purpose: Portfolio management view + milestone tracking
-- ============================================================================

-- Step 1: Create milestones tracking table
-- Purpose: Track project milestones (goals, deadlines, completion)
CREATE TABLE IF NOT EXISTS milestones (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
  target_date DATE,
  completed_date DATE,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT milestone_valid_dates CHECK (
    target_date IS NULL OR (completed_date IS NULL OR completed_date <= target_date)
  )
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_milestones_portfolio_id ON milestones(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON milestones(target_date DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_owner_id ON milestones(owner_id);

-- Step 3: Create portfolio details view (materialized view for performance)
-- Purpose: Aggregate portfolio data with asset counts, member counts, etc.
CREATE OR REPLACE VIEW portfolio_details AS
SELECT 
  p.id,
  p.name,
  p.owner_id,
  p.description,
  p.created_at,
  p.updated_at,
  COALESCE(COUNT(DISTINCT a.id), 0) AS asset_count,
  COALESCE(COUNT(DISTINCT pm.member_id), 0) AS member_count,
  COALESCE(COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'COMPLETED'), 0) AS completed_milestones,
  COALESCE(COUNT(DISTINCT m.id) FILTER (WHERE m.status IN ('PENDING', 'IN_PROGRESS')), 0) AS active_milestones,
  MAX(CASE WHEN m.status = 'COMPLETED' THEN m.completed_date ELSE NULL END) AS last_completed_date
FROM portfolios p
LEFT JOIN assets a ON a.portfolio_id = p.id
LEFT JOIN portfolio_members pm ON pm.portfolio_id = p.id
LEFT JOIN milestones m ON m.portfolio_id = p.id
GROUP BY p.id, p.name, p.owner_id, p.description, p.created_at, p.updated_at;

-- Step 4: Enable Row Level Security (RLS) for milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies for milestones

-- Policy: Portfolio owner can view all milestones for their portfolio
CREATE POLICY milestones_select_owner ON milestones
  FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE owner_id = auth.uid()
    )
  );

-- Policy: Portfolio members can view milestones
CREATE POLICY milestones_select_members ON milestones
  FOR SELECT
  USING (
    portfolio_id IN (
      SELECT portfolio_id FROM portfolio_members WHERE member_id = auth.uid()
    )
  );

-- Policy: Portfolio owner can insert milestones
CREATE POLICY milestones_insert_owner ON milestones
  FOR INSERT
  WITH CHECK (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE owner_id = auth.uid()
    )
  );

-- Policy: Portfolio owner can update their milestones
CREATE POLICY milestones_update_owner ON milestones
  FOR UPDATE
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE owner_id = auth.uid()
    )
  );

-- Policy: Portfolio owner can delete their milestones
CREATE POLICY milestones_delete_owner ON milestones
  FOR DELETE
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE owner_id = auth.uid()
    )
  );

-- Step 6: Create trigger for updated_at field
CREATE OR REPLACE FUNCTION update_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS milestones_updated_at_trigger ON milestones;
CREATE TRIGGER milestones_updated_at_trigger
BEFORE UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION update_milestones_updated_at();

-- Step 7: Verify installation
-- Run these SELECT statements to confirm everything is working:

-- Test 1: Check milestones table was created
-- SELECT * FROM milestones LIMIT 1;

-- Test 2: Check portfolio_details view
-- SELECT * FROM portfolio_details LIMIT 1;

-- Test 3: Verify RLS is enabled
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE tablename = 'milestones';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Tables created: milestones (1 new table)
-- Views created: portfolio_details (1 new view)
-- RLS policies: 5 policies for secure access
-- Triggers: 1 trigger for updated_at auto-update
-- 
-- Status: ✅ Ready for API integration
-- Next steps: Team Dashboard API can now use these tables/views
-- ============================================================================
```

---

## 📋 Execution Checklist

**Before running:**
- [ ] Logged into Supabase as project owner
- [ ] On correct project (DSC Mannur FMS Portal)
- [ ] SQL Editor open
- [ ] Script copied to clipboard

**After running:**
- [ ] Check for errors (should see no red error messages)
- [ ] Navigate to "Tables" → Confirm "milestones" table exists
- [ ] Navigate to "Schemas" → Confirm "portfolio_details" view exists
- [ ] Verify RLS is enabled (should show in table properties)

---

## ✅ Verification Commands

Run these individually in SQL Editor to verify:

```sql
-- Verify milestones table exists and has correct columns
\d milestones

-- Verify portfolio_details view exists
\d portfolio_details

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'milestones';

-- Insert test milestone (if desired)
INSERT INTO milestones (portfolio_id, title, status) 
VALUES ('<your-portfolio-id>', 'Test Milestone', 'PENDING');

-- Query test
SELECT * FROM portfolio_details LIMIT 5;
```

---

## 🔧 Troubleshooting

**Error: "relation 'portfolios' does not exist"**
- → The portfolios table hasn't been created yet
- → Create portfolios table first (should exist from previous work)

**Error: "RLS is not enabled on this table"**
- → This is normal, RLS should already be enabled by the script
- → Verify with: SELECT rowsecurity FROM pg_tables WHERE tablename = 'milestones'

**Error: "Function 'update_milestones_updated_at' already exists"**
- → This is normal if running multiple times
- → Script uses DROP IF EXISTS to handle this

**Milestones table created but API can't access it:**
- → Check RLS policies are correct (run verification queries above)
- → Verify user has correct portfolio_id
- → Check auth context (auth.uid() should return current user)

---

## 📊 Schema Details

**Table: milestones**
```
id (BIGSERIAL)           — Primary key
portfolio_id (UUID)      — Foreign key to portfolios
title (VARCHAR 200)      — Milestone title (required)
description (TEXT)       — Optional longer description
status (VARCHAR 50)      — PENDING, IN_PROGRESS, COMPLETED, BLOCKED
target_date (DATE)       — Goal deadline
completed_date (DATE)    — Actual completion date
owner_id (UUID)          — User who owns this milestone
created_at (TIMESTAMP)   — Auto-set on insert
updated_at (TIMESTAMP)   — Auto-updated on changes
```

**View: portfolio_details**
```
id, name, owner_id, description, created_at, updated_at
asset_count          — Count of assets in portfolio
member_count         — Count of members with access
completed_milestones — Count of completed milestones
active_milestones    — Count of pending/in-progress milestones
last_completed_date  — When last milestone was completed
```

---

## 🚀 Next Steps After Migration

**After this script runs successfully:**

1. ✅ Team Dashboard db/36 migration is complete
2. ✅ API can now use milestones table + portfolio_details view
3. ✅ RLS policies prevent unauthorized access
4. ✅ System ready for Phase API Integration

**Team Dashboard P1 will be READY_FOR_API_INTEGRATION**

---

## 💡 Support

**Questions during execution?**
- Supabase Docs: https://supabase.com/docs/guides/database
- Check table properties in Supabase dashboard
- Verify auth context in Supabase Auth section

---

**Status:** ✅ READY TO RUN (User action: Open Supabase SQL Editor, copy script, click Run)  
**Generated:** 2026-06-10 02:56 KST  
**Execution estimate:** 3-5 minutes  
**Blocking:** Team Dashboard P1 API integration (unblocks after successful run)
