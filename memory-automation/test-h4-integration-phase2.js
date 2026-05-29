#!/usr/bin/env node
/**
 * H4 Integration Testing Phase 2
 * Validates cross-component data flow and state transitions
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  SCANNER_RESULTS: path.join(process.cwd(), 'memory', 'H4_SCANNER_RESULTS.json'),
  REGISTRY_FILE: path.join(process.cwd(), 'INCOMPLETE_TASKS_REGISTRY.md'),
  COMPONENT2_LOG: path.join(process.cwd(), 'memory', 'H4_COMPONENT2_EXECUTION_LOG.json'),
  COMPONENT3_LOG: path.join(process.cwd(), 'memory', 'H4_CRON_MONITOR_LOG.json'),
  COMPONENT4_CONFIG: path.join(process.cwd(), 'memory', 'H4_USER_INTERFACE_CONFIG.json'),
  INTEGRATION_REPORT: path.join(process.cwd(), 'memory', 'H4_INTEGRATION_PHASE2_REPORT.json')
};

class IntegrationTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };
  }

  test(name, fn) {
    this.results.summary.total++;
    try {
      const startTime = Date.now();
      fn();
      const duration = Date.now() - startTime;
      this.results.tests.push({
        name,
        status: 'PASS',
        duration_ms: duration,
        timestamp: new Date().toISOString()
      });
      this.results.summary.passed++;
      console.log(`✅ ${name}`);
    } catch (err) {
      this.results.tests.push({
        name,
        status: 'FAIL',
        error: err.message,
        timestamp: new Date().toISOString()
      });
      this.results.summary.failed++;
      console.log(`❌ ${name}: ${err.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertIncludes(arr, item, message) {
    if (!arr.includes(item)) {
      throw new Error(message || `${item} not found in array`);
    }
  }

  printSummary() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`INTEGRATION PHASE 2: RESULTS`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Total: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
  }

  saveReport() {
    fs.writeFileSync(
      CONFIG.INTEGRATION_REPORT,
      JSON.stringify(this.results, null, 2)
    );
    console.log(`\n✅ Report saved: ${CONFIG.INTEGRATION_REPORT}`);
  }
}

function runIntegrationTests() {
  console.log(`${'='.repeat(70)}`);
  console.log(`H4 INTEGRATION TESTING PHASE 2`);
  console.log(`Component Data Flow & State Transition Validation`);
  console.log(`${'='.repeat(70)}\n`);

  const test = new IntegrationTest();

  // Phase 2A: Component 1 → Component 2 Data Flow
  console.log(`\n### Phase 2A: Component 1 → Component 2 (Scanner → Executor)\n`);

  test.test('Scanner detects 2 blockers', () => {
    const content = fs.readFileSync(CONFIG.SCANNER_RESULTS, 'utf8');
    const results = JSON.parse(content);
    test.assertEquals(results.summary.total_blockers, 2, 'Expected 2 blockers');
  });

  test.test('Executor receives all detected blockers', () => {
    const scanContent = fs.readFileSync(CONFIG.SCANNER_RESULTS, 'utf8');
    const scanResults = JSON.parse(scanContent);

    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    test.assertEquals(
      scanResults.summary.total_blockers,
      execLog.summary.total_blockers,
      'Blocker count mismatch'
    );
  });

  test.test('Executor processes both blocker types', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    const types = execLog.executions.map(e => e.type);
    test.assertIncludes(types, 'db_migration', 'Missing db_migration');
    test.assertIncludes(types, 'env_var_config', 'Missing env_var_config');
  });

  test.test('BM-P1 migration details are preserved', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    const bmExec = execLog.executions.find(e => e.blocker_id === 'BM-P1');
    test.assert(bmExec, 'BM-P1 execution not found');
    test.assertEquals(bmExec.result.objects_created.tables, 1, 'Wrong table count');
    test.assertEquals(bmExec.result.objects_created.indexes, 8, 'Wrong index count');
  });

  test.test('HARNESS config value is passed to executor', () => {
    const scanContent = fs.readFileSync(CONFIG.SCANNER_RESULTS, 'utf8');
    const scanResults = JSON.parse(scanContent);

    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    const harExec = execLog.executions.find(e => e.blocker_id === 'HARNESS-ENG-P1');
    test.assert(harExec, 'HARNESS execution not found');
    test.assertEquals(harExec.result.variable, 'TELEGRAM_SECRETARY_CHAT_ID', 'Wrong variable name');
  });

  // Phase 2B: Component 2 → Registry State Transitions
  console.log(`\n### Phase 2B: Component 2 → Registry (Executor → State Machine)\n`);

  test.test('Executor records state transitions', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    test.assert(
      Array.isArray(execLog.summary.state_transitions),
      'state_transitions is not an array'
    );
    test.assertEquals(execLog.summary.state_transitions.length, 2, 'Expected 2 transitions');
  });

  test.test('All transitions are BLOCKED_ON_USER → COMPLETED', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    for (const transition of execLog.summary.state_transitions) {
      test.assertEquals(transition.old_state, 'BLOCKED_ON_USER', 'Wrong old state');
      test.assertEquals(transition.new_state, 'COMPLETED', 'Wrong new state');
    }
  });

  test.test('Each transition has timestamp and reason', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    for (const transition of execLog.summary.state_transitions) {
      test.assert(transition.timestamp, 'Missing timestamp');
      test.assert(transition.reason, 'Missing reason');
      test.assert(transition.reason.includes('success'), 'Reason should indicate success');
    }
  });

  test.test('BM-P1 transition recorded correctly', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    const bmTransition = execLog.summary.state_transitions.find(t => t.blocker_id === 'BM-P1');
    test.assert(bmTransition, 'BM-P1 transition not found');
    test.assert(bmTransition.timestamp, 'BM-P1 transition has no timestamp');
  });

  test.test('HARNESS transition recorded correctly', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    const harTransition = execLog.summary.state_transitions.find(t => t.blocker_id === 'HARNESS-ENG-P1');
    test.assert(harTransition, 'HARNESS transition not found');
    test.assert(harTransition.timestamp, 'HARNESS transition has no timestamp');
  });

  // Phase 2C: Component 3 + Registry Integration
  console.log(`\n### Phase 2C: Component 3 + Registry (Monitor → Escalation)\n`);

  test.test('Monitor detects same blockers as executor', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    const monitorContent = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const monitorLog = JSON.parse(monitorContent);

    const execBlockers = execLog.executions.map(e => e.blocker_id).sort();
    const monitorBlockers = monitorLog.checks.map(c => c.blocker_id).sort();

    test.assertEquals(
      execBlockers.join(','),
      monitorBlockers.join(','),
      'Monitor detects different blockers'
    );
  });

  test.test('Monitor calculates blockage duration in hours', () => {
    const monitorContent = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const monitorLog = JSON.parse(monitorContent);

    for (const check of monitorLog.checks) {
      test.assert(
        typeof check.blockage_duration_hours === 'number',
        `Duration is not numeric for ${check.blocker_id}`
      );
      test.assert(check.blockage_duration_hours >= 0, 'Duration cannot be negative');
    }
  });

  test.test('Monitor records escalations at correct thresholds', () => {
    const monitorContent = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const monitorLog = JSON.parse(monitorContent);

    for (const escalation of monitorLog.escalations) {
      test.assert([6, 12, 18].includes(escalation.threshold_hours), 'Invalid threshold');
      test.assert(
        ['WARNING', 'CRITICAL', 'EMERGENCY'].includes(escalation.level),
        'Invalid escalation level'
      );
    }
  });

  test.test('Escalation actions are properly mapped', () => {
    const monitorContent = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const monitorLog = JSON.parse(monitorContent);

    const escalationMap = {
      'WARNING': 'notify_ceo',
      'CRITICAL': 'urgent_telegram',
      'EMERGENCY': 'escalate_management'
    };

    for (const escalation of monitorLog.escalations) {
      test.assertEquals(
        escalation.action,
        escalationMap[escalation.level],
        `Wrong action for ${escalation.level}`
      );
    }
  });

  // Phase 2D: Component 4 Template Rendering
  console.log(`\n### Phase 2D: Component 4 (Templates → User Interface)\n`);

  test.test('All executor blockers have corresponding templates', () => {
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);

    const uiContent = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const uiConfig = JSON.parse(uiContent);

    const execBlockers = new Set(execLog.executions.map(e => e.blocker_id));
    const templateBlockers = new Set(uiConfig.templates.map(t => t.blocker_id));

    for (const blocker of execBlockers) {
      test.assert(templateBlockers.has(blocker), `No template for ${blocker}`);
    }
  });

  test.test('BM-P1 confirmation template shows migration details', () => {
    const uiContent = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const uiConfig = JSON.parse(uiContent);

    const bmTemplate = uiConfig.templates.find(t => t.template_id === 'BM_P1_CONFIRMATION');
    test.assert(bmTemplate.message.includes('230'), 'Migration line count missing');
    test.assert(bmTemplate.message.includes('8.22'), 'File size missing');
    test.assert(bmTemplate.message.includes('HIGH'), 'Safety level missing');
  });

  test.test('TELEGRAM template shows environment variable details', () => {
    const uiContent = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const uiConfig = JSON.parse(uiContent);

    const tgTemplate = uiConfig.templates.find(t => t.template_id === 'TELEGRAM_CONFIG_CONFIRMATION');
    test.assert(tgTemplate.message.includes('TELEGRAM_SECRETARY_CHAT_ID'), 'Variable name missing');
    test.assert(tgTemplate.message.includes('8650232975'), 'Chat ID value missing');
    test.assert(tgTemplate.message.includes('Vercel'), 'Platform missing');
  });

  test.test('All templates have timeout configuration', () => {
    const uiContent = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const uiConfig = JSON.parse(uiContent);

    for (const template of uiConfig.templates) {
      if (template.template_id.includes('CONFIRMATION')) {
        test.assertEquals(template.timeout_seconds, 600, `${template.template_id} timeout wrong`);
      }
    }
  });

  test.test('All templates have buttons with callbacks', () => {
    const uiContent = fs.readFileSync(CONFIG.COMPONENT4_CONFIG, 'utf8');
    const uiConfig = JSON.parse(uiContent);

    for (const template of uiConfig.templates) {
      if (template.buttons && template.buttons.length > 0) {
        for (const button of template.buttons) {
          test.assert(button.callback, `Button ${button.id} missing callback`);
          test.assert(button.label, `Button ${button.id} missing label`);
        }
      }
    }
  });

  // Phase 2E: End-to-End State Flow
  console.log(`\n### Phase 2E: End-to-End State Flow Validation\n`);

  test.test('Complete flow: Detection → Execution → Monitoring', () => {
    // Scanner detects blocker
    const scanContent = fs.readFileSync(CONFIG.SCANNER_RESULTS, 'utf8');
    const scanResults = JSON.parse(scanContent);
    test.assert(scanResults.summary.total_blockers > 0, 'Scanner found no blockers');

    // Executor processes and transitions state
    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);
    test.assertEquals(execLog.summary.successful, 2, 'Executor did not complete successfully');

    // Monitor checks for remaining blockers
    const monitorContent = fs.readFileSync(CONFIG.COMPONENT3_LOG, 'utf8');
    const monitorLog = JSON.parse(monitorContent);
    test.assert(monitorLog.checks.length > 0, 'Monitor found no blockers');
  });

  test.test('All component outputs are timestamped', () => {
    const files = [
      { name: 'Component 2', path: CONFIG.COMPONENT2_LOG },
      { name: 'Component 3', path: CONFIG.COMPONENT3_LOG },
      { name: 'Component 4', path: CONFIG.COMPONENT4_CONFIG }
    ];

    for (const file of files) {
      const content = fs.readFileSync(file.path, 'utf8');
      const data = JSON.parse(content);
      test.assert(data.timestamp, `${file.name} missing timestamp`);
    }
  });

  test.test('No data loss across component boundaries', () => {
    const scanContent = fs.readFileSync(CONFIG.SCANNER_RESULTS, 'utf8');
    const scanResults = JSON.parse(scanContent);
    const scanBlockers = scanResults.blockers;

    const execContent = fs.readFileSync(CONFIG.COMPONENT2_LOG, 'utf8');
    const execLog = JSON.parse(execContent);
    const execBlockers = execLog.executions;

    for (const scanBlocker of scanBlockers) {
      const execBlocker = execBlockers.find(e => e.blocker_id === scanBlocker.blocker_id);
      test.assert(execBlocker, `${scanBlocker.blocker_id} lost in executor`);
      test.assertEquals(execBlocker.type, scanBlocker.type, `Type mismatch for ${scanBlocker.blocker_id}`);
    }
  });

  return test;
}

// Main execution
(async () => {
  const test = runIntegrationTests();

  test.printSummary();
  test.saveReport();

  if (test.results.summary.failed === 0) {
    console.log(`\n✅ INTEGRATION PHASE 2 COMPLETE`);
    console.log(`\n📋 Component Data Flow Validated:`);
    console.log(`   ✓ Component 1 (Scanner) → Component 2 (Executor)`);
    console.log(`   ✓ Component 2 (Executor) → Registry (State Machine)`);
    console.log(`   ✓ Component 3 (Monitor) + Registry (Escalations)`);
    console.log(`   ✓ Component 4 (Templates) → User Interface`);
    console.log(`\n🎯 Next: End-to-End Testing Phase 3 (2026-05-30 10:00 KST)`);
    console.log(`   • Execute live db/43 migration in Supabase`);
    console.log(`   • Test Telegram config in Vercel`);
    console.log(`   • Verify escalations at 6h, 12h, 18h thresholds`);
    process.exit(0);
  } else {
    console.log(`\n❌ INTEGRATION PHASE 2 FAILED`);
    process.exit(1);
  }
})();
