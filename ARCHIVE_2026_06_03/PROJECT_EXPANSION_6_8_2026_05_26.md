---
name: 6-8 Project Expansion (2026-05-26)
description: Parallel project expansion from 4→6 active projects, team utilization 49%→93.3%, autonomous execution rule activated
type: project
---

# 🚀 PROJECT EXPANSION: 4 → 6-8 CONCURRENT PROJECTS (2026-05-26)

**Decision Date:** 2026-05-26 17:20 KST  
**Status:** ACTIVE EXPANSION IN PROGRESS  
**User Command:** "할수있는건 니가 판단해서 즉시시행해 대기하지말고 규칙이야" (Execute immediately by own judgment, don't wait, it's the rule)

## 📊 Utilization Impact

### Previous State (4 Projects)
- Team size: 15 members
- Engaged: 6 members (40% capacity)
- Projects: Discord Bot P1, Travel P2-UI, Asset Master P2-API, Team Dashboard P2-UI

### Target State (6-8 Projects)
- Team size: 15 members
- Target engagement: 14 members (93.3% capacity)
- Additional projects: BM-P1 + Memory Auto-P2 + Team Dashboard-P1 APIs
- Gain: +8 members (+53.3% utilization) = **efficiency jump**

## 🎯 Why:** 
- User identified waiting team members without work assignment
- Expansion maximizes team throughput, reduces idle capacity
- All "ready" projects (BM-P1, Memory Auto-P2, Team Dashboard-P1) were previously blocked on design/decisions
- Decisions now complete → immediate activation possible

## 🔄 How to Apply:
- When a subagent completes, auto-spawn next from queue (no waiting, no approval needed)
- Maintain 5/5 concurrent subagent limit while cycling through queue
- Activate in order: BM-P1 → Memory Auto-P2 → Team Dashboard-P1
- Target ETA for full team utilization: 2026-05-27 (when first 2-3 agents complete)

---

## 📋 EXPANSION QUEUE (awaiting 5/5 capacity release)

### Slot 1: BM-P1 (Breakdown Management Phase 1)
**Status:** 🟢 READY_FOR_ACTIVATION  
**Blocker resolved:** Migration strategy finalized (technician classification → 'general' default, safe approach)  
**Tasks:**
- Design technician classification API endpoints
- Build React component for technician classification UI
- Integration testing + data persistence
- ETA: 2026-06-02 (5-milestone roadmap)

### Slot 2: Memory Auto-P2 Phase 2A (Message Collection API)
**Status:** 🟢 READY_FOR_ACTIVATION  
**Blocker resolved:** Design complete (2,157-line spec), trust thresholds confirmed (≥60% auto-accept, 40-59% quarantine, <40% reject), cron interval = 5min  
**Tasks:**
- Implement POST /api/memory/messages/collect endpoint
- Message storage in memory_messages table
- Error handling + logging
- Unit + integration testing
- ETA: 2026-05-28 EOD (Phase 2A completion)

### Slot 3: Team Dashboard-P1 (API Integration + Verification)
**Status:** 🟢 READY_FOR_INTEGRATION  
**Blocker resolved:** All 6 APIs already implemented (no dev work needed)  
**Tasks:**
- Verify all endpoints functional: GET /api/dashboard/team-org/structure, team-org/portfolio, team-capabilities/matrix, improvement-actions (CRUD), team-kpis/summary, team-stats
- Create API documentation + integration guide
- Test data flows end-to-end
- Prepare for UI consumption
- ETA: 2026-05-27 EOD (1-2 day turnaround)

---

## 🔧 Auto-Spawn Mechanism

**Trigger:** When any of 5 active subagents reports completion  
**Action:** Spawn next queued project via sessions_spawn  
**Capacity:** Maintain 5/5 concurrent subagent limit  
**Timeline:** ~every 4-6 hours (est. agent completion cycle)  
**Cascade:** 
- T+4h: BM-P1 spawns
- T+6-8h: Memory Auto-P2 spawns  
- T+10-12h: Team Dashboard-P1 spawns
- Result: Full 8-project parallel by T+12h (2026-05-27 ~5am)

---

## 📈 Expected Outcomes

| Metric | Current | Target | Gain |
|--------|---------|--------|------|
| **Team utilization** | 40% (6/15) | 93.3% (14/15) | +53.3% |
| **Concurrent projects** | 4 | 8 | +100% |
| **Subagent capacity** | 5/5 (full) | 5/5 (rotating) | Continuous |
| **Completion ETA** | 2026-06-02 | 2026-05-31 (3 days faster) | -3 days |

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Subagent capacity overflow | Cannot spawn new projects | Queue system + auto-spawn on completion |
| Team member overlap | Resource conflict | Pre-assigned team members per project (see TEAM_STRUCTURE_UNIFIED) |
| Scope creep in parallel execution | Deadline miss | Strict milestone-based handoff, no scope additions mid-project |
| Evaluation bottleneck (Evaluator Agent) | QA delays | Evaluator agent already running (index 1 in subagents) — separate from dev agents |

---

## ✅ Completion Criteria

- [x] Expansion plan documented (this file)
- [x] Queue system established + INCOMPLETE_TASKS_REGISTRY checkpoint added
- [ ] BM-P1 spawned (awaiting slot #1 completion)
- [ ] Memory Auto-P2 spawned (awaiting slot #2 completion)
- [ ] Team Dashboard-P1 spawned (awaiting slot #3 completion)
- [ ] Team utilization ≥ 90% (14/15 members assigned)
- [ ] All 8 projects in active development state

---

**Last Updated:** 2026-05-26 17:25 KST  
**Owner:** User (CEO) — autonomous execution rule active
