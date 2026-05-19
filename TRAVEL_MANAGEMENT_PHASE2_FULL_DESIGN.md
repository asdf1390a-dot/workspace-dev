---
name: Travel Management Phase 2 전체 설계
description: UI/UX 컴포넌트 설계, 상태 관리 구조, 성능 목표, 에러 처리, 테스트 플랜
type: project
phase: 2
status: design-complete
---

# Travel Management Phase 2 — 전체 설계

**설계 완료:** 2026-05-19 18:30 KST  
**담당:** 플레너  
**상태:** ✅ 설계 완료 → 웹개발자 구현 준비

---

## 1. Phase 2 개요

**목표:** 여행 관리 모듈의 프론트엔드 UI/UX 완성
- 9개 핵심 UI 컴포넌트 설계
- 상태 관리 아키텍처 정의
- 성능 최적화 목표 설정
- 에러 처리 전략 수립
- 통합 테스트 계획

**의존성:** Phase 1 API 13개 엔드포인트 (완료)  
**예상 개발 기간:** 13일 (2026-05-20 ~ 2026-06-01)

---

## 2. UI 컴포넌트 아키텍처

### 2.1 페이지 레이어 (2개)

#### TravelListPage (`app/travels/page.tsx`)
**역할:** 사용자의 전체 여행 목록 표시 및 검색

**주요 기능:**
- 여행 목록 조회 (GET /api/travels)
- 상태별 필터 (upcoming, ongoing, completed, all)
- 정렬 옵션 (date, cost, name)
- 새 여행 생성 모달
- 여행 카드 그리드 렌더링

**상태 구조:**
```typescript
{
  travels: Travel[]
  filter: 'all' | 'upcoming' | 'ongoing' | 'completed'
  sortBy: 'date' | 'cost' | 'name'
  isCreateModalOpen: boolean
  isLoading: boolean
  error: string | null
}
```

**API 호출:**
- 마운트 시: GET /api/travels
- 필터/정렬 변경: 클라이언트 측 필터링 (메모리 기반)

#### TravelDetailPage (`app/travels/[id]/page.tsx`)
**역할:** 단일 여행의 상세 정보 + 6개 탭 관리

**구조:**
```
TravelDetailPage
├── TravelDetailHeader (기본 정보 표시)
├── TabNavigation (6개 탭 선택)
└── [TabContent]
    ├── OverviewTab
    ├── ScheduleTab
    ├── CostsTab
    ├── ChecklistTab
    ├── DocumentsTab
    └── NotificationsTab
```

**상태:**
```typescript
{
  travel: Travel
  activeTab: 'overview' | 'schedule' | 'costs' | 'checklist' | 'documents' | 'notifications'
  isLoading: boolean
  error: string | null
}
```

**API 호출:**
- 초기 로드: GET /api/travels/[id]
- 탭 전환: 지연 로딩 구현 (필요할 때만 데이터 조회)

---

### 2.2 컴포넌트 레이어 (9개 핵심 컴포넌트)

#### 1. TravelCard (`components/travels/TravelCard.tsx`)
**용도:** 여행 목록 아이템

**Props:**
```typescript
{
  travel: Travel
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}
```

**표시 정보:**
- 여행명 (text)
- 기간 (start_date ~ end_date)
- 목적지 (location)
- 멤버 수 (avatar 그룹)
- 총 비용 (원 단위)
- 진행 상태 배지 (upcoming/ongoing/completed)
- 비용 진행률 바 (예산 대비)

**상호작용:**
- 카드 클릭: 상세보기
- 더보기 버튼: edit, delete, duplicate

---

#### 2. TravelForm (`components/travels/TravelForm.tsx`)
**용도:** 여행 생성/수정 모달

**Props:**
```typescript
{
  isOpen: boolean
  travel?: Travel (수정 시)
  onSubmit: (formData: CreateTravelDTO) => Promise<void>
  onClose: () => void
}
```

**입력 필드:**
- 여행명 (text, 필수)
- 설명 (textarea, 선택)
- 목적지 (text, 필수)
- 시작 날짜 (date picker, 필수)
- 종료 날짜 (date picker, 필수)
- 예산 (number, 선택)

**검증 규칙:**
- 모든 필수 필드 필수
- 종료 날짜 > 시작 날짜
- 여행명 1~100자
- 예산 0 이상

**에러 처리:**
- 필드 레벨 에러 즉시 표시
- 제출 중 통신 에러: 토스트 알림

---

#### 3. MemberManager (`components/travels/MemberManager.tsx`)
**용도:** 멤버 추가/제거/권한 관리

**상태:**
```typescript
{
  members: TravelMember[]
  inviteEmail: string
  isAdding: boolean
  error: string | null
}
```

**기능:**
- 멤버 목록 표시 (이름, 역할, 조인 날짜)
- 멤버 초대 (이메일 입력 + 초대 버튼)
- 역할 변경 (organizer/companion/guest 드롭다운)
- 멤버 제거 (확인 대화)

**API 호출:**
- POST /api/travels/[id]/members (초대)
- DELETE /api/travels/[id]/members/[user_id] (제거)
- PUT /api/travels/[id]/members/[user_id] (역할 변경)

---

#### 4. ScheduleManager (`components/travels/ScheduleManager.tsx`)
**용도:** 여행 일정 관리 (타임라인 + 캘린더 뷰)

**상태:**
```typescript
{
  events: TravelEvent[]
  viewMode: 'timeline' | 'calendar'
  selectedDate: Date | null
  isAddModalOpen: boolean
  editingEvent: TravelEvent | null
}
```

**UI 레이아웃:**
- 뷰 모드 토글 (Timeline | Calendar)
- Timeline 뷰: 시간순 이벤트 목록 + 드래그 정렬
- Calendar 뷰: 월간 캘린더 + 이벤트 마커

**컴포넌트:**
- EventCard (각 이벤트)
- EventForm 모달 (추가/수정)

---

#### 5. CostManager (`components/travels/CostManager.tsx`)
**용도:** 비용 등록 및 목록 관리

**상태:**
```typescript
{
  costs: TravelCost[]
  splits: TravelCostSplit[]
  isAddModalOpen: boolean
  editingCost: TravelCost | null
  totalCost: number
}
```

**기능:**
- 비용 항목 테이블 (지불자, 금액, 카테고리, 날짜)
- 비용 추가/수정/삭제
- 비용 카테고리 아이콘 표시
- 총액 계산 및 실시간 갱신

**API 호출:**
- GET /api/travels/[id]/costs
- POST /api/travels/[id]/costs
- PUT /api/travels/[id]/costs/[cost_id]
- DELETE /api/travels/[id]/costs/[cost_id]

---

#### 6. SettlementCalculator (`components/travels/SettlementCalculator.tsx`)
**용도:** 비용 분담 계산 및 정산 테이블

**상태:**
```typescript
{
  costs: TravelCost[]
  members: TravelMember[]
  splitMethod: 'equal' | 'percentage' | 'custom'
  settlements: Settlement[] // 정산 제안
  currency: string
}
```

**정산 로직:**
1. 모든 비용 수집
2. 멤버별 실제 지불액 계산
3. 균등 분할 기준 계산
4. 차액 정산 제안 생성

**표시 형식:**
```
[A가 B에게 ₩50,000 지불]
[C가 A에게 ₩25,000 지불]
```

**내보내기:**
- CSV 다운로드 (정산 명세)
- PDF 영수증

---

#### 7. ChecklistManager (`components/travels/ChecklistManager.tsx`)
**용도:** 준비물 체크리스트 관리

**상태:**
```typescript
{
  items: ChecklistItem[]
  categoryFilter: string | null
  completionRate: number
  newItem: Partial<ChecklistItem>
}
```

**기능:**
- 카테고리별 그룹화 (서류, 의류, 위생용품, 전자기기, 의약품, 기타)
- 체크박스로 완료/미완료 표시
- 우선순위 표시 (아이콘: 🔴 high, 🟡 medium, 🟢 low)
- 항목 추가/삭제/수정
- 완료율 % 표시 (진행 바)

**API 호출:**
- GET /api/travels/[id]/checklists
- POST /api/travels/[id]/checklists
- PUT /api/travels/[id]/checklists/[item_id]
- DELETE /api/travels/[id]/checklists/[item_id]

---

#### 8. DocumentUploader (`components/travels/DocumentUploader.tsx`)
**용도:** 여행 관련 파일 관리

**상태:**
```typescript
{
  documents: TravelDocument[]
  isUploading: boolean
  uploadProgress: number
  error: string | null
}
```

**기능:**
- 드래그 & 드롭 업로드 존
- 파일 선택 버튼
- 업로드 진행률 표시
- 파일 목록 표시 (이름, 크기, 타입, 업로드 날짜)
- 파일 다운로드 링크
- 파일 삭제 (확인)

**지원 파일:**
- 문서: PDF, DOC, DOCX
- 이미지: JPG, PNG, GIF
- 최대 크기: 10MB/파일

**문서 타입:**
- visa (비자)
- passport (여권)
- flight_ticket (항공권)
- hotel_booking (호텔 예약)
- receipt (영수증)
- other (기타)

---

#### 9. NotificationManager (`components/travels/NotificationManager.tsx`)
**용도:** 자동 알림 규칙 관리

**상태:**
```typescript
{
  rules: NotificationRule[]
  newRule: Partial<NotificationRule>
  channels: {
    in_app: boolean
    email: boolean
    telegram: boolean
  }
}
```

**규칙 타입:**
- `days_before_departure`: 출발 N일 전 알림 (기본값: 7, 3, 1일)
- `event_time`: 이벤트 시간 N분 전 알림 (기본값: 30, 60분)
- `checklist_reminder`: 체크리스트 미완료 항목 리마인드
- `custom`: 사용자 정의 규칙

**채널:**
- In-App: 포탈 내 알림
- Email: 이메일 발송
- Telegram: Telegram 봇 메시지

---

## 3. 상태 관리 구조

### 3.1 상태 관리 선택: Zustand

**이유:**
- 번들 크기 작음 (Redux 대비 1/10)
- 보일러플레이트 최소화
- TypeScript 원활 지원
- 단순한 구조로 충분 (전역 상태 3개만 필요)

### 3.2 글로벌 상태 스토어

#### Store 1: TravelStore
```typescript
// types
interface TravelState {
  travels: Travel[]
  activeTravelId: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchTravels: () => Promise<void>
  setActiveTravelId: (id: string) => void
  createTravel: (data: CreateTravelDTO) => Promise<void>
  updateTravel: (id: string, data: UpdateTravelDTO) => Promise<void>
  deleteTravel: (id: string) => Promise<void>
}

// location: lib/stores/travelStore.ts
export const useTravelStore = create<TravelState>((set) => ({
  travels: [],
  activeTravelId: null,
  isLoading: false,
  error: null,
  // ...
}))
```

#### Store 2: TravelDetailStore
```typescript
interface TravelDetailState {
  activeTravel: Travel | null
  activeTab: TabType
  membersData: TravelMember[]
  eventsData: TravelEvent[]
  costsData: TravelCost[]
  checklistData: ChecklistItem[]
  documentsData: TravelDocument[]
  notificationsData: NotificationRule[]
  
  // Actions
  fetchTravelDetail: (id: string) => Promise<void>
  setActiveTab: (tab: TabType) => void
  refetchTabData: (tab: TabType) => Promise<void>
}
```

#### Store 3: UIStateStore
```typescript
interface UIState {
  isCreateTravelModalOpen: boolean
  isAddEventModalOpen: boolean
  isAddCostModalOpen: boolean
  selectedEventForEdit: TravelEvent | null
  selectedCostForEdit: TravelCost | null
  
  // Actions
  toggleModal: (modalKey: string) => void
  setSelectedEvent: (event: TravelEvent | null) => void
  setSelectedCost: (cost: TravelCost | null) => void
}
```

### 3.3 로컬 상태 (컴포넌트 단계)

**TravelListPage:**
- `filter`: 현재 필터 상태
- `sortBy`: 현재 정렬 방식

**TravelDetailPage:**
- `activeTab`: 활성 탭 (Zustand로 관리)

**각 컴포넌트:**
- 폼 입력 상태 (React Hook Form 사용)
- UI 상태 (모달 열림, 로딩 중 등)

---

## 4. 성능 최적화 목표

### 4.1 렌더링 성능

**목표:**
- 페이지 로드 시간: < 2초 (TTL)
- 상호작용 응답성: < 100ms (FID)
- 누적 레이아웃 시프트: < 0.1 (CLS)

**최적화 전략:**

1. **코드 분할:**
   - 각 탭을 별도 청크로 분할
   - TravelDetail 페이지 지연 로딩

   ```typescript
   const ScheduleTab = dynamic(() => import('./tabs/ScheduleTab'), {
     loading: () => <TabSkeleton />,
     ssr: false
   })
   ```

2. **메모이제이션:**
   - `React.memo()`: 컴포넌트 메모이제이션
   - `useMemo()`: 계산 비용이 큰 파생 상태
   - `useCallback()`: 이벤트 핸들러

   ```typescript
   const settlementData = useMemo(() => 
     calculateSettlement(costs, members),
     [costs, members]
   )
   ```

3. **가상화:**
   - 비용 목록 (100+ 항목): `react-window` 사용
   - 문서 목록: 페이지네이션 (20개/페이지)

4. **API 호출 최적화:**
   - SWR 데이터 캐싱
   - Stale-While-Revalidate 패턴
   - 요청 배칭 (batch API 고려)

### 4.2 API 응답 시간

**목표:**
- 여행 목록: < 500ms
- 여행 상세 조회: < 800ms
- 비용 정산: < 300ms

**달성 방법:**
- 데이터베이스 인덱싱 (travel_id, user_id, event_date)
- API 응답 캐싱 (Vercel Edge Cache)
- Lazy loading (탭별 데이터 분리 로드)

### 4.3 번들 크기

**목표:** < 250KB (gzip)

**현재 예상:**
- React/Next.js: 80KB
- UI 라이브러리: 40KB
- 상태 관리 (Zustand): 5KB
- 유틸: 20KB
- **예상 합계:** 145KB ✅

---

## 5. 에러 처리 및 에지 케이스

### 5.1 네트워크 에러

| 상황 | 처리 |
|------|------|
| 요청 실패 (timeout) | 토스트 + 재시도 버튼 |
| 401 Unauthorized | 로그인 페이지 리다이렉트 |
| 403 Forbidden | "권한 없음" 메시지 |
| 5xx 서버 에러 | "일시적 오류 발생" + 지원팀 문의 |

**구현:**
```typescript
const fetchWithErrorHandling = async (url: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      switch (response.status) {
        case 401: redirectToLogin(); break
        case 403: showError("권한 없음"); break
        default: showError("오류 발생")
      }
    }
    return response.json()
  } catch (error) {
    showError("네트워크 오류")
  }
}
```

### 5.2 입력 검증

**규칙:**

| 필드 | 검증 |
|------|------|
| 여행명 | 1~100자, 특수문자 제한 |
| 날짜 범위 | 종료 > 시작, 미래 날짜만 |
| 예산 | 0 이상, 숫자만 |
| 비용 금액 | 양수, 소수점 2자리 |
| 이메일 | 유효한 이메일 형식 |

**구현:** React Hook Form + Zod 스키마

```typescript
const travelSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.date(),
  endDate: z.date().refine(d => d > startDate, "종료 > 시작"),
  budget: z.number().min(0)
})
```

### 5.3 동시성 처리

**문제:** 여러 사용자가 동시에 비용/일정 수정

**해결:**
- Optimistic Update 사용
- 실패 시 롤백 + 에러 알림
- Last-Write-Wins 정책

```typescript
const updateCost = async (costId: string, data: UpdateCostDTO) => {
  // 1. 먼저 UI 업데이트 (optimistic)
  setCosts(costs.map(c => c.id === costId ? {...c, ...data} : c))
  
  try {
    // 2. API 요청
    await api.put(`/costs/${costId}`, data)
  } catch (error) {
    // 3. 실패 시 롤백
    refetchCosts()
    showError("업데이트 실패")
  }
}
```

### 5.4 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 빈 여행 (0명) | 멤버 추가 유도 |
| 비용 없음 | "비용을 추가하세요" 메시지 |
| 체크리스트 100% 완료 | 완료 배지 표시 |
| 파일 업로드 중 페이지 이탈 | 경고 모달 |
| 삭제 실수 (Undo 미지원) | 확인 대화 필수 |

---

## 6. 테스트 계획

### 6.1 단위 테스트 (Unit Tests)

**대상:**
- 정산 계산 로직 (`calculateSettlement()`)
- 날짜 형식 함수
- 통화 변환 함수

**도구:** Jest + React Testing Library

**예시:**
```typescript
describe('calculateSettlement', () => {
  it('균등 분할 계산', () => {
    const costs = [{amount: 300000, payer: 'A'}]
    const members = ['A', 'B', 'C']
    const result = calculateSettlement(costs, members, 'equal')
    expect(result).toEqual({
      'B owes A': 100000,
      'C owes A': 100000
    })
  })
})
```

### 6.2 통합 테스트 (Integration Tests)

**시나리오:**

1. **여행 생성 → 멤버 추가 → 비용 등록 → 정산 확인**
   ```
   1. POST /api/travels (새 여행)
   2. POST /api/travels/[id]/members (멤버 초대)
   3. POST /api/travels/[id]/costs (비용 등록)
   4. GET /api/travels/[id]/cost-split (정산 확인)
   ```

2. **일정 추가 → 캘린더 표시 → 알림 설정**
   ```
   1. POST /api/travels/[id]/events (일정)
   2. GET /api/travels/[id]/events (확인)
   3. POST /api/travels/[id]/notifications (알림)
   ```

### 6.3 E2E 테스트 (End-to-End)

**도구:** Playwright

**테스트 케이스:**
```typescript
test('전체 여행 생성 및 관리 흐름', async ({ page }) => {
  // 1. 여행 생성
  await page.click('text=새 여행')
  await page.fill('[name=name]', '호치민 출장')
  await page.click('button[type=submit]')
  
  // 2. 상세 조회
  await page.waitForSelector('[role=tablist]')
  
  // 3. 비용 추가
  await page.click('text=비용 추가')
  // ... 비용 입력
  
  // 4. 정산 확인
  await page.click('[role=tab]:has-text("비용")')
  // ... 정산 테이블 검증
})
```

### 6.4 성능 테스트 (Performance)

**목표:**
- TTL (Time to Load): < 2초
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**도구:** Lighthouse, WebPageTest

---

## 7. 구현 로드맵

### Week 1 (2026-05-20 ~ 2026-05-26)
- [ ] 레이아웃 + 상태 관리 구조 구축
- [ ] TravelListPage + TravelCard 구현
- [ ] TravelForm 모달 구현
- [ ] 기본 라우팅 설정

### Week 2 (2026-05-27 ~ 2026-06-02)
- [ ] TravelDetailPage 셸 구현
- [ ] 6개 탭 UI 구현
- [ ] 각 탭 데이터 바인딩

### Week 3 (2026-06-03 ~ 2026-06-08)
- [ ] 모바일 반응형 검증
- [ ] 접근성(A11y) 검증
- [ ] 에러 처리 & 엣지 케이스 테스트

### Week 4+ (2026-06-09+)
- [ ] 성능 최적화
- [ ] E2E 테스트
- [ ] 배포 준비

---

## 8. 기술 스택 확정

| 영역 | 라이브러리 | 버전 | 이유 |
|------|-----------|------|------|
| **상태 관리** | Zustand | 4.x | 번들 크기 작음, 단순함 |
| **폼 관리** | React Hook Form | 7.x | 성능, TypeScript 지원 |
| **폼 검증** | Zod | 3.x | 타입-세이프 검증 |
| **날짜** | date-fns | 3.x | 가볍고 모듈식 |
| **UI 컴포넌트** | Radix UI | 1.x | 접근성, 스타일 자유도 |
| **테이블** | TanStack Table | 8.x | 강력한 기능 |
| **가상화** | react-window | 1.x | 대량 데이터 렌더링 |
| **테스트** | Jest, Playwright | 최신 | 표준 도구 |

---

## 9. 완료 기준

### 설계 승인 기준
- ✅ 9개 컴포넌트 상세 설계 완료
- ✅ 상태 관리 구조 정의 완료
- ✅ 성능 목표 수치화 완료
- ✅ 에러 처리 전략 정의 완료
- ✅ 테스트 계획 수립 완료

### 구현 승인 기준
- ✅ 모든 컴포넌트 구현 완료
- ✅ API 통합 완료
- ✅ 모바일 반응형 검증 완료 (< 768px 에서 모두 작동)
- ✅ 단위 테스트 커버리지 > 80%
- ✅ E2E 테스트 통과
- ✅ 성능 목표 달성 (TTL < 2s, FID < 100ms)
- ✅ 접근성 WCAG AA 준수

---

## 10. 참고 문서

- Phase 1 API: `project_travel_management_api_guide.md`
- 데이터베이스 스키마: `project_travel_management_module_design.md`
- 바우처 파싱: `project_travel_management_voucher_parsing.md`

**상태:** ✅ **설계 완료** → 평가자 검토 → 웹개발자 구현
