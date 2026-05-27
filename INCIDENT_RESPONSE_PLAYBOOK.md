---
name: 사건 대응 절차 (Incident Response Playbook)
description: DSC FMS Portal 15명 팀의 P0/P1/P2 알림에 대한 실시간 대응 절차 및 에스컬레이션 가이드
author: DevOps Engineer (Phase C #12)
date: 2026-05-28
version: 1.0
---

# 사건 대응 절차 (Incident Response Playbook)

**목적:** Datadog 알림 수신 후 신속한 대응 및 복구를 위한 단계별 절차 정의  
**범위:** P0 Critical, P1 High, P2 Medium 알림 및 온콜 로테이션  
**신뢰도 목표:** P0 5분 감지 → 10분 내 조치, P1 30분 내 대응, P2 4시간 내 대응  

---

## 1. 온콜 로테이션 (On-Call Rotation)

### 1.1 팀 역할 배정

| 역할 | 담당자 | 시간대 | 책임 |
|------|--------|--------|------|
| **P0 On-Call** | Tech Lead + DevOps Eng | 24/7 | P0 Critical 즉시 대응 |
| **P1 On-Call** | Platform Engineer | 09:00-18:00 KST | P1 High 대응 (업무시간) |
| **P2 Reviewer** | Senior Backend | 매일 09:00 | P2 Medium 일일 리뷰 |
| **Manager** | 나경태 (CEO) | 긴급시 | P0 에스컬레이션 |

### 1.2 로테이션 일정

- **P0 On-Call:** 일주일 단위, 월요 09:00 KST 변경
- **P1 On-Call:** 2주 단위, 첫 월요 변경
- **백업:** 각 역할마다 2명씩 지정 (담당자 부재 시)

### 1.3 온콜 도구 및 접근

```bash
# 온콜 로테이션 상태 확인
curl https://api.datadoghq.com/api/v1/schedule \
  -H "DD-API-KEY: $DATADOG_API_KEY" | jq '.schedule'

# Telegram P0 채널 구독 (봇 추가: @DSCMonitorBot)
# Slack #critical-alerts 채널 구독
# 개인 휴대폰 SMS/전화 수신 설정
```

---

## 2. P0 Critical — 5분 내 감지 & 10분 내 첫 조치

### 2.1 P0 알림 받았을 때 (IMMEDIATE ACTION)

**1단계: 확인 (1분 이내)**
```
[ ] Telegram 또는 Slack에서 알림 수신 확인
[ ] Datadog 대시보드 열기 (System Overview → Real-time metrics)
[ ] Incident 심각도 재검증 (거짓 경보 확인)
[ ] Slack #critical-alerts에 "Acknowledged {incident_id}" 메시지 발송
```

**2단계: 진단 (3분 이내)**
```
[ ] Datadog → APM traces → 해당 서비스 trace 링크 확인
[ ] Slow query / Error logs 수집
[ ] 영향받은 기능 범위 파악 (API down? DB? Frontend?)
[ ] 최근 배포/변경 이력 확인 (Git commit log)
```

**3단계: 첫 조치 (10분 이내)**
```
[ ] Incident ticket 생성 (Slack: /incident create "P0: {title}")
[ ] 영향받은 팀원들에게 통보 (Slack DM)
[ ] 자동 복구 가능 여부 판단:
    - 가능 → 자동 재시작/failover 실행
    - 불가능 → 수동 복구 단계로 진행
[ ] Slack #critical-alerts에 진행 상황 업데이트
```

### 2.2 P0 알림별 대응 플레이북

#### P0-001: API 가용성 < 95% (5분 지속)

**증상:** 
- API 응답 없음 또는 500 에러 다발
- 프론트엔드 사용자 차단

**대응:**
```bash
# 1. API 서버 상태 확인
curl -I https://api.dsc-fms.vercel.app/health
# 응답: 200 OK = 정상, 503/timeout = 다운

# 2. 최근 배포 확인
curl -s https://api.vercel.com/v13/deployments \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq '.deployments[0:3]'

# 3. 즉시 조치 옵션:
# 옵션 A) Vercel rollback (마지막 성공한 빌드로)
# 옵션 B) API 서버 재시작 (On-premise)
# 옵션 C) failover (백업 API로 전환)

# 4. 조치 후 상태 재확인
for i in {1..10}; do curl -I https://api.dsc-fms.vercel.app/health; sleep 3; done
```

**복구 확인:**
- [ ] API response 200 OK
- [ ] Error rate < 1%
- [ ] P95 latency < 500ms
- [ ] 2분 이상 안정 유지

#### P0-002: 데이터베이스 연결 고갈 (>45개 활성)

**원인:** 연결 누수, 쿼리 지연, 연결 풀 부족

**대응:**
```sql
-- 1. 현재 연결 상태 확인
SELECT count(*) as active_connections, 
       state 
FROM pg_stat_activity 
GROUP BY state;

-- 2. 오래된 idle 연결 종료 (5분 이상 유휴)
SELECT pid, usename, application_name, state_change 
FROM pg_stat_activity 
WHERE state = 'idle' 
  AND state_change < now() - interval '5 minutes';

SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < now() - interval '5 minutes';

-- 3. 느린 쿼리 강제 종료 (>30초 실행)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE duration > interval '30 seconds';

-- 4. 연결 풀 설정 재조정
-- /app/lib/db.ts → maxConnections 증가 (25 → 40)
```

**모니터링:**
- [ ] 활성 연결 < 40
- [ ] Wait event < 5% of queries
- [ ] Query latency 정상화

#### P0-003: Supabase API Down (health != 200)

**대응:**
```bash
# 1. Supabase 상태 페이지 확인
curl https://status.supabase.com/api/v2/component.json | jq '.components[] | select(.name=="API")'

# 2. API 서버에서 Supabase 연결 재시도
curl -X POST https://api.dsc-fms.vercel.app/api/reconnect-supabase \
  -H "Authorization: Bearer $INTERNAL_TOKEN"

# 3. 메모리 시스템 영향 확인
curl http://localhost:3009/health | jq '.supabase_status'

# 4. 임시 대체 (있는 경우)
export SUPABASE_BACKUP_URL="..." # 백업 DB 연결 문자열
# API 재시작

# 5. CEO + Tech Lead 긴급 통보 (Telegram + SMS)
```

**복구 확인:**
- [ ] Supabase 상태 페이지: All systems operational
- [ ] /api/health 응답: 200 OK
- [ ] DB 쿼리 지연 < 100ms
- [ ] 모든 팀 에이전트 정상 작동

#### P0-004: SLA Breach (99.9% < 실제 uptime, 1시간 window)

**대응:**
```
[ ] 지난 1시간 downtime 기간 파악 (Datadog timeline)
[ ] 근본 원인 분석 (P0-001~003 중 해당 사항)
[ ] 영향받은 사용자 수/기능 정량화
[ ] 재발 방지 대책 수립 (기술 또는 프로세스)
[ ] CEO 및 stakeholder 사후 보고서 작성
```

#### P0-005: 디스크 사용량 > 90%

**대응:**
```bash
# 1. 디스크 사용량 확인
df -h /data/supabase | tail -1

# 2. 자동 정리 실행
# Database
PGPASSWORD=$DB_PASSWORD psql -U postgres -d dsc_fms -c "VACUUM ANALYZE;"

# 로그 아카이빙
find /var/log -type f -name "*.log" -mtime +30 -exec gzip {} \;
mv /var/log/*.gz /archive/logs/2026-05/

# Temporary files
rm -rf /tmp/* /var/tmp/*

# 3. 재확인
df -h /data/supabase

# 4. 임계값 재평가 (지속적으로 > 80% 추세라면)
# Supabase → Database → Configure → Increase storage
```

---

## 3. P1 High — 30분 내 대응 (15분 감지)

### 3.1 P1 대응 단계

**1단계: 확인 및 로깅 (10분 이내)**
```
[ ] Email + Slack 알림 수신 확인
[ ] Datadog 대시보드에서 해당 메트릭 추이 확인
[ ] Slack #performance (또는 #batch-jobs) 채널 검토
[ ] 자동 수집된 로그/traces 링크 확인
```

**2단계: 근본 원인 분석 (15분 이내)**
```
[ ] APM trace graph 분석 (어느 단계에서 지연?)
[ ] Slow query log 검토
[ ] 최근 코드/데이터 변경 사항 확인
[ ] 외부 의존성 상태 점검 (예: 3rd-party API)
```

**3단계: 임시 조치 또는 복구 (20분 이내)**
```
[ ] 긴급 수정 필요? → 코드 패치 + 재배포
[ ] 설정 조정? → 데이터베이스 인덱스, 캐시 정책 등
[ ] 모니터만? → 지속 감시 하며 다음 maintenance window에서 해결
```

### 3.2 P1 알림별 대응 플레이북

#### P1-001: API Response Time P95 > 500ms

```bash
# 1. 영향받은 엔드포인트 파악
curl "https://api.datadoghq.com/api/v1/query" \
  -H "DD-API-KEY: $DD_API_KEY" \
  -d "query=avg:trace.web.response_time.p95{env:prod} by {resource_name}"

# 2. Slow query 식별
PGPASSWORD=$DB_PASSWORD psql -U postgres -d dsc_fms -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements 
   WHERE mean_exec_time > 100 ORDER BY mean_exec_time DESC LIMIT 10;"

# 3. Query 실행 계획 분석
PGPASSWORD=$DB_PASSWORD psql -U postgres -d dsc_fms -c \
  "EXPLAIN ANALYZE SELECT * FROM assets WHERE status='active' LIMIT 1000;"

# 4. 인덱스 추가 또는 쿼리 최적화
# 예: CREATE INDEX idx_assets_status ON assets(status, updated_at);

# 5. 캐시 조정 (Redis)
redis-cli INFO stats | grep used_memory
redis-cli CONFIG GET maxmemory
```

#### P1-002: Cron Job Failure (연속 2회)

```bash
# 1. 최근 cron 실행 로그 확인
tail -50 /var/log/cron.log | grep "asset-import"

# 2. 실패 원인 파악
# 에러 메시지 분류: (a) DB 연결, (b) 데이터 유효성, (c) timeout, (d) 외부 API

# 3. 자동 재시도 (1회, jitter 60초)
sleep $((RANDOM % 60 + 60))
/home/jeepney/.openclaw/scripts/asset-import.sh

# 4. 지속 실패 시
[ ] 수동 데이터 검증
[ ] 다음 scheduled run까지 모니터링
[ ] 24시간 내 근본 원인 리뷰
```

#### P1-003: Memory Automation Trust Score Error

```bash
# 1. 에러 로그 수집
curl http://localhost:3009/api/trust-score/errors | jq '.errors[:10]'

# 2. 무효 항목 확인
curl http://localhost:3009/api/memory/duplicates?status=error | jq '.count'

# 3. 복구 작업
# 옵션 A) 무효 항목 재처리
POST http://localhost:3009/api/memory/reprocess-errors

# 옵션 B) Trust score 재계산 (전체)
POST http://localhost:3009/api/trust-score/recalculate \
  -d '{"scope": "all", "force": true}'

# 4. 모니터링
[ ] Error count 감소 추이 확인
[ ] Trust score 정상 범위 (75-95%) 복구
```

---

## 4. P2 Medium — 하루 내 대응 (1시간 감지)

### 4.1 P2 대응 절차

**일일 P2 리뷰 (9:00 AM KST)**
```
[ ] 전야 P2 알림 모음 확인 (Slack #monitoring-daily)
[ ] 각 알림의 현재 상태 (진행 중 / 해결 / 지속)
[ ] 우선순위 정렬 (높음 → 중간 → 낮음)
[ ] 담당자 배정 및 해결 일정 수립
```

**해결 방법 (사례별)**
- **Cache Hit < 80%:** Index optimization 계획 수립, 느린 쿼리 마킹
- **Backup < 99%:** 미발송 파일 분석, 재시도 정책 검토
- **Slow Query > 5/day:** Execution plan 개선, 다음 maintenance에 스케줄
- **Team Utilization < 90%:** 팀 상태 리포트, 에이전트 할당 재조정

---

## 5. 근본 원인 분석 (RCA: Root Cause Analysis) Template

### 5.1 RCA 보고서 작성 (모든 P0 + 중복된 P1 필수)

**작성 시점:** 사건 해결 후 2시간 내  
**템플릿:**

```markdown
## RCA: {Incident Title}

**Incident ID:** {ID}  
**Severity:** P0 | P1 | P2  
**Detected:** {시간}  
**Resolved:** {시간}  
**Duration:** {분} minutes  

### Summary
{한 문장 요약}

### Timeline
| Time (KST) | Event |
|------------|-------|
| 14:23 | Alert triggered |
| 14:25 | Acknowledged |
| 14:32 | Root cause identified |
| 14:45 | Fix deployed |

### Root Cause
{기술적 원인 상세 분석}

### Contributing Factors
- [ ] Code bug
- [ ] Configuration error
- [ ] Insufficient monitoring
- [ ] Dependency failure
- [ ] Data corruption
- [ ] Other: ___

### Immediate Action Taken
{사건 종료를 위해 취한 조치}

### Preventive Measures
1. {재발 방지 기술적 개선}
2. {프로세스 개선}
3. {모니터링 강화}

### Owner & ETA
- **RCA Owner:** {담당자}
- **Fix Owner:** {개발자}
- **Verification ETA:** {날짜}
```

---

## 6. 사후 검토 (Post-Incident Review)

### 6.1 정기 사후 검토 회의

**일정:** 매주 수요일 14:00 KST  
**참석자:** DevOps Eng + Tech Lead + 관련 팀원  
**의제:**

```
1. 지난주 P0 사건 분석 (있으면)
   - RCA 결과 검토
   - 예방 조치 진행 상황
   
2. 반복된 P1 패턴 검토
   - 근본 해결이 필요한 항목
   - 리소스 배정 논의
   
3. 모니터링 개선 아이디어
   - 거짓 경보 제거
   - 감지 시간 단축
   - 새로운 알림 규칙 제안

4. 온콜 피드백
   - 도구 및 프로세스 개선
   - 에스컬레이션 경로 검토
```

### 6.2 지표 추적 (SLA 준수 확인)

| 지표 | 목표 | 측정 주기 |
|------|------|---------|
| P0 MTTR (Mean Time To Resolve) | < 30분 | 월별 |
| P0 감지 시간 | < 5분 | 월별 |
| P1 해결율 (24시간 이내) | > 95% | 주별 |
| P2 백로그 | < 10건 | 주별 |
| On-call 응답률 | 100% | 월별 |

---

## 7. 비상 연락처 및 리소스

### 7.1 긴급 연락처

```
기술 문제 (API, DB):
  - Tech Lead: Slack @tech-lead (또는 SMS)
  - 2차: Senior Backend: Slack @backend

메모리 시스템 문제:
  - Memory Specialist: Slack @memory-eng

인프라/배포:
  - DevOps Eng: Slack @devops (또는 전화)

최고 에스컬레이션:
  - CEO 나경태: Telegram @kyeongtae.na (긴급시만)
```

### 7.2 대시보드 및 도구 빠른 접근

```
Datadog 대시보드:
  - System Overview: https://app.datadoghq.com/dashboard/system-overview
  - Incident Board: https://app.datadoghq.com/monitors/triggered

API 상태 페이지:
  - Vercel Deployments: https://vercel.com/dashboard/deployments
  - Supabase Status: https://status.supabase.com

로그 수집 도구:
  - Datadog Logs: https://app.datadoghq.com/logs
  - Database Logs: pg_stat_statements query
```

---

**문서 버전:** 1.0  
**최종 갱신:** 2026-05-28  
**다음 검토:** 2026-06-30  
