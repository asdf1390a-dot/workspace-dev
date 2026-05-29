# 팀 대시보드 Phase 2 구현 타임라인

**작성:** 2026-05-28  
**대상:** 웹개발자#2  
**기간:** 2026-05-28 ~ 2026-06-01 (5일, 36-44시간)  
**마감:** 2026-06-01 18:00 KST  
**검증:** Vercel 배포 완료 + Lighthouse 90+ + WCAG 2.1 AA

---

## 개요

본 타임라인은 [TEAM_DASHBOARD_PHASE2_UI_DESIGN.md](TEAM_DASHBOARD_PHASE2_UI_DESIGN.md) 및 [COMPONENT_SPECIFICATION.json](COMPONENT_SPECIFICATION.json)를 기반으로 하는 상세 5일 개발 로드맵입니다.

**핵심 목표:**
- Redux Toolkit 상태 관리 (3개 슬라이스: team, portfolio, activity)
- 3탭 UI (조직도, 포트폴리오, 활동로그)
- 모바일/태블릿/데스크톱 완전 응답형
- API 통합 (4개 엔드포인트)
- 성능 최적화 (<100KB gzip, <2s 초기 로드)
- Vercel 배포 완료

**의존성:**
- Phase 1 API 완료 (10개 엔드포인트, ✅ 2026-05-27)
- COMPONENT_SPECIFICATION.json (20+ 컴포넌트 명세, ✅ 2026-05-27)
- 설계 문서 승인 (Evaluator Agent, ✅ 예정)

---

## Day 1: 레이아웃 & 상태 관리 (2026-05-28)

**예상 소요시간:** 6-8시간 (09:00 시작, 15:00~17:00 완료)

### 목표
Redux 스토어 + 기본 레이아웃 설정 완료. 빌드 성공 및 상태 관리 기초 확보.

### 작업 목록

#### 1. Redux 스토어 설정 (2시간)
```
파일: dsc-fms-portal/store/configureStore.ts
```
- [ ] Redux store 초기화 (@reduxjs/toolkit)
- [ ] DevTools 통합
- [ ] 3개 슬라이스 정의 (team, portfolio, activity)
- [ ] 타입 안전성 (TypeScript)
- [ ] 미들웨어 설정 (logger, thunk)

**검증:**
```bash
npm run build  # 번들 크기 < 100KB (gzip)
```

#### 2. Redux 슬라이스 구현 (1.5시간)
```
경로: dsc-fms-portal/store/slices/
  - teamSlice.ts (조직도 상태)
  - portfolioSlice.ts (포트폴리오 상태)
  - activitySlice.ts (활동로그 상태)
```

**각 슬라이스 포함 사항:**
- Initial state 정의
- Reducers (로딩, 성공, 실패 액션)
- Selectors (getTeamStructure, getPortfolioProjects 등)
- Async thunks (데이터 페칭)

**타입 정의:**
```typescript
// store/types/team.ts
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  reportingTo: string | null;
}

export interface TeamStructure {
  root: TeamMember;
  members: TeamMember[];
  tree: TreeNode[];
}
```

#### 3. DashboardLayout 컴포넌트 (2시간)
```
파일: dsc-fms-portal/components/DashboardLayout.tsx
```
- [ ] 8칼럼 그리드 레이아웃 (Tailwind CSS)
- [ ] Header 컴포넌트 (로고, 검색, 프로필)
- [ ] Tab 네비게이션 (데스크톱: 상단)
- [ ] BottomNav (모바일: 하단)
- [ ] 반응형 브레이크포인트 (sm: 640px, md: 1024px)
- [ ] Redux Provider 연결

**구조:**
```
DashboardLayout
├── Header (고정, 상단)
├── TabBar (데스크톱만)
├── MainContent
│   └── 3개 탭 (조직도/포트폴리오/활동로그)
└── BottomNav (모바일만)
```

#### 4. API 서비스 레이어 설정 (1.5시간)
```
파일: dsc-fms-portal/services/dashboardAPI.ts
```
- [ ] Supabase 클라이언트 초기화 (@supabase/supabase-js)
- [ ] 4개 엔드포인트 래퍼:
  - `getTeamStructure()` → GET /api/team/structure
  - `getPortfolioProjects()` → GET /api/team/projects
  - `getProjectMilestones()` → GET /api/team/projects/:id/milestones
  - `getActivityLog()` → GET /api/team/activity
- [ ] 에러 핸들링 (재시도, 타임아웃)
- [ ] 캐싱 전략 (선택사항)

**예시:**
```typescript
export const dashboardAPI = {
  async getTeamStructure() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('active', true);
    if (error) throw error;
    return buildTreeStructure(data);
  },
};
```

#### 5. CSS 기초 & 스타일 시스템 (1시간)
```
파일: dsc-fms-portal/styles/globals.css
파일: dsc-fms-portal/tailwind.config.ts (이미 존재)
```
- [ ] Tailwind 색상 팔레트 (설계 문서 기준)
- [ ] 간격 시스템 (8px 기준)
- [ ] 타이포그래피 (Heading 1-3, Body, Caption)
- [ ] 반응형 유틸리티 클래스
- [ ] Dark mode (선택사항, 2단계)

### 산출물

- **Redux 스토어** (store/configureStore.ts)
- **3개 슬라이스** (store/slices/)
- **DashboardLayout 컴포넌트** (components/DashboardLayout.tsx)
- **API 서비스** (services/dashboardAPI.ts)
- **CSS 기초** (styles/globals.css)
- **빌드 성공 확인** (번들 < 100KB)

### 검증 체크리스트
- [ ] `npm run build` 성공
- [ ] 번들 크기 < 100KB (gzip)
- [ ] TypeScript 컴파일 오류 0건
- [ ] Redux DevTools에서 상태 확인 가능
- [ ] Tailwind 클래스 적용 확인

---

## Day 2: 조직도 컴포넌트 (2026-05-29)

**예상 소요시간:** 8-10시간 (09:00~19:00)

### 목표
완전한 조직도 탭 + 반응형 + 모달 기능 완성.

### 작업 목록

#### 1. OrganizationTab 컴포넌트 (1시간)
```
파일: dsc-fms-portal/components/tabs/OrganizationTab.tsx
```
- [ ] Redux에서 teamSlice 데이터 선택
- [ ] 뷰 전환 버튼 (TreeView ↔ ListView)
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리

#### 2. TreeView 컴포넌트 (3시간)
```
파일: dsc-fms-portal/components/OrganizationTreeView.tsx
```
- [ ] 트리 구조 렌더링 (재귀)
- [ ] 노드 확장/축소 기능
- [ ] 부사장 → 매니저 → 직원 계층 표시
- [ ] 각 노드에 역할 아이콘 표시
- [ ] 데스크톱 최적화 (1024px+)

**데이터 구조:**
```typescript
interface TreeNode {
  id: string;
  name: string;
  role: string;
  department: string;
  children: TreeNode[];
}
```

#### 3. ListView 컴포넌트 (2시간)
```
파일: dsc-fms-portal/components/OrganizationListView.tsx
```
- [ ] 플랫 리스트 (검색 + 필터 가능)
- [ ] 부서별 그룹화
- [ ] 카드 스타일 (모바일 최적화)
- [ ] 각 항목에 프로필 터치 영역 확대

#### 4. TeamMemberProfileModal (2시간)
```
파일: dsc-fms-portal/components/modals/TeamMemberProfileModal.tsx
```
- [ ] 모달 오버레이
- [ ] 팀원 프로필 정보 (이름, 직책, 부서, 연락처)
- [ ] 프로필 이미지 표시
- [ ] 팀원의 프로젝트 목록 (포트폴리오 탭 링크)
- [ ] 닫기 버튼 & ESC 키 처리
- [ ] 접근성 (aria-modal, focus trap)

#### 5. API 통합 & 상태 연결 (1.5시간)
```
파일: dsc-fms-portal/store/slices/teamSlice.ts (수정)
```
- [ ] useEffect에서 `getTeamStructure()` 호출
- [ ] Redux 액션으로 상태 업데이트
- [ ] 데이터 패칭 중 로딩 상태 표시
- [ ] 에러 처리 (재시도 버튼)

#### 6. 반응형 테스트 (1시간)
```
테스트 대상:
  - Desktop (1024px+): TreeView 포함, 3칼럼 레이아웃
  - Tablet (640-1023px): ListView로 전환, 2칼럼
  - Mobile (320-639px): ListView, 1칼럼, BottomNav
```
- [ ] Chrome DevTools로 각 화면 크기 검증
- [ ] BottomNav에서 탭 전환 확인
- [ ] 모달 열고 닫기 (모든 기기)

### 산출물

- **OrganizationTab.tsx**
- **OrganizationTreeView.tsx**
- **OrganizationListView.tsx**
- **TeamMemberProfileModal.tsx**
- **Redux 슬라이스 업데이트** (teamSlice.ts)
- **단위 테스트** (3개 이상)
  - TreeNode 렌더링
  - 모달 열기/닫기
  - API 호출 성공/실패

### 검증 체크리스트
- [ ] `npm run build` 성공
- [ ] 3개 화면 크기 응답형 확인
- [ ] 모달 접근성 (Tab 키 네비게이션)
- [ ] 단위 테스트 통과 (3/3)
- [ ] 콘솔 에러/경고 0건

---

## Day 3: 포트폴리오 컴포넌트 (2026-05-30)

**예상 소요시간:** 8-10시간 (09:00~19:00)

### 목표
포트폴리오 그리드 + 필터/정렬 + 상세 모달 완성.

### 작업 목록

#### 1. PortfolioTab 컴포넌트 (1시간)
```
파일: dsc-fms-portal/components/tabs/PortfolioTab.tsx
```
- [ ] Redux portfolioSlice 데이터 선택
- [ ] FilterBar 포함
- [ ] ProjectCard 그리드 렌더링
- [ ] 로딩/에러 상태 처리

#### 2. ProjectCard 컴포넌트 (2시간)
```
파일: dsc-fms-portal/components/ProjectCard.tsx
```
- [ ] 프로젝트 이미지/썸네일
- [ ] 프로젝트 이름, 설명 (2줄 ellipsis)
- [ ] 상태 배지 (진행중, 완료, 대기)
- [ ] 팀원 아바타 (2-3명 표시)
- [ ] 클릭 시 상세 모달 열기
- [ ] 반응형 카드 크기 (Desktop: 3칼럼, Mobile: 1칼럼)

**카드 구조:**
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: 'in_progress' | 'completed' | 'pending';
  team: TeamMember[];
  startDate: string;
  endDate: string;
  milestones: Milestone[];
}
```

#### 3. ProjectDetailModal (2.5시간)
```
파일: dsc-fms-portal/components/modals/ProjectDetailModal.tsx
```
- [ ] 프로젝트 전체 정보 표시
- [ ] 마일스톤 타임라인 (Recharts 또는 세로 타임라인)
- [ ] 팀원 목록 (역할 포함)
- [ ] 진행률 프로그레스 바
- [ ] 시작일/종료일 (예정 vs 실제)
- [ ] 주요 성과 (최대 5개)
- [ ] 모달 접근성 (포커스 트랩, 닫기 버튼)

#### 4. FilterBar 컴포넌트 (1.5시간)
```
파일: dsc-fms-portal/components/FilterBar.tsx
```
- [ ] 상태 필터 (All, In Progress, Completed, Pending)
- [ ] 부서 필터 (다중 선택)
- [ ] 정렬 옵션 (이름, 시작일, 완료율)
- [ ] 검색 (프로젝트 이름/설명)
- [ ] 필터 초기화 버튼

**필터 상태:**
```typescript
interface PortfolioFilter {
  status: string[];
  departments: string[];
  sortBy: 'name' | 'startDate' | 'progress';
  searchTerm: string;
}
```

#### 5. API 통합 (2시간)
```
파일: dsc-fms-portal/store/slices/portfolioSlice.ts
```
- [ ] `getPortfolioProjects()` 호출
- [ ] 마일스톤 데이터 병합 (GET /api/team/projects/:id/milestones)
- [ ] 필터/정렬 로직 Redux에 구현
- [ ] 무한 스크롤 준비 (Day 4에서 활성화 예정)

#### 6. 반응형 테스트 (1시간)
```
테스트 대상:
  - Desktop: 3칼럼 그리드
  - Tablet: 2칼럼
  - Mobile: 1칼럼, 스크롤 기반
```
- [ ] 카드 크기 확인
- [ ] 모달 높이 (모바일에서 내용 스크롤 가능)
- [ ] 필터바 반응형 (모바일: 드롭다운으로 축약)

### 산출물

- **PortfolioTab.tsx**
- **ProjectCard.tsx**
- **ProjectDetailModal.tsx**
- **FilterBar.tsx**
- **Redux portfolioSlice 업데이트**
- **단위 테스트** (4개 이상)
  - ProjectCard 렌더링
  - FilterBar 상태 변경
  - 모달 열기/닫기
  - API 호출 성공

### 검증 체크리스트
- [ ] `npm run build` 성공
- [ ] 3개 화면 크기 응답형 확인
- [ ] 필터/정렬 기능 정상 작동
- [ ] 단위 테스트 통과 (4/4)
- [ ] Lighthouse 성능 90+ (이미지 최적화 고려)

---

## Day 4: 활동로그 & 전체 응답형 검증 (2026-05-31)

**예상 소요시간:** 8시간 (09:00~17:00)

### 목표
활동로그 탭 + 무한 스크롤 + 모든 기기 최종 응답형 검증.

### 작업 목록

#### 1. ActivityTab 컴포넌트 (1시간)
```
파일: dsc-fms-portal/components/tabs/ActivityTab.tsx
```
- [ ] Redux activitySlice 데이터 선택
- [ ] ActivityTimeline 컴포넌트 렌더링
- [ ] 날짜 필터 (DatePicker)
- [ ] 로딩/에러 상태 처리

#### 2. ActivityTimeline 컴포넌트 (2시간)
```
파일: dsc-fms-portal/components/ActivityTimeline.tsx
```
- [ ] 활동 항목을 시간순으로 정렬
- [ ] 각 활동마다 타임스탬프 표시
- [ ] 활동 유형 아이콘 (Task, Meeting, Delivery 등)
- [ ] 활동 설명 및 세부정보 (hover 시 확대)
- [ ] 이벤트 클릭 시 세부 모달 열기 (선택사항)

**활동 데이터:**
```typescript
interface Activity {
  id: string;
  type: 'task_completed' | 'meeting' | 'project_updated' | 'member_joined';
  description: string;
  timestamp: string; // ISO 8601
  actor: TeamMember;
  metadata?: Record<string, any>; // 관련 프로젝트, 작업 ID 등
}
```

#### 3. 무한 스크롤 구현 (1.5시간)
```
파일: dsc-fms-portal/hooks/useInfiniteScroll.ts (설계에서 제공)
```
- [ ] IntersectionObserver로 리스트 끝 감지
- [ ] Redux에서 다음 페이지 데이터 페칭
- [ ] 로딩 중 표시 (스피너)
- [ ] 데이터 끝 표시 ("더 이상 활동이 없습니다")

**구현 예시:**
```typescript
export function useInfiniteScroll(onLoadMore: () => void, hasMore: boolean) {
  const observerTarget = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) onLoadMore();
      },
      { threshold: 0.1 }
    );
    
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);
  
  return observerTarget;
}
```

#### 4. 날짜 필터 (1시간)
```
파일: dsc-fms-portal/components/DateFilter.tsx
```
- [ ] 시작일/종료일 DatePicker
- [ ] "최근 7일", "최근 30일" 단축 버튼
- [ ] 필터 적용 시 Redux 업데이트
- [ ] 모바일 최적화 (native date input 고려)

#### 5. API 통합 (1.5시간)
```
파일: dsc-fms-portal/store/slices/activitySlice.ts
```
- [ ] `getActivityLog()` 호출 (offset 기반 페이지네이션)
- [ ] 무한 스크롤 트리거 시 다음 페이지 로드
- [ ] 날짜 필터 Redux에 구현
- [ ] 캐싱 (중복 요청 방지, 선택사항)

#### 6. 전체 기기 응답형 최종 검증 (1시간)
```
체크포인트:
1. Desktop (1024px+): 3개 탭 모두 + 모달 + 우측 패널
2. Tablet (640-1023px): 탭 축약, 2칼럼 레이아웃
3. Mobile (320-639px): BottomNav 활용, 1칼럼, 풀스크린 모달
```

**검증 항목:**
- [ ] 탭 전환 (모든 기기)
- [ ] 모달 열기/닫기 (모든 기기)
- [ ] 무한 스크롤 (활동로그에서 아래로 스크롤)
- [ ] 필터/정렬 (모든 탭)
- [ ] 터치 영역 (모바일: 44px 이상)
- [ ] 네비게이션 (BottomNav 모바일에서만 표시)

### 산출물

- **ActivityTab.tsx**
- **ActivityTimeline.tsx**
- **DateFilter.tsx**
- **useInfiniteScroll.ts** (훅)
- **Redux activitySlice 업데이트**
- **응답형 검증 보고서**
  - 스크린샷 (Mobile/Tablet/Desktop)
  - 성능 지표 (First Paint, Interactive time)

### 검증 체크리스트
- [ ] `npm run build` 성공
- [ ] Chrome DevTools Mobile Emulator로 검증
- [ ] 탭 전환 매끄러움 (CLS < 0.1)
- [ ] 무한 스크롤 정상 작동
- [ ] 모달 포커스 관리 (접근성)
- [ ] 콘솔 에러/경고 0건

---

## Day 5: 최적화 & 배포 (2026-06-01)

**예상 소요시간:** 6-8시간 (09:00~15:00~17:00)

### 목표
성능 최적화 + 접근성 검사 + E2E 테스트 + Vercel 배포 완료.

### 작업 목록

#### 1. 번들 크기 분석 (1시간)
```bash
npm run analyze  # webpack-bundle-analyzer 사용
```
- [ ] 현재 번들 크기 측정
- [ ] 큰 의존성 식별 (tree-shaking 고려)
- [ ] 동적 import로 코드 스플리팅
- [ ] 목표: < 100KB (gzip)

**최적화 항목:**
- Redux Toolkit (이미 최적화됨)
- Recharts 대체 고려 (필요시)
- 불필요한 라이브러리 제거

#### 2. Lighthouse 성능 측정 (1시간)
```bash
# Chrome DevTools 또는 CLI
lighthouse https://your-app.vercel.app --output=json
```
- [ ] Performance 점수 90 이상
- [ ] Accessibility 점수 90 이상
- [ ] Best Practices 점수 90 이상
- [ ] SEO 점수 90 이상

**성능 개선:**
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1

#### 3. 이미지 최적화 (1.5시간)
```
파일: dsc-fms-portal/public/images/
```
- [ ] 프로필 이미지 (WebP + 모바일 크기 제공)
- [ ] 프로젝트 썸네일 (1200x800px 권장)
- [ ] Next.js Image 컴포넌트 사용 (`next/image`)
- [ ] Lazy loading 활성화

**예시:**
```typescript
import Image from 'next/image';

export function ProjectCard({ project }) {
  return (
    <Image
      src={project.thumbnail}
      alt={project.title}
      width={400}
      height={300}
      placeholder="blur"
      blurDataURL={...}
    />
  );
}
```

#### 4. 캐싱 전략 (1시간)
```
파일: next.config.js
```
- [ ] 정적 자산 캐싱 (1년)
- [ ] API 응답 캐싱 (5분, SWR)
- [ ] Service Worker (선택사항, PWA)
- [ ] CDN 헤더 설정

#### 5. 접근성 검사 (1.5시간)
```bash
npm run a11y  # axe DevTools 또는 axe-core
```
- [ ] WCAG 2.1 AA 준수 확인
- [ ] 색상 대비 (최소 4.5:1)
- [ ] 키보드 네비게이션 (Tab, Enter, ESC)
- [ ] 화면 리더 호환성 (aria-label, role)
- [ ] 포커스 표시 (visible outline)

**체크리스트:**
- [ ] 모든 버튼 키보드 접근 가능
- [ ] 모든 이미지에 alt 텍스트
- [ ] 헤딩 구조 올바름 (h1 → h2 → h3)
- [ ] 모달 포커스 트랩
- [ ] 색상만으로 정보 전달 없음

#### 6. E2E 테스트 (1시간)
```
도구: Playwright 또는 Cypress
파일: e2e/*.spec.ts
```
- [ ] 시나리오 1: 사용자가 조직도 탭에서 팀원 프로필 클릭
- [ ] 시나리오 2: 사용자가 포트폴리오 필터링 (상태별) 후 프로젝트 상세 보기
- [ ] 시나리오 3: 사용자가 활동로그 날짜 필터링 및 무한 스크롤

**테스트 예시:**
```typescript
test('User can view team member profile from organization tab', async ({ page }) => {
  await page.goto('https://fms.vercel.app/dashboard/team');
  await page.click('text=직원 이름');
  await page.waitForSelector('[role="dialog"]');
  await expect(page.locator('role=dialog')).toContainText('직원 이름');
});
```

#### 7. 코드 리뷰 (0.5시간)
- [ ] 변수명 일관성 (camelCase)
- [ ] 함수 길이 (최대 50줄 권장)
- [ ] 주석 (필요한 곳만)
- [ ] 불필요한 console.log 제거
- [ ] TypeScript 타입 누락 확인

#### 8. Vercel 배포 (1시간)
```bash
git push origin develop  # 또는 main
# Vercel이 자동 빌드 및 배포
```

**배포 체크:**
- [ ] 빌드 성공 (Vercel Dashboard)
- [ ] 프리뷰 URL 확인
- [ ] 프로덕션 배포 (main 브랜치)
- [ ] 프로덕션 URL 작동 확인

**배포 후 확인:**
```
배포 URL: https://dsc-fms-portal.vercel.app/dashboard/team
Lighthouse 측정: https://pagespeed.web.dev/
```

### 산출물

- **성능 보고서** (Lighthouse 스코어, 번들 크기)
  ```
  예시:
  - Performance: 92/100
  - Accessibility: 98/100
  - Best Practices: 96/100
  - SEO: 100/100
  - Bundle Size (gzip): 87KB
  ```
- **접근성 검사 결과** (WCAG 2.1 AA 준수 확인)
- **E2E 테스트 결과** (3/3 시나리오 통과)
- **배포 URL 및 커밋 해시**
  ```
  Production: https://dsc-fms-portal.vercel.app
  Commit: abc1234567... (Team Dashboard Phase 2 UI - Production Ready)
  ```

### 검증 체크리스트
- [ ] `npm run build` 성공 (0 warnings)
- [ ] Lighthouse 모든 점수 90 이상
- [ ] WCAG 2.1 AA 오류 0건
- [ ] E2E 테스트 3/3 통과
- [ ] Vercel 배포 완료
- [ ] Production URL 정상 작동
- [ ] 콘솔 에러 0건

---

## 예상 일정 & 마감

| 날짜 | Day | 작업 | 예상 시간 | 상태 |
|------|-----|------|---------|------|
| 2026-05-28 | 1 | 레이아웃 & 상태 관리 | 6-8h | 예정 |
| 2026-05-29 | 2 | 조직도 컴포넌트 | 8-10h | 예정 |
| 2026-05-30 | 3 | 포트폴리오 컴포넌트 | 8-10h | 예정 |
| 2026-05-31 | 4 | 활동로그 & 반응형 | 8h | 예정 |
| 2026-06-01 | 5 | 최적화 & 배포 | 6-8h | 예정 |

**총 예상 소요시간:** 36-44시간  
**최종 기한:** 2026-06-01 18:00 KST

---

## 의존성 & 전제 조건

### 필수 완료 사항
- [x] Phase 1 API (10개 엔드포인트)
- [x] 설계 문서 (TEAM_DASHBOARD_PHASE2_UI_DESIGN.md, 2079줄)
- [x] 컴포넌트 명세 (COMPONENT_SPECIFICATION.json, 300줄)
- [ ] Evaluator Agent 설계 승인 (예정)

### 환경 설정
```bash
# 저장소 클론
git clone https://github.com/asdf1390a-dot/dsc-fms-portal.git
cd dsc-fms-portal

# 의존성 설치
npm install

# 환경 변수 설정
export NEXT_PUBLIC_SUPABASE_URL=https://pzkvhomhztikhkgwgqzr.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
export SUPABASE_SERVICE_ROLE_KEY=<your-key>

# 개발 서버 시작
npm run dev

# http://localhost:3000에서 확인
```

### 관련 문서
- **Phase 1 API:** `dsc-fms-portal/TEAM_DASHBOARD_PHASE1_API.md`
- **설계 문서:** `memory/TEAM_DASHBOARD_PHASE2_UI_DESIGN.md`
- **컴포넌트 명세:** `memory/COMPONENT_SPECIFICATION.json`
- **Supabase:** https://app.supabase.com/project/pzkvhomhztikhkgwgqzr
- **GitHub:** https://github.com/asdf1390a-dot/dsc-fms-portal

---

## 성공 기준

**구현 완료 = 다음을 모두 만족:**
1. ✅ 5개 모듈 구현 (레이아웃, 조직도, 포트폴리오, 활동로그, 최적화)
2. ✅ 3개 기기 응답형 (Mobile 320px, Tablet 640px, Desktop 1024px)
3. ✅ 번들 크기 < 100KB (gzip)
4. ✅ Lighthouse 90+ (모든 카테고리)
5. ✅ WCAG 2.1 AA 준수
6. ✅ E2E 테스트 3/3 통과
7. ✅ Vercel 배포 완료
8. ✅ 0 콘솔 에러/경고

---

**작성:** 2026-05-28  
**대상:** 웹개발자#2  
**마감:** 2026-06-01 18:00 KST  
**완료 기준:** Vercel 배포 URL + Lighthouse 90+ + WCAG AA 준수 ✅

