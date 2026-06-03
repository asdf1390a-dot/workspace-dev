# Supertest API Integration Test Template — DSC FMS Portal REST APIs

**Document**: TEST_CODE_TEMPLATE_02_SUPERTEST_API.md  
**Version**: 1.0 (2026-06-02)  
**Purpose**: Reference implementation for REST API integration tests using Supertest  
**Target Projects**: All 7 projects with REST API endpoints  
**Performance Target**: API response ≤200ms (P95), ≤500ms (P99)  

---

## Part 1: Supertest Setup (api.test.js template)

### 1.1 Configuration & Fixtures

```javascript
const request = require('supertest');
const app = require('../src/app'); // Express app instance
const { createClient } = require('@supabase/supabase-js');

// Test database client (separate from production)
const supabase = createClient(
  process.env.SUPABASE_TEST_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // For RLS bypass in setup
);

// Test user tokens (pre-generated or mocked)
const TEST_USERS = {
  admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...admin_token',
  editor: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...editor_token',
  viewer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...viewer_token',
  unauthorized: 'invalid.token.xyz',
};

// Global performance tracking
const performanceMetrics = {
  requests: [],
  addMetric(endpoint, method, duration, status) {
    this.requests.push({ endpoint, method, duration, status, timestamp: new Date() });
  },
  getSummary() {
    const sorted = this.requests.map(r => r.duration).sort((a, b) => a - b);
    return {
      count: this.requests.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sorted.reduce((a, b) => a + b) / sorted.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  },
};

module.exports = {
  request,
  app,
  supabase,
  TEST_USERS,
  performanceMetrics,
};
```

### 1.2 Setup & Teardown

```javascript
describe('DSC FMS API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize test database
    console.log('Setting up test database...');
    
    // Run migration on test DB
    await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS test_assets (...)`,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up test data...');
    
    // Delete test records
    await supabase.from('assets').delete().like('asset_id', 'TEST-%');
    await supabase.from('travel_requests').delete().like('travel_id', 'TEST-%');
    await supabase.from('backups').delete().like('backup_id', 'TEST-%');
  });

  beforeEach(() => {
    // Reset performance metrics
    performanceMetrics.requests = [];
  });

  afterEach(() => {
    // Log any slow requests
    const slow = performanceMetrics.requests.filter(r => r.duration > 200);
    if (slow.length > 0) {
      console.warn(`Slow requests detected: ${slow.length}`);
      slow.forEach(r => console.warn(`  ${r.method} ${r.endpoint}: ${r.duration}ms`));
    }
  });
});
```

---

## Part 2: Asset Master Phase 2 — QR & Search API Tests

**File**: `__tests__/api/assets.test.js`

```javascript
const { request, app, supabase, TEST_USERS, performanceMetrics } = require('../../api.test');

describe('Asset APIs', () => {
  const baseEndpoint = '/api/v1/assets';
  
  describe('POST /api/v1/assets/by-qr', () => {
    it('should retrieve asset by QR code with valid token', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseEndpoint}/by-qr`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .send({ qr_code: 'AST-001-QR-2026' });
      
      const duration = Date.now() - startTime;
      performanceMetrics.addMetric(`${baseEndpoint}/by-qr`, 'POST', duration, response.status);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('asset_id');
      expect(response.body.asset_id).toBe('AST-001-QR-2026');
      expect(response.body).toHaveProperty('qr_code');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('location');
      expect(duration).toBeLessThan(200); // Performance gate
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/by-qr`)
        .send({ qr_code: 'AST-001-QR-2026' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/by-qr`)
        .set('Authorization', `Bearer ${TEST_USERS.unauthorized}`)
        .send({ qr_code: 'AST-001-QR-2026' });
      
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent QR code', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/by-qr`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .send({ qr_code: 'NONEXISTENT-QR' });
      
      expect(response.status).toBe(404);
    });

    it('should validate QR code format', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/by-qr`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .send({ qr_code: '' }); // Invalid: empty
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('QR code');
    });
  });

  describe('GET /api/v1/assets/search', () => {
    it('should search assets by text with pagination', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`${baseEndpoint}/search`)
        .set('Authorization', `Bearer ${TEST_USERS.viewer}`)
        .query({ q: 'pump', limit: 50, offset: 0 });
      
      const duration = Date.now() - startTime;
      performanceMetrics.addMetric(`${baseEndpoint}/search`, 'GET', duration, response.status);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page_size');
      expect(response.body.results).toBeInstanceOf(Array);
      expect(duration).toBeLessThan(200);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`${baseEndpoint}/search`)
        .set('Authorization', `Bearer ${TEST_USERS.viewer}`)
        .query({ category: 'Machinery' });
      
      expect(response.status).toBe(200);
      expect(response.body.results.every(asset => asset.category === 'Machinery')).toBe(true);
    });

    it('should filter by location', async () => {
      const response = await request(app)
        .get(`${baseEndpoint}/search`)
        .set('Authorization', `Bearer ${TEST_USERS.viewer}`)
        .query({ location: 'Building-B-Floor-2' });
      
      expect(response.status).toBe(200);
      expect(response.body.results.every(asset => asset.location === 'Building-B-Floor-2')).toBe(true);
    });

    it('should enforce RLS policy (creator can see details, others cannot)', async () => {
      // Get asset created by another user
      const assetCreatedByAdmin = await request(app)
        .post(`${baseEndpoint}`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({
          name: 'Secret Asset',
          category: 'Classified',
          location: 'Secure',
        });
      
      const assetId = assetCreatedByAdmin.body.asset_id;

      // Viewer should not see sensitive fields
      const viewerResponse = await request(app)
        .get(`${baseEndpoint}/${assetId}`)
        .set('Authorization', `Bearer ${TEST_USERS.viewer}`)
        .query({ include_audit: false });
      
      expect(viewerResponse.status).toBe(200);
      expect(viewerResponse.body).not.toHaveProperty('cost'); // Sensitive field
    });
  });

  describe('POST /api/v1/assets/:id/audit', () => {
    it('should retrieve audit history as CSV', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/AST-001/audit`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .query({ format: 'csv' });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('timestamp');
      expect(response.text).toContain('action');
      expect(response.text).toContain('user_id');
    });
  });

  describe('Performance: Batch operations', () => {
    it('should handle 10 concurrent GET requests under 200ms each', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .get(`${baseEndpoint}/search`)
          .set('Authorization', `Bearer ${TEST_USERS.viewer}`)
          .query({ limit: 100 })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;

      responses.forEach(res => expect(res.status).toBe(200));
      
      // Calculate individual request times (rough estimate)
      const avgTime = duration / 10;
      console.log(`Average request time: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(200);
    });

    it('should report performance metrics', () => {
      const summary = performanceMetrics.getSummary();
      console.log(`API Performance Summary:
        Requests: ${summary.count}
        Min: ${summary.min}ms
        Avg: ${summary.avg.toFixed(2)}ms
        P95: ${summary.p95}ms
        P99: ${summary.p99}ms
        Max: ${summary.max}ms
      `);

      expect(summary.p95).toBeLessThan(300); // P95 should be under 300ms
      expect(summary.p99).toBeLessThan(500); // P99 should be under 500ms
    });
  });
});
```

---

## Part 3: Travel Management Phase 2 — PDF Upload & Parsing API Tests

**File**: `__tests__/api/travel.test.js`

```javascript
const { request, app, supabase, TEST_USERS, performanceMetrics } = require('../../api.test');
const fs = require('fs');
const path = require('path');

describe('Travel Management APIs', () => {
  const baseEndpoint = '/api/v1/travel';
  
  describe('POST /api/v1/travel/requests', () => {
    it('should create travel request with valid data', async () => {
      const payload = {
        purpose: 'Client meeting - Chennai',
        start_date: '2026-06-05',
        end_date: '2026-06-07',
        budget: 50000,
        currency: 'INR',
        description: 'Quarterly review with DSC management',
      };

      const response = await request(app)
        .post(`${baseEndpoint}/requests`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('travel_id');
      expect(response.body.status).toBe('draft');
      expect(response.body.purpose).toBe(payload.purpose);
    });

    it('should validate date range (end >= start)', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/requests`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .send({
          purpose: 'Invalid dates',
          start_date: '2026-06-10',
          end_date: '2026-06-05', // Before start
          budget: 50000,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('end_date');
    });

    it('should reject past dates', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/requests`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .send({
          purpose: 'Past trip',
          start_date: '2025-06-01',
          end_date: '2025-06-03',
          budget: 50000,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('past');
    });

    it('should enforce budget limits', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/requests`)
        .set('Authorization', `Bearer ${TEST_USERS.viewer}`) // Viewer has lower limit
        .send({
          purpose: 'Expensive trip',
          start_date: '2026-06-05',
          end_date: '2026-06-07',
          budget: 1000000, // Excessive
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('budget');
    });
  });

  describe('POST /api/v1/travel/requests/:id/upload-voucher', () => {
    let travelId;

    beforeEach(async () => {
      // Create travel request first
      const res = await request(app)
        .post(`${baseEndpoint}/requests`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .send({
          purpose: 'Test trip',
          start_date: '2026-06-05',
          end_date: '2026-06-07',
          budget: 50000,
        });
      travelId = res.body.travel_id;
    });

    it('should accept PDF voucher file', async () => {
      const pdfPath = path.join(__dirname, '../../fixtures/sample-voucher.pdf');
      const fileStream = fs.createReadStream(pdfPath);

      const response = await request(app)
        .post(`${baseEndpoint}/requests/${travelId}/upload-voucher`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .field('voucher_type', 'flight')
        .attach('file', fileStream);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('voucher_id');
      expect(response.body).toHaveProperty('parsed_amount');
      expect(response.body).toHaveProperty('parsed_date');
    });

    it('should reject non-PDF files', async () => {
      const txtPath = path.join(__dirname, '../../fixtures/invalid.txt');
      const fileStream = fs.createReadStream(txtPath);

      const response = await request(app)
        .post(`${baseEndpoint}/requests/${travelId}/upload-voucher`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .attach('file', fileStream);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PDF');
    });

    it('should reject files larger than 5MB', async () => {
      // Mock a large file
      const response = await request(app)
        .post(`${baseEndpoint}/requests/${travelId}/upload-voucher`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .set('Content-Length', 6000000); // 6MB

      expect(response.status).toBe(413); // Payload too large
    });

    it('should parse PDF and extract amount + date', async () => {
      const pdfPath = path.join(__dirname, '../../fixtures/voucher-with-amount.pdf');
      const fileStream = fs.createReadStream(pdfPath);

      const response = await request(app)
        .post(`${baseEndpoint}/requests/${travelId}/upload-voucher`)
        .set('Authorization', `Bearer ${TEST_USERS.editor}`)
        .field('voucher_type', 'hotel')
        .attach('file', fileStream);

      expect(response.status).toBe(200);
      expect(response.body.parsed_amount).toBe(15000); // Extracted from PDF
      expect(response.body.parsed_date).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('GET /api/v1/travel/requests/:id', () => {
    it('should retrieve travel request with vouchers', async () => {
      const response = await request(app)
        .get(`${baseEndpoint}/requests/TRV-2026-0452`)
        .set('Authorization', `Bearer ${TEST_USERS.viewer}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('travel_id');
      expect(response.body).toHaveProperty('vouchers');
      expect(response.body.vouchers).toBeInstanceOf(Array);
    });

    it('should include budget utilization percentage', async () => {
      const response = await request(app)
        .get(`${baseEndpoint}/requests/TRV-2026-0452`)
        .set('Authorization', `Bearer ${TEST_USERS.viewer}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('budget_used');
      expect(response.body).toHaveProperty('budget_remaining');
      expect(response.body.budget_used + response.body.budget_remaining).toBe(response.body.budget);
    });
  });
});
```

---

## Part 4: Backup App Phase 2 — Backup & Restore API Tests

**File**: `__tests__/api/backup.test.js`

```javascript
const { request, app, supabase, TEST_USERS, performanceMetrics } = require('../../api.test');
const crypto = require('crypto');

describe('Backup APIs', () => {
  const baseEndpoint = '/api/v1/backup';

  describe('POST /api/v1/backup/create', () => {
    it('should create backup and return metadata', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseEndpoint}/create`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({ scope: 'full' });
      
      const duration = Date.now() - startTime;
      performanceMetrics.addMetric(`${baseEndpoint}/create`, 'POST', duration, response.status);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('backup_id');
      expect(response.body).toHaveProperty('checksum');
      expect(response.body).toHaveProperty('size_bytes');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body.status).toBe('completed');
      expect(duration).toBeLessThan(2000); // 2 second gate for backup creation
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/create`)
        .set('Authorization', `Bearer ${TEST_USERS.viewer}`)
        .send({ scope: 'full' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permission');
    });

    it('should prevent duplicate backup (same timestamp)', async () => {
      // First backup
      await request(app)
        .post(`${baseEndpoint}/create`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({ scope: 'full' });

      // Attempt duplicate immediately
      const response = await request(app)
        .post(`${baseEndpoint}/create`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({ scope: 'full' });

      expect(response.status).toBe(409); // Conflict
      expect(response.body.error).toContain('duplicate');
    });
  });

  describe('POST /api/v1/backup/:id/restore', () => {
    let backupId;

    beforeEach(async () => {
      const res = await request(app)
        .post(`${baseEndpoint}/create`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({ scope: 'full' });
      backupId = res.body.backup_id;
    });

    it('should restore backup with checksum verification', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseEndpoint}/${backupId}/restore`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({ mode: 'overwrite' });
      
      const duration = Date.now() - startTime;
      performanceMetrics.addMetric(`${baseEndpoint}/restore`, 'POST', duration, response.status);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('restored_files');
      expect(response.body).toHaveProperty('checksum_verified');
      expect(response.body.checksum_verified).toBe(true);
      expect(duration).toBeLessThan(5000); // 5 second gate for restore
    });

    it('should prevent restore without checksum match', async () => {
      // Tamper with checksum validation (simulated)
      const response = await request(app)
        .post(`${baseEndpoint}/${backupId}/restore`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .set('X-Tamper-Checksum', 'invalid') // Mock tampering
        .send({ mode: 'overwrite' });

      expect(response.status).toBe(422); // Unprocessable entity
      expect(response.body.error).toContain('checksum');
    });

    it('should support merge mode (append new files)', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/${backupId}/restore`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({ mode: 'merge' });

      expect(response.status).toBe(200);
      expect(response.body.mode).toBe('merge');
      expect(response.body).toHaveProperty('new_files');
    });
  });

  describe('POST /api/v1/backup/schedule', () => {
    it('should parse cron expression and schedule backup', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/schedule`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({
          cron_expression: '0 0 * * *', // Daily at midnight
          description: 'Daily full backup',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('schedule_id');
      expect(response.body.next_run).toBeDefined();
      expect(response.body.cron_expression).toBe('0 0 * * *');
    });

    it('should reject invalid cron expression', async () => {
      const response = await request(app)
        .post(`${baseEndpoint}/schedule`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .send({
          cron_expression: 'invalid cron',
          description: 'Bad schedule',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cron');
    });
  });

  describe('GET /api/v1/backup/list', () => {
    it('should list all backups with pagination', async () => {
      const response = await request(app)
        .get(`${baseEndpoint}/list`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`)
        .query({ limit: 50, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('backups');
      expect(response.body).toHaveProperty('total_count');
      expect(response.body.backups).toBeInstanceOf(Array);
    });

    it('should show storage usage summary', async () => {
      const response = await request(app)
        .get(`${baseEndpoint}/list`)
        .set('Authorization', `Bearer ${TEST_USERS.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_storage_bytes');
      expect(response.body).toHaveProperty('storage_formatted'); // e.g., "1.5 GB"
    });
  });
});
```

---

## Part 5: Running Supertest Tests

### Installation

```bash
npm install --save-dev supertest jest
```

### Commands

```bash
# Run all API tests
npm test -- __tests__/api

# Run specific API test file
npm test -- __tests__/api/assets.test.js

# Run with coverage
npm test -- __tests__/api --coverage

# Run with detailed performance logging
npm test -- __tests__/api --verbose
```

### Expected Output

```
 PASS  __tests__/api/assets.test.js
  Asset APIs
    POST /api/v1/assets/by-qr
      ✓ should retrieve asset by QR code with valid token (45ms)
      ✓ should return 401 without authorization header (12ms)
      ✓ should return 401 with invalid token (11ms)
      ✓ should return 404 for non-existent QR code (18ms)
      ✓ should validate QR code format (8ms)
    GET /api/v1/assets/search
      ✓ should search assets by text with pagination (78ms)
      ✓ should filter by category (72ms)
      ✓ should filter by location (65ms)
      ✓ should enforce RLS policy (102ms)
    POST /api/v1/assets/:id/audit
      ✓ should retrieve audit history as CSV (55ms)
    Performance: Batch operations
      ✓ should handle 10 concurrent GET requests under 200ms each (185ms)
      ✓ should report performance metrics (1ms)
      API Performance Summary:
        Requests: 45
        Min: 8ms
        Avg: 52.34ms
        P95: 98ms
        P99: 145ms
        Max: 185ms

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Time:        4.521 s
```

---

## Part 6: API Performance Targets

| API Endpoint | P95 Target | P99 Target | Test Type |
|-----------|-----------|-----------|-----------|
| GET /assets/search | 150ms | 250ms | Integration |
| POST /assets/by-qr | 100ms | 180ms | Integration |
| GET /travel/requests | 120ms | 200ms | Integration |
| POST /travel/upload-voucher | 500ms | 1000ms | Integration (file I/O) |
| POST /backup/create | 2000ms | 3000ms | Integration (full scope) |
| POST /backup/restore | 5000ms | 8000ms | Integration (full scope) |
| GET /backup/list | 150ms | 250ms | Integration |

---

**Document Status**: ✅ Ready for commit (2026-06-02)  
**Next**: E2E test templates (Playwright)
