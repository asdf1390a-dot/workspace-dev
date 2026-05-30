# Phase 2F Pre-Deployment Verification — Execution Readiness
**Status:** Ready for execution  
**Scheduled:** 2026-05-31 17:00 KST (60-minute window)  
**Production Deployment Window:** 2026-05-31 18:00 KST → 2026-06-01 09:00 KST (21 hours)

---

## ✅ Pre-Deployment Preparation Complete (2026-05-30)

### Environment Validation
- ✓ Node.js v22.22.2 (required: v16+)
- ✓ npm 10.9.7 (required: v8+)
- ✓ Workspace directory: `/home/jeepney/.openclaw/workspace-dev`
- ✓ Log directory: `/home/jeepney/.openclaw/workspace-dev/memory/logs/` (writable)

### Service Deployment Status
- ✓ **Phase 2A** (Message Collection): Running on port 3009, PID 144156, health PASSED
- ✓ **Phase 2B** (Duplicate Detection): Running on port 3010, PID 144240, health PASSED
- ✓ **Phase 2C** (Trust Score Monitoring): Status checked via cron

### Cron Automation Testing
- ✓ **phase2a-cron.sh**: Tested — 361 messages extracted, 23 new saved, 338 duplicates identified
- ✓ **phase2b-cron.sh**: Tested — 387 messages processed, 365 unique, 5.7% reduction, 27ms runtime
- ✓ **phase2c-monitoring-cron.sh**: Status monitoring ready

### Log Infrastructure
- ✓ All operational logs verified at `/home/jeepney/.openclaw/workspace-dev/memory/logs/`
- ✓ Continuous logging confirmed from Phase 2A, 2B, 2D, 2E operations

---

## 📋 Phase 2F Pre-Deployment Verification Checklist (2026-05-31 17:00)

### Step 1: Environment Re-Validation (5 minutes)
**Execute:**
```bash
node --version
npm --version
ls -la /home/jeepney/.openclaw/workspace-dev/memory/logs
env | grep -E "NODE_ENV|WORKSPACE_DIR|PORT"
```

**Success Criteria:**
- Node.js v16+ installed
- npm v8+ installed
- Log directory exists and is writable
- Environment variables set correctly

---

### Step 2: Service Health Check (10 minutes)
**Execute:**
```bash
# Phase 2A (port 3009)
curl -s http://localhost:3009/health && echo "✓ 2A OK" || echo "✗ 2A FAILED"

# Phase 2B (port 3010)
curl -s http://localhost:3010/health && echo "✓ 2B OK" || echo "✗ 2B FAILED"

# Phase 2C (port 3011) — if configured
curl -s http://localhost:3011/health 2>/dev/null && echo "✓ 2C OK" || echo "⚠ 2C status"
```

**Success Criteria:**
- Phase 2A returns: `{"status":"ready",...}`
- Phase 2B returns: `{"status":"ready",...}`
- Both health endpoints respond within 2 seconds

---

### Step 3: Cron Script Execution (20 minutes)

**Phase 2A Cron Test:**
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
bash phase2a-cron.sh
```

**Expected Output:**
```
[timestamp] [INFO] Starting Phase 2A message collection
[timestamp] [INFO] Extracted XXX messages
[timestamp] [INFO] Saved XX new entries
✅ Phase 2A cron execution SUCCESS
```

**Phase 2B Cron Test:**
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
bash phase2b-cron.sh
```

**Expected Output:**
```
[timestamp] [INFO] Starting Phase 2B deduplication
[timestamp] [INFO] Layer 1 (Exact Hash): XXX unique
[timestamp] [INFO] Layer 2 (Prefix): XXX unique
[timestamp] [INFO] Final: XXX deduplicated
✅ Phase 2B cron execution SUCCESS
```

**Success Criteria:**
- Both scripts complete without errors
- Output logged to `/home/jeepney/.openclaw/workspace-dev/memory/logs/`
- Deduplicated output files generated

---

### Step 4: Log File Generation (5 minutes)

**Verify:**
```bash
ls -lah /home/jeepney/.openclaw/workspace-dev/memory/logs/ | grep phase2
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-*.log
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-*.log
```

**Success Criteria:**
- Log files exist for all three phases
- Most recent log timestamp within last 5 minutes
- No ERROR lines in log output
- Metrics present (messages processed, dedup rate, execution time)

---

### Step 5: Success Criteria Validation (10 minutes)

**Checklist:**
```
□ All environment variables correctly set
□ Phase 2A service health: PASSED
□ Phase 2B service health: PASSED
□ Phase 2A cron: executed successfully
□ Phase 2B cron: executed successfully
□ Phase 2C monitoring: confirmed operational
□ Log files: generated and accessible
□ No errors in any log output
□ Deduplication metrics: within expected ranges
```

---

## 🚀 Go/No-Go Determination

**GO Decision Criteria (all required):**
- ✓ All 5 environment checks pass
- ✓ All 3 service health checks return ready status
- ✓ All 2 cron scripts execute without errors
- ✓ All log files generated with expected metrics
- ✓ No blocking errors identified

**If GO:** Proceed to Phase 2F Production Deployment at 18:00 KST  
**If NO-GO:** Document failure reason, investigate root cause, defer deployment 24 hours

---

## 📌 Critical Deployment Commands (For Phase 2F Execution)

**If Phase 2F Pre-Deployment Verification passes, these commands will execute the 21-hour production deployment:**

```bash
# Register cron jobs via OpenClaw system
mcp__openclaw__cron action=add job="{...phase2a-cron schedule...}"
mcp__openclaw__cron action=add job="{...phase2b-cron schedule...}"
mcp__openclaw__cron action=add job="{...phase2c-monitoring schedule...}"

# Alternative: Register in system crontab
# 0 0,6,12,18 * * * /path/to/phase2a-cron.sh
# 0 2,6,10,14,18,22 * * * /path/to/phase2b-cron.sh
# 0 * * * * /path/to/phase2c-monitoring-cron.sh
```

---

## ⏰ Timeline

| Time | Task | Owner | Duration |
|------|------|-------|----------|
| 2026-05-31 17:00 | Pre-Deployment Verification | System | 60 min |
| 2026-05-31 18:00 | Phase 2F Production Deployment Start | System | 21 hours |
| 2026-06-01 09:00 | Phase 2F Production Deployment Complete | System | — |
| 2026-06-02 18:00 | Team Dashboard P2 UI Deadline | Design-Specialist #11 | — |

---

**Document Generated:** 2026-05-30 (Preparation Complete)  
**Status:** Awaiting 2026-05-31 17:00 KST execution window
