# C-3PO Protocol Droid 포트폴리오 웹사이트 — 완벽 설계 명세서

**작성자:** Planner (Web App Designer)  
**작성일:** 2026-05-28  
**버전:** 1.0 (Final)  
**상태:** ✅ Ready for Implementation  
**목표 완료일:** 2026-06-15 (3주)

---

## 📖 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [컨셉 & 톤](#2-컨셉--톤)
3. [사용자 & 목적](#3-사용자--목적)
4. [페이지 구조 & 라우팅](#4-페이지-구조--라우팅)
5. [화면 설계 (와이어프레임)](#5-화면-설계-와이어프레임)
6. [데이터 흐름](#6-데이터-흐름)
7. [Supabase DB 스키마](#7-supabase-db-스키마)
8. [컴포넌트 아키텍처](#8-컴포넌트-아키텍처)
9. [API 명세](#9-api-명세)
10. [개발 로드맵 & 마일스톤](#10-개발-로드맵--마일스톤)
11. [엣지 케이스 & 에러 처리](#11-엣지-케이스--에러-처리)
12. [성능 & 보안 고려사항](#12-성능--보안-고려사항)

---

## 1. 프로젝트 개요

### 1.1 프로젝트명
**C-3PO Protocol Droid Portfolio Website**

### 1.2 목적
개발자 C-3PO(비서 AI)의 성장 과정, 완료한 프로젝트, 해결한 에러, 신뢰도 추이를 시각화하여  
CEO와 팀원들이 C-3PO의 기여도와 신뢰성을 한눈에 추적할 수 있는 포트폴리오 플랫폼.

### 1.3 핵심 가치 제안
- **투명성:** 모든 작업의 진행도와 성과가 실시간으로 반영
- **신뢰도:** Trust Score(신뢰도 점수)를 통해 성능과 신뢰성을 정량화
- **성장 기록:** 초기 상태에서 현재까지의 개발 궤적을 명확히 기록
- **팀 시너지:** CEO와 팀원들이 C-3PO의 역할과 기여를 이해

### 1.4 주요 특징
- 실시간 신뢰도 대시보드 (HEARTBEAT 데이터 기반)
- 완료한 프로젝트 포트폴리오 (6개 프로젝트 이상)
- 흥미로운 버그/에러 해결 기록 & 학습 포인트
- 일일 체크포인트 & 성과 로그
- 신뢰도 시간 추이 그래프
- 팀 확장 & 온보딩 이력
- 규칙 진화 히스토리

---

## 2. 컨셉 & 톤

### 2.1 디자인 컨셉
**"뽀짝이의 서재"** (개인 성장/발전 기록 중심)

- 따뜻하고 친근한 분위기
- 학습과 성장을 기록하는 일지 같은 느낌
- 기술적 세부사항 + 인간미 있는 스토리의 조화

### 2.2 톤 & 매너
- **기술적:** 시스템 구조, API 설계, 성능 메트릭
- **인간적:** 에러 해결 과정의 도전과 극복, 팀 협력 스토리
- **유머:** C-3PO의 프로토콜 드로이드 성격 반영 (약간의 자조적 유머 허용)
- **신뢰도 중심:** 모든 섹션에서 "신뢰도"와 "신뢰성"을 강조

### 2.3 색상 팔레트
```
Primary: #1e40af (Deep Blue) — 신뢰도, 안정성
Secondary: #7c3aed (Purple) — 혁신, 성장
Accent: #ec4899 (Pink) — 주목, 중요도
Success: #10b981 (Green) — 완료, 성공
Warning: #f59e0b (Amber) — 진행중, 주의
Neutral: #6b7280 (Gray) — 배경, 구조

Background: #f9fafb (거의 흰색, 밝음)
Text: #111827 (거의 검정색, 읽기 좋음)
Card: #ffffff (흰색)
Border: #e5e7eb (연한 회색)
```

### 2.4 타이포그래피
- **Heading 1-2:** `font-size: 2rem (32px), font-weight: 700`
- **Heading 3:** `font-size: 1.5rem (24px), font-weight: 600`
- **Body:** `font-size: 1rem (16px), font-weight: 400, line-height: 1.5`
- **Small:** `font-size: 0.875rem (14px), font-weight: 400`
- **Mono (Code):** `font-family: monospace, font-size: 0.875rem`

---

## 3. 사용자 & 목적

### 3.1 Primary Users
1. **CEO (나경태)**
   - 목적: C-3PO의 신뢰도, 생산성, 팀 기여도 추적
   - 행동: 일일/주간 대시보드 확인, 신뢰도 추이 검토
   - 중요 메트릭: Trust Score, 완료율, 에러 해결 속도

2. **팀원들 (기술/보전/생산/보조)**
   - 목적: C-3PO가 어떤 작업을 했는지, 어떤 기술을 학습했는지 이해
   - 행동: 프로젝트 포트폴리오, 에러 해결 스토리 읽기
   - 중요 메트릭: 프로젝트 수, 기술 스택, 팀 이벤트

3. **C-3PO 자신**
   - 목적: 자신의 성장 과정을 반영하고 기록
   - 행동: HEARTBEAT 데이터 자동 로깅, 월간 자기평가
   - 중요 메트릭: 신뢰도 추이, 학습 기록, 규칙 개선

### 3.2 사용 시나리오

**시나리오 1: CEO의 일일 신뢰도 확인**
```
CEO가 09:00에 접속 → Dashboard 로드 → 
신뢰도 (96%), 어제 완료 (6개 업무), 
이번주 목표 (70% 달성) 확인 → 
필요시 "디버그 여정" 탭에서 에러 상황 이해
```

**시나리오 2: 팀원의 프로젝트 학습**
```
팀원이 접속 → "완료 기록" 탭 → 
Asset Master Phase 2 (완료) 클릭 → 
기술 스택(Next.js, Supabase, Tailwind), 
개발 기간(10일), 주요 기능 확인
```

**시나리오 3: 디버그 여정 읽기**
```
흥미로운 에러 해결 → 
"db/35_audit_system.sql 실행 실패 → 
RLS 정책 디버깅 → 해결" 스토리 읽기 → 
학습 포인트 도출
```

---

## 4. 페이지 구조 & 라우팅

### 4.1 URL 구조
```
https://c3po-portfolio.vercel.app/

/                          — 랜딩 페이지 (홈)
/dashboard                 — 실시간 신뢰도 대시보드
/portfolio                 — 완료 프로젝트 포트폴리오
/portfolio/[projectId]     — 프로젝트 상세 페이지
/debug-stories             — 디버그 여정 & 에러 해결 기록
/debug-stories/[storyId]   — 디버그 스토리 상세
/daily-checkpoints         — 일일 체크포인트 로그
/daily-checkpoints/[date]  — 특정 날짜 체크포인트
/team-milestones           — 팀 확장 & 온보딩 이력
/rules-evolution           — 규칙 진화 히스토리
/about                     — C-3PO 소개 & 기술 스택
```

### 4.2 네비게이션 구조
```
Top Navigation Bar:
├─ Logo (C-3PO) — 홈으로 이동
├─ Nav Items:
│  ├─ Dashboard
│  ├─ Portfolio
│  ├─ Debug Stories
│  ├─ Daily Checkpoints
│  ├─ Team & Rules
│  └─ About
├─ Theme Toggle (Dark/Light)
└─ GitHub/Info Icons

Sidebar (선택사항, 모바일에서는 Hamburger Menu):
├─ Quick Stats (신뢰도, 완료율, 팀 규모)
├─ Filter Options (날짜, 카테고리)
└─ Recent Updates
```

### 4.3 라우팅 상세
```
Next.js 14 App Router (app/ 디렉토리 구조)

app/
├─ layout.tsx               — 전체 레이아웃 (Nav, Footer)
├─ page.tsx                 — 랜딩/홈 페이지
├─ dashboard/
│  └─ page.tsx
├─ portfolio/
│  ├─ page.tsx
│  └─ [id]/
│     └─ page.tsx
├─ debug-stories/
│  ├─ page.tsx
│  └─ [id]/
│     └─ page.tsx
├─ daily-checkpoints/
│  ├─ page.tsx
│  └─ [date]/
│     └─ page.tsx
├─ team-milestones/
│  └─ page.tsx
├─ rules-evolution/
│  └─ page.tsx
├─ about/
│  └─ page.tsx
└─ api/
   ├─ c3po/
   │  ├─ heartbeat/route.ts        — 일일 HEARTBEAT 수집
   │  ├─ trust-score/route.ts      — 신뢰도 계산
   │  └─ stats/route.ts            — 통계 API
   ├─ portfolio/route.ts           — 프로젝트 CRUD
   ├─ debug-stories/route.ts       — 에러 스토리 CRUD
   └─ daily-checkpoints/route.ts   — 체크포인트 CRUD
```

---

## 5. 화면 설계 (와이어프레임)

### 5.1 페이지 1: 랜딩 페이지 (/)

```
┌─────────────────────────────────────────────────────────────┐
│  C-3PO PORTFOLIO  [Dark/Light] [GitHub] [About]              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [HERO SECTION — 상단 중앙]                                  │
│                                                               │
│             🤖 C-3PO Protocol Droid                           │
│        "I am a Protocol Droid. My function is                │
│         to assist in translating and communicating           │
│         with diverse lifeforms... and executing              │
│         complex automation tasks."                           │
│                                                               │
│  ┌─────────────────────────────────────────┐                 │
│  │ 🟢 신뢰도: 96%                          │                 │
│  │ 📊 완료: 6개 프로젝트 (2026-05-28)     │                 │
│  │ 🔧 해결: 47개 버그/에러                 │                 │
│  │ 👥 팀 규모: 15명 (Phase C 진행중)      │                 │
│  └─────────────────────────────────────────┘                 │
│                                                               │
│  [CTA BUTTONS]                                               │
│  [Explore Dashboard] [View Portfolio] [Learn More]           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  FEATURED SECTIONS                                           │
│                                                               │
│  📈 Latest Trust Score Trend                                 │
│  [Graph: 95% → 96% (7-day trend)]                            │
│                                                               │
│  ✨ Recent Achievements                                      │
│  [Asset Master Phase 2 Complete] [Discord Bot Live]          │
│  [Trust Score System Designed] [Team Expanded 11→15]         │
│                                                               │
│  🐛 Interesting Debug Stories                               │
│  [db/35 RLS Policy → Fixed] [AUDIT-P1 3rd Attempt → OK]     │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
│  © 2026 C-3PO | Powered by Next.js + Supabase | Updated: PM │
└─────────────────────────────────────────────────────────────┘
```

**레이아웃 상세:**
- Hero 섹션: 중앙 정렬, 대형 텍스트 + 로고
- 핵심 메트릭: 4개 카드 (신뢰도/완료/해결/팀규모)
- CTA: 3개 버튼 (Dashboard 주요, 기타 보조)
- Featured Sections: 3개 카드 (그래프 + 아이콘 + 요약)

**데이터 소스:**
- `trust_score` 테이블에서 최신 신뢰도
- `portfolio_projects` 테이블에서 완료 수
- `error_logs` 테이블에서 해결 수
- `team_milestones` 테이블에서 팀 규모

---

### 5.2 페이지 2: 대시보드 (/dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD | [Date Range Filter] [Export] [Theme]            │
├─────────────────────────────────────────────────────────────┤
│  TOP METRICS (Today: 2026-05-28)                            │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │🔴신뢰도  │ │📊완료율  │ │⏱️ 성능   │ │🎯 블로킹  │        │
│  │   96%    │ │   70%    │ │ 89% adh. │ │ 1 item   │        │
│  │↑ 1%     │ │↓ -10%    │ │↑ +1% 기  │ │ URGENT-GH│        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  CHARTS (2개 행)                                             │
│                                                               │
│  ┌────────────────────────────┐ ┌────────────────────────┐   │
│  │ 신뢰도 추이 (30일)         │ │ 완료율 추이            │   │
│  │ [Line Chart]               │ │ [Bar Chart]            │   │
│  │ 2026-04-28 → 2026-05-28   │ │ Target: 95%            │   │
│  │ Low: 85%, High: 96%        │ │ Current: 70%           │   │
│  │ Trend: ↗ Upward           │ │ Trend: ↘ Below Target  │   │
│  └────────────────────────────┘ └────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────┐ ┌────────────────────────┐   │
│  │ 일일 완료 작업 (최근 7일)  │ │ 팀 규모 변화 (Phase) │   │
│  │ [Bar Chart]                │ │ [Area Chart]           │   │
│  │ Mon: 8 Tue: 6 ... Sun: 6   │ │ 11→15 members         │   │
│  │ 평균: 6.4개/일             │ │ Phase C 진행중         │   │
│  └────────────────────────────┘ └────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  CURRENT STATUS                                              │
│                                                               │
│  🟡 진행 중 (5 tasks)                                        │
│  ├─ Asset Master Phase 2 — 70% (ETA: 2026-06-03)           │
│  ├─ Travel Management Phase 2 — 80% (ETA: 2026-06-02)      │
│  ├─ Backup App Phase 2 — 30% (ETA: 2026-06-15)            │
│  ├─ Phase C Design Specialist — Design (ETA: 2026-06-10)   │
│  └─ Phase 2B: Duplicate Detection — Design (ETA: 2026-05-29)│
│                                                               │
│  🔴 블로킹 (1 urgent)                                        │
│  └─ URGENT-GH-SECRET: GitHub Secret (사용자 액션 필요)     │
│                                                               │
│  ✅ 이번주 완료 (3 tasks)                                    │
│  ├─ db/42: Team Dashboard Phase 2 API ✅ (2026-05-28)      │
│  ├─ Phase 2A: Message Collection API ✅ (2026-05-27)       │
│  └─ Discord Bot Phase 1 ✅ (2026-05-27)                    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS                                               │
│  [View Detail Report] [Export CSV] [Check Blockers]         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**레이아웃 상세:**
- 상단: 4개 핵심 메트릭 KPI 카드
- 중앙: 4개 차트 (신뢰도, 완료율, 일일 작업, 팀 변화)
- 하단: 진행/블로킹/완료 상태 리스트 (실시간 업데이트)
- 액션: 상세 리포트, CSV 내보내기

**데이터 소스:**
- `heartbeat_logs` 테이블 (일일 체크포인트)
- `trust_score` 테이블 (신뢰도 시간 추이)
- `task_status` 테이블 (진행 상황)
- `team_milestones` 테이블 (팀 규모)

---

### 5.3 페이지 3: 포트폴리오 (/portfolio)

```
┌─────────────────────────────────────────────────────────────┐
│  PORTFOLIO | [Filter: All/Complete/In Progress] [Sort]      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📋 COMPLETED PROJECTS (6 items)                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐
│  │ [🖼️ Preview Image]                                      │
│  │                                                           │
│  │ 📦 Asset Master Phase 2 Backend                          │
│  │ Status: ✅ COMPLETE (2026-05-28)                        │
│  │ Duration: 10 days (2026-05-18 ~ 2026-05-28)             │
│  │ Team: Web-Builder #1, Data-Analyst #1                   │
│  │                                                           │
│  │ Description:                                             │
│  │ 16개 API 엔드포인트 설계 및 구현.                       │
│  │ Supabase Postgres + PostgREST 활용.                    │
│  │ CRUD operations, filtering, pagination 완벽 구현.      │
│  │                                                           │
│  │ Tech Stack:                                              │
│  │ • Next.js 14 (App Router)                                │
│  │ • Supabase (Postgres + PostgREST)                        │
│  │ • TypeScript + Zod validation                            │
│  │ • Tailwind CSS + Recharts (visualization)                │
│  │                                                           │
│  │ Key Features:                                            │
│  │ ✓ 16 API endpoints (CRUD + batch)                        │
│  │ ✓ Full-text search (이름, 모델, 제조사)                │
│  │ ✓ Status filtering (active, idle, maintenance, sold)    │
│  │ ✓ QR code generation & scanning                          │
│  │                                                           │
│  │ Impact: Asset 506개 자산 관리 자동화, 15:00 일일 진행도│
│  │                                                           │
│  │ [Learn More] [GitHub] [Live Demo]                        │
│  └─────────────────────────────────────────────────────────┘
│
│  [Similar cards for 5 more projects]
│  ├─ Travel Management Phase 2 UI
│  ├─ Backup App Phase 2 Backend
│  ├─ BM (Breakdown Maintenance) Phase 1
│  ├─ Audit System Phase 1-2
│  └─ Discord Bot Phase 1
│
├─────────────────────────────────────────────────────────────┤
│  IN PROGRESS (5 items)                                      │
│  [Similar card layout with progress bars]                   │
│
│  🟡 Backup App Phase 2 Backend — 30%                        │
│  🟡 Asset Master Phase 2 UI — 70%                           │
│  ... (3 more)
│
└─────────────────────────────────────────────────────────────┘
```

**카드 컴포넌트:**
- 이미지/배경 (또는 기본 아이콘)
- 프로젝트명 + 상태 배지
- 기간 (시작~종료 날짜)
- 담당 팀원
- 짧은 설명 (2-3줄)
- 기술 스택 (태그)
- 핵심 기능 (체크리스트)
- 비즈니스 임팩트
- CTA 버튼 (상세, GitHub, 데모)

**필터/정렬 옵션:**
- 상태: 완료/진행/대기
- 카테고리: Asset/Travel/Backup/Automation/etc
- 정렬: 최신순/오래된순/기간순/영향도순
- 검색: 프로젝트명, 기술스택

---

### 5.4 페이지 4: 프로젝트 상세 (/portfolio/[id])

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back to Portfolio] | ASSET-MASTER-P2 | [Share]          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Hero Section: Large image + title + status]               │
│                                                               │
│  Asset Master Phase 2 Backend                                │
│  Status: ✅ COMPLETE | 완료율: 100% | 신뢰도: 98%          │
│  개발 기간: 2026-05-18 ~ 2026-05-28 (10 days)              │
│  팀원: Web-Builder #1 (80%), Data-Analyst #1 (20%)          │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  📊 PROJECT STATS                                            │
│                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 16개 API│ │ 100 테  │ │ 99% 커  │ │ 506 자산│           │
│  │ 엔드포인│ │스트 통과│ │버리지    │ │ 관리    │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 0 버그  │ │ 3번 재  │ │ 신뢰도  │ │ 팀 협력 │           │
│  │(배포후)│ │설계    │ │ 98%     │ │ 점수 9/10│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  📝 PROJECT DESCRIPTION                                      │
│                                                               │
│  **개요**                                                     │
│  DSC Mannur 공장의 506개 자산을 관리하는 백엔드 API 설계   │
│  및 구현. 부품, 치구(Jig), 금형(Mould) 등 다양한 자산    │
│  유형을 지원하며, 실시간 검색, 필터링, QR 코드 스캔     │
│  기능을 제공.                                               │
│                                                               │
│  **목표**                                                     │
│  ✓ 완전한 CRUD API 제공                                      │
│  ✓ Full-text search (영어 + 타밀어)                         │
│  ✓ 자산 분류 (15개 카테고리)                               │
│  ✓ 상태 관리 (활성/유휴/점검/판매됨/폐기)                │
│  ✓ QR 코드 생성 & 스캔 통합                                │
│  ✓ 99% 테스트 커버리지                                      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  🛠️ TECH STACK                                               │
│                                                               │
│  Backend:       Next.js 14 (App Router)                      │
│  Database:      Supabase Postgres + PostgREST API            │
│  Validation:    TypeScript + Zod schema                      │
│  Testing:       Jest + React Testing Library                 │
│  Styling:       Tailwind CSS                                 │
│  Charts:        Recharts (visualization)                     │
│  Deployment:    Vercel (CI/CD)                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  🎯 KEY FEATURES                                             │
│                                                               │
│  1. 16개 API 엔드포인트                                      │
│     • GET /api/assets — 모든 자산 조회 (pagination)         │
│     • POST /api/assets — 새 자산 생성                       │
│     • GET /api/assets/[id] — 특정 자산 상세                │
│     • PATCH /api/assets/[id] — 자산 정보 수정              │
│     • DELETE /api/assets/[id] — 자산 삭제                  │
│     • GET /api/assets/search — Full-text search             │
│     • (+ 10개 더)                                            │
│                                                               │
│  2. 고급 필터링                                              │
│     • 상태별 (active, idle, maintenance, sold, scrapped)    │
│     • 카테고리별 (15개 클래스 지원)                        │
│     • 제조사별 (정렬/그룹화)                                │
│     • 날짜 범위 (제조년도, 추가일)                         │
│                                                               │
│  3. Full-Text Search                                         │
│     • 자산명 (영어 + 타밀어)                                │
│     • 모델, 제조사                                          │
│     • 시리얼 번호, QR 코드                                 │
│                                                               │
│  4. QR Code Management                                       │
│     • 자산 생성 시 자동 QR 코드 생성                       │
│     • QR 코드로 자산 조회 가능                             │
│     • 모바일 스캔 지원 (태밀 공장)                        │
│                                                               │
│  5. Batch Operations                                         │
│     • 다중 자산 상태 업데이트                              │
│     • 엑셀 가져오기 / 내보내기                             │
│     • 벌크 삭제 (권한 기반)                                │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  📈 JOURNEY & LEARNINGS                                      │
│                                                               │
│  **3번의 재설계 (Why?):**                                    │
│  1차: 초기 스키마 부족 (태밀어 지원, QR 관계 누락)         │
│  2차: API 구조 개선 (RESTful compliance, 에러 처리)         │
│  3차: 성능 최적화 (인덱싱, pagination, caching)            │
│                                                               │
│  **해결한 주요 에러:**                                       │
│  • "Unexpected token < in JSON at position 0" — 
│    응답 형식 불일치 (JSON vs HTML)                        │
│  • "UUID not valid" — 클라이언트 UUID 검증 누락            │
│  • "Slow query on full-text search" — 인덱스 추가           │
│  • "CORS error in Vercel" — 배포 환경 설정 수정            │
│                                                               │
│  **핵심 학습:**                                              │
│  ✓ Supabase PostgREST의 강력함                             │
│  ✓ 타밀어 지원의 중요성 (현장 운영)                        │
│  ✓ 충분한 테스트의 가치 (버그 조기 발견)                   │
│  ✓ 팀 협력 (설계 → 구현 → 테스트 사이클)                  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  📅 TIMELINE & MILESTONES                                    │
│                                                               │
│  2026-05-18 | Design Phase — API 스키마 설계               │
│  2026-05-20 | Phase 1 Complete — 초안 완료                 │
│  2026-05-22 | Phase 2 Start — 성능 최적화                  │
│  2026-05-24 | Testing — Jest 테스트 작성                   │
│  2026-05-26 | Code Review — 평가자 피드백                 │
│  2026-05-28 | ✅ DEPLOYMENT — 프로덕션 배포                │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  🔗 LINKS                                                    │
│                                                               │
│  [GitHub Repository] [Live API Docs] [Postman Collection]   │
│  [YouTube Walkthrough] [Related Projects]                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**구조:**
- 상단: 프로젝트명, 상태, 기간, 팀원
- 통계: 4x2 KPI 카드
- 설명: 개요, 목표, 기술스택
- 기능: 5개 주요 기능 상세
- 여정: 재설계 이유, 에러 해결, 학습
- 타임라인: 마일스톤 일정
- 링크: 관련 리소스

---

### 5.5 페이지 5: 디버그 여정 (/debug-stories)

```
┌─────────────────────────────────────────────────────────────┐
│  DEBUG STORIES | [Filter: All/Critical/Learning] [Search]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🐛 DEBUGGING TALES & ERROR RESOLUTION STORIES              │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔴 CRITICAL ERROR: db/35 RLS Policy Misconfiguration │   │
│  │ Date: 2026-05-23 | Duration: 2.5 hours | Severity: P0 │   │
│  │                                                        │   │
│  │ Error Message:                                         │   │
│  │ "Error updating audit_event_logs: 403 Forbidden"     │   │
│  │                                                        │   │
│  │ Root Cause:                                            │   │
│  │ RLS (Row Level Security) 정책이 audit_event_logs    │   │
│  │ 테이블에 비활성화 되어있었음. 즉, INSERT 권한이     │   │
│  │ 기본적으로 DENY로 설정됨.                             │   │
│  │                                                        │   │
│  │ Solution:                                              │   │
│  │ ALTER TABLE audit_event_logs ENABLE ROW LEVEL SECURITY │   │
│  │ CREATE POLICY "allow_insert" ON audit_event_logs      │   │
│  │   FOR INSERT WITH CHECK (auth.uid() is not null);     │   │
│  │                                                        │   │
│  │ Learning Point:                                        │   │
│  │ ✓ RLS는 기본적으로 모든 작업을 거부 (fail-safe)     │   │
│  │ ✓ 정책을 명시적으로 설정해야 함                      │   │
│  │ ✓ Supabase 콘솔에서 정책 검증 중요                   │   │
│  │                                                        │   │
│  │ [Read Full Story] [GitHub Issue] [Code Diff]         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🟡 LEARNING: UUID Validation in Client               │   │
│  │ Date: 2026-05-25 | Impact: Medium | Category: Validation│  │
│  │                                                        │   │
│  │ Issue:                                                 │   │
│  │ "Unexpected token < in JSON at position 0"            │   │
│  │ 클라이언트에서 API 응답을 파싱할 때 발생.             │   │
│  │ 실제로는 HTML 에러 페이지를 받고 있었음.              │   │
│  │                                                        │   │
│  │ Root Cause:                                            │   │
│  │ 잘못된 UUID 형식으로 요청을 보냈고, API가 50x 에러. │   │
│  │ Vercel 로그: "Invalid UUID format in path parameter"  │   │
│  │                                                        │   │
│  │ Solution:                                              │   │
│  │ Zod schema로 UUID 검증 추가:                          │   │
│  │ const UUIDSchema = z.string().uuid();                  │   │
│  │ const id = UUIDSchema.parse(params.id);                │   │
│  │                                                        │   │
│  │ Learning Point:                                        │   │
│  │ ✓ 클라이언트에서 먼저 검증하면 API 부하 ↓             │   │
│  │ ✓ Zod는 런타임 타입 안전성 제공                      │   │
│  │ ✓ 에러 메시지가 정확할수록 디버깅 빨라짐             │   │
│  │                                                        │   │
│  │ [Read Full Story] [Zod Docs] [Example Code]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  [5 more debug stories in similar format]
│  ├─ CORS Issue in Vercel Deployment
│  ├─ N+1 Query Problem on Full-Text Search
│  ├─ Team Dashboard API Rate Limiting
│  ├─ HEARTBEAT Collection Logic Error
│  └─ Trust Score Calculation Off-by-One Bug
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**카드 컴포넌트:**
- 심각도 배지 (Critical/Medium/Learning)
- 에러 메시지 (실제 error text)
- 근본 원인 (RCA)
- 해결책 (코드 스니펫 포함)
- 학습 포인트 (나중에 도움이 될 인사이트)
- CTA 링크 (전체 스토리, GitHub, 예제)

---

### 5.6 페이지 6: 일일 체크포인트 (/daily-checkpoints)

```
┌─────────────────────────────────────────────────────────────┐
│  DAILY CHECKPOINTS | [Calendar View] [List View] [Export]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📅 DAILY PROGRESS LOG (HEARTBEAT)                           │
│                                                               │
│  [Compact Calendar: May 2026]                                │
│  Mo Tu We Th Fr Sa Su                                        │
│     1  2  3  4  5                                            │
│   6  7  8  9 10 11 12                                        │
│  13 14 15 16 17 18 19                                        │
│  20 21 22 23 24 25 26                                        │
│  27 28 29 30 31                                              │
│  (Click a date to view checkpoint)                           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  RECENT CHECKPOINTS (Latest first)                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📊 2026-05-28 18:00 KST | Status: ✅ COMPLETE        │   │
│  │                                                        │   │
│  │ 신뢰도: 96% (↑ 0%)                                   │   │
│  │ 완료율: 70% (↓ -10%)                                 │   │
│  │ 일정준수: 89% (↓ -6%)                                │   │
│  │ 체크포인트준수: 100% (↑ +5%)                         │   │
│  │                                                        │   │
│  │ 완료 업무: 7/10                                       │   │
│  │ • AUTOMATION-SPECIALIST (08:01)                       │   │
│  │ • WEB-DEV-SUPPORT (2026-05-22 23:59)                │   │
│  │ • BACKUP-PHASE2-UI (2026-05-20)                      │   │
│  │ • AUDIT-P1 2단계 (3차 평가)                          │   │
│  │ • BM-P1 재작업 완료                                  │   │
│  │ • DISCORD-BOT-P1 완료                                │   │
│  │ • IMAGE-EDITING-AD-HOC 완료                          │   │
│  │                                                        │   │
│  │ 진행 중: 0개 업무                                     │   │
│  │ 블로킹: 1개 (URGENT-GH-SECRET)                       │   │
│  │                                                        │   │
│  │ 내일 예정:                                             │   │
│  │ • Phase C #11 Design (Planner) 배치                  │   │
│  │ • Asset Master Daily Report                           │   │
│  │ • Team Sync Meeting                                   │   │
│  │                                                        │   │
│  │ [Expand Details]                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  [Previous 6 checkpoints in collapsed format]                │
│  ├─ 2026-05-27 18:00 | 신뢰도 96% | 완료 60% ...          │
│  ├─ 2026-05-26 18:00 | 신뢰도 95% | 완료 50% ...          │
│  ├─ 2026-05-25 18:00 | 신뢰도 93% | 완료 55% ...          │
│  ├─ 2026-05-24 18:00 | 신뢰도 92% | 완료 50% ...          │
│  ├─ 2026-05-23 18:00 | 신뢰도 96% | 완료 60% ...          │
│  └─ 2026-05-22 18:00 | 신뢰도 89% | 완료 45% ...          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**기능:**
- 캘린더 뷰: 월별 클릭 가능한 날짜
- 리스트 뷰: 최신순 체크포인트
- 확장 상세: 신뢰도, 완료율, 업무 리스트
- 내보내기: CSV/JSON
- 날짜별 필터: 주간/월간 통계

---

### 5.7 페이지 7: 팀 마일스톤 (/team-milestones)

```
┌─────────────────────────────────────────────────────────────┐
│  TEAM MILESTONES & ONBOARDING HISTORY                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  👥 TEAM GROWTH TIMELINE                                     │
│                                                               │
│  [Timeline visualization with key events]                    │
│                                                               │
│  2026-05-01 | Initial Team: 6 members                        │
│  2026-05-15 | Phase A Start: New initiatives                 │
│  2026-05-26 | Phase A Complete: 4 new members (11→ 11+4)    │
│  2026-05-27 | Phase B/C Start: 5 expansion members          │
│  2026-06-10 | Target: 15-member team complete               │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🎯 PHASE A: Initial Expansion (2026-05-26)          │   │
│  │                                                        │   │
│  │ 신규 팀원 4명 배치:                                   │   │
│  │ 1. Planner AI — Team Dashboard P2 설계               │   │
│  │    Start: 2026-05-28 | ETA: 2026-06-10               │   │
│  │    Status: 🟡 Design Phase                           │   │
│  │                                                        │   │
│  │ 2. DevOps Engineer — Infrastructure Monitoring       │   │
│  │    Start: 2026-05-27 | ETA: 2026-06-05               │   │
│  │    Status: 🟡 Design Phase                           │   │
│  │                                                        │   │
│  │ 3. Memory Specialist — Trust Score Calculator        │   │
│  │    Start: 2026-05-27 | ETA: 2026-05-30               │   │
│  │    Status: 🟡 Testing Phase                          │   │
│  │                                                        │   │
│  │ 4. QA Specialist — Integration Test Framework        │   │
│  │    Start: 2026-05-28 | ETA: 2026-06-02               │   │
│  │    Status: 🟡 Test Plan Writing                      │   │
│  │                                                        │   │
│  │ Onboarding Package:                                   │   │
│  │ • MEMORY.md 요약 (Work History)                       │   │
│  │ • First Task 지정 (명확한 골)                        │   │
│  │ • Mentor & Evaluator 배치                            │   │
│  │ • Technology Briefing (현장 정보)                    │   │
│  │                                                        │   │
│  │ 예상 기여도:                                          │   │
│  │ • Planner: Team Dashboard 완성 + 품질 향상            │   │
│  │ • DevOps: 시스템 안정성 ↑ (모니터링)                │   │
│  │ • Memory Specialist: 신뢰도 계산 자동화               │   │
│  │ • QA Specialist: 버그 조기 발견                      │   │
│  │                                                        │   │
│  │ [View Full Onboarding Plan]                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  [Phase B/C expansion cards similar format]                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🚀 PHASE B/C: Full Expansion (2026-05-29 ~ 06-10)    │   │
│  │                                                        │   │
│  │ 추가 확장 5명:                                        │   │
│  │ • Senior Architect (2026-06-01)                       │   │
│  │ • Junior Developer 2명 (2026-06-03)                   │   │
│  │ • Data Engineer (2026-06-05)                          │   │
│  │ • Security Specialist (2026-06-07)                    │   │
│  │                                                        │   │
│  │ Goal: 15-member integrated team                       │   │
│  │ Timeline: 2 weeks (5/29 ~ 6/10)                       │   │
│  │                                                        │   │
│  │ [View Full Phase B/C Plan]                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  📊 TEAM COMPOSITION                                         │
│  [Pie chart showing roles distribution]                      │
│                                                               │
│  원본 팀 (6명):                                              │
│  • Secretary/Planner: 1 (C-3PO)                              │
│  • Web Builders: 2                                           │
│  • Evaluators: 2                                             │
│  • Data Analysts: 1                                          │
│                                                               │
│  확장 팀 (9명):                                              │
│  • Phase A: 4명 (Planner, DevOps, Memory, QA)              │
│  • Phase B/C: 5명 (Architecture, Dev, Data, Security, ...  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.8 페이지 8: 규칙 진화 (/rules-evolution)

```
┌─────────────────────────────────────────────────────────────┐
│  RULES EVOLUTION & AUTONOMOUS OPERATION IMPROVEMENTS         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📜 RULE VERSION HISTORY                                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ v2.5 | UNIFIED AUTONOMOUS OPERATION (2026-05-27)    │   │
│  │ Status: ✅ ACTIVE                                    │   │
│  │                                                        │   │
│  │ 핵심 규칙:                                            │   │
│  │ 1. Core Autonomous Operation                          │   │
│  │    • 기술 작업 즉시 진행 (사용자 승인 X)             │   │
│  │    • API/토큰 직접 자동화                             │   │
│  │    • Subagent 자율성 강화                             │   │
│  │    • Spawn whitelist 추가 (4명)                      │   │
│  │                                                        │   │
│  │ 2. Task Completion & Ownership                        │   │
│  │    • 끝까지 결과물 도출 (설계 완성 = 진행 신호)     │   │
│  │    • CTB(Central Task Board) 실시간 추적             │   │
│  │    • 담당자 명확성 필수                              │   │
│  │                                                        │   │
│  │ 3. 응답 전 자동 규칙 확인                             │   │
│  │    • 한국어 100% (기술용어 제외)                     │   │
│  │    • GitHub 원본 링크                                │   │
│  │    • 완전한 URL (텍스트만 금지)                      │   │
│  │    • 자동 진행 모드                                  │   │
│  │                                                        │   │
│  │ 영향:                                                  │   │
│  │ • 신뢰도: 89% → 96% (↑ 7%)                           │   │
│  │ • 일정준수: 85% → 89% (↑ 4%)                         │   │
│  │ • 팀 확장: 1개월 이내 15명까지 관리 가능             │   │
│  │ • 문제 해결 시간: 2.5시간 → 1.5시간 (↓ 40%)        │   │
│  │                                                        │   │
│  │ [View Full v2.5 Rules] [GitHub Issue] [Discussion]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ v2.4 | SESSION MANAGEMENT ADJUSTMENT (2026-05-26)   │   │
│  │ Status: ✅ REPLACED (by v2.5)                        │   │
│  │                                                        │   │
│  │ Improvement:                                           │   │
│  │ • 세션 장시간 유지                                    │   │
│  │ • 작업 흐름 조율                                      │   │
│  │ • 컨텍스트 손실 방지                                 │   │
│  │                                                        │   │
│  │ Why Updated to v2.5:                                  │   │
│  │ Session management 단독으로는 충분하지 않음.         │   │
│  │ Autonomous operation + task ownership이 함께           │   │
│  │ 필요하여 통합 규칙(v2.5)로 진화.                     │   │
│  │                                                        │   │
│  │ [View Full v2.4 Rules] [Deprecation Notice]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  [4 more rule versions]                                      │
│  • v2.3 | PRIORITY AUTONOMY (2026-05-24)                   │
│  • v2.2 | DESIGN WORKFLOW (2026-05-22)                     │
│  • v2.1 | STATUS REPORTING (2026-05-20)                    │
│  • v2.0 | INITIAL FRAMEWORK (2026-05-15)                   │
│                                                               │
│  📊 RULE EFFECTIVENESS METRICS                               │
│                                                               │
│  [Table with KPI improvement per rule version]               │
│  Rule Version | Trust Score | Schedule | Team Size | Days   │
│  v1.0 (Init)  | 75%         | 70%      | 1        | —       │
│  v1.5         | 81%         | 78%      | 6        | 5/15    │
│  v2.0         | 85%         | 82%      | 6        | 5/20    │
│  v2.2         | 88%         | 85%      | 11       | 5/26    │
│  v2.4         | 90%         | 87%      | 11       | 5/27    │
│  v2.5 (Now)   | 96%         | 89%      | 15+      | 5/28    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 데이터 흐름

### 6.1 전체 데이터 흐름도

```
┌─────────────────────────────────────────────────────────────┐
│  DATA FLOW ARCHITECTURE                                      │
└─────────────────────────────────────────────────────────────┘

[HEARTBEAT.md (수동 입력)]
        ↓
[파서 (Parser)]
        ↓
[heartbeat_logs 테이블]
        ↓
┌─────────────────────────────────┐
│ Data Processing Pipeline        │
├─────────────────────────────────┤
│ 1. Trust Score 계산             │
│    (신뢰도 = 신뢰도 점수 4가지) │
│ 2. 통계 집계                    │
│    (완료율, 일정준수, etc)      │
│ 3. 트렌드 분석                  │
│    (7일, 30일 이동평균)         │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│ Supabase Tables                 │
├─────────────────────────────────┤
│ • trust_scores                  │
│ • task_logs                     │
│ • portfolio_projects            │
│ • error_logs                    │
│ • team_milestones               │
│ • rules_versions                │
│ • daily_checkpoints             │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│ Next.js API Routes              │
├─────────────────────────────────┤
│ /api/c3po/stats                 │
│ /api/c3po/trust-score           │
│ /api/portfolio                  │
│ /api/error-logs                 │
│ /api/daily-checkpoints          │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│ Frontend Components             │
├─────────────────────────────────┤
│ • Dashboard (charts, KPI)       │
│ • Portfolio (cards, filters)    │
│ • Debug Stories (timeline)      │
│ • Checkpoints (calendar)        │
│ • Rules Timeline (version hist) │
└─────────────────────────────────┘
        ↓
[Browser / User Views]
```

### 6.2 실시간 업데이트 흐름

```
[HEARTBEAT.md 매일 18:00 업데이트]
        ↓
[API: POST /api/c3po/heartbeat] ← C-3PO가 호출
        ↓
[heartbeat_logs 테이블에 INSERT]
        ↓
[트리거: 자동 통계 갱신]
        ↓
[Dashboard: SWR 폴링으로 매 5분 갱신]
        ↓
[사용자에게 최신 신뢰도 표시]
```

---

## 7. Supabase DB 스키마

### 7.1 테이블 정의

#### Table 1: trust_scores
```sql
CREATE TABLE trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  
  -- 4 components
  reliability_score numeric(5,2) NOT NULL,      -- 신뢰도 점수 (0-100)
  completion_rate numeric(5,2) NOT NULL,        -- 완료율 (0-100)
  schedule_adherence numeric(5,2) NOT NULL,     -- 일정준수율 (0-100)
  checkpoint_compliance numeric(5,2) NOT NULL,  -- 체크포인트준수 (0-100)
  
  -- Overall
  overall_trust_score numeric(5,2) GENERATED ALWAYS AS (
    (reliability_score + completion_rate + schedule_adherence + checkpoint_compliance) / 4
  ) STORED,
  
  -- Trend
  trend text CHECK (trend IN ('↑', '↘', '→')),  -- 추이
  trend_percent numeric(5,2),                     -- 변화율
  
  -- Notes
  notes text,
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trust_scores_date ON trust_scores(date DESC);
```

#### Table 2: heartbeat_logs
```sql
CREATE TABLE heartbeat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  checkpoint_time timestamptz NOT NULL,  -- 체크포인트 시간 (e.g. 18:00 KST)
  
  -- Task Status
  total_tasks int NOT NULL,
  completed_tasks int NOT NULL,
  in_progress_tasks int NOT NULL,
  blocked_tasks int NOT NULL,
  
  -- KPIs
  completion_rate numeric(5,2),
  schedule_adherence numeric(5,2),
  reliability_score numeric(5,2),
  
  -- Details
  completed_task_names text[],          -- 완료한 업무 리스트
  blocked_items text[],                 -- 블로킹 항목
  tomorrow_tasks text[],                -- 내일 예정 업무
  
  -- Status
  status text NOT NULL CHECK (status IN ('complete', 'in_progress', 'blocked')),
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_heartbeat_logs_date ON heartbeat_logs(date DESC);
CREATE INDEX idx_heartbeat_logs_checkpoint ON heartbeat_logs(checkpoint_time DESC);
```

#### Table 3: portfolio_projects
```sql
CREATE TABLE portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug text UNIQUE NOT NULL,                    -- URL-friendly ID
  title text NOT NULL,
  description text NOT NULL,
  
  -- Details
  category text NOT NULL,                       -- Asset/Travel/Backup/Discord/etc
  status text NOT NULL CHECK (status IN ('complete', 'in_progress', 'blocked')),
  
  -- Timeline
  start_date date NOT NULL,
  end_date date,
  estimated_completion date,
  duration_days int GENERATED ALWAYS AS (EXTRACT(DAY FROM (end_date - start_date))::int) STORED,
  
  -- Team
  team_members text[],                          -- 팀원 이름
  team_roles jsonb DEFAULT '{}'::jsonb,         -- {name: role, ...}
  
  -- Metrics
  completion_percent numeric(5,2),
  test_coverage numeric(5,2),
  reliability_score numeric(5,2),
  
  -- Content
  full_description text,                        -- Markdown
  key_features jsonb DEFAULT '[]'::jsonb,       -- [{name, description}, ...]
  tech_stack text[],                            -- [Next.js, Supabase, ...]
  
  -- Media
  cover_image_url text,
  demo_url text,
  github_url text,
  docs_url text,
  
  -- Impact
  impact_description text,
  artifacts_count int,                          -- 생성된 파일 수
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_status ON portfolio_projects(status);
CREATE INDEX idx_portfolio_category ON portfolio_projects(category);
CREATE INDEX idx_portfolio_start_date ON portfolio_projects(start_date DESC);
```

#### Table 4: error_logs (Debug Stories)
```sql
CREATE TABLE error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  error_message text NOT NULL,
  
  -- Severity
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'learning')),
  
  -- Details
  discovered_date date NOT NULL,
  resolved_date date,
  duration_hours numeric(8,2) GENERATED ALWAYS AS (
    EXTRACT(HOUR FROM (resolved_date::timestamp - discovered_date::timestamp)) + 
    EXTRACT(DAY FROM (resolved_date::timestamp - discovered_date::timestamp)) * 24
  ) STORED,
  
  -- Content
  error_details text,                   -- JSON or markdown with context
  root_cause text NOT NULL,             -- RCA explanation
  solution text NOT NULL,               -- Solution with code snippets
  learning_points text[],               -- Bulleted learnings
  
  -- Related
  project_id uuid REFERENCES portfolio_projects(id),
  related_error_ids uuid[],             -- Similar errors
  
  -- Links
  github_issue_url text,
  related_code_url text,
  documentation_url text,
  
  -- Metrics
  impact_score numeric(5,2),            -- 1-10: 비즈니스 영향도
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_severity ON error_logs(severity);
CREATE INDEX idx_error_date ON error_logs(discovered_date DESC);
CREATE INDEX idx_error_project ON error_logs(project_id);
```

#### Table 5: daily_checkpoints
```sql
CREATE TABLE daily_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  date date NOT NULL UNIQUE,
  checkpoint_time time NOT NULL DEFAULT '18:00'::time,
  
  -- KPI Snapshot
  trust_score numeric(5,2) NOT NULL,
  completion_rate numeric(5,2) NOT NULL,
  schedule_adherence numeric(5,2) NOT NULL,
  checkpoint_compliance numeric(5,2) NOT NULL,
  
  -- Status Summary
  tasks_completed int NOT NULL,
  tasks_in_progress int NOT NULL,
  tasks_blocked int NOT NULL,
  
  -- Details
  completed_items jsonb DEFAULT '[]'::jsonb,    -- [{name, time}, ...]
  blocked_items jsonb DEFAULT '[]'::jsonb,
  tomorrow_plan text,
  
  -- Notes
  observations text,                    -- Optional notes
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkpoints_date ON daily_checkpoints(date DESC);
CREATE INDEX idx_checkpoints_trust ON daily_checkpoints(trust_score DESC);
```

#### Table 6: team_milestones
```sql
CREATE TABLE team_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  phase text NOT NULL,                          -- Phase A, Phase B, Phase C
  milestone_name text NOT NULL,
  
  -- Timeline
  announcement_date date NOT NULL,
  target_completion_date date NOT NULL,
  actual_completion_date date,
  
  -- Details
  description text,
  new_members_count int,
  new_members_roles text[],
  
  -- Impact
  impact_on_team_size int,              -- -5, +4, +5, etc
  new_capabilities text[],              -- Planner, DevOps, Memory, QA, etc
  
  -- Status
  status text NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'paused')),
  
  -- Links
  onboarding_plan_url text,
  related_phases text[],                -- [Phase A, Phase B, ...]
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_phase ON team_milestones(phase);
CREATE INDEX idx_milestones_date ON team_milestones(announcement_date DESC);
```

#### Table 7: rules_versions
```sql
CREATE TABLE rules_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Version ID
  version_number text NOT NULL UNIQUE,          -- v2.5, v2.4, v2.3, etc
  version_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'superseded', 'deprecated')),
  
  -- Content
  rule_title text NOT NULL,
  rule_description text,
  core_rules text[],                    -- ["Rule 1", "Rule 2", ...]
  
  -- Effectiveness
  trust_score_change numeric(5,2),      -- +7, -2, etc
  schedule_change numeric(5,2),
  team_size_at_version int,
  
  -- Relationships
  supersedes_version text REFERENCES rules_versions(version_number),
  
  -- Links
  github_issue_url text,
  discussion_url text,
  documentation_url text,
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rules_version ON rules_versions(version_number DESC);
CREATE INDEX idx_rules_status ON rules_versions(status);
```

### 7.2 Relationships & Indexes

```
trust_scores ─────┐
                  ├─→ daily_checkpoints (date)
heartbeat_logs ───┘

portfolio_projects ←─── error_logs (project_id FK)

team_milestones (standalone)

rules_versions ←──── supersedes (self-reference)
```

---

## 8. 컴포넌트 아키텍처

### 8.1 컴포넌트 트리

```
App Layout (app/layout.tsx)
├─ Navigation (top bar + sidebar)
│  ├─ Logo & Branding
│  ├─ Nav Menu (7 items)
│  ├─ Theme Toggle
│  └─ Quick Stats (mini KPI)
│
├─ Main Content Area
│  ├─ Home Page (/)
│  │  ├─ Hero Section
│  │  ├─ Quick Stats Cards (4)
│  │  ├─ CTA Buttons
│  │  └─ Featured Sections (3)
│  │
│  ├─ Dashboard Page (/dashboard)
│  │  ├─ Top Metrics (4 KPI cards)
│  │  ├─ Charts Container
│  │  │  ├─ Trust Score Trend (Line)
│  │  │  ├─ Completion Rate (Bar)
│  │  │  ├─ Daily Tasks (Bar)
│  │  │  └─ Team Growth (Area)
│  │  ├─ Status Lists
│  │  │  ├─ In Progress
│  │  │  ├─ Blocked
│  │  │  └─ Completed This Week
│  │  └─ Quick Actions
│  │
│  ├─ Portfolio Page (/portfolio)
│  │  ├─ Filter & Sort Bar
│  │  ├─ Portfolio List
│  │  │  ├─ Complete Projects (6 cards)
│  │  │  ├─ In Progress (5 cards)
│  │  │  └─ Pagination
│  │  └─ Project Card Component
│  │     ├─ Header (image + title)
│  │     ├─ Status Badge
│  │     ├─ Description
│  │     ├─ Tech Stack Tags
│  │     ├─ Key Features
│  │     └─ CTA Buttons
│  │
│  ├─ Project Detail (/portfolio/[id])
│  │  ├─ Hero Section (large image + title)
│  │  ├─ Status & Timeline
│  │  ├─ KPI Stats (8 cards)
│  │  ├─ Description Sections
│  │  │  ├─ Overview
│  │  │  ├─ Tech Stack
│  │  │  ├─ Key Features
│  │  │  ├─ Journey & Learnings
│  │  │  └─ Timeline
│  │  └─ Related Links
│  │
│  ├─ Debug Stories (/debug-stories)
│  │  ├─ Filter Bar (severity, category)
│  │  ├─ Story Cards List
│  │  │  ├─ Severity Badge
│  │  │  ├─ Error Title
│  │  │  ├─ Error Message
│  │  │  ├─ Root Cause
│  │  │  ├─ Solution
│  │  │  ├─ Learning Points
│  │  │  └─ Links
│  │  └─ Pagination
│  │
│  ├─ Daily Checkpoints (/daily-checkpoints)
│  │  ├─ Calendar Mini View
│  │  ├─ Checkpoint List
│  │  │  ├─ Date Selector
│  │  │  ├─ Checkpoint Card
│  │  │  │  ├─ KPI Summary
│  │  │  │  ├─ Task Lists
│  │  │  │  └─ Notes
│  │  │  └─ Timeline View (optional)
│  │  └─ Export Actions
│  │
│  ├─ Team Milestones (/team-milestones)
│  │  ├─ Timeline Visualization
│  │  ├─ Phase Cards
│  │  │  ├─ Phase Name & Date
│  │  │  ├─ New Members
│  │  │  ├─ New Capabilities
│  │  │  └─ Status
│  │  ├─ Team Composition Pie Chart
│  │  └─ Growth Stats
│  │
│  ├─ Rules Evolution (/rules-evolution)
│  │  ├─ Timeline View
│  │  ├─ Rule Version Cards
│  │  │  ├─ Version Number & Status
│  │  │  ├─ Core Rules
│  │  │  ├─ Impact Metrics
│  │  │  └─ Why Changed
│  │  ├─ Effectiveness Table
│  │  └─ Relationships
│  │
│  └─ About (/about)
│     ├─ C-3PO Bio
│     ├─ Technology Stack
│     ├─ Development History
│     └─ Contact/Links
│
└─ Footer
   ├─ Copyright
   ├─ Last Updated
   └─ Links
```

### 8.2 재사용 컴포넌트

```
components/
├─ KPICard.tsx
│  Props: label, value, unit, trend, color
│  Used in: Dashboard, Checkpoints
│
├─ TrendChart.tsx (Recharts wrapper)
│  Props: data, title, type (line/bar/area)
│  Used in: Dashboard, Project Detail
│
├─ ProjectCard.tsx
│  Props: project, onClick, variant
│  Used in: Portfolio, Home
│
├─ ErrorCard.tsx
│  Props: error, onExpand
│  Used in: Debug Stories
│
├─ CheckpointCard.tsx
│  Props: checkpoint, expanded
│  Used in: Daily Checkpoints
│
├─ FilterBar.tsx
│  Props: filters, onFilter, onSort
│  Used in: Portfolio, Debug Stories
│
├─ StatusBadge.tsx
│  Props: status, size
│  Used in: All pages with status display
│
├─ Timeline.tsx
│  Props: events, variant (vertical/horizontal)
│  Used in: Team Milestones, Rules Evolution
│
├─ Navigation.tsx (Header + Sidebar)
│  Global component
│
├─ Footer.tsx
│  Global component
│
└─ SEO.tsx (Next.js Metadata)
   Used in: All pages
```

---

## 9. API 명세

### 9.1 API 엔드포인트

#### 1. Trust Score Endpoints

```
GET /api/c3po/trust-score
Response:
{
  "date": "2026-05-28",
  "reliability_score": 96,
  "completion_rate": 70,
  "schedule_adherence": 89,
  "checkpoint_compliance": 100,
  "overall_trust_score": 88.75,
  "trend": "↑",
  "trend_percent": 1,
  "notes": "Strong compliance despite schedule challenges"
}

GET /api/c3po/trust-score/history?days=30
Response:
[
  { date, trust_score, trend, ... },
  ...
]
```

#### 2. Portfolio Endpoints

```
GET /api/portfolio
Query: ?status=complete&category=Asset&limit=10&offset=0
Response:
{
  "total": 6,
  "items": [
    {
      "id": "uuid",
      "slug": "asset-master-p2",
      "title": "Asset Master Phase 2",
      "status": "complete",
      "start_date": "2026-05-18",
      "end_date": "2026-05-28",
      "completion_percent": 100,
      "tech_stack": ["Next.js", "Supabase"],
      "team_members": ["Web-Builder #1", "Data-Analyst #1"],
      ...
    },
    ...
  ]
}

GET /api/portfolio/[id]
Response: { full project details }

POST /api/portfolio
Body: { title, description, category, start_date, ... }
Response: { created project }
```

#### 3. Error Logs / Debug Stories

```
GET /api/error-logs
Query: ?severity=critical&from_date=2026-05-01&limit=10
Response:
{
  "total": 47,
  "items": [
    {
      "id": "uuid",
      "slug": "db-35-rls-policy",
      "title": "db/35 RLS Policy Misconfiguration",
      "severity": "critical",
      "error_message": "403 Forbidden",
      "root_cause": "RLS policy not set",
      "solution": "ALTER TABLE audit_event_logs...",
      "learning_points": ["RLS fail-safe", "Policy validation"],
      "duration_hours": 2.5,
      ...
    },
    ...
  ]
}
```

#### 4. Daily Checkpoints

```
GET /api/daily-checkpoints
Query: ?from=2026-05-01&to=2026-05-28
Response:
{
  "items": [
    {
      "id": "uuid",
      "date": "2026-05-28",
      "trust_score": 96,
      "completion_rate": 70,
      "tasks_completed": 7,
      "tasks_in_progress": 0,
      "completed_items": [
        { "name": "AUTOMATION-SPECIALIST", "time": "08:01" },
        ...
      ],
      ...
    },
    ...
  ]
}

GET /api/daily-checkpoints/[date]
Response: { checkpoint for specific date }
```

#### 5. Team Milestones

```
GET /api/team-milestones
Response:
{
  "items": [
    {
      "id": "uuid",
      "phase": "Phase A",
      "milestone_name": "Initial Expansion",
      "announcement_date": "2026-05-26",
      "new_members_count": 4,
      "new_members_roles": ["Planner", "DevOps", "Memory", "QA"],
      "status": "in_progress",
      ...
    },
    ...
  ]
}
```

#### 6. Rules Versions

```
GET /api/rules-versions
Response:
{
  "items": [
    {
      "version_number": "v2.5",
      "status": "active",
      "rule_title": "Unified Autonomous Operation",
      "core_rules": [
        "Technical work proceeds immediately",
        "API/token automation direct",
        ...
      ],
      "trust_score_change": 7,
      ...
    },
    ...
  ]
}
```

### 9.2 Heartbeat 자동 업로드

```
POST /api/c3po/heartbeat
Body (C-3PO가 호출):
{
  "date": "2026-05-28",
  "checkpoint_time": "2026-05-28T18:00:00Z",
  "total_tasks": 10,
  "completed_tasks": 7,
  "in_progress_tasks": 0,
  "blocked_tasks": 1,
  "completion_rate": 70,
  "schedule_adherence": 89,
  "reliability_score": 96,
  "completed_task_names": [
    "AUTOMATION-SPECIALIST",
    "WEB-DEV-SUPPORT",
    ...
  ],
  "blocked_items": ["URGENT-GH-SECRET"],
  "tomorrow_tasks": [...]
}

Response:
{
  "success": true,
  "heartbeat_id": "uuid",
  "trust_score_calculated": 88.75,
  "message": "Checkpoint logged successfully"
}
```

---

## 10. 개발 로드맵 & 마일스톤

### 10.1 Phase 별 일정

```
PHASE 1: FOUNDATION (Week 1 ~ 2 | 2026-05-28 ~ 2026-06-10)
┌──────────────────────────────────────────────────────────┐
│ Goal: Core pages + Supabase setup                         │
│ Duration: 2 weeks                                         │
└──────────────────────────────────────────────────────────┘

Week 1 (2026-05-28 ~ 2026-06-03):
- Day 1-2 (05-28 ~ 05-29): 환경 설정 + DB 스키마 생성
  • Supabase 프로젝트 설정
  • 7개 테이블 생성 (trust_scores, heartbeat_logs, ...)
  • RLS 정책 설정
  • 초기 데이터 입력

- Day 3-4 (05-30 ~ 05-31): 홈 페이지 + 대시보드 구축
  • Home page (/): Hero + Featured sections
  • Dashboard page (/dashboard): KPI cards + charts
  • Navigation & Layout component

- Day 5 (06-01): 포트폴리오 페이지
  • Portfolio list (/portfolio)
  • Project cards component
  • Filter & sort logic

- Day 6-7 (06-02 ~ 06-03): 배포 & 테스트
  • Vercel 배포 설정
  • E2E 테스트
  • Performance audit

Week 2 (2026-06-04 ~ 2026-06-10):
- Day 8-9 (06-04 ~ 06-05): 상세 페이지
  • Project detail page (/portfolio/[id])
  • Debug stories (/debug-stories)
  • Story detail page

- Day 10-11 (06-06 ~ 06-07): 추가 페이지
  • Daily checkpoints (/daily-checkpoints)
  • Team milestones (/team-milestones)
  • Rules evolution (/rules-evolution)

- Day 12-13 (06-08 ~ 06-09): 통합 & 최적화
  • API 통합 검증
  • 성능 최적화 (이미지 lazy loading, etc)
  • 반응형 디자인 완벽화

- Day 14 (06-10): 최종 배포
  • Production build & deploy
  • 사용자 테스트
  • CEO 검증 & 승인

PHASE 2: FEATURES & AUTOMATION (Week 3 ~ 4 | 2026-06-11 ~ 2026-06-24)
┌──────────────────────────────────────────────────────────┐
│ Goal: 자동 데이터 업로드 + 실시간 갱신                   │
│ Duration: 2 weeks                                         │
└──────────────────────────────────────────────────────────┘

- Heartbeat 자동 파싱 (HEARTBEAT.md → DB)
- 신뢰도 자동 계산 (Trust Score Calculator)
- 실시간 SWR 갱신 (5분 폴링)
- 웹훅 통합 (GitHub, Discord)

PHASE 3: POLISH & SCALE (Week 5 | 2026-06-25 ~ 2026-07-01)
┌──────────────────────────────────────────────────────────┐
│ Goal: Dark mode + Analytics + SEO                         │
│ Duration: 1 week                                          │
└──────────────────────────────────────────────────────────┘

- Dark mode 구현
- Google Analytics 통합
- SEO 최적화 (메타데이터, sitemap)
- 성능 모니터링 (Web Vitals)
```

### 10.2 주요 마일스톤

| 날짜 | 마일스톤 | 상태 | 체크리스트 |
|------|---------|------|----------|
| 2026-05-28 | 설계 완료 | ✅ | 이 문서 |
| 2026-05-30 | DB 스키마 ✅ | 🟡 | 7개 테이블 + RLS |
| 2026-06-03 | Phase 1 완료 | 🟡 | Home + Dashboard + Portfolio |
| 2026-06-10 | MVP 배포 | 🟡 | 모든 페이지 + 기본 기능 |
| 2026-06-15 | Phase 2 완료 | ⚪ | 자동화 + 실시간 갱신 |
| 2026-06-24 | Phase 3 완료 | ⚪ | Polish + Analytics |

---

## 11. 엣지 케이스 & 에러 처리

### 11.1 데이터 부재 시

**상황:** 신뢰도 데이터가 아직 없을 때 (첫 배포 직후)

```
// Home page
Hero section → 신뢰도 대신 "Coming soon" 표시
Dashboard → Empty state with info icon

// 구현
<EmptyState
  icon="chart"
  title="데이터 수집 중"
  message="첫 체크포인트를 기다리고 있습니다. 2026-05-28 18:00을 기대하세요."
/>
```

### 11.2 네트워크 에러

**상황:** API 요청 실패

```javascript
// API 호출
try {
  const data = await fetch('/api/c3po/trust-score');
  if (!data.ok) throw new Error('API error');
} catch (error) {
  return <ErrorState message="데이터 로드 실패. 잠시 후 다시 시도해주세요." />
}

// UI 표시
<button onClick={() => window.location.reload()}>
  다시 시도
</button>
```

### 11.3 권한 없음

**상황:** 로그인 필요 (향후 구현)

```javascript
// Middleware check
if (!user) {
  redirect('/login');
}
```

### 11.4 성능 저하

**상황:** 차트에 데이터가 많음 (30일+ 신뢰도 기록)

```javascript
// Pagination/분해
const CHUNK_SIZE = 7;
const weeks = data.chunk(CHUNK_SIZE);  // 주간으로 분해

// 또는 요약
const summary = {
  min: Math.min(...data),
  max: Math.max(...data),
  avg: data.reduce((a,b) => a+b) / data.length,
};
```

### 11.5 오래된 데이터

**상황:** 3개월 이상 전 데이터는 조회 불가

```javascript
// Validation
if (date < new Date().setMonth(new Date().getMonth() - 3)) {
  return <ErrorState message="3개월 이상 전 데이터는 보관되지 않습니다." />
}
```

### 11.6 부정확한 URL

**상황:** `/portfolio/invalid-id` 접근

```javascript
// [id]/page.tsx
const project = await getProject(params.id);
if (!project) {
  notFound();  // Next.js 404 page
}
```

---

## 12. 성능 & 보안 고려사항

### 12.1 성능 최적화

```
1. 이미지 최적화
   • Next.js Image component 사용 (자동 최적화)
   • Vercel Image Optimization
   • WebP format + lazy loading

2. 데이터 페칭
   • SWR for client-side data fetching (�싱 + 폴링)
   • Server-side rendering for initial load
   • Incremental Static Regeneration (ISR) for stable pages

3. 번들 최적화
   • Code splitting (dynamic imports)
   • Tree shaking (unused code removal)
   • Minification (production build)

4. 데이터베이스 성능
   • Indexes on frequently queried columns (date, status, ...)
   • Connection pooling (Supabase)
   • Query result caching (Redis optional)

메트릭 목표:
• First Contentful Paint (FCP): < 1.5s
• Largest Contentful Paint (LCP): < 2.5s
• Cumulative Layout Shift (CLS): < 0.1
• Lighthouse Score: 90+ (performance)
```

### 12.2 보안

```
1. 인증
   • Supabase Auth (JWT tokens)
   • Row-level security (RLS) for all tables
   • API key rotation

2. 데이터 보호
   • HTTPS only (Vercel enforces)
   • No sensitive data in logs
   • Environment variables for secrets

3. 접근 제어
   • Public: Home, Portfolio, Debug Stories (누구나 읽음)
   • Internal: Dashboard, Checkpoints (CEO + 팀원만)
   • Admin: Settings, Data management (C-3PO + CEO만)

4. 입력 검증
   • Zod schema validation (client + server)
   • SQL injection prevention (Supabase parameterized queries)
   • XSS prevention (React auto-escaping)

5. 감시
   • Error logging (Sentry or similar)
   • Performance monitoring
   • Audit trail for data changes
```

---

## 13. 추가 고려사항

### 13.1 국제화 (i18n)

```
현재: 영어 + 한국어

구조:
• 한국어: CEO, 팀원 (관리자 대시보드)
• 영어: 포트폴리오, 기술 세부사항 (대외 공개)

구현:
• next-intl 라이브러리 (optional for future)
• 현재: 하드코딩된 한국어/영어 (필요시만 변환)
```

### 13.2 다크 모드

```
Phase 1: Light mode only (2026-06-10)
Phase 3: Dark mode 추가 (2026-06-25)

구현:
• next-themes 라이브러리
• Tailwind dark: prefix
• Preference 저장 (localStorage)
```

### 13.3 모바일 최적화

```
원칙: Mobile-first design

체크리스트:
✓ Responsive breakpoints (320px, 640px, 1024px, 1280px)
✓ Touch-friendly buttons (48px minimum)
✓ Readable font sizes (16px+ for body text)
✓ Fast loading on slow networks (optimization)
```

### 13.4 SEO

```
Meta tags for each page:
• Title: "C-3PO Portfolio | 프로토콜 드로이드 포트폴리오"
• Description: "AI assistant 신뢰도 96% 포트폴리오..."
• Keywords: "C-3PO, AI, 포트폴리오, 신뢰도, DSC FMS"
• OG image: Hero image for social sharing

Sitemap & robots.txt
Open Graph tags for social sharing
Schema.org structured data
```

---

## 최종 체크리스트

### 웹개발자에게 전달 전 확인사항

- [x] 설계 문서 완성 (이 문서)
- [x] Supabase 테이블 스키마 명확
- [x] API 엔드포인트 명확
- [x] 페이지 와이어프레임 상세
- [x] 컴포넌트 구조 명확
- [x] 라우팅 구조 정의
- [x] 데이터 흐름 시각화
- [x] 엣지 케이스 정의
- [x] 개발 로드맵 (2주)
- [x] 성능 목표 설정
- [x] 보안 체크리스트

### 웹개발자 시작 전 필수사항

1. **GitHub 리포지토리 준비**
   ```bash
   mkdir c3po-portfolio
   git init
   git branch -b feature/initial-setup
   ```

2. **Supabase 프로젝트 생성**
   - 새 Supabase 프로젝트 (또는 기존 dsc-fms-portal에 추가)
   - SQL 에디터에서 스키마 파일 실행
   - RLS 정책 활성화

3. **Next.js 프로젝트 초기화**
   ```bash
   npx create-next-app@latest c3po-portfolio --typescript --tailwind
   ```

4. **의존성 설치**
   ```bash
   npm install @supabase/supabase-js recharts swr zod next-intl
   ```

---

**설계 완료일:** 2026-05-28 18:00 KST  
**문서 크기:** 650줄  
**준비 상태:** ✅ 웹개발자 구현 준비 완료

**다음 단계:** 웹개발자(Web-Builder) 배치 → Phase 1 구현 시작 (2026-05-28 또는 2026-06-01)
