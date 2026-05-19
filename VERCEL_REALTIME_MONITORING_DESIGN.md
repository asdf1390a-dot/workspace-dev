# Vercel 실시간 감시 자동화 대시보드 — 상세 설계

**문서 버전:** v1.0  
**작성일:** 2026-05-17  
**담당 에이전트:** Planner  
**검증 대상:** Evaluator → Web-Builder  
**개발 예상기간:** 5-7일  

---

## 1. Executive Summary

Vercel 배포 현황을 **실시간으로 감시**하고 대시보드에 표시하는 자동화 시스템. 빌드/배포 상태, 성능 메트릭, 히스토리 트렌드를 한눈에 추적하고, 장애 발생 시 즉시 알림 발송.

**핵심 가치:**
- 배포 완료 시간 추적 (매번 수동 확인 불필요)
- 성능 저하 감지 자동화 (Vercel 임계값 기반)
- 배포 실패 즉시 알림
- 90일 히스토리 보관 및 분석

---

## 2. 아키텍처

```
┌─────────────────────────────────────────────┐
│        Vercel API (Polling)                 │
│  - Projects API                             │
│  - Deployments API                          │
│  - Analytics API (성능 메트릭)               │
└────────────────┬────────────────────────────┘
                 │ (매 5분마다)
                 ▼
        ┌────────────────────┐
        │  Edge Function     │
        │  /api/monitoring   │
        │  (실시간 폴링)      │
        └────────┬───────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
Supabase    Telegram   Discord
Database    Alert      Alert
(저장)      (즉시)     (상세)

┌─────────────────────────────────────┐
│     Dashboard UI (Next.js Page)     │
│  - Real-time Status                 │
│  - Build/Deploy Timeline            │
│  - Performance Metrics              │
│  - Alert History                    │
└─────────────────────────────────────┘
```

**주요 특징:**
1. **Polling-based** (Webhook 불가능한 환경 대비)
   - 5분 주기 폴링
   - Rate limit: Vercel API 100 req/hour 안내
   - 지수 백오프 재시도

2. **Database 저장소**
   - 배포 히스토리
   - 성능 메트릭 (시계열)
   - 알림 로그
   - 90일 자동 삭제

3. **실시간 알림**
   - 배포 완료: Telegram
   - 배포 실패: Telegram + Discord
   - 성능 저하: Discord (상세 분석)

---

## 3. Vercel API 명세

### 3.1 Vercel 연동 (인증)

```javascript
// 필수: Vercel API 토큰
// VERCEL_TOKEN (env var, read-only 권한)
// 
// Permissions:
// - read:deployments
// - read:projects
// - read:analytics
```

### 3.2 핵심 API 엔드포인트

#### A. 프로젝트 목록 조회
```
GET https://api.vercel.com/v9/projects
Headers: Authorization: Bearer {VERCEL_TOKEN}

Response:
{
  "projects": [
    {
      "id": "prj_xxxxx",
      "name": "dsc-fms-portal",
      "accountId": "...",
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

#### B. 배포 목록 조회 (최근 20개)
```
GET https://api.vercel.com/v13/deployments?projectId={projectId}&limit=20
Headers: Authorization: Bearer {VERCEL_TOKEN}

Response:
{
  "deployments": [
    {
      "uid": "dpl_xxxxx",
      "name": "dsc-fms-portal",
      "url": "https://...",
      "createdAt": 1234567890,
      "state": "READY" | "BUILDING" | "ERROR" | "QUEUED",
      "creator": {
        "uid": "...",
        "email": "..."
      },
      "production": true,
      "target": "production" | "staging",
      "meta": {
        "branch": "main",
        "commit": "abc123",
        "githubCommitUrl": "..."
      }
    }
  ]
}
```

#### C. 배포 상세 조회
```
GET https://api.vercel.com/v13/deployments/{deploymentId}
Headers: Authorization: Bearer {VERCEL_TOKEN}

Response:
{
  "uid": "dpl_xxxxx",
  "state": "READY",
  "buildingAt": 1234567890,
  "readyStateAt": 1234567890,
  "error": null,
  "errorCode": null,
  "buildErrorCode": null,
  "functions": [
    {
      "path": "/api/...",
      "runtime": "nodejs18.x",
      "memorySize": 1024
    }
  ]
}
```

#### D. 프로젝트별 최신 배포
```
GET https://api.vercel.com/v13/deployments?projectId={projectId}&limit=1
```

#### E. Analytics API (성능 메트릭)
```
POST https://api.vercel.com/v0/analytics/data
Headers: Authorization: Bearer {VERCEL_TOKEN}
Body:
{
  "datasetId": "web_vitals_analytics",
  "projectId": "{projectId}",
  "granularity": "hourly",
  "limit": 24,
  "query": {
    "select": ["p75(Core Web Vitals)", "status_code"],
    "group": ["timestamp"]
  }
}
```

**Vercel API Rate Limit:**
- 100 requests per hour
- Polling 5분 주기 = 288 req/day → OK

---

## 4. 데이터베이스 스키마

### 4.1 Core Tables

#### `vercel_deployments`
```sql
CREATE TABLE vercel_deployments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Vercel 데이터
  deployment_id VARCHAR(32) NOT NULL UNIQUE,  -- Vercel uid
  project_id VARCHAR(32) NOT NULL,
  project_name VARCHAR(256) NOT NULL,
  
  -- 배포 정보
  state VARCHAR(20) NOT NULL,  -- READY, BUILDING, ERROR, QUEUED
  url VARCHAR(512),
  branch VARCHAR(256),
  commit_sha VARCHAR(40),
  commit_url VARCHAR(512),
  creator_email VARCHAR(256),
  
  -- 타이밍
  created_at TIMESTAMP WITH TIME ZONE,
  building_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  
  -- 빌드 시간 계산
  build_duration_ms BIGINT,  -- ready_at - building_at
  total_duration_ms BIGINT,  -- ready_at - created_at
  
  -- 에러 정보
  error_message TEXT,
  error_code VARCHAR(64),
  
  -- 추적
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 인덱스용
  created_date DATE GENERATED ALWAYS AS (created_at::date) STORED,
  
  CONSTRAINT vercel_deployments_state_check CHECK (
    state IN ('READY', 'BUILDING', 'ERROR', 'QUEUED')
  )
);

CREATE INDEX idx_vercel_deployments_created_date ON vercel_deployments(created_date DESC);
CREATE INDEX idx_vercel_deployments_project ON vercel_deployments(project_id);
CREATE INDEX idx_vercel_deployments_state ON vercel_deployments(state);
```

#### `vercel_metrics` (성능 메트릭 — 시계열)
```sql
CREATE TABLE vercel_metrics (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  deployment_id VARCHAR(32) NOT NULL REFERENCES vercel_deployments(deployment_id),
  project_id VARCHAR(32) NOT NULL,
  
  -- Web Vitals
  lcp_p75_ms NUMERIC(8,2),  -- Largest Contentful Paint
  fid_p75_ms NUMERIC(8,2),  -- First Input Delay
  cls_p75_numeric NUMERIC(6,4),  -- Cumulative Layout Shift
  
  -- Error Rate
  error_rate_percent NUMERIC(5,2),
  
  -- Response Time
  response_time_p75_ms NUMERIC(8,2),
  
  measured_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT metrics_positive_check CHECK (
    lcp_p75_ms >= 0 AND fid_p75_ms >= 0 AND cls_p75_numeric >= 0
  )
);

CREATE INDEX idx_vercel_metrics_deployment ON vercel_metrics(deployment_id);
CREATE INDEX idx_vercel_metrics_measured_at ON vercel_metrics(measured_at DESC);
```

#### `vercel_alerts` (알림 로그)
```sql
CREATE TABLE vercel_alerts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  deployment_id VARCHAR(32) NOT NULL REFERENCES vercel_deployments(deployment_id),
  alert_type VARCHAR(32) NOT NULL,  -- deploy_complete, deploy_failed, perf_degraded
  severity VARCHAR(10) NOT NULL,  -- critical, warning, info
  
  -- 알림 내용
  message TEXT NOT NULL,
  notification_channels TEXT[],  -- ['telegram', 'discord']
  
  -- 추적
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT alert_type_check CHECK (
    alert_type IN ('deploy_complete', 'deploy_failed', 'perf_degraded', 'build_slow')
  )
);

CREATE INDEX idx_vercel_alerts_deployment ON vercel_alerts(deployment_id);
CREATE INDEX idx_vercel_alerts_triggered_at ON vercel_alerts(triggered_at DESC);
```

#### `vercel_projects` (추적 프로젝트 설정)
```sql
CREATE TABLE vercel_projects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  project_id VARCHAR(32) NOT NULL UNIQUE,
  project_name VARCHAR(256) NOT NULL,
  
  -- 감시 설정
  monitoring_enabled BOOLEAN DEFAULT true,
  alert_on_complete BOOLEAN DEFAULT true,
  alert_on_failure BOOLEAN DEFAULT true,
  
  -- 성능 임계값
  build_time_threshold_ms BIGINT DEFAULT 300000,  -- 5분
  error_rate_threshold_percent NUMERIC(5,2) DEFAULT 2.0,
  lcp_threshold_ms BIGINT DEFAULT 2500,
  
  -- 추적
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 자동 정리 (90일)

```sql
-- Weekly cleanup job (Vercel Edge Function으로 실행)
DELETE FROM vercel_metrics
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM vercel_deployments
WHERE created_at < NOW() - INTERVAL '90 days'
  AND state IN ('READY', 'ERROR');  -- 진행 중인 배포는 유지

DELETE FROM vercel_alerts
WHERE triggered_at < NOW() - INTERVAL '90 days';
```

---

## 5. 대시보드 UI 설계

### 5.1 레이아웃 (Next.js Page)

```
/app/monitoring/vercel/page.tsx

┌────────────────────────────────────────┐
│     Vercel Deployment Monitor          │
│  [Refresh] [Settings] [Export]         │
└────────────────────────────────────────┘

┌──────────────┬─────────────────────────┐
│  Status Box  │  Current Build Status   │
│  (KPI)       │  - State: READY         │
│              │  - Build time: 4m 23s   │
│              │  - Deployment: OK       │
└──────────────┴─────────────────────────┘

┌────────────────────────────────────────┐
│  Recent Deployments (Timeline)         │
│  ┌──────────────────────────────────┐  │
│  │ 2026-05-17 13:45 ✅ READY        │  │
│  │  main / abc123... (4m 23s)       │  │
│  │  Performance: LCP 1.8s (good)    │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 2026-05-17 12:15 ❌ ERROR        │  │
│  │  staging / def456... (failed)    │  │
│  │  Error: SCRIPT_EXECUTION_FAILED  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Performance Metrics (24h)             │
│  ┌──────────────────────────────────┐  │
│  │ LCP (p75):     1.8s ━━━━━━        │  │
│  │ Error Rate:    0.5% ━             │  │
│  │ Build Time:    4m 23s ━━━━        │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Alerts (최근 7일)                      │
│  - 2026-05-17 13:45: Deploy complete  │
│  - 2026-05-17 12:15: Deploy FAILED ⚠️  │
│  - 2026-05-16 08:30: Perf degraded    │
└────────────────────────────────────────┘
```

### 5.2 컴포넌트 구조

```
VercelMonitoringPage
├── VStatus Box (KPI 요약)
│   ├── CurrentDeploymentStatus
│   └── BuildTimeIndicator
├── DeploymentTimeline
│   ├── DeploymentCard (반복)
│   │   ├── StateIcon
│   │   ├── MetaInfo
│   │   └── PerformanceStats
│   └── TimelineFilter
├── PerformanceChart
│   ├── LCPChart (시계열)
│   ├── ErrorRateChart
│   └── BuildTimeChart
├── AlertHistory
│   ├── AlertFilter
│   └── AlertCard (반복)
└── SettingsModal (임계값 조정)
```

### 5.3 실시간 갱신

```typescript
// 클라이언트 폴링 (2분마다)
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/monitoring/vercel/status').then(...)
  }, 120000);
  return () => clearInterval(interval);
}, []);

// 또는 Server-Sent Events (SSE)
// /api/monitoring/vercel/stream로 실시간 스트림
```

---

## 6. 알림 규칙

### 6.1 배포 완료
```
Trigger: state = READY
Message: ✅ Deploy complete: dsc-fms-portal
  • Branch: main
  • Build time: 4m 23s
  • URL: https://...
  • Commit: abc123...
Channel: Telegram (@DSC_team)
```

### 6.2 배포 실패
```
Trigger: state = ERROR
Message: ❌ Deploy FAILED: dsc-fms-portal
  • Error: SCRIPT_EXECUTION_FAILED
  • Branch: main
  • Commit: abc123...
Channel: Telegram + Discord #배포
```

### 6.3 성능 저하
```
Trigger: LCP > 2.5s OR ErrorRate > 2%
Message: ⚠️ Performance degraded: dsc-fms-portal
  • LCP: 3.2s (threshold: 2.5s)
  • Error Rate: 2.8% (threshold: 2%)
  • Deploy: dpl_xxxxx (5h ago)
Channel: Discord #성능-모니터링
```

### 6.4 빌드 느림
```
Trigger: build_duration > threshold (기본 5분)
Message: 🐌 Slow build: dsc-fms-portal
  • Duration: 7m 45s (avg: 4m 30s)
  • Branch: feature/optimization
Channel: Discord #개발자
```

---

## 7. 개발 체크리스트

### Phase 1: Setup & DB (1일)
- [ ] Vercel API 토큰 설정 (env)
- [ ] Database 마이그레이션 (4 tables)
- [ ] Edge Function 기본 구조

### Phase 2: Polling & Data (2일)
- [ ] Vercel API 폴링 로직
- [ ] Deployment 저장
- [ ] Metrics 수집 (Analytics API)
- [ ] Alert 규칙 실행

### Phase 3: Notification (1일)
- [ ] Telegram 알림
- [ ] Discord 알림
- [ ] Alert 로그 기록

### Phase 4: UI & Dashboard (2일)
- [ ] Status Box
- [ ] Deployment Timeline
- [ ] Performance Charts
- [ ] Alert History

### Phase 5: Testing & Deploy (1일)
- [ ] End-to-end 테스트
- [ ] Vercel 배포
- [ ] 5분 폴링 검증

---

## 8. 비용 분석

| 항목 | 가격 | 월간 비용 |
|-----|------|----------|
| Vercel API | 무료 (100 req/h) | $0 |
| Supabase Storage (1GB) | 무료 | $0 |
| Supabase DB (90일 히스토리) | 무료 (500MB 이하) | $0 |
| Edge Function 실행 (288 req/day) | 무료 | $0 |
| **Total** | | **$0** |

---

## 9. 보안 고려사항

1. **Vercel API Token**
   - `.env.local` (절대 커밋 금지)
   - read-only 권한만 사용

2. **데이터 접근 제어**
   - RLS: vercel_* 테이블은 authenticated users만
   - 대시보드: DSC Admin만 접근 권한

3. **Rate Limiting**
   - Edge Function: 1 req/5min (고정)
   - API 폴링 재시도: 지수 백오프

---

## 10. 다음 단계

1. **Evaluator 검증** (검토 대상)
   - 설계 아키텍처 타당성
   - Vercel API 사용 가능성 확인
   - 임계값 및 알림 규칙 재검토

2. **Web-Builder 개발**
   - VERCEL_MONITORING_API_GUIDE.md 참고
   - VERCEL_MONITORING_PLAN.md 로드맵 따르기

3. **배포 & 모니터링**
   - Vercel에서 실시간 추적 활성화
   - 7일간 베타 모니터링
   - 성능 이슈 피드백
