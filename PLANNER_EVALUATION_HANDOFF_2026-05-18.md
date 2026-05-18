---
name: 플레너 수행 가이드 (평가자 → 플레너)
date: 2026-05-18 09:00 KST
status: READY_FOR_EXECUTION
---

# 📋 플레너 수행 가이드: TOP 3 Ghost 선정 + 웹개발 스케줄

**from:** 평가자 (QA Evaluator)  
**to:** 플레너 (Planner Agent)  
**deadline:** 2026-05-18 19:00 KST (1시간 내 완료)  
**input:** evaluation_review_20260517.md (방금 완성)  
**output:** PLANNER_WEB_DEV_SCHEDULE_2026-05-18.md (웹개발자 전달용)

---

## ✅ 평가자 완료 항목

### 1. 신규팀원 3명 스킬 검증 ✅
| 팀원 | 점수 | 상태 | 액션 |
|------|------|------|------|
| 웹개발자 지원가 | 6.5/10 | 🟡 Day 2 재시작 중 | **Task 1 (failure_code) 48시간 내 통과 검증** |
| QA 평가자 | 7/10 | ⏳ 온보딩 대기 | Backup Phase 2 UI 3회 검증 진행 중 |
| 자동화 전문가 | 6.5/10 | ⏳ 온보딩 대기 | 경영실적 자동화 2주 내 시작 |

**해석:** 기본 준비 완료, **실전 Task로 즉시 역량 검증 필수**

---

### 2. 웹개발 병렬화 가능성 ✅
**결론:** **B 시나리오 (2중 병렬) 권고**
- ✅ Asset Master API (웹개발자 지원가, 100%)
- ✅ Backup Phase 2 UI 검증 (QA 평가자, 100%) — 완전 독립
- ✅ 웹개발자 시니어: oversight 40% + 여유 40% (Audit 설계 리뷰 가능)

**최대 동시 작업:** 2-3개 Task (정의 명확한 것만)

---

### 3. TOP 3 Ghost 선정 ✅
**순위** (의존성+노력+임팩트 기준)

| 순위 | 프로젝트 | 점수 | 담당 | 기간 | 시작 | 완료 |
|------|---------|------|------|------|------|------|
| 1️⃣ | **Audit System Framework** | 9/10 | 웹개발 시니어 + 자동화 | 3-5일 | 2026-05-20 | 2026-05-23 |
| 2️⃣ | **Travel Phase 2 UI** | 8/10 | 웹개발 시니어/지원가 | 13일 | 2026-05-21 | 2026-06-02 |
| 3️⃣ | **Discord Bot 통합** | 7.5/10 | 웹개발 지원가 + 자동화 | 5-7일 | 2026-05-28 | 2026-06-04 |

---

## 🎯 플레너 실행 체크리스트 (지금부터 60분)

### Step 1: TOP 3 확정 (5분)
- [ ] evaluation_review_20260517.md 섹션 3 검토
- [ ] TOP 3 선정 근거 확인 (Critical Path + Effort + Team Fit)
- [ ] 변경 사항 있으면 평가자 재협의 (→ 지금 바로)

### Step 2: 담당자 배정 (10분)
- [ ] **Audit System Framework (1순위)**
  - 주담당: 웹개발자 시니어 (50%)
  - 협력: 자동화 전문가 (100%) — **아직 온보딩 미완료, 수동 지시 필요**
  - 설계: AUDIT_SYSTEM_FINAL_MEETING_BRIEF.md 참고
  - 완료: 2026-05-23

- [ ] **Travel Phase 2 UI (2순위)**
  - 주담당: 웹개발자 시니어 또는 지원가
  - 설계: TRAVEL_MANAGEMENT_PHASE2_UI_PLAN.md (13개 컴포넌트 명세)
  - 시작: 2026-05-21 (Backup Phase 2 검증 완료 후)
  - 완료: 2026-06-02

- [ ] **Discord Bot (3순위)**
  - 주담당: 웹개발자 지원가 (Asset Master 병행)
  - 설계: PROJECT_DISCORD_BOT_SYSTEM.md
  - 시작: 2026-05-28 (Backup 완료 후)
  - 완료: 2026-06-04

### Step 3: 스케줄 수립 (20분)

```
2026-05-20 (월) — TOP 3 KICKOFF DAY
├─ 09:00: 플레너 + 웹개발자 시니어 + 자동화 전문가 회의
│  ├─ Audit System 설계 최종 확인 (AUDIT_SYSTEM_FINAL_MEETING_BRIEF.md)
│  ├─ Travel UI 설계 리뷰 (빠른 시작 준비)
│  └─ 일일 15:00 리포트 규칙 재확인
│
├─ 10:00: Audit System 개발 시작 (웹개발자 시니어 50% + 자동화 100%)
│  ├─ 목표: 일일 신뢰도 95% 대시보드
│  └─ 완료: 2026-05-23 (3-4일 일정)
│
└─ 11:00: 웹개발자 지원가 + QA 평가자 회의
   ├─ Asset Master API Task 2-3 시작 (Task 1 완료 기준)
   ├─ UI 검증 프로세스 재확인
   └─ 매일 15:00 리포트 시작

2026-05-21 (화) — Travel UI Kickoff
├─ 09:00: Travel UI 상세 설계 회의
├─ 10:00: 웹개발자 시니어 (또는 지원가) Travel UI 개발 시작
└─ 목표: 13개 컴포넌트 병렬 구현, 2026-06-02 완료

2026-05-23 (목) — Audit System 완료
├─ Audit System MVP 배포
├─ 일일 신뢰도 수집 자동화 시작
└─ Travel UI 50%+ 진행 상황 점검

2026-05-28 (화) — Discord Bot Kickoff
├─ 웹개발자 지원가 Discord Bot 개발 시작
├─ 자동화 전문가 협력 (Webhook 설정)
└─ 완료: 2026-06-04
```

### Step 4: 문서 작성 (15분)
- [ ] PLANNER_WEB_DEV_SCHEDULE_2026-05-18.md 작성 (다음 템플릿 참고)

```markdown
# 웹개발자 일정표 (2026-05-20 ~ 06-04)

## 📅 일정 개요
- 총 2주 (14일)
- TOP 3 프로젝트 병렬 진행
- 웹개발자 시니어 + 지원가 + QA 평가자 협업

## 🎯 Project 1: Audit System Framework (1순위)
- 기간: 2026-05-20 ~ 05-23 (3-4일)
- 담당: 웹개발자 시니어 (50%) + 자동화 전문가 (100%)
- 산출물: 일일 신뢰도 95% 대시보드 + 자동 알림
- 의존성: 없음 (설계 완료)

## 🎯 Project 2: Travel Phase 2 UI (2순위)
- 기간: 2026-05-21 ~ 06-02 (13일)
- 담당: 웹개발자 시니어 또는 지원가 (100%)
- 산출물: 9개 컴포넌트 + API 통합
- 의존성: Backup Phase 2 UI 완료 (2026-05-21)

## 🎯 Project 3: Discord Bot (3순위)
- 기간: 2026-05-28 ~ 06-04 (7일)
- 담당: 웹개발자 지원가 (50%) + 자동화 (50%)
- 산출물: Telegram ↔ Discord 양방향 동기화
- 의존성: Backup Phase 2 완료 (2026-05-21)

## 📊 리소스 배정
- 웹개발자 시니어: 50% (Audit) + 30% (Travel oversight) = 80% 활용
- 웹개발자 지원가: 100% (Asset Master API) + 50% (Discord Bot 2026-05-28~) = 병렬
- QA 평가자: 100% (Backup 완료) → 100% (Asset Master + Travel 검증)
- 자동화 전문가: 100% (Audit System + Discord Bot)

## 매일 15:00 리포트
- 웹개발자 지원가: Asset Master API 진도 + 블로킹 사항
- 웹개발자 시니어: Audit System / Travel UI 진도
- QA 평가자: 검증 항목 + 버그 발견
```

### Step 5: 웹개발자 전달 (10분)
- [ ] PLANNER_WEB_DEV_SCHEDULE_2026-05-18.md 생성
- [ ] GitHub 커밋
- [ ] Telegram 알림 (웹개발자 + 자동화 전문가)
  ```
  【TOP 3 웹개발 일정 확정】
  1️⃣ Audit System (05-20 ~ 05-23, 웹개발시니어 50% + 자동화 100%)
  2️⃣ Travel Phase 2 UI (05-21 ~ 06-02, 웹개발자)
  3️⃣ Discord Bot (05-28 ~ 06-04, 웹개발지원가 + 자동화)
  
  매일 15:00 리포트 시작
  일정표: PLANNER_WEB_DEV_SCHEDULE_2026-05-18.md
  ```

---

## ⚠️ 중요 유의사항

### A. Day 1 온보딩 MISSED 영향
- 웹개발자 지원가가 Day 2 (2026-05-18) 압축 재시작 중
- **Task 1 (failure_code dropdown) 48시간 내 완료 검증 필수**
- 통과 시에만 Asset Master API Task 2-3 병렬 시작 → TOP 3와 동시 진행

### B. QA 평가자 병목
- 현재: Backup Phase 2 UI 검증 (40% → 100%)
- 2026-05-21 이후: Asset Master + Travel UI + Discord 동시 검증
- **추천: QA 평가자를 TOP 3 Project 1-2에만 먼저 할당**
- Project 3 (Discord)는 자동화 전문가 먼저 테스트 → 평가자 나중에

### C. 자동화 전문가 온보딩
- 온보딩 미완료 (2026-05-20 시작 예정)
- **Audit System이 첫 Task → 학습곡선 가파를 수 있음**
- 웹개발자 시니어의 명확한 지시 필수

### D. 웹개발자 시니어 과부하
- 현재: Audit (50%) + Oversight (20%) = 70% 사용
- Travel UI 할당 시: 100% 초과
- **권고: Audit 완료 (2026-05-23) 후 Travel UI 시작**
- 또는: Travel UI를 웹개발자 지원가에게 할당 (Asset Master 이후)

---

## 📝 플레너 최종 산출물 체크리스트

- [ ] `PLANNER_WEB_DEV_SCHEDULE_2026-05-18.md` 작성 완료
- [ ] GitHub 커밋 (GCS 포맷: Refs + Stage)
- [ ] Telegram 알림 전송 (웹개발자 + 자동화 팀)
- [ ] ACTIVE_WORK_TRACKING.md 갱신
  - Planner task "TOP 3 선정" → COMPLETED
  - Web-Dev-Support task "일정 수립" → COMPLETED
  - Asset Master Phase 2 → IN_PROGRESS (2026-05-20 START)
  - Audit System → IN_PROGRESS (2026-05-20 START)
  - Travel Phase 2 → PENDING (2026-05-21 START)
  - Discord Bot → PENDING (2026-05-28 START)

---

**다음 checkpoint:** 2026-05-18 19:00 KST  
**담당:** 플레너  
**상태:** 🟡 AWAITING_PLANNER_EXECUTION

---

*이 문서는 evaluation_review_20260517.md에서 생성되었습니다.*
*플레너는 이 가이드를 따라 PLANNER_WEB_DEV_SCHEDULE_2026-05-18.md를 즉시 작성하세요.*
