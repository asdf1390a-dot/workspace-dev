---
name: 일일 경영실적 리포팅 자동화 설계
description: Project 1 — 매일 14:00 KST 자동 집계 및 Telegram 배포 (완료 목표 2026-05-23)
type: project
status: pending
targetDate: 2026-05-23
---

# Project 1: 일일 경영실적 리포팅 자동화 (2026-05-19)

## 📋 개요

**목표:** 4개 부서(생산, 기술, 보전, 생산관리) 경영지표를 매일 14:00 KST 자동 수집하여 Telegram으로 배포

**완료 기준:**
- ✅ Vercel Cron 작동 (매일 14:00 KST ± 2분)
- ✅ Telegram 메시지 자동 배포 (편집 없음)
- ✅ 실행 로그 DB 저장 (100% 추적)
- ✅ 오류 시 대체 알림 (이메일 + Telegram 스레드)
- ✅ 24시간 테스트 (자동화전문가 감시)

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────┐
│ Vercel Cron (매일 14:00 KST)                  │
│ POST /api/cron/daily-reporting/executive-summary
└────────────────────┬────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │ ExecutiveSummaryGenerator
        │ - 데이터 수집 (Supabase)
        │ - 데이터 정제
        │ - KPI 계산
        └────────────┬────────────┘
                     │
        ┌────────────▼──────────────────┐
        │ TelegramMessageFormatter
        │ - 포맷팅 (마크다운 + 이모지)
        │ - 유효성 검증
        └────────────┬──────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │ Telegram Bot API
        │ - 메시지 발송
        │ - 예외 처리
        └────────────┬──────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │ Supabase (cron_logs 테이블)
        │ - 실행 결과 기록
        │ - 실패 로그 저장
        └───────────────────────────────┘
```

---

## 📊 데이터 구조

### 1. 집계 대상 KPI (부서별 5개)

#### 생산부
| KPI | 주기 | 단위 | 계산식 | 정의 |
|-----|------|------|--------|------|
| **일일 생산량 (DPD)** | 일 | 단위 | SUM(produced_qty) | 당일 생산한 제품 총수량 |
| **설비 가동률 (OEE)** | 일 | % | (실제 출력 / 이상적 출력) × 100 | 설비 효율성 |
| **결함률 (DR)** | 일 | % | (불량수 / 생산수) × 100 | 품질 지표 |
| **작업 지연 건수** | 일 | 건 | COUNT(delayed_tasks) | 일정 지연 발생 |
| **정시 완료율 (OTR)** | 일 | % | (완료건수 / 계획건수) × 100 | 납기 충족 |

#### 기술부
| KPI | 주기 | 단위 | 계산식 | 정의 |
|-----|------|------|--------|------|
| **문제 해결 시간 (MTTR)** | 일 | 시간 | SUM(resolution_time) / COUNT(issues) | 평균 해결 시간 |
| **대기 이슈 건수** | 일 | 건 | COUNT(status='pending') | 미해결 건수 |
| **우선 이슈 건수** | 일 | 건 | COUNT(priority='high') | 긴급 건수 |
| **신규 이슈 유입** | 일 | 건 | COUNT(created_at=today) | 당일 신규 |
| **해결 건수** | 일 | 건 | COUNT(resolved_at=today) | 당일 완료 |

#### 보전부
| KPI | 주기 | 일 | 계산식 | 정의 |
|-----|------|------|--------|------|
| **설비 고장 건수 (BM)** | 일 | 건 | COUNT(breakdown_incidents) | 고장 발생 |
| **평균 복구 시간 (MTTR)** | 일 | 시간 | SUM(downtime) / COUNT(incidents) | 복구 소요 |
| **예정 보전 완료율** | 일 | % | (완료 / 계획) × 100 | 예방 보전 |
| **부분별 고장률** | 일 | % | (고장수 / 부분) | 부위별 분석 |
| **총 가동 중단 시간** | 일 | 시간 | SUM(downtime) | 누적 중단 |

#### 생산관리
| KPI | 주기 | 단위 | 계산식 | 정의 |
|-----|------|------|--------|------|
| **주문 수신 건수** | 일 | 건 | COUNT(received_orders) | 신규 주문 |
| **배송 건수** | 일 | 건 | COUNT(shipped) | 완료 배송 |
| **배송 지연 건수** | 일 | 건 | COUNT(late_shipments) | 연체 |
| **재고 회전율 (ITR)** | 일 | 회 | COGS / 평균재고 | 재고 효율 |
| **주문 충족율 (FTF)** | 일 | % | (충족 / 수신) × 100 | 주문 완성도 |

### 2. Supabase 쿼리 (프리뷰)

```sql
-- 생산부 일일 KPI
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(DISTINCT batch_id) as dpd,  -- 일일생산량
  AVG(oee_score) as oee,             -- 설비가동률
  COUNT(CASE WHEN is_defective THEN 1 END)::float / 
    COUNT(*) * 100 as defect_rate,  -- 결함률
  COUNT(CASE WHEN is_delayed THEN 1 END) as delay_count,  -- 지연건수
  COUNT(CASE WHEN status='completed' THEN 1 END)::float /
    COUNT(*) * 100 as on_time_rate  -- 정시완료율
FROM production.daily_logs
WHERE created_at >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul'
GROUP BY DATE_TRUNC('day', created_at);

-- 기술부 일일 KPI
SELECT
  DATE_TRUNC('day', created_at) as date,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_mttr,
  COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN priority='high' THEN 1 END) as high_priority_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' THEN 1 END) as new_issues,
  COUNT(CASE WHEN resolved_at >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' THEN 1 END) as resolved_count
FROM technical.issues
WHERE created_at >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at);

-- 보전부 일일 KPI
SELECT
  DATE_TRUNC('day', incident_date) as date,
  COUNT(*) as breakdown_count,
  AVG(EXTRACT(EPOCH FROM downtime_end - downtime_start) / 3600) as avg_mttr,
  COUNT(CASE WHEN is_planned THEN 1 END)::float / COUNT(*) * 100 as planned_completion,
  SUM(EXTRACT(EPOCH FROM downtime_end - downtime_start) / 3600) as total_downtime
FROM maintenance.breakdowns
WHERE incident_date >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul'
GROUP BY DATE_TRUNC('day', incident_date);

-- 생산관리 일일 KPI
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(DISTINCT order_id) as orders_received,
  COUNT(CASE WHEN shipped_at >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' THEN 1 END) as shipments,
  COUNT(CASE WHEN shipped_at > due_date THEN 1 END) as late_shipments,
  SUM(quantity * unit_cost) / AVG(inventory_value) as inventory_turnover,
  COUNT(CASE WHEN fulfilled_qty >= order_qty THEN 1 END)::float / COUNT(*) * 100 as fulfillment_rate
FROM sales.orders
WHERE created_at >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at);
```

### 3. 메시지 포맷 (Telegram)

```
🏭 DSC Mannur — 일일 경영실적 리포트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 2026-05-23 (목) | 14:00 집계

🔴 생산부 (⬇︎ 3.2%)
├ DPD: 1,234 단위 | 목표: 1,280 | -46 (-3.6%)
├ OEE: 87.5% | 전일 89.2% | -1.7%p
├ 결함률: 2.1% | 목표: 2.0% | 경고 ⚠️
├ 지연건: 2건 | 어제: 0건 | +2
└ 정시율: 94.3% | 목표: 95% | -0.7%p

🟢 기술부 (↗︎ 1.0%)
├ MTTR: 2.1시간 | 어제: 2.3시간 | 개선 ✅
├ 대기: 3건 | 어제: 4건 | 감소 ✅
├ 긴급: 1건 | 어제: 2건 | 감소 ✅
├ 신규: 2건 | 평균: 1.8건
└ 해결: 3건 | 평균: 2.5건 | 초과 ✅

🟡 보전부 (→ 0.0%)
├ 고장: 1건 | 어제: 1건 | 평상
├ MTTR: 3.2시간 | 어제: 2.8시간 | 악화 ⚠️
├ 예정: 87% | 목표: 90% | -3%p
├ 중단: 3.2시간 | 어제: 2.8시간
└ 부위: 모터(2), 펌프(0), 센서(0)

🟢 생산관리 (⬆︎ 2.5%)
├ 수주: 8건 | 평균: 7.2건
├ 배송: 6건 | 평균: 5.8건
├ 연체: 0건 | 어제: 1건 | 개선 ✅
├ ITR: 4.2회 | 어제: 4.1회 | 소폭증가
└ 충족: 98.5% | 목표: 99% | -0.5%p

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 경고 항목 (3개)
1️⃣ 생산 결함률 > 2.0% (2.1%) — 품질 점검 필요
2️⃣ 보전 MTTR 증가 (2.8 → 3.2h) — 장비 점검 필요
3️⃣ 생산 지연건 (2건) — 일정 검토 필요

📈 주간 추이
생산부: ⬇︎ 1.2% (평균 1,245 → 1,234)
기술부: ⬆︎ 3.1% (MTTR 개선)
보전부: → 0.2% (거의 평상)
생산관리: ⬆︎ 2.5% (배송량 증가)

🔗 대시보드: [보기](https://dsc-fms.vercel.app/dashboard)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 💻 구현 상세

### 1. API 엔드포인트

**경로:** `POST /api/cron/daily-reporting/executive-summary`

**요청:**
```http
POST /api/cron/daily-reporting/executive-summary HTTP/1.1
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json
```

**응답 (성공):**
```json
{
  "status": 200,
  "message": "Daily report generated and sent successfully",
  "timestamp": "2026-05-23T14:00:05Z",
  "report": {
    "date": "2026-05-23",
    "generatedAt": "2026-05-23T14:00:05Z",
    "departments": {
      "production": { "dpd": 1234, "oee": 87.5, ... },
      "technical": { "avg_mttr": 2.1, "pending_count": 3, ... },
      "maintenance": { "breakdown_count": 1, "avg_mttr": 3.2, ... },
      "operations": { "orders_received": 8, "shipments": 6, ... }
    },
    "alerts": [
      { "severity": "high", "dept": "production", "message": "결함률 > 2.0%" },
      ...
    ],
    "weeklyTrend": { "production": -1.2, "technical": 3.1, ... }
  },
  "telegramSent": true,
  "logId": "cron-2026-05-23-140005-abc123"
}
```

**응답 (실패):**
```json
{
  "status": 500,
  "error": "Failed to fetch production KPI",
  "logId": "cron-2026-05-23-140005-xyz789",
  "fallbackNotification": "sent",
  "fallbackChannel": "email"
}
```

### 2. 파일 구조

```
app/api/cron/daily-reporting/
├── executive-summary/
│   └── route.ts                     # 크론 엔드포인트 (핵심)
lib/reporting/
├── daily-executive-summary.ts       # 보고서 생성 로직
├── kpi-calculator.ts                # KPI 계산
├── kpi-formatter.ts                 # 포맷팅
├── anomaly-detection.ts             # 이상치 판정
├── telegram-reporter.ts             # Telegram 발송
├── data-validator.ts                # 데이터 검증
└── types.ts                         # TypeScript 타입

db/migrations/
└── 003_cron_logs_daily_reporting.sql # DB 스키마
```

### 3. 핵심 로직 (의사코드)

```typescript
// app/api/cron/daily-reporting/executive-summary/route.ts
export async function POST(request: NextRequest) {
  // 1️⃣ 인증 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const logId = generateLogId(); // "cron-2026-05-23-140005-abc123"
  const startTime = Date.now();

  try {
    // 2️⃣ 데이터 수집 (병렬, 각 부서별)
    const [prodKPI, techKPI, maintKPI, opsKPI] = await Promise.all([
      fetchProductionKPI(),
      fetchTechnicalKPI(),
      fetchMaintenanceKPI(),
      fetchOperationsKPI(),
    ]);

    // 3️⃣ 데이터 검증
    validateKPI(prodKPI);
    validateKPI(techKPI);
    validateKPI(maintKPI);
    validateKPI(opsKPI);

    // 4️⃣ 이상치 감지
    const alerts = detectAnomalies({
      production: prodKPI,
      technical: techKPI,
      maintenance: maintKPI,
      operations: opsKPI,
    });

    // 5️⃣ 주간 추이 계산
    const weeklyTrend = calculateWeeklyTrend();

    // 6️⃣ 메시지 포맷팅
    const telegramMessage = formatTelegramMessage({
      production: prodKPI,
      technical: techKPI,
      maintenance: maintKPI,
      operations: opsKPI,
      alerts,
      weeklyTrend,
    });

    // 7️⃣ Telegram 발송
    await sendTelegramMessage(
      process.env.TELEGRAM_REPORTING_CHANNEL_ID,
      telegramMessage
    );

    // 8️⃣ 로그 저장
    const duration = Date.now() - startTime;
    await saveCronLog({
      log_id: logId,
      status: 'success',
      duration_ms: duration,
      report_date: new Date().toISOString().split('T')[0],
      telegram_sent: true,
      metadata: { alert_count: alerts.length },
    });

    return NextResponse.json({
      status: 200,
      message: 'Daily report generated and sent successfully',
      logId,
      report: { production: prodKPI, technical: techKPI, ... },
    });

  } catch (error) {
    // 9️⃣ 오류 처리 & 대체 알림
    await logError({
      log_id: logId,
      error_message: error.message,
      stack_trace: error.stack,
    });

    // 이메일 발송 (대체)
    await sendEmailAlert({
      subject: `[URGENT] Cron 실패: Daily Reporting (${logId})`,
      body: error.message,
    });

    return NextResponse.json({
      status: 500,
      error: error.message,
      logId,
      fallbackNotification: 'sent',
    }, { status: 500 });
  }
}
```

### 4. 이상치 감지 규칙 (Anomaly Detection)

```typescript
// lib/reporting/anomaly-detection.ts
interface AnomalyRule {
  department: string;
  kpiName: string;
  rule: 'absolute' | 'percentile' | 'zscore';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
}

const anomalyRules: AnomalyRule[] = [
  // 생산부
  {
    department: 'production',
    kpiName: 'defect_rate',
    rule: 'absolute',
    threshold: 2.0, // 2% 초과
    severity: 'critical',
  },
  {
    department: 'production',
    kpiName: 'oee',
    rule: 'percentile',
    threshold: -2.5, // 전일 대비 2.5% 이상 악화
    severity: 'warning',
  },
  // 기술부
  {
    department: 'technical',
    kpiName: 'pending_count',
    rule: 'zscore',
    threshold: 2.0, // 표준편차 2배 초과
    severity: 'warning',
  },
  // ... (각 부서별 규칙)
];

export function detectAnomalies(kpiData: Record<string, any>): Alert[] {
  const alerts: Alert[] = [];

  for (const rule of anomalyRules) {
    const deptKPI = kpiData[rule.department];
    const value = deptKPI[rule.kpiName];

    if (shouldAlert(value, rule)) {
      alerts.push({
        severity: rule.severity,
        department: rule.department,
        kpiName: rule.kpiName,
        value,
        threshold: rule.threshold,
        message: generateMessage(rule, value),
      });
    }
  }

  return alerts;
}
```

---

## 🧪 테스트 계획

### Unit Tests
```typescript
// test/reporting/anomaly-detection.test.ts
describe('AnomalyDetection', () => {
  it('should detect defect rate anomaly', () => {
    const kpiData = { production: { defect_rate: 2.5 } };
    const alerts = detectAnomalies(kpiData);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
  });

  it('should handle missing data gracefully', () => {
    const kpiData = { production: {} };
    expect(() => detectAnomalies(kpiData)).not.toThrow();
  });
});
```

### Integration Tests
```typescript
// test/reporting/integration.test.ts
describe('ExecutiveSummaryGenerator', () => {
  it('should generate complete report within 30s', async () => {
    const startTime = Date.now();
    const report = await generateExecutiveSummary();
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000);
  });

  it('should save log to database', async () => {
    await generateExecutiveSummary();
    const logs = await getCronLogs({ date: today() });
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('success');
  });
});
```

### Manual Testing Checklist
- [ ] Day 1: 수동 실행 테스트 (오류 없음)
- [ ] Day 2: Vercel Cron 설정 후 자동 실행 (정시)
- [ ] Day 3: 24시간 연속 모니터링 (로그 4회 생성, 모두 성공)

---

## 📈 성공 지표

| 지표 | 목표 | 측정방법 |
|------|------|---------|
| **일일 실행율** | 100% | Vercel Logs 확인 |
| **정시 도착율** | 14:00 ± 2분 | 타임스탬프 로그 |
| **메시지 정확도** | 100% | 수동 검증 (5회) |
| **오류율** | < 1% | 월간 실행수 / 오류수 |
| **응답시간** | < 30초 | API 로그 분석 |

---

**다음:** Project 2 (GitHub/ProductHunt 스크래핑) 설계 문서 작성 예정
