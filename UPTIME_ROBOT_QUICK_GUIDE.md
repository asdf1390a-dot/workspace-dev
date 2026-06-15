# ⚡ Uptime Robot 초간단 설정 (13분)

## 목표
4개 P1 Vercel 엔드포인트를 클라우드에서 독립적으로 감시

## 📋 단계별 진행

### 1️⃣ 계정 생성 (2분)
```
1. https://uptimerobot.com 방문
2. 우측 상단 'Sign Up' 클릭
3. 이메일 입력 → 비밀번호 설정
4. 확인 이메일 클릭 → 완료
```

### 2️⃣ 첫 번째 모니터: AUDIT-P1 (2분)

대시보드에서:
```
'Add Monitor' 클릭 → 다음 정보 입력:

• Monitor Type: HTTP(s)
• URL to Monitor: https://dsc-fms-portal-audit.vercel.app
• Friendly Name: AUDIT-P1
• Monitoring Interval: Every 5 minutes
• Alert Contacts: (나중에 설정 가능)

'Create Monitor' 클릭
```

### 3️⃣ 나머지 3개 모니터 (6분)

위와 같은 방식으로 추가:

**DISCORD-BOT-P1:**
- URL: `https://dsc-fms-portal-discord.vercel.app`

**BM-P1:**
- URL: `https://dsc-fms-portal-bm.vercel.app`

**TRAVEL-P2-UI:**
- URL: `https://dsc-fms-portal-travel.vercel.app`

### 4️⃣ Slack 알림 (선택사항, 3분)

```
대시보드 설정 → 'Integrations' → 'Slack'
또는
각 모니터 → 'Alert Contacts' → Slack Webhook 추가
```

## ✅ 완료

- 4개 모니터가 5분마다 자동으로 상태 확인
- DOWN 감지 시 즉시 알림
- GitHub/Vercel과 완전히 독립적

## 💰 가격

- 무료: 3개 모니터
- Pro: $9/월 (4개+)

현재 4개 필요 → **Pro 플랜 권장**

---

**소요 시간: 약 13분**  
**난이도: ⭐⭐ (아주 간단)**  
**필수: 이메일만**
