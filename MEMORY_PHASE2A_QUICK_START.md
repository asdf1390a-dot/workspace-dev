# Memory Phase 2A — 개발자 Quick Start Guide

**대상:** Backend Developer (Node.js/Express)  
**작성일:** 2026-06-20 KST  
**ETA 완료:** Today (금일)

---

## 📝 요구사항 요약

### 기능 목록 (우선순위)

**P0 (필수):**
- ✅ POST /api/collect-messages (OpenClaw Gateway 메시지 수집)
- ✅ POST /api/collect-memory (로컬 메모리 파일 수집)
- ✅ POST /api/batch-collect (다중 소스 동시 수집)
- ✅ GET /health (헬스 체크)
- ✅ Error logging + retry (3회, exponential backoff)

**P1 (권장):**
- [ ] GET /api/status (통계 및 메트릭)
- [ ] Message tagging schema
- [ ] Admin dashboard integration

**P2 (선택):**
- [ ] POST /api/tag-messages
- [ ] GET /api/search-by-tag
- [ ] Telegram/Discord 입수

---

## 🏗️ 시스템 아키텍처

```
┌────────────────────────────────────────────────────────┐
│                    Memory Automation                    │
└────────────────────────────────────────────────────────┘
                           ▲
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   [Gateway]          [File System]      [External APIs]
   (Sessions)         (MEMORY.md)         (Telegram later)
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Phase 2A API │
                    │  (port 3009) │
                    └──────┬───────┘
                           │
                    ┌──────▼──────────┐
                    │  FileQueue      │  queue/
                    │  (메모리 + 디스크) │
                    └──────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    Phase 2B           Phase 2C          Postgres
    (Dedup)         (Trust Score)      (향후, 선택)
```

---

## 🗄️ 데이터 흐름

```
1. Client 요청
   POST /api/collect-messages
   {
     "sessionKey": "session-123",
     "limit": 100,
     "offset": 0
   }

2. Backend 처리
   a) Gateway에 요청 + 3회 재시도
   b) 메시지 포맷 (checksum, timestamp)
   c) 큐에 저장 (FileQueue)
   d) 응답 반환

3. 큐 처리 (Phase 2B, 2C)
   a) 대기 중인 메시지 → 중복 감지
   b) 신뢰도 점수 산정
   c) Postgres 저장 (향후)

4. 모니터링
   - Admin dashboard 실시간 업데이트
   - Telegram 알림
   - 에러 로깅
```

---

## 📦 설치 및 실행

### 1. 환경 설정

```bash
# .env 파일 생성
cd /home/jeepney/.openclaw/workspace-dev/memory-automation

cat > .env << 'EOF'
# OpenClaw Gateway
GATEWAY_URL=http://localhost:3000
GATEWAY_TOKEN=your-secret-token-here
GATEWAY_PATH=/mcp/sessions_history

# Server
PORT=3009
NODE_ENV=development

# Memory Files
MEMORY_DIR=/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory

# Logging
LOG_LEVEL=info

# Optional: Alerts
DISCORD_WEBHOOK=https://discordapp.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Optional: Test Mode (disable network, use mock data)
PHASE2A_TEST_MODE=false
EOF
```

### 2. 의존성 설치

```bash
npm install
```

**주요 패키지:**
```json
{
  "express": "^4.18.0",
  "body-parser": "^1.20.0",
  "dotenv": "^16.0.0",
  "node-fetch": "^2.6.0",
  "crypto": "builtin"
}
```

### 3. 디렉토리 구조

```bash
mkdir -p logs queue data
chmod 755 logs queue data
```

### 4. 서버 시작

```bash
# 개발 모드
npm start

# 또는 nodemon으로 자동 재로드
npm run dev

# 프로덕션
NODE_ENV=production npm start
```

**확인:**
```bash
curl http://localhost:3009/health
# 응답: { "status": "ready", "timestamp": "...", "uptime": 5 }
```

---

## 🔌 API 빠른 참고

### 메시지 수집

```bash
curl -X POST http://localhost:3009/api/collect-messages \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionKey": "session-abc123",
    "limit": 100,
    "offset": 0,
    "includeTools": true
  }'
```

**응답 (예시):**
```json
{
  "success": true,
  "count": 50,
  "enqueued": 50,
  "messages": [
    {
      "messageId": "msg-uuid-1",
      "timestamp": "2026-06-20T10:15:30.123Z",
      "author": "user@example.com",
      "role": "user",
      "content": "What's the status?",
      "tokens": 12,
      "source": "gateway"
    }
  ],
  "collectedAt": "2026-06-20T10:30:45.123Z",
  "processingTime": 245
}
```

### 메모리 파일 수집

```bash
curl -X POST http://localhost:3009/api/collect-memory \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "MEMORY.md",
    "lines": 100
  }'
```

### 배치 수집

```bash
curl -X POST http://localhost:3009/api/batch-collect \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "type": "message",
        "params": { "sessionKey": "session-123", "limit": 100 }
      },
      {
        "type": "memory",
        "params": { "path": "MEMORY.md", "lines": 50 }
      }
    ],
    "options": {
      "parallel": true,
      "continueOnError": true
    }
  }'
```

---

## 🧪 테스트

### 단위 테스트 (Jest)

```bash
npm test

# 특정 테스트만
npm test -- --testNamePattern="collect-messages"

# 커버리지 확인
npm test -- --coverage
```

### 통합 테스트

```bash
# 테스트 모드 활성화
export PHASE2A_TEST_MODE=true
npm start

# 다른 터미널에서
npm run test:integration
```

### 성능 테스트

```bash
# 1000개 메시지 수집 벤치마크
npm run benchmark
```

---

## 📊 모니터링 및 디버깅

### 로그 확인

```bash
# 실시간 로그
tail -f logs/phase2a-*.log

# JSON 형식 확인
cat logs/phase2a-errors.log | jq '.'

# 특정 에러 필터링
grep "GATEWAY_UNAVAILABLE" logs/phase2a-errors.log | jq '.timestamp'
```

### 상태 확인

```bash
# API 통계
curl http://localhost:3009/api/status | jq '.'

# 큐 크기
ls queue/ | wc -l

# 메모리 사용률
ps aux | grep "node.*phase2a"
```

### 에러 처리

**에러 타입별 대응:**

| 에러 코드 | 원인 | 해결책 |
|----------|------|------|
| `MISSING_SESSION_KEY` | 필수 파라미터 누락 | 요청 확인 |
| `INVALID_TOKEN` | 인증 실패 | `GATEWAY_TOKEN` 확인 |
| `GATEWAY_UNAVAILABLE` | Gateway 다운 | Gateway 상태 확인, 재시도 |
| `FILE_NOT_FOUND` | 메모리 파일 없음 | 파일 경로 확인 |
| `INVALID_PATH` | 경로 검증 실패 | 상대 경로 사용 (traversal 방지) |
| `RATE_LIMITED` | Rate limit 초과 | 30초 대기 후 재시도 |

---

## 🔒 보안 체크리스트

- [ ] `GATEWAY_TOKEN` 환경변수로 관리 (.env 파일)
- [ ] 경로 검증: `path.resolve()` + `startsWith(MEMORY_DIR)` 확인
- [ ] 입력 검증: `sessionKey`, `path` 길이 제한
- [ ] 에러 메시지에 민감정보 노출 안 함
- [ ] HTTPS 사용 (프로덕션)
- [ ] Rate limiting 구성
- [ ] CORS 설정 (필요시)

---

## 🚀 배포

### 로컬 배포 (개발)

```bash
npm start
```

### Vercel/Railway 배포 (프로덕션)

```bash
# 1. 배포 설정
vercel env add GATEWAY_TOKEN
vercel env add GATEWAY_URL
vercel env add MEMORY_DIR

# 2. 배포
vercel deploy

# 3. 확인
curl https://memory-api.example.com/health
```

### Docker 배포 (선택)

```bash
# Dockerfile 생성
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3009
CMD ["npm", "start"]
EOF

# 빌드 및 실행
docker build -t memory-collection-api:1.0.0 .
docker run -p 3009:3009 --env-file .env memory-collection-api:1.0.0
```

---

## 📅 Cron 자동화

### Cron Job 등록

```bash
# OpenClaw Gateway Cron 등록
curl -X POST http://localhost:3000/api/cron/register \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phase 2A - Message Collection",
    "schedule": "0 0,6,12,18 * * *",
    "timezone": "Asia/Seoul",
    "script": "/path/to/phase2a-cron.sh"
  }'
```

### Cron 스크립트 (`phase2a-cron.sh`)

```bash
#!/bin/bash
set -e

cd /home/jeepney/.openclaw/workspace-dev/memory-automation

# 로그 초기화
LOG_FILE="logs/phase2a-$(date +%Y%m%d-%H%M%S).log"

# API 호출
echo "$(date): Starting Phase 2A collection..." >> "$LOG_FILE"

curl -X POST http://localhost:3009/api/batch-collect \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"type": "message", "params": {"sessionKey": "main", "limit": 500}},
      {"type": "memory", "params": {"path": "MEMORY.md", "lines": 100}}
    ]
  }' >> "$LOG_FILE" 2>&1

echo "$(date): Phase 2A collection completed." >> "$LOG_FILE"

# Telegram 알림 (선택)
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
  curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage \
    -d "chat_id=$TELEGRAM_CHAT_ID" \
    -d "text=Phase 2A collection completed at $(date)"
fi
```

---

## 📋 체크리스트

### Before Production

- [ ] 모든 엔드포인트 테스트 완료
- [ ] 에러 처리 및 재시도 로직 검증
- [ ] Rate limiting 설정 완료
- [ ] 로그 로테이션 테스트
- [ ] 보안 검토 완료 (경로 검증, 토큰 관리)
- [ ] 성능 벤치마크 (응답 시간 <2s)
- [ ] 모니터링 설정 (Sentry, Datadog)
- [ ] Cron job 등록 및 테스트
- [ ] Telegram/Discord 알림 설정
- [ ] 백업 계획 (메모리 파일, 큐 상태)

### After Deployment

- [ ] 첫 Cron 실행 확인 (로그 확인)
- [ ] Admin dashboard 연동 확인
- [ ] Phase 2B 자동 실행 확인
- [ ] 24시간 모니터링 (에러율, 응답 시간)
- [ ] Capacity 모니터링 (디스크 공간, 메모리)

---

## 🔗 참고 문서

**핵심 설계 문서:**
1. **[MEMORY_MESSAGE_COLLECTION_API_DESIGN_SPEC.md](./MEMORY_MESSAGE_COLLECTION_API_DESIGN_SPEC.md)**
   - API 명세 (8개 엔드포인트)
   - 데이터 스키마
   - Rate limiting 전략
   - 의존성 및 통합

2. **[MEMORY_ADMIN_DASHBOARD_DESIGN.md](./MEMORY_ADMIN_DASHBOARD_DESIGN.md)**
   - UI/UX 레이아웃 (4개 페이지)
   - 컴포넌트 명세
   - 상태 관리 구조
   - 모바일 반응형

3. **[phase2a-message-collection.js](./memory-automation/phase2a-message-collection.js)**
   - 기존 구현 (참고용)

4. **[README_PHASE2A.md](./memory-automation/README_PHASE2A.md)**
   - Phase 2A 완료 상태 기록

**관련 Phases:**
- Phase 2B (Duplicate Detection): `/memory-automation/PHASE2B_COMPLETE_DESIGN.md`
- Phase 2C (Trust Scoring): `/memory-automation/PHASE2C_SPEC.md`
- Cron 설계: `/memory-automation/CRON_DESIGN_SPEC.md`

---

## ❓ FAQ

**Q: 메시지 수집 시 Gateway가 느리면?**
A: Timeout 30초, 재시도 3회. 응답 시간이 평균 <2s이므로 대부분 빠름.

**Q: 큐 크기가 계속 증가하면?**
A: Phase 2B 처리 속도 확인. 필요시 batch size 조정 또는 스케일링.

**Q: 메모리 파일을 자주 업데이트하면?**
A: Checksum으로 변경 감지. 동일한 파일은 중복 제거 (Phase 2B).

**Q: Cron이 실패하면?**
A: 로그 확인 → 수동 재시도 `/api/cron/trigger` → Telegram 알림.

**Q: 보안 토큰은 어디에?**
A: 환경변수 `.env` (git ignore) 또는 시크릿 매니저 (Vercel/Railway).

---

**상태:** ✅ Ready for Development  
**예상 소요시간:** 4-6시간 (API) + 2-3시간 (Dashboard UI)  
**합계 ETA:** Today (금일)
