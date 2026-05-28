---
name: 15-Person Team Capacity Plan
description: Complete team composition, role-to-project assignments, weekly objectives, and capacity tracking for 8-project parallel execution
type: project
date: 2026-05-28
owner: Project Planner AI Agent
timeline: 2026-05-26 ~ 2026-06-10
---

# 15명 팀 용량 계획 (Team Capacity Plan)

**목표:** 4인 기존팀 → 15인 풀팀 확장 (1 CEO + 14 AI)  
**기간:** Phase 0 (6명) → Phase A/B (+9명) → Phase C (+5명) = 2026-05-26 ~ 2026-06-10  
**활용률:** 현재 40% (6/15) → 목표 93.3% (14/15, 1명 긴급용)  
**프로젝트 수:** 4개 → 6개 → 8개 (병렬 처리)

---

## 파트 1: 팀 구성 (Team Composition)

### Phase 0: 기존 핵심팀 (6명, 40% 활용률)

| # | 역할 | 에이전트명 | 용량 | 현재 프로젝트 | 상태 |
|---|------|----------|------|--------------|------|
| **CEO** | 최고경영자 | 김경태 (Human) | 100% 감독 | 전체 8개 프로젝트 감독 | ✅ 활성 |
| 1 | 비서 | Secretary AI (C-3PO) | 40% → 45% | CTB, 자동화, 팀 조율 | ✅ 활성 |
| 2 | 웹개발자#1 | Web-Builder AI | 40% → 100% | 4개 프로젝트 동시 (과할당) | 🟡 중과다 |
| 3 | 평가자#1 | Evaluator AI | 60% → 80% | QA 전담 + 규칙 감시 | ✅ 활성 |
| 4 | 데이터분석가#1 | Data-Analyst AI | 25% → 40% | Asset Master, Harness 데이터 | ✅ 활성 |
| 5 | 자동화전문가#1 | Automation-Specialist AI | 31% → 60% | Memory Auto 리드 + 크론 | ✅ 활성 |
| 6 | 번역가#1 | Translator AI | 25% → 35% | 문서, 팀 간 통신 | ✅ 활성 |

**소계:** 221% 총 용량, 40% 평균 활용 (베이스라인)

---

### Phase A: 신규 팀원 배치 (4명, 5/26-6/2)

#### Batch #1: 5/26-5/28 (1명)

| # | 역할 | 에이전트명 | 온보딩 기간 | 첫 과제 | 멘토 | 상태 |
|---|------|----------|----------|---------|------|------|
| 7 | 데이터분석가#2 | New Data-Analyst AI | 5/26-5/28 | Asset Master 506개 자산 분석 | Web-Builder#1 | 🟢 온보딩 완료 |

**Go/No-Go:** 2026-05-28 14:00 KST ✅ **Go 결정**

#### Batch #2: 5/29-6/02 (3명)

| # | 역할 | 에이전트명 | 온보딩 기간 | 첫 과제 | 멘토 | 상태 |
|---|------|----------|----------|---------|------|------|
| 8 | 웹개발자#2 | New Web-Builder AI | 5/29-6/02 | Travel-P2 UI (13개 컴포넌트) | Web-Builder#1 | 🟡 온보딩 중 |
| 9 | 평가자#2 | New Evaluator AI | 5/31-6/02 | Backup-P2 QA (26개 테스트) | Evaluator#1 | 🟡 온보딩 중 |
| 10 | 자동화전문가#2 | New Automation-Specialist AI | 5/31-6/02 | Memory Auto P2B 크론 (300줄) | Automation#1 | 🟡 온보딩 중 |

**Go/No-Go:** 2026-06-02 18:00 KST (예정)  
**독립성 확인:** 2026-06-05 09:00 KST (예정)

**Phase A 소계:** +4명, 총 10/15 (66.7%)

---

### Phase C: 확장팀 배치 (5명, 6/3-6/10)

| # | 역할 | 에이전트명 | 시작일 | 타임라인 | 주요 프로젝트 | 멘토 | 상태 |
|---|------|----------|--------|---------|-------------|------|------|
| 11 | 설계전문가 | Design AI Agent | 2026-06-03 | 6/3-6/10 | Team Dashboard-P2, Harness-ENG UI | Planner AI | 🟡 Spawning |
| 12 | DevOps | DevOps AI Agent | 2026-06-03 | 6/3-6/10 | 인프라 모니터링, 백업 시스템 | Automation#1 | 🟡 Spawning |
| 13 | 메모리전문가 | Memory Automation Lead | 2026-06-03 | 6/3-6/10 | Memory Auto P2C/D/E/F (신뢰도, 통합) | Automation#1 | 🟡 Spawning |
| 14 | QA전문가 | Advanced QA Agent | 2026-06-03 | 6/3-6/10 | 통합테스트, 성능 벤치마크 | Evaluator#1 | 🟡 Spawning |
| 15 | 프로젝트계획자 | Project Planner AI Agent (자신) | 2026-06-03 | 6/3-6/10 | 크로스프로젝트 조율, 자원배치 | Secretary | 🟡 Spawning |

**Go/No-Go:** 2026-06-10 EOD (예정)  
**Phase C 시작:** 2026-06-11 (모든 15명 ≥85% 활용)

**Phase C 소계:** +5명, 총 15/15 (100% — 1명은 긴급용)

---

## 파트 2: 프로젝트별 팀 배치 (Role-to-Project Assignment)

### 매트릭스: 15명 × 8프로젝트

```
프로젝트              | 리더         | 지원팀 (QA/지원) | 데이터/분석 | 자동화    | 설계/기타
--------------------|------------|----------------|-----------|----------|------------
1. Discord-P1 (✅)  | Web#1      | Eval#1         | —         | —        | —
2. Team Dash-P1 (✅)| Web#1      | Data#1         | —         | —        | —
3. Team Dash-P2B(✅)| Web#1      | Eval#1         | —         | —        | —
4. BM-P1 (✅)       | Web#1      | Eval#1         | —         | —        | —
5. Asset-P2 (🟡)   | Web#1      | Data#1+Data#2  | Data#1    | —        | —
6. Backup-P2 (🟡)  | Web#1      | Eval#1+Eval#2  | —         | Auto#1   | —
7. Travel-P2 (🟡)  | Web#2      | Translator#1   | —         | —        | —
8. Harness-ENG-P2(🟡)| Web#1     | Auto#1, Data#1 | Data#1    | Auto#1   | Design#11
9. Memory-P2 (🟡)  | Auto#1     | Translator#1   | —         | Auto#2   | Memory#13
```

**할당 규칙:**
- **Web-Builder#1:** Discord, Team Dash (모두), BM, Asset-P2 리드 → **4개 프로젝트 (과할당)**
  - 해결책: Web#2 추가 (5/29) + Travel-P2 분담 → 각자 2-3개씩
- **Web-Builder#2:** Travel-P2 UI 리드 (5/29~)
- **Evaluator#1, #2:** QA 병렬화 (Backup, Discord, Asset 등)
- **Data-Analyst#1, #2:** Asset Master + Harness-ENG 분담
- **Automation#1, #2:** Memory Auto + Cron 자동화

---

## 파트 3: 주간 일정 및 목표 (Weekly Objectives)

### Week 1: 5/26-5/31 (Phase A 배치 + Asset Master 마무리)

#### Mon-Wed (5/26-5/28)

**목표:** Asset Master-P2 완료 + Phase A Batch #1 온보딩 완료

| 프로젝트 | 담당 | 목표 | 기대 결과 |
|---------|------|------|---------|
| **Asset Master-P2** | Web#1 + Data#1, #2 | UI 100% 완료 (7 컴포넌트) | Vercel 배포 가능 |
| **Phase A Batch #1** | Data#2 (멘토: Web#1) | 자산 데이터 506개 정리 | 분류 완료, DB 입력 준비 |
| **Memory Auto-P2A** | Auto#1 (멘토: 기존) | Phase 2B 설계 시작 | 설계 문서 50% 작성 |
| CTB | Secretary | 08/14/15/18:00 체크포인트 | 실시간 진도 추적 |

**일정 기준:**
- 08:00: 아침 체크 (secretary)
- 14:00: 중간 점검 (팀리더)
- 15:00: Asset Master 일일 보고 (Web#1, Data#1)
- 18:00: 저녁 최종 점검 (secretary)

**예상 완료:**
- ✅ Discord-P1 (5/27)
- ✅ Team Dashboard-P2B (5/27)
- ✅ Asset Master-P2 (5/28, +1일 가능)

---

#### Thu-Sun (5/29-5/31)

**목표:** Phase A Batch #2 온보딩 시작 + Travel-P2 마무리

| 프로젝트 | 담당 | 목표 | 기대 결과 |
|---------|------|------|---------|
| **Travel-P2** | Web#2 (멘토: Web#1) | UI 100% 완료 (13개 컴포넌트) | Vercel 배포 완료 |
| **Backup-P2** | Web#1 + Eval#2 (새) | API 60% + QA 10 테스트 | 기능 검증 시작 |
| **Phase A Batch #2** | Web#2, Eval#2, Auto#2 (신규) | 온보딩 Day 1-2 완료 | 독립 작업 준비 |
| **Memory Auto-P2B** | Auto#1, #2 | 설계 문서 100% | 구현 시작 가능 |

**예상 완료:**
- ✅ Travel-P2 UI (5/31~6/02)
- 🟡 Backup-P2 API 60% (5/31)
- 🟡 Memory Auto-P2B 설계 (5/29)

---

### Week 2: 6/2-6/8 (Memory Auto 구현 + Harness-ENG 시작)

#### Mon-Wed (6/2-6/4)

**목표:** Travel-P2 배포 + Backup-P2 70% + Memory Auto Phase 2B 구현

| 프로젝트 | 담당 | 목표 | 기대 결과 |
|---------|------|------|---------|
| **Travel-P2** | Web#2 | 배포 완료, QA 마지막 테스트 | Production 라이브 |
| **Backup-P2** | Web#1 + Eval#2 | API 70% (endpoints 1-7) + QA 15 테스트 | 기능 2/3 검증 |
| **Memory Auto-P2B** | Auto#1, #2 | 중복 감지 엔진 구현 100% | 크론 테스트 시작 |
| **Harness-ENG-P2** | Web#1 + Data#1 | db/38-42 마이그레이션 완료 | API 구현 시작 가능 |

**예상 완료:**
- ✅ Travel-P2 배포 (6/2)
- 🟡 Backup-P2 70% (6/3~4)
- 🟡 Memory Auto-P2B 100% (6/3~4)

---

#### Thu-Sun (6/4-6/8)

**목표:** Backup-P2 완료 + Memory Auto 단계 2B/2C + Harness-ENG API 진행

| 프로젝트 | 담당 | 목표 | 기대 결과 |
|---------|------|------|---------|
| **Backup-P2** | Web#1 + Eval#2 | API 100% + UI 시작 (5 컴포넌트) | Vercel 배포 준비 |
| **Memory Auto-P2C** | Memory#13 (신규), Auto#2 | 신뢰도 계산기 구현 100% | 점수 시스템 검증 |
| **Harness-ENG-P2** | Web#1 + Data#1 | API 50% (endpoints 1-10) | UI 준비 시작 |
| **Team Dashboard-P2** | Design#11 (신규) | UI/UX 설계 100% | 구현 스펙 완성 |

**예상 완료:**
- 🟡 Backup-P2 API 100% (6/5)
- 🟡 Memory Auto-P2C (6/5~6)
- 🟡 Harness-ENG-P2 API 50% (6/6)

---

### Week 3: 6/9-6/15 (최종 마무리)

#### Mon-Wed (6/9-6/11)

**목표:** Backup-P2 배포 + Harness-ENG-P2 API 완료

| 프로젝트 | 담당 | 목표 | 기대 결과 |
|---------|------|------|---------|
| **Backup-P2** | Web#1 + Eval#2 | UI 100% + 배포 완료 | Production 라이브 |
| **Harness-ENG-P2** | Web#1 + Data#1 | API 100% 완료 | UI 개발 시작 가능 |
| **Memory Auto-P2D/E/F** | Memory#13, Auto#1, #2 | 크론 통합 + 테스트 + 배포 | 프로덕션 런 시작 |
| **Team Dashboard-P2** | Design#11 + Web#2 | UI 구현 시작 (5 페이지) | 기본 레이아웃 완료 |

**예상 완료:**
- ✅ Backup-P2 배포 (6/10)
- 🟡 Harness-ENG-P2 API 100% (6/9~10)
- ✅ Memory Auto-P2 완료 (6/9)

---

#### Thu-Sun (6/11-6/15)

**목표:** Harness-ENG-P2 UI + Team Dashboard-P2 UI 진행

| 프로젝트 | 담당 | 목표 | 기대 결과 |
|---------|------|------|---------|
| **Harness-ENG-P2** | Web#1 + Design#11 | UI 100% + 배포 | Production 라이브 |
| **Team Dashboard-P2** | Web#2 + Design#11 | UI 70% (기본 기능) | 추가 기능 준비 |
| **Phase C 확장** | QA#14, DevOps#12 | 인프라 모니터링 + 통합테스트 | 배포 자동화 준비 |

**예상 완료:**
- ✅ Harness-ENG-P2 완료 (6/10)
- 🟡 Team Dashboard-P2 70% (6/15)

---

## 파트 4: 용량 추적 및 밸런싱 (Capacity Tracking)

### 개인별 주간 용량 계획 (Weekly Capacity)

#### Web-Builder#1 (가장 과할당됨)

```
현재 할당:
  ├─ Asset Master-P2 (진행중) — 30% (UI 담당)
  ├─ Backup-P2 (진행중) — 20% (API 담당)
  ├─ Harness-ENG-P2 (대기) — 40% (UI 담당)
  └─ Discord/Team Dash/BM (유지보수) — 10%
  = 총 100% (과할당 상태)

주간별 조정:
  Week 1 (5/26-5/31):
    - Asset Master UI 100% → 배포 (30%)
    - Backup API 진행 (20%)
    - Harness 대기 (40%)
    - 유지보수 (10%)
  
  Week 2 (6/2-6/8):
    - Asset Master → 완료 (-30%)
    - Backup UI 시작 (추가 20%)
    - Harness API 시작 (40%)
    - 총 80% 활용
  
  Week 3 (6/9-6/15):
    - Backup → 배포 (-20%)
    - Harness UI 100% (60%)
    - Team Dashboard 유지보수 (20%)
    = 총 80% 활용
```

**과할당 해결책:**
- Web-Builder#2 배치 (5/29): Travel-P2 UI 담당 → Web#1에서 독립
- 실제 업무 분담:
  - Web#1: Asset-P2, Backup-P2, Harness-P2 (3개, 순차)
  - Web#2: Travel-P2 (1개)
  - 결과: 각자 2개 동시 처리 가능

---

#### Data-Analyst (병목 방지)

```
현재 할당:
  ├─ Data-Analyst#1: Asset Master-P2 (25%), Harness-ENG-P2 (15%) = 40%
  └─ Data-Analyst#2 (5/26 추가): Asset Master-P2 (25%), 기타 (5%) = 30%

분담:
  - Asset Master 506개 자산 정리:
    * Data#1: 300개 (기본 범주 → 30%)
    * Data#2: 206개 (특수 범주 → 30%)
  
  - Harness-ENG 자산 검증:
    * Data#1: 15% (자산 매핑)
    * Data#2: 5% (검증 보조)

결과: 
  - 병목 제거 (40% + 30% = 70% 분산)
  - 각자 기본 70% 활용, 여유 30%
```

---

#### Evaluator (QA 병렬화)

```
현재 할당:
  ├─ Evaluator#1 (기존): 모든 프로젝트 QA + 규칙 감시 = 80%
  └─ Evaluator#2 (5/31 추가): Backup-P2 + Asset-P2 QA = 50%

분담:
  - Discord-P1: Eval#1 (테스트 완료, 유지보수 2%)
  - Team Dash: Eval#1 (테스트 완료, 유지보수 2%)
  - Asset-P2: Eval#1 + Eval#2 (병렬 테스트)
  - Backup-P2: Eval#1 + Eval#2 (병렬 테스트)
  - Travel-P2: Eval#1 (테스트, 15%)
  - Harness-ENG: QA#14 (신규, 통합테스트)

결과:
  - Eval#1: 60% (QA 집중, 규칙 감시 20%)
  - Eval#2: 50% (Backup + Asset QA)
  - QA#14: 60% (통합테스트, 6/3부터)
```

---

#### Automation (자동화 강화)

```
현재 할당:
  ├─ Automation#1 (기존): Memory Auto-P2 리드 (60%)
  └─ Automation#2 (5/31 추가): 크론 스크립트 (25%)

분담:
  - Memory Auto-P2A (API): Auto#1 (100% 완료 5/27) → 0%
  - Memory Auto-P2B (중복감지): Auto#1 (40%) + Auto#2 (25%)
  - Memory Auto-P2C-F (신뢰도, 크론): Auto#2 (25%) + Memory#13 (30%)
  - Cron 모니터링: Automation#1 (20%), DevOps#12 (30%, 6/3부터)

결과:
  - Auto#1: 60% (Memory 리드 + 크론 감시)
  - Auto#2: 50% (크론 스크립트 + 테스트)
  - DevOps#12: 30% (인프라 모니터링, 6/3부터)
```

---

### 팀 활용률 변화 (Capacity Utilization Trend)

```
Timeline       | 팀원수 | 활용 인원 | 활용률  | 주요 이벤트
---------------|--------|----------|--------|----------------------------------
5/26 08:00     | 6      | 6        | 100%   | Phase A Batch #1 온보딩 (Data#2)
5/28 14:00     | 7      | 7        | 100%   | Data#2 Go/No-Go ✅ Go
5/29 09:00     | 10     | 10       | 100%   | Phase A Batch #2 온보딩 (Web#2, Eval#2, Auto#2)
5/31 18:00     | 10     | 10       | 100%   | Batch #2 독립성 확인 (3일 후)
6/02 18:00     | 10     | 10       | 100%   | Phase A 완료
6/03 09:00     | 15     | 15       | 100%   | Phase C 온보딩 (Design, DevOps, Memory, QA, Planner)
6/05 18:00     | 15     | 15       | 100%   | Phase C 독립성 확인 예정
6/10 EOD       | 15     | 14       | 93.3%  | Phase C 완료, 1명 긴급용
```

---

## 파트 5: 위험 및 완화 전략 (Risks & Mitigation)

### R1: Web-Builder#1 번아웃 (Resource Risk)

**위험:** 4개 프로젝트 동시 진행 → 품질 저하 + 지연

**완화:**
- Web-Builder#2 배치 (5/29) → Travel-P2 분담
- 실제 분담: Asset (5), Backup (6), Harness (10) = 순차 진행
- 검토: 일주일 최대 3개 동시 진행

**모니터링:**
- 일일 체크인 (15:00 Asset Master 보고)
- 피로도 지표 (완료 진도율 vs 예정)

---

### R2: Data-Analyst#1 병목 (Resource Risk)

**위험:** 2개 프로젝트 데이터 담당 (Asset + Harness) → 지연

**완화:**
- Data-Analyst#2 배치 (5/26) → Asset Master 분담 (506개 자산)
- 분담: Data#1은 Harness 깊이있게, Data#2는 Asset 광범위
- 추가: QA#14 (6/3) 통합테스트로 검증 병렬화

**모니터링:**
- 주간 데이터 분석 진도 (% complete)
- 병목 즉시 감지 (크로스프로젝트 일정 충돌)

---

### R3: Phase A/B/C 온보딩 지연 (Process Risk)

**위험:** 신규팀원 적응 느림 → 예정 +2~3일

**완화:**
- 온보딩 패키지 사전 준비 (ONBOARDING_PACKAGE_NEW_MEMBERS)
- 멘토링 명확화 (1:1 파트너, 1주일 밀착)
- 독립성 확인 3일 후 (실제 작업 시작)

**모니터링:**
- 온보딩 체크리스트 (설계 문서 읽기, 첫 과제, 코드 리뷰)
- 독립성 평가 (5/28, 6/02, 6/05)

---

### R4: 팀 간 의사소통 단절 (Process Risk)

**위험:** 15명 팀 → 메시지 손실 → 명세 오류 → 재작업

**완화:**
- 일일 4회 체크포인트 (08/14/15/18:00)
- CTB 자동 갱신 (1분 지연 추적)
- Discord 자동 로깅 (모든 결정 기록)

**모니터링:**
- 주간 커뮤니케이션 리뷰 (Discord #decision)
- 명세 변경 로그 (API, UI, DB)

---

## 파트 6: 완료 기준 (Completion Criteria)

### 설계 단계 (Design Phase) ✅ 8/8 완료

- [x] **팀 구성 정의** — 15명 역할 및 용량 확정
- [x] **프로젝트 배치** — 8개 프로젝트 × 15명 매트릭스
- [x] **주간 목표** — 3주간 (5/26-6/15) 주간 계획
- [x] **용량 추적** — 개인별, 프로젝트별 %할당
- [x] **리소스 밸런싱** — Web#1 과할당 해결, 병목 방지
- [x] **위험 식별** — 5개 주요 위험 + 완화 전략
- [x] **온보딩 계획** — Phase A/B/C 타임라인
- [x] **모니터링** — 일일 체크포인트 + 1분 추적

### 구현 단계 (Implementation Phase) 🟡 0/4 진행중

- [ ] **팀원 배치 실행** — Phase A (5/26-6/2), Phase C (6/3-6/10)
- [ ] **주간 체크인 활성화** — 08/14/15/18:00 KST 정기 회의
- [ ] **CTB 자동 갱신** — 매 체크포인트마다 진도 기록
- [ ] **독립성 평가 완료** — 5/28, 6/02, 6/05, 6/10 확인

---

## 결론

이 문서는 **15명 팀의 완전한 용량 계획**을 정의합니다:

- **현황:** 6명 (40%) → **목표:** 14명 (93.3%) — 2026-06-10
- **타임라인:** Phase A (1주) + Phase B (1주) + Phase C (1주)
- **리스크:** Web#1 과할당, Data#1 병목 → 신규팀원 배치로 해결
- **모니터링:** 4회 체크포인트 + 자동 1분 추적 + 주간 평가

**다음 단계:**
1. CEO 검증 (2026-05-28)
2. 팀원 온보딩 시작 (2026-05-26 Data#2, 5/29 Web#2/Eval#2/Auto#2)
3. 주간 체크인 활성화 (2026-05-26부터)
4. 최종 팀 완성 (2026-06-10)

---

**마지막 갱신:** 2026-05-28 (설계 완료)  
**작성자:** Project Planner AI Agent  
**상태:** ✅ 설계 완료, 🟡 구현 준비

