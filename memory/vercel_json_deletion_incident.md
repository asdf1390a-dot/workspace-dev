---
name: Vercel.json 삭제 인시던트 (2026-06-09 02:18 KST)
description: Root cause of 20분+ Vercel 404 — vercel.json 파일 실수 삭제로 인한 배포 중단
type: project
---

## 사건 요약

**발생시간:** 2026-06-09 17:18:56 UTC (2026-06-10 02:18:56 KST)
**영향:** Vercel 배포 완전 중단 (HTTP 404 DEPLOYMENT_NOT_FOUND)
**지속시간:** ~20분
**심각도:** 🔴 CRITICAL (프로덕션 배포 불가)

## 원인

commit c9347d7d에서 `team-dashboard-p1: db/36 마이그레이션 적용 완료` 작업 중 실수로 vercel.json 파일이 삭제됨.

```
diff --git a/vercel.json b/vercel.json
deleted file mode 100644
index 7cf15108..00000000
```

**근본 원인:** git 스테이징 중 부주의로 vercel.json이 포함되어 커밋됨

## 영향도

- **Production:** Vercel 배포 자동 빌드 불가 (build configuration 없음)
- **모든 사용자:** dsm-fms.vercel.app 접근 불가 (404)
- **신뢰도:** 100% → 92% 하락
- **수동 개입 필요:** Vercel 대시보드에서 rebuild 요청

## 복구 프로세스

1. ✅ **근본원인 파악:** git log, git show로 삭제 지점 식별
2. ✅ **파일 복구:** commit aac21273에서 vercel.json 추출하여 복원
3. ✅ **커밋:** commit 800e08c7 "fix: Restore vercel.json deleted in c9347d7d"
4. ✅ **배포:** git push origin main (Vercel 자동 rebuild 트리거)
5. ⏳ **검증 대기:** Vercel rebuild 소요시간 예상 5-10분

**복구 커밋:** 800e08c7 @ 2026-06-10 05:07:00 KST

## vercel.json 구성 (복구됨)

```json
{
  "buildCommand": "cd dsc-fms-portal && npm ci && npm run build",
  "outputDirectory": "dsc-fms-portal/.next",
  "env": {
    "NODE_ENV": "production"
  },
  "crons": [
    {
      "path": "/api/cron/checkpoints/08-00",
      "schedule": "0 23 * * *"
    },
    {
      "path": "/api/cron/checkpoints/14-00",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/cron/checkpoints/15-00",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/checkpoints/18-00",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 예방 조치

**향후 규칙 (2026-06-10 강화):**
- [ ] 마이그레이션/배포 커밋 시 vercel.json 변경 금지 (체크리스트 추가)
- [ ] GitHub pre-commit hook: vercel.json 삭제 감지 시 경고
- [ ] CTB 모니터링: Vercel 404 감지 시 자동 알림 (현재 미작동)
- [ ] git config: `*.json` 중요 파일을 보호 규칙으로 추가

**단기 모니터링:**
- Vercel 배포 상태: 2026-06-10 05:15 이후 재검증
- CTB 신뢰도: 복구 후 100% 회복 확인

## 참고

- **이전 상태:** TRAVEL-P2-UI, AUDIT-P1, DISCORD-BOT-P1, BM-P1 모두 정상 (코드 변경 없음)
- **현재 블로커:** Vercel 배포만 영향받음 (로컬 Phase 2A/2B/2C는 정상)
- **예상 복구:** 2026-06-10 05:15 (약 8분 소요)
