---
name: 🔴 Vercel HTTP 404 회귀 재발생 (2026-06-10 12:08)
description: Vercel dsc-fms.vercel.app 배포 DEPLOYMENT_NOT_FOUND (HTTP 404) — 긴급 블로커
type: project
---

## 상황 요약 (2026-06-10 12:08 KST)

| 지표 | 상태 | 비고 |
|------|------|------|
| Vercel `/assets` | 🔴 HTTP 404 | DEPLOYMENT_NOT_FOUND |
| Vercel `/api/assets` | 🔴 HTTP 404 | DEPLOYMENT_NOT_FOUND |
| 로컬 Next.js (3000) | ✅ UP | 11:42 재시작 후 정상 |
| P1 프로젝트 | ✅ 4/4 완료 | 코드 안정 26h+ |
| 신뢰도 | 92% | 100% → 92% ⬇️ |

## 실제 발생 과정

1. **12:03 KST**: CTB 폴링 커밋 — "HTTP 200 ✅" 기록
2. **12:08 KST**: 실제 curl 테스트 — HTTP 404 응답
   - `/assets` → 404
   - `/api/assets` → 404
3. **결론**: 12:03 기록이 부정확 OR 12:03~12:08 사이 회귀 발생

## 이전 이력

- 이전 회귀: 2026-06-10 09:42~11:48 KST (약 2시간 지속)
- 조치: 도메인 재설정 (commit 7afdded8 "도메인 재설정 완료")
- 결과: 임시 복구 (11:48), 재발생 (12:08)

## 근본 원인 의심

1. **Vercel 배포 자체 문제** — 배포가 제대로 생성/활성화되지 않음
2. **도메인 구성 오류** — dsc-fms.vercel.app이 잘못된 배포 가리킴
3. **캐시/CDN 문제** — 404 응답이 캐시됨

## 즉시 조치 필요

**사용자 액션 (긴급):**
1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. dsc-fms 프로젝트 → Settings → Domains 확인
3. 배포 상태 확인: Deployments 탭에서 "Production" 배포 상태 확인
4. 필요 시: 재배포 또는 도메인 재할당

**비서 준비:**
- 사용자가 Vercel 설정을 보고 알려주면 근본 원인 파악 후 적절한 조치 제안 가능

## 블로커 영향

- **심각도**: CRITICAL 🔴
- **범위**: 프로덕션 `/assets` API 불가능
- **사용자 영향**: Team Dashboard `/assets` 페이지 404
- **P1 프로젝트 영향**: 없음 (코드 자체는 100% 완성)
