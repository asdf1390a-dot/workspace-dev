# Memory Admin Dashboard — UI/UX 설계

**작성일:** 2026-06-20 KST  
**담당:** Web App Designer  
**대상:** Frontend Developer (React 구현)  
**상태:** Ready for Development  

---

## 📋 목차

1. [개요](#개요)
2. [화면 구조](#화면-구조)
3. [페이지 레이아웃](#페이지-레이아웃)
4. [컴포넌트 명세](#컴포넌트-명세)
5. [상태 관리](#상태-관리)
6. [API 연동](#api-연동)
7. [모바일 반응형](#모바일-반응형)
8. [접근성](#접근성)

---

## 개요

### 목적
- Message Collection API (Phase 2A)의 실시간 모니터링
- 메시지 수집 현황 및 통계 시각화
- 수동 수집 트리거 및 큐 상태 관리
- 에러 추적 및 재시도 기능

### 사용자
- **Admin:** 시스템 관리자, DevOps 엔지니어
- **Platform Team:** CEO, PM (고수준 통계만)

### 디자인 원칙
- **Mobile First:** 인도 첸나이 모바일 작업자 지원 (선택)
- **Real-time:** WebSocket 또는 polling으로 실시간 업데이트
- **Dark Mode:** 24/7 모니터링 환경 고려
- **아시아 언어:** 한국어 + English

---

## 화면 구조

```
/admin
├── /messages              # Main Dashboard (메시지 수집 현황)
├── /api-status            # API 성능 및 상태
├── /queue-management      # 큐 항목 관리
└── /logs                  # 에러 로그 및 디버깅
```

---

## 페이지 레이아웃

### Page 1: Messages Dashboard (`/admin/messages`)

**레이아웃:**
```
┌─────────────────────────────────────────────────────────┐
│  Memory Message Collection                         🔄    │
│                                         Last sync: 5 min ago│
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Total        │  │ Today        │  │ Success Rate │  │
│  │ 45,230       │  │ 2,450        │  │ 99.7%        │  │
│  │ messages     │  │ new messages │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌─ Source Distribution ────────────────────────────┐   │
│  │                                                   │   │
│  │  Gateway  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ 40,000 (88%)      │   │
│  │  Files    ▰▰▰▰▰ 5,230 (12%)                   │   │
│  │                                                   │   │
│  └───────────────────────────────────────────────┘   │
│                                                           │
│  ┌─ Recent Collections ──────────────────────────────┐   │
│  │ Source      | Time          | Count | Status     │   │
│  ├─────────────┼───────────────┼───────┼────────────┤   │
│  │ Gateway     │ 10:25 KST     │ 125   │ ✅ OK     │   │
│  │ MEMORY.md   │ 10:25 KST     │ 1     │ ✅ OK     │   │
│  │ Gateway     │ 04:25 KST     │ 98    │ ✅ OK     │   │
│  │ Gateway     │ 00:25 KST     │ 156   │ ⚠️  (2 retry)│ │
│  └───────────────────────────────────────────────┘   │
│                                                           │
│  [Collect Now]  [Batch Collect]  [View Logs]             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**섹션 상세:**

#### 1. Header & Quick Actions
```
┌─────────────────────────────────────────────┐
│ Memory Message Collection          🔄 Sync   │
│                        Last sync: 5 min ago  │
└─────────────────────────────────────────────┘
```
- **제목:** "Memory Message Collection"
- **동기화 버튼:** 클릭 시 즉시 새로고침 (모든 API 호출)
- **마지막 동기화 시간:** 상대시간 (5 min ago, 2 hours ago)

#### 2. KPI Cards (4열, 반응형)

**Card 1: 전체 메시지**
```
┌──────────────────┐
│ Total Messages   │
│ 45,230           │
│ ↑ 2,450 today    │
└──────────────────┘
```
- 값: `GET /api/status.server.messagesCollected`
- 부제: "↑ N today" (24h 증가분)

**Card 2: 오늘 수집**
```
┌──────────────────┐
│ Today            │
│ 2,450            │
│ ↓ 3% vs yesterday │
└──────────────────┘
```
- 일별 통계: `GET /api/status.server.messagesCollected` (필터: 24h)
- 전일 대비 변화율

**Card 3: 성공률**
```
┌──────────────────┐
│ Success Rate     │
│ 99.7%            │
│ 3 errors (1h)    │
└──────────────────┘
```
- 계산: `(totalCollected - errorCount) / totalCollected * 100`
- 오류 카운트: 최근 1시간

**Card 4: 최근 수집**
```
┌──────────────────┐
│ Last Collection  │
│ 10:25 KST        │
│ 2 min 30 sec ago │
└──────────────────┘
```
- 시간: `GET /api/status.server.lastCollectionTime`
- 상대시간 (업데이트 간격: 5초)

#### 3. 소스 분포 차트 (Pie Chart)

**시각화:**
```
┌─ Source Distribution (24h) ──────────────┐
│                                           │
│        ┌─────────────┐                    │
│        │             │ ▲ Gateway          │
│        │  ▰▰▰▰▰▰▰▰  │ ▲ Files            │
│        │             │ ▲ (Telegram later) │
│        └─────────────┘                    │
│                                           │
│  Gateway  40,000 messages (88%)           │
│  Files     5,230 messages (12%)           │
│  Total     45,230 messages               │
│                                           │
└───────────────────────────────────────────┘
```

**라이브러리:** Chart.js / Recharts
**데이터 소스:** `GET /api/status.sources`
**새로고침:** 30초 (또는 수동 sync)

#### 4. 최근 수집 목록 (테이블)

**컬럼:**
| 컬럼 | 너비 | 내용 | 정렬 |
|-----|------|------|------|
| Source | 15% | "Gateway", "MEMORY.md", etc | 가능 |
| Time | 20% | "2026-06-20 10:25 KST" | 가능 |
| Count | 10% | 수집한 메시지 수 | 가능 |
| Duration | 10% | "245ms" | 가능 |
| Status | 15% | ✅ OK, ⚠️ Retry, ❌ Failed | 필터 |
| Error | 30% | (에러 있을 시) "GATEWAY_UNAVAILABLE" | 클릭 시 상세 |

**행 색상:**
- ✅ OK: 흰색 배경
- ⚠️ Retry: 연노랑 배경 + 재시도 카운터
- ❌ Failed: 연빨강 배경 + 에러 메시지

**인터랙션:**
- 행 클릭: 상세 모달 열기 (에러 메시지, retry history)
- 소스 필터: "Gateway" / "Memory Files" / "All"
- 상태 필터: "Success" / "Retry" / "Failed" / "All"
- 정렬: 기본값 시간 역순 (최신부터)
- 페이지네이션: 20개 행 / 페이지

**데이터 업데이트:**
- 초기: `GET /api/status` (전체 이력)
- 폴링: 30초 (또는 WebSocket)

#### 5. 액션 버튼 (하단)

```
[Collect Now]  [Batch Collect]  [View Logs]  [Settings]
```

**Collect Now**
- 클릭: POST /api/batch-collect (즉시)
- 로딩 상태: "Collecting... (125/500 messages)"
- 완료: Toast "Collected 500 messages in 2.5s"

**Batch Collect**
- 클릭: 모달 열기 → 소스 선택 → 수집 시작
- 옵션: Gateway only / Memory files only / All sources

**View Logs**
- 클릭: `/admin/logs` 페이지로 이동

**Settings**
- 클릭: 모달 열기 → 폴링 간격, 알림 설정 등

---

### Page 2: API Status (`/admin/api-status`)

**레이아웃:**
```
┌──────────────────────────────────────────┐
│ API Status & Performance                 │
│                          Uptime: 99.97%   │
├──────────────────────────────────────────┤
│                                           │
│  ┌─ Response Time (24h) ────────────────┐ │
│  │                                       │ │
│  │  ms │     ▁▂▃▄▅▆▇█▅▃▂▁            │ │
│  │     │ avg: 345ms  p95: 1.2s p99: 2.1s│ │
│  │     └───────────────────────────────  │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                           │
│  ┌─ Endpoint Performance ─────────────────┐ │
│  │ Endpoint              | Avg   | p95   │ │
│  ├──────────────────────┼───────┼────────┤ │
│  │ POST /collect-msg    │ 245ms │ 1.1s  │ │
│  │ POST /collect-memory │ 156ms │ 800ms │ │
│  │ POST /batch-collect  │ 524ms │ 2.5s  │ │
│  │ GET /status          │  45ms │ 150ms │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─ Server Health ────────────────────────┐ │
│  │ Status: Healthy ✅                    │ │
│  │ Uptime: 14 days 5 hours               │ │
│  │ Memory: 245MB / 512MB (48%)            │ │
│  │ Queue Size: 145 items                 │ │
│  │ Error Rate (1h): 0.3%                 │ │
│  └───────────────────────────────────────┘ │
│                                           │
└──────────────────────────────────────────┘
```

**섹션 상세:**

#### 1. 응답 시간 차트 (Line Chart)
- X축: 시간 (24h)
- Y축: 응답 시간 (ms)
- 라인: avg, p95, p99
- 라이브러리: Recharts

#### 2. Endpoint 성능 (테이블)
- 각 엔드포인트별 평균 응답 시간
- p95, p99, 호출 수

#### 3. 서버 상태 (신호등)
- 상태: Healthy (🟢) / Degraded (🟡) / Down (🔴)
- Uptime: 일 단위 + 시간
- 메모리 사용률
- 큐 크기
- 에러율

---

### Page 3: Queue Management (`/admin/queue-management`)

**레이아웃:**
```
┌────────────────────────────────────────┐
│ Queue Management                       │
├────────────────────────────────────────┤
│                                        │
│  ┌─ Queue Status ───────────────────┐ │
│  │ Pending:    145 items            │ │
│  │ Processing:  12 items            │ │
│  │ Completed:  48,256 items         │ │
│  │ Failed:      3 items (retry)     │ │
│  └────────────────────────────────┘ │
│                                        │
│  ┌─ Pending Items ───────────────────┐ │
│  │ QueueID | Type  | Added  | Action│ │
│  ├─────────┼───────┼────────┼────────┤ │
│  │ q-001   │ msg   │ 1m ago │ ▼ Retry│ │
│  │ q-002   │ mem   │ 2m ago │ ▼ Skip │ │
│  │ q-003   │ msg   │ 5m ago │ ▼ View │ │
│  └────────────────────────────────┘ │
│                                        │
│  ┌─ Failed Items (Retry Queue) ──────┐ │
│  │ QueueID | Error | RetryCount | ...│ │
│  ├─────────┼───────┼────────────┤────┤ │
│  │ q-100   │ GW-X  │ 1/3        │ 🔄 │ │
│  │ q-101   │ GW-X  │ 2/3        │ 🔄 │ │
│  │ q-102   │ FNOT  │ 1/3        │ 🔄 │ │
│  └────────────────────────────────┘ │
│                                        │
│  [Retry Failed]  [Clear Completed]    │
│                                        │
└────────────────────────────────────────┘
```

**섹션 상세:**

#### 1. 큐 상태 요약 (4개 박스)
- Pending (대기): 파란색
- Processing (처리 중): 주황색
- Completed (완료): 초록색
- Failed (실패): 빨간색

#### 2. Pending Items 테이블
- 현재 처리 대기 중인 항목
- 컬럼: QueueID, Type (message/memory), Added Time, Action (Retry/Skip/View)

#### 3. Failed Items 테이블
- 재시도 대기 중인 실패 항목
- 컬럼: QueueID, Error Code, Retry Count (1/3), Action (Manual Retry / Skip / View)
- 색상: 빨간색 배경

#### 4. 액션 버튼
- **Retry Failed:** 모든 실패 항목 즉시 재시도
- **Clear Completed:** 완료된 항목 삭제 (디스크 정리)

---

### Page 4: Error Logs (`/admin/logs`)

**레이아웃:**
```
┌────────────────────────────────────────┐
│ Error Logs & Debugging                 │
├────────────────────────────────────────┤
│ [2026-06-20 Start Date] [Start Time]   │
│ [2026-06-20 End Date]   [End Time]     │
│ Filter: [All Types ▼] [All Endpoints ▼]│
│                                        │
│ Errors in last 24h: 23                │
│ ┌──────────────────────────────────┐  │
│ │ Time       │ Error Code  │ Count  │  │
│ ├────────────┼─────────────┼────────┤  │
│ │ 10:20 KST  │ GW-UNAVAIL  │ 3      │  │
│ │ 09:45 KST  │ TIMEOUT     │ 1      │  │
│ │ 06:10 KST  │ FILE-NOTFND │ 2      │  │
│ │ ...        │ ...         │ ...    │  │
│ └──────────────────────────────────┘  │
│                                        │
│ [View Details]  [Export CSV]  [Refresh]│
│                                        │
└────────────────────────────────────────┘
```

**기능:**
- 날짜 범위 필터
- 에러 타입 필터
- 엔드포인트 필터
- 에러 집계 (count by type)
- 상세 보기 (클릭 시 모달 → 전체 스택 트레이스)
- CSV 내보내기

---

## 컴포넌트 명세

### 공통 컴포넌트

#### 1. KPI Card
```tsx
interface KPICardProps {
  title: string;           // "Total Messages"
  value: string | number;  // "45,230"
  subtext?: string;        // "↑ 2,450 today"
  trend?: 'up' | 'down';  // 화살표 방향
  icon?: ReactNode;        // 선택 아이콘
  onClick?: () => void;    // 클릭 핸들러
}
```

#### 2. Status Badge
```tsx
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'pending';
  label: string;           // "OK", "Retry", "Failed"
  count?: number;          // 재시도 횟수 (2/3)
}
```

#### 3. Data Table
```tsx
interface DataTableProps {
  columns: ColumnDef[];
  data: any[];
  sortBy?: string;
  onSort?: (col: string) => void;
  filters?: FilterConfig;
  onFilter?: (filters: FilterConfig) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

#### 4. Chart Component
```tsx
interface ChartProps {
  type: 'line' | 'bar' | 'pie';
  data: any[];
  title?: string;
  config?: ChartConfig;
}
```

---

## 상태 관리

**State Management:** Redux Toolkit 또는 Zustand

```typescript
// 대시보드 상태
interface DashboardState {
  // 데이터
  summary: {
    totalMessages: number;
    todayMessages: number;
    successRate: number;
    lastCollectionTime: string;
  };
  recentCollections: Collection[];
  sources: SourceStats[];
  
  // UI 상태
  loading: boolean;
  error: string | null;
  filters: {
    sourceFilter: string[];
    statusFilter: string[];
    dateRange: [Date, Date];
  };
  
  // 폴링
  autoRefresh: boolean;
  refreshInterval: number;
}
```

---

## API 연동

### 초기 로드
```typescript
// 모든 필요한 데이터 로드
useEffect(() => {
  Promise.all([
    fetch('/api/status').then(r => r.json()),
    fetch('/api/queue-status').then(r => r.json()),
    fetch('/api/error-summary').then(r => r.json()),
  ]).then(([statusData, queueData, errorData]) => {
    dispatch(setDashboardData({ statusData, queueData, errorData }));
  });
}, []);
```

### 자동 새로고침
```typescript
useEffect(() => {
  if (!autoRefresh) return;
  
  const interval = setInterval(async () => {
    const data = await fetch('/api/status').then(r => r.json());
    dispatch(updateDashboardData(data));
  }, refreshInterval || 30000);
  
  return () => clearInterval(interval);
}, [autoRefresh, refreshInterval]);
```

### WebSocket 연결 (Real-time Updates)
```typescript
useEffect(() => {
  const ws = new WebSocket('wss://memory-api.app/ws/dashboard');
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    dispatch(updateDashboardData(update));
  };
  
  return () => ws.close();
}, []);
```

---

## 모바일 반응형

**Breakpoints:**
- Desktop: 1200px+
- Tablet: 768px ~ 1199px
- Mobile: < 768px

**적응:**
| 화면 | 레이아웃 | 변경 |
|-----|--------|------|
| Desktop | 4열 KPI | 그대로 |
| Tablet | 2열 KPI | 그대로 |
| Mobile | 1열 KPI | 수직 스택 |

**모바일 최적화:**
- 차트: 터치 제스처 (줌, 드래그)
- 테이블: 가로 스크롤 또는 카드 보기로 전환
- 모달: 전체 화면 (하단에서 슬라이드)
- 버튼: 터치 타겟 44px 이상

---

## 접근성

**WCAG 2.1 AA 준수:**
- [ ] 키보드 네비게이션 (Tab, Arrow, Enter)
- [ ] 스크린 리더 지원 (aria-label, role)
- [ ] 색상 대비 4.5:1 이상
- [ ] 포커스 표시 (outline)
- [ ] 폼 라벨 연결 (htmlFor)

**구현 체크리스트:**
```html
<!-- 버튼 -->
<button aria-label="Collect messages now" onClick={handleCollect}>
  Collect Now
</button>

<!-- 테이블 -->
<table role="grid" aria-label="Recent collections">
  <thead>
    <tr>
      <th scope="col">Source</th>
      ...
    </tr>
  </thead>
</table>

<!-- 차트 -->
<div role="img" aria-label="Source distribution: Gateway 88%, Files 12%">
  <Chart .../>
</div>
```

---

## 구현 로드맵

### Phase 1 (Week 1)
- [ ] 기본 레이아웃 (header, sidebar, main)
- [ ] KPI Cards
- [ ] 소스 분포 차트

### Phase 2 (Week 2)
- [ ] 최근 수집 테이블
- [ ] 실시간 폴링 (30초)
- [ ] 필터링 & 정렬

### Phase 3 (Week 3)
- [ ] API Status 페이지
- [ ] Queue Management 페이지
- [ ] Error Logs 페이지

### Phase 4 (Week 4)
- [ ] WebSocket 연동
- [ ] 모바일 반응형
- [ ] 접근성 검사
- [ ] 성능 최적화

---

**문서 상태:** Ready for Frontend Development  
**마지막 업데이트:** 2026-06-20 11:50 KST
