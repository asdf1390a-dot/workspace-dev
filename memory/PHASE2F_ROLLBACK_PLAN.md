---
name: Phase 2F Rollback Plan
description: Emergency rollback procedures for Phase 2F Production Deployment
type: incident-response
date: 2026-05-31
deployment_window: 2026-05-31 18:00 ~ 2026-06-01 09:00 KST
---

# Phase 2F Rollback Plan

**Status:** ACTIVE (2026-05-31 for 2026-05-31 deployment)  
**Last Updated:** 2026-05-31 11:38 KST

---

## Quick Reference: Rollback Triggers

### Critical Failures (Immediate Rollback)
1. Phase 2A service (port 3009) DOWN for >5 min
2. Phase 2B service (port 3010) DOWN for >5 min
3. Database connection loss (Supabase unavailable)
4. Memory automation producing corrupted data
5. Duplicate detection algorithm producing false positives (>10%)
6. Any ERROR logs in Phase 2A/2B with severity CRITICAL

### Non-Critical Issues (Monitor & Assess)
- High response times (>2s for /health endpoint)
- Memory file drift detection (Phase B monitor)
- Trust score calculation variance >5%

---

## Rollback Procedure

### Level 1: Service Restart (2-3 min)
**Triggers:** Service unresponsive but no data corruption detected

```bash
# Restart Phase 2A
ps aux | grep "port.*3009\|npm start" | grep -v grep | awk '{print $2}' | xargs kill -9
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
npm start &

# Restart Phase 2B
ps aux | grep "port.*3010\|phase2b-express" | grep -v grep | awk '{print $2}' | xargs kill -9
PORT=3010 node phase2b-express-wrapper.js > /tmp/phase2b-restart.log 2>&1 &

# Verify health
curl -s http://localhost:3009/health
curl -s http://localhost:3010/health
```

**Success Criteria:** Both services return 200 status within 1 min

---

### Level 2: Database Rollback (5-10 min)
**Triggers:** Data corruption detected, duplicate detection algorithm failure

```bash
# Check database state
curl -s -X GET https://pzkvhomhztikhkgwgqzr.supabase.co/rest/v1/messages?limit=1 \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"

# Restore from backup (if needed)
# Note: Requires Supabase dashboard access or API key
# Contact DevOps Engineer for restoration scripts
```

**Backup Location:** Daily snapshots in `/home/jeepney/.openclaw/workspace-dev/BACKUPS/daily-backup-2026-05-31/`

---

### Level 3: Full Deployment Abort (Immediate)
**Triggers:** >2 critical failures OR data integrity unverifiable

**Steps:**
1. Notify CEO via Telegram: "PHASE 2F ROLLBACK INITIATED — Critical issues detected"
2. Disable all Phase 2 cron jobs (pause automation)
3. Revert memory system to last known good state
4. Restore previous app versions (if needed)
5. File incident report in memory/logs/

**Command:**
```bash
# Disable cron jobs
# (requires access to OpenClaw cron system — contact DevOps Engineer)

# Restore previous memory state
if [ -f /home/jeepney/.openclaw/workspace-dev/BACKUPS/daily-backup-2026-05-30/.phase_a_snapshot_prev.txt ]; then
  cp /home/jeepney/.openclaw/workspace-dev/BACKUPS/daily-backup-2026-05-30/.phase_a_snapshot_prev.txt \
     /home/jeepney/.openclaw/workspace-dev/memory/.phase_a_snapshot_prev.txt
  echo "✅ Memory state restored"
fi
```

---

## Post-Rollback Actions

1. **Incident Documentation:** Create `/home/jeepney/.openclaw/workspace-dev/memory/logs/PHASE2F_INCIDENT_REPORT.md`
2. **Root Cause Analysis:** Identify what failed and why
3. **Timeline:** Shift Phase 2F to next scheduled window (likely 2026-06-02 18:00)
4. **Team Notification:** Post incident summary to Discord #deployment
5. **Stakeholder Update:** Telegram message to CEO with ETA for retry

---

## Contact List (Escalation)

| Role | Agent ID | Trigger Condition |
|------|----------|-------------------|
| DevOps Engineer | Phase C #12 | Service/infrastructure issues |
| QA Specialist | Phase C #14 | Data quality issues |
| Memory Specialist | Phase C #13 | Memory automation failures |
| CEO (asdf1390a) | N/A | Final approval for abort |

---

## Success Indicators (No Rollback Needed)

- ✅ Phase 2A running continuously for 1+ hour with 0 errors
- ✅ Phase 2B processing 100% of messages with 0 data loss
- ✅ Memory files consistent and uncorrupted
- ✅ Duplicate detection accuracy >99%
- ✅ Trust score calculations validated
- ✅ All health endpoints returning 200 OK

---

**Created:** 2026-05-31 11:38 KST  
**Version:** 1.0  
**Status:** ✅ Ready for Production Deployment
