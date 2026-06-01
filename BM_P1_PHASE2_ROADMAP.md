---
name: BM-P1 Phase 2 Implementation Roadmap
description: 5-milestone sprint to complete API implementation and frontend UI (2026-06-02 ETA)
type: project
status: ACTIVE
start_date: 2026-06-01 07:17 KST
target_eta: 2026-06-02 18:00 KST
---

# 🚀 BM-P1 Phase 2: API Implementation + Frontend UI Roadmap

**Timeline:** 2026-06-01 07:17 KST → 2026-06-02 18:00 KST (35h 43m window)  
**Team:** Web Developer + Backend Dev + QA Specialist  
**Milestones:** 5 (sequential with 1-2 overlapping in final push)

---

## 📋 Milestone Overview

| # | Name | Duration | ETA | Owner | Status |
|---|------|----------|-----|-------|--------|
| **1** | API Implementation (Route Handlers + Business Logic) | 12h | 2026-06-01 19:17 KST | Web-Builder | 🔴 PENDING |
| **2** | Validation + Error Handling + Unit Tests | 6h | 2026-06-01 23:17 KST | Web-Builder + QA | 🔴 PENDING |
| **3** | Frontend Dashboard UI (List + Detail + Forms) | 10h | 2026-06-02 09:17 KST | Web Developer | 🔴 PENDING |
| **4** | Integration Testing + E2E Validation | 4h | 2026-06-02 13:17 KST | QA Specialist | 🔴 PENDING |
| **5** | Deployment + Smoke Testing + Documentation | 3h | 2026-06-02 16:17 KST | DevOps + Web-Builder | 🔴 PENDING |

**Contingency Buffer:** 2h 26m (auto-escalate if any milestone exceeds duration)

---

## 🎯 Milestone 1: API Implementation (Route Handlers + Business Logic)

**Duration:** 12 hours  
**ETA:** 2026-06-01 19:17 KST  
**Owner:** Web-Builder Agent  
**Scope:** 5 API endpoints + Supabase business logic + JWT auth

### Tasks

#### 1.1: GET /breakdowns (List with Filters)
- Query builder with asset_id, status, severity, date_range filters
- Pagination (limit/offset) with max 500 limit
- Sort by (reported_at, severity, duration_minutes)
- RLS enforcement (read all active records)
- Response: `{ data: BreakdownReport[], pagination: { total, limit, offset, has_more } }`

#### 1.2: POST /breakdowns (Create)
- Validate CreateBreakdownSchema (asset_id, description, severity, category, photos, documents)
- Auto-set: reported_by = current user, reported_at = now, status = 'reported'
- Verify asset_id exists in assets table
- Handle multi-file photo/document arrays
- Response: Created BreakdownReport with 201 status

#### 1.3: GET /breakdowns/{id} (Get Single)
- Fetch breakdown + join asset metadata (machine_asset_number, name_en)
- RLS check for visibility
- Handle 404 gracefully
- Return full BreakdownReport object

#### 1.4: PATCH /breakdowns/{id} (Update)
- Validate UpdateBreakdownSchema (status, severity, category, assigned_to, resolved_at, root_cause, action_taken, photos, documents)
- Status transition validation (reported → acknowledged → in_progress → resolved|won_fix)
- Auto-set resolved_by to current user if transitioning to resolved
- Update updated_at timestamp via trigger
- RLS: Only reporter, assignee, or admin can update
- Return updated BreakdownReport with 200 status

#### 1.5: GET /breakdowns/analytics/summary (Analytics)
- Query breakdown_analysis view with filters (asset_id, month)
- Calculate overall_metrics (aggregate across all assets/months)
- Return per-asset monthly summaries + overall KPIs
- Pagination support
- Response: `{ data: AnalyticsSummary[], overall_metrics: OverallMetrics, pagination }`

### Deliverables
- [ ] 5 route handlers in `/app/api/bm/breakdowns/`
- [ ] Supabase client integration + error handling
- [ ] JWT verification middleware
- [ ] Response type safety (TypeScript interfaces)
- [ ] Commit: `feat(api): implement BM-P1 Phase 2 CRUD endpoints (M1)`

---

## 🔍 Milestone 2: Validation + Error Handling + Unit Tests

**Duration:** 6 hours  
**ETA:** 2026-06-01 23:17 KST  
**Owner:** Web-Builder + QA Specialist (parallel)  
**Scope:** Input validation, error responses, unit test suite

### Tasks

#### 2.1: Input Validation (Zod Schemas)
- CreateBreakdownSchema: asset_id (UUID), description (min 1), severity enum, category enum, started_at (optional ISO8601), photos/documents (optional URL arrays)
- UpdateBreakdownSchema: all fields optional, status transition validation
- Request body parsing with error response on validation failure
- HTTP 400 with detailed error messages

#### 2.2: Error Handling Middleware
- 400 Bad Request: validation errors, malformed JSON, invalid asset_id
- 401 Unauthorized: missing/invalid JWT token
- 403 Forbidden: insufficient permissions (not reporter/assignee/admin)
- 404 Not Found: breakdown/asset not found
- 500 Internal Server Error: Supabase errors, database failures
- Error response format: `{ error: string, details?: object, timestamp: ISO8601 }`

#### 2.3: Unit Tests (Jest)
- Test valid and invalid inputs for each schema
- Test status transition rules (valid vs invalid transitions)
- Test RLS enforcement (403 on unauthorized update)
- Test pagination edge cases (limit > 500, negative offset)
- Test date range filters (reported_from/reported_to)
- Min coverage target: 85% (critical paths)
- Run: `npm test -- --testPathPattern=api/bm`

#### 2.4: Integration Tests
- Test end-to-end POST → GET flow
- Test status transition workflow
- Test analytics view queries
- Test soft delete (deleted_at field)
- Use mock Supabase or test database

### Deliverables
- [ ] Zod schemas in utils/validation/breakdown.ts
- [ ] Error handler middleware in middleware/error-handler.ts
- [ ] Jest test suite in __tests__/api/bm/breakdowns.test.ts (20+ test cases)
- [ ] All tests passing (npm test passes)
- [ ] Commit: `feat(validation): add Zod schemas + error handling (M2)`

---

## 🎨 Milestone 3: Frontend Dashboard UI

**Duration:** 10 hours  
**ETA:** 2026-06-02 09:17 KST  
**Owner:** Web Developer  
**Scope:** React components + Supabase hooks + responsive UI

### Tasks

#### 3.1: Breakdown List Page (`/pages/breakdowns/index.tsx`)
- Table component (TanStack Table or built-in)
- Columns: Asset, Status, Severity, Reported, Duration, Actions
- Filters: Status (multi-select), Severity (multi-select), Date range
- Sorting: Click column headers to sort
- Pagination: 25/50/100 rows per page
- Search: Quick search by asset name or breakdown ID
- Status badges: color-coded (reported=gray, acknowledged=blue, in_progress=orange, resolved=green, won_fix=blue)
- Severity badges: color-coded (minor=cyan, normal=gray, major=orange, line_down=red)
- Loading states + error handling
- Responsive design (mobile-first)

#### 3.2: Breakdown Detail Modal/Page (`/pages/breakdowns/[id].tsx`)
- Read-only view of all breakdown fields
- Display asset metadata (machine_asset_number, name_en, type)
- Timeline view of status transitions (created_at, acknowledged_at, started_at, resolved_at)
- Photo gallery (if photos array exists)
- Document links (if documents array exists)
- Root cause analysis section (category, root_cause, action_taken)
- Assigned to + resolved by user names
- Edit button (if user is reporter/assignee/admin)
- Delete button (if admin, soft delete via UI)

#### 3.3: Create Breakdown Form (`/components/BreakdownForm.tsx`)
- Asset picker (searchable dropdown, required)
- Description field (textarea, required, min 1 char)
- Description (Tamil) optional
- Severity selector (dropdown, default = normal)
- Category selector (dropdown, optional)
- Started at picker (date+time, optional)
- Photo uploader (multiple files, converts to storage URLs)
- Document uploader (multiple files, converts to storage URLs)
- Submit button (POST /api/bm/breakdowns)
- Validation feedback (real-time)
- Success toast + redirect to list

#### 3.4: Update Breakdown Form (`/components/UpdateBreakdownForm.tsx`)
- Status dropdown with validation (show only valid transitions)
- Severity selector (optional)
- Category selector (optional)
- Assigned to user picker (optional, admin only)
- Resolved at picker (required if status = resolved)
- Root cause textarea (optional)
- Action taken textarea (optional)
- Add photos/documents buttons
- Submit button (PATCH /api/bm/breakdowns/{id})
- Cancel button
- Loading state during submission

#### 3.5: Analytics Dashboard (`/pages/breakdowns/analytics.tsx`)
- Overall metrics card: Total breakdowns, Resolved %, Avg MTTR, Avg MTBF
- Severity distribution chart (pie or bar)
- Breakdown trend chart (line chart by month)
- Top assets by breakdown count (bar chart)
- Table view with per-asset monthly summaries
- Filter by date range
- Export to CSV button (future phase)

### Deliverables
- [ ] React components: BreakdownList, BreakdownDetail, BreakdownForm, UpdateBreakdownForm, AnalyticsDashboard
- [ ] Supabase real-time hooks (useBreakdowns, useBreakdownById, useBreakdownAnalytics)
- [ ] Styling: Tailwind CSS + responsive design
- [ ] Mobile testing (mobile browser or responsive view)
- [ ] Accessibility: WCAG AA (alt text, aria labels, keyboard nav)
- [ ] Commit: `feat(ui): implement BM-P1 Phase 2 frontend components (M3)`

---

## ✅ Milestone 4: Integration Testing + E2E Validation

**Duration:** 4 hours  
**ETA:** 2026-06-02 13:17 KST  
**Owner:** QA Specialist  
**Scope:** Cross-component testing, data consistency, user workflows

### Tasks

#### 4.1: API + Database Integration Tests
- Test POST /breakdowns → GET /breakdowns (verify created record appears in list)
- Test PATCH /breakdowns/{id} with status transition → verify updated_at changes
- Test RLS: Create breakdown as user A, verify user B cannot update
- Test soft delete: PATCH with deleted_at → verify GET returns 404
- Test analytics: Create 10 breakdowns, verify breakdown_analysis view calculates metrics correctly
- Test asset reference: Create breakdown with invalid asset_id → expect 400
- Test concurrent updates: Two users update same breakdown → verify last-write-wins or conflict handling

#### 4.2: Frontend + API Integration Tests
- Create form → submit → appears in list table
- Click breakdown in list → detail page loads → correct data displayed
- Update form → change status from "reported" to "acknowledged" → verify status updates
- Invalid status transition (reported → resolved without acknowledged) → verify error
- Filter breakdowns by status → verify only matching records shown
- Pagination: Create 100+ breakdowns, test page navigation
- Search by asset name → verify results match

#### 4.3: Data Consistency Checks
- duration_minutes calculated correctly (resolved_at - started_at)
- Updated_at timestamp reflects last update time
- Reported_by matches current user on creation
- Photos/documents arrays persist correctly
- Status transitions follow valid state machine
- RLS policies enforced on read/write

#### 4.4: Browser Testing (Manual or Playwright)
- Chrome/Firefox/Safari: components render correctly
- Mobile (iPhone/Android): responsive layout, touch interactions work
- Accessibility: Tab through form fields, read with screen reader

### Deliverables
- [ ] E2E test suite (Playwright or Cypress) with 15+ test cases
- [ ] Integration test report (pass/fail per test case)
- [ ] Data consistency report (verify all calculated fields)
- [ ] Browser compatibility matrix (Chrome, Firefox, Safari, Mobile)
- [ ] Commit: `test(e2e): comprehensive BM-P1 Phase 2 integration tests (M4)`

---

## 🚀 Milestone 5: Deployment + Smoke Testing + Documentation

**Duration:** 3 hours  
**ETA:** 2026-06-02 16:17 KST  
**Owner:** DevOps Engineer + Web-Builder  
**Scope:** Vercel deployment, production validation, docs

### Tasks

#### 5.1: Pre-Deployment Checklist
- [ ] All tests passing (npm test, npm run build succeeds)
- [ ] Environment variables set (SUPABASE_URL, SUPABASE_KEY)
- [ ] Database migrations applied (db/43 schema deployed to prod)
- [ ] Supabase RLS policies enabled
- [ ] API routes tested locally with curl/Postman
- [ ] Frontend builds without errors (npm run build)
- [ ] No console errors/warnings in browser
- [ ] Git branch up-to-date with main (if applicable)

#### 5.2: Vercel Deployment
- Push final commits to main
- Vercel auto-deploys (or manual trigger if needed)
- Monitor deployment logs for errors
- Wait for green checkmark (all checks pass)
- Deployment URL: https://dsc-fms.vercel.app/

#### 5.3: Production Smoke Tests
- Test API endpoints on production:
  - POST /api/bm/breakdowns (create test record)
  - GET /api/bm/breakdowns (verify test record listed)
  - PATCH /api/bm/breakdowns/{id} (update test record)
  - GET /api/bm/breakdowns/{id} (verify update persisted)
  - GET /api/bm/breakdowns/analytics/summary (verify analytics working)
- Test frontend pages on production:
  - Navigate to /breakdowns (list page loads)
  - Click create → form renders
  - Submit form → record created + appears in list
  - Click breakdown → detail page loads with correct data
  - Click edit → form pre-populates, update works
  - Filter by status/severity → results update

#### 5.4: Documentation
- Update README.md with BM-P1 Phase 2 completion
- API docs: Add BM-P1 endpoints to API documentation
- User guide: Screenshots of list/detail/create/update flows
- Database schema notes: Link to db/43_breakdown_management_phase1_schema.sql
- Deployment notes: Environment variables, RLS policies, cron jobs (if any)

### Deliverables
- [ ] ✅ Vercel deployment successful (green)
- [ ] ✅ All smoke tests passing
- [ ] [ ] Production URLs accessible
- [ ] [ ] Documentation updated
- [ ] [ ] Commit: `docs(bm-p1): phase 2 complete + deployment docs (M5)`

---

## 📊 Success Criteria

**Phase 2 completion = ALL of:**
- ✅ 5 API endpoints fully implemented + tested
- ✅ 5 React components (List, Detail, CreateForm, UpdateForm, Analytics) functional
- ✅ 85%+ test coverage (unit + integration)
- ✅ All smoke tests passing on production
- ✅ Zero critical bugs in evaluation
- ✅ Documentation complete

**ETA Accuracy:** Forecast vs actual < 1h deviation  
**Quality Gate:** Evaluator approval (QA Specialist signs off)

---

## 📅 Timeline & Capacity

| Milestone | Owner | Duration | Start | ETA | Status |
|-----------|-------|----------|-------|-----|--------|
| M1 (API) | Web-Builder | 12h | 2026-06-01 07:17 | 2026-06-01 19:17 | 🔴 PENDING |
| M2 (Tests) | QA | 6h | 2026-06-01 19:17 | 2026-06-01 23:17 | 🔴 PENDING (parallel with M1 final 2h) |
| M3 (UI) | Web Dev | 10h | 2026-06-01 19:17 | 2026-06-02 09:17 | 🔴 PENDING (parallel with M1 start) |
| M4 (E2E) | QA | 4h | 2026-06-02 09:17 | 2026-06-02 13:17 | 🔴 PENDING |
| M5 (Deploy) | DevOps | 3h | 2026-06-02 13:17 | 2026-06-02 16:17 | 🔴 PENDING |

**Total Work:** 35 hours  
**Available Window:** 35h 43m (6% contingency)  
**Parallel Execution:** M1 + M3 overlap (10h concurrent)  
**Go/No-Go Gate:** 2026-06-02 16:17 (before final 2h buffer)

---

## 🚨 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Supabase API issues | Medium | High | Test RLS early (M1), have fallback queries ready |
| Photo upload failures | Low | Medium | Mock file uploads in tests, use dummy URLs |
| Frontend performance on large datasets | Medium | Medium | Implement pagination, lazy loading, virtual scrolling |
| TypeScript type errors | Low | Low | Run type check early, use stricter tsconfig |
| QA finds critical bugs in M4 | Medium | High | Code review + unit tests in M2, escalate immediately |

---

## 🔄 Handoff & Status Updates

**Start:** Kick-off now (2026-06-01 07:17 KST)  
**Checkpoint #1:** After M1 (2026-06-01 19:17) → ETA validation  
**Checkpoint #2:** After M3 (2026-06-02 09:17) → API integration check  
**Checkpoint #3:** After M4 (2026-06-02 13:17) → Final QA sign-off  
**Go-Live:** M5 completion (2026-06-02 16:17)

Team members report blockers immediately (no silent waits >30min).

---

## 📝 Notes

- **Phase 1 completion:** Schema + OpenAPI spec ✅
- **Phase 2 scope:** API implementation + Frontend UI (this roadmap)
- **Phase 3 (future):** Advanced analytics dashboards, mobile app, real-time notifications
- **Estimated deployment time:** 2026-06-02 18:00 KST
- **Next review:** Post-deployment (2026-06-02 20:00 KST)
