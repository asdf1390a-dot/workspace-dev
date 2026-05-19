---
name: Discord Bot System 구조 분석
description: Discord 봇 미구현 원인 분석 + 양방향 동기화 아키텍처 설계
type: project
relatedFiles: DISCORD_BOT_SYSTEM_ANALYSIS.md
---

# Discord Bot System 구조 분석 및 개선 방향

**작성일:** 2026-05-15 22:30 KST  
**상태:** 근본 원인 분석 완료 → 플레너 설계 검증 대기

## 현재 상태 분석

### 근본 원인: Discord Bot 구현 부재

**발견된 사실:**
- ✅ Discord Webhook URL 설정됨 (pages/api/discord-notify.js)
- ✅ 일방향 알림 기능 존재 (BM 고장, PM 완료 이벤트)
- ❌ **Discord Bot Token 설정 없음**
- ❌ **Incoming Message Handler 없음**
- ❌ **AI Agent Message Processor 없음**
- ❌ **Channel Router/Gateway 없음**

### 현황도
```
FMS Portal → [Webhook] → Discord #pm-알림, #bm-알림 ✅ (단방향)
Discord Channel → [요청] → ??? ❌ (응답 불가)
```

**왜 #비서-secretary가 답변 안 함:**
1. Discord 봇이 메시지 이벤트를 수신하지 않음
2. OpenClaw Message Tool로는 Discord를 직접 수신할 수 없음
3. 채널에 할당된 AI 에이전트가 메시지 처리 로직 없음

## 권장 아키텍처

### 각 AI 에이전트 독립 운영 모델

```
#비서-secretary
├─ Incoming: Discord 메시지 → Telegram 실시간 동기화
├─ Processing: 상태 리포트, 일정 안내, 팀 조율
└─ Outgoing: [응답] → Discord + [동기] → Telegram

#번역기-translator
├─ Incoming: 번역 요청 (한↔영)
├─ Processing: 번역 수행
└─ Outgoing: 번역 결과 + 용어 검증

#데이터분석가-data-analyst
├─ Incoming: 파일 분석 요청 (Excel/CSV)
├─ Processing: KPI, 추세 분석
└─ Outgoing: 분석 결과 + 차트

#웹개발자-web-dev
├─ Incoming: 개발 이슈, 코드 리뷰 요청
├─ Processing: 구현, 버그 수정
└─ Outgoing: 코드 변경사항, 배포 진행상황
```

## 구현 체크리스트

### Phase 1: Bot 기반 구조
- [ ] Discord Bot Token 설정 (DISCORD_BOT_TOKEN in .env.local)
- [ ] Discord Interactions 엔드포인트 (pages/api/discord-gateway.ts)
- [ ] Signature 검증 (X-Signature-Ed25519)
- [ ] Intent 필터링 (message_create 이벤트만)

### Phase 2: Channel Processors (4개)
- [ ] Secretary Processor — 팀 일정, 작업 추적
- [ ] Translator Processor — 문서 번역, 용어 검증
- [ ] Analyst Processor — 데이터 분석, KPI 리포트
- [ ] Developer Processor — 기술 상담, 코드 리뷰

### Phase 3: Telegram 동기화
- [ ] lib/discord/telegram-sync.ts
- [ ] msg#1234 스레드 실시간 미러링
- [ ] 양방향 메시지 흐름

## 기대 효과

- 팀 소통 효율 30% ↑
- Telegram + Discord 양방향 동기화 100%
- 응답시간 <2초
- 메시지 손실률 0%

## 상태
🟡 **설계 완료** → 플레너 아키텍처 설계(project_discord_bot_integration.md)와 연계
