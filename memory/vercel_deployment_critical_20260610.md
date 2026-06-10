---
name: Vercel 배포 긴급 오류 (2026-06-10 18:58)
description: DEPLOYMENT_NOT_FOUND — Vercel이 배포 구성을 인식하지 못함. 5분 전 정상 상태에서 회귀. 수동 개입 필요.
type: project
---

## 문제 상황

**시간:** 2026-06-10 18:58 KST (폴링 사이클 1191)

**증상:**
- ❌ `curl https://dsc-fms-prod.vercel.app/` → DEPLOYMENT_NOT_FOUND
- ❌ `/api/audit/health` → DEPLOYMENT_NOT_FOUND
- ✅ 5분 전 상태: HTTP 200 정상

**영향 범위:**
- 본 앱 접근 불가
- 4개 P1 프로젝트 배포 확인 불가
- 신뢰도: 95% → 92% (블로커 1건 추가)

## 진단 결과

✅ **로컬 설정 정상**
- `vercel.json`: 올바름 (buildCommand, outputDirectory, crons 설정 완료)
- `next.config.js`: 존재 (dsc-fms-portal/ 디렉토리)
- 최근 커밋: 정상 (0d38ddd2)

🔴 **Vercel 인프라 오류**
- API가 배포를 인식하지 못하는 상태
- 로컬 파일 설정과 무관한 Vercel 서비스 문제

## 근본 원인 (추정)

1. **Vercel 배포 메타데이터 손상** — 프로젝트/배포 연결 끊김
2. **Vercel 서비스 장애** — API 일시적 오류
3. **배포 프로세스 실패** — 최근 푸시 후 배포 미완료/오류

## 해결책

### 즉시 조치 (수동)
1. Vercel 대시보드 접속 → dsc-fms-prod 프로젝트
2. **Deployments** 탭에서:
   - 최근 배포 상태 확인
   - 실패한 빌드 로그 검토
3. 필요 시:
   - 수동 재배포 (Redeploy Latest)
   - 또는 로컬에서 `vercel deploy --prod` 실행

### 모니터링
- CTB 폴링 지속 (5분 주기)
- `/api/audit/health` 응답성 확인
- Vercel 상태 페이지 체크: https://www.vercel-status.com/

## 타임라인

| 시각 | 이벤트 | 상태 |
|------|--------|------|
| 18:53 | 폴링 사이클 1190 | ✅ HTTP 200 OK |
| 18:58 | 폴링 사이클 1191 | 🔴 DEPLOYMENT_NOT_FOUND |

## 다음 단계

⏳ **사용자 액션 필요:**
- [ ] Vercel 대시보드 확인 및 재배포
- [ ] 배포 완료 후 CTB 재확인

**예상 소요시간:** 10~20분 (진단 + 재배포)

---

## 참고

- CTB 파일: `.ctb-state.json` (cycle 1191 기록됨)
- 커밋: `0d38ddd2` (폴링 결과 저장)
- P1 프로젝트: 4/4 로컬 상태 정상 (배포만 문제)
