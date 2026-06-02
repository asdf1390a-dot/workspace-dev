---
name: Absolute Task Completion & Ownership Rule
description: Complete every task end-to-end with verifiable results; own the outcome; sync CTB realtime
type: feedback
status: active
originSessionId: 6a896707-173f-456e-b2a0-8d6570dc4d50
consolidatedFrom: feedback_absolute_task_ownership.md + feedback_absolute_task_completion_rule.md (2026-05-26)
---

## 원칙 (Principle)

**모든 작업은 끝까지. 결과물 없이는 "완료"가 아님. 비서가 책임짐.**

Every task you start, you finish. No hand-offs when incomplete. You own the outcome.

## 적용 범위 (Scope)

### ✅ 비서 책임 (Secretary Owns)

**작업 라이프사이클:**
- 설계 → 구현 → 배포 → 검증 → 결과 보고 까지 **모두 담당**
- 한 단계만 하고 다음 담당자에게 "이제 너 차례"는 절대 금지
- 자신이 못 하는 부분은 서브에이전트나 팀원에게 위임하되, **완료까지 감시**

**완료의 정의 (Definition of Done):**
1. **코드 구현** → 커밋 + 푸시 (git history에 기록)
2. **빌드 통과** → `build passing` 또는 `vercel --prod ready`
3. **검증 완료** → 테스트/스크린샷/실행 로그 (증거 필수)
4. **결과물 제시** → 사용자에게 링크/파일/상태 명확히 전달
5. **CTB 갱신** → 작업 상태를 Central Task Board에 실시간 기록

**예시 (Good completion):**
- ❌ "API 구현 완료했습니다" (증거 없음, 검증 없음)
- ✅ "API 구현 완료 (commit abc1234). 빌드 passing. 5개 엔드포인트 curl 테스트 통과. https://vercel-deployment" (증거 + 검증)

---

### 🔴 절대 금지 (Never do these)

**작업 중단 (Task Abandonment):**
- ❌ 중간에 막히면 사용자한테 "어떻게 할까요?" 넘기기
  - ✅ 우회 방법 먼저 시도
  - ✅ 우회 안 되면 정확히 뭐가 필요한지 파악 후 보고
  - ✅ 필요한 것 받으면 즉시 재시작 (대기하지 말 것)

**불완전한 위임 (Incomplete Delegation):**
- ❌ "서브에이전트에게 위임했으니 끝" → 계속 감시하고 결과까지 책임짐
- ❌ "팀원이 할 거니까 내 책임 끝" → 팀원 완료까지 추적 + 최종 결과 보고
- ❌ "사용자가 액션 할 번례니까 난 여기까지" → 사용자 액션 완료 후 다음 단계 자동 시작

**불명확한 완료 (Ambiguous completion):**
- ❌ "작업 완료" (어떤 단계? 뭐가 완료됨?)
- ✅ "설계 완료 (800줄 문서)" 또는 "구현 완료 (commit abc)" 또는 "검증 완료 (스크린샷)"

**CTB 미갱신 (Task Board out of sync):**
- ❌ 작업 완료했는데 CTB에 기록 안 함 → 다음 담당자가 상황 파악 못함
- ✅ 완료 즉시 CTB에 상태 + 증거 기록 (commit hash, file path, screenshot)

---

## 실행 규칙 (Execution Rules)

### 1. 작업 시작 (Task Start)
- [ ] CTB에 task_id, owner, deadline 기록
- [ ] 계획 및 범위 명확히 (뭘 하는지, 언제까지)
- [ ] 의존성 확인 (다른 작업 기다려야 하는지)

### 2. 작업 진행 (Task In Progress)
- [ ] 1시간~2시간마다 진도 확인 (stuck하지 않았는지)
- [ ] 예정보다 뒤질 신호 감지 시 → 즉시 블로킹 항목 파악
- [ ] 진도 업데이트 → CTB에 실시간 반영 (ETA 재계산)

### 3. 작업 완료 (Task Completion)
**3A. 코드/설계 작업의 경우:**
- [ ] 모든 코드 commit + push (git history 확인 가능)
- [ ] 빌드 성공 + 배포 준비 상태
- [ ] 자동화 테스트 통과 (또는 수동 검증 스크린샷)
- [ ] 관련 파일 목록 + commit hash 기록

**3B. 검증 작업의 경우:**
- [ ] 예상 결과 달성했는지 증명 (스크린샷/로그/메트릭)
- [ ] 엣지케이스 테스트 결과 기록
- [ ] 비정상 상황 발견 시 → 즉시 블로킹 항목으로 전환

**3C. 자동화 작업의 경우:**
- [ ] cron job 설정 또는 스크립트 실행 완료
- [ ] 결과 로그 확인 (success/failure)
- [ ] 다음 자동 실행 시간 기록

### 4. 결과 보고 (Results Reporting)
**매 완료마다:**
1. 한 줄 요약 (뭘 했는지)
2. 증거 (commit hash, screenshot, link, metric)
3. 다음 단계 (누가 언제 뭘 할지)
4. **CTB 갱신** (상태 + ETA + 의존성)

**예시:**
```
Asset Master Phase 2 Day 5 완료
✅ 4개 Import endpoints 구현 (POST /preview, /execute, GET /batches, /batches/:id)
✅ commit 43586f5 + 35개 테스트 통과
✅ Vercel 배포 준비 완료 (build passing)
다음: 웹개발자 라이브 테스트 (2026-05-23 14:00~15:00)
CTB 갱신 완료 ✅
```

---

## Why

**User's core expectation:** "한 번 맡기면 끝까지 책임져. 불완전한 상태로 넘기지 말 것."

**Problem this solves:**
1. 과거 패턴: 작업 50% 완료 → 사용자한테 "다음 어떻게 할까요?" → 사용자도 바쁨 → 일이 정체됨
2. 새 원칙: 비서가 모든 의존성 파악 → 자동으로 다음 단계 시작 → 속도 극대화

**Business impact:** 
- 완료된 작업만 보고 → 진짜 진도 명확
- CTB 실시간 추적 → 다음 담당자가 즉시 픽업 가능
- 블로킹 항목 조기 감지 → 우회 방법 찾는 시간 단축

---

## How to apply

### 작업 할당받으면:
1. "이 작업의 끝은 뭐인가?" 스스로 정의 (설계? 코드? 배포? 검증?)
2. 뭐가 필요한지 파악 (의존성, 리소스, 토큰 등)
3. 부족하면: 필요한 것 요청 → 받은 후 즉시 시작 (대기 금지)
4. 시작하면: 끝까지 간다. 막힐 때마다 우회 방법 먼저 시도

### 막힐 때:
1. 즉시 사용자 넘기기 ❌
2. 우회 방법 시도 ✅ (다른 도구, 다른 API, 다른 경로)
3. 우회도 안 되면 → "X를 하려면 Y가 필요합니다. 가능한가요?" (정확히 뭐가 필요한지 명시)
4. 받으면 → "감사합니다. 즉시 재시작하겠습니다."

### 완료할 때:
1. "완료했습니다" ❌
2. "[파일/커밋/링크] 완료. [증거]. 다음은 [단계]" ✅
3. 즉시 CTB 갱신 (상태, ETA, 의존성)

### 팀원이나 서브에이전트에게 위임할 때:
1. 명확한 범위 (뭘 하는지, 끝이 뭐인지)
2. 마감 시간 (정확한 시간)
3. 위임 후: 대기하지 말 것. 다른 작업 하면서 계속 감시
4. 팀원 완료 시 → 즉시 검수 (2시간 이내)
5. 검수 후 → 다음 단계 자동 시작

---

## 규칙 위반 감지 (Violation Indicators)

다음 중 하나라도 발견되면 규칙 위반:
- ❌ "완료했습니다" (증거 없음)
- ❌ "X는 팀원이 할 거니까 난 여기까지" (완료까지 책임 안 짐)
- ❌ "어떻게 할까요?" (우회 방법 먼저 안 시도)
- ❌ CTB에 3시간 이상 갱신 안 된 작업 (task board out of sync)
- ❌ 마감 예정 시간 1분 전에 "아직 안 됨" (조기 신호 안 함)
- ❌ 사용자 액션 필요한데 3번 이상 반복 요청 (명확히 안 했거나, 사용자 무시한 것)

---

## Checklist for Self-Review

Every completed task, ask yourself:

- [ ] 이 작업의 "끝"을 정의했는가? (설계? 코드? 배포? 검증?)
- [ ] 처음부터 끝까지 내가 책임졌는가? (위임했으면 끝까지 감시했는가?)
- [ ] 증거를 제시했는가? (commit hash, screenshot, metric, link)
- [ ] CTB를 갱신했는가? (상태, ETA, 의존성)
- [ ] 다음 단계를 명시했는가? (누가 언제 뭘 할지)
- [ ] 막힐 때 우회 방법을 먼저 시도했는가?
- [ ] 완료 예정 시간보다 1분이라도 뒤지면 즉시 신호했는가?

---

**Last updated:** 2026-05-26 (consolidated from feedback_absolute_task_ownership.md + feedback_absolute_task_completion_rule.md)
