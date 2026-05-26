# Team Dashboard Implementation Checklist v1.0
**Status:** ✅ Design Complete - Ready for Web-Builder (2026-05-26)  
**Target Completion:** 2026-06-02  
**Success Criteria:** All 3 phases passing + zero blocking items + deployment to prod

---

## Design Validation Checklist (Pre-Implementation)

### ✅ Design Documents Complete
- [x] TEAM_DASHBOARD_DESIGN.md (1200+ lines) — UI sketches, components, architecture
- [x] TEAM_DASHBOARD_API_GUIDE.md (400+ lines) — 5 endpoints with schemas
- [x] TEAM_DASHBOARD_DB_SCHEMA.sql (350+ lines) — 4 tables + RLS + triggers
- [x] TEAM_DASHBOARD_CHECKLIST.md (this file) — Implementation guide

### ✅ API Contract Finalized
- [x] GET /api/dashboard/team-org/structure — org chart endpoint
- [x] GET /api/dashboard/team-capabilities/matrix — capability scores endpoint
- [x] GET /api/dashboard/team-capabilities/improvement-actions — actions list endpoint
- [x] POST /api/dashboard/team-capabilities/improvement-actions/:id — update action endpoint
- [x] GET /api/dashboard/team-kpis/summary — health metrics endpoint
- [x] GET /api/dashboard/team-kpis/trends — trend data endpoint

### ✅ Database Schema Reviewed
- [x] 4 required tables specified (team_members, capability_scores, improvement_actions, team_org_chart)
- [x] RLS policies defined for each table
- [x] 6 triggers defined (auto-timestamps, note append, auto-complete, org sync)
- [x] Seed data includes CEO + 7 ops core members
- [x] All foreign keys and constraints defined

### ✅ Component Architecture Defined
- [x] Page hierarchy (3 pages: team-org, team-capabilities, team-kpis)
- [x] Component tree for each page (7+ components per page)
- [x] TypeScript interfaces for all data structures
- [x] State management approach (React Context + useReducer)
- [x] Styling system reference (design_system_ai_team_dashboard.md)

### ✅ Access Control Specified
- [x] CEO: Full access to all features
- [x] Ops Core: Capability matrix + KPI views (org chart filtered)
- [x] Project Leads: Team members + own assignments
- [x] Team Members: View-only own metrics
- [x] RLS policies implemented in DB schema

---

## Phase 1: Team Org Chart Implementation (2026-05-27~28)

### Database Setup
- [ ] **1.1** Run db/41_team_dashboard_schema.sql migration
  - Run: `supabase migration up --file 41_team_dashboard_schema.sql`
  - Verify: All 4 tables exist + RLS enabled
  - Verify seed: CEO + 7 ops core members inserted
  - **Success Criteria:** SELECT COUNT(*) FROM team_members = 8
  
- [ ] **1.2** Verify RLS policies applied
  - [ ] CEO read policy on team_members
  - [ ] Team lead read policy on team_members
  - [ ] User self-view policy on team_members
  - [ ] Test: Query as CEO → 8 members visible
  - Test: Query as non-CEO → only self visible

- [ ] **1.3** Verify triggers created
  - [ ] auto_complete_improvement_action trigger exists
  - [ ] sync_org_chart_on_member_change trigger exists
  - [ ] Test: INSERT → trigger fires and updates timestamp

### API Implementation (5 endpoints)
- [ ] **1.4** Create GET /api/dashboard/team-org/structure endpoint
  - [ ] Handler: `/pages/api/dashboard/team-org/structure.ts`
  - [ ] Query Supabase with recursive CTE
  - [ ] Return org_chart array with children nested
  - [ ] Add Cache-Control header: `public, max-age=3600, stale-while-revalidate=86400`
  - [ ] Test: Request as CEO → returns 8 members + hierarchy
  - [ ] Test: Request as non-CEO → returns 403 Forbidden
  - [ ] **Success Criteria:** Response <2s, status 200, org_chart has depth 0-3

- [ ] **1.5** Create GET /api/dashboard/team-capabilities/matrix endpoint
  - [ ] Handler: `/pages/api/dashboard/team-capabilities/matrix.ts`
  - [ ] Query capability_scores for all members
  - [ ] Join with team_members for name/email/role
  - [ ] Calculate trends (7d comparison)
  - [ ] Add sorting support (query param: sort_by, sort_dir)
  - [ ] Test: Request with ?sort_by=technical → returns sorted by technical
  - [ ] Test: Response includes overall_score calculated correctly
  - [ ] **Success Criteria:** Response <2s, all 8 members returned with scores

- [ ] **1.6** Create GET /api/dashboard/team-capabilities/improvement-actions endpoint
  - [ ] Handler: `/pages/api/dashboard/team-capabilities/improvement-actions.ts`
  - [ ] Query improvement_actions with status filter (optional)
  - [ ] Join with team_members for owner_name, reviewer_name
  - [ ] Sort by due_date, status (pending first)
  - [ ] Test: Request with ?filter=pending → only pending actions returned
  - [ ] Test: Pagination support (?limit=10&offset=0)
  - [ ] **Success Criteria:** Response <1s, includes status distribution stats

- [ ] **1.7** Create POST /api/dashboard/team-capabilities/improvement-actions/:id endpoint
  - [ ] Handler: `/pages/api/dashboard/team-capabilities/improvement-actions/[id].ts`
  - [ ] Accept body: { progress, status, notes, updated_by }
  - [ ] Update improvement_actions row
  - [ ] Append to notes JSONB array (with timestamp, author)
  - [ ] Call revalidatePath to clear ISR cache
  - [ ] Test: POST with progress=75 → row updated, returns 200
  - [ ] Test: Notes array appended correctly with timestamp
  - [ ] Test: Auto-complete when progress=100
  - [ ] **Success Criteria:** Update reflected in next GET request, <2s response time

- [ ] **1.8** Create GET /api/dashboard/team-kpis/summary endpoint
  - [ ] Handler: `/pages/api/dashboard/team-kpis/summary.ts`
  - [ ] Aggregate capability_scores by dimension (avg of all members)
  - [ ] Calculate health metrics: capability, utilization, completion, reliability
  - [ ] Compare to previous period (7d back)
  - [ ] Calculate trend direction (up, down, stable)
  - [ ] Test: Returns 4 health metrics + dimension scores
  - [ ] Test: Trend calculations correct vs test data
  - [ ] **Success Criteria:** Response <2s, includes all 4 KPI categories

### React Components (OrgChart focused)
- [ ] **1.9** Create <TeamOrgPage> page component
  - [ ] File: `/pages/dashboard/team-org.tsx`
  - [ ] Fetch from GET /api/dashboard/team-org/structure
  - [ ] Setup TeamDashboardContext with org chart data
  - [ ] Render <PageHeader>, <FilterBar>, <OrgChartContainer>
  - [ ] Add RefreshButton with manual revalidation
  - [ ] Test: Page loads <2s, all 8 members visible
  - [ ] Test: Click refresh → data refetches
  - [ ] **Success Criteria:** All members rendered, expand/collapse works

- [ ] **1.10** Create <OrgChartRenderer> component
  - [ ] File: `/components/dashboard/OrgChartRenderer.tsx`
  - [ ] Recursive tree visualization for OrgNode structure
  - [ ] Expand/collapse toggle for each parent node
  - [ ] Show role badge + name + project + capability score
  - [ ] Color coding: CEO (red), Ops Core (orange), Team Member (green)
  - [ ] Test: All 8 members visible in correct hierarchy
  - [ ] Test: Expand/collapse works for ops core children
  - [ ] Test: Mobile: stack vertically
  - [ ] **Success Criteria:** All 8 nodes render, hierarchy depth correct, mobile responsive

- [ ] **1.11** Create <TeamMemberCard> component
  - [ ] File: `/components/dashboard/TeamMemberCard.tsx`
  - [ ] Display member name, role, email, current project, status
  - [ ] Show capability score (0-100 bar)
  - [ ] Show reliability percentage
  - [ ] Click → select member in context (for detail view)
  - [ ] Status badge: active (green), on-leave (yellow), blocked (red)
  - [ ] Test: Card displays all fields correctly
  - [ ] Test: Click → member selected in context
  - [ ] Test: Mobile: card stacks without breaking layout
  - [ ] **Success Criteria:** All fields display, click handler works, responsive

- [ ] **1.12** Create <FilterBar> component
  - [ ] File: `/components/dashboard/FilterBar.tsx`
  - [ ] Filter by role: CEO, Ops Core, Project Lead, Team Member
  - [ ] Filter by status: Active, On Leave, Blocked
  - [ ] Clear filters button
  - [ ] Apply filters to org chart display
  - [ ] Test: Select role filter → only that role visible
  - [ ] Test: Select status filter → only that status visible
  - [ ] Test: Multiple filters → AND logic
  - [ ] **Success Criteria:** Filters work, org chart updates on change

- [ ] **1.13** Create <PageHeader> component
  - [ ] File: `/components/dashboard/PageHeader.tsx`
  - [ ] Display page title + icon
  - [ ] Show last update timestamp
  - [ ] Include <RefreshButton>
  - [ ] Breadcrumb navigation: Dashboard > Team Org
  - [ ] Test: Title displays correctly
  - [ ] Test: Timestamp updates on refresh
  - [ ] **Success Criteria:** Header renders, refresh button functional

### Styling (Tailwind CSS)
- [ ] **1.14** Apply Tailwind styling to all org chart components
  - [ ] Use design_system_ai_team_dashboard.md color palette
  - [ ] Desktop layout: 3-column grid for hierarchy
  - [ ] Tablet layout: 2-column grid
  - [ ] Mobile layout: 1-column stack
  - [ ] Spacing: 6px/12px/24px padding/margins
  - [ ] Cards: border-slate-200, shadow-md, rounded-lg
  - [ ] Status badge colors: green-50/yellow-50/red-50
  - [ ] Test: Desktop layout at ≥1024px
  - [ ] Test: Tablet layout at 768-1023px
  - [ ] Test: Mobile layout at <768px
  - [ ] **Success Criteria:** Responsive design works, colors match spec, no console warnings

### Testing Phase 1
- [ ] **1.15** Unit tests for components
  - [ ] Test: <OrgChartRenderer> renders all nodes
  - [ ] Test: <TeamMemberCard> displays all fields
  - [ ] Test: <FilterBar> filters correctly
  - [ ] Test: Context state updates on actions
  - [ ] Command: `npm run test -- --testPathPattern="dashboard/team-org"`
  - [ ] **Success Criteria:** ≥4 unit tests passing

- [ ] **1.16** Integration tests (API + UI)
  - [ ] Test: Load org chart page → all members visible
  - [ ] Test: Expand team lead → children appear
  - [ ] Test: Filter by role → correct members shown
  - [ ] Test: Click member → detail panel opens (future feature)
  - [ ] Command: `npm run test:e2e -- team-org.spec.ts`
  - [ ] **Success Criteria:** ≥3 E2E tests passing, <2s page load

- [ ] **1.17** Performance testing
  - [ ] Lighthouse score: ≥90
  - [ ] Largest Contentful Paint (LCP): <2s
  - [ ] First Input Delay (FID): <100ms
  - [ ] Cumulative Layout Shift (CLS): <0.1
  - [ ] Command: `npm run lighthouse -- /dashboard/team-org`
  - [ ] **Success Criteria:** All metrics green, no performance warnings

- [ ] **1.18** Accessibility testing
  - [ ] axe-core scan: 0 critical, 0 serious
  - [ ] Keyboard navigation: Tab through all interactive elements
  - [ ] Screen reader: All elements have aria-label/aria-describedby
  - [ ] Color contrast: ≥4.5:1 for all text
  - [ ] Command: `npx axe --headless https://localhost:3000/dashboard/team-org`
  - [ ] **Success Criteria:** WCAG AA compliant, 0 accessibility warnings

### Phase 1 Sign-off
- [ ] **1.19** Code review + approval
  - [ ] PR created and linked in GITHUB_LINKS file
  - [ ] All unit/E2E tests passing
  - [ ] No console warnings/errors
  - [ ] Code follows existing patterns (similar components)
  - [ ] **Approval:** CEO (user) approves Phase 1 completion

- [ ] **1.20** Deploy Phase 1 to Vercel
  - [ ] Merge PR to main branch
  - [ ] Vercel auto-deploy triggered
  - [ ] Production URL: https://dsc-fms-portal.vercel.app/dashboard/team-org
  - [ ] Verify: Page loads on production
  - [ ] Test: Production org chart works (sample: curl to production API)
  - [ ] **Success Criteria:** Page live, API responds <2s, zero errors in Vercel logs

---

## Phase 2: Capability Matrix + Improvements (2026-05-29~31)

### Database Setup
- [ ] **2.1** Verify capability_scores & improvement_actions tables
  - [ ] Tables exist from Phase 1 migration
  - [ ] Triggers for auto-timestamp, auto-complete working
  - [ ] Test: INSERT into capability_scores → timestamp auto-set
  - [ ] Test: UPDATE progress to 100 → status changed to completed
  - [ ] **Success Criteria:** All triggers firing correctly

### API Implementation
- [ ] **2.2** Update GET /api/dashboard/team-capabilities/matrix
  - [ ] Already created in Phase 1 ✓
  - [ ] Ensure sorting works (name, technical, tasks, comms, learning, reliability)
  - [ ] Test: ?sort_by=technical → sorted by technical scores
  - [ ] Test: ?sort_dir=desc → highest scores first
  - [ ] **Success Criteria:** Sorting works correctly

- [ ] **2.3** Update GET /api/dashboard/team-capabilities/improvement-actions
  - [ ] Already created in Phase 1 ✓
  - [ ] Ensure filtering works (?filter=pending|in_progress|completed)
  - [ ] Test: ?filter=in_progress → only in-progress actions
  - [ ] Test: Status distribution in response (pending, in_progress, completed counts)
  - [ ] **Success Criteria:** Filtering + stats accurate

- [ ] **2.4** Update POST /api/dashboard/team-capabilities/improvement-actions/:id
  - [ ] Already created in Phase 1 ✓
  - [ ] Verify auto-complete logic (progress=100 → status=completed)
  - [ ] Verify notes append correctly with timestamps
  - [ ] Test: POST {progress: 100} → status becomes completed
  - [ ] **Success Criteria:** Auto-completion works, notes append correctly

### React Components
- [ ] **2.5** Create <CapabilityMatrixTable> component
  - [ ] File: `/components/dashboard/CapabilityMatrixTable.tsx`
  - [ ] Data grid: rows=members, cols=name + 5 dimensions
  - [ ] Sortable headers (click to sort)
  - [ ] Color-coded cells: green (90-100), yellow (70-89), orange (50-69), red (0-49)
  - [ ] Hover tooltip: Show trend (↑ +2.5, ↓ -1.2, stable) for last 7 days
  - [ ] Export to CSV button
  - [ ] Test: All 8 members displayed
  - [ ] Test: Click header → sorts by that dimension
  - [ ] Test: Cells show correct colors based on score ranges
  - [ ] **Success Criteria:** Matrix renders, sorting works, colors correct

- [ ] **2.6** Create <CapabilityMatrixPage> page component
  - [ ] File: `/pages/dashboard/team-capabilities.tsx`
  - [ ] Two sections: Capability Matrix (top) + Improvement Actions (bottom)
  - [ ] Fetch both /api/dashboard/team-capabilities/matrix and /api/dashboard/team-capabilities/improvement-actions
  - [ ] Add filter options: dimension, status
  - [ ] RefreshButton for manual refresh
  - [ ] Test: Page loads both API endpoints
  - [ ] Test: Filters update both matrix and actions
  - [ ] **Success Criteria:** Both sections load, filters work

- [ ] **2.7** Create <ImprovementActionCard> component
  - [ ] File: `/components/dashboard/ImprovementActionCard.tsx`
  - [ ] Display: status badge + title + owner + dimension + scores + progress bar + due date
  - [ ] Progress bar: visual 0-100% filled rectangle
  - [ ] Status color: pending (gray), in_progress (blue), completed (green), overdue (red)
  - [ ] Click → expand to show full description + notes
  - [ ] Edit button (for owner/reviewer): inline edit mode
  - [ ] Test: Card displays all fields
  - [ ] Test: Click expand → details visible
  - [ ] Test: Edit mode shows input fields
  - [ ] **Success Criteria:** Card renders, expand/edit works, status colors correct

- [ ] **2.8** Create <ImprovementActionsPanel> component
  - [ ] File: `/components/dashboard/ImprovementActionsPanel.tsx`
  - [ ] List of <ImprovementActionCard> components
  - [ ] Group by status: Pending, In Progress, Completed (tabs or sections)
  - [ ] Filter options: status, owner, dimension
  - [ ] Sort by: due date, progress, owner
  - [ ] Test: All actions display
  - [ ] Test: Tab selection changes visible actions
  - [ ] Test: Filters work correctly
  - [ ] **Success Criteria:** All actions render, grouping works, filters functional

- [ ] **2.9** Create <DimensionBreakdown> component
  - [ ] File: `/components/dashboard/DimensionBreakdown.tsx`
  - [ ] Single dimension bar chart: all members' scores for one dimension
  - [ ] Horizontal bars, sorted by score (highest first)
  - [ ] Target line overlay (dashed, labeled)
  - [ ] Color gradient: low scores red, high scores green
  - [ ] Tooltip on hover: member name, score, trend
  - [ ] Test: Chart renders for selected dimension
  - [ ] Test: All 8 members displayed in bars
  - [ ] Test: Sorting and coloring correct
  - [ ] **Success Criteria:** Chart renders, sorting correct, colors match

### Styling Phase 2
- [ ] **2.10** Apply Tailwind styling to capability matrix components
  - [ ] Table: border-slate-200, striped rows (gray-50/white alternating)
  - [ ] Header: bg-slate-100, font-semibold, cursor-pointer (for sort)
  - [ ] Cells: padding-2, center-aligned numbers
  - [ ] Cards: rounded-lg, shadow-md, border-l-4 (status color)
  - [ ] Progress bar: bg-blue-200, inner fill-blue-500
  - [ ] Test: Desktop table layout
  - [ ] Test: Tablet: table scrolls horizontally
  - [ ] Test: Mobile: cards stack vertically (no table)
  - [ ] **Success Criteria:** Responsive design works, no overflow on mobile

### Testing Phase 2
- [ ] **2.11** Unit tests for capability components
  - [ ] Test: <CapabilityMatrixTable> renders all members + dimensions
  - [ ] Test: <ImprovementActionCard> displays all fields
  - [ ] Test: <DimensionBreakdown> renders correct dimension
  - [ ] Test: Sorting works in matrix table
  - [ ] Test: Filter changes visible actions
  - [ ] Command: `npm run test -- --testPathPattern="dashboard/team-capabilities"`
  - [ ] **Success Criteria:** ≥8 unit tests passing

- [ ] **2.12** Integration tests (API + UI)
  - [ ] Test: Load capability matrix page → all members visible
  - [ ] Test: Click matrix header → sorts correctly
  - [ ] Test: Update improvement action progress → reflected in UI
  - [ ] Test: Create new improvement action (future)
  - [ ] Test: Export to CSV → file downloaded with correct data
  - [ ] Command: `npm run test:e2e -- team-capabilities.spec.ts`
  - [ ] **Success Criteria:** ≥5 E2E tests passing, <2s page load

### Phase 2 Sign-off
- [ ] **2.13** Code review + approval
  - [ ] PR created and linked in GITHUB_LINKS
  - [ ] All Phase 1 tests still passing (regression check)
  - [ ] Phase 2 unit/E2E tests passing
  - [ ] No console warnings/errors
  - [ ] **Approval:** CEO approves Phase 2 completion

- [ ] **2.14** Deploy Phase 2 to Vercel
  - [ ] Merge PR to main
  - [ ] Vercel auto-deploy
  - [ ] Production URL: https://dsc-fms-portal.vercel.app/dashboard/team-capabilities
  - [ ] Verify: Page loads, both API endpoints working
  - [ ] **Success Criteria:** Page live, zero errors, API <2s response

---

## Phase 3: KPI Dashboard + Integration (2026-06-01~02)

### API Implementation
- [ ] **3.1** Verify GET /api/dashboard/team-kpis/summary
  - [ ] Already created in Phase 1 ✓
  - [ ] Ensure all 4 health metrics present (capability, utilization, completion, reliability)
  - [ ] Test: Returns correct trend direction (up, down, stable)
  - [ ] Test: Status field correct (above_target, on_track, below_target)
  - [ ] **Success Criteria:** All metrics present, status logic correct

- [ ] **3.2** Create GET /api/dashboard/team-kpis/trends endpoint
  - [ ] Handler: `/pages/api/dashboard/team-kpis/trends.ts`
  - [ ] Query capability_scores for last 30 days
  - [ ] Group by date, calculate avg/min/max for each dimension
  - [ ] Support ?dimension query param (technical, tasks, comms, learning, reliability, all)
  - [ ] Support ?period query param (7d, 30d, 90d)
  - [ ] Include target_line and benchmark line values
  - [ ] Test: ?dimension=technical → only technical scores
  - [ ] Test: ?period=7d → last 7 days data
  - [ ] Test: Returns {points: [{date, avg, min, max}], target_line, benchmark}
  - [ ] **Success Criteria:** Correct time range, aggregations accurate, <2s response

### React Components
- [ ] **3.3** Create <TeamKPIPage> page component
  - [ ] File: `/pages/dashboard/team-kpis.tsx`
  - [ ] Four sections: Health Summary (4-box grid) + Trends (5 line charts) + Radar chart + Action status
  - [ ] Fetch /api/dashboard/team-kpis/summary and /api/dashboard/team-kpis/trends
  - [ ] RefreshButton for manual refresh
  - [ ] Export report button (PDF/CSV)
  - [ ] Test: All 4 sections load
  - [ ] Test: Data populates correctly
  - [ ] **Success Criteria:** Page loads <3s, all data present

- [ ] **3.4** Create <HealthSummary> component (4-box grid)
  - [ ] File: `/components/dashboard/HealthSummary.tsx`
  - [ ] 4 boxes: Overall Capability, Team Utilization, Task Completion, Team Reliability
  - [ ] Each box: current value + target + trend (↑↓ ±X) + status badge
  - [ ] Colors: green (above target), yellow (on track), red (below target)
  - [ ] Click → navigate to detail page (capability detail, utilization detail, etc.)
  - [ ] Test: All 4 boxes display
  - [ ] Test: Trend direction correct
  - [ ] Test: Status colors match thresholds
  - [ ] **Success Criteria:** All boxes render, trend logic correct

- [ ] **3.5** Create <TrendLineChart> component
  - [ ] File: `/components/dashboard/TrendLineChart.tsx`
  - [ ] X-axis: Date (show every 5th day)
  - [ ] Y-axis: Score (0-100)
  - [ ] Blue line: average trend
  - [ ] Gray shaded area: min-max range
  - [ ] Dashed red line: target (if provided)
  - [ ] Dotted gray line: benchmark (if provided)
  - [ ] Tooltip on hover: show all values for that date
  - [ ] Test: Chart renders for each dimension
  - [ ] Test: Lines and areas visible
  - [ ] Test: Tooltip shows correct values on hover
  - [ ] **Success Criteria:** All charts render, tooltips work

- [ ] **3.6** Create <DimensionRadarChart> component
  - [ ] File: `/components/dashboard/DimensionRadarChart.tsx`
  - [ ] 5-point radar: technical, tasks, comms, learning, reliability
  - [ ] Blue polygon: current team profile
  - [ ] Red dashed polygon: target profile (if provided)
  - [ ] Gray dotted polygon: benchmark (if provided)
  - [ ] Legend: current, target, benchmark
  - [ ] Test: Radar renders with 5 points
  - [ ] Test: All polygons visible
  - [ ] Test: Legend correct
  - [ ] **Success Criteria:** Radar renders, all profiles visible

- [ ] **3.7** Create <ActionStatusChart> component
  - [ ] File: `/components/dashboard/ActionStatusChart.tsx`
  - [ ] Stacked bar chart: pending, in-progress, completed actions
  - [ ] Colors: gray (pending), blue (in-progress), green (completed)
  - [ ] Tooltip: show count for each status
  - [ ] Test: Bar displays with correct proportions
  - [ ] Test: Tooltip shows counts
  - [ ] **Success Criteria:** Chart renders correctly

### Integration & Navigation
- [ ] **3.8** Add navigation links between dashboard pages
  - [ ] Header: Dashboard > [Team Org | Capability Matrix | KPI Dashboard]
  - [ ] Breadcrumb links on all pages
  - [ ] Test: Click breadcrumb → navigate to correct page
  - [ ] Test: URL updates correctly
  - [ ] **Success Criteria:** Navigation working, URLs correct

- [ ] **3.9** Create main <Dashboard> router component
  - [ ] File: `/pages/dashboard.tsx` or `/pages/dashboard/index.tsx`
  - [ ] Route: /dashboard → redirect to /dashboard/team-org (default)
  - [ ] Implement route switching based on URL
  - [ ] Test: /dashboard → redirects to /dashboard/team-org
  - [ ] Test: /dashboard/team-capabilities → loads capability page
  - [ ] **Success Criteria:** Routing works, default route correct

### Styling & Responsiveness Phase 3
- [ ] **3.10** Apply Tailwind styling to KPI components
  - [ ] Health boxes: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
  - [ ] Trend charts: full-width, responsive height
  - [ ] Radar chart: centered, responsive size
  - [ ] Test: Desktop: 4-column box grid
  - [ ] Test: Tablet: 2-column grid
  - [ ] Test: Mobile: 1-column stack
  - [ ] **Success Criteria:** All breakpoints work

- [ ] **3.11** Optimize performance (code splitting, lazy loading)
  - [ ] Split dashboard into separate code chunks
  - [ ] Lazy-load chart libraries (recharts) on-demand
  - [ ] Image optimization: use Vercel Image Optimization
  - [ ] Test: Lighthouse score ≥90
  - [ ] Test: First paint <2s, interactive <3s
  - [ ] **Success Criteria:** Lighthouse scores green

### Testing Phase 3
- [ ] **3.12** Unit tests for KPI components
  - [ ] Test: <HealthSummary> renders all 4 boxes
  - [ ] Test: <TrendLineChart> renders for each dimension
  - [ ] Test: <DimensionRadar> renders 5-point radar
  - [ ] Test: <ActionStatusChart> shows correct proportions
  - [ ] Command: `npm run test -- --testPathPattern="dashboard/team-kpis"`
  - [ ] **Success Criteria:** ≥6 unit tests passing

- [ ] **3.13** Integration tests (full dashboard)
  - [ ] Test: Load KPI page → all sections visible
  - [ ] Test: Click health box → trend chart highlights that metric
  - [ ] Test: Refresh button → data re-fetches
  - [ ] Test: Navigation between all 3 pages works
  - [ ] Command: `npm run test:e2e -- dashboard.spec.ts`
  - [ ] **Success Criteria:** ≥6 E2E tests passing, <3s page load

- [ ] **3.14** Accessibility audit (WCAG AA)
  - [ ] axe-core scan: 0 critical, 0 serious issues
  - [ ] Keyboard navigation: Tab through all elements
  - [ ] Screen reader: All labels/descriptions present
  - [ ] Color contrast: ≥4.5:1 for all text
  - [ ] Chart accessibility: Provide data table fallback or aria-describedby
  - [ ] Test: WAVE browser extension check
  - [ ] **Success Criteria:** WCAG AA compliant, 0 warnings

- [ ] **3.15** Full regression testing (all phases)
  - [ ] Phase 1 tests: org chart still working
  - [ ] Phase 2 tests: capability matrix still working
  - [ ] Phase 3 tests: KPI dashboard working
  - [ ] Cross-phase: navigation between pages works
  - [ ] Command: `npm run test` (all tests)
  - [ ] **Success Criteria:** 20+ tests passing, zero failures

### Deployment & Launch
- [ ] **3.16** Create GitHub PR for Phase 3
  - [ ] Base branch: main
  - [ ] Title: "feat: Team Dashboard Phase 3 - KPI dashboard + integration"
  - [ ] Linked issues: TEAM_DASHBOARD_DESIGN_BRIEF.md
  - [ ] All tests passing
  - [ ] Code review approved
  - [ ] Changelog updated

- [ ] **3.17** Deploy to production
  - [ ] Merge PR to main
  - [ ] Vercel auto-deploy triggered
  - [ ] Wait for green status on Vercel dashboard
  - [ ] Test on production:
    - [ ] /dashboard/team-org loads
    - [ ] /dashboard/team-capabilities loads
    - [ ] /dashboard/team-kpis loads
    - [ ] All API endpoints respond <2s
  - [ ] Monitor Vercel logs for errors (24 hours post-deployment)
  - [ ] **Success Criteria:** All pages live, zero errors, APIs responsive

- [ ] **3.18** Update dashboard real-time monitoring
  - [ ] Add dashboard uptime check to CTB 5-minute polling
  - [ ] Add dashboard endpoint health check to Phase B monitoring
  - [ ] Add dashboard API response time tracking to Phase A logging
  - [ ] **Success Criteria:** Dashboard metrics in active_work_tracking.md

### Final Acceptance Criteria
- [ ] **3.19** Verify all design requirements met
  - [ ] ✅ All 3 pages implemented (team-org, team-capabilities, team-kpis)
  - [ ] ✅ 7+ components created and styled
  - [ ] ✅ 5+ API endpoints working (team-org, matrix, actions, summary, trends)
  - [ ] ✅ 4 database tables populated (team_members, capability_scores, improvement_actions, team_org_chart)
  - [ ] ✅ RLS policies enforced for all tables
  - [ ] ✅ Responsive design: desktop/tablet/mobile working
  - [ ] ✅ Performance: Lighthouse ≥90, page load <3s
  - [ ] ✅ Accessibility: WCAG AA compliant, 0 critical issues
  - [ ] ✅ All 20+ tests passing, zero failures

- [ ] **3.20** Final sign-off from CEO
  - [ ] Dashboard fully functional on production
  - [ ] All features working as designed
  - [ ] Team can access and use dashboard
  - [ ] Real-time updates working (hourly ISR refresh)
  - [ ] Export functionality working (CSV/PDF)
  - [ ] No critical bugs or blockers
  - [ ] **Status:** ✅ TEAM DASHBOARD COMPLETE & DEPLOYED

---

## Estimated Timeline

| Phase | Duration | Dates | Deliverables |
|-------|----------|-------|--------------|
| **Phase 1** | 2 days | 2026-05-27~28 | Org chart + 5 API endpoints |
| **Phase 2** | 2 days | 2026-05-29~30 | Capability matrix + improvements |
| **Phase 3** | 2 days | 2026-06-01~02 | KPI dashboard + integration |
| **Testing** | 1 day | 2026-06-03 | Full regression + deployment |
| **Total** | ~7 days | 2026-05-27~06-03 | Production deployment |

---

## Blocking Dependencies

**Must Complete Before Starting Phase 1:**
- ✅ Database schema (db/41_team_dashboard_schema.sql) — READY
- ✅ API contract finalized (TEAM_DASHBOARD_API_GUIDE.md) — READY
- ✅ Design document approved (TEAM_DASHBOARD_DESIGN.md) — READY
- ✅ TypeScript types defined — READY

**Must Complete Before Launching to Production:**
- ✅ All Phase 1 tests passing
- ✅ All Phase 2 tests passing
- ✅ All Phase 3 tests passing
- ✅ Performance audit (Lighthouse ≥90)
- ✅ Accessibility audit (WCAG AA)
- ✅ Security review (RLS policies)
- ⏳ CEO approval of final dashboard

---

## Known Constraints

1. **Real-time Updates:** Improvement actions use ISR 1-hour caching (not real-time); UI updates on refresh
2. **Mobile Rendering:** Org chart uses stacked layout on mobile (no tree visualization)
3. **Access Control:** All-or-nothing by role (no granular field-level permissions)
4. **Data History:** Only 30 days of trend data stored (older data purged automatically)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | <3s | Lighthouse metric |
| API Response Time | <2s | /api/dashboard endpoint response |
| Test Coverage | ≥80% | Jest coverage report |
| Accessibility | WCAG AA | axe-core scan |
| Performance | Lighthouse ≥90 | Lighthouse audit |
| Uptime | 99.9% | Vercel uptime monitor |
| Team Adoption | 100% | All 15 team members can access |

---

## Contacts & Escalation

**Team Dashboard Owner:** CEO (primary)  
**Technical Lead:** Web-Builder Agent  
**Database Admin:** Backend Expert  
**QA:** QA Expert  
**Escalation:** If any phase blocked >2 hours, notify CEO immediately

---

**Status:** ✅ **READY FOR WEB-BUILDER IMPLEMENTATION**  
**Approval Date:** 2026-05-26  
**Implementation Start:** 2026-05-27  
**Expected Completion:** 2026-06-03  
**Last Updated:** 2026-05-26 18:50 KST

**Next Steps:**
1. Web-Builder reviews TEAM_DASHBOARD_DESIGN.md, API_GUIDE.md, DB_SCHEMA.sql
2. CEO confirms timeline and blockers
3. Start Phase 1 on 2026-05-27 morning
4. Daily progress updates to active_work_tracking.md
5. Deployment to production by 2026-06-03
