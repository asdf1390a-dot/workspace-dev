# Team Dashboard Phase 2 UI 설계 (2026-05-27)

**Status:** 🟡 설계 진행 중  
**마감:** 2026-06-10 18:00 KST  
**작성자:** Planner Agent  
**버전:** 2.0 (Phase 2B/2C 통합 설계)  

---

## 📋 목차
1. [개요](#개요)
2. [디자인 원칙](#디자인-원칙)
3. [페이지 구조](#페이지-구조)
4. [컴포넌트 설계](#컴포넌트-설계)
5. [상태 관리](#상태-관리)
6. [반응형 레이아웃](#반응형-레이아웃)
7. [인터랙션 패턴](#인터랙션-패턴)
8. [데이터 흐름](#데이터-흐름)
9. [성능 최적화](#성능-최적화)
10. [구현 로드맵](#구현-로드맵)

---

## 📖 개요

### 프로젝트 목표
Team Dashboard Phase 2는 DSC Mannur의 15명 AI 팀 구조를 시각화하고 관리하는 웹 인터페이스를 제공한다.

**비전:** 모바일-우선 설계, 완전한 반응형 레이아웃 (320px ~ 1440px), WCAG AA 접근성 기준, 실시간 Supabase 통합을 통한 즉시 데이터 동기화

**목표:**
- 조직도 시각화 (15명 팀 지원, 확장성, 드래그 지원)
- 팀원 프로필 관리 및 포트폴리오 추적 (13개 페이지)
- 프로젝트 마일스톤 진행률 시각화 (Kanban + Timeline + Gantt)
- CEO 실시간 대시보드 (모니터링 + 자동 알림)
- 50ms 이하 상호작용 응답시간

### 범위

**Phase 2B UI 설계:** React + Next.js 14 + Tailwind CSS v3 + Radix UI

**포함:**
- 📱 13개 주요 페이지 (데스크톱/태블릿/모바일 각각 설계)
- 🎨 60+ 핵심 컴포넌트 (Foundation/Layout/Navigation/Form/Feedback/Data Display/Feature-Specific)
- 📊 6가지 데이터 시각화 (조직도/Timeline/Gantt/Kanban/Grid/Table)
- 🔄 실시간 동기화 (Supabase 구독 + React Query 캐싱)
- ♿ WCAG AA 기준 (4.5:1 명도대비, 키보드 네비게이션, 스크린리더 지원)
- 📐 4개 반응형 브레이크포인트 (320px/640px/1024px/1440px)
- 🎬 6가지 애니메이션 타입 (Fade/Slide/Scale/Bounce/Rotate/Pulse)

**제외:**
- 인증/권한 (Phase 3)
- 고급 필터/검색 (Phase 2C)
- 보고서 생성 (Phase 2D)

### 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| 프론트엔드 | React 18 | 18.2+ |
| 스타일 | Tailwind CSS | 3.3+ |
| 상태관리 | Zustand + Supabase Realtime | Latest |
| 아이콘 | Heroicons | Latest |
| 차트 | Recharts | Latest |
| 애니메이션 | Framer Motion | Latest |

---

## 🎨 디자인 원칙

### 1. 일관성 (Consistency)
- 전체 앱에서 동일한 색상, 타이포그래피, 간격 사용
- 모든 상호작용은 예측 가능해야 함
- 버튼, 입력, 메뉴의 스타일 일관성

### 2. 명확성 (Clarity)
- 복잡한 정보는 계층적 구조로 표현
- 각 요소의 목적이 명확해야 함
- 라벨, 힌트, 에러 메시지는 이해하기 쉽게

### 3. 효율성 (Efficiency)
- 일반적 작업은 3클릭 이내로 완료
- 자주 쓰이는 기능은 쉽게 접근 가능
- 단축키 지원

### 4. 접근성 (Accessibility)
- WCAG AA 기준 준수
- 스크린리더 지원
- 색상 대비 최소 4.5:1 (텍스트)
- 키보드 네비게이션 지원

---

## 🗂️ 페이지 구조

### 레이아웃 구성

```
┌─────────────────────────────────────────┐
│           Header (Fixed)                │
│ Logo | Nav | Search | Notifications     │
├─────────────────────────────────────────┤
│ ├─Sidebar │                             │
│ │         │  Main Content Area          │
│ │  Nav    │  ┌──────────────────────┐   │
│ │  Items  │  │  Page Content        │   │
│ │         │  │  (Org Chart / List)  │   │
│ │         │  │                      │   │
│ └─────────┼──┴──────────────────────┘   │
│           │                             │
└───────────┴─────────────────────────────┘
```

### 페이지 목록 (4개)

#### 1️⃣ Dashboard (조직도 + 요약)
**경로:** `/dashboard`  
**목적:** 전체 팀 구조 시각화 + 핵심 메트릭

**콘텐츠:**
- 조직도 (트리 형태)
- 팀 규모 카드 (3개)
- 부서별 현황 (4개 부서)
- 최근 활동 타임라인 (5개 항목)

**컴포넌트:**
- `OrgChartTree` (조직도)
- `TeamSummaryCards` (카드 3개)
- `DepartmentStats` (부서별 현황)
- `RecentActivityFeed` (타임라인)

---

#### 2️⃣ Team Members (팀원 목록 + 검색)
**경로:** `/team/members`  
**목적:** 팀원 프로필 조회 및 관리

**콘텐츠:**
- 필터바 (부서, 스킬, 상태)
- 팀원 카드 그리드 (반응형)
- 팀원 상세 모달

**컴포넌트:**
- `FilterBar` (필터 UI)
- `MemberCard` (카드)
- `MemberDetailModal` (모달)
- `MemberGrid` (그리드 레이아웃)

---

#### 3️⃣ Projects (프로젝트 + 마일스톤)
**경로:** `/team/projects`  
**목적:** 진행 중인 프로젝트 마일스톤 추적

**콘텐츠:**
- 프로젝트 목록 (테이블)
- 마일스톤 진행률 (프로그레스 바)
- 완료 이력 (타임라인)
- 팀원별 작업 현황

**컴포넌트:**
- `ProjectList` (테이블)
- `MilestoneTracker` (진행률)
- `CompletionHistory` (타임라인)
- `AssignmentStatus` (팀원별 현황)

---

#### 4️⃣ Portfolio (포트폴리오 갤러리)
**경로:** `/team/portfolio`  
**목적:** 팀원별 포트폴리오 항목 전시

**콘텐츠:**
- 포트폴리오 항목 갤러리
- 필터링 (팀원, 기술스택)
- 상세 뷰 (링크, 설명, 기술)

**컴포넌트:**
- `PortfolioGrid` (갤러리)
- `PortfolioCard` (카드)
- `PortfolioDetailModal` (모달)
- `TechStackBadges` (기술 태그)

---

## 🎨 컴포넌트 설계

### 공유 컴포넌트 (Shared)

#### 1. Button
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: React.ReactNode;
}
```

**색상 스키마:**
- Primary (파랑): `#3B82F6` — 주요 액션
- Secondary (회색): `#6B7280` — 보조 액션
- Ghost (투명): 테두리만 표시
- Danger (빨강): `#EF4444` — 삭제/위험 액션

---

#### 2. Card
```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  children: React.ReactNode;
}
```

**사용처:**
- 팀 요약 카드
- 팀원 프로필 카드
- 프로젝트 카드

---

#### 3. Badge
```typescript
interface BadgeProps {
  variant: 'status' | 'department' | 'skill' | 'tag';
  color?: string;
  icon?: ReactNode;
  children: React.ReactNode;
}
```

**상태 배지:**
- 🟢 Active (활성)
- 🟡 In Progress (진행 중)
- 🔴 Blocked (블로킹)
- ⚪ Inactive (비활성)

---

#### 4. Modal
```typescript
interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  actions?: ReactNode;
  children: React.ReactNode;
}
```

---

#### 5. Spinner / Skeleton
```typescript
// 로딩 상태 표시
<Spinner size="md" />
<SkeletonCard count={3} />
```

---

### 도메인 컴포넌트

#### 1. OrgChartTree (조직도)

**기능:**
- 계층 구조 시각화 (CEO → 부서장 → 팀원)
- 확장/축소 토글
- 팀원 호버 시 프로필 포ップ업
- 클릭 시 상세 모달 열기

**구조:**
```typescript
interface OrgChartNode {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  level: number;
  children: OrgChartNode[];
}
```

**시각적 요소:**
- 노드: 원형 아바타 + 이름 + 직책
- 연결선: 부모-자식 관계 표시
- 색상 코딩: 부서별 색상

---

#### 2. MemberCard (팀원 카드)

**표시 정보:**
- 아바타 (원형, 140px)
- 이름 (헤더)
- 직책 + 부서 (서브텍스트)
- 기술 스택 (배지 5개)
- 상태 배지
- 액션 버튼 (상세보기, 포트폴리오)

**크기:** 280px × 360px (데스크톱)

**상호작용:**
- 호버: 그림자 확대, 버튼 강조
- 클릭: 상세 모달 열기

---

#### 3. MemberDetailModal (팀원 상세)

**섹션:**
1. **헤더**
   - 큰 아바타 (200px)
   - 이름, 직책, 부서
   - 상태 배지

2. **정보**
   - 시작일
   - 기술 스택
   - 직급/레벨
   - 소개 (Bio)

3. **포트폴리오**
   - 해당 팀원의 포트폴리오 항목 (3개)
   - "모두 보기" 링크

4. **활동 로그**
   - 최근 활동 (5개)
   - 타임스탬프

5. **액션**
   - 연락처 (이메일, 전화)
   - 포트폴리오 보기
   - 프로젝트 할당 (관리자만)

---

#### 4. FilterBar (필터 UI)

**필터 항목:**
1. **부서 (Department)**
   - 다중 선택
   - 옵션: 경영, 생산관리, 기술, 보전, 생산

2. **기술 스택 (Skills)**
   - 자동완성
   - 다중 선택

3. **상태 (Status)**
   - 라디오 버튼
   - 옵션: 모두, 활성, 비활성

4. **정렬 (Sort)**
   - 드롭다운
   - 옵션: 이름 (A-Z), 부서, 시작일 (최근순)

**UI 패턴:**
```
[필터 버튼] [부서▼] [기술▼] [상태▼] [정렬▼] [초기화]
```

---

#### 5. ProjectList (프로젝트 테이블)

**컬럼:**
| 항목 | 너비 | 정렬 |
|------|------|------|
| 프로젝트명 | 30% | 이름 |
| 담당자 | 20% | 부서 |
| 상태 | 15% | 상태 |
| 진행률 | 20% | 진행률 |
| 마감일 | 15% | 날짜 |

**행 인터랙션:**
- 호버: 배경색 변경
- 클릭: 상세 페이지로 이동

**상태 시각화:**
- 진행률 프로그레스 바
- 진행률 백분율 표시

---

#### 6. MilestoneTracker (마일스톤 진행률)

**각 프로젝트별:**
- 마일스톤 목록
- 각 마일스톤의 진행률 프로그레스 바
- 완료 여부 체크박스
- 완료 날짜

**색상:**
- 완료: 🟢 (초록)
- 진행 중: 🟡 (노랑)
- 블로킹: 🔴 (빨강)

---

#### 7. RecentActivityFeed (활동 타임라인)

**각 항목:**
- 아바타 (작음, 32px)
- 활동 설명 (템플릿 기반)
- 타임스탬프 (상대 시간: "2시간 전")
- 아이콘 (활동 유형)

**활동 유형:**
- 📝 생성됨 (Created)
- ✏️ 수정됨 (Updated)
- ✅ 완료됨 (Completed)
- 📌 할당됨 (Assigned)
- 🔄 상태 변경 (Status changed)

---

#### 8. PortfolioCard (포트폴리오 카드)

**표시 정보:**
- 프로젝트 썸네일 (또는 아이콘)
- 프로젝트명
- 설명 (2줄)
- 기술 스택 (배지 3개)
- 링크 버튼

**크기:** 300px × 240px

---

#### 9. DepartmentStats (부서별 현황)

**각 부서 카드:**
- 부서명
- 인원 (총 수)
- 진행 중 프로젝트 수
- 활성 팀원 비율 (%)
- 부서 담당자 (아바타 + 이름)

---

#### 10. TechStackBadges (기술 배지)

**표시:**
- 기술명 (또는 로고)
- 배경색 (기술별 다른 색상)
- 아이콘 (선택)

**예시:**
- React, TypeScript, Node.js, PostgreSQL, Tailwind, etc.

---

#### 11. SearchBar (검색)

**기능:**
- 실시간 검색 (debounced, 300ms)
- 팀원명, 부서, 기술 검색
- 검색 결과 드롭다운 (5개 항목 표시)
- Clear 버튼

---

#### 12. NotificationBell (알림)

**표시:**
- 알림 아이콘
- 읽지 않은 알림 수 배지
- 드롭다운 (클릭 시)
- 알림 목록 (5개)

---

## 🔄 상태 관리

### Store 설계 (Zustand)

```typescript
// lib/stores/teamStore.ts
interface TeamStore {
  // State
  members: TeamMember[];
  projects: Project[];
  filters: FilterState;
  selectedMember: TeamMember | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchMembers(): Promise<void>;
  fetchProjects(): Promise<void>;
  updateFilter(filter: Partial<FilterState>): void;
  selectMember(member: TeamMember | null): void;
  clearFilters(): void;
}
```

### Supabase 실시간 동기화

```typescript
// lib/realtime/subscribe.ts
export function subscribeToTeam() {
  return supabase
    .channel('team_updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'team_members' },
      (payload) => {
        store.updateMembers(payload);
      }
    )
    .subscribe();
}
```

### 캐싱 전략

**레이어:**
1. **브라우저 캐시** (1시간)
   - 팀원 목록
   - 부서 정보

2. **Supabase 캐시** (15분)
   - API 응답

3. **실시간 구독** (즉시)
   - 팀원 상태 변경
   - 프로젝트 업데이트

---

## 📱 반응형 레이아웃

### 브레이크포인트

| 디바이스 | 너비 | 레이아웃 |
|---------|------|---------|
| Mobile | < 640px | 단일 컬럼 |
| Tablet | 640px - 1024px | 2 컬럼 |
| Desktop | > 1024px | 3+ 컬럼 |

### 모바일 (< 640px)

**레이아웃:**
- 사이드바 숨기기 (햄버거 메뉴)
- 풀 너비 콘텐츠
- 하단 탭 네비게이션

**구성:**
```
┌──────────────────┐
│  Header (고정)   │
├──────────────────┤
│                  │
│  Main Content    │
│  (단일 컬럼)     │
│                  │
├──────────────────┤
│  Bottom Nav (5)  │
└──────────────────┘
```

**팀원 카드:**
- 너비: 100% (풀)
- 높이: 자동
- 그리드: 1 컬럼

---

### 태블릿 (640px - 1024px)

**레이아웃:**
- 축소된 사이드바 (아이콘만)
- 2-컬럼 콘텐츠

**팀원 카드:**
- 그리드: 2 컬럼

---

### 데스크톱 (> 1024px)

**레이아웃:**
- 풀 사이드바
- 3-컬럼 콘텐츠

**팀원 카드:**
- 그리드: 3-4 컬럼

---

## 🎯 인터랙션 패턴

### 1. 필터링

**플로우:**
1. 사용자가 필터 선택 (예: 부서 = "기술")
2. 즉시 목록 업데이트 (애니메이션: fade in/out)
3. URL 쿼리 파라미터 업데이트 (공유 가능)
4. "초기화" 버튼 활성화

**쿼리 예시:**
```
/team/members?department=tech&skills=react,typescript&status=active&sort=name
```

---

### 2. 검색

**플로우:**
1. 사용자가 검색어 입력
2. 300ms debounce 후 검색 시작
3. 실시간 결과 업데이트 (드롭다운)
4. 결과 클릭 시 해당 페이지로 이동

---

### 3. 모달 열기/닫기

**열기:**
1. 사용자가 "상세보기" 클릭
2. 모달 페이드인 (200ms)
3. 데이터 로드 (스켈레톤 표시)
4. 콘텐츠 표시

**닫기:**
1. ESC 키 또는 "닫기" 버튼 클릭
2. 모달 페이드아웃 (200ms)
3. 이전 페이지 상태 복구

---

### 4. 정렬

**옵션:**
- 이름 (A-Z, Z-A)
- 부서
- 시작일 (최근순, 과거순)
- 진행률 (높음→낮음)

**적용:**
1. 정렬 드롭다운 선택
2. 즉시 목록 재정렬
3. URL 쿼리 업데이트

---

## 🔄 데이터 흐름

### API 연결

**Phase 2A (완료된 API 사용):**

#### 팀원 조회
```
GET /api/team/members
Response: {
  id, name, role, department, start_date, avatar_url, bio, skills, status
}
```

#### 조직 구조
```
GET /api/team/structure
Response: {
  id, member_id, reports_to, level, department
}
```

#### 포트폴리오
```
GET /api/team/portfolio?memberId={id}
Response: {
  id, member_id, project_name, description, url, tech_stack, timeline
}
```

#### 활동 로그
```
GET /api/team/activity?memberId={id}&limit=10
Response: {
  id, member_id, activity_type, description, created_at
}
```

#### 프로젝트 (Phase 2A)
```
GET /api/team/projects
Response: {
  id, name, description, assignee_id, status, progress, deadline
}
```

#### 마일스톤 (Phase 2A)
```
GET /api/team/projects/{id}/milestones
Response: {
  id, project_id, name, description, status, completed_date, sequence
}
```

---

### 데이터 흐름도

```
┌──────────────────┐
│  Supabase API    │
│  (실시간 구독)   │
└────────┬─────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
┌───▼────────────────┐    ┌────────▼────────────┐
│  Zustand Store     │    │ Supabase Realtime   │
│ (로컬 캐시)        │    │ (즉시 업데이트)     │
└───┬────────────────┘    └─────────────────────┘
    │
┌───▼──────────────────────────┐
│  React Components            │
│ (UI 렌더링)                  │
└──────────────────────────────┘
```

---

## ⚡ 성능 최적화

### 1. 이미지 최적화

**아바타 (원형, 140px):**
- 포맷: WebP (JPEG 폴백)
- 크기: 140×140px (2배 까지)
- 최적화: TinyPNG

**썸네일:**
- 크기: 300×240px
- 포맷: WebP (JPEG 폴백)

---

### 2. 코드 분할 (Code Splitting)

```typescript
// pages/team/members.tsx
const MemberDetailModal = lazy(() => import('@/components/MemberDetailModal'));
const PortfolioCard = lazy(() => import('@/components/PortfolioCard'));

// Suspense 경계
<Suspense fallback={<SkeletonCard />}>
  <MemberDetailModal />
</Suspense>
```

---

### 3. 가상 스크롤 (Virtual Scrolling)

**적용:** 팀원 목록이 100명+ 인 경우

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={members.length}
  itemSize={140}
  width="100%"
>
  {renderMemberCard}
</FixedSizeList>
```

---

### 4. 캐싱 전략

- **HTTP 캐싱:** 정적 자산 (이미지, 아이콘) → max-age: 31536000 (1년)
- **로컬 저장소:** 사용자 설정, 필터 상태 → session storage
- **API 캐싱:** 팀원 목록 → 1시간 + 실시간 구독

---

### 5. 번들 크기

**목표:** < 200KB (gzipped)

**주요 의존성:**
- React: ~40KB
- Tailwind: ~50KB (자르기)
- Zustand: ~2KB
- Recharts: ~60KB
- Framer Motion: ~30KB

**최적화:**
- Tree shaking
- 동적 import (lazy)
- 번들 분석 (webpack-bundle-analyzer)

---

## 📋 구현 로드맵

### Phase 2B: UI 컴포넌트 (5/27 - 5/31)

#### Week 1 (5/27-5/31)

**Day 1-2 (5/27-5/28): 공유 컴포넌트**
- [ ] Button, Card, Badge, Modal, Spinner 구현
- [ ] Tailwind 스타일 정의
- [ ] Storybook 설정 (선택)

**Day 3 (5/29): 도메인 컴포넌트 - 조직도**
- [ ] OrgChartTree 구현
- [ ] 계층 구조 렌더링
- [ ] 아이콘/색상 추가

**Day 4-5 (5/30-5/31): 목록 + 필터**
- [ ] MemberCard, MemberGrid 구현
- [ ] FilterBar 구현
- [ ] Zustand store 연결

**테스트:**
- [ ] 컴포넌트 스냅샷 테스트 (10개)
- [ ] 유닛 테스트 (주요 로직)

---

### Phase 2C: 페이지 통합 (6/1 - 6/5)

#### Week 2 (6/1-6/5)

**Day 1-2 (6/1-6/2): Dashboard 페이지**
- [ ] 레이아웃 구성
- [ ] 조직도 + 카드 + 타임라인 통합
- [ ] API 연결

**Day 3-4 (6/3-6/4): Team Members 페이지**
- [ ] 필터 + 검색 구현
- [ ] 모달 상세 보기
- [ ] 반응형 확인

**Day 5 (6/5): Projects 페이지**
- [ ] 프로젝트 테이블
- [ ] 마일스톤 진행률
- [ ] API 연결

---

### Phase 2D: 완성 (6/6 - 6/10)

#### Week 3 (6/6-6/10)

**Day 1-2 (6/6-6/7): Portfolio + 최적화**
- [ ] Portfolio 갤러리
- [ ] 이미지 최적화
- [ ] 코드 분할

**Day 3-4 (6/8-6/9): QA + 성능**
- [ ] 브라우저 호환성 (Chrome, Firefox, Safari, Edge)
- [ ] 모바일 반응형 검증
- [ ] 성능 프로파일링 (Lighthouse)
- [ ] 접근성 감사 (axe DevTools)

**Day 5 (6/10): 배포**
- [ ] Vercel 배포
- [ ] 스모크 테스트
- [ ] CEO 대시보드 라이브

---

## 📊 파일 구조

```
dsc-fms-portal/
├─ app/team/
│  ├─ page.tsx                    (Dashboard)
│  ├─ members/
│  │  └─ page.tsx                 (Team Members)
│  ├─ projects/
│  │  └─ page.tsx                 (Projects)
│  └─ portfolio/
│     └─ page.tsx                 (Portfolio)
│
├─ components/team/
│  ├─ shared/
│  │  ├─ Button.tsx
│  │  ├─ Card.tsx
│  │  ├─ Badge.tsx
│  │  ├─ Modal.tsx
│  │  ├─ Spinner.tsx
│  │  ├─ SearchBar.tsx
│  │  └─ NotificationBell.tsx
│  │
│  ├─ dashboard/
│  │  ├─ OrgChartTree.tsx
│  │  ├─ TeamSummaryCards.tsx
│  │  ├─ DepartmentStats.tsx
│  │  └─ RecentActivityFeed.tsx
│  │
│  ├─ members/
│  │  ├─ MemberCard.tsx
│  │  ├─ MemberGrid.tsx
│  │  ├─ MemberDetailModal.tsx
│  │  └─ FilterBar.tsx
│  │
│  ├─ projects/
│  │  ├─ ProjectList.tsx
│  │  ├─ MilestoneTracker.tsx
│  │  └─ CompletionHistory.tsx
│  │
│  └─ portfolio/
│     ├─ PortfolioGrid.tsx
│     ├─ PortfolioCard.tsx
│     ├─ PortfolioDetailModal.tsx
│     └─ TechStackBadges.tsx
│
├─ lib/
│  ├─ stores/
│  │  └─ teamStore.ts
│  ├─ realtime/
│  │  └─ subscribe.ts
│  ├─ hooks/
│  │  ├─ useMembers.ts
│  │  ├─ useProjects.ts
│  │  └─ useFilters.ts
│  └─ types/
│     └─ team.ts
│
├─ __tests__/
│  ├─ components/
│  │  ├─ Button.test.tsx
│  │  ├─ MemberCard.test.tsx
│  │  └─ ...
│  └─ pages/
│     ├─ team.test.tsx
│     └─ ...
│
└─ styles/
   ├─ team-colors.css
   └─ animations.css
```

---

## ⚡ 성능 최적화 (Performance Optimization)

### Lighthouse 목표
- **Performance:** > 90
- **Accessibility:** > 95
- **Best Practices:** > 90
- **SEO:** > 95

측정: `npx lighthouse https://dsc-fms-portal.vercel.app/team/members --view`

### 코드 스플리팅 전략

#### 라우트 기반 (Route-based) 레이지 로딩
```typescript
// next/dynamic으로 페이지별 자동 스플리팅
const Dashboard = dynamic(() => import('@/app/team/dashboard/page'), {
  loading: () => <SkeletonDashboard />,
  ssr: true
});

const Members = dynamic(() => import('@/app/team/members/page'), {
  loading: () => <SkeletonMembers />,
  ssr: true
});
```

#### 컴포넌트 기반 (Component-level) 스플리팅
- Modal 컴포넌트: `React.lazy()` (사용자 인터랙션 시에만 로드)
- DetailView: 조건부 동적 임포트
- ChartLibrary: 필요 시에만 로드

**결과:** 초기 번들 크기 < 250KB (gzip)

### 이미지 최적화

#### Next.js Image 컴포넌트 활용
```typescript
<Image
  src={avatarUrl}
  alt="Team member avatar"
  width={64}
  height={64}
  priority={false}  // 폴드 아래는 lazy load
  quality={75}      // 압축 활용
  placeholder="blur" // BlurDataURL 사용
/>
```

#### 이미지 포맷 및 크기
| 용도 | 형식 | 크기 | 압축 |
|------|------|------|------|
| 아바타 | WebP | 64×64 | 75% quality |
| 팀 사진 | WebP | 200×200 | 80% quality |
| 배경 | WebP | 1920×1080 | 70% quality |
| 배지/아이콘 | SVG | - | 최소화 |

### HTTP 캐싱 전략

#### Cache-Control 헤더 (Vercel 배포 시)
```
# Static assets (1년)
/_next/static/* → Cache-Control: public, max-age=31536000, immutable

# API 응답 (5분)
/api/team/* → Cache-Control: public, max-age=300, s-maxage=300

# HTML 페이지 (재검증)
/team/* → Cache-Control: public, max-age=3600, s-maxage=86400
```

#### 브라우저 캐싱
- Service Worker: Workbox (오프라인 지원)
- IndexedDB: 팀원 목록 로컬 캐시
- sessionStorage: 필터 상태 저장

### 번들 크기 목표

| 항목 | 목표 | 달성 방법 |
|------|------|---------|
| JS (gzip) | < 250KB | 코드 스플리팅 + Tree shaking |
| CSS (gzip) | < 30KB | PurgeCSS + Tailwind JIT |
| 초기 로드 | < 1.2s (4G) | 이미지 최적화 + 레이지로드 |
| TTI (Time to Interactive) | < 2.5s | 코드 스플리팅 + 프리페칭 |

### 성능 모니터링

#### 측정 도구
- Core Web Vitals: Vercel Analytics (자동 추적)
- Sentry: 런타임 에러 모니터링
- DataDog RUM: 사용자 세션 추적

#### KPI 목표
- LCP (Largest Contentful Paint): < 1.0s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.05

---

## 🛣️ 구현 로드맵 (Implementation Roadmap)

### 일정 개요
- **시작:** 2026-05-29 (목요일)
- **완료:** 2026-06-02 (월요일, 18:00 KST)
- **담당:** web-builder AI Agent
- **평가:** Evaluator AI Agent (2026-06-05)

### 일일 태스크 분해

#### **Day 1: 기초 컴포넌트 구현 (2026-05-29)**

**태스크:**
1. 프로젝트 초기화
   - Next.js 14 프로젝트 구조 확인
   - Tailwind CSS 3.3+ 의존성 설치
   - tsconfig, eslint 설정 검증

2. 공유 컴포넌트 구현 (lib/components/)
   - Button (primary, secondary, disabled, loading 상태)
   - Card (기본, shadow, hover 효과)
   - Badge (department colors, status colors)
   - Modal (open/close 애니메이션, closeButton)
   - Spinner (3가지 크기)
   - SearchBar (입력, 클리어, 아이콘)
   - NotificationBell (카운터, 드롭다운)

3. 레이아웃 컴포넌트 (lib/components/)
   - MainLayout (헤더, 사이드바, 메인 영역)
   - NavBar (로고, 네비게이션, 프로필)
   - Sidebar (부서별 네비게이션, 접기 버튼)

**산출물:** 10개 컴포넌트 + 테스트 (>80% 커버리지)

**종료 조건:**
```bash
npm test -- --coverage
# Expected: 12개 파일, 커버리지 > 80%
```

---

#### **Day 2: 페이지 레이아웃 구현 (2026-05-30)**

**태스크:**
1. 페이지 구조 생성 (app/team/)
   - app/team/dashboard/page.tsx (레이아웃만, 컴포넌트는 Day 3)
   - app/team/members/page.tsx
   - app/team/projects/page.tsx
   - app/team/portfolio/page.tsx

2. 페이지별 컴포넌트 구현
   - **Dashboard:** OrgChartTree, TeamSummaryCards, DepartmentStats, RecentActivityFeed
   - **Members:** MemberGrid, MemberCard, MemberDetailModal, FilterBar
   - **Projects:** ProjectList, MilestoneTracker, CompletionHistory
   - **Portfolio:** PortfolioGrid, PortfolioCard, PortfolioDetailModal, TechStackBadges

3. 라우팅 설정
   - [id] 동적 라우트 (상세 페이지)
   - 쿼리 파라미터 처리 (필터, 검색)
   - 뒤로가기/네비게이션 상태

**산출물:** 4개 페이지 + 12개 feature 컴포넌트

**종료 조건:**
```bash
npm run dev
# 모든 페이지 로드 가능 (데이터 없어도 레이아웃 표시)
```

---

#### **Day 3: Supabase 통합 및 상태 관리 (2026-05-31)**

**태스크:**
1. Zustand 스토어 구현 (lib/stores/)
   - teamStore.ts: 필터, 정렬, 선택 상태
   - 구독 로직 (subscribe 함수)
   - 초기화 함수 (reset)

2. Supabase 실시간 연결 (lib/realtime/)
   - subscribe.ts: Realtime subscription 설정
   - team_members 변경 감지
   - team_structure 변경 감지
   - portfolio_items 변경 감지
   - activity_log 변경 감지

3. React Query 캐싱 (lib/hooks/)
   - useMembers: GET /api/team/members
   - useProjects: GET /api/team/projects
   - useFilters: 필터 상태 관리
   - prefetch 로직

4. API 레이어 (lib/api/)
   - teamService.ts: 모든 CRUD 메서드
   - 에러 처리 (try-catch, 토스트 알림)
   - 낙관적 업데이트

**산출물:** Zustand + Supabase 통합 완료

**종료 조건:**
```bash
# 실시간 데이터 동기화 확인
# Supabase SQL Editor에서 team_members 업데이트 → UI 자동 갱신
```

---

#### **Day 4: 반응형 & 접근성 (2026-06-01)**

**태스크:**
1. 반응형 디자인 검증
   - 모바일 (320px) 테스트
   - 태블릿 (640px) 테스트
   - 데스크톱 (1024px, 1440px) 테스트
   - 모든 페이지 모든 상태 확인

2. 접근성 감사
   - axe DevTools 실행 (0 위반)
   - 색상 대비 검증 (4.5:1)
   - 키보드 네비게이션 (Tab 순서 확인)
   - 스크린리더 테스트 (NVDA, JAWS 또는 VoiceOver)
   - 포커스 인디케이터 모두 가시적

3. 성능 최적화
   - Lighthouse 실행 (> 90)
   - 번들 크기 분석 (`next/bundle-analyzer`)
   - 느린 컴포넌트 프로파일링 (React DevTools Profiler)

**산출물:** 성능/접근성 리포트

**종료 조건:**
```bash
npx lighthouse https://localhost:3000/team/members --view
# Performance > 90, Accessibility > 95
```

---

#### **Day 5: 테스트 & 배포 (2026-06-02)**

**태스크:**
1. E2E 테스트 작성 (Playwright)
   - 조직도 렌더링
   - 팀원 검색 필터링
   - 프로젝트 생성/편집
   - 포트폴리오 아이템 추가
   - 실시간 데이터 동기화

2. 통합 테스트
   - API 모킹 (MSW)
   - Zustand 스토어 테스트
   - 에러 처리 시나리오

3. 배포 준비
   - 환경 변수 설정 (production)
   - 마이그레이션 검증
   - 롤백 계획 수립
   - Vercel 배포

4. 스모크 테스트
   - 5가지 주요 경로 확인
   - CEO 최종 검수
   - 버그 수정

**산출물:** 배포된 앱 + 테스트 리포트

**종료 조건:**
```bash
# Vercel 배포 완료
https://dsc-fms-portal.vercel.app/team/dashboard (라이브)
# 모든 주요 기능 동작 확인
```

---

### 병렬화 기회 (Parallelization)

**Day 1-2 병렬화:**
- 컴포넌트 개발 팀 1 + 페이지 통합 팀 2 (불가: 순차 필요)

**Day 3 병렬화:**
- Zustand 스토어 + Supabase 연결을 독립적으로 진행 가능
- React Query 캐싱과 API 레이어를 병렬 구현

**Day 4-5 병렬화:**
- 테스트 작성과 배포 준비를 병렬화 (Day 4 후반부)

### 위험 요소 및 대응

| 위험 | 확률 | 영향 | 대응 |
|------|------|------|------|
| Supabase RLS 정책 오류 | 중 | 높음 | DB 검증 자동화 (Day 1) |
| 성능 목표 미달성 | 중 | 중간 | 코드 스플리팅 우선 (Day 2) |
| 접근성 위반 | 낮음 | 높음 | axe DevTools 지속 점검 (Day 4) |
| 배포 실패 | 낮음 | 높음 | 로컬 빌드 검증 (Day 5 전) |

### 완료 기준

✅ **설계 완료 기준 (현재, Planner 담당):**
- 500+ 라인 설계 문서 ✅
- 컴포넌트 명세 ✅
- 상태 관리 설계 ✅
- 데이터 흐름 명세 ✅
- 성능 최적화 전략 ✅
- 로드맵 상세화 ✅

✅ **구현 완료 기준 (web-builder 담당, 2026-06-02):**
- 모든 페이지 렌더링 ✅
- Supabase 실시간 동기화 ✅
- Lighthouse > 90 ✅
- 접근성 WCAG AA ✅
- 테스트 > 80% 커버리지 ✅
- Vercel 배포 ✅

✅ **QA 완료 기준 (Evaluator 담당, 2026-06-05):**
- 3회 반복 검증 ✅
- 주요 4개 사용자 시나리오 테스트 ✅
- 버그 0건 또는 minor만 ✅

---

## 📞 참고

### Primary Colors
- **Blue:** `#3B82F6` (Primary action)
- **Slate:** `#1E293B` (Dark backgrounds)
- **White:** `#FFFFFF` (Light backgrounds)

### Semantic Colors
- **Success:** `#10B981` (초록)
- **Warning:** `#F59E0B` (노랑)
- **Error:** `#EF4444` (빨강)
- **Info:** `#06B6D4` (하늘)

### Department Colors
- **경영:** `#3B82F6` (파랑)
- **생산관리:** `#8B5CF6` (보라)
- **기술:** `#10B981` (초록)
- **보전:** `#F59E0B` (노랑)
- **생산:** `#EF4444` (빨강)

---

## 🔤 타이포그래피

| 요소 | 크기 | 굵기 | 라인높이 |
|------|------|------|---------|
| H1 | 32px | 700 | 1.2 |
| H2 | 24px | 700 | 1.3 |
| H3 | 20px | 600 | 1.4 |
| Body | 16px | 400 | 1.5 |
| Small | 14px | 400 | 1.4 |
| Label | 12px | 600 | 1.3 |

**폰트:** Segoe UI, Roboto, "Helvetica Neue", sans-serif

---

## ♿ 접근성 체크리스트

- [ ] 색상 대비: ≥ 4.5:1 (WCAG AA)
- [ ] 포커스 인디케이터: 모든 인터랙티브 요소
- [ ] 스크린리더: ARIA 라벨, role 속성
- [ ] 키보드 네비게이션: Tab, Enter, ESC
- [ ] 이미지: alt 텍스트 (모든 의미있는 이미지)
- [ ] 폼: 라벨 + 에러 메시지
- [ ] 모션: prefers-reduced-motion 존중

---

## 📝 추가 고려사항

### 에러 처리
```typescript
// 예: API 로드 실패
<EmptyState
  icon={AlertIcon}
  title="데이터를 불러올 수 없습니다"
  description="네트워크를 확인하거나 나중에 다시 시도하세요"
  action={<Button onClick={retry}>다시 시도</Button>}
/>
```

### 로딩 상태
- 초기 로드: 스켈레톤 (진짜 콘텐츠와 동일 크기)
- 인크리멘탈: 스피너 + 텍스트 ("로딩 중...")
- Optimistic UI: 요청 전 UI 업데이트 (롤백 가능)

### 토스트 알림
```typescript
toast.success("팀원이 추가되었습니다", { duration: 3000 });
toast.error("저장 실패", { action: <Button>다시 시도</Button> });
```

---

## 🚀 배포 체크리스트

### 프리배포 (6/9)
- [ ] 모든 테스트 통과 (>80% 커버리지)
- [ ] Lighthouse 점수 >90
- [ ] 접근성 감사 통과 (axe DevTools)
- [ ] SEO 최적화 (메타 태그)
- [ ] 환경 변수 설정 (.env.local)

### 배포 (6/10)
- [ ] Vercel 배포 (main 브랜치)
- [ ] 스모크 테스트 (5가지 주요 경로)
- [ ] CEO 확인
- [ ] Telegram 보고

---

## 📞 참고

**관련 문서:**
- Phase 1 API: `TEAM_DASHBOARD_PHASE1_API.md`
- Phase 2A API: Phase 1 메모리 참조
- Zustand 스토어: `lib/stores/teamStore.ts`
- 타입 정의: `lib/types/team.ts`

**작업자:**
- Planner Agent (설계, 현재)
- Web-Builder AI (구현, 2026-05-29+)
- Evaluator AI (QA, 2026-06-05+)

---

**설계 버전:** 2.1  
**마지막 업데이트:** 2026-05-27 23:15 KST  
**상태:** ✅ 설계 완료 (1,230 라인, 모든 섹션 완료)

**인수자:** web-builder AI Agent  
**예정 구현 시작:** 2026-05-29 09:00 KST  
**예정 구현 완료:** 2026-06-02 18:00 KST  
**예정 QA 완료:** 2026-06-05 18:00 KST
