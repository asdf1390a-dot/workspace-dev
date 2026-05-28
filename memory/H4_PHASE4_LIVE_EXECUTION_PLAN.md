# H4 Phase 4: Live Execution Plan (2026-05-30)

**Status**: Ready for Implementation  
**Start Date**: 2026-05-30 10:00 KST  
**Estimated Duration**: 2 hours  
**Owner**: H4 System + DevOps + Web-Builder  

---

## 1. Pre-Flight Checklist (2026-05-30 09:45 KST)

### 1.1 Environment Verification
- [ ] Supabase production access verified
- [ ] Vercel production access verified
- [ ] Telegram bot token active and responding
- [ ] All component 1-4 services running
- [ ] Cron scheduler ready (hourly monitoring)
- [ ] Task registry database accessible

### 1.2 Rollback Preparation
- [ ] Backup existing Supabase schema (pre-migration)
- [ ] Document current Vercel environment variables
- [ ] Create database snapshot
- [ ] Prepare rollback procedure document
- [ ] Test rollback script in staging

### 1.3 Communication Setup
- [ ] Telegram secretary channel monitored
- [ ] Escalation notification list updated
- [ ] Team notified of maintenance window
- [ ] Slack alerts configured
- [ ] Status page ready for updates

---

## 2. Phase 4A: Live Database Migration (10:00–10:30 KST)

### Step 1: Migration Execution (10:00–10:15)
**Component**: Auto-Executor (Component 2)  
**Input**: BM-P1 blocker from Scanner  
**Output**: Execution log to task registry

**Actions**:
1. Component 2 receives BM-P1 blocker with db/43 migration details
2. Displays Telegram confirmation message to secretary (auto-approve configured)
3. Reads db/43_breakdown_management_phase1_schema.sql from disk
4. Executes SQL in Supabase transaction
5. Logs execution result with metadata:
   - Lines executed: 230
   - Objects created: 14
   - RLS enabled: true
   - Execution time: <30 seconds
6. Records state transition: BLOCKED_ON_USER → EXECUTING → COMPLETED

**Success Criteria**:
- [ ] All 230 SQL lines executed without errors
- [ ] Breakdown management table created with all columns
- [ ] 8 indexes created and active
- [ ] Function set_breakdown_updated_at() deployed
- [ ] Trigger breakdown_reports_updated_at_trigger active
- [ ] View breakdown_analysis accessible
- [ ] RLS policies applied and verified
- [ ] Task registry state = COMPLETED

**Failure Recovery**:
If migration fails:
1. Check Supabase logs for error details
2. Verify asset and auth.users tables exist (dependencies)
3. Rollback transaction (automatic if within same session)
4. Update task registry state to EXECUTION_FAILED
5. Notify team via Telegram with error details
6. Retry with corrected SQL if needed

### Step 2: Verification (10:15–10:30)
**Verification Queries**:
```sql
-- Verify table exists and has correct schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'breakdown_reports';

-- Count indexes
SELECT count(*) FROM pg_indexes 
WHERE tablename = 'breakdown_reports';

-- Verify RLS policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'breakdown_reports';

-- Test insert with RLS
INSERT INTO breakdown_reports (asset_id, description, status, severity, reported_by)
VALUES ('test-uuid', 'Test breakdown', 'reported', 'normal', 'test-user-id');
```

**Expected Results**:
- [ ] Table breakdown_reports exists
- [ ] 8 indexes found
- [ ] 3 RLS policies active
- [ ] Insert respects RLS constraints
- [ ] Select returns correct subset of rows

---

## 3. Phase 4B: Telegram Configuration Deployment (10:30–10:45 KST)

### Step 1: Configuration Deployment (10:30–10:40)
**Component**: Auto-Executor (Component 2)  
**Input**: HARNESS-ENG-P1 blocker from Scanner  
**Output**: Deployment log to task registry

**Actions**:
1. Component 2 receives HARNESS-ENG-P1 blocker with Telegram config details
2. Displays Telegram confirmation message to secretary (auto-approve configured)
3. Reads chat ID from memory/TELEGRAM_SECRETARY_CONFIG.md: `8650232975`
4. Validates format: numeric, 10+ digits ✓
5. Deploys to Vercel via REST API:
   ```
   POST https://api.vercel.com/v9/projects/{PROJECT_ID}/env
   {
     "key": "TELEGRAM_SECRETARY_CHAT_ID",
     "value": "8650232975",
     "target": ["production"]
   }
   ```
6. Records state transition: BLOCKED_ON_USER → EXECUTING → COMPLETED

**Success Criteria**:
- [ ] Vercel API returns 201 Created
- [ ] Environment variable set in production
- [ ] Variable accessible in deployed functions
- [ ] Task registry state = COMPLETED

**Failure Recovery**:
If deployment fails:
1. Check Vercel API response for error details
2. Verify project ID and API token valid
3. Check if variable already exists (may need update instead of create)
4. Update task registry state to EXECUTION_FAILED
5. Notify team via Telegram with error details

### Step 2: Connection Test (10:40–10:45)
**Component 2 sends test message**:
1. Creates test message with timestamp
2. Calls Telegram Bot API to send to chat ID 8650232975
3. Waits for delivery confirmation (timeout: 30 seconds)
4. Logs result with success/failure status

**Expected Outcome**:
- [ ] Test message delivered to Telegram secretary
- [ ] Message contains timestamp and execution status
- [ ] Deployment confirmation received in Telegram
- [ ] No errors in Vercel logs

---

## 4. Phase 4C: Escalation Monitoring Activation (10:45–12:00 KST)

### Step 1: Cron Scheduler Configuration (10:45–11:00)
**Component**: Cron Monitor (Component 3)  
**Schedule**: `0 * * * *` (every hour at minute 0)

**Actions**:
1. Scheduler reads task registry for BLOCKED_ON_USER items
2. For each blocked item, calculates blockage duration (now - blockage_start)
3. Checks escalation thresholds:
   - 6h: WARNING level, send email + Telegram
   - 12h: CRITICAL level, escalate to manager
   - 18h: EMERGENCY level, escalate to CEO
4. Sends notifications for any thresholds crossed
5. Logs all monitoring results to H4_CRON_MONITOR_LOG.json

**Configuration**:
- [ ] Cron job created and active
- [ ] Timezone set to KST (UTC+9)
- [ ] Task registry query configured
- [ ] Email notification template ready
- [ ] Telegram escalation templates prepared

### Step 2: Threshold Testing (11:00–12:00)
**Test Scenario**: Create artificial blockages to verify escalation rules

**Test Case 1: 6-hour WARNING threshold**
- Create blocking item with start time 6 hours ago
- Run Component 3 monitor
- Verify WARNING notification sent
- [ ] Notification received in Telegram
- [ ] Log entry recorded in H4_CRON_MONITOR_LOG.json
- [ ] Action field = "notify_user"

**Test Case 2: 12-hour CRITICAL threshold**
- Create blocking item with start time 12 hours ago
- Run Component 3 monitor
- Verify CRITICAL notification sent
- [ ] Notification received in Telegram
- [ ] Log entry recorded
- [ ] Action field = "notify_manager"

**Test Case 3: 18-hour EMERGENCY threshold**
- Create blocking item with start time 18 hours ago
- Run Component 3 monitor
- Verify EMERGENCY notification sent
- [ ] Notification received in Telegram
- [ ] Log entry recorded
- [ ] Action field = "notify_ceo"

**Test Case 4: Sub-threshold (no escalation)**
- Create blocking item with start time 3 hours ago
- Run Component 3 monitor
- Verify NO escalation sent
- [ ] No notification in Telegram
- [ ] Blocker status unchanged

---

## 5. Phase 4D: End-to-End Validation (12:00–13:00 KST)

### Complete Flow Validation
1. **Blocker Detection**: Scanner detects BM-P1 and HARNESS-ENG-P1
2. **State Tracking**: Both items in task registry with COMPLETED state
3. **Execution Results**: Component 2 execution logs show successful completion
4. **Monitoring**: Component 3 detects both items at 6h+ threshold
5. **Escalations**: Threshold-based notifications working
6. **User Interface**: Telegram templates rendering correctly

**Validation Checklist**:
- [ ] All 4 components executing in sequence
- [ ] No data loss between components
- [ ] All timestamps consistent (ISO8601)
- [ ] State machine transitions valid
- [ ] Escalation rules trigger correctly
- [ ] Telegram notifications delivered
- [ ] Task registry fully updated

### Performance Metrics
- [ ] Component 1 (Scanner) execution time: <5 seconds
- [ ] Component 2 (Executor) execution time: <30 seconds (migration), <15 seconds (config)
- [ ] Component 3 (Monitor) execution time: <10 seconds
- [ ] Component 4 (UI) rendering time: <5 seconds
- [ ] Total end-to-end latency: <60 seconds

---

## 6. Rollback Procedures

### If db/43 Migration Fails
1. Stop Executor (Component 2)
2. Restore database from pre-migration backup
3. Update task registry: BM-P1 state = EXECUTION_FAILED
4. Document error in failure analysis log
5. Notify team via Telegram
6. Retry with corrected SQL or manual DBA review

### If Vercel Deployment Fails
1. Stop Executor (Component 2)
2. Restore previous Vercel environment variable
3. Update task registry: HARNESS-ENG-P1 state = EXECUTION_FAILED
4. Document error in failure analysis log
5. Notify team via Telegram
6. Retry deployment or manual configuration

### If Component 3 Escalations Fail
1. Pause Cron scheduler
2. Check Telegram API connection
3. Verify email service availability
4. Re-run Component 3 with debug output
5. Review escalation template configuration
6. Resume Cron once issue resolved

---

## 7. Success Criteria (All Must Pass)

### Criterion 1: Database Migration Complete ✅
- db/43 applied to Supabase
- breakdown_reports table exists with 14 objects
- RLS policies enabled and enforced
- Zero data loss or corruption

### Criterion 2: Telegram Configuration Deployed ✅
- Environment variable set in Vercel
- Test message delivered successfully
- Functions can access the variable
- No production impact

### Criterion 3: Escalation Monitoring Working ✅
- All 3 threshold levels trigger (6h, 12h, 18h)
- Notifications delivered on time
- No false positives at sub-threshold times
- Logs recorded correctly

### Criterion 4: Full System Integrity ✅
- All 4 components running
- Data flows correctly through all boundaries
- No missing or corrupted state
- Performance metrics within targets

### Criterion 5: No Incidents ✅
- Zero unplanned downtime
- Zero data loss
- Zero security issues
- Zero compliance violations

---

## 8. Post-Execution Actions (13:00+ KST)

### 1. Data Collection
- [ ] Collect all execution logs from Phase 4A, 4B, 4C
- [ ] Export task registry entries
- [ ] Generate performance metrics report
- [ ] Capture system health metrics

### 2. Analysis & Validation
- [ ] Verify all success criteria met
- [ ] Analyze performance data
- [ ] Document any deviations from plan
- [ ] Identify optimization opportunities

### 3. Report Generation
- [ ] Create Phase 4 completion report
- [ ] Generate executive summary
- [ ] Document lessons learned
- [ ] Update team on status

### 4. Monitoring Activation
- [ ] Enable continuous monitoring
- [ ] Activate hourly escalation checks
- [ ] Set up Telegram notifications
- [ ] Configure email alerts

---

## 9. Timeline Summary

| Time | Phase | Duration | Task |
|------|-------|----------|------|
| 09:45 | Pre-Flight | 15 min | Environment verification |
| 10:00 | 4A Start | 30 min | Database migration |
| 10:30 | 4B Start | 15 min | Telegram configuration |
| 10:45 | 4C Start | 75 min | Escalation testing |
| 12:00 | 4D Start | 60 min | End-to-end validation |
| 13:00 | Complete | — | System ready for production |

---

## 10. Contacts & Escalation

**Primary**: H4 System (Automation)  
**Backup**: DevOps Engineer #12  
**Escalation**: Project Manager (if >30 min delay)  
**Emergency**: CEO (if data loss or security issue)

---

**Document Created**: 2026-05-29 14:30 KST  
**Ready for Execution**: 2026-05-30 09:45 KST
