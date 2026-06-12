-- Asset Master Phase 3-6 Database Migration
-- Adds edit history tracking and asset disposal management
-- Created: 2026-06-12

-- ============================================================================
-- 1. ALTER assets TABLE — Add edit tracking columns
-- ============================================================================

ALTER TABLE IF EXISTS public.assets
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb COMMENT 'JSON snapshot of edit history';

ALTER TABLE IF EXISTS public.assets
ADD COLUMN IF NOT EXISTS last_edited_by UUID COMMENT 'UUID of user who last edited';

ALTER TABLE IF EXISTS public.assets
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ DEFAULT NOW() COMMENT 'Timestamp of last edit';

-- Add foreign key constraint for last_edited_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_assets_last_edited_by'
  ) THEN
    ALTER TABLE public.assets
    ADD CONSTRAINT fk_assets_last_edited_by
    FOREIGN KEY (last_edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- ============================================================================
-- 2. CREATE asset_edit_history TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.asset_edit_history (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_field VARCHAR(255) NOT NULL COMMENT 'Name of field that changed',
  previous_value TEXT COMMENT 'Value before change',
  new_value TEXT COMMENT 'Value after change',
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  COMMENT ON TABLE public.asset_edit_history IS 'Audit trail of all asset field changes'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_edit_history_asset_id
ON public.asset_edit_history(asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_edit_history_changed_at
ON public.asset_edit_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_asset_edit_history_changed_by
ON public.asset_edit_history(changed_by);

-- Enable RLS on asset_edit_history
ALTER TABLE public.asset_edit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own changes
CREATE POLICY IF NOT EXISTS "Users view own edit history"
ON public.asset_edit_history
FOR SELECT
USING (changed_by = AUTH.UID());

-- RLS Policy: Users can only insert their own changes
CREATE POLICY IF NOT EXISTS "Users insert own edit history"
ON public.asset_edit_history
FOR INSERT
WITH CHECK (changed_by = AUTH.UID());

-- ============================================================================
-- 3. CREATE asset_disposals TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.asset_disposals (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  disposed_by UUID NOT NULL REFERENCES auth.users(id),
  disposal_reason VARCHAR(255) NOT NULL COMMENT 'Reason for disposal (수명만료, 손상, 판매, 기증, 기타)',
  disposal_date DATE NOT NULL COMMENT 'Date of disposal',
  disposal_certificate_url TEXT COMMENT 'URL to disposal certificate/proof',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  COMMENT ON TABLE public.asset_disposals IS 'Records of asset disposals and decommissioning'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset_id
ON public.asset_disposals(asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_disposals_disposed_by
ON public.asset_disposals(disposed_by);

CREATE INDEX IF NOT EXISTS idx_asset_disposals_created_at
ON public.asset_disposals(created_at DESC);

-- Enable RLS on asset_disposals
ALTER TABLE public.asset_disposals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view disposals they created or are in their portfolio
CREATE POLICY IF NOT EXISTS "Users view own disposals or portfolio assets"
ON public.asset_disposals
FOR SELECT
USING (
  disposed_by = AUTH.UID() OR
  asset_id IN (
    SELECT asset_id FROM public.portfolio_assets
    WHERE portfolio_id IN (
      SELECT id FROM public.portfolios WHERE owner_id = AUTH.UID()
    )
  )
);

-- RLS Policy: Users can only insert their own disposals
CREATE POLICY IF NOT EXISTS "Users insert own disposals"
ON public.asset_disposals
FOR INSERT
WITH CHECK (disposed_by = AUTH.UID());

-- ============================================================================
-- 4. CREATE TRIGGER for asset_edit_history on assets updates
-- ============================================================================

CREATE OR REPLACE FUNCTION public.track_asset_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if we're updating (not inserting)
  IF TG_OP = 'UPDATE' THEN
    -- For each field that changed, insert a record into asset_edit_history
    -- This is a generic approach that tracks specific important fields

    IF OLD.name != NEW.name THEN
      INSERT INTO public.asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, AUTH.UID(), 'name', OLD.name, NEW.name);
    END IF;

    IF OLD.status != NEW.status THEN
      INSERT INTO public.asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, AUTH.UID(), 'status', OLD.status, NEW.status);
    END IF;

    IF OLD.location != NEW.location THEN
      INSERT INTO public.asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, AUTH.UID(), 'location', OLD.location, NEW.location);
    END IF;

    IF OLD.condition != NEW.condition THEN
      INSERT INTO public.asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
      VALUES (NEW.id, AUTH.UID(), 'condition', OLD.condition, NEW.condition);
    END IF;

    -- Update the assets table tracking columns
    NEW.last_edited_by = AUTH.UID();
    NEW.last_edited_at = NOW();
  END IF;

  RETURN NEW;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on assets table
DROP TRIGGER IF EXISTS tr_track_asset_changes ON public.assets;
CREATE TRIGGER tr_track_asset_changes
AFTER UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.track_asset_changes();

-- ============================================================================
-- 5. COMMENT ON COLUMNS
-- ============================================================================

COMMENT ON COLUMN public.asset_edit_history.changed_field IS 'Name of the field that was changed (e.g., name, status, location)';
COMMENT ON COLUMN public.asset_edit_history.previous_value IS 'The value before the change';
COMMENT ON COLUMN public.asset_edit_history.new_value IS 'The value after the change';

COMMENT ON COLUMN public.asset_disposals.disposal_reason IS 'Reason for disposal: 수명만료 | 손상 | 판매 | 기증 | 기타';
COMMENT ON COLUMN public.asset_disposals.disposal_date IS 'Date when the asset was disposed (must be <= today)';
COMMENT ON COLUMN public.asset_disposals.disposal_certificate_url IS 'Optional URL to disposal certificate or proof document';
