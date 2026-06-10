-- FMS Portals: 생산성 & 경비 포털 스키마
-- Created: 2026-06-10

-- 1. 생산성 포털 데이터 테이블
CREATE TABLE IF NOT EXISTS fms_productivity_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_name TEXT NOT NULL UNIQUE,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fms_productivity_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES fms_productivity_sheets(id) ON DELETE CASCADE,
  row_number INT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 경비 포털 데이터 테이블
CREATE TABLE IF NOT EXISTS fms_cost_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  amount DECIMAL(10, 2),
  budget DECIMAL(10, 2),
  variance DECIMAL(10, 2),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_productivity_sheet_id ON fms_productivity_data(sheet_id);
CREATE INDEX IF NOT EXISTS idx_productivity_row ON fms_productivity_data(row_number);
CREATE INDEX IF NOT EXISTS idx_cost_category ON fms_cost_budget(category);

-- 4. RLS 정책 (읽기 전용 - 모든 인증 사용자)
ALTER TABLE fms_productivity_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fms_productivity_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fms_cost_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read all productivity sheets" ON fms_productivity_sheets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read all productivity data" ON fms_productivity_data
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read all cost budget" ON fms_cost_budget
  FOR SELECT TO authenticated USING (true);

-- 5. 초기 데이터 (테스트용)
INSERT INTO fms_productivity_sheets (sheet_name, display_order) VALUES
  ('생산성 집계', 1),
  ('투입시간', 2),
  ('IDLE', 3),
  ('MANPOWER', 4),
  ('MAN', 5),
  ('생산성', 6),
  ('CT기준정보', 7),
  ('검수수불', 8)
ON CONFLICT DO NOTHING;
