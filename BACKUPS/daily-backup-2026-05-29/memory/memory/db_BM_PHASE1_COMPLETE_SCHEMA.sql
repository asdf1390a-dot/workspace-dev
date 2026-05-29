-- DSC-INDIA-MANNUR-BM Phase 1 Complete Schema Migration
-- Database: Breakdown Management System
-- Created: 2026-05-28
-- Tables: breakdowns, root_causes, corrective_actions, breakdown_responses, breakdown_history
-- RLS: Enabled on all tables

-- ============================================================================
-- TABLE 1: breakdowns (Main incident records)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  incident_number TEXT NOT NULL UNIQUE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,

  -- Time Information
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurred_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,

  -- Status Management
  status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'medium',

  -- Personnel
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),

  -- Categorization
  breakdown_category TEXT,
  failure_mode TEXT,

  -- Metrics
  downtime_minutes INT DEFAULT 0,
  estimated_cost DECIMAL(10,2),
  priority INT DEFAULT 3,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  CONSTRAINT status_check CHECK (status IN ('open', 'investigating', 'in_progress', 'closed', 'deferred')),
  CONSTRAINT severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT priority_check CHECK (priority >= 1 AND priority <= 5),
  CONSTRAINT downtime_check CHECK (downtime_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_breakdowns_asset_id ON public.breakdowns(asset_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_status ON public.breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_breakdowns_reported_at ON public.breakdowns(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_breakdowns_assigned_to ON public.breakdowns(assigned_to);
CREATE INDEX IF NOT EXISTS idx_breakdowns_severity ON public.breakdowns(severity);
CREATE INDEX IF NOT EXISTS idx_breakdowns_created_by ON public.breakdowns(created_by);

-- RLS Policies for breakdowns
ALTER TABLE public.breakdowns ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view breakdowns from their facility
CREATE POLICY IF NOT EXISTS "breakdowns_select_facility"
  ON public.breakdowns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assets a
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE a.id = breakdowns.asset_id
        AND a.facility_id = u.facility_id
    )
  );

-- Policy 2: Users can create breakdowns in their facility
CREATE POLICY IF NOT EXISTS "breakdowns_insert_facility"
  ON public.breakdowns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assets a
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE a.id = asset_id
        AND a.facility_id = u.facility_id
    )
  );

-- Policy 3: Creator or assignee can update
CREATE POLICY IF NOT EXISTS "breakdowns_update_owner"
  ON public.breakdowns FOR UPDATE
  USING (created_by = auth.uid() OR assigned_to = auth.uid())
  WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid());

-- Policy 4: Admin only can delete
CREATE POLICY IF NOT EXISTS "breakdowns_delete_admin"
  ON public.breakdowns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TABLE 2: root_causes (Root cause analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.root_causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES public.breakdowns(id) ON DELETE CASCADE,

  -- Root Cause Information
  root_cause_type TEXT NOT NULL,
  description TEXT NOT NULL,
  contributing_factors TEXT[] DEFAULT '{}',

  -- Analysis Details
  analysis_method TEXT,
  analyzed_by UUID NOT NULL REFERENCES auth.users(id),
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scoring
  frequency_score INT,
  impact_score INT,
  confidence_level INT DEFAULT 50,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT root_cause_type_check CHECK (
    root_cause_type IN ('design_flaw', 'manufacturing_defect', 'wear_tear', 'operator_error', 'maintenance_gap', 'environmental', 'other')
  ),
  CONSTRAINT frequency_check CHECK (frequency_score IS NULL OR (frequency_score >= 1 AND frequency_score <= 5)),
  CONSTRAINT impact_check CHECK (impact_score IS NULL OR (impact_score >= 1 AND impact_score <= 5)),
  CONSTRAINT confidence_check CHECK (confidence_level >= 0 AND confidence_level <= 100)
);

CREATE INDEX IF NOT EXISTS idx_root_causes_breakdown_id ON public.root_causes(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_root_causes_analyzed_at ON public.root_causes(analyzed_at DESC);

-- RLS Policies for root_causes
ALTER TABLE public.root_causes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view root causes of their facility's breakdowns
CREATE POLICY IF NOT EXISTS "root_causes_select_facility"
  ON public.root_causes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.breakdowns b
      INNER JOIN public.assets a ON a.id = b.asset_id
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE b.id = root_causes.breakdown_id
        AND a.facility_id = u.facility_id
    )
  );

-- Policy 2: Users can insert root causes for their facility's breakdowns
CREATE POLICY IF NOT EXISTS "root_causes_insert_facility"
  ON public.root_causes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.breakdowns b
      INNER JOIN public.assets a ON a.id = b.asset_id
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE b.id = breakdown_id
        AND a.facility_id = u.facility_id
    )
  );

-- Policy 3: Analysts and admins can update
CREATE POLICY IF NOT EXISTS "root_causes_update_analyst"
  ON public.root_causes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND role IN ('analyst', 'admin')
    )
  );

-- ============================================================================
-- TABLE 3: corrective_actions (Corrective actions and tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES public.breakdowns(id) ON DELETE CASCADE,

  -- Action Information
  action_description TEXT NOT NULL,
  action_category TEXT NOT NULL,

  -- Ownership
  priority INT DEFAULT 3,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Timeline
  planned_start_date TIMESTAMPTZ,
  planned_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'open',
  completion_percentage INT DEFAULT 0,

  -- Cost Tracking
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),

  -- Documentation
  documents TEXT[] DEFAULT '{}',
  completion_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT action_category_check CHECK (
    action_category IN ('replacement', 'repair', 'design_change', 'training', 'preventive', 'other')
  ),
  CONSTRAINT status_check CHECK (
    status IN ('open', 'in_progress', 'completed', 'deferred', 'cancelled')
  ),
  CONSTRAINT priority_check CHECK (priority >= 1 AND priority <= 5),
  CONSTRAINT completion_check CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_corrective_actions_breakdown_id ON public.corrective_actions(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_assigned_to ON public.corrective_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_status ON public.corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_planned_end ON public.corrective_actions(planned_end_date);

-- RLS Policies for corrective_actions
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view actions of their facility's breakdowns
CREATE POLICY IF NOT EXISTS "corrective_actions_select_facility"
  ON public.corrective_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.breakdowns b
      INNER JOIN public.assets a ON a.id = b.asset_id
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE b.id = corrective_actions.breakdown_id
        AND a.facility_id = u.facility_id
    )
  );

-- Policy 2: Users can insert actions for their facility's breakdowns
CREATE POLICY IF NOT EXISTS "corrective_actions_insert_facility"
  ON public.corrective_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.breakdowns b
      INNER JOIN public.assets a ON a.id = b.asset_id
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE b.id = breakdown_id
        AND a.facility_id = u.facility_id
    )
  );

-- Policy 3: Assigned users can update their actions
CREATE POLICY IF NOT EXISTS "corrective_actions_update_assigned"
  ON public.corrective_actions FOR UPDATE
  USING (assigned_to = auth.uid() OR created_by = auth.uid())
  WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

-- ============================================================================
-- TABLE 4: breakdown_responses (Response workflow records)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.breakdown_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES public.breakdowns(id) ON DELETE CASCADE,

  -- Response Information
  response_type TEXT NOT NULL,
  response_description TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),

  -- Timing
  response_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_duration_minutes INT,

  -- Results
  effectiveness_level TEXT,
  parts_used TEXT[] DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',

  -- Documentation
  photos TEXT[] DEFAULT '{}',
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT response_type_check CHECK (
    response_type IN ('initial_assessment', 'temporary_fix', 'permanent_fix', 'escalation', 'other')
  ),
  CONSTRAINT effectiveness_check CHECK (
    effectiveness_level IS NULL OR effectiveness_level IN ('ineffective', 'partial', 'effective', 'fully_resolved')
  ),
  CONSTRAINT duration_check CHECK (response_duration_minutes IS NULL OR response_duration_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_breakdown_responses_breakdown_id ON public.breakdown_responses(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_responses_response_at ON public.breakdown_responses(response_at DESC);
CREATE INDEX IF NOT EXISTS idx_breakdown_responses_performed_by ON public.breakdown_responses(performed_by);

-- RLS Policies for breakdown_responses
ALTER TABLE public.breakdown_responses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view responses of their facility's breakdowns
CREATE POLICY IF NOT EXISTS "breakdown_responses_select_facility"
  ON public.breakdown_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.breakdowns b
      INNER JOIN public.assets a ON a.id = b.asset_id
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE b.id = breakdown_responses.breakdown_id
        AND a.facility_id = u.facility_id
    )
  );

-- ============================================================================
-- TABLE 5: breakdown_history (Audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.breakdown_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES public.breakdowns(id) ON DELETE CASCADE,

  -- Change Information
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_type TEXT NOT NULL,

  -- Change Metadata
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,

  CONSTRAINT change_type_check CHECK (
    change_type IN ('created', 'updated', 'status_changed', 'assigned', 'closed', 'reopened', 'other')
  )
);

CREATE INDEX IF NOT EXISTS idx_breakdown_history_breakdown_id ON public.breakdown_history(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_history_changed_at ON public.breakdown_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_breakdown_history_changed_by ON public.breakdown_history(changed_by);

-- RLS Policies for breakdown_history
ALTER TABLE public.breakdown_history ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view history of their facility's breakdowns
CREATE POLICY IF NOT EXISTS "breakdown_history_select_facility"
  ON public.breakdown_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.breakdowns b
      INNER JOIN public.assets a ON a.id = b.asset_id
      INNER JOIN auth.users u ON u.id = auth.uid()
      WHERE b.id = breakdown_history.breakdown_id
        AND a.facility_id = u.facility_id
    )
  );

-- ============================================================================
-- TRIGGERS for Audit Trail
-- ============================================================================

-- Trigger to auto-create history record on breakdown update
CREATE OR REPLACE FUNCTION public.log_breakdown_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status change
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.breakdown_history (breakdown_id, field_name, old_value, new_value, change_type, changed_by)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, 'status_changed', auth.uid());
  END IF;

  -- Log assignment change
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO public.breakdown_history (breakdown_id, field_name, old_value, new_value, change_type, changed_by)
    VALUES (NEW.id, 'assigned_to', OLD.assigned_to::text, NEW.assigned_to::text, 'assigned', auth.uid());
  END IF;

  -- Log severity change
  IF NEW.severity IS DISTINCT FROM OLD.severity THEN
    INSERT INTO public.breakdown_history (breakdown_id, field_name, old_value, new_value, change_type, changed_by)
    VALUES (NEW.id, 'severity', OLD.severity, NEW.severity, 'updated', auth.uid());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS breakdowns_audit_trigger ON public.breakdowns;
CREATE TRIGGER breakdowns_audit_trigger
AFTER UPDATE ON public.breakdowns
FOR EACH ROW
EXECUTE FUNCTION public.log_breakdown_change();

-- ============================================================================
-- VIEWS for Common Queries
-- ============================================================================

-- View: Breakdown Summary (current status overview)
CREATE OR REPLACE VIEW public.breakdown_summary AS
SELECT
  b.id,
  b.incident_number,
  b.asset_id,
  a.name_en as asset_name,
  a.location,
  b.title,
  b.status,
  b.severity,
  b.priority,
  b.reported_at,
  b.assigned_to,
  COALESCE(rc.root_cause_type, 'Pending') as root_cause_status,
  COUNT(DISTINCT ca.id) as action_count,
  COUNT(DISTINCT br.id) as response_count,
  b.downtime_minutes,
  b.estimated_cost
FROM public.breakdowns b
LEFT JOIN public.assets a ON a.id = b.asset_id
LEFT JOIN public.root_causes rc ON rc.breakdown_id = b.id
LEFT JOIN public.corrective_actions ca ON ca.breakdown_id = b.id
LEFT JOIN public.breakdown_responses br ON br.breakdown_id = b.id
GROUP BY b.id, a.id, rc.id;

-- ============================================================================
-- GRANTS for Security
-- ============================================================================

-- Grant basic SELECT on all BM tables (users can query within RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.breakdowns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.root_causes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corrective_actions TO authenticated;
GRANT SELECT, INSERT ON public.breakdown_responses TO authenticated;
GRANT SELECT ON public.breakdown_history TO authenticated;

-- Grant USAGE on sequences (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Service role full access for admin operations
GRANT ALL ON public.breakdowns TO service_role;
GRANT ALL ON public.root_causes TO service_role;
GRANT ALL ON public.corrective_actions TO service_role;
GRANT ALL ON public.breakdown_responses TO service_role;
GRANT ALL ON public.breakdown_history TO service_role;

-- ============================================================================
-- Migration Status
-- ============================================================================

-- Insert migration record
INSERT INTO public.migrations (name, executed_at, status)
VALUES (
  'db_BM_PHASE1_COMPLETE_SCHEMA',
  now(),
  'completed'
)
ON CONFLICT (name) DO UPDATE SET
  executed_at = now(),
  status = 'completed';

-- Completion marker
SELECT 'DSC-INDIA-MANNUR-BM Phase 1 Schema Migration Complete' as status;
