---
name: DSC Hub Architecture — 3-Tab Integrated Portal
description: Complete system design integrating Personal History (Career), DSC FMS Dashboard, and Travel Records into unified portal (1177 lines, 16-day implementation roadmap)
type: project
relatedFiles:
  - project_asset_master_phase_a.md
  - project_backup_phase2_status.md
  - project_travel_management_phase1_api.md
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---
## Executive Summary

**Project:** DSC Hub Architecture Design  
**Scope:** Unified 3-tab portal replacing siloed dashboards  
**Duration:** Phase 1-4 (16 days total, including testing)  
**Status:** Design complete, ready for Phase 1 layout implementation  
**Owner:** Web-builder (implementation), Planner (architecture)

## 1. System Overview

### Current State (Before DSC Hub)
- Separate pages: Career history, FMS Dashboard, Travel management
- No unified navigation
- User context-switching between modules

### Target State (DSC Hub)
Single portal with 3 main tabs at top, persistent throughout session:
1. **Tab 1: Personal History** — Career, companies, projects, achievements, skills
2. **Tab 2: DSC FMS** — Existing dashboard (BM, PM, KPI, Inventory, WO, Reports)
3. **Tab 3: Travel Records** — Trip planning, scheduling, cost tracking, map view

---

## 2. Key Design Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **3-Tab Navigation** | Unified context, persistent session | All pages share header/nav |
| **Travel Module NEW** | User requested trip management | +4 DB tables, +13 API endpoints, +7 components |
| **Existing FMS Retained** | No breaking changes | Tab 2 reuses current dashboard |
| **RLS for Travel** | User privacy | Each user sees own trips only |
| **Google Maps Phase 4** | Optional enhancement | Deferred, not blocking MVP |
| **16-Day Roadmap** | Phased delivery | Phase 1 layout → Phase 4 maps |

---

## 3. Page/Component Structure

### Tab 1: Personal History
**Route:** `/career` (main), `/career/companies/`, `/career/projects/`, `/career/achievements/`

**Components:**
```
CareerDashboard.jsx (main page)
├── CompanyCard.jsx (company summary card)
├── ProjectList.jsx (grouped by company)
├── SkillCloud.jsx (tag cloud)
└── AchievementCard.jsx (nested under projects)
```

**Key Fields:**
- Companies: name, logo, position, tenure (2024-Present), project count
- Projects: title, description, status (In Progress/Completed), skills used, achievements count
- Skills: tags/labels from all projects
- Achievements: impact metrics ("+30% efficiency")

### Tab 2: DSC FMS Dashboard
**Route:** `/fms` (existing)

**Retained Components:**
- Quick action bar (BM, PM, KPI, Inv, WO, Reports)
- Cards/Charts for each module (unchanged)

**Note:** All existing FMS functionality preserved; this is read-only from design perspective.

### Tab 3: Travel Records
**Route:** `/travel` (list), `/travel/[id]` (detail), `/travel/new` (add)

**Components:**
```
TravelDashboard.jsx (list page with filters)
├── TravelCard.jsx (summary card)
├── TravelForm.jsx (add/edit form)
└── TravelDetail.jsx (detail page with 3 sub-tabs)
    ├── ScheduleEditor.jsx (day-by-day schedule)
    ├── CostTracker.jsx (expense tracking + stats)
    └── TravelMap.jsx (Google Maps integration)
```

**Key Fields:**
- Travel record: title, description, country, status (planning/ongoing/completed/cancelled)
- Schedules: day, event name, location, time range, coordinates
- Costs: type (flight/hotel/meal/transport/other), amount, currency (INR/KRW/USD), exchange rate, receipt
- Routes: from location → to location, distance, transport mode, polyline

---

## 4. Database Schema (Supabase)

### Existing Tables (Retained)
```
✓ categories, asset_classes, assets
✓ bm_history, bm_events
✓ spare_parts, stock_movements, vendors
✓ pm_plans, pm_schedules, pm_work_logs, pm_parts_used
✓ kpi_categories, kpi_targets, kpi_actuals
✓ work_orders
✓ career_companies, career_projects, career_achievements, career_skills
```

### New Tables: Travel Module

#### `travel_records`
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (FK auth.users)
title TEXT NOT NULL
description TEXT
start_date DATE NOT NULL
end_date DATE NOT NULL
country TEXT (default 'India')
total_distance_km INT
total_cost_inr DECIMAL(10,2)
total_cost_krw DECIMAL(12,2)
status TEXT CHECK (planning|ongoing|completed|cancelled)
photos TEXT[] (URLs)
documents TEXT[] (URLs)
created_at, updated_at TIMESTAMPTZ
created_by, updated_by UUID
```

**Indexes:** idx_travel_user, idx_travel_date

#### `travel_schedules`
```sql
id UUID PRIMARY KEY
travel_id UUID NOT NULL (FK travel_records)
date DATE NOT NULL
event_name TEXT NOT NULL
location TEXT NOT NULL
description TEXT
start_time TIME
end_time TIME
latitude DECIMAL(9,6)
longitude DECIMAL(9,6)
sort_order INT
created_at, updated_at TIMESTAMPTZ
```

**Indexes:** idx_schedules_travel, idx_schedules_date

#### `travel_costs`
```sql
id UUID PRIMARY KEY
travel_id UUID NOT NULL (FK travel_records)
cost_type TEXT (flight|hotel|meal|transport|other)
description TEXT
amount DECIMAL(12,2) NOT NULL
currency TEXT CHECK (INR|KRW|USD)
exchange_rate DECIMAL(8,4) — INR→KRW reference rate at record time
is_approved BOOLEAN
approved_by UUID (FK auth.users)
approved_at TIMESTAMPTZ
receipt_url TEXT
date DATE NOT NULL
created_at, updated_at TIMESTAMPTZ
created_by UUID
```

**Indexes:** idx_costs_travel, idx_costs_date, idx_costs_type

#### `travel_routes`
```sql
id UUID PRIMARY KEY
travel_id UUID NOT NULL (FK travel_records)
from_location TEXT NOT NULL
to_location TEXT NOT NULL
from_lat, from_lon, to_lat, to_lon DECIMAL(9,6)
distance_km INT
duration_hours DECIMAL(5,2)
transport_mode TEXT (car|flight|train|bus|other)
travel_date DATE NOT NULL
polyline TEXT — encoded polyline from Google Directions API
created_at TIMESTAMPTZ
```

**Indexes:** idx_routes_travel, idx_routes_date

### RLS (Row Level Security) Policies

**`travel_records`:** User can only access own records (user_id = auth.uid())

**`travel_schedules`, `travel_costs`, `travel_routes`:** Indirect filtering via travel_id → travel_records

### Views (Optional)

- `v_travel_cost_summary` — cost count, total amount, currencies per travel
- `v_travel_schedule_count` — schedule count, first/last day per travel

---

## 5. API Endpoints

### Travel CRUD (`/api/travel/*`)

| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| GET | `/api/travel` | List all trips (with pagination) | [{ id, title, start_date, status, counts }] |
| POST | `/api/travel` | Create trip | { id, created_at } |
| GET | `/api/travel/[id]` | Get trip detail (+ schedules, costs, routes) | { all fields, nested arrays } |
| PUT | `/api/travel/[id]` | Update trip | { updated_at } |
| DELETE | `/api/travel/[id]` | Delete trip (cascading) | { success: true } |

### Schedule CRUD (`/api/travel/[travel_id]/schedule`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/schedule` | List all schedules for trip (date-sorted) |
| POST | `/schedule` | Add schedule (date, event_name, location, time, coordinates) |
| PUT | `/schedule/[id]` | Update schedule |
| DELETE | `/schedule/[id]` | Delete schedule |

### Cost CRUD (`/api/travel/[travel_id]/cost`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/cost` | List costs (with type/date filters) |
| POST | `/cost` | Add cost (type, amount, currency, exchange_rate, receipt) |
| PUT | `/cost/[id]` | Update cost |
| DELETE | `/cost/[id]` | Delete cost |

### Map API (`/api/travel/[travel_id]/map`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/map/polyline` | Get all routes as polylines for rendering |
| POST | `/map/route` | Add route (calls Google Directions API, returns polyline + distance + duration) |

---

## 6. UI Design Highlights

### Travel List View (`/travel`)
```
┌────────────────────────────────────────┐
│ Travel Records              [+ New Trip]│
├────────────────────────────────────────┤
│ [Filters: All | Planning | Ongoing]    │
│                                        │
│ ┌─ India Visit 2026-05 ──────────────┐│
│ │ May 10-17, 2026  |  8 days         ││
│ │ 1200 km  |  ₹50,000 (~₹775K)       ││
│ │ [Schedule: 8] [Costs: 15] [Map]    ││
│ └────────────────────────────────────┘│
│                                        │
│ ┌─ Seoul HQ Trip 2026-04 ────────────┐│
│ │ Apr 15-20, 2026  |  6 days         ││
│ │ 500 km  |  ₹120,000 (~₹1,860K)     ││
│ │ [Schedule: 5] [Costs: 12] [Map]    ││
│ └────────────────────────────────────┘│
└────────────────────────────────────────┘
```

### Travel Detail View (`/travel/[id]`)

**3 Tabs:**
1. **Schedule Tab**
   - Day-by-day breakdown (May 10, May 11, etc.)
   - Events with times (10:00-11:30: Depart Chennai)
   - [+ Add Event] button per day

2. **Costs Tab**
   - Total: ₹50,000 (~₹775K KRW)
   - Filters: [All] [Flight] [Hotel] [Food]
   - List with date, type, amount, receipt link
   - [+ Add Cost] button

3. **Map Tab**
   - Google Maps container
   - Polylines for routes (colored by transport mode)
   - Markers for schedule locations
   - Legend (Driving/Flight/Hotel/Transit)

---

## 7. Implementation Roadmap

### Phase 1: Layout & Navigation (3 days)
**Goal:** 3-tab persistent navigation working

**Tasks:**
1. Create `components/Layout.jsx` (header, tab nav, footer)
2. Create `components/TabNavigation.jsx` (active indicator, routing)
3. Modify `/pages/index.js` to render 3 tabs
4. Create `/pages/career/`, `/pages/travel/` directories
5. CSS: Mobile responsive (Tailwind / existing styles)

**Deliverable:** All pages accessible via tabs; URL-based tab state (`?tab=personal`, `?tab=fms`, `?tab=travel`); hamburger menu on mobile

### Phase 2: Travel Module — DB + CRUD (5 days)
**Goal:** Full travel CRUD working

**Tasks:**
1. Run Supabase SQL: `db/21_travel_module.sql` (4 tables + RLS policies)
2. Implement `/api/travel/*` endpoints (GET/POST/PUT/DELETE)
3. Implement `/pages/travel/` pages (list, detail, new)
4. Create Travel components (Card, Form, Detail)

**Deliverable:** Travel list, add, edit, delete all functional; DB data persisted

### Phase 3: Costs & Schedules (3 days)
**Goal:** Travel detail tabs complete

**Tasks:**
1. Implement `/api/travel/[id]/schedule` endpoints
2. Implement `/api/travel/[id]/cost` endpoints
3. Add 3 tabs to detail page (Schedule, Costs, Map)
4. Create ScheduleEditor.jsx, CostTracker.jsx
5. Add statistics (total cost, INR↔KRW conversion)

**Deliverable:** Full schedule and cost management working

### Phase 4: Google Maps (3 days)
**Goal:** Map visualization working

**Tasks:**
1. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel
2. Install `@react-google-maps/api`
3. Implement TravelMap.jsx (polylines, markers, legend)
4. Implement `/api/travel/[id]/map` endpoints
5. Google Directions API integration (optional)

**Deliverable:** Trip routes visualized on interactive map

### Testing & Bug Fixes (2 days)
- Unit tests: API validation, utilities
- Integration tests: E2E flow (create → schedule → cost → map)
- Manual testing: Mobile responsiveness, offline mode
- RLS verification (cross-user access blocked)

---

## 8. Technical Stack

### Retained
- **Framework:** Next.js 14
- **DB:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **UI:** Tailwind CSS
- **Charts:** Recharts (KPI)

### New Packages
```json
{
  "@react-google-maps/api": "^2.19.2",
  "react-datepicker": "^4.21.0",
  "lucide-react": "^0.294.0"
}
```

---

## 9. File Structure Changes

```
dsc-fms-portal/
├── db/
│   └── 21_travel_module.sql ← NEW
│
├── pages/
│   ├── api/travel/ ← NEW
│   │   ├── index.js (GET/POST /api/travel)
│   │   ├── [id].js (GET/PUT/DELETE)
│   │   └── [id]/
│   │       ├── schedule.js
│   │       ├── cost.js
│   │       └── map.js
│   │
│   ├── travel/ ← NEW
│   │   ├── index.js (list)
│   │   ├── [id].js (detail + 3 tabs)
│   │   └── new.js (add form)
│   │
│   ├── career/ ← EXISTING
│   ├── index.js (main hub dashboard - 3 tabs)
│   └── (existing pages retain unchanged)
│
├── components/
│   ├── Layout.jsx ← NEW
│   ├── TabNavigation.jsx ← NEW
│   │
│   ├── travel/ ← NEW
│   │   ├── TravelDashboard.jsx
│   │   ├── TravelCard.jsx
│   │   ├── TravelForm.jsx
│   │   ├── TravelDetail.jsx
│   │   ├── ScheduleEditor.jsx
│   │   ├── CostTracker.jsx
│   │   └── TravelMap.jsx
│   │
│   ├── career/ ← EXISTING
│   └── (existing components retain unchanged)
│
└── lib/
    ├── travel-utils.js ← NEW (date, distance, exchange rate)
    └── (existing libs retain unchanged)
```

---

## 10. Validation Checklist

### Phase 1: Layout
- [ ] 3 tabs render on all pages
- [ ] Tab switching smooth, active state clear
- [ ] Mobile menu collapses (hamburger icon)
- [ ] URL state syncs with tab (e.g., ?tab=travel)
- [ ] No breaking changes to existing features

### Phase 2: Travel CRUD
- [ ] List view shows all trips with stats
- [ ] Create form validates (start_date ≤ end_date)
- [ ] Detail page shows all trip info
- [ ] Edit works, cascading delete removes related data
- [ ] RLS enforced (user A can't see user B's trips)

### Phase 3: Costs/Schedules
- [ ] Schedule CRUD fully works (add/edit/delete events)
- [ ] Cost CRUD fully works (add/edit/delete expenses)
- [ ] Stats calculated correctly (total, currency conversion)
- [ ] 3 tabs display and switch smoothly
- [ ] Mobile layout responsive

### Phase 4: Maps
- [ ] Google Maps API key configured
- [ ] Map renders with polylines (routes)
- [ ] Markers display (schedule locations)
- [ ] Legend shows transport modes
- [ ] Graceful fallback if API unavailable

---

## 11. Edge Cases Handled

| Case | Solution |
|------|----------|
| Trip created without schedules | Warning: "Add at least one event" |
| Start date > end date | Form validation prevents submission |
| No exchange rate set | Default 15.5 INR/KRW |
| Cost type invalid | Dropdown selection only |
| Google Maps API unavailable | "Map unavailable" message, form visible |
| Network error during trip creation | Retry button + localStorage cache |
| User A tries to access user B's trip | RLS policy blocks, 403 error |
| Receipt upload fails | Optional field (not required) |

---

## 12. Performance Notes

- **Query optimization:** Pagination (LIMIT 20), indexed joins on user_id, travel_id, date
- **Caching:** Travel list (5min ISR), detail (1min), map polylines (60min)
- **Bundle:** Google Maps dynamically imported; recharts already in use
- **Icons:** Lucide React (tree-shaking support)

---

## 13. Security

- **Auth:** Supabase JWT token in Authorization header
- **RLS:** All travel tables row-filtered by user_id or travel_id FK
- **Input validation:** Client-side (form validation), server-side (Zod or manual)
- **SQL injection:** Supabase parameterized queries (automatic)
- **Sensitive data:** Travel costs visible to user; receipts in private Supabase Storage

---

## 14. Deployment Plan

1. **Phase 1:** Vercel auto-deploy (no DB changes)
2. **Phase 2:** Supabase SQL migration + API release
3. **Phase 3:** API extensions (no schema changes)
4. **Phase 4:** Environment variable setup (Google Maps key) + feature flag if needed
5. **Rollback:** Git tags per phase; SQL is idempotent

---

## Design Document Status

**Status:** ✅ **Design Complete, Ready for Implementation**

**Next Step:** Web-builder begins Phase 1 (layout & navigation)

**Evaluation Criteria:**
- All 16-day phases completed on schedule
- User acceptance testing passes
- Performance benchmarks met (page load <2s)
- No breaking changes to existing FMS features

