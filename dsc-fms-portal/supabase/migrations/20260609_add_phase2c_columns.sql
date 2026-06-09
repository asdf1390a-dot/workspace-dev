-- Add columns to team_performance_metrics
ALTER TABLE team_performance_metrics 
  ADD COLUMN IF NOT EXISTS metric_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS period VARCHAR(20),
  ADD COLUMN IF NOT EXISTS average_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS min_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS max_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS member_count INTEGER,
  ADD COLUMN IF NOT EXISTS score_trend NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS period_start_date DATE,
  ADD COLUMN IF NOT EXISTS period_end_date DATE;

-- Add columns to resource_allocations
ALTER TABLE resource_allocations
  ADD COLUMN IF NOT EXISTS member_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS allocated_hours NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS estimated_total_hours NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS completed_hours NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10),
  ADD COLUMN IF NOT EXISTS allocation_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add all columns to team_activity_logs
ALTER TABLE team_activity_logs
  ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS actor_id UUID,
  ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS target_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS target_id UUID,
  ADD COLUMN IF NOT EXISTS target_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS channel VARCHAR(50),
  ADD COLUMN IF NOT EXISTS channel_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_thread_parent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_message_id UUID,
  ADD COLUMN IF NOT EXISTS reaction_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS changes JSONB,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS team_performance_metrics_type_idx ON team_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS team_performance_metrics_period_idx ON team_performance_metrics(period);
CREATE INDEX IF NOT EXISTS team_performance_metrics_date_idx ON team_performance_metrics(period_start_date DESC);

CREATE INDEX IF NOT EXISTS resource_allocations_member_idx ON resource_allocations(member_id);
CREATE INDEX IF NOT EXISTS resource_allocations_project_idx ON resource_allocations(project_id);
CREATE INDEX IF NOT EXISTS resource_allocations_period_idx ON resource_allocations(start_date, end_date);
CREATE INDEX IF NOT EXISTS resource_allocations_status_idx ON resource_allocations(status);

CREATE INDEX IF NOT EXISTS team_activity_logs_activity_type_idx ON team_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS team_activity_logs_actor_idx ON team_activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS team_activity_logs_target_idx ON team_activity_logs(target_id);
CREATE INDEX IF NOT EXISTS team_activity_logs_channel_idx ON team_activity_logs(channel);
CREATE INDEX IF NOT EXISTS team_activity_logs_created_idx ON team_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS team_activity_logs_expires_idx ON team_activity_logs(expires_at);
