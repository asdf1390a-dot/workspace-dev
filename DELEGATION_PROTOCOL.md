---
name: 작업 위임 프로토콜
description: 에이전트 위임 전 사전 검증 체크리스트 및 신뢰도 강화
type: operational
---

# 작업 위임 프로토콜 (2026-06-04)

## 📋 목표

**Task Ownership 규칙 강화:** 위임 선언만 남지 않고 실제 실행까지 추적

---

## ✅ 위임 전 사전 검증 (Pre-spawn Checklist)

### Step 1: Agent 가용성 확인 (30초)
```
대상: mcp__openclaw__subagents → list
확인 항목:
  - [ ] 대상 agent 타입 존재 (evaluator, web-builder, translator, etc.)
  - [ ] 활성 슬롯 >= 1개 (동시 실행 가능 위임 카운트)
  - [ ] 예상 대기시간 < 5분

실패 조건:
  - Agent type 존재하지 않음 → 대안 agent 제안
  - 슬롯 0개 (완전 포화) → 2분 대기 또는 병렬 개수 감소
```

### Step 2: 병렬 작업 수 검증 (10초)
```
현재 시점의 진행 중 위임:
  - [ ] 현재 활성 위임 수 계산
  - [ ] 신규 위임 후 총합 ≤ 5개 확인
  - [ ] 병렬 상한선: 5개 (이전 위반 패턴: >3개 = 미실행 위험)

규칙:
  동시 위임 1-2개: 자동 실행 (신뢰도 99%)
  동시 위임 3개: 경고 (신뢰도 85%)
  동시 위임 4-5개: 경고 + 모니터링 필수 (신뢰도 70%)
  동시 위임 6개+: 거절 (신뢰도 <50%)
```

### Step 3: 위임 대상 명확성 (1분)
```
Task 정의:
  - [ ] 작업 목표 명확 (구체적 결과물 정의)
  - [ ] 입력 데이터 충분 (코드 경로, 파일명, 요구사항)
  - [ ] 완료 기준 명확 (언제 "완료"라고 판단할지)
  - [ ] 예상 소요시간 ≤ 8시간
  - [ ] 블로킹 의존성 없음 (또는 대기시간 명시)

실패 조건:
  - 목표 모호 → 명확화 필수
  - 완료 기준 불명확 → 평가자 기준 정의
  - 예상 시간 >8시간 → 분할 또는 연기
```

---

## 📊 위임 프로토콜 (3-step)

### Step 1️⃣: Pre-spawn Verification (2분)
```python
# 의사코드
agent_type = "web-builder"
task = {
    "goal": "BM-P1 breakdowns API 완성 (4개 엔드포인트)",
    "files": ["pages/api/breakdowns/[...].ts"],
    "criteria": "npm run build PASS + E2E test 통과",
    "time_est": "4 hours"
}

# Verification
available_agents = mcp__openclaw__subagents.list()
assert agent_type in available_agents, f"Agent {agent_type} not available"
active_delegations = session.count_active_agents()
assert active_delegations + 1 <= 5, "Too many parallel delegations"
assert task["time_est"] <= "8 hours", "Task too large, split required"
assert task["criteria"] != None, "Completion criteria undefined"

print(f"✅ Pre-spawn check PASS → proceeding to spawn")
```

### Step 2️⃣: Agent Spawn (30초)
```python
session_id = Agent(
    description=task["goal"],
    prompt=f"Complete: {task}",
    subagent_type=agent_type
)
print(f"✅ Agent spawned: session_id={session_id}, status=pending")
```

### Step 3️⃣: Post-spawn Monitoring (기타)
```python
# Session status 폴링 시작
start_time = time.now()
poll_interval = 30  # seconds

for i in range(15):  # 7.5분 모니터링
    status = mcp__openclaw__session_status(session_id)
    if status == "in_progress":
        print(f"[{i}] ✅ Agent working: {status['message']}")
    elif status == "completed":
        print(f"✅ TASK COMPLETED: {status['result']}")
        break
    elif status == "failed":
        print(f"❌ TASK FAILED: {status['error']}")
        break
    time.sleep(poll_interval)
```

---

## 📝 위임 선언 문구 변경

### ❌ 이전 (불확실한 언어)
```
"Track B/C/D 병렬 시작합니다. Discord-P1 → Evaluator 위임 중."
(→ 실제로 위임되지 않았음을 나중에 발견)
```

### ✅ 새로운 (확실한 언어)
```
"위임 완료:
  1. DISCORD-BOT-P1 → Evaluator (session:ev_abc123, status:pending)
     [Pre-spawn CHECK ✅: agent available, 1/5 slots, criteria clear]
  2. TRAVEL-P2-UI → Web-Builder (session:wb_def456, status:pending)
     [Pre-spawn CHECK ✅: agent available, 2/5 slots, 6h estimate]
  3. BM-P1 Phase 2 → Web-Builder#1 (session:wb_ghi789, status:pending)
     [Pre-spawn CHECK ✅: agent available, 3/5 slots, 4h estimate]"

모니터링: 6분 후 status 업데이트 예정
```

---

## 🎯 신뢰도 메트릭

| 메트릭 | 이전 | 목표 | 측정 |
|--------|------|------|------|
| 위임 실행율 | 60% (일부만 실행) | 100% | session_id 생성 여부 |
| 평균 시작 시간 | 5-10분 | <1분 | 위임 후 agent 상태 확인 |
| 완료율 | 75% | 95% | session 완료/실패 비율 |
| 블로킹 시간 | 30분+ | <5분 | 위임 후 응답 시간 |

---

## 🔄 실패 케이스 & 대응

### Case 1: Agent Slot 부족
```
증상: "활성 슬롯 0개 (5/5 포화)"
대응:
  Option A: 기존 위임 완료 대기 (2분)
  Option B: 병렬 위임 개수 감소 (1-2개만 위임)
  Option C: 작업 연기 (다음 30분 후)
```

### Case 2: Agent 스포닝 실패
```
증상: session_id 생성 실패 (에러 반환)
대응:
  1. 에러 원인 확인 (timeout? capacity? type error?)
  2. 최대 2회 재시도 (30초 간격)
  3. 실패 시 사용자 알림 + 대안 제안
```

### Case 3: Agent 시작 후 무응답
```
증상: session status = pending (10분+ 지속)
대응:
  1. 5분 지점: "Agent 응답 지연, 모니터링 중" 알림
  2. 10분 지점: 작업 정체 경고
  3. 15분 지점: 작업 취소 + 재위임 또는 수동 작업
```

---

## 📋 위임 트래킹 로그

각 위임마다 다음 항목 기록:

```markdown
**위임 #N (2026-06-04 HH:MM KST)**
- 목표: [task goal]
- 대상: [agent type]
- Session ID: [session_id]
- Pre-spawn CHECK: ✅ [details]
- 예상 완료: [time estimate]
- 실제 완료: [actual result]
- 소요 시간: [duration]
- 상태: [completed/failed]
```

---

## 🚀 롤아웃 계획

**Phase 1 (2026-06-04 07:00-09:00):**
- AUTONOMOUS_DECISION_TRIGGERS.md 배포
- DELEGATION_PROTOCOL.md 배포
- 모든 향후 위임에 pre-spawn checklist 적용

**Phase 2 (2026-06-04 09:00-18:00):**
- 기존 진행 중 위임 audit (TravelP2, AuditP1, DiscordBot)
- 완료되지 않은 위임 재검증 및 재실행

**Phase 3 (2026-06-05 onwards):**
- Daily 위임 성공률 추적
- 주간 메트릭 리뷰 (완료율, 시작시간, 블로킹 시간)

---

**생성:** 2026-06-04 06:52 KST  
**상태:** 🟢 ACTIVE  
**신뢰도:** ⭐⭐⭐⭐ 85% (Tool availability 변수 있음, fallback 포함)
