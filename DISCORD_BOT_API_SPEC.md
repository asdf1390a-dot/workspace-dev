---
name: Discord Bot Phase 1 API 명세서
description: Telegram ↔ Discord 양방향 동기화 + CTB 실시간 업데이트 — 14개 엔드포인트 완전 명세
type: api-spec
date: 2026-05-19
version: 2.0
status: 설계 완료 → 웹개발자 구현 대기
supersedes: v1.0 (2026-05-15)
---

# Discord Bot Phase 1 — API 명세서

**버전:** 2.0 (Phase 1 Option B 기준으로 전면 재작성)
**기준일:** 2026-05-19
**Base URL:** `https://[project].vercel.app/api/discord`
**인증:** 모든 Discord 수신 엔드포인트는 Ed25519 서명 검증 필수
**콘텐츠 타입:** `application/json`

---

## 엔드포인트 목록

| # | Method | Path | 역할 |
|---|--------|------|------|
| 1 | POST | `/api/discord/webhook` | Discord 메시지 수신 + 동기화 큐 등록 |
| 2 | POST | `/api/discord/task` | 작업 지시 처리 (`/task @assign`) |
| 3 | POST | `/api/discord/ctb-update` | CTB 상태 변화 → Discord 포스팅 |
| 4 | GET | `/api/discord/status` | 동기화 현황 조회 |
| 5 | POST | `/api/discord/sync/telegram-to-discord` | Telegram → Discord 단방향 동기화 |
| 6 | POST | `/api/discord/sync/discord-to-telegram` | Discord → Telegram 단방향 동기화 |
| 7 | GET | `/api/discord/sync/log` | 동기화 이력 조회 |
| 8 | DELETE | `/api/discord/sync/log` | 동기화 로그 정리 (30일 초과 삭제) |
| 9 | GET | `/api/discord/tasks` | 작업 목록 조회 |
| 10 | PATCH | `/api/discord/tasks/:id` | 작업 상태 업데이트 |
| 11 | GET | `/api/discord/channels` | 연결된 채널 목록 조회 |
| 12 | GET | `/api/discord/notifications` | 알림 이력 조회 |
| 13 | PATCH | `/api/discord/notifications/:id/read` | 알림 읽음 처리 |
| 14 | POST | `/api/discord/test-connection` | 연결 상태 점검 (헬스체크) |

---

## 상세 명세

---

### 1. POST `/api/discord/webhook`

**목적:** Discord Bot이 수신한 메시지를 검증 후 동기화 큐에 등록한다.
**호출자:** Discord (Bot message_create event → Next.js)
**인증:** Ed25519 서명 검증 (X-Signature-Ed25519, X-Signature-Timestamp)

**요청 헤더:**
```
X-Signature-Ed25519: <hex-signature>
X-Signature-Timestamp: <unix-timestamp>
Content-Type: application/json
```

**요청 바디:**
```json
{
  "type": 1,
  "data": {
    "id": "1234567890123456789",
    "channel_id": "9876543210987654321",
    "author": {
      "id": "1111111111111111111",
      "username": "web-developer",
      "bot": false
    },
    "content": "구현 완료, PR 올림",
    "timestamp": "2026-05-24T09:30:00.000Z"
  }
}
```

**응답 — 성공 (200):**
```json
{
  "success": true,
  "queued": true,
  "sync_log_id": 4821,
  "direction": "discord-to-telegram"
}
```

**응답 — PING 요청 (200):**
```json
{
  "type": 1
}
```

**응답 — 서명 검증 실패 (401):**
```json
{
  "success": false,
  "error": "Invalid signature",
  "code": "INVALID_SIGNATURE"
}
```

**응답 — 중복 메시지 (200):**
```json
{
  "success": true,
  "queued": false,
  "reason": "duplicate",
  "sync_log_id": 4820
}
```

**에러 코드:**
| 코드 | HTTP | 설명 |
|-----|------|------|
| `INVALID_SIGNATURE` | 401 | Ed25519 서명 불일치 |
| `RATE_LIMITED` | 429 | 초당 요청 한도 초과 |
| `INVALID_PAYLOAD` | 400 | 필수 필드 누락 |
| `INTERNAL_ERROR` | 500 | 서버 처리 오류 |

---

### 2. POST `/api/discord/task`

**목적:** Discord에서 `/task @assign [member] [task]` 명령어 실행 시 DB에 작업 생성 + CTB 갱신 + Telegram 알림 발송.
**호출자:** Discord Bot (slash command handler)
**인증:** Bearer token (internal)

**요청 바디:**
```json
{
  "assigned_to": "웹개발자",
  "task_description": "Asset Master API #9 구현",
  "priority": "P1",
  "deadline": "2026-05-24T18:00:00.000Z",
  "platform_origin": "discord",
  "requested_by": "CEO",
  "channel_id": "1503332702085189673"
}
```

**필드 규칙:**
| 필드 | 타입 | 필수 | 제약 |
|-----|------|------|------|
| `assigned_to` | string | Y | 유효 팀원 목록 내 이름 |
| `task_description` | string | Y | 5~500자 |
| `priority` | string | N | `P0`/`P1`/`P2` (기본: P1) |
| `deadline` | ISO8601 | N | 미입력 시 당일 23:59 |
| `platform_origin` | string | Y | `discord` / `telegram` |

**유효 팀원 목록:** `["웹개발자", "플레너", "번역가", "데이터분석가", "평가자", "비서"]`

**응답 — 성공 (201):**
```json
{
  "success": true,
  "task_id": "f3e2a1b0-...",
  "queue_id": 127,
  "assigned_to": "웹개발자",
  "ctb_updated": true,
  "telegram_notified": true,
  "embed": {
    "title": "【새작업】Task Assigned",
    "description": "Asset Master API #9 구현",
    "fields": [
      { "name": "담당자", "value": "웹개발자", "inline": true },
      { "name": "우선순위", "value": "P1", "inline": true },
      { "name": "마감", "value": "2026-05-24 18:00", "inline": true }
    ],
    "color": 5763719
  }
}
```

**응답 — 잘못된 멤버명 (400):**
```json
{
  "success": false,
  "error": "존재하지 않는 팀원입니다: '프론트개발자'",
  "code": "INVALID_MEMBER",
  "valid_members": ["웹개발자", "플레너", "번역가", "데이터분석가", "평가자", "비서"]
}
```

---

### 3. POST `/api/discord/ctb-update`

**목적:** Vercel Cron이 5분마다 호출하여 CTB 상태 변화를 감지하고 Discord 채널에 포스팅한다.
**호출자:** Vercel Cron (`*/5 * * * *`)
**인증:** `Authorization: Bearer CRON_SECRET`

**요청 바디:**
```json
{
  "source": "vercel-cron",
  "triggered_at": "2026-05-24T09:35:00.000Z"
}
```

**응답 — 변화 있음 (200):**
```json
{
  "success": true,
  "changes_detected": 2,
  "posted": [
    {
      "task_name": "Asset Master API #8",
      "old_status": "PENDING",
      "new_status": "IN_PROGRESS",
      "discord_channel": "진행중",
      "discord_msg_id": "1234567890"
    },
    {
      "task_name": "Backup Phase 2 UI 평가",
      "old_status": "IN_PROGRESS",
      "new_status": "COMPLETED",
      "discord_channel": "완료",
      "discord_msg_id": "1234567891"
    }
  ],
  "telegram_notified": true
}
```

**응답 — 변화 없음 (200):**
```json
{
  "success": true,
  "changes_detected": 0,
  "posted": []
}
```

**Cron 설정 (`vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/discord/ctb-update",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

### 4. GET `/api/discord/status`

**목적:** 동기화 시스템 전반 상태 조회 (모니터링 대시보드용).
**호출자:** 내부 모니터링 / 수동 확인
**인증:** Bearer token (internal)

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|------|------|
| `window` | string | `24h` | 집계 기간 (`1h`/`24h`/`7d`) |

**응답 (200):**
```json
{
  "status": "healthy",
  "last_sync_at": "2026-05-24T09:33:52.000Z",
  "metrics": {
    "window": "24h",
    "total_synced": 142,
    "success": 139,
    "fallback": 2,
    "error": 1,
    "duplicate": 8,
    "error_rate_pct": 0.7
  },
  "queue": {
    "depth": 0,
    "oldest_pending_sec": null
  },
  "platforms": {
    "discord": "online",
    "telegram": "online"
  },
  "ctb_last_polled": "2026-05-24T09:30:00.000Z"
}
```

---

### 5. POST `/api/discord/sync/telegram-to-discord`

**목적:** Telegram 수신 메시지를 Discord 지정 채널로 동기화한다.
**호출자:** `telegram_bridge.py` (Python 서비스 내부)

**요청 바디:**
```json
{
  "telegram_msg_id": 1994,
  "from_user": "나경태",
  "content": "Asset Master API #8 오늘 완료 목표",
  "timestamp": "2026-05-24T09:00:00.000Z",
  "target_discord_channel": "announcements"
}
```

**응답 — 성공 (200):**
```json
{
  "success": true,
  "discord_msg_id": "1234567890123456789",
  "channel": "공지사항",
  "sync_log_id": 5001
}
```

---

### 6. POST `/api/discord/sync/discord-to-telegram`

**목적:** Discord 채널 메시지를 Telegram CEO DM으로 동기화한다.
**호출자:** Discord Bot `message_handler.py`

**요청 바디:**
```json
{
  "discord_msg_id": "1234567890123456789",
  "channel_name": "팀논의",
  "from_user": "웹개발자",
  "content": "PR #42 올렸습니다. 검토 부탁드립니다.",
  "timestamp": "2026-05-24T09:45:00.000Z"
}
```

**응답 — 성공 (200):**
```json
{
  "success": true,
  "telegram_msg_id": 1995,
  "sync_log_id": 5002
}
```

**응답 — 폴백 발동 (200):**
```json
{
  "success": true,
  "fallback": true,
  "reason": "Discord API timeout",
  "telegram_notified": true,
  "sync_log_id": 5003
}
```

---

### 7. GET `/api/discord/sync/log`

**목적:** 동기화 이력 조회 (디버깅, 감사).
**호출자:** 내부 모니터링

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|------|------|
| `status` | string | — | `success`/`fallback`/`error`/`duplicate` 필터 |
| `platform` | string | — | `telegram`/`discord` 필터 |
| `from` | ISO8601 | 24h 전 | 시작 시간 |
| `to` | ISO8601 | 현재 | 종료 시간 |
| `limit` | int | 50 | 최대 반환 건수 (max: 200) |
| `offset` | int | 0 | 페이지네이션 |

**응답 (200):**
```json
{
  "total": 142,
  "limit": 50,
  "offset": 0,
  "items": [
    {
      "id": 5003,
      "source_platform": "discord",
      "source_msg_id": 1234567890123456789,
      "target_platform": "telegram",
      "target_msg_id": 1995,
      "sync_status": "success",
      "created_at": "2026-05-24T09:45:01.000Z",
      "synced_at": "2026-05-24T09:45:03.000Z"
    }
  ]
}
```

---

### 8. DELETE `/api/discord/sync/log`

**목적:** 30일 초과 동기화 로그 자동 정리.
**호출자:** Vercel Cron (매일 02:00 KST)
**인증:** `Authorization: Bearer CRON_SECRET`

**요청 바디:**
```json
{
  "older_than_days": 30
}
```

**응답 (200):**
```json
{
  "success": true,
  "deleted_count": 2841,
  "cutoff_date": "2026-04-24T00:00:00.000Z"
}
```

---

### 9. GET `/api/discord/tasks`

**목적:** `discord_task_queue` 작업 목록 조회.

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|------|------|
| `status` | string | — | `pending`/`in_progress`/`completed` |
| `assigned_to` | string | — | 팀원명 필터 |
| `limit` | int | 20 | 최대 반환 건수 |

**응답 (200):**
```json
{
  "total": 5,
  "items": [
    {
      "id": 127,
      "task_id": "f3e2a1b0-...",
      "assigned_to": "웹개발자",
      "task_description": "Asset Master API #9 구현",
      "priority": "P1",
      "deadline": "2026-05-24T18:00:00.000Z",
      "status": "in_progress",
      "platform_origin": "discord",
      "created_at": "2026-05-24T09:00:00.000Z"
    }
  ]
}
```

---

### 10. PATCH `/api/discord/tasks/:id`

**목적:** 작업 상태 업데이트 (완료 처리 등).

**URL 파라미터:** `:id` — `discord_task_queue.id`

**요청 바디:**
```json
{
  "status": "completed",
  "completed_at": "2026-05-24T16:45:00.000Z"
}
```

**응답 (200):**
```json
{
  "success": true,
  "task": {
    "id": 127,
    "status": "completed",
    "completed_at": "2026-05-24T16:45:00.000Z"
  },
  "discord_notified": true,
  "telegram_notified": true
}
```

---

### 11. GET `/api/discord/channels`

**목적:** 연결된 Discord 채널 목록 및 동기화 설정 조회.

**응답 (200):**
```json
{
  "guild_id": "...",
  "channels": [
    {
      "name": "공지사항",
      "channel_id": "...",
      "purpose": "announcements",
      "sync_from_telegram": true,
      "sync_to_telegram": false
    },
    {
      "name": "진행중",
      "channel_id": "...",
      "purpose": "ctb-inprogress",
      "sync_from_telegram": false,
      "sync_to_telegram": false
    },
    {
      "name": "완료",
      "channel_id": "...",
      "purpose": "ctb-completed",
      "sync_from_telegram": false,
      "sync_to_telegram": false
    },
    {
      "name": "문제해결",
      "channel_id": "...",
      "purpose": "blockers",
      "sync_from_telegram": false,
      "sync_to_telegram": true
    },
    {
      "name": "팀논의",
      "channel_id": "...",
      "purpose": "team-discussion",
      "sync_from_telegram": false,
      "sync_to_telegram": true
    }
  ]
}
```

---

### 12. GET `/api/discord/notifications`

**목적:** 알림 이력 조회 (읽지 않은 항목 포함).

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 |
|---------|------|------|
| `unread_only` | boolean | `false` |
| `limit` | int | 20 |

**응답 (200):**
```json
{
  "unread_count": 3,
  "items": [
    {
      "id": 88,
      "notify_type": "ctb_update",
      "content": "【완료】Backup Phase 2 UI 평가 — 평가자 완료",
      "platform": "both",
      "is_read": false,
      "created_at": "2026-05-24T14:10:00.000Z"
    }
  ]
}
```

---

### 13. PATCH `/api/discord/notifications/:id/read`

**목적:** 특정 알림을 읽음 처리한다.

**URL 파라미터:** `:id` — `discord_notifications.id`

**요청 바디:** 없음

**응답 (200):**
```json
{
  "success": true,
  "id": 88,
  "read_at": "2026-05-24T14:15:00.000Z"
}
```

---

### 14. POST `/api/discord/test-connection`

**목적:** Discord Bot + Telegram Bot 연결 상태를 점검한다. 배포 직후 또는 장애 의심 시 수동 실행.
**인증:** Bearer token (internal)

**요청 바디:**
```json
{
  "target": "both"
}
```

**응답 — 모두 정상 (200):**
```json
{
  "success": true,
  "discord": {
    "status": "online",
    "bot_name": "DSC-MANNUR-BOT",
    "latency_ms": 42
  },
  "telegram": {
    "status": "online",
    "bot_username": "@dsc_mannur_bot",
    "latency_ms": 88
  },
  "tested_at": "2026-05-24T09:00:00.000Z"
}
```

**응답 — Discord 오프라인 (200):**
```json
{
  "success": false,
  "discord": {
    "status": "offline",
    "error": "Connection refused"
  },
  "telegram": {
    "status": "online",
    "latency_ms": 91
  },
  "recommendation": "Discord API 장애 또는 토큰 만료 확인 필요"
}
```

---

## 공통 에러 응답 스키마

```json
{
  "success": false,
  "error": "에러 설명 (한국어)",
  "code": "ERROR_CODE",
  "timestamp": "2026-05-24T09:00:00.000Z"
}
```

| 에러 코드 | HTTP | 설명 |
|---------|------|------|
| `INVALID_SIGNATURE` | 401 | Discord Ed25519 서명 불일치 |
| `RATE_LIMITED` | 429 | 요청 한도 초과 (50 req/s) |
| `INVALID_PAYLOAD` | 400 | 필수 필드 누락 또는 형식 오류 |
| `INVALID_MEMBER` | 400 | 존재하지 않는 팀원명 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `DUPLICATE_MESSAGE` | 200 | 중복 메시지 (Skip 처리, 오류 아님) |
| `DISCORD_UNAVAILABLE` | 503 | Discord API 응답 없음 |
| `TELEGRAM_UNAVAILABLE` | 503 | Telegram API 응답 없음 |
| `INTERNAL_ERROR` | 500 | 서버 처리 오류 |

---

## 구현 주의사항

1. **Ed25519 검증:** `tweetnacl` (Node.js) 또는 `PyNaCl` (Python) 라이브러리 사용. Discord가 보낸 요청인지 반드시 확인.
2. **3초 제한:** Discord는 3초 이내 응답 요구. 처리 시간 초과 예상 시 `type: 5` (Deferred) 즉시 반환 후 Follow-up Message 사용.
3. **Deduplication 순서:** `conflict_resolver` 확인 → DB 기록 → 동기화 실행 순서 반드시 준수.
4. **Cron Secret:** `/api/discord/ctb-update`, `/api/discord/sync/log` (DELETE) 엔드포인트는 `CRON_SECRET` 환경 변수로 인증.
5. **Airtel 차단 우회:** Telegram Bot API는 Cloudflare WARP 상시 활성 상태에서만 정상 동작 (기존 설정 유지).
