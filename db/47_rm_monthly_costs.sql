-- db/47_rm_monthly_costs.sql
-- R&M (Repair & Maintenance) 비용 추적 테이블 및 데이터 로드
-- Created: 2026-06-10
-- Covers: STP R&M, Consumable Items, CO2 Gas, Grinding Media, Grease (Jan-Apr 2026)

-- ============================================================
-- 1. cost_tracking 테이블 생성 (없으면)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cost_tracking (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT,
  month DATE NOT NULL,
  actual_rs INTEGER NOT NULL,
  forecast_rs INTEGER,
  qty DECIMAL(10, 2),
  unit TEXT,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cost_tracking_category_month ON public.cost_tracking (category, month);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_month ON public.cost_tracking (month);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_supplier ON public.cost_tracking (supplier);

-- ============================================================
-- 2. RLS (Row Level Security) 정책
-- ============================================================

ALTER TABLE public.cost_tracking ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록
CREATE POLICY cost_tracking_select_policy ON public.cost_tracking
  FOR SELECT
  USING (true);

-- 인증된 사용자만 수정/삽입 가능
CREATE POLICY cost_tracking_insert_policy ON public.cost_tracking
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY cost_tracking_update_policy ON public.cost_tracking
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 3. 데이터 로드 (Jan-Apr 2026)
-- ============================================================

-- 3.1 STP R&M (냉각탑/STP 유지보수)
INSERT INTO public.cost_tracking (category, subcategory, month, actual_rs, forecast_rs, qty, unit, supplier, notes)
VALUES
  ('STP_RM', 'STP_PLANT_CONSUMABLE', '2026-01-01'::date, 31100, NULL, NULL, NULL, 'RK AQUA TECH', 'ENVIKEM 약품'),
  ('STP_RM', 'STP_PLANT_OTHER_WORKS', '2026-01-01'::date, 25300, NULL, NULL, NULL, 'RK AQUA TECH', 'Carbon Filter 교체, 노무/운송 (1회성)'),
  ('STP_RM', 'STP_PLANT_CONSUMABLE', '2026-02-01'::date, 31100, NULL, NULL, NULL, 'RK AQUA TECH', 'ENVIKEM 약품'),
  ('STP_RM', 'STP_PLANT_CONSUMABLE', '2026-03-01'::date, 31100, NULL, NULL, NULL, 'RK AQUA TECH', 'ENVIKEM 약품'),
  ('STP_RM', 'STP_PLANT_CONSUMABLE', '2026-04-01'::date, 31100, NULL, NULL, NULL, 'RK AQUA TECH', 'ENVIKEM 약품');

-- 3.2 소모품 (CONSUMABLE ITEMS)
-- Jan
INSERT INTO public.cost_tracking (category, subcategory, month, actual_rs, forecast_rs, qty, unit, supplier, notes)
VALUES
  ('CONSUMABLE_ITEMS', 'SAFETY_ITEMS', '2026-01-01'::date, 150000, 155000, NULL, 'UNIT', 'Multiple', 'HAND GLOVES, SAFETY GEAR'),
  ('CONSUMABLE_ITEMS', 'ROBOT_ITEMS', '2026-01-01'::date, 128438, 110000, NULL, 'UNIT', 'Multiple', 'CO2 TIP 대량 선구매'),
  ('CONSUMABLE_ITEMS', 'OTHER_ITEMS', '2026-01-01'::date, 95632, 100000, NULL, 'UNIT', 'Multiple', '기타 소모품'),
  ('CONSUMABLE_ITEMS', 'REWORK_ITEMS', '2026-01-01'::date, 50000, 40714, NULL, 'UNIT', 'Multiple', '수리/재작업용');

-- Feb
INSERT INTO public.cost_tracking (category, subcategory, month, actual_rs, forecast_rs, qty, unit, supplier, notes)
VALUES
  ('CONSUMABLE_ITEMS', 'SAFETY_ITEMS', '2026-02-01'::date, 148000, 155000, NULL, 'UNIT', 'Multiple', 'HAND GLOVES, SAFETY GEAR'),
  ('CONSUMABLE_ITEMS', 'ROBOT_ITEMS', '2026-02-01'::date, 85632, 110000, NULL, 'UNIT', 'Multiple', 'CO2 TIP (Jan 선구매 후 감소)'),
  ('CONSUMABLE_ITEMS', 'OTHER_ITEMS', '2026-02-01'::date, 107573, 100000, NULL, 'UNIT', 'Multiple', '기타 소모품'),
  ('CONSUMABLE_ITEMS', 'REWORK_ITEMS', '2026-02-01'::date, 72000, 47959, NULL, 'UNIT', 'Multiple', '수리/재작업용');

-- Mar
INSERT INTO public.cost_tracking (category, subcategory, month, actual_rs, forecast_rs, qty, unit, supplier, notes)
VALUES
  ('CONSUMABLE_ITEMS', 'SAFETY_ITEMS', '2026-03-01'::date, 135000, 155000, NULL, 'UNIT', 'Multiple', 'HAND GLOVES, SAFETY GEAR'),
  ('CONSUMABLE_ITEMS', 'ROBOT_ITEMS', '2026-03-01'::date, 25480, 110000, NULL, 'UNIT', 'Multiple', '격월 구매 패턴 (Mar 미구매)'),
  ('CONSUMABLE_ITEMS', 'LASER_ITEMS', '2026-03-01'::date, 31465, 31465, NULL, 'UNIT', 'Multiple', 'Laser consumables (안정적)'),
  ('CONSUMABLE_ITEMS', 'OTHER_ITEMS', '2026-03-01'::date, 103466, 100000, NULL, 'UNIT', 'Multiple', '기타 소모품'),
  ('CONSUMABLE_ITEMS', 'REWORK_ITEMS', '2026-03-01'::date, 32000, 29726, NULL, 'UNIT', 'Multiple', '수리/재작업용');

-- Apr
INSERT INTO public.cost_tracking (category, subcategory, month, actual_rs, forecast_rs, qty, unit, supplier, notes)
VALUES
  ('CONSUMABLE_ITEMS', 'SAFETY_ITEMS', '2026-04-01'::date, 108070, 155000, NULL, 'UNIT', 'Multiple', 'HAND GLOVES, SAFETY GEAR'),
  ('CONSUMABLE_ITEMS', 'ROBOT_ITEMS', '2026-04-01'::date, 93752, 110000, NULL, 'UNIT', 'Multiple', 'CO2 TIP (2회차 구매)'),
  ('CONSUMABLE_ITEMS', 'OTHER_ITEMS', '2026-04-01'::date, 97314, 100000, NULL, 'UNIT', 'Multiple', '기타 소모품'),
  ('CONSUMABLE_ITEMS', 'LASER_ITEMS', '2026-04-01'::date, 31465, 31465, NULL, 'UNIT', 'Multiple', 'Laser consumables (안정적)'),
  ('CONSUMABLE_ITEMS', 'REWORK_ITEMS', '2026-04-01'::date, 26700, 26796, NULL, 'UNIT', 'Multiple', '수리/재작업용');

-- 3.3 CO2 가스 (부재료)
INSERT INTO public.cost_tracking (category, subcategory, month, actual_rs, forecast_rs, qty, unit, supplier, notes)
VALUES
  ('CO2_GAS', 'CO2_USAGE', '2026-01-01'::date, 289800, 391648, 28980, 'Kg', 'SRI VENKATESWARA CARBONIC GAS', '@ Rs 10/Kg'),
  ('CO2_GAS', 'CO2_USAGE', '2026-02-01'::date, 356800, 405985, 35680, 'Kg', 'SRI VENKATESWARA CARBONIC GAS', '@ Rs 10/Kg'),
  ('CO2_GAS', 'CO2_USAGE', '2026-03-01'::date, 350000, 421961, 35000, 'Kg', 'SRI VENKATESWARA CARBONIC GAS', '@ Rs 10/Kg'),
  ('CO2_GAS', 'CO2_USAGE', '2026-04-01'::date, 302400, 405516, 30240, 'Kg', 'SRI VENKATESWARA CARBONIC GAS', '@ Rs 10/Kg (Apr -22.2% 갭 조사 필요)');

-- ============================================================
-- 4. 데이터 검증 쿼리
-- ============================================================

-- 월별 합계
SELECT
  TO_CHAR(month, 'YYYY-MM') AS month,
  category,
  SUM(actual_rs)::INTEGER AS total_actual_rs,
  SUM(forecast_rs)::INTEGER AS total_forecast_rs,
  COUNT(*) AS item_count
FROM public.cost_tracking
WHERE month >= '2026-01-01' AND month <= '2026-04-30'
GROUP BY TO_CHAR(month, 'YYYY-MM'), category
ORDER BY month DESC, category;

-- 카테고리별 합계 (Jan-Apr)
SELECT
  category,
  SUM(actual_rs)::INTEGER AS total_actual_rs,
  SUM(forecast_rs)::INTEGER AS total_forecast_rs,
  COUNT(*) AS item_count,
  ROUND(SUM(actual_rs)::NUMERIC / (SELECT SUM(actual_rs) FROM public.cost_tracking WHERE month >= '2026-01-01' AND month <= '2026-04-30') * 100, 1) AS percent_of_total
FROM public.cost_tracking
WHERE month >= '2026-01-01' AND month <= '2026-04-30'
GROUP BY category
ORDER BY total_actual_rs DESC;

-- 전체 합계 (Jan-Apr)
SELECT
  '2026-01 ~ 2026-04' AS period,
  SUM(actual_rs)::INTEGER AS total_actual_rs,
  SUM(forecast_rs)::INTEGER AS total_forecast_rs,
  COUNT(*) AS total_items
FROM public.cost_tracking
WHERE month >= '2026-01-01' AND month <= '2026-04-30';
