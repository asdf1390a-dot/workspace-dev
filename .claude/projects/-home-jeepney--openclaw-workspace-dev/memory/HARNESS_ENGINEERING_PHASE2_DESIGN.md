---
name: Harness Engineering Phase 2 Design
description: Standardized design for production scheduling/maintenance validation UI + APIs — matches Dashboard-P2 Phase 3 ecosystem patterns
type: project
date: 2026-05-27
---

# 🚀 Harness Engineering Phase 2 Design — Production Scheduling & Maintenance Validation

**Status:** ✅ Design Complete (2026-05-27)  
**Ecosystem Integration:** Dashboard-P2 Phase 3 + Team Dashboard P2B patterns  
**Target Deployment:** Vercel auto-deploy on main commit  
**Test Coverage Target:** 80%+  

---

## 📋 Phase 2 Scope: 4 Pages + 12 API Endpoints

### Page 1: Production Schedule Manager
**Route:** `/app/harness/production-schedules/page.tsx`

**Components:**
- `ScheduleListContainer` — Main page wrapper with SWR polling (30s refreshInterval)
- `ScheduleFilterBar` — Filter by facility_id, shift, date range, status (pending/active/completed)
- `ScheduleTable` — Paginated table (10 per page) with inline actions
- `ScheduleCard` — Mobile-optimized card view (alternate layout)
- `CreateScheduleModal` — Form for ProductionSchedule input (Zod validation)
- `ScheduleDetailDrawer` — Side panel with full details + edit form
- `ConflictBadge` — Visual indicator if maintenance conflicts detected

**Data Shape:**
```typescript
interface ScheduleRow {
  id: string;
  facility_id: string;
  scheduled_date: string;
  shift: 'A' | 'B' | 'C';
  target_quantity: number;
  asset_count: number;
  planned_downtime_minutes: number;
  conflict_status: 'none' | 'warning' | 'critical';
  status: 'pending' | 'active' | 'completed';
  created_by: string;
  created_at: string;
}
```

**Mobile Adaptations:**
- 44px tap targets on action buttons
- Stacked filter layout (vertical)
- Card-based table on mobile
- Date picker with native input on mobile
- Horizontal scroll for wide tables

---

### Page 2: Maintenance Plan Manager
**Route:** `/app/harness/maintenance-plans/page.tsx`

**Components:**
- `MaintenancePlanContainer` — Main page with SWR polling (30s)
- `PlanFilterBar` — Filter by asset_id, maintenance_type (preventive/corrective/predictive), priority, status
- `PlanTimeline` — Gantt-style visualization (Recharts Area/Bar chart)
- `PlanTable` — Sortable table with duration, priority, team_id
- `CreatePlanModal` — Form for MaintenancePlan input
- `PlanImpactPreview` — Shows scope (single/area/facility) with affected assets count
- `UpcomingMaintenanceAlert` — Alert component for plans in next 7 days

**Data Shape:**
```typescript
interface MaintenancePlanRow {
  id: string;
  asset_id: string;
  asset_name: string;
  maintenance_type: 'preventive' | 'corrective' | 'predictive';
  scheduled_start: string;
  duration_minutes: number;
  priority: 'high' | 'medium' | 'low';
  maintenance_team_id: string;
  required_downtime: boolean;
  impact_scope: 'single' | 'area' | 'facility';
  status: 'pending' | 'in_progress' | 'completed';
  created_by: string;
  created_at: string;
}
```

---

### Page 3: Conflict Detection & Validation Engine
**Route:** `/app/harness/validation-results/page.tsx`

**Components:**
- `ValidationDashboard` — Main container with conflict summary + recent validations
- `ConflictMetrics` — 4 KPI cards: total_conflicts, critical_count, validation_coverage, avg_validation_time_ms
- `ConflictBreakdown` — Pie/Bar chart (Recharts) by conflict type (time_overlap, resource_contention, capacity_exceeded)
- `ValidationQueue` — Table of pending validations (status: pending/validated/error)
- `ConflictDetail` — Expandable rows showing:
  - Conflict type + severity
  - Affected assets (linked to Asset Master)
  - Recommendations from engine
  - Retry button + retry history
- `ManualValidation` — Form to submit custom validation request (production_schedule + maintenance_plan selection)

**Data Shape:**
```typescript
interface ValidationResult {
  id: string;
  request_id: string;
  production_schedule_id: string;
  maintenance_plan_id: string;
  status: 'valid' | 'conflict' | 'warning' | 'error';
  conflicts: Array<{
    type: 'time_overlap' | 'resource_contention' | 'capacity_exceeded';
    severity: 'critical' | 'warning';
    details: string;
    affected_assets: string[];
  }>;
  recommendations: string[];
  validation_duration_ms: number;
  validated_at: string;
  retry_count: number;
  next_retry_at?: string;
}
```

---

### Page 4: Audit Log Viewer
**Route:** `/app/harness/audit-logs/page.tsx`

**Components:**
- `AuditLogContainer` — Main page with SWR polling (60s for logs)
- `LogFilterBar` — Filter by event_type, status (success/failure), request_source (web/api/cron), date range
- `LogTimeline` — Vertical timeline showing request → validation → completion flow
- `LogTable` — Detailed table with:
  - Event sequence (request_received → validation_started → validation_completed → conflict_detected → retry_scheduled → retry_executed)
  - Status badges (success/failure)
  - Error code + message (if failed)
  - Retry count + next_retry_at
- `ErrorAnalysis` — Pie/Bar chart of error_code distribution + frequency
- `LogDetail` — Modal showing full metadata (request_source, user_agent, ip_address)

**Data Shape:**
```typescript
interface AuditLogRow {
  id: string;
  request_id: string;
  response_id?: string;
  event_type: 'request_received' | 'validation_started' | 'validation_completed' | 'conflict_detected' | 'retry_scheduled' | 'retry_executed';
  status: 'success' | 'failure';
  error_code?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: string;
  request_source?: 'web' | 'api' | 'cron';
  created_at: string;
  duration_ms?: number;
}
```

---

## 🔗 API Endpoints (12 total)

### Production Schedules (4 endpoints)
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/harness/production-schedules` | List with pagination, filters, sorting |
| POST | `/api/harness/production-schedules` | Create new schedule + trigger validation |
| GET | `/api/harness/production-schedules/[id]` | Get schedule detail |
| PATCH | `/api/harness/production-schedules/[id]` | Update schedule (reschedule if needed) |
| DELETE | `/api/harness/production-schedules/[id]` | Soft delete schedule |

### Maintenance Plans (4 endpoints)
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/harness/maintenance-plans` | List with pagination, filters, sorting |
| POST | `/api/harness/maintenance-plans` | Create new plan + trigger validation |
| GET | `/api/harness/maintenance-plans/[id]` | Get plan detail |
| PATCH | `/api/harness/maintenance-plans/[id]` | Update plan (reschedule if needed) |
| DELETE | `/api/harness/maintenance-plans/[id]` | Soft delete plan |

### Validation & Conflict Detection (3 endpoints)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/harness/validate` | Submit validation request (production_schedule + maintenance_plan) |
| GET | `/api/harness/validation-results` | List validation results with pagination + filters |
| GET | `/api/harness/validation-results/[requestId]` | Get specific validation result + audit trail |

### Audit Logs (1 endpoint)
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/harness/audit-logs` | List audit logs with pagination + filters |

---

## 🎯 Shared Utilities & Hooks

### Hooks (Supabase + SWR)
```typescript
// apps/harness/hooks/useSchedules.ts
export function useSchedules(filters: ScheduleFilters) {
  // SWR with 30s polling, error boundary fallback, request deduplication
}

// apps/harness/hooks/useMaintenance.ts
export function useMaintenance(filters: MaintenanceFilters) {
  // SWR with 30s polling
}

// apps/harness/hooks/useValidationResults.ts
export function useValidationResults(filters: ValidationFilters) {
  // SWR with 30s polling
}

// apps/harness/hooks/useAuditLogs.ts
export function useAuditLogs(filters: AuditLogFilters) {
  // SWR with 60s polling
}
```

### Utility Library
```typescript
// lib/harness/aggregations.ts
export function groupConflictsBySeverity(conflicts: ConflictDetail[])
export function calculateConflictMetrics(results: ValidationResult[])
export function formatValidationDuration(ms: number): string
export function categorizeErrorCodes(auditLogs: AuditLog[]): ErrorCategory[]
export function computeValidationCoverage(total: number, validated: number): number
```

### Fetcher (ApiError handling)
```typescript
// lib/harness/fetcher.ts
export async function harnessApiFetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Reuse fetcher.ts from other apps for consistency
}
```

### UI Components (Shared)
```typescript
// app/harness/components/
- ErrorBoundary.tsx — Section-scoped error handling with 404/401/500 fallbacks
- Toast.tsx — Auto-dismiss notifications from SWR + API responses
- ConflictBadge.tsx — Reusable badge showing conflict severity
- StatusBadge.tsx — Reusable status indicator (pending/active/completed)
- ConfirmDialog.tsx — Confirmation modal for destructive actions
```

---

## 📊 Data Validation (Zod Schemas)

**Reuse existing schemas from `/lib/schemas/harness.ts`:**
- ProductionScheduleSchema
- MaintenancePlanSchema
- ValidationRequestSchema / ValidationResponseSchema
- AuditLogSchema

**Request validation:**
- All POST/PATCH endpoints validate request body against schema
- Date validation (scheduled_date >= today, scheduled_end > scheduled_start)
- Foreign key validation (facility_id, asset_id, user_id exist)

---

## 🧪 Testing Strategy

### Unit Tests (Pure Functions)
**File:** `__tests__/lib/harness-aggregations.test.ts`
```typescript
// Test cases (target: 30+ tests)
- groupConflictsBySeverity() — empty, single, multiple conflicts
- calculateConflictMetrics() — edge cases (0 conflicts, all critical, mixed)
- formatValidationDuration() — 0ms, 100ms, 1000ms, >1min
- categorizeErrorCodes() — known codes, unknown codes, empty array
- computeValidationCoverage() — 0%, 50%, 100%, >100% edge case
```

### API Route Tests
**File:** `__tests__/api/harness/*.test.ts`
```typescript
// GET /api/harness/production-schedules
- List with default pagination (10 items)
- Filter by facility_id, shift, date range
- Sorting by created_at, target_quantity
- Error: unauthorized (401), invalid filter (400)

// POST /api/harness/production-schedules
- Create with valid payload
- Auto-trigger conflict validation
- Error: missing required fields, invalid date

// GET /api/harness/validate
- Submit valid production_schedule + maintenance_plan
- Return ValidationResponse with conflicts/recommendations
- Auto-create AuditLog entries

// GET /api/harness/audit-logs
- List with filters, pagination
- Filter by event_type, status, date range
- Error: unauthorized
```

**Target:** 44+ API tests (matching Dashboard-P2 Phase 3 pattern)

### Integration Tests
**File:** `__tests__/integration/harness-workflow.test.ts`
```typescript
// Full workflow: create schedule → create plan → validate → check audit log
// Verify audit log entries created in correct sequence
```

**Overall Coverage Target:** 80%+ on new code

---

## 🎨 UI/UX Standards (Matching Ecosystem)

### Mobile Responsive (Tailwind CSS)
- **Tap targets:** 44px minimum (all buttons)
- **Text:** base-16px minimum for inputs
- **Layout:** Stacked on mobile (flex-col md:flex-row)
- **Grid:** Responsive grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- **Images:** Responsive with next/image

### Error Handling
- **Network errors:** Toast notification + retry button
- **Validation errors:** Inline field errors (red text)
- **API errors:** ErrorBoundary fallback with error code + support link
- **Timeout:** Toast "Request timed out — retrying" with exponential backoff

### Loading States
- Skeleton loaders (Recharts placeholder bars)
- Table loading: rows with shimmer animation
- Modal/drawer transitions: smooth fade-in

### Dark Mode (Inherited from Dashboard)
- Use existing Tailwind dark: prefix
- All charts support dark background (Recharts theme)

---

## 📅 Implementation Roadmap (5 days)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 (2026-05-28) | Page 1: Production Schedule Manager + 4 API stubs | `/app/harness/production-schedules` + GET/POST/PATCH/DELETE routes |
| 2 (2026-05-29) | Page 2: Maintenance Plan Manager + 4 API stubs | `/app/harness/maintenance-plans` + GET/POST/PATCH/DELETE routes |
| 3 (2026-05-30) | Page 3: Validation Engine + 3 API endpoints | `/app/harness/validation-results` + POST /validate, GET /validation-results routes |
| 4 (2026-05-31) | Page 4: Audit Log Viewer + utility library + hooks | `/app/harness/audit-logs` + harness-aggregations.ts + useHarness hooks |
| 5 (2026-06-01) | Testing (80%+), mobile responsiveness, Vercel deploy | All 44+ tests passing, coverage report, production URL live |

---

## ✅ QA Checklist

### Functionality
- [ ] Create, read, update, delete operations work on all pages
- [ ] Filtering and sorting work on all list pages
- [ ] SWR polling updates data every 30/60 seconds
- [ ] Conflict detection triggers automatically on schedule/plan creation
- [ ] Validation results display with correct severity badges
- [ ] Audit log shows complete event sequence

### Performance
- [ ] Page load time < 3s (first contentful paint)
- [ ] SWR polling doesn't hammer server (single request per interval)
- [ ] Large datasets (1000+ rows) handle pagination correctly

### Mobile (iOS/Android)
- [ ] All buttons are 44px tap targets
- [ ] Form inputs are text-base (16px+)
- [ ] Keyboard input works for date/number fields
- [ ] Tables scroll horizontally without breaking layout
- [ ] Modals close on mobile without jumping

### Error Cases
- [ ] Network error → Toast + retry
- [ ] Validation error → Inline field error
- [ ] 404 on resource not found → ErrorBoundary fallback
- [ ] 401 unauthorized → Redirect to login
- [ ] 500 server error → ErrorBoundary fallback + contact support

### Deployment
- [ ] Build passes locally (npm run build)
- [ ] All tests pass (npm run test)
- [ ] No TypeScript errors
- [ ] Vercel deployment succeeds (readyState: READY)
- [ ] Production URL accessible + data loads

---

## 📝 Phase 2 Integration Checklist

- [ ] Harness Phase 2 added to active_work_tracking.md
- [ ] Memory checkpoint created (this document)
- [ ] API stubs committed with test scaffolding
- [ ] Components scaffolded + TypeScript checked
- [ ] GitHub Actions deploy.yml workflow verified
- [ ] Vercel environment variables confirmed (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Monitoring cron updated to track Harness Phase 2 progress (Phase A/B/C)

---

**Design Status:** ✅ Complete  
**Next Step:** Spawn web-builder subagent for Page 1 implementation (2026-05-28)  
**Ecosystem:** Fully integrated with Dashboard-P2 Phase 3 + Team Dashboard P2B + Memory Automation Phase 2
