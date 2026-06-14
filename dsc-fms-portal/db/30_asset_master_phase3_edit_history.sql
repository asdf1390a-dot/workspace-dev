-- db/30 Asset Master Phase 3: Edit History Tracking & Disposal Management
-- Created: 2026-06-14 18:40 KST
-- Purpose: Add edit tracking and disposal management to asset master
-- Depends on: db/29

-- ============================================================================
-- 1. ALTER assets table: Add edit tracking columns
-- ============================================================================

ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  edit_history JSONB DEFAULT '[]'::jsonb;           -- 편집 이력 snapshot

ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  last_edited_by uuid;                               -- 마지막 편집자

ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  last_edited_at timestamptz DEFAULT now();          -- 마지막 편집 시간

-- Add foreign key constraint if not exists
ALTER TABLE assets
  ADD CONSTRAINT fk_assets_last_edited_by
  FOREIGN KEY (last_edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. CREATE asset_edit_history table
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_edit_history (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_field VARCHAR(255) NOT NULL,       -- 변경된 필드명
  previous_value TEXT,                       -- 이전값
  new_value TEXT,                            -- 새값
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_edit_history_asset_id
  ON asset_edit_history(asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_edit_history_changed_at
  ON asset_edit_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_asset_edit_history_changed_by
  ON asset_edit_history(changed_by);

-- ============================================================================
-- 3. CREATE asset_disposals table
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_disposals (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  disposed_by UUID NOT NULL REFERENCES auth.users(id),
  disposal_reason VARCHAR(255) NOT NULL,    -- 폐기 사유 (수명만료, 손상, etc)
  disposal_date DATE NOT NULL,               -- 폐기 날짜
  disposal_certificate_url TEXT,             -- 폐기 증명서 (선택)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset_id
  ON asset_disposals(asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_disposals_disposed_by
  ON asset_disposals(disposed_by);

CREATE INDEX IF NOT EXISTS idx_asset_disposals_created_at
  ON asset_disposals(created_at);

-- ============================================================================
-- 4. Enable RLS on asset_edit_history
-- ============================================================================

ALTER TABLE asset_edit_history ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view edit history of assets they own
CREATE POLICY "asset_edit_history_select_policy"
  ON asset_edit_history
  FOR SELECT
  USING (
    asset_id IN (
      SELECT id FROM assets WHERE portfolio_id IN (
        SELECT id FROM portfolios WHERE owner_id = auth.uid()
      )
    )
  );

-- INSERT: Users can only log their own edits
CREATE POLICY "asset_edit_history_insert_policy"
  ON asset_edit_history
  FOR INSERT
  WITH CHECK (changed_by = auth.uid());

-- ============================================================================
-- 5. Enable RLS on asset_disposals
-- ============================================================================

ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view disposals of assets they own
CREATE POLICY "asset_disposals_select_policy"
  ON asset_disposals
  FOR SELECT
  USING (
    asset_id IN (
      SELECT id FROM assets WHERE portfolio_id IN (
        SELECT id FROM portfolios WHERE owner_id = auth.uid()
      )
    )
  );

-- INSERT: Users can only dispose of assets they own
CREATE POLICY "asset_disposals_insert_policy"
  ON asset_disposals
  FOR INSERT
  WITH CHECK (
    disposed_by = auth.uid()
    AND asset_id IN (
      SELECT id FROM assets WHERE portfolio_id IN (
        SELECT id FROM portfolios WHERE owner_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 6. Trigger: Auto-update last_edited_by and last_edited_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_asset_edit_tracking()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited_by := auth.uid();
  NEW.last_edited_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_asset_edit_tracking ON assets;

CREATE TRIGGER trigger_update_asset_edit_tracking
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_edit_tracking();

-- ============================================================================
-- 7. Trigger: Log asset changes to asset_edit_history
-- ============================================================================

CREATE OR REPLACE FUNCTION log_asset_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD IS DISTINCT FROM NEW THEN
    -- Log each changed field
    IF OLD.asset_tag IS DISTINCT FROM NEW.asset_tag THEN
      INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, auth.uid(), 'asset_tag', COALESCE(OLD.asset_tag::text, 'null'), COALESCE(NEW.asset_tag::text, 'null'));
    END IF;

    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, auth.uid(), 'description', COALESCE(OLD.description::text, 'null'), COALESCE(NEW.description::text, 'null'));
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, auth.uid(), 'status', COALESCE(OLD.status::text, 'null'), COALESCE(NEW.status::text, 'null'));
    END IF;

    IF OLD.location IS DISTINCT FROM NEW.location THEN
      INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, auth.uid(), 'location', COALESCE(OLD.location::text, 'null'), COALESCE(NEW.location::text, 'null'));
    END IF;

    IF OLD.department IS DISTINCT FROM NEW.department THEN
      INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, auth.uid(), 'department', COALESCE(OLD.department::text, 'null'), COALESCE(NEW.department::text, 'null'));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_asset_changes ON assets;

CREATE TRIGGER trigger_log_asset_changes
  AFTER UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION log_asset_changes();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration adds:
-- 1. Edit tracking columns to assets table
-- 2. asset_edit_history table for audit trail
-- 3. asset_disposals table for disposal management
-- 4. RLS policies for both tables
-- 5. Automatic triggers for edit tracking
--
-- Ready for Asset Master Phase 3-6 API development
-- ============================================================================
