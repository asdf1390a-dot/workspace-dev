---
name: Discord Bot 구현 체크리스트
description: Discord Bot 개발 10-12시간 분할 배포 체크리스트 (Prerequisites + 4 Phases)
type: project
relatedFiles: DISCORD_BOT_IMPL_CHECKLIST.md
---

# Discord Bot 구현 체크리스트

**작성일:** 2026-05-15 23:15 KST  
**담당:** Web-Builder  
**예상 소요:** 10-12시간 (분할 배포)  
**예상 완료:** 2026-05-16 18:00 KST

## Phase 0: 사전 준비 (Prerequisites)

### 필수 환경 설정 ⭐
- Discord Bot Token 발급 → `DISCORD_BOT_TOKEN` (10분)
- Discord Public Key 확인 → `DISCORD_BOT_PUBLIC_KEY` (5분)
- Guild ID (DSC-MANNUR-AI 서버) → `DISCORD_GUILD_ID` (5분)
- Channel IDs 확인 및 설정 (6개 채널) (15분)
  - #비서-secretary → `DISCORD_CHANNEL_SECRETARY`
  - #번역기-translator → `DISCORD_CHANNEL_TRANSLATOR`
  - #Data-Analyst AI Agent-analyst → `DISCORD_CHANNEL_ANALYST`
  - #Web-Builder AI Agent-dev → `DISCORD_CHANNEL_DEVELOPER`
  - #Planner AI Agent-planner → `DISCORD_CHANNEL_PLANNER`
  - #일반-general → `DISCORD_CHANNEL_GENERAL`
- Message Content Intent 활성화 (Discord Developer Portal) (5분)
- Telegram Bot Token + Chat ID 확인 (10분)

### 의존성 설치
```bash
npm install tweetnacl dotenv pino pino-transport-loki
npm install -D @types/node
```

### 디렉토리 구조 생성
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
│   │       ├── secretary.ts    ← 비서
│   │       ├── translator.ts   ← 번역기
│   │       ├── analyst.ts      ← 분석가
│   │       ├── developer.ts    ← 개발자
│   │       └── planner.ts      ← Planner AI Agent
│   └── utils/discord-helpers.ts
└── pages/api/discord-gateway.ts
```

## Phase 1: 기반 구축 (Infrastructure)
**예상 시간:** 4-5시간  
**완료 조건:** Gateway 엔드포인트가 Discord PING 수신 가능

### 1.1 타입 정의 (lib/discord/types.ts)
- Interaction Type enum (PING=1, APPLICATION_COMMAND=2, MESSAGE_COMPONENT=3)
- Interaction Data interface
- Member context interface
- Response type enum (PONG=1, CHANNEL_MESSAGE_WITH_SOURCE=4, DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE=5)

### 1.2 로거 설정 (lib/discord/logger.ts)
- Pino 초기화
- Loki 트랜스포트 설정
- 요청/응답 로깅 필터

### 1.3 레이트 리미팅 (lib/discord/rate-limiter.ts)
- Per-user rate limiting (50 req/sec global)
- Sliding window counter
- 429 응답 처리

### 1.4 Gateway 라우터 (lib/discord/gateway.ts)
- Ed25519 서명 검증 (tweetnacl)
- Interaction 타입별 라우팅
- 메시지 큐 구현 (비동기 처리)
- Deferred response 처리

### 1.5 Telegram 동기화 (lib/discord/telegram-sync.ts)
- Discord 메시지 → Telegram 자동 포워딩
- 형식 변환 (Embed → Message)
- 오류 처리 및 재시도

## Phase 2: 프로세서 구현 (Processors)
**예상 시간:** 3-4시간  
**완료 조건:** 5개 프로세서 모두 기본 응답 반환 가능

### 2.1 Base Processor Class (lib/discord/processors/base.ts)
```typescript
export abstract class BaseProcessor {
  abstract name: string;
  abstract process(interaction: DiscordInteraction): Promise<DiscordResponse>;
  protected formatEmbed(title, description, fields): DiscordEmbed;
  protected handleError(error): DiscordResponse;
}
```

### 2.2 Secretary Processor (lib/discord/processors/secretary.ts)
- 팀 일정 조회 (Supabase calendar table)
- 작업 현황 조회 (활동 로그)
- 기술 자료 추천 (설계 문서 검색)
- 응답: Embed 형식 (필드 배열)

### 2.3 Translator Processor (lib/discord/processors/translator.ts)
- 한영 번역 (Claude API)
- 톤/문체 조정
- 원문 인용
- 응답: 번역 텍스트 + 원문 Blockquote

### 2.4 Analyst Processor (lib/discord/processors/analyst.ts)
- 자산/BM/KPI 데이터 조회
- 통계 계산 (집계, 비율)
- 차트 생성 (Chart.js → PNG)
- 응답: 테이블 Embed 또는 이미지

### 2.5 Developer Processor (lib/discord/processors/developer.ts)
- 기술 문제 해결 (AI 기반)
- 코드 리뷰 (패턴 매칭)
- API 문서 검색
- 응답: 코드 블록 + 설명 Embed

### 2.6 Planner Processor (lib/discord/processors/planner.ts)
- 설계 문서 조회 (memory/ 검색)
- 로드맵 업데이트
- 진행 상황 보고
- 응답: 마크다운 형식

## Phase 3: API 엔드포인트 (pages/api/discord-gateway.ts)
**예상 시간:** 1-2시간  
**완료 조건:** Gateway가 Discord 요청 수신 및 응답 가능

- POST /api/discord-gateway 라우트
- Ed25519 검증 미들웨어
- Interaction 타입 분기
  - type=1 (PING) → {type: 1} 즉시 응답
  - type=2,3 → Processor 라우팅
- Deferred response 타이밍 관리
- 오류 처리 및 로깅

## Phase 4: 통합 테스트 (Integration)
**예상 시간:** 1-2시간  
**완료 조건:** 프로덕션 배포 가능

- Discord 테스트 서버에서 각 프로세서 테스트
- Telegram 동기화 검증
- 레이트 리미팅 동작 확인
- 오류 시나리오 테스트
- Vercel 배포 및 Discord 웹훅 URL 업데이트

## 주의사항

1. **서명 검증 필수:** Discord가 보낸 요청인지 반드시 확인 (Ed25519)
2. **3초 제한:** 3초 이내 응답 못하면 type 5 (Deferred) + Follow-up 사용
3. **비동기 처리:** 큐 기반으로 메시지 순서 보장
4. **Telegram 동기화:** 모든 응답을 자동으로 Telegram에 전송
5. **환경 변수:** .env.local에 모든 토큰/ID 저장 (GitHub에 커밋 금지)

## 상태
🟡 **체크리스트 준비** → Web-Builder AI Agent 구현 개시 대기
