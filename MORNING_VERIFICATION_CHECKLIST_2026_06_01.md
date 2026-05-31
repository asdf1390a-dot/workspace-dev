# ☀️ Morning Verification Checklist
**Date:** 2026-06-01  
**Time Window:** 06:00-09:00 KST  
**Prepared by:** Night Shift Automation (2026-05-31 23:27 KST)

---

## ✅ Pre-Phase-6 Verification (06:00 KST)

Execute this checklist first thing in the morning before starting Phase 6.

### 1. Service Health Check (2 minutes)
```bash
for port in 3009 3010 3011 9000; do
  echo "Port $port:" && \
  curl -s http://127.0.0.1:$port/health | jq . || echo "NO RESPONSE"
done
```
**Expected:** All 4 ports return `{"status":"ready"}`

### 2. Phase 5 Status (1 minute)
```bash
# Check if Phase 5 is still running
ps aux | grep phase2f-8hr-stability | grep -v grep

# OR check log tail
tail -10 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-stability-test.log
```
**Expected:** 
- Process running OR completed
- Last log shows Cycle N at current time or recently
- All services UP in latest report

### 3. Disk Space Check (1 minute)
```bash
df -h /home/jeepney/.openclaw/workspace-dev
du -sh /home/jeepney/.openclaw/workspace-dev/memory/logs/*
```
**Expected:** 
- Root filesystem: >10% free
- Log directory: <5GB

### 4. Recent Cycles Count (1 minute)
```bash
# Count cycles completed
grep "Cycle #" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-stability-test.log | tail -1
```
**Expected:** Cycle # much higher than 368 (old baseline)

**Status Decision:**
- ✅ All 4 items pass → **PROCEED TO PHASE 6**
- ❌ Any item fails → **Troubleshoot before proceeding**

---

## 🚀 Phase 6 Execution (06:00-08:00 KST)

Once Phase 5 verification passes:

### Execute Phase 6 (Baseline Collection)
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
bash phase2f-baseline-collection.sh
```

**Expected Output:**
- Metrics collected from stability test
- Baseline report written to: `/memory/logs/phase2f-baseline-report.json`
- Summary of: cycles, success rate, uptime, service status
- Regression thresholds validated

**Duration:** ~30 minutes (06:00-06:30 expected)

**File to Check After:**
```bash
cat /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json | jq .
```

---

## ✅ Pre-Phase-7 Verification (08:00 KST)

Before Phase 7, verify Phase 6 completed successfully:

### 1. Baseline Report Generated (1 minute)
```bash
ls -lah /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json
```
**Expected:** File exists and is >100 bytes

### 2. Check Report Contents (1 minute)
```bash
jq '.metrics' /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-baseline-report.json
```
**Expected:** 
- `total_cycles`: >500
- `success_rate`: ≥99%
- `avg_cycle_time`: <5000ms
- `service_uptime`: ≥95%

### 3. Services Still Running (1 minute)
```bash
for port in 3009 3010 3011 9000; do
  timeout 2 curl -s http://127.0.0.1:$port/health > /dev/null && echo "✅ $port" || echo "❌ $port"
done
```
**Expected:** All 4 ports UP

**Status Decision:**
- ✅ All checks pass → **PROCEED TO PHASE 7**
- ❌ Any check fails → **Investigate before proceeding**

---

## 🎯 Phase 7 Execution (08:00-09:00 KST)

Final validation and GO/NO-GO decision:

### Execute Phase 7 (Final Validation)
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
bash phase2f-final-validation.sh
```

**Expected Output:**
- 14 regression tests execute
- Test results logged to: `/memory/logs/phase2f-final-report.md`
- GO/NO-GO decision rendered

**What Phase 7 Tests:**
1. Service regression (4 tests)
2. Performance regression (2 tests)
3. Data integrity (3 tests)
4. Alert system (2 tests)
5. Operational checklist (3 tests)

**File to Check After:**
```bash
cat /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-final-report.md
```

---

## 📊 Expected Results Summary

### Phase 5 (Stability Test) — Completed Overnight
| Metric | Target | Expected |
|--------|--------|----------|
| Total cycles | N/A | 900+ (8 hours × 120 cycles/hour) |
| Success rate | ≥95% | ≥99% |
| Avg cycle time | <5000ms | ~50-100ms |
| Service uptime | ≥95% | ≥99% |
| Alerts | N/A | 0-3 expected |

### Phase 6 (Baseline Collection)
| Metric | Purpose |
|--------|---------|
| Cycle statistics | Baseline for future regression detection |
| Service status | Confirm all 4 services up at test end |
| Performance data | Compare against threshold values |
| Resource metrics | Disk, memory, CPU during test |

### Phase 7 (Final Validation)
| Outcome | Meaning |
|---------|---------|
| 🟢 GO | All 14 tests pass → **DEPLOYMENT APPROVED** |
| 🔴 NO-GO | Any test fails → **INVESTIGATION REQUIRED** |

---

## 🆘 Troubleshooting Guide

### Symptom: Phase 5 Process Not Running
**Check:** `ps aux | grep phase2f-8hr`
**Action:**
1. Check `/tmp/phase5_watchdog.log` for restart records
2. Manually restart: `bash phase2f-8hr-stability-test.sh`
3. Verify services first with curl health checks

### Symptom: Service Not Responding (port down)
**Action:**
```bash
# Check which service is down
curl -s http://127.0.0.1:PORT/health

# Check if process exists
ps aux | grep "node" | grep -v grep

# Restart service (examples)
PORT=3009 nohup node phase2a-message-collection.js &
PORT=3010 nohup node phase2b-express-wrapper.js &
PORT=3011 nohup node phase2c-express-wrapper.js &
PORT=9000 nohup node phase2f-alert-dispatcher.js &
```

### Symptom: Phase 6/7 Script Fails
**Action:**
1. Check log file for specific error
2. Verify all services are up
3. Check disk space: `df -h`
4. Check MEMORY.md exists: `ls -lah /path/to/MEMORY.md`
5. Retry script execution

### Symptom: Phase 7 Test Failures
**Action:**
1. Review `phase2f-final-report.md` for failed test details
2. Check service logs for errors
3. Verify data integrity of MEMORY.md
4. Contact deployment team for next steps

---

## 📞 Team Contacts & Escalation

**Phase Owners:**
- Phase 5-7: DevOps Engineer (Phase C #12)
- Regression Testing: QA Specialist (Phase C #14)
- Final Decision: Project Planner (Phase C #15)

**Escalation:**
- Any Phase test failure → Immediate team notification
- Service crash → Restart + notify DevOps
- Data integrity issue → Preserve logs + escalate

---

## 📋 Sign-Off

**Prepared:** 2026-05-31 23:27 KST by Night Shift Automation  
**Status:** ✅ All systems running, Phase 5 active  
**Next Action:** Review this checklist at 06:00 KST  

**Quick Reference:**
- 06:00 — Verify Phase 5 still running
- 06:00 — Execute Phase 6 (Baseline Collection)
- 08:00 — Execute Phase 7 (Final Validation)
- 09:00 — Deployment window closes

All Phase 2F infrastructure is prepared and monitored. Team ready for morning execution.

