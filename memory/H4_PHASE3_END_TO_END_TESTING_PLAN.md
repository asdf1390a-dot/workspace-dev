# H4 Phase 3: End-to-End Testing Plan (2026-05-29)

**Status**: Ready for Implementation  
**Target Date**: 2026-05-30 10:00 KST  
**Components**: All 4 (Scanner → Executor → Monitor → UI)  

---

## 1. Pre-Execution Validation

### 1.1 db/43 Migration Readiness
- ✅ File exists: `/db/43_breakdown_management_phase1_schema.sql` (230 lines, 8.22 KB)
- ✅ Schema objects: 1 table, 8 indexes, 1 function, 1 trigger, 1 view, 3 RLS policies
- ✅ Safety: No destructive operations detected
- ✅ Dependencies: References `assets(id)` and `auth.users(id)` tables (pre-existing)
- 🔲 Live execution: Pending user confirmation

### 1.2 Telegram Secretary Configuration
- ✅ Chat ID identified: `8650232975` (stored in memory/TELEGRAM_SECRETARY_CONFIG.md)
- ✅ Format validated: Numeric, 10+ digits
- 🔲 Vercel environment variable: Pending deployment
- 🔲 Connection test: Pending actual Telegram API call

### 1.3 Supabase Connection
- ✅ URL: `pzkvhomhztikhkgwgqzr.supabase.co` (DSC FMS portal)
- ✅ Service role key exists (from apply-db43-migration.js)
- 🔲 Live connectivity test: Pending

---

## 2. Phase 3 Test Scenarios

### 2.1 Scenario A: Database Migration Flow
**Objective**: Validate full db/43 migration execution path

**Steps**:
1. Component 2 (Auto-Executor) receives BM-P1 blocker
2. Reads db/43 migration file
3. Displays migration details via Telegram
4. Awaits user confirmation (10-minute window)
5. Executes SQL in Supabase transaction
6. Records execution result in task registry
7. Component 3 (Monitor) detects state transition
8. Logs completion with timestamp

**Expected Outcomes**:
- Migration applied successfully (0 errors)
- All 14 objects created (1 table, 8 indexes, 1 function, 1 trigger, 1 view, 3 policies)
- State transition: BLOCKED_ON_USER → EXECUTING → COMPLETED
- Execution time: <30 seconds
- Task registry updated with success metadata

### 2.2 Scenario B: Environment Variable Configuration
**Objective**: Validate Telegram config deployment flow

**Steps**:
1. Component 2 receives HARNESS-ENG-P1 blocker
2. Reads Telegram chat ID from memory config
3. Displays config details via Telegram
4. Awaits user confirmation
5. Deploys to Vercel via REST API
6. Sends test message to Telegram (connection verification)
7. Records execution result
8. Component 3 detects and logs state transition

**Expected Outcomes**:
- Vercel environment variable set successfully
- Test message received in Telegram
- State transition recorded with timestamp
- Execution time: <15 seconds
- No connection errors

### 2.3 Scenario C: Escalation Threshold Testing
**Objective**: Validate escalation logic at 6h, 12h, 18h thresholds

**Test Setup**:
- Create test blockage record with configurable start time
- Component 3 runs hourly (or manually triggered)
- Monitor detects blockage duration
- Escalation rules trigger at correct thresholds

**Test Cases**:
| Duration | Threshold | Action | Expected |
|----------|-----------|--------|----------|
| 1.5 hours | None | Monitor runs | No escalation |
| 6+ hours | WARNING | Monitor runs | Email + Telegram to user |
| 12+ hours | CRITICAL | Monitor runs | Escalation to manager |
| 18+ hours | EMERGENCY | Monitor runs | Escalation to CEO |

**Expected Outcomes**:
- Each threshold triggers correct action
- Escalation metadata recorded in logs
- Timestamp matches threshold crossing
- No false positives

---

## 3. Integration Points to Verify

### 3.1 Scanner → Executor
- [x] Blocker data preserved through component boundary
- [x] All metadata intact (file path, size, safety level, chat ID)
- [ ] Live execution confirms data flow works

### 3.2 Executor → Registry
- [x] State transitions recorded with timestamps
- [x] Execution results stored with metadata
- [ ] Live execution confirms database writes work

### 3.3 Monitor → Escalation
- [x] Blockage duration calculations correct
- [x] Threshold comparisons accurate
- [ ] Live hourly runs confirm cron integration works

### 3.4 Templates → User Interface
- [x] All blockers have corresponding templates
- [x] Button callbacks map to executor actions
- [ ] Live Telegram messages confirm rendering works

---

## 4. Deployment Checklist

- [ ] db/43 migration syntax validated in Supabase
- [ ] db/43 migration applied to production
- [ ] Telegram chat ID deployed to Vercel
- [ ] Test Telegram message sent and received
- [ ] Cron job scheduled for hourly monitoring
- [ ] Escalation thresholds configured
- [ ] Component 1 scanner re-enabled
- [ ] Monitoring system activated

---

## 5. Rollback & Recovery

**If db/43 migration fails**:
1. Check Supabase logs for SQL errors
2. Verify asset and auth.users tables exist
3. Re-run migration with corrected SQL
4. Update task registry to EXECUTION_FAILED state
5. Send notification via Telegram

**If Telegram config fails**:
1. Verify chat ID is correct
2. Test bot token connectivity
3. Check Vercel environment variable set
4. Re-run configuration with debug output
5. Update task registry to EXECUTION_FAILED state

---

## 6. Success Criteria

✅ **Phase 3 Complete When**:
1. db/43 migration applied to Supabase (0 errors, 14 objects created)
2. Telegram config deployed to Vercel (test message received)
3. Component 3 escalations trigger at correct thresholds (3/3 tests pass)
4. Full end-to-end flow completes without data loss (Component 1 → 4)
5. All task registry entries updated with execution metadata

---

## 7. Timeline

| Date | Time | Task | Owner |
|------|------|------|-------|
| 2026-05-29 | 14:00 | Pre-execution validation | H4 System |
| 2026-05-30 | 10:00 | Phase 3A: Database migration | H4 System |
| 2026-05-30 | 10:30 | Phase 3B: Telegram config | H4 System |
| 2026-05-30 | 11:00 | Phase 3C: Escalation testing | H4 System |
| 2026-05-30 | 12:00 | Phase 3 validation & report | H4 System |
| 2026-05-30 | 18:00 | Production deployment | DevOps |

---

## 8. Next Steps After Phase 3

Upon successful Phase 3 completion:
1. **Phase 4**: Performance Testing (throughput, latency, resource usage)
2. **Phase 5**: Failure Recovery Testing (error paths, rollback procedures)
3. **Phase 6**: Production Deployment & Monitoring
4. **Phase 7**: Continuous Optimization & Scaling

---

**Document Created**: 2026-05-29 14:15 KST  
**Last Updated**: 2026-05-29 14:15 KST
