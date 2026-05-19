---
name: Discord Bot Phase 1 상세 설계서
description: Telegram ↔ Discord 양방향 메시지 동기화 + CTB 실시간 업데이트 + 작업 지시 명령어 (Option B)
type: design-document
date: 2026-05-19
status: 설계 완료 → 웹개발자 구현 대기
target_completion: 2026-06-02
---

# Discord Bot Phase 1 — 상세 설계서

**결정일:** 2026-05-18 22:52 KST (Option B 채택 — "B로가자")
**설계 완료:** 2026-05-19
**구현 시작:** 2026-05-24 (Audit System 완료 후)
**완료 목표:** 2026-06-02 (10일, 당초 06-06에서 단축)
**담당:** 웹개발자 (24h) + 플레너 (8h)

---

## 1. 시스템 개요

### 목적

CEO (나경태)는 Telegram을 메인 채널로 사용하고, AI 팀원들은 Discord에서 작업 결과를 공유한다.
현재 두 플랫폼 사이에 수동 복사가 필요한 구조 → Phase 1에서 완전 자동 양방향 동기화로 해결한다.

### 범위 (In Scope — Phase 1)

| 기능 | 설명 |
|-----|------|
| 메시지 양방향 동기화 | Telegram ↔ Discord 실시간 미러링 |
| 작업 지시 명령어 | Discord `/task @assign` 명령어 |
| CTB 실시간 업데이트 | active_work_tracking.md 변화 → Discord #진행중 자동 포스팅 |
| 중복 메시지 제거 | message_id + content hash 기반 dedup |
| 에러 폴백 | Discord 불가 시 Telegram 우선 유지 |

### 범위 외 (Phase 2 이후)

- Thread 단위 동기화
- Emoji reaction 미러링
- Slack / MS Teams 통합

---

## 2. 아키텍처

### 2.1 전체 메시지 흐름

```
CEO (Telegram)
│
│  MSG "Asset Master API #8 시작"
▼
Telegram Bot (python-telegram-bot)
│  ├─ 메시지 수신
│  ├─ 내용 파싱 (command vs plain text)
│  └─ discord_sync_log 기록
▼
Discord Bot (discord.py)
│  ├─ #공지사항 채널에 포스팅
│  └─ Embed 형식으로 표시


팀원 (Discord #팀논의)
│
│  MSG "구현 완료, PR 올림"
▼
Discord Bot (discord.py)
│  ├─ 메시지 수신 (on_message)
│  ├─ 내용 파싱
│  └─ discord_sync_log 기록
▼
Telegram Bot
│  ├─ CEO 채팅에 포워딩
│  └─ "[Discord #팀논의] 웹개발자: 구현 완료, PR 올림"


CTB (active_work_tracking.md)
│
│  상태 변화: PENDING → IN_PROGRESS
▼
Vercel Cron (5분 간격)
│  ├─ CTB 파일 폴링 (변화 감지)
│  └─ /api/discord/ctb-update 호출
▼
Discord #진행중 채널
│  ├─ 포맷팅된 Embed 포스팅
▼
Telegram CEO DM
   └─ 【일정 앞당김】 알림
```

### 2.2 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js)                         │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────┐  │
│  │ /api/discord/   │    │ /api/discord/   │    │ /api/      │  │
│  │   webhook       │    │    task         │    │ discord/   │  │
│  │                 │    │                 │    │ ctb-update │  │
│  └────────┬────────┘    └────────┬────────┘    └─────┬──────┘  │
│           │                     │                   │          │
│           ▼                     ▼                   ▼          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Sync Engine                           │   │
│  │  ┌───────────────┐  ┌────────────────┐  ┌───────────┐  │   │
│  │  │conflict_      │  │ message_       │  │ ctb_sync  │  │   │
│  │  │resolver       │  │ handler        │  │           │  │   │
│  │  └───────────────┘  └────────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Supabase                             │   │
│  │  discord_sync_log │ discord_messages │ discord_task_    │   │
│  │                   │                 │ queue            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                                │
          ▼                                ▼
   Discord Bot                       Telegram Bot
   (discord.py)                  (python-telegram-bot)
   ├─ on_message                   ├─ on_message
   ├─ on_slash_command             └─ forward_to_discord
   └─ post_embed
```

### 2.3 채널 라우팅 규칙

| 소스 | 소스 채널/컨텍스트 | 타겟 Discord 채널 |
|------|-------------------|-----------------|
| Telegram (CEO) | 모든 메시지 | #공지사항 |
| Telegram (CEO) | `/task @assign` | #진행중 + DB 기록 |
| Discord #팀논의 | 모든 메시지 | Telegram CEO DM |
| Discord #완료 | 완료 공지 | Telegram CEO DM |
| CTB 상태 변화 | PENDING→IN_PROGRESS | Discord #진행중 |
| CTB 상태 변화 | IN_PROGRESS→COMPLETED | Discord #완료 |
| CTB 상태 변화 | *→BLOCKED | Discord #문제해결 |

---

## 3. 데이터베이스 설계

### 3.1 테이블 목록

| 테이블명 | 목적 |
|---------|------|
| `discord_sync_log` | 모든 메시지 동기화 이력 |
| `discord_messages` | Discord 수신 메시지 원본 |
| `discord_task_queue` | `/task` 명령어로 생성된 작업 |
| `discord_notifications` | 양 플랫폼 알림 발송 이력 |

### 3.2 스키마

```sql
-- Migration: discord_bot_phase1.sql

CREATE TABLE discord_sync_log (
  id              SERIAL PRIMARY KEY,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('telegram', 'discord', 'ctb')),
  source_msg_id   BIGINT,
  target_platform TEXT NOT NULL CHECK (target_platform IN ('telegram', 'discord')),
  target_msg_id   BIGINT,
  content_hash    TEXT,                          -- SHA-256, dedup용
  sync_status     TEXT NOT NULL DEFAULT 'pending'
                  CHECK (sync_status IN ('success', 'fallback', 'error', 'duplicate')),
  error_msg       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  synced_at       TIMESTAMPTZ
);

CREATE INDEX idx_sync_log_source   ON discord_sync_log (source_msg_id);
CREATE INDEX idx_sync_log_hash     ON discord_sync_log (content_hash);
CREATE INDEX idx_sync_log_created  ON discord_sync_log (created_at DESC);


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

CREATE INDEX idx_discord_msg_user     ON discord_messages (user_id);
CREATE INDEX idx_discord_msg_channel  ON discord_messages (channel_id);


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
CREATE INDEX idx_task_queue_status   ON discord_task_queue (status);


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

CREATE INDEX idx_notifications_user     ON discord_notifications (user_id);
CREATE INDEX idx_notifications_created  ON discord_notifications (created_at DESC);
```

---

## 4. 코드 구조

### 4.1 프로젝트 레이아웃

```
discord_bot/               ← 독립 실행 Python 서비스
├── bot.py                 ← 메인 진입점 (Discord events)
├── telegram_bridge.py     ← Telegram 이벤트 수신 + Discord 전달
├── config.py              ← 토큰, 채널 ID, Supabase URL
├── requirements.txt
│
├── handlers/
│   ├── message_handler.py ← 일반 메시지 동기화
│   ├── task_handler.py    ← /task @assign 명령어
│   ├── ctb_handler.py     ← CTB 변화 처리 (Vercel Cron 수신)
│   └── error_handler.py   ← 폴백 로직 + 알림
│
└── sync/
    ├── telegram_sync.py   ← Discord → Telegram API 호출
    ├── discord_sync.py    ← Telegram → Discord API 호출
    ├── ctb_sync.py        ← CTB 파일 파싱 + 변화 감지
    └── conflict_resolver.py ← 중복 제거 (hash 비교)

dsc-fms-portal/pages/api/discord/   ← Next.js API routes (Vercel)
├── webhook.ts             ← Discord 메시지 수신 엔드포인트
├── task.ts                ← 작업 지시 처리
├── ctb-update.ts          ← CTB 변화 → Discord 포스팅
└── status.ts              ← 동기화 상태 조회
```

### 4.2 핵심 로직 — 메시지 동기화

```python
# handlers/message_handler.py

async def handle_discord_message(message: discord.Message):
    """Discord 메시지 수신 → Telegram 동기화"""

    # 1. 봇 자신 메시지 무시
    if message.author.bot:
        return

    # 2. 동기화 대상 채널 확인
    if message.channel.id not in SYNC_CHANNELS:
        return

    # 3. 중복 감지
    content_hash = sha256(
        f"{message.id}:{message.content}".encode()
    ).hexdigest()

    if await conflict_resolver.exists(content_hash):
        await log_sync(
            source_platform="discord",
            source_msg_id=message.id,
            sync_status="duplicate"
        )
        return

    # 4. Telegram 전송
    tg_text = f"[Discord #{message.channel.name}] {message.author.display_name}:\n{message.content}"

    try:
        tg_msg = await telegram_sync.send(tg_text)
        await log_sync(
            source_platform="discord",
            source_msg_id=message.id,
            target_platform="telegram",
            target_msg_id=tg_msg.message_id,
            content_hash=content_hash,
            sync_status="success"
        )
    except Exception as e:
        await log_sync(
            source_platform="discord",
            source_msg_id=message.id,
            sync_status="error",
            error_msg=str(e)
        )
        await error_handler.alert(e)
```

### 4.3 핵심 로직 — CTB 동기화

```python
# sync/ctb_sync.py

class CTBSync:
    """active_work_tracking.md 폴링 → 상태 변화 감지 → Discord 포스팅"""

    STATE_FILE = "/tmp/ctb_last_state.json"

    async def poll(self):
        """Vercel Cron에서 5분마다 호출"""
        current = self._parse_ctb()
        previous = self._load_previous()

        changes = self._diff(previous, current)
        if not changes:
            return

        for change in changes:
            await self._post_to_discord(change)
            await self._notify_telegram(change)

        self._save_state(current)

    def _parse_ctb(self) -> dict:
        """active_work_tracking.md에서 태스크 상태 추출"""
        # 실제 구현: Supabase active_work table 또는 파일 읽기
        ...

    async def _post_to_discord(self, change: dict):
        channel_map = {
            "IN_PROGRESS": CHANNEL_INPROGRESS,
            "COMPLETED":   CHANNEL_COMPLETED,
            "BLOCKED":     CHANNEL_ISSUES,
        }
        channel_id = channel_map.get(change["new_status"])
        if not channel_id:
            return

        embed = discord.Embed(
            title=f"【{change['new_status']}】 {change['task_name']}",
            color=STATUS_COLORS[change["new_status"]],
            timestamp=datetime.utcnow()
        )
        embed.add_field(name="담당자", value=change["assignee"], inline=True)
        embed.add_field(name="ETA", value=change.get("eta", "-"), inline=True)
        if change.get("time_delta"):
            embed.add_field(name="Time Delta", value=change["time_delta"], inline=True)

        channel = bot.get_channel(channel_id)
        await channel.send(embed=embed)
```

### 4.4 CTB 업데이트 메시지 포맷

```
【진행중】Asset Master API #8
├─ 담당자: 웹개발자
├─ ETA: 15:30
├─ Time Delta: +20분 (예상보다 빠름)
└─ 상태 변화: PENDING → IN_PROGRESS ⏳

【완료】Backup Phase 2 UI 평가
├─ 담당자: 평가자
├─ 실제 소요: 165분 / 예상: 180분 (15분 단축)
└─ 다음 작업 자동 당김: CTB Adjustment ✅

【블로커】Discord Bot Webhook 설정
├─ 담당자: 웹개발자
├─ 사유: Discord API 응답 지연
└─ 폴백: Telegram 단일 채널로 전환 🔴
```

---

## 5. 환경 설정

### 5.1 필수 환경 변수

```env
# Discord
DISCORD_BOT_TOKEN=...
DISCORD_PUBLIC_KEY=...           # Interactions 서명 검증용
DISCORD_GUILD_ID=...

# Discord 채널 ID
DISCORD_CHANNEL_ANNOUNCEMENTS=... # #공지사항
DISCORD_CHANNEL_INPROGRESS=...    # #진행중
DISCORD_CHANNEL_COMPLETED=...     # #완료
DISCORD_CHANNEL_ISSUES=...        # #문제해결
DISCORD_CHANNEL_DISCUSSION=...    # #팀논의

# Telegram
TELEGRAM_BOT_TOKEN=...            # 기존 봇 토큰 재사용
TELEGRAM_CEO_CHAT_ID=...          # CEO DM 채팅 ID

# Supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...     # 서버사이드 전용

# CTB
CTB_POLL_INTERVAL_SEC=300         # 5분
```

### 5.2 Discord 개발자 포털 설정

| 항목 | 값 |
|-----|---|
| Bot Intents | MESSAGE_CONTENT, GUILD_MESSAGES, DIRECT_MESSAGES |
| Interactions Endpoint URL | `https://[project].vercel.app/api/discord/webhook` |
| Slash Commands | `/task` (description: "작업 지시") |
| Bot Permissions | SEND_MESSAGES, EMBED_LINKS, READ_MESSAGE_HISTORY |

### 5.3 Discord 채널 구조

```
DSC-MANNUR-AI 서버
├── 공지
│   └── #공지사항       ← Telegram CEO 메시지 자동 동기화
├── 작업 현황
│   ├── #진행중         ← CTB 실시간 업데이트
│   ├── #완료           ← 완료 공지 자동 포스팅
│   └── #문제해결       ← 블로커 알림
└── 팀 소통
    └── #팀논의         ← 수동 + Telegram 역방향 동기화
```

---

## 6. 에러 처리 & 폴백

### 6.1 시나리오별 처리

| 시나리오 | 처리 방법 | 로그 상태 |
|---------|----------|-----------|
| Discord API 불가 | Telegram 단일 채널로 전환 | `fallback` |
| 중복 메시지 | Skip (재전송 없음) | `duplicate` |
| `/task` 잘못된 멤버명 | Discord embed 오류 응답 + 유효 멤버 목록 표시 | `error` |
| Telegram API 불가 | Discord에만 기록 + 알림 | `error` |
| CTB 파싱 실패 | 이전 상태 유지 + Discord #문제해결 알림 | `error` |
| 처리 시간 3초 초과 | Deferred response (type 5) + Follow-up | — |

### 6.2 폴백 흐름

```
Discord 포스팅 시도
│
├─ 성공 → discord_sync_log: status=success
│
└─ 실패 (HTTPException, 5xx)
   ├─ 재시도 1회 (500ms 후)
   │
   ├─ 재시도 성공 → status=success
   │
   └─ 재시도 실패
      ├─ Telegram CEO DM: "Discord 동기화 실패: [메시지 요약]"
      ├─ discord_sync_log: status=fallback
      └─ discord_notifications 기록
```

---

## 7. 구현 일정 (10일)

### Day 1-2: 기반 구조 (2026-05-24~25)

- [ ] Discord Bot 토큰 발급 + Intents 활성화
- [ ] Discord 채널 4개 생성 + ID 수집
- [ ] Supabase 마이그레이션 실행 (`discord_bot_phase1.sql`)
- [ ] `bot.py` 기본 구조: `on_ready`, `on_message` 이벤트 리스너
- [ ] `config.py`: 모든 토큰/채널 ID 주입
- [ ] 연결 테스트: `!ping` → 봇 응답 확인

### Day 3-4: 메시지 동기화 (2026-05-26~27)

- [ ] `message_handler.py`: Discord → Telegram 단방향 동기화
- [ ] `telegram_bridge.py`: Telegram → Discord 단방향 동기화
- [ ] `conflict_resolver.py`: content_hash 기반 중복 제거
- [ ] `discord_sync_log` 기록 검증
- [ ] 양방향 테스트: 10개 메시지 교차 전송 + 로그 확인

### Day 5-6: 작업 지시 명령어 (2026-05-28~29)

- [ ] `/task @assign [member] [task]` Slash Command 등록
- [ ] `task_handler.py`: 유효성 검증 + `discord_task_queue` 생성
- [ ] CTB 연동: 새 작업 → `active_work_tracking.md` 추가
- [ ] Telegram CEO DM: `【새작업】@member: [task]` 알림
- [ ] 오류 응답: 잘못된 멤버명 → 유효 목록 embed 표시

### Day 7-8: CTB 실시간 동기화 (2026-05-30~31)

- [ ] `ctb_handler.py`: 상태 변화 감지 로직
- [ ] `/api/discord/ctb-update.ts`: Vercel Cron 엔드포인트
- [ ] `vercel.json` Cron 설정 (`*/5 * * * *`)
- [ ] Discord #진행중 Embed 포맷 구현
- [ ] Telegram DM 알림 구현
- [ ] CTB 상태 변화 시뮬레이션 테스트

### Day 9: 통합 테스트 (2026-06-01)

- [ ] E2E 테스트: Telegram MSG → Discord #공지사항 표시 확인
- [ ] E2E 테스트: Discord MSG → Telegram CEO DM 확인
- [ ] E2E 테스트: `/task @assign 웹개발자 API 구현` → CTB 반영
- [ ] E2E 테스트: CTB PENDING→IN_PROGRESS → Discord #진행중 포스팅
- [ ] 부하 테스트: 1분간 20개 메시지 연속 전송 (중복 없이 처리)
- [ ] 폴백 테스트: Discord API 강제 오류 → Telegram 전환 확인

### Day 10: 배포 & 문서화 (2026-06-02)

- [ ] Vercel 배포 (`discord_bot/` 서비스)
- [ ] 환경 변수 Vercel Dashboard 설정
- [ ] Discord Interactions URL 업데이트
- [ ] 운영 모니터링 확인 (`/api/discord/status`)
- [ ] 운영 가이드 작성 (채널 운영 규칙, 명령어 목록)

---

## 8. 성공 지표 (Success Metrics)

| 지표 | 목표 | 측정 방법 |
|-----|------|---------|
| 메시지 동기화 신뢰도 | 99% 이상 | discord_sync_log 에러율 |
| 동기화 지연 | <5초 | 메시지 전송 → 타겟 수신 시간 |
| 작업 지시 처리 지연 | <10초 | task 생성 → CTB 반영 시간 |
| CTB 실시간성 | <5분 | 변화 감지 → Discord 포스팅 시간 |
| 중복 메시지 제거율 | 100% | duplicate 로그 / 전체 로그 |
| Bot 가용성 | 99.5% 이상 | uptime 모니터링 (24h 기준) |

---

## 9. 의존성 분석

```
[전제 조건]
├─ Supabase 기존 설정 ✅
├─ Telegram Bot Token 기존 발급 ✅
├─ Vercel Cron 기존 사용 ✅
└─ discord.py, python-telegram-bot 설치 (신규)

[내부 의존성]
conflict_resolver ← message_handler (중복 감지 선행 필요)
            ↑
     telegram_sync
            ↑
   discord_sync (양방향 완성)
            ↑
    ctb_handler (CTB 연동은 동기화 완성 후)
            ↑
  /api/discord/ctb-update (Cron 엔드포인트 마지막)
```

---

## 10. 라이브러리 의존성

```txt
# requirements.txt
discord.py==2.3.2
python-telegram-bot==20.7
supabase==2.3.0
httpx==0.26.0
python-dotenv==1.0.0
```

```bash
# Next.js (기존 프로젝트에 추가 없음)
# discord/webhook.ts, task.ts, ctb-update.ts, status.ts
# 모두 기존 Next.js API route 패턴 그대로 사용
```

---

## 11. 참고 문서

- `memory/project_discord_bot_phase1.md` — 결정 이력 (Option B 선택)
- `memory/project_discord_bot_system.md` — 시스템 개요
- `memory/project_discord_bot_architecture.md` — 고급 아키텍처 (Phase 2 Processor 설계)
- `DISCORD_BOT_API_SPEC.md` — 14개 API 엔드포인트 명세 (별도 파일)
