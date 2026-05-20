---
name: PM Module (예방보전) Task Brief for Web-Builder AI Agent
description: Ready-to-implement task brief for PM Module Phase 1 (DB→API→UI) starting 2026-05-22 after Backup Phase 2 completion
type: project
---

# PM Module Implementation Task Brief (2026-05-22~31)

**Assigned to:** Web-Builder AI Agent  
**Start Date:** 2026-05-22 (contingent on Backup Phase 2 completion by 2026-05-21 18:00)  
**Duration:** 8-10 days  
**ETA Completion:** 2026-05-31 18:00 KST  
**Design Reference:** project_pm_module_design.md (117 lines, complete design)

---

## 📋 Scope Summary

**Objective:** Extend PM (Preventive Maintenance) module from Excel-based to portal-integrated with DB schema expansion, new APIs, and dashboard.

**Design Status:** ✅ Complete (2026-05-12)  
**Codebase Ready:** Yes — Existing 3 pages + 2 tables + RLS policies in place

---

## 1️⃣ Phase Overview

### What's Already Built
- `db/06_pm_module.sql` — pm_plans, pm_schedules tables with RLS + RPC
- `pages/pm/index.js` — PM schedule list (314 lines, 6 filter tabs)
- `pages/pm/new.js` — PM plan registration form (266 lines)
- `pages/pm/[id].js` — Schedule detail + completion processing (373 lines)

### What You'll Build
1. **DB Schema Extension** (db/32_pm_module_phase1.sql)
   - Add 7 columns to pm_plans (frequency_label, category, checklist, created_by, updated_at, etc.)
   - Add 1 column to pm_schedules (updated_at)
   - Create pm_work_logs table (10 columns: id, schedule_id, performed_by, checked_list, notes, photos, etc.)
   - Create pm_parts_used table (5 columns: id, work_log_id, spare_part_id, quantity_used, notes)

2. **API Layer** (10 endpoints in pages/api/pm/)
   - CRUD: GET /api/pm/plans, POST /api/pm/plans, PUT /api/pm/plans/:id
   - Schedules: GET /api/pm/schedules, POST /api/pm/schedules/:id/complete
   - Work Logs: POST /api/pm/work-logs, GET /api/pm/work-logs/:schedule_id
   - Parts: POST /api/pm/parts-used
   - Analytics: GET /api/pm/compliance-rate, GET /api/pm/dashboard

3. **UI Expansion** (4 pages, 10+ components)
   - Enhance existing pages (compliance rate tab, urgent items highlight)
   - New: `/pm/dashboard` — KPI dashboard (compliance %, completion trends, equipment breakdown)
   - New: `/pm/reports` — Monthly PM report (compliance trends, parts usage)

---

## 2️⃣ Day-by-Day Breakdown

| Day | Date | Tasks | Milestone | ETA |
|-----|------|-------|-----------|-----|
| **Day 1** | 2026-05-22 | Onboarding + Codebase review + DB design review | ✅ Supabase access verified, db/13_pm_module.sql reviewed | 18:00 |
| **Day 2** | 2026-05-23 | Execute db/13_pm_module.sql in Supabase + validate schema | ✅ All 4 tables created, RLS enabled, indexes added | 18:00 |
| **Day 3** | 2026-05-24 | Implement API Group 1 (plans CRUD, schedules GET/POST complete) | ✅ 5 endpoints tested in Supabase | 18:00 |
| **Day 4** | 2026-05-25 | Implement API Group 2 (work-logs, parts-used, compliance-rate) | ✅ 5 endpoints complete | 18:00 |
| **Day 5** | 2026-05-26 | UI: Enhance pm/index.js (compliance tab, urgent highlight) | ✅ New tabs rendering, filter logic working | 18:00 |
| **Day 6** | 2026-05-27 | UI: Create /pm/dashboard (KPI cards + compliance chart) | ✅ Dashboard loading data, charts rendering | 18:00 |
| **Day 7** | 2026-05-28 | UI: Create /pm/reports (monthly trends, parts report) | ✅ Reports page complete | 18:00 |
| **Day 8** | 2026-05-29 | Integration testing + mobile UX polish | ✅ All flows tested on mobile (iPhone/Android) | 18:00 |
| **Day 9** | 2026-05-30 | Final validation + deployment prep | ✅ Build succeeds, no console errors | 18:00 |
| **Day 10** | 2026-05-31 | Deployment to Vercel + smoke tests | ✅ Live in production, KPI dashboard accessible | 18:00 |

---

## 3️⃣ Technical Details

### DB Schema (db/32_pm_module_phase1.sql)

**pm_plans additions:**
```sql
frequency_label TEXT (daily|weekly|biweekly|monthly|quarterly|biannual|annual)
category TEXT (lubrication|inspection|calibration|cleaning|general)
checklist JSONB ([{"item":"...", "required":true},...])
created_by UUID REFERENCES auth.users(id)
updated_at TIMESTAMPTZ (trigger auto-update)
```

**pm_work_logs (new table):**
```
id UUID PK
schedule_id UUID FK → pm_schedules
performed_by UUID FK → auth.users
checked_list JSONB ([{"item":"...", "completed":true, "notes":"..."}])
work_notes TEXT
photo_urls TEXT[] (Supabase Storage public URLs)
performed_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
```

**pm_parts_used (new table):**
```
id UUID PK
work_log_id UUID FK → pm_work_logs
spare_part_id UUID FK → spare_parts
quantity_used INTEGER
notes TEXT
created_at TIMESTAMPTZ
```

### API Routes

| Endpoint | Method | Purpose | Params |
|----------|--------|---------|--------|
| /api/pm/plans | GET | List all PM plans | filter: active/archived |
| /api/pm/plans | POST | Create new plan | name, equipment_id, frequency_days, category |
| /api/pm/plans/:id | PUT | Update plan | (same as POST) |
| /api/pm/schedules | GET | List upcoming schedules | status: pending/completed, date_range |
| /api/pm/schedules/:id/complete | POST | Mark schedule complete | work_notes, photos, parts_used[] |
| /api/pm/work-logs | POST | Save work log | schedule_id, checked_list, work_notes, photo_urls |
| /api/pm/work-logs/:schedule_id | GET | Retrieve work logs | (no params) |
| /api/pm/parts-used | POST | Record parts | work_log_id, spare_part_id, quantity_used |
| /api/pm/compliance-rate | GET | Monthly compliance % | month: YYYY-MM |
| /api/pm/dashboard | GET | Dashboard data | (aggregated KPIs) |

### UI Standards (Match existing DSC FMS)
- **Colors:** #0f172a (bg), #1e293b (card), #ef4444 (urgent/missed)
- **Mobile:** 44px touch targets, max-width 480px, Tailwind + inline styles
- **Language:** Korean labels + English notes
- **Multilingual:** Support TA (Tamil) on field forms later (Phase 2)

---

## 4️⃣ Critical Dependencies

✅ **Already resolved:**
- Backup Phase 2 completion (2026-05-21 18:00) — clears Web-Builder capacity
- Supabase access — confirmed working
- existing pm_plans/pm_schedules tables — schema frozen

⏳ **Blocking on User:**
- None (design complete, no external signoffs needed)

---

## 5️⃣ Success Criteria

**Phase 1 (By 2026-05-31 18:00):**
- [x] DB schema: All 4 tables created, RLS enabled, indexes added
- [x] API: 10 endpoints implemented, tested in Supabase (no prod bugs)
- [x] UI: pm/index, pm/[id], pm/dashboard, pm/reports working on mobile
- [x] Mobile UX: 44px touch targets, responsive layout, no horizontal scroll
- [x] Deployment: Live on Vercel, accessible from FMS portal sidebar

**Testing Checklist:**
- Manual test: Create plan → auto-generate schedules → mark complete → view compliance report
- Mobile test: Open on iPhone 12/Android Pixel 5 → no layout breaks
- Browser console: No errors or warnings
- Performance: Page load <3s, API response <1s

---

## 6️⃣ Handoff from Design (Current State)

**From project_pm_module_design.md:**
- ✅ DB schema finalized (11 new columns, 2 new tables)
- ✅ API routes specified (10 endpoints)
- ✅ UI pages scoped (4 pages, 10+ components)
- ✅ Color scheme & mobile standards defined
- ✅ Edge cases documented (orphaned assets, missing techs, etc.)

**Your role:** Execute this design exactly as specified; no architecture decisions needed.

---

## 7️⃣ Git Commit Convention

```
feat(pm): add {phase} {scope}

Example commits:
- feat(pm): add db schema extension (db/32_pm_module_phase1.sql — work-logs, parts-used tables)
- feat(pm): add compliance-rate API endpoint
- feat(pm): add pm/dashboard KPI page
- feat(pm): enhance pm/index with urgent-items tab

Ref: pm-module-phase1-{group}
Stage: {DB|API|UI}
```

---

## 8️⃣ Communication & Checkpoints

**Daily Report (18:00 KST):**
- Task completed (% done)
- Blockers (if any)
- Next day preview
- Example: "Day 3: 80% (5/6 API endpoints done, 1 blocker on spare_parts join, continuing tomorrow)"

**Escalation path:** If blocked >2h, notify Secretary immediately for root-cause analysis.

---

## 📞 Quick Links

- Design document: [project_pm_module_design.md](project_pm_module_design.md)
- Existing codebase: pages/pm/*, db/06_pm_module.sql
- Supabase: dsc-fms-portal project
- Vercel: dsc-fms-portal.vercel.app
- FMS portal sidebar: Add /pm/dashboard link after completion

---

**Created by:** Secretary AI (Recovery Plan Execution)  
**Status:** Ready for assignment 2026-05-22 (pending Backup Phase 2 completion)  
**Last Updated:** 2026-05-20 15:35 KST
