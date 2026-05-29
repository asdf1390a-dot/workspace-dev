---
name: DevOps 인프라 모니터링 & 옵저버빌리티 종합 설계
description: DSC Mannur FMS 생태계 + 8프로젝트 AI팀(15명) 실시간 통합 모니터링 + 자동화 알림 시스템 완전 설계
type: design
date: 2026-05-29
owner: DevOps Engineer AI (Phase C #12, 나경태 팀 인프라 담당)
mentor: Automation-Specialist AI Agent
timeline: 2026-05-29 ~ 2026-06-05 18:00 KST
eta_phase1_design: 2026-05-31 18:00 KST
eta_phase2_implementation: 2026-06-02 18:00 KST
---

# DevOps 인프라 모니터링 & 옵저버빌리티 종합 설계 (2026-05-29)

## 📋 Executive Summary (경영 요약)

**목표:** DSC Mannur 자동부품 제조 공장의 FMS 포털 + 8개 동시 프로젝트(15명 AI팀) 전체 인프라에 대한 실시간 통합 모니터링, 자동 알림, 성능 대시보드 구축

**범위:**
- 8개 프로젝트 API 응답시간 + 에러율 (모든 배포 인스턴스)
- Supabase PostgreSQL 데이터베이스 성능 (쿼리 지연, 연결 풀, 복제, RLS 오버헤드)
- Vercel 배포 자동화 (빌드 상태, 배포 시간, 성능 점수)
- GitHub Actions CI/CD 파이프라인 (테스트 성공률, 빌드 시간)
- OpenClaw Cron 작업 헬스 (자동화 스크립트 성공/실패)
- 팀 용량 활용도 (실시간, Phase A/B/C 동시 실행 상태)
- 메모리 자동화 시스템 헬스 (Phase 2A/B/C 진행률)
- SLA 위반 추적 + 자동 에스컬레이션

**핵심 도구:**
- **APM/메트릭:** Datadog (또는 CloudWatch 대안)
- **로그 수집:** Datadog Logs (또는 CloudWatch Logs)
- **대시보드:** Grafana + Datadog Custom Dashboards
- **알림:** Slack + Telegram (CEO 나경태 직접)
- **인프라:** Vercel (Next.js), Supabase (PostgreSQL), GitHub, OpenClaw

**성공 기준:**
- ✅ 모든 8개 프로젝트 API 응답시간 < 500ms (p99)
- ✅ 에러율 < 1% (일일 평균)
- ✅ 데이터베이스 쿼리 지연 < 200ms (p95)
- ✅ 배포 자동화 성공률 ≥ 98%
- ✅ 알림 지연시간 < 5분 (Critical)
- ✅ 팀 용량 실시간 추적 (모든 15명 상태 가시화)
- ✅ Cron 작업 성공률 ≥ 95%

---

## 🏗️ 1단계: 아키텍처 설계

### 1.1 전체 시스템 구조

```
┌────────────────────────────────────────────────────────────────────┐
│              DEVOPS 통합 모니터링 & 옵저버빌리티 시스템                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 1️⃣  데이터 수집 계층 (Data Collection Layer)              │    │
│  │  ├─ Datadog APM Agent (API, function, database tracing)  │    │
│  │  ├─ Vercel API 폴링 (배포, 빌드, 성능 메트릭)              │    │
│  │  ├─ Supabase 메트릭 내보내기 (db_query_time, connections) │    │
│  │  ├─ GitHub API (CI/CD 상태, 테스트 결과)                 │    │
│  │  ├─ OpenClaw Cron API (작업 상태, 완료율)                │    │
│  │  └─ 커스텀 지표 내보내기 (팀 용량, 메모리 헬스)             │    │
│  └──────────────┬───────────────────────────────────────────┘    │
│                 │                                                 │
│  ┌──────────────▼───────────────────────────────────────────┐    │
│  │ 2️⃣  처리 & 집계 계층 (Processing & Aggregation)         │    │
│  │  ├─ 실시간 메트릭 정규화 (standardization)                │    │
│  │  ├─ 이상치 탐지 (anomaly detection)                      │    │
│  │  ├─ SLA 임계값 계산 (threshold-based alerts)             │    │
│  │  ├─ 팀 신뢰도 점수 계산                                   │    │
│  │  └─ 프로젝트별 완료율 추적                                │    │
│  └──────────────┬───────────────────────────────────────────┘    │
│                 │                                                 │
│  ┌──────────────▼───────────────────────────────────────────┐    │
│  │ 3️⃣  알림 생성 & 라우팅 (Alert Generation)                │    │
│  │  ├─ Critical (API 503, DB 장애) → Telegram 즉시          │    │
│  │  ├─ High (P99 > 1초, 에러율 > 5%) → Slack #일반         │    │
│  │  ├─ Medium (배포 실패, 테스트 실패) → Discord #기술    │    │
│  │  ├─ Low (디스크 부족, 인증서 만료) → 주간 리포트          │    │
│  │  └─ 에스컬레이션 (10분 미응답) → 다중 채널 증폭            │    │
│  └──────────────┬───────────────────────────────────────────┘    │
│                 │                                                 │
│  ┌──────────────▼───────────────────────────────────────────┐    │
│  │ 4️⃣  대시보드 & 시각화 (Dashboards & Visualization)      │    │
│  │  ├─ Grafana: 아키텍처 + 성능 (공개용)                    │    │
│  │  ├─ Datadog: APM + 실시간 메트릭 (개발팀용)              │    │
│  │  ├─ 커스텀 웹 대시보드: 팀 용량 + 프로젝트 진행률          │    │
│  │  ├─ 커스텀 SLA 대시보드: 위반 추적 + 히스토리            │    │
│  │  └─ 서비스 헬스 매트릭스 (8개 프로젝트 한눈에)           │    │
│  └──────────────┬───────────────────────────────────────────┘    │
│                 │                                                 │
│  ┌──────────────▼───────────────────────────────────────────┐    │
│  │ 5️⃣  온콜 대응 & 자동화 (On-Call Response)               │    │
│  │  ├─ Runbook (팀별 Troubleshooting 절차)                  │    │
│  │  ├─ 자동 복구 스크립트 (자동 스케일링, 재시작)             │    │
│  │  ├─ 에스컬레이션 프로세스 (1단계 → 2단계 → CEO)           │    │
│  │  └─ 사후 분석 템플릿 (Post-Mortem)                      │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 데이터 흐름 (Data Flow)

```
[8개 프로젝트 서비스]
  ├─ Discord Bot P1 (Vercel)
  ├─ Team Dashboard P1/P2B (Vercel)
  ├─ Asset Master P2 (Vercel + Supabase)
  ├─ Backup P2 (Vercel + Supabase)
  ├─ Travel P2 (Vercel + Supabase)
  ├─ Harness-ENG P2 (Vercel + Supabase)
  ├─ BM-P1 (Vercel + Supabase)
  └─ Memory Auto P2 (Node.js + Supabase)
       │
       ├─ Datadog APM Tracer (자동 계측)
       │  └─ HTTP/gRPC request, database query, function call tracing
       │
       ├─ 커스텀 메트릭 내보내기
       │  └─ Team capacity (15/15 팀원 상태), Cron success, Project progress
       │
       └─ Structured Logs (JSON)
          └─ API 요청, DB 쿼리, 에러, Cron 실행
            │
            ▼
      [Datadog / CloudWatch] — 수집 & 집계
            │
      ┌─────┴─────┬──────────┬──────────┐
      ▼           ▼          ▼          ▼
   Metrics    Logs       Traces     Events
      │           │          │          │
      ├─ P99 latency    │ Error rate    │ Request flow
      ├─ Error count    │ Exception     │ Dependency map
      └─ Success rate   └─ Warnings     └─ Bottlenecks
            │
            ▼
      [Alert Rules Engine] — SLA 임계값 비교
            │
      ┌─────┼─────┬──────────┐
      ▼     ▼     ▼          ▼
   Critical High Medium    Low
      │     │     │          │
      ▼     ▼     ▼          ▼
   Telegram Slack Discord Monthly
   (즉시) (5분) (1시간) Report
```

### 1.3 배포 인프라 맵

```
┌────────────────────────────────────────────────────────────────┐
│                    인프라 컴포넌트 맵                              │
├────────────────────────────────────────────────────────────────┤
│                                                               │
│  [엣지/CDN 계층]                                               │
│    ├─ Vercel Edge Network (8개 프로젝트 배포)                  │
│    └─ Vercel Analytics (성능 메트릭 수집)                      │
│                 │                                              │
│  [API/애플리케이션 계층]                                        │
│    ├─ Vercel Serverless Functions (Node.js/Next.js)          │
│    │  ├─ 8개 프로젝트 API 엔드포인트                           │
│    │  ├─ 평균 응답시간: 200-500ms (목표)                     │
│    │  └─ Cold start 오버헤드: ~1초                            │
│    └─ OpenClaw Cron (자동화 스크립트)                          │
│       ├─ 5분 주기 메모리 수집                                  │
│       ├─ 30분 주기 규칙 감시                                   │
│       └─ 60분 주기 신뢰도 리포트                               │
│                 │                                              │
│  [데이터베이스 계층]                                            │
│    └─ Supabase PostgreSQL (ap-hyderabad-1)                    │
│       ├─ 4개 프로젝트 공유 DB 인스턴스                        │
│       ├─ Row-Level Security (RLS) 활성화                      │
│       ├─ 연결 풀: 20 active, 40 max                          │
│       ├─ 복제 지연 모니터링 (target: < 100ms)                │
│       └─ 저장소: ~50GB (테이블 + 인덱스)                      │
│                 │                                              │
│  [저장소/캐시 계층]                                            │
│    ├─ GitHub (소스 코드 + CI/CD)                             │
│    │  ├─ 자동 테스트 (Jest, Playwright)                      │
│    │  └─ Actions 빌드 시간 추적 (< 5분 목표)                 │
│    └─ Vercel KV (Redis) — 선택사항                            │
│       └─ 캐시 hit rate 추적                                    │
│                 │                                              │
│  [모니터링/옵저버빌리티 계층]                                    │
│    ├─ Datadog APM (또는 CloudWatch)                          │
│    ├─ Datadog Logs Aggregation                               │
│    ├─ Grafana Dashboards                                     │
│    ├─ Slack/Telegram Webhooks                                │
│    └─ 커스텀 메트릭 엔드포인트                                 │
│                                                               │
└────────────────────────────────────────────────────────────────┘
```

---

## 2단계: Datadog 통합 설계

### 2.1 Datadog 설정 (APM, Metrics, Logs)

#### 2.1.1 APM Instrumentation (자동 계측)

**목표:** 모든 API 요청, 데이터베이스 쿼리, 외부 API 호출을 자동 추적

**구현 방법:**

1️⃣ **Vercel Serverless Functions 계측**

```javascript
// next.js/api 핸들러에 Datadog 추적 자동 적용
// dd-trace-js 라이브러리 사용

// package.json
{
  "dependencies": {
    "dd-trace": "^4.0.0"
  }
}

// 모든 Next.js API 라우트 최상단
import tracer from 'dd-trace';

// 초기화 (pages/_document.js 또는 pages/api/_middleware.js)
tracer.init({
  logInjection: true,
  service: 'dsc-fms-portal',  // 서비스 이름
  version: '1.0.0',
  environment: 'production'
});

// 자동 추적 대상:
// - HTTP requests (모든 엔드포인트)
// - SQL queries (Supabase)
// - HTTP client calls (외부 API)
// - Function execution time
```

2️⃣ **Supabase PostgreSQL 쿼리 추적**

```javascript
// Datadog는 자동으로 postgres 라이브러리를 훅
// Supabase는 postgresql 클라이언트를 사용하므로 자동 계측됨

// 추적되는 메트릭:
// - Query execution time (ms)
// - Number of rows returned
// - Connection pool usage
// - Connection latency
// - Error traces (deadlock, timeout 등)
```

3️⃣ **커스텀 메트릭 추가**

```javascript
// 팀 용량, 프로젝트 진행률 등 비즈니스 메트릭 전송

import tracer from 'dd-trace';

// 팀 용량 메트릭
tracer.gauge('team.capacity.utilization', 14, {
  tags: ['team:dsc-mannur', 'phase:C']
});

// 프로젝트별 진행률
tracer.gauge('project.asset-master.progress', 85, {
  tags: ['project:asset-master', 'phase:P2']
});

// 메모리 자동화 헬스
tracer.gauge('automation.memory.phase2.success-rate', 95, {
  tags: ['phase:2B', 'component:duplicate-detection']
});
```

#### 2.1.2 로그 수집 & 구조화

**Datadog Logs 구성:**

```javascript
// 모든 로그를 JSON 형식으로 구조화
// Datadog는 자동으로 JSON 파싱하여 필드 추출

// 예: API 요청 로그
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  service: 'dsc-fms-portal',
  environment: 'production',
  request_id: 'req-12345',
  method: 'GET',
  path: '/api/assets',
  status: 200,
  response_time_ms: 145,
  user_id: 'user-001',
  tags: {
    component: 'asset-api',
    project: 'asset-master',
    region: 'ap-hyderabad-1'
  }
}));

// Datadog가 자동으로 인덱싱하는 필드:
// - timestamp, level, service, environment
// - request_id, status, response_time_ms
// - user_id, error_message, stack_trace
```

**로그 수집 규칙:**

| 로그 타입 | 샘플율 | 보관 기간 | 태그 |
|---------|-------|---------|------|
| INFO | 100% (모든 요청) | 7일 | service, environment |
| WARN | 100% | 30일 | alert_type, severity |
| ERROR | 100% | 90일 | error_code, stack_trace |
| DEBUG | 10% (샘플링) | 1일 | component, request_id |
| TRACE | 1% (샘플링) | 6시간 | internal_only |

#### 2.1.3 Datadog 대시보드 (4개 사전 구성)

**대시보드 1: 서비스 헬스 개요 (Operations Team)**

```
┌─────────────────────────────────────────────────────┐
│ DSC FMS 서비스 헬스 대시보드                          │
├─────────────────────────────────────────────────────┤
│ • 8개 프로젝트 가용성 (%) — 실시간 게이지             │
│ • API 응답시간 분포 (p50/p95/p99) — 시계열           │
│ • 에러율 트렌드 (시간별) — 선 그래프                  │
│ • 데이터베이스 연결 수 — 게이지                       │
│ • Vercel 배포 상태 — 상태 표시기                     │
│ • Cron 작업 성공률 — 진행 바                         │
│ • 마지막 알림 목록 (6시간) — 테이블                  │
│ • SLA 위반 카운트 (월) — 메트릭                      │
└─────────────────────────────────────────────────────┘
```

**대시보드 2: API 성능 분석 (개발팀)**

```
┌─────────────────────────────────────────────────────┐
│ API 성능 & 에러 분석                                 │
├─────────────────────────────────────────────────────┤
│ • 엔드포인트별 응답시간 비교 (프로젝트별 색 구분)      │
│ • 느린 쿼리 Top 10 (SQL 텍스트 + 실행시간)           │
│ • 에러율 Top 5 (에러 코드별)                         │
│ • 외부 API 호출 지연 (타사 API 응답시간)             │
│ • Cold Start 오버헤드 (함수별)                      │
│ • 의존성 맵 (서비스 간 호출 흐름)                     │
│ • 요청 분포 (지역, 클라이언트 타입)                  │
└─────────────────────────────────────────────────────┘
```

**대시보드 3: 데이터베이스 성능 (DBA/DevOps)**

```
┌─────────────────────────────────────────────────────┐
│ Supabase PostgreSQL 성능 모니터링                     │
├─────────────────────────────────────────────────────┤
│ • 쿼리 실행시간 분포 (p50/p95/p99)                   │
│ • 활성 연결 수 vs 최대값 (20/40)                    │
│ • 테이블별 행 수 & 크기 추이                         │
│ • 인덱스 사용률 (unused index 감지)                 │
│ • 캐시 hit rate (pg_stat_statements)               │
│ • 복제 지연 시간 (밀리초)                            │
│ • 잠금 대기 (Lock conflicts)                       │
│ • 저장소 용량 (추세)                                │
└─────────────────────────────────────────────────────┘
```

**대시보드 4: 팀 용량 & 프로젝트 진행 (CEO & PM)**

```
┌─────────────────────────────────────────────────────┐
│ 팀 용량 & 프로젝트 현황                               │
├─────────────────────────────────────────────────────┤
│ • 팀원별 활동 상태 (15/15, Phase A/B/C 분류)         │
│ • 8개 프로젝트 진행률 (%)                            │
│ • 각 프로젝트별 완료 예정일 (ETA)                    │
│ • Cron 작업 실행 이력 (성공/실패)                    │
│ • 메모리 자동화 Phase 진행도                          │
│ • 신뢰도 점수 (일일 추이)                            │
│ • 규칙 위반 카운트 (누적)                            │
│ • 팀 생산성 메트릭 (API/일, 테스트/일)              │
└─────────────────────────────────────────────────────┘
```

---

## 3단계: CloudWatch 설정 (AWS Lambda/DynamoDB 모니터링)

### 3.1 AWS 리소스 모니터링

**현재 사용 중인 AWS 서비스:**

| 서비스 | 사용 목적 | 모니터링 지표 |
|-------|---------|----------|
| Lambda | OpenClaw Cron 함수 | 실행시간, 에러, 메모리 사용 |
| DynamoDB | 선택적 캐시/세션 | 읽기/쓰기 용량, 지연 |
| CloudWatch Logs | Lambda 로그 | 에러율, 실행 횟수 |
| SQS | 선택적 메시지 큐 | 메시지 수, 지연 시간 |
| SNS | 알림 배포 | 게시/구독 메트릭 |

### 3.2 CloudWatch Log Groups 구성

```bash
# 각 서비스별 Log Group 생성
/aws/lambda/memory-automation-cron          # 메모리 수집 Cron
/aws/lambda/dsc-fms-portal-api              # FMS 포털 API
/aws/lambda/asset-master-processor          # Asset Master 백그라운드
/aws/lambda/backup-verification             # Backup 검증
/aws/lambda/github-actions-webhook          # GitHub 배포 훅

# 로그 보관 정책: 30일 (비용 최적화)
```

### 3.3 CloudWatch Alarms

```
Critical Alarms:
  • Lambda error rate > 5% (1분 유지) → SNS → Telegram
  • Lambda duration > 30초 (cold start 제외) → SNS → Slack
  • DynamoDB throttling detected → SNS → Slack
  • Log group 에러율 > 10% → SNS → Email (CEO)

High Priority Alarms:
  • Lambda invocations < expected (cron 미실행) → SNS → Slack
  • Database read capacity exhausted → SNS → Slack
  • SQS queue depth > 1000 → SNS → Slack
```

---

## 4단계: GitHub Actions CI/CD 모니터링

### 4.1 GitHub Actions 메트릭 수집

**추적할 메트릭:**

```
각 프로젝트별:
  ├─ 빌드 성공률 (%)
  ├─ 평균 빌드 시간 (분)
  ├─ 테스트 성공률 (%)
  ├─ 테스트 커버리지 (%)
  ├─ 배포 빈도 (회/일)
  ├─ 배포 성공률 (%)
  ├─ 배포 후 에러율 (%)
  └─ 평균 복구 시간 (분)
```

### 4.2 GitHub API를 통한 자동 수집

```javascript
// Datadog와 GitHub API 통합
// 매 30분마다 최신 CI/CD 결과 가져오기

import axios from 'axios';

async function collectGitHubMetrics() {
  const projects = [
    'dsc-india-mannur-discord-bot',
    'dsc-india-mannur-team-dashboard',
    'dsc-india-mannur-asset-master',
    'dsc-india-mannur-backup',
    'dsc-india-mannur-travel-management',
    'dsc-india-mannur-harness-eng',
    'dsc-india-mannur-breakdown-management',
    'jeepney-memory-automation'
  ];

  for (const repo of projects) {
    // 최근 30개 workflow run 가져오기
    const runs = await axios.get(
      `https://api.github.com/repos/${repo}/actions/runs?limit=30`,
      { headers: { Authorization: `token ${process.env.GITHUB_PAT}` } }
    );

    // 메트릭 추출 & Datadog 전송
    const successCount = runs.data.workflow_runs.filter(r => r.conclusion === 'success').length;
    const avgDuration = runs.data.workflow_runs.reduce((sum, r) => sum + r.run_number, 0) / runs.data.workflow_runs.length;

    tracer.gauge('github.build.success_rate', (successCount / runs.data.workflow_runs.length) * 100, {
      tags: [`repo:${repo}`]
    });

    tracer.gauge('github.build.avg_duration_seconds', avgDuration, {
      tags: [`repo:${repo}`]
    });
  }
}

// 30분 주기로 실행
setInterval(collectGitHubMetrics, 30 * 60 * 1000);
```

---

## 5단계: Alert Rules & Escalation (알림 규칙 & 에스컬레이션)

### 5.1 Alert 분류 및 우선순위

#### 🔴 Critical (즉시 조치 필수) — Telegram to CEO

**1. API 가용성 위협**

```
조건:
  • API 응답시간 (p99) > 5초 (1분 유지)
  • 에러율 > 10% (1분 유지)
  • 서비스 가용성 < 95% (1분 유지)

조치:
  • Telegram 즉시 전송 (CEO 나경태)
  • 메시지: "🔴 API 장애: {서비스} {세부사항}"
  • 자동 문제 진단 스크립트 실행
  • 온콜 엔지니어에게 PagerDuty 알림

예시:
  "🔴 CRITICAL: Asset Master API 응답시간 초과
  - P99: 8.5초 (임계값: 5초)
  - 에러율: 12%
  - 영향: 15 active users
  - 자동 조치: 함수 메모리 증가 중..."
```

**2. 데이터베이스 장애**

```
조건:
  • DB 연결 실패
  • 쿼리 timeout (> 30초)
  • 복제 지연 > 10초

조치:
  • Telegram 즉시 + Slack #critical-incident
  • 자동 DB 연결 풀 재설정
  • 읽기 전용 모드 전환 (필요시)
```

**3. 배포 실패**

```
조건:
  • Vercel 배포 실패 (빌드 또는 배포)
  • 배포 후 에러율 > 5% (5분 유지)

조치:
  • Telegram 즉시 전송
  • 자동 롤백 시작
  • 개발팀 Slack 채널 알림
```

#### 🟠 High (1시간 내 조치) — Slack #일반

**1. 성능 저하**

```
조건:
  • P99 응답시간 > 2초 (5분 유지)
  • 에러율 > 5% (5분 유지)
  • 데이터베이스 쿼리시간 > 1초 (p95)

조치:
  • Slack #일반 채널 알림
  • 성능 분석 대시보드 링크 제공
  • 팀 리더에게 slack mention
```

**2. 테스트 실패**

```
조건:
  • GitHub Actions 테스트 성공률 < 90%
  • 배포 전 테스트 실패

조치:
  • Slack에 실패한 테스트 목록 + 로그 링크
  • PR에 자동 코멘트 추가
  • 빌드 블로킹 (실패율 > 50%)
```

**3. 리소스 경고**

```
조건:
  • DB 저장소 사용량 > 80%
  • 메모리 사용량 > 90%
  • 인증서 만료 < 7일

조치:
  • Slack 정규 보고
  • 리소스 확장 계획 논의
```

#### 🟡 Medium (하루 내 조치) — Discord #기술

**1. 배포 및 자동화**

```
조건:
  • Cron 작업 성공률 < 95%
  • 배포 시간 > 10분
  • GitHub workflow duration > 15분

조치:
  • Discord #기술 채널 로그
  • 주간 리포트에 포함
```

**2. 팀 업무**

```
조건:
  • 팀원 미활동 (> 6시간)
  • 작업 완료 지연 (> 1시간)
  • 규칙 위반 감지

조치:
  • Discord에 상태 업데이트
  • 비서 AI에게 팀 조율 알림
```

#### 🟢 Low (주간 리포트) — 월간 요약

```
조건:
  • 인증서 만료 경고 (< 30일)
  • 사용하지 않는 리소스
  • 저사용률 항목

조치:
  • 월간 DevOps 리포트에 포함
  • CEO에게 정기 보고
```

### 5.2 에스컬레이션 매트릭스 (Escalation Matrix)

```
┌────────────────────────────────────────────────────────────┐
│              Alert Escalation Flow                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🔴 CRITICAL                                              │
│  ├─ 즉시 (0분):  Telegram → CEO 나경태                     │
│  ├─ 5분 미응답: Slack #critical-incident mention          │
│  ├─ 10분 미응답: PagerDuty 즉시 호출                      │
│  └─ 30분 미응답: 자동 롤백 + 서비스 복구 시도              │
│                                                            │
│  🟠 HIGH                                                  │
│  ├─ 즉시 (0분):  Slack #일반 채널                         │
│  ├─ 30분 미응답: Team Lead mention                        │
│  ├─ 1시간 미응답: 이전 step 다시 알림                     │
│  └─ 2시간 미응답: 우선순위 변경 (Critical 승격)           │
│                                                            │
│  🟡 MEDIUM                                                │
│  ├─ 즉시 (0분):  Discord #기술 로그                       │
│  └─ 24시간: 팀 리더 리뷰                                 │
│                                                            │
│  🟢 LOW                                                   │
│  └─ 주간 리포트                                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 6단계: 팀 옵저버빌리티 대시보드 (Team Observability Dashboard)

### 6.1 실시간 팀 현황 대시보드 (CEO용)

```
┌─────────────────────────────────────────────────────────────┐
│              팀 용량 & 프로젝트 진행률 대시보드 (실시간)        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  팀원 상태 (15/15)                                          │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 🟢 활동중 (12)                                     │     │
│  │   ├─ 비서 AI: CTB 업데이트 + Telegram 모니터링    │     │
│  │   ├─ Web-Builder #1: Asset Master P2 UI           │     │
│  │   ├─ Web-Builder #2: Travel P2 UI                 │     │
│  │   ├─ Evaluator #1: QA 감시                        │     │
│  │   ├─ Automation-Specialist #1: Memory Auto P2B    │     │
│  │   └─ [7명 더]                                     │     │
│  │                                                   │     │
│  │ 🟡 진행중 (3)                                     │     │
│  │   ├─ DevOps Engineer: 인프라 모니터링 설계         │     │
│  │   ├─ Design Specialist: 팀 대시보드 P2 UI         │     │
│  │   └─ Memory Specialist: Phase 2C 신뢰도 계산      │     │
│  │                                                   │     │
│  │ 🔴 블로킹 (0)                                     │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  8개 프로젝트 진행률                                        │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 1. Discord Bot P1        ████████████ 100% ✅       │     │
│  │ 2. Team Dashboard P1/P2B ████████████ 100% ✅       │     │
│  │ 3. BM-P1 (Breakdown)     ████████████ 100% ✅       │     │
│  │ 4. Asset Master P2       ████████░░░░ 85%          │     │
│  │ 5. Backup P2             ██████░░░░░░ 35%          │     │
│  │ 6. Travel P2             ████████░░░░ 78%          │     │
│  │ 7. Harness-ENG P2        ███░░░░░░░░░ 25%          │     │
│  │ 8. Memory Auto P2        ███████░░░░░ 60% (Phase 2B) │   │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  시스템 상태 한눈에 보기                                    │
│  ┌────────┬────────┬────────┬────────┬────────┐            │
│  │ 서비스  │ 상태   │ P99    │ 에러율 │ SLA    │            │
│  ├────────┼────────┼────────┼────────┼────────┤            │
│  │ API    │ 🟢     │ 245ms  │ 0.8%   │ 99.9% ✅ │            │
│  │ DB     │ 🟢     │ 125ms  │ 0%     │ 99.99%✅ │            │
│  │ Vercel │ 🟢     │ 450ms  │ 2.1%   │ 99.5% ✅ │            │
│  │ Cron   │ 🟢     │ 8.5s   │ 0%     │ 95%   ✅ │            │
│  │ GitHub │ 🟡     │ -      │ 2%     │ 98%   ✅ │            │
│  └────────┴────────┴────────┴────────┴────────┘            │
│                                                             │
│  최근 6시간 알림 요약                                      │
│  ├─ 🔴 Critical: 0건                                       │
│  ├─ 🟠 High: 2건 (API latency spike, DB slow queries)     │
│  └─ 🟡 Medium: 5건                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 프로젝트별 상세 대시보드 (PM용)

```
각 프로젝트별 실시간 진행 현황:

Asset Master P2:
  ├─ 설계: ✅ 완료 (2026-05-27)
  ├─ API: ✅ 완료 (100%, 20개 엔드포인트)
  ├─ UI: 🟡 진행중 (85%, 5개 컴포넌트 남음)
  ├─ 테스트: 🟡 진행중 (90%, 커버리지 95%)
  ├─ 배포: 🟡 예정 (2026-05-28 20:00)
  └─ 담당: Web-Builder #1 (100% 할당)

Travel P2:
  ├─ 설계: ✅ 완료 (2026-05-26)
  ├─ API: ✅ 완료 (13개 엔드포인트)
  ├─ UI: 🟡 진행중 (78%, 3개 페이지)
  ├─ 테스트: 🟡 진행중 (80%)
  ├─ 배포: 🟡 예정 (2026-05-30)
  └─ 담당: Web-Builder #2 (100% 할당, 신규)

[6개 프로젝트 계속...]
```

---

## 7단계: Runbook & Incident Response (신고 처리 절차서)

### 7.1 Top 10 Incident Scenarios (자주 발생하는 10가지 상황)

#### 🔴 Incident #1: API 응답시간 급증

**증상:** P99 응답시간 > 5초, 에러율 급증

**원인 분석:**
```bash
# 1단계: 문제 확인
SELECT 
  service,
  COUNT(*) as request_count,
  PERCENTILE(duration_ms, 99) as p99,
  SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) as error_count
FROM api_logs
WHERE timestamp > NOW() - interval '5 minutes'
GROUP BY service
ORDER BY p99 DESC;

# 2단계: 느린 쿼리 확인
SELECT 
  query_hash,
  query_text,
  COUNT(*) as call_count,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- 1초 이상
ORDER BY mean_exec_time DESC
LIMIT 10;

# 3단계: 데이터베이스 연결 상태 확인
SELECT 
  usename,
  count(*) as connection_count
FROM pg_stat_activity
WHERE state = 'active'
GROUP BY usename;
```

**즉시 조치 순서:**
1. ✅ 데이터베이스 연결 풀 상태 확인 (목표: 20 active, 40 max)
2. ✅ 느린 쿼리 확인 및 인덱스 최적화 (해당시)
3. ✅ Vercel 함수 메모리 증가 (256MB → 512MB)
4. ✅ 캐시 정책 조정 (Redis/KV cache)
5. ✅ 필요시 CDN 설정 재검토

**자동 복구 스크립트:**

```bash
#!/bin/bash
# Incident #1: API 응답시간 복구 스크립트

set -e

API_THRESHOLD_MS=5000
ERROR_RATE_THRESHOLD=0.1  # 10%

# 1. 현재 상태 확인
echo "🔍 API 성능 확인 중..."
p99=$(curl -s https://api.datadog.com/metrics/p99-duration \
  | jq '.value')

error_rate=$(curl -s https://api.datadog.com/metrics/error-rate \
  | jq '.value')

echo "P99: ${p99}ms, Error Rate: ${error_rate}%"

if [[ $p99 -gt $API_THRESHOLD_MS ]] || [[ $error_rate -gt $ERROR_RATE_THRESHOLD ]]; then
  echo "⚠️ 임계값 초과 감지, 자동 복구 시작..."

  # 2. Vercel 함수 메모리 증가
  echo "🔧 Vercel 함수 메모리 업그레이드 (256MB → 512MB)..."
  curl -X PATCH https://api.vercel.com/v12/projects/DSC-FMS-PORTAL \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -d '{"functions":{"memory":512}}'

  # 3. 데이터베이스 연결 풀 리셋
  echo "🔧 DB 연결 풀 리셋..."
  psql "postgresql://$DB_USER:$DB_PASS@$DB_HOST/$DB_NAME" \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
        WHERE state = 'idle' AND now() - query_start > interval '10 minutes';"

  # 4. 자동화 에이전트에 알림
  echo "📢 비서 AI에 에스컬레이션..."
  curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage \
    -d "chat_id=$TELEGRAM_CHAT_ID" \
    -d "text=🔧 자동 복구 실행: API 성능 향상 중..."

  sleep 60

  # 5. 복구 효과 확인
  p99_after=$(curl -s https://api.datadog.com/metrics/p99-duration | jq '.value')
  echo "복구 후 P99: ${p99_after}ms"

  if [[ $p99_after -lt 3000 ]]; then
    echo "✅ 자동 복구 성공"
    exit 0
  else
    echo "❌ 자동 복구 실패, 수동 개입 필요"
    # CEO에게 Telegram 긴급 알림
    curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage \
      -d "chat_id=$CEO_TELEGRAM_CHAT_ID" \
      -d "text=🚨 CRITICAL: API 성능 복구 실패, 긴급 대응 필요"
    exit 1
  fi
fi

echo "✅ API 성능 정상"
exit 0
```

#### 🔴 Incident #2: 데이터베이스 연결 실패

**증상:** 모든 API 요청 실패 (DB 연결 timeout)

**원인:** 연결 풀 고갈, 복제 지연, 또는 Supabase 인스턴스 장애

**응급 대응:**

```sql
-- 1. 현재 연결 상태 확인
SELECT 
  datname,
  count(*) as total_connections,
  sum(case when state = 'active' then 1 else 0 end) as active,
  sum(case when state = 'idle' then 1 else 0 end) as idle
FROM pg_stat_activity
GROUP BY datname;

-- 2. 좀비 연결 종료 (idle > 10분)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
  AND now() - query_start > interval '10 minutes'
  AND pid <> pg_backend_pid();

-- 3. 읽기 복제본으로 즉시 전환 (선택사항)
-- Connection string in app: primary-db → read-replica-db

-- 4. Supabase 헬스 체크
-- https://status.supabase.com 방문, 인시던트 확인
```

#### 🔴 Incident #3: Vercel 배포 실패

**증상:** 배포 프로세스 멈춤, 빌드 실패

**원인:** 메모리 부족, 빌드 스크립트 에러, 또는 환경 변수 누락

**복구 절차:**

```bash
# 1. 실패 로그 확인
# Vercel Dashboard → Project → Deployments → Failed Build → Logs

# 2. 일반적인 원인 체크리스트
# ☐ 환경 변수 누락 (VERCEL_TOKEN, SUPABASE_KEY 등)
# ☐ 의존성 설치 실패 (npm ci 재시도)
# ☐ 메모리 부족 (빌드 메모리 증가)
# ☐ 타임아웃 (빌드 시간 초과)

# 3. 자동 롤백
git revert <commit-hash>  # 이전 커밋으로 복원
git push origin main      # 재배포 트리거

# 4. 개발팀 알림
# Slack #기술 채널: "배포 실패, 자동 롤백 실행됨"
```

#### 🟠 Incident #4: 느린 쿼리 (Database Query Timeout)

**증상:** 특정 API 끝점만 느림 (예: 데이터 조회)

**진단:**

```sql
-- Slow query log 확인 (pg_stat_statements)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 500  -- 500ms 이상
ORDER BY mean_time DESC
LIMIT 10;

-- 실행 계획 분석
EXPLAIN ANALYZE
SELECT * FROM assets
WHERE project_id = 'asset-master'
ORDER BY created_at DESC
LIMIT 100;
```

**최적화:**

```sql
-- 인덱스 추가 (필요시)
CREATE INDEX IF NOT EXISTS idx_assets_project_created 
ON assets(project_id, created_at DESC);

-- 쿼리 최적화 (서브쿼리 사용)
-- Before: O(n²) nested join
-- After: Single table scan + indexed lookup

-- 캐싱 레이어 추가
-- Redis/KV cache for frequently accessed data
```

#### 🟠 Incident #5: Cron 작업 실패

**증상:** 메모리 수집, 규칙 감시, 신뢰도 리포트 미실행

**원인:** 스크립트 에러, 권한 문제, 또는 API 토큰 만료

**복구:**

```bash
# 1. Cron 실행 로그 확인
tail -100 /home/jeepney/.openclaw/logs/cron-health.log

# 2. 권한 확인
ls -la /home/jeepney/.openclaw/scripts/

# 3. API 토큰 갱신
export GATEWAY_TOKEN=$(cat /home/jeepney/.openclaw/tokens/gateway.token)
export MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"

# 4. 수동 실행 테스트
bash /home/jeepney/.openclaw/scripts/memory-automation-cron.sh

# 5. Cron 재등록
# 비서 AI에 위임: "Cron #12 문제 해결하고 재등록해"
```

#### 🟡 Incident #6: 팀원 미활동 감지

**증상:** 팀원 온라인 상태 없음 (6시간+)

**대응:**

```bash
# 1. CTB 확인: 해당 팀원의 마지막 작업 확인
# 2. Slack 확인: 마지막 메시지 시간
# 3. 이메일: "작업 상황 확인 메시지" 전송
# 4. 30분 추가 대기 후 미응답시 비서 AI에게 팀 조율 위임
```

---

## 8단계: SLA 정의 & 추적

### 8.1 서비스별 SLA (Service Level Agreement)

| 서비스 | 가용성 목표 | 응답시간 (p99) | 에러율 | 월 허용 다운 |
|-------|----------|-------------|--------|-----------|
| API (8개 프로젝트) | 99.9% | < 500ms | < 1% | 43분 |
| 데이터베이스 | 99.99% | < 200ms | < 0.1% | 4분 |
| Vercel 배포 | 99.5% | < 1초 | < 2% | 3.6시간 |
| Cron 작업 | 95% | < 30초 | < 5% | 36시간 |
| GitHub Actions | 98% | - | 2% | 14.4시간 |

### 8.2 SLA 위반 추적 & 보상

```
SLA 위반 발생 시:

1. 자동 로깅
   └─ Incident timestamp, duration, impact level

2. 우선순위별 보상
   ├─ API 99.9% 미달 (월): 빌드 시간 30분 보상
   ├─ API 99% 미달 (월): 배포 우선순위 상향
   └─ Cron 95% 미달 (월): 팀 회고

3. CEO 보고
   └─ 월간 SLA 리포트 (위반 건수, 원인, 개선 대책)
```

---

## 9단계: 구현 타임라인 (Phase 2, 2026-06-02까지)

### 9.1 주간 구현 계획

**주차 1: 2026-06-02까지 (4일)**

| 일자 | 태스크 | 담당 | 예상 소요 | 상태 |
|-----|-------|------|---------|------|
| 2026-05-29 | Datadog 계정 생성 + 통합 | DevOps | 2시간 | 🟡 |
| 2026-05-29 | APM 에이전트 배포 (8개 프로젝트) | DevOps | 4시간 | 🟡 |
| 2026-05-30 | 로그 수집 & 구조화 | DevOps | 3시간 | ⏳ |
| 2026-05-30 | 대시보드 4개 생성 (Datadog) | DevOps | 4시간 | ⏳ |
| 2026-05-31 | CloudWatch 설정 (AWS Lambda) | DevOps | 2시간 | ⏳ |
| 2026-05-31 | Alert Rules 프로그래밍 | DevOps | 4시간 | ⏳ |
| 2026-06-01 | Runbook 작성 (Top 10 incidents) | DevOps | 4시간 | ⏳ |
| 2026-06-02 | Slack/Telegram 웹훅 연결 | DevOps | 2시간 | ⏳ |

**주차 2: 2026-06-05까지 (3일)**

| 일자 | 태스크 | 담당 | 예상 소요 | 상태 |
|-----|-------|------|---------|------|
| 2026-06-03 | 대시보드 테스트 & 최적화 | DevOps | 3시간 | ⏳ |
| 2026-06-03 | 모니터링 시뮬레이션 (장애 유발 테스트) | DevOps/QA | 4시간 | ⏳ |
| 2026-06-04 | 팀 교육 (대시보드 사용법) | DevOps | 2시간 | ⏳ |
| 2026-06-04 | 알림 튜닝 (false positive 제거) | DevOps | 3시간 | ⏳ |
| 2026-06-05 | 프로덕션 배포 & 모니터링 | DevOps | 2시간 | ⏳ |

---

## 10단계: 성공 기준 & 검증

### 10.1 설계 완료 체크리스트

- [ ] Datadog 통합 설계 완료 (APM, Metrics, Logs)
- [ ] CloudWatch 설정 설계 완료 (Lambda, DynamoDB)
- [ ] Alert Rules 40개 이상 정의
- [ ] Runbook 10개 이상 작성
- [ ] 대시보드 4개 이상 설계
- [ ] SLA 정의 완료 (5개 서비스 이상)
- [ ] 팀 옵저버빌리티 대시보드 설계
- [ ] 문서화 완료 (500+ 줄)

### 10.2 구현 완료 기준

- [ ] 모든 8개 프로젝트 API APM 추적 활성화
- [ ] Slack/Telegram 웹훅 연결 확인
- [ ] 알림 테스트 통과 (Critical 5개 시나리오)
- [ ] 대시보드 데이터 수집 확인 (≥12시간 로그)
- [ ] 팀원 피드백 수집 & 반영
- [ ] Cron 작업 헬스 모니터링 활성화

---

## 11단계: 운영 & 유지보수

### 11.1 일일 모니터링 체크리스트

```
08:00 KST — 아침 체크인
  ☐ 야간 알림 검토 (Critical, High)
  ☐ SLA 위반 확인
  ☐ 팀원 상태 확인
  ☐ 어제 Cron 성공률 검토

14:00 KST — 오후 점검
  ☐ 실시간 대시보드 확인 (API, DB, Vercel)
  ☐ 진행 중인 작업 모니터링
  ☐ 리소스 사용률 확인

18:00 KST — 저녁 마무리
  ☐ 일일 요약 리포트 생성
  ☐ 내일 예정 작업 확인
  ☐ 알림 규칙 튜닝 필요 여부 검토
```

### 11.2 주간 DevOps 리뷰 (매주 월요 18:00)

```
▪ SLA 위반 분석 (원인, 재발 방지책)
▪ 성능 추이 (주간 비교)
▪ 리소스 최적화 기회
▪ 팀 피드백 & 개선사항
▪ 다음주 예정 작업
```

### 11.3 월간 DevOps 보고 (CEO에게)

```
📊 월간 인프라 성능 리포트
├─ 서비스 가용성 (%)
├─ SLA 준수율
├─ 평균 응답시간 (API, DB)
├─ 에러율 추이
├─ 배포 빈도 & 성공률
├─ 비용 최적화 제안
└─ 다음달 예정 작업
```

---

## 📞 연락처 & 에스컬레이션

| 역할 | 연락처 | 응답시간 | 우선순위 |
|-----|-------|---------|---------|
| DevOps Lead | Claude (이 에이전트) | <5분 | Critical |
| CEO (나경태) | Telegram | <15분 | Critical |
| Web-Builder | Slack #기술 | <30분 | High |
| Automation-Specialist | Discord | <60분 | Medium |

---

## 📝 문서 이력

| 버전 | 날짜 | 변경사항 | 담당 |
|-----|------|--------|------|
| 1.0 | 2026-05-29 | 초안 작성 | DevOps #12 |
| 2.0 (예정) | 2026-05-31 | Phase 2 구현 계획 추가 | DevOps #12 |
| 3.0 (예정) | 2026-06-05 | 운영 매뉴얼 추가 | DevOps #12 |

---

**문서 크기:** 1,150+ 줄  
**마지막 업데이트:** 2026-05-29 04:45 KST  
**다음 검토:** 2026-05-31 18:00 KST (Phase 1 설계 완료)
