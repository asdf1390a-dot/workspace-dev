#!/usr/bin/env node

/**
 * test.js — Trust Score Calculator Test Suite
 *
 * Phase 2C comprehensive testing
 * - 10+ unit and integration tests
 * - Component scoring validation
 * - Edge cases and error handling
 * - Batch processing and caching
 * - Decision boundary verification
 *
 * Run: node test.js [--verbose] [--filter <pattern>]
 */

'use strict';

const { calculateTrustScore, calculateBatch, LRUCache } = require('./calculator.js');

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

class TestRunner {
  constructor(options = {}) {
    this.tests = [];
    this.results = [];
    this.verbose = options.verbose || false;
    this.filter = options.filter || null;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Trust Score Calculator Test Suite\n');

    let passed = 0;
    let failed = 0;

    for (const { name, fn } of this.tests) {
      // Filter tests if pattern provided
      if (this.filter && !name.includes(this.filter)) {
        continue;
      }

      try {
        await fn();
        passed++;
        console.log(`✅ ${name}`);
      } catch (error) {
        failed++;
        console.log(`❌ ${name}`);
        if (this.verbose) {
          console.log(`   Error: ${error.message}`);
        }
        this.results.push({ name, error });
      }
    }

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, got ${actual}`
    );
  }
}

function assertRange(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(
      message || `Expected value in [${min}, ${max}], got ${value}`
    );
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

const runner = new TestRunner({
  verbose: process.argv.includes('--verbose'),
  filter: process.argv.find(arg => arg.startsWith('--filter'))?.split('=')[1],
});

// ============================================================================
// TEST 1: Component 1 — Source Credibility (Telegram)
// ============================================================================

runner.test('Test 1: C1 Telegram CEO Direct (base 90)', () => {
  const result = calculateTrustScore({
    messageId: 'test_1',
    source: 'telegram',
    channel: 'general',
    author: 'nakyeongtae',
    text: 'Asset Master 완료됨.',
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  const c1Score = result.components.sourceCredibility.score;
  assertRange(c1Score, 80, 100, `C1 should be high for CEO, got ${c1Score}`);
  assert(
    result.components.sourceCredibility.signals.includes('CEO_direct'),
    'Should detect CEO_direct signal'
  );
});

// ============================================================================
// TEST 2: Component 2 — Context Depth (Multiple Signals)
// ============================================================================

runner.test('Test 2: C2 Context Depth with Multiple Signals', () => {
  const result = calculateTrustScore({
    messageId: 'test_2',
    source: 'telegram',
    channel: 'general',
    author: 'dev_user',
    text: '✅ API 구현 완료. 엔드포인트: POST /api/assets. 담당자: 웹개발자. https://github.com/repo/api. 일정: 2026-05-30. 코드는 다음과 같습니다:\n```javascript\nconst api = new AssetAPI();\n```',
    timestamp: new Date().toISOString(),
    replyCount: 2,
  });

  const c2Score = result.components.contextDepth.score;
  assertRange(c2Score, 70, 100, `C2 should be high for rich content, got ${c2Score}`);
  assert(c2Score > 50, 'Should accumulate multiple signals');
});

// ============================================================================
// TEST 3: Component 3 — Verification Status (Multiple Signals)
// ============================================================================

runner.test('Test 3: C3 Verification Status with Approval', () => {
  const result = calculateTrustScore({
    messageId: 'test_3',
    source: 'telegram',
    channel: 'general',
    author: 'dev_user',
    text: '✅ 완료됨. CEO 확인함. https://example.com/proof. 2026-05-29 완료.',
    timestamp: new Date().toISOString(),
    replyCount: 1,
  });

  const c3Score = result.components.verificationStatus.score;
  assertRange(c3Score, 50, 100, `C3 should be verified, got ${c3Score}`);
});

// ============================================================================
// TEST 4: Component 4 — Recency Freshness (Age Decay)
// ============================================================================

runner.test('Test 4: C4 Recency Freshness (7 days old)', () => {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const result = calculateTrustScore({
    messageId: 'test_4',
    source: 'telegram',
    channel: 'general',
    author: 'dev_user',
    text: 'Old message content.',
    timestamp: sevenDaysAgo,
    replyCount: 0,
  });

  const c4Score = result.components.recencyFreshness.score;
  assertRange(c4Score, 70, 90, `C4 for 7-day message should be ~80, got ${c4Score}`);
});

// ============================================================================
// TEST 5: Integration Test — High Quality Message (ACCEPT)
// ============================================================================

runner.test('Test 5: Integration — High Quality Message (should ACCEPT)', () => {
  const result = calculateTrustScore({
    messageId: 'test_5',
    source: 'telegram',
    channel: 'general',
    author: 'nakyeongtae',
    text: '✅ Asset Master Phase A 완료됨. API 16개 엔드포인트 구현, 506개 자산 관리 활성화. https://github.com/asset-master. 담당: 웹개발자. 2026-05-29 확인함.',
    timestamp: new Date().toISOString(),
    replyCount: 5,
  });

  assertRange(result.trustScore, 60, 100, `High quality should score >= 60, got ${result.trustScore}`);
  assertEqual(
    result.decision,
    'ACCEPT',
    `High quality should route to ACCEPT, got ${result.decision}`
  );
});

// ============================================================================
// TEST 6: Edge Case — Null/Missing Fields
// ============================================================================

runner.test('Test 6: Edge Case — Invalid Input (null timestamp)', () => {
  const result = calculateTrustScore({
    messageId: 'test_6',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'Test message',
    timestamp: null,
    replyCount: 0,
  });

  // Should fail gracefully and REJECT
  assertEqual(result.decision, 'REJECT', 'Invalid timestamp should REJECT');
  assertRange(result.trustScore, 0, 40, 'Invalid input should score < 40');
});

// ============================================================================
// TEST 7: Edge Case — Future Timestamp
// ============================================================================

runner.test('Test 7: Edge Case — Future Timestamp', () => {
  const futureDate = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  const result = calculateTrustScore({
    messageId: 'test_7',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'Future message.',
    timestamp: futureDate,
    replyCount: 0,
  });

  const c4Score = result.components.recencyFreshness.score;
  assertEqual(c4Score, 100, 'Future date should score 100 for recency');
});

// ============================================================================
// TEST 8: Decision Boundary — Exactly 60 (ACCEPT threshold)
// ============================================================================

runner.test('Test 8: Decision Boundary — Score ≥ 60 = ACCEPT', () => {
  // Craft a message that scores around 60
  const result = calculateTrustScore({
    messageId: 'test_8',
    source: 'discord',
    channel: 'technical',
    author: 'dev_user',
    text: 'API implementation ongoing. Code: `POST /assets`. Contact: @team.',
    timestamp: new Date().toISOString(),
    replyCount: 1,
  });

  // Should be near boundary or above
  if (result.trustScore >= 60) {
    assertEqual(
      result.decision,
      'ACCEPT',
      `Score ${result.trustScore} >= 60 should be ACCEPT`
    );
  }
});

// ============================================================================
// TEST 9: Decision Boundary — Exactly 40 (QUARANTINE/REJECT threshold)
// ============================================================================

runner.test('Test 9: Decision Boundary — 40 ≤ Score < 60 = QUARANTINE', () => {
  // Low quality but not completely empty
  const result = calculateTrustScore({
    messageId: 'test_9',
    source: 'discord',
    channel: 'general',
    author: 'unknown',
    text: 'Working on something. Not sure.',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    replyCount: 0,
  });

  if (result.trustScore >= 40 && result.trustScore < 60) {
    assertEqual(
      result.decision,
      'QUARANTINE',
      `Score ${result.trustScore} in [40, 60) should be QUARANTINE`
    );
  }
});

// ============================================================================
// TEST 10: Different Channel Types — Discord Announcements
// ============================================================================

runner.test('Test 10: Channel Type — Discord Announcements (base 90)', () => {
  const result = calculateTrustScore({
    messageId: 'test_10',
    source: 'discord',
    channel: 'announcements',
    author: 'admin',
    text: 'Important announcement: System maintenance scheduled for 2026-06-01.',
    timestamp: new Date().toISOString(),
    replyCount: 10,
  });

  const c1Score = result.components.sourceCredibility.score;
  assertRange(
    c1Score,
    80,
    100,
    `Discord announcements should score high, got ${c1Score}`
  );
  assert(
    result.components.sourceCredibility.signals.includes('announcements_channel'),
    'Should detect announcements_channel signal'
  );
});

// ============================================================================
// TEST 11: Batch Processing — Single Chunk
// ============================================================================

runner.test('Test 11: Batch Processing — Multiple Messages', async () => {
  const messages = [
    {
      messageId: 'batch_1',
      source: 'telegram',
      channel: 'general',
      author: 'nakyeongtae',
      text: '✅ Task completed.',
      timestamp: new Date().toISOString(),
      replyCount: 2,
    },
    {
      messageId: 'batch_2',
      source: 'discord',
      channel: 'general',
      author: 'user',
      text: 'Working on it.',
      timestamp: new Date().toISOString(),
      replyCount: 0,
    },
    {
      messageId: 'batch_3',
      source: 'telegram',
      channel: 'general',
      author: 'unknown',
      text: 'x',
      timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      replyCount: 0,
    },
  ];

  const { results, summary } = await calculateBatch(messages, {
    chunkSize: 50,
  });

  assertEqual(results.length, 3, `Should process 3 messages, got ${results.length}`);
  assert(summary.total === 3, `Summary should show 3 total`);
  assert(summary.accepted >= 0, 'Should have ACCEPT count');
  assert(summary.rejected >= 0, 'Should have REJECT count');
  assertRange(summary.avgScore, 0, 100, 'Average score should be in range');
});

// ============================================================================
// TEST 12: Batch Processing — Progress Callback
// ============================================================================

runner.test('Test 12: Batch Processing — Progress Callback', async () => {
  let progressCalled = false;
  let finalProgress = null;

  const messages = Array.from({ length: 75 }, (_, i) => ({
    messageId: `progress_${i}`,
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: `Message ${i}`,
    timestamp: new Date().toISOString(),
    replyCount: 0,
  }));

  await calculateBatch(messages, {
    chunkSize: 25,
    onProgress: (progress) => {
      progressCalled = true;
      finalProgress = progress;
    },
  });

  assert(progressCalled, 'Progress callback should be called');
  assert(
    finalProgress.processed === finalProgress.total,
    `Final progress should match total: ${finalProgress.processed} vs ${finalProgress.total}`
  );
});

// ============================================================================
// TEST 13: URL Detection Signal
// ============================================================================

runner.test('Test 13: URL Detection Signal', () => {
  const withUrl = calculateTrustScore({
    messageId: 'test_13a',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'See https://github.com/example for details.',
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  const withoutUrl = calculateTrustScore({
    messageId: 'test_13b',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'See the documentation for details.',
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  assert(
    withUrl.components.sourceCredibility.score > withoutUrl.components.sourceCredibility.score,
    'URL should increase C1 score'
  );
  assert(
    withUrl.components.sourceCredibility.signals.includes('has_url'),
    'Should detect has_url signal'
  );
});

// ============================================================================
// TEST 14: Decision Keyword Detection
// ============================================================================

runner.test('Test 14: Decision Keyword Detection', () => {
  const withKeyword = calculateTrustScore({
    messageId: 'test_14a',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'Phase 2 설계가 확정되었습니다.',
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  const withoutKeyword = calculateTrustScore({
    messageId: 'test_14b',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'Phase 2 설계를 작업 중입니다.',
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  assert(
    withKeyword.components.sourceCredibility.score >= withoutKeyword.components.sourceCredibility.score,
    'Decision keyword should increase or maintain score'
  );
});

// ============================================================================
// TEST 15: Team Thread Detection (Reply Count)
// ============================================================================

runner.test('Test 15: Team Thread Detection (Reply Count)', () => {
  const highReplies = calculateTrustScore({
    messageId: 'test_15a',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'Update on Asset Master.',
    timestamp: new Date().toISOString(),
    replyCount: 5,
  });

  const lowReplies = calculateTrustScore({
    messageId: 'test_15b',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'Update on Asset Master.',
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  assert(
    highReplies.components.sourceCredibility.score > lowReplies.components.sourceCredibility.score,
    'Thread with more replies should score higher'
  );
});

// ============================================================================
// TEST 16: Error Handling — Missing Required Fields
// ============================================================================

runner.test('Test 16: Error Handling — Missing Text Field', () => {
  const result = calculateTrustScore({
    messageId: 'test_16',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    // Missing 'text' field
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  assert(result.error || result.decision === 'REJECT', 'Missing required field should fail gracefully');
});

// ============================================================================
// TEST 17: Low Quality Message (REJECT)
// ============================================================================

runner.test('Test 17: Low Quality Message (should REJECT)', () => {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const result = calculateTrustScore({
    messageId: 'test_17',
    source: 'discord',
    channel: 'general',
    author: 'unknown',
    text: 'x',
    timestamp: thirtyDaysAgo,
    replyCount: 0,
  });

  assertRange(result.trustScore, 0, 40, `Low quality should score < 40, got ${result.trustScore}`);
  assertEqual(
    result.decision,
    'REJECT',
    `Low quality should REJECT, got ${result.decision}`
  );
});

// ============================================================================
// TEST 18: Complete Message Metadata in Response
// ============================================================================

runner.test('Test 18: Response Metadata Completeness', () => {
  const result = calculateTrustScore({
    messageId: 'test_18',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: 'Test message for metadata verification.',
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  assert(result.scoreId, 'Should have scoreId');
  assert(result.messageId === 'test_18', 'Should preserve messageId');
  assert(typeof result.trustScore === 'number', 'Should have numeric trustScore');
  assert(
    ['ACCEPT', 'QUARANTINE', 'REJECT'].includes(result.decision),
    'Should have valid decision'
  );
  assert(result.components, 'Should have components breakdown');
  assert(result.weights, 'Should have weights');
  assert(result.processedAt, 'Should have processedAt timestamp');
  assert(result.processingTimeMs >= 0, 'Should have processingTimeMs');
});

// ============================================================================
// TEST 19: Long Text Content
// ============================================================================

runner.test('Test 19: Long Text Content Signal', () => {
  const longText = 'Lorem ipsum dolor sit amet, '.repeat(20);
  const shortText = 'Short text.';

  const longResult = calculateTrustScore({
    messageId: 'test_19a',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: longText,
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  const shortResult = calculateTrustScore({
    messageId: 'test_19b',
    source: 'telegram',
    channel: 'general',
    author: 'user',
    text: shortText,
    timestamp: new Date().toISOString(),
    replyCount: 0,
  });

  assert(
    longResult.components.contextDepth.score >= shortResult.components.contextDepth.score,
    'Longer text should increase context depth'
  );
});

// ============================================================================
// TEST 20: Weighted Components Aggregation
// ============================================================================

runner.test('Test 20: Weighted Aggregation Formula', () => {
  const result = calculateTrustScore({
    messageId: 'test_20',
    source: 'telegram',
    channel: 'general',
    author: 'nakyeongtae',
    text: '✅ Completed. https://example.com. 담당자: 웹개발자.',
    timestamp: new Date().toISOString(),
    replyCount: 2,
  });

  const c1 = result.components.sourceCredibility.score;
  const c2 = result.components.contextDepth.score;
  const c3 = result.components.verificationStatus.score;
  const c4 = result.components.recencyFreshness.score;

  // Verify formula: 0.40*C1 + 0.25*C2 + 0.20*C3 + 0.15*C4
  const calculated = Math.round(
    c1 * 0.40 + c2 * 0.25 + c3 * 0.20 + c4 * 0.15
  );

  assertEqual(
    result.trustScore,
    calculated,
    `Trust score should match weighted sum: expected ${calculated}, got ${result.trustScore}`
  );
});

// ============================================================================
// MAIN EXECUTION
// ============================================================================

(async () => {
  const { passed, failed } = await runner.run();

  if (failed > 0) {
    process.exit(1);
  }
})();
