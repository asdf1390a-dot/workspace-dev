# JEEPNEY Personal Backup App — Phase 1 설계서

> **상태:** 최종 설계 (구현 준비 완료)  
> **작성일:** 2026-05-13  
> **담당:** 플레너 (설계자)  
> **대상:** 웹개발자 (구현), 평가자 (검증)  
> **범위:** Phase 1 (UI 프레임워크 + 메인 페이지 + 개인이력 기초)

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [Phase 1 범위](#2-phase-1-범위)
3. [설계 시스템 (상속)](#3-설계-시스템-상속)
4. [Phase 1 페이지 명세](#4-phase-1-페이지-명세)
5. [컴포넌트 구현 계획](#5-컴포넌트-구현-계획)
6. [DB 스키마 (Phase 1)](#6-db-스키마-phase-1)
7. [API 엔드포인트 (Phase 1)](#7-api-엔드포인트-phase-1)
8. [개발 타임라인](#8-개발-타임라인)
9. [검증 기준](#9-검증-기준)

---

## 1. 프로젝트 개요

### 1.1 JEEPNEY Personal Portal 소개

**JEEPNEY:** "전 생활을 한곳에" — 개인 + 업무 통합 포탈

```
┌──────────────────────────────────────────┐
│           JEEPNEY Portal                 │
├──────────────────────────────────────────┤
│                                          │
│  📱 Personal Home                        │  ← Phase 1 포함
│     • 개인 이력 관리                     │
│     • 경력, 프로젝트, 성과 타임라인     │
│                                          │
│  🏭 DSC HUB (기존)                       │  ← 기존 기능
│     • FMS: 설비 관리, BM, PM, KPI       │
│     • Travel: 출장 기록 (Phase 4)       │
│                                          │
│  ⚙️ Settings (기존)                      │  ← 기존 기능
│     • 프로필, 언어, 테마, 알림           │
│                                          │
└──────────────────────────────────────────┘
```

### 1.2 Phase 1 목표

**🎯 Core Objective:**
사용자의 개인 이력(경력, 프로젝트, 성과)을 시각적으로 관리하고 타임라인으로 표현하는 기초 플랫폼 구축

**📊 핵심 가치:**

| 항목 | 설명 |
|------|------|
| **통합성** | 경력, 프로젝트, 성과를 한곳에서 관리 |
| **시각화** | 타임라인 + 카드 기반 직관적 UI |
| **확장성** | Phase 2-3에서 추가 기능 수용 가능 |
| **모바일 최적** | 인도 현장 접근 고려 |

### 1.3 Phase 1 포함/제외사항

**✅ Phase 1에 포함:**
- JEEPNEY 메인 홈 페이지 (/)
- 개인이력 Hub (/jeepney-personal)
- 회사 목록 + 상세 페이지
- 프로젝트 목록 + 상세 페이지
- 성과 목록 + 상세 페이지
- 타임라인 뷰
- 기본 UI 컴포넌트 라이브러리
- 설정 페이지 (기본)

**❌ Phase 1에 제외 (Phase 2+):**
- 여행기록 (Travel Records) → Phase 4
- 소셜 공유 기능 → Phase 3
- 고급 검색/필터 → Phase 2
- 다국어 다국어 지원 → Phase 3
- 오프라인 모드 → Phase 5

---

## 2. Phase 1 범위

### 2.1 기능 요구사항 (FR)

**FR-001: 개인이력 조회**
- ID: FR-001
- 설명: 사용자는 자신의 전체 경력, 프로젝트, 성과를 타임라인 또는 목록으로 볼 수 있어야 한다.
- 우선순위: 🔴 **Critical**
- 수용 조건:
  - [ ] Given: 사용자가 로그인함, When: /jeepney-personal 방문, Then: 타임라인 표시
  - [ ] Given: 타임라인이 표시됨, When: 항목 클릭, Then: 상세 정보 표시

**FR-002: 회사/프로젝트/성과 추가**
- ID: FR-002
- 설명: 사용자는 새로운 회사, 프로젝트, 성과를 추가할 수 있어야 한다.
- 우선순위: 🔴 **Critical**
- 수용 조건:
  - [ ] Given: [+ Add] 버튼 클릭, When: 폼 표시, Then: 데이터 입력 후 저장 가능
  - [ ] Given: 필수값 미입력, When: 저장 버튼 클릭, Then: 에러 메시지 표시

**FR-003: 회사/프로젝트/성과 편집**
- ID: FR-003
- 설명: 사용자는 기존 항목을 수정할 수 있어야 한다.
- 우선순위: 🟡 **High**
- 수용 조건:
  - [ ] Given: 상세 페이지, When: 편집 버튼 클릭, Then: 폼 열림 (기존값 미리 채워짐)

**FR-004: 회사/프로젝트/성과 삭제**
- ID: FR-004
- 설명: 사용자는 항목을 삭제할 수 있어야 한다.
- 우선순위: 🟡 **High**
- 수용 조건:
  - [ ] Given: 상세 페이지, When: 삭제 버튼 클릭, Then: 확인 모달 표시
  - [ ] Given: 확인 모달, When: "삭제" 클릭, Then: 항목 삭제 + 목록으로 이동

### 2.2 비기능 요구사항 (NFR)

| NFR | 목표 | 검증 방법 |
|-----|------|----------|
| **성능** | 페이지 로드 < 2초 (모바일 3G) | Lighthouse |
| **반응형** | Mobile (320px), Tablet (768px), Desktop (1024px) | 수동 테스트 |
| **접근성** | WCAG 2.1 AA | axe DevTools |
| **보안** | RLS 기반 권한 제어 | SQL 검증 |
| **가용성** | 99.5% uptime | Vercel 모니터링 |

---

## 3. 설계 시스템 (상속)

JEEPNEY는 기존 DSC FMS Portal의 디자인 시스템을 상속하며, 다음과 같이 확장합니다:

### 3.1 색상 팔레트 (기존 유지)

**Dark Theme (기본):**

```
Primary Background:    #0f172a  (Very Dark Slate)
Secondary Background:  #1e293b  (Dark Slate)
Border:                #334155  (Slate-700)
Text Primary:          #f8fafc  (Slate-50)
Text Secondary:        #cbd5e1  (Slate-400)
Text Tertiary:         #64748b  (Slate-500)

Accent Primary:        #06b6d4  (Cyan) ← CTA
Accent Secondary:      #a78bfa  (Violet) ← Personal
Accent Tertiary:       #3b82f6  (Blue)

Status Success:        #10b981  (Emerald)
Status Warning:        #f59e0b  (Amber)
Status Error:          #ef4444  (Red)
Status Info:           #3b82f6  (Blue)
```

### 3.2 타이포그래피 (기존 유지)

```
H1 (Page Title):    32px / 700 / 1.2
H2 (Section):       24px / 600 / 1.3
H3 (Subsection):    20px / 600 / 1.4
H4 (Card Title):    16px / 600 / 1.5
Body:               14px / 400 / 1.6
Small:              12px / 400 / 1.5
Label:              11px / 600 / 1.4

Font Stack:
  한글: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif
  영어: "Inter", -apple-system, sans-serif
  코드: "Menlo", "Monaco", "Courier New", monospace
```

### 3.3 간격 시스템 (기존 유지)

```css
--space-xs: 4px
--space-sm: 8px
--space-md: 12px
--space-lg: 16px
--space-xl: 20px
--space-2xl: 24px
--space-3xl: 32px
--space-4xl: 40px
```

### 3.4 컴포넌트 설계 원칙

**1. 단순성 (Simplicity)**
- 불필요한 장식 제거
- 명확한 CTA (Call-To-Action)
- 3 클릭 이내에 주요 기능 도달

**2. 일관성 (Consistency)**
- 모든 페이지가 동일한 헤더, 푸터 구조
- 동일한 버튼 스타일, 카드 레이아웃
- 색상/타이포 일관성

**3. 반응형 (Responsive)**
- Mobile First 디자인
- 모바일 (320px+), 태블릿 (768px+), 데스크톱 (1024px+) 지원
- 터치 친화적 (버튼 최소 44px)

**4. 접근성 (Accessibility)**
- 명도 대비 WCAG AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환성

---

## 4. Phase 1 페이지 명세

### 4.1 페이지 계층 구조

```
/ (JEEPNEY 홈)
├── Header: JeepneyHeader (로고, 메인 탭)
├── Content: 홈 대시보드 (앱 카드)
├── Footer: BottomNav (5개 탭)

/jeepney-personal (개인이력 Hub)
├── Header: JeepneyHeader
├── SubNav: PersonalTabNav (Timeline | Companies | Projects | Achievements)
├── Content: 각 탭별 콘텐츠
└── Footer: BottomNav

/jeepney-personal/career/companies (회사 목록)
├── Header: JeepneyHeader
├── SubNav: PersonalTabNav
├── Content:
│   ├── Search Bar
│   ├── [+ New Company] 버튼
│   └── Company Cards (카드 리스트)
└── Footer: BottomNav

/jeepney-personal/career/companies/[id] (회사 상세)
├── Header: JeepneyHeader
├── Breadcrumb: Home > Personal > Companies > [Company Name]
├── Content:
│   ├── 회사 정보 (로고, 이름, 위치, 설명)
│   ├── [Edit] [Delete] 버튼
│   └── 연관 프로젝트 목록 (선택)
└── Footer: BottomNav

/jeepney-personal/career/companies/new (회사 추가)
├── Header: JeepneyHeader
├── Breadcrumb: ... > Add Company
├── Content:
│   ├── 폼:
│   │   ├── Company Name (필수)
│   │   ├── Industry
│   │   ├── Logo URL
│   │   ├── Website URL
│   │   ├── Location
│   │   └── Notes
│   └── [Cancel] [Save] 버튼
└── Footer: BottomNav

[프로젝트/성과도 동일한 구조]
```

### 4.2 홈 페이지 (/)

**목적:** JEEPNEY 포탈의 진입점

**레이아웃:**

```
┌──────────────────────────────────────────┐
│ JeepneyHeader                            │
│ (로고 + 메인 탭 [DSC HUB | Personal | ...])
├──────────────────────────────────────────┤
│                                          │
│  Welcome, [User]!                        │
│  Last Updated: [datetime]                │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ 📊 DSC HUB                       │   │
│  │ 설비, 보전, KPI 관리             │   │
│  │ [→ Go to DSC HUB]                │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ 📋 Personal History              │   │
│  │ 경력, 프로젝트, 성과             │   │
│  │ [→ Go to Personal]               │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ ✈️ Travel Records                │   │
│  │ 출장 기록 관리 (Coming Soon)     │   │
│  │ [→ Coming in Phase 4]            │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Recent Activity:                        │
│  • 프로젝트 1건 추가됨 (2시간 전)       │
│  • 회사 정보 업데이트됨 (1일 전)        │
│  • 성과 1건 추가됨 (3일 전)             │
│                                          │
├──────────────────────────────────────────┤
│ BottomNav                                │
└──────────────────────────────────────────┘
```

**컴포넌트:**
- `WelcomeCard` — 인사말 + 마지막 업데이트
- `AppCard` (3개) — DSC HUB, Personal, Travel 바로가기
- `RecentActivityFeed` — 최근 활동 피드

**데이터 출처:**
- `user_profiles` (사용자 이름)
- `user_companies`, `user_projects`, `user_achievements` (updated_at 기반 최신 활동)

### 4.3 개인이력 Hub (/jeepney-personal)

**목적:** 경력 + 프로젝트 + 성과 통합 보기

**기본 뷰: Timeline**

```
┌──────────────────────────────────────────┐
│ JeepneyHeader                            │
├──────────────────────────────────────────┤
│ [Timeline] [Companies] [Projects] [Achievements] │  ← 탭
├──────────────────────────────────────────┤
│                                          │
│  2026年 May  ━━━━━━━━━━━━━━━━━━         │
│              │ 🎯 Project A 진행 중     │
│              │ (Daechang Seat)          │
│              │ "IoT 인프라 구축"        │
│              │ [View]                   │
│              │                          │
│  2026年 Mar  ━━━━━━━━━━━━━━━━━━         │
│              │ 🏢 Company Updated      │
│              │ (Daechang Seat)          │
│              │ Chennai로 이전           │
│              │                          │
│  2025年 Dec  ━━━━━━━━━━━━━━━━━━         │
│              │ 🎓 Achievement           │
│              │ "Lean Six Sigma Green"   │
│              │ (2025-12)                │
│              │                          │
│  2025年 Jan  ━━━━━━━━━━━━━━━━━━         │
│              │ 🏢 Join Daechang Seat   │
│              │ GM (현직)                │
│              │ Production, Tech, ...    │
│              │ [View]                   │
│              │                          │
│  [Load More]                             │
│                                          │
├──────────────────────────────────────────┤
│ BottomNav (Personal [활성] | ...)        │
└──────────────────────────────────────────┘
```

**컴포넌트:**
- `PersonalTabNav` — 4개 탭
- `TimelineItem` — 항목별 카드
- `FAB` (Floating Action Button) — [+ Add New]

**탭별 전환:**

| 탭 | URL | 콘텐츠 |
|-----|------|--------|
| Timeline | /jeepney-personal | 시간순 타임라인 |
| Companies | /jeepney-personal/career/companies | 회사 목록 |
| Projects | /jeepney-personal/career/projects | 프로젝트 목록 |
| Achievements | /jeepney-personal/career/achievements | 성과/스킬 목록 |

### 4.4 회사 목록 (/jeepney-personal/career/companies)

**레이아웃:**

```
┌──────────────────────────────────────────┐
│ JeepneyHeader                            │
├──────────────────────────────────────────┤
│ [Timeline] [Companies] [Projects] [Achievements] │
├──────────────────────────────────────────┤
│                                          │
│ [Search...] [+ New Company]              │
│                                          │
│ ┌──────────────────────────────────┐   │
│ │ 🏢 Daechang Seat (Chennai)       │   │
│ │                                  │   │
│ │ Position: GM                     │   │
│ │ Industry: Automotive Parts       │   │
│ │ Duration: Jan 2025 - Present     │   │
│ │                                  │   │
│ │ "전자동 부품 생산 관리"          │   │
│ │                                  │   │
│ │ 📊 3 Projects | ⭐ 2 Achievements│   │
│ │                                  │   │
│ │ [View] [Edit]                    │   │
│ └──────────────────────────────────┘   │
│                                          │
│ ┌──────────────────────────────────┐   │
│ │ 🏢 Previous Company              │   │
│ │ (Legend의 내용)                  │   │
│ │ [View] [Edit]                    │   │
│ └──────────────────────────────────┘   │
│                                          │
│ [Load More]                              │
│                                          │
├──────────────────────────────────────────┤
│ BottomNav                                │
└──────────────────────────────────────────┘
```

**컴포넌트:**
- `SearchBar` — 회사명 검색
- `CompanyCard` — 개별 회사 카드
  - 로고 (선택)
  - 회사명 + 위치
  - 직책 + 기간
  - 설명
  - 연관 프로젝트/성과 카운트
  - [View], [Edit] 버튼

### 4.5 회사 상세 (/jeepney-personal/career/companies/[id])

**레이아웃:**

```
┌──────────────────────────────────────────┐
│ JeepneyHeader                            │
├──────────────────────────────────────────┤
│ Home > Personal > Companies > Daechang   │  ← Breadcrumb
├──────────────────────────────────────────┤
│                                          │
│  [로고]  Daechang Seat                   │
│                                          │
│  기본 정보:                              │
│  • 위치: Chennai, India                  │
│  • 산업: Automotive Parts                │
│  • 웹사이트: www.daechang.com            │
│  • 설명: "전자동 부품 공급..."           │
│                                          │
│  역할:                                   │
│  • 직책: General Manager (GM)            │
│  • 부서: Production, Tech, Maintenance   │
│  • 기간: Jan 2025 - Present              │
│                                          │
│  연관 항목:                              │
│  ┌──────────────────────────────┐        │
│  │ 프로젝트:                    │        │
│  │ • IoT Infrastructure         │        │
│  │ • BM Process Automation      │        │
│  │ • Supply Chain Optimization  │        │
│  └──────────────────────────────┘        │
│                                          │
│  [Edit] [Delete]                         │
│                                          │
├──────────────────────────────────────────┤
│ BottomNav                                │
└──────────────────────────────────────────┘
```

**컴포넌트:**
- `CompanyHeader` — 로고 + 제목
- `InfoSection` — 기본 정보 테이블
- `RoleSection` — 직책/부서/기간
- `RelatedItems` — 연관 프로젝트 목록
- `ActionButtons` — [Edit], [Delete]

### 4.6 회사 추가/편집 (/jeepney-personal/career/companies/new 또는 /[id]/edit)

**레이아웃:**

```
┌──────────────────────────────────────────┐
│ JeepneyHeader                            │
├──────────────────────────────────────────┤
│ Home > Personal > Companies > New        │
├──────────────────────────────────────────┤
│                                          │
│  Add New Company                         │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Company Name *                   │   │
│  │ [______________________]         │   │
│  │ e.g. "Daechang Seat"             │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Industry                         │   │
│  │ [____________________▼]          │   │
│  │ (Automotive, IT, Manufacturing) │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Logo URL                         │   │
│  │ [__________________________]     │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Website                          │   │
│  │ [__________________________]     │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Location                         │   │
│  │ [__________________________]     │   │
│  │ e.g. "Chennai, India"            │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Notes                            │   │
│  │ [____________________            │   │
│  │  ____________________            │   │
│  │  ____________________]           │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [Cancel] [Save]                         │
│                                          │
├──────────────────────────────────────────┤
│ BottomNav                                │
└──────────────────────────────────────────┘
```

**폼 필드:**

| 필드 | 타입 | 필수 | 검증 |
|------|------|------|------|
| Company Name | Text | ✅ | 1-256자 |
| Industry | Select | ❌ | 사전 정의된 옵션 |
| Logo URL | URL | ❌ | Valid URL |
| Website URL | URL | ❌ | Valid URL |
| Location | Text | ❌ | 1-256자 |
| Notes | Textarea | ❌ | 0-1000자 |

**컴포넌트:**
- `FormField` — 입력 필드 래퍼
- `TextInput` — 텍스트 입력
- `SelectInput` — 드롭다운
- `TextAreaInput` — 여러 줄 텍스트
- `FormButtons` — [Cancel], [Save]

**프로젝트/성과 페이지는 동일 패턴을 따릅니다.**

### 4.7 설정 페이지 (Phase 1 기본)

**레이아웃:**

```
┌──────────────────────────────────────────┐
│ JeepneyHeader                            │
├──────────────────────────────────────────┤
│ [Profile] [Theme] [Notifications]       │  ← 탭
├──────────────────────────────────────────┤
│                                          │
│  Profile Tab                             │
│  ┌──────────────────────────────────┐   │
│  │ [Avatar]        [Upload Photo]   │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Full Name: [________]            │   │
│  │ Email: user@example.com (read)   │   │
│  │ Phone: [________]                │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [Save] [Cancel]                         │
│                                          │
├──────────────────────────────────────────┤
│ BottomNav                                │
└──────────────────────────────────────────┘
```

---

## 5. 컴포넌트 구현 계획

### 5.1 신규 컴포넌트 (Phase 1)

#### UI 기본 컴포넌트

| 컴포넌트 | 파일 | 설명 | 상태 |
|---------|------|------|------|
| `Button` | `components/ui/Button.js` | Primary, Secondary, Danger, Ghost 버전 | 🆕 신규 |
| `Card` | `components/ui/Card.js` | 카드 컨테이너 (헤더, 바디, 푸터) | 🆕 신규 |
| `Input` | `components/ui/Input.js` | 텍스트 입력 필드 | 🆕 신규 |
| `Select` | `components/ui/Select.js` | 드롭다운 선택 | 🆕 신규 |
| `Textarea` | `components/ui/Textarea.js` | 여러 줄 텍스트 입력 | 🆕 신규 |
| `Avatar` | `components/ui/Avatar.js` | 사용자 아바타 (이미지 또는 이니셜) | 🆕 신규 |
| `Badge` | `components/ui/Badge.js` | 상태/카테고리 배지 | 🆕 신규 |
| `Spinner` | `components/ui/Spinner.js` | 로딩 스피너 | 🆕 신규 |
| `Modal` | `components/ui/Modal.js` | 모달 대화상자 | 🆕 신규 |
| `Toast` | `components/ui/Toast.js` | 알림 토스트 메시지 | 🆕 신규 |
| `Breadcrumb` | `components/ui/Breadcrumb.js` | 경로 표시 | 🆕 신규 |
| `Tabs` | `components/ui/Tabs.js` | 탭 네비게이션 | 🆕 신규 |
| `SearchBar` | `components/ui/SearchBar.js` | 검색 입력 | 🆕 신규 |

#### JEEPNEY 레이아웃 컴포넌트

| 컴포넌트 | 파일 | 설명 | 상태 |
|---------|------|------|------|
| `JeepneyLayout` | `components/jeepney/JeepneyLayout.js` | 루트 래퍼 (헤더 + 메인 + 푸터) | 🆕 신규 |
| `JeepneyHeader` | `components/jeepney/JeepneyHeader.js` | 헤더 (로고, 메인 탭, 프로필) | 🔧 확장 |
| `BottomNav` | `components/jeepney/BottomNav.js` | 하단 고정 네비게이션 | 🔧 기존 |
| `PersonalTabNav` | `components/jeepney/PersonalTabNav.js` | 개인이력 탭 (Timeline, Companies, ...) | 🆕 신규 |
| `WelcomeCard` | `components/jeepney/WelcomeCard.js` | 홈 페이지 환영 메시지 | 🆕 신규 |
| `AppCard` | `components/jeepney/AppCard.js` | 앱 바로가기 카드 | 🆕 신규 |
| `RecentActivityFeed` | `components/jeepney/RecentActivityFeed.js` | 최근 활동 피드 | 🆕 신규 |

#### 개인이력 컴포넌트

| 컴포넌트 | 파일 | 설명 | 상태 |
|---------|------|------|------|
| `TimelineItem` | `components/career/TimelineItem.js` | 타임라인 항목 카드 | 🆕 신규 |
| `CompanyCard` | `components/career/CompanyCard.js` | 회사 카드 | 🆕 신규 |
| `ProjectCard` | `components/career/ProjectCard.js` | 프로젝트 카드 | 🆕 신규 |
| `AchievementCard` | `components/career/AchievementCard.js` | 성과 카드 | 🆕 신규 |
| `CompanyHeader` | `components/career/CompanyHeader.js` | 회사 상세 헤더 | 🆕 신규 |
| `CareerForm` | `components/career/CareerForm.js` | 회사/프로젝트/성과 폼 | 🆕 신규 |

### 5.2 컴포넌트 API 설계

#### Button 컴포넌트

```jsx
<Button
  variant="primary"    // 'primary' | 'secondary' | 'danger' | 'ghost'
  size="md"            // 'sm' | 'md' | 'lg'
  disabled={false}
  onClick={handleClick}
  loading={false}
>
  Click Me
</Button>
```

#### Card 컴포넌트

```jsx
<Card>
  <Card.Header>
    <h3>Title</h3>
    <Button variant="ghost" size="sm">⋯</Button>
  </Card.Header>
  <Card.Body>
    Content here
  </Card.Body>
  <Card.Footer>
    <Button>Cancel</Button>
    <Button variant="primary">Save</Button>
  </Card.Footer>
</Card>
```

#### Input 컴포넌트

```jsx
<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  required
  error="Invalid email"
  value={value}
  onChange={handleChange}
/>
```

#### Modal 컴포넌트

```jsx
<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>Delete Item?</Modal.Header>
  <Modal.Body>Are you sure?</Modal.Body>
  <Modal.Footer>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="danger" onClick={handleDelete}>Delete</Button>
  </Modal.Footer>
</Modal>
```

### 5.3 폴더 구조

```
src/
├── components/
│   ├── ui/              ← 기본 UI 컴포넌트
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Input.js
│   │   ├── Select.js
│   │   ├── Avatar.js
│   │   ├── Badge.js
│   │   ├── Spinner.js
│   │   ├── Modal.js
│   │   ├── Toast.js
│   │   ├── Breadcrumb.js
│   │   ├── Tabs.js
│   │   └── SearchBar.js
│   │
│   ├── jeepney/         ← JEEPNEY 레이아웃 컴포넌트
│   │   ├── JeepneyLayout.js
│   │   ├── JeepneyHeader.js
│   │   ├── BottomNav.js
│   │   ├── PersonalTabNav.js
│   │   ├── WelcomeCard.js
│   │   ├── AppCard.js
│   │   └── RecentActivityFeed.js
│   │
│   └── career/          ← 개인이력 컴포넌트
│       ├── TimelineItem.js
│       ├── CompanyCard.js
│       ├── ProjectCard.js
│       ├── AchievementCard.js
│       ├── CompanyHeader.js
│       └── CareerForm.js
│
├── pages/
│   ├── index.js         ← 홈 페이지 (/)
│   ├── jeepney-personal/
│   │   └── index.js     ← Personal Hub (/jeepney-personal)
│   ├── career/
│   │   ├── companies.js
│   │   ├── companies/
│   │   │   ├── new.js
│   │   │   └── [id].js
│   │   ├── projects.js
│   │   ├── projects/
│   │   │   ├── new.js
│   │   │   └── [id].js
│   │   ├── achievements.js
│   │   └── achievements/
│   │       ├── new.js
│   │       └── [id].js
│   ├── settings/
│   │   └── index.js
│   └── api/
│       ├── companies/
│       │   └── [...].js (CRUD)
│       ├── projects/
│       │   └── [...].js
│       └── achievements/
│           └── [...].js
│
├── lib/
│   ├── api.js           ← Supabase 클라이언트
│   ├── hooks.js         ← 커스텀 훅 (useAuth, useCompanies, ...)
│   ├── constants.js     ← 상수 (색상, 간격 등)
│   └── utils.js         ← 유틸 함수
│
├── styles/
│   ├── globals.css      ← 글로벌 스타일 + CSS 변수
│   ├── components.css   ← 컴포넌트 스타일
│   └── layout.css       ← 레이아웃 스타일
│
└── types/
    └── index.js         ← JSDoc 또는 TypeScript 타입 정의
```

---

## 6. DB 스키마 (Phase 1)

### 6.1 신규 테이블

```sql
-- 1. 회사 (companies)
CREATE TABLE user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(256) NOT NULL,
  industry VARCHAR(128),
  logo_url TEXT,
  website_url TEXT,
  location VARCHAR(256),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX idx_user_companies_created_at ON user_companies(created_at DESC);

-- RLS Policy
CREATE POLICY "Users can access their own companies" ON user_companies
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

---

-- 2. 경력 (career positions)
CREATE TABLE user_career (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES user_companies(id) ON DELETE SET NULL,
  position VARCHAR(128) NOT NULL,
  department VARCHAR(128),
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT check_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_user_career_user_id ON user_career(user_id);
CREATE INDEX idx_user_career_company_id ON user_career(company_id);
CREATE INDEX idx_user_career_start_date ON user_career(start_date DESC);

-- RLS Policy
CREATE POLICY "Users can access their own career" ON user_career
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_career ENABLE ROW LEVEL SECURITY;

---

-- 3. 프로젝트
CREATE TABLE user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES user_companies(id) ON DELETE SET NULL,
  project_name VARCHAR(256) NOT NULL,
  description TEXT,
  role VARCHAR(128),
  tech_stack JSON, -- ["Next.js", "React", "Supabase"]
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(32) DEFAULT 'in_progress', -- 'completed', 'archived'
  impact TEXT,
  project_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT check_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_company_id ON user_projects(company_id);
CREATE INDEX idx_user_projects_start_date ON user_projects(start_date DESC);

-- RLS Policy
CREATE POLICY "Users can access their own projects" ON user_projects
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

---

-- 4. 성과 (achievements, skills, certifications)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(32) NOT NULL, -- 'skill', 'certification', 'award', 'publication'
  title VARCHAR(256) NOT NULL,
  description TEXT,
  issuer VARCHAR(256),
  achievement_date DATE,
  credential_url TEXT,
  proof_file_url TEXT,
  visible_to VARCHAR(32) DEFAULT 'private', -- 'private', 'connections', 'public'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX idx_user_achievements_date ON user_achievements(achievement_date DESC);

-- RLS Policy
CREATE POLICY "Users can access their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id OR visible_to = 'public');

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
```

### 6.2 기존 테이블 확장

```sql
-- user_profiles에 신규 컬럼 추가 (필요 시)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS 
  bio TEXT,
  theme VARCHAR(32) DEFAULT 'dark',
  accent_color VARCHAR(32) DEFAULT 'cyan';
```

---

## 7. API 엔드포인트 (Phase 1)

### 7.1 회사 (Companies) API

```
GET  /api/companies              ← 모든 회사 조회
GET  /api/companies/[id]         ← 특정 회사 조회
POST /api/companies              ← 회사 추가
PUT  /api/companies/[id]         ← 회사 수정
DELETE /api/companies/[id]       ← 회사 삭제
```

**예: GET /api/companies**

```javascript
// pages/api/companies/index.js
export default async function handler(req, res) {
  const { user } = await auth.getSession(req);
  
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  
  if (req.method === 'POST') {
    const { company_name, industry, location, ...rest } = req.body;
    
    // 검증
    if (!company_name) return res.status(400).json({ error: 'company_name required' });
    
    const { data, error } = await supabase
      .from('user_companies')
      .insert([{ user_id: user.id, company_name, industry, location, ...rest }])
      .select();
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }
}
```

### 7.2 프로젝트 (Projects) API

```
GET  /api/projects              ← 모든 프로젝트 조회
GET  /api/projects/[id]         ← 특정 프로젝트 조회
POST /api/projects              ← 프로젝트 추가
PUT  /api/projects/[id]         ← 프로젝트 수정
DELETE /api/projects/[id]       ← 프로젝트 삭제
```

### 7.3 성과 (Achievements) API

```
GET  /api/achievements          ← 모든 성과 조회
GET  /api/achievements/[id]     ← 특정 성과 조회
POST /api/achievements          ← 성과 추가
PUT  /api/achievements/[id]     ← 성과 수정
DELETE /api/achievements/[id]   ← 성과 삭제
```

### 7.4 타임라인 API (조합)

```
GET /api/timeline               ← 회사+프로젝트+성과 조합 (시간순)
```

```javascript
// 예
{
  "data": [
    {
      "type": "company",
      "id": "uuid",
      "title": "Daechang Seat",
      "date": "2025-01-01",
      "icon": "🏢"
    },
    {
      "type": "project",
      "id": "uuid",
      "title": "IoT Infrastructure",
      "date": "2026-05-01",
      "icon": "🎯"
    },
    ...
  ]
}
```

---

## 8. 개발 타임라인

### Phase 1 전체 일정: **1주 (5-7일)**

```
Day 1-2: UI 컴포넌트 + 디자인 토큰
├── Button, Card, Input, Select, Avatar 등 기본 UI
├── 색상, 타이포 CSS 변수 정의
└── Storybook 또는 컴포넌트 갤러리 (선택)

Day 3: 레이아웃 컴포넌트
├── JeepneyLayout
├── JeepneyHeader (확장)
├── PersonalTabNav
└── BottomNav

Day 4: DB 스키마 + API
├── 4개 테이블 생성 (companies, career, projects, achievements)
├── RLS 정책 설정
└── /api/companies, /api/projects, /api/achievements 엔드포인트

Day 5: 홈 + 개인이력 페이지
├── / (홈 페이지)
├── /jeepney-personal (Personal Hub)
└── 최근 활동 피드

Day 6: 회사/프로젝트/성과 페이지
├── /career/companies (목록)
├── /career/companies/[id] (상세)
├── /career/companies/new (추가)
├── /career/projects, /career/achievements 동일
└── 모든 폼 검증 + 에러 처리

Day 7: 통합 + 최적화
├── 모든 페이지 연결 테스트
├── 모바일 반응형 검수 (Chrome DevTools)
├── 라이트하우스 성능 최적화
└── 에러 로깅 + 모니터링 설정
```

### 주요 마일스톤

- ✅ **Day 2 end:** UI 컴포넌트 라이브러리 80% 완성
- ✅ **Day 4 end:** DB + API 준비 완료
- ✅ **Day 6 end:** 모든 페이지 기능 구현 완료
- ✅ **Day 7 end:** 성능 최적화 + 평가자 인수인계

---

## 9. 검증 기준

### 9.1 기능 검증 (QA)

**평가자 검수 항목:**

```
□ 홈 페이지 (/): 3개 앱 카드 정상 표시, 최근 활동 피드 업데이트
□ 개인이력 Hub (/jeepney-personal): 4개 탭 전환 가능, 타임라인 정렬
□ 회사 목록: 추가/수정/삭제 기능, 검색 필터, 페이지 네이션
□ 회사 상세: 모든 필드 표시, [Edit], [Delete] 동작
□ 회사 추가: 필수값 검증, 필드 검증 에러, 저장 성공
□ 프로젝트/성과: 회사와 동일한 기능
□ 모바일: 320px 이상 모든 화면에서 정상 렌더링
□ 로그인/로그아웃: 인증 상태 유지, 페이지 리다이렉트
□ 에러 처리: API 실패 시 에러 메시지 표시
□ 성능: Lighthouse 점수 80 이상 (Mobile)
```

### 9.2 성능 검증

| 메트릭 | 목표 | 측정 방법 |
|-------|------|----------|
| **페이지 로드** | < 2초 (모바일 3G) | Lighthouse |
| **First Paint** | < 1000ms | Performance API |
| **Largest Contentful Paint (LCP)** | < 2.5s | Web Vitals |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Web Vitals |
| **번들 크기** | < 200KB (gzipped) | webpack-bundle-analyzer |

### 9.3 접근성 검증

| 항목 | 기준 | 검증 |
|------|------|------|
| **색상 대비** | WCAG AA (4.5:1 이상) | axe DevTools |
| **키보드 네비게이션** | Tab, Enter, Escape 동작 | 수동 테스트 |
| **ARIA 라벨** | 모든 input, button에 label | axe DevTools |
| **이미지 alt 텍스트** | 모든 이미지에 alt | axe DevTools |

### 9.4 Security 검증

```
□ RLS 정책 설정: 사용자는 자신의 데이터만 접근 가능
□ SQL Injection 방지: Supabase 파라미터화 쿼리 사용
□ XSS 방지: React 기본 sanitization, 사용자 입력 검증
□ CORS: 신뢰할 수 있는 도메인만 허용
□ 환경변수: API 키는 .env.local에 저장, 절대 커밋하지 않음
```

---

## 📚 참고 자료 & 링크

**기술:**
- [Next.js 14 Docs](https://nextjs.org/docs)
- [React 18 Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

**설계:**
- [Figma Wireframing](https://figma.com)
- [Design System 101](https://www.nngroup.com/articles/design-systems-101/)

**성능:**
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

**접근성:**
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## 체크리스트

**설계 검수:**
- [ ] 아키텍처 승인
- [ ] 페이지 와이어프레임 확인
- [ ] 컬러 팔레트 검증
- [ ] DB 스키마 검토
- [ ] API 엔드포인트 정의

**개발 검수 (웹개발자):**
- [ ] 모든 UI 컴포넌트 구현
- [ ] Storybook 작성
- [ ] 디자인 토큰 적용
- [ ] DB 마이그레이션 완료
- [ ] API 엔드포인트 구현
- [ ] 페이지 연결 테스트
- [ ] 모바일 반응형 검수
- [ ] Lighthouse 점수 80+

**평가 검수 (평가자):**
- [ ] 모든 기능 테스트
- [ ] 모바일 에뮬레이터 테스트
- [ ] 접근성 axe 스캔
- [ ] 성능 Web Vitals 측정
- [ ] 보안 RLS 정책 검증
- [ ] 에러 처리 테스트
- [ ] 최종 승인

---

**문서 버전:** 1.0  
**작성일:** 2026-05-13  
**담당:** 플레너  
**다음 단계:** 웹개발자가 Day 1부터 시작 → 평가자 최종 검수
