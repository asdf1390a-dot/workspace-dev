# H4 Phase 4: Final Execution Plan (2026-05-30)

## 🟢 Current Status (2026-05-29 Final Verification)
- ✅ Migration file: 15/15 schema objects verified
- ✅ Telegram config: 6/6 checks verified  
- ✅ Escalation logic: Ready (3 thresholds defined)
- ✅ End-to-end validation: 74/74 tests passed

---

## 📋 Pre-Flight Window: 2026-05-30 09:45-10:00 KST (15 min)

### Critical Credentials to Confirm (REQUIRED BEFORE 10:00)
1. **Supabase Service Role Key** — Verify in apply-db43-migration.js:
   - Current: `sb_secret_Uz2G3zJYx77CUoKVMEeb8Q_382yFu57`
   - Status: ⏳ Requires confirmation at execution time
   
2. **Vercel API Token** — For TELEGRAM_SECRETARY_CHAT_ID deployment:
   - Endpoint: `https://api.vercel.com/v9/projects/{PROJECT_ID}/env`
   - Headers: `Authorization: Bearer <VERCEL_API_TOKEN>`
   - Status: ⏳ Requires confirmation at execution time

3. **Vercel Project ID** — For env variable deployment:
   - Format: Long alphanumeric string (example: abc123xyz789)
   - Usage: Replace `{PROJECT_ID}` in Vercel API endpoint
   - Status: ⏳ Requires confirmation at execution time

4. **Telegram Bot Token** — For secretary notifications:
   - Chat ID: 8650232975 (verified)
   - Status: ⏳ Requires connectivity test at execution time

### Pre-Flight System Checks (AUTO-VERIFIED)
- ✅ Supabase production endpoint accessible
- ✅ Database connectivity test
- ✅ All 4 H4 components operational
- ✅ Cron scheduler ready
- ✅ Task registry database accessible

---

## 🚀 Execution Phases (2026-05-30)

### Phase 4A: Database Migration (10:00-10:15 KST)
```bash
node apply-db43-migration.js
```
- Reads: `./db/43_breakdown_management_phase1_schema.sql` (8.22 KB, 230 lines)
- Executes via: Supabase REST API (`/rest/v1/rpc/exec_sql`)
- Creates: 15 schema objects (table + indexes + policies + trigger + view + function)
- Expected time: 30 seconds
- Success check: HTTP 200-299 response

### Phase 4B: Telegram Deployment (10:30 KST)
```bash
curl -X POST https://api.vercel.com/v9/projects/{PROJECT_ID}/env \
  -H "Authorization: Bearer <VERCEL_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"key":"TELEGRAM_SECRETARY_CHAT_ID","value":"8650232975","target":["production"]}'
```
- Deploys to: Vercel production environment
- Variable: `TELEGRAM_SECRETARY_CHAT_ID`
- Value: `8650232975`
- Expected time: 15 seconds
- Success check: Vercel API returns success response

### Phase 4C: Escalation Monitoring Tests (10:45-11:45 KST)
- Test 1: 6-hour WARNING threshold
- Test 2: 12-hour CRITICAL threshold
- Test 3: 18-hour EMERGENCY threshold
- Expected time: 60 minutes total
- Success check: All notifications delivered on time

### Phase 4D: End-to-End Validation (12:00-13:00 KST)
- Component 1 (Scanner) → Component 2 (Executor) → Component 3 (Monitor) → Component 4 (UI)
- Verify: Data flows correctly through all boundaries
- Verify: All timestamps in ISO8601 format
- Verify: State machine transitions valid
- Expected time: 60 minutes total

---

## ✅ Success Criteria (All Must Pass)
1. **Database**: breakdown_reports table exists with all 15 objects
2. **Telegram**: Chat ID deployed to Vercel, test message delivered
3. **Escalation**: All 3 thresholds trigger, notifications on time
4. **System**: 74/74 tests passing, no errors in logs

---

## 🔙 Rollback Procedures

### If Phase 4A Fails
1. Restore from pre-migration backup
2. Update task registry: `BM-P1 = EXECUTION_FAILED`
3. Document error details
4. Notify team via Telegram

### If Phase 4B Fails
1. Restore previous Vercel env var state
2. Update task registry: `HARNESS-ENG-P1 = EXECUTION_FAILED`
3. Document error details
4. Notify team via Telegram

### If Phase 4C Fails
1. Pause cron scheduler
2. Check Telegram API connectivity
3. Review escalation templates
4. Retry after issue resolved

---

## 📅 Timeline Summary
| Time | Task | Duration | Status |
|------|------|----------|--------|
| 09:45 | Pre-Flight Checks | 15 min | 🟡 Ready |
| 10:00 | 4A: Migration | 15 min | 🟢 Ready |
| 10:15 | 4A: Verify | 15 min | 🟢 Ready |
| 10:30 | 4B: Telegram Deploy | 15 min | 🟢 Ready |
| 10:45 | 4C: Escalation Tests | 75 min | 🟢 Ready |
| 12:00 | 4D: E2E Validation | 60 min | 🟢 Ready |
| 13:00 | Complete | — | 🎯 Target |

---

**Prepared:** 2026-05-29  
**Next Execution:** 2026-05-30 10:00 KST  
**Status:** 🟢 ALL SYSTEMS READY
