# Discord Bot 구현 체크리스트

**작성일:** 2026-05-15 23:15 KST  
**담당:** Web-Builder  
**예상 소요:** 10-12시간 (분할 배포)  
**예상 완료:** 2026-05-16 18:00 KST

---

## 1. 사전 준비 (Prerequisites)

### 1.1 환경 설정 ⭐ 필수 (의존성 기반)

- [ ] **Discord Bot Token 발급**
  - Discord Developer Portal에서 새 애플리케이션 생성
  - Bot 섹션에서 TOKEN 복사
  - 환경 변수: `DISCORD_BOT_TOKEN` 설정
  - 예상 시간: 10분
  - 담당: 사용자 직접 액션 필요

- [ ] **Discord Public Key 확인**
  - Applications > Settings > General Information에서 조회
  - 환경 변수: `DISCORD_BOT_PUBLIC_KEY` 설정
  - 예상 시간: 5분
  - 담당: 사용자 직접 액션 필요

- [ ] **Guild ID (DSC-MANNUR-AI 서버) 확인**
  - Discord 개발자 모드 활성화 (Settings > Advanced)
  - 서버명 우클릭 → Copy Server ID
  - 환경 변수: `DISCORD_GUILD_ID` 설정
  - 예상 시간: 5분
  - 담당: 사용자 직접 액션 필요

- [ ] **Channel ID들 확인**
  - 각 채널명 우클릭 → Copy Channel ID
  - 채널 목록:
    - `#비서-secretary` → `DISCORD_CHANNEL_SECRETARY`
    - `#번역기-translator` → `DISCORD_CHANNEL_TRANSLATOR`
    - `#데이터분석가-analyst` → `DISCORD_CHANNEL_ANALYST`
    - `#웹개발자-dev` → `DISCORD_CHANNEL_DEVELOPER`
    - `#플레너-planner` → `DISCORD_CHANNEL_PLANNER`
    - `#일반-general` → `DISCORD_CHANNEL_GENERAL`
  - 예상 시간: 15분
  - 담당: 사용자 직접 액션 필요

- [ ] **Message Content Intent 활성화**
  - Discord Developer Portal > Application > Bot
  - "MESSAGE CONTENT INTENT" 활성화
  - 경고: 검증되지 않은 봇은 DM만 가능 (서버 메시지는 Intent 필수)
  - 예상 시간: 5분
  - 담당: 사용자 직접 액션 필요

- [ ] **Telegram Bot Token 및 Chat ID 확인**
  - 환경 변수: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 설정
  - 환경 변수: `TELEGRAM_THREAD_ID=msg#XXXX` 설정 (메모리에서 확인)
  - 예상 시간: 10분
  - 담당: 사용자 직접 액션 필요

### 1.2 의존성 설치

- [ ] **Node.js 패키지 설치**
  ```bash
  npm install tweetnacl dotenv pino pino-transport-loki
  ```
  - `tweetnacl` — Discord 서명 검증 (Ed25519)
  - `dotenv` — 환경 변수 로드
  - `pino` — 로깅
  - 예상 시간: 3분

- [ ] **TypeScript 타입 정의**
  ```bash
  npm install -D @types/node
  ```
  - 예상 시간: 2분

### 1.3 프로젝트 구조 생성

- [ ] **디렉토리 구조 생성**
  ```
  src/
  ├── lib/
  │   ├── discord/
  │   │   ├── gateway.ts          ← 라우터 & 큐
  │   │   ├── types.ts            ← 타입 정의
  │   │   ├── logger.ts           ← 로깅
  │   │   ├── rate-limiter.ts     ← 레이트 리미팅
  │   │   ├── telegram-sync.ts    ← Telegram 동기화
  │   │   └── processors/
  │   │       ├── base.ts         ← Base class
  │   │       ├── secretary.ts    ← 비서 프로세서
  │   │       ├── translator.ts   ← 번역기 프로세서
  │   │       ├── analyst.ts      ← 분석가 프로세서
  │   │       ├── developer.ts    ← 개발자 프로세서
  │   │       └── planner.ts      ← 플레너 프로세서
  │   └── utils/
  │       └── discord-helpers.ts  ← 헬퍼 함수
  └── pages/
      └── api/
          └── discord-gateway.ts  ← 엔드포인트
  ```
  - 예상 시간: 5분

---

## 2. Phase 1: 기반 구축 (Infrastructure)

**예상 시간:** 4-5시간  
**담당:** Web-Builder  
**완료 조건:** Gateway 엔드포인트가 Discord 연결 확인 (PING) 수신 가능

### 2.1 타입 정의 및 상수

**파일:** `lib/discord/types.ts`

- [ ] **Discord Interaction Types 정의**
  ```typescript
  export enum InteractionType {
    PING = 1,
    APPLICATION_COMMAND = 2,
    MESSAGE_COMPONENT = 3,
    APPLICATION_COMMAND_AUTOCOMPLETE = 4,
    MODAL_SUBMIT = 5
  }
  ```
  - 예상 시간: 15분

- [ ] **Discord Interface 정의**
  ```typescript
  export interface DiscordInteraction { ... }
  export interface DiscordMessage { ... }
  export interface DiscordEmbed { ... }
  export interface DiscordMember { ... }
  ```
  - 참고: DISCORD_BOT_ARCHITECTURE_DESIGN.md § 6
  - 예상 시간: 30분

- [ ] **Channel Configuration 정의**
  ```typescript
  export const CHANNEL_CONFIG = {
    [process.env.DISCORD_CHANNEL_SECRETARY!]: {
      name: '#비서-secretary',
      agent: 'secretary',
      processor: SecretaryProcessor,
      telegramSync: true,
      telegramThreadId: process.env.TELEGRAM_THREAD_ID
    }
    // ... other channels
  }
  ```
  - 예상 시간: 20분

### 2.2 로깅 시스템

**파일:** `lib/discord/logger.ts`

- [ ] **Pino Logger 설정**
  ```typescript
  export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-transport-loki',
      options: { /* Loki config */ }
    }
  })
  ```
  - 예상 시간: 20분

- [ ] **로깅 유틸 함수**
  ```typescript
  export class DiscordLogger {
    static logMessageReceived() { ... }
    static logProcessingStart() { ... }
    static logProcessingComplete() { ... }
    static logError() { ... }
  }
  ```
  - 참고: DISCORD_BOT_ARCHITECTURE_DESIGN.md § 4.3
  - 예상 시간: 15분

### 2.3 Discord 서명 검증

**파일:** `lib/discord/gateway.ts`

- [ ] **tweetnacl Ed25519 검증 구현**
  ```typescript
  import * as nacl from 'tweetnacl'
  
  export function verifyDiscordSignature(
    publicKey: string,
    timestamp: string,
    body: string,
    signature: string
  ): boolean {
    // 1. Timestamp validation (±5 min)
    const messageTimestamp = parseInt(timestamp)
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - messageTimestamp) > 300) return false
    
    // 2. Signature validation
    const message = timestamp + body
    return nacl.sign.detached.verify(
      Buffer.from(message),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
    )
  }
  ```
  - 참고: DISCORD_BOT_ARCHITECTURE_DESIGN.md § 8.2
  - 예상 시간: 30분
  - 테스트: 유닛 테스트 필수

- [ ] **검증 테스트 작성**
  ```typescript
  describe('verifyDiscordSignature', () => {
    test('should reject invalid signature', () => { ... })
    test('should reject old timestamp', () => { ... })
    test('should accept valid signature', () => { ... })
  })
  ```
  - 예상 시간: 20분

### 2.4 Gateway Handler API 엔드포인트

**파일:** `pages/api/discord-gateway.ts`

- [ ] **POST 엔드포인트 구현**
  ```typescript
  export async function POST(req: Request) {
    const signature = req.headers.get('x-signature-ed25519')
    const timestamp = req.headers.get('x-signature-timestamp')
    const body = await req.text()
    
    if (!verifySignature(PUBLIC_KEY, timestamp, body, signature)) {
      return new Response('Invalid signature', { status: 401 })
    }
    
    const event = JSON.parse(body)
    const response = await handleInteraction(event)
    return new Response(JSON.stringify(response), { status: 200 })
  }
  ```
  - 참고: DISCORD_BOT_ARCHITECTURE_DESIGN.md § 2.1
  - 예상 시간: 30분

- [ ] **Interaction Handler 구현**
  ```typescript
  async function handleInteraction(event: DiscordInteraction) {
    if (event.type === InteractionType.PING) {
      return { type: InteractionResponseType.PONG }
    }
    
    if (event.type === InteractionType.MESSAGE_CREATE) {
      await gateway.route(event)
      return { type: InteractionResponseType.DEFERRED_MESSAGE_UPDATE }
    }
    
    // ... other types
  }
  ```
  - 예상 시간: 20분

- [ ] **에러 처리 추가**
  - 400: Bad Request
  - 401: Invalid Signature
  - 500: Server Error
  - 예상 시간: 15분

- [ ] **로컬 테스트**
  ```bash
  npm run dev  # Start Next.js dev server
  # Use Discord interactions tester or local curl
  ```
  - 예상 시간: 15분

### 2.5 Message Queue 구현

**파일:** `lib/discord/gateway.ts` (또는 별도 파일)

- [ ] **MessageQueue 클래스 구현**
  ```typescript
  export class MessageQueue {
    private queue: DiscordMessage[] = []
    private processing = false
    private lastApiCall = 0
    private readonly RATE_LIMIT = 1000 / 5  // 5 req/sec
    
    async enqueue(msg: DiscordMessage): Promise<void> { ... }
    private async process(): Promise<void> { ... }
    private async processMessage(msg: DiscordMessage): Promise<void> { ... }
  }
  ```
  - 참고: DISCORD_BOT_ARCHITECTURE_DESIGN.md § 2.2
  - 예상 시간: 45분

- [ ] **Rate Limiting 구현**
  - 초당 요청 제한: 5 req/sec
  - 큐 최대 크기: 100 messages
  - 예상 시간: 20분

- [ ] **큐 모니터링 엔드포인트**
  ```typescript
  export async function GET(req: Request) {
    // /api/discord/queue/status
    return {
      queueSize: queue.size(),
      processing: queue.current(),
      rateLimitStatus: { ... }
    }
  }
  ```
  - 예상 시간: 15분

**Phase 1 완료 조건:**
- ✅ Gateway 엔드포인트 구현 및 테스트
- ✅ Discord PING 응답
- ✅ Message Queue 작동
- ✅ Rate Limiting 검증

---

## 3. Phase 2: Channel Router 구현

**예상 시간:** 2-3시간  
**담당:** Web-Builder  
**의존성:** Phase 1 완료  
**완료 조건:** 메시지가 올바른 processor로 라우팅됨

### 3.1 Channel Router 구현

**파일:** `lib/discord/gateway.ts` (확장)

- [ ] **Channel-to-Processor 매핑**
  ```typescript
  export class DiscordGateway {
    async route(event: DiscordInteraction): Promise<void> {
      const config = this.getChannelConfig(event.data.channel_id)
      if (!config) {
        logger.warn(`Unknown channel: ${event.data.channel_id}`)
        return
      }
      
      const processor = new config.processor()
      const response = await processor.process(event.data)
      await this.postResponse(event.data, response)
    }
    
    private getChannelConfig(channelId: string) {
      return CHANNEL_CONFIG[channelId]
    }
  }
  ```
  - 예상 시간: 20분

- [ ] **Intent 감지 (선택사항, Secretary only)**
  ```typescript
  private detectIntent(content: string): string {
    const keywords = {
      '일정': 'schedule',
      '팀': 'team',
      '상태': 'status'
    }
    // ... keyword matching
  }
  ```
  - 예상 시간: 15분

### 3.2 Response Posting

**파일:** `lib/discord/gateway.ts`

- [ ] **Discord API를 통한 메시지 전송**
  ```typescript
  private async postResponse(
    originalMsg: DiscordMessage,
    response: ProcessorResponse
  ): Promise<void> {
    const payload = {
      embeds: [response.embed],
      reply: { message_id: originalMsg.id }
    }
    
    const res = await fetch(
      `https://discord.com/api/v10/channels/${originalMsg.channel_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    )
    
    if (!res.ok) throw new Error(`Discord API error: ${res.status}`)
  }
  ```
  - 예상 시간: 25분

- [ ] **Rate Limit 재시도**
  ```typescript
  private async postResponseWithRetry(
    msg: DiscordMessage,
    response: ProcessorResponse,
    maxRetries = 3
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.postResponse(msg, response)
      } catch (error) {
        if (i < maxRetries - 1) {
          const delayMs = 1000 * Math.pow(2, i)
          await sleep(delayMs)
        }
      }
    }
  }
  ```
  - 예상 시간: 15분

### 3.3 에러 처리

- [ ] **Unknown Channel 처리**
  - 로그 기록, 응답 스킵
  - 예상 시간: 10분

- [ ] **Processor 오류 처리**
  - 폴백 응답 생성 및 전송
  - 예상 시간: 15분

**Phase 2 완료 조건:**
- ✅ 메시지가 올바른 채널에서 수신
- ✅ Processor로 라우팅됨
- ✅ Response가 Discord에 게시됨

---

## 4. Phase 3: Base Processor 및 Helpers

**예상 시간:** 2-3시간  
**담당:** Web-Builder  
**의존성:** Phase 2 완료  
**완료 조건:** BaseProcessor 클래스 작동, 에러 처리 검증

### 4.1 Base Processor 클래스

**파일:** `lib/discord/processors/base.ts`

- [ ] **BaseProcessor 추상 클래스 정의**
  ```typescript
  export abstract class BaseProcessor {
    abstract processMessage(msg: DiscordMessage): Promise<ProcessorResponse>
    
    protected parseCommand(content: string) { ... }
    protected createEmbed(...) { ... }
    protected retry<T>(...) { ... }
  }
  ```
  - 참고: DISCORD_BOT_ARCHITECTURE_DESIGN.md § 2.3
  - 예상 시간: 30분

- [ ] **Helper 메서드 구현**
  - `parseCommand()` — 명령어 파싱
  - `createEmbed()` — Embed 생성
  - `retry()` — 지수 백오프 재시도
  - 예상 시간: 30분

### 4.2 Fallback 응답

**파일:** `lib/discord/processors/base.ts`

- [ ] **Fallback Embed 생성**
  ```typescript
  protected createFallbackEmbed(error: Error): DiscordEmbed {
    return {
      title: '⚠️ 처리 중 오류 발생',
      description: error.message,
      color: 0xFF0000,
      timestamp: new Date().toISOString()
    }
  }
  ```
  - 예상 시간: 15분

### 4.3 유틸 함수

**파일:** `lib/utils/discord-helpers.ts`

- [ ] **Sleep/Delay 함수**
  ```typescript
  export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  ```
  - 예상 시간: 5분

- [ ] **Embed Color 상수**
  ```typescript
  export const EMBED_COLORS = {
    SUCCESS: 0x00CC00,
    WARNING: 0xFF9500,
    ERROR: 0xFF0000,
    INFO: 0x2F3136
  }
  ```
  - 예상 시간: 5분

**Phase 3 완료 조건:**
- ✅ BaseProcessor 상속 가능
- ✅ Fallback 응답 작동
- ✅ 헬퍼 함수 테스트 완료

---

## 5. Phase 4: 개별 Processor 구현

**예상 시간:** 3-4시간 (병렬 가능)  
**담당:** Web-Builder  
**의존성:** Phase 3 완료  
**완료 조건:** 각 processor별 최소 1회 성공 응답

### 5.1 Secretary Processor

**파일:** `lib/discord/processors/secretary.ts`

- [ ] **Secretary Processor 클래스**
  ```typescript
  export class SecretaryProcessor extends BaseProcessor {
    async processMessage(msg: DiscordMessage): Promise<ProcessorResponse> {
      // Parse intent → Call OpenClaw message tool → Format response
    }
  }
  ```
  - 예상 시간: 45분

- [ ] **OpenClaw Message Tool 호출**
  - Intent: 일정, 팀 정보, 상태 보고 등
  - 메시지 포맷: Telegram compatible
  - 예상 시간: 30분

- [ ] **Response Formatting**
  - Embed 생성 (색상: 파란색 0x4A90E2)
  - Fields 추가
  - 예상 시간: 20분

- [ ] **테스트**
  ```bash
  # 수동 테스트: Discord #비서-secretary에 메시지 전송
  # 기대: Bot이 응답 메시지 생성
  ```
  - 예상 시간: 15분

### 5.2 Translator Processor

**파일:** `lib/discord/processors/translator.ts`

- [ ] **Translator Processor 클래스**
  - 언어 감지 (한글/영문)
  - 방향 결정 (KO→EN, EN→KO)
  - 예상 시간: 30분

- [ ] **OpenClaw translator 에이전트 호출**
  - translate-biz-kr-en skill 활용
  - 번역 결과 수신
  - 예상 시간: 30분

- [ ] **Response Formatting**
  - Embed 생성 (색상: 초록색 0x7ED321)
  - 원본 + 번역본 표시
  - 신뢰도/메타데이터 추가
  - 예상 시간: 20분

- [ ] **테스트**
  - 한글 → 영문 번역
  - 영문 → 한글 번역
  - 예상 시간: 15분

### 5.3 Data Analyst Processor

**파일:** `lib/discord/processors/analyst.ts`

- [ ] **Analyst Processor 클래스**
  - 분석 유형 감지 (KPI, Trend, Anomaly 등)
  - 파일 참조 처리
  - 예상 시간: 30분

- [ ] **OpenClaw data-analyst 에이전트 호출**
  - Supabase DB 쿼리
  - 분석 수행
  - 차트 생성
  - 예상 시간: 45분

- [ ] **Response Formatting**
  - Embed 생성 (색상: 파란색 0x4A90E2)
  - 분석 결과 필드
  - 차트 이미지 삽입 (선택사항)
  - 예상 시간: 25분

- [ ] **테스트**
  - 생산 효율 분석
  - 다운타임 추세 분석
  - 예상 시간: 20분

### 5.4 Developer Processor

**파일:** `lib/discord/processors/developer.ts`

- [ ] **Developer Processor 클래스**
  - Issue 유형 감지 (Bug, Feature, Review)
  - 심각도 분류
  - 예상 시간: 30분

- [ ] **OpenClaw web-builder 에이전트 호출** (또는 Task 생성)
  - 이슈 등록
  - 담당자 할당
  - 예상 시간: 30분

- [ ] **Response Formatting**
  - Embed 생성 (색상: 빨강 0xFF6B6B)
  - Task ID 생성
  - 예상 완료 시간 표시
  - 예상 시간: 20분

- [ ] **테스트**
  - Bug report
  - Feature request
  - 예상 시간: 15분

### 5.5 Planner Processor

**파일:** `lib/discord/processors/planner.ts`

- [ ] **Planner Processor 클래스**
  - 설계 요청 감지
  - 아키텍처 분석 요청
  - 예상 시간: 30분

- [ ] **OpenClaw planner 에이전트 호출**
  - 설계 검토
  - 문서 생성
  - 예상 시간: 45분

- [ ] **Response Formatting**
  - Embed 생성 (색상: 초록 0x7ED321)
  - 설계 요약
  - 문서 링크 추가
  - 예상 시간: 20분

- [ ] **테스트**
  - 새 기능 설계 요청
  - 아키텍처 검토 요청
  - 예상 시간: 15분

**Phase 4 완료 조건:**
- ✅ 각 processor별 인스턴스 생성 가능
- ✅ 각 processor별 최소 1회 성공 응답
- ✅ 에러 처리 및 폴백 작동

---

## 6. Phase 5: Telegram Sync 구현

**예상 시간:** 2-3시간  
**담당:** Web-Builder  
**의존성:** Phase 4 (Secretary) 완료  
**완료 조건:** Discord ↔ Telegram 양방향 동기화 작동

### 6.1 Telegram Sync Manager

**파일:** `lib/discord/telegram-sync.ts`

- [ ] **TelegramSyncManager 클래스**
  ```typescript
  export class TelegramSyncManager {
    async syncToTelegram(
      response: ProcessorResponse,
      originalMsg: DiscordMessage
    ): Promise<void>
    
    async syncFromTelegram(msg: any): Promise<void>
  }
  ```
  - 예상 시간: 30분

- [ ] **Embed → Telegram 포맷 변환**
  ```typescript
  private formatEmbedForTelegram(embed: DiscordEmbed): string {
    let text = `**${embed.title}**\n\n${embed.description}`
    if (embed.fields) {
      for (const field of embed.fields) {
        text += `\n\n**${field.name}**\n${field.value}`
      }
    }
    return text
  }
  ```
  - 예상 시간: 15분

- [ ] **Telegram → Discord 포맷 변환**
  - 반대 변환 로직
  - 예상 시간: 15분

### 6.2 Telegram Webhook 엔드포인트

**파일:** `pages/api/telegram/webhook.ts`

- [ ] **POST /api/telegram/webhook 엔드포인트**
  ```typescript
  export async function POST(req: Request) {
    const update = await req.json()
    
    // Extract message from Telegram update
    const message = update.message
    
    // Sync to Discord
    await telegramSync.syncFromTelegram(message)
    
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }
  ```
  - 예상 시간: 25분

- [ ] **Telegram 요청 검증** (선택사항)
  - Telegram token 검증
  - 예상 시간: 10분

### 6.3 Thread ID 관리

- [ ] **Thread ID 추적**
  - 환경 변수에서 읽음: `TELEGRAM_THREAD_ID`
  - In-memory cache (선택사항)
  - 예상 시간: 10분

### 6.4 Sync 에러 처리

- [ ] **Sync 실패 처리**
  - Telegram 다운 시에도 Discord 응답 진행
  - 비동기 재시도 (최대 3회)
  - 예상 시간: 20분

- [ ] **로깅 및 모니터링**
  - Sync 성공/실패 기록
  - 메트릭 수집
  - 예상 시간: 15분

### 6.5 테스트

- [ ] **양방향 동기화 테스트**
  1. Discord에서 Secretary 채널에 메시지 입력
  2. Bot이 응답 → Telegram으로 동기화
  3. Telegram에서 응답 (스레드) → Discord로 동기화
  - 예상 시간: 30분

**Phase 5 완료 조건:**
- ✅ Discord → Telegram 동기화
- ✅ Telegram → Discord 동기화
- ✅ 에러 처리 및 재시도 작동

---

## 7. Phase 6: 모니터링 및 메트릭

**예상 시간:** 1-2시간  
**담당:** Web-Builder  
**의존성:** Phase 5 완료  
**완료 조건:** 메트릭 엔드포인트 작동, 대시보드 표시

### 7.1 메트릭 수집

**파일:** `lib/discord/metrics.ts`

- [ ] **MetricsCollector 클래스**
  ```typescript
  export class MetricsCollector {
    recordMessage(success: boolean, processingTimeMs: number) { ... }
    recordProcessorMetrics(processor: string, timeMs: number, error?: Error) { ... }
    recordTelegramSync(success: boolean) { ... }
    getMetrics(): DiscordBotMetrics { ... }
  }
  ```
  - 예상 시간: 30분

- [ ] **메트릭 종류**
  - 처리된 메시지 수
  - 성공/실패 비율
  - 평균 처리 시간 (processor별)
  - Telegram sync 성공률
  - 큐 크기
  - 예상 시간: 15분

### 7.2 메트릭 엔드포인트

**파일:** `pages/api/discord/metrics.ts`

- [ ] **GET /api/discord/metrics**
  ```typescript
  export async function GET(req: Request) {
    const metrics = metricsCollector.getMetrics()
    return new Response(JSON.stringify(metrics), { status: 200 })
  }
  ```
  - 예상 시간: 15분

- [ ] **주기적 메트릭 전송** (선택사항)
  - Datadog, CloudWatch 등으로 전송
  - 1분마다 수집
  - 예상 시간: 20분

### 7.3 대시보드

- [ ] **모니터링 대시보드 설정** (선택사항)
  - Vercel Analytics
  - 또는 커스텀 대시보드
  - 예상 시간: 30분

**Phase 6 완료 조건:**
- ✅ GET /api/discord/metrics 작동
- ✅ 메트릭 수집 및 집계
- ✅ 대시보드 표시 (선택사항)

---

## 8. Phase 7: 통합 테스트 및 배포

**예상 시간:** 2-3시간  
**담당:** Evaluator (평가자)  
**의존성:** Phase 6 완료  
**완료 조건:** 모든 processor 최소 3회 성공 테스트

### 8.1 환경 변수 최종 검증

- [ ] **모든 환경 변수 확인**
  ```env
  DISCORD_BOT_TOKEN=✓
  DISCORD_BOT_PUBLIC_KEY=✓
  DISCORD_GUILD_ID=✓
  DISCORD_CHANNEL_SECRETARY=✓
  DISCORD_CHANNEL_TRANSLATOR=✓
  DISCORD_CHANNEL_ANALYST=✓
  DISCORD_CHANNEL_DEVELOPER=✓
  DISCORD_CHANNEL_PLANNER=✓
  TELEGRAM_BOT_TOKEN=✓
  TELEGRAM_CHAT_ID=✓
  TELEGRAM_THREAD_ID=✓
  LOG_LEVEL=info
  ```
  - 예상 시간: 10분

### 8.2 유닛 테스트

- [ ] **각 Processor 유닛 테스트**
  ```bash
  npm run test -- secretary.test.ts
  npm run test -- translator.test.ts
  npm run test -- analyst.test.ts
  npm run test -- developer.test.ts
  npm run test -- planner.test.ts
  ```
  - 각 테스트: 10-15분
  - 예상 시간: 1시간

- [ ] **Gateway 유닛 테스트**
  - 서명 검증
  - 라우팅 로직
  - Rate limiting
  - 예상 시간: 30분

### 8.3 통합 테스트 (끝-끝 테스트)

**테스트 시나리오 1: Secretary Processor**
1. Discord #비서-secretary에 메시지: "팀 일정 알려줘"
2. Bot이 응답 메시지 생성 (title: "팀 일정")
3. Telegram msg#XXXX에 동기화
- 반복: 최소 3회
- 예상 시간: 20분

**테스트 시나리오 2: Translator Processor**
1. Discord #번역기-translator에 메시지: "Hello world"
2. Bot이 응답 (title: "번역 결과", 한글 번역)
3. 반복: 최소 3회
- 예상 시간: 20분

**테스트 시나리오 3: Analyst Processor**
1. Discord #데이터분석가-analyst에 메시지: "5월 생산 효율 분석"
2. Bot이 응답 (title: "데이터 분석 결과", KPI 표시)
3. 반복: 최소 3회
- 예상 시간: 25분

**테스트 시나리오 4: Developer Processor**
1. Discord #웹개발자-dev에 메시지: "Login 페이지 버그"
2. Bot이 응답 (title: "이슈 등록 완료", Task ID 생성)
3. 반복: 최소 3회
- 예상 시간: 20분

**테스트 시나리오 5: Planner Processor**
1. Discord #플레너-planner에 메시지: "새로운 기능 설계"
2. Bot이 응답 (title: "설계 분석 완료")
3. 반복: 최소 3회
- 예상 시간: 20분

**테스트 시나리오 6: Rate Limiting**
1. 5초 내에 6개 메시지 연속 전송
2. Bot이 큐에 추가, 순차 처리
3. 모든 메시지가 답변 수신
- 예상 시간: 15분

**테스트 시나리오 7: Error Handling**
1. 잘못된 요청 (빈 메시지, 특수문자 등)
2. Bot이 폴백 응답 생성
3. 에러 로그 기록
- 예상 시간: 15분

### 8.4 배포 전 체크리스트

- [ ] **코드 리뷰**
  - 타입 안전성 검사
  - 에러 처리 검사
  - 보안 검사 (토큰 노출 등)
  - 예상 시간: 30분

- [ ] **성능 테스트**
  - Load test (10 메시지/초)
  - Memory usage
  - CPU usage
  - 예상 시간: 30분

- [ ] **로깅 검증**
  - 모든 에러가 기록되는가?
  - 민감한 정보 (토큰 등) 로그에 안 나오는가?
  - 예상 시간: 15분

- [ ] **보안 검증**
  - Discord 서명 검증
  - Rate limit bypass 불가능한가?
  - 토큰 환경 변수화
  - 예상 시간: 20분

### 8.5 배포

- [ ] **Vercel 배포**
  ```bash
  git add .
  git commit -m "feat(discord): Complete Discord Bot implementation"
  git push origin main
  # Vercel auto-deploy
  ```
  - 예상 시간: 10분

- [ ] **배포 후 검증**
  - Discord에서 메시지 전송
  - Bot이 응답하는가?
  - Telegram 동기화 작동하는가?
  - 예상 시간: 15분

**Phase 7 완료 조건:**
- ✅ 모든 통합 테스트 완료
- ✅ 각 processor 3회 이상 성공 테스트
- ✅ Vercel 배포 완료
- ✅ 프로덕션 환경에서 작동 확인

---

## 9. 예상 일정

### 9.1 병렬 실행 계획

```
2026-05-16 10:00 START

Phase 1: 기반 구축 (4-5시간)
├─ 환경 변수 설정 (사용자 액션 1시간)
├─ 패키지 설치 (5분)
├─ 타입 정의 (30분)
├─ 로깅 시스템 (30분)
├─ 서명 검증 (45분)
├─ Gateway 엔드포인트 (30분)
├─ Message Queue (60분)
└─ 로컬 테스트 (30분)
   → 완료: 2026-05-16 14:00~15:00

Phase 2: Channel Router (2-3시간)
├─ Router 구현 (30분)
├─ Response Posting (40분)
├─ 에러 처리 (25분)
└─ 통합 테스트 (30분)
   → 완료: 2026-05-16 15:30~16:30

Phase 3: Base Processor (2-3시간)
├─ Base 클래스 (45분)
├─ Fallback (15분)
├─ 유틸 함수 (10분)
└─ 테스트 (20분)
   → 완료: 2026-05-16 17:00~18:00

[병렬] Phase 4: 개별 Processor (3-4시간) ✓ 병렬 가능
├─ Secretary Processor (1.5시간)
├─ Translator Processor (1.5시간)
├─ Analyst Processor (2시간)
├─ Developer Processor (1.5시간)
└─ Planner Processor (1.5시간)
   → 각 개발자별 진행
   → 완료: 2026-05-17 09:00

[의존성] Phase 5: Telegram Sync (2-3시간)
├─ Sync Manager (45분)
├─ Webhook 엔드포인트 (35분)
├─ Thread ID 관리 (10분)
├─ 에러 처리 (20분)
└─ 양방향 테스트 (30분)
   → 완료: 2026-05-17 11:00

[의존성] Phase 6: 모니터링 (1-2시간)
├─ Metrics 수집 (45분)
├─ 메트릭 엔드포인트 (15분)
└─ 대시보드 설정 (30분)
   → 완료: 2026-05-17 13:00

Phase 7: 통합 테스트 & 배포 (2-3시간)
├─ 환경 변수 검증 (10분)
├─ 유닛 테스트 (1.5시간)
├─ 통합 테스트 (5가지 시나리오 × 3회 = 2시간)
├─ 배포 전 체크리스트 (1시간)
├─ Vercel 배포 (10분)
└─ 배포 후 검증 (15분)
   → 완료: 2026-05-17 16:00

⏰ 총 예상 시간: 10-12시간 (분할 실행)
📅 예상 완료: 2026-05-17 16:00 KST (프로덕션 배포)
```

### 9.2 역할 분담

| 역할 | 담당 | 시간 |
|------|------|------|
| 환경 설정 | 사용자 직접 | 1시간 |
| Phase 1-3 | Web-Builder | 8-9시간 |
| Phase 4 (병렬) | Web-Builder (또는 여러 개발자) | 3-4시간 |
| Phase 5 | Web-Builder | 2-3시간 |
| Phase 6 | Web-Builder | 1-2시간 |
| Phase 7 | Evaluator | 2-3시간 |

---

## 10. 성공 기준

### 10.1 각 Phase별 완료 기준

| Phase | 완료 기준 | 검증 방법 |
|-------|---------|---------|
| 1 | Discord PING 응답, Queue 작동 | 엔드포인트 호출 테스트 |
| 2 | 메시지 라우팅, Response 게시 | Discord 채널에서 메시지 전송 |
| 3 | BaseProcessor 상속, 폴백 응답 | 에러 시나리오 테스트 |
| 4 | 각 processor 1회 이상 성공 | 채널별로 메시지 전송 |
| 5 | Discord ↔ Telegram 동기화 | 양방향 메시지 확인 |
| 6 | 메트릭 수집 및 조회 | GET /api/discord/metrics |
| 7 | 프로덕션 배포, 3회 성공 테스트 | 실제 환경에서 테스트 |

### 10.2 최종 검수 기준 (Evaluator)

- ✅ 모든 환경 변수 설정됨
- ✅ Discord Bot Token 유효함
- ✅ 5개 채널 모두 연동됨
- ✅ 각 processor별 최소 3회 성공 응답
- ✅ Rate limiting 정상 작동
- ✅ Telegram 양방향 동기화 작동
- ✅ 에러 처리 및 폴백 정상 작동
- ✅ 로깅 및 모니터링 작동
- ✅ Vercel 프로덕션 배포 완료
- ✅ 성능 (평균 응답 < 3초)

---

## 11. 위험 요소 및 대응

| 위험 | 확률 | 영향 | 대응 |
|------|------|------|------|
| **Discord API 변경** | 낮음 | 높음 | 공식 문서 정기 확인 |
| **Telegram 연동 실패** | 중간 | 중간 | Secretary만 동기화, fallback 준비 |
| **Rate Limit 초과** | 중간 | 중간 | Queue 크기 조절, 재시도 로직 |
| **Agent Timeout** | 중간 | 중간 | 타임아웃 단계별 설정, 폴백 준비 |
| **환경 변수 누락** | 높음 | 높음 | 배포 전 체크리스트 필수 |
| **서명 검증 실패** | 낮음 | 높음 | tweetnacl 라이브러리 신뢰 |

---

## 12. 다음 단계 (After Deployment)

1. ✅ **Discord Bot 구현 완료**
2. → **팀 문서 작성**
   - Discord Bot 운영 매뉴얼
   - Troubleshooting 가이드
   - 예상 시간: 1-2시간

3. → **팀 교육**
   - 각 채널 역할 설명
   - 메시지 형식 안내
   - 예상 시간: 30분

4. → **모니터링 시작**
   - 일일 메트릭 리뷰
   - 에러 로그 확인
   - 예상 시간: 10분/일

---

## 참고 문서

- DISCORD_BOT_ARCHITECTURE_DESIGN.md — 상세 설계
- DISCORD_BOT_API_SPEC.md — API 명세
- DISCORD_BOT_SYSTEM_ANALYSIS.md — 시스템 분석

---

**마지막 업데이트:** 2026-05-15 23:15 KST  
**상태:** 웹개발자 구현 대기  
**승인:** 플레너 설계 확정
