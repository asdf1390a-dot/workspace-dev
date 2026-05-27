# Harness Engineering Phase 2 — UI/Component 아키텍처 설계
**웹개발자 2026-05-29 Kickoff**

**설계자:** Planner Agent  
**작성일:** 2026-05-27 15:20 KST  
**상태:** ✅ 설계 완료 → 웹개발자 구현 준비

---

## 📋 목차
1. [페이지 구조](#1-페이지-구조)
2. [컴포넌트 아키텍처](#2-컴포넌트-아키텍처)
3. [화면 설계 (Wireframes)](#3-화면-설계)
4. [상태 관리 (State)](#4-상태-관리)
5. [API 통합 & 고급 설계](#5-api-통합)
   - [5.1 API 클라이언트](#51-api-클라이언트)
   - [5.2 에러 처리 & 엣지 케이스](#52-에러-처리--엣지-케이스)
   - [5.3 모바일 반응형](#53-모바일-반응형-설계)
   - [5.4 접근성 (WCAG AA)](#54-접근성-설계)
   - [5.5 로딩 상태 & 스켈레톤](#55-로딩-상태--스켈레톤-화면)
6. [구현 로드맵](#6-구현-로드맵)

---

## 1. 페이지 구조

### 1.1 라우팅 구조 (Next.js App Router)
```
/harness                          # 메인 페이지 (대시보드)
├── /harness/schedule             # 생산일정 관리
│   ├── /harness/schedule/list    # 목록 조회
│   └── /harness/schedule/create  # 생성 폼
├── /harness/maintenance          # 보전계획 관리
│   ├── /harness/maintenance/list # 목록 조회
│   └── /harness/maintenance/create # 생성 폼
├── /harness/validation           # 검증 결과
│   ├── /harness/validation/list  # 검증 목록
│   └── /harness/validation/[id]  # 상세 보기
└── /harness/audit-logs           # 감시 로그
```

### 1.2 주요 페이지
| 페이지 | 기능 | 사용자 |
|--------|------|--------|
| `/harness` | 대시보드 (요약 통계) | 생산관리자, 보전계획팀 |
| `/harness/schedule/list` | 생산일정 목록 + 필터 | 생산관리자 |
| `/harness/schedule/create` | 생산일정 생성 폼 | 생산관리자 |
| `/harness/maintenance/list` | 보전계획 목록 + 필터 | 보전계획팀 |
| `/harness/maintenance/create` | 보전계획 생성 폼 | 보전계획팀 |
| `/harness/validation/list` | 검증 결과 목록 | 모두 |
| `/harness/validation/[id]` | 검증 상세 + 충돌 해석 | 모두 |
| `/harness/audit-logs` | 감시 로그 조회 | 관리자 |

---

## 2. 컴포넌트 아키텍처

### 2.1 디렉토리 구조
```
app/
├── harness/
│   ├── page.tsx                        # 대시보드 페이지
│   ├── layout.tsx                      # Harness 레이아웃
│   ├── schedule/
│   │   ├── page.tsx                    # 목록 페이지
│   │   ├── create/
│   │   │   └── page.tsx                # 생성 페이지
│   │   └── [id]/
│   │       ├── page.tsx                # 상세 페이지
│   │       └── edit/
│   │           └── page.tsx            # 수정 페이지
│   ├── maintenance/
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   └── [id]/page.tsx
│   ├── validation/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── audit-logs/
│       └── page.tsx
│
components/
├── harness/
│   ├── HarnessLayout.tsx               # 네비게이션 + 사이드바
│   ├── HarnessDashboard.tsx            # 대시보드 (요약)
│   │
│   ├── schedule/
│   │   ├── ScheduleList.tsx            # 목록 (테이블)
│   │   ├── ScheduleForm.tsx            # 생성/수정 폼
│   │   ├── ScheduleCard.tsx            # 카드 (대시보드용)
│   │   ├── ScheduleFilters.tsx         # 필터 (시설, 날짜, 상태)
│   │   └── ScheduleActions.tsx         # 액션 (삭제, 검증)
│   │
│   ├── maintenance/
│   │   ├── MaintenanceList.tsx
│   │   ├── MaintenanceForm.tsx
│   │   ├── MaintenanceCard.tsx
│   │   ├── MaintenanceFilters.tsx
│   │   └── MaintenanceActions.tsx
│   │
│   ├── validation/
│   │   ├── ValidationList.tsx          # 검증 결과 목록
│   │   ├── ValidationDetail.tsx        # 상세 보기 + 충돌 해석
│   │   ├── ConflictBadge.tsx           # 충돌 표시 (status별 색상)
│   │   ├── ConflictTimeline.tsx        # 시간 충돌 시각화
│   │   └── RecommendationPanel.tsx     # 해결 제안
│   │
│   ├── audit/
│   │   ├── AuditLogTable.tsx           # 감시 로그 테이블
│   │   └── AuditFilters.tsx            # 필터 (요청자, 날짜, 상태)
│   │
│   └── shared/
│       ├── StatusBadge.tsx             # 상태 배지 (pending/approved/rejected)
│       ├── SeverityBadge.tsx           # 심각도 배지 (critical/warning)
│       ├── ConflictTypeTag.tsx         # 충돌 유형 태그
│       ├── DatePicker.tsx              # 날짜 선택기
│       └── TimePicker.tsx              # 시간 선택기

lib/
├── harness/
│   ├── types.ts                        # TypeScript 타입 (별도 폴더)
│   ├── schemas.ts                      # Zod 스키마 (기존)
│   ├── api-client.ts                   # API 클라이언트 (fetch 래퍼)
│   ├── validation-engine.ts            # 클라이언트 측 검증 로직
│   └── conflict-analyzer.ts            # 충돌 분석 헬퍼
```

### 2.2 핵심 컴포넌트

#### 2.2.1 HarnessLayout (레이아웃)
```typescript
// app/harness/layout.tsx
export default function HarnessLayout({ children }: { children: React.ReactNode }) {
  return (
    <HarnessContextProvider>
      <div className="flex h-screen">
        <HarnessSidebar />  {/* 네비게이션 */}
        <main className="flex-1 overflow-auto">
          <HarnessHeader /> {/* 제목 + 브레드크럼 */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </HarnessContextProvider>
  );
}
```

#### 2.2.2 HarnessDashboard (대시보드)
```typescript
// components/harness/HarnessDashboard.tsx
export function HarnessDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* KPI 카드 */}
      <KPICard label="오늘 생산 일정" value="12" trend="↑" />
      <KPICard label="예정 보전 작업" value="3" trend="→" />
      <KPICard label="충돌 감지" value="1" color="red" />
      <KPICard label="평균 검증 시간" value="245ms" />
      
      {/* 최근 활동 */}
      <RecentActivity className="col-span-2" />
      
      {/* 충돌 요약 */}
      <ConflictSummary className="col-span-2" />
    </div>
  );
}
```

#### 2.2.3 ScheduleForm (생성/수정 폼)
```typescript
// components/harness/schedule/ScheduleForm.tsx
interface ScheduleFormProps {
  initialData?: ProductionSchedule;
  onSubmit: (data: ProductionSchedule) => Promise<void>;
}

export function ScheduleForm({ initialData, onSubmit }: ScheduleFormProps) {
  const [formData, setFormData] = useState<ProductionSchedule>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = ProductionScheduleSchema.parse(formData);
      await onSubmit(validated);
    } catch (error) {
      // Zod 에러 처리
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <fieldset className="border rounded-lg p-4">
        <legend className="text-lg font-semibold">기본 정보</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="시설 ID" 
            value={formData.facility_id}
            onChange={(e) => setFormData({...formData, facility_id: e.target.value})}
            error={errors.facility_id}
          />
          <Select 
            label="근무반"
            value={formData.shift}
            onChange={(e) => setFormData({...formData, shift: e.target.value as 'A'|'B'|'C'})}
            options={[
              { value: 'A', label: 'A반 (06:00-14:00)' },
              { value: 'B', label: 'B반 (14:00-22:00)' },
              { value: 'C', label: 'C반 (22:00-06:00)' },
            ]}
          />
          <DateInput 
            label="예정 날짜" 
            value={formData.scheduled_date}
            onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
          />
          <NumberInput 
            label="생산 수량" 
            value={formData.target_quantity}
            onChange={(e) => setFormData({...formData, target_quantity: parseInt(e.target.value)})}
          />
        </div>
      </fieldset>

      {/* 자산 선택 */}
      <fieldset className="border rounded-lg p-4">
        <legend className="text-lg font-semibold">자산 선택</legend>
        <AssetMultiSelect 
          selected={formData.asset_ids}
          onChange={(asset_ids) => setFormData({...formData, asset_ids})}
          error={errors.asset_ids}
        />
      </fieldset>

      {/* 예상 가동중단 */}
      <fieldset className="border rounded-lg p-4">
        <legend className="text-lg font-semibold">예상 가동중단</legend>
        <NumberInput 
          label="계획된 중단 시간 (분)"
          value={formData.planned_downtime_minutes}
          onChange={(e) => setFormData({...formData, planned_downtime_minutes: parseInt(e.target.value)})}
        />
      </fieldset>

      {/* 비고 */}
      <fieldset className="border rounded-lg p-4">
        <legend className="text-lg font-semibold">추가 정보</legend>
        <Textarea 
          label="비고"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="특이사항이 있으면 입력하세요"
        />
      </fieldset>

      {/* 액션 버튼 */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => window.history.back()}>취소</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
```

#### 2.2.4 ValidationDetail (검증 상세)
```typescript
// components/harness/validation/ValidationDetail.tsx
interface ValidationDetailProps {
  validationId: string;
}

export function ValidationDetail({ validationId }: ValidationDetailProps) {
  const [data, setData] = useState<ValidationResponse | null>(null);
  const [schedule, setSchedule] = useState<ProductionSchedule | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenancePlan | null>(null);

  useEffect(() => {
    // API 호출: /api/harness/validation/[id]
    fetchValidation();
  }, [validationId]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">검증 결과 #{validationId}</h1>
        <StatusBadge status={data?.status} />
      </div>

      {/* 검증 요약 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">검증 정보</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-600">검증 유형</dt>
            <dd className="font-medium">{data?.validation_duration_ms}ms</dd>
          </div>
          <div>
            <dt className="text-gray-600">검증 시각</dt>
            <dd className="font-medium">{formatDateTime(data?.validated_at)}</dd>
          </div>
        </dl>
      </div>

      {/* 시간 충돌 시각화 */}
      {schedule && maintenance && (
        <ConflictTimeline schedule={schedule} maintenance={maintenance} />
      )}

      {/* 충돌 목록 */}
      {data?.conflicts && data.conflicts.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">감지된 충돌</h2>
          <div className="space-y-3">
            {data.conflicts.map((conflict, idx) => (
              <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <SeverityBadge severity={conflict.severity} />
                <div className="flex-1">
                  <h3 className="font-medium"><ConflictTypeTag type={conflict.type} /></h3>
                  <p className="text-sm text-gray-700 mt-1">{conflict.details}</p>
                  {conflict.affected_assets.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      영향 자산: {conflict.affected_assets.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 권장사항 */}
      {data?.recommendations && data.recommendations.length > 0 && (
        <RecommendationPanel recommendations={data.recommendations} />
      )}

      {/* 관련 데이터 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schedule && <ScheduleCard schedule={schedule} />}
        {maintenance && <MaintenanceCard maintenance={maintenance} />}
      </div>
    </div>
  );
}
```

---

## 3. 상호작용 흐름 (Interaction Flows)

### 3.0.1 사용자 여정 맵 (User Journey)

#### 시나리오 1: 생산관리자 - 생산일정 + 자산 검증
```
1. 대시보드 접속
   ↓
2. "생산일정 관리" 클릭
   ↓
3. 날짜 필터링 (예: 2026-05-27)
   ↓
4. 목록에서 행 선택
   ↓
5. 검증 버튼 클릭 (또는 자동 검증)
   ↓
6. 검증 결과 페이지 → 충돌 감지 여부 확인
   ↓
7a. 충돌 없음 → "승인" 버튼 클릭 → 대시보드로 돌아감
7b. 충돌 있음 → 권장사항 확인 → "일정 수정" → 재시도
```

**소요시간:** 2-3분 (충돌 없는 경우) / 5-10분 (충돌 있는 경우)

#### 시나리오 2: 보전계획팀 - 보전계획 생성 + 영향도 분석
```
1. 대시보드 접속
   ↓
2. "보전계획 관리" 클릭
   ↓
3. "+ 새 계획" 버튼
   ↓
4. 폼 작성 (자산, 유형, 시간, 우선순위)
   ↓
5. 미리보기 (자동 검증 트리거)
   ↓
6a. 경고 없음 → "저장" → 목록에서 확인
6b. 경고 있음 → "세부정보 보기" → 권장사항 → 시간 조정 → 재저장
```

**소요시간:** 3-5분 (신규) / 2-3분 (수정)

#### 시나리오 3: 관리자 - 감시 로그 조회 + 감사
```
1. 대시보드 접속
   ↓
2. "감시 로그" 클릭
   ↓
3. 필터 설정 (요청자, 기간, 상태)
   ↓
4. 로그 목록 표시
   ↓
5. 항목 클릭 → 상세 보기
   ↓
6. PDF 다운로드 또는 메일 발송
```

**소요시간:** 3-5분

### 3.0.2 상태 전환 다이어그램 (State Machine)

#### ValidationResponse 상태
```
┌─────────────────────────────────────────┐
│         ValidationRequest 수신            │
└────────────────────┬────────────────────┘
                     │
         ┌───────────▼──────────┐
         │  검증 규칙 엔진 실행  │
         └───────────┬──────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    충돌 감지    경고 감지    정상
        │            │            │
   ┌────▼───┐  ┌─────▼─────┐  ┌──▼───┐
   │CONFLICT │  │  WARNING  │  │VALID │
   │(심각)   │  │(주의)     │  │(통과)│
   └────┬───┘  └─────┬─────┘  └──┬───┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────▼─────────────┐
        │ 사용자에게 결과 표시     │
        │ (권장사항 포함)          │
        └──────────────────────────┘
```

#### ScheduleForm 상태
```
렌더링 → 입력 → 검증 ─┬─→ 에러 표시 → 수정 ─┐
                     │                       │
                     ├─→ 저장 중 → 성공 → 리다이렉트
                     │               ↓
                     └─→ 서버에러 → 재시도 팝업
```

---

## 3. 화면 설계 (Wireframes)

### 3.1 생산일정 목록 페이지
```
┌──────────────────────────────────────────┐
│ 생산일정 관리                             │
├──────────────────────────────────────────┤
│ [필터] [시설선택 ▼] [날짜선택] [생성]   │
├──────────────────────────────────────────┤
│ 시설 │ 날짜 │ 근무반 │ 수량 │ 상태 │ 충돌│
├──────────────────────────────────────────┤
│ DC1  │ 5/27 │ A반   │ 100  │ ○ 승인 │ ✓ │
│ DC1  │ 5/27 │ B반   │ 80   │ ◐ 대기 │ ! │
│ DC2  │ 5/28 │ C반   │ 120  │ ○ 승인 │   │
└──────────────────────────────────────────┘
```

**기능:**
- 필터: 시설, 날짜 범위, 상태 (승인/대기/거부)
- 정렬: 날짜, 시설, 상태
- 액션: 상세 보기, 수정, 검증, 삭제
- 충돌 표시: 색상 코드 (❌ 충돌, ⚠️ 경고, ✓ 없음)

### 3.2 보전계획 목록 페이지
```
┌──────────────────────────────────────────┐
│ 보전계획 관리                             │
├──────────────────────────────────────────┤
│ [필터] [자산선택 ▼] [유형 ▼] [우선순위] │
├──────────────────────────────────────────┤
│ 자산 │ 유형 │ 시작 │ 종료 │ 우선순위 │상태│
├──────────────────────────────────────────┤
│ JIG1 │ 정기 │ 14:00│ 16:00│ 중       │승인│
│ MOLD│ 비상 │ 06:00│ 08:00│ 높음     │대기│
│ JIG2 │ 예측 │ 22:00│ 23:00│ 낮음     │승인│
└──────────────────────────────────────────┘
```

### 3.3 검증 결과 상세 페이지 (Reports/Analysis)
```
┌──────────────────────────────────────────────────────┐
│ 검증 결과 #UUID-1234        [← 뒤로] [공유] [PDF]    │
├──────────────────────────────────────────────────────┤
│ 상태: 🔴 충돌 감지         │ 검증시간: 245ms        │
│ 요청: 2026-05-27 14:30     │ 검증자: HARNESS_ENGINE │
├──────────────────────────────────────────────────────┤
│ 📊 충돌 분석                                          │
├──────────────────────────────────────────────────────┤
│ ①번 충돌 [심각]                                      │
│  ├─ 유형: 시간 겹침                                  │
│  ├─ 생산일정: DC-PRD-001                             │
│  │  └─ 2026-05-27 14:00-22:00 (8시간)               │
│  ├─ 보전계획: MNT-JIG-001                            │
│  │  └─ 2026-05-27 16:00-18:00 (2시간)               │
│  ├─ 겹침구간: 16:00-18:00 (120분)                   │
│  └─ 영향자산: JIG1, JIG2                             │
│                                                      │
│ ②번 경고 [주의]                                      │
│  ├─ 유형: 역량 부족                                  │
│  ├─ 보전팀: A팀 (현재 2명, 필요 3명)                 │
│  └─ 영향범위: facility                              │
├──────────────────────────────────────────────────────┤
│ 💡 권장사항                                          │
│  ① 생산일정을 18:00 이후로 미루기                   │
│  ② 보전계획을 야간반으로 재배치                     │
│  ③ 대체 자산 사용 검토 (MOLD-03)                     │
│                                                      │
│  [기술팀에 상담] [수정 후 재검증]                     │
└──────────────────────────────────────────────────────┘
```

**인터랙션:**
- 충돌 항목 클릭 → 타임라인 팝업
- "시간 조정" 버튼 → 관련 일정 수정 페이지로 이동
- "권장사항 적용" → 일정 자동 수정 (사용자 확인 후)
- "공유" → 이메일/채팅으로 전송

### 3.4 대시보드 상세 페이지 (Dashboard Analysis)
```
┌──────────────────────────────────────────────────────┐
│ Harness 대시보드                       [새로고침] ⚙️  │
├──────────────────────────────────────────────────────┤
│ ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│ │ 생산일정   │  │ 보전계획   │  │ 감지된충돌 │       │
│ │    12개    │  │     3개    │  │     1개    │       │
│ │  [→자세히] │  │  [→자세히] │  │  [→확인]   │       │
│ └────────────┘  └────────────┘  └────────────┘       │
│                                                      │
│ 📈 오늘의 활동 (2026-05-27)                          │
├──────────────────────────────────────────────────────┤
│ • 14:30 - 검증 요청 #UUID-1234 [충돌 감지] 처리됨   │
│ • 14:15 - 생산일정 #DC-PRD-002 승인됨               │
│ • 14:00 - 보전계획 #MNT-MOL-003 생성됨              │
│ • 13:45 - 감사 로그 접근 (admin@...)                │
│                                                      │
│ 📊 주간 트렌드                                        │
│  검증 요청 │  충돌감지│  성공률│ 평균시간             │
│    45     │    8    │  82%  │  180ms               │
│                                                      │
│ 🚨 주의사항                                          │
│  • 월-수 충돌률 높음 (18%) → 일정 조정 권장          │
│  • A팀 역량 초과 (주간 누적 120%)                    │
│  • 미처리 충돌 2건 (즉시 확인 필요)                  │
│                                                      │
│ [자세한 분석 보기] [보고서 다운로드]                 │
└──────────────────────────────────────────────────────┘
```

---

## 3.5 상세 컴포넌트 명세 (Component Specifications)

### ConflictTimeline 컴포넌트

**목적:** 생산일정과 보전계획의 시간 겹침을 시각적으로 표시

**Props:**
```typescript
interface ConflictTimelineProps {
  schedule: ProductionSchedule;        // 생산일정
  maintenance: MaintenancePlan;        // 보전계획
  highlightConflict?: boolean;         // 겹침 영역 하이라이트 (기본값: true)
  timezone?: string;                   // 시간대 (기본값: 'Asia/Seoul')
  onTimeSelect?: (time: string) => void; // 시간 클릭 시 콜백
}
```

**렌더 결과:**
```
시간축: 06:00 ─────────────────────────────────────── 23:59

생산:   A반  |─────────────────────────────────|
            14:00                              22:00

보전:   정기 |────|
            16:00 18:00

겹침:       [████] (120분)
```

**동작:**
- 시간 축 범위: min(schedule_start, maint_start) ~ max(schedule_end, maint_end)
- 겹침 구간 색상: #EF4444 (red-500)
- 마우스 호버 → 시간 표시
- 클릭 → 해당 시간으로 일정 수정 가능

### RecommendationPanel 컴포넌트

**목적:** 충돌 해결을 위한 제안사항 제시

**Props:**
```typescript
interface RecommendationPanelProps {
  recommendations: string[];           // 제안사항 배열
  onApply?: (index: number) => void;   // 제안사항 적용 시 콜백
  canApply?: boolean;                  // 자동 적용 가능 여부
}
```

**렌더 결과:**
```
제안 1: 생산일정을 18:00 이후로 미루기
  └─ 영향: 일정 완료 시간 2시간 지연
     가능성: 높음 (대체 자산 available)
     [수정 후 재검증] [무시]

제안 2: 보전계획을 야간반으로 재배치
  └─ 영향: 보전팀 야간 근무 추가
     가능성: 중간 (A팀 현재 상태 확인 필요)
     [적용] [무시]
```

### ScheduleForm 컴포넌트 (개선사항)

**입력 필드 동작:**

```typescript
// 필드 순서 및 자동완성 규칙
1. facility_id: 
   - 드롭다운 (기존 시설 자동로드)
   - 선택 시 → asset_ids 드롭다운 업데이트

2. shift:
   - 라디오 버튼: A반 (06:00-14:00) | B반 (14:00-22:00) | C반 (22:00-06:00)
   - 선택 시 → scheduled_date 미니 캘린더 활성화

3. scheduled_date:
   - 날짜 선택기 (최소 오늘, 최대 60일 후)
   - 선택 시 → 자동 검증 트리거 (2초 후)

4. asset_ids:
   - 다중 선택 (체크박스 또는 태그입력)
   - 선택 시 → target_quantity 기본값 계산 (asset별 생산량 × 수량)

5. target_quantity:
   - 숫자 입력
   - 변경 시 → 예상 생산 완료 시간 자동 계산

6. planned_downtime_minutes:
   - 드래그 슬라이더 (0-480분, 30분 단위)
   - 선택 시 → 총 가용시간 표시

7. notes:
   - 텍스트 영역 (선택사항)
```

**검증 규칙:**
```
1. facility_id: 필수, UUID 형식
2. shift: 필수, A|B|C만 가능
3. asset_ids: 최소 1개, 최대 10개
4. target_quantity: 필수, 1~1000
5. planned_downtime_minutes: 선택사항, 0~480
6. notes: 선택사항, 최대 500자
```

**에러 메시지:**
```
• facility_id 비어있음: "생산 시설을 선택해주세요"
• asset_ids 미선택: "최소 1개 이상의 자산을 선택해주세요"
• target_quantity 범위: "생산 수량은 1~1000 사이여야 합니다"
• 일정 중복: "해당 시간대에 이미 일정이 있습니다"
• 검증 실패: "일정 검증에 실패했습니다. 기술팀에 문의하세요"
```

### ValidationList 페이지 (필터 상세)

**필터 옵션:**
```
1. 상태 필터:
   □ valid (통과)      ☑️ conflict (충돌)
   □ warning (경고)    ☑️ error (에러)

2. 기간 필터:
   [오늘] [7일] [30일] [직접선택 ▼]
   (기본값: 7일)

3. 심각도 필터:
   □ critical (중대) ☑️ warning (주의)

4. 검색:
   [일정 ID / 계획 ID / 요청자 검색...]
```

**정렬 옵션:**
```
• 최신순 (검증 시각)
• 오래된순
• 심각도 높은순
• 이름순 (시설/자산명)
```

---

## 4. 상태 관리 (State)

### 4.1 React Context 구조
```typescript
// lib/harness/HarnessContext.tsx
interface HarnessContextType {
  schedules: ProductionSchedule[];
  maintenance: MaintenancePlan[];
  validations: ValidationResponse[];
  auditLogs: AuditLog[];
  
  // 필터
  filters: {
    facility?: string;
    dateRange?: [string, string];
    status?: string;
    conflictStatus?: string;
  };
  
  // 로딩 및 에러
  isLoading: boolean;
  error: string | null;
  
  // 액션
  createSchedule: (data: ProductionSchedule) => Promise<void>;
  updateSchedule: (id: string, data: UpdateSchedule) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  
  createMaintenance: (data: MaintenancePlan) => Promise<void>;
  updateMaintenance: (id: string, data: UpdateMaintenance) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;
  
  validateConflict: (scheduleId: string, maintenanceId: string) => Promise<ValidationResponse>;
  
  // 필터
  setFilters: (filters: typeof filters) => void;
}

export const HarnessContext = createContext<HarnessContextType>(null!);
```

### 4.2 React Query (TanStack Query) 통합
```typescript
// lib/harness/hooks.ts
export function useProductionSchedules() {
  return useQuery({
    queryKey: ['harness', 'schedules'],
    queryFn: async () => {
      const res = await fetch('/api/harness/schedules');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

export function useValidationResult(validationId: string) {
  return useQuery({
    queryKey: ['harness', 'validation', validationId],
    queryFn: async () => {
      const res = await fetch(`/api/harness/validation/${validationId}`);
      return res.json();
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductionSchedule) => {
      const res = await fetch('/api/harness/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harness', 'schedules'] });
    },
  });
}
```

---

## 5. API 통합

### 5.1 API 클라이언트
```typescript
// lib/harness/api-client.ts
export const HarnessAPI = {
  // Production Schedule
  schedules: {
    list: (filters?: any) => 
      fetch(`/api/harness/schedules?${new URLSearchParams(filters)}`),
    get: (id: string) => 
      fetch(`/api/harness/schedules/${id}`),
    create: (data: ProductionSchedule) => 
      fetch('/api/harness/schedules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateSchedule) => 
      fetch(`/api/harness/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => 
      fetch(`/api/harness/schedules/${id}`, { method: 'DELETE' }),
  },
  
  // Maintenance Plan
  maintenance: {
    list: (filters?: any) => 
      fetch(`/api/harness/maintenance?${new URLSearchParams(filters)}`),
    get: (id: string) => 
      fetch(`/api/harness/maintenance/${id}`),
    create: (data: MaintenancePlan) => 
      fetch('/api/harness/maintenance', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateMaintenance) => 
      fetch(`/api/harness/maintenance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => 
      fetch(`/api/harness/maintenance/${id}`, { method: 'DELETE' }),
  },
  
  // Validation
  validation: {
    validate: (scheduleId: string, maintenanceId: string) => 
      fetch('/api/harness/validate', {
        method: 'POST',
        body: JSON.stringify({
          production_schedule_id: scheduleId,
          maintenance_plan_id: maintenanceId,
          request_type: 'conflict_check',
        }),
      }),
    getResult: (id: string) => 
      fetch(`/api/harness/validation/${id}`),
    listResults: (filters?: any) => 
      fetch(`/api/harness/validation?${new URLSearchParams(filters)}`),
  },
  
  // Audit Logs
  audit: {
    list: (filters?: any) => 
      fetch(`/api/harness/audit-logs?${new URLSearchParams(filters)}`),
  },
};
```

### 5.2 에러 처리
```typescript
// lib/harness/error-handler.ts
export function handleHarnessError(error: any) {
  if (error.response?.status === 409) {
    return '충돌이 감지되었습니다. 시간을 조정해주세요.';
  }
  if (error.response?.status === 400) {
    return `입력 오류: ${error.response.data.message}`;
  }
  if (error.response?.status === 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  return error.message || '알 수 없는 오류가 발생했습니다.';
}
```

---

## 5.2 에러 처리 & 엣지 케이스 (Error Handling & Edge Cases)

### 네트워크 에러
```typescript
// HTTP 409: 충돌 감지 (Conflict)
상황: 사용자가 검증 요청 시 충돌 감지됨
UI 응답:
  ├─ 토스트: "🔴 충돌이 감지되었습니다. 권장사항을 확인해주세요"
  ├─ 폼 상태: 자동 저장 금지, 수정 권유
  └─ 자동 전환: ValidationDetail 페이지로 이동 (1초 후)

// HTTP 400: 입력 오류
상황: 필수 필드 누락 또는 형식 오류
UI 응답:
  ├─ 토스트: "❌ 입력 오류: {필드명} 확인이 필요합니다"
  ├─ 폼: 오류 필드 하이라이트 (border-red-500)
  └─ 에러메시지: 필드 아래 인라인 표시 (text-xs text-red-600)

// HTTP 500: 서버 에러
상황: 서버 측 오류 발생
UI 응답:
  ├─ 토스트: "⚠️ 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
  ├─ 재시도 버튼: 자동으로 제공 (3회 자동 재시도 후 수동 재시도)
  └─ 관리자 연락처: 문제 지속 시 표시

// HTTP 429: Rate Limit
상황: API 요청 제한 초과
UI 응답:
  ├─ 토스트: "⏱️ 잠시 후 다시 시도해주세요"
  ├─ 버튼 비활성화: 제한 시간 동안 비활성화
  └─ 카운트다운: "다시 시도 가능: 25초" 표시

// 네트워크 오프라인
상황: 인터넷 연결 끊김
UI 응답:
  ├─ 배너: 상단에 "오프라인 상태입니다" 표시
  ├─ 로컬 캐시: 이전 데이터 표시 (회색 배경으로 '캐시됨' 표시)
  └─ 액션 비활성화: 저장, 검증 등 버튼 모두 비활성화
```

### 폼 검증 에러 (Form Validation)
```
ScheduleForm 필드별 에러 메시지:

1. facility_id:
   입력: [공백]
   에러: "❌ 생산 시설을 선택해주세요"
   
2. asset_ids:
   입력: []
   에러: "❌ 최소 1개 이상의 자산을 선택해주세요"
   
3. target_quantity:
   입력: "2000"
   에러: "❌ 생산 수량은 1~1000 사이여야 합니다"
   
4. planned_downtime_minutes:
   입력: "500"
   에러: "❌ 가용 시간을 초과했습니다 (최대: 480분)"

MaintenanceForm 필드별 에러 메시지:

1. maintenance_type:
   입력: [없음]
   에러: "❌ 보전 유형을 선택해주세요"
   
2. start_time / end_time:
   입력: end_time < start_time
   에러: "❌ 종료 시간이 시작 시간보다 뒤여야 합니다"
   
3. priority:
   입력: [범위 밖]
   에러: "❌ 우선순위는 낮음/중간/높음 중 하나여야 합니다"
```

### UI 에러 상태 스타일링
```typescript
// 폼 필드 에러 상태
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700">생산 시설</label>
  <select className="mt-1 block w-full border-2 border-red-500 rounded-lg p-2 focus:ring-red-500">
    <option>선택해주세요</option>
  </select>
  <p className="mt-1 text-xs text-red-600">생산 시설을 선택해주세요</p>
</div>

// 토스트 알림 패턴
success: "✅ 일정이 저장되었습니다"      → 초록색 배경, 5초 자동 소멸
warning: "⚠️ 경고: 충돌 가능성"           → 노란색 배경, 사용자가 닫을 때까지
error:   "❌ 오류: 서버 연결 실패"       → 빨간색 배경, 재시도 버튼 포함
info:   "ℹ️ 저장 중..."                   → 파란색 배경, 닫기 불가
```

---

## 5.3 모바일 반응형 설계 (Mobile Responsiveness)

### 반응형 브레이크포인트
```
Tailwind CSS 기준:
- sm: 640px  (모바일)
- md: 768px  (태블릿)
- lg: 1024px (데스크톱)
- xl: 1280px (와이드 데스크톱)

Harness UI 최적화:
- 모바일 (< 640px): 1열 레이아웃, 스택형
- 태블릿 (640-1024px): 2열 레이아웃
- 데스크톱 (> 1024px): 3열+ 그리드 레이아웃
```

### 모바일 페이지 레이아웃 (< 640px)

**생산일정 목록 (모바일)**
```
┌────────────────────────────┐
│ 생산일정 관리        [⋮]  │
├────────────────────────────┤
│ [필터 ▼] [+생성]           │
├────────────────────────────┤
│ 카드형 레이아웃             │
│ ┌──────────────────────┐   │
│ │ DC1 | 2026-05-27     │   │
│ │ A반 | 100개 | ✓ 승인 │   │
│ │ [상세] [검증] [삭제]  │   │
│ └──────────────────────┘   │
│                            │
│ ┌──────────────────────┐   │
│ │ DC2 | 2026-05-28     │   │
│ │ B반 | 80개  | ◐ 대기  │   │
│ │ [상세] [검증] [삭제]  │   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

**생산일정 생성 폼 (모바일)**
```
모바일에서는 한 줄에 하나의 필드:
- facility_id: 드롭다운 (전폭)
- shift: 라디오 버튼 (스택 형태)
- scheduled_date: 날짜 입력 (전폭, 모바일 네이티브 피커)
- asset_ids: 체크박스 목록 (스크롤 가능)
- target_quantity: 숫자 입력 (전폭)
- planned_downtime_minutes: 슬라이더 (전폭)
- notes: 텍스트 영역 (전폭)

버튼:
[저장] [취소] → 모바일에서 풀 너비
```

### 테이블 → 카드 변환 (모바일)

**데스크톱 테이블 (>= md)**
```
| 시설 | 날짜 | 근무반 | 수량 | 상태 | 충돌 |
|------|------|--------|------|------|------|
| DC1  | 5/27 | A반   | 100  | ✓   |  ✓   |
```

**모바일 카드 (< md)**
```
┌────────────────────────┐
│ 시설: DC1              │
│ 날짜: 2026-05-27       │
│ 근무반: A반            │
│ 수량: 100개            │
│ 상태: ✓ 승인           │
│ 충돌: ✓ 없음           │
├────────────────────────┤
│ [상세보기] [검증] [삭제] │
└────────────────────────┘
```

### 네비게이션 (모바일)
```
데스크톱: 좌측 사이드바 (고정)
모바일: 하단 탭 네비게이션 (bottom navigation) 또는 햄버거 메뉴

하단 탭:
┌─────┬─────┬─────┬─────┐
│🏠   │📋   │📊   │⚙️   │
│HOME │PLAN │VALID│AUDIT│
└─────┴─────┴─────┴─────┘
```

### 터치 타겟 사이즈 (모바일)
```
WCAG 기준: 최소 44x44px
Harness 모바일 버튼: 44x44px 최소
  - 버튼 간 여백: 8px
  - 텍스트: 16px 이상
```

---

## 5.4 접근성 설계 (Accessibility - WCAG AA)

### 색상 대비 (Color Contrast)
```
WCAG AA 기준: 최소 4.5:1 (텍스트), 3:1 (그래픽 요소)

상태 표시:
- ✓ 통과 (valid): 초록색 (rgb(34, 197, 94)) + 텍스트 검정
  대비율: 6.2:1 ✅
  
- ⚠️ 경고 (warning): 노란색 (rgb(251, 191, 36)) + 텍스트 검정
  대비율: 5.4:1 ✅
  
- ❌ 충돌 (conflict): 빨간색 (rgb(239, 68, 68)) + 텍스트 흰색
  대비율: 5.1:1 ✅

색상만으로 구분 금지:
  ❌ (나쁜 예) 빨간 배경만 사용
  ✅ (좋은 예) 빨간 배경 + "❌" 아이콘 + "충돌" 텍스트
```

### ARIA 라벨링 (Semantic HTML + ARIA)
```typescript
// 폼 라벨
<label htmlFor="facility_id" className="block text-sm font-medium">
  생산 시설
  <span aria-label="필수 항목" className="text-red-600">*</span>
</label>
<select id="facility_id" aria-describedby="facility_help">
  <option value="">선택해주세요</option>
  <option value="fac_1">DC1</option>
</select>
<p id="facility_help" className="text-xs text-gray-600 mt-1">
  생산이 진행될 시설을 선택하세요
</p>

// 버튼 라벨
<button aria-label="생산일정 검증 요청">
  <CheckIcon /> 검증
</button>

// 테이블 헤더
<table role="table">
  <thead>
    <tr>
      <th scope="col">시설</th>
      <th scope="col">날짜</th>
      <th scope="col">상태</th>
    </tr>
  </thead>
</table>

// 모달 다이얼로그
<dialog
  role="alertdialog"
  aria-labelledby="dialog_title"
  aria-describedby="dialog_desc"
>
  <h2 id="dialog_title">충돌 감지</h2>
  <p id="dialog_desc">이 일정은 보전계획과 충돌합니다...</p>
  <button autoFocus>이해했습니다</button>
</dialog>
```

### 키보드 네비게이션 (Keyboard Navigation)
```
Tab: 다음 포커스 요소로 이동
Shift+Tab: 이전 포커스 요소로 이동
Enter: 버튼/폼 제출
Space: 체크박스 토글, 버튼 실행
Escape: 모달 닫기
Arrow keys: 드롭다운 옵션 이동, 슬라이더 조절

포커스 스타일 (모든 인터랙티브 요소):
.focus {
  outline: 2px solid rgb(59, 130, 246); /* 파란색 */
  outline-offset: 2px;
}

초점 표시 순서:
1. 헤더 네비게이션
2. 필터 컨트롤
3. 메인 콘텐츠 (테이블/카드)
4. 액션 버튼
5. 페이지네이션
```

### 스크린 리더 최적화 (Screen Reader)
```typescript
// 동적 콘텐츠 업데이트
<div aria-live="polite" aria-atomic="true">
  {loadingState && <p>검증 중입니다...</p>}
  {errorState && <p role="alert">오류: {errorMessage}</p>}
  {successState && <p role="status">저장 완료</p>}
</div>

// 숨겨진 텍스트 레이블
<button>
  <TrashIcon aria-hidden="true" />
  <span className="sr-only">일정 삭제</span> 삭제
</button>

// 복잡한 UI 설명
<section aria-label="충돌 분석">
  <h2>감지된 충돌</h2>
  {conflicts.map((conflict) => (
    <article key={conflict.id} aria-label={`충돌: ${conflict.type}`}>
      {/* 상세 내용 */}
    </article>
  ))}
</section>
```

---

## 5.5 로딩 상태 & 스켈레톤 화면 (Loading States & Skeleton Screens)

### 데이터 로딩 패턴

**초기 로딩 (페이지 진입 시)**
```
방식: 스켈레톤 화면 표시
시간: 1~2초

┌────────────────────────────┐
│ 생산일정 관리              │
├────────────────────────────┤
│ [████] [████] [████]       │ ← 필터 스켈레톤
├────────────────────────────┤
│ ┌──────────────────────┐   │
│ │ ████ ████ ████ ████ │   │ ← 카드 1
│ │ ████ ████          │   │
│ │ ████ ████ ████     │   │
│ └──────────────────────┘   │
│ ┌──────────────────────┐   │
│ │ ████ ████ ████ ████ │   │ ← 카드 2
│ │ ████ ████          │   │
│ │ ████ ████ ████     │   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

**폼 제출 중**
```
방식: 버튼에 로딩 스피너 표시
진행: 버튼 텍스트 변경 + 스피너

[저장 중...] ⟳   ← 버튼 비활성화
```

**API 응답 대기 중**
```
방식: 전체 페이지에 투명 오버레이 + 중앙 로딩 표시
용도: 사용자 상호작용 방지

┌────────────────────────────┐
│ ............. ............ │  ← 투명 오버레이
│ ...   ⟳ 검증 중...       ... │  ← 중앙 메시지
│ ............ ............. │
└────────────────────────────┘
```

### 스켈레톤 컴포넌트 구현
```typescript
// Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

// 테이블 스켈레톤
<div className="space-y-3">
  {Array(5).fill(0).map((_, i) => (
    <div key={i} className="flex gap-4 p-3 bg-gray-50 rounded">
      <Skeleton className="h-12 w-12" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  ))}
</div>

// 폼 스켈레톤
<div className="space-y-4">
  <Skeleton className="h-8 w-32 mb-4" />
  {Array(6).fill(0).map((_, i) => (
    <div key={i}>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-10 w-full" />
    </div>
  ))}
  <div className="flex gap-2 mt-6">
    <Skeleton className="h-10 w-24" />
    <Skeleton className="h-10 w-24" />
  </div>
</div>
```

### 로딩 상태 타이밍
```typescript
// React Query 패턴
const { data, isLoading, error, isFetching } = useQuery({
  queryKey: ['schedules'],
  queryFn: fetchSchedules,
});

// UI 상태 분기:
if (isLoading) {
  return <ScheduleListSkeleton />;  // 초기 로딩
}

if (error) {
  return <ErrorBoundary error={error} />;  // 에러 처리
}

if (data) {
  return (
    <div>
      {isFetching && <div className="opacity-50">갱신 중...</div>}
      <ScheduleList schedules={data} />
    </div>
  );
}
```

---

## 6. 구현 로드맵

### 6.1 웹개발자 구현 일정 (2026-05-29 ~ 2026-05-31)

| 날짜 | 작업 | 산출물 | 예상소요 |
|------|------|--------|---------|
| 5/29 | 페이지 구조 + 컴포넌트 기본틀 | app/harness/* + components/harness/* | 4시간 |
| 5/29 | HarnessDashboard + 대시보드 UI | HarnessDashboard.tsx | 2시간 |
| 5/30 | ScheduleForm + ScheduleList | 생산일정 CRUD | 4시간 |
| 5/30 | MaintenanceForm + MaintenanceList | 보전계획 CRUD | 4시간 |
| 5/31 | ValidationDetail + ConflictTimeline | 검증 결과 표시 | 3시간 |
| 5/31 | AuditLogTable + 통합테스트 | 감시 로그 + E2E 테스트 | 4시간 |

### 6.2 컴포넌트별 구현 순서
```
Phase 1 (우선순위 높음): 핵심 CRUD
├── ScheduleForm + ScheduleList
├── MaintenanceForm + MaintenanceList
└── 공통: StatusBadge, DatePicker, etc.

Phase 2 (우선순위 중간): 검증 & 분석
├── ValidationDetail
├── ConflictTimeline
└── RecommendationPanel

Phase 3 (우선순위 낮음): 부가 기능
├── HarnessDashboard (요약 통계)
├── AuditLogTable
└── 고급 필터 & 정렬
```

---

## 7. 검증 체크리스트 (웹개발자용)

- [ ] 모든 TypeScript 타입이 `lib/harness/types.ts`에서 import되었는가
- [ ] Zod 스키마 검증이 폼 제출 시 적용되었는가
- [ ] API 에러 메시지가 한국어로 사용자에게 표시되는가
- [ ] 모바일 환경에서 반응형 레이아웃이 작동하는가
- [ ] 로딩 상태 (스켈레톤, 스피너)가 표시되는가
- [ ] 에러 메시지와 성공 메시지가 토스트로 표시되는가
- [ ] 접근성: 폼 라벨, 색상 대비, 키보드 네비게이션이 있는가
- [ ] 충돌 시각화 (ConflictTimeline)가 명확하게 작동하는가
- [ ] 감시 로그는 관리자만 볼 수 있는가 (RLS 확인)
- [ ] 성능: 1000개 이상의 레코드를 로드할 때 페이지 느려지지 않는가

---

## 8. 설계 승인 기준

✅ **완료:**
- [x] 페이지 라우팅 구조 정의
- [x] 컴포넌트 아키텍처 설계
- [x] 상태 관리 패턴 정의
- [x] API 통합 방식 명시
- [x] 구현 로드맵 수립

🚀 **웹개발자 준비 완료**
- 백엔드 API 엔드포인트 명세 ✅ (harness.ts + 003_harness_phase2.sql)
- UI 컴포넌트 구조 ✅ (본 문서)
- 실제 개발에 필요한 모든 타입 정의 ✅

---

**다음 단계:** 웹개발자 2026-05-29 10:00 KST Kickoff 시작

