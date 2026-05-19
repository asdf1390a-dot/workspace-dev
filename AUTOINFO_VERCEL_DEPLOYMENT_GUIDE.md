---
name: Auto Info Collection Vercel 배포 가이드
description: 5개 환경변수 발급 + Vercel 설정 + 배포 실행 (5단계, 15분)
date: 2026-05-16 17:25 KST
status: 진행 중
---

# 🚀 Auto Info Collection Vercel 배포 — 실행 가이드

**⏱️ 예상 소요 시간:** 15분  
**📌 기한:** 2026-05-16 23:59  
**✅ 완료 신호:** Telegram #자동수집 채널에 첫 결과 도착

---

## 🔑 Step 1: 토큰 5개 발급 (5분)

각 플랫폼에서 토큰을 발급받습니다. **로그인 상태에서 클릭만 하면 됨.**

### 1️⃣ **GitHub Token** (2분)
```
1. 이 링크 클릭: https://github.com/settings/tokens/new
   
2. 토큰 이름: "Auto Info Collection"
   
3. Expiration: No expiration (또는 90 days)
   
4. Select scopes:
   ✅ repo (전체 선택)
   ✅ user:email
   
5. "Generate token" 클릭
   
6. 토큰 복사 (🔑 이 페이지를 떠나면 다시 볼 수 없으니 복사해둘 것)
   → 환경변수명: GITHUB_TOKEN
```

### 2️⃣ **Product Hunt Token** (2분)
```
1. 이 링크 클릭: https://www.producthunt.com/api/docs
   
2. "Sign in with Product Hunt" 클릭 (이미 로그인되어 있으면 스킵)
   
3. 페이지 오른쪽의 "Request bearer token" 또는 계정 메뉴에서 API key 생성
   
4. Bearer token 복사
   → 환경변수명: PRODUCTHUNT_TOKEN
```

### 3️⃣ **Dev.to API Key** (1분)
```
1. 이 링크 클릭: https://dev.to/settings/extensions
   
2. "Newly Generated API Key" 섹션에서 "Generate API Key" 클릭
   
3. 토큰 복사
   → 환경변수명: DEVTO_API_KEY
```

### 4️⃣ **npm Token** (선택사항, 1분)
```
1. 이 링크 클릭: https://www.npmjs.com/settings/~/tokens/new
   
2. Token type: "Automation"
   
3. "Create token" 클릭
   
4. 토큰 복사
   → 환경변수명: NPM_TOKEN
   
💡 나중에 추가 가능 (지금은 스킵해도 됨)
```

### 5️⃣ **Slack Webhook URL** (1분)
```
1. Slack 워크스페이스 열기
   
2. 이 링크: https://api.slack.com/apps → "Create New App"
   
3. App name: "Auto Info Collection"
   
4. Workspace: DSC FMS (또는 현재 워크스페이스)
   
5. "Incoming Webhooks" → 활성화
   
6. "Add New Webhook to Workspace" → #자동수집 채널 선택
   
7. Webhook URL 복사
   → 환경변수명: SLACK_WEBHOOK_URL
```

---

## 🔧 Step 2: Vercel 환경변수 설정 (3분)

### 접속
```
📍 https://vercel.com/dashboard
   → "Auto-Info-Collection" 프로젝트 클릭
```

### 설정
```
1. Settings 탭 → Environment Variables
   
2. "Add New" 버튼 (총 5번)
   
   변수 1:
   Name: GITHUB_TOKEN
   Value: (위에서 복사한 GitHub token)
   
   변수 2:
   Name: PRODUCTHUNT_TOKEN
   Value: (위에서 복사한 Product Hunt token)
   
   변수 3:
   Name: DEVTO_API_KEY
   Value: (위에서 복사한 Dev.to key)
   
   변수 4: (선택)
   Name: NPM_TOKEN
   Value: (위에서 복사한 npm token, 나중에 추가 가능)
   
   변수 5:
   Name: SLACK_WEBHOOK_URL
   Value: (위에서 복사한 Slack webhook)

3. 각 변수 추가 후 "Save" 클릭
```

---

## 🚀 Step 3: Redeploy 실행 (1분)

```
1. Vercel 대시보드에서 "Deployments" 탭 클릭
   
2. 맨 위의 최신 배포 항목 찾기
   
3. "Redeploy" 버튼 클릭 (3개 점 메뉴에 있을 수 있음)
   
4. 팝업창: "Redeploy from cache?" → "Redeploy" 클릭
   
5. 상태가 "Ready" (✅ 초록색)가 될 때까지 대기 (보통 2-3분)
```

---

## ✅ Step 4: 실행 확인 (3분)

### 로그 확인
```
1. Vercel 대시보드 → "Functions" 탭
   
2. "cron-collect" 또는 "auto-collect" 함수 클릭
   
3. 최근 로그 확인:
   ✅ "Collecting from GitHub..."
   ✅ "Collecting from ProductHunt..."
   ✅ "Collecting from Dev.to..."
   ✅ "Posting to Slack..."
   
   이 메시지들이 보이면 성공!
```

### Telegram 확인
```
1. Telegram 열기 → #자동수집 채널 (또는 DM)
   
2. 1-5분 후 다음 형식의 메시지 도착:
   
   🌐 Auto Info Collection — 2026-05-16
   
   📌 GitHub Trending (Today)
   - [프로젝트명] — ⭐ 1.2K
   - [프로젝트명] — ⭐ 800
   ...
   
   🎯 Product Hunt (Today)
   - [상품명] — ⬆️ #1
   - [상품명] — ⬆️ #5
   ...
   
   💻 Dev.to (Today)
   - [게시물] — 👍 150
   - [게시물] — 👍 120
   ...
```

---

## 🎯 Step 5: 확인 완료

```
✅ Vercel 배포 상태: Ready (초록색)
✅ Vercel Functions 로그: 4개 메시지 (GitHub/ProductHunt/DevTo/Slack)
✅ Telegram 채널: 결과 메시지 도착

→ 배포 완료! 🎉
```

---

## 📋 체크리스트

- [ ] GitHub Token 발급 및 복사
- [ ] Product Hunt Token 발급 및 복사
- [ ] Dev.to API Key 발급 및 복사
- [ ] npm Token 발급 및 복사 (선택)
- [ ] Slack Webhook URL 발급 및 복사
- [ ] Vercel 대시보드 접속
- [ ] 5개 환경변수 입력 및 저장
- [ ] Redeploy 실행
- [ ] 배포 상태: Ready 확인
- [ ] Vercel Functions 로그 확인
- [ ] Telegram 채널 결과 확인

---

## ⚠️ 문제 해결

### "Environment variables not showing"
```
→ Redeploy 후 5분 대기 (캐시 갱신 필요)
```

### "Slack webhook rejected"
```
→ Webhook URL이 `https://hooks.slack.com/services/...` 형식인지 확인
→ 채널 접근 권한 확인 (App이 채널에 초대되어 있어야 함)
```

### "GitHub API rate limit"
```
→ Token이 올바르게 설정되었는지 재확인
→ Vercel 로그에서 "401 Unauthorized" 메시지 확인
```

### Telegram에 결과가 안 옴
```
→ Slack Webhook이 제대로 설정되었는지 확인 (Slack 먼저 테스트)
→ Telegram 봇이 채널에 초대되어 있는지 확인
→ 30분 대기 후 수동으로 Functions에서 실행 (Deploy logs 탭)
```

---

## 🔑 주의사항

1. **토큰은 절대 공개하지 말 것** (GitHub, Product Hunt 등)
2. **토큰 페이지를 떠나면 다시 볼 수 없음** → 반드시 복사해두기
3. **npm Token은 선택사항** → 지금은 스킵해도 됨
4. **Slack Webhook는 일회성** → 삭제되면 새로 만들어야 함

---

**시작:** 지금 바로 Step 1부터!  
**예상 완료:** 약 15분 후

