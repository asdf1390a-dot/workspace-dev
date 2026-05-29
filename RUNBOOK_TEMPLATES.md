# 사건 대응 플레이북 & 에스컬레이션 규칙

## 📋 목표

DevOps/Web-Builder 팀이 장애 발생 시 신속하게 대응할 수 있도록 자동화된 경고 규칙, 에스컬레이션 절차, 사후분석 템플릿 정의.

---

## 1️⃣ 자동 에스컬레이션 규칙

### 1.1 심각도별 에스컬레이션 체인

```
🔴 CRITICAL (0-5분)
├─ 즉시 (0분)
│  ├─ Slack #긴급-장애 채널 (모든 메시지 + 멘션)
│  ├─ SMS/전화로 DevOps 온콜 호출
│  ├─ CEO에게 이메일 + 카톡
│  └─ PagerDuty 창 열기 (자동 할당)
├─ 5분 내 (확인 단계)
│  ├─ 온콜 엔지니어 첫 응답
│  ├─ 원인 파악 시작
│  └─ Slack에 "감지함" 반응 (🔴)
└─ 30분 (해결 목표)
   ├─ 임시 해결책(workaround) 또는 롤백
   └─ 근본 원인 분석 시작

🟡 HIGH (5-30분)
├─ 5분 이내
│  ├─ Slack #경고 채널
│  ├─ 담당팀 멘션 (@Web-Builder 또는 @DevOps)
│  └─ 문제 상황 기술 (3줄 이내)
├─ 30분 이내
│  ├─ 팀원이 Slack에서 "확인함" 표시
│  ├─ 디버깅 시작
│  └─ 추정 복구 시간 공지
└─ 2시간 내 (완전 해결)
   └─ 상태 업데이트 + 모니터링 확대

🟢 MEDIUM (30분-24시간)
├─ 30분 이내
│  ├─ Slack #알림 채널 (자동 포스트)
│  └─ 일일 스탠드업에서 검토
└─ 24시간 내
   └─ 개선안 수립 및 실행 계획
```

### 1.2 온콜 로테이션 (On-Call Rotation)

```
주간 온콜 스케줄 (월-일 자정 UTC+9)

Week 1 (5/26-6/01)
├─ 월-화 (5/26-5/27): DevOps Engineer #1
├─ 수-목 (5/28-5/29): Web-Builder #1
├─ 금-일 (5/30-6/01): Automation-Specialist

Week 2 (6/02-6/08)
├─ 월-화 (6/02-6/03): DevOps Engineer #2
├─ 수-목 (6/04-6/05): Web-Builder #2
├─ 금-일 (6/06-6/08): Data-Analyst

온콜 의무
├─ 업무시간: 09:00-18:00 KST (항상 Slack 확인)
├─ 야간: 18:00-09:00 (휴대폰 켜짐, SMS 수신)
├─ 주말: 긴급 호출만 응답 (자동 답장 설정)
└─ 휴가 중: 대체자 배정 필수
```

---

## 2️⃣ 사건 대응 플레이북 (Incident Response Playbooks)

### 플레이북 #1: 배포 실패 (DEPLOY_FAILURE)

**트리거 규칙:** `DEPLOY-001, DEPLOY-002, DEPLOY-003`

**증상:**
- Vercel 빌드 실패 메시지
- GitHub Actions 워크플로우 중단
- 배포 후 헬스체크 실패 (HTTP 502/503)

**단계별 대응:**

**단계 1: 즉시 확인 (0-2분)**
```bash
# 1-1. Vercel 배포 상태 확인
vercel deployments --token=$VERCEL_TOKEN | head -20

# 1-2. GitHub Actions 로그 확인
gh run view --repo=owner/repo $(gh run list --repo=owner/repo --limit=1 --json databaseId)

# 1-3. 현재 프로덕션 상태 확인
curl -s -w "%{http_code}" https://target-app.vercel.app/api/health

# 결과에 따라
├─ HTTP 200 OK → 배포 성공, 캐시 문제일 수 있음
├─ HTTP 502/503 → 서비스 미시작, 5분 대기 후 재확인
├─ HTTP 500 → 애플리케이션 에러, 로그 분석 필요
└─ 연결 거부 → 배포 중단됨, 자동 롤백 필요
```

**단계 2: 원인 파악 (2-10분)**

**시나리오 A: 빌드 실패 (에러 로그에 구문오류)**
```bash
# A-1. 빌드 로그 상세 조회
vercel logs --repo=owner/repo 2>&1 | tail -50

# A-2. 최근 커밋 확인
git log --oneline -5

# A-3. 변경사항 확인
git diff HEAD~1 HEAD -- package.json tsconfig.json

# 대응
├─ 구문오류 → 즉시 수정 커밋
├─ 의존성 버전 충돌 → package-lock.json 재생성
└─ 타입스크립트 오류 → tsc --noEmit로 로컬 검증
```

**시나리오 B: 배포 성공했으나 런타임 에러**
```bash
# B-1. Vercel 함수 로그 확인
curl https://api.vercel.com/v13/deployments/{deploymentId}/logs \
  -H "Authorization: Bearer $VERCEL_TOKEN"

# B-2. 데이터베이스 연결 상태
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"

# B-3. 환경 변수 확인
vercel env list --prod

# 대응
├─ DB 연결 실패 → Supabase 상태 확인, 연결 풀 초기화
├─ 환경 변수 누락 → 누락된 변수 추가 후 배포 재시작
└─ 메모리 부족 → Vercel 인스턴스 업그레이드 필요
```

**단계 3: 즉시 조치 (10-15분)**

| 상황 | 조치 |
|-----|------|
| 코드 오류 (구문/타입) | 핫픽스 커밋 → `git push` → Vercel 자동 재배포 |
| 환경 변수 누락 | `vercel env add KEY=VALUE` → 배포 재시작 |
| DB 연결 실패 | Supabase 헬스체크, 연결 풀 재설정, 로드밸런싱 확인 |
| 메모리/CPU 부족 | Vercel "Enhanced" 인스턴스로 업그레이드 |

**단계 4: 모니터링 (15분+)**
```bash
# 배포 후 실시간 모니터링
watch -n 5 'curl -s https://target-app.vercel.app/api/health | jq'

# Datadog 메트릭 실시간 확인
# 대시보드: DEPLOYMENT_STATUS (p95 응답시간, 에러율)

# 롤백이 필요한 경우
git revert HEAD  # 이전 커밋으로 되돌림
git push         # 자동 재배포
```

---

### 플레이북 #2: 데이터베이스 응답시간 급증 (DB_SLOWDOWN)

**트리거 규칙:** `DB-001, DB-003, DB-004`

**증상:**
- Datadog: p95 응답시간 > 500ms
- Slack 경고: "Slow Query Detected"
- 사용자 신고: "포털이 느립니다"

**단계별 대응:**

**단계 1: 즉시 상태 확인 (0-3분)**
```sql
-- Supabase 콘솔 (SQL Editor)

-- 1-1. 현재 활성 연결 수
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- 1-2. 가장 느린 쿼리 조회
SELECT 
  mean_exec_time,
  calls,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 500  -- 500ms 이상
ORDER BY mean_exec_time DESC
LIMIT 5;

-- 1-3. 테이블별 인덱스 상태
SELECT 
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- 사용 안 된 인덱스
LIMIT 10;

-- 1-4. 캐시 히트율
SELECT 
  ROUND(100 * heap_blks_hit / (heap_blks_hit + heap_blks_read)::numeric, 2) as cache_hit_ratio
FROM pg_statio_user_tables;
```

**단계 2: 원인 파악 (3-10분)**

| 증상 | 진단 | 원인 |
|-----|------|------|
| active_connections > 100 | 연결 풀 포화 | 세션 누수 또는 요청 급증 |
| 특정 쿼리 반복 (calls > 1000) | EXPLAIN ANALYZE | 인덱스 미사용 또는 Full Table Scan |
| cache_hit_ratio < 90% | 메모리 부족 | 데이터 증가로 인한 메모리 초과 |
| 동시 트랜잭션 > 50 | 잠금 대기 | 오랜 트랜잭션이 다른 쿼리 블로킹 |

**단계 3: 즉시 조치 (10-20분)**

```sql
-- 상황별 조치

-- A. 연결 풀 포화인 경우
-- Supabase 대시보드: Project Settings → Database → Pooling
-- pgbouncer 풀 크기 증가 (기본 120 → 150)
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();

-- B. 느린 쿼리 있는 경우
-- EXPLAIN 분석으로 인덱스 추가
EXPLAIN ANALYZE
SELECT * FROM assets WHERE status = 'active' AND owner_id = $1;
-- → "Seq Scan on assets" 보이면 인덱스 필요

CREATE INDEX idx_assets_status_owner 
ON assets(status, owner_id);

-- C. 오랜 트랜잭션 강제 종료
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE duration > '30 minutes'::interval;

-- D. 통계 갱신
ANALYZE;
```

**단계 4: 모니터링 (20분+)**
```bash
# 개선 확인
while true; do
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
    "SELECT ROUND(AVG(mean_exec_time), 2) FROM pg_stat_statements" \
    && sleep 10
done

# 정상화 기준: 평균 응답시간 < 100ms
```

---

### 플레이북 #3: API 에러율 급증 (API_ERROR_SPIKE)

**트리거 규칙:** `API-002, API-007`

**증상:**
- 5xx 에러율 > 1%
- 특정 엔드포인트 반복 실패
- 클라이언트 500 Internal Server Error 신고

**단계별 대응:**

**단계 1: 즉시 확인 (0-2분)**
```bash
# 1-1. 최근 에러 로그 확인 (Vercel 함수 로그)
curl "https://api.vercel.com/v13/deployments/$(git rev-parse HEAD)/logs" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  | jq '.logs[] | select(.level=="error")' | head -20

# 1-2. 에러 유형 분류
# → TypeError: Cannot read property 'X' of undefined
# → Error: connection pool is full
# → Error: Query timeout

# 1-3. 에러 발생 빈도 (초당)
date && curl -s https://api-endpoint.vercel.app/api/health | jq .errors

# 1-4. 배포된 코드 버전 확인
git log --oneline -1
```

**단계 2: 원인 파악 (2-8분)**

```javascript
// 로그 분석으로 패턴 찾기
// 1. 메모리 누수 신호
// → Heap 사용량 증가: 65% → 78% → 85% (3분 내)
// → 조치: 프로세스 재시작 또는 메모리 누수 수정

// 2. 데이터베이스 타임아웃
// → Error: Query timeout after 30000ms
// → 조치: 쿼리 최적화 또는 타임아웃 증가

// 3. 외부 API 호출 실패
// → Error: Cannot reach Discord API
// → 조치: API 상태 확인, 재시도 로직 강화

// 4. 환경 변수 누락
// → Error: Cannot read property 'API_KEY' of undefined
// → 조치: 환경 변수 재설정
```

**단계 3: 즉시 조치 (8-15분)**

| 에러 유형 | 즉시 조치 |
|----------|---------|
| TypeError / ReferenceError | 핫픽스 커밋 + 배포 |
| Connection pool full | DB 연결 풀 초기화: `SELECT pg_terminate_backend(...);` |
| Timeout | 타임아웃 증가 (30s → 60s) 또는 캐싱 추가 |
| 외부 API 실패 | Fallback 로직 또는 서킷브레이커 활성화 |
| 메모리 부족 | Vercel 인스턴스 업그레이드 또는 메모리 누수 수정 |

---

### 플레이북 #4: 서비스 완전 다운 (COMPLETE_OUTAGE)

**트리거 규칙:** 모든 서비스 응답 없음

**증상:**
- 모든 엔드포인트 응답 없음 (timeout)
- Vercel 대시보드에 "Deployment Failed" 표시
- 사용자: "앱이 열리지 않습니다"

**긴급 대응 (극도로 제한된 시간):**

```
T+0분: 감지
├─ 자동 Slack 알림 (#긴급-장애)
├─ CEO + DevOps 동시 호출
└─ PagerDuty 에스컬레이션

T+2분: 원인 파악
├─ Vercel 배포 상태 확인
├─ Supabase 서비스 상태 확인
└─ DNS/CDN 상태 확인

T+5분: 긴급 조치
├─ 시나리오 A: 코드 문제 → 즉시 롤백
│  └─ git revert HEAD && git push
├─ 시나리오 B: DB 문제 → Supabase 리스타트
│  └─ Supabase 콘솔: Project Settings → Restart
└─ 시나리오 C: 인프라 문제 → CDN 캐시 활성화
   └─ Cloudflare Workers로 캐시된 페이지 제공
```

---

## 3️⃣ 사후분석 (Post-Incident Review, PIR) 템플릿

### PIR 체크리스트

모든 Critical/High 심각도 사건 발생 후 24시간 내 PIR 작성 필수.

```markdown
# Post-Incident Review: [프로젝트명] [사건 제목]

## 개요 (Summary)
- 영향받은 서비스: [프로젝트명]
- 시작 시간: 2026-05-XX HH:MM UTC+9
- 종료 시간: 2026-05-XX HH:MM UTC+9
- 지속 시간: X분 Y초
- 영향받은 사용자: [추정 수치]

## 타임라인 (Timeline)

| 시간 | 이벤트 |
|-----|--------|
| 10:30 | 경고 규칙 트리거 (API-002) |
| 10:32 | DevOps 온콜이 Slack에서 감지 |
| 10:35 | 원인: DB 연결 풀 포화 파악 |
| 10:42 | 조치: 풀 크기 증가 (120 → 150) |
| 10:47 | 서비스 정상화 확인 |

## 근본 원인 (Root Cause)
- **주요 원인:** Asset Master 배포 후 동시 요청 증가로 DB 연결 풀 포화
- **근본 원인:** 연결 풀 크기가 피크 트래픽을 고려하지 않음
- **예방 가능성:** Yes — 로드 테스트로 사전 감지 가능

## 영향도 분석 (Impact Analysis)
- 영향받은 API: GET /api/assets, POST /api/assets
- 에러율: 3% (정상: 0.1%)
- 복구된 요청: 1,240개 중 1,185개 재시도 성공
- 데이터 손실: 0 (모든 요청이 큐에 대기했으므로 손실 없음)

## 개선 대책 (Corrective Actions)

| 대책 | 우선순위 | 담당자 | 기한 | 상태 |
|-----|---------|--------|------|------|
| DB 연결 풀 크기 증가 | 즉시 | DevOps | 완료 | ✅ |
| 로드 테스트 추가 | High | QA Specialist | 2026-06-02 | 진행 중 |
| 연결 풀 모니터링 강화 | High | DevOps | 2026-06-05 | 대기 |
| 문서 업데이트 | Medium | Automation | 2026-06-10 | 대기 |

## 학습 항목 (Lessons Learned)
1. **무엇을 배웠는가:** 배포 후 자동으로 로드 테스트를 실행해야 함
2. **앞으로 어떻게 할 것인가:** 모든 배포 후 synthetic 테스트 필수 실행
3. **재발 방지:** Datadog에서 "배포 후 에러율 급증 감지" 규칙 추가

## 승인 (Sign-off)
- 작성자: [DevOps Engineer]
- 검토자: [CEO]
- 승인일: 2026-05-30 10:00 UTC+9
```

---

## 4️⃣ 온콜 엔지니어 체크리스트

### 사건 발생 직후 (첫 5분)

- [ ] Slack #긴급-장애 채널 확인 및 반응 (🔴 또는 ✋)
- [ ] 문제 상황 파악 (3줄 요약)
- [ ] 현재 진행 중인 작업 중단 및 모두에게 알림
- [ ] 관련 팀원(들) Slack 멘션으로 호출
- [ ] Datadog/Vercel/Supabase 대시보드 동시 열기
- [ ] 문제의 심각도 재평가 (Critical? High?)

### 원인 파악 단계 (5-15분)

- [ ] 최근 배포된 코드 확인 (git log)
- [ ] 환경 변수 변경 사항 확인
- [ ] 데이터베이스 상태 확인 (연결, 쿼리, 저장소)
- [ ] 외부 서비스 상태 확인 (GitHub, Vercel 상태페이지)
- [ ] Slack에서 추정 복구 시간 공지
- [ ] 필요시 백업 담당자 호출

### 조치 실행 (15-30분)

- [ ] 선택한 대응 방법 실행 (롤백/핫픽스/설정변경)
- [ ] 변경 사항 모두 Slack에 기록
- [ ] 변경 후 헬스체크 재실행
- [ ] 모니터링 대시보드에서 개선 확인
- [ ] CEO/팀에 진행 상황 업데이트

### 사후 조치 (30분+)

- [ ] 안정성 확인 (10-15분간 추가 모니터링)
- [ ] 근본 원인 가설 작성
- [ ] PIR (Post-Incident Review) 일정 설정
- [ ] Slack에서 "모두 해결됨" 알림
- [ ] 24시간 내 PIR 작성 시작

---

## 5️⃣ 통합 모니터링 & 자동 조치 워크플로우

```
경고 감지 (Datadog)
   ↓
[심각도 판단] 
   ├─ Critical → PagerDuty + SMS + 이메일
   ├─ High → Slack + 이메일
   └─ Medium → Slack (자동)
   ↓
[자동 조치 시도]
   ├─ 헬스체크 재시도 (3회)
   ├─ 캐시 초기화
   └─ 데이터베이스 연결 풀 초기화
   ↓
[조치 성공?]
   ├─ YES → 모니터링 강화 (1시간)
   └─ NO → 수동 대응 (온콜 엔지니어)
   ↓
[완전 복구 확인]
   └─ 이상 없음 → PIR 시작 예약
```

---

**문서 작성일:** 2026-05-29  
**최종 검토 일정:** 2026-06-04 18:00 KST  
**승인자:** DevOps Engineer  
**유효 기간:** 2026-05-29 ~ 2026-08-29 (3개월)

