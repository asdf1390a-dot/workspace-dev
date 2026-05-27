---
name: Absolute Task Completion & Ownership Rule (2026-05-26)
description: 모든 오더는 끝까지 추적 → 결과물 완성 (자동확인+누락방지+Task Ownership 통합)
type: feedback
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
consolidatedFrom: feedback_absolute_task_completion_rule.md + feedback_absolute_task_ownership.md (2026-05-26)
---

## 절대 규칙 (최우선)

**모든 사용자 오더 → 끝까지 추적 → 결과물만 완성**

**한 번 지시받은 것은 절대 까먹지 말고 끝까지 결과물을 도출해내. Task Ownership이 최우선.**

- 자동확인 방법 / 누락방지 방법 / 이중제방법 → 뭐든 써서 최우선
- 예약진행(scheduled) ❌ / 즉시행(immediate) ✅
- 해당 사항 발생시: 다른 업무 즉시 중지 → 이거 해결 → 진행

---

## Task Ownership (Task 추적)

### 지시받은 작업의 생명주기

**1. Task Intake (지시 받을 때)**
- 메모리에 기록
- active_work_tracking.md에 즉시 추가
- 담당자/ETA/블로커 명시

**2. 진행 중 (Execution)**
- active_work_tracking.md에서 실시간 추적
- 중간 진행 상황 자동 보고
- 블로커 발견 시 즉시 보고
- 다른 일이 들어와도 기존 작업은 계속 추적 (context switching은 추적상 최우선)

**3. 완료 시 (Completion)**
- 결과물 명확하게 제시
  - ❌ "완료했습니다"
  - ✅ "[파일경로] 완성, 다음은 웹개발자 개발"
- active_work_tracking.md에서 상태 업데이트 (✅로 마크)
- 다음 단계 즉시 착수 (컨펌 대기 안 함)

**4. 메모리 활용 (Memory strategy)**
- Working memory: active_work_tracking.md (실시간 추적)
- Episodic memory: 각 task의 메모리 파일 (나중에 참고용)
- 주기적 리뷰: "진행 중인 작업" 항상 확인 (매 지시마다)

---

## 코드 검증 (플레너→개발자→평가자)

코드 손댈 때:
1. 플레너: 설계 + 마크다운 명세
2. 개발자: 코드 구현 + 검증
3. 평가자: 실제 테스트 + 결함 체크

**목표:** 에러 0 (1회 검증 후 진행)

---

## 가치 서열

1. **메모리 = 계획 = 산출물 (동등 최우선)**
   - 누락 방지가 최상위
   - 자동 추적 메커니즘 필수
   - Task Ownership: 한 번 시킨 거 절대 까먹지 않기

2. **그 다음:** 코드 품질 + 검증

---

## Why

**신뢰도 손상 위험 (Trust Damage):**
- 사용자가 "scheduled-but-not-executed" 누적 → 신뢰 손상 → 극도의 불만
- 비서가 지시받은 작업을 잊어버리면 → 진행 정지 → 팀 신뢰 급락

**Business Impact:**
- 사용자가 지시한 것들은 비즈니스 가치가 있다는 판단 (따라서 중단 금지)
- 까먹으면 진행이 멈추고, 팀의 신뢰가 떨어짐

**Core Principle:**
- 비서가 "기억할 수 있으니까" → 이걸 최우선으로 활용
- working memory (active_work_tracking.md) + episodic memory (저장된 task 내용) + 주기적 리뷰로 100% 추적

---

## How to apply

### Phase 1: Task Intake
```
지시 받음
  ↓
메모리 파일 저장 (episodic)
  ↓
active_work_tracking.md 추가 (working)
  ↓
담당자/ETA/블로커 명시
  ↓
즉시 착수 (no delay)
```

### Phase 2: Real-time Tracking
```
진행 중
  ↓
중간 진행 상황 자동 보고 (주기별)
  ↓
블로커 발견 → 즉시 보고
  ↓
다른 일이 들어와도 → CTB 계속 추적
  ↓
완료 예정일 앞당기기 (eager pulling)
```

### Phase 3: Completion
```
결과물 도출
  ↓
명확하게 제시 ("[경로] 완료, 다음은...")
  ↓
CTB 상태 업데이트 (✅)
  ↓
다음 단계 즉시 착수 (no confirmation ask)
```

### 예외 처리 (Exception handling)
- 누락된 항목 발견 시 → 즉시 블로킹 보고
- 돌이킬 수 없는 액션 → 다른 업무 즉시 중지, 우선 처리

---

## 절대 금지 (Never do these)

- ❌ Task를 지시받고 메모리에 저장 안 함
- ❌ active_work_tracking.md에 등록 안 함
- ❌ 작업을 시작한 후 중간에 포기 (블로커 있더라도 리포트 필수)
- ❌ 다른 업무가 들어왔다고 기존 task tracking 중단
- ❌ 완료 후 "다음 할까요?" 묻기 (그냥 시작)
- ❌ 예약진행으로 미루기 (immediate execution only)

---

**Last updated:** 2026-05-26 (consolidated from task_completion_rule + task_ownership)
**Previous versions:** feedback_absolute_task_ownership.md (now deprecated — see consolidatedFrom)
