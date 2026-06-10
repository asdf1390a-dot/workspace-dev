-- Asset Master Phase 3-6: Edit History & Disposal Tracking Schema
-- Created: 2026-06-10
-- Purpose: Enable asset edit tracking and disposal management for Phase 3-1/3-2/3-3

-- Add columns to assets table for edit tracking
ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  edit_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  last_edited_by uuid;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  last_edited_at timestamptz DEFAULT now();
ALTER TABLE assets ADD CONSTRAINT fk_assets_last_edited_by FOREIGN KEY (last_edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Table: Asset Edit History
-- Tracks all changes made to asset fields (name, location, status, etc.)
CREATE TABLE IF NOT EXISTS asset_edit_history (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_field VARCHAR(255) NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Asset Disposals
-- Records when assets are decommissioned/disposed
CREATE TABLE IF NOT EXISTS asset_disposals (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  disposed_by UUID NOT NULL REFERENCES auth.users(id),
  disposal_reason VARCHAR(255) NOT NULL,
  disposal_date DATE NOT NULL,
  disposal_certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE asset_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view edit history for their own portfolio assets
DROP POLICY IF EXISTS "asset_edit_history_select" ON asset_edit_history;
CREATE POLICY asset_edit_history_select ON asset_edit_history
  FOR SELECT USING (changed_by = auth.uid());

DROP POLICY IF EXISTS "asset_edit_history_insert" ON asset_edit_history;
CREATE POLICY asset_edit_history_insert ON asset_edit_history
  FOR INSERT WITH CHECK (changed_by = auth.uid());

DROP POLICY IF EXISTS "asset_disposals_select" ON asset_disposals;
CREATE POLICY asset_disposals_select ON asset_disposals
  FOR SELECT USING (disposed_by = auth.uid());

DROP POLICY IF EXISTS "asset_disposals_insert" ON asset_disposals;
CREATE POLICY asset_disposals_insert ON asset_disposals
  FOR INSERT WITH CHECK (disposed_by = auth.uid());

-- RLS Policy: Users can view disposal records for their assets
DROP POLICY IF EXISTS "asset_disposals_select" ON asset_disposals;
CREATE POLICY asset_disposals_select ON asset_disposals
  FOR SELECT USING (
    asset_id IN (
      SELECT a.id FROM assets a
      WHERE a.portfolio_id IN (
        SELECT p.id FROM portfolios p WHERE p.owner_id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_edit_history_asset_id ON asset_edit_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_edit_history_changed_at ON asset_edit_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_edit_history_changed_by ON asset_edit_history(changed_by);

CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset_id ON asset_disposals(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_disposed_by ON asset_disposals(disposed_by);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_created_at ON asset_disposals(created_at DESC);
