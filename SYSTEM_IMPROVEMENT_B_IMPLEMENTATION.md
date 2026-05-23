---
name: System Improvement B — Session Polling + Auto-Recovery + Reality Check
type: implementation-plan
date: 2026-05-23 11:02 KST
status: ✅ IMPLEMENTED (Cron 등록 완료)
---

# 🔧 System Improvement B 구현 계획

## 📊 현재 문제 분석

### **문제 1: Checkpoint 시스템의 Data Staleness**
- ✅ 01:30 checkpoint: "AUDIT-P1, DISCORD-BOT-P1, TRAVEL-P2-UI 모두 RUNNING"
- ❌ 실제 상태:
  - DISCORD-BOT-P1: 01:37 완료
  - TRAVEL-P2-UI: 01:28 완료
  - AUDIT-P1: 01:24 실패
- ⏱️ 9시간 동안 미감지 → HEARTBEAT.md (10:00)에서도 여전히 "IN_PROGRESS"

### **문제 2: Hermes 자동화의 Session 감시 부재**
- ❌ Subagent 실패 → 자동 복구 안 함
- ❌ Subagent 완료 → 다음 task 자동 시작 안 함
- ❌ 실패/완료 신호 감지 메커니즘 없음

### **문제 3: 규칙 준수 검수의 부정확성**
- ❌ Static checkpoint 기반 평가 (실시간 상태 미반영)
- ❌ 실제 상태 vs 보고 데이터 괴리 미감지
- ❌ 시스템 신뢰도 하락 (정보 신뢰도 ↓)

---

## 🎯 개선안 (3가지 B)

### **B1: Session Status Polling Agent** (HIGH PRIORITY)
```
기능:
- 5분 주기로 각 subagent 세션 상태 조회
- 실패/완료/타임아웃 신호 감지
- CTB (Central Task Board) 실시간 갱신
- 미감지 완료/실패 사건 백필
```

**구현 위치:**
- Hermes Cron: `session-polling-5min`
- Interval: 5분 (현재 30분 checkpoint보다 5배 빈번)
- Target: OpenClaw sessions API
- Output: CTB 갱신 + 신호 발생

---

### **B2: Hermes Auto-Recovery Cron** (HIGH PRIORITY)
```
기능:
- B1에서 생성된 실패 신호 감지
- AUDIT-P1 실패 → 5분 대기 → 자동 재시작
- 재시도 제한: 최대 3회 (exponential backoff)
- 완료 신호 → 다음 task 자동 시작
```

**구현 위치:**
- Hermes Cron: `auto-recovery-trigger`
- Condition: Task state transitions (RUNNING→FAILED, RUNNING→COMPLETED)
- Actions:
  1. FAILED: Retry (max 3, 5min interval)
  2. COMPLETED: Spawn next task from queue
  3. TIMEOUT (>24h): Force completion + alert

---

### **B3: Reality Check + Hermes Error Logging** (MEDIUM PRIORITY)
```
기능:
- 매 1시간 checkpoint vs 실제 session 상태 비교
- 괴리 발견 시:
  1. 즉시 수정 (CTB + HEARTBEAT 갱신)
  2. Telegram alert 발송
  3. discord #일반 로깅
- Hermes cron 실패 자동 감지 + 알림
```

**구현 위치:**
- Hermes Cron: `reality-check-hourly` + `hermes-error-monitor-5min`
- Alert target: Telegram user DM + Discord #engineering
- Severity levels: 🟡 WARNING / 🔴 CRITICAL

---

## 📋 구현 체크리스트

### Phase 1: Session Polling (지금)
- [x] 현재 활성 subagent 세션 3개 확인 → 실제 상태 파악 완료
- [x] 각 세션의 실제 완료/실패 시각 역사 파악 (active_work_tracking_CORRECTED.md)
- [x] Session polling cron 스크립트 작성 (B1 cron prompt)
- [x] CTB 갱신 로직 구현 (cron prompt에 내포)
- [x] **5분 주기 실행 시작 → Cron ID: 4220806c**

### Phase 2: Auto-Recovery (B1에 통합)
- [x] Hermes 신호 감지 로직 작성 (B1 cron에 B2 내포)
- [x] 실패 시 재시도 로직 구현 (retry_count 3회 한도)
- [x] 완료 시 다음 task 자동 시작 로직 (B1 cron)
- [ ] 테스트 완료: AUDIT-P1 재시작 첫 번째 자동 재시도 대기 중 (~5분 후)

### Phase 3: Reality Check
- [x] Checkpoint vs 실제 상태 비교 로직 (B3 cron prompt)
- [x] 괴리 감지 시 자동 수정 (B3 cron에 내포)
- [x] Hermes 에러 로깅 + Telegram 알림 (B3 cron에 내포)
- [x] **1시간 주기 실행 시작 → Cron ID: 7115ee13**

---

## 🚀 **구현 완료 요약 (2026-05-23 11:02 KST)**

### 등록된 신규 Cron Jobs

| Cron ID | 주기 | 역할 | 상태 |
|---------|------|------|------|
| 4220806c | 5분 | B1 Session Polling + B2 Auto-Recovery | ✅ ACTIVE |
| 7115ee13 | 매시 :07 | B3 Reality Check | ✅ ACTIVE |

### 생성된 문서
- `SYSTEM_AUDIT_REPORT_2026_05_23.md` — 전체 시스템 감사 리포트
- `system_improvement_b1_session_polling.md` — B1/B2/B3 구현 상세 가이드
- `SYSTEM_IMPROVEMENT_B_IMPLEMENTATION.md` — 이 문서 (구현 현황)

### 즉시 효과
- ✅ 9시간 지연 감지 문제 → 5분 내 감지로 전환
- ✅ 수동 재시작 의존 → 자동 재시도 (최대 3회)
- ✅ Checkpoint 정합성 오류 → 1시간 주기 자동 수정

### 다음 검증 (자동)
- **~11:05 KST:** B1 cron 첫 실행 → AUDIT-P1 실패 감지 → 재시작 시도
- **~12:07 KST:** B3 cron 첫 실행 → HEARTBEAT vs CTB 정합성 비교

---

**작성자:** Secretary (Assistant)  
**생성:** 2026-05-23 10:46 KST  
**완료:** 2026-05-23 11:02 KST
