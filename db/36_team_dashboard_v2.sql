-- Team Dashboard Phase 2: Team Management Tables
-- db/36 - Team Members, Structure, Portfolio, Activity Log

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  start_date DATE,
  avatar_url TEXT,
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  reports_to_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  position_level INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  role TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'completed',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_structure_member_id ON team_structure(member_id);
CREATE INDEX IF NOT EXISTS idx_team_structure_reports_to ON team_structure(reports_to_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_member_id ON portfolio_items(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_member_id ON activity_log(member_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON team_structure FOR SELECT USING (true);
CREATE POLICY "Public read access" ON portfolio_items FOR SELECT USING (true);
CREATE POLICY "Public read access" ON activity_log FOR SELECT USING (true);
