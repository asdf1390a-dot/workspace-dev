---
name: Planner TOP 3 Ghost Selection Task Brief
description: Template for immediate Planner escalation when Evaluator review arrives (deadline 2026-05-17 19:00)
date: 2026-05-17 12:14 KST
status: READY_FOR_TRIGGER
---

# 📋 Planner Task: TOP 3 Ghost Selection + Web-Dev Schedule
**Trigger:** When evaluation_review_20260517.md file is created  
**Deadline:** 2026-05-17 19:00 KST  
**Status:** ⏳ AWAITING EVALUATOR RESULTS

---

## 🎯 Task Scope

**Input:** Evaluator team review results (3 components)
1. **온보딩 3명 스킬 검증** — which skills are ready
2. **웹개발 병렬화 가능성 평가** — how many can work in parallel
3. **Stopped Projects 우선순위 정렬** — priority order for Ghost selection

**Output:** Planner decision + schedule
1. **TOP 3 Ghost selection** from INCOMPLETE_TASKS_REGISTRY Phase 3 Ghost list (7 total)
2. **Web-dev scheduling** aligned with:
   - Day 2 (2026-05-18) compressed onboarding restart
   - Available parallelization capacity from Evaluator assessment
   - Priority order from Evaluator ranking

---

## 📌 Context for Planner

### Phase 3 Ghost Tasks (7 total)
See: INCOMPLETE_TASKS_REGISTRY.md → Phase 3 Ghost List
- Currently unscheduled / no team member assigned
- Awaiting priority + team capacity assessment
- Part of Asset Master Phase 2 ecosystem

### Blocking Chain Status
- ✅ CTB auto-rules deployed
- ✅ All onboarding materials prepared  
- 🟡 Day 1 onboarding MISSED (web-dev mentor no-show) → Day 2 restart required
- 🟡 Evaluator review IN_PROGRESS (due 18:00)
- 🔴 Task assignment (14:00) BLOCKED → will retry after evaluation results

### Web-Developer Capacity Input
- Evaluator assessment of parallelization capacity (when results arrive)
- Expected from: evaluation_review_20260517.md

---

## ⚙️ Planner Action Steps (execute after 18:00)

1. **Review evaluation_review_20260517.md**
   - Extract: skill readiness scores
   - Extract: parallel capacity number
   - Extract: project priority ranking

2. **Select TOP 3 Ghosts**
   - Based on Evaluator priority ranking
   - Cross-reference Phase 3 Ghost list
   - Estimate effort per ghost (2-5 days each)

3. **Create web-dev schedule**
   - Day 2 (2026-05-18): Compressed onboarding (environment setup only, 30min) + Task #1 kickoff
   - Day 3+ (2026-05-19~23): TOP 3 Ghosts parallel development
   - Daily 15:00 progress reports (new team member requirement)

4. **Output document**
   - File: `PLANNER_WEB_DEV_SCHEDULE_2026-05-17.md`
   - Contains: TOP 3 selection rationale + day-by-day schedule
   - Handoff-ready for web-dev execution

5. **Update tracking**
   - INCOMPLETE_TASKS_REGISTRY.md: Mark Planner task as COMPLETED
   - ACTIVE_WORK_TRACKING.md: Update blocking chain status
   - Add entry to 갱신 로그

---

## 📡 Trigger Condition

**File watch:** `/home/jeepney/.openclaw/workspace-dev/evaluation_review_20260517.md`  
**Action:** When file created → Auto-notify Planner agent with this briefing  
**Deadline enforcement:** If not completed by 19:00, escalate as P0

---

**Prepared by:** Autonomous System (vacation mode)  
**Prepared at:** 2026-05-17 12:14 KST  
**Expected trigger:** 2026-05-17 18:00 KST (Evaluator results arrival)  
**Execution window:** 18:00-19:00 KST (1 hour deadline)
