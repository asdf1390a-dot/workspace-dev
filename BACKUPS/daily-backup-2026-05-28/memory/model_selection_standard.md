---
name: Model Selection Standard & Decision Tree
description: Haiku/Sonnet/Opus allocation rules with decision tree, weekly monitoring, and session logging
type: system
date: 2026-05-27
owner: System / Evaluator AI Agent
automationId: model-selection-weekly-monitoring
originSessionId: 9bef52ba-fc07-46c8-829f-b29dcd146641
---
# Model Selection Standard (2026-05-27 Implementation)

**Objective:** Cost efficiency (Opus <15% monthly) + consistency + traceability  
**Implementation:** Decision tree + weekly audit + session logging  
**Owner:** Evaluator AI Agent (Mondays 08:00 KST)

---

## 🎯 DECISION TREE (Primary Logic)

### START: New task/session assignment

**Q1: Is this information retrieval + analysis?**
- ✅ YES → Check file size
  - Small (<10 items) → **HAIKU** (メモリ検索, 상태보고, 간단한 요약)
  - Large (10+ items, multiple files) → Q2
  
- ❌ NO → Check code complexity (Q3)

**Q2: Is this cross-domain analysis or requires architectural thinking?**
- ✅ YES → **SONNET** (메모리 종합 + 의사결정, 복잡 분석)
- ❌ NO → **HAIKU**

**Q3: Is this code generation or modification?**
- ✅ YES → Check scope
  - <10 lines, existing pattern → **HAIKU**
  - 10-100 lines, new pattern/refactor → **SONNET**
  - 100+ lines OR 3+ domain integration → **OPUS** (subagent only)
  
- ❌ NO → Check task complexity
  - Simple (1 domain, clear rules) → **HAIKU**
  - Moderate (2 domains, design decisions) → **SONNET**
  - Complex (3+ domains, architecture) → **OPUS** (subagent only)

---

## ✅ HAIKU 4.5 (Default)

**Allocation: 70% of all tasks**

**Use cases:**
- Text analysis: memory search, status reporting, summaries
- Simple code modifications: <10 lines, existing patterns
- Data retrieval + formatting: API responses, log analysis
- Documentation: writing runbooks, technical specs
- Routine tasks: form filling, list generation

**Examples:**
- Reading MEMORY.md, searching for team member info → HAIKU
- Updating CTB status (🟢/🟡/🔴) → HAIKU
- Fixing typo in codebase → HAIKU
- Writing daily standup summary → HAIKU

**Cost:** ~$0.05-0.10 per task

---

## 🔵 SONNET 4.6 (Selective)

**Allocation: 20% of all tasks**

**Trigger conditions (ANY of these):**
1. New API design (>5 endpoints, requires schema review)
2. Code refactoring (30-100 lines, non-trivial logic changes)
3. Database optimization (query rewrite, schema changes)
4. Cross-component analysis (2+ domains, design trade-offs)
5. Performance troubleshooting (requires comparative analysis)
6. Complex problem decomposition (needs multiple solution approaches)

**Examples:**
- Designing Asset Master Phase 2 API schema → SONNET
- Refactoring Travel Management Phase 2 UI components → SONNET
- Optimizing Backup Phase 2 database queries → SONNET
- Analyzing team capacity allocation across 8 projects → SONNET
- Troubleshooting Duplicate Detection Engine performance → SONNET

**Entry rule:** "Haiku tried but insufficient confidence" OR "Design decisions required"  
**Exit rule:** Task decomposed into HAIKU subtasks OR complexity reduced

**Cost:** ~$0.50-1.50 per task

---

## 🟠 OPUS 4.7 (Expert Only)

**Allocation: ≤15% monthly, subagents ONLY**

**Trigger conditions (ONLY for subagent-spawned tasks):**
1. Full architecture redesign (3+ subsystems)
2. Complex refactoring (100+ lines, high coupling)
3. Team decision synthesis (conflicting opinions, trade-offs)
4. Novel algorithm/system design (no existing pattern)
5. Critical blocker resolution (>2 hours investigation needed)

**Examples:**
- Redesigning Memory Automation Phase 2 subsystems (3 layers) → OPUS
- Refactoring entire authentication layer (150+ lines) → OPUS
- Synthesizing team feedback on 8-project capacity plan → OPUS
- Designing new Duplicate Detection Engine (novel approach) → OPUS

**Entry rule:** Subagent spawned by Secretary/CEO + complexity threshold met  
**Exit rule:** Solution designed, handed off to Haiku/Sonnet for implementation

**Monitoring:** Weekly cost tracking (Evaluator Agent, Mondays 08:00)

**Cost:** ~$2.00-5.00 per task (EXPENSIVE)

---

## 📋 WEEKLY MONITORING SYSTEM (Evaluator Agent, Mondays 08:00 KST)

### Audit Checklist

**Item 1: Opus Usage Compliance**
```
☐ All Opus tasks last week were subagent-spawned? (YES/NO)
☐ Each Opus task has documented complexity justification? (YES/NO)
☐ Opus % of total tasks < 15% monthly target? (PERCENTAGE)
  - If >15%: Flag which 3 tasks could have used Sonnet instead
```

**Item 2: Decision Tree Adherence**
```
☐ All Haiku tasks were <10 lines or information retrieval? (YES/NO)
☐ All Sonnet tasks triggered ≥1 condition from list? (YES/NO)
☐ Any Haiku tasks that should have been Sonnet? (LIST if YES)
  - Example: "Asset Master API design used Haiku, should be Sonnet"
  - Action: Rerun with Sonnet if needed
```

**Item 3: Cost Efficiency**
```
☐ Weekly Haiku cost: $____ (target: <$10)
☐ Weekly Sonnet cost: $____ (target: <$20)
☐ Weekly Opus cost: $____ (target: <$30, max $50)
☐ Deviation from target? If YES → reason + adjustment
```

**Item 4: Consistency Check**
```
☐ Same task types → same model used? (YES/NO)
  - Example: Two "API design" tasks last week used same model? YES/NO
☐ Model switch without documented reason? (LIST if YES)
```

---

## 📊 SESSION LOGGING FORMAT

**Every session, prepend to active_work_tracking.md:**

```
[YYYY-MM-DD HH:MM] [MODEL] Task description — reasoning
[2026-05-27 13:38] [HAIKU] CTB status update — information retrieval only
[2026-05-27 13:32] [SONNET] Model selection analysis — cross-domain, design decisions required
[2026-05-27 10:00] [SONNET] Team structure expansion — 15-person architecture, scope decisions
```

**Weekly summary (Mondays 08:00):**
```
## 📊 Model Usage Week of 2026-05-XX

| Model | Count | % of total | Cost | Status |
|-------|-------|-----------|------|--------|
| Haiku | XX | 70% | $X | ✅ On target |
| Sonnet | XX | 20% | $X | ✅ On target |
| Opus | XX | ≤15% | $X | 🔴 If >15% |

Findings:
- Item X: Haiku overuse (should have been Sonnet)
- Item Y: Sonnet justified (decision tree: API design)
- Item Z: Opus justified (subagent spawn, architecture redesign)

Action items (if any):
- [ ] Rerun task X with Sonnet (re-queue if critical)
- [ ] Document reasoning for task Y in session log
```

---

## 🔄 IMPLEMENTATION TIMELINE

| Date | Action | Owner |
|------|--------|-------|
| 2026-05-27 | Decision tree created + logging format defined | System |
| 2026-05-27 onwards | Session-by-session logging (every response) | Secretary |
| 2026-06-03 (Mon 08:00) | **First weekly audit** | Evaluator Agent |
| Weekly (Mon 08:00) | Recurring audit + cost report | Evaluator Agent |

---

## 🚨 ESCALATION (If violations found)

**Scenario 1: Opus >15% monthly**
```
Action: Evaluator Agent → Telegram report to CEO
- Which tasks used Opus (list 3)
- Why they shouldn't have been Sonnet (justification per task)
- Recommendation: cost-saving measure
- Timeline: Implement by next week
```

**Scenario 2: Decision tree violations**
```
Action: Secretary → Re-queue violating task with correct model
- Example: "Asset Master API design used Haiku, rerunning with Sonnet"
- Cost: Absorb Sonnet cost (no user recharge)
- Timeline: Same day
```

**Scenario 3: Inconsistent model use**
```
Action: Evaluator Agent → Update decision tree clarity
- Example: "API design" sometimes Haiku, sometimes Sonnet
- Resolution: Add specific conditions to tree
- Timeline: Next audit update
```

---

## 📎 RELATED DOCUMENTS

- active_work_tracking.md — Session log appended with [MODEL] tags
- feedback_core_autonomous_operation.md — Auto-execution rules (compatible)
- MEMORY_AUTOMATION_PHASE2_DESIGN.md — Example: Opus complexity justification

---

**Status:** 🟢 ACTIVE (2026-05-27)  
**Next Review:** Monday 2026-06-03 08:00 KST  
**Owner:** Evaluator AI Agent (automated monitoring)
