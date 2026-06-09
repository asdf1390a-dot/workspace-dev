-- Asset Disposal History Table
-- Immutable audit trail for asset disposal operations
-- Provides historical record of all asset disposals

CREATE TABLE IF NOT EXISTS asset_disposal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to asset
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

  -- Disposal details (immutable once recorded)
  disposal_reason TEXT NOT NULL,
  disposal_price NUMERIC,
  buyer_name TEXT,
  buyer_contact TEXT,
  disposal_date TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Audit trail
  disposal_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for queries
CREATE INDEX IF NOT EXISTS asset_disposal_history_asset_idx
  ON asset_disposal_history(asset_id);
CREATE INDEX IF NOT EXISTS asset_disposal_history_date_idx
  ON asset_disposal_history(disposal_date DESC);

-- RLS Policy — Read access for authenticated users
ALTER TABLE asset_disposal_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disposal_history_select" ON asset_disposal_history;
DROP POLICY IF EXISTS "disposal_history_insert" ON asset_disposal_history;

CREATE POLICY "disposal_history_select" ON asset_disposal_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "disposal_history_insert" ON asset_disposal_history
  FOR INSERT TO authenticated WITH CHECK (true);
