# CTB 폴링 사이클 @ 11:42 KST (2026년 06월 18일)

**폴링 시간:** 2026-06-18 11:42 KST (02:42 UTC)

## 상태 스냅샷

| P1 서비스 | HTTP 코드 | 상태 | 지속 시간 |
|----------|----------|------|---------|
| Main Portal | 404 | 🔴 DOWN | 65h+ |
| Audit Portal | 404 | 🔴 DOWN | 65h+ |
| Discord Bot | 404 | 🔴 DOWN | 65h+ |
| Travel Management | 404 | 🔴 DOWN | 65h+ |

**통계:**
- **P1 가용률:** 0/4 (0%)
- **신뢰도:** 0%
- **블로커:** 2건 CRITICAL (Vercel 배포 + GitHub PAT/Vercel 토큰)
- **상태 변화:** 무변화 (지속 DOWN)

## 근본원인

Vercel 배포 실패 (DEPLOYMENT_NOT_FOUND). GitHub PAT + Vercel 토큰 필수로 재배포 불가능.

## 사용자 액션 필요

1. **GitHub PAT 재생성** (5분)
   - 링크: https://github.com/settings/tokens
   - 방법: "Generate token (classic)" → `repo`, `workflow` 스코프 체크 → 복사

2. **Vercel 토큰 생성** (5분)
   - 링크: https://vercel.com/account/tokens
   - 방법: "Create token" → 복사

**제공 후:** 자동화로 배포 재시작 및 P1 복구 진행.

## 마감

약 17시간 남음 (2026-06-18 21:00 KST 예상).

---

**다음 폴링:** 2026-06-18 11:47 KST (5분 후)
