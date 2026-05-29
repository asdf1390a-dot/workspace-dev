#!/usr/bin/env node
/**
 * H4 Components 2-4: Unit Test Suite
 * Tests for Auto-Executor, Cron Monitor, and User Interface
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  SCANNER_RESULTS: path.join(process.cwd(), 'memory', 'H4_SCANNER_RESULTS.json'),
  INTERFACE_CONFIG: path.join(process.cwd(), 'memory', 'H4_USER_INTERFACE_CONFIG.json'),
  COMPONENT2_LOG: path.join(process.cwd(), 'memory', 'H4_COMPONENT2_EXECUTION_LOG.json'),
  COMPONENT3_LOG: path.join(process.cwd(), 'memory', 'H4_CRON_MONITOR_LOG.json'),
  COMPONENT4_CONFIG: path.join(process.cwd(), 'memory', 'H4_USER_INTERFACE_CONFIG.json')
};

class TestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  test(name, fn) {
    this.results.total++;
    try {
      fn();
      this.results.passed++;
      this.results.tests.push({ name, status: '✅ PASS' });
      console.log(`✅ ${name}`);
    } catch (err) {
      this.results.failed++;
      this.results.tests.push({ name, status: '❌ FAIL', error: err.message });
      console.log(`❌ ${name}: ${err.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertExists(obj, key, message) {
    if (!obj.hasOwnProperty(key)) {
      throw new Error(message || `Key ${key} does not exist`);
    }
  }

  assertArrayLength(arr, length, message) {
    if (!Array.isArray(arr)) {
      throw new Error(`Expected array, got ${typeof arr}`);
    }
    if (arr.length !== length) {
      throw new Error(message || `Expected length ${length}, got ${arr.length}`);
    }
  }

  printSummary() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST SUMMARY`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
  }
}

// Component 2: Auto-Executor Tests
function testComponent2() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`COMPONENT 2: AUTO-EXECUTOR TESTS`);
  console.log(`${'='.repeat(70)}\n`);

  const suite = new TestSuite();

  suite.test('Component 2: Execution log file exists', () => {
    suite.assert(
      fs.existsSync(CONFIG.COMPONENT2_LOG),
      'H4_COMPONENT2_EXECUTION_LOG.json not found'
    );
  });

  suite.test('Component 2: Execution log has valid JSON', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    JSON.parse(content);
  });

  suite.test('Component 2: Execution log contains timestamp', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assertExists(log, 'timestamp', 'timestamp field missing');
  });

  suite.test('Component 2: Execution log contains component identifier', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assertEquals(log.component, 'H4-Component2', 'component identifier incorrect');
  });

  suite.test('Component 2: Summary contains total_blockers', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assertExists(log.summary, 'total_blockers', 'total_blockers missing');
    suite.assertEquals(log.summary.total_blockers, 2, 'Expected 2 blockers');
  });

  suite.test('Component 2: Summary contains success/failure counts', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assertExists(log.summary, 'successful', 'successful count missing');
    suite.assertExists(log.summary, 'failed', 'failed count missing');
  });

  suite.test('Component 2: Executions array contains entries', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assert(
      Array.isArray(log.executions),
      'executions is not an array'
    );
  });

  suite.test('Component 2: Each execution has required fields', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const log = JSON.parse(content);

    for (const exec of log.executions) {
      suite.assertExists(exec, 'blocker_id', 'blocker_id missing');
      suite.assertExists(exec, 'type', 'type missing');
      suite.assertExists(exec, 'status', 'status missing');
      suite.assertExists(exec, 'start_time', 'start_time missing');
    }
  });

  suite.test('Component 2: State transitions are recorded', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assertExists(log.summary, 'state_transitions', 'state_transitions missing');
    suite.assert(
      Array.isArray(log.summary.state_transitions),
      'state_transitions is not an array'
    );
  });

  return suite;
}

// Component 3: Cron Monitor Tests
function testComponent3() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`COMPONENT 3: CRON MONITOR TESTS`);
  console.log(`${'='.repeat(70)}\n`);

  const suite = new TestSuite();

  suite.test('Component 3: Monitor log file exists', () => {
    suite.assert(
      fs.existsSync(CONFIG.COMPONENT3_LOG),
      'H4_CRON_MONITOR_LOG.json not found'
    );
  });

  suite.test('Component 3: Monitor log has valid JSON', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    JSON.parse(content);
  });

  suite.test('Component 3: Monitor log contains run_id', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assertExists(log, 'run_id', 'run_id field missing');
    suite.assert(
      log.run_id.startsWith('H4-CRON-'),
      'run_id has incorrect format'
    );
  });

  suite.test('Component 3: Monitor log contains checks array', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assert(
      Array.isArray(log.checks),
      'checks is not an array'
    );
  });

  suite.test('Component 3: Each check contains blocker_id and duration', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const log = JSON.parse(content);

    for (const check of log.checks) {
      suite.assertExists(check, 'blocker_id', 'blocker_id missing');
      suite.assertExists(check, 'blockage_duration_hours', 'blockage_duration_hours missing');
      suite.assert(
        typeof check.blockage_duration_hours === 'number',
        'blockage_duration_hours is not numeric'
      );
    }
  });

  suite.test('Component 3: Monitor log contains escalations array', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assert(
      Array.isArray(log.escalations),
      'escalations is not an array'
    );
  });

  suite.test('Component 3: Summary contains blocker count', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const log = JSON.parse(content);
    suite.assertExists(log.summary, 'blockers_detected', 'blockers_detected missing');
  });

  suite.test('Component 3: Escalation threshold validation', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const log = JSON.parse(content);

    for (const escalation of log.escalations) {
      suite.assertExists(escalation, 'threshold_hours', 'threshold_hours missing');
      suite.assert(
        [6, 12, 18].includes(escalation.threshold_hours),
        `Invalid escalation threshold: ${escalation.threshold_hours}`
      );
      suite.assertExists(escalation, 'level', 'level missing');
      suite.assert(
        ['WARNING', 'CRITICAL', 'EMERGENCY'].includes(escalation.level),
        `Invalid escalation level: ${escalation.level}`
      );
    }
  });

  return suite;
}

// Component 4: User Interface Tests
function testComponent4() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`COMPONENT 4: USER INTERFACE TESTS`);
  console.log(`${'='.repeat(70)}\n`);

  const suite = new TestSuite();

  suite.test('Component 4: Interface config file exists', () => {
    suite.assert(
      fs.existsSync(CONFIG.COMPONENT4_CONFIG),
      'H4_USER_INTERFACE_CONFIG.json not found'
    );
  });

  suite.test('Component 4: Interface config has valid JSON', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    JSON.parse(content);
  });

  suite.test('Component 4: Interface config has interface_type', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);
    suite.assertEquals(config.interface_type, 'telegram', 'interface_type should be telegram');
  });

  suite.test('Component 4: Interface config has timeout_seconds', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);
    suite.assertEquals(config.timeout_seconds, 600, 'timeout should be 600 seconds (10 min)');
  });

  suite.test('Component 4: Templates array exists and has 8 templates', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);
    suite.assertArrayLength(config.templates, 8, 'Expected 8 templates (2 main + 4 reminder/timeout)');
  });

  suite.test('Component 4: BM-P1 confirmation template exists', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);
    const bm_template = config.templates.find(t => t.template_id === 'BM_P1_CONFIRMATION');
    suite.assert(bm_template, 'BM_P1_CONFIRMATION template not found');
    suite.assert(bm_template.title.includes('DB Migration'), 'BM-P1 template missing title');
  });

  suite.test('Component 4: BM-P1 template has 3 buttons', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);
    const bm_template = config.templates.find(t => t.template_id === 'BM_P1_CONFIRMATION');
    suite.assertArrayLength(bm_template.buttons, 3, 'BM-P1 should have 3 buttons');
  });

  suite.test('Component 4: TELEGRAM config template exists', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);
    const tg_template = config.templates.find(t => t.template_id === 'TELEGRAM_CONFIG_CONFIRMATION');
    suite.assert(tg_template, 'TELEGRAM_CONFIG_CONFIRMATION template not found');
    suite.assert(tg_template.title.includes('Environment Variable'), 'Telegram template missing title');
  });

  suite.test('Component 4: TELEGRAM template has 3 buttons', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);
    const tg_template = config.templates.find(t => t.template_id === 'TELEGRAM_CONFIG_CONFIRMATION');
    suite.assertArrayLength(tg_template.buttons, 3, 'TELEGRAM should have 3 buttons');
  });

  suite.test('Component 4: Workflows array exists and has 2 workflows', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);
    suite.assertArrayLength(config.workflows, 2, 'Expected 2 workflows');
  });

  suite.test('Component 4: Each workflow has 6 states', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);

    for (const workflow of config.workflows) {
      suite.assertArrayLength(workflow.states, 6, `Workflow ${workflow.workflow_id} should have 6 states`);
    }
  });

  suite.test('Component 4: Workflow states include required transitions', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);

    for (const workflow of config.workflows) {
      const confirmationState = workflow.states.find(s => s.state === 'CONFIRMATION_PENDING');
      suite.assert(confirmationState, 'Missing CONFIRMATION_PENDING state');
      suite.assertExists(confirmationState.next_states, 'YES', 'Missing YES transition');
      suite.assertExists(confirmationState.next_states, 'NO', 'Missing NO transition');
    }
  });

  suite.test('Component 4: Reminder schedule is configured', () => {
    const content = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const config = JSON.parse(content);

    for (const workflow of config.workflows) {
      suite.assert(
        Array.isArray(workflow.reminder_schedule),
        'reminder_schedule is not an array'
      );
      suite.assertArrayLength(workflow.reminder_schedule, 2, 'Expected 2 reminders (5min and 9min)');
    }
  });

  return suite;
}

// Integration Tests
function testIntegration() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`INTEGRATION TESTS`);
  console.log(`${'='.repeat(70)}\n`);

  const suite = new TestSuite();

  suite.test('Integration: Scanner results feed Component 2', () => {
    const scanContent = fs.readFileSync(CONFIG.SCANNER_RESULTS, 'utf8');
    const scanResults = JSON.parse(scanContent);

    const exec2Content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const exec2Log = JSON.parse(exec2Content);

    suite.assertEquals(
      scanResults.summary.total_blockers,
      exec2Log.summary.total_blockers,
      'Blocker count mismatch between scanner and executor'
    );
  });

  suite.test('Integration: Component 2 executor creates state transitions', () => {
    const exec2Content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const exec2Log = JSON.parse(exec2Content);

    for (const transition of exec2Log.summary.state_transitions) {
      suite.assertEquals(transition.old_state, 'BLOCKED_ON_USER', 'Old state should be BLOCKED_ON_USER');
      suite.assertEquals(transition.new_state, 'COMPLETED', 'New state should be COMPLETED');
      suite.assertExists(transition, 'timestamp', 'Transition timestamp missing');
    }
  });

  suite.test('Integration: Component 3 checks use Component 2 execution results', () => {
    const monitorContent = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const monitorLog = JSON.parse(monitorContent);

    suite.assert(
      monitorLog.checks.length > 0,
      'Monitor should have found blockers'
    );

    for (const check of monitorLog.checks) {
      suite.assert(
        ['BM-P1', 'HARNESS-ENG-P1'].includes(check.blocker_id),
        `Unexpected blocker_id: ${check.blocker_id}`
      );
    }
  });

  suite.test('Integration: Component 4 templates match Component 2 blockers', () => {
    const exec2Content = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const exec2Log = JSON.parse(exec2Content);

    const uiContent = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const uiConfig = JSON.parse(uiContent);

    const blockerIds = exec2Log.executions.map(e => e.blocker_id);
    const templateBlockerIds = [...new Set(uiConfig.templates.map(t => t.blocker_id))];

    suite.assertEquals(
      blockerIds.sort().join(','),
      templateBlockerIds.sort().join(','),
      'Templates should match executor blockers'
    );
  });

  return suite;
}

// Main execution
async function main() {
  console.log(`${'='.repeat(70)}`);
  console.log(`H4 COMPONENTS 2-4: UNIT TEST SUITE`);
  console.log(`Execution: 2026-05-29 Testing Phase`);
  console.log(`${'='.repeat(70)}`);

  const suites = [
    testComponent2(),
    testComponent3(),
    testComponent4(),
    testIntegration()
  ];

  const totalTests = suites.reduce((sum, s) => sum + s.results.total, 0);
  const totalPassed = suites.reduce((sum, s) => sum + s.results.passed, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.results.failed, 0);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`OVERALL TEST SUMMARY`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

  if (totalFailed === 0) {
    console.log(`\n✅ ALL TESTS PASSED - Components ready for integration`);
    console.log(`\n🎯 Next: Integration Testing Phase 2 (2026-05-29 12:00 KST)`);
    console.log(`   • Component 1 → 2: Scanner output feeds executor`);
    console.log(`   • Component 2 → Registry: State transitions update correctly`);
    console.log(`   • Component 3 + Registry: Escalations trigger at thresholds`);
    console.log(`   • Component 4: Templates render with correct variables`);
    return 0;
  } else {
    console.log(`\n❌ TESTS FAILED - Review errors above`);
    return 1;
  }
}

main().then(code => process.exit(code));
