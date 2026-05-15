# Discord Bot 아키텍처 설계 문서

**작성일:** 2026-05-15 22:45 KST  
**상태:** 플레너 설계 완료 → 웹개발자 구현 대기  
**완료 예상:** 2026-05-16 10:00~18:00 KST

---

## 1. 아키텍처 개요

### 1.1 시스템 다이어그램

```
┌──────────────────────────────────────────────────────────────────┐
│                    Discord DSC-MANNUR-AI Server                  │
│  ┌────────────────┬──────────────────┬──────────────────────┐    │
│  │ #비서-secretary│ #번역기-translator│ #데이터분석가-analyst│    │
│  ├────────────────┼──────────────────┼──────────────────────┤    │
│  │ #웹개발자-dev  │ #플레너-planner   │ #일반-general        │    │
│  └────────────────┴──────────────────┴──────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Discord Bot Token    │
                  │  (DISCORD_BOT_TOKEN)  │
                  └───────────┬───────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   pages/api/discord-gateway.ts          │
        │  (Discord Interactions Endpoint)        │
        │  ✓ Signature Verification               │
        │  ✓ Intent Dispatch                      │
        │  ✓ Message Content Intent Handling      │
        └─────────────┬───────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────────┐
        │   lib/discord/gateway.ts                │
        │  (Gateway Handler & Router)             │
        │  ✓ Channel Detection                    │
        │  ✓ Intent Classification                │
        │  ✓ Agent Assignment                     │
        │  ✓ Message Queue Management             │
        └─────────────┬───────────────────────────┘
                      │
      ┌───────────────┼───────────────┬─────────────┐
      │               │               │             │
      ▼               ▼               ▼             ▼
   Secretary      Translator       Analyst      Developer
   Processor      Processor        Processor     Processor
      │               │               │             │
      ├──────────────────────────────────────────────┤
      │  ✓ Process AI Agent Request                 │
      │  ✓ Format Response                          │
      │  ✓ Post to Discord Channel                  │
      │  ✓ Handle Errors & Retries                  │
      ├──────────────────────────────────────────────┤
      │
      ▼ (Secretary Only)
   Telegram Sync Layer
      │
      ├─ Mirror to msg#XXXX Thread
      └─ Real-time Updates
```

### 1.2 메시지 흐름

```
1. Discord User 메시지 입력
   → #비서-secretary: "팀 일정 알려줘"
   → Discord Bot 수신 (message_create event)

2. Gateway Handler (pages/api/discord-gateway.ts)
   ✓ Signature 검증 (X-Signature-Ed25519)
   ✓ Event 파싱 (message_create)
   ✓ Channel 식별 (#비서-secretary)
   ✓ Intent 인식 ("팀 일정")
   → Router로 전달

3. Channel Router (lib/discord/gateway.ts)
   ✓ Channel ID → AI Agent 매핑
   ✓ Message Content 검증
   ✓ Rate Limit 확인 (Discord API limits)
   ✓ Message Queue 추가
   → Processor 호출

4. Agent Processor (lib/discord/processors/secretary.ts)
   ✓ 요청 파싱 (Intent, Parameters)
   ✓ AI Agent 호출 (mcp__openclaw__message tool)
   ✓ Response 포맷팅
   ✓ 에러 처리 (재시도, Fallback)
   → Response 구성

5. Discord Response
   ✓ Embed 생성 (Color, Fields, Timestamp)
   ✓ Discord API로 메시지 전송
   ✓ Rate Limit 준수 (큐잉)
   → #비서-secretary에 응답 표시

6. Telegram Sync (Secretary Only)
   ✓ Response → Telegram msg#XXXX 스레드
   ✓ 양방향 동기화 유지
   ✓ Thread ID 추적
   → 완료
```

---

## 2. 구현 계층 (Implementation Layers)

### 2.1 API Layer: Discord Gateway Handler

**파일:** `pages/api/discord-gateway.ts`

**책임:**
- Discord Interaction Endpoint 제공
- Request 서명 검증 (X-Signature-Ed25519)
- Event 파싱 및 분류
- Gateway로 전달

**구현 요소:**

```typescript
// Signature Verification (Discord Security)
function verifySignature(
  publicKey: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  // Ed25519 검증 (tweetnacl.js)
}

// Event Handler
function handleInteraction(event: DiscordInteraction): void {
  switch(event.type) {
    case InteractionType.PING: // Discord 연결 확인
      return { type: InteractionResponseType.PONG }
    
    case InteractionType.MESSAGE_CREATE: // 메시지 수신
      await gateway.route(event)
      return { type: InteractionResponseType.DEFERRED_MESSAGE_UPDATE }
    
    case InteractionType.MESSAGE_UPDATE: // 메시지 수정
      await gateway.route(event)
      return { type: InteractionResponseType.DEFERRED_MESSAGE_UPDATE }
  }
}

// Main Handler
export async function POST(req: Request) {
  const signature = req.headers.get('x-signature-ed25519')
  const timestamp = req.headers.get('x-signature-timestamp')
  const body = await req.text()
  
  if (!verifySignature(BOT_PUBLIC_KEY, timestamp, body, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  const event = JSON.parse(body)
  const response = await handleInteraction(event)
  return new Response(JSON.stringify(response), { status: 200 })
}
```

### 2.2 Gateway Layer: Channel Router & Message Queue

**파일:** `lib/discord/gateway.ts`

**책임:**
- Channel ID → AI Agent 매핑
- Intent 분류
- Rate Limiting & Message Queue
- Error Handling

**구현 요소:**

```typescript
// Channel Configuration
const CHANNEL_CONFIG = {
  'CHANNEL_ID_SECRETARY': {
    name: '#비서-secretary',
    agent: 'secretary',
    processor: SecretaryProcessor,
    telegramSync: true,
    telegramThreadId: 'msg#XXXX'
  },
  'CHANNEL_ID_TRANSLATOR': {
    name: '#번역기-translator',
    agent: 'translator',
    processor: TranslatorProcessor,
    telegramSync: false
  },
  'CHANNEL_ID_ANALYST': {
    name: '#데이터분석가-analyst',
    agent: 'analyst',
    processor: AnalystProcessor,
    telegramSync: false
  },
  'CHANNEL_ID_DEVELOPER': {
    name: '#웹개발자-dev',
    agent: 'developer',
    processor: DeveloperProcessor,
    telegramSync: false
  },
  'CHANNEL_ID_PLANNER': {
    name: '#플레너-planner',
    agent: 'planner',
    processor: PlannerProcessor,
    telegramSync: false
  }
}

// Message Queue (for rate limiting)
class MessageQueue {
  private queue: DiscordMessage[] = []
  private processing = false
  private lastApiCall = 0
  private readonly RATE_LIMIT = 1000 / 5 // 5 requests/sec
  
  async enqueue(msg: DiscordMessage): Promise<void> {
    this.queue.push(msg)
    await this.process()
  }
  
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastCall = now - this.lastApiCall
      
      if (timeSinceLastCall < this.RATE_LIMIT) {
        await sleep(this.RATE_LIMIT - timeSinceLastCall)
      }
      
      const msg = this.queue.shift()!
      await this.processMessage(msg)
      this.lastApiCall = Date.now()
    }
    this.processing = false
  }
  
  private async processMessage(msg: DiscordMessage): Promise<void> {
    const config = CHANNEL_CONFIG[msg.channel_id]
    if (!config) {
      logger.warn(`Unknown channel: ${msg.channel_id}`)
      return
    }
    
    try {
      const processor = new config.processor()
      const response = await processor.process(msg)
      await this.postResponse(msg, response)
    } catch (error) {
      await this.handleError(msg, error)
    }
  }
  
  private async postResponse(
    originalMsg: DiscordMessage,
    response: DiscordEmbedResponse
  ): Promise<void> {
    const channel = CHANNEL_CONFIG[originalMsg.channel_id]
    
    // Discord API: Send message
    await fetch(`https://discord.com/api/v10/channels/${originalMsg.channel_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [response.embed],
        reply: { message_id: originalMsg.id }
      })
    })
    
    // Telegram Sync (if enabled)
    if (channel.telegramSync) {
      await this.syncToTelegram(channel, response)
    }
  }
  
  private async handleError(msg: DiscordMessage, error: Error): Promise<void> {
    logger.error(`Error processing message in ${msg.channel_id}:`, error)
    
    // Send error response to Discord
    const errorEmbed = {
      title: '❌ 처리 중 오류 발생',
      description: error.message,
      color: 0xFF0000,
      timestamp: new Date().toISOString()
    }
    
    await this.postResponse(msg, { embed: errorEmbed })
  }
}

// Main Gateway Router
export class DiscordGateway {
  private queue = new MessageQueue()
  
  async route(event: DiscordInteraction): Promise<void> {
    await this.queue.enqueue(event.data)
  }
}
```

### 2.3 Processor Layer: AI Agent Handlers

**파일:** `lib/discord/processors/base.ts` (Base Class)

**책임:**
- Message 파싱 및 검증
- AI Agent 호출
- Response 포맷팅
- Error Handling

**구현 요소:**

```typescript
// Base Processor Class
export abstract class BaseProcessor {
  abstract processMessage(msg: DiscordMessage): Promise<DiscordEmbedResponse>
  
  protected parseCommand(content: string): {
    command: string
    args: string[]
  } {
    const parts = content.trim().split(/\s+/)
    return {
      command: parts[0],
      args: parts.slice(1)
    }
  }
  
  protected createEmbed(
    title: string,
    description: string,
    fields?: Array<{ name: string; value: string; inline?: boolean }>,
    color = 0x2F3136
  ): DiscordEmbed {
    return {
      title,
      description,
      fields: fields || [],
      color,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'DSC Mannur AI Assistant'
      }
    }
  }
  
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (i < maxRetries - 1) {
          await sleep(delayMs * Math.pow(2, i))
        }
      }
    }
    
    throw lastError!
  }
}

// Secretary Processor
export class SecretaryProcessor extends BaseProcessor {
  async processMessage(msg: DiscordMessage): Promise<DiscordEmbedResponse> {
    try {
      const content = msg.content.trim()
      
      // Parse intent
      const intent = this.detectIntent(content)
      
      // Call AI Agent (via OpenClaw message tool)
      const response = await this.callAIAgent(intent, content)
      
      // Create Discord Embed
      const embed = this.createEmbed(
        '📋 비서 리포트',
        response.message,
        response.fields,
        0x4A90E2
      )
      
      return { embed }
    } catch (error) {
      throw new Error(`Secretary processing failed: ${error.message}`)
    }
  }
  
  private detectIntent(content: string): string {
    const keywords = {
      '일정': 'schedule',
      '팀': 'team',
      '상태': 'status',
      '보고': 'report'
    }
    
    for (const [keyword, intent] of Object.entries(keywords)) {
      if (content.includes(keyword)) return intent
    }
    
    return 'general'
  }
  
  private async callAIAgent(
    intent: string,
    content: string
  ): Promise<{ message: string; fields: any[] }> {
    // Call OpenClaw message tool to send to Telegram secretary
    // Then wait for response via Telegram API webhook
    
    return {
      message: '요청을 처리 중입니다.',
      fields: []
    }
  }
}

// Translator Processor
export class TranslatorProcessor extends BaseProcessor {
  async processMessage(msg: DiscordMessage): Promise<DiscordEmbedResponse> {
    const content = msg.content.trim()
    
    // Detect language direction (KO→EN or EN→KO)
    const direction = this.detectLanguageDirection(content)
    
    // Call translation agent
    const result = await this.translate(content, direction)
    
    const embed = this.createEmbed(
      '🌐 번역 결과',
      result.translated,
      [
        { name: '원본', value: content, inline: false },
        { name: '방향', value: direction, inline: true }
      ],
      0x7ED321
    )
    
    return { embed }
  }
  
  private detectLanguageDirection(text: string): string {
    const hasKorean = /[가-힯]/g.test(text)
    const hasEnglish = /[a-zA-Z]/g.test(text)
    
    if (hasKorean && !hasEnglish) return 'KO→EN'
    if (hasEnglish && !hasKorean) return 'EN→KO'
    return 'KO↔EN'
  }
  
  private async translate(text: string, direction: string): Promise<any> {
    // Call translator agent via OpenClaw message tool
    return { translated: '[번역 결과]' }
  }
}

// Similar structure for AnalystProcessor, DeveloperProcessor, PlannerProcessor
```

### 2.4 Telegram Sync Layer (Secretary Only)

**파일:** `lib/discord/telegram-sync.ts`

**책임:**
- Discord → Telegram 메시지 미러링
- Telegram → Discord 메시지 미러링
- Thread ID 추적 및 관리

**구현 요소:**

```typescript
export class TelegramSyncManager {
  private readonly TELEGRAM_THREAD_ID = 'msg#XXXX' // from memory
  
  async syncToTelegram(
    response: DiscordEmbedResponse,
    originalDiscordMsg: DiscordMessage
  ): Promise<void> {
    try {
      // Format Discord embed as Telegram message
      const telegramMessage = this.formatEmbedForTelegram(response.embed)
      
      // Send to Telegram msg#XXXX thread
      await this.postToTelegram(telegramMessage)
      
      // Log sync status
      logger.info(`[Sync] Discord #비서 → Telegram ${this.TELEGRAM_THREAD_ID}`)
    } catch (error) {
      logger.error(`Telegram sync failed:`, error)
      // Don't fail Discord response if Telegram sync fails
    }
  }
  
  async syncFromTelegram(telegramMessage: any): Promise<void> {
    try {
      // Convert Telegram message to Discord format
      const discordEmbed = this.formatTelegramMessageForDiscord(telegramMessage)
      
      // Post to Discord #비서 channel
      await fetch(
        `https://discord.com/api/v10/channels/${CHANNEL_ID_SECRETARY}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ embeds: [discordEmbed] })
        }
      )
      
      logger.info(`[Sync] Telegram ${this.TELEGRAM_THREAD_ID} → Discord #비서`)
    } catch (error) {
      logger.error(`Discord sync failed:`, error)
    }
  }
  
  private formatEmbedForTelegram(embed: DiscordEmbed): string {
    let text = `**${embed.title}**\n\n${embed.description}`
    
    if (embed.fields) {
      for (const field of embed.fields) {
        text += `\n\n**${field.name}**\n${field.value}`
      }
    }
    
    return text
  }
  
  private formatTelegramMessageForDiscord(msg: any): DiscordEmbed {
    return {
      title: '💬 Telegram 메시지',
      description: msg.text,
      color: 0x0088CC,
      timestamp: new Date().toISOString()
    }
  }
}
```

---

## 3. 환경 변수 및 설정

### 3.1 필수 환경 변수

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=<bot-token>
DISCORD_BOT_PUBLIC_KEY=<public-key>
DISCORD_GUILD_ID=<server-id>

# Discord Channel IDs
DISCORD_CHANNEL_SECRETARY=<channel-id>
DISCORD_CHANNEL_TRANSLATOR=<channel-id>
DISCORD_CHANNEL_ANALYST=<channel-id>
DISCORD_CHANNEL_DEVELOPER=<channel-id>
DISCORD_CHANNEL_PLANNER=<channel-id>
DISCORD_CHANNEL_GENERAL=<channel-id>

# Telegram Integration
TELEGRAM_THREAD_ID=msg#XXXX
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_CHAT_ID=<chat-id>

# OpenClaw Configuration
OPENCLAW_API_TOKEN=<api-token>
OPENCLAW_SESSION_ID=<session-id>

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### 3.2 환경 변수 검증

```typescript
export function validateEnvironment(): void {
  const required = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_BOT_PUBLIC_KEY',
    'DISCORD_GUILD_ID',
    'DISCORD_CHANNEL_SECRETARY',
    'DISCORD_CHANNEL_TRANSLATOR',
    'DISCORD_CHANNEL_ANALYST',
    'DISCORD_CHANNEL_DEVELOPER',
    'DISCORD_CHANNEL_PLANNER'
  ]
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }
  
  logger.info('✅ All environment variables validated')
}
```

---

## 4. 에러 처리 및 복구 전략

### 4.1 에러 분류 및 대응

| 에러 유형 | 원인 | 대응 | 재시도 |
|---------|------|------|--------|
| **Rate Limit** | Discord API 요청 초과 | 429 응답 파싱, 대기 시간 준수 | ✅ 지수 백오프 |
| **Invalid Token** | 봇 토큰 만료/손상 | 환경 변수 재로드 | ❌ 수동 조치 필요 |
| **Message Parse Error** | Discord event 파싱 실패 | 로그 기록, 오류 응답 | ❌ 메시지 스킵 |
| **Agent Timeout** | AI 에이전트 응답 지연 | 5초 타임아웃, 폴백 응답 | ✅ 3회 재시도 |
| **Discord API Error** | 일시적 API 장애 | 백그라운드 재시도 | ✅ 지수 백오프 |
| **Telegram Sync Error** | Telegram 연결 실패 | 로그 기록, Discord 응답 진행 | ✅ 비동기 재시도 |

### 4.2 Fallback 응답

```typescript
// 폴백 응답 (에이전트 응답 실패 시)
const FALLBACK_RESPONSES = {
  secretary: {
    title: '⚠️ 임시 응답',
    description: '비서 에이전트가 현재 이용 불가합니다. 잠시 후 다시 시도해주세요.',
    color: 0xFF9500
  },
  translator: {
    title: '⚠️ 번역 불가',
    description: '번역 서비스가 현재 이용 불가합니다.',
    color: 0xFF9500
  },
  analyst: {
    title: '⚠️ 분석 불가',
    description: '데이터 분석 서비스가 현재 이용 불가합니다.',
    color: 0xFF9500
  }
}
```

### 4.3 로깅 전략

```typescript
export class DiscordLogger {
  static logMessageReceived(msg: DiscordMessage): void {
    logger.info('[Discord.In]', {
      channel: msg.channel_id,
      author: msg.author.username,
      content: msg.content.slice(0, 100),
      timestamp: msg.timestamp
    })
  }
  
  static logProcessingStart(msg: DiscordMessage, agent: string): void {
    logger.info('[Processing.Start]', {
      agent,
      channel: msg.channel_id,
      messageId: msg.id
    })
  }
  
  static logProcessingComplete(msg: DiscordMessage, agent: string, duration: number): void {
    logger.info('[Processing.Complete]', {
      agent,
      channel: msg.channel_id,
      duration: `${duration}ms`
    })
  }
  
  static logError(channel: string, error: Error, context?: any): void {
    logger.error('[Error]', {
      channel,
      error: error.message,
      stack: error.stack,
      context
    })
  }
}
```

---

## 5. Rate Limiting 전략

### 5.1 Discord API 레이트 리밋

Discord API는 다음 레이트 리밋을 적용:
- **Global:** 50 requests/second
- **Per-Channel:** 5 requests/5 seconds

### 5.2 큐잉 구현

```typescript
export class RateLimitManager {
  private readonly MAX_REQUESTS_PER_SECOND = 5
  private readonly QUEUE_MAX_SIZE = 100
  
  private messageQueue: DiscordMessage[] = []
  private requestTimestamps: number[] = []
  
  async enqueue(msg: DiscordMessage): Promise<void> {
    if (this.messageQueue.length >= this.QUEUE_MAX_SIZE) {
      throw new Error('Message queue is full')
    }
    
    this.messageQueue.push(msg)
    await this.processQueue()
  }
  
  private async processQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const now = Date.now()
      
      // Remove timestamps older than 1 second
      this.requestTimestamps = this.requestTimestamps.filter(
        ts => now - ts < 1000
      )
      
      if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_SECOND) {
        // Wait before processing next message
        const oldestTimestamp = this.requestTimestamps[0]
        const waitTime = 1000 - (now - oldestTimestamp)
        await sleep(waitTime)
        continue
      }
      
      const msg = this.messageQueue.shift()!
      await this.processMessage(msg)
      this.requestTimestamps.push(Date.now())
    }
  }
  
  private async processMessage(msg: DiscordMessage): Promise<void> {
    // Process message
  }
}
```

---

## 6. 데이터 구조 (Type Definitions)

### 6.1 Discord Types

```typescript
// Discord Interaction Event
export interface DiscordInteraction {
  type: number
  data: DiscordMessage
  member: DiscordMember
}

// Discord Message
export interface DiscordMessage {
  id: string
  channel_id: string
  author: {
    id: string
    username: string
    avatar: string
  }
  content: string
  timestamp: string
  edited_timestamp: string | null
  mention_everyone: boolean
  mentions: any[]
  embeds: DiscordEmbed[]
}

// Discord Embed (Response Format)
export interface DiscordEmbed {
  title: string
  description: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  timestamp?: string
  footer?: {
    text: string
    icon_url?: string
  }
  thumbnail?: {
    url: string
  }
}

// Discord Embed Response
export interface DiscordEmbedResponse {
  embed: DiscordEmbed
  files?: Array<{
    name: string
    data: Buffer
  }>
}

// Discord Member
export interface DiscordMember {
  nick: string | null
  roles: string[]
  user: {
    id: string
    username: string
    avatar: string
  }
}
```

### 6.2 Message Processing Types

```typescript
// Agent Request
export interface AgentRequest {
  agentType: 'secretary' | 'translator' | 'analyst' | 'developer' | 'planner'
  intent: string
  content: string
  discordMessageId: string
  channelId: string
  userId: string
  timestamp: string
}

// Agent Response
export interface AgentResponse {
  success: boolean
  message: string
  data?: any
  error?: string
  processingTime: number
}

// Intent Classification
export interface Intent {
  type: string
  confidence: number
  parameters: Record<string, any>
}
```

---

## 7. 배포 및 운영

### 7.1 사전 배포 체크리스트

- [ ] Discord Bot Token 발급 및 환경 변수 설정
- [ ] Message Content Intent 활성화 (Discord Developer Portal)
- [ ] Guild ID 및 Channel IDs 확인
- [ ] Telegram 연동 정보 확인 (THREAD_ID)
- [ ] OpenClaw API 연결 테스트
- [ ] 로그 저장소 설정 (CloudWatch/Supabase)
- [ ] Rate Limiting 테스트
- [ ] Error Handling 테스트 (각 processor별)

### 7.2 모니터링 지표

```typescript
export interface DiscordBotMetrics {
  messagesProcessed: number
  messagesPerSecond: number
  errorRate: number // percentage
  averageProcessingTime: number // ms
  telegramSyncSuccess: number
  telegramSyncFailure: number
  queueSize: number
  uptime: number // seconds
}

// Collect metrics every 1 minute
setInterval(() => {
  const metrics = {
    messagesProcessed: statsCollector.total(),
    messagesPerSecond: statsCollector.rps(),
    errorRate: statsCollector.errorRate(),
    averageProcessingTime: statsCollector.avgTime(),
    telegramSyncSuccess: statsCollector.telegramSuccess(),
    telegramSyncFailure: statsCollector.telegramFailure(),
    queueSize: messageQueue.size(),
    uptime: process.uptime()
  }
  
  logger.info('[Metrics]', metrics)
  // Send to monitoring service (Datadog, etc.)
}, 60000)
```

---

## 8. 보안 고려사항

### 8.1 토큰 관리

- 봇 토큰은 환경 변수에만 저장 (절대 코드 포함 금지)
- 정기적 토큰 로테이션 (월 1회)
- 토큰 유출 시 즉시 Discord Developer Portal에서 재발급

### 8.2 인증 및 검증

```typescript
// Discord Signature Verification (필수)
function verifyDiscordSignature(
  publicKey: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const message = timestamp + body
  const isValid = nacl.sign.detached.verify(
    Buffer.from(message),
    Buffer.from(signature, 'hex'),
    Buffer.from(publicKey, 'hex')
  )
  
  // Timestamp check (5분 이상 차이 = 거부)
  const messageTimestamp = parseInt(timestamp)
  const now = Math.floor(Date.now() / 1000)
  
  if (Math.abs(now - messageTimestamp) > 300) {
    return false
  }
  
  return isValid
}
```

### 8.3 권한 관리

- Discord 역할 기반 접근 제어 (RBAC)
- 특정 역할만 특정 채널 접근 가능
- 감시 로그 (Audit Log) 자동 기록

---

## 9. 테스트 전략

### 9.1 유닛 테스트

```typescript
// Test: Secretary Processor
describe('SecretaryProcessor', () => {
  test('should process schedule request', async () => {
    const processor = new SecretaryProcessor()
    const msg = {
      content: '팀 일정 알려줘',
      channel_id: CHANNEL_ID_SECRETARY,
      author: { username: 'test-user' }
    }
    
    const response = await processor.processMessage(msg)
    expect(response.embed.title).toContain('비서')
  })
  
  test('should handle errors gracefully', async () => {
    // Mock agent failure
    const response = await processor.processMessage(failingMessage)
    expect(response.embed.color).toBe(0xFF0000) // Error color
  })
})
```

### 9.2 통합 테스트

- Discord Sandbox 서버에서 실시간 테스트
- 각 processor별 최소 3회 성공 테스트
- Rate Limiting 테스트 (high load)
- Telegram Sync 테스트 (양방향)

---

## 10. 마이그레이션 계획

### 10.1 단계별 배포

**Phase 1: 기반 구축 (2026-05-16)**
- Discord Gateway Handler 배포
- Channel Router 배포
- Message Queue 구현

**Phase 2: Processor 배포 (2026-05-17)**
- Secretary Processor
- 각 에이전트 Processor
- Error Handling 및 Fallback

**Phase 3: Telegram Sync (2026-05-18)**
- Secretary ↔ Telegram 양방향 동기화
- Thread ID 추적

**Phase 4: 모니터링 및 최적화 (2026-05-19)**
- 메트릭 수집
- 성능 최적화
- 운영 매뉴얼 작성

---

## 11. 다음 단계

1. ✅ **이 문서 리뷰** (완료)
2. → **API 명세 검토** (DISCORD_BOT_API_SPEC.md)
3. → **구현 체크리스트** (DISCORD_BOT_IMPL_CHECKLIST.md)
4. → **웹개발자: 코드 구현**
5. → **평가자: 통합 테스트**
6. → **배포 및 모니터링**

---

## 참고 문서

- Discord Developer Portal: https://discord.com/developers/docs
- Discord.js Guide: https://discordjs.guide
- System Analysis: DISCORD_BOT_SYSTEM_ANALYSIS.md
- API Specification: DISCORD_BOT_API_SPEC.md
- Implementation Checklist: DISCORD_BOT_IMPL_CHECKLIST.md
