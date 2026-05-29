-- Team Dashboard Phase 2: 추가 테이블 생성
-- db/42b - Phase 2: team_structure, portfolio_items, activity_log

---
-- Drop existing activity_log table if it exists (safe if empty)
DROP TABLE IF EXISTS activity_log CASCADE;

---

-- Table 1: Team Structure

CREATE TABLE IF NOT EXISTS team_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL UNIQUE REFERENCES team_members(id) ON DELETE CASCADE,
  reports_to_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  position_level INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_structure_member_id ON team_structure(member_id);
CREATE INDEX IF NOT EXISTS idx_team_structure_reports_to ON team_structure(reports_to_id);

ALTER TABLE team_structure ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read team structure" ON team_structure;
CREATE POLICY "Public read team structure" ON team_structure
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert team structure" ON team_structure;
CREATE POLICY "Authenticated insert team structure" ON team_structure
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update team structure" ON team_structure;
CREATE POLICY "Authenticated update team structure" ON team_structure
FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete team structure" ON team_structure;
CREATE POLICY "Authenticated delete team structure" ON team_structure
FOR DELETE USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION trg_team_structure_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_structure_update_timestamp ON team_structure;

CREATE TRIGGER team_structure_update_timestamp
BEFORE UPDATE ON team_structure
FOR EACH ROW
EXECUTE FUNCTION trg_team_structure_updated_at();

---

-- Table 2: Portfolio Items

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  description TEXT,
  role VARCHAR(128),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'in_progress',
  skills_used TEXT[],
  impact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_member_id ON portfolio_items(member_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_status ON portfolio_items(status);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read portfolio" ON portfolio_items;
CREATE POLICY "Public read portfolio" ON portfolio_items
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert portfolio" ON portfolio_items;
CREATE POLICY "Authenticated insert portfolio" ON portfolio_items
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update portfolio" ON portfolio_items;
CREATE POLICY "Authenticated update portfolio" ON portfolio_items
FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete portfolio" ON portfolio_items;
CREATE POLICY "Authenticated delete portfolio" ON portfolio_items
FOR DELETE USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION trg_portfolio_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS portfolio_items_update_timestamp ON portfolio_items;

CREATE TRIGGER portfolio_items_update_timestamp
BEFORE UPDATE ON portfolio_items
FOR EACH ROW
EXECUTE FUNCTION trg_portfolio_items_updated_at();

---

-- Table 3: Activity Log

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  action VARCHAR(128) NOT NULL,
  description TEXT,
  project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_member_id ON activity_log(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read activity log" ON activity_log;
CREATE POLICY "Public read activity log" ON activity_log
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert activity log" ON activity_log;
CREATE POLICY "Authenticated insert activity log" ON activity_log
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

---
-- 마이그레이션 완료
-- Supabase SQL Editor에서 이 전체 스크립트를 실행하세요
