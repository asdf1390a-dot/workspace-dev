---
name: Infrastructure Monitoring & Observability System Architecture
description: Complete monitoring + alerting system for DSC FMS + 8-project AI team ecosystem (15 agents, 8 projects, multi-service infrastructure)
type: design
date: 2026-05-27
owner: DevOps Engineer AI Agent (Phase C #12, 60% capacity)
mentor: Automation-Specialist AI Agent
timeline: 2026-05-27 ~ 2026-06-05 18:00 KST (8 days)
eta_design: 2026-05-30 18:00 KST
eta_implementation: 2026-06-05 18:00 KST
---

# 인프라 모니터링 & 옵저버빌리티 시스템 설계 (2026-05-27)

## 📋 Executive Summary

**목표:** DSC FMS 포털 + 8-프로젝트 AI 팀(15명, 14 AI 에이전트) 생태계에 대한 실시간 통합 모니터링 + 자동 알림 시스템 구축

**범위:**
- API 응답시간 + 에러율 (8개 프로젝트 API)
- Supabase DB 성능 (쿼리, 연결, 복제 지연)
- Vercel 배포 상태 + 빌드 타임
- 메모리 사용량 + Cron 작업 헬스
- 팀 용량 활용도 (실시간, 8/15 → 14/15 예상)
- 서브에이전트 작업 상태 (Phase A/B/C 동시 실행)
- 알림 규칙 + SLA 위반

**프레임워크:** Datadog APM + Logs + Metrics + Synthetics
**알림:** Slack + Telegram (CEO 나경태 직접)
**대시보드:** Grafana + Datadog custom dashboards
**인프라:** Vercel (Next.js), Supabase (PostgreSQL), GitHub Actions (CI/CD), OpenClaw (Cron/세션 관리)

---

## 🏗️ 1. 아키텍처 개요

### 1.1 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│         MONITORING & OBSERVABILITY SYSTEM                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  DATADOG AGENT (APM, Metrics, Logs)              │  │
│  │  ├─ APM Tracing (API latency, errors)            │  │
│  │  ├─ Metrics Collection (CPU, memory, disk)       │  │
│  │  └─ Log Aggregation (structured JSON)            │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  DATA COLLECTION LAYER                            │  │
│  │  ├─ Vercel API (deployments, builds)             │  │
│  │  ├─ Supabase API (database metrics)              │  │
│  │  ├─ GitHub API (CI/CD status)                    │  │
│  │  ├─ OpenClaw Cron API (job health)               │  │
│  │  └─ Custom Metrics Exporters (team capacity)     │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PROCESSING & AGGREGATION                        │  │
│  │  ├─ Real-time metric aggregation                 │  │
│  │  ├─ Custom anomaly detection                     │  │
│  │  ├─ SLA threshold calculation                    │  │
│  │  └─ Team capacity scoring                        │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ALERT GENERATION & ROUTING                      │  │
│  │  ├─ Critical (Telegram to CEO 즉시)             │  │
│  │  ├─ Warning (Slack #일반채널)                  │  │
│  │  ├─ Info (Discord #기술 로그)                 │  │
│  │  └─ Escalation (multi-channel, delay-based)      │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  DASHBOARDS                                      │  │
│  │  ├─ Grafana: Operations & Architecture           │  │
│  │  ├─ Datadog: APM & Real-time metrics             │  │
│  │  ├─ Custom: Team Capacity + Project Progress     │  │
│  │  └─ Custom: Service Health Matrix                │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ON-CALL RESPONSE                                │  │
│  │  ├─ Runbooks (팀별 troubleshooting)              │  │
│  │  ├─ Escalation procedures                        │  │
│  │  └─ Post-mortem templates                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 데이터 흐름 (Data Flow)

```
[Services]
  ├─ Vercel (Next.js app, deployments)
  │  └─ Datadog APM tracer → http request events
  ├─ Supabase (PostgreSQL, RLS, realtime)
  │  └─ Custom metrics exporter → connection pool, query stats
  ├─ GitHub (CI/CD workflows)
  │  └─ Webhook → build status events
  ├─ OpenClaw (Cron jobs, sessions)
  │  └─ Health check API → job state, execution time
  └─ Custom Services (Discord Bot, Memory Automation)
     └─ Custom instrumentation → business metrics

         ↓ [Collection]
         
[Datadog Agent]
  ├─ APM Tracing (trace.dd.json format)
  ├─ Metrics (statsd, custom dogstatsd)
  └─ Logs (JSON structured logs)

         ↓ [Aggregation]
         
[Datadog SaaS Platform]
  ├─ Metric storage (time-series DB)
  ├─ Trace storage (APM backend)
  ├─ Log storage (hot/cold storage)
  └─ Alert evaluation engine

         ↓ [Processing & Alerting]
         
[Alert Generation]
  ├─ Metric-based alerts (threshold)
  ├─ Anomaly detection
  ├─ Composite monitors (multiple conditions)
  └─ Custom metric calculations

         ↓ [Delivery]
         
[Multi-channel Notification]
  ├─ Telegram (critical, immediate)
  ├─ Slack (warning, info)
  ├─ Discord (logs, info)
  ├─ Grafana alerts (visualization)
  └─ Dashboard updates (real-time)
```

---

## 📊 2. 메트릭 정의 (Metrics Schema)

### 2.1 API & 서비스 성능 메트릭

#### 2.1.1 응답 시간 (Response Time)

| 메트릭 | 정의 | 임계값 (Warning/Critical) | 계산 |
|--------|------|--------------------------|------|
| `api.latency.p50` | 중앙값 응답시간 | 200ms / 500ms | percentile(50) of request duration |
| `api.latency.p99` | 99 백분위 응답시간 | 1s / 3s | percentile(99) of request duration |
| `api.latency.max` | 최대 응답시간 | 2s / 10s | max of request duration |
| `api.request.count` | 요청 건수/분 | N/A | rate(count) |
| `api.error.rate` | 에러율 (4xx, 5xx) | 2% / 5% | count(status:5xx) / count(*) × 100 |

#### 2.1.2 에러율 & 복구력 (Error Rate & Resilience)

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `api.errors.5xx.rate` | 서버 에러율 | 1% / 5% | count(status:5xx) / count(*) × 100 |
| `api.errors.4xx.rate` | 클라이언트 에러율 | 10% / 20% | count(status:4xx) / count(*) × 100 |
| `api.errors.timeout.count` | 타임아웃 발생 | 5/min / 20/min | count(error_type:timeout) |
| `api.circuit.breaker.trips` | Circuit Breaker 작동 | 1/5min / 3/5min | count(event:circuit_breaker_open) |
| `api.recovery.time.avg` | 평균 복구시간 | 5min / 15min | avg(recovery_duration) |

#### 2.1.3 처리량 (Throughput)

| 메트릭 | 정의 | 임계값 | 용도 |
|--------|------|--------|------|
| `api.rps` | 초당 요청 수 | 100 RPS / 500 RPS | 용량 계획 |
| `api.throughput.mbps` | 초당 처리 데이터량 | 10 Mbps / 50 Mbps | 대역폭 모니터링 |
| `api.concurrent.connections` | 동시 연결 수 | 500 / 2000 | 리소스 활용 |

---

### 2.2 데이터베이스 메트릭 (Supabase PostgreSQL)

#### 2.2.1 쿼리 성능

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `db.query.duration.p95` | 95 백분위 쿼리 시간 | 100ms / 500ms | percentile(95) of query duration |
| `db.query.count.slow` | 느린 쿼리 개수 (>1s) | 10/min / 50/min | count(duration > 1000) |
| `db.query.throughput` | 초당 쿼리 수 | 1000 qps / 5000 qps | rate(query_count) |
| `db.prepared.statements` | prepared statement 캐시율 | >80% | cache_hits / (cache_hits + cache_misses) |
| `db.index.usage.efficiency` | 인덱스 활용율 | >85% | indexed_scans / total_scans |

#### 2.2.2 연결 풀 & 리소스

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `db.connections.active` | 활성 연결 수 | 80% / 95% of max | count(state=active) |
| `db.connections.idle` | 유휴 연결 수 | >50% | count(state=idle) |
| `db.connections.wait.time` | 연결 획득 대기시간 | 100ms / 500ms | avg(connection_acquire_duration) |
| `db.connection.pool.utilization` | 연결 풀 사용률 | 70% / 90% | active_connections / max_connections × 100 |
| `db.transaction.rollback.rate` | 트랜잭션 롤백율 | 1% / 5% | count(rollback) / count(transaction) × 100 |

#### 2.2.3 스토리지 & 복제

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `db.storage.size.gb` | DB 용량 | 80% / 95% of quota | total_bytes / (1024^3) |
| `db.replication.lag.ms` | 복제 지연 | 1000ms / 5000ms | max(replica_lag) |
| `db.wal.disk.used.mb` | WAL 파일 사용 | 80% / 95% | wal_size_bytes / (1024^2) |
| `db.backup.duration.min` | 백업 소요 시간 | 30min / 60min | duration of backup job |
| `db.backup.success.rate` | 백업 성공률 | >99% | successful_backups / total_backups × 100 |

---

### 2.3 배포 & CI/CD 메트릭 (Vercel + GitHub Actions)

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `deployment.build.duration.min` | 빌드 소요시간 | 10min / 20min | duration from start to completion |
| `deployment.build.success.rate` | 빌드 성공률 | 95% / 90% | successful_builds / total_builds |
| `deployment.time.to.live.min` | 배포까지 걸린 시간 | 15min / 30min | from trigger to production live |
| `deployment.rollback.count` | 롤백 발생 횟수 | 0 / 1 per day | count(rollback events) |
| `ci.workflow.duration.min` | CI/CD 파이프라인 시간 | 25min / 45min | end-to-end pipeline duration |
| `ci.test.coverage.pct` | 테스트 커버리지 | >90% | lines_covered / total_lines × 100 |
| `ci.lint.errors.count` | Lint 에러 개수 | 0 / <5 | count(lint violations) |

---

### 2.4 팀 용량 & 프로젝트 메트릭

#### 2.4.1 팀 활용도 (Team Utilization)

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `team.agents.active` | 활성 에이전트 수 | 8/15 (now) → 14/15 (goal) | count(agent.status=active) |
| `team.agents.blocked` | 블로킹된 에이전트 수 | 0-1 / >2 | count(agent.status=blocked) |
| `team.capacity.utilization.pct` | 팀 용량 활용도 | 93.3% (goal) | allocated_capacity / total_capacity × 100 |
| `team.phase.progress.pct` | Phase 진행도 | Track all 3 phases | completed_tasks / total_tasks × 100 |
| `team.context.loss.count` | 컨텍스트 손실 발생 | 0 / >1 | count(context_loss_events) |
| `team.response.time.avg` | 팀 평균 응답시간 | <5min / <10min | avg(task_start_latency) |

#### 2.4.2 프로젝트 진행도 (Project Progress)

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `project.completion.rate.pct` | 프로젝트 완료율 | 7/8 projects > 70% | (sum of completed_tasks) / (sum of total_tasks) × 100 |
| `project.deadline.days.remaining` | 마감까지 남은 일수 | >2 days / <1 day | (deadline - now).days |
| `project.blocker.count` | 블로킹 항목 개수 | 0-1 / >2 | count(status=blocked) |
| `project.scope.change.count` | 스코프 변경 횟수 | 0 / >1 per day | count(scope_change_events) |
| `project.rework.rate.pct` | 재작업율 | <5% / >10% | rework_items / total_items × 100 |

#### 2.4.3 서브에이전트 상태 (Subagent Health)

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `subagent.spawn.success.rate` | Spawn 성공률 | 100% / 90% | successful_spawns / total_spawns × 100 |
| `subagent.execution.duration.min` | 실행 소요시간 | 60min / 120min | from spawn to completion |
| `subagent.context.usage.pct` | 컨텍스트 창 사용률 | <80% / >90% | used_tokens / max_tokens × 100 |
| `subagent.task.completion.rate` | 작업 완료율 | 100% / 95% | completed_tasks / assigned_tasks × 100 |
| `subagent.error.rate` | 에러 발생률 | 0 / <2% | count(errors) / count(executions) × 100 |

---

### 2.5 보조 서비스 메트릭

#### 2.5.1 Cron & 스케줄 작업

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `cron.job.execution.duration.sec` | Cron 실행 소요시간 | 5s / 15s | job_end_time - job_start_time |
| `cron.job.success.rate` | Cron 성공률 | 100% / 95% | successful_executions / total_executions |
| `cron.job.delay.sec` | Cron 지연시간 | 0s / >60s | actual_start_time - scheduled_start_time |
| `cron.job.backlog.count` | 미실행 Cron 작업 | 0 / >1 | count(status=pending) |

#### 2.5.2 메모리 & 리소스

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `memory.usage.pct` | 메모리 사용률 | 70% / 90% | used_memory / total_memory × 100 |
| `memory.heap.size.mb` | Heap 크기 | 512MB / 1024MB | heap_size_bytes / (1024^2) |
| `memory.context.window.usage.pct` | 컨텍스트 창 사용률 | 70% / 90% | used_tokens / max_tokens × 100 |
| `cpu.usage.pct` | CPU 사용률 | 60% / 85% | cpu_time / total_time × 100 |
| `disk.io.latency.ms` | 디스크 I/O 지연 | 10ms / 50ms | avg(io_duration) |

#### 2.5.3 메시징 & 통신

| 메트릭 | 정의 | 임계값 | 계산 |
|--------|------|--------|------|
| `messaging.telegram.delivery.rate` | Telegram 메시지 전달율 | 100% / 99% | delivered_messages / sent_messages × 100 |
| `messaging.telegram.latency.sec` | Telegram 지연 | <5s / <10s | delivery_time - send_time |
| `messaging.slack.delivery.rate` | Slack 메시지 전달율 | 100% / 99% | delivered_messages / sent_messages × 100 |
| `messaging.discord.delivery.rate` | Discord 메시지 전달율 | 100% / 99% | delivered_messages / sent_messages × 100 |
| `messaging.alert.delivery.time.sec` | 알림 배달 시간 | <30s / <60s | alert_delivery_time - alert_trigger_time |

---

## 🚨 3. 알림 규칙 (Alert Rules & Thresholds)

### 3.1 Critical Alerts (즉시 알림, Telegram)

#### 3.1.1 API 에러

```yaml
name: "API Error Rate Critical (>5%)"
condition: api.errors.5xx.rate > 5
duration: 5 minutes
severity: CRITICAL
channel: telegram
recipient: CEO (나경태)
message: |
  🚨 CRITICAL: API Server Error Rate > 5%
  - Current: {{value}}%
  - Service: {{service}}
  - Affected: {{impact_count}} requests
  - Action: Check error logs, restart if needed
escalation: After 10min without resolution → call on-call engineer
```

#### 3.1.2 데이터베이스 다운

```yaml
name: "Database Unavailable"
condition: db.health.status == DOWN
duration: 1 minute
severity: CRITICAL
channel: telegram
recipient: CEO (나경태)
message: |
  🚨 CRITICAL: Database UNAVAILABLE
  - Service: Supabase PostgreSQL
  - Status: {{status}}
  - Last heartbeat: {{last_heartbeat}}
  - Action: Check Supabase dashboard, verify network connectivity
escalation: Immediate on-call engineer page + CEO notification
```

#### 3.1.3 배포 실패

```yaml
name: "Deployment Pipeline Failure"
condition: deployment.build.success_rate < 0
duration: 1 minute
severity: CRITICAL
channel: telegram
recipient: CEO (나경태)
message: |
  🚨 CRITICAL: Deployment FAILED
  - Build: {{build_id}}
  - Project: {{project_name}}
  - Error: {{failure_reason}}
  - Action: Check CI/CD logs, revert if needed
escalation: Immediate notification to Web-Builder team
```

#### 3.1.4 Cron 작업 치명 실패

```yaml
name: "Critical Cron Job Failure (>1 failure)"
condition: cron.job.success_rate < 50 AND duration("5 minutes")
severity: CRITICAL
channel: telegram
recipient: CEO (나경태)
message: |
  🚨 CRITICAL: Cron Job Failure
  - Job: {{job_name}}
  - Failures: {{failure_count}} / {{total_count}}
  - Last error: {{error_message}}
  - Action: Check Automation-Specialist, restart job
escalation: After 5min → page on-call Automation-Specialist
```

---

### 3.2 High Priority Alerts (경고, Slack #일반)

#### 3.2.1 API 응답 지연

```yaml
name: "API Latency High (p99 > 1s)"
condition: api.latency.p99 > 1000
duration: 2 minutes
severity: WARNING
channel: slack
channel_name: "#일반"
message: |
  ⚠️ WARNING: API Response Latency High
  - P99 Latency: {{value}}ms (threshold: 1000ms)
  - Service: {{service}}
  - Affected: {{impact_count}} requests
  - Recommendation: Check database load, scale if needed
```

#### 3.2.2 DB 연결 풀 부족

```yaml
name: "Database Connection Pool Exhausted (>90%)"
condition: db.connection.pool.utilization > 90
duration: 1 minute
severity: WARNING
channel: slack
channel_name: "#일반"
message: |
  ⚠️ WARNING: DB Connection Pool Near Exhaustion
  - Utilization: {{value}}%
  - Active: {{active_connections}} / {{max_connections}}
  - Wait time: {{connection_wait_time}}ms
  - Action: Check for connection leaks, increase pool size
```

#### 3.2.3 느린 쿼리 증가

```yaml
name: "Slow Queries Increase (>20/min)"
condition: db.query.count.slow > 20
duration: 3 minutes
severity: WARNING
channel: slack
channel_name: "#일般"
message: |
  ⚠️ WARNING: Slow Queries Detected
  - Count: {{value}} queries > 1s
  - Top slow query: {{top_query}}
  - Recommendation: Review query plans, add indexes
```

#### 3.2.4 빌드 시간 증가

```yaml
name: "Build Time Increased (>20min)"
condition: deployment.build.duration > 1200
duration: 1 occurrence
severity: WARNING
channel: slack
channel_name: "#일반"
message: |
  ⚠️ WARNING: Build Time Increased
  - Duration: {{value}}min (threshold: 20min)
  - Project: {{project_name}}
  - Recommendation: Check build logs, optimize dependencies
```

#### 3.2.5 팀 에이전트 블로킹

```yaml
name: "Team Agent Blocked (>1 agent)"
condition: team.agents.blocked > 1
duration: 10 minutes
severity: WARNING
channel: slack
channel_name: "#일반"
message: |
  ⚠️ WARNING: Team Agent(s) Blocked
  - Count: {{count}} agents
  - Blocked agents: {{agent_names}}
  - Duration: {{blocked_duration}}min
  - Action: Resolve blockers, unblock agents
```

---

### 3.3 Info Alerts (정보, Discord #기술)

#### 3.3.1 배포 완료

```yaml
name: "Deployment Successful"
condition: deployment.status == SUCCESS
duration: 0 (instant)
severity: INFO
channel: discord
channel_name: "#기술"
message: |
  ✅ Deployment Successful
  - Project: {{project_name}}
  - Commit: {{commit_hash}}
  - Build time: {{build_duration}}min
  - Deployed at: {{deploy_time}}
```

#### 3.3.2 프로젝트 마일스톤 달성

```yaml
name: "Project Milestone Reached"
condition: project.completion.rate > target_rate
duration: 0 (instant)
severity: INFO
channel: discord
channel_name: "#기술"
message: |
  🎉 Project Milestone Reached
  - Project: {{project_name}}
  - Completion: {{completion_rate}}%
  - Status: {{milestone_name}}
  - Team: {{assigned_agents}}
```

#### 3.3.3 정기 상태 보고

```yaml
name: "Daily Health Report"
condition: scheduled("daily 08:00 KST")
severity: INFO
channel: discord
channel_name: "#기술"
message: |
  📊 Daily Health Report ({{date}})
  
  **System Health:**
  - API Availability: {{api_uptime}}%
  - DB Uptime: {{db_uptime}}%
  - Deployment Success: {{deploy_success}}%
  
  **Team Status:**
  - Active agents: {{active_agents}}/15
  - Team utilization: {{utilization}}%
  - Blocked agents: {{blocked_count}}
  
  **Projects (7/8):**
  - Completed: {{completed_count}}
  - In-progress: {{in_progress_count}}
  - Blocked: {{blocked_count}}
  
  **Key Metrics:**
  - API P99: {{api_p99}}ms
  - DB Query P95: {{db_query_p95}}ms
  - Cron success: {{cron_success}}%
```

---

### 3.4 Escalation Rules (에스컬레이션)

```yaml
escalation_rules:
  - level: 1
    condition: CRITICAL alert raised
    wait_time: 5 minutes
    action: "Page on-call engineer (team-specific)"
  
  - level: 2
    condition: CRITICAL alert NOT resolved after 5 minutes
    wait_time: 5 minutes
    action: "Notify CEO + manager of affected team"
  
  - level: 3
    condition: Multiple CRITICAL alerts OR service DOWN >30 minutes
    wait_time: immediate
    action: "Trigger incident response (war room, post-mortem)"
  
  - level: 4
    condition: Data loss OR security breach
    wait_time: immediate
    action: "Emergency response + legal notification"
```

---

## 📈 4. 대시보드 설계 (Dashboard Specifications)

### 4.1 Operations Dashboard (Grafana)

**목적:** 실시간 시스템 상태 모니터링, SLA 추적, 리소스 활용도

**구성 (4개 섹션):**

#### 4.1.1 Service Health Overview
```json
{
  "title": "Service Health Matrix",
  "type": "heatmap",
  "metrics": [
    "api.availability.pct",
    "db.uptime.pct",
    "deployment.success.rate",
    "cron.job.success.rate",
    "messaging.delivery.rate"
  ],
  "refresh": "30s",
  "thresholds": {
    "green": ">99%",
    "yellow": "95-99%",
    "red": "<95%"
  }
}
```

#### 4.1.2 API Performance
```json
{
  "title": "API Response Time & Error Rate",
  "type": "graph",
  "rows": 2,
  "panels": [
    {
      "title": "Latency (ms) - P50/P95/P99",
      "metric": ["api.latency.p50", "api.latency.p95", "api.latency.p99"],
      "type": "line",
      "y_axis": "latency_ms"
    },
    {
      "title": "Error Rate by Service",
      "metric": "api.error.rate",
      "type": "bar",
      "dimensions": ["service", "error_type"],
      "y_axis": "error_rate_pct"
    }
  ],
  "refresh": "1m"
}
```

#### 4.1.3 Database Performance
```json
{
  "title": "Database Health",
  "type": "grid",
  "panels": [
    {
      "title": "Query Performance",
      "metrics": ["db.query.duration.p95", "db.query.count.slow"],
      "type": "graph"
    },
    {
      "title": "Connection Pool Utilization",
      "metric": "db.connection.pool.utilization",
      "type": "gauge",
      "threshold": [
        {"value": 70, "color": "green"},
        {"value": 90, "color": "yellow"},
        {"value": 100, "color": "red"}
      ]
    },
    {
      "title": "Replication Lag",
      "metric": "db.replication.lag.ms",
      "type": "line",
      "threshold": 1000
    },
    {
      "title": "Storage Usage",
      "metric": "db.storage.size.gb",
      "type": "gauge",
      "max": "storage_quota_gb"
    }
  ],
  "refresh": "1m"
}
```

#### 4.1.4 Deployment & CI/CD Pipeline
```json
{
  "title": "Build & Deployment Pipeline",
  "type": "grid",
  "panels": [
    {
      "title": "Build Success Rate (7-day)",
      "metric": "deployment.build.success.rate",
      "type": "stat",
      "format": "percent"
    },
    {
      "title": "Build Duration Trend",
      "metric": "deployment.build.duration.min",
      "type": "line",
      "threshold": 20
    },
    {
      "title": "Time to Production",
      "metric": "deployment.time.to.live.min",
      "type": "line",
      "threshold": 30
    },
    {
      "title": "Active Deployments",
      "metric": "deployment.active.count",
      "type": "stat"
    }
  ],
  "refresh": "2m"
}
```

### 4.2 Team Capacity Dashboard (Custom)

**목적:** 팀 활용도, 프로젝트 진행도, 에이전트 상태 실시간 추적

```json
{
  "title": "Team Capacity & Project Status",
  "refresh": "5m",
  "sections": [
    {
      "title": "Team Utilization",
      "type": "gauge",
      "metric": "team.capacity.utilization.pct",
      "current": "8/15 agents (53.3%)",
      "target": "14/15 agents (93.3% by 2026-06-10)",
      "current_value": 53.3,
      "max_value": 100
    },
    {
      "title": "Active Agents",
      "type": "table",
      "data": [
        {"agent": "Secretary", "status": "active", "capacity": "100%", "projects": "CTB, coordination"},
        {"agent": "Web-Builder #1", "status": "active", "capacity": "40%", "projects": "Team Dashboard, Asset Master"},
        {"agent": "Evaluator", "status": "active", "capacity": "60%", "projects": "QA, compliance audit"},
        {"agent": "Data-Analyst #2", "status": "active", "capacity": "25%", "projects": "Asset Master data analysis"},
        {"agent": "Automation-Specialist", "status": "active", "capacity": "31%", "projects": "Memory Automation Phase 2"},
        {"agent": "Translator", "status": "active", "capacity": "25%", "projects": "Documentation"},
        {"agent": "Design-Specialist", "status": "active", "capacity": "50%", "projects": "Team Dashboard Phase 2 UI"},
        {"agent": "DevOps Engineer", "status": "active", "capacity": "60%", "projects": "Infrastructure monitoring"}
      ]
    },
    {
      "title": "Project Progress (7/8)",
      "type": "bar_horizontal",
      "data": [
        {"project": "Discord Bot Phase 1", "status": "✅ Complete", "progress": "100%"},
        {"project": "Harness ENG Phase 1", "status": "✅ Complete", "progress": "100%"},
        {"project": "Travel Management Phase 2", "status": "✅ Complete", "progress": "100%"},
        {"project": "Business Module Phase 1", "status": "✅ Complete", "progress": "100%"},
        {"project": "Asset Master Phase 2", "status": "✅ Complete", "progress": "100%"},
        {"project": "Team Dashboard Phase 2", "status": "🟡 In-progress", "progress": "75%"},
        {"project": "Backup Phase 2", "status": "🟡 In-progress", "progress": "30%"},
        {"project": "Memory Automation Phase 2", "status": "🟡 In-progress", "progress": "60%"}
      ]
    },
    {
      "title": "Blocked Agents & Blockers",
      "type": "table",
      "data": [
        {"agent": "Memory Automation", "blocker": "Phase 2C/2D/2E critical dependencies", "status": "resolved", "wait_time": "0min"},
        {"agent": "Team Dashboard", "blocker": "db/36 migration execution", "status": "resolved", "wait_time": "0min"},
        {"agent": "Asset Master Phase 2", "blocker": "db/29 migration execution", "status": "pending", "wait_time": ">72h"}
      ]
    }
  ]
}
```

### 4.3 SLA & Availability Dashboard

```json
{
  "title": "SLA Compliance & Availability",
  "refresh": "5m",
  "panels": [
    {
      "title": "API Availability SLA (Target: 99.9%)",
      "metric": "api.availability.sla.pct",
      "type": "gauge",
      "thresholds": [
        {"value": 99.9, "color": "green", "label": "✅ Met"},
        {"value": 99.0, "color": "yellow", "label": "⚠️ At Risk"},
        {"value": 0, "color": "red", "label": "❌ Breached"}
      ]
    },
    {
      "title": "Database Uptime SLA (Target: 99.95%)",
      "metric": "db.uptime.sla.pct",
      "type": "gauge"
    },
    {
      "title": "Incident History (7-day)",
      "type": "table",
      "data": [
        {
          "date": "2026-05-27",
          "severity": "CRITICAL",
          "service": "Supabase",
          "duration": "15min",
          "resolution": "Auto-failover",
          "impact": "15 affected requests"
        }
      ]
    },
    {
      "title": "MTTR (Mean Time To Resolution)",
      "metric": "incident.mttr.minutes",
      "type": "stat",
      "target": "<30 minutes"
    }
  ]
}
```

### 4.4 Datadog APM Dashboard

```json
{
  "title": "Datadog APM - Service Performance",
  "refresh": "1m",
  "services": [
    {
      "service": "dsc-fms-portal",
      "metrics": {
        "apm.requests": "5,234 req/min",
        "apm.latency.p99": "345ms",
        "apm.error.rate": "0.12%",
        "apm.throughput": "8.2 Mbps"
      }
    },
    {
      "service": "asset-master-api",
      "metrics": {
        "apm.requests": "1,234 req/min",
        "apm.latency.p99": "234ms",
        "apm.error.rate": "0.05%"
      }
    },
    {
      "service": "discord-bot",
      "metrics": {
        "apm.requests": "234 req/min",
        "apm.latency.p99": "567ms",
        "apm.error.rate": "0.01%"
      }
    }
  ]
}
```

---

## 🔧 5. Infrastructure as Code (IaC) 스펙

### 5.1 Terraform Configuration (terraform/monitoring/)

#### 5.1.1 Datadog Provider Configuration

```hcl
# terraform/monitoring/datadog_provider.tf

terraform {
  required_providers {
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.34"
    }
  }
}

provider "datadog" {
  api_key = var.datadog_api_key
  app_key = var.datadog_app_key
  api_url = "https://api.datadoghq.com"  # Use EU endpoint if needed
}
```

#### 5.1.2 Monitor Resources (Alerts)

```hcl
# terraform/monitoring/monitors.tf

# Critical: API Error Rate
resource "datadog_monitor" "api_error_rate_critical" {
  name            = "API Error Rate Critical (>5%)"
  type            = "metric alert"
  query           = "avg(last_5m):avg:trace.web.request.errors{service:dsc-fms-portal} / avg:trace.web.request.hits{service:dsc-fms-portal} * 100 > 5"
  
  thresholds = {
    critical = 5
    warning  = 2
  }
  
  notify_no_data        = false
  require_full_window   = true
  evaluation_delay      = 300
  
  notification_preset_name = "hide_handle"
}

# Warning: API Latency
resource "datadog_monitor" "api_latency_warning" {
  name  = "API Latency High (p99 > 1s)"
  type  = "metric alert"
  query = "avg(last_5m):percentile:trace.web.request.duration{service:dsc-fms-portal}:p99 > 1000"
  
  thresholds = {
    critical = 3000
    warning  = 1000
  }
}

# Critical: Database Down
resource "datadog_monitor" "database_down" {
  name  = "Database Unavailable"
  type  = "metric alert"
  query = "avg(last_2m):avg:postgresql.connections{service:supabase} == 0"
  
  thresholds = {
    critical = 0
  }
}
```

#### 5.1.3 Dashboard Resources

```hcl
# terraform/monitoring/dashboards.tf

resource "datadog_dashboard" "operations" {
  title        = "Operations Dashboard - Service Health"
  layout_type  = "ordered"
  is_read_only = false

  widget {
    type = "timeseries"
    query {
      metric_query {
        query = "avg:trace.web.request.duration{service:*}"
      }
    }
    title = "API Response Time (All Services)"
  }

  widget {
    type = "heatmap"
    query {
      metric_query {
        query = "avg:trace.web.request.errors{service:*} by {service}"
      }
    }
    title = "Error Rate by Service"
  }

  widget {
    type = "gauge"
    query {
      metric_query {
        query = "avg:postgresql.connections.active{service:supabase} / avg:postgresql.max_connections{service:supabase} * 100"
      }
    }
    title = "Database Connection Pool Utilization"
  }
}
```

#### 5.1.4 Custom Metrics Export

```hcl
# terraform/monitoring/custom_metrics.tf

# Team capacity utilization metric
resource "datadog_dashboard" "team_capacity" {
  title = "Team Capacity & Utilization"
  
  widget {
    type = "gauge"
    query {
      custom_query {
        name = "team.capacity.utilization"
        # Will be populated by custom exporter script
      }
    }
    title = "Team Capacity (8/15 agents)"
  }
}
```

### 5.2 CloudFormation for AWS Services (Optional)

```yaml
# cloudformation/monitoring.yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: 'Monitoring infrastructure for DSC FMS + 8-project ecosystem'

Resources:
  # CloudWatch Log Group for centralized logging
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /dsc-fms/application
      RetentionInDays: 30

  # CloudWatch Metric Alarm for Vercel deployments
  VercelDeploymentFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: "Vercel Deployment Failure"
      MetricName: "DeploymentFailures"
      Namespace: "DSC/Vercel"
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SNSTopic

  # SNS Topic for notifications
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: "DSC FMS Monitoring Alerts"
      TopicName: "dsc-fms-alerts"
```

---

## 🔔 6. 알림 채널 구성 (Notification Channels)

### 6.1 Telegram Integration

```python
# scripts/monitoring/telegram_alerter.py

import os
import requests
from datetime import datetime

class TelegramAlerter:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CEO_CHAT_ID")
        self.base_url = f"https://api.telegram.org/bot{self.token}"
    
    def send_critical_alert(self, alert_data):
        """Send CRITICAL alert to CEO immediately"""
        message = self._format_critical_alert(alert_data)
        response = requests.post(
            f"{self.base_url}/sendMessage",
            json={
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": "HTML"
            }
        )
        return response.status_code == 200
    
    def _format_critical_alert(self, alert):
        return f"""
🚨 <b>CRITICAL ALERT</b>

<b>Service:</b> {alert['service']}
<b>Severity:</b> {alert['severity']}
<b>Message:</b> {alert['message']}
<b>Value:</b> {alert['value']}
<b>Threshold:</b> {alert['threshold']}
<b>Time:</b> {datetime.now().isoformat()}

<b>Action Required:</b> {alert['action']}
        """

# Usage
alerter = TelegramAlerter()
alerter.send_critical_alert({
    "service": "API Server",
    "severity": "CRITICAL",
    "message": "Error rate > 5%",
    "value": "7.2%",
    "threshold": "5%",
    "action": "Check error logs, restart if needed"
})
```

### 6.2 Slack Integration

```python
# scripts/monitoring/slack_alerter.py

import os
import requests
from slack_sdk import WebClient

class SlackAlerter:
    def __init__(self):
        self.client = WebClient(token=os.getenv("SLACK_BOT_TOKEN"))
        self.channel = "#일반"
    
    def send_warning_alert(self, alert_data):
        """Send WARNING alert to Slack #일반 channel"""
        blocks = self._build_slack_blocks(alert_data)
        response = self.client.chat_postMessage(
            channel=self.channel,
            blocks=blocks
        )
        return response["ok"]
    
    def _build_slack_blocks(self, alert):
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"⚠️ {alert['title']}"
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Service:*\n{alert['service']}"},
                    {"type": "mrkdwn", "text": f"*Severity:*\n{alert['severity']}"},
                    {"type": "mrkdwn", "text": f"*Value:*\n{alert['value']}"},
                    {"type": "mrkdwn", "text": f"*Threshold:*\n{alert['threshold']}"}
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Message:*\n{alert['message']}"
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "View Dashboard"},
                        "url": alert['dashboard_url']
                    }
                ]
            }
        ]
```

### 6.3 Discord Integration

```python
# scripts/monitoring/discord_alerter.py

import os
import discord
from datetime import datetime

class DiscordAlerter:
    def __init__(self):
        self.token = os.getenv("DISCORD_BOT_TOKEN")
        self.channel_id = os.getenv("DISCORD_TECH_CHANNEL_ID")
        self.client = discord.Client(intents=discord.Intents.default())
    
    async def send_info_log(self, alert_data):
        """Send INFO log to Discord #기술 channel"""
        channel = self.client.get_channel(int(self.channel_id))
        embed = self._build_discord_embed(alert_data)
        await channel.send(embed=embed)
    
    def _build_discord_embed(self, alert):
        embed = discord.Embed(
            title=alert['title'],
            description=alert['message'],
            color=discord.Color.blue(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Service", value=alert['service'], inline=True)
        embed.add_field(name="Status", value=alert['status'], inline=True)
        embed.add_field(name="Details", value=alert['details'], inline=False)
        return embed
```

---

## 🚨 7. On-Call 응답 절차 (Runbooks)

### 7.1 API 에러율 증가 (Runbook)

```markdown
## Runbook: API Error Rate Critical (>5%)

**Severity:** CRITICAL
**Alert Trigger:** error_rate > 5% for >5 minutes
**On-Call:** Web-Builder AI Agent
**Escalation:** CEO if not resolved in 10 minutes

### Step 1: Diagnosis (1-2 minutes)
1. [ ] Access Datadog dashboard: `/api/performance`
2. [ ] Check error distribution by error_type (5xx, 4xx, timeout)
3. [ ] Identify affected services: Asset Master, Travel, Discord Bot, etc.
4. [ ] Check recent deployments (last 15 minutes)
5. [ ] Review error logs for patterns
   - Filter: `service:* status:error last(1h)`

### Step 2: Root Cause Analysis (3-5 minutes)
- [ ] Check database connection pool exhaustion
  - Query: `db.connections.active / db.connections.max > 0.9`
- [ ] Check downstream service failures (Supabase, external APIs)
- [ ] Check memory/CPU utilization spikes
- [ ] Review recent code changes/deployments

### Step 3: Immediate Mitigation (2-5 minutes)
**Option A: Restart Service**
- [ ] Get approval from on-call manager
- [ ] Trigger rolling restart: `kubectl rollout restart deployment/dsc-fms-portal`
- [ ] Monitor error rate during restart (should drop within 2 minutes)

**Option B: Scale Service**
- [ ] Increase pod replicas: `kubectl scale deployment/dsc-fms-portal --replicas=5`
- [ ] Monitor traffic distribution and error rate

**Option C: Circuit Breaker**
- [ ] If external API failure: enable circuit breaker
- [ ] Fallback to cached data

**Option D: Rollback**
- [ ] If error started after recent deployment
- [ ] Rollback to previous version: `git revert HEAD`
- [ ] Re-deploy confirmed stable version

### Step 4: Escalation (if not resolved in 10 minutes)
- [ ] Notify CEO (Telegram)
- [ ] Page Automation-Specialist (infrastructure expertise)
- [ ] Create incident ticket
- [ ] Begin post-mortem planning

### Step 5: Verification (5 minutes)
- [ ] Error rate returns to <2%
- [ ] P99 latency returns to normal (<1s)
- [ ] No cascading failures
- [ ] All services responding normally

### Post-Incident
- [ ] Root cause analysis (why did this happen?)
- [ ] Preventive measures (how do we prevent recurrence?)
- [ ] Post-mortem meeting within 24 hours
```

### 7.2 데이터베이스 다운 (Runbook)

```markdown
## Runbook: Database Unavailable

**Severity:** CRITICAL  
**Alert Trigger:** db.health.status == DOWN (sustained >1 minute)
**On-Call:** Automation-Specialist AI Agent + Database Expert
**Escalation:** CEO + All team members immediately

### Step 1: Verify Outage (30 seconds)
1. [ ] Check Supabase dashboard status page
2. [ ] Verify database connectivity:
   ```bash
   psql -h <host> -U <user> -d dsc_fms -c "SELECT 1"
   ```
3. [ ] Check network connectivity from application
4. [ ] Verify VPC/firewall rules

### Step 2: Determine Scope (1-2 minutes)
- [ ] Is entire database down or specific tables?
- [ ] Can any queries execute?
- [ ] Are replicas affected?
- [ ] Check Supabase service status

### Step 3: Mitigation Steps
**Option A: Restart Database Service**
- [ ] Contact Supabase support
- [ ] Request database service restart
- [ ] Monitor recovery time

**Option B: Failover to Replica**
- [ ] Trigger failover: `supabase db failover`
- [ ] Verify replica is now primary
- [ ] Update connection strings

**Option C: Restore from Backup**
- [ ] Determine last clean backup
- [ ] Request point-in-time recovery (PITR)
- [ ] Test restored database
- [ ] Switch traffic to restored instance

### Step 4: Communication
- [ ] Notify CEO immediately (Telegram)
- [ ] Notify all team members (Discord #일반)
- [ ] Update status page every 5 minutes
- [ ] Set escalation timer

### Step 5: Verification
- [ ] Database accepting connections
- [ ] All tables accessible
- [ ] Replication lag < 1 second
- [ ] No data loss
- [ ] Application traffic flowing normally

### Post-Incident
- [ ] Request root cause analysis from Supabase
- [ ] Review backup strategy
- [ ] Test failover procedures
- [ ] Document lessons learned
```

### 7.3 배포 실패 (Runbook)

```markdown
## Runbook: Deployment Pipeline Failure

**Severity:** CRITICAL (blocks all deployments)
**Alert Trigger:** deployment.build.status == FAILED
**On-Call:** Web-Builder AI Agent
**Escalation:** DevOps Engineer if not resolved in 10 minutes

### Step 1: Identify Failure Point (1-2 minutes)
- [ ] Check GitHub Actions logs
- [ ] Identify failed step: lint/test/build/deploy
- [ ] Get error message and stack trace
- [ ] Check which commit triggered failure

### Step 2: Triage by Step
**Lint/Test Failure:**
- [ ] Review error details
- [ ] Is it a flaky test? (retry)
- [ ] Is it a real failure? (fix locally, re-push)

**Build Failure:**
- [ ] Check dependency resolution errors
- [ ] Verify Next.js build logs
- [ ] Check for missing environment variables
- [ ] Review recent dependency updates

**Deploy Failure:**
- [ ] Check Vercel deployment logs
- [ ] Verify environment variables
- [ ] Check for Vercel service issues
- [ ] Verify DNS/routing

### Step 3: Resolution
- [ ] Fix identified issue
- [ ] Push fix to feature branch
- [ ] Re-run pipeline
- [ ] Monitor build through to completion

### Step 4: If Cannot Fix Quickly (>15 minutes)
- [ ] Revert recent changes
- [ ] Trigger rollback to last known good
- [ ] Monitor production stability

### Verification
- [ ] Build succeeds (green checkmark)
- [ ] Deployment completes
- [ ] Health checks pass on production
- [ ] No error rate spike in API metrics
```

---

## 📅 8. Implementation Timeline (2026-05-27 ~ 2026-06-05)

### Phase 1: Architecture & Setup (2026-05-27 ~ 2026-05-30)

| 날짜 | 작업 | 담당 | 목표 |
|------|------|------|------|
| 2026-05-27 | Architecture Design 문서 (1,500+ 줄) | DevOps Engineer | Design complete |
| 2026-05-28 | Datadog account setup + terraform skeleton | DevOps Engineer | IaC repository ready |
| 2026-05-29 | Metric collection agents 배포 | Automation-Specialist | All services instrumented |
| 2026-05-30 | Alert rules + notification channels 설정 | DevOps Engineer | All alerts active |

### Phase 2: Dashboards (2026-05-31 ~ 2026-06-02)

| 날짜 | 작업 | 담당 | 목표 |
|------|------|------|------|
| 2026-05-31 | Grafana dashboards 구성 | DevOps Engineer | Operations dashboard live |
| 2026-06-01 | Team Capacity dashboard 커스터마이제이션 | Data-Analyst | Team dashboard ready |
| 2026-06-02 | Datadog APM dashboard 튜닝 | DevOps Engineer | All dashboards operational |

### Phase 3: Testing & Tuning (2026-06-03 ~ 2026-06-05)

| 날짜 | 작업 | 담당 | 목표 |
|------|------|------|------|
| 2026-06-03 | Alert threshold tuning (production traffic analysis) | DevOps Engineer | False positive rate <2% |
| 2026-06-04 | Runbook testing (simulate incidents) | Evaluator | All runbooks validated |
| 2026-06-05 | Production deployment + monitoring activation | DevOps Engineer | System live, all metrics flowing |

---

## ✅ 9. Success Criteria & Acceptance Metrics

### 9.1 Metric Coverage (목표: 95%)

- [ ] API 메트릭 100% (8개 서비스, latency/error/throughput)
- [ ] DB 메트릭 100% (query/connection/replication)
- [ ] Deployment 메트릭 100% (build/deploy/uptime)
- [ ] Team capacity 메트릭 100% (utilization/progress/blockers)
- [ ] Cron job 메트릭 100% (success rate/duration)
- [ ] Total coverage: ≥95%

### 9.2 Alert Latency (목표: <30 seconds)

- [ ] Alert generation: <5 seconds from metric threshold breach
- [ ] Notification delivery: <10 seconds (Telegram/Slack)
- [ ] Dashboard update: <30 seconds
- [ ] On-call notification: <30 seconds from alert generation
- **Total E2E: <30 seconds**

### 9.3 Dashboard Update Intervals (목표: <5 minutes)

- [ ] Grafana real-time panels: 30-second refresh
- [ ] Datadog APM: 1-minute refresh
- [ ] Team capacity custom dashboard: 5-minute refresh
- [ ] All dashboards: data not older than 5 minutes

### 9.4 False Positive Alert Rate (목표: 0%)

- [ ] No more than 1-2 false positives per day (from 1000+ alerts)
- [ ] False positive rate: <0.2%
- [ ] Threshold tuning completes by 2026-06-03

### 9.5 System Reliability

- [ ] Monitoring system uptime: 99.9%
- [ ] All collection agents healthy: 100%
- [ ] No data loss in metrics: 100% data retention
- [ ] Alert delivery reliability: 99%+

---

## 📚 10. Configuration Reference

### 10.1 Environment Variables Required

```bash
# Datadog
export DATADOG_API_KEY="<api_key>"
export DATADOG_APP_KEY="<app_key>"
export DATADOG_SITE="datadoghq.com"  # or datadoghq.eu

# Telegram
export TELEGRAM_BOT_TOKEN="<bot_token>"
export TELEGRAM_CEO_CHAT_ID="<chat_id>"

# Slack
export SLACK_BOT_TOKEN="<bot_token>"
export SLACK_SIGNING_SECRET="<signing_secret>"

# Discord
export DISCORD_BOT_TOKEN="<bot_token>"
export DISCORD_TECH_CHANNEL_ID="<channel_id>"

# Vercel
export VERCEL_API_TOKEN="<api_token>"
export VERCEL_PROJECT_ID="<project_id>"

# Supabase
export SUPABASE_URL="<db_url>"
export SUPABASE_SERVICE_ROLE_KEY="<service_key>"

# GitHub
export GITHUB_API_TOKEN="<api_token>"
export GITHUB_REPO="dsc-fms-portal"
```

### 10.2 Metric Collection Frequency

| 메트릭 유형 | 수집 간격 | 보관 기간 |
|----------|---------|---------|
| APM Traces | Real-time (100ms) | 15 days (hot) + 90 days (cold) |
| Application Metrics | 10 seconds | 1 year |
| Infrastructure Metrics | 30 seconds | 1 year |
| Log Data | Real-time | 30 days (hot) + 12 months (archive) |
| Custom Business Metrics | 5 minutes | 1 year |

---

## 🔄 11. 지속적 개선 (Continuous Improvement)

### 11.1 주간 리뷰 (Weekly Review)

```markdown
**Every Monday 09:00 KST**
- [ ] Review alert volume (trends, false positives)
- [ ] Analyze MTTR trends
- [ ] Evaluate threshold effectiveness
- [ ] Check dashboard usage patterns
- [ ] Review team feedback on alerting
```

### 11.2 월간 리뷰 (Monthly Review)

```markdown
**Last Friday of each month**
- [ ] SLA compliance review (target: 99.9%)
- [ ] Alert threshold optimization
- [ ] Dashboard redesign based on usage
- [ ] Runbook effectiveness assessment
- [ ] Capacity planning for next month
```

### 11.3 분기별 리뷰 (Quarterly Review)

```markdown
**Every Q: Jan/Apr/Jul/Oct**
- [ ] Full system health assessment
- [ ] Cost optimization (Datadog usage)
- [ ] New service onboarding
- [ ] Disaster recovery drill
- [ ] Team training + certification
```

---

## 🎯 12. Success Story & Impact

### Expected Benefits (2026-06-05 완료 후)

1. **Operational Excellence**
   - 99.9% API availability SLA 달성
   - <30초 alert latency → <5분 MTTR
   - 0 context loss due to monitoring blindness

2. **Team Efficiency**
   - 8/15 agents → 14/15 agents scaling (with confidence)
   - Real-time visibility into 8 concurrent projects
   - Autonomous incident response (runbooks)

3. **Business Continuity**
   - Proactive issue detection (before user impact)
   - Complete audit trail for compliance
   - Disaster recovery validated

4. **Cost Optimization**
   - Infrastructure utilization visibility
   - Capacity planning data-driven
   - Prevent over-provisioning/under-provisioning

---

## 📝 Summary

This comprehensive monitoring & observability design provides:

✅ **Complete metric coverage** (API, DB, deployment, team capacity)  
✅ **Real-time alerting** (Telegram/Slack/Discord multi-channel)  
✅ **Beautiful dashboards** (Grafana + Datadog + custom)  
✅ **Runbooks & procedures** (incident response automation)  
✅ **Infrastructure as Code** (Terraform for reproducibility)  
✅ **Scalable architecture** (supports 15-person team + 8 projects)  

**Next Steps:**
1. ✅ Design complete (this document)
2. 🔄 Infrastructure setup (2026-05-28 ~ 2026-05-30)
3. 🔄 Dashboard configuration (2026-05-31 ~ 2026-06-02)
4. 🔄 Testing & tuning (2026-06-03 ~ 2026-06-05)
5. 🚀 Production deployment (2026-06-05 18:00 KST)

---

**Document Status:** ✅ Architecture Design Complete  
**ETA Compliance:** ON-SCHEDULE (2026-05-30 18:00 KST)  
**Last Updated:** 2026-05-27 22:50 KST  
**Review Pending:** Evaluator AI Agent (design validation)
