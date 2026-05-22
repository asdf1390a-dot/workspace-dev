# DISCORD-BOT-P1 Phase 1 — 인도 보고서

작성일: 2026-05-22
담당: DISCORD-BOT-P1 서브에이전트
상태: 🟢 구현 완료 / ⏳ 통합 테스트·배포 대기

---

## 1. 산출물 요약

| 카테고리 | 항목 | 상태 |
|----------|------|------|
| DB 마이그레이션 | 4개 테이블 + 1개 뷰 | 🟢 완료 |
| Next.js API | 14개 엔드포인트 | 🟢 완료 |
| Python 봇 | 7개 파일 (httpx + asyncio 큐) | 🟢 완료 |
| 모니터링 UI | `/discord/monitoring` 페이지 + CSS 모듈 | 🟢 완료 |
| 통합 테스트 | OAuth → Sync → 메시지 라우팅 | ⏳ 평가자 대기 |
| 배포 | Vercel + 봇 호스팅 | ⏳ 평가자 대기 |

---

## 2. 파일 인벤토리

### 2-1. DB 마이그레이션 (1개 파일)

```
dsc-fms-portal/db/34_discord_bot_phase1.sql
```

생성 객체:
- 테이블: `discord_configs`, `discord_sync_logs`, `discord_message_maps`, `discord_channel_settings`
- 뷰: `discord_metrics_daily` (7일 일자별 성공/실패/대기 집계)
- RLS: owner_id 기반 정책 4개 (테이블별)
- 인덱스: guild_id, owner_id, created_at, sync_status, source/target msg_id 조합

### 2-2. Next.js API 라우트 (14개)

```
dsc-fms-portal/app/api/discord/
├── oauth/
│   ├── login/route.ts              # POST: code → tokens → upsert config
│   └── refresh/route.ts            # POST: refresh_token → 새 access_token
├── sync/
│   ├── status/route.ts             # GET: pending/error/24h 집계
│   ├── trigger/route.ts            # POST: 수동 sync 로그 row 생성
│   └── configure/route.ts          # POST: 길드 라우팅 채널 매핑 업데이트
├── channels/
│   ├── route.ts                    # GET: 길드별 채널 설정 목록
│   └── configure/route.ts          # POST: 채널 설정 upsert
├── messages/
│   ├── post-discord/route.ts       # POST: Telegram → Discord 미러
│   ├── post-telegram/route.ts      # POST: Discord → Telegram 미러
│   ├── edit/route.ts               # PATCH: 양방향 메시지 편집
│   └── delete/route.ts             # DELETE: 양방향 메시지 삭제
└── monitoring/
    ├── logs/route.ts               # GET: 페이지네이션 로그
    ├── metrics/route.ts            # GET: N일 메트릭 (daily view)
    └── dashboard/route.ts          # GET: 통합 스냅샷
```

공통 헬퍼: `dsc-fms-portal/lib/discord/api-helpers.ts`
- `authFromRequest`, `jsonOk`, `jsonError`, `logSync`, `contentHash`
- 상수: `DISCORD_API = "https://discord.com/api/v10"`, `TELEGRAM_API = "https://api.telegram.org"`

### 2-3. Python 봇 (7개 파일)

```
dsc-fms-portal/discord_bot/
├── __init__.py
├── .env.example                    # 환경변수 템플릿
├── requirements.txt                # discord.py 2.3.2, python-telegram-bot 21.4, httpx 0.27.2
├── config.py                       # Settings 데이터클래스, from_env() fail-fast
├── portal_client.py                # httpx 래퍼 — 6개 메서드
├── sync_queue.py                   # asyncio 큐 + 지수 백오프 (5회 재시도)
├── handlers.py                     # Discord/Telegram 이벤트 → SyncJob 변환
└── bot.py                          # 메인 엔트리: 두 클라이언트 동시 구동
```

### 2-4. 모니터링 UI (2개 파일)

```
dsc-fms-portal/app/discord/monitoring/
├── page.tsx                        # 클라이언트 컴포넌트, 15초 자동 갱신
└── page.module.css                 # KPI 타일 + 테이블 스타일
```

---

## 3. DB 마이그레이션 실행 방법

### 📍 접속링크
https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql

### ⚙️ 단계
1. 위 링크에서 SQL 에디터 진입
2. `dsc-fms-portal/db/34_discord_bot_phase1.sql` 파일 내용 복사 → 붙여넣기
3. **Run** 클릭 → "Success. No rows returned" 확인
4. 좌측 Table Editor에서 `discord_configs`, `discord_sync_logs`, `discord_message_maps`, `discord_channel_settings` 4개 테이블 존재 확인

### 검증 SQL
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'discord_%'
ORDER BY table_name;
-- 기대값: discord_channel_settings, discord_configs, discord_message_maps, discord_metrics_daily, discord_sync_logs
```

---

## 4. 환경변수 체크리스트

### Vercel (Next.js 포털) — 신규 추가 변수
- `DISCORD_CLIENT_ID` (Discord 개발자 포털)
- `DISCORD_CLIENT_SECRET` (Discord 개발자 포털)
- `DISCORD_BOT_TOKEN` (봇 API용)
- `DISCORD_OAUTH_REDIRECT_URI` (예: `https://dsc-fms-portal.vercel.app/auth/discord/callback`)
- `TELEGRAM_BOT_TOKEN` (BotFather)

### Python 봇 호스팅 (Railway/Fly/VPS) — `.env` 작성
`discord_bot/.env.example`을 `.env`로 복사 후 다음 채우기:
```
DISCORD_BOT_TOKEN=<봇 토큰>
DISCORD_CLIENT_ID=<클라이언트 ID>
DISCORD_CLIENT_SECRET=<클라이언트 시크릿>
DISCORD_BOT_PUBLIC_KEY=<공개키>
TELEGRAM_BOT_TOKEN=<텔레그램 봇 토큰>
PORTAL_API_BASE=https://dsc-fms-portal.vercel.app
PORTAL_SERVICE_JWT=<Supabase 서비스 JWT — 포털 호출용>
BOT_OWNER_ID=<운영자 Supabase UID>
BOT_GUILD_ID=<대상 Discord 길드 ID>
LOG_LEVEL=INFO
```

---

## 5. 배포 절차

### 5-1. Next.js 포털 (자동)
1. 모든 신규 파일을 `main` 브랜치에 푸시
2. Vercel 자동 빌드 → 배포
3. `/discord/monitoring` 페이지 접근 가능 (로그인 필요)

### 5-2. Python 봇 (수동)
```bash
cd dsc-fms-portal/discord_bot
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # 값 채우기
python -m discord_bot.bot
```

Railway 또는 Fly.io에 배포 시:
- Procfile: `worker: python -m discord_bot.bot`
- 항상 실행되는 워커 프로세스로 설정

---

## 6. OAuth 통합 흐름

1. 사용자가 `/discord/configure`에서 "Discord 연결" 클릭
2. 리다이렉트 → Discord 인증
3. 콜백 URL이 `POST /api/discord/oauth/login`에 `{ code, guild_id, guild_name }` 전달
4. 라우트가 `https://discord.com/api/v10/oauth2/token`로 코드 교환
5. `discord_configs`에 `(owner_id, guild_id)` upsert (access_token, refresh_token, expires_at)
6. 토큰 만료 시 `POST /api/discord/oauth/refresh` 호출

---

## 7. 메시지 라우팅 흐름

### Discord → Telegram
1. `bot.py`의 `on_message` 이벤트 발생
2. `handlers.make_discord_message_handler`가 채널 허용 확인
3. `SyncJob(kind="post_telegram", payload={...})`를 큐에 enqueue
4. 워커가 `portal_client.post_telegram()` 호출
5. `POST /api/discord/messages/post-telegram`이 Telegram API 호출 + `discord_message_maps` + `discord_sync_logs` 동시 기록

### Telegram → Discord
역방향, `post-discord` 라우트 사용

### 편집/삭제
포털 라우트(`/api/discord/messages/edit|delete`)가 `map_id` 또는 `discord_msg_id`/`telegram_msg_id`로 매핑 조회 후 양 플랫폼 동기화

---

## 8. 통합 테스트 체크리스트 (평가자용)

- [ ] DB 마이그레이션 실행 → 4 테이블 + 1 뷰 생성 확인
- [ ] Vercel 환경변수 5개 설정 후 재배포
- [ ] `POST /api/discord/oauth/login` — 더미 코드로 401 응답 확인 (정상)
- [ ] `GET /api/discord/sync/status?guild_id=X` — 200 + 빈 카운터 응답
- [ ] `/discord/monitoring` 페이지 로드 → KPI 4개 + 빈 테이블 정상 표시
- [ ] Python 봇 로컬 구동 → "Discord connected as ..." 로그 확인
- [ ] Discord 테스트 채널에 메시지 전송 → 5초 내 Telegram 미러링 확인
- [ ] Telegram 채팅에 메시지 전송 → 5초 내 Discord 미러링 확인
- [ ] 모니터링 페이지에서 sync_logs 2건 success 확인
- [ ] Discord 메시지 편집 → Telegram에서 편집 반영 확인
- [ ] Discord 메시지 삭제 → Telegram 메시지도 삭제 확인

---

## 9. 알려진 제약 / 후속 작업

1. **OAuth 콜백 페이지**: `/auth/discord/callback` 클라이언트 페이지는 본 Phase에 포함되지 않음. 평가자가 간단한 콜백 페이지 추가 필요 (`code` 파라미터를 `POST /api/discord/oauth/login`으로 전달).
2. **봇 호스팅**: 본 Phase는 봇 코드만 제공. Railway/Fly 배포는 평가자가 호스팅 선택 후 진행.
3. **Discord 슬래시 명령**: Phase 1 범위 외. Phase 2에서 `/sync-status` 등 추가 예정.
4. **첨부파일 미러링**: 텍스트만 지원. 이미지/파일은 Phase 2 범위.
5. **Rate Limit 대응**: 기본 5회 백오프만 구현. Discord 429 응답 시 `Retry-After` 헤더 반영은 Phase 2.

---

## 10. 다음 담당자 인계

- **Owner**: 평가자 (Evaluator) — 통합 테스트 + 배포 승인
- **차순위**: 웹개발자 — OAuth 콜백 페이지 + 봇 호스팅 세팅
- **Stage**: VERIFY (LCS) — 모든 코드 커밋 후 평가 대기
- **Git Commits**: 본 서브에이전트는 커밋 권한 없음. 메인 에이전트가 통합 후 일괄 커밋 권장 (`feat(discord): Phase 1 bot+monitoring`).

---

## 11. 일일 리포트 일정

- 다음 보고: 2026-05-23 17:00 KST
- 채널: Telegram #results
- 내용: 통합 테스트 진행 상황, 발견된 결함, 배포 ETA
