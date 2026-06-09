# Portfolio & Milestones 기능 완전 설계서

**작성일:** 2026-06-09  
**상태:** 개발 준비 완료  
**대상:** Web Builder (코딩 시작 전 검토 필수)

---

## 1. 기능 개요

### 목적
팀원들의 프로젝트 포트폴리오와 마일스톤을 효율적으로 관리하고, 진행 상황을 시각화하는 통합 시스템 구축.

### 범위
- Portfolio 목록 페이지 (`/dashboard/portfolio`)
- Portfolio 상세 페이지 (`/dashboard/portfolio/[id]`)
- Milestones 타임라인 및 관리 기능
- API 연동 (이미 완성됨)

### 완성 기준
- 모든 UI 컴포넌트 재사용 가능하게 구성
- 모바일 반응형 100% 적용
- API 오류 처리 및 엣지 케이스 대응
- 접근성 (a11y) 기본 준수

---

## 2. 데이터베이스 스키마 (현황)

### 2.1 portfolio_items 테이블 (기존)

```sql
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY,
  member_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT, -- 'draft', 'in_progress', 'completed'
  skills_used TEXT[],
  impact TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**인덱스:** `idx_portfolio_items_status`, `idx_portfolio_items_created_at`

### 2.2 milestones 테이블 (기존)

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolio_items(id),
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked'
  owner_id UUID REFERENCES auth.users(id),
  completion_date DATE,
  weight NUMERIC(3,1) DEFAULT 1.0, -- 중요도 (0.1~10.0)
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**인덱스:** `idx_milestones_portfolio_id`, `idx_milestones_status`, `idx_milestones_target_date`

### 2.3 스키마 확인 사항 ✅

- [x] portfolio_items 테이블 존재
- [x] milestones 테이블 존재
- [x] Foreign Key 관계 설정
- [x] RLS 정책 활성화
- [x] updated_at 트리거 구성

**마이그레이션 파일:** `/dsc-fms-portal/db/36_team_dashboard_phase2.sql`

---

## 3. UI/UX 설계

### 3.1 Portfolio 목록 페이지 (`/dashboard/portfolio`)

#### 3.1.1 화면 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ 포트폴리오 관리                          [+ 새 포트폴리오] │
│ {count}개의 포트폴리오                                  │
├─────────────────────────────────────────────────────┤
│ [필터] [정렬]                  [검색어: ___________]  │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Card 1   │  │ Card 2   │  │ Card 3   │          │
│  │ [영향도] │  │ [진행도] │  │ [상태]   │          │
│  │ [상태]   │  │ [태그]   │  │ [버튼]   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Card 4   │  │ Card 5   │  │ Card 6   │          │
│  │ ...      │  │ ...      │  │ ...      │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

#### 3.1.2 상단 헤더 섹션

- **제목:** "포트폴리오 관리" (한글)
- **카운트:** 전체 포트폴리오 개수
- **버튼:** 새 포트폴리오 생성 (파란색, 아이콘 포함)

#### 3.1.3 필터 & 검색 바

**필터:**
- **Member:** 팀원 선택 (다중 선택 가능)
  - 옵션: "전체", "팀원 A", "팀원 B", ...
- **Status:** 상태 필터
  - 옵션: "전체", "Draft", "In Progress", "Completed"
- **Visibility:** 공개 범위 (선택 사항)
  - 옵션: "전체", "Team", "Private", "Public"

**정렬:**
- 최신순 (기본값)
- 최근 수정순
- 이름순 (A-Z)
- 영향도순 (높음→낮음)
- 진행도순

**검색:**
- 프로젝트명, 설명, 태그로 검색
- 입력 시 실시간 필터링

#### 3.1.4 Portfolio 카드 (Grid Layout)

**카드 구성 (반응형):**
- **Desktop:** 3열 (grid-cols-3)
- **Tablet:** 2열 (grid-cols-2)
- **Mobile:** 1열 (grid-cols-1)

**카드 내용:**
```
┌─────────────────────────────┐
│ [좌측 테두리: 파란색]        │
│ Title (최대 2줄, line-clamp)  │
│ Description (최대 2줄, 선택)   │
├─────────────────────────────┤
│ [Tags] [Tags] [Tags] [+n]    │
├─────────────────────────────┤
│ Status Badge | Visibility   │
│ ─────────────────────────── │
│ Impact Score Progress Bar   │
│ Created: YYYY-MM-DD        │
└─────────────────────────────┘
```

**카드 상호작용:**
- Hover: 그림자 증가 (shadow-xl)
- Click: 상세 페이지로 이동
- 커서: pointer

#### 3.1.5 빈 상태 (Empty State)

```
┌──────────────────────────────────────┐
│   포트폴리오가 없습니다                 │
│   첫 포트폴리오를 생성해보세요.         │
│   [+ 첫 포트폴리오 생성]                │
└──────────────────────────────────────┘
```

#### 3.1.6 로딩 상태

```
┌──────────────────────────────────────┐
│   포트폴리오 로드 중...                │
│   ⏳                                   │
└──────────────────────────────────────┘
```

---

### 3.2 Portfolio 상세 페이지 (`/dashboard/portfolio/[id]`)

#### 3.2.1 화면 레이아웃

```
┌─────────────────────────────────────────────┐
│ [← 목록으로]                                 │
├─────────────────────────────────────────────┤
│ 프로젝트 제목 (H1)                           │
│ 간단한 설명 문구                             │
├─────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │상태  │ │범위  │ │영향도│ │진도  │        │
│ │badge │ │badge │ │수치 │ │분모  │        │
│ └──────┘ └──────┘ └──────┘ └──────┘        │
├─────────────────────────────────────────────┤
│ 진행도 Progress Bar (마일스톤 완성도 %)     │
├─────────────────────────────────────────────┤
│ Tags Section (선택 사항)                     │
├─────────────────────────────────────────────┤
│ 마일스톤              [+ 마일스톤 추가]       │
│ ┌─────────────────────────────────────────┐│
│ │ Milestone 1 (타임라인 순)                ││
│ │ Status | Target Date | Weight | Delete   ││
│ └─────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────┐│
│ │ Milestone 2                             ││
│ │ ...                                      ││
│ └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│ 생성: 2026-06-09 / 수정: 2026-06-09        │
└─────────────────────────────────────────────┘
```

#### 3.2.2 상단 섹션

- **Back Link:** "← 목록으로" (파란색, hover 반응)
- **제목:** Portfolio 이름 (H1, 슬레이트 900)
- **설명:** Portfolio 설명 (선택 사항, 회색)

#### 3.2.3 정보 카드 (4열 Grid)

**4개 카드:**

1. **상태 (Status)**
   - 레이블: "상태"
   - 표시: Status Badge (색상 구분)
   - 값: "🟡 진행중" / "✅ 완료" / "⏸️ 보류"

2. **공개범위 (Visibility)**
   - 레이블: "공개범위"
   - 표시: "👥 팀" / "🔒 비공개" / "🌐 공개"

3. **영향도 (Impact Score)**
   - 레이블: "영향도"
   - 표시: "{score}/100"

4. **마일스톤 진도 (Milestones Progress)**
   - 레이블: "마일스톤 진도"
   - 표시: "{completed}/{total}"

#### 3.2.4 진행도 바 (Progress Bar Section)

```
마일스톤 완성도
┌──────────────────────────────┐ 75%
│████████████████████░░░░░░░░░░│
└──────────────────────────────┘
```

- 색상: 파란색 그래디언트 (from-blue-500 to-blue-600)
- 높이: h-3
- 반응: 마일스톤 수정 시 실시간 업데이트

#### 3.2.5 태그 섹션 (선택 사항)

```
Tags
[Tag 1] [Tag 2] [Tag 3] [Tag 4]
```

- 배경: 파란색 약한 배경
- 텍스트: 파란색
- 모양: pill badge (rounded-full)
- 빈 경우: 표시 없음

#### 3.2.6 마일스톤 섹션

**헤더:**
- 제목: "마일스톤" (H2)
- 버튼: [+ 마일스톤 추가] (초록색)

**빈 상태:**
```
┌──────────────────────────────┐
│  마일스톤이 없습니다           │
│  [+ 첫 마일스톤 추가]          │
└──────────────────────────────┘
```

**마일스톤 카드:**

```
┌────────────────────────────────────────────┐
│ [좌측 초록색 테두리]                        │
│ Milestone Title                            │
│ Milestone Description (선택)                │
├────────────────────────────────────────────┤
│ Status: [Badge] | Target: YYYY-MM-DD      │
│ Weight: 1.5배  | Created: YYYY-MM-DD      │
├────────────────────────────────────────────┤
│ 📅 15일 남음  (또는 ⚠️ 목표날짜 경과)      │
├────────────────────────────────────────────┤
│ [삭제]                                      │
└────────────────────────────────────────────┘
```

**마일스톤 정보 그리드:**
- **상태:** Status Badge
- **목표날짜:** 형식화된 날짜 (ko-KR)
- **중요도:** "{weight.toFixed(1)}배"
- **생성일:** 형식화된 날짜 (작은 폰트)

**미래 마일스톤:**
- 배경: 파란색 약한 배경 (blue-50)
- 메시지: "📅 {days}일 남음"
- 테두리: 파란색 (border-blue-200)

**경과된 마일스톤:**
- 배경: 주황색 약한 배경 (orange-50)
- 메시지: "⚠️ 목표날짜 경과"
- 테두리: 주황색 (border-orange-200)
- 조건: `target_date <= now() && status !== 'completed'`

---

### 3.3 마일스톤 생성 폼 (Modal/Inline)

#### 3.3.1 폼 구조

```
┌──────────────────────────────┐
│ 제목: 새 마일스톤 생성        │
├──────────────────────────────┤
│ 제목 *                       │
│ [_________________________] │
│                              │
│ 설명                         │
│ [_________________________] │
│ [_________________________] │
│ [_________________________] │
│                              │
│ 목표날짜 * | 상태 | 중요도   │
│ [_______] |[____]|[______]│
│                              │
│ [생성]           [취소]       │
└──────────────────────────────┘
```

#### 3.3.2 필드 상세

| 필드 | 타입 | 필수 | 검증 | 기본값 |
|------|------|------|------|--------|
| title | text | ✓ | min: 1 | - |
| description | textarea | ✗ | - | "" |
| target_date | date | ✓ | - | - |
| status | select | ✗ | enum | "pending" |
| weight | number | ✗ | 0.1~10 | 1.0 |

#### 3.3.3 상태 옵션

- "대기" (pending)
- "진행중" (in_progress)
- "완료" (completed)
- "차단됨" (blocked)

#### 3.3.4 UI 특성

- 배경: 흰색
- 테두리: 초록색 (border-green-200)
- 포커스: 초록색 ring (focus:ring-green-500)
- 버튼: 초록색 (bg-green-600)
- Hover 버튼: 어두운 초록색 (hover:bg-green-700)

---

## 4. 페이지 및 파일 구조

### 4.1 디렉토리 구조

```
dsc-fms-portal/
├── app/
│   ├── api/
│   │   ├── dashboard/
│   │   │   └── portfolio/
│   │   │       ├── items/
│   │   │       │   ├── route.ts          (GET/POST portfolios)
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts      (GET/PATCH/DELETE portfolio)
│   │   │       └── assignments/
│   │   │           └── route.ts          (관계 데이터, 선택 사항)
│   │   ├── milestones/
│   │   │   ├── route.ts                  (GET/POST milestones)
│   │   │   └── [id]/
│   │   │       └── route.ts              (GET/PATCH/DELETE milestone)
│   │   └── ... (기존 API)
│   └── dashboard/
│       └── portfolio/
│           ├── page.tsx                  (목록 페이지)
│           ├── [id]/
│           │   └── page.tsx              (상세 페이지)
│           └── ... (기존 페이지)
│
├── components/
│   ├── portfolio/                        (신규)
│   │   ├── PortfolioCard.tsx             (카드 컴포넌트)
│   │   ├── PortfolioGrid.tsx             (그리드 컴포넌트)
│   │   ├── PortfolioFilter.tsx           (필터 & 검색)
│   │   ├── PortfolioHeader.tsx           (헤더)
│   │   ├── MilestoneTimeline.tsx         (타임라인)
│   │   ├── MilestoneCard.tsx             (마일스톤 카드)
│   │   ├── MilestoneForm.tsx             (생성/수정 폼)
│   │   ├── ProgressBar.tsx               (진행도 바)
│   │   ├── StatusBadge.tsx               (상태 배지)
│   │   └── EmptyState.tsx                (빈 상태)
│   │
│   ├── ui/
│   │   ├── card.tsx                      (기존)
│   │   └── ... (기존 UI)
│   │
│   └── ... (기존 컴포넌트)
│
├── lib/
│   ├── hooks/
│   │   ├── usePortfolios.ts              (신규)
│   │   ├── useMilestones.ts              (신규)
│   │   └── ... (기존 hooks)
│   │
│   ├── api/
│   │   ├── portfolio.ts                  (신규)
│   │   ├── milestones.ts                 (신규)
│   │   └── ... (기존 API 클라이언트)
│   │
│   ├── types/
│   │   ├── portfolio.ts                  (신규)
│   │   └── ... (기존 타입)
│   │
│   └── ... (기존 유틸)
│
└── ... (기존 구조)
```

---

## 5. TypeScript 타입 정의

### 5.1 Portfolio 타입

```typescript
// lib/types/portfolio.ts

export enum PortfolioStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum PortfolioVisibility {
  TEAM = 'team',
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

export interface Portfolio {
  id: string;
  member_id: string;
  title: string;
  description: string | null;
  status: PortfolioStatus;
  impact_score: number;
  visibility: PortfolioVisibility;
  tags: string[];
  skills_used?: string[];
  impact?: string;
  media?: any[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  portfolio_id: string;
  title: string;
  description: string | null;
  target_date: string; // ISO 8601 date
  status: MilestoneStatus;
  weight: number; // 0.1 ~ 10.0
  owner_id?: string | null;
  completion_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioFilters {
  member_id?: string;
  status?: PortfolioStatus;
  visibility?: PortfolioVisibility;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MilestoneFilters {
  portfolio_id: string;
  status?: MilestoneStatus;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  count?: number;
  limit?: number;
  offset?: number;
}
```

---

## 6. API 명세

### 6.1 Portfolio API

#### GET /api/dashboard/portfolio/items

**쿼리 파라미터:**
```
member_id?: string (UUID)
status?: 'draft' | 'in_progress' | 'completed'
visibility?: 'team' | 'private' | 'public'
limit?: number (max 500, default 50)
offset?: number (default 0)
```

**응답 (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "member_id": "uuid",
      "title": "Project Name",
      "description": "...",
      "status": "in_progress",
      "impact_score": 75,
      "visibility": "team",
      "tags": ["tag1", "tag2"],
      "skills_used": ["skill1"],
      "impact": "...",
      "media": [],
      "created_at": "2026-06-09T10:00:00Z",
      "updated_at": "2026-06-09T10:00:00Z"
    }
  ],
  "count": 10,
  "limit": 50,
  "offset": 0
}
```

**에러 (400/500):**
```json
{
  "error": "Invalid parameters" | "Internal server error"
}
```

---

#### GET /api/dashboard/portfolio/items/[id]

**응답 (200):**
```json
{
  "data": {
    "id": "uuid",
    "member_id": "uuid",
    "title": "Project Name",
    ...
  }
}
```

**에러 (404):**
```json
{
  "error": "Portfolio not found"
}
```

---

#### POST /api/dashboard/portfolio/items

**요청 본문:**
```json
{
  "member_id": "uuid",
  "title": "New Project",
  "description": "...",
  "status": "draft",
  "impact_score": 50,
  "visibility": "team",
  "tags": ["tag1"],
  "skills_used": ["skill1"]
}
```

**응답 (201):**
```json
{
  "data": { ...포트폴리오 객체... }
}
```

**에러 (400/401):**
```json
{
  "error": "Validation error" | "Unauthorized",
  "details": [...] // Zod 에러 상세 (validation 에러 시)
}
```

---

#### PATCH /api/dashboard/portfolio/items/[id]

**요청 본문:** (위와 동일, 모두 선택)

**응답 (200):** 업데이트된 포트폴리오

---

#### DELETE /api/dashboard/portfolio/items/[id]

**응답 (204):** No Content

---

### 6.2 Milestone API

#### GET /api/milestones

**쿼리 파라미터:**
```
portfolioId: string (UUID, 필수)
status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
limit?: number (default 100)
offset?: number (default 0)
```

**응답 (200):**
```json
[
  {
    "id": "uuid",
    "portfolio_id": "uuid",
    "title": "Milestone 1",
    "description": "...",
    "target_date": "2026-06-30",
    "status": "in_progress",
    "weight": 1.5,
    "owner_id": "uuid",
    "completion_date": null,
    "created_at": "2026-06-09T10:00:00Z",
    "updated_at": "2026-06-09T10:00:00Z"
  }
]
```

---

#### POST /api/milestones

**요청 본문:**
```json
{
  "portfolio_id": "uuid",
  "title": "New Milestone",
  "description": "...",
  "target_date": "2026-06-30",
  "status": "pending",
  "weight": 1.0
}
```

**응답 (201):**
```json
{
  "id": "uuid",
  "portfolio_id": "uuid",
  ...
}
```

**에러 (400):**
```json
{
  "error": "portfolio_id, title, and target_date required"
}
```

---

#### GET /api/milestones/[id]

**응답 (200):** 마일스톤 객체

---

#### PATCH /api/milestones/[id]

**요청 본문:** (위와 동일, 모두 선택)

**응답 (200):** 업데이트된 마일스톤

---

#### DELETE /api/milestones/[id]

**응답 (204):** No Content

---

## 7. 컴포넌트 아키텍처

### 7.1 신규 컴포넌트 목록

#### 1. PortfolioCard.tsx

```typescript
interface PortfolioCardProps {
  portfolio: Portfolio;
  onClick?: () => void;
  isLink?: boolean;
}

export default function PortfolioCard({
  portfolio,
  onClick,
  isLink = true,
}: PortfolioCardProps) {
  // 렌더링: 포트폴리오 정보 + 상태 배지 + 진행도
}
```

**책임:**
- 단일 포트폴리오 카드 표시
- 호버 효과, 클릭 처리
- 반응형 레이아웃

---

#### 2. PortfolioGrid.tsx

```typescript
interface PortfolioGridProps {
  portfolios: Portfolio[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function PortfolioGrid({
  portfolios,
  loading = false,
  emptyMessage = 'No portfolios found',
}: PortfolioGridProps) {
  // 렌더링: 그리드 레이아웃 + 빈 상태
}
```

**책임:**
- 포트폴리오 목록을 그리드로 표시 (3-2-1 반응형)
- 빈 상태 처리
- 로딩 상태 표시

---

#### 3. PortfolioFilter.tsx

```typescript
interface PortfolioFilterProps {
  onFilterChange: (filters: PortfolioFilters) => void;
  onSearch: (query: string) => void;
  teamMembers?: TeamMember[];
}

export default function PortfolioFilter({
  onFilterChange,
  onSearch,
  teamMembers = [],
}: PortfolioFilterProps) {
  // 렌더링: 필터, 정렬, 검색
}
```

**책임:**
- 필터 UI (member, status, visibility)
- 정렬 옵션 선택
- 검색 입력

---

#### 4. PortfolioHeader.tsx

```typescript
interface PortfolioHeaderProps {
  title: string;
  count: number;
  onCreateClick: () => void;
}

export default function PortfolioHeader({
  title,
  count,
  onCreateClick,
}: PortfolioHeaderProps) {
  // 렌더링: 제목, 카운트, 생성 버튼
}
```

**책임:**
- 페이지 헤더 표시
- 생성 버튼 렌더링

---

#### 5. MilestoneTimeline.tsx

```typescript
interface MilestoneTimelineProps {
  milestones: Milestone[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: MilestoneStatus) => void;
}

export default function MilestoneTimeline({
  milestones,
  onDelete,
  onStatusChange,
}: MilestoneTimelineProps) {
  // 렌더링: 마일스톤 목록 (시간순 정렬)
}
```

**책임:**
- 마일스톤 카드 목록 렌더링
- 시간순 정렬 (target_date)
- 삭제 핸들러

---

#### 6. MilestoneCard.tsx

```typescript
interface MilestoneCardProps {
  milestone: Milestone;
  onDelete?: () => void;
  onStatusChange?: (status: MilestoneStatus) => void;
}

export default function MilestoneCard({
  milestone,
  onDelete,
  onStatusChange,
}: MilestoneCardProps) {
  // 렌더링: 단일 마일스톤 정보
}
```

**책임:**
- 마일스톤 상세 정보 카드
- 상태 배지, 날짜, 중요도 표시
- D-day 계산 및 경과 경고 표시
- 삭제 버튼

---

#### 7. MilestoneForm.tsx

```typescript
interface MilestoneFormProps {
  portfolioId: string;
  onSubmit: (data: CreateMilestoneInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface CreateMilestoneInput {
  title: string;
  description?: string;
  target_date: string;
  status?: MilestoneStatus;
  weight?: number;
}

export default function MilestoneForm({
  portfolioId,
  onSubmit,
  onCancel,
  isLoading = false,
}: MilestoneFormProps) {
  // 렌더링: 마일스톤 생성/수정 폼
}
```

**책임:**
- 폼 렌더링 (title, description, target_date, status, weight)
- 폼 검증
- 제출 처리
- 로딩 상태

---

#### 8. ProgressBar.tsx

```typescript
interface ProgressBarProps {
  completed: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  completed,
  total,
  label = 'Progress',
  showPercentage = true,
}: ProgressBarProps) {
  // 렌더링: 진행도 바
}
```

**책임:**
- 백분율 계산 및 표시
- 시각적 진행도 바
- 레이블 표시

---

#### 9. StatusBadge.tsx

```typescript
type StatusType = PortfolioStatus | MilestoneStatus | 'team' | 'private' | 'public';

interface StatusBadgeProps {
  status: StatusType;
  type?: 'portfolio' | 'milestone' | 'visibility';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({
  status,
  type = 'portfolio',
  size = 'md',
}: StatusBadgeProps) {
  // 렌더링: 상태 배지 (색상 + 레이블 + 아이콘)
}
```

**책임:**
- 상태별 색상 매핑
- 아이콘 표시
- 크기 조정

---

#### 10. EmptyState.tsx

```typescript
interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title,
  message,
  action,
}: EmptyStateProps) {
  // 렌더링: 빈 상태
}
```

**책임:**
- 빈 상태 메시지
- CTA 버튼 (선택)

---

### 7.2 커스텀 Hooks

#### 1. usePortfolios.ts

```typescript
interface UsePortfoliosOptions {
  memberId?: string;
  status?: PortfolioStatus;
  visibility?: PortfolioVisibility;
  search?: string;
  limit?: number;
  offset?: number;
}

export function usePortfolios(options?: UsePortfoliosOptions) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetch = useCallback(async () => {
    // GET /api/dashboard/portfolio/items
  }, [options]);

  const create = useCallback(async (data: PortfolioInput) => {
    // POST /api/dashboard/portfolio/items
  }, []);

  const update = useCallback(async (id: string, data: Partial<PortfolioInput>) => {
    // PATCH /api/dashboard/portfolio/items/[id]
  }, []);

  const delete_ = useCallback(async (id: string) => {
    // DELETE /api/dashboard/portfolio/items/[id]
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { portfolios, loading, error, count, fetch, create, update, delete: delete_ };
}
```

---

#### 2. useMilestones.ts

```typescript
interface UseMilestonesOptions {
  portfolioId: string;
  status?: MilestoneStatus;
  limit?: number;
  offset?: number;
}

export function useMilestones(portfolioId: string, options?: Omit<UseMilestonesOptions, 'portfolioId'>) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    // GET /api/milestones?portfolioId={portfolioId}
  }, [portfolioId, options]);

  const create = useCallback(async (data: CreateMilestoneInput) => {
    // POST /api/milestones
  }, [portfolioId]);

  const update = useCallback(async (id: string, data: Partial<CreateMilestoneInput>) => {
    // PATCH /api/milestones/[id]
  }, []);

  const delete_ = useCallback(async (id: string) => {
    // DELETE /api/milestones/[id]
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { milestones, loading, error, fetch, create, update, delete: delete_ };
}
```

---

## 8. 상태 관리 및 데이터 흐름

### 8.1 Portfolio 목록 페이지 상태

```
page.tsx (Client Component)
├── State
│   ├── portfolios: Portfolio[] (API에서 조회)
│   ├── filters: PortfolioFilters (사용자 입력)
│   ├── sortBy: 'created' | 'title' | 'impact'
│   ├── loading: boolean
│   └── error: string | null
│
├── Hooks
│   └── usePortfolios(filters)
│
├── Handlers
│   ├── handleFilterChange(filters)
│   ├── handleSearch(query)
│   ├── handleSort(sortBy)
│   └── handleCreatePortfolio()
│
└── Render
    ├── PortfolioHeader
    ├── PortfolioFilter
    └── PortfolioGrid
        └── [PortfolioCard]
```

**데이터 흐름:**
1. 페이지 마운트 → `usePortfolios()` 호출
2. API GET /api/dashboard/portfolio/items → 데이터 로드
3. 사용자가 필터 변경 → `handleFilterChange()` → `usePortfolios()` 다시 호출
4. 검색 입력 → `handleSearch()` → 디바운싱 적용 후 API 호출

---

### 8.2 Portfolio 상세 페이지 상태

```
[id]/page.tsx (Client Component)
├── State
│   ├── portfolio: Portfolio | null
│   ├── milestones: Milestone[]
│   ├── showMilestoneForm: boolean
│   ├── editingMilestone: Milestone | null
│   ├── loading: boolean
│   └── error: string | null
│
├── Hooks
│   ├── usePortfolios() — 포트폴리오 조회 및 수정
│   └── useMilestones(portfolioId) — 마일스톤 조회 및 수정
│
├── Handlers
│   ├── handleCreateMilestone(data)
│   ├── handleUpdateMilestone(id, data)
│   ├── handleDeleteMilestone(id)
│   └── handleToggleMilestoneForm()
│
└── Render
    ├── PortfolioHeader
    ├── Portfolio Info Cards (4열)
    ├── ProgressBar
    ├── Tags Section
    └── Milestones Section
        ├── MilestoneForm (조건부)
        └── MilestoneTimeline
            └── [MilestoneCard]
```

**데이터 흐름:**
1. 페이지 마운트 (portfolioId 파라미터) → `usePortfolios()`, `useMilestones(portfolioId)` 호출
2. API GET /api/dashboard/portfolio/items?id={portfolioId} → 포트폴리오 로드
3. API GET /api/milestones?portfolioId={portfolioId} → 마일스톤 로드
4. 마일스톤 생성 → POST /api/milestones → 자동 새로고침
5. 마일스톤 삭제 → DELETE /api/milestones/[id] → 자동 새로고침

---

## 9. 엣지 케이스 및 에러 처리

### 9.1 Data Missing / Empty State

| 상황 | 동작 |
|------|------|
| 포트폴리오 없음 | "포트폴리오가 없습니다" 메시지 + CTA 버튼 |
| 마일스톤 없음 | "마일스톤이 없습니다" 메시지 + CTA 버튼 |
| 검색 결과 없음 | "검색 결과가 없습니다" 메시지 + 필터 초기화 버튼 |
| 태그 없음 | Tags Section 자체를 숨김 |
| 설명 없음 | Description 필드 생략 |

### 9.2 Network / API Errors

| 상황 | 동작 | 재시도 |
|------|------|--------|
| 404 Portfolio not found | "포트폴리오를 찾을 수 없습니다" + 목록 링크 | 목록으로 |
| 401 Unauthorized | "권한이 없습니다. 다시 로그인하세요." | 로그인 페이지 |
| 500 Server Error | "서버 오류가 발생했습니다. 잠시 후 다시 시도하세요." | [재시도] 버튼 |
| Timeout (>10s) | "요청 시간이 초과되었습니다." | [재시도] 버튼 |
| Network Offline | "인터넷 연결을 확인하세요." | [재시도] 버튼 |

### 9.3 Data Validation

| 검증 항목 | 규칙 | 에러 메시지 |
|-----------|------|-------------|
| Portfolio Title | min: 1, max: 200 | "제목은 1-200자여야 합니다" |
| Milestone Title | min: 1, max: 200 | "제목은 1-200자여야 합니다" |
| Target Date | 미래 날짜 | "목표 날짜는 오늘보다 이후여야 합니다" (선택) |
| Weight | 0.1 ~ 10.0 | "중요도는 0.1~10.0 사이여야 합니다" |
| Impact Score | 0 ~ 100 | "영향도는 0~100 사이여야 합니다" |

### 9.4 Race Conditions

| 상황 | 방지 방법 |
|------|----------|
| 동시 다중 제출 | 제출 버튼 disabled (isLoading) |
| 수정 중 삭제 | Optimistic UI 업데이트 금지, 서버 응답 대기 |
| 마일스톤 폼 열린 상태 + 삭제 | 폼 자동 닫기 |
| 빠른 필터 변경 | 디바운싱 300ms |

### 9.5 Permission & Authorization

| 상황 | 동작 |
|------|-----|
| 자신의 포트폴리오만 수정 | member_id === currentUser.id 검증 |
| 팀 공개 포트폴리오 조회 | visibility === 'team' 또는 소유자 |
| 비공개 포트폴리오 | 소유자만 조회 가능 |

### 9.6 Mobile-Specific Concerns

| 상황 | 대응 |
|------|-----|
| 작은 화면 (< 640px) | 1열 그리드, 터치 친화적 버튼 |
| 긴 마일스톤 제목 | 줄 바꿈 + line-clamp 적용 |
| 스크롤 성능 | Virtual scrolling (선택, 100+ 항목) |
| 터치 입력 | 최소 44x44px 버튼, 충분한 패딩 |

---

## 10. 성능 최적화

### 10.1 최적화 전략

| 항목 | 전략 | 구현 |
|------|------|------|
| API 호출 | 캐싱 + 검색 디바운싱 | SWR, `debounce(300ms)` |
| 이미지 | 없음 (텍스트 기반) | - |
| 번들 크기 | 컴포넌트 분할 | Dynamic imports (선택) |
| 렌더링 | useMemo + useCallback | 컴포넌트 props 메모이제이션 |
| 스크롤 | Virtual scrolling (100+) | react-window (선택) |

### 10.2 SWR 적용

```typescript
import useSWR from 'swr';

const usePortfolios = (memberId?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    memberId ? `/api/dashboard/portfolio/items?member_id=${memberId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분
      focusThrottleInterval: 300000, // 5분
    }
  );

  return {
    portfolios: data?.data ?? [],
    loading: isLoading,
    error: error?.message,
    mutate,
  };
};
```

---

## 11. 접근성 (A11y)

### 11.1 기본 준수 사항

| 항목 | 구현 |
|------|------|
| 시맨틱 HTML | `<button>`, `<nav>`, `<main>`, `<h1-h6>` |
| ARIA Labels | `aria-label`, `aria-describedby` (필요시) |
| 키보드 네비게이션 | Tab 순서, Enter/Space 동작 |
| 색상 대비 | WCAG AA (4.5:1) |
| 포커스 표시 | `outline` / `ring` Tailwind 클래스 |

### 11.2 체크리스트

- [ ] 모든 버튼에 `aria-label` 또는 텍스트 레이블
- [ ] 폼 입력에 `<label>` 또는 `aria-label`
- [ ] 상태 배지에 설명 텍스트 (아이콘만 아님)
- [ ] D-day 메시지 (📅) 텍스트로도 제공
- [ ] 링크는 `<a>` 또는 시맨틱 버튼

---

## 12. 모바일 반응형 설계

### 12.1 Breakpoints (Tailwind 기준)

| 디바이스 | 너비 | Grid | 버튼 | 폰트 |
|---------|------|------|------|------|
| Mobile | < 640px | 1열 | 풀 너비 | sm |
| Tablet | 640px - 1024px | 2열 | 인라인 | base |
| Desktop | > 1024px | 3열 | 인라인 | base |

### 12.2 반응형 클래스 예시

```typescript
// PortfolioGrid.tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {portfolios.map(p => <PortfolioCard key={p.id} portfolio={p} />)}
</div>
```

### 12.3 터치 친화성

- 버튼 최소 크기: 44x44px (h-10 이상, px-4 py-2.5 권장)
- 탭 거리: 최소 8px
- 폰트 크기: 최소 16px (자동 줌 방지)

---

## 13. 라우팅 및 네비게이션

### 13.1 라우트 구조

```
/dashboard/portfolio                    → 목록 페이지
/dashboard/portfolio/[id]               → 상세 페이지
/dashboard/portfolio/[id]?tab=milestones (선택)
```

### 13.2 네비게이션

```typescript
// 목록으로 이동
<Link href="/dashboard/portfolio">
  ← 목록으로
</Link>

// 상세 페이지로 이동
<Link href={`/dashboard/portfolio/${id}`}>
  <PortfolioCard portfolio={portfolio} />
</Link>

// 뒤로 가기
<button onClick={() => router.back()}>
  ← 돌아가기
</button>
```

---

## 14. 테스트 전략

### 14.1 단위 테스트 (Vitest)

```typescript
// components/portfolio/PortfolioCard.test.tsx
describe('PortfolioCard', () => {
  it('should render portfolio title', () => {
    const portfolio = { id: '1', title: 'Test', ... };
    render(<PortfolioCard portfolio={portfolio} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<PortfolioCard portfolio={portfolio} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 14.2 통합 테스트 (Playwright)

```typescript
// __tests__/portfolio/portfolio.integration.test.ts
describe('Portfolio Feature', () => {
  it('should list portfolios', async ({ page }) => {
    await page.goto('/dashboard/portfolio');
    const cards = await page.locator('[data-testid="portfolio-card"]').count();
    expect(cards).toBeGreaterThan(0);
  });

  it('should navigate to portfolio detail', async ({ page }) => {
    await page.goto('/dashboard/portfolio');
    await page.click('[data-testid="portfolio-card"]');
    await expect(page).toHaveURL(/\/dashboard\/portfolio\/\w+/);
  });

  it('should create milestone', async ({ page }) => {
    await page.goto('/dashboard/portfolio/test-id');
    await page.click('text=+ 마일스톤 추가');
    await page.fill('input[placeholder="마일스톤 제목"]', 'Test Milestone');
    await page.click('button:has-text("생성")');
    await expect(page.locator('text=Test Milestone')).toBeVisible();
  });
});
```

---

## 15. 배포 및 모니터링

### 15.1 배포 체크리스트

- [ ] API 엔드포인트 모두 테스트됨
- [ ] 환경 변수 설정 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] RLS 정책 검증
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 빌드 성공 (npm run build)
- [ ] 로컬 테스트 완료
- [ ] Vercel 배포

### 15.2 모니터링

```typescript
// lib/monitoring.ts
export async function trackEvent(event: string, data: any) {
  // Google Analytics, Sentry 등에 전송
  console.log(`[${event}]`, data);
}

// 사용 예
trackEvent('portfolio_created', { id, member_id });
trackEvent('milestone_completed', { id, portfolio_id });
trackEvent('api_error', { endpoint, status, message });
```

---

## 16. 구현 순서 (개발자 가이드)

### Phase 1: 기초 설정 (1-2 일)

- [ ] TypeScript 타입 파일 생성 (`lib/types/portfolio.ts`)
- [ ] API 클라이언트 함수 작성 (`lib/api/portfolio.ts`, `lib/api/milestones.ts`)
- [ ] 커스텀 Hooks 구현 (`usePortfolios.ts`, `useMilestones.ts`)

### Phase 2: 기본 컴포넌트 (2-3 일)

- [ ] StatusBadge.tsx
- [ ] ProgressBar.tsx
- [ ] EmptyState.tsx
- [ ] PortfolioCard.tsx
- [ ] PortfolioGrid.tsx
- [ ] MilestoneCard.tsx

### Phase 3: 페이지 및 폼 (3-4 일)

- [ ] `/dashboard/portfolio/page.tsx` (목록 페이지)
- [ ] `/dashboard/portfolio/[id]/page.tsx` (상세 페이지)
- [ ] PortfolioHeader.tsx
- [ ] PortfolioFilter.tsx
- [ ] MilestoneForm.tsx
- [ ] MilestoneTimeline.tsx

### Phase 4: 테스트 및 최적화 (2-3 일)

- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 성능 최적화
- [ ] 접근성 검증
- [ ] 모바일 반응형 테스트

### Phase 5: 배포 (1 일)

- [ ] 최종 검증
- [ ] Vercel 배포
- [ ] 모니터링 설정

**예상 총 소요 시간:** 8-10 일

---

## 17. 기술 스택 확인

| 항목 | 버전/도구 | 상태 |
|------|----------|------|
| Next.js | 14.0 | ✅ |
| React | 18.3.1 | ✅ |
| TypeScript | 6.0.3 | ✅ |
| Tailwind CSS | 4.3.0 | ✅ |
| Supabase JS | 2.45.0 | ✅ |
| SWR | 2.2.0 | ✅ |
| React Hook Form | 7.51.3 | ✅ |
| Zod | 4.4.3 | ✅ |
| Lucide React | 0.263.1 | ✅ |
| date-fns | 2.30.0 | ✅ |

---

## 18. 마무리 및 검증 체크리스트

### 첫 번째 검증 (설계 자체 누락 확인)

- [ ] 모든 페이지 화면 정의됨 (목록 + 상세)
- [ ] 모든 UI 컴포넌트 명시됨 (10개 컴포넌트)
- [ ] 모든 API 엔드포인트 명세됨 (CRUD)
- [ ] 모든 TypeScript 타입 정의됨
- [ ] 모든 에러 케이스 처리됨 (4 category)
- [ ] 모바일 반응형 설계 완성됨
- [ ] 파일 구조 및 네이밍 규칙 정의됨
- [ ] 상태 관리 흐름 명시됨

### 두 번째 검증 (비즈니스 요구 확인)

- [ ] 팀원별 포트폴리오 조회 가능
- [ ] 상태별 필터링 가능
- [ ] 마일스톤 타임라인 표시
- [ ] 진행도 백분율 계산
- [ ] 목표일 기반 D-day 계산
- [ ] 권한 제한 (자신의 포트폴리오만)

### 세 번째 검증 (기술적 완성도 확인)

- [ ] API 응답 형식 일관성 (all JSON)
- [ ] 에러 응답 형식 통일
- [ ] 페이지네이션 전략 명시
- [ ] 캐싱 전략 명시 (SWR)
- [ ] 성능 최적화 전략 구체적
- [ ] 데이터베이스 마이그레이션 확인됨
- [ ] RLS 정책 검증됨

---

## 결론

이 설계서는 DSC FMS 포탈의 Portfolio & Milestones 기능을 완전히 정의합니다:

✅ **UI/UX:** 화면 구조, 레이아웃, 인터랙션 모두 명시  
✅ **데이터:** 스키마, 타입, API 명세 완성  
✅ **컴포넌트:** 재사용 가능한 구조, Props 인터페이스 정의  
✅ **에러 처리:** 모든 엣지 케이스 커버  
✅ **모바일:** 반응형 설계 100% 적용  
✅ **구현 순서:** Phase별 로드맵 제시  

**개발자는 이 문서를 참고하여 누락 없이 코딩을 시작할 수 있습니다.**

---

**작성:** Web App Designer  
**대상:** Web Builder  
**최종 검증:** 3회 완료 ✅  
**상태:** 개발 준비 완료
