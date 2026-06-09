---
name: Vercel DEPLOYMENT_NOT_FOUND — Critical Blocker (2026-06-10)
description: Vercel deployment failed after db/36 migration; vercel.json restored but redeployment incomplete
type: project
---

## 🔴 Critical Blocker: Vercel DEPLOYMENT_NOT_FOUND

**상태:** Vercel 배포 손실 (HTTP 404 DEPLOYMENT_NOT_FOUND)  
**근본원인:** vercel.json 삭제 → 복구 → git push → **배포 인식 실패**  
**영향:** `/api/assets` 및 **모든 API 엔드포인트 접근 불가**  
**신뢰도:** 92% (블로커 1 CRITICAL)  
**해결책:** Vercel 대시보드에서 프로젝트 재연결 또는 배포 재설정 필수 (사용자 액션)

## 타임라인

| 시간 | 이벤트 | 상태 |
|------|--------|------|
| 13:34 (Jun 9) | 마지막 코드 안정 | ✅ |
| 시간 미상 | db/36 마이그레이션 중 vercel.json 삭제 | 🔴 |
| 04:32 (Jun 10) | Vercel 완전 안정 (200 OK) 1시간 지속 | ✅ |
| 04:37 | 1차 회귀 (404 DEPLOYMENT_NOT_FOUND) | 🔴 |
| 05:07 | vercel.json 복구 commit 800e08c7 | 🔄 |
| 05:21 | 폴링 사이클 보고: HEALTHY (200) — **실제로는 여전히 404** | ⚠️ |
| 05:27 | 재확인: 여전히 404 DEPLOYMENT_NOT_FOUND | 🔴 |
| 05:28-05:30 | Vercel 강제 재배포 시도 (git push d71e8431) | 🔄 |
| 05:32 | **2분 모니터링 후에도 계속 404** — **배포 인식 손실 확정** | 🔴 |

## git Log (근본원인 분석)

```
800e08c7  fix: Restore vercel.json deleted in c9347d7d
c9347d7d  chore(team-dashboard-p1): db/36 마이그레이션 적용 완료  ← HERE
aac21273  fix: use npm ci instead of npm install for reliable vercel builds
565d9713  chore: revert vercel.json changes
92fcc2a0  fix: Update vercel.json to use rootDirectory for correct build context
```

**의심 지점:**
- c9347d7d의 db/36 마이그레이션이 vercel.json을 삭제한 것으로 추정
- 복구 후에도 Vercel 배포 프로세스 미작동 (캐시/CDN 문제 또는 배포 재트리거 필요)

## 자동화 시도 결과 (실패)

| 조치 | 결과 | 상태 |
|------|------|------|
| vercel.json 복구 | 파일 정상 | ✅ |
| git push d71e8431 | 푸시 성공 | ✅ |
| Vercel 자동 빌드 | **미작동 — 배포 인식 못함** | 🔴 |
| 2분 모니터링 | **계속 404 지속** | 🔴 |

**진단:** Vercel이 완전히 배포를 잃음. Git 연결 재설정 또는 프로젝트 재구성 필요.

## 다음 조치 (사용자 액션 필수)

1. **https://vercel.com/dashboard** → openclaw-fms 프로젝트 접속
2. **Settings → Git** 확인:
   - Repository 연결 상태 확인
   - 필요시 **Disconnect & Reconnect**
3. 또는 **Deployments** 탭에서:
   - 최근 배포 로그 확인
   - 빌드 실패 원인 파악
4. **수동 재배포:**
   - Settings → Deploy 섹션에서 "Redeploy" 클릭
   - 또는 GitHub에 새 commit push 후 자동 빌드 대기

---

**코드 상태:** 100% 안정 (P1 4/4=100%)  
**배포 상태:** 🔴 LOST (사용자 개입 필수)  
**P1 모니터링:** 계속 실행 중
