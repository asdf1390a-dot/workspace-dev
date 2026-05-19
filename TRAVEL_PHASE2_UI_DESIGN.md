# Travel Management Phase 2 — UI 설계 최종본

**작성일:** 2026-05-19  
**타겟 완료:** 2026-05-28  
**상태:** 플레너 설계 완료 → 웹개발자 구현 준비  
**기반 문서:**
- TRAVEL_MANAGEMENT_PHASE2_IMPLEMENTATION_PLAN.md (1.3K줄)
- TRAVEL_MANAGEMENT_API_GUIDE.md (Phase 1 API 명세)
- TRAVEL_MANAGEMENT_DESIGN.md (기본 개념)

---

## 목차

1. [개요](#1-개요)
2. [화면 구성 (UI 레이아웃)](#2-화면-구성-ui-레이아웃)
3. [13개 컴포넌트 설계](#3-13개-컴포넌트-설계)
4. [파일 구조 및 디렉토리](#4-파일-구조-및-디렉토리)
5. [구현 우선순위](#5-구현-우선순위)
6. [엣지 케이스 정리](#6-엣지-케이스-정리)

---

## 1. 개요

### 목표

Phase 1 API (11개 엔드포인트) + DB (8테이블)를 활용하여 **사용자 중심의 여행 관리 UI**를 구현. 13개 탭/페이지와 56개 하위 컴포넌트로 구성된 완전한 프론트엔드.

### 핵심 원칙

- **모바일 우선:** 인도 현장(폰 사용), 한국 출장자(태블릿/데스크탑)
- **단순 네비게이션:** 목록 → 상세 → 6개 탭 깊이 최대 2단계
- **상태 관리:** Zustand (UI) + SWR (서버 캐시) 하이브리드
- **성능:** TravelList <1.5s, TravelDetail 캐시 <500ms, 번들 <180KB gzip
- **접근성:** WCAG AA (색상대비, 키보드 네비게이션, aria-label)

### 개발 기간

- **Week 1 (05-15~16):** 기반 작업 + 진입경로 (List/Create/Detail)
- **Week 2 (05-17~22):** 6개 탭 컨텐츠 구현
- **Week 3 (05-23~24):** 반응형/접근성/에러처리
- **Week 4 (05-25~27):** QA + 배포

**총 13일, 웹개발자 풀타임**

---

## 2. 화면 구성 (UI 레이아웃)

### 2.1 화면 맵

```
📱 모바일 (320–767px) / 💻 데스크탑 (≥1024px)

1. TravelList (/travels)
   ├─ 헤더: 뒤로가기 + 검색 + [+ 새여행]
   ├─ 필터/정렬: status, sort, search
   ├─ 카드 그리드: 1col(mobile), 3col(desktop)
   └─ 페이지네이션: 12개/페이지

2. CreateTravel (/travels/new)
   ├─ 여행명/출발일/도착일 필드
   ├─ 목적지/설명 (선택)
   ├─ 멤버 초대 섹션
   └─ [취소] [만들기]

3. TravelDetail (/travels/[id])
   ├─ 헤더: 여행명 + [편집][공유][…]
   ├─ 서브헤더: 날짜/기간/인원/상태배지
   ├─ TabBar: 6개 탭 (horizontal scroll mobile)
   │  ├─ 개요 (Overview)
   │  ├─ 일정 (Schedule)
   │  ├─ 경비 (Costs)
   │  ├─ 준비물 (Checklist)
   │  ├─ 문서 (Documents)
   │  └─ 분석 (Analytics)
   └─ [탭 컨텐츠 area]

4. EventManagement (탭 내)
   ├─ 타임라인 뷰: 날짜별 이벤트 (기본)
   ├─ 캘린더 뷰: 월간 월별 (토글)
   └─ 이벤트 카드: 아이콘+시간+제목+[편집][삭제]

5. CostTracking (탭 내)
   ├─ 요약 카드: 총액/1인당액/정산상태
   ├─ 정산표: 멤버별 이체 제안
   ├─ 비용 항목: 테이블 형식
   ├─ 카테고리 파이차트 (desktop only)
   └─ [+ 비용추가] 모달

6. ChecklistManagement (탭 내)
   ├─ 진행률 바: 완료/전체 (%)
   ├─ 카테고리 그룹: 문서/의류/세면도구/전자/의약품/기타
   ├─ 체크리스트 아이템: ☐ 항목명 [담당자] [우선도]
   └─ [+ 항목추가] [템플릿▼]

7. DocumentStorage (탭 내)
   ├─ 저장량: 24.3MB / 100MB
   ├─ 드래그&드롭 업로드
   ├─ 문서 카테고리: 비자/여권/항공권/호텔/영수증/기타
   └─ 미리보기 모달

8. TravelAnalytics (탭 내)
   ├─ 비용 파이차트
   ├─ 누적 지출 라인차트
   ├─ TOP 3 지출
   ├─ 일정/체크리스트 진행률 바
   └─ [PDF 내보내기] [Excel] (stub)

```

---

## 3. 13개 컴포넌트 설계

### 3.1 페이지 컴포넌트 (3개)

#### 1️⃣ TravelList 페이지 (`/travels`)

**책임:** 사용자의 모든 여행을 카드 그리드로 표시, 필터/정렬/검색/페이지네이션 제공.

**레이아웃 (모바일):**
```
┌──────────────────────┐
│ ← 여행/출장  [+ 새여행] │ sticky
├──────────────────────┤
│ 🔍 [검색…]           │
│ [전체▼][최신순▼]      │
├──────────────────────┤
│ Card 1  │
│ Card 2  │
│ Card 3  │
│ ┌──────────────────┐ │
│ │ 🌏 HCM City      │ │
│ │ 05-15 ~ 05-24    │ │
│ │ 9일 · 👥 2명     │ │
│ │ ₹148,771         │ │
│ │ [⏳ 진행중]      │ │
│ └──────────────────┘ │
└──────────────────────┘
```

**Props:**
```typescript
interface TravelCardProps {
  travel: Travel & {
    members_count: number;
    total_cost: number;
  };
  onClick: (id: string) => void;
}
```

**상태 (Zustand):**
- `filter: 'all' | 'upcoming' | 'ongoing' | 'completed'`
- `sort: 'date_desc' | 'date_asc' | 'cost_desc' | 'name_asc'`
- `search: string`
- `page: number`

**API:**
- `GET /api/travels?status={filter}&sort={sort}&search={q}&page={n}&size=12`

**엣지 케이스:**
- 빈 상태: "아직 등록된 여행이 없어요. [+ 새 여행] 버튼으로 시작하세요."
- 네트워크 오류: [재시도] 버튼
- 무한 로딩: 10초 후 fallback 메시지
- 검색 debounce: 300ms

**체크리스트:**
- [ ] 12개 skeleton placeholder
- [ ] 4가지 필터 동작
- [ ] 4가지 정렬 동작
- [ ] 검색 debounce 300ms
- [ ] 페이지네이션

---

#### 2️⃣ CreateTravel 페이지 (`/travels/new`)

**책임:** 신규 여행 생성, localStorage draft 자동저장, 멤버 즉시 초대.

**레이아웃:**
```
┌─────────────────────────────┐
│ ← 새 여행 만들기             │
├─────────────────────────────┤
│ 여행 이름 *                  │
│ [____________________]       │
│                              │
│ 출발일 * [📅 2026-05-15]   │
│ 도착일 * [📅 2026-05-24]   │
│                              │
│ 목적지                       │
│ [____________________]       │
│                              │
│ 설명                         │
│ [____________________]       │
│ [____________________]       │
│                              │
│ ─── 멤버 초대 (선택) ───   │
│ [+ 동반자 추가]             │
│  📧 [_______________]       │
│  권한: [읽기전용▼]          │
│  [추가]                      │
│                              │
│ [취소]          [만들기]    │
└─────────────────────────────┘
```

**Props:**
```typescript
interface CreateTravelProps {
  mode?: 'page' | 'modal';
  initialValues?: Partial<TravelFormValues>;
  onSuccess?: (travel: Travel) => void;
  onCancel?: () => void;
}

interface TravelFormValues {
  name: string;           // 2–80자
  start_date: string;     // YYYY-MM-DD
  end_date: string;       // YYYY-MM-DD, >= start_date
  location?: string;      // ≤120자
  description?: string;   // ≤500자
  initial_members?: Array<{
    email: string;
    permission: 'read_only' | 'read_write';
  }>;
}
```

**검증 (Zod):**
```typescript
const TravelSchema = z.object({
  name: z.string().min(2, '2자 이상').max(80, '80자 이하'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  initial_members: z.array(...).optional(),
}).refine(d => d.end_date >= d.start_date, {
  message: '도착일은 출발일 이후여야 해요',
  path: ['end_date'],
});
```

**상태:**
- React Hook Form + Zod resolver
- localStorage draft: `travel-draft-v1` (500ms debounce)
- 진입 시 draft 존재 → "이전 작성본이 있어요" 확인

**API:**
- `POST /api/travels` → 생성 후
- `POST /api/travels/[id]/members` × N (초대 멤버 수만큼)

**엣지 케이스:**
- 중복 이름: 허용 (같은 이름 여행 가능)
- 과거 날짜: 허용 (회고/사후 입력)
- 멤버 이메일 미가입: "초대 이메일을 보낼까요?" (Phase 3)
- 네트워크 끊김: draft 보존

**체크리스트:**
- [ ] Zod 검증 에러 표시
- [ ] localStorage draft 자동저장 + 복원
- [ ] 멤버 초대 동시 처리
- [ ] 성공 시 상세 페이지 이동

---

#### 3️⃣ TravelDetail 페이지 (`/travels/[id]`)

**책임:** 6개 탭 컨테이너, 헤더 정보, 권한 컨텍스트 주입.

**레이아웃:**
```
┌──────────────────────────────────┐
│ ← Ho Chi Minh City [편집][공유]  │ Header
│ 2026-05-15 ~ 05-24 · 9일 · 👥2명 │
├──────────────────────────────────┤
│ [개요][일정][경비][준비물][문서][분석] │ TabBar (horizontal scroll)
├──────────────────────────────────┤
│                                   │
│ (탭별 컨텐츠 여기)                │
│                                   │
└──────────────────────────────────┘
```

**Props (Context):**
```typescript
interface TravelContext {
  travel: TravelWithRelations;
  permission: {
    isOrganizer: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
  refetch: () => Promise<void>;
}
```

**상태:**
- URL `?tab=overview|schedule|costs|checklist|documents|analytics` 동기화
- SWR: `useSWR(['/api/travels/' + id], fetcher)`
- Zustand: `activeTab`, `isEditModalOpen`, `isMemberModalOpen`

**API:**
- `GET /api/travels/[id]` (진입 시 1회만, relations 포함)
- `PUT /api/travels/[id]` (헤더 편집)
- `DELETE /api/travels/[id]` (삭제 확인 후)

**에러 처리:**
- 404 / 403: "이 여행을 찾을 수 없거나 접근 권한이 없습니다." + 목록 복귀
- 멤버 0명: "organizer 단독" 표시
- 삭제 확인: Radix AlertDialog 2단계

**체크리스트:**
- [ ] 6개 탭 모두 렌더링
- [ ] URL `?tab=` 동기화 (새로고침 후 탭 유지)
- [ ] 헤더 [편집] 모달 (organizer only)
- [ ] 삭제 2단계 확인 (AlertDialog)
- [ ] 공유 버튼 (navigator.share / 클립보드)

---

### 3.2 탭 컴포넌트 (6개)

#### 4️⃣ TravelOverviewTab (탭 1)

**책임:** 기본 정보 표시 및 수정.

**UI:**
```
┌──────────────────────────────┐
│ 기본정보              [✏️ 수정] │
├──────────────────────────────┤
│ 여행명: Ho Chi Minh City      │
│ 목적지: 베트남 호치민         │
│ 출발: 2026-05-15 (수)        │
│ 도착: 2026-05-24 (금)        │
│ 기간: 9일                     │
│ 설명: 고객 방문 + 공장 둘러보기 │
├──────────────────────────────┤
│ 🟢 Na Kyeongtae (organizer)  │
│ 👤 Huishuwo Leiyawon         │
│    [👥 관리]                 │
├──────────────────────────────┤
│ 총 예산: ₹200,000            │
│ 실제 지출: ₹148,771          │
│ 잔액: ₹51,229                │
│                              │
│ 상태: ⏳ 진행 중             │
└──────────────────────────────┘
```

**Props:**
```typescript
interface TravelOverviewTabProps {
  travel: Travel;
  members: TravelMember[];
  totalCost: number;
  canEdit: boolean;
  onMemberClick: () => void;
}
```

**상태:**
- 읽기전용 표시 (수정 모달은 TravelDetail에서 관리)

**엣지 케이스:**
- 멤버 0명: "organizer 단독"
- 설명 없음: 빈 상태 처리

**체크리스트:**
- [ ] 모든 필드 표시
- [ ] [✏️ 수정] 버튼 (organizer only)
- [ ] [👥 관리] 버튼 → MemberManagementModal

---

#### 5️⃣ EventManagement (탭 2)

**책임:** 일정 CRUD, 타임라인/캘린더 뷰 전환.

**타임라인 뷰:**
```
┌─ 일정 ─────────────────────┐
│ [📅 캘린더] [+ 이벤트]      │
│                             │
│ 📅 2026-05-15 (수)          │
│  ✈️  23:50 항공편           │
│      Chennai → Singapore   │
│      [✏️][🗑️]              │
│                             │
│  🏨  체크인 Lumiere         │
│      Quận 2, HCMC          │
│      [✏️][🗑️]              │
│                             │
│ 📅 2026-05-16 (목)          │
│  …                          │
└─────────────────────────────┘
```

**캘린더 뷰:**
```
┌─ 캘린더 ────────────────────┐
│ ◀ 2026-05 ▶  [타임라인]    │
│                             │
│   Ma Tu We Th Fr Sa Su      │
│       1  2  3  4  5        │
│   6  7  8  9● 11 12        │ (● = 이벤트 있음)
│   …                        │
│                             │
│ [+ 이벤트]                  │
└─────────────────────────────┘
```

**Props:**
```typescript
interface EventManagementProps {
  travelId: string;
  events: TravelEvent[];
  canWrite: boolean;
  onMutate: () => Promise<void>;
}

interface EventFormValues {
  title: string;
  event_type: 'flight' | 'hotel' | 'meal' | 'transport' | 'other';
  event_date: string;
  event_time?: string;       // HH:MM, nullable (종일)
  location?: string;
  description?: string;
  details?: Record<string, any>;
  status: 'planned' | 'completed' | 'cancelled';
}
```

**상태:**
- `view: 'timeline' | 'calendar'` (localStorage 저장)
- 폼 모달: open/close + edit target

**정렬:**
- `event_date ASC, event_time NULLS LAST, created_at ASC`

**에러 케이스:**
- 여행 기간 밖: 경고만 표시, 등록 허용
- 시간 미지정: 종일 일정 (null)
- 이벤트 0개: "일정을 추가하세요" 빈 상태

**체크리스트:**
- [ ] 타임라인 뷰 정렬
- [ ] 캘린더 뷰 토글 + 날짜 클릭
- [ ] 5종 event_type 폼
- [ ] 상태 변경 (체크박스)
- [ ] 바우처 파싱 슬롯 (disabled 버튼)

---

#### 6️⃣ CostTracking (탭 3)

**책임:** 비용 등록, 분할, 정산 계산.

**UI:**
```
┌─ 비용 요약 ──────────────────┐
│ 총액: ₹148,771               │
│ 1인당: ₹74,385.50            │
│ 상태: ⏳ 미정산              │
│ [정산보고서PDF] [완료표시]   │
├──────────────────────────────┤
│ 정산 테이블:                 │
│ ┌────────────────────────────┐
│ │ 👤 Na      ₹148,771 → ₹74  │
│ │   정산: +₹74,386 🟢        │
│ │ 👤 Huishuwo ₹0 → ₹74      │
│ │   정산: −₹74,385 🔴        │
│ │   이체: Huishuwo → Na      │
│ └────────────────────────────┘
├──────────────────────────────┤
│ 비용 항목:                   │
│ [+ 비용추가] [필터▼]         │
│ ✈️  2026-05-15 항공편 TR779  │
│     ₹96,050 · Na 결제        │
│     분할: 균등(2명)          │
│     [✏️][🗑️]               │
│ …                           │
└──────────────────────────────┘
```

**Props:**
```typescript
interface CostTrackingProps {
  travelId: string;
  costs: (TravelCost & { splits: TravelCostSplit[] })[];
  members: TravelMember[];
  settlement: SettlementSummary;
  canWrite: boolean;
  onMutate: () => Promise<void>;
}

interface CostFormValues {
  title: string;
  amount: number;
  currency: 'KRW' | 'INR' | 'USD' | 'VND' | 'JPY';
  cost_type: 'flight' | 'hotel' | 'meal' | 'transport' | 'shopping' | 'other';
  cost_date: string;
  paid_by_user_id: string;
  payment_method?: 'card' | 'cash' | 'transfer';
  splits: Array<{ user_id: string; amount: number }>;
  split_mode: 'equal' | 'custom' | 'percentage' | 'paid_by_one';
}
```

**분할 모드:**
- `equal`: `amount / 인원수` (마지막에 반올림 오차 흡수)
- `custom`: 자유 입력, 합계 검증
- `percentage`: % 입력, 합계 100% 검증
- `paid_by_one`: 결제자만 100%

**정산 계산:**
- Phase 1 `simplifySettlement()` 호출
- 1단계 이체만 (A→B 형식)

**그래프:**
- 파이차트 (카테고리별) — desktop only
- 라인차트 (누적 지출) — desktop only

**에러 케이스:**
- 소수 오차: 0.01 미만 무시, 마지막에 흡수
- 0원: 거부 (positive 검증)
- 비활성 멤버: 경고
- 다중 통화: 통화별 그룹핑 (환산은 Phase 3)

**체크리스트:**
- [ ] 균등/사용자정의/100%지불 분할
- [ ] 정산표 정확
- [ ] optimistic update 동작
- [ ] 파이차트 + 라인차트

---

#### 7️⃣ ChecklistManagement (탭 4)

**책임:** 카테고리별 체크리스트, 진행률, 템플릿 적용.

**UI:**
```
┌─ 준비물 체크리스트 ──────────┐
│ 진행률: 15/30 (50%) ━━━━░░░░ │
│ [+ 항목추가] [템플릿▼]       │
├──────────────────────────────┤
│ 📋 서류                  3/5  │
│  ☑ 여권                      │
│  ☑ 비자                      │
│  ☐ 항공권 [🔴 높음]          │
│  ☐ 호텔 확인서               │
│  ☑ 보험                      │
│                              │
│ 👕 의류                  4/8  │
│  ☑ 정장 1벌                  │
│  ☐ 반팔 4장                  │
│  …                          │
│                              │
│ 🧴 세면도구              5/7  │
│ 🔌 전자기기              3/5  │
│ 🏥 의약품                0/5  │
└──────────────────────────────┘
```

**Props:**
```typescript
interface ChecklistManagementProps {
  travelId: string;
  items: TravelChecklistItem[];
  canWrite: boolean;
  onMutate: () => Promise<void>;
}

interface ChecklistFormValues {
  title: string;
  category: 'documents' | 'clothing' | 'toiletries' | 'electronics' | 'medicine' | 'other';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}
```

**상태:**
- 클라이언트 그룹핑: `useMemo`로 카테고리별 정렬
- 정렬: 우선도(high→low) → created_at
- 진행률: `completed / total * 100`

**템플릿 (5종):**
```json
[
  { "name": "국내출장", "items": [...] },
  { "name": "해외출장", "items": [...] },
  { "name": "장기여행", "items": [...] },
  { "name": "당일여행", "items": [...] },
  { "name": "가족여행", "items": [...] }
]
```

**템플릿 적용:** 선택 시 기존 항목과 dedup (title 동일 시 skip)

**우선도 색상:**
- high: 🔴 red-600
- medium: 🟡 amber-500
- low: ⚪ gray-400

**에러 케이스:**
- 체크 토글 실패: 즉시 UI 반전 + 실패 시 rollback
- 카테고리 0개: 헤더 표시 안함
- swipe-to-delete: Phase 3

**체크리스트:**
- [ ] 6 카테고리 그룹핑
- [ ] 진행률 정확 (즉시 갱신)
- [ ] 5종 템플릿 적용 + dedup
- [ ] 우선도 색상 표시

---

#### 8️⃣ DocumentStorage (탭 5)

**책임:** 파일 업로드/다운로드/미리보기/삭제.

**UI:**
```
┌─ 서류 보관함 ────────────────┐
│ 저장: 24.3MB / 100MB         │
│ [📎 업로드] [⬇ 전체ZIP]     │
├──────────────────────────────┤
│ 📄 비자 & 여권          (3)  │
│  ┌──────────────────────────┐
│  │ 🖼️ passport_KR.jpg       │
│  │    2.4MB · 2026-05-10   │
│  │ [👁️ 미리보기][⬇][🗑️]    │
│  └──────────────────────────┘
│  …
│                              │
│ 🎫 항공권               (2)  │
│ 🏨 호텔                 (1)  │
│ 💳 영수증               (4)  │
│ 📝 기타                 (2)  │
└──────────────────────────────┘
```

**Props:**
```typescript
interface DocumentStorageProps {
  travelId: string;
  documents: TravelDocument[];
  canWrite: boolean;
  onMutate: () => Promise<void>;
}

interface DocumentUploadValues {
  file: File;
  doc_type: 'visa' | 'passport' | 'ticket' | 'hotel' | 'receipt' | 'other';
  description?: string;
}
```

**상태:**
- react-dropzone: 드래그&드롭
- 진행률: per-file `0..100%`
- 미리보기 모달: img / iframe

**파일 제약:**
- 크기: ≤10MB
- 타입: image/jpeg|png|webp, application/pdf
- 동시 업로드: ≤5개

**저장소:**
- Supabase Storage에 업로드
- signed URL (60초 만료)
- 다운로드 시점에 URL 재생성

**에러 케이스:**
- 용량 초과 (100MB): "용량 부족" 모달
- 타입 거부: 즉시 토스트
- 업로드 실패: 자동 1회 재시도 → 빨간 X + 재시도 버튼
- 민감 정보 마스킹: Phase 3

**체크리스트:**
- [ ] 드래그&드롭 업로드
- [ ] 진행률 표시
- [ ] 미리보기 (img/PDF)
- [ ] 다운로드 (signed URL)
- [ ] 삭제 확인

---

#### 9️⃣ TravelAnalytics (탭 6)

**책임:** 비용/일정/체크리스트 통계 시각화.

**UI:**
```
┌─ 여행 분석 ──────────────────┐
│ [기간: 전체▼]               │
├──────────────────────────────┤
│ 📊 비용 분석                 │
│  ┌──────────────┬──────────┐ │
│  │ 파이차트(카  │ 라인차트  │ │
│  │ 테고리별)   │ (누적)   │ │
│  └──────────────┴──────────┘ │
│  TOP 3:                      │
│  1. 항공편 ₹96,050 (65%)    │
│  2. 숙소 ₹47,721 (32%)      │
│  3. 식사 ₹5,000 (3%)        │
│                              │
│ 🗓️ 일정 진행률               │
│  완료: 7/15 (47%) ━━━░░░░░░ │
│  예정: 7 · 취소: 1          │
│                              │
│ ✅ 체크리스트 진행률         │
│  서류: 5/5 (100%) ━━━━━━━  │
│  의류: 4/8 (50%) ━━━░░░░░░ │
│  …                          │
│                              │
│ 📤 내보내기                  │
│  [📄 PDF] [📊 Excel]        │
└──────────────────────────────┘
```

**Props:**
```typescript
interface TravelAnalyticsProps {
  travel: TravelWithRelations;
  settlement: SettlementSummary;
}
```

**상태:**
- 클라이언트 측 집계 (별도 API 없음)
- 필터: 기간 (전체/이번주/이번달)

**차트:**
- 파이차트 (Recharts PieChart) — 카테고리별 비용
- 라인차트 (Recharts LineChart) — 누적 지출
- 진행률 바 (CSS)

**내보내기:**
- PDF: jsPDF (stub, Phase 3)
- Excel: xlsx 라이브러리 (stub, Phase 3)

**SSR 회피:**
```typescript
const Charts = dynamic(
  () => import('./Charts'),
  { ssr: false }
);
```

**에러 케이스:**
- 데이터 없음: "데이터가 부족해요" placeholder

**체크리스트:**
- [ ] 파이차트 + 라인차트 렌더링
- [ ] SSR 회피 (dynamic import)
- [ ] 진행률 바

---

### 3.3 모달/폼 컴포넌트 (4개)

#### 🔟 MemberManagementModal

**책임:** 멤버 추가/권한변경/삭제.

**UI:**
```
┌──────────────────────────────┐
│ 동반자 관리         [✕]       │
├──────────────────────────────┤
│ 🟢 Na Kyeongtae (나)         │
│    organizer · 모든 권한      │
│                              │
│ 👤 Huishuwo Leiyawon         │
│    companion · 편집 가능      │
│    [권한변경▼] [🗑️ 제거]     │
│                              │
│ ─────────────────────         │
│ [+ 동반자 추가]              │
│  📧 [____________]           │
│  권한: [읽기전용▼]           │
│  [추가]                      │
└──────────────────────────────┘
```

**Props:**
```typescript
interface MemberManagementModalProps {
  travelId: string;
  members: TravelMember[];
  isOrganizer: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutate: () => Promise<void>;
}
```

**상태:**
- `addingMember: boolean`
- `email: string`
- `permission: 'read_only' | 'read_write'`

**API:**
- `POST /api/travels/[id]/members` (추가/권한변경)
- `DELETE /api/travels/[id]/members?user_id=` (제거)

**엣지 케이스:**
- 미가입 이메일: "가입된 사용자가 없어요. 초대할까요?" (stub)
- 중복 추가: "이미 멤버예요"
- 본인 제거: 버튼 숨김
- 본인 권한 변경: UI에 표시 안함
- 마지막 organizer 제거: UI에서 비활성

---

#### 1️⃣1️⃣ EventForm 모달

**책임:** 이벤트 추가/수정.

**Props:**
```typescript
interface EventFormProps {
  travelId: string;
  event?: TravelEvent;
  travelDateRange: { start: string; end: string };
  onSuccess: () => Promise<void>;
  onClose: () => void;
}
```

**필드:**
- title (1–120자)
- event_type (5가지)
- event_date (여행 범위 검증, 경고만)
- event_time (HH:MM 또는 null=종일)
- location (≤200자)
- description (≤500자)
- details (event_type별)
- status (planned/completed/cancelled)

**바우처 슬롯:**
- 폼 상단 [📎 바우처 붙여넣기] disabled 버튼
- Phase 2.5에서 활성화

---

#### 1️⃣2️⃣ CostForm 모달

**책임:** 비용 추가/수정 + 분할 계산.

**Props:**
```typescript
interface CostFormProps {
  travelId: string;
  cost?: TravelCost & { splits: TravelCostSplit[] };
  members: TravelMember[];
  onSuccess: () => Promise<void>;
  onClose: () => void;
}
```

**필드:**
- title (1–120자)
- amount (positive)
- currency (5가지)
- cost_type (6가지)
- cost_date (travel range 검증)
- paid_by_user_id
- payment_method (optional)
- splits (배열)
- split_mode (4가지)

**CostSplitCalculator 내장:**
- 분할 방식 선택 → 미리보기 업데이트
- 합계 검증

---

#### 1️⃣3️⃣ ChecklistItemForm 모달

**책임:** 체크리스트 항목 추가.

**필드:**
- title (1–100자)
- category (6가지)
- priority (3가지: low/medium/high)
- notes (≤300자, optional)

---

### 3.4 보조 컴포넌트 (다수)

**다음 컴포넌트들은 위 메인 컴포넌트 내에 포함:**

- `TravelCard` — 목록의 카드
- `TravelHeader` — 상세 페이지 헤더
- `TravelTabBar` — 6개 탭 네비게이션
- `TravelStatusBadge` — 상태 배지 (planning/in_progress/completed)
- `TravelListFilters` — 필터/정렬 칩
- `EventTimeline` — 타임라인 뷰
- `EventCalendarView` — 캘린더 뷰
- `EventCard` — 이벤트 카드
- `EventTypeIcon` — 이벤트 아이콘
- `CostList` — 비용 항목 목록
- `CostListItem` — 비용 항목 행
- `SettlementTable` — 정산 테이블
- `CostSplitCalculator` — 분할 계산 위젯
- `CostCategoryChart` — 파이/라인 차트
- `ChecklistGroup` — 카테고리 섹션
- `ChecklistItem` — 체크 항목
- `ChecklistProgressBar` — 진행률 바
- `ChecklistTemplateModal` — 템플릿 선택
- `DocumentGroup` — 문서 카테고리 섹션
- `DocumentCard` — 문서 카드
- `DocumentDropzone` — 드래그&드롭 영역
- `DocumentPreviewModal` — 이미지/PDF 미리보기
- `DocumentTypeIcon` — 문서 타입 아이콘
- `AnalyticsCostPie` — 파이차트
- `AnalyticsCostLine` — 라인차트
- `AnalyticsTopExpenses` — TOP 3 테이블
- `AnalyticsProgressBar` — 진행률 바
- `NotificationSettings` — 알림 규칙 토글 (작은 컴포넌트)

---

## 4. 파일 구조 및 디렉토리

```
dsc-fms-portal/
├── app/
│   ├── travels/                        ✨ 신규
│   │   ├── layout.tsx                  # 탑바 + 사이드바
│   │   ├── page.tsx                    # TravelList
│   │   ├── new/
│   │   │   └── page.tsx                # CreateTravel
│   │   └── [id]/
│   │       ├── layout.tsx              # TravelDetail 쉘
│   │       ├── page.tsx                # = Overview 기본
│   │       ├── loading.tsx             # 스켈레톤
│   │       ├── error.tsx
│   │       └── not-found.tsx
│   └── api/travels/ (Phase 1 기존 API 재사용)
│
├── components/travels/                 ✨ 신규
│   ├── index.ts                        # 배럴 export
│   │
│   ├── TravelCard.tsx
│   ├── TravelListFilters.tsx
│   ├── TravelListEmptyState.tsx
│   ├── TravelHeader.tsx
│   ├── TravelTabBar.tsx
│   ├── TravelStatusBadge.tsx
│   │
│   ├── form/
│   │   ├── TravelForm.tsx
│   │   ├── EventForm.tsx
│   │   ├── CostForm.tsx
│   │   ├── ChecklistItemForm.tsx
│   │   └── DocumentUploadForm.tsx
│   │
│   ├── members/
│   │   ├── MemberManagementModal.tsx
│   │   ├── MemberAvatar.tsx
│   │   └── MemberRoleBadge.tsx
│   │
│   ├── tabs/
│   │   ├── TravelOverviewTab.tsx
│   │   ├── EventManagement.tsx
│   │   ├── CostTracking.tsx
│   │   ├── ChecklistManagement.tsx
│   │   ├── DocumentStorage.tsx
│   │   ├── TravelAnalytics.tsx
│   │   └── NotificationSettings.tsx
│   │
│   ├── events/
│   │   ├── EventTimeline.tsx
│   │   ├── EventCalendarView.tsx
│   │   ├── EventCard.tsx
│   │   └── EventTypeIcon.tsx
│   │
│   ├── costs/
│   │   ├── CostList.tsx
│   │   ├── CostListItem.tsx
│   │   ├── SettlementTable.tsx
│   │   ├── CostSplitCalculator.tsx
│   │   └── CostCategoryChart.tsx
│   │
│   ├── checklist/
│   │   ├── ChecklistGroup.tsx
│   │   ├── ChecklistItem.tsx
│   │   ├── ChecklistProgressBar.tsx
│   │   └── ChecklistTemplateModal.tsx
│   │
│   ├── documents/
│   │   ├── DocumentGroup.tsx
│   │   ├── DocumentCard.tsx
│   │   ├── DocumentDropzone.tsx
│   │   ├── DocumentPreviewModal.tsx
│   │   └── DocumentTypeIcon.tsx
│   │
│   └── analytics/
│       ├── AnalyticsCostPie.tsx
│       ├── AnalyticsCostLine.tsx
│       ├── AnalyticsTopExpenses.tsx
│       └── AnalyticsProgressBar.tsx
│
├── hooks/                              ✨ 신규
│   ├── useTravelList.ts
│   ├── useTravelDetail.ts
│   ├── useTravelPermission.ts
│   ├── useCostSettlement.ts
│   ├── useEventForm.ts
│   ├── useDebounce.ts
│   └── useLocalStorageDraft.ts
│
├── lib/travel/                         ✨ 신규 (기존 service/settlement 재사용)
│   ├── settlement.ts                   (Phase 1 재사용)
│   ├── service.ts                      (Phase 1 재사용)
│   ├── client.ts                       # API 호출 메서드 집합
│   ├── schemas.ts                      # 모든 Zod 스키마
│   ├── currencies.ts                   # 통화 포맷팅
│   ├── checklist-templates.ts          # 5종 템플릿
│   └── voucher-slot.ts                 # 향후 파싱 통합점
│
├── stores/                             ✨ 신규
│   └── travelStore.ts                  # Zustand: filter, sort, activeTab 등
│
├── types/
│   ├── travel.ts                       (Phase 1 기존)
│   └── travel-ui.ts                    ✨ 신규 (Form values 등)
│
├── public/travels/                     ✨ 신규
│   ├── empty-state.svg
│   └── voucher-sample.png
│
└── __tests__/travels/                  ✨ 신규
    ├── TravelList.test.tsx
    ├── TravelDetail.test.tsx
    ├── CostSettlement.test.ts
    ├── EventForm.test.tsx
    └── e2e/
        ├── travel-crud.spec.ts
        ├── cost-settlement.spec.ts
        └── checklist-template.spec.ts
```

---

## 5. 구현 우선순위

### Phase 2a: 기반 + 진입경로 (2026-05-15~16, 2일)

1. 패키지 설치
   ```
   zustand swr react-hook-form zod @hookform/resolvers
   recharts react-day-picker react-dropzone sonner
   @radix-ui/react-dialog @radix-ui/react-alert-dialog
   date-fns
   ```

2. 유틸리티 작성
   - `lib/api-client.ts` (fetch wrapper)
   - `lib/travel/client.ts` (11개 API 메서드)
   - `lib/travel/schemas.ts` (모든 Zod 스키마)
   - `types/travel-ui.ts`
   - `stores/travelStore.ts`

3. 진입경로 구현
   - `app/travels/page.tsx` (TravelList)
   - `app/travels/new/page.tsx` (CreateTravel)
   - `app/travels/[id]/layout.tsx` (TravelDetail 쉘)
   - `components/travels/TravelCard.tsx`
   - `components/travels/TravelTabBar.tsx`

**완료 기준:** 목록 → 생성 → 상세 진입까지 네비게이션 가능

---

### Phase 2b: 탭 컨텐츠 (2026-05-17~22, 5일)

순서:
1. **Overview + MemberManagement** (1일)
2. **EventManagement** (1.5일)
3. **CostTracking** (2일)
4. **ChecklistManagement** (1일)
5. **DocumentStorage** (1일)
6. **TravelAnalytics** (0.5일)

---

### Phase 2c: 반응형/테스트/배포 (2026-05-23~27, 4일)

1. 반응형 (320/768/1024/1440) — 1일
2. 접근성 (WCAG AA) — 0.5일
3. 에러 처리 + 토스트 — 0.5일
4. Vitest + Playwright E2E — 1일
5. 성능 튜닝 (Lighthouse 90+) — 1일
6. Vercel 배포 + smoke test — 0.5일

---

## 6. 엣지 케이스 정리

### 권한/인증

| 시나리오 | 처리 |
|--------|-----|
| 미인증 사용자 | 로그인 페이지로 리다이렉트 (401) |
| 타인의 여행 조회 (멤버 아님) | 404 / 403 (정보 누설 방지) |
| 권한 없는 편집 시도 | UI에서 버튼 숨김 + 서버 403 방어 |
| 마지막 organizer 제거 | UI에서 버튼 비활성 + 서버 방어 |

### 데이터/유효성

| 시나리오 | 처리 |
|--------|-----|
| 빈 여행 목록 | "여행이 없어요" 일러스트 |
| 빈 이벤트/비용/체크리스트 | 각 탭마다 "데이터 추가" 프롬프트 |
| 여행 기간 밖 이벤트 | 경고만 표시, 등록 허용 |
| 과거 날짜 여행 | 허용 (회고/사후 입력) |
| 중복 여행명 | 허용 (같은 이름 가능) |
| 소수점 분할 오차 | 마지막 멤버에 흡수 |
| 0원 비용 | 거부 (positive 검증) |

### 네트워크/성능

| 시나리오 | 처리 |
|--------|-----|
| 느린 3G (>3s) | 스켈레톤 placeholder 표시 |
| 네트워크 끊김 | "오프라인입니다" 토스트 + draft 보존 |
| 업로드 실패 | 1회 자동 재시도 → 수동 재시도 버튼 |
| 파일 용량 초과 | "저장 용량 부족" 모달 |
| 타입 거부 | 즉시 토스트 (이미지/PDF만) |
| API 실패 | 재시도 버튼 + 에러 메시지 |

### UX/모달

| 시나리오 | 처리 |
|--------|-----|
| 삭제 확인 | AlertDialog 2단계 |
| 폼 제출 중 뒤로가기 | "저장하지 않은 변경이 있어요" 확인 |
| 다중 submitㄴ | 첫 번째 클릭만 처리 (중복 방지) |
| 모달 Escape | 폼 상태에 따라 확인 또는 즉시 닫기 |
| 복수 파일 업로드 | ≤5개 동시 처리, ≤10MB each |

---

## 체크리스트

### 설계 완료 항목
- [x] 13개 컴포넌트 + 56개 하위 컴포넌트 설계
- [x] 화면 레이아웃 (모바일/데스크탑)
- [x] Props 인터페이스 정의
- [x] 상태 관리 패턴 (Zustand + SWR)
- [x] API 연동 명세
- [x] Zod 검증 규칙
- [x] 엣지 케이스 정리
- [x] 파일 구조 + 디렉토리
- [x] 구현 우선순위 (11단계)
- [x] 성능 목표 정의 (1.5s/500ms/180KB gzip)

### 웹개발자 진행 체크리스트
- [ ] 패키지 설치 (11개)
- [ ] 기반 라이브러리 작성 (lib/ hooks/ stores/)
- [ ] 진입경로 구현 (List/Create/Detail)
- [ ] 6개 탭 컨텐츠 (순차)
- [ ] 반응형 + 접근성 검증
- [ ] 테스트 작성 (Vitest + Playwright)
- [ ] 성능 튜닝 (Lighthouse 90+)
- [ ] 배포 (Vercel production)

---

## 산출물

**파일:**
- `/dsc-fms-portal/TRAVEL_PHASE2_UI_DESIGN.md` (본 문서)

**참고 문서:**
- `TRAVEL_MANAGEMENT_PHASE2_IMPLEMENTATION_PLAN.md` (1.3K줄, 구현 상세)
- `TRAVEL_MANAGEMENT_API_GUIDE.md` (Phase 1 API)
- `TRAVEL_MANAGEMENT_DESIGN.md` (기본 개념)

---

**작성자:** 플레너  
**상태:** ✅ 설계 완료 → 웹개발자 구현 준비 (2026-05-22 자동 투입)  
**ETA:** 2026-05-28 UI 설계 구현 완료
