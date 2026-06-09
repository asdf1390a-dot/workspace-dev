-- db/36_team_dashboard.sql
-- Team Dashboard P2 스키마
-- 생성일: 2026-06-05
-- 목적: 팀 협업 대시보드 및 위젯 관리

BEGIN;

-- 1. 대시보드 테이블
CREATE TABLE IF NOT EXISTS team_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_team_dashboards_owner_id ON team_dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_dashboards_created_at ON team_dashboards(created_at DESC);

-- 2. 위젯 테이블
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES team_dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('audit', 'discord', 'backup', 'task', 'metric')),
  title TEXT NOT NULL,
  position INT DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(type);

-- 3. 대시보드 권한 테이블
CREATE TABLE IF NOT EXISTS dashboard_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES team_dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dashboard_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_user_id ON dashboard_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_dashboard_id ON dashboard_permissions(dashboard_id);

-- 4. RLS 정책 활성화
ALTER TABLE team_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_permissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책: 대시보드
DROP POLICY IF EXISTS "Users can view shared dashboards or own dashboards" ON team_dashboards;
CREATE POLICY "Users can view shared dashboards or own dashboards" ON team_dashboards
  FOR SELECT USING (
    is_shared = true
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM dashboard_permissions
      WHERE dashboard_id = team_dashboards.id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own dashboards" ON team_dashboards;
CREATE POLICY "Users can insert own dashboards" ON team_dashboards
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own dashboards" ON team_dashboards;
CREATE POLICY "Users can update own dashboards" ON team_dashboards
  FOR UPDATE USING (owner_id = auth.uid());

-- 6. RLS 정책: 위젯
DROP POLICY IF EXISTS "Users can view widgets from accessible dashboards" ON dashboard_widgets;
CREATE POLICY "Users can view widgets from accessible dashboards" ON dashboard_widgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_dashboards
      WHERE id = dashboard_id
      AND (
        is_shared = true
        OR owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM dashboard_permissions
          WHERE dashboard_id = team_dashboards.id
          AND user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage widgets in own dashboards" ON dashboard_widgets;
CREATE POLICY "Users can manage widgets in own dashboards" ON dashboard_widgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_dashboards
      WHERE id = dashboard_id
      AND owner_id = auth.uid()
    )
  );

-- 7. RLS 정책: 권한
DROP POLICY IF EXISTS "Users can view permissions for dashboards they own" ON dashboard_permissions;
CREATE POLICY "Users can view permissions for dashboards they own" ON dashboard_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_dashboards
      WHERE id = dashboard_id
      AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage permissions for dashboards they own" ON dashboard_permissions;
CREATE POLICY "Users can manage permissions for dashboards they own" ON dashboard_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_dashboards
      WHERE id = dashboard_id
      AND owner_id = auth.uid()
    )
  );

-- 8. 기본 대시보드 데이터 (선택사항)
INSERT INTO team_dashboards (name, description, owner_id, is_shared)
SELECT
  'Default Team Dashboard',
  'Team collaboration hub for all projects',
  id,
  true
FROM auth.users
WHERE email = 'asdf1390a@gmail.com'
ON CONFLICT DO NOTHING;

COMMIT;
