---
name: Vercel 도메인 미동기 문제 진단
description: dsc-fms.vercel.app 도메인이 무효한 배포를 가리켜 HTTP 404 반환 — 근본원인 파악 및 해결책
type: project
---

# 🔴 Vercel 도메인 미동기 문제 (2026-06-10 09:27 KST)

**상태:** 긴급 (블로킹 1건)

## 증상
- 모니터링 URL: `https://dsc-fms.vercel.app/assets` → HTTP 404
- 에러: `x-vercel-error: DEPLOYMENT_NOT_FOUND`
- 시작: 2026-06-10 09:12 KST (cycle 1120)
- 영향: 폴링 신뢰도 92% ↓

## 근본원인

### 발견
```bash
# Vercel CLI 조회 결과
vercel alias ls  # dsc-fms.vercel.app 없음 (0개 도메인)
curl -I https://dsc-fms.vercel.app  # HTTP 404, x-vercel-error: DEPLOYMENT_NOT_FOUND
```

### 실제 상황
1. **최신 배포:** `dsc-fms-portal-l7zx6mz2s-asdf1390a-2608s-projects.vercel.app` (52분 전, Ready ✅)
2. **등록된 도메인:**
   - `dsc-fms-portal.vercel.app` ✅ (35일 전 설정, HTTP 200 정상)
   - `dsc-fms-portal-asdf1390a-2608s-projects.vercel.app` ✅
   - `dsc-fms-portal-git-main-asdf1390a-2608s-projects.vercel.app` ✅
3. **문제:** `dsc-fms.vercel.app` → Vercel에 미등록 또는 무효한 배포 가리킴

## 해결책

**Option A: 도메인 별칭 추가 (추천)** — 사용자 액션
```bash
# dsc-fms.vercel.app를 현재 배포에 연결
vercel alias add dsc-fms-portal-l7zx6mz2s-asdf1390a-2608s-projects.vercel.app dsc-fms.vercel.app
```

**Option B: 모니터링 URL 변경** — 자동화 수정
- 모니터링 스크립트에서 `dsc-fms.vercel.app` → `dsc-fms-portal.vercel.app` 변경
- (이미 작동하는 URL이므로 즉시 복구 가능)

**Option C: 통합 (권장)** 
1. 도메인 별칭 추가 (Option A)
2. 모니터링도 `dsc-fms-portal.vercel.app` 사용으로 전환 (이중화)

## 검증

```bash
# 현재 정상 동작
curl https://dsc-fms-portal.vercel.app/assets  # HTTP 200 ✅
curl https://dsc-fms-portal-l7zx6mz2s-asdf1390a-2608s-projects.vercel.app/assets  # HTTP 200 ✅

# 현재 실패
curl https://dsc-fms.vercel.app/assets  # HTTP 404 ❌
```

## 영향도
- 폴링 신뢰도: 92% (cycle 1120부터 회귀)
- 블로킹: 1건 (도메인 재구성 필요)
- P1 코드: 100% 정상 (배포 이슈만, 코드 이슈 아님)

## 타임라인
| 시간 | 사건 |
|------|------|
| 09:07 KST | 마지막 정상 (HTTP 200, 19.5h+ continuous) |
| 09:12 KST | 회귀 시작 (HTTP 404) |
| 09:27 KST | 근본원인 진단 완료 (도메인 미동기) |

## 다음 액션
1. 【사용자 액션】Vercel CLI로 도메인 별칭 추가 (Option A)
   또는
2. 【자동화】모니터링 URL을 dsc-fms-portal.vercel.app로 변경

**긴급도:** 🔴 CRITICAL — 폴링 차단 중

---

**진단:** 2026-06-10 09:27 KST 폴링 사이클 1123
**담당:** 사용자 또는 자동화 팀
