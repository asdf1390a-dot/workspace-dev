---
name: Hermes Phase 1 Monitoring Setup
description: OpenClaw cron jobs scheduled for Phase 1 Days 1-3 (2026-05-20~22) validation + Go/No-Go checkpoints
type: project
---

# Hermes Phase 1 Monitoring Infrastructure

**Setup Date:** 2026-05-19 13:15 KST  
**Status:** 4x OpenClaw cron jobs scheduled ✅

---

## Scheduled Cron Jobs

### Day 1: 2026-05-20

| Time KST | Job | File | Criteria | Decision |
|----------|-----|------|----------|----------|
| 08:05 | A1 validation | `blocker-morning-2026-05-20.json` | File ≥100B + valid JSON + blocker items ≥3 or empty | Pass/Fail |
| 14:05 | A2 validation | `phase-a-validation-2026-05-20.json` | File ≥100B + valid JSON + Asset/Backup items + schedule deltas | Pass/Fail |
| 18:05 | A3 validation | `capacity-report-2026-05-20.json` | File ≥100B + valid JSON + 4 team members + util 49%±5% | Pass/Fail |
| 20:30 | **Day 1 Eval** | All 3 files | **(A1+A2+A3)/3 ≥95%** → GO Day 2 / **<95%** → NO-GO re-run | 🔴 Critical Point |

### Days 2-3: Continuation (if Day 1 Pass)

- 2026-05-21 08:00 — Day 2 A1 re-run (continuity + replication check)
- 2026-05-21 14:00 — Day 2 A2 re-run
- 2026-05-21 18:00 — Day 2 A3 re-run
- 2026-05-21 20:00 — Day 2 evaluation (90% continuity threshold)
- 2026-05-22 08:00 — Day 3 A1 final
- 2026-05-22 14:00 — Day 3 A2 final
- 2026-05-22 18:00 — Day 3 A3 final
- **2026-05-22 20:30** — **PHASE 1 FINAL DECISION** (95% cumulative accuracy required)

---

## Output File Locations

All Hermes job outputs saved to: `/home/jeepney/.hermes/sessions/`

```
blocker-morning-2026-05-20.json         ← A1 output (08:00)
phase-a-validation-2026-05-20.json      ← A2 output (14:00)
capacity-report-2026-05-20.json         ← A3 output (18:00)
blocker-morning-2026-05-21.json         ← Day 2 A1
phase-a-validation-2026-05-21.json      ← Day 2 A2
capacity-report-2026-05-21.json         ← Day 2 A3
... (Day 3 files follow same pattern with 2026-05-22 dates)
```

---

## Validation Criteria Reference

**Job A1 (blocker-morning-summary):**
- ✅ File created (≥100 bytes)
- ✅ Valid JSON structure
- ✅ Blocker items array (≥3 or empty if none)
- ✅ Timestamp within ±2min of 08:00 KST
- Source: `hermes_accelerated_stabilization_plan.md` lines 30-41

**Job A2 (phase-a-milestone-check):**
- ✅ File created (≥100 bytes)
- ✅ Valid JSON structure
- ✅ Asset Master/Backup Phase items detected
- ✅ Schedule ETA deltas calculated (≥3 items)
- ✅ Completion status marks present (✅/⚠️/🔴)
- ✅ CTB timestamp alignment
- Source: `hermes_accelerated_stabilization_plan.md` lines 43-51

**Job A3 (team-capacity-daily):**
- ✅ File created (≥100 bytes)
- ✅ Valid JSON structure
- ✅ Team size: 4 members (all names included)
- ✅ Utilization: 49% ±5% (acceptable range 44-54%)
- ✅ Active task count matches CTB 🟡 items
- ✅ Logic: recommendations follow capacity rules
- Source: `hermes_accelerated_stabilization_plan.md` lines 53-61

---

## Decision Logic

### Day 1 Evaluation (2026-05-20 20:30)
```
Accuracy = (A1_pass + A2_pass + A3_pass) / 3 × 100
→ ≥95% (3/3 Pass) = GO to Day 2
→ <95% (2/3+ Fail) = NO-GO, immediate fix + Day 1 re-run
```

### Day 2 Evaluation (2026-05-21 20:00)
```
Continuity = (replication_pass + sensitivity_pass + change_tracking_pass) / 3 × 100
→ ≥90% = GO to Day 3
→ <90% = Fix logic, re-run Day 2
```

### Phase 1 Final (2026-05-22 20:30)
```
Cumulative = (Day1_accuracy + Day2_continuity + Day3_final) / 3 × 100
→ ≥95% ALL pass = ✅ GO to Phase 2 (Category B activate 2026-05-23)
→ <95% ANY fail = 🔴 NO-GO, Phase 1 continuation or restart
```

---

## Reporting Channel

All validation results reported via **Telegram** to user (8650232975):
- Individual job validations: Short status (Pass/Fail)
- Daily evaluations: Decision + evidence + next step
- Phase transitions: Full summary + timestamp

---

## Risk Mitigation

If any job fails:
1. **Automatic:** Cron continues to next scheduled check (no cascading stops)
2. **Manual escalation:** If 2/3 jobs fail on Day 1, Day 1 eval triggers immediate re-run
3. **Phase hold:** Phase 2 cannot activate until Phase 1 cumulative ≥95%
4. **Data integrity:** All output files timestamped, audit trail maintained

---

## Related Documents

- [Hermes Accelerated Stabilization Plan](hermes_accelerated_stabilization_plan.md)
- [Active Work Tracking (CTB)](active_work_tracking.md)
- [Hermes Autonomous Jobs](hermes_autonomous_jobs.md)
- [Hermes Integration Architecture](hermes_integration_architecture.md)
