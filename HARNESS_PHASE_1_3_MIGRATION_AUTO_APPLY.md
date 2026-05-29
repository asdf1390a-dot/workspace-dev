# Harness Engineering Phase 1.3: Migration Auto-Apply Standardization

**Document Status:** ✅ Complete  
**Last Updated:** 2026-05-29  
**Applies To:** All 8 API modules (discord-bot, travel-management, team-dashboard, asset-master, backup-app, bm-breakdowns, milestones, portfolio)

---

## 1. Migration Auto-Apply Overview

### Purpose
Automated hourly detection and execution of pending database migrations using `SUPABASE_SERVICE_ROLE_KEY`, eliminating manual migration deployment steps and reducing schema drift across environments.

### Execution Model
- **Trigger:** Vercel Cron (registered in `vercel.json`)
- **Schedule:** Hourly at :00 (0 * * * * in cron syntax)
- **Duration:** Max 60 seconds (Vercel limit)
- **Authentication:** VERCEL_CRON_SECRET header validation
- **State Management:** .migration-history.json persistence (applied + failed tracking)

### Key Features
- ✅ Pending migration detection (scans `db/*.sql` files)
- ✅ Idempotent execution (prevents duplicate application)
- ✅ Graceful fallback (if Supabase exec_sql RPC unavailable)
- ✅ Error isolation (failed migrations tracked separately, doesn't block subsequent ones)
- ✅ Telegram notifications (success/failure summary + error details)
- ✅ Execution metrics (timestamp, duration_ms per migration)

---

## 2. Migration File Naming & Location

### Directory Structure
```
dsc-fms-portal/
├── db/
│   ├── 01_init_schema.sql
│   ├── 02_add_indexes.sql
│   ├── 29_asset_import_batches.sql
│   ├── 35_audit_system.sql
│   ├── 36_portfolio_schema.sql
│   └── 42_team_dashboard_phase2_api.sql
├── app/api/cron/db-migration/auto-apply/route.ts
└── .migration-history.json (auto-generated after first run)
```

### Naming Convention
- **Prefix:** Zero-padded integer (01, 02, ..., 99)
- **Separator:** Underscore
- **Description:** Descriptive snake_case name
- **Extension:** .sql

**Valid Examples:**
- `29_asset_import_batches.sql`
- `35_audit_system.sql`
- `99_future_schema_change.sql`

**Invalid Examples:**
- `asset_import.sql` (missing number)
- `migration_29.sql` (number not prefix)
- `29-audit-system.sql` (hyphen instead of underscore)

---

## 3. SQL Safety Standards

### Supported Statements
✅ CREATE TABLE / INDEX / SEQUENCE / ROLE / POLICY  
✅ ALTER TABLE / INDEX / SEQUENCE  
✅ DROP TABLE / INDEX (with CASCADE when needed)  
✅ INSERT (data seed migrations)  
✅ GRANT / REVOKE permissions  
✅ -- Comments (single-line)  

### Unsupported (Blocked for Safety)
❌ DML outside of INSERT (UPDATE/DELETE on production tables)  
❌ TRUNCATE TABLE (prefer DROP + CREATE)  
❌ Transaction control (BEGIN/COMMIT explicit within auto-apply)  
❌ Function/trigger definitions (use separate phase)  

### Pattern Validation
The auto-apply cron validates each migration starts with one of:
```
CREATE
ALTER
DROP
INSERT
```

If none match and the RPC fallback activates, the cron rejects the migration with error message:
```
Unsupported migration pattern
```

### RLS Policy Standards
Every migration creating a table MUST include RLS enablement:
```sql
-- ✅ Correct pattern
CREATE TABLE audit_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  payload JSONB
);

ALTER TABLE audit_event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_view_own_logs"
  ON audit_event_logs
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 4. Execution Flow & State Management

### Migration History Tracking
The cron maintains `.migration-history.json` with structure:
```json
{
  "last_check": "2026-05-29T08:00:00Z",
  "applied": {
    "35_audit_system.sql": {
      "timestamp": "2026-05-23T12:12:00Z",
      "duration_ms": 1250
    }
  },
  "failed": {
    "99_future_schema.sql": {
      "timestamp": "2026-05-29T08:00:00Z",
      "error": "table already exists"
    }
  }
}
```

### Detection Algorithm
```
1. Load .migration-history.json (or init empty)
2. Read all *.sql files from db/ directory (sorted alphabetically)
3. Filter:
   - Exclude files in history.applied
   - Exclude files in history.failed
4. Return pending files as execution queue
```

### Execution Algorithm
```
FOR EACH pending_file:
  1. Read SQL content from disk
  2. Call Supabase RPC exec_sql(sql_text)
  3. ON success:
     - Record in history.applied[filename]
     - Log result with duration_ms
  4. ON error:
     - Record in history.failed[filename]
     - Capture error message
     - CONTINUE to next file (don't block)
5. Save updated history to .migration-history.json
6. Send Telegram notification (summary + failures)
```

### Error Recovery
- **Failed migrations are NOT retried automatically** (to prevent loop cycles)
- Failed migrations MUST be:
  1. Fixed in the SQL file (edit db/XX_*.sql)
  2. Removed from history.failed in .migration-history.json
  3. Next cron execution will retry

---

## 5. Telegram Notification Format

### Success Notification
```
✅ **DB Migration Auto-Apply**

Processed 3 pending migrations

✅ Success: 3
Timestamp: 2026-05-29 08:00:00 KST
```

### Failure Notification
```
❌ **DB Migration Auto-Apply**

Processed 2 pending migrations

✅ Success: 1
❌ Failed: 1

**Failed Migrations:**
• 42_team_dashboard_phase2_api.sql: Syntax error at line 15
Timestamp: 2026-05-29 08:00:00 KST
```

### No Pending Migrations
```
✅ **DB Migration Auto-Apply**

No pending migrations
Timestamp: 2026-05-29 08:00:00 KST
```

---

## 6. Environment Variables Required

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | https://pzkvhomh...supabase.co | Supabase project endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | eyJhbGc... | Service role for DDL execution |
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | 1234567890:ABC... | Telegram Bot API token |
| `TELEGRAM_SECRETARY_CHAT_ID` | ✅ Yes | 8650232975 | Destination chat for notifications |
| `VERCEL_CRON_SECRET` | ✅ Yes | random-secret-key | Prevents unauthorized cron triggers |

**Setup Instructions:**
1. Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable with value from Supabase/Telegram/Vercel
3. Re-deploy after adding variables
4. Cron requests without valid VERCEL_CRON_SECRET will receive 401 Unauthorized

---

## 7. Cron Endpoint API

### Endpoint
```
GET /api/cron/db-migration/auto-apply
```

### Request Headers
```
Authorization: Bearer {VERCEL_CRON_SECRET}
```

### Response (Success)
```json
{
  "status": "success",
  "message": "3 migrations applied, 0 failed",
  "results": [
    {
      "timestamp": "2026-05-29T08:00:00Z",
      "migration": "35_audit_system.sql",
      "status": "success",
      "duration_ms": 1250
    },
    {
      "timestamp": "2026-05-29T08:00:01Z",
      "migration": "42_team_dashboard_phase2_api.sql",
      "status": "success",
      "duration_ms": 2100
    }
  ],
  "timestamp": "2026-05-29T08:00:02Z"
}
```

### Response (Failure)
```json
{
  "status": "success",
  "message": "1 migrations applied, 1 failed",
  "results": [
    {
      "timestamp": "2026-05-29T08:00:00Z",
      "migration": "35_audit_system.sql",
      "status": "success",
      "duration_ms": 1250
    },
    {
      "timestamp": "2026-05-29T08:00:01Z",
      "migration": "42_team_dashboard_phase2_api.sql",
      "status": "failed",
      "error": "relation \"team_dashboard_events\" already exists"
    }
  ],
  "timestamp": "2026-05-29T08:00:02Z"
}
```

### Response (Cron Error)
```json
{
  "status": "error",
  "message": "Migration auto-apply failed",
  "error": "Missing Supabase credentials",
  "timestamp": "2026-05-29T08:00:00Z"
}
```
HTTP Status: 500

---

## 8. Testing Phase 1.3 Locally

### Prerequisite
```bash
# Ensure Next.js dev server running
npm run dev
```

### Manual Cron Trigger (Simulated)
```bash
# Create test migration
cat > db/98_test_migration.sql << 'EOF'
CREATE TABLE test_migration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE test_migration ENABLE ROW LEVEL SECURITY;
EOF

# Trigger cron manually via curl
curl -H "Authorization: Bearer $VERCEL_CRON_SECRET" \
  http://localhost:3000/api/cron/db-migration/auto-apply

# Verify response
# Check .migration-history.json for applied entry
cat .migration-history.json
```

### Verify Supabase Integration
```bash
# Ensure SERVICE_ROLE_KEY is set
echo $SUPABASE_SERVICE_ROLE_KEY

# Check Supabase table exists
# Dashboard → SQL Editor → SELECT * FROM test_migration;
```

### Telegram Notification Verification
1. Check `TELEGRAM_SECRETARY_CHAT_ID` receives notification
2. Verify format matches specification
3. Confirm success/failure counts match actual results

---

## 9. Implementation Timeline (Phase 1.3)

| Date | Task | Status |
|------|------|--------|
| 2026-05-29 | Create migration cron endpoint | ✅ Complete |
| 2026-05-29 | Register cron in vercel.json | ✅ Complete |
| 2026-05-29 | Create Phase 1.3 standards doc | ✅ Complete |
| 2026-05-29 | Build & verify cron endpoint compiles | 🟡 In Progress |
| 2026-05-29 | Commit Phase 1.3 changes to git | 🟡 Pending |
| 2026-05-30 | Manual cron trigger + Supabase validation | 🟡 Pending |
| 2026-05-31 | Cron execution verified in Vercel logs | 🟡 Pending |

---

## 10. Phase 1 Completion Checklist

**Phase 1.2: Test Automation Standardization**
- [x] Cron endpoint created (`daily-report/route.ts`)
- [x] Registered in `vercel.json` with schedule "0 8 * * *"
- [x] Build verification passed
- [x] Test Standards documented (HARNESS_PHASE_1_2_TEST_STANDARDS.md)

**Phase 1.3: Migration Auto-Apply Standardization** (THIS DOCUMENT)
- [x] Migration cron endpoint created (`db-migration/auto-apply/route.ts`)
- [x] Registered in `vercel.json` with schedule "0 * * * *"
- [ ] Build verification passed
- [x] Migration Standards documented (this file)
- [ ] Commit Phase 1.3 changes

**Phase 1 Summary (by 2026-05-31):**
- ✅ Test Automation Standardization (Phase 1.2)
- ✅ Migration Auto-Apply Standardization (Phase 1.3)
- 📋 Monitoring & Alerting Standardization (Phase 2 — scheduled 2026-06-01~05)

---

## Related References

- **Predecessor:** HARNESS_PHASE_1_2_TEST_STANDARDS.md
- **Parent Plan:** HARNESS_ENGINEERING_STANDARDIZATION_PLAN.md
- **Migration Files:** dsc-fms-portal/db/*.sql
- **Cron Implementation:** dsc-fms-portal/app/api/cron/db-migration/auto-apply/route.ts
- **Vercel Config:** dsc-fms-portal/vercel.json

---

**Next Phase:** Phase 2 (2026-06-01~05) — Monitoring & Alerting Standardization
