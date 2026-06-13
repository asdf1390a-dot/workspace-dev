-- 20260613_normalize_fms_tables.sql
-- FMS 시스템 정규화: plant/period 컬럼 추가 및 JSONB 데이터 구조화

-- ============================================
-- 1. fms_productivity_data 테이블 정규화
-- ============================================

-- plant 컬럼 추가 (기본값: Mannur)
ALTER TABLE fms_productivity_data
ADD COLUMN IF NOT EXISTS plant TEXT DEFAULT 'Mannur',
ADD COLUMN IF NOT EXISTS period TEXT DEFAULT NULL;

-- RLS 정책 적용 (plant 기반 필터링)
ALTER TABLE fms_productivity_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fms_productivity_data_plant_filter" ON fms_productivity_data;
CREATE POLICY "fms_productivity_data_plant_filter"
ON fms_productivity_data
FOR SELECT
USING (
  plant = (auth.jwt() -> 'user_metadata' ->> 'plant')
  OR auth.jwt() -> 'user_metadata' ->> 'plant' IS NULL
);

-- ============================================
-- 2. expense_ledgers 기본 테이블 정규화
-- ============================================

ALTER TABLE expense_ledgers
ADD COLUMN IF NOT EXISTS plant TEXT DEFAULT 'Mannur';

ALTER TABLE expense_ledgers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_ledgers_plant_filter" ON expense_ledgers;
CREATE POLICY "expense_ledgers_plant_filter"
ON expense_ledgers
FOR SELECT
USING (
  plant = (auth.jwt() -> 'user_metadata' ->> 'plant')
  OR auth.jwt() -> 'user_metadata' ->> 'plant' IS NULL
);

-- ============================================
-- 3. 모든 expense_ledgers_YYYY_MM 파티션 테이블 정규화
-- ============================================

-- Helper 함수: 모든 파티션 테이블에 plant 컬럼 추가
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'expense_ledgers_%'
    AND tablename != 'expense_ledgers_history'
  LOOP
    EXECUTE format('
      ALTER TABLE %I
      ADD COLUMN IF NOT EXISTS plant TEXT DEFAULT ''Mannur''
    ', table_name);

    EXECUTE format('
      ALTER TABLE %I ENABLE ROW LEVEL SECURITY
    ', table_name);

    EXECUTE format('
      DROP POLICY IF EXISTS %I ON %I
    ', 'expense_ledgers_' || table_name || '_plant_filter', table_name);

    EXECUTE format('
      CREATE POLICY %I
      ON %I
      FOR SELECT
      USING (
        plant = (auth.jwt() -> ''user_metadata'' ->> ''plant'')
        OR auth.jwt() -> ''user_metadata'' ->> ''plant'' IS NULL
      )
    ', 'expense_ledgers_' || table_name || '_plant_filter', table_name);
  END LOOP;
END $$;

-- ============================================
-- 4. 인덱스 추가 (쿼리 성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_fms_productivity_data_plant_period
ON fms_productivity_data(plant, period);

CREATE INDEX IF NOT EXISTS idx_expense_ledgers_plant_period_month
ON expense_ledgers(plant, period_month);

-- ============================================
-- 5. 검증 함수 (데이터 무결성)
-- ============================================

CREATE OR REPLACE FUNCTION validate_fms_plant_period()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plant IS NULL THEN
    NEW.plant := 'Mannur';
  END IF;

  IF NEW.period IS NULL AND NEW.data IS NOT NULL THEN
    -- JSONB 데이터에서 period 추출 시도 (custom logic)
    NEW.period := COALESCE(
      NEW.data ->> 'period',
      TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF NOT EXISTS fms_productivity_data_validate_plant_period ON fms_productivity_data;
CREATE TRIGGER fms_productivity_data_validate_plant_period
BEFORE INSERT OR UPDATE ON fms_productivity_data
FOR EACH ROW
EXECUTE FUNCTION validate_fms_plant_period();

-- ============================================
-- 6. 데이터 마이그레이션 (기존 데이터 업데이트)
-- ============================================

-- fms_productivity_data: 모든 행에 plant='Mannur' 설정 (아직 NULL인 경우)
UPDATE fms_productivity_data
SET plant = 'Mannur'
WHERE plant IS NULL;

-- expense_ledgers: 모든 파티션에 plant='Mannur' 설정
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'expense_ledgers_%'
    AND tablename != 'expense_ledgers_history'
  LOOP
    EXECUTE format('
      UPDATE %I
      SET plant = ''Mannur''
      WHERE plant IS NULL
    ', table_name);
  END LOOP;
END $$;

-- ============================================
-- 7. 뷰 생성 (3시스템 통합 조회)
-- ============================================

CREATE OR REPLACE VIEW fms_integration_view AS
SELECT
  'fms_productivity' as system_type,
  fpd.plant,
  fpd.period,
  fpd.id,
  fpd.data,
  fpd.created_at,
  fpd.updated_at
FROM fms_productivity_data fpd
WHERE fpd.plant = 'Mannur'

UNION ALL

SELECT
  'bom_child_parts' as system_type,
  bcp.plant,
  bcp.period,
  bcp.id::text,
  jsonb_build_object(
    'part_no', bcp.part_no,
    'supplier', bcp.supplier,
    'req_qty', bcp.req_qty,
    'code_no', bcp.code_no
  ) as data,
  bcp.created_at,
  bcp.updated_at
FROM bom_child_parts bcp
WHERE bcp.plant = 'Mannur'

UNION ALL

SELECT
  'expense_ledgers' as system_type,
  el.plant,
  el.period_month,
  el.id::text,
  jsonb_build_object(
    'transaction_no', el.transaction_no,
    'transaction_date', el.transaction_date,
    'expense_code', el.expense_code
  ) as data,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM expense_ledgers el
WHERE el.plant = 'Mannur';

-- ============================================
-- 8. 완료
-- ============================================

-- FMS 3시스템 정규화 완료: plant/period 컬럼, RLS, 검증 함수, 인덱스, 통합 뷰 생성 ✅
