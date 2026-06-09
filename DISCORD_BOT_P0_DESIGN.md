# DISCORD-BOT-P0 설계서 (Python Discord Bot)

**버전:** 1.0  
**작성일:** 2026-06-09  
**마감:** 2026-06-09 18:00 KST  
**상태:** P0 CRITICAL  
**담당:** Web-Builder #2 (구현)  

---

## 📋 목차
1. [Executive Summary](#executive-summary)
2. [기능명세 (5개 프로세서 통합)](#기능명세)
3. [메시지 흐름도](#메시지-흐름도)
4. [DB 스키마 & 자료구조](#db-스키마--자료구조)
5. [아키텍처 (컴포넌트, 모듈, 의존성)](#아키텍처)
6. [API 엔드포인트 & 웹훅](#api-엔드포인트--웹훅)
7. [채널/롤/권한 구조 (Discord Guild Setup)](#채널롤권한-구조)
8. [에러 처리 & 재시도 전략](#에러-처리--재시도-전략)
9. [구현 로드맵 (Phase 1~3)](#구현-로드맵-phase-13)
10. [Web-Builder #2 인수인계 체크리스트](#web-builder-2-인수인계-체크리스트)

---

## Executive Summary

### 현황
- **5개 에이전트 프로세서** 이미 존재 (Next.js API Route 기반):
  - Secretary: 팀 일정, 작업 상태, 자료 추천
  - Translator: 한영 양방향 번역 (간단한 LUT)
  - Analyst: 자산, BM(고장관리), KPI 분석
  - Developer: 에러 진단, 코드 리뷰, 디버깅 가이드
  - Planner: 로드맵, 우선순위, 설계 아키텍처
- **Discord 채널 & 메시지는 Supabase에 저장됨** (discord_sync_log, discord_messages, discord_task_queue, discord_notifications)
- **문제:** Python Discord Bot이 없음 → 메시지 감지, 라우팅, 멀티플랫폼 동기화 불완전

### 목표
Discord에서 팀 자동화를 완성하는 **Python discord.py Bot**을 설계:
1. Discord 메시지 감지 → 5개 프로세서로 라우팅
2. Telegram과 메시지 동기화 (2-way sync)
3. CTB(메모리 자동화)와 연동 → 작업 추적 및 상태 업데이트
4. 고급 기능: slash commands, reactions, task delegation
5. 신뢰성: 실패 시 폴백, 재시도, 로깅

### 성과물 (Web-Builder #2 수행)
- Phase 1 (1일): 코어 봇, 이벤트 핸들러, 프로세서 라우팅
- Phase 2 (1일): Telegram 동기화, 작업 큐, slash commands
- Phase 3 (0.5일): 배포, 모니터링, 성능 튜닝

---

## 기능명세

### 1️⃣ Secretary Processor 통합

**역할:** 팀 일정 쿼리, 작업 상태 조회, 리소스 추천

**Discord에서의 동작:**
```
User: "/schedule"  → Bot detects slash command
                   → Calls api/discord/processors/secretary
                   → Returns milestones embed
                   → Posts to #announcements

User: "일정 확인"   → Bot detects keyword in message
                   → Queries secretary processor
                   → Sends DM with schedule
```

**메시지 패턴 (한국어 + 영어):**
- `일정`, `스케줄`, `schedule`, `when` → 팀 일정 조회
- `작업`, `진행`, `task`, `progress` → 진행 중인 작업 조회
- `자료`, `리소스`, `resource`, `help` → 도움말

**출력:**
- Discord Embed (색상: 0x3498db, 제목: "📅 주간 일정 현황")
- 필드: 마일스톤 제목, 마감일, 상태
- 푸터: 요청시간, 요청자 이름

---

### 2️⃣ Translator Processor 통합

**역할:** 한영 양방향 실시간 번역

**Discord에서의 동작:**
```
User: "/translate 안녕하세요"
                   → Bot detects slash + argument
                   → Calls api/discord/processors/translator
                   → Returns Korean-to-English embed
                   → Posts translation + original

User: "번역: Hello World"  
                   → Bot detects "번역:" prefix
                   → Sends DM with Korean translation
```

**메시지 패턴:**
- `/translate <text>` (slash command)
- `번역:` prefix
- `translate:` prefix

**출력:**
- Embed (색상: 0x2ecc71)
- 필드 1: 원본 (코드블록)
- 필드 2: 번역 (코드블록)
- 필드 3: 팁 ("이 번역이 부정확하면 피드백을 주세요")

---

### 3️⃣ Analyst Processor 통합

**역할:** 자산, BM(고장관리), KPI 데이터 분석

**Discord에서의 동작:**
```
User: "/assets"    → Bot calls analyst processor with asset query
                   → Returns asset statistics embed
                   → Posts count, status, locations

User: "고장 분석"    → Bot calls analyst processor with BM query
                   → Returns breakdown statistics
                   → Shows total, resolved, severity distribution

User: "/kpi"       → Bot returns KPI metrics (MTTR, etc.)
```

**메시지 패턴:**
- `자산`, `에셋`, `asset`, `equipment` → 자산 통계
- `고장`, `breakdown`, `장애`, `정지` → BM 분석
- `kpi`, `지표`, `성과`, `metric` → KPI 조회

**출력:**
- Asset embed: 전체 자산 수, 운영 중인 자산, 주요 위치
- BM embed: 고장 건수, 해결율, 심각도 분포 (라인정지/심각/일반/경미)
- KPI embed: MTTR(평균 복구 시간), 샘플 수, 해석

---

### 4️⃣ Developer Processor 통합

**역할:** 기술 문제 해결, 코드 리뷰, 디버깅 가이드

**Discord에서의 동작:**
```
User: "/error <error_message>"
                   → Bot calls developer processor with error query
                   → Returns troubleshooting checklist embed

User: "코드 리뷰"    → Bot sends code review checklist
                   → Fields: 기능성, 가독성, 성능, 보안, 테스트

User: "/debug"     → Bot sends debugging tips and resources
```

**메시지 패턴:**
- `에러`, `error`, `bug`, `오류` → 에러 진단
- `리뷰`, `review`, `코드` → 코드 리뷰 체크리스트
- `디버그`, `debug`, `문제`, `issue` → 디버깅 가이드

**출력:**
- Error embed: 5단계 체크리스트 (메시지 수집, 환경 확인, 재현 가능성, 로그 분석, 경우의 수 제거)
- Review embed: 기능성, 가독성, 성능, 보안, 테스트 체크리스트
- Debug embed: 디버깅 팁, 리소스 링크, 최적화 가이드

---

### 5️⃣ Planner Processor 통합

**역할:** 설계, 로드맵, 우선순위 관리

**Discord에서의 동작:**
```
User: "/roadmap"   → Bot calls planner processor
                   → Returns grouped milestones (진행중/대기/완료/막힘)
                   → Shows project status

User: "우선순위"    → Bot sends prioritization framework
                   → MoSCoW, 영향도 vs 난이도, RICE score

User: "/design"    → Bot sends architecture guidelines
```

**메시지 패턴:**
- `로드맵`, `roadmap`, `계획`, `plan` → 프로젝트 로드맵
- `우선순위`, `priority`, `중요` → 우선순위 결정 가이드
- `설계`, `design`, `아키텍처`, `architecture` → 설계 가이드

**출력:**
- Roadmap embed: 진행중/대기/완료/막힘 그룹별 마일스톤
- Priority embed: MoSCoW 방법, 영향도 매트릭스, RICE 스코어 공식
- Design embed: 설계 원칙, 아키텍처 패턴, 문서화, 반복 계획

---

### 6️⃣ Task Delegation (비서 고급 기능)

**Discord에서의 동작:**
```
User: "/task @user_name 'PR 리뷰하기' --priority P0 --deadline 2026-06-10"
     → Bot validates user, task description, deadline
     → Inserts into discord_task_queue table
     → Notifies @user_name via DM + #tasks channel
     → Returns confirmation embed
     → Status: pending → in_progress → completed
```

**명령어 구문:**
```
/task <@user> <description> [--priority P0|P1|P2] [--deadline YYYY-MM-DD]
```

**DB 저장:**
- discord_task_queue: task_id (UUID), assigned_to (username), task_description, priority, deadline, platform_origin, status, created_at

**알림 흐름:**
1. 작업 생성 → discord_notifications 테이블에 INSERT (notify_type='task_assigned')
2. DM으로 사용자에게 알림 (embed with task details)
3. #tasks 채널에 task created 메시지 포스트
4. 사용자가 `/task complete <task_id>`로 완료 표시
5. 작업자에게 축하 DM, 생성자에게 완료 알림

---

### 7️⃣ Message Sync (Telegram ↔ Discord)

**역할:** 양방향 메시지 동기화, 중복 방지, 에러 로깅

**동작 흐름:**
```
Discord Message (non-command)
     ↓
Bot detects in monitored channel
     ↓
Hash content (SHA-256)
     ↓
Check discord_sync_log for duplicate (content_hash)
     ↓
If new: forward to Telegram (via webhook)
        Insert discord_sync_log (source=discord, target=telegram, status=pending)
        
If forwarded OK: Update sync_log (status=success, synced_at=NOW)
If error: Update sync_log (status=error, error_msg), retry queue
```

**Telegram → Discord (同様):**
```
Telegram Message (from integration service)
     ↓
Webhook hits /api/discord/incoming-telegram
     ↓
Bot checks duplicate, forwards to Discord channel
     ↓
Stores in discord_sync_log
```

**Channels to Sync:**
- #team-announcements ↔ Telegram: Team News
- #issues ↔ Telegram: Issues & Blockers
- #kpi-reports ↔ Telegram: KPI Reports
- (User setting: 각 채널별 동기화 설정 가능)

---

## 메시지 흐름도

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DISCORD BOT FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

1. MESSAGE RECEIVED (Discord)
   │
   ├─→ Is it a command? (/task, /schedule, /translate, /assets, /kpi, /design, /roadmap)
   │   └─→ Parse command + args
   │       └─→ Route to Processor (secretary/translator/analyst/developer/planner)
   │           └─→ POST /api/discord/processors/{bot_name}
   │               └─→ Receive DiscordEmbed response
   │                   └─→ Post embed to Discord channel
   │                       └─→ Store in discord_messages + discord_sync_log
   │
   ├─→ Is it a keyword message? (일정, 번역, 고장, 에러, 로드맵, etc.)
   │   └─→ Detect language (Korean vs English)
   │       └─→ Determine processor (keyword matching)
   │           └─→ Route to processor (same as above)
   │
   ├─→ Is it a regular message (no command, no keyword)?
   │   └─→ Check sync eligibility (channel in sync list?)
   │       └─→ If YES: Forward to Telegram via webhook
   │           └─→ Insert discord_sync_log (status=pending)
   │               └─→ Update to success/fallback/error
   │       └─→ If NO: Just store in discord_messages
   │
   └─→ ERROR HANDLING
       └─→ Log to discord_notifications (notify_type='sync_error')
           └─→ Retry queue in memory (max 3 retries)
               └─→ If still fail: Update sync_log (status=error, error_msg)

2. TASK DELEGATION (/task command)
   │
   └─→ /task @user "Description" --priority P0 --deadline YYYY-MM-DD
       └─→ Validate user exists, deadline is future
           └─→ INSERT discord_task_queue (status=pending)
               └─→ INSERT discord_notifications (notify_type=task_assigned)
                   └─→ Send DM to assigned user (embed with task details)
                       └─→ Post to #tasks channel (announcement)
                           └─→ Return confirmation embed to command issuer

3. TELEGRAM → DISCORD SYNC
   │
   └─→ Incoming webhook /api/discord/incoming-telegram
       └─→ Validate signature, parse message
           └─→ Check content_hash in discord_sync_log (duplicate?)
               └─→ If new: POST to Discord via bot
                   └─→ INSERT discord_sync_log (source=telegram, target=discord)
                       └─→ Update sync_log (status=success)
               └─→ If duplicate: Update sync_log (status=duplicate)

4. NOTIFICATION & TRACKING
   │
   └─→ discord_notifications table
       ├─ task_assigned: DM to user
       ├─ ctb_update: From CTB automation (state changes)
       ├─ blocker_alert: From developer team (critical issues)
       └─ sync_error: Forward error details

5. ERROR RECOVERY
   │
   └─→ If processor call fails (e.g., Supabase timeout)
       └─→ Fallback: Send generic help embed (with error message)
           └─→ Log to discord_notifications (sync_error)
               └─→ Retry queue: exponential backoff (1s, 2s, 4s)

┌─────────────────────────────────────────────────────────────────────┐
│                    TELEGRAM ↔ DISCORD BRIDGE                        │
└─────────────────────────────────────────────────────────────────────┘

Discord                     Sync Service              Telegram
  │                              │                       │
  ├─→ Message ──────────────────→ Hash ────────────────→ Post
  │                              │                       │
  │                        Check duplicate              │
  │                              │                       │
  └─← Notification ──────────── Log ←────────── Ack ───┘

```

---

## DB 스키마 & 자료구조

### 기존 테이블 (이미 생성됨, 38_discord_bot_phase1.sql)

#### discord_sync_log
```sql
CREATE TABLE discord_sync_log (
  id              SERIAL PRIMARY KEY,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('telegram', 'discord', 'ctb')),
  source_msg_id   BIGINT,
  target_platform TEXT NOT NULL CHECK (target_platform IN ('telegram', 'discord')),
  target_msg_id   BIGINT,
  content_hash    TEXT,                      -- SHA-256
  sync_status     TEXT DEFAULT 'pending'
                  CHECK (sync_status IN ('success', 'fallback', 'error', 'duplicate')),
  error_msg       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  synced_at       TIMESTAMPTZ
);

CREATE INDEX idx_sync_log_source ON discord_sync_log (source_msg_id);
CREATE INDEX idx_sync_log_hash ON discord_sync_log (content_hash);
CREATE INDEX idx_sync_log_created ON discord_sync_log (created_at DESC);
```

#### discord_messages
```sql
CREATE TABLE discord_messages (
  id                  SERIAL PRIMARY KEY,
  discord_msg_id      BIGINT UNIQUE NOT NULL,
  user_id             BIGINT NOT NULL,
  user_name           TEXT NOT NULL,
  channel_id          BIGINT NOT NULL,
  channel_name        TEXT,
  content             TEXT,
  is_command          BOOLEAN DEFAULT FALSE,
  synced_to_telegram  BOOLEAN DEFAULT FALSE,
  telegram_msg_id     BIGINT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discord_msg_user ON discord_messages (user_id);
CREATE INDEX idx_discord_msg_channel ON discord_messages (channel_id);
```

#### discord_task_queue
```sql
CREATE TABLE discord_task_queue (
  id               SERIAL PRIMARY KEY,
  task_id          UUID REFERENCES tasks(id) ON DELETE SET NULL,
  assigned_to      TEXT NOT NULL,
  task_description TEXT NOT NULL CHECK (LENGTH(task_description) BETWEEN 5 AND 500),
  priority         TEXT DEFAULT 'P1' CHECK (priority IN ('P0', 'P1', 'P2')),
  deadline         TIMESTAMPTZ,
  platform_origin  TEXT NOT NULL CHECK (platform_origin IN ('discord', 'telegram')),
  status           TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX idx_task_queue_assigned ON discord_task_queue (assigned_to);
CREATE INDEX idx_task_queue_status ON discord_task_queue (status);
```

#### discord_notifications
```sql
CREATE TABLE discord_notifications (
  id           SERIAL PRIMARY KEY,
  user_id      BIGINT,
  notify_type  TEXT NOT NULL
               CHECK (notify_type IN ('task_assigned', 'ctb_update', 'blocker_alert', 'sync_error')),
  content      TEXT NOT NULL,
  platform     TEXT NOT NULL CHECK (platform IN ('discord', 'telegram', 'both')),
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  read_at      TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON discord_notifications (user_id);
CREATE INDEX idx_notifications_created ON discord_notifications (created_at DESC);
```

### 신규 테이블 (P0 Phase 1 추가)

#### discord_channels_config
```sql
CREATE TABLE IF NOT EXISTS discord_channels_config (
  id              SERIAL PRIMARY KEY,
  guild_id        BIGINT NOT NULL,
  channel_id      BIGINT NOT NULL UNIQUE,
  channel_name    TEXT NOT NULL,
  processor_type  TEXT CHECK (processor_type IN ('secretary', 'translator', 'analyst', 'developer', 'planner', 'general', 'sync')),
  enable_sync     BOOLEAN DEFAULT TRUE,           -- Telegram sync enabled?
  telegram_group_id INTEGER,                       -- Telegram chat_id for sync
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_guild ON discord_channels_config (guild_id);
CREATE INDEX idx_channels_sync ON discord_channels_config (enable_sync);
```

#### discord_user_map
```sql
CREATE TABLE IF NOT EXISTS discord_user_map (
  id              SERIAL PRIMARY KEY,
  discord_user_id BIGINT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL,
  telegram_user_id INTEGER,                       -- For cross-platform notifications
  real_name       TEXT,                           -- Display name
  role            TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_map_discord ON discord_user_map (discord_user_id);
CREATE INDEX idx_user_map_telegram ON discord_user_map (telegram_user_id);
```

#### discord_retry_queue
```sql
CREATE TABLE IF NOT EXISTS discord_retry_queue (
  id              SERIAL PRIMARY KEY,
  message_id      BIGINT,
  operation_type  TEXT CHECK (operation_type IN ('sync_to_telegram', 'processor_call', 'notification')),
  payload         JSONB NOT NULL,
  retry_count     INTEGER DEFAULT 0,
  max_retries     INTEGER DEFAULT 3,
  next_retry_at   TIMESTAMPTZ DEFAULT NOW(),
  error_msg       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_retry_queue_next ON discord_retry_queue (next_retry_at);
CREATE INDEX idx_retry_queue_type ON discord_retry_queue (operation_type);
```

---

## 아키텍처

### 디렉토리 구조 (Python 프로젝트)

```
discord-bot-p0/
├── README.md                          # Setup & deployment instructions
├── requirements.txt                   # Python dependencies
├── .env.example                       # Environment variables template
├── Makefile                           # Build & run commands
├── pyproject.toml                     # Project metadata
├── main.py                            # Bot entrypoint
│
├── config/
│   ├── __init__.py
│   ├── settings.py                    # Config loading (env, secrets)
│   └── constants.py                   # Magic strings, regexes, color codes
│
├── bot/
│   ├── __init__.py
│   ├── client.py                      # DiscordClient singleton
│   └── events.py                      # Event handlers (on_message, on_ready)
│
├── processors/
│   ├── __init__.py
│   ├── base.py                        # BaseProcessor (abstract)
│   ├── router.py                      # Route message to processor
│   ├── secretary.py                   # Secretary processor caller
│   ├── translator.py                  # Translator processor caller
│   ├── analyst.py                     # Analyst processor caller
│   ├── developer.py                   # Developer processor caller
│   └── planner.py                     # Planner processor caller
│
├── commands/
│   ├── __init__.py
│   ├── slash_commands.py              # @app_commands.command decorators
│   │                                   # /task, /schedule, /translate, /assets, /kpi, /design, /roadmap
│   └── context_menus.py               # Right-click context menu commands
│
├── sync/
│   ├── __init__.py
│   ├── telegram_bridge.py             # Telegram webhook handler, sync logic
│   └── deduplication.py               # Content hashing, duplicate detection
│
├── db/
│   ├── __init__.py
│   ├── supabase_client.py             # Supabase singleton (service role)
│   ├── queries.py                     # SQL wrappers for db operations
│   └── models.py                      # Python dataclasses for DB records
│
├── notifications/
│   ├── __init__.py
│   ├── notifier.py                    # Send DMs, channel messages, embeds
│   └── formatter.py                   # Format Discord embeds
│
├── utils/
│   ├── __init__.py
│   ├── logger.py                      # Structured logging (JSON)
│   ├── sanitizer.py                   # Same as lib/discord/sanitizer.ts
│   ├── retry.py                       # Retry logic (exponential backoff)
│   ├── validators.py                  # Validate inputs (user exists, deadline valid, etc.)
│   └── text_processing.py             # Korean/English detection, keyword matching
│
├── tasks/
│   ├── __init__.py
│   ├── task_manager.py                # Create, update, complete tasks
│   ├── task_notifications.py          # Task delegation notifications
│   └── task_worker.py                 # Background worker for overdue tasks
│
├── api/
│   ├── __init__.py
│   └── routes.py                      # Flask/FastAPI routes for incoming webhooks
│
├── tests/
│   ├── __init__.py
│   ├── test_processors.py             # Mock processor calls
│   ├── test_sync.py                   # Message sync logic
│   ├── test_commands.py               # Slash command validation
│   └── test_integration.py            # End-to-end flow tests
│
└── .github/
    └── workflows/
        ├── lint.yml                   # Pre-commit lint checks
        ├── test.yml                   # Run pytest on PR
        └── deploy.yml                 # Deploy to production (Docker)
```

### 핵심 모듈

#### main.py (Bot Entry Point)
```python
import discord
from discord.ext import commands, tasks
from config.settings import Settings
from bot.client import DiscordClient
from api.routes import setup_webhooks

# Load config
settings = Settings()

# Create bot instance
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix='/', intents=intents)

# Setup event handlers
from bot.events import setup_events
setup_events(bot)

# Setup slash commands
from commands.slash_commands import setup_commands
setup_commands(bot)

# Setup background tasks
@tasks.loop(minutes=5)
async def check_retry_queue():
    """Periodically check and retry failed messages"""
    from tasks.task_worker import retry_failed_messages
    await retry_failed_messages(bot)

@tasks.loop(minutes=10)
async def check_overdue_tasks():
    """Check for overdue tasks and notify assignees"""
    from tasks.task_worker import notify_overdue_tasks
    await notify_overdue_tasks(bot)

check_retry_queue.start()
check_overdue_tasks.start()

# Setup webhook routes (for Telegram → Discord sync)
setup_webhooks(bot)

# Run bot
if __name__ == '__main__':
    bot.run(settings.DISCORD_TOKEN)
```

#### bot/events.py (Message & Command Handling)
```python
import discord
from discord.ext import commands
from processors.router import route_message
from db.supabase_client import get_supabase
from utils.logger import get_logger

logger = get_logger(__name__)

async def setup_events(bot: commands.Bot):
    @bot.event
    async def on_ready():
        logger.info(f"Bot logged in as {bot.user.name} ({bot.user.id})")
        await bot.change_presence(activity=discord.Game(name="Team Automation | /help"))

    @bot.event
    async def on_message(message: discord.Message):
        # Ignore bot's own messages
        if message.author == bot.user:
            await bot.process_commands(message)
            return

        # Ignore DMs (unless from task notification)
        if message.guild is None:
            await bot.process_commands(message)
            return

        try:
            # Store message in DB
            await store_message_in_db(message)

            # Skip processing if it's already a command (handled by slash commands)
            if message.content.startswith('/'):
                await bot.process_commands(message)
                return

            # Check if message matches processor keywords or sync patterns
            await route_message(bot, message)

            # Process slash commands if any
            await bot.process_commands(message)

        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            await message.reply(f"An error occurred: {e}", mention_author=False)

async def store_message_in_db(message: discord.Message):
    """Store message metadata in discord_messages table"""
    supabase = get_supabase()
    try:
        supabase.table('discord_messages').insert({
            'discord_msg_id': message.id,
            'user_id': message.author.id,
            'user_name': message.author.display_name,
            'channel_id': message.channel.id,
            'channel_name': message.channel.name,
            'content': message.content,
            'is_command': message.content.startswith('/'),
            'created_at': message.created_at.isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Failed to store message: {e}")
```

#### processors/router.py (Smart Routing)
```python
import re
from typing import Optional, Dict
from utils.text_processing import detect_language, is_korean
from db.queries import get_processor_for_content

async def route_message(bot, message):
    """
    Detect message intent and route to appropriate processor.
    Returns early if no match found (regular message → sync to Telegram).
    """
    content = message.content.strip()
    
    # Pattern matching for processors
    patterns = {
        'secretary': [r'일정|스케줄|schedule|when', r'작업|진행|task|progress'],
        'translator': [r'번역|translate', r'^번역:|^translate:'],
        'analyst': [r'자산|에셋|asset|equipment', r'고장|breakdown|장애', r'kpi|지표|성과'],
        'developer': [r'에러|error|bug', r'리뷰|review|코드', r'디버그|debug|문제'],
        'planner': [r'로드맵|roadmap|계획', r'우선순위|priority|중요', r'설계|design|아키텍처']
    }
    
    for processor_name, pattern_list in patterns.items():
        for pattern in pattern_list:
            if re.search(pattern, content, re.IGNORECASE):
                await call_processor(bot, message, processor_name)
                return
    
    # If no processor matched, check if should sync to Telegram
    await handle_message_sync(message)

async def call_processor(bot, message, processor_name: str):
    """Call Next.js processor endpoint via HTTP"""
    from processors.secretary import SecretaryProcessor
    from processors.translator import TranslatorProcessor
    from processors.analyst import AnalystProcessor
    from processors.developer import DeveloperProcessor
    from processors.planner import PlannerProcessor
    
    processor_map = {
        'secretary': SecretaryProcessor(),
        'translator': TranslatorProcessor(),
        'analyst': AnalystProcessor(),
        'developer': DeveloperProcessor(),
        'planner': PlannerProcessor(),
    }
    
    processor = processor_map[processor_name]
    
    try:
        embed = await processor.call(
            message_id=str(message.id),
            channel_id=str(message.channel.id),
            user_id=str(message.author.id),
            username=message.author.display_name,
            content=message.content,
            timestamp=message.created_at.isoformat()
        )
        
        if embed:
            await message.reply(embed=embed, mention_author=False)
            # Log successful processor call
            await log_processor_call(message, processor_name, success=True)
    except Exception as e:
        logger.error(f"Processor {processor_name} failed: {e}")
        await message.reply(f"Failed to process with {processor_name}: {e}", mention_author=False)
        await log_processor_call(message, processor_name, success=False, error=str(e))
```

#### processors/base.py (BaseProcessor Abstract)
```python
from abc import ABC, abstractmethod
import aiohttp
from typing import Dict, Optional
from discord import Embed
from config.settings import Settings
from utils.logger import get_logger

logger = get_logger(__name__)

class BaseProcessor(ABC):
    """Abstract base for all processors"""
    
    def __init__(self, processor_name: str):
        self.processor_name = processor_name
        self.settings = Settings()
        self.base_url = self.settings.API_BASE_URL  # e.g., https://dsc-fms-portal.vercel.app
    
    async def call(self, **kwargs) -> Optional[Embed]:
        """Call Next.js processor endpoint"""
        url = f"{self.base_url}/api/discord/processors/{self.processor_name}"
        payload = {
            'messageId': kwargs.get('message_id'),
            'channelId': kwargs.get('channel_id'),
            'userId': kwargs.get('user_id'),
            'username': kwargs.get('username'),
            'content': kwargs.get('content'),
            'timestamp': kwargs.get('timestamp'),
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=10) as resp:
                    if resp.status != 200:
                        logger.error(f"Processor returned {resp.status}")
                        return None
                    
                    data = await resp.json()
                    if not data.get('success'):
                        logger.error(f"Processor error: {data.get('error')}")
                        return None
                    
                    # Convert API response to Discord Embed
                    embed_data = data.get('embed', {})
                    return self._build_embed(embed_data)
        
        except asyncio.TimeoutError:
            logger.error(f"Processor {self.processor_name} timeout")
            return None
        except Exception as e:
            logger.error(f"Processor call failed: {e}")
            return None
    
    def _build_embed(self, data: Dict) -> Optional[Embed]:
        """Convert API embed response to Discord Embed object"""
        try:
            embed = Embed(
                title=data.get('title'),
                description=data.get('description'),
                color=data.get('color', 0xFFFFFF)
            )
            
            for field in data.get('fields', []):
                embed.add_field(
                    name=field['name'],
                    value=field['value'],
                    inline=field.get('inline', False)
                )
            
            if footer := data.get('footer'):
                embed.set_footer(text=footer.get('text'))
            
            if timestamp := data.get('timestamp'):
                embed.timestamp = timestamp
            
            return embed
        except Exception as e:
            logger.error(f"Failed to build embed: {e}")
            return None
```

#### sync/telegram_bridge.py (Sync Logic)
```python
import hashlib
import aiohttp
from typing import Optional
from db.supabase_client import get_supabase
from db.queries import log_sync, check_duplicate, get_sync_config
from utils.logger import get_logger

logger = get_logger(__name__)

async def sync_to_telegram(message) -> bool:
    """Forward Discord message to Telegram"""
    supabase = get_supabase()
    
    # Check if channel should sync
    config = await get_sync_config(message.channel.id)
    if not config or not config.get('enable_sync'):
        logger.debug(f"Channel {message.channel.id} not configured for sync")
        return False
    
    # Compute content hash for dedup
    content_hash = hashlib.sha256(message.content.encode()).hexdigest()
    
    # Check for duplicate
    if await check_duplicate(content_hash):
        await log_sync(
            source_platform='discord',
            source_msg_id=message.id,
            target_platform='telegram',
            content_hash=content_hash,
            sync_status='duplicate'
        )
        logger.debug(f"Duplicate message detected: {content_hash}")
        return False
    
    # Forward to Telegram
    try:
        telegram_group_id = config.get('telegram_group_id')
        if not telegram_group_id:
            logger.warn(f"No Telegram group configured for channel {message.channel.id}")
            return False
        
        telegram_text = format_telegram_message(message, config)
        
        # Call Telegram Bot API (via external service or direct)
        success = await call_telegram_api(telegram_group_id, telegram_text)
        
        if success:
            await log_sync(
                source_platform='discord',
                source_msg_id=message.id,
                target_platform='telegram',
                content_hash=content_hash,
                sync_status='success'
            )
            return True
        else:
            raise Exception("Telegram API call failed")
    
    except Exception as e:
        logger.error(f"Failed to sync to Telegram: {e}")
        await log_sync(
            source_platform='discord',
            source_msg_id=message.id,
            target_platform='telegram',
            content_hash=content_hash,
            sync_status='error',
            error_msg=str(e)
        )
        return False

async def handle_telegram_webhook(payload: Dict) -> bool:
    """Handle incoming Telegram message via webhook"""
    # Implementation similar to sync_to_telegram, but in reverse
    # Verify webhook signature (HMAC-SHA256 with bot token)
    # Parse Telegram message
    # Forward to Discord
    # Log sync operation
    pass

def format_telegram_message(message, config) -> str:
    """Format Discord message for Telegram"""
    return f"[{message.author.display_name}] {message.content}"
```

#### commands/slash_commands.py (Slash Commands)
```python
from discord import app_commands
from discord.ext import commands
import discord

async def setup_commands(bot: commands.Bot):
    """Register all slash commands"""
    
    @bot.tree.command(name="schedule", description="Show team schedule")
    async def schedule_cmd(interaction: discord.Interaction):
        from processors.secretary import SecretaryProcessor
        processor = SecretaryProcessor()
        embed = await processor.call(
            message_id=str(interaction.id),
            channel_id=str(interaction.channel_id),
            user_id=str(interaction.user.id),
            username=interaction.user.display_name,
            content="일정",
            timestamp=interaction.created_at.isoformat()
        )
        await interaction.response.send_message(embed=embed)
    
    @bot.tree.command(name="translate", description="Translate Korean ↔ English")
    @app_commands.describe(text="Text to translate")
    async def translate_cmd(interaction: discord.Interaction, text: str):
        from processors.translator import TranslatorProcessor
        processor = TranslatorProcessor()
        embed = await processor.call(
            message_id=str(interaction.id),
            channel_id=str(interaction.channel_id),
            user_id=str(interaction.user.id),
            username=interaction.user.display_name,
            content=text,
            timestamp=interaction.created_at.isoformat()
        )
        await interaction.response.send_message(embed=embed)
    
    @bot.tree.command(name="assets", description="Show asset statistics")
    async def assets_cmd(interaction: discord.Interaction):
        from processors.analyst import AnalystProcessor
        processor = AnalystProcessor()
        embed = await processor.call(
            message_id=str(interaction.id),
            channel_id=str(interaction.channel_id),
            user_id=str(interaction.user.id),
            username=interaction.user.display_name,
            content="자산",
            timestamp=interaction.created_at.isoformat()
        )
        await interaction.response.send_message(embed=embed)
    
    @bot.tree.command(name="kpi", description="Show KPI metrics")
    async def kpi_cmd(interaction: discord.Interaction):
        from processors.analyst import AnalystProcessor
        processor = AnalystProcessor()
        embed = await processor.call(
            message_id=str(interaction.id),
            channel_id=str(interaction.channel_id),
            user_id=str(interaction.user.id),
            username=interaction.user.display_name,
            content="kpi",
            timestamp=interaction.created_at.isoformat()
        )
        await interaction.response.send_message(embed=embed)
    
    @bot.tree.command(name="task", description="Delegate a task to team member")
    @app_commands.describe(
        user="Team member to assign task",
        description="Task description",
        priority="Task priority (P0/P1/P2)",
        deadline="Deadline (YYYY-MM-DD)"
    )
    async def task_cmd(
        interaction: discord.Interaction,
        user: discord.User,
        description: str,
        priority: str = "P1",
        deadline: str = None
    ):
        from tasks.task_manager import create_task
        success, msg = await create_task(
            creator_id=interaction.user.id,
            assigned_to=user.id,
            task_description=description,
            priority=priority,
            deadline=deadline,
            platform_origin='discord'
        )
        
        if success:
            embed = discord.Embed(
                title="✅ Task Created",
                description=f"Assigned to {user.mention}",
                color=0x2ecc71
            )
            embed.add_field(name="Description", value=description, inline=False)
            embed.add_field(name="Priority", value=priority, inline=True)
            if deadline:
                embed.add_field(name="Deadline", value=deadline, inline=True)
        else:
            embed = discord.Embed(title="❌ Task Creation Failed", description=msg, color=0xe74c3c)
        
        await interaction.response.send_message(embed=embed)
    
    # Register commands with bot
    await bot.tree.sync()
```

#### db/supabase_client.py (Singleton)
```python
from supabase import create_client
from config.settings import Settings
from utils.logger import get_logger

logger = get_logger(__name__)

_supabase_client = None

def get_supabase():
    """Get or create Supabase client (singleton)"""
    global _supabase_client
    
    if _supabase_client is None:
        settings = Settings()
        _supabase_client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
        )
        logger.info("Supabase client initialized")
    
    return _supabase_client
```

---

## API 엔드포인트 & 웹훅

### Bot가 호출하는 엔드포인트 (기존)

#### POST /api/discord/processors/{processor_name}
- **경로:** `/api/discord/processors/secretary|translator|analyst|developer|planner`
- **요청:**
  ```json
  {
    "messageId": "1234567890",
    "channelId": "9876543210",
    "userId": "1111111111",
    "username": "JohnDoe",
    "content": "일정 확인",
    "timestamp": "2026-06-09T10:00:00Z"
  }
  ```
- **응답 (성공):**
  ```json
  {
    "success": true,
    "embed": {
      "title": "📅 주간 일정 현황",
      "description": "...",
      "color": 3498875,
      "fields": [
        { "name": "...", "value": "...", "inline": false }
      ],
      "footer": { "text": "..." },
      "timestamp": "2026-06-09T10:00:00Z"
    }
  }
  ```
- **응답 (실패):**
  ```json
  {
    "success": false,
    "error": "일정 조회 실패: ..."
  }
  ```

### Bot이 노출하는 웹훅 (신규)

#### POST /api/discord/incoming-telegram
- **목적:** Telegram → Discord 메시지 동기화
- **요청:**
  ```json
  {
    "message_id": 123456,
    "chat_id": -1001234567890,
    "text": "...",
    "from": {
      "id": 987654321,
      "first_name": "John",
      "username": "johndoe"
    },
    "date": 1717939200,
    "signature": "HMAC-SHA256(...)"
  }
  ```
- **검증:** HMAC-SHA256(payload, bot_token) == signature
- **처리:**
  1. 서명 검증
  2. content_hash 계산 (중복 확인)
  3. Discord 채널 조회 (telegram_group_id → channel_id)
  4. 메시지 전송 (포맷: `[Telegram @username] message text`)
  5. discord_sync_log 기록
- **응답:**
  ```json
  {
    "ok": true,
    "discord_msg_id": 1122334455,
    "synced_at": "2026-06-09T10:00:00Z"
  }
  ```

#### POST /api/discord/health
- **목적:** 봇 헬스체크 (Vercel cron 모니터링)
- **응답:**
  ```json
  {
    "status": "ok",
    "uptime_hours": 24,
    "connected": true,
    "last_heartbeat": "2026-06-09T10:00:00Z"
  }
  ```

---

## 채널/롤/권한 구조

### Discord Guild Setup (초기 구성)

#### Channels
| 채널명 | 용도 | 동기화 | 비고 |
|--------|------|--------|------|
| #announcements | 주요 공지 | ↔ Telegram | secretary, analyst 출력 |
| #team-tasks | 작업 관리 | ↔ Telegram | task 생성/완료 알림 |
| #kpi-reports | KPI 리포트 | ↔ Telegram | analyst 출력 |
| #issues | 기술 이슈 | ↔ Telegram | developer 출력 |
| #design | 설계 논의 | ↔ Telegram | planner 출력 |
| #translations | 번역 요청/응답 | (sync 안 함) | translator 출력 |
| #bot-log | 봇 내부 로그 | (없음) | 관리자만 보기 |

#### Roles
| 롤명 | 권한 | 설명 |
|------|------|------|
| @team-admin | 모든 관리 권한 | 채널 설정, 역할 관리 |
| @team-lead | 작업 위임, 일정 편집 | 팀 리드급 |
| @team-member | 작업 읽기, 반응 추가 | 일반 팀원 |
| @bot | (특수 역할) | 봇 메시지 전송 권한 |

#### 권한 Matrix
| 작업 | @team-admin | @team-lead | @team-member | @bot |
|------|-------------|------------|--------------|------|
| /task (위임) | ✓ | ✓ | ✗ | - |
| /schedule | ✓ | ✓ | ✓ | - |
| /translate | ✓ | ✓ | ✓ | - |
| /assets, /kpi | ✓ | ✓ | ✓ | - |
| 메시지 전송 | - | - | - | ✓ |
| 채널 관리 | ✓ | ✗ | ✗ | - |

### Discord Server Configuration (discord_channels_config)

```sql
INSERT INTO discord_channels_config (guild_id, channel_id, channel_name, processor_type, enable_sync, telegram_group_id)
VALUES
  (12345, 67890, 'announcements', 'general', true, -1001234567890),
  (12345, 67891, 'team-tasks', 'secretary', true, -1001234567891),
  (12345, 67892, 'kpi-reports', 'analyst', true, -1001234567892),
  (12345, 67893, 'issues', 'developer', true, -1001234567893),
  (12345, 67894, 'design', 'planner', true, -1001234567894),
  (12345, 67895, 'translations', 'translator', false, null);
```

---

## 에러 처리 & 재시도 전략

### 에러 분류

#### Tier 1: Recoverable (자동 재시도)
- **Timeout:** 프로세서 호출 시간초과 (10초 이상)
  - 재시도: 1s → 2s → 4s (최대 3회)
  - 실패 후: discord_retry_queue INSERT, 나중에 cron으로 처리
- **Network Error:** 연결 오류
  - 재시도: 즉시 1회, 실패 시 큐에 저장
- **Rate Limit:** Discord API 속도 제한
  - 재시도: Discord 라이브러리가 자동 처리 (backoff)

#### Tier 2: Fallback (대체 응답)
- **Processor Error:** Supabase 쿼리 실패
  - 응답: "데이터를 불러올 수 없습니다. 관리자에게 문의하세요."
  - 로그: discord_notifications (notify_type='sync_error')
- **Invalid Input:** 사용자 입력 검증 실패
  - 응답: "입력이 올바르지 않습니다. 예: /task @user 'description' --priority P0"
  - 로그: discord_notifications (notify_type='sync_error')

#### Tier 3: Critical (즉시 에스컬레이션)
- **Bot Offline:** 봇 연결 끊김
  - 로그: discord_notifications, Sentry alert
  - 관리자 DM: "Bot offline. Check logs."
- **DB Connection Loss:** Supabase 전체 다운
  - 로그: discord_notifications, Sentry alert
  - 모든 명령 응답: "시스템 유지보수 중입니다."

### Retry Logic (utils/retry.py)

```python
from functools import wraps
import asyncio
from utils.logger import get_logger

logger = get_logger(__name__)

def async_retry(max_retries=3, backoff_factor=1):
    """Decorator for async functions with exponential backoff"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(1, max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except (asyncio.TimeoutError, ConnectionError) as e:
                    if attempt == max_retries:
                        raise
                    
                    wait_time = backoff_factor * (2 ** (attempt - 1))
                    logger.warning(f"{func.__name__} attempt {attempt} failed. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
        
        return wrapper
    return decorator

# Usage:
# @async_retry(max_retries=3, backoff_factor=1)
# async def call_processor(...):
#     ...
```

### Error Logging & Monitoring

```python
# utils/logger.py
import logging
import json
from datetime import datetime

def get_logger(name):
    logger = logging.getLogger(name)
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)
    return logger

# Log format: JSON for parsing by Supabase
# {
#   "timestamp": "2026-06-09T10:00:00Z",
#   "level": "ERROR",
#   "module": "processors.secretary",
#   "message": "Supabase query failed",
#   "error": "...",
#   "context": {
#     "user_id": "...",
#     "processor": "secretary",
#     "operation": "query_milestones"
#   }
# }
```

---

## 구현 로드맵 (Phase 1~3)

### Phase 1: Core Bot & Event Handling (1일 | 8시간)

**목표:** 기본 Discord Bot 구조, 메시지 감지, 프로세서 라우팅

**작업:**
1. 프로젝트 구조 초기화 (30분)
   - `discord-bot-p0/` 디렉토리 생성
   - `requirements.txt`, `pyproject.toml`, `Makefile` 작성
   - `.env.example` 생성

2. 설정 & 로깅 구현 (1시간)
   - `config/settings.py`: 환경변수 로딩 (DISCORD_TOKEN, API_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
   - `config/constants.py`: 색상 코드, regex 패턴, magic strings
   - `utils/logger.py`: 구조화된 로깅 (JSON 포맷)

3. Bot 클라이언트 초기화 (1시간)
   - `bot/client.py`: DiscordClient 싱글톤
   - `main.py`: Bot 엔트리포인트, intents 설정
   - `bot/events.py`: on_ready, on_message 이벤트 핸들러

4. 프로세서 라우팅 (2시간)
   - `processors/base.py`: BaseProcessor 추상 클래스
   - `processors/router.py`: 메시지 → 프로세서 매핑 로직 (regex 패턴)
   - `processors/{secretary,translator,analyst,developer,planner}.py`: 각 프로세서 구현
     - API 호출 (next.js processor endpoint)
     - Embed 변환 (JSON → discord.Embed)
     - 에러 처리 (타임아웃, 네트워크 오류)

5. Supabase 통합 (1시간)
   - `db/supabase_client.py`: 클라이언트 싱글톤
   - `db/queries.py`: 기본 CRUD 함수 (select, insert, update)
   - `db/models.py`: Python dataclasses (Message, Task, Notification, SyncLog)

6. 메시지 저장 (1.5시간)
   - on_message에서 discord_messages 테이블 INSERT
   - 타임스탬프, 사용자, 채널 정보 저장
   - 기본 중복 제거 (discord_msg_id UNIQUE)

7. 테스트 & 배포 (1시간)
   - `tests/test_processors.py`: Mock processor 테스트
   - 로컬 실행 검증
   - Docker 이미지 빌드

**산출물:**
- `discord-bot-p0/` 코드 (1000줄)
- `requirements.txt` (30개 의존성)
- `Dockerfile` & `docker-compose.yml`
- Phase 1 테스트 결과 (screenshot, logs)

**완료 기준:**
- Bot이 Discord에 접속 ✓
- 메시지 감지 & 저장 ✓
- 프로세서 호출 성공 ✓
- 5개 프로세서 모두 응답 ✓

---

### Phase 2: Telegram Sync & Task Management (1일 | 8시간)

**목표:** Telegram ↔ Discord 양방향 동기화, Task delegation 구현

**작업:**
1. 메시지 동기화 핵심 로직 (2시간)
   - `sync/deduplication.py`: SHA-256 해싱, 중복 확인
   - `sync/telegram_bridge.py`: 
     - sync_to_telegram(): Discord → Telegram
     - handle_telegram_webhook(): Telegram → Discord
   - discord_sync_log 기록 (성공/중복/에러)

2. Telegram 웹훅 엔드포인트 (1.5시간)
   - `api/routes.py`: FastAPI/Flask 라우트 설정
   - POST /api/discord/incoming-telegram
   - HMAC-SHA256 서명 검증
   - 메시지 포맷팅 (Telegram 텍스트 → Discord Embed)

3. 채널 설정 테이블 (1시간)
   - discord_channels_config 테이블 (이미 설계됨)
   - 채널별 동기화 설정 로드/캐싱
   - Telegram group_id ↔ Discord channel_id 매핑

4. Task Delegation 구현 (2시간)
   - `tasks/task_manager.py`:
     - create_task(): 작업 생성, discord_task_queue INSERT
     - update_task_status(): 상태 업데이트
     - complete_task(): 작업 완료
   - 입력 검증 (사용자 존재, 마감일 미래, 설명 길이)
   - DB 저장 (task_id UUID, priority, deadline)

5. Task Notifications (1.5시간)
   - `tasks/task_notifications.py`:
     - notify_task_assigned(): DM + #tasks 채널 공지
     - notify_task_completed(): 완료 축하 DM
   - `notifications/notifier.py`:
     - send_dm(): 사용자 DM 전송
     - send_channel_message(): 채널 메시지 전송
     - send_embed(): 포맷된 Embed 전송
   - discord_notifications 테이블 기록

6. Slash Commands (1.5시간)
   - `commands/slash_commands.py`:
     - /schedule, /translate, /assets, /kpi, /error, /review, /debug, /roadmap, /priority
     - /task @user "description" --priority --deadline
   - 명령어 검증 (매개변수 타입, 필수 값)
   - 권한 체크 (admin only for /task)

7. 테스트 & 배포 (1시간)
   - `tests/test_sync.py`: 메시지 동기화 테스트
   - `tests/test_commands.py`: Slash command 검증
   - Integration test (Discord → Telegram 전체 흐름)

**산출물:**
- 동기화 구현 (500줄)
- Task 관리 시스템 (400줄)
- Slash commands 등록 (300줄)
- Phase 2 테스트 결과

**완료 기준:**
- Telegram 웹훅 수신 ✓
- Discord ↔ Telegram 메시지 동기화 ✓
- 중복 메시지 방지 ✓
- Task 생성 & 완료 ✓
- Slash commands 작동 ✓

---

### Phase 3: Deployment & Monitoring (0.5일 | 4시간)

**목표:** 프로덕션 배포, 모니터링, 성능 튜닝

**작업:**
1. 배포 자동화 (1시간)
   - `.github/workflows/deploy.yml`: 
     - Git push → Docker 빌드 → Vercel/Railway 배포
   - Environment secrets 설정 (DISCORD_TOKEN, SUPABASE_KEY, etc.)
   - Health check 엔드포인트 (/api/discord/health)

2. 모니터링 & 로깅 (1시간)
   - Sentry 통합 (에러 트래킹)
   - Datadog/CloudWatch 로그 집계
   - Alerting rules (bot offline, 프로세서 실패율 > 10%)
   - discord_notifications 대시보드 (자동 집계)

3. 성능 튜닝 (1시간)
   - 캐싱 전략 (밀러스톤 캐시, 사용자 매핑 캐시)
   - 연결 풀링 (Supabase, HTTP)
   - 재시도 큐 Background task (매 5분 실행)
   - Overdue task 알림 (매 10분 체크)

4. 문서화 & 핸드오프 (1시간)
   - README.md: 설정, 실행, 명령어 가이드
   - ARCHITECTURE.md: 모듈 구조 설명
   - TROUBLESHOOTING.md: 일반적인 에러 & 해결법
   - Web-Builder #2 체크리스트 작성

**산출물:**
- Docker 배포 설정 (Dockerfile, docker-compose.yml)
- CI/CD 파이프라인 (.github/workflows/)
- 모니터링 대시보드 (Sentry, Datadog)
- 완전한 문서

**완료 기준:**
- 프로덕션 환경 배포 ✓
- 24시간 무중단 운영 ✓
- 모니터링 알림 활성화 ✓
- 모든 문서 완성 ✓

---

## Web-Builder #2 인수인계 체크리스트

### 사전 검증 (Web-Builder #1 담당)
- [ ] Python 3.10+ 설치됨
- [ ] discord.py 2.0+ 호환성 확인
- [ ] Supabase Python 클라이언트 설치
- [ ] GitHub Actions 권한 확인

### Phase 1 체크리스트
#### 코드 검토
- [ ] `config/settings.py` 환경변수 로딩 정확
- [ ] `bot/events.py` on_message 핸들러 실행
- [ ] `processors/base.py` API 호출 성공 (예: secretary)
- [ ] `db/supabase_client.py` 연결 성공
- [ ] 모든 5개 프로세서 응답 확인

#### 테스트
- [ ] `pytest tests/test_processors.py` 통과
- [ ] 로컬 Bot 실행 (/run make local)
- [ ] 메시지 저장 확인 (discord_messages 조회)

#### 배포
- [ ] Docker 이미지 빌드 성공
- [ ] 로컬 컨테이너 실행 성공
- [ ] Vercel/Railway 배포 성공

---

### Phase 2 체크리스트
#### 메시지 동기화
- [ ] SHA-256 해싱 정확도 확인
- [ ] discord_sync_log INSERT/UPDATE 정상
- [ ] 중복 메시지 방지 (동일 content_hash)
- [ ] Telegram 웹훅 수신 (테스트 메시지 전송)
- [ ] Discord ↔ Telegram 양방향 동기화 확인

#### Task Management
- [ ] /task 명령어 실행 성공
- [ ] discord_task_queue 테이블 삽입 확인
- [ ] Task 할당 사용자에게 DM 전송됨
- [ ] #tasks 채널에 공지 메시지 포스트됨
- [ ] /task complete <id> 작동

#### Slash Commands
- [ ] 모든 slash command 등록 (/schedule, /translate, etc.)
- [ ] 명령어 자동완성 작동
- [ ] 권한 검사 (admin only commands)

#### 테스트
- [ ] `pytest tests/test_sync.py` 통과
- [ ] `pytest tests/test_commands.py` 통과
- [ ] Integration test (Telegram → Discord → 메시지 저장)

---

### Phase 3 체크리스트
#### 배포
- [ ] GitHub Actions 파이프라인 실행 성공
- [ ] Docker 푸시 성공
- [ ] Vercel/Railway 배포 성공
- [ ] 헬스체크 엔드포인트 응답 확인 (200 OK)

#### 모니터링
- [ ] Sentry 프로젝트 생성 및 설정
- [ ] 에러 추적 활성화
- [ ] Datadog 대시보드 구성 (선택)
- [ ] Alerting rules 설정 (Slack/Discord)

#### 문서
- [ ] README.md 완성 (설치, 실행, 명령어)
- [ ] ARCHITECTURE.md 완성 (모듈 구조)
- [ ] TROUBLESHOOTING.md 완성
- [ ] 환경변수 문서화 (필수, 선택, 기본값)

#### 운영 준비
- [ ] 운영 가이드 전달 (모니터링, 로그 확인)
- [ ] 긴급 대응 절차 문서화 (Bot offline 시 복구)
- [ ] 팀 권한 설정 확인 (@team-admin, @team-lead, @team-member)
- [ ] Telegram ↔ Discord 매핑 설정 확인

---

### 최종 검증 (Go-Live)
- [ ] 모든 Phase 1, 2, 3 체크리스트 완료
- [ ] 24시간 스모크 테스트 통과
- [ ] 프로덕션 메시지 동기화 정상
- [ ] 팀 모두 Slash commands 인지
- [ ] 문서 팀 공유 완료
- [ ] 지속적 모니터링 설정 (alert 채널 확인)

---

## 요약

### 설계 핵심
- **5개 기존 프로세서 통합:** Next.js API 엔드포인트를 호출하는 Python Bot
- **양방향 메시지 동기화:** Telegram ↔ Discord (SHA-256 중복 제거)
- **Task 위임 자동화:** /task 명령어로 팀원 작업 할당
- **강력한 에러 처리:** Retry queue, fallback embeds, Sentry alert
- **Supabase 기반 저장:** 모든 데이터 영속성

### 구현 기간
- **Phase 1:** 1일 (코어 봇, 라우팅)
- **Phase 2:** 1일 (동기화, Task 관리)
- **Phase 3:** 0.5일 (배포, 모니터링)
- **총 2.5일 (18시간)**

### 담당자
- **설계:** Web-Builder #1 (Planner) ← 현재
- **구현:** Web-Builder #2 (Developer) ← 인수인계
- **배포:** DevOps (Vercel/Railway 설정)

---

**이 설계서가 완전하며, Web-Builder #2는 이 문서를 기반으로 즉시 구현을 시작할 수 있습니다.**
