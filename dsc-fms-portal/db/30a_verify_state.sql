-- Quick verification script to check current state before applying db/30
-- Run this first to see what's already been applied

-- 1. Check if constraint exists
SELECT
  'Constraint Check' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'assets'
    AND constraint_name = 'fk_assets_last_edited_by'
  ) THEN 'EXISTS ✓' ELSE 'NOT FOUND' END as status;

-- 2. Check if tables exist
SELECT 'Tables Check' as check_name,
  'asset_edit_history' as table_name,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name='asset_edit_history') as exists
UNION ALL
SELECT 'Tables Check',
  'asset_disposals',
  EXISTS(SELECT FROM information_schema.tables WHERE table_name='asset_disposals');

-- 3. Check if columns exist in assets
SELECT 'Column: ' || column_name as check_name,
  'EXISTS ✓' as status
FROM information_schema.columns
WHERE table_name = 'assets'
AND column_name IN ('edit_history', 'last_edited_by', 'last_edited_at')
ORDER BY column_name;

-- 4. Check if triggers exist
SELECT 'Trigger: ' || trigger_name as check_name,
  'EXISTS ✓' as status
FROM information_schema.triggers
WHERE event_object_table = 'assets'
AND trigger_name IN ('trigger_update_asset_edit_tracking', 'trigger_log_asset_changes');
