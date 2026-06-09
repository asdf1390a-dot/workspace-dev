# DISCORD-BOT-P0 인수인계 체크리스트

**대상:** Web-Builder #2 (Python 개발자)  
**생성일:** 2026-06-09 16:30 KST  
**설계 문서:** [DISCORD_BOT_P0_DESIGN.md](./DISCORD_BOT_P0_DESIGN.md)  
**예상 소요시간:** 2.5일 (18시간)  

---

## 📦 인수 전 준비 (Web-Builder #1 → #2)

### 코드 저장소 준비
- [ ] `discord-bot-p0/` 디렉토리 생성
- [ ] GitHub 저장소 생성 (또는 monorepo 브랜치)
  - 옵션 A: dsc-fms-portal 내부 `/discord-bot/` 디렉토리
  - 옵션 B: 별도 레포 `dsc-discord-bot-p0`
- [ ] GitHub Actions 시크릿 설정
  - `DISCORD_TOKEN` (Bot token)
  - `SUPABASE_URL` (https://xxx.supabase.co)
  - `SUPABASE_SERVICE_ROLE_KEY` (service role key)
  - `TELEGRAM_BOT_TOKEN` (Telegram bot token)

### 개발 환경 설정
- [ ] Python 3.10+ 설치 확인
- [ ] Virtual environment 생성
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
- [ ] 의존성 설치 (예정)
  - discord.py 2.0+
  - supabase-py
  - aiohttp
  - python-dotenv
  - pydantic
  - pytest
  - pytest-asyncio

### 설계 문서 검토
- [ ] Web-Builder #2가 `DISCORD_BOT_P0_DESIGN.md` 정독
  - 5개 프로세서 통합 이해
  - 메시지 흐름도 이해
  - DB 스키마 이해
  - Phase 1~3 로드맵 이해
- [ ] 질문 목록 작성 (설명 받을 항목)
- [ ] 기술적 제약 / 우려사항 논의

---

## 🚀 Phase 1: Core Bot & Event Handling (1일)

### 1.1 프로젝트 구조 초기화 (30분)
- [ ] `discord-bot-p0/` 디렉토리 구조 생성
  ```
  discord-bot-p0/
  ├── main.py
  ├── requirements.txt
  ├── .env.example
  ├── Makefile
  ├── pyproject.toml
  ├── README.md
  ├── Dockerfile
  ├── docker-compose.yml
  ├── .gitignore
  ├── config/
  ├── bot/
  ├── processors/
  ├── db/
  ├── utils/
  ├── tests/
  └── .github/workflows/
  ```
- [ ] `README.md` 작성 (프로젝트 개요)
- [ ] `requirements.txt` 작성 (필수 패키지)
- [ ] `.env.example` 작성 (환경변수 템플릿)
- [ ] `Makefile` 작성 (run, test, build 타겟)

### 1.2 설정 & 로깅 (1시간)
- [ ] `config/settings.py` 구현
  - 환경변수 로딩 (DISCORD_TOKEN, API_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  - Pydantic 설정 검증
  - 기본값 정의
- [ ] `config/constants.py` 구현
  - Discord embed 색상 코드 (0x3498db, 0x2ecc71, etc.)
  - Regex 패턴 (한국어/영어 키워드)
  - Magic strings (channel names, role names)
- [ ] `utils/logger.py` 구현
  - Structured logging (JSON 포맷)
  - DEBUG/INFO/WARNING/ERROR 레벨
  - 파일 + stdout 로깅

**검증:**
- [ ] `python -c "from config.settings import Settings; Settings()"`로 임포트 성공
- [ ] 로그 파일 생성됨 (예: `logs/bot.log`)

### 1.3 Bot 클라이언트 초기화 (1시간)
- [ ] `bot/client.py` 구현
  ```python
  class DiscordClient:
      def __init__(self, token):
          self.intents = discord.Intents.default()
          self.intents.message_content = True
          self.intents.members = True
          self.bot = commands.Bot(command_prefix='/', intents=self.intents)
  ```
- [ ] `main.py` 구현 (entrypoint)
  ```python
  if __name__ == '__main__':
      bot = DiscordClient(settings.DISCORD_TOKEN)
      bot.run()
  ```
- [ ] `bot/events.py` 구현
  - `on_ready()` 이벤트
  - `on_message()` 이벤트 스텁
  - 기본 로깅

**검증:**
- [ ] `make run` 실행 → Bot이 Discord에 접속
- [ ] `print(f"Bot logged in as {bot.user.name}")` 메시지 표시
- [ ] Discord 서버에서 Bot 온라인 상태 확인

### 1.4 프로세서 라우팅 (2시간)
- [ ] `processors/base.py` 구현
  - BaseProcessor 추상 클래스
  - `async def call()` 메서드
  - API 호출 (aiohttp)
  - Embed 변환 (_build_embed)
  - 에러 처리 (타임아웃 10초, 재시도 3회)

- [ ] `processors/router.py` 구현
  - `route_message()` 함수
  - Regex 패턴 매칭 (secretary, translator, analyst, developer, planner)
  - `call_processor()` 함수
  - 폴백 핸들러 (키워드 매칭 실패 시)

- [ ] 각 프로세서 구현 (5개)
  - `processors/secretary.py`: BaseProcessor 상속
  - `processors/translator.py`
  - `processors/analyst.py`
  - `processors/developer.py`
  - `processors/planner.py`
  - 각각 processor_name 지정 (예: "secretary")

**검증:**
```python
# Test processor call
processor = SecretaryProcessor()
embed = await processor.call(
    message_id="123",
    channel_id="456",
    user_id="789",
    username="TestUser",
    content="일정",
    timestamp="2026-06-09T10:00:00Z"
)
assert embed is not None
assert embed.title == "📅 주간 일정 현황"
```

### 1.5 Supabase 통합 (1시간)
- [ ] `db/supabase_client.py` 구현
  - Singleton 패턴
  - `get_supabase()` 함수
  - 타임아웃 설정 (10초)

- [ ] `db/queries.py` 구현
  - `insert_discord_message()`: discord_messages 삽입
  - `log_sync()`: discord_sync_log 삽입
  - `check_duplicate()`: 중복 확인
  - `get_channel_config()`: 채널 설정 조회

- [ ] `db/models.py` 구현
  - `DiscordMessage` dataclass
  - `DiscordTask` dataclass
  - `DiscordNotification` dataclass
  - `DiscordSyncLog` dataclass

**검증:**
```python
# Test DB connection
supabase = get_supabase()
response = supabase.table('discord_messages').select('*').limit(1).execute()
assert response is not None
```

### 1.6 메시지 저장 (1.5시간)
- [ ] `bot/events.py`의 `on_message()` 완성
  ```python
  @bot.event
  async def on_message(message: discord.Message):
      if message.author == bot.user:
          return
      
      await store_message_in_db(message)  # 새 함수
      await route_message(bot, message)
      await bot.process_commands(message)
  ```

- [ ] `store_message_in_db()` 함수 구현
  - discord_messages 테이블 INSERT
  - 타임스탬프, 사용자, 채널 정보 저장
  - 에러 처리 (DB 오류 시 로그만 기록)

**검증:**
- [ ] Discord 채널에 테스트 메시지 전송
- [ ] Supabase discord_messages 테이블에 기록 확인
  ```sql
  SELECT * FROM discord_messages ORDER BY created_at DESC LIMIT 1;
  ```

### 1.7 테스트 & 배포 (1시간)
- [ ] `tests/test_processors.py` 작성
  ```python
  @pytest.mark.asyncio
  async def test_secretary_processor():
      processor = SecretaryProcessor()
      embed = await processor.call(...)
      assert embed.title == "📅 주간 일정 현황"
  ```

- [ ] `tests/` 디렉토리에 모든 프로세서 테스트
- [ ] `pytest tests/` 실행 → 모든 테스트 통과

- [ ] `Dockerfile` 작성
  ```dockerfile
  FROM python:3.10-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY . .
  CMD ["python", "main.py"]
  ```

- [ ] `docker-compose.yml` 작성 (선택)
- [ ] 로컬 Docker 빌드 및 실행 성공

**Phase 1 완료 기준:**
- ✅ Bot이 Discord에 접속 & ready 메시지 표시
- ✅ 메시지 감지 & 저장 (discord_messages 테이블)
- ✅ 5개 프로세서 모두 응답 확인 (embed 반환)
- ✅ pytest 모든 테스트 통과
- ✅ Docker 이미지 빌드 성공

**제출 물:**
- `discord-bot-p0/` 전체 코드 (~1000줄)
- 테스트 결과 스크린샷 (pytest 통과)
- 로컬 실행 로그 (Bot ready 메시지)

---

## 🌉 Phase 2: Telegram Sync & Task Management (1일)

### 2.1 메시지 동기화 핵심 (2시간)
- [ ] `sync/deduplication.py` 구현
  - SHA-256 해싱 함수
  - `compute_hash(text) -> str`
  - 중복 확인 `check_duplicate_by_hash(hash_value)`

- [ ] `sync/telegram_bridge.py` 구현
  - `sync_to_telegram(message)` 함수
    1. 채널 동기화 설정 확인
    2. Content hash 계산
    3. 중복 확인
    4. Telegram API 호출 (또는 webhook)
    5. discord_sync_log 기록
  - `handle_telegram_webhook(payload)` 함수
    1. 서명 검증 (HMAC-SHA256)
    2. 메시지 파싱
    3. Discord 채널 조회
    4. Bot 메시지 전송
    5. discord_sync_log 기록

**검증:**
```python
# Test hashing
hash1 = compute_hash("Hello")
hash2 = compute_hash("Hello")
assert hash1 == hash2

# Test duplicate detection
await insert_sync_log("discord", 123, "telegram", None, hash1)
is_dup = await check_duplicate_by_hash(hash1)
assert is_dup == True
```

### 2.2 Telegram 웹훅 엔드포인트 (1.5시간)
- [ ] `api/routes.py` 구현 (FastAPI 또는 Flask)
  ```python
  from fastapi import FastAPI, Request
  
  app = FastAPI()
  
  @app.post("/api/discord/incoming-telegram")
  async def incoming_telegram(request: Request):
      payload = await request.json()
      # Verify signature
      # Process message
      # Forward to Discord
      return {"ok": True}
  ```

- [ ] HMAC-SHA256 서명 검증
  - 헤더: `X-Telegram-Bot-Api-Secret-Token`
  - 체크: `hmac.new(bot_token.encode(), body, hashlib.sha256).hexdigest() == signature`

- [ ] 메시지 포맷팅
  - Telegram → Discord: `[Telegram @username] message text`
  - Embed 생성 (옵션)

- [ ] main.py에 API 마운트
  ```python
  from api.routes import app as api_app
  # Mount API routes to bot
  ```

**검증:**
- [ ] Telegram에서 테스트 메시지 전송
- [ ] 웹훅 수신 확인 (로그)
- [ ] Discord 채널에 메시지 도착

### 2.3 채널 설정 테이블 (1시간)
- [ ] discord_channels_config 테이블 생성 (DB 스키마 이미 설계됨)
  ```sql
  CREATE TABLE discord_channels_config (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    channel_id BIGINT UNIQUE NOT NULL,
    channel_name TEXT,
    processor_type TEXT,
    enable_sync BOOLEAN DEFAULT TRUE,
    telegram_group_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] `db/queries.py`에 함수 추가
  - `get_channel_config(channel_id)`: 채널 설정 조회
  - `update_channel_config(channel_id, **kwargs)`: 설정 업데이트
  - 캐싱 (30초 TTL)

- [ ] 초기 데이터 로드 (guild 멤버십 후 수동 설정)

**검증:**
```sql
-- Verify table
SELECT * FROM discord_channels_config LIMIT 1;
```

### 2.4 Task Delegation (2시간)
- [ ] `tasks/task_manager.py` 구현
  - `create_task(creator_id, assigned_to, description, priority, deadline)` 함수
    1. 사용자 존재 확인
    2. 마감일 검증 (미래 날짜)
    3. 설명 검증 (5-500 글자)
    4. discord_task_queue INSERT
    5. task_id 반환
  
  - `update_task_status(task_id, status)` 함수
  
  - `complete_task(task_id)` 함수
    1. 상태 → 'completed'
    2. completed_at 기록
    3. 알림 전송

- [ ] `utils/validators.py` 구현
  - `validate_user_exists(user_id)`: Discord 사용자 확인
  - `validate_deadline(deadline_str)`: YYYY-MM-DD 파싱 & 미래 확인
  - `validate_description(text)`: 길이 5-500 확인

**검증:**
```python
task_id = await create_task(
    creator_id=123,
    assigned_to=456,
    description="PR 리뷰하기",
    priority="P0",
    deadline="2026-06-10"
)
assert task_id is not None
```

### 2.5 Task Notifications (1.5시간)
- [ ] `tasks/task_notifications.py` 구현
  - `notify_task_assigned(bot, assignee_id, task_details)`: 
    1. DM 전송 (assignee_id)
    2. #tasks 채널 공지
  
  - `notify_task_completed(bot, creator_id, assignee_id, task_details)`:
    1. Creator에게 DM (완료 알림)
    2. Assignee에게 축하 DM

- [ ] `notifications/notifier.py` 구현
  - `send_dm(bot, user_id, embed)`: DM 전송
  - `send_channel_message(bot, channel_id, embed)`: 채널 메시지
  - 에러 처리 (사용자 not found 시 로그만)

- [ ] discord_notifications 테이블 기록
  - notify_type='task_assigned' | 'task_completed'
  - platform='discord'

**검증:**
- [ ] /task 명령어 실행 (아직 구현 안 함)
- [ ] 할당 사용자가 DM 수신 확인

### 2.6 Slash Commands (1.5시간)
- [ ] `commands/slash_commands.py` 구현
  ```python
  @bot.tree.command(name="schedule", description="Show team schedule")
  async def schedule_cmd(interaction: discord.Interaction):
      processor = SecretaryProcessor()
      embed = await processor.call(...)
      await interaction.response.send_message(embed=embed)
  ```

- [ ] 모든 slash commands 등록
  - `/schedule` → secretary 호출
  - `/translate <text>` → translator 호출
  - `/assets` → analyst 호출
  - `/kpi` → analyst 호출
  - `/error` → developer 호출
  - `/review` → developer 호출
  - `/debug` → developer 호출
  - `/roadmap` → planner 호출
  - `/priority` → planner 호출
  - `/task @user "desc" --priority --deadline` → task_manager 호출

- [ ] 명령어 동기화
  ```python
  await bot.tree.sync()
  ```

- [ ] 권한 검사
  - `@app_commands.checks.has_role("team-admin")` for /task

**검증:**
- [ ] Discord 채팅에 `/` 입력 → 명령어 자동완성
- [ ] 각 명령어 실행 → embed 응답

### 2.7 테스트 & 배포 (1시간)
- [ ] `tests/test_sync.py` 작성
  - Message sync (Discord → Telegram)
  - Duplicate detection
  - Webhook handling

- [ ] `tests/test_commands.py` 작성
  - Slash command 검증
  - 권한 검사

- [ ] `tests/test_integration.py` 작성
  - End-to-end: 메시지 → 저장 → 동기화 → Telegram

- [ ] `pytest` 모든 테스트 통과

**Phase 2 완료 기준:**
- ✅ Telegram 메시지 수신 (webhook)
- ✅ Discord ↔ Telegram 양방향 동기화
- ✅ 중복 메시지 방지 (SHA-256)
- ✅ Task 생성 & 할당 (discord_task_queue)
- ✅ Slash commands 9개 등록
- ✅ 모든 테스트 통과

**제출 물:**
- 동기화 코드 (~500줄)
- Task 관리 코드 (~400줄)
- Slash commands (~300줄)
- 테스트 결과 (pytest 스크린샷)

---

## 🚀 Phase 3: Deployment & Monitoring (0.5일)

### 3.1 배포 자동화 (1시간)
- [ ] `.github/workflows/deploy.yml` 작성
  ```yaml
  name: Deploy to Production
  on:
    push:
      branches: [main]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: docker/build-push-action@v4
          with:
            push: true
            tags: gcr.io/dsc-project/discord-bot:latest
  ```

- [ ] `.github/workflows/test.yml` 작성
  - Lint (flake8, black)
  - Test (pytest)

- [ ] GitHub Actions 시크릿 설정
  - DISCORD_TOKEN
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - GCR_CREDENTIALS (선택)

- [ ] Vercel/Railway 배포 설정 (선택)
  - Railway: .railway.json 또는 railway.json
  - Vercel: vercel.json (API routes only)

**검증:**
- [ ] GitHub Actions 파이프라인 실행 성공
- [ ] Docker 이미지 푸시 성공

### 3.2 모니터링 & 로깅 (1시간)
- [ ] Sentry 통합 (선택)
  ```python
  import sentry_sdk
  sentry_sdk.init(settings.SENTRY_DSN)
  ```

- [ ] Health check 엔드포인트
  ```python
  @app.get("/api/discord/health")
  async def health_check():
      return {
          "status": "ok",
          "connected": bot.user is not None,
          "uptime": time.time() - start_time
      }
  ```

- [ ] 성능 메트릭
  - 프로세서 응답 시간
  - 동기화 성공률
  - 에러율

- [ ] 알림 규칙
  - Bot offline (즉시)
  - 프로세서 에러율 > 10% (15분)
  - 동기화 실패율 > 5% (30분)

**검증:**
- [ ] Sentry 대시보드에 에러 기록됨
- [ ] `/api/discord/health` 호출 → 200 OK

### 3.3 성능 튜닝 (1시간)
- [ ] 캐싱 전략
  - 밀러스톤 캐시 (TTL 60초)
  - 채널 설정 캐시 (TTL 30초)
  - 사용자 매핑 캐시 (TTL 300초)

- [ ] 연결 풀링
  - Supabase 연결 풀 설정
  - aiohttp ClientSession 풀 설정

- [ ] 백그라운드 작업
  ```python
  @tasks.loop(minutes=5)
  async def check_retry_queue():
      # Retry failed messages
      pass
  
  @tasks.loop(minutes=10)
  async def check_overdue_tasks():
      # Notify overdue tasks
      pass
  ```

**검증:**
- [ ] 응답 시간 < 500ms (p95)
- [ ] 동시성 100+ 요청 처리

### 3.4 문서화 (1시간)
- [ ] `README.md` 작성
  - 프로젝트 개요
  - 설치 방법
  - 실행 방법
  - 명령어 가이드
  - 문제 해결

- [ ] `ARCHITECTURE.md` 작성
  - 모듈 구조
  - 데이터 흐름
  - 아키텍처 다이어그램

- [ ] `TROUBLESHOOTING.md` 작성
  - 일반적인 에러
  - 해결 방법
  - 로그 확인 방법

- [ ] 환경변수 문서화
  ```
  DISCORD_TOKEN (필수): Discord Bot token
  SUPABASE_URL (필수): Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY (필수): Service role key
  TELEGRAM_BOT_TOKEN (필수): Telegram bot token
  API_BASE_URL (선택): Next.js API base URL, default=https://dsc-fms-portal.vercel.app
  LOG_LEVEL (선택): DEBUG|INFO|WARNING|ERROR, default=INFO
  SENTRY_DSN (선택): Sentry project DSN
  ```

**검증:**
- [ ] README 모든 섹션 완성
- [ ] 코드 예제 실행 가능
- [ ] 오타 없음

---

## ✅ 최종 검증 (Go-Live)

### Code Quality
- [ ] 모든 함수에 docstring 있음
- [ ] Type hints 완성 (Python 3.10+)
- [ ] Linting 통과 (flake8, black)
- [ ] 테스트 커버리지 > 70%

### Functionality
- [ ] 모든 Phase 1, 2, 3 체크리스트 완료
- [ ] 5개 프로세서 모두 정상 작동
- [ ] 메시지 동기화 정상 (Discord ↔ Telegram)
- [ ] Task 위임 정상 (생성 → 할당 → 완료)
- [ ] Slash commands 9개 모두 등록

### Reliability
- [ ] 24시간 스모크 테스트 통과
- [ ] 에러율 < 1%
- [ ] 응답 시간 p95 < 500ms
- [ ] 메모리 누수 없음

### Operations
- [ ] 모니터링 설정 완료 (Sentry/Datadog)
- [ ] 알림 채널 설정 (#bot-alerts)
- [ ] 온콜 가이드 작성
- [ ] 긴급 복구 절차 문서화

### Team
- [ ] 모든 팀원이 Bot 명령어 인지
- [ ] 문서 팀 공유 완료
- [ ] 데모 세션 진행
- [ ] FAQ 작성

---

## 🎯 Phase별 산출물 요약

| Phase | 소요시간 | 산출물 | 검증 기준 |
|-------|---------|--------|---------|
| 1 | 1일 (8시간) | 코어 봇 (~1000줄) | Bot 온라인, 프로세서 응답, pytest 통과 |
| 2 | 1일 (8시간) | 동기화+Task (~1200줄) | Telegram 동기화, Task 위임, Slash commands |
| 3 | 0.5일 (4시간) | 배포+모니터링+문서 | GitHub Actions, Sentry, README 완성 |
| **총합** | **2.5일 (20시간)** | **~2500줄 Python** | **모든 체크리스트 통과, Go-Live 준비** |

---

## 🤝 협력 방법

### 설계자 (Web-Builder #1)
- [ ] 주 1회 진행 상황 리뷰 (15분)
- [ ] Phase 경계에서 설계 피드백
- [ ] 엣지 케이스 추가 발견 시 즉시 알림

### 개발자 (Web-Builder #2)
- [ ] 매일 아침 진행 상황 보고
- [ ] 기술적 막힘 즉시 엘리베이터 (설계자 또는 리더십)
- [ ] Phase 완료 후 리뷰 요청

### DevOps / 인프라
- [ ] Docker 빌드 환경 준비
- [ ] GitHub Actions 환경 설정
- [ ] Vercel/Railway 배포 환경 준비
- [ ] Sentry 프로젝트 생성

---

## 📞 자주 묻는 질문 (FAQ)

### Q1: 기존 프로세서 호출은 정확히 어떻게?
**A:** aiohttp POST 요청으로 `/api/discord/processors/{name}` 엔드포인트 호출.
요청 body: messageId, channelId, userId, username, content, timestamp (JSON)
응답 body: success (boolean), embed (Discord embed object)

### Q2: Telegram 동기화가 필수?
**A:** 설계에는 필수지만, Phase 2 중반부터. Phase 1은 Discord만 구현.

### Q3: Task delegation의 "assigned_to"는 어떤 형식?
**A:** Discord user ID (BIGINT) 또는 username (TEXT).
Slash command에서는 `@user` 멘션, 내부적으로 user_id 저장.

### Q4: 프로세서 호출 실패 시 재시도?
**A:** 3회 재시도 (1s → 2s → 4s exponential backoff). 모두 실패 시 fallback embed ("데이터를 불러올 수 없습니다") + discord_retry_queue 저장.

### Q5: Python 버전은?
**A:** 3.10+ (Type hints 사용). discord.py 2.0+ 호환.

---

## 📅 마감 및 중요 날짜

| 이벤트 | 날짜 | 담당 |
|--------|------|------|
| Phase 1 완료 | 2026-06-10 17:00 KST | Web-Builder #2 |
| Phase 2 완료 | 2026-06-11 17:00 KST | Web-Builder #2 |
| Phase 3 완료 | 2026-06-11 21:00 KST | Web-Builder #2 + DevOps |
| Go-Live | 2026-06-12 09:00 KST | 전체 팀 |

---

**이 체크리스트를 모두 완료하면, DISCORD-BOT-P0는 프로덕션에 배포될 준비가 완료됩니다.**
