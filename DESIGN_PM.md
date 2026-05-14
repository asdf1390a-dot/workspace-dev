# PM Plan(예방보전) 모듈 — 플레너 설계서

> 작성일: 2026-05-12
> 작성자: Web App Designer/Planner (DSC FMS Portal)
> 대상 개발자: web-builder
> 포털: https://dsc-fms-portal.vercel.app
> GitHub: https://github.com/asdf1390a-dot/dsc-fms-portal

---

## 0. 설계 배경 및 원칙

### 왜 이 모듈이 필요한가

DSC Mannur 공장의 예방보전(PM) 계획은 현재 Excel로 관리된다.
담당자가 수작업으로 주기를 계산하고, 미실시 여부를 별도로 추적한다.
FMS 포털에 PM 모듈을 통합하면:

- 설비별 점검 주기를 등록하면 **예정일이 자동 생성**된다.
- 현장 작업자가 폰으로 **완료 처리 + 작업 기록**을 입력한다.
- 관리자는 **계획 대비 실적(Compliance Rate)**을 실시간으로 확인한다.
- 미실시 항목이 빨간색으로 강조되어 **누락 없이** 보전 업무를 수행한다.

### 기존 코드 현황 (설계 전 분석)

현재 포털에는 PM 기반 구조가 이미 일부 구현되어 있다:

- `db/06_pm_module.sql` — pm_plans, pm_schedules 테이블 + RLS + 뷰 + RPC 존재
- `pages/pm/index.js` — 일정 목록 (탭 필터: 전체/이번주/D+3초과/완료, 314줄)
- `pages/pm/new.js` — PM 계획 등록 폼 (266줄, frequency_days 6개 옵션)
- `pages/pm/[id].js` — 일정 상세 + 완료 처리 폼 (373줄)

**신규 SQL 파일은 `db/13_pm_module.sql`로 명명** (기존 06_pm_module.sql 보완).
기존 테이블에 컬럼을 `ALTER TABLE`로 추가하는 방식으로 하위 호환성 유지.

### 설계 원칙

- **모바일 퍼스트** — 현장 작업자(첸나이 공장)가 폰으로 사용
- **기존 UI 패턴 유지** — 탭, 카드, 좌측 컬러바, D-day 배지 그대로 활용
- **인라인 스타일** — Tailwind 미사용, 기존 `const S = { ... }` 패턴 동일
- **다크 테마** — #0f172a 배경, #1e293b 카드, #ef4444 강조색
- **Supabase 직접 호출** — SWR/React Query 미사용, useState + supabase client
- **영어 레이블** — 현장 입력 UI는 영어 우선 (타밀어 label 선택적 추가)

---

## 1. DB 스키마 (Supabase PostgreSQL)

파일명: `db/13_pm_module.sql`

```sql
-- ============================================================
-- DSC FMS Portal — PM Module v2 (예방보전 확장)
-- 파일: db/13_pm_module.sql
-- 목적: 기존 06_pm_module.sql 테이블에 컬럼 추가 +
--       pm_work_logs, pm_parts_used 신규 테이블 생성
-- 실행: Supabase Dashboard → SQL Editor → 순서대로 실행
-- 주의: 06_pm_module.sql 이 먼저 실행되어 있어야 함
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. pm_plans 테이블 — 컬럼 추가
-- ─────────────────────────────────────────────────────────────
-- 점검 주기를 "일 수" 외에 의미 있는 레이블로도 관리
alter table pm_plans
  add column if not exists frequency_label text
    check (frequency_label in ('daily','weekly','biweekly','monthly','quarterly','biannual','annual'))
    default 'monthly',
  add column if not exists category       text    default 'general',
  -- category 예시: 'lubrication','inspection','calibration','cleaning','general'
  add column if not exists checklist      jsonb   default '[]'::jsonb,
  -- checklist: [{"item":"오일 레벨 확인","required":true}, ...]
  add column if not exists created_by     uuid    references auth.users(id) on delete set null,
  add column if not exists updated_at     timestamptz not null default now();

-- frequency_label ↔ frequency_days 매핑 헬퍼
-- daily=1, weekly=7, biweekly=14, monthly=30, quarterly=90, biannual=180, annual=365
comment on column pm_plans.frequency_label is
  'Human-readable cycle label. Kept in sync with frequency_days by application layer.';

-- updated_at 자동 갱신 트리거
create or replace function pm_plans_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pm_plans_updated_at on pm_plans;
create trigger trg_pm_plans_updated_at
  before update on pm_plans
  for each row execute function pm_plans_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2. pm_schedules 테이블 — 컬럼 추가
-- ─────────────────────────────────────────────────────────────
alter table pm_schedules
  add column if not exists updated_at     timestamptz not null default now();

drop trigger if exists trg_pm_schedules_updated_at on pm_schedules;
create trigger trg_pm_schedules_updated_at
  before update on pm_schedules
  for each row execute function pm_plans_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 3. pm_work_logs 테이블 (신규) — 작업 수행 기록
-- ─────────────────────────────────────────────────────────────
-- pm_schedules 1건에 대한 상세 작업 기록
-- (pm_schedules.notes + actual_hours 보다 구조화된 형태)
create table if not exists pm_work_logs (
  id              uuid primary key default gen_random_uuid(),
  schedule_id     uuid not null references pm_schedules(id) on delete cascade,
  plan_id         uuid not null references pm_plans(id) on delete cascade,
  asset_id        uuid references assets(id) on delete set null,

  -- 수행자 정보
  performed_by    uuid references auth.users(id) on delete set null,
  performed_by_name text not null,          -- 이름 직접 입력 (auth user 없어도 기록)

  -- 작업 시간
  started_at      timestamptz,
  ended_at        timestamptz,
  actual_hours    numeric(4,1),             -- 소수점 1자리 (예: 1.5)

  -- 결과
  result          text not null default 'ok'
    check (result in ('ok', 'abnormal', 'deferred')),
  -- ok: 정상 완료 / abnormal: 이상 발견 / deferred: 다음으로 미룸
  findings        text,                     -- 발견 이상 사항 (result='abnormal'일 때 주로 사용)
  action_taken    text,                     -- 조치 내용
  notes           text,                     -- 기타 메모

  -- 체크리스트 수행 결과 (plan의 checklist 항목별 체크 여부)
  checklist_result jsonb default '[]'::jsonb,
  -- [{"item":"오일 레벨 확인","checked":true,"note":""}, ...]

  -- 사진 (Supabase Storage URLs)
  photos          text[] default '{}',

  -- BM 연계 (이상 발견 시 BM 이벤트 참조)
  bm_event_id     uuid,                     -- bm_events.id (외래키 없음, 느슨한 연결)

  -- 감사
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists pm_work_logs_schedule_idx on pm_work_logs(schedule_id);
create index if not exists pm_work_logs_asset_idx    on pm_work_logs(asset_id);
create index if not exists pm_work_logs_created_idx  on pm_work_logs(created_at desc);

drop trigger if exists trg_pm_work_logs_updated_at on pm_work_logs;
create trigger trg_pm_work_logs_updated_at
  before update on pm_work_logs
  for each row execute function pm_plans_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. pm_parts_used 테이블 (신규) — 작업 시 사용 부품 기록
-- ─────────────────────────────────────────────────────────────
create table if not exists pm_parts_used (
  id              uuid primary key default gen_random_uuid(),
  work_log_id     uuid not null references pm_work_logs(id) on delete cascade,
  schedule_id     uuid not null references pm_schedules(id) on delete cascade,
  asset_id        uuid references assets(id) on delete set null,

  -- 부품 정보 (spare_parts 테이블과 느슨한 연결 — part_id는 선택)
  part_id         uuid,                     -- spare_parts.id (FK 없음, 옵셔널)
  part_name       text not null,            -- 직접 입력 가능
  part_number     text,                     -- Part No. (선택)
  quantity        numeric(8,2) not null default 1,
  unit            text default 'ea',        -- ea / kg / L / m 등

  -- 재고 차감 여부 (spare_parts 모듈과 연동 시 사용)
  inventory_deducted boolean not null default false,

  -- 감사
  created_at      timestamptz not null default now()
);

create index if not exists pm_parts_used_work_log_idx  on pm_parts_used(work_log_id);
create index if not exists pm_parts_used_schedule_idx  on pm_parts_used(schedule_id);
create index if not exists pm_parts_used_asset_idx     on pm_parts_used(asset_id);

-- ─────────────────────────────────────────────────────────────
-- 5. RLS — pm_work_logs, pm_parts_used
-- ─────────────────────────────────────────────────────────────
alter table pm_work_logs  enable row level security;
alter table pm_parts_used enable row level security;

drop policy if exists "auth_read_pm_work_logs"   on pm_work_logs;
create policy "auth_read_pm_work_logs" on pm_work_logs
  for select to authenticated using (true);

drop policy if exists "auth_write_pm_work_logs"  on pm_work_logs;
create policy "auth_write_pm_work_logs" on pm_work_logs
  for insert to authenticated with check (true);

drop policy if exists "auth_update_pm_work_logs" on pm_work_logs;
create policy "auth_update_pm_work_logs" on pm_work_logs
  for update to authenticated using (true) with check (true);

drop policy if exists "auth_delete_pm_work_logs" on pm_work_logs;
create policy "auth_delete_pm_work_logs" on pm_work_logs
  for delete to authenticated using (true);

drop policy if exists "auth_read_pm_parts_used"  on pm_parts_used;
create policy "auth_read_pm_parts_used" on pm_parts_used
  for select to authenticated using (true);

drop policy if exists "auth_write_pm_parts_used" on pm_parts_used;
create policy "auth_write_pm_parts_used" on pm_parts_used
  for insert to authenticated with check (true);

drop policy if exists "auth_delete_pm_parts_used" on pm_parts_used;
create policy "auth_delete_pm_parts_used" on pm_parts_used
  for delete to authenticated using (true);

-- ─────────────────────────────────────────────────────────────
-- 6. pm_plans DELETE 정책 추가 (기존 06에서 누락)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "auth_delete_pm_plans" on pm_plans;
create policy "auth_delete_pm_plans" on pm_plans
  for delete to authenticated using (true);

drop policy if exists "auth_delete_pm_schedules" on pm_schedules;
create policy "auth_delete_pm_schedules" on pm_schedules
  for delete to authenticated using (true);

-- ─────────────────────────────────────────────────────────────
-- 7. 뷰 보완: pm_plan_summary (설비별 PM 현황 요약)
-- ─────────────────────────────────────────────────────────────
create or replace view pm_plan_summary as
select
  p.id                                               as plan_id,
  p.asset_id,
  a.machine_asset_number                             as asset_number,
  a.name_en                                          as asset_name,
  p.title,
  p.frequency_days,
  p.frequency_label,
  p.category,
  p.is_active,
  -- 다음 예정일 (가장 가까운 pending)
  min(s.scheduled_date) filter (
    where s.status = 'pending'
  )                                                  as next_scheduled_date,
  -- 마지막 완료일
  max(s.scheduled_date) filter (
    where s.status = 'completed'
  )                                                  as last_completed_date,
  -- 당월 계획 수 / 완료 수
  count(s.id) filter (
    where date_trunc('month', s.scheduled_date) = date_trunc('month', now())
  )::int                                             as this_month_total,
  count(s.id) filter (
    where date_trunc('month', s.scheduled_date) = date_trunc('month', now())
      and s.status = 'completed'
  )::int                                             as this_month_done,
  -- 지연 건수 (오늘 이전 pending)
  count(s.id) filter (
    where s.status = 'pending'
      and s.scheduled_date < current_date
  )::int                                             as overdue_count
from pm_plans p
left join assets       a on a.id = p.asset_id
left join pm_schedules s on s.plan_id = p.id
group by p.id, p.asset_id, a.machine_asset_number, a.name_en,
         p.title, p.frequency_days, p.frequency_label, p.category, p.is_active;

-- ─────────────────────────────────────────────────────────────
-- 8. RPC: pm_generate_schedules — 계획 저장 시 예정일 자동 생성
-- ─────────────────────────────────────────────────────────────
-- 호출: select pm_generate_schedules('<plan_id>', '<start_date>', 12)
-- 동작: start_date 부터 frequency_days 간격으로 count 개의 pm_schedules 레코드 삽입
--       이미 존재하는 날짜는 무시 (중복 방지)
create or replace function pm_generate_schedules(
  p_plan_id    uuid,
  p_start_date date,
  p_count      int default 12     -- 기본 12회치 미리 생성 (약 1년)
)
returns int                        -- 실제 삽입된 건수 반환
language plpgsql security definer as $$
declare
  v_plan       pm_plans%rowtype;
  v_inserted   int := 0;
  v_sched_date date;
  i            int;
begin
  select * into v_plan from pm_plans where id = p_plan_id;
  if not found then
    raise exception 'pm_plan not found: %', p_plan_id;
  end if;

  for i in 0..(p_count - 1) loop
    v_sched_date := p_start_date + (v_plan.frequency_days * i);

    -- 동일 plan_id + scheduled_date 가 이미 있으면 건너뜀
    if not exists (
      select 1 from pm_schedules
      where plan_id = p_plan_id
        and scheduled_date = v_sched_date
    ) then
      insert into pm_schedules (plan_id, asset_id, scheduled_date)
      values (p_plan_id, v_plan.asset_id, v_sched_date);
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return v_inserted;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 9. RPC: get_pm_compliance 보완 (기존 06에서 연간 조회 추가)
-- ─────────────────────────────────────────────────────────────
create or replace function get_pm_compliance_annual(
  p_year int default extract(year from now())::int
)
returns table (
  month            int,
  total_scheduled  int,
  total_completed  int,
  compliance_rate  numeric
)
language sql security definer as $$
  select
    extract(month from scheduled_date)::int              as month,
    count(*)::int                                        as total_scheduled,
    count(*) filter (where status = 'completed')::int    as total_completed,
    round(
      count(*) filter (where status = 'completed') * 100.0
      / nullif(count(*), 0), 1
    )                                                    as compliance_rate
  from pm_schedules
  where extract(year from scheduled_date) = p_year
  group by extract(month from scheduled_date)
  order by month;
$$;
```

---

## 2. 페이지 구조 (Next.js Pages Router)

기존 `pages/pm/` 하위에 신규 페이지를 추가하는 방식.
기존 index.js / new.js / [id].js 는 **수정** 대상.

```
pages/
  pm/
    index.js              ← [수정] /pm          대시보드 (탭 필터 + 설비별 보기 추가)
    new.js                ← [수정] /pm/new      PM 계획 등록 (체크리스트, 주기 레이블 추가)
    [id].js               ← [수정] /pm/[id]     일정 상세 + 완료 처리 (작업 로그 폼 통합)
    plans/
      index.js            ← [신규] /pm/plans    PM 계획 마스터 목록 (설비별 주기 관리)
      [planId].js         ← [신규] /pm/plans/[planId]  계획 상세/수정
    log/
      [scheduleId].js     ← [신규] /pm/log/[scheduleId]  작업 로그 입력 폼 (현장용)
    report.js             ← [신규] /pm/report   월별 계획 대비 실적 리포트

  api/
    pm/
      plans.js            ← [신규] GET(목록) / POST(생성)
      plans/[id].js       ← [신규] GET / PATCH / DELETE
      schedules.js        ← [신규] GET(목록) / POST(생성)
      schedules/[id].js   ← [신규] GET / PATCH (상태 변경)
      work-logs.js        ← [신규] GET(목록) / POST(생성)
      work-logs/[id].js   ← [신규] GET / PATCH / DELETE
      parts-used.js       ← [신규] POST(생성)
      parts-used/[id].js  ← [신규] DELETE
      generate.js         ← [신규] POST (pm_generate_schedules RPC 호출)
      compliance.js       ← [신규] GET (월별/연간 compliance_rate)
```

---

## 3. 페이지별 와이어프레임 (텍스트 기반)

### 3-1. /pm — PM 대시보드 (기존 index.js 수정)

기존 4탭(전체/이번주/D+3초과/완료)에 **"설비별"** 탭 추가.
상단에 이번 달 Compliance Rate 요약 카드 추가.

```
┌────────────────────────────────┐ max-w-480
│ PM 일정                [+]     │ 상단 헤더 (sticky)
├────────────────────────────────┤
│ ┌────────────────────────────┐ │ ComplianceSummaryCard (이번 달)
│ │ 이번 달 PM 이행률           │ │
│ │      83%  (15/18건)        │ │ 큰 숫자 강조
│ │ 지연 2건  ▲  완료 15건     │ │ 적색/녹색 서브 수치
│ └────────────────────────────┘ │
├────────────────────────────────┤
│ [전체][이번주][D+3초과][완료][설비별] │ 5탭 (overflow-x:auto)
├────────────────────────────────┤
│ (전체 탭: D-3 ~ D+3 범위 기존과 동일)
│
│ ┌──────────────────────────┐  │ PM 카드 (기존 패턴 유지)
│ ▌ D-2일            2026-05-14 │ 좌측 컬러바 + D-day 배지
│ │ 유압 오일 교환              │ plan.title
│ │ DCMI-PRD-HYD-01 · Hydraulic │ asset tag + name
│ │ 🔄 30일  ⏱ 2.0h           │ 주기 + 예상시간
│ └──────────────────────────┘  │
│
│ ┌──────────────────────────┐  │
│ ▌ 오늘              2026-05-12 │ 주황 바
│ │ 에어 필터 청소              │
│ │ DCMI-UTL-AIR-03 · Air Comp │
│ │ 🔄 7일  ⏱ 0.5h  [완료처리] │ 빠른 완료 버튼
│ └──────────────────────────┘  │
│
│ (설비별 탭 선택 시)            │
│
│ [검색: 자산번호/이름         ] │
│                                │
│ DCMI-PRD-HYD-01                │ AssetPMGroup 헤더
│ Hydraulic Press                │
│   다음 점검: D-2  ●미완 1건   │
│   [계획 목록 →]               │
│                                │
│ DCMI-UTL-AIR-03                │
│ Air Compressor                 │
│   다음 점검: 오늘  ●지연 0건   │
│   [계획 목록 →]               │
├────────────────────────────────┤
│ [Home][BM][PM][자산][KPI]      │ BottomNav (기존 유지)
└────────────────────────────────┘
```

### 3-2. /pm/plans — PM 계획 마스터 목록 (신규)

관리자가 설비별 점검 주기를 설정·관리하는 화면.
현장 작업자는 주로 /pm (대시보드)을 사용.

```
┌────────────────────────────────┐
│ [←] PM 계획 마스터   [+ 계획]  │ 헤더
├────────────────────────────────┤
│ [활성][비활성][전체]            │ 3탭
├────────────────────────────────┤
│ [검색: 설비명/작업명          ] │
│                                │
│ ┌──────────────────────────┐  │ PlanCard
│ │ ● 활성                   │  │ 초록 점
│ │ 유압 오일 교환             │  │ plan.title
│ │ DCMI-PRD-HYD-01          │  │ asset tag
│ │ 🔄 30일 (월간)  ⏱ 2.0h  │  │ 주기 레이블
│ │ 다음: 2026-05-14 (D-2)   │  │
│ │ 이번달: 1/1  지연: 0      │  │ 실적 요약
│ │              [편집] [일정]│  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ ● 활성                   │  │
│ │ 에어 필터 청소             │  │
│ │ DCMI-UTL-AIR-03          │  │
│ │ 🔄 7일 (주간)   ⏱ 0.5h  │  │
│ │ 다음: 2026-05-12 (오늘)  │  │
│ │ 이번달: 2/3  지연: 1      │  │ 지연 시 적색
│ │              [편집] [일정]│  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ [Home][BM][PM][자산][KPI]      │
└────────────────────────────────┘
```

### 3-3. /pm/new — PM 계획 등록 (기존 new.js 수정)

기존 폼에 `frequency_label`, `category`, `checklist` 입력 추가.
저장 시 `pm_generate_schedules` RPC 자동 호출.

```
┌────────────────────────────────┐
│ [←] PM 계획 등록               │
├────────────────────────────────┤
│ 설비 *                          │
│ [검색 또는 선택              ▼] │ 자산 select (기존과 동일)
│                                │
│ 작업명 *                        │
│ [유압 오일 교환               ] │
│                                │
│ 작업 유형                       │
│ [일반 ▼]                        │ general/lubrication/inspection/
│                                │   calibration/cleaning
│ 점검 주기 *                     │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐      │
│ │일││주││격│││ 월 ││분기││반기│  │ 토글 버튼 그룹
│ └──┘└──┘└──┘└──┘└──┘└──┘      │
│ [연간]                          │ 7번째 버튼
│ 또는 직접 입력: [  30  ]일      │ 커스텀 입력
│                                │
│ 시작일 *                        │
│ [2026-05-12                  ] │ date input
│                                │
│ 예상 소요시간                   │
│ [2.0] 시간                     │
│                                │
│ 체크리스트 항목 (선택)           │
│ ┌──────────────────────────┐  │
│ │ ✓ 오일 레벨 확인          │  │ 체크리스트 아이템
│ │ ✓ 오일 색상/점도 확인      │  │
│ │ ✓ 드레인 볼트 토크 확인    │  │
│ │ [+ 항목 추가            ] │  │ Enter로 추가
│ └──────────────────────────┘  │
│                                │
│ 설명 (선택)                     │
│ [                            ] │ textarea
│                                │
│ 활성 상태 [■ ON]               │ 토글 (기본 ON)
│                                │
│ 일정 자동 생성: 12회치 (약 1년) │ 안내 문구 (고정)
│                                │
│ [취소]            [저장]        │
├────────────────────────────────┤
│ [Home][BM][PM][자산][KPI]      │
└────────────────────────────────┘
```

### 3-4. /pm/[id] — 일정 상세 + 완료 처리 (기존 [id].js 수정)

기존 완료 처리 폼에 **작업 로그 구조화 입력** 통합.
사용 부품 섹션 추가.

```
┌────────────────────────────────┐
│ [←] PM 일정 상세               │
├────────────────────────────────┤
│ ┌──────────────────────────┐  │ 일정 요약 카드
│ │ D+1일              완료  │  │ D-day 배지 + 상태
│ │ 유압 오일 교환             │  │
│ │ DCMI-PRD-HYD-01          │  │
│ │ 예정일: 2026-05-11        │  │
│ │ 주기: 30일 (월간)  2.0h  │  │
│ └──────────────────────────┘  │
│                                │
│ ── 작업 기록 ──────────────── │ (status='pending'/'in_progress' 시 입력 가능)
│                                │
│ 수행자 이름 *                   │
│ [김철수                      ] │ 텍스트 입력 (auth.user 로그인 시 자동 채움)
│                                │
│ 소요 시간 *                     │
│ [1.5] 시간                     │
│                                │
│ 작업 결과 *                     │
│ [● 정상완료] [○ 이상발견] [○ 미룸] │ 라디오 버튼
│                                │
│ (result='abnormal' 시 표시)    │
│ 이상 내용 *                     │
│ [                            ] │ textarea
│ 조치 내용                       │
│ [                            ] │
│                                │
│ ── 체크리스트 ─────────────── │ (plan.checklist 있을 때만)
│ [■] 오일 레벨 확인              │ 체크박스
│ [■] 오일 색상/점도 확인         │
│ [□] 드레인 볼트 토크 확인       │
│                                │
│ ── 사용 부품 ──────────────── │
│ ┌──────────────────────────┐  │
│ │ 부품명        수량  단위  │  │
│ │ 유압 오일     5.0   L    │  │ 입력된 부품 행
│ │                     [삭제]│  │
│ └──────────────────────────┘  │
│ [+ 부품 추가]                  │ 클릭 시 인라인 행 추가
│   부품명 [              ]      │
│   수량   [    ]  단위 [ea ▼]  │
│                                │
│ 메모 (선택)                     │
│ [                            ] │
│                                │
│ [완료 처리]                    │ 제출 버튼 (빨간색)
│                                │
│ ── 이전 작업 기록 ────────── │ (work_logs 있을 때만)
│ 2026-04-11  김철수  1.5h  정상 │ 이전 로그 요약 행
│ 2026-03-11  이영희  2.0h  정상 │
│               [전체 기록 보기] │
├────────────────────────────────┤
│ [Home][BM][PM][자산][KPI]      │
└────────────────────────────────┘
```

### 3-5. /pm/log/[scheduleId] — 현장 작업 로그 전용 폼 (신규)

QR 스캔 또는 직접 URL 접근용. 현장 작업자가 폰으로 완료 처리.
/pm/[id] 의 완료 처리 폼을 독립 페이지로 분리한 것.
언어: 영어 우선 (타밀어 서브 레이블 선택적)

```
┌────────────────────────────────┐
│ PM Work Log                    │ 헤더 (영어)
├────────────────────────────────┤
│ ┌──────────────────────────┐  │
│ │ Hydraulic Oil Change      │  │
│ │ DCMI-PRD-HYD-01          │  │
│ │ Scheduled: 2026-05-11    │  │
│ └──────────────────────────┘  │
│                                │
│ Performed By *                 │
│ [                            ] │
│                                │
│ Hours Taken *                  │
│ [   ] hrs                      │
│                                │
│ Result *                       │
│ [● OK] [○ Abnormal] [○ Defer] │
│                                │
│ Notes                          │
│ [                            ] │
│                                │
│ Checklist                      │
│ [■] Check oil level            │
│ [■] Check oil colour           │
│ [□] Torque drain bolt          │
│                                │
│ Parts Used (optional)          │
│ [+ Add part]                   │
│                                │
│       [Submit / Complete]      │ 큰 버튼, #ef4444
├────────────────────────────────┤
│ [Home][BM][PM][자산][KPI]      │
└────────────────────────────────┘
```

### 3-6. /pm/plans/[planId] — 계획 상세/수정 (신규)

```
┌────────────────────────────────┐
│ [←] 계획 상세                  │
├────────────────────────────────┤
│ [탭: 정보] [일정 목록] [실적]   │ 3탭
├────────────────────────────────┤
│ (탭: 정보)                     │
│ 작업명    유압 오일 교환        │ 읽기 전용 표시
│ 설비      DCMI-PRD-HYD-01      │
│ 유형      윤활 (lubrication)   │
│ 주기      30일 (월간)          │
│ 예상시간  2.0h                 │
│ 상태      ● 활성               │
│                                │
│ 체크리스트                     │
│ • 오일 레벨 확인                │
│ • 오일 색상/점도 확인           │
│ • 드레인 볼트 토크 확인         │
│                                │
│ [편집] [비활성화] [삭제]        │
│                                │
│ (탭: 일정 목록)                │
│ [+ 일정 추가]  [자동생성]       │ 단건 추가 / RPC 호출
│                                │
│ 2026-06-11  ○예정  D-30       │
│ 2026-05-11  ●완료  2026-05-11 │ 실행일
│ 2026-04-11  ●완료  2026-04-11 │
│ 2026-03-11  ●완료  2026-03-12 │ 하루 늦게 완료
│                                │
│ (탭: 실적)                     │
│ 이행률 (최근 6개월)             │
│ 2026-05  1/1  100%  ●         │
│ 2026-04  1/1  100%  ●         │
│ 2026-03  1/1  100%  ●         │
│ 2026-02  0/1   0%   ✕ 미실시  │
│ 2026-01  1/1  100%  ●         │
│ 2025-12  1/1  100%  ●         │
├────────────────────────────────┤
│ [Home][BM][PM][자산][KPI]      │
└────────────────────────────────┘
```

### 3-7. /pm/report — 월별 실적 리포트 (신규)

```
┌────────────────────────────────┐
│ [←] PM 실적 리포트             │
├────────────────────────────────┤
│ 연도 [2026 ▼]                  │
├────────────────────────────────┤
│ ── 2026년 연간 이행률 ──────── │
│                                │
│ 1월  ██████████ 95%  (19/20)  │
│ 2월  █████████░  88%  (14/16) │
│ 3월  ██████████ 100% (18/18)  │
│ 4월  █████████░  90%  (18/20) │
│ 5월  ████░░░░░░  60%   (9/15) │ ← 진행 중
│                                │
│ ── 이번 달 미실시 항목 ─────── │
│                                │
│ ┌──────────────────────────┐  │
│ │ ✕ 유압 시스템 누유 점검   │  │ 적색 카드
│ │ DCMI-PRD-HYD-01          │  │
│ │ 예정: 2026-05-10  D+2    │  │
│ │              [처리하기 →] │  │
│ └──────────────────────────┘  │
│                                │
│ ── 설비별 이행률 (이번 달) ─── │
│                                │
│ Hydraulic Press    100%  2/2  │
│ Air Compressor      67%  2/3  │ ← 진행바 색상: 녹/노/적
│ CNC Lathe-01       100%  1/1  │
│ Conveyor Belt-A      0%  0/1  │ ← 0% 적색 강조
├────────────────────────────────┤
│ [Home][BM][PM][자산][KPI]      │
└────────────────────────────────┘
```

---

## 4. 컴포넌트 구조

기존 컴포넌트를 최대한 재사용하고, PM 전용은 `components/pm/` 하위에 신규 생성.

```
components/
  pm/                              ← 신규 디렉토리
    ComplianceSummaryCard.js       ← 이번 달 이행률 요약 카드 (대시보드 상단)
    PlanCard.js                    ← 계획 마스터 목록용 카드 (다음 예정일, 실적 요약)
    AssetPMGroup.js                ← 설비별 탭에서 사용하는 설비-계획 그룹 뷰
    ChecklistEditor.js             ← 체크리스트 항목 추가/삭제 인터페이스 (폼용)
    ChecklistRunner.js             ← 현장 체크리스트 실행 UI (체크박스 목록)
    PartsUsedForm.js               ← 사용 부품 인라인 추가/삭제 폼
    WorkLogList.js                 ← 이전 작업 기록 목록 (일정 상세 하단)
    FrequencySelector.js           ← 주기 토글 버튼 그룹 (일/주/격주/월/분기/반기/연간)
    PMComplianceBar.js             ← 월별 이행률 수평 바 (리포트 페이지용)
    OverdueAlert.js                ← 미실시 항목 적색 경고 카드
    ScheduleTimeline.js            ← 계획별 일정 목록 (예정/완료/지연 인라인)
```

### 컴포넌트별 역할 요약

| 컴포넌트 | 역할 | 핵심 props |
|---|---|---|
| ComplianceSummaryCard | 이번 달 이행률 숫자 카드, 지연/완료 수치 | month, total, done, overdue |
| PlanCard | 계획 한 줄 요약 카드, 편집/일정 버튼 | plan, nextSchedule, onEdit |
| AssetPMGroup | 설비 헤더 + 소속 계획 목록 접기/펼치기 | asset, plans[] |
| ChecklistEditor | 항목 입력 필드 + 순서 변경 + 삭제 | items[], onChange |
| ChecklistRunner | 체크박스 목록, 체크 여부 state 관리 | items[], onUpdate |
| PartsUsedForm | 부품명/수량/단위 인라인 행 추가/삭제 | parts[], onChange |
| WorkLogList | 과거 작업 로그 요약 (날짜/수행자/결과) | scheduleId, logs[] |
| FrequencySelector | 토글 버튼 그룹 → frequencyDays 숫자 반환 | value, onChange |
| PMComplianceBar | 월 이행률 텍스트 바 (폰트 스케일) | month, rate, total, done |
| OverdueAlert | 미실시 카드, "처리하기" 링크 포함 | schedule, daysOverdue |
| ScheduleTimeline | 계획별 일정 행 (상태 배지, 실행일) | schedules[], planId |

---

## 5. API Routes 목록

모든 엔드포인트는 Supabase Auth 세션 쿠키로 인증.
Pages Router 방식: `pages/api/pm/` 하위.

### 계획 (pm_plans)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/pm/plans | 계획 목록 (is_active 필터, asset_id 필터 지원) |
| POST | /api/pm/plans | 계획 생성 (저장 후 pm_generate_schedules RPC 자동 호출) |
| GET | /api/pm/plans/[id] | 계획 상세 (asset 조인, checklist 포함) |
| PATCH | /api/pm/plans/[id] | 계획 수정 (is_active 토글 포함) |
| DELETE | /api/pm/plans/[id] | 계획 삭제 (cascade: pm_schedules 자동 삭제) |

### 일정 (pm_schedules)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/pm/schedules | 일정 목록 (?status=, ?planId=, ?assetId=, ?from=, ?to=) |
| POST | /api/pm/schedules | 단건 일정 수동 생성 |
| GET | /api/pm/schedules/[id] | 일정 상세 (plan + asset + work_logs 조인) |
| PATCH | /api/pm/schedules/[id] | 상태 변경 (pending → in_progress → completed/skipped) |

### 작업 로그 (pm_work_logs)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/pm/work-logs | 로그 목록 (?scheduleId=, ?planId=, ?assetId=) |
| POST | /api/pm/work-logs | 작업 로그 생성 + pm_schedules 상태 자동 completed 변경 |
| GET | /api/pm/work-logs/[id] | 로그 상세 (parts_used 포함) |
| PATCH | /api/pm/work-logs/[id] | 로그 수정 (완료 후 메모 추가 등) |
| DELETE | /api/pm/work-logs/[id] | 로그 삭제 (pm_schedules 상태 pending 복구) |

### 사용 부품 (pm_parts_used)

| Method | Path | 설명 |
|---|---|---|
| POST | /api/pm/parts-used | 부품 사용 기록 생성 |
| DELETE | /api/pm/parts-used/[id] | 부품 기록 삭제 |

### 유틸리티

| Method | Path | 설명 |
|---|---|---|
| POST | /api/pm/generate | pm_generate_schedules RPC 호출 (?planId, ?startDate, ?count) |
| GET | /api/pm/compliance | 월별/연간 이행률 (?year=, ?month= 선택) |

---

## 6. 사용자 흐름

### 6-1. 관리자: PM 계획 신규 등록

```
/pm → 상단 [+] 버튼 클릭
  → /pm/new 이동
  → 설비 선택 (assets select)
  → 작업명 입력 ("유압 오일 교환")
  → 주기 선택 (월간 30일 토글)
  → 시작일 입력 (오늘 기본)
  → 체크리스트 항목 입력 (Enter로 추가)
  → [저장] 클릭
  → POST /api/pm/plans (계획 생성)
  → POST /api/pm/generate (RPC로 12개월 일정 자동 생성)
  → 성공 → /pm/plans/[planId] 이동 (일정 탭 자동 활성)
  → "12개 일정이 생성되었습니다" 토스트 표시
```

### 6-2. 현장 작업자: 완료 처리 (대시보드 → 상세)

```
/pm 대시보드
  → "오늘" 또는 "D+N" 카드 클릭
  → /pm/[scheduleId] 이동
  → 완료 처리 폼 확인:
      · 수행자 이름 입력 (로그인 시 자동 입력)
      · 소요 시간 입력
      · 결과 선택 (정상완료)
      · 체크리스트 항목 체크
      · (선택) 사용 부품 추가
  → [완료 처리] 버튼 클릭
  → POST /api/pm/work-logs (로그 생성)
  → PATCH /api/pm/schedules/[id] { status: 'completed' } (상태 변경)
  → 성공 → /pm 대시보드 복귀
  → 완료된 카드가 목록에서 사라짐 (기본 탭은 미완료만 표시)
```

### 6-3. 현장 작업자: QR 스캔으로 작업 로그 입력

```
작업자가 설비 QR 코드 스캔 (asset QR → /pm/log?asset=DCMI-PRD-HYD-01)
  → 해당 설비의 오늘/임박 pending 일정 조회
  → 1건: 바로 /pm/log/[scheduleId] 이동
  → 복수 건: 일정 선택 화면 표시
  → /pm/log/[scheduleId] 에서 작업 기록 입력 (영어 UI)
  → [Submit] → POST /api/pm/work-logs
  → "완료되었습니다" 확인 화면
```

### 6-4. 관리자: 미실시 항목 확인 및 처리

```
/pm → "D+3 초과" 탭 클릭
  → 4일 이상 지연 일정 목록 표시 (적색 바)
  → 카드 클릭 → /pm/[scheduleId]
  → 상황에 따라:
      · 실제로 했는데 미입력 → 날짜 소급하여 완료 처리
      · 건너뜀 → PATCH { status: 'skipped', notes: '사유' }
      · 앞으로 처리 → 그대로 둠 (D-day 계속 증가)
```

### 6-5. 관리자: 월간 이행률 확인

```
/pm → ComplianceSummaryCard 클릭 (또는 /pm/report 직접 접근)
  → /pm/report
  → 연도 선택 (기본: 현재 연도)
  → GET /api/pm/compliance?year=2026
  → 월별 이행률 바 + 이번 달 미실시 목록 표시
  → 미실시 카드의 [처리하기 →] 클릭 → /pm/[scheduleId]
```

---

## 7. 엣지 케이스 정의

| 상황 | 처리 방법 |
|---|---|
| pm_plans 레코드 없음 (최초 접근) | /pm 대시보드에서 "등록된 PM 계획이 없습니다. [+ 계획 추가]" 안내 |
| 일정 자동 생성 시 중복 날짜 | pm_generate_schedules RPC 내 중복 체크 (skip) |
| 비활성(is_active=false) 계획의 일정 | 대시보드에 표시하되 회색 처리, 완료 처리 불가 |
| 완료 로그 삭제 시 | pm_schedules 상태 pending으로 복구 (PATCH) |
| 같은 일정에 작업 로그 중복 생성 | API에서 completed 상태 체크 후 400 반환, 에러 메시지 표시 |
| 체크리스트 있는데 전체 미체크 | [완료 처리] 버튼 클릭 시 경고 confirm ("미체크 항목이 있습니다. 계속하시겠습니까?") |
| 사용 부품 part_name 빈 문자열 | 저장 전 필터링하여 빈 행 제거 |
| 비로그인으로 /pm 접근 | /login?next=/pm 리다이렉트 (기존 패턴 동일) |
| 비로그인으로 /pm/log/[id] 접근 | 현장 직원 편의를 위해 허용 가능 (Phase 2 판단) — Phase 1에서는 /login 리다이렉트 |
| 존재하지 않는 scheduleId | 404 처리 ("존재하지 않는 일정입니다") |
| pm_generate_schedules count 기본 12회치 초과 요청 | API에서 count 최대 60으로 제한 |
| asset_id null인 계획 | 대시보드에서 표시 허용, 설비 없음으로 표기 |
| frequency_days 와 frequency_label 불일치 | 저장 시 frequency_days 기준으로 label 자동 매핑 (앱 레이어에서 처리) |
| 일정 날짜 과거로 수동 생성 | 허용 (소급 처리), 저장 직후 overdue 상태로 표시 |
| 네트워크 오류 중 [완료 처리] | 에러 toast + 재시도 버튼 표시 (중복 제출 방지: busy 플래그) |
| 모바일 체크리스트 항목 길 경우 | 줄바꿈 허용, 체크박스는 상단 정렬 |

---

## 8. frequency_label ↔ frequency_days 매핑

앱 레이어(new.js / [planId].js)에서 아래 맵으로 변환:

```js
const FREQ_MAP = [
  { label: 'daily',     days: 1,   display: '매일 (1일)' },
  { label: 'weekly',    days: 7,   display: '주간 (7일)' },
  { label: 'biweekly',  days: 14,  display: '격주 (14일)' },
  { label: 'monthly',   days: 30,  display: '월간 (30일)' },
  { label: 'quarterly', days: 90,  display: '분기 (90일)' },
  { label: 'biannual',  days: 180, display: '반기 (180일)' },
  { label: 'annual',    days: 365, display: '연간 (365일)' },
];
// 커스텀 일수 입력 시: label='monthly' 기준에 맞는 값이 없으면 label=null로 저장
```

---

## 9. BottomNav 변경 없음

기존 BottomNav의 PM 슬롯은 이미 `/pm`으로 연결되어 있어 수정 불필요.

```js
// 현재 (변경 없음)
{ href: '/pm', label: 'PM', match: (p) => p === '/pm' || p.startsWith('/pm/'), icon: ClipboardIcon }
```

`/pm/plans`, `/pm/report`, `/pm/log/` 모두 `/pm`으로 시작하므로 자동 활성.

---

## 10. 기술 결정 사항 (웹개발자 참고)

### 상태 관리

기존 포털과 동일하게 `useState` + Supabase 클라이언트 직접 호출.
SWR/React Query 미도입 (기존 패턴 유지).
로그 작성 폼은 `busy` boolean으로 중복 제출 방지.

### 일정 자동 생성 타이밍

PM 계획 저장(POST /api/pm/plans) 성공 직후,
API Route 내에서 `pm_generate_schedules` RPC를 연달아 호출.
기본 12회치. 계획 수정 시 새로운 start_date 부터 추가 생성 가능.

```js
// /api/pm/plans.js 내 POST 핸들러 예시 구조
const { data: plan } = await supabase.from('pm_plans').insert({...}).select().single();
await supabase.rpc('pm_generate_schedules', {
  p_plan_id:    plan.id,
  p_start_date: body.startDate,
  p_count:      12,
});
```

### 체크리스트 스키마

pm_plans.checklist: `[{"item": "오일 레벨 확인", "required": true}]`
pm_work_logs.checklist_result: `[{"item": "오일 레벨 확인", "checked": true, "note": ""}]`

ChecklistEditor 컴포넌트가 plan 저장 전 배열을 구성.
ChecklistRunner 컴포넌트가 log 저장 전 체크 여부를 수집.

### 스타일 패턴

기존 `const S = { ... }` 인라인 스타일 객체 방식 유지.
다크 테마 (#0f172a 배경, #1e293b 카드).
미실시/지연 강조: `#ef4444` (적색), 완료: `#64748b` (회색), 정상: `#22c55e` (녹색).

### Supabase 클라이언트

```js
import { supabase } from '../../lib/supabase'; // 기존 파일 그대로
```

---

## 11. 구현 우선순위

### Phase 1 — MVP (핵심 기능)

목표: 계획 등록 → 일정 자동 생성 → 완료 처리 + 작업 로그 입력 → 이행률 확인

| 순서 | 작업 | 파일 | 예상 난이도 |
|---|---|---|---|
| 1 | DB 마이그레이션 (컬럼 추가 + 신규 테이블) | db/13_pm_module.sql | 낮음 |
| 2 | FrequencySelector 컴포넌트 | components/pm/FrequencySelector.js | 낮음 |
| 3 | ChecklistEditor 컴포넌트 | components/pm/ChecklistEditor.js | 낮음 |
| 4 | API: plans CRUD + generate | api/pm/plans.js, generate.js | 중간 |
| 5 | /pm/new 수정 (주기 레이블, 체크리스트 추가) | pages/pm/new.js | 중간 |
| 6 | API: schedules CRUD | api/pm/schedules.js, schedules/[id].js | 낮음 |
| 7 | API: work-logs CRUD | api/pm/work-logs.js, work-logs/[id].js | 중간 |
| 8 | PartsUsedForm 컴포넌트 | components/pm/PartsUsedForm.js | 낮음 |
| 9 | ChecklistRunner 컴포넌트 | components/pm/ChecklistRunner.js | 낮음 |
| 10 | /pm/[id] 수정 (작업 로그 통합, 부품 섹션) | pages/pm/[id].js | 중간 |
| 11 | API: parts-used | api/pm/parts-used.js | 낮음 |
| 12 | API: compliance | api/pm/compliance.js | 낮음 |
| 13 | ComplianceSummaryCard 컴포넌트 | components/pm/ComplianceSummaryCard.js | 낮음 |
| 14 | /pm/index.js 수정 (요약 카드 + 설비별 탭) | pages/pm/index.js | 중간 |

### Phase 2 — 계획 마스터 관리 + 리포트

목표: PM 계획 전체 현황 관리 화면 + 월간 리포트 + 현장 QR 접근

| 순서 | 작업 | 파일 | 예상 난이도 |
|---|---|---|---|
| 1 | PlanCard 컴포넌트 | components/pm/PlanCard.js | 낮음 |
| 2 | /pm/plans/index.js | pages/pm/plans/index.js | 중간 |
| 3 | ScheduleTimeline 컴포넌트 | components/pm/ScheduleTimeline.js | 중간 |
| 4 | WorkLogList 컴포넌트 | components/pm/WorkLogList.js | 낮음 |
| 5 | /pm/plans/[planId].js (3탭) | pages/pm/plans/[planId].js | 중간 |
| 6 | PMComplianceBar 컴포넌트 | components/pm/PMComplianceBar.js | 낮음 |
| 7 | OverdueAlert 컴포넌트 | components/pm/OverdueAlert.js | 낮음 |
| 8 | /pm/report.js | pages/pm/report.js | 중간 |
| 9 | /pm/log/[scheduleId].js (현장용 폼) | pages/pm/log/[scheduleId].js | 중간 |
| 10 | AssetPMGroup 컴포넌트 | components/pm/AssetPMGroup.js | 낮음 |

### Phase 3 — 확장 (선택)

| 작업 | 설명 |
|---|---|
| spare_parts 연동 | pm_parts_used.part_id → spare_parts 테이블 실제 FK, 재고 자동 차감 |
| BM 연계 | result='abnormal' 시 BM 이벤트 자동 생성 버튼 |
| 알림 | D-1 일정 Supabase Edge Function → 푸시/이메일 발송 |
| 비로그인 현장 접근 | /pm/log 페이지 인증 없이 접근 (익명 세션 또는 PIN 방식) |
| KPI 연동 | PM Compliance Rate → KPI 대시보드 자동 연동 |
| 체크리스트 템플릿 | 설비 유형별 표준 체크리스트 마스터 테이블 |

---

*설계서 끝. 궁금한 사항은 플레너에게 문의. 웹개발자는 Phase 1 → Phase 2 순서로 구현.*
