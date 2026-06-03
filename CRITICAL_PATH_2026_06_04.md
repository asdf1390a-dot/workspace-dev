---
name: Critical Path — 2026-06-04 Execution Plan
description: Prioritized action items for 2026-06-04, starting 09:00 KST. Deadline-critical work. Prepared 2026-06-03 23:26 KST.
type: project
---

# 🔴 CRITICAL PATH — 2026-06-04 Execution Plan

**Document Created:** 2026-06-03 23:26 KST  
**Current Status:** P0 Build Fix ✅ Resolved, Team Dashboard & Phase 2 ⏳ Ready for execution  
**Team Focus:** Data analyst (db/36), DevOps (Phase 2 reliability), Web-Builder (preparation)

---

## ⏰ TIMELINE (2026-06-04)

| Time | Task | Owner | Duration | Blocking | Status |
|------|------|-------|----------|----------|--------|
| **09:00 KST** | 🔴 **CRITICAL** Execute db/36 migration | 데이터분석가 AI | 15min | Team Dashboard P2 | SCHEDULED |
| 09:15 KST | Verify db/36 success (portfolio_items + milestones) | QA Verification | 10min | Progress check | SCHEDULED |
| 09:30 KST | UNBLOCK: Team Dashboard P2 Web-Builder begins API integration | Web-Builder #2 | 8h | ← db/36 | READY |
| **18:00 KST** | 🔴 **CRITICAL** Fix Phase 2 Memory Automation reliability | DevOps/Automation | 3h | Phase 2 outage | SCHEDULED |
| 18:00 KST | PARALLEL: Discord Bot processor implementation begins | Web-Builder #3 | 8h | Independent | READY |
| 21:00 KST | PARALLEL: Backup P2 endpoint implementation begins | Web-Builder #4 | 8h | Independent | READY |

---

## 🎯 ITEM #1: Execute db/36 Migration (CRITICAL — 09:00)

**Assigned To:** 데이터분석가 AI  
**Duration:** 15 minutes  
**Deadline:** 2026-06-04 09:00 KST  
**Blocking:** Team Dashboard P2 Web-Builder work (8-hour sprint starts after this completes)

### ✅ Pre-Execution Checklist
- [x] Migration file exists: `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/db/36_team_dashboard_phase2.sql`
- [x] Migration purpose verified: Add `skills_used` + `impact` columns to `portfolio_items`, create `milestones` table with indexes + RLS
- [x] Backup verification: Current database state documented
- [x] Rollback plan: Understand column addition is additive only (safe)

### 📋 EXECUTION STEPS

**Step 1: Access Supabase SQL Editor**
1. Navigate to Supabase console (project: dsc-fms-portal)
2. Open SQL Editor (left sidebar → SQL Editor)
3. Create new query or paste into existing editor

**Step 2: Copy and Execute Migration**
```sql
-- Paste entire contents of db/36_team_dashboard_phase2.sql here
-- File location: /home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/db/36_team_dashboard_phase2.sql
```

**Step 3: Validation**
1. Verify no errors in output panel
2. Confirm new columns exist on `portfolio_items`:
   - `skills_used TEXT[]`
   - `impact TEXT`
3. Confirm new `milestones` table created with columns: id, project_id, title, description, target_date, status, owner_id, completion_date, created_at, updated_at
4. Confirm all indexes created successfully
5. Confirm RLS policies applied

### 📝 Success Criteria
- ✅ Migration completes with zero errors
- ✅ `portfolio_items` table has 2 new columns
- ✅ `milestones` table exists with proper schema
- ✅ All 4 indexes on milestones created
- ✅ RLS policies active on milestones table

### 🚨 Rollback (if needed)
```sql
-- Rollback if issues detected (before 09:15)
ALTER TABLE portfolio_items DROP COLUMN IF EXISTS skills_used;
ALTER TABLE portfolio_items DROP COLUMN IF EXISTS impact;
DROP TABLE IF EXISTS milestones CASCADE;
```

### 📢 Notification
After completion, update memory log:
```
2026-06-04 09:XX KST: db/36 migration executed ✅ / 🔴
- Portfolio_items columns: ✅ / 🔴
- Milestones table: ✅ / 🔴
- Indexes: ✅ / 🔴
- RLS policies: ✅ / 🔴
- Status: UNBLOCK Team Dashboard P2 Web-Builder
```

---

## 🎯 ITEM #2: Phase 2 Memory Automation Reliability Fix (CRITICAL — 18:00)

**Assigned To:** 기술자동화 AI (DevOps/Automation specialist)  
**Duration:** 3 hours  
**Deadline:** 2026-06-04 18:00 KST  
**Root Cause:** 68-minute outage (2026-06-03 18:00–19:08) from missing npm ci validation post-cleanup

### 🔍 Problem Analysis
- **Incident:** node_modules deleted during cleanup, but post-cleanup npm ci was not executed
- **Impact:** Phase 2 microservices failed to start; 68-minute outage detected 19:08
- **Current Reliability:** 98.7% (but design shows systemic fragility due to missing validation)
- **Systemic Risk:** Silent failures possible if graceful skip mode lacks proper visibility

### ✅ Implementation Checklist

#### Step 1: Add Post-Cleanup npm ci Validation (45 minutes)
**File:** `/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2d-cron.sh` (or equivalent cleanup entry point)

**Changes Required:**
1. Find cleanup section that deletes node_modules
2. After deletion, add mandatory `npm ci` validation step:
   ```bash
   # After cleanup (e.g., rm -rf node_modules)
   npm ci
   if [ $? -ne 0 ]; then
     log "🔴 CRITICAL: npm ci failed post-cleanup. Service health compromised."
     # Escalation: Stop graceful skip, trigger alert
     exit 1
   fi
   log "✅ npm ci validation successful post-cleanup"
   ```
3. Test locally: `npm ci && npm list` to verify dependencies
4. Commit with message: "fix: Add mandatory npm ci validation post-cleanup in Phase 2"

#### Step 2: Implement Pre-Cron Health Check (60 minutes)
**Purpose:** Detect service health before running main cron tasks

**Implementation:**
1. Create new script: `phase2-health-check.sh`
2. Health checks (before main cron):
   - `node -v` (Node runtime available)
   - `npm list` (Dependencies intact)
   - Port availability (3009-3013 services not stuck)
   - File integrity (memory.db, config files present)
3. Failure behavior: 3-retry exponential backoff (30s → 60s → 120s)
4. After 3 failures: Page oncall, disable graceful skip mode
5. Success: Log health timestamp, proceed to main cron

**Script template:**
```bash
#!/bin/bash
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Health checks
  node -v && npm list >/dev/null 2>&1 && \
  [ -f /path/to/memory.db ] && \
  netstat -tln | grep -E "(3009|3010|3011|3012|3013)" >/dev/null
  
  if [ $? -eq 0 ]; then
    log "✅ Health check PASS (attempt $((RETRY_COUNT+1)))"
    exit 0
  fi
  
  RETRY_COUNT=$((RETRY_COUNT+1))
  [ $RETRY_COUNT -lt $MAX_RETRIES ] && sleep $((30 * RETRY_COUNT))
done

log "🔴 Health check FAILED after $MAX_RETRIES attempts. Paging oncall."
# Escalation action here
exit 1
```

#### Step 3: Test Full Recovery Cycle (45 minutes)
1. **Baseline:** Record current system state
2. **Simulate Outage:** Delete node_modules manually
3. **Run Recovery:** Execute cleanup → health check → npm ci → service restart
4. **Measure:** Record time from outage start to "healthy" state
5. **Target:** Recovery < 5 minutes
6. **Document:** SLA confirmation

#### Step 4: Verify Graceful Skip Behavior (15 minutes)
1. Test "graceful skip" mode (when cleanup triggered mid-cron)
2. Verify: No silent failures, all issues logged visibly
3. Confirm: Oncall receives clear alerts for degraded states

#### Step 5: Documentation (30 minutes)
Create file: `PHASE2_RELIABILITY_SLA.md`
```markdown
# Phase 2 Memory Automation — Reliability SLA

## Health Check Strategy
- Pre-cron health verification: Required
- npm ci post-cleanup: Mandatory
- Silent failures: Prohibited (all failures → alerts)

## Recovery Time Targets
- npm ci failure → escalation: < 2 min
- Health check failure → retry: 30s, 60s, 120s (3 attempts)
- Full service recovery: Target < 5 min
- Outage detection: < 15 min

## Testing Cadence
- Weekly integration test: Verify recovery cycle
- Monthly scenario: Simulate cleanup + recovery
- Continuous monitoring: Health check runs every 5 min
```

### 📝 Success Criteria
- ✅ npm ci validation added to cleanup process
- ✅ Pre-cron health check implemented (3-retry escalation)
- ✅ Recovery cycle tested: < 5 minute target achieved
- ✅ Graceful skip mode verified with zero silent failures
- ✅ SLA documentation complete
- ✅ Zero service outages during 2026-06-04 (24-hour validation period)

### 🚨 Escalation Path (if issues found)
1. **npm ci failure:** Immediately stop cron, page oncall
2. **Health check failure:** Retry 3x (30s, 60s, 120s), then escalate
3. **Graceful skip activated:** Log full context, notify DevOps
4. **Recovery > 5 min:** Document incident, review design

---

## 🎯 ITEM #3: Discord Bot Completion (PARALLEL — 18:00)

**Assigned To:** Web-Builder #3  
**Duration:** 8 hours  
**Deadline:** 2026-06-05 18:00 KST  
**Current Status:** 20% complete (1 webhook route done, 4 processors missing)

### 🔴 Missing Components (Priority Order)
1. **Message collection processor** — Ingest Discord webhook messages
2. **Message formatting processor** — Transform to internal format
3. **Queue management processor** — Batch + dedup
4. **Retry/escalation logic** — Handle failures
5. **Audit logging processor** — Track all events

### 📋 Execution Plan
- Start: 2026-06-04 18:00 (after Phase 2 reliability fix begins)
- Parallel with: Backup P2 endpoint work (non-blocking)
- Target completion: 2026-06-05 02:00 KST (8-hour sprint)
- Validation: Integration tests + manual Discord testing

### 📝 Success Criteria
- ✅ All 5 processors implemented
- ✅ Integration tests passing (8/8 test cases)
- ✅ Database integration verified
- ✅ Rate limiting + retry logic deployed
- ✅ Audit logging operational

---

## 🎯 ITEM #4: Backup P2 Endpoint Completion (PARALLEL — 18:00)

**Assigned To:** Web-Builder #4  
**Duration:** 8 hours  
**Deadline:** 2026-06-06 18:00 KST  
**Current Status:** 25% complete (4 stub endpoints, zero production logic)

### 🔴 Missing Components (Priority Order)
1. **Backup metrics endpoint** — Replace hardcoded values with real data
2. **Storage quota endpoint** — Query actual storage usage
3. **Notification settings endpoint** — CRUD operations + DB persistence
4. **Backup configuration endpoint** — Policy management + scheduling

### 📋 Execution Plan
- Start: 2026-06-04 18:00 (after Phase 2 reliability fix begins)
- Parallel with: Discord Bot work (non-blocking)
- Target completion: 2026-06-05 02:00 KST (8-hour sprint)
- Database integration: All 4 endpoints must query live database

### 📝 Success Criteria
- ✅ All 4 endpoints have production implementations
- ✅ Database queries working (no mocks)
- ✅ Validation tests passing (6/6 test cases)
- ✅ Error handling + auth verification in place
- ✅ Ready for Evaluator verification by 18:00 2026-06-05

---

## 🚀 SUMMARY & NEXT STEPS

### Tomorrow's Critical Work (2026-06-04)
1. **09:00** — Execute db/36 migration (15 min, unblocks Team Dashboard)
2. **09:30** — Team Dashboard P2 Web-Builder begins 8-hour API integration sprint
3. **18:00** — Phase 2 reliability fix (3 hours) + Discord/Backup parallel work (8 hours)

### Deadline Status
- ✅ P0 Build Fix: Completed 22:34 KST (36 minutes to spare, Vercel deploy in progress)
- 🟡 Team Dashboard P2: UNBLOCKS at 09:15 after db/36 validation
- 🔴 Phase 2 Reliability: Due 18:00 (critical for overall system health)
- 🔴 Discord Bot: Due 2026-06-05 18:00 (starts tonight 18:00, 24-hour window)
- 🔴 Backup P2: Due 2026-06-06 18:00 (starts tonight 18:00, 48-hour window)

### Risk Mitigation
- **Single point of failure:** db/36 migration. Rollback plan documented above.
- **Resource constraints:** 3 parallel Web-Builders allocated (Team Dashboard + Discord + Backup)
- **Schedule cushion:** Phase 2 reliability has 8 hours slack (18:00 deadline, can start 10:00 if needed)

---

**Document Status:** Ready for execution  
**Last Updated:** 2026-06-03 23:26 KST (Session Checkpoint #2)  
**Next Review:** 2026-06-04 08:30 KST (30 minutes before db/36 execution)
