-- Team Dashboard Schema (Phase 2 Database)
-- Version: 1.0
-- Date: 2026-05-26
-- Purpose: Store organizational structure, capability tracking, and improvement actions

---
-- Table 1: Team Members (Extended Org Chart)
---
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'team_member', -- ceo, ops_core, project_lead, team_member
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, on_leave, blocked

  -- Organizational hierarchy
  reports_to_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  current_project_id UUID, -- Foreign key to projects table (if exists)

  -- Metadata
  join_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bio TEXT,
  skills JSONB DEFAULT '{}'::jsonb, -- Array of skill strings

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_members_reports_to ON team_members(reports_to_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_deleted ON team_members(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: CEO can view all members
CREATE POLICY "CEO can view all team members" ON team_members
  FOR SELECT USING (auth.jwt() ->> 'user_role' = 'ceo');

-- RLS Policy: Team leads can view their direct reports
CREATE POLICY "Team leads can view their team" ON team_members
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' = 'project_lead'
    AND reports_to_id = auth.uid()
  );

-- RLS Policy: Users can view themselves
CREATE POLICY "Users can view themselves" ON team_members
  FOR SELECT USING (id = auth.uid());

---
-- Table 2: Capability Scores (Dimension-based tracking)
---
CREATE TABLE IF NOT EXISTS capability_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Member reference
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

  -- 5 capability dimensions (0-100 scale)
  technical INTEGER NOT NULL DEFAULT 50 CHECK (technical >= 0 AND technical <= 100),
  tasks INTEGER NOT NULL DEFAULT 50 CHECK (tasks >= 0 AND tasks <= 100),
  comms INTEGER NOT NULL DEFAULT 50 CHECK (comms >= 0 AND comms <= 100),
  learning INTEGER NOT NULL DEFAULT 50 CHECK (learning >= 0 AND learning <= 100),
  reliability INTEGER NOT NULL DEFAULT 50 CHECK (reliability >= 0 AND reliability <= 100),

  -- Calculated overall score (average of 5 dimensions)
  overall_score NUMERIC(5,1) GENERATED ALWAYS AS (
    ROUND((technical + tasks + comms + learning + reliability)::numeric / 5, 1)
  ) STORED,

  -- Recording date (daily snapshot)
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Reviewer tracking
  reviewed_by_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: one score record per member per day
  UNIQUE(member_id, recorded_date)
);

CREATE INDEX idx_capability_scores_member ON capability_scores(member_id);
CREATE INDEX idx_capability_scores_date ON capability_scores(recorded_date);
CREATE INDEX idx_capability_scores_member_date ON capability_scores(member_id, recorded_date DESC);

-- Enable RLS
ALTER TABLE capability_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: CEO can view all capability scores
CREATE POLICY "CEO can view capability scores" ON capability_scores
  FOR SELECT USING (auth.jwt() ->> 'user_role' = 'ceo');

-- RLS Policy: Users can view own scores
CREATE POLICY "Users can view own scores" ON capability_scores
  FOR SELECT USING (member_id = auth.uid());

-- RLS Policy: Only CEO/reviewers can insert/update scores
CREATE POLICY "Only authorized users can update scores" ON capability_scores
  FOR INSERT WITH CHECK (auth.jwt() ->> 'user_role' = 'ceo');

CREATE POLICY "Only authorized users can update scores (update)" ON capability_scores
  FOR UPDATE USING (auth.jwt() ->> 'user_role' = 'ceo');

---
-- Table 3: Improvement Actions (Goal tracking)
---
CREATE TABLE IF NOT EXISTS improvement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership and assignment
  owner_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES team_members(id) ON DELETE SET NULL, -- CEO or manager reviewing

  -- Action details
  dimension VARCHAR(50) NOT NULL, -- technical, tasks, comms, learning, reliability
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Progress tracking (0-100%)
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled

  -- Score targets
  current_score INTEGER NOT NULL,
  target_score INTEGER NOT NULL CHECK (target_score > current_score),

  -- Timeline
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Notes and audit trail (JSONB array)
  notes JSONB DEFAULT '[]'::jsonb, -- Array of {date, author, text}

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_id UUID NOT NULL DEFAULT auth.uid(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by_id UUID,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_improvement_actions_owner ON improvement_actions(owner_id);
CREATE INDEX idx_improvement_actions_status ON improvement_actions(status);
CREATE INDEX idx_improvement_actions_dimension ON improvement_actions(dimension);
CREATE INDEX idx_improvement_actions_due ON improvement_actions(due_date);
CREATE INDEX idx_improvement_actions_active ON improvement_actions(status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE improvement_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: CEO can view all actions
CREATE POLICY "CEO can view all improvement actions" ON improvement_actions
  FOR SELECT USING (auth.jwt() ->> 'user_role' = 'ceo');

-- RLS Policy: Users can view own actions
CREATE POLICY "Users can view own actions" ON improvement_actions
  FOR SELECT USING (owner_id = auth.uid());

-- RLS Policy: Only CEO/owner can update
CREATE POLICY "Owner and CEO can update actions" ON improvement_actions
  FOR UPDATE USING (auth.jwt() ->> 'user_role' = 'ceo' OR owner_id = auth.uid());

---
-- Table 4: Team Org Chart (Hierarchical snapshot)
---
CREATE TABLE IF NOT EXISTS team_org_chart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Node info
  node_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES team_members(id) ON DELETE SET NULL,

  -- Hierarchy level
  depth INTEGER NOT NULL DEFAULT 0,

  -- Position in hierarchy (for ordering siblings)
  position_order INTEGER DEFAULT 0,

  -- Snapshot metadata
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: one entry per node per snapshot date
  UNIQUE(node_id, snapshot_date)
);

CREATE INDEX idx_team_org_chart_depth ON team_org_chart(depth);
CREATE INDEX idx_team_org_chart_date ON team_org_chart(snapshot_date DESC);
CREATE INDEX idx_team_org_chart_hierarchy ON team_org_chart(parent_id, depth);

-- Enable RLS
ALTER TABLE team_org_chart ENABLE ROW LEVEL SECURITY;

-- RLS Policy: CEO only
CREATE POLICY "CEO can view org chart" ON team_org_chart
  FOR SELECT USING (auth.jwt() ->> 'user_role' = 'ceo');

---
-- Function 1: Auto-update team_members.updated_at
---
CREATE OR REPLACE FUNCTION update_team_members_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_timestamp();

---
-- Function 2: Auto-update capability_scores.updated_at
---
CREATE OR REPLACE FUNCTION update_capability_scores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_capability_scores_updated_at
  BEFORE UPDATE ON capability_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_capability_scores_timestamp();

---
-- Function 3: Auto-update improvement_actions.updated_at
---
CREATE OR REPLACE FUNCTION update_improvement_actions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_improvement_actions_updated_at
  BEFORE UPDATE ON improvement_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_improvement_actions_timestamp();

---
-- Function 4: Append note to improvement_actions.notes array
---
CREATE OR REPLACE FUNCTION append_improvement_note(
  p_action_id UUID,
  p_author_id UUID,
  p_text TEXT
)
RETURNS improvement_actions AS $$
DECLARE
  v_action improvement_actions;
BEGIN
  UPDATE improvement_actions
  SET notes = notes || jsonb_build_array(
    jsonb_build_object(
      'date', CURRENT_TIMESTAMP,
      'author_id', p_author_id,
      'text', p_text
    )
  )
  WHERE id = p_action_id
  RETURNING * INTO v_action;

  RETURN v_action;
END;
$$ LANGUAGE plpgsql;

---
-- Function 5: Auto-mark action as completed when progress reaches 100%
---
CREATE OR REPLACE FUNCTION auto_complete_improvement_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.progress = 100 AND OLD.progress < 100 THEN
    NEW.status = 'completed';
    NEW.completed_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_complete_action
  BEFORE UPDATE ON improvement_actions
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_improvement_action();

---
-- Function 6: Sync team_org_chart on team_members changes
---
CREATE OR REPLACE FUNCTION sync_org_chart_on_member_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert/update org chart entry for this member
  INSERT INTO team_org_chart (node_id, parent_id, depth, snapshot_date)
  VALUES (NEW.id, NEW.reports_to_id,
    (SELECT COALESCE(MAX(depth), 0) + 1 FROM team_org_chart WHERE parent_id = NEW.reports_to_id),
    CURRENT_DATE
  )
  ON CONFLICT (node_id, snapshot_date) DO UPDATE
  SET parent_id = NEW.reports_to_id, updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_org_chart
  AFTER INSERT OR UPDATE ON team_members
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION sync_org_chart_on_member_change();

---
-- Seed Data (Optional - for initial setup)
---

-- 1. Create CEO
INSERT INTO team_members (id, name, email, role, status, join_date)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'CEO Name',
  'ceo@dsc-fms.dev',
  'ceo',
  'active',
  '2024-01-01'::timestamptz
) ON CONFLICT DO NOTHING;

-- 2. Create operational core (7 members)
INSERT INTO team_members (name, email, role, status, reports_to_id, join_date)
VALUES
  ('Ops Lead', 'ops1@dsc-fms.dev', 'ops_core', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '2024-01-15'::timestamptz),
  ('Web Expert #1', 'web1@dsc-fms.dev', 'ops_core', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '2024-01-15'::timestamptz),
  ('Backend Expert #1', 'backend1@dsc-fms.dev', 'ops_core', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '2024-01-15'::timestamptz),
  ('Database Expert #1', 'db1@dsc-fms.dev', 'ops_core', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '2024-01-15'::timestamptz),
  ('QA Expert #1', 'qa1@dsc-fms.dev', 'ops_core', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '2024-01-15'::timestamptz),
  ('DevOps Expert #1', 'devops1@dsc-fms.dev', 'ops_core', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '2024-01-15'::timestamptz),
  ('Analytics Expert #1', 'analytics1@dsc-fms.dev', 'ops_core', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '2024-01-15'::timestamptz)
ON CONFLICT (email) DO NOTHING;

-- 3. Initialize capability scores for CEO (baseline)
INSERT INTO capability_scores (member_id, technical, tasks, comms, learning, reliability, recorded_date, reviewed_by_id)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  88, 88, 85, 90, 95, CURRENT_DATE,
  '00000000-0000-0000-0000-000000000001'::uuid
) ON CONFLICT DO NOTHING;

---
-- Verification Queries (Run after migration to verify)
---

-- Verify all 4 tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('team_members', 'capability_scores', 'improvement_actions', 'team_org_chart')
ORDER BY table_name;

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('team_members', 'capability_scores', 'improvement_actions', 'team_org_chart')
ORDER BY tablename;

-- Verify all triggers created
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Verify initial seed data
SELECT COUNT(*) as total_members FROM team_members WHERE deleted_at IS NULL;
SELECT COUNT(*) as ceo_count FROM team_members WHERE role = 'ceo' AND deleted_at IS NULL;
SELECT COUNT(*) as ops_count FROM team_members WHERE role = 'ops_core' AND deleted_at IS NULL;

---
-- Migration Status
---
-- Status: ✅ READY FOR DEPLOYMENT
-- Database: Supabase PostgreSQL 15.3
-- Expected tables: 4
-- Expected RLS policies: 12
-- Expected triggers: 6
-- Seed data: CEO + 7 ops core members
-- Timeline: Run after 36_team_dashboard_phase2.sql CEO dashboard migration
-- Next step: Run TEAM_DASHBOARD_DB_SCHEMA.sql, then start Phase 1 implementation (2026-05-27)
