---
name: Expense Master Phase 3-5 API 구현 가이드
description: 웹개발자를 위한 11개 API 엔드포인트 상세 구현 스펙
type: developer-guide
version: 1.0
created: 2026-06-12 21:45 KST
status: READY_FOR_IMPLEMENTATION
target: Web Developer (Backend)
---

# Expense Master Phase 3-5 API 구현 가이드

**대상:** Web Developer (Next.js Backend)  
**파일:** 11개 API 엔드포인트 (Phase 3-6)  
**의존성:** db/52_expense_master_phase3_5_schema.sql  
**테스트:** Supertest + Jest  
**시간:** ~35시간 (설계 포함)

---

## 🔧 프로젝트 구조

```
dsc-fms-portal/
├─ app/
│  └─ api/
│     └─ expense/
│        ├─ report/
│        │  ├─ monthly-detailed/
│        │  │  └─ route.ts          [API #1]
│        │  ├─ trend/
│        │  │  └─ route.ts          [API #2]
│        │  ├─ monthly/
│        │  │  └─ route.ts          (기존, Phase 1-2)
│        │  └─ yearly/
│        │     └─ route.ts          (기존)
│        │
│        ├─ history-drift/
│        │  ├─ route.ts             [API #3]
│        │  └─ [driftId]/
│        │     └─ approve/
│        │        └─ route.ts       [API #4]
│        │
│        ├─ audit-trail/
│        │  └─ route.ts             [API #5]
│        │
│        ├─ kpi/
│        │  ├─ dashboard/
│        │  │  └─ route.ts          [API #6]
│        │  ├─ alerts/
│        │  │  ├─ route.ts          [API #7]
│        │  │  └─ [alertId]/
│        │  │     └─ acknowledge/
│        │  │        └─ route.ts    [API #8]
│        │  └─ benchmarks/
│        │     └─ route.ts          [API #9]
│        │
│        └─ schedule/
│           ├─ route.ts             [API #10]
│           ├─ batch-process/
│           │  └─ route.ts          [API #11]
│           └─ [scheduleId]/
│              └─ route.ts          (PUT, DELETE)
│
├─ lib/
│  └─ expense/
│     ├─ api-client.ts              (API 호출 서비스)
│     ├─ kpi-calculator.ts          (KPI 계산 로직)
│     ├─ trend-analyzer.ts          (트렌드 분석)
│     ├─ anomaly-detector.ts        (이상치 탐지)
│     └─ audit-formatter.ts         (감사 로그 포맷팅)
│
└─ __tests__/
   └─ api/
      └─ expense/
         ├─ phase3-report.test.ts
         ├─ phase4-audit.test.ts
         ├─ phase5-kpi.test.ts
         └─ phase6-schedule.test.ts
```

---

## 🔌 API 엔드포인트 상세 스펙

### [API #1] GET /api/expense/report/monthly-detailed

**파일:** `/app/api/expense/report/monthly-detailed/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const drillDownBy = searchParams.get('drill_down_by') || 'code';  // code|machine|supplier|problem
    const format = searchParams.get('format') || 'json';  // json|csv|pdf

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // 1. 월간 총액 & 계획
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('expense_ledgers')
      .select('total_amount, expense_code, status')
      .eq('period_month', month)
      .in('status', ['APPROVED', 'FINAL']);

    const { data: masterData } = await supabase
      .from('expense_master')
      .select('code, code_name_en, monthly_plan');

    // 2. 코드별 분석
    const codeBreakdown = masterData.map(code => {
      const codeTransactions = monthlyData.filter(t => t.expense_code === code.code);
      const amount = codeTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const variance = ((amount - code.monthly_plan) / code.monthly_plan * 100).toFixed(1);

      return {
        code: code.code,
        name: code.code_name_en,
        amount,
        plan: code.monthly_plan,
        variance_pct: parseFloat(variance),
        transaction_count: codeTransactions.length,
        top_machines: getTopMachines(codeTransactions, 3)
      };
    });

    // 3. 기계별 분석 (drill_down_by === 'machine')
    const machineAnalysis = drillDownBy === 'machine' 
      ? getMachineBreakdown(monthlyData)
      : null;

    // 4. 공급자별 분석 (drill_down_by === 'supplier')
    const supplierAnalysis = drillDownBy === 'supplier'
      ? getSupplierBreakdown(monthlyData, supabase)
      : null;

    // 5. 트렌드 (3개월 이동평균)
    const { data: trendData } = await supabase
      .from('expense_trend_analysis')
      .select('trend_direction, trend_percent, moving_avg_3m, moving_avg_12m, forecast_next_month')
      .eq('period_month', month)
      .eq('metric_type', 'MONTHLY')
      .single();

    // 6. 응답 구성
    const summary = {
      total_expense: codeBreakdown.reduce((sum, c) => sum + c.amount, 0),
      total_plan: codeBreakdown.reduce((sum, c) => sum + c.plan, 0),
      variance_amount: 0,  // 계산 필요
      variance_percent: 0,
      status: 'UNDER_PLAN'  // 또는 'OVER_PLAN'
    };

    summary.variance_amount = summary.total_expense - summary.total_plan;
    summary.variance_percent = (summary.variance_amount / summary.total_plan * 100).toFixed(1);
    summary.status = summary.variance_amount > 0 ? 'OVER_PLAN' : 'UNDER_PLAN';

    const response = {
      period: month,
      summary,
      code_breakdown: codeBreakdown,
      machine_analysis: machineAnalysis,
      supplier_analysis: supplierAnalysis,
      trend: trendData,
      generated_at: new Date().toISOString()
    };

    // CSV 또는 PDF 변환
    if (format === 'csv') {
      return generateCSV(response);
    } else if (format === 'pdf') {
      return generatePDF(response);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in monthly-detailed report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// 헬퍼 함수
function getTopMachines(transactions, limit = 3) {
  const machines = {};
  transactions.forEach(t => {
    if (!machines[t.machine_code]) {
      machines[t.machine_code] = { count: 0, amount: 0 };
    }
    machines[t.machine_code].amount += t.total_amount;
    machines[t.machine_code].count++;
  });

  return Object.entries(machines)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, limit)
    .map(([code, data]) => ({
      machine_code: code,
      amount: data.amount,
      count: data.count
    }));
}

function getMachineBreakdown(transactions) {
  const machines = {};
  transactions.forEach(t => {
    if (!machines[t.machine_code]) {
      machines[t.machine_code] = { cost: 0, codes: {} };
    }
    machines[t.machine_code].cost += t.total_amount;
    machines[t.machine_code].codes[t.expense_code] = 
      (machines[t.machine_code].codes[t.expense_code] || 0) + t.total_amount;
  });

  return Object.entries(machines).map(([code, data]) => ({
    machine_code: code,
    cost: data.cost,
    code_distribution: data.codes
  }));
}

async function getSupplierBreakdown(transactions, supabase) {
  // 공급자별 거래 합계
  const suppliers = {};
  transactions.forEach(t => {
    if (!suppliers[t.supplier_name]) {
      suppliers[t.supplier_name] = { amount: 0, count: 0, parts: {} };
    }
    suppliers[t.supplier_name].amount += t.total_amount;
    suppliers[t.supplier_name].count++;
    suppliers[t.supplier_name].parts[t.part_name] = 
      (suppliers[t.supplier_name].parts[t.part_name] || 0) + t.total_amount;
  });

  return Object.entries(suppliers).map(([name, data]) => ({
    supplier_name: name,
    amount: data.amount,
    transaction_count: data.count,
    top_parts: Object.entries(data.parts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([part, amount]) => ({ part_name: part, amount }))
  }));
}

// CSV 생성 (간단한 구현)
function generateCSV(data) {
  let csv = 'Code,Amount,Plan,Variance %\n';
  data.code_breakdown.forEach(row => {
    csv += `${row.code},${row.amount},${row.plan},${row.variance_pct}\n`;
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="expense-report.csv"'
    }
  });
}

// PDF 생성 (jsPDF 라이브러리 사용)
function generatePDF(data) {
  // TODO: jsPDF 라이브러리를 사용하여 PDF 생성
  // 참고: npm install jspdf html2canvas
  return new NextResponse(
    'PDF generation not implemented yet',
    { status: 501 }
  );
}
```

**구현 시간:** 6 hours

---

### [API #2] GET /api/expense/report/trend

**파일:** `/app/api/expense/report/trend/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');  // 필수
    const period = searchParams.get('period') || '12m';  // 3m|6m|12m|36m
    const metric = searchParams.get('metric') || 'amount';  // amount|count|unit_cost

    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      );
    }

    // 1. 기간에 따른 데이터 범위 계산
    const monthsToFetch = {
      '3m': 3,
      '6m': 6,
      '12m': 12,
      '36m': 36
    }[period] || 12;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsToFetch);
    const startMonth = startDate.toISOString().substring(0, 7);

    // 2. 거래 데이터 조회
    const { data: ledgers } = await supabase
      .from('expense_ledgers')
      .select('period_month, total_amount, quantity')
      .eq('expense_code', code)
      .in('status', ['APPROVED', 'FINAL'])
      .gte('period_month', startMonth)
      .order('period_month', { ascending: true });

    // 3. 계획 데이터 조회
    const { data: master } = await supabase
      .from('expense_master')
      .select('monthly_plan, code_name_en')
      .eq('code', code)
      .single();

    // 4. 벤치마크 데이터 조회
    const { data: benchmark } = await supabase
      .from('expense_benchmark')
      .select('dsc_historical_avg, industry_benchmark')
      .eq('expense_code', code)
      .single();

    // 5. 월별 집계
    const monthlyData = {};
    ledgers.forEach(ledger => {
      if (!monthlyData[ledger.period_month]) {
        monthlyData[ledger.period_month] = { amount: 0, count: 0, quantity: 0 };
      }
      monthlyData[ledger.period_month].amount += ledger.total_amount;
      monthlyData[ledger.period_month].count++;
      monthlyData[ledger.period_month].quantity += ledger.quantity || 0;
    });

    // 6. 응답 데이터 구성
    const data = Object.entries(monthlyData)
      .map(([month, values]) => ({
        month,
        amount: values.amount,
        count: values.count,
        plan: master?.monthly_plan || 0,
        benchmark: benchmark?.industry_benchmark || 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 7. 통계 계산
    const amounts = data.map(d => d.amount);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // 8. 트렌드 선형 회귀 (기울기)
    const n = amounts.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = amounts.reduce((a, b) => a + b, 0);
    const sumXY = amounts.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // 9. 다음月 예측 (선형 추세 + 신뢰 구간)
    const forecastNext = amounts[amounts.length - 1] + slope;
    const confidenceInterval = {
      lower_95: forecastNext - 1.96 * stdDev,
      upper_95: forecastNext + 1.96 * stdDev
    };

    const response = {
      code,
      period,
      metric,
      data,
      statistics: {
        average: Math.round(average),
        max,
        min,
        std_dev: Math.round(stdDev),
        trend_line_slope: Math.round(slope),
        forecast_next_month: Math.round(forecastNext),
        confidence_interval: {
          lower_95: Math.round(confidenceInterval.lower_95),
          upper_95: Math.round(confidenceInterval.upper_95)
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in trend analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trend' },
      { status: 500 }
    );
  }
}
```

**구현 시간:** 5 hours

---

### [API #3] GET /api/expense/history-drift

**파일:** `/app/api/expense/history-drift/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 권한 확인 (관리자만)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 역할 확인
    const { data: userData } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();

    const role = userData?.raw_user_meta_data?.role;
    if (!['admin', 'manager'].includes(role)) {
      return NextResponse.json(
        { error: 'Only admin/manager can view history drift' },
        { status: 403 }
      );
    }

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';  // pending|approved|rejected
    const periodFrom = searchParams.get('period_from');
    const periodTo = searchParams.get('period_to');
    const severity = searchParams.get('severity');

    // 쿼리 구성
    let query = supabase
      .from('expense_history_drift')
      .select(`
        id,
        transaction_id,
        period_month,
        changed_by:action_by(id, email),
        detected_at,
        changed_fields,
        previous_snapshot,
        new_snapshot,
        change_reason,
        approval_required,
        approved_by(id, email),
        approved_at
      `)
      .order('detected_at', { ascending: false });

    // 상태 필터
    if (status === 'pending') {
      query = query.is('approved_by', null);
    } else if (status === 'approved') {
      query = query.not('approved_by', 'is', null);
    }

    // 기간 필터
    if (periodFrom && periodTo) {
      query = query.gte('period_month', periodFrom).lte('period_month', periodTo);
    }

    const { data: drifts, error } = await query;

    if (error) {
      throw error;
    }

    // 변경 금액 계산
    const enrichedDrifts = drifts.map(drift => {
      const prevAmount = drift.previous_snapshot?.total_amount || 0;
      const newAmount = drift.new_snapshot?.total_amount || 0;
      const varianceAmount = newAmount - prevAmount;

      return {
        ...drift,
        variance_amount: varianceAmount,
        status: drift.approved_by ? 'APPROVED' : 'PENDING'
      };
    });

    return NextResponse.json({
      total_count: enrichedDrifts.length,
      pending_count: enrichedDrifts.filter(d => !d.approved_by).length,
      drifts: enrichedDrifts
    });

  } catch (error) {
    console.error('Error fetching history drift:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history drift' },
      { status: 500 }
    );
  }
}
```

**구현 시간:** 4 hours

---

### [API #4] POST /api/expense/history-drift/[driftId]/approve

**파일:** `/app/api/expense/history-drift/[driftId]/approve/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { driftId: string } }
) {
  try {
    const supabase = createClient();
    const { driftId } = params;

    // 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문
    const body = await request.json();
    const { action, approval_comment, justification } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    // 1. 과거月 변경 레코드 조회
    const { data: drift } = await supabase
      .from('expense_history_drift')
      .select('*')
      .eq('id', driftId)
      .single();

    if (!drift) {
      return NextResponse.json(
        { error: 'Drift record not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // 2. 실제 거래 레코드 업데이트
      const { data: updated } = await supabase
        .from('expense_ledgers')
        .update(drift.new_snapshot)
        .eq('id', drift.transaction_id)
        .select('*')
        .single();

      // 3. 감사 로그 기록
      const { error: auditError } = await supabase
        .from('expense_audit_trail')
        .insert({
          event_type: 'DRIFT_APPROVE',
          transaction_id: drift.transaction_id,
          action_by: user.id,
          action_at: new Date().toISOString(),
          previous_state: drift.previous_snapshot,
          new_state: drift.new_snapshot,
          changed_fields: drift.changed_fields || [],
          approval_comment,
          period_month: drift.period_month
        });

      if (auditError) {
        throw auditError;
      }
    }

    // 4. 과거月 변경 레코드 표시
    const { error: updateDriftError } = await supabase
      .from('expense_history_drift')
      .update({
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_required: action === 'reject'
      })
      .eq('id', driftId);

    if (updateDriftError) {
      throw updateDriftError;
    }

    // 5. 알림 발송 (Slack)
    await notifyApproval({
      drift_id: driftId,
      action,
      transaction_id: drift.transaction_id,
      approval_comment,
      approver: user.email
    });

    return NextResponse.json({
      drift_id: driftId,
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approved_by: user.email,
      approved_at: new Date().toISOString(),
      transaction_updated: action === 'approve'
    });

  } catch (error) {
    console.error('Error approving history drift:', error);
    return NextResponse.json(
      { error: 'Failed to approve drift' },
      { status: 500 }
    );
  }
}

async function notifyApproval(details) {
  // TODO: Slack 알림 발송
  // 참고: npm install @slack/web-api
  console.log('Notification:', details);
}
```

**구현 시간:** 4 hours

---

### [API #5] GET /api/expense/audit-trail

**파일:** `/app/api/expense/audit-trail/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 권한 확인 (admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const periodFrom = searchParams.get('period_from');  // 필수
    const periodTo = searchParams.get('period_to');      // 필수
    const userId = searchParams.get('user_id');
    const eventType = searchParams.get('event_type');
    const anomalyOnly = searchParams.get('anomaly_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!periodFrom || !periodTo) {
      return NextResponse.json(
        { error: 'period_from and period_to are required' },
        { status: 400 }
      );
    }

    // 쿼리 구성
    let query = supabase
      .from('expense_audit_trail')
      .select(`
        id,
        event_type,
        transaction_id,
        action_by:action_by(id, email),
        action_at,
        changed_fields,
        previous_state,
        new_state,
        is_anomaly,
        anomaly_reason,
        approved_by:approved_by(id, email),
        approval_comment
      `)
      .gte('period_month', periodFrom)
      .lte('period_month', periodTo)
      .order('action_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 필터링
    if (userId) {
      query = query.eq('action_by', userId);
    }
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (anomalyOnly) {
      query = query.eq('is_anomaly', true);
    }

    const { data: events, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      period: `${periodFrom} ~ ${periodTo}`,
      total_events: count || 0,
      anomaly_count: events.filter(e => e.is_anomaly).length,
      events
    });

  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit trail' },
      { status: 500 }
    );
  }
}
```

**구현 시간:** 3 hours

---

### [API #6] GET /api/expense/kpi/dashboard

**파일:** `/app/api/expense/kpi/dashboard/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const searchParams = request.nextUrl.searchParams;
    let month = searchParams.get('month') || 'current';
    const includeAlerts = searchParams.get('include_alerts') !== 'false';

    // 기간 해석
    if (month === 'current') {
      month = new Date().toISOString().substring(0, 7);
    } else if (month === 'ytd') {
      // YTD 처리는 별도 로직 필요
    }

    // 1. 월간 거래 합계
    const { data: monthlyExpense } = await supabase
      .from('expense_ledgers')
      .select('total_amount, expense_code')
      .eq('period_month', month)
      .in('status', ['APPROVED', 'FINAL']);

    const totalExpense = monthlyExpense.reduce((sum, e) => sum + (e.total_amount || 0), 0);

    // 2. 경비 마스터 (계획, 예산)
    const { data: masterCodes } = await supabase
      .from('expense_master')
      .select('code, monthly_plan, annual_budget');

    const totalPlan = masterCodes.reduce((sum, m) => sum + (m.monthly_plan || 0), 0);
    const totalBudget = masterCodes.reduce((sum, m) => sum + (m.annual_budget || 0), 0);

    // 3. 코드별 KPI
    const kpis = {};
    masterCodes.forEach(code => {
      const codeExpense = monthlyExpense
        .filter(e => e.expense_code === code.code)
        .reduce((sum, e) => sum + (e.total_amount || 0), 0);

      const variancePct = ((codeExpense - code.monthly_plan) / code.monthly_plan * 100);
      const rank = variancePct < 5 ? 'ACCEPTABLE' 
                 : variancePct < 15 ? 'ABOVE_EXPECTED'
                 : 'EXCEEDS_PLAN';

      kpis[code.code] = {
        amount: codeExpense,
        plan: code.monthly_plan,
        variance_pct: Math.round(variancePct * 10) / 10,
        rank
      };
    });

    // 4. 경보
    let alerts = [];
    if (includeAlerts) {
      const { data: alertData } = await supabase
        .from('expense_kpi_alerts')
        .select('*')
        .eq('period_month', month)
        .eq('is_acknowledged', false)
        .order('severity', { ascending: false });

      alerts = alertData || [];
    }

    // 5. 월말 예측
    const burnRate = totalExpense / parseFloat(month.substring(5)) || 0;
    const dailyAverage = totalExpense / 12;  // 월 12일 기준 (추정)
    const projectedEOM = dailyAverage * 30;

    const variance = totalExpense - totalPlan;
    const variancePct = (variance / totalPlan * 100).toFixed(1);

    const response = {
      period_month: month,
      generated_at: new Date().toISOString(),
      summary: {
        total_expense: Math.round(totalExpense),
        plan: Math.round(totalPlan),
        budget: Math.round(totalBudget),
        variance_vs_plan: parseFloat(variancePct),
        variance_vs_budget: Math.round((totalExpense - totalBudget) / totalBudget * 100),
        burn_rate: Math.round(burnRate * 100) / 100
      },
      kpis,
      alerts,
      forecast: {
        end_of_month_projected: Math.round(projectedEOM),
        ytd_projected_eoy: Math.round(totalExpense * 12),
        vs_annual_budget: Math.round((totalExpense * 12 - totalBudget) / totalBudget * 100),
        confidence: 0.85
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in KPI dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to generate KPI dashboard' },
      { status: 500 }
    );
  }
}
```

**구현 시간:** 7 hours

---

### [API #7] GET /api/expense/kpi/alerts

**파일:** `/app/api/expense/kpi/alerts/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity');  // INFO|WARNING|CRITICAL
    const acknowledged = searchParams.get('acknowledged') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('expense_kpi_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (!acknowledged) {
      query = query.eq('is_acknowledged', false);
    }

    const { data: alerts, error, count } = await query;

    if (error) {
      throw error;
    }

    // 통계 계산
    const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
    const warningCount = alerts.filter(a => a.severity === 'WARNING').length;
    const infoCount = alerts.filter(a => a.severity === 'INFO').length;

    return NextResponse.json({
      total_alerts: count || 0,
      active_alerts: alerts.filter(a => !a.is_acknowledged).length,
      critical_count: criticalCount,
      warning_count: warningCount,
      info_count: infoCount,
      alerts
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
```

**구현 시간:** 3 hours

---

### [API #8] POST /api/expense/kpi/alerts/[alertId]/acknowledge

**파일:** `/app/api/expense/kpi/alerts/[alertId]/acknowledge/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const supabase = createClient();
    const { alertId } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action_taken, notes } = body;

    const { data: updated, error } = await supabase
      .from('expense_kpi_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by: user.id,
        acknowledged_at: new Date().toISOString(),
        action_taken
      })
      .eq('id', alertId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      alert_id: alertId,
      is_acknowledged: true,
      acknowledged_by: user.email,
      acknowledged_at: updated.acknowledged_at
    });

  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
```

**구현 시간:** 2 hours

---

### [API #9] GET /api/expense/kpi/benchmarks

**파일:** `/app/api/expense/kpi/benchmarks/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    let query = supabase
      .from('expense_benchmark')
      .select('*');

    if (code) {
      query = query.eq('expense_code', code);
    }

    const { data: benchmarks, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      benchmarks
    });

  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}
```

**구현 시간:** 2 hours

---

### [API #10] POST /api/expense/schedule

**파일:** `/app/api/expense/schedule/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      expense_code,
      recurrence_type,
      recurrence_day,
      scheduled_amount,
      machine_code,
      supplier_name,
      part_name,
      start_date,
      end_date,
      remarks
    } = body;

    if (!name || !expense_code || !recurrence_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: schedule, error } = await supabase
      .from('expense_schedule')
      .insert({
        name,
        expense_code,
        recurrence_type,
        recurrence_day,
        scheduled_amount,
        machine_code,
        supplier_name,
        part_name,
        start_date,
        end_date,
        remarks,
        created_by: user.id
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      id: schedule.id,
      status: 'created',
      first_trigger_date: schedule.next_trigger_date
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: schedules, error } = await supabase
      .from('expense_schedule')
      .select('*')
      .eq('is_active', true)
      .order('next_trigger_date', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      schedules,
      total: schedules.length
    });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
```

**구현 시간:** 4 hours

---

### [API #11] POST /api/expense/batch-process

**파일:** `/app/api/expense/batch-process/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Queue } from 'bullmq';

// Redis 큐 초기화
const processQueue = new Queue('expense-batch-process', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { month, process_type, actions } = body;

    if (!month || !process_type) {
      return NextResponse.json(
        { error: 'month and process_type are required' },
        { status: 400 }
      );
    }

    // 배경 작업 큐에 추가
    const job = await processQueue.add(
      'month-end-processing',
      {
        month,
        process_type,
        actions,
        initiated_by: user.id
      },
      {
        jobId: `batch-${new Date().toISOString().replace(/[:.]/g, '-')}`,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    );

    return NextResponse.json({
      job_id: job.id,
      status: 'processing',
      progress: {
        finalized_transactions: 0,
        kpi_calculated: false,
        report_generated: false,
        anomalies_detected: 0
      },
      estimated_completion: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error in batch processing:', error);
    return NextResponse.json(
      { error: 'Failed to start batch processing' },
      { status: 500 }
    );
  }
}

// 배경 작업 워커 (별도 파일: workers/expense-batch.worker.ts)
export async function processBatchJob(job) {
  const supabase = createClient();

  try {
    const { month, actions } = job.data;

    for (const action of actions) {
      switch (action) {
        case 'finalize_pending_transactions':
          // SUBMITTED 상태 거래를 FINAL로 변경
          await supabase
            .from('expense_ledgers')
            .update({ status: 'FINAL' })
            .eq('period_month', month)
            .eq('status', 'SUBMITTED');
          break;

        case 'calculate_kpi':
          // KPI 계산 및 캐시 갱신
          // TODO: 집계 쿼리 실행
          break;

        case 'generate_monthly_report':
          // 월간 보고서 생성
          // TODO: PDF/CSV 생성
          break;

        case 'detect_anomalies':
          // 이상치 탐지 알고리즘 실행
          // TODO: 통계 기반 이상치 탐지
          break;

        case 'send_summary_email':
          // 요약 이메일 발송
          // TODO: 메일 발송
          break;
      }

      // 진행률 업데이트
      await job.progress(50);
    }

    return {
      success: true,
      completed_actions: actions.length
    };

  } catch (error) {
    console.error('Batch job error:', error);
    throw error;
  }
}
```

**구현 시간:** 6 hours

---

## 🧪 테스트 케이스 예제

### Phase 3 테스트

```typescript
// __tests__/api/expense/phase3-report.test.ts
import request from 'supertest';

describe('Phase 3: Monthly Analysis Report', () => {
  it('GET /api/expense/report/monthly-detailed should return detailed breakdown', async () => {
    const res = await request(app)
      .get('/api/expense/report/monthly-detailed')
      .query({ month: '2026-06', drill_down_by: 'code' })
      .expect(200);

    expect(res.body).toHaveProperty('period');
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('code_breakdown');
    expect(res.body.code_breakdown).toBeInstanceOf(Array);
  });

  it('GET /api/expense/report/trend should return trend analysis', async () => {
    const res = await request(app)
      .get('/api/expense/report/trend')
      .query({ code: '1.1', period: '12m' })
      .expect(200);

    expect(res.body).toHaveProperty('statistics');
    expect(res.body.statistics).toHaveProperty('forecast_next_month');
  });
});
```

---

## 📋 구현 체크리스트

### Phase 3 (API #1-2)
- [ ] DB: expense_trend_analysis 테이블 생성
- [ ] API #1: 월별 상세 분석 (코드별, 기계별, 공급자별)
- [ ] API #2: 트렌드 분석 (3m, 12m, 36m)
- [ ] 테스트: 분석 데이터 정확성
- [ ] 에러 처리: 400, 500 케이스

### Phase 4 (API #3-5)
- [ ] DB: expense_audit_trail, expense_history_drift 테이블
- [ ] 트리거: 변경 감지 및 감사 로그 자동 기록
- [ ] API #3: 과거月 변경 목록 조회
- [ ] API #4: 변경 승인/거절 플로우
- [ ] API #5: 감사 로그 조회
- [ ] 알림: Slack 통지

### Phase 5 (API #6-9)
- [ ] DB: expense_kpi_alerts, expense_benchmark 테이블
- [ ] 트리거: KPI 경보 자동 생성
- [ ] API #6: KPI 대시보드
- [ ] API #7: 경보 조회
- [ ] API #8: 경보 확인
- [ ] API #9: 벤치마크 조회

### Phase 6 (API #10-11)
- [ ] DB: expense_schedule 테이블
- [ ] API #10: 반복 일정 CRUD
- [ ] API #11: 월말 배치 처리
- [ ] Redis: BullMQ 큐 설정
- [ ] Cron: 월 1일/27일 자동 트리거

---

## 📚 참고 자료

- **DB Schema:** `/home/jeepney/.openclaw/workspace-dev/db/52_expense_master_phase3_5_schema.sql`
- **설계 문서:** `/home/jeepney/.openclaw/workspace-dev/EXPENSE_MASTER_PHASE3_5_DESIGN.md`
- **Phase 1-2 설계:** `/home/jeepney/.openclaw/workspace-dev/EXPENSE_MASTER_DESIGN_SPECIFICATION.md`

---

**작성자:** Web App Designer / Planner  
**작성일:** 2026-06-12 21:45 KST  
**상태:** ✅ READY FOR IMPLEMENTATION
