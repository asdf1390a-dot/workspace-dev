# Harness Engineering Phase 2 — 웹개발자 Kickoff 체크리스트
**2026-05-29 10:00 KST 개발 시작**

---

## 📋 Phase 2 Overview

| 항목 | 상태 | 설명 |
|------|------|------|
| **백엔드 설계** | ✅ 완료 | TypeScript 스키마 + DB 마이그레이션 |
| **UI 설계** | ✅ 완료 | 페이지 구조 + 컴포넌트 아키텍처 |
| **API 명세** | ✅ 완료 | /api/harness/* 엔드포인트 (아직 미구현) |
| **개발 기간** | 📅 2026-05-29 ~ 2026-05-31 | 3일, 총 21시간 |

---

## 🚀 개발 시작 전 준비

### 1️⃣ 필수 문서 읽기
- [ ] `HARNESS_ENGINEERING_PHASE2_DESIGN.md` — 백엔드 설계 (TypeScript 타입, DB 스키마)
- [ ] `HARNESS_ENGINEERING_PHASE2_UI_DESIGN.md` — UI/컴포넌트 설계 (이 문서 읽기)
- [ ] `dsc-fms-portal/lib/schemas/harness.ts` — Zod 검증 스키마 (실제 코드)
- [ ] `dsc-fms-portal/migrations/003_harness_phase2.sql` — DB 마이그레이션 (실제 코드)

### 2️⃣ 개발 환경 확인
```bash
# dsc-fms-portal 디렉토리에서:
npm install                    # 의존성 설치
npm run dev                    # 개발 서버 시작 (localhost:3000)
npm run test                   # 테스트 (기존 테스트 확인)
npm run lint                   # 린트 체크
```

### 3️⃣ 프로젝트 구조 파악
```
dsc-fms-portal/
├── app/harness/              # 우리가 만들 페이지 (아직 미생성)
├── components/harness/       # 우리가 만들 컴포넌트 (COMPONENT_TEMPLATES.tsx 참고)
├── lib/schemas/harness.ts    # 기존 Zod 스키마 (수정 금지, import만 사용)
├── migrations/               # DB 마이그레이션 (수정 금지)
└── api/harness/              # 백엔드 API 엔드포인트 (아직 미구현)
```

### 4️⃣ 브랜치 전략
```bash
# 현재 브랜치 확인
git status

# Harness P2 UI 구현용 브랜치는 main 기반
git checkout main
git pull origin main

# 개발 중 주요 커밋 메시지 형식
# feat(harness-ui): ScheduleForm, ScheduleList 컴포넌트 구현
# feat(harness-ui): ValidationDetail 페이지 + ConflictTimeline 시각화
```

---

## 📝 개발 일정 & 작업 분담

### 📅 Day 1: 2026-05-29 (목요일)
**목표:** 페이지 라우팅 + 기본 컴포넌트 구현  
**예상:** 6시간 (10:00-16:00, 1시간 점심)

| 시간 | 작업 | 산출물 | 체크 |
|------|------|--------|------|
| 10:00-11:00 | Kickoff + 환경 설정 | 개발 환경 준비 | - |
| 11:00-13:00 | 페이지 구조 + 레이아웃 (HarnessLayout) | app/harness/layout.tsx | - |
| 13:00-14:00 | 점심 | - | - |
| 14:00-16:00 | 대시보드 페이지 (HarnessDashboard) | app/harness/page.tsx | - |
| 16:00-17:00 | 공용 컴포넌트 (StatusBadge, ConflictBadge) | components/harness/shared/* | - |

**Day 1 완료 기준:**
- [ ] `app/harness/layout.tsx` 생성 + 네비게이션 작동
- [ ] `app/harness/page.tsx` 생성 + 기본 대시보드 표시
- [ ] 공용 컴포넌트 4개 구현 (StatusBadge, ConflictBadge, DatePicker, TimePicker)
- [ ] 페이지 반응형 레이아웃 확인

### 📅 Day 2: 2026-05-30 (금요일)
**목표:** 생산일정 & 보전계획 CRUD  
**예상:** 8시간 (10:00-18:00, 1시간 점심)

| 시간 | 작업 | 산출물 | 체크 |
|------|------|--------|------|
| 10:00-12:00 | ScheduleForm 컴포넌트 | components/harness/schedule/ScheduleForm.tsx | - |
| 12:00-13:00 | ScheduleList 컴포넌트 | components/harness/schedule/ScheduleList.tsx | - |
| 13:00-14:00 | 점심 | - | - |
| 14:00-16:00 | 생산일정 페이지 (list, create, [id]) | app/harness/schedule/* | - |
| 16:00-18:00 | 보전계획 CRUD (MaintenanceForm, List) | components/harness/maintenance/* | - |

**Day 2 완료 기준:**
- [ ] ScheduleForm: 입력값 검증 (Zod) + API 호출
- [ ] ScheduleList: 테이블 표시 + 필터 (시설, 상태, 날짜) + 정렬
- [ ] MaintenanceForm: 동일하게 구현
- [ ] MaintenanceList: 동일하게 구현
- [ ] 모든 폼에 에러 메시지 토스트 표시
- [ ] 생성/수정 후 자동 리다이렉트

### 📅 Day 3: 2026-05-31 (토요일)
**목표:** 검증 & 감시 로그 + 통합테스트  
**예상:** 7시간 (10:00-17:00, 1시간 점심)

| 시간 | 작업 | 산출물 | 체크 |
|------|------|--------|------|
| 10:00-11:30 | ValidationDetail 페이지 | app/harness/validation/[id]/page.tsx | - |
| 11:30-13:00 | ConflictTimeline 시각화 | components/harness/validation/ConflictTimeline.tsx | - |
| 13:00-14:00 | 점심 | - | - |
| 14:00-15:30 | AuditLogTable 페이지 | app/harness/audit-logs/page.tsx | - |
| 15:30-17:00 | 통합테스트 + 성능 최적화 | npm run test + 빌드 확인 | - |

**Day 3 완료 기준:**
- [ ] ValidationDetail: 충돌 목록 + 권장사항 표시
- [ ] ConflictTimeline: 생산일정 vs 보전계획 시간 시각화
- [ ] AuditLogTable: 감시 로그 조회 + 필터 + 페이지네이션
- [ ] E2E 테스트: 주요 워크플로우 검증
- [ ] 성능: 1000개 레코드 로드 < 2초
- [ ] 접근성: 모든 폼 라벨 + 키보드 네비게이션

---

## 🛠️ 기술 스택 & 라이브러리

### 필수
- **React 18**: 기존 프로젝트 사용
- **TypeScript**: 타입 안전성 (Zod 검증과 함께)
- **Zod**: 입력 검증 (클라이언트 + 서버)
- **Tailwind CSS**: 스타일링 (기존 설정 사용)

### 권장 추가
- **React Query (TanStack Query)**: 데이터 페칭 + 캐싱
  ```bash
  npm install @tanstack/react-query
  ```
- **React Hook Form**: 폼 상태 관리
  ```bash
  npm install react-hook-form
  ```
- **date-fns**: 날짜 포매팅
  ```bash
  npm install date-fns
  ```

### 이미 설치된 라이브러리
```json
{
  "next": "^14.x",
  "react": "^18.x",
  "typescript": "^5.x",
  "zod": "^3.x",
  "tailwindcss": "^3.x",
  "@supabase/supabase-js": "^2.x"
}
```

---

## 📦 API 통합 가이드

### API 클라이언트 구조
```typescript
// lib/harness/api-client.ts (새로 생성)
export const HarnessAPI = {
  schedules: {
    list: (filters?: any) => fetch('/api/harness/schedules?...'),
    get: (id: string) => fetch(`/api/harness/schedules/${id}`),
    create: (data) => fetch('/api/harness/schedules', { method: 'POST' }),
    update: (id, data) => fetch(`/api/harness/schedules/${id}`, { method: 'PATCH' }),
    delete: (id) => fetch(`/api/harness/schedules/${id}`, { method: 'DELETE' }),
  },
  // ... 동일하게 maintenance, validation, audit
};
```

### React Query Hook 패턴
```typescript
// lib/harness/hooks.ts (새로 생성)
export function useProductionSchedules(filters?: any) {
  return useQuery({
    queryKey: ['harness', 'schedules', filters],
    queryFn: () => HarnessAPI.schedules.list(filters),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => HarnessAPI.schedules.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harness', 'schedules'] });
    },
  });
}
```

### 에러 처리 예제
```typescript
try {
  const validated = ProductionScheduleSchema.parse(formData);
  const response = await HarnessAPI.schedules.create(validated);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '요청 실패');
  }
  showToast('저장되었습니다', 'success');
  router.push('/harness/schedule');
} catch (error) {
  if (error instanceof z.ZodError) {
    setErrors(flattenZodErrors(error));
  } else {
    showToast(error.message, 'error');
  }
}
```

---

## 🎨 UI 컴포넌트 구현 팁

### 1️⃣ 상태 배지 (StatusBadge)
```typescript
// 사용 예:
<StatusBadge status={schedule.status} />

// 출력:
// pending: "대기 중" (회색)
// approved: "승인됨" (녹색)
// rejected: "거부됨" (빨강)
// completed: "완료" (파랑)
```

### 2️⃣ 충돌 표시 (ConflictBadge)
```typescript
// 사용 예:
<ConflictBadge conflictStatus={schedule.conflict_status} />

// 출력:
// none: "✓ 없음"
// warning: "⚠️ 경고"
// conflict: "✗ 충돌"
```

### 3️⃣ 시간 충돌 시각화 (ConflictTimeline)
```typescript
// 시간축 그래프 표시
// 예:
// ─────────────────────────────────
// 생산:    |───────────────────|
// 보전:          |─────|
//          ^             ^
//          시작         종료
//
// 겹침: 2시간 (충돌)
```

### 4️⃣ 폼 검증 (Zod + React Hook Form)
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductionScheduleSchema } from '@/lib/schemas/harness';

export function ScheduleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ProductionScheduleSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('facility_id')} />
      {errors.facility_id && <p>{errors.facility_id.message}</p>}
    </form>
  );
}
```

---

## 🧪 테스트 & QA

### 단위 테스트
```bash
# 테스트 작성
npm test -- components/harness/ScheduleForm.test.tsx

# 테스트 내용:
# 1. 폼 렌더링 확인
# 2. 입력값 변경 확인
# 3. 검증 에러 메시지 표시 확인
# 4. API 호출 모킹 확인
```

### 통합테스트 (E2E)
```bash
# Playwright 또는 Cypress로 테스트
# 시나리오:
# 1. 생산일정 생성 → 성공
# 2. 보전계획 생성 → 성공
# 3. 검증 요청 → 충돌 감지 → 권장사항 표시
# 4. 감시 로그 조회 → 기록 확인
```

### 성능 테스트
```bash
# Lighthouse 또는 Web Vitals 측정
npm run build
npm start

# 체크 항목:
# - LCP (Largest Contentful Paint) < 2.5s
# - FID (First Input Delay) < 100ms
# - CLS (Cumulative Layout Shift) < 0.1
# - 1000개 레코드 테이블 로드 < 2초
```

### QA 체크리스트
- [ ] 모든 폼 필드가 필수 검증되는가
- [ ] 에러 메시지가 명확한가 (영어 아님)
- [ ] 모바일에서 폼이 쉽게 입력되는가
- [ ] 충돌 아이콘/색상이 명확한가
- [ ] 로딩 상태 (스켈레톤, 스피너)가 표시되는가
- [ ] 성공/실패 메시지가 토스트로 표시되는가
- [ ] 페이지네이션이 작동하는가 (테이블 > 100개 행)
- [ ] 필터가 정상적으로 작동하는가
- [ ] 권한 확인: 관리자만 audit-logs 접근 가능한가

---

## 🚨 주의사항

### ⚠️ 금지 사항
- [ ] `lib/schemas/harness.ts` 수정 금지 (백엔드와 동기화 필수)
- [ ] `migrations/003_harness_phase2.sql` 수정 금지 (이미 DB에 적용됨)
- [ ] API 엔드포인트 주소 변경 금지 (`/api/harness/*`)
- [ ] Zod 스키마 검증 스킵 금지 (모든 입력 검증 필수)

### ✅ 필수 사항
- [ ] 모든 에러 메시지는 **한국어**
- [ ] 모든 폼 필드에 label 태그
- [ ] 모든 토스트/알림은 react-toastify 사용
- [ ] 모든 API 호출은 React Query 사용 (caching 이점)
- [ ] 모든 타입은 `ProductionSchedule`, `MaintenancePlan` 등 import해서 사용

### 💡 권장 사항
- 작은 커밋 자주 (하루 4-5회)
- 테스트 커버리지 80% 이상 목표
- 빌드 성공 확인 후 커밋 (npm run build)
- 린트 경고 없음 확인 (npm run lint)

---

## 📞 연락처 & 지원

### 문제 발생 시
1. **내부 문제** (컴포넌트 구현, 타입 에러): 이 체크리스트 + `HARNESS_ENGINEERING_PHASE2_UI_DESIGN.md` 참고
2. **API 문제** (엔드포인트 미존재): Planner에 보고 → 백엔드 팀 동기화
3. **긴급**: Slack #harness-engineering 또는 직접 연락

### 자료
- UI 설계 상세: `HARNESS_ENGINEERING_PHASE2_UI_DESIGN.md`
- 백엔드 설계: `HARNESS_ENGINEERING_PHASE2_DESIGN.md`
- 컴포넌트 템플릿: `dsc-fms-portal/components/harness/COMPONENT_TEMPLATES.tsx`
- API 명세: (미구현, 백엔드 팀이 2026-05-28 완료 예정)

---

## ✅ 완료 기준

### Day 1 (2026-05-29) 완료 기준
```
□ 페이지 구조 및 네비게이션 작동
□ 대시보드 기본 레이아웃 완성
□ 공용 컴포넌트 4개 구현
□ 빌드 성공 (npm run build)
```

### Day 2 (2026-05-30) 완료 기준
```
□ 생산일정 CRUD (생성, 조회, 수정, 삭제)
□ 보전계획 CRUD (생성, 조회, 수정, 삭제)
□ 모든 폼 Zod 검증 적용
□ 필터 & 정렬 작동
```

### Day 3 (2026-05-31) 완료 기준
```
□ 검증 결과 상세 페이지 완성
□ 시간 충돌 시각화 완성
□ 감시 로그 페이지 완성
□ 통합테스트 통과 (최소 3개 시나리오)
□ 성능 최적화 완료
```

---

## 🎯 최종 검증 체크리스트

```
기술 요구사항:
□ TypeScript 타입 체크 에러 0개
□ ESLint 경고 0개
□ 테스트 커버리지 80% 이상
□ 빌드 크기 < 500KB (전체 JavaScript)
□ 성능 점수 Lighthouse 80점 이상

기능 요구사항:
□ 생산일정 생성/수정/삭제 작동
□ 보전계획 생성/수정/삭제 작동
□ 검증 요청 및 결과 표시 작동
□ 충돌 감지 시각화 명확함
□ 감시 로그 조회 작동

UX/UI 요구사항:
□ 모바일 반응형 레이아웃
□ 폼 입력 시간 < 2초
□ 테이블 로드 시간 < 2초 (1000개 행)
□ 에러 메시지 명확함 (한국어)
□ 폼 필드 라벨 완전함

접근성:
□ 색상 대비 WCAG AA 기준 통과
□ 키보드 네비게이션 작동
□ 스크린 리더 지원 (aria-label)
□ 폼 라벨 연결됨 (htmlFor)
```

---

**Kickoff 시작:** 2026-05-29 10:00 KST  
**예상 완료:** 2026-05-31 17:00 KST  
**총 개발 시간:** 21시간

화이팅! 🚀

