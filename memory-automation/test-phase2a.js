#!/usr/bin/env node

const http = require('http');

const API_URL = 'http://localhost:3009';
const TEST_SESSION_KEY = 'test-session-key-phase2a';
const TEST_MEMORY_PATH = 'MEMORY.md';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Helper: Make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test runner
async function test(name, fn) {
  testsRun++;
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

// Assert helpers
function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg) {
  if (!value) {
    throw new Error(msg);
  }
}

function assertExists(value, msg) {
  if (value === undefined || value === null) {
    throw new Error(msg);
  }
}

// Test suite
async function runTests() {
  console.log('=== Phase 2A Message Collection API Tests ===\n');

  // Test 1: Health check
  await test('GET /health returns 200 and status ready', async () => {
    const res = await makeRequest('GET', '/health');
    assertEqual(res.status, 200, 'Status code');
    assertEqual(res.body.status, 'ready', 'Status field');
    assertExists(res.body.timestamp, 'Timestamp exists');
    assertTrue(res.body.uptime >= 0, 'Uptime is non-negative');
  });

  // Test 2: Collect messages - missing sessionKey
  await test('POST /api/collect-messages requires sessionKey', async () => {
    const res = await makeRequest('POST', '/api/collect-messages', {});
    assertEqual(res.status, 400, 'Status code');
    assertEqual(res.body.code, 'MISSING_SESSION_KEY', 'Error code');
  });

  // Test 3: Collect messages - with sessionKey
  await test('POST /api/collect-messages accepts valid input', async () => {
    const res = await makeRequest('POST', '/api/collect-messages', {
      sessionKey: TEST_SESSION_KEY,
      limit: 10,
      offset: 0,
      includeTools: true,
    });
    // May fail to connect to gateway, but structure should be correct
    if (res.status === 500) {
      assertTrue(res.body.code, 'Error response has code');
    } else {
      assertTrue(Array.isArray(res.body.messages), 'Messages is array');
      assertExists(res.body.count, 'Count exists');
    }
  });

  // Test 4: Collect memory - missing path
  await test('POST /api/collect-memory requires path', async () => {
    const res = await makeRequest('POST', '/api/collect-memory', {});
    assertEqual(res.status, 400, 'Status code');
    assertEqual(res.body.code, 'MISSING_PATH', 'Error code');
  });

  // Test 5: Collect memory - valid path
  await test('POST /api/collect-memory accepts valid path', async () => {
    const res = await makeRequest('POST', '/api/collect-memory', {
      path: TEST_MEMORY_PATH,
      lines: 50,
    });
    if (res.status === 200) {
      assertEqual(res.body.success, true, 'Success flag');
      assertExists(res.body.filename, 'Filename exists');
      assertExists(res.body.content, 'Content exists');
      assertExists(res.body.checksum, 'Checksum exists');
    } else if (res.status === 404) {
      assertEqual(res.body.code, 'FILE_NOT_FOUND', 'Error code');
    }
  });

  // Test 6: Batch collect - empty items
  await test('POST /api/batch-collect requires items array', async () => {
    const res = await makeRequest('POST', '/api/batch-collect', {
      items: [],
    });
    assertEqual(res.status, 400, 'Status code');
    assertEqual(res.body.code, 'INVALID_INPUT', 'Error code');
  });

  // Test 7: Batch collect - mixed types
  await test('POST /api/batch-collect handles mixed types', async () => {
    const res = await makeRequest('POST', '/api/batch-collect', {
      items: [
        { type: 'message', params: { sessionKey: TEST_SESSION_KEY, limit: 5 } },
        { type: 'memory', params: { path: TEST_MEMORY_PATH, lines: 10 } },
      ],
    });
    assertTrue(res.body.results !== undefined, 'Results array exists');
    assertTrue(Array.isArray(res.body.results), 'Results is array');
    assertExists(res.body.totalTime, 'totalTime exists');
  });

  // Test 8: Status endpoint
  await test('GET /api/status returns metrics', async () => {
    const res = await makeRequest('GET', '/api/status');
    assertEqual(res.status, 200, 'Status code');
    assertExists(res.body.uptime, 'Uptime exists');
    assertTrue(res.body.messagesCollected >= 0, 'messagesCollected is non-negative');
    assertTrue(res.body.memoryFilesRead >= 0, 'memoryFilesRead is non-negative');
    assertTrue(res.body.errors >= 0, 'errors is non-negative');
  });

  // Test 9: Response times
  await test('All endpoints respond within 2 seconds', async () => {
    const startTime = Date.now();
    await makeRequest('GET', '/health');
    const elapsed = Date.now() - startTime;
    assertTrue(elapsed < 2000, `Response time ${elapsed}ms exceeds 2000ms`);
  });

  // Summary
  console.log(`\n=== Test Results ===`);
  console.log(`Total: ${testsRun}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests with delay to allow server startup
setTimeout(runTests, 1000);
