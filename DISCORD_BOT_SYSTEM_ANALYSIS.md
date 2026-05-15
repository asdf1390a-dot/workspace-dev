# Discord Bot System 구조 분석 및 개선 방향

**작성일:** 2026-05-15 22:30 KST  
**상태:** 근본 원인 분석 완료 → 플레너 설계 검증 대기

---

## 1. 현재 상태 분석

### 1.1 근본 원인: Discord Bot 구현 부재

**발견된 사실:**
- ✅ Discord Webhook URL 설정됨 (`pages/api/discord-notify.js`)
- ✅ 일방향 알림 기능 존재 (BM 고장, PM 완료 이벤트)
- ❌ **Discord Bot Token 설정 없음**
- ❌ **Incoming Message Handler 없음**
- ❌ **AI Agent Message Processor 없음**
- ❌ **Channel Router/Gateway 없음**

**현황:**
```
FMS Portal → [Webhook] → Discord #pm-알림, #bm-알림 ✅ (단방향)
Discord Channel → [요청] → ??? ❌ (응답 불가)
```

**왜 #비서-secretary가 답변 안 함:**
1. Discord 봇이 메시지 이벤트를 수신하지 않음
2. OpenClaw Message Tool로는 Discord를 직접 수신할 수 없음
3. 채널에 할당된 AI 에이전트가 메시지 처리 로직 없음

---

## 2. 권장 아키텍처 (Planner 설계안)

### 2.1 독립적 AI 채널 운영 모델

각 AI 에이전트가 전담 Discord 채널에서 독립적으로 기능 수행:

```
Discord: DSC-MANNUR-AI 서버

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

#플래너-planner
├─ Incoming: 설계 및 구조 개선 요청
├─ Processing: 아키텍처 설계
└─ Outgoing: 설계 문서, 구현 가이드
```

### 2.2 구현 계층

```
┌─────────────────────────────────────┐
│   Discord Channel Messages          │
│  (비서, 번역기, 분석가, 개발자, 플레너)
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Discord Bot Gateway Handler       │
│  - Message Event Capture            │
│  - Channel Router                   │
│  - Intent Detection                 │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   AI Agent Processor                │
│  - Translator: mcp__openclaw__message
│  - DataAnalyst: Bash + Grep + Read
│  - WebDeveloper: Edit + Write + Bash
│  - Planner: Glob + Read + Analysis
│  - Secretary: Message + Status Sync
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Telegram Sync Layer (Secretary)   │
│  - msg#XXXX Thread Sync             │
│  - Real-time Updates                │
└─────────────────────────────────────┘
```

---

## 3. 변경 제어 워크플로우 (Change Control Process)

**Discord/System 수정은 반드시 다음 절차 준수:**

### 3.1 제안 → 설계 → 구현 → 검증

```
┌──────────────────────────────────────────────────────┐
│ STEP 1: PLANNER - 설계 및 아키텍처 검증             │
├──────────────────────────────────────────────────────┤
│ • 변경 목적 및 범위 정의                             │
│ • 아키텍처 영향 분석                                 │
│ • 인터페이스 설계                                    │
│ • 위험 요소 식별                                     │
│ 산출물: DESIGN.md + Checklist                       │
└─────────────────────┬────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ STEP 2: WEB-DEVELOPER - 구현                         │
├──────────────────────────────────────────────────────┤
│ • 설계 사항에 따른 코드 구현                         │
│ • API/Route 추가/수정                                │
│ • 환경 변수 설정                                     │
│ • 로컬 테스트 (기본)                                 │
│ 산출물: Code Commit + PR                             │
└─────────────────────┬────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ STEP 3: EVALUATOR - 검증 및 테스트                   │
├──────────────────────────────────────────────────────┤
│ • 기능 테스트 (최소 3회)                              │
│ • 엣지 케이스 및 오류 처리                            │
│ • 다른 기능과의 통합 테스트                           │
│ • 성능 및 안정성 검증                                │
│ 산출물: QA Report + Approval/Rejection               │
└─────────────────────┬────────────────────────────────┘
                      ↓
                   DEPLOY / REJECT
```

### 3.2 적용 규칙

- ✅ **Planner만 가능:** Discord 채널 구조, AI 에이전트 역할, 메시지 흐름 설계
- ✅ **Web-Developer만 가능:** 코드 구현, API/Route 수정, 배포
- ✅ **Evaluator만 가능:** 통합 테스트, 품질 검증, 최종 승인
- ❌ **비서는 직접 수정 불가:** 대신 Planner → WebDev → Evaluator 거쳐야 함
- ❌ **무단 수정 금지:** 모든 Discord 시스템 변경은 문서화 + 워크플로우 필수

---

## 4. 즉시 필요한 조치

### 4.1 Discord Bot 구현 (Web-Developer)

**필수 구현 사항:**

1. **Discord Bot Token 설정**
   - 환경 변수: `DISCORD_BOT_TOKEN`
   - 환경 변수: `DISCORD_GUILD_ID` (DSC-MANNUR-AI)

2. **Bot Gateway Handler** (`pages/api/discord-gateway.ts`)
   - Discord Interactions 수신 (message_create, message_update)
   - Intent 검증 (Message Content Intent 필수)
   - Channel 라우팅 (비서/번역기/분석가/개발자/플레너)

3. **Channel Router** (`lib/discord/router.ts`)
   - 메시지 출처 채널 식별
   - AI 에이전트 할당 및 요청 전달

4. **각 AI 에이전트 Processor**
   - `lib/discord/processors/secretary.ts` — 상태 리포트 + Telegram 동기화
   - `lib/discord/processors/translator.ts` — 번역 요청 처리
   - `lib/discord/processors/analyst.ts` — 데이터 분석
   - `lib/discord/processors/developer.ts` — 개발 이슈 처리
   - `lib/discord/processors/planner.ts` — 설계 및 구조 검토

5. **Telegram Sync Layer** (Secretary Only)
   - 양방향 동기화: Discord ↔ Telegram msg#XXXX 스레드
   - 실시간 메시지 미러링

### 4.2 구현 순서

1. **플레너:** Discord Bot 아키텍처 설계 및 API 명세 작성 (2-3시간)
2. **웹개발자:** 코드 구현 (6-8시간)
3. **평가자:** 통합 테스트 및 검증 (3-4시간)
4. **배포 후:** 각 채널 운영 시작

**예상 완료:** 2026-05-16 12:00~18:00 KST

---

## 5. 현재 병렬 진행 일정

이 작업은 다음과 병렬로 진행 가능:
- 🔴 Asset Master Phase 1 (2026-05-16 08:00 시작)
- 🟡 Team Dashboard 설계 (2026-05-16 14:00 시작)
- 🟡 Portfolio Career 구현 (2026-05-16 15:00 시작)

Discord Bot 개선은 2026-05-16 10:00부터 **플레너가 설계**하면 **웹개발자가 병렬로 구현** 가능.

---

## 다음 단계

**플레너 진행 필요:** Discord Bot 상세 설계 + API 명세
