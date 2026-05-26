---
name: Ecosystem Standardization Guide
description: Unified patterns and standards for all Phase 2+ projects (Dashboard-P2, Team Dashboard, Harness-ENG, Backup, etc.)
type: reference
date: 2026-05-27
---

# 🎯 DSC FMS Portal — Ecosystem Standardization Guide

**Purpose:** Ensure consistent, standardized work products across all parallel Phase B projects.  
**Applied To:** Dashboard-P2 Phase 3, Team Dashboard P2B, Harness-ENG-P2, Backup-P2, Travel-P2, Asset-P2  
**Enforced By:** Memory Automation Phase 2 (Duplicate Detection + Trust Score + Cron Monitoring)  

---

## 1. Architecture Standard

### 1.1 Tech Stack
- **Frontend:** Next.js 14 App Router + TypeScript
- **Backend:** Supabase PostgreSQL + Row-Level Security (RLS)
- **Styling:** Tailwind CSS v3 (dark mode support)
- **Data Fetching:** SWR with 30/60s polling intervals + error boundaries
- **Charts:** Recharts (bar, line, area, pie)
- **UI Components:** Custom components + shadcn/ui where applicable
- **Testing:** Jest + ts-jest
- **Deployment:** Vercel (auto-deploy on main commit)

### 1.2 Project Structure
```
app/
  [feature]/
    page.tsx                    # Main page
    layout.tsx                  # Layout (optional)
    components/
      [ComponentName].tsx       # Component files
      __tests__/
        [ComponentName].test.ts # Component tests
api/
  [feature]/
    [endpoint]/
      route.ts                  # API handler
lib/
  [feature]/
    fetcher.ts                  # Reusable fetcher
    aggregations.ts             # Pure utility functions
    hooks.ts or hooks/          # Custom React hooks
  schemas/
    [feature].ts                # Zod validation schemas
__tests__/
  api/
    [feature].test.ts           # API integration tests
  lib/
    [feature]-aggregations.test.ts # Pure function tests
```

### 1.3 Dependencies
- **Core:** react, next, typescript
- **Data:** zod, swr, @supabase/supabase-js
- **UI:** tailwindcss, recharts, react-hot-toast
- **Testing:** jest, @testing-library/react, ts-jest

---

## 2. Component Standard

### 2.1 Page Components (Standardized Pattern)
```typescript
// app/[feature]/[page]/page.tsx
'use client';

import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { Toast } from '@/app/components/Toast';
import { use[Feature]Hook } from '@/lib/[feature]/hooks';

export default function [FeatureName]Page() {
  const { data, error, isLoading } = use[Feature]Hook();

  return (
    <ErrorBoundary>
      <Toast />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">Page Title</h1>
        {isLoading && <SkeletonLoader />}
        {error && <ErrorFallback error={error} />}
        {data && <ContentComponent data={data} />}
      </div>
    </ErrorBoundary>
  );
}
```

### 2.2 Shared Components (All Projects Must Include)
| Component | Purpose | Usage |
|-----------|---------|-------|
| `ErrorBoundary.tsx` | Section-scoped error handling | Wrap page content |
| `Toast.tsx` | Auto-dismiss notifications | Show API errors + successes |
| `StatusBadge.tsx` | Status indicator (pending/active/completed) | All status displays |
| `ConfirmDialog.tsx` | Destructive action confirmation | Delete/cancel operations |
| `SkeletonLoader.tsx` | Data loading state | While fetching |

### 2.3 Mobile Responsive Requirements
- **Min tap target:** 44px × 44px (all buttons)
- **Min text size:** 16px (base) for inputs
- **Breakpoints:** Tailwind defaults (sm: 640px, md: 768px, lg: 1024px)
- **Layouts:** 
  - Mobile: flex-col (stacked)
  - Desktop: flex-row, grid layouts
- **Input fields:** Use native mobile inputs (type="date", type="number")

**Example:**
```typescript
<div className="flex flex-col md:flex-row gap-4 p-4">
  <input className="w-full md:w-1/2 px-3 py-2 text-base border rounded" />
</div>
```

---

## 3. Data Fetching Standard

### 3.1 SWR Hook Pattern
```typescript
// lib/[feature]/hooks.ts
import useSWR from 'swr';
import { [Feature]ApiFetcher } from './fetcher';

export function use[Feature]Data(filters?: Filters) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/api/[feature]/endpoint`, filters],
    ([url, f]) => [Feature]ApiFetcher(url, { params: f }),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // 30s polling
      onError: (err) => console.error('Fetch error:', err),
    }
  );

  return { data, error, isLoading, mutate };
}
```

### 3.2 Polling Intervals
| Use Case | Interval |
|----------|----------|
| Real-time updates (schedules, plans, validation) | 30s |
| Audit logs, historical data | 60s |
| Slow-changing data (config, master data) | 120s |

---

## 4. API Endpoint Standard

### 4.1 Response Format (All Endpoints)
```typescript
// Success (2xx)
{
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 100 },
  "timestamp": "2026-05-27T08:00:00Z"
}

// Error (4xx/5xx)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid filter value",
    "details": { "field": "shift", "value": "X" }
  },
  "timestamp": "2026-05-27T08:00:00Z"
}
```

### 4.2 Endpoint Naming
- **List:** `GET /api/[feature]/[resource]?page=1&limit=10&filter=value`
- **Create:** `POST /api/[feature]/[resource]` + request body
- **Get Detail:** `GET /api/[feature]/[resource]/[id]`
- **Update:** `PATCH /api/[feature]/[resource]/[id]` + partial payload
- **Delete:** `DELETE /api/[feature]/[resource]/[id]`
- **Custom Action:** `POST /api/[feature]/[action]` (e.g., POST /api/harness/validate)

### 4.3 Error Handling
```typescript
// lib/[feature]/fetcher.ts
export async function [Feature]ApiFetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    const error = await res.json();
    const err = new Error(error.message || `API Error ${res.status}`);
    (err as any).status = res.status;
    (err as any).code = error.code;
    throw err;
  }

  return res.json();
}
```

---

## 5. Testing Standard

### 5.1 Coverage Targets
- **Pure functions:** 100% (aggregations, utilities)
- **API routes:** 80%+ (happy path + error cases)
- **Components:** 60%+ (critical user flows)
- **Overall:** 80%+ on new code

### 5.2 Test Structure
```typescript
// __tests__/lib/[feature]-aggregations.test.ts
describe('featureAggregations', () => {
  describe('functionName', () => {
    it('should handle valid input', () => {
      const input = { /* ... */ };
      const expected = { /* ... */ };
      expect(functionName(input)).toEqual(expected);
    });

    it('should handle edge case: empty array', () => {
      expect(functionName([])).toEqual([]);
    });

    it('should throw on invalid input', () => {
      expect(() => functionName(null)).toThrow();
    });
  });
});
```

### 5.3 Test Running
```bash
npm run test                    # Run all tests
npm run test -- --coverage     # With coverage report
npm run test -- --watch        # Watch mode
npm run build                  # Verify TypeScript + build
```

---

## 6. Git & Deployment Standard

### 6.1 Commit Message Format
```
feat(feature-name): Brief description

- Detailed point 1
- Detailed point 2
- Test results: 44/44 passing, 81.66% coverage

Fixes: [optional issue number]
Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### 6.2 Deployment Flow
1. **Code commit** to `main` branch
2. **GitHub Actions** triggers (build + test)
3. **Vercel auto-deploy** on success
4. **Production URL:** https://dsc-fms-portal.vercel.app
5. **Preview URL:** auto-generated for PRs

### 6.3 Build Verification
```bash
# Local verification before push
npm run build        # Next.js compilation
npm run test         # All tests
git push origin main # Trigger Vercel
```

---

## 7. Standardization Checklist (New Projects)

### Design Phase
- [ ] Design document created (4-page layout or equivalent)
- [ ] API endpoints specified (12+ or feature-appropriate count)
- [ ] Zod schemas designed (request/response validation)
- [ ] Test strategy outlined (80%+ coverage target)
- [ ] Mobile responsiveness confirmed (44px taps, text-base)

### Implementation Phase
- [ ] Components use ErrorBoundary + Toast
- [ ] SWR hooks implemented with polling intervals
- [ ] All API responses follow standardized format
- [ ] Tests written with 80%+ coverage target
- [ ] Mobile layout tested (iOS/Android)

### Pre-Deployment
- [ ] TypeScript compilation passes (npm run build)
- [ ] All tests passing (npm run test)
- [ ] Code pushed to main branch
- [ ] Vercel deployment monitoring

### Post-Deployment
- [ ] Production URL verified (load test + data check)
- [ ] Error handling tested (network errors, validation errors)
- [ ] Mobile UI verified on actual devices
- [ ] Performance monitored (page load time < 3s)

---

## 8. Examples from Completed Projects

### Dashboard-P2 Phase 3 ✅
**Pattern Applied:**
- 4 pages (CEO Home, Project List, Project Detail, Completion History)
- SWR 30s polling on all list pages
- Recharts integration (CompletionHistoryChart, QuarterlyComparison)
- 44 tests, 81.66% coverage
- Mobile responsive (44px taps, stacked layouts)
- Vercel deployed 2026-05-27

### Team Dashboard P2B ✅
**Pattern Applied:**
- Day 4 UI: ErrorBoundary, Toast, mobile responsiveness
- SWR polling (30s) for team projects
- 23/23 tests passing
- Production live 2026-05-27

### Harness-ENG-P2 (In Design)
**Pattern Applied:**
- 4 pages (Production Schedule, Maintenance Plan, Conflict Detection, Audit Log)
- 12 API endpoints (production_schedules, maintenance_plans, validation, audit_logs)
- SWR 30/60s polling
- Recharts for conflict metrics + audit log trends
- 80%+ test coverage target
- Implementation: 2026-05-28 ~ 2026-06-01

---

## 9. Consistency Monitoring (Phase A/B/C Cron)

### Phase A: Memory Protection (12h)
- Snapshot ECOSYSTEM_STANDARDIZATION_GUIDE.md
- Verify all active projects follow patterns
- Drift detection: flag pattern violations

### Phase B: Rule Enforcement (4h)
- Evaluator checks: all commits follow standardized format
- SWR polling intervals verified
- Test coverage thresholds maintained

### Phase C: Improvement Feedback (Weekly)
- Pattern adoption metrics
- Performance across projects
- Suggested improvements

---

## 10. When to Break the Standard

Acceptable deviations:
- Custom styling for niche requirements (rare)
- Different polling intervals for slow-changing data (60-120s instead of 30s)
- Additional components for domain-specific UX (maintenance-specific charts, etc.)

**NOT acceptable:**
- Different tech stack (Next.js → Vue, SWR → React Query, etc.)
- Skipping ErrorBoundary or Toast components
- < 60% test coverage on critical paths
- Hardcoded API URLs (use env vars)
- Responsive breakpoints different from Tailwind defaults

---

**Last Updated:** 2026-05-27  
**Enforced By:** Memory Automation Phase 2 (Active)  
**Review Cycle:** Weekly (Phase C feedback integration)
