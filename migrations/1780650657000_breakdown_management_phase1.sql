-- BM-P1: Breakdown Management Phase 1
-- Schema: breakdown_reports table with state machine and RLS policies

CREATE TABLE IF NOT EXISTS breakdown_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'won_fix')),
  severity VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (severity IN ('minor', 'normal', 'major', 'line_down')),
  description TEXT NOT NULL,
  description_ta TEXT,
  category VARCHAR(50) CHECK (category IN ('mechanical', 'electrical', 'hydraulic', 'software', 'operator_error', 'unknown')),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  photos TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INT GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (resolved_at - started_at))::integer / 60) STORED
);

-- Indexes for performance
CREATE INDEX idx_breakdown_asset_id ON breakdown_reports(asset_id);
CREATE INDEX idx_breakdown_status ON breakdown_reports(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_breakdown_severity ON breakdown_reports(severity) WHERE deleted_at IS NULL;
CREATE INDEX idx_breakdown_reported_at ON breakdown_reports(reported_at DESC);
CREATE INDEX idx_breakdown_resolved_at ON breakdown_reports(resolved_at DESC) WHERE resolved_at IS NOT NULL;
CREATE INDEX idx_breakdown_asset_month ON breakdown_reports(asset_id, DATE_TRUNC('month', reported_at));
CREATE INDEX idx_breakdown_reported_by ON breakdown_reports(reported_by);
CREATE INDEX idx_breakdown_assigned_to ON breakdown_reports(assigned_to);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_breakdown_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER breakdown_updated_at_trigger
BEFORE UPDATE ON breakdown_reports
FOR EACH ROW
EXECUTE FUNCTION set_breakdown_updated_at();

-- RLS Policies
ALTER TABLE breakdown_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View active breakdown reports" ON breakdown_reports
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Create breakdown reports" ON breakdown_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update own breakdown reports" ON breakdown_reports
  FOR UPDATE USING (
    reported_by = auth.uid() OR
    assigned_to = auth.uid() OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Aggregation view
CREATE OR REPLACE VIEW breakdown_analysis AS
SELECT
  asset_id,
  DATE_TRUNC('month', reported_at)::DATE AS month,
  COUNT(*) FILTER (WHERE status = 'resolved' OR status = 'won_fix') AS resolved_count,
  COUNT(*) FILTER (WHERE status != 'resolved' AND status != 'won_fix' AND deleted_at IS NULL) AS open_count,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE severity = 'line_down') AS line_down_count,
  COUNT(*) FILTER (WHERE severity = 'major') AS major_count,
  COUNT(*) FILTER (WHERE severity = 'normal') AS normal_count,
  COUNT(*) FILTER (WHERE severity = 'minor') AS minor_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - started_at))/60)::numeric, 2) AS mttr_minutes,
  ROUND((COUNT(*) FILTER (WHERE status = 'resolved' OR status = 'won_fix') * 60.0 /
         (EXTRACT(EPOCH FROM (MAX(resolved_at) - MIN(reported_at)))/3600))::numeric, 2) AS mtbf_hours,
  ROUND(SUM(EXTRACT(EPOCH FROM (resolved_at - started_at))/60)::numeric, 2) AS total_downtime_minutes
FROM breakdown_reports
WHERE deleted_at IS NULL
GROUP BY asset_id, DATE_TRUNC('month', reported_at);
