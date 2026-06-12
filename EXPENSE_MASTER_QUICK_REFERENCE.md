---
name: Expense Master 빠른 참조 가이드
description: 웹개발자용 단일 페이지 요약 (테이블, API 목록, 컴포넌트)
type: quick_reference
version: 1.0
created: 2026-06-12 17:30 KST
---

# Expense Master — 빠른 참조 가이드

---

## 📊 DB 테이블 요약 (6개)

| 테이블 | 용도 | 행 수 | 파티션 |
|--------|------|-------|--------|
| `expense_master` | 경비 코드 마스터 (20개) | ~20 | - |
| `expense_ledgers` | 월별 거래 대장 (실제 데이터) | 1,000~10,000/월 | LIST (period_month) |
| `expense_validation` | 검증 규칙 결과 | 7/월 | - |
| `expense_history_drift` | 과거月 변경 감지 | 0~50/월 | - |
| `expense_kpi` | KPI 캐시 (월별 집계) | 20/월 | - |
| `expense_audit_log` (선택) | 감사 로그 | 100+/월 | - |

---

## 📋 API 엔드포인트 (14개 + 3개)

### 거래 대장 (CRUD)
```
GET    /api/expense/ledgers?month=YYYY-MM&code=1.1&status=DRAFT&page=1&page_size=20
POST   /api/expense/ledgers (파일 업로드 후)
PUT    /api/expense/ledgers/:id (DRAFT만)
DELETE /api/expense/ledgers/:id (DRAFT만)
PATCH  /api/expense/ledgers/:id/submit (DRAFT → SUBMITTED)
PATCH  /api/expense/ledgers/:id/approve (SUBMITTED → APPROVED → FINAL)
```

### 마스터 & 코드
```
GET    /api/expense/master (모든 20개 코드)
GET    /api/expense/master/:code (특정 코드 상세)
```

### 검증 (프롬프트 5-3)
```
POST   /api/expense/validate?month=YYYY-MM (7가지 규칙 실행)
GET    /api/expense/validate/:month (검증 결과)
POST   /api/expense/validate/:validationId/approve (승인)
```

### 분석 & 보고
```
GET    /api/expense/kpi?month=YYYY-MM (KPI 조회)
GET    /api/expense/report/monthly?month=YYYY-MM&format=json|csv
GET    /api/expense/report/yearly?year=YYYY
```

---

## 🎨 React 컴포넌트 (11개)

| 컴포넌트 | 위치 | 역할 |
|---------|------|------|
| ExpenseTreeView | 좌측 | 월별 + 코드 트리 |
| ExpenseTransactionList | 중앙 | 거래 대장 테이블 + 필터 |
| TransactionTable | 중앙 | 테이블 행 렌더링 |
| FilterBar | 중앙 | 코드, 상태, 검색 필터 |
| ValidationPanel | 우측 | 7가지 검증 규칙 상태 |
| ValidationRuleItem | 우측 | 규칙별 상태 + 승인 버튼 |
| AnalysisPanel | 분석 탭 | KPI + 차트 |
| MonthlyChart | 분석 | 월간 트렌드 차트 |
| KPICard | 분석 | 총액, 비율, 원단위 카드 |
| FileUploadForm | 업로드 | 엑셀 파일 드래그 & 드롭 |
| HistoryDriftModal | 모달 | 과거月 변경 승인 |

---

## 🔐 RLS 정책 (5개)

```sql
-- expense_ledgers SELECT: 현재月 + FINAL 상태만
-- expense_ledgers INSERT: DRAFT 상태, created_by만
-- expense_ledgers UPDATE: 작성자 || admin, DRAFT만
-- expense_ledgers DELETE: 작성자 || admin, DRAFT만
-- expense_validation UPDATE: admin만
```

---

## ✅ 검증 규칙 7가지

| 규칙 | 임계값 | 심각도 | 승인필요 |
|------|--------|--------|---------|
| TALLY_DIFF | △ > 1,000 INR | WARNING | 유 |
| PLAN_EXCEED | 초과 > 15% | WARNING | 유 |
| INVENTORY_MISMATCH | 오차 > 기말 2% | WARNING | 유 |
| RECEIPT_CONTINUITY | 시간갭 > 2h | WARNING | 아 |
| LEDGER_TOTAL | 오차 > 500 INR | ERROR | 유 |
| PURCHASE_LINK | 지연 > 30일 | WARNING | 유 |
| DOCUMENT_COMPLETENESS | 서류 누락 | INFO | 아 |

---

## 🚀 구현 순서

**Phase 1 (2h):** db/48_expense_master_module.sql  
├─ 테이블 6개, 인덱스 12개, RLS 5개, 트리거 2개, 초기데이터

**Phase 2 (10h):** API 엔드포인트 14개  
├─ 거래 CRUD (6개), 마스터 (2개), 검증 (3개), 분석 (3개)

**Phase 3 (8h):** React 컴포넌트 11개  
├─ 트리, 테이블, 검증, 분석, 파일업로드 등

**Phase 4 (3h):** 프롬프트 5-3 (검증 규칙 엔진)  
├─ 7가지 규칙 로직 구현

**Phase 5 (4h):** 통합 테스트  
├─ 9개 시나리오 (정상, 경고, 과거月 등)

**Phase 6 (2h):** 배포 & 최적화  
├─ Vercel 배포, 성능 튜닝

---

## 📁 파일 구조 (한눈에)

```
db/
  48_expense_master_module.sql

app/expense/
  layout.tsx
  page.tsx (메인 대시보드)
  upload/page.tsx (파일 업로드)
  analysis/page.tsx (분석 뷰)
  drift-approvals/page.tsx (과거月 승인)

app/api/expense/
  ledgers/route.ts (CRUD)
  ledgers/[id]/route.ts
  ledgers/[id]/submit/route.ts
  ledgers/[id]/approve/route.ts
  master/route.ts
  master/[code]/route.ts
  validate/route.ts
  validate/[month]/route.ts
  validate/[id]/approve/route.ts
  kpi/route.ts
  report/monthly/route.ts
  report/yearly/route.ts

components/expense/
  ExpenseTreeView.tsx
  ExpenseTransactionList.tsx
  TransactionTable.tsx
  FilterBar.tsx
  ValidationPanel.tsx
  ValidationRuleItem.tsx
  AnalysisPanel.tsx
  MonthlyChart.tsx
  KPICard.tsx
  FileUploadForm.tsx
  HistoryDriftModal.tsx

lib/expense/
  service.ts (API 호출)
  validation.ts (클라이언트 검증)
  formatter.ts (숫자/날짜)
  tree-builder.ts (트리 생성)

types/
  expense.ts

styles/
  expense.module.css
```

---

## 🔑 핵심 코드 스니펫

### 1. 월별 거래 조회
```typescript
const response = await fetch(
  `/api/expense/ledgers?month=2026-06&code=1.1&page=1&page_size=20`
);
const { ledgers, total_records, total_amount_inr } = await response.json();
```

### 2. 거래 제출
```typescript
await fetch(`/api/expense/ledgers/${id}/submit`, { method: 'PATCH' });
```

### 3. 검증 실행
```typescript
const validation = await fetch(`/api/expense/validate?month=2026-06`, {
  method: 'POST',
  body: JSON.stringify({ rules: ['TALLY_DIFF', 'PLAN_EXCEED', ...] })
});
```

### 4. 검증 승인
```typescript
await fetch(`/api/expense/validate/${validationId}/approve`, {
  method: 'POST',
  body: JSON.stringify({ approval_comment: '...' })
});
```

### 5. 보고서 다운로드
```typescript
const csv = await fetch(`/api/expense/report/monthly?month=2026-06&format=csv`);
```

---

## ⚠️ 주의사항

```
1. 월 형식: YYYY-MM (예: 2026-06) — 필수
2. 경비 코드: 1.1 ~ 4.1 (정규표현식: /^\d\.\d$/)
3. DCMI 코드: Asset Master와 조인 (외래키)
4. 과거月: 읽기 전용 (변경 시 approval_required=true)
5. RLS: 현재月 + DRAFT만 쓰기 가능
6. 트리거: 무한 루프 방지 (WHERE 조건 필요)
7. 배치: 1,000행+ 처리는 500행씩 나눔
8. 프롬프트 5-3: 7가지 규칙 모두 실행 필수
```

---

## 📞 문의 사항

- **설계서:** EXPENSE_MASTER_DESIGN_SPECIFICATION.md
- **구현노트:** EXPENSE_MASTER_IMPLEMENTATION_NOTES.md
- **프롬프트 5-1:** (입수/정규화) — 별도 제공 예정
- **프롬프트 5-3:** (검증 게이트) — 별도 제공 예정

---

**최종 업데이트:** 2026-06-12 17:30 KST
