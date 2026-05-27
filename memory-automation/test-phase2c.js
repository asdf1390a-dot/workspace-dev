#!/usr/bin/env node

/**
 * Phase 2C: Trust Score Calculator - Unit Tests
 *
 * 15+ tests covering:
 * - Component calculations (detection, source, temporal, coverage)
 * - Trust score formula
 * - Edge cases
 * - Performance
 */

const { TrustScoreCalculator } = require('./trust-score-calculator.js');
const http = require('http');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

// ============================================================================
// TEST UTILITIES
// ============================================================================

function test(name, fn) {
  testsRun++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    testsFailed++;
    failedTests.push(name);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertApprox(actual, expected, tolerance = 0.01, msg = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${msg}: expected ≈${expected}, got ${actual} (diff: ${diff})`);
  }
}

function assertTrue(value, msg) {
  if (!value) throw new Error(msg);
}

function assertFalse(value, msg) {
  if (value) throw new Error(msg);
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

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3011');
    const options = {
      hostname: url.hostname,
      port: url.port || 3011,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============================================================================
// TESTS: COMPONENT CALCULATIONS
// ============================================================================

console.log('\n🧪 COMPONENT CALCULATION TESTS\n');

test('Detection Confidence: Exact pattern match', () => {
  const calc = new TrustScoreCalculator();
  const cluster = { type: 'pattern', confidence: 1.0, matchType: 'exact_pattern' };
  const score = calc.calculateDetectionConfidence(cluster);
  assertApprox(score, 1.0, 0.05, 'Exact pattern confidence');
});

test('Detection Confidence: Fuzzy title match', () => {
  const calc = new TrustScoreCalculator();
  const cluster = { type: 'fuzzy_title', confidence: 0.88, matchType: 'fuzzy_title' };
  const score = calc.calculateDetectionConfidence(cluster);
  assertGreater(score, 0.80, 'Fuzzy title confidence');
});

test('Detection Confidence: Semantic match', () => {
  const calc = new TrustScoreCalculator();
  const cluster = { type: 'semantic', confidence: 0.87, matchType: 'semantic' };
  const score = calc.calculateDetectionConfidence(cluster);
  assertGreater(score, 0.80, 'Semantic confidence');
});

test('Source Credibility: Telegram source', () => {
  const calc = new TrustScoreCalculator();
  const entries = [
    { source: 'telegram', title: 'Entry 1' },
    { source: 'telegram', title: 'Entry 2' }
  ];
  const score = calc.calculateSourceCredibility(entries, [0, 1]);
  assertApprox(score, 0.90, 0.05, 'Telegram credibility');
});

test('Source Credibility: Mixed sources', () => {
  const calc = new TrustScoreCalculator();
  const entries = [
    { source: 'telegram', title: 'Entry 1' },
    { source: 'api', title: 'Entry 2' }
  ];
  const score = calc.calculateSourceCredibility(entries, [0, 1]);
  const expected = (0.90 + 0.75) / 2; // Average
  assertApprox(score, expected, 0.05, 'Mixed source credibility');
});

test('Source Credibility: Unknown source', () => {
  const calc = new TrustScoreCalculator();
  const entries = [
    { title: 'Entry 1' },
    { title: 'Entry 2' }
  ];
  const score = calc.calculateSourceCredibility(entries, [0, 1]);
  assertApprox(score, 0.50, 0.05, 'Unknown source credibility');
});

test('Temporal Relevance: Fresh entries', () => {
  const calc = new TrustScoreCalculator();
  const now = new Date();
  const entries = [
    { title: 'Entry 1', timestamp: now.toISOString() },
    { title: 'Entry 2', timestamp: now.toISOString() }
  ];
  const score = calc.calculateTemporalRelevance(entries, [0, 1]);
  assertGreater(score, 0.85, 'Fresh entries temporal score');
});

test('Temporal Relevance: Old entries', () => {
  const calc = new TrustScoreCalculator();
  const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
  const entries = [
    { title: 'Entry 1', timestamp: old.toISOString() },
    { title: 'Entry 2', timestamp: old.toISOString() }
  ];
  const score = calc.calculateTemporalRelevance(entries, [0, 1]);
  assertLess(score, 0.40, 'Old entries temporal score');
});

test('Layer Coverage: Single layer', () => {
  const calc = new TrustScoreCalculator();
  const cluster = { type: 'pattern', matchType: 'exact_pattern' };
  const score = calc.calculateLayerCoverage(cluster);
  assertEqual(score, 0.5, 'Single layer coverage');
});

test('Layer Coverage: Two layers', () => {
  const calc = new TrustScoreCalculator();
  const cluster = {
    type: 'pattern',
    matchType: 'exact_pattern',
    layers: { pattern: true, fuzzy: true, semantic: false }
  };
  const score = calc.calculateLayerCoverage(cluster);
  assertEqual(score, 0.8, 'Two layer coverage');
});

test('Layer Coverage: Three layers', () => {
  const calc = new TrustScoreCalculator();
  const cluster = {
    type: 'pattern',
    matchType: 'exact_pattern',
    layers: { pattern: true, fuzzy: true, semantic: true }
  };
  const score = calc.calculateLayerCoverage(cluster);
  assertEqual(score, 1.0, 'Three layer coverage');
});

// ============================================================================
// TESTS: TRUST SCORE CALCULATION
// ============================================================================

console.log('\n🎯 TRUST SCORE CALCULATION TESTS\n');

test('Trust Score: High confidence cluster', () => {
  const calc = new TrustScoreCalculator();
  const cluster = {
    type: 'pattern',
    confidence: 1.0,
    matchType: 'exact_pattern',
    indices: [0, 1],
    duplicateIndices: [1]
  };
  const entries = [
    { title: 'A', source: 'telegram', timestamp: new Date().toISOString() },
    { title: 'A', source: 'telegram', timestamp: new Date().toISOString() }
  ];
  const score = calc.calculateTrustScore(cluster, entries);
  assertGreater(score, 0.85, 'High confidence trust score');
});

test('Trust Score: Low confidence cluster', () => {
  const calc = new TrustScoreCalculator();
  const cluster = {
    type: 'semantic',
    confidence: 0.60,
    matchType: 'semantic',
    indices: [0, 1],
    duplicateIndices: [1]
  };
  const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const entries = [
    { title: 'A', source: 'unknown', timestamp: old.toISOString() },
    { title: 'B', source: 'unknown', timestamp: old.toISOString() }
  ];
  const score = calc.calculateTrustScore(cluster, entries);
  assertLess(score, 0.70, 'Low confidence trust score');
});

test('Trust Score: Clamped to [0, 1]', () => {
  const calc = new TrustScoreCalculator();
  const cluster = { confidence: 2.0, type: 'pattern' }; // Invalid
  const score = calc.calculateTrustScore(cluster, []);
  assertTrue(score >= 0 && score <= 1.0, 'Score within bounds');
});

test('Batch Trust Scores: Multiple clusters', () => {
  const calc = new TrustScoreCalculator();
  const clusters = [
    { type: 'pattern', confidence: 1.0, matchType: 'exact_pattern', indices: [0, 1], duplicateIndices: [1] },
    { type: 'fuzzy_title', confidence: 0.88, matchType: 'fuzzy_title', indices: [2, 3], duplicateIndices: [3] },
    { type: 'semantic', confidence: 0.87, matchType: 'semantic', indices: [4, 5], duplicateIndices: [5] }
  ];
  const entries = [
    { source: 'telegram', timestamp: new Date().toISOString() },
    { source: 'telegram', timestamp: new Date().toISOString() },
    { source: 'api', timestamp: new Date().toISOString() },
    { source: 'api', timestamp: new Date().toISOString() },
    { source: 'discord', timestamp: new Date().toISOString() },
    { source: 'discord', timestamp: new Date().toISOString() }
  ];
  const results = calc.calculateBatchTrustScores(clusters, entries);
  assertEqual(results.length, 3, 'Batch processing count');
  assertTrue(results[0].trustScore > results[1].trustScore, 'Exact match higher than fuzzy');
});

// ============================================================================
// TESTS: RECOMMENDED ACTIONS
// ============================================================================

console.log('\n📋 RECOMMENDED ACTION TESTS\n');

test('Action: MERGE_IMMEDIATELY for high score', () => {
  const calc = new TrustScoreCalculator();
  const action = calc.getRecommendedAction(0.98, {});
  assertEqual(action, 'MERGE_IMMEDIATELY', 'Very high confidence action');
});

test('Action: MERGE_RECOMMENDED for good score', () => {
  const calc = new TrustScoreCalculator();
  const action = calc.getRecommendedAction(0.88, {});
  assertEqual(action, 'MERGE_RECOMMENDED', 'High confidence action');
});

test('Action: REVIEW_AND_MERGE for medium score', () => {
  const calc = new TrustScoreCalculator();
  const action = calc.getRecommendedAction(0.78, {});
  assertEqual(action, 'REVIEW_AND_MERGE', 'Medium confidence action');
});

test('Action: MANUAL_REVIEW for low score', () => {
  const calc = new TrustScoreCalculator();
  const action = calc.getRecommendedAction(0.65, {});
  assertEqual(action, 'MANUAL_REVIEW', 'Low confidence action');
});

test('Action: REJECT for very low score', () => {
  const calc = new TrustScoreCalculator();
  const action = calc.getRecommendedAction(0.50, {});
  assertEqual(action, 'REJECT', 'Very low confidence action');
});

// ============================================================================
// TESTS: SUMMARY STATISTICS
// ============================================================================

console.log('\n📊 SUMMARY STATISTICS TESTS\n');

test('Summary Stats: Calculate mean', () => {
  const calc = new TrustScoreCalculator();
  const scores = [
    { trustScore: 0.90 },
    { trustScore: 0.80 },
    { trustScore: 0.70 }
  ];
  const stats = calc.getSummaryStats(scores);
  assertApprox(stats.mean, 0.80, 0.01, 'Mean score');
});

test('Summary Stats: Identify reliable scores', () => {
  const calc = new TrustScoreCalculator();
  const scores = [
    { trustScore: 0.95 },
    { trustScore: 0.85 },
    { trustScore: 0.65 }
  ];
  const stats = calc.getSummaryStats(scores);
  assertEqual(stats.reliable, 2, 'Reliable count (>= 0.75)');
});

test('Summary Stats: Empty array handling', () => {
  const calc = new TrustScoreCalculator();
  const stats = calc.getSummaryStats([]);
  assertEqual(stats.total, 0, 'Empty stats total');
});

// ============================================================================
// TESTS: WEIGHT VALIDATION
// ============================================================================

console.log('\n⚙️  WEIGHT VALIDATION TESTS\n');

test('Weights: Sum equals 1.0', () => {
  const calc = new TrustScoreCalculator({
    detectionWeight: 0.40,
    sourceWeight: 0.25,
    temporalWeight: 0.20,
    coverageWeight: 0.15
  });
  const sum = calc.detectionWeight + calc.sourceWeight + calc.temporalWeight + calc.coverageWeight;
  assertApprox(sum, 1.0, 0.001, 'Weight sum');
});

test('Weights: Invalid sum throws error', () => {
  try {
    new TrustScoreCalculator({
      detectionWeight: 0.50,
      sourceWeight: 0.25,
      temporalWeight: 0.20,
      coverageWeight: 0.15 // Sums to 1.10
    });
    throw new Error('Should have thrown on invalid weights');
  } catch (e) {
    assertTrue(e.message.includes('Weight sum'), 'Weight validation error');
  }
});

// ============================================================================
// TESTS: CLUSTER ID GENERATION
// ============================================================================

console.log('\n🔑 CLUSTER ID GENERATION TESTS\n');

test('Cluster ID: Consistent generation', () => {
  const calc = new TrustScoreCalculator();
  const cluster = { type: 'pattern', indices: [0, 1] };
  const id1 = calc.generateClusterId(cluster);
  const id2 = calc.generateClusterId(cluster);
  assertEqual(id1, id2, 'Consistent cluster ID');
});

test('Cluster ID: Different for different clusters', () => {
  const calc = new TrustScoreCalculator();
  const cluster1 = { type: 'pattern', indices: [0, 1] };
  const cluster2 = { type: 'fuzzy', indices: [2, 3] };
  const id1 = calc.generateClusterId(cluster1);
  const id2 = calc.generateClusterId(cluster2);
  assertFalse(id1 === id2, 'Different cluster IDs');
});

// ============================================================================
// TESTS: PERFORMANCE
// ============================================================================

console.log('\n⚡ PERFORMANCE TESTS\n');

test('Performance: 100 clusters < 100ms', () => {
  const calc = new TrustScoreCalculator();
  const clusters = Array(100).fill(null).map((_, i) => ({
    type: i % 3 === 0 ? 'pattern' : i % 3 === 1 ? 'fuzzy_title' : 'semantic',
    confidence: 0.8 + Math.random() * 0.2,
    matchType: 'exact_pattern',
    indices: [i, i + 1],
    duplicateIndices: [i + 1]
  }));
  const entries = Array(200).fill(null).map((_, i) => ({
    source: ['telegram', 'discord', 'api'][i % 3],
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const start = Date.now();
  calc.calculateBatchTrustScores(clusters, entries);
  const duration = Date.now() - start;

  assertLess(duration, 100, `Batch processing time (${duration}ms)`);
});

test('Performance: 1000 clusters < 1000ms', () => {
  const calc = new TrustScoreCalculator();
  const clusters = Array(1000).fill(null).map((_, i) => ({
    type: i % 3 === 0 ? 'pattern' : i % 3 === 1 ? 'fuzzy_title' : 'semantic',
    confidence: 0.8 + Math.random() * 0.2,
    matchType: 'exact_pattern',
    indices: [i, i + 1],
    duplicateIndices: [i + 1]
  }));
  const entries = Array(100).fill(null).map((_, i) => ({
    source: ['telegram', 'discord', 'api'][i % 3],
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const start = Date.now();
  calc.calculateBatchTrustScores(clusters, entries);
  const duration = Date.now() - start;

  assertLess(duration, 1000, `Large batch processing time (${duration}ms)`);
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log(`TEST RESULTS: ${testsPassed}/${testsRun} passed`);
console.log('='.repeat(70));

if (testsFailed > 0) {
  console.log(`\n❌ ${testsFailed} tests FAILED:`);
  failedTests.forEach((name, i) => {
    console.log(`  ${i + 1}. ${name}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
}
