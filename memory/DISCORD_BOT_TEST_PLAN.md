---
name: Discord Bot Phase 1 Test Plan
description: Test strategy for Telegram↔Discord bidirectional message synchronization with processor integrations
type: project
date: 2026-05-28
---

# Discord Bot Phase 1 Test Plan — Telegram↔Discord Bidirectional Sync

**Status:** 📋 Design in progress  
**Scope:** 5 message processors + sync validation + RLS isolation  
**Target Coverage:** Unit ≥80%, Integration ≥70%, E2E ≥60%  
**Implementation Timeline:** 2026-05-29 through 2026-06-02  

---

## 📊 Test Coverage Overview

| Category | Count | Target | Frameworks |
|----------|-------|--------|-----------|
| Unit Tests | 18 | 80%+ | Vitest |
| Integration Tests | 20 | 70%+ | Jest + Supertest |
| E2E Tests | 6 | 60%+ | Playwright |
| Performance Tests | 4 | Baseline | Artillery/K6 |
| **Total** | **48** | — | — |

---

## 🧪 Unit Tests (18 tests)

### Message Processor Unit Tests (15 tests)

**File:** `__tests__/lib/processors.test.ts`

#### Processor: Text Message Processor
```typescript
// Test 1: Extract plain text preserving formatting
test('textProcessor: extracts plain text with line breaks preserved', () => {
  const input = {
    type: 'text',
    text: 'Line 1\nLine 2\nLine 3',
    metadata: { platform: 'telegram' }
  };
  const result = textProcessor(input);
  expect(result.content).toBe('Line 1\nLine 2\nLine 3');
  expect(result.format).toBe('plain');
  expect(result.validation_status).toBe('valid');
});

// Test 2: Handle Unicode emojis and special characters
test('textProcessor: handles Unicode emojis and special chars', () => {
  const input = {
    type: 'text',
    text: 'Hello 👋 @user [link](https://example.com)',
    metadata: { platform: 'telegram' }
  };
  const result = textProcessor(input);
  expect(result.content).toMatch(/👋/);
  expect(result.validation_status).toBe('valid');
});

// Test 3: Reject empty messages
test('textProcessor: rejects empty text', () => {
  const input = { type: 'text', text: '', metadata: { platform: 'telegram' } };
  const result = textProcessor(input);
  expect(result.validation_status).toBe('invalid');
  expect(result.error_code).toBe('EMPTY_MESSAGE');
});

// Test 4: Enforce max length 2000 chars (Discord limit)
test('textProcessor: truncates text exceeding 2000 chars', () => {
  const input = {
    type: 'text',
    text: 'a'.repeat(2500),
    metadata: { platform: 'telegram' }
  };
  const result = textProcessor(input);
  expect(result.content.length).toBe(2000);
  expect(result.truncated).toBe(true);
  expect(result.original_length).toBe(2500);
});

// Test 5: Normalize line endings (CRLF → LF)
test('textProcessor: normalizes CRLF to LF', () => {
  const input = {
    type: 'text',
    text: 'Line 1\r\nLine 2\r\nLine 3',
    metadata: { platform: 'telegram' }
  };
  const result = textProcessor(input);
  expect(result.content).toBe('Line 1\nLine 2\nLine 3');
});
```

#### Processor: Markdown Link Processor
```typescript
// Test 6: Extract Telegram markdown links to Discord format
test('markdownLinkProcessor: converts Telegram [text](url) to Discord format', () => {
  const input = {
    type: 'markdown',
    text: 'Click [here](https://example.com) for more',
    metadata: { platform: 'telegram' }
  };
  const result = markdownLinkProcessor(input);
  expect(result.content).toContain('[here](https://example.com)');
  expect(result.processed_links).toBe(1);
});

// Test 7: Validate URLs in links (reject invalid URLs)
test('markdownLinkProcessor: rejects invalid URLs', () => {
  const input = {
    type: 'markdown',
    text: 'Click [here](invalid-url) for info',
    metadata: { platform: 'telegram' }
  };
  const result = markdownLinkProcessor(input);
  expect(result.validation_status).toBe('warning');
  expect(result.invalid_urls).toEqual(['invalid-url']);
});

// Test 8: Handle nested links (pick outermost)
test('markdownLinkProcessor: handles nested link syntax', () => {
  const input = {
    type: 'markdown',
    text: '[outer [inner](https://inner.com)](https://outer.com)',
    metadata: { platform: 'telegram' }
  };
  const result = markdownLinkProcessor(input);
  expect(result.processed_links).toBeGreaterThan(0);
  expect(result.validation_status).toBe('valid');
});

// Test 9: Preserve non-link markdown formatting (bold, italic)
test('markdownLinkProcessor: preserves non-link markdown', () => {
  const input = {
    type: 'markdown',
    text: '**bold** and *italic* with [link](https://example.com)',
    metadata: { platform: 'telegram' }
  };
  const result = markdownLinkProcessor(input);
  expect(result.content).toContain('**bold**');
  expect(result.content).toContain('*italic*');
  expect(result.processed_links).toBe(1);
});

// Test 10: Handle URL encoding (preserve %XX sequences)
test('markdownLinkProcessor: preserves URL encoding', () => {
  const input = {
    type: 'markdown',
    text: '[search](%s=hello&world)',
    metadata: { platform: 'telegram' }
  };
  const result = markdownLinkProcessor(input);
  expect(result.content).toMatch(/%s=hello&world/);
});
```

#### Processor: Image/Media Processor
```typescript
// Test 11: Extract image URLs and generate Discord embeds
test('mediaProcessor: converts image URL to Discord embed', () => {
  const input = {
    type: 'image',
    url: 'https://example.com/image.png',
    caption: 'Example image',
    metadata: { platform: 'telegram', file_size: 1024000 }
  };
  const result = mediaProcessor(input);
  expect(result.embed.image.url).toBe('https://example.com/image.png');
  expect(result.embed.description).toBe('Example image');
  expect(result.validation_status).toBe('valid');
});

// Test 12: Validate image file size (max 8MB for Discord embeds)
test('mediaProcessor: rejects oversized images', () => {
  const input = {
    type: 'image',
    url: 'https://example.com/large.png',
    metadata: { platform: 'telegram', file_size: 10485760 } // 10MB
  };
  const result = mediaProcessor(input);
  expect(result.validation_status).toBe('invalid');
  expect(result.error_code).toBe('FILE_TOO_LARGE');
});

// Test 13: Verify supported MIME types (png, jpg, gif, webp)
test('mediaProcessor: accepts supported image types', () => {
  const types = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  types.forEach(mimeType => {
    const input = {
      type: 'image',
      url: 'https://example.com/image.ext',
      metadata: { platform: 'telegram', mime_type: mimeType }
    };
    const result = mediaProcessor(input);
    expect(result.validation_status).toBe('valid');
  });
});

// Test 14: Handle missing URL (fallback to text caption only)
test('mediaProcessor: handles missing URL gracefully', () => {
  const input = {
    type: 'image',
    url: null,
    caption: 'Image not available',
    metadata: { platform: 'telegram' }
  };
  const result = mediaProcessor(input);
  expect(result.embed).toBeUndefined();
  expect(result.text_fallback).toBe('Image not available');
});

// Test 15: Deduplicate consecutive identical images
test('mediaProcessor: detects duplicate consecutive images', () => {
  const input1 = { type: 'image', url: 'https://example.com/a.png', metadata: {} };
  const input2 = { type: 'image', url: 'https://example.com/a.png', metadata: {} };
  const results = [input1, input2].map(i => mediaProcessor(i));
  expect(results[1].is_duplicate_of_previous).toBe(true);
});
```

#### RLS Isolation Tests (3 tests)
```typescript
// Test 16: Verify processor execution respects org_id isolation
test('processors: RLS - reject cross-org message processing', async () => {
  const msg_org_a = {
    id: 'msg-123',
    content: 'Test',
    org_id: 'org-a',
    metadata: { platform: 'telegram' }
  };
  // Try to process with org_b context
  const result = await textProcessor(msg_org_a, { org_id: 'org-b' });
  expect(result.validation_status).toBe('invalid');
  expect(result.error_code).toBe('ORG_MISMATCH');
});

// Test 17: Verify processor logging includes org_id audit trail
test('processors: audit log includes org_id for compliance', () => {
  const input = { type: 'text', text: 'Hello', metadata: { platform: 'telegram' } };
  const result = textProcessor(input, { org_id: 'org-123' });
  expect(result.audit_log.org_id).toBe('org-123');
  expect(result.audit_log.processor_name).toBe('textProcessor');
});

// Test 18: Verify no processor leaks metadata from other orgs
test('processors: metadata sanitization prevents cross-org data leakage', () => {
  const input = {
    type: 'text',
    text: 'Message',
    metadata: { platform: 'telegram', org_id: 'org-123', secret: 'should-not-appear' }
  };
  const result = textProcessor(input);
  expect(result.metadata.secret).toBeUndefined();
  expect(Object.keys(result.metadata)).toEqual(['platform']);
});
```

---

## 🔗 Integration Tests (20 tests)

### Telegram→Discord Sync API Tests (10 tests)

**File:** `__tests__/api/discord-bot/sync.test.ts`

```typescript
// Test 1: POST /api/discord-bot/sync/telegram-to-discord
test('sync endpoint: accepts telegram message batch', async () => {
  const payload = {
    messages: [
      {
        platform: 'telegram',
        text: 'Hello Discord',
        user_id: 'tg-user-123',
        timestamp: '2026-05-28T10:00:00Z'
      }
    ],
    target_channel_id: 'discord-ch-456'
  };
  const res = await request(app).post('/api/discord-bot/sync/telegram-to-discord')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.status).toBe(200);
  expect(res.body.sync_id).toBeDefined();
  expect(res.body.processed_count).toBe(1);
});

// Test 2: RLS isolation - prevent cross-org sync
test('sync endpoint: RLS - reject cross-org channel sync', async () => {
  const payload = {
    messages: [{ platform: 'telegram', text: 'Test', user_id: 'tg-123' }],
    target_channel_id: 'discord-ch-org-b' // belongs to org-b
  };
  const res = await request(app).post('/api/discord-bot/sync/telegram-to-discord')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.status).toBe(403);
  expect(res.body.error).toMatch(/not authorized/i);
});

// Test 3: Batch processing with multiple messages
test('sync endpoint: processes message batch atomically', async () => {
  const payload = {
    messages: [
      { platform: 'telegram', text: 'Msg 1', user_id: 'tg-1' },
      { platform: 'telegram', text: 'Msg 2', user_id: 'tg-2' },
      { platform: 'telegram', text: 'Msg 3', user_id: 'tg-3' }
    ],
    target_channel_id: 'discord-ch-456'
  };
  const res = await request(app).post('/api/discord-bot/sync/telegram-to-discord')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.status).toBe(200);
  expect(res.body.processed_count).toBe(3);
  expect(res.body.failed_count).toBe(0);
});

// Test 4: Handle partial failures gracefully
test('sync endpoint: continues on individual message errors', async () => {
  const payload = {
    messages: [
      { platform: 'telegram', text: 'Valid', user_id: 'tg-1' },
      { platform: 'telegram', text: '', user_id: 'tg-2' }, // empty - invalid
      { platform: 'telegram', text: 'Valid2', user_id: 'tg-3' }
    ],
    target_channel_id: 'discord-ch-456'
  };
  const res = await request(app).post('/api/discord-bot/sync/telegram-to-discord')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.status).toBe(200);
  expect(res.body.processed_count).toBe(2);
  expect(res.body.failed_count).toBe(1);
  expect(res.body.errors[0].error_code).toBe('EMPTY_MESSAGE');
});

// Test 5: Filter duplicate messages within batch (hash-based)
test('sync endpoint: deduplicates messages in batch', async () => {
  const payload = {
    messages: [
      { platform: 'telegram', text: 'Duplicate', user_id: 'tg-1', timestamp: '2026-05-28T10:00:00Z' },
      { platform: 'telegram', text: 'Duplicate', user_id: 'tg-1', timestamp: '2026-05-28T10:00:05Z' }
    ],
    target_channel_id: 'discord-ch-456'
  };
  const res = await request(app).post('/api/discord-bot/sync/telegram-to-discord')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.body.processed_count).toBe(1);
  expect(res.body.deduplicated_count).toBe(1);
});

// Test 6: GET /api/discord-bot/sync/status/{sync_id}
test('sync endpoint: retrieve sync status and details', async () => {
  // First, create sync
  const createRes = await request(app).post('/api/discord-bot/sync/telegram-to-discord')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send({ messages: [{ platform: 'telegram', text: 'Test', user_id: 'tg-1' }], target_channel_id: 'ch-456' });
  
  const sync_id = createRes.body.sync_id;
  
  // Then check status
  const statusRes = await request(app).get(`/api/discord-bot/sync/status/${sync_id}`)
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(statusRes.status).toBe(200);
  expect(statusRes.body.sync_id).toBe(sync_id);
  expect(statusRes.body.status).toMatch(/completed|pending|failed/);
});

// Test 7: Pagination on sync history
test('sync endpoint: list sync history with pagination', async () => {
  const res = await request(app).get('/api/discord-bot/sync/history?page=1&limit=10')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  expect(res.status).toBe(200);
  expect(res.body.syncs).toBeInstanceOf(Array);
  expect(res.body.total_count).toBeDefined();
  expect(res.body.page).toBe(1);
});

// Test 8: Filtering sync history by date range
test('sync endpoint: filter history by date range', async () => {
  const res = await request(app).get(
    '/api/discord-bot/sync/history?start_date=2026-05-28&end_date=2026-05-29'
  ).set('Authorization', `Bearer ${tokenOrgA}`);
  expect(res.status).toBe(200);
  expect(res.body.syncs.every(s => new Date(s.created_at) >= new Date('2026-05-28'))).toBe(true);
});

// Test 9: Error handling - missing required fields
test('sync endpoint: validates required fields in request', async () => {
  const payload = { messages: [] }; // missing target_channel_id
  const res = await request(app).post('/api/discord-bot/sync/telegram-to-discord')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/target_channel_id/i);
});

// Test 10: Authorization - invalid token
test('sync endpoint: rejects invalid JWT token', async () => {
  const res = await request(app).post('/api/discord-bot/sync/telegram-to-discord')
    .set('Authorization', 'Bearer invalid-token')
    .send({ messages: [{ platform: 'telegram', text: 'Test', user_id: 'tg-1' }], target_channel_id: 'ch-456' });
  expect(res.status).toBe(401);
});
```

### Discord→Telegram Sync API Tests (5 tests)

```typescript
// Test 11: POST /api/discord-bot/sync/discord-to-telegram
test('discord-to-telegram sync: accepts Discord message', async () => {
  const payload = {
    messages: [
      {
        platform: 'discord',
        content: 'Hello Telegram',
        author_id: 'discord-user-123',
        channel_id: 'discord-ch-456'
      }
    ],
    target_telegram_chat_id: '12345'
  };
  const res = await request(app).post('/api/discord-bot/sync/discord-to-telegram')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.status).toBe(200);
  expect(res.body.processed_count).toBe(1);
});

// Test 12: RLS isolation - prevent unauthorized Telegram chat access
test('discord-to-telegram sync: RLS - reject unauthorized chat access', async () => {
  const payload = {
    messages: [{ platform: 'discord', content: 'Test', author_id: 'du-123', channel_id: 'ch-456' }],
    target_telegram_chat_id: 'org-b-chat-id'
  };
  const res = await request(app).post('/api/discord-bot/sync/discord-to-telegram')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.status).toBe(403);
});

// Test 13: Batch Discord messages with deduplication
test('discord-to-telegram sync: batch process with dedup', async () => {
  const payload = {
    messages: [
      { platform: 'discord', content: 'Msg', author_id: 'du-1', channel_id: 'ch-1' },
      { platform: 'discord', content: 'Msg', author_id: 'du-1', channel_id: 'ch-1' },
      { platform: 'discord', content: 'Msg2', author_id: 'du-2', channel_id: 'ch-1' }
    ],
    target_telegram_chat_id: '12345'
  };
  const res = await request(app).post('/api/discord-bot/sync/discord-to-telegram')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.body.processed_count).toBe(2);
  expect(res.body.deduplicated_count).toBe(1);
});

// Test 14: Error handling - invalid Telegram chat ID
test('discord-to-telegram sync: validates Telegram chat ID format', async () => {
  const payload = {
    messages: [{ platform: 'discord', content: 'Test', author_id: 'du-1', channel_id: 'ch-1' }],
    target_telegram_chat_id: 'invalid-chat-id'
  };
  const res = await request(app).post('/api/discord-bot/sync/discord-to-telegram')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/chat.*id/i);
});

// Test 15: Retrieve Discord-to-Telegram sync status
test('discord-to-telegram sync: retrieve status by sync_id', async () => {
  const createRes = await request(app).post('/api/discord-bot/sync/discord-to-telegram')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send({
      messages: [{ platform: 'discord', content: 'Test', author_id: 'du-1', channel_id: 'ch-1' }],
      target_telegram_chat_id: '12345'
    });
  
  const sync_id = createRes.body.sync_id;
  const statusRes = await request(app).get(`/api/discord-bot/sync/status/${sync_id}`)
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(statusRes.status).toBe(200);
  expect(statusRes.body.sync_id).toBe(sync_id);
});
```

### Sync State & Metrics API Tests (5 tests)

```typescript
// Test 16: GET /api/discord-bot/metrics/sync-stats
test('metrics endpoint: returns sync statistics', async () => {
  const res = await request(app).get('/api/discord-bot/metrics/sync-stats?period=day')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('total_syncs');
  expect(res.body).toHaveProperty('successful_syncs');
  expect(res.body).toHaveProperty('failed_syncs');
  expect(res.body).toHaveProperty('average_sync_time_ms');
});

// Test 17: Processor execution metrics
test('metrics endpoint: tracks processor performance', async () => {
  const res = await request(app).get('/api/discord-bot/metrics/processor-stats')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  expect(res.status).toBe(200);
  expect(res.body.textProcessor).toBeDefined();
  expect(res.body.textProcessor).toHaveProperty('execution_count');
  expect(res.body.textProcessor).toHaveProperty('average_duration_ms');
});

// Test 18: Error rate tracking
test('metrics endpoint: error rate by processor', async () => {
  const res = await request(app).get('/api/discord-bot/metrics/error-rates')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  expect(res.status).toBe(200);
  expect(res.body.textProcessor.error_rate).toBeLessThanOrEqual(1.0);
  expect(res.body.markdownLinkProcessor.error_rate).toBeLessThanOrEqual(1.0);
});

// Test 19: Audit log completeness
test('metrics endpoint: audit log integrity check', async () => {
  const res = await request(app).get('/api/discord-bot/audit/log-integrity')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  expect(res.status).toBe(200);
  expect(res.body.total_entries).toBeGreaterThan(0);
  expect(res.body.missing_entries).toBe(0);
  expect(res.body.integrity_score).toBeGreaterThanOrEqual(0.99);
});

// Test 20: Cost/quota tracking
test('metrics endpoint: org quota usage tracking', async () => {
  const res = await request(app).get('/api/discord-bot/metrics/quota-usage')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  expect(res.status).toBe(200);
  expect(res.body.messages_synced_today).toBeDefined();
  expect(res.body.quota_limit).toBeDefined();
  expect(res.body.quota_remaining).toBeLessThanOrEqual(res.body.quota_limit);
});
```

---

## 🎯 E2E Tests (6 tests)

**File:** `__tests__/e2e/discord-bot-sync.spec.ts`

### End-to-End Workflow Tests

```typescript
import { test, expect, Page } from '@playwright/test';

// Test 1: Complete Telegram→Discord workflow
test('E2E: send Telegram message, verify Discord delivery', async ({ page, context }) => {
  const telegramPage = await context.newPage();
  const discordPage = page;
  
  // 1. Send message in Telegram UI
  await telegramPage.goto('https://app.dsc-fms.vercel.app/telegram-inbox');
  await telegramPage.fill('textarea[name="message"]', 'Test message for Discord');
  await telegramPage.click('button:has-text("Send")');
  
  // 2. Verify sync status
  await page.goto('https://app.dsc-fms.vercel.app/discord-bot/sync-status');
  const syncBadge = await page.locator('[data-testid="latest-sync-status"]').textContent();
  expect(syncBadge).toContain('completed');
  
  // 3. Verify message appears in Discord webhook response
  const discordMessages = await page.locator('[data-testid="discord-messages-list"] li').count();
  expect(discordMessages).toBeGreaterThan(0);
});

// Test 2: Complete Discord→Telegram workflow
test('E2E: send Discord message, verify Telegram delivery', async ({ page, context }) => {
  const discordPage = page;
  const telegramPage = await context.newPage();
  
  // 1. Simulate Discord webhook (normally from Discord server)
  await page.goto('https://app.dsc-fms.vercel.app/discord-bot/dashboard');
  await page.fill('input[name="discord-webhook-test"]', 'Test Discord message');
  await page.click('button:has-text("Test Webhook")');
  
  // 2. Verify sync processing
  await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 5000 });
  
  // 3. Check Telegram sync status
  await telegramPage.goto('https://app.dsc-fms.vercel.app/telegram-inbox?sync_status=completed');
  const telegramMsgs = await telegramPage.locator('[data-testid="message-item"]').count();
  expect(telegramMsgs).toBeGreaterThan(0);
});

// Test 3: Processor error recovery (text truncation)
test('E2E: long message truncation and retry', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/discord-bot/test-sync');
  
  // Send message that will be truncated (>2000 chars)
  const longText = 'a'.repeat(2500);
  await page.fill('textarea[name="test-message"]', longText);
  await page.click('button:has-text("Test Sync")');
  
  // Verify truncation warning
  const warning = await page.locator('[data-testid="truncation-warning"]');
  await expect(warning).toBeVisible();
  expect(await warning.textContent()).toMatch(/truncated/i);
  
  // Verify message still sent (just truncated)
  const syncStatus = await page.locator('[data-testid="sync-status"]').textContent();
  expect(syncStatus).toContain('completed');
});

// Test 4: Mobile responsiveness (44px tap targets)
test('E2E: mobile UI - tap targets >= 44px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto('https://app.dsc-fms.vercel.app/discord-bot/sync-controls');
  
  const sendButton = await page.locator('button:has-text("Send Sync")');
  const box = await sendButton.boundingBox();
  
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

// Test 5: Audit log verification after sync
test('E2E: audit trail completeness', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/discord-bot/audit-logs');
  
  // Perform a sync
  await page.click('button:has-text("Test Sync")');
  await page.waitForTimeout(2000);
  
  // Verify audit log entries
  const logs = await page.locator('[data-testid="audit-log-entry"]');
  const count = await logs.count();
  expect(count).toBeGreaterThan(0);
  
  // Verify sequence: sync_submitted → processor_executed → delivery_confirmed
  const entries = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    const text = await logs.nth(i).textContent();
    entries.push(text);
  }
  expect(entries).toContain(expect.stringMatching(/processor.*executed/i));
});

// Test 6: Concurrent sync handling (no race conditions)
test('E2E: concurrent syncs maintain order', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/discord-bot/stress-test');
  
  // Trigger 5 concurrent syncs
  await page.click('button:has-text("Send 5 Concurrent Syncs")');
  await page.waitForSelector('[data-testid="all-syncs-complete"]', { timeout: 15000 });
  
  // Verify all completed without interference
  const syncResults = await page.locator('[data-testid="sync-result"]');
  const count = await syncResults.count();
  expect(count).toBe(5);
  
  const completed = await syncResults.locator('text=completed').count();
  expect(completed).toBe(5);
});
```

---

## ⚡ Performance Tests (4 tests)

**File:** `__tests__/performance/discord-bot.perf.ts`

```typescript
// Test 1: Message batch processing (100 messages)
test('perf: process 100 messages < 500ms', async () => {
  const messages = Array.from({ length: 100 }, (_, i) => ({
    platform: 'telegram',
    text: `Message ${i}`,
    user_id: `user-${i}`
  }));
  
  const start = performance.now();
  const result = await syncProcessor.processBatch(messages, { org_id: 'org-test' });
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(500);
  expect(result.processed_count).toBe(100);
});

// Test 2: Deduplication on large batch (1000 messages, 50% dupes)
test('perf: deduplicate 1000 messages < 800ms', async () => {
  const base = Array.from({ length: 500 }, (_, i) => ({
    platform: 'telegram',
    text: `Message ${i % 50}`, // 50 unique texts, each repeated
    user_id: `user-${i % 50}`
  }));
  
  const start = performance.now();
  const result = await deduplicator.processBatch(base, { org_id: 'org-test' });
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(800);
  expect(result.deduplicated_count).toBeGreaterThan(0);
});

// Test 3: Sync status retrieval for user with 10k syncs
test('perf: query 10k sync records < 300ms', async () => {
  const start = performance.now();
  const syncs = await db.query(
    'SELECT * FROM discord_bot_syncs WHERE org_id = $1 LIMIT 10000',
    ['org-test']
  );
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(300);
  expect(syncs.rows.length).toBe(10000);
});

// Test 4: Audit log query with complex filters
test('perf: filtered audit log query < 250ms', async () => {
  const start = performance.now();
  const logs = await db.query(
    `SELECT * FROM discord_audit_logs 
     WHERE org_id = $1 AND processor = $2 AND created_at > $3 
     ORDER BY created_at DESC LIMIT 1000`,
    ['org-test', 'textProcessor', new Date(Date.now() - 86400000)]
  );
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(250);
  expect(logs.rows.length).toBeGreaterThan(0);
});
```

---

## ✅ Success Criteria

| Item | Target | Status |
|------|--------|--------|
| Unit test coverage | 80%+ | ⏳ |
| Integration test coverage | 70%+ | ⏳ |
| E2E test coverage | 60%+ | ⏳ |
| Processor execution < 500ms | 100% | ⏳ |
| Batch sync < 800ms | 100% | ⏳ |
| Audit log query < 300ms | 100% | ⏳ |
| All tests passing | 100% | ⏳ |

---

## 📅 Implementation Timeline

| Date | Task | Deliverable |
|------|------|-------------|
| 2026-05-29 | Unit tests for all 5 processors | 18 tests written + passing |
| 2026-05-30 | Integration tests for sync APIs | 20 tests written + passing |
| 2026-05-31 | E2E tests + performance baseline | 10 tests written + baseline recorded |
| 2026-06-01 | Performance optimization + final testing | All perf tests < target |
| 2026-06-02 | Coverage report + deployment validation | Coverage report, go/no-go |

---

**Design Status:** ✅ Complete  
**Next Step:** Unit test implementation (2026-05-29)

