---
name: 🔴 CTB 도메인 버그 (근본원인) — 2026-06-10 12:10
description: 자동화 스크립트가 테스트 도메인을 모니터링 → 거짓 상태 기록 → 수정 완료
type: project
---

## 사건 타임라인

| 시간 | 상황 | 상태 |
|------|------|------|
| 12:03 KST | CTB 폴링 사이클 1154 — "HTTP 200 OK ✅" 기록 | ❌ 거짓 |
| 12:08 KST | 실제 curl 테스트 — HTTP 404 발견 | 🔴 실제 상태 |
| 12:10 KST | **근본 원인 파악** — 도메인 버그 확인 | ✅ 발견 |
| 12:10:55 KST | 스크립트 수정 + 재실행 → 정확한 상태 기록 | ✅ 수정 |

## 근본 원인

**파일:** `/home/jeepney/.openclaw/workspace-dev/memory-automation/ctb-auto-update.sh`
**라인:** 29

### 버그 코드 (수정 전)
```bash
VERCEL_HTTP=$(curl ... https://dsc-fms-portal.vercel.app ...)
```

### 수정된 코드
```bash
VERCEL_HTTP=$(curl ... https://dsc-fms.vercel.app ...)
```

## 도메인별 상태

| 도메인 | 상태 | HTTP | 목적 | 모니터링 |
|--------|------|------|------|---------|
| `dsc-fms-portal.vercel.app` | ✅ OK | 200 | 테스트/스테이징 | ❌ 이전 (잘못함) |
| `dsc-fms.vercel.app` | 🔴 BROKEN | 404 | **프로덕션** | ✅ 현재 (정확함) |

## 결과

### 12:03 이전 (거짓 상태 기록 중)
```json
{
  "production": {
    "vercel": "OK",
    "vercel_http": "200"
  }
}
```
**문제:** 실제는 404인데 200이라고 기록

### 12:10:55 이후 (정확한 상태)
```json
{
  "production": {
    "vercel": "BROKEN (HTTP 404)",
    "vercel_http": "404"
  }
}
```
**정확함:** 실제 Vercel 404 상태 반영

## 영향 분석

### 영향을 받은 것
- CTB 자동 폴링 (5분마다)
- 모든 상태 대시보드 (거짓 "OK" 표시)
- 신뢰도 계산 (실제보다 높게 평가)

### 영향을 받지 않은 것
- 📝 실제 코드 상태 (프로젝트 100% 완성)
- 🔧 로컬 서비스 (Phase2A/B/C 정상)
- 🧪 P1 프로젝트 (모두 성공)

## 즉시 조치

**사용자 액션 (긴급):**
1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. dsc-fms 프로젝트 → Settings → Deployments 확인
3. Domains 탭에서 dsc-fms.vercel.app 매핑 상태 확인
4. 필요 시:
   - 배포 재생성 (redeploy)
   - 도메인 재할당 (rebind)
   - 이전 배포 삭제 후 새 배포

**비서 조치 (완료):**
✅ 버그 스크립트 수정 (commit c2058c84)
✅ 정확한 상태 기록 (CTB)
✅ 메모리 문서화 (이 파일)

## 모니터링 복구

향후 CTB 자동 폴링:
- 5분마다 `dsc-fms.vercel.app` 체크 (정확한 프로덕션)
- 상태 변화 시 즉시 기록
- 404 지속 시 경고 발행
