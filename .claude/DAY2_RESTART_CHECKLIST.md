---
name: Day 2 Restart Checklist (2026-05-18 09:00)
description: Pre-flight checklist for compressed Day 1 onboarding (if triggered before 18:00)
date: 2026-05-17 12:14 KST
status: READY_TO_EXECUTE
---

# 📋 Day 2 Restart Checklist (2026-05-18 09:00)

**Trigger Condition:** Web-developer signals Day 2 restart via:
- GitHub commit mentioning "Day 2 restart" or "onboarding resuming"
- Telegram message to team channel
- Any direct contact signal

**Window:** Can be triggered as early as 2026-05-17 after 14:00 (before Evaluator deadline)

---

## ✅ Pre-Flight (Before 2026-05-18 09:00)

### Material Verification
- [ ] `NEW_TEAM_MEMBER_STARTUP_GUIDE.md` exists and accessible
- [ ] `NEW_TEAM_MEMBER_ONBOARDING_2026-05-17.md` exists (Day 1-7 full schedule)
- [ ] `.env.local` template ready for new team member
- [ ] `FAILURE_CODE_DROPDOWN_SPEC.md` accessible (Task #1 spec)
- [ ] `ASSET_MASTER_PHASE2_DESIGN.md` accessible (background reading)
- [ ] `ASSET_MASTER_PHASE2_API_GUIDE.md` accessible (API reference)

### Schedule Coordination
- [ ] Confirm web-developer available at 09:00 (2026-05-18)
- [ ] Confirm new team member ready at 09:00
- [ ] Reserve 30min for environment setup (compressed from 1h)
- [ ] Line up Task #1 assignment (failure_code UI)

---

## 🚀 Day 2 Compressed Onboarding (2026-05-18 09:00~11:00)

### 09:00~09:15 (15 min) — Project Intro
**Lead:** Web-developer

- Quick project structure overview (DSC FMS, 4 departments)
- Tech stack: Next.js 14 + React 18 + Supabase + TailwindCSS
- Point to: `NEW_TEAM_MEMBER_STARTUP_GUIDE.md` for self-study

### 09:15~10:00 (45 min) — Environment Setup
**Lead:** Web-developer + New Team Member (shared action)

**Checklist:**
1. Clone repo (if not done)
   ```bash
   git clone <repo-url>
   cd dsc-fms-portal
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Configure `.env.local` (web-dev provides Supabase credentials)
4. Start dev server
   ```bash
   npm run dev
   ```
5. Verify http://localhost:3000 is accessible
6. Walk through UI briefly (5 min)

### 10:00~10:30 (30 min) — Code Walkthrough + Task #1 Assignment
**Lead:** Web-developer + New Team Member

- Show 2-3 existing components (UI patterns)
- Explain Task #1: failure_code dropdown UI implementation
- Point to: `FAILURE_CODE_DROPDOWN_SPEC.md`
- Answer questions

### 10:30~ — Self-Paced Learning
**Lead:** New Team Member (self-study)

- Read `NEW_TEAM_MEMBER_STARTUP_GUIDE.md` section 2-3
- Review existing code examples
- Prepare environment for Task #1 start on Day 2 afternoon

---

## 📌 Critical Success Factors

| Item | Status | Responsibility |
|------|--------|-----------------|
| New team member Environment ready | ✅ Check at 10:00 | Web-dev + New member |
| Task #1 spec understood | ✅ Check at 10:30 | Web-dev (presenter) |
| First commit by EOD 2026-05-18 | 📍 Goal | New member (with support) |
| Daily 15:00 report started | ✅ Check after Day 2 | New member → Web-dev |

---

## 🔗 Cross-Reference: Full Timeline

**Day 2 (2026-05-18):**
- 09:00: Onboarding restart (compressed, ~1h)
- 10:30~17:00: Task #1 independent work
- 15:00: First daily progress report
- 17:00: EOD review

**Day 3~5 (2026-05-19~21):**
- 09:00~10:00: Daily standup + next task
- 10:00~17:00: Independent work
- 15:00: Daily progress report

**Day 6~7 (2026-05-22~23):**
- Same schedule
- Target: Task #1 + Ghost task(s) in progress

---

**Ready to execute:** 2026-05-17 12:14 KST  
**Awaiting:** Web-developer Day 2 restart signal (expected before 2026-05-18 09:00)
