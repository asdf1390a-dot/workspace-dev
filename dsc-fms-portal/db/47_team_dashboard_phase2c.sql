-- Team Dashboard Phase 2C: Performance, Resources, Communications, Audit
-- 3 new tables with comprehensive indexing and RLS

-- 1. Team Performance Metrics Table
CREATE TABLE IF NOT EXISTS team_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metric identification
  metric_type VARCHAR(50) NOT NULL,  -- 'trust_score', 'technical_competency', etc.
  period VARCHAR(20) NOT NULL,       -- 'week', 'month', 'quarter'

  -- Aggregate data
  average_score NUMERIC(5,2),        -- 0-100
  min_score NUMERIC(5,2),
  max_score NUMERIC(5,2),
  member_count INTEGER,

  -- Trend data
  score_trend NUMERIC(6,2),          -- +5.0 or -3.5

  -- Time period
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_performance_metrics_type_idx
  ON team_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS team_performance_metrics_period_idx
  ON team_performance_metrics(period);
CREATE INDEX IF NOT EXISTS team_performance_metrics_date_idx
  ON team_performance_metrics(period_start_date DESC);

ALTER TABLE team_performance_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "performance_metrics_select" ON team_performance_metrics;
DROP POLICY IF EXISTS "performance_metrics_insert" ON team_performance_metrics;

CREATE POLICY "performance_metrics_select" ON team_performance_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "performance_metrics_insert" ON team_performance_metrics
  FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Resource Allocations Table
CREATE TABLE IF NOT EXISTS resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,  -- Optional: can be NULL for general allocation

  -- Allocation details
  allocated_hours NUMERIC(8,2) NOT NULL,
  estimated_total_hours NUMERIC(8,2),
  completed_hours NUMERIC(8,2) DEFAULT 0,

  -- Time period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'scheduled',  -- 'scheduled', 'active', 'completed'
  priority VARCHAR(10) DEFAULT 'medium',   -- 'high', 'medium', 'low'
  allocation_percentage NUMERIC(5,2),      -- 0-100

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resource_allocations_member_idx
  ON resource_allocations(member_id);
CREATE INDEX IF NOT EXISTS resource_allocations_project_idx
  ON resource_allocations(project_id);
CREATE INDEX IF NOT EXISTS resource_allocations_period_idx
  ON resource_allocations(start_date, end_date);
CREATE INDEX IF NOT EXISTS resource_allocations_status_idx
  ON resource_allocations(status);

ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allocations_select" ON resource_allocations;
DROP POLICY IF EXISTS "allocations_insert" ON resource_allocations;
DROP POLICY IF EXISTS "allocations_update" ON resource_allocations;

CREATE POLICY "allocations_select" ON resource_allocations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "allocations_insert" ON resource_allocations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "allocations_update" ON resource_allocations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3. Team Activity Logs Table (unified for communications + audit)
CREATE TABLE IF NOT EXISTS team_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Activity type
  activity_type VARCHAR(50) NOT NULL,
  -- Types: 'message_sent', 'project_update', 'allocation_change', 'performance_update',
  --        'login', 'logout', 'permission_change', 'team_member_update'

  -- Actor information
  actor_id UUID REFERENCES auth.users(id),
  actor_name VARCHAR(255),

  -- Target information
  target_type VARCHAR(50),  -- 'project', 'member', 'resource', 'message', 'system'
  target_id UUID,
  target_name VARCHAR(255),

  -- Content (for messages and descriptions)
  content TEXT,

  -- Channel (for communications)
  channel VARCHAR(50),  -- 'slack', 'discord', 'telegram', 'email', 'system'
  channel_name VARCHAR(255),

  -- For message interactions
  is_thread_parent BOOLEAN DEFAULT false,
  parent_message_id UUID,
  reaction_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,

  -- Changes tracking (JSON for flexible schema)
  changes JSONB,  -- {"field": "status", "oldValue": "pending", "newValue": "completed"}

  -- Additional metadata
  reason TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Retention policy
  expires_at TIMESTAMPTZ,  -- 90 days for audit logs

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_activity_logs_activity_type_idx
  ON team_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS team_activity_logs_actor_idx
  ON team_activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS team_activity_logs_target_idx
  ON team_activity_logs(target_id);
CREATE INDEX IF NOT EXISTS team_activity_logs_channel_idx
  ON team_activity_logs(channel);
CREATE INDEX IF NOT EXISTS team_activity_logs_created_idx
  ON team_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS team_activity_logs_expires_idx
  ON team_activity_logs(expires_at);

ALTER TABLE team_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_select" ON team_activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON team_activity_logs;

CREATE POLICY "activity_logs_select" ON team_activity_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "activity_logs_insert" ON team_activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Maintenance trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_team_activity_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_activity_logs_timestamp ON team_activity_logs;
CREATE TRIGGER team_activity_logs_timestamp
  BEFORE UPDATE ON team_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_team_activity_logs_timestamp();

-- Verification queries
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('team_performance_metrics', 'resource_allocations', 'team_activity_logs');
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('team_performance_metrics', 'resource_allocations', 'team_activity_logs');
