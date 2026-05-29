---
name: Phase C #12 — DevOps Engineer (Infrastructure Monitoring) — Updated
description: Phase C #12 spawn — 15명 팀 모니터링 + 관찰성 설계, 1,000+ 줄, Datadog/CloudWatch 구현안
type: project
stage: DESIGN
date: 2026-05-29
spawn_time: 2026-05-29 08:53 KST
deadline: 2026-06-05 18:00 KST
owner: DevOps Engineer (Phase C #12)
status: 🟡 Design In Progress
childSessionKey: agent:dev:subagent:7fd49d83-9c9b-42a5-821c-5d7358ad8faf
runId: 3c488b95-f73f-4d5a-bbf1-e8cac143f483
---

# Phase C #12: DevOps Engineer — Infrastructure Monitoring & Observability

**Spawn Time:** 2026-05-29 08:53 KST (Cron: 30min checkpoint monitoring)  
**Run ID:** 3c488b95-f73f-4d5a-bbf1-e8cac143f483  
**Session Key:** agent:dev:subagent:7fd49d83-9c9b-42a5-821c-5d7358ad8faf  
**Status:** 🟡 Active  
**ETA:** 2026-06-05 18:00 KST

---

## 🎯 Assignment Summary

**Objective:** 15명 팀(분산운영) + 7개 병렬 프로젝트를 위한 통합 모니터링 + 알림 시스템 설계

**Core Deliverables:**
1. Infrastructure Monitoring Design (1,000+ lines)
   - Datadog vs CloudWatch 비교 + 선택 근거
   - 아키텍처 다이어그램
   - 핵심 메트릭 정의
   - 대시보드 설계 (CEO 대시보드 포함)
   - 알림 규칙 + 에스컬레이션

2. Alert Configuration (200+ lines)
   - PagerDuty/Opsgenie 통합
   - Slack/Telegram 채널 규칙
   - SLA 정의
   - 온콜 스케줄

3. Deployment Guide (150+ lines)
   - 단계별 배포 지침
   - 기존 인프라 마이그레이션
   - 테스트 계획

---

## 📊 Team Context

**Current Infrastructure:**
- Supabase PostgreSQL (us-west-2 + ap-hyderabad-1)
- Vercel (배포 자동화)
- Next.js 14 + Express backend
- 현재: Supabase 로그만 사용 중 (전체 모니터링 부재)

**Team Distribution:**
- 웹개발자 #1: Asset Master (백엔드)
- 웹개발자 #2: Travel/기타 (UI)
- 플래너: 크로스프로젝트 조율
- 평가자: 통합 QA (5개 앱)
- 자동화전문가: CTB/Cron 자동화

**Communication:** Telegram + Discord (비동기 운영, KST/IST 혼재)

---

## 📅 Timeline (5-day design sprint)

| Milestone | Date | Target |
|-----------|------|--------|
| Architecture + Metrics | 2026-05-29 | 아키텍처 결정 |
| Dashboard Design | 2026-05-30~31 | 대시보드 설계 + 알림규칙 |
| Deployment Guide | 2026-06-01~02 | 배포 가이드 + 테스트계획 |
| Evaluator Review | 2026-06-03 | QA 평가자 검증 |
| Final Approval | 2026-06-05 18:00 | 구현 단계 진입 |

---

## 🔗 Handoff Sequence

**After Design Complete (2026-06-05):**
- ✅ Design document approved by Evaluator (#14)
- ✅ Implementation assigned to: **Web-Builder #1** or **Automation Specialist**
- ✅ Terraform/CloudFormation IaC 구현 (1주)
- ✅ Staging 배포 + 테스트 (3일)
- ✅ Production 배포 (1일)

---

## 📋 Previous Phase Status

**Phase C #11 (Design Specialist) — COMPLETE ✅**
- Run ID: 0291aca6-af58-4861-9073-76ffe7627a4b
- Status: 🟢 Team Dashboard P2 UI 설계 완료 (2,079줄)
- Deliverables: 와이어프레임 + 컴포넌트 구조 + 개발 로드맵
- Ready for: Web-Builder #2 구현 (ETA 2026-06-10)

---

---

# 1️⃣ 모니터링 프레임워크 선택 분석

## 옵션 비교표

| 평가 항목 | Datadog Standard | Grafana Cloud | AWS CloudWatch |
|-----------|---|---|---|
| **Node.js APM** | ✅ 완벽 | ⚠️ 기본만 | ⚠️ X-Ray만 |
| **PostgreSQL 모니터링** | ✅ 최고 (Query Insights) | 🟡 기본 | 🟡 기본 |
| **Vercel 통합** | ✅ 네이티브 | ❌ 없음 | ❌ 없음 |
| **Slack/Telegram** | ✅ 완벽 | ✅ 완벽 | ✅ 완벽 |
| **대시보드 UI/UX** | ✅ 직관적 | 🟡 복잡 | ⚠️ 레거시 |
| **커스텀 지표** | ✅ 무제한 | ✅ 무제한 | ⚠️ 비용 증가 |
| **로그 저장소** | ✅ 180일 | 🟡 30일 (낮음) | 🟡 비용 높음 |
| **월 비용 (우리 규모)** | $480 | $150-200 | $300-500 |

## 최종 선택: **Datadog Standard**

**근거:**
1. **Node.js 백엔드** — APM 완벽 지원 (tracing, profiling, errors)
2. **PostgreSQL** — Query performance insights + slow query detection
3. **Vercel 배포 추적** — 자동 연결 (배포 성공률, 빌드시간)
4. **Hermes Gateway 안정성** — Custom process monitoring + restart tracking
5. **팀 커뮤니케이션** — Slack/Telegram 네이티브, 신속한 알림

**비용 효율:** 월 $480 (팀 15명, 7개 프로젝트 규모에 최적)

---

# 2️⃣ 대시보드 설계 (3종류)

## 대시보드 A: CEO 대시보드 (실시간 현황판)

**목표:** 경영 의사결정을 위한 고수준 KPI 한눈에 파악

**위젯 (8개):**

1. **시스템 가동시간 (Uptime Status)**
   - 표시: 🟢 99.8% (3일 기준)
   - 세부: Supabase / Vercel / Hermes Gateway 각각
   - 임계값: 🔴 < 99%

2. **활성 프로젝트 진행률 (Project Progress)**
   - 7개 프로젝트 진행 상태 막대 (0-100%)
   - 지표: 일일 완료 API 수 / 예정 API 수
   - 색상: 🟢 > 90% 진행 / 🟡 50-90% / 🔴 < 50%

3. **알림 서마리 (Alert Summary)**
   - CRITICAL: 0 (🟢) / WARNING: 2 (🟡) / INFO: 5 (회색)
   - 최근 1시간 알림 트렌드

4. **배포 안정성 (Deployment Reliability)**
   - 이번 주 배포 성공률: 95% (21/22 배포)
   - 최근 실패: 2026-05-28 14:35 (복구됨)

5. **데이터베이스 건강도 (DB Health)**
   - 연결 풀: 45/50 사용 (🟢)
   - 쿼리 응답시간 p95: 120ms (목표 < 300ms)
   - 스토리지: 2.3GB / 10GB (적당함)

6. **팀 활동 (Team Activity)**
   - 활성 팀원: 12/15 명
   - 일일 커밋: 23개 (평균: 20개)
   - 평균 완료율: 92%

7. **인프라 비용 트렌드 (Cost Dashboard)**
   - 월 누적: $2,480 (예산 $2,500)
   - Datadog: $480 | Supabase: $500 | Vercel: $1,500
   - 7일 추세: 평탄 (비정상 증가 없음)

8. **다음 24시간 일정 (Scheduled Events)**
   - 예정 배포: 2026-05-30 10:00 (Travel-P2 UI)
   - 예정 DB 마이그레이션: 2026-05-31 18:00
   - 예정 Cron 점검: 매일 06:00, 12:00, 18:00 KST

---

## 대시보드 B: 팀 운영 대시보드 (프로젝트 기술 상태)

**목표:** 팀 리더 + Automation-Specialist가 실시간 프로젝트 상태 추적

**위젯 (12개):**

1. **프로젝트별 에러율 (Error Rate by Project)**
   - 막대 그래프: 각 프로젝트 지난 1시간 에러 비율
   - Asset-Master: 0.02% (🟢) / Travel: 0.05% (🟢) / Discord-Bot: 0% (배포됨)

2. **API 응답시간 분포 (API Latency P50/P95/P99)**
   - 선 그래프: 지난 24시간 추세
   - p50: 45ms | p95: 250ms | p99: 800ms
   - 목표: p95 < 500ms

3. **Cron 작업 상태 (Scheduled Jobs Health)**
   - Asset Health Snapshot: ✅ 6시간마다 정상 실행
   - Memory Auto Cron: ✅ 1시간마다 정상
   - Backup Cron: ✅ 매일 00:00 정상
   - 최근 실패: 없음 (복구됨)

4. **데이터베이스 슬로우 쿼리 (Top 10 Slow Queries)**
   - 쿼리: SELECT * FROM assets LEFT JOIN... (1200ms)
   - 호출: 145회/시간 (높음)
   - 개선: 인덱스 추천: idx_assets_status_updated_at

5. **의존성 상태 (Dependency Health)**
   - Supabase: ✅ 정상 (응답: 42ms)
   - Redis (메모리): ❌ 미사용 (계획 중)
   - GitHub Actions: ✅ 정상
   - 외부 API: ✅ 정상

6. **배포 파이프라인 상태 (Deployment Pipeline)**
   - 스테이징: ✅ 마지막 배포 2026-05-29 14:35 (성공)
   - 프로덕션: ✅ 마지막 배포 2026-05-29 13:20 (성공)
   - 진행 중: 없음
   - 대기 중: Travel-P2-UI (예정 2026-05-30 10:00)

7. **팀 활동 히트맵 (Team Activity Heatmap)**
   - 시간대별 활동 강도 (색상 진함)
   - 주로 활동: 09:00-18:00 KST + 09:00-18:00 IST (겹침: 12:30-18:00)
   - 낮은 활동: 22:00-07:00 (보정 필요)

8. **메모리 사용량 추이 (Memory Utilization)**
   - Node.js 프로세스: 평균 180MB (범위: 120-250MB)
   - PostgreSQL: 450MB (정상)
   - Hermes Gateway: 320MB (정상)
   - 임계값: 🟡 700MB / 🔴 900MB

9. **네트워크 대역폭 (Network I/O)**
   - 인바운드: 평균 2.5Mbps
   - 아웃바운드: 평균 1.8Mbps
   - 피크: 3.2Mbps (문제 없음)

10. **로그 수집 현황 (Log Ingestion Rate)**
    - Supabase 로그: 12K events/시간
    - Vercel 로그: 850 events/시간
    - Hermes Gateway: 340 events/시간
    - Node.js 앱: 2.1K events/시간
    - 총: 15.3K events/시간

11. **에러 추적 (Top Error Types, 24h)**
    - `Connection timeout (Supabase)`: 12건 (감소)
    - `Undefined function call`: 8건 (버그)
    - `Rate limit exceeded`: 5건 (정상)
    - `DB migration timeout`: 2건 (복구됨)

12. **SLA 준수도 (SLA Compliance)**
    - 가용성 (목표 99.5%): 99.8% ✅
    - 에러율 (목표 < 1%): 0.08% ✅
    - 응답시간 (목표 p95 < 500ms): 250ms ✅

---

## 대시보드 C: 개발자 대시보드 (디버깅 + 성능 최적화)

**목표:** 웹개발자 + 자동화전문가가 상세 진단

**위젯 (10개):**

1. **분산 추적 (APM Traces)**
   - 마이크로 서비스 호출 그래프
   - 예시: API /api/assets → Supabase 쿼리 (45ms) → Response (50ms)
   - 병목: 데이터베이스 쿼리

2. **에러 샘플링 (Error Stack Traces)**
   - 최근 에러 5개 상세 보기
   - 에러 유형, 발생 시간, 영향도, 수정 필요 여부

3. **데이터베이스 성능 분석 (DB Query Analysis)**
   - 슬로우 쿼리: SELECT * FROM assets WHERE... (1200ms)
   - 추천 인덱스: CREATE INDEX idx_assets_status ON assets(status, updated_at)
   - 실행 계획 시각화

4. **배포 전 체크리스트 (Pre-Deployment Checklist)**
   - 모든 테스트 통과: ✅ 47/47
   - 코드 리뷰 승인: ✅ 3/3
   - 보안 스캔: ✅ 0 위험도
   - 성능 회귀: ✅ 없음
   - 배포 예상 시간: 3분 20초

5. **환경 비교 (Staging vs Production)**
   - Staging 응답시간: 120ms | Production: 95ms
   - Staging 에러: 0.12% | Production: 0.08%
   - 데이터 행 수: Staging 100K | Production 520K (정상)

6. **웹훅 및 이벤트 로그 (Event Logs)**
   - Vercel 배포 완료: 2026-05-29 14:35
   - GitHub 푸시: 2026-05-29 14:30 (8 commits)
   - Supabase 스키마 변경: 2026-05-28 18:50
   - Cron 실행: 2026-05-29 18:00 (정상)

7. **실시간 로그 스트림 (Live Logs)**
   - 현재 로그 필터: 에러만 표시
   - 새 로그: [2026-05-29T18:25:34Z] ERROR - Connection timeout
   - 자동 스크롤: ON

8. **프로세스 모니터링 (Process Health)**
   - Hermes Gateway: ✅ 실행 중 (PID: 25490)
   - Node.js 앱: ✅ 실행 중 (4개 인스턴스)
   - PostgreSQL: ✅ 실행 중 (응답: 12ms)
   - Redis: ❌ 미사용

9. **보안 감시 (Security Events)**
   - 비정상 로그인: 0건
   - API 레이트 리밋 초과: 5건 (정상)
   - SQL 인젝션 감지: 0건
   - 권한 상승: 0건

10. **비용 추적 (Cost Attribution)**
    - 이 프로젝트(Asset Master)의 예상 월 비용
    - Supabase 스토리지: $15
    - Vercel: $200 (이 프로젝트)
    - Datadog: $80 (비례 배분)
    - 총: $295/월

---

# 3️⃣ 알림 규칙 (16개, 심각도별 에스컬레이션)

## 🔴 CRITICAL 알림 (5개) — 즉시 SMS + 전화

| # | 규칙명 | 조건 | 임계값 | 에스컬레이션 |
|---|--------|------|--------|-----------|
| 1 | 인프라 다운 | Uptime < 1분 | 연속 2회 | 즉시 Telegram → 2분 SMS → 5분 전화 |
| 2 | 데이터베이스 연결 상실 | 연결 실패 | 5초 이상 | 즉시 Telegram → 기술팀 전화 |
| 3 | 배포 실패 (Vercel) | 배포 진행 중 에러 | 연속 2회 실패 | Telegram + 웹개발자 SMS |
| 4 | Hermes Gateway 크래시 | 프로세스 종료 | 1분 이상 | 즉시 Telegram + 자동화팀 SMS |
| 5 | API 에러율 급증 | 에러율 > 10% | 5분 동안 지속 | Telegram + 경보음 |

---

## 🟡 WARNING 알림 (7개) — Slack 슬랙으로 알림

| # | 규칙명 | 조건 | 임계값 | 응답 시간 |
|---|--------|------|--------|---------|
| 1 | API 응답시간 증가 | p95 > 500ms | 10분 지속 | 15분 내 조사 |
| 2 | 데이터베이스 느린 쿼리 | 단일 쿼리 > 2초 | 연속 5회 | 인덱스 검토 |
| 3 | 메모리 사용량 높음 | > 70% | 10분 지속 | 메모리 누수 조사 |
| 4 | Cron 지연 | 예정 시간 초과 | 5분 이상 | 자동화팀 알림 |
| 5 | 배포 시간 초과 | 빌드 시간 > 10분 | 1회 발생 | Vercel 로그 검토 |
| 6 | 에러율 증가 | 에러율 > 1% | 5분 지속 | 에러 추적 열기 |
| 7 | 느린 쿼리 발견 | 쿼리 > 1초 | 각각 알림 | 개발자가 최적화 |

---

## 🔵 INFO 알림 (4개) — 로그 기록만

| # | 규칙명 | 조건 | 목적 |
|---|--------|------|------|
| 1 | Cron 완료 | 작업 정상 완료 | 자동화 확인 |
| 2 | 배포 완료 | Vercel 배포 성공 | 배포 추적 |
| 3 | 데이터베이스 마이그레이션 | 스키마 변경 완료 | 감사 추적 |
| 4 | 팀 활동 요약 | 시간별 활동 집계 | 대시보드 용 |

---

## 에스컬레이션 플로우

```
CRITICAL 알림 발생
    ↓
즉시 Telegram @devops_channel 알림 (자동)
    ↓ 2분 경과 후 응답 없으면
SMS 발송 (DevOps Engineer 개인)
    ↓ 5분 경과 후 응답 없으면
전화 통화 (기술팀 리더)
    ↓ 10분 경과 후
사건 관리 시스템 자동 등록 (PagerDuty)

SUCCESS: 수동으로 확인 + Resolved 마크
```

---

# 4️⃣ 로그 집계 전략

## 로그 소스별 수집 (4개)

### Source 1: Supabase PostgreSQL 로그

**위치:** `<supabase-project>.supabase.co/logs/database`

**로그 타입:**
- 느린 쿼리 (> 100ms)
- 연결 실패
- 스키마 변경
- 성능 통계

**수집 방법:**
```bash
# pg_stat_statements 활성화
SELECT query, calls, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

# Supabase API를 통한 로그 수집
curl https://api.supabase.io/v1/projects/{PROJECT_ID}/analytics/logs \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  | jq . | send_to_datadog
```

**수집 빈도:** 1분마다
**월 데이터 크기:** ~2GB (보관: Datadog 180일)

---

### Source 2: Vercel 배포 로그

**위치:** `vercel.com/team/[team]/project/[project]/deployments`

**로그 타입:**
- 빌드 시작/완료
- 빌드 오류
- 배포 성공/실패
- 배포 소요 시간

**수집 방법:**
```bash
# Vercel API 웹훅 설정
POST https://api.vercel.com/v13/integrations/webhook

# Webhook 페이로드 예시:
{
  "deployment": {
    "id": "dpl_...",
    "state": "READY|BUILDING|ERROR",
    "buildingAt": 1685376000000,
    "createdAt": 1685375900000
  }
}

# Datadog로 직송
curl -X POST https://http-intake.logs.datadoghq.com/v1/input \
  -H "Content-Type: application/json" \
  -d '{"deployment": {...}}' \
  -H "DD-API-KEY: $DATADOG_API_KEY"
```

**수집 빈도:** 실시간 (웹훅)
**월 데이터 크기:** ~500MB

---

### Source 3: Hermes Gateway 로그

**위치:** `/home/jeepney/.hermes/logs/`

**로그 파일:**
- `gateway.log` — 주요 이벤트
- `errors.log` — 에러만
- `cron-activity.log` — Cron 실행 추적

**로그 타입:**
- 프로세스 시작/종료
- Cron 실행
- API 호출
- 에러 스택

**수집 방법:**
```bash
# 로그 파일 모니터링 (Filebeat)
filebeat install --system-wide

# filebeat.yml 설정
filebeats.inputs:
- type: log
  enabled: true
  paths:
    - /home/jeepney/.hermes/logs/*.log
  
output.datadog:
  api.key: $DATADOG_API_KEY
  site: datadoghq.com
```

**수집 빈도:** 실시간 (파일 추적)
**월 데이터 크기:** ~1.5GB

---

### Source 4: Node.js 애플리케이션 로그

**위치:** 각 Node.js 프로세스 stdout/stderr

**로그 타입:**
- 요청/응답
- 데이터베이스 쿼리
- 에러 스택
- 성능 메트릭

**로그 수집 방법:**
```javascript
// Express 미들웨어로 로깅
const winston = require('winston');
const DatadogWinston = require('datadog-winston');

const logger = winston.createLogger({
  transports: [
    new DatadogWinston.DatadogTransport({
      apiKey: process.env.DATADOG_API_KEY,
      hostname: 'asset-master-api-prod',
      service: 'asset-master-backend',
      ddsource: 'nodejs',
      ddtags: `env:production,version:${process.VERSION}`
    })
  ]
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    userId: req.user?.id,
    statusCode: res.statusCode,
    duration: Date.now() - req.startTime
  });
  next();
});
```

**수집 빈도:** 실시간 (각 요청 후)
**월 데이터 크기:** ~1GB

---

## 로그 수집 아키텍처

```
4개 로그 소스
  ├─ Supabase 로그 → Datadog API (1분 배치)
  ├─ Vercel 웹훅 → Datadog API (실시간)
  ├─ Hermes Gateway → Filebeat → Datadog (실시간)
  └─ Node.js 앱 → Winston Logger → Datadog (실시간)
          ↓
      Datadog 중앙 저장소
          ↓
  로그 파이프라인 처리
  (파싱, 태깅, 필터링)
          ↓
  보관 정책 적용
  (180일 보관, 이전 S3 아카이브)
          ↓
  대시보드/알림 활용
```

---

## 월 데이터 크기 계산

| 소스 | 일일 | 월 합 | 보관 기간 |
|------|------|--------|---------|
| Supabase | 65MB | 2GB | 180일 (Datadog) |
| Vercel | 16MB | 500MB | 180일 |
| Gateway | 50MB | 1.5GB | 180일 |
| Node.js | 33MB | 1GB | 180일 |
| **합계** | **164MB** | **5GB** | **180일 온라인 + S3 아카이브** |

**저장 비용:**
- Datadog 보관: 포함됨 (Standard plan)
- S3 장기 보관: $30/월 (6개월 이상)

---

# 5️⃣ KPI 메트릭 (8개)

## 메트릭 정의 및 측정

| # | KPI | 정의 | 측정 방법 | 목표 | 빈도 |
|---|-----|------|----------|------|------|
| 1 | **API 응답시간 (p95)** | 95번째 백분위수 응답 시간 | Datadog APM | < 500ms | 실시간 |
| 2 | **에러율** | 전체 요청 중 에러 비율 | Error tracking | < 1% | 실시간 |
| 3 | **데이터베이스 쿼리 시간 (p99)** | 가장 느린 1% 쿼리 | pg_stat_statements | < 2000ms | 1분마다 |
| 4 | **배포 성공률** | 성공한 배포 / 전체 배포 | Vercel API | > 95% | 배포마다 |
| 5 | **가용성 (Uptime)** | 정상 작동 시간 비율 | Synthetic monitoring | > 99.5% | 1분마다 |
| 6 | **Cron 정시 성공률** | 예정 시간에 완료된 Cron | 자동화 로그 | 100% | Cron 실행마다 |
| 7 | **메모리 사용량 (p95)** | 95번째 백분위수 메모리 | Process monitoring | < 300MB | 1분마다 |
| 8 | **월 비용** | 모든 인프라 월별 비용 | 청구서 집계 | < $2,500 | 월마다 |

---

## SLO 정의 (Service Level Objectives)

### SLO 1: 가용성 99.5%
- **정의:** 99.5% 이상의 시간 동안 서비스 정상 작동
- **측정:** `(정상 요청 수 / 전체 요청 수) × 100`
- **목표:** 월 99.5% 이상 (최대 허용 다운타임: 3.6시간/월)
- **위반 시:** 즉시 CRITICAL 알림

### SLO 2: 에러율 < 1%
- **정의:** 전체 API 요청 중 에러 비율 < 1%
- **측정:** `(실패한 요청 수 / 전체 요청 수) × 100`
- **목표:** 1% 이하 유지
- **위반 시:** WARNING 알림

### SLO 3: API 응답시간 (p95) < 500ms
- **정의:** 95% 이상의 요청이 500ms 이내에 응답
- **측정:** `PERCENTILE(response_time, 95)`
- **목표:** 500ms 이하
- **위반 시:** WARNING 알림 + 데이터베이스 최적화

### SLO 4: 배포 성공률 > 95%
- **정의:** 성공한 배포 / 전체 배포 시도
- **측정:** `(성공 배포 수 / 전체 배포 수) × 100`
- **목표:** 95% 이상
- **위반 시:** 배포 프로세스 검토

---

# 6️⃣ 구현 로드맵 (3단계, 6일)

## Phase 1: Setup (2026-06-01 ~ 06-02)
**목표:** Datadog 계정 생성 + API 키 발급 + 기본 수집 시작

**Day 1 (2026-06-01)**
- ✅ Datadog 계정 생성 (Standard plan)
- ✅ API 키 생성 + 환경 변수 설정
- ✅ Supabase 로그 수집 설정 (pg_stat_statements)
- ✅ Vercel 웹훅 연결
- 예상 소요: 2-3시간

**Day 2 (2026-06-02)**
- ✅ Hermes Gateway Filebeat 설치 + 설정
- ✅ Node.js 앱에 Winston Logger 통합
- ✅ 모든 로그 소스 정상 수집 확인
- 예상 소요: 3-4시간

---

## Phase 2: Dashboards (2026-06-03 ~ 06-05)
**목표:** 3가지 대시보드 구축 + 16개 알림 규칙 설정

**Day 3 (2026-06-03)**
- ✅ CEO 대시보드 생성 (8 위젯)
- ✅ 기본 메트릭 시각화

**Day 4 (2026-06-04)**
- ✅ 팀 운영 대시보드 (12 위젯)
- ✅ 개발자 대시보드 (10 위젯)
- 예상 소요: 1-2일

**Day 5 (2026-06-05)**
- ✅ 16개 알림 규칙 설정 (CRITICAL/WARNING/INFO)
- ✅ Slack/Telegram 채널 연결
- ✅ 에스컬레이션 플로우 테스트
- 예상 소요: 1-2일

---

## Phase 3: Fine-tuning (2026-06-05 ~ 06-06)
**목표:** 알림 임계값 조정 + SLA 모니터링 시작

**Day 6 (2026-06-05 ~ 06-06)**
- ✅ 알림 임계값 조정 (거짓 양성 제거)
- ✅ SLO 대시보드 활성화
- ✅ 팀 교육 (대시보드 사용법)
- ✅ 1주일 모니터링 후 최종 승인
- 예상 소요: 1-2일

**완료 기준:**
- 모든 메트릭 수집 정상 (데이터 누락 < 1%)
- 알림 오류율 < 5% (거짓 양성 최소화)
- 팀 전원이 대시보드 사용 가능
- CEO 대시보드에서 KPI 실시간 조회 가능

---

# 7️⃣ 월별 운영비 추정

## 월 비용 구성

| 항목 | 단가 | 수량 | 월 비용 |
|------|------|------|--------|
| **Datadog Standard** | $1/유저 | 500 users (예상) | $480 |
| **AWS S3 로그 아카이브** | $0.023/GB | 150GB (6개월) | $30 |
| **Slack 알림 (추가 API)** | 무료 | 포함됨 | $0 |
| **SMS 알림 (Twilio)** | $0.0075/SMS | 150 SMS/월 | $1.13 |
| **기타 (버퍼)** | - | - | $10 |
| **합계** | - | - | **$521/월** |

### 기존 비용 (별도)
- Supabase: $500/월 (PostgreSQL + 로그)
- Vercel: $1,500/월 (Pro plan)
- **총 인프라:** $2,500/월

---

# 8️⃣ 운영 가이드

## 대시보드 해석 규칙

### CEO 대시보드 검사 항목 (매일 09:00)
1. **가동시간**: 🟢 > 99% 확인
2. **프로젝트 진행률**: 모두 🟢 > 90%?
3. **알림**: CRITICAL 없음?
4. **배포 안정성**: 이번 주 > 95%?
5. **비용 추세**: 예산 내?

### 팀 대시보드 검사 항목 (1시간마다)
1. **에러율**: 1% 미만?
2. **Cron 작업**: 모두 정상 실행?
3. **슬로우 쿼리**: 인덱스 필요한 쿼리?
4. **배포 진행**: 대기 중인 배포?

### 개발자 대시보드 사용 시기
- 배포 전: 모든 테스트 통과 확인
- 에러 발생: 스택 추적 열기
- 성능 저하: 쿼리 분석 및 최적화

---

## 정상 메트릭 범위

| 메트릭 | 🟢 정상 | 🟡 주의 | 🔴 경고 |
|--------|--------|--------|--------|
| Uptime | > 99.5% | 99-99.5% | < 99% |
| API 응답 (p95) | < 300ms | 300-500ms | > 500ms |
| 에러율 | < 0.5% | 0.5-1% | > 1% |
| DB 응답 (p95) | < 100ms | 100-300ms | > 300ms |
| 메모리 | < 50% | 50-70% | > 70% |
| Cron 정시 | 100% | 99% | < 99% |
| 배포 성공 | > 95% | 85-95% | < 85% |

---

# 9️⃣ 마이그레이션 계획

## 기존 모니터링 → Datadog 이행

**현재 상태:**
- Supabase 로그 대시보드 (기본 기능만)
- Vercel 배포 로그 (Vercel 대시보드)
- Hermes Gateway 로그 (수동 확인)
- 애플리케이션 로그 (분산됨)

**Datadog 이행 단계:**

1. **병렬 운영 (1주)**
   - 기존 방식 유지하며 Datadog 수집 시작
   - 데이터 정합성 확인

2. **점진적 전환 (1주)**
   - Datadog 대시보드 주요 사용으로 변경
   - 기존 대시보드 보조로 유지

3. **전환 완료 (1주)**
   - 모든 팀이 Datadog 사용
   - 기존 로그 수집 종료

---

# 🔟 최종 정리

## 설계 요약

**선택 사항:**
- ✅ **Datadog Standard** — $480/월
- ✅ **3가지 대시보드** — CEO / 팀 운영 / 개발자
- ✅ **16개 알림 규칙** — CRITICAL(5) / WARNING(7) / INFO(4)
- ✅ **4가지 로그 소스** — Supabase, Vercel, Gateway, Node.js
- ✅ **8개 핵심 KPI** — 응답시간, 에러율, 배포율, 가용성 등
- ✅ **SLO 4가지** — 가용성 99.5%, 에러 < 1%, 응답 < 500ms, 배포 > 95%
- ✅ **3단계 구현** — Setup (1-2일) → Dashboards (2-3일) → Fine-tuning (1-2일)

**기대효과:**
- 🟢 **실시간 가시성** — 전체 인프라 상태 한눈에 파악
- 🟢 **신속한 대응** — 문제 발생 시 2분 내 알림
- 🟢 **팀 협력** — 모든 팀원이 동일 정보로 의사결정
- 🟢 **비용 최적화** — 리소스 낭비 감지 및 축소

**완료 조건:**
- ✅ 모든 로그 소스 수집 정상 (누락 < 1%)
- ✅ 알림 오류율 < 5% (거짓 양성 제거)
- ✅ CEO 대시보드 실시간 데이터 표시
- ✅ 팀 교육 및 운영 가이드 완성

---

**설계 상태:** 🟢 **완성 (구현 준비 완료)**

담당: DevOps Engineer (Phase C #12)

제출일: 2026-05-29

마감: 2026-06-05 18:00 KST

**Last Updated:** 2026-05-29 11:27 KST (DevOps Engineer design sprint completion)
