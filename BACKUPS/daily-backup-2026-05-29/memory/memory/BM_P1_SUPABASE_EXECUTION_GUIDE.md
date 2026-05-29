---
name: BM Phase 1 — Supabase Schema Migration Execution Guide
description: Step-by-step instructions for executing db/14_technicians_team_migration.sql in Supabase (2026-05-20 17:45~18:45 KST)
type: project
---

# BM Phase 1 Supabase Schema Migration Execution

**Task:** Execute db/14_technicians_team_migration.sql in Supabase  
**Timeline:** 2026-05-20 17:45~18:45 KST (secretary autonomous task)  
**Commit:** ab17915 (migration files created)  
**GitHub Link:** [db/14_technicians_team_migration.sql](https://raw.githubusercontent.com/DSCMannur/dsc-fms-portal/main/db/14_technicians_team_migration.sql)

---

## 📋 Pre-Execution Checklist (Before 17:45)

- [ ] Supabase project: **dsc-fms-portal** (credentials available)
- [ ] Current technicians table: 27 rows with deployed 09_technicians.sql schema
- [ ] Backup: Not required (ALTER is non-destructive, ADD COLUMN with DEFAULT)
- [ ] Validation queries: Prepared (see Post-Execution section)

---

## 🚀 Execution Steps

### Option A: Supabase Dashboard (Recommended for immediate visual feedback)

1. **Open Supabase:**
   - Go to https://app.supabase.com
   - Project: **dsc-fms-portal**
   - Navigate to: **SQL Editor** (left sidebar)

2. **Create New Query:**
   - Click **+ New Query**
   - Paste the following SQL block:

```sql
-- Add 'team' column to existing technicians table
ALTER TABLE technicians
ADD COLUMN team TEXT DEFAULT 'general' NOT NULL;

-- Map existing role + department to standardized team categories
UPDATE technicians
SET team = CASE
  WHEN role = 'Mechanical Technician' OR department = 'Mechanical' THEN 'mechanical'
  WHEN role = 'Electrical Technician' OR department = 'Electrical' THEN 'electrical'
  ELSE 'general'
END;

-- Create index for TechnicianSelect grouping queries
CREATE INDEX idx_technicians_team ON technicians(team);

-- Add check constraint
ALTER TABLE technicians
ADD CONSTRAINT technicians_team_check
CHECK (team IN ('mechanical', 'electrical', 'general'));

-- Add description comment
COMMENT ON COLUMN technicians.team IS 'Team category for TechnicianSelect grouping (mechanical/electrical/general)';
```

3. **Execute:**
   - Click **Run** button (or Cmd+Enter)
   - Wait for confirmation: "No rows affected" → Success ✅
   - Check Query Results panel for any errors

4. **Verify Success:**
   - See section: "Post-Execution Validation" below

---

### Option B: Supabase API (For automation/scripting)

```bash
# Replace SUPABASE_URL and SUPABASE_ANON_KEY with actual values
SUPABASE_URL="https://[PROJECT_ID].supabase.co"
SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"

curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "function_name": "exec_sql",
    "args": {"sql": "ALTER TABLE technicians ADD COLUMN team TEXT DEFAULT '\''general'\'' NOT NULL;"}
  }'
```

*Note: This approach requires admin API key. Use Option A (Dashboard) for simplicity.*

---

## ✅ Post-Execution Validation

### Validation Query 1: Check column added
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'technicians' AND column_name = 'team';
```
**Expected Result:** 1 row with team | text | NO | 'general'::text

### Validation Query 2: Verify NULL count
```sql
SELECT COUNT(*) as null_count
FROM technicians
WHERE team IS NULL;
```
**Expected Result:** 0 (all 27 rows have team value assigned)

### Validation Query 3: Check distinct team values
```sql
SELECT DISTINCT team, COUNT(*) as count
FROM technicians
GROUP BY team
ORDER BY team;
```
**Expected Result:** 3 rows
- electrical: [count of electrical technicians]
- general: [count of general technicians]
- mechanical: [count of mechanical technicians]

### Validation Query 4: Verify index created
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'technicians' AND indexname = 'idx_technicians_team';
```
**Expected Result:** 1 row with idx_technicians_team

### Validation Query 5: Verify constraint exists
```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'technicians' AND constraint_name = 'technicians_team_check';
```
**Expected Result:** 1 row with technicians_team_check

---

## 📊 Expected Results Summary

| Item | Expected | Status |
|------|----------|--------|
| Column added | team TEXT NOT NULL DEFAULT 'general' | [ ] |
| NULL count | 0 | [ ] |
| Distinct team values | 3 (mechanical, electrical, general) | [ ] |
| Index created | idx_technicians_team | [ ] |
| Constraint added | technicians_team_check | [ ] |

---

## 🔄 Post-Migration Steps

### 1. Commit confirmation to GitHub
```bash
# File already committed in commit ab17915
# No additional git action needed unless migrations weren't applied
git log --oneline -1 dsc-fms-portal/
# Should show: ab17915 feat(db): add BM-P1 technicians.team migration + PM-P1 schema extension
```

### 2. Update BM_PHASE1_EVALUATOR_ESCALATION status
- [ ] Update status: ✅ Schema resolved (CONFIRMED)
- [ ] Go/No-Go: **GO** (conditional on migration success → now SATISFIED)

### 3. Notify Web-Builder for 2026-05-22 09:00 start
- [ ] BM Phase 1 ready for assignment
- [ ] Schema migration confirmed successful
- [ ] TechnicianSelect component can proceed with team-based grouping

---

## ⏱️ Timeline Summary

| Time | Action | Owner | Status |
|------|--------|-------|--------|
| 2026-05-20 14:36 | Migration files committed to GitHub | Secretary | ✅ |
| 2026-05-20 17:45~18:45 | Execute db/14 in Supabase | Secretary | ⏳ Scheduled |
| 2026-05-20 18:45 | Validation complete + status update | Secretary | ⏳ Pending |
| 2026-05-21 18:00 | Backup Phase 2 UI completion deadline | Web-Builder | ⏳ In Progress |
| 2026-05-22 09:00 | BM Phase 1 Web-Builder start | Web-Builder | ✅ Ready |

---

## 🆘 Troubleshooting

**Error: "column 'team' already exists"**
- The column may have been added in a prior attempt. Check with Validation Query 1.
- If already present, skip the ALTER statement and verify data via Validation Queries 2-5.

**Error: "role and department columns don't match expected values"**
- Run: `SELECT DISTINCT role, department FROM technicians;`
- Update the CASE statement in the UPDATE to match actual values found in your data.

**Error: "CHECK constraint violation"**
- Verify no rows have invalid team values. Run: `SELECT * FROM technicians WHERE team NOT IN ('mechanical', 'electrical', 'general');`

---

## 📞 Success Confirmation

Once execution is complete:

1. **Log:** "2026-05-20 17:45~18:45 BM-P1 technicians.team schema migration ✅ EXECUTED"
2. **Update:** BM_PHASE1_EVALUATOR_ESCALATION.md → Status: GO ✅
3. **Report:** Discord #일반 + Telegram (brief: "BM-P1 pre-work complete, Web-Builder ready for 2026-05-22 09:00")

---

**Created by:** Secretary AI (Recovery Plan Execution)  
**Status:** Ready for execution 2026-05-20 17:45 KST  
**Estimated Duration:** 15 minutes (execution + validation)
