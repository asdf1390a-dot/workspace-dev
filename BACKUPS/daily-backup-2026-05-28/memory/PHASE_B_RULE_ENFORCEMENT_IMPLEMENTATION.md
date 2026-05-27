---
name: Phase B - Rule Enforcement Implementation
description: Evaluator Agent monitoring autonomous proceed, task ownership, and schedule discipline
type: project
originSessionId: 5908723b-7285-41d1-a095-cf8be0c15443
---
# Phase B: Rule Enforcement Implementation 🔍

**Status:** IMPLEMENTING 2026-05-26 16:00

## Rule Monitoring System

### Rule 1: Autonomous Proceed
```
Violation Pattern: "Can I do X?", "Should I proceed with Y?", "Need your approval"
Expected Behavior: Proceed immediately without asking
Evidence: Prompt text analysis + decision log
Alert Threshold: Any instance = 1 violation
```

### Rule 2: Task Ownership
```
Violation Pattern: Task started but incomplete, partial results, "ready for review", "next steps depend on..."
Expected Behavior: Deliver complete end-to-end result, follow to completion
Evidence: Git commits + task completion tracking
Alert Threshold: Unfinished work after 2 hours idle time
```

### Rule 3: Schedule Discipline
```
Violation Pattern: Deadline missed, delay without explanation, schedule not adjusted
Expected Behavior: Meet/exceed deadlines, analyze delays <5min, auto-adjust remaining work
Evidence: Timeline tracking + deadline log
Alert Threshold: Any delay >5 minutes without documented analysis
```

## Evaluator Agent Setup

### Trigger Points
- After major task completion
- Every 4-hour checkpoint
- On deadline approach/miss
- Weekly comprehensive review

### Verification Checklist
```
✓ Task started — committed to in CTB/memory
✓ Task completed — delivers expected output (not "in progress", "ready for review")
✓ No confirmation requested — proceeded autonomously or auto-requested permission
✓ Schedule met — completed on or before deadline
✓ If delayed — documented root cause within 5 minutes
```

### Alert Format
```
⚠️ RULE VIOLATION
Rule: [Autonomous Proceed / Task Ownership / Schedule Discipline]
Severity: [INFO / WARNING / CRITICAL]
Evidence: [specific quote, timestamp, file reference]
Auto-Fix: [immediate corrective action]
Impact: [consequence if unaddressed]
Timeline: [correction deadline]
```

## Implementation Tasks

- [ ] Create RULE_VIOLATION_TRACKING.md (accumulative log)
- [ ] Create EVALUATOR_CHECKPOINTS.md (4-hour review templates)
- [ ] Write rule detection script
- [ ] Set up cron job: Every 4 hours evaluator run
- [ ] Set up deadline monitoring job
- [ ] Discord alert webhook for violations
- [ ] Auto-correction execution where possible

## Evaluator Agent Prompt Template

```
You are a QA evaluator for rule compliance.
Review the last 4 hours of work:

1. **Autonomous Proceed Rule** — Did I wait for confirmation when I could proceed?
   Look for: "Can I...", "Should I...", "Need approval"
   Severity: HIGH — this blocks momentum

2. **Task Ownership Rule** — Did I complete the task end-to-end or leave it hanging?
   Look for: "ready for review", "next steps", incomplete commits
   Severity: HIGH — this wastes user's time

3. **Schedule Discipline Rule** — Did I meet deadlines? Analyze delays?
   Look for: CTB timeline, deadline tracking, root cause analysis
   Severity: CRITICAL — this breaks trust

Report: Violations found (if any) with specific evidence and recommended fixes.
```

## Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Detection latency | <5 min | Pending |
| False positive rate | <10% | Pending |
| Auto-fix success rate | ≥80% | Pending |
| Repeat violation rate | <5% | Pending |

**Implementation ETA:** 2026-05-26 17:30
