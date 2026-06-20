# Memory Message Collection API — Phase 2A 설계 명세

**작성일:** 2026-06-20 KST  
**담당:** Web App Designer/Planner  
**대상:** Web Developer (구현 직전)  
**상태:** Ready for Development  

---

## 📋 목차

1. [개요](#개요)
2. [기능명세](#기능명세)
3. [화면 구성](#화면-구성)
4. [사용자 흐름](#사용자-흐름)
5. [API 명세](#api-명세)
6. [데이터 스키마](#데이터-스키마)
7. [인증 및 권한](#인증-및-권한)
8. [Rate Limiting & Quota](#rate-limiting--quota)
9. [의존성 및 통합](#의존성-및-통합)
10. [엣지 케이스](#엣지-케이스)
11. [배포 체크리스트](#배포-체크리스트)

---

## 개요

### 목적
Personal Memory System에서 Telegram, Discord, Email 등 외부 채널의 메시지를 수집하여, 중앙화된 메모리 지식베이스에 저장하고, 중복 제거, 신뢰도 점수 산정, 의미론적 검색에 활용하는 핵심 인프라.

### 스코프
- **수집 대상:** OpenClaw Gateway 세션 기록, 메모리 파일, Telegram/Discord 메시지 (향후)
- **수집 방식:** REST API (batch, streaming 미포함)
- **저장소:** File queue + Supabase Postgres (중복 제거 후)
- **처리 흐름:** Collection → Queue → Phase 2B (Deduplication) → Phase 2C (Trust Scoring) → Postgres
- **배포:** Node.js Express (port 3009), 24시간 운영, Cron 자동화

### 핵심 값
- **Context Preservation:** 메시지 원본 보존 + 메타데이터 (timestamp, author, role, tokens)
- **Reliability:** 3회 재시도, 지수 백오프, 에러 로깅, 경로 검증
- **Performance:** <2초 응답, 배치 처리 지원, 대량 메시지 (100+) 처리
- **Security:** Bearer token 인증, 경로 검증 (traversal 방지), 민감데이터 제외

---

## 기능명세

### Requirement List

| ID | 기능 | 우선순위 | 설명 |
|----|----|--------|------|
| **FUNC-1** | Message Collection from Gateway | P0 | OpenClaw Gateway 세션 기록 수집 (limit/offset 지원) |
| **FUNC-2** | Memory File Collection | P0 | 로컬 파일 기반 메모리 읽기 (checksum + 라인 제한) |
| **FUNC-3** | Batch Collection | P1 | 단일 요청으로 다중 소스 수집 (메시지+메모리 혼합) |
| **FUNC-4** | Message Tagging | P1 | 수집 후 메시지에 태그 추가 (type, source, priority) |
| **FUNC-5** | Tag-based Retrieval | P1 | 저장된 메시지 태그 기반 조회 |
| **FUNC-6** | Analytics Dashboard | P2 | 수집 통계 (count, sources, errors), uptime |
| **FUNC-7** | Queue Management | P0 | 수집한 메시지 큐에 저장, 처리 상태 추적 |
| **FUNC-8** | Error Logging & Alerting | P0 | 에러 기록 (파일 롤테이션), Telegram/Discord 알림 |

---

## 화면 구성

### 1. Admin Dashboard (`/admin/messages`)

**목적:** 메시지 수집 현황 및 통계 모니터링

**주요 컴포넌트:**
- **수집 요약 (Summary Card)**
  - 총 메시지 수 (today, this week, all-time)
  - 소스별 분포 (Gateway / File / Telegram / Discord / Email)
  - 마지막 수집 시간 및 다음 예정 시간
  
- **소스 상태 (Source Health)**
  - 각 소스별 성공/실패 비율
  - 마지막 오류 및 재시도 상태
  - 가용성 %

- **메시지 목록 (Message List)**
  - 최근 100개 메시지
  - 필터: 소스, 날짜 범위, 태그, role(user/assistant)
  - 정렬: timestamp desc (기본)
  - 검색: content 또는 author

- **큐 상태 (Queue Status)**
  - 대기 중인 메시지 수
  - Processing phase (Phase 2B, 2C) 상태
  - Failed items 재시도 버튼

### 2. API 상태 페이지 (`/admin/api-status`)

**주요 컴포넌트:**
- Uptime 그래프 (24h)
- 응답 시간 분포 (avg/p95/p99)
- Endpoint별 call count
- Rate limit 상태

### 3. Telegram/Discord 채널 연동 (향후)

**UI 필요 사항:**
- 채널 등록 폼 (webhook URL, token)
- 채널 활성화/비활성화 토글
- 메시지 수집 규칙 설정 (필터링, tagging)

---

## 사용자 흐름

### Flow 1: Admin이 메시지 수동 수집 시작

```
1. Admin이 대시보드 → "Collect Now" 클릭
2. 백엔드: POST /api/batch-collect 실행
   - 모든 등록된 소스(Gateway, 메모리 파일)에서 수집
3. 시스템: 메시지 포맷 + 체크섬 계산 → 큐에 저장
4. Front: 실시간 진행 상황 (수집 수, 소스별 상태) 표시
5. 완료 후: 요약 (수집 수, 오류, 처리 시간) 표시
   - 예: "2,500 messages collected in 15s. 3 errors (retry queued)."
```

### Flow 2: Cron Job이 자동으로 정기 수집 (4시간 간격)

```
1. Cron trigger (00:00, 06:00, 12:00, 18:00 KST)
2. 백엔드: /api/batch-collect 자동 실행
3. 메시지 수집 → 큐 저장
4. Phase 2B Cron (2, 6, 10, 14, 18, 22시) → 중복 제거
5. Phase 2C Cron (매시) → 신뢰도 점수 산정
6. Telegram @memory_automation_bot으로 완료 알림
   - "Collected: 500 messages | Deduped: 200 | Score: pending"
```

### Flow 3: 개발자가 Message Tagging API 사용

```
1. DEV 요청: POST /api/tag-messages
   - messageIds: [msg-1, msg-2, ...]
   - tags: { type: "action", priority: "high", source: "telegram" }
2. 백엔드: 메시지에 태그 추가 (메모리 파일 또는 DB)
3. 응답: { success: true, tagged: 2, timestamp: "..." }
4. 이후: 태그 기반 검색 /api/search-by-tag?tag=action&value=high
```

---

## API 명세

### 기본 정보
- **Base URL:** `http://localhost:3009` (개발) / `https://memory-api.dsc-fms-portal.app` (프로덕션)
- **인증:** Bearer Token (Authorization 헤더)
- **응답 형식:** JSON
- **타임존:** UTC (저장), 표시는 Asia/Seoul (KST)
- **응답 코드:** 표준 HTTP (200, 400, 403, 404, 500)

---

### Endpoint 1: Health Check

**용도:** 서버 가용성 확인 (모니터링, 배포 검증)

```http
GET /health
```

**요청:** 없음

**응답 (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2026-06-20T10:30:45.123Z",
  "uptime": 86400,
  "version": "1.0.0"
}
```

**에러 (503 Service Unavailable):**
```json
{
  "status": "degraded",
  "reason": "Queue processing paused",
  "timestamp": "2026-06-20T10:30:45.123Z"
}
```

---

### Endpoint 2: Collect Messages from Gateway

**용도:** OpenClaw Gateway 세션 기록 수집 (주기적 또는 수동)

```http
POST /api/collect-messages
Authorization: Bearer {GATEWAY_TOKEN}
Content-Type: application/json
```

**요청 본문:**
```json
{
  "sessionKey": "session-abc123def456",
  "limit": 100,
  "offset": 0,
  "includeTools": true,
  "tags": {
    "source": "gateway",
    "context": "incident-investigation"
  }
}
```

**요청 필드:**
| 필드 | 타입 | 필수 | 기본값 | 설명 |
|-----|-----|-----|-------|------|
| `sessionKey` | string | ✅ | - | OpenClaw 세션 ID |
| `limit` | integer | ❌ | 100 | 한 번에 가져올 메시지 수 (max: 1000) |
| `offset` | integer | ❌ | 0 | 시작 위치 (pagination) |
| `includeTools` | boolean | ❌ | true | tool_calls 필드 포함 여부 |
| `tags` | object | ❌ | {} | 메시지에 첨부할 메타데이터 |

**응답 (200 OK):**
```json
{
  "success": true,
  "count": 50,
  "enqueued": 50,
  "messages": [
    {
      "messageId": "msg-uuid-1",
      "timestamp": "2026-06-20T10:15:30.000Z",
      "author": "user@example.com",
      "role": "user",
      "content": "What's the status of db/30 migration?",
      "toolCalls": [
        {
          "toolId": "sql-executor",
          "params": { "query": "SELECT * FROM migrations" }
        }
      ],
      "tokens": 145,
      "source": "gateway",
      "sessionKey": "session-abc123def456"
    },
    {
      "messageId": "msg-uuid-2",
      "timestamp": "2026-06-20T10:16:15.000Z",
      "author": "claude-assistant",
      "role": "assistant",
      "content": "The migration has 3 remaining steps. ETA: 4 hours.",
      "toolCalls": [],
      "tokens": 32,
      "source": "gateway",
      "sessionKey": "session-abc123def456"
    }
  ],
  "collectedAt": "2026-06-20T10:30:45.123Z",
  "processingTime": 245
}
```

**응답 필드:**
| 필드 | 타입 | 설명 |
|-----|-----|------|
| `success` | boolean | 수집 성공 여부 |
| `count` | integer | 수집한 메시지 수 |
| `enqueued` | integer | 큐에 저장된 메시지 수 |
| `messages` | array | 메시지 배열 |
| `messages[].messageId` | string | 고유 메시지 ID (UUID 권장) |
| `messages[].timestamp` | string | ISO 8601 형식 |
| `messages[].author` | string | 발신자 이메일 또는 닉네임 |
| `messages[].role` | enum | "user" 또는 "assistant" |
| `messages[].content` | string | 메시지 본문 (최대 100KB) |
| `messages[].toolCalls` | array | Tool 호출 기록 (선택) |
| `messages[].tokens` | integer | 추정 토큰 수 |
| `collectedAt` | string | 수집 완료 시간 (ISO 8601) |
| `processingTime` | integer | 처리 시간 (ms) |

**에러 응답:**

**400 Bad Request** - 필수 필드 누락
```json
{
  "error": "sessionKey is required",
  "code": "MISSING_SESSION_KEY",
  "timestamp": "2026-06-20T10:30:45.123Z"
}
```

**401 Unauthorized** - 인증 실패
```json
{
  "error": "Invalid or expired token",
  "code": "INVALID_TOKEN",
  "timestamp": "2026-06-20T10:30:45.123Z"
}
```

**503 Service Unavailable** - Gateway 연결 실패 (3회 재시도 후)
```json
{
  "error": "Failed to connect to upstream Gateway (3 retries exhausted)",
  "code": "GATEWAY_UNAVAILABLE",
  "timestamp": "2026-06-20T10:30:45.123Z",
  "retryAfter": 30
}
```

**성능 특성:**
- 응답 시간: <2초 (100 messages)
- 타임아웃: 30초 (upstream I/O)
- 재시도: 3회, exponential backoff (1s → 2s → 4s)

---

### Endpoint 3: Collect Memory Files

**용도:** 로컬 메모리 파일(마크다운) 수집

```http
POST /api/collect-memory
Authorization: Bearer {GATEWAY_TOKEN}
Content-Type: application/json
```

**요청 본문:**
```json
{
  "path": "MEMORY.md",
  "lines": 100,
  "tags": {
    "type": "memory-index",
    "frequency": "daily"
  }
}
```

**요청 필드:**
| 필드 | 타입 | 필수 | 기본값 | 설명 |
|-----|-----|-----|-------|------|
| `path` | string | ✅ | - | 상대 경로 (MEMORY_DIR 내) |
| `lines` | integer | ❌ | 50 | 처음 N줄만 읽기 |
| `tags` | object | ❌ | {} | 메타데이터 |

**응답 (200 OK):**
```json
{
  "success": true,
  "filename": "MEMORY.md",
  "contentLength": 45230,
  "lineCount": 1250,
  "truncatedLines": 100,
  "content": "# 메모리 인덱스\n\n## 🔑 핵심 규칙...",
  "checksum": "a1b2c3d4e5f6g7h8",
  "lastModified": "2026-06-20T09:45:00.000Z",
  "collectedAt": "2026-06-20T10:30:45.123Z",
  "source": "automated_collection",
  "timestamp": 1718881445123
}
```

**응답 필드:**
| 필드 | 타입 | 설명 |
|-----|-----|------|
| `filename` | string | 파일명 |
| `contentLength` | integer | 전체 파일 크기 (바이트) |
| `lineCount` | integer | 전체 줄 수 |
| `truncatedLines` | integer | 실제 읽은 줄 수 |
| `content` | string | 파일 내용 (요청한 줄까지) |
| `checksum` | string | MD5 해시 (중복 감지용) |
| `lastModified` | string | 파일 수정 시간 (ISO 8601) |
| `collectedAt` | string | 수집 시간 (ISO 8601) |

**에러 응답:**

**404 Not Found** - 파일 없음
```json
{
  "error": "File not found: MEMORY.md",
  "code": "FILE_NOT_FOUND",
  "timestamp": "2026-06-20T10:30:45.123Z"
}
```

**403 Forbidden** - 경로 검증 실패 (directory traversal 시도)
```json
{
  "error": "Path validation failed: ../etc/passwd",
  "code": "INVALID_PATH",
  "timestamp": "2026-06-20T10:30:45.123Z"
}
```

---

### Endpoint 4: Batch Collect (Multiple Sources)

**용도:** 단일 요청으로 메시지 + 메모리 파일 동시 수집

```http
POST /api/batch-collect
Authorization: Bearer {GATEWAY_TOKEN}
Content-Type: application/json
```

**요청 본문:**
```json
{
  "items": [
    {
      "type": "message",
      "params": {
        "sessionKey": "session-abc123",
        "limit": 100,
        "includeTools": true
      }
    },
    {
      "type": "memory",
      "params": {
        "path": "MEMORY.md",
        "lines": 50
      }
    },
    {
      "type": "memory",
      "params": {
        "path": "org_status_20260620.md",
        "lines": 100
      }
    }
  ],
  "options": {
    "parallel": true,
    "timeout": 30000,
    "continueOnError": true
  }
}
```

**요청 필드:**
| 필드 | 타입 | 설명 |
|-----|-----|------|
| `items` | array | 수집 항목 배열 |
| `items[].type` | enum | "message" 또는 "memory" |
| `items[].params` | object | 각 타입별 파라미터 |
| `options.parallel` | boolean | 병렬 처리 여부 (기본: true) |
| `options.timeout` | integer | 총 타임아웃 (ms, 기본: 30000) |
| `options.continueOnError` | boolean | 한 항목 실패 시 계속 진행 여부 |

**응답 (200 OK):**
```json
{
  "success": true,
  "results": [
    {
      "type": "message",
      "success": true,
      "count": 75,
      "enqueued": 75,
      "timestamp": "2026-06-20T10:30:45.123Z",
      "processingTime": 245,
      "messages": [...]
    },
    {
      "type": "memory",
      "success": true,
      "filename": "MEMORY.md",
      "checksum": "a1b2c3d4e5f6",
      "timestamp": "2026-06-20T10:30:46.234Z",
      "processingTime": 156
    },
    {
      "type": "memory",
      "success": true,
      "filename": "org_status_20260620.md",
      "checksum": "g7h8i9j0k1l2",
      "timestamp": "2026-06-20T10:30:47.345Z",
      "processingTime": 123
    }
  ],
  "errors": [],
  "totalCount": 75,
  "totalEnqueued": 75,
  "totalTime": 524
}
```

**부분 실패 응답 (200 OK, continueOnError=true):**
```json
{
  "success": false,
  "results": [
    { "type": "message", "success": true, ... },
    { "type": "memory", "success": false, "error": "File not found", ... }
  ],
  "errors": [
    {
      "index": 1,
      "type": "memory",
      "error": "File not found: non-existent.md",
      "code": "FILE_NOT_FOUND"
    }
  ],
  "totalCount": 75,
  "totalEnqueued": 75,
  "totalTime": 524
}
```

**성능 특성:**
- 병렬 처리: 여러 항목을 동시에 처리 (I/O 지연 최소화)
- 응답 시간: <3초 (3 items)
- 타임아웃: 30초 (항목당 10초 기본)

---

### Endpoint 5: Tag Messages (향후)

**용도:** 수집한 메시지에 태그 추가 (검색/필터링용)

```http
POST /api/tag-messages
Authorization: Bearer {GATEWAY_TOKEN}
Content-Type: application/json
```

**요청 본문:**
```json
{
  "messageIds": ["msg-uuid-1", "msg-uuid-2", "msg-uuid-3"],
  "tags": {
    "type": "incident",
    "priority": "critical",
    "service": "gateway",
    "region": "asia-seoul"
  },
  "action": "add"
}
```

**요청 필드:**
| 필드 | 타입 | 필수 | 설명 |
|-----|-----|-----|------|
| `messageIds` | array | ✅ | 메시지 UUID 배열 |
| `tags` | object | ✅ | 태그 key-value |
| `action` | enum | ❌ | "add" (기본), "remove", "replace" |

**응답 (200 OK):**
```json
{
  "success": true,
  "tagged": 3,
  "failed": 0,
  "timestamp": "2026-06-20T10:30:45.123Z",
  "details": [
    {
      "messageId": "msg-uuid-1",
      "success": true,
      "tags": {
        "type": "incident",
        "priority": "critical",
        "service": "gateway",
        "region": "asia-seoul"
      }
    }
  ]
}
```

---

### Endpoint 6: Search by Tag (향후)

**용도:** 태그 기반 메시지 검색

```http
GET /api/search-by-tag?tag=type&value=incident&limit=50
Authorization: Bearer {GATEWAY_TOKEN}
```

**요청 파라미터:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|-----|-----|-------|------|
| `tag` | string | ✅ | - | 태그 키 |
| `value` | string | ✅ | - | 태그 값 |
| `limit` | integer | ❌ | 50 | 반환 결과 수 |
| `offset` | integer | ❌ | 0 | 시작 위치 |
| `sortBy` | enum | ❌ | "timestamp" | "timestamp" / "relevance" |
| `order` | enum | ❌ | "desc" | "asc" / "desc" |

**응답 (200 OK):**
```json
{
  "success": true,
  "query": {
    "tag": "type",
    "value": "incident"
  },
  "total": 125,
  "count": 50,
  "offset": 0,
  "messages": [
    {
      "messageId": "msg-uuid-1",
      "timestamp": "2026-06-20T10:15:30.000Z",
      "author": "user@example.com",
      "role": "user",
      "content": "What's happening with the database migration?",
      "tags": {
        "type": "incident",
        "priority": "critical",
        "service": "database"
      }
    }
  ],
  "timestamp": "2026-06-20T10:30:45.123Z"
}
```

---

### Endpoint 7: Get API Status / Analytics

**용도:** 수집 통계, 성능 메트릭, 시스템 상태

```http
GET /api/status
Authorization: Bearer {GATEWAY_TOKEN}
```

**응답 (200 OK):**
```json
{
  "timestamp": "2026-06-20T10:30:45.123Z",
  "uptime": 345600,
  "status": "healthy",
  "server": {
    "messagesCollected": 45230,
    "memoryFilesRead": 156,
    "batchOperations": 892,
    "totalItemsEnqueued": 48256,
    "errorCount": 23,
    "lastCollectionTime": "2026-06-20T10:25:30.000Z",
    "lastErrorTime": "2026-06-20T10:20:15.000Z"
  },
  "performance": {
    "avgResponseTime": 345,
    "p95ResponseTime": 1245,
    "p99ResponseTime": 2100,
    "totalRequests": 12450
  },
  "queue": {
    "pending": 145,
    "processing": 12,
    "failed": 3,
    "succeeded": 48256
  },
  "sources": {
    "gateway": {
      "count": 40000,
      "lastCollection": "2026-06-20T10:25:30.000Z",
      "successRate": 0.998,
      "avgItemsPerCollection": 125
    },
    "memory_files": {
      "count": 5230,
      "lastCollection": "2026-06-20T10:25:30.000Z",
      "successRate": 1.0,
      "uniqueChecksums": 4856
    }
  },
  "errors": {
    "last24h": 23,
    "byType": {
      "GATEWAY_UNAVAILABLE": 15,
      "FILE_NOT_FOUND": 5,
      "INVALID_TOKEN": 2,
      "OTHER": 1
    }
  }
}
```

---

### Endpoint 8: Cron Trigger (Manual Execution)

**용도:** Cron job을 수동으로 실행 (디버깅, 응급 복구)

```http
POST /api/cron/trigger
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

**요청 본문:**
```json
{
  "jobId": "phase-2a-message-collection",
  "force": false,
  "notify": true
}
```

**응답 (200 OK):**
```json
{
  "success": true,
  "jobId": "phase-2a-message-collection",
  "status": "executing",
  "startTime": "2026-06-20T10:30:45.123Z",
  "estimatedDuration": 30000,
  "resultUrl": "/api/cron/result/{executionId}"
}
```

---

## 데이터 스키마

### 1. Message Schema (메모리 내 + Postgres)

**파일 저장 위치:**
```
/home/jeepney/.openclaw/workspace-dev/memory-automation/
├── queue/                    # 처리 전 메시지 큐
│   ├── message-{uuid}.json
│   └── memory-{uuid}.json
├── logs/                     # 에러 로그
│   └── phase2a-errors.log
└── data/                     # (향후) 처리 완료 메시지
```

**메시지 구조:**
```typescript
interface Message {
  // 핵심 필드
  messageId: string;           // UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
  timestamp: ISO8601;          // "2026-06-20T10:15:30.123Z"
  author: string;              // "user@example.com" 또는 nickname
  role: "user" | "assistant";  // 역할
  content: string;             // 메시지 본문 (최대 100KB)
  
  // 메타데이터
  tokens: integer;             // 추정 토큰 수
  source: "gateway" | "telegram" | "discord" | "email" | "file";
  sessionKey?: string;         // (Gateway 전용) 세션 ID
  
  // Tool 호출 기록 (선택)
  toolCalls?: {
    toolId: string;
    params: object;
    result?: string;
  }[];
  
  // 태그 (Phase 2A 수집 시 포함 가능)
  tags?: {
    [key: string]: string;
  };
  
  // 처리 상태 (Phase 2B/2C 사용)
  status?: "pending" | "deduped" | "scored" | "indexed";
  duplicateOf?: string;        // (중복) 원본 messageId
  trustScore?: number;         // (0.0-1.0, Phase 2C 계산)
}
```

**저장 형식 (JSON Lines):**
```
{"messageId":"msg-1","timestamp":"2026-06-20T10:15:30Z",...}
{"messageId":"msg-2","timestamp":"2026-06-20T10:16:00Z",...}
```

### 2. Memory File Schema

**구조:**
```typescript
interface MemoryFile {
  filename: string;            // "MEMORY.md"
  contentLength: integer;      // 전체 파일 크기
  lineCount: integer;          // 전체 줄 수
  truncatedLines: integer;     // 수집한 줄 수
  content: string;             // 파일 내용
  checksum: string;            // MD5 해시
  lastModified: ISO8601;       // 원본 파일 수정 시간
  collectedAt: ISO8601;        // 수집 시간
  source: "automated_collection";
  frequency: integer;          // (향후) 수집 빈도
}
```

### 3. Queue Item Schema

**파일 저장:**
```json
{
  "queueId": "queue-{uuid}",
  "type": "message" | "memory",
  "data": { ... },
  "enqueuedAt": "2026-06-20T10:30:45.123Z",
  "source": "session" | "file",
  "status": "pending" | "processing" | "completed" | "failed",
  "retryCount": 0,
  "nextRetryTime": null
}
```

### 4. Supabase Postgres Schema (향후)

```sql
-- 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  author TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens INTEGER,
  source TEXT NOT NULL,
  session_key TEXT,
  tool_calls JSONB,
  tags JSONB,
  status TEXT DEFAULT 'pending',
  duplicate_of UUID REFERENCES messages(id),
  trust_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_source (source),
  INDEX idx_status (status),
  FULLTEXT INDEX idx_content (content)
);

-- 메모리 파일 테이블
CREATE TABLE memory_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  checksum TEXT UNIQUE NOT NULL,
  content_length INTEGER,
  line_count INTEGER,
  collected_at TIMESTAMPTZ NOT NULL,
  last_modified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  INDEX idx_filename (filename),
  INDEX idx_collected_at (collected_at DESC)
);

-- 처리 통계 테이블
CREATE TABLE collection_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_date DATE NOT NULL,
  source TEXT NOT NULL,
  collected_count INTEGER,
  error_count INTEGER,
  avg_response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (collection_date, source)
);
```

---

## 인증 및 권한

### 인증 방식: Bearer Token

**구현:**
```
Authorization: Bearer {TOKEN}
```

**토큰 발급:**
- 환경변수: `GATEWAY_TOKEN` (서버 시작 시 로드)
- 유효기간: 무제한 (환경변수 갱신 필요)
- 검증: 모든 엔드포인트에서 필수 (health/status 제외, 선택)

**헤더 검증 로직:**
```javascript
app.use((req, res, next) => {
  // /health는 인증 불필요
  if (req.path === '/health') return next();
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
      code: 'MISSING_AUTH',
      timestamp: new Date().toISOString()
    });
  }
  
  const token = authHeader.slice(7);
  if (token !== GATEWAY_TOKEN) {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});
```

### 권한 모델 (향후)

**Roles:**
- **Public:** health check만 가능
- **Collector:** message/memory 수집 (POST /api/collect-*)
- **Admin:** 위 + 태깅, 수동 cron 실행, 상태 조회

**권한 검증:**
```javascript
function requireRole(role) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'public';
    if (userRole !== role && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: role
      });
    }
    next();
  };
}

app.post('/api/tag-messages', requireRole('admin'), (...) => {...});
```

---

## Rate Limiting & Quota

### 정책

**기본 제한:**
| 엔드포인트 | 제한 | 시간 | 단위 |
|----------|------|------|------|
| `/api/collect-messages` | 100 | 1분 | 요청 |
| `/api/collect-memory` | 200 | 1분 | 요청 |
| `/api/batch-collect` | 50 | 1분 | 요청 |
| `/api/search-by-tag` | 1000 | 1분 | 요청 |
| 모든 엔드포인트 (합계) | 2000 | 1시간 | 메시지 item |

**Cron job 예외:** rate limit 적용 안 함 (내부 호출)

### 구현: Token Bucket Algorithm

```javascript
const RateLimiter = require('limiter').RateLimiter;

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute'
});

app.post('/api/collect-messages', async (req, res) => {
  const remaining = await limiter.removeTokens(1);
  if (remaining < 0) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMITED',
      retryAfter: 60,
      timestamp: new Date().toISOString()
    });
  }
  // 처리 계속
});
```

**응답 헤더:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1718881500
```

---

## 의존성 및 통합

### 1. 업스트림 의존성

**OpenClaw Gateway**
- **URL:** `http://localhost:3000` (개발) 또는 env `GATEWAY_URL`
- **엔드포인트:** `/mcp/sessions_history`
- **인증:** Bearer token (`GATEWAY_TOKEN`)
- **역할:** 세션 메시지 기록 제공
- **실패 대응:** 3회 재시도, exponential backoff
- **모니터링:** 응답 시간, 503 에러 카운트

**네트워크:**
- **프로토콜:** HTTP/1.1 (HTTP/2 선택)
- **타임아웃:** 30초 (연결), 60초 (읽기)
- **DNS:** localhost 또는 네트워크 IP

### 2. 다운스트림 의존성

**Phase 2B: Duplicate Detection**
- **입력:** `/memory-automation/queue/` 의 메시지 JSON
- **처리:** 3회/일 (02:00, 06:00, 10:00, 14:00, 18:00, 22:00 KST)
- **출력:** 중복 메시지에 `duplicateOf` 필드 추가

**Phase 2C: Trust Score Calculator**
- **입력:** Phase 2B 완료 메시지
- **처리:** 매시간 (00:00-23:00 KST)
- **출력:** `trustScore` (0.0-1.0) 계산

**Supabase Postgres** (향후)
- **용도:** 메시지 장기 저장, FULLTEXT 검색
- **테이블:** `messages`, `memory_files`, `collection_stats`
- **연결:** `SUPABASE_URL` + `SUPABASE_KEY` (env)

### 3. 알림 채널

**Telegram (@memory_automation_bot)**
- **목적:** Cron 완료/실패 알림
- **메시지:** "Phase 2A collected 500 messages at 2026-06-20 06:00 KST"
- **실패:** "Phase 2A failed: GATEWAY_UNAVAILABLE (retry at 12:00)"

**Discord (향후)**
- **채널:** #memory-automation
- **메시지 형식:** 상동

---

## 엣지 케이스

### Case 1: 메시지 없음

**시나리오:** `sessionKey`가 유효하지만 메시지 기록 없음

**동작:**
```json
{
  "success": true,
  "count": 0,
  "enqueued": 0,
  "messages": [],
  "collectedAt": "2026-06-20T10:30:45.123Z",
  "processingTime": 45
}
```

### Case 2: 파일 크기 초과

**시나리오:** 메모리 파일이 100MB 초과

**동작:**
- `lines` 파라미터로 자동 제한 (처음 50줄만)
- 경고 로그: "File truncated to 50 lines (original: 50000 lines)"

### Case 3: 중복 메시지

**시나리오:** 동일한 messageId가 여러 번 수집됨

**동작:**
- Phase 2A: 중복 감지 안 함 (모두 큐에 저장)
- Phase 2B: 체크섬 또는 콘텐츠 기반 중복 감지 → `duplicateOf` 마킹

### Case 4: 토큰 만료 / 게이트웨이 다운

**시나리오:** GATEWAY_TOKEN 유효하지 않거나 Gateway 응답 없음

**동작:**
- 재시도 3회 (1s, 2s, 4s 대기)
- 최종 실패 시:
```json
{
  "error": "Failed to connect to Gateway after 3 retries",
  "code": "GATEWAY_UNAVAILABLE",
  "timestamp": "2026-06-20T10:30:45.123Z",
  "retryAfter": 300,
  "suggestion": "Check GATEWAY_URL and GATEWAY_TOKEN"
}
```

### Case 5: 메모리 부족 (대량 메시지)

**시나리오:** 10,000+ 메시지 한 번에 수집 요청

**동작:**
- 청크 처리: 1000개씩 나누어 처리
- 응답 크기 제한: 최대 10MB JSON
- 클라이언트에게 조언: "Use offset-based pagination (limit ≤ 1000)"

### Case 6: 경로 검증 실패

**시나리오:** `../../../etc/passwd` 같은 악의적 경로

**동작:**
```javascript
const resolvedPath = path.resolve(MEMORY_DIR, filePath);
if (!resolvedPath.startsWith(MEMORY_DIR)) {
  // Reject: 403 Forbidden
}
```

### Case 7: 부분 배치 실패

**시나리오:** Batch collect에서 2개 항목 중 1개 실패

**동작:** `continueOnError=true` 시
```json
{
  "success": false,  // 전체 상태
  "results": [
    { "success": true, ... },
    { "success": false, "error": "File not found", ... }
  ],
  "errors": [
    { "index": 1, "type": "memory", "error": "..." }
  ]
}
```

### Case 8: 동시성 문제

**시나리오:** 여러 Cron job이 동시에 메시지 수집

**동작:**
- 큐 파일명에 UUID 포함 → 파일명 충돌 없음
- FileQueue 구현: atomic write (fd.writeFile + rename)
- 경합 조건 방지: QUEUE_DIR 락 파일 (선택)

---

## 배포 체크리스트

### Pre-Deployment (Development)

- [ ] 환경변수 설정 (.env)
  - [ ] GATEWAY_URL = "http://localhost:3000"
  - [ ] GATEWAY_TOKEN = (발급받은 토큰)
  - [ ] MEMORY_DIR = "/home/jeepney/.claude/projects/.../memory"
  - [ ] PORT = 3009 (또는 원하는 포트)

- [ ] 의존성 설치
  ```bash
  cd memory-automation
  npm install
  ```

- [ ] 디렉토리 생성
  ```bash
  mkdir -p logs queue data
  chmod 755 logs queue data
  ```

- [ ] 환경 테스트
  ```bash
  npm test
  ```

- [ ] Gateway 연결 확인
  ```bash
  curl -H "Authorization: Bearer $GATEWAY_TOKEN" \
    http://localhost:3000/health
  ```

### Deployment (Production)

- [ ] Docker 이미지 빌드
  ```bash
  docker build -t memory-collection-api:1.0.0 .
  ```

- [ ] Vercel / Railway 배포
  - [ ] 환경변수 추가 (시크릿으로 토큰 보호)
  - [ ] PORT 설정 (기본 3009)
  - [ ] Health check 설정 (/health)

- [ ] Cron 등록 (OpenClaw Gateway)
  - [ ] Job ID: phase-2a-message-collection
  - [ ] Schedule: 0 0,6,12,18 * * * (UTC) = 00:00, 06:00, 12:00, 18:00 KST
  - [ ] Script: /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-cron.sh

- [ ] 모니터링 설정
  - [ ] Sentry (에러 추적)
  - [ ] Datadog / New Relic (성능)
  - [ ] Telegram 알림 (Cron 완료/실패)

- [ ] 보안 검토
  - [ ] GATEWAY_TOKEN 로테이션 정책 수립
  - [ ] 경로 검증 테스트 (directory traversal)
  - [ ] Rate limit 값 조정

### Post-Deployment (Validation)

- [ ] 첫 Cron 실행 확인 (2026-06-20 12:00 KST)
  ```bash
  tail -f logs/phase2a-*.log
  ```

- [ ] 메시지 수집 결과 검증
  - [ ] 큐 파일 생성: `ls queue/ | wc -l`
  - [ ] 에러 로그 확인: `cat logs/phase2a-errors.log`

- [ ] Phase 2B 자동 실행 확인 (2026-06-20 14:00 KST)

- [ ] Telegram 알림 확인 (@memory_automation_bot)

---

## 구현 우선순위

### Phase 2A-1 (Core APIs) — 필수
- [x] Health check
- [x] Collect messages (+ retry logic)
- [x] Collect memory files
- [x] Batch collect
- [x] Error logging
- [x] Queue integration

### Phase 2A-2 (Analytics) — 권장
- [ ] GET /api/status (통계)
- [ ] Message tag schema
- [ ] Admin dashboard (UI)

### Phase 2A-3 (Advanced) — 선택
- [ ] POST /api/tag-messages
- [ ] GET /api/search-by-tag
- [ ] Telegram/Discord 입수
- [ ] Supabase 연동

---

## 관련 문서

- **Phase 2B (Duplicate Detection):** `/memory-automation/PHASE2B_COMPLETE_DESIGN.md`
- **Phase 2C (Trust Scoring):** `/memory-automation/PHASE2C_SPEC.md`
- **Cron 설계:** `/memory-automation/CRON_DESIGN_SPEC.md`
- **현재 구현:** `/memory-automation/phase2a-message-collection.js`

---

## 변경 기록

| 날짜 | 변경사항 | 담당자 |
|-----|--------|-------|
| 2026-06-20 | 초안 작성 (API 명세 + 데이터 스키마) | Web Designer |
| (예정) | 개발자 리뷰 및 수정 | Web Developer |
| (예정) | Supabase 스키마 추가 | Database Engineer |

---

**문서 상태:** Ready for Developer Review  
**마지막 업데이트:** 2026-06-20 11:45 KST  
**유지보수:** Web App Designer / Platform Team
