# Harness Engineering Phase 1.2: Test Automation Standardization

**Document Status:** ✅ Complete  
**Last Updated:** 2026-05-29  
**Applies To:** All 8 API modules (discord-bot, travel-management, team-dashboard, asset-master, backup-app, bm-breakdowns, milestones, portfolio)

---

## 1. Test Coverage Requirements

### Minimum Thresholds
- **Overall Coverage:** 60% (minimum), 80% (target)
- **Metrics Tracked:** Statements, Branches, Functions, Lines
- **Enforcement:** CI/CD fails build if overall coverage < 60%
- **Calculation:** `(Statements% + Branches% + Functions% + Lines%) / 4`

### Test Environment
- **Framework:** Jest (configured in `jest.config.js`)
- **Test Files Location:** `__tests__/` directory
- **Coverage Report:** Run `npm run test -- --coverage`
- **TypeScript Support:** ts-jest transformation enabled

---

## 2. API Endpoint Test Pattern (Mandatory)

**All API endpoints MUST have 3 test cases minimum:**

### 2.1 Success Path Test
```typescript
describe('GET /api/[module]/endpoint', () => {
  it('should return 200 with correct data on success', async () => {
    const response = await fetch('/api/[module]/endpoint');
    expect(response.status).toBe(200);
    const data = await response.json();
    // Assert expected structure and values
  });
});
```

**Requirements:**
- HTTP 200 status code
- Valid JSON response body
- All expected fields present
- No null/undefined for required fields

### 2.2 Error Path Test
```typescript
describe('GET /api/[module]/endpoint', () => {
  it('should return 400 on invalid input', async () => {
    const response = await fetch('/api/[module]/endpoint?invalid=param');
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error).toBeDefined();
  });
});
```

**Covers:**
- Missing required parameters → 400
- Invalid parameter format → 400
- Database errors → 500
- Unauthorized requests → 401

### 2.3 Edge Case Test
```typescript
describe('GET /api/[module]/endpoint', () => {
  it('should handle empty result set gracefully', async () => {
    const response = await fetch('/api/[module]/endpoint?filter=nonexistent');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data) || typeof data === 'object').toBe(true);
  });
});
```

**Covers:**
- Empty datasets
- Boundary conditions (max/min values)
- Pagination edge cases
- Special characters in inputs
- Concurrent requests

---

## 3. Test File Structure

**Naming Convention:** `<endpoint>.test.ts`  
**Location:** `__tests__/<module>/<endpoint>.test.ts`

```typescript
// Example: __tests__/portfolio/[id].test.ts

import { GET, POST } from '@/app/api/portfolio/[id]/route';
import { createMocks } from 'node-mocks-http';

describe('GET /api/portfolio/[id]', () => {
  // ✅ Success path
  it('should return 200 with portfolio item details', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '123' },
    });
    await GET(req, res);
    expect(res._getStatusCode()).toBe(200);
  });

  // ❌ Error path
  it('should return 404 for non-existent portfolio item', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'invalid-id' },
    });
    await GET(req, res);
    expect(res._getStatusCode()).toBe(404);
  });

  // ⚠️ Edge case path
  it('should handle empty string id parameter', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '' },
    });
    await GET(req, res);
    expect([400, 404, 422]).toContain(res._getStatusCode());
  });
});
```

---

## 4. Test Utilities & Fixtures

### 4.1 Mock Supabase Client
```typescript
// __tests__/utils/mock-supabase.ts
export const mockSupabaseClient = {
  from: jest.fn((table) => ({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      data: [],
      error: null,
    }),
    insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    update: jest.fn().mockResolvedValue({ data: {}, error: null }),
    delete: jest.fn().mockResolvedValue({ data: {}, error: null }),
  })),
};
```

### 4.2 Test Data Fixtures
```typescript
// __tests__/fixtures/test-data.ts
export const mockPortfolioItem = {
  id: 'test-portfolio-1',
  title: 'Sample Portfolio',
  description: 'Test description',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockMilestone = {
  id: 'test-milestone-1',
  portfolio_id: 'test-portfolio-1',
  title: 'Phase 1 Complete',
  target_date: '2026-06-01',
};
```

### 4.3 Request/Response Helpers
```typescript
// __tests__/utils/test-helpers.ts
export async function makeRequest(
  method: string,
  path: string,
  body?: Record<string, any>,
  headers?: Record<string, string>
) {
  const res = new Response();
  const req = new Request(`http://localhost:3000${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  return { req, res };
}
```

---

## 5. Daily Test Coverage Report

### Cron Configuration
- **Endpoint:** `/api/cron/test-coverage/daily-report`
- **Schedule:** `0 8 * * *` (08:00 UTC daily)
- **Max Duration:** 60 seconds
- **Output:** Telegram notification to `TELEGRAM_SECRETARY_CHAT_ID`

### Report Format
```
✅ Daily Test Coverage Report

Overall Coverage: 75% 🎯
Target: 60% (min) → 80% (target)

Breakdown:
• Statements: 75%
• Branches: 72%
• Functions: 78%
• Lines: 76%

Test Results:
• Passed: 145/150
• Failed: 5

Timestamp: 2026-05-29 08:00:00 KST
```

### Status Indicators
- **✅ Compliant:** Coverage ≥ 60%
- **🎯 Target:** Coverage ≥ 80%
- **⚠️ Warning:** Coverage < 60%
- **❌ Failed:** Job execution error

---

## 6. Implementation Timeline (Phase 1.2)

| Date | Task | Status |
|------|------|--------|
| 2026-05-29 | Register cron in vercel.json | ✅ Complete |
| 2026-05-29 | Build & verify cron endpoint compiles | ✅ Complete |
| 2026-05-29 | Create Test Standards Doc | ✅ Complete |
| 2026-05-30 | Generate baseline tests for 5 remaining API routes | 🟡 Pending |
| 2026-05-31 | Verify daily cron executes and reports metrics | 🟡 Pending |

---

## 7. Next Phase (Phase 1.3: Migration Auto-Apply)

**Scheduled:** 2026-06-01~05

- Hourly cron job to detect pending `db/*.sql` files
- Auto-execute migrations using `SUPABASE_SERVICE_ROLE_KEY`
- Send migration success/failure notifications to Telegram
- Maintain migration execution log

---

## Integration Checklist

- [x] Cron endpoint created (`daily-report/route.ts`)
- [x] Registered in `vercel.json` with schedule "0 8 * * *"
- [x] Build verification passed
- [x] Test Standards documented (this file)
- [ ] Baseline tests generated for remaining API routes
- [ ] Cron execution validated in production
- [ ] Team notified of test coverage expectations

**Referenced in:** HARNESS_ENGINEERING_STANDARDIZATION_PLAN.md (Phase 1.2)
