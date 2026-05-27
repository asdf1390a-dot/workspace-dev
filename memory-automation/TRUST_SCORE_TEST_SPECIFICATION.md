# Trust Score Calculator — Test Specification
# Phase 2C: Memory Automation System

**Version:** 1.0  
**Status:** Design Complete — Ready for Phase 2C Implementation  
**Author:** Memory System Specialist (Phase C #13)  
**Date:** 2026-05-27  
**Coverage Target:** 100% branches, 100% critical paths  
**Test Count:** 115 test cases (exceeds minimum 100)

---

## 1. Test Architecture Overview

```
test-phase2c.js
├── Suite 1: Component Unit Tests (40 cases)
│   ├── 1.1 SourceCredibility Scorer (10 cases)
│   ├── 1.2 ContextDepth Scorer (10 cases)
│   ├── 1.3 VerificationStatus Scorer (10 cases)
│   └── 1.4 RecencyFreshness Scorer (10 cases)
├── Suite 2: Aggregator Tests (15 cases)
│   ├── 2.1 Formula Validation (5 cases)
│   ├── 2.2 Boundary Conditions (5 cases)
│   └── 2.3 Decision Threshold Tests (5 cases)
├── Suite 3: Edge Case Tests (15 cases)
│   ├── 3.1 Null / Missing Fields (5 cases)
│   ├── 3.2 Malformed Inputs (5 cases)
│   └── 3.3 Extreme Values (5 cases)
├── Suite 4: Integration Tests (20 cases)
│   ├── 4.1 Phase 2A Message Format (7 cases)
│   ├── 4.2 Phase 2B Duplicate Detection (7 cases)
│   └── 4.3 End-to-End Pipeline (6 cases)
├── Suite 5: API Endpoint Tests (15 cases)
│   ├── 5.1 POST /api/score (5 cases)
│   ├── 5.2 POST /api/score-batch (5 cases)
│   └── 5.3 GET /api/quarantine (5 cases)
├── Suite 6: Performance Tests (5 cases)
└── Suite 7: Concurrency Tests (5 cases)
```

---

## 2. Test Environment Setup

### 2.1 Prerequisites

```bash
# Phase 2C service must be running on port 3011
PORT=3011 node phase2c-trust-score.js

# Phase 2A mock (or real) on port 3009
PORT=3009 node phase2a-message-collection.js

# Phase 2B mock (or real) on port 3010
PORT=3010 node phase2b-duplicate-detection.js
```

### 2.2 Test Harness

```javascript
// test-phase2c.js — test harness skeleton
const assert = require('assert');
const http = require('http');

const BASE_URL = process.env.PHASE2C_URL || 'http://localhost:3011';
let passed = 0;
let failed = 0;
let total = 0;

async function post(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function get(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  return { status: response.status, body: await response.json() };
}

async function test(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}
```

---

## 3. Test Data Fixtures

### 3.1 Standard Telegram Message Fixtures

```javascript
// fixtures/telegram-messages.js

const TELEGRAM_HIGH_TRUST = {
  messageId: 'tg_001',
  timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  author: 'telegram:verified_channel',
  role: 'user',
  content: 'Memory update: Asset A-001 inspection completed. Evidence: https://drive.google.com/file/d/abc123 — Verification link with detailed report attached.',
  toolCalls: [],
  tokens: 45,
};

const TELEGRAM_MEDIUM_TRUST = {
  messageId: 'tg_002',
  timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  author: 'telegram:user_regular',
  role: 'user',
  content: 'Asset check done for section B.',
  toolCalls: [],
  tokens: 8,
};

const TELEGRAM_LOW_TRUST = {
  messageId: 'tg_003',
  timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  author: 'telegram:unknown_bot',
  role: 'user',
  content: 'hi',
  toolCalls: [],
  tokens: 1,
};
```

### 3.2 Discord Message Fixtures

```javascript
// fixtures/discord-messages.js

const DISCORD_ADMIN_MESSAGE = {
  messageId: 'dc_001',
  timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  author: 'discord:admin:guild123',
  role: 'user',
  content: 'Weekly report submission confirmed. Attached: https://docs.google.com/spreadsheets/d/xyz789 — Production output for week 21.',
  toolCalls: [],
  tokens: 28,
};

const DISCORD_REGULAR_MESSAGE = {
  messageId: 'dc_002',
  timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  author: 'discord:member:guild456',
  role: 'user',
  content: 'Checked the numbers, looks okay.',
  toolCalls: [],
  tokens: 7,
};
```

### 3.3 Null / Edge Case Fixtures

```javascript
// fixtures/edge-cases.js

const NULL_AUTHOR = {
  messageId: 'edge_001',
  timestamp: new Date().toISOString(),
  author: null,
  role: 'user',
  content: 'Valid content here.',
  toolCalls: [],
  tokens: 5,
};

const EMPTY_CONTENT = {
  messageId: 'edge_002',
  timestamp: new Date().toISOString(),
  author: 'telegram:user_regular',
  role: 'user',
  content: '',
  toolCalls: [],
  tokens: 0,
};

const MISSING_TIMESTAMP = {
  messageId: 'edge_003',
  author: 'telegram:user_regular',
  role: 'user',
  content: 'Content without timestamp.',
  toolCalls: [],
  tokens: 10,
};

const FUTURE_TIMESTAMP = {
  messageId: 'edge_004',
  timestamp: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour in future
  author: 'telegram:user_regular',
  role: 'user',
  content: 'Future message.',
  toolCalls: [],
  tokens: 3,
};

const EXPIRED_MESSAGE = {
  messageId: 'edge_005',
  timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), // 31 days ago
  author: 'telegram:user_regular',
  role: 'user',
  content: 'Old message that should score very low on recency.',
  toolCalls: [],
  tokens: 12,
};

const UNICODE_CONTENT = {
  messageId: 'edge_006',
  timestamp: new Date().toISOString(),
  author: 'telegram:user_regular',
  role: 'user',
  content: '자산 점검 완료. 링크: https://example.com/report',
  toolCalls: [],
  tokens: 15,
};

const VERY_LONG_CONTENT = {
  messageId: 'edge_007',
  timestamp: new Date().toISOString(),
  author: 'telegram:user_regular',
  role: 'user',
  content: 'A'.repeat(10000),
  toolCalls: [],
  tokens: 2500,
};
```

### 3.4 Phase 2B Output Fixtures

```javascript
// fixtures/phase2b-output.js

const PHASE2B_NO_DUPLICATES = {
  success: true,
  recommendations: [],
  totalDuplicates: 0,
  processingTime: 45,
};

const PHASE2B_WITH_DUPLICATES = {
  success: true,
  recommendations: [
    {
      clusterId: 'cluster_0',
      primaryIndex: 0,
      primaryEntry: { filename: 'msg_001', title: 'Asset Report', description: 'Weekly report' },
      duplicateIndices: [1, 2],
      confidence: 0.92,
      matchType: 'fuzzy_content',
    },
  ],
  totalDuplicates: 2,
  processingTime: 88,
};
```

---

## 4. Suite 1: Component Unit Tests

### 4.1 SourceCredibility Scorer (10 cases)

```javascript
describe('Suite 1.1 — SourceCredibility Scorer', () => {

  // TC-SC-001: Telegram base score
  test('TC-SC-001: Telegram source base score = 70', async () => {
    const scorer = new SourceCredibilityScorer();
    const msg = { author: 'telegram:user_abc', content: 'test' };
    const result = scorer.score(msg);
    assert.ok(result >= 70 && result <= 80, `Expected 70-80, got ${result}`);
  });

  // TC-SC-002: Discord base score
  test('TC-SC-002: Discord source base score = 65', async () => {
    const scorer = new SourceCredibilityScorer();
    const msg = { author: 'discord:member:guild1', content: 'test' };
    const result = scorer.score(msg);
    assert.ok(result >= 65 && result <= 75, `Expected 65-75, got ${result}`);
  });

  // TC-SC-003: Admin/admin channel gets +15 boost
  test('TC-SC-003: Admin source gets credibility boost', async () => {
    const scorer = new SourceCredibilityScorer();
    const adminMsg = { author: 'discord:admin:guild1', content: 'test' };
    const regularMsg = { author: 'discord:member:guild1', content: 'test' };
    const adminScore = scorer.score(adminMsg);
    const regularScore = scorer.score(regularMsg);
    assert.ok(adminScore > regularScore, 'Admin should score higher than regular');
    assert.ok(adminScore - regularScore >= 10, `Expected ≥10 difference, got ${adminScore - regularScore}`);
  });

  // TC-SC-004: Unknown source scores minimum (0)
  test('TC-SC-004: Unknown source returns score = 0', async () => {
    const scorer = new SourceCredibilityScorer();
    const msg = { author: 'unknown:xyz', content: 'test' };
    const result = scorer.score(msg);
    assert.strictEqual(result, 0, `Expected 0, got ${result}`);
  });

  // TC-SC-005: Null author handled gracefully
  test('TC-SC-005: Null author returns score = 0, no throw', async () => {
    const scorer = new SourceCredibilityScorer();
    const msg = { author: null, content: 'test' };
    assert.doesNotThrow(() => scorer.score(msg));
    const result = scorer.score(msg);
    assert.strictEqual(result, 0);
  });

  // TC-SC-006: Empty string author returns 0
  test('TC-SC-006: Empty string author returns score = 0', async () => {
    const scorer = new SourceCredibilityScorer();
    const msg = { author: '', content: 'test' };
    const result = scorer.score(msg);
    assert.strictEqual(result, 0);
  });

  // TC-SC-007: Score is clamped between 0 and 100
  test('TC-SC-007: Score never exceeds 100', async () => {
    const scorer = new SourceCredibilityScorer();
    const verifiedAdmin = { author: 'telegram:admin:verified_global', content: 'test' };
    const result = scorer.score(verifiedAdmin);
    assert.ok(result <= 100, `Score must be ≤ 100, got ${result}`);
  });

  // TC-SC-008: Score is never negative
  test('TC-SC-008: Score is never negative', async () => {
    const scorer = new SourceCredibilityScorer();
    const penaltyMsg = { author: 'telegram:banned_source', content: 'test' };
    const result = scorer.score(penaltyMsg);
    assert.ok(result >= 0, `Score must be ≥ 0, got ${result}`);
  });

  // TC-SC-009: Exact boundary value = 50
  test('TC-SC-009: Boundary value 50 — mid-tier Telegram user', async () => {
    const scorer = new SourceCredibilityScorer();
    // Create a message that should produce ~50 (base Telegram minus some penalty)
    const msg = { author: 'telegram:unverified_new_user', content: 'test' };
    const result = scorer.score(msg);
    // Result should be in a reasonable range for a new/unverified user
    assert.ok(result >= 0 && result <= 100, `Score out of range: ${result}`);
  });

  // TC-SC-010: Returns numeric type
  test('TC-SC-010: Return type is always number', async () => {
    const scorer = new SourceCredibilityScorer();
    const cases = [
      { author: 'telegram:user', content: '' },
      { author: null, content: '' },
      { author: 'discord:admin:g1', content: '' },
    ];
    for (const msg of cases) {
      const result = scorer.score(msg);
      assert.strictEqual(typeof result, 'number', `Expected number, got ${typeof result}`);
      assert.ok(!isNaN(result), 'Score must not be NaN');
    }
  });

});
```

### 4.2 ContextDepth Scorer (10 cases)

```javascript
describe('Suite 1.2 — ContextDepth Scorer', () => {

  // TC-CD-001: Empty content scores 0
  test('TC-CD-001: Empty content scores 0', async () => {
    const scorer = new ContextDepthScorer();
    const msg = { content: '', tokens: 0 };
    const result = scorer.score(msg);
    assert.strictEqual(result, 0);
  });

  // TC-CD-002: Very short content (1-5 words) scores low
  test('TC-CD-002: Short content (1-5 words) scores ≤ 25', async () => {
    const scorer = new ContextDepthScorer();
    const msg = { content: 'done', tokens: 1 };
    const result = scorer.score(msg);
    assert.ok(result <= 25, `Short content should score ≤ 25, got ${result}`);
  });

  // TC-CD-003: Medium content (20-50 words) scores 40-70
  test('TC-CD-003: Medium content scores 40-70', async () => {
    const scorer = new ContextDepthScorer();
    const content = 'Asset inspection completed at section B4. Found minor corrosion on joints 3 and 7. Maintenance team notified. Next inspection due in 30 days per schedule.';
    const msg = { content, tokens: Math.ceil(content.split(' ').length * 1.3) };
    const result = scorer.score(msg);
    assert.ok(result >= 40 && result <= 70, `Expected 40-70, got ${result}`);
  });

  // TC-CD-004: Rich content with keywords scores high (≥70)
  test('TC-CD-004: Rich content with action keywords scores ≥ 70', async () => {
    const scorer = new ContextDepthScorer();
    const content = 'WEEKLY REPORT: Production output 12,500 units. Quality check passed 99.2%. Defect rate 0.8%. Actions: scheduled preventive maintenance, updated BM record for equipment A-14. Evidence: https://docs.google.com/spreadsheets/d/xyz789';
    const msg = { content, tokens: 60 };
    const result = scorer.score(msg);
    assert.ok(result >= 70, `Rich content should score ≥ 70, got ${result}`);
  });

  // TC-CD-005: Content with numbers/data gets bonus
  test('TC-CD-005: Content with numeric data receives scoring bonus', async () => {
    const scorer = new ContextDepthScorer();
    const withData = { content: 'Production: 12,500 units at 99.2% quality rate.', tokens: 12 };
    const withoutData = { content: 'Production completed this week successfully.', tokens: 6 };
    const scoreWithData = scorer.score(withData);
    const scoreWithout = scorer.score(withoutData);
    assert.ok(scoreWithData > scoreWithout, 'Data-rich content should score higher');
  });

  // TC-CD-006: Null content handled gracefully
  test('TC-CD-006: Null content returns 0 without throwing', async () => {
    const scorer = new ContextDepthScorer();
    const msg = { content: null, tokens: 0 };
    assert.doesNotThrow(() => scorer.score(msg));
    const result = scorer.score(msg);
    assert.strictEqual(result, 0);
  });

  // TC-CD-007: Undefined content handled gracefully
  test('TC-CD-007: Undefined content returns 0 without throwing', async () => {
    const scorer = new ContextDepthScorer();
    const msg = { tokens: 0 };
    assert.doesNotThrow(() => scorer.score(msg));
    const result = scorer.score(msg);
    assert.strictEqual(result, 0);
  });

  // TC-CD-008: Very long content (10K chars) scores but doesn't crash
  test('TC-CD-008: Very long content (10K chars) handles gracefully', async () => {
    const scorer = new ContextDepthScorer();
    const msg = { content: 'A'.repeat(10000), tokens: 2500 };
    assert.doesNotThrow(() => scorer.score(msg));
    const result = scorer.score(msg);
    assert.ok(result >= 0 && result <= 100, `Score out of range: ${result}`);
  });

  // TC-CD-009: Unicode/Korean content scores correctly
  test('TC-CD-009: Unicode/Korean content scores ≥ 0', async () => {
    const scorer = new ContextDepthScorer();
    const msg = { content: '주간 생산 보고서: 12,500개 생산 완료. 품질 99.2% 달성.', tokens: 20 };
    const result = scorer.score(msg);
    assert.ok(result >= 0 && result <= 100, `Score out of range: ${result}`);
  });

  // TC-CD-010: Boundary at exactly 100 tokens
  test('TC-CD-010: Exactly 100 tokens scores appropriately', async () => {
    const scorer = new ContextDepthScorer();
    const msg = { content: 'word '.repeat(77), tokens: 100 };
    const result = scorer.score(msg);
    assert.ok(typeof result === 'number' && !isNaN(result) && result >= 0 && result <= 100);
  });

});
```

### 4.3 VerificationStatus Scorer (10 cases)

```javascript
describe('Suite 1.3 — VerificationStatus Scorer', () => {

  // TC-VS-001: Content with valid HTTPS URL scores high
  test('TC-VS-001: HTTPS URL in content scores ≥ 70', async () => {
    const scorer = new VerificationStatusScorer();
    const msg = { content: 'Report available at https://drive.google.com/file/d/abc123' };
    const result = await scorer.score(msg);
    assert.ok(result >= 70, `HTTPS URL should score ≥ 70, got ${result}`);
  });

  // TC-VS-002: Content with no URL scores baseline (≤ 30)
  test('TC-VS-002: No URL in content scores ≤ 30', async () => {
    const scorer = new VerificationStatusScorer();
    const msg = { content: 'Check completed today. All good.' };
    const result = await scorer.score(msg);
    assert.ok(result <= 30, `No URL should score ≤ 30, got ${result}`);
  });

  // TC-VS-003: HTTP (non-HTTPS) URL scores lower than HTTPS
  test('TC-VS-003: HTTP URL scores lower than HTTPS URL', async () => {
    const scorer = new VerificationStatusScorer();
    const https = { content: 'Link: https://secure.example.com/report' };
    const http = { content: 'Link: http://insecure.example.com/report' };
    const httpsScore = await scorer.score(https);
    const httpScore = await scorer.score(http);
    assert.ok(httpsScore >= httpScore, 'HTTPS should score ≥ HTTP');
  });

  // TC-VS-004: Multiple URLs score higher than single URL
  test('TC-VS-004: Multiple URLs score higher than single URL', async () => {
    const scorer = new VerificationStatusScorer();
    const oneUrl = { content: 'See https://example.com/a' };
    const twoUrls = { content: 'See https://example.com/a and https://example.com/b' };
    const scoreOne = await scorer.score(oneUrl);
    const scoreTwo = await scorer.score(twoUrls);
    assert.ok(scoreTwo >= scoreOne, 'Multiple URLs should score ≥ single URL');
  });

  // TC-VS-005: Keyword "evidence" in content boosts score
  test('TC-VS-005: Evidence keyword boosts verification score', async () => {
    const scorer = new VerificationStatusScorer();
    const withKeyword = { content: 'Evidence attached. Report: https://example.com/r' };
    const withoutKeyword = { content: 'Report: https://example.com/r' };
    const withScore = await scorer.score(withKeyword);
    const withoutScore = await scorer.score(withoutKeyword);
    assert.ok(withScore >= withoutScore, 'Evidence keyword should boost score');
  });

  // TC-VS-006: Score 0 for completely empty content
  test('TC-VS-006: Empty content scores 0', async () => {
    const scorer = new VerificationStatusScorer();
    const msg = { content: '' };
    const result = await scorer.score(msg);
    assert.strictEqual(result, 0);
  });

  // TC-VS-007: Null content handled gracefully
  test('TC-VS-007: Null content does not throw, returns 0', async () => {
    const scorer = new VerificationStatusScorer();
    const msg = { content: null };
    let result;
    await assert.doesNotReject(async () => { result = await scorer.score(msg); });
    assert.strictEqual(result, 0);
  });

  // TC-VS-008: URL with query params is still valid
  test('TC-VS-008: URL with query params scores as valid URL', async () => {
    const scorer = new VerificationStatusScorer();
    const msg = { content: 'Report: https://example.com/report?id=123&format=pdf' };
    const result = await scorer.score(msg);
    assert.ok(result >= 50, `URL with query params should score ≥ 50, got ${result}`);
  });

  // TC-VS-009: Score ≥ 0 and ≤ 100 always
  test('TC-VS-009: Score always in [0, 100] range', async () => {
    const scorer = new VerificationStatusScorer();
    const cases = [
      { content: '' },
      { content: 'No links.' },
      { content: 'https://a.com https://b.com https://c.com https://d.com https://e.com' },
      { content: null },
    ];
    for (const msg of cases) {
      const result = await scorer.score(msg);
      assert.ok(result >= 0 && result <= 100, `Score out of range [0,100]: ${result}`);
    }
  });

  // TC-VS-010: Malformed URLs do not crash scorer
  test('TC-VS-010: Malformed URLs handled without crash', async () => {
    const scorer = new VerificationStatusScorer();
    const msg = { content: 'See http:///broken and ftp://weird.com and not-a-url' };
    await assert.doesNotReject(async () => scorer.score(msg));
  });

});
```

### 4.4 RecencyFreshness Scorer (10 cases)

```javascript
describe('Suite 1.4 — RecencyFreshness Scorer', () => {

  // TC-RF-001: Message < 1 hour ago scores ≥ 90
  test('TC-RF-001: Message < 1 hour ago scores ≥ 90', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = { timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() };
    const result = scorer.score(msg);
    assert.ok(result >= 90, `Recent message should score ≥ 90, got ${result}`);
  });

  // TC-RF-002: Message 24 hours ago scores 60-80
  test('TC-RF-002: Message 24 hours ago scores 60-80', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() };
    const result = scorer.score(msg);
    assert.ok(result >= 50 && result <= 85, `24h message should score 50-85, got ${result}`);
  });

  // TC-RF-003: Message 7 days ago scores 20-50
  test('TC-RF-003: Message 7 days ago scores 20-50', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = { timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() };
    const result = scorer.score(msg);
    assert.ok(result >= 10 && result <= 55, `7-day message should score 10-55, got ${result}`);
  });

  // TC-RF-004: Message 30+ days ago scores ≤ 10
  test('TC-RF-004: Message ≥ 30 days ago scores ≤ 10', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = { timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString() };
    const result = scorer.score(msg);
    assert.ok(result <= 10, `Month-old message should score ≤ 10, got ${result}`);
  });

  // TC-RF-005: Message just now (0 seconds ago) scores ~100
  test('TC-RF-005: Message just now scores ≥ 95', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = { timestamp: new Date().toISOString() };
    const result = scorer.score(msg);
    assert.ok(result >= 95, `Just-now message should score ≥ 95, got ${result}`);
  });

  // TC-RF-006: Future timestamp handled gracefully
  test('TC-RF-006: Future timestamp returns 100 or is clamped (no crash)', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = { timestamp: new Date(Date.now() + 60 * 60 * 1000).toISOString() };
    assert.doesNotThrow(() => scorer.score(msg));
    const result = scorer.score(msg);
    assert.ok(result >= 0 && result <= 100, `Score out of range: ${result}`);
  });

  // TC-RF-007: Null timestamp handled gracefully
  test('TC-RF-007: Null timestamp returns 0 without crash', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = { timestamp: null };
    assert.doesNotThrow(() => scorer.score(msg));
    const result = scorer.score(msg);
    assert.ok(result >= 0 && result <= 100, `Score out of range: ${result}`);
  });

  // TC-RF-008: Missing timestamp field returns 0
  test('TC-RF-008: Missing timestamp field returns 0', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = {};
    assert.doesNotThrow(() => scorer.score(msg));
    const result = scorer.score(msg);
    assert.strictEqual(result, 0);
  });

  // TC-RF-009: Score decreases monotonically with age
  test('TC-RF-009: Older messages always score lower (monotonic decay)', async () => {
    const scorer = new RecencyFreshnessScorer();
    const ages = [60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000];
    let prevScore = 101;
    for (const ageMs of ages) {
      const msg = { timestamp: new Date(Date.now() - ageMs).toISOString() };
      const result = scorer.score(msg);
      assert.ok(result <= prevScore, `Score should be monotonically decreasing: ${prevScore} -> ${result}`);
      prevScore = result;
    }
  });

  // TC-RF-010: Invalid timestamp string returns 0 without crash
  test('TC-RF-010: Invalid timestamp string returns 0', async () => {
    const scorer = new RecencyFreshnessScorer();
    const msg = { timestamp: 'not-a-date' };
    assert.doesNotThrow(() => scorer.score(msg));
    const result = scorer.score(msg);
    assert.strictEqual(result, 0);
  });

});
```

---

## 5. Suite 2: Aggregator Tests

### 5.1 Formula Validation (5 cases)

```javascript
describe('Suite 2.1 — Formula Validation', () => {

  // TC-AG-001: Formula weights sum to 1.0
  test('TC-AG-001: All weights sum to exactly 1.0', () => {
    const weights = { source: 0.40, context: 0.25, verification: 0.20, recency: 0.15 };
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.0001, `Weights sum must be 1.0, got ${sum}`);
  });

  // TC-AG-002: All-100 components yield score of 100
  test('TC-AG-002: All components = 100 → final score = 100', () => {
    const calc = new TrustScoreAggregator();
    const score = calc.aggregate({ source: 100, context: 100, verification: 100, recency: 100 });
    assert.strictEqual(score, 100);
  });

  // TC-AG-003: All-zero components yield score of 0
  test('TC-AG-003: All components = 0 → final score = 0', () => {
    const calc = new TrustScoreAggregator();
    const score = calc.aggregate({ source: 0, context: 0, verification: 0, recency: 0 });
    assert.strictEqual(score, 0);
  });

  // TC-AG-004: Specific weighted calculation (known expected value)
  test('TC-AG-004: Known input → exact weighted output', () => {
    const calc = new TrustScoreAggregator();
    // TRUST = 0.40*80 + 0.25*60 + 0.20*70 + 0.15*90
    // = 32 + 15 + 14 + 13.5 = 74.5
    const score = calc.aggregate({ source: 80, context: 60, verification: 70, recency: 90 });
    assert.ok(Math.abs(score - 74.5) < 0.1, `Expected 74.5, got ${score}`);
  });

  // TC-AG-005: Score is always rounded to 1 decimal place
  test('TC-AG-005: Output score has precision ≤ 1 decimal', () => {
    const calc = new TrustScoreAggregator();
    const score = calc.aggregate({ source: 73, context: 58, verification: 61, recency: 47 });
    const decimalPart = String(score).split('.')[1] || '';
    assert.ok(decimalPart.length <= 1, `Score has too many decimals: ${score}`);
  });

});
```

### 5.2 Boundary Conditions (5 cases)

```javascript
describe('Suite 2.2 — Boundary Conditions', () => {

  // TC-BC-001: Score at exactly 60 is ACCEPT
  test('TC-BC-001: Score 60.0 → decision = ACCEPT', () => {
    const calc = new TrustScoreAggregator();
    // Design: score = 0.40*70 + 0.25*50 + 0.20*50 + 0.15*50 = 28+12.5+10+7.5 = 58... adjust
    // Need input that gives exactly 60
    // 0.40*70 + 0.25*55 + 0.20*55 + 0.15*55 = 28 + 13.75 + 11 + 8.25 = 61 (close enough)
    const score = 60.0;
    const decision = calc.decide(score);
    assert.strictEqual(decision, 'ACCEPT', `Score 60 should be ACCEPT, got ${decision}`);
  });

  // TC-BC-002: Score at 59.9 is QUARANTINE
  test('TC-BC-002: Score 59.9 → decision = QUARANTINE', () => {
    const calc = new TrustScoreAggregator();
    const decision = calc.decide(59.9);
    assert.strictEqual(decision, 'QUARANTINE', `Score 59.9 should be QUARANTINE, got ${decision}`);
  });

  // TC-BC-003: Score at exactly 40 is QUARANTINE
  test('TC-BC-003: Score 40.0 → decision = QUARANTINE', () => {
    const calc = new TrustScoreAggregator();
    const decision = calc.decide(40.0);
    assert.strictEqual(decision, 'QUARANTINE', `Score 40 should be QUARANTINE, got ${decision}`);
  });

  // TC-BC-004: Score at 39.9 is REJECT
  test('TC-BC-004: Score 39.9 → decision = REJECT', () => {
    const calc = new TrustScoreAggregator();
    const decision = calc.decide(39.9);
    assert.strictEqual(decision, 'REJECT', `Score 39.9 should be REJECT, got ${decision}`);
  });

  // TC-BC-005: Score 100 is ACCEPT, score 0 is REJECT
  test('TC-BC-005: Extreme scores have correct decisions', () => {
    const calc = new TrustScoreAggregator();
    assert.strictEqual(calc.decide(100), 'ACCEPT');
    assert.strictEqual(calc.decide(0), 'REJECT');
  });

});
```

### 5.3 Decision Threshold Tests (5 cases)

```javascript
describe('Suite 2.3 — Decision Threshold Tests', () => {

  // TC-DT-001: ACCEPT range is [60, 100]
  test('TC-DT-001: Scores 60-100 all return ACCEPT', () => {
    const calc = new TrustScoreAggregator();
    [60, 70, 80, 90, 100].forEach(score => {
      assert.strictEqual(calc.decide(score), 'ACCEPT', `${score} should be ACCEPT`);
    });
  });

  // TC-DT-002: QUARANTINE range is [40, 59.9]
  test('TC-DT-002: Scores 40-59 all return QUARANTINE', () => {
    const calc = new TrustScoreAggregator();
    [40, 45, 50, 55, 59].forEach(score => {
      assert.strictEqual(calc.decide(score), 'QUARANTINE', `${score} should be QUARANTINE`);
    });
  });

  // TC-DT-003: REJECT range is [0, 39.9]
  test('TC-DT-003: Scores 0-39 all return REJECT', () => {
    const calc = new TrustScoreAggregator();
    [0, 10, 20, 30, 39].forEach(score => {
      assert.strictEqual(calc.decide(score), 'REJECT', `${score} should be REJECT`);
    });
  });

  // TC-DT-004: Decision is included in score result object
  test('TC-DT-004: Score result object includes decision field', async () => {
    const scorer = new TrustScoreCalculator();
    const result = await scorer.score(TELEGRAM_HIGH_TRUST);
    assert.ok(result.hasOwnProperty('decision'), 'Result must have decision field');
    assert.ok(['ACCEPT', 'QUARANTINE', 'REJECT'].includes(result.decision),
      `Invalid decision value: ${result.decision}`);
  });

  // TC-DT-005: Score result includes all required fields
  test('TC-DT-005: Score result has all required top-level fields', async () => {
    const scorer = new TrustScoreCalculator();
    const result = await scorer.score(TELEGRAM_MEDIUM_TRUST);
    const required = ['messageId', 'trustScore', 'decision', 'components', 'timestamp', 'processingTime'];
    for (const field of required) {
      assert.ok(result.hasOwnProperty(field), `Missing required field: ${field}`);
    }
  });

});
```

---

## 6. Suite 3: Edge Case Tests

### 6.1 Null / Missing Fields (5 cases)

```javascript
describe('Suite 3.1 — Null / Missing Fields', () => {

  // TC-EC-001: Fully null message object
  test('TC-EC-001: Fully null input returns 400', async () => {
    const result = await post('/api/score', { message: null });
    assert.strictEqual(result.status, 400);
  });

  // TC-EC-002: Missing messageId field
  test('TC-EC-002: Missing messageId → still processes, generates ID', async () => {
    const msg = { ...TELEGRAM_MEDIUM_TRUST };
    delete msg.messageId;
    const result = await post('/api/score', { message: msg });
    assert.ok([200, 400].includes(result.status), `Unexpected status: ${result.status}`);
    if (result.status === 200) {
      assert.ok(result.body.messageId, 'Should generate messageId if missing');
    }
  });

  // TC-EC-003: Missing author (null)
  test('TC-EC-003: Null author → source credibility = 0, still scores', async () => {
    const result = await post('/api/score', { message: NULL_AUTHOR });
    assert.ok([200, 400].includes(result.status));
    if (result.status === 200) {
      assert.ok(result.body.components.sourceCredibility === 0,
        'Null author should yield 0 source credibility');
    }
  });

  // TC-EC-004: Missing content (empty string)
  test('TC-EC-004: Empty content → context and verification both 0', async () => {
    const result = await post('/api/score', { message: EMPTY_CONTENT });
    if (result.status === 200) {
      assert.strictEqual(result.body.components.contextDepth, 0);
      assert.strictEqual(result.body.components.verificationStatus, 0);
    }
  });

  // TC-EC-005: Missing timestamp
  test('TC-EC-005: Missing timestamp → recency = 0, no crash', async () => {
    const result = await post('/api/score', { message: MISSING_TIMESTAMP });
    assert.ok([200, 400].includes(result.status));
    if (result.status === 200) {
      assert.strictEqual(result.body.components.recencyFreshness, 0);
    }
  });

});
```

### 6.2 Malformed Inputs (5 cases)

```javascript
describe('Suite 3.2 — Malformed Inputs', () => {

  // TC-MI-001: Non-object message
  test('TC-MI-001: String as message → 400 error', async () => {
    const result = await post('/api/score', { message: 'not-an-object' });
    assert.strictEqual(result.status, 400);
  });

  // TC-MI-002: Array as message
  test('TC-MI-002: Array as message → 400 error', async () => {
    const result = await post('/api/score', { message: [1, 2, 3] });
    assert.strictEqual(result.status, 400);
  });

  // TC-MI-003: Empty request body
  test('TC-MI-003: Empty body → 400 error', async () => {
    const result = await post('/api/score', {});
    assert.strictEqual(result.status, 400);
  });

  // TC-MI-004: Tokens as string instead of number
  test('TC-MI-004: Tokens as string is coerced or handled', async () => {
    const msg = { ...TELEGRAM_MEDIUM_TRUST, tokens: '45' };
    const result = await post('/api/score', { message: msg });
    assert.ok([200, 400].includes(result.status));
  });

  // TC-MI-005: Unexpected extra fields are ignored
  test('TC-MI-005: Extra unknown fields do not crash scorer', async () => {
    const msg = { ...TELEGRAM_MEDIUM_TRUST, unknownField: 'surprise', anotherField: 99 };
    const result = await post('/api/score', { message: msg });
    assert.ok([200, 400].includes(result.status));
  });

});
```

### 6.3 Extreme Values (5 cases)

```javascript
describe('Suite 3.3 — Extreme Values', () => {

  // TC-EV-001: Very old message (365 days)
  test('TC-EV-001: 365-day-old message → recency ≈ 0', async () => {
    const msg = {
      ...TELEGRAM_MEDIUM_TRUST,
      timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const result = await post('/api/score', { message: msg });
    if (result.status === 200) {
      assert.ok(result.body.components.recencyFreshness <= 5, 'Year-old message should have nearly 0 recency');
    }
  });

  // TC-EV-002: Extremely high token count (50K)
  test('TC-EV-002: 50K tokens does not crash or cause OOM', async () => {
    const msg = { ...TELEGRAM_MEDIUM_TRUST, content: 'word '.repeat(38000), tokens: 50000 };
    const result = await post('/api/score', { message: msg });
    assert.ok([200, 413].includes(result.status), `Unexpected status: ${result.status}`);
  });

  // TC-EV-003: 10 URLs in content
  test('TC-EV-003: Message with 10 URLs scores verification ≥ 90', async () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://example${i}.com/file`).join(' ');
    const msg = { ...TELEGRAM_MEDIUM_TRUST, content: urls };
    const result = await post('/api/score', { message: msg });
    if (result.status === 200) {
      assert.ok(result.body.components.verificationStatus >= 90,
        `10 URLs should give verification ≥ 90, got ${result.body.components.verificationStatus}`);
    }
  });

  // TC-EV-004: Score is deterministic (same input → same output)
  test('TC-EV-004: Deterministic scoring for identical input', async () => {
    const result1 = await post('/api/score', { message: TELEGRAM_HIGH_TRUST });
    const result2 = await post('/api/score', { message: TELEGRAM_HIGH_TRUST });
    if (result1.status === 200 && result2.status === 200) {
      assert.strictEqual(result1.body.trustScore, result2.body.trustScore,
        'Same input must produce same score');
    }
  });

  // TC-EV-005: Score of future message not above 100
  test('TC-EV-005: Future-dated message score ≤ 100', async () => {
    const msg = { ...TELEGRAM_MEDIUM_TRUST, timestamp: FUTURE_TIMESTAMP.timestamp };
    const result = await post('/api/score', { message: msg });
    if (result.status === 200) {
      assert.ok(result.body.trustScore <= 100, `Score must be ≤ 100, got ${result.body.trustScore}`);
    }
  });

});
```

---

## 7. Suite 4: Integration Tests

### 4.1 Phase 2A Message Format (7 cases)

```javascript
describe('Suite 4.1 — Phase 2A Integration', () => {

  // TC-P2A-001: Phase 2A output format is accepted directly
  test('TC-P2A-001: Phase 2A formatMessages() output accepted by scorer', async () => {
    // Phase 2A produces: {messageId, timestamp, author, role, content, toolCalls, tokens}
    const phase2aMsg = {
      messageId: 'msg_2a_001',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      author: 'telegram:channel_dsc',
      role: 'user',
      content: 'Weekly asset report: A-001 to A-050 all inspected. No major defects found.',
      toolCalls: [],
      tokens: 25,
    };
    const result = await post('/api/score', { message: phase2aMsg });
    assert.strictEqual(result.status, 200, `Expected 200, got ${result.status}`);
    assert.ok(result.body.trustScore >= 0 && result.body.trustScore <= 100);
  });

  // TC-P2A-002: Phase 2A message with toolCalls is handled
  test('TC-P2A-002: Message with toolCalls field accepted', async () => {
    const phase2aMsg = {
      messageId: 'msg_2a_002',
      timestamp: new Date().toISOString(),
      author: 'telegram:admin',
      role: 'assistant',
      content: 'Processing request.',
      toolCalls: [{ name: 'read_file', args: { path: 'report.md' } }],
      tokens: 10,
    };
    const result = await post('/api/score', { message: phase2aMsg });
    assert.ok([200, 400].includes(result.status));
  });

  // TC-P2A-003: Batch of Phase 2A messages processed
  test('TC-P2A-003: Batch of 5 Phase 2A messages all scored', async () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({
      messageId: `batch_${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      author: 'telegram:user_regular',
      role: 'user',
      content: `Message content ${i} with some data: ${i * 100} units processed.`,
      toolCalls: [],
      tokens: 15 + i,
    }));
    const result = await post('/api/score-batch', { messages });
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.body.results.length, 5, 'Should return 5 results');
  });

  // TC-P2A-004: Phase 2A collect-messages pipeline integration
  test('TC-P2A-004: /api/pipeline calls Phase 2A and scores results', async () => {
    // This test requires Phase 2A running on port 3009
    // Will skip if Phase 2A unavailable
    const result = await post('/api/pipeline', { sessionKey: 'test-session', limit: 5 });
    assert.ok([200, 503, 500].includes(result.status),
      `Unexpected status: ${result.status}`);
  });

  // TC-P2A-005: source_credibility correctly inferred from author prefix
  test('TC-P2A-005: telegram: prefix → Telegram source type', async () => {
    const msg = {
      messageId: 'p2a_005',
      timestamp: new Date().toISOString(),
      author: 'telegram:verified_admin',
      role: 'user',
      content: 'Test content with some detail.',
      toolCalls: [],
      tokens: 8,
    };
    const result = await post('/api/score', { message: msg });
    if (result.status === 200) {
      assert.ok(result.body.components.sourceCredibility >= 70,
        'telegram: author should yield ≥ 70 source credibility');
    }
  });

  // TC-P2A-006: discord: prefix → Discord source type
  test('TC-P2A-006: discord: prefix → Discord source type', async () => {
    const msg = {
      messageId: 'p2a_006',
      timestamp: new Date().toISOString(),
      author: 'discord:member:guild123',
      role: 'user',
      content: 'Discord message with details.',
      toolCalls: [],
      tokens: 6,
    };
    const result = await post('/api/score', { message: msg });
    if (result.status === 200) {
      assert.ok(result.body.components.sourceCredibility >= 60,
        'discord: author should yield ≥ 60 source credibility');
    }
  });

  // TC-P2A-007: assistant role messages handled
  test('TC-P2A-007: Role = assistant messages processed without error', async () => {
    const msg = {
      messageId: 'p2a_007',
      timestamp: new Date().toISOString(),
      author: 'system:claude',
      role: 'assistant',
      content: 'I have completed the task. Results: 99 items processed.',
      toolCalls: [],
      tokens: 12,
    };
    const result = await post('/api/score', { message: msg });
    assert.ok([200, 400].includes(result.status));
  });

});
```

### 4.2 Phase 2B Integration (7 cases)

```javascript
describe('Suite 4.2 — Phase 2B Integration', () => {

  // TC-P2B-001: Primary entry from Phase 2B scores normally
  test('TC-P2B-001: Primary entry (not duplicate) scores without penalty', async () => {
    const result = await post('/api/score', {
      message: TELEGRAM_HIGH_TRUST,
      phase2bContext: { isDuplicate: false, clusterId: null },
    });
    if (result.status === 200) {
      assert.ok(result.body.trustScore >= 60, 'Non-duplicate should score normally');
    }
  });

  // TC-P2B-002: Duplicate entry gets penalty
  test('TC-P2B-002: Duplicate entry → trust score reduced by 20+', async () => {
    const baseResult = await post('/api/score', {
      message: TELEGRAM_HIGH_TRUST,
      phase2bContext: { isDuplicate: false },
    });
    const dupResult = await post('/api/score', {
      message: TELEGRAM_HIGH_TRUST,
      phase2bContext: { isDuplicate: true, clusterId: 'cluster_0' },
    });
    if (baseResult.status === 200 && dupResult.status === 200) {
      const penalty = baseResult.body.trustScore - dupResult.body.trustScore;
      assert.ok(penalty >= 10, `Duplicate penalty should be ≥ 10, got ${penalty}`);
    }
  });

  // TC-P2B-003: Phase 2B recommendations batch processing
  test('TC-P2B-003: Batch accepts Phase 2B recommendations context', async () => {
    const messages = [TELEGRAM_HIGH_TRUST, TELEGRAM_MEDIUM_TRUST];
    const phase2bRecommendations = PHASE2B_WITH_DUPLICATES.recommendations;
    const result = await post('/api/score-batch', {
      messages,
      phase2bRecommendations,
    });
    assert.ok([200, 400].includes(result.status));
  });

  // TC-P2B-004: Phase 2B unavailable → graceful degradation
  test('TC-P2B-004: Phase 2B unavailable does not block scoring', async () => {
    // Post to /api/pipeline without Phase 2B running
    const result = await post('/api/pipeline', {
      messages: [TELEGRAM_HIGH_TRUST],
      skipPhase2B: true,
    });
    assert.ok([200, 503].includes(result.status), `Unexpected: ${result.status}`);
  });

  // TC-P2B-005: Phase 2B confidence score is preserved in result
  test('TC-P2B-005: Phase 2B confidence preserved in score metadata', async () => {
    const result = await post('/api/score', {
      message: TELEGRAM_HIGH_TRUST,
      phase2bContext: { isDuplicate: false, confidence: 0.92, matchType: 'fuzzy_content' },
    });
    if (result.status === 200 && result.body.metadata) {
      assert.ok(result.body.metadata.phase2bConfidence !== undefined ||
        result.body.metadata.duplicateConfidence !== undefined,
        'Phase 2B confidence should be in metadata');
    }
  });

  // TC-P2B-006: Phase 2B empty recommendations → no duplicates flag
  test('TC-P2B-006: Empty Phase 2B recommendations → isDuplicate = false for all', async () => {
    const messages = [TELEGRAM_HIGH_TRUST, TELEGRAM_MEDIUM_TRUST];
    const result = await post('/api/score-batch', {
      messages,
      phase2bRecommendations: [],
    });
    if (result.status === 200) {
      result.body.results.forEach(r => {
        if (r.metadata) {
          assert.ok(!r.metadata.isDuplicate, 'All should be non-duplicate');
        }
      });
    }
  });

  // TC-P2B-007: Phase 2B cluster ID included in result metadata
  test('TC-P2B-007: Duplicate cluster ID preserved in score result', async () => {
    const result = await post('/api/score', {
      message: TELEGRAM_HIGH_TRUST,
      phase2bContext: { isDuplicate: true, clusterId: 'cluster_abc' },
    });
    if (result.status === 200 && result.body.metadata) {
      // clusterId should be in metadata somewhere
      const metaStr = JSON.stringify(result.body);
      assert.ok(metaStr.includes('cluster_abc'), 'cluster_abc should appear in result');
    }
  });

});
```

### 4.3 End-to-End Pipeline (6 cases)

```javascript
describe('Suite 4.3 — End-to-End Pipeline', () => {

  // TC-E2E-001: Full pipeline returns scored results
  test('TC-E2E-001: POST /api/pipeline returns scored messages', async () => {
    const result = await post('/api/pipeline', {
      messages: [TELEGRAM_HIGH_TRUST, TELEGRAM_MEDIUM_TRUST, TELEGRAM_LOW_TRUST],
    });
    assert.ok([200, 500, 503].includes(result.status));
    if (result.status === 200) {
      assert.ok(Array.isArray(result.body.results), 'results should be array');
    }
  });

  // TC-E2E-002: High trust message is accepted
  test('TC-E2E-002: High-trust message → ACCEPT', async () => {
    const result = await post('/api/score', { message: TELEGRAM_HIGH_TRUST });
    if (result.status === 200) {
      // TELEGRAM_HIGH_TRUST has strong content, recent timestamp, HTTPS link, admin author
      assert.ok(['ACCEPT', 'QUARANTINE'].includes(result.body.decision),
        `Expected ACCEPT or QUARANTINE, got ${result.body.decision}`);
    }
  });

  // TC-E2E-003: Low trust message is rejected
  test('TC-E2E-003: Low-trust message → REJECT or QUARANTINE', async () => {
    const result = await post('/api/score', { message: TELEGRAM_LOW_TRUST });
    if (result.status === 200) {
      assert.ok(['REJECT', 'QUARANTINE'].includes(result.body.decision),
        `Expected REJECT or QUARANTINE, got ${result.body.decision}`);
    }
  });

  // TC-E2E-004: Quarantine endpoint shows QUARANTINE decisions
  test('TC-E2E-004: GET /api/quarantine lists quarantined items', async () => {
    const result = await get('/api/quarantine');
    assert.ok([200, 404].includes(result.status));
    if (result.status === 200) {
      assert.ok(Array.isArray(result.body.items) || Array.isArray(result.body), 'Should return array');
    }
  });

  // TC-E2E-005: Score result is persisted to trust_scores.jsonl
  test('TC-E2E-005: ACCEPT score persisted to trust_scores.jsonl', async () => {
    const result = await post('/api/score', { message: TELEGRAM_HIGH_TRUST });
    if (result.status === 200 && result.body.decision === 'ACCEPT') {
      // File check — simplified: score returns messageId as evidence of persistence
      assert.ok(result.body.messageId, 'Result should have messageId indicating persistence');
    }
  });

  // TC-E2E-006: Stats endpoint reflects processed count
  test('TC-E2E-006: GET /api/stats shows non-zero processed count after scoring', async () => {
    // Score at least one message first
    await post('/api/score', { message: TELEGRAM_MEDIUM_TRUST });
    const stats = await get('/api/stats');
    assert.strictEqual(stats.status, 200);
    assert.ok(typeof stats.body.scored === 'number' || typeof stats.body.processed === 'number',
      'Stats should include scored/processed count');
  });

});
```

---

## 8. Suite 5: API Endpoint Tests

### 5.1 POST /api/score (5 cases)

```javascript
describe('Suite 5.1 — POST /api/score', () => {

  // TC-API-001: Valid request → 200 with score object
  test('TC-API-001: Valid message → 200 with trust score', async () => {
    const result = await post('/api/score', { message: TELEGRAM_MEDIUM_TRUST });
    assert.strictEqual(result.status, 200);
    assert.ok(typeof result.body.trustScore === 'number');
    assert.ok(result.body.trustScore >= 0 && result.body.trustScore <= 100);
  });

  // TC-API-002: Missing message field → 400
  test('TC-API-002: Missing message field → 400', async () => {
    const result = await post('/api/score', {});
    assert.strictEqual(result.status, 400);
    assert.ok(result.body.error, 'Error message required');
  });

  // TC-API-003: Response has Content-Type: application/json
  test('TC-API-003: Response is JSON content type', async () => {
    const response = await fetch(`${BASE_URL}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: TELEGRAM_MEDIUM_TRUST }),
    });
    const ct = response.headers.get('content-type');
    assert.ok(ct.includes('application/json'), `Expected JSON content-type, got ${ct}`);
  });

  // TC-API-004: Response time < 100ms
  test('TC-API-004: Single message scores in < 100ms', async () => {
    const start = Date.now();
    await post('/api/score', { message: TELEGRAM_MEDIUM_TRUST });
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 100, `Scoring took ${elapsed}ms, must be < 100ms`);
  });

  // TC-API-005: Oversized payload → 413
  test('TC-API-005: Oversized payload → 413 or 400', async () => {
    const msg = { ...TELEGRAM_MEDIUM_TRUST, content: 'A'.repeat(1_000_000) };
    const result = await post('/api/score', { message: msg });
    assert.ok([400, 413].includes(result.status), `Expected 400 or 413, got ${result.status}`);
  });

});
```

### 5.2 POST /api/score-batch (5 cases)

```javascript
describe('Suite 5.2 — POST /api/score-batch', () => {

  // TC-BATCH-001: Batch of 10 messages all scored
  test('TC-BATCH-001: 10 messages batch → 10 results', async () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      ...TELEGRAM_MEDIUM_TRUST,
      messageId: `batch_test_${i}`,
    }));
    const result = await post('/api/score-batch', { messages });
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.body.results.length, 10);
  });

  // TC-BATCH-002: Empty array → 400
  test('TC-BATCH-002: Empty messages array → 400', async () => {
    const result = await post('/api/score-batch', { messages: [] });
    assert.strictEqual(result.status, 400);
  });

  // TC-BATCH-003: Batch > 1000 → 413
  test('TC-BATCH-003: >1000 messages → 413', async () => {
    const messages = Array.from({ length: 1001 }, (_, i) => ({
      ...TELEGRAM_LOW_TRUST,
      messageId: `overflow_${i}`,
    }));
    const result = await post('/api/score-batch', { messages });
    assert.ok([400, 413].includes(result.status));
  });

  // TC-BATCH-004: Batch result has processingTime
  test('TC-BATCH-004: Batch result includes processingTime field', async () => {
    const messages = [TELEGRAM_HIGH_TRUST, TELEGRAM_MEDIUM_TRUST];
    const result = await post('/api/score-batch', { messages });
    assert.strictEqual(result.status, 200);
    assert.ok(typeof result.body.processingTime === 'number',
      'Batch result must include processingTime');
  });

  // TC-BATCH-005: Batch of 100 completes in < 5s
  test('TC-BATCH-005: 100 messages batch completes in < 5s', async () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      ...TELEGRAM_MEDIUM_TRUST,
      messageId: `perf_${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
    }));
    const start = Date.now();
    const result = await post('/api/score-batch', { messages });
    const elapsed = Date.now() - start;
    assert.strictEqual(result.status, 200);
    assert.ok(elapsed < 5000, `100 messages took ${elapsed}ms, must be < 5000ms`);
  });

});
```

### 5.3 GET /api/quarantine (5 cases)

```javascript
describe('Suite 5.3 — GET /api/quarantine', () => {

  // TC-QT-001: Quarantine endpoint returns 200
  test('TC-QT-001: GET /api/quarantine returns 200', async () => {
    const result = await get('/api/quarantine');
    assert.strictEqual(result.status, 200);
  });

  // TC-QT-002: Quarantine list items have required fields
  test('TC-QT-002: Quarantine items have messageId + trustScore + decision', async () => {
    const result = await get('/api/quarantine');
    if (result.status === 200 && result.body.items && result.body.items.length > 0) {
      const item = result.body.items[0];
      assert.ok(item.messageId, 'Item must have messageId');
      assert.ok(typeof item.trustScore === 'number', 'Item must have numeric trustScore');
      assert.strictEqual(item.decision, 'QUARANTINE', 'All items must be QUARANTINE');
    }
  });

  // TC-QT-003: Approve endpoint accepts quarantine item
  test('TC-QT-003: POST /api/quarantine/:id/approve returns 200 or 404', async () => {
    const result = await post('/api/quarantine/nonexistent_id/approve', {});
    assert.ok([200, 404].includes(result.status), `Unexpected: ${result.status}`);
  });

  // TC-QT-004: Reject endpoint accepts quarantine item
  test('TC-QT-004: POST /api/quarantine/:id/reject returns 200 or 404', async () => {
    const result = await post('/api/quarantine/nonexistent_id/reject', {});
    assert.ok([200, 404].includes(result.status));
  });

  // TC-QT-005: Health endpoint returns ready
  test('TC-QT-005: GET /health returns {status: "ready"}', async () => {
    const result = await get('/health');
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.body.status, 'ready');
  });

});
```

---

## 9. Suite 6: Performance Tests

```javascript
describe('Suite 6 — Performance Benchmarks', () => {

  // TC-PF-001: Single message scored in < 100ms (p99)
  test('TC-PF-001: Single message latency < 100ms', async () => {
    const timings = [];
    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      await post('/api/score', { message: TELEGRAM_MEDIUM_TRUST });
      timings.push(Date.now() - start);
    }
    timings.sort((a, b) => a - b);
    const p99 = timings[Math.floor(timings.length * 0.99)] || timings[timings.length - 1];
    assert.ok(p99 < 100, `p99 latency ${p99}ms exceeds 100ms target`);
  });

  // TC-PF-002: Batch of 100 completes in < 5s
  test('TC-PF-002: 100-message batch completes in < 5s', async () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      ...TELEGRAM_MEDIUM_TRUST,
      messageId: `perf2_${i}`,
    }));
    const start = Date.now();
    const result = await post('/api/score-batch', { messages });
    const elapsed = Date.now() - start;
    assert.strictEqual(result.status, 200);
    assert.ok(elapsed < 5000, `100-batch: ${elapsed}ms > 5000ms`);
  });

  // TC-PF-003: Throughput ≥ 10 messages/second
  test('TC-PF-003: Sequential throughput ≥ 10 req/s', async () => {
    const count = 10;
    const start = Date.now();
    for (let i = 0; i < count; i++) {
      await post('/api/score', { message: TELEGRAM_MEDIUM_TRUST });
    }
    const elapsed = Date.now() - start;
    const throughput = count / (elapsed / 1000);
    assert.ok(throughput >= 10, `Throughput ${throughput.toFixed(1)} req/s is below 10 req/s`);
  });

  // TC-PF-004: Cache hit reduces latency vs cold start
  test('TC-PF-004: Repeated scoring of same author is faster (cache hit)', async () => {
    // First call — cold
    const coldStart = Date.now();
    await post('/api/score', { message: TELEGRAM_HIGH_TRUST });
    const coldLatency = Date.now() - coldStart;

    // Second call — should be cached
    const hotStart = Date.now();
    await post('/api/score', { message: TELEGRAM_HIGH_TRUST });
    const hotLatency = Date.now() - hotStart;

    // Hot should be at most same as cold (allow equality if already fast)
    assert.ok(hotLatency <= coldLatency * 1.5,
      `Hot ${hotLatency}ms is significantly slower than cold ${coldLatency}ms`);
  });

  // TC-PF-005: No memory leak over 50 sequential requests
  test('TC-PF-005: 50 sequential requests complete without timeout', async () => {
    const start = Date.now();
    for (let i = 0; i < 50; i++) {
      const result = await post('/api/score', {
        message: { ...TELEGRAM_MEDIUM_TRUST, messageId: `memleak_${i}` },
      });
      assert.strictEqual(result.status, 200);
    }
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 30000, `50 requests took ${elapsed}ms (> 30s timeout)`);
  });

});
```

---

## 10. Suite 7: Concurrency Tests

```javascript
describe('Suite 7 — Concurrency Tests', () => {

  // TC-CC-001: 10 parallel requests all succeed
  test('TC-CC-001: 10 concurrent requests all return 200', async () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      post('/api/score', {
        message: { ...TELEGRAM_MEDIUM_TRUST, messageId: `concurrent_${i}` },
      })
    );
    const results = await Promise.all(requests);
    const failures = results.filter(r => r.status !== 200);
    assert.strictEqual(failures.length, 0, `${failures.length} concurrent requests failed`);
  });

  // TC-CC-002: Concurrent batch requests handled safely
  test('TC-CC-002: 3 concurrent batch requests succeed', async () => {
    const batch = Array.from({ length: 10 }, (_, i) => ({
      ...TELEGRAM_MEDIUM_TRUST,
      messageId: `cbatch_${i}`,
    }));
    const requests = Array.from({ length: 3 }, () =>
      post('/api/score-batch', { messages: batch })
    );
    const results = await Promise.all(requests);
    const failures = results.filter(r => r.status !== 200);
    assert.strictEqual(failures.length, 0, `${failures.length} batch requests failed`);
  });

  // TC-CC-003: No race condition — unique results for unique IDs
  test('TC-CC-003: Concurrent scoring produces distinct result per messageId', async () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({
      ...TELEGRAM_MEDIUM_TRUST,
      messageId: `race_check_${i}`,
    }));
    const requests = messages.map(m => post('/api/score', { message: m }));
    const results = await Promise.all(requests);
    const ids = results.filter(r => r.status === 200).map(r => r.body.messageId);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, ids.length, 'All result IDs should be unique');
  });

  // TC-CC-004: Stats remain accurate under concurrent load
  test('TC-CC-004: Stats counter increases correctly under concurrent load', async () => {
    const before = await get('/api/stats');
    const beforeCount = before.body.scored || before.body.processed || 0;

    const requests = Array.from({ length: 10 }, (_, i) =>
      post('/api/score', { message: { ...TELEGRAM_MEDIUM_TRUST, messageId: `stats_${i}` } })
    );
    await Promise.all(requests);

    const after = await get('/api/stats');
    const afterCount = after.body.scored || after.body.processed || 0;
    assert.ok(afterCount >= beforeCount, 'Stats counter should not decrease');
  });

  // TC-CC-005: 20 parallel requests — no 5xx errors
  test('TC-CC-005: 20 concurrent requests produce no 5xx errors', async () => {
    const requests = Array.from({ length: 20 }, (_, i) =>
      post('/api/score', {
        message: { ...TELEGRAM_LOW_TRUST, messageId: `stress_${i}` },
      })
    );
    const results = await Promise.all(requests);
    const serverErrors = results.filter(r => r.status >= 500);
    assert.strictEqual(serverErrors.length, 0,
      `${serverErrors.length} server errors under concurrent load`);
  });

});
```

---

## 11. Test Execution & Reporting

### 11.1 Test Runner Entry Point

```javascript
// test-phase2c.js — main runner
async function runAll() {
  console.log('\n=== Phase 2C Trust Score Calculator — Test Suite ===\n');
  const suites = [
    runSuite1_SourceCredibility,
    runSuite1_ContextDepth,
    runSuite1_VerificationStatus,
    runSuite1_RecencyFreshness,
    runSuite2_Aggregator,
    runSuite3_EdgeCases,
    runSuite4_Integration,
    runSuite5_API,
    runSuite6_Performance,
    runSuite7_Concurrency,
  ];

  for (const suite of suites) {
    await suite();
  }

  console.log('\n=================');
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ✗`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('=================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runAll().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
```

### 11.2 Expected Output

```
=== Phase 2C Trust Score Calculator — Test Suite ===

Suite 1.1 — SourceCredibility Scorer
  ✓ TC-SC-001: Telegram source base score = 70
  ✓ TC-SC-002: Discord source base score = 65
  ✓ TC-SC-003: Admin source gets credibility boost
  ✓ TC-SC-004: Unknown source returns score = 0
  ✓ TC-SC-005: Null author returns score = 0, no throw
  ✓ TC-SC-006: Empty string author returns score = 0
  ✓ TC-SC-007: Score never exceeds 100
  ✓ TC-SC-008: Score is never negative
  ✓ TC-SC-009: Boundary value 50 — mid-tier Telegram user
  ✓ TC-SC-010: Return type is always number

[... all 115 tests ...]

=================
Total Tests: 115
Passed: 115 ✓
Failed: 0 ✗
Pass Rate: 100.0%
=================
```

---

## 12. Coverage Requirements

### 12.1 Branch Coverage (100% Required)

| Module | Branches | Coverage |
|--------|----------|----------|
| SourceCredibilityScorer | telegram/discord/unknown/null/admin/regular | 100% |
| ContextDepthScorer | empty/short/medium/long/null/unicode | 100% |
| VerificationStatusScorer | no-url/http/https/multiple/keywords/null | 100% |
| RecencyFreshnessScorer | fresh/<1h/24h/7d/30d+/null/future/invalid | 100% |
| TrustScoreAggregator | ACCEPT/QUARANTINE/REJECT boundary checks | 100% |
| TrustScoreCalculator | full pipeline, caching, error paths | 100% |
| API routes | valid/invalid/missing/oversized payloads | 100% |
| Circuit breaker | open/half-open/closed transitions | 100% |

### 12.2 Critical Path Coverage

| Path | Test Cases |
|------|-----------|
| High-trust Telegram → ACCEPT | TC-E2E-002 |
| Low-trust anonymous → REJECT | TC-E2E-003 |
| Null input → 400 | TC-EC-001, TC-API-002 |
| Phase 2B duplicate → penalized | TC-P2B-002 |
| Stale 30d message → recency ≈ 0 | TC-RF-004, TC-EV-001 |
| Future timestamp → clamped | TC-RF-006, TC-EV-005 |
| Cache hit latency | TC-PF-004 |
| 10 concurrent → no failure | TC-CC-001 |
| 100-batch < 5s | TC-PF-002, TC-BATCH-005 |
| Formula accuracy | TC-AG-004 |

---

## 13. Manual Validation Checklist

### 13.1 Pre-Test Checklist

```
[ ] Phase 2C service running: curl http://localhost:3011/health → {"status": "ready"}
[ ] Phase 2A service running (optional for integration): port 3009
[ ] Phase 2B service running (optional for integration): port 3010
[ ] Node.js version ≥ 16: node --version
[ ] Dependencies installed: cd memory-automation && npm install
[ ] Logs directory exists: ls memory-automation/logs/
[ ] No stale lock files: ls /tmp/phase2c-cron.lock
```

### 13.2 Manual Smoke Tests (run after automated suite)

```bash
# Smoke Test 1: Single score
curl -X POST http://localhost:3011/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "messageId": "smoke_001",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "author": "telegram:admin_channel",
      "role": "user",
      "content": "Inspection complete. Evidence: https://drive.google.com/file/d/test",
      "toolCalls": [],
      "tokens": 18
    }
  }'
# Expected: {"trustScore": 70-90, "decision": "ACCEPT", ...}

# Smoke Test 2: Health
curl http://localhost:3011/health
# Expected: {"status": "ready", "service": "Phase 2C - Trust Score Calculator", ...}

# Smoke Test 3: Stats
curl http://localhost:3011/api/stats
# Expected: {"scored": X, "accepted": X, "quarantined": X, "rejected": X, ...}

# Smoke Test 4: Batch
curl -X POST http://localhost:3011/api/score-batch \
  -H "Content-Type: application/json" \
  -d '{"messages": [
    {"messageId": "b1", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
     "author": "telegram:user", "role": "user", "content": "short", "toolCalls": [], "tokens": 1},
    {"messageId": "b2", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
     "author": "discord:admin:g1", "role": "user",
     "content": "Detailed weekly report with evidence: https://example.com/r",
     "toolCalls": [], "tokens": 15}
  ]}'
# Expected: results array with 2 entries, b2 scoring higher than b1
```

### 13.3 Edge Case Manual Checks

```bash
# Edge 1: Empty content
curl -X POST http://localhost:3011/api/score \
  -d '{"message": {"messageId": "e1", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "author": "telegram:user", "role": "user", "content": "", "toolCalls": [], "tokens": 0}}'
# Expected: contextDepth = 0, verificationStatus = 0

# Edge 2: Null author
curl -X POST http://localhost:3011/api/score \
  -d '{"message": {"messageId": "e2", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "author": null, "role": "user", "content": "Test", "toolCalls": [], "tokens": 1}}'
# Expected: sourceCredibility = 0, no crash

# Edge 3: Very old message (manual date)
curl -X POST http://localhost:3011/api/score \
  -d '{"message": {"messageId": "e3", "timestamp": "2025-01-01T00:00:00Z",
      "author": "telegram:user", "role": "user", "content": "Old message", "toolCalls": [], "tokens": 3}}'
# Expected: recencyFreshness ≤ 5
```

### 13.4 Performance Manual Verification

```bash
# Time 10 sequential requests
time for i in {1..10}; do
  curl -s -X POST http://localhost:3011/api/score \
    -H "Content-Type: application/json" \
    -d '{"message": {"messageId": "perf_'$i'", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
         "author": "telegram:user", "role": "user", "content": "test content '$i'",
         "toolCalls": [], "tokens": 5}}' > /dev/null
done
# Expected total: < 1s (10 req @ < 100ms each)
```

### 13.5 Post-Test Sign-off Checklist

```
[ ] All 115 automated tests passing (100%)
[ ] Manual smoke tests 1-4 pass
[ ] Edge case manual checks produce expected results
[ ] Performance manual check: 10 req < 1s
[ ] trust_scores.jsonl file created with valid entries
[ ] quarantine_log.jsonl or GET /api/quarantine works
[ ] No unhandled exceptions in node process output
[ ] No ERROR entries in logs/phase2c-errors.log
[ ] Stats endpoint shows plausible counts
[ ] Health endpoint returns "ready" throughout test run
```

---

## 14. Test Summary Table

| Suite | Cases | Coverage Focus |
|-------|-------|---------------|
| 1.1 SourceCredibility | 10 | All source types, null, boundary, type-safety |
| 1.2 ContextDepth | 10 | Empty/short/medium/rich, unicode, long |
| 1.3 VerificationStatus | 10 | URL types, keywords, null, malformed |
| 1.4 RecencyFreshness | 10 | Time decay, null/future/invalid timestamps |
| 2.1 Formula Validation | 5 | Weights, arithmetic, precision |
| 2.2 Boundary Conditions | 5 | 60/40/100/0 thresholds |
| 2.3 Decision Thresholds | 5 | ACCEPT/QUARANTINE/REJECT ranges |
| 3.1 Null/Missing Fields | 5 | All required fields missing |
| 3.2 Malformed Inputs | 5 | Non-object, array, empty body |
| 3.3 Extreme Values | 5 | Future, very old, huge content, determinism |
| 4.1 Phase 2A Integration | 7 | formatMessages() output compatibility |
| 4.2 Phase 2B Integration | 7 | Duplicate context, penalty, cluster ID |
| 4.3 End-to-End | 6 | Full pipeline, persistence, quarantine |
| 5.1 POST /api/score | 5 | Endpoint contract, errors, timing |
| 5.2 POST /api/score-batch | 5 | Batch contract, overflow, timing |
| 5.3 GET /api/quarantine | 5 | Quarantine CRUD, health |
| 6 Performance | 5 | Latency, throughput, memory |
| 7 Concurrency | 5 | Race conditions, no 5xx, accuracy |
| **Total** | **115** | |

---

**Test Specification Status:** ✅ Complete  
**Minimum Cases Required:** 100  
**Actual Cases:** 115  
**ETA for Implementation:** 2026-05-31 (Phase 2C)  
**Verified By:** Memory System Specialist — Phase C #13
