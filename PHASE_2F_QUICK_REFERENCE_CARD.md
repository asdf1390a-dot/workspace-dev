# Phase 2F Execution Quick Reference
**Execution Day: 2026-05-31**  
**Status: READY** ✅

---

## 🌅 Morning (2026-05-31 08:00 - 16:30)

### Pre-Flight Checklist (10 Steps - Complete by 16:00)

| Step | Time | Task | Status |
|------|------|------|--------|
| 1 | 08:00 | System Health Check | ✓ Ready |
| 2 | 09:00 | Service Pre-Check (2A/2B/2C) | ✓ Ready |
| 3 | 10:00 | Log Readiness | ✓ Ready |
| 4 | 11:00 | Environment Variables | ✓ Ready |
| 5 | 12:00 | Script Validation | ✓ Ready |
| 6 | 13:00 | Documentation Review | ✓ Ready |
| 7 | 14:00 | Team Notification | ✓ Ready |
| 8 | 15:00 | Final System Check | ✓ Ready |
| 9 | 15:30 | Backup & Safeguard | ✓ Ready |
| 10 | 16:00 | GO/NO-GO Decision | ⏳ Pending |

**Reference:** `PHASE_2F_MORNING_CHECKLIST.md`

---

## ⚡ Critical Verification Window (2026-05-31 17:00 - 18:00)

### 5 Mandatory Steps (60 minutes)

```bash
# Step 1: Environment Re-Validation (5 min)
node --version
npm --version
ls -la /home/jeepney/.openclaw/workspace-dev/memory/logs
env | grep -E "NODE_ENV|WORKSPACE_DIR|PORT"

# Step 2: Service Health Checks (10 min)
curl -s http://localhost:3009/health && echo "✓ 2A OK"
curl -s http://localhost:3010/health && echo "✓ 2B OK"
curl -s http://localhost:3011/health && echo "✓ 2C OK"

# Step 3: Cron Script Execution (20 min)
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
bash phase2a-cron.sh
bash phase2b-cron.sh

# Step 4: Log File Generation (5 min)
ls -lah /home/jeepney/.openclaw/workspace-dev/memory/logs | grep phase2
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-*.log

# Step 5: Success Criteria Validation (20 min)
# Checklist: All env ✓ | 2A health ✓ | 2B health ✓ | 2A cron ✓ | 2B cron ✓ | Logs ✓ | No errors ✓
```

**Result:** GO (proceed to deployment) or NO-GO (defer 24h)

---

## 🚀 Production Deployment (2026-05-31 18:00 - 2026-06-01 09:00)

### If GO Decision Confirmed

**21-hour production window:**
- All three cron jobs actively running on schedule
- Message collection and deduplication executing normally
- Health endpoints responding with `{"status":"ready"}`
- Log files generated with expected metrics
- Zero service failures
- Trust score calculator operational

**Success Criteria:** All items above ✓ by 2026-06-01 09:00

---

## 📋 Key File Paths

| Purpose | Path |
|---------|------|
| Message Collection API | `/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-message-collection.js` |
| Duplicate Detection | `/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-duplicate-detection.js` |
| Trust Score Calculator | `/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-trust-score-calculator.js` |
| Cron Scripts | `/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2[a-c]-cron.sh` |
| Logs Directory | `/home/jeepney/.openclaw/workspace-dev/memory/logs/` |
| Execution Guide | `/home/jeepney/.openclaw/workspace-dev/PHASE_2F_EXECUTION_READINESS.md` |
| Status Report | `/home/jeepney/.openclaw/workspace-dev/PHASE_2F_READINESS_STATUS.md` |
| Morning Checklist | `/home/jeepney/.openclaw/workspace-dev/PHASE_2F_MORNING_CHECKLIST.md` |

---

## ✅ Pre-Verification Status (2026-05-30)

- ✓ Phase 2A: Running (port 3009, PID verified)
- ✓ Phase 2B: Running (port 3010, tested, O(n) validated)
- ✓ Phase 2C: Ready (trust score calculator complete)
- ✓ Phase 2D: Ready (cron integration verified)
- ✓ Phase 2E: Complete (97% code coverage, 100% tests pass)
- ✓ All scripts executable and tested
- ✓ Log infrastructure operational
- ✓ Documentation complete

---

## 🚨 If Issues Occur

### Phase 2A Down
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
bash phase2a-deploy.sh start
bash phase2a-deploy.sh check
```

### Phase 2B Down
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
bash phase2b-deploy.sh start
bash phase2b-deploy.sh check
```

### Check Logs
```bash
grep -i "ERROR\|FAIL" /home/jeepney/.openclaw/workspace-dev/memory/logs/*.log
```

---

## ⏰ Timeline Summary

| Time | Event | Duration |
|------|-------|----------|
| 2026-05-31 08:00 | Morning pre-flight checklist starts | 8h |
| 2026-05-31 16:00 | GO/NO-GO decision point | — |
| 2026-05-31 17:00 | Verification window begins | 60 min |
| 2026-05-31 18:00 | Production deployment begins | 21 hours |
| 2026-06-01 09:00 | Production deployment complete | — |

---

**Card Created:** 2026-05-30 (Execution Eve)  
**Next Action:** Execute morning checklist at 08:00 KST on 2026-05-31  
**Status:** ✅ READY FOR EXECUTION
