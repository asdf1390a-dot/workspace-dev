# Vercel 실시간 감시 — 5-7일 개발 로드맵

**문서 버전:** v1.0  
**작성일:** 2026-05-17  
**대상:** Web-Builder (개발자)  
**개발 기간:** 2026-05-18 ~ 2026-05-24 (5-7일)  
**예상 배포:** 2026-05-25 (토)  

---

## 0. 사전 준비 (2시간)

### 0.1 환경 설정
```bash
# .env.local에 추가
VERCEL_TOKEN=xxxxxxxxxxxx                    # Vercel 토큰
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxx
TELEGRAM_CHAT_ID=xxxxxxxxxxxx
DISCORD_DEPLOY_WEBHOOK=https://...
CRON_SECRET=$(openssl rand -hex 32)
```

### 0.2 문서 검토
- [ ] `VERCEL_REALTIME_MONITORING_DESIGN.md` 정독 (30분)
- [ ] `VERCEL_MONITORING_API_GUIDE.md` 상세 검토 (30분)
- [ ] Vercel API 문서 스캔 (https://vercel.com/docs/api)

### 0.3 의존성 확인
```bash
# 기존 프로젝트에 모두 설치됨 확인
- next@14.x
- supabase
- typescript
```

**예상 소요시간:** 2시간

---

## Phase 1: Database Setup (Day 1, 4-5시간)

### 1.1 마이그레이션 파일 생성
**파일:** `db/24_vercel_monitoring_module.sql`

```sql
-- 4개 테이블 + 인덱스 + 정책 생성
-- VERCEL_REALTIME_MONITORING_DESIGN.md 섹션 4 참고

CREATE TABLE vercel_projects (...)
CREATE TABLE vercel_deployments (...)
CREATE TABLE vercel_metrics (...)
CREATE TABLE vercel_alerts (...)

-- 인덱스 생성
CREATE INDEX idx_vercel_deployments_created_date ON vercel_deployments(created_date DESC);
CREATE INDEX idx_vercel_deployments_project ON vercel_deployments(project_id);
-- ... (더 많은 인덱스)

-- RLS 정책
ALTER TABLE vercel_deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view deployments" ON vercel_deployments
  FOR SELECT USING (auth.role() = 'authenticated');
-- ... (다른 테이블도)
```

**체크리스트:**
- [ ] 4개 테이블 생성 확인
- [ ] 인덱스 생성 확인
- [ ] RLS 정책 활성화 확인
- [ ] `vercel_projects` 초기 데이터 삽입 (dsc-fms-portal 등)

**예상 소요시간:** 2-3시간  
**완료 기준:** Supabase에서 테이블 조회 가능

---

## Phase 2: Polling & Data Collection (Day 2-3, 8-10시간)

### 2.1 `/api/monitoring/vercel/poll` 구현
**파일:** `app/api/monitoring/vercel/poll/route.ts`

```typescript
// 1. Vercel API 폴링 로직
//   - 프로젝트별 최신 배포 조회
//   - 신규/변경 배포 감지
//   - 배포 정보 DB 저장

// 2. 알림 발송 로직
//   - 배포 완료 → Telegram
//   - 배포 실패 → Telegram + Discord
//   - Alert DB 기록

// 3. 성능 메트릭 수집
//   - Vercel Analytics API (placeholder 구현)
```

**체크리스트:**
- [ ] Vercel API 토큰 연결 확인
- [ ] 배포 데이터 파싱 정확성 검증
- [ ] Supabase INSERT 정상 작동
- [ ] 오류 발생 시 retry 정책 테스트
- [ ] 타임스탬프 시간대 확인 (UTC ↔ KST)

**테스트 방법:**
```bash
# 수동으로 한 번 실행
curl -X POST http://localhost:3000/api/monitoring/vercel/poll \
  -H "x-cron-token: $CRON_SECRET"

# Supabase 콘솔에서 vercel_deployments 확인
SELECT * FROM vercel_deployments LIMIT 5;
```

**예상 소요시간:** 4-5시간  
**완료 기준:** 배포 정보가 DB에 저장됨

---

### 2.2 Telegram & Discord 알림 구현
**파일:** `app/api/monitoring/vercel/poll/route.ts` (헬퍼 함수)

```typescript
async function sendTelegramAlert(message: string)
async function sendDiscordAlert(message: string)
```

**테스트:**
- [ ] Telegram 봇 토큰 유효성 확인
- [ ] Discord 웹훅 URL 유효성 확인
- [ ] 배포 완료 시 Telegram 알림 수신
- [ ] 배포 실패 시 Telegram + Discord 알림 수신

**예상 소요시간:** 1-2시간  
**완료 기준:** 알림이 실제 채널에 도착함

---

### 2.3 Vercel Cron 트리거 설정
**파일:** `vercel.json` (루트)

```json
{
  "crons": [{
    "path": "/api/monitoring/vercel/poll",
    "schedule": "*/5 * * * *"
  }]
}
```

**체크리스트:**
- [ ] vercel.json 문법 확인
- [ ] Vercel 대시보드에서 Cron 활성화 확인
- [ ] 5분 주기 실행 로그 확인

**예상 소요시간:** 0.5시간  
**완료 기준:** Vercel 대시보드에 Cron 표시됨

**Phase 2 합계:** 6-7시간  
**누적 소요시간:** 8-10시간

---

## Phase 3: Read API 구현 (Day 3-4, 6-8시간)

### 3.1 `/api/monitoring/vercel/status` 구현
**파일:** `app/api/monitoring/vercel/status/route.ts`

```typescript
// 현재 배포 상태 조회 (대시보드에서 즉시 사용)
```

**테스트:**
```bash
curl http://localhost:3000/api/monitoring/vercel/status | jq .
```

**예상 소요시간:** 1시간

---

### 3.2 `/api/monitoring/vercel/deployments` 구현
**파일:** `app/api/monitoring/vercel/deployments/route.ts`

```typescript
// 배포 히스토리 페이징 조회 (타임라인 표시용)
// 쿼리: ?page=1&limit=20&project=dsc-fms-portal
```

**테스트:**
```bash
curl "http://localhost:3000/api/monitoring/vercel/deployments?page=1&limit=10" | jq .
```

**예상 소요시간:** 1.5시간

---

### 3.3 `/api/monitoring/vercel/metrics` 구현
**파일:** `app/api/monitoring/vercel/metrics/route.ts`

```typescript
// 성능 메트릭 시계열 데이터 (차트용)
// 쿼리: ?metric=lcp&hours=24
```

**테스트:**
```bash
curl "http://localhost:3000/api/monitoring/vercel/metrics?metric=build_time&hours=24" | jq .
```

**예상 소요시간:** 1.5시간

---

### 3.4 `/api/monitoring/vercel/alerts` 구현
**파일:** `app/api/monitoring/vercel/alerts/route.ts`

```typescript
// 알림 로그 조회 (Alert 히스토리 표시용)
// 쿼리: ?days=7&severity=critical
```

**테스트:**
```bash
curl "http://localhost:3000/api/monitoring/vercel/alerts?days=7" | jq .
```

**예상 소요시간:** 1시간

---

### 3.5 `/api/monitoring/vercel/stream` 구현
**파일:** `app/api/monitoring/vercel/stream/route.ts`

```typescript
// Server-Sent Events (실시간 스트림)
// 클라이언트에서 EventSource로 연결
```

**테스트:**
```bash
curl http://localhost:3000/api/monitoring/vercel/stream
# 30초마다 data: {...} 라인 수신 확인
```

**예상 소요시간:** 1.5시간

**Phase 3 합계:** 6-7시간  
**누적 소요시간:** 14-17시간

---

## Phase 4: Dashboard UI 구현 (Day 4-5, 10-12시간)

### 4.1 Status Box 컴포넌트
**파일:** `app/monitoring/vercel/components/StatusBox.tsx`

```typescript
export function StatusBox() {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    fetch('/api/monitoring/vercel/status')
      .then(r => r.json())
      .then(setStatus);
  }, []);
  
  return (
    <div className="status-box">
      <h2>Current Status</h2>
      {status && (
        <>
          <p>State: {status.status} ✅/❌</p>
          <p>Build Time: {status.timing.buildDurationSeconds}s</p>
          <p>URL: {status.deployment.url}</p>
        </>
      )}
    </div>
  );
}
```

**예상 소요시간:** 1.5시간

---

### 4.2 Deployment Timeline 컴포넌트
**파일:** `app/monitoring/vercel/components/DeploymentTimeline.tsx`

```typescript
// 배포 히스토리를 세로 타임라인으로 표시
// DeploymentCard 반복 렌더링
```

**예상 소요시간:** 2-2.5시간

---

### 4.3 Performance Chart 컴포넌트
**파일:** `app/monitoring/vercel/components/PerformanceChart.tsx`

```typescript
// recharts 또는 chart.js로 시계열 차트
// LCP, Error Rate, Build Time
```

**테스트:**
- [ ] 차트 렌더링 확인
- [ ] 데이터 포인트 정확성 검증
- [ ] 반응형 레이아웃 확인

**예상 소요시간:** 2.5-3시간

---

### 4.4 Alert History 컴포넌트
**파일:** `app/monitoring/vercel/components/AlertHistory.tsx`

```typescript
// 알림 로그를 테이블 또는 리스트로 표시
// 필터링: 심각도별, 유형별
```

**예상 소요시간:** 1.5시간

---

### 4.5 페이지 구성
**파일:** `app/monitoring/vercel/page.tsx`

```typescript
export default function VercelMonitoringPage() {
  return (
    <div className="container">
      <Header />
      <StatusBox />
      <DeploymentTimeline />
      <PerformanceChart />
      <AlertHistory />
    </div>
  );
}
```

**예상 소요시간:** 2-3시간

---

### 4.6 스타일링 & 반응형 레이아웃
**파일:** `app/monitoring/vercel/page.module.css`

```css
/* Tailwind 또는 CSS Modules 사용 */
/* 모바일, 태블릿, 데스크톱 대응 */
```

**예상 소요시간:** 2시간

**Phase 4 합계:** 11-13시간  
**누적 소요시간:** 25-30시간

---

## Phase 5: 실시간 업데이트 & SSE (Day 5, 3-4시간)

### 5.1 클라이언트 폴링 (선택1: 간단)
**파일:** `app/monitoring/vercel/page.tsx` (useEffect 추가)

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/monitoring/vercel/status')
      .then(r => r.json())
      .then(setStatus);
  }, 120000);  // 2분마다
  
  return () => clearInterval(interval);
}, []);
```

**예상 소요시간:** 1시간

---

### 5.2 Server-Sent Events (선택2: 고급)
**파일:** `app/monitoring/vercel/hooks/useVercelStream.ts`

```typescript
export function useVercelStream() {
  useEffect(() => {
    const eventSource = new EventSource('/api/monitoring/vercel/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setDeployment(data.deployment);
    };
    
    return () => eventSource.close();
  }, []);
}
```

**예상 소요시간:** 2시간

**Phase 5 합계:** 3시간  
**누적 소요시간:** 28-33시간

---

## Phase 6: 테스트 & 검증 (Day 6, 4-6시간)

### 6.1 기능 테스트
```bash
# 1. Vercel API 연동 테스트
curl -X POST http://localhost:3000/api/monitoring/vercel/poll \
  -H "x-cron-token: $CRON_SECRET"

# 2. 배포 정보 저장 확인
SELECT COUNT(*) FROM vercel_deployments;

# 3. 알림 발송 확인 (Telegram/Discord)

# 4. 대시보드 UI 로드 확인
# http://localhost:3000/monitoring/vercel
```

**예상 소요시간:** 2시간

---

### 6.2 성능 테스트
```bash
# 1. API 응답 시간 < 500ms 확인
time curl http://localhost:3000/api/monitoring/vercel/status

# 2. 대시보드 로드 시간 < 2초 확인

# 3. Cron 주기 정확성 확인 (로그)
```

**예상 소요시간:** 1.5시간

---

### 6.3 에러 처리 테스트
```typescript
// 1. Vercel API 토큰 만료 시 동작
// 2. 네트워크 오류 시 재시도
// 3. DB 연결 실패 시 로깅
// 4. 알림 발송 실패 시 로그 기록
```

**예상 소요시간:** 1-1.5시간

---

### 6.4 보안 검사
- [ ] .env.local에 토큰 저장 (커밋 금지)
- [ ] Supabase RLS 정책 활성화
- [ ] API 레이트 제한 설정
- [ ] CORS 설정 검증

**예상 소요시간:** 0.5시간

**Phase 6 합계:** 5시간  
**누적 소요시간:** 33-38시간

---

## Phase 7: 배포 & 모니터링 (Day 7, 2-3시간)

### 7.1 Vercel 배포
```bash
git add .
git commit -m "feat(monitoring): Vercel realtime dashboard"
git push origin main

# Vercel 자동 배포 시작
# https://vercel.com/.../deployments
```

**체크리스트:**
- [ ] Build 성공 확인
- [ ] 배포 완료 확인
- [ ] 환경 변수 설정 (production)

**예상 소요시간:** 0.5시간

---

### 7.2 Cron 활성화 확인
```bash
# Vercel 대시보드
# Cron Jobs 탭 → /api/monitoring/vercel/poll
# Status: Active ✅
```

**예상 소요시간:** 0.5시간

---

### 7.3 7일간 베타 모니터링
```bash
# 일일 체크리스트:
# - 배포 폴링이 정상 작동하는가?
# - 알림이 정시에 도착하는가?
# - 대시보드 데이터가 최신인가?
# - 성능 문제가 없는가?
```

**예상 소요시간:** 1시간

**Phase 7 합계:** 2시간  
**누적 소요시간:** 35-40시간

---

## 타임라인 요약

| 단계 | 기간 | 누적 시간 | 상태 |
|------|------|---------|------|
| 사전 준비 | Day 1 (2h) | 2h | 초기화 |
| Phase 1 (DB) | Day 1 (4-5h) | 6-7h | 데이터베이스 구축 |
| Phase 2 (폴링) | Day 2-3 (8-10h) | 14-17h | 데이터 수집 |
| Phase 3 (API) | Day 3-4 (6-8h) | 20-25h | API 구현 |
| Phase 4 (UI) | Day 4-5 (10-12h) | 30-37h | 대시보드 구현 |
| Phase 5 (실시간) | Day 5 (3-4h) | 33-41h | 실시간 업데이트 |
| Phase 6 (테스트) | Day 6 (4-6h) | 37-47h | 검증 & 수정 |
| Phase 7 (배포) | Day 7 (2-3h) | 39-50h | 프로덕션 배포 |

**예상 전체 시간:** 35-50시간  
**권장 속도:** 하루 8시간 작업 = 5-7일  

---

## 의존성 체크

```typescript
// 필수 패키지 (모두 설치됨)
- next@14
- supabase@latest
- typescript@latest
- react@18

// 추가 필요 (선택)
- recharts  // 차트 (선택)
- chart.js  // 차트 (선택, 또는 recharts)
```

---

## 위험 요소 & 완화책

| 위험 | 영향 | 완화책 |
|------|------|-------|
| Vercel API 레이트 제한 | 폴링 실패 | 재시도 정책, 지수 백오프 |
| Supabase 연결 지연 | DB 저장 실패 | 타임아웃 설정, 에러 로깅 |
| 알림 채널 오류 | 배포 알림 미발송 | Try-catch, 대체 채널 |
| 성능 메트릭 미지원 | 차트 표시 안 됨 | Placeholder 구현, 추후 확장 |

---

## 성공 기준

- [ ] 배포 폴링 5분마다 정상 작동
- [ ] Vercel API에서 데이터 수집 성공
- [ ] Supabase에 데이터 저장 성공
- [ ] Telegram 알림 배포 완료 시 즉시 발송
- [ ] Discord 알림 배포 실패 시 즉시 발송
- [ ] 대시보드 로드 시간 < 2초
- [ ] 성능 메트릭 차트 표시 확인
- [ ] SSE 또는 폴링으로 실시간 업데이트 동작
- [ ] 90일 자동 정리 로직 동작
- [ ] 7일간 프로덕션 환경 안정적 작동

---

## 다음 단계

1. **2026-05-25:** 배포 완료
2. **2026-05-26 ~ 06-01:** 7일 베타 모니터링
3. **2026-06-02:** 최종 검증 & 피드백 반영
4. **2026-06-03:** 공식 운영 시작

---

## 참고 문서

1. `VERCEL_REALTIME_MONITORING_DESIGN.md` — 아키텍처 & 설계
2. `VERCEL_MONITORING_API_GUIDE.md` — API 구현 코드
3. [Vercel API Docs](https://vercel.com/docs/api)
4. [Supabase Database Docs](https://supabase.com/docs/guides/database)

---

**작성:** Planner Agent  
**검증 대상:** Evaluator  
**개발 담당:** Web-Builder  
**ETA:** 2026-05-25 (배포 예정)
