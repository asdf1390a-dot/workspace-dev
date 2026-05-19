---
name: Audit System Implementation Brief (웹개발자용)
description: Day 1-3 구현 상세 가이드 + API 명세 + DB 스키마 + 알림 메커니즘
type: implementation_brief
date: 2026-05-19 18:00 KST
target_audience: Web Developer
---

# 🛠️ Audit System Implementation Brief

**작성 일시:** 2026-05-19 18:00 KST  
**대상:** 웹개발자  
**구현 기간:** 2026-05-20 ~ 2026-05-23 (3일)  
**배포 예정:** 2026-05-24

---

## 📋 Task Overview

| 단계 | 일정 | 소요 시간 | 담당 |
|------|------|----------|------|
| **Day 1: API + DB** | 2026-05-20 09:00~18:00 | 9시간 | 웹개발자 |
| **Day 2: 알림 + 통합** | 2026-05-21 09:00~18:00 | 9시간 | 웹개발자 + 데이터분석가 |
| **Day 3: QA + 배포** | 2026-05-22~23 | - | 평가자 + 웹개발자 |

**최우선 구현:** 즉시 알림 메커니즘 (DRS <85% → 1분 내 Telegram)

---

## 🔧 Day 1: API + DB 구현 (2026-05-20)

### Task 1-1: DB 마이그레이션

**실행 명령:**
```sql
-- File: db/24_audit_system_phase1.sql
-- 2개 테이블 생성 + 인덱스 추가

CREATE TABLE audit_reports (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  drs_score DECIMAL(5,2) NOT NULL,  -- Daily Reliability Score (0-100)
  backup_success_rate DECIMAL(5,2),
  api_response_time_ms DECIMAL(6,2),
  recovery_possible_rate DECIMAL(5,2),
  alert_delivery_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_metrics (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES audit_reports(id) ON DELETE CASCADE,
  metric_name VARCHAR(50) NOT NULL,  -- 'backup_success', 'api_response', 'recovery', 'alert_delivery'
  metric_value DECIMAL(6,2),
  metric_unit VARCHAR(20),  -- '%', 'ms', 'count'
  status VARCHAR(20),  -- 'good', 'caution', 'critical'
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_reports_date ON audit_reports(report_date DESC);
CREATE INDEX idx_audit_metrics_report_id ON audit_metrics(report_id);
```

**추가 테이블 (즉시 알림용):**
```sql
CREATE TABLE audit_alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_type VARCHAR(30),  -- 'drs_low', 'backup_failure', etc
  drs_value DECIMAL(5,2),
  triggered_at TIMESTAMP NOT NULL,
  alerted_at TIMESTAMP NOT NULL,
  delivery_channel VARCHAR(20),  -- 'telegram', 'discord', 'email'
  status VARCHAR(20),  -- 'sent', 'failed', 'retry'
  retry_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_alerts_triggered_at ON audit_alerts(triggered_at DESC);
CREATE INDEX idx_audit_alerts_status ON audit_alerts(status);

CREATE TABLE audit_calculation_logs (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  step_name VARCHAR(100),  -- 'backup_check', 'api_test', 'recovery_test', etc
  input_data JSONB,
  output_value DECIMAL(6,2),
  execution_time_ms INT,
  status VARCHAR(20),  -- 'success', 'partial_failure', 'failure'
  error_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**체크리스트:**
- [ ] SQL 파일 생성: `db/24_audit_system_phase1.sql`
- [ ] Supabase 마이그레이션 실행 (로컬 + 스테이징)
- [ ] 테이블 생성 확인: audit_reports, audit_metrics, audit_alerts, audit_calculation_logs
- [ ] 인덱스 생성 확인 (조회 성능 측정)

---

### Task 1-2: API 4개 구현

#### API 1: `GET /api/audit/report`
**목적:** 일일 신뢰도 리포트 조회

**엔드포인트:**
```
GET /api/audit/report?date=YYYY-MM-DD
Content-Type: application/json
```

**응답 (성공 200):**
```json
{
  "report_date": "2026-05-20",
  "drs_score": 94.2,
  "drs_status": "good",
  "metrics": {
    "backup_success_rate": {
      "label": "Backup 성공률",
      "value": 99.1,
      "unit": "%",
      "status": "good"
    },
    "api_response_time_ms": {
      "label": "API 응답시간",
      "value": 1.92,
      "unit": "s",
      "status": "good"
    },
    "recovery_possible_rate": {
      "label": "백업 복구 가능률",
      "value": 96.8,
      "unit": "%",
      "status": "caution"
    },
    "alert_delivery_rate": {
      "label": "알림 전달률",
      "value": 98.5,
      "unit": "%",
      "status": "good"
    }
  },
  "trend_7days": [
    { "date": "2026-05-14", "drs": 92.1 },
    ...
    { "date": "2026-05-20", "drs": 94.2 }
  ],
  "generated_at": "2026-05-20T03:30:00Z",
  "next_report_at": "2026-05-21T03:30:00Z"
}
```

**구현 위치:** `app/api/audit/report/route.ts`

**로직:**
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  
  // 1. audit_reports에서 데이터 조회
  const report = await supabase
    .from('audit_reports')
    .select('*')
    .eq('report_date', dateParam)
    .single();
  
  // 2. audit_metrics에서 세부 지표 조회
  const metrics = await supabase
    .from('audit_metrics')
    .select('*')
    .eq('report_id', report.id);
  
  // 3. 7일 트렌드 계산
  const trend7days = await supabase
    .from('audit_reports')
    .select('report_date, drs_score')
    .gte('report_date', subDays(parseDate(dateParam), 7))
    .lte('report_date', dateParam)
    .order('report_date', { ascending: true });
  
  // 4. 상태 판정 (good/caution/critical)
  const drs = report.drs_score;
  const drsStatus = drs >= 95 ? 'good' : drs >= 85 ? 'caution' : 'critical';
  
  return Response.json({
    report_date: dateParam,
    drs_score: drs,
    drs_status: drsStatus,
    metrics: formatMetrics(metrics),
    trend_7days: trend7days,
    generated_at: report.created_at,
    next_report_at: format(addDays(parseDate(dateParam), 1), 'yyyy-MM-dd\'T\'03:30:00Z')
  });
}
```

**테스트:**
- [ ] 현재 날짜 데이터 조회
- [ ] 과거 날짜 데이터 조회
- [ ] 없는 날짜 → 404 반환
- [ ] 7일 트렌드 정확성 검증

---

#### API 2: `GET /api/audit/trend`
**목적:** 주간/월간 추이 분석 (그래프 데이터)

**엔드포인트:**
```
GET /api/audit/trend?days=7&start_date=YYYY-MM-DD
```

**응답 (성공 200):**
```json
{
  "period": "last_7_days",
  "data": [
    {
      "date": "2026-05-14",
      "drs": 92.1,
      "backup_success": 98.9,
      "api_response": 1.85,
      "recovery_possible": 95.2,
      "alert_delivery": 97.8
    },
    ...
  ],
  "stats": {
    "drs_avg": 93.2,
    "drs_min": 91.5,
    "drs_max": 94.8,
    "trend": "upward"  // upward, flat, downward
  }
}
```

**구현 위치:** `app/api/audit/trend/route.ts`

---

#### API 3: `GET /api/audit/issue`
**목적:** P0 이슈 리스트 (DRS 하락 원인)

**엔드포인트:**
```
GET /api/audit/issue?severity=P0,P1&limit=10
```

**응답 (성공 200):**
```json
{
  "issues": [
    {
      "id": 1,
      "severity": "P0",
      "title": "Backup failure on storage node 3",
      "description": "3개 파일이 복구 불가능",
      "affected_metric": "recovery_possible_rate",
      "impact": "DRS -2.3%",
      "detected_at": "2026-05-20T02:45:00Z",
      "suggested_action": "저장소 점검 필요"
    },
    ...
  ],
  "total_critical": 1,
  "total_caution": 3
}
```

**구현 위치:** `app/api/audit/issue/route.ts`

---

#### API 4: `POST /api/audit/cron`
**목적:** 매일 03:30 자동 실행 (Vercel Cron)

**엔드포인트:**
```
POST /api/audit/cron
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json
```

**요청 본문:**
```json
{
  "timestamp": "2026-05-20T03:30:00Z"
}
```

**응답 (성공 200):**
```json
{
  "status": "success",
  "report_date": "2026-05-20",
  "drs_calculated": 94.2,
  "backup_success": 99.1,
  "api_response_ms": 1920,
  "recovery_possible": 96.8,
  "alert_delivery": 98.5,
  "alerts_triggered": 0,
  "file_saved": "backup_audit_20260520.json",
  "execution_time_ms": 3421
}
```

**구현 위치:** `app/api/audit/cron/route.ts`

**로직:**
```typescript
export async function POST(request: Request) {
  // 1. CRON_SECRET 검증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. DRS 계산 (데이터분석가가 제공한 함수 호출)
  const drsResult = await calculateDRS(new Date());
  
  // 3. audit_reports에 저장
  const report = await supabase
    .from('audit_reports')
    .insert({
      report_date: format(new Date(), 'yyyy-MM-dd'),
      drs_score: drsResult.drs,
      backup_success_rate: drsResult.backup_success,
      api_response_time_ms: drsResult.api_response_ms,
      recovery_possible_rate: drsResult.recovery_possible,
      alert_delivery_rate: drsResult.alert_delivery
    })
    .select()
    .single();

  // 4. audit_metrics에 세부 저장
  await supabase
    .from('audit_metrics')
    .insert([
      { report_id: report.id, metric_name: 'backup_success', metric_value: drsResult.backup_success, ... },
      // ... 4개 메트릭
    ]);

  // 5. JSON 파일 저장소에 저장
  const fileName = `backup_audit_${format(new Date(), 'yyyyMMdd')}.json`;
  await saveToStorage(fileName, JSON.stringify(drsResult));

  // 6. DRS <85% 체크 → 즉시 알림
  if (drsResult.drs < 85) {
    await triggerCriticalAlert(drsResult);
  }

  return Response.json({
    status: 'success',
    report_date: format(new Date(), 'yyyy-MM-dd'),
    drs_calculated: drsResult.drs,
    ...drsResult,
    file_saved: fileName
  });
}
```

**Vercel Cron 설정:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/audit/cron",
      "schedule": "30 3 * * *"  // 매일 03:30 KST (이건 UTC 기준이므로 조정 필요)
    }
  ]
}
```

**체크리스트:**
- [ ] 4개 API 라우트 생성
- [ ] 각 API 입력/출력 검증 추가
- [ ] 에러 처리 (500, 400, 404)
- [ ] 로깅 추가 (각 API 호출 기록)

---

### Task 1-3: 파일 저장소 설정

**목적:** 일일 JSON 스냅샷 자동 저장

**저장 위치:** Supabase Storage → `audit-reports` 버킷

**파일명 형식:** `backup_audit_YYYYMMDD.json`

**샘플 파일 구조:**
```json
{
  "report_date": "2026-05-20",
  "drs_score": 94.2,
  "metrics": {
    "backup_success_rate": 99.1,
    "api_response_time_ms": 1920,
    "recovery_possible_rate": 96.8,
    "alert_delivery_rate": 98.5
  },
  "calculation_details": {
    "backup_files_tested": 1000,
    "backup_files_success": 991,
    "recovery_files_tested": 1000,
    "recovery_files_success": 968,
    "alerts_sent": 0,
    "alerts_delivered": 0
  },
  "generated_at": "2026-05-20T03:30:00Z",
  "calculation_time_ms": 3421
}
```

**구현:**
```typescript
async function saveToStorage(fileName: string, content: string) {
  const { data, error } = await supabase.storage
    .from('audit-reports')
    .upload(fileName, content, {
      contentType: 'application/json',
      upsert: true
    });

  if (error) {
    console.error(`Failed to save ${fileName}:`, error);
    throw error;
  }
  
  return data;
}
```

---

## 🔔 Day 2: 즉시 알림 메커니즘 (2026-05-21)

### 최우선 구현: DRS <85% 즉시 알림

**SLA:** DRS <85% 감지 후 1분 내 알림 도착

**아키텍처:**

```
┌─────────────────────────────────────────────────────┐
│                  Vercel Cron (2분 주기)                  │
│  └─ POST /api/audit/cron 실행 → DRS 계산              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │  DRS 계산 완료   │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │  DRS <85% 체크   │
         └────────┬─────────┘
                  │ YES
         ┌────────▼──────────────────────┐
         │   triggerCriticalAlert()       │
         └────┬───────────────┬──────┬────┘
              │               │      │
         ┌────▼────┐  ┌──────▼─┐ ┌──▼─────────┐
         │Telegram │  │Discord │ │audit_alerts│
         │Bot DM   │  │#감사시  │ │ 테이블기록 │
         │(CEO)    │  │스템    │ │             │
         └─────────┘  └────────┘ └──────────┘
```

**구현 Task 2-1: 즉시 알림 함수**

```typescript
// lib/audit-alerts.ts
export async function triggerCriticalAlert(drsResult: DRSCalculationResult) {
  const { drs_score, backup_success_rate, recovery_possible_rate } = drsResult;
  
  if (drs_score >= 85) {
    return; // 알림 필요 없음
  }

  // 1. Telegram 알림 (CEO 직접)
  const telegramMessage = `
🔴 **CRITICAL: DRS <85%**

저장소 신뢰도: ${drs_score.toFixed(1)}%
└─ Backup 성공률: ${backup_success_rate.toFixed(1)}%
└─ 복구 가능률: ${recovery_possible_rate.toFixed(1)}%

**즉시 점검 필요**
시각: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} KST
`;

  await sendTelegramAlert(process.env.CEO_TELEGRAM_CHAT_ID, telegramMessage);

  // 2. Discord 알림 (#감사시스템 채널)
  const discordEmbed = {
    color: 0xFF0000,  // 빨강
    title: '🔴 Critical DRS Alert',
    description: `DRS Score: ${drs_score.toFixed(1)}%`,
    fields: [
      { name: 'Backup Success', value: `${backup_success_rate.toFixed(1)}%` },
      { name: 'Recovery Possible', value: `${recovery_possible_rate.toFixed(1)}%` },
      { name: 'Timestamp', value: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
    ]
  };

  await sendDiscordWebhook(process.env.DISCORD_AUDIT_WEBHOOK, { embeds: [discordEmbed] });

  // 3. audit_alerts 테이블 기록
  await supabase
    .from('audit_alerts')
    .insert({
      alert_type: 'drs_low',
      drs_value: drs_score,
      triggered_at: new Date(),
      alerted_at: new Date(),
      delivery_channel: 'telegram',
      status: 'sent',
      retry_count: 0
    });
}
```

**구현 Task 2-2: Telegram 재시도 로직**

```typescript
// lib/notify-telegram.ts
async function sendTelegramAlert(chatId: string, message: string, maxRetries = 3) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (response.ok) {
        console.log(`Telegram alert sent successfully on attempt ${attempt}`);
        return { success: true, attempt };
      }

      // API 에러 → 재시도
      lastError = new Error(`HTTP ${response.status}`);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
      }
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  // 모든 시도 실패
  console.error(`Failed to send Telegram alert after ${maxRetries} attempts:`, lastError);
  throw lastError;
}
```

**구현 Task 2-3: Discord 웹훅**

```typescript
// lib/notify-discord.ts
async function sendDiscordWebhook(webhookUrl: string, payload: any) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: HTTP ${response.status}`);
  }

  return response.json();
}
```

**체크리스트:**
- [ ] Telegram Bot token 설정 확인 (환경변수)
- [ ] CEO Telegram Chat ID 확인
- [ ] Discord #감사시스템 웹훅 URL 확인
- [ ] 재시도 로직 테스트 (Telegram 실패 → 3회 재시도)

---

### Task 2-4: 기존 notify lib 통합

**기존 코드 활용:**
```typescript
import { notify } from '@/lib/notify';

// Email + Telegram 동시 발송
await notify({
  type: 'audit_alert',
  email: process.env.SECRETARY_EMAIL,
  telegram: process.env.CEO_TELEGRAM_CHAT_ID,
  subject: 'Critical DRS Alert',
  message: `DRS <85%: ${drs_score.toFixed(1)}%`
});
```

---

### Task 2-5: 모니터링 메트릭

**추적할 메트릭:**

```typescript
// lib/alert-monitoring.ts
export async function trackAlertMetrics() {
  // 금일 알림 통계
  const todayAlerts = await supabase
    .from('audit_alerts')
    .select('*')
    .gte('created_at', startOfDay(new Date()))
    .lte('created_at', endOfDay(new Date()));

  // 평균 전달 시간 (triggered_at → alerted_at)
  const avgDeliveryTime = todayAlerts
    .reduce((sum, alert) => sum + (alert.alerted_at - alert.triggered_at), 0) / todayAlerts.length;

  // 성공률
  const successRate = todayAlerts.filter(a => a.status === 'sent').length / todayAlerts.length;

  console.log(`Alert Metrics:
- Total: ${todayAlerts.length}
- Success Rate: ${(successRate * 100).toFixed(1)}%
- Avg Delivery Time: ${avgDeliveryTime.toFixed(0)}ms`);
}
```

**체크리스트:**
- [ ] 일일 알림 통계 대시보드 생성
- [ ] 평가자 검증 준비 (2026-05-21 15:00)

---

## 🧪 Day 3: QA + 배포 (2026-05-22~23)

### 평가자 검증 항목

**기능 테스트:**
- [ ] `GET /api/audit/report` — 현재/과거 데이터 조회
- [ ] `GET /api/audit/trend` — 7일 추이 그래프
- [ ] `GET /api/audit/issue` — P0 이슈 리스트
- [ ] `POST /api/audit/cron` — 매일 03:30 자동 실행 확인

**알림 검증:**
- [ ] DRS <85% 설정 (테스트 데이터) → 1분 내 Telegram 알림 도착
- [ ] Discord #감사시스템 메시지 자동 게시 확인
- [ ] 재시도 로직 동작 (Telegram 실패 → 자동 3회 재시도)

**신뢰도 검증:**
- [ ] 백업 복구 가능률 ≥96%
- [ ] API 응답시간 <2s
- [ ] 알림 정확도 99% 이상 (오탐 <1%)

---

## 📦 배포 체크리스트 (2026-05-24)

- [ ] 환경변수 설정 (TELEGRAM_BOT_TOKEN, CEO_TELEGRAM_CHAT_ID, DISCORD_AUDIT_WEBHOOK, CRON_SECRET)
- [ ] Vercel Cron 설정 확인 (매일 03:30 KST)
- [ ] Supabase 테이블 마이그레이션 완료 (프로덕션)
- [ ] 저장소 버킷 생성 확인 (audit-reports)
- [ ] 모니터링 대시보드 활성화

---

## 📞 문의 및 블로킹 시

**즉시 연락:**
- 플레너: 구현 계획 조정
- 데이터분석가: DRS 계산 로직
- 평가자: QA 검증 기준

**일일 회의 (15:00):**
- 진도 리포트 (완료 %, 블로킹 항목)
- 피로도 체크
- 다음날 계획 확인
