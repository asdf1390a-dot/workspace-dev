---
name: DSC Mannur 경비 관리 모듈 (Expense Master) 설계서
description: FMS 포털 경비 관리 모듈 종합 설계 (API, DB, UI, 검증 규칙)
type: design
version: 1.0
created: 2026-06-12 17:30 KST
status: READY_FOR_IMPLEMENTATION
owner: Web App Designer / Planner
---

# DSC Mannur 경비 관리 모듈 종합 설계서

**목표:** DSC Mannur 인도 첸나이 공장의 기술/생산팀 월별 경비 관리 시스템 구현  
**대상 사용자:** 기술/생산팀 현장 직원(영어/타밀어), 부장급 관리자(한국어/영어)  
**플랫폼:** 모바일 우선 + 반응형 웹 (Next.js 14 + Supabase + Vercel)  
**의존성:** Asset Master DB (assets, asset_categories, master_codes)  
**예상 공수:** 30시간 (설계:4h + 개발:20h + 테스트:6h)  
**예상 마감:** 2026-06-18 18:00 KST

---

## 📋 프로젝트 개요

### 1. 비즈니스 요구사항

#### 1-1. 파일 양식 (20개 고정)

| 카테고리 | 파일 범위 | 설명 | 행 수 | 거래 대장 |
|---------|---------|------|-------|---------|
| **R&M** | 1.1~1.7 | 수선유지 (부품, 서비스, 임대, 폐기) | 7개 | O |
| **소모품** | 2.1 | 소모품 (그리스, 코일, 검사 용지 등) | 1개 | O |
| **부자재** | 3.1~3.5 | 원재료(강철, PP, PU, 포장재, 기타) | 5개 | O |
| **전력** | 4.1 | 전력 사용량 + 요금 | 1개 | O |
| **검증/운영** | (내부) | Tally ERP 대조, 계획초과, 재고 차이 등 | 6개 | X |

**총합:** 20파일 (거래 대장 16개 + 검증/운영 4개)

#### 1-2. 코드 체계 (고정)

```
대분류.소분류 형식:
1.1 ~ 1.7 : R&M (수선유지)
2.1       : 소모품
3.1 ~ 3.5 : 부자재
4.1       : 전력

예시:
1.1 = R&M - Parts Purchase
1.2 = R&M - Service & Labor
1.3 = R&M - Equipment Rental
1.4 = R&M - Scrap Sales
...
```

#### 1-3. 거래 대장 고정 양식 (Template)

```
NO | DATE | MAIN CAT | MACHINE CODE | DCMI | LINE | MAKER | MODEL | SYSTEM | SUMMARY CAT | PART | PROBLEM | QTY | PRICE | AMOUNT | SUPPLIER
 1 | 06/01| 1.1      | ML-2001      | 44   | A    | SIEMENS|S7-1200| PLV    | Hydraulic  | Seal |Leaking | 2  | 5000  | 10000 | SUPPLIER_A
```

**컬럼:**
- NO: 거래번호 (자동 증번)
- DATE: 거래일자 (YYYY-MM-DD)
- MAIN CAT: 대분류 (1.1 ~ 4.1)
- MACHINE CODE: 기계 코드 (ML-2001, WL-3001 등)
- DCMI: Asset Master 외래키 (asset.dcmi_code)
- LINE: 생산 라인 (A, B, C ...)
- MAKER: 제조사 (SIEMENS, BOSCH ...)
- MODEL: 모델명
- SYSTEM: 시스템명 (PLV, PLC ...)
- SUMMARY CAT: 요약 카테고리 (Hydraulic, Pneumatic ...)
- PART: 부품명
- PROBLEM: 문제 현상
- QTY: 수량
- PRICE: 단가
- AMOUNT: 금액 (QTY * PRICE)
- SUPPLIER: 납품업체

#### 1-4. 월별 사이클

```
┌─────────────────────────────────────────┐
│ 월 시작 (01일)                           │
├─────────────────────────────────────────┤
│ 1. 파일 업로드 (1.1~4.1, 엑셀)         │
│    ↓ 프롬프트 5-1 (입수/정규화/검증)    │
│ 2. 자동 파싱 & 정규화                   │
│    - 날짜 형식 통일 (YYYY-MM-DD)        │
│    - 수치 정규화 (통화, 단위)           │
│    - DCMI 코드 검증                     │
│    ↓ 프롬프트 5-3 (검증 게이트)        │
│ 3. 검증 규칙 7가지 자동 실행            │
│    - Tally 차이 △ 1,000 초과            │
│    - 계획 초과 △ 15% 이상               │
│    - 재고 항등식 위반                   │
│    - 검침 연속성 오류                   │
│    - 대장 합계 불일치                  │
│    - 구매 연동 오류                     │
│    - 서류 완결 미흡                     │
│    ↓ (경고/오류 있으면)                │
│ 4. 관리자 승인 대기                     │
│    (차이 확인 → 승인/거절)              │
│    ↓                                    │
│ 5. DB INSERT/UPDATE (UPSERT)           │
│    - expense_ledgers (월별 거래)        │
│    - expense_validation (검증 결과)     │
│    - expense_master (집계 정보)         │
│ 6. 트리 갱신 (FMS Tree View)            │
│    YYYY-MM 노드 생성                    │
│    ↓                                    │
│ 7. 보고서 생성                          │
│    - 월 vs 전월 비교                    │
│    - 코드별 초과 항목 리스트             │
│    - Tally 차이 리스트                  │
│    - 생산량 대비 원단위                 │
│ 8. 월 종료 (과거月 읽기 전용)          │
│    - 차이 감지 시 사용자 승인 필수      │
└─────────────────────────────────────────┘
```

#### 1-5. 생산성 보고서와의 연계

```
공유 키: (plant, period) = ('Mannur', 'YYYY-MM')
↓
Supabase JOIN:
  expense_ledgers (YYYY-MM)
  + productivity_reports (YYYY-MM)
  ↓
원단위 KPI 자동 산출:
  - 가스 소비 / 생산량 (m³/unit)
  - 코일 소비 / 생산량 (kg/unit)
  - 그리스 소비 / 생산량 (kg/unit)
  - 전력 소비 / 생산량 (kWh/unit)
  ↓
매출액 대비 경비율:
  - 경비 총액 / 매출액 (%)
```

---

## 🗄️ Database Schema (New: db/48)

### 2-1. 핵심 테이블 설계

#### 2-1-1. expense_master (경비 마스터 정보)

```sql
CREATE TABLE IF NOT EXISTS expense_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  code VARCHAR(10) NOT NULL UNIQUE,              -- 1.1 ~ 4.1
  code_name_en TEXT NOT NULL,                    -- R&M - Parts Purchase
  code_name_ta TEXT,                             -- தமிழ் மொழி (타밀어)
  code_name_ko TEXT,                             -- 한국어
  category_type VARCHAR(50),                     -- 'R&M'|'CONSUMABLE'|'RAW_MATERIAL'|'POWER'
  
  -- 예산 정보
  annual_budget DECIMAL(15,2),                   -- 연간 예산
  monthly_plan DECIMAL(15,2),                    -- 월간 계획
  ytd_actual DECIMAL(15,2),                      -- YTD 실적 (계산)
  ytd_variance DECIMAL(15,2),                    -- YTD 차이 (계산)
  
  -- 계산 필드
  is_active BOOLEAN DEFAULT true,
  last_transaction_date DATE,
  transaction_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_expense_master_code ON expense_master(code);
CREATE INDEX idx_expense_master_type ON expense_master(category_type);
```

#### 2-1-2. expense_ledgers (월별 거래 대장)

```sql
CREATE TABLE IF NOT EXISTS expense_ledgers (
  id BIGSERIAL PRIMARY KEY,
  
  -- 거래 기본 정보
  transaction_no INT NOT NULL,                   -- 월별 거래번호 (001, 002 ...)
  transaction_date DATE NOT NULL,                -- 거래일자 (YYYY-MM-DD)
  period_month VARCHAR(7) NOT NULL,              -- YYYY-MM (파티션 키)
  
  -- 분류 정보
  expense_code VARCHAR(10) NOT NULL REFERENCES expense_master(code),
  dcmi_code INT NOT NULL REFERENCES assets(dcmi_code) ON DELETE RESTRICT,  -- Asset Master 조인
  
  -- 거래 상세
  machine_code VARCHAR(50),                      -- ML-2001, WL-3001
  line_id VARCHAR(20),                           -- A, B, C, D
  maker_name VARCHAR(100),                       -- SIEMENS, BOSCH
  model_name VARCHAR(100),
  system_name VARCHAR(100),
  summary_category VARCHAR(100),                 -- Hydraulic, Pneumatic
  part_name VARCHAR(255),
  problem_description TEXT,
  
  -- 수량/금액
  quantity DECIMAL(10,2),
  unit_price DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- 메타정보
  supplier_name VARCHAR(255),
  transaction_ref VARCHAR(100),                  -- Invoice No, PO No
  remarks TEXT,
  
  -- 상태
  status VARCHAR(50) DEFAULT 'DRAFT',            -- DRAFT|SUBMITTED|APPROVED|REJECTED|FINAL
  approval_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- 감사 추적
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 파티션 설정 (월별)
  UNIQUE(period_month, transaction_no)
) PARTITION BY LIST (period_month);

-- 월별 파티션 예시
CREATE TABLE expense_ledgers_2606 PARTITION OF expense_ledgers
  FOR VALUES IN ('2026-06');
CREATE TABLE expense_ledgers_2607 PARTITION OF expense_ledgers
  FOR VALUES IN ('2026-07');

-- 인덱스
CREATE INDEX idx_expense_ledgers_period ON expense_ledgers(period_month);
CREATE INDEX idx_expense_ledgers_code ON expense_ledgers(expense_code);
CREATE INDEX idx_expense_ledgers_date ON expense_ledgers(transaction_date);
CREATE INDEX idx_expense_ledgers_dcmi ON expense_ledgers(dcmi_code);
CREATE INDEX idx_expense_ledgers_status ON expense_ledgers(status);
CREATE INDEX idx_expense_ledgers_created_by ON expense_ledgers(created_by);
```

#### 2-1-3. expense_validation (검증 규칙 결과)

```sql
CREATE TABLE IF NOT EXISTS expense_validation (
  id BIGSERIAL PRIMARY KEY,
  
  -- 참조
  period_month VARCHAR(7) NOT NULL,
  expense_code VARCHAR(10) NOT NULL,
  
  -- 검증 규칙
  rule_id VARCHAR(50) NOT NULL,                  -- 'TALLY_DIFF'|'PLAN_EXCEED'|'INVENTORY_MISMATCH'|...
  rule_name_en TEXT,
  rule_name_ko TEXT,
  
  -- 검증 결과
  is_passed BOOLEAN DEFAULT false,
  severity VARCHAR(20),                          -- 'INFO'|'WARNING'|'ERROR'
  
  -- 상세 정보
  expected_value DECIMAL(15,2),
  actual_value DECIMAL(15,2),
  variance_value DECIMAL(15,2),
  variance_percent DECIMAL(5,2),
  
  threshold_limit DECIMAL(15,2),                 -- 임계값
  message_en TEXT,
  message_ko TEXT,
  affected_transactions INT,                     -- 영향받는 거래 수
  
  -- 대응
  approval_required BOOLEAN DEFAULT false,       -- 승인 필요 여부
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_comment TEXT,
  
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_validation_period ON expense_validation(period_month);
CREATE INDEX idx_validation_rule ON expense_validation(rule_id);
CREATE INDEX idx_validation_status ON expense_validation(is_passed);
CREATE INDEX idx_validation_approval ON expense_validation(approval_required);
```

#### 2-1-4. expense_history_drift (역사 데이터 보호)

```sql
CREATE TABLE IF NOT EXISTS expense_history_drift (
  id BIGSERIAL PRIMARY KEY,
  
  -- 변경 감지
  period_month VARCHAR(7) NOT NULL,
  transaction_id BIGINT NOT NULL REFERENCES expense_ledgers(id) ON DELETE CASCADE,
  
  -- 이전값
  previous_snapshot JSONB,                       -- 전체 행 데이터 (JSON)
  
  -- 새값
  new_snapshot JSONB,
  
  -- 변경 사항 분석
  changed_fields VARCHAR(255)[],                 -- 변경된 필드 배열
  change_reason TEXT,
  
  -- 승인
  approval_required BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_drift_period ON expense_history_drift(period_month);
CREATE INDEX idx_drift_transaction ON expense_history_drift(transaction_id);
CREATE INDEX idx_drift_approval ON expense_history_drift(approval_required);
```

#### 2-1-5. expense_kpi (KPI 캐시 테이블)

```sql
CREATE TABLE IF NOT EXISTS expense_kpi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  period_month VARCHAR(7) NOT NULL,
  expense_code VARCHAR(10) NOT NULL,
  
  -- 총계
  total_amount DECIMAL(15,2),
  transaction_count INT,
  
  -- 비율
  vs_plan_variance DECIMAL(5,2),                 -- 계획 대비 (%)
  vs_previous_month_variance DECIMAL(5,2),      -- 전월 대비 (%)
  vs_budget_variance DECIMAL(5,2),               -- 예산 대비 (%)
  
  -- 원단위 (생산량 기준)
  per_unit_consumption DECIMAL(10,4),            -- m³, kg, kWh 등
  production_volume INT,                         -- 조인된 생산량
  
  -- 메타
  calculation_date TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_month, expense_code)
);

-- 인덱스
CREATE INDEX idx_kpi_period ON expense_kpi(period_month);
```

### 2-2. RLS 정책

```sql
-- expense_ledgers RLS
ALTER TABLE expense_ledgers ENABLE ROW LEVEL SECURITY;

-- 읽기: 현재月 + 승인된 과거月만
CREATE POLICY "expense_ledgers_read" ON expense_ledgers
  FOR SELECT TO authenticated
  USING (
    period_month = to_char(NOW(), 'YYYY-MM')
    OR status = 'FINAL'
  );

-- 쓰기: DRAFT 상태만, 작성자만
CREATE POLICY "expense_ledgers_write" ON expense_ledgers
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND status = 'DRAFT');

-- 편집: 작성자 또는 관리자만
CREATE POLICY "expense_ledgers_update" ON expense_ledgers
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR EXISTS(
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ))
  WITH CHECK (updated_by = auth.uid());

-- 삭제: DRAFT 상태만, 작성자만
CREATE POLICY "expense_ledgers_delete" ON expense_ledgers
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND status = 'DRAFT');

-- expense_validation RLS
ALTER TABLE expense_validation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "validation_read" ON expense_validation
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "validation_update" ON expense_validation
  FOR UPDATE TO authenticated
  USING (approved_by = auth.uid() OR EXISTS(
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));
```

### 2-3. 트리거 (자동 계산)

```sql
-- expense_ledgers INSERT/UPDATE 시 expense_kpi 갱신
CREATE OR REPLACE FUNCTION update_expense_kpi()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO expense_kpi (period_month, expense_code, total_amount, transaction_count, calculation_date)
  SELECT 
    NEW.period_month,
    NEW.expense_code,
    SUM(total_amount),
    COUNT(*),
    NOW()
  FROM expense_ledgers
  WHERE period_month = NEW.period_month AND expense_code = NEW.expense_code
  ON CONFLICT (period_month, expense_code)
  DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    transaction_count = EXCLUDED.transaction_count,
    calculation_date = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_expense_kpi_update
  AFTER INSERT OR UPDATE ON expense_ledgers
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_kpi();

-- expense_history_drift 감지 (과거月 변경 시)
CREATE OR REPLACE FUNCTION detect_history_drift()
RETURNS TRIGGER AS $$
BEGIN
  IF to_char(NEW.period_month::date, 'YYYY-MM') < to_char(NOW(), 'YYYY-MM') THEN
    INSERT INTO expense_history_drift (
      period_month, transaction_id, previous_snapshot, new_snapshot, 
      changed_fields, approval_required
    )
    VALUES (
      NEW.period_month,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      ARRAY(SELECT key FROM jsonb_each(to_jsonb(NEW)) WHERE value != jsonb_extract_path(to_jsonb(OLD), key)),
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_history_drift_detect
  AFTER UPDATE ON expense_ledgers
  FOR EACH ROW
  EXECUTE FUNCTION detect_history_drift();
```

---

## 🔌 API 엔드포인트 (12개 + 검증 3개)

### 3-1. 거래 대장 API

#### 1️⃣ GET /api/expense/ledgers?month=YYYY-MM

**목적:** 월별 거래 대장 조회  
**권한:** authenticated  
**쿼리 파라미터:**
- `month` (필수): YYYY-MM 형식
- `code` (선택): 경비 코드 필터 (1.1, 1.2 등)
- `status` (선택): DRAFT|SUBMITTED|APPROVED|FINAL
- `page` (기본: 1): 페이지 번호
- `page_size` (기본: 20): 페이지 크기
- `sort_by` (기본: transaction_date): transaction_date|amount
- `sort_order` (기본: asc): asc|desc

**응답 200:**
```json
{
  "period_month": "2026-06",
  "total_records": 156,
  "total_amount_inr": 2845600,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "ledgers": [
    {
      "id": 12345,
      "transaction_no": 1,
      "transaction_date": "2026-06-01",
      "expense_code": "1.1",
      "machine_code": "ML-2001",
      "dcmi_code": 44,
      "part_name": "Hydraulic Seal",
      "quantity": 2,
      "unit_price": 5000,
      "total_amount": 10000,
      "supplier_name": "SUPPLIER_A",
      "status": "APPROVED",
      "created_by": "user@dsc.com"
    }
  ]
}
```

**에러:**
- 400 Bad Request: 유효하지 않은 month 형식
- 403 Forbidden: 과거月 읽기 권한 없음

---

#### 2️⃣ POST /api/expense/ledgers

**목적:** 거래 대장 행 추가 (파일 업로드 후 프롬프트 5-1 실행)  
**권한:** authenticated (기술/생산팀)  
**요청 바디:**
```json
{
  "period_month": "2026-06",
  "transactions": [
    {
      "transaction_date": "2026-06-01",
      "expense_code": "1.1",
      "machine_code": "ML-2001",
      "dcmi_code": 44,
      "line_id": "A",
      "maker_name": "SIEMENS",
      "model_name": "S7-1200",
      "system_name": "PLV",
      "summary_category": "Hydraulic",
      "part_name": "Seal",
      "problem_description": "Leaking",
      "quantity": 2,
      "unit_price": 5000,
      "currency": "INR",
      "supplier_name": "SUPPLIER_A",
      "remarks": "Emergency repair"
    }
  ]
}
```

**응답 201:**
```json
{
  "created_count": 1,
  "inserted_ids": [12345],
  "period_month": "2026-06",
  "validation_status": "PENDING"
}
```

---

#### 3️⃣ PUT /api/expense/ledgers/:id

**목적:** 거래 대장 행 편집 (DRAFT/SUBMITTED만)  
**권한:** created_by 또는 admin  
**요청 바디:**
```json
{
  "part_name": "Hydraulic Seal Kit",
  "quantity": 3,
  "unit_price": 4500
}
```

**응답 200:**
```json
{
  "id": 12345,
  "status": "DRAFT",
  "updated_at": "2026-06-12T17:30:00Z"
}
```

---

#### 4️⃣ DELETE /api/expense/ledgers/:id

**목적:** 거래 대장 행 삭제 (DRAFT만)  
**권한:** created_by 또는 admin  

**응답 200:**
```json
{
  "success": true,
  "deleted_id": 12345
}
```

---

#### 5️⃣ PATCH /api/expense/ledgers/:id/submit

**목적:** 거래 대장 행 제출 (DRAFT → SUBMITTED)  
**권한:** created_by  

**응답 200:**
```json
{
  "id": 12345,
  "status": "SUBMITTED",
  "validation_pending": true
}
```

---

#### 6️⃣ PATCH /api/expense/ledgers/:id/approve

**목적:** 거래 대장 행 승인 (SUBMITTED → APPROVED → FINAL)  
**권한:** admin 또는 manager  
**요청 바디:**
```json
{
  "approval_comment": "Verified against invoice"
}
```

**응답 200:**
```json
{
  "id": 12345,
  "status": "APPROVED",
  "approved_by": "manager@dsc.com",
  "approved_at": "2026-06-12T18:00:00Z"
}
```

---

### 3-2. 경비 마스터 API

#### 7️⃣ GET /api/expense/master

**목적:** 경비 코드 마스터 조회 (20개 코드)  
**권한:** authenticated  
**응답 200:**
```json
{
  "codes": [
    {
      "code": "1.1",
      "code_name_en": "R&M - Parts Purchase",
      "code_name_ko": "수선유지 - 부품 구매",
      "category_type": "R&M",
      "annual_budget": 1200000,
      "monthly_plan": 100000,
      "ytd_actual": 450000,
      "ytd_variance": -50000,
      "transaction_count": 34
    }
  ]
}
```

---

#### 8️⃣ GET /api/expense/master/:code

**목적:** 특정 경비 코드 상세 조회  

**응답 200:**
```json
{
  "code": "1.1",
  "code_name_en": "R&M - Parts Purchase",
  "annual_budget": 1200000,
  "monthly_breakdown": [
    { "month": "2026-01", "plan": 100000, "actual": 85000 },
    { "month": "2026-02", "plan": 100000, "actual": 95000 },
    ...
  ],
  "top_suppliers": [
    { "name": "SUPPLIER_A", "amount": 250000, "count": 15 }
  ]
}
```

---

### 3-3. 검증 API (Prompt 5-3)

#### 9️⃣ POST /api/expense/validate

**목적:** 월별 거래 대장 검증 규칙 실행 (프롬프트 5-3)  
**권한:** admin 또는 자동 스케줄  
**요청 바디:**
```json
{
  "period_month": "2026-06",
  "rules": ["TALLY_DIFF", "PLAN_EXCEED", "INVENTORY_MISMATCH", "RECEIPT_CONTINUITY", "LEDGER_TOTAL", "PURCHASE_LINK", "DOCUMENT_COMPLETENESS"]
}
```

**프롬프트 5-3 (검증 게이트) 작업:**
1. Tally ERP 차이 확인 (△ > 1,000 INR면 경고)
2. 계획 초과 확인 (△ > 15% 이면 경고)
3. 재고 항등식 검증 (기초 + 입고 - 출고 = 기말)
4. 검침 연속성 확인 (일일 검침 시간 갭 > 2시간 경고)
5. 대장 합계 대조 (SUM(amount) vs 보고 값)
6. 구매 연동 확인 (구매일자 vs 사용일자 > 30일 경고)
7. 서류 완결 확인 (Invoice, PO, Receipt 모두 있는지)

**응답 200:**
```json
{
  "period_month": "2026-06",
  "validation_summary": {
    "total_rules": 7,
    "passed": 5,
    "warnings": 2,
    "errors": 0
  },
  "validations": [
    {
      "rule_id": "TALLY_DIFF",
      "is_passed": true,
      "severity": "INFO"
    },
    {
      "rule_id": "PLAN_EXCEED",
      "is_passed": false,
      "severity": "WARNING",
      "expected_value": 100000,
      "actual_value": 118500,
      "variance_percent": 18.5,
      "threshold_limit": 115000,
      "message_ko": "계획 초과: 예산 100,000 INR 대비 118,500 INR 사용 (18.5%)",
      "approval_required": true,
      "affected_transactions": 12
    }
  ]
}
```

---

#### 🔟 GET /api/expense/validate/:month

**목적:** 월별 검증 결과 조회  

**응답 200:**
```json
{
  "period_month": "2026-06",
  "validation_results": [...],
  "requires_approval": true,
  "approval_items": [
    {
      "validation_id": 5001,
      "rule_id": "PLAN_EXCEED",
      "code": "1.1",
      "variance": 18500
    }
  ]
}
```

---

#### 1️⃣1️⃣ POST /api/expense/validate/:validationId/approve

**목적:** 검증 경고 승인 (관리자)  
**권한:** admin 또는 manager  
**요청 바디:**
```json
{
  "approval_comment": "Plan variance approved for emergency repairs"
}
```

**응답 200:**
```json
{
  "validation_id": 5001,
  "status": "APPROVED",
  "approved_by": "manager@dsc.com"
}
```

---

### 3-4. 분석 & 보고 API

#### 1️⃣2️⃣ GET /api/expense/kpi?month=YYYY-MM

**목적:** 월별 KPI 조회 (원단위, 비율 등)  
**쿼리 파라미터:**
- `month` (필수): YYYY-MM
- `codes` (선택): 특정 코드만 (1.1,1.2,3.1)

**응답 200:**
```json
{
  "period_month": "2026-06",
  "kpis": [
    {
      "code": "1.1",
      "total_amount": 450000,
      "transaction_count": 34,
      "vs_plan_variance": -18.5,
      "vs_previous_month_variance": 12.3,
      "vs_budget_variance": -8.2,
      "per_unit_consumption": 2.5,
      "unit": "kg"
    }
  ]
}
```

---

#### 1️⃣3️⃣ GET /api/expense/report/monthly?month=YYYY-MM

**목적:** 월간 분석 보고서 (CSV/JSON)  
**쿼리 파라미터:**
- `month` (필수)
- `format` (기본: json): json|csv

**보고서 구성:**
1. **월 vs 전월 비교 (코드별)**
   ```
   Code | 이번月 | 전월 | 차이 | 차이율
   1.1  | 450K   | 400K | +50K | +12.5%
   ```

2. **코드별 초과 항목 리스트**
   ```
   Code | 계획   | 실적   | 초과액 | 초과율
   2.1  | 50K    | 58.5K  | +8.5K  | +17%
   ```

3. **Tally 차이 리스트**
   ```
   Date | Code | Tally예상 | 실제 | 차이
   06/01| 1.1  | 85K      | 87.5K| +2.5K
   ```

4. **생산량 대비 원단위**
   ```
   Code | 상품명 | 소비량 | 생산량 | 원단위
   2.1  | 그리스 | 125kg  | 5,000unit | 0.025 kg/unit
   ```

**응답 200:**
```json
{
  "period": "2026-06",
  "report_type": "monthly_analysis",
  "generated_at": "2026-06-12T18:00:00Z",
  "summary": {
    "total_expense": 2845600,
    "total_plan": 3000000,
    "variance": -154400,
    "variance_percent": -5.1
  },
  "sections": {
    "month_vs_month": [...],
    "excess_items": [...],
    "tally_diff": [...],
    "unit_consumption": [...]
  }
}
```

---

#### 1️⃣4️⃣ GET /api/expense/report/yearly?year=YYYY

**목적:** 연간 분석 보고서 (YEARLY EXPENSE, PLAN vs ACTUAL, ACTUAL vs TALLY)  

**응답 200:**
```json
{
  "year": 2026,
  "summary": {
    "ytd_expense": 2845600,
    "ytd_plan": 3000000,
    "ytd_budget": 5000000
  },
  "monthly_rollup": [
    {
      "month": "2026-01",
      "actual": 450000,
      "plan": 500000,
      "budget": 833333,
      "variance_plan": -10,
      "variance_budget": -46
    }
  ],
  "code_breakdown": [
    {
      "code": "1.1",
      "ytd_actual": 1200000,
      "ytd_plan": 1100000,
      "ytd_budget": 2000000
    }
  ]
}
```

---

## 🎨 UI/UX 컴포넌트 설계

### 4-1. 컴포넌트 계층도

```
/expense (메인 페이지)
├─ ExpenseTreeView (좌측 트리)
│  ├─ TreeNode (YYYY-MM 노드)
│  │  ├─ CodeNode (1.1, 1.2, ... 4.1)
│  │  │  └─ TransactionCount (거래 수)
│  │  └─ SummaryNode (월 합계, 상태)
│  └─ SearchFilter
│
├─ ExpenseTransactionList (중앙 거래 리스트)
│  ├─ FilterBar
│  │  ├─ PeriodSelector (YYYY-MM)
│  │  ├─ CodeSelector (1.1~4.1 드롭다운)
│  │  ├─ StatusFilter (DRAFT|APPROVED|FINAL)
│  │  └─ SearchInput
│  ├─ TransactionTable
│  │  ├─ TableHeader (날짜, 코드, 기계, 부품, 금액 ...)
│  │  ├─ TableRow (각 거래)
│  │  └─ ActionButtons (Edit, Delete, Submit, Approve)
│  ├─ Pagination
│  └─ ExportButton (CSV)
│
├─ ValidationPanel (우측 검증 패널)
│  ├─ RulesList
│  │  ├─ RuleItem (TALLY_DIFF, PLAN_EXCEED ...)
│  │  │  ├─ Status (PASS/WARNING/ERROR)
│  │  │  ├─ Message (한글/영어)
│  │  │  └─ ApprovalButton (if needed)
│  │  └─ ApprovalSummary
│  └─ ApprovalModal
│
└─ AnalysisPanel (분석 뷰)
   ├─ KPICards
   │  ├─ TotalExpense
   │  ├─ VsPlanVariance
   │  ├─ VsPreviousMonth
   │  └─ UnitConsumption
   ├─ Charts
   │  ├─ MonthlyTrend (라인 차트)
   │  ├─ CodeBreakdown (파이/도넛 차트)
   │  └─ VsPlanned (막대 차트)
   └─ ReportExport (PDF/CSV)
```

### 4-2. 주요 페이지 설계

#### 페이지 1: /expense (메인 대시보드)

**화면 구성:**
```
┌─────────────────────────────────────────────────────────────┐
│ DSC Mannur - Expense Master                  [Settings]     │
├──────────┬──────────────────────┬───────────────────────────┤
│           │                      │                           │
│ 트리 뷰   │  거래 대장 리스트     │  검증 패널 / 분석      │
│           │                      │                           │
│ [▼] 2026  │ 기간: [2026-06] ▼   │ 검증 상태: PENDING    │
│ ├─[▼]06   │ 코드: [1.1~4.1] ▼   │                        │
│ │├─ 1.1   │ 상태: [APPROVED] ▼  │ ✓ TALLY_DIFF         │
│ ││ (34)   │                      │ ⚠ PLAN_EXCEED        │
│ │├─ 1.2   │ 날짜 | 기계 | 부품   │ ✓ INVENTORY_MISMATCH │
│ ││ (28)   │ ──────────────────   │ ...                  │
│ │└─ 1.3   │ 06/01|ML-2001|Seal  │ [승인] [거절]         │
│ ││ (15)   │ 06/02|WL-3001|Filter│                        │
│ ├─ 2.1    │ 06/03|ML-2002|Coil  │ 📊 분석 뷰로 전환     │
│ │ (45)    │ ...                  │                        │
│ └─ 3.1    │                      │                        │
│   (22)    │ [← 이전] 1-20/156 [다음 →]                    │
│           │                      │                        │
│ [+ 거래추가]                      │ [CSV] [PDF] [보고서]   │
└────────────┴──────────────────────┴────────────────────────┘
```

**주요 기능:**
- 월별 트리 노드 자동 생성 (YYYY-MM)
- 코드별 거래 수 실시간 표시
- 검증 규칙 7가지 상태 아이콘 표시
- 모바일: 트리/리스트/검증을 탭으로 전환

#### 페이지 2: /expense/upload (파일 업로드 & 프롬프트 5-1)

**화면:**
```
┌──────────────────────────────────────────┐
│ Expense File Upload & Normalization      │
├──────────────────────────────────────────┤
│ 기간: [2026-06] (선택)                   │
│                                          │
│ [📁 엑셀 파일 선택] (또는 드래그)        │
│                                          │
│ 선택된 파일: expense_2026-06.xlsx        │
│ 크기: 2.5MB | 행: 156개                 │
│                                          │
│ ▶ 프롬프트 5-1 실행                    │
│   (입수/정규화/검증)                    │
│                                          │
│ [진행 중...] 84% ████████░░             │
│ - 파싱 중: 파일 읽기 완료               │
│ - 정규화: 날짜 형식 통일...             │
│ - 검증: DCMI 코드 확인 중...            │
│                                          │
│ ✓ 완료: 156행 입수, 3행 오류 (수정됨)   │
│                                          │
│ [거래 대장으로] [다시 업로드]            │
└──────────────────────────────────────────┘
```

#### 페이지 3: /expense/analysis (분석 뷰)

**화면:**
```
┌──────────────────────────────────────────────────────┐
│ Monthly Analysis Report - 2026-06                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📊 KPI Summary                                       │
│ ┌──────────┬──────────┬──────────┬──────────┐       │
│ │ Total    │ vs Plan  │ vs Month │ Unit    │       │
│ │ 2.85M    │ -5.1%    │ +12.3%   │ 0.025   │       │
│ │ INR      │ (Good)   │ (Up)     │ kg/unit │       │
│ └──────────┴──────────┴──────────┴──────────┘       │
│                                                      │
│ 📈 Monthly Trend (6개월)                            │
│    2.5M |        ╱╲                                 │
│    2.0M |  ╱╲  ╱  ╲  ╱╲                             │
│    1.5M |╱   ╲╱    ╲╱  ╲╱                            │
│   ─────┴──────────────────  (Jan ~ Jun)             │
│                                                      │
│ 💰 Code Breakdown (파이 차트)                       │
│   1.1: 35% (1.05M)                                  │
│   1.2: 28% (0.80M)                                  │
│   3.1: 22% (0.62M)                                  │
│   4.1: 15% (0.42M)                                  │
│                                                      │
│ 📋 Month vs Month Comparison                        │
│   Code | This Month | Last Month | Change          │
│   1.1  |  450K      |  400K      | +12.5%          │
│   1.2  |  390K      |  420K      | -7.1%           │
│   ...                                               │
│                                                      │
│ ⚠️  Excess Items (계획 초과)                        │
│   Code | Item      | Plan  | Actual | Excess      │
│   2.1  | 소모품    | 50K   | 58.5K  | +17%        │
│                                                      │
│ [CSV] [PDF] [공유]                                 │
└──────────────────────────────────────────────────────┘
```

---

## 📊 검증 규칙 7가지 (Rule Engine)

### 5-1. TALLY_DIFF (Tally ERP 차이)

```
규칙: 월별 거래 합계 vs Tally ERP 합계
임계값: △ 1,000 INR 초과
심각도: ERROR
판정:
  △ ≤ 1,000 → PASS
  1,000 < △ ≤ 5,000 → WARNING (매니저 승인)
  △ > 5,000 → ERROR (CFO 승인)
```

**프롬프트 5-3 단계:**
1. expense_ledgers SUM(total_amount) 계산
2. Tally 마스터 테이블 조인 (API 연동 또는 수동)
3. 차이 계산 및 메시지 생성 (한글/영어)

---

### 5-2. PLAN_EXCEED (계획 초과)

```
규칙: 코드별 실적 vs 월간 계획
임계값: △ > 15%
심각도: WARNING
판정:
  실적 ≤ 계획 × 1.15 → PASS
  계획 × 1.15 < 실적 ≤ 계획 × 1.30 → WARNING
  실적 > 계획 × 1.30 → ERROR
```

---

### 5-3. INVENTORY_MISMATCH (재고 항등식)

```
규칙: 기초 재고 + 입고 - 출고 = 기말 재고
허용오차: ± 2%
심각도: WARNING
판정:
  |차이| ≤ 기말재고 × 0.02 → PASS
  기말재고 × 0.02 < |차이| ≤ 기말재고 × 0.05 → WARNING
  |차이| > 기말재고 × 0.05 → ERROR
```

---

### 5-4. RECEIPT_CONTINUITY (검침 연속성)

```
규칙: 일일 검침 데이터 시간 갭 > 2시간
심각도: WARNING
판정:
  모든 시간갭 ≤ 2시간 → PASS
  최대 시간갭 > 2시간 → WARNING (해당 날짜 표시)
```

---

### 5-5. LEDGER_TOTAL (대장 합계 대조)

```
규칙: SUM(expense_ledgers.total_amount) = 보고된 월간 합계
허용오차: ± 100 INR
심각도: ERROR
판정:
  |차이| ≤ 100 → PASS
  100 < |차이| ≤ 500 → WARNING
  |차이| > 500 → ERROR
```

---

### 5-6. PURCHASE_LINK (구매 연동)

```
규칙: 구매 거래 (1.x) 의 거래일자 vs 사용일자
임계값: 차이 > 30일
심각도: WARNING
판정:
  거래일자 ≤ 사용일자 ≤ 거래일자 + 30일 → PASS
  사용일자 > 거래일자 + 30일 → WARNING (지연)
  사용일자 < 거래일자 → ERROR (미래 거래)
```

---

### 5-7. DOCUMENT_COMPLETENESS (서류 완결)

```
규칙: Invoice + PO + Receipt 모두 첨부 필요
심각도: INFO / WARNING
판정:
  모든 서류 있음 → PASS
  1개 이상 누락 → WARNING (누락 서류 표시)
```

---

## 🔐 역사 데이터 보호 로직

### 6-1. 과거月 변경 감지

```
┌──────────────────────────────────┐
│ 사용자가 과거月 거래 편집 시도    │
├──────────────────────────────────┤
│ 1. period_month < 현재月 확인     │
│    ↓ YES                          │
│ 2. expense_history_drift 레코드   │
│    삽입 (approval_required=true)  │
│ 3. 변경 감지 알림                  │
│    - Slack 알림 (관리자에게)      │
│    - 대기 중 표시                 │
│    ↓                              │
│ 4. 관리자 승인 대기                │
│    - /api/expense/history-drift   │
│    - 이전값/새값 비교 보기         │
│    ↓                              │
│ 5. 승인 또는 거절                 │
│    - 승인 → 변경 커밋             │
│    - 거절 → ROLLBACK             │
│ 6. 감사 로그 기록                 │
│    who | when | what | reason     │
└──────────────────────────────────┘
```

**구현:**
- UPDATE 트리거에서 period_month < NOW() 체크
- expense_history_drift 테이블에 레코드 삽입
- RLS: 과거月은 읽기 전용 (INSERT/UPDATE/DELETE 차단)
- 관리자용 승인 페이지 (/expense/drift-approvals)

---

## 🧪 통합 테스트 케이스

### 7-1. 정상 흐름 (Happy Path)

```
테스트 1: 월별 거래 정상 입수 & 검증
[입력] expense_2026-06.xlsx (156행)
  ├─ 프롬프트 5-1 실행 (입수/정규화)
  ├─ expense_ledgers 156행 INSERT
  ├─ 프롬프트 5-3 실행 (7가지 검증)
  ├─ 모든 규칙 PASS
  ├─ 자동 FINAL 상태로 전환
  └─ expense_kpi 갱신 (월별 KPI 캐시)
[기대] DB 무결성 ✓, 검증 통과율 100%, 트리 노드 생성 ✓

테스트 2: 월간 보고서 생성
[입력] GET /api/expense/report/monthly?month=2026-06
  ├─ 월 vs 전월 비교 (코드별)
  ├─ 계획 초과 항목 필터링
  ├─ Tally 차이 리스트
  ├─ 생산량 대비 원단위 KPI
  └─ 매출액 대비 경비율
[기대] CSV/JSON 형식 정확성 ✓, 계산 오류 없음 ✓
```

### 7-2. 에러 처리

```
테스트 3: DCMI 코드 미일치
[입력] machine_code="ML-2001" 하지만 dcmi_code=9999 (존재하지 않음)
  ├─ 외래키 제약 확인 (assets.dcmi_code)
  └─ 오류 메시지 생성
[기대] Foreign Key 제약 오류 ✓, 사용자 메시지 명확함 ✓

테스트 4: 날짜 형식 오류
[입력] transaction_date="06-01-2026" (US 형식)
  ├─ 프롬프트 5-1 정규화 (YYYY-MM-DD로 변환)
  ├─ 정규화 완료 후 INSERT
  └─ 오류 로그 기록
[기대] 자동 수정됨 ✓, 감사 로그 ✓

테스트 5: 계획 초과 경고
[입력] 코드 2.1 월간 계획 50,000 INR, 실적 58,500 INR (17% 초과)
  ├─ 검증 규칙 PLAN_EXCEED 트리거
  ├─ 심각도: WARNING
  ├─ 매니저 승인 필요
  └─ 승인 전까지 SUBMITTED 상태
[기대] 검증 통과율 95% (1건 경고), 승인 대기 표시 ✓
```

### 7-3. 과거月 변경 (History Drift)

```
테스트 6: 과거月 거래 편집 시도
[입력] 2026-04 거래 (id=1234) 편집 시도
  ├─ period_month='2026-04' < '2026-06'
  ├─ expense_history_drift 레코드 삽입
  │  (previous_snapshot, new_snapshot 저장)
  ├─ 변경 차단 (RLS)
  ├─ 관리자 알림 발송
  └─ 승인 대기 상태로 전환
[기대] 변경 감지됨 ✓, 승인 필요 ✓, 역할 검증 ✓

테스트 7: 다중 과거月 변경 + 승인 플로우
[입력] 2026-04, 2026-05 동시에 3건 변경 시도
  ├─ 3건 모두 expense_history_drift 삽입
  ├─ 관리자 대시보드 (/expense/drift-approvals) 표시
  ├─ 일괄 비교 & 검토 기능
  ├─ 2건 승인, 1건 거절
  └─ 승인된 2건만 COMMIT
[기대] 트랜잭션 무결성 ✓, 감사 추적 ✓
```

### 7-4. 성능 & 확장성

```
테스트 8: 대량 거래 입수 (월 1,000개 이상)
[입력] expense_2026-06.xlsx (1,500행)
  ├─ 배치 INSERT (500행씩)
  ├─ 각 배치마다 검증 병렬 처리
  ├─ KPI 캐시 실시간 갱신
  └─ UI 응답성 (< 3초)
[기대] DB 성능 ✓ (< 10초), 메모리 누수 없음 ✓

테스트 9: 트리 렌더링 (36개월 × 20개 코드)
[입력] 3년치 expense 데이터 트리 렌더링
  ├─ 트리 노드 720개 생성
  ├─ 초기 로드 시간 측정
  ├─ 스크롤 반응성 확인
  └─ 가상화 (virtualization) 적용
[기대] 초기 로드 < 2초 ✓, 스크롤 부드러움 ✓
```

---

## 📁 파일 구조 (예상)

```
dsc-fms-portal/
├─ db/
│  └─ 48_expense_master_module.sql          (테이블, 인덱스, RLS, 트리거)
│
├─ app/
│  ├─ expense/
│  │  ├─ layout.tsx                         (메인 레이아웃)
│  │  ├─ page.tsx                           (대시보드)
│  │  ├─ upload/
│  │  │  └─ page.tsx                        (파일 업로드 & 프롬프트 5-1)
│  │  ├─ analysis/
│  │  │  └─ page.tsx                        (분석 뷰)
│  │  └─ drift-approvals/
│  │     └─ page.tsx                        (과거月 변경 승인)
│  │
│  └─ api/
│     └─ expense/
│        ├─ ledgers/
│        │  ├─ route.ts                     (GET, POST, PUT, DELETE)
│        │  ├─ [id]/
│        │  │  ├─ route.ts                  (PUT, DELETE)
│        │  │  ├─ submit/
│        │  │  │  └─ route.ts               (PATCH)
│        │  │  └─ approve/
│        │  │     └─ route.ts               (PATCH)
│        │  └─ batch/
│        │     └─ route.ts                  (POST - 배치 입수)
│        │
│        ├─ master/
│        │  ├─ route.ts                     (GET /api/expense/master)
│        │  └─ [code]/
│        │     └─ route.ts                  (GET /api/expense/master/:code)
│        │
│        ├─ validate/
│        │  ├─ route.ts                     (POST - 검증 실행)
│        │  ├─ [month]/
│        │  │  └─ route.ts                  (GET - 검증 결과)
│        │  └─ [validationId]/
│        │     └─ approve/
│        │        └─ route.ts               (POST - 승인)
│        │
│        ├─ kpi/
│        │  └─ route.ts                     (GET - KPI 조회)
│        │
│        ├─ report/
│        │  ├─ monthly/
│        │  │  └─ route.ts                  (GET - 월간 보고서)
│        │  └─ yearly/
│        │     └─ route.ts                  (GET - 연간 보고서)
│        │
│        └─ history-drift/
│           ├─ route.ts                     (GET - 과거月 변경 리스트)
│           └─ [driftId]/
│              └─ approve/
│                 └─ route.ts               (POST - 승인/거절)
│
├─ components/
│  └─ expense/
│     ├─ ExpenseTreeView.tsx                (좌측 트리 뷰)
│     ├─ ExpenseTransactionList.tsx         (중앙 거래 리스트)
│     ├─ ValidationPanel.tsx                (우측 검증 패널)
│     ├─ AnalysisPanel.tsx                  (분석 뷰)
│     ├─ FileUploadForm.tsx                 (파일 업로드)
│     ├─ ValidationRuleItem.tsx             (검증 규칙 아이템)
│     ├─ MonthlyChart.tsx                   (월간 차트)
│     ├─ KPICard.tsx                        (KPI 카드)
│     └─ HistoryDriftModal.tsx              (과거月 변경 모달)
│
├─ lib/
│  └─ expense/
│     ├─ service.ts                         (API 호출)
│     ├─ validation.ts                      (클라이언트 검증)
│     ├─ formatter.ts                       (숫자/날짜 포맷팅)
│     └─ tree-builder.ts                    (트리 노드 생성)
│
├─ types/
│  └─ expense.ts                            (TypeScript 인터페이스)
│
└─ styles/
   └─ expense.module.css                    (스타일시트)
```

---

## 🎯 언어 & 지역화

### 8-1. 사용자별 언어 설정

| 역할 | 인터페이스 | 데이터 |
|------|----------|--------|
| 현장 직원 | 영어 / 타밀어 | 영어 (데이터 입수) |
| 팀 리더 | 영어 | 영어 |
| 부장급 관리자 | 한국어 / 영어 | 한국어 (보고서) |
| CFO | 한국어 | 한국어 (재무 보고) |

**구현:**
- expense_master: code_name_en, code_name_ta, code_name_ko
- API 응답: Accept-Language 헤더 또는 user.language 설정
- UI: next-intl 또는 gettext 활용

---

## 📝 다음 단계 (웹개발자)

**web-builder#3 구현 예상:**
1. **DB 마이그레이션** (db/48_expense_master_module.sql 작성 & 실행) — 2h
2. **API 엔드포인트 구현** (14개) — 10h
   - 거래 대장 CRUD (6개)
   - 마스터 조회 (2개)
   - 검증 게이트 (3개)
   - 분석 & 보고 (2개)
3. **React 컴포넌트** (11개) — 8h
   - 트리 뷰, 거래 리스트, 검증 패널, 분석 뷰
   - 파일 업로드, 모달, 차트
4. **검증 규칙 엔진** (프롬프트 5-3 통합) — 3h
5. **통합 테스트** (9개 케이스) — 4h
6. **배포 & 최적화** (Vercel, 성능 튜닝) — 2h

**예상 마감:** 2026-06-18 18:00 KST

---

## 🔗 참고 문서

- **생산성 보고서 설계:** db/40_fms_portals.sql
- **Asset Master:** db/01~30 마이그레이션 시리즈
- **Team Dashboard:** app/team/*, app/api/team-dashboard/*
- **프롬프트 5-1 (입수/정규화/검증):** [별도 제공 예정]
- **프롬프트 5-3 (검증 게이트):** [별도 제공 예정]

---

**작성자:** Web App Designer / Planner  
**작성일:** 2026-06-12 17:30 KST  
**상태:** ✅ READY_FOR_IMPLEMENTATION  
**다음 리뷰:** 웹개발자 인계 전
