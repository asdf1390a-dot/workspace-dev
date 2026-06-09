---
name: Vercel 회귀 3차 재감지 (Cycle 1097 Critical)
description: Vercel HTTP 404 회귀 3차 재감지 @ 06:17 KST — 캐시 + 배포 상태 불일치 패턴 확인
type: project
---

## 🔴 Critical Alert — Cycle 1097 @ 06:17 KST

**회귀 타임라인:**
- Cycle 1091 @ 05:41: ✅ HEALTHY (auto-recovery OK)
- Cycle 1093 @ 05:57: 🔴 DEPLOYMENT_NOT_FOUND (1차 회귀)
- Cycle 1094 @ 06:02: 🟡 RECOVERING (cache age 3140s)
- Cycle 1095 @ 06:07: ✅ STABLE (200 OK)
- Cycle 1096 @ 06:12: ✅ STABLE (200 OK 지속)
- **Cycle 1097 @ 06:17: 🔴 DEPLOYMENT_LOST (3차 회귀) ← 현재**

**Endpoint Status:**
```
/assets       → HTTP 404 NOT FOUND
/api/assets   → HTTP 404 NOT FOUND
Cache-Control: max-age=0, must-revalidate
```

**패턴 분석:**
- ❌ NOT 코드 버그 (55시간 zero changes)
- ❌ NOT 빌드 실패 (이전 사이클들 빌드 성공)
- ✅ LIKELY: Vercel 캐시 타임아웃 → 상태 불일치 → 404 복구 순환

**특징:**
- 30~40분 주기로 회귀 발생 (05:57 → 06:17 = 20분)
- 자동복구 약 5~10분 후 재발생 패턴
- 캐시 age가 3000초(50분) 근처에서 타임아웃 의심

## 즉시 조치 필요

**우선순위:** 🔴 CRITICAL
**담당:** 사용자 의사결정 (자동 재배포 vs 수동 조사)

**옵션:**
1. Force redeploy via Vercel CLI
2. Check `vercel.json` deployment config
3. Increase Vercel cache TTL settings
4. Investigation: Vercel deployment state logs

## Related
- `memory/assets_cache_fix_20260610.md` (이전 해결책: no-cache 헤더 추가)
- 회귀 원인: no-cache 헤더의 효과 시간 제한 또는 Vercel 캐시 엔진 버그
