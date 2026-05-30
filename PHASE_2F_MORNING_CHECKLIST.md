# Phase 2F Morning Pre-Flight Checklist
**Date:** 2026-05-31 (Execution Day)  
**Time Window:** Morning → 17:00 KST Verification  
**Critical Path:** Verification (17:00) → Deployment (18:00 start)

---

## ✅ Morning Preparation Tasks (Complete Before 16:30)

### 1. System Health Check (08:00 KST)
**Execute immediately after system startup:**

```bash
# Verify system resources
free -h                    # Check memory availability
df -h /home              # Check disk space (need 1GB+ free)
ps aux | grep node       # Verify running processes
uptime                   # Check system uptime

# Verify critical directories
ls -la /home/jeepney/.openclaw/workspace-dev/memory-automation/
ls -la /home/jeepney/.openclaw/workspace-dev/memory/logs/
```

**Success Criteria:**
- [ ] Memory: 30%+ available
- [ ] Disk: 1GB+ free space
- [ ] Uptime: 1+ hour (system stable)
- [ ] Both directories present and accessible

---

### 2. Service Pre-Check (09:00 KST)
**Verify all services are still running from yesterday:**

```bash
# Phase 2A
curl -s http://localhost:3009/health | grep -q "ready" && echo "✓ 2A OK" || echo "✗ 2A DOWN"

# Phase 2B
curl -s http://localhost:3010/health | grep -q "ready" && echo "✓ 2B OK" || echo "✗ 2B DOWN"

# Phase 2C (if applicable)
curl -s http://localhost:3011/health 2>/dev/null | grep -q "ready" && echo "✓ 2C OK" || echo "⚠ 2C status"
```

**If Any Service is DOWN:**
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation

# Restart Phase 2A
bash phase2a-deploy.sh start
sleep 2
bash phase2a-deploy.sh check

# Restart Phase 2B
bash phase2b-deploy.sh start
sleep 2
bash phase2b-deploy.sh check
```

**Success Criteria:**
- [ ] Phase 2A: RUNNING (port 3009)
- [ ] Phase 2B: RUNNING (port 3010)
- [ ] Phase 2C: Status confirmed
- [ ] All health checks: PASSED

---

### 3. Log Readiness (10:00 KST)
**Verify log infrastructure is operational:**

```bash
# Check log directory
ls -lah /home/jeepney/.openclaw/workspace-dev/memory/logs/

# Verify recent log entries
tail -5 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-deploy.log
tail -5 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-deploy.log

# Check for any ERROR entries from overnight
grep -i "ERROR" /home/jeepney/.openclaw/workspace-dev/memory/logs/*.log | head -5
```

**Success Criteria:**
- [ ] Log directory exists and is writable
- [ ] Recent timestamps in log files (within last hour)
- [ ] NO ERROR entries overnight
- [ ] Logging system operational

---

### 4. Environment Variable Validation (11:00 KST)
**Confirm all environment variables are set correctly:**

```bash
env | grep -E "NODE_ENV|WORKSPACE_DIR|PORT|DATABASE|API"
```

**Expected Variables (should exist):**
- [ ] NODE_ENV = production or development
- [ ] WORKSPACE_DIR = /home/jeepney/.openclaw/workspace-dev
- [ ] At least one PORT variable (if configured)

---

### 5. Script Validation (12:00 KST)
**Quick validation that cron scripts are executable and accessible:**

```bash
ls -l /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2*.sh
chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2*.sh
```

**Success Criteria:**
- [ ] phase2a-cron.sh: present, executable
- [ ] phase2b-cron.sh: present, executable
- [ ] phase2c-monitoring-cron.sh: present, executable
- [ ] All scripts have execute permissions (x flag)

---

### 6. Documentation Review (13:00 KST)
**Final review of execution documents:**

**Read and understand:**
- [ ] PHASE_2F_EXECUTION_READINESS.md — Detailed step-by-step verification plan
- [ ] PHASE_2F_READINESS_STATUS.md — Full system status and success criteria
- [ ] CRON_DEPLOYMENT_CHECKLIST.md — Comprehensive deployment guide

**Identify:**
- [ ] Any questions or clarifications needed
- [ ] Any potential blockers or risks
- [ ] Exact command syntax for verification steps

---

### 7. Team Notification (14:00 KST)
**Ensure team is aware and prepared:**

```bash
# Example notification (via Telegram/Discord):
# "NOTIFICATION: Phase 2F Pre-Deployment Verification scheduled for 2026-05-31 17:00 KST
#  All systems prepared and ready for 60-minute verification window.
#  Production deployment follows immediately at 18:00 if verification passes."
```

**Success Criteria:**
- [ ] Team informed of 17:00 verification window
- [ ] Go/No-Go decision point communicated
- [ ] Escalation path documented (if issues arise)

---

### 8. Final System Check (15:00 KST)
**One hour before verification - final health check:**

```bash
# Re-run all checks from Step 2
curl -s http://localhost:3009/health | grep "ready"
curl -s http://localhost:3010/health | grep "ready"

# Check disk space one more time
df -h / | tail -1

# Check for any new errors in logs
grep -i "ERROR\|FAIL\|CRITICAL" /home/jeepney/.openclaw/workspace-dev/memory/logs/*.log | tail -3
```

**Success Criteria:**
- [ ] Both services: READY
- [ ] Disk space: 1GB+ free
- [ ] Logs: No critical errors

---

### 9. Backup & Safeguard (15:30 KST)
**Create snapshot of current state before verification:**

```bash
# Create backup of critical logs
mkdir -p /home/jeepney/.openclaw/workspace-dev/memory/logs/backup-2026-05-31
cp /home/jeepney/.openclaw/workspace-dev/memory/logs/*.log /home/jeepney/.openclaw/workspace-dev/memory/logs/backup-2026-05-31/

# Document current PIDs
ps aux | grep -E "phase2|node" > /home/jeepney/.openclaw/workspace-dev/memory/logs/process-snapshot-2026-05-31.txt
```

**Success Criteria:**
- [ ] Backup directory created
- [ ] Current logs backed up
- [ ] Process snapshot captured

---

### 10. GO/NO-GO Decision Point (16:00 KST)
**Final assessment before 17:00 verification window:**

**Proceed to Verification IF:**
- ✅ All 9 checklist items complete
- ✅ Both Phase 2A and 2B services running and responding
- ✅ No critical errors in logs
- ✅ System resources sufficient
- ✅ All documentation reviewed and understood

**HOLD and Investigate IF:**
- ❌ Any service not responding to health checks
- ❌ Disk space critically low (< 500MB free)
- ❌ Critical errors found in logs from overnight
- ❌ Environment variables missing or incorrect
- ❌ Script files not executable

---

## 🟢 READY FOR VERIFICATION (16:30)

Once all 10 items are complete:

1. **Set reminder for 16:50** — 10 minutes before verification starts
2. **Have execution documents open** — PHASE_2F_EXECUTION_READINESS.md
3. **Prepare command terminals** — Ready to execute verification steps at 17:00
4. **Disable distractions** — Focus entirely on verification process for next 60 minutes

---

## ⏰ Timeline Reminder

| Time | Event | Status |
|------|-------|--------|
| **2026-05-31 08:00** | Morning health check | This checklist |
| **2026-05-31 17:00** | Pre-Deployment Verification begins | 60-minute window |
| **2026-05-31 18:00** | Production Deployment begins | 21-hour window |
| **2026-06-01 09:00** | Production Deployment complete | Go/No-Go finalized |

---

## 📞 Escalation

**IF critical issue found during morning checklist:**

1. Check root cause (service crash, resource issue, permission error)
2. Attempt recovery (restart service, check logs, investigate errors)
3. Document issue with full context (timestamps, error messages, steps taken)
4. Decide: Proceed at 17:00 with documented issue, or defer deployment 24 hours

**IF issue cannot be resolved by 16:30:**
- **DECISION:** Defer Phase 2F to 2026-06-01 17:00
- **ACTION:** Document reason, notify team, preserve logs for investigation
- **RECOVERY:** Root cause analysis and fix before retry

---

**Checklist Owner:** System Automation  
**Last Updated:** 2026-05-30 (Pre-Flight Preparation)  
**Status:** Ready for 2026-05-31 execution
