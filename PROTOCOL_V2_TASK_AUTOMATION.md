---
name: Protocol v2 작업 자동화 시스템 (Step 2-5)
description: Session Checkpoint + Deadline Monitor + Task State Machine + Daily Report
type: system
date: 2026-05-16 18:15 KST
status: 구현 중
---

# Protocol v2 작업 자동화 시스템 (Step 2-5)

## 📋 개요

Step 1 (INCOMPLETE_TASKS_REGISTRY.md)의 중앙 레지스트리를 기반으로, 4개의 자동화 시스템으로 구성:

1. **Step 2: Session Checkpoint Cron** — 30분마다 상태 저장
2. **Step 3: Deadline Monitor Cron** — 매일 08:00 데드라인 체크
3. **Step 4: Task State Machine** — 자동 상태 전환 감지
4. **Step 5: Daily Stand-up Report** — 매일 10:00 우선순위 리포트

---

## 🔧 Step 2: Session Checkpoint Cron (30분 간격)

### 목적
장시간 작업으로 인한 context compression 방지 → 현재 상태를 정기적으로 저장

### 실행 기전

**트리거:** 매 30분 (08:00, 08:30, 09:00, ...)

**액션:**
1. INCOMPLETE_TASKS_REGISTRY.md 읽기
2. 마지막 갱신 이후 변경사항 확인
3. 변경 항목만 추출 → session_checkpoint_YYYYMMDD_HHMM.md 생성
4. INCOMPLETE_TASKS_REGISTRY.md 의 "갱신 로그" 섹션에 체크포인트 기록

### 체크포인트 파일 형식

```markdown
---
name: Session Checkpoint — 2026-05-16 18:30
description: INCOMPLETE_TASKS_REGISTRY.md 상태 스냅샷
checkpoint_id: ckpt_20260516_1830
---

# 체크포인트 (2026-05-16 18:30)

## 변경사항 요약
- CTB 자동규칙: IN_PROGRESS (Planner 검증 진행중)
- Auto Info: BLOCKED_ON_USER (토큰 5개 대기)
- Session Cron Step 2: 시작됨

## 현재 상태
[INCOMPLETE_TASKS_REGISTRY.md의 현재 섹션 전체 복사]

## 이전 체크포인트와의 비교
- New items: 0개
- Completed: 0개
- State changes: 1개 (CTB 규칙)
- Blocked items: 1개 (Auto Info)
```

### 저장 위치
- 위치: `/home/jeepney/.openclaw/workspace-dev/checkpoints/`
- 파일명: `session_checkpoint_YYYYMMDD_HHMM.md`
- 보관기간: 7일 (자동 삭제)

### Context Loss 방지 메커니즘

만약 대화가 중단되었거나 context가 손실된 경우:
1. 가장 최근 체크포인트 파일 읽기
2. INCOMPLETE_TASKS_REGISTRY.md 와 비교
3. 누락된 업데이트 확인 후 복구

---

## 📅 Step 3: Deadline Monitor Cron (매일 08:00)

### 목적
모든 업무의 데드라인을 추적하고, 기한 임박 시 자동 알림

### 실행 기전

**트리거:** 매일 08:00 KST

**체크 항목:**

```
1. 오늘 자정 이전 데드라인 (< 16시간)
   → 상태: 🔴 URGENT
   → 동작: 사용자 Telegram 알림 + Discord #일반 채널 기록

2. 내일 자정 이전 데드라인 (16-40시간)
   → 상태: 🟡 TODAY
   → 동작: 담당자 알림 (최소 1회)

3. 이후 데드라인 (40시간+)
   → 상태: 🟢 UPCOMING
   → 동작: Daily Stand-up Report에만 표시

4. 데드라인 초과
   → 상태: 🔴 OVERDUE
   → 동작: 즉시 플래그 + Telegram 심각 알림
```

### 알림 형식

**Telegram (사용자 개인):**
```
🚨 작업 데드라인 경고 (2026-05-16 08:00)

🔴 URGENT (12시간 이내):
  1️⃣ Auto Info Vercel: 15시간 남음 (기한 23:59)
  2️⃣ CTB 규칙 배포: 10시간 남음 (기한 19:00)

🟡 TODAY (24시간 이내):
  3️⃣ Evaluator 리뷰: 34시간 남음 (기한 2026-05-17 18:00)
```

**Discord (#일반 채널):**
```
[DEADLINE MONITOR] 2026-05-16 08:00

🔴 오늘 완료해야 할 항목: 2개
  • Auto Info Vercel (23:59)
  • CTB 규칙 배포 (19:00)

⚠️ 연체 항목: 0개
```

### 데드라인 계산 로직

```python
def check_deadline(due_date, current_time=now):
    hours_remaining = (due_date - current_time).total_seconds() / 3600
    
    if hours_remaining < 0:
        return "OVERDUE"  # 🔴
    elif hours_remaining < 12:
        return "URGENT"   # 🔴
    elif hours_remaining < 40:
        return "TODAY"    # 🟡
    else:
        return "UPCOMING" # 🟢
```

---

## 🔄 Step 4: Task State Machine (자동 상태 전환)

### 목적
업무의 상태 변화를 자동으로 감지 → INCOMPLETE_TASKS_REGISTRY.md 실시간 갱신

### 상태 정의

```
PENDING (대기)
  ├─ 의존성 없음
  ├─ 담당자가 시작 준비 완료
  └─ 초기 상태

IN_PROGRESS (진행 중)
  ├─ 담당자가 업무 시작함
  ├─ 결과 산출 중
  └─ 정기 진도 리포트 필요

BLOCKED_ON_USER (사용자 액션 대기)
  ├─ 사용자가 해야 할 일 있음
  ├─ 예: 토큰 발급, 승인, 정보 제공
  └─ 사용자 Telegram 완료 보고 → 자동 해제

BLOCKED_ON_TEAM (팀 의존)
  ├─ 다른 팀원 결과 대기
  ├─ 예: Evaluator 리뷰, Planner 승인
  └─ 팀원 파일 업데이트 감지 → 자동 해제

BLOCKED_ON_EXTERNAL (외부 의존)
  ├─ 외부 시스템 대기
  ├─ 예: GitHub Action 실행, Vercel 배포
  └─ 시스템 상태 폴링 → 자동 해제

COMPLETED (완료)
  ├─ 결과물 확정
  ├─ 담당자 완료 보고 필수
  └─ 최종 상태
```

### 자동 전환 규칙

#### Rule 1: BLOCKED_ON_USER → IN_PROGRESS
**감지:** 사용자가 Telegram에 완료 보고
**예시:** "Auto Info Vercel 배포 완료" → BLOCKED_ON_USER 자동 해제

#### Rule 2: BLOCKED_ON_TEAM → IN_PROGRESS
**감지:** 팀원 결과 파일 업데이트 (evaluation_review_20260517.md 등)
**예시:** Evaluator가 파일 업데이트 → Planner 자동으로 IN_PROGRESS 전환

#### Rule 3: IN_PROGRESS → COMPLETED
**감지:** 담당자가 Telegram/Discord에 "완료" 보고
**수동:** 비서가 INCOMPLETE_TASKS_REGISTRY.md 갱신

### 상태 전환 모니터링

**자동 감지 채널:**
1. Telegram 메시지 스캔 (사용자/팀 완료 보고)
2. GitHub 커밋 감지 (파일 업데이트 → 팀 작업 완료 신호)
3. 신규 파일 생성 감지 (evaluation_review_*.md 등)
4. 시간 기반 체크 (매 정시 08:00/14:00/18:00)

---

## 📊 Step 5: Daily Stand-up Report (매일 10:00)

### 목적
팀 전체의 작업 현황을 한눈에 파악 → 우선순위 조정 및 블로킹 해제

### 실행 기전

**트리거:** 매일 10:00 KST

**생성 위치:** `/home/jeepney/.openclaw/workspace-dev/daily_standup_YYYYMMDD.md`

### 리포트 형식

```markdown
---
name: Daily Stand-up Report — 2026-05-16
date: 2026-05-16
time: 10:00 KST
---

# 📊 Daily Stand-up Report — 2026-05-16 10:00

## 🚨 URGENT (오늘, 12시간 이내)

### 🔴 Auto Info Collection Vercel 배포
- **담당:** 사용자
- **상태:** BLOCKED_ON_USER (토큰 5개 수집 대기)
- **기한:** 오늘 23:59 (13시간 남음)
- **액션:** 
  * GitHub Token → Dev.to에서 발급
  * Product Hunt Token → producthunt.com/api/docs
  * Dev.to API Key → dev.to/settings/extensions
  * npm Token (선택) → npmjs.com/settings/~/tokens
  * Slack Webhook → api.slack.com/apps
  * Vercel 대시보드에 5개 모두 입력 후 Redeploy 실행

### 🔴 CTB 자동규칙 배포
- **담당:** Planner
- **상태:** IN_PROGRESS (Planner 검증 진행 중)
- **기한:** 오늘 19:00 (9시간 남음)
- **기대 완료:** GitHub Action 배포 또는 Manual 프로세스 시작

---

## 🟡 TODAY (오늘~내일, 24-40시간)

### Evaluator 팀 리뷰
- **담당:** Evaluator
- **상태:** IN_PROGRESS (3명 스킬 검증 + 병렬화 평가)
- **기한:** 내일 18:00 (34시간 남음)
- **산출물:** evaluation_review_20260517.md

### Planner 웹개발자 일정
- **담당:** Planner
- **상태:** BLOCKED_ON_TEAM (Evaluator 결과 대기)
- **기한:** 내일 19:00 (35시간 남음)
- **기대 결과:** TOP 3 Ghost Project 선정 + Web-Dev-Support 배정

---

## 🟢 UPCOMING (40시간+)

### Step 2-5 자동화 구축
- **담당:** 비서
- **상태:** IN_PROGRESS (Step 1 완료, Step 2-5 진행중)
- **기한:** 2026-05-17 10:00

### Phase 3 감사
- **담당:** 비서
- **상태:** PENDING (Evaluator 결과 후 시작)
- **기한:** 2026-05-18 18:00

---

## 📈 일일 통계

| 항목 | 수량 |
|------|------|
| 총 업무 | 15개 |
| 완료 | 1개 (7%) |
| 진행 중 | 4개 (27%) |
| 대기 중 | 10개 (66%) |
| **블로킹 항목** | **3개** |
| 연체 | 0개 |

---

## 🎯 오늘의 우선순위

1. **P0:** 사용자의 Auto Info Vercel 배포 (토큰 5개 수집 → 환경변수 설정 → Redeploy)
2. **P0:** CTB 자동규칙 Planner 검증 & 배포 (GitHub Action or Manual)
3. **P1:** Evaluator 팀 리뷰 진행 상황 모니터링

---

## 🔔 알림 요약

- ✅ Auto Info 가이드 문서 배포됨 (AUTOINFO_VERCEL_DEPLOYMENT_GUIDE.md)
- ✅ CTB 자동규칙 설계 완료됨 (AUTOMATION_CTB_AUTO_RULE.md)
- ⏳ Planner 검증 대기 중 (오늘 18:30까지)
- ⏳ 사용자 토큰 수집 대기 (오늘 23:59까지)

---

**생성 시간:** 2026-05-16 10:00 KST
```

### 리포트 배포 채널

1. **Telegram (사용자):** 핵심 우선순위 3개만
2. **Discord (#일반):** 전체 Stand-up Report 링크
3. **Workspace:** daily_standup_YYYYMMDD.md 저장

### 데이터 소스

1. INCOMPLETE_TASKS_REGISTRY.md 읽기
2. 최근 체크포인트 파일 비교
3. Telegram 메시지 스캔 (최근 12시간)
4. GitHub commit log 스캔 (최근 24시간)

---

## 🔗 통합 모니터링 대시보드

```
Every 30min:  Session Checkpoint Cron (Step 2)
      ↓
Every day 08:00: Deadline Monitor Cron (Step 3)
      ↓
Continuous: Task State Machine updates (Step 4)
      ↓
Every day 10:00: Daily Stand-up Report (Step 5)
      ↓
INCOMPLETE_TASKS_REGISTRY.md 실시간 갱신
```

---

## 📋 구현 체크리스트

- [x] Step 1: INCOMPLETE_TASKS_REGISTRY.md 생성 (2026-05-16 18:00)
- [ ] Step 2: Session Checkpoint Cron 실행 (2026-05-16 18:30)
- [ ] Step 3: Deadline Monitor Cron 실행 (2026-05-16 08:00, 매일)
- [ ] Step 4: Task State Machine 모니터링 (지속)
- [ ] Step 5: Daily Stand-up Report 생성 (2026-05-17 10:00, 매일)

---

**시스템 상태:** 진행 중 (Step 1 완료, Step 2-5 실행 준비 완료)
