---
name: CTB 자동화 대체방안 (Evaluator AI Agent Critical Issues 해결)
description: Evaluator AI Agent의 3가지 반려 사유 해결 (Telegram 채널 설정, 파일 중복 제거, 파일 갱신 로직)
type: project
relatedFiles: CTB_AUTOMATION_ALTERNATIVE_PLAN.md, active_work_tracking.md
---

# CTB 자동화 대체방안

**기한:** 즉시 (2026-05-16)  
**상태:** Evaluator AI Agent 재검증 대기  
**목표:** Evaluator AI Agent의 3가지 Critical Issues 모두 해결

## Issue 1: Telegram @default 채널 미설정

**문제:** Cron 메시지 50% 이상 손실 위험

**근인:** 대부분의 정기 체크 Cron이 `delivery.mode="none"` (메시지 미발송)

**해결책 A (기본, 즉시 적용):**
```json
{
  "delivery": {
    "mode": "announce",
    "channel": "telegram",
    "to": "default"
  }
}
```

**대상 Cron 5개:**
1. 08:00 블로킹 추적 (2d26b9ea...)
2. 12:00 Evaluator AI Agent 정기 체크 (8469d770...)
3. 14:00 Planner AI Agent 정기 체크 (e41c61bd...)
4. 15:00 Web-Builder AI Agent 정기 체크 (dfec9588...)
5. 08:00 블로킹 추적 systemEvent (모두)

**예상 효과:** Telegram 메시지 손실률 0% → 신뢰도 ↑

---

## Issue 2: CTB 파일 중복 제거

**문제:** 메모리 낭비 + 유지보수 악화

**현재 중복 파일:**
```
1. memory/active_work_tracking.md       ✅ (MAIN — 유지)
2. memory/CTB_프로젝트추적판.md          🗑️ (DELETE)
3. CTB_RESTRUCTURE_PROPOSAL.md          🗑️ (DELETE)
4. active_work_tracking.md (root)       🗑️ (DELETE)
5-11. BACKUPS/ 내 파일들                🗑️ (보관만)
```

**해결책:**
1. **memory/active_work_tracking.md만 유지** (SINGLE SOURCE OF TRUTH)
2. 나머지 4개 파일 삭제
3. MEMORY.md에서 duplicate 제거

**실행 순서:**
```bash
# Step 1: 백업 확인
ls -la memory/active_work_tracking.md
wc -l memory/active_work_tracking.md

# Step 2: 파일 삭제
rm CTB_RESTRUCTURE_PROPOSAL.md
rm active_work_tracking.md (root에서만)
rm memory/CTB_프로젝트추적판.md

# Step 3: MEMORY.md 정리 (포인터 하나만 유지)

# Step 4: Git commit
git add -A
git commit -m "chore(ctb): consolidate duplicate tracking files"
```

**예상 효과:** 단일 소스 원칙 확립 + MEMORY 라인 정리

---

## Issue 3: 파일 자동 갱신 로직 부재

**문제:** Cron이 메시지만 발송, CTB 파일 수정 로직 없음

**현재 상태:**
```
Cron payload = systemEvent(text: "진도 리포트 대기 중")
→ Telegram 메시지 발송만
→ 파일(CTB) 업데이트 안 함
```

### Option 1: 수동 갱신 강화 (권장) ⭐

**방식:** 비서가 정해진 시간에 수동으로 CTB 신뢰도 검증 + 파일 업데이트

**장점:**
- 즉시 구현 가능
- 정확도 높음
- 각 항목의 "왜"를 체크 가능

**단계:**
1. 08:00 블로킹 추적 체크
2. 12:00 CTB 신뢰도 수동 검증 (% 값 확인)
3. 14:00 상태 업데이트 + 파일 변경
4. 15:00 진도 리포트 발송

### Option 2: 자동 파일 갱신 (향후)

**구현:** Cron payload에 `updateFile=true` 추가

```json
{
  "kind": "systemEvent",
  "text": "진도 리포트: Asset Master 70%, Backup 40%",
  "updateFile": {
    "path": "memory/active_work_tracking.md",
    "section": "진행중",
    "values": {
      "Asset Master Phase 2": "70%",
      "Backup Phase 2": "40%"
    }
  }
}
```

**예상 효과:** 완전 자동화 (향후 1개월)

---

## 검증 기준 (Evaluator AI Agent)

- [ ] Telegram 채널 설정 가능성 확인
- [ ] CTB 파일 중복 제거 경로 최종 확인
- [ ] 수동 갱신 vs 자동 갱신 선택 최종화
- [ ] 파일 갱신 로직 테스트 (수동 버전 1회)

## 참고 문서
- CTB_AUTOMATION_ALTERNATIVE_PLAN.md — 전체 대체방안 상세 설계
- active_work_tracking.md — 현재 CTB 상태
