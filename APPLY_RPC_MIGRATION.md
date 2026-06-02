# 🔧 Apply RPC Migration for DELETE Asset API

**Status:** ❌ BLOCKED - Waiting for RPC migration application
**Error:** `Could not find the function public.delete_asset_with_audit(p_asset_id, p_deleted_by) in the schema cache`

## Current Test Results
- ✅ 22/26 tests passing (84%)
- ❌ 1 test failing: DELETE /api/assets/:id (waiting for RPC function)
- ⏭️ 3 tests skipped

## Why This is Needed
The DELETE operation requires an RPC function that safely deletes an asset while preserving audit logs. The function:
1. Disables the audit trigger during deletion
2. Deletes the asset
3. Manually inserts an audit record with the old asset data
4. Re-enables the trigger

This prevents the foreign key constraint violation that was causing the test to fail.

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended for immediate action)

1. Go to: https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql/new
2. Copy the entire content from: `/dsc-fms-portal/db/29a_asset_delete_rpc.sql`
3. Paste into the SQL editor
4. Click **Run** button
5. Wait for success message

The SQL will:
- Drop any existing `delete_asset_with_audit` function
- Create the new function
- Grant execute permissions to authenticated users

### Option 2: Supabase CLI (If installed)

```bash
cd dsc-fms-portal
supabase db push  # This will apply all pending migrations
```

### Option 3: Using Node.js script (Requires dashboard execution first)

After applying via dashboard, verify with:
```bash
npm test -- __tests__/api/assets.integration.test.ts
```

## SQL Migration Content

Location: `dsc-fms-portal/db/29a_asset_delete_rpc.sql`

The migration creates:
- Function: `public.delete_asset_with_audit(uuid, uuid) → json`
- Permissions: Executable by authenticated users
- Error handling: Proper exception handling with trigger re-enabling

## What Happens After Application

1. The DELETE API endpoint will be able to call the RPC function
2. Asset deletion will be atomic with proper audit logging
3. The failing test will pass
4. All 26 asset API tests will pass

## Next Steps

1. **CEO/User Action Required:** Apply the SQL migration via dashboard (5 minutes)
2. **Verification:** Run `npm test -- __tests__/api/assets.integration.test.ts` to confirm all 26 tests pass
3. **Git Commit:** Commit the API changes + migration file
4. **Report:** Confirm Phase 2 MVP API implementation complete

## Files Modified

- ✅ `app/api/assets/[assetId]/route.ts` - DELETE handler updated to use RPC
- ✅ `db/29a_asset_delete_rpc.sql` - New RPC migration (ready to apply)

## Timeline

- Created: 2026-06-02 (this session)
- Blocked on: RPC migration application to Supabase
- Estimated completion after application: 5 minutes
