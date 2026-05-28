---
name: Team Dashboard Phase 2 — Test Plan
description: Performance, Resource, Communication, Audit pages + 12 APIs + RLS by role
type: project
date: 2026-05-28
status: DESIGN_COMPLETE
---

# 📊 Team Dashboard Phase 2 — Test Plan

**Scope:** 4 pages (Performance/Resource/Communication/Audit) | **APIs:** 12 endpoints | **Roles:** Admin/Manager/Operator  
**Target Coverage:** Unit 80% | Integration 70% | E2E 60%  
**Timeline:** 2026-05-28 to 2026-06-02

---

## 📋 Test Matrix

| Component | Type | Count | Coverage Target |
|-----------|------|-------|-----------------|
| KPI Calculations | Unit | 8 | 90% |
| Component Rendering | Unit | 20 | 85% |
| Chart Generation | Unit | 5 | 80% |
| API Endpoints | Integration | 12 | 75% |
| RLS by Role | Integration | 3 | 90% |
| Dashboard Load | E2E | 1 | 80% |
| Role Transitions | E2E | 1 | 80% |
| Goal CRUD | E2E | 1 | 75% |
| **Total** | | **51** | **~80%** | |

---

## 🧪 Unit Tests (33 tests)

### KPI Calculations (8 tests)
```typescript
// test/lib/kpi-calculations.test.ts
describe('KPI Calculations', () => {
  test('should calculate OEE from availability × performance × quality', () => {
    const oee = calculateOEE(0.9, 0.95, 0.97);
    expect(oee).toBeCloseTo(0.826, 2);
  });
  
  test('should calculate downtime in minutes', () => {
    const downtime = calculateDowntime(1440, 1350); // 24h = 1440 min
    expect(downtime).toBe(90);
  });
  
  test('should apply time-series smoothing (7-day rolling average)', () => {
    const data = [85, 87, 84, 86, 88, 85, 89];
    const smoothed = calculateRollingAverage(data, 7);
    expect(smoothed).toBeCloseTo(86, 0);
  });
  
  test('should detect anomalies (>3σ deviation)', () => {
    const data = [85, 86, 84, 87, 85, 150]; // 150 is anomaly
    const anomalies = detectAnomalies(data);
    expect(anomalies).toContain(150);
  });
  
  test('should calculate trend (slope of OEE over time)', () => {
    const data = [80, 82, 84, 86, 88]; // +2 per day
    const trend = calculateTrend(data);
    expect(trend).toBeCloseTo(2, 0);
  });
  
  test('should format percentages with 1 decimal place', () => {
    expect(formatPercentage(0.8567)).toBe('85.7%');
  });
  
  test('should format durations (hours:minutes:seconds)', () => {
    expect(formatDuration(3665)).toBe('1h 1m 5s');
  });
  
  test('should handle edge case: zero production time', () => {
    expect(calculateOEE(0, 0.95, 0.97)).toBe(0);
  });
});
```

### Component Rendering (20 tests)
```typescript
// test/components/dashboard-components.test.tsx
describe('Dashboard Components', () => {
  // Performance Page Components (5)
  test('should render PerformanceCard with OEE metric', () => { /* ... */ });
  test('should render TrendChart with 30-day history', () => { /* ... */ });
  test('should render AlertBadge for anomalies', () => { /* ... */ });
  test('should render ResourceUtilizationGauge', () => { /* ... */ });
  test('should render DowntimeBreakdown pie chart', () => { /* ... */ });
  
  // Resource Page Components (5)
  test('should render AssetListTable with pagination', () => { /* ... */ });
  test('should render AssetStatusIndicator (active/inactive)', () => { /* ... */ });
  test('should render MaintenanceScheduleTimeline', () => { /* ... */ });
  test('should render CapacityPlanning bar chart', () => { /* ... */ });
  test('should render InventoryWidget with stock levels', () => { /* ... */ });
  
  // Communication Page Components (5)
  test('should render MessageFeed with real-time updates', () => { /* ... */ });
  test('should render TeamAnnouncements carousel', () => { /* ... */ });
  test('should render AlertPanel with dismissal', () => { /* ... */ });
  test('should render NotificationBell with unread count', () => { /* ... */ });
  test('should render ChatWidget for direct messages', () => { /* ... */ });
  
  // Audit Page Components (5)
  test('should render AuditLogTable with filters', () => { /* ... */ });
  test('should render ChangeTimeline for data modifications', () => { /* ... */ });
  test('should render UserActivityHeatmap', () => { /* ... */ });
  test('should render AccessControlMatrix (role permissions)', () => { /* ... */ });
  test('should render ComplianceStatus indicator', () => { /* ... */ });
});
```

### Chart Generation (5 tests)
```typescript
// test/lib/chart-generators.test.ts
describe('Chart Generation', () => {
  test('should generate Recharts data for line chart', () => { /* ... */ });
  test('should generate bar chart data with stacked values', () => { /* ... */ });
  test('should generate pie chart data with percentages', () => { /* ... */ });
  test('should generate area chart with gradient', () => { /* ... */ });
  test('should apply dark mode theme to charts', () => { /* ... */ });
});
```

---

## 🔗 Integration Tests (15 tests)

### API Endpoints (12 tests)
```typescript
// test/api/dashboard-api.test.ts
describe('Team Dashboard API', () => {
  const authToken = getTestToken('org-alpha', 'admin');
  
  test('GET /api/dashboard/performance should return metrics', () => {
    // Verify OEE, downtime, quality metrics returned
  });
  
  test('GET /api/dashboard/performance?start=2026-05-01&end=2026-05-31 should filter by date', () => {
    // Verify date range filtering
  });
  
  test('POST /api/dashboard/goals should create goal with validation', () => {
    // Verify goal_name, target_percentage, deadline required
  });
  
  test('PATCH /api/dashboard/goals/:id should update goal', () => {
    // Verify org_id isolation in update
  });
  
  test('DELETE /api/dashboard/goals/:id should soft-delete', () => {
    // Verify goal marked as deleted, not removed
  });
  
  test('GET /api/dashboard/resources should return asset utilization', () => {
    // Verify asset count, utilization %, maintenance schedule
  });
  
  test('GET /api/dashboard/communications should return real-time alerts', () => {
    // Verify message feed with timestamps
  });
  
  test('POST /api/dashboard/communications/announcements should create announcement', () => {
    // Verify access control (admin only)
  });
  
  test('GET /api/dashboard/audit-logs should return user activity', () => {
    // Verify timestamps, user_id, action_type
  });
  
  test('GET /api/dashboard/audit-logs with filters should filter by date/user', () => {
    // Verify filtering works
  });
  
  test('GET /api/dashboard/access-control should return role matrix', () => {
    // Verify roles (admin/manager/operator) with permissions
  });
  
  test('PATCH /api/dashboard/access-control/:role should update permissions', () => {
    // Verify role-based access control enforcement
  });
});
```

### RLS by Role (3 tests)
```typescript
// test/integration/dashboard-rls.test.ts
describe('Team Dashboard RLS by Role', () => {
  test('should allow admin to read all org metrics', async () => {
    const adminClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { users: { 'admin-1': { role: 'admin', org_id: 'org-alpha' } } }
    });
    
    const { data } = await adminClient
      .from('performance_metrics')
      .select('*');
    
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });
  
  test('should prevent operator from updating goals', async () => {
    const operatorClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { users: { 'operator-1': { role: 'operator', org_id: 'org-alpha' } } }
    });
    
    const { error } = await operatorClient
      .from('performance_goals')
      .update({ target_percentage: 95 })
      .eq('id', 'goal-1');
    
    expect(error).toBeDefined(); // RLS denies update
  });
  
  test('should prevent cross-org access', async () => {
    const userBeta = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { users: { 'user-beta': { org_id: 'org-beta' } } }
    });
    
    const { data } = await userBeta
      .from('performance_metrics')
      .select('*')
      .eq('org_id', 'org-alpha');
    
    expect(data).toEqual([]);
  });
});
```

---

## 🎭 E2E Tests (3 tests)

### Dashboard Load (1 test)
```typescript
test('should load Performance dashboard and display all KPIs', async ({ page }) => {
  await page.goto('http://localhost:3000/app/dashboard/performance');
  await expect(page.locator('text=OEE')).toBeVisible();
  await expect(page.locator('text=Downtime')).toBeVisible();
  await expect(page.locator('text=Quality')).toBeVisible();
  
  // Performance check
  const navigationTiming = await page.evaluate(() => {
    return window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
  });
  expect(navigationTiming).toBeLessThan(3000); // <3s
});
```

### Role Transitions (1 test)
```typescript
test('should enforce role-based visibility on UI', async ({ page }) => {
  // Login as operator
  await page.goto('http://localhost:3000/app/dashboard/performance');
  
  // Verify "Edit Goal" button hidden
  expect(await page.locator('button:has-text("Edit Goal")').isVisible()).toBe(false);
  
  // Login as admin
  await logoutAndLogin('admin');
  await page.goto('http://localhost:3000/app/dashboard/performance');
  
  // Verify "Edit Goal" button visible
  expect(await page.locator('button:has-text("Edit Goal")').isVisible()).toBe(true);
});
```

### Goal CRUD (1 test)
```typescript
test('should complete goal creation and tracking workflow', async ({ page }) => {
  await page.goto('http://localhost:3000/app/dashboard/goals');
  
  // Create goal
  await page.locator('button:has-text("New Goal")').click();
  await page.locator('input[name="goal_name"]').fill('Q2 OEE Target');
  await page.locator('input[name="target"]').fill('90');
  await page.locator('button:has-text("Save")').click();
  
  // Verify goal appears in list
  await expect(page.locator('text=Q2 OEE Target')).toBeVisible();
  
  // Update goal
  await page.locator('button:has-text("Edit")').click();
  await page.locator('input[name="target"]').clear();
  await page.locator('input[name="target"]').fill('92');
  await page.locator('button:has-text("Update")').click();
  
  // Verify update
  await expect(page.locator('text=92%')).toBeVisible();
});
```

---

## ✅ Success Criteria

- [ ] All 51 tests passing
- [ ] Coverage ≥80% (components + APIs)
- [ ] RLS: 0 unauthorized data access incidents
- [ ] Performance: Dashboard load <3s (FCP)
- [ ] Mobile: All buttons ≥44px tap targets
- [ ] Accessibility: axe-core scan 0 violations
- [ ] Deployment: Vercel build passes

---

**Estimated Duration:** 12 hours (Day 1-3)  
**Owner:** Web Builder + QA Specialist

