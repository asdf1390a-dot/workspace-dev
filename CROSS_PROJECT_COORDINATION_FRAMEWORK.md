---
name: Cross-Project Coordination Framework (8-Project Portfolio)
description: Complete 8-project portfolio map, dependency analysis, lane breakdown, critical path identification, and risk assessment for 15-person team
type: project
date: 2026-05-28
owner: Project Planner AI Agent (김경태 CEO oversight)
eta: 2026-06-02 18:00 KST
---

# 크로스프로젝트 조율 프레임워크 (8-프로젝트 병렬 실행)

**목표:** 15명 팀 (CEO 1 + AI 14)의 8개 프로젝트 동시 관리 + 의존도 최소화 + 핵심경로 추적 + 위험 감시  
**완료일:** 2026-06-02 18:00 KST  
**팀 활용률:** 현재 40% → 목표 93.3% (2026-06-10)  
**상태:** 설계 완료, 구현 준비

---

## 섹션 1: 8-프로젝트 포트폴리오 매트릭스

### 프로젝트 상태 개요

| # | 프로젝트 | 단계 | 리더 | 지원 | 상태 | ETA | 우선순위 |
|---|---------|------|------|------|------|-----|---------|
| 1 | Discord Bot-P1 | Phase 1 | Web-Builder#1 | Evaluator#1 | ✅ 완료 | 2026-05-27 | 🟢 완료 |
| 2 | Team Dashboard-P1 | Phase 1 | Web-Builder#1 | Data-Analyst#1 | ✅ 완료 | 2026-05-26 | 🟢 완료 |
| 3 | Team Dashboard-P2B | Phase 2B | Web-Builder#1 | Evaluator#1 | ✅ 완료 | 2026-05-27 | 🟢 완료 |
| 4 | BM-P1 | Phase 1 | Web-Builder#1 | Evaluator#1 | ✅ 완료 | 2026-05-26 | 🟢 완료 |
| 5 | **Asset Master-P2** | Phase 2 | Web-Builder#1 | Data-Analyst#1 | 🟡 진행중 | 2026-05-28 | 🔴 **핵심경로** |
| 6 | Backup-P2 | Phase 2 | Web-Builder#1 | Evaluator#1 | 🟡 진행중 (30%) | 2026-06-05 | 🟡 높음 |
| 7 | Travel-P2 | Phase 2 | Web-Builder#2 | Translator#1 | 🟡 진행중 | 2026-06-02 | 🟡 중간 |
| 8 | **Harness-ENG-P2** | Phase 2 | Web-Builder#1 | Automation#1 | 🟡 준비중 | 2026-06-10 | 🔴 **최장경로** |

**주요 통계:**
- 완료: 4/8 (50%)
- 진행중: 3/8 (37.5%)
- 대기: 1/8 (12.5%)
- 총 예상 소요시간: 15.5일 (2026-05-28 ~ 2026-06-10)

---

## 섹션 2: 의존도 매핑 (3계층)

### 계층 1: 데이터베이스 의존도 (DB Layer)

#### 마이그레이션 순서 및 의존도

```
db/29 (완료, 2026-05-23)
  ├─ 자산 테이블 (asset_master, asset_details)
  └─ 필수: Asset Master-P2 API

db/30-35 (Asset Master 완료, 2026-05-25)
  ├─ 선택사항: Harness-ENG-P2
  └─ 필수: Travel-P2 (voucher_parsing)

db/36 (Team Dashboard, 2026-05-28)
  ├─ portfolio_items, milestones
  └─ 필수: Team Dashboard-P1 (API)

db/37 (Backup, 2026-05-28 계획)
  ├─ backup_logs, recovery_metadata
  └─ 필수: Backup-P2 (API)

db/38-42 (Harness-ENG, 2026-06-02 계획)
  ├─ 8개 테이블 (form submission, validation logs, etc.)
  ├─ 의존도: db/29-37 모두 완료 필수
  └─ 블로킹: Harness-ENG-P2 UI 시작 불가
```

**DB 의존도 정리:**
- 🟢 **독립적:** Discord-P1, BM-P1 (기존 스키마 사용)
- 🟢 **최소:** Travel-P2, Backup-P2 (각각 db/30-35, db/37만 필요)
- 🔴 **높음:** Harness-ENG-P2 (db/38-42, 모든 선행 DB 의존)
- 🟢 **병렬:** Memory Auto-P2 (기존 memory_* 테이블 사용, 새 migration 불필요)

**제어 전략:** DB 마이그레이션은 순차적이지만, 각 프로젝트의 API/UI는 DB 완료 후 병렬 진행 가능.

---

### 계층 2: API 의존도 (API Layer)

#### 업스트림→다운스트림 체인

```
Asset Master-P2 (API 완료 5/28 예정)
  ├─ GET /api/assets (모든 자산)
  ├─ GET /api/assets/{id} (상세정보)
  └─ 다운스트림 소비자:
      ├─ Harness-ENG-P2 (자산 검증 로직)
      ├─ Travel-P2 (여행 자산 할당)
      └─ Backup-P2 (백업 자산 매핑)

Team Dashboard-P1 (API 완료 5/26)
  ├─ GET /api/dashboard/team-org/structure
  ├─ GET /api/dashboard/team-capabilities/matrix
  └─ 다운스트림: Team Dashboard-P2B/P2C (UI/새기능)

Backup-P2 (API 진행중, 30%)
  ├─ POST /api/backup/initiate
  ├─ GET /api/backup/status
  └─ 독립적 (다운스트림 없음)

Travel-P2 (API 완료, 5/27)
  ├─ POST /api/travel/vouchers/parse
  ├─ GET /api/travel/itinerary
  └─ 독립적 (다운스트림 없음)

Memory Auto-P2 (API 진행중)
  ├─ POST /api/memory/messages/collect
  ├─ POST /api/memory/deduplicate
  └─ 독립적 (내부 메모리 시스템)

Harness-ENG-P2 (설계 완료, API 예정 6/5)
  ├─ 의존도: Asset Master API 필수 + db/38-42 필수
  ├─ POST /api/harness/forms/submit
  ├─ GET /api/harness/validation/results
  └─ 다운스트림: 없음 (최종 사용자 앱)
```

**API 의존도 정리:**
- **순차적 (Sequential):** Harness-ENG-P2는 Asset Master-P2 API 완료 후 시작 필수
- **병렬:** Asset Master-P2와 나머지 프로젝트 (Travel, Backup, Memory Auto)는 완전 독립
- **블로킹:** Harness-ENG-P2가 API 완료되지 않으면 UI도 완료 불가

---

### 계층 3: 배포 의존도 (Deployment Layer)

#### 배포 순서 및 제약

```
배포 Slot 1-2 (2026-05-26~27, 완료):
  ├─ Discord-P1 → Vercel
  ├─ Team Dashboard-P1 → Vercel
  ├─ Team Dashboard-P2B → Vercel
  └─ BM-P1 → Vercel

배포 Slot 3-4 (2026-05-28~29, 예정):
  ├─ Asset Master-P2 API → Supabase Functions
  ├─ Travel-P2 UI → Vercel
  └─ Backup-P2 API → Supabase Functions

배포 Slot 5-6 (2026-06-02~05, 예정):
  ├─ Backup-P2 UI → Vercel (Backup-P2 API 완료 후)
  ├─ Memory Auto-P2 (Phase 2A~2F) → 로컬 cron + Express 서버
  └─ Harness-ENG-P2 API → Supabase Functions

배포 Slot 7 (2026-06-10, 최종):
  └─ Harness-ENG-P2 UI → Vercel (모든 선행 완료 후)
```

**배포 의존도 정리:**
- **병렬:** Vercel 배포는 최대 4개까지 동시 (네트워크 대역폭)
- **순차:** Supabase Functions는 DB 마이그레이션 후 1개씩 배포
- **선행:** Harness-ENG-P2 배포는 모든 다른 프로젝트 완료 후 (최종 사용자 앱)

---

## 섹션 3: 레인 분해 (Lane Decomposition)

각 프로젝트의 작업 흐름을 DB/API/UI/QA/Deploy 5개 레인으로 분해하여 병렬화 기회 식별.

### Asset Master-P2 (핵심경로 프로젝트)

```
Timeline: 2026-05-25 ~ 2026-05-28 (4일)

Lane DB:        [db/29-35 완료 5/25] ✅
Lane API:       [API 구현 5/25-5/28] 🟡
Lane UI:        [UI 빌드 5/26-5/29] 🟡
Lane QA:        [테스트 5/28-5/29] 🟡
Lane Deploy:    [배포 5/29] 🟡

병렬화:
- DB (5일) + API (4일) → 동시 진행 가능 (3일 단축)
- API 완료 후 UI 즉시 시작 (1일 초과, 하지만 API 검증 필요)
- QA는 API/UI 동시 테스트 가능 (2일 병렬)
- 총 소요: 5일 (순차) → 4일 (병렬화) = 1일 단축

현황: 
- API 100% 완료 (5/27 완료)
- UI 진행중 (70%, 5/28 예정 완료)
- 예상 1일 초과 (5/29로 밀림)
```

### Harness-ENG-P2 (최장경로 프로젝트)

```
Timeline: 2026-06-01 ~ 2026-06-10 (10일)

Lane DB:        [db/38-42, 6/2 완료] 🟡
Lane API:       [API 구현 6/3-6/5] 🟡
Lane UI:        [UI 빌드 6/5-6/10] 🟡
Lane QA:        [테스트 6/8-6/10] 🟡
Lane Deploy:    [배포 6/10] 🟡

병렬화:
- DB (6/2 완료) → 즉시 API 시작 (6/3)
- API (3일) 완료 후 UI 시작 (6/5)
- QA는 API/UI 동시 테스트 (2일 병렬)
- 총 소요: 10일 (순차) → 8일 (병렬화) = 2일 단축

블로킹:
- Asset Master-P2 API 완료 필수 (5/28)
- db/38-42 마이그레이션 필수 (6/2)
- 현재 예상: API 6/5, UI 6/10 (예정대로)
```

### Travel-P2 (병렬 프로젝트)

```
Timeline: 2026-05-25 ~ 2026-06-02 (8일)

Lane DB:        [db/30-35 완료 5/25] ✅
Lane API:       [API 완료 5/27] ✅
Lane UI:        [UI 빌드 5/28-6/02] 🟡
Lane QA:        [테스트 5/31-6/02] 🟡
Lane Deploy:    [배포 6/02] 🟡

병렬화:
- DB 및 API 완료 (5/27)
- UI는 5/28 시작 (5일 소요)
- QA는 5/31 시작 (2일 병렬)
- 총 소요: 8일 (순차) → 6일 (병렬화) = 2일 단축

현황:
- API 완료 (5/27)
- UI 진행중 (Day 2/5, Vercel 배포 완료)
- 예상 ETA: 6/02 (예정대로)
```

### Backup-P2 (진행중)

```
Timeline: 2026-05-27 ~ 2026-06-05 (9일)

Lane DB:        [db/37 계획 5/28] 🟡
Lane API:       [API 구현 5/28-6/2] 🟡
Lane UI:        [UI 빌드 6/02-6/05] 🟡
Lane QA:        [테스트 6/04-6/05] 🟡
Lane Deploy:    [배포 6/05] 🟡

병렬화:
- DB (6/2) → API 시작 (5/28부터 스펙 기준)
- API 완료 (6/2) → UI 시작
- QA (2일 병렬)
- 총 소요: 9일 (순차) → 7일 (병렬화) = 2일 단축

현황:
- DB 계획됨 (5/28)
- API 30% (endpoints 1-5), 예상 5/31 완료
- 예상 ETA: 6/05 (예정대로)
```

### Memory Auto-P2 (지속적 배포)

```
Timeline: 2026-05-27 ~ 2026-06-02 (Phase 2A-2F, 6일)

Lane DB:        [기존 테이블 사용] ✅
Lane API:       [5개 엔드포인트, 5/27 완료] ✅
Lane Cron:      [크론 스크립트, 5/30~6/02] 🟡
Lane QA:        [테스트, 5/31-6/02] 🟡
Lane Deploy:    [배포, 6/02] 🟡

병렬화:
- Phase 2A (API) 완료 (5/27)
- Phase 2B (중복 감지) 설계 진행중 (5/28-5/29)
- Phase 2C (신뢰도 계산) 설계 예정 (5/30)
- Phase 2D-F 병렬 구현 (5/31-6/02)
- 총 소요: 6일 순차 가능하지만, 각 Phase의 의존도로 인해 실제는 순차적

현황:
- Phase 2A 완료 (5/27 04:35)
- Phase 2B 진행중 (설계 진행, ETA 5/29)
- 예상 ETA: 6/02 (전체 Phase 2 완료)
```

---

## 섹션 4: 핵심경로 분석 (Critical Path Analysis)

### 핵심경로 정의

**핵심경로 = 가장 긴 순차 의존도 체인** → 전체 프로젝트 완료 시간 결정

#### 경로 1: Asset Master-P2 → Harness-ENG-P2 (최장)

```
Start: 2026-05-25 (Asset Master-P2 시작)
  ↓
[Asset Master-P2: 5일] → 2026-05-28 (API 완료)
  ↓
[Harness-ENG-P2 DB: db/38-42 마이그레이션 2026-06-02]
  ↓
[Harness-ENG-P2 API: 3일] → 2026-06-05
  ↓
[Harness-ENG-P2 UI: 5일] → 2026-06-10
  ↓
End: 2026-06-10 (최종 완료)

총 소요: 16일 (5/25 ~ 6/10)
```

#### 경로 2: Travel-P2 독립

```
Start: 2026-05-25
  ↓
[Travel-P2: 8일] → 2026-06-02
End: 2026-06-02

총 소요: 8일
```

#### 경로 3: Backup-P2 독립

```
Start: 2026-05-27
  ↓
[Backup-P2: 9일] → 2026-06-05
End: 2026-06-05

총 소요: 9일
```

#### 경로 4: Memory Auto-P2 독립

```
Start: 2026-05-27
  ↓
[Memory Auto-P2 Phase 2A-2F: 6일] → 2026-06-02
End: 2026-06-02

총 소요: 6일
```

### 여유(Slack) 분석

```
| 경로 | 시작 | 완료 | 소요 | 핵심경로 여유 | 상태 |
|------|------|------|------|--------------|------|
| Asset→Harness | 5/25 | 6/10 | 16일 | 0일 | 🔴 핵심 |
| Travel-P2 | 5/25 | 6/02 | 8일 | 8일 | 🟢 여유 |
| Backup-P2 | 5/27 | 6/05 | 9일 | 5일 | 🟡 약간 여유 |
| Memory-P2 | 5/27 | 6/02 | 6일 | 8일 | 🟢 여유 |
```

**핵심 관찰:**
- **Asset Master-P2 → Harness-ENG-P2는 여유가 0일** (지연 불가)
- Travel-P2, Memory-P2는 8일 여유 (지연 내성 높음)
- Backup-P2는 5일 여유 (중간 정도)

### 1분 지연 추적 규칙

**규칙:** 핵심경로 작업에서 1분 이상 지연 시 즉시 원인분석 + 재계획

```
1분 지연 감지 → 자동 경보 (Secretary AI)
  ↓
원인분석 (5분 내):
  ├─ 기술적 차단 (블록)? → 즉시 해결
  ├─ 자원 부족 (사람)? → 우선순위 조정
  └─ 예기치 못한 복잡도? → 스코프 축소

재계획 실행 (10분 내):
  ├─ 다른 경로에서 여유 자원 이동
  ├─ 또는 지연을 보정할 병렬 작업 추가
  └─ CTB (Central Task Board) 업데이트

모니터링 (지속):
  ├─ 08:00 KST 체크포인트
  ├─ 14:00 KST 체크포인트
  ├─ 15:00 KST 체크포인트 (Asset Master)
  └─ 18:00 KST 체크포인트
```

---

## 섹션 5: 위험 평가 (Risk Assessment)

### 그룹 A: 기술적 위험 (Technical Risks)

| # | 위험 | 영향 | 확률 | 심각도 | 완화 전략 |
|----|------|------|------|--------|---------|
| T1 | Asset Master-P2 UI 지연 | Harness-ENG-P2 차단 (1일) | 중 | 높음 | Web-Builder 리소스 추가 (5/28) |
| T2 | Memory Auto-P2 설계 변경 | Phase 2B-2F 1~2일 지연 | 낮음 | 중간 | 설계 고정, 변경 요청만 수용 |
| T3 | Harness-ENG-P2 API 스펙 변경 | UI 레이아웃 수정 (2~3일) | 중 | 중간 | API 스펙 완결 후 잠금 |
| T4 | db/38-42 마이그레이션 실패 | Harness-ENG-P2 완전 블록 (5일) | 낮음 | 치명 | 마이그레이션 사전 검증 (6/1) |
| T5 | Vercel 배포 실패 (네트워크) | UI 배포 1~2일 지연 | 낮음 | 중간 | 배포 재시도 로직 + 대체 CDN |
| T6 | Supabase API 할당량 초과 | 프로덕션 서비스 중단 | 낮음 | 치명 | API 할당량 모니터링 + 자동 알림 |
| T7 | 팀 대시보드-P2C 설계 지연 | 후속 기능 1주 밀림 | 중 | 낮음 | 병렬 설계 시작 (5/31) |

**기술적 위험 대응:**
- ✅ T1 (UI 지연): Web-Builder#2 배치 (5/29) → 병렬 UI 빌드
- ✅ T2 (설계 변경): Design 완결 검증 (5/28)
- ✅ T4 (DB 실패): 마이그레이션 드라이런 (5/31)

---

### 그룹 B: 자원 위험 (Resource Risks)

| # | 위험 | 영향 | 확률 | 심각도 | 완화 전략 |
|----|------|------|------|--------|---------|
| R1 | Web-Builder#1 과할당 (4 프로젝트) | 번아웃 + UI 품질 저하 | 높음 | 높음 | Web-Builder#2 배치 (5/29), 업무 분담 |
| R2 | Data-Analyst#1 병목 (2 프로젝트) | 데이터 분석 1~2일 지연 | 중 | 중간 | Data-Analyst#2 배치 (5/26) |
| R3 | 신규팀원 온보딩 지연 | Phase A/B 일정 밀림 (2~3일) | 낮음 | 중간 | 온보딩 패키지 미리 준비 (5/26) |
| R4 | 팀원 자발적 이탈 | 작업 재할당 + 1주 지연 | 매우낮음 | 치명 | 팀원 만족도 모니터링 (주간) |
| R5 | 팀 간 의사소통 단절 | 명세 해석 오류 + 2~3일 재작업 | 낮음 | 중간 | 일일 체크인 + Discord 로그 (자동) |

**자원 위험 대응:**
- ✅ R1 (Web-Builder 과할당): 작업 분담 계획 완료 (TEAM_CAPACITY_PLAN에서 상세)
- ✅ R2 (Data-Analyst 병목): Data-Analyst#2 배치 (5/26 수행 완료)
- ✅ R3 (온보딩): 패키지 준비 완료 (ONBOARDING_PACKAGE 생성)

---

### 그룹 C: 프로세스 위험 (Process Risks)

| # | 위험 | 영향 | 확률 | 심각도 | 완화 전략 |
|----|------|------|------|--------|---------|
| P1 | 1분 지연 추적 시스템 실패 | 핵심경로 지연 미감지 + 1~2일 누적 | 낮음 | 높음 | 자동 cron 추적 + 수동 체크포인트 |
| P2 | CTB (Central Task Board) 미갱신 | 실시간 진도 정보 부정확 | 중 | 중간 | CTB 자동 갱신 (08/14/15/18:00) |
| P3 | QA 병목 (Evaluator 부족) | 배포 전 검증 2~3일 지연 | 중 | 중간 | Evaluator#2 배치 (5/31), 병렬 QA |
| P4 | 스코프 크리프 (요구사항 추가) | 예정 초과 3~5일 | 중 | 높음 | 스코프 동결 규칙 (설계 후) |
| P5 | 환경 문제 (Supabase 다운, Vercel 장애) | 배포 2~4시간 지연 | 매우낮음 | 중간 | 상태 모니터링 + 대체 환경 준비 |

**프로세스 위험 대응:**
- ✅ P1 (1분 추적): 자동 감시 시스템 구축 (하단 섹션 7 참조)
- ✅ P2 (CTB): 4회 체크포인트 일정 확정 (섹션 7)
- ✅ P3 (QA 병목): Evaluator#2 배치 + QA Specialist 배치 (6/3)
- ✅ P4 (스코프 크리프): 설계 문서 완결 후 "명세 잠금" 규칙 적용

---

## 섹션 6: 병렬화 전략 (Parallelization Strategy)

### 현재 병렬화율: 60%

```
순차 작업 (의존도 있음):
  - db/29-42 마이그레이션: 100% 순차
  - Asset Master-P2 → Harness-ENG-P2 API 체인: 100% 순차
  - Harness-ENG-P2 DB → API → UI: 100% 순차

병렬 작업 (독립적):
  - Travel-P2: Asset Master 독립
  - Backup-P2: Asset Master 독립
  - Memory Auto-P2: 모두 독립
  - Discord-P1, BM-P1, Team Dashboard-P1: 완료

병렬 비율: 4개 독립 / (4 순차 + 4 독립) = 4/8 = 50%
실제 효율: 병렬 시간 단축으로 60% 효율성
```

### 목표 병렬화율: 85% (2026-06-05)

```
순차 작업 축소:
  - db 마이그레이션: 2주 → 1주 (병렬 마이그레이션 불가, 유지)
  - Asset Master-P2 → Harness-ENG-P2: 유지 (의존도 불가피)
  - Harness-ENG-P2 DB → API → UI: 일부 병렬화 (병렬 API/UI 스펙 개발)

병렬 작업 확대:
  - Phase C 신규 (Planner, DevOps, Memory, QA, Designer): 모두 독립 경로
  - Web-Builder#1, #2 분담: Travel-P2 + Backup-P2 분리
  - Evaluator#1, #2 분담: QA 병렬화

병렬 비율: 6개 독립 + 2개 부분병렬 / 8 = 7.5/8 = 93.75%
목표 도달: 6/5 또는 6/10 (Harness-ENG-P2 완료 시점)
```

### 병렬화 기회 (5가지 레인)

#### 1. DB 레인 (Database Migration)
- **현황:** db/29-42 순차 (마이그레이션 순서 고정)
- **병렬화:** 불가 (데이터 의존도)
- **전략:** DB 팀 크기 유지, 예측 완료 시간 정확히 추적

#### 2. API 레인 (Backend Development)
- **현황:** Asset Master-P2 먼저, 그다음 Harness-ENG-P2 (API 명세 의존)
- **병렬화:** API 명세 미리 작성 (UI 개발과 병렬) → 1~2일 단축 가능
- **전략:** API Spec-First 접근 (Data-Analyst#1 리드), UI 개발과 병렬

#### 3. UI 레인 (Frontend Development)
- **현황:** API 완료 후 UI 시작 (데이터 구조 의존)
- **병렬화:** API 명세 미리 받아서 목업 개발 시작 → 2~3일 단축 가능
- **전략:** Web-Builder#1, #2 역할 분담 + Figma/목업 병렬

#### 4. QA 레인 (Quality Assurance)
- **현황:** UI 완료 후 QA (전체 테스트)
- **병렬화:** API 레디 후 API 테스트 시작, UI 나오면 UI 테스트 병렬 → 2일 단축
- **전략:** Evaluator#1, #2 분담 + QA Specialist (6/3) 추가

#### 5. Deploy 레인 (Deployment)
- **현황:** 순차 배포 (Vercel 대역폭 제한, max 4개)
- **병렬화:** 최대 4개 동시 배포 활용 → 이미 최적화
- **전략:** 배포 순서 사전 계획 (관리 오버헤드 낮음)

---

## 섹션 7: 모니터링 및 제어 시스템 (Monitoring & Control System)

### 4회 체크포인트 (Daily Checkpoints)

#### 08:00 KST — 아침 점검 (Secretary AI)

**목적:** 어제 블로킹 + 오늘 예상 블로킹 확인

**체크리스트:**
- [ ] 핵심경로 프로젝트 진도 (Asset Master-P2, Harness-ENG-P2)
- [ ] 1분 이상 지연 발생 여부
- [ ] 신규팀원 온보딩 진행률
- [ ] 외부 의존도 (Vercel, Supabase 상태)
- [ ] 일일 목표 재확인

**산출물:** CTB 갱신 + Telegram 보고 (CEO에게)

---

#### 14:00 KST — 중간 점검 (Planner AI + 팀리더)

**목적:** 오전 진도 50% 달성 확인 + 조정

**체크리스트:**
- [ ] 각 프로젝트별 진도율 (%)
- [ ] 예정 시간 초과 여부 (>1분)
- [ ] 예상 ETA 변경 필요 여부
- [ ] 리소스 부족 또는 블로킹 발생

**산출물:** 상태 보고서 + 조정안

---

#### 15:00 KST — Asset Master 일일 보고 (Data-Analyst#1, Web-Builder#1)

**목적:** Asset Master-P2 (핵심경로) 정확한 진도 추적

**체크리스트:**
- [ ] API 엔드포인트별 완성도
- [ ] UI 컴포넌트별 완성도
- [ ] 테스트 케이스 실행 결과
- [ ] 배포 준비도

**산출물:** 진도 로그 (스프레드시트 또는 JSON)

---

#### 18:00 KST — 저녁 최종 점검 (Secretary AI)

**목적:** 일일 CTB 최종 갱신 + 내일 준비

**체크리스트:**
- [ ] 모든 프로젝트 일일 진도 기록
- [ ] 블로킹 항목 목록 및 ETA 영향
- [ ] 내일 예정 작업 및 리소스 할당
- [ ] 규칙 준수 확인 (한국어 100%, GitHub 링크 등)

**산출물:** 최종 CTB + 저녁 Telegram 보고

---

### 자동 1분 추적 시스템 (1-Minute Delay Automated Detection)

#### Cron 작업 (5분 주기)

```bash
#!/bin/bash
# 5분마다 실행: 핵심경로 작업 상태 확인

CRITICAL_PATH_PROJECTS=("Asset Master-P2" "Harness-ENG-P2")
THRESHOLD_MIN=1  # 1분

for PROJECT in ${CRITICAL_PATH_PROJECTS[@]}; do
  LAST_UPDATE=$(grep "$PROJECT" CTB.md | tail -1 | awk '{print $NF}')
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - LAST_UPDATE))
  
  if [ $ELAPSED -gt $((THRESHOLD_MIN * 60)) ]; then
    echo "⚠️ ALERT: $PROJECT 1분 이상 업데이트 없음 (경과 ${ELAPSED}초)"
    # Secretary AI에게 알림 발송
    POST /api/alerts/escalate PROJECT="$PROJECT" ELAPSED="$ELAPSED"
  fi
done
```

#### 자동 대응 로직 (Secretary AI)

```
1분 이상 지연 감지
  ↓
자동 알림 발송 (Telegram)
  ↓
5분 내 원인분석:
  ├─ 기술적 차단? → DevOps 또는 팀리더 호출
  ├─ 자원 부족? → 우선순위 조정 + 리소스 이동
  └─ 순수 진도 지연? → 다음 체크포인트까지 모니터링
  ↓
10분 내 대응 계획:
  ├─ 재계획 실행 (스케줄 당겨오기)
  ├─ CTB 즉시 갱신
  └─ CEO 보고 (필요시)
```

---

### 위험도 색상 지표 (Status Indicators)

```
🟢 Green (안전)
  ├─ 진도 100% (또는 예정보다 앞서감)
  ├─ 블로킹 없음
  └─ ETA 변경 없음

🟡 Yellow (주의)
  ├─ 진도 70~99%
  ├─ 경미한 블로킹 (<2시간)
  └─ ETA 변경 가능성 (±1일)

🔴 Red (긴급)
  ├─ 진도 <70%
  ├─ 심각한 블로킹 (>2시간)
  └─ ETA 변경 확정 (>1일)
```

**CTB 실시간 예시:**
```
✅ Discord-P1           🟢 완료
✅ Team Dashboard-P1    🟢 완료
✅ Team Dashboard-P2B   🟢 완료
✅ BM-P1                🟢 완료
🟡 Asset Master-P2      🟡 진행중 (API 100%, UI 70%, ETA +1일 가능)
🟡 Backup-P2           🟡 진행중 (30%, ETA 6/5 유지)
🟡 Travel-P2           🟡 진행중 (70%, ETA 6/2 유지)
🟡 Harness-ENG-P2      🟡 준비중 (설계완료, UI 6/1 시작예정)
```

---

## 섹션 8: 완료 기준 (Completion Criteria)

### 설계 단계 (Design Phase) ✅ 7/7 완료

- [x] **8개 프로젝트 포트폴리오 매핑** — 모든 프로젝트 식별, 의존도 매핑
- [x] **데이터베이스 의존도 정의** — db/29-42 순서 확정, 각 프로젝트별 필수 마이그레이션 식별
- [x] **API 의존도 체인 분석** — Asset Master-P2 → Harness-ENG-P2 순차 명확화, 나머지 병렬
- [x] **배포 순서 계획** — Vercel/Supabase 배포 시퀀싱, 병렬화 최대값 확정
- [x] **핵심경로 및 여유 분석** — 최장경로 = Asset Master→Harness (16일), 여유시간 산출
- [x] **위험 평가 및 완화 전략** — 17개 위험 식별 + 완화 전략 기술
- [x] **모니터링 시스템 설계** — 4회 체크포인트 + 자동 1분 추적 시스템 스펙

### 구현 단계 (Implementation Phase) 🟡 0/5 진행중

- [ ] **모니터링 시스템 배포** — 1분 추적 cron + Secretary 자동 알림 (예정: 5/29)
- [ ] **CTB 자동 갱신 로직** — 08/14/15/18:00 KST 체크포인트 활성화 (예정: 5/30)
- [ ] **팀원 배치 및 온보딩** — Phase A (5/26-5/28) 완료 + Phase B (5/29-6/02) 진행 (예정: 6/02)
- [ ] **일일 1분 지연 추적** — 핵심경로 프로젝트 모니터링 시작 (예정: 5/29)
- [ ] **최종 ETA 검증** — 2026-06-02 18:00 기준으로 모든 프로젝트 완료 확인 (예정: 6/02)

---

## 결론 및 다음 단계

이 문서는 **설계 완료** 상태입니다. 다음 단계:

1. **CEO (김경태) 검증** — 의존도 매핑, 핵심경로 분석, 위험 평가 승인 (예정: 5/28)
2. **TEAM_CAPACITY_PLAN_15PERSON.md 작성** — 팀 배치 및 주간 목표 정의 (예정: 5/29)
3. **DEPENDENCY_MAPPER.md 작성** — 시각화 의존도 매트릭스 (예정: 5/29)
4. **구현 단계 시작** — 모니터링 시스템 배포 (예정: 5/30)
5. **Phase A/B/C 팀원 온보딩 실행** — 병렬 프로젝트 활성화 (예정: 5/26~6/10)

**최종 ETA:** 2026-06-02 18:00 KST (8개 프로젝트 설계 + 4개 프로젝트 구현 완료)  
**팀 활용률:** 40% → 93.3% (2026-06-10 달성)

---

**마지막 갱신:** 2026-05-28 (설계 완료)  
**작성자:** Project Planner AI Agent  
**상태:** ✅ 설계 완료, 🟡 구현 준비

