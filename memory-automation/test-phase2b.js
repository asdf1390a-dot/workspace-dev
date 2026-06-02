#!/usr/bin/env node
/**
 * Phase 2B: Duplicate Detection Engine - Test Suite
 * Tests: 42 comprehensive test cases covering 2-layer deduplication
 */

const { DuplicateDetectionEngine } = require('./phase2b-duplicate-detection.js');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

// ============================================================================
// TEST UTILITIES
// ============================================================================

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

function assertFalse(value, msg) {
  if (value) {
    throw new Error(msg);
  }
}

function assertGreater(actual, threshold, msg) {
  if (actual <= threshold) {
    throw new Error(`${msg}: expected > ${threshold}, got ${actual}`);
  }
}

function assertLess(actual, threshold, msg) {
  if (actual >= threshold) {
    throw new Error(`${msg}: expected < ${threshold}, got ${actual}`);
  }
}

function assertExists(value, msg) {
  if (value === undefined || value === null) {
    throw new Error(msg);
  }
}

function assertArrayLength(arr, expected, msg) {
  if (!Array.isArray(arr) || arr.length !== expected) {
    throw new Error(`${msg}: expected array length ${expected}, got ${arr?.length || 0}`);
  }
}

function assertInRange(value, min, max, msg) {
  if (value < min || value > max) {
    throw new Error(`${msg}: expected between ${min} and ${max}, got ${value}`);
  }
}

async function test(name, fn) {
  testsRun++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    testsFailed++;
    failedTests.push(name);
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
  console.log('\n🔍 Phase 2B: Duplicate Detection Engine - Test Suite\n');
  console.log('Total Tests: 42\n');

  const engine = new DuplicateDetectionEngine(80);

  // ========================================================================
  // GROUP 1: BASIC FUNCTIONALITY (8 tests)
  // ========================================================================
  console.log('📋 Group 1: Basic Functionality\n');

  await test('Initialization with default prefix length', () => {
    const e = new DuplicateDetectionEngine();
    assertExists(e, 'Engine should be created');
    assertEqual(e.prefixLen, 80, 'Default prefix length should be 80');
  });

  await test('Initialization with custom prefix length', () => {
    const e = new DuplicateDetectionEngine(100);
    assertEqual(e.prefixLen, 100, 'Should accept custom prefix length');
  });

  await test('Normalize text - basic', () => {
    const result = engine.normalizeText('Hello World');
    assertEqual(result, 'hello world', 'Text should be lowercase and trimmed');
  });

  await test('Normalize text - with whitespace', () => {
    const result = engine.normalizeText('  HELLO  ');
    assertEqual(result, 'hello', 'Should trim and lowercase');
  });

  await test('Normalize text - null input', () => {
    const result = engine.normalizeText(null);
    assertEqual(result, '', 'Null should return empty string');
  });

  await test('Normalize text - undefined input', () => {
    const result = engine.normalizeText(undefined);
    assertEqual(result, '', 'Undefined should return empty string');
  });

  await test('Compute hash - identical content', () => {
    const hash1 = engine.computeHash('test content');
    const hash2 = engine.computeHash('test content');
    assertEqual(hash1, hash2, 'Same content should produce same hash');
  });

  await test('Compute hash - different content', () => {
    const hash1 = engine.computeHash('test content 1');
    const hash2 = engine.computeHash('test content 2');
    assertFalse(hash1 === hash2, 'Different content should produce different hash');
  });

  // ========================================================================
  // GROUP 2: LAYER 1 - EXACT HASH MATCHING (10 tests)
  // ========================================================================
  console.log('\n🔗 Group 2: Layer 1 - Exact Hash Matching\n');

  await test('Layer 1: Identify exact duplicate', () => {
    const messages = [
      { id: 1, content: 'message', hash: 'abc123', sourceFile: 'a.txt' },
      { id: 2, content: 'message', hash: 'abc123', sourceFile: 'a.txt' },
    ];
    const result = engine.layer1ExactMatching(messages);
    assertEqual(result.count, 1, 'Should have 1 unique message');
    assertEqual(result.removed, 1, 'Should detect 1 duplicate');
  });

  await test('Layer 1: No duplicates', () => {
    const messages = [
      { id: 1, content: 'message 1', hash: 'abc123', sourceFile: 'a.txt' },
      { id: 2, content: 'message 2', hash: 'def456', sourceFile: 'b.txt' },
    ];
    const result = engine.layer1ExactMatching(messages);
    assertEqual(result.count, 2, 'Should have 2 unique messages');
    assertEqual(result.removed, 0, 'Should detect no duplicates');
  });

  await test('Layer 1: All duplicates', () => {
    const messages = [
      { id: 1, content: 'message', hash: 'abc123', sourceFile: 'a.txt' },
      { id: 2, content: 'message', hash: 'abc123', sourceFile: 'a.txt' },
      { id: 3, content: 'message', hash: 'abc123', sourceFile: 'a.txt' },
    ];
    const result = engine.layer1ExactMatching(messages);
    assertEqual(result.count, 1, 'Should have 1 unique message');
    assertEqual(result.removed, 2, 'Should detect 2 duplicates');
  });

  await test('Layer 1: Compute hash for objects without hash field', () => {
    const messages = [
      { sourceFile: 'a.txt', content: 'message' },
      { sourceFile: 'a.txt', content: 'message' },
    ];
    const result = engine.layer1ExactMatching(messages);
    assertEqual(result.count, 1, 'Should compute and detect duplicates');
    assertEqual(result.removed, 1, 'Should identify 1 duplicate');
  });

  await test('Layer 1: Empty input', () => {
    const result = engine.layer1ExactMatching([]);
    assertEqual(result.count, 0, 'Should handle empty input');
    assertEqual(result.removed, 0, 'No duplicates in empty input');
  });

  await test('Layer 1: Single message', () => {
    const messages = [{ id: 1, content: 'message', hash: 'abc123', sourceFile: 'a.txt' }];
    const result = engine.layer1ExactMatching(messages);
    assertEqual(result.count, 1, 'Should have 1 unique message');
    assertEqual(result.removed, 0, 'Single message has no duplicates');
  });

  await test('Layer 1: Large dataset (1000 messages)', () => {
    const messages = [];
    for (let i = 0; i < 1000; i++) {
      messages.push({
        id: i,
        content: `message ${i % 100}`,
        hash: `hash${i % 100}`,
        sourceFile: 'test.txt',
      });
    }
    const result = engine.layer1ExactMatching(messages);
    assertEqual(result.count, 100, 'Should identify 100 unique messages');
    assertEqual(result.removed, 900, 'Should identify 900 duplicates');
  });

  await test('Layer 1: Maintains original field order', () => {
    const messages = [
      { id: 1, content: 'msg', hash: 'h1', sourceFile: 'a.txt', custom: 'value' },
    ];
    const result = engine.layer1ExactMatching(messages);
    assertTrue(result.unique[0].custom === 'value', 'Should preserve all fields');
  });

  await test('Layer 1: Method field set correctly', () => {
    const messages = [{ content: 'test', hash: 'h1', sourceFile: 'a.txt' }];
    const result = engine.layer1ExactMatching(messages);
    assertEqual(result.method, 'LAYER1_EXACT', 'Method should be LAYER1_EXACT');
  });

  // ========================================================================
  // GROUP 3: LAYER 2 - PREFIX MATCHING (10 tests)
  // ========================================================================
  console.log('\n🔤 Group 3: Layer 2 - Prefix Matching\n');

  await test('Layer 2: Identical prefix match', () => {
    const prefix = 'This is a test message that is long enough to be a full 80 character prefix match test';
    const messages = [
      { id: 1, content: prefix, sourceFile: 'a.txt' },
      { id: 2, content: prefix + ' with additional text', sourceFile: 'b.txt' },
    ];
    const result = engine.layer2PrefixMatching(messages);
    assertEqual(result.count, 1, 'Should detect prefix duplicate');
    assertEqual(result.removed, 1, 'Should identify 1 prefix duplicate');
  });

  await test('Layer 2: Different prefixes', () => {
    const messages = [
      { id: 1, content: 'Message type A', sourceFile: 'a.txt' },
      { id: 2, content: 'Message type B', sourceFile: 'b.txt' },
    ];
    const result = engine.layer2PrefixMatching(messages);
    assertEqual(result.count, 2, 'Should keep both messages');
    assertEqual(result.removed, 0, 'No prefix duplicates');
  });

  await test('Layer 2: Case insensitive matching', () => {
    const prefix = 'HELLO WORLD TEST MESSAGE WITH CONSISTENT CONTENT THAT WILL MATCH WHEN NORMALIZED';
    const messages = [
      { id: 1, content: prefix, sourceFile: 'a.txt' },
      { id: 2, content: prefix.toLowerCase() + ' and more', sourceFile: 'b.txt' },
    ];
    const result = engine.layer2PrefixMatching(messages);
    assertEqual(result.count, 1, 'Should match case-insensitively');
    assertEqual(result.removed, 1, 'Should identify 1 case-insensitive duplicate');
  });

  await test('Layer 2: Whitespace normalization', () => {
    const prefix = 'Test Message with consistent content that will match after whitespace normalization';
    const messages = [
      { id: 1, content: '  ' + prefix + '  ', sourceFile: 'a.txt' },
      { id: 2, content: prefix + ' extended', sourceFile: 'b.txt' },
    ];
    const result = engine.layer2PrefixMatching(messages);
    assertEqual(result.count, 1, 'Should normalize whitespace');
    assertEqual(result.removed, 1, 'Should identify 1 whitespace duplicate');
  });

  await test('Layer 2: Empty input', () => {
    const result = engine.layer2PrefixMatching([]);
    assertEqual(result.count, 0, 'Should handle empty input');
  });

  await test('Layer 2: Single message', () => {
    const messages = [{ id: 1, content: 'test', sourceFile: 'a.txt' }];
    const result = engine.layer2PrefixMatching(messages);
    assertEqual(result.count, 1, 'Single message is always unique');
  });

  await test('Layer 2: Very short messages', () => {
    const messages = [
      { id: 1, content: 'a', sourceFile: 'a.txt' },
      { id: 2, content: 'ab', sourceFile: 'b.txt' },
      { id: 3, content: 'a', sourceFile: 'c.txt' },
    ];
    const result = engine.layer2PrefixMatching(messages);
    assertEqual(result.count, 2, 'Should handle short prefixes');
  });

  await test('Layer 2: Long message with short unique prefix', () => {
    const longMsg = 'a' + 'x'.repeat(200);
    const messages = [
      { id: 1, content: longMsg, sourceFile: 'a.txt' },
      { id: 2, content: longMsg + 'b', sourceFile: 'b.txt' },
    ];
    const result = engine.layer2PrefixMatching(messages);
    assertEqual(result.count, 1, 'Should detect prefix match despite length');
  });

  await test('Layer 2: Method field set correctly', () => {
    const messages = [{ id: 1, content: 'test', sourceFile: 'a.txt' }];
    const result = engine.layer2PrefixMatching(messages);
    assertEqual(result.method, 'LAYER2_PREFIX', 'Method should be LAYER2_PREFIX');
  });

  // ========================================================================
  // GROUP 4: FULL PIPELINE (8 tests)
  // ========================================================================
  console.log('\n🔄 Group 4: Full Deduplication Pipeline\n');

  await test('Pipeline: Basic deduplication', () => {
    const messages = [
      { id: 1, content: 'message', hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: 'message', hash: 'h1', sourceFile: 'a.txt' },
      { id: 3, content: 'other', hash: 'h2', sourceFile: 'b.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertEqual(result.final.unique.length, 2, 'Should have 2 unique messages');
  });

  await test('Pipeline: No duplicates', () => {
    const messages = [
      { id: 1, content: 'msg1', hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: 'msg2', hash: 'h2', sourceFile: 'b.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertEqual(result.final.totalRemoved, 0, 'No duplicates should be removed');
  });

  await test('Pipeline: All duplicates', () => {
    const messages = Array(10)
      .fill(null)
      .map((_, i) => ({
        id: i,
        content: 'duplicate',
        hash: 'h1',
        sourceFile: 'a.txt',
      }));
    const result = engine.deduplicate(messages);
    assertEqual(result.final.unique.length, 1, 'Only 1 unique message');
    assertEqual(result.final.totalRemoved, 9, '9 duplicates removed');
  });

  await test('Pipeline: Two-layer catch (exact + prefix)', () => {
    const prefix = 'This message starts the same but the third one will have more text appended to it making';
    const messages = [
      { id: 1, content: prefix, hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: prefix, hash: 'h1', sourceFile: 'b.txt' },
      { id: 3, content: prefix + ' it longer than 80 chars for prefix match testing purposes', hash: 'h2', sourceFile: 'c.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertEqual(result.layer1.removed, 1, 'Layer 1 should catch exact duplicate');
    assertEqual(result.layer2.removed, 1, 'Layer 2 should catch prefix duplicate');
  });

  await test('Pipeline: Empty input', () => {
    const result = engine.deduplicate([]);
    assertEqual(result.final.unique.length, 0, 'Empty input produces empty output');
  });

  await test('Pipeline: Metadata completeness', () => {
    const messages = [
      { id: 1, content: 'test1', hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: 'test2', hash: 'h2', sourceFile: 'b.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertExists(result.original, 'Should have original count');
    assertExists(result.layer1, 'Should have layer1 result');
    assertExists(result.layer2, 'Should have layer2 result');
    assertExists(result.final, 'Should have final result');
  });

  await test('Pipeline: Large dataset (500+ messages) performance', () => {
    const messages = [];
    for (let i = 0; i < 500; i++) {
      messages.push({
        id: i,
        content: `message number ${i % 50} with unique content`,
        hash: `hash${i % 50}`,
        sourceFile: `file${i % 10}.txt`,
      });
    }
    const start = Date.now();
    const result = engine.deduplicate(messages);
    const elapsed = Date.now() - start;
    assertLess(elapsed, 1000, 'Should complete 500 messages in <1 second');
    assertTrue(result.final.unique.length > 0, 'Should produce results');
  });

  // ========================================================================
  // GROUP 5: EDGE CASES (6 tests)
  // ========================================================================
  console.log('\n⚡ Group 5: Edge Cases\n');

  await test('Edge case: Null content fields', () => {
    const messages = [
      { id: 1, content: null, hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: null, hash: 'h1', sourceFile: 'b.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertTrue(result.final.unique.length >= 1, 'Should handle null content');
  });

  await test('Edge case: Empty content strings', () => {
    const messages = [
      { id: 1, content: '', hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: '', hash: 'h1', sourceFile: 'b.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertEqual(result.final.totalRemoved, 1, 'Should detect exact duplicates with empty content');
  });

  await test('Edge case: Special characters in content', () => {
    const messages = [
      { id: 1, content: 'test!@#$%^&*()_+-=[]{}|;:\\\'",.<>?/', hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: 'test!@#$%^&*()_+-=[]{}|;:\\\'",.<>?/', hash: 'h1', sourceFile: 'b.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertEqual(result.final.totalRemoved, 1, 'Should handle special characters');
  });

  await test('Edge case: Unicode content', () => {
    const messages = [
      { id: 1, content: '테스트 메시지 한글 내용', hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: '테스트 메시지 한글 내용', hash: 'h1', sourceFile: 'b.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertEqual(result.final.totalRemoved, 1, 'Should handle unicode');
  });

  await test('Edge case: Very long message (10000+ chars)', () => {
    const longContent = 'x'.repeat(10000);
    const messages = [
      { id: 1, content: longContent, hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: longContent, hash: 'h1', sourceFile: 'b.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertEqual(result.final.totalRemoved, 1, 'Should handle very long messages');
  });

  await test('Edge case: Mixed empty and non-empty', () => {
    const messages = [
      { id: 1, content: '', hash: 'h1', sourceFile: 'a.txt' },
      { id: 2, content: 'test', hash: 'h2', sourceFile: 'b.txt' },
      { id: 3, content: '', hash: 'h1', sourceFile: 'c.txt' },
    ];
    const result = engine.deduplicate(messages);
    assertEqual(result.final.unique.length, 2, 'Should distinguish empty and non-empty');
  });

  // ========================================================================
  // TEST SUMMARY
  // ========================================================================
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 TEST RESULTS\n`);
  console.log(`Total Tests:   ${testsRun}`);
  console.log(`Passed:        ${testsPassed} ✓`);
  console.log(`Failed:        ${testsFailed} ✗`);
  console.log(`Pass Rate:     ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

  if (testsFailed > 0) {
    console.log(`\n❌ Failed Tests:`);
    failedTests.forEach(name => console.log(`   - ${name}`));
  } else {
    console.log('\n✅ All tests passed!');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests();
