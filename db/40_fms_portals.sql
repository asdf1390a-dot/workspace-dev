-- DSC FMS Portal: Productivity & Cost Portal Tables
-- Generated 2026-06-09

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PRODUCTIVITY TABLES (8 sheets)
-- ============================================

-- 1.1 생산성 집계 (Productivity Summary)
CREATE TABLE IF NOT EXISTS productivity_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item VARCHAR(255),
  production_team VARCHAR(100),
  tech_team VARCHAR(100),
  total VARCHAR(100),
  target VARCHAR(100),
  achievement_rate VARCHAR(50),
  data_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 투입시간 (Investment Hours)
CREATE TABLE IF NOT EXISTS investment_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_date DATE,
  team VARCHAR(100),
  investment_hours_h NUMERIC,
  work_content VARCHAR(255),
  leader VARCHAR(100),
  reviewer VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 02-IDLE (Idle Time)
CREATE TABLE IF NOT EXISTS idle_time (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_date DATE,
  category VARCHAR(100),
  idle_hours_h NUMERIC,
  reason VARCHAR(255),
  team VARCHAR(100),
  impact_level VARCHAR(50),
  solution VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.4 MANPOWER (Tech Team Manpower)
CREATE TABLE IF NOT EXISTS manpower (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_date DATE,
  team VARCHAR(100),
  allocated_personnel VARCHAR(50),
  department VARCHAR(100),
  role VARCHAR(100),
  experience_years NUMERIC,
  productivity_index VARCHAR(50),
  confirmation VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.5 MAN (Production Team Manpower)
CREATE TABLE IF NOT EXISTS man (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_date DATE,
  team VARCHAR(100),
  personnel_count VARCHAR(50),
  grade_level VARCHAR(100),
  experience_years NUMERIC,
  productivity_index VARCHAR(50),
  deployment_dept VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.6 PRODUCTIVITY (Production Metrics)
CREATE TABLE IF NOT EXISTS productivity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_date DATE,
  team VARCHAR(100),
  production_qty VARCHAR(100),
  unit_price VARCHAR(100),
  production_amount VARCHAR(100),
  investment_hours VARCHAR(100),
  basic_productivity VARCHAR(100),
  adjustment_rate VARCHAR(50),
  final_productivity VARCHAR(100),
  target VARCHAR(100),
  achievement_rate VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.7 CT기준정보 (CT Standard Information)
CREATE TABLE IF NOT EXISTS ct_standard_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_name VARCHAR(100),
  component_name VARCHAR(100),
  standard_hours_h NUMERIC,
  difficulty_level VARCHAR(50),
  inspection_criteria VARCHAR(255),
  inspection_cost_krw NUMERIC,
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.8 검수수불 (Inspection & Payment)
CREATE TABLE IF NOT EXISTS inspection_payment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item VARCHAR(255),
  production_data VARCHAR(100),
  sales_data VARCHAR(100),
  difference_rate_percent VARCHAR(50),
  verification_status VARCHAR(100),
  responsible_team VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. COST/BUDGET TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS cost_budget (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(255),
  column_2 VARCHAR(255),
  amount_2023 NUMERIC,
  percent_2023 NUMERIC,
  amount_2024 NUMERIC,
  percent_2024 NUMERIC,
  increase_amount NUMERIC,
  increase_rate NUMERIC,
  reason_for_change VARCHAR(255),
  jan_amount NUMERIC,
  feb_amount NUMERIC,
  mar_amount NUMERIC,
  apr_amount NUMERIC,
  may_amount NUMERIC,
  jun_amount NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE productivity_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE idle_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE manpower ENABLE ROW LEVEL SECURITY;
ALTER TABLE man ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE ct_standard_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_budget ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all productivity data
CREATE POLICY "Allow read productivity_summary"
  ON productivity_summary
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read investment_hours"
  ON investment_hours
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read idle_time"
  ON idle_time
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read manpower"
  ON manpower
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read man"
  ON man
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read productivity"
  ON productivity
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read ct_standard_info"
  ON ct_standard_info
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read inspection_payment"
  ON inspection_payment
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read cost_budget"
  ON cost_budget
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow service_role to insert/update (for API seeding)
CREATE POLICY "Allow service_role write productivity_summary"
  ON productivity_summary
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role write investment_hours"
  ON investment_hours
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role write idle_time"
  ON idle_time
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role write manpower"
  ON manpower
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role write man"
  ON man
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role write productivity"
  ON productivity
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role write ct_standard_info"
  ON ct_standard_info
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role write inspection_payment"
  ON inspection_payment
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role write cost_budget"
  ON cost_budget
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 4. INDEXES (for performance)
-- ============================================

CREATE INDEX idx_productivity_summary_date ON productivity_summary(data_date);
CREATE INDEX idx_investment_hours_date ON investment_hours(work_date);
CREATE INDEX idx_idle_time_date ON idle_time(event_date);
CREATE INDEX idx_manpower_date ON manpower(work_date);
CREATE INDEX idx_man_date ON man(work_date);
CREATE INDEX idx_productivity_date ON productivity(work_date);
CREATE INDEX idx_cost_budget_category ON cost_budget(category);

-- ============================================
-- COMPLETED ✅
-- Tables: 9 (8 productivity + 1 cost)
-- RLS Policies: All read/write configured
-- Indexes: Created for fast queries
-- ============================================
