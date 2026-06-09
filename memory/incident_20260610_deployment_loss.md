---
name: 2026-06-10 01:42 배포 손실 인시던트
description: Vercel DEPLOYMENT_NOT_FOUND — 6분 내 배포 상태 급전환
type: project
---

# 🔴 2026-06-10 01:42 KST — Vercel DEPLOYMENT_NOT_FOUND

## 인시던트 타임라인

| 시간 | 상태 | 상세 |
|------|------|------|
| 01:36 | ✅ HTTP 200 | 커밋 534e79ef: 캐시 문제 해결 완료 + 배포 안정화 |
| 01:42 | 🔴 404 | DEPLOYMENT_NOT_FOUND 에러 + Vercel 배포 손실 |

**윈도우:** 6분 (01:36 → 01:42)

## 증상

```
curl https://dsc-fms.vercel.app/api/assets
→ HTTP/2 404
→ x-vercel-error: DEPLOYMENT_NOT_FOUND
```

## 가능한 원인

1. **배포 롤백** — 이전 배포로 자동 롤백됨
2. **배포 삭제** — 수동/자동 배포 취소
3. **Vercel 인프라 장애** — 일시적 배포 불가
4. **캐시 파이프라인 손상** — 캐시 제거 후 배포 연쇄 실패

## P1 프로젝트 영향

모든 P1은 **코드 검증 100% 완료**이나 배포 접근 불가:
- AUDIT-P1: 0cf3c1ba ✅ (코드) 🔴 (배포)
- DISCORD-BOT-P1: 585db4d5 ✅ (코드) 🔴 (배포)
- BM-P1: ecc13a9f ✅ (코드) 🔴 (배포)
- TRAVEL-P2-UI: e9396c74 ✅ (코드) 🔴 (배포)

## 신뢰도 변화

- 01:36: 98%+ (블로커=0)
- 01:42: 75% (블로커=1 CRITICAL)

## 추가 재발생 기록

| 시간 | 상태 | 비고 |
|------|------|------|
| 02:14 | 🔴 404 | 4차 재발생 (cycle 1065) |
| 02:24 | 🔴 404 | 여전히 활성 (curl 검증) |

**현황:** RECURRING 패턴 확정 → Escalation 진행 중 (`escalation_vercel_support_20260610.md`)

## 다음 액션

【사용자 액션 필요】
- [ ] Vercel 지원팀 contact — https://vercel.com/support
  - 스크립트: `escalation_vercel_support_20260610.md` 본문의 "Vercel 지원팀 대화 스크립트" 복사 + 제출
  - 예상소요: 5분
- [ ] 회신 대기 (4-24시간)
