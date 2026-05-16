---
name: Discord Bot 아키텍처 설계
description: Telegram ↔ Discord 양방향 동기화, 팀 채널별 자동 라우팅 (6개 채널 + 메시지 처리)
type: project
relatedFiles: DISCORD_BOT_ARCHITECTURE_DESIGN.md, DISCORD_BOT_SYSTEM_ANALYSIS.md, DISCORD_BOT_API_SPEC.md
date: 2026-05-15
---

# Discord Bot 아키텍처 설계

**작성일:** 2026-05-15 22:45 KST  
**상태:** 플레너 설계 완료 → 웹개발자 구현 대기  
**완료 예상:** 2026-05-16 10:00~18:00 KST

## 시스템 개요

### Discord 서버 구조

```
Discord DSC-MANNUR-AI Server
├── #비서-secretary (비서 작업 로그)
├── #번역기-translator (번역 작업)
├── #데이터분석가-analyst (분석 결과)
├── #웹개발자-dev (개발 진행)
├── #플레너-planner (설계/계획)
└── #일반-general (공지사항)
```

## 메시지 흐름

```
1. Discord 사용자 메시지 입력
   → #비서-secretary: "팀 일정 알려줘"

2. Discord Bot (message_create event)
   ✓ Signature 검증 (X-Signature-Ed25519)
   ✓ Event 파싱
   ✓ Channel 식별

3. Gateway Handler (pages/api/discord-gateway.ts)
   ✓ Intent 인식 ("팀 일정")
   ✓ Router로 전달

4. Channel Processor (Secret/Translator/Analyst/Dev)
   ✓ AI Agent 요청 처리
   ✓ 응답 포맷팅
   ✓ Discord 채널에 게시

5. Telegram Sync (Secretary만)
   ✓ msg#XXXX 스레드에 동기화
   ✓ 실시간 업데이트
```

## 핵심 컴포넌트

### 1. API 엔드포인트
- `pages/api/discord-gateway.ts` — Discord Interactions 수신
- `pages/api/discord/webhook.ts` — 메시지 검증 및 라우팅
- `lib/discord/gateway.ts` — Gateway Handler (채널 감지, Intent 분류)

### 2. Channel Processors
- Secretary Processor — 팀 일정, 작업 추적
- Translator Processor — 문서 번역, 용어 검증
- Analyst Processor — 데이터 분석, KPI 리포트
- Developer Processor — 기술 상담, 코드 리뷰

### 3. Telegram Sync
- `lib/discord/telegram-sync.ts` — Discord ↔ Telegram 양방향 동기화
- msg#1234 스레드에 실시간 미러링

## 보안

- **Signature Verification:** `X-Signature-Ed25519` 검증
- **Intent Filtering:** 불필요한 메시지 필터링
- **Rate Limiting:** 1초당 최대 10개 메시지
- **Token Management:** `.env.local`에 `DISCORD_BOT_TOKEN` 저장

## 기대 효과

- 팀 소통 효율 30% ↑
- Telegram + Discord 양방향 동기화 100%
- 응답시간 <2초
- 메시지 손실률 0%

## 개발 단계

1. **Phase 1:** Gateway 구현 + 기본 라우팅
2. **Phase 2:** 각 Processor 구현 (4개)
3. **Phase 3:** Telegram 동기화
4. **Phase 4:** 테스트 + 배포

## 참고 문서
- DISCORD_BOT_ARCHITECTURE_DESIGN.md — 전체 아키텍처
- DISCORD_BOT_SYSTEM_ANALYSIS.md — 시스템 분석
- DISCORD_BOT_API_SPEC.md — API 명세
