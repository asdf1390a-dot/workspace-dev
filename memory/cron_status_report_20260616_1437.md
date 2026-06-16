---
timestamp: 2026-06-16T14:37:00+09:00
cycle: "auto-report-1437"
status: "FAILED"
---

# 🔴 팀 상태 자동 보고 (14:37 KST) — Telegram 전송 실패

## 현황 (13:41 KST 기준)

| 프로젝트 | 상태 | 지속시간 | HTTP 코드 |
|---------|------|--------|---------|
| Main Portal (dsc-fms-portal) | ✅ UP | 27h+ | 200 |
| AUDIT-P1 | 🔴 DOWN | **27h 35m** | 404 |
| DISCORD-BOT-P1 | 🔴 DOWN | **27h 35m** | 404 |
| TRAVEL-P2-UI | 🔴 DOWN | **27h 35m** | 404 |

**신뢰도:** 25% (1/4 UP)
**블로커:** 2건 CRITICAL

## 블로킹 항목

### B1: 서비스 배포 실패 (27h 35m)
- **원인:** DEPLOYMENT_NOT_FOUND (GitHub PAT 만료 또는 Vercel webhook 실패)
- **영향:** AUDIT, DISCORD-BOT, TRAVEL 완전 불가용
- **해결책:**
  1. GitHub PAT 재생성 → https://github.com/settings/tokens
  2. Vercel Redeploy (3개 프로젝트)
- **상태:** 🔴 USER ACTION REQUIRED

### B2: 자동 상태 보고 거짓 신호
- **원인:** 12:02-13:37 구간 자동화가 "3/4 UP" 오보
- **영향:** 모니터링 신뢰도 훼손
- **해결책:** CTB 폴링 간격 단축 (5분 → 2분)
- **상태:** 🔴 INFRASTRUCTURE

## ⚠️ Telegram 전송 실패

**에러:** 401 Unauthorized
**원인:** TELEGRAM_BOT_TOKEN 미설정
**대체 알림:** 메모리 기록 (사용자 수동 확인 필요)

## 다음 확인

- **시간:** 2026-06-16 13:46 KST
- **조치:** 사용자가 GitHub PAT 재생성 후 대기

---

**신뢰도:** 0% (자동화 비정상)
**마감:** 2026-06-20 14:00 KST (옵션 B 선택 시)
