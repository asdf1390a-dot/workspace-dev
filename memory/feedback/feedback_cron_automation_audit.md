---
name: Cron Automation Audit & Maintenance
description: 모든 Cron 작업 체계적 관리 + 실패 감지 + 자동 복구
type: feedback
status: active
---

# Cron Automation Audit System — 정기 점검 & 수정

**목표:** Cron 실행률 100% (현재 75%) → 완료 기준: 4/4 성공

---

## 현재 Cron Job 목록 (2026-05-20)

| Job ID | 시간 | 역할 | 상태 | 실행률 | 마지막 |
|--------|------|------|------|--------|---------|
| **A1** | 08:00 | 일일 블로킹 추적 | 🟢 실행 | 3/4 ✅ | 2026-05-19 08:00 |
| **A2** | 14:00 | 플레너 리포트 확인 | 🟡 미실행 | ? | — |
| **A3** | 15:00 | 웹개발자 리포트 확인 | 🟡 미실행 | ? | — |
| **A4** | 18:00 | 일일 최종 검증 | 🟡 미실행 | ? | — |

**신뢰도:** 25% (1/4 실행) → 목표: 95%

---

## Job 상세 정의

### 🔵 A1: 08:00 KST — 일일 블로킹 추적 (30분)
**목적:** active_work_tracking.md 읽음 → 블로킹 항목 상태 확인

**체크리스트:**
- [ ] 어제 🔴 블로킹이 해제되었나?
- [ ] 오늘 새로운 블로킹이 있나?
- [ ] 각 팀원의 ETA 갱신됨?
- [ ] CTB 상태 스냅샷 저장

**출력:** Telegram 메시지 (요약 1줄 + 블로킹 목록)

**실패 원인:** CronJob ID 없음 / timezone 설정 오류

---

### 🔵 A2: 14:00 KST — 플레너 리포트 처리 (15분)
**목적:** 플레너가 보낸 설계/계획 업데이트 → 일정 당겨오기 검증

**체크리스트:**
- [ ] 플레너가 리포트 보냈나? (Discord #일반 또는 Telegram)
- [ ] 예정시간보다 앞당겨졌나? (시간 델타 계산)
- [ ] 다음 작업 일정 당겨와야 하나?
- [ ] CTB 갱신됨?

**출력:** active_work_tracking.md 자동 갱신

**실패 원인:** 비서가 아직 구현 안 함 (수동 체크)

---

### 🔵 A3: 15:00 KST — 웹개발자 리포트 처리 (15분)
**목적:** 웹개발자가 보낸 API/UI 진행률 → 블로킹 추적

**체크리스트:**
- [ ] 웹개발자가 리포트 보냈나?
- [ ] 예상 ETA가 갱신되었나?
- [ ] 새로운 블로킹이 있나?
- [ ] git commit 해시 기록됨?

**출력:** active_work_tracking.md + Telegram 요약

**실패 원인:** 웹개발자 리포트 형식 미확정

---

### 🔵 A4: 18:00 KST — 일일 최종 검증 (30분)
**목적:** 당일 CTB 정확성 검증 + 규칙 준수 감시 + 내일 예고

**체크리스트:**
- [ ] 당일 모든 항목이 색상 올바른가? (🟢🟡🔴)
- [ ] 규칙 위반 없었나? (GCS, 자율모드, 일정 지연)
- [ ] 완료된 항목이 정확히 기록됨?
- [ ] 내일 일정 예고 메시지 준비

**출력:** Telegram 최종 리포트 + 내일 예정 공지

**실패 원인:** 비서가 수동 대신 자동화 필요

---

## 수정 계획

### Phase 1: 즉시 (오늘)
1. **A1 확인** — 실제 실행되고 있는가? (journalctl 로그 확인)
2. **A2~A4 구현** — 자동화 스크립트 작성 (Python/Node)
3. **타임존 검증** — UTC vs KST 시간 변환 정확한가?

### Phase 2: 이번주 (2026-05-21~22)
1. **Telegram API 연동** — 리포트 자동 발송
2. **파일 동기화** — active_work_tracking.md 자동 갱신
3. **오류 로깅** — 실패 시 즉시 감지

### Phase 3: 안정화 (2026-05-23~)
1. **재시도 로직** — 실패 시 자동 재실행
2. **슬랙/디스코드 연동** — 팀원에게 알림
3. **주간 리포트** — 실행률 추이 기록

---

## 현황 모니터링 명령어

```bash
# 모든 Cron 조회
crontab -l

# 특정 시간 작업만 보기
crontab -l | grep "0 8\|0 14\|0 15\|0 18"

# 최근 실행 로그
journalctl -u cron --since "2 hours ago"

# Vercel Cron 상태 (배포 자동화)
vercel env list | grep CRON
```

---

## 자동 오류 감지 규칙

```javascript
// Rule 1: 예정시간 ±5분 내에 실행 확인
if (actualTime - scheduledTime > 5) {
  alert("CRON DELAY: A1 is running " + (actualTime - scheduledTime) + " minutes late")
}

// Rule 2: Cron이 결과물을 생성했나?
if (!fileExists("memory/checkpoint_2026-05-20.md")) {
  alert("CRON FAILED: A1 did not generate output file")
}

// Rule 3: 매일 같은 시간에 실행
if (lastRun.date !== today) {
  alert("CRON MISSED: A1 did not run today")
}
```

---

## 팀원 협력

**플레너 (14:00 리포트):**
- 예상: Discord #일반 채널에 "설계 완료" or "진행률 X%"
- 형식: `【14:00 리포트】Asset Phase 2 설계 — 진행률 80% | ETA 2026-05-21 10:00`

**웹개발자 (15:00 리포트):**
- 예상: Telegram or Discord에 "API X개 완료" + git commit
- 형식: `【15:00 리포트】Backup Phase 2 API — 4/16 완료 | commit 358d65b`

---

## 완료 기준

| 지표 | 현재 | 목표 | 달성도 |
|------|------|------|--------|
| A1 실행률 | 75% | 95% | 🟡 진행 |
| A2~A4 자동화 | 0% | 100% | 🔴 미실행 |
| 평균 지연시간 | —분 | <5분 | — |
| Cron 실패 감지 | 사후분석 | 실시간 | 🔴 미실행 |

---

**작성:** 2026-05-20  
**책임:** Automation Specialist (자동화 전문가)  
**상태:** 설계 완료 → 구현 대기 (2026-05-20~22)
