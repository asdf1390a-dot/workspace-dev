---
name: DevOps 인프라 모니터링 구현 일정 & 배포 계획
description: Phase 2 구현 계획 — 4주(2026-06-01~06-26) 주간 스프린트별 상세 일정, 설정 절차, 테스트 계획, 팀 교육
type: implementation
date: 2026-05-29
owner: DevOps Engineer AI (Phase C #12)
mentor: Automation-Specialist AI
eta_complete: 2026-06-02 18:00 KST (이 문서 완성 기한)
eta_implementation_week1: 2026-06-05 18:00 KST
eta_goLive: 2026-06-26 23:59 KST
---

# 📅 DevOps 인프라 모니터링 구현 일정 (Implementation Timeline)

## Executive Summary (경영 요약)

**목표:** 2026-06-01부터 4주간 모니터링 인프라 완전 구축 및 본운영(Go-Live)

**범위:** Datadog 설정, CloudWatch 연동, 대시보드 구성, 알림 규칙 적용, 팀 교육, 본운영 전환

**투입 인력:** DevOps Engineer (Lead) + Automation-Specialist (Infrastructure) + Secretary (Coordination)

**예산:** 월 $500-800 USD (Datadog Pro + CloudWatch 혼합)

**성공 기준:**
- ✅ 모든 8개 프로젝트 APM 계측 완료
- ✅ 40+ 알림 규칙 설정 및 테스트 완료
- ✅ 팀별 대시보드 배포 완료
- ✅ 팀 전체 교육 및 온콜 매뉴얼 수료
- ✅ 72시간 가동 테스트(Dry Run) 성공

---

## 📊 주간 스프린트 개요

```
┌──────────────────────────────────────────────────────────────┐
│ WEEK 1 (6/1-6/5): 기초 인프라 구축                           │
│ 목표: Datadog/CloudWatch 초기 설정 + 데이터 수집 개시         │
├──────────────────────────────────────────────────────────────┤
│ ✅ Datadog 조직 생성, API 키 발급                             │
│ ✅ APM Agent (dd-trace-js) 배포 to Vercel                   │
│ ✅ CloudWatch Log Groups 생성 (8개 프로젝트)                │
│ ✅ Slack/Telegram 웹훅 연동                                 │
│ ✅ 첫 메트릭 수집 및 통계 검증                               │
│ ETA: 2026-06-05 18:00 KST ✅                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ WEEK 2 (6/6-6/12): 대시보드 & 알림 규칙                     │
│ 목표: 실시간 모니터링 대시보드 + 40+ 알림 규칙 활성화        │
├──────────────────────────────────────────────────────────────┤
│ ✅ Datadog 커스텀 대시보드 4개 구성                          │
│ ✅ 알림 규칙 40+ 개 설정 (Critical/High/Medium/Low)         │
│ ✅ SLA 모니터 설정 (99.9% API, 99.99% DB)                  │
│ ✅ 팀 용량 실시간 추적 대시보드 완성                          │
│ ✅ 알림 테스트 (각 규칙별 10회 이상)                         │
│ ETA: 2026-06-12 18:00 KST ✅                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ WEEK 3 (6/13-6/19): 팀 교육 & 검증                          │
│ 목표: 팀 전체 교육 + Dry Run(72시간 모니터링)               │
├──────────────────────────────────────────────────────────────┤
│ ✅ Secretary/팀장 교육 (대시보드 읽기, 알림 대응)             │
│ ✅ 온콜 로테이션 설정 (7일 주기)                             │
│ ✅ Runbook 및 Incident Response 배포                       │
│ ✅ 72시간 Dry Run (모든 알림 메커니즘 테스트)                │
│ ✅ 피드백 수집 및 최적화                                     │
│ ETA: 2026-06-19 18:00 KST ✅                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ WEEK 4 (6/20-6/26): 본운영 & 최적화                         │
│ 목표: 본운영 전환 + 2주간 모니터링                           │
├──────────────────────────────────────────────────────────────┤
│ ✅ 본운영 전환 (Go-Live)                                    │
│ ✅ 모니터링 24시간 on-call 활성화                            │
│ ✅ 성능 최적화 (거짓 경보 필터링)                             │
│ ✅ 주간 리뷰 (신뢰도, 응답시간)                              │
│ ✅ 성능 기준 달성 확인 (99.9% SLA)                          │
│ ETA: 2026-06-26 23:59 KST (Phase 2 완료) ✅                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 WEEK 1: 기초 인프라 구축 (2026-06-01 ~ 06-05)

### 목표
- Datadog 계정 + 조직 설정
- APM Agent 배포 (모든 8개 프로젝트)
- 초기 메트릭 수집 시작
- Webhook 연동 (Slack/Telegram)

### 📋 Day 1 (6/1, 일요일): Datadog 초기화

**1️⃣ Datadog 조직 생성**

```bash
# 1. Datadog 웹사이트에서 Pro 계정 가입
#    URL: https://www.datadoghq.com/free-datadog-trial/
#    결제: 신용카드 등록 (AWS 빌링 또는 직접)
#    대상지역: 미국 (US3, 또는 EU1)

# 2. 조직 설정
# - 조직명: DSC-FMS-Monitoring
# - 팀: 
#   * Admin: DevOps Engineer
#   * Operators: Secretary, Automation-Specialist
#   * Viewers: All team members (15명)
# - 2FA 활성화 (Admin 계정)

# 3. API 키 발급 (2개)
# - API_KEY_MAIN: 메인 메트릭 수집용
# - API_KEY_BACKUP: 백업/테스트용

# 저장 위치: ~/.env.devops (절대 git 커밋 금지)
# 형식:
DATADOG_API_KEY_MAIN="<key>"
DATADOG_API_KEY_BACKUP="<key>"
DATADOG_APP_KEY="<app_key>"
DATADOG_SITE="datadoghq.com"  # 또는 datadoghq.eu
```

**예상 소요시간:** 30분  
**검증:** Datadog 대시보드 접속 가능 (Admin 계정)

---

### 📋 Day 1-2 (6/1-6/2): APM Agent 배포

**2️⃣ dd-trace-js APM 설정 (Node.js/Next.js)**

모든 8개 프로젝트의 Next.js 앱에 Datadog APM 계측 추가:

```bash
# 1. NPM 의존성 추가
cd <project-root>
npm install dd-trace

# 2. next.config.js 수정
# 파일: next.config.js
const path = require('path');

module.exports = {
  env: {
    DD_TRACE_ENABLED: 'true',
    DD_ENV: process.env.DD_ENV || 'production',
    DD_VERSION: process.env.DD_VERSION || '1.0.0',
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.entry = async () => {
        const entries = await config.entry();
        return {
          ...entries,
          'dd-trace-init': path.join(__dirname, 'dd-trace-init.js'),
        };
      };
    }
    return config;
  },
};

# 3. dd-trace-init.js 생성 (프로젝트 루트)
# 파일: dd-trace-init.js
const tracer = require('dd-trace').init({
  hostname: process.env.DD_AGENT_HOST || 'localhost',
  port: process.env.DD_AGENT_PORT || 8126,
  env: process.env.DD_ENV || 'production',
  service: process.env.DD_SERVICE || 'dsc-fms-api',
  version: process.env.DD_VERSION || '1.0.0',
  logInjection: true,
  runtimeMetrics: true,
  profiling: true,
  tags: {
    'team': 'dsc-mannur',
    'project': process.env.PROJECT_NAME || 'unknown',
  },
});

// APM 계측 플러그인 활성화
tracer.use('http', {
  service: process.env.DD_SERVICE,
  splitByDomain: false,
});

tracer.use('express', {
  service: process.env.DD_SERVICE,
});

tracer.use('pg', {
  service: 'supabase-postgres',
});

module.exports = tracer;

# 4. API 라우트 계측 (pages/api/* 각 파일)
// pages/api/example.js
import tracer from '../../dd-trace-init';

export default tracer.wrap(
  async function handler(req, res) {
    // API 로직
    res.status(200).json({ message: 'OK' });
  },
  {
    name: 'api.example',
    resource: `${req.method} /api/example`,
  }
);

# 5. 환경 변수 설정 (Vercel)
# Vercel 프로젝트 → Settings → Environment Variables
DD_ENV=production
DD_SERVICE=<project-name>
DD_VERSION=<git-tag 또는 1.0.0>
DD_TRACE_ENABLED=true
```

**배포 대상 8개 프로젝트:**
1. dsc-fms-portal (메인 대시보드)
2. asset-master-app
3. backup-management-app
4. travel-management-app
5. team-dashboard-app
6. discord-bot-service (Node.js 백엔드)
7. harness-engineering-app
8. memory-automation-app

**예상 소요시간:** 2-3시간 (프로젝트당 15-20분)  
**검증:** 각 프로젝트 배포 후 Datadog APM에서 메트릭 수신 확인

---

### 📋 Day 2-3 (6/2-6/3): CloudWatch 설정

**3️⃣ CloudWatch Log Groups 생성**

```bash
# 1. AWS CloudWatch 콘솔 접속
# URL: https://console.aws.amazon.com/cloudwatch
# 지역: us-east-1 (Vercel 기본)

# 2. Log Groups 생성 (AWS CLI)
#!/bin/bash

PROJECT_NAMES=(
  "dsc-fms-portal"
  "asset-master-app"
  "backup-management-app"
  "travel-management-app"
  "team-dashboard-app"
  "discord-bot-service"
  "harness-engineering-app"
  "memory-automation-app"
)

for PROJECT in "${PROJECT_NAMES[@]}"; do
  LOG_GROUP="/aws/vercel/${PROJECT}"
  
  # Log Group 생성
  aws logs create-log-group \
    --log-group-name "$LOG_GROUP" \
    --region us-east-1 2>/dev/null || true
  
  # 보존 정책 설정 (30일)
  aws logs put-retention-policy \
    --log-group-name "$LOG_GROUP" \
    --retention-in-days 30 \
    --region us-east-1
  
  echo "✅ Created Log Group: $LOG_GROUP"
done

# 3. Vercel 통합 설정
# Vercel Project Settings → Integrations → CloudWatch
# 연동 범위:
# - Build logs (빌드 로그)
# - Function logs (Lambda 함수 로그)
# - Edge middleware logs (Vercel Edge 미들웨어)

# 4. Supabase 로그 내보내기
# Supabase Project → Logs → Settings
# CloudWatch 대상: arn:aws:logs:us-east-1:<ACCOUNT_ID>:log-group:/aws/supabase/<PROJECT_ID>
```

**예상 소요시간:** 1시간  
**검증:** CloudWatch 콘솔에서 8개 Log Group 확인, 로그 수신 테스트

---

### 📋 Day 3-4 (6/3-6/4): Slack/Telegram 웹훅

**4️⃣ Webhook 설정**

```bash
# 1. Slack Webhook URL 생성
# URL: https://api.slack.com/messaging/webhooks
# 앱명: Datadog Monitoring
# 채널: #일반, #기술, #알림
# 권한: channels:manage, chat:write

# 절약된 웹훅:
SLACK_WEBHOOK_GENERAL="https://hooks.slack.com/services/<ID>/general"
SLACK_WEBHOOK_TECHNICAL="https://hooks.slack.com/services/<ID>/technical"
SLACK_WEBHOOK_ALERTS="https://hooks.slack.com/services/<ID>/alerts"

# 2. Telegram Bot Token 생성 (이미 있으면 사용)
# BotFather로부터 token 재확인
TELEGRAM_BOT_TOKEN="<existing token>"
TELEGRAM_CHAT_ID="<CEO 나경태 개인 채팅 ID>"

# 3. Datadog에서 Webhook 설정
# Datadog Console → Integrations → Webhooks
# Webhook 1: Slack General
#   URL: $SLACK_WEBHOOK_GENERAL
#   Events: All alerts
#   Format: JSON
#
# Webhook 2: Telegram
#   URL: https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage
#   Method: POST
#   Custom Headers: Content-Type: application/json
#   Payload:
#   {
#     "chat_id": "$TELEGRAM_CHAT_ID",
#     "text": "🚨 @nakyungtae\n$EVENT_MSG"
#   }

# 4. 테스트 알림 전송
# Datadog Console → Monitors → Test Alert
# 각 웹훅별 테스트 (3회 이상)
```

**예상 소요시간:** 30분  
**검증:** 테스트 알림이 Slack/Telegram에 도달

---

### 📋 Day 4-5 (6/4-6/5): 초기 메트릭 검증

**5️⃣ 메트릭 수집 검증**

```bash
# 1. Datadog APM 메트릭 수신 확인
# Datadog Console → APM → Services
# 확인 항목:
# ✅ 8개 서비스 모두 "Active" 상태
# ✅ 평균 응답시간 (p50, p95, p99)
# ✅ 에러율 (%)
# ✅ 처리량 (requests/sec)
# ✅ Span 샘플링 비율 (기본 100%)

# 2. CloudWatch 로그 수신 확인
# CloudWatch Console → Log Groups
# 각 Log Group 별:
# ✅ 최근 로그 수신 시간 (현재로부터 <5분)
# ✅ 로그 라인 카운트 (>1000 라인/day)

# 3. Supabase 메트릭 수신 확인
# Datadog Console → Metrics → Summary
# 확인 항목:
# ✅ supabase.query_execution_time
# ✅ supabase.active_connections
# ✅ supabase.replication_lag

# 4. 검증 스크립트
#!/bin/bash
# validate-week1.sh

set -e

echo "🔍 WEEK 1 Validation Check"
echo "================================"

# Check 1: Datadog Services
echo "✅ Check 1: Datadog APM Services"
curl -s "https://api.datadoghq.com/api/v1/service_level_objectives" \
  -H "DD-API-KEY: $DATADOG_API_KEY_MAIN" \
  -H "DD-APPLICATION-KEY: $DATADOG_APP_KEY" | \
  jq '.data | length' | \
  grep -q "^[1-9]" && echo "  ✓ Services detected" || echo "  ✗ No services found"

# Check 2: CloudWatch Log Groups
echo "✅ Check 2: CloudWatch Log Groups"
aws logs describe-log-groups --region us-east-1 | \
  jq '.logGroups | length' | \
  grep -q "^[8-9]" && echo "  ✓ 8+ Log Groups detected" || echo "  ✗ Log Groups incomplete"

# Check 3: Slack Webhook Test
echo "✅ Check 3: Slack Webhook"
curl -X POST "$SLACK_WEBHOOK_GENERAL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"🧪 Week 1 Validation Test"}' && \
  echo "  ✓ Slack webhook working" || echo "  ✗ Slack webhook failed"

# Check 4: Recent logs
echo "✅ Check 4: Recent Log Ingestion"
RECENT=$(aws logs tail /aws/vercel/dsc-fms-portal --follow --format short --since 5m)
if [ ! -z "$RECENT" ]; then
  echo "  ✓ Recent logs detected"
else
  echo "  ⚠ No recent logs (check Vercel integration)"
fi

echo "================================"
echo "✅ Week 1 Validation Complete"
```

**예상 소요시간:** 2시간  
**검증:** 위 스크립트 실행 후 모든 체크 통과 (✓)

---

## 🎨 WEEK 2: 대시보드 & 알림 규칙 (2026-06-06 ~ 06-12)

### 목표
- Datadog 대시보드 4개 구성
- 40+ 알림 규칙 설정 및 테스트
- SLA 모니터 설정
- 팀 용량 대시보드 완성

### 📋 Day 1-2 (6/6-6/7): Datadog 대시보드 구성

**6️⃣ 대시보드 1: Service Health Overview (서비스 헬스)**

```json
{
  "title": "🏥 Service Health Overview - DSC FMS",
  "description": "모든 8개 프로젝트 API 실시간 헬스 체크",
  "widgets": [
    {
      "type": "timeseries",
      "title": "API Response Time (P99)",
      "query": "avg:trace.web.request{env:production} by {service}",
      "yaxis": { "label": "ms" },
      "targets": ["dsc-fms-portal", "asset-master-app", "backup-management-app", "travel-management-app", "team-dashboard-app", "discord-bot-service", "harness-engineering-app", "memory-automation-app"]
    },
    {
      "type": "timeseries",
      "title": "Error Rate by Service",
      "query": "avg:trace.web.request.errors{env:production} by {service}",
      "yaxis": { "label": "%" }
    },
    {
      "type": "status_timeline",
      "title": "Service Availability (99.9% SLA)",
      "query": "avg:system.load{*} > 80"
    },
    {
      "type": "gauge",
      "title": "Overall Uptime",
      "query": "avg:monitor.uptime{*}",
      "targets": ["All Services"]
    },
    {
      "type": "table",
      "title": "Active Incidents",
      "query": "host=* metric:errors",
      "columns": ["timestamp", "service", "error_rate", "status"]
    }
  ]
}
```

**예상 소요시간:** 1.5시간

---

**7️⃣ 대시보드 2: API Performance Analysis (성능 분석)**

```json
{
  "title": "⚡ API Performance Analysis",
  "description": "응답시간, 처리량, 병목 지점 분석",
  "widgets": [
    {
      "type": "heatmap",
      "title": "Response Time Distribution (P0-P100)",
      "query": "trace.web.request.duration{env:production}",
      "buckets": [0, 100, 200, 500, 1000, 2000, 5000]
    },
    {
      "type": "timeseries",
      "title": "Throughput (Requests/sec)",
      "query": "rate(trace.web.request.hits{env:production})",
      "yaxis": { "label": "req/sec" }
    },
    {
      "type": "timeseries",
      "title": "Database Query Time (P95)",
      "query": "avg:trace.sql.query.duration{env:production} by {db}",
      "yaxis": { "label": "ms" }
    },
    {
      "type": "timeseries",
      "title": "Slowest Endpoints (Top 5)",
      "query": "top(avg:trace.web.request.duration{env:production} by {resource}, 5)"
    },
    {
      "type": "number",
      "title": "Median Response Time",
      "query": "median:trace.web.request.duration{env:production}",
      "suffix": "ms"
    }
  ]
}
```

**예상 소요시간:** 1.5시간

---

**8️⃣ 대시보드 3: Database Performance Monitoring (DB 성능)**

```json
{
  "title": "🗄️ Database Performance Monitoring",
  "description": "Supabase PostgreSQL + Query tracing",
  "widgets": [
    {
      "type": "timeseries",
      "title": "Database Connection Pool Usage",
      "query": "avg:postgresql.connections{service:supabase} by {database}"
    },
    {
      "type": "timeseries",
      "title": "Slow Queries (>200ms)",
      "query": "rate(postgresql.slow_queries{service:supabase})"
    },
    {
      "type": "table",
      "title": "Slowest Queries (Top 10)",
      "query": "select query, duration from postgresql_slow_logs order by duration desc limit 10",
      "columns": ["query", "duration_ms", "execution_count", "total_time"]
    },
    {
      "type": "timeseries",
      "title": "Replication Lag (Standby)",
      "query": "avg:postgresql.replication_lag{service:supabase}",
      "yaxis": { "label": "bytes" }
    },
    {
      "type": "number",
      "title": "Query Cache Hit Rate",
      "query": "avg:postgresql.cache_hit_ratio{service:supabase}",
      "suffix": "%"
    }
  ]
}
```

**예상 소요시간:** 1.5시간

---

**9️⃣ 대시보드 4: Team Capacity & Project Progress (팀 용량 & 프로젝트 진행률)**

```json
{
  "title": "👥 Team Capacity & Project Progress",
  "description": "실시간 팀 상태 + 8개 프로젝트 진행률",
  "widgets": [
    {
      "type": "gauge",
      "title": "Team Capacity Utilization",
      "query": "custom.team.capacity.utilized / custom.team.capacity.total * 100",
      "target": 93.3,
      "suffix": "%"
    },
    {
      "type": "timeseries",
      "title": "Active Team Members by Phase",
      "query": "custom.team.members_active by {phase}",
      "stacked": true,
      "targets": ["Phase A", "Phase B", "Phase C"]
    },
    {
      "type": "table",
      "title": "Project Status Matrix (8 projects)",
      "query": "custom.project.status{*}",
      "columns": [
        "project_name",
        "phase",
        "completion_%",
        "eta_days",
        "assigned_members",
        "status_icon"
      ]
    },
    {
      "type": "timeseries",
      "title": "Cron Job Success Rate",
      "query": "rate(custom.cron.jobs.success{*}) / rate(custom.cron.jobs.total{*}) * 100",
      "yaxis": { "label": "%" }
    },
    {
      "type": "number",
      "title": "Memory System Health (Phase 2)",
      "query": "custom.memory.trust_score",
      "suffix": "%"
    }
  ]
}
```

**예상 소요시간:** 2시간 (커스텀 메트릭 설정 포함)

---

### 📋 Day 2-4 (6/7-6/9): 알림 규칙 설정

**🔟 40+ Alert Rules Configuration**

모든 알림은 3가지 채널로 라우팅:
- **Critical:** Telegram (CEO 즉시)
- **High/Medium:** Slack (#기술)
- **Low:** 주간 디제스트

```yaml
# 알림 규칙 정의서 (YAML 형식)

alerts:
  # === CRITICAL (0-5분 응답 목표) ===
  
  - id: alert_api_503_error
    name: "🚨 API 503 Server Error"
    metric: "trace.web.request.errors"
    condition: "count:> 10 in 1m"
    threshold: { critical: 10, warning: 5 }
    services: ["all"]
    channel: telegram
    escalation: "1min → CEO @immediate"
    runbook: "runbook_api_503.md"
    
  - id: alert_db_connection_pool_exhausted
    name: "🚨 Database Connection Pool Exhausted"
    metric: "postgresql.connections"
    condition: "avg:> 90 (in % of max_connections)"
    threshold: { critical: 95, warning: 85 }
    services: ["supabase"]
    channel: telegram
    escalation: "30sec → CEO"
    runbook: "runbook_db_pool.md"
    
  - id: alert_vercel_deployment_failure
    name: "🚨 Vercel Deployment Failed"
    metric: "vercel.deployment.status"
    condition: "status == 'FAILED'"
    services: ["all"]
    channel: telegram
    escalation: "5min → Web-Builder lead"
    runbook: "runbook_vercel_deploy.md"
    
  - id: alert_github_ci_pipeline_failure
    name: "🚨 GitHub CI Pipeline Failed"
    metric: "github.actions.workflow.status"
    condition: "status == 'FAILURE'"
    services: ["all"]
    channel: telegram
    escalation: "5min → Web-Builder lead"
    runbook: "runbook_github_ci.md"
    
  # === HIGH (5-15분 응답 목표) ===
  
  - id: alert_api_latency_high
    name: "⚠️ High API Latency (P99 > 1sec)"
    metric: "trace.web.request.duration"
    condition: "p99:> 1000ms sustained for 5min"
    threshold: { critical: 2000, warning: 1000 }
    services: ["all"]
    channel: slack_technical
    runbook: "runbook_api_latency.md"
    
  - id: alert_error_rate_high
    name: "⚠️ Error Rate Spike (> 5%)"
    metric: "trace.web.request.errors / trace.web.request.hits"
    condition: "> 5% in 5min window"
    threshold: { critical: 10, warning: 5 }
    services: ["all"]
    channel: slack_technical
    runbook: "runbook_error_spike.md"
    
  - id: alert_db_query_slow
    name: "⚠️ Slow Database Queries (P95 > 200ms)"
    metric: "trace.sql.query.duration"
    condition: "p95:> 200ms sustained for 10min"
    threshold: { critical: 500, warning: 200 }
    services: ["supabase"]
    channel: slack_technical
    runbook: "runbook_db_slow.md"
    
  - id: alert_memory_automation_lag
    name: "⚠️ Memory Automation Processing Lag"
    metric: "custom.memory.processing_lag"
    condition: "> 5min"
    threshold: { critical: 10, warning: 5 }
    services: ["memory-automation-app"]
    channel: slack_technical
    runbook: "runbook_memory_lag.md"
    
  # === MEDIUM (15-60분 응답 목표) ===
  
  - id: alert_build_time_long
    name: "🔧 Long Build Time (> 5min)"
    metric: "vercel.build.duration"
    condition: "> 5min"
    threshold: { critical: 10, warning: 5 }
    services: ["all"]
    channel: discord_technical
    
  - id: alert_test_coverage_low
    name: "🔧 Test Coverage Below Threshold"
    metric: "github.actions.test.coverage"
    condition: "< 80%"
    threshold: { critical: 70, warning: 80 }
    services: ["all"]
    channel: discord_technical
    
  - id: alert_unused_repositories
    name: "🔧 Unused Repository Detected"
    metric: "github.repo.last_commit_age"
    condition: "> 30 days"
    services: ["all"]
    channel: discord_technical
    frequency: "weekly"
    
  # === LOW (Weekly digest) ===
  
  - id: alert_certificate_expiration
    name: "📋 SSL Certificate Expiration (< 30 days)"
    metric: "ssl.cert_validity_days"
    condition: "< 30"
    services: ["all"]
    channel: weekly_report
    
  - id: alert_disk_space_low
    name: "📋 Disk Space Low (< 20%)"
    metric: "system.disk.free / system.disk.total"
    condition: "< 20%"
    services: ["all"]
    channel: weekly_report
```

**설정 절차:**

```bash
# Datadog 웹 콘솔에서 각 알림 규칙 수동 입력 또는 Terraform 사용

# Terraform 자동화 (선택사항)
# terraform apply -var-file="alerts.tfvars"
```

**예상 소요시간:** 4-5시간 (모든 규칙 설정 + 테스트)  
**검증:** 각 규칙별 10회 이상 테스트 실행

---

### 📋 Day 4-5 (6/9-6/12): SLA 모니터 & 알림 테스트

**1️⃣1️⃣ SLA Definitions**

```yaml
service_level_objectives:
  
  # 1. API SLA (DSC FMS Portal + 8 projects)
  - service: "api"
    sla_target: 99.9
    definition: "API availability (HTTP 200-399 responses)"
    window: "rolling 30-day"
    threshold_error_rate: 0.1%  # 0.1% = max error
    threshold_latency_p99: 5000ms
    
  # 2. Database SLA (Supabase PostgreSQL)
  - service: "database"
    sla_target: 99.99
    definition: "Database query success rate"
    window: "rolling 30-day"
    threshold_connection_pool: 95% capacity
    threshold_query_time_p95: 200ms
    threshold_replication_lag: 1000ms (bytes)
    
  # 3. CI/CD Pipeline SLA
  - service: "cicd"
    sla_target: 98
    definition: "GitHub Actions + Vercel deployment success"
    window: "rolling 30-day"
    threshold_build_success: 98%
    threshold_deployment_success: 98%
    
  # 4. Vercel Serverless SLA
  - service: "vercel"
    sla_target: 99.5
    definition: "Edge function availability + CDN uptime"
    window: "rolling 30-day"
    
  # 5. OpenClaw Cron SLA
  - service: "cron"
    sla_target: 95
    definition: "Scheduled job success rate"
    window: "rolling 30-day"
    threshold_success_rate: 95%

# SLA 위반 대시보드
sla_violation_tracker:
  - metric: "sla_violations_this_month"
  - metric: "sla_credits_owed" (자동 계산)
  - metric: "time_to_recovery" (TTR)
  - report_frequency: "daily"
```

**예상 소요시간:** 2시간

---

## 👥 WEEK 3: 팀 교육 & Dry Run (2026-06-13 ~ 06-19)

### 목표
- 팀 전체 교육 (Secretary, 팀장, 온콜 담당자)
- 온콜 로테이션 설정
- 72시간 Dry Run (모든 알림 메커니즘 테스트)
- 피드백 수집 및 최적화

### 📋 Day 1-2 (6/13-6/14): 팀 교육

**1️⃣2️⃣ 교육 커리큘럼**

```
Module 1: Datadog 대시보드 읽기 (30분)
├─ 주요 메트릭 이해 (P99, 에러율, 처리량)
├─ 대시보드 4개 둘러보기
├─ 알림 히스토리 읽는 방법
└─ 실습: 현재 상황 분석 (2개 대시보드)

Module 2: 알림 대응 프로세스 (30분)
├─ Critical vs High vs Low 구분
├─ 각 심각도별 대응 시간 (SLA)
├─ 온콜 로테이션 이해
├─ Runbook 사용 방법
└─ 실습: Mock 알림에 대한 시뮬레이션 대응

Module 3: Incident Response (20분)
├─ Incident 선언 기준
├─ 에스컬레이션 프로세스
├─ Post-Mortem 작성
└─ 실습: 과거 사례 분석

Module 4: SLA & Metrics (15분)
├─ 우리의 SLA 목표 (99.9% API, 99.99% DB)
├─ SLA 위반 계산 방법
├─ 신뢰도 점수와의 연관성
└─ 실습: 이번 달 SLA 성과 계산

Module 5: 자동화 & 자가진단 (15분)
├─ 자동 복구 스크립트 (언제 실행?)
├─ 메뉴얼 개입이 필요한 경우
├─ 도움말 채널 및 자료
└─ Q&A
```

**교육 대상:**
1. **Secretary (C-3PO)** — 핵심 (모든 모듈)
2. **Team Leads** (5명: Web-Builder #1, Evaluator, Automation-Specialist, Data-Analyst, Translator) — 모듈 1,2,4,5
3. **On-Call Rotation** (6명: DevOps Engineer, QA Specialist, 기타 자원) — 모듈 1,2,3,5
4. **Optional:** 모든 팀원 (모듈 1만 시청)

**배포 형식:** 
- 실시간 세션 (Zoom) + 녹화본 + 자료 PDF
- Discord #education 채널에 모든 자료 배포

**예상 소요시간:** 1.5시간 (실시간 세션) + 0.5시간 (녹화본 배포)

---

### 📋 Day 2-3 (6/14-6/15): 온콜 로테이션 설정

**1️⃣3️⃣ On-Call Schedule**

```yaml
on_call_schedule:
  
  # 로테이션 주기: 1주 (7일)
  # 온콜 담당자: 6명 (DevOps, QA, Automation, Web-Builder #2, Evaluator #2, Data-Analyst #2)
  # 기본 시간: 24시간 (월~일)
  # 백업: +1 (2차 온콜)
  
  week_1_jun13:
    primary: "DevOps Engineer"
    backup: "Automation-Specialist #2"
    escalation: "Secretary → CEO"
    tools: ["Datadog", "CloudWatch", "Slack", "Telegram"]
    
  week_2_jun20:
    primary: "QA Specialist"
    backup: "Evaluator #2"
    
  week_3_jun27:
    primary: "Web-Builder #2"
    backup: "Data-Analyst #2"
    
  # ... 반복
  
  # 온콜 담당자 체크리스트
  onCall_checklist:
    - "시작 전: Datadog 접속 확인, 휴대폰 알림 활성화"
    - "매 3시간: 대시보드 검토 (Health Overview)"
    - "알림 수신 시: 5분 내 확인 + 30분 내 조치"
    - "새로운 알림 규칙이 있으면 학습"
    - "종료 시: 인수인계 보고서 작성 (각 알림 상태)"
    
  oncall_sla:
    critical: "5분 이내 응답 (Telegram 수신 후)"
    high: "15분 이내 대시보드 확인"
    medium: "1시간 이내 분석 시작"
    
  # Datadog에서 on-call 자동화
  datadog_oncall_integration:
    - type: "Slack Notification"
      rule: "All Critical + High alerts"
      mention: "@oncall-primary"
    - type: "Escalation"
      rule: "No response in 30min"
      escalate_to: "@oncall-backup"
```

**설정 절차:**

```bash
# 1. Datadog → Integrations → PagerDuty (또는 Slack Workflow)
# 온콜 일정 동기화

# 2. Slack 채널 생성: #oncall-rotation
# 매일 09:00에 당일 온콜 담당자 공지

# 3. Telegram 그룹에 온콜 담당자 추가
# (필요시 백업 담당자도 추가)
```

**예상 소요시간:** 1시간

---

### 📋 Day 3-5 (6/15-6/19): 72시간 Dry Run

**1️⃣4️⃣ Dry Run 시나리오**

72시간 동안 실제 알림 없이 모든 알림 메커니즘을 테스트:

```bash
#!/bin/bash
# dry-run-72h.sh

echo "🧪 72-Hour Monitoring Dry Run Started"
echo "======================================"

DRY_RUN_START=$(date +%s)
DRY_RUN_END=$((DRY_RUN_START + 72*3600))  # 72 hours later

# Test 1: Slack Webhook (매 8시간)
test_slack_webhook() {
  echo "🔔 Testing Slack Webhook..."
  curl -X POST "$SLACK_WEBHOOK_GENERAL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"🧪 [DRY-RUN] Slack webhook test - $(date)\"}"
}

# Test 2: Telegram Bot (매 8시간)
test_telegram_webhook() {
  echo "🔔 Testing Telegram Bot..."
  curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H 'Content-Type: application/json' \
    -d "{\"chat_id\":\"$TELEGRAM_CHAT_ID\",\"text\":\"🧪 [DRY-RUN] Telegram test - $(date)\"}"
}

# Test 3: Synthetic API Monitoring (매 1시간)
test_synthetic_monitoring() {
  echo "🔔 Testing Synthetic API Monitoring..."
  
  # Test each of 8 projects
  PROJECTS=(
    "dsc-fms-portal.vercel.app"
    "asset-master-app.vercel.app"
    "backup-management-app.vercel.app"
    "travel-management-app.vercel.app"
    "team-dashboard-app.vercel.app"
    "discord-bot-service.vercel.app"
    "harness-engineering-app.vercel.app"
    "memory-automation-app.vercel.app"
  )
  
  for PROJECT in "${PROJECTS[@]}"; do
    RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "https://$PROJECT/api/health")
    echo "  $PROJECT: ${RESPONSE_TIME}s"
  done
}

# Test 4: Database Connectivity (매 4시간)
test_database_connectivity() {
  echo "🔔 Testing Database Connectivity..."
  
  # Supabase 상태 확인
  curl -s "https://status.supabase.com/api/v2/status.json" | \
    jq '.status.indicator' | \
    grep -q "none" && echo "  ✓ Supabase OK" || echo "  ✗ Supabase issues"
}

# Test 5: Alert Rule Dry-Fire (매일 1회)
test_alert_rules() {
  echo "🔔 Testing Alert Rules..."
  
  # Datadog에서 각 알림 규칙에 대해 "Test Alert" 실행
  # (웹 콘솔 또는 API)
  
  for ALERT_ID in {1..10}; do
    echo "  Testing Alert Rule #$ALERT_ID..."
    # curl -X POST "https://api.datadoghq.com/api/v1/monitor/$ALERT_ID/test" \
    #   -H "DD-API-KEY: $DATADOG_API_KEY_MAIN" \
    #   -H "DD-APPLICATION-KEY: $DATADOG_APP_KEY"
  done
}

# Main loop: 72 hours
while [ $(date +%s) -lt $DRY_RUN_END ]; do
  ELAPSED=$(($(date +%s) - DRY_RUN_START))
  HOURS=$((ELAPSED / 3600))
  
  echo ""
  echo "⏱ DRY-RUN HOUR $HOURS / 72"
  echo "======================================"
  
  # Run tests on schedule
  [ $((HOURS % 8)) -eq 0 ] && test_slack_webhook
  [ $((HOURS % 8)) -eq 0 ] && test_telegram_webhook
  [ $((HOURS % 1)) -eq 0 ] && test_synthetic_monitoring
  [ $((HOURS % 4)) -eq 0 ] && test_database_connectivity
  [ $((HOURS % 24)) -eq 0 ] && test_alert_rules
  
  # Sleep 1 hour before next iteration
  sleep 3600
done

echo ""
echo "✅ 72-Hour Dry Run Complete!"
echo "======================================"
echo "Please review:"
echo "  - Slack channel history (all test messages)"
echo "  - Telegram chat (all test messages)"
echo "  - Datadog alert history"
echo "  - CloudWatch logs"
echo ""
echo "Ready for Go-Live? (Y/N)"
```

**Day별 테스트 계획:**

```
Day 1 (6/15, Fri):
├─ 08:00: Slack webhook test
├─ 16:00: Telegram webhook test
├─ 각 1시간마다: Synthetic API monitoring
└─ 20:00: Team debrief (1회) - 현황 체크

Day 2 (6/16, Sat):
├─ 매 4시간: Database connectivity test
├─ 매 8시간: Webhook 테스트
├─ 14:00: Alert rule dry-fire (상위 10개 규칙)
└─ 20:00: Team debrief (2회)

Day 3 (6/17, Sun):
├─ 전체 최종 검증
├─ 거짓 경보(false positive) 필터링
├─ 응답 시간 측정 (Slack/Telegram)
├─ 온콜 담당자 실제 대응 연습
└─ 23:59: Final sign-off
```

**거짓 경보 필터링:**

Dry Run 중 발생한 모든 거짓 경보를 기록하고, 알림 규칙을 조정:

```yaml
false_positive_log:
  - rule_id: "alert_api_latency_high"
    trigger_time: "2026-06-16 14:30"
    reason: "Vercel 배포 중 일시적 지연"
    action: "P99 임계값을 1초 → 2초로 상향"
    
  - rule_id: "alert_error_rate_high"
    trigger_time: "2026-06-17 10:00"
    reason: "데이터 마이그레이션 중 예상된 에러"
    action: "마이그레이션 시간대 제외 규칙 추가"
```

**예상 소요시간:** 72시간 (자동화, 팀은 모니터링만)

---

## 🚀 WEEK 4: 본운영 & 최적화 (2026-06-20 ~ 06-26)

### 목표
- 본운영 전환 (Go-Live)
- 24시간 on-call 모니터링 활성화
- 성능 최적화 (거짓 경보 제거)
- 성과 검증 (SLA 달성 확인)

### 📋 Day 1 (6/20, Fri): Go-Live

**1️⃣5️⃣ Go-Live Checklist**

```yaml
go_live_checklist:
  pre_launch:
    - [ ] Dry Run 모든 테스트 통과 (72/72시간)
    - [ ] 거짓 경보 필터링 완료 (상위 5개 규칙 조정)
    - [ ] 온콜 로테이션 활성화 (6명 모두 확인)
    - [ ] Runbook 모든 팀원이 읽음 확인
    - [ ] CEO 나경태에게 최종 승인 받음
  
  launch_sequence:
    - [ ] 09:00 KST: 온콜 담당자 확인 (DevOps Engineer)
    - [ ] 09:05: Datadog alert rules 모두 "Active" 상태 확인
    - [ ] 09:10: Slack/Telegram 웹훅 최종 테스트
    - [ ] 09:15: 팀 공지 (Discord + Telegram)
    - [ ] 09:20: 대시보드 라이브 모니터링 시작
    - [ ] 09:30: 첫 1시간 집중 모니터링 (DevOps + Secretary)
    - [ ] 10:30: 초기 상황 리포트
    - [ ] 12:00: 점심 뒤 상황 재확인
  
  post_launch:
    - [ ] 실시간 알림 수신 확인 (Slack/Telegram)
    - [ ] 대시보드 메트릭 정상 범위 확인
    - [ ] SLA 위반 항목 즉시 대응
    - [ ] 첫 72시간 자세한 기록 유지
```

**Go-Live 공지문:**

```
📢 모니터링 시스템 본운영 시작 (2026-06-20 09:30 KST)

안녕하세요, DSC Mannur FMS 팀입니다.

오늘부터 통합 모니터링 시스템(Datadog + CloudWatch)이 본운영을 시작합니다.

✅ 시스템 구성:
- Datadog APM: 모든 8개 프로젝트 API + DB 성능 추적
- CloudWatch: 배포 로그 + 에러 로깅
- Alert Rules: 40+ 규칙 (Critical/High/Medium/Low)
- On-Call Rotation: 6명 1주 순환

⏰ 예상되는 변화:
- 🚨 Critical 알림 (API 503, DB 장애) → Telegram 즉시 알림
- ⚠️ High/Medium 알림 → Slack #기술 채널 (업무 시간)
- 📊 팀 용량 + 프로젝트 진행률 실시간 대시보드

👥 온콜 담당자 (이번주):
- Primary: DevOps Engineer
- Backup: Automation-Specialist #2
- 응답 SLA: Critical 5분, High 15분

📚 자료:
- [대시보드 가이드](링크)
- [알림 대응 프로세스](링크)
- [Runbook](링크)

문의: #oncall-rotation 채널 또는 DevOps Engineer

감사합니다! 🚀
```

**예상 소요시간:** 1시간 (Go-Live 프로세스)

---

### 📋 Day 1-3 (6/20-6/22): 집중 모니터링

**1️⃣6️⃣ First 72 Hours Monitoring**

본운영 첫 72시간은 24시간 on-call 모니터링:

```
Hour 0-24 (Day 1, 6/20):
├─ 09:30: Go-Live (대시보드 라이브 시작)
├─ 10:00: Secretary + DevOps Engineer 합동 모니터링 (2명)
├─ 12:00: 점심 뒤 상황 재검토
├─ 15:00: Data-Analyst 팀 체크인 (데이터 정합성 확인)
├─ 18:00: 일일 종료 리포트 (Secretary)
└─ 19:00~09:30(Day2): Night on-call (DevOps Engineer)

Hour 24-48 (Day 2, 6/21):
├─ 09:30: 새벽 on-call 인수인계
├─ 10:00: 어제 이슈 정리 (거짓 경보 추가 필터링)
├─ 14:00: CEO 나경태 진행 상황 보고
├─ 18:00: 일일 리포트
└─ 19:00~09:30(Day3): Night on-call

Hour 48-72 (Day 3, 6/22):
├─ 09:30: 아침 체크인
├─ 11:00: 최종 대시보드 튜닝 (알림 규칙 조정)
├─ 15:00: 72시간 결과 분석
├─ 18:00: Go-Live 최종 리포트
└─ 19:00: 정상 온콜 로테이션으로 전환
```

**매시간 체크리스트:**

```yaml
hourly_monitoring_checklist:
  every_1_hour:
    - "Datadog Service Health 대시보드 확인 (P99, 에러율)"
    - "새로운 알림 이력 확인"
    - "Slack/Telegram에서 알림 수신 기록"
    
  every_4_hours:
    - "Database 메트릭 확인 (쿼리 시간, 연결 풀)"
    - "CloudWatch 로그 수신 현황 확인"
    - "SLA 현황 계산 (누적)"
    
  every_8_hours:
    - "팀 용량 + 프로젝트 진행률 대시보드 확인"
    - "CI/CD 파이프라인 상태 (GitHub Actions)"
    - "온콜 담당자 인수인계 준비"
    
  daily (18:00 KST):
    - "Daily Report 작성 (모든 알림, SLA 현황, 이슈)"
    - "거짓 경보 수정 사항 기록"
    - "내일 예상 변화 (배포, 유지보수) 공지"
```

**예상 소요시간:** 72시간 (24시간 on-call)

---

### 📋 Day 4-7 (6/23-6/26): 최적화 & 마무리

**1️⃣7️⃣ Week 4 최적화 & 성과 검증**

```yaml
week4_tasks:
  
  day4_jun23:
    - "72시간 결과 분석 리포트 작성 (2-3시간)"
    - "거짓 경보 패턴 분석 (어떤 규칙이 과도한가?)"
    - "응답 시간 측정 (Slack/Telegram 알림 지연시간)"
    - "업데이트된 알림 규칙 5-10개 배포"
    
  day5_jun24:
    - "Monday 09:00: 주간 회의"
    - "  SLA 현황 (API 99.9%, DB 99.99% 달성?)"
    - "  대시보드 피드백 수집"
    - "  거짓 경보 필터링 진행 상황"
    - "팀 신뢰도 점수 계산 (Evaluator Agent)"
    
  day6_jun25:
    - "성능 최적화 (P99 기준 달성?)"
    - "대시보드 사용성 개선 (팀 피드백 반영)"
    - "온콜 로테이션 운영 평가"
    - "Cost Review (Datadog + CloudWatch 비용 추적)"
    
  day7_jun26:
    - "최종 승인 (CEO 나경태)"
    - "본운영 종료 리포트 (Phase 2 완료)"
    - "Phase 3 시작 준비 (지속적 최적화)"
```

**최종 성과 리포트 (Phase 2 Completion):**

```markdown
# 📊 DevOps 인프라 모니터링 Phase 2 완료 리포트

## 📈 달성 현황

### SLA 성과
- ✅ API Availability: 99.93% (목표 99.9%)
- ✅ Database Uptime: 99.99% (목표 99.99%)
- ✅ CI/CD Success Rate: 98.5% (목표 98%)
- ✅ Cron Job Success Rate: 96% (목표 95%)

### 알림 성능
- ⏱ Average Alert Response Time: 3.2분 (목표 5분)
- ✓ Critical alerts: 100% delivered (Telegram)
- ✓ False positive rate: 2.3% (목표 <5%)
- ✓ Alert routing accuracy: 99.8%

### 팀 만족도
- 📊 Monitoring System Adoption: 100% (모든 팀원이 대시보드 접근)
- 😊 Team Satisfaction Score: 4.2/5 (피드백 기반)
- 📚 Training Completion: 100% (모든 팀원 교육 수료)

### 비용 효율
- 💰 Datadog Monthly: $650 USD
- 💰 CloudWatch Monthly: $150 USD
- 💰 Total Cost of Ownership: $800 USD/month
- ✓ ROI: 높음 (SLA 달성으로 인한 신뢰도 + 신뢰도 점수 개선)

## 🎯 다음 단계 (Continuous Improvement)

### Phase 3 (2026-07-01+)
- [ ] Machine Learning 기반 이상탐지 (Datadog Anomaly Detection)
- [ ] 자동 복구 스크립트 확대 (현재 3개 → 10개)
- [ ] 팀별 커스텀 대시보드 (Project Lead 용)
- [ ] SLA 목표 상향 (99.9% → 99.95%)

### Quarterly Review (Q3 2026)
- [ ] 모니터링 인프라 비용 최적화
- [ ] 알림 피로도(Alert Fatigue) 제거 (거짓 경보 <1%)
- [ ] 팀 신뢰도 점수 97% 이상 유지

---

**완료 일자:** 2026-06-26 23:59 KST  
**승인자:** CEO 나경태  
**다음 Owner:** Automation-Specialist (지속적 모니터링)
```

---

## ✅ 성공 기준 & 검증 항목

```yaml
success_criteria:
  
  week1:
    - [ ] Datadog 조직 생성 + API 키 발급
    - [ ] APM Agent (dd-trace-js) 배포 (8개 프로젝트)
    - [ ] CloudWatch Log Groups 생성 (8개)
    - [ ] 초기 메트릭 수집 확인
    - [ ] Slack/Telegram 웹훅 작동 확인
    target_eta: "2026-06-05 18:00"
  
  week2:
    - [ ] Datadog 대시보드 4개 완성
    - [ ] 알림 규칙 40+ 개 설정
    - [ ] SLA 모니터 설정 완료
    - [ ] 모든 알림 규칙 테스트 완료 (각 10회 이상)
    - [ ] 팀 용량 대시보드 구성 완료
    target_eta: "2026-06-12 18:00"
  
  week3:
    - [ ] 팀 교육 완료 (모든 팀원)
    - [ ] 온콜 로테이션 활성화 (6명)
    - [ ] 72시간 Dry Run 통과
    - [ ] 거짓 경보 필터링 (상위 5개 규칙)
    target_eta: "2026-06-19 18:00"
  
  week4:
    - [ ] 본운영 전환 (Go-Live)
    - [ ] 첫 72시간 모니터링 완료
    - [ ] SLA 달성 확인 (99.9% API, 99.99% DB)
    - [ ] 최종 승인 (CEO)
    - [ ] Phase 3 준비 완료
    target_eta: "2026-06-26 23:59"

# === 롤백 계획 (Rollback Plan) ===

rollback_scenarios:
  
  scenario_1_dataloss:
    name: "데이터 손실 (메트릭 누락)"
    trigger: "> 5% 메트릭 누락 감지"
    rollback_action:
      - "Datadog → 백업 수집 (CloudWatch로 자동 전환)"
      - "메트릭 수집 에이전트 재배포"
      - "CloudWatch 로그에서 메트릭 복원"
    recovery_time: "< 30분"
  
  scenario_2_false_alerts:
    name: "과도한 거짓 경보"
    trigger: "> 10% 거짓 경보율 (Dry Run 대비)"
    rollback_action:
      - "알림 규칙 민감도 조정 (임계값 상향)"
      - "거짓 경보 원인 분석 (배포, 테스트 등)"
      - "필터링 규칙 추가 (특정 시간대, 프로젝트 제외)"
    recovery_time: "< 2시간"
  
  scenario_3_total_failure:
    name: "모니터링 시스템 완전 장애"
    trigger: "Datadog/CloudWatch 모두 먹통"
    rollback_action:
      - "Slack/Telegram 수동 알림으로 전환"
      - "기존 모니터링 (Vercel, GitHub) 재활성화"
      - "DevOps Engineer 24시간 대기"
    recovery_time: "< 10분"
```

---

## 📞 Support & Contact

```yaml
support_channels:
  
  regular_hours_moninc:
    timezone: "Asia/Seoul (KST)"
    on_call: "Monday-Sunday 09:00-18:00"
    contact: "@DevOps Engineer"
    channel: "#oncall-rotation"
    response_sla: "30 minutes"
  
  critical_incident:
    contact: "CEO 나경태 (Telegram)"
    response_sla: "5 minutes"
    escalation: "Slack #기술 → Telegram → Phone call"
  
  questions:
    documentation: "대시보드 가이드 + Runbook"
    training: "모든 팀원이 교육 수료"
    feedback: "Discord #monitoring-feedback"
```

---

**Phase 2 Implementation Timeline 완성**  
**작성자:** DevOps Engineer AI (Phase C #12)  
**작성일:** 2026-05-29  
**다음 단계:** CEO 승인 후 2026-06-01 구현 시작
