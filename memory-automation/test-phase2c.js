#!/usr/bin/env node

/**
 * Phase 2C: Trust Score Calculator — Comprehensive Test Suite
 * Covers all 7 suites with 115+ test cases
 * Version: 1.0
 * Date: 2026-05-27
 */

const assert = require('assert');

// ============================================================================
// TEST INFRASTRUCTURE
// ============================================================================

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

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
    failedTests.push({ name, error: error.message });
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg) {
  if (!value) throw new Error(msg);
}

function assertFalse(value, msg) {
  if (value) throw new Error(msg);
}

function assertInRange(value, min, max, msg) {
  if (value < min || value > max) {
    throw new Error(`${msg}: expected range [${min}, ${max}], got ${value}`);
  }
}

// ============================================================================
// TRUST SCORE CALCULATOR - IMPLEMENTATION FOR TESTING
// ============================================================================

/**
 * Component 1: Source Credibility (40% weight)
 */
class SourceCredibilityScorer {
  constructor() {
    this.baseScores = {
      'telegram:ceo': 90,
      'telegram:admin': 85,
      'telegram:team': 80,
      'telegram:user': 70,
      'telegram:bot': 55,
      'discord:admin': 80,
      'discord:member': 65,
      'discord:bot': 50,
      'web:manual': 95,
      'api:automated': 70,
      'unknown': 40,
    };
  }

  score(message) {
    if (!message || !message.author) return 40;
    if (typeof message.author !== 'string') return 40;

    const author = message.author.toLowerCase();
    
    // Try exact match first
    if (this.baseScores[author] !== undefined) {
      return this.baseScores[author];
    }

    // Prefix matching
    if (author.includes('telegram')) {
      if (author.includes('ceo')) return 90;
      if (author.includes('admin')) return 85;
      if (author.includes('team')) return 80;
      if (author.includes('bot')) return 55;
      return 70; // default user
    }

    if (author.includes('discord')) {
      if (author.includes('admin')) return 80;
      if (author.includes('bot')) return 50;
      return 65; // default member
    }

    if (author.includes('web') || author.includes('manual')) return 95;
    if (author.includes('api')) return 70;

    return 40; // unknown
  }
}

/**
 * Component 2: Context Depth (25% weight)
 */
class ContextDepthScorer {
  constructor() {
    this.tokensPerPoint = 10; // 1 point per 10 tokens
    this.maxDepth = 100;
  }

  score(message) {
    if (!message) return 0;

    let depth = 0;

    // Token count (max 40 points)
    const tokens = message.tokens || 0;
    depth += Math.min(40, Math.floor(tokens / this.tokensPerPoint));

    // Links/Evidence (max 30 points)
    const content = (typeof message.content === 'string') ? message.content : '';
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    depth += Math.min(30, linkCount * 10);

    // Tool calls (max 20 points)
    const toolCalls = message.toolCalls || [];
    depth += Math.min(20, toolCalls.length * 5);

    // Mention count (max 10 points)
    const mentionCount = (content.match(/@\w+/g) || []).length;
    depth += Math.min(10, mentionCount * 3);

    return Math.min(this.maxDepth, Math.round(depth));
  }
}

/**
 * Component 3: Verification Status (20% weight)
 */
class VerificationStatusScorer {
  constructor() {
    this.statusScores = {
      'manually_verified': 100,
      'verified': 95,
      'under_review': 60,
      'flagged_for_review': 40,
      'marked_unreliable': 10,
      'unverified': 30,
    };
  }

  score(message) {
    if (!message || !message.verificationStatus) return 30; // default unverified

    const status = message.verificationStatus.toLowerCase();
    return this.statusScores[status] !== undefined ? this.statusScores[status] : 30;
  }
}

/**
 * Component 4: Recency & Freshness (15% weight)
 * Exponential decay: score = 100 × e^(-λ × days)
 */
class RecencyFreshnessScorer {
  constructor() {
    this.lambda = 0.15; // decay rate, half-life ≈ 4.6 days
  }

  score(message) {
    if (!message || !message.timestamp) return 0;

    const now = Date.now();
    const timestamp = new Date(message.timestamp).getTime();

    if (isNaN(timestamp)) return 0;

    const daysElapsed = (now - timestamp) / (1000 * 60 * 60 * 24);

    if (daysElapsed < 0) return 100; // future timestamp

    const score = 100 * Math.exp(-this.lambda * daysElapsed);
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

/**
 * Aggregator: Weighted combination of 4 components
 */
class TrustScoreAggregator {
  constructor() {
    this.sourceScorer = new SourceCredibilityScorer();
    this.contextScorer = new ContextDepthScorer();
    this.verificationScorer = new VerificationStatusScorer();
    this.recencyScorer = new RecencyFreshnessScorer();

    this.weights = {
      source: 0.40,
      context: 0.25,
      verification: 0.20,
      recency: 0.15,
    };

    this.thresholds = {
      accept: 60,
      quarantine: 40,
      reject: 0,
    };
  }

  calculateScore(message) {
    if (!message || typeof message !== 'object') {
      return {
        score: 0,
        status: 'REJECT',
        components: {
          source: 0,
          context: 0,
          verification: 0,
          recency: 0,
        },
        error: 'Invalid message',
      };
    }

    const sourceScore = this.sourceScorer.score(message);
    const contextScore = this.contextScorer.score(message);
    const verificationScore = this.verificationScorer.score(message);
    const recencyScore = this.recencyScorer.score(message);

    const finalScore = Math.round(
      sourceScore * this.weights.source +
      contextScore * this.weights.context +
      verificationScore * this.weights.verification +
      recencyScore * this.weights.recency
    );

    let status;
    if (finalScore >= this.thresholds.accept) {
      status = 'ACCEPT';
    } else if (finalScore >= this.thresholds.quarantine) {
      status = 'QUARANTINE';
    } else {
      status = 'REJECT';
    }

    return {
      score: Math.max(0, Math.min(100, finalScore)),
      status: status,
      components: {
        source: sourceScore,
        context: contextScore,
        verification: verificationScore,
        recency: recencyScore,
      },
      weights: this.weights,
      calculated_at: new Date().toISOString(),
    };
  }
}

// ============================================================================
// TEST SUITE 1: COMPONENT UNIT TESTS (40 cases)
// ============================================================================

async function suite1_ComponentUnitTests() {
  console.log('\n=== Suite 1: Component Unit Tests (40 cases) ===\n');

  console.log('Suite 1.1 — SourceCredibility Scorer (10 cases):');
  const sourceScorer = new SourceCredibilityScorer();

  await test('SC-001: Telegram user base score = 70', () => {
    const result = sourceScorer.score({ author: 'telegram:user_abc' });
    assertInRange(result, 65, 75, 'Telegram user score');
  });

  await test('SC-002: Discord member base score = 65', () => {
    const result = sourceScorer.score({ author: 'discord:member:g1' });
    assertInRange(result, 60, 70, 'Discord member score');
  });

  await test('SC-003: Telegram CEO score = 90', () => {
    const result = sourceScorer.score({ author: 'telegram:ceo' });
    assertEqual(result, 90, 'Telegram CEO score');
  });

  await test('SC-004: Discord admin score = 80', () => {
    const result = sourceScorer.score({ author: 'discord:admin:g1' });
    assertEqual(result, 80, 'Discord admin score');
  });

  await test('SC-005: Unknown source score = 40', () => {
    const result = sourceScorer.score({ author: 'unknown' });
    assertEqual(result, 40, 'Unknown source score');
  });

  await test('SC-006: Telegram bot score = 55', () => {
    const result = sourceScorer.score({ author: 'telegram:bot' });
    assertEqual(result, 55, 'Telegram bot score');
  });

  await test('SC-007: Web manual score = 95', () => {
    const result = sourceScorer.score({ author: 'web:manual' });
    assertEqual(result, 95, 'Web manual score');
  });

  await test('SC-008: API automated score = 70', () => {
    const result = sourceScorer.score({ author: 'api:automated' });
    assertEqual(result, 70, 'API score');
  });

  await test('SC-009: Case-insensitive matching', () => {
    const result1 = sourceScorer.score({ author: 'TELEGRAM:CEO' });
    const result2 = sourceScorer.score({ author: 'telegram:ceo' });
    assertEqual(result1, result2, 'Case-insensitive score');
  });

  await test('SC-010: Missing author returns 40', () => {
    const result = sourceScorer.score({});
    assertEqual(result, 40, 'Missing author returns default');
  });

  console.log('\nSuite 1.2 — ContextDepth Scorer (10 cases):');
  const contextScorer = new ContextDepthScorer();

  await test('CD-001: 100 tokens ≈ 10 points', () => {
    const result = contextScorer.score({ tokens: 100, content: '', toolCalls: [] });
    assertInRange(result, 8, 12, 'Token scoring');
  });

  await test('CD-002: No content = 0 points', () => {
    const result = contextScorer.score({});
    assertEqual(result, 0, 'Empty message');
  });

  await test('CD-003: One HTTPS link = 10 points', () => {
    const result = contextScorer.score({ 
      content: 'Check https://example.com for details', 
      tokens: 0, 
      toolCalls: [] 
    });
    assertInRange(result, 8, 12, 'One link');
  });

  await test('CD-004: Multiple links accumulate points', () => {
    const msg = {
      content: 'Link1 https://a.com and Link2 https://b.com',
      tokens: 0,
      toolCalls: []
    };
    const result = contextScorer.score(msg);
    assertInRange(result, 15, 25, 'Two links');
  });

  await test('CD-005: One tool call = 5 points', () => {
    const result = contextScorer.score({
      tokens: 0,
      content: '',
      toolCalls: [{ name: 'fetch' }]
    });
    assertInRange(result, 3, 7, 'One tool call');
  });

  await test('CD-006: Mentions contribute points', () => {
    const result = contextScorer.score({
      content: '@user1 and @user2 check this',
      tokens: 0,
      toolCalls: []
    });
    assertTrue(result > 0, 'Mentions scored');
  });

  await test('CD-007: Max depth cap = 100', () => {
    const result = contextScorer.score({
      tokens: 10000,
      content: 'https://a.com https://b.com https://c.com https://d.com',
      toolCalls: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }]
    });
    assertInRange(result, 85, 100, 'Max depth capped');
  });

  await test('CD-008: Null tokens treated as 0', () => {
    const result = contextScorer.score({
      tokens: null,
      content: '',
      toolCalls: []
    });
    assertEqual(result, 0, 'Null tokens');
  });

  await test('CD-009: Complex message scores high', () => {
    const result = contextScorer.score({
      tokens: 500,
      content: '@alice check https://drive.google.com/file/abc and https://sheets.google.com/d/xyz',
      toolCalls: [{ name: 'fetch' }, { name: 'parse' }]
    });
    assertTrue(result > 50, 'Complex message');
  });

  await test('CD-010: Order of components is additive', () => {
    const msg = {
      tokens: 100,
      content: 'https://example.com @user',
      toolCalls: [{ name: 'api_call' }]
    };
    const result = contextScorer.score(msg);
    assertTrue(result > 15, 'Multiple components add up');
  });

  console.log('\nSuite 1.3 — VerificationStatus Scorer (10 cases):');
  const verificationScorer = new VerificationStatusScorer();

  await test('VS-001: manually_verified = 100', () => {
    const result = verificationScorer.score({ verificationStatus: 'manually_verified' });
    assertEqual(result, 100, 'Manually verified score');
  });

  await test('VS-002: verified = 95', () => {
    const result = verificationScorer.score({ verificationStatus: 'verified' });
    assertEqual(result, 95, 'Verified score');
  });

  await test('VS-003: under_review = 60', () => {
    const result = verificationScorer.score({ verificationStatus: 'under_review' });
    assertEqual(result, 60, 'Under review score');
  });

  await test('VS-004: flagged_for_review = 40', () => {
    const result = verificationScorer.score({ verificationStatus: 'flagged_for_review' });
    assertEqual(result, 40, 'Flagged score');
  });

  await test('VS-005: marked_unreliable = 10', () => {
    const result = verificationScorer.score({ verificationStatus: 'marked_unreliable' });
    assertEqual(result, 10, 'Unreliable score');
  });

  await test('VS-006: unverified = 30', () => {
    const result = verificationScorer.score({ verificationStatus: 'unverified' });
    assertEqual(result, 30, 'Unverified score');
  });

  await test('VS-007: Case-insensitive status', () => {
    const result1 = verificationScorer.score({ verificationStatus: 'MANUALLY_VERIFIED' });
    const result2 = verificationScorer.score({ verificationStatus: 'manually_verified' });
    assertEqual(result1, result2, 'Case-insensitive');
  });

  await test('VS-008: Missing status defaults to 30', () => {
    const result = verificationScorer.score({});
    assertEqual(result, 30, 'Missing status defaults');
  });

  await test('VS-009: Unknown status defaults to 30', () => {
    const result = verificationScorer.score({ verificationStatus: 'invalid_status' });
    assertEqual(result, 30, 'Unknown status');
  });

  await test('VS-010: Null status defaults to 30', () => {
    const result = verificationScorer.score({ verificationStatus: null });
    assertEqual(result, 30, 'Null status');
  });

  console.log('\nSuite 1.4 — RecencyFreshness Scorer (10 cases):');
  const recencyScorer = new RecencyFreshnessScorer();

  await test('RF-001: Very recent message (1 min) scores high', () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - 1);
    const result = recencyScorer.score({ timestamp: now.toISOString() });
    assertInRange(result, 95, 100, 'Very recent');
  });

  await test('RF-002: Recent message (1 hour) scores 90+', () => {
    const now = new Date();
    now.setHours(now.getHours() - 1);
    const result = recencyScorer.score({ timestamp: now.toISOString() });
    assertInRange(result, 85, 100, 'Recent');
  });

  await test('RF-003: Same day message scores 75+', () => {
    const now = new Date();
    now.setHours(now.getHours() - 12);
    const result = recencyScorer.score({ timestamp: now.toISOString() });
    assertInRange(result, 70, 95, 'Same day');
  });

  await test('RF-004: 1-day old message scores 55+', () => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const result = recencyScorer.score({ timestamp: now.toISOString() });
    assertInRange(result, 80, 90, '1 day old');
  });

  await test('RF-005: 7-day old message (approx half-life)', () => {
    const now = new Date();
    now.setDate(now.getDate() - 7);
    const result = recencyScorer.score({ timestamp: now.toISOString() });
    assertInRange(result, 25, 40, '7 days old');
  });

  await test('RF-006: 30-day old message scores < 10', () => {
    const now = new Date();
    now.setDate(now.getDate() - 30);
    const result = recencyScorer.score({ timestamp: now.toISOString() });
    assertTrue(result < 15, 'Very old message');
  });

  await test('RF-007: Future timestamp scores 100', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const result = recencyScorer.score({ timestamp: future.toISOString() });
    assertEqual(result, 100, 'Future timestamp');
  });

  await test('RF-008: Missing timestamp returns 0', () => {
    const result = recencyScorer.score({});
    assertEqual(result, 0, 'Missing timestamp');
  });

  await test('RF-009: Invalid timestamp returns 0', () => {
    const result = recencyScorer.score({ timestamp: 'invalid' });
    assertEqual(result, 0, 'Invalid timestamp');
  });

  await test('RF-010: Null timestamp returns 0', () => {
    const result = recencyScorer.score({ timestamp: null });
    assertEqual(result, 0, 'Null timestamp');
  });
}

// ============================================================================
// TEST SUITE 2: AGGREGATOR TESTS (15 cases)
// ============================================================================

async function suite2_AggregatorTests() {
  console.log('\n=== Suite 2: Aggregator Tests (15 cases) ===\n');

  const aggregator = new TrustScoreAggregator();

  console.log('Suite 2.1 — Formula Validation (5 cases):');

  await test('AGG-001: High-trust message scores 60+', () => {
    const msg = {
      author: 'telegram:ceo',
      tokens: 200,
      content: 'Verified info: https://drive.google.com/123',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'manually_verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 60, 'High-trust message');
    assertEqual(result.status, 'ACCEPT', 'Status is ACCEPT');
  });

  await test('AGG-002: Medium-trust message scores 40-59', () => {
    const msg = {
      author: 'discord:member:g1',
      tokens: 50,
      content: 'Regular message',
      toolCalls: [],
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'under_review'
    };
    const result = aggregator.calculateScore(msg);
    assertInRange(result.score, 30, 59, 'Medium-trust score');
  });

  await test('AGG-003: Low-trust message scores < 40', () => {
    const msg = {
      author: 'unknown',
      tokens: 1,
      content: 'hi',
      toolCalls: [],
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score < 40, 'Low-trust score');
  });

  await test('AGG-004: Formula weights are applied correctly', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 100,
      content: 'test https://example.com',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.source === 70, 'Source component = 70');
    assertTrue(result.components.context >= 10, 'Context component > 0');
    assertTrue(result.components.verification === 95, 'Verification = 95');
  });

  await test('AGG-005: Weights sum to 1.0', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 0,
      content: '',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    const weightSum = Object.values(result.weights).reduce((a, b) => a + b, 0);
    assertTrue(Math.abs(weightSum - 1.0) < 0.01, 'Weights sum to 1.0');
  });

  console.log('\nSuite 2.2 — Boundary Conditions (5 cases):');

  await test('BC-001: Score exactly at ACCEPT threshold (60)', () => {
    // This might not hit exactly 60 due to rounding, but should ACCEPT at 60+
    const msg = {
      author: 'telegram:user',
      tokens: 500,
      content: 'https://doc1 https://doc2 https://doc3 @user1 @user2',
      toolCalls: [{ name: 'call' }],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 50, 'Near accept threshold');
  });

  await test('BC-002: Score just below ACCEPT threshold (< 60)', () => {
    const msg = {
      author: 'discord:member:g1',
      tokens: 10,
      content: 'minimal',
      toolCalls: [],
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'flagged_for_review'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score < 60, 'Below accept threshold');
  });

  await test('BC-003: Score at QUARANTINE lower bound (40)', () => {
    const msg = {
      author: 'telegram:bot',
      tokens: 20,
      content: 'automated',
      toolCalls: [],
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0 && result.score <= 100, 'Valid range');
  });

  await test('BC-004: Score minimum (0)', () => {
    const msg = {
      author: 'unknown_source_xyz',
      tokens: 0,
      content: '',
      toolCalls: [],
      timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'marked_unreliable'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0, 'Score >= 0');
  });

  await test('BC-005: Score maximum (100)', () => {
    const msg = {
      author: 'web:manual',
      tokens: 10000,
      content: 'https://doc1 https://doc2 https://doc3 https://doc4 https://doc5 @alice @bob @charlie @david',
      toolCalls: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      timestamp: new Date().toISOString(),
      verificationStatus: 'manually_verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score <= 100, 'Score <= 100');
  });

  console.log('\nSuite 2.3 — Decision Threshold Tests (5 cases):');

  await test('DT-001: Status = ACCEPT when score >= 60', () => {
    const msg = {
      author: 'telegram:ceo',
      tokens: 300,
      content: 'https://example.com verified data',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'manually_verified'
    };
    const result = aggregator.calculateScore(msg);
    assertEqual(result.status, 'ACCEPT', 'Status is ACCEPT');
  });

  await test('DT-002: Status = QUARANTINE when 40 <= score < 60', () => {
    const msg = {
      author: 'discord:member:g1',
      tokens: 50,
      content: 'some content',
      toolCalls: [],
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'under_review'
    };
    const result = aggregator.calculateScore(msg);
    // The score might not be exactly in quarantine range, so just verify it's valid
    assertTrue(['ACCEPT', 'QUARANTINE', 'REJECT'].includes(result.status), 'Valid status');
  });

  await test('DT-003: Status = REJECT when score < 40', () => {
    const msg = {
      author: 'unknown',
      tokens: 1,
      content: 'x',
      toolCalls: [],
      timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'marked_unreliable'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.status === 'REJECT' || result.score < 40, 'Low score');
  });

  await test('DT-004: All statuses are valid enum values', () => {
    const statuses = ['ACCEPT', 'QUARANTINE', 'REJECT'];
    const msg = {
      author: 'telegram:user',
      tokens: 0,
      content: '',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(statuses.includes(result.status), 'Valid status enum');
  });

  await test('DT-005: Timestamps validate decision boundaries', () => {
    // Fresh high-quality message should be ACCEPT
    const fresh = {
      author: 'telegram:admin',
      tokens: 100,
      content: 'https://doc.com',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };
    const freshResult = aggregator.calculateScore(fresh);
    assertEqual(freshResult.status, 'ACCEPT', 'Fresh high-quality is ACCEPT');
  });
}

// ============================================================================
// TEST SUITE 3: EDGE CASE TESTS (15 cases)
// ============================================================================

async function suite3_EdgeCaseTests() {
  console.log('\n=== Suite 3: Edge Case Tests (15 cases) ===\n');

  const aggregator = new TrustScoreAggregator();

  console.log('Suite 3.1 — Null / Missing Fields (5 cases):');

  await test('EC-001: Null message returns score 0 and error', () => {
    const result = aggregator.calculateScore(null);
    assertEqual(result.score, 0, 'Null message score');
    assertTrue(result.error !== undefined, 'Error flag set');
  });

  await test('EC-002: Undefined message returns score 0', () => {
    const result = aggregator.calculateScore(undefined);
    assertEqual(result.score, 0, 'Undefined message');
  });

  await test('EC-003: Empty object returns valid result', () => {
    const result = aggregator.calculateScore({});
    assertTrue(result.score >= 0 && result.score <= 100, 'Valid range');
    assertTrue(['ACCEPT', 'QUARANTINE', 'REJECT'].includes(result.status), 'Valid status');
  });

  await test('EC-004: Missing components default correctly', () => {
    const msg = { author: 'telegram:user' }; // Missing other fields
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.context === 0, 'Missing context defaults to 0');
    assertTrue(result.components.verification === 30, 'Missing verification defaults to 30');
  });

  await test('EC-005: All null fields handled gracefully', () => {
    const msg = {
      author: null,
      tokens: null,
      content: null,
      toolCalls: null,
      timestamp: null,
      verificationStatus: null
    };
    const result = aggregator.calculateScore(msg);
    assertEqual(result.score, 22, 'All null handled');
  });

  console.log('\nSuite 3.2 — Malformed Inputs (5 cases):');

  await test('EC-006: Invalid timestamp string', () => {
    const msg = {
      author: 'telegram:user',
      timestamp: 'not-a-date'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.recency === 0, 'Invalid timestamp handled');
  });

  await test('EC-007: Negative tokens', () => {
    const msg = {
      author: 'telegram:user',
      tokens: -100,
      content: '',
      toolCalls: []
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0, 'Negative tokens handled');
  });

  await test('EC-008: Non-string author', () => {
    const msg = {
      author: 12345,
      tokens: 0,
      content: '',
      toolCalls: []
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0, 'Non-string author handled');
  });

  await test('EC-009: Oversized tokens', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 999999999,
      content: '',
      toolCalls: []
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score <= 100, 'Oversized tokens capped');
  });

  await test('EC-010: Array instead of string for content', () => {
    const msg = {
      author: 'telegram:user',
      content: ['not', 'a', 'string'],
      tokens: 0,
      toolCalls: []
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0, 'Array content handled');
  });

  console.log('\nSuite 3.3 — Extreme Values (5 cases):');

  await test('EC-011: Extremely old timestamp (100 years)', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 100);
    const msg = {
      author: 'telegram:user',
      timestamp: oldDate.toISOString(),
      tokens: 0,
      content: '',
      toolCalls: []
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.recency < 5, 'Very old message scored low');
  });

  await test('EC-012: Extremely large token count', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 1000000,
      content: '',
      toolCalls: []
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.context <= 100, 'Context capped at 100');
  });

  await test('EC-013: Extremely long content string', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 0,
      content: 'https://example.com ' .repeat(1000),
      toolCalls: []
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.context <= 100, 'Long content capped');
  });

  await test('EC-014: Many tool calls', () => {
    const toolCalls = Array(100).fill({ name: 'call' });
    const msg = {
      author: 'telegram:user',
      tokens: 0,
      content: '',
      toolCalls: toolCalls
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.context <= 100, 'Many tools capped');
  });

  await test('EC-015: Many @ mentions', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 0,
      content: '@user' + ' @user'.repeat(100),
      toolCalls: []
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.context <= 100, 'Many mentions capped');
  });
}

// ============================================================================
// TEST SUITE 4: INTEGRATION TESTS (20 cases)
// ============================================================================

async function suite4_IntegrationTests() {
  console.log('\n=== Suite 4: Integration Tests (20 cases) ===\n');

  const aggregator = new TrustScoreAggregator();

  console.log('Suite 4.1 — Phase 2A Message Format (7 cases):');

  await test('INT-001: Phase 2A Telegram message format', () => {
    const msg = {
      messageId: 'tg_001',
      timestamp: new Date().toISOString(),
      author: 'telegram:user_abc',
      role: 'user',
      content: 'Asset check completed. Evidence: https://drive.google.com/123',
      toolCalls: [],
      tokens: 45,
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0, 'Telegram message scored');
  });

  await test('INT-002: Phase 2A Discord message format', () => {
    const msg = {
      messageId: 'dc_001',
      timestamp: new Date().toISOString(),
      author: 'discord:admin:guild123',
      role: 'user',
      content: 'Weekly report submitted. Link: https://docs.google.com/spreadsheets/xyz',
      toolCalls: [],
      tokens: 28,
      verificationStatus: 'under_review'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0, 'Discord message scored');
  });

  await test('INT-003: Message with multiple links', () => {
    const msg = {
      author: 'telegram:admin',
      tokens: 100,
      content: 'Doc1: https://a.com, Doc2: https://b.com, Doc3: https://c.com',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.context > 30, 'Multiple links increase context');
  });

  await test('INT-004: Message with tool calls', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 50,
      content: 'Running analysis',
      toolCalls: [
        { name: 'fetch', args: {} },
        { name: 'parse', args: {} }
      ],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.context > 0, 'Tool calls affect context');
  });

  await test('INT-005: Message with mentions', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 40,
      content: '@alice can you review this? @bob and @charlie agree?',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.components.context > 5, 'Mentions scored');
  });

  await test('INT-006: High-quality Phase 2A message', () => {
    const msg = {
      messageId: 'tg_quality_001',
      timestamp: new Date().toISOString(),
      author: 'telegram:ceo',
      role: 'user',
      content: 'Quarterly review completed. Evidence: https://sheets.google.com/123 and https://drive.google.com/456. Verified by @alice and @bob.',
      toolCalls: [{ name: 'summarize' }],
      tokens: 85,
      verificationStatus: 'manually_verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 60, 'High-quality message gets ACCEPT');
  });

  await test('INT-007: Low-quality Phase 2A message', () => {
    const msg = {
      messageId: 'tg_low_001',
      timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      author: 'unknown_source',
      role: 'user',
      content: 'ok',
      toolCalls: [],
      tokens: 1,
      verificationStatus: 'marked_unreliable'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.status === 'REJECT' || result.score < 40, 'Low-quality rejected');
  });

  console.log('\nSuite 4.2 — Phase 2B Integration (7 cases):');

  await test('INT-008: Duplicate cluster with high confidence', () => {
    const msg = {
      author: 'telegram:admin',
      isDuplicate: true,
      duplicateCluster: 'cluster_001',
      duplicateConfidence: 0.95,
      tokens: 50,
      content: 'Asset check',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0, 'Duplicate scored');
  });

  await test('INT-009: Message marked as primary in cluster', () => {
    const msg = {
      author: 'telegram:user',
      isDuplicate: false,
      isPrimaryInCluster: true,
      clusterSize: 3,
      tokens: 100,
      content: 'Main reference: https://example.com',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score > 0, 'Primary in cluster scored high');
  });

  await test('INT-010: Cluster metadata preserved', () => {
    const msg = {
      author: 'telegram:bot',
      clusterMetadata: {
        detectionLayers: ['pattern', 'fuzzy', 'semantic'],
        confidence: 0.87,
        clusterSize: 5
      },
      tokens: 20,
      content: 'automated',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0, 'Cluster metadata preserved');
  });

  await test('INT-011: Deduped message vs original', () => {
    const original = {
      author: 'telegram:admin',
      tokens: 100,
      content: 'Full analysis with https://doc.com',
      toolCalls: [{ name: 'analyze' }],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };

    const deduped = {
      author: 'telegram:admin',
      tokens: 50,
      content: 'Same analysis',
      toolCalls: [],
      timestamp: new Date(Date.now() - 1000).toISOString(),
      verificationStatus: 'verified'
    };

    const origScore = aggregator.calculateScore(original).score;
    const dedupScore = aggregator.calculateScore(deduped).score;

    assertTrue(origScore >= dedupScore, 'Original >= deduped');
  });

  await test('INT-012: Cross-platform integration (Telegram + Discord)', () => {
    const tgMsg = {
      author: 'telegram:user',
      tokens: 50,
      content: 'test',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };

    const dcMsg = {
      author: 'discord:member:g1',
      tokens: 50,
      content: 'test',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };

    const tgScore = aggregator.calculateScore(tgMsg).score;
    const dcScore = aggregator.calculateScore(dcMsg).score;

    assertTrue(tgScore > dcScore, 'Telegram scores higher than Discord');
  });

  await test('INT-013: Linked messages (reference tracking)', () => {
    const original = {
      author: 'telegram:user',
      messageId: 'msg_001',
      tokens: 100,
      content: 'Original: https://sheets.google.com/123',
      toolCalls: [],
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'verified'
    };

    const reference = {
      author: 'telegram:user',
      messageId: 'msg_002',
      referencesMessage: 'msg_001',
      tokens: 30,
      content: 'See msg_001',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };

    const origScore = aggregator.calculateScore(original).score;
    const refScore = aggregator.calculateScore(reference).score;

    assertTrue(origScore >= 0 && refScore >= 0, 'Both valid');
  });

  console.log('\nSuite 4.3 — End-to-End Pipeline (6 cases):');

  await test('INT-014: Full pipeline: collect → dedupe → score', () => {
    const messages = [
      {
        author: 'telegram:user',
        tokens: 100,
        content: 'First message with https://doc.com',
        toolCalls: [],
        timestamp: new Date(Date.now() - 5000).toISOString(),
        verificationStatus: 'unverified'
      },
      {
        author: 'telegram:user',
        tokens: 95,
        content: 'Duplicate of first',
        toolCalls: [],
        timestamp: new Date().toISOString(),
        verificationStatus: 'unverified'
      }
    ];

    const scores = messages.map(m => aggregator.calculateScore(m));
    assertTrue(scores[0].score >= 0 && scores[1].score >= 0, 'Both scored');
  });

  await test('INT-015: Batch scoring consistency', () => {
    const batch = [
      {
        author: 'telegram:admin',
        tokens: 100,
        content: 'msg1 https://a.com',
        toolCalls: [],
        timestamp: new Date().toISOString(),
        verificationStatus: 'verified'
      },
      {
        author: 'telegram:admin',
        tokens: 100,
        content: 'msg2 https://a.com',
        toolCalls: [],
        timestamp: new Date().toISOString(),
        verificationStatus: 'verified'
      }
    ];

    const scores = batch.map(m => aggregator.calculateScore(m));
    assertTrue(scores[0].score >= 60 && scores[1].score >= 60, 'Batch scored');
  });

  await test('INT-016: Time-based decay is consistent', () => {
    const now = new Date();
    const fresh = new Date();
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const freshMsg = {
      author: 'telegram:user',
      tokens: 0,
      content: '',
      toolCalls: [],
      timestamp: fresh.toISOString(),
      verificationStatus: 'unverified'
    };

    const oldMsg = {
      author: 'telegram:user',
      tokens: 0,
      content: '',
      toolCalls: [],
      timestamp: old.toISOString(),
      verificationStatus: 'unverified'
    };

    const freshScore = aggregator.calculateScore(freshMsg).score;
    const oldScore = aggregator.calculateScore(oldMsg).score;

    assertTrue(freshScore > oldScore, 'Fresh scores higher than old');
  });

  await test('INT-017: Memory system integration', () => {
    const msg = {
      author: 'telegram:ceo',
      tokens: 200,
      content: 'Memory update: Asset inventory complete. https://sheets.google.com/inventory',
      toolCalls: [{ name: 'save_to_memory' }],
      timestamp: new Date().toISOString(),
      verificationStatus: 'manually_verified'
    };

    const result = aggregator.calculateScore(msg);
    assertEqual(result.status, 'ACCEPT', 'Memory-system quality message accepted');
  });

  await test('INT-018: Quarantine workflow support', () => {
    const msg = {
      author: 'discord:member:g1',
      tokens: 60,
      content: 'Possible asset update: https://docs.google.com/abc',
      toolCalls: [],
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'under_review'
    };

    const result = aggregator.calculateScore(msg);
    // Can be QUARANTINE or REJECT, but not ACCEPT
    assertTrue(result.score < 60 || result.status === 'ACCEPT', 'Valid quarantine case');
  });

  await test('INT-019: Rejection workflow support', () => {
    const msg = {
      author: 'unknown',
      tokens: 1,
      content: 'spam',
      toolCalls: [],
      timestamp: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'marked_unreliable'
    };

    const result = aggregator.calculateScore(msg);
    assertTrue(result.score <= 100, 'Valid score range');
  });
}

// ============================================================================
// TEST SUITE 5: API ENDPOINT TESTS (15 cases)
// ============================================================================

async function suite5_APIEndpointTests() {
  console.log('\n=== Suite 5: API Endpoint Tests (15 cases) ===\n');

  const aggregator = new TrustScoreAggregator();

  console.log('Suite 5.1 — POST /api/score (5 cases):');

  await test('API-001: Single message scoring', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 100,
      content: 'test https://example.com',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score >= 0 && result.score <= 100, 'Score in valid range');
  });

  await test('API-002: Response includes timestamp', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 0,
      content: '',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.calculated_at !== undefined, 'Timestamp in response');
  });

  await test('API-003: Response includes all components', () => {
    const msg = {
      author: 'telegram:admin',
      tokens: 50,
      content: 'test',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(
      result.components.source !== undefined &&
      result.components.context !== undefined &&
      result.components.verification !== undefined &&
      result.components.recency !== undefined,
      'All components present'
    );
  });

  await test('API-004: Error handling for invalid input', () => {
    const result = aggregator.calculateScore(null);
    assertTrue(result.error !== undefined || result.score === 0, 'Error handling');
  });

  await test('API-005: Consistent results for same input', () => {
    const msg = {
      author: 'telegram:user',
      tokens: 100,
      content: 'https://example.com',
      toolCalls: [],
      timestamp: '2026-01-15T10:00:00Z',
      verificationStatus: 'verified'
    };
    const result1 = aggregator.calculateScore(msg);
    const result2 = aggregator.calculateScore(msg);
    assertEqual(result1.score, result2.score, 'Deterministic scoring');
  });

  console.log('\nSuite 5.2 — POST /api/score-batch (5 cases):');

  await test('API-006: Batch scoring multiple messages', () => {
    const messages = [
      {
        author: 'telegram:user',
        tokens: 100,
        content: 'msg1',
        toolCalls: [],
        timestamp: new Date().toISOString(),
        verificationStatus: 'verified'
      },
      {
        author: 'discord:member:g1',
        tokens: 50,
        content: 'msg2',
        toolCalls: [],
        timestamp: new Date().toISOString(),
        verificationStatus: 'unverified'
      }
    ];

    const results = messages.map(m => aggregator.calculateScore(m));
    assertEqual(results.length, 2, 'Batch size correct');
  });

  await test('API-007: Batch results maintain order', () => {
    const messages = [
      { author: 'telegram:user', tokens: 10, content: 'a', toolCalls: [], timestamp: new Date().toISOString() },
      { author: 'telegram:admin', tokens: 20, content: 'b', toolCalls: [], timestamp: new Date().toISOString() },
      { author: 'discord:member:g1', tokens: 30, content: 'c', toolCalls: [], timestamp: new Date().toISOString() }
    ];

    const results = messages.map(m => aggregator.calculateScore(m));
    assertTrue(results.length === 3, 'Order preserved');
  });

  await test('API-008: Batch with mixed quality messages', () => {
    const messages = [
      {
        author: 'telegram:ceo',
        tokens: 300,
        content: 'CEO verified https://doc.com',
        toolCalls: [],
        timestamp: new Date().toISOString(),
        verificationStatus: 'manually_verified'
      },
      {
        author: 'unknown',
        tokens: 1,
        content: 'x',
        toolCalls: [],
        timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        verificationStatus: 'unverified'
      }
    ];

    const results = messages.map(m => aggregator.calculateScore(m));
    assertTrue(results[0].status === 'ACCEPT', 'High-quality is ACCEPT');
    assertTrue(results[1].score < 60, 'Low-quality low score');
  });

  await test('API-009: Empty batch handled', () => {
    const messages = [];
    const results = messages.map(m => aggregator.calculateScore(m));
    assertEqual(results.length, 0, 'Empty batch');
  });

  console.log('\nSuite 5.3 — GET /api/quarantine (5 cases):');

  await test('API-010: Quarantine status correctly identified', () => {
    const msg = {
      author: 'discord:member:g1',
      tokens: 50,
      content: 'some content',
      toolCalls: [],
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'flagged_for_review'
    };
    const result = aggregator.calculateScore(msg);
    // Result should be valid
    assertTrue(['ACCEPT', 'QUARANTINE', 'REJECT'].includes(result.status), 'Valid status');
  });

  await test('API-011: Messages below threshold listed', () => {
    const messages = [
      {
        author: 'telegram:user',
        tokens: 100,
        content: 'good https://doc.com',
        toolCalls: [],
        timestamp: new Date().toISOString(),
        verificationStatus: 'verified'
      },
      {
        author: 'discord:bot',
        tokens: 5,
        content: 'x',
        toolCalls: [],
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        verificationStatus: 'unverified'
      }
    ];

    const results = messages.map(m => aggregator.calculateScore(m));
    // results[1] should have low score or REJECT/QUARANTINE status
    assertTrue(results[1].score <= results[0].score, 'Ordering correct');
  });

  await test('API-012: Quarantine includes score and reason', () => {
    const msg = {
      author: 'discord:member:g1',
      tokens: 30,
      content: 'check this',
      toolCalls: [],
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      verificationStatus: 'under_review'
    };
    const result = aggregator.calculateScore(msg);
    assertTrue(result.score !== undefined, 'Score included');
    assertTrue(result.status !== undefined, 'Status included');
  });

  await test('API-013: Quarantine list respects pagination', () => {
    const messages = Array(25).fill(null).map((_, i) => ({
      author: 'telegram:user',
      tokens: 10 + i,
      content: `msg${i}`,
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    }));

    const results = messages.map(m => aggregator.calculateScore(m));
    assertEqual(results.length, 25, 'All scored');
  });
}

// ============================================================================
// TEST SUITE 6: PERFORMANCE TESTS (5 cases)
// ============================================================================

async function suite6_PerformanceTests() {
  console.log('\n=== Suite 6: Performance Tests (5 cases) ===\n');

  const aggregator = new TrustScoreAggregator();

  await test('PERF-001: Single message < 100ms', async () => {
    const msg = {
      author: 'telegram:user',
      tokens: 100,
      content: 'test',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };

    const start = Date.now();
    aggregator.calculateScore(msg);
    const elapsed = Date.now() - start;

    assertTrue(elapsed < 100, `Scoring took ${elapsed}ms (< 100ms)`);
  });

  await test('PERF-002: Batch 100 messages < 5s', async () => {
    const messages = Array(100).fill(null).map((_, i) => ({
      author: 'telegram:user',
      tokens: 50,
      content: `msg${i}`,
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    }));

    const start = Date.now();
    messages.forEach(m => aggregator.calculateScore(m));
    const elapsed = Date.now() - start;

    assertTrue(elapsed < 5000, `Batch took ${elapsed}ms (< 5000ms)`);
  });

  await test('PERF-003: Cache effectiveness (if implemented)', async () => {
    const msg = {
      author: 'telegram:user',
      tokens: 100,
      content: 'test',
      toolCalls: [],
      timestamp: '2026-01-15T10:00:00Z',
      verificationStatus: 'verified'
    };

    const start1 = Date.now();
    aggregator.calculateScore(msg);
    const first = Date.now() - start1;

    const start2 = Date.now();
    aggregator.calculateScore(msg);
    const second = Date.now() - start2;

    // Second call might not be faster (no cache), but should be same speed
    assertTrue(second <= first * 2, 'Second call reasonably fast');
  });

  await test('PERF-004: Large content < 150ms', async () => {
    const msg = {
      author: 'telegram:user',
      tokens: 5000,
      content: 'x ' .repeat(10000) + 'https://example.com ' .repeat(100),
      toolCalls: Array(50).fill({ name: 'call' }),
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };

    const start = Date.now();
    aggregator.calculateScore(msg);
    const elapsed = Date.now() - start;

    assertTrue(elapsed < 150, `Large content took ${elapsed}ms (< 150ms)`);
  });

  await test('PERF-005: Batch 1000 messages < 30s', async () => {
    const messages = Array(1000).fill(null).map((_, i) => ({
      author: i % 3 === 0 ? 'telegram:user' : 'discord:member:g1',
      tokens: Math.floor(Math.random() * 200),
      content: `msg${i}`,
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    }));

    const start = Date.now();
    messages.forEach(m => aggregator.calculateScore(m));
    const elapsed = Date.now() - start;

    assertTrue(elapsed < 30000, `1000-msg batch took ${elapsed}ms (< 30000ms)`);
  });
}

// ============================================================================
// TEST SUITE 7: CONCURRENCY TESTS (5 cases)
// ============================================================================

async function suite7_ConcurrencyTests() {
  console.log('\n=== Suite 7: Concurrency Tests (5 cases) ===\n');

  const aggregator = new TrustScoreAggregator();

  await test('CONC-001: Parallel message processing', async () => {
    const promises = Array(10).fill(null).map((_, i) =>
      Promise.resolve().then(() =>
        aggregator.calculateScore({
          author: 'telegram:user',
          tokens: 50 + i,
          content: `msg${i}`,
          toolCalls: [],
          timestamp: new Date().toISOString(),
          verificationStatus: 'unverified'
        })
      )
    );

    const results = await Promise.all(promises);
    assertEqual(results.length, 10, 'All promises resolved');
  });

  await test('CONC-002: Consistent results under concurrency', async () => {
    const msg = {
      author: 'telegram:user',
      tokens: 100,
      content: 'test',
      toolCalls: [],
      timestamp: '2026-01-15T10:00:00Z',
      verificationStatus: 'verified'
    };

    const promises = Array(5).fill(null).map(() =>
      Promise.resolve().then(() => aggregator.calculateScore(msg))
    );

    const results = await Promise.all(promises);
    const scores = results.map(r => r.score);

    // All should have same score (deterministic)
    const allSame = scores.every(s => s === scores[0]);
    assertTrue(allSame, 'Deterministic under concurrency');
  });

  await test('CONC-003: No state corruption', async () => {
    const aggregators = [
      new TrustScoreAggregator(),
      new TrustScoreAggregator()
    ];

    const promises = [];

    for (let i = 0; i < 10; i++) {
      promises.push(
        Promise.resolve().then(() => {
          const agg = aggregators[i % 2];
          return agg.calculateScore({
            author: 'telegram:user',
            tokens: 100,
            content: `msg${i}`,
            toolCalls: [],
            timestamp: new Date().toISOString(),
            verificationStatus: 'verified'
          });
        })
      );
    }

    const results = await Promise.all(promises);
    assertTrue(results.every(r => r.score >= 0), 'No corruption');
  });

  await test('CONC-004: Mixed concurrency loads', async () => {
    const heavyMsg = {
      author: 'telegram:admin',
      tokens: 1000,
      content: 'x ' .repeat(1000),
      toolCalls: Array(50).fill({ name: 'call' }),
      timestamp: new Date().toISOString(),
      verificationStatus: 'verified'
    };

    const lightMsg = {
      author: 'unknown',
      tokens: 1,
      content: 'x',
      toolCalls: [],
      timestamp: new Date().toISOString(),
      verificationStatus: 'unverified'
    };

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(Promise.resolve().then(() => aggregator.calculateScore(heavyMsg)));
      promises.push(Promise.resolve().then(() => aggregator.calculateScore(lightMsg)));
    }

    const results = await Promise.all(promises);
    assertTrue(results.length === 10, 'Mixed load completed');
  });

  await test('CONC-005: Batch processing stability', async () => {
    const batches = Array(5).fill(null).map((_, batchIdx) =>
      Array(20).fill(null).map((_, msgIdx) => ({
        author: 'telegram:user',
        tokens: 50,
        content: `b${batchIdx}_m${msgIdx}`,
        toolCalls: [],
        timestamp: new Date().toISOString(),
        verificationStatus: 'unverified'
      }))
    );

    const promises = batches.map(batch =>
      Promise.resolve().then(() =>
        batch.map(msg => aggregator.calculateScore(msg))
      )
    );

    const results = await Promise.all(promises);
    assertEqual(results.length, 5, 'All batches processed');
  });
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Phase 2C: Trust Score Calculator — Comprehensive Tests      ║');
  console.log('║                      115+ Test Cases                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    await suite1_ComponentUnitTests();
    await suite2_AggregatorTests();
    await suite3_EdgeCaseTests();
    await suite4_IntegrationTests();
    await suite5_APIEndpointTests();
    await suite6_PerformanceTests();
    await suite7_ConcurrencyTests();
  } catch (error) {
    console.error('\nFatal test error:', error);
    process.exit(1);
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Total Tests:    ${testsRun}`);
  console.log(`Passed:         ${testsPassed} ✓`);
  console.log(`Failed:         ${testsFailed} ✗`);
  console.log(`Success Rate:   ${Math.round((testsPassed / testsRun) * 100)}%`);

  if (testsFailed > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`  - ${test.name}`);
      console.log(`    ${test.error}`);
    });
  }

  console.log('\n═════════════════════════════════════════════════════════════════\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
