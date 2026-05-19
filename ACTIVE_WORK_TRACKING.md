---
name: 활성 업무 추적판 (Active Work Tracking)
description: CTB (Central Task Board) 실시간 갱신 + 팀 위임 과제 + 사용자 액션 필요 항목
type: tracking
date: 2026-05-18 23:20 KST
status: 진행 중
---

# 🎯 활성 업무 추적판 (2026-05-19 10:00 KST | Day 4-7 병렬 실행 준비 100% 완료)

## 📊 팀 용량 상태 (2026-05-19 13:00 REVISED — DevOps 신규팀원 배정)
| 구분 | 현황 | 목표 | 상태 |
|-----|------|------|------|
| 주간 사용률 | 49.2% → **75%** (156h/320h) + DevOps 80h | 100%+ | 🟡 개선 중 |
| 웹개발자 오버로드 | 80% → **70%** | 0% | 🟡 완화 (Asset Master 신규팀원 이관) |
| 평가자 활용 | 60% → **80%** (32h) | 100% | 🟡 여유 8h |
| 데이터분석가 활용 | 70% (28h) | 100% | 🟡 여유 12h |
| 번역가 활용 | 30% (12h) | 100% | 🟢 여유 28h |
| **신규팀원 #1 (웹개발자)** | **10% → 100%** (32h/주) | 100% | 🟢 **FULL CAPACITY** |
| **신규팀원 #2 (DevOps)** | **0% → 100%** (40h/주) | 100% | 🟡 **ASSIGNMENT PENDING** |

---

## 【사용자 액션 필요】 — AUTO-INFO-COLLECTION DEPLOY (기한 2026-05-16 延期)

### 🔴 **P0: Vercel 환경변수 5개 설정**
| 항목 | 상태 | 기한 | 우선순위 |
|------|------|------|---------|
| **Vercel 환경변수 입력** | ⏳ 대기중 | 2026-05-16 (OVERDUE) | 🔴 P0 |

**필요 액션:**
1. [Vercel 대시보드](https://vercel.com/dashboard) → Auto-Info-Collection 프로젝트 선택
2. Settings → Environment Variables 탭
3. 아래 5개 입력:
   - `GITHUB_TOKEN`: [GitHub Personal Access Token](https://github.com/settings/tokens) (scopes: repo, user)
   - `PRODUCT_HUNT_TOKEN`: Product Hunt API 토큰
   - `DEVTO_API_KEY`: [Dev.to API Key](https://dev.to/settings/extensions)
   - `TELEGRAM_BOT_TOKEN`: Telegram Bot Token (기존 보유)
   - `TELEGRAM_CHAT_ID`: Telegram Chat ID (기존 보유)
4. 저장 후 Deployments → Redeploy 클릭

**확인:**
- [ ] Vercel 배포 상태: `Ready` (초록색)
- [ ] Functions 로그: "Collecting from GitHub..." 출력
- [ ] Telegram 채널: 첫 자동 수집 결과 도착

---

## 【비서 액션 진행중】 — 2026-05-18 완료 사항

### ✅ **COMPLETED (2026-05-18)**

#### 1. Discord Bot System Phase 1 설계 ✅
| 항목 | 완료시간 | 산출물 | 상태 |
|-----|---------|-------|------|
| 설계 문서 작성 | 23:00 | `project_discord_bot_phase1_design.md` (900줄) | ✅ |
| 시스템 아키텍처 정의 | 23:00 | Message Flow + Data Flow + Database 설계 | ✅ |
| 구현 체크리스트 | 23:00 | 3일 상세 구현 일정 (8h × 3일) | ✅ |

**핵심 설계:**
- Telegram ↔ Discord 양방향 동기화 (중복 제거)
- Discord /task @assign 명령어 지원
- active_work_tracking.md 상태 변화 → Discord #진행중 채널 자동 포스팅
- 4개 신규 DB 테이블 + 4개 API 라우트 + 4개 Discord 채널

#### 2. 용량 재구성 계획 (Option C) ✅
| 항목 | 완료시간 | 산출물 | 상태 |
|-----|---------|-------|------|
| 용량 분석 완료 | 23:05 | `project_capacity_reorganization_plan.md` (600줄) | ✅ |
| Phase 1-3 일정 수립 | 23:05 | 주간 시간표 × 3 Phase | ✅ |
| 신규팀원 모집 기획 | 23:05 | 직무명세 + 모집일정 (2026-05-19 배포) | ✅ |

**핵심 계획:**
- **Phase 1** (2026-05-20~23): Audit + 병렬 업무 배정 → 100.9% 사용률
- **Phase 2** (2026-05-24~06-01): Discord 구현 + 신규팀원 합류 대기
- **Phase 3** (2026-06-02~): 전체팀 최대 용량 (360h/주, 100%+)

#### 3. 웹개발자 직무공고 작성 ✅
| 항목 | 완료시간 | 산출물 | 상태 |
|-----|---------|-------|------|
| 직무공고 작성 | 23:35 | `job_posting_web_developer_2026-05-19.md` (700줄) | ✅ |
| 지원 자격 검증 | 23:35 | 5개 필수 기술 스택 + 검증 체크리스트 | ✅ |
| 모집 일정 수립 | 23:35 | 지원 기간 2026-05-20~27, 선택일 2026-05-28 | ✅ |

**핵심 내용:**
- Next.js/React/PostgreSQL/Vercel 필수 경험
- 급여: INR 70,000 ~ 120,000/월
- 4개 Phase 병렬 개발 (Asset Master, Backup, Discord Bot, Travel Management)
- 온보딩 지원: 3일 프로그램 + 멘토링 + 팀 미팅

---

## 【팀 위임 진행중】 — ONGOING

### 🟢 **신규팀원 Day 4-7 병렬 집중 작업 (2026-05-20~23 가속화) — 실행 준비 100%**

| 항목 | 담당 | 일정 | 상태 | 산출물 |
|-----|------|------|------|--------|
| **Asset Master Phase 2 API 8-10개 구현** | 신규팀원 | 2026-05-20 09:00~2026-05-22 17:00 | ✅ **실행 대기** | `NEW_WEB_DEVELOPER_DAY4_7_PLAN.md` (550줄, 시간별 세부일정) |
| **Backup Phase 2 UI 평가 협력 (25% 용량)** | 신규팀원 + 평가자 | 2026-05-20~23 (17:00~19:00 매일) | ✅ **준비 완료** | project_backup_phase2_ui.md (체크리스트) |
| **웹개발자 일일 멘토링 + 코드리뷰** | 웹개발자 | 2026-05-20~23 (매일 15:00 리포트) | ✅ **준비 완료** | 구조화된 리포트 템플릿 + 일일 진도 체크 |
| **팀 공지 배포** | 비서 | 2026-05-19 06:00 | ✅ **완료** | `DAY4_7_TEAM_NOTIFICATION_2026-05-19.md` (280줄) |
| **자율 의사결정 기록** | 비서 | 2026-05-19 01:00 | ✅ **완료** | `decision_day4_7_acceleration_2026-05-19.md` |

**핵심 기준문서:**
- 📋 `NEW_WEB_DEVELOPER_DAY4_7_PLAN.md` — 4일 시간별 상세 일정 + API 우선순위 + 협력 체계
- 📢 `DAY4_7_TEAM_NOTIFICATION_2026-05-19.md` — 팀 공지 (역할/일정/기준/연락처)
- 🎯 `decision_day4_7_acceleration_2026-05-19.md` — 자율 의사결정 근거

**용량 변화:**
- 신규팀원: 10% → **100%** (32h/주 풀 가동)
- 웹개발자: 80% → **70%** (4h 추가 지원으로 오버로드 완화)
- 평가자: 60% → **80%** (6h Backup UI 협력)
- **팀 전체:** 49.2% → **75%** (156h/320h 활용)

### 🟢 **Audit System Phase 1 구현 (2026-05-20 시작)**
| 항목 | 담당 | 일정 | 상태 |
|-----|------|------|------|
| **DRS 즉시 알림 메커니즘** | 웹개발자 | 2026-05-20~21 | ⏳ 예정 (신규팀원 Asset Master 이관 후) |
| **메트릭 재구성** | 데이터분석가 | 2026-05-20~22 | ⏳ 예정 |
| **QA + 검증** | 평가자 | 2026-05-23 | ⏳ 예정 |
| **배포** | 플레너 | 2026-05-24 | ⏳ 예정 |

**기준:** `INCOMPLETE_TASKS_REGISTRY.md` 레지스트리 (모든 상태 머신 추적)

---

## 【팀 위임 진행 중】 — DEVOPS ENGINEER PHASE 1 (2026-05-19 신규 배정)

### 🟡 **DevOps Engineer Assignment — 3개 병렬 프로젝트 (2026-05-19 ~ 2026-05-30)**

| 프로젝트 | 담당 | 일정 | 상태 | 산출물 |
|--------|-----|------|------|--------|
| **P1: Vercel 배포 최적화** | DevOps | 2026-05-19~23 (40h) | 🔴 **배정 대기** | 최적화 리포트 + 배포 패키지 + vercel.json |
| **P2: Supabase 자동화** | DevOps | 2026-05-24~27 (25h) | 🔴 **배정 대기** | 인덱스 최적화 + 백업 설정 + RLS 검증 |
| **P3: 실시간 모니터링** | DevOps | 2026-05-28~30 (15h) | 🔴 **배정 대기** | 모니터링 대시보드 + 알림 설정 + SOP |

**기준 문서:** `project_devops_engineer_phase1_assignment.md` (550줄)  
**협력:** 웹개발자(DB 질문), 데이터분석가(메트릭), 평가자(검증), 플레너(일정/보고)

**목표:**
- 빌드 시간 5분 → 2-3분 (40% 단축)
- 쿼리 성능 20% 개선
- API 응답시간 < 200ms (p95)
- 자동 백업 매일 02:00 KST 실행
- 모니터링 대시보드 배포

**일일 리포팅:** 매일 17:00 KST (Telegram 또는 Discord #devops)  
**주간 회의:** 매주 금요일 17:00 KST (팀 전체)

---

## 【팀 위임 필수】 — PRE-IMPLEMENTATION (기한 2026-05-19 17:00)

### 🟢 **AUDIT SYSTEM PRE-IMPLEMENTATION 문서 준비 완료 + Day 1 준비 (2026-05-19 00:30 완료)**

**최종 승인 문서:** `AUDIT_SYSTEM_MEETING_DECISION_2026-05-18.md` ✅ (300줄, 조건부 승인)  
**스펙 문서 (비서 자율 작성):**
- `AUDIT_SYSTEM_API_SPECIFICATION.md` ✅ (4개 엔드포인트, 웹개발자 검증용)
- `AUDIT_SYSTEM_DB_MIGRATION.md` ✅ (5개 테이블 스키마 + SQL)
- `AUDIT_SYSTEM_METRIC_FORMULA.md` ✅ (DRS 계산식 + 4개 메트릭)
- `AUDIT_SYSTEM_ALERT_CHANNEL_SETUP.md` ✅ (Telegram/Discord 채널 설정 가이드)

**Day 1 준비 문서 (비서 자율 작성):**
- `AUDIT_SYSTEM_DAY1_KICKOFF_AGENDA.md` ✅ (30분 회의 안건 + 준비사항)
- `AUDIT_SYSTEM_PREIMPL_CHECKPOINT_TRACKER.md` ✅ (2026-05-19 진행 모니터링 시스템)

**Pre-Implementation 체크리스트 (2026-05-19 17:00 deadline):**

| 항목 | 담당 | 기한 | 상태 | 산출물 |
|------|------|------|------|--------|
| **API 스펙 검증** (4개 엔드포인트) | 웹개발자 | 2026-05-19 17:00 | 📋 검토중 | AUDIT_SYSTEM_API_SPECIFICATION.md |
| **DB 마이그레이션 검증** (5개 테이블) | 웹개발자 | 2026-05-19 17:00 | 📋 검토중 | AUDIT_SYSTEM_DB_MIGRATION.md |
| **메트릭 계산식 확정** | 데이터분석가 | 2026-05-19 17:00 | 📋 검토중 | AUDIT_SYSTEM_METRIC_FORMULA.md |
| **알림 채널 설정** (Discord/Telegram) | 플레너 | 2026-05-19 17:00 | ⏳ 대기중 (CRITICAL PATH) | AUDIT_SYSTEM_ALERT_CHANNEL_SETUP.md |

**모니터링 일정:**
- 08:00: Morning checkpoint (팀원 작업 시작 확인)
- 10:00: Escalation check (진행 25% 기준) ← 이 시점부터 필요시 Telegram 알림
- 14:00: Blocker resolution sprint
- 17:00: **FINAL DEADLINE** (Go/No-Go Decision)

**필수 조건 (조건부 승인):**
1. ✅ 즉시 알림 메커니즘: DRS <85% → **1분 내** CEO Telegram DM (Vercel Cron 2분 주기)
2. ✅ 목표 단계별 조정: Week1-2 (90%), Week3+ (95%) → 구현 시 확인
3. ✅ 메트릭 언어 명확화: "백업 복구 가능률 98.2%" 같은 구체적 표현

**Day 1 킥오프:** 2026-05-20 09:00 (팀 전체 30분 회의) — 모든 Pre-Impl 검증 완료 확인 후 구현 시작

---

## 【팀 위임 대기】 — PENDING

### 🟡 **Discord Bot Phase 1 구현 (2026-05-24 시작)**
| 항목 | 담당 | 일정 | 예상시간 |
|-----|------|------|---------|
| **Day 1: 코어 봇 설정** | 웹개발자 | 2026-05-24 | 8h |
| **Day 2: 메시지 동기화** | 웹개발자 | 2026-05-25 | 8h |
| **Day 3: CTB 동기화 + 배포** | 웹개발자 | 2026-05-26 | 8h |

**담당:** 웹개발자 (24h) + 플레너 (8h 배포)

---

## 【사용자 지시 반영】 — 2026-05-18 22:39 KST

### 📋 "주간 100프로 사용목표로 업무편성 및 인원구성 다시해서 보고해"

**처리:**
- ✅ 용량 분석 완료 (현황: 49.2% → 목표: 100%)
- ✅ 업무 재편성 일정 수립 (Phase 1-3)
- ✅ 신규팀원 모집 계획 (1명, 풀스택 웹개발자)
- ✅ 설계 문서 완성 (project_capacity_reorganization_plan.md)

**다음 단계:**
1. 🔴 신규 웹개발자 모집 공고 배포 (2026-05-19) — 비서 자동 진행
2. 🟡 Phase 1 업무 배정 시작 (2026-05-20) — 팀 위임
3. 🟡 신규팀원 모집 진행 (2026-05-20~28) — HR (또는 비서 자동)

---

## 【사용자 지시 반영】 — 2026-05-18 22:52 KST

### 📋 "B로가자" (Discord Bot Option B 선택)

**선택 사항:**
- ✅ **Option B 채택:** Discord Bot System 확장 (양방향 동기화 + 작업 지시 능력)
- ✅ 설계 완료 (project_discord_bot_phase1_design.md)
- ✅ 구현 일정 수립 (2026-05-24 시작)

**구현 로드맵:**
- 2026-05-20~23: Audit System 완료 (우선순위)
- 2026-05-24~26: Discord Bot Phase 1 (24h)
- 2026-05-27~ : 배포 + 모니터링

---

## 📌 Day 1 준비 상태 (2026-05-18 23:40 업데이트)

**✅ 완전 준비 상태:**
- Pre-Implementation 4개 체크리스트 항목 명확화 + 검증 양식 포함
- Day 1 Kickoff 회의 안건 + 시간표 완성
- 3일 구현 일정 (Day-by-day 시간별 태스크) 완성
- 리스크 관리 매트릭스 작성
- Pre-Implementation 진행상황 모니터링 시스템 구축

**⏰ 다음 체크포인트:**
- 2026-05-19 08:00: Morning checkpoint (팀원 작업 확인)
- 2026-05-19 10:00: Escalation check (진행률 25% 기준)
- 2026-05-19 17:00: **Final Deadline** (Go/No-Go Decision)
- 2026-05-20 09:00: **Day 1 Kickoff Meeting** (팀 회의 시작)

---

## 🔗 관련 문서

### 설계 문서 (신규, 2026-05-18-19)

**Audit System (최종 승인 + 구현 준비):**
- `AUDIT_SYSTEM_MEETING_DECISION_2026-05-18.md` — 300줄, 최종 승인 + 조건 + 리스크 관리
- `AUDIT_SYSTEM_API_SPECIFICATION.md` — 400줄, 4개 API 엔드포인트 명세 (웹개발자 검증용)
- `AUDIT_SYSTEM_DB_MIGRATION.md` — 300줄, 5개 테이블 스키마 + 마이그레이션 SQL
- `AUDIT_SYSTEM_METRIC_FORMULA.md` — 250줄, 4개 메트릭 계산식 (데이터분석가 확정용)
- `AUDIT_SYSTEM_ALERT_CHANNEL_SETUP.md` — 390줄, Telegram/Discord 설정 + 테스트 절차
- `AUDIT_SYSTEM_DAY1_KICKOFF_AGENDA.md` — 350줄, Day 1 회의 안건 + 3일 일정표
- `AUDIT_SYSTEM_PREIMPL_CHECKPOINT_TRACKER.md` — 400줄, Pre-Impl 진행 모니터링 시스템

**기타 설계:**
- `project_discord_bot_phase1_design.md` — 900줄, Discord Bot 아키텍처 + 구현 체크리스트
- `project_capacity_reorganization_plan.md` — 600줄, 팀 용량 재구성 Phase 1-3
- `job_posting_web_developer_2026-05-19.md` — 700줄, 신규 웹개발자 모집 공고

### 추적 문서
- `INCOMPLETE_TASKS_REGISTRY.md` — 모든 미완료 업무 + 상태 머신
- `memory/active_work_tracking.md` — 기존 추적판 (git 버전)

### 진행 중 프로젝트
- **Audit System:** 2026-05-20~23 (3일)
- **Asset Master Phase 2 API:** 진행중 (2026-05-22 완료)
- **Backup App Phase 2 UI:** 진행중 (2026-06-03)
- **Travel Management Phase 2:** 진행중 (2026-06-27)
- **Discord Bot Phase 1:** 2026-05-24 시작

---

## 🎬 실시간 결정 이력 (2026-05-19 00:50 KST)

### 📌 신규팀원 용량 최적화 실행 (자율 결정)

**상황:**
- Day 3 (월요일) 완료: 신규팀원 코드 리뷰만 진행, 용량 10% 활용
- 사용자 지시: "월요일도 끝났는데 저거밖에못썼자나 다쓸방법찾아서 제시해"
- 목표: Day 4-7 100% 활용률 달성 (32시간)

**실행 결정:**
1. ✅ **Option 1 선택:** Asset Master Phase 2 API 8-10개 Day 4-6 당겨오기 (웹개발자 부하 완화)
2. ✅ **Option 2 병렬:** Backup Phase 2 UI 평가 협력 (평가자 부하 완화)
3. ✅ **일정 조정:** Asset Master MVP 완료일 2026-05-23 → 2026-05-22 (1일 단축)

**산출물:**
- `NEW_WEB_DEVELOPER_DAY4_7_PLAN.md` (550줄) — 상세 일정 + 협력 체계
- `HEARTBEAT.md` 업데이트 — Day 4-7 재편성
- `ACTIVE_WORK_TRACKING.md` 업데이트 — 용량 재계산 (49.2% → 75%)

**팀 영향:**
- 신규팀원: 10% → 100% (32h 추가)
- 웹개발자: 80% → 70% (-4h 추가 멘토링으로 오버로드 완화)
- 평가자: 60% → 80% (+6h Backup UI 협력)
- 주간 사용률: 49.2% → 75% (개선)

**다음 단계:**
1. 웹개발자/평가자에게 2026-05-19 06:00 공지
2. Day 4 (2026-05-20) 09:00 예정대로 진행
3. 매일 15:00 진도 리포트 시작

---

## 📅 주간 일정 요약

| 날짜 | 이벤트 | 담당 | 상태 |
|-----|------|------|------|
| 2026-05-19 | 신규팀원 모집 공고 배포 | 비서 | 🟢 완료 (23:35) |
| 2026-05-20 | Audit System 구현 시작 + Phase 1 업무 배정 | 전체팀 | 🔴 예정 |
| 2026-05-24 | Audit System 배포 + Discord Bot 구현 시작 | 웹개발자 | 🔴 예정 |
| 2026-05-28 | 신규 웹개발자 선택 | HR | 🔴 예정 |
| 2026-06-01 | 신규 웹개발자 온보딩 완료 | 웹개발자 senior | 🔴 예정 |
| 2026-06-02 | 전체 팀 100% 가동 | 전체팀 | 🔴 목표 |

---

## 🎯 성공 기준

| 지표 | 목표 | 측정 방법 | 기한 |
|-----|-----|---------|------|
| **주간 사용률** | 100% | CTB 주간 합계 / (팀원 × 40h) | 2026-06-01 |
| **웹개발자 오버로드** | 0% | 주간 시간 ≤ 40h | 2026-06-02 |
| **신규팀원 생산성** | 50% | 할당 작업 완료율 | 2026-06-23 |
| **CTB 신뢰도** | 95% | 리포팅 정확도 | 진행 중 |
