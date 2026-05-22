---
name: 【사용자 액션 필수】 Telegram Secretary Chat ID 설정
description: 매일 18:00 체크포인트 보고가 블로킹됨 — Vercel 환경변수 설정 필요 (긴급, 5분)
type: user-action
priority: 🔴 immediate
created: 2026-05-22 18:11 KST
---

# 【사용자 액션 필수】Telegram Secretary Chat ID 설정

## 📍 현황

**문제:** 매일 18:00 자동 체크포인트 보고가 실패  
**원인:** Vercel 환경변수 `TELEGRAM_SECRETARY_CHAT_ID` 미설정  
**영향:** Daily Checkpoint 시스템 완전 블로킹  
**소요시간:** 약 5분

---

## 📄 필수 정보

### Chat ID 찾기
Telegram에서 본인 chat ID를 찾는 방법:

1. **BotFather에서 확인 (추천)**
   - Telegram 열기 → BotFather 검색 → `/start`
   - 기존 봇 목록 확인
   - DSC Mannur 봇 선택 → 채팅창에서 "/start" 입력
   - 응답에 chat ID 포함됨

2. **또는 직접 메시지 전송**
   - DSC Mannur 봇에 아무 메시지 전송
   - Telegram 로그 확인 시 `chat_id` 필드 확인

### Chat ID 형식
- 숫자만 (예: `1234567890`)
- 또는 음수 (그룹/채널인 경우: `-1001234567890`)

---

## ⚙️ 단계별 설정 (Vercel)

### Step 1: Vercel 대시보드 접속
```
https://vercel.com/dashboard
```

### Step 2: dsc-fms-portal 프로젝트 선택
- Projects 목록에서 "dsc-fms-portal" 클릭
- 프로젝트 대시보드 열기

### Step 3: Settings 탭 이동
- 상단 메뉴 → Settings

### Step 4: Environment Variables 선택
- 좌측 메뉴 → "Environment Variables"

### Step 5: 신규 변수 추가
- "Add New" 버튼 클릭
- **Name:** `TELEGRAM_SECRETARY_CHAT_ID`
- **Value:** 위에서 확인한 chat ID 입력 (예: `1234567890`)
- **Environment:** 모두 체크 (Production, Preview, Development)

### Step 6: 저장 & 배포
- "Save" 버튼 클릭
- Vercel 자동 재배포 대기 (약 1분)

---

## ✅ 검증

설정 후 다음 날 18:00에 Telegram으로 자동 보고 메시지 수신 확인:

```
【18:00 Checkpoint】✅ 완료
시간: HH:MM KST
상태: CTB 최종 검증
...
```

---

## 🔗 관련 파일

- **Cron Job:** `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/app/api/cron/checkpoints/18-00/route.ts`
- **Telegram Config:** `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/lib/automation/telegram-config.ts`

---

## 📞 지원

문제 발생 시:
1. Telegram BotFather에서 chat ID 재확인
2. Vercel 환경변수 값이 정확한지 확인 (공백 없음)
3. 재배포 완료 대기 후 다시 시도

