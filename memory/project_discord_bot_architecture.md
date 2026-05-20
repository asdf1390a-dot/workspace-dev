---
name: Discord Bot 아키텍처 설계 (고급)
description: 양방향 메시지 처리 + 4개 AI Agent Processor + Telegram 동기화 (Secretary Only)
type: project
relatedFiles: DISCORD_BOT_ARCHITECTURE_DESIGN.md
---

# Discord Bot 아키텍처 설계 (고급)

**작성일:** 2026-05-15 22:45 KST  
**상태:** Planner AI Agent 설계 완료 → Web-Builder AI Agent 구현 대기  
**완료 예상:** 2026-05-16 10:00~18:00 KST

## 메시지 흐름

```
1. Discord User 메시지 입력
   → #비서-secretary: "팀 일정 알려줘"

2. Gateway Handler (pages/api/discord-gateway.ts)
   ✓ Signature 검증 (X-Signature-Ed25519)
   ✓ Event 파싱 (message_create)
   ✓ Channel 식별 (#비서-secretary)
   ✓ Intent 인식 ("팀 일정")

3. Channel Router (lib/discord/gateway.ts)
   ✓ Channel ID → AI Agent 매핑
   ✓ Message Content 검증
   ✓ Rate Limit 확인
   ✓ Message Queue 추가

4. Agent Processor (lib/discord/processors/secretary.ts)
   ✓ 요청 파싱 (Intent, Parameters)
   ✓ AI Agent 호출 (mcp__openclaw__message tool)
   ✓ Response 포맷팅
   ✓ 에러 처리 (재시도, Fallback)

5. Discord Response
   ✓ Embed 생성 (Color, Fields, Timestamp)
   ✓ Discord API로 메시지 전송

6. Telegram Sync (Secretary Only)
   ✓ Response → Telegram msg#XXXX 스레드
   ✓ 양방향 동기화 유지
```

## 구현 계층

### Layer 1: API Gateway Handler
**파일:** `pages/api/discord-gateway.ts`

**책임:**
- Discord Interaction Endpoint 제공
- Request 서명 검증 (X-Signature-Ed25519)
- Event 파싱 및 분류
- Gateway Handler로 라우팅

**구현 항목:**
- [ ] Discord Interactions URL 설정
- [ ] DISCORD_PUBLIC_KEY 검증
- [ ] message_create 이벤트만 처리
- [ ] 나머지 이벤트 204 No Content 응답

### Layer 2: Channel Router & Gateway
**파일:** `lib/discord/gateway.ts`

**책임:**
- Channel ID → AI Agent 매핑 (secretary|translator|analyst|developer)
- Intent 분류 (팀 일정, 문서 번역, 데이터 분석, 개발 이슈 등)
- Message Queue 관리 (FIFO)
- Rate Limit 처리

**매핑 테이블:**
| Channel | Channel ID | AI Agent | Processor |
|---------|-----------|----------|-----------|
| #비서-secretary | ... | secretary | SecretaryProcessor |
| #번역기-translator | ... | translator | TranslatorProcessor |
| #Data-Analyst AI Agent-analyst | ... | analyst | AnalystProcessor |
| #Web-Builder AI Agent-dev | ... | developer | DeveloperProcessor |

### Layer 3: AI Agent Processors (4개)
**디렉토리:** `lib/discord/processors/`

#### SecretaryProcessor
**파일:** `lib/discord/processors/secretary.ts`

**책임:**
- 팀 일정, 작업 추적, 상태 리포트
- 요청 파싱 (Intent, 파라미터)
- AI Agent 호출 (팀 정보, 일정 API 호출)
- Response 포맷팅 + Discord Embed
- Telegram #msg 스레드로 동기화

**구현 항목:**
- [ ] Intent Classification: "일정", "작업 추적", "상태", "조율"
- [ ] 팀 API 호출 (GET /api/team-members, GET /api/schedules)
- [ ] Response 구조화 (Embed 필드)
- [ ] 에러 처리 (재시도, 폴백)

#### TranslatorProcessor
**파일:** `lib/discord/processors/translator.ts`

**책임:**
- 한↔영 문서 번역
- 용어 검증
- 번역 품질 점검

#### AnalystProcessor
**파일:** `lib/discord/processors/analyst.ts`

**책임:**
- 파일 분석 요청 (Excel/CSV)
- KPI, 추세 분석
- 차트 생성

#### DeveloperProcessor
**파일:** `lib/discord/processors/developer.ts`

**책임:**
- 개발 이슈, 코드 리뷰 요청
- 구현, 버그 수정 논의
- 배포 진행상황

### Layer 4: Telegram Sync (Secretary Only)
**파일:** `lib/discord/telegram-sync.ts`

**책상:**
- Discord #비서-secretary 응답 → Telegram msg#XXXX 스레드로 미러링
- 양방향 메시지 흐름
- Thread ID 추적

## 구현 체크리스트

**Phase 1: Bot 기반 구조**
- [ ] Discord Bot Token 설정 (.env.local: DISCORD_BOT_TOKEN)
- [ ] Discord Interactions 엔드포인트 구현
- [ ] Signature 검증 (X-Signature-Ed25519)
- [ ] Intent 필터링 (message_create만)

**Phase 2: Channel Processors (4개)**
- [ ] SecretaryProcessor — 팀 일정, 작업 추적
- [ ] TranslatorProcessor — 문서 번역, 용어 검증
- [ ] AnalystProcessor — 데이터 분석, KPI
- [ ] DeveloperProcessor — 기술 상담, 코드 리뷰

**Phase 3: Telegram 동기화**
- [ ] lib/discord/telegram-sync.ts
- [ ] msg#XXXX 스레드 실시간 미러링
- [ ] 양방향 메시지 흐름

## 기대 효과

- 팀 소통 효율 30% ↑
- Telegram + Discord 양방향 동기화 100%
- 응답시간 <2초
- 메시지 손실률 0%

## 상태
🟡 **설계 완료** → Web-Builder AI Agent 구현 대기
