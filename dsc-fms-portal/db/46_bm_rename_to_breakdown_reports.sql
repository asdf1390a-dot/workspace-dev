-- DSC FMS Portal — BM Module: Rename bm_events → breakdown_reports (Design Alignment)
-- 목적: 설계 문서와 코드의 테이블명 통일 (MAJOR Mismatch 해결)
-- 적용: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- 작성: 2026-06-09
-- 유형: Schema Rename + Index/Constraint 업데이트

-- ─────────────────────────────────────────────────────────
-- 1. 기존 제약 조건 이름 변경
-- ─────────────────────────────────────────────────────────

-- bm_events의 모든 제약 조건을 미리 확인하고 이름 변경
-- (PostgreSQL은 직접 이름 변경이 제한적이므로, 테이블 이름 변경 후 처리)

-- ─────────────────────────────────────────────────────────
-- 2. 테이블명 변경: bm_events → breakdown_reports
-- ─────────────────────────────────────────────────────────

alter table if exists bm_events rename to breakdown_reports;

-- ─────────────────────────────────────────────────────────
-- 3. 인덱스명 변경 (자동 업데이트됨, 하지만 명시적으로 확인)
-- ─────────────────────────────────────────────────────────

-- PostgreSQL은 테이블 이름 변경 시 자동으로 인덱스 이름을 업데이트하지 않으므로 수동으로 변경
alter index if exists bm_events_asset_idx rename to breakdown_reports_asset_idx;
alter index if exists bm_events_status_idx rename to breakdown_reports_status_idx;
alter index if exists bm_events_reported_at_idx rename to breakdown_reports_reported_at_idx;
alter index if exists bm_events_technician_idx rename to breakdown_reports_technician_idx;
alter index if exists bm_events_cause_code_idx rename to breakdown_reports_cause_code_idx;
alter index if exists bm_events_asset_month_idx rename to breakdown_reports_asset_month_idx;

-- ─────────────────────────────────────────────────────────
-- 4. 제약 조건명 변경 (자동 업데이트됨, 하지만 명시적으로 확인)
-- ─────────────────────────────────────────────────────────

-- 상태 체크 제약 이름 변경
alter constraint bm_events_status_check on breakdown_reports rename to breakdown_reports_status_check;

-- 외래 키 제약 이름 변경 (기술자)
alter constraint bm_events_technician_id_fkey on breakdown_reports rename to breakdown_reports_technician_id_fkey;

-- 외래 키 제약 이름 변경 (원인 코드)
alter constraint bm_events_cause_code_fkey on breakdown_reports rename to breakdown_reports_cause_code_fkey;

-- ─────────────────────────────────────────────────────────
-- 5. 뷰 업데이트 (bm_kpi → bm_kpi, 테이블명 참조만 변경)
-- ─────────────────────────────────────────────────────────

drop view if exists bm_kpi;

create or replace view bm_kpi as
with resolved as (
  select
    asset_id,
    date_trunc('month', reported_at)                           as month,
    count(*)                                                    as breakdown_count,
    -- MTTR: 실제 downtime 기준 (없으면 reported→resolved 폴백)
    avg(
      extract(epoch from (
        coalesce(downtime_end, resolved_at) -
        coalesce(downtime_start, reported_at)
      )) / 60.0
    )                                                           as mttr_min,
    sum(
      extract(epoch from (
        coalesce(downtime_end, resolved_at) -
        coalesce(downtime_start, reported_at)
      )) / 60.0
    )                                                           as total_downtime_min,
    max(resolved_at)                                            as last_resolved
  from breakdown_reports
  where resolved_at is not null
  group by asset_id, date_trunc('month', reported_at)
)
select
  resolved.asset_id,
  resolved.month,
  resolved.breakdown_count,
  round(resolved.mttr_min::numeric, 2)    as mttr_min,
  round(resolved.total_downtime_min::numeric, 2) as total_downtime_min,
  resolved.last_resolved
from resolved
order by asset_id, month desc;

comment on view bm_kpi is 'BM KPI: MTTR/MTBF 계산 (설계 이름: breakdown_reports 테이블 기준)';

-- ─────────────────────────────────────────────────────────
-- 6. 역호환성을 위한 뷰 생성 (선택사항)
-- ─────────────────────────────────────────────────────────
-- 기존 코드에서 bm_events를 참조하는 경우를 위해 임시 뷰 생성
-- (점진적으로 코드를 migration_reports로 마이그레이션한 후 삭제 예정)

-- create or replace view bm_events as select * from breakdown_reports;
-- 주석: 이 뷰는 필요시만 활성화 (권장: 코드 업데이트 후 제거)

-- ─────────────────────────────────────────────────────────
-- 7. 테이블 설명 업데이트
-- ─────────────────────────────────────────────────────────

comment on table breakdown_reports is 'SAP PM: Breakdown Reports — 고장 보고 및 분석 기록 (설계 이름 준수)';

-- ─────────────────────────────────────────────────────────
-- 8. 마이그레이션 완료 기록
-- ─────────────────────────────────────────────────────────
-- (참고: schema_migrations 테이블이 있다면 기록)
-- insert into schema_migrations (name) values ('46_bm_rename_to_breakdown_reports');

-- ─────────────────────────────────────────────────────────
-- ✅ 마이그레이션 완료 확인 쿼리
-- ─────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--   WHERE table_name = 'breakdown_reports' AND table_schema = 'public';
--   → 결과: breakdown_reports (테이블명 변경 확인)
--
-- SELECT indexname FROM pg_indexes
--   WHERE tablename = 'breakdown_reports' AND schemaname = 'public'
--   → 결과: breakdown_reports_* 인덱스들 (이름 변경 확인)
