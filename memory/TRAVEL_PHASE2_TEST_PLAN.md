---
name: Travel Phase 2 UI — Test Plan
description: Travel booking workflow, cost calculations, mobile responsiveness (13 days)
type: project
date: 2026-05-28
status: DESIGN_COMPLETE
---

# ✈️ Travel Phase 2 UI — Test Plan

**Scope:** 13 days development | 13 primary components | 56 sub-components  
**Target Coverage:** Unit 80% | Integration 70% | E2E 60%  
**Timeline:** 2026-05-28 to 2026-06-02

---

## 📋 Test Matrix

| Component | Type | Count | Coverage Target |
|-----------|------|-------|-----------------|
| Cost Calculations | Unit | 5 | 90% |
| Date Validations | Unit | 4 | 90% |
| Form Components | Unit | 10 | 85% |
| API Endpoints | Integration | 13 | 75% |
| Budget Constraints | Integration | 2 | 85% |
| Booking Workflow | E2E | 1 | 80% |
| Mobile Responsiveness | E2E | 1 | 75% |
| Approval Chain | E2E | 1 | 75% |
| **Total** | | **37** | **~80%** | |

---

## 🧪 Unit Tests (19 tests)

### Cost Calculations (5 tests)
```typescript
// test/lib/travel-costs.test.ts
describe('Travel Cost Calculations', () => {
  test('should calculate hotel cost (days × rate)', () => {
    const cost = calculateHotelCost(3, 100); // 3 nights @ $100
    expect(cost).toBe(300);
  });
  
  test('should apply discount for stays >7 days (10%)', () => {
    const cost = calculateHotelCost(10, 100);
    expect(cost).toBe(900); // 10 × 100 - 10% = 900
  });
  
  test('should calculate transport cost with distance multiplier', () => {
    const cost = calculateTransport(500, 0.1); // 500km @ ₹0.1/km
    expect(cost).toBe(50);
  });
  
  test('should calculate meal allowance (days × per-diem)', () => {
    const cost = calculateMeals(3, 25);
    expect(cost).toBe(75);
  });
  
  test('should sum total with tax (GST 18%)', () => {
    const subtotal = 300 + 50 + 75; // Hotel + transport + meals
    const total = applyGST(subtotal);
    expect(total).toBeCloseTo(501.18, 2);
  });
});
```

### Date Validations (4 tests)
```typescript
// test/lib/travel-dates.test.ts
describe('Travel Date Validations', () => {
  test('should reject end_date < start_date', () => {
    const valid = isValidDateRange('2026-06-15', '2026-06-14');
    expect(valid).toBe(false);
  });
  
  test('should reject past dates', () => {
    const valid = isValidDateRange('2026-01-01', '2026-01-05');
    expect(valid).toBe(false);
  });
  
  test('should allow 30-day advance booking window', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 25);
    const valid = isValidDateRange(formatDate(futureDate), formatDate(futureDate));
    expect(valid).toBe(true);
  });
  
  test('should calculate trip duration correctly', () => {
    const days = calculateTripDuration('2026-06-15', '2026-06-18');
    expect(days).toBe(3);
  });
});
```

### Form Components (10 tests)
```typescript
// test/components/travel-forms.test.tsx
describe('Travel Form Components', () => {
  test('should validate required fields (employee_name, destination, dates)', () => { /* ... */ });
  test('should validate email format', () => { /* ... */ });
  test('should validate phone number format', () => { /* ... */ });
  test('should suggest destinations from database', () => { /* ... */ });
  test('should show real-time cost calculation as user inputs', () => { /* ... */ });
  test('should display budget warning if over limit', () => { /* ... */ });
  test('should disable dates in past', () => { /* ... */ });
  test('should format currency input with ₹ symbol', () => { /* ... */ });
  test('should render itinerary preview', () => { /* ... */ });
  test('should show approval chain (manager → finance)', () => { /* ... */ });
});
```

---

## 🔗 Integration Tests (15 tests)

### API Endpoints (13 tests)
```typescript
// test/api/travel-api.test.ts
describe('Travel API', () => {
  test('POST /api/travel should create travel request', () => { /* ... */ });
  test('GET /api/travel should list user travel requests', () => { /* ... */ });
  test('GET /api/travel/:id should return travel details', () => { /* ... */ });
  test('PATCH /api/travel/:id should update pending request', () => { /* ... */ });
  test('DELETE /api/travel/:id should cancel travel', () => { /* ... */ });
  test('POST /api/travel/:id/approve should update status to approved', () => { /* ... */ });
  test('POST /api/travel/:id/reject should reject with reason', () => { /* ... */ });
  test('GET /api/travel/:id/itinerary should generate itinerary', () => { /* ... */ });
  test('GET /api/travel/:id/costs should return breakdown', () => { /* ... */ });
  test('GET /api/travel/destinations should return approved destinations', () => { /* ... */ });
  test('GET /api/travel/budget/:employee_id should check remaining budget', () => { /* ... */ });
  test('POST /api/travel/:id/expense-claim should create expense claim', () => { /* ... */ });
  test('GET /api/travel/reports?month=2026-06 should generate monthly report', () => { /* ... */ });
});
```

### Budget Constraints (2 tests)
```typescript
// test/integration/travel-budget.test.ts
describe('Travel Budget Constraints', () => {
  test('should prevent travel if total cost exceeds employee budget', () => {
    // Employee budget: ₹50,000/month
    // Proposed travel: ₹60,000
    // Expected: rejection with budget exceeded message
  });
  
  test('should track cumulative budget across multiple trips', () => {
    // Trip 1: ₹20,000
    // Trip 2: ₹30,000 (total ₹50,000)
    // Trip 3: ₹25,000 (would exceed ₹50,000 limit)
    // Expected: Trip 3 rejected
  });
});
```

---

## 🎭 E2E Tests (3 tests)

### Booking Workflow (1 test)
```typescript
test('should complete full travel booking workflow', async ({ page }) => {
  await page.goto('http://localhost:3000/app/travel/new');
  
  // Fill form
  await page.locator('input[name="employee_name"]').fill('John Doe');
  await page.locator('input[name="destination"]').fill('Hyderabad');
  await page.locator('input[name="start_date"]').fill('2026-06-15');
  await page.locator('input[name="end_date"]').fill('2026-06-18');
  await page.locator('input[name="purpose"]').fill('Customer meeting');
  
  // Verify cost calculation
  const costText = await page.locator('text=Total Cost:').textContent();
  expect(costText).toContain('₹');
  
  // Submit
  await page.locator('button:has-text("Submit for Approval")').click();
  
  // Verify confirmation
  await expect(page.locator('text=Request Submitted')).toBeVisible();
});
```

### Mobile Responsiveness (1 test)
```typescript
test('should be responsive on mobile (iPhone 12)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/app/travel/new');
  
  // Form fields should stack vertically
  const formItems = page.locator('[data-testid="form-item"]');
  const boundingBoxes = await formItems.evaluateAll(elements => {
    return elements.map(el => el.getBoundingClientRect().width);
  });
  
  // All fields should have similar width (full width on mobile)
  const widths = new Set(boundingBoxes);
  expect(widths.size).toBeLessThan(3); // Allow minor variations
  
  // All buttons should be ≥44px tall
  const buttons = page.locator('button');
  await buttons.evaluateAll(btns => {
    btns.forEach(btn => {
      const height = btn.getBoundingClientRect().height;
      if (height < 44) throw new Error(`Button height ${height}px < 44px`);
    });
  });
});
```

### Approval Chain (1 test)
```typescript
test('should route to correct approver based on cost', async ({ page }) => {
  // Travel <₹10,000 → manager approval
  // Travel ₹10,000-₹50,000 → finance approval
  // Travel >₹50,000 → CFO approval
  
  // Simulate travel request of ₹25,000
  const response = await fetch('http://localhost:3000/api/travel', {
    method: 'POST',
    body: JSON.stringify({
      destination: 'Mumbai',
      cost: 25000
    })
  });
  
  const { approver_level } = await response.json();
  expect(approver_level).toBe('finance'); // Should route to finance
});
```

---

## ✅ Success Criteria

- [ ] All 37 tests passing
- [ ] Coverage ≥80%
- [ ] Mobile: All buttons ≥44px, fields stack correctly
- [ ] Cost calculations accurate (±₹1)
- [ ] Budget enforcement: No over-budget approvals
- [ ] Approval chain: Correct routing by cost tier
- [ ] Accessibility: WCAG AA compliant
- [ ] Performance: Page load <3s

---

**Estimated Duration:** 10 hours (Day 1-3)  
**Owner:** Web Builder + QA Specialist

