---
name: Completion Verification Checklist
description: P1 프로젝트 완료 판정 전 2단계 검증 (코드 + 배포)
version: 1.0
effective_date: 2026-06-06 18:39 KST
---

# ✅ COMPLETION VERIFICATION CHECKLIST

**목적:** 코드 존재 ≠ 배포 실행 혼동 제거 (Code-Deployment Mismatch 자동 감지)

---

## 📋 2단계 검증 프로세스

### STEP 1: 코드 검증 (Code Verification)
- [ ] 코드 파일이 `/app/api/` (App Router) 경로에 존재하는가?
- [ ] `npm run build` 성공하는가? (0 errors)
- [ ] TypeScript 타입 검사 통과하는가?
- [ ] Import/Export 경로 올바른가?

**통과 조건:** 4/4 체크

---

### STEP 2: 배포 검증 (Deployment Verification) — NEW
- [ ] 엔드포인트에 HTTP 요청 → 200 응답 확인? (curl/fetch 테스트)
- [ ] Vercel 배포 로그에 에러 없는가? (배포 성공 확인)
- [ ] 응답에 예상된 데이터 필드 포함되어 있는가? (데이터 검증)
- [ ] 배포된 코드가 최신 커밋을 반영하는가? (타임스탬프/버전 확인)

**통과 조건:** 4/4 체크

---

## 🚨 자동 감지 규칙

### Rule 1: Pages Router 코드 감지 → 경고
```
IF: 코드가 /pages/api/ 에만 있고 /app/api/ 에 없음
THEN: 자동 경고 "마이그레이션 필요: Pages→App Router"
ACTION: STEP 2 배포 검증 필수 (빌드해도 서빙 안 됨)
```

### Rule 2: 배포 없이 완료 표시 → 자동 수정
```
IF: "완료" 표시 → 배포 검증 체크 < 2시간 없음
THEN: CTB 상태 자동 변경 → "검증 대기중" (pending verification)
ACTION: 배포 검증 강제 실행
```

### Rule 3: 배포 검증 실패 → 자동 보고
```
IF: 배포 검증 실패 (HTTP 4xx/5xx, 데이터 누락)
THEN: 자동 상세 보고서 생성 (로그 + 스택 트레이스)
ACTION: 개발자 즉시 알림 + CTB "FAILED" 마킹
```

---

## 📊 검증 기록 양식

```json
{
  "project": "DISCORD-BOT-P1",
  "commit": "585db4d5",
  "verified_at": "2026-06-06T18:39:00+09:00",
  "step1_code_verification": {
    "app_router_files_exist": true,
    "build_success": true,
    "typescript_errors": 0,
    "imports_valid": true,
    "passed": true
  },
  "step2_deployment_verification": {
    "endpoint_http_200": true,
    "vercel_deployment_success": true,
    "response_data_valid": true,
    "latest_code_deployed": true,
    "passed": true
  },
  "final_verdict": "✅ READY FOR PRODUCTION",
  "issues_found": [],
  "auto_actions_taken": []
}
```

---

## 🔄 자동 실행 타이밍

| 이벤트 | 자동 검증 | 주기 |
|--------|----------|------|
| P1 프로젝트 "완료" 표시 | STEP 1+2 자동 실행 | 즉시 |
| 배포 후 1시간 | STEP 2만 재검증 | 1회 |
| 일일 신뢰도 검사 | 모든 P1 STEP 1+2 | 18:00 KST |

---

## 📝 기록 위치

- **검증 결과:** `./.completion-verification-log.json` (실시간 업데이트)
- **주간 보고:** `./memory/WEEKLY_VERIFICATION_REPORT_[DATE].md` (매주 월요일)
- **실패 사항:** `./memory/VERIFICATION_FAILURES_[DATE].md` (매일 갱신)

---

**규칙 적용 시작:** 2026-06-06 18:39 KST  
**다음 검토:** 2026-06-13 15:30 KST (주간 분석)
