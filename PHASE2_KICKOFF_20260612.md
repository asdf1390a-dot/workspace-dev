---
name: Phase 2 API Development Kickoff (2026-06-12 21:35 KST)
description: Expense Master db/52 migration execution + API development coordination
type: project_status
---

# 🚀 Phase 2 API 개발 킥오프 (2026-06-12 21:35 KST)

## 📊 현황 요약

| 항목 | 상태 | 진행률 |
|------|------|--------|
| **Expense Master 설계** | ✅ 완료 | 100% (5개 문서) |
| **db/52 마이그레이션** | ✅ 완료 | 100% (커밋됨) |
| **4월 경비 분석** | ✅ 완료 | 100% (정규화 단계 명시) |
| **db/52 Supabase 실행** | 🔴 대기 | USER ACTION REQUIRED |
| **Phase 2 API 개발** | ⏳ 준비중 | 0% (db/52 후 시작) |

---

## 🎯 즉시 필요한 액션 (URGENT — 1시간 내)

### 1️⃣ Supabase에서 db/52 마이그레이션 실행

**파일 위치:** `/home/jeepney/projects/dsc-fms-portal/db/52_expense_master_module.sql`

**실행 방법:**
1. Supabase 대시보드 → SQL Editor (https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql)
2. 파일 전체 내용 복사 (약 600줄)
3. SQL Editor에 붙여넣기 및 **실행**
4. 완료 확인: 아래 검증 쿼리 5개 실행

**검증 쿼리 (db/52 하단에 포함):**
```sql
-- 검증 1: 6테이블 생성 확인
SELECT tablename FROM pg_tables 
WHERE schemaname='public' AND tablename LIKE 'expense_%' 
ORDER BY tablename;

-- 검증 2: 초기 20개 코드 확인
SELECT COUNT(*) as master_codes FROM public.expense_master;

-- 검증 3: 파티션 구조 확인
SELECT inhrelname FROM pg_inherits WHERE inhparent='public.expense_ledgers'::regclass;

-- 검증 4: RLS 정책 확인
SELECT policyname FROM pg_policies WHERE tablename LIKE 'expense_%';

-- 검증 5: 트리거 확인
SELECT tgname FROM pg_trigger WHERE tgrelid='public.expense_ledgers'::regclass;
```

**예상 실행 시간:** 2-3분

---

## 📋 Phase 2 API 개발 — 14개 엔드포인트

**시작 시점:** db/52 실행 직후  
**담당:** Web-Builder #2  
**예상 소요:** 29시간 (2026-06-18 마감)

### API 엔드포인트 목록 (상세 명세는 EXPENSE_MASTER_IMPLEMENTATION_NOTES.md 참조)

| # | 엔드포인트 | 메서드 | 기능 | 우선순위 |
|---|-----------|--------|------|--------|
| 1 | `/api/expenses/master` | GET | 경비 코드 목록 | P0 |
| 2 | `/api/expenses/ledger` | GET | 거래 대장 조회 (필터/페이지) | P0 |
| 3 | `/api/expenses/ledger` | POST | 거래 입력 (DRAFT) | P1 |
| 4 | `/api/expenses/ledger/:id` | PATCH | 거래 수정 (DRAFT) | P1 |
| 5 | `/api/expenses/ledger/:id` | DELETE | 거래 삭제 (DRAFT) | P2 |
| 6 | `/api/expenses/ledger/:id/approve` | POST | 승인 (FINAL) | P0 |
| 7 | `/api/expenses/validation` | GET | 검증 규칙 상태 | P1 |
| 8 | `/api/expenses/kpi` | GET | 월별 KPI 조회 | P1 |
| 9 | `/api/expenses/import` | POST | CSV 배치 입수 | P2 |
| 10 | `/api/expenses/export` | GET | Excel 내보내기 | P2 |
| 11 | `/api/expenses/audit` | GET | 감사 로그 | P2 |
| 12 | `/api/expenses/search` | GET | 고급 검색 | P2 |
| 13 | `/api/expenses/dashboard` | GET | 대시보드 데이터 | P1 |
| 14 | `/api/expenses/notifications` | GET | 검증 알림 | P1 |

**개발 순서:** P0 (4개) → P1 (5개) → P2 (5개)

---

## 🗂️ 컴포넌트 구조 (11개 React 컴포넌트)

| # | 컴포넌트 | 경로 | 상태 |
|---|---------|------|------|
| 1 | ExpenseLayout | `/components/expense/` | 준비중 |
| 2 | ExpenseMasterTable | `/components/expense/master/` | 준비중 |
| 3 | ExpenseForm | `/components/expense/form/` | 준비중 |
| 4 | ExpenseValidator | `/components/expense/validator/` | 준비중 |
| 5 | ExpenseKPICard | `/components/expense/kpi/` | 준비중 |
| 6 | ExpenseDashboard | `/pages/expenses/` | 준비중 |
| 7 | ExpenseImportWizard | `/components/expense/import/` | 준비중 |
| 8 | ExpenseAuditLog | `/components/expense/audit/` | 준비중 |
| 9 | ValidationRulePanel | `/components/expense/rules/` | 준비중 |
| 10 | ExpenseTrendChart | `/components/expense/charts/` | 준비중 |
| 11 | NotificationBell | `/components/expense/notifications/` | 준비중 |

---

## 📚 필수 참고 문서

### 설계 문서 (읽기 용도)
- ✅ **EXPENSE_MASTER_DESIGN_SPECIFICATION.md** (45KB)
  - 6테이블 DDL (IF NOT EXISTS)
  - 18개 인덱스 + 18개 RLS정책 + 2개 트리거
  - 14개 API 상세 명세
  - 11개 컴포넌트 계층도

- ✅ **EXPENSE_MASTER_IMPLEMENTATION_NOTES.md** (104KB)
  - TypeScript 스켈레톤 + 완전 구현 예시
  - 5가지 검증 규칙 코드
  - 모바일 반응형 UI 코드
  - User 권한 함수 9개
  - Slack 통합 예시

- ✅ **EXPENSE_MASTER_QUICK_REFERENCE.md**
  - 6테이블 한눈에 보기
  - 14+3개 API 목록
  - 11개 컴포넌트 목록
  - 7가지 검증 규칙 요약

### 데이터 분석 문서 (입수 준비)
- ✅ **APRIL_EXPENSE_DATA_ANALYSIS.md**
  - 파일별 구조 및 통계
  - 품질 이슈 분류 (Critical/Medium/Low)
  - 입수 준비도 판정
  - 8단계 정규화 절차

---

## 🔧 기술 스택 확정

| 항목 | 선택 | 근거 |
|------|------|------|
| **Router** | Pages Router (JS) | 기존 프로젝트 호환성 |
| **언어** | TypeScript | 타입 안정성 |
| **DB Slot** | **db/52** | 이미 생성됨 (파일 확인) |
| **FK 연결** | asset_master/productivity | 설계상 soft reference (app validation) |
| **UI Framework** | Tailwind CSS | 기존 스타일 일관성 |
| **상태관리** | Zustand + React Context | 경량 & 간단 |
| **검증** | 7가지 규칙 (app-level) | 비즈니스 로직 분리 |

---

## 📈 마일스톤 & 일정

### Phase 2A: Core APIs (P0 + P1) — 14시간
**담당:** Web-Builder #2  
**시작:** 2026-06-13 (내일)  
**완료:** 2026-06-15 18:00  
**성과물:** 9개 API + 기본 UI 스켈레톤

### Phase 2B: Advanced Features (P2) — 10시간
**담당:** Web-Builder #2  
**시작:** 2026-06-16  
**완료:** 2026-06-17 18:00  
**성과물:** CSV/Excel, 감사로그, 고급검색

### Phase 2C: Testing + Polish — 5시간
**담당:** Web-Builder #2 + QA  
**시작:** 2026-06-18  
**완료:** 2026-06-18 18:00 (DEADLINE) ✅  
**성과물:** 테스트 통과, 배포 준비

---

## 🔐 보안 & 권한

### RLS 정책 (db/52에서 자동 생성)
- `expense_ledgers_read` — 현재월+FINAL 상태만 읽기
- `expense_ledgers_write` — DRAFT 상태 & created_by 본인만 수정
- `expense_ledgers_delete` — DRAFT 상태 & created_by 본인만 삭제
- `expense_validation_read` — 모든 사용자 읽기
- `expense_master_read` — 모든 사용자 읽기

### User 메타데이터 권한 함수 (app-level)
```typescript
// IMPLEMENTATION_NOTES.md 참고:
- hasExpenseReadPermission(user) — 조회권
- hasExpenseWritePermission(user) — 입력권
- hasExpenseApprovePermission(user) — 승인권
- hasExpenseAdminPermission(user) — 관리권
```

---

## ⚠️ 주의사항

### 1. 파티션 관리
- `expense_ledgers`는 LIST 파티션 (period_month 기준)
- 월말마다 다음달 파티션 자동 생성 (트리거)
- 12개월 이상 과거 데이터는 보관 파티션으로 이월

### 2. 검증 규칙
- 7가지 규칙은 **app-level**에서 구현 (DB trigger와 별개)
- 규칙별 threshold는 IMPLEMENTATION_NOTES.md 참고
- 예: TALLY_DIFF (±5%), PLAN_EXCEED (110%), etc.

### 3. dcmi_code 참조
- `assets` 테이블의 dcmi_code와 매칭
- FK 없음 (soft reference) — app에서 validation 필요
- 누락 시 NULL 허용 (소모품 항목은 dcmi_code 없음)

### 4. 다국어 UI
- 영어/타밀어/한국어 지원
- i18n 설정: `expense_master.code_name_*` 컬럼 활용
- Tailwind 반응형: mobile 먼저 설계 (md: breakpoint)

---

## 📊 현재 조직 상태

| 항목 | 값 |
|------|-----|
| **P1 완료도** | 100% (4/4 ✅) |
| **Phase 3 평균** | 64% (Asset 45%, Cost 35%, Team 40%) |
| **신뢰도** | 96% ⬆️ |
| **Vercel HTTP** | 200 OK (91h+ 연속) |
| **팀 활용률** | 82% (11명) |
| **블로커** | 2건 (Critical 0) |

---

## ✅ 체크리스트 (개발자용)

- [ ] db/52 마이그레이션 Supabase 실행 완료
- [ ] 5개 검증 쿼리 실행 및 테이블 생성 확인
- [ ] EXPENSE_MASTER_IMPLEMENTATION_NOTES.md 정독 (TypeScript 예시)
- [ ] `/app/api/expenses/` 디렉토리 생성
- [ ] P0 API 4개 개발 시작 (2026-06-13)
- [ ] UI 컴포넌트 스켈레톤 작성
- [ ] 검증 규칙 함수 7개 구현
- [ ] RLS 정책 동작 확인 (테스트 쿼리)
- [ ] Slack 통합 설정 (optional)
- [ ] Vercel 배포 + E2E 테스트

---

## 🎯 다음 단계

### 즉시 (1시간 내)
1. db/52 마이그레이션 Supabase 실행
2. 5개 검증 쿼리 실행 확인

### 오늘 (6시간 내)
1. Web-Builder #2 Phase 2 API 개발 시작 신호
2. 기본 API 스켈레톤 생성

### 내일 (2026-06-13)
1. P0 API 4개 개발
2. 기본 UI 페이지 (ExpenseLayout, ExpenseMasterTable)

### 이번주 (2026-06-18 마감)
1. P1, P2 API 개발
2. 전체 UI 컴포넌트 완성
3. 검증 규칙 구현
4. E2E 테스트 & 배포

---

**상태:** 🟢 **READY FOR PHASE 2**  
**마감:** 2026-06-18 18:00 (5일 6시간)  
**담당:** Web-Builder #2  
**모니터:** 1시간 주기 자동 업데이트

