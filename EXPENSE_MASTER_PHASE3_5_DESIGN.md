---
name: Expense Master Phase 3-5 종합 설계서
description: 경비 시스템 고급 기능 (분석, 보고, KPI, 역사 보호, 최적화)
type: design
version: 1.0
created: 2026-06-12 21:40 KST
status: READY_FOR_IMPLEMENTATION
owner: Web App Designer / Planner
deadline: 2026-06-12 23:59 KST
---

# Expense Master Phase 3-5 종합 설계서

**목표:** Expense Master의 고급 기능 완성 (Phase 1-2 입수/정규화/검증 기반)  
**대상:** DSC Mannur 경비 시스템 모든 사용자 (현장 직원 ~ CFO)  
**플랫폼:** Next.js 14 + Supabase + Vercel  
**의존성:** Phase 1-2 (db/48 완료), Asset Master (db/01~30), 생산성 데이터  
**예상 공수:** 45-50시간 (설계:5h + 개발:35h + 테스트:10h)  
**예상 마감:** 2026-06-19 18:00 KST

---

## 📋 프로젝트 범위

### Phase 3-5 구성 요소

```
Expense Master Phase Roadmap
├─ Phase 1-2: 입수/정규화/검증 ✅ (db/48 기반, 설계 완료)
│
├─ Phase 3: 월별 분석 보고서 (NEW)
│  ├─ API: /api/expense/report/monthly (향상)
│  ├─ API: /api/expense/report/trend
│  ├─ UI: AnalysisPage, MonthlyReportPage
│  └─ 특징: 코드별/기계별/공급자별 분석, 예측
│
├─ Phase 4: 과거月 변경 감지 & 승인 (NEW)
│  ├─ API: /api/expense/history-drift
│  ├─ API: /api/expense/audit-trail
│  ├─ UI: HistoryDriftApprovalPage
│  └─ 특징: 변경 추적, 감사 로그, 트랜잭션 무결성
│
├─ Phase 5: KPI 대시보드 & 경보 (NEW)
│  ├─ API: /api/expense/kpi/alerts
│  ├─ API: /api/expense/kpi/benchmarks
│  ├─ UI: KPIDashboardPage, AlertPanel
│  └─ 특징: 실시간 KPI, 이상 탐지, 원단위 추적
│
└─ Phase 6: 성능 최적화 & 자동화 (NEW)
   ├─ 캐싱 전략 (Redis, Query cache)
   ├─ 배경 작업 (월말 처리, 보고서 생성)
   ├─ 성능 튜닝 (인덱싱, 파티션 최적화)
   └─ 자동화 규칙 (반복 거래, 예산 경보)
```

---

## 🗄️ Database Schema 확장 (db/48 기반)

### 3-1. expense_trend_analysis (새로운 테이블)

```sql
CREATE TABLE IF NOT EXISTS expense_trend_analysis (
  id BIGSERIAL PRIMARY KEY,
  
  -- 기간
  period_month VARCHAR(7) NOT NULL,
  
  -- 트렌드 정보
  expense_code VARCHAR(10) NOT NULL REFERENCES expense_master(code),
  metric_type VARCHAR(50),                -- 'MONTHLY'|'QUARTERLY'|'YTD'
  
  -- 계산 값
  trend_direction VARCHAR(20),            -- 'UP'|'DOWN'|'STABLE'
  trend_percent DECIMAL(5,2),             -- 전월 대비 %
  moving_avg_3m DECIMAL(15,2),            -- 3개월 이동평균
  moving_avg_12m DECIMAL(15,2),           -- 12개월 이동평균
  
  -- 예측
  forecast_next_month DECIMAL(15,2),      -- 다음月 예상값
  forecast_confidence DECIMAL(3,2),       -- 신뢰도 (0.0~1.0)
  
  -- 메타
  calculation_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_trend_period ON expense_trend_analysis(period_month);
CREATE INDEX idx_trend_code ON expense_trend_analysis(expense_code);
CREATE INDEX idx_trend_metric ON expense_trend_analysis(metric_type);
```

### 3-2. expense_audit_trail (감사 추적)

```sql
CREATE TABLE IF NOT EXISTS expense_audit_trail (
  id BIGSERIAL PRIMARY KEY,
  
  -- 이벤트
  event_type VARCHAR(50) NOT NULL,        -- 'INSERT'|'UPDATE'|'DELETE'|'APPROVE'|'DRIFT_DETECT'
  transaction_id BIGINT REFERENCES expense_ledgers(id),
  
  -- 상세
  action_by UUID NOT NULL REFERENCES auth.users(id),
  action_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 변경 전/후 (JSON)
  previous_state JSONB,
  new_state JSONB,
  changed_fields TEXT[],                   -- 변경 필드 배열
  
  -- 컨텍스트
  ip_address INET,
  user_agent TEXT,
  
  -- 승인 (UPDATE/DELETE 시)
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approval_comment TEXT,
  
  -- 메타
  is_anomaly BOOLEAN DEFAULT false,        -- 이상 탐지 플래그
  anomaly_reason TEXT
);

-- 인덱스
CREATE INDEX idx_audit_event_type ON expense_audit_trail(event_type);
CREATE INDEX idx_audit_transaction ON expense_audit_trail(transaction_id);
CREATE INDEX idx_audit_action_by ON expense_audit_trail(action_by);
CREATE INDEX idx_audit_action_at ON expense_audit_trail(action_at);
CREATE INDEX idx_audit_anomaly ON expense_audit_trail(is_anomaly);
```

### 3-3. expense_kpi_alerts (실시간 경보)

```sql
CREATE TABLE IF NOT EXISTS expense_kpi_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 경보 규칙
  alert_type VARCHAR(50),                 -- 'BUDGET_EXCEED'|'ANOMALY'|'DEVIATION'|'MISSING_DATA'
  severity VARCHAR(20),                   -- 'INFO'|'WARNING'|'CRITICAL'
  
  -- 대상
  period_month VARCHAR(7) NOT NULL,
  expense_code VARCHAR(10) REFERENCES expense_master(code),
  
  -- 상세
  threshold_value DECIMAL(15,2),
  actual_value DECIMAL(15,2),
  variance_percent DECIMAL(5,2),
  
  message_en TEXT,
  message_ko TEXT,
  
  -- 상태
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  
  action_taken TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                  -- 경보 유효 기간
);

-- 인덱스
CREATE INDEX idx_alert_type ON expense_kpi_alerts(alert_type);
CREATE INDEX idx_alert_period ON expense_kpi_alerts(period_month);
CREATE INDEX idx_alert_severity ON expense_kpi_alerts(severity);
CREATE INDEX idx_alert_ack ON expense_kpi_alerts(is_acknowledged);
```

### 3-4. expense_benchmark (벤치마크 데이터)

```sql
CREATE TABLE IF NOT EXISTS expense_benchmark (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기준값
  expense_code VARCHAR(10) NOT NULL UNIQUE REFERENCES expense_master(code),
  
  -- 산업 표준 (외부 소스 또는 수동 입력)
  industry_benchmark DECIMAL(15,2),       -- 업계 평균
  dsc_historical_avg DECIMAL(15,2),       -- DSC 3년 평균
  dsc_best_month DECIMAL(15,2),
  dsc_worst_month DECIMAL(15,2),
  
  -- KPI 기준
  unit_consumption_std DECIMAL(10,4),     -- 표준 원단위
  variance_tolerance DECIMAL(5,2),        -- 허용 차이 (%)
  
  -- 메모
  benchmark_date DATE,
  notes TEXT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_benchmark_code ON expense_benchmark(expense_code);
```

### 3-5. expense_schedule (반복 거래/예산 일정)

```sql
CREATE TABLE IF NOT EXISTS expense_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 일정 정보
  name VARCHAR(255) NOT NULL,
  expense_code VARCHAR(10) NOT NULL REFERENCES expense_master(code),
  
  -- 빈도
  recurrence_type VARCHAR(50),            -- 'MONTHLY'|'QUARTERLY'|'ANNUAL'|'CUSTOM'
  recurrence_day INT,                     -- 매월 N일 (1-31)
  
  -- 금액
  scheduled_amount DECIMAL(15,2),
  
  -- 활성화
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,                          -- NULL = 무기한
  
  -- 템플릿
  machine_code VARCHAR(50),               -- 일반적인 기계
  supplier_name VARCHAR(255),
  part_name VARCHAR(255),
  remarks TEXT,
  
  -- 추적
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_schedule_code ON expense_schedule(expense_code);
CREATE INDEX idx_schedule_active ON expense_schedule(is_active);
CREATE INDEX idx_schedule_recurrence ON expense_schedule(recurrence_type);
```

### 3-6. 트리거 추가 (KPI 실시간 업데이트)

```sql
-- expense_ledgers 변경 시 KPI 경보 자동 생성
CREATE OR REPLACE FUNCTION check_kpi_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_actual DECIMAL(15,2);
  v_plan DECIMAL(15,2);
  v_variance_pct DECIMAL(5,2);
  v_benchmark DECIMAL(15,2);
BEGIN
  -- 월간 실적 계산
  SELECT SUM(total_amount)
  INTO v_actual
  FROM expense_ledgers
  WHERE period_month = NEW.period_month
  AND expense_code = NEW.expense_code;

  -- 계획과 비교
  SELECT monthly_plan INTO v_plan
  FROM expense_master
  WHERE code = NEW.expense_code;

  IF v_plan > 0 THEN
    v_variance_pct := ((v_actual - v_plan) / v_plan) * 100;
    
    -- 계획 초과 경보
    IF v_variance_pct > 15 THEN
      INSERT INTO expense_kpi_alerts (
        alert_type, severity, period_month, expense_code,
        threshold_value, actual_value, variance_percent,
        message_ko, expires_at
      ) VALUES (
        'BUDGET_EXCEED', 
        CASE WHEN v_variance_pct > 30 THEN 'CRITICAL' ELSE 'WARNING' END,
        NEW.period_month, NEW.expense_code,
        v_plan, v_actual, v_variance_pct,
        '예산 초과: ' || NEW.expense_code || ' (' || ROUND(v_variance_pct, 1) || '%)',
        NOW() + INTERVAL '30 days'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_kpi_alert_check
  AFTER INSERT OR UPDATE ON expense_ledgers
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' OR NEW.status = 'FINAL')
  EXECUTE FUNCTION check_kpi_alerts();
```

---

## 🔌 API 엔드포인트 (Phase 3-5 신규)

### Phase 3: 월별 분석 보고서

#### 1️⃣ GET /api/expense/report/monthly-detailed

**목적:** 월별 상세 분석 보고서 (코드별, 기계별, 공급자별 분석)  
**권한:** authenticated  
**쿼리 파라미터:**
- `month` (필수): YYYY-MM
- `drill_down_by` (선택): code|machine|supplier|problem
- `format` (기본: json): json|csv|pdf

**응답 200:**
```json
{
  "period": "2026-06",
  "summary": {
    "total_expense": 2845600,
    "total_plan": 3000000,
    "variance_amount": -154400,
    "variance_percent": -5.1,
    "status": "UNDER_PLAN"
  },
  "code_breakdown": [
    {
      "code": "1.1",
      "name": "R&M - Parts Purchase",
      "amount": 450000,
      "plan": 500000,
      "variance_pct": -10,
      "transaction_count": 34,
      "top_machines": [
        {
          "machine_code": "ML-2001",
          "amount": 125000,
          "part_name": "Hydraulic Seal"
        }
      ]
    }
  ],
  "machine_analysis": [
    {
      "machine_code": "ML-2001",
      "cost": 250000,
      "code_distribution": {
        "1.1": 125000,
        "1.2": 85000,
        "1.6": 40000
      }
    }
  ],
  "supplier_analysis": [
    {
      "supplier_name": "SUPPLIER_A",
      "amount": 850000,
      "transaction_count": 42,
      "top_parts": [...],
      "payment_days_avg": 15
    }
  ],
  "trend": {
    "direction": "UP",
    "percent_vs_prev_month": 12.3,
    "moving_avg_3m": 2600000,
    "forecast_next_month": 2950000
  }
}
```

**Implementation Time:** 6 hours

---

#### 2️⃣ GET /api/expense/report/trend

**목적:** 트렌드 분석 (3개월, 12개월, 3년)  
**쿼리 파라미터:**
- `code` (필수): 경비 코드 또는 ALL
- `period` (기본: 12m): 3m|6m|12m|36m
- `metric` (기본: amount): amount|count|unit_cost

**응답 200:**
```json
{
  "code": "1.1",
  "period": "12m",
  "data": [
    {
      "month": "2025-06",
      "amount": 380000,
      "count": 28,
      "plan": 450000,
      "benchmark": 400000
    },
    {
      "month": "2025-07",
      "amount": 410000,
      "count": 31,
      "plan": 450000,
      "benchmark": 400000
    }
  ],
  "statistics": {
    "average": 420000,
    "max": 490000,
    "min": 350000,
    "std_dev": 35000,
    "trend_line_slope": 2500,   // 월평 증가분
    "forecast_next_month": 435000,
    "confidence_interval": {
      "lower_95": 410000,
      "upper_95": 460000
    }
  }
}
```

**Implementation Time:** 5 hours

---

### Phase 4: 과거月 변경 감지 & 승인

#### 3️⃣ GET /api/expense/history-drift

**목적:** 과거月 거래 변경 감지 목록  
**권한:** admin, manager  
**쿼리 파라미터:**
- `status` (기본: pending): pending|approved|rejected
- `period_from`, `period_to` (날짜 범위)
- `severity` (선택): high|medium|low

**응답 200:**
```json
{
  "total_count": 12,
  "pending_count": 5,
  "drifts": [
    {
      "id": "drift-001",
      "transaction_id": 12345,
      "period_month": "2026-04",
      "changed_by": "user@dsc.com",
      "detected_at": "2026-06-12T15:30:00Z",
      "changed_fields": ["quantity", "unit_price", "total_amount"],
      "previous_snapshot": {
        "quantity": 2,
        "unit_price": 5000,
        "total_amount": 10000
      },
      "new_snapshot": {
        "quantity": 3,
        "unit_price": 4500,
        "total_amount": 13500
      },
      "variance_amount": 3500,
      "change_reason": "Correction after invoice review",
      "status": "PENDING",
      "requires_approval": true
    }
  ]
}
```

**Implementation Time:** 5 hours

---

#### 4️⃣ POST /api/expense/history-drift/:driftId/approve

**목적:** 과거月 변경 승인/거절  
**권한:** admin  
**요청 바디:**
```json
{
  "action": "approve",  // or "reject"
  "approval_comment": "Verified against invoice #INV-2026-04-001",
  "justification": "기술팀 확인 완료"
}
```

**응답 200:**
```json
{
  "drift_id": "drift-001",
  "status": "APPROVED",
  "approved_by": "manager@dsc.com",
  "approved_at": "2026-06-12T16:00:00Z",
  "transaction_updated": true,
  "audit_entry_id": "audit-5001"
}
```

**Side Effects:**
- expense_ledgers 행 실제 업데이트 (ROLLBACK 없음)
- expense_audit_trail 기록
- Slack 알림 (승인자에게)

**Implementation Time:** 4 hours

---

#### 5️⃣ GET /api/expense/audit-trail

**목적:** 전체 감사 로그 (모든 변경 추적)  
**권한:** admin  
**쿼리 파라미터:**
- `period_from`, `period_to` (필수)
- `user_id` (선택)
- `event_type` (선택): INSERT|UPDATE|DELETE|APPROVE
- `anomaly_only` (기본: false)

**응답 200:**
```json
{
  "period": "2026-06",
  "total_events": 487,
  "anomaly_count": 3,
  "events": [
    {
      "id": "audit-1001",
      "event_type": "UPDATE",
      "transaction_id": 12345,
      "action_by": "user@dsc.com",
      "action_at": "2026-06-12T15:30:00Z",
      "changed_fields": ["quantity", "total_amount"],
      "previous_state": {"quantity": 2},
      "new_state": {"quantity": 3},
      "requires_approval": false,
      "approved_by": "manager@dsc.com",
      "is_anomaly": false
    },
    {
      "id": "audit-1002",
      "event_type": "INSERT",
      "transaction_id": 12346,
      "action_by": "system",
      "action_at": "2026-06-12T14:00:00Z",
      "is_anomaly": true,
      "anomaly_reason": "거래 금액 이전月 대비 450% 증가",
      "is_acknowledged": true,
      "acknowledged_by": "manager@dsc.com"
    }
  ]
}
```

**Implementation Time:** 4 hours

---

### Phase 5: KPI 대시보드 & 경보

#### 6️⃣ GET /api/expense/kpi/dashboard

**목적:** 실시간 KPI 대시보드  
**쿼리 파라미터:**
- `month` (기본: current): YYYY-MM|current|ytd
- `include_alerts` (기본: true)

**응답 200:**
```json
{
  "period_month": "2026-06",
  "generated_at": "2026-06-12T21:40:00Z",
  "summary": {
    "total_expense": 2845600,
    "plan": 3000000,
    "budget": 5000000,
    "variance_vs_plan": -5.1,
    "variance_vs_budget": -43.1,
    "burn_rate": 0.569  // YTD spend / YTD days elapsed
  },
  "kpis": {
    "r_and_m": {
      "amount": 1200000,
      "plan": 1300000,
      "variance_pct": -7.7,
      "unit_consumption": 2.4,
      "unit_benchmark": 2.2,
      "variance_unit_pct": 9.1,
      "rank": "ABOVE_EXPECTED"
    },
    "consumable": {
      "amount": 450000,
      "plan": 500000,
      "variance_pct": -10,
      "unit_consumption": 0.9,
      "unit_benchmark": 0.85,
      "variance_unit_pct": 5.9,
      "rank": "ACCEPTABLE"
    }
  },
  "alerts": [
    {
      "alert_id": "alert-001",
      "type": "BUDGET_EXCEED",
      "severity": "WARNING",
      "code": "2.1",
      "message": "소모품 비용이 계획을 17% 초과했습니다",
      "created_at": "2026-06-12T14:30:00Z",
      "is_acknowledged": false
    },
    {
      "alert_id": "alert-002",
      "type": "ANOMALY",
      "severity": "INFO",
      "code": "1.1",
      "message": "R&M 구매 거래 수가 평년의 140%입니다 (28 → 39건)",
      "is_acknowledged": true
    }
  ],
  "forecast": {
    "end_of_month_projected": 2950000,
    "ytd_projected_eoy": 18900000,
    "vs_annual_budget": -5.2,
    "confidence": 0.85
  }
}
```

**Implementation Time:** 7 hours

---

#### 7️⃣ GET /api/expense/kpi/alerts

**목적:** 실시간 경보 조회 & 관리  
**쿼리 파라미터:**
- `severity` (선택): INFO|WARNING|CRITICAL
- `acknowledged` (기본: false)
- `limit` (기본: 20)

**응답 200:**
```json
{
  "total_alerts": 47,
  "active_alerts": 12,
  "critical_count": 2,
  "warning_count": 5,
  "info_count": 5,
  "alerts": [
    {
      "id": "alert-001",
      "alert_type": "BUDGET_EXCEED",
      "severity": "CRITICAL",
      "code": "1.6",
      "period": "2026-06",
      "threshold": 800000,
      "actual": 920000,
      "variance_pct": 15,
      "message_ko": "공장유지비가 예산을 15% 초과했습니다",
      "created_at": "2026-06-12T10:00:00Z",
      "expires_at": "2026-07-12T10:00:00Z",
      "is_acknowledged": false,
      "recommendations": [
        "비상 수리 항목 검토",
        "다음月 예산 조정 예정"
      ]
    }
  ]
}
```

**Implementation Time:** 4 hours

---

#### 8️⃣ POST /api/expense/kpi/alerts/:alertId/acknowledge

**목적:** 경보 확인 (dismissed)  
**권한:** authenticated  
**요청 바디:**
```json
{
  "action_taken": "예산 조정 완료",
  "notes": "비상 수리 항목 재검토 및 비용 절감 조치"
}
```

**응답 200:**
```json
{
  "alert_id": "alert-001",
  "is_acknowledged": true,
  "acknowledged_by": "manager@dsc.com",
  "acknowledged_at": "2026-06-12T16:30:00Z"
}
```

**Implementation Time:** 2 hours

---

### Phase 6: 성능 최적화 & 자동화

#### 9️⃣ GET /api/expense/kpi/benchmarks

**목적:** 벤치마크 데이터 조회 & 관리  
**권한:** admin  
**쿼리 파라미터:**
- `code` (선택): 특정 코드만

**응답 200:**
```json
{
  "benchmarks": [
    {
      "code": "1.1",
      "industry_benchmark": 450000,
      "dsc_historical_avg": 420000,
      "dsc_best_month": 350000,
      "dsc_worst_month": 520000,
      "unit_consumption_std": 2.2,
      "variance_tolerance": 10,
      "benchmark_date": "2026-01-01",
      "last_updated": "2026-06-12"
    }
  ]
}
```

**Implementation Time:** 3 hours

---

#### 🔟 POST /api/expense/schedule

**목적:** 반복 거래 일정 생성/관리 (자동화)  
**권한:** admin  
**요청 바디:**
```json
{
  "name": "Monthly Grease Consumption",
  "expense_code": "2.1",
  "recurrence_type": "MONTHLY",
  "recurrence_day": 1,
  "scheduled_amount": 50000,
  "machine_code": "ALL",
  "supplier_name": "SUPPLIER_A",
  "part_name": "Industrial Grease ISO VG 32",
  "start_date": "2026-06-01",
  "end_date": null,
  "remarks": "Auto-generated on 1st of each month"
}
```

**응답 201:**
```json
{
  "id": "sched-001",
  "status": "created",
  "first_trigger_date": "2026-07-01"
}
```

**Side Effects:**
- 월 1일 자동으로 expense_ledgers 행 생성
- 금액은 historical avg 기반 자동 조정
- 수동 승인 또는 자동 최종화 (설정 기반)

**Implementation Time:** 5 hours

---

#### 1️⃣1️⃣ POST /api/expense/batch-process

**목적:** 월말 배치 처리 (월 마감 자동화)  
**권한:** admin  
**요청 바디:**
```json
{
  "month": "2026-06",
  "process_type": "month_end",
  "actions": [
    "finalize_pending_transactions",
    "calculate_kpi",
    "generate_monthly_report",
    "detect_anomalies",
    "send_summary_email"
  ]
}
```

**응답 201:**
```json
{
  "job_id": "batch-20260612-001",
  "status": "processing",
  "progress": {
    "finalized_transactions": 156,
    "kpi_calculated": true,
    "report_generated": false,
    "anomalies_detected": 3
  },
  "estimated_completion": "2026-06-12T22:00:00Z"
}
```

**Async Processing:**
- Background worker 실행
- Redis queue 사용 (Bullmq)
- 진행 상황 웹소켓으로 실시간 전송

**Implementation Time:** 6 hours

---

## 🎨 UI/UX 컴포넌트 (Phase 3-5)

### Phase 3: 분석 대시보드

#### 컴포넌트: MonthlyAnalysisPage

```typescript
interface MonthlyAnalysisPageProps {
  month: string;  // YYYY-MM
  drillDownBy?: 'code' | 'machine' | 'supplier';
}

// 렌더링:
// 1. 요약 카드 (총액, 계획 대비, 전월 대비, 예측)
// 2. 트렌드 차트 (12개월 라인 + 이동평균)
// 3. 코드별 분석 (파이/도넛 + 테이블)
// 4. 기계별 분석 (상위 10개)
// 5. 공급자별 분석 (파레토 차트)
// 6. 문제 분류 (드릴다운)
// 7. 예측 & 경보
```

**Implementation Location:** `/dsc-fms-portal/app/expense/analysis/page.tsx`  
**Implementation Time:** 7 hours

---

### Phase 4: 과거月 변경 승인

#### 컴포넌트: HistoryDriftApprovalPage

```typescript
interface HistoryDriftApprovalPageProps {
  status?: 'pending' | 'approved' | 'rejected';
}

// 렌더링:
// 1. 필터 패널 (상태, 심각도, 기간)
// 2. 변경 목록 (카드 형식)
//    - 트랜잭션 기본 정보
//    - 변경 필드 강조 (before/after 비교)
//    - 변경자, 시간, 사유
// 3. 비교 모달
//    - 좌측: 이전값
//    - 우측: 새값
//    - 차이 하이라이팅
// 4. 승인/거절 버튼
// 5. 승인 코멘트 (선택사항)
```

**Implementation Location:** `/dsc-fms-portal/app/expense/history-drift/page.tsx`  
**Implementation Time:** 5 hours

---

### Phase 5: KPI 대시보드

#### 컴포넌트: KPIDashboardPage

```typescript
interface KPIDashboardPageProps {
  month?: string;
  include_alerts?: boolean;
}

// 렌더링:
// 1. 요약 KPI 카드 (4개)
//    - Total Expense | vs Plan | vs Budget | Burn Rate
// 2. 코드별 KPI 그리드 (7개 코드)
//    - 각 카드: 금액, 계획 대비, 원단위, 지표(색상)
// 3. 경보 패널 (상단 오른쪽)
//    - CRITICAL (빨강), WARNING (주황), INFO (파랑)
//    - 각 경보 클릭 시 상세 보기
// 4. 월말 예측 (하단)
//    - 예상 결산액, 신뢰도, 차이분석
// 5. 트렌드 스파크라인 (각 코드 옆)
//    - 12개월 미니 차트
```

**Implementation Location:** `/dsc-fms-portal/app/expense/dashboard/page.tsx`  
**Implementation Time:** 8 hours

---

#### 컴포넌트: AlertPanel

```typescript
interface AlertPanelProps {
  alerts: ExpenseKPIAlert[];
  onAcknowledge: (alertId: string) => Promise<void>;
}

// 렌더링:
// 1. 경보 목록 (스크롤 가능)
// 2. 각 경보 카드:
//    - 아이콘 (심각도별 색상)
//    - 제목 + 메시지 (한글)
//    - 메타정보 (시간, 만료일)
//    - 권장 조치사항 (bullet points)
// 3. [확인] 버튼
// 4. 필터 탭 (CRITICAL | WARNING | INFO)
```

**Implementation Time:** 4 hours

---

### Phase 6: 성능 & 자동화

#### 컴포넌트: ScheduleManagementPage

```typescript
interface ScheduleManagementPageProps {
  expenseCode?: string;
}

// 렌더링:
// 1. 반복 일정 테이블
// 2. 새 일정 추가 폼
// 3. 활성화/비활성화 토글
// 4. 다음 트리거 날짜 표시
// 5. 편집/삭제 버튼
```

**Implementation Location:** `/dsc-fms-portal/app/expense/schedule/page.tsx`  
**Implementation Time:** 4 hours

---

## 📊 데이터 흐름 다이어그램

```
Phase 3: 분석 보고서
┌──────────────────────────────────┐
│ expense_ledgers (최종化 거래)    │
├──────────────────────────────────┤
│ ↓                                │
│ 집계 쿼리 실행                   │
│ (SUM, AVG, COUNT by code/machine)│
├──────────────────────────────────┤
│ ↓                                │
│ expense_kpi 캐시 갱신             │
├──────────────────────────────────┤
│ ↓                                │
│ MonthlyAnalysisPage 렌더링       │
│ (코드별, 기계별, 공급자별 분석)  │
└──────────────────────────────────┘

Phase 4: 감사 추적
┌──────────────────────────────────┐
│ 사용자가 거래 수정 시도           │
├──────────────────────────────────┤
│ ↓                                │
│ period_month < NOW() 확인         │
│ → 과거月이면 트리거               │
├──────────────────────────────────┤
│ ↓                                │
│ expense_history_drift 레코드 삽입 │
│ (before/after snapshot 저장)     │
├──────────────────────────────────┤
│ ↓                                │
│ Slack 알림 (관리자)               │
├──────────────────────────────────┤
│ ↓                                │
│ expense_audit_trail 레코드 삽입   │
│ (이벤트 로그)                    │
└──────────────────────────────────┘

Phase 5: KPI 경보
┌──────────────────────────────────┐
│ expense_ledgers INSERT/UPDATE     │
│ (APPROVED/FINAL 상태)             │
├──────────────────────────────────┤
│ ↓                                │
│ TR: check_kpi_alerts 트리거       │
├──────────────────────────────────┤
│ ↓                                │
│ 월간 실적 vs 계획 비교             │
├──────────────────────────────────┤
│ ↓                                │
│ 임계값 초과 시                    │
│ expense_kpi_alerts 행 생성        │
├──────────────────────────────────┤
│ ↓                                │
│ KPIDashboardPage에 경보 표시      │
│ (실시간 또는 폴링)                │
└──────────────────────────────────┘

Phase 6: 자동화
┌──────────────────────────────────┐
│ 매월 1일 정시 (Cron Job)          │
├──────────────────────────────────┤
│ ↓                                │
│ expense_schedule 테이블 조회      │
│ (recurrence_day = 1)             │
├──────────────────────────────────┤
│ ↓                                │
│ 반복 거래 자동 생성               │
│ (expense_ledgers 행 INSERT)      │
├──────────────────────────────────┤
│ ↓                                │
│ 월말 배치 처리 (27일 정시)        │
├──────────────────────────────────┤
│ ↓                                │
│ 1. 미완료 거래 최종化             │
│ 2. KPI 계산 & 캐시 갱신           │
│ 3. 월간 보고서 생성               │
│ 4. 이상치 탐지                   │
│ 5. 관리자 이메일 발송             │
└──────────────────────────────────┘
```

---

## 📅 구현 타임라인

### Phase 3: 월별 분석 (2026-06-13 ~ 2026-06-15)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **DB:** expense_trend_analysis 테이블 생성 | DBA | 1h | 2026-06-13 09:00 |
| **API #1-2:** 분석 보고서 엔드포인트 | Backend | 11h | 2026-06-14 18:00 |
| **UI:** MonthlyAnalysisPage + 차트 | Frontend | 7h | 2026-06-15 12:00 |
| **Test:** E2E 분석 보고서 | QA | 4h | 2026-06-15 18:00 |

**Milestone:** Phase 3 완료 2026-06-15 18:00 ✅

---

### Phase 4: 감사 추적 (2026-06-15 ~ 2026-06-17)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **DB:** expense_audit_trail 테이블 + 트리거 | DBA | 2h | 2026-06-15 16:00 |
| **API #3-5:** 감사 추적 엔드포인트 | Backend | 13h | 2026-06-16 18:00 |
| **UI:** HistoryDriftApprovalPage | Frontend | 5h | 2026-06-17 09:00 |
| **Test:** 과거月 변경 + 승인 플로우 | QA | 3h | 2026-06-17 14:00 |

**Milestone:** Phase 4 완료 2026-06-17 14:00 ✅

---

### Phase 5: KPI & 경보 (2026-06-17 ~ 2026-06-19)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **DB:** expense_kpi_alerts + 트리거 | DBA | 1.5h | 2026-06-17 11:00 |
| **API #6-8:** KPI & 경보 엔드포인트 | Backend | 13h | 2026-06-18 18:00 |
| **UI:** KPIDashboardPage + AlertPanel | Frontend | 12h | 2026-06-19 12:00 |
| **Test:** 경보 생성 & 확인 플로우 | QA | 3h | 2026-06-19 18:00 |

**Milestone:** Phase 5 완료 2026-06-19 18:00 ✅

---

### Phase 6: 자동화 & 최적화 (2026-06-18 ~ 2026-06-20)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **DB:** expense_schedule + expense_benchmark | DBA | 1.5h | 2026-06-18 09:00 |
| **API #9-11:** 자동화 엔드포인트 | Backend | 11h | 2026-06-19 18:00 |
| **UI:** ScheduleManagementPage | Frontend | 4h | 2026-06-20 10:00 |
| **Cron:** 월 1일/27일 자동화 스크립트 | DevOps | 3h | 2026-06-20 12:00 |
| **Performance:** 캐싱 & 인덱싱 최적화 | Backend | 5h | 2026-06-20 16:00 |
| **Test:** 전체 통합 & 부하 테스트 | QA | 4h | 2026-06-20 20:00 |

**Milestone:** Phase 6 완료 2026-06-20 20:00 ✅

---

## ✅ 성공 기준

### Database Layer
- [ ] 4개 신규 테이블 생성 + RLS 정책
- [ ] 모든 인덱스 생성 (성능 검증)
- [ ] 트리거 자동 실행 확인
- [ ] 파티션 전략 (월별) 검증

### API Layer
- [ ] 11개 엔드포인트 모두 구현
- [ ] 에러 처리 (401/403/404/500)
- [ ] 페이지네이션 & 필터링 (모든 LIST API)
- [ ] 비동기 처리 (배치, 스케줄)
- [ ] E2E 테스트 > 95% 커버리지

### UI Layer
- [ ] 5개 주요 페이지 완성
- [ ] 모바일 반응형 (600px+)
- [ ] 실시간 경보 표시 (Polling 또는 WebSocket)
- [ ] 데이터 내보내기 (CSV, PDF)
- [ ] 로딩 상태 UI (Skeleton, 진행률)

### 성능
- [ ] 분석 쿼리 < 1초 (100k+ 행)
- [ ] 대시보드 초기 로드 < 2초
- [ ] 차트 렌더링 부드러움 (30fps 이상)
- [ ] 메모리 사용량 최적화 (< 200MB)

### 자동화
- [ ] Cron 월 1일 트리거 정상 작동
- [ ] 월말 배치 처리 완전 자동화
- [ ] 에러 발생 시 로그 & 재시도
- [ ] 관리자 이메일/Slack 알림 정상 발송

---

## 🔗 의존성 & 블로킹 항목

### 선행 조건
- ✅ Phase 1-2 완료 (db/48 마이그레이션 완료)
- ✅ Asset Master (db/01~30)
- ✅ 생산성 데이터 (생산량 기반 원단위 계산)

### 병렬 진행 가능
- Phase 3-6 API 개발과 UI 개발은 완전 독립
- 각 Phase별 DB 테이블은 독립적 (no cross-dependencies)

### 외부 의존성
- Vercel 배포 (현재 정상, HTTP 200 > 88h)
- Supabase 성능 (파티션, 인덱싱)
- 생산성 데이터 연동 (productivity_reports 테이블)

---

## 🚀 배포 계획

### Pre-Launch Verification
- [ ] 모든 API 엔드포인트 응답 확인
- [ ] 대시보드 & 분석 페이지 렌더링 테스트
- [ ] 경보 생성 & 확인 플로우 검증
- [ ] 감사 로그 기록 확인
- [ ] 자동화 스크립트 드라이 런

### Rollout Schedule
- **2026-06-13:** Phase 3 시작
- **2026-06-15:** Phase 3 완료, Phase 4 시작
- **2026-06-17:** Phase 4 완료, Phase 5 시작
- **2026-06-19:** Phase 5 완료, Phase 6 시작
- **2026-06-20:** Phase 6 완료, 전체 통합 및 배포 ✅

---

## 📝 개발자 가이드

### 주요 기술 스택
- **Backend:** Next.js API Routes + Supabase
- **Frontend:** React 18 + Recharts (차트)
- **Database:** PostgreSQL (파티션, 트리거)
- **Task Queue:** BullMQ (배경 작업)
- **Caching:** Redis + SWR (클라이언트 캐싱)
- **Testing:** Jest + Supertest (API), Cypress (E2E)

### 코드 스타일 & 컨벤션
- TypeScript strict mode
- ESLint + Prettier
- 컴포넌트 폴더별 구조 (layout, list, detail, modals)
- 에러 메시지 한글/영어 함께 (사용자별)

### 성능 최적화 전략
1. **쿼리 최적화:** 파티션, 인덱싱, EXPLAIN ANALYZE
2. **캐싱:** Redis (KPI), SWR (클라이언트)
3. **배치 처리:** BullMQ로 대량 거래 처리
4. **이미지 최적화:** Vercel Image Optimization
5. **코드 분할:** dynamic import for heavy components

---

## 📚 참고 자료

- `/home/jeepney/.openclaw/workspace-dev/EXPENSE_MASTER_DESIGN_SPECIFICATION.md` — Phase 1-2 설계
- `/home/jeepney/.openclaw/workspace-dev/APRIL_EXPENSE_DATA_ANALYSIS.md` — 실제 데이터 분석
- `/home/jeepney/.openclaw/workspace-dev/ASSET_MASTER_PHASE3_6_SPECIFICATION.md` — Asset Master 참조 설계
- `/home/jeepney/.openclaw/workspace-dev/db/48_expense_master_module.sql` — Phase 1-2 DB 스키마

---

**준비 완료:** 2026-06-12 21:40 KST  
**상태:** 🟢 웹개발자 인계 준비 완료  
**예상 공수:** 45-50시간  
**마감:** 2026-06-20 20:00 KST
