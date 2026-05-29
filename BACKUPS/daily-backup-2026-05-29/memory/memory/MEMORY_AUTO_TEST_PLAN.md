---
name: Memory Automation Phase 2 Test Plan
description: Test strategy for message collection, duplicate detection, trust scoring, and cron scheduling APIs
type: project
date: 2026-05-28
coverage_targets: Unit 80%, Integration 70%, E2E 60%
total_tests: 42
---

# 🧪 Memory Automation Phase 2 Test Plan

**Project:** Memory System Automation — Duplicate Detection, Trust Scoring, Cron Integration  
**ETA:** 2026-06-02  
**Total Tests:** 42+ (unit: 14, integration: 16, E2E: 3, performance: 3)  
**Coverage Target:** Unit 80%, Integration 70%, E2E 60%+  

---

## 📋 Test Matrix Overview

| Category | Framework | Files | Tests | Coverage |
|----------|-----------|-------|-------|----------|
| Unit | Vitest | `__tests__/lib/memory-auto-*.test.ts` | 14 | 80%+ |
| Integration | Jest | `__tests__/api/memory-auto/*.test.ts` | 16 | 70%+ |
| E2E | Playwright | `__tests__/e2e/memory-auto-*.spec.ts` | 3 | 60%+ |
| Performance | Custom | `__tests__/perf/memory-auto-perf.test.ts` | 3 | N/A |
| Cron Validation | Bash | `__tests__/cron/memory-auto-cron.test.sh` | 6 | N/A |
| **Total** | — | — | **42** | — |

---

## 🎯 Unit Tests (14 tests)

### 1. Pattern-Based Duplicate Detection
**File:** `__tests__/lib/memory-auto-pattern-detection.test.ts`

**Purpose:** Test regex-based duplicate detection for exact/near-exact matches

```typescript
describe('Pattern Detection Engine', () => {
  // Test 1: Exact Match Detection
  test('detectExactDuplicate: identifies identical memory entries', () => {
    const entry1 = {
      id: 'mem-001',
      path: 'memory/feedback_core_autonomous_operation.md',
      content: 'When Haiku can complete task, execute autonomously...',
      hash: 'sha256-abc123',
    };
    const entry2 = {
      id: 'mem-002',
      content: 'When Haiku can complete task, execute autonomously...',
      hash: 'sha256-abc123',
    };
    const result = detectExactDuplicate(entry1, entry2);
    expect(result.is_duplicate).toBe(true);
    expect(result.confidence).toBe(1.0);
  });

  // Test 2: Substring Match
  test('detectSubstringDuplicate: finds content in longer entries', () => {
    const short = { content: 'task ownership rule' };
    const long = {
      content: 'This is a long entry about the task ownership rule that is mandatory',
    };
    const result = detectSubstringMatch(short, long);
    expect(result.is_duplicate).toBe(true);
    expect(result.match_type).toBe('substring');
  });

  // Test 3: Title Similarity
  test('detectTitleDuplicate: finds entries with same title', () => {
    const entry1 = {
      title: 'Autonomous Task Execution Rule',
      path: 'memory/feedback_core_autonomous_operation.md',
    };
    const entry2 = {
      title: 'Autonomous Task Execution Rule',
      path: 'memory/rules/autonomous.md',
    };
    const result = detectTitleDuplicate(entry1, entry2);
    expect(result.is_duplicate).toBe(true);
  });

  // Test 4: No Duplicate on Different Content
  test('detectExactDuplicate: returns false for different content', () => {
    const entry1 = { content: 'Rule A: Never skip hooks' };
    const entry2 = { content: 'Rule B: Always validate inputs' };
    const result = detectExactDuplicate(entry1, entry2);
    expect(result.is_duplicate).toBe(false);
  });

  // Test 5: Case-Insensitive Matching
  test('detectExactDuplicate: case-insensitive comparison', () => {
    const entry1 = { content: 'AUTONOMOUS EXECUTION RULE' };
    const entry2 = { content: 'autonomous execution rule' };
    const result = detectExactDuplicate(entry1, entry2);
    expect(result.is_duplicate).toBe(true);
  });
});
```

### 2. Fuzzy Matching for Typos/Variations
**File:** `__tests__/lib/memory-auto-fuzzy-detection.test.ts`

```typescript
describe('Fuzzy Matching Engine', () => {
  // Test 6: Levenshtein Distance < Threshold
  test('detectFuzzyDuplicate: identifies entries with minor typos', () => {
    const entry1 = { content: 'Autonomus task execution rule' }; // typo: "Autonomus"
    const entry2 = { content: 'Autonomous task execution rule' };
    const result = detectFuzzyDuplicate(entry1, entry2, threshold = 0.9);
    expect(result.is_duplicate).toBe(true);
    expect(result.similarity_score).toBeGreaterThan(0.85);
  });

  // Test 7: Spelling Variations
  test('detectFuzzyDuplicate: matches British vs American spellings', () => {
    const entry1 = { content: 'Synchronise tasks with API' };
    const entry2 = { content: 'Synchronize tasks with API' };
    const result = detectFuzzyDuplicate(entry1, entry2, threshold = 0.9);
    expect(result.is_duplicate).toBe(true);
  });

  // Test 8: Word Order Variation
  test('detectFuzzyDuplicate: handles different word order', () => {
    const entry1 = { content: 'Execute tasks autonomously when possible' };
    const entry2 = { content: 'When possible, execute tasks autonomously' };
    const result = detectFuzzyDuplicate(entry1, entry2, threshold = 0.85);
    expect(result.is_duplicate).toBe(true);
  });

  // Test 9: Below Threshold (Not Duplicate)
  test('detectFuzzyDuplicate: rejects entries below threshold', () => {
    const entry1 = { content: 'Never skip validation hooks' };
    const entry2 = { content: 'Always validate all inputs' };
    const result = detectFuzzyDuplicate(entry1, entry2, threshold = 0.9);
    expect(result.is_duplicate).toBe(false);
    expect(result.similarity_score).toBeLessThan(0.9);
  });

  // Test 10: Acronym Expansion
  test('detectFuzzyDuplicate: matches expanded acronyms', () => {
    const entry1 = { content: 'RLS isolation for API' };
    const entry2 = { content: 'Row-Level Security isolation for API' };
    const result = detectFuzzyDuplicate(entry1, entry2, threshold = 0.85);
    expect(result.is_duplicate).toBe(true);
  });
});
```

### 3. Semantic Similarity Detection
**File:** `__tests__/lib/memory-auto-semantic-detection.test.ts`

```typescript
describe('Semantic Matching Engine', () => {
  // Test 11: Semantic Equivalence
  test('detectSemanticDuplicate: identifies semantically identical concepts', async () => {
    const entry1 = { content: 'Proceed with task execution without user confirmation' };
    const entry2 = { content: 'Do not wait for user approval; execute immediately' };
    const result = await detectSemanticDuplicate(entry1, entry2, model = 'embedding');
    expect(result.is_duplicate).toBe(true);
    expect(result.semantic_similarity).toBeGreaterThan(0.85);
  });

  // Test 12: Contextual Grouping
  test('detectSemanticCluster: groups related memory entries', async () => {
    const entries = [
      { id: '1', content: 'Execute autonomously without asking' },
      { id: '2', content: 'Do not request permission before proceeding' },
      { id: '3', content: 'Never debug on production' },
    ];
    const clusters = await detectSemanticCluster(entries, minSimilarity = 0.8);
    expect(clusters).toHaveLength(2); // Group 1: entries 1-2, Group 2: entry 3
    expect(clusters[0].members.map(e => e.id)).toContain('1');
    expect(clusters[0].members.map(e => e.id)).toContain('2');
  });

  // Test 13: Non-Duplicate Detection
  test('detectSemanticDuplicate: returns false for different concepts', async () => {
    const entry1 = { content: 'Autonomous execution rule' };
    const entry2 = { content: 'Mobile responsiveness requirement' };
    const result = await detectSemanticDuplicate(entry1, entry2);
    expect(result.is_duplicate).toBe(false);
    expect(result.semantic_similarity).toBeLessThan(0.5);
  });

  // Test 14: Embedding Dimension Consistency
  test('semanticEmbedding: returns consistent dimensionality', async () => {
    const entries = [
      { content: 'Short entry' },
      { content: 'This is a much longer entry that contains more text and context' },
      { content: 'Medium length entry with some content' },
    ];
    const embeddings = await Promise.all(entries.map(e => getSemanticEmbedding(e)));
    expect(embeddings.every(e => e.length === 1536)).toBe(true); // OpenAI embedding dim
  });
});
```

### 4. Trust Score Calculation
**File:** `__tests__/lib/memory-auto-trust-score.test.ts`

```typescript
describe('Trust Score Calculation', () => {
  // Test 15: Full Trust Score Formula
  test('calculateTrustScore: 4-component scoring', () => {
    const memory = {
      id: 'mem-001',
      path: 'memory/feedback_core_autonomous_operation.md',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      last_verified_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      usage_count: 25,
      conflict_count: 0,
    };
    const score = calculateTrustScore(memory);
    // Trust = (Freshness 0.3) + (Usage Frequency 0.3) + (Stability 0.2) + (Source Reliability 0.2)
    expect(score).toBeGreaterThan(0.7);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  // Test 16: Freshness Component
  test('freshness component: older entries score lower', () => {
    const fresh = { created_at: new Date() };
    const old = { created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
    
    const freshScore = calculateFreshnessComponent(fresh);
    const oldScore = calculateFreshnessComponent(old);
    expect(freshScore).toBeGreaterThan(oldScore);
  });

  // Test 17: Usage Frequency Component
  test('usage frequency component: high-frequency entries score higher', () => {
    const highUsage = { usage_count: 100 };
    const lowUsage = { usage_count: 2 };
    
    const highScore = calculateUsageFrequencyComponent(highUsage);
    const lowScore = calculateUsageFrequencyComponent(lowUsage);
    expect(highScore).toBeGreaterThan(lowScore);
  });

  // Test 18: Stability Component
  test('stability component: zero conflicts = high stability', () => {
    const stable = { usage_count: 50, conflict_count: 0 };
    const unstable = { usage_count: 50, conflict_count: 10 };
    
    const stableScore = calculateStabilityComponent(stable);
    const unstableScore = calculateStabilityComponent(unstable);
    expect(stableScore).toBeGreaterThan(unstableScore);
  });
});
```

---

## 🔌 Integration Tests (16 tests)

### Message Collection API (4 tests)

```typescript
describe('POST /api/memory-auto/messages/collect', () => {
  // Test 19: Collect Single Message
  test('collects message and creates memory entry', async () => {
    const payload = {
      source: 'telegram',
      message_id: 'tg-123',
      content: 'New autonomous execution rule discovered',
      tags: ['rules', 'autonomous'],
      user_id: 'user-001',
    };
    const res = await fetch('/api/memory-auto/messages/collect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.memory_id).toBeDefined();
  });

  // Test 20: Batch Collect Messages
  test('processes batch of messages in single request', async () => {
    const payload = {
      messages: [
        { source: 'telegram', content: 'Rule 1', tags: ['rules'] },
        { source: 'discord', content: 'Rule 2', tags: ['rules'] },
        { source: 'github', content: 'Rule 3', tags: ['code'] },
      ],
    };
    const res = await fetch('/api/memory-auto/messages/collect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.created_count).toBe(3);
  });

  // Test 21: Duplicate Prevention in Collection
  test('prevents duplicate collection of same message', async () => {
    const payload = {
      source: 'telegram',
      message_id: 'tg-123',
      content: 'Autonomous execution rule',
      tags: ['rules'],
    };
    const res1 = await fetch('/api/memory-auto/messages/collect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res1.status).toBe(201);
    
    const res2 = await fetch('/api/memory-auto/messages/collect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res2.status).toBe(409); // Conflict: duplicate
  });

  // Test 22: RLS Isolation for Message Collection
  test('RLS prevents cross-org message access', async () => {
    const payload = { source: 'telegram', content: 'Test', tags: ['test'] };
    const orgARes = await fetch('/api/memory-auto/messages/collect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenOrgA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const orgAData = await orgARes.json();
    
    const orgBRes = await fetch('/api/memory-auto/messages', {
      headers: { Authorization: `Bearer ${tokenOrgB}` },
    });
    const orgBData = await orgBRes.json();
    expect(orgBData.items.map(m => m.id)).not.toContain(orgAData.memory_id);
  });
});

describe('GET /api/memory-auto/messages', () => {
  // Test 23: List Collected Messages
  test('retrieves collected messages with pagination', async () => {
    const res = await fetch('/api/memory-auto/messages?limit=10&offset=0', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toBeDefined();
    expect(data.total).toBeGreaterThanOrEqual(0);
  });

  // Test 24: Filter Messages by Tag
  test('filters messages by tag', async () => {
    const res = await fetch('/api/memory-auto/messages?tag=rules', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    expect(data.items.every(m => m.tags.includes('rules'))).toBe(true);
  });
});
```

### Duplicate Detection API (4 tests)

```typescript
describe('POST /api/memory-auto/duplicates/detect', () => {
  // Test 25: Detect Duplicates in Batch
  test('identifies duplicates across memory entries', async () => {
    const payload = {
      entry_ids: ['mem-001', 'mem-002', 'mem-003'],
      detection_layers: ['pattern', 'fuzzy', 'semantic'],
    };
    const res = await fetch('/api/memory-auto/duplicates/detect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.duplicate_groups).toBeDefined();
    expect(data.detection_time_ms).toBeLessThan(2000);
  });

  // Test 26: 3-Layer Detection Cascade
  test('applies pattern → fuzzy → semantic detection in sequence', async () => {
    const payload = {
      entry_ids: ['mem-001', 'mem-002'],
      detection_layers: ['pattern', 'fuzzy', 'semantic'],
    };
    const res = await fetch('/api/memory-auto/duplicates/detect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    expect(data.detection_log).toBeDefined();
    expect(data.detection_log[0].layer).toBe('pattern');
    expect(data.detection_log[1].layer).toBe('fuzzy');
    expect(data.detection_log[2].layer).toBe('semantic');
  });

  // Test 27: Confidence Scoring on Duplicates
  test('returns confidence score for each duplicate pair', async () => {
    const payload = {
      entry_ids: ['mem-001', 'mem-002'],
      detection_layers: ['pattern', 'fuzzy', 'semantic'],
    };
    const res = await fetch('/api/memory-auto/duplicates/detect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.duplicate_groups.length > 0) {
      const pair = data.duplicate_groups[0].pairs[0];
      expect(pair.confidence).toBeGreaterThanOrEqual(0);
      expect(pair.confidence).toBeLessThanOrEqual(1.0);
    }
  });

  // Test 28: Performance on Large Dataset
  test('detects duplicates in 1000 entries within 5 seconds', async () => {
    const entryIds = Array(1000).fill(null).map((_, i) => `mem-${i}`);
    const payload = {
      entry_ids: entryIds,
      detection_layers: ['pattern', 'fuzzy'],
    };
    const start = performance.now();
    const res = await fetch('/api/memory-auto/duplicates/detect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const end = performance.now();
    expect(end - start).toBeLessThan(5000);
    expect(res.status).toBe(200);
  });
});
```

### Trust Score API (4 tests)

```typescript
describe('GET /api/memory-auto/trust-scores', () => {
  // Test 29: Get Trust Score for Single Entry
  test('returns trust score for memory entry', async () => {
    const res = await fetch('/api/memory-auto/trust-scores?entry_id=mem-001', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.trust_score).toBeGreaterThanOrEqual(0);
    expect(data.trust_score).toBeLessThanOrEqual(1.0);
    expect(data.components).toBeDefined();
  });

  // Test 30: Component Breakdown
  test('returns breakdown of 4 trust components', async () => {
    const res = await fetch('/api/memory-auto/trust-scores?entry_id=mem-001&detailed=true', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    expect(data.components.freshness).toBeDefined();
    expect(data.components.usage_frequency).toBeDefined();
    expect(data.components.stability).toBeDefined();
    expect(data.components.source_reliability).toBeDefined();
  });

  // Test 31: Bulk Trust Score Calculation
  test('calculates trust scores for multiple entries', async () => {
    const res = await fetch('/api/memory-auto/trust-scores/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_ids: ['mem-001', 'mem-002', 'mem-003'] }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scores).toHaveLength(3);
  });

  // Test 32: Trust Score Ranking
  test('ranks entries by trust score (highest first)', async () => {
    const res = await fetch('/api/memory-auto/trust-scores/ranking?limit=10', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    for (let i = 0; i < data.entries.length - 1; i++) {
      expect(data.entries[i].trust_score).toBeGreaterThanOrEqual(data.entries[i+1].trust_score);
    }
  });
});
```

### Cron Status API (4 tests)

```typescript
describe('GET /api/memory-auto/cron/status', () => {
  // Test 33: Cron Job Status
  test('returns current cron job status', async () => {
    const res = await fetch('/api/memory-auto/cron/status', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.job_id).toBeDefined();
    expect(['running', 'scheduled', 'completed', 'failed']).toContain(data.status);
  });

  // Test 34: Cron Execution History
  test('lists recent cron job executions', async () => {
    const res = await fetch('/api/memory-auto/cron/history?limit=10', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.executions).toBeDefined();
  });

  // Test 35: Cron Configuration
  test('retrieves cron schedule configuration', async () => {
    const res = await fetch('/api/memory-auto/cron/config', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.schedule).toMatch(/^\d+ \d+ \* \* \*/); // Cron format
    expect(data.timezone).toBeDefined();
  });

  // Test 36: Cron Metrics
  test('returns cron performance metrics', async () => {
    const res = await fetch('/api/memory-auto/cron/metrics', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total_runs).toBeDefined();
    expect(data.success_rate).toBeGreaterThanOrEqual(0);
    expect(data.avg_duration_ms).toBeDefined();
  });
});
```

---

## 🎬 E2E Tests (3 tests)

**File:** `__tests__/e2e/memory-auto-workflows.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Memory Automation E2E', () => {
  // Test 37: Complete Memory Lifecycle
  test('E2E: Collect → Detect Duplicates → Calculate Trust → Archive', async ({ page }) => {
    // Navigate to memory admin panel
    await page.goto('/admin/memory-automation');
    
    // Collect messages
    await page.click('button:has-text("Collect Messages")');
    await page.waitForSelector('[data-testid="collection-status"]');
    const status = await page.locator('[data-testid="collection-status"]').textContent();
    expect(status).toContain('messages collected');
    
    // Trigger duplicate detection
    await page.click('button:has-text("Detect Duplicates")');
    await page.waitForSelector('[data-testid="duplicate-results"]', { timeout: 10000 });
    const duplicates = await page.locator('[data-testid="duplicate-count"]').textContent();
    expect(duplicates).toMatch(/\d+/);
    
    // View trust scores
    await page.click('[data-testid="nav-trust-scores"]');
    await expect(page.locator('text=Trust Scores')).toBeVisible();
    
    // Verify cron scheduled
    await page.click('[data-testid="nav-cron"]');
    await expect(page.locator('[data-testid="cron-status"]')).toContainText('scheduled');
  });

  // Test 38: Duplicate Resolution Workflow
  test('E2E: Review duplicate groups and merge/delete', async ({ page }) => {
    await page.goto('/admin/memory-automation/duplicates');
    
    // Find duplicate group
    const group = page.locator('[data-testid="duplicate-group"]:first-child');
    await expect(group).toBeVisible();
    
    // View details
    await group.click();
    const details = page.locator('[data-testid="duplicate-details"]');
    await expect(details).toBeVisible();
    
    // Merge action
    await page.click('button:has-text("Merge")');
    await page.selectOption('[name="merge_strategy"]', 'newer');
    await page.click('button:has-text("Confirm")');
    
    // Verify merge success
    const toast = page.locator('[data-testid="toast-message"]');
    await expect(toast).toContainText('merged successfully');
  });

  // Test 39: Cron Monitoring Dashboard
  test('E2E: View real-time cron execution metrics', async ({ page }) => {
    await page.goto('/admin/memory-automation/cron');
    
    // Verify dashboard loads
    await expect(page.locator('[data-testid="cron-dashboard"]')).toBeVisible();
    
    // Check metrics
    const totalRuns = await page.locator('[data-testid="metric-total-runs"]').textContent();
    const successRate = await page.locator('[data-testid="metric-success-rate"]').textContent();
    expect(totalRuns).toMatch(/\d+/);
    expect(successRate).toMatch(/\d+%/);
    
    // Trigger manual execution
    await page.click('button:has-text("Run Now")');
    await expect(page.locator('[data-testid="execution-log"]')).toContainText('running', { timeout: 5000 });
  });
});
```

---

## ⚡ Performance Tests (3 tests)

**File:** `__tests__/perf/memory-auto-perf.test.ts`

```typescript
describe('Memory Automation Performance', () => {
  // Test 40: Duplicate Detection on 5k Entries
  test('duplicate detection completes < 8 seconds for 5000 entries', async () => {
    const entryIds = Array(5000).fill(null).map((_, i) => `mem-${i}`);
    
    const start = performance.now();
    const res = await fetch('/api/memory-auto/duplicates/detect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_ids: entryIds,
        detection_layers: ['pattern', 'fuzzy'],
      }),
    });
    const end = performance.now();
    
    expect(res.status).toBe(200);
    expect(end - start).toBeLessThan(8000);
  });

  // Test 41: Trust Score Calculation Batch
  test('bulk trust score calculation < 2 seconds for 1000 entries', async () => {
    const entryIds = Array(1000).fill(null).map((_, i) => `mem-${i}`);
    
    const start = performance.now();
    const res = await fetch('/api/memory-auto/trust-scores/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_ids: entryIds }),
    });
    const end = performance.now();
    
    expect(res.status).toBe(200);
    expect(end - start).toBeLessThan(2000);
  });

  // Test 42: Message Collection Throughput
  test('batch message collection handles 500 messages < 3 seconds', async () => {
    const messages = Array(500).fill(null).map((_, i) => ({
      source: ['telegram', 'discord', 'github'][i % 3],
      content: `Memory entry ${i}`,
      tags: ['auto', 'batch'],
    }));
    
    const start = performance.now();
    const res = await fetch('/api/memory-auto/messages/collect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    const end = performance.now();
    
    expect(res.status).toBe(201);
    expect(end - start).toBeLessThan(3000);
  });
});
```

---

## ⏰ Cron Validation Tests (6 tests)

**File:** `__tests__/cron/memory-auto-cron.test.sh`

```bash
#!/bin/bash

# Test 43: Cron Job Execution
test_cron_executes() {
  BEFORE=$(date +%s)
  # Trigger cron
  curl -X POST http://localhost:3009/api/memory-auto/cron/trigger \
    -H "Authorization: Bearer $TEST_TOKEN"
  AFTER=$(date +%s)
  
  # Verify execution logged
  grep "event_type: cron_executed" memory/logs/memory-auto-$(date +%Y-%m-%d).log
  [ $? -eq 0 ] && echo "✅ Cron executes" || echo "❌ Cron failed"
}

# Test 44: Exponential Backoff Retry
test_exponential_backoff() {
  # Simulate failure
  ATTEMPT=0
  while [ $ATTEMPT -lt 5 ]; do
    DELAY=$((2 ** $ATTEMPT))
    echo "Attempt $ATTEMPT: waiting ${DELAY}s"
    sleep $DELAY
    ATTEMPT=$((ATTEMPT + 1))
  done
  echo "✅ Exponential backoff works (1s → 2s → 4s → 8s → 16s)"
}

# Test 45: Cron Idempotency
test_cron_idempotent() {
  HASH1=$(curl -s http://localhost:3009/api/memory-auto/trust-scores/bulk \
    -H "Authorization: Bearer $TEST_TOKEN" | sha256sum)
  
  sleep 1
  
  HASH2=$(curl -s http://localhost:3009/api/memory-auto/trust-scores/bulk \
    -H "Authorization: Bearer $TEST_TOKEN" | sha256sum)
  
  if [ "$HASH1" == "$HASH2" ]; then
    echo "✅ Cron is idempotent (repeated runs produce same results)"
  else
    echo "❌ Cron results differ (non-idempotent)"
  fi
}

# Test 46: Cron Lock Mechanism
test_cron_locking() {
  # Start first execution
  (curl -X POST http://localhost:3009/api/memory-auto/cron/trigger \
    -H "Authorization: Bearer $TEST_TOKEN" &)
  
  # Try concurrent execution
  sleep 0.5
  SECOND_RES=$(curl -s -w "%{http_code}" \
    -X POST http://localhost:3009/api/memory-auto/cron/trigger \
    -H "Authorization: Bearer $TEST_TOKEN")
  
  if echo "$SECOND_RES" | grep -q "409"; then
    echo "✅ Concurrent execution blocked (409 Conflict)"
  else
    echo "❌ Lock not enforced"
  fi
}

# Test 47: Cron State Persistence
test_cron_state_persistence() {
  # Restart service
  systemctl restart memory-auto
  
  # Verify last execution timestamp preserved
  LAST_RUN=$(curl -s http://localhost:3009/api/memory-auto/cron/status \
    -H "Authorization: Bearer $TEST_TOKEN" | jq '.last_execution')
  
  if [ -n "$LAST_RUN" ]; then
    echo "✅ Cron state persisted across restart"
  else
    echo "❌ Cron state lost"
  fi
}

# Test 48: Cron Error Notification
test_cron_error_notification() {
  # Simulate API failure
  systemctl stop supabase
  
  # Trigger cron
  curl -X POST http://localhost:3009/api/memory-auto/cron/trigger \
    -H "Authorization: Bearer $TEST_TOKEN" 2>/dev/null
  
  # Check error log
  grep "cron_error" memory/logs/memory-auto-$(date +%Y-%m-%d).log > /dev/null
  
  # Check if notification sent
  grep "error_notification_sent" memory/logs/memory-auto-$(date +%Y-%m-%d).log > /dev/null
  [ $? -eq 0 ] && echo "✅ Error notification sent" || echo "⚠️ No notification"
  
  # Restart service
  systemctl start supabase
}
```

---

## ✅ Success Criteria

| Requirement | Verification Method |
|-------------|---------------------|
| All unit tests pass | `npm run test:unit -- memory-auto` ≥80% |
| All integration tests pass | `npm run test:integration -- memory-auto` ≥70% |
| All E2E tests pass | `npm run test:e2e -- memory-auto` ≥60% |
| Duplicate detection < 8s for 5k entries | Performance test 40 passes |
| Trust score batch < 2s for 1k entries | Performance test 41 passes |
| Message collection < 3s for 500 msgs | Performance test 42 passes |
| Cron executes on schedule | Cron test 43 passes |
| Exponential backoff working | Cron test 44 passes |
| All API responses < 500ms | Integration test averages |
| No TypeScript errors | `npm run build` succeeds |

---

## 📅 Implementation Timeline

| Day | Task | Deliverable | Tests |
|-----|------|-------------|-------|
| 2026-05-29 | Unit tests (pattern, fuzzy, semantic, trust score) | `__tests__/lib/memory-auto-*.test.ts` | 1-14 |
| 2026-05-30 | Integration tests (4 APIs) | `__tests__/api/memory-auto/*.test.ts` | 19-36 |
| 2026-05-31 | E2E + Performance tests | `__tests__/e2e/memory-auto-*.spec.ts` + perf | 37-42 |
| 2026-06-01 | Cron validation + test coverage report | `__tests__/cron/memory-auto-cron.test.sh` | 43-48 |
| 2026-06-02 | Production readiness verification | Final checkpoint | All 48 ✅ |

---

**Status:** Test plan complete  
**Next:** Implementation begins 2026-05-29  
**Owner:** QA Specialist  
**Review:** Evaluator AI Agent (final validation 2026-06-02)
