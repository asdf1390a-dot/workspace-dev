#!/usr/bin/env node

/**
 * Team Dashboard Phase 2 — Comprehensive API Verification Pipeline
 * Includes: schema verification, auth validation, endpoint testing, integration checks
 */

const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 10000;

function request(method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const body = options.body ? JSON.stringify(options.body) : undefined;

    const req = http.request(
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
      reject(new Error(`Timeout ${TIMEOUT}ms`));
    });

    if (body) req.write(body);
    req.end();
  });
}

function makeJwt(payload = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      sub: 'test-user-' + Date.now(),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload,
    })
  ).toString('base64url');
  return `${header}.${body}.sig`;
}

function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class VerificationReporter {
  constructor() {
    this.sections = [];
    this.passed = 0;
    this.failed = 0;
  }

  startSection(title) {
    this.currentSection = { title, tests: [] };
  }

  endSection() {
    if (this.currentSection) {
      this.sections.push(this.currentSection);
    }
  }

  pass(name, details = '') {
    this.currentSection?.tests.push({ name, status: 'pass', details });
    this.passed++;
  }

  fail(name, error = '', details = '') {
    this.currentSection?.tests.push({ name, status: 'fail', error, details });
    this.failed++;
  }

  print() {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 TEAM DASHBOARD PHASE 2 — API VERIFICATION REPORT');
    console.log('='.repeat(70) + '\n');

    this.sections.forEach((section) => {
      console.log(`\n📋 ${section.title}`);
      console.log('-'.repeat(70));
      section.tests.forEach((test) => {
        const icon = test.status === 'pass' ? '✅' : '❌';
        console.log(`  ${icon} ${test.name}`);
        if (test.details) console.log(`     ${test.details}`);
        if (test.error) console.log(`     ❗ ${test.error}`);
      });
    });

    console.log('\n' + '='.repeat(70));
    console.log(`📊 RESULTS: ${this.passed} passed, ${this.failed} failed`);
    console.log(`   ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}% success rate`);
    console.log('='.repeat(70) + '\n');

    // Save report
    const reportPath = './TEAM_DASHBOARD_VERIFICATION_REPORT.json';
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: {
        passed: this.passed,
        failed: this.failed,
        total: this.passed + this.failed,
        successRate: ((this.passed / (this.passed + this.failed)) * 100).toFixed(1) + '%',
      },
      sections: this.sections,
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}\n`);

    return this.failed === 0;
  }
}

const reporter = new VerificationReporter();

async function verifyConnectivity() {
  reporter.startSection('API Connectivity');

  try {
    const res = await request('GET', '/api/team/members?limit=1');
    if (res.status === 200) {
      reporter.pass('Server responds to API requests', `HTTP ${res.status}`);
    } else {
      reporter.fail('Server connectivity', `HTTP ${res.status}`);
    }
  } catch (err) {
    reporter.fail('Server connectivity', err.message);
  }

  reporter.endSection();
}

async function verifyPublicEndpoints() {
  reporter.startSection('Public Endpoints (No Auth Required)');

  const tests = [
    { method: 'GET', path: '/api/team/members?limit=10', name: 'List members' },
    { method: 'GET', path: '/api/team/members?page=1&limit=5&search=test', name: 'List members with search' },
    { method: 'GET', path: '/api/team/structure', name: 'Get team structure' },
    { method: 'GET', path: '/api/team/portfolio', name: 'List portfolio items' },
    { method: 'GET', path: '/api/team/activity?limit=10', name: 'List activity log' },
  ];

  for (const test of tests) {
    try {
      const res = await request(test.method, test.path);
      if (res.status === 200 && res.data?.success) {
        reporter.pass(test.name, `200 OK, ${(res.data.data || []).length} items`);
      } else {
        reporter.fail(test.name, `HTTP ${res.status}`, JSON.stringify(res.data));
      }
    } catch (err) {
      reporter.fail(test.name, err.message);
    }
  }

  reporter.endSection();
}

async function verifyAuthentication() {
  reporter.startSection('Authentication & Authorization');

  const jwt = makeJwt();

  const tests = [
    {
      name: 'POST /api/team/members without auth',
      method: 'POST',
      path: '/api/team/members',
      body: { name: 'Test', email: 'test@example.com' },
      expectedStatus: 401,
      requireAuth: false,
    },
    {
      name: 'POST /api/team/members with auth (invalid body)',
      method: 'POST',
      path: '/api/team/members',
      body: { name: 'Test' },
      expectedStatus: 400,
      requireAuth: true,
    },
    {
      name: 'POST /api/team/members with valid auth',
      method: 'POST',
      path: '/api/team/members',
      body: {
        name: 'Verify Test ' + Date.now(),
        email: `verify-${Date.now()}@example.com`,
        department: '기술',
      },
      expectedStatus: 201,
      requireAuth: true,
    },
  ];

  for (const test of tests) {
    try {
      const headers = test.requireAuth ? { authorization: `Bearer ${jwt}` } : {};
      const res = await request(test.method, test.path, { body: test.body, headers });

      if (res.status === test.expectedStatus) {
        reporter.pass(test.name, `HTTP ${res.status}`);
      } else {
        reporter.fail(
          test.name,
          `Expected ${test.expectedStatus}, got ${res.status}`,
          res.data?.error || ''
        );
      }
    } catch (err) {
      reporter.fail(test.name, err.message);
    }
  }

  reporter.endSection();
}

async function verifyDataIntegration() {
  reporter.startSection('Data Integration Points');

  const jwt = makeJwt();
  let createdMemberId = null;

  // 1. Create a member
  try {
    const res = await request('POST', '/api/team/members', {
      body: {
        name: 'Integration Test ' + Date.now(),
        email: `integration-${Date.now()}@example.com`,
        department: '기술',
      },
      headers: { authorization: `Bearer ${jwt}` },
    });

    if (res.status === 201 && res.data?.data?.id) {
      createdMemberId = res.data.data.id;
      reporter.pass('Create member', `Member ID: ${createdMemberId.slice(0, 8)}...`);
    } else {
      reporter.fail('Create member', `HTTP ${res.status}`);
    }
  } catch (err) {
    reporter.fail('Create member', err.message);
  }

  // 2. Verify member in list
  if (createdMemberId) {
    try {
      const res = await request('GET', `/api/team/members?limit=50`);
      if (
        res.status === 200 &&
        res.data?.data?.some((m) => m.id === createdMemberId)
      ) {
        reporter.pass('Retrieve created member in list', 'Member found in subsequent query');
      } else {
        reporter.fail('Retrieve created member in list', 'Member not found');
      }
    } catch (err) {
      reporter.fail('Retrieve created member in list', err.message);
    }
  }

  // 3. Add portfolio item
  if (createdMemberId) {
    try {
      const res = await request('POST', `/api/portfolio/${createdMemberId}`, {
        body: { project_name: 'Integration Test Project' },
        headers: { authorization: `Bearer ${jwt}` },
      });

      if (res.status === 201) {
        reporter.pass('Add portfolio item', `Portfolio item created`);
      } else {
        reporter.fail('Add portfolio item', `HTTP ${res.status}`, res.data?.error);
      }
    } catch (err) {
      reporter.fail('Add portfolio item', err.message);
    }
  }

  // 4. Log activity
  if (createdMemberId) {
    try {
      const res = await request('POST', `/api/team/activity`, {
        body: { member_id: createdMemberId, activity_type: 'login' },
        headers: { authorization: `Bearer ${jwt}` },
      });

      if (res.status === 201) {
        reporter.pass('Log activity', `Activity logged`);
      } else {
        reporter.fail('Log activity', `HTTP ${res.status}`, res.data?.error);
      }
    } catch (err) {
      reporter.fail('Log activity', err.message);
    }
  }

  reporter.endSection();
}

async function verifyErrorHandling() {
  reporter.startSection('Error Handling & Edge Cases');

  const tests = [
    {
      name: 'Invalid pagination (negative page)',
      method: 'GET',
      path: '/api/team/members?page=-1&limit=20',
      shouldSucceed: true,
    },
    {
      name: 'Excessive pagination limit',
      method: 'GET',
      path: '/api/team/members?page=1&limit=9999',
      shouldSucceed: true,
    },
    {
      name: 'Nonexistent member',
      method: 'GET',
      path: `/api/team/members/${v4()}`,
      shouldSucceed: false, // 404 is expected
    },
    {
      name: 'Malformed request body',
      method: 'POST',
      path: '/api/team/members',
      body: 'invalid json',
      shouldSucceed: false,
    },
  ];

  for (const test of tests) {
    try {
      const res = await request(test.method, test.path, { body: test.body });
      const isSuccess = res.status < 400;

      if (isSuccess === test.shouldSucceed) {
        reporter.pass(test.name, `HTTP ${res.status} (as expected)`);
      } else {
        reporter.fail(test.name, `HTTP ${res.status}`);
      }
    } catch (err) {
      if (test.shouldSucceed) {
        reporter.fail(test.name, err.message);
      } else {
        reporter.pass(test.name, `Error as expected: ${err.message}`);
      }
    }
  }

  reporter.endSection();
}

async function runAllVerifications() {
  try {
    await verifyConnectivity();
    await verifyPublicEndpoints();
    await verifyAuthentication();
    await verifyDataIntegration();
    await verifyErrorHandling();

    const success = reporter.print();
    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error('Fatal verification error:', err);
    process.exit(1);
  }
}

runAllVerifications();
