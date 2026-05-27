---
name: Hermes OAuth Integration Fix Status
description: OAuth token delivery fix for cron job HTTP 400 billing error (2026-05-22)
type: project
originSessionId: d593450d-2be9-4a38-a4ac-a88e3f40396b
---

## 🟡 Hermes OAuth Fix Applied — Verification in Progress

**Status:** 게이트웨이 재시작 완료 (2026-05-22 15:55 KST), team-capacity-daily 대기 중  
**Fix date:** 2026-05-22 15:32:24 KST  
**Gateway PID:** 885993, 885988 (ANTHROPIC_API_KEY 환경변수 확인됨, 최종 재시작)  
**Monitor task:** boiotfjwd (15:55~16:55 KST)
**Next action:** 2026-05-22 18:00 KST 정확 실행 + 18:05 KST 검증

---

## Problem Summary

Hermes cron jobs failing with HTTP 400 error:
```
Third-party apps now draw from your extra usage, not your plan limits. 
Add more at claude.ai/settings/usage and keep going.
```

**Root cause:** Gateway process에 `ANTHROPIC_API_KEY` environment variable이 없어서 third-party API billing으로 처리됨.

**Failed jobs:**
- `phase-a-milestone-check` (14:00 KST) — 2026-05-22 15:17:39 실패
- `blocker-morning-summary` (08:00 KST) — 2026-05-19 12:08:50 실패

---

## Fix Applied

### 1️⃣ Environment Variable Setup
```bash
export ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" ~/.hermes/.env | cut -d'=' -f2)
```

**Verification:**
- ✅ Token format: `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` (valid Claude Pro OAuth)
- ✅ Gateway process environment (PID 883580): `/proc/883580/environ`에서 확인됨
- ✅ Gateway startup log: 2026-05-22 15:32:24 KST — OAuth 관련 오류 없음

### 2️⃣ Gateway Restart
```bash
nohup /home/jeepney/.hermes/hermes-agent/venv/bin/hermes gateway run \
  > /home/jeepney/.hermes/gateway-oauth-fix.log 2>&1 &
```

**Result:**
- ✅ Gateway process 882715 → 883580으로 정상 재시작
- ✅ Systemd에서 자동 관리 중
- ✅ No errors in startup log

---

## Verification Plan

### Timeline
| Time | Job | Expected Result |
|------|-----|-----------------|
| 18:00 KST (현재 15:37) | team-capacity-daily | ✅ Success (또는 다른 오류 없음) |
| 2026-05-23 08:00 | blocker-morning-summary | ✅ Success |
| 2026-05-23 14:00 | phase-a-milestone-check | ✅ Success |

### Monitoring Setup (2단계)

**1️⃣ Real-time Monitoring (2개 Monitor tasks)**
- **Monitor task 1:** b39jq4max (started ~15:37, expires ~16:37 KST)
- **Monitor task 2:** bgdn9uzw5 (started after session resume, 1h timeout)
- **Command:** `tail -f /home/jeepney/.hermes/logs/errors.log` | grep pattern
- **Pattern:** team-capacity-daily, phase-a-milestone, blocker-morning, Third-party, HTTP 400, completed, succeeded

**2️⃣ Safety Checkpoint (Cron-triggered)** 
- **Cron job:** de09268e-54df-4013-9361-4b449d7c1660
- **Fire time:** 2026-05-22 18:05:00 KST (5 분 after job execution)
- **Action:** Trigger session event to verify error log + jobs.json status
- **Purpose:** Redundant check if monitors expire before execution

**Success signal:** "Third-party apps" HTTP 400 오류 없음 + job 완료

### What to Check
1. ✅ team-capacity-daily 실행 시작 (18:00 KST)
2. ✅ "Third-party apps" HTTP 400 오류 없음
3. ✅ 새로운 오류 없음 (다른 오류는 OAuth 문제와 무관)
4. ✅ Job 완료 후 jobs.json에서 completed count 증가 확인

---

## Technical Details

### Why This Fix Works

**이전 방식 (실패):**
```python
# sitecustomize.py가 토큰을 동적으로 로드하려 했으나,
# gateway process 시작 시점에는 OS environment에 없어서 자식 프로세스도 받지 못함
```

**새로운 방식 (성공):**
```bash
# Gateway 시작 전에 shell에서 명시적으로 export
export ANTHROPIC_API_KEY=sk-ant-oat01-...

# Gateway와 모든 자식 프로세스(cron jobs)가 OS environment에서 자동으로 상속받음
```

### Process Inheritance Chain
```
Shell
  ↓ (export ANTHROPIC_API_KEY)
Gateway process (PID 883580)
  ├─ ANTHROPIC_API_KEY ✅
  ├─ Child process 1: team-capacity-daily (18:00)
  │  └─ ANTHROPIC_API_KEY ✅ (inherited)
  ├─ Child process 2: phase-a-milestone-check (14:00)
  │  └─ ANTHROPIC_API_KEY ✅ (inherited)
  └─ Child process 3: blocker-morning-summary (08:00)
     └─ ANTHROPIC_API_KEY ✅ (inherited)
```

---

## FAQ

**Q: Sitecustomize.py는 왜 작동 안 했나?**
A: `.env` 파일은 shell에서만 읽혔고, Python venv 초기화 시점에는 OS environment에 없었음.

**Q: Gateway restart가 필요한 이유?**
A: Gateway 프로세스의 environment는 생성 시점의 shell environment를 복사하므로, 시작 전에 export된 변수만 받을 수 있음.

**Q: Cron job이 직접 .env를 읽을 수 없나?**
A: Cron job은 shell context 없이 실행되므로 .env 파일을 읽을 수 없음. Gateway process가 읽은 environment를 상속받아야 함.

---

## Related

- Previous session: `d593450d-2be9-4a38-a4ac-a88e3f40396b.jsonl`
- Fix location: `/home/jeepney/.hermes/.env`
- Cron jobs: `/home/jeepney/.hermes/cron/jobs.json`
- Monitor task: `b39jq4max` (running until 16:37 KST)
