# Memory Automation Phase 2: Implementation Checklist
**작성일:** 2026-05-27  
**목적:** Phase 2A-F 구현을 위한 실행 체크리스트  
**상태:** Ready for Implementation

---

## 📌 Pre-Implementation Setup

### Design Review & Approval
- [ ] CEO reviews MEMORY_AUTOMATION_PHASE2_SUMMARY.md
- [ ] CEO approves trust score thresholds (60% auto-accept target)
- [ ] CEO confirms cron timing (5-minute interval)
- [ ] API endpoint URLs finalized with DevOps
- [ ] Test environment prepared

### Dependencies & Resources
- [ ] Telegram Bot API credentials available
- [ ] Discord API token configured
- [ ] Claude Embeddings API access (Layer 3)
- [ ] Git repository write access
- [ ] OpenClaw cron registration access
- [ ] Logging directory created (/home/jeepney/.claude/logs/memory_automation)

### Test Data Preparation
- [ ] 100+ historical Telegram/Discord messages extracted
- [ ] Ground truth duplicates marked (for false positive testing)
- [ ] Expected vs. actual scores calculated for 50 messages
- [ ] Test cases for all 3 duplicate detection layers

---

## 🔨 Phase 2A: Message Collection API (2026-05-28)

### Telegram Integration
- [ ] Implement Telegram message fetching function
  - [ ] Connect to Telegram Bot API
  - [ ] Query messages from past 1 hour
  - [ ] Extract text, timestamp, user_id, message_id
  - [ ] Handle thread context (3+ message chains)
  - [ ] Test with 100 historical messages

- [ ] Keyword extraction for candidates
  - [ ] Implement keyword matching: 결정됨, 완료, 설계 완성, etc.
  - [ ] Add NLP classifier (optional, Layer 2)
  - [ ] Test coverage: >90% recall on known memories

### Discord Integration
- [ ] Implement Discord message fetching function
  - [ ] Connect to Discord API
  - [ ] Query all monitored channels (#회의, #일반, #기술)
  - [ ] Extract message_id, timestamp, content, channel
  - [ ] Handle 3+ reply threads
  - [ ] Test with 100 historical messages

- [ ] Channel-specific keyword tuning
  - [ ] #회의 (Meetings): 결정, 승인, 완료
  - [ ] #기술 (Technical): API, 스펙, 구현
  - [ ] #일반 (General): Lower confidence threshold

### API Endpoint Implementation
- [ ] POST /api/memory/messages
  - [ ] Query parameters: source, hours_lookback, include_threads
  - [ ] Response: message array with metadata
  - [ ] Error handling: API timeouts, rate limits
  - [ ] Performance: <1 second for 100 messages

### Testing Phase 2A
- [ ] Unit tests: 10+ test cases per source
- [ ] Integration test: Both sources together
- [ ] Load test: 1000 messages processed
- [ ] Error handling: Test API failures, timeouts
- [ ] Coverage: >95%

**Exit Criteria:**
- [ ] Both Telegram and Discord fetchers working
- [ ] 100+ historical messages successfully extracted
- [ ] All unit tests passing
- [ ] Performance: <1 second per run

---

## 🔍 Phase 2B: Duplicate Detection (2026-05-29)

### Layer 1: Pattern Matching
- [ ] Implement exact title matching
  - [ ] Title normalization (lowercase, remove special chars)
  - [ ] Compare against UNIFIED/_INDEX.md (87 items)
  - [ ] Test: 100% precision on identical titles

- [ ] File path collision detection
  - [ ] Generate proposed filename
  - [ ] Check against existing files
  - [ ] Prevent overwrites

- [ ] Category keyword collision
  - [ ] Extract keywords from title
  - [ ] Calculate Jaccard similarity
  - [ ] Threshold: 70% overlap
  - [ ] Test: False positive <5%

### Layer 2: Fuzzy String Matching
- [ ] Implement Jaro-Winkler similarity
  - [ ] Pseudocode → Python implementation
  - [ ] Test against known string pairs
  - [ ] Verify threshold: 0.90 → DUPLICATE

- [ ] Apply fuzzy matching to all 87 items
  - [ ] Performance: <150ms for all items
  - [ ] Accuracy: >90% on test set

### Layer 3: Semantic Similarity
- [ ] Integrate Claude Embeddings API
  - [ ] Get embedding for candidate content
  - [ ] Get embeddings for recent 30 items
  - [ ] Calculate cosine similarity
  - [ ] Threshold: 0.85 → DUPLICATE

- [ ] Implement embedding cache
  - [ ] Cache file: /tmp/embedding_cache.json
  - [ ] Cache expiry: 7 days
  - [ ] Hit rate target: >90% after 2nd run

### Decision Logic
- [ ] Implement three-layer flow
  - [ ] Layer 1 → Layer 2 → Layer 3 fallthrough
  - [ ] Return (is_duplicate, confidence, reason)
  - [ ] Handle edge cases

### Testing Phase 2B
- [ ] Unit tests: 50+ test cases
  - [ ] 10 exact matches
  - [ ] 15 fuzzy matches
  - [ ] 15 semantic edge cases
  - [ ] 10 non-duplicates

- [ ] False positive rate: <5%
- [ ] False negative rate: <3%
- [ ] Performance: Layer 3 <3 seconds (first run), <200ms (cached)

**Exit Criteria:**
- [ ] All 3 layers implemented & tested
- [ ] False positive/negative rates acceptable
- [ ] Cache system working
- [ ] Ready for integration

---

## 📊 Phase 2C: Trust Score Calculator (2026-05-30)

### Component 1: Source Credibility
- [ ] Implement source classification
  - [ ] Telegram sources: CEO direct (90), thread (80), channel (70)
  - [ ] Discord sources: #공지 (90), #회의 (85), #기술 (75), #일반 (65)

- [ ] Apply adjustments (+/- 20 points max)
  - [ ] +10: Has URL
  - [ ] +10: Decision keyword
  - [ ] +5: Code block
  - [ ] -10: Low clarity
  - [ ] -5: Old (>30 days)

- [ ] Test: 20+ examples with expected scores

### Component 2: Context Depth
- [ ] Implement context element scoring
  - [ ] +15: Full sentence (>30 chars)
  - [ ] +20: Action items (할일/완료)
  - [ ] +15: 2+ links
  - [ ] +15: Date reference
  - [ ] +10: Team mentions
  - [ ] +15: Technical detail
  - [ ] +10: Prior decision reference
  - [ ] +5: 3+ thread replies

- [ ] Cap at 100 points
- [ ] Test: 15+ examples

### Component 3: Verification Status
- [ ] Implement verification level detection
  - [ ] VERIFIED (100): Working link + 2+ sources + evidence + approval
  - [ ] PARTIALLY_VERIFIED (50): Link or 1 source + partial evidence
  - [ ] UNVERIFIED (0): No evidence

- [ ] Implement verification signals
  - [ ] Signal: Working URL
  - [ ] Signal: Match existing memory
  - [ ] Signal: Completion marker (✅/완료/DONE)
  - [ ] Signal: Authority approval (CEO/Manager)
  - [ ] Signal: Explicit timestamp

- [ ] Map signals to levels (3+ → VERIFIED, 1-2 → PARTIAL, 0 → UNVERIFIED)

### Component 4: Recency
- [ ] Implement age-based decay
  - [ ] 0 days: 100
  - [ ] 1-3 days: 90
  - [ ] 4-7 days: 80
  - [ ] 8-14 days: 70
  - [ ] 15-30 days: 50
  - [ ] 31-60 days: 30
  - [ ] 61+ days: 10

### Master Formula
- [ ] Implement weighted calculation
  - [ ] 0.40 × source_credibility
  - [ ] 0.25 × context_depth
  - [ ] 0.20 × verification_status
  - [ ] 0.15 × recency_freshness

- [ ] Round to nearest integer
- [ ] Return (score, breakdown)

### Testing Phase 2C
- [ ] Unit tests: 30+ calculation examples
  - [ ] High trust (95+): CEO message + full context + verified
  - [ ] Medium trust (75): Discord #회의 + partial context
  - [ ] Low trust (45): Vague channel message + no evidence
  - [ ] Rejection (<40): Unverified hearsay

- [ ] Threshold validation
  - [ ] ≥60: Auto-accept (77% of Phase 1 items)
  - [ ] 40-59: Quarantine (14% of Phase 1 items)
  - [ ] <40: Auto-reject (9% of Phase 1 items)

**Exit Criteria:**
- [ ] All 4 components implemented & tested
- [ ] Master formula verified
- [ ] Examples match expected behavior
- [ ] Threshold distribution acceptable

---

## ✅ Phase 2D: Cron Integration (2026-05-31)

### Cron Script Assembly
- [ ] Create /home/jeepney/.claude/cron/memory_automation_phase2.sh
  - [ ] Copy template from MEMORY_AUTOMATION_PHASE2_DESIGN.md
  - [ ] Implement all 8 functions:
    - [ ] acquire_lock() — Prevent concurrent runs
    - [ ] fetch_messages() — Get Telegram/Discord messages
    - [ ] extract_candidates() — Filter by keywords
    - [ ] check_duplicates() — Call Layer 1-3
    - [ ] calculate_trust_score() — Call all 4 components
    - [ ] validate_entry() — Run 10-point checklist
    - [ ] auto_update_memory() — Create .md + update MEMORY.md
    - [ ] log_update() — Record to audit logs

### Checklist Validation
- [ ] Implement 10-point validation
  1. [ ] Not a duplicate
  2. [ ] Contains actionable info
  3. [ ] Valid category
  4. [ ] Has source message ID
  5. [ ] Trust score ≥ 60
  6. [ ] Title ≤ 100 chars
  7. [ ] Content ≤ 2000 chars
  8. [ ] Valid markdown
  9. [ ] No PII detected
  10. [ ] Related items valid

### MEMORY.md Update Logic
- [ ] Create markdown file in memory/ directory
  - [ ] Filename: {category}_{slugified_title}.md
  - [ ] Content: Title + timestamp + trust score + source + content
  - [ ] Metadata: auto-collected marker

- [ ] Update MEMORY.md index
  - [ ] Add link to new file
  - [ ] Include trust score + source + date

- [ ] Git commit
  - [ ] Atomic commit with message
  - [ ] Commit format: "auto: Add [title] (신뢰도 XX)"

### Logging System
- [ ] Implement MEMORY_AUTO_UPDATE_LOG.md
  - [ ] Format: [timestamp] ✅/❌/🟡 ACTION: title (score, source)
  - [ ] Append-only, never delete

- [ ] Implement QUARANTINE_LOG.md
  - [ ] Rejected entries: ❌ REJECTED
  - [ ] Unclear entries: 🟡 QUARANTINE (need manual review)
  - [ ] Reason documented

### OpenClaw Cron Registration
- [ ] Register cron job with mcp__openclaw__cron
  - [ ] Schedule: */5 * * * * (every 5 minutes)
  - [ ] Timeout: 120 seconds
  - [ ] Retry: 2 attempts
  - [ ] Delivery: Telegram/Discord notification on completion

### Testing Phase 2D
- [ ] Unit test: Test each function independently
- [ ] Integration test: Full pipeline with mock messages
- [ ] Error handling test: Simulate API failures
- [ ] Lock test: Concurrent execution (should queue)
- [ ] Commit test: Git commits working + atomic

**Exit Criteria:**
- [ ] Script executable & no syntax errors
- [ ] All 8 functions working
- [ ] 10-point checklist implemented
- [ ] MEMORY.md updates working
- [ ] Logging accurate
- [ ] Ready for live testing

---

## 🧪 Phase 2E: Testing & Tuning (2026-06-01)

### Live Testing Setup
- [ ] Enable cron job (starts running every 5 minutes)
- [ ] Monitor logs: /home/jeepney/.claude/logs/memory_automation/cron.log
- [ ] Check MEMORY_AUTO_UPDATE_LOG.md every hour
- [ ] Review QUARANTINE_LOG.md (should be <10% of total)

### Threshold Tuning
- [ ] After 24 hours of data, analyze:
  - [ ] Actual false positive rate (target: <5%)
  - [ ] Actual false negative rate (target: <3%)
  - [ ] Trust score distribution (target: 77% auto-accept)
  - [ ] Duplicate detection accuracy

- [ ] If false positives > 5%:
  - [ ] Increase Layer 2 fuzzy threshold from 0.90 to 0.92
  - [ ] Increase Layer 3 semantic threshold from 0.85 to 0.87
  - [ ] Review quarantine cases

- [ ] If false negatives > 3%:
  - [ ] Decrease thresholds by 0.02
  - [ ] Check if keywords missing common patterns

### Performance Tuning
- [ ] Measure actual execution time per run
  - [ ] Target: <2 seconds (with cache)
  - [ ] If >2s: Profile which component is slow
  - [ ] Consider caching improvements

- [ ] Monitor API quota usage
  - [ ] Telegram: Should be <100 calls/day
  - [ ] Discord: Should be <100 calls/day
  - [ ] Embeddings: Should be <50 new embeddings/day (rest cached)

### Data Quality Validation
- [ ] Manual review of accepted items
  - [ ] Sample 20 items marked auto-accepted
  - [ ] Verify they're actual memory items (not spam/noise)

- [ ] Manual review of quarantined items
  - [ ] Sample 20 items in QUARANTINE_LOG
  - [ ] Decide: Approve/Reject each
  - [ ] Identify patterns in rejections

### Documentation
- [ ] Create PHASE2_TUNING_REPORT.md
  - [ ] Actual metrics vs. targets
  - [ ] Threshold adjustments made
  - [ ] Performance analysis
  - [ ] Recommendations for production

**Exit Criteria:**
- [ ] System running stable for 24 hours
- [ ] False positive/negative rates acceptable
- [ ] Performance meets targets
- [ ] Data quality validated
- [ ] Ready for production deployment

---

## 🚀 Phase 2F: Production Deployment (2026-06-02)

### Final Validation
- [ ] CEO approves tuning report
- [ ] All metrics within acceptable ranges
- [ ] No critical bugs found

### Production Configuration
- [ ] Enable cron job on production server
- [ ] Configure alert channels
  - [ ] Success notification: Send to Telegram #일반
  - [ ] Failure notification: Send to CEO direct message
  - [ ] Quarantine summary: Daily report

- [ ] Set up monitoring dashboard
  - [ ] Daily acceptance rate
  - [ ] Weekly quarantine rate
  - [ ] Monthly accuracy trends

### Go-Live Steps
- [ ] 1. Enable cron job (2026-06-02 09:00 KST)
- [ ] 2. Monitor first hour (should see 10-15 cycles)
- [ ] 3. Verify first auto-updates in MEMORY.md
- [ ] 4. Check MEMORY_AUTO_UPDATE_LOG.md for errors
- [ ] 5. Manual review first 10 quarantined items
- [ ] 6. If all clear, declare success

### 7-Day Monitoring
- [ ] Daily:
  - [ ] Check cron execution (should run 288 times/day)
  - [ ] Review acceptance rate
  - [ ] Spot-check random entries

- [ ] Weekly:
  - [ ] Calculate accuracy metrics
  - [ ] Review quarantine patterns
  - [ ] Discuss with CEO

**Exit Criteria:**
- [ ] System running production for 7 days
- [ ] Zero critical errors
- [ ] Metrics stable
- [ ] Phase 2 successfully deployed

---

## 📋 Daily Standup Template (2026-05-28 to 2026-06-02)

```
Phase 2 Progress Report [DATE]

✅ Completed Today:
- [Function/Component completed]
- [Tests passed]
- [Integration verified]

🟡 In Progress:
- [Current component]
- [Blocker/Issue]: [description]

🔴 Blockers:
- [If any]
- [Resolution plan]

📊 Metrics:
- Functions implemented: X/8
- Tests passing: Y/Z
- Performance: [timing]

Next: [Tomorrow's focus]
```

---

## 🎯 Success Criteria Summary

### Phase 2 Overall
- [ ] All 6 phases completed (2A-F)
- [ ] System running in production
- [ ] 7-day monitoring shows stability
- [ ] Metrics meet targets:
  - [ ] False positive rate: <5%
  - [ ] False negative rate: <3%
  - [ ] Cron reliability: 99.9%
  - [ ] MEMORY.md latency: <10 min

### Knowledge Transfer
- [ ] Implementation docs created
- [ ] New team member can run system
- [ ] Troubleshooting guide available
- [ ] 24/7 monitoring configured

---

## 📞 Support & Escalation

### Issues During Implementation

1. **API Rate Limiting (Telegram/Discord)**
   - Add exponential backoff: 1s → 2s → 4s
   - Queue messages for retry

2. **Embedding API Failures**
   - Fall back to Layer 2 (Fuzzy matching)
   - Log error, don't crash

3. **Git Commit Conflicts**
   - Rebase strategy: Pull latest before commit
   - If conflict, manual resolution + alert CEO

4. **High Quarantine Rate (>20%)**
   - Review checklist — may be too strict
   - Lower minimum trust score threshold

5. **Low Auto-Accept Rate (<70%)**
   - Review source credibility scores
   - May need Telegram/Discord tuning

---

## ✨ Completion Certificate

```
╔════════════════════════════════════════════════════════════╗
║  Memory Automation Phase 2: Implementation Complete        ║
║  ✅ All 6 phases (2A-F) successfully deployed              ║
║  ✅ System running in production                           ║
║  ✅ Metrics meeting all targets                            ║
║  ✅ 7-day stability confirmed                              ║
╚════════════════════════════════════════════════════════════╝
```

---

**Document Created:** 2026-05-27  
**Target Completion:** 2026-06-02  
**Owner:** Memory Automation System

