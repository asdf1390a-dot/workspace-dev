# Team Dashboard Design Specification v1.0
**Status:** ✅ Design Complete (2026-05-26)  
**Target Users:** CEO, Team Leads, Operational Core  
**Stack:** Next.js 14 + React 18 + Tailwind CSS + Supabase PostgreSQL  
**Deployment:** Vercel ISR (Incremental Static Regeneration)

---

## 1. Overview & Objectives

The Team Dashboard provides real-time visibility into organizational structure, individual capability development, and team performance metrics across the 15-person AI team.

**Primary Objectives:**
- Real-time org chart visualization with hierarchical project assignments
- Individual capability scoring across 5 dimensions (technical, task achievement, communication, learning speed, reliability)
- Automated improvement action tracking and status monitoring
- Team KPI aggregation for leadership decision-making
- Hourly auto-update (on the hour KST) via Vercel ISR

**Access Control:**
- CEO: Full visibility (org chart + all metrics + actions)
- Team Leads: Team members + own assigned projects (filtered view)
- Operational Core: View-only capability trends (no sensitive org data)

---

## 2. Page Architecture

### Page 1: `/dashboard/team-org`
**Name:** Team Organization Chart  
**Route:** `/pages/dashboard/team-org.tsx`  
**Cache:** ISR revalidate=3600 (1 hour)  
**Access:** CEO only  

**Purpose:** Hierarchical visualization of organizational structure with real-time assignment tracking.

**Components:**
```
<TeamOrgPage>
  ├── <PageHeader title="Team Organization" icon="GitBranch" />
  ├── <FilterBar role="ceo" />
  ├── <OrgChartContainer>
  │   ├── <TreeNode id="ceo" type="role" level={0}>
  │   │   ├── <TreeNode id="ops-lead" type="role" level={1}>
  │   │   │   ├── <TeamMemberCard id="agent-1" />
  │   │   │   ├── <TeamMemberCard id="agent-2" />
  │   │   │   └── <TreeNode id="project-1" type="project" level={2} />
  │   │   ├── <TreeNode id="project-lead-1" type="role" level={1}>
  │   │   │   └── <TreeNode id="project-2" type="project" level={2} />
  ├── <LegendBox roles={["CEO", "Ops Core", "Project Lead", "Team Member"]} />
  └── <ExportButton format="png|pdf" />
```

**Data Flow:**
```
GET /api/dashboard/team-org/structure
└─> Response: {
      org_chart: [OrgNode],
      members: [TeamMember],
      projects: [ProjectAssignment],
      updated_at: ISO8601
    }
```

**Visual Design:**

**Colors by Role:**
- 🔴 CEO: #DC2626 (red-600) background + white text
- 🟠 Ops Core: #EA580C (orange-600) background + white text
- 🟡 Project Lead: #FBBF24 (amber-400) background + dark text
- 🟢 Team Member: #10B981 (emerald-500) background + white text
- 🔵 Project Node: #3B82F6 (blue-500) background + white text

**Card Layout (TreeNode):**
```
┌─────────────────────────────┐
│ [Icon] Role/Name (Status)   │
│ Current Project: [Project]  │
│ Capability Score: 87/100    │
│ Reliability: 🟢 95%         │
└─────────────────────────────┘
```

**Status Badges:**
- 🟢 Active: green-50 background, text-green-700
- 🟡 On Leave: yellow-50 background, text-yellow-700
- 🔴 On Blocker: red-50 background, text-red-700

---

### Page 2: `/dashboard/team-capabilities`
**Name:** Team Capability Matrix  
**Route:** `/pages/dashboard/team-capabilities.tsx`  
**Cache:** ISR revalidate=3600 (1 hour)  
**Access:** CEO, Team Leads (filtered)

**Purpose:** Detailed capability scoring and improvement tracking across 5 dimensions.

**5 Capability Dimensions:**
1. **Technical Competency** (0-100): Language proficiency, tool mastery, problem-solving
2. **Task Achievement** (0-100): On-time delivery, completeness, quality
3. **Communication** (0-100): Clarity, responsiveness, documentation
4. **Learning Speed** (0-100): Skill acquisition, adaptation, feedback integration
5. **Reliability** (0-100): Consistency, dependency, error-free execution

**Components:**
```
<CapabilityPage>
  ├── <PageHeader title="Team Capability Matrix" />
  ├── <FilterBar dimensions={[5]} teams={[list]} />
  ├── <CapabilityMatrixView>
  │   ├── <MatrixTable
  │   │   rows={[TeamMember]}
  │   │   cols={[5 dimensions]}
  │   │   cells={<CapabilityCell value={0-100} trend="↑↓" />}
  │   │   />
  │   ├── <DimensionBreakdown dim="technical">
  │   │   └── <BarChart data={[{name, score, target}]} />
  │   └── <SparklineCompare dimension="learning_speed" period="30d" />
  ├── <ImprovementActionsPanel>
  │   └── <ActionCard status="pending|in_progress|completed" />
  └── <ExportButton format="csv|pdf" />
```

**Matrix View Structure:**
```
┌────────────────┬──────────┬─────────┬───────────┬──────────┬────────────┐
│ Team Member    │ Technical│ Tasks   │ Comms     │ Learning │ Reliability│
├────────────────┼──────────┼─────────┼───────────┼──────────┼────────────┤
│ Agent-1 (Web)  │   92     │   88    │    85     │    90    │     95     │
│ Agent-2 (API)  │   87     │   92    │    79     │    88    │     92     │
│ Agent-3 (DB)   │   95     │   89    │    82     │    94    │     96     │
│ Agent-4 (QA)   │   81     │   95    │    88     │    86    │     98     │
│ [+5 more]      │   ...    │   ...   │   ...     │   ...    │    ...     │
└────────────────┴──────────┴─────────┴───────────┴──────────┴────────────┘
```

**Cell Color Coding:**
- 🟢 90-100: green-100 bg, green-900 text
- 🟡 70-89: yellow-100 bg, yellow-900 text
- 🔴 50-69: orange-100 bg, orange-900 text
- 🔴 0-49: red-100 bg, red-900 text

**Improvement Actions Panel:**
Each action card displays:
```
┌──────────────────────────────────────────────┐
│ [Status Badge] Action Title (Owner)          │
│ Dimension: Technical Competency              │
│ Target Score: 92 (Current: 87)               │
│ Progress: ████████░░ 80% (Due: 2026-06-15)  │
│ Last Update: 2 hours ago                     │
│ [View Details] [Edit]                        │
└──────────────────────────────────────────────┘
```

**Data Flow:**
```
GET /api/dashboard/team-capabilities/matrix
└─> Response: {
      members: [{id, name, role, scores: {technical, tasks, comms, learning, reliability}}],
      timestamp: ISO8601
    }

GET /api/dashboard/team-capabilities/improvement-actions
└─> Response: {
      actions: [{id, owner_id, dimension, current_score, target_score, progress, status, due_date}],
      updated_at: ISO8601
    }
```

---

### Page 3: `/dashboard/team-kpis`
**Name:** Team KPI Dashboard  
**Route:** `/pages/dashboard/team-kpis.tsx`  
**Cache:** ISR revalidate=3600 (1 hour)  
**Access:** CEO, Team Leads

**Purpose:** Aggregate team performance metrics and trend analysis.

**KPI Components:**

**Section 1: Overall Team Health (4-box grid)**
```
┌──────────────────┐  ┌──────────────────┐
│ Avg Capability   │  │ Team Utilization │
│      88.5/100    │  │      87%          │
│ 🟢 +2.3 vs 7d    │  │ 🟡 -3% vs 7d     │
└──────────────────┘  └──────────────────┘
┌──────────────────┐  ┌──────────────────┐
│ Task Completion  │  │ Team Reliability │
│      94%         │  │      95.2%       │
│ 🟢 +1% vs target │  │ 🟢 +0.5% vs 7d   │
└──────────────────┘  └──────────────────┘
```

**Section 2: Dimension Trends (5 line charts, 30-day history)**
```
<LineChart
  title="Learning Speed Trend (30 days)"
  data={[{date, avg_score, min, max, target_line}]}
  yAxis={{min: 0, max: 100}}
  tooltip="Show individual contributors on hover"
/>
```

**Section 3: Team Distribution (Radar chart)**
- 5-point radar showing team capability profile
- Target line overlay (external benchmark)
- Benchmark comparison (vs industry average)

**Section 4: Improvement Action Status (stacked bar)**
```
┌─────────────────────────────────────────────┐
│ Improvement Action Status                   │
├─────────────────────────────────────────────┤
│ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ 12 Completed
│ ░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ 7 In Progress
│ ░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ 8 Pending
└─────────────────────────────────────────────┘
```

**Components:**
```
<TeamKPIPage>
  ├── <PageHeader title="Team KPI Dashboard" />
  ├── <HealthSummary
  │   status={[capability, utilization, completion, reliability]}
  │   />
  ├── <TrendCharts
  │   dimensions={[technical, tasks, comms, learning, reliability]}
  │   period="30d"
  │   />
  ├── <DimensionRadar
  │   current={[scores]}
  │   target={[benchmarks]}
  │   />
  ├── <ActionStatusChart
  │   status_distribution={[completed, in_progress, pending]}
  │   />
  └── <ExportReport format="pdf|csv" />
```

**Data Flow:**
```
GET /api/dashboard/team-kpis/summary
└─> Response: {
      health: {capability, utilization, completion, reliability},
      trends: {technical, tasks, comms, learning, reliability},
      timestamp: ISO8601
    }

GET /api/dashboard/team-kpis/trends?period=30d&dimension=technical
└─> Response: {
      points: [{date, avg_score, min, max}],
      target_line: number,
      benchmark: number
    }
```

---

## 3. Data Model & State Management

### React Context Architecture

```typescript
// contexts/TeamDashboardContext.tsx
interface OrgNode {
  id: string;
  name: string;
  role: "ceo" | "ops-core" | "project-lead" | "team-member";
  status: "active" | "on-leave" | "blocked";
  assignedProject?: string;
  capabilityScore: number;
  reliability: number;
  children?: OrgNode[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  joinDate: ISO8601;
  capabilities: {
    technical: number;
    tasks: number;
    comms: number;
    learning: number;
    reliability: number;
  };
  currentProject?: string;
  overallScore: number;
  status: "active" | "on-leave" | "blocked";
  improvementActions: string[];
}

interface ImprovementAction {
  id: string;
  ownerId: string;
  dimension: "technical" | "tasks" | "comms" | "learning" | "reliability";
  title: string;
  description: string;
  currentScore: number;
  targetScore: number;
  progress: number; // 0-100
  status: "pending" | "in_progress" | "completed";
  dueDate: ISO8601;
  lastUpdated: ISO8601;
  notes: string[];
}

interface TeamDashboardState {
  orgChart: OrgNode[];
  members: TeamMember[];
  improvementActions: ImprovementAction[];
  selectedMemberId?: string;
  selectedDimension?: string;
  filterRole?: string;
  filterStatus?: string;
  isLoading: boolean;
  error?: string;
  lastUpdate: ISO8601;
}

// Reducer actions
type TeamDashboardAction = 
  | { type: "SET_ORG_CHART"; payload: OrgNode[] }
  | { type: "SET_MEMBERS"; payload: TeamMember[] }
  | { type: "SET_IMPROVEMENT_ACTIONS"; payload: ImprovementAction[] }
  | { type: "SELECT_MEMBER"; payload: string }
  | { type: "SET_FILTER"; payload: {role?: string; status?: string} }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "REFRESH_DATA"; payload: Timestamp };
```

### State Management: Context + useReducer

**Why Context API instead of Zustand:**
- Dashboard data is hierarchical (org tree with nested updates)
- Page-level state management reduces prop drilling
- Easier integration with ISR cache invalidation
- Built-in React Suspense support for async data loading

**Refresh Strategy:**
- Auto-refresh every 60 minutes (on the hour KST)
- Manual refresh via RefreshButton
- Real-time updates via Supabase live subscriptions (for improvement action status changes)
- ISR revalidation on every data mutation (team_members, capability_scores, improvement_actions insert/update)

---

## 4. Component Hierarchy

### Core Components

#### 4.1 `<OrgChartRenderer>`
Recursive tree visualization for org hierarchy.

```typescript
interface OrgChartRendererProps {
  nodes: OrgNode[];
  selectedNodeId?: string;
  onNodeSelect: (nodeId: string) => void;
  expandLevel?: number; // Expand tree to this depth
}

// Renders:
// - Node card with role badge + name + current project
// - Status indicator (active/on-leave/blocked)
// - Capability score bar (0-100)
// - Child nodes indented by 2 levels
// - Expand/collapse toggle for each parent
```

**HTML Structure:**
```html
<div class="org-chart">
  <div class="tree-node level-0 role-ceo">
    <div class="node-card">
      <span class="icon">👑</span>
      <h3>CEO (Founder)</h3>
      <span class="capability-badge">88/100</span>
    </div>
    <div class="node-children">
      <!-- Child nodes -->
    </div>
  </div>
</div>
```

---

#### 4.2 `<CapabilityMatrixTable>`
Data grid showing capability scores for all team members.

```typescript
interface CapabilityMatrixTableProps {
  members: TeamMember[];
  sortBy?: keyof TeamMember["capabilities"] | "name";
  direction?: "asc" | "desc";
  onCellClick?: (memberId: string, dimension: string) => void;
}

// Features:
// - Sortable columns (click header to sort)
// - Color-coded cells (90-100: green, 70-89: yellow, 50-69: orange, 0-49: red)
// - Hover tooltip shows trend: ↑↓ ±X vs 7 days
// - Sparkline on hover (7-day history chart)
// - Export to CSV button
```

---

#### 4.3 `<ImprovementActionCard>`
Individual improvement action display with progress tracking.

```typescript
interface ImprovementActionCardProps {
  action: ImprovementAction;
  onUpdate?: (action: ImprovementAction) => Promise<void>;
  isEditable?: boolean;
}

// Layout:
// - Header: [Status Badge] Title (Owner)
// - Body: Dimension + Current/Target scores
// - Progress bar with % display
// - Due date + time remaining
// - Action buttons: [View Details] [Edit]
```

---

#### 4.4 `<TrendLineChart>`
Line chart for 30-day capability dimension trends.

```typescript
interface TrendLineChartProps {
  dimension: "technical" | "tasks" | "comms" | "learning" | "reliability";
  data: Array<{date: ISO8601; avg: number; min: number; max: number}>;
  targetLine?: number;
  benchmark?: number;
  onPointHover?: (data: TrendPoint) => void;
}

// Features:
// - X-axis: Date (every 5 days labeled)
// - Y-axis: Score (0-100)
// - Shaded area between min/max
// - Target line (dashed, labeled)
// - Benchmark line (dotted, labeled)
// - Tooltip on hover shows individual contributors
```

---

#### 4.5 `<DimensionRadarChart>`
5-point radar chart showing team capability profile.

```typescript
interface DimensionRadarChartProps {
  current: [number, number, number, number, number]; // [technical, tasks, comms, learning, reliability]
  target?: [number, number, number, number, number];
  benchmark?: [number, number, number, number, number];
}

// Features:
// - 5-point star with labeled axes
// - Filled polygon for current profile
// - Target line overlay (dashed)
// - Benchmark comparison (dotted, labeled)
```

---

## 5. API Integration Points

### API Endpoints Called from Dashboard

**Endpoint 1: Get Org Chart Structure**
```
GET /api/dashboard/team-org/structure
Response:
{
  "org_chart": [OrgNode],
  "members": [TeamMember],
  "projects": [{id, name, status, lead_id}],
  "updated_at": ISO8601,
  "cache_control": "max-age=3600"
}
```

**Endpoint 2: Get Capability Matrix**
```
GET /api/dashboard/team-capabilities/matrix
Query params: ?period=30d&dimension=technical|all

Response:
{
  "members": [{
    "id": string,
    "name": string,
    "capabilities": {technical, tasks, comms, learning, reliability},
    "trends": {technical: [↑↓ ±X], ...}
  }],
  "timestamp": ISO8601
}
```

**Endpoint 3: Get Improvement Actions**
```
GET /api/dashboard/team-capabilities/improvement-actions
Query params: ?filter=pending|in_progress|completed&owner_id=optional

Response:
{
  "actions": [ImprovementAction],
  "stats": {pending_count, in_progress_count, completed_count},
  "updated_at": ISO8601
}
```

**Endpoint 4: Update Improvement Action**
```
POST /api/dashboard/team-capabilities/improvement-actions/:id
Body: {
  progress: number (0-100),
  status: string,
  notes: string[],
  last_updated: ISO8601
}

Response:
{
  "success": bool,
  "action": ImprovementAction,
  "cache_invalidated": bool
}
```

**Endpoint 5: Get Team KPI Trends**
```
GET /api/dashboard/team-kpis/trends
Query params: ?period=30d&dimension=technical|all

Response:
{
  "data": [{date, avg_score, min, max}],
  "target_line": number,
  "benchmark": number,
  "timestamp": ISO8601
}
```

---

## 6. Styling & Responsive Design

### Design System Reference
Use `design_system_ai_team_dashboard.md` for complete color palette, typography, and spacing.

**Key Colors:**
- Primary: #0F172A (slate-900)
- Success: #22C55E (green-500)
- Warning: #FBBD24 (amber-400)
- Danger: #EF4444 (red-500)
- Info: #3B82F6 (blue-500)
- Borders: #E2E8F0 (slate-200)

**Breakpoints:**
- Desktop: ≥1024px (3-column layout)
- Tablet: 768-1023px (2-column layout)
- Mobile: <768px (1-column, stack vertically)

**Tailwind Classes (Examples):**
```
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="bg-white rounded-lg shadow-md p-6 border border-slate-200">
    <h3 class="text-lg font-semibold text-slate-900">Title</h3>
    <p class="text-sm text-slate-600 mt-2">Subtitle</p>
  </div>
</div>
```

**Animations:**
- Fade in on page load: `fade-in 300ms ease-in-out`
- Hover transitions: `transition all 200ms ease-in-out`
- Expand/collapse tree nodes: `max-height 300ms ease-in-out`

---

## 7. Implementation Phases

### Phase 1: Team Org Chart (Week 1, 2026-05-27~28)
**Deliverables:**
- team_members table schema + RLS policies
- GET /api/dashboard/team-org/structure endpoint
- <OrgChartRenderer> component
- <TeamMemberCard> component
- <PageHeader> and <FilterBar> components
- Styling with Tailwind (desktop + tablet)
- Unit tests for org chart rendering
- E2E test: Org chart loads + renders all members

**Success Criteria:**
- Org chart renders correctly for all 15 team members
- Expand/collapse works for team leads
- No console warnings/errors
- Load time <2s on Vercel
- Mobile rendering acceptable (stacked view)

---

### Phase 2: Capability Matrix + Improvements (Week 2, 2026-05-29~31)
**Deliverables:**
- capability_scores table schema + RLS policies
- improvement_actions table schema + RLS policies
- GET /api/dashboard/team-capabilities/matrix endpoint
- GET /api/dashboard/team-capabilities/improvement-actions endpoint
- POST /api/dashboard/team-capabilities/improvement-actions/:id endpoint
- <CapabilityMatrixTable> component
- <ImprovementActionCard> component
- <ImprovementActionsPanel> component
- Color-coded cell rendering
- Export to CSV functionality
- Unit tests for all endpoints
- E2E test: Matrix loads, updates, exports

**Success Criteria:**
- Matrix displays all 15 members × 5 dimensions
- Sorting works (name, each dimension)
- Color coding matches 4-tier scale
- Update action progress returns 200 response
- CSV export contains all data
- Load time <2s on Vercel

---

### Phase 3: KPI Dashboard + Integration (2026-06-01~02)
**Deliverables:**
- GET /api/dashboard/team-kpis/summary endpoint
- GET /api/dashboard/team-kpis/trends endpoint
- <HealthSummary> component (4-box grid)
- <TrendLineChart> component (using Recharts)
- <DimensionRadar> component (using Recharts)
- <ActionStatusChart> component
- <PageHeader> navigation links
- Responsive layout for all breakpoints
- ISR caching configuration
- Performance optimization (image lazy-loading, code splitting)
- WCAG AA accessibility audit
- Final E2E test suite
- Production deployment to Vercel

**Success Criteria:**
- All KPI pages load within <3s
- Charts render correctly on desktop/tablet/mobile
- Accessibility: WCAG AA compliant
- 95%+ Lighthouse performance score
- Zero accessibility warnings
- All tests passing

---

## 8. Data Update Schedule

**Auto-Update Frequency:**
- Org Chart: Every 60 minutes (on the hour KST, 00:00, 01:00, ..., 23:00)
- Capability Scores: Every 60 minutes (on the hour KST)
- Improvement Actions: Every 30 minutes (00:30, 01:00, 01:30, ..., 23:30) + real-time subscriptions for status changes
- KPI Trends: Every 60 minutes (on the hour KST)

**Revalidation Triggers:**
- Manual refresh button (immediate)
- Supabase insert/update on team_members, capability_scores, improvement_actions, team_org_chart
- GitHub Actions deployment (team changes trigger revalidation)

**Cache Strategy:**
- ISR revalidate=3600 (1 hour) for all pages
- Background revalidation enabled
- Fallback page shown during regeneration

---

## 9. Error Handling & Loading States

**Loading States:**
- Page skeleton loading: Gray placeholder boxes with pulse animation
- Data fetch timeout: 30 seconds max, fall back to cached data
- Failed API call: Retry up to 3 times with exponential backoff
- No data: Show empty state with help text

**Error Messages:**
```
Error loading org chart:
"Failed to fetch team organization. Please refresh the page."
[Retry] [Report Issue]
```

**Fallback Strategies:**
- If real-time API fails, use cached data (up to 1 hour old)
- If trend data unavailable, show "No data available" message
- If org chart fails, show text-only member list

---

## 10. Testing Strategy

### Unit Tests
- OrgChartRenderer: Correct tree structure rendering
- CapabilityMatrixTable: Correct sorting, filtering, color coding
- ImprovementActionCard: Status transitions, progress updates
- API endpoints: Correct response schema, error handling

### Integration Tests
- Org chart → Member card click → Navigate to capability detail page
- Update capability score → Dashboard refreshes automatically
- Complete improvement action → Appears in completed section

### E2E Tests (Playwright)
1. Load org chart page → All members visible
2. Expand team lead → Children appear + collapse works
3. Click member → Capability detail modal opens
4. Update capability → Dashboard reflected after refresh
5. Export to CSV → File contains correct data
6. Mobile responsive → Layout adapts correctly

### Performance Tests
- Org chart render: <2s (Lighthouse)
- Capability matrix render: <2s with 15 members × 5 dimensions
- Chart render: <1s for 30-day trend
- Overall page: <3s

### Accessibility Tests
- WCAG AA compliant (axe-core)
- Keyboard navigation: Tab through all interactive elements
- Screen reader: All elements have proper aria labels
- Color contrast: ≥4.5:1 for text

---

## 11. File Structure

```
pages/
  └── dashboard/
      ├── team-org.tsx           # Team organization chart page
      ├── team-capabilities.tsx  # Capability matrix + improvements
      └── team-kpis.tsx          # KPI dashboard

api/
  └── dashboard/
      ├── team-org/
      │   └── structure.ts       # GET /api/dashboard/team-org/structure
      ├── team-capabilities/
      │   ├── matrix.ts          # GET capability matrix
      │   └── improvement-actions.ts # GET/POST improvement actions
      └── team-kpis/
          ├── summary.ts         # GET /api/dashboard/team-kpis/summary
          └── trends.ts          # GET /api/dashboard/team-kpis/trends

components/
  └── dashboard/
      ├── OrgChartRenderer.tsx
      ├── TeamMemberCard.tsx
      ├── CapabilityMatrixTable.tsx
      ├── ImprovementActionCard.tsx
      ├── ImprovementActionsPanel.tsx
      ├── TrendLineChart.tsx
      ├── DimensionRadar.tsx
      ├── HealthSummary.tsx
      ├── FilterBar.tsx
      ├── PageHeader.tsx
      └── RefreshButton.tsx

lib/
  └── dashboard/
      ├── hooks.ts               # useTeamDashboard, useTrendData
      ├── api-client.ts          # Dashboard API calls
      └── types.ts               # TypeScript interfaces

styles/
  └── dashboard.module.css       # Scoped dashboard styles

db/migrations/
  ├── 37_team_members_table.sql
  ├── 38_capability_scores_table.sql
  ├── 39_improvement_actions_table.sql
  └── 40_team_org_chart_table.sql
```

---

## 12. Known Constraints & Decisions

**Constraint 1: Real-time Updates via Polling**
- Supabase real-time subscriptions used for improvement action status changes only
- Org chart and capability scores use ISR caching (1-hour refresh)
- Rationale: Org changes are less frequent; capability scores typically updated daily

**Constraint 2: Mobile Rendering**
- Team org chart stacks vertically on mobile (no horizontal tree layout)
- Capability matrix scrolls horizontally (table not wrapped)
- Rationale: Simplifies mobile UX; full org chart better viewed on desktop

**Constraint 3: Access Control**
- No granular field-level permissions (all-or-nothing: CEO vs Team Lead vs Member)
- Rationale: Simpler Supabase RLS policy implementation; sufficient for initial release

**Constraint 4: Performance Optimization**
- Image optimization via Vercel Image Optimization
- CSS-in-JS disabled (use Tailwind only)
- Rationale: Faster build time, simpler debugging, better performance

---

## 13. Acceptance Criteria

**Team Dashboard Design COMPLETE when:**
- ✅ All 3 pages fully designed (Org Chart, Capabilities, KPIs)
- ✅ React component hierarchy documented with PropTypes
- ✅ All 5 API endpoints specified with request/response schemas
- ✅ 4 DB tables specified (team_members, capability_scores, improvement_actions, team_org_chart)
- ✅ Styling guide with color palette, spacing, typography
- ✅ Responsive design for desktop/tablet/mobile specified
- ✅ Implementation phases with success criteria documented
- ✅ Testing strategy (unit, integration, E2E, performance, accessibility)

**Web-Builder Ready when:**
- ✅ Approval from CEO (user) on this design document
- ✅ TEAM_DASHBOARD_API_GUIDE.md finalized
- ✅ TEAM_DASHBOARD_DB_SCHEMA.sql reviewed
- ✅ TEAM_DASHBOARD_CHECKLIST.md completed

**Status: ✅ READY FOR WEB-BUILDER IMPLEMENTATION (2026-05-28 Phase 1 start)**

---

**Last Updated:** 2026-05-26 18:30 KST  
**Next Document:** TEAM_DASHBOARD_API_GUIDE.md (in progress)  
**For Questions:** Contact CEO via active_work_tracking.md
