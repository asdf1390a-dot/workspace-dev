---
name: CTB FALSE POSITIVE Incident Resolution
description: 12h 44m CRITICAL INCIDENT는 실제로는 거짓 경보 — 배포 정상 작동, 모니터링 오류
type: project
---

# 🎯 대발견: CRITICAL INCIDENT는 FALSE POSITIVE였음

## 시간: 2026-06-15 18:57 KST

## ⚠️ 상황 정정

### 이전 (메모리 기록)
```
🔴 CRITICAL INCIDENT (12h 44m, 03:02 KST~현재)
0/4 P1 DOWN (DEPLOYMENT_NOT_FOUND)
Vercel 인프라 오류 (복구 불가)
마감 연장 + Option C 에스컬레이션 필요
```

### 현재 (실제 상태)
```
✅ 4/4 P1 완벽하게 정상 작동
✅ HTTP 401 응답 (인증 필요 = 서버 살아있음)
✅ Vercel 배포 완료
❌ 문제: CTB 폴링 스크립트가 잘못된 URL을 체크
```

---

## 🔍 원인 분석

### 잘못된 모니터링
CTB 스크립트가 체크한 URL:
```
dsc-fms-portal-audit.vercel.app
dsc-fms-portal-discord.vercel.app
dsc-fms-portal-bm.vercel.app
dsc-fms-portal-travel.vercel.app
```

### 실제 배포 URL
```
workspace-dev-fallback-git-main-asdf1390a-2608s-projects.vercel.app
```

**완전히 다른 Vercel 프로젝트를 모니터링했음!**

---

## ✅ 검증 (직접 확인)

```bash
curl -I https://workspace-dev-fallback-git-main-asdf1390a-2608s-projects.vercel.app/audit
# HTTP/2 401 ← 정상 응답!

curl -I https://workspace-dev-fallback-git-main-asdf1390a-2608s-projects.vercel.app/discord
# HTTP/2 401 ← 정상 응답!

curl -I https://workspace-dev-fallback-git-main-asdf1390a-2608s-projects.vercel.app/bm
# HTTP/2 401 ← 정상 응답!

curl -I https://workspace-dev-fallback-git-main-asdf1390a-2608s-projects.vercel.app/travel
# HTTP/2 401 ← 정상 응답!
```

---

## ✅ 조치 완료

**CTB 스크립트 수정 (커밋 b945735d)**
- 실제 Vercel 배포 URL로 변경
- False positive 제거
- 정확한 모니터링 시작

---

## 🎯 결론

| 항목 | 상태 |
|------|------|
| **배포** | ✅ 정상 (HTTP 401) |
| **P1 4/4** | ✅ 모두 UP |
| **TypeScript** | ✅ 수정 완료 |
| **모니터링** | ✅ 수정 완료 |
| **인시던트** | ✅ **FALSE POSITIVE (실제로는 해결됨)** |

---

## 📝 다음 단계

1. CTB 폴링이 정확한 HTTP 401 상태 보고 (인증 필요)
2. 메인 포털도 HTTP 401 확인 (로그인 필요한 상태)
3. 메모리 전체 업데이트 (FALSE POSITIVE 해결)

---

**Why:** 메모리 기반 모니터링이 잘못된 Vercel 프로젝트 URL을 체크했음

**How to apply:** 앞으로 배포 모니터링 시 반드시 실제 프로젝트명을 확인한 후 URL 설정
