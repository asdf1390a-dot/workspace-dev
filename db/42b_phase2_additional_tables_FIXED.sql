-- Team Dashboard Phase 2: 추가 테이블 생성 (capability_scores 제거 — db/41에서 이미 생성됨)
-- db/42b - Phase 2: team_structure, portfolio_items, activity_log (db/41 이후 실행)
-- 목표: Team Dashboard Phase 2 필수 테이블 생성

---
-- Table 1: Team Structure (조직도 & 계층)
---
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

CREATE POLICY IF NOT EXISTS "Public read team structure" ON team_structure
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated insert team structure" ON team_structure
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated update team structure" ON team_structure
  FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated delete team structure" ON team_structure
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger: auto-update updated_at
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
-- Table 2: Portfolio Items (포트폴리오)
---
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  role TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('planned', 'in_progress', 'completed', 'archived')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_member_id ON portfolio_items(member_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_status ON portfolio_items(status);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public read portfolio items" ON portfolio_items
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated insert portfolio items" ON portfolio_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated update portfolio items" ON portfolio_items
  FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated delete portfolio items" ON portfolio_items
  FOR DELETE USING (auth.role() = 'authenticated');

---
-- Table 3: Activity Log (활동 추적)
---
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_member_id ON activity_log(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON activity_log(activity_type);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public read activity log" ON activity_log
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated insert activity log" ON activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated update activity log" ON activity_log
  FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated delete activity log" ON activity_log
  FOR DELETE USING (auth.role() = 'authenticated');

-- 검증 쿼리
SELECT 'Phase 2 추가 테이블 생성 완료' AS verification;
SELECT tablename FROM pg_tables WHERE tablename IN ('team_structure', 'portfolio_items', 'activity_log');
