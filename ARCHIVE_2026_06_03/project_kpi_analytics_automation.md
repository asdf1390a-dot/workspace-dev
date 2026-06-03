---
name: KPI 자동 통계 & 이상치 감시 자동화 설계
description: Project 3 — 매주 월요일 08:00 KST 자동 집계 + 이상치 감지 (완료 목표 2026-05-30)
type: project
status: pending
targetDate: 2026-05-30
---

# Project 3: KPI 자동 통계 & 이상치 감시 자동화 (2026-05-19)

## 📋 개요

**목표:** Asset Master, Backup App, BM (설비고장) 데이터를 주 1회(월요일 08:00) 자동 집계하여 통계 + 이상치 감지 + Telegram 배포

**완료 기준:**
- ✅ Asset KPI (수량, 카테고리 분포) 집계
- ✅ Backup KPI (성공률, 복구시간, 저장소) 집계
- ✅ BM KPI (고장 건수, MTBF, MTTR, 부서별) 집계
- ✅ 이상치 감지 (Z-score 기반, 3개 경고 기준)
- ✅ 대시보드 API (조회 기능)
- ✅ Telegram 배포 (주간 리포트)

---

## 🏗️ 아키텍처

```
┌────────────────────────────────────────┐
│ Vercel Cron (매주 월요일 08:00 KST)     │
│ POST /api/cron/kpi-analytics/weekly-report
└────────────┬─────────────────────────┘
             │
    ┌────────▼─────────────────┐
    │ Data Aggregation          │
    ├─ Asset count by category
    ├─ Backup success rate      │
    ├─ BM incident frequency    │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Statistical Analysis       │
    │ - 평균 (Mean)             │
    │ - 표준편차 (Std Dev)      │
    │ - 추세선 (Trend)          │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Anomaly Detection          │
    │ (Z-score >= 2.0σ)         │
    │ - 임계값 위반             │
    │ - 이상 패턴               │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Alert Generation           │
    │ - 🔴 Critical (SLA 위반)  │
    │ - 🟡 Warning (추세 악화)  │
    │ - ℹ️ Info (변화 감지)      │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Telegram Formatter         │
    │ + Dashboard Link          │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Data Persistence           │
    │ - kpi_history 테이블      │
    │ - 실행 로그                │
    └────────────────────────────┘
```

---

## 📊 KPI 정의

### 1. Asset Master KPI

| KPI | 정의 | 주기 | 계산식 |
|-----|------|------|--------|
| **Total Assets** | 전체 자산 수 | 주간 | COUNT(*) from assets |
| **Asset by Category** | 카테고리별 분포 | 주간 | GROUP BY category |
| **Active Assets** | 활성 자산 비율 | 주간 | COUNT(status='active') / COUNT(*) |
| **Asset Age** | 평균 자산 연식 | 주간 | AVG(YEAR(NOW()) - YEAR(purchase_date)) |
| **Depreciation** | 감가상각 추이 | 주간 | SUM(depreciation_amount) |

### 2. Backup App KPI

| KPI | 정의 | 주기 | 계산식 | SLA |
|-----|------|------|--------|-----|
| **Success Rate** | 성공률 | 일/주 | (successful / total) × 100 | > 95% |
| **Avg Recovery Time** | 평균 복구시간 | 일/주 | AVG(restore_duration) | < 5분 |
| **Storage Usage** | 저장소 사용률 | 일/주 | used / quota | < 80% |
| **Failed Backups** | 실패 건수 | 주간 | COUNT(status='failed') | < 5 |
| **Data Integrity** | 데이터 무결성 | 주간 | 복원 후 검증 성공률 | 100% |

### 3. BM (설비고장) KPI

| KPI | 정의 | 주기 | 계산식 | 임계값 |
|-----|------|------|--------|--------|
| **Incident Count** | 고장 건수 | 주간 | COUNT(*) | avg + 1σ |
| **MTBF** | 평균무고장시간 | 주간 | Total Hours / Incidents | > 168h |
| **MTTR** | 평균복구시간 | 주간 | SUM(downtime) / COUNT(*) | < 2h |
| **Downtime %** | 가동정지율 | 주간 | SUM(downtime) / 168h | < 1% |
| **Top Problem** | 가장 빈발한 문제 | 주간 | MODE(failure_type) | — |

---

## 💾 데이터베이스 스키마

```sql
-- KPI 이력 저장
CREATE TABLE kpi_history (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE GENERATED ALWAYS AS (week_start + INTERVAL '6 days') STORED,
  
  -- Asset KPI
  asset_count INTEGER,
  asset_by_category JSONB,  -- {"Machine": 120, "Spare": 45, ...}
  asset_active_ratio FLOAT,
  asset_avg_age FLOAT,
  
  -- Backup KPI
  backup_success_rate FLOAT,
  backup_avg_recovery_time INTEGER,  -- minutes
  backup_storage_usage FLOAT,  -- percentage
  backup_failed_count INTEGER,
  
  -- BM KPI
  bm_incident_count INTEGER,
  bm_mtbf FLOAT,  -- hours
  bm_mttr FLOAT,  -- hours
  bm_downtime_percent FLOAT,
  bm_top_problem VARCHAR(255),
  
  -- Metadata
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by VARCHAR(50) DEFAULT 'cron:kpi-analytics',
  
  UNIQUE(week_start)
);

-- 이상치 알림
CREATE TABLE anomaly_alerts (
  id SERIAL PRIMARY KEY,
  week_start DATE,
  severity VARCHAR(20),  -- 'info' | 'warning' | 'critical'
  kpi_name VARCHAR(100),
  value FLOAT,
  threshold FLOAT,
  zscore FLOAT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  telegram_sent BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (week_start) REFERENCES kpi_history(week_start)
);

CREATE INDEX idx_anomaly_week ON anomaly_alerts(week_start DESC);
CREATE INDEX idx_anomaly_severity ON anomaly_alerts(severity);
```

---

## 💻 구현 상세

### 1. API 엔드포인트

#### 주간 KPI 리포트 생성
```http
POST /api/cron/kpi-analytics/weekly-report HTTP/1.1
Authorization: Bearer <CRON_SECRET>
```

**응답 (예):**
```json
{
  "status": 200,
  "weekStart": "2026-05-18",
  "weekEnd": "2026-05-24",
  "kpiData": {
    "asset": { "count": 506, "active_ratio": 0.98, "avg_age": 5.2 },
    "backup": { "success_rate": 0.97, "avg_recovery_min": 3.2, "storage_usage": 0.42 },
    "bm": { "incident_count": 3, "mtbf": 224.5, "mttr": 1.8, "downtime_percent": 0.12 }
  },
  "anomalies": [
    { "severity": "info", "kpi": "asset_count", "message": "주간 +5개 증가 (+1.0%)" },
    { "severity": "warning", "kpi": "bm_mttr", "message": "증가 추세 (1.6 → 1.8h)" }
  ],
  "telegramSent": true
}
```

#### KPI 히스토리 조회
```http
GET /api/kpi-analytics/history?type=asset|backup|bm&weeks=4 HTTP/1.1
Authorization: Bearer <API_KEY>
```

**응답:**
```json
{
  "type": "asset",
  "weeks": 4,
  "data": [
    { "week": "2026-05-04", "count": 500, "active_ratio": 0.97 },
    { "week": "2026-05-11", "count": 502, "active_ratio": 0.98 },
    { "week": "2026-05-18", "count": 506, "active_ratio": 0.98 },
    { "week": "2026-05-25", "count": 510, "active_ratio": 0.99 }
  ],
  "trend": {
    "direction": "up",
    "rate": 2.5,  -- percentage per week
    "prediction_next_week": 512
  }
}
```

### 2. 파일 구조

```
app/api/cron/kpi-analytics/
├── weekly-report/
│   └── route.ts                 # 크론 엔드포인트
app/api/kpi-analytics/
├── history/
│   └── route.ts                 # 대시보드 조회 API
lib/kpi/
├── aggregator.ts                # 데이터 집계
├── statistics.ts                # 통계 계산 (mean, std, trend)
├── anomaly-detection.ts         # 이상치 판정 (Z-score)
├── alert-generator.ts           # 경고 생성
├── telegram-formatter.ts        # Telegram 포맷팅
└── types.ts

db/migrations/
└── 005_kpi_analytics_schema.sql
```

### 3. 핵심 통계 로직

```typescript
// lib/kpi/statistics.ts
export interface Statistics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  trendRate: number;  // percentage per week
}

export function calculateStatistics(
  values: number[],
  window: number = 4  // 최근 4주
): Statistics {
  const recent = values.slice(-window);
  
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / recent.length;
  const stdDev = Math.sqrt(variance);
  
  // 선형 추세 계산
  const n = recent.length;
  const sumX = n * (n - 1) / 2;
  const sumXY = recent.reduce((sum, y, i) => sum + i * y, 0);
  const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
  const slope = (n * sumXY - sumX * recent.reduce((a, b) => a + b, 0)) /
                (n * sumX2 - sumX * sumX);
  
  const trendRate = (slope / mean) * 100;  // percentage
  const trend = Math.abs(trendRate) < 2 ? 'stable' : trendRate > 0 ? 'up' : 'down';
  
  return {
    mean,
    stdDev,
    min: Math.min(...recent),
    max: Math.max(...recent),
    trend,
    trendRate: Math.round(trendRate * 10) / 10,
  };
}

// Z-score 기반 이상치 감지
export function detectAnomalies(
  value: number,
  stats: Statistics,
  threshold: number = 2.0
): { isAnomaly: boolean; zscore: number } {
  const zscore = (value - stats.mean) / stats.stdDev;
  return {
    isAnomaly: Math.abs(zscore) >= threshold,
    zscore: Math.round(zscore * 100) / 100,
  };
}
```

### 4. 경고 규칙 (Alert Rules)

```typescript
// lib/kpi/alert-generator.ts
interface AlertRule {
  kpi: string;
  metric: 'value' | 'trend' | 'zscore';
  operator: '>' | '<' | '>=';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: (value: number, threshold: number) => string;
}

const alertRules: AlertRule[] = [
  // Backup 성공률
  {
    kpi: 'backup_success_rate',
    metric: 'value',
    operator: '<',
    threshold: 0.95,
    severity: 'critical',
    message: (v, t) => `Backup 성공률 ${(v * 100).toFixed(1)}% < ${(t * 100).toFixed(1)}% (SLA 위반)`,
  },
  // BM 증가 추세
  {
    kpi: 'bm_incident_count',
    metric: 'zscore',
    operator: '>=',
    threshold: 2.0,
    severity: 'warning',
    message: (v) => `BM 발생률 이상 증가 (Z-score ${v})`,
  },
  // Asset 변화 감지
  {
    kpi: 'asset_count',
    metric: 'value',
    operator: '>',
    threshold: 0.05,  // 5%
    severity: 'info',
    message: (v) => `Asset 수량 변화 감지 (${(v * 100).toFixed(1)}% 증가)`,
  },
];
```

---

## 🧪 테스트 계획

### 테스트 데이터 시뮬레이션 (Day 7)

```sql
-- 지난 4주 데이터 생성 (시뮬레이션)
INSERT INTO kpi_history (week_start, asset_count, backup_success_rate, bm_incident_count)
VALUES
  ('2026-05-04'::date, 500, 0.97, 2),
  ('2026-05-11'::date, 502, 0.96, 1),
  ('2026-05-18'::date, 505, 0.98, 3),  -- BM 이상 증가
  ('2026-05-25'::date, 510, 0.99, 2);  -- Asset 증가
```

### 통계 검증
- [ ] Z-score 계산 정확도 (수동 계산 vs 함수)
- [ ] 이상치 감지 정밀도 (거짓양성/음성 비율)
- [ ] 추세선 예측 오차 (< 5%)

---

## 📈 Telegram 메시지 포맷

```
📊 Weekly KPI Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗓️ W20 (2026-05-18 ~ 2026-05-24)

💾 Asset Master
├ 수량: 506 ↗︎ (+4, +0.8%)
├ 활성비: 98% (목표 95% ✅)
└ 평균연식: 5.2년

📦 Backup App
├ 성공률: 97% ✅ (SLA 95%)
├ 복구시간: 3.2분 ⬇︎ (-0.4분)
├ 저장소: 42% (임계값 80% ✅)
└ 실패: 1건 (목표 < 5 ✅)

⚙️ BM (설비고장)
├ 고장건수: 3 ⚠️ (평균 2.0, Z=1.2)
├ MTBF: 224.5시간 ⬇︎ (-15h)
├ MTTR: 1.8시간 ⬆︎ (+0.2h) ⚠️
├ 가동중단: 0.12% ✅
└ 최빈문제: 모터 베어링 (2건)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 주의 항목 (2개)
1️⃣ BM 발생률 증가 추세
   → 예방 보전 강화 필요
2️⃣ MTTR 증가 (2.0 → 1.8h)
   → 부품 재고 점검

🔗 대시보드: [보기](https://dsc-fms.vercel.app/analytics)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ 완료 체크리스트

- [ ] Day 6: 통계 공식 검증 (수동 계산)
- [ ] Day 7: 이상치 감지 미세조정 (False Positive 최소화)
- [ ] Day 8: 4주 데이터 시뮬레이션 후 Cron 배포
- [ ] Day 8+: 첫 2회 실행 모니터링 (로그 검증)

---

**참고:**
- Z-score 임계값: 기본값 2.0σ (95% 신뢰도)
- SLA 기준: Backup 성공률 95% (CRITICAL), Asset 활성비 95%, BM MTTR < 2h
- 보고 주기: 매주 월요일 08:00 KST (고정)
