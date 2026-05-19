---
name: BM (Breakdown Management) Module Design
description: Complete BM module design covering DB schema additions, 5 pages (list/new/detail/edit/stats), 6 components, API routes, and 3-phase implementation roadmap (Phase 1: DB+resolve, Phase 2: edit+filter, Phase 3: KPI dashboard)
type: project
relatedFiles:
  - project_asset_master_design_core.md
  - project_dsc_fms.md
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---

## Executive Summary

**Project:** BM (Breakdown Management) Module Enhancement  
**Status:** Design Complete — 3-phase implementation roadmap defined  
**Scope:** Extend existing 3-page BM implementation (list/new/detail) with missing DB columns, 2 new pages (edit/stats), 6 reusable components, and 3 API routes  
**Duration:** Phase 1 (~3 days), Phase 2 (~5 days), Phase 3 (~3 days)  
**Owner:** Web-builder (implementation), Planner (architecture)

## Current Implementation Status

### Existing Working Code
- `pages/bm/index.js` — List page with card layout, tab filters (OPEN/IN PROGRESS/ALL/RESOLVED), search bar
- `pages/bm/new.js` — Complete breakdown reporting form (4-level asset hierarchy, multilingual EN/KO/TA/HI, photo upload)
- `pages/bm/[id].js` — Detail/edit page with status transitions, action notes, timeline, lightbox for photos
- `db/04_bm_module_v2.sql` — BM events table, cause_codes master, technicians master, bm_kpi view, RLS policies, indexes, updated_at trigger

### Key Insight
"Missing features > full rewrite" — DB structure exists; need to add missing columns and pages.

---

## 1. Database Schema Changes

### Missing Columns to Add (via 11_bm_missing_columns.sql)

**ALTER to bm_events table:**

```sql
-- Action/Cause fields
action_taken TEXT               -- Repair actions taken (maintenance team entry)
cause TEXT                      -- Free-form cause description (field use)
symptom TEXT                    -- Symptom description (English)
symptom_ta TEXT                 -- Symptom in Tamil (field worker entry)

-- Technician/Reporter fields
reported_by UUID REFERENCES auth.users(id)      -- Reporting user UID
reported_name TEXT              -- Reporter name (text)
resolved_by UUID REFERENCES auth.users(id)      -- Resolution processor UID
resolver_name TEXT              -- Resolver name (text)
technician_id UUID REFERENCES technicians(id)   -- Assigned maintenance tech

-- Photos
photos TEXT[] DEFAULT '{}'      -- Storage public URL array

-- Auto-calculated
downtime_minutes INTEGER GENERATED ALWAYS AS
  CASE WHEN downtime_end IS NOT NULL AND downtime_start IS NOT NULL
    THEN EXTRACT(EPOCH FROM (downtime_end - downtime_start))::INTEGER / 60
    ELSE NULL
  END STORED

-- Additional fields
severity TEXT DEFAULT 'normal'
  CHECK (severity IN ('minor', 'normal', 'major', 'line_down'))

-- Status constraint update
DROP CONSTRAINT bm_events_status_check
ADD CONSTRAINT bm_events_status_check
  CHECK (status IN ('open', 'in_progress', 'pending_parts', 'resolved', 'cancelled', 'wontfix'))
```

### Complete bm_events Column List

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| asset_id | uuid FK → assets | NOT NULL |
| reported_at | timestamptz | default now() |
| reporter_name | text | Field worker name |
| reported_by | uuid FK → auth.users | Supabase auth UID |
| severity | text | minor/normal/major/line_down |
| priority | text | low/medium/high/critical |
| status | text | open/in_progress/pending_parts/resolved/cancelled/wontfix |
| symptom | text | English description |
| symptom_ta | text | Tamil description |
| cause_code | text FK → cause_codes | Failure code |
| cause | text | Free-form cause notes |
| action_taken | text | Repair actions |
| technician_id | uuid FK → technicians | Assigned tech |
| downtime_start | timestamptz | Machine down time |
| downtime_end | timestamptz | Machine restart time |
| downtime_minutes | integer GENERATED | Auto-calculated |
| work_hours | numeric(5,2) | Labor hours invested |
| resolved_at | timestamptz | Completion time |
| resolved_by | uuid FK → auth.users | Completion processor |
| resolver_name | text | Completion processor name |
| photos | text[] | Storage public URLs |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | trigger auto-update |

### Additional Indexes

```sql
CREATE INDEX bm_events_severity_idx ON bm_events(severity);
CREATE INDEX bm_events_resolved_at_idx ON bm_events(resolved_at DESC);
CREATE INDEX bm_events_asset_month_idx ON bm_events(asset_id, DATE_TRUNC('month', reported_at));
```

### RLS Policy

```sql
ALTER TABLE bm_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_bm_events" ON bm_events;
CREATE POLICY "auth_all_bm_events" ON bm_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**Storage Bucket:** `bm-photos` (public read, authenticated write)

---

## 2. Page Structure (Current + New)

### Phase 1 Enhancements (Existing Pages)

**pages/bm/index.js** — List Page (enhancements)
- Add date range filter panel (collapsible, toggle with Filter button)
- Add KPI summary banner at top (this month: X breakdowns, Y resolved, avg MTTR Nm)
- Add sort option toggle (default: newest first, alternative: highest priority first)

**pages/bm/[id].js** — Detail Page (enhancements)
- Add `downtime_end = now()` when resolving
- Add Technician dropdown (TechnicianSelect component)
- Add work hours input field
- Add Edit button header link (→ /bm/edit/[id])

### Phase 2 New Pages

**pages/bm/edit/[id].js** — New Edit Form (admin/maintenance team)
- Read-only asset display
- Status dropdown (open/in_progress/pending_parts/resolved/wontfix)
- Severity 4-button selector (minor/normal/major/line_down)
- Symptom textareas (English + Tamil)
- Downtime start/end datetime inputs
- Cause code dropdown (grouped by category)
- Cause detail textarea
- Action taken textarea
- Technician dropdown
- Work hours number input
- Cancel/Save buttons
- Validation: downtime_end ≥ downtime_start; auto-set resolved_at when status=resolved
- Auth: login redirect for unauthenticated

### Phase 3 New Pages

**pages/bm/stats.js** — KPI Dashboard (admin only)
- Month selector dropdown (last 12 months)
- Summary cards (3): This month breakdowns, Avg MTTR, Avg MTBF
- Asset breakdown table: asset# | name | breakdown count | MTTR | MTBF | total downtime
- Cause breakdown pie chart (text version): cause code | count | percentage
- Data source: bm_kpi view + direct bm_events aggregation

---

## 3. Components (New)

### BMStatusBadge.js
- Props: status (open|in_progress|pending_parts|resolved|wontfix), size (sm|md)
- Role: Status color pill, centralized color mapping

### BMSeverityBar.js
- Props: severity (minor|normal|major|line_down), orientation (vertical|horizontal)
- Role: 4px left-side color bar on cards; severity→color mapping

### TechnicianSelect.js
- Props: value (technician_id), onChange handler, disabled flag
- Role: Load technicians table, render dropdown grouped by team (mechanical/electrical/general)
- Used in: [id].js detail page, edit/[id].js

### BMFilterPanel.js
- Props: open (boolean), onClose handler, startDate, endDate, assetId, onApply handler
- Role: Date range + asset filter panel for list page; conditional render (no animation)

### BMKpiSummary.js
- Props: month (YYYY-MM), assetIds (optional for filtered aggregate)
- Role: KPI banner (this month breakdowns, avg MTTR) for list page top
- Data source: bm_kpi view

### BMCard.js (optional refactor)
- Props: event object, onClick handler
- Role: Single list card; extract from inline rendering in index.js

---

## 4. API Routes (New)

### POST /api/bm/resolve
```
Body: { id, action_taken, cause, work_hours, downtime_end }
Role: Atomic resolution processing
  - status = 'resolved'
  - resolved_at = now()
  - downtime_end = provided value
  - Fire Discord webhook notification (optional)
Response: 200 { success, event } | 400 { error } | 401 unauthorized
```

### GET /api/bm/stats
```
Query: ?month=2026-05
Role: Return bm_kpi view + cause_code aggregation for given month
  - Use service_role key if needed for aggregation permissions
Response: 200 {
  summary: { total, resolved, avg_mttr_min },
  by_asset: [ { asset_id, name_en, count, mttr_min, mtbf_min, total_downtime_min } ],
  by_cause: [ { cause_code, count, pct } ]
}
```

### POST /api/bm/notify (optional, extend discord-notify.js)
```
Body: { type: 'bm_resolved', id, asset_label, downtime_min, action_taken }
Role: Discord notification for BM resolution
Note: BM creation notification already implemented in new.js
```

---

## 5. UI/UX Standards (Match Existing DSC FMS)

### Design System
- Background: `#0f172a` (dark navy)
- Card bg: `#1e293b`
- Section header bg: `#0f172a`
- Input field bg: `#0b1220`
- Borders: `#1f2937`, `#334155`
- Primary text: `#e2e8f0`, `#f8fafc`
- Secondary text: `#94a3b8`, `#64748b`
- Accent (error): `#dc2626`
- Success: `#16a34a`, `#22c55e`
- Font stack: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Tamil", "Noto Sans KR", sans-serif
- Max width: 480px, margin: 0 auto
- Min tab height: 44px (iOS touch)
- Bottom padding: calc(60px + env(safe-area-inset-bottom, 0px) + 24px)

### Mobile-First Principles
- Telegram link entry: ?asset=DCMI-XXX auto-selects asset (existing)
- Touch target min 44px (existing)
- Font size input min 16px (iOS auto-zoom prevention)
- Vertical scroll only; horizontal tabs allowed
- No offline requirements (factory WiFi)

### Language Policy
| Screen | Language |
|--------|----------|
| Reporting form (new.js) | EN/KO/TA/HI multilingual toggle |
| List (index.js) | Korean labels + English status pills |
| Detail ([id].js) | Korean/English mixed ("Action Taken / 조치 내용") |
| Edit form (edit/[id].js) | Korean labels (admin use) |
| Stats (stats.js) | Korean labels |

### Status Transition Flowchart
```
open
  ├→ in_progress
  ├→ pending_parts
  ├→ resolved
  └→ wontfix

in_progress
  ├→ pending_parts
  ├→ resolved
  └→ open

pending_parts
  ├→ in_progress
  └→ resolved

resolved
  └→ in_progress (reopen)

wontfix
  └→ open
```

---

## 6. Edge Cases & Handling

### Data Edge Cases
| Situation | Handling |
|-----------|----------|
| Asset orphan (asset_id no match) | JOIN result null → display '—' |
| photos array null | `Array.isArray(event?.photos) ? event.photos : []` |
| downtime_end < downtime_start | Validation error before submit in edit form |
| Edit already-resolved record | Allowed (reopen case), maintain resolved_at |
| Missing cause_codes master | Disable select or show empty option |
| Empty technicians table | Show "Unassigned" option |

### Auth Edge Cases
| Situation | Handling |
|-----------|----------|
| Unauthenticated /bm access | Allow list view, hide New button |
| Unauthenticated /bm/new | Login redirect |
| Unauthenticated /bm/[id] | Allow view, hide edit UI (isAuthed check) |
| Unauthenticated /bm/edit/[id] | Login redirect |
| Unauthenticated /bm/stats | Login redirect (admin only) |

### Network Edge Cases
| Situation | Handling |
|-----------|----------|
| Supabase delay | Loading skeleton or "Loading…" text |
| Duplicate submit | busy state disables button |
| Photo upload fail | Console warning + continue (save without photo) |
| Discord notify fail | Fire-and-forget; ignore |

### Stats Page Special Cases
| Situation | Handling |
|-----------|----------|
| Zero breakdowns this month | Display "No breakdowns this month" |
| MTBF incalculable (0 incidents) | Display '—' |
| bm_kpi view empty | Display "No data" |

---

## 7. Implementation Roadmap (3 Phases)

### Phase 1: Database & Resolve Enhancement (3 days)
1. Execute 11_bm_missing_columns.sql in Supabase
   - Add 10+ missing columns (action_taken, cause, resolved_by, etc.)
   - Update wontfix status constraint
2. Enhance pages/bm/[id].js
   - resolveNow() adds downtime_end: new Date().toISOString()
   - Connect TechnicianSelect component
3. Create components/bm/TechnicianSelect.js
4. Create pages/api/bm/resolve.js (atomic resolution endpoint)

### Phase 2: Edit Form & Filters (5 days)
5. Create pages/bm/edit/[id].js (full edit form with 9 sections)
6. Create pages/bm/index.js enhancements
   - Add BMFilterPanel (date range + asset filter)
   - Add sort toggle (priority)
   - Add BMKpiSummary banner
7. Create supporting components:
   - BMStatusBadge.js
   - BMSeverityBar.js
   - BMFilterPanel.js
   - BMKpiSummary.js
8. Create pages/api/bm/notify.js (optional Discord notifications)

### Phase 3: KPI Dashboard (3 days)
9. Create pages/api/bm/stats.js (aggregation endpoint)
10. Create pages/bm/stats.js (KPI dashboard with month selector)
11. Polish: Validation, error handling, loading states

---

## 8. File Structure Final

```
pages/bm/
  index.js              [Existing, Phase 2 enhance]
  new.js                [Existing, no changes]
  [id].js               [Existing, Phase 1 enhance]
  edit/
    [id].js             [New, Phase 2]
  stats.js              [New, Phase 3]

pages/api/bm/
  resolve.js            [New, Phase 1]
  stats.js              [New, Phase 3]
  notify.js             [New, Phase 2 optional]

components/bm/
  BMStatusBadge.js      [New, Phase 2]
  BMSeverityBar.js      [New, Phase 2]
  TechnicianSelect.js   [New, Phase 1]
  BMFilterPanel.js      [New, Phase 2]
  BMKpiSummary.js       [New, Phase 3]
  BMCard.js             [Optional refactor, Phase 2]

db/
  11_bm_missing_columns.sql [New, Phase 1 — Supabase direct]
```

---

## 9. Supabase Storage Checklist

- [ ] Create bucket `bm-photos` (skip if exists)
- [ ] Enable public read
- [ ] Enable authenticated write
- [ ] Max file size: 10MB
- [ ] Allowed MIME: image/jpeg, image/png, image/webp, image/heic, image/heif

---

## Design Document Status

**Status:** ✅ **Design Complete, Ready for Phase 1 Implementation**

**Next Step:** Web-builder begins Phase 1 (DB additions + resolve endpoint + TechnicianSelect)

**Success Criteria:**
- Phase 1: All missing columns added, resolve endpoint functional, TechnicianSelect integrated
- Phase 2: Edit form complete, filters working, KPI summary displays
- Phase 3: Stats dashboard shows MTTR/MTBF aggregation by asset and cause
- All 3 phases integrate seamlessly with existing BM module
