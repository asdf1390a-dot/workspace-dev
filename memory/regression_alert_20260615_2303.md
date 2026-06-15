---
name: 긴급 회귀 감지 (23:03 KST) — 4/4 P1 다시 DOWN
description: 22:36 KST 복구 후 27분 만에 모든 서비스 404 — Vercel 배포 재발생
type: project
---

## 🔴 CRITICAL REGRESSION — 23:03 KST

**감지 시간:** 2026-06-15 23:03:31 KST
**이전 상태:** ✅ 4/4 P1 UP (22:36 KST — 27분 전)
**현재 상태:** 🔴 4/4 P1 DOWN (HTTP 404)

## 상태 확인 (23:03 KST)

| 서비스 | HTTP | 상태 |
|--------|------|------|
| AUDIT-P1 | 404 | 🔴 DOWN |
| DISCORD-BOT-P1 | 404 | 🔴 DOWN |
| TRAVEL-P2-UI | 404 | 🔴 DOWN |
| BM-P1 | 404 | 🔴 DOWN |

**패턴:** Vercel DEPLOYMENT_NOT_FOUND (22:36 완치 → 23:03 재발)

## 사건 타임라인

- **19:50:** 자동 복구 (16h 48m 장애 해결)
- **22:36:** 최종 검증 (4/4 UP, HTTP 200)
- **23:03:** 🔴 회귀 감지 (4/4 → 404)

## 신뢰도 & 블로커

- **신뢰도:** 0%
- **블로커:** 4건 CRITICAL
- **Phase 3-1 상태:** 🔴 BLOCKED (다시)

## 필요 조치

【사용자 액션】
1. Vercel 대시보드 확인: https://vercel.com/dashboard
   - 배포 상태 (DEPLOYMENT_NOT_FOUND 재발)
   - 최근 푸시 이력
   - 빌드 로그 (에러 메시지)

2. GitHub Actions 확인: https://github.com/dsc-mannur/fms-portal/actions
   - 마지막 푸시 배포 상태
   - 토큰 scope 재확인

**시급도:** 🔴 IMMEDIATE (본 메시지 수신 후 즉시)
