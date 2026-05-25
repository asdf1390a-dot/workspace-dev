---
name: DISCORD-BOT-P1 Rework Brief (Critical Fixes)
description: 3개 긴급 수정 항목 + 평가자 피드백 기반 구현 가이드 (2026-05-25 15:20)
type: project
phase: Phase 1 Rework
deadline: 2026-06-02 (10 days from start)
---

# 🔴 DISCORD-BOT-P1 REWORK BRIEF — 2026-05-25 15:20 KST

**Status:** 🔴 NO-GO (Evaluator Assessment 14:21-16:48)  
**Assignment Date:** 2026-05-25 17:30+ (Post BM-P1 checkpoint)  
**Target Completion:** 2026-06-02 (10 days)  
**Priority:** 🔴 P0 (Critical path blocking Phase 2)

---

## 📋 EVALUATOR FEEDBACK SUMMARY

**Assessment Result:** ❌ Level 2 (Logic) FAILED  
**Assessment Time:** 2026-05-25 14:21 ~ 16:48 (127 minutes)

### Critical Issues Found

| Issue | Category | Severity | Impact |
|-------|----------|----------|--------|
| 5 missing processors | Architecture | 🔴 CRITICAL | System cannot process requests from 5 agent types |
| SSRF/XSS vulnerabilities | Security | 🔴 CRITICAL | Open to injection attacks, unsafe external requests |
| Incomplete Discord gateway | Integration | 🔴 CRITICAL | Cannot handle full Discord event lifecycle |

---

## 🎯 REWORK SCOPE (3 Major Items)

### 1️⃣ 【ITEM-A】 Missing Processors (5 types)

**Current State:** Only Telegram processor implemented  
**Required:** 5 additional agent processors

#### A1: Secretary Processor
- **Purpose:** Handle secretary message routing + task coordination
- **Scope:** 
  - Receive messages from Telegram #일반채널
  - Route to appropriate Discord channels
  - Log task assignments in CTB
- **Files:**
  - Create: `processors/SecretaryProcessor.js`
  - Update: `handlers/messageDispatcher.js` (add routing rule)
- **Integration Points:**
  - Discord #일반채널 (1503332702085189673)
  - Task state machine (INCOMPLETE_TASKS_REGISTRY.md)
- **Expected Output:** Message routing logs + Discord embeds (task status, checkpoints)

#### A2: Translator Processor
- **Purpose:** Handle multi-language message processing
- **Scope:**
  - Detect language (Korean/English/Tamil)
  - Route through translation service
  - Format for native speaker audience
- **Files:**
  - Create: `processors/TranslatorProcessor.js`
  - Update: `handlers/messageDispatcher.js`
- **Integration Points:**
  - Translator AI Agent (team member)
  - Telegram message queue
  - Discord message formatting

#### A3: Data-Analyst Processor
- **Purpose:** Process data analytics requests + KPI extraction
- **Scope:**
  - Parse data analysis requests from Telegram
  - Query Supabase (assets, BM events, KPIs)
  - Format charts/tables for Discord
- **Files:**
  - Create: `processors/AnalystProcessor.js`
  - Update: `handlers/messageDispatcher.js`
  - API: `pages/api/discord/analytics.js` (data endpoints)
- **Integration Points:**
  - Supabase (DSC FMS tables)
  - Discord rich embeds (charts, tables)

#### A4: Developer Processor
- **Purpose:** Handle development-related messages (GitHub, deployments, status)
- **Scope:**
  - GitHub webhook integration
  - Build/deployment status
  - Code review notifications
- **Files:**
  - Create: `processors/DeveloperProcessor.js`
  - Update: `handlers/messageDispatcher.js`
  - Webhook: `pages/api/webhooks/github.js`
- **Integration Points:**
  - GitHub API
  - Vercel API (deployment status)
  - Discord #dev-log channel

#### A5: Planner Processor
- **Purpose:** Handle planning + design review messages
- **Scope:**
  - Design document status updates
  - Meeting invitations
  - Phase planning notifications
- **Files:**
  - Create: `processors/PlannerProcessor.js`
  - Update: `handlers/messageDispatcher.js`
- **Integration Points:**
  - Active work tracking (CTB)
  - Meeting calendar
  - Design doc storage (GitHub/Drive)

**Subtask Checklist:**
- [ ] A1: SecretaryProcessor implemented + tested
- [ ] A2: TranslatorProcessor implemented + tested
- [ ] A3: AnalystProcessor implemented + tested
- [ ] A4: DeveloperProcessor implemented + tested
- [ ] A5: PlannerProcessor implemented + tested
- [ ] Message dispatcher router updated (route all 5 types)
- [ ] Integration test: Each processor handles sample message correctly
- [ ] Discord test: Messages route to correct channels (visible on Discord)

---

### 2️⃣ 【ITEM-B】 Security Vulnerabilities (SSRF + XSS)

**Current State:** No input validation, no HTML sanitization, no fetch timeout  
**Required:** Full security hardening

#### B1: SSRF Prevention (URL Validation)
- **Scope:** Prevent Server-Side Request Forgery attacks
- **Files:**
  - Create: `utils/urlValidator.js`
  - Update: `handlers/messageProcessor.js` (validate all URLs)
  - Update: `pages/api/discord/webhook.js` (validate URLs in webhooks)
- **Implementation:**
  - Whitelist allowed domains (supabase.com, vercel.com, github.com, discord.com)
  - Block private IP ranges (127.0.0.1, 10.*.*.*, 172.16.*.*, 192.168.*.*)
  - Validate URL format (RFC 3986)
  - Reject file:// and gopher:// schemes
- **Test Cases:**
  - ✅ Allow: https://supabase.com/api/v1/...
  - ❌ Block: http://127.0.0.1:5432/
  - ❌ Block: http://192.168.1.1/
  - ❌ Block: file:///etc/passwd

#### B2: XSS Prevention (HTML Sanitization)
- **Scope:** Prevent Cross-Site Scripting attacks
- **Files:**
  - Create: `utils/htmlSanitizer.js`
  - Update: `handlers/discordEmbedBuilder.js` (sanitize embed descriptions)
  - Update: `pages/api/discord/webhook.js` (sanitize webhook payloads)
- **Implementation:**
  - Use DOMPurify or similar library
  - Remove script tags, event handlers, unsafe attributes
  - Allow safe tags: `<b>, <i>, <u>, <code>, <pre>, <a>`
  - Escape special characters: `<, >, &, ", '`
- **Test Cases:**
  - ✅ Allow: `<b>Bold text</b>`
  - ❌ Block: `<script>alert('XSS')</script>`
  - ❌ Block: `<img src=x onerror="alert('XSS')">`
  - ❌ Block: `<div onclick="malicious()">Click me</div>`

#### B3: Fetch Timeout + Resource Limits
- **Scope:** Prevent slow/large external requests from hanging bot
- **Files:**
  - Create: `utils/fetchWithTimeout.js`
  - Update: `handlers/externalApiClient.js` (use timeout wrapper)
  - Update: `pages/api/discord/webhook.js` (enforce timeout)
- **Implementation:**
  - Add 5-second timeout to all external requests
  - Limit response body size (max 10MB)
  - Add retry logic with exponential backoff (max 3 retries)
  - Log timeout/size violation errors
- **Test Cases:**
  - ✅ Complete within 5 seconds (normal request)
  - ❌ Timeout after 5 seconds (slow external API)
  - ❌ Reject responses > 10MB (large file)

**Subtask Checklist:**
- [ ] B1: URL validator implemented (whitelist/private IP check)
- [ ] B1: SSRF tests passing (4 test cases above)
- [ ] B2: HTML sanitizer implemented (DOMPurify or equivalent)
- [ ] B2: XSS tests passing (4 test cases above)
- [ ] B3: Fetch timeout wrapper created (5s timeout)
- [ ] B3: Timeout + size limit tests passing
- [ ] Security audit: All external requests use validator/sanitizer
- [ ] Deployment: Security fixes review + approval before prod

---

### 3️⃣ 【ITEM-C】 Discord Gateway Completion (Types 0-5)

**Current State:** Only types 0-1 implemented (READY, RESUMED)  
**Required:** Full lifecycle (types 0-5: READY, RESUMED, RECONNECT, INVALID_SESSION, HELLO, HEARTBEAT)

#### C1: Type 0 - READY (Already Implemented)
- ✅ No changes needed
- Status: COMPLETE

#### C2: Type 1 - RESUMED (Already Implemented)
- ✅ No changes needed
- Status: COMPLETE

#### C3: Type 2 - RECONNECT
- **Scope:** Handle Discord reconnection signals
- **Files:**
  - Update: `handlers/gatewayMessageHandler.js` (add type 2 case)
  - Update: `classes/DiscordGateway.js` (reconnect logic)
- **Implementation:**
  - Receive: `{ op: 7, d: null }`
  - Action: Close existing connection + reconnect immediately
  - Log: Reconnect event + timestamp
  - Expected: New READY/RESUMED sequence
- **Test:** Simulate disconnect → receive opcode 7 → verify reconnection

#### C4: Type 3 - INVALID_SESSION
- **Scope:** Handle invalid session tokens
- **Files:**
  - Update: `handlers/gatewayMessageHandler.js` (add type 3 case)
  - Update: `classes/DiscordGateway.js` (session recovery)
- **Implementation:**
  - Receive: `{ op: 9, d: false }` (resumable=false) or `{ op: 9, d: true }` (can resume)
  - If resumable=true: Attempt resume with stored session_id + seq
  - If resumable=false: Start fresh IDENTIFY handshake
  - Log: Invalid session event + recovery attempt
- **Test:** Send invalid token → verify session recovery attempt

#### C5: Type 4 - HELLO
- **Scope:** Handle gateway hello (heartbeat interval setup)
- **Files:**
  - Update: `handlers/gatewayMessageHandler.js` (add type 4 case)
  - Update: `classes/DiscordGateway.js` (heartbeat setup)
- **Implementation:**
  - Receive: `{ op: 10, d: { heartbeat_interval: 45000 } }`
  - Action: Store heartbeat interval, start sending heartbeats at 45s interval
  - First heartbeat: Send immediately with sequence number
  - Log: HELLO received + heartbeat interval configured
- **Test:** Receive HELLO → verify heartbeat sent at correct interval

#### C6: Type 5 - HEARTBEAT_ACK
- **Scope:** Handle heartbeat acknowledgments
- **Files:**
  - Update: `handlers/gatewayMessageHandler.js` (add type 5 case)
  - Update: `classes/DiscordGateway.js` (heartbeat tracking)
- **Implementation:**
  - Receive: `{ op: 11 }`
  - Action: Record ACK timestamp, calculate latency
  - If no ACK for 2 consecutive heartbeats: Trigger reconnection
  - Log: Heartbeat ACK + latency
- **Test:** Send heartbeat → verify ACK received + latency calculated

**Subtask Checklist:**
- [ ] C3: RECONNECT (type 2) handler implemented
- [ ] C4: INVALID_SESSION (type 3) handler implemented + recovery logic
- [ ] C5: HELLO (type 4) handler + heartbeat initialization
- [ ] C6: HEARTBEAT_ACK (type 5) handler + latency tracking
- [ ] Gateway integration test: Send all 5 opcode types → verify correct handling
- [ ] Discord live test: Connect bot to Discord → verify heartbeat + reconnect behavior
- [ ] Latency monitoring: Confirm heartbeat latency tracking working

---

## 📊 Implementation Timeline (10 days, 2026-05-25 → 2026-06-02)

### Day 1-2 (2026-05-25 evening → 2026-05-26)
- **Item A:** Build 5 processors
  - Morning: A1 Secretary + A2 Translator (4h)
  - Afternoon: A3 Analyst + A4 Developer + A5 Planner (6h)
  - Evening: Test + integrate message dispatcher (2h)
- **Est. Completion:** 2026-05-26 22:00

### Day 3-4 (2026-05-27 → 2026-05-28)
- **Item B:** Security hardening
  - Morning: B1 URL validator (3h)
  - Afternoon: B2 HTML sanitizer (3h)
  - Evening: B3 Fetch timeout (2h)
  - Night: Security tests + audit (3h)
- **Est. Completion:** 2026-05-28 23:00

### Day 5-6 (2026-05-29 → 2026-05-30)
- **Item C:** Discord gateway completion
  - Morning: C3 RECONNECT + C4 INVALID_SESSION (4h)
  - Afternoon: C5 HELLO + C6 HEARTBEAT_ACK (4h)
  - Evening: Gateway integration tests (2h)
- **Est. Completion:** 2026-05-30 22:00

### Day 7-10 (2026-05-31 → 2026-06-02)
- **Final Phase:** Integration + evaluation
  - Day 7: End-to-end testing (8h)
  - Day 8: Discord bot live test + fixes (8h)
  - Day 9: Evaluator review + corrections (6h)
  - Day 10: Final polish + deployment prep (4h)
- **Final Completion:** 2026-06-02 17:00

---

## 🔗 Reference Files

### Design Documents
- `project_discord_bot_system.md` — Full architecture + API spec
- `project_discord_bot_phase1.md` — Phase 1 original design (Telegram ↔ Discord sync)

### Implementation Reference
- Telegram Processor: `processors/TelegramProcessor.js` (use as template)
- Gateway Handler: `handlers/gatewayMessageHandler.js` (extend for types 2-5)
- Message Dispatcher: `handlers/messageDispatcher.js` (add 5 routes)

### Testing
- Postman collection: `__tests__/discord-bot-api.postman_collection.json`
- Integration tests: `__tests__/discordBot.integration.test.js`

### Deployment
- Vercel env vars: `.env.local` (DISCORD_TOKEN, DISCORD_WEBHOOK_URL)
- Production URL: TBD (After Vercel deployment)

---

## ✅ Completion Criteria

### A. Processors (5/5 required)
- [ ] All 5 processors route messages to Discord (#일반, #dev-log, #analytics, etc.)
- [ ] Each processor logs execution + Discord message sent
- [ ] Integration test: 5 sample messages → 5 Discord messages received

### B. Security (3/3 required)
- [ ] SSRF blocker: 4/4 test cases pass (whitelist + private IP check)
- [ ] XSS sanitizer: 4/4 test cases pass (no script/onclick/onerror)
- [ ] Fetch timeout: All external requests <5s + retry logic working

### C. Gateway (5/5 required)
- [ ] Types 0-5 all handled (handlers + test coverage 100%)
- [ ] Heartbeat: ACK received + latency <100ms under normal conditions
- [ ] Reconnect: Triggered on missed ACKs + recovery successful

### D. Evaluator Review (Pass/Fail)
- [ ] Level 1 (Design): All 3 items meet spec → PASS
- [ ] Level 2 (Logic): No bugs in processor/security/gateway logic → PASS
- [ ] Level 3 (Security): SSRF/XSS/timeout all working → PASS
- [ ] Level 4 (UX): Discord messages formatted correctly, readable → PASS

---

## 📌 Priority Order

1. **CRITICAL (Do First):** Item B (Security) — must be done before any other integration
2. **HIGH (Do Next):** Item A (Processors) — enables message routing
3. **MEDIUM (Do Last):** Item C (Gateway) — improves reliability but doesn't block functionality

---

**Generated:** 2026-05-25 15:20 KST  
**For:** Web-Builder AI Agent (assignment post-17:30 checkpoint)  
**Status:** Ready for execution after BM-P1 checkpoint confirmation
