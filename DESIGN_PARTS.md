# 부품/재고(Parts & Inventory) 모듈 — 플레너 설계서

> 작성일: 2026-05-12
> 작성자: Web App Designer/Planner (DSC FMS Portal)
> 대상 개발자: web-builder
> 포털: https://dsc-fms-portal.vercel.app
> GitHub: https://github.com/asdf1390a-dot/dsc-fms-portal

---

## 0. 현황 분석 (기존 코드 기반)

### 이미 구현된 것

3개 페이지가 이미 존재함:
- `pages/inventory/index.js` — 목록 페이지 (카테고리 탭, 검색, 재고부족 배지)
- `pages/inventory/new.js` — 예비품 등록 폼 (기본 필드 + 자산 연결)
- `pages/inventory/[id].js` — 상세/입출고 처리 + 이력 20건 조회

DB도 `db/07_spare_parts.sql`에 기초 구현됨:
- `spare_parts` 테이블 (기본 컬럼, 5개 카테고리, RLS)
- `stock_movements` 테이블 (IN/OUT, reason, performed_by)
- 기본 인덱스, RLS 정책

### 현재 빠진 것 (이번 설계의 핵심)

| 부족한 기능 | 영향 |
|---|---|
| 공급업체(vendor) 테이블 없음 | 발주처 추적 불가 |
| spare_parts에 updated_at 없음 | 최종 수정일 추적 불가 |
| spare_parts에 vendor_id 없음 | 공급업체 연결 불가 |
| stock_movements에 bm_event_id 없음 | BM 이력과 출고 연결 불가 |
| stock_movements에 user_id(auth) 없음 | 처리자 텍스트만 저장, 로그인 사용자 미연결 |
| 재고부족 알림 발송 로직 없음 | 관리자에게 알림 없음 |
| 재고 현황 대시보드 없음 | 전체 현황 파악 불가 |
| 부품 편집 페이지 없음 | 등록 후 수정 불가 |
| 공급업체 관리 페이지 없음 | 발주 추적 불가 |
| BM 연결 UI 없음 | 출고 시 BM 이벤트 연결 불가 |

**결론: 기존 3개 페이지는 유지하고, 누락 컬럼 보완 + 신규 기능(vendor, BM 연결, 알림, 편집, 대시보드)을 추가한다.**

---

## 1. DB 스키마 (Supabase PostgreSQL)

파일명: `db/14_parts_module.sql`

```sql
-- ============================================================
-- DSC FMS Portal — Parts & Inventory Module (확장)
-- 파일: 14_parts_module.sql
-- 실행: Supabase Dashboard → SQL Editor
-- 전제: 07_spare_parts.sql 이미 실행됨
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. vendors (공급업체 마스터)
-- ─────────────────────────────────────────────────────────────
create table if not exists vendors (
  id            uuid primary key default gen_random_uuid(),

  -- 업체 기본 정보
  name          text not null,                    -- 'SKF India Ltd.'
  name_short    text,                             -- 'SKF'
  country       text not null default 'India',
  city          text,                             -- 'Chennai'
  contact_name  text,                             -- 담당자 이름
  contact_phone text,
  contact_email text,
  address       text,

  -- 납품 정보
  lead_time_days integer,                         -- 평균 납기 (일)
  payment_terms  text,                            -- '30일 후불', 'COD' 등
  currency       text not null default 'INR',     -- 'INR' | 'KRW' | 'USD'

  -- 상태
  is_active     boolean not null default true,
  notes         text,

  -- 메타
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_vendors_name on vendors(name);
create index if not exists idx_vendors_active on vendors(is_active);

-- ─────────────────────────────────────────────────────────────
-- 2. spare_parts 누락 컬럼 보완
-- ─────────────────────────────────────────────────────────────
alter table spare_parts
  add column if not exists vendor_id        uuid references vendors(id) on delete set null,
  add column if not exists unit_price       numeric(12,2),      -- 단가 (vendor currency 기준)
  add column if not exists currency         text default 'INR', -- 단가 통화
  add column if not exists lead_time_days   integer,            -- 이 부품의 납기 (업체 기본값 override)
  add column if not exists specs            text,               -- 규격/사양 (예: "60x110x22mm, C3")
  add column if not exists maker            text,               -- 제조사 (예: "SKF", "NSK")
  add column if not exists image_url        text,               -- Supabase Storage URL
  add column if not exists updated_at       timestamptz not null default now(),
  -- 재고부족 알림 발송 여부 (알림 중복 방지)
  add column if not exists low_stock_notified_at timestamptz;  -- 마지막 알림 발송 시각

-- 기존 updated_at 트리거와 동일한 패턴 적용
create index if not exists idx_spare_parts_vendor on spare_parts(vendor_id);
create index if not exists idx_spare_parts_low_stock
  on spare_parts(quantity, min_quantity)
  where quantity <= min_quantity;

-- ─────────────────────────────────────────────────────────────
-- 3. stock_movements 누락 컬럼 보완
-- ─────────────────────────────────────────────────────────────
alter table stock_movements
  -- BM 이벤트 연결 (출고 시 어떤 BM에 사용됐는지)
  add column if not exists bm_event_id      uuid references bm_events(id) on delete set null,
  -- 로그인 사용자 UID (기존 performed_by 텍스트와 병행)
  add column if not exists performed_by_uid uuid references auth.users(id) on delete set null,
  -- 입고 시 공급업체 (입고 출처 추적)
  add column if not exists vendor_id        uuid references vendors(id) on delete set null,
  -- 단가 (입고 시 실제 구매 단가 기록)
  add column if not exists unit_price       numeric(12,2),
  add column if not exists currency         text default 'INR',
  -- 발주번호 / 인보이스 참조
  add column if not exists reference_no     text;              -- PO번호, 인보이스번호 등

create index if not exists idx_stock_movements_bm on stock_movements(bm_event_id)
  where bm_event_id is not null;
create index if not exists idx_stock_movements_vendor on stock_movements(vendor_id)
  where vendor_id is not null;

-- ─────────────────────────────────────────────────────────────
-- 4. updated_at 자동 갱신 트리거
-- ─────────────────────────────────────────────────────────────
create or replace function parts_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- spare_parts updated_at 트리거 (컬럼 신규 추가 후 트리거 생성)
drop trigger if exists trg_spare_parts_updated_at on spare_parts;
create trigger trg_spare_parts_updated_at
  before update on spare_parts
  for each row execute function parts_set_updated_at();

-- vendors updated_at 트리거
create trigger trg_vendors_updated_at
  before update on vendors
  for each row execute function parts_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 5. 재고 자동 증감 트리거
--    stock_movements INSERT 시 spare_parts.quantity 자동 갱신
--    (기존 코드는 JS에서 직접 update했으나 DB 트리거로 이관)
-- ─────────────────────────────────────────────────────────────
create or replace function apply_stock_movement()
returns trigger language plpgsql as $$
begin
  if NEW.movement_type = 'IN' then
    update spare_parts
       set quantity = quantity + NEW.quantity
     where id = NEW.part_id;
  elsif NEW.movement_type = 'OUT' then
    -- 재고 부족이면 에러 발생 (DB 레벨 안전장치)
    if (select quantity from spare_parts where id = NEW.part_id) < NEW.quantity then
      raise exception 'INSUFFICIENT_STOCK: 현재 재고(%)보다 출고 수량(%)이 많습니다',
        (select quantity from spare_parts where id = NEW.part_id), NEW.quantity;
    end if;
    update spare_parts
       set quantity = quantity - NEW.quantity
     where id = NEW.part_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_stock_movement_apply on stock_movements;
create trigger trg_stock_movement_apply
  after insert on stock_movements
  for each row execute function apply_stock_movement();

-- ─────────────────────────────────────────────────────────────
-- 6. 재고부족 뷰 (KPI 및 알림용)
-- ─────────────────────────────────────────────────────────────
create or replace view v_low_stock as
select
  sp.id,
  sp.part_number,
  sp.name_ko,
  sp.name_en,
  sp.category,
  sp.quantity,
  sp.min_quantity,
  sp.unit,
  sp.location,
  sp.vendor_id,
  v.name        as vendor_name,
  v.contact_phone as vendor_phone,
  sp.lead_time_days,
  sp.low_stock_notified_at,
  -- 부족분
  (sp.min_quantity - sp.quantity) as shortage
from spare_parts sp
left join vendors v on v.id = sp.vendor_id
where sp.quantity <= sp.min_quantity
order by (sp.min_quantity - sp.quantity) desc, sp.name_ko;

-- ─────────────────────────────────────────────────────────────
-- 7. 월별 입출고 집계 뷰 (KPI 연동용)
-- ─────────────────────────────────────────────────────────────
create or replace view v_stock_monthly as
select
  date_trunc('month', sm.performed_at) as month,
  sm.movement_type,
  sp.category,
  count(*)                              as tx_count,
  sum(sm.quantity)                      as total_qty,
  sum(sm.quantity * coalesce(sm.unit_price, sp.unit_price, 0)) as total_value
from stock_movements sm
join spare_parts sp on sp.id = sm.part_id
group by 1, 2, 3
order by 1 desc, 2, 3;

-- ─────────────────────────────────────────────────────────────
-- 8. RLS — vendors 테이블
-- ─────────────────────────────────────────────────────────────
alter table vendors enable row level security;

-- 인증된 사용자만 읽기
create policy "vendors: auth read"
  on vendors for select
  using (auth.role() = 'authenticated');

-- 인증된 사용자만 생성/수정
create policy "vendors: auth insert"
  on vendors for insert
  with check (auth.role() = 'authenticated');

create policy "vendors: auth update"
  on vendors for update
  using (auth.role() = 'authenticated');

-- 삭제는 연결된 spare_parts 없을 때만 (DB FK cascade 없음 → 앱 레벨에서 체크)
create policy "vendors: auth delete"
  on vendors for delete
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- 9. spare_parts DELETE 정책 추가 (기존 07에 없음)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "auth users delete spare_parts" on spare_parts;
create policy "auth users delete spare_parts"
  on spare_parts for delete
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- 10. 시드 데이터 — 초기 공급업체 예시 (선택 실행)
-- ─────────────────────────────────────────────────────────────
-- insert into vendors (name, name_short, country, city, contact_name, currency, lead_time_days)
-- values
--   ('SKF India Ltd.',     'SKF',    'India', 'Chennai', null, 'INR', 7),
--   ('NSK India',          'NSK',    'India', 'Chennai', null, 'INR', 7),
--   ('Festo India',        'Festo',  'India', 'Mumbai',  null, 'INR', 14),
--   ('SMC Pneumatics',     'SMC',    'India', 'Chennai', null, 'INR', 10),
--   ('DSC Korea HQ',       'DSC HQ', 'Korea', 'Seoul',   null, 'KRW', 30);
```

---

## 2. 페이지 구조 (Next.js Pages Router)

```
pages/
  inventory/
    index.js              ← /inventory          목록 + 재고 현황 요약 (기존 확장)
    new.js                ← /inventory/new      예비품 등록 (기존 확장)
    [id].js               ← /inventory/[id]     상세 + 입출고 (기존 확장)
    edit/
      [id].js             ← /inventory/edit/[id]  예비품 편집 (신규)
    dashboard.js          ← /inventory/dashboard  재고 현황 대시보드 (신규)
  vendors/
    index.js              ← /vendors            공급업체 목록 (신규)
    new.js                ← /vendors/new        공급업체 등록 (신규)
    [id].js               ← /vendors/[id]       공급업체 상세 + 납품 부품 목록 (신규)
    edit/
      [id].js             ← /vendors/edit/[id]  공급업체 편집 (신규)

pages/api/
  inventory/
    low-stock-alert.js    ← POST  재고부족 Discord 알림 발송 (신규)
    export.js             ← GET   재고 목록 CSV 내보내기 (Phase 2)
  vendors/
    check-duplicate.js    ← GET   업체명 중복 체크 (신규)
```

### 기존 파일 변경 범위

| 파일 | 변경 내용 |
|---|---|
| `pages/inventory/index.js` | 재고부족 카운트 배너, 대시보드 링크 버튼 추가 |
| `pages/inventory/new.js` | vendor_id 선택 필드, specs/maker/unit_price 필드 추가 |
| `pages/inventory/[id].js` | 출고 시 BM 연결 select, 편집 버튼, vendor 정보 표시 추가 |

---

## 3. 페이지별 와이어프레임 (텍스트 기반)

### 3-1. /inventory — 목록 페이지 (기존 + 확장)

```
┌────────────────────────────────┐ max-w-480
│ 예비품 재고              [+]   │ 상단 헤더 (기존 유지)
├────────────────────────────────┤
│ ⚠ 재고부족 N건          [보기] │ 재고부족 알림 배너
│ (quantity <= min_quantity 건수) │ 빨간 배경 (#ef4444 15%)
├────────────────────────────────┤
│ [품번 또는 품목명 검색       ] │ 검색 (기존 유지)
├────────────────────────────────┤
│ [전체N][소모품N][기계N][전기N] │ 카테고리 탭 (기존 유지)
│ [유압N][기타N]                 │
├────────────────────────────────┤
│ ┌──────────────────────────┐  │ ← 재고 충분 (초록 좌선)
│ │ SKF-6205-2RS             │  │ 품번
│ │ 베어링 6205               │  │ 품목명
│ │ [기계부품]  창고 A-3      │  │ 카테고리 칩 + 위치
│ │                  12 / 5  │  │ 현재수량 / 최소수량
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │ ← 재고 부족 (빨간 좌선 + 테두리)
│ │ FESTO-MFHE3-1/4          │  │
│ │ 솔레노이드 밸브            │  │
│ │ [유압]  [재고부족]         │  │ 재고부족 배지
│ │                   1 / 5  │  │ 빨간색 수량
│ └──────────────────────────┘  │
│                                │
│ [재고 현황 대시보드 →]         │ 목록 하단 링크 버튼
├────────────────────────────────┤
│ [홈][BM][PM][자산][재고][KPI] │ BottomNav
└────────────────────────────────┘
```

### 3-2. /inventory/dashboard — 재고 현황 대시보드 (신규)

```
┌────────────────────────────────┐
│ [←] 재고 현황 대시보드         │ 헤더
├────────────────────────────────┤
│ ┌────────┐┌────────┐┌────────┐│ 요약 카드 3개
│ │전체    ││부족    ││공급업체││
│ │ 142    ││  8     ││  12   ││
│ │ 품목   ││ 품목   ││ 개    ││
│ └────────┘└────────┘└────────┘│
├────────────────────────────────┤
│ 재고 부족 품목                  │ 섹션 타이틀
│                                │
│ ┌──────────────────────────┐  │
│ │ 베어링 6205               │  │
│ │ 현재 1 / 최소 5 EA        │  │
│ │ 공급: SKF · 납기 7일      │  │
│ │ 부족분: 4 EA              │  │
│ │           [상세 →]        │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ 솔레노이드 밸브            │  │
│ │ 현재 0 / 최소 3 EA        │  │
│ │ 공급: Festo · 납기 14일   │  │
│ │ 부족분: 3 EA              │  │
│ │           [상세 →]        │  │
│ └──────────────────────────┘  │
│                                │
│ [Discord 알림 발송]            │ 재고부족 목록 알림 버튼
├────────────────────────────────┤
│ 이번 달 입출고                  │ 섹션 (v_stock_monthly)
│                                │
│ ┌──────────────────────────┐  │
│ │ 입고  +23건  +₹41,200    │  │
│ │ 출고  -18건              │  │
│ └──────────────────────────┘  │
│                                │
│ 카테고리별 현황                 │
│ [기계부품  ══════════ 42]     │ 가로 바 + 건수
│ [소모품    ═══════ 38]        │
│ [전기부품  ════ 28]           │
│ [유압부품  ═══ 21]            │
│ [기타      ══ 13]             │
├────────────────────────────────┤
│ [홈][BM][PM][자산][재고][KPI] │ BottomNav
└────────────────────────────────┘
```

### 3-3. /inventory/new (edit/[id]) — 예비품 등록/편집 폼 (기존 확장)

```
┌────────────────────────────────┐
│ [←] 예비품 등록                │ 헤더 (편집 시 "예비품 편집")
├────────────────────────────────┤
│ 품목명 (한국어) *               │
│ [베어링 6205                 ] │
│                                │
│ 품목명 (영어)                   │
│ [Bearing 6205                ] │
│                                │
│ 품번                            │
│ [SKF-6205-2RS                ] │
│                                │
│ 카테고리 *                      │
│ [소모품][기계부품][전기부품]     │ 버튼 그리드 (기존 유지)
│ [유압부품][기타]                │
│                                │
│ 제조사                          │
│ [SKF                         ] │ (신규 필드)
│                                │
│ 규격/사양                       │
│ [60x110x22mm, C3             ] │ (신규 필드)
│                                │
│ 공급업체                        │
│ [SKF India Ltd.            v ] │ vendors 목록 select (신규)
│                                │
│ 관련 자산                       │
│ [설비 선택                  v ] │ assets 목록 select (기존)
│                                │
│ 현재 수량 *                     │
│ [12                          ] │
│                                │
│ 최소 수량 *                     │
│ [5                           ] │
│                                │
│ 단위                            │
│ [EA                          ] │
│                                │
│ 단가                            │
│ [1250                        ] │ 숫자 (신규 필드)
│ [INR v]                        │ 통화 select (INR/KRW/USD)
│                                │
│ 보관 위치                       │
│ [자재창고 A-3                 ] │
│                                │
│ 비고                            │
│ [                            ] │
│ [                            ] │ textarea
│                                │
│ [취소]          [저장]          │
├────────────────────────────────┤
│ [홈][BM][PM][자산][재고][KPI] │
└────────────────────────────────┘
```

### 3-4. /inventory/[id] — 예비품 상세 (기존 확장)

```
┌────────────────────────────────┐
│ [←] SKF-6205-2RS               │ 헤더
│      베어링 6205                │ (기존 유지)
├────────────────────────────────┤
│ ┌──────────────────────────┐  │ 재고 현황 카드 (기존 유지)
│ │      현재 재고            │  │
│ │       12  EA             │  │ 큰 숫자
│ │    최소 수량 5 EA         │  │
│ └──────────────────────────┘  │
│                                │
│ [▲ 입고]          [▼ 출고]     │ 액션 버튼 (기존 유지)
│                                │
│ (출고 패널 확장 시 — 신규)      │
│ ┌──────────────────────────┐  │
│ │ 출고 처리                 │  │
│ │ 수량 *   [    ]           │  │
│ │ BM 연결  [BM-2026-042  v] │ ← BM 이벤트 select (신규)
│ │          open 상태만 표시  │
│ │ 사유     [BM 수리 사용   ] │
│ │ 처리자   [홍길동          ] │
│ │ [취소]        [확인]       │
│ └──────────────────────────┘  │
│                                │
│ 상세 정보                      │ 섹션 (확장)
│ 카테고리   기계부품             │
│ 제조사     SKF                 │ (신규)
│ 규격       60x110x22mm, C3    │ (신규)
│ 공급업체   SKF India Ltd.      │ (신규, 링크)
│           납기 7일 · INR       │
│ 단가       ₹1,250              │ (신규)
│ 관련 자산  M-001 — Press 1     │ (기존)
│ 보관 위치  창고 A-3            │
│ 비고       ...                  │
│                  [편집]        │ (신규 버튼)
│                                │
│ 입출고 이력 (20)               │ 섹션 (기존 + BM 링크 추가)
│ ▲ 입고  +5 EA                  │
│   신규 입고  홍길동  2026-05-10│
│   PO: PO-2026-051              │ (신규 reference_no)
│                                │
│ ▼ 출고  -2 EA                  │
│   BM 수리 사용                  │
│   → BM-2026-042 링크           │ (신규 BM 연결 링크)
│   홍길동  2026-05-08           │
├────────────────────────────────┤
│ [홈][BM][PM][자산][재고][KPI] │
└────────────────────────────────┘
```

### 3-5. /vendors/index — 공급업체 목록 (신규)

```
┌────────────────────────────────┐
│ 공급업체                  [+]  │ 헤더
├────────────────────────────────┤
│ [업체명 검색              ]    │ 검색
├────────────────────────────────┤
│ [활성 N] [비활성 N]            │ 탭 (간단 2탭)
├────────────────────────────────┤
│ ┌──────────────────────────┐  │
│ │ SKF India Ltd.           │  │ 업체명
│ │ Chennai, India           │  │ 도시/국가
│ │ 납기 7일 · INR           │  │ 납기 + 통화
│ │ 담당 부품 8종             │  │ 연결된 부품 수
│ │                  [보기 →]│  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ Festo India              │  │
│ │ Mumbai, India            │  │
│ │ 납기 14일 · INR          │  │
│ │ 담당 부품 5종             │  │
│ │                  [보기 →]│  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ [홈][BM][PM][자산][재고][KPI] │
└────────────────────────────────┘
```

### 3-6. /vendors/[id] — 공급업체 상세 (신규)

```
┌────────────────────────────────┐
│ [←] SKF India Ltd.             │ 헤더
├────────────────────────────────┤
│ [탭: 정보] [담당 부품]          │ 2탭
├────────────────────────────────┤
│ (탭: 정보)                     │
│                                │
│ 업체명    SKF India Ltd.       │
│ 단축명    SKF                  │
│ 국가/도시 India / Chennai      │
│ 담당자    Raj Kumar            │
│ 전화      +91-44-XXXX-XXXX    │
│ 이메일    raj@skfindia.com     │
│ 납기      평균 7일             │
│ 결제조건  30일 후불            │
│ 통화      INR                  │
│ 비고      ...                  │
│                                │
│ [편집] [비활성화]              │
│                                │
│ (탭: 담당 부품)                 │
│                                │
│ ┌──────────────────────────┐  │
│ │ 베어링 6205              │  │
│ │ SKF-6205-2RS             │  │
│ │ 현재 12 / 최소 5 EA      │  │
│ │           [재고 보기 →]  │  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ 베어링 6004              │  │
│ │ 현재 3 / 최소 5 EA       │  │
│ │ [재고부족]               │  │
│ │           [재고 보기 →]  │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ [홈][BM][PM][자산][재고][KPI] │
└────────────────────────────────┘
```

---

## 4. 컴포넌트 구조

```
components/
  inventory/
    LowStockBanner.js       ← 재고부족 N건 알림 배너 (목록 상단 고정)
    StockSummaryCards.js    ← 대시보드 요약 카드 3개 (전체/부족/공급업체)
    LowStockList.js         ← 재고부족 품목 카드 목록
    CategoryBarChart.js     ← 카테고리별 수평 바 차트 (div 너비 기반, SVG 불필요)
    MonthlyMovementCard.js  ← 이번 달 입출고 요약 카드
    BmEventSelect.js        ← 출고 시 BM 이벤트 드롭다운 (open 상태 BM만 표시)
    VendorSelect.js         ← 부품 폼의 공급업체 드롭다운 (활성 vendor만)
    MovementHistory.js      ← 입출고 이력 목록 (BM 링크 포함, 기존 [id].js 인라인 코드 분리)
    PartInfoSection.js      ← 상세 페이지의 "상세 정보" 섹션 (기존 인라인 분리)
  vendors/
    VendorCard.js           ← 공급업체 카드 (목록용)
    VendorForm.js           ← 공급업체 등록/편집 폼 (new, edit 공유)
    VendorPartsList.js      ← 공급업체 상세의 "담당 부품" 탭
```

### 컴포넌트별 역할 요약

| 컴포넌트 | 역할 | props 핵심 |
|---|---|---|
| LowStockBanner | 재고부족 건수 표시 + 대시보드 링크 | count |
| StockSummaryCards | 전체/부족/공급업체 숫자 요약 | total, lowCount, vendorCount |
| LowStockList | 부족 품목 카드 목록, Discord 알림 버튼 | items[], onAlert |
| CategoryBarChart | 카테고리별 수량 바 (div 너비%) | data[{category, count}] |
| MonthlyMovementCard | 이번 달 IN/OUT 건수·금액 | stats |
| BmEventSelect | open 상태 BM 이벤트 select | value, onChange |
| VendorSelect | vendors 드롭다운, 활성만 표시 | value, onChange |
| MovementHistory | 이력 행 목록, IN/OUT 색상, BM 링크 | movements[], unit |
| PartInfoSection | 부품 상세 정보 행 목록 | part, asset, vendor |
| VendorCard | 업체명/도시/납기/부품수 카드 | vendor, partCount |
| VendorForm | 업체 등록/편집 폼 | initial, onSave, onDelete |
| VendorPartsList | 업체에 연결된 부품 목록 | vendorId |

---

## 5. API Routes 목록

모든 API는 Supabase Auth 세션 쿠키로 인증 검증.
기존 `pages/api/photos/upload.js`, `pages/api/bm/resolve.js` 패턴과 동일.

### 재고 알림 (신규)

| Method | Path | 설명 |
|---|---|---|
| POST | /api/inventory/low-stock-alert | 재고부족 목록 Discord 알림 발송 + low_stock_notified_at 갱신 |

### 공급업체 CRUD (신규)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/vendors | 공급업체 목록 (is_active 필터 포함) |
| POST | /api/vendors | 공급업체 생성 |
| GET | /api/vendors/[id] | 공급업체 상세 |
| PATCH | /api/vendors/[id] | 공급업체 수정 (is_active 토글 포함) |
| DELETE | /api/vendors/[id] | 공급업체 삭제 (연결 부품 없을 때만 허용) |
| GET | /api/vendors/check-duplicate?name= | 업체명 중복 체크 |

### 재고 내보내기 (Phase 2)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/inventory/export | 현재 재고 CSV 내보내기 |

### 기존 API — 변경 없음

기존 `spare_parts`, `stock_movements`는 Supabase 클라이언트 직접 호출 방식 유지.
API Route 추가 불필요 (기존 페이지와 일관성 유지).

---

## 6. 사용자 흐름

### 6-1. 공급업체 등록 흐름

```
/vendors 접근
  → [+] 버튼 클릭
  → /vendors/new 이동
  → VendorForm 입력 (업체명, 국가, 납기, 통화 등)
  → 저장 → POST /api/vendors
  → 성공 시 /vendors/[id] 이동
  → VendorCard 목록에 즉시 반영
```

### 6-2. 예비품 등록 + 공급업체 연결 흐름

```
/inventory/new 접근
  → VendorSelect에서 공급업체 선택 (활성 vendor 목록 표시)
  → 품목명, 품번, 카테고리, 수량, 최소수량, 단가 입력
  → 저장 → supabase.from('spare_parts').insert(...)
  → /inventory 목록으로 복귀
  → 재고부족 기준(min_quantity) 즉시 적용
```

### 6-3. 출고 + BM 연결 흐름

```
/inventory/[id] 접근
  → [▼ 출고] 버튼 클릭
  → 출고 패널 확장
  → 수량 입력
  → BmEventSelect에서 BM 이벤트 선택 (open/in_progress 상태만)
    → bm_events를 supabase에서 조회 (최근 30일, open 상태)
  → 사유, 처리자 입력
  → [확인] 클릭
  → supabase.from('stock_movements').insert({
      part_id, movement_type: 'OUT', quantity,
      bm_event_id, reason, performed_by, performed_by_uid
    })
  → DB 트리거(apply_stock_movement)가 spare_parts.quantity 자동 감산
  → 재고가 min_quantity 이하가 되면 LowStockBanner에 즉시 반영
  → 이력 목록 refetch → BM 링크 표시
```

### 6-4. 재고부족 알림 발송 흐름

```
/inventory/dashboard 접근
  → v_low_stock 뷰 조회 → LowStockList 렌더링
  → [Discord 알림 발송] 클릭
  → POST /api/inventory/low-stock-alert
  → 서버: v_low_stock 조회 → Discord Webhook으로 메시지 전송
      포맷: "⚠ 재고 부족 알림 (N품목)\n• 베어링 6205: 1/5 EA (SKF · 납기7일)\n..."
  → spare_parts.low_stock_notified_at 갱신 (중복 방지)
  → 응답 성공 → "알림 발송 완료" toast 표시
```

### 6-5. 부품 편집 흐름

```
/inventory/[id] → [편집] 버튼 클릭
  → /inventory/edit/[id] 이동
  → 기존 데이터 prefill (supabase maybeSingle)
  → 필드 수정
  → 저장 → supabase.from('spare_parts').update({...}).eq('id', id)
  → /inventory/[id] 복귀 (router.push)
```

---

## 7. 엣지 케이스 정의

| 상황 | 처리 방법 |
|---|---|
| 출고 수량 > 현재 재고 | DB 트리거에서 INSUFFICIENT_STOCK 에러 발생 → JS catch로 "재고 부족" 메시지 표시 |
| 입고 후 수량 overflow (integer 초과) | 사실상 발생 안 함 (공장 규모), integer max 2,147,483,647 |
| BM 이벤트 select 빈 목록 (open BM 없음) | "연결할 BM 없음" 텍스트 표시, bm_event_id null로 저장 허용 |
| 공급업체 삭제 시 연결 부품 있음 | DELETE /api/vendors/[id]에서 spare_parts COUNT 확인 후 400 반환 → "N개 부품 연결됨. 먼저 부품의 공급업체를 변경하세요" |
| 재고부족 알림 반복 발송 방지 | low_stock_notified_at 기준 24시간 이내면 알림 버튼 비활성화 (or 경고 표시) |
| Discord Webhook URL 미설정 | process.env.DISCORD_WEBHOOK_URL 없으면 API에서 503 반환 → "알림 설정이 필요합니다" |
| 비로그인으로 입출고 시도 | [id].js에서 이미 처리됨 (isAuthed 체크, 로그인 유도 메시지) |
| 비로그인으로 /inventory 접근 | 목록은 anon read 허용 (기존 정책 유지), 입출고/등록만 인증 필요 |
| spare_parts 대량 등록 시 성능 | index.js에서 limit(500) 유지, 추후 페이지네이션 고려 |
| vendor 없는 상태에서 VendorSelect | "공급업체 없음 — /vendors/new에서 먼저 등록" 옵션 표시 |
| 부품 삭제 시 연결된 stock_movements | DB cascade delete → confirm 다이얼로그 "이력 N건이 함께 삭제됩니다" |
| min_quantity = 0 설정 | 재고부족 알림 비대상으로 처리 (WHERE quantity <= min_quantity AND min_quantity > 0) |
| 이력 20건 초과 시 더보기 | Phase 2 구현, 현재는 limit(20) 고정 |

---

## 8. BottomNav 수정 사항

현재 BottomNav에 "재고" 항목이 있는지 확인 필요.
기존 패턴 유지하되, 아래 match 조건으로 /inventory와 /vendors 모두 활성화.

```js
// 기존 "재고" 항목 match 조건 보완 (vendors도 재고 영역으로 간주)
{ href: '/inventory', label: '재고', match: (p) =>
    p === '/inventory' ||
    p.startsWith('/inventory/') ||
    p === '/vendors' ||
    p.startsWith('/vendors/')
}
```

---

## 9. 구현 우선순위

### Phase 1 — MVP (핵심 기능, 기존 보완)

목표: 누락 컬럼 보완 + 공급업체 관리 + BM 연결 출고까지 동작

| 순서 | 작업 | 파일 | 예상 난이도 |
|---|---|---|---|
| 1 | DB 마이그레이션 | db/14_parts_module.sql | 낮음 |
| 2 | vendors API CRUD | pages/api/vendors/*.js | 낮음 |
| 3 | /vendors/index.js | 공급업체 목록 | 낮음 |
| 4 | VendorForm 컴포넌트 | components/vendors/VendorForm.js | 낮음 |
| 5 | /vendors/new.js, /vendors/[id].js | 등록/상세 | 중간 |
| 6 | inventory/new.js 확장 | vendor_id, specs, maker, unit_price 필드 추가 | 낮음 |
| 7 | inventory/edit/[id].js | 기존 new.js 재활용, 수정 모드 | 낮음 |
| 8 | inventory/[id].js 확장 | 출고 BM 연결 + vendor 정보 + 편집 버튼 | 중간 |
| 9 | BmEventSelect 컴포넌트 | components/inventory/BmEventSelect.js | 낮음 |
| 10 | inventory/index.js 확장 | LowStockBanner + 대시보드 링크 | 낮음 |
| 11 | LowStockBanner 컴포넌트 | components/inventory/LowStockBanner.js | 낮음 |

### Phase 2 — 대시보드 + 알림 + 공급업체 상세

목표: 관리자 가시성 향상 + 알림 자동화

| 순서 | 작업 | 파일 | 예상 난이도 |
|---|---|---|---|
| 1 | /inventory/dashboard.js | 재고 현황 대시보드 | 중간 |
| 2 | StockSummaryCards, LowStockList | components/inventory/ | 낮음 |
| 3 | CategoryBarChart | div 너비% 기반 바 차트 | 낮음 |
| 4 | MonthlyMovementCard | v_stock_monthly 연동 | 낮음 |
| 5 | /api/inventory/low-stock-alert.js | Discord Webhook 알림 | 낮음 |
| 6 | /vendors/edit/[id].js | 공급업체 편집 | 낮음 |
| 7 | VendorPartsList | 공급업체 상세 담당 부품 탭 | 낮음 |
| 8 | BottomNav match 조건 보완 | components/BottomNav.js | 낮음 |

### Phase 3 — 확장 (선택)

| 작업 | 설명 |
|---|---|
| CSV 내보내기 | /api/inventory/export.js → 엑셀 업로드용 |
| 이력 페이지네이션 | limit 20 → 페이지 or 무한 스크롤 |
| 발주서 생성 | 재고부족 품목 → PDF 발주서 자동 생성 |
| 부품 사진 업로드 | Supabase Storage asset-photos 버킷 활용 |
| QR 스캔 입출고 | 현장 스마트폰으로 QR 스캔 → 바로 출고 처리 |

---

## 10. 기술 결정 사항 (웹개발자 참고)

### 상태 관리

기존 포털과 동일하게 useState + Supabase 클라이언트 직접 호출 방식 유지.
단, stock_movements INSERT는 기존처럼 JS에서 spare_parts.update를 같이 하지 말 것.
DB 트리거(apply_stock_movement)가 자동 처리하므로 INSERT 하나만 수행.

```js
// 기존 방식 (제거)
await supabase.from('stock_movements').insert({...});
await supabase.from('spare_parts').update({ quantity: newQty }).eq('id', part.id); // 삭제

// 신규 방식 (트리거가 처리)
const { error } = await supabase.from('stock_movements').insert({...});
if (error?.message?.includes('INSUFFICIENT_STOCK')) {
  setError('현재 재고보다 많은 수량을 출고할 수 없습니다');
  return;
}
// refetch만 하면 업데이트된 수량 자동 반영
await refetch();
```

### 스타일

기존 인라인 스타일 방식 유지. 신규 컴포넌트도 동일.
다크 테마 기본 (#0f172a 배경, #1e293b 카드, #ef4444 강조색).
입고 = 초록(#16a34a/#86efac), 출고 = 빨강(#dc2626/#fca5a5) — 기존 [id].js 색상 계승.

### Supabase 클라이언트

```js
// 기존 패턴 그대로
import { supabase } from '../../lib/supabase';
```

### BM 이벤트 조회 (BmEventSelect)

```js
// open 또는 in_progress 상태, 최근 30일 BM만 표시
const { data } = await supabase
  .from('bm_events')
  .select('id, asset_id, reported_at, symptom, assets(machine_asset_number)')
  .in('status', ['open', 'in_progress', 'pending_parts'])
  .gte('reported_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  .order('reported_at', { ascending: false })
  .limit(50);
```

### Discord 알림 포맷

```
⚠ DSC FMS 재고부족 알림 (N품목) — 2026-05-12

• 베어링 6205 (SKF-6205-2RS)
  현재 1EA / 최소 5EA → 부족 4EA
  공급: SKF India · 납기 7일
  위치: 창고 A-3

• 솔레노이드 밸브 (FESTO-MFHE3-1/4)
  현재 0EA / 최소 3EA → 부족 3EA
  공급: Festo India · 납기 14일
  위치: 창고 B-1

조회: https://dsc-fms-portal.vercel.app/inventory/dashboard
```

### 환경 변수 추가 필요

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

기존 `pages/api/discord-notify.js` 패턴과 동일한 Webhook 사용 가능.

---

## 11. 기존 코드와의 호환성 체크리스트

웹개발자가 DB 마이그레이션 전에 반드시 확인:

- [ ] `07_spare_parts.sql` 이미 실행됨 확인 → spare_parts, stock_movements 테이블 존재 여부
- [ ] `apply_stock_movement` 트리거 추가 후 기존 [id].js의 spare_parts update 코드 제거
  - 제거 대상: `pages/inventory/[id].js` 98~130번째 줄 중 `supabase.from('spare_parts').update(...)` 부분
  - 트리거가 자동 처리하므로 이중 갱신되면 수량 오류 발생
- [ ] `stock_movements.performed_by` 기존 텍스트 컬럼은 유지 (하위 호환)
  - 신규 `performed_by_uid` UUID 컬럼과 병행 사용
- [ ] RLS 정책 중복 방지: `07_spare_parts.sql`의 기존 policy 이름과 충돌 없는지 확인
  - 14_parts_module.sql의 vendors policy는 완전 신규
  - spare_parts DELETE policy만 `drop policy if exists` 후 재생성

---

*설계서 끝. 궁금한 사항은 플레너에게 문의. 웹개발자는 Phase 1 → Phase 2 순서로 구현.*
