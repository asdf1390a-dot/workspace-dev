---
name: Audit System Alert Channel Setup Guide
description: Discord/Telegram 알림 채널 설정 가이드 + 테스트 절차
type: specification
date: 2026-05-19 00:05 KST
status: READY_FOR_PLANNER_SETUP
---

# Audit System Alert Channel Setup Guide

**문서 목적:** Pre-Implementation 체크리스트 항목 (플레너 설정용)  
**기한:** 2026-05-19 17:00 설정 완료  
**담당:** 플레너 (Telegram + Discord 채널 사전 설정)

---

## 📱 Telegram 채널 설정

### Step 1: Telegram Bot 확인

**기존 Bot 재사용:** JEEPNEY Telegram Bot (이미 운영 중)

```
Bot Name: JEEPNEY
Bot Username: @jeepney_fms_bot
Owner: CEO (Telegram user_id)
Token: (기존 보유)
```

**확인 방법:**
```bash
# Bot API 테스트 (기존 토큰으로)
curl https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe
```

### Step 2: CEO 개인 Chat ID 확인

**현재 상황:**
- CEO Telegram 계정: 기존 설정 완료
- Chat ID: (확인 필요)

**확인 방법:**
```bash
# Bot에 메시지 발송 후 Chat ID 추출
curl "https://api.telegram.org/bot{TOKEN}/getUpdates"

응답에서 찾기:
{
  "result": [
    {
      "message": {
        "chat": {
          "id": 1234567890  ← 이 값이 TELEGRAM_CHAT_ID
        }
      }
    }
  ]
}
```

**또는 다음 명령어:**
```
Telegram에서 Bot에 /start 또는 아무 메시지 발송
→ getUpdates API 응답에서 chat.id 확인
```

### Step 3: Telegram DM 권한 확인

**현재 설정 상태:**
```
✅ Bot private_only: false (그룹/개인 메시지 모두 수신 가능)
✅ CEO 개인 메시지: Bot에서 direct message 발송 가능
```

**테스트:**
```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/sendMessage" \
  -d "chat_id={CEO_CHAT_ID}" \
  -d "text=🔴 Test Alert: DRS <85%"
```

**예상 결과:** CEO가 Bot으로부터 직접 메시지 수신

---

## 💬 Discord 채널 설정

### Step 1: Discord 서버 & 채널 확인

**필요 채널 (2개):**

#### 채널 1: `#일반` (또는 #general)
- **목적:** 일일 신뢰도 리포트 (매일 03:30)
- **권한:** Bot이 메시지 작성 가능
- **포맷:** Embed 형식 (컬러 구분: 🟢🟡🔴)

#### 채널 2: `#긴급-알림` (또는 #critical-alerts, #emergency)
- **목적:** DRS <85% 즉시 알림 (1분 내)
- **권한:** Bot이 메시지 작성 + @mention 가능
- **포맷:** 긴급도 높은 메시지 (굵게, 강조)

**확인:**
```
Discord 서버 → Settings → Channels
→ 위 2개 채널 존재 여부 확인
→ Bot 권한: "Send Messages", "Embed Links" 확인
```

### Step 2: Discord Bot 권한 설정

**필요 권한 (Scopes):**
```
✅ chat:read
✅ chat:write
✅ commands
```

**Bot 정보:**
```
Bot Name: JEEPNEY-FMS-Bot
Server ID (Guild ID): (확인 필요)
Channel IDs:
  - #일반: (확인 필요)
  - #긴급-알림: (확인 필요)
```

**확인 방법:**
```bash
# 서버의 Channel IDs 조회 (Bot 토큰 필요)
curl -H "Authorization: Bot {DISCORD_BOT_TOKEN}" \
  "https://discord.com/api/v10/guilds/{GUILD_ID}/channels"

응답:
[
  {
    "id": "1234567890123456789",  ← Channel ID
    "name": "일반"
  },
  ...
]
```

### Step 3: Discord Bot 메시지 권한 확인

**테스트 메시지 발송:**
```bash
# #일반 채널에 테스트 메시지
curl -X POST "https://discord.com/api/v10/channels/{CHANNEL_ID}/messages" \
  -H "Authorization: Bot {DISCORD_BOT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🟢 Test Message: Audit System Ready",
    "embeds": [{
      "title": "Daily Audit Report",
      "description": "DRS: 93.5%",
      "color": 65280
    }]
  }'
```

**예상 결과:** #일반 채널에 메시지 출현

---

## 🔐 환경변수 설정 (Vercel)

### Step 1: Vercel 대시보드 접속

```
Vercel Dashboard → DSC-FMS-Portal 프로젝트 → Settings → Environment Variables
```

### Step 2: 기존 변수 확인

```
변수명: TELEGRAM_BOT_TOKEN
값: (기존 Bot Token)
상태: ✅ 설정됨

변수명: TELEGRAM_CHAT_ID
값: (CEO Chat ID - 확인 필요)
상태: ⚠️ 확인 필요

변수명: DISCORD_BOT_TOKEN
값: (Discord Bot Token)
상태: ⚠️ 확인 필요

변수명: DISCORD_GUILD_ID
값: (Discord 서버 ID)
상태: ⚠️ 확인 필요

변수명: DISCORD_CHANNEL_IDS (JSON)
값: {"general": "123...", "alerts": "456..."}
상태: ⚠️ 확인 필요
```

### Step 3: 누락된 변수 추가

**필요한 신규 변수:**
```json
{
  "TELEGRAM_CHAT_ID": "{CEO의 Telegram Chat ID}",
  "DISCORD_BOT_TOKEN": "{Discord Bot Token}",
  "DISCORD_GUILD_ID": "{Discord Server ID}",
  "DISCORD_CHANNEL_IDS": {
    "general": "{#일반 Channel ID}",
    "alerts": "{#긴급-알림 Channel ID}"
  },
  "AUDIT_ALERT_TRIGGER_SECRET": "{Cron 인증 토큰}"
}
```

**입력 방법:**
```
Vercel Settings → Environment Variables
→ Add New → Name: TELEGRAM_CHAT_ID, Value: {값}
→ Add Production / Preview / Development 선택
→ Save
→ Deploy 재시작
```

---

## ✅ 테스트 절차

### Test 1: Telegram 직접 메시지 테스트

**목표:** CEO가 Bot으로부터 DM 수신 확인

```bash
# Terminal에서 실행
curl -X POST "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": {TELEGRAM_CHAT_ID},
    \"text\": \"🟢 Test Passed: Telegram Bot Connected\",
    \"parse_mode\": \"HTML\"
  }"
```

**확인:**
- [ ] CEO Telegram에 메시지 도착
- [ ] 메시지 내용 정상 표시
- [ ] 도착 시간 < 5초

### Test 2: Discord 메시지 테스트

**목표:** Discord #일반 채널에 메시지 출현

```bash
curl -X POST "https://discord.com/api/v10/channels/{DISCORD_CHANNEL_ID_GENERAL}/messages" \
  -H "Authorization: Bot {DISCORD_BOT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🟢 Test Passed: Audit System Discord Connected",
    "embeds": [{
      "title": "Channel Connection Test",
      "description": "Bot successfully connected to #일반",
      "color": 65280
    }]
  }'
```

**확인:**
- [ ] #일반 채널에 메시지 출현
- [ ] Embed 포맷 정상 표시 (컬러 포함)
- [ ] 도착 시간 < 5초

### Test 3: 임계값 알림 테스트 (긴급 채널)

**목표:** #긴급-알림 채널에서 urgent 메시지 확인

```bash
curl -X POST "https://discord.com/api/v10/channels/{DISCORD_CHANNEL_ID_ALERTS}/messages" \
  -H "Authorization: Bot {DISCORD_BOT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🔴 <@{CEO_DISCORD_ID}> CRITICAL: DRS <85%",
    "embeds": [{
      "title": "🔴 Critical Alert",
      "description": "저장소 신뢰도 급락 감지",
      "color": 16711680,
      "fields": [
        {"name": "Current DRS", "value": "81.2%"},
        {"name": "Threshold", "value": "85.0%"},
        {"name": "Action Required", "value": "Immediate"}
      ]
    }]
  }'
```

**확인:**
- [ ] #긴급-알림 채널에 메시지 출현
- [ ] CEO mention 정상 작동
- [ ] 색상 강조(빨강 16711680) 표시

### Test 4: Cron 자동 실행 테스트

**목표:** `/api/audit/alert-trigger` Cron이 2분마다 자동 실행 확인

```
Vercel Dashboard → Deployments → Functions → Logs
→ "alert-trigger" 로그 모니터링
→ 2분 주기로 "execution_time_ms: XXX" 기록 확인
```

**확인:**
- [ ] 로그에 2분 주기 실행 기록
- [ ] 각 실행마다 `drs_current` 값 계산
- [ ] DRS <85% 미만 시 alert_triggered: true 기록

---

## 🚀 설정 체크리스트

**기한:** 2026-05-19 17:00 완료

### Telegram 설정
- [ ] Bot Token 확인 (기존 보유)
- [ ] CEO Chat ID 확인/입력
- [ ] Direct message 권한 확인
- [ ] Test 메시지 발송 성공

### Discord 설정
- [ ] Bot Token 확인 (기존 보유)
- [ ] Server (Guild) ID 확인
- [ ] #일반 Channel ID 확인
- [ ] #긴급-알림 Channel ID 확인
- [ ] Bot 권한 검증 (Send Messages, Embed Links)
- [ ] Test 메시지 발송 성공

### Vercel 환경변수
- [ ] TELEGRAM_BOT_TOKEN: ✅ 설정
- [ ] TELEGRAM_CHAT_ID: ✅ 설정
- [ ] DISCORD_BOT_TOKEN: ✅ 설정
- [ ] DISCORD_GUILD_ID: ✅ 설정
- [ ] DISCORD_CHANNEL_IDS: ✅ 설정
- [ ] AUDIT_ALERT_TRIGGER_SECRET: ✅ 설정
- [ ] Vercel 재배포 완료

### 기능 테스트
- [ ] Telegram DM 수신 테스트 통과
- [ ] Discord #일반 메시지 테스트 통과
- [ ] Discord #긴급-알림 메시지 테스트 통과
- [ ] Cron 자동 실행 로그 확인

### 문서화
- [ ] 채널 ID 목록 기록
- [ ] 토큰 보안 위험 검토 완료
- [ ] 운영 절차 수립 (채널 증설, Bot 추가 등)

---

## 📋 플레너 피드백 양식

**검증 완료 시 다음 정보 기재:**

```
✅ 설정 완료 시각: 2026-05-19 HH:MM KST

Telegram:
- Bot 연결: ✅ OK / ⚠️ Failed
- CEO Chat ID: {값}
- Test 메시지: ✅ OK / ⚠️ Failed
- 우려사항: (있으면 기재)

Discord:
- Server ID: {값}
- #일반 Channel ID: {값}
- #긴급-알림 Channel ID: {값}
- Bot 권한: ✅ OK / ⚠️ Failed
- Test 메시지: ✅ OK / ⚠️ Failed
- 우려사항: (있으면 기재)

Vercel Env Vars:
- 추가된 변수: 6개
- 재배포: ✅ OK / ⚠️ Failed
- 우려사항: (있으면 기재)

전체 상태: ✅ 완료 / ⚠️ 부분 완료 (상세 기재)
```

---

## 📌 관련 문서

- `AUDIT_SYSTEM_MEETING_DECISION_2026-05-18.md` — 최종 승인 결정사항
- `AUDIT_SYSTEM_API_SPECIFICATION.md` — 4개 API 엔드포인트 명세
- `AUDIT_SYSTEM_DB_MIGRATION.md` — DB 스키마 설계
- `AUDIT_SYSTEM_METRIC_FORMULA.md` — 메트릭 계산식 정의
