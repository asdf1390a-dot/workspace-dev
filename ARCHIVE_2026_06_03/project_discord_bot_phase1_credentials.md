---
name: Discord Bot Phase 1 인증정보 및 설정
description: Telegram ↔ Discord 양방향 동기화 Phase 1 인증정보 저장 (토큰, 퍼블릭키, 채널ID)
type: project
date: 2026-05-25 19:57 KST
status: 진행중 (3/8 변수 저장, 5개 채널 ID 대기)
---

# Discord Bot Phase 1 인증정보

**상태:** ✅ 환경변수 8/8 완료 (2026-05-25 20:00 KST)
**역할:** Telegram ↔ Discord 양방향 동기화 + CTB 실시간 업데이트
**완료 예정:** 2026-06-06

---

## ✅ 완료: 환경변수 8/8 (3개 자격증 + 5개 채널 ID)

### 자격증 (3/3)
```
DISCORD_APPLICATION_ID=[REDACTED]
DISCORD_BOT_TOKEN=[REDACTED]
DISCORD_PUBLIC_KEY=[REDACTED]
```

### 채널 ID (5/5)

```
DISCORD_CHANNEL_SECRETARY=[REDACTED]
DISCORD_CHANNEL_TRANSLATOR=[REDACTED]
DISCORD_CHANNEL_ANALYST=[REDACTED]
DISCORD_CHANNEL_DEVELOPER=[REDACTED]
DISCORD_CHANNEL_PLANNER=[REDACTED]
```

**저장 완료:** `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/.env.local` (환경변수 저장됨)

---

## 🔧 설정 단계 (진행 상황)

### 1️⃣ Bot 초대 (✅ 완료)
- ✅ OAuth URL로 서버 초대 완료
- ✅ Bot 권한(68608) 부여 완료
- 🔍 **증거:** Application ID로 확인 가능

### 2️⃣ 채널 ID 저장 (✅ 완료 2026-05-25)
- ✅ 5개 채널 ID 수집 완료
- ✅ .env.local에 자동 저장 완료 (라인 7-11)
- ✅ 파일 동기화 완료

### 3️⃣ Interactions Endpoint URL 설정 (🟡 대기중)
- 🔴 【사용자 액션 필요】 Discord Developer Portal → General Information
- URL: `https://dsc-fms.vercel.app/api/discord/interactions`
- **상태:** 사용자가 설정해야 함 (아래 참고)

---

## 【사용자 액션 필요】 — Interactions Endpoint URL 설정

### 단계
1. **📍 접속:** https://discord.com/developers/applications
2. **선택:** 대찬개발자 → General Information
3. **찾기:** "Interactions Endpoint URL" 필드
4. **입력:** `https://dsc-fms.vercel.app/api/discord/interactions`
5. **저장:** Save Changes 클릭

**⏱ 소요시간:** 2분

### 확인
설정 후 Vercel 자동 재배포 + Discord 메시지 라우팅 테스트

---

## 📋 API 라우팅 (gateway.ts)

```typescript
CHANNEL_MAPPINGS = new Map<string, ProcessorType>([
  [DISCORD_CHANNEL_SECRETARY, ProcessorType.SECRETARY],
  [DISCORD_CHANNEL_TRANSLATOR, ProcessorType.TRANSLATOR],
  [DISCORD_CHANNEL_ANALYST, ProcessorType.ANALYST],
  [DISCORD_CHANNEL_DEVELOPER, ProcessorType.DEVELOPER],
  [DISCORD_CHANNEL_PLANNER, ProcessorType.PLANNER],
]);
```

**파일:** `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/lib/discord/gateway.ts` (라인 12-18)

---

## 📦 기술 명세

| 항목 | 값 | 용도 |
|-----|-----|------|
| **Application ID** | 1503453695839309844 | OAuth 초대, 토큰 생성 |
| **Bot Token** | MTUwMzQ1MzY5... | API 요청 인증 (Discord API) |
| **Public Key** | d44d222a96... | 메시지 서명 검증 (nacl) |
| **Bot Permissions** | 68608 | MESSAGE_CONTENT, SEND_MESSAGES, EMBED_LINKS |
| **Endpoint URL** | /api/discord/interactions | Discord 웹훅 수신 |
| **메시지 저장소** | discord_messages (Supabase) | Telegram ↔ Discord 동기화 로그 |

---

## 🚀 다음 단계

1. **사용자 액션:** 5개 채널 ID 확인 + 비서에게 알림
2. **비서 액션:** .env.local 업데이트 + Vercel 배포
3. **검증:** Discord Bot 메시지 수신 테스트

---

## 참고 문서

- `project_discord_bot_phase1_design.md` — Phase 1 전체 설계
- `project_discord_bot_system.md` — API 명세 + 아키텍처
- `.env.local` — 현재 환경변수 저장소
