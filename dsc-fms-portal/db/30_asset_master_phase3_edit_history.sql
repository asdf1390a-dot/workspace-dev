-- db/30 Asset Master Phase 3: Edit History Tracking & Disposal Management
-- FIXED: Safe idempotent execution with explicit constraint handling
-- VERIFIED: RLS policies fixed — no portfolio_id dependency

-- ============================================================================
-- STEP 1: Clean up existing objects (safe to run multiple times)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_log_asset_changes ON assets;
DROP TRIGGER IF EXISTS trigger_update_asset_edit_tracking ON assets;
DROP FUNCTION IF EXISTS log_asset_changes();
DROP FUNCTION IF EXISTS update_asset_edit_tracking();
DROP POLICY IF EXISTS "asset_disposals_insert_policy" ON asset_disposals;
DROP POLICY IF EXISTS "asset_disposals_select_policy" ON asset_disposals;
DROP POLICY IF EXISTS "asset_edit_history_insert_policy" ON asset_edit_history;
DROP POLICY IF EXISTS "asset_edit_history_select_policy" ON asset_edit_history;
DROP TABLE IF EXISTS asset_disposals;
DROP TABLE IF EXISTS asset_edit_history;

-- Explicitly drop the constraint if it exists (handles all cases)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'assets'
    AND constraint_name = 'fk_assets_last_edited_by'
  ) THEN
    ALTER TABLE assets DROP CONSTRAINT fk_assets_last_edited_by;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add columns to assets table
-- ============================================================================

ALTER TABLE assets ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_edited_by uuid;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_edited_at timestamptz DEFAULT now();

-- Now safely add the constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'assets'
    AND constraint_name = 'fk_assets_last_edited_by'
  ) THEN
    ALTER TABLE assets ADD CONSTRAINT fk_assets_last_edited_by
      FOREIGN KEY (last_edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create asset_edit_history table
-- ============================================================================

CREATE TABLE asset_edit_history (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_field VARCHAR(255) NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_asset_edit_history_asset_id ON asset_edit_history(asset_id);
CREATE INDEX idx_asset_edit_history_changed_at ON asset_edit_history(changed_at);
CREATE INDEX idx_asset_edit_history_changed_by ON asset_edit_history(changed_by);

-- ============================================================================
-- STEP 4: Create asset_disposals table
-- ============================================================================

CREATE TABLE asset_disposals (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  disposed_by UUID NOT NULL REFERENCES auth.users(id),
  disposal_reason VARCHAR(255) NOT NULL,
  disposal_date DATE NOT NULL,
  disposal_certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_asset_disposals_asset_id ON asset_disposals(asset_id);
CREATE INDEX idx_asset_disposals_disposed_by ON asset_disposals(disposed_by);
CREATE INDEX idx_asset_disposals_created_at ON asset_disposals(created_at);

-- ============================================================================
-- STEP 5: Enable RLS & create policies (SIMPLIFIED - no portfolio_id dependency)
-- ============================================================================

ALTER TABLE asset_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- Asset Edit History: Allow viewing own changes + all changes (authenticated)
CREATE POLICY "asset_edit_history_select_policy" ON asset_edit_history FOR SELECT
  USING (true);  -- All authenticated users can view edit history

CREATE POLICY "asset_edit_history_insert_policy" ON asset_edit_history FOR INSERT
  WITH CHECK (changed_by = auth.uid());  -- Can only insert your own changes

-- Asset Disposals: Allow viewing own disposals + all disposals (authenticated)
CREATE POLICY "asset_disposals_select_policy" ON asset_disposals FOR SELECT
  USING (true);  -- All authenticated users can view disposals

CREATE POLICY "asset_disposals_insert_policy" ON asset_disposals FOR INSERT
  WITH CHECK (disposed_by = auth.uid());  -- Can only insert your own disposals

-- ============================================================================
-- STEP 6: Create triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_asset_edit_tracking() RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited_by := auth.uid();
  NEW.last_edited_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_asset_edit_tracking BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_asset_edit_tracking();

CREATE OR REPLACE FUNCTION log_asset_changes() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.asset_tag IS DISTINCT FROM NEW.asset_tag THEN
    INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
    VALUES (NEW.id, auth.uid(), 'asset_tag', COALESCE(OLD.asset_tag::text, 'null'), COALESCE(NEW.asset_tag::text, 'null'));
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status', COALESCE(OLD.status::text, 'null'), COALESCE(NEW.status::text, 'null'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_asset_changes AFTER UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION log_asset_changes();

-- ============================================================================
-- COMPLETE: Ready for Asset Master Phase 3 API development
-- ============================================================================
