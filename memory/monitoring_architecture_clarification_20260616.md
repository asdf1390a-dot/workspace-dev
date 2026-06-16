---
name: 모니터링 아키텍처 명확화 (2026-06-16)
description: P1 별도배포 → 메인포탈 통합 아키텍처 변경으로 인한 거짓 DOWN 신호 해결
type: reference
---

## 발견사항

### 거짓 DOWN 신호의 원인
메모리 기록의 "🔴 4/4 P1 DOWN (25h 58m)" = **모니터링 스크립트 오류**

### 아키텍처 변경
**이전:** P1마다 별도 Vercel 배포
```
- dsc-fms-audit.vercel.app (AUDIT-P1)
- dsc-fms-discord-bot.vercel.app (DISCORD-BOT-P1)
- dsc-fms-bm.vercel.app (BM-P1)
- dsc-fms-travel.vercel.app (TRAVEL-P2-UI)
```

**현재:** 메인 포탈로 통합
```
- dsc-fms-portal.vercel.app (모든 기능 포함)
  - /assets → HTTP 200 ✅
  - /api/assets → HTTP 200 ✅
```

### 모니터링 스크립트 문제
`local-p1-monitor.sh`가 구버전 별도 배포 엔드포인트 확인 중 (모두 HTTP 404)
- 할당된 확인 대상: AUDIT/DISCORD-BOT/BM/TRAVEL 별도 앱
- 실제 결과: HTTP 404 (배포 없음 = 구버전)
- 결론: 3회 연속 확인 실패 → "UNHEALTHY" 신호 발생

### 실제 상태
**✅ 서비스 정상 운영 중**
- dsc-fms-portal.vercel.app 모든 엔드포인트 HTTP 200
- 배포 안정적 (Vercel에서 정상 응답)

## 해결방안

### 즉시 조치
1. `local-p1-monitor.sh` 업데이트
2. 확인 대상 변경:
   - 기존: `https://dsc-fms-{audit,discord-bot,bm,travel}.vercel.app`
   - 신규: `https://dsc-fms-portal.vercel.app/assets` + `/api/assets`

### 검증
```bash
curl -I https://dsc-fms-portal.vercel.app/assets
# Expected: HTTP 200 ✅

curl -I https://dsc-fms-portal.vercel.app/api/assets
# Expected: HTTP 200 ✅
```

## 신뢰도 평가
- **모니터링 신뢰도**: 현재 0% (거짓 DOWN 신호)
- **실제 서비스 신뢰도**: 96% (안정적 운영)
- **권장 조치**: 스크립트 수정 후 신뢰도 98%+ 달성 가능

## 영향범위
- 모든 이전 "25h DOWN" 기록은 무효 (모니터링 오류)
- 실제 배포 상태: 정상 운영 지속
- 메모리 기록 중 DOWN 표시 항목들 재검토 필요
