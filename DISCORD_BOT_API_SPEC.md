# Discord Bot API 명세서

**작성일:** 2026-05-15 23:00 KST  
**버전:** 1.0 Final  
**상태:** 구현 준비 완료

---

## 1. API 엔드포인트 목록

### 1.1 Gateway Endpoint (Discord Integration)

#### POST /api/discord-gateway
**목적:** Discord Bot 상호작용 처리 (Interactions Endpoint)

**요청:**
```http
POST /api/discord-gateway HTTP/1.1
Host: fms-portal.vercel.app
Content-Type: application/json
X-Signature-Ed25519: <ed25519-signature>
X-Signature-Timestamp: <unix-timestamp>

{
  "type": 1,
  "data": {
    "id": "message-id",
    "channel_id": "channel-id",
    "author": {
      "id": "user-id",
      "username": "user-name",
      "avatar": "avatar-hash"
    },
    "content": "user message content",
    "timestamp": "2026-05-15T22:45:30.123Z",
    "edited_timestamp": null,
    "mention_everyone": false,
    "mentions": [],
    "embeds": []
  },
  "member": {
    "nick": "nickname",
    "roles": ["role-id-1", "role-id-2"],
    "user": {
      "id": "user-id",
      "username": "user-name",
      "avatar": "avatar-hash"
    }
  }
}
```

**응답 (Pong):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "type": 1
}
```

**응답 (Deferred Message Update):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "type": 5
}
```

**에러 응답:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid signature"
}
```

**레이트 제한:** 50 requests/second (Global Discord API limit)

---

### 1.2 Secretary Processor Endpoint

#### POST /api/discord/processors/secretary
**목적:** 비서 에이전트 처리 (메시지 라우팅)

**요청:**
```typescript
{
  "messageId": "msg-123",
  "channelId": "secretary-channel-id",
  "userId": "user-id",
  "username": "user-name",
  "content": "팀 일정 알려줘",
  "timestamp": "2026-05-15T22:45:30.123Z"
}
```

**응답 (성공):**
```typescript
{
  "success": true,
  "embed": {
    "title": "📋 팀 일정",
    "description": "다음은 이번주 팀 일정입니다:",
    "fields": [
      {
        "name": "월요일",
        "value": "09:00 - 생산 회의",
        "inline": false
      },
      {
        "name": "화요일",
        "value": "14:00 - 기술 검토",
        "inline": false
      }
    ],
    "color": 0x4A90E2,
    "timestamp": "2026-05-15T22:45:30.123Z"
  },
  "telegramSync": {
    "threadId": "msg#XXXX",
    "synced": true
  },
  "processingTime": 1250
}
```

**응답 (에러):**
```typescript
{
  "success": false,
  "error": "Failed to fetch schedule data",
  "errorCode": "FETCH_ERROR",
  "embed": {
    "title": "⚠️ 오류 발생",
    "description": "일정 정보를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.",
    "color": 0xFF0000
  }
}
```

**타임아웃:** 5초 (이후 폴백 응답)  
**재시도:** 최대 3회 (지수 백오프)

---

### 1.3 Translator Processor Endpoint

#### POST /api/discord/processors/translator
**목적:** 번역 요청 처리

**요청:**
```typescript
{
  "messageId": "msg-456",
  "channelId": "translator-channel-id",
  "userId": "user-id",
  "username": "user-name",
  "content": "Please translate this Korean text",
  "languageDirection": "EN→KO",
  "timestamp": "2026-05-15T22:45:30.123Z"
}
```

**응답 (성공):**
```typescript
{
  "success": true,
  "embed": {
    "title": "🌐 번역 결과",
    "description": "이 한국어 텍스트를 번역해주세요",
    "fields": [
      {
        "name": "원본",
        "value": "Please translate this Korean text",
        "inline": false
      },
      {
        "name": "방향",
        "value": "EN→KO",
        "inline": true
      },
      {
        "name": "신뢰도",
        "value": "95%",
        "inline": true
      }
    ],
    "color": 0x7ED321
  },
  "processingTime": 2340
}
```

**지원 방향:** KO→EN, EN→KO, KO↔EN  
**타임아웃:** 8초 (번역이 더 오래 걸릴 수 있음)

---

### 1.4 Data Analyst Processor Endpoint

#### POST /api/discord/processors/analyst
**목적:** 데이터 분석 요청 처리

**요청:**
```typescript
{
  "messageId": "msg-789",
  "channelId": "analyst-channel-id",
  "userId": "user-id",
  "username": "user-name",
  "intent": "analyze",
  "fileReference": "uploaded-file-id",
  "analysisType": "kpi | trend | anomaly",
  "parameters": {
    "dateRange": "2026-05-01 to 2026-05-15",
    "metrics": ["production_rate", "downtime"]
  },
  "timestamp": "2026-05-15T22:45:30.123Z"
}
```

**응답 (성공):**
```typescript
{
  "success": true,
  "embed": {
    "title": "📊 데이터 분석 결과",
    "description": "2026-05-01 ~ 2026-05-15 기간 분석",
    "fields": [
      {
        "name": "생산 효율률",
        "value": "✅ 92.5% (전월대비 +2.1%)",
        "inline": true
      },
      {
        "name": "다운타임",
        "value": "⚠️ 8.2시간 (전월 평균 6.5시간)",
        "inline": true
      },
      {
        "name": "주요 이슈",
        "value": "금요일 오전 설비 고장으로 1.5시간 손실",
        "inline": false
      }
    ],
    "color": 0x4A90E2
  },
  "chartData": {
    "type": "line",
    "dataUrl": "https://..."  // Chart.js embedded image
  },
  "processingTime": 3450
}
```

**지원 분석 유형:**
- `kpi` — KPI 요약
- `trend` — 추세 분석
- `anomaly` — 이상 탐지
- `comparison` — 전월/전년 비교

**타임아웃:** 10초 (복잡한 분석 가능)

---

### 1.5 Developer Processor Endpoint

#### POST /api/discord/processors/developer
**목적:** 개발 이슈 및 코드 리뷰 처리

**요청:**
```typescript
{
  "messageId": "msg-012",
  "channelId": "developer-channel-id",
  "userId": "user-id",
  "username": "user-name",
  "intent": "bug_report | feature_request | code_review",
  "content": "Login page not responding on mobile",
  "issueDetails": {
    "severity": "high | medium | low",
    "affectedComponent": "pages/auth/login",
    "reproductionSteps": ["1. Open on mobile", "2. Enter credentials"]
  },
  "timestamp": "2026-05-15T22:45:30.123Z"
}
```

**응답 (성공):**
```typescript
{
  "success": true,
  "embed": {
    "title": "🐛 이슈 등록 완료",
    "description": "Login 페이지 모바일 응답 오류",
    "fields": [
      {
        "name": "심각도",
        "value": "🔴 높음",
        "inline": true
      },
      {
        "name": "상태",
        "value": "🟡 In Progress",
        "inline": true
      },
      {
        "name": "담당자",
        "value": "web-builder",
        "inline": true
      },
      {
        "name": "예상 완료",
        "value": "2026-05-17 09:00 KST",
        "inline": true
      }
    ],
    "color": 0xFF6B6B
  },
  "taskId": "TASK-2026-051-001",
  "processingTime": 1800
}
```

---

### 1.6 Planner Processor Endpoint

#### POST /api/discord/processors/planner
**목적:** 설계 및 아키텍처 검토

**요청:**
```typescript
{
  "messageId": "msg-345",
  "channelId": "planner-channel-id",
  "userId": "user-id",
  "username": "user-name",
  "intent": "design_review | architecture_analysis | scope_definition",
  "content": "Need to design new backup feature",
  "scope": "Full backup system with incremental support",
  "timeline": "2026-05-16 to 2026-06-03",
  "timestamp": "2026-05-15T22:45:30.123Z"
}
```

**응답 (성공):**
```typescript
{
  "success": true,
  "embed": {
    "title": "📐 설계 분석 완료",
    "description": "백업 시스템 상세 설계 문서",
    "fields": [
      {
        "name": "범위",
        "value": "Full Backup + Incremental Support",
        "inline": false
      },
      {
        "name": "예상 기간",
        "value": "3주 (2026-05-16 ~ 2026-06-03)",
        "inline": false
      },
      {
        "name": "주요 산출물",
        "value": "• DESIGN.md\n• API_SPEC.md\n• DB_MIGRATION.sql",
        "inline": false
      }
    ],
    "color": 0x7ED321
  },
  "documentUrl": "https://github.com/.../BACKUP_APP_PHASE2_DESIGN.md",
  "processingTime": 5000
}
```

---

## 2. Telegram Sync API

### 2.1 Telegram Webhook Endpoint

#### POST /api/telegram/webhook
**목적:** Telegram 메시지 수신 및 Discord 동기화

**요청:**
```typescript
{
  "update_id": 123456789,
  "message": {
    "message_id": 987,
    "date": 1715800530,
    "chat": {
      "id": -1001234567890,
      "title": "DSC Mannur Team"
    },
    "text": "Team schedule updated",
    "from": {
      "id": 123,
      "is_bot": false,
      "first_name": "Kyeongtae"
    },
    "reply_to_message": {
      "message_id": 950
    }
  }
}
```

**응답:**
```typescript
{
  "success": true,
  "discordMessageId": "discord-msg-id",
  "synced": true,
  "timestamp": "2026-05-15T23:00:00.000Z"
}
```

---

## 3. 메시지 큐 및 비동기 처리

### 3.1 Message Queue API

#### GET /api/discord/queue/status
**목적:** 메시지 큐 상태 조회

**응답:**
```typescript
{
  "queueSize": 5,
  "processing": {
    "messageId": "msg-123",
    "processor": "secretary",
    "startedAt": "2026-05-15T23:05:15.000Z",
    "estimatedCompletionMs": 2500
  },
  "pending": [
    {
      "messageId": "msg-124",
      "processor": "translator",
      "enqueuedAt": "2026-05-15T23:05:20.000Z"
    }
  ],
  "rateLimitStatus": {
    "requestsThisSecond": 2,
    "maxRequestsPerSecond": 5,
    "headroomPercent": 60
  }
}
```

---

## 4. 에러 코드 및 대응

### 4.1 HTTP 상태 코드

| 코드 | 의미 | 대응 |
|------|------|------|
| **200** | 성공 | 응답 처리 |
| **400** | 잘못된 요청 | 요청 형식 검증 |
| **401** | 인증 실패 | 서명 검증 실패 |
| **403** | 권한 거부 | 봇 권한 부족 |
| **429** | 레이트 제한 | 지수 백오프 재시도 |
| **500** | 서버 오류 | 로그 기록, 폴백 응답 |
| **502** | 게이트웨이 오류 | 자동 재시도 |
| **503** | 서비스 불가 | 재시도 예약 |

### 4.2 비즈니스 에러 코드

```typescript
export enum DiscordBotErrorCode {
  // Auth Errors
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  
  // Processing Errors
  AGENT_TIMEOUT = 'AGENT_TIMEOUT',
  AGENT_ERROR = 'AGENT_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  
  // API Errors
  DISCORD_API_ERROR = 'DISCORD_API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN_CHANNEL = 'UNKNOWN_CHANNEL',
  
  // Sync Errors
  TELEGRAM_SYNC_ERROR = 'TELEGRAM_SYNC_ERROR',
  MESSAGE_SYNC_TIMEOUT = 'MESSAGE_SYNC_TIMEOUT',
  
  // Queue Errors
  QUEUE_FULL = 'QUEUE_FULL',
  QUEUE_TIMEOUT = 'QUEUE_TIMEOUT'
}
```

---

## 5. 데이터 모델

### 5.1 Discord 메시지 모델

```typescript
export interface DiscordMessageModel {
  id: string                    // Discord message ID
  channelId: string            // Channel ID
  guildId: string              // Guild/Server ID
  userId: string               // Author user ID
  username: string             // Author username
  content: string              // Message content
  timestamp: Date              // Message timestamp
  editedTimestamp: Date | null // Last edited timestamp
  
  // Processing metadata
  processorType: 'secretary' | 'translator' | 'analyst' | 'developer' | 'planner'
  intent: string               // Detected intent
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  processingTime: number       // milliseconds
  
  // Response
  responseMessageId: string | null
  responseEmbedData: DiscordEmbed | null
  
  // Telegram sync
  telegramThreadId: string | null
  telegramMessageId: number | null
  syncStatus: 'pending' | 'synced' | 'failed' | 'none'
  syncTimestamp: Date | null
}
```

### 5.2 Processor 응답 모델

```typescript
export interface ProcessorResponse {
  success: boolean
  embed: DiscordEmbed
  
  // Optional fields per processor
  telegramSync?: {
    threadId: string
    synced: boolean
    syncError?: string
  }
  
  chartData?: {
    type: 'line' | 'bar' | 'pie'
    dataUrl: string
  }
  
  taskId?: string  // For developer processor
  documentUrl?: string  // For planner processor
  
  // Metadata
  processingTime: number  // milliseconds
  agentVersion: string
  timestamp: Date
  
  // Error info
  error?: string
  errorCode?: DiscordBotErrorCode
  retryable?: boolean
}
```

---

## 6. 인증 및 보안

### 6.1 Discord 서명 검증

**Header 구성:**
```
X-Signature-Ed25519: <64-byte hex-encoded ed25519 signature>
X-Signature-Timestamp: <unix timestamp in seconds>
```

**검증 로직:**
```typescript
// 1. Timestamp 검증 (5분 이내)
const messageTimestamp = parseInt(timestamp)
const now = Math.floor(Date.now() / 1000)
if (Math.abs(now - messageTimestamp) > 300) {
  reject('Invalid timestamp')
}

// 2. Signature 검증 (tweetnacl.js)
const message = timestamp + body
const isValid = nacl.sign.detached.verify(
  Buffer.from(message),
  Buffer.from(signature, 'hex'),
  Buffer.from(PUBLIC_KEY, 'hex')
)

if (!isValid) {
  reject('Invalid signature')
}
```

### 6.2 토큰 검증

```typescript
export async function validateBotToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { 'Authorization': `Bot ${token}` }
    })
    return response.status === 200
  } catch {
    return false
  }
}
```

---

## 7. Rate Limiting

### 7.1 적용되는 제한

| 대상 | 제한 | 대응 |
|------|------|------|
| Discord API Global | 50 req/sec | 큐잉 |
| Per-Channel | 5 req/5sec | 큐잉 |
| Message Queue | 100 pending | 거부 (QUEUE_FULL) |
| Agent Timeout | 5-10 sec | 폴백 응답 |

### 7.2 Rate Limit Response

```typescript
export interface RateLimitResponse {
  error: string
  code: 'RATE_LIMIT'
  retryAfter: number  // seconds
  
  // For user info
  currentUsage: {
    requestsThisSecond: number
    maxRequestsPerSecond: number
    percentUsed: number
  }
}
```

---

## 8. 모니터링 및 메트릭

### 8.1 메트릭 엔드포인트

#### GET /api/discord/metrics
**목적:** 실시간 메트릭 조회

**응답:**
```typescript
{
  "timestamp": "2026-05-15T23:10:00.000Z",
  "uptime": 3600,  // seconds
  
  "messageMetrics": {
    "totalProcessed": 256,
    "successCount": 248,
    "errorCount": 8,
    "successRate": 96.875,
    "avgProcessingTimeMs": 1850
  },
  
  "processorMetrics": {
    "secretary": {
      "processed": 78,
      "avgTimeMs": 1200,
      "errorRate": 1.28
    },
    "translator": {
      "processed": 42,
      "avgTimeMs": 2450,
      "errorRate": 2.38
    },
    "analyst": {
      "processed": 56,
      "avgTimeMs": 3100,
      "errorRate": 3.57
    },
    "developer": {
      "processed": 48,
      "avgTimeMs": 1650,
      "errorRate": 0
    },
    "planner": {
      "processed": 32,
      "avgTimeMs": 5200,
      "errorRate": 0
    }
  },
  
  "telegramMetrics": {
    "syncAttempts": 78,
    "syncSuccessful": 76,
    "syncFailure": 2,
    "successRate": 97.44
  },
  
  "queueMetrics": {
    "avgQueueSize": 2.5,
    "maxQueueSize": 12,
    "currentQueueSize": 3,
    "totalDropped": 0
  },
  
  "errorDistribution": {
    "AGENT_TIMEOUT": 4,
    "PARSE_ERROR": 2,
    "TELEGRAM_SYNC_ERROR": 2
  }
}
```

---

## 9. 통합 테스트 시나리오

### 9.1 종단 간 테스트 (Happy Path)

```typescript
describe('Discord Bot E2E Test', () => {
  test('User sends message → Bot processes → Response sent', async () => {
    // 1. User sends message to #비서-secretary
    const userMessage = {
      type: InteractionType.MESSAGE_CREATE,
      data: {
        content: '팀 일정 알려줘',
        channel_id: CHANNEL_ID_SECRETARY,
        author: { username: 'test-user' }
      }
    }
    
    // 2. Send to gateway
    const response = await fetch('/api/discord-gateway', {
      method: 'POST',
      body: JSON.stringify(userMessage),
      headers: {
        'X-Signature-Ed25519': signature,
        'X-Signature-Timestamp': timestamp
      }
    })
    
    // 3. Verify gateway accepts
    expect(response.status).toBe(200)
    
    // 4. Wait for message processing
    await sleep(2000)
    
    // 5. Verify response posted to Discord
    const messages = await fetchChannelMessages(CHANNEL_ID_SECRETARY)
    const lastMessage = messages[0]
    
    expect(lastMessage.embeds).toBeDefined()
    expect(lastMessage.embeds[0].title).toContain('팀')
  })
})
```

---

## 10. 문제 해결 가이드

### 10.1 일반적인 문제

| 문제 | 원인 | 해결책 |
|------|------|--------|
| Bot이 메시지를 수신하지 못함 | Message Content Intent 미설정 | Discord Developer Portal에서 Intent 활성화 |
| "Invalid signature" 에러 | 서명 검증 실패 | 공개키, 타임스탬프, 바디 순서 확인 |
| Telegram 동기화 실패 | 토큰 만료, 스레드 ID 오류 | 환경 변수 갱신, 스레드 ID 확인 |
| 응답이 매우 느림 | 메시지 큐 적체 | 큐 상태 모니터링, 에이전트 응답 시간 최적화 |
| Discord API 오류 (429) | 레이트 제한 초과 | 큐 크기 축소, 재시도 대기 시간 증가 |

---

## 11. 배포 체크리스트

- [ ] 모든 환경 변수 설정
- [ ] Discord 서명 검증 코드 테스트
- [ ] 각 processor별 단위 테스트 통과
- [ ] 통합 테스트 (종단 간) 통과
- [ ] Rate limiting 테스트 통과
- [ ] Telegram sync 양방향 테스트
- [ ] Error handling 및 fallback 검증
- [ ] 모니터링 대시보드 설정
- [ ] 로깅 시스템 준비
- [ ] Discord 권한 설정 (메시지 읽기, 작성, 임베드)

---

## 12. 참고 자료

- Discord API Docs: https://discord.com/developers/docs/interactions/receiving-and-responding
- Discord.py: https://discordpy.readthedocs.io
- tweetnacl.js: https://tweetnacl.js.org
- System Architecture: DISCORD_BOT_ARCHITECTURE_DESIGN.md
- Implementation Checklist: DISCORD_BOT_IMPL_CHECKLIST.md
