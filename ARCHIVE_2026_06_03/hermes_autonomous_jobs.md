---
name: Hermes Autonomous Jobs Schedule
description: Cron jobs and background tasks for Hermes autonomous agent (read-only mode, file-based output)
type: project
---

# Hermes Autonomous Jobs Schedule

**Effective Date:** 2026-05-19  
**Status:** Phase 1 (Passive Observation Mode)  
**User Mode:** Vacation autonomous operation

---

## Job Categories

### Category A: Daily CTB Status Snapshots
**Purpose:** Monitor current work state, detect blockers, provide summary alerts  
**Frequency:** Daily  
**Scope:** Read-only (CTB + memory files)  
**Output:** JSON + summary text file

#### Job A1: Morning Blocker Summary (08:00 KST)
```yaml
job_id: blocker-morning-summary
name: "【08:00】 Morning Blocker Detection"
schedule: "0 8 * * *"  # daily 08:00 KST
skill: codebase-inspection
input:
  file: "/home/jeepney/.openclaw/workspace-dev/memory/active_work_tracking.md"
  search_pattern: "🔴|⏳"  # blockers only
  output_format: "json"
output:
  location: "/home/jeepney/.hermes/sessions/blocker-morning-{date}.json"
  include_timestamp: true
actions:
  - parse CTB for 🔴 (waiting) and ⏳ (pending) items
  - extract blocker description + owner + expected resolution time
  - sort by impact (critical → medium → low)
  - save JSON output
notification:
  trigger: "3+ blockers detected"
  type: "file-only"  # OpenClaw will consume and format for user
  location: "/home/jeepney/.hermes/sessions/ALERT_{date}.txt"
owner: Hermes (read-only)
```

#### Job A2: Phase A Milestone Validation (14:00 KST)
```yaml
job_id: phase-a-milestone-check
name: "【14:00】 Phase A Checkpoint Validation"
schedule: "0 14 * * *"  # daily 14:00 KST
skill: codebase-inspection
input:
  file: "/home/jeepney/.openclaw/workspace-dev/memory/active_work_tracking.md"
  search_pattern: "Asset Master|Backup Phase|Audit System"
  check_list:
    - time_delta_tracking: "Expected: <5% slip"
    - next_task_pulled: "Expected: ETA adjusted in real-time"
    - completion_criteria_met: "Expected: ✅ 100% tasks completed per stage"
output:
  location: "/home/jeepney/.hermes/sessions/phase-a-validation-{date}.json"
  format: "validation_report"
actions:
  - read latest CTB state
  - check each Phase A item for schedule accuracy (vs plan)
  - validate time-delta adjustments applied correctly
  - flag items where ETA is overdue
  - mark items where completion criteria unclear
report_fields:
  - phase: "Asset Master Phase 2 / Backup Phase 2 / Audit System"
  - status: "✅ On Schedule / ⚠️ At Risk / 🔴 Overdue"
  - variance_days: "actual_completion_date - planned_eda"
  - last_update: "timestamp from CTB"
notification:
  trigger: "any ⚠️ or 🔴 detected"
  type: "validation_report_{date}.txt"
owner: Hermes (read-only)
```

#### Job A3: Daily Team Capacity Report (18:00 KST)
```yaml
job_id: team-capacity-daily
name: "【18:00】 Daily Team Capacity Utilization"
schedule: "0 18 * * *"  # daily 18:00 KST
skill: data-analytics
input:
  sources:
    - "/home/jeepney/.openclaw/workspace-dev/memory/active_work_tracking.md"
    - "/home/jeepney/.openclaw/workspace-dev/memory/team_capacity_matrix_final.md"
  extract:
    - active_members: count of 🟡 (in-progress tasks)
    - idle_members: count of no assignment
    - total_capacity_percent: sum(utilization%) / team_size
output:
  location: "/home/jeepney/.hermes/sessions/capacity-report-{date}.json"
  format: "csv + summary_text"
calculation:
  utilization_percent: (sum of estimated_hours for assigned_tasks) / (team_size × 8h)
  burndown_trend: "today_vs_yesterday_trend"
  recommended_actions: [list of suggestions if utilization <50% or >90%]
notification:
  type: "utilization_alert.txt"
  triggers:
    - "utilization < 50%": suggest pulling forward next tasks
    - "utilization > 90%": flag overallocation risk
owner: Hermes (read-only)
```

---

### Category B: Scheduled Background Information Gathering
**Purpose:** Collect background data for decision support (no database writes)  
**Frequency:** Varies (6-hourly to daily)  
**Scope:** Read-only (external APIs + local logs)  
**Output:** Data aggregation files

#### Job B1: Asset Health Metrics Scan (Every 6h)
```yaml
job_id: asset-health-6h
name: "【Every 6h】 Asset Health Snapshot"
schedule: "0 */6 * * *"  # every 6 hours
skill: codebase-inspection + data-analytics
input:
  api: "GET /api/assets/health" (read-only, no auth needed if public)
  extract:
    - total_assets: count
    - assets_online: count
    - assets_offline: count
    - last_sync: timestamp
output:
  location: "/home/jeepney/.hermes/sessions/asset-health-{datetime}.json"
  rolling_window: "keep 7 days of snapshots"
visualization:
  - trend: assets_online over time (line graph data)
  - threshold: alert if offline_count > 10% of total
actions:
  - log current health state
  - compare with previous snapshot
  - detect sudden drops (requires human investigation)
notification:
  type: "health_snapshot.json"
  critical_alert: "if offline_percent > 20%"
owner: Hermes (read-only)
```

#### Job B2: Portal DB Backup Verification (Daily 02:30 KST)
```yaml
job_id: backup-verification-daily
name: "【02:30】 Backup Integrity Verification"
schedule: "30 2 * * *"  # daily 02:30 KST (after Vercel Cron backup at 02:00)
skill: github-code-review + codebase-inspection
input:
  check_points:
    - backup_cron_last_execution: "Vercel Cron logs (read-only)"
    - backup_file_timestamp: "Latest file in Supabase Storage"
    - backup_size: "Compare with expected baseline ±10%"
output:
  location: "/home/jeepney/.hermes/sessions/backup-verification-{date}.json"
  status_indicators:
    - cron_executed: boolean
    - backup_file_exists: boolean
    - file_size_within_range: boolean
    - verification_passed: boolean
actions:
  - fetch Vercel Cron execution log (read-only)
  - query Supabase Storage metadata for latest backup
  - validate file exists and size matches expected
  - check timestamp is within 5min of scheduled time
  - alert if verification fails
notification:
  type: "verification_report.json"
  alert_trigger: "if verification_failed = true"
owner: Hermes (read-only, observation only)
```

---

### Category C: Weekly Comprehensive Audit
**Purpose:** Generate weekly summary for user review  
**Frequency:** Weekly (Mon 06:00 KST)  
**Scope:** Aggregated historical data from A + B categories  
**Output:** Comprehensive audit report

#### Job C1: Weekly Audit Summary (Mon 06:00 KST)
```yaml
job_id: weekly-audit-comprehensive
name: "【Mon 06:00】 Weekly Comprehensive Audit"
schedule: "0 6 * * 1"  # Monday 06:00 KST
skill: data-analytics + codebase-inspection
input:
  data_sources:
    - daily_blocker_snapshots: "past 7 days (A1)"
    - phase_validation_reports: "past 7 days (A2)"
    - capacity_reports: "past 7 days (A3)"
    - health_snapshots: "past 7 days (B1)"
    - backup_verifications: "past 7 days (B2)"
output:
  location: "/home/jeepney/.hermes/sessions/weekly-audit-{week}.json"
  format: "comprehensive_markdown_report + structured_json"
report_sections:
  1. Executive Summary (2-3 key metrics)
  2. Work Completion Rate (phase progress vs plan)
  3. Blocker Analysis (frequency, severity, resolution time)
  4. Team Utilization Trend (graph data for visualization)
  5. System Health Summary (assets, backups, infrastructure)
  6. Recommendations (3-5 actionable suggestions for next week)
calculations:
  - blocker_resolution_time_avg: mean of (blocker_detected → blocker_resolved)
  - schedule_adherence_percent: (on_time_tasks / total_tasks) × 100
  - capacity_trend: (utilization_Mon - utilization_Fri) to detect burnout
  - backup_reliability_percent: (successful_backups / 7) × 100
actions:
  - aggregate data from all daily jobs
  - perform time-series analysis on trends
  - identify patterns and anomalies
  - generate recommendations for user review
notification:
  type: "weekly-audit-report.md"
  location: "/home/jeepney/.hermes/sessions/weekly-audit-{week}.md"
owner: Hermes (read-only, aggregation only)
```

---

## Phase 1 Execution Plan (2026-05-19~06-02)

### Setup (Today, 2026-05-19)
- [ ] Hermes config: API keys, Telegram/Discord tokens
- [ ] Test first job manually: Job A1 (blocker detection)
- [ ] Validate file output: `/home/jeepney/.hermes/sessions/`
- [ ] OpenClaw integration: confirm it can read output files

### Week 1 Testing (2026-05-20~26)
- [ ] Run Job A1 daily @ 08:00 KST (monitor accuracy)
- [ ] Run Job A2 daily @ 14:00 KST (validate milestone checks)
- [ ] Run Job A3 daily @ 18:00 KST (capacity tracking)
- [ ] Review outputs for false positives / missing detections

### Validation Checkpoint (2026-05-27)
- [ ] All Category A jobs running without errors
- [ ] Accuracy rate ≥95% (blocker detection matches CTB reality)
- [ ] Output files consumable by OpenClaw pipeline
- **Decision:** Proceed to Category B jobs, or adjust A jobs?

### Week 2-3 Expansion (2026-05-28~06-02)
- [ ] Enable Category B jobs (6-hourly asset health, daily backup verification)
- [ ] Monitor for data accuracy
- [ ] Prepare Category C (weekly audit) for first run

---

## Safety Constraints

**Absolute Rules:**
1. ✅ Hermes is **read-only** — no writes to Supabase/Discord/Telegram
2. ✅ All outputs are **timestamped, auditable, file-based**
3. ✅ User can **disable any job** at runtime without affecting others
4. ✅ Job failures do **not cascade** (independent cron jobs)
5. ✅ OpenClaw **remains the single source of truth** for user messaging

**Failure Handling:**
- Job fails → write error log to `/home/jeepney/.hermes/logs/`
- OpenClaw monitors logs daily (manual check, no automation)
- User decides whether to re-enable, adjust, or remove failed job

---

## Configuration Files

### Hermes Config (Next: `hermes config edit`)
```yaml
# /home/jeepney/.hermes/config.yaml
models:
  default: "openai/gpt-4"
skills:
  enabled:
    - codebase-inspection
    - data-analytics
    - github-code-review
locations:
  workspace: "/home/jeepney/.openclaw/workspace-dev"
  output: "/home/jeepney/.hermes/sessions/"
  logs: "/home/jeepney/.hermes/logs/"
```

### Hermes Cron Definition (Next: Manual setup or CLI)
```bash
# Start Hermes gateway (background daemon for scheduled jobs)
hermes gateway install
systemctl enable hermes  # auto-start on reboot
```

---

## Current Status

| Job | Category | Status | Start Date | Notes |
|-----|----------|--------|-----------|-------|
| A1 (Blocker Summary) | Passive Obs | 🔴 Not Started | 2026-05-20 | Test Monday 08:00 |
| A2 (Phase A Validation) | Passive Obs | 🔴 Not Started | 2026-05-20 | Validate milestone checks |
| A3 (Capacity Report) | Passive Obs | 🔴 Not Started | 2026-05-20 | Track utilization trend |
| B1 (Asset Health) | Background | 🔴 Not Started | 2026-05-27 | After Phase 1 validation |
| B2 (Backup Verify) | Background | 🔴 Not Started | 2026-05-27 | Check Vercel Cron logs |
| C1 (Weekly Audit) | Audit | 🔴 Not Started | 2026-05-27 | First run: 2026-05-27 Mon 06:00 |

---

## Related Documents

- [Hermes Integration Architecture](hermes_integration_architecture.md) — System design + data flow
- [Active Work Tracking](active_work_tracking.md) — CTB (source for Hermes reads)
- [Audit System Framework](audit_system_framework.md) — Existing audit rules (Hermes enhances)

