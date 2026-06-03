# DSC FMS 인프라 모니터링 및 관찰성 시스템 설계

**작성일:** 2026-05-28  
**마감일:** 2026-06-05 18:00 KST  
**대상:** 15명 분산팀 (4개 프로젝트 병렬 운영)  
**설계 범위:** Vercel + Supabase + AWS + Discord  
**목표 달성률:** SLA 99.5% (가동시간), <200ms 응답시간, 에러율 <0.1%

---

## 1. 개요 및 목표

### 1.1 모니터링 목표
- **신뢰도 보장:** 15명 팀의 4개 프로젝트(Asset Master, Backup, Travel, Discord Bot) 24/7 가용성
- **빠른 대응:** 인시던트 감지 <30초, 에스컬레이션 <5분
- **비용 효율:** 월 정산 비용 추적 및 최적화 (Vercel/Supabase/CloudWatch/Datadog)
- **팀 협업:** 실시간 대시보드로 15명 팀원 상황 공유

### 1.2 모니터링 스택
```
┌─────────────────────────────────────────────────────────┐
│ Observability Stack (DSC FMS)                           │
├─────────────────────────────────────────────────────────┤
│ [Primary] CloudWatch (AWS) ← Free tier + Included       │
│ [Metrics] Supabase Metrics + Vercel Analytics           │
│ [Logs] CloudWatch Logs (centralized)                    │
│ [Optional] Datadog (Advanced analytics + AI)            │
│ [Dashboard] Grafana / CloudWatch Dashboard              │
│ [Alerting] SNS + Telegram/Slack + Email                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 모니터링 아키텍처

### 2.1 컴포넌트별 메트릭 수집

#### 2.1.1 Vercel (Next.js 배포)
**모니터링 포인트:**
- 빌드 성공/실패율
- 배포 시간 (타겟: <5분)
- Edge 함수 지연시간
- 요청/응답 상태 코드 분포
- 콜드 스타트 시간

**수집 방법:**
```bash
# Vercel 분석 API
GET https://api.vercel.com/v6/projects/{projectId}/analytics/deployment

# 실시간 로그
Vercel → CloudWatch Logs (Custom Integration)
```

**주요 메트릭:**
```
vercel.deployment.duration       # 배포 소요시간 (초)
vercel.build.success_rate        # 빌드 성공률 (%)
vercel.functions.duration_p50    # 함수 지연시간 중앙값
vercel.functions.duration_p99    # 함수 지연시간 99분위
vercel.edge.requests_per_minute  # Edge 처리량
vercel.cold_start.count          # 일일 콜드스타트 횟수
```

#### 2.1.2 Supabase (Database + Auth)
**모니터링 포인트:**
- 데이터베이스 연결 수
- 쿼리 실행시간
- 저장소 사용량
- 인증 성공/실패율
- RLS(Row Level Security) 정책 적용 여부

**수집 방법:**
```bash
# Supabase 관리 API
GET https://api.supabase.com/projects/{projectId}/stats

# PostgreSQL pg_stat_statements
SELECT query, calls, mean_exec_time FROM pg_stat_statements
```

**주요 메트릭:**
```
supabase.db.active_connections     # 활성 DB 연결 수
supabase.db.query.duration_p50     # 쿼리 지연시간 중앙값
supabase.db.query.duration_p99     # 쿼리 지연시간 99분위
supabase.db.slow_queries           # 느린 쿼리 횟수 (>500ms)
supabase.storage.usage_gb          # 저장소 사용량
supabase.auth.signup_count         # 일일 신규 가입 수
supabase.auth.failed_logins        # 로그인 실패 횟수
supabase.rls.policies_enabled      # 활성화된 RLS 정책 수
```

#### 2.1.3 AWS (CloudWatch + 비용 추적)
**모니터링 포인트:**
- API Gateway 트래픽/에러
- Lambda 실행 시간 및 에러율
- DynamoDB (만약 사용시) 읽기/쓰기 처리량
- S3 접근 패턴 및 비용
- Cost Explorer 통합

**수집 방법:**
```bash
# AWS CloudWatch Metrics (자동)
# AWS Cost & Usage Reports (일일)
# Lambda 로그 분석
```

**주요 메트릭:**
```
aws.apigateway.latency               # API 응답시간 (ms)
aws.apigateway.4xx_errors            # 클라이언트 에러 수
aws.apigateway.5xx_errors            # 서버 에러 수
aws.lambda.duration                  # Lambda 실행시간
aws.lambda.errors                    # Lambda 에러 수
aws.lambda.throttles                 # Lambda 스로틀 횟수
aws.cost.daily_estimate              # 일일 비용 추정 ($)
aws.cost.monthly_forecast            # 월간 비용 예측 ($)
```

#### 2.1.4 애플리케이션 메트릭 (Custom)
**모니터링 포인트:**
- 사용자 행동 (활성 사용자 수, 기능별 사용률)
- 비즈니스 메트릭 (자산 등록, 여행 요청, 백업 성공)
- API 응답시간 (엔드포인트별)
- 데이터베이스 성능 (슬로우 쿼리, 잠금)

**수집 방법:**
```javascript
// Next.js 미들웨어에서 CloudWatch Logs로 전송
import { CloudWatchLogsClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

export async function recordMetric(metricName, value, unit = 'Count') {
  const client = new CloudWatchLogsClient({ region: 'ap-south-1' });
  const timestamp = Date.now();
  
  await client.send(new PutLogEventsCommand({
    logGroupName: '/dsc-fms/metrics',
    logStreamName: `${metricName}`,
    logEvents: [{
      message: JSON.stringify({ 
        metric: metricName, 
        value, 
        unit, 
        timestamp 
      }),
      timestamp
    }]
  }));
}
```

**주요 메트릭:**
```
app.users.active_count               # 현재 활성 사용자 수
app.asset.registration_count         # 일일 신규 자산 등록 수
app.backup.success_rate              # 백업 성공률 (%)
app.travel.request_count             # 일일 여행 요청 수
app.discord.message_count            # 일일 Discord 메시지 수
app.api.endpoint.latency             # 엔드포인트별 응답시간
app.api.endpoint.error_rate          # 엔드포인트별 에러율
app.database.slow_queries            # 느린 쿼리 횟수 (>1초)
```

---

## 3. 30개 이상의 Critical Alert Rules

### 3.1 웹/배포 관련 (8개)

| Alert 이름 | 조건 | 심각도 | 에스컬 대상 |
|-----------|------|--------|-----------|
| `Vercel Build Failure` | 배포 실패 | 🔴 Critical | Web-Builder #1 |
| `Vercel Deployment Timeout` | 배포 시간 > 10분 | 🟠 High | Web-Builder #1 |
| `High API Latency` | p99 응답시간 > 500ms | 🟠 High | DevOps |
| `High Error Rate` | 5분 평균 에러율 > 1% | 🟠 High | DevOps |
| `4XX Error Spike` | 클라이언트 에러 급증 (10배) | 🟡 Medium | Evaluator |
| `5XX Error Spike` | 서버 에러 급증 (5배) | 🔴 Critical | DevOps |
| `Cold Start Spike` | 일일 콜드스타트 > 100회 | 🟡 Medium | Web-Builder |
| `Edge Function Timeout` | Edge 함수 타임아웃 발생 | 🟠 High | DevOps |

### 3.2 데이터베이스 관련 (9개)

| Alert 이름 | 조건 | 심각도 | 에스컬 대상 |
|-----------|------|--------|-----------|
| `High DB Connection Count` | 활성 연결 > 80 | 🟠 High | DevOps |
| `Slow Query Detected` | 단일 쿼리 > 5초 | 🟠 High | Web-Builder |
| `High Query Latency` | p95 쿼리 시간 > 2초 | 🟡 Medium | DevOps |
| `DB Connection Pool Exhausted` | 사용 가능 연결 < 5 | 🔴 Critical | DevOps |
| `Storage Usage Critical` | 저장소 > 80% 용량 | 🟡 Medium | DevOps |
| `Auth Service Degraded` | 로그인 실패율 > 5% | 🟠 High | Evaluator |
| `RLS Policy Violation` | RLS 정책 적용 실패 | 🔴 Critical | DevOps |
| `Unusual Access Pattern` | 비정상 쿼리 패턴 감지 | 🟡 Medium | DevOps |
| `Replication Lag` | 복제 지연 > 10초 | 🟠 High | DevOps |

### 3.3 비즈니스 로직 관련 (8개)

| Alert 이름 | 조건 | 심각도 | 에스컬 대상 |
|-----------|------|--------|-----------|
| `Asset Registration Failed` | 자산 등록 에러 > 10% | 🟡 Medium | Evaluator |
| `Backup Success Rate Low` | 백업 성공률 < 95% | 🟠 High | Automation |
| `Travel Request Processing Slow` | 처리 시간 > 1분 | 🟡 Medium | DevOps |
| `Discord Bot Offline` | 봇 응답 없음 >5분 | 🟠 High | Automation |
| `Zero Active Users` | 활성 사용자 0명 | 🟠 High | Evaluator |
| `Unexpected Data Deletion` | 대량 삭제 감지 (>100건) | 🔴 Critical | DevOps |
| `API Integration Failure` | 외부 API 호출 실패율 > 10% | 🟡 Medium | Web-Builder |
| `Webhook Delivery Failed` | 웹훅 전달 실패 횟수 > 5 | 🟡 Medium | Automation |

### 3.4 인프라 관련 (6개)

| Alert 이름 | 조건 | 심각도 | 에스컬 대상 |
|-----------|------|--------|-----------|
| `Disk Space Critical` | 디스크 사용률 > 90% | 🔴 Critical | DevOps |
| `CPU Utilization High` | CPU > 80% 지속시간 > 5분 | 🟠 High | DevOps |
| `Memory Utilization High` | 메모리 > 85% | 🟠 High | DevOps |
| `Network Bandwidth Saturation` | 대역폭 > 85% | 🟡 Medium | DevOps |
| `Service Health Check Failed` | 헬스 체크 실패 > 2회 | 🟠 High | DevOps |
| `Cost Anomaly Detected` | 일일 비용 > 월평균 150% | 🟡 Medium | CEO |

### 3.5 보안 관련 (3개)

| Alert 이름 | 조건 | 심각도 | 에스컬 대상 |
|-----------|------|--------|-----------|
| `Unauthorized Access Attempt` | 권한 없음 접근 > 10회 | 🟠 High | DevOps |
| `Suspicious IP Activity` | 비정상 IP에서 대량 접근 | 🔴 Critical | DevOps |
| `Certificate Expiry Warning` | SSL 인증서 만료 < 30일 | 🟡 Medium | DevOps |

---

## 4. SLA 추적 및 임계값 설정

### 4.1 SLA 정의

| 지표 | 목표 | 경고 임계값 | 심각도 |
|------|------|-----------|--------|
| 시스템 가용성 | 99.5% | < 99.0% | Critical |
| 평균 응답시간 (API) | 200ms | > 500ms | High |
| 99분위 응답시간 | 500ms | > 1000ms | High |
| 에러율 | < 0.1% | > 0.5% | High |
| 로그인 성공률 | 99.9% | < 99.0% | Medium |
| 배포 성공률 | 95% | < 90% | Medium |
| MTTR (평균 복구시간) | <5분 | >10분 | Medium |
| MTTD (평균 감지시간) | <30초 | >60초 | Medium |

### 4.2 월간 SLA 계산 공식

```
가용성(%) = (정상작동시간 / 전체시간) × 100

예: 30일 × 24시간 = 43,200분
    장애시간 = 30분 (두 건의 15분 장애)
    가용성 = (43,200 - 30) / 43,200 × 100 = 99.93%
```

### 4.3 SLA 이행 통보
- 주간 리포트: 매주 월요일 09:00 KST
- 월간 리포트: 매달 1일 09:00 KST
- 임계값 위반 시: 즉시 알람 (5분 이내)

---

## 5. 메트릭 수집 전략

### 5.1 수집 빈도

| 메트릭 그룹 | 수집 간격 | 보관 기간 | 목적 |
|-----------|---------|---------|------|
| Real-time 메트릭 | 10초 | 7일 | 인시던트 대응 |
| High-level 메트릭 | 1분 | 30일 | 일일 모니터링 |
| 집계 메트릭 | 1시간 | 1년 | 장기 트렌드 분석 |
| 비용 메트릭 | 1일 | 무제한 | 재무 추적 |

### 5.2 수집 아키텍처

```
┌─────────────────────────────────────────────┐
│ 메트릭 수집 파이프라인                       │
├─────────────────────────────────────────────┤
│ Source (Vercel/Supabase/AWS)                │
│        ↓                                    │
│ Collector (CloudWatch Agent / Custom SDK)   │
│        ↓                                    │
│ Aggregator (CloudWatch Metrics)             │
│        ↓                                    │
│ Storage (CloudWatch / S3 / Datadog)         │
│        ↓                                    │
│ Visualization (Dashboard / Grafana)         │
└─────────────────────────────────────────────┘
```

### 5.3 커스텀 메트릭 푸시 (Next.js API)

```typescript
// pages/api/metrics/push.ts
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const client = new CloudWatchClient({ region: 'ap-south-1' });

export async function pushMetric(
  namespace: string,
  metricName: string,
  value: number,
  unit: string = 'Count',
  dimensions?: Record<string, string>
) {
  const command = new PutMetricDataCommand({
    Namespace: namespace,
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: Object.entries(dimensions || {}).map(([name, value]) => ({
        Name: name,
        Value: value
      }))
    }]
  });
  
  try {
    await client.send(command);
  } catch (error) {
    console.error(`Failed to push metric ${metricName}:`, error);
  }
}

// 사용 예시:
await pushMetric('DSC-FMS', 'UserRegistration', 5, 'Count', {
  'Department': 'Production',
  'Location': 'Chennai'
});
```

---

## 6. 로깅 통합 설계

### 6.1 로그 레벨 정의

| 레벨 | 내용 | 보관 | 용도 |
|------|------|------|------|
| ERROR | 응용 프로그램 오류 | 30일 | 버그 추적 |
| WARN | 경고 사항 | 14일 | 추세 분석 |
| INFO | 일반 정보 | 7일 | 작동 확인 |
| DEBUG | 상세 디버그 정보 | 3일 | 개발 추적 |

### 6.2 중앙화된 로깅 설정

```bash
# CloudWatch Logs 그룹
/dsc-fms/application
  ├─ /production
  │   ├─ api-gateway
  │   ├─ lambda
  │   └─ database
  ├─ /staging
  │   ├─ api-gateway
  │   └─ lambda
  └─ /development

# 로그 필터링 쿼리
fields @timestamp, @message, @duration
| filter @message like /ERROR/
| stats count() as ErrorCount by @duration
| sort ErrorCount desc
```

### 6.3 구조화된 로깅 형식

```json
{
  "@timestamp": "2026-05-28T08:30:45Z",
  "log_level": "ERROR",
  "service": "asset-api",
  "request_id": "req-12345",
  "user_id": "user-67890",
  "endpoint": "POST /api/assets",
  "status_code": 500,
  "duration_ms": 2450,
  "error_message": "Database connection timeout",
  "error_stack": "...",
  "environment": "production"
}
```

---

## 7. 비용 추적 및 최적화

### 7.1 월간 비용 추정 (15인 팀 기준)

| 서비스 | 예상 비용 | 설명 |
|--------|---------|------|
| Vercel | $100-200 | 프로 플랜 + 추가 대역폭 |
| Supabase | $150-250 | 데이터베이스 + 스토리지 + 인증 |
| CloudWatch | $20-50 | 로그 + 메트릭 저장료 |
| Datadog (optional) | $200-500 | 고급 분석 + APM |
| **월계** | **$470-1000** | 상황에 따라 변동 |

### 7.2 비용 최적화 방안

1. **로그 보관 기간 단축** (30→7일)
   - 월 절감액: ~$15-20
   - 신뢰도 영향: 낮음 (최근 데이터 중요)

2. **CloudWatch Insights 쿼리 최적화**
   - 불필요한 필드 제외
   - 파티션 쿼리 활용
   - 월 절감액: ~$10-20

3. **메트릭 샘플링** (1분 → 5분)
   - 트렌드 분석에는 영향 없음
   - 월 절감액: ~$5-10
   - 실시간 알림은 별도 채널 유지

4. **Datadog 대신 CloudWatch + Grafana**
   - 오픈소스 Grafana 자체 호스팅
   - 월 절감액: $200-500
   - 단점: AI 분석 기능 미제공

### 7.3 월별 비용 리포트

```yaml
월별 비용 추적:
  2026-05:
    vercel: $150
    supabase: $200
    cloudwatch: $30
    total: $380
    
  2026-06:
    vercel: $180
    supabase: $220
    cloudwatch: $40
    total: $440
    
  예산: $500/월 (여유 10%)
```

---

## 8. Datadog 선택적 통합

### 8.1 Datadog 연동 시 추가 메트릭

```
- APM (Application Performance Monitoring)
  └─ 분산 트레이싱: 서비스 간 호출 경로 추적
  
- Real User Monitoring (RUM)
  └─ 사용자 행동 분석: 클릭, 페이지 로드 시간
  
- Database Monitoring
  └─ 쿼리 실행 계획 분석
  
- AI Anomaly Detection
  └─ 이상치 자동 감지: 패턴 학습 기반
```

### 8.2 Datadog 적용 시점
- **Phase 1 (5-6월):** CloudWatch만 사용 (비용 절감)
- **Phase 2 (7-8월):** 트레이싱 이슈 발생 시 Datadog 추가 검토
- **Phase 3 (9월+):** 팀 규모 25명 이상으로 확대 시 Datadog 도입 권고

---

## 9. 대시보드 설계

### 9.1 기본 대시보드 (CEO 용)

```
┌─────────────────────────────────────────────────────┐
│ DSC FMS 실시간 대시보드 (CEO View)                  │
├─────────────────────────────────────────────────────┤
│ 🟢 시스템 상태 | ⚠️ 주의항목 2개 | 🔴 인시던트 0개  │
├─────────────────────────────────────────────────────┤
│ 가용성 99.87% ↑  │  API 응답 185ms ↓  │ 에러율 0.02% ↓ │
├─────────────────────────────────────────────────────┤
│ 활성 사용자: 47명 │ 일일 수익: ₹85,000 │ 배포: 12회   │
├─────────────────────────────────────────────────────┤
│ 월 비용: $420 (예산 $500) │ 비용 효율: 84%          │
└─────────────────────────────────────────────────────┘
```

### 9.2 DevOps 대시보드

```
┌─────────────────────────────────────────────────────┐
│ DevOps 모니터링 대시보드                             │
├─────────────────────────────────────────────────────┤
│ [Deployment Status]                                 │
│  ├─ 성공: 12회 (92%)                                │
│  ├─ 실패: 1회 (8%) ⚠️                               │
│  └─ 평균 시간: 3.5분                                │
│                                                      │
│ [Database Performance]                              │
│  ├─ 활성 연결: 12/100                               │
│  ├─ 쿼리 지연: p95=245ms, p99=520ms                 │
│  └─ 느린 쿼리: 3개 (>5초)                           │
│                                                      │
│ [Alert Status]                                      │
│  ├─ 🟢 정상: 28개                                   │
│  ├─ 🟡 경고: 2개 (CPU 75%, Storage 72%)             │
│  └─ 🔴 심각: 0개                                    │
└─────────────────────────────────────────────────────┘
```

### 9.3 팀 협업 대시보드

```
┌──────────────────────────────────────────────────┐
│ 15인 팀 협업 대시보드                             │
├──────────────────────────────────────────────────┤
│ [프로젝트 진행률]                                 │
│  ├─ Asset Master: 85% ▄▄▄▄▄░░░ (완료 예정 5/31)  │
│  ├─ Backup: 70% ▄▄▄▄░░░░░░ (완료 예정 6/05)     │
│  ├─ Travel: 90% ▄▄▄▄▄▄░░░░ (완료 예정 5/30)     │
│  └─ Discord: 100% ▄▄▄▄▄▄▄▄▄▄ (배포 완료)         │
│                                                   │
│ [팀 활용도]                                       │
│  ├─ 활성 팀원: 13/15 (86%)                        │
│  └─ 평균 작업 시간: 6.2시간/일                    │
│                                                   │
│ [차주 마감]                                       │
│  ├─ 2026-05-30: Travel UI 완료 (평가자 검증)      │
│  ├─ 2026-05-31: Asset Phase 2 완료 (배포)         │
│  └─ 2026-06-02: Backup QA 완료                    │
└──────────────────────────────────────────────────┘
```

---

## 10. Google SRE Best Practices 적용

### 10.1 핵심 SRE 원칙

1. **Monitoring Hierarchy (계층화된 모니터링)**
   ```
   RED Metrics:        Rate (요청률) / Errors (에러) / Duration (지연)
   USE Metrics:        Utilization / Saturation / Errors
   TSDBs:              Time Series Data Base (Prometheus / CloudWatch)
   ```

2. **Alert Policy**
   ```
   - 알림은 실행 가능해야 함 (actionable)
   - 거짓 양성 최소화 (False positives < 5%)
   - 기계적 대응 자동화 (자가 치유)
   ```

3. **On-Call Discipline**
   ```
   - 팀 로테이션: 1주 1명
   - 알림 피로도 관리: 주 3회 이상 알림 금지
   - MTTD < 30초, MTTR < 5분
   ```

### 10.2 Golden Signals (황금 신호)

```
┌──────────────────────────────────┐
│ Google SRE "Golden Signals"      │
├──────────────────────────────────┤
│ 1. Latency (지연시간)             │
│    └─ API p95: 200ms             │
│    └─ p99: 500ms                 │
│                                  │
│ 2. Traffic (트래픽)              │
│    └─ RPS: 1000 req/sec          │
│    └─ Growth: +5%/month          │
│                                  │
│ 3. Errors (에러율)                │
│    └─ 5xx: <0.1%                 │
│    └─ 4xx: <1%                   │
│                                  │
│ 4. Saturation (포화도)           │
│    └─ CPU: <80%                  │
│    └─ Memory: <85%               │
│    └─ Disk: <90%                 │
└──────────────────────────────────┘
```

### 10.3 Error Budget (에러 예산)

```
SLA 목표: 99.5%
월간 총 시간: 43,200분 (30일 × 24시간)
허용 가능 다운타임: 216분 (0.5%)

현재 사용: 45분 (5개 인시던트)
남은 예산: 171분 (79.2%)

해석: 안전한 배포 여유 충분
→ 주 2회 배포 가능
→ 실험적 기능 롤아웃 가능
```

---

## 11. 실시간 모니터링 대시보드 (7일/30일 뷰)

### 11.1 실시간 탭 (현재 상태)

```json
{
  "refresh_interval": "10s",
  "metrics": {
    "system_health": {
      "status": "healthy",
      "uptime_days": 45,
      "last_incident": "2026-05-22 14:30 (6일 전)"
    },
    "api_metrics": {
      "current_rps": 287,
      "p50_latency_ms": 145,
      "p95_latency_ms": 280,
      "p99_latency_ms": 520,
      "error_rate_percent": 0.03
    },
    "database": {
      "active_connections": 8,
      "connection_pool_usage": "8%",
      "slow_queries_1h": 0,
      "largest_table_rows": 42850
    },
    "deployment": {
      "last_deployment": "2026-05-28 03:15",
      "deployment_status": "successful",
      "build_time_seconds": 245
    }
  }
}
```

### 11.2 7일 뷰 (주간 트렌드)

```
┌─ API Response Time (p95) ────────────────┐
│ 500ms ─┐                                  │
│        │   ╱╲                             │
│ 400ms ─┤  ╱  ╲   ╱                       │
│        │ ╱    ╲ ╱                        │
│ 300ms ─├────────╱────────                │
│        │                  ╱╲             │
│ 200ms ─┤                 ╱  ╲           │
│        │                ╱    ╲──        │
│ 100ms ─┤──────────────╱          ──────│
│  월  화  수  목  금  토  일              │
└────────────────────────────────────────┘

7일 평균: 250ms (목표 200ms 대비 125%)
추세: 안정적 ✓
```

### 11.3 30일 뷰 (월간 추세)

```
┌─ Error Rate (%) ────────────────────────┐
│ 1.0% ─┐                                  │
│       │ ╭╮        ╭╮      ╭╮            │
│ 0.5% ─┤─╯ ╰──────╯ ╰────╭╯ ╰──        │
│       │              ╱                  │
│ 0.2% ─├────────────────────            │
│       │                                  │
│ 0.0% ─┴────────────────────────────────│
│  1    5   10   15   20   25   30        │
└────────────────────────────────────────┘

30일 평균: 0.08% (목표 0.1% 달성) ✓
추세: 개선 중 ↓
```

---

## 12. 알림 채널 설정

### 12.1 긴급도별 알림 경로

```
심각도        채널            응답시간    담당자
──────────────────────────────────────────────
🔴 Critical   SMS + Telegram   <2분     On-Call
🟠 High       Telegram + Email <5분     팀리드
🟡 Medium     Email           <15분    팀원
🟢 Low        Slack           <1시간   보관
```

### 12.2 알림 메시지 템플릿

```
🔴 CRITICAL: API Server Downtime

타이틀: High Error Rate Detected
심각도: Critical
감지 시간: 2026-05-28 14:32:15 KST
지속 시간: 5분 2초

메트릭:
  • 에러율: 8.5% (임계값 0.5%)
  • 영향 사용자: ~150명
  • 영향 API: /api/assets/*

권장 조치:
  1. 최근 배포 확인
  2. 데이터베이스 연결 상태 확인
  3. CloudWatch 로그 분석
  
대시보드: https://cloudwatch.aws.amazon.com/...
팀 채널: #incident-response
```

---

## 13. 모니터링 로드맵

### 13.1 Phase 1 (5월 말): 기초 설정
- ✅ CloudWatch 메트릭 기본 설정
- ✅ 30개 Alert Rules 정의
- ✅ 기본 대시보드 구성 (CEO/DevOps)
- 예상 시간: 3일

### 13.2 Phase 2 (6월 초): 고급 기능
- Datadog 평가 (비용 vs 이득)
- 커스텀 메트릭 수집 확대
- 머신러닝 기반 이상 탐지
- 예상 시간: 5일

### 13.3 Phase 3 (6월 중순): 자동화
- 자가 치유 알고리즘 (자동 재시작)
- 용량 예측 (회귀 분석)
- 비용 최적화 자동화
- 예상 시간: 7일

### 13.4 Phase 4 (6월 말): 팀 역량 강화
- DevOps 팀 교육 (온-콜 프로세스)
- 사건 대응 드릴 (월 1회)
- Postmortem 문화 정착
- 예상 시간: 5일

---

## 14. 성공 기준 및 검증

### 14.1 설계 완료 체크리스트
- ✅ 30개 이상 Alert Rules 정의
- ✅ 7일/30일 뷰 포함 대시보드 설계
- ✅ SLA 정의 및 계산 공식
- ✅ 메트릭 수집 전략 및 아키텍처
- ✅ 로깅 통합 설계
- ✅ 비용 추적 및 최적화 방안
- ✅ Google SRE Best Practices 적용
- ✅ 인시던트 대응 플레이북 (별도 문서)

### 14.2 구현 검증 항목
1. CloudWatch 메트릭 수집 확인 (1시간 테스트)
2. 모든 Alert Rules 트리거 테스트
3. 대시보드 데이터 정확성 검증
4. 알림 채널 전송 확인
5. 비용 추적 정확도 검증 (월간 비교)

---

## 15. 참고 문서 및 리소스

### 15.1 AWS 공식 문서
- CloudWatch 메트릭: https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/
- CloudWatch Logs Insights: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/
- Cost Anomaly Detection: https://docs.aws.amazon.com/cost-management/

### 15.2 SRE 참고서
- Google SRE Book: https://sre.google/books/
- Golden Signals Framework: https://sre.google/sre-book/monitoring-distributed-systems/

### 15.3 도구 문서
- Vercel Analytics: https://vercel.com/docs/analytics
- Supabase Metrics: https://supabase.com/docs/reference/api
- Datadog (선택사항): https://docs.datadoghq.com/

---

**설계 완료:** 2026-05-28  
**라인 수:** 620줄  
**다음 단계:** Evaluator AI 검증 (2026-06-05 18:00 마감)
