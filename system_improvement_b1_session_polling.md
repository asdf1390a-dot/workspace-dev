---
name: System Improvement B1 — Session Polling + Auto-Recovery + Reality Check
type: implementation-guide
date: 2026-05-23 11:00 KST
status: CRON_REGISTERED
priority: 🔴 CRITICAL
status: READY FOR DEPLOYMENT
---

# 🔧 B1: Session Polling Cron 구현

## 목표
- **문제:** 30분 checkpoint로 인해 subagent 완료/실패 신호를 9시간 뒤에 감지
- **해결:** 5분마다 모든 활성 subagent 세션 상태 폴링 → CTB 실시간 갱신
- **효과:** 지연 시간 9시간 → 5분으로 단축

---

## 구현 방식

### 1️⃣ Cron Job 정의

**이름:** `session-polling-5min`  
**주기:** 5분 (300000ms)  
**대상:** OpenClaw `sessions_list` API  
**출력:** CTB (active_work_tracking.md) 실시간 갱신

### 2️⃣ Polling 로직

```python
# 의사코드
def session_polling_5min():
    # 1. 활성 subagent 세션 목록 조회
    active_sessions = [
        "agent:dev:subagent:0cf3c1ba",  # AUDIT-P1 (현재 실패 중)
        "agent:dev:subagent:585db4d5",  # DISCORD-BOT-P1 (완료됨)
        "agent:dev:subagent:e9396c74",  # TRAVEL-P2-UI (완료됨)
    ]
    
    # 2. 각 세션 상태 확인
    for session_id in active_sessions:
        session_status = openClaw.sessions_history(sessionKey=session_id, limit=1)
        
        # 3. 상태 변화 감지
        if session_status.status == "COMPLETED":
            ctb.update(session_id, "COMPLETED", timestamp=now)
            trigger_signal("COMPLETED", session_id)
        
        elif session_status.status == "FAILED":
            ctb.update(session_id, "FAILED", timestamp=now)
            trigger_signal("FAILED", session_id)
        
        elif session_status.status == "TIMEOUT" and duration > 24h:
            ctb.update(session_id, "TIMEOUT", timestamp=now)
            trigger_signal("TIMEOUT", session_id)
    
    # 4. CTB 갱신 완료 로그
    log_to_ctb(f"5min polling completed at {now}, {len(active_sessions)} sessions checked")
```

### 3️⃣ CTB 갱신 형식

**기존 (오류):**
```
❌ 01:30 checkpoint: "AUDIT-P1, DISCORD-BOT-P1, TRAVEL-P2-UI 모두 RUNNING"
(실제로는 01:28, 01:36, 02:01에 이미 완료됨)
```

**개선 (정확):**
```
✅ 01:32 polling: AUDIT-P1 실패 감지 (01:28)
✅ 01:37 polling: DISCORD-BOT-P1 완료 감지 (01:36)
✅ 02:06 polling: TRAVEL-P2-UI 완료 감지 (02:01)
```

---

## 신규 Cron Job 추가

### Cron 설정

```json
{
  "id": "polling-5min",
  "name": "Session Polling - 5min interval",
  "schedule": {
    "kind": "every",
    "everyMs": 300000,
    "anchorMs": 1779500849548
  },
  "payload": {
    "kind": "agentTurn",
    "message": "Session polling: check all active subagent sessions (AUDIT-P1, DISCORD-BOT-P1, TRAVEL-P2-UI, BM-P1). For each: (1) get latest status from sessions_history, (2) detect COMPLETED/FAILED/TIMEOUT, (3) update CTB timestamp, (4) trigger next-step signal if needed. Output only changes (new completions, failures, timeouts)."
  },
  "enabled": true,
  "sessionTarget": "session:agent:dev:main",
  "delivery": {
    "mode": "none"
  }
}
```

---

## 배포 체크리스트

### 사전 확인
- [ ] OpenClaw sessions API 접근 가능성 확인
- [ ] CTB (active_work_tracking.md) 쓰기 권한 확인
- [ ] 활성 subagent 세션 ID 3개 정확성 확인
  - AUDIT-P1: `0cf3c1ba-c3fd-47be-907a-ee13ed223700` (현재 실패 중)
  - DISCORD-BOT-P1: `585db4d5-33cc-4b48-8f55-cdf4c3c88935` (완료)
  - TRAVEL-P2-UI: `e9396c74-518c-4f98-b97d-fa5445269b90` (완료)
  - BM-P1 Evaluator: `ecc13a9f-399a-4085-bea1-986d7bd80c34` (완료)

### 배포 단계
1. [ ] OpenClaw gateway에서 cron 생성
2. [ ] 5분 대기 → 첫 폴링 실행 확인
3. [ ] CTB 업데이트 로그 확인
4. [ ] AUDIT-P1 실패 신호 감지 확인 (빌더에게 즉시 통보)

### 테스트 기준
- ✅ 5분 주기로 정확히 실행
- ✅ 각 subagent 상태 변화 감지 (100% 정확)
- ✅ CTB 타임스탬프 업데이트
- ✅ FAILED 신호 발생 시 B2 (Auto-Recovery) 트리거

---

## 기대 효과

| 항목 | 이전 | 개선 후 | 효과 |
|------|------|---------|------|
| 상태 감지 지연 | 9시간 | 5분 | 108배 단축 |
| Checkpoint 정확도 | 11% | 95%+ | 8배 향상 |
| 신뢰도 회복 시간 | - | 30분 (6주기) | 즉시 |
| 자동 복구 가능성 | 불가능 | 가능 | B2와 연계 |

---

## B1 이후 다음 단계

**B2 (Auto-Recovery)는 B1의 FAILED 신호를 받아서:**
1. 5분 대기
2. 자동으로 실패한 subagent 재시작
3. 최대 3회 재시도 (exponential backoff)

**B3 (Reality Check)는 B1의 데이터를 기반으로:**
1. 1시간마다 checkpoint vs 실제 상태 비교
2. 괴리 발견 시 즉시 수정 + Telegram 알림

---

**상태:** ✅ 배포 준비 완료  
**예상 배포 시간:** 2026-05-23 11:00 KST
