# Dashboard-P2 Phase 3: UI 설계 문서

**프로젝트명:** DSC FMS CEO 통합 대시보드  
**단계:** Phase 3 (UI 개발)  
**작성일:** 2026-05-26  
**상태:** 설계 확정  
**진행자:** Web-Builder (설계 완료 후 UI 개발)

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [Phase 3 범위](#phase-3-범위)
3. [화면 구조 & 사용자 흐름](#화면-구조--사용자-흐름)
4. [DB 스키마 (Phase 2 결과)](#db-스키마-phase-2-결과)
5. [페이지 설계](#페이지-설계)
6. [컴포넌트 아키텍처](#컴포넌트-아키텍처)
7. [데이터 흐름 & API](#데이터-흐름--api)
8. [UI/UX 토큰 & 스타일](#uiux-토큰--스타일)
9. [엣지 케이스](#엣지-케이스)
10. [구현 우선순위 & 로드맵](#구현-우선순위--로드맵)

---

## 프로젝트 개요

### 목적

CEO가 4개 동시 진행 프로젝트(Asset Master, Travel Management, Discord Bot, PM Module)의 실시간 진행 현황을 한눈에 모니터링할 수 있는 웹 UI.

### 핵심 요구사항

- **실시간 모니터링**: 5분마다 자동 갱신
- **다중 뷰**: 홈 > 프로젝트 목록 > 프로젝트 상세 > 완료 이력
- **반응형 디자인**: 모바일(iPad), 태블릿, 데스크톱 지원
- **성능**: ISR(증분 정적 재생성) 활용, 초기 로드 <2초
- **인증**: Supabase JWT 기반

### 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| UI 라이브러리 | React 18 + TypeScript |
| 스타일링 | CSS Modules (기존 패턴) |
| 차트 | Recharts v2.x |
| 백엔드 | Supabase PostgreSQL |
| 캐싱 | ISR + SWR(클라이언트) |
| 상태관리 | React Context + Server Components |

---

## Phase 3 범위

### 신규 페이지

| 경로 | 역할 | 우선순위 |
|------|------|--------|
| `/dashboard` | CEO 홈 (핵심 KPI, 프로젝트 요약) | P0 |
| `/dashboard/team-projects` | 프로젝트 목록 (필터, 정렬) | P1 |
| `/dashboard/team-projects/[id]` | 프로젝트 상세 (마일스톤 타임라인, 이력) | P1 |
| `/dashboard/completion-history` | 완료 이력 대시보드 (월별, 분기별 통계) | P2 |

### 신규 컴포넌트

| 컴포넌트 | 역할 | 재사용성 |
|--------|------|--------|
| `<ProjectCard>` | 프로젝트 카드 (진행률, 상태 배지) | 높음 |
| `<MilestoneTimeline>` | 마일스톤 타임라인 (계획 vs 실제) | 중간 |
| `<ProgressBar>` | 진행률 바 (색상 토큰 포함) | 높음 |
| `<StatusBadge>` | 상태 배지 (계획중, 진행중, 완료, 지연) | 높음 |
| `<DashboardSummary>` | CEO 홈 요약 카드 | 낮음 |
| `<ProjectCardGrid>` | 프로젝트 그리드 레이아웃 | 중간 |
| `<MilestoneGauge>` | 마일스톤 진행률 게이지 (현재/다음 분기) | 중간 |
| `<TeamPerformanceChart>` | 팀 성과 차트 (월별 완료 수) | 중간 |
| `<ProjectList>` | 프로젝트 목록 (필터/정렬 적용) | 낮음 |
| `<FilterBar>` | 필터 바 (팀별, 상태별) | 낮음 |
| `<SortMenu>` | 정렬 메뉴 | 낮음 |
| `<ProjectHeader>` | 프로젝트 상세 헤더 | 낮음 |
| `<CompletionHistoryChart>` | 완료 이력 차트 (월별 통계) | 중간 |
| `<TeamContributors>` | 팀원 역할 & 기여도 표시 | 낮음 |
| `<CompletionStatistics>` | 완료 통계 (분기별, 월별) | 중간 |
| `<QuarterlyComparison>` | 분기별 성과 비교 | 낮음 |
| `<TeamPerformanceComparison>` | 팀별 성과 비교 차트 | 낮음 |

### 신규 API 라우트

| 엔드포인트 | 메서드 | 목적 | 캐시 |
|-----------|--------|------|------|
| `/api/dashboard/projects/list` | GET | 프로젝트 포트폴리오 (v_team_project_portfolio) | ISR 10분 |
| `/api/dashboard/projects/[id]` | GET | 프로젝트 상세 + 마일스톤 + 이력 | ISR 5분 |
| `/api/dashboard/milestones/[projectId]` | GET | 마일스톤 목록 | ISR 5분 |
| `/api/dashboard/completion-history/[projectId]` | GET | 프로젝트 완료 이력 | ISR 5분 |
| `/api/dashboard/completion-history` | GET | 전체 완료 이력 (분기별 필터) | ISR 1시간 |
| `/api/dashboard/stats/quarterly` | GET | 분기별 성과 통계 | ISR 1시간 |
| `/api/dashboard/stats/team-comparison` | GET | 팀별 성과 비교 | ISR 1시간 |

---

## 화면 구조 & 사용자 흐름

### 사용자 페르소나

**CEO (나경태)**
- 목표: 4개 프로젝트 동시 진행 현황 모니터링
- 관심사: 진행률, 지연 항목, 팀 신뢰도, 완료 속도
- 사용 빈도: 매일 3회 (09:00, 14:00, 18:00)
- 기기: 데스크톱 (1440px), iPad (768px)

### 사용자 흐름 (Happy Path)

```
[앱 진입]
  ↓
[로그인 확인]
  ├─ 인증됨 → [대시보드 홈]
  └─ 미인증 → [로그인 페이지]
  
[대시보드 홈]
  ├─ 팀 신뢰도 요약 (96%)
  ├─ 월별 완료율 (72%)
  ├─ 프로젝트별 진행률 카드 4개
  │  ├─ 마우스오버 → [프로젝트 상세로 이동]
  │  └─ 클릭 → [프로젝트 상세 페이지]
  ├─ 다음 분기 마일스톤 진행률
  └─ 팀 성과 차트 (월별 완료 수)

[프로젝트 목록 페이지]
  ├─ 필터 바 (팀별, 상태별)
  ├─ 정렬 메뉴 (마일스톤 임박순)
  ├─ 프로젝트 카드 목록 (진행중 탭)
  │  └─ 각 카드에 진행률, 상태, 마일스톤 표시
  └─ 완료 탭 (완료된 프로젝트)

[프로젝트 상세 페이지]
  ├─ 프로젝트 헤더 (이름, 팀, 상태, 설명)
  ├─ 마일스톤 타임라인
  │  └─ 계획(파란색) vs 실제(초록색) 비교
  ├─ 완료 이력 (월별 통계, 바 차트)
  └─ 팀원 역할 (기여도 퍼센트)

[완료 이력 대시보드]
  ├─ 월별 완료 프로젝트 수 (라인 차트)
  ├─ 분기별 성과 요약 카드
  └─ 팀별 성과 비교 차트
```

### 사용 시나리오

**시나리오 1: 아침 체크포인트 (09:00)**
1. CEO가 대시보드 홈 방문
2. "팀 신뢰도 96%" 확인 → 정상
3. "Discord-P1 100% 완료" 확인 → 기분 좋음
4. "Travel-P2 65%, 다음 단계 API 완료 ETA 18:00" 확인
5. "Asset-P2 40%, 평가 대기" 확인 → 병목 없음
6. Discord 공지채널에 간단한 메모: "All on track ✅"

**시나리오 2: 지연 신호 (특정 프로젝트 마일스톤 초과)**
1. CEO가 프로젝트 상세 페이지 방문
2. "Asset-P2 > Phase 2 API 구현" 마일스톤 확인
3. 계획 완료일: 2026-05-29, 현재 예상: 2026-05-31 (+2일)
4. "지연 원인: DB 최적화 병목"이라는 노트 확인
5. 팀원에게 Telegram으로 확인: "추가 리소스 필요한가?"

**시나리오 3: 월 말 성과 검토**
1. CEO가 완료 이력 대시보드 방문
2. 5월 완료 프로젝트: 3개 (Discord P1, Backup P2, Audit System)
3. 분기별 비교: Q2 목표 8개 vs 현재 완료 3개 → 진행 중 5개
4. 팀별 성과: 웹빌더팀 2개, 데이터팀 1개
5. 다음달 목표: 5개 완료

---

## DB 스키마 (Phase 2 결과)

### 테이블 구조 (db/36_team_dashboard_phase2.sql)

#### 1. team_projects (확장)

```sql
CREATE TABLE team_projects (
  id                UUID PRIMARY KEY,
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  status            VARCHAR(20) NOT NULL,  -- 'planning' | 'active' | 'completed' | 'on_hold'
  priority          VARCHAR(20),            -- 'critical' | 'high' | 'medium' | 'low'
  progress_percent  INT DEFAULT 0,         -- 0-100
  start_date        DATE,                  -- 신규: 명시적 시작일
  target_date       DATE,                  -- 신규: 목표 완료일
  actual_date       DATE,                  -- 신규: 실제 완료일
  owner_id          UUID REFERENCES team_members(id),
  assignee_id       UUID REFERENCES team_members(id),  -- 신규: 담당자
  started_at        TIMESTAMP WITH TIME ZONE,
  completed_at      TIMESTAMP WITH TIME ZONE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. team_project_milestones (신규)

```sql
CREATE TABLE team_project_milestones (
  id           UUID PRIMARY KEY,
  project_id   UUID NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,    -- 마일스톤명 (e.g., "Phase 2 API 설계")
  sequence     INT NOT NULL DEFAULT 0,   -- 순서
  target_date  DATE,                     -- 목표 완료일
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. team_project_completion_history (신규)

```sql
CREATE TABLE team_project_completion_history (
  id               UUID PRIMARY KEY,
  project_id       UUID NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
  milestone_id     UUID REFERENCES team_project_milestones(id) ON DELETE SET NULL,
  task_description VARCHAR(255) NOT NULL,  -- 완료 작업명
  completed_by     UUID REFERENCES team_members(id) ON DELETE SET NULL,
  completed_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status           VARCHAR(20) DEFAULT 'completed',  -- 'completed' | 'reviewed' | 'deployed'
  notes            TEXT,                   -- 비고 (지연 원인, 특이사항 등)
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. v_team_project_portfolio (신규 뷰)

```sql
CREATE VIEW v_team_project_portfolio AS
SELECT
  p.id,
  p.title,
  p.description,
  p.status,
  p.priority,
  p.progress_percent,
  p.start_date,
  p.target_date,
  p.actual_date,
  p.assignee_id,
  tm.name AS assignee_name,
  tm.role AS assignee_role,
  tm.avatar_url AS assignee_avatar_url,
  CASE
    WHEN p.progress_percent >= 80 THEN 'green'
    WHEN p.progress_percent >= 50 THEN 'yellow'
    WHEN p.progress_percent >= 20 THEN 'orange'
    ELSE 'red'
  END AS color_band,
  CASE
    WHEN p.status = 'completed' THEN FALSE
    WHEN p.target_date IS NOT NULL AND p.target_date < CURRENT_DATE THEN TRUE
    ELSE FALSE
  END AS is_overdue,
  (SELECT COUNT(*) FROM team_project_completion_history h WHERE h.project_id = p.id) 
    AS completion_history_count,
  p.created_at,
  p.updated_at
FROM team_projects p
LEFT JOIN team_members tm ON tm.id = p.assignee_id;
```

### 데이터 흐름

```
[사용자 액션]
  ↓
[Next.js API Route] (/api/dashboard/...)
  ↓
[Supabase Query] (SELECT ... FROM v_team_project_portfolio)
  ↓
[ISR 캐시] (10분 또는 5분)
  ↓
[React Component] (ProjectCard, MilestoneTimeline, ...)
  ↓
[브라우저 렌더링]
  ↓
[5분마다 자동 갱신] (SWR)
```

---

## 페이지 설계

### 1️⃣ CEO 대시보드 홈 (`/dashboard`)

#### 목적
CEO가 4개 프로젝트의 전체 현황을 한눈에 파악하고, 문제 있는 영역을 즉시 발견.

#### 화면 구성

```
┌─────────────────────────────────────────────────────────────────┐
│ DSC FMS CEO Dashboard                                    🔄 ⚙️  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┬──────────────┬──────────────┬─────────────────┐
│ 팀 신뢰도       │ 월 완료율    │ CEO 대기사항 │ 마지막 갱신      │
│   96%           │   72%        │    0개       │  14:27 KST      │
│ 📈 +2%          │ 📈 +18%      │  (정상)      │  5분 전 자동갱신 │
└─────────────────┴──────────────┴──────────────┴─────────────────┘

[프로젝트 포트폴리오 섹션]
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│ Discord-P1      │ Travel-P2    │ Asset-P2     │ Dashboard-P2 │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ 100% ✅         │ 65% 🟡       │ 40% 🟡       │ 35% 🟡       │
│ 상태: 완료      │ 상태: 진행중 │ 상태: 진행중 │ 상태: 진행중 │
│ 마일스톤 3/3    │ 마일스톤 1/3 │ 마일스톤 1/4 │ 마일스톤 1/4 │
│ 담당자: Web#1   │ 담당자: Web#2│ 담당자: Data │ 담당자: Web#3│
│ ETA: 완료됨 ✅  │ ETA: 05-30   │ ETA: 06-01   │ ETA: 06-05   │
└─────────────────┴──────────────┴──────────────┴──────────────┘

[마일스톤 진행률 - 이번분기 vs 다음분기]
이번분기 (Q2)                다음분기 (Q3)
████████░░░░░░░░ 50%         ░░░░░░░░░░░░░░░░ 0%

완료: 2개 / 4개 목표         완료: 0개 / 5개 목표

[팀 성과 차트 - 월별 완료 프로젝트 수]
5월    6월    7월
|█|    |███|  |░░|
1개    3개(예상) 

[프로젝트 목록 바로가기]
┌──────────────────────────────────┐
│ 모든 프로젝트 보기 →             │
│ 완료 이력 대시보드 →             │
└──────────────────────────────────┘
```

#### 주요 정보 요소

| 항목 | 소스 DB | 계산 방식 | 갱신 빈도 |
|------|--------|--------|--------|
| 팀 신뢰도 | external (Evaluator) | 규칙 기반 | 1시간 |
| 월 완료율 | v_team_project_portfolio | COUNT(*) / 월 목표 | 10분 |
| CEO 대기사항 | team_project_completion_history | WHERE status='pending' | 5분 |
| 프로젝트 진행률 | v_team_project_portfolio.progress_percent | 현장 입력 | 5분 |
| 마일스톤 진행률 | team_project_milestones | COUNT(completed=TRUE) | 5분 |
| 팀 성과 차트 | team_project_completion_history | GROUP BY MONTH | 1시간 |

#### 반응형 레이아웃

| 기기 | 레이아웃 | 변경사항 |
|------|--------|--------|
| 데스크톱 (1440px+) | 4열 그리드 | 모든 정보 한눈에 |
| 태블릿 (768-1440px) | 2열 그리드 | 프로젝트 카드 2x2 |
| 모바일 (< 768px) | 1열 | 세로 스크롤, 확대 가능 |

#### 기술 스택

- **컴포넌트**: DashboardSummary, ProjectCardGrid, MilestoneGauge, TeamPerformanceChart
- **데이터 소스**: `/api/dashboard/projects/list`, `/api/dashboard/stats/quarterly`
- **캐싱**: ISR 10분 + SWR(클라이언트 5분 폴링)
- **차트**: Recharts (BarChart, LineChart)

---

### 2️⃣ 팀 프로젝트 목록 (`/dashboard/team-projects`)

#### 목적
프로젝트 목록을 팀별/상태별로 필터링하고, 마일스톤 임박순으로 우선 처리.

#### 화면 구성

```
┌──────────────────────────────────────────────────────────┐
│ 프로젝트 관리                    🔄 필터 정렬  새 프로젝트 │
└──────────────────────────────────────────────────────────┘

[필터 바]
팀별: [모두 ▼] | 상태: [모두 ▼] | 정렬: [마일스톤 임박순 ▼]

[탭 네비게이션]
┌──────────────────────────────────────────────────────────┐
│ 진행중 (3)     │ 완료 (1)     │ 지연중 (0)   │ 보류 (0)  │
└──────────────────────────────────────────────────────────┘

[프로젝트 카드 목록 - 진행중 탭]

┌─────────────────────────────────────────────────────────┐
│ Discord-P1                                    2026-05-27 │
├─────────────────────────────────────────────────────────┤
│ 상태: ✅ 완료  |  팀: Web-Builder  |  담당자: Web#1     │
│ ████████████████████ 100%                               │
│ 마일스톤: 3/3 완료  |  다음: 배포 (ETA 2026-05-27)     │
│ 마지막 갱신: 2026-05-26 14:27                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Travel-P2                                    2026-05-30 │
├─────────────────────────────────────────────────────────┤
│ 상태: 🟡 진행중  |  팀: Web-Builder  |  담당자: Web#2   │
│ ███████████░░░░░░░░░░ 65%                              │
│ 마일스톤: 2/3 완료  |  다음: UI 개발 (ETA 2026-05-30)  │
│ 경고: 지연 1일 (UI 개발 지연)                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Asset-P2                                    2026-06-01 │
├─────────────────────────────────────────────────────────┤
│ 상태: 🟡 진행중  |  팀: Data-Team  |  담당자: Data#1   │
│ ████░░░░░░░░░░░░░░░░ 40%                              │
│ 마일스톤: 1/4 완료  |  다음: API 평가 (ETA 2026-06-01)│
│ 정상                                                    │
└─────────────────────────────────────────────────────────┘

[페이지네이션 또는 무한 스크롤]
```

#### 필터 & 정렬

```
필터:
- 팀별: 모두 | Web-Builder | Data-Team | QA-Team
- 상태: 모두 | planning | active | on_hold | completed

정렬:
- 마일스톤 임박순 (기본)
- 진행률 높은순
- 최근 갱신순
- 팀명순
```

#### 반응형 레이아웃

| 기기 | 레이아웃 |
|------|--------|
| 데스크톱 | 1열 카드 리스트 (full width) |
| 태블릿 | 1열 카드 리스트 |
| 모바일 | 1열 컴팩트 카드 |

#### 기술 스택

- **컴포넌트**: ProjectList, FilterBar, SortMenu
- **데이터 소스**: `/api/dashboard/projects/list`
- **캐싱**: ISR 10분 + SWR
- **상태관리**: React Query (필터/정렬 상태)

---

### 3️⃣ 프로젝트 상세 (`/dashboard/team-projects/[id]`)

#### 목적
프로젝트의 마일스톤, 완료 이력, 팀원 기여도를 상세히 조회.

#### 화면 구성

```
┌──────────────────────────────────────────────────────────┐
│ ← Asset-P2: 506개 자산 일일 관리 자동화  🔄 편집        │
└──────────────────────────────────────────────────────────┘

[프로젝트 헤더]
┌──────────────────────────────────────────────────────────┐
│ 상태: 🟡 진행중  |  팀: Data-Team  |  우선순위: 높음     │
│ 담당자: Data#1 (avatar) | 소유자: Data-Lead             │
│ 설명: 506개 자산의 일일 유지보수 현황을 자동으로 관리   │
│        하고 예방 정비 일정을 수립하는 자동화 시스템      │
├──────────────────────────────────────────────────────────┤
│ 시작: 2026-05-20  |  목표: 2026-06-15  |  현재: ?       │
│ 진행률: ████░░░░░░░░░░░░░░░░ 40%                       │
└──────────────────────────────────────────────────────────┘

[마일스톤 타임라인]
┌──────────────────────────────────────────────────────────┐
│ 마일스톤 진행 (1/4 완료)                                 │
├──────────────────────────────────────────────────────────┤
│ 
│ 2026-05-25  2026-05-29  2026-06-05  2026-06-15
│    ✅          🟡           ⏳          ⏳
│ Phase 2   Phase 2   API #5-8  평가 & 배포
│ API 설계  UI 계획   구현      
│ 완료      진행중    대기      대기
│
│ 범례: 파란색(계획) ━━━━━  초록색(실제) ━━━━━
│       ✅(완료)  🟡(진행중)  ⏳(대기)
│
└──────────────────────────────────────────────────────────┘

[완료 이력 차트 - 월별 통계]
5월(3건)  6월(예상 5건)
|███|     |██░░░|
Completed  Target

완료 이력 상세:
- 2026-05-22 14:35 | Phase 2 API 설계 완료 | Data#1 | 완료
  노트: 16개 엔드포인트 사양 확정
- 2026-05-24 10:20 | Phase 2 UI 계획 완료 | Data#1 | 검수
  노트: CEO 피드백 반영

[팀원 역할 & 기여도]
┌──────────────────────────┐
│ 담당자: Data#1 (100%)    │
│ - Phase 2 API 설계       │
│ - Phase 2 UI 계획        │
│                          │
│ 협력자: QA#1 (30%)       │
│ - 테스트 계획            │
│                          │
│ 협력자: Web#1 (20%)      │
│ - UI 프로토타입          │
└──────────────────────────┘

[하단 액션 버튼]
[마일스톤 추가] [완료 기록] [프로젝트 편집]
```

#### 데이터 소스

| 영역 | 테이블 | 쿼리 |
|------|--------|------|
| 헤더 | team_projects | SELECT * WHERE id=? |
| 마일스톤 | team_project_milestones | SELECT * WHERE project_id=? ORDER BY sequence |
| 완료 이력 | team_project_completion_history | SELECT * WHERE project_id=? ORDER BY completed_at DESC |
| 팀원 기여도 | team_members + team_project_completion_history | JOIN 통계 |

#### 기술 스택

- **컴포넌트**: ProjectHeader, MilestoneTimeline, CompletionHistoryChart, TeamContributors
- **데이터 소스**: `/api/dashboard/projects/[id]`, `/api/dashboard/milestones/[projectId]`
- **캐싱**: ISR 5분 + SWR
- **차트**: Recharts BarChart

---

### 4️⃣ 완료 이력 대시보드 (`/dashboard/completion-history`)

#### 목적
월별, 분기별, 팀별 완료 현황을 종합 분석하고 성과 추세를 파악.

#### 화면 구성

```
┌──────────────────────────────────────────────────────────┐
│ 완료 이력 대시보드                         🔄 분기 선택  │
└──────────────────────────────────────────────────────────┘

[시간 범위 선택]
분기: [Q2 2026 ▼] | 월: [5월 ▼] | 기간: [2026-05-01 ~ 2026-05-31]

[분기별 성과 요약]
┌─────────────────────────────────────────────────────────┐
│ Q2 2026 (4월~6월) 성과                                 │
├─────────────────────────────────────────────────────────┤
│ 목표: 8개 프로젝트 완료  |  현황: 3개 완료  |  진행 5개 │
│ 달성률: 37.5% → 목표: 100% (2026-06-30까지)            │
└─────────────────────────────────────────────────────────┘

[월별 완료 프로젝트 수 - 라인 차트]
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  5 ─                          ┌─                        │
│  4 ─                ┌───      │ ┌─                      │
│  3 ─    ┌─────────┘          │ │ ┌─ 예상              │
│  2 ─ ┌─┘                     │ │ │                     │
│  1 ─┘                        │ │ │                     │
│    4월   5월    6월   7월     │ │ │                     │
│    1개   3개    5개   예상    │ │ │                     │
│         (진행)  (예상) 7개    │ │ │                     │
│                                                          │
└──────────────────────────────────────────────────────────┘

[팀별 성과 비교 - 그룹 바 차트]
┌──────────────────────────────────────────────────────────┐
│ 팀별 완료 프로젝트 수 (Q2)                               │
├──────────────────────────────────────────────────────────┤
│ Web-Builder: ██████ 3개                                  │
│ Data-Team:   ██ 1개                                      │
│ QA-Team:     █ 0개 (예정 1개)                            │
└──────────────────────────────────────────────────────────┘

[월별 완료 상세]
┌──────────────────────────────────────────────────────────┐
│ 5월 완료 프로젝트 (3개)                                   │
├──────────────────────────────────────────────────────────┤
│ 1. Discord-P1 (완료)  | 2026-05-27 | Web-Builder       │
│ 2. Backup-P2 (완료)   | 2026-05-25 | Web-Builder       │
│ 3. Audit-System (검수)| 2026-05-26 | QA-Team          │
│                                                          │
│ 6월 예상 완료 (5개)                                      │
├──────────────────────────────────────────────────────────┤
│ 1. Dashboard-P2 (진행중 35%)  | ETA 2026-06-05        │
│ 2. Asset-P2 (진행중 40%)      | ETA 2026-06-15        │
│ 3. Travel-P2 (진행중 65%)     | ETA 2026-05-30        │
│ 4. PM-Module (설계 중)        | ETA 2026-06-10        │
│ 5. [예정 프로젝트] (계획중)   | ETA 2026-06-30        │
└──────────────────────────────────────────────────────────┘
```

#### 데이터 소스

| 영역 | 테이블 | 쿼리 |
|------|--------|------|
| 분기별 요약 | team_projects + team_project_completion_history | GROUP BY QUARTER |
| 월별 차트 | team_project_completion_history | GROUP BY MONTH ORDER BY completed_at |
| 팀별 비교 | team_members + team_project_completion_history | GROUP BY assignee_id |

#### 기술 스택

- **컴포넌트**: CompletionStatistics, QuarterlyComparison, TeamPerformanceComparison
- **데이터 소스**: `/api/dashboard/completion-history`, `/api/dashboard/stats/quarterly`, `/api/dashboard/stats/team-comparison`
- **캐싱**: ISR 1시간 (정적 데이터)
- **차트**: Recharts (LineChart, BarChart)

---

## 컴포넌트 아키텍처

### 컴포넌트 트리

```
app/dashboard/
├── page.tsx                           [CEO 홈]
│   └── components/
│       ├── DashboardSummary.tsx       (요약 카드 4개)
│       ├── ProjectCardGrid.tsx        (프로젝트 포트폴리오)
│       │   └── ProjectCard.tsx        (재사용 가능)
│       ├── MilestoneGauge.tsx         (마일스톤 게이지)
│       └── TeamPerformanceChart.tsx   (팀 성과 차트)
│
├── team-projects/
│   ├── page.tsx                       [프로젝트 목록]
│   │   └── components/
│   │       ├── FilterBar.tsx          (필터 UI)
│   │       ├── SortMenu.tsx           (정렬 메뉴)
│   │       └── ProjectList.tsx        (목록 렌더링)
│   │           └── ProjectCard.tsx    (재사용)
│   │
│   └── [id]/
│       ├── page.tsx                   [프로젝트 상세]
│       └── components/
│           ├── ProjectHeader.tsx      (헤더 정보)
│           ├── MilestoneTimeline.tsx  (마일스톤 타임라인)
│           ├── CompletionHistoryChart.tsx (완료 이력)
│           └── TeamContributors.tsx   (팀원 역할)
│
└── completion-history/
    ├── page.tsx                       [완료 이력 대시보드]
    └── components/
        ├── CompletionStatistics.tsx   (통계 요약)
        ├── QuarterlyComparison.tsx    (분기별 비교)
        └── TeamPerformanceComparison.tsx (팀별 비교)

lib/dashboard/
├── api-client.ts                      (API 호출 유틸)
├── types.ts                           (TypeScript 정의)
├── utils.ts                           (날짜, 색상 등 유틸)
└── constants.ts                       (상수: 상태, 우선순위 등)
```

### 핵심 컴포넌트 스펙

#### 1. ProjectCard (재사용 가능)

```typescript
interface ProjectCardProps {
  project: TeamProject;
  variant?: 'compact' | 'full';  // 'compact': 목록용, 'full': 홈용
  onClick?: (id: string) => void;
}

// 렌더링
<ProjectCard
  project={project}
  variant="full"
  onClick={() => router.push(`/dashboard/team-projects/${project.id}`)}
/>
```

**요소:**
- 프로젝트명, 상태 배지, 진행률 바
- 담당자 아바타, 마일스톤 진행/목표
- 마지막 갱신 시간, 지연/정상 상태

#### 2. MilestoneTimeline

```typescript
interface MilestoneTimelineProps {
  projectId: string;
  milestones: Milestone[];
  showPredicted?: boolean;  // 예측 완료일 표시
}

// 렌더링: 수평 타임라인 (계획 vs 실제 비교)
```

#### 3. ProgressBar

```typescript
interface ProgressBarProps {
  percent: number;  // 0-100
  colorBand?: 'green' | 'yellow' | 'orange' | 'red';  // 자동 계산 또는 수동
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

#### 4. StatusBadge

```typescript
interface StatusBadgeProps {
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  icon?: boolean;
}

// 렌더링: 컬러 배지 아이콘 포함
// 예: 🟡 진행중 | ✅ 완료 | ⏳ 대기
```

---

## 데이터 흐름 & API

### API 응답 명세

#### 1. GET `/api/dashboard/projects/list`

**목적:** 프로젝트 포트폴리오 조회 (v_team_project_portfolio)

**요청:**
```typescript
GET /api/dashboard/projects/list?team=all&status=all&limit=100
```

**쿼리 파라미터:**
- `team` (optional): 팀명 필터
- `status` (optional): 상태 필터 (planning|active|on_hold|completed)
- `limit` (optional): 결과 수 제한

**응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "proj-001",
      "title": "Asset-P2: 506개 자산 관리",
      "description": "자산 일일 관리 자동화",
      "status": "active",
      "priority": "high",
      "progress_percent": 40,
      "start_date": "2026-05-20",
      "target_date": "2026-06-15",
      "actual_date": null,
      "assignee_id": "user-data-01",
      "assignee_name": "Data Engineer #1",
      "assignee_role": "data_engineer",
      "assignee_avatar_url": "https://...",
      "color_band": "orange",
      "is_overdue": false,
      "completion_history_count": 2,
      "created_at": "2026-05-20T00:00:00Z",
      "updated_at": "2026-05-26T14:27:00Z"
    }
  ],
  "meta": {
    "total": 4,
    "cached_at": "2026-05-26T14:30:00Z",
    "next_refresh": "2026-05-26T14:40:00Z"
  }
}
```

#### 2. GET `/api/dashboard/projects/[id]`

**목적:** 프로젝트 상세 조회 (헤더 + 마일스톤 + 이력)

**응답:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj-001",
      "title": "Asset-P2",
      ...
    },
    "milestones": [
      {
        "id": "ms-001",
        "title": "Phase 2 API 설계",
        "sequence": 1,
        "target_date": "2026-05-22",
        "completed": true,
        "completed_at": "2026-05-22T14:35:00Z"
      }
    ],
    "completionHistory": [
      {
        "id": "ch-001",
        "task_description": "Phase 2 API 설계 완료",
        "completed_by": "Data#1",
        "completed_at": "2026-05-22T14:35:00Z",
        "status": "completed",
        "notes": "16개 엔드포인트 사양 확정"
      }
    ]
  }
}
```

#### 3. GET `/api/dashboard/completion-history`

**목적:** 월별/분기별 완료 통계

**요청:**
```typescript
GET /api/dashboard/completion-history?quarter=Q2&year=2026
```

**응답:**
```json
{
  "success": true,
  "data": {
    "quarterly": {
      "quarter": "Q2",
      "year": 2026,
      "target": 8,
      "completed": 3,
      "in_progress": 5
    },
    "monthly": [
      {
        "month": 5,
        "year": 2026,
        "completed_count": 3,
        "projects": ["Discord-P1", "Backup-P2", "Audit-System"]
      }
    ],
    "byTeam": [
      {
        "team_name": "Web-Builder",
        "completed": 3,
        "in_progress": 2
      }
    ]
  }
}
```

### 클라이언트 데이터 흐름

```
┌─────────────────────────┐
│ React Component         │
│ (ProjectCard, etc.)     │
└────────────┬────────────┘
             │
             ↓ (useEffect)
┌─────────────────────────┐
│ fetch('/api/dashboard/...')
│ 또는 SWR Hook           │
└────────────┬────────────┘
             │
             ↓ (캐시 확인)
┌─────────────────────────┐
│ ISR 캐시 (10/5분)       │
│ 또는 새로운 요청        │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────┐
│ Supabase Query          │
│ (PostgreSQL)            │
└────────────┬────────────┘
             │
             ↓ (응답)
┌─────────────────────────┐
│ setState / SWR 캐시     │
└────────────┬────────────┘
             │
             ↓ (렌더링)
┌─────────────────────────┐
│ 화면 갱신               │
│ (5분마다 자동 갱신)     │
└─────────────────────────┘
```

### 캐싱 전략

| 엔드포인트 | ISR | 클라이언트 | 재검증 |
|-----------|-----|---------|--------|
| /projects/list | 10분 | SWR 5분 | 수동 재검증 가능 |
| /projects/[id] | 5분 | SWR 5분 | 마일스톤 추가 시 재검증 |
| /completion-history | 1시간 | SWR 1시간 | 월 말일에 재검증 |
| /stats/quarterly | 1시간 | SWR 1시간 | 수동 재검증 |

---

## UI/UX 토큰 & 스타일

### 색상 토큰

```typescript
// colors.ts
export const colors = {
  // 상태
  status: {
    completed: '#10B981',    // 초록 (완료)
    active: '#F59E0B',       // 주황 (진행중)
    planning: '#3B82F6',     // 파랑 (계획중)
    on_hold: '#6B7280',      // 회색 (보류)
    overdue: '#EF4444',      // 빨강 (지연)
  },
  
  // 진행률 바
  progress: {
    green: '#10B981',        // 80% 이상
    yellow: '#FBBF24',       // 50-79%
    orange: '#F97316',       // 20-49%
    red: '#EF4444',          // 0-19%
  },
  
  // 배경
  bg: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    hover: '#E5E7EB',
  },
  
  // 텍스트
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
  },
  
  // 보더
  border: '#E5E7EB',
};
```

### 타이포그래피

```typescript
// typography.ts
export const typography = {
  h1: {
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.4,
  },
};
```

### 레이아웃 & 간격

```typescript
// spacing.ts
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
};

// breakpoints.ts
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  widescreen: '1440px',
};
```

### CSS 모듈 예시

```css
/* dashboard.module.css */
.dashboardContainer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
}

.projectCard {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--spacing-lg);
  transition: all 200ms ease-in-out;
}

.projectCard:hover {
  background: var(--bg-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .dashboardContainer {
    grid-template-columns: 1fr;
  }
}
```

---

## 엣지 케이스

### 1. 데이터 없음

| 시나리오 | 표시 내용 | 액션 |
|--------|---------|------|
| 프로젝트 0개 | "진행 중인 프로젝트가 없습니다" | [새 프로젝트] 버튼 |
| 마일스톤 없음 | "마일스톤이 설정되지 않았습니다" | [마일스톤 추가] 버튼 |
| 완료 이력 없음 | "아직 완료 기록이 없습니다" | 첫 완료 기록 유도 |
| 팀원 미지정 | "담당자 미지정" | [담당자 지정] 필요 |

### 2. 지연 상황

| 상황 | 표시 | 우선순위 |
|-----|------|--------|
| 마일스톤 1일 이상 지연 | 🔴 경고 배지 + "지연: +1일" | P0 |
| 진행률 목표 미달 | 🟡 주의 배지 | P1 |
| 블로킹 항목 존재 | "차단됨: [항목명]" | P0 |

### 3. 권한 없음

| 상황 | 처리 |
|-----|------|
| 비CEO가 대시보드 접근 | 403 Forbidden (읽기전용 모드) |
| 프로젝트 수정 권한 없음 | 버튼 비활성화 + "권한 없음" 메시지 |
| 비인증 사용자 | 로그인 페이지로 리다이렉트 |

### 4. 성능 이슈

| 상황 | 처리 |
|-----|------|
| 로드 시간 > 3초 | Skeleton 표시 + 점진적 로드 |
| API 타임아웃 | "데이터 로드 중... [재시도]" 버튼 |
| 네트워크 오류 | "오프라인 모드 (마지막 캐시 사용)" |

### 5. 동시성 이슈

| 상황 | 처리 |
|-----|------|
| 사용자 A/B가 동시에 프로젝트 수정 | Optimistic Update + 충돌 해결 |
| 마일스톤 완료 직후 다시 편집 | "데이터 갱신 중..." + 새로고침 |

---

## 구현 우선순위 & 로드맵

### Phase 3 일정 (2026-05-27 ~ 06-05)

| 날짜 | 작업 | 일정 | 담당 |
|------|------|------|------|
| 05-27 | CEO 홈 UI 개발 | 1일 | Web-Builder |
| 05-28 | 프로젝트 목록 UI 개발 | 1일 | Web-Builder |
| 05-29 | 프로젝트 상세 UI 개발 | 1.5일 | Web-Builder |
| 05-30 | 완료 이력 대시보드 UI 개발 | 1일 | Web-Builder |
| 05-31 | 통합 테스트 + 버그 수정 | 1일 | QA-Team |
| 06-01 | 성능 최적화 (ISR, SWR) | 1일 | Web-Builder |
| 06-02~05 | 예비 기간 + 리뷰 | 3일 | |

**총 일정:** 9~10일 (2026-05-27 ~ 06-05)

### 우선순위 순서

```
P0 (필수):
1. CEO 홈 대시보드 (/dashboard)
   - 팀 신뢰도, 월 완료율, CEO 대기사항
   - 프로젝트 포트폴리오 카드 (4개)
   - 기본 스타일 + 반응형

2. 프로젝트 목록 (/dashboard/team-projects)
   - 필터/정렬 기능
   - 프로젝트 카드 리스트
   - 탭 네비게이션

P1 (중요):
3. 프로젝트 상세 (/dashboard/team-projects/[id])
   - 마일스톤 타임라인
   - 완료 이력 차트
   - 팀원 기여도

P2 (부가):
4. 완료 이력 대시보드 (/dashboard/completion-history)
   - 월별/분기별 통계
   - 팀별 성과 비교

P3 (향후):
- 실시간 알림 (Discord, Telegram)
- 내보내기 (PDF, CSV)
- 커스텀 대시보드 저장
```

### 기술 부채 관리

| 항목 | 우선순위 | 일정 |
|------|---------|------|
| TypeScript 타입 강화 | P1 | 각 작업 진행 중 |
| 에러 바운더리 추가 | P1 | 05-31 |
| Accessibility (a11y) WCAG AA | P2 | 06-01~02 |
| E2E 테스트 (Cypress) | P2 | 06-03~05 |
| 모바일 반응형 상세 테스트 | P1 | 05-31 |

---

## 검수 기준

### 기능 검수

- [ ] CEO 홈: 팀 신뢰도, 월 완료율, CEO 대기사항 3개 수치 정확
- [ ] CEO 홈: 프로젝트 카드 4개 렌더링, 클릭 시 상세 페이지 이동
- [ ] 프로젝트 목록: 팀별 필터 작동, 상태별 필터 작동
- [ ] 프로젝트 목록: 마일스톤 임박순 정렬 작동
- [ ] 프로젝트 상세: 마일스톤 타임라인 계획(파랑) vs 실제(초록) 비교 표시
- [ ] 프로젝트 상세: 완료 이력 3건 이상 표시, 차트 렌더링
- [ ] 완료 이력: 월별 차트 5월/6월 데이터 정확
- [ ] 완료 이력: 분기별 성과 Q2 목표 vs 달성 정확

### 성능 검수

- [ ] 초기 로드: < 2초 (Lighthouse)
- [ ] 페이지 이동: < 500ms (ISR 캐시 활용)
- [ ] 자동 갱신: 5분 정확도 ±10초
- [ ] 모바일 성능: < 3초 (LTE 환경)

### UI/UX 검수

- [ ] 색상 토큰: 상태별 배지 색상 일관성
- [ ] 반응형: 모바일(< 480px), 태블릿(768px), 데스크톱(1440px) 모두 확인
- [ ] 접근성: 스크린 리더 지원, 키보드 네비게이션
- [ ] 로딩 상태: Skeleton 표시, 에러 메시지 명확

---

## 문서 정보

**작성일:** 2026-05-26  
**버전:** v1.0 (설계 확정)  
**다음 단계:** Web-Builder가 UI 개발 시작 (2026-05-27)  
**담당:** Web-Builder (UI 개발), QA-Team (테스트)  
**리뷰:** CEO (기능 검수), Ops Lead (성능 검수)

---

## 부록: 샘플 데이터

### Seeded Projects (db/36_team_dashboard_phase2.sql에서)

```
1. Asset Master Phase 2
   - 시작: 2026-05-20
   - 목표: 2026-06-15
   - 진행률: 40%
   - 마일스톤: 1/4 완료
   
2. PM Module Design
   - 시작: 2026-05-20
   - 목표: 2026-06-10
   - 진행률: 50% (예상)
   - 마일스톤: 2/3 완료
   
3. Daily QA Audit
   - 시작: 2026-05-15
   - 목표: 2026-06-30
   - 진행률: 20% (예상)
   - 마일스톤: 0/2 완료
   
4. Cron Automation Suite
   - 시작: 2026-05-14
   - 목표: 2026-06-03
   - 진행률: 70% (예상)
   - 마일스톤: 2/2 완료 (진행중)
```

### Seeded Milestones (Asset Master Phase 2)

```
1. Phase 2 API 설계
   - 목표: 2026-05-22
   - 완료: ✅ 2026-05-22 14:35
   
2. Phase 2 UI 계획
   - 목표: 2026-05-24
   - 완료: ✅ 2026-05-24 10:20
   
3. Phase 2 구현 착수
   - 목표: 2026-06-05
   - 완료: ⏳ 미완료
```

---

**END OF DOCUMENT**

