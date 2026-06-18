---
name: CTB 폴링 사이클 (2026-06-18 11:37 KST)
description: 정기 폴링 — 1/4 부분 UP, 3/4 DOWN, 배포 65h+ 지속
type: project
---

# CTB 폴링 사이클 (2026-06-18 11:37 KST)

**폴링 시간:** 2026-06-18 11:37:59 KST
**사이클 번호:** 2318
**검증 엔드포인트:** 4개 (P1)

## 엔드포인트 상태

| 프로젝트 | URL | HTTP | 상태 | 세부 |
|---------|-----|------|------|------|
| Main Portal | dsc-fms-portal.vercel.app | 503 | 🟡 부분장애 | Supabase 연결 실패 |
| AUDIT-P1 | dsc-fms-audit.vercel.app | 404 | 🔴 DOWN | DEPLOYMENT_NOT_FOUND |
| DISCORD-BOT | dsc-discord-bot.vercel.app | 404 | 🔴 DOWN | DEPLOYMENT_NOT_FOUND |
| TRAVEL-P2 | dsc-fms-travel.vercel.app | 404 | 🔴 DOWN | DEPLOYMENT_NOT_FOUND |

## 현황 요약

- **P1 상태:** 1/4 UP (부분) + 3/4 DOWN
- **신뢰도:** 25% (4개 중 1개 응답, 완전 기능 0%)
- **배포 장애 지속:** 65시간+
- **블로커:** GitHub PAT + Vercel 토큰 필수

## 상태 변화

**이전 (2026-06-17 21:02 KST):**
- 0/4 DOWN (모두 DOWN)
- 신뢰도 0%

**현재 (2026-06-18 11:37 KST):**
- 1/4 부분 UP (Main Portal 503)
- 신뢰도 25%

**개선:** 부분적 신호 감지 (Main Portal 응답 시작, Supabase 연결 시도 중)

## 필수 액션

**🔴 긴급 (사용자만 가능):**
1. GitHub PAT 재생성 → 배포 pipeline 재개
2. Vercel 토큰 검증 → 배포 상태 복구

**참고:** 자동화는 토큰 없이 진행 불가. 사용자 확인 필수.

## 다음 폴링

**예정:** 2026-06-18 11:42 KST (5분 간격)
