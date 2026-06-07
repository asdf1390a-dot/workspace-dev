#!/usr/bin/env node

/**
 * Team Dashboard Phase 2 — API Verification Pipeline
 * Smoke tests, auth validation, data integration checks
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Config
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 10000;

// Helper to make HTTP requests
function request(method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    const body = options.body ? JSON.stringify(options.body) : undefined;

    const req = protocol.request(
      url,
      {
        method,
        headers: {
          'content-type': 'application/json',
          ...options.headers,
        },
        timeout: TIMEOUT,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });

    if (body) req.write(body);
    req.end();
  });
}

// Generate mock JWT (same as test file)
function makeJwt(payload = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      sub: 'user-verify-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload,
    })
  ).toString('base64url');
  return `${header}.${body}.sig`;
}

// Test cases
const tests = [
  {
    name: 'GET /api/team/members (no auth)',
    method: 'GET',
    path: '/api/team/members?limit=1',
    expectedStatus: 200,
  },
  {
    name: 'GET /api/team/members with pagination',
    method: 'GET',
    path: '/api/team/members?page=1&limit=20',
    expectedStatus: 200,
  },
  {
    name: 'GET /api/team/members invalid pagination (should clamp)',
    method: 'GET',
    path: '/api/team/members?page=-1&limit=9999',
    expectedStatus: 200,
  },
  {
    name: 'POST /api/team/members (no auth, should fail)',
    method: 'POST',
    path: '/api/team/members',
    body: { name: 'Test', email: 'test@example.com' },
    expectedStatus: 401,
  },
  {
    name: 'POST /api/team/members (with auth)',
    method: 'POST',
    path: '/api/team/members',
    body: { name: 'Verify', email: `verify-${Date.now()}@example.com`, department: '기술' },
    headers: { authorization: `Bearer ${makeJwt()}` },
    expectedStatus: 201,
  },
  {
    name: 'GET /api/team/members/:id',
    method: 'GET',
    path: '/api/team/members/1',
    expectedStatus: [200, 404], // Depends on DB content
  },
  {
    name: 'GET /api/team/structure',
    method: 'GET',
    path: '/api/team/structure',
    expectedStatus: 200,
  },
  {
    name: 'POST /api/team/structure (no auth, should fail)',
    method: 'POST',
    path: '/api/team/structure',
    body: { member_id: 'a' },
    expectedStatus: 401,
  },
  {
    name: 'POST /api/team/structure (with auth)',
    method: 'POST',
    path: '/api/team/structure',
    body: { member_id: `member-${Date.now()}`, position_level: 0 },
    headers: { authorization: `Bearer ${makeJwt()}` },
    expectedStatus: 201,
  },
  {
    name: 'GET /api/team/portfolio',
    method: 'GET',
    path: '/api/team/portfolio',
    expectedStatus: 200,
  },
  {
    name: 'GET /api/portfolio/:memberId',
    method: 'GET',
    path: '/api/portfolio/test-member',
    expectedStatus: [200, 404],
  },
  {
    name: 'POST /api/portfolio/:memberId (no auth)',
    method: 'POST',
    path: '/api/portfolio/test-member',
    body: { project_name: 'Test' },
    expectedStatus: 401,
  },
  {
    name: 'POST /api/portfolio/:memberId (with auth)',
    method: 'POST',
    path: `/api/portfolio/verify-${Date.now()}`,
    body: { project_name: 'Integration Test' },
    headers: { authorization: `Bearer ${makeJwt()}` },
    expectedStatus: 201,
  },
  {
    name: 'GET /api/team/activity',
    method: 'GET',
    path: '/api/team/activity?limit=5',
    expectedStatus: 200,
  },
  {
    name: 'GET /api/activity-log/:memberId',
    method: 'GET',
    path: '/api/activity-log/test-member',
    expectedStatus: [200, 404],
  },
  {
    name: 'POST /api/team/activity (no auth)',
    method: 'POST',
    path: '/api/team/activity',
    body: { member_id: 'a' },
    expectedStatus: 401,
  },
  {
    name: 'POST /api/team/activity (with auth, missing fields)',
    method: 'POST',
    path: '/api/team/activity',
    body: { member_id: 'a' },
    headers: { authorization: `Bearer ${makeJwt()}` },
    expectedStatus: 400,
  },
  {
    name: 'POST /api/team/activity (with auth)',
    method: 'POST',
    path: '/api/team/activity',
    body: { member_id: `verify-${Date.now()}`, activity_type: 'login' },
    headers: { authorization: `Bearer ${makeJwt()}` },
    expectedStatus: 201,
  },
];

// Run tests
async function runTests() {
  console.log('🧪 Team Dashboard Phase 2 — API Verification Pipeline');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏱️  Timeout: ${TIMEOUT}ms\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of tests) {
    try {
      const headers = test.headers || {};
      const res = await request(test.method, test.path, { body: test.body, headers });

      const expectedStatuses = Array.isArray(test.expectedStatus)
        ? test.expectedStatus
        : [test.expectedStatus];

      const isSuccess = expectedStatuses.includes(res.status);

      if (isSuccess) {
        console.log(`✅ ${test.name}`);
        console.log(`   ${test.method} ${test.path} → ${res.status}`);
        passed++;
      } else {
        console.log(
          `❌ ${test.name}\n   Expected ${expectedStatuses.join('|')}, got ${res.status}`
        );
        failed++;
        failures.push({
          test: test.name,
          expected: expectedStatuses,
          got: res.status,
          body: res.data,
        });
      }
    } catch (err) {
      console.log(`❌ ${test.name}\n   Error: ${err.message}`);
      failed++;
      failures.push({ test: test.name, error: err.message });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Results: ${passed}/${passed + failed} passed`);
  console.log(`${'='.repeat(60)}\n`);

  if (failures.length > 0) {
    console.log('❌ Failures:');
    failures.forEach((f) => {
      console.log(`  - ${f.test}`);
      if (f.error) console.log(`    Error: ${f.error}`);
      if (f.got) console.log(`    Got status ${f.got}, expected ${f.expected.join('|')}`);
    });
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
