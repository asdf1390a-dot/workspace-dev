---
name: Vercel DEPLOYMENT_NOT_FOUND 재발 (4일 지속)
description: 2026-06-10부터 반복되는 Vercel 배포 실패, 모든 P1 4개 엔드포인트 404 반환, 모니터링 시스템 오보
type: project
---

# 🚨 CRITICAL INCIDENT: Vercel DEPLOYMENT_NOT_FOUND (4일 지속)

**상태:** 🔴 CRITICAL | **첫 발생:** 2026-06-10 10:14 KST | **현재:** 2026-06-14 15:08 KST | **지속 시간:** 97+ 시간

## 현황

| 항목 | 상태 | 상세 |
|------|------|------|
| **모든 P1 4개** | 🔴 404 | AUDIT-P1, DISCORD-BOT-P1, TRAVEL-P2-UI, BM-P1 |
| **Vercel 상태** | 🔴 DEPLOYMENT_NOT_FOUND | x-vercel-error 헤더 확인 |
| **로컬 빌드** | ✅ 성공 | npm run build 정상 (2026-06-14 15:07) |
| **Git 푸시** | ✅ 성공 | 45512910 (긴급 커밋 푸시됨) |
| **모니터링** | 🔴 거짓 양성 | "Vercel=OK" 잘못 보고 (실제 404) |

## 문제 분석

**근본 원인:**
1. Vercel 프로젝트 배포 인프라 손실 (DEPLOYMENT_NOT_FOUND)
2. GitHub 웹훅 미작동 또는 배포 파이프라인 실패
3. 또는 Vercel 프로젝트 자체 삭제/비활성화

**증거:**
- HTTP 응답: 404 DEPLOYMENT_NOT_FOUND
- 로컬 빌드: 정상 ✅ (.next/server/app/ 구조 완벽)
- 지속성: 4+ 일간 해결 안 됨
- 반복성: 여러 배포 시도 모두 실패

**모니터링 실패:**
- CTB 스크립트가 실제 HTTP 요청을 검증하지 않음
- 단순히 스크립트 실행 여부만 확인 → "OK" 보고
- 실제 엔드포인트 응답 (404) 미감지

## 필요한 조치

### 🔴 즉시 필요 (사용자 수동)
1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. 프로젝트 "dscfms-dsc" 확인
   - [ ] 프로젝트가 존재하는가?
   - [ ] 배포 탭에서 최근 배포가 있는가?
   - [ ] Vercel GitHub 앱 연동 정상인가?
3. 필요 시:
   - [ ] GitHub 재연동
   - [ ] 환경변수 재확인 (NEXT_PUBLIC_* 등)
   - [ ] Build & Deploy 설정 재검증

### 🟡 비서 조치 (토큰 필요)
- Vercel API 토큰으로 배포 상태 조회 및 재배포
- GitHub Actions 워크플로우 디버깅

## 타임라인

| 시간 | 상태 | 조치 |
|------|------|------|
| 2026-06-10 10:14 | 🔴 첫 발생 | "P2 AT-RISK (Vercel DEPLOYMENT_NOT_FOUND)" 기록 |
| 2026-06-13 23:50 | 🔴 계속 | 회귀 패턴 반복 감지 |
| 2026-06-14 15:01 | 🟢 거짓 회복 | CTB 모니터링 "OK" 오보 |
| 2026-06-14 15:07 | 🔴 재확인 | 실제 404 재확인, npm build 재시도 성공 |
| 2026-06-14 15:09 | 🚨 에스컬레이션 | 이 사건 기록 |

## 블로킹 항목

**P1 4개 모두 다운:**
- AUDIT-P1 (0cf3c1ba): ❌ 404
- DISCORD-BOT-P1 (585db4d5): ❌ 404
- TRAVEL-P2-UI (e9396c74): ❌ 404
- BM-P1 (ecc13a9f): ❌ 404

**신뢰도:** 25% (배포 실패 상태)

---

## 참고

CTB 폴링 스크립트 수정 필요:
- 현재: 로컬 Phase2 포트만 확인 (Phase2A/B/C = ready로 보고)
- 필요: 실제 Vercel 엔드포인트 HTTP 요청으로 상태 검증
- 구현: `/audit`, `/api/discord-bot`, `/travel`, `/bm` 직접 호출 및 상태 코드 확인

