---
name: Integrated Test Strategy — Phase C #14 QA Specialist
description: Comprehensive testing strategy for 7 parallel DSC FMS projects (2026-05-28 to 2026-06-02)
type: project
date: 2026-05-28
status: DESIGN_COMPLETE
deadline: 2026-06-02 18:00 KST
---

# 🎯 Integrated Test Strategy — DSC FMS Phase 2 Projects (2026-06-02)

**Scope:** 7 parallel projects | **Test Coverage Target:** Unit 80%+ | Integration 70%+ | E2E 60%+  
**Timeline:** 2026-05-28 to 2026-06-02 (6 days) | **Frameworks:** Jest, Vitest, Playwright  
**Environments:** Local dev, staging.supabase.com, Vercel preview, production

---

## 📊 7-Project Test Matrix

| Project | Status | APIs | Components | DB Tables | RLS Policies | Test Gap | Priority |
|---------|--------|------|-----------|-----------|--------------|----------|----------|
| 1. Discord Bot Phase 1 | ✅ Deployed | 5 | 5 processors | 2 | org isolation | E2E signature verification | 🔴 CRITICAL |
| 2. Team Dashboard Phase 2 | 🟡 UI Building | 12 | 20+ components | 3 | org/role-based | E2E role transitions | 🔴 CRITICAL |
| 3. Travel Phase 2 UI | 🟡 Day 2 | 13 | 56 sub-components | 8 | org isolation | Mobile responsiveness | 🟡 HIGH |
| 4. Asset Master Phase 2 | 🟡 API 100% | 16 | Import UI | 5 | org isolation | Bulk import atomicity | 🔴 CRITICAL |
| 5. Backup App Phase 2 | 🟡 API 30% | 18 | UI pending | 4 | org/archive | Performance (large datasets) | 🟡 HIGH |
| 6. Harness Engineering Phase 2 | 📐 Design done | 12 | 4 pages | 4 | org isolation | Conflict detection logic | 🟡 HIGH |
| 7. Memory Automation Phase 2 | 🟡 Phase 2B | 4 APIs + cron | N/A | N/A | N/A | Duplicate detection tuning | 🟠 MEDIUM |

**Total Coverage:** 80+ API endpoints | 120+ React components | 26 DB tables | 35+ RLS policies

---

## 🔬 3-Stage Testing Strategy

### Stage 1: Unit Tests (Pure Functions, Components, Utilities)
**Target Coverage:** ≥80% new code  
**Framework:** Jest (Node.js APIs), Vitest (React components)  
**Timeline:** Day 1-2 (2026-05-28 to 2026-05-29)

#### 1.1 API Unit Tests

**Discord Bot Signature Verification** (`lib/discord/verify-signature.test.ts`)
```typescript
import { verifyDiscordSignature } from '@/lib/discord/verify-signature';

describe('Discord Signature Verification', () => {
  const PUBLIC_KEY = 'test-public-key';
  
  test('should verify valid Ed25519 signature', () => {
    const payload = { type: 1, token: 'test-token' };
    const signature = 'valid-signature'; // pre-computed
    
    expect(verifyDiscordSignature(JSON.stringify(payload), signature, PUBLIC_KEY))
      .toBe(true);
  });
  
  test('should reject tampered payload', () => {
    const signature = 'valid-signature';
    const tamperedPayload = { type: 1, token: 'wrong-token' };
    
    expect(verifyDiscordSignature(JSON.stringify(tamperedPayload), signature, PUBLIC_KEY))
      .toBe(false);
  });
  
  test('should reject missing signature header', () => {
    expect(verifyDiscordSignature('{}', undefined, PUBLIC_KEY))
      .toBe(false);
  });
});
```

**Asset Master Duplicate Detection** (`lib/assets/detect-duplicates.test.ts`)
```typescript
import { detectDuplicates } from '@/lib/assets/detect-duplicates';

describe('Asset Duplicate Detection', () => {
  test('should identify exact duplicates (same asset code)', () => {
    const items = [
      { asset_code: 'JIG-001', name: 'Test Jig' },
      { asset_code: 'JIG-001', name: 'Test Jig' }
    ];
    const duplicates = detectDuplicates(items);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].type).toBe('exact');
  });
  
  test('should identify fuzzy duplicates (similar codes)', () => {
    const items = [
      { asset_code: 'JIG-001', name: 'Jig A' },
      { asset_code: 'JIG-001A', name: 'Jig A variant' }
    ];
    const duplicates = detectDuplicates(items);
    expect(duplicates[0].similarity).toBeGreaterThan(0.85);
  });
  
  test('should handle empty input', () => {
    expect(detectDuplicates([])).toEqual([]);
  });
});
```

**Travel Cost Calculation** (`lib/travel/calculate-costs.test.ts`)
```typescript
import { calculateTravelCost } from '@/lib/travel/calculate-costs';

describe('Travel Cost Calculation', () => {
  const rates = { hotel: 100, transport: 50, meal: 25 };
  
  test('should calculate total cost correctly', () => {
    const travel = {
      days: 3,
      hotel_per_day: 100,
      transport: 150,
      meals: 75
    };
    expect(calculateTravelCost(travel, rates)).toBe(425);
  });
  
  test('should apply discount for long trips (>7 days)', () => {
    const travel = { days: 10, hotel_per_day: 100, transport: 200, meals: 100 };
    const cost = calculateTravelCost(travel, rates);
    expect(cost).toBeLessThan(10 * 100 + 200 + 100); // 10% discount
  });
});
```

**Harness Conflict Detection** (`lib/harness/detect-conflicts.test.ts`)
```typescript
import { detectConflicts } from '@/lib/harness/detect-conflicts';

describe('Harness Conflict Detection', () => {
  test('should detect time overlap conflicts', () => {
    const schedule = {
      scheduled_date: '2026-06-01',
      shift: 'A',
      planned_downtime_minutes: 120
    };
    const plan = {
      scheduled_start: '2026-06-01 08:00',
      duration_minutes: 90
    };
    
    const conflicts = detectConflicts([schedule], [plan]);
    expect(conflicts[0].type).toBe('time_overlap');
  });
  
  test('should detect resource contention conflicts', () => {
    // Schedule uses asset 1
    // Plan requires asset 1
    const conflicts = detectConflicts([schedule1], [plan1]);
    expect(conflicts[0].type).toBe('resource_contention');
  });
});
```

#### 1.2 Component Unit Tests

**Team Dashboard Performance Card** (`components/PerformanceCard.test.tsx`)
```typescript
import { render, screen } from '@testing-library/react';
import { PerformanceCard } from '@/components/PerformanceCard';

describe('PerformanceCard Component', () => {
  test('should render KPI metrics correctly', () => {
    const props = {
      oee_percentage: 85.5,
      downtime_hours: 2.5,
      quality_rate: 98.2,
      efficiency_rate: 92.0
    };
    
    render(<PerformanceCard {...props} />);
    expect(screen.getByText('OEE: 85.5%')).toBeInTheDocument();
    expect(screen.getByText('Downtime: 2.5h')).toBeInTheDocument();
  });
  
  test('should show trend indicator (↑ for improving)', () => {
    render(<PerformanceCard oee_percentage={85.5} trend={2.3} />);
    expect(screen.getByText('↑ +2.3%')).toBeInTheDocument();
  });
});
```

**Travel Itinerary Timeline** (`components/ItineraryTimeline.test.tsx`)
```typescript
import { render, screen } from '@testing-library/react';
import { ItineraryTimeline } from '@/components/ItineraryTimeline';

describe('ItineraryTimeline Component', () => {
  test('should render all itinerary items in chronological order', () => {
    const items = [
      { date: '2026-06-01', event: 'Departure', time: '10:00' },
      { date: '2026-06-02', event: 'Arrival', time: '14:30' },
      { date: '2026-06-03', event: 'Meeting', time: '09:00' }
    ];
    
    render(<ItineraryTimeline items={items} />);
    const lines = screen.getAllByText(/Departure|Arrival|Meeting/);
    expect(lines.length).toBe(3);
  });
});
```

#### 1.3 Utility Function Tests
- Aggregation functions (groupConflictsBySeverity, calculateMetrics)
- Data transformation (formatDate, formatCurrency)
- Validation helpers (isValidEmail, isValidPhone)
- Crypto utilities (generateToken, hashPassword)

**Target:** 50+ unit tests across all projects

---

### Stage 2: Integration Tests (API ↔ Database ↔ RLS)
**Target Coverage:** ≥70% API routes  
**Framework:** Jest with supertest + Supabase test client  
**Timeline:** Day 2-3 (2026-05-29 to 2026-05-30)

#### 2.1 Supabase Auth & RLS Integration

**RLS Policy Isolation Test** (`tests/integration/rls-isolation.test.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

describe('RLS Policy Isolation', () => {
  // User from org_id = 'org-alpha'
  const userAlpha = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: true } });
  // User from org_id = 'org-beta'
  const userBeta = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: true } });
  
  beforeAll(async () => {
    // Create test orgs and users
    await createTestOrg('org-alpha', userAlpha);
    await createTestOrg('org-beta', userBeta);
  });
  
  test('should prevent cross-org asset access', async () => {
    // User Alpha creates asset
    const { data: asset } = await userAlpha
      .from('assets')
      .insert({ asset_code: 'CROSS-001', org_id: 'org-alpha' });
    
    // User Beta tries to read Alpha's asset
    const { data: result } = await userBeta
      .from('assets')
      .select('*')
      .eq('id', asset.id);
    
    expect(result).toBeNull(); // RLS blocks access
  });
  
  test('should allow same-org asset access', async () => {
    // User Alpha creates asset
    const { data: asset } = await userAlpha
      .from('assets')
      .insert({ asset_code: 'SAME-001', org_id: 'org-alpha' });
    
    // Another user from org-alpha reads it
    const { data: result } = await userAlpha
      .from('assets')
      .select('*')
      .eq('id', asset.id);
    
    expect(result).toHaveLength(1);
  });
});
```

**Discord Bot API Integration** (`tests/integration/discord-api.test.ts`)
```typescript
describe('Discord Bot API Integration', () => {
  const client = request(app);
  
  test('should sync Telegram message to Discord', async () => {
    const response = await client
      .post('/api/discord/sync')
      .send({
        telegram_message_id: 'tg-12345',
        content: 'Test message',
        user_id: 'user-1'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.discord_message_id).toBeDefined();
    
    // Verify in database
    const { data } = await supabase
      .from('message_sync')
      .select('*')
      .eq('telegram_message_id', 'tg-12345');
    
    expect(data[0].discord_message_id).toBe(response.body.discord_message_id);
  });
  
  test('should handle duplicate Telegram messages', async () => {
    // Send same message twice
    await client.post('/api/discord/sync').send({ telegram_message_id: 'tg-dupe', content: 'Dupe' });
    const response = await client.post('/api/discord/sync').send({ telegram_message_id: 'tg-dupe', content: 'Dupe' });
    
    expect(response.status).toBe(409); // Conflict
  });
});
```

**Asset Master Bulk Import RLS Test** (`tests/integration/asset-bulk-import.test.ts`)
```typescript
describe('Asset Bulk Import with RLS', () => {
  test('should enforce org isolation during bulk import', async () => {
    const userAlpha = getAuthClient('org-alpha');
    const userBeta = getAuthClient('org-beta');
    
    // User Alpha imports assets
    const { data: batch } = await userAlpha
      .from('asset_import_batches')
      .insert({ org_id: 'org-alpha', status: 'pending' });
    
    // User Beta tries to read batch
    const { data: result } = await userBeta
      .from('asset_import_batches')
      .select('*')
      .eq('id', batch.id);
    
    expect(result).toBeNull();
  });
  
  test('should validate bulk insert transaction atomicity', async () => {
    const items = Array(100).fill({ asset_code: 'BULK-XXX', org_id: 'org-test' });
    items[50].asset_code = null; // Inject invalid item
    
    const { error } = await supabase.rpc('bulk_insert_assets', {
      org_id: 'org-test',
      items: items
    });
    
    expect(error).toBeDefined(); // Should rollback entire transaction
    
    // Verify nothing was inserted
    const { count } = await supabase
      .from('assets')
      .select('*', { count: 'exact' })
      .eq('org_id', 'org-test');
    
    expect(count).toBe(0);
  });
});
```

#### 2.2 API Endpoint Tests

**Team Dashboard API Tests** (`tests/integration/dashboard-api.test.ts`)
```typescript
describe('Team Dashboard API', () => {
  const client = request(app);
  const authToken = getTestToken('org-alpha');
  
  test('GET /api/dashboard/performance should return org-scoped metrics', async () => {
    const response = await client
      .get('/api/dashboard/performance')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.oee_percentage).toBeGreaterThanOrEqual(0);
    expect(response.body.org_id).toBe('org-alpha'); // Verify org scoping
  });
  
  test('POST /api/dashboard/goals should create goal within org', async () => {
    const response = await client
      .post('/api/dashboard/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        goal_name: 'Q2 OEE Target',
        target_percentage: 90,
        deadline: '2026-06-30'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.org_id).toBe('org-alpha');
  });
});
```

#### 2.3 Cross-API Integration
- Asset Master → Harness (asset validation)
- Travel → Backup (backup of travel records)
- Harness → Asset Master (conflict detection with assets)
- Memory Automation → All projects (duplicate detection across entities)

**Target:** 40+ integration tests

---

### Stage 3: End-to-End Tests (Full User Workflows)
**Target Coverage:** ≥60% critical paths  
**Framework:** Playwright  
**Timeline:** Day 3-4 (2026-05-30 to 2026-05-31)

#### 3.1 Discord Bot E2E

**User Story:** "Telegram user sends message → Discord bot syncs → Audit log records"

```typescript
import { test, expect } from '@playwright/test';

test.describe('Discord Bot Message Sync E2E', () => {
  test('should sync Telegram message to Discord with audit trail', async ({ page }) => {
    // 1. Telegram message arrives (simulated via API)
    const telegramResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify({
        update_id: 123,
        message: {
          message_id: 456,
          from: { id: 'user-1', first_name: 'John' },
          text: 'Hello Discord!',
          date: Math.floor(Date.now() / 1000)
        }
      })
    });
    expect(telegramResponse.status).toBe(200);
    
    // 2. Wait for Discord sync
    await page.waitForTimeout(2000);
    
    // 3. Verify message appears in sync dashboard
    await page.goto('http://localhost:3000/app/discord/sync-history');
    await expect(page.locator('text=Hello Discord!')).toBeVisible();
    
    // 4. Verify audit log entry
    const auditRows = page.locator('table tbody tr');
    const count = await auditRows.count();
    expect(count).toBeGreaterThan(0);
    
    const lastRow = auditRows.last();
    await expect(lastRow.locator('text=message_sync')).toBeVisible();
  });
});
```

#### 3.2 Asset Master Import E2E

**User Story:** "Admin uploads Excel → System validates/deduplicates → Imports to DB → Displays in Asset List"

```typescript
test('should complete asset import workflow end-to-end', async ({ page }) => {
  await page.goto('http://localhost:3000/app/assets/import');
  
  // 1. Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('fixtures/test-assets.xlsx');
  
  // 2. Preview shows duplicate detection
  await expect(page.locator('text=Duplicates Detected: 3')).toBeVisible();
  
  // 3. User reviews and approves import
  await page.locator('button:has-text("Approve & Import")').click();
  
  // 4. Progress indicator shows completion
  await expect(page.locator('text=Import Complete')).toBeVisible({ timeout: 10000 });
  
  // 5. Assets appear in Asset List
  await page.goto('http://localhost:3000/app/assets');
  const assetCount = await page.locator('table tbody tr').count();
  expect(assetCount).toBeGreaterThan(0);
  
  // 6. Verify RLS: Different org cannot see imported assets
  await page.context().addCookies([{ name: 'org_id', value: 'other-org' }]);
  await page.reload();
  const otherOrgCount = await page.locator('table tbody tr').count();
  expect(otherOrgCount).toBe(0);
});
```

#### 3.3 Travel Booking E2E

**User Story:** "Manager creates travel request → Approver reviews → System books hotels/transport → Generates itinerary"

```typescript
test('should complete travel booking workflow', async ({ page }) => {
  await page.goto('http://localhost:3000/app/travel/new');
  
  // Fill form
  await page.locator('input[name="employee_name"]').fill('John Doe');
  await page.locator('input[name="destination"]').fill('Hyderabad');
  await page.locator('input[name="start_date"]').fill('2026-06-15');
  await page.locator('input[name="end_date"]').fill('2026-06-18');
  
  await page.locator('button:has-text("Submit for Approval")').click();
  
  // 2. Approver reviews
  await page.goto('http://localhost:3000/app/travel/pending');
  await page.locator('button:has-text("Approve")').click();
  
  // 3. System generates itinerary
  await expect(page.locator('text=Hotel: 3 nights')).toBeVisible();
  await expect(page.locator('text=Transport: ₹5,000')).toBeVisible();
  
  // 4. Mobile responsiveness check
  await page.setViewportSize({ width: 375, height: 667 });
  const visibleText = await page.locator('body').textContent();
  expect(visibleText).toContain('Hotel');
});
```

#### 3.4 Mobile E2E Tests
- Team Dashboard on iPhone 12
- Asset Import on Android
- Travel Booking on iPad

**Target:** 15+ E2E test scenarios (critical paths only)

---

## 🔐 Supabase Testing Deep Dive

### Auth Integration Testing

**OAuth Token Validation** (`tests/supabase/auth-oauth.test.ts`)
```typescript
describe('Supabase OAuth Integration', () => {
  test('should exchange OAuth code for JWT', async () => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'oauth-code-from-google',
        grant_type: 'authorization_code'
      })
    });
    
    const { access_token } = await response.json();
    expect(access_token).toBeDefined();
    
    // Verify JWT can access protected endpoint
    const authed = await fetch(`${SUPABASE_URL}/rest/v1/profile`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    expect(authed.status).not.toBe(401);
  });
  
  test('should revoke token on logout', async () => {
    const token = getValidJWT();
    
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Verify token no longer works
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status).toBe(401);
  });
});
```

### RLS Policy Validation

**Complex RLS: Role-Based Access** (`tests/supabase/rls-roles.test.ts`)
```typescript
describe('RLS with Role-Based Access', () => {
  test('should restrict Team Dashboard access by role', async () => {
    // Admin can read performance metrics
    const adminClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { users: { 'admin-user': { role: 'admin' } } }
    });
    
    const { data: metrics } = await adminClient
      .from('performance_metrics')
      .select('*');
    
    expect(metrics).not.toBeNull();
    
    // Operator (read-only) cannot update goals
    const operatorClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { users: { 'operator-user': { role: 'operator' } } }
    });
    
    const { error } = await operatorClient
      .from('performance_goals')
      .update({ target_percentage: 95 })
      .eq('id', 'goal-1');
    
    expect(error).toBeDefined(); // RLS denies update
  });
});
```

### Realtime Subscriptions Testing

**Realtime Sync Validation** (`tests/supabase/realtime.test.ts`)
```typescript
describe('Supabase Realtime Subscriptions', () => {
  test('should sync asset updates across clients', async () => {
    const client1 = createClient(SUPABASE_URL, ANON_KEY);
    const client2 = createClient(SUPABASE_URL, ANON_KEY);
    
    let updateReceived = false;
    
    client2
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets' },
        payload => { updateReceived = true; }
      )
      .subscribe();
    
    // Client 1 updates asset
    await client1
      .from('assets')
      .update({ status: 'active' })
      .eq('id', 'asset-1');
    
    // Wait for realtime message
    await new Promise(resolve => setTimeout(resolve, 500));
    
    expect(updateReceived).toBe(true);
  });
});
```

---

## 🧪 Test Data Strategy & Fixtures

### Test Data Hierarchy

**Layer 1: Minimal Test Data (Unit Tests)**
- Single record fixtures for isolation testing
- Example: One `asset` record, one `user` record
- Lifetime: Duration of single test

**Layer 2: Realistic Test Data (Integration Tests)**
- Complete datasets reflecting production structure
- Example: 10 assets + bulk import batch + deduplication results
- Lifetime: Duration of test suite (auto-cleanup after)

**Layer 3: Load Test Data (Performance Tests)**
- Large datasets (100K+ records)
- Example: 500K assets across 10 orgs
- Lifetime: Dedicated staging environment

### Test Fixture Factory Pattern

**Asset Fixtures** (`tests/fixtures/assets.ts`)
```typescript
export const createTestAsset = (overrides?: Partial<Asset>): Asset => ({
  id: uuid(),
  asset_code: `TEST-${Date.now()}`,
  org_id: 'test-org-alpha',
  name: 'Test Asset',
  category: 'JIG',
  status: 'active',
  created_at: new Date(),
  ...overrides
});

export const createTestAssetBatch = (count: number, org_id: string): Asset[] =>
  Array(count).fill(null).map((_, i) => 
    createTestAsset({ asset_code: `BATCH-${i:04d}`, org_id })
  );

export const createTestDuplicates = (): Asset[] => [
  createTestAsset({ asset_code: 'DUP-001', name: 'Duplicate A' }),
  createTestAsset({ asset_code: 'DUP-001A', name: 'Duplicate A variant' }),
  createTestAsset({ asset_code: 'DUP-002', name: 'Unique Asset' })
];
```

**User/Org Fixtures** (`tests/fixtures/users.ts`)
```typescript
export const createTestOrg = async (name: string): Promise<Organization> => {
  const { data } = await supabase.from('organizations').insert({
    name,
    country: 'IN'
  }).select();
  return data[0];
};

export const createTestUser = async (org_id: string, role: 'admin' | 'operator'): Promise<User> => {
  const { data } = await supabase.auth.admin.createUser({
    email: `test-${uuid()}@test.local`,
    password: 'test-password-123',
    user_metadata: { org_id, role }
  });
  return data.user;
};

export const getAuthToken = async (org_id: string, role: string): Promise<string> => {
  const response = await supabase.auth.signInWithPassword({
    email: `test-${org_id}@test.local`,
    password: 'test-password'
  });
  return response.data.session.access_token;
};
```

### Test Data Cleanup Strategy

**Automatic Cleanup (AfterEach Hook)**
```typescript
afterEach(async () => {
  // Cleanup test data created during test
  await supabase.from('assets').delete().match({ org_id: 'test-org-alpha' });
  await supabase.from('asset_import_batches').delete().match({ org_id: 'test-org-alpha' });
  
  // Verify cleanup
  const { count } = await supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .match({ org_id: 'test-org-alpha' });
  
  expect(count).toBe(0);
});
```

**Cascading Delete Validation**
- Test data should follow database cascade rules
- When parent record deleted, verify child records also deleted
- Example: Delete organization → verify all org's assets deleted

### Test Database Isolation

**Per-Test Database Prefix Pattern**
```
TEST_ORG_ID = test-org-{project}-{test-suite}-{worker-id}
Example: test-org-asset-import-3
```

**Multi-Org Testing**
- Always create separate test orgs to prevent RLS violations
- Use fixture functions to create cross-org test scenarios
- Example: `testOrgAlpha` and `testOrgBeta` for RLS isolation tests

---

## 🛠️ Test Environment Configuration & Setup

### Local Development Environment

**Prerequisites Checklist**
```bash
# 1. Node.js & Package Management
✓ Node.js ≥18.0.0
✓ npm ≥9.0.0
✓ yarn (optional but recommended)

# 2. Database
✓ Supabase account with staging project
✓ Supabase CLI installed: brew install supabase/tap/supabase
✓ Local PostgreSQL for offline testing (optional)

# 3. Testing Frameworks
✓ Jest configuration in place
✓ Vitest for React components
✓ Playwright installed: npx playwright install

# 4. Environment Variables
✓ .env.test configured with SUPABASE_URL, ANON_KEY, SERVICE_KEY
✓ DISCORD_BOT_TOKEN set
✓ TELEGRAM_BOT_TOKEN set
```

**Initial Setup Commands**
```bash
# Clone and install
git clone <repo>
cd workspace-dev
npm install

# Setup Supabase local environment
supabase start

# Verify Supabase connection
npm run test:db:health

# Run baseline tests
npm run test -- --testPathPattern=unit --maxWorkers=1

# Watch mode for development
npm run test:watch
```

### Staging Environment Setup

**Vercel Preview Deployment**
- Each PR automatically deploys to `pr-{number}.dsc-fms-portal.vercel.app`
- Test against preview environment before merging
- Environment variables auto-populated from production secret

**Staging Database Configuration**
```javascript
// .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...staging...
SUPABASE_SERVICE_ROLE_KEY=eyJ...staging...
ENVIRONMENT=staging
```

**CI/CD Pipeline Environment**
- GitHub Actions uses `.env.ci` with separate Supabase project
- Parallel workers use unique `TEST_ORG_ID` to avoid conflicts
- Post-test cleanup verifies no leftover test data

### Database Seeding for Testing

**Initial Data Load** (`scripts/seed-test-db.ts`)
```typescript
export async function seedTestDatabase() {
  // Create test organizations
  const orgs = await Promise.all([
    supabase.from('organizations').insert({ name: 'Test Org Alpha', country: 'IN' }),
    supabase.from('organizations').insert({ name: 'Test Org Beta', country: 'IN' })
  ]);
  
  // Create test users with roles
  const users = await createTestUsers(orgs);
  
  // Create base assets (500 for realistic dataset)
  const assets = await createTestAssets(500, orgs[0].id);
  
  console.log(`✓ Seeded ${assets.length} test assets`);
}

// Run via: npm run db:seed:test
```

---

## 🔄 CI/CD Integration Pipeline

### GitHub Actions Workflow

**Test Execution Workflow** (`.github/workflows/test.yml`)
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        test-type: [unit, integration, e2e]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}
        env:
          SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.STAGING_SUPABASE_KEY }}
          TEST_ORG_ID: test-ci-${{ github.run_id }}-${{ matrix.test-type }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Test suite passed. Coverage report attached.'
            });
```

### Test Failure Detection & Reporting

**Failed Test Auto-Issue Creation**
```yaml
- name: Create issue on test failure
  if: failure()
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `[CI] Test failure in ${context.ref}`,
        body: `Failed job: ${{ github.job }}\nRun: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`
      });
```

### Deployment Gate

**Pre-Production Validation**
- Run full test suite in staging
- Validate API compatibility with production schema
- Generate performance baseline for smoke test comparison
- Require manual sign-off before production deployment

---

## 🔒 Security Testing Specifications

### Authentication & Authorization Tests

**JWT Token Validation**
```typescript
describe('JWT Token Security', () => {
  test('should reject expired tokens', async () => {
    const expiredToken = generateExpiredJWT();
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(response.status).toBe(401);
  });
  
  test('should reject tampered JWT', async () => {
    const token = getValidJWT();
    const tamperedToken = token.slice(0, -5) + 'xxxxx';
    
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${tamperedToken}`);
    
    expect(response.status).toBe(401);
  });
  
  test('should validate JWT signature with public key', async () => {
    const token = getValidJWT();
    const payload = verifyJWT(token);
    expect(payload.org_id).toBeDefined();
    expect(payload.user_id).toBeDefined();
  });
});
```

**RLS Policy Enforcement**
```typescript
test('should enforce RLS on sensitive queries', async () => {
  const userAlpha = createAuthClient('org-alpha');
  const userBeta = createAuthClient('org-beta');
  
  // User Alpha creates confidential record
  const { data: record } = await userAlpha
    .from('sensitive_data')
    .insert({ org_id: 'org-alpha', data: 'secret' });
  
  // User Beta cannot access it (RLS blocks)
  const { data: result, error } = await userBeta
    .from('sensitive_data')
    .select('*')
    .eq('id', record.id);
  
  expect(result).toBeNull();
  expect(error).toBeDefined();
});
```

### OWASP Top 10 Testing

**SQL Injection Prevention** 
```typescript
test('should prevent SQL injection in search', async () => {
  const payload = { search: "'; DROP TABLE assets; --" };
  const response = await request(app)
    .get('/api/assets/search')
    .query(payload);
  
  expect(response.status).toBe(200);
  
  // Verify table still exists
  const { count } = await supabase
    .from('assets')
    .select('*', { count: 'exact' });
  expect(count).toBeGreaterThan(0);
});
```

**XSS Prevention**
```typescript
test('should sanitize user input to prevent XSS', async () => {
  const payload = { name: '<img src=x onerror="alert(1)">' };
  const response = await request(app)
    .post('/api/assets')
    .send(payload);
  
  expect(response.status).toBe(201);
  
  // Verify stored data is escaped
  const { data } = await supabase
    .from('assets')
    .select('name')
    .eq('id', response.body.id);
  
  expect(data[0].name).not.toContain('onerror');
});
```

### Secrets & Credentials Testing

**API Key Rotation**
```typescript
test('should update API key without breaking functionality', async () => {
  const oldKey = process.env.SUPABASE_KEY;
  
  // Rotate key in environment
  process.env.SUPABASE_KEY = generateNewKey();
  
  // Verify new key works
  const response = await request(app)
    .get('/api/health')
    .set('Authorization', `Bearer ${process.env.SUPABASE_KEY}`);
  
  expect(response.status).toBe(200);
  
  // Restore old key for cleanup
  process.env.SUPABASE_KEY = oldKey;
});
```

---

## 📊 Monitoring, Logging & Reporting Framework

### Test Execution Logging

**Structured Log Format**
```typescript
// tests/utils/logger.ts
export const testLogger = {
  testStart: (name: string, duration?: number) => {
    console.log(JSON.stringify({
      level: 'INFO',
      event: 'test_start',
      test: name,
      timestamp: new Date().toISOString()
    }));
  },
  
  testPass: (name: string, duration: number) => {
    console.log(JSON.stringify({
      level: 'INFO',
      event: 'test_pass',
      test: name,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }));
  },
  
  testFail: (name: string, error: Error, duration: number) => {
    console.log(JSON.stringify({
      level: 'ERROR',
      event: 'test_fail',
      test: name,
      error: error.message,
      stack: error.stack,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### Coverage Reporting

**Coverage Badge Generation** (`.github/workflows/coverage.yml`)
```yaml
- name: Generate coverage badge
  run: |
    COVERAGE=$(npm run test:coverage | grep "Statements" | awk '{print $3}')
    echo "Coverage: $COVERAGE"
    
    # Create badge
    curl https://img.shields.io/badge/coverage-$COVERAGE-green -o coverage.svg
    
- name: Commit coverage badge
  run: |
    git config user.name "GitHub Actions"
    git config user.email "actions@github.com"
    git add coverage.svg
    git commit -m "chore: Update coverage badge"
    git push
```

### Test Report Generation

**HTML Report Template** (`tests/report.html`)
```html
<html>
  <head><title>Test Report — DSC FMS Phase 2</title></head>
  <body>
    <h1>Test Execution Report</h1>
    <table>
      <tr><th>Project</th><th>Unit</th><th>Integration</th><th>E2E</th><th>Coverage</th></tr>
      <tr>
        <td>Discord Bot</td>
        <td>✅ 20/20</td>
        <td>✅ 4/4</td>
        <td>✅ 3/3</td>
        <td>87%</td>
      </tr>
      <!-- More rows -->
    </table>
  </body>
</html>
```

### Real-Time Dashboard Integration

**DataDog/Sentry Metrics**
```typescript
import * as Sentry from '@sentry/node';

beforeEach(() => {
  Sentry.captureMessage(`Test starting: ${test.name}`, 'debug');
});

afterEach((result) => {
  Sentry.captureMessage(
    `Test completed: ${test.name} - ${result.status}`,
    result.status === 'passed' ? 'info' : 'error'
  );
});
```

---

## 🐛 Flaky Test Detection & Handling

### Identifying Flaky Tests

**Run Multiplier Strategy**
- Run each test 5 times consecutively
- If 1+ failures out of 5: mark as flaky
- Log flaky tests to `flaky-tests.json`

```typescript
// scripts/detect-flaky-tests.ts
export async function detectFlakyTests(testFile: string, runs: number = 5) {
  const results = [];
  
  for (let run = 0; run < runs; run++) {
    const { exitCode, stderr } = await exec(`jest ${testFile}`);
    results.push({ run, passed: exitCode === 0 });
  }
  
  const failures = results.filter(r => !r.passed).length;
  
  if (failures > 0 && failures < runs) {
    console.log(`⚠️  FLAKY: ${testFile} failed ${failures}/${runs} runs`);
    return { flaky: true, failureRate: failures / runs };
  }
  
  return { flaky: false, failureRate: 0 };
}
```

### Common Flaky Test Causes

**1. Timing Issues**
```typescript
// ❌ BAD: Hard-coded delays
test('should update asset', async () => {
  await updateAsset(asset);
  await new Promise(r => setTimeout(r, 1000)); // Fragile!
  const result = await getAsset(asset.id);
  expect(result.updated).toBe(true);
});

// ✅ GOOD: Wait for condition
test('should update asset', async () => {
  await updateAsset(asset);
  await waitFor(() => expect(getAsset(asset.id)).resolves.toMatchObject({ updated: true }), {
    timeout: 5000
  });
});
```

**2. Async Race Conditions**
```typescript
// ❌ BAD: Race condition
test('should sync messages', async () => {
  await publishMessage(msg1);
  await publishMessage(msg2);
  // msg2 might sync before msg1
  const messages = await getMessages();
  expect(messages[0].id).toBe(msg1.id);
});

// ✅ GOOD: Explicit ordering
test('should sync messages in order', async () => {
  const msg1 = await publishMessage('first');
  await waitFor(() => getSyncStatus(msg1.id) === 'synced');
  
  const msg2 = await publishMessage('second');
  await waitFor(() => getSyncStatus(msg2.id) === 'synced');
  
  const messages = await getMessages();
  expect(messages.map(m => m.id)).toEqual([msg1.id, msg2.id]);
});
```

**3. Database State Pollution**
```typescript
// ❌ BAD: Cleanup not guaranteed
test('A', async () => {
  await db.insert('test_record');
});

test('B', async () => {
  const count = await db.count('test_record');
  expect(count).toBe(0); // Fails if test A ran first!
});

// ✅ GOOD: Explicit cleanup
afterEach(async () => {
  await db.delete('test_record').where({ test_id: TEST_ID });
});

test('A', async () => {
  await db.insert({ test_id: TEST_ID });
});

test('B', async () => {
  const count = await db.count('test_record').where({ test_id: TEST_ID });
  expect(count).toBe(0);
});
```

### Flaky Test Quarantine

```typescript
// Mark flaky tests to skip in critical runs
test.skip('should handle slow network', () => {
  // TODO: Fix flakiness (Issue #1234)
  // Temporarily skipped; re-enable after 2026-06-15
});

// Run non-quarantined tests
npm run test -- --skipQuarantined
```

---

## 🔧 Test Failure Troubleshooting Guide

### Common Failures & Solutions

**1. RLS Policy Enforcement Failures**

**Symptom:** `Error: new row violates row-level security policy`

**Diagnosis Steps:**
```sql
-- Check RLS policies on table
SELECT * FROM pg_policies WHERE tablename = 'assets';

-- Verify policy condition
SELECT policy_name, qual, with_check FROM pg_policies WHERE tablename = 'assets';
```

**Solutions:**
```typescript
// Ensure org_id matches authenticated user's org
const client = createAuthClient('org-alpha');
const { org_id } = await getAuthUser(); // Should return 'org-alpha'

// Insert should include org_id
await client.from('assets').insert({
  asset_code: 'TEST-001',
  org_id: org_id, // Must match authenticated org
  name: 'Test'
});
```

**2. Supabase Connection Timeouts**

**Symptom:** `Error: ECONNREFUSED localhost:5432` or `TimeoutError: socket timeout`

**Diagnosis:**
```bash
# Check Supabase status
supabase status

# Verify network connectivity
curl -I $SUPABASE_URL

# Check environment variables
echo $SUPABASE_URL $SUPABASE_KEY
```

**Solutions:**
```bash
# Restart Supabase
supabase stop && supabase start

# Increase test timeout
npm run test -- --testTimeout=30000

# Use staging instead of local
export SUPABASE_URL=https://staging.supabase.co
npm run test
```

**3. Jest Memory Leaks**

**Symptom:** `JavaScript heap out of memory` or `FATAL ERROR`

**Diagnosis:**
```bash
# Monitor memory during test run
npm run test -- --detectOpenHandles --forceExit

# Check for unclosed connections
grep -r "\.subscribe()" tests/ | grep -v "unsubscribe"
```

**Solutions:**
```typescript
// Properly cleanup subscriptions
afterEach(() => {
  subscription?.unsubscribe();
  client?.removeAllListeners();
});

// Limit concurrent tests
npm run test -- --maxWorkers=2

// Add memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run test
```

**4. Playwright E2E Flakiness**

**Symptom:** `Timeout while running action: click` or `element not found`

**Diagnosis:**
```typescript
// Add verbose logging
await page.locator('button').click({ timeout: 30000 });

// Check element visibility
await expect(page.locator('button')).toBeVisible({ timeout: 10000 });
```

**Solutions:**
```typescript
// Use explicit waits instead of implicit
await page.waitForLoadState('networkidle');
await page.locator('button').click();

// Increase timeouts for slow CI environments
const context = await browser.newContext({
  navigationTimeout: 60000,
  actionTimeout: 30000
});
```

---

## 📅 Test Maintenance & Review Schedule

### Daily Testing Checklist (18:00 KST)

- [ ] All unit tests passing (green CI badge)
- [ ] Coverage not decreased from previous day
- [ ] No flaky tests detected (0 retries)
- [ ] Test suite duration stable (<10 min)
- [ ] No new RLS policy violations
- [ ] Staging database clean (auto-cleanup verified)

### Weekly Test Review (Every Monday 09:00 KST)

**Review Metrics:**
- Total test count: Should increase by ~5% per week
- Coverage trend: Should improve or maintain
- Flaky test rate: Target <2%
- Test execution time: Should not exceed baseline +10%

**Actions:**
```
- [ ] Review failed tests from past week
- [ ] Identify and quarantine new flaky tests
- [ ] Update test fixtures based on production data
- [ ] Upgrade testing frameworks (if security patches available)
- [ ] Optimize slow test suites (target <1s per unit test)
```

### Monthly Test Suite Health Audit

**Coverage Analysis**
```bash
# Generate detailed coverage report
npm run test:coverage -- --lcov

# Identify untested code paths
cat coverage/lcov-report/index.html
```

**Performance Baseline Update**
- Record p50, p95, p99 test execution times
- Compare against previous month
- Document any regressions

**Security Policy Review**
```sql
-- Audit RLS policies for gaps
SELECT tablename, policyname, qual 
FROM pg_policies 
ORDER BY tablename;

-- Check for overly permissive policies
SELECT * FROM pg_policies WHERE qual IS NULL;
```

### Quarterly Test Strategy Review

**Review Items:**
1. Are we testing the right user workflows?
2. Have new critical paths emerged?
3. Are test frameworks still appropriate?
4. Do we need additional load testing?
5. Should we add chaos engineering tests?

**Documentation Updates:**
- Update this test strategy based on lessons learned
- Publish test metrics to stakeholders
- Refine success criteria for next phase

---

**Dependency Analysis:** How projects impact each other during parallel testing

| From → To | Asset Master | Travel | Discord Bot | Team Dashboard | Backup | Harness | Memory Auto |
|-----------|-------------|--------|------------|-----------------|--------|---------|-------------|
| **Asset Master** | — | Monitor | Safe | Safe | Monitor | 🔴 CRITICAL | 🔴 CRITICAL |
| **Travel** | Safe | — | Safe | Safe | Monitor | Safe | Monitor |
| **Discord Bot** | Safe | Safe | — | Safe | Safe | Safe | Safe |
| **Team Dashboard** | Safe | Safe | Safe | — | Safe | Safe | Safe |
| **Backup** | Monitor | Monitor | Safe | Safe | — | Safe | Safe |
| **Harness** | 🔴 CRITICAL | Safe | Safe | Safe | Safe | — | Safe |
| **Memory Auto** | 🔴 CRITICAL | Monitor | Safe | Safe | Monitor | Safe | — |

**Risk Levels:**
- 🟢 **Safe:** No shared dependencies; can test independently
- 🟡 **Monitor:** Shared test data or API; use test isolation
- 🔴 **CRITICAL:** Hard dependency; sequential testing or coordination required

**Mitigation:**
1. **Asset Master ↔ Memory Automation:** Use separate test databases for duplicate detection tuning
2. **Asset Master ↔ Harness:** Validate asset existence before conflict detection tests
3. **Coordination Windows:**
   - Day 1: Asset Master unit/integration tests (Memory Auto paused)
   - Day 2: Memory Auto parallel tests with isolated test data
   - Day 3-4: Full E2E with real data sync validation

---

## 🔄 Parallel Execution Safety Checklist

### 4 Concurrent Workers (Jest --maxWorkers=4)

**Before Running:**
- [ ] Each project has isolated test database (using unique `org_id` + test prefix)
- [ ] Environment variables isolated: `TEST_ORG_ID=test-org-{worker-id}`
- [ ] Port assignments unique: port 3001-3004 for API test servers
- [ ] Supabase auth tokens refreshed per worker (no token reuse)
- [ ] Cleanup hooks run: `afterEach(() => truncateTestData())`

**During Execution:**
- [ ] Monitor database connections: `SELECT count(*) FROM pg_stat_activity;` (expect <20)
- [ ] Monitor file handles: `lsof -p $PID | wc -l` (<500 per worker)
- [ ] Monitor CPU: `top` (expect <80% per core)
- [ ] Watch for lock timeouts: `grep "TIMEOUT\|DEADLOCK" test.log`

**After Execution:**
- [ ] Cleanup verification: `SELECT count(*) FROM assets WHERE org_id LIKE 'test-%';` (expect 0)
- [ ] Test data leakage check: Verify no test records in staging database
- [ ] Performance baseline: Record test suite duration (target: <10 minutes)

---

## 📋 Pre-Deployment Validation (10 Stages)

**Applies to all 7 projects. Go/No-Go decision at Stage 10.**

### Stage 1: Code Quality ✅
- [ ] TypeScript compilation: `npm run build` (0 errors)
- [ ] Linting: `npm run lint` (0 warnings, except legacy code)
- [ ] Test coverage: `npm run test -- --coverage` (min 75% on new code)

### Stage 2: Security & Auth 🔐
- [ ] JWT validation: Expired tokens rejected
- [ ] CORS whitelist: Only expected origins allowed
- [ ] RLS policies: Verified on all 26 DB tables
- [ ] Secrets scanning: `git secrets --scan` (0 exposed keys)

### Stage 3: Database Integrity 📊
- [ ] Foreign key constraints: All enforced
- [ ] Unique constraints: Tested with duplicates
- [ ] Triggers & stored procedures: Tested for atomicity
- [ ] Migration rollback: `npm run db:rollback` succeeds

### Stage 4: Performance ⚡
- [ ] API response time: p99 <500ms (single request)
- [ ] Database query time: p99 <100ms (indexed queries)
- [ ] Pagination: Handles 10,000+ rows without UI blocking
- [ ] Memory leak check: `ab -c 100 -n 10000 http://localhost:3000/api/health` (memory stable)

### Stage 5: Accessibility ♿
- [ ] WCAG AA compliance: axe-core scan (0 violations)
- [ ] Keyboard navigation: All interactive elements reachable
- [ ] Screen reader: VoiceOver/TalkBack test on key flows
- [ ] Color contrast: All text ≥4.5:1 ratio

### Stage 6: Error Handling & Monitoring 📢
- [ ] 404/500 pages: Functional and styled
- [ ] Error logging: Errors captured in Sentry/DataDog
- [ ] Metrics reporting: Key events logged (user actions, API calls)
- [ ] Alert thresholds: Configured for p95 latency increase

### Stage 7: Deployment Infrastructure ☁️
- [ ] Vercel deployment: Build succeeds, no size warnings
- [ ] Environment variables: SUPABASE_URL, ANON_KEY set correctly
- [ ] SSL certificate: HTTPS enforced, no mixed content
- [ ] Database backups: Automated, last backup <24h old

### Stage 8: Smoke Tests (Staging) 🔥
- [ ] Create asset → verify in list
- [ ] Update profile → verify changes reflected
- [ ] Delete record → verify RLS prevents cross-org deletion
- [ ] API pagination → retrieve records in batches

### Stage 9: Stakeholder Sign-Off 👥
- [ ] Product Manager: Feature requirements met
- [ ] Security Engineer: Auth/RLS review passed
- [ ] DevOps Engineer: Deployment checklist completed
- [ ] QA Lead: All test gates cleared

### Stage 10: Go/No-Go Decision 🚀
- [ ] **GO:** All 9 stages passed; proceed to production deployment
- [ ] **NO-GO:** Any stage failed; document blockers and schedule remediation

---

## 📅 6-Day Timeline & Milestones

| Day | Date | Milestone | Deliverables | Owner |
|-----|------|-----------|---------------|-------|
| 1 | 2026-05-28 | Unit tests (50+ tests) | All unit test files committed | Web builders |
| 2 | 2026-05-29 | Integration tests (40+ tests) | API + RLS integration tests | QA |
| 3 | 2026-05-30 | E2E smoke tests (5+ scenarios) | Playwright test suite | QA |
| 4 | 2026-05-31 | Full E2E workflow tests (15+ scenarios) | Complete user flow coverage | QA |
| 5 | 2026-06-01 | Performance & accessibility validation | Performance baseline + A11y report | DevOps + QA |
| 6 | 2026-06-02 | Deployment staging & production | All tests green, go/no-go decision by 18:00 | DevOps |

**Daily Status Check:** 18:00 KST each day (update active_work_tracking.md)

---

## 📊 Metrics & KPIs

### Coverage Targets
- **Unit test coverage:** ≥80% new code (lines + branches)
- **Integration test coverage:** ≥70% API routes
- **E2E coverage:** ≥60% critical user paths
- **Overall:** ≥75% combined coverage

### Pass Rate Targets
- **Unit tests:** 100% pass rate (0 flaky tests)
- **Integration tests:** 95% pass rate (allow 1 flaky test if retries pass)
- **E2E tests:** 90% pass rate (allow timeouts if retries pass)

### Bug Targets
- **Critical bugs (blocking deployment):** 0
- **High-severity bugs (requires fix before GA):** 0
- **Medium-severity bugs:** ≤5 (tracked for post-launch)
- **Low-severity bugs:** Deferred to Phase 3

### Performance Targets
- **API response time (p99):** <500ms
- **Database query time (p99):** <100ms
- **Page load time (FCP):** <3 seconds
- **Test suite duration:** <10 minutes

### Reliability Targets
- **Test flakiness rate:** <5% (repeat failures)
- **Test infrastructure uptime:** 99.9% (Supabase, Vercel)
- **Database availability:** 99.95% (RTO <5 min, RPO <15 min)

---

## 🎯 Individual Project Test Plans (Summary)

Each of the 7 projects has a dedicated test plan document:

### 1. Discord Bot Phase 1 — DISCORD_BOT_TEST_PLAN.md
- **Unit tests:** Signature verification (5), Processor logic (10), Message parsing (5)
- **Integration:** API endpoints (4), Supabase sync (3)
- **E2E:** Message sync flow (2), Error recovery (1)

### 2. Team Dashboard Phase 2 — TEAM_DASHBOARD_TEST_PLAN.md
- **Unit tests:** Component rendering (20), KPI calculations (8), Chart generation (5)
- **Integration:** API endpoints (12), RLS by role (3)
- **E2E:** Dashboard load (1), Role transitions (1), Goal CRUD (1)

### 3. Travel Phase 2 UI — TRAVEL_PHASE2_TEST_PLAN.md
- **Unit tests:** Cost calculations (5), Date validations (4), Form components (10)
- **Integration:** API endpoints (13), Budget constraints (2)
- **E2E:** Booking workflow (1), Mobile flow (1), Approval chain (1)

### 4. Asset Master Phase 2 — ASSET_MASTER_TEST_PLAN.md
- **Unit tests:** Duplicate detection (8), Validation logic (6), Import parsing (5)
- **Integration:** Bulk import RLS (3), API endpoints (16), Transaction atomicity (2)
- **E2E:** Import → list flow (1), Conflict detection (1), Export (1)

### 5. Backup App Phase 2 — BACKUP_APP_TEST_PLAN.md
- **Unit tests:** Archive logic (5), Retention policies (4), Compression (3)
- **Integration:** API endpoints (18), Storage API (2), RLS (2)
- **E2E:** Backup create → restore (1), Large dataset (1)

### 6. Harness Engineering Phase 2 — HARNESS_TEST_PLAN.md
- **Unit tests:** Conflict detection (6), Validation engine (5), Audit logging (4)
- **Integration:** API endpoints (12), Real-time validation (2)
- **E2E:** Schedule create → conflict check (1), Manual validation (1)

### 7. Memory Automation Phase 2 — MEMORY_AUTO_TEST_PLAN.md
- **Unit tests:** Duplicate algorithms (10), Trust scoring (5), Cron logic (4)
- **Integration:** Message API (4), Duplicate detection (2)
- **E2E:** Message collection → duplicate detection (1)

---

## ✅ Success Criteria (Design Complete)

| Criterion | Target | Verification |
|-----------|--------|--------------|
| All 160+ unit tests pass | 100% | `npm run test` output |
| All 40+ integration tests pass | 100% | Supabase test database clean |
| All 15+ E2E tests pass | 100% | Playwright HTML report |
| Code coverage | ≥75% | Coverage report |
| No critical RLS violations | 0 | RLS policy audit |
| Performance targets met | 100% | Load test baseline |
| Accessibility scan | 0 violations | axe-core report |
| Deployment checklist | 10/10 | Stage 10 sign-off |

---

## 📌 Related Documents

- Individual test plans: `{PROJECT}_TEST_PLAN.md` (7 files, Day 2-3)
- Supabase testing guide: `tests/SUPABASE_TESTING.md`
- Playwright E2E guide: `tests/E2E_GUIDE.md`
- Performance baseline: `tests/PERFORMANCE_BASELINE.md`
- RLS policy audit: `tests/RLS_AUDIT.md`

---

**Design Status:** ✅ **COMPLETE** (2026-05-28 02:48 KST)  
**Next Steps:** 
1. Create 7 individual test plan documents (Day 1-2)
2. Implement unit tests (Day 1-2)
3. Implement integration tests (Day 2-3)
4. Implement E2E tests (Day 3-4)
5. Run full validation & deployment (Day 5-6)

**Deadline:** 2026-06-02 18:00 KST ⏰  
**Owner:** Phase C #14 QA Specialist (Subagent)

