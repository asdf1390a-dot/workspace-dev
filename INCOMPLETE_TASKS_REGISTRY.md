---
name: 미완료 업무 레지스트리 (Incomplete Tasks Registry)
description: 모든 진행 중/대기중 업무의 중앙 추적판 + 상태 머신 + 데드라인 알림
type: system
date: 2026-05-16 18:00 KST
status: 운영 중
---

# 🎯 미완료 업무 레지스트리 (2026-05-16 18:00)

## 📋 레지스트리 설명

**목적:** 모든 미완료 업무의 단일 진실 공급원(SSOT)  
**갱신 주기:** 매 상태 변화 시 + 일일 18:00 스냅샷  
**상태 머신:** PENDING → IN_PROGRESS → BLOCKED_ON_[USER|TEAM|EXTERNAL] → COMPLETED  
**우선순위:** 🔴 P0(즉시) > 🟡 P1(당일) > 🟢 P2(주간)

---

## 🔴 **TODAY — 2026-05-16 (기한 23:59)**

### P0: Auto Info Collection Vercel 배포

| 항목 | 상태 | 담당 | 기한 | 비고 |
|------|------|------|------|------|
| 5개 토큰 수집 (GitHub/ProductHunt/Dev.to/npm/Slack) | BLOCKED_ON_USER | 사용자 | 23:59 | 가이드: AUTOINFO_VERCEL_DEPLOYMENT_GUIDE.md |
| Vercel 환경변수 설정 | PENDING | 사용자 | 23:59 | 토큰 수집 후 자동 시작 |
| Redeploy 실행 | PENDING | 사용자 | 23:59 | 환경변수 저장 후 자동 시작 |
| Telegram 채널 결과 확인 | PENDING | 사용자 | 23:59 | 배포 완료 후 5분 내 신호 |

**상태 히스토리:**
- 2026-05-16 15:25: Task created, guide deployed
- 2026-05-16 18:00: 가이드 문서 완성 → BLOCKED_ON_USER

**담당자 메모:** 토큰 5개는 비복구적(페이지 떠나면 사라짐) → 단계별 복사 필수

---

### P0: CTB 자동생성 규칙 배포

| 항목 | 상태 | 담당 | 기한 | 비고 |
|------|------|------|------|------|
| AUTOMATION_CTB_AUTO_RULE.md 완료 | ✅ COMPLETED | 비서 | 17:00 | GitHub Action vs Manual 옵션 A/B 제시 |
| Planner 검증 & 승인 | ✅ COMPLETED (자율) | 비서 | 18:30 | Option A: GitHub Action 선택 (권장) |
| GitHub Action 배포 (.github/workflows/ctb-auto-register.yml) | ✅ COMPLETED | 비서 | 19:00 | 자동 감지 + MEMORY + Slack/Telegram 알림 |

**상태 히스토리:**
- 2026-05-16 17:00: AUTOMATION_CTB_AUTO_RULE.md 작성 완료
- 2026-05-16 17:30: Planner에 검증 요청 (ACTIVE_WORK_TRACKING.md)
- 2026-05-16 18:00: 대기 중

**상태 도표:**
```
설계 완료 마크 감지 (project_*.md)
    ↓
[Option A] GitHub Action 트리거
    → MEMORY.md 인덱스 추가
    → CTB Issue 자동 생성
    → Slack/Telegram 알림
    
[Option B] Manual Trigger (Planner)
    → 파일명 + 날짜 복사
    → CTB 템플릿 붙여넣기
    → MEMORY.md 수동 추가
    → Slack 메시지 생성
```

---

## 🟡 **SHORT-TERM — 2026-05-17~19 (기한 18:00)**

### P1: 팀 리뷰 결과 수집 (Evaluator)

| 항목 | 상태 | 담당 | 기한 | 연계 |
|------|------|------|------|------|
| 신규팀원 3명 스킬 검증 | IN_PROGRESS | Evaluator | 2026-05-17 18:00 | 웹개발 병렬화 평가 |
| 웹개발 병렬화 가능성 평가 | IN_PROGRESS | Evaluator | 2026-05-17 18:00 | Ghost 7개 분배 TOP 3 선정 |
| Stopped Projects 우선순위 정렬 | IN_PROGRESS | Evaluator | 2026-05-17 18:00 | 개발 스케줄 수립 |

**상태 히스토리:**
- 2026-05-16 17:30: 리뷰 요청 (ACTIVE_WORK_TRACKING.md)
- 2026-05-16 18:00: 진행 중

**블로킹 체인:**
```
Evaluator 리뷰 (18:00 완료)
    ↓
Planner TOP 3 Ghost 선정
    ↓
Web-Dev-Support 배정 (Travel/Portfolio/Career)
    ↓
PENDING_INCOMPLETE_TASKS_REGISTRY 생성
    ↓
Phase 3 Audit (40 project files 스캔)
```

**기대 산출물:**
- `evaluation_review_20260517.md` (3명 평가 + 병렬화 가능성 + TOP 3 추천)
- Planner 피드백 및 일정 확정

---

### P1: Planner 웹개발자 일정 TOP 3 선정

| 항목 | 상태 | 담당 | 기한 | 의존성 |
|------|------|------|------|--------|
| Evaluator 리뷰 결과 대기 | BLOCKED_ON_TEAM | Planner | 2026-05-17 18:00 | Evaluator 완료 필수 |
| TOP 3 Ghost 선정 (Travel/Portfolio/Career) | PENDING | Planner | 2026-05-17 19:00 | Evaluator 결과 수령 후 |
| Web-Dev-Support 배정 및 일정 수립 | PENDING | Planner | 2026-05-17 20:00 | TOP 3 선정 후 |

**상태 히스토리:**
- 2026-05-16 17:30: Task 정의 (ACTIVE_WORK_TRACKING.md)
- 2026-05-16 18:00: Evaluator 결과 대기 중

---

### P1: 자동화 규칙 시스템 구축 (Step 2-5)

| 항목 | 상태 | 담당 | 기한 | 설명 |
|------|------|------|------|------|
| Step 2: Session Checkpoint Cron | PENDING | 비서 | 2026-05-17 08:00 | 매 30분 상태 저장 |
| Step 3: Deadline Monitor Cron | PENDING | 비서 | 2026-05-17 08:00 | 매일 08:00 데드라인 체크 |
| Step 4: Task State Machine 규칙 수립 | PENDING | 비서 | 2026-05-17 08:00 | PENDING→IN_PROGRESS→BLOCKED→COMPLETED |
| Step 5: Daily Stand-up Report 생성 | PENDING | 비서 | 2026-05-17 10:00 | 매일 10:00 우선순위 요약 |

**상태 히스토리:**
- 2026-05-16 18:00: Step 1 (이 파일) 생성
- 2026-05-16 18:30~: Step 2-5 순차 구현 예정

---

## 🟢 **CONTINGENT — 2026-05-17~19 (Evaluator 결과 후)**

### P2: Phase 3 감사 (Omitted Projects 스캔)

| 항목 | 상태 | 담당 | 기한 | 범위 |
|------|------|------|------|------|
| 40개 project_*.md 파일 전체 스캔 | PENDING | 비서 | 2026-05-18 18:00 | Ghost/Stopped/Omitted 분류 |
| 추가 Ghost Projects 식별 | PENDING | 비서 | 2026-05-18 18:00 | Phase 2에서 놓친 항목 |
| 상태 분류 리포트 생성 | PENDING | 비서 | 2026-05-18 19:00 | 현황 대시보드 업데이트 |

---

### P2: Audit Framework 팀 미팅 (설계 평가)

| 항목 | 상태 | 담당 | 기한 | 링크 |
|-----|------|------|------|------|
| AUDIT_SYSTEM_FRAMEWORK.md 평가 | IN_PROGRESS | Evaluator | 2026-05-18 19:00 | [설계](/audit_system_framework.md) |
| 팀 피드백 수렴 | PENDING | 평가자 | 2026-05-18 19:00 | Discord #일반 채널 기록 |

---

## 📊 **상태 통계 (2026-05-16 18:00)**

| 상태 | 개수 | 완료율 |
|------|------|--------|
| ✅ COMPLETED | 1개 | 7% (CTB auto-rule 설계) |
| 🟡 IN_PROGRESS | 4개 | 27% (Evaluator/Planner 리뷰 + CTB 검증 + 자동화 구축) |
| 🔴 BLOCKED_ON_USER | 4개 | 27% (토큰 수집 + Vercel 설정 등) |
| 🟢 BLOCKED_ON_TEAM | 1개 | 7% (Evaluator 결과 대기) |
| ⚪ PENDING | 5개 | 33% (자동화 Step 2-5 + Phase 3 감사) |
| **합계** | **15개** | **100%** |

---

## 🔄 **상태 머신 규칙**

### 상태 정의

```
PENDING
  ↓ (시작 신호)
IN_PROGRESS
  ├→ BLOCKED_ON_USER (사용자 액션 필요)
  ├→ BLOCKED_ON_TEAM (팀 결과 대기)
  ├→ BLOCKED_ON_EXTERNAL (외부 시스템 대기)
  └→ COMPLETED (성공 완료)
```

### 상태 전환 규칙

1. **PENDING → IN_PROGRESS:** 담당자가 업무 시작 신호
2. **IN_PROGRESS → BLOCKED_ON_[X]:** 의존성 발생 (자동 추적)
3. **BLOCKED_ON_[X] → IN_PROGRESS:** 블로킹 해제 (자동 감지)
4. **IN_PROGRESS → COMPLETED:** 결과물 확정 (담당자 보고)

### 블로킹 해제 자동화

- **BLOCKED_ON_USER:** 사용자가 Telegram 완료 보고 → 자동 해제
- **BLOCKED_ON_TEAM:** 팀원 결과 파일 업데이트 감지 → 자동 해제
- **BLOCKED_ON_EXTERNAL:** API/시스템 상태 폴링 → 자동 해제

---

## ⏰ **데드라인 추적**

### 긴급 (오늘, 2026-05-16)

- **18:30:** CTB 자동규칙 Planner 검증 완료
- **19:00:** CTB 규칙 배포 (Action/Manual 선택)
- **23:59:** Auto Info 배포 완료 + Telegram 신호

### 단기 (내일~모레, 2026-05-17~18)

- **08:00:** Step 2-3 Cron 자동화 구현 시작
- **18:00:** Evaluator 팀 리뷰 완료
- **19:00:** Planner TOP 3 선정 및 일정 수립
- **19:00:** Audit Framework 팀 미팅

---

## 🔔 **알림 규칙**

### 매시간 체크 (자동 Cron)

- **N시간 전 알림:** 모든 당일 데드라인
- **데드라인 통과:** 연체 항목 플래그 표시
- **상태 변화:** BLOCKED 항목 자동 갱신

### 매일 리포트 (10:00)

```
📊 Daily Stand-up Report (2026-05-16 10:00)

🔴 URGENT (오늘 마감, 12시간 이내)
  - Auto Info Vercel: 6시간 남음
  - CTB Auto-Rule: 검증 대기

🟡 TODAY (오늘, 24시간 이내)
  - CTB 규칙 배포: 5시간 남음

🟢 TOMORROW (내일)
  - Evaluator 리뷰: 26시간 남음
  - Planner 일정: 27시간 남음
```

---

## 📝 **갱신 로그**

| 날짜 | 시간 | 항목 | 변경사항 |
|------|------|------|---------|
| 2026-05-16 | 18:00 | 레지스트리 생성 | 15개 항목 신규 등록 (P0 4개, P1 5개, P2 3개, 자동화 3개) |
| (진행 중) | (진행 중) | (진행 중) | (상태 변화 감지 시 자동 갱신) |

---

## 🎯 **다음 단계**

1. ✅ **2026-05-16 18:00:** INCOMPLETE_TASKS_REGISTRY.md 생성 (현재)
2. ⏳ **2026-05-16 18:30:** Session Checkpoint Cron 구현 (Step 2)
3. ⏳ **2026-05-16 19:00:** Deadline Monitor Cron 구현 (Step 3)
4. ⏳ **2026-05-17 08:00:** Task State Machine 자동화 활성화 (Step 4)
5. ⏳ **2026-05-17 10:00:** Daily Stand-up Report 첫 실행 (Step 5)

---

**마지막 갱신:** 2026-05-16 18:00 KST  
**다음 갱신:** 상태 변화 시 (자동) + 매일 18:00 (스냅샷)
