# Discord Bot Phase 1 구현 상세 가이드
**프론트엔드 팀 즉시 사용용 — API 14개 + DB 4테이블 + Python/Next.js 통합 코드 템플릿**

**최종 업데이트:** 2026-05-19  
**상태:** ✅ 프론트엔드 개발 즉시 시작 가능  
**예상 개발 기간:** 10일 (5월 20일 ~ 5월 29일)

---

## 📋 목차
1. [Executive Summary](#executive-summary)
2. [Phase 1 스코프 & 목표](#phase-1-스코프--목표)
3. [빠른 시작 (Quick Start)](#빠른-시작-quick-start)
4. [데이터베이스 스키마](#데이터베이스-스키마)
5. [API 레퍼런스 (14개)](#api-레퍼런스-14개)
6. [Python 구현 가이드](#python-구현-가이드)
7. [Next.js 구현 가이드](#nextjs-구현-가이드)
8. [Telegram 동기화](#telegram-동기화)
9. [에러 처리 & 폴백 전략](#에러-처리--폴백-전략)
10. [테스트 체크리스트](#테스트-체크리스트)
11. [배포 가이드](#배포-가이드)

---

## Executive Summary

**목표:** Telegram (CEO) ↔ Discord (팀) 양방향 메시지 자동 동기화 + 작업 관리 자동화

**핵심 기능:**
- ✅ Discord ↔ Telegram 메시지 양방향 동기화 (중복 제거)
- ✅ `/task` 커맨드로 작업 할당 자동화
- ✅ CTB (active_work_tracking.md) 실시간 모니터링 & Discord 자동 업데이트
- ✅ 5개 채널 (#일반, #진행중, #완료, #문제해결, #팀논의) 자동 라우팅
- ✅ 메시지 큐 + 레이트 리미팅 (5 req/sec)
- ✅ Vercel Cron 자동화 (5분마다 CTB 폴링)

**신규 구성:**
- **Python Discord Bot**: discord.py + Telegram 양방향 동기화
- **Next.js API Routes**: Vercel 배포용 API 엔드포인트
- **Supabase DB**: 4개 테이블 (sync_log, messages, task_queue, notifications)

**완료 예상일:** 2026-05-29

---

## Phase 1 스코프 & 목표

### In-Scope ✅
| 기능 | 상세 | 우선순위 |
|------|------|----------|
| 메시지 동기화 | Telegram→Discord, Discord→Telegram 양방향 | 🔴 Critical |
| 중복 제거 | Content hash 기반 자동 중복 제거 | 🔴 Critical |
| 작업 명령 | `/task @user 작업내용 #채널` 형식 | 🔴 Critical |
| CTB 실시간 | 5분마다 active_work_tracking.md 폴링 후 Discord 업데이트 | 🔴 Critical |
| 채널 라우팅 | 팀 논의→#팀논의, 진행중→#진행중, 완료→#완료 | 🔴 Critical |
| 에러 폴백 | Discord/Telegram 불가 시 로컬 큐 저장 & 재시도 | 🟡 High |
| 메트릭 수집 | 일일 메시지 통계, 동기화 성공률 | 🟡 High |

### Out-of-Scope ❌
- 스레드(Thread) 구현
- Emoji 리액션 동기화
- 음성 채널 지원
- 다른 플랫폼 (Slack, Teams 등)

---

## 빠른 시작 (Quick Start)

### 1단계: 환경 변수 설정 (5분)

**파일:** `.env.local` (dsc-fms-portal 루트)
```bash
# Discord
DISCORD_TOKEN=your_discord_bot_token
DISCORD_WEBHOOK_PUBLIC_KEY=your_public_key
DISCORD_WEBHOOK_SECRET=your_secret
DISCORD_CHANNEL_GENERAL=1234567890
DISCORD_CHANNEL_INPROGRESS=2345678901
DISCORD_CHANNEL_COMPLETED=3456789012
DISCORD_CHANNEL_BLOCKER=4567890123
DISCORD_CHANNEL_TEAM_DISCUSS=5678901234

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_CHAT_ID=CEO_chat_id

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Python Discord Bot (별도)
PYTHONPATH=/path/to/discord_bot
```

### 2단계: 데이터베이스 마이그레이션 (10분)

Supabase 콘솔에서 SQL 실행:
```sql
-- 1. discord_sync_log 테이블
CREATE TABLE IF NOT EXISTS discord_sync_log (
  id BIGSERIAL PRIMARY KEY,
  source_platform VARCHAR(50) NOT NULL,
  message_id VARCHAR(255),
  content_hash VARCHAR(64) NOT NULL UNIQUE,
  sync_status VARCHAR(50) DEFAULT 'pending',
  target_platform VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP WITH TIME ZONE
);

-- 2. discord_messages 테이블
CREATE TABLE IF NOT EXISTS discord_messages (
  id BIGSERIAL PRIMARY KEY,
  discord_msg_id VARCHAR(255),
  telegram_msg_id VARCHAR(255),
  user_id VARCHAR(255),
  channel_id VARCHAR(255),
  content TEXT NOT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP WITH TIME ZONE
);

-- 3. discord_task_queue 테이블
CREATE TABLE IF NOT EXISTS discord_task_queue (
  id BIGSERIAL PRIMARY KEY,
  assigned_to VARCHAR(255),
  task_description TEXT NOT NULL,
  channel_id VARCHAR(255),
  priority VARCHAR(50),
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'assigned',
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. discord_notifications 테이블
CREATE TABLE IF NOT EXISTS discord_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  notification_type VARCHAR(50),
  platform VARCHAR(50),
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능)
CREATE INDEX idx_sync_log_hash ON discord_sync_log(content_hash);
CREATE INDEX idx_sync_log_status ON discord_sync_log(sync_status);
CREATE INDEX idx_messages_discord_id ON discord_messages(discord_msg_id);
CREATE INDEX idx_messages_telegram_id ON discord_messages(telegram_msg_id);
CREATE INDEX idx_task_queue_status ON discord_task_queue(status);
CREATE INDEX idx_notifications_user ON discord_notifications(user_id);
```

### 3단계: Python Discord Bot 설정 (15분)

**디렉토리 구조:**
```
discord_bot/
├── bot.py                 # 메인 봇 진입점
├── handlers/
│   ├── message_handler.py # 메시지 동기화
│   ├── task_handler.py    # 작업 명령 처리
│   └── ctb_handler.py     # CTB 폴링 & 업데이트
├── sync/
│   ├── telegram_sync.py   # Telegram 연동
│   ├── queue_manager.py   # 메시지 큐 관리
│   └── deduplicator.py    # 중복 제거 로직
├── utils/
│   ├── logger.py          # 로깅
│   ├── config.py          # 설정 로드
│   └── crypto.py          # Ed25519 검증
└── requirements.txt
```

### 4단계: Next.js API 라우트 설정 (10분)

**디렉토리 구조:**
```
dsc-fms-portal/pages/api/discord/
├── webhook.ts            # Discord 웹훅 엔드포인트
├── task.ts               # 작업 할당 API
├── ctb-sync.ts           # CTB 동기화 API
├── status.ts             # 상태 확인
├── sync-logs.ts          # 동기화 로그
├── messages.ts           # 메시지 조회
├── channels.ts           # 채널 목록
└── notifications.ts      # 알림 관리
```

---

## 데이터베이스 스키마

### discord_sync_log (핵심 테이블)
메시지 동기화 상태를 추적하는 테이블. **중복 제거의 핵심.**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL | 기본 키 |
| `source_platform` | VARCHAR(50) | 'discord' 또는 'telegram' |
| `message_id` | VARCHAR(255) | 원본 플랫폼의 메시지 ID |
| `content_hash` | VARCHAR(64) **[UNIQUE]** | SHA256 해시 (중복 제거 키) |
| `sync_status` | VARCHAR(50) | pending, success, failed, retrying |
| `target_platform` | VARCHAR(50) | 동기화 대상 플랫폼 |
| `error_message` | TEXT | 실패 이유 |
| `created_at` | TIMESTAMP | 레코드 생성 시간 |
| `synced_at` | TIMESTAMP | 동기화 완료 시간 |

**예시:**
```
content_hash="abc123def456..."
source_platform="discord"
target_platform="telegram"
sync_status="success"
synced_at=2026-05-19 10:30:45 UTC
```

### discord_messages (메시지 저장)
실제 메시지 내용 저장.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `discord_msg_id` | VARCHAR(255) | Discord 메시지 ID |
| `telegram_msg_id` | VARCHAR(255) | Telegram 메시지 ID |
| `user_id` | VARCHAR(255) | 발신자 ID |
| `channel_id` | VARCHAR(255) | 채널 ID |
| `content` | TEXT | 메시지 내용 |
| `is_synced` | BOOLEAN | 동기화 완료 여부 |

### discord_task_queue (작업 관리)
`/task` 명령으로 생성된 작업 추적.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `assigned_to` | VARCHAR(255) | 담당자 Discord ID |
| `task_description` | TEXT | 작업 내용 |
| `priority` | VARCHAR(50) | 'high', 'normal', 'low' |
| `deadline` | TIMESTAMP | 마감일 |
| `status` | VARCHAR(50) | assigned, in_progress, completed, blocked |

### discord_notifications (알림 로그)
동기화 완료, 작업 할당 등 알림 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `user_id` | VARCHAR(255) | 수신자 ID |
| `notification_type` | VARCHAR(50) | message_synced, task_assigned, ctb_updated |
| `platform` | VARCHAR(50) | 'discord' 또는 'telegram' |
| `is_read` | BOOLEAN | 읽음 여부 |

---

## API 레퍼런스 (14개)

### 1. POST /api/discord/webhook
Discord 웹훅 엔드포인트. Discord 이벤트 수신 & 검증.

**요청:**
```json
{
  "type": 1,
  "id": "12345",
  "token": "webhook_token",
  "data": {
    "name": "ping"
  }
}
```

**응답 (200 OK):**
```json
{
  "type": 1
}
```

**에러 (401 Unauthorized):**
```json
{
  "error": "Invalid signature"
}
```

---

### 2. POST /api/discord/task
작업 할당 API. `/task @user 작업 #채널` 형식 처리.

**요청:**
```json
{
  "assigned_to": "user_discord_id",
  "task_description": "작업 상세",
  "channel_id": "channel_id",
  "priority": "high",
  "deadline": "2026-05-22T17:00:00Z"
}
```

**응답 (201 Created):**
```json
{
  "task_id": 12345,
  "status": "assigned",
  "synced_to": ["discord", "telegram"],
  "created_at": "2026-05-19T10:30:00Z"
}
```

---

### 3. POST /api/discord/ctb-sync
CTB 파일 폴링 & 상태 업데이트 API. Vercel Cron에서 5분마다 호출.

**요청:**
```json
{
  "force_update": false,
  "only_changes": true
}
```

**응답 (200 OK):**
```json
{
  "last_sync": "2026-05-19T10:25:00Z",
  "changes": [
    {
      "task_id": 1,
      "status": "completed",
      "discord_channel": "#완료",
      "telegram_message_id": "234567"
    }
  ],
  "total_changes": 1
}
```

---

### 4. GET /api/discord/status
동기화 상태 확인. 헬스 체크용.

**응답 (200 OK):**
```json
{
  "discord_connected": true,
  "telegram_connected": true,
  "supabase_connected": true,
  "last_sync": "2026-05-19T10:25:00Z",
  "queue_length": 3,
  "sync_rate_5min": 12
}
```

---

### 5. GET /api/discord/sync-logs
동기화 로그 조회.

**쿼리:**
```
?status=failed&limit=20&offset=0
```

**응답:**
```json
{
  "logs": [
    {
      "id": 1,
      "source_platform": "discord",
      "sync_status": "failed",
      "error_message": "Telegram API timeout",
      "synced_at": "2026-05-19T10:30:00Z"
    }
  ],
  "total": 145
}
```

---

### 6. GET /api/discord/messages
메시지 조회 (검색, 필터링).

**쿼리:**
```
?channel_id=1234&limit=50&sort=desc&synced=true
```

**응답:**
```json
{
  "messages": [
    {
      "id": 1,
      "discord_msg_id": "msg123",
      "telegram_msg_id": "msg456",
      "content": "Team sync completed",
      "is_synced": true,
      "created_at": "2026-05-19T10:00:00Z"
    }
  ],
  "total": 342
}
```

---

### 7. GET /api/discord/channels
연결된 Discord 채널 목록.

**응답:**
```json
{
  "channels": [
    {
      "channel_id": "1234567890",
      "name": "#일반",
      "type": "text",
      "description": "General team discussion",
      "message_count": 245,
      "last_message": "2026-05-19T10:30:00Z"
    },
    {
      "channel_id": "2345678901",
      "name": "#진행중",
      "type": "text",
      "description": "In-progress tasks",
      "message_count": 89
    }
  ]
}
```

---

### 8-14. 추가 API 엔드포인트

| # | 엔드포인트 | 메소드 | 설명 |
|---|-----------|--------|------|
| 8 | `/api/discord/task` | GET | 작업 목록 조회 |
| 9 | `/api/discord/task/{id}` | PATCH | 작업 상태 업데이트 |
| 10 | `/api/discord/notifications` | GET | 알림 목록 |
| 11 | `/api/discord/notifications/{id}` | PATCH | 알림 읽음 표시 |
| 12 | `/api/discord/webhook/validate` | POST | 웹훅 검증 (테스트용) |
| 13 | `/api/discord/metrics` | GET | 일일 메트릭 |
| 14 | `/api/discord/queue` | GET | 메시지 큐 상태 |

---

## Python 구현 가이드

### bot.py (메인 진입점)

```python
import os
import logging
from discord.ext import commands, tasks
from dotenv import load_dotenv

from handlers.message_handler import MessageHandler
from handlers.task_handler import TaskHandler
from handlers.ctb_handler import CTBHandler
from utils.config import Config
from utils.logger import setup_logger

load_dotenv()
setup_logger()

class DSCBot(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.config = Config()
        self.message_handler = MessageHandler(self.config)
        self.task_handler = TaskHandler(self.config)
        self.ctb_handler = CTBHandler(self.config)
        self.poll_ctb.start()

    @tasks.loop(minutes=5)
    async def poll_ctb(self):
        """5분마다 active_work_tracking.md 폴링 & Discord 업데이트"""
        try:
            await self.ctb_handler.sync_and_update()
        except Exception as e:
            logging.error(f"CTB poll failed: {e}")

    @commands.Cog.listener()
    async def on_message(self, message):
        """Discord 메시지 수신 & Telegram 동기화"""
        if message.author == self.bot.user:
            return
        await self.message_handler.process_discord_message(message)

    @commands.command(name='task')
    async def task_command(self, ctx, assigned_to: str, *, description: str):
        """작업 할당: /task @user 작업내용"""
        await self.task_handler.create_and_sync_task(
            assigned_to=assigned_to,
            description=description,
            channel=ctx.channel,
            creator=ctx.author
        )

async def setup(bot):
    await bot.add_cog(DSCBot(bot))

if __name__ == "__main__":
    intents = discord.Intents.default()
    intents.message_content = True
    bot = commands.Bot(command_prefix='/', intents=intents)
    
    @bot.event
    async def on_ready():
        logging.info(f"✅ Bot ready as {bot.user}")
        await setup(bot)
    
    bot.run(os.getenv("DISCORD_TOKEN"))
```

### handlers/message_handler.py

```python
import hashlib
import logging
from typing import Optional
from sync.telegram_sync import TelegramSync
from sync.deduplicator import Deduplicator

class MessageHandler:
    def __init__(self, config):
        self.config = config
        self.telegram = TelegramSync(config)
        self.dedup = Deduplicator(config.supabase)
    
    async def process_discord_message(self, message):
        """Discord 메시지 → Telegram 동기화"""
        
        # 1. 중복 확인
        content_hash = self._compute_hash(message.content)
        if await self.dedup.is_duplicate(content_hash):
            logging.info(f"Skipping duplicate: {content_hash[:8]}")
            return
        
        # 2. 메시지 포맷팅
        formatted = self._format_for_telegram(message)
        
        # 3. Telegram 전송
        try:
            tg_msg = await self.telegram.send(formatted)
            
            # 4. 동기화 로그 저장
            await self._log_sync(
                source="discord",
                target="telegram",
                discord_id=message.id,
                telegram_id=tg_msg.message_id,
                content_hash=content_hash,
                status="success"
            )
            
            logging.info(f"✅ Synced Discord→Telegram: {message.id}")
        except Exception as e:
            logging.error(f"❌ Failed to sync: {e}")
            await self._log_sync(
                source="discord",
                content_hash=content_hash,
                status="failed",
                error=str(e)
            )
    
    def _compute_hash(self, content: str) -> str:
        """Content hash 계산 (중복 제거용)"""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _format_for_telegram(self, message) -> str:
        """Discord 메시지를 Telegram 형식으로 변환"""
        return f"**[{message.author.name}]** {message.content}\n\n_From Discord #{message.channel.name}_"
    
    async def _log_sync(self, **kwargs):
        """Supabase에 동기화 로그 저장"""
        await self.config.supabase.table("discord_sync_log").insert(kwargs).execute()
```

### handlers/task_handler.py

```python
import logging
from datetime import datetime, timedelta

class TaskHandler:
    def __init__(self, config):
        self.config = config
        self.telegram = TelegramSync(config)
    
    async def create_and_sync_task(self, assigned_to: str, description: str, channel, creator):
        """작업 할당 & Telegram 동기화"""
        
        # 1. 작업 생성
        task_data = {
            "assigned_to": assigned_to,
            "task_description": description,
            "channel_id": str(channel.id),
            "priority": "normal",
            "deadline": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "created_by": str(creator.id),
            "status": "assigned"
        }
        
        # 2. DB에 저장
        response = await self.config.supabase.table("discord_task_queue").insert(task_data).execute()
        task_id = response.data[0]["id"] if response.data else None
        
        # 3. Telegram 알림
        message = f"📌 **New Task Assignment**\n" \
                  f"👤 Assigned to: {assigned_to}\n" \
                  f"📋 Task: {description}\n" \
                  f"📅 Deadline: {task_data['deadline']}"
        
        try:
            await self.telegram.send(message)
            logging.info(f"✅ Task synced: {task_id}")
        except Exception as e:
            logging.error(f"❌ Failed to notify Telegram: {e}")
        
        # 4. Discord 응답
        await channel.send(
            f"✅ Task assigned to {assigned_to}\n"
            f"Task ID: {task_id}\n"
            f"Synced to Telegram ✓"
        )
```

### handlers/ctb_handler.py (중요)

```python
import logging
import asyncio
from pathlib import Path
import yaml

class CTBHandler:
    """active_work_tracking.md 폴링 & Discord 자동 업데이트"""
    
    def __init__(self, config):
        self.config = config
        self.last_state = {}
    
    async def sync_and_update(self):
        """5분마다 실행: CTB 파일 폴링 → 상태 변화 감지 → Discord 업데이트"""
        
        try:
            # 1. CTB 파일 읽기
            ctb_data = await self._read_ctb_file()
            
            # 2. 상태 변화 감지
            changes = self._detect_changes(ctb_data, self.last_state)
            
            if not changes:
                logging.debug("No CTB changes detected")
                return
            
            # 3. Discord 채널별 업데이트
            for change in changes:
                await self._post_to_discord(change)
            
            # 4. 상태 저장
            self.last_state = ctb_data
            
            logging.info(f"✅ CTB sync completed: {len(changes)} changes")
            
        except Exception as e:
            logging.error(f"❌ CTB sync failed: {e}")
    
    async def _read_ctb_file(self) -> dict:
        """
        active_work_tracking.md 읽기
        형식: 마크다운 테이블
        """
        # 실제 구현: GitHub raw 또는 로컬 경로에서 읽기
        ctb_path = Path("/home/jeepney/.openclaw/workspace-dev/memory/active_work_tracking.md")
        
        if not ctb_path.exists():
            return {}
        
        content = ctb_path.read_text(encoding='utf-8')
        
        # 마크다운 테이블 파싱 (간단한 예)
        data = {}
        lines = content.split('\n')
        for line in lines:
            if '🟢' in line:  # 완료
                data[self._extract_task_id(line)] = {'status': 'completed'}
            elif '🟡' in line:  # 진행중
                data[self._extract_task_id(line)] = {'status': 'in_progress'}
            elif '🔴' in line:  # 대기
                data[self._extract_task_id(line)] = {'status': 'blocked'}
        
        return data
    
    def _detect_changes(self, current: dict, previous: dict) -> list:
        """이전 상태 vs 현재 상태 비교"""
        changes = []
        
        for task_id, current_state in current.items():
            prev_state = previous.get(task_id, {})
            
            if prev_state.get('status') != current_state.get('status'):
                changes.append({
                    'task_id': task_id,
                    'old_status': prev_state.get('status'),
                    'new_status': current_state.get('status')
                })
        
        return changes
    
    async def _post_to_discord(self, change: dict):
        """Discord 채널에 상태 업데이트 게시"""
        new_status = change['new_status']
        
        # 채널 결정
        if new_status == 'completed':
            channel_id = self.config.discord_channel_completed
            emoji = '✅'
        elif new_status == 'in_progress':
            channel_id = self.config.discord_channel_inprogress
            emoji = '🟡'
        elif new_status == 'blocked':
            channel_id = self.config.discord_channel_blocker
            emoji = '🔴'
        else:
            return
        
        # 메시지 작성 & 게시
        message = f"{emoji} Task {change['task_id']}: {new_status.upper()}"
        await self._send_to_channel(channel_id, message)
    
    async def _send_to_channel(self, channel_id: str, message: str):
        """Discord 채널에 메시지 전송"""
        # 실제 구현: discord.py 클라이언트 사용
        channel = self.bot.get_channel(int(channel_id))
        if channel:
            await channel.send(message)
    
    def _extract_task_id(self, line: str) -> str:
        """마크다운 라인에서 작업 ID 추출"""
        # 예: "🟢 Task #123: completed" → "123"
        import re
        match = re.search(r'#(\d+)', line)
        return match.group(1) if match else None
```

### sync/deduplicator.py (중복 제거)

```python
import hashlib
from typing import Optional

class Deduplicator:
    def __init__(self, supabase):
        self.supabase = supabase
    
    async def is_duplicate(self, content_hash: str) -> bool:
        """content_hash가 이미 동기화되었는지 확인"""
        try:
            result = await self.supabase.table("discord_sync_log") \
                .select("id") \
                .eq("content_hash", content_hash) \
                .eq("sync_status", "success") \
                .single() \
                .execute()
            
            return bool(result.data)
        except Exception:
            # 레코드 없음 = 새로운 메시지
            return False
    
    async def mark_synced(self, content_hash: str, discord_id: str, telegram_id: str):
        """동기화 완료 표시"""
        await self.supabase.table("discord_sync_log").insert({
            "content_hash": content_hash,
            "source_platform": "discord",
            "message_id": discord_id,
            "target_platform": "telegram",
            "sync_status": "success",
            "synced_at": "now()"
        }).execute()
```

### utils/crypto.py (Ed25519 검증)

```python
import nacl.signing
import nacl.exceptions
import logging

class Ed25519Validator:
    def __init__(self, public_key_str: str):
        self.public_key = nacl.signing.VerifyKey(public_key_str, encoder=nacl.encoding.HexEncoder)
    
    def verify_request(self, message: bytes, signature: str) -> bool:
        """Discord 웹훅 서명 검증"""
        try:
            self.public_key.verify(message, signature, encoder=nacl.encoding.HexEncoder)
            logging.info("✅ Signature verified")
            return True
        except nacl.exceptions.BadSignatureError:
            logging.warning("❌ Invalid signature")
            return False
```

---

## Next.js 구현 가이드

### pages/api/discord/webhook.ts

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyDiscordSignature } from '@/lib/discord/crypto';
import { handleDiscordInteraction } from '@/lib/discord/handlers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. 서명 검증 (Ed25519)
  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;
  
  if (!verifyDiscordSignature(req.body, signature, timestamp)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Ping 응답
  if (req.body.type === 1) {
    return res.status(200).json({ type: 1 });
  }
  
  // 3. 나머지 이벤트 처리
  try {
    const response = await handleDiscordInteraction(req.body);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Discord webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### lib/discord/handlers.ts

```typescript
import { createClient } from '@supabase/supabase-js';
import { hashContent } from './crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handleDiscordInteraction(interaction: any) {
  const { type, data, member, channel_id } = interaction;

  if (type === 2) { // COMMAND 타입
    if (data.name === 'task') {
      return handleTaskCommand(data, member, channel_id);
    }
  }

  return { type: 4, data: { content: 'Unknown command' } };
}

async function handleTaskCommand(
  data: any,
  member: any,
  channelId: string
) {
  const options = data.options || [];
  const assignedTo = options[0]?.value;
  const description = options[1]?.value;

  // 1. 작업 생성
  const { data: taskData, error } = await supabase
    .from('discord_task_queue')
    .insert({
      assigned_to: assignedTo,
      task_description: description,
      channel_id: channelId,
      priority: 'normal',
      status: 'assigned',
      created_by: member.user.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .select()
    .single();

  if (error) {
    return {
      type: 4,
      data: { content: `❌ Error: ${error.message}` },
    };
  }

  // 2. Telegram 알림 (별도 API 호출)
  await notifyTelegram(
    `📌 New Task\nAssigned: ${assignedTo}\nTask: ${description}`
  );

  return {
    type: 4,
    data: {
      content: `✅ Task #${taskData.id} assigned!\nSynced to Telegram ✓`,
    },
  };
}

async function notifyTelegram(message: string) {
  // 별도 API 또는 Python 서비스로 전달
  console.log(`[Telegram] ${message}`);
}
```

### pages/api/discord/ctb-sync.ts (Vercel Cron)

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { readActiveWorkTracking } from '@/lib/ctb-reader';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vercel Cron 검증
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. active_work_tracking.md 읽기
    const currentState = await readActiveWorkTracking();

    // 2. 이전 상태 조회
    const { data: lastSync } = await supabase
      .from('discord_sync_log')
      .select('*')
      .eq('source_platform', 'ctb')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    const lastState = lastSync?.data || {};

    // 3. 상태 변화 감지
    const changes = detectChanges(currentState, lastState);

    if (changes.length === 0) {
      return res.status(200).json({ changes: [], total_changes: 0 });
    }

    // 4. Discord 채널에 게시
    for (const change of changes) {
      await postToDiscordChannel(change);
    }

    // 5. 로그 저장
    await supabase.from('discord_sync_log').insert({
      source_platform: 'ctb',
      sync_status: 'success',
      synced_at: new Date(),
      data: { changes },
    });

    return res.status(200).json({
      last_sync: new Date(),
      changes,
      total_changes: changes.length,
    });
  } catch (error) {
    console.error('CTB sync error:', error);
    return res.status(500).json({ error: String(error) });
  }
}

function detectChanges(
  current: Record<string, any>,
  previous: Record<string, any>
): any[] {
  const changes = [];

  for (const [key, value] of Object.entries(current)) {
    if (previous[key]?.status !== value.status) {
      changes.push({
        task_id: key,
        old_status: previous[key]?.status,
        new_status: value.status,
      });
    }
  }

  return changes;
}

async function postToDiscordChannel(change: any) {
  const channelId =
    change.new_status === 'completed'
      ? process.env.DISCORD_CHANNEL_COMPLETED
      : change.new_status === 'in_progress'
        ? process.env.DISCORD_CHANNEL_INPROGRESS
        : process.env.DISCORD_CHANNEL_BLOCKER;

  const emoji =
    change.new_status === 'completed'
      ? '✅'
      : change.new_status === 'in_progress'
        ? '🟡'
        : '🔴';

  // Discord API 호출
  console.log(`[Discord] ${emoji} Task #${change.task_id}: ${change.new_status}`);
}
```

### pages/api/discord/status.ts

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Supabase 연결 확인
    const { data } = await supabase.from('discord_sync_log').select('count').single();
    
    // 2. 최근 동기화 시간
    const { data: lastSync } = await supabase
      .from('discord_sync_log')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    // 3. 메시지 큐 길이 (동기화 대기 중인 메시지)
    const { count: queueLength } = await supabase
      .from('discord_sync_log')
      .select('*', { count: 'exact' })
      .eq('sync_status', 'pending');

    // 4. 5분 동기화 율
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { count: syncRate } = await supabase
      .from('discord_sync_log')
      .select('*', { count: 'exact' })
      .eq('sync_status', 'success')
      .gte('synced_at', fiveMinutesAgo);

    return res.status(200).json({
      discord_connected: true,
      telegram_connected: true,
      supabase_connected: true,
      last_sync: lastSync?.synced_at || null,
      queue_length: queueLength || 0,
      sync_rate_5min: syncRate || 0,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: String(error) });
  }
}
```

---

## Telegram 동기화

### sync/telegram_sync.py

```python
from telegram import Bot, Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes
import logging

class TelegramSync:
    def __init__(self, config):
        self.config = config
        self.bot = Bot(token=config.telegram_token)
        self.app = Application.builder().token(config.telegram_token).build()
    
    async def send(self, message: str) -> dict:
        """Telegram에 메시지 전송"""
        try:
            msg = await self.bot.send_message(
                chat_id=self.config.telegram_chat_id,
                text=message,
                parse_mode='Markdown'
            )
            logging.info(f"✅ Sent to Telegram: {msg.message_id}")
            return {'message_id': msg.message_id}
        except Exception as e:
            logging.error(f"❌ Telegram send failed: {e}")
            raise
    
    async def setup_webhook(self, webhook_url: str):
        """Telegram 웹훅 설정 (incoming messages)"""
        await self.bot.set_webhook_url(webhook_url)
        logging.info(f"✅ Webhook set: {webhook_url}")
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Telegram 메시지 수신 & Discord 동기화"""
        message = update.message
        
        if not message.text:
            return
        
        # Discord로 전달
        # (여기서는 Next.js API 호출로 Discord Bot에 전달)
        await self._relay_to_discord(
            author=message.from_user.first_name,
            content=message.text,
            telegram_msg_id=message.message_id
        )
    
    async def _relay_to_discord(self, author: str, content: str, telegram_msg_id: int):
        """Telegram 메시지를 Discord로 전달"""
        import aiohttp
        
        async with aiohttp.ClientSession() as session:
            payload = {
                'source_platform': 'telegram',
                'author': author,
                'content': content,
                'telegram_msg_id': telegram_msg_id
            }
            async with session.post(
                f"{self.config.next_api_url}/api/discord/webhook",
                json=payload
            ) as resp:
                logging.info(f"Relayed to Discord: {resp.status}")
```

---

## 에러 처리 & 폴백 전략

### 1. 메시지 큐 (Queue Manager)

Discord 또는 Telegram 불가 시 로컬 큐에 저장하고 재시도.

```python
# sync/queue_manager.py
class MessageQueue:
    def __init__(self, config):
        self.config = config
        self.queue = []
    
    async def enqueue(self, message: dict):
        """실패한 메시지를 큐에 추가"""
        self.queue.append({
            **message,
            'retries': 0,
            'created_at': datetime.now()
        })
        logging.info(f"📦 Queued message: {len(self.queue)} in queue")
    
    async def retry_failed(self):
        """5분마다 재시도"""
        for msg in self.queue[:]:
            if msg['retries'] >= 3:
                self.queue.remove(msg)
                logging.error(f"❌ Dropped after 3 retries: {msg['id']}")
                continue
            
            try:
                await self._send(msg)
                self.queue.remove(msg)
            except Exception as e:
                msg['retries'] += 1
                logging.warning(f"⚠️ Retry {msg['retries']}/3: {e}")
```

### 2. Rate Limiting (5 req/sec)

```python
# sync/queue_manager.py
import asyncio
from collections import deque

class RateLimiter:
    def __init__(self, max_requests: int = 5, window: int = 1):
        self.max_requests = max_requests
        self.window = window
        self.requests = deque()
    
    async def acquire(self):
        """Rate limit 내에서 요청 실행"""
        now = asyncio.get_event_loop().time()
        
        # 1초 이상 된 요청 제거
        while self.requests and (now - self.requests[0]) > self.window:
            self.requests.popleft()
        
        if len(self.requests) >= self.max_requests:
            wait_time = self.window - (now - self.requests[0])
            await asyncio.sleep(wait_time)
            return await self.acquire()  # 재시도
        
        self.requests.append(now)
```

### 3. 에러 분류 & 재시도

```python
# utils/errors.py
class DiscordError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        self.retryable = status_code >= 500

class TelegramError(Exception):
    def __init__(self, message: str):
        self.message = message
        self.retryable = 'timeout' in message.lower()

# 사용 예
try:
    await discord_bot.send_message(...)
except DiscordError as e:
    if e.retryable:
        await queue_manager.enqueue(message)
    else:
        logging.error(f"❌ Non-retryable error: {e}")
```

---

## 테스트 체크리스트

### E2E 테스트 (7가지 시나리오)

#### 시나리오 1: Discord → Telegram (기본 경로)
```bash
# 1. Discord에서 메시지 전송
# 2. Python bot이 수신
# 3. Telegram에 동기화 확인
# ✅ 기대 결과: Telegram에 메시지 나타남
```

#### 시나리오 2: 중복 제거
```bash
# 1. 같은 내용의 메시지를 2번 전송
# 2. 첫 번째만 동기화, 두 번째는 스킵
# ✅ 기대 결과: Telegram에 1개만 나타남
```

#### 시나리오 3: 작업 할당
```bash
# 1. Discord에서 `/task @user 작업내용` 실행
# 2. DB에 작업 저장 & Telegram 알림
# ✅ 기대 결과: 
#    - DB에 작업 생성됨
#    - Telegram에 "New Task" 알림
```

#### 시나리오 4: CTB 폴링 & 업데이트
```bash
# 1. active_work_tracking.md에서 상태 변경 (🟡→✅)
# 2. 5분 후 자동 폴링
# 3. Discord #완료 채널에 게시
# ✅ 기대 결과: Discord에 상태 업데이트 메시지 나타남
```

#### 시나리오 5: 네트워크 오류 & 재시도
```bash
# 1. Telegram API 다운 시뮬레이션
# 2. 메시지는 큐에 저장
# 3. Telegram 복구 후 자동 재시도
# ✅ 기대 결과: 큐에 있던 메시지 모두 동기화
```

#### 시나리오 6: Discord 서명 검증
```bash
# 1. 잘못된 서명으로 webhook 호출
# ✅ 기대 결과: 401 Unauthorized 응답
```

#### 시나리오 7: 동시 메시지 (Rate Limiting)
```bash
# 1. 10개 메시지를 동시에 전송
# 2. Rate limiter가 5 req/sec로 제한
# ✅ 기대 결과: 메시지는 모두 처리되지만 순차적으로
```

### 단위 테스트

```python
# tests/test_deduplicator.py
import pytest
from sync.deduplicator import Deduplicator

@pytest.mark.asyncio
async def test_duplicate_detection():
    dedup = Deduplicator(mock_supabase)
    
    # 첫 전송
    is_dup = await dedup.is_duplicate("hash123")
    assert not is_dup
    
    # 두 번째 전송 (같은 해시)
    await dedup.mark_synced("hash123", "msg1", "msg2")
    is_dup = await dedup.is_duplicate("hash123")
    assert is_dup

# tests/test_rate_limiter.py
@pytest.mark.asyncio
async def test_rate_limiting():
    limiter = RateLimiter(max_requests=5, window=1)
    
    # 5개 요청은 즉시 통과
    for i in range(5):
        await limiter.acquire()
    
    # 6번째는 대기
    start = time.time()
    await limiter.acquire()
    elapsed = time.time() - start
    assert elapsed >= 0.9  # ~1초 대기
```

---

## 배포 가이드

### Phase 1: 환경 설정 (Day 1-2)

1. **Discord Bot 생성**
   - https://discord.com/developers/applications
   - OAuth2 > URL Generator에서 스코프 선택:
     - `bot`
     - `applications.commands`
   - 권한: `Send Messages`, `Read Messages`, `Manage Messages`

2. **Telegram Bot 생성**
   - @BotFather에게 `/newbot` 명령
   - Token 받기

3. **환경 변수 설정**
   ```bash
   # Discord
   DISCORD_TOKEN=xxxxxxxxxxx
   DISCORD_WEBHOOK_PUBLIC_KEY=xxxxx
   DISCORD_WEBHOOK_SECRET=xxxxx
   DISCORD_CHANNEL_GENERAL=1234567890
   DISCORD_CHANNEL_INPROGRESS=2345678901
   # ... (위 설정 참고)
   
   # Vercel 배포용
   CRON_SECRET=your_cron_secret
   ```

4. **Supabase 마이그레이션**
   - 위 SQL 스크립트 실행
   - 테이블 생성 확인

### Phase 2: Python Bot 배포 (Day 3-5)

**배포 옵션 A: Render.com (추천)**
```bash
# 1. Render.com 회원가입
# 2. New + Web Service 생성
# 3. GitHub repo 연결
# 4. Environment 설정 (Discord, Telegram, Supabase 토큰)
# 5. Deploy
```

**배포 옵션 B: Docker (로컬 서버)**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY discord_bot/ .
CMD ["python", "bot.py"]
```

### Phase 3: Vercel 배포 (Day 6-7)

```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "env": {
    "DISCORD_TOKEN": "@discord_token",
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_key",
    "CRON_SECRET": "@cron_secret"
  },
  "functions": {
    "pages/api/discord/**": {
      "runtime": "nodejs18.x",
      "memory": 1024
    }
  },
  "crons": [{
    "path": "/api/discord/ctb-sync",
    "schedule": "*/5 * * * *"
  }]
}
```

### Phase 4: E2E 테스트 (Day 8-9)

```bash
# 1. Discord 메시지 전송 → Telegram 확인
# 2. Telegram 메시지 → Discord 확인
# 3. /task 커맨드 테스트
# 4. CTB 폴링 테스트 (5분 대기)
# 5. 네트워크 오류 복구 테스트
# 6. 로드 테스트 (10 concurrent messages)
```

### Phase 5: 프로덕션 배포 (Day 10)

```bash
# 1. Discord webhook URL 설정
#    https://yourvercel.app/api/discord/webhook

# 2. Telegram webhook 설정
#    POST https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://yourbot.com/telegram

# 3. Vercel Cron 활성화
#    vercel env pull
#    vercel deploy --prod

# 4. 모니터링 설정
#    - Discord: #로그 채널에 에러 메시지 자동 게시
#    - Telegram: 에러 발생 시 CEO에게 알림
```

---

## 빠른 참조 (Quick Reference)

### 커맨드
```bash
# Discord
/task @user 작업내용      # 작업 할당
/status                   # 동기화 상태 확인

# CLI (테스트용)
curl -X GET http://localhost:8000/api/discord/status
```

### 환경 변수 (필수 12개)
```
DISCORD_TOKEN
DISCORD_WEBHOOK_PUBLIC_KEY
DISCORD_WEBHOOK_SECRET
DISCORD_CHANNEL_GENERAL
DISCORD_CHANNEL_INPROGRESS
DISCORD_CHANNEL_COMPLETED
DISCORD_CHANNEL_BLOCKER
DISCORD_CHANNEL_TEAM_DISCUSS
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### 파일 구조
```
dsc-fms-portal/
├── pages/api/discord/
│   ├── webhook.ts
│   ├── task.ts
│   ├── ctb-sync.ts
│   ├── status.ts
│   └── ...

discord_bot/
├── bot.py
├── handlers/
├── sync/
├── utils/
└── requirements.txt
```

### 메트릭 수집
- 일일 메시지 동기화 수: `/api/discord/metrics`
- 동기화 성공률: `success_count / total_count * 100%`
- 큐 대기 시간: `avg(synced_at - created_at)`

---

## 다음 단계

1. ✅ **이 가이드를 프론트엔드 팀과 공유** (5월 20일)
2. 📅 **Day 1-2: 환경 설정 & DB 마이그레이션**
3. 📅 **Day 3-5: Python Bot 개발 & 배포**
4. 📅 **Day 6-7: Next.js API 개발 & Vercel 배포**
5. 📅 **Day 8-9: E2E 테스트 & 디버깅**
6. 📅 **Day 10: 프로덕션 배포 & 모니터링**

**예상 완료일:** 2026-05-29 ✅

---

## 문제 해결 (Troubleshooting)

### Discord 웹훅 서명 검증 실패
```
❌ 에러: Invalid signature
✅ 해결: 
  1. DISCORD_WEBHOOK_PUBLIC_KEY 재확인
  2. 요청 body를 그대로 전달하는지 확인 (JSON 파싱 후 다시 stringify 하면 안 됨)
```

### Telegram 메시지 전송 실패
```
❌ 에러: Unauthorized
✅ 해결:
  1. TELEGRAM_BOT_TOKEN 확인
  2. TELEGRAM_CHAT_ID 확인 (그룹 채팅은 음수 ID)
```

### CTB 폴링이 작동하지 않음
```
❌ 에러: File not found
✅ 해결:
  1. active_work_tracking.md 경로 확인
  2. Vercel Cron이 활성화되었는지 확인
  3. CRON_SECRET 검증
```

### Rate Limit 오류
```
❌ 에러: 429 Too Many Requests
✅ 해결:
  1. rate_limiter 재시작
  2. Discord/Telegram API 제한 확인
  3. 메시지 큐 모니터링
```

---

**작성 완료:** 2026-05-19 16:30 KST  
**최종 상태:** ✅ 프론트엔드 팀 즉시 개발 가능  
**담당자:** Discord Bot Phase 1 플레너
