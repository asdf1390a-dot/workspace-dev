# KPI 리포트 모듈 — 플레너 설계서

> 작성일: 2026-05-12
> 작성자: Web App Designer/Planner (DSC FMS Portal)
> 대상 개발자: web-builder
> 포털: https://dsc-fms-portal.vercel.app
> GitHub: https://github.com/asdf1390a-dot/dsc-fms-portal

---

## 0. 설계 배경 및 원칙

### 왜 이 모듈이 필요한가

현재 KPI 대시보드(`/kpi/index.js`)는 BM 이력 기반 MTTR/MTBF만 표시한다.
공장 운영에는 생산량, OEE, 불량률(PPM), 고객반품, PM달성률, 안전 지표까지
통합적으로 입력하고 목표 대비 실적을 추적할 수 있어야 한다.

기존 화면은 "조회 전용 RPC 집계" 방식이고, 이 모듈은 그 위에
"직접 입력 + 목표 관리 + 차트 시각화"를 추가한다.

### 설계 원칙

- 기존 `/kpi/index.js` 완전 교체가 아니라 **확장** — 기존 BM 집계 RPC 재사용
- MTTR/MTBF는 bm_events에서 자동 집계, 나머지는 수동 입력
- 목표(target) 대비 실적(actual) 비율(%) 및 추세선 제공
- 입력 권한: 관리자(admin) 역할만 입력 가능, 일반 열람은 로그인 사용자 전체
- 차트 라이브러리: recharts (Next.js Pages Router 환경에서 안정적)
- 인라인 스타일, 다크 테마(#0f172a / #1e293b / #ef4444), 모바일 퍼스트 480px

---

## 1. DB 스키마 (Supabase PostgreSQL)

파일명: `db/15_kpi_module.sql`

```sql
-- ============================================================
-- DSC FMS Portal — KPI Report Module
-- 파일: 15_kpi_module.sql
-- 실행: Supabase Dashboard → SQL Editor → 순서대로 실행
-- 전제: 01_schema.sql, 04_bm_module_v2.sql, 05_kpi_rpc.sql 실행 완료
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. kpi_categories (KPI 항목 마스터)
--    어떤 KPI를 추적할지 정의. 초기 시드 포함.
-- ─────────────────────────────────────────────────────────────
create table if not exists kpi_categories (
  id          text primary key,              -- 'production_volume', 'oee', ...
  group_name  text not null,                 -- '생산', '품질', '보전', '안전'
  name_ko     text not null,                 -- '생산량'
  name_en     text not null,                 -- 'Production Volume'
  unit        text not null,                 -- 'EA', '%', 'PPM', 'h', '건'
  direction   text not null default 'up'     -- 'up'(높을수록 좋음) | 'down'(낮을수록 좋음)
    check (direction in ('up','down')),
  is_auto     boolean not null default false,-- true = bm_events에서 자동 집계
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

comment on table kpi_categories is 'KPI 항목 정의 마스터. is_auto=true인 항목은 bm_events RPC로 집계.';

-- 초기 시드: KPI 항목 11개
insert into kpi_categories (id, group_name, name_ko, name_en, unit, direction, is_auto, sort_order) values
  -- 생산 그룹
  ('production_volume',   '생산', '생산량',      'Production Volume',  'EA',  'up',   false, 10),
  ('oee',                 '생산', '설비종합효율', 'OEE',                '%',   'up',   false, 20),
  ('plan_achievement',    '생산', '계획달성률',   'Plan Achievement',   '%',   'up',   false, 30),
  -- 품질 그룹
  ('defect_ppm',          '품질', '불량률',       'Defect Rate',        'PPM', 'down', false, 40),
  ('customer_return',     '품질', '고객반품',     'Customer Return',    '건',  'down', false, 50),
  -- 보전 그룹
  ('mttr',                '보전', '평균수리시간', 'MTTR',               'h',   'down', true,  60),
  ('mtbf',                '보전', '평균고장간격', 'MTBF',               'h',   'up',   true,  70),
  ('pm_achievement',      '보전', 'PM달성률',     'PM Achievement',     '%',   'up',   false, 80),
  -- 안전 그룹
  ('accident_count',      '안전', '재해건수',     'Accident Count',     '건',  'down', false, 90),
  ('near_miss_count',     '안전', '아차사고',     'Near Miss Count',    '건',  'down', false, 100),
  -- 추가 보전 (수동 입력 버전 — auto 집계와 별도로 현장 입력값 보존)
  ('pm_completed',        '보전', 'PM완료건수',   'PM Completed',       '건',  'up',   false, 110)
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────
-- 2. kpi_targets (월별 KPI 목표)
--    관리자가 월초에 목표치를 설정
-- ─────────────────────────────────────────────────────────────
create table if not exists kpi_targets (
  id           uuid primary key default gen_random_uuid(),
  category_id  text not null references kpi_categories(id) on delete cascade,
  target_month date not null,               -- 항상 월의 1일 (예: 2026-05-01)
  target_value numeric(12,2) not null,      -- 목표값
  note         text,                        -- 목표 설정 메모

  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (category_id, target_month)
);

comment on table kpi_targets is '월별 KPI 목표값. 관리자만 입력.';

create index if not exists kpi_targets_month_idx on kpi_targets(target_month desc);
create index if not exists kpi_targets_category_idx on kpi_targets(category_id);


-- ─────────────────────────────────────────────────────────────
-- 3. kpi_actuals (월별/주별 KPI 실적)
--    관리자가 실적을 입력. is_auto=true인 항목은 RPC에서 채워도 되지만
--    수동 override도 허용한다.
-- ─────────────────────────────────────────────────────────────
create table if not exists kpi_actuals (
  id           uuid primary key default gen_random_uuid(),
  category_id  text not null references kpi_categories(id) on delete cascade,
  target_month date not null,               -- 월 단위 집계 기준 (월의 1일)
  week_number  int,                         -- null=월 집계, 1~5=해당 주차
  actual_value numeric(12,2) not null,      -- 실적값
  is_auto      boolean not null default false, -- true = RPC 자동 집계값
  source_note  text,                        -- '생산일보 기준', 'BM 이력 자동' 등
  note         text,                        -- 비고

  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- 월 집계는 (category, month)가 유니크
  -- 주간 집계는 (category, month, week_number)가 유니크
  unique (category_id, target_month, week_number)
);

comment on table kpi_actuals is '월별/주별 KPI 실적값. is_auto=true는 bm_events 자동 집계.';

create index if not exists kpi_actuals_month_idx on kpi_actuals(target_month desc);
create index if not exists kpi_actuals_category_idx on kpi_actuals(category_id);


-- ─────────────────────────────────────────────────────────────
-- 4. kpi_comments (KPI 코멘트 / 개선 메모)
--    특정 월 + 항목에 대한 원인 분석, 개선 계획 기록
-- ─────────────────────────────────────────────────────────────
create table if not exists kpi_comments (
  id           uuid primary key default gen_random_uuid(),
  category_id  text not null references kpi_categories(id) on delete cascade,
  target_month date not null,
  body         text not null,               -- 코멘트 본문
  author_name  text,                        -- 작성자 표시명

  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

comment on table kpi_comments is '월별 KPI 코멘트 (원인 분석 / 개선 메모).';

create index if not exists kpi_comments_month_idx on kpi_comments(target_month desc);


-- ─────────────────────────────────────────────────────────────
-- 5. updated_at 자동 갱신 트리거
-- ─────────────────────────────────────────────────────────────
create or replace function kpi_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_kpi_targets_updated_at
  before update on kpi_targets
  for each row execute function kpi_set_updated_at();

create trigger trg_kpi_actuals_updated_at
  before update on kpi_actuals
  for each row execute function kpi_set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 6. RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────

-- 6-1. kpi_categories: 전체 읽기 허용, 수정은 service_role만
alter table kpi_categories enable row level security;

create policy "kpi_categories: authenticated read"
  on kpi_categories for select
  to authenticated
  using (true);

-- 6-2. kpi_targets: 로그인 사용자 읽기, 입력은 admin 역할
alter table kpi_targets enable row level security;

create policy "kpi_targets: authenticated read"
  on kpi_targets for select
  to authenticated
  using (true);

-- admin 쓰기: profiles 테이블에 role='admin' 인 경우
-- (기존 포털 profiles 테이블의 role 컬럼 활용)
create policy "kpi_targets: admin write"
  on kpi_targets for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 6-3. kpi_actuals: 로그인 사용자 읽기, admin 쓰기
alter table kpi_actuals enable row level security;

create policy "kpi_actuals: authenticated read"
  on kpi_actuals for select
  to authenticated
  using (true);

create policy "kpi_actuals: admin write"
  on kpi_actuals for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 6-4. kpi_comments: 로그인 사용자 읽기, admin 쓰기
alter table kpi_comments enable row level security;

create policy "kpi_comments: authenticated read"
  on kpi_comments for select
  to authenticated
  using (true);

create policy "kpi_comments: admin write"
  on kpi_comments for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 7. RPC: kpi_auto_sync — BM 이력에서 MTTR/MTBF 자동 집계 후
--    kpi_actuals에 upsert (매월 말 또는 관리자 수동 호출)
-- ─────────────────────────────────────────────────────────────
create or replace function kpi_auto_sync(target_month text default to_char(now(), 'YYYY-MM-01'))
returns void language plpgsql security definer as $$
declare
  v_month date := date_trunc('month', target_month::timestamptz)::date;
  v_from  timestamptz := v_month::timestamptz;
  v_to    timestamptz := v_month + interval '1 month';
  v_mttr  numeric;
  v_mtbf  numeric;
begin
  -- 기존 get_monthly_kpi RPC 재사용
  select
    round(
      sum(mttr_min * breakdown_count) / nullif(sum(breakdown_count),0) / 60.0
    , 2),
    round(avg(mtbf_min) / 60.0, 2)
  into v_mttr, v_mtbf
  from bm_kpi
  where month = v_month;

  -- MTTR upsert
  if v_mttr is not null then
    insert into kpi_actuals (category_id, target_month, actual_value, is_auto, source_note)
    values ('mttr', v_month, v_mttr, true, 'BM 이력 자동 집계')
    on conflict (category_id, target_month, week_number) do update
      set actual_value = excluded.actual_value,
          is_auto      = true,
          updated_at   = now();
  end if;

  -- MTBF upsert
  if v_mtbf is not null then
    insert into kpi_actuals (category_id, target_month, actual_value, is_auto, source_note)
    values ('mtbf', v_month, v_mtbf, true, 'BM 이력 자동 집계')
    on conflict (category_id, target_month, week_number) do update
      set actual_value = excluded.actual_value,
          is_auto      = true,
          updated_at   = now();
  end if;
end;
$$;

comment on function kpi_auto_sync is
  'BM 이력(bm_kpi 뷰)에서 MTTR/MTBF를 시간(h) 단위로 kpi_actuals에 upsert.
   관리자가 수동 호출하거나, supabase.rpc("kpi_auto_sync")로 트리거 가능.';


-- ─────────────────────────────────────────────────────────────
-- 8. VIEW: kpi_dashboard_monthly
--    대시보드 조회용 — target, actual, achievement_rate 한번에
-- ─────────────────────────────────────────────────────────────
create or replace view kpi_dashboard_monthly as
select
  a.target_month,
  c.id            as category_id,
  c.group_name,
  c.name_ko,
  c.name_en,
  c.unit,
  c.direction,
  c.is_auto,
  c.sort_order,
  t.target_value,
  a.actual_value,
  -- 달성률 계산: up이면 actual/target, down이면 target/actual
  case
    when t.target_value is null or t.target_value = 0 then null
    when c.direction = 'up'
      then round(a.actual_value / t.target_value * 100, 1)
    else
      round(t.target_value / nullif(a.actual_value, 0) * 100, 1)
  end as achievement_rate,
  a.is_auto       as actual_is_auto,
  a.source_note
from kpi_actuals a
join kpi_categories c on c.id = a.category_id
left join kpi_targets t
  on t.category_id = a.category_id
 and t.target_month = a.target_month
where a.week_number is null   -- 월 집계만 (주간 제외)
  and c.is_active = true;

comment on view kpi_dashboard_monthly is
  '월별 KPI 대시보드용 뷰. 목표, 실적, 달성률(%) 포함.';
```

---

## 2. 페이지 구조 (Next.js Pages Router)

```
pages/
  kpi/
    index.js          ← /kpi          월별 KPI 대시보드 (메인 — 기존 파일 교체)
    input.js          ← /kpi/input    KPI 실적/목표 입력 (admin 전용)
    trend.js          ← /kpi/trend    추세 차트 (최근 6개월)
    weekly.js         ← /kpi/weekly   주간 KPI 현황 (Phase 2)

  api/
    kpi/
      dashboard.js    ← GET: 월별 KPI 대시보드 뷰 조회
      actuals.js      ← GET(목록) / POST(생성)
      actuals/
        [id].js       ← PATCH / DELETE
      targets.js      ← GET / POST
      targets/
        [id].js       ← PATCH / DELETE
      comments.js     ← GET / POST
      comments/
        [id].js       ← DELETE
      sync.js         ← POST: kpi_auto_sync RPC 호출 (admin 전용)
      trend.js        ← GET: 최근 N개월 추세 데이터
```

---

## 3. 페이지별 와이어프레임 (텍스트 기반)

### 3-1. /kpi — 월별 KPI 대시보드 (메인)

```
┌────────────────────────────────┐  max-w-480
│ KPI 대시보드           [입력→] │  헤더. admin만 [입력→] 버튼 표시
│ ‹  2026년 05월  ›              │  월 선택 (기존 패턴 동일)
├────────────────────────────────┤
│ [BM자동동기화]                  │  admin만 표시. 클릭 → kpi_auto_sync 호출
├────────────────────────────────┤
│ 생산                           │  그룹 헤더 (group_name)
│ ┌──────────────────────────┐  │
│ │ 생산량        Production │  │  KpiCard
│ │ 목표  125,000 EA          │  │
│ │ 실적  118,400 EA          │  │
│ │ ████████░░  94.7%         │  │  달성률 프로그레스바
│ │              [추세 →]    │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ OEE                      │  │
│ │ 목표  85%                 │  │
│ │ 실적  81.2%               │  │
│ │ ████████░░  95.5%         │  │  달성률. direction=up → 95%면 황색
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ 계획달성률   Plan Achv.  │  │
│ │ 목표  95%                 │  │
│ │ 실적  92.1%               │  │
│ │ ███████░░░  96.9%         │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ 품질                           │
│ ┌──────────────────────────┐  │
│ │ 불량률 (PPM)              │  │
│ │ 목표  ≤200 PPM            │  │  direction=down → 낮을수록 녹색
│ │ 실적  174 PPM             │  │
│ │ ██████████  달성          │  │  목표 이하 → 녹색 "달성"
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ 고객반품                  │  │
│ │ 목표  0건                 │  │
│ │ 실적  1건                 │  │  목표 초과 → 빨간색
│ │ ▌          미달성         │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ 보전                           │
│ ┌──────────────────────────┐  │
│ │ MTTR            🔄 자동  │  │  is_auto=true → 자동 배지
│ │ 목표  ≤2.0h               │  │
│ │ 실적  1.8h                │  │
│ │ ██████████  달성          │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ MTBF            🔄 자동  │  │
│ │ 목표  ≥120h               │  │
│ │ 실적  142h                │  │
│ │ ██████████  118.3%        │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ PM달성률                  │  │
│ │ 목표  100%                │  │
│ │ 실적  96.2%               │  │
│ │ █████████░  96.2%         │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ 안전                           │
│ ┌──────────────────────────┐  │
│ │ 재해건수                  │  │
│ │ 목표  0건                 │  │
│ │ 실적  0건                 │  │
│ │ ██████████  달성 (ZERO)   │  │  0=0이면 특별 강조
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ 아차사고                  │  │
│ │ 목표  ≤3건                │  │
│ │ 실적  2건                 │  │
│ │ ██████████  달성          │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ [추세 차트 보기 →]              │  /kpi/trend 링크
├────────────────────────────────┤
│ [홈][BM][PM][자산][KPI][내정보] │  BottomNav
└────────────────────────────────┘
```

달성률 색상 규칙:
- `>=100%` → #22c55e (녹색)
- `>=90%` → #eab308 (황색)
- `<90%` → #ef4444 (빨간색)
- direction=down인 항목은 역산 적용

---

### 3-2. /kpi/input — KPI 실적/목표 입력 (admin 전용)

```
┌────────────────────────────────┐
│ [←] KPI 입력                   │  헤더
│ ‹  2026년 05월  ›              │  월 선택
├────────────────────────────────┤
│ [탭: 실적 입력] [목표 설정]     │  2탭
├────────────────────────────────┤
│ (탭: 실적 입력 선택 시)         │
│                                │
│ BM 자동 동기화 [동기화 실행]    │  MTTR/MTBF 자동 집계 버튼
│ ↳ 마지막 동기화: 2026-05-10    │
│                                │
│ ── 생산 ──────────────────     │
│                                │
│ 생산량 (EA)                    │  KpiInputRow
│ 목표: 125,000                  │
│ 실적: [118400              ]   │  숫자 입력
│ 비고: [                    ]   │
│                                │
│ OEE (%)                        │
│ 목표: 85                       │
│ 실적: [81.2                ]   │
│ 비고: [                    ]   │
│                                │
│ 계획달성률 (%)                  │
│ 목표: 95                       │
│ 실적: [92.1                ]   │
│                                │
│ ── 품질 ──────────────────     │
│                                │
│ 불량률 PPM                     │
│ 목표: 200                      │
│ 실적: [174                 ]   │
│                                │
│ 고객반품 (건)                   │
│ 목표: 0                        │
│ 실적: [1                   ]   │
│ 비고: [OEM A 클레임 1건    ]   │
│                                │
│ ── 보전 ──────────────────     │
│                                │
│ MTTR (h) [🔄 자동]             │  is_auto 배지 표시
│ 목표: 2.0                      │
│ 실적: [1.8                 ]   │  자동 집계값 프리필, 수정 가능
│                                │
│ MTBF (h) [🔄 자동]             │
│ 목표: 120                      │
│ 실적: [142                 ]   │
│                                │
│ PM달성률 (%)                   │
│ 목표: 100                      │
│ 실적: [96.2                ]   │
│                                │
│ ── 안전 ──────────────────     │
│                                │
│ 재해건수 (건)                   │
│ 목표: 0                        │
│ 실적: [0                   ]   │
│                                │
│ 아차사고 (건)                   │
│ 목표: 3                        │
│ 실적: [2                   ]   │
│                                │
│          [전체 저장]            │  하단 고정 버튼
├────────────────────────────────┤
│ (탭: 목표 설정 선택 시)         │
│                                │
│ ── 생산 ──────────────────     │
│                                │
│ 생산량 (EA)   목표: [125000  ] │  KpiTargetRow
│ OEE (%)       목표: [85      ] │
│ 계획달성률(%) 목표: [95      ] │
│                                │
│ ── 품질 ──────────────────     │
│                                │
│ 불량률 PPM    목표: [200     ] │
│ 고객반품 (건) 목표: [0       ] │
│                                │
│ ── 보전 ──────────────────     │
│                                │
│ MTTR (h)      목표: [2.0     ] │
│ MTBF (h)      목표: [120     ] │
│ PM달성률 (%)  목표: [100     ] │
│                                │
│ ── 안전 ──────────────────     │
│                                │
│ 재해건수 (건) 목표: [0       ] │
│ 아차사고 (건) 목표: [3       ] │
│                                │
│          [목표 저장]            │
├────────────────────────────────┤
│ [홈][BM][PM][자산][KPI][내정보] │
└────────────────────────────────┘
```

---

### 3-3. /kpi/trend — 최근 6개월 추세 차트

```
┌────────────────────────────────┐
│ [←] KPI 추세                   │
│ 최근 6개월                      │
├────────────────────────────────┤
│ [KPI 선택 드롭다운 ▼]           │  단일 선택 (기본: OEE)
│  ex) OEE / 생산량 / 불량률PPM  │
├────────────────────────────────┤
│                                │
│  LineChart (recharts)           │
│  ┌──────────────────────────┐  │
│  │ %                         │  │
│  │ 90 ─────────────────── ← 목표선 (dashed)
│  │      ●───●               │  │
│  │  ●──            ──●──●  │  │  실적선 (solid)
│  │ 75                       │  │
│  │   12월  1월  2월  3월  4월  5월
│  └──────────────────────────┘  │
│                                │
│  [─── 실적] [- - 목표]         │  범례
│                                │
├────────────────────────────────┤
│ 월별 테이블                     │
│ ┌──────┬──────┬──────┬──────┐  │
│ │  월  │ 목표 │ 실적 │달성률│  │
│ ├──────┼──────┼──────┼──────┤  │
│ │ 12월 │  85% │  79% │ 92.9%│  │
│ │  1월 │  85% │  81% │ 95.3%│  │
│ │  2월 │  85% │  83% │ 97.6%│  │
│ │  3월 │  85% │  82% │ 96.5%│  │
│ │  4월 │  85% │  84% │ 98.8%│  │
│ │  5월 │  85% │ 81.2%│ 95.5%│  │
│ └──────┴──────┴──────┴──────┘  │
├────────────────────────────────┤
│ [홈][BM][PM][자산][KPI][내정보] │
└────────────────────────────────┘
```

---

### 3-4. /kpi/weekly — 주간 KPI (Phase 2)

```
┌────────────────────────────────┐
│ [←] 주간 KPI            [입력] │
│ 2026년 5월 2주차               │  ‹ 주 선택 ›
├────────────────────────────────┤
│ 이번 주 실적                    │
│                                │
│ [생산량] [OEE] [PPM] [PM]      │  가로 스크롤 탭 또는 드롭다운
│                                │
│ BarChart (recharts)             │
│ ┌──────────────────────────┐  │
│ │       월  화  수  목  금  │  │
│ │ 생산량 ██  ██  ██  ██  ██│  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ 주간 요약                       │
│ 이번 주: 27,400 EA              │
│ 목표 대비: 92.4%                │
│ 전주 대비: +2.1%                │
└────────────────────────────────┘
```

---

## 4. 컴포넌트 구조

```
components/
  kpi/
    KpiCard.js          ← 단일 KPI 카드 (목표/실적/달성률 프로그레스바)
    KpiCardGroup.js     ← group_name 기준 KpiCard 묶음 + 그룹 헤더
    KpiProgressBar.js   ← 달성률 프로그레스바 (direction 인식, 색상 자동)
    KpiInputRow.js      ← 실적 입력 1행 (label + 목표 표시 + input + 비고)
    KpiTargetRow.js     ← 목표 설정 1행 (label + input)
    KpiTrendChart.js    ← recharts LineChart 래퍼 (실적선 + 목표 점선)
    KpiTrendTable.js    ← 추세 월별 테이블 (6개월)
    KpiSyncButton.js    ← BM 자동 동기화 버튼 (로딩 상태 포함)
    KpiCommentBox.js    ← 월별 코멘트 목록 + 추가 폼
    KpiGroupFilter.js   ← 그룹 필터 탭 (생산/품질/보전/안전/전체)
```

### 컴포넌트별 역할 요약

| 컴포넌트 | 역할 | props 핵심 |
|---|---|---|
| KpiCard | 단일 KPI 대시보드 카드. 목표·실적·달성률 표시 | category, target, actual |
| KpiCardGroup | 그룹명 헤더 + KpiCard 배열 렌더 | groupName, items[] |
| KpiProgressBar | 달성률 → 색상(녹/황/적) + 바 width 계산 | rate, direction |
| KpiInputRow | 실적 입력 1행 (수치 입력 + 비고). is_auto면 배지 표시 | category, value, onChange |
| KpiTargetRow | 목표 설정 1행 | category, value, onChange |
| KpiTrendChart | recharts LineChart. 실적 solid + 목표 dashed | data[], unit, direction |
| KpiTrendTable | 6개월 데이터 테이블 (월/목표/실적/달성률) | rows[] |
| KpiSyncButton | POST /api/kpi/sync 호출. 로딩·성공·에러 상태 | onSuccess |
| KpiCommentBox | 특정 month+category 코멘트 목록 + 추가 폼 | categoryId, month |
| KpiGroupFilter | 생산/품질/보전/안전/전체 필터 탭 | selected, onChange |

---

## 5. API Routes 목록

모든 API는 Supabase Auth 세션 쿠키로 인증.
쓰기(POST/PATCH/DELETE)는 profiles.role='admin' 검증.

### 조회 (로그인 사용자 전체)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/kpi/dashboard?month=YYYY-MM | 월별 KPI 대시보드 뷰 (kpi_dashboard_monthly) |
| GET | /api/kpi/actuals?month=YYYY-MM | 월별 실적 목록 (주간 포함 옵션: &weekly=1) |
| GET | /api/kpi/targets?month=YYYY-MM | 월별 목표 목록 |
| GET | /api/kpi/comments?month=YYYY-MM&categoryId= | 코멘트 목록 |
| GET | /api/kpi/trend?category=oee&months=6 | 추세 데이터 (최근 N개월) |

### 쓰기 (admin 전용)

| Method | Path | 설명 |
|---|---|---|
| POST | /api/kpi/actuals | 실적 생성 (upsert 방식) |
| PATCH | /api/kpi/actuals/[id] | 실적 수정 |
| DELETE | /api/kpi/actuals/[id] | 실적 삭제 |
| POST | /api/kpi/targets | 목표 생성 (upsert 방식) |
| PATCH | /api/kpi/targets/[id] | 목표 수정 |
| DELETE | /api/kpi/targets/[id] | 목표 삭제 |
| POST | /api/kpi/comments | 코멘트 추가 |
| DELETE | /api/kpi/comments/[id] | 코멘트 삭제 |
| POST | /api/kpi/sync | kpi_auto_sync RPC 호출 (BM→MTTR/MTBF 자동 집계) |

### API 응답 구조 예시

```js
// GET /api/kpi/dashboard?month=2026-05
{
  "month": "2026-05-01",
  "items": [
    {
      "category_id": "oee",
      "group_name": "생산",
      "name_ko": "설비종합효율",
      "name_en": "OEE",
      "unit": "%",
      "direction": "up",
      "is_auto": false,
      "target_value": 85,
      "actual_value": 81.2,
      "achievement_rate": 95.5
    },
    ...
  ]
}
```

---

## 6. 사용자 흐름

### 6-1. 관리자 — 월초 목표 설정 흐름

```
/kpi/input 접근 (admin만 입력 버튼 노출)
  → "목표 설정" 탭 선택
  → 각 KPI 항목별 목표값 입력
  → [목표 저장] 클릭
  → POST /api/kpi/targets (upsert: 같은 month+category면 update)
  → 성공 toast 표시 → 대시보드로 복귀
```

### 6-2. 관리자 — 월말 실적 입력 흐름

```
/kpi/input 접근
  → "실적 입력" 탭 선택
  → [동기화 실행] 클릭 → POST /api/kpi/sync
    → kpi_auto_sync RPC 호출 → MTTR/MTBF 자동 채워짐
  → 나머지 항목 수동 입력 (생산량, OEE, PPM 등)
  → [전체 저장] 클릭
  → 각 항목 POST /api/kpi/actuals (upsert)
  → 성공 → /kpi 대시보드로 복귀
  → 달성률 색상으로 즉시 확인
```

### 6-3. 일반 사용자 — 월별 KPI 조회 흐름

```
/kpi 접근
  → GET /api/kpi/dashboard?month=현재월
  → KpiCardGroup 4개 (생산/품질/보전/안전) 렌더링
  → ‹ / › 버튼으로 이전 월 조회
  → [추세 차트 보기 →] → /kpi/trend
  → KPI 선택 → LineChart + 월별 테이블 표시
```

### 6-4. MTTR/MTBF 자동 집계 흐름

```
BM 이력(bm_events)에 downtime_start, downtime_end 입력 완료
  → bm_kpi 뷰에 자동 반영 (기존 RPC 구조)
  → 관리자가 /kpi/input → [BM 동기화 실행] 클릭
  → POST /api/kpi/sync → kpi_auto_sync(target_month) 호출
  → bm_kpi에서 월 집계 → kpi_actuals에 MTTR, MTBF upsert
  → 대시보드에 "🔄 자동" 배지와 함께 표시
```

---

## 7. 엣지 케이스 정의

| 상황 | 처리 방법 |
|---|---|
| 해당 월 목표(target) 미설정 | KpiCard에 "목표 미설정" 표시, 달성률 칸 비움 |
| 해당 월 실적(actual) 미입력 | KpiCard에 "—" 표시, 프로그레스바 비활성 |
| bm_events에 downtime 데이터 없음 | kpi_auto_sync 호출 시 null → upsert 스킵, 수동 입력 유지 |
| direction=down에서 실적=0, 목표=0 | "ZERO 달성" 특별 표시 (재해건수 등) |
| direction=down에서 실적 > 목표 | 달성률 < 100%, 빨간색 표시 |
| achievement_rate > 200% | 바 너비 100%로 cap, 숫자는 실제값 표시 |
| admin 아닌 사용자가 /kpi/input 접근 | 403 메시지 표시 또는 /kpi 리다이렉트 |
| 실적 입력 후 다시 동기화 실행 | is_auto=true 값이 수동 입력값을 덮어씀 → 경고 모달 필요 |
| 네트워크 에러 | 에러 toast 표시, 재시도 버튼 |
| 목표 없이 실적만 있는 경우 | 실적값 표시, 달성률 "N/A" |
| 미래 월 입력 시도 | 허용 (예산 목표치 사전 설정 가능), 경고 없음 |
| 주간 데이터 없이 주간 탭 접근 | "이번 주 데이터 없음" 빈 상태 표시 |
| recharts SSR 이슈 | dynamic import with ssr:false 적용 필수 |

---

## 8. recharts 사용 가이드 (웹개발자 참고)

Pages Router + 인라인 스타일 환경에서 recharts SSR 문제 방지:

```js
// KpiTrendChart.js — SSR 비활성화
import dynamic from 'next/dynamic';

const TrendChartInner = dynamic(
  () => import('./KpiTrendChartInner'),
  { ssr: false }
);

export default function KpiTrendChart(props) {
  return <TrendChartInner {...props} />;
}
```

```js
// KpiTrendChartInner.js — recharts 실제 사용
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';

// data 형태: [{ month: '12월', actual: 79, target: 85 }, ...]
export default function KpiTrendChartInner({ data, unit, direction }) {
  const goodColor = '#22c55e';
  const lineColor = '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis unit={unit} tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9' }}
        />
        {/* 목표선: dashed */}
        <Line dataKey="target" stroke="#64748b" strokeDasharray="4 4"
              dot={false} strokeWidth={1.5} name="목표" />
        {/* 실적선: solid */}
        <Line dataKey="actual" stroke={lineColor} strokeWidth={2.5}
              dot={{ fill: lineColor, r: 4 }} name="실적" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 9. 기존 /kpi/index.js 마이그레이션 전략

현재 `/kpi/index.js`는 BM 이력 집계(MTTR/MTBF/상태별/원인별)를 보여준다.
이번 모듈 추가 후 교체 방향:

| 기존 섹션 | 이후 처리 |
|---|---|
| 월별 KPI 요약 (MTTR/MTBF/BM건수) | KpiCard로 교체 — kpi_actuals 기반 |
| BM 상태별 현황 (statusPill) | /bm/stats 또는 /kpi 하단 부가 정보로 이동 |
| 고장 원인 TOP 5 바 차트 | /bm/stats 로 이동 (BM 전용 분석) |

기존 `get_monthly_kpi`, `get_breakdown_by_status`, `get_cause_distribution` RPC는
`kpi_auto_sync` 내부에서 재사용. 삭제하지 말 것.

---

## 10. BottomNav KPI 탭 확인

기존 BottomNav KPI 탭 경로:
```js
{ href: '/kpi', label: 'KPI', match: (p) => p.startsWith('/kpi') }
```
추가 변경 불필요. `/kpi/input`, `/kpi/trend` 모두 하이라이트 자동 적용됨.

---

## 11. 구현 우선순위

### Phase 1 — MVP (핵심 기능)

목표: 목표 설정 → 실적 입력 → 달성률 대시보드 동작

| 순서 | 작업 | 파일 | 예상 난이도 |
|---|---|---|---|
| 1 | DB 마이그레이션 | db/15_kpi_module.sql | 낮음 |
| 2 | API: dashboard (GET) | api/kpi/dashboard.js | 낮음 |
| 3 | API: targets CRUD | api/kpi/targets.js, [id].js | 낮음 |
| 4 | API: actuals CRUD | api/kpi/actuals.js, [id].js | 낮음 |
| 5 | API: sync (BM 자동 집계) | api/kpi/sync.js | 낮음 |
| 6 | KpiProgressBar | components/kpi/KpiProgressBar.js | 낮음 |
| 7 | KpiCard, KpiCardGroup | components/kpi/ | 낮음 |
| 8 | /kpi/index.js 교체 | pages/kpi/index.js | 중간 |
| 9 | KpiInputRow, KpiTargetRow | components/kpi/ | 낮음 |
| 10 | KpiSyncButton | components/kpi/KpiSyncButton.js | 낮음 |
| 11 | /kpi/input.js (실적/목표 입력) | pages/kpi/input.js | 중간 |

### Phase 2 — 추세 차트 + 주간 KPI

목표: 6개월 추세 시각화 + 주간 입력

| 순서 | 작업 | 파일 | 예상 난이도 |
|---|---|---|---|
| 1 | API: trend (GET) | api/kpi/trend.js | 낮음 |
| 2 | KpiTrendChart (recharts) | components/kpi/KpiTrendChart.js | 중간 |
| 3 | KpiTrendTable | components/kpi/KpiTrendTable.js | 낮음 |
| 4 | /kpi/trend.js | pages/kpi/trend.js | 중간 |
| 5 | KpiCommentBox | components/kpi/KpiCommentBox.js | 낮음 |
| 6 | API: comments CRUD | api/kpi/comments.js | 낮음 |
| 7 | /kpi/weekly.js (주간 현황) | pages/kpi/weekly.js | 높음 |
| 8 | KpiGroupFilter | components/kpi/KpiGroupFilter.js | 낮음 |

### Phase 3 — 확장 (선택)

| 작업 | 설명 |
|---|---|
| Excel 내보내기 | 월별 KPI 테이블 → xlsx 다운로드 |
| 이메일 알림 | 달성률 90% 미만 항목 발생 시 관리자 이메일 발송 |
| 주간 자동 집계 | week_number 기반 BM 주간 집계 RPC 추가 |
| 타밀어 지원 | KPI 카드에 name_ta 컬럼 추가 및 현장용 UI |
| 목표 복사 | 전월 목표를 이번 달로 그대로 복사하는 버튼 |

---

*설계서 끝. 궁금한 사항은 플레너에게 문의. 웹개발자는 Phase 1 → Phase 2 순서로 구현.*
