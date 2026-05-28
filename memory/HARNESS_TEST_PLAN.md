---
name: Harness Engineering Phase 2 Test Plan
description: Comprehensive test strategy for 12 Production Scheduling & Maintenance Validation APIs
type: project
date: 2026-05-28
coverage_targets: Unit 80%, Integration 70%, E2E 60%
total_tests: 48
---

# 🧪 Harness Engineering Phase 2 Test Plan

**Project:** Production Scheduling & Maintenance Validation  
**ETA:** 2026-06-02  
**Total Tests:** 48+ (unit: 16, integration: 24, E2E: 5, performance: 3)  
**Coverage Target:** Unit 80%, Integration 70%, E2E 60%+  

---

## 📋 Test Matrix Overview

| Category | Framework | Files | Tests | Coverage |
|----------|-----------|-------|-------|----------|
| Unit | Vitest | `__tests__/lib/harness-*.test.ts` | 16 | 80%+ |
| Integration | Jest | `__tests__/api/harness/*.test.ts` | 24 | 70%+ |
| E2E | Playwright | `__tests__/e2e/harness-*.spec.ts` | 5 | 60%+ |
| Performance | Custom | `__tests__/perf/harness-perf.test.ts` | 3 | N/A |
| **Total** | — | — | **48** | — |

---

## 🎯 Unit Tests (16 tests)

### 1. Conflict Detection Logic
**File:** `__tests__/lib/harness-conflict-detection.test.ts`

**Purpose:** Test pure functions for identifying scheduling conflicts and validation logic

```typescript
describe('Conflict Detection Engine', () => {
  // Test 1: Time Overlap Detection
  test('detectTimeOverlap: two schedules with overlapping times', () => {
    const schedule1 = {
      scheduled_date: '2026-06-01',
      shift: 'A', // 06:00-14:00
      planned_downtime_minutes: 60,
    };
    const plan1 = {
      scheduled_start: '2026-06-01T12:00:00Z',
      duration_minutes: 120,
    };
    const conflict = detectTimeOverlap(schedule1, plan1);
    expect(conflict).toBe(true);
    expect(conflict.type).toBe('time_overlap');
  });

  // Test 2: No Overlap When Scheduled Sequentially
  test('detectTimeOverlap: sequential schedules with buffer', () => {
    const schedule1 = { scheduled_date: '2026-06-01', shift: 'A' };
    const plan1 = {
      scheduled_start: '2026-06-01T15:00:00Z',
      duration_minutes: 120,
    };
    const conflict = detectTimeOverlap(schedule1, plan1);
    expect(conflict).toBe(false);
  });

  // Test 3: Resource Contention Detection
  test('detectResourceContention: shared asset scheduled for multiple tasks', () => {
    const asset_id = 'asset-123';
    const plan1 = { asset_id, scheduled_start: '2026-06-01T10:00:00Z', duration_minutes: 60 };
    const plan2 = { asset_id, scheduled_start: '2026-06-01T11:00:00Z', duration_minutes: 60 };
    const conflict = detectResourceContention([plan1, plan2]);
    expect(conflict).toBe(true);
    expect(conflict.type).toBe('resource_contention');
  });

  // Test 4: Capacity Exceeded Detection
  test('detectCapacityExceeded: maintenance tasks exceed facility capacity', () => {
    const schedule = { facility_id: 'fac-001', asset_count: 10 };
    const plans = Array(15).fill({}).map((_, i) => ({
      asset_id: `asset-${i}`,
      impact_scope: 'facility',
    }));
    const conflict = detectCapacityExceeded(schedule, plans);
    expect(conflict).toBe(true);
    expect(conflict.severity).toBe('critical');
  });

  // Test 5: No Conflict When Within Limits
  test('detectCapacityExceeded: within facility maintenance limit', () => {
    const schedule = { facility_id: 'fac-001', asset_count: 10 };
    const plans = Array(3).fill({}).map((_, i) => ({
      asset_id: `asset-${i}`,
      impact_scope: 'single',
    }));
    const conflict = detectCapacityExceeded(schedule, plans);
    expect(conflict).toBe(false);
  });
});
```

### 2. Conflict Metrics Aggregation
**File:** `__tests__/lib/harness-aggregations.test.ts`

```typescript
describe('Conflict Metrics', () => {
  // Test 6: Calculate Conflict Metrics
  test('calculateConflictMetrics: aggregates conflict data correctly', () => {
    const results = [
      {
        id: '1',
        status: 'conflict',
        conflicts: [
          { type: 'time_overlap', severity: 'critical' },
          { type: 'resource_contention', severity: 'warning' },
        ],
        validation_duration_ms: 150,
      },
      {
        id: '2',
        status: 'valid',
        conflicts: [],
        validation_duration_ms: 100,
      },
    ];
    const metrics = calculateConflictMetrics(results);
    expect(metrics.total_conflicts).toBe(2);
    expect(metrics.critical_count).toBe(1);
    expect(metrics.validation_coverage).toBe(100);
    expect(metrics.avg_validation_time_ms).toBe(125);
  });

  // Test 7: Conflict Breakdown by Type
  test('groupConflictsBySeverity: categorizes conflicts correctly', () => {
    const conflicts = [
      { type: 'time_overlap', severity: 'critical' },
      { type: 'time_overlap', severity: 'critical' },
      { type: 'resource_contention', severity: 'warning' },
      { type: 'capacity_exceeded', severity: 'critical' },
    ];
    const breakdown = groupConflictsBySeverity(conflicts);
    expect(breakdown.critical).toHaveLength(3);
    expect(breakdown.warning).toHaveLength(1);
  });

  // Test 8: Empty Conflict Set
  test('calculateConflictMetrics: handles empty validation results', () => {
    const metrics = calculateConflictMetrics([]);
    expect(metrics.total_conflicts).toBe(0);
    expect(metrics.critical_count).toBe(0);
    expect(metrics.validation_coverage).toBe(0);
  });
});
```

### 3. Validation Duration Formatting
**File:** `__tests__/lib/harness-formatters.test.ts`

```typescript
describe('Validation Formatters', () => {
  // Test 9: Format Duration
  test('formatValidationDuration: converts milliseconds to readable format', () => {
    expect(formatValidationDuration(0)).toBe('0ms');
    expect(formatValidationDuration(500)).toBe('500ms');
    expect(formatValidationDuration(1500)).toBe('1.5s');
    expect(formatValidationDuration(61000)).toBe('1m 1s');
  });

  // Test 10: Format Conflict Severity
  test('formatConflictSeverity: returns human-readable labels', () => {
    expect(formatConflictSeverity('critical')).toBe('Critical');
    expect(formatConflictSeverity('warning')).toBe('Warning');
  });

  // Test 11: Format Conflict Type
  test('formatConflictType: converts type to label', () => {
    expect(formatConflictType('time_overlap')).toBe('Time Overlap');
    expect(formatConflictType('resource_contention')).toBe('Resource Contention');
    expect(formatConflictType('capacity_exceeded')).toBe('Capacity Exceeded');
  });
});
```

### 4. Error Code Categorization
**File:** `__tests__/lib/harness-error-analysis.test.ts`

```typescript
describe('Error Code Analysis', () => {
  // Test 12: Categorize Error Codes
  test('categorizeErrorCodes: groups errors by category', () => {
    const logs = [
      { error_code: 'VALIDATION_TIMEOUT', status: 'failure' },
      { error_code: 'VALIDATION_TIMEOUT', status: 'failure' },
      { error_code: 'RLS_UNAUTHORIZED', status: 'failure' },
      { error_code: 'DB_CONSTRAINT_VIOLATION', status: 'failure' },
    ];
    const categorized = categorizeErrorCodes(logs);
    expect(categorized['VALIDATION_TIMEOUT']).toBe(2);
    expect(categorized['RLS_UNAUTHORIZED']).toBe(1);
  });

  // Test 13: Empty Error Set
  test('categorizeErrorCodes: handles empty logs', () => {
    const categorized = categorizeErrorCodes([]);
    expect(Object.keys(categorized)).toHaveLength(0);
  });

  // Test 14: Validation Coverage Calculation
  test('computeValidationCoverage: calculates percentage correctly', () => {
    expect(computeValidationCoverage(100, 80)).toBe(80);
    expect(computeValidationCoverage(100, 100)).toBe(100);
    expect(computeValidationCoverage(0, 0)).toBe(0);
  });

  // Test 15: Retry Count Aggregation
  test('calculateAverageRetryCount: averages retries across validations', () => {
    const results = [
      { id: '1', retry_count: 0 },
      { id: '2', retry_count: 1 },
      { id: '3', retry_count: 3 },
    ];
    const avg = calculateAverageRetryCount(results);
    expect(avg).toBe(1.33);
  });

  // Test 16: Retry Delay Escalation
  test('calculateNextRetryDelay: exponential backoff formula', () => {
    expect(calculateNextRetryDelay(0)).toBe(1000); // 1s
    expect(calculateNextRetryDelay(1)).toBe(2000); // 2s
    expect(calculateNextRetryDelay(2)).toBe(4000); // 4s
    expect(calculateNextRetryDelay(3)).toBe(8000); // 8s
  });
});
```

---

## 🔌 Integration Tests (24 tests)

### Production Schedules API (5 tests)

```typescript
describe('GET /api/harness/production-schedules', () => {
  // Test 17: List with Default Pagination
  test('returns 10 items per page by default', async () => {
    const res = await fetch('/api/harness/production-schedules', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(10);
    expect(data.total).toBeGreaterThanOrEqual(10);
    expect(data.page).toBe(1);
  });

  // Test 18: Filter by Facility
  test('filters schedules by facility_id', async () => {
    const res = await fetch('/api/harness/production-schedules?facility_id=fac-001', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.every(s => s.facility_id === 'fac-001')).toBe(true);
  });

  // Test 19: Filter by Date Range
  test('filters schedules by date range', async () => {
    const res = await fetch('/api/harness/production-schedules?from=2026-06-01&to=2026-06-05', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.every(s => new Date(s.scheduled_date) >= new Date('2026-06-01'))).toBe(true);
  });

  // Test 20: Sort by Created Date
  test('sorts results by created_at descending', async () => {
    const res = await fetch('/api/harness/production-schedules?sort=created_at&order=desc', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    for (let i = 0; i < data.items.length - 1; i++) {
      expect(new Date(data.items[i].created_at) >= new Date(data.items[i+1].created_at)).toBe(true);
    }
  });

  // Test 21: Unauthorized Access
  test('returns 401 without authorization token', async () => {
    const res = await fetch('/api/harness/production-schedules');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/harness/production-schedules', () => {
  // Test 22: Create Valid Schedule
  test('creates production schedule with valid payload', async () => {
    const payload = {
      facility_id: 'fac-001',
      scheduled_date: '2026-06-10',
      shift: 'A',
      target_quantity: 500,
      planned_downtime_minutes: 60,
    };
    const res = await fetch('/api/harness/production-schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.facility_id).toBe('fac-001');
  });

  // Test 23: Auto-Trigger Conflict Validation
  test('automatically triggers validation on schedule creation', async () => {
    const payload = {
      facility_id: 'fac-001',
      scheduled_date: '2026-06-10',
      shift: 'A',
      target_quantity: 500,
      planned_downtime_minutes: 60,
    };
    const res = await fetch('/api/harness/production-schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const validation = await fetch(`/api/harness/validation-results/${data.id}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(validation.status).toBe(200);
  });

  // Test 24: Validation Error on Missing Fields
  test('returns 400 for missing required fields', async () => {
    const payload = { facility_id: 'fac-001', shift: 'A' };
    const res = await fetch('/api/harness/production-schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  // Test 25: Invalid Date Validation
  test('returns 400 for past scheduled date', async () => {
    const payload = {
      facility_id: 'fac-001',
      scheduled_date: '2026-05-01',
      shift: 'A',
      target_quantity: 500,
      planned_downtime_minutes: 60,
    };
    const res = await fetch('/api/harness/production-schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET/PATCH/DELETE /api/harness/production-schedules/[id]', () => {
  // Test 26: Get Schedule Detail
  test('retrieves schedule by id', async () => {
    const res = await fetch(`/api/harness/production-schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(scheduleId);
  });

  // Test 27: Update Schedule
  test('updates schedule with new values', async () => {
    const payload = { target_quantity: 600, planned_downtime_minutes: 90 };
    const res = await fetch(`/api/harness/production-schedules/${scheduleId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.target_quantity).toBe(600);
  });

  // Test 28: Soft Delete Schedule
  test('soft deletes schedule (sets deleted_at)', async () => {
    const res = await fetch(`/api/harness/production-schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const verify = await fetch(`/api/harness/production-schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(verify.status).toBe(404);
  });
});
```

### Maintenance Plans API (5 tests)

```typescript
describe('POST /api/harness/maintenance-plans', () => {
  // Test 29: Create Maintenance Plan
  test('creates maintenance plan with impact scope calculation', async () => {
    const payload = {
      asset_id: 'asset-123',
      maintenance_type: 'preventive',
      scheduled_start: '2026-06-10T10:00:00Z',
      duration_minutes: 120,
      priority: 'high',
      maintenance_team_id: 'team-001',
      required_downtime: true,
      impact_scope: 'facility',
    };
    const res = await fetch('/api/harness/maintenance-plans', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.impact_scope).toBe('facility');
  });

  // Test 30: Filter by Maintenance Type
  test('filters plans by maintenance_type', async () => {
    const res = await fetch('/api/harness/maintenance-plans?type=preventive', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    expect(data.items.every(p => p.maintenance_type === 'preventive')).toBe(true);
  });

  // Test 31: Filter by Priority
  test('filters plans by priority level', async () => {
    const res = await fetch('/api/harness/maintenance-plans?priority=high', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    expect(data.items.every(p => p.priority === 'high')).toBe(true);
  });

  // Test 32: RLS Isolation for Plans
  test('RLS prevents cross-org plan access', async () => {
    const orgARes = await fetch('/api/harness/maintenance-plans', {
      headers: { Authorization: `Bearer ${tokenOrgA}` },
    });
    const orgAData = await orgARes.json();
    const orgBRes = await fetch('/api/harness/maintenance-plans', {
      headers: { Authorization: `Bearer ${tokenOrgB}` },
    });
    const orgBData = await orgBRes.json();
    const orgAIds = orgAData.items.map(p => p.id);
    const orgBIds = orgBData.items.map(p => p.id);
    expect(orgAIds.filter(id => orgBIds.includes(id))).toHaveLength(0);
  });

  // Test 33: Upcoming Maintenance Alert
  test('identifies plans scheduled within 7 days', async () => {
    const res = await fetch('/api/harness/maintenance-plans?upcoming=true', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(data.items.every(p => new Date(p.scheduled_start) <= sevenDaysOut)).toBe(true);
  });
});
```

### Validation & Conflict Detection API (5 tests)

```typescript
describe('POST /api/harness/validate', () => {
  // Test 34: Submit Valid Validation Request
  test('submits production_schedule + maintenance_plan for validation', async () => {
    const payload = {
      production_schedule_id: scheduleId,
      maintenance_plan_id: planId,
    };
    const res = await fetch('/api/harness/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.request_id).toBeDefined();
    expect(data.validation_duration_ms).toBeDefined();
  });

  // Test 35: Validation Returns Conflict Details
  test('returns detailed conflict information when conflicts detected', async () => {
    const payload = {
      production_schedule_id: conflictingScheduleId,
      maintenance_plan_id: overlappingPlanId,
    };
    const res = await fetch('/api/harness/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    expect(data.status).toBe('conflict');
    expect(data.conflicts).toHaveLength(1);
    expect(data.conflicts[0].type).toBe('time_overlap');
    expect(data.recommendations).toHaveLength(1);
  });

  // Test 36: Auto-Create Audit Log on Validation
  test('automatically creates audit log entries for validation', async () => {
    const payload = { production_schedule_id: scheduleId, maintenance_plan_id: planId };
    const valRes = await fetch('/api/harness/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const valData = await valRes.json();
    const logRes = await fetch(`/api/harness/audit-logs?request_id=${valData.request_id}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const logData = await logRes.json();
    expect(logData.items.some(l => l.event_type === 'validation_started')).toBe(true);
    expect(logData.items.some(l => l.event_type === 'validation_completed')).toBe(true);
  });

  // Test 37: Validation Retry on Failure
  test('automatically retries failed validations with exponential backoff', async () => {
    const payload = { production_schedule_id: scheduleId, maintenance_plan_id: planId };
    const res = await fetch('/api/harness/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    // Simulate network failure
    await new Promise(r => setTimeout(r, 1500)); // Wait for retry delay
    const retryRes = await fetch(`/api/harness/validation-results/${data.request_id}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const retryData = await retryRes.json();
    expect(retryData.retry_count).toBeGreaterThanOrEqual(1);
  });

  // Test 38: Validation Cache
  test('caches identical validation requests (1 hour TTL)', async () => {
    const payload = { production_schedule_id: scheduleId, maintenance_plan_id: planId };
    const res1 = await fetch('/api/harness/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data1 = await res1.json();
    const res2 = await fetch('/api/harness/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data2 = await res2.json();
    expect(data2.request_id).toBe(data1.request_id);
  });
});

describe('GET /api/harness/validation-results', () => {
  // Test 39: List Validation Results with Filters
  test('lists validation results with pagination + filters', async () => {
    const res = await fetch('/api/harness/validation-results?status=conflict&limit=20', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.every(r => r.status === 'conflict')).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(0);
  });
});
```

### Audit Logs API (4 tests)

```typescript
describe('GET /api/harness/audit-logs', () => {
  // Test 40: List Audit Logs with Filters
  test('retrieves audit logs filtered by event_type', async () => {
    const res = await fetch('/api/harness/audit-logs?event_type=validation_completed', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.every(l => l.event_type === 'validation_completed')).toBe(true);
  });

  // Test 41: Filter by Status (Success/Failure)
  test('filters logs by success/failure status', async () => {
    const res = await fetch('/api/harness/audit-logs?status=failure', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    expect(data.items.every(l => l.status === 'failure')).toBe(true);
  });

  // Test 42: Filter by Date Range
  test('filters logs by date range', async () => {
    const res = await fetch('/api/harness/audit-logs?from=2026-06-01&to=2026-06-05', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    expect(data.items.every(l => {
      const d = new Date(l.created_at);
      return d >= new Date('2026-06-01') && d <= new Date('2026-06-05');
    })).toBe(true);
  });

  // Test 43: Audit Log Sequence Verification
  test('audit log event sequence matches expected workflow', async () => {
    const res = await fetch(`/api/harness/audit-logs?request_id=${requestId}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    const eventSequence = data.items.map(l => l.event_type);
    expect(eventSequence).toEqual([
      'request_received',
      'validation_started',
      'validation_completed',
    ]);
  });
});
```

---

## 🎬 E2E Tests (5 tests)

**File:** `__tests__/e2e/harness-workflows.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Harness Engineering E2E', () => {
  // Test 44: Complete Scheduling Workflow
  test('E2E: Create schedule → plan → validate → audit', async ({ page }) => {
    await page.goto('/app/harness/production-schedules');
    
    // Create schedule
    await page.click('button:has-text("New Schedule")');
    await page.fill('[name="facility_id"]', 'fac-001');
    await page.fill('[name="scheduled_date"]', '2026-06-10');
    await page.selectOption('[name="shift"]', 'A');
    await page.fill('[name="target_quantity"]', '500');
    await page.click('button:has-text("Create")');
    
    // Verify schedule appears in list
    await expect(page.locator('text=fac-001')).toBeVisible();
    
    // Navigate to maintenance plans
    await page.click('[data-testid="nav-maintenance"]');
    
    // Create plan
    await page.click('button:has-text("New Plan")');
    await page.fill('[name="asset_id"]', 'asset-123');
    await page.fill('[name="scheduled_start"]', '2026-06-10T10:00');
    await page.click('button:has-text("Create")');
    
    // Check validation results
    await page.click('[data-testid="nav-validation"]');
    await expect(page.locator('text=Validation Results')).toBeVisible();
  });

  // Test 45: Conflict Detection & Resolution
  test('E2E: Detect conflict and resolve by rescheduling', async ({ page }) => {
    await page.goto('/app/harness/validation-results');
    
    // Find conflict
    const conflictRow = page.locator('[data-testid="conflict-row"]:first-child');
    await expect(conflictRow).toBeVisible();
    
    // View details
    await conflictRow.click();
    const details = page.locator('[data-testid="conflict-details"]');
    await expect(details).toContainText('Time Overlap');
    
    // Apply recommendation
    await page.click('button:has-text("Reschedule")');
    await page.fill('[name="new_start_time"]', '15:00');
    await page.click('button:has-text("Confirm")');
    
    // Verify conflict resolved
    const audit = await page.locator('[data-testid="audit-entry"]');
    await expect(audit).toContainText('conflict_resolved');
  });

  // Test 46: Audit Log Viewing
  test('E2E: View complete audit trail for a validation', async ({ page }) => {
    await page.goto('/app/harness/audit-logs');
    
    // Filter by request
    await page.fill('[name="request_id"]', 'req-123');
    await page.click('button:has-text("Search")');
    
    // Verify timeline
    const timeline = page.locator('[data-testid="log-timeline"]');
    await expect(timeline).toBeVisible();
    
    // Verify event sequence
    const events = await page.locator('[data-testid="log-event"]').allTextContents();
    expect(events).toContain('request_received');
    expect(events).toContain('validation_completed');
  });

  // Test 47: Mobile Responsiveness
  test('E2E: Mobile layout for scheduling on iOS', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/harness/production-schedules');
    
    // Verify stacked layout
    const filterBar = page.locator('[data-testid="filter-bar"]');
    const style = await filterBar.evaluate(el => getComputedStyle(el).flexDirection);
    expect(style).toBe('column');
    
    // Verify tap targets
    const buttons = page.locator('button');
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  // Test 48: Performance Baseline
  test('E2E: Page load < 3s with conflict detection', async ({ page }) => {
    const start = Date.now();
    await page.goto('/app/harness/validation-results');
    const metrics = await page.locator('[data-testid="metrics"]').textContent();
    const end = Date.now();
    
    expect(end - start).toBeLessThan(3000);
    expect(metrics).toContainText('Metrics');
  });
});
```

---

## ⚡ Performance Tests (3 tests)

**File:** `__tests__/perf/harness-perf.test.ts`

```typescript
describe('Harness Performance', () => {
  // Test 49: Conflict Detection on Large Dataset
  test('conflict detection completes < 500ms for 1000 schedules', async () => {
    const schedules = Array(1000).fill({}).map((_, i) => ({
      id: `s-${i}`,
      scheduled_date: '2026-06-10',
      shift: ['A', 'B', 'C'][i % 3],
    }));
    
    const start = performance.now();
    const conflicts = detectConflicts(schedules);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(500);
  });

  // Test 50: Validation Query Response Time
  test('GET /api/harness/validation-results responds < 500ms', async () => {
    const start = performance.now();
    const res = await fetch('/api/harness/validation-results?limit=100', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const end = performance.now();
    
    expect(end - start).toBeLessThan(500);
    expect(res.status).toBe(200);
  });

  // Test 51: Audit Log Query with 10k Records
  test('audit log query completes < 1s with 10k records', async () => {
    const start = performance.now();
    const res = await fetch('/api/harness/audit-logs?limit=100&offset=0', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const end = performance.now();
    
    expect(end - start).toBeLessThan(1000);
    expect(res.status).toBe(200);
  });
});
```

---

## ✅ Success Criteria

| Requirement | Verification Method |
|-------------|---------------------|
| All unit tests pass | `npm run test:unit -- harness` ≥80% coverage |
| All integration tests pass | `npm run test:integration -- harness` ≥70% coverage |
| All E2E tests pass | `npm run test:e2e -- harness` ≥60% coverage |
| Conflict detection < 500ms | Performance test 49 passes |
| API response < 500ms | Performance test 50 passes |
| Audit queries < 1s | Performance test 51 passes |
| Mobile tap targets ≥ 44px | E2E test 47 passes |
| No TypeScript errors | `npm run build` succeeds |

---

## 📅 Implementation Timeline

| Day | Task | Deliverable | Tests |
|-----|------|-------------|-------|
| 2026-05-29 | Unit tests (conflict detection, aggregations, formatters) | `__tests__/lib/harness-*.test.ts` | 1-16 |
| 2026-05-30 | Integration tests (all 12 APIs + RLS) | `__tests__/api/harness/*.test.ts` | 17-43 |
| 2026-05-31 | E2E tests (workflows) + Performance baseline | `__tests__/e2e/harness-*.spec.ts` + perf | 44-51 |
| 2026-06-01 | Test validation + coverage report | Coverage ≥70% aggregate | All 51 |
| 2026-06-02 | Production readiness verification | Final checkpoint | Ready ✅ |

---

**Status:** Test plan complete  
**Next:** Implementation begins 2026-05-29  
**Owner:** QA Specialist  
**Review:** Evaluator AI Agent (final validation 2026-06-02)
