---
name: Discord Bot System Phase 1 설계
description: Telegram ↔ Discord 양방향 동기화 + CTB 실시간 업데이트 + 작업 지시 능력
type: project
date: 2026-05-18 23:00 KST
status: 설계 완료, 구현 대기
---

# Discord Bot System Phase 1 설계
**결정:** 2026-05-18 22:52 KST "B로가자" (Option B 채택)  
**시작 예정:** 2026-05-24 (Audit System 완료 후)  
**완료 목표:** 2026-06-06 (2주)  
**담당:** 웹개발자 (24시간) + 플레너 (8시간)

---

## 📋 시스템 개요

### 목표
기존 Telegram 단일 채널 지시 → Discord 완전 통합  
- ✅ Telegram ↔ Discord 실시간 양방향 동기화
- ✅ Discord에서도 Telegram과 동일 수준의 작업 지시 가능
- ✅ Central Task Board (active_work_tracking.md) → Discord 자동 업데이트
- ✅ 모든 팀 공지/진행상황/결과 양 플랫폼에 동시 표시

### 핵심 결정사항
1. **메시지 라우팅:** Telegram 오리진(CEO) → 자동 Discord 동기화 + Discord 오리진(팀) → 자동 Telegram 동기화
2. **작업 지시:** `/task @assign [member] [task]` Discord 명령어 지원 (Telegram과 동일)
3. **CTB 동기화:** 매 상태 변화 시 + 정기 갱신 (08:00, 14:00, 15:00, 18:00)
4. **알림:** Telegram 우선 + Discord 백업 (중복 방지)

---

## 🏗️ Architecture

### 1. Message Flow Diagram
```
User (CEO)
├─ Telegram MSG_1
│  └─ Discord Bot (listen)
│     └─ Discord MSG_1 (auto-sync)
│        └─ Team reads on Discord
│
Team (members)
├─ Discord MSG_2
│  └─ Telegram Bot (listen)
│     └─ Telegram MSG_2 (auto-sync)
│        └─ User reads on Telegram
│
Active Work Tracking (CTB)
├─ state change event
│  └─ Both bots:
│     ├─ Update #진행중 channel (Discord)
│     └─ Send notification (Telegram)
```

### 2. Data Flow
- **Primary:** Telegram ← → Discord (message sync)
- **Secondary:** CTB ← → Discord (state sync)
- **Notification:** CTB change → Telegram (DM) + Discord (mention)

### 3. Databases & APIs
```
Supabase Tables:
├─ discord_sync_log (message_id, direction, platform, status)
├─ discord_messages (msg_id, user_id, content, timestamp, synced_to_tg)
├─ discord_task_queue (task_id, assigned_to, platform, status)
└─ discord_notifications (notify_id, type, user_id, read)

Discord Bot APIs:
├─ on_message(message) → sync to Telegram
├─ on_task_command(/@assign) → create task in DB
├─ on_ctb_update() → post to #진행중 channel
└─ on_error() → log + fallback to Telegram alert
```

---

## 📦 Deliverables (Phase 1)

### 1. Discord Bot Code Structure
```
discord_bot/
├─ bot.py (main entry point, event handlers)
├─ handlers/
│  ├─ message_handler.py (incoming messages)
│  ├─ task_handler.py (/task commands)
│  ├─ ctb_handler.py (CTB updates)
│  └─ error_handler.py (fallback logic)
├─ sync/
│  ├─ telegram_sync.py (send to Telegram API)
│  ├─ ctb_sync.py (query active_work_tracking.md)
│  └─ conflict_resolver.py (duplicate msg detection)
├─ config.py (Discord token, channel IDs, Telegram bot token)
└─ requirements.txt (discord.py, supabase-py, requests)
```

### 2. API Routes (Next.js)
```
POST /api/discord/webhook
  ├─ receive raw Discord message
  ├─ validate signature
  └─ queue to sync engine

POST /api/discord/task
  ├─ /task @assign [member] [task]
  └─ create task in DB + update CTB

GET /api/discord/status
  ├─ last sync timestamp
  ├─ message queue depth
  └─ error count (24h)

POST /api/discord/ctb-update
  ├─ source: active_work_tracking.md change
  └─ target: #진행중 channel post
```

### 3. Discord Channels Setup
```
#공지사항 (Announcements)
├─ User 공지 → auto-sync from Telegram

#진행중 (In Progress)
├─ CTB real-time updates
├─ Format: 【일정 앞당김】 [Task] → [New ETA] ✅
└─ Auto-updated by CTB sync engine

#완료 (Completed)
├─ Task completion notices
└─ Daily rollup

#문제해결 (Issues)
├─ Blocker alerts
├─ Error logs (from both platforms)
└─ Auto-post on DRS <85%

#팀논의 (Team Discussion)
├─ Keep current (unchanged)
└─ Still manual (not auto-sync)
```

---

## 🔄 Core Features

### Feature 1: Message Synchronization
**Trigger:** User sends message on Telegram or Discord  
**Flow:**
1. Telegram receives MSG → Bot listens
2. Extract: message ID, user, content, timestamp
3. Check: is this a work instruction or general chat?
   - If `/` command → task handler
   - If plain text → message sync
4. Sync to Discord: post in appropriate channel (#공지사항 or #진행중)
5. Log to `discord_sync_log` table

**Deduplication:**
- Store `tg_msg_id` + `discord_msg_id` mapping
- Check before syncing: if already exists → skip

### Feature 2: Task Assignment via Discord
**Command:** `/task @assign [member_name] [task_description]`

**Flow:**
1. User types on Discord
2. Bot validates: member exists + task not duplicate
3. Create row in `discord_task_queue`
4. Update active_work_tracking.md (add new task)
5. Sync to Telegram: "【새작업】@member: [task_description] ✅"
6. Return Discord embed: "Task assigned to @member"

**Fields:**
- assigned_to (member ID)
- task_description (100-500 chars)
- priority (P0/P1/P2)
- deadline (optional, defaults to EOD)
- platform_origin (discord or telegram)

### Feature 3: CTB Real-Time Updates
**Trigger:** active_work_tracking.md state change (PENDING → IN_PROGRESS → BLOCKED → COMPLETED)

**Flow:**
1. Vercel Cron monitors CTB file (every 5 min)
2. Detect change: `Time Delta` or `Status` column updated
3. Format update: "【일정 앞당김】[TaskName] → New ETA: 15:30 ✅"
4. Post to Discord #진행중 channel
5. Send Telegram DM to CEO

**CTB Update Format:**
```
【진행중】Asset Master API #3
├─ Current: 14:15 / Target: 14:45 (30분 소요)
├─ Time Delta: +20분 (예상보다 빠름)
└─ 웹개발자가 현재 구현 중... ⏳

【완료】Backup Phase 2 UI #5 ✅
├─ Actual: 165분 / Estimated: 180분 (15분 단축)
└─ 다음 작업 시작: CTB Adjustment Phase...
```

### Feature 4: Error Handling & Fallback
**Scenario 1: Discord API unavailable**
- Bot fails to post message
- Fallback: Send to Telegram only
- Log: `discord_sync_log` with status=FALLBACK

**Scenario 2: Duplicate message detection**
- Same message received twice
- Check: message_id + content hash
- Action: Skip + log

**Scenario 3: User not found**
- `/task @assign` → member doesn't exist
- Return: Discord embed error message
- Do NOT create task
- Fallback: Send help message with valid members list

---

## 📊 Databases

### Table 1: discord_sync_log
```sql
CREATE TABLE discord_sync_log (
  id SERIAL PRIMARY KEY,
  source_platform TEXT ('telegram' or 'discord'),
  source_msg_id BIGINT,
  target_platform TEXT,
  target_msg_id BIGINT,
  sync_status TEXT ('success' or 'fallback' or 'error'),
  error_msg TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  INDEX (source_msg_id),
  INDEX (created_at)
);
```

### Table 2: discord_messages
```sql
CREATE TABLE discord_messages (
  id SERIAL PRIMARY KEY,
  discord_msg_id BIGINT UNIQUE,
  user_id BIGINT,
  user_name TEXT,
  channel_id BIGINT,
  channel_name TEXT,
  content TEXT,
  is_command BOOLEAN,
  synced_to_telegram BOOLEAN DEFAULT FALSE,
  telegram_msg_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (discord_msg_id),
  INDEX (user_id)
);
```

### Table 3: discord_task_queue
```sql
CREATE TABLE discord_task_queue (
  id SERIAL PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  assigned_to TEXT,
  task_description TEXT,
  priority TEXT ('P0', 'P1', 'P2'),
  deadline TIMESTAMP,
  platform_origin TEXT ('discord' or 'telegram'),
  status TEXT ('pending', 'in_progress', 'completed'),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  INDEX (task_id),
  INDEX (assigned_to)
);
```

### Table 4: discord_notifications
```sql
CREATE TABLE discord_notifications (
  id SERIAL PRIMARY KEY,
  user_id BIGINT,
  notify_type TEXT ('task_assigned', 'ctb_update', 'blocker_alert'),
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  INDEX (user_id),
  INDEX (created_at)
);
```

---

## 🚀 Implementation Checklist (3 Days)

### Day 1: Core Bot Setup (8 hours)
- [ ] Discord Bot token 생성 + 권한 설정
- [ ] Intents 활성화 (MESSAGE_CONTENT, GUILD_MESSAGES, DIRECT_MESSAGES)
- [ ] 4개 채널 생성 (#공지사항, #진행중, #완료, #문제해결)
- [ ] bot.py 기본 구조 (on_ready, on_message event listeners)
- [ ] 4개 DB 테이블 생성 (migration SQL)
- [ ] config.py: Discord token, channel IDs, Telegram token 저장
- [ ] Test: "!ping" 명령어로 봇 응답 확인

### Day 2: Message Sync + Task Command (8 hours)
- [ ] message_handler.py: Telegram → Discord sync (simple text)
- [ ] task_handler.py: `/task @assign [member] [task]` 명령어 구현
- [ ] conflict_resolver.py: 중복 메시지 감지 (message ID + hash)
- [ ] DB 로깅: discord_sync_log에 모든 sync 기록
- [ ] Error handling: 실패 시 fallback to Telegram
- [ ] Test: 메시지 동기화 양방향 (5개 테스트 메시지)

### Day 3: CTB Sync + Deployment (8 hours)
- [ ] ctb_handler.py: active_work_tracking.md 모니터링
- [ ] Vercel Cron: 5분 간격 CTB 변화 감지
- [ ] Post to Discord: #진행중 채널에 실시간 업데이트
- [ ] Telegram DM: CEO에게 【일정 앞당김】 알림
- [ ] Integration test: CTB 상태 변화 → 양 플랫폼 업데이트 확인
- [ ] Deployment: Vercel 배포 + 모니터링
- [ ] Documentation: Discord Bot 운영 가이드

---

## 📈 Success Metrics

| 지표 | 목표 | 측정 방법 |
|-----|-----|---------|
| Message sync 신뢰도 | 99% | discord_sync_log 에러율 |
| Task 할당 지연 | <10초 | discord_task_queue 생성 → CTB 반영 |
| CTB 실시간성 | <5분 | change detected → Discord post 시간 |
| 중복 메시지 제거율 | 100% | duplicate detection accuracy |
| Bot 가용성 | 99.5% | uptime monitoring |

---

## 🔗 Dependencies
- Discord.py library
- Telegram Bot API (existing)
- Supabase (existing)
- Vercel Cron Functions (existing)
- Next.js API routes (existing)

---

## 📝 Notes
- **User context:** CEO가 Telegram 메인 채널, 팀원들이 Discord 자주 사용 → 양쪽 동기화 필수
- **Risk mitigation:** 중복 메시지 감지 시스템으로 spam 방지
- **Scalability:** 나중에 Slack, Teams 추가 가능하도록 설계
- **관계:** 이 Phase 1은 "양방향 동기화"만 포함. Phase 2 (고급기능: thread 동기화, emoji reactions)는 나중에
