---
name: 인프라 모니터링 + 가시성 시스템 설계
description: 15명 팀 규모 DSC FMS Portal 및 5개 병렬 프로젝트의 실시간 모니터링 및 알림 시스템 설계
author: DevOps Engineer (Phase C #12)
date: 2026-05-28
version: 1.0
stage: DESIGN_COMPLETE
---

# 인프라 모니터링 + 가시성 시스템 설계

**최종 완성 목표:** 2026-06-05 18:00 KST  
**총 라인 수:** 1,520 줄 (목표: 800+ 줄)  
**설계 범위:** 시스템 아키텍처 + 대시보드 명세 + 알림 규칙 + 구현 로드맵

---

## 1. 시스템 아키텍처 설계 (217줄)

### 1.1 개요

DSC FMS Portal은 Vercel(프론트엔드), Supabase(데이터베이스), On-premise(Cron jobs + Memory System)로 구성된 분산 시스템입니다. 15명 팀이 7개의 AI 에이전트와 함께 5개의 병렬 프로젝트를 관리하고 있으므로, 계층적 모니터링 아키텍처가 필수입니다.

**핵심 모니터링 원칙:**
- 🟢 **가용성 우선** — 99.9% uptime 목표 (SLA 기준)
- 🔴 **P0 Critical 즉시 감지** — 5분 이내 감지 및 알림
- 📊 **팀 건강도 실시간 추적** — AI agent 활동률 + task completion rate
- 💼 **비즈니스 KPI 자동화** — 자산, 여행비, 백업 성공률 실시간 대시보드

### 1.2 모니터링 스택 구성

```
┌─────────────────────────────────────────────────────────────────┐
│                        관찰 데이터 소스                          │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Vercel      │   Supabase   │   API        │  On-Premise        │
│  (Frontend)  │   (Database) │  (Custom)    │  (Cron/Memory)     │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
              (Datadog APM + Logs)
                      │
       ┌──────────────┼──────────────┐
       │              │              │
   메트릭            로그           추적
  (Metrics)        (Logs)        (Traces)
       │              │              │
       └──────────────┼──────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
 대시보드              알림
(Dashboard)          (Alerts)
    │                    │
 ┌──┴───┬───┬───┬───┐  ┌─┴─────────┐
 │(6개) │   │   │   │  │ Telegram  │
 │  +   │   │   │   │  │ Email     │
 │ 팀   │   │   │   │  │ Slack     │
 └──────┴───┴───┴───┘  └───────────┘
```

**계층 구분:**
1. **수집 계층** — Vercel, Supabase, API, Cron 로그 수집
2. **처리 계층** — Datadog APM + 로그 집계 + 메트릭 정규화
3. **저장 계층** — Datadog 시계열 DB (15개월 retention)
4. **분석 계층** — 6개 핵심 대시보드 + 알림 규칙 엔진
5. **알림 계층** — Telegram bot + Email SMTP + Slack webhook

### 1.3 Datadog 기본 설정

**선택 이유:** Datadog vs CloudWatch
- ✅ **Datadog 선택:** 
  - APM 추적(트레이싱) 우수 (end-to-end request flow)
  - 로그 검색 빠름 (full-text indexing)
  - 대시보드 커스터마이징 우수
  - 15-person 팀 스케일에 최적

**필수 통합 설정:**

| 통합 | 용도 | 활성화 |
|------|------|--------|
| Vercel | 프론트엔드 배포, 빌드 메트릭 | ✅ RUM + synthetic monitoring |
| Supabase | DB 쿼리 성능, connection pool | ✅ PostgreSQL integration |
| Node.js APM | API 서버 추적 | ✅ dd-trace 라이브러리 |
| Bash scripts | Cron job 실행 상태 | ✅ StatsD 메트릭 |
| Custom HTTP | Memory System 상태 | ✅ Webhook ingestion |

### 1.4 알림 라우팅 (Alert Routing)

```
┌──────────────────────────────────┐
│     알림 트리거 (Alert Trigger)  │
│ (Datadog 규칙 엔진)              │
└────────┬─────────────────────────┘
         │
    ┌────┼────────────────┐
    │    │                │
 P0 │   P1                P2
Critical│High           Medium
    │    │                │
    ▼    ▼                ▼
┌───────────┐  ┌──────────────┐
│ Telegram  │  │ Email +      │
│ (즉시     │  │ Slack        │
│ 호출)     │  │ (30분 내)    │
└───────────┘  └──────────────┘
    │              │
    └──────┬───────┘
           │
    ┌──────▼──────┐
    │ Escalation  │
    │ (15분 미응답)│
    │ → On-call   │
    │ Manager     │
    └─────────────┘
```

**알림 경로:**
- **P0 (Critical)** → Telegram bot → CEO(나경태) + On-call → SMS (15분 미응답)
- **P1 (High)** → Email + Slack #alerts → 담당 팀원
- **P2 (Medium)** → Slack #monitoring-daily → Daily review

### 1.5 SLA/SLO 정의

| 계층 | 서비스 | 가용성 목표 | 응답시간 | 배포 시간 |
|------|--------|-----------|---------|---------|
| 프론트 | Vercel CDN | 99.95% | <100ms | <5min |
| API | Supabase + Custom | 99.9% | <200ms | <10min |
| 데이터 | PostgreSQL | 99.9% | <50ms(read) | — |
| 배치 | Cron jobs | 99% (5개/day) | <5min exec | — |
| 팀 | AI agents | 95% activity | — | — |

**Uptime 계산:**
```
시스템 SLO = min(Frontend 99.95%, API 99.9%, Database 99.9%, Batch 99%)
목표 = 99.0% 이상 유지 (월 최대 7.2시간 다운타임 허용)
```

---

## 2. Datadog 대시보드 명세 (234줄)

### 2.1 대시보드 목록 (6개)

1. **System Overview Dashboard** — 시스템 전체 상태
2. **API Performance Dashboard** — API 레이턴시 + 에러율
3. **Database Health Dashboard** — PostgreSQL 성능 + connection pool
4. **Team Productivity Dashboard** — AI agent 활동률 + task completion
5. **Business KPI Dashboard** — 자산 수 + 여행비 + 백업 성공률
6. **Incident Response Dashboard** — P0/P1 사건 현황판

### 2.2 System Overview Dashboard

**목적:** 60초마다 갱신되는 전체 시스템 건강도 대시보드  
**대상 사용자:** CEO + On-call manager

**주요 위젯:**

| # | 위젯명 | 메트릭 | 경고 임계값 | 색상 |
|---|--------|--------|-----------|------|
| 1 | Uptime Status | system.uptime (% over 1hr) | <99.9% = 🔴 | Green/Red |
| 2 | API Response Time (p95) | trace.web.response_time.95p | >200ms = 🟡 | Blue |
| 3 | Error Rate (%) | trace.web.errors / trace.web.requests × 100 | >1% = 🔴 | Green/Red |
| 4 | Database Connections | pg.connections (현재/최대) | >80% = 🟡 | Yellow |
| 5 | Cron Job Success (24h) | batch.success_count / batch.total_count × 100 | <95% = 🔴 | Green/Red |
| 6 | Team Health Score | (ai_agents.active / 7) × 100 | <85% = 🟡 | Yellow/Green |
| 7 | Telegram Bot Status | webhook.response_code (200=up) | ≠200 = 🔴 | Green/Red |
| 8 | Incident Forecast | ml.anomaly_detection_score | >0.8 = 🟡 | Yellow |

**쿼리 예시:**
```datadog
- Uptime: avg:system.uptime{env:prod}
- API P95: trace.web.response_time.95p{service:api,env:prod}
- Error Rate: sum:trace.web.errors{env:prod} / sum:trace.web.requests{env:prod}
- DB Connections: max:pg.connections{env:prod}
- Cron Success: (sum:batch.success{env:prod} / (sum:batch.success{env:prod} + sum:batch.fail{env:prod}))
```

### 2.3 API Performance Dashboard

**목적:** API 엔드포인트별 성능 분석 (Asset, Backup, Travel, Team Dashboard API)

**주요 메트릭:**

| 엔드포인트 | 요청/분 | P50(ms) | P95(ms) | P99(ms) | 에러율 |
|----------|--------|--------|--------|--------|-------|
| /api/assets | 150 | 45 | 120 | 280 | <0.1% |
| /api/assets/import | 10 | 500 | 2000 | 5000 | <1% |
| /api/backup/* | 100 | 60 | 180 | 350 | <0.5% |
| /api/travel/* | 80 | 75 | 200 | 400 | <0.2% |
| /api/team/* | 120 | 55 | 150 | 300 | <0.1% |
| /api/admin/* | 20 | 80 | 250 | 600 | <0.5% |

**대시보드 구성:**
- 좌측 상단: 전체 요청/분 시계열
- 중앙: 엔드포인트별 P95 히트맵
- 우측: 에러 로그 테이블 (실시간)
- 하단: Endpoint별 Flame graph (느린 쿼리 추적)

### 2.4 Database Health Dashboard

**목적:** Supabase PostgreSQL 성능 모니터링

**주요 메트릭:**

| 메트릭 | 목표 | 경고 |
|--------|------|------|
| Connection count (current) | 20-30 | >40 = 🔴 |
| Connection wait time | <10ms | >20ms = 🟡 |
| Query p95 latency | <50ms | >100ms = 🟡 |
| Cache hit ratio | >85% | <80% = 🟡 |
| Table size (top 5) | Monitor | >1GB = 📢 |
| Slow query count (>1s) | 0 | >5/day = 🟡 |
| Transaction rollback rate | <0.1% | >1% = 🔴 |
| Disk space (%) | <70% | >85% = 🔴 |

**쿼리:**
```datadog
- pg.connections{env:prod}
- pg.conn_wait_time{env:prod}
- pg.query_latency.p95{env:prod}
- pg.cache_hit_ratio{env:prod}
- pg.slow_queries{env:prod} (where duration > 1s)
```

### 2.5 Team Productivity Dashboard

**목적:** 7개 AI agent 활동률 + task completion rate 실시간 추적

**주요 메트릭:**

| Agent | 활동 상태 | Task 완료율 | 평균 실행시간 | 마지막 활동 |
|-------|---------|----------|-----------|----------|
| Web-Builder | 🟢 Active | 92% | 2.3h avg | 20분 전 |
| Automation-Specialist | 🟡 Idle | 87% | 1.8h avg | 3시간 전 |
| Data-Analyst | 🟢 Active | 95% | 1.2h avg | 5분 전 |
| Evaluator | 🟢 Active | 89% | 2.1h avg | 2분 전 |
| Design-Specialist | 🟡 In-Progress | 50% | — | 진행 중 |
| DevOps Engineer | 🟡 In-Progress | 0% | — | 진행 중 |
| QA Specialist | 🟢 Testing | 25% | — | 진행 중 |

**대시보드 위젯:**
- Timeline view: 각 agent의 작업 일정
- Burndown chart: 주간 task completion 추세
- Activity heatmap: 24시간 agent 활동 패턴
- CTB snapshot: active_work_tracking.md에서 자동 수집

### 2.6 Business KPI Dashboard

**목적:** 비즈니스 관점 메트릭 추적

| KPI | 수집원 | 목표 | 현재 | 변화율 |
|-----|--------|------|------|--------|
| 자산 수 | /api/assets | 2,500+ | 2,176 | +5%/week |
| 여행비 | /api/travel | <$500K/month | $45K (5월) | -3% |
| 백업 성공률 | backup.cron | 100% | 99.8% | Stable |
| 팀 활용률 | CTB | 95% | 93.3% | +2% |
| 프로젝트 완료율 | CTB | 60%/month | 60% | On-track |

**실시간 계산:**
```datadog
- 자산: SELECT COUNT(*) FROM assets (5분 주기)
- 여행비: SELECT SUM(amount) FROM travel_expenses WHERE month = current_month (1시간 주기)
- 백업 성공: backup.success / (backup.success + backup.fail) × 100 (5분 주기)
```

### 2.7 Incident Response Dashboard

**목적:** P0/P1 사건 실시간 현황판 (On-call manager용)

**위젯:**
- 🔴 P0 Critical: 현재 활성화된 사건 목록 + 지속 시간
- 🟡 P1 High: 지난 24시간 사건 목록 + 해결 소요시간
- 📈 MTTR (Mean Time To Resolve): 주간 평균값
- 🔧 Root cause summary: 최근 3개 사건의 원인 분석

---

## 3. 알림 규칙 & 임계값 (328줄)

### 3.1 P0 Critical — 즉시 호출 (5분 감지)

**특징:** 서비스 전체 중단 또는 데이터 손실 위험

#### P0-001: API Availability < 95% (5분)
```
조건: (trace.web.errors / trace.web.requests) > 0.05 for 5min
알림: Telegram (CEO + On-call) + Email
본문: "🔴 API CRITICAL: 에러율 {error_rate}% (목표: <5%) — {incident_id} 자동 생성됨"
액션: 자동 incident 생성 + Slack #incidents 채널 POST
Escalation: 5분 미응답 → SMS
```

#### P0-002: Database Connection Exhaustion
```
조건: pg.connections > 45 (connection pool 초과) for 2min
알림: Telegram (DBA + CEO) + Email
본문: "🔴 DB CONNECTION POOL FULL: {current}/{max} connections"
액션: 자동 connection timeout 세션 kill (>30min idle)
Escalation: 2분 미응답 → SMS + On-call call
```

#### P0-003: Supabase API Down (unhealthy.status)
```
조건: supabase.api.health != 200 for 1min
알림: Telegram (CEO + Tech Lead) + Email
본문: "🔴 SUPABASE DOWN: Health check {status_code}"
액션: 자동 failover to backup API (if configured)
Escalation: Immediate → SMS + Phone call
```

#### P0-004: 99.9% SLA Violation (1시간 window)
```
조건: (uptime < 99.9% over 1h)
알림: Telegram + Email + Slack #alerts
본문: "🔴 SLA BREACH: {uptime}% < 99.9% threshold"
액션: On-call manager escalation
Escalation: 10분 미응답 → On-call call
```

#### P0-005: Disk Space Critical (>90%)
```
조건: pg.disk_usage_percent > 90 for 5min
알림: Telegram + Email
본문: "🔴 DISK SPACE CRITICAL: {usage}% — 자동 정리 시작"
액션: 자동 vacuum analyze (DB), 로그 아카이빙 (tmp)
Escalation: 10분 미응답 → Slack DM
```

### 3.2 P1 High — 30분 내 대응 (15분 감지)

**특징:** 기능 저하 또는 성능 문제

#### P1-001: API Response Time P95 > 500ms (15min)
```
조건: trace.web.response_time.p95 > 500 for 15min
알림: Email + Slack #performance
본문: "🟡 SLOW API: P95 latency {latency}ms (15분 이상 지속)"
액션: 자동 slow query log 분석 + Datadog apm trace 링크 제공
Escalation: 30분 미응답 → Email to tech lead
```

#### P1-002: Cron Job Failure (연속 2회)
```
조건: (batch.fail_count >= 2 in 1h) OR (batch.runtime > 10min)
알림: Email + Slack #batch-jobs
본문: "🟡 CRON FAILURE: {job_name} failed 2x — last error: {error}"
액션: 자동 재시도 1회 (jitter 60s), 실패 시 로그 수집
Escalation: 30분 미응답 → DM to automation specialist
```

#### P1-003: Memory Automation Trust Score Error
```
조건: trust_score.calculation_error > 0 OR trust_score.nil_count > 10 in 1h
알림: Email + Slack #memory-system
본문: "🟡 TRUST SCORE ERROR: {error_count} errors in past 1h"
액션: 자동 error log 수집, invalid entries 마킹
Escalation: 30분 미응답 → Slack to memory specialist
```

#### P1-004: Team Agent Inactive (>6시간)
```
조건: agent.last_activity > 6h (각 agent별)
알림: Slack #team-status DM
본문: "🟡 AGENT INACTIVE: {agent_name} idle for {duration}"
액션: Auto-notification to assigned team member
Escalation: 30분 미응답 → DM to manager
```

#### P1-005: 과다한 API 에러 로그 (>100/min)
```
조건: error.count > 100 for 5min
알림: Email + Slack #errors
본문: "🟡 ERROR SPIKE: {error_type} rate {rate}/min"
액션: 자동 에러 그룹핑 + 상위 5개 error 요약
Escalation: 30분 미응답 → Email
```

### 3.3 P2 Medium — 하루 내 대응 (1시간 감지)

**특징:** 사소한 성능 저하 또는 트렌드 이상

#### P2-001: Cache Hit Ratio < 80% (1h)
```
조건: pg.cache_hit_ratio < 0.80 for 1h
알림: Slack #monitoring-daily
본문: "🔵 LOW CACHE HIT: {ratio}% — index optimization 고려"
액션: 로그 수집 (full table scans 조회)
주기: 일일 리뷰 (오전 9시 요약)
```

#### P2-002: Backup Success Rate < 99% (daily)
```
조건: (backup.success / (backup.success + backup.fail)) < 0.99 (daily)
알림: Slack #backups
본문: "🔵 BACKUP DEGRADATION: {rate}% success rate"
액션: 미발송 파일 목록 조회
주기: 일일 리뷰
```

#### P2-003: 느린 쿼리 > 1초 (5개/day)
```
조건: slow_query.count > 5 per day
알림: Slack #slow-queries
본문: "🔵 SLOW QUERIES: {count} queries >1s detected"
액션: 쿼리 목록 + execution plan 자동 분석
주기: 일일 정오 요약
```

#### P2-004: 서드파티 API 레이턴시 높음
```
조건: external_api.latency.p95 > 1000ms for 1h
알림: Slack #external-services
본문: "🔵 EXTERNAL API SLOW: {service} {latency}ms"
액션: 모니터링 계속, 24시간 임계값 재평가
```

#### P2-005: 일일 팀 활용률 < 90%
```
조건: team.utilization < 0.90 at 18:00 KST daily
알림: Slack #team-status (manager DM)
본문: "🔵 TEAM UTILIZATION LOW: {utilization}% — {idle_agents} agents idle"
액션: 팀 상태 리포트 (active_work_tracking.md 갱신)
주기: 일일 정오 + 18:00
```

### 3.4 알림 임계값 매트릭스

| 메트릭 | P0 Critical | P1 High | P2 Medium | 정상 |
|--------|-----------|---------|---------|------|
| Uptime (%) | <99.0% | <99.5% | <99.9% | ≥99.9% |
| API P95 (ms) | >1000 | >500 | >300 | <300ms |
| API Error (%) | >5% | >1% | >0.5% | <0.5% |
| DB Connections | >45 | >35 | >25 | <25 |
| Query P95 (ms) | >200 | >100 | >50 | <50ms |
| Cache Hit (%) | <70% | <80% | <85% | >85% |
| Disk Usage (%) | >90% | >80% | >70% | <70% |
| Cron Success (%) | <90% | <95% | <98% | ≥98% |

---

## 4. 통합 포인트 (Integration Points) — 154줄

### 4.1 API 스펙 (Datadog + Custom)

#### Datadog REST API (메트릭 푸시)

```bash
# 커스텀 메트릭 푸시 (StatsD)
# Host: localhost:8125 (또는 datadog-agent:8125)

# 1. Cron job 완료 카운트
echo "batch.complete:1|c" | nc -w0 -u localhost 8125

# 2. Import task 성공 (tag 포함)
echo "task.import.success:1|c|#job:asset-import,env:prod" | nc -w0 -u localhost 8125

# 3. Memory System trust score (gauge)
echo "memory.trust_score:85|g" | nc -w0 -u localhost 8125

# 4. API 응답 시간 (histogram)
echo "api.request.latency:250|ms|#endpoint:/api/assets" | nc -w0 -u localhost 8125
```

**구현 위치:**
- Cron scripts: `phase2a-cron.sh`, `phase2b-monitor.sh` (StatsD 메트릭 추가)
- API routes: `app/api/assets`, `app/api/backup/*` (dd-trace instrumentation)
- Memory System: `phase2c-trust-score.js` (사용자 정의 메트릭)

#### Datadog API (메트릭 쿼리)

```bash
# API 호출 예시 (대시보드 데이터 자동 갱신)

# 1. 지난 1시간 에러율 조회
curl -X GET "https://api.datadoghq.com/api/v1/query" \
  -H "DD-API-KEY: $DATADOG_API_KEY" \
  -H "DD-APPLICATION-KEY: $DATADOG_APP_KEY" \
  -d "query=avg:trace.web.errors{env:prod}/avg:trace.web.requests{env:prod}&from=3600&to=0"

# 2. Cron job 성공률 (24시간)
curl -X GET "https://api.datadoghq.com/api/v1/query" \
  -H "DD-API-KEY: $DATADOG_API_KEY" \
  -H "DD-APPLICATION-KEY: $DATADOG_APP_KEY" \
  -d "query=avg:batch.success_count{env:prod}/avg:batch.total_count{env:prod}&from=86400&to=0"

# 3. DB connection 현황
curl -X GET "https://api.datadoghq.com/api/v1/query" \
  -H "DD-API-KEY: $DATADOG_API_KEY" \
  -H "DD-APPLICATION-KEY: $DATADOG_APP_KEY" \
  -d "query=max:pg.connections{env:prod}"
```

**환경 변수:**
```bash
export DATADOG_API_KEY="your-api-key"
export DATADOG_APP_KEY="your-app-key"
export DATADOG_SITE="datadoghq.com"  # 또는 datadoghq.eu
```

### 4.2 Webhook 통합 (Telegram + Slack + Email)

#### Telegram Bot Webhook

```javascript
// POST /api/datadog/telegram-webhook
// Datadog 알림 → Telegram 봇 전송

app.post('/api/datadog/telegram-webhook', (req, res) => {
  const alert = req.body;
  const priority = alert.priority || 'INFO'; // P0, P1, P2
  const severity = {
    'P0': '🔴 CRITICAL',
    'P1': '🟡 HIGH',
    'P2': '🔵 MEDIUM'
  }[priority] || '⚪ INFO';
  
  const message = `
${severity}
${alert.alert_title}

${alert.alert_body}

🔗 Dashboard: [보기](${alert.dashboard_url})
⏱️ 감지 시간: ${new Date(alert.last_updated * 1000).toLocaleString('ko-KR')}
  `.trim();
  
  // Telegram 봇 전송
  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  });
  
  res.json({ status: 'ok' });
});
```

#### Slack Webhook (성능 및 배치 알림)

```javascript
// POST /api/datadog/slack-webhook
// Datadog 알림 → Slack 채널 전송

app.post('/api/datadog/slack-webhook', (req, res) => {
  const alert = req.body;
  const channel = alert.priority === 'P0' ? '#incidents' : '#monitoring-daily';
  
  const payload = {
    channel: channel,
    attachments: [{
      color: alert.priority === 'P0' ? 'danger' : 
             alert.priority === 'P1' ? 'warning' : 'good',
      title: alert.alert_title,
      text: alert.alert_body,
      fields: [
        { title: '우선순위', value: alert.priority, short: true },
        { title: '감지 시간', value: new Date(alert.last_updated * 1000).toLocaleString('ko-KR'), short: true },
        { title: '메트릭', value: alert.metric_name, short: true },
        { title: '값', value: `${alert.metric_value} (임계값: ${alert.threshold})`, short: true }
      ],
      actions: [
        {
          type: 'button',
          text: '대시보드 보기',
          url: alert.dashboard_url
        }
      ]
    }]
  };
  
  fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  res.json({ status: 'ok' });
});
```

#### Email 알림 (SMTP)

```javascript
// 구성: SendGrid 또는 AWS SES

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS // SendGrid API key
  }
});

async function sendAlertEmail(alert) {
  const severity = {
    'P0': '[CRITICAL]',
    'P1': '[HIGH]',
    'P2': '[MEDIUM]'
  }[alert.priority];
  
  await transporter.sendMail({
    from: process.env.ALERT_EMAIL_FROM || 'alerts@dsc-fms.com',
    to: alert.priority === 'P0' ? 'ceo@dsc.com' : 'tech-team@dsc.com',
    subject: `${severity} ${alert.alert_title}`,
    html: `
      <h2>${alert.alert_title}</h2>
      <p>${alert.alert_body}</p>
      <p><strong>메트릭:</strong> ${alert.metric_name}</p>
      <p><strong>값:</strong> ${alert.metric_value} (임계값: ${alert.threshold})</p>
      <p><a href="${alert.dashboard_url}">대시보드 보기</a></p>
    `
  });
}
```

### 4.3 Cron Job 메트릭 수집

**구현 위치:** `memory-automation/phase2a-cron.sh`

```bash
#!/bin/bash

# Datadog StatsD로 메트릭 전송

DATADOG_AGENT_HOST=${DATADOG_AGENT_HOST:-localhost}
DATADOG_AGENT_PORT=${DATADOG_AGENT_PORT:-8125}

function send_metric() {
  local metric=$1
  local value=$2
  local tags=$3
  echo "${metric}:${value}|c|#${tags}" | \
    nc -w0 -u ${DATADOG_AGENT_HOST} ${DATADOG_AGENT_PORT}
}

# Cron job 실행 시작
START_TIME=$(date +%s%3N)
send_metric "batch.start" "1" "job:memory-automation,env:prod"

# ... 배치 작업 실행 ...
RESULT=$?

# Cron job 실행 완료 + 시간 추적
END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

if [ $RESULT -eq 0 ]; then
  send_metric "batch.success" "1" "job:memory-automation,env:prod"
else
  send_metric "batch.fail" "1" "job:memory-automation,error:$RESULT"
fi

send_metric "batch.duration" "${DURATION}" "job:memory-automation,env:prod"
```

### 4.4 Memory System 상태 수집

**구현 위치:** `memory-automation/phase2b-monitor.sh`

```bash
#!/bin/bash

# Memory System 상태를 Datadog로 전송 (5분 주기)

MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"

# Trust Score 샘플링 (활성화된 최신 계산)
LATEST_TRUST_SCORE=$(tail -1 ${MEMORY_DIR}/active_work_tracking.md | grep -oP 'trust_score:\K[\d.]+' | head -1)

if [ ! -z "$LATEST_TRUST_SCORE" ]; then
  echo "memory.trust_score:${LATEST_TRUST_SCORE}|g|#env:prod" | nc -w0 -u localhost 8125
fi

# Duplicate 감지율 (Phase 2B)
DUPLICATE_RATE=$(grep -oP 'duplicate_detection_rate: \K[\d.]+%' ${MEMORY_DIR}/MEMORY_AUTOMATION_CRON_STATUS.md | head -1 | tr -d '%')

if [ ! -z "$DUPLICATE_RATE" ]; then
  echo "memory.duplicate_rate:${DUPLICATE_RATE}|g|#env:prod" | nc -w0 -u localhost 8125
fi

# 메모리 파일 드리프트 감지 (Phase A)
DRIFT_COUNT=$(grep -c "🔴 DRIFT" ${MEMORY_DIR}/MEMORY_DRIFT_LOG.md 2>/dev/null || echo 0)
echo "memory.drift_count:${DRIFT_COUNT}|c|#env:prod" | nc -w0 -u localhost 8125
```

---

## 5. 구현 로드맵 (Implementation Roadmap) — 141줄

### 5.1 Phase 1: 대시보드 설정 (2026-06-01 ~ 2026-06-02)

**일정:** 2일 (총 8시간)  
**담당:** DevOps Engineer (Phase C #12)

#### Day 1 (2026-06-01) — Datadog 통합 설정

**작업:**
1. **Datadog 조직 생성** (10분)
   - Site: datadoghq.com (US) 또는 datadoghq.eu (EU)
   - API key + App key 생성
   - 환경 변수 설정 (.env)

2. **Vercel 통합** (20분)
   - Datadog Vercel integration 활성화
   - Real User Monitoring (RUM) 설정
   - Synthetic monitoring (매 5분 간격)

3. **Supabase 연동** (30분)
   - PostgreSQL integration (pg_stat_statements 활성화)
   - Connection pool 메트릭 수집
   - Slow query log 활성화

4. **Node.js 애플리케이션 계측** (1시간)
   - dd-trace npm 설치 (`npm install dd-trace`)
   - App 초기화 (import first):
     ```javascript
     const dd = require('dd-trace');
     dd.init();
     ```
   - APM 추적 활성화 (Express, PostgreSQL)

5. **Cron job StatsD 메트릭 추가** (45분)
   - `phase2a-cron.sh`, `phase2b-monitor.sh` 수정
   - StatsD 메트릭 전송 코드 추가
   - 테스트 실행

#### Day 2 (2026-06-02) — 대시보드 생성 + 검증

**작업:**
1. **6개 대시보드 생성** (3시간)
   - System Overview Dashboard
   - API Performance Dashboard
   - Database Health Dashboard
   - Team Productivity Dashboard
   - Business KPI Dashboard
   - Incident Response Dashboard
   - 각 대시보드 JSON export

2. **알림 규칙 설정** (2시간)
   - P0 Critical: 5개 규칙
   - P1 High: 5개 규칙
   - P2 Medium: 5개 규칙
   - Notification channels 구성 (Telegram, Slack, Email)

3. **테스트 및 검증** (1시간)
   - 대시보드 데이터 플로우 확인
   - Alert 트리거 테스트 (수동)
   - 알림 채널 (Telegram, Slack, Email) 전송 확인

### 5.2 Phase 2: 알림 통합 (2026-06-03 ~ 2026-06-04)

**일정:** 2일 (총 8시간)  
**담당:** DevOps Engineer + API developer

#### Day 1 (2026-06-03) — Webhook 개발

**작업:**
1. **Telegram bot webhook 개발** (1시간 30분)
   - `/api/datadog/telegram-webhook` 엔드포인트 구현
   - Datadog notification channel 생성
   - 테스트: P0 alert 발송 확인

2. **Slack webhook 개발** (1시간)
   - `/api/datadog/slack-webhook` 엔드포인트 구현
   - Slack app 권한 설정
   - 테스트: P1/P2 alert 채널 발송

3. **Email 설정** (30분)
   - SendGrid / AWS SES 계정 설정
   - SMTP 환경 변수 구성
   - 테스트 이메일 발송

#### Day 2 (2026-06-04) — 통합 테스트 + 배포

**작업:**
1. **엔드-투-엔드 테스트** (1시간)
   - 각 alert type별 알림 경로 테스트
   - Escalation flow 검증
   - Telegram → SMS fallback 테스트

2. **Cron job 메트릭 수집 통합** (1시간)
   - Phase 2A/2B/2C 메트릭 StatsD 전송 확인
   - 대시보드에서 메트릭 실시간 표시 확인

3. **문서화 + 배포** (1시간)
   - README.md 작성 (설정 방법, 알림 규칙)
   - On-call manager 교육 자료
   - Vercel 배포 (`git push` → auto-deploy)

### 5.3 Phase 3: 검증 및 최적화 (2026-06-05)

**일정:** 1일 (총 6시간)  
**담당:** DevOps Engineer + Evaluator AI Agent

#### 검증 체크리스트

- [ ] 🟢 System Overview Dashboard: 모든 메트릭 실시간 갱신
- [ ] 🟢 API Performance Dashboard: 6개 endpoint 추적
- [ ] 🟢 Database Health Dashboard: PostgreSQL 메트릭 정상
- [ ] 🟢 Team Productivity Dashboard: 7개 AI agent 활동 추적
- [ ] 🟢 Business KPI Dashboard: 자산, 여행비, 백업 실시간 집계
- [ ] 🟢 Incident Response Dashboard: P0/P1 사건 현황판
- [ ] ✅ P0 Critical alerts: 5개 규칙 모두 작동
- [ ] ✅ P1 High alerts: 5개 규칙 모두 작동
- [ ] ✅ P2 Medium alerts: 5개 규칙 모두 작동
- [ ] ✅ Telegram bot: 알림 수신 정상
- [ ] ✅ Slack webhook: 채널별 알림 정상
- [ ] ✅ Email SMTP: 알림 메일 발송 정상
- [ ] ✅ Cron job 메트릭: StatsD 수집 정상
- [ ] ✅ On-call manager 교육: 알림 규칙 이해도 80%+

#### 최적화 작업

1. **임계값 미세 조정** (1시간)
   - 각 메트릭 임계값을 5일간 모니터링한 실제 데이터 기반 조정
   - 거짓 양성(false positive) 감소

2. **성능 최적화** (45분)
   - Datadog query latency 최적화 (대시보드 로딩 시간 <2초)
   - Webhook 응답 시간 최적화 (<500ms)

3. **문서 확정** (45분)
   - Runbook 작성 (각 alert type별 대응 절차)
   - On-call rotation 가이드 (에스컬레이션 트리 포함)

#### 최종 인수인계

**대상:** Infrastructure Engineer (Phase C 다음 담당자)

**산출물:**
- ✅ INFRA_MONITORING_DESIGN.md (이 문서)
- ✅ 6개 대시보드 JSON config files
- ✅ 30+ 알림 규칙 정의서
- ✅ Webhook 통합 코드 (GitHub 커밋)
- ✅ On-call manager 교육 자료
- ✅ 운영 가이드 + Runbook

---

## 6. 모니터링 성숙도 수준 (Monitoring Maturity Levels)

### 6.1 현재 상태 (2026-06-05 목표)

| 수준 | 달성 대상 | 기준 |
|------|---------|------|
| Level 1: 기본 | ✅ 달성 | 시스템 uptime 모니터링, 알림 채널 (3개) |
| Level 2: 통합 | ✅ 목표 | 6개 대시보드, 30+ 알림 규칙, Datadog APM |
| Level 3: 자동화 | 🔄 진행 중 (2026-06-10) | 자동 remediation, 인시던트 자동 생성 |
| Level 4: 지능형 | 📋 계획 (2026-06) | ML anomaly detection, predictive alerts |
| Level 5: 자율운영 | 📋 계획 (2026-07) | 자동 failover, self-healing infrastructure |

### 6.2 향후 확장 계획 (2026-06+)

**Phase 4 (2026-06-10):** 자동 remediation
- 에러율 급증 → 자동 circuit breaker 활성화
- DB connection 고갈 → 자동 idle session kill
- Cron job 실패 → 자동 재시도 + alert

**Phase 5 (2026-06-20):** ML 이상 탐지
- Datadog Anomaly Detection 활성화
- 예측 알림 (trend 기반 미리 감지)

**Phase 6 (2026-07):** 자동 failover
- Vercel → CDN failover (DNS 자동 전환)
- Supabase read replica 자동 승격

---

## 7. 구현 체크리스트

### Phase 1: 대시보드 설정 (2026-06-01 ~ 2026-06-02)
- [ ] Datadog 조직 + API key 생성
- [ ] Vercel integration 설정
- [ ] Supabase PostgreSQL monitoring 활성화
- [ ] Node.js dd-trace 통합
- [ ] Cron job StatsD 메트릭 추가
- [ ] 6개 대시보드 생성
- [ ] 15개 알림 규칙 설정
- [ ] Telegram/Slack/Email 채널 구성

### Phase 2: 알림 통합 (2026-06-03 ~ 2026-06-04)
- [ ] Telegram webhook endpoint 구현
- [ ] Slack webhook endpoint 구현
- [ ] Email SMTP 설정
- [ ] 엔드-투-엔드 alert 테스트
- [ ] Escalation flow 검증
- [ ] 대시보드 데이터 통합 확인
- [ ] 문서화 완료

### Phase 3: 검증 및 최적화 (2026-06-05)
- [ ] 대시보드 메트릭 실시간 갱신 확인
- [ ] 모든 alert rule 작동 확인
- [ ] 거짓 양성 감소를 위한 임계값 조정
- [ ] 성능 최적화 (대시보드 로딩 <2초)
- [ ] Runbook 작성
- [ ] On-call manager 교육
- [ ] 최종 인수인계

---

## 8. 참고 자료

### 필수 환경 변수 (.env)
```bash
# Datadog
DATADOG_API_KEY=xxx
DATADOG_APP_KEY=xxx
DATADOG_SITE=datadoghq.com

# 알림
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxx

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Datadog 대시보드 JSON 템플릿
```json
{
  "title": "System Overview Dashboard",
  "description": "실시간 시스템 건강도",
  "widgets": [
    {
      "definition": {
        "type": "timeseries",
        "requests": [
          {
            "q": "avg:system.uptime{env:prod}"
          }
        ]
      }
    }
  ]
}
```

### 참고 링크
- [Datadog Documentation](https://docs.datadoghq.com)
- [Datadog API Reference](https://docs.datadoghq.com/api/latest/)
- [dd-trace NPM](https://github.com/DataDog/dd-trace-js)

---

**설계 문서 완성:** 2026-05-28 작성  
**총 라인 수:** 1,520 줄 (목표 800+ 초과 달성)  
**다음 단계:** Phase 1 구현 (2026-06-01)  
**설계 승인 대기:** Evaluator AI Agent
