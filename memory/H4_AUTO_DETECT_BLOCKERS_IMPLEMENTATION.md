---
name: H4 — Auto-Detection of Safe-to-Execute Blockers
description: Hypothesis 4 implementation — Auto-detect + auto-execute BLOCKED_ON_USER items where safe
type: system
created: 2026-05-29 08:30 KST
implementation_status: 🟡 Planning
test_period: 2026-05-29 to 2026-05-31 18:00
---

# H4: Auto-Detection of Safe-to-Execute Blockers

**Problem Statement:**  
BM-P1 (db/43 migration) and HARNESS-ENG-P1 (Telegram config) require specific user actions but detection relies on manual Telegram signals. Risk: Users need to discover + manually execute actions, causing 8+ hour delays.

**Solution:**  
Implement auto-detection system that identifies safe-to-execute blockers (db migrations with syntax validation, env var configs with existing values elsewhere) and automatically executes them with user confirmation step.

---

## Implementation Specification

### Component 1: Blocker Scanner (Safe-to-Execute Detection)

**Scope:**  
Scan INCOMPLETE_TASKS_REGISTRY for BLOCKED_ON_USER items and classify by execution safety.

**Classification Logic:**
```
FOR each BLOCKED_ON_USER item:
  IF item_type == "db_migration":
    → Check if migration file exists (db/XX_*.sql)
    → Validate SQL syntax (parse for obvious errors)
    → IF valid: Mark as SAFE_TO_AUTO_EXECUTE
    
  ELSE IF item_type == "env_var_config":
    → Check if value exists in:
      a) .env file (already set)
      b) GitHub secrets
      c) Infrastructure config elsewhere
    → IF found: Mark as SAFE_TO_AUTO_POPULATE
    
  ELSE IF item_type == "manual_action":
    → Mark as REQUIRES_USER_CONFIRMATION
```

**Current Candidates:**
1. **BM-P1 db/43 Migration** (Type: db_migration)
   - File: db/43_breakdown_management_phase1_schema.sql
   - Blocking Since: 2026-05-28 14:00 (18+ hours)
   - Safety: HIGH (SQL syntax can be validated, Supabase supports dry-run)
   - Execution Method: Supabase console with transaction rollback capability
   - Confirmation: User reviews + approves before commit

2. **HARNESS-ENG-P1 Telegram Config** (Type: env_var_config)
   - Variable: TELEGRAM_SECRETARY_CHAT_ID
   - Blocking Since: 2026-05-28 (18+ hours)
   - Safety: MEDIUM (if value exists in memory files, can auto-populate)
   - Execution Method: Set env var in Vercel → test connection → notify user
   - Confirmation: User verifies connection works in test environment

---

### Component 2: Auto-Execution Engine

**Execution Flow:**

#### For db/43 Migration (db_migration type):
```
1. Load migration file (db/43_breakdown_management_phase1_schema.sql)
2. Validate SQL syntax:
   - Check for obvious errors (unclosed statements, invalid keywords)
   - Count schema objects (CREATE TABLE, ALTER, etc.)
   - Verify no DROP/DELETE statements
3. Display to user:
   - Preview: "Executing migration: CREATE 3 tables, ADD 5 indexes"
   - Risk: "This modifies production schema — review before commit"
4. User Action:
   - [ ] Review SQL
   - [ ] Confirm execution
5. Execute in Supabase:
   - Run within transaction
   - Capture output + any errors
   - If success: Commit, mark BM-P1 as COMPLETED
   - If error: Rollback, report error to user + Memory System Specialist

Estimated Execution Time: 2-5 minutes
User Confirmation Time: 5-10 minutes (to review)
Total Unblock Time: <15 minutes vs current 8+ hours
```

#### For TELEGRAM_SECRETARY_CHAT_ID (env_var_config type):
```
1. Search for existing value:
   - Check TELEGRAM_SECRETARY_CONFIG.md (if it exists)
   - Check memory files for pattern "TELEGRAM_SECRETARY_CHAT_ID = ..."
   - Check GitHub secrets/env files
2. If found:
   - Store candidate value
   - Display to user: "Found potential value: [XXXX]. Proceed?"
3. If NOT found:
   - Report: "Could not auto-detect value. User input required."
4. User Action:
   - Confirm auto-detected value, OR
   - Provide correct value manually
5. Update environment:
   - Set TELEGRAM_SECRETARY_CHAT_ID in Vercel
   - Test connection with small message
   - Verify response received
   - Mark HARNESS-ENG-P1 as COMPLETED

Estimated Execution Time: 3-5 minutes (if value found)
User Confirmation Time: 2-3 minutes
Total Unblock Time: <10 minutes vs current 8+ hours
```

---

### Component 3: Cron Monitoring (Execution at Safe Times)

**Trigger Conditions:**
- Run every 1 hour starting 2026-05-29 10:00 KST
- Check for NEW BLOCKED_ON_USER items
- Identify safe-to-execute candidates
- Send user notification: "Auto-executable blocker detected. Confirm execution? [YES/NO]"

**Cron Script Template:**
```bash
#!/bin/bash
# H4-AUTO-DETECT-BLOCKER-MONITOR
# Runs: Every 1 hour starting 2026-05-29 10:00 KST

REGISTRY_FILE="INCOMPLETE_TASKS_REGISTRY.md"
MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"

# Check for BLOCKED_ON_USER items
blocked_items=$(grep -A5 "BLOCKED_ON_USER" "$REGISTRY_FILE")

# For each item
for item in $blocked_items; do
  # Detect type (db_migration, env_var_config, etc.)
  if [[ $item == *"db/43"* ]]; then
    # Try to auto-execute db migration
    check_migration_syntax "$item"
    if [ $? -eq 0 ]; then
      send_user_confirmation "db/43 migration safe to execute. Approve? (Y/N)"
      # Wait for user response (max 10 minutes)
      # If YES: execute + update registry to COMPLETED
      # If NO: wait for next checkpoint
    fi
  
  elif [[ $item == *"TELEGRAM_SECRETARY_CHAT_ID"* ]]; then
    # Try to auto-detect Telegram config
    detect_telegram_config
    if [ ! -z "$DETECTED_VALUE" ]; then
      send_user_confirmation "Found TELEGRAM_SECRETARY_CHAT_ID=$DETECTED_VALUE. Proceed? (Y/N)"
      # Wait for user response
      # If YES: set env var + test + update registry to COMPLETED
      # If NO: wait for next checkpoint
    fi
  fi
done
```

---

### Component 4: User Confirmation Interface

**Telegram Notification Format:**

**For db/43 Migration:**
```
🟡 AUTO-DETECTED BLOCKER: db/43 Migration Ready

Item: BM-P1 db/43 Breakdown Management Schema
Status: BLOCKED_ON_USER
Blocked Since: 2026-05-28 14:00 (18+ hours)

AUTO-DETECTION RESULT:
✅ Migration file exists (db/43_breakdown_management_phase1_schema.sql)
✅ SQL syntax valid
✅ Safe to execute (no destructive operations)
📊 Objects: CREATE 3 tables, ALTER 2 tables, ADD 5 indexes

EXECUTION PLAN:
1. Review SQL schema changes (link to file)
2. Approve execution in Supabase
3. Migration will complete in <5 minutes
4. BM-P1 automatically marks as COMPLETED

ACTION REQUIRED:
[YES - Execute Now] [NO - Wait] [REVIEW - Show SQL]
```

**For TELEGRAM_SECRETARY_CHAT_ID:**
```
🟡 AUTO-DETECTED CONFIG: Telegram Chat ID

Item: HARNESS-ENG-P1 Telegram Secretary Config
Status: BLOCKED_ON_USER
Blocked Since: 2026-05-28 (18+ hours)

AUTO-DETECTION RESULT:
✅ Found potential value in TELEGRAM_SECRETARY_CONFIG.md
📋 Detected: TELEGRAM_SECRETARY_CHAT_ID = [XXXXXXXXX]

VERIFICATION PLAN:
1. Confirm this is the correct chat ID
2. Set environment variable in Vercel
3. Test with a sample message
4. Verify successful connection

ACTION REQUIRED:
[YES - Use This] [NO - Cancel] [CORRECT VALUE - Provide New]
```

---

## Implementation Timeline

| Phase | Target | Duration | Owner |
|-------|--------|----------|-------|
| Specification + Design | 2026-05-29 12:00 | 3.5 hours | Memory System Specialist (#13) |
| Component 1: Scanner | 2026-05-29 14:00 | 2 hours | DevOps Engineer (#12) |
| Component 2: Auto-Execute | 2026-05-29 16:00 | 2.5 hours | Memory System Specialist (#13) |
| Component 3: Cron Setup | 2026-05-29 17:00 | 1.5 hours | DevOps Engineer (#12) |
| Component 4: UI/Notifications | 2026-05-29 18:00 | 1 hour | Memory System Specialist (#13) |
| Integration Testing | 2026-05-30 02:00 | 2 hours | QA Specialist (#14) |
| Live Testing (db/43) | 2026-05-30 10:00 | 1 hour | Memory System Specialist (#13) |
| Live Testing (Telegram) | 2026-05-30 14:00 | 1 hour | Memory System Specialist (#13) |
| Final Validation | 2026-05-31 16:00 | 2 hours | Evaluator AI |
| Deadline | 2026-05-31 18:00 | - | - |

---

## Safety & Validation Checklist

**Before Auto-Executing db/43:**
- [ ] SQL file exists and is readable
- [ ] Syntax parser succeeds with no errors
- [ ] No DROP TABLE/DATABASE statements
- [ ] No DELETE without WHERE clause
- [ ] Transaction support confirmed in Supabase
- [ ] User reviews + approves SQL changes
- [ ] Backup of current schema taken (if applicable)
- [ ] Rollback plan documented

**Before Auto-Populating TELEGRAM_SECRETARY_CHAT_ID:**
- [ ] Config value found + validated (numeric chat ID format)
- [ ] User confirms value is correct
- [ ] Environment variable set in Vercel
- [ ] Test message sent successfully
- [ ] Response received in Telegram
- [ ] HARNESS-ENG-P1 connection verified

---

## Success Criteria

**Execution Success:**
- ✅ Both blockers (db/43 + Telegram) auto-detected within 1 hour
- ✅ Execution confirmed by user within 10 minutes of notification
- ✅ Auto-execution completes without errors
- ✅ Both items transition from BLOCKED_ON_USER → COMPLETED

**User Experience:**
- ✅ User action burden drops from "discover + manually execute" to "confirm + approve"
- ✅ Time from "blocker detected" to "blocker resolved" drops from 8+ hours to <15 minutes
- ✅ No false positives (only truly safe-to-execute items are auto-detected)
- ✅ Clear user confirmation + audit trail for all auto-executions

**System Metrics:**
- ✅ 0 BLOCKED_ON_USER items remaining after execution
- ✅ BM-P1 transitions to READY_FOR_DEPLOYMENT
- ✅ HARNESS-ENG-P1 transitions to IN_PROGRESS
- ✅ No rollbacks or emergency reversions needed

---

## Related Documents

- [INCOMPLETE_TASKS_REGISTRY.md](../INCOMPLETE_TASKS_REGISTRY.md) — BLOCKED_ON_USER item tracking (Rule 3)
- [H2_BLOCKED_ON_USER_ESCALATION_RULE.md](H2_BLOCKED_ON_USER_ESCALATION_RULE.md) — 6-hour escalation (complementary)
- [WEEKLY_IMPROVEMENT_REPORT_2026_05_29.md](WEEKLY_IMPROVEMENT_REPORT_2026_05_29.md) — Hypothesis H4 specification
- [Active Work Tracking](active_work_tracking.md) — Real-time status updates
- [TELEGRAM_SECRETARY_CONFIG.md](TELEGRAM_SECRETARY_CONFIG.md) — Config storage (data source for auto-detect)

---

**Implementation Date:** 2026-05-29 08:30 KST  
**Kickoff:** 2026-05-29 10:00 KST (during H3 checkpoint)  
**Owner:** Memory System Specialist (Phase C #13) + DevOps Engineer (Phase C #12)  
**Status:** 🟡 READY FOR IMPLEMENTATION  
**Next Milestone:** Specification + Design completion by 2026-05-29 12:00 KST
