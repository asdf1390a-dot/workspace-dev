---
name: 하네스엔지니어링 표준화 계획 (Harness Engineering Standardization)
description: 6-8 프로젝트 병렬 실행을 위한 자동화 + 표준화 마스터 플랜 (2026-05-27~06-10)
type: project
---

# 🚀 하네스엔지니어링 표준화 (Harness Engineering Standardization)
## 6-8 병렬 프로젝트 자동화 + 표준화 마스터 플랜

**결정일:** 2026-05-26 21:46 KST
**상태:** 🟡 설계 진행 중
**목표:** 모든 프로젝트가 동일한 배포/테스트/모니터링/팀협업 표준 따르도록 정규화
**완료기한:** 2026-06-10

---

## 📊 현황 분석

### 현재 운영 중인 자동화 시스템
1. **6-8 병렬 프로젝트** — 8개 프로젝트 동시 실행, 팀원 93.3% 활용도
2. **Cron 자동화** — 5개 정기 작업 (08:00, 14:00, 15:00, 18:00, 자정)
3. **CTB (Central Task Board)** — 실시간 추적 + Git 연동
4. **메모리 자동화** — Phase 2 설계 완료 (1,500+ 라인)
5. **팀 모니터링** — Phase A/B/C 세 층 감시 시스템

### 문제점 (표준화 부족)
- ❌ 배포 프로세스 표준화 부재 (각 프로젝트마다 다름)
- ❌ 테스트 자동화 규칙 통일 부재
- ❌ 모니터링/알림 표준화 부재
- ❌ 마이그레이션(db/*) 자동 적용 부재
- ❌ CI/CD 파이프라인 표준 부재
- ❌ 팀 보고서 형식 표준화 부재

---

## 🎯 하네스엔지니어링 표준화 3단계 로드맵

### **Phase 1: 배포 + CI/CD 표준화 (2026-05-27~31, 5일)**

**목표:** 모든 프로젝트 동일한 배포/테스트 파이프라인

#### 1.1 배포 표준화 (Vercel + GitHub Actions)

**표준 파이프라인:**
```
Feature Branch Push
  → GitHub Actions: npm install + npm run build
  → Build Success/Fail 자동 체크
  → Vercel Preview Deploy (자동)
  → Slack/Discord 알림
  → Manual Approval (사용자)
  → Vercel Production Deploy
  → 배포 완료 메시지 (timestamp + commit hash)
```

**구현:**
- `.github/workflows/deploy.yml` 표준 템플릿 생성 (모든 프로젝트 공유)
- 모든 프로젝트 `vercel.json` 통일 (환경변수 규칙)
- GitHub Secret 표준화 (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)

**대상 프로젝트:** dsc-fms-portal, discord-bot, travel-management, team-dashboard 등 (총 8개)

#### 1.2 테스트 자동화 표준

**표준 규칙:**
- 모든 PR: 자동 테스트 실행 (npm run test)
- 테스트 커버리지 최소 60% (목표 80%)
- 테스트 실패 시 merge 차단
- API 엔드포인트: 최소 3가지 케이스 (success, error, edge-case)

**Cron 추가:** 매일 08:00 "Test Coverage Report" (모든 프로젝트)

#### 1.3 마이그레이션 자동 적용 (db/*)

**표준 프로세스:**
```
db/* 파일 생성/수정 (Supabase)
  → Cron 매시간 감지
  → 미적용 파일 식별
  → 자동 실행 시도 + 결과 로깅
  → 실패 시 팀 알림 (채널 + CTB)
```

**구현:**
- 새로운 Cron job: "DB Migration Auto-Apply" (매시간 XX:30)
- 감지 로직: dsc-fms-portal/db 폴더 hash 체크
- 실행 스크립트: `scripts/apply-migration.sh` (SERVICE_ROLE_KEY 사용)
- 결과 기록: `db-migration-log.json` (timestamp + 상태 + 오류메시지)

---

### **Phase 2: 모니터링 + 알림 표준화 (2026-06-01~05, 5일)**

**목표:** 모든 프로젝트 동일한 로깅/모니터링 규칙

#### 2.1 통합 로깅 표준

**표준 로그 포맷:**
```json
{
  "timestamp": "2026-05-27T10:15:30Z",
  "project": "asset-master",
  "level": "ERROR|WARN|INFO|DEBUG",
  "component": "api/assets",
  "message": "Detailed error message",
  "context": { "userId": "123", "endpoint": "POST /api/assets", "statusCode": 500 },
  "trace": "Full stack trace"
}
```

**구현:**
- 모든 프로젝트: `lib/logger.ts` (Winston/Pino) 통합 로거
- 로그 수집: Supabase `logs` 테이블로 중앙화
- 실시간 대시보드: `/dashboard/logs` (필터: project, level, timestamp range)

#### 2.2 알림 표준 (에러, 지연, 배포)

**알림 규칙:**

| 이벤트 | 채널 | 우선순위 | 예제 |
|--------|------|---------|------|
| API 에러 (5XX) | #errors (Discord) | 🔴 CRITICAL | "🚨 asset-master API: 500 error in POST /assets (count: 3/min)" |
| 테스트 실패 | #test-failures | 🟠 HIGH | "❌ discord-bot: 2/47 tests failed (Travel P2 integration)" |
| 배포 완료 | #deployments | 🟢 INFO | "✅ travel-management v2.3.1 → Vercel (commit: a1b2c3d, user: Web-Builder)" |
| 마이그레이션 실패 | #database | 🟠 HIGH | "⚠️ db/35 failed: duplicate key constraint (table: audit_sessions)" |
| 일일 체크인 | Telegram | 🔵 INFO | "📊 Daily Summary: 6/8 projects ON_TRACK, 2 BLOCKED, 89% reliability" |

**구현:**
- Discord Webhook + Telegram Bot (메시지 라우팅 자동화)
- 알림 필터: 프로젝트별 + 우선순위별 구독 선택
- Mute 규칙: 동일 에러 5분 내 중복 발생 시 1건만 알림

#### 2.3 성능 모니터링 표준

**모니터링 항목:**
- API 응답시간 (p50, p95, p99 분위수)
- 에러율 (5XX, 4XX별)
- 데이터베이스 쿼리 성능 (느린 쿼리 로깅)
- 배포 성공률 (주간 누적)
- 팀 신뢰도 (위반 추적)

**Cron 추가:** 매일 18:00 "Performance Report" (모든 프로젝트 통합)

---

### **Phase 3: 팀 협업 자동화 표준 (2026-06-06~10, 5일)**

**목표:** 모든 팀 보고, 일정, 추적 표준화

#### 3.1 일일 체크인 표준

**표준 형식:**
```
【08:00 아침 체크인】
프로젝트별 진행률 (5% 단위):
- Asset Master P2: 50% (Day 4 기준선)
- Backup P1: 15% (API 완료 대기)
- Travel P2: 75% (UI 개발 중)
- Discord Bot P1: 100% (완료)
- Team Dashboard P1: 80% (API 통합 진행)
- Memory Auto P2: 45% (Phase 2A 개발 중)

블로킹 요소:
🔴 BM-P1: 평가자 피드백 대기 (24h+ 오버)
🟡 Asset Master: db/35 미적용 (사용자 액션 필요)

일정 변경:
✅ Asset Master 2일 당겨옴 (예정 2026-06-02 → 2026-05-31)

신뢰도: 89% (목표 95% 대비 -6%)
```

**자동화:**
- Cron 08:00: 모든 팀원 진행률 자동 수집
- Web 폼: 각 팀원이 자동으로 입력 (1분 소요)
- CTB 자동 갱신 (GitHub + Supabase 동기화)
- Telegram 전송 (CEO 알림)

#### 3.2 주간 보고서 표준

**표준 항목:**
```
【주간 보고 (매주 금요 17:00)】
1️⃣ 완료한 업무: X개, 진행중 Y개, 대기중 Z개
2️⃣ 신뢰도: 94% (목표 95% 대비 -1%)
3️⃣ 주요 성과: 
   - Asset Master Phase 2 Day 5 완료 (16/16 API 100%)
   - Memory Automation Phase 2 설계 완료 (1,500줄)
4️⃣ 블로킹 해결: BM-P1 평가자 신호 (72h 오버 → 해결됨)
5️⃣ 다음주 우선순위: BM-P1 UI, Travel P2 배포, Memory Auto Phase 2A
```

**자동화:**
- 새로운 Cron job: 매주 금요 16:00 "Weekly Report Generator"
- 데이터 수집: CTB + 성능 메트릭 + 팀 피드백
- 형식: Markdown → PDF → Telegram/Discord 전송

#### 3.3 팀 대시보드 표준

**대시보드 페이지 (`/dashboard/team`):**
- 🟢 완료한 프로젝트 (진행률 100%)
- 🟡 진행 중 프로젝트 (진행률 %)
- 🔴 블로킹된 프로젝트 + 이유
- 📈 신뢰도 차트 (일일 + 누적)
- 📋 일정 타임라인 (Gantt 차트)
- 👥 팀 할당 현황 (인원 + 프로젝트)

**자동화:**
- 실시간 업데이트 (CTB → 대시보드 1분 지연)
- 모바일 반응형 (Telegram 인라인 뷰)

---

## 🔧 구현 세부사항

### A. 배포 표준 파일

**`.github/workflows/deploy.yml` (모든 프로젝트 공유)**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test -- --coverage
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

### B. Cron 자동화 표준 (기존 5개 + 신규 4개)

**기존 Cron:**
- 08:00: 아침 체크인
- 14:00: Asset Master 진행 보고
- 15:00: Backup Phase 2 진행 보고
- 18:00: 일일 마감
- 자정: 메모리 동기화

**신규 Cron (Phase 1-3):**
- 08:00: 테스트 커버리지 리포트 (추가)
- XX:30: DB 마이그레이션 자동 적용
- 금 16:00: 주간 보고서 생성
- 매시간: 에러 로그 모니터링 + 알림

### C. GitHub Actions 표준 (test + coverage)

모든 프로젝트 `package.json`:
```json
{
  "scripts": {
    "test": "jest --coverage --passWithNoTests",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "build": "next build"
  }
}
```

### D. 환경변수 표준 (Vercel)

모든 프로젝트 동일한 환경변수 이름:
```
DATABASE_URL=postgres://...
SUPABASE_KEY=...
SUPABASE_URL=...
JWT_SECRET=...
NEXT_PUBLIC_API_URL=...
LOG_LEVEL=info|debug|error (환경별)
```

---

## 📈 예상 효과

| 지표 | 현재 | 목표 | 개선도 |
|------|------|------|--------|
| **배포 자동화율** | 40% | 100% | +60% |
| **테스트 커버리지** | 55% | 80% | +25% |
| **평균 배포시간** | 15분 | 3분 | 5배 단축 |
| **에러 감지시간** | 30분 | 5분 | 6배 단축 |
| **팀 신뢰도** | 89% | 95% | +6% |
| **마이그레이션 자동화율** | 0% | 100% | +100% |
| **일일 체크인 자동화율** | 60% | 100% | +40% |

---

## 🗓️ 실행 일정

### Phase 1 (2026-05-27~31)
| 날짜 | 작업 | 담당 | 완료기한 |
|------|------|------|---------|
| 05-27 | `.github/workflows/deploy.yml` 작성 | Automation Specialist | 12:00 |
| 05-27 | `lib/logger.ts` 표준 작성 | Web-Builder | 15:00 |
| 05-28 | 8개 프로젝트 workflow 적용 | Automation Specialist | 18:00 |
| 05-29 | Vercel 환경변수 통일 | Web-Builder | 14:00 |
| 05-30 | db 마이그레이션 자동화 스크립트 | Automation Specialist | 16:00 |
| 05-31 | Phase 1 검증 + 최적화 | Evaluator | 17:00 |

### Phase 2 (2026-06-01~05)
- Discord/Telegram 알림 통합 (Automation Specialist)
- 성능 모니터링 대시보드 (Web-Builder)
- 알림 필터 규칙 설정 (Team Dashboard P1)

### Phase 3 (2026-06-06~10)
- 일일/주간 체크인 자동화 (Automation Specialist)
- 팀 대시보드 실시간 업데이트 (Web-Builder)
- 최종 통합 테스트 + 배포 (Evaluator)

---

## ⚠️ 주의사항

- **토큰 관리:** SERVICE_ROLE_KEY 절대 Git 커밋 금지 (env vars만 사용)
- **배포 검증:** Production 배포 전 항상 Preview 테스트 필수
- **롤백 계획:** 배포 실패 시 자동 이전 버전으로 롤백
- **팀 커뮤니케이션:** 모든 표준 변경은 팀 Discord #공지에 사전 안내

---

## 🎯 성공 기준

✅ Phase 1 완료: 모든 8개 프로젝트 자동 배포 파이프라인 활성화
✅ Phase 2 완료: 중앙화된 모니터링 + 실시간 알림 운영
✅ Phase 3 완료: 팀 신뢰도 95% 달성 + 일일 자동 보고서 운영

---

**최종 목표:** 2026-06-10까지 완전 자동화 표준화 시스템 구축
**담당:** Automation Specialist AI Agent + Web-Builder AI Agent
**검증:** Evaluator AI Agent 3회 검증 후 Go-Live

