# 개인 커리어 워크스페이스 모듈 — 플레너 설계서

> 작성일: 2026-05-12
> 작성자: Web App Designer/Planner (DSC FMS Portal)
> 대상 개발자: web-builder
> 포털: https://dsc-fms-portal.vercel.app
> GitHub: https://github.com/asdf1390a-dot/dsc-fms-portal

---

## 0. 설계 배경 및 원칙

### 왜 이 모듈이 필요한가

FMS 포털은 공장 운영 도구지만, 사용자(한국인 주재원)는 개인 커리어 관리도 같은 플랫폼에서 하고 싶다.
공장에서 수행한 프로젝트·성과를 자동으로 포트폴리오로 전환할 수 있으면 이중 작업이 줄어든다.

### 설계 원칙

- 개인 데이터 — RLS로 본인만 R/W, 포트폴리오 공개 시에만 외부 열람 허용
- 멀티컴퍼니 — DSC Mannur가 첫 번째 회사, 이후 다른 회사도 추가 가능한 구조
- FMS 연계 — BM 이력·프로젝트를 career 모듈에서 참조 가능 (느슨한 연결)
- 기존 스타일 유지 — 다크 테마(#0f172a), BottomNav, 카드형 UI, 인라인 스타일 방식
- 모바일 퍼스트 — 최대 너비 480px, 하단 고정 네비게이션

---

## 1. DB 스키마 (Supabase PostgreSQL)

파일명: `db/12_career_module.sql`

```sql
-- ============================================================
-- DSC FMS Portal — Career Workspace Module
-- 파일: 12_career_module.sql
-- 실행: Supabase Dashboard → SQL Editor → 순서대로 실행
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. companies (회사 마스터)
-- ─────────────────────────────────────────────────────────────
create table if not exists career_companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  -- 회사 기본 정보
  name        text not null,                    -- 'DSC Mannur (P) Ltd.'
  name_short  text,                             -- 'DSC Mannur'
  country     text not null default 'India',
  city        text,                             -- 'Chennai'
  industry    text,                             -- 'Automotive Parts'
  logo_url    text,                             -- Supabase Storage URL

  -- 재직 정보
  department  text,                             -- '생산기술/보전'
  title       text not null,                   -- 'Assistant General Manager'
  employment_type text default 'full_time'
    check (employment_type in ('full_time','part_time','contract','internship','freelance')),
  start_date  date not null,
  end_date    date,                             -- null = 현재 재직 중
  is_current  boolean not null default false,

  -- 공개 설정
  is_public   boolean not null default false,   -- 포트폴리오 공개 여부

  -- 메타
  sort_order  int not null default 0,           -- 표시 순서 (낮을수록 위)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists career_companies_user_idx on career_companies(user_id);
create index if not exists career_companies_public_idx on career_companies(user_id, is_public);

-- ─────────────────────────────────────────────────────────────
-- 2. career_projects (프로젝트 이력)
-- ─────────────────────────────────────────────────────────────
create table if not exists career_projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  company_id    uuid not null references career_companies(id) on delete cascade,

  -- 프로젝트 정보
  title         text not null,                  -- 'FMS 포털 구축'
  summary       text,                           -- 한 줄 요약 (포트폴리오 카드용)
  description   text,                           -- 상세 설명 (Markdown 허용)
  role          text,                           -- '프로젝트 리더'

  -- 기간
  start_date    date,
  end_date      date,
  is_ongoing    boolean not null default false,

  -- 분류
  category      text default 'improvement'
    check (category in ('improvement','cost_reduction','quality','safety','digital','automation','other')),
  tags          text[] default '{}',            -- ['Next.js','Supabase','생산관리']

  -- 성과 지표 (선택)
  kpi_label     text,                           -- '비용 절감'
  kpi_value     text,                           -- '₩3,200만'
  kpi_detail    text,                           -- 상세 설명

  -- 공개
  is_public     boolean not null default false,
  is_featured   boolean not null default false, -- 포트폴리오 상단 노출

  -- FMS 연계 (선택적, 느슨한 연결)
  fms_ref_type  text,                           -- 'bm_event' | 'asset' | null
  fms_ref_ids   uuid[] default '{}',            -- 참조 레코드 ID 배열

  -- 메타
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists career_projects_company_idx on career_projects(company_id);
create index if not exists career_projects_user_idx on career_projects(user_id);
create index if not exists career_projects_public_idx on career_projects(user_id, is_public);

-- ─────────────────────────────────────────────────────────────
-- 3. career_achievements (정량적 성과)
-- ─────────────────────────────────────────────────────────────
create table if not exists career_achievements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  company_id    uuid not null references career_companies(id) on delete cascade,
  project_id    uuid references career_projects(id) on delete set null,

  -- 성과 내용
  title         text not null,                  -- '설비 가동률 5% 향상'
  detail        text,                           -- 상세 설명
  achieved_at   date,                           -- 달성 시점 (월 단위도 허용, day=1로 저장)
  achievement_type text default 'improvement'
    check (achievement_type in ('award','kpi_improvement','cost_reduction','process','certification','other')),

  -- 수치화
  metric_label  text,                           -- 'OEE'
  metric_before text,                           -- '78%'
  metric_after  text,                           -- '83%'

  -- 공개
  is_public     boolean not null default false,

  -- 메타
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists career_achievements_company_idx on career_achievements(company_id);
create index if not exists career_achievements_user_idx on career_achievements(user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. career_skills (스킬 태그 마스터)
-- ─────────────────────────────────────────────────────────────
create table if not exists career_skills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  name        text not null,                    -- 'Next.js'
  category    text default 'technical'
    check (category in ('technical','management','language','domain','tool','other')),
  level       text default 'intermediate'
    check (level in ('beginner','intermediate','advanced','expert')),

  -- 어떤 회사에서 사용했는지 (다대다 대신 배열로 단순화)
  company_ids uuid[] default '{}',

  is_public   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),

  unique (user_id, name)
);

create index if not exists career_skills_user_idx on career_skills(user_id);

-- ─────────────────────────────────────────────────────────────
-- 5. career_profiles (포트폴리오 공개 프로필)
-- ─────────────────────────────────────────────────────────────
create table if not exists career_profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,

  -- 공개 식별자 (포트폴리오 URL slug)
  -- /portfolio/[slug] 로 접근
  slug            text unique not null,         -- 'jskim-dsc' (소문자 영숫자 하이픈)
  display_name    text not null,
  headline        text,                         -- '인도 자동차 부품 공장 GM'
  bio             text,                         -- Markdown
  avatar_url      text,                         -- Supabase Storage URL
  contact_email   text,                         -- 공개용 이메일 (선택)
  linkedin_url    text,
  github_url      text,

  -- 포트폴리오 공개 여부
  is_public       boolean not null default false,

  -- PDF 내보내기용 마지막 생성 시각
  pdf_generated_at timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 6. updated_at 자동 갱신 트리거 (기존 패턴 동일)
-- ─────────────────────────────────────────────────────────────
create or replace function career_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_career_companies_updated_at
  before update on career_companies
  for each row execute function career_set_updated_at();

create trigger trg_career_projects_updated_at
  before update on career_projects
  for each row execute function career_set_updated_at();

create trigger trg_career_achievements_updated_at
  before update on career_achievements
  for each row execute function career_set_updated_at();

create trigger trg_career_profiles_updated_at
  before update on career_profiles
  for each row execute function career_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 7. RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────

-- 7-1. career_companies
alter table career_companies enable row level security;

-- 본인만 CRUD
create policy "career_companies: own CRUD"
  on career_companies for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 공개된 회사는 비로그인도 읽기 가능
create policy "career_companies: public read"
  on career_companies for select
  using (is_public = true);

-- 7-2. career_projects
alter table career_projects enable row level security;

create policy "career_projects: own CRUD"
  on career_projects for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "career_projects: public read"
  on career_projects for select
  using (is_public = true);

-- 7-3. career_achievements
alter table career_achievements enable row level security;

create policy "career_achievements: own CRUD"
  on career_achievements for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "career_achievements: public read"
  on career_achievements for select
  using (is_public = true);

-- 7-4. career_skills
alter table career_skills enable row level security;

create policy "career_skills: own CRUD"
  on career_skills for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "career_skills: public read"
  on career_skills for select
  using (is_public = true);

-- 7-5. career_profiles
alter table career_profiles enable row level security;

create policy "career_profiles: own CRUD"
  on career_profiles for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 공개 프로필은 누구나 읽기 (slug로 접근하는 포트폴리오 페이지)
create policy "career_profiles: public read"
  on career_profiles for select
  using (is_public = true);

-- ─────────────────────────────────────────────────────────────
-- 8. 초기 시드 — DSC Mannur 회사 데이터 (유저 가입 후 수동 실행)
-- ─────────────────────────────────────────────────────────────
-- 아래는 예시. 실제 user_id로 교체 후 실행.
-- insert into career_companies (user_id, name, name_short, country, city, industry, department, title, start_date, is_current, is_public)
-- values (
--   '<AUTH_USER_ID>',
--   'DSC Mannur (P) Ltd.',
--   'DSC Mannur',
--   'India',
--   'Chennai',
--   'Automotive Seat Parts',
--   '생산/기술/보전/생산관리',
--   'Assistant General Manager',
--   '2024-01-01',
--   true,
--   false
-- );
```

---

## 2. 페이지 구조 (Next.js Pages Router)

```
pages/
  career/
    index.js              ← /career        대시보드 (회사 타임라인 + 요약)
    setup.js              ← /career/setup  최초 프로필 설정 (슬러그, 이름, 헤드라인)
    [companyId]/
      index.js            ← /career/[companyId]          회사 상세
      projects/
        index.js          ← /career/[companyId]/projects  프로젝트 목록
        new.js            ← /career/[companyId]/projects/new
        [projectId].js    ← /career/[companyId]/projects/[projectId]
      achievements.js     ← /career/[companyId]/achievements
  portfolio/
    [slug].js             ← /portfolio/[slug]  공개 포트폴리오 (비로그인 접근 가능)
  api/
    career/
      companies.js        ← GET(목록) / POST(생성)
      companies/[id].js   ← GET / PATCH / DELETE
      projects.js         ← GET / POST
      projects/[id].js    ← GET / PATCH / DELETE
      achievements.js     ← GET / POST
      achievements/[id].js
      skills.js           ← GET / POST / DELETE
      profile.js          ← GET / POST / PATCH
      portfolio/[slug].js ← GET (공개, 인증 불필요)
      export-pdf/[userId].js  ← POST (PDF 생성, Phase 2)
```

---

## 3. 페이지별 와이어프레임 (텍스트 기반)

### 3-1. /career — 커리어 대시보드

```
┌────────────────────────────────┐ max-w-480
│ [←] Career Workspace           │ 상단 헤더 (다크 #0f172a)
│      나의 경력 관리             │
├────────────────────────────────┤
│ 경력 요약 카드                  │
│ ┌──────────────────────────┐  │
│ │ 총 경력  N년 M개월        │  │ (start_date 가장 이른 것 기준 계산)
│ │ 회사 수  N곳              │  │
│ │ 프로젝트 N건              │  │
│ │ 성과     N건              │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ [+ 회사 추가]                   │ 우측 상단 버튼
│                                │
│ ── 2026 ──────────────────     │ 연도 구분선
│                                │
│ ┌──────────────────────────┐  │ CompanyCard
│ │ DSC Mannur (P) Ltd.      │  │
│ │ Chennai, India           │  │
│ │ AGM  2024.01 ~ 현재      │  │ is_current → "현재"
│ │ 프로젝트 3건 · 성과 5건   │  │
│ │                  [보기 →] │  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │ (다음 회사, 회색 처리)
│ │ (이전 직장 예시)           │  │
│ │ ...                       │  │
│ └──────────────────────────┘  │
│                                │
│ [포트폴리오 공개 설정 →]        │ 하단 고정 링크
├────────────────────────────────┤
│ [홈][BM][PM][자산][KPI][내정보] │ BottomNav (기존 유지)
└────────────────────────────────┘
```

### 3-2. /career/[companyId] — 회사 상세

```
┌────────────────────────────────┐
│ [←] DSC Mannur                 │ 헤더
│      Chennai · 2024.01~현재    │
├────────────────────────────────┤
│ [탭: 프로젝트] [성과] [정보]    │ 3탭 (기존 BM 탭 패턴 동일)
├────────────────────────────────┤
│ (탭: 프로젝트 선택 시)          │
│                                │
│ [+ 프로젝트 추가]               │
│                                │
│ ┌──────────────────────────┐  │ ProjectCard
│ │ FMS 포털 구축             │  │
│ │ 디지털 · 2025.03~진행중   │  │
│ │ Next.js · Supabase · ...  │  │ 태그 뱃지
│ │ 비용절감 ₩3,200만          │  │ kpi_value
│ │                  [편집 →] │  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ 설비 가동률 개선 프로젝트  │  │
│ │ 개선 · 2025.01~2025.06   │  │
│ │ OEE · 보전 · 생산관리     │  │
│ │ OEE 78% → 83%            │  │
│ │                  [편집 →] │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ (탭: 성과 선택 시)              │
│                                │
│ [+ 성과 추가]                   │
│                                │
│ 2025                           │
│  • 설비 가동률 5% 향상          │ AchievementList 아이템
│    OEE 78% → 83%               │
│  • BM 평균 수리시간 단축         │
│    MTTR 4.2h → 2.1h            │
│                                │
│ 2024                           │
│  • FMS 포털 기획 착수            │
├────────────────────────────────┤
│ (탭: 정보 선택 시)              │
│                                │
│ 회사명      DSC Mannur (P) Ltd. │
│ 국가/도시   India / Chennai     │
│ 산업        Automotive Parts   │
│ 부서        생산/기술/보전       │
│ 직책        AGM                 │
│ 재직기간    2024.01 ~ 현재      │
│                                │
│ [편집] [삭제]                   │
│ 포트폴리오 공개  [ON/OFF 토글]   │
├────────────────────────────────┤
│ [홈][BM][PM][자산][KPI][내정보] │
└────────────────────────────────┘
```

### 3-3. /career/[companyId]/projects/new (또는 /[projectId]) — 프로젝트 폼

```
┌────────────────────────────────┐
│ [←] 프로젝트 추가               │ 헤더
├────────────────────────────────┤
│ 프로젝트명 *                    │
│ [                            ] │
│                                │
│ 카테고리 *                      │
│ [개선 v]                        │ select: 개선/비용절감/품질/안전/디지털/자동화/기타
│                                │
│ 역할                            │
│ [                            ] │
│                                │
│ 기간                            │
│ 시작 [2025-03] 종료 [         ] │ month picker (YYYY-MM)
│ [□] 현재 진행 중                │ 체크 시 종료일 비활성화
│                                │
│ 요약 (포트폴리오 카드 노출)      │
│ [                            ] │ 1줄 텍스트
│                                │
│ 상세 설명                       │
│ [                            ] │ textarea (Markdown)
│ [                            ] │
│                                │
│ 태그                            │
│ [Next.js] [Supabase] [+추가]    │ 인라인 태그 입력 (Enter로 추가)
│                                │
│ 성과 지표 (선택)                 │
│ 지표명  [OEE                 ]  │
│ 이전값  [78%                 ]  │
│ 이후값  [83%                 ]  │
│                                │
│ 포트폴리오 공개   [□]            │
│ 상단 노출 (Featured)  [□]       │
│                                │
│ [취소]           [저장]         │
├────────────────────────────────┤
│ [홈][BM][PM][자산][KPI][내정보] │
└────────────────────────────────┘
```

### 3-4. /portfolio/[slug] — 공개 포트폴리오 (비로그인 접근)

```
┌────────────────────────────────┐  max-w-720 (데스크탑도 고려)
│ [DSC FMS Portal 로고]  [PDF↓]  │ 헤더 (라이트 테마 또는 다크 선택)
├────────────────────────────────┤
│                                │
│    [아바타 사진]                │
│    홍길동                       │
│    인도 자동차 부품 공장 GM      │ headline
│    📧 contact@example.com      │ (공개 이메일)
│    [LinkedIn] [GitHub]         │
│                                │
├────────────────────────────────┤
│ About                          │
│ bio 텍스트 (Markdown 렌더링)    │
├────────────────────────────────┤
│ Skills                         │
│ [Next.js] [Supabase] [Python]  │ SkillBadge 목록
│ [생산관리] [품질경영] [보전]     │ 카테고리별 그룹
├────────────────────────────────┤
│ Experience                     │
│                                │
│ DSC Mannur (P) Ltd.            │ CompanyCard (공개 버전)
│ AGM · 2024.01 ~ 현재           │
│ Chennai, India                 │
│                                │
│   Featured Projects            │
│   ┌────────────────────────┐  │
│   │ FMS 포털 구축           │  │
│   │ 디지털 · 2025.03~진행중  │  │
│   │ 비용절감 ₩3,200만        │  │
│   └────────────────────────┘  │
│                                │
│   Achievements                 │
│   • 설비 가동률 5% 향상         │
│   • MTTR 4.2h → 2.1h          │
│                                │
├────────────────────────────────┤
│ © 2026 DSC FMS Portal          │ 푸터 (BottomNav 없음, 공개 페이지)
└────────────────────────────────┘
```

### 3-5. /career/setup — 최초 프로필 설정

```
┌────────────────────────────────┐
│ 포트폴리오 프로필 설정           │
├────────────────────────────────┤
│ 공개 URL 슬러그 *               │
│ dsc-fms-portal.vercel.app/     │
│ portfolio/ [jskim-dsc        ] │ 소문자 영숫자 하이픈, 중복 실시간 체크
│ [사용 가능]                     │
│                                │
│ 표시 이름 *                     │
│ [홍길동                       ] │
│                                │
│ 헤드라인                        │
│ [인도 자동차 부품 공장 GM      ] │
│                                │
│ 자기소개 (Markdown)             │
│ [                            ] │
│ [                            ] │
│                                │
│ 공개 이메일 (선택)              │
│ [                            ] │
│                                │
│ LinkedIn URL (선택)             │
│ [                            ] │
│                                │
│        [저장하고 시작하기]       │
└────────────────────────────────┘
```

---

## 4. 컴포넌트 구조

```
components/
  career/
    CareerTimeline.js       ← 회사 목록을 연도 기준 타임라인으로 렌더
    CompanyCard.js          ← 회사 카드 (대시보드용 / 포트폴리오용 variant)
    ProjectCard.js          ← 프로젝트 카드 (내부용 / 포트폴리오용 variant)
    ProjectForm.js          ← 프로젝트 추가/편집 폼 (new, [projectId] 공유)
    AchievementList.js      ← 성과 목록 (연도 그룹 + 아이템)
    AchievementForm.js      ← 성과 추가/편집 모달 또는 인라인 폼
    SkillBadge.js           ← 스킬 뱃지 (색상 = 카테고리별)
    SkillManager.js         ← 스킬 추가/삭제 인터페이스
    PublicToggle.js         ← 공개/비공개 토글 버튼 (재사용)
    CareerSummaryCard.js    ← 총 경력 요약 숫자 카드
    CompanyForm.js          ← 회사 추가/편집 폼 (modal 또는 full-page)
    PortfolioHeader.js      ← /portfolio/[slug] 상단 프로필 섹션
    PortfolioExperience.js  ← /portfolio/[slug] Experience 섹션
```

### 컴포넌트별 역할 요약

| 컴포넌트 | 역할 | props 핵심 |
|---|---|---|
| CareerTimeline | 회사 목록을 연도별 그룹, 타임라인 선 렌더 | companies[] |
| CompanyCard | 회사 요약 카드, variant="portfolio"로 공개용 전환 | company, variant |
| ProjectCard | 프로젝트 카드, featured 배지 | project, onEdit |
| ProjectForm | 프로젝트 폼 (create/edit 공유), 태그 인라인 입력 | companyId, initial, onSave |
| AchievementList | 연도 그룹 성과 목록, 인라인 추가 버튼 | achievements[], companyId |
| SkillBadge | 스킬 하나 뱃지, 색상 카테고리별 자동 | skill, removable |
| SkillManager | 스킬 전체 관리 UI (추가/삭제) | skills[], onChange |
| PublicToggle | ON/OFF 토글 (즉시 PATCH) | value, onToggle, loading |
| CareerSummaryCard | 숫자 요약 (총 경력, 회사 수 등) | companies[], projects[] |
| CompanyForm | 회사 추가/편집 폼 | initial, onSave, onDelete |
| PortfolioHeader | 아바타+이름+헤드라인+링크 | profile |
| PortfolioExperience | 회사+프로젝트+성과 공개 뷰 | companies[], projects[], achievements[] |

---

## 5. API Routes 목록

모든 인증 필요 API는 Supabase Auth 세션 쿠키로 검증.
`/api/career/portfolio/*`는 인증 불필요 (공개).

### 인증 필요 (본인 데이터 CRUD)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/career/companies | 내 회사 목록 (+ 각 사 프로젝트/성과 카운트) |
| POST | /api/career/companies | 회사 생성 |
| GET | /api/career/companies/[id] | 회사 상세 |
| PATCH | /api/career/companies/[id] | 회사 수정 (is_public 토글 포함) |
| DELETE | /api/career/companies/[id] | 회사 삭제 (cascade) |
| GET | /api/career/projects?companyId= | 특정 회사의 프로젝트 목록 |
| POST | /api/career/projects | 프로젝트 생성 |
| GET | /api/career/projects/[id] | 프로젝트 상세 |
| PATCH | /api/career/projects/[id] | 프로젝트 수정 |
| DELETE | /api/career/projects/[id] | 프로젝트 삭제 |
| GET | /api/career/achievements?companyId= | 회사별 성과 목록 |
| POST | /api/career/achievements | 성과 생성 |
| PATCH | /api/career/achievements/[id] | 성과 수정 |
| DELETE | /api/career/achievements/[id] | 성과 삭제 |
| GET | /api/career/skills | 내 스킬 목록 |
| POST | /api/career/skills | 스킬 추가 |
| DELETE | /api/career/skills/[id] | 스킬 삭제 |
| GET | /api/career/profile | 내 포트폴리오 프로필 |
| POST | /api/career/profile | 프로필 최초 생성 |
| PATCH | /api/career/profile | 프로필 수정 |
| GET | /api/career/profile/check-slug?slug= | 슬러그 중복 체크 |

### 공개 (인증 불필요)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/career/portfolio/[slug] | 공개 포트폴리오 전체 데이터 (프로필+회사+프로젝트+성과+스킬) |

### Phase 2 (선택)

| Method | Path | 설명 |
|---|---|---|
| POST | /api/career/export-pdf/[userId] | HTML→PDF 생성, Supabase Storage 저장 후 URL 반환 |

---

## 6. 사용자 흐름

### 6-1. 최초 설정 흐름

```
/career 접근
  → career_profiles 레코드 없으면 /career/setup 리다이렉트
  → 슬러그/이름/헤드라인 입력
  → 저장 → /career 대시보드
  → "회사 추가" 버튼 클릭
  → CompanyForm 표시 (DSC Mannur 정보 입력)
  → 저장 → 대시보드에 CompanyCard 표시
```

### 6-2. 프로젝트 등록 흐름

```
/career/[companyId] 접근 → 프로젝트 탭
  → [+ 프로젝트 추가] 클릭
  → /career/[companyId]/projects/new 이동
  → 폼 입력 (제목, 카테고리, 기간, 태그, 성과 지표)
  → [저장] → POST /api/career/projects
  → 성공 시 /career/[companyId] 프로젝트 탭으로 복귀
  → ProjectCard 목록에 즉시 반영 (mutate 또는 router.push + refetch)
```

### 6-3. 포트폴리오 공개 흐름

```
/career/[companyId] → 정보 탭 → "포트폴리오 공개" 토글 ON
  → PATCH /api/career/companies/[id] { is_public: true }
  → 대시보드로 이동 → "포트폴리오 보기" 링크 표시
  → /portfolio/[slug] 접근 (비로그인 가능)
  → 공개된 회사·프로젝트·성과·스킬만 렌더링
```

### 6-4. PDF 내보내기 흐름 (Phase 2)

```
/portfolio/[slug] → [PDF 다운로드] 버튼 클릭
  → POST /api/career/export-pdf/[userId]
  → 서버에서 HTML→PDF 변환 (puppeteer 또는 @react-pdf/renderer)
  → Supabase Storage career-pdfs 버킷에 업로드
  → 서명된 URL 반환 → 브라우저 다운로드
```

---

## 7. 엣지 케이스 정의

| 상황 | 처리 방법 |
|---|---|
| career_profiles 레코드 없음 (최초 접근) | /career/setup 자동 리다이렉트 |
| 슬러그 중복 | check-slug API로 실시간 체크, 저장 버튼 비활성화 |
| 슬러그에 한글/대문자 입력 | 자동 소문자 변환 + 허용 문자(a-z0-9-) 필터링 |
| 비로그인으로 /career 접근 | /login 리다이렉트 (기존 패턴 동일) |
| 비로그인으로 /portfolio/[slug] 접근 | 허용 (공개 페이지), is_public=false면 404 |
| 존재하지 않는 슬러그 /portfolio/xxx | 404 페이지 |
| 회사 삭제 시 연결된 프로젝트/성과 | DB cascade delete → confirm 다이얼로그 필수 |
| 프로젝트 삭제 시 연결된 성과 | project_id SET NULL (성과는 남음, project 연결만 해제) |
| is_public=true인 회사의 is_public=false인 프로젝트 | 포트폴리오에 프로젝트 미노출 (회사만 표시) |
| 회사 is_public=false로 변경 | 포트폴리오에서 해당 회사 즉시 숨김 |
| 태그 입력 빈 문자열 | 저장 시 필터링하여 배열에 미포함 |
| PDF 생성 실패 | 에러 toast 표시, 재시도 버튼 |
| 포트폴리오 페이지 로딩 중 | 스켈레톤 UI (회사·프로젝트 카드 형태) |
| 모바일에서 포트폴리오 접근 | 기존 모바일 퍼스트 레이아웃, BottomNav 없음 |

---

## 8. BottomNav 수정 사항

기존 6개 슬롯 중 "내정보" 슬롯이 현재 /login으로 연결되어 있음.
커리어 모듈 추가 후 /career로 변경하는 것이 적절.

```
현재: { href: '/login', label: '내정보', match: ... }
변경: { href: '/career', label: '내정보', match: (p) => p === '/career' || p.startsWith('/career/') }
```

단, /login 페이지는 인증 처리용으로 유지. BottomNav의 "내정보"만 /career로 변경.

---

## 9. 구현 우선순위

### Phase 1 — MVP (핵심 기능)

목표: 회사 등록 → 프로젝트 기록 → 내부 조회까지 동작

| 순서 | 작업 | 파일 | 예상 난이도 |
|---|---|---|---|
| 1 | DB 마이그레이션 | db/12_career_module.sql | 낮음 |
| 2 | API: companies CRUD | api/career/companies.js | 낮음 |
| 3 | /career/setup | pages/career/setup.js | 낮음 |
| 4 | /career (대시보드) | pages/career/index.js | 중간 |
| 5 | CompanyCard, CareerTimeline | components/career/ | 낮음 |
| 6 | CompanyForm (추가/편집) | components/career/CompanyForm.js | 중간 |
| 7 | API: projects CRUD | api/career/projects.js | 낮음 |
| 8 | /career/[companyId] (3탭) | pages/career/[companyId]/index.js | 중간 |
| 9 | ProjectCard, ProjectForm | components/career/ | 중간 |
| 10 | /career/[companyId]/projects/new + [projectId] | pages/career/[companyId]/projects/ | 중간 |
| 11 | API: achievements CRUD | api/career/achievements.js | 낮음 |
| 12 | AchievementList, AchievementForm | components/career/ | 중간 |
| 13 | BottomNav "내정보" 경로 변경 | components/BottomNav.js | 낮음 |

### Phase 2 — 포트폴리오 공개 + 스킬

목표: 외부 공개 포트폴리오 페이지 + 스킬 관리

| 순서 | 작업 | 파일 | 예상 난이도 |
|---|---|---|---|
| 1 | API: profile CRUD + check-slug | api/career/profile.js | 낮음 |
| 2 | API: portfolio (공개) | api/career/portfolio/[slug].js | 낮음 |
| 3 | /portfolio/[slug] (공개 포트폴리오) | pages/portfolio/[slug].js | 높음 |
| 4 | PortfolioHeader, PortfolioExperience | components/career/ | 중간 |
| 5 | API: skills CRUD | api/career/skills.js | 낮음 |
| 6 | SkillBadge, SkillManager | components/career/ | 낮음 |
| 7 | PublicToggle (회사/프로젝트 즉시 공개 토글) | components/career/PublicToggle.js | 낮음 |
| 8 | CareerSummaryCard | components/career/CareerSummaryCard.js | 낮음 |

### Phase 3 — 확장 (선택)

| 작업 | 설명 |
|---|---|
| PDF 내보내기 | @react-pdf/renderer 또는 puppeteer 활용 |
| FMS 연계 | bm_events/assets 참조 → 프로젝트 자동 연결 제안 |
| 다국어 | 포트폴리오 페이지 EN/KO 전환 |
| 아바타 업로드 | Supabase Storage career-avatars 버킷 |
| 이력서 템플릿 | 회사별 이력서 PDF 양식 선택 |

---

## 10. 기술 결정 사항 (웹개발자 참고)

### 상태 관리

기존 포털과 동일하게 useState + Supabase 클라이언트 직접 호출 방식 사용.
SWR/React Query 미도입 (기존 패턴 유지).

### 스타일

기존 인라인 스타일 방식 유지 (Tailwind 클래스 미사용).
다크 테마 기본 (#0f172a 배경, #1e293b 카드, #ef4444 강조색).
포트폴리오 공개 페이지는 라이트 테마도 고려 가능하지만, 우선 다크 통일.

### Supabase 클라이언트

```js
// lib/supabase.js (기존 파일 그대로 사용)
import { supabase } from '../../lib/supabase';
```

### 날짜 처리

start_date, end_date는 DB에 date 타입 (YYYY-MM-DD).
UI 입력은 month picker (YYYY-MM) → day=01 로 저장.
경력 계산: date-fns 없이 `Math.floor((now - start) / (1000*60*60*24*365))` 로 단순 계산.

### 슬러그 유효성

```js
// 슬러그 정규화 함수 (컴포넌트에서 공유)
const normalizeSlug = (v) =>
  v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
```

---

## 11. Supabase Storage 버킷 추가 필요

| 버킷명 | 용도 | 공개 여부 |
|---|---|---|
| career-avatars | 포트폴리오 아바타 사진 | 공개 (public) |
| career-pdfs | PDF 내보내기 파일 | 비공개 (signed URL) |

기존 사용 버킷: `asset-photos` (기존 자산 사진)

---

*설계서 끝. 궁금한 사항은 플레너에게 문의. 웹개발자는 Phase 1 → Phase 2 순서로 구현.*
