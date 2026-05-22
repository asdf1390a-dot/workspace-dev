---
name: BM Phase 1 — Technicians Schema Resolution (Pre-Work)
description: 1-hour pre-work to resolve technicians table collision before Phase 1 implementation
type: project
---

# BM Phase 1 Technicians Schema Resolution (Pre-Work)

**Evaluator Finding:** technicians table defined in two conflicting ways:
- **09_technicians.sql** (deployed): 27 staff, columns = name, role, department, is_expat, emp_type, doj
- **12_bm_technicians_causecodes.sql** (pending): 5 seed records, columns = name, team, employee_no, phone

**Issue:** TechnicianSelect component needs `team` field for grouping (mechanical/electrical/general), but 09_technicians uses `role`/`department` instead.

**Solution:** Option A (recommended) — Add `team` column to 09_technicians and map existing 27 staff

---

## Migration SQL (db/14_technicians_team_migration.sql)

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

-- Optional: Add description comment
COMMENT ON COLUMN technicians.team IS 'Team category for TechnicianSelect grouping (mechanical/electrical/general)';
```

---

## Pre-Work Checklist (Before Web-Builder Starts 2026-05-22)

**Timeline: 2026-05-20 17:45~18:45 KST (Secretary executes)**

1. [ ] Execute db/14_technicians_team_migration.sql in Supabase
   - Verify: ALTER successful
   - Verify: UPDATE affects all 27 rows
   - Verify: Index created
   
2. [ ] Validate in Supabase dashboard:
   - SELECT COUNT(*) FROM technicians WHERE team IS NULL → should return 0
   - SELECT DISTINCT team FROM technicians → should show ('mechanical', 'electrical', 'general')

3. [ ] Commit migration file to GitHub
   - `git add db/14_technicians_team_migration.sql`
   - `git commit -m "chore(db): add technicians.team column for BM-P1 Phase 1"`
   - Git link: ready for Web-Builder to review before Phase 1 start

4. [ ] Update BM_PHASE1_EVALUATOR_ESCALATION.md
   - Status: ✅ Schema resolved
   - Go/No-Go: **GO** (conditional on migration success)

---

## Impact on BM-P1 Timeline

| Item | Prev Timeline | New Timeline | Notes |
|------|---------------|--------------|-------|
| Pre-work (schema fix) | — | 2026-05-20 17:45~18:45 | 1-hour secretary task |
| Web-Builder Phase 1 start | 2026-05-22 09:00 | 2026-05-22 09:00 | No delay, pre-work completes before start |
| Phase 1 completion | 2026-05-24 18:00 | 2026-05-24 18:00 | On schedule |

---

## TechnicianSelect Component Usage (Post-Migration)

After migration, TechnicianSelect will query:

```sql
SELECT id, name, team 
FROM technicians 
WHERE team = $1 
ORDER BY name;
```

Grouping options (in component):
- "Mechanical Team" (team = 'mechanical')
- "Electrical Team" (team = 'electrical')
- "General Team" (team = 'general')

---

## Evaluator's Go/No-Go Decision

**Status:** CONDITIONAL GO ✅
- Condition: Schema migration (db/14) must execute successfully
- Contingency: If migration fails, revert to Option B (component-level mapping)

---

**Created by:** Secretary AI (per Evaluator recommendation)  
**Status:** Ready for execution 2026-05-20 17:45 KST  
**Executed by:** Secretary (autonomous)  
**Verification time:** 2026-05-20 18:00 KST
