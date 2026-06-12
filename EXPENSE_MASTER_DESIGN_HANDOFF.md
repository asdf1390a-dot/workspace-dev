---
name: Expense Master 설계 → 개발 인계서
description: 웹개발자에게 설계 완료 보고 및 인계
type: handoff_report
version: 1.0
created: 2026-06-12 17:30 KST
status: READY_FOR_HANDOFF
---

# Expense Master 설계 완료 인계서

## 🎯 인계 현황

| 항목 | 상태 | 파일 경로 |
|------|------|---------|
| **종합 설계서** | ✅ 완료 | `/EXPENSE_MASTER_DESIGN_SPECIFICATION.md` |
| **구현 노트** | ✅ 완료 | `/EXPENSE_MASTER_IMPLEMENTATION_NOTES.md` |
| **빠른 참조** | ✅ 완료 | `/EXPENSE_MASTER_QUICK_REFERENCE.md` |
| **DB 스키마** | 설계 완료 | db/48_expense_master_module.sql (개발자 작성) |
| **API 명세** | 설계 완료 | 14개 엔드포인트 상세 스펙 |
| **컴포넌트 구조** | 설계 완료 | 11개 React 컴포넌트 |
| **프롬프트 5-1** | 대기 | (프롬프트 제공자와 협력) |
| **프롬프트 5-3** | 대기 | (프롬프트 제공자와 협력) |

---

## 📋 설계 범위 (완료)

### 1. 비즈니스 요구사항 분석 ✅

**파일 양식:** 20개 고정 (R&M 7개, 소모품 1개, 부자재 5개, 전력 1개, 검증/운영 6개)  
**코드 체계:** 1.1 ~ 4.1 (대분류.소분류)  
**거래 대장 템플릿:** 16개 컬럼 (NO, DATE, MAIN CAT, MACHINE CODE, DCMI ... SUPPLIER)  
**월별 사이클:** 파일 입수 → 정규화 → 검증 → 승인 → DB UPSERT → 트리 갱신  
**생산성 보고서 연계:** 원단위 KPI (가스/코일/그리스/전력 소비 per unit)

### 2. 데이터베이스 설계 ✅

**6개 테이블:**
- `expense_master` — 경비 코드 마스터 (20개)
- `expense_ledgers` — 월별 거래 대장 (파티션: period_month)
- `expense_validation` — 검증 규칙 결과
- `expense_history_drift` — 과거月 변경 감지
- `expense_kpi` — KPI 캐시 (월별 집계)
- [선택] `expense_audit_log` — 감사 로그

**12개 인덱스:** period_month, expense_code, transaction_date, dcmi_code, status 등  
**5개 RLS 정책:** 읽기(현재月+FINAL), 쓰기(DRAFT+created_by), 삭제(DRAFT)  
**2개 트리거:** update_expense_kpi, detect_history_drift

### 3. API 설계 (14개 + 3개 검증) ✅

**거래 CRUD (6개):**
- GET /api/expense/ledgers (월별 조회, 필터, 페이지네이션)
- POST /api/expense/ledgers (입수)
- PUT /api/expense/ledgers/:id (편집, DRAFT만)
- DELETE /api/expense/ledgers/:id (삭제, DRAFT만)
- PATCH /api/expense/ledgers/:id/submit (상태 변경)
- PATCH /api/expense/ledgers/:id/approve (승인)

**마스터 (2개):**
- GET /api/expense/master
- GET /api/expense/master/:code

**검증 (3개, 프롬프트 5-3):**
- POST /api/expense/validate (7가지 규칙 실행)
- GET /api/expense/validate/:month
- POST /api/expense/validate/:validationId/approve

**분석 (3개):**
- GET /api/expense/kpi
- GET /api/expense/report/monthly
- GET /api/expense/report/yearly

### 4. UI/UX 설계 ✅

**11개 React 컴포넌트:**
- ExpenseTreeView (좌측 트리)
- ExpenseTransactionList (중앙 거래 리스트)
- TransactionTable, FilterBar (리스트 상세)
- ValidationPanel, ValidationRuleItem (우측 검증)
- AnalysisPanel, MonthlyChart, KPICard (분석 뷰)
- FileUploadForm, HistoryDriftModal (모달)

**4개 페이지:**
- /expense (메인 대시보드)
- /expense/upload (파일 업로드 & 프롬프트 5-1)
- /expense/analysis (분석 뷰)
- /expense/drift-approvals (과거月 변경 승인)

### 5. 검증 규칙 7가지 ✅

```
1. TALLY_DIFF — Tally ERP 차이 (△ > 1,000 INR)
2. PLAN_EXCEED — 계획 초과 (△ > 15%)
3. INVENTORY_MISMATCH — 재고 항등식 (오차 > 기말 2%)
4. RECEIPT_CONTINUITY — 검침 연속성 (시간갭 > 2h)
5. LEDGER_TOTAL — 대장 합계 대조 (오차 > 500 INR)
6. PURCHASE_LINK — 구매 연동 (거래日 ≤ 사용日 ≤ +30일)
7. DOCUMENT_COMPLETENESS — 서류 완결 (Invoice+PO+Receipt)
```

### 6. 역사 데이터 보호 ✅

**과거月 변경 감지 플로우:**
- 사용자 UPDATE 시도 → period_month < NOW() 확인
- expense_history_drift 레코드 삽입 (approval_required=true)
- 변경 차단 (RLS + 트리거)
- 관리자 승인 대기 페이지 (/expense/drift-approvals)
- 승인/거절 후 COMMIT/ROLLBACK

### 7. 통합 테스트 케이스 ✅

**9개 시나리오:**
1. 정상 월별 거래 입수 & 검증
2. 월간 보고서 생성
3. DCMI 코드 미일치
4. 날짜 형식 오류 (자동 수정)
5. 계획 초과 경고 & 승인
6. 과거月 거래 편집 (승인 플로우)
7. 다중 과거月 변경 + 일괄 승인
8. 대량 거래 입수 (1,000행+)
9. 트리 렌더링 (36개월 × 20개 코드)

---

## 🎨 설계 원칙 (적용 완료)

| 원칙 | 구현 |
|------|------|
| **모바일 퍼스트** | 트리/리스트/검증을 탭으로 전환 |
| **영어 + 타밀어** | expense_master (code_name_en, code_name_ta, code_name_ko) |
| **단순 UI** | 트리 + 리스트 + 검증 패널 3가지 영역 |
| **Supabase 연동** | 모든 데이터 Postgres 저장 |
| **기존 스타일 유지** | Team Dashboard와 동일한 UI 패턴 |

---

## 📊 예상 구현 일정

| Phase | 작업 | 공수 | 마감 | 상태 |
|-------|------|------|------|------|
| **1** | DB 마이그레이션 | 2h | 2026-06-13 12:00 | 🔄 개발 시작 |
| **2** | API 엔드포인트 14개 | 10h | 2026-06-14 18:00 | 🔄 |
| **3** | React 컴포넌트 11개 | 8h | 2026-06-15 18:00 | 🔄 |
| **4** | 검증 규칙 엔진 (프롬프트 5-3) | 3h | 2026-06-16 12:00 | ⏳ 대기 |
| **5** | 통합 테스트 9개 케이스 | 4h | 2026-06-16 18:00 | 🔄 |
| **6** | 배포 & 최적화 | 2h | 2026-06-18 18:00 | 🔄 |
| **합계** | | **29h** | **2026-06-18 18:00** | |

---

## 📁 제공 파일 (3개 설계서)

### 1. EXPENSE_MASTER_DESIGN_SPECIFICATION.md
**용도:** 전체 설계 문서 (마스터)  
**내용:**
- 프로젝트 개요 (목표, 범위, 마감)
- 비즈니스 요구사항 (파일양식, 코드체계, 월별사이클)
- DB 스키마 (6개 테이블, 인덱스, RLS, 트리거)
- API 명세 (14개 엔드포인트, 요청/응답 예시)
- UI/UX 설계 (컴포넌트 계층도, 4개 페이지)
- 검증 규칙 7가지
- 역사 데이터 보호 로직
- 통합 테스트 7가지 케이스 (Happy Path, 에러 처리, Performance)
- 참고 문서

**페이지:** ~200줄

### 2. EXPENSE_MASTER_IMPLEMENTATION_NOTES.md
**용도:** 웹개발자 구현 가이드  
**내용:**
- Phase 1: DB 마이그레이션 (SQL 파일, 테이블, 인덱스, RLS, 초기데이터)
- Phase 2: API 엔드포인트 구현 (6개 거래 CRUD, 8개 마스터/검증/분석)
- Phase 3: React 컴포넌트 구현 (11개, 구현 순서, 스켈레톤 코드)
- Phase 4: 검증 규칙 엔진 (프롬프트 5-3, 옵션 A/B)
- 프롬프트 5-1/5-3 구현 방식 (TypeScript vs RPC)
- 보안 체크리스트 (RLS, 권한, 입력검증, XSS, 감사로그)
- 3가지 통합 테스트 시나리오 (매우 상세)
- 엣지 케이스 7가지 처리법
- 배포 & 최적화 체크리스트

**페이지:** ~350줄

### 3. EXPENSE_MASTER_QUICK_REFERENCE.md
**용도:** 개발자용 한눈에 보기  
**내용:**
- DB 테이블 요약 (6개)
- API 엔드포인트 목록 (14개 + 3개)
- React 컴포넌트 목록 (11개)
- RLS 정책 (5개)
- 검증 규칙 7가지 (표 형식)
- 구현 순서 (6 Phase)
- 파일 구조 (한눈에)
- 핵심 코드 스니펫 (5가지)
- 주의사항

**페이지:** ~1-2매

---

## 🔗 다음 단계 (웹개발자에게)

### 즉시 시작 (Today)
```
1. EXPENSE_MASTER_QUICK_REFERENCE.md 훑어보기 (10분)
2. EXPENSE_MASTER_DESIGN_SPECIFICATION.md 전체 읽기 (30분)
3. 설계서 기반 프로젝트 구조 생성 (1시간)
   ├─ db/48_expense_master_module.sql 파일 생성
   ├─ app/expense/ 폴더 생성
   ├─ app/api/expense/ 폴더 생성
   └─ components/expense/ 폴더 생성
4. types/expense.ts (TypeScript 인터페이스) 작성
```

### Phase 1: DB 마이그레이션 (2h)
```
1. EXPENSE_MASTER_IMPLEMENTATION_NOTES.md의 "Phase 1" 섹션 읽기
2. db/48_expense_master_module.sql 작성
   ├─ 테이블 6개 CREATE
   ├─ 인덱스 12개 CREATE
   ├─ RLS 정책 5개 CREATE
   ├─ 트리거 2개 CREATE
   └─ 초기 데이터 INSERT (expense_master 20개 코드)
3. Supabase 대시보드에서 SQL 실행 (또는 migration CLI)
4. 테이블 검증 쿼리 실행
```

### Phase 2: API 구현 (10h)
```
1. GET /api/expense/ledgers 구현
2. POST /api/expense/ledgers 구현 (정규화 함수 포함)
3. PUT, DELETE, PATCH 구현
4. /api/expense/master/* 구현
5. /api/expense/validate/* 구현 (프롬프트 5-3 대기)
6. /api/expense/kpi, /report/* 구현
7. 모든 API Postman/Thunder Client로 테스트
```

### Phase 3: React 컴포넌트 (8h)
```
1. ExpenseTreeView 구현
2. TransactionTable + FilterBar 구현
3. ValidationPanel 구현
4. AnalysisPanel (KPI 카드, 차트) 구현
5. FileUploadForm 구현
6. HistoryDriftModal 구현
7. 4개 페이지 (layout, 메인, upload, analysis, drift-approvals) 구현
```

### Phase 4: 검증 규칙 & 프롬프트 (3h)
```
1. 프롬프트 5-3 제공자와 협력
2. 7가지 규칙 로직 TypeScript로 구현
3. /api/expense/validate 엔드포인트에 통합
4. 단위 테스트 (각 규칙마다)
```

### Phase 5: 통합 테스트 (4h)
```
1. 9개 시나리오 매뉴얼 테스트
2. API 응답 검증
3. DB 데이터 검증
4. RLS 정책 테스트 (권한별)
5. 엣지 케이스 테스트
```

### Phase 6: 배포 (2h)
```
1. Vercel 배포 (git push)
2. 배포 후 E2E 테스트
3. 성능 모니터링 (응답시간, 쿼리 성능)
4. Sentry 에러 모니터링 설정
```

---

## ⚠️ 중요 주의사항

### 프롬프트 5-1, 5-3 (외부 의존)
- **프롬프트 5-1:** 엑셀 입수/정규화 로직 (날짜, 수치, 객체 정규화)
- **프롬프트 5-3:** 검증 게이트 (7가지 규칙 실행)
- 현재 설계는 두 프롬프트의 입출력 인터페이스만 정의
- 프롬프트 제공자와 협력하여 로직 통합 필요

### 역사 데이터 보호
- 과거月 쓰기 금지 (RLS + 트리거)
- 변경 감지 후 관리자 승인 필수
- 복잡한 로직이므로 테스트 철저히

### 생산성 보고서 연계
- expense_ledgers (YYYY-MM) + productivity_reports (YYYY-MM) JOIN
- 원단위 KPI 자동 계산 (설계는 완료, 구현은 웹개발자)
- Supabase JOIN 쿼리 최적화 필수

---

## 📞 Q&A

**Q: 프롬프트 5-1/5-3이 없으면 개발 진행이 불가능한가?**  
A: 아니다. API 엔드포인트 구조는 독립적으로 구현 가능. 프롬프트는 POST /api/expense/validate 로직 부분만 영향. 일단 스켈레톤 구현 후, 프롬프트 제공되면 통합.

**Q: 과거月 변경 감지가 복잡해 보인다.**  
A: 맞다. 하지만 RLS 정책 + 트리거가 자동으로 처리. 웹개발자는 approval 승인/거절 API만 구현하면 됨.

**Q: 원단위 KPI 계산은?**  
A: 설계서 1-4절에 공식 기술. 구현은 /api/expense/kpi 엔드포인트에서 `(expense.total / production_volume)` 계산하고, expense_kpi 테이블에 캐시.

**Q: 대량 데이터 (1,000행+) 성능은?**  
A: 배치 처리 (500행씩) + 인덱스 + 파티션으로 해결. 설계서 3-2절 참고.

---

## 🎯 성공 기준

```
✅ DB 마이그레이션 완료 (Supabase 검증)
✅ API 14개 모두 구현 & 테스트 (Postman)
✅ React 11개 컴포넌트 렌더링 (localhost:3000/expense)
✅ 검증 규칙 7가지 모두 작동
✅ 통합 테스트 9개 시나리오 통과
✅ Vercel 배포 (HTTP 200)
✅ 응답 시간 < 3초
✅ RLS 정책 검증 완료
✅ 감사 로그 기록 확인
✅ 사용자 피드백 긍정적
```

---

## 📞 지원

- **설계 문의:** Web App Designer / Planner
- **아키텍처 검토:** Data Analyst AI
- **프롬프트 협력:** 프롬프트 제공자

---

## 📊 최종 체크리스트

| 항목 | 상태 |
|------|------|
| 설계서 3개 작성 | ✅ |
| DB 스키마 설계 | ✅ |
| API 14개 명세 | ✅ |
| UI 컴포넌트 설계 | ✅ |
| 검증 규칙 7가지 | ✅ |
| 역사 보호 로직 | ✅ |
| 통합 테스트 케이스 | ✅ |
| 파일 구조 정의 | ✅ |
| 구현 가이드 제공 | ✅ |
| 웹개발자 인계 준비 | ✅ |

---

**설계 완료일:** 2026-06-12 17:30 KST  
**담당자:** Web App Designer / Planner  
**상태:** 🟢 **READY_FOR_HANDOFF**  
**다음 담당자:** web-builder (개발 시작)

---

# 🎉 설계 완료!

웹개발자님께,

DSC Mannur 경비 관리 모듈의 설계가 완료되었습니다.

**제공된 문서:**
1. **EXPENSE_MASTER_DESIGN_SPECIFICATION.md** — 전체 설계 (200줄+)
2. **EXPENSE_MASTER_IMPLEMENTATION_NOTES.md** — 구현 가이드 (350줄+)
3. **EXPENSE_MASTER_QUICK_REFERENCE.md** — 빠른 참조 (2매)

**설계 범위:**
- 6개 테이블, 12개 인덱스, 5개 RLS 정책, 2개 트리거
- 14개 API 엔드포인트 (상세 요청/응답)
- 11개 React 컴포넌트 (계층도 & 스켈레톤 코드)
- 7가지 검증 규칙 (명확한 로직)
- 9개 통합 테스트 시나리오

**예상 공수:** 29시간 (2026-06-13 ~ 2026-06-18)

**시작 단계:**
1. QUICK_REFERENCE 읽기 (10분)
2. DESIGN_SPECIFICATION 정독 (30분)
3. IMPLEMENTATION_NOTES 따라 개발 시작

**프롬프트 5-1, 5-3은 별도로 제공되면 통합하면 됩니다.**

행운을 빕니다! 🚀

---
