---
name: /assets 회귀 원인 및 해결 (2026-06-09/10)
description: Vercel CDN 캐싱 버그 진단 및 2-단계 수정 (캐시 무효화 + 헤더 강화)
type: project
---

## 개요

**문제:** `/assets` 페이지가 HTTP 200 반환하지만 404 에러 페이지 렌더링 (캐시 불일치)

**발생:** 2026-06-09 23:09~23:57 KST (4회 반복 회귀)

**근본 원인:** Vercel CDN이 빌드 시점의 정적 404 응답을 **4.2시간(15206초) 캐싱** 중

## 진단 결과

### 파일 상태
- ✅ `app/assets/page.tsx`: 존재, `force-dynamic` 설정됨
- ✅ next.config.js: 정상 (빈 설정)
- ✅ 라우팅: App Router 담당 (`app/assets/` 우선)

### 캐시 분석
- HTTP 상태: 200 (캐시 hit)
- 헤더: `x-vercel-cache: HIT`, `age: 15206s`
- 본문: Next.js not-found 페이지 ("This page could not be found")
- 원인: 빌드 시 prerender 실패 → not-found fallback → CDN 캐싱

## 해결 조치

### 1순위: 캐시 무효화 + 재배포
**커밋:** `10bb447` (2026-06-10 00:03:05 KST)
```bash
date > .rebuild-trigger  # Vercel 빌드 트리거
git add .rebuild-trigger && git commit -m "chore: bust /assets vercel cache"
git push origin main
```

**효과:** 강제 재배포로 CDN 캐시 무효화

### 2순위: 응답 캐시 헤더 강화
**커밋:** `d33a796`
```typescript
// app/assets/page.tsx 추가
export const revalidate = 0;            // 항상 재검증
export const fetchCache = 'force-no-store';  // 페칭 캐시 무시
```

**효과:** 향후 재발생 방지 (캐시 강제 갱신)

## 예상 결과

- 🔴 블로커 1개 제거 → 신뢰도 92% → 100% 복구
- 🚫 회귀 패턴 차단 (자동 복구 메커니즘 강화)
- ✅ `/assets` 정상화 (배포 완료 후 확인)

## 배포 상태

- **Vercel 자동 배포:** 진행 중 (예상 2-3분)
- **보안 체크포인트:** 활성화 (정상 — curl 봇 차단)
- **ETA:** 2026-06-10 00:10 KST 경

## 참고

**3순위 (장기):** Pages/App Router 라우팅 정리
- `pages/assets/[assetId]/`, `pages/assets/edit/` vs `app/assets/`
- 충돌 위험성 → CLAUDE.md와 실제 라우팅 통일 필요
