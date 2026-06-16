---
name: C-1 Deployment Recovery (Manual Vercel Setup)
description: 30분 실행 가이드 - Vercel 대시보드에서 3개 프로젝트 수동 생성
timestamp: 2026-06-16 17:45 KST
status: READY_FOR_EXECUTION
---

# C-1 배포 복구 가이드 (30분)

## 📋 상황 요약
- **현재:** Main Portal ✅ UP (1/4) | AUDIT-P1 ❌ DOWN | DISCORD-BOT-P1 ❌ DOWN | TRAVEL-P2-UI ❌ DOWN
- **원인:** 3개 서비스가 Vercel 프로젝트로 존재하지 않음 (DEPLOYMENT_NOT_FOUND)
- **코드 상태:** ✅ 완성됨 (dsc-fms-portal 내 /audit, /discord, /travels 페이지 + API 모두 구현)
- **배포 방법:** Vercel 대시보드에서 3개 프로젝트 생성 + GitHub 링크 설정

---

## 🎯 목표
**30분 내에 3/4 P1 배포 완료 → 팀원 11명의 개발 재개 가능**

---

## ⏱️ 실행 단계 (총 30분)

### **Step 1: Vercel 대시보드 접속 (2분)**

1. https://vercel.com/dashboard 접속
2. 기존 프로젝트 확인:
   - ✅ `dsc-fms-portal` (Main Portal) — 이미 존재
   - ❌ `dsc-audit-p1` — 생성 필요
   - ❌ `dsc-discord-bot-p1` — 생성 필요
   - ❌ `dsc-travel-p2-ui` — 생성 필요

---

### **Step 2: 첫 번째 프로젝트 생성 — AUDIT-P1 (10분)**

#### 2-1. 새 프로젝트 생성
1. Vercel 대시보드 우측 상단 **"+ Add New..."** 클릭
2. **"Project"** 선택
3. **"Import Git Repository"** 클릭

#### 2-2. GitHub 저장소 선택
1. **Repository:** `asdf1390a-dot/workspace-dev` 선택
2. **Project Name:** `dsc-audit-p1` 입력
3. **Root Directory:** `./dsc-fms-portal` 입력 ⚠️ **중요**
4. **Framework Preset:** `Next.js` 자동 선택 확인

#### 2-3. 환경 변수 설정
Vercel 프로젝트 설정 페이지에서:
```
NEXT_PUBLIC_SUPABASE_URL = [GitHub Secrets에서 값 복사]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [GitHub Secrets에서 값 복사]
SUPABASE_SERVICE_ROLE_KEY = [GitHub Secrets에서 값 복사]
```

**다음 값들은 기존 dsc-fms-portal 프로젝트에서 확인 가능:**
- Vercel Dashboard → dsc-fms-portal → Settings → Environment Variables

#### 2-4. 배포 트리거
1. **"Deploy"** 버튼 클릭
2. 배포 완료 대기 (약 3-5분)
3. ✅ 완료 확인: https://dsc-audit-p1.vercel.app 에서 HTTP 200 확인

---

### **Step 3: 두 번째 프로젝트 생성 — DISCORD-BOT-P1 (10분)**

Step 2와 동일한 과정:
- **Project Name:** `dsc-discord-bot-p1`
- **Root Directory:** `./dsc-fms-portal`
- **환경 변수:** Step 2-3과 동일
- **검증:** https://dsc-discord-bot-p1.vercel.app HTTP 200 확인

---

### **Step 4: 세 번째 프로젝트 생성 — TRAVEL-P2-UI (10분)**

Step 2와 동일한 과정:
- **Project Name:** `dsc-travel-p2-ui`
- **Root Directory:** `./dsc-fms-portal`
- **환경 변수:** Step 2-3과 동일
- **검증:** https://dsc-travel-p2-ui.vercel.app HTTP 200 확인

---

## ✅ 검증 체크리스트

완료 후 다음을 실행하여 확인:

```bash
curl -I https://dsc-fms-portal.vercel.app
curl -I https://dsc-audit-p1.vercel.app
curl -I https://dsc-discord-bot-p1.vercel.app
curl -I https://dsc-travel-p2-ui.vercel.app
```

**모두 HTTP 200이면 성공** ✅

---

## 🔄 다음 단계 (자동화 개선 — 24시간)

C-1 완료 후 2026-06-17 00:00 KST부터:
1. **모니터링 검증 개선** — 거짓 신호 0건 목표
2. **자동 에스컬레이션** — 배포 실패 시 자동 알림
3. **다중채널 검증** — Discord + Telegram 동시 확인

---

## ⚠️ 주의사항

### 환경 변수를 놓친 경우
```
Error: 'NEXT_PUBLIC_SUPABASE_URL' is not defined
```
→ Step 2-3 재확인 (Vercel 프로젝트 Settings → Environment Variables)

### Root Directory를 잘못 지정한 경우
```
Error: No build output detected
```
→ Root Directory를 `./dsc-fms-portal` 으로 변경하고 Redeploy

### GitHub Actions 배포 설정
Step 1-4 완료 후:
- GitHub Secrets에 다음 설정 필요:
  - `VERCEL_TOKEN` (Vercel 계정 토큰)
  - `VERCEL_ORG_ID` (조직 ID)
  - `VERCEL_PROJECT_ID` (프로젝트 ID)

---

## 📞 긴급 지원
- Vercel 상태: https://vercel.com/status
- GitHub Actions 로그: https://github.com/asdf1390a-dot/workspace-dev/actions
- 로컬 테스트: `npm run dev` (dsc-fms-portal 디렉토리에서)

---

**예상 완료 시간:** 2026-06-16 18:15 KST  
**팀 개발 재개:** 2026-06-16 18:20 KST
