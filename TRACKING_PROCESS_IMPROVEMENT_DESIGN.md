# 추적 프로세스 개선 설계서
**Date:** 2026-05-15 | **Owner:** 플레너 | **Status:** 설계 완료 | **Task ID:** improve_tracking_process_v1

---

## 1단계: 문제 분석

### 발견된 5가지 문제점

| # | 문제 | 근본 원인 | 영향 | 심각도 |
|---|------|---------|------|--------|
| **1** | **CTB 해시 혼재** | workspace repo vs dsc-fms-portal submodule 커밋 구분 부재 | CTB에서 진행률 추적 불명확 | 🔴 높음 |
| **2** | **team_task_tracking.md 업데이트 지연** | 팀원 완료 결과 → CTB만 갱신, team_task_tracking.md 미반영 | 팀원별 역할 추적 불일치 | 🟡 중간 |
| **3** | **중복 메모리 파일** | status 관련 피드백 파일 3개 이상 | 메모리 일관성 저하 | 🟡 중간 |
| **4** | **블로킹 항목 미해결** | Travel Phase 2 scope 불일치 / Asset Master 구현 대기 | 의존 작업 진행 불가 | 🔴 높음 |
| **5** | **Gateway 재시작 로깅 미흡** | 자동 로그 구조 부재 | 패턴 분석 불가능 | 🔵 낮음 |

---

## 2단계: 개선 프로세스 설계

### 프로세스 1: 해시 추적 정책 재설계

#### 현황
- **workspace repo** (`/home/jeepney/.openclaw/workspace-dev`)
  - master 브랜치, 설계/계획 문서 저장
  - SOUL.md, MEMORY.md, 설계서 등
  
- **dsc-fms-portal submodule** (`dsc-fms-portal/`)
  - main 브랜치, 실제 코드 저장소
  - API, UI, DB 구현체

#### 문제점
- CTB (active_work_tracking.md)에서 "마지막 commit" 필드가 모호
- 어느 repo의 커밋인지 명확하지 않음
- 설계 완료 후 API 구현이 시작되면 양쪽 repo 모두 변경 발생

#### 개선안

**표기 방식 (표준화)**

```
[workspace] <short-hash> — <메시지>      # 설계, 계획 문서 변경
[dsc-fms-portal] <short-hash> — <메시지> # 실제 코드 구현
```

**예시**

```
마지막 commit (Backup App Phase 2 API):
- [workspace] 4afc5d3 — BACKUP_APP_PHASE2_DESIGN.md 작성 완료
- [dsc-fms-portal] 5658561 — feat: backup schedule API (POST /api/backup/schedule)
```

**CTB 필드 재구성**

| 필드명 | 이전 | 신규 | 설명 |
|--------|------|------|------|
| `마지막 commit` | 모호 | `[repo] hash — msg` | repo 명시 + 단축해시 + 메시지 |
| `설계 commit` | 없음 | `[workspace] hash` | 설계 완료 기점 |
| `코드 commit` | 없음 | `[dsc-fms-portal] hash` | 최신 구현 커밋 |

**프로세스 정의**

1. **설계 완료 시** (플레너)
   - workspace repo에 설계서 commit 생성
   - CTB 갱신: `[설계 commit]` 필드에 기록
   - 웹개발자에게 위임

2. **개발 진행 중** (웹개발자)
   - dsc-fms-portal에 코드 commit 생성 (DB/API/UI 각 단계)
   - 각 commit 후 workspace repo의 CTB 갱신
   - 커밋 메시지: `Refs: improve_tracking_process_v1 | Stage: API`

3. **배포 후** (웹개발자)
   - dsc-fms-portal main branch에 merge
   - workspace repo CTB 갱신: `[코드 commit]` = 최신 main 커밋

**자동화**

```bash
# 스크립트: update-ctb.sh (호출 시점: 각 commit 후)
cd /home/jeepney/.openclaw/workspace-dev

# 1. workspace 최신 커밋
ws_hash=$(git -C . rev-parse --short HEAD)
ws_msg=$(git -C . log -1 --pretty=%s)

# 2. dsc-fms-portal 최신 main 커밋
portal_hash=$(git -C dsc-fms-portal rev-parse --short origin/main 2>/dev/null)
portal_msg=$(git -C dsc-fms-portal log -1 --pretty=%s origin/main 2>/dev/null)

# 3. CTB 해당 항목 업데이트 (수동 또는 자동)
```

---

### 프로세스 2: 팀원 업무 추적 자동화

#### 현황
- **CTB (active_work_tracking.md)**: 비서가 일일 자동 갱신
- **team_task_tracking.md**: **존재하지 않음** (설계서에만 참조)

#### 문제점
- 팀원별 역할/진행률을 추적할 중앙 파일 부재
- 평가자(evaluator), 데이터분석가(data-analyst) 등 팀원 작업 누락
- CTB는 기능 단위, team_task_tracking은 담당자 단위 → 이원화 필요

#### 개선안

**team_task_tracking.md 신규 생성 (월간)**

위치: `/home/jeepney/.openclaw/workspace-dev/memory/team_task_tracking.md`

구조:

```markdown
# 팀원 업무 추적 — 2026-05 (월간)

## 팀원 현황 요약
| 담당자 | 전문 분야 | 현재 상태 | 진행률 | 예상 완료 |
|--------|---------|---------|--------|----------|
| 웹개발자 | Backend/Frontend | 🟡 진행중 | 45% | 2026-06-03 |
| 평가자 | QA/UX 검증 | 🟡 진행중 | 30% | 2026-05-20 |
| 데이터분석가 | 데이터 품질 | 🟢 대기 | 0% | — |
| 번역가 | KO↔EN | 🟢 유휴 | — | — |
| 플레너 | 설계/PM | 🟡 진행중 | 50% | — |

## 웹개발자
### 현재 업무
- Backup App Phase 2 API 개발
  - **진행률:** 10% → 45% (목표)
  - **시작:** 2026-05-13
  - **완료예정:** 2026-06-03
  - **최근 커밋:** [dsc-fms-portal] 5658561
  - **다음 단계:** Schedule API 구현

### 완료 업무
- Asset Registration Phase 1 파일 첨부 (✅ 2026-05-15)
- Weekly Reports Week 2 API (✅ 2026-05-14)

---

## 평가자
### 현재 업무
- 여행앱 MVP UX 검증
  - **진행률:** 30% (플레너 설계 검토 중)
  - **상태:** 설계 피드백 수렴 단계
  - **블로킹:** 플레너의 Travel Phase 2 scope 확정 대기

### 담당 작업 (정기)
- 주간 배포 검증
- 팀 코드 리뷰

---

## 데이터분석가
### 현재 업무
- 추적 프로세스 감사 (✅ 완료, 2026-05-15)

### 다음 업무 (할당 대기)
- CTB 해시 데이터 검증 (자동화)
- 월간 팀 생산성 리포트

---

## 번역가
### 현재 업무
- 대기 중

### 가능 업무
- 주간 보고서 한영 번역
```

**동기화 메커니즘**

1. **CTB** (중앙 추적판) → 기능 단위 진행률
2. **team_task_tracking** → 팀원 단위 진행률
3. **싱크 방식:**
   - 비서: 일일 자동 update (09:00 KST, 18:00 KST)
   - 팀원: 작업 완료 후 직접 갱신 (Telegram 메시지로 보고)
   - 월말: 월간 team_task_tracking 갱신

**갱신 주기**

| 파일 | 주기 | 담당자 | 트리거 |
|------|------|--------|--------|
| active_work_tracking.md (CTB) | 일일 2회 | 비서 (cron) | 09:00, 18:00 KST |
| team_task_tracking.md | 월간 + 주간 | 플레너 + 팀원 | 월 1일 + 금요일 |
| Git commit tracking | 실시간 | 각 팀원 | commit 직후 |

---

### 프로세스 3: 메모리 파일 정리 계획

#### 발견된 중복 파일

```
status 관련 피드백 파일:
1. feedback_status_reporting_format.md
2. feedback_auto_status.md
3. feedback_user_action_status_format.md

+ feedback_user_action_explicit_rules.md (최신, 2026-05-15)
```

#### 정리 전략

**Step 1: 파일 역할 재정의**

| 파일명 | 역할 | 현황 | 조치 |
|--------|------|------|------|
| `feedback_user_action_explicit_rules.md` | 【사용자 액션】3가지 필수 (📍+📄+⚙️) | ✅ 최신 | **KEEP** |
| `feedback_status_reporting_format.md` | 현황판 색상 규칙 (🟢🟡🔴) | 중복 | **MERGE to user_action** |
| `feedback_auto_status.md` | 작업 완료 시 자동 현황판 출력 | 중복 | **MERGE to workflow** |
| `feedback_user_action_status_format.md` | 사용자 액션 현황표 | 중복 | **MERGE to user_action** |

**Step 2: 통합 계획**

1. **feedback_user_action_explicit_rules.md** (메인 파일)
   - 기존 내용 유지
   - 색상 규칙 추가 (🟢🟡🔴)
   - 현황표 서식 추가

2. **workflow_context_loss_protocol.md**
   - 자동 현황판 출력 규칙 추가

3. **Deprecated 파일**
   - feedback_status_reporting_format.md → 수명 종료
   - feedback_auto_status.md → 수명 종료
   - feedback_user_action_status_format.md → 수명 종료

**Step 3: 실행 일정**

- 2026-05-15: 통합 파일 작성 완료
- 2026-05-15: deprecated 파일 삭제 (git rm)
- 2026-05-15: MEMORY.md 색인 갱신

---

### 프로세스 4: 블로킹 항목 해결 프로세스

#### 블로킹 항목 1: Travel Phase 2 Scope 불일치

**상황**
- 플레너가 설계 완료함
- 평가자가 UX 검증 중
- 하지만 scope 범위가 불명확 (최소/최대 기능 정의 미흡)

**해결 방안**

| 단계 | 담당자 | 작업 | 완료예정 | 산출물 |
|------|--------|------|---------|--------|
| 1 | 플레너 | Travel Phase 2 설계서 재검토 | 2026-05-17 | TRAVEL_SCOPE_DECISION.md |
| 2 | 평가자 | 설계서 UX 검증 + 피드백 | 2026-05-18 | travel-evaluator-feedback.md |
| 3 | 플레너 | 피드백 반영 + 최종 scope 확정 | 2026-05-19 | TRAVEL_PHASE2_SCOPE_FINAL.md |
| 4 | 웹개발자 | 개발 착수 | 2026-05-20 | — |

**예상 산출물**

```
TRAVEL_SCOPE_DECISION.md
├─ Minimum Features (MVP)
│  ├─ 여행지 등록
│  ├─ 일정 계획
│  └─ 비용 추적
├─ Medium Features (Phase 2)
│  ├─ 그룹 공유
│  └─ 날씨 통합
└─ Future Features (Phase 3)
   ├─ AI 추천
   └─ 소셜 연동
```

#### 블로킹 항목 2: Asset Master 구현 대기

**상황**
- Asset Registration Phase 1 완료 (파일 첨부)
- Phase 2 (Excel 다운로드) 또는 Asset Master 우선순위 미정

**해결 방안**

| 단계 | 담당자 | 작업 | 완료예정 | 결정 |
|------|--------|------|---------|------|
| 1 | 사용자(Kyeongtae) | **우선순위 확정** | 2026-05-16 | Asset Master vs Travel App vs Backup Phase 2 중 우선순위 |
| 2 | 플레너 | 확정된 우선순위 기준 설계 | 2026-05-18 | ASSET_MASTER_DESIGN.md (또는 다른 모듈) |

**체크포인트**
- 【사용자 액션 필요】: Telegram에 우선순위 확인 메시지 발송
- 응답 기한: 2026-05-16 18:00 KST

---

### 프로세스 5: 시스템 로깅 강화

#### 현황
- Gateway 재시작/응답 지연 로그 미흡
- 패턴 분석 불가능

#### 개선안

**로그 저장 위치**

```
/home/jeepney/.openclaw/workspace-dev/LOGS/
├─ gateway-restart/
│  ├─ 2026-05-15.log
│  └─ 2026-05-14.log
├─ api-response-time/
│  └─ 2026-05-15.log
└─ system-events/
   └─ 2026-05-15.log
```

**로그 수집 방식**

1. **자동 수집** (Cron)
   - 일일 09:00 KST: Gateway 상태 체크
   - 일일 18:00 KST: API 응답시간 수집
   - 주 1회 (월요일): 월간 리포트 생성

2. **로그 포맷**
   ```json
   {
     "timestamp": "2026-05-15T10:30:00+09:00",
     "event_type": "gateway-restart",
     "duration_sec": 45,
     "status": "success",
     "notes": "scheduled maintenance"
   }
   ```

3. **분석 리포트** (월간)
   ```
   MONTHLY_SYSTEM_LOG_2026_05.md
   ├─ Gateway Restart Summary
   │  ├─ Total: 2회
   │  ├─ Avg Duration: 42초
   │  └─ Pattern: 화, 목 정기점검
   ├─ API Response Time
   │  ├─ P50: 245ms
   │  ├─ P95: 890ms
   │  └─ Slow API: backup/schedule (avg 1200ms)
   └─ Recommendations
      ├─ backup/schedule API 최적화 필요
      └─ Gateway 정기점검 시간 변경 제안
   ```

---

## 3단계: 산출물 및 일정

### 산출물 1: 개선안 설계서 (본 문서)
- **위치:** `/home/jeepney/.openclaw/workspace-dev/TRACKING_PROCESS_IMPROVEMENT_DESIGN.md`
- **상태:** ✅ 완료
- **전달 대상:** 평가자 (review)

### 산출물 2: CTB 재구성안

**작업 내용**
1. active_work_tracking.md 재포맷팅
   - 필드 추가: `[설계 commit]`, `[코드 commit]`
   - 표기 방식 통일: `[repo] hash — msg`

2. 예시 데이터 입력
   ```
   Backup App Phase 2 API 개발:
   - [설계 commit] [workspace] 4afc5d3 — BACKUP_APP_PHASE2_DESIGN.md 작성
   - [코드 commit] [dsc-fms-portal] 5658561 — feat: backup schedule API
   ```

**예상 산출물:** `CTB_RESTRUCTURE_PROPOSAL.md`

### 산출물 3: 팀원 할당 재계획

**현황**
- 플레너: Travel Phase 2 scope 재검토 (2026-05-17 완료)
- 평가자: Travel Phase 2 UX 검증 (2026-05-18 완료)
- 데이터분석가: CTB 해시 검증 자동화 + 월간 리포트 작성
- 번역가: 주간 보고서 번역 (정기)
- 웹개발자: Backup API 개발 진행 (현행 유지)

**예상 산출물:** `TEAM_ALLOCATION_PLAN_2026_05.md`

---

## 일정표

| 날짜 | 담당자 | 작업 | 상태 | 산출물 |
|------|--------|------|------|--------|
| **2026-05-15** | 플레너 | 개선 설계 수립 (본 문서) | ✅ | TRACKING_PROCESS_IMPROVEMENT_DESIGN.md |
| **2026-05-16** | 사용자 | 우선순위 확정 (사용자 액션) | ⏳ | — |
| **2026-05-16** | 플레너 | CTB 재구성안 작성 | 예정 | CTB_RESTRUCTURE_PROPOSAL.md |
| **2026-05-17** | 플레너 | Travel Phase 2 scope 재검토 | 예정 | TRAVEL_SCOPE_DECISION.md |
| **2026-05-17** | 평가자 | 메모리 파일 통합 작업 | 예정 | — |
| **2026-05-18** | 평가자 | Travel Phase 2 UX 검증 | 예정 | travel-evaluator-feedback.md |
| **2026-05-19** | 플레너 | Travel scope 최종 확정 | 예정 | TRAVEL_PHASE2_SCOPE_FINAL.md |
| **2026-05-20** | 플레너 | 팀원 할당 재계획 | 예정 | TEAM_ALLOCATION_PLAN_2026_05.md |
| **2026-05-20** | 웹개발자 | Travel App 개발 착수 | 예정 | — |

---

## 체크리스트

### 플레너 (본인)
- [ ] TRACKING_PROCESS_IMPROVEMENT_DESIGN.md 완성
- [ ] CTB 재구성안 작성
- [ ] Travel Phase 2 scope 재검토
- [ ] 팀원 할당 재계획

### 평가자
- [ ] 메모리 파일 통합 (status 관련 3개)
- [ ] Travel Phase 2 UX 검증

### 데이터분석가
- [ ] CTB 해시 검증 자동화 스크립트 작성
- [ ] 월간 시스템 로그 분석 리포트

### 사용자
- [ ] 우선순위 확정 (Asset Master vs Travel vs Backup Phase 2)

---

## 메타

**작성자:** 플레너  
**작성일:** 2026-05-15  
**상태:** 설계 완료  
**다음 단계:** 평가자 review → 실행  
