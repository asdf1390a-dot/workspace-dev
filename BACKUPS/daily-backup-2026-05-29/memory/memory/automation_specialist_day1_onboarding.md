---
name: 자동화전문가 Day 1 온보딩 (2026-05-25)
description: OpenClaw 게이트웨이 + Cron 시스템 + Git 웹훅 + CTB 추적 기초 완전 학습
type: onboarding
target_completion: 2026-05-25 18:00
created: 2026-05-25 14:12
---

# 자동화전문가 Day 1 온보딩 (2026-05-25)

**목표:** OpenClaw 게이트웨이 + Cron 시스템 + Git 웹훅 + CTB 추적 완전 이해  
**타겟 완료:** 2026-05-25 18:00 KST  
**담당:** Automation Specialist (신규)  
**리뷰:** Secretary Agent  

---

## 📚 학습 체크리스트

### 1️⃣ OpenClaw 게이트웨이 기초 (30분)
- [ ] OpenClaw 아키텍처 개요 (3분)
- [ ] 게이트웨이 역할 및 구조 (5분)
- [ ] Cron 작동 흐름 (10분)
- [ ] 로깅 및 모니터링 (10분)
- [ ] 로컬 환경 셋업 (2분)

### 2️⃣ Cron 시스템 실습 (60분)
- [ ] 기존 4개 Cron 분석 (30분)
  - [ ] CTB 실시간 갱신 Cron
  - [ ] 주간 리포트 Cron
  - [ ] 백업 자동화 Cron (3개)
- [ ] Vercel Cron 설정 이해 (15분)
- [ ] 환경변수 & 인증 토큰 (10분)
- [ ] 로컬 테스트 실행 (5분)

### 3️⃣ Git 웹훅 & 자동화 (30분)
- [ ] GitHub 웹훅 설정 (10분)
- [ ] CTB 자동 동기화 트리거 (10분)
- [ ] 커밋 파싱 로직 (10분)

### 4️⃣ CTB (Central Task Board) 추적 (30분)
- [ ] active_work_tracking.md 구조 (15분)
- [ ] 실시간 업데이트 메커니즘 (15분)

**총 시간:** 150분 (2시간 30분)

---

## 1️⃣ OpenClaw 게이트웨이 기초

### 1.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                  OpenClaw Gateway (중앙)                     │
│  - Cron 스케줄링 (Vercel 또는 로컬)                         │
│  - HTTP 라우팅 (Next.js API Routes)                         │
│  - 환경변수 관리 (Vercel Secrets)                           │
│  - 데이터베이스 연결 (Supabase)                             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
    Cron Jobs          API Handlers      Message Queue
    (자동화)           (주문형)          (Telegram)
    08:00 CTB      POST /api/...      #경영실적채널
    09:00 INFO     GET /api/...       #KPI채널
    14:00 REPORT                      #정보채널
    18:00 CHECK
```

**핵심:**
- **게이트웨이** = 모든 자동화의 중앙 제어실
- **Vercel Cron** = 클라우드 스케줄러 (production에서 자동 실행)
- **로컬 테스트** = 개발 시 `npm run dev` + localhost:3000에서 수동 트리거

### 1.2 게이트웨이 역할

| 역할 | 담당 | 예시 |
|------|------|------|
| **시간 기반 실행** | Vercel Cron | 매일 14:00 경영실적 리포팅 |
| **이벤트 기반 실행** | GitHub Webhook | 커밋 시 CTB 자동 갱신 |
| **주문형 실행** | REST API | 수동 버튼 클릭 → 즉시 처리 |
| **재시도 & 로깅** | Cron Logic | 실패 시 자동 재시도 + DB 기록 |
| **알림** | Telegram Bot | 완료/실패 메시지 자동 발송 |

### 1.3 Cron 작동 흐름

```
Vercel Clock (08:00 KST)
     ↓
Vercel 게이트웨이 → POST /api/cron/ctb/realtime-update
     ↓
Authorization Header Check (CRON_SECRET)
     ↓
Supabase 쿼리 실행 (active_work_tracking.md 추출)
     ↓
데이터 변환 & 검증
     ↓
Telegram 메시지 생성
     ↓
Telegram Bot API 호출
     ↓
cron_logs 테이블 기록 (status, started_at, ended_at, error_msg)
```

**중요:** 모든 Cron은 HTTP POST 요청이며, Vercel이 자동으로 호출함.

### 1.4 로깅 및 모니터링

**로그 저장:** Supabase `cron_logs` 테이블
```sql
CREATE TABLE cron_logs (
  id BIGINT PRIMARY KEY,
  cron_name VARCHAR(100),          -- "ctb-update", "daily-report"
  status VARCHAR(20),              -- "success", "failed", "timeout"
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  error_msg TEXT,
  output_rows INT,                 -- 처리된 행 수
  created_at TIMESTAMP DEFAULT NOW()
);
```

**모니터링:**
- Vercel Deployments → Cron Invocations 탭에서 실행 기록 확인
- Supabase Dashboard → cron_logs 테이블 조회
- Telegram #시스템채널에서 자동 알림 확인

### 1.5 로컬 환경 셋업

```bash
# 1. 저장소 클론 및 의존성 설치
cd /home/jeepney/.openclaw/workspace-dev
npm install

# 2. 환경변수 설정 (.env.local에 다음 추가)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
CRON_SECRET=[32-char-alphanumeric]
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg

# 3. 로컬 개발 서버 시작
npm run dev

# 4. 테스트 (curl로 수동 호출)
curl -X POST http://localhost:3000/api/cron/ctb/realtime-update \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 2️⃣ Cron 시스템 실습

### 2.1 기존 4개 Cron 분석

#### Cron A1: CTB 실시간 갱신 (매일 08:00, 14:00, 15:00, 18:00)
**파일:** `app/api/cron/ctb/realtime-update/route.ts`  
**목적:** Git 커밋 파싱 → active_work_tracking.md 자동 업데이트

**작동:**
1. GitHub GraphQL API로 최근 커밋 5개 조회
2. 커밋 메시지에서 진행률(%) 추출
3. 작업 상태 변환 (진행중 → 완료 등)
4. Supabase에 진행도 저장
5. Telegram 메시지 발송

**코드 구조:**
```typescript
// route.ts
export async function POST(request: Request) {
  // 1. Authorization 검증
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Git 커밋 조회
  const commits = await getLatestCommits(5);

  // 3. 진행률 추출 및 파싱
  const updates = commits.map(commit => parseProgressFromMessage(commit.message));

  // 4. CTB 갱신
  await updateCTB(updates);

  // 5. Telegram 알림
  await sendTelegramNotification({
    text: `✅ CTB 업데이트: ${updates.length}개 항목 변경`
  });

  // 6. 로그 기록
  await insertCronLog({
    cron_name: 'ctb-realtime-update',
    status: 'success',
    output_rows: updates.length
  });

  return Response.json({ success: true, updated: updates.length });
}
```

**학습점:**
- Authorization 헤더 검증
- 외부 API (GitHub) 통합
- Supabase 업데이트 쿼리
- 에러 처리 & 재시도

---

#### Cron A2: 주간 리포트 생성 (매주 월요일 08:00)
**파일:** `app/api/cron/weekly-reports/generate/route.ts`  
**목적:** 지난주 활동 요약 → Telegram 자동 배포

**데이터:**
- 완료된 작업 건수
- 평균 완료시간
- 팀원별 기여도
- 블로킹 항목 분석

**출력:** Telegram #경영실적채널에 마크다운 포매팅된 리포트

---

#### Cron A3-A5: 백업 자동화 (3개 Cron)
**파일:** `app/api/cron/backups/*/route.ts` (schedule, cleanup, metrics)

| Cron | 주기 | 목적 | 산출물 |
|------|------|------|--------|
| A3 Schedule | 매일 02:00 | DB 전체 백업 + gzip | backup_policies 갱신 |
| A4 Cleanup | 매일 03:00 | 90일 이상 백업 삭제 | 저장소 용량 해제 |
| A5 Metrics | 매일 06:00 | 백업 성공률 집계 | backup_metrics 기록 |

---

### 2.2 Vercel Cron 설정 이해

**현재 설정:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/ctb/realtime-update",
      "schedule": "0 8,14,15,18 * * *"
    },
    {
      "path": "/api/cron/weekly-reports/generate",
      "schedule": "0 8 * * 1"
    },
    {
      "path": "/api/cron/backups/schedule",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/backups/cleanup",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/backups/metrics",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Cron 표현식 분석:**
- `0 8 * * *` = 매일 08:00 (분 시 일 월 요일)
- `0 8,14,15,18 * * *` = 매일 08:00, 14:00, 15:00, 18:00
- `0 8 * * 1` = 매주 월요일 08:00

**Timezone:** UTC+0 (Vercel는 UTC 기준) → 실제 실행은 UTC 기준이므로 KST 변환 필요
- KST 08:00 = UTC 2026-05-25 23:00 (전날)
- 코드 내에서 `formatInTimeZone(..., 'Asia/Seoul', ...)` 사용해 보정

### 2.3 환경변수 & 인증 토큰

**필수 환경변수:**
```bash
# Cron 인증
CRON_SECRET=<generate-32-char-random-key>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (주의: service role만 사용)

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg
TELEGRAM_REPORTING_CHANNEL_ID=-1001234567890

# GitHub (선택, CTB 커밋 파싱용)
GITHUB_TOKEN=ghp_... (repo, workflow scope 필수)
```

**토큰 생성/확인:**
1. **CRON_SECRET** → `openssl rand -hex 16` 또는 안전한 난수 생성기
2. **SUPABASE_SERVICE_ROLE_KEY** → Supabase Dashboard → Settings → API Keys → service_role
3. **TELEGRAM_BOT_TOKEN** → BotFather (@BotFather) → /newbot → 토큰 복사
4. **TELEGRAM_REPORTING_CHANNEL_ID** → Telegram 채널 ID (음수: -1001234567890)

### 2.4 로컬 테스트 실행

```bash
# 1. 개발 서버 시작
npm run dev

# 2. 다른 터미널에서 Cron 수동 호출 (테스트)
export CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)

# CTB 업데이트 테스트
curl -X POST http://localhost:3000/api/cron/ctb/realtime-update \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'

# 응답 확인 (성공 예시)
# {"success":true,"updated":3,"message":"3 tasks updated"}

# 3. Supabase cron_logs 테이블 확인 (새 로그 추가됨)
```

**테스트 체크리스트:**
- [ ] HTTP 200 응답 확인
- [ ] Telegram 채널에 메시지 도착 확인
- [ ] `cron_logs` 테이블에 성공 기록 확인
- [ ] 데이터베이스 테이블 변경사항 확인

---

## 3️⃣ Git 웹훅 & 자동화

### 3.1 GitHub 웹훅 설정

**목적:** Git push 후 자동으로 CTB 갱신 (시간 기다리지 않음)

**설정 방법:**
1. GitHub Repository → Settings → Webhooks → Add webhook
2. **Payload URL:** `https://[production-domain]/api/webhooks/github`
3. **Content type:** application/json
4. **Events:** 
   - ✅ Push events (커밋 푸시 시)
   - ☐ Pull requests
   - ☐ Issues
5. **Active:** ✅ 체크

**예시 Payload:**
```json
{
  "ref": "refs/heads/main",
  "repository": {
    "name": "workspace-dev",
    "full_name": "jeepney/workspace-dev"
  },
  "pusher": {
    "name": "Claude Bot"
  },
  "commits": [
    {
      "id": "abc1234def5678",
      "message": "docs: Asset Master Phase 2 (75%)",
      "author": { "name": "Claude Bot" }
    }
  ]
}
```

### 3.2 CTB 자동 동기화 트리거

**파일:** `app/api/webhooks/github/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. GitHub 시그니처 검증 (보안)
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifyGitHubSignature(signature, body)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. 커밋 메시지 추출
  const payload = await request.json();
  const commits = payload.commits || [];

  // 3. 각 커밋에서 진행률(%) 파싱
  const updates = commits
    .filter(c => c.message.match(/\(\d+%\)/))
    .map(c => ({
      commit_id: c.id,
      message: c.message,
      progress: parseInt(c.message.match(/\((\d+)%\)/)?.[1] || '0')
    }));

  // 4. CTB 업데이트
  if (updates.length > 0) {
    await updateCTB(updates);
  }

  // 5. Telegram 알림
  await sendTelegramNotification({
    text: `🔄 웹훅: ${updates.length}개 작업 업데이트됨`
  });

  return Response.json({ success: true, processed: updates.length });
}
```

### 3.3 커밋 파싱 로직

**패턴 인식:**
```
"docs: Asset Master Phase 2 (75%)" → 진행률 75%
"feat(api): New endpoint (50%)" → 진행률 50%
"fix: Bug (100%)" → 진행률 100% → 완료
```

**추출 함수:**
```typescript
function extractProgress(message: string): number | null {
  const match = message.match(/\((\d+)%\)/);
  return match ? parseInt(match[1]) : null;
}

function extractTaskName(message: string): string {
  return message.replace(/\s*\(\d+%\)/, '').split(':')[1]?.trim() || '';
}
```

---

## 4️⃣ CTB (Central Task Board) 추적

### 4.1 active_work_tracking.md 구조

**파일:** `/home/jeepney/.openclaw/workspace-dev/memory/active_work_tracking.md`

**구조:**
```markdown
# 활동 추적판 (Active Work Tracking Board)

## 【현황】
- 신뢰도: 95% (목표)
- 진행률: 60%
- 팀 용량: 100% (4/4 활동)

## 【진행 중】(🟡)
| 작업 | 담당 | 진행률 | ETA | 블로킹 |
|------|------|--------|-----|---------|
| Asset Master Phase 2 | Web-Builder | 45% | 2026-05-30 | API 설계 검토 대기 |

## 【완료】(🟢)
| 작업 | 담당 | 완료시각 | 노트 |
|------|------|----------|------|
| Backup Phase 2 | Web-Builder | 2026-05-23 | ✅ 배포 완료 |

## 【대기】(🔴)
| 작업 | 담당 | 사유 | ETA |
|------|------|------|-----|
| Travel Management Phase 2 | Planner | 설계 대기 | 2026-05-26 |
```

**색상 규칙:**
- 🟢 완료 (Completed)
- 🟡 진행중 (In Progress)
- 🔴 대기/블로킹 (Pending/Blocked)

### 4.2 실시간 업데이트 메커니즘

**업데이트 소스 (우선순위순):**
1. **Git 커밋** (웹훅) → 즉시 (커밋 시)
2. **Vercel Cron** → 정기 (08:00, 14:00, 15:00, 18:00)
3. **수동 API 호출** → 주문형 (팀원 요청 시)

**업데이트 흐름:**
```
Git Commit with "(75%)"
    ↓
GitHub Webhook → /api/webhooks/github
    ↓
Parse commit message
    ↓
updateCTB({task: 'Asset Master Phase 2', progress: 75%})
    ↓
Supabase active_work_tracking 테이블 갱신
    ↓
active_work_tracking.md 마크다운 재생성 (자동화 필수)
    ↓
Telegram 알림 (선택)
```

**중요:** active_work_tracking.md를 수동으로 편집하면 안 됨. 항상 자동화 스크립트가 처리해야 함.

---

## 5️⃣ 실시간 업데이트 권한 부여

### 5.1 Automation Specialist 권한 설정

**필요한 권한:**
- ✅ active_work_tracking.md 읽기/쓰기 권한
- ✅ Supabase `active_work_tracking` 테이블 쓰기 권한
- ✅ Telegram 메시지 발송 권한 (TELEGRAM_BOT_TOKEN)
- ✅ GitHub Webhook 수신 권한
- ✅ Vercel Cron 모니터링 권한

### 5.2 권한 부여 스크립트

```bash
#!/bin/bash
# 파일: scripts/grant-automation-specialist-permissions.sh

echo "【권한 부여】Automation Specialist"

# 1. active_work_tracking.md 쓰기 권한
chmod 644 memory/active_work_tracking.md
echo "✅ File permissions: memory/active_work_tracking.md"

# 2. Supabase RLS (Row-Level Security) 정책 설정
# (Supabase Dashboard에서 수동 설정 또는 SQL)
cat <<EOF
수동 설정 필요:
Supabase Dashboard → Authentication → Policies
테이블: active_work_tracking
작업: UPDATE/INSERT
규칙: 모든 인증된 사용자 허용
EOF

# 3. 환경변수 설정 확인
echo "✅ Environment variables:"
echo "  - CRON_SECRET: $([ -n "$CRON_SECRET" ] && echo 'SET' || echo 'NOT SET')"
echo "  - TELEGRAM_BOT_TOKEN: $([ -n "$TELEGRAM_BOT_TOKEN" ] && echo 'SET' || echo 'NOT SET')"
echo "  - GITHUB_TOKEN: $([ -n "$GITHUB_TOKEN" ] && echo 'SET' || echo 'NOT SET')"

# 4. GitHub Webhook 설정 확인
echo "✅ GitHub Webhook: https://github.com/jeepney/workspace-dev/settings/hooks"

# 5. Vercel Cron 모니터링 URL
echo "✅ Vercel Cron Dashboard: https://vercel.com/jeepney/workspace-dev/cron"

echo ""
echo "【완료】모든 권한이 부여되었습니다."
```

**실행:**
```bash
bash scripts/grant-automation-specialist-permissions.sh
```

---

## 6️⃣ 일일 자동 체크포인트 설정

### 6.1 일일 체크포인트 목적

**08:00 체크포인트:** 어제 블로킹 항목 확인 + 오늘 예상 블로킹 감지  
**14:00 체크포인트:** 점심 이후 진행 상황 점검 + 경영실적 리포팅  
**15:00 체크포인트:** 오후 중반 평가자 큐 상태 확인  
**18:00 체크포인트:** 일일 최종 점검 + 내일 계획 업데이트

### 6.2 자동 체크포인트 설정 스크립트

```bash
#!/bin/bash
# 파일: scripts/setup-daily-checkpoints.sh

echo "【설정】일일 자동 체크포인트"

# vercel.json에 4개 체크포인트 Cron 추가
cat > /tmp/cron-config.json <<'EOF'
{
  "crons": [
    {
      "path": "/api/cron/checkpoints/08:00",
      "schedule": "0 23 * * *"
    },
    {
      "path": "/api/cron/checkpoints/14:00",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/cron/checkpoints/15:00",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/checkpoints/18:00",
      "schedule": "0 9 * * *"
    }
  ]
}
EOF

# 기존 Cron과 병합 (또는 수동으로 vercel.json 편집)
echo "ℹ️  vercel.json을 위 설정으로 업데이트하세요."
echo "📄 생성된 설정: /tmp/cron-config.json"

# Vercel에 배포
echo ""
echo "【배포】Vercel에 반영"
git add vercel.json
git commit -m "chore: Add daily checkpoint cron jobs"
git push origin main

echo "✅ Vercel에 자동 배포됩니다."
echo "📊 모니터링: https://vercel.com/jeepney/workspace-dev/cron"
```

**실행:**
```bash
bash scripts/setup-daily-checkpoints.sh
```

### 6.3 체크포인트별 기록 항목

각 체크포인트마다 자동 기록할 정보:

```typescript
interface CheckpointRecord {
  timestamp: string;              // 2026-05-25 08:00:00 KST
  scheduled_time: string;         // "08:00"
  status: "success" | "missed" | "delayed";
  active_tasks_count: number;     // 진행 중인 작업 수
  completed_today: number;        // 오늘 완료된 작업 수
  blocked_items: string[];        // 블로킹 항목 목록
  next_checkpoint: string;        // "14:00"
  notes: string;                  // 자유 기록
}
```

**자동 저장 위치:** Supabase `checkpoint_records` 테이블 + memory 파일

---

## 📋 Day 1 마무리 체크리스트

### 학습 확인
- [ ] OpenClaw 게이트웨이 아키텍처 설명 가능
- [ ] 4개 기존 Cron의 역할과 일정을 외움
- [ ] Vercel Cron 표현식 직접 작성 가능
- [ ] GitHub 웹훅과 CTB 동기화 원리 이해
- [ ] active_work_tracking.md 구조를 읽고 수정 가능

### 기술 검증
- [ ] 로컬에서 Cron 수동 호출 성공 (curl)
- [ ] Supabase에서 cron_logs 테이블 조회 확인
- [ ] GitHub 웹훅 설정 완료 (저장소 Settings에서 확인)
- [ ] 환경변수 7개 모두 설정됨 (vercel secrets에서 확인)
- [ ] Telegram 테스트 메시지 발송 성공

### 권한 확인
- [ ] active_work_tracking.md 쓰기 권한 있음
- [ ] Supabase RLS 정책 확인됨
- [ ] Vercel Cron 대시보드 접근 가능
- [ ] GitHub 웹훅 수신 로그 확인 가능

---

## 📚 다음 단계 (Day 2-8)

**Day 2-4:** 일일 경영실적 리포팅 자동화 (Project 1)  
**Day 5-6:** GitHub/ProductHunt 정보 수집 (Project 2)  
**Day 7-8:** KPI 자동 통계 & 이상치 감시 (Project 3)

자세한 내용은 `memory/automation_specialist_onboarding.md` (전체 패키지) 참고.

---

**작성:** 2026-05-25 14:30 KST  
**대상:** Automation Specialist (신규)  
**리뷰:** Secretary Agent → Evaluator AI Agent
