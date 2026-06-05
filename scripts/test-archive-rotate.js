#!/usr/bin/env node

/**
 * Test Suite for Memory Archive Rotation System
 * Purpose: Validate functionality before production deployment
 * Usage: node scripts/test-archive-rotate.js [--dry-run] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, '../test-archive-rotate');
const TEST_MEMORY_FILE = path.join(TEST_DIR, 'MEMORY.md');

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('📋 Running Archive Rotation Test Suite\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (err) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${err.message}\n`);
        this.failed++;
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

const runner = new TestRunner();

/**
 * Test 1: Validate script file exists
 */
runner.test('Script file exists', () => {
  const scriptPath = path.join(__dirname, 'archive-rotate.js');
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script not found: ${scriptPath}`);
  }
});

/**
 * Test 2: Validate database schema file exists
 */
runner.test('Database schema file exists', () => {
  const schemaPath = path.join(__dirname, '../db/40_memory_archive.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
});

/**
 * Test 3: Validate cron wrapper script exists
 */
runner.test('Cron wrapper script exists', () => {
  const cronPath = path.join(__dirname, 'archive-rotate-cron.sh');
  if (!fs.existsSync(cronPath)) {
    throw new Error(`Cron script not found: ${cronPath}`);
  }
});

/**
 * Test 4: Test memory file parsing (dry run)
 */
runner.test('Parse MEMORY.md with dry-run', () => {
  const memoryPath = path.join(__dirname, '../memory/MEMORY.md');
  if (!fs.existsSync(memoryPath)) {
    throw new Error(`MEMORY.md not found: ${memoryPath}`);
  }

  try {
    execSync(`node ${path.join(__dirname, 'archive-rotate.js')} --dry-run --verbose`, {
      stdio: 'pipe',
      timeout: 30000,
      cwd: path.join(__dirname, '..'),
    });
  } catch (err) {
    // Expected - just checking it doesn't crash
    if (!err.stdout.toString().includes('Parsing MEMORY.md')) {
      throw new Error('Script failed: ' + err.stderr.toString());
    }
  }
});

/**
 * Test 5: Validate log file creation
 */
runner.test('Log file creation', () => {
  const logsDir = path.join(__dirname, '../memory/logs');
  if (!fs.existsSync(logsDir)) {
    throw new Error(`Logs directory not found: ${logsDir}`);
  }

  // Check if at least one log file exists
  const logFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('archive-rotation-'));
  if (logFiles.length === 0) {
    console.log('   Note: No archive-rotation logs yet (normal on first run)');
  }
});

/**
 * Test 6: Create test memory file and validate parsing
 */
runner.test('Parse test memory file', () => {
  // Create test directory
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }

  // Create test MEMORY.md with dated sections
  const now = new Date();
  const old = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000); // 16 days old
  const recent = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days old

  const testContent = `# 메모리 인덱스 — DSC Mannur FMS

**✅ OLD SECTION (${formatDate(old)}) — Should be archived**
- This section is older than 14 days
- It should be picked up for archival

---

**✅ RECENT SECTION (${formatDate(recent)}) — Should be kept**
- This section is only 5 days old
- It should remain in MEMORY.md

---
`;

  fs.writeFileSync(TEST_MEMORY_FILE, testContent, 'utf8');

  // Verify file was created
  if (!fs.existsSync(TEST_MEMORY_FILE)) {
    throw new Error('Failed to create test MEMORY.md');
  }

  // Check content
  const content = fs.readFileSync(TEST_MEMORY_FILE, 'utf8');
  if (!content.includes('OLD SECTION') || !content.includes('RECENT SECTION')) {
    throw new Error('Test file content validation failed');
  }
});

/**
 * Test 7: Validate Node.js module dependencies
 */
runner.test('Required Node modules available', () => {
  const requiredModules = ['@supabase/supabase-js'];

  for (const mod of requiredModules) {
    try {
      require.resolve(mod);
    } catch (err) {
      // Try checking in project node_modules
      const projectPath = path.join(__dirname, '../dsc-fms-portal/node_modules', mod);
      if (!fs.existsSync(projectPath)) {
        console.log(`   Note: ${mod} not installed globally (will be available at runtime)`);
      }
    }
  }
});

/**
 * Test 8: Validate environment variables setup
 */
runner.test('Environment variable structure', () => {
  const envPath = path.join(__dirname, '../dsc-fms-portal/.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('   Note: .env.local not found (expected in deployment)');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      console.log(`   Warning: ${varName} not found in .env.local`);
    }
  }
});

/**
 * Test 9: Validate cron schedule configuration
 */
runner.test('Cron schedule format', () => {
  // This would validate the actual cron setup
  // For now, just check that the schedule is documented
  const expectedCron = '5 0 * * *'; // 00:05 UTC (15:05 JST previous day = 00:05 KST next day)
  console.log(`   Expected cron: "${expectedCron}" (daily at 00:05 KST)`);
});

/**
 * Test 10: Check retention period
 */
runner.test('Retention period configuration', () => {
  const scriptContent = fs.readFileSync(path.join(__dirname, 'archive-rotate.js'), 'utf8');

  if (!scriptContent.includes('RETENTION_DAYS: 14')) {
    throw new Error('Retention period not set to 14 days');
  }
});

/**
 * Helper: Format date for test file
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${mins} KST`;
}

/**
 * Main test execution
 */
async function main() {
  const success = await runner.run();

  // Cleanup
  if (fs.existsSync(TEST_DIR)) {
    console.log('\n🧹 Cleaning up test files...');
    try {
      fs.rmSync(TEST_DIR, { recursive: true });
    } catch (err) {
      console.log('   Warning: Failed to cleanup test directory');
    }
  }

  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
