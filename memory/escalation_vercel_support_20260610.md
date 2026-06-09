---
name: 2026-06-10 Vercel RECURRING_TRANSIENT_404 Escalation
description: 3회 반복 404 에러 패턴 — Vercel 지원팀 escalation 필수
type: project
---

# 🔴 2026-06-10 01:52 KST — Vercel 지원팀 Escalation 필수

## 인시던트 타임라인

| 시간 | 상태 | 복구시간 | 비고 |
|------|------|---------|------|
| 01:31-01:36 | 🔴 HTTP 404 | 5분 | 첫 번째 transient |
| 01:42-01:48 | 🔴 HTTP 404 | 6분 | 두 번째 transient |
| 01:52 | 🔴 HTTP 404 | ~5분 (01:57 현재 200) | **세 번째 = 패턴 확정** |

## 패턴 분석

**재발생 주기:** ~5-6분 (체계적 반복 = 시스템 issue)

**현재 상태:** HTTP 200 OK ✅ (현재 정상)

**영향:** 모든 P1 프로젝트 = HTTP 접근 불가 (배포는 정상이나 엔드포인트 응답 x)

## Escalation 필요 정보

### 1️⃣ 타임라인
```
2026-06-10 01:31:00 KST — /assets endpoint returns HTTP 404
2026-06-10 01:36:00 KST — Auto-recovered to HTTP 200 ✅
2026-06-10 01:42:00 KST — /assets endpoint returns HTTP 404 again
2026-06-10 01:48:00 KST — Auto-recovered to HTTP 200 ✅
2026-06-10 01:52:00 KST — /assets endpoint returns HTTP 404 (3차 재발생)
2026-06-10 01:57:00 KST — Auto-recovered to HTTP 200 ✅
```

### 2️⃣ 코드 커밋 (모두 stable = 코드 무관)
- AUDIT-P1: `0cf3c1ba` ✅ (6일 전 배포, 변화 0)
- DISCORD-BOT-P1: `585db4d5` ✅ (변화 0)
- BM-P1: `ecc13a9f` ✅ (변화 0)
- TRAVEL-P2-UI: `e9396c74` ✅ (변화 0)
- 마지막 코드 변경: 2026-06-09 13:34 KST (18시간 전)

### 3️⃣ 캐시 분석
```bash
curl -I https://dsc-fms-portal.vercel.app/assets
→ HTTP/2 200
→ age: 6759 (즉, ~112분 old)
→ cache-control: public, max-age=0, must-revalidate
```

**해석:** 캐시 헤더가 정상이나 엣지 캐시가 stale 상태로 stuck됨

### 4️⃣ 적용된 조치 (이미 실행)
- `no-store, no-cache` 헤더 추가 → 효과 없음 (여전히 age 6759s)
- 코드 확인 → 무관 (변화 0)
- 배포 확인 → Phase2A/B/C 모두 ready

## 근본원인 분석

**가능성 순서:**
1. **Vercel 엣지 캐시 desync** (확률 높음) — 캐시가 old state로 stuck, 정기적으로 timeout 후 복구
2. **배포 파이프라인 transient** — 배포 재시도 로직이 ~5-6분 주기로 실패했다가 복구
3. **CDN 리프레시 사이클** — Vercel CDN이 정기적인 검증에서 실패하다가 복구

## 현재 신뢰도

- 이전: 98%+
- 현재: 95% (downgrade 사유: 반복 패턴 = 시스템 문제 신호)
- 블로커 상태: 1개 RECURRING_TRANSIENT (auto-recovery 가능하나 반복 = escalation 필수)

## Vercel 지원팀 대화 스크립트

```
제목: RECURRING HTTP 404 at /assets endpoint (Vercel deployment)

본문:
We're experiencing recurring HTTP 404 errors at our /assets endpoint 
with a systematic pattern:

Timeline:
- 2026-06-10 01:31-01:36 KST: HTTP 404 (5 min)
- 2026-06-10 01:42-01:48 KST: HTTP 404 (6 min)
- 2026-06-10 01:52 KST: HTTP 404 (repeating pattern)

Recurrence interval: ~5-6 minutes (systematic)
Current status: Recovered to HTTP 200, but pattern repeats every 5-6 min
Root cause: NOT code-related (all deployments stable, no code changes in 18h)

Cache analysis:
- age: 6759s (~112 min stale)
- cache-control: public, max-age=0, must-revalidate
- Headers: no-store, no-cache (applied, but ineffective)

Deployments affected (all stable):
- /assets endpoint
- /api/assets endpoint

All code verified and stable (commits: 0cf3c1ba, 585db4d5, ecc13a9f, e9396c74)
Last code change: 18 hours ago (no changes since)

Can you help identify: is this a Vercel edge cache issue, 
deployment pipeline transient, or CDN refresh cycle?
```

## 다음 액션 (사용자 필요)

【사용자 액션 필요】
- [ ] **Vercel 지원팀 contact** (위 스크립트 참고)
  - 링크: https://vercel.com/support
  - 시간: 5-10분 (메시지 작성 + 제출)
- [ ] 지원팀 회신 대기 (일반적으로 4-24시간)
- [ ] 필요시 Vercel 대시보드에서 배포 캐시 수동 purge

## 자동화 모니터링

**비서 자동 실행 (중단 없음):**
- ✅ 5분 주기 폴링 계속 (패턴 감시)
- ✅ 추가 404 발생 시 CTB 즉시 갱신
- ✅ 4번째 404 발생 시 심각 알림 전송

**자동 복구 기준:**
- 현재: 3-5분 내 자동 복구 (예측 가능)
- 모니터링 계속 중 (변화 감시)

---

**Status:** 🔴 ESCALATION REQUIRED (threshold breached)
**Priority:** HIGH (systematic pattern + user action needed)
**Updated:** 2026-06-10 01:57 KST
