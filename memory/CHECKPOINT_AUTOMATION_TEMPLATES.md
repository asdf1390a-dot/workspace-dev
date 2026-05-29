---
name: Checkpoint Automation Templates
description: Ready-to-use templates for 4-checkpoint daily standup system
type: operational
version: 1.0
date: 2026-05-30
---

# 4-Checkpoint Automation Templates

## Template 1: 08:00 KST Morning Standup

**Automation Trigger:** Cron job at 06:50 KST (Preparation), Execute at 08:00 KST (Live)

**Pre-standup Preparation (06:50 KST):**
```markdown
## 📋 Pre-Standup Checklist — [DATE]

Items to collect by 08:00:
□ Project Leads notified (Discord #morning-standup)
□ CTB opened for real-time updates
□ Blocker tracking sheet visible
□ Team availability status form ready

Standup Starts: 08:00 KST ⏰
Duration: 5 minutes max ⏱️
```

**Standup Template (08:00 KST, 5 minutes):**

```markdown
# 📅 MORNING STANDUP — [YYYY-MM-DD] 08:00 KST

**Led by:** Secretary (C-3PO)  
**Present:** [List present team leads]  
**Time:** 08:00-08:05 KST

---

## 1️⃣ Yesterday's Accomplishments (1 min)

### ASSET Master
- ✅ P2-API complete (2026-05-27)
- 🟡 P2-UI Day 2 started (2/13 days)

### Team Dashboard
- ✅ API Phase 2B 4/5 days complete
- ✅ db/36 migration complete

### Backup Management
- 🟡 API 31% complete (5/16 endpoints)
- ⏳ UI blocked on API ≥70%

### Other Projects
- ✅ Discord Bot deployed
- ✅ BM Phase 1 complete
- ✅ Travel Management complete
- 🟡 Memory Automation Phase 2D complete

---

## 2️⃣ Today's Plan (1.5 min)

| Project | Task | ETA |
|---------|------|-----|
| ASSET-P2-UI | Day 3-4 development | 18:00 |
| TEAM-DASHBOARD-P2-API | Phase 2B finalization | 18:00 |
| BACKUP-P2-API | Endpoints 6-8 | 18:00 |
| Memory Automation | Phase 2E testing | 18:00 |

---

## 3️⃣ New Blockers (1 min)

### Current Blockers: [NUMBER]

**Blocker #1:** [If any]
- Project: [X]
- Issue: [Description]
- Owner: [Name]
- Status: 🔴 Escalation in progress / 🟡 Investigating / ✅ Resolved

**Resolution:** None (clean standup) / [Blocker details]

---

## 4️⃣ Team Availability (0.5 min)

**Who's busy (80%+ allocated):**
- Web-Builder #1: ASSET-P2-UI (100%)
- Evaluator #1: Testing (80%)

**Who has slack (available for overflow):**
- Data-Analyst #1: 60% available
- Web-Builder #2: 60% available
- Evaluator #2: 50% available

**Recommendation:** No rebalancing needed today

---

## 5️⃣ Critical Path Status (0.5 min)

**Overall Progress:** On track / Behind by X hours

- 🟡 TEAM-DASHBOARD-P2-UI Design: 0% (starts today)
- 🔴 ASSET-P2-UI: Critical path item, 15% complete (on schedule)
- 🔴 BACKUP-P2-API: Blocking BACKUP-P2-UI, 31% complete (on schedule)

**Next Critical Milestone:** 2026-05-28 18:00 (TEAM-DASHBOARD-P2-API Phase 2B completion)

---

## Action Items for Today

```
□ CTB updated at 08:00 ✅
□ Blockers escalated (if any)
□ Resource rebalancing decided (if needed)
□ Project leads ready to execute plan
□ Critical path on track
```

**Standup Completed:** [YES/NO] ✅  
**Attendees:** [List]  
**Duration:** [Minutes]

---

## Automated Follow-up (After Standup)

Action: Update `active_work_tracking.md` with 08:00 section entry:
```markdown
| 2026-[DATE] | 08:00 ✅ | [Minutes taken] min | [KEY_OUTCOME] |
```

Send to CEO via Discord: "✅ Morning standup complete — [KEY_OUTCOME]"
```

---

## Template 2: 14:00 KST Mid-Day Sync

**Automation Trigger:** Cron job at 13:55 KST (Preparation), Execute at 14:00 KST

**Sync Template (14:00 KST, 10 minutes):**

```markdown
# 📊 MID-DAY SYNC — [YYYY-MM-DD] 14:00 KST

**Led by:** Data-Analyst #1  
**Attendees:** Web-Builder, Evaluator, Data-Analyst  
**Time:** 14:00-14:10 KST

---

## 1️⃣ Morning Progress vs Plan (3 min)

| Project | Plan | Actual | Status | Variance |
|---------|------|--------|--------|----------|
| ASSET-P2-UI | 25% | 30% | 🟢 Ahead | +5% |
| TEAM-DASHBOARD-P2-API | 20% | 20% | 🟢 On track | 0% |
| BACKUP-P2-API | 15% | 12% | 🟡 Behind | -3% |

**Overall:** [On track / Behind X%]

---

## 2️⃣ Root Cause Analysis (3 min)

**Projects Behind Schedule:**
- BACKUP-P2-API: Endpoint 6 took longer than expected (design clarification needed)
  - Mitigations: Parallelize endpoints 7-8 with design feedback

**Projects Ahead of Schedule:**
- ASSET-P2-UI: UI components reused from other projects
  - Benefit: Can allocate freed time to other projects

---

## 3️⃣ Resource Rebalancing (2 min)

**Current Allocation:**
```
Web-Builder #1: 100% (ASSET-P2-UI)
→ Recommendation: Maintain current allocation
→ Slack: 0% (at capacity)

Data-Analyst #1: 40% (Architecture review)
→ Recommendation: Can absorb more work
→ Slack: 60% available
→ Option: Add HARNESS backend spec work
```

**Action:** [No change / Rebalance resources as noted]

---

## 4️⃣ ETA Adjustments (2 min)

**Projects with ETA Changes:**
- [Project A]: ETA changed from 2026-06-10 to 2026-06-12 (+2 days)
  - Reason: [Description]
  - CEO notification: [Sent / Pending]

**No ETA changes for other projects**

---

## 5️⃣ New Blockers & Escalations (0-2 min)

**New Blockers:** None / [Listed]

**Escalations Needed:** None / [For CEO review]

---

## Automated Follow-up

Update CTB with 14:00 entry:
```markdown
| 2026-[DATE] | 14:00 ✅ | [Minutes taken] | [PROGRESS_SUMMARY] |
```

Notify Secretary: "14:00 Sync complete — Progress: [OVERALL_STATUS]"

---

## Template 3: 15:00 KST Asset Master Daily Report

**Automation Trigger:** Cron at 14:55 KST, Execute at 15:00 KST

**Report Template (15:00 KST, 5 minutes):**

```markdown
# 📈 ASSET MASTER DAILY REPORT — [YYYY-MM-DD] 15:00 KST

**Reported by:** Web-Builder #1 (+ Data-Analyst #1 data)  
**Timestamp:** 15:00 KST

---

## 1️⃣ Endpoint Completion Status

**Goal:** 16 endpoints across Phase 2 APIs

| # | Endpoint | Status | Completeness | Test Pass |
|---|----------|--------|--------------|-----------|
| 1 | GET /api/assets | ✅ | 100% | ✅ 9/9 |
| 2 | GET /api/assets/:id | ✅ | 100% | ✅ 9/9 |
| 3 | POST /api/assets | ✅ | 100% | ✅ 7/7 |
| ... | ... | ... | ... | ... |

**Overall:** X/16 complete (XX%)

---

## 2️⃣ Test Results

**Total Tests:** [Total]  
**Passing:** [X]  
**Failing:** [Y]  
**Pass Rate:** [%]

**Failures (if any):**
- Test: [Name]
- Error: [Description]
- Fix ETA: [Time]

---

## 3️⃣ New Blockers (Asset Master Only)

**Blockers:** None / [Listed]
- [Blocker name]: [Description] — ETA resolution: [Time]

---

## 4️⃣ Next 24 Hours

**Tomorrow's planned work:**
- Endpoints: [X-Y]
- Bug fixes: [X]
- Integration testing: [Features]
- ETA completion: [Time]

---

## Summary

```
✅ API Progress: X/16 (XX%)
✅ Test Pass Rate: XX%
✅ Blockers: [None / Number]
✅ On Schedule: [Yes / No]
```

Reported by: [Name] at 15:00 KST
```

---

## Template 4: 18:00 KST Evening Checkpoint

**Automation Trigger:** Cron at 17:50 KST, Execute at 18:00 KST

**Report Template (18:00 KST, 10 minutes):**

```markdown
# 🌅 EVENING CHECKPOINT — [YYYY-MM-DD] 18:00 KST

**Led by:** Secretary (C-3PO)  
**Timestamp:** 18:00 KST

---

## 1️⃣ Daily Completion Rate

**Target Completion:** XX%  
**Actual Completion:** XX%  
**Variance:** [±X%]  
**Status:** 🟢 On track / 🟡 Behind / 🔴 Critical

**Breakdown by Project:**

| Project | Target | Actual | Status |
|---------|--------|--------|--------|
| ASSET-P2-UI | 25% | 30% | 🟢 +5% |
| TEAM-DASHBOARD | 20% | 20% | 🟢 0% |
| BACKUP-P2 | 15% | 12% | 🟡 -3% |

---

## 2️⃣ Today's Completions

✅ **Completed Today:**
- [Project A]: [Milestone] — Completed at [Time]
- [Project B]: [Milestone] — Completed at [Time]

---

## 3️⃣ Work in Progress

🟡 **Still In Progress (Due tomorrow):**
- [Project A]: [Task] — ETA [Time tomorrow]
- [Project B]: [Task] — ETA [Time tomorrow]

---

## 4️⃣ Tomorrow's Plan (Preview)

📅 **Tomorrow's Priorities:**
1. [Project X]: [High-priority task]
2. [Project Y]: [Medium task]
3. [Project Z]: [Low task]

**Expected Completion Rate:** XX%

---

## 5️⃣ Rule Compliance Audit

**Autonomous Operation Rule:**
- ✅ All decisions made without user blocking
- ✅ No "waiting for CEO approval" delays
- Status: COMPLIANT

**Task Ownership Rule:**
- ✅ All tasks have clear owner
- ✅ No ownership ambiguity
- Status: COMPLIANT

**Schedule Adherence:**
- 🟢 Zero 1-minute+ delays
- 🟡 X blocker escalations today (all resolved <30 min)
- Status: [COMPLIANT / VIOLATIONS: X]

---

## 6️⃣ New Team Member Onboarding Status

**Phase A Onboarding (4 members, 5/26-6/2):**
- [Member 1]: Day X/7, [Status]
- [Member 2]: Day X/7, [Status]
- [Member 3]: Day X/7, [Status]
- [Member 4]: Day X/7, [Status]

**Overall:** X/4 complete

**Phase C Onboarding (5 members, 5/27-6/10):**
- [Member 1]: Day X/X, [Status]
- ... [Others]

---

## 7️⃣ Summary & CEO Brief

**Today's Key Metrics:**

```
✅ Completion Rate: XX% (Target: XX%)
✅ Team Utilization: XX% (Target: 93.3%)
✅ Blocking Items: X (Avg resolution time: XX min)
✅ Critical Path: [On track / Behind X days]
✅ Rule Violations: X (Target: 0)
```

**What Went Well:**
- [Achievement 1]
- [Achievement 2]

**Challenges:**
- [Challenge 1]
- [Challenge 2]

**Tomorrow's Focus:**
- [Focus 1 — Why critical]
- [Focus 2 — Why critical]

---

## Automated Follow-up

**Update CTB with 18:00 entry:**
```markdown
| 2026-[DATE] | 18:00 ✅ | [COMPLETION_RATE]% | [KEY_INSIGHT] |
```

**Send to CEO (Telegram/Discord):**
```
🌅 Evening Checkpoint Complete

Completion: XX% (Target: XX%)
Status: [GREEN/YELLOW/RED]
Critical Alert: [None / Details]

Next milestone: [DATE, TIME, DELIVERABLE]
```

**Update MEMORY.md:**
- Checkpoint #[X] recorded
- State transitions noted (if any)
- Key learnings captured (if any)

---

```

---

## Meta-Automation: Cron Schedule

**Daily Cron Jobs (All KST):**

```bash
# 06:50 KST — Prep morning standup
00 06 * * * /scripts/checkpoint-prep.sh morning

# 08:00 KST — Execute morning standup
00 08 * * * /scripts/checkpoint-exec.sh morning

# 13:55 KST — Prep mid-day sync
55 13 * * * /scripts/checkpoint-prep.sh midday

# 14:00 KST — Execute mid-day sync
00 14 * * * /scripts/checkpoint-exec.sh midday

# 14:55 KST — Prep asset report
55 14 * * * /scripts/checkpoint-prep.sh asset

# 15:00 KST — Execute asset report
00 15 * * * /scripts/checkpoint-exec.sh asset

# 17:50 KST — Prep evening checkpoint
50 17 * * * /scripts/checkpoint-prep.sh evening

# 18:00 KST — Execute evening checkpoint
00 18 * * * /scripts/checkpoint-exec.sh evening
```

---

## Checkpoint Execution Checklist

**Before Each Checkpoint:**
```
□ Secretary/Owner ready to lead
□ All participants notified
□ CTB document open and ready for updates
□ Timer set for max duration
□ Discord/communication channel open
□ Latest project data available
```

**During Checkpoint:**
```
□ Follow template sequentially
□ Keep to time limit (strict)
□ Record decisions and blockers
□ Note any escalations
□ Capture action items
```

**After Checkpoint:**
```
□ CTB updated with new entry
□ CEO notified (if needed)
□ Blocking items escalated (if needed)
□ Action items assigned
□ Next checkpoint scheduled
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-30 06:40 KST  
**Next Update:** 2026-05-31 08:00 KST
