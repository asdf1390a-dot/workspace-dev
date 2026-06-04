#!/usr/bin/env node
/**
 * Unit tests for Phase 2 refactoring
 * Tests: queue, logger, monitoring, cron-orchestrator
 */

const fs = require('fs');
const path = require('path');
const { FileQueue } = require('./queue');
const { Logger } = require('./logger');
const { Monitoring } = require('./monitoring');
const { CronOrchestrator } = require('./cron-orchestrator');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`);
    testsFailed++;
  } else {
    console.log(`✓ PASS: ${message}`);
    testsPassed++;
  }
}

function cleanup(dir) {
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          cleanup(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      });
      fs.rmdirSync(dir);
    }
  } catch (e) {
    // ignore
  }
}

async function runTests() {
  console.log('========== Phase 2 Refactoring Tests ==========\n');

  // ================================================================
  // Test 1: FileQueue
  // ================================================================
  console.log('Test Suite 1: FileQueue');
  const testQueueDir = './test-queue-suite';
  const queue = new FileQueue(testQueueDir);

  try {
    // Test enqueue
    const result1 = queue.enqueue({ content: 'message 1' });
    assert(result1.success && result1.id, 'enqueue returns success + id');

    // Test length
    assert(queue.length() === 1, 'queue length is 1 after enqueue');

    // Test peek
    const peeked = queue.peek(1);
    assert(peeked.length === 1, 'peek returns enqueued message');
    assert(peeked[0].data.content === 'message 1', 'peeked message has correct content');

    // Test dequeue
    queue.enqueue({ content: 'message 2' });
    const dequeued = queue.dequeueAll();
    assert(dequeued.length === 2, 'dequeueAll returns all messages');
    assert(queue.length() === 0, 'queue is empty after dequeueAll');

    // Test metrics
    const metrics = queue.getMetrics();
    assert(metrics.enqueued === 2, 'metrics track enqueued count');

    // Test health
    const health = queue.health();
    assert(health.queue_dir === testQueueDir, 'health check reports queue directory');
  } finally {
    cleanup(testQueueDir);
  }

  // ================================================================
  // Test 2: Logger
  // ================================================================
  console.log('\nTest Suite 2: Logger');
  const testLogDir = './test-log-suite';
  const logger = new Logger(testLogDir);

  try {
    // Test methods exist
    assert(typeof logger.debug === 'function', 'logger has debug method');
    assert(typeof logger.warn === 'function', 'logger has warn method');
    assert(typeof logger.error === 'function', 'logger has error method');
    assert(typeof logger.critical === 'function', 'logger has critical method');

    // Test file creation
    logger.error('test error');
    const errorLogFile = logger.getErrorLogFile();
    assert(fs.existsSync(errorLogFile), 'error log file is created');

    // Test log file contains message
    const logContent = fs.readFileSync(errorLogFile, 'utf8');
    assert(logContent.includes('test error'), 'error message is logged to file');
  } finally {
    cleanup(testLogDir);
  }

  // ================================================================
  // Test 3: Monitoring
  // ================================================================
  console.log('\nTest Suite 3: Monitoring');
  const testMetricsDir = './test-metrics-suite';
  const monitor = new Monitoring(testMetricsDir);

  try {
    // Test memory recording
    const memResult = monitor.recordMemory();
    assert(memResult.metric === 'memory', 'recordMemory returns memory metric');
    assert(monitor.metrics.memory.rss_mb > 0, 'memory RSS is tracked');

    // Test latency recording
    monitor.recordLatency('collection', 1000);
    monitor.recordLatency('collection', 1500);
    assert(monitor.metrics.latency.collection_ms.length === 2, 'latencies are tracked');

    // Test error recording
    monitor.recordError('collection', true);
    monitor.recordError('collection', true);
    monitor.recordError('collection', false);
    const errorRate = monitor.metrics.errors.collection.rate;
    assert(errorRate === '66.7%', 'error rate is calculated correctly');

    // Test checksum recording
    const checkResult = monitor.recordChecksum('test.json', 'content');
    assert(checkResult.filename === 'test.json', 'checksum is recorded');

    // Test checkpoint SLA
    const cpResult = monitor.recordCheckpoint(true, 30000);
    assert(cpResult.sla_rate === '100.0', 'checkpoint SLA is 100% for successful completion');

    // Test metrics file is saved
    assert(fs.existsSync(path.join(testMetricsDir, 'metrics.json')), 'metrics.json file created');

    // Test health check
    const health = monitor.health();
    assert(health.memory_mb > 0, 'health check returns memory');
    assert(health.checkpoint_sla === '100.0', 'health check returns checkpoint SLA');
  } finally {
    cleanup(testMetricsDir);
  }

  // ================================================================
  // Test 4: CronOrchestrator
  // ================================================================
  console.log('\nTest Suite 4: CronOrchestrator');
  const testCronLogDir = './test-cron-logs';
  const orchestrator = new CronOrchestrator({
    logDir: testCronLogDir,
  });

  try {
    // Test status
    const status = orchestrator.getStatus();
    assert(status.running === false, 'orchestrator starts in non-running state');
    assert(status.timestamp, 'status includes timestamp');

    // Test backup can be executed
    const backupResult = await orchestrator.runBackup();
    assert(typeof backupResult === 'object', 'runBackup returns result object');

    // Test checkpoint can be executed
    const cpResult = await orchestrator.runCheckpoint();
    assert(cpResult.success === true, 'runCheckpoint succeeds');
    assert(cpResult.duration !== undefined, 'checkpoint duration is measured');

    // Test integrity audit can be executed
    const auditResult = await orchestrator.runIntegrityAudit();
    assert(auditResult.success === true, 'runIntegrityAudit succeeds');
    assert(auditResult.audit !== undefined, 'audit returns data');

    // Test log file is created
    assert(fs.existsSync(testCronLogDir), 'cron log directory created');
  } finally {
    cleanup(testCronLogDir);
  }

  // ================================================================
  // Test 5: Integration test — full cycle
  // ================================================================
  console.log('\nTest Suite 5: Integration (Queue → Monitor)');
  const testIntegrationDir = './test-integration-suite';
  const intQueue = new FileQueue(path.join(testIntegrationDir, 'queue'));
  const intMonitor = new Monitoring(path.join(testIntegrationDir, 'metrics'));

  try {
    // Simulate a message collection → queue → monitoring cycle
    intQueue.enqueue({ type: 'message', data: { content: 'test' } });
    intMonitor.recordError('collection', true);

    const messages = intQueue.dequeueAll();
    assert(messages.length === 1, 'integration: enqueued message dequeued');

    intMonitor.recordError('deduplication', true);
    intMonitor.recordError('calculation', true);

    // All should have 100% success
    const metrics = intMonitor.getMetrics();
    assert(metrics.errors.collection.rate === '100.0%', 'integration: collection error rate 100%');
    assert(metrics.errors.deduplication.rate === '100.0%', 'integration: dedup error rate 100%');
    assert(metrics.errors.calculation.rate === '100.0%', 'integration: calculation error rate 100%');
  } finally {
    cleanup(testIntegrationDir);
  }

  // ================================================================
  // Summary
  // ================================================================
  console.log('\n========== Test Summary ==========');
  const total = testsPassed + testsFailed;
  console.log(`Total: ${total} tests`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
});
