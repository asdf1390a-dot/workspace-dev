-- Team Dashboard Phase 2: Team Members 추가 컬럼 마이그레이션
-- db/42a - Phase 1: 필수 컬럼 추가 (Supabase에서 먼저 실행)
-- 목표: db/36 team_members 테이블에 Phase 2 필수 컬럼 보충

-- Step 1: team_members에 누락된 컬럼 추가
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS reports_to_id UUID,
  ADD COLUMN IF NOT EXISTS current_project_id UUID,
  ADD COLUMN IF NOT EXISTS join_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 2: 기존 데이터 마이그레이션
UPDATE team_members
SET join_date = created_at
WHERE join_date IS NULL;

-- Step 3: 인덱스 추가 (Phase 2 필수)
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_reports_to ON team_members(reports_to_id);
CREATE INDEX IF NOT EXISTS idx_team_members_join_date ON team_members(join_date);

-- Step 4: RLS 정책 설정 (기존 정책 제거 후 재설정)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON team_members;

CREATE POLICY "Public read team members" ON team_members
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert team members" ON team_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update team members" ON team_members
  FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete team members" ON team_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- Step 5: 검증 쿼리
SELECT 'team_members 구조 확인' AS verification,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as status_count,
  COUNT(CASE WHEN join_date IS NOT NULL THEN 1 END) as join_date_count
FROM team_members;
