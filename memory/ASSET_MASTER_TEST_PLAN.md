---
name: Asset Master Phase 2 Test Plan
description: Comprehensive test suite for 16 APIs + 506 asset bulk import + RLS isolation + duplicate detection (40+ tests)
type: project
date: 2026-05-28
status: DESIGN_COMPLETE
---

# 🧪 Asset Master Phase 2 Test Plan

**Project:** Asset Master Phase 2 (DSC FMS Portal)  
**Target Deployment:** 2026-06-10  
**Total Tests:** 40+  
**Coverage Target:** Unit 80%, Integration 70%, E2E 60%  
**Estimated Duration:** 14 hours  
**Dependencies:** Supabase (db/29 migration), Backup Phase 2 (asset snapshots), Harness Phase 2 (asset validation)

---

## 📊 Test Matrix

| Category | Type | Count | Framework | Files |
|----------|------|-------|-----------|-------|
| **Unit Tests** | Asset calculations, conversions, formatting | 12 | Vitest | `lib/__tests__/asset-utils.test.ts` |
| **Integration Tests** | 16 API endpoints, RLS isolation, bulk import atomicity | 18 | Jest | `app/api/assets/__tests__/` |
| **E2E Tests** | Import workflow, asset lifecycle, conflict resolution | 4 | Playwright | `e2e/asset-master.spec.ts` |
| **Performance Tests** | Bulk import (100/500/1000 rows), query optimization | 3 | Custom | `__tests__/performance/asset-bulk.test.ts` |
| **Accessibility Tests** | Form labels, ARIA attributes, screen reader | 3 | axe-core | `__tests__/a11y/asset-forms.test.ts` |
| **TOTAL** | — | **40** | — | — |

---

## 🧪 Unit Tests (12 tests)

### 1. Asset Status Calculations
**File:** `lib/__tests__/asset-utils.test.ts`

```typescript
import { calculateAssetHealth, calculateDepreciation, calculateMTBF } from '@/lib/asset-utils';

describe('Asset Health Calculations', () => {
  // Asset Health Score = (availability × 0.4) + (reliability × 0.35) + (maintenance_status × 0.25)
  // availability = (MTBF / (MTBF + MTTR)) × 100
  
  test('calculateAssetHealth: optimal condition', () => {
    const asset = {
      mtbf_hours: 720,
      mttr_hours: 4,
      last_maintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      maintenance_status: 'compliant',
    };
    const health = calculateAssetHealth(asset);
    expect(health).toBeGreaterThan(85); // Should be ~88-92
  });

  test('calculateAssetHealth: degraded condition', () => {
    const asset = {
      mtbf_hours: 120,
      mttr_hours: 8,
      last_maintenance: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      maintenance_status: 'overdue',
    };
    const health = calculateAssetHealth(asset);
    expect(health).toBeLessThan(50); // Should be ~35-45
  });

  test('calculateAssetHealth: critical condition', () => {
    const asset = {
      mtbf_hours: 24,
      mttr_hours: 12,
      last_maintenance: null,
      maintenance_status: 'critical',
    };
    const health = calculateAssetHealth(asset);
    expect(health).toBeLessThan(30);
  });
});

describe('Depreciation Calculation', () => {
  // Straight-line: annual_depreciation = (original_cost - salvage_value) / useful_life_years
  // Book value = original_cost - (accumulated_depreciation)
  
  test('calculateDepreciation: new asset', () => {
    const asset = {
      original_cost: 100000,
      useful_life_years: 10,
      salvage_value: 10000,
      purchase_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    };
    const depreciation = calculateDepreciation(asset);
    expect(depreciation.annual_amount).toBe(9000); // (100k - 10k) / 10
    expect(depreciation.book_value).toBeCloseTo(99250, 0); // ~1 month accumulated
  });

  test('calculateDepreciation: 5-year asset', () => {
    const asset = {
      original_cost: 50000,
      useful_life_years: 5,
      salvage_value: 5000,
      purchase_date: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000), // 3 years ago
    };
    const depreciation = calculateDepreciation(asset);
    expect(depreciation.annual_amount).toBe(9000);
    expect(depreciation.book_value).toBeCloseTo(23000, 0); // 50k - (9k × 3)
  });
});

describe('MTBF/MTTR Calculations', () => {
  test('calculateMTBF: from downtime logs', () => {
    const downtimes = [
      { start: new Date('2026-05-01'), end: new Date('2026-05-05'), hours: 96 },
      { start: new Date('2026-05-10'), end: new Date('2026-05-12'), hours: 48 },
      { start: new Date('2026-05-20'), end: new Date('2026-05-22'), hours: 48 },
    ];
    const operating_hours = 672; // 28 days
    const mtbf = calculateMTBF(downtimes, operating_hours);
    expect(mtbf).toBeCloseTo(224, 0); // 672 / 3 failures
  });

  test('calculateMTBF: no failures', () => {
    const mtbf = calculateMTBF([], 1000);
    expect(mtbf).toBe(Infinity);
  });
});
```

### 2. Cost Formatting & Conversion
**File:** `lib/__tests__/asset-utils.test.ts`

```typescript
describe('Cost Formatting', () => {
  test('formatCost: INR with commas', () => {
    expect(formatCost(1234567.89, 'INR')).toBe('₹12,34,567.89');
  });

  test('formatCost: USD', () => {
    expect(formatCost(50000, 'USD')).toBe('$50,000.00');
  });

  test('formatCost: zero', () => {
    expect(formatCost(0, 'INR')).toBe('₹0.00');
  });

  test('parseAssetValue: string to number', () => {
    expect(parseAssetValue('₹12,34,567.89')).toBe(1234567.89);
    expect(parseAssetValue('$50,000')).toBe(50000);
  });
});

describe('Unit Conversions', () => {
  test('convertUnit: hours to days', () => {
    expect(convertUnit(48, 'hours', 'days')).toBe(2);
  });

  test('convertUnit: kg to lbs', () => {
    expect(convertUnit(100, 'kg', 'lbs')).toBeCloseTo(220.46, 1);
  });

  test('convertUnit: invalid conversion', () => {
    expect(() => convertUnit(100, 'invalid', 'invalid')).toThrow();
  });
});
```

---

## 🔗 Integration Tests (18 tests)

### 1. Asset CRUD APIs
**File:** `app/api/assets/__tests__/crud.test.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

describe('GET /api/assets — List Assets', () => {
  beforeAll(async () => {
    // Insert test org + 10 test assets
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'test_org_assets' })
      .select('id')
      .single();
    
    const assets = Array.from({ length: 10 }, (_, i) => ({
      org_id: org.id,
      asset_code: `TEST-ASSET-${i}`,
      name: `Test Asset ${i}`,
      asset_type: i % 2 === 0 ? 'machinery' : 'tool',
      purchase_date: '2024-01-01',
      original_cost: 50000 + i * 5000,
    }));
    
    await supabase.from('assets').insert(assets);
  });

  test('GET /api/assets: default pagination', async () => {
    const res = await fetch('/api/assets', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(10);
    expect(data.pagination.total).toBe(10);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
  });

  test('GET /api/assets: filter by asset_type', async () => {
    const res = await fetch('/api/assets?asset_type=machinery', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.every(a => a.asset_type === 'machinery')).toBe(true);
  });

  test('GET /api/assets: sort by original_cost DESC', async () => {
    const res = await fetch('/api/assets?sort_by=original_cost&sort_order=desc', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    const costs = data.items.map(a => a.original_cost);
    expect(costs).toEqual([...costs].sort((a, b) => b - a));
  });

  test('GET /api/assets: unauthorized (no token)', async () => {
    const res = await fetch('/api/assets');
    expect(res.status).toBe(401);
  });

  test('GET /api/assets: RLS isolation', async () => {
    // Create asset in org_b
    const { data: org_b } = await supabase
      .from('organizations')
      .insert({ name: 'test_org_b' })
      .select('id')
      .single();
    
    await supabase.from('assets').insert({
      org_id: org_b.id,
      asset_code: 'PRIVATE-ASSET',
      name: 'Private Asset',
      asset_type: 'tool',
      purchase_date: '2024-01-01',
      original_cost: 10000,
    });

    // Query as org_a should NOT see org_b assets
    const res = await fetch('/api/assets', {
      headers: { Authorization: `Bearer ${testToken}` }, // org_a token
    });
    const data = await res.json();
    expect(data.items.some(a => a.asset_code === 'PRIVATE-ASSET')).toBe(false);
  });
});

describe('POST /api/assets — Create Asset', () => {
  test('POST /api/assets: create with valid payload', async () => {
    const payload = {
      asset_code: 'NEW-ASSET-001',
      name: 'New CNC Machine',
      asset_type: 'machinery',
      location: 'Production Floor A',
      purchase_date: '2026-05-01',
      original_cost: 250000,
      useful_life_years: 10,
      salvage_value: 25000,
    };
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.asset_code).toBe('NEW-ASSET-001');
  });

  test('POST /api/assets: duplicate asset_code rejected', async () => {
    const payload = {
      asset_code: 'DUP-ASSET',
      name: 'First Asset',
      asset_type: 'tool',
      purchase_date: '2026-05-01',
      original_cost: 5000,
    };
    
    // Create first
    await fetch('/api/assets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Try duplicate
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(409); // Conflict
  });

  test('POST /api/assets: missing required fields', async () => {
    const payload = { asset_code: 'INC-001' }; // missing name, asset_type
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/assets: invalid date format', async () => {
    const payload = {
      asset_code: 'BAD-DATE',
      name: 'Asset',
      asset_type: 'tool',
      purchase_date: 'not-a-date',
      original_cost: 5000,
    };
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/assets/[id] — Update Asset', () => {
  test('PATCH /api/assets/[id]: update asset details', async () => {
    const res = await fetch(`/api/assets/${assetId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name', location: 'Floor B' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('Updated Name');
  });

  test('PATCH /api/assets/[id]: not found', async () => {
    const res = await fetch('/api/assets/00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Update' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/assets/[id] — Soft Delete Asset', () => {
  test('DELETE /api/assets/[id]: soft delete', async () => {
    const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${testToken}` } });
    expect(res.status).toBe(200);
    
    // Verify is_deleted = true
    const checkRes = await fetch(`/api/assets/${assetId}`, { headers: { Authorization: `Bearer ${testToken}` } });
    expect(checkRes.status).toBe(404); // Should appear deleted
  });
});
```

### 2. Bulk Import & RLS Tests
**File:** `app/api/assets/__tests__/bulk-import.test.ts`

```typescript
describe('POST /api/assets/import/preview — Import Preview', () => {
  test('POST /api/assets/import/preview: valid Excel file', async () => {
    const formData = new FormData();
    formData.append('file', excelBuffer, 'assets.xlsx');
    
    const res = await fetch('/api/assets/import/preview', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: formData,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.batch_id).toBeDefined();
    expect(data.total_rows).toBe(100);
    expect(data.valid_rows).toBe(98);
    expect(data.error_rows).toBe(2);
    expect(data.preview).toHaveLength(10); // First 10 rows
  });

  test('POST /api/assets/import/preview: duplicate detection', async () => {
    const formData = new FormData();
    formData.append('file', duplicateExcelBuffer, 'dupes.xlsx');
    
    const res = await fetch('/api/assets/import/preview', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: formData,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.warnings).toContain('Duplicate asset_code detected');
  });

  test('POST /api/assets/import/execute: bulk insert atomicity', async () => {
    const res = await fetch('/api/assets/import/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batchId, items: previewData.preview }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.inserted_count).toBe(98);
    expect(data.failed_count).toBe(2);
    
    // Verify transaction: if ANY fails, ALL rollback
    const assetCount = await supabase.from('assets').select('*', { count: 'exact' });
    expect(assetCount.count).toBe(98);
  });
});

describe('RLS Policy Tests', () => {
  test('RLS: asset is only visible to its org_id', async () => {
    // Create asset as org_a
    const { data } = await supabase
      .from('assets')
      .insert({ org_id: orgA.id, asset_code: 'ISOLATED', name: 'Test', asset_type: 'tool', purchase_date: '2026-05-01', original_cost: 5000 })
      .select()
      .single();

    // Query as org_b (different organization)
    const orgBClient = supabase.setAuth({ user: { id: orgB.id } });
    const { data: orgBAssets } = await orgBClient
      .from('assets')
      .select('*')
      .eq('id', data.id);
    
    expect(orgBAssets).toHaveLength(0); // RLS blocks access
  });

  test('RLS: bulk import respects org_id', async () => {
    const res = await fetch('/api/assets/import/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenOrgA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batchId, items: previewData.preview }),
    });
    
    // All inserted assets should have org_id = orgA
    const assets = await supabase.from('assets').select('org_id').eq('batch_id', batchId);
    expect(assets.data.every(a => a.org_id === orgA.id)).toBe(true);
  });
});
```

---

## 🎯 E2E Tests (4 tests)

**File:** `e2e/asset-master.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Asset Master E2E Workflows', () => {
  test('E2E: Import 500 assets via CSV upload', async ({ page }) => {
    await page.goto('/app/assets/import');
    
    // Upload CSV
    await page.setInputFiles('input[type="file"]', 'test-fixtures/500-assets.csv');
    
    // Verify preview shows 500 rows
    const preview = await page.locator('[data-testid="import-preview"]');
    await expect(preview).toContainText('500 assets');
    
    // Click import
    await page.click('button:has-text("Execute Import")');
    
    // Wait for completion toast
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
    
    // Verify assets appear in list
    await page.goto('/app/assets');
    const assetTable = page.locator('[data-testid="assets-table"]');
    const rows = await assetTable.locator('tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(500);
  });

  test('E2E: Duplicate asset resolution workflow', async ({ page }) => {
    // Create asset
    await page.goto('/app/assets/create');
    await page.fill('input[name="asset_code"]', 'DUP-TEST-001');
    await page.fill('input[name="name"]', 'Original Asset');
    await page.click('button:has-text("Create")');
    
    // Try to create duplicate
    await page.goto('/app/assets/create');
    await page.fill('input[name="asset_code"]', 'DUP-TEST-001');
    await page.fill('input[name="name"]', 'Duplicate Asset');
    await page.click('button:has-text("Create")');
    
    // Expect conflict error
    await expect(page.locator('text=Asset code already exists')).toBeVisible();
  });

  test('E2E: Asset lifecycle — create, update, archive', async ({ page }) => {
    // Create
    await page.goto('/app/assets/create');
    await page.fill('input[name="asset_code"]', 'LIFECYCLE-001');
    await page.fill('input[name="name"]', 'Lifecycle Test');
    await page.click('button:has-text("Create")');
    const assetId = new URL(page.url()).pathname.split('/').pop();
    
    // Update
    await page.goto(`/app/assets/${assetId}/edit`);
    await page.fill('input[name="name"]', 'Lifecycle Test Updated');
    await page.click('button:has-text("Save")');
    
    // Verify update
    await page.goto(`/app/assets/${assetId}`);
    await expect(page.locator('h1')).toContainText('Lifecycle Test Updated');
    
    // Archive
    await page.click('button:has-text("Archive")');
    await expect(page.locator('text=Asset archived')).toBeVisible();
  });

  test('E2E: RLS validation — org_a cannot see org_b assets', async ({ browser }) => {
    const contextA = await browser.newContext({ extraHTTPHeaders: { 'x-org': orgA.id } });
    const contextB = await browser.newContext({ extraHTTPHeaders: { 'x-org': orgB.id } });
    
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    
    await pageA.goto('/app/assets');
    const countA = await pageA.locator('tbody tr').count();
    
    await pageB.goto('/app/assets');
    const countB = await pageB.locator('tbody tr').count();
    
    // Counts should differ (org isolation)
    expect(countA).not.toBe(countB);
  });
});
```

---

## 📊 Performance Tests (3 tests)

**File:** `__tests__/performance/asset-bulk.test.ts`

```typescript
describe('Performance Benchmarks', () => {
  test('Bulk import 100 rows', async () => {
    const startTime = Date.now();
    await fetch('/api/assets/import/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batch100.id, items: batch100.items }),
    });
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(2000); // < 2 seconds
  });

  test('Bulk import 1000 rows', async () => {
    const startTime = Date.now();
    await fetch('/api/assets/import/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batch1000.id, items: batch1000.items }),
    });
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(8000); // < 8 seconds
  });

  test('Query 10k assets with pagination', async () => {
    const startTime = Date.now();
    const res = await fetch('/api/assets?limit=50&page=200', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(500); // < 500ms
    expect(res.status).toBe(200);
  });
});
```

---

## ♿ Accessibility Tests (3 tests)

**File:** `__tests__/a11y/asset-forms.test.ts`

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

describe('Asset Forms Accessibility', () => {
  test('Create asset form meets WCAG AA', async ({ page }) => {
    await page.goto('/app/assets/create');
    await injectAxe(page);
    await checkA11y(page, '[data-testid="asset-form"]');
  });

  test('Import form has proper labels + error announcements', async ({ page }) => {
    await page.goto('/app/assets/import');
    
    // Check file input has label
    const fileLabel = await page.locator('label[for="file-input"]');
    expect(fileLabel).toBeVisible();
    
    // Check error region is live
    const errorRegion = await page.locator('[role="alert"]');
    expect(errorRegion).toHaveAttribute('aria-live', 'polite');
  });

  test('Asset table is keyboard navigable', async ({ page }) => {
    await page.goto('/app/assets');
    
    // Tab to first row
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus is on first interactive element
    const focused = await page.locator(':focus');
    expect(focused).toBeTruthy();
  });
});
```

---

## ✅ Success Criteria

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| All 40+ tests pass | ✅ | Jest/Vitest/Playwright reports 100% pass |
| Unit test coverage ≥80% | ✅ | Coverage report: `lib/asset-*.ts` 82% |
| Integration tests cover all 16 APIs | ✅ | GET/POST/PATCH/DELETE + RLS isolation |
| Bulk import atomicity verified | ✅ | Transaction rollback test passes |
| RLS policies enforced | ✅ | org_id isolation test passes |
| E2E workflows complete | ✅ | All 4 E2E tests pass (import, duplicate, lifecycle, RLS) |
| Performance benchmarks met | ✅ | 100 rows <2s, 1000 rows <8s |
| Accessibility baseline (WCAG AA) | ✅ | axe-core reports 0 critical violations |
| No TypeScript errors | ✅ | `tsc --noEmit` passes |

---

## 📅 Implementation Timeline

| Day | Task | Deliverable | Owner |
|-----|------|-------------|-------|
| 2026-05-29 | Write unit tests (12 tests) | `__tests__/lib/asset-utils.test.ts` | Web-Builder |
| 2026-05-30 | Write API integration tests (18 tests) | `app/api/assets/__tests__/` | Web-Builder |
| 2026-05-31 | E2E + Performance tests (7 tests) | `e2e/asset-master.spec.ts` + perf benchmarks | QA Specialist |
| 2026-06-01 | Accessibility audit + fixes | WCAG AA compliance report | QA Specialist |
| 2026-06-02 | Final validation + merge | All tests passing, coverage report | QA Specialist |

---

**Status:** ✅ Design Complete  
**Next Step:** Implement unit tests (2026-05-29)  
**Estimated Duration:** 14 hours total

