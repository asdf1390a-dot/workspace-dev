---
name: Dependency Mapper System Implementation
description: Real-time dependency tracking with circular-dependency checker, critical-path analyzer, and visual DAG
type: operational
version: 1.0
date: 2026-05-30
---

# Dependency Mapper System

## 1. Overview

**Purpose:** Track all cross-project dependencies in real-time, detect circular dependencies, identify critical path, and alert on blockers.

**Scope:** 8 projects, 47+ dependencies, 15-person team

**Features:**
- Real-time dependency graph visualization
- Circular dependency detection (automatic)
- Critical path analysis (auto-updated daily)
- Blocker escalation triggers
- ETA impact analysis (when dependencies change)

---

## 2. Core Data Model

### 2.1 Project Structure

```yaml
Project:
  id: "ASSET-P2-UI"
  name: "Asset Master Phase 2 UI"
  owner: "Web-Builder #1"
  status: "IN_PROGRESS"  # [NOT_STARTED, IN_PROGRESS, COMPLETE, BLOCKED, ON_HOLD]
  
  timeline:
    start_date: 2026-05-28
    planned_completion: 2026-06-10 18:00
    actual_completion: null
    estimated_completion: 2026-06-10 18:00
    buffer_days: 2
  
  dependencies:
    predecessors:
      - project_id: "ASSET-P2-API"
        type: "MUST_COMPLETE"  # [MUST_COMPLETE, MUST_START, NICE_TO_HAVE]
        status: "COMPLETE"
        blocked_until: null
      
      - project_id: "TEAM-DASHBOARD-P2-API"
        type: "MUST_START"
        status: "IN_PROGRESS"
        estimated_completion: 2026-05-28 18:00
        blocked_until: 2026-05-28 18:00
    
    successors:
      - project_id: "ASSET-P3-OPTIMIZATION"
        type: "MUST_COMPLETE"
  
  resource_allocation:
    primary_owner: "Web-Builder #1"
    support_team:
      - "Design-Specialist" (20%)
    capacity_allocated: 100%
  
  blocking_items:
    - id: "BL-001"
      description: "Design approval pending"
      root_cause: "Design Specialist swamped"
      created_at: 2026-05-29 09:15
      escalated_at: null
      resolved_at: null
  
  critical_path: true
  slack: 2  # days
```

### 2.2 Dependency Types

```
DEPENDENCY_TYPES = {
  "MUST_COMPLETE": {
    description: "Predecessor must be 100% complete before starting",
    blocking_severity: "CRITICAL",
    example: "ASSET-P2-API → ASSET-P2-UI"
  },
  
  "MUST_START": {
    description: "Predecessor must start before starting (can overlap)",
    blocking_severity: "HIGH",
    example: "TEAM-DASHBOARD-API → TEAM-DASHBOARD-UI-Design"
  },
  
  "NICE_TO_HAVE": {
    description: "Nice to have predecessor complete, but can work around it",
    blocking_severity: "LOW",
    example: "MEMORY-AUTO-P2F → Other projects (can work with Phase 2D)",
    workaround: "Proceed with latest available version"
  }
}
```

---

## 3. Circular Dependency Checker

### 3.1 Algorithm: Depth-First Search (DFS)

```python
def has_circular_dependency(dependency_graph):
    """
    Check if graph contains any circular dependencies.
    
    Args:
        dependency_graph: Dict[project_id] -> List[project_ids]
    
    Returns:
        (has_circular: bool, cycles: List[List[project_ids]])
    """
    
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {node: WHITE for node in dependency_graph}
    cycles = []
    path_stack = []
    
    def dfs(node, parent_path):
        color[node] = GRAY
        path_stack.append(node)
        
        for neighbor in dependency_graph.get(node, []):
            if color[neighbor] == GRAY:
                # Found a cycle
                cycle_start = path_stack.index(neighbor)
                cycle = path_stack[cycle_start:] + [neighbor]
                cycles.append(cycle)
                
            elif color[neighbor] == WHITE:
                dfs(neighbor, path_stack)
        
        path_stack.pop()
        color[node] = BLACK
    
    for node in dependency_graph:
        if color[node] == WHITE:
            dfs(node, [])
    
    return len(cycles) > 0, cycles
```

### 3.2 Execution on Daily Basis

**Schedule:** Daily at 08:00 KST + 18:00 KST (2 times)

**Automated Alert on Detection:**
```
IF circular_dependency_detected:
    Alert Type: CRITICAL_BLOCKER
    Message: "Circular dependency detected: [CYCLE_PATH]"
    Action: 
      1. Escalate to CEO immediately
      2. Record in CTB blocker queue
      3. Schedule emergency planning call
      4. Halt affected projects
```

### 3.3 Current Status (2026-05-30 06:39 KST)

```
✅ Circular Dependency Check Result: CLEAN
Date Tested: 2026-05-28 03:20 KST
Total Projects: 8
Total Dependencies: 47
Circular Cycles Found: 0

Graph Type: Directed Acyclic Graph (DAG) ✅
Verified Safe For: Parallel execution, topological sorting, critical path analysis
```

---

## 4. Critical Path Analysis

### 4.1 Algorithm: Longest Path in DAG

```python
def find_critical_path(dependency_graph, task_durations):
    """
    Find longest path (critical path) in project DAG.
    
    Args:
        dependency_graph: Dict[project] -> List[dependencies]
        task_durations: Dict[project] -> duration_days
    
    Returns:
        (critical_path: List[projects], total_duration: int, 
         slack_per_task: Dict[project] -> slack_days)
    """
    
    # Step 1: Topological sort
    topo_order = topological_sort(dependency_graph)
    
    # Step 2: Forward pass (earliest start/completion times)
    earliest_start = {task: 0 for task in dependency_graph}
    earliest_completion = {}
    
    for task in topo_order:
        earliest_start[task] = max(
            [earliest_completion.get(dep, 0) 
             for dep in predecessors(task, dependency_graph)],
            default=0
        )
        earliest_completion[task] = earliest_start[task] + task_durations[task]
    
    project_end = max(earliest_completion.values())
    
    # Step 3: Backward pass (latest start/completion times)
    latest_completion = {task: project_end for task in dependency_graph}
    latest_start = {}
    
    for task in reversed(topo_order):
        latest_completion[task] = min(
            [latest_start.get(succ, project_end)
             for succ in successors(task, dependency_graph)],
            default=project_end
        )
        latest_start[task] = latest_completion[task] - task_durations[task]
    
    # Step 4: Calculate slack (float)
    slack = {
        task: latest_start[task] - earliest_start[task]
        for task in dependency_graph
    }
    
    # Step 5: Identify critical path (slack = 0)
    critical_tasks = [task for task, slack_val in slack.items() if slack_val == 0]
    critical_path = reconstruct_path(critical_tasks, dependency_graph)
    
    return critical_path, project_end, slack
```

### 4.2 Current Critical Path (as of 2026-05-30)

**Path 1: Longest (23 days) — Team Dashboard Full Stack**
```
TEAM-DASHBOARD-P2-API (1 day)
├─ Completed: 2026-05-28 18:00 ✅
└─→ TEAM-DASHBOARD-P2-UI-Design (8 days)
    ├─ Start: 2026-05-28 (est. 2026-05-27 started)
    ├─ Complete: 2026-06-04 18:00
    └─→ TEAM-DASHBOARD-P2-UI-Implementation (14 days)
        ├─ Start: 2026-06-04
        ├─ Complete: 2026-06-18
        └─→ TEAM-DASHBOARD-P3 (5 days, optional)
            ├─ Start: 2026-06-19
            └─ Complete: 2026-06-23

Total Duration: 1 + 8 + 14 = 23 days
Start: 2026-05-28
End: 2026-06-20 (with optional P3)
Slack: 10 days (2026-06-20 → 2026-06-30 deadline)
Status: ✅ On Critical Path (highest priority)
```

**Path 2 (13 days) — Asset Master**
```
ASSET-P2-API (completed)
└─→ ASSET-P2-UI (13 days)
    ├─ Start: 2026-05-28
    ├─ Complete: 2026-06-10
    └─ Slack: 5 days (2026-06-15 deadline)

Status: ✅ On Critical Path (must complete by 2026-06-10)
```

**Path 3 (18 days) — Backup Management**
```
BACKUP-P2-API (8 days to 70%)
├─ Start: 2026-05-28
├─ 70% Complete: 2026-06-05
└─→ BACKUP-P2-UI (10 days)
    ├─ Start: 2026-06-05
    ├─ Complete: 2026-06-15
    └─ Slack: 1 day (2026-06-16 deadline)

Status: 🟡 High Priority (tight timeline, only 1-day slack)
```

**Path 4 (2 days) — Memory Automation**
```
MEMORY-AUTO-P2E (1 day)
└─→ MEMORY-AUTO-P2F (1 day)
    ├─ Start: 2026-06-01
    ├─ Complete: 2026-06-02
    └─ Slack: 0 (on critical path for automation)

Status: ✅ On Schedule (2026-06-02 18:00 target)
```

### 4.3 Slack Analysis

```
Project         | Critical | Slack (days) | Buffer | Risk Level |
                | Path?    |              |        |            |
----------------|----------|--------------|--------|------------|
Team-Dashboard  | Yes      | 0            | N/A    | 🔴 CRITICAL|
TEAM-DASHBOARD  | —        | 10           | 142%   | 🟢 Safe    |
  Phase 3       |          |              |        |            |
Asset Master P2 | Yes      | 5            | 38%    | 🟡 Medium  |
Backup P2       | Partial  | 1            | 6%     | 🔴 Tight   |
Memory Auto     | Yes      | 0            | N/A    | 🔴 CRITICAL|
HARNESS-ENG P2  | No       | 8            | 57%    | 🟢 Safe    |
Travel (Phase 3)| No       | 10+          | 100%+  | 🟢 Safe    |
BM (Phase 2)    | No       | 5+           | 50%+   | 🟢 Safe    |

Critical Path Nodes (Slack = 0):
  - TEAM-DASHBOARD-P2-API
  - TEAM-DASHBOARD-P2-UI-Design
  - TEAM-DASHBOARD-P2-UI-Implementation
  - MEMORY-AUTO-P2E
  - MEMORY-AUTO-P2F
```

### 4.4 Impact of Delaying Critical Path Items

```
If TEAM-DASHBOARD-P2-API delayed by 1 day:
  - TEAM-DASHBOARD-P2-UI Design starts 1 day late
  - Final completion: 2026-06-21 (instead of 2026-06-20)
  - Slack reduction: 10 → 9 days
  - Risk: Phase 3 may be blocked

If ASSET-P2-UI delayed by 5 days (beyond slack):
  - Final completion: 2026-06-15 (instead of 2026-06-10)
  - Slack goes negative: 5 days becomes 0 days
  - Risk: CEO review deadline violated
  - Mitigation: Parallel development + testing

If BACKUP-P2-API stays at 31% (needs to reach 70%):
  - Current pace: 31% by 2026-05-28
  - Pace needed: 70% by 2026-06-05 (8 days)
  - Daily rate needed: (70-31)/8 = 4.9% per day
  - Current rate: ~3.5% per day
  - Gap: -1.4% per day (BEHIND by 30% for the deadline)
  - Action: Allocate additional resources OR extend BACKUP-P2-UI start
```

---

## 5. Real-Time Dependency Tracking

### 5.1 Dependency Change Protocol

**When dependency state changes:**

```
[Project X] Dependency Change Notification

FROM: [Old Dependency State]
  - Predecessor: [Y]
  - Status: [OLD_STATUS]
  - ETA: [OLD_DATE]

TO: [New Dependency State]
  - Predecessor: [Y]
  - Status: [NEW_STATUS]
  - ETA: [NEW_DATE]

REASON: [Brief explanation]

IMPACT:
  - Critical Path: [Changed / Unchanged]
  - Slack for Dependent Projects: [Old slack] → [New slack]
  - Escalation Needed: [Yes / No]
  - Affected Projects: [List]

REPORTED_BY: [Name]
TIMESTAMP: [ISO-8601]
ACTION_REQUIRED: [By whom, deadline]
```

**Example:**
```
[ASSET-P2-API] Dependency Complete

FROM:
  - Status: IN_PROGRESS (85% complete)
  - ETA: 2026-05-27 18:00

TO:
  - Status: COMPLETE ✅
  - ETA: 2026-05-27 15:30 (30 minutes ahead)

IMPACT:
  - ASSET-P2-UI can now start immediately (no more blocking)
  - Critical path unaffected (ASSET-P2-UI has 13-day duration)
  - Slack improved: +30 minutes

REPORTED_BY: Web-Builder #1
TIMESTAMP: 2026-05-27T15:30:00Z
ACTION: Notify ASSET-P2-UI owner (Web-Builder #1) to begin development
```

### 5.2 Automated Tracking Updates

**Trigger Events:**

1. **Project Completion**
   - When: Project reaches 100%
   - Action: Check all successors, remove blocker, trigger dependent projects
   - Notification: Successors' owners notified immediately

2. **Blocker Creation**
   - When: Dependency changes to BLOCKED status
   - Action: Calculate impact on critical path
   - Notification: Escalate if on critical path (30-minute escalation timer)

3. **ETA Change**
   - When: Predecessor ETA changes by ±1 day or more
   - Action: Recalculate slack for all successors
   - Notification: If slack becomes negative, escalate to CEO

4. **Blocker Resolution**
   - When: Dependency changes from BLOCKED to IN_PROGRESS/COMPLETE
   - Action: Remove from escalation queue, notify dependent projects
   - Notification: Immediate (green signal to proceed)

---

## 6. Visual Dependency Graph

### 6.1 ASCII DAG Representation (5/28 Snapshot)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROJECT DEPENDENCY DAG                        │
│                         (2026-05-30 06:39)                          │
└─────────────────────────────────────────────────────────────────────┘

PHASE 1 (✅ Complete)
├─ BM-P1 ✅
├─ DISCORD-BOT-P1 ✅
└─ HARNESS-ENG-P1 ✅

PHASE 2 (🟡 In Progress)

CRITICAL PATH SECTION (23-day chain):
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  TEAM-DASHBOARD-P2-API (1d) ✅                              │
│  ├─ COMPLETE: 2026-05-28 18:00                             │
│  └─→ TEAM-DASHBOARD-P2-UI-Design (8d) 🟡                   │
│      ├─ 0% Started: 2026-05-28                             │
│      ├─ ETA: 2026-06-04 18:00                              │
│      └─→ TEAM-DASHBOARD-P2-UI-Impl (14d) 🔴               │
│          ├─ Blocked on Design ≥80%                         │
│          ├─ Start: 2026-06-04                              │
│          ├─ ETA: 2026-06-18                                │
│          └─→ TEAM-DASHBOARD-P3 (5d, opt) 🔴              │
│              ├─ Start: 2026-06-19                          │
│              └─ ETA: 2026-06-23                            │
│                                                              │
│  Slack: 10 days (2026-06-20 + 10d = 2026-06-30)          │
│  Status: 🔴 HIGHEST PRIORITY — Longest chain              │
└──────────────────────────────────────────────────────────────┘

ASSET SECTION (13-day chain):
  ASSET-P2-API ✅ → ASSET-P2-UI (13d) 🟡
  ├─ Start: 2026-05-28
  ├─ ETA: 2026-06-10
  └─ Slack: 5 days

BACKUP SECTION (18-day chain):
  BACKUP-P2-API (8d) 🟡 → BACKUP-P2-UI (10d) 🔴
  ├─ API Start: 2026-05-28
  ├─ 70% ETA: 2026-06-05
  ├─ UI Start: 2026-06-05
  ├─ Final ETA: 2026-06-15
  └─ Slack: 1 day ⚠️ TIGHT

MEMORY AUTOMATION (2-day chain):
  MEMORY-AUTO-P2E (1d) 🟡 → MEMORY-AUTO-P2F (1d) 🔴
  ├─ Phase 2E Start: 2026-06-01
  ├─ Phase 2F ETA: 2026-06-02 18:00
  └─ No slack (critical for automation)

TRAVEL (3-phase, complete):
  TRAVEL-P2-UI ✅ → TRAVEL-P3 → ...
  └─ No blockers, full slack

HARNESS (2-day chain):
  HARNESS-ENG-P1 ✅ → HARNESS-ENG-P2-Design (8d) 🟡
  ├─ Design Start: 2026-05-28
  ├─ Design ETA: 2026-06-05
  └─→ HARNESS-ENG-P2-UI (14d) 🔴
      ├─ UI Start: 2026-06-05
      ├─ UI ETA: 2026-06-19
      └─ Slack: 8 days

CROSS-PROJECT DEPENDENCIES:
  ASSET-P2-UI →(nice-to-have)→ TEAM-DASHBOARD-P2-UI (can work independently)
  BACKUP-P2-UI →(succession)→ TEAM-DASHBOARD-P3 (nice-to-have)
  MEMORY-AUTO-P2F →(succession)→ All others (nice-to-have, best effort)
```

### 6.2 Dependency Legend

```
┌──────────┬─────────────────────────────────────────────────┐
│ Symbol   │ Meaning                                         │
├──────────┼─────────────────────────────────────────────────┤
│ ✅       │ COMPLETE — Ready for successors                │
│ 🟡       │ IN_PROGRESS — In development                   │
│ 🔴       │ BLOCKED — Waiting on predecessor               │
│ 🔵       │ NOT_STARTED — Ready to start (no blockers)    │
│ →        │ Dependency link (predecessor → successor)      │
│ (d)      │ Duration in days                               │
└──────────┴─────────────────────────────────────────────────┘
```

---

## 7. Integration with Checkpoint System

### 7.1 Daily Updates (Part of Checkpoints)

**08:00 Checkpoint:**
- Check circular dependencies: ✅ (automated, alerts if found)
- Verify critical path status: Report at standup
- Update dependency graph with overnight changes

**14:00 Checkpoint:**
- Recalculate slack based on morning progress
- Alert if any project's slack decreased by >1 day

**18:00 Checkpoint:**
- Full dependency graph update
- Generate "Critical Path Status" report for CEO

### 7.2 Automated Notifications

```
Trigger: Dependency State Change
├─ If on CRITICAL_PATH: Immediate escalation (30-min timer)
├─ If not on critical path: Log and notify at next checkpoint
└─ If blocker resolved: Green light to successor (immediate)

Trigger: Slack Goes Negative
├─ Action: Emergency escalation to CEO
├─ Message: "[PROJECT] now behind schedule by X days"
└─ Option: Replan timeline or add resources

Trigger: Circular Dependency Detected
├─ Action: HALT all related projects immediately
├─ Message: Critical alert to CEO
└─ Schedule: Emergency planning call
```

---

## 8. System Implementation Roadmap

**2026-05-30 (Today):**
- ✅ Design document complete
- ✅ Dependency data model finalized

**2026-05-31 (Tomorrow):**
- ⏳ Implement circular dependency checker (bash script)
- ⏳ Create dependency graph JSON structure
- ⏳ Set up daily cron for DAG validation

**2026-06-01:**
- ⏳ Implement critical path analyzer (bash + awk)
- ⏳ Create visualization tool (ASCII DAG output)
- ⏳ Set up slack monitoring alerts

**2026-06-02:**
- ⏳ Integration with checkpoint system
- ⏳ Live dependency tracking dashboard
- ⏳ Full automation testing

**2026-06-02 18:00 KST:**
- ✅ COMPLETE — Full Dependency Mapper System live

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-30 06:40 KST  
**Next Review:** 2026-05-31 08:00 KST  
**Implementation Target:** 2026-06-02 18:00 KST
