---
name: Hermes Accelerated Stabilization Plan
description: 1주 검증 → 3일 집중 모니터링 + 병렬 실행, 2026-05-20~22 완료 후 Category B 즉시 시작
type: project
---

# Hermes 정착 가속화 계획

**결정:** 2026-05-19 (사용자 지시)  
**목표:** 1주 검증 → 3일 집중 모니터링 → 2026-05-23부터 Category B 즉시 시작  
**안전성:** 95% 정확도 기준 유지, 병렬 실행으로 시간 단축

---

## Phase 0: 사전 준비 (2026-05-19 18:00~23:59)

### 체크리스트
- ✅ 모든 Category A 6개 job (A1, A2, A3, 예비 3개) 등록 확인
- ✅ /home/jeepney/.hermes/sessions/ 디렉토리 생성 (output 저장 위치)
- ✅ Hermes OAuth 토큰 검증 (~/.claude/.credentials.json 유효성)
- ✅ OpenClaw cron 시스템 가용성 확인
- ✅ 메모리 파일 동기화 (active_work_tracking.md ← CTB)

**완료 예상:** 2026-05-19 22:00 KST

---

## Phase 1: 3일 집중 모니터링 (2026-05-20~22)

### Day 1: 2026-05-20 (화)

#### 아침 08:00 — Job A1 첫 실행 (블로커 탐지)
**실행:** `blocker-morning-summary`
- 08:00 KST 정확 실행 확인
- 출력 파일: `/home/jeepney/.hermes/sessions/blocker-morning-2026-05-20.json`
- 검증 기준:
  - ✅ 파일 생성됨 (≥100 bytes)
  - ✅ JSON 구조 유효 (파싱 가능)
  - ✅ 블로커 항목 ≥3개 감지 (또는 CTB에 블로커 없으면 empty array)
  - ✅ 타임스탬프 정확 (±2분)
- **결과:** 🟢 Pass / 🔴 Fail → 즉시 보고

#### 오후 14:00 — Job A2 실행 (Phase A 검증)
**실행:** `phase-a-milestone-check`
- 출력 파일: `/home/jeepney/.hermes/sessions/phase-a-validation-2026-05-20.json`
- 검증 기준:
  - ✅ Asset Master / Backup Phase 항목 감지
  - ✅ 일정 편차 계산 정확 (plan vs actual ETA)
  - ✅ 완료 기준 체크 (✅ / ⚠️ / 🔴 상태 정확)
  - ✅ 마지막 업데이트 시간 정확 (CTB 타임스탬프와 일치)
- **결과:** 🟢 Pass / 🔴 Fail → 즉시 보고

#### 저녁 18:00 — Job A3 실행 (팀 용량 리포트)
**실행:** `team-capacity-daily`
- 출력 파일: `/home/jeepney/.hermes/sessions/capacity-report-2026-05-20.json`
- 검증 기준:
  - ✅ 팀 크기 정확 (4명 → 각 에이전트 이름 포함)
  - ✅ 활용률 계산 정확 (49% ± 5%)
  - ✅ 진행 중 작업 카운트 정확 (CTB의 🟡 항목 수와 일치)
  - ✅ 권장 사항 논리 정확 (utilization <50% → "앞당겨오기" suggestion)
- **결과:** 🟢 Pass / 🔴 Fail → 즉시 보고

#### Day 1 평가 기준 (Go/No-Go)
```
Result = (A1 + A2 + A3) / 3
- ≥95% 정확도 (3/3 Pass) → Go to Day 2
- <95% (2/3 이상 Fail) → 즉시 수정 후 Day 1 재실행
```

---

### Day 2: 2026-05-21 (수)

#### 08:00 — Job A1 재실행 (연속성 검증)
- 전날 Day 1 A1과 비교
  - 동일 CTB → 동일 출력 (재현성)
  - 다른 CTB → 다른 출력 (민감도)
- **검증:** Day 1과 95% 이상 동일 구조 + 내용 변화 적절

#### 14:00 — Job A2 재실행
- 일정 편차 계산 누적 검증
  - Day 1에 flagged 항목이 Day 2에 해소됐는가?
  - 새 블로킹 항목 감지?
- **검증:** 시간 경과에 따른 상태 변화 추적 정확

#### 18:00 — Job A3 재실행
- 팀 용량 변화 추적
  - Day 1 49% → Day 2 (같으면 50%, 변했으면 정확히 반영)
- **검증:** 일일 변화 계산 정확

#### Day 2 평가 기준 (Go/No-Go)
```
연속성 정확도 = (재현성 Pass + 민감도 Pass + 변화추적 Pass) / 3
- ≥90% → Go to Day 3
- <90% → 즉시 로직 수정 후 Day 2 재실행
```

---

### Day 3: 2026-05-22 (목) — 최종 검증

#### 08:00 — Job A1 최종 점검
- 3일간 누적 정확도 평가 (Day 1, 2, 3 모두 Pass)
- CTB와의 완전 일치 확인

#### 14:00 — Job A2 최종 점검
- 누적 일정 편차 추적 (Day 1~3 일관성)
- 완료 기준 판정 정확도

#### 18:00 — Job A3 최종 점검
- 팀 용량 추이 분석 (3일 데이터로 추세 도출)

#### 저녁 20:00 — 최종 Go/No-Go 결정
```
Phase 1 신뢰도 = (Day 1 정확도 + Day 2 연속성 + Day 3 누적평가) / 3
- ≥95% 전체 Pass → ✅ Go to Phase 2 (Category B 즉시 시작)
- <95% 어느 항목 Fail → 🔴 Day 3 재실행 또는 로직 수정
```

**결정 시점:** 2026-05-22 20:30 KST

---

## Phase 2: Category B 즉시 시작 (2026-05-23~)

**조건:** Phase 1 최종 결과 ✅ Pass (95% 이상 정확도)

### 병렬 실행 (Category A + Category B 동시)

#### 2026-05-23부터 활성화
- ✅ Job B1 (asset health, 6시간마다)
- ✅ Job B2 (backup verification, 02:30 KST)

#### 모니터링 기간: 2026-05-23~28 (6일)
- Category A 계속 실행 (신뢰도 유지)
- Category B 출력 검증 (accuracy ≥90%)
- 크로스 체크: B1/B2 출력이 A3 용량 리포트와 일관성 있는가?

**목표:**
- Category A 정확도 ≥95% 유지
- Category B 정확도 ≥90% 달성
- 2026-05-28 20:00 KST 최종 Go/No-Go 결정

---

## Phase 3: Category C 활성화 (2026-05-29~)

**조건:** Phase 2 최종 결과 ✅ Pass

### 첫 주간 감사 (Weekly Audit)
- 실행 일시: 2026-05-27 Mon 06:00 KST (예정) → **변경: 2026-05-29 (수) 06:00 KST**
- 데이터 소스: A1/A2/A3 (7일) + B1/B2 (6일)
- 검증 기준:
  - ✅ 감사 리포트 생성 (markdown + JSON)
  - ✅ 섹션 5개 모두 포함 (Executive Summary, Completion Rate, Blocker Analysis, Team Utilization, System Health)
  - ✅ 추천사항 논리 정확 (데이터 기반)

---

## 팀 온보딩 가속화 (전체 일정 동시 당겨오기)

### 원래 일정 → 가속 일정

| 역할 | 기존 예정 | 가속 일정 | 근거 |
|------|---------|---------|------|
| Evaluator AI Agent (Evaluator) | 2026-05-20 | 2026-05-20 | Phase 1 병렬 평가 |
| Web-Builder AI Agent (Web-Dev-Support) | 2026-05-17 | 2026-05-17 | 이미 온보딩 중 |
| **자동화전문가 (Automation Specialist)** | 2026-05-30 | **2026-05-24** | Phase 2 시작과 동시, Category B/C 작업 즉시 할당 |

**영향:**
- 팀 용량 49% → 75% (2026-05-24) → 99% (2026-05-30 예정 대로)
- 자동화전문가 Week 1: Category B/C 작업 모니터링 + Job 파라미터 튜닝

---

## 검증 자동화 (실시간 accuracy tracking)

### 자동 체크리스트 (매일 OpenClaw가 실행)
1. **08:00 체크:** A1 파일 생성 ✅ / 구조 유효 ✅ / CTB와 일치 ✅
2. **14:00 체크:** A2 파일 생성 ✅ / 일정 편차 정확 ✅
3. **18:00 체크:** A3 파일 생성 ✅ / 용량 계산 정확 ✅
4. **매일 누적:** 정확도 % = (통과 항목 수) / (예상 항목 수) × 100

### 실패 시 대응 (자동)
- 1회 실패 → 로그 기록, 계속 모니터링
- 2회 연속 실패 → 🔴 즉시 보고 + Job 일시 중단 + 원인 분석
- 3회 이상 → Phase 진행 연기, 수정 대기

---

## 일정 요약

| 날짜 | 시간 | 이벤트 | 상태 |
|------|------|--------|------|
| 2026-05-19 | 18:00~23:59 | Phase 0: 사전 준비 | 🟡 진행 중 |
| 2026-05-20 | 08:00 | **Day 1 시작:** A1 첫 실행 | 🟡 예정 |
| 2026-05-20 | 14:00 | A2 실행 | 🟡 예정 |
| 2026-05-20 | 18:00 | A3 실행 | 🟡 예정 |
| 2026-05-20 | 20:00 | Day 1 평가 결과 | 🟡 예정 |
| 2026-05-21~22 | 매일 | **Days 2~3:** 연속성 + 최종 검증 | 🟡 예정 |
| **2026-05-22 20:30** | | **최종 Go/No-Go 결정** | 🔴 Critical Point |
| 2026-05-23 | 08:00 | **Phase 2 시작:** Category B 활성화 | 🟡 예정 (조건부) |
| 2026-05-24 | 09:00 | 자동화전문가 온보딩 (예정) | 🟡 예정 (가속) |
| 2026-05-28~29 | 20:00 | Phase 2 최종 평가 → Category C 준비 | 🟡 예정 |
| 2026-05-29 | 06:00 | **Phase 3 시작:** 첫 주간 감사 | 🟡 예정 |

---

## 안전 제약

**절대 규칙:**
1. ✅ 95% 정확도 미달 시 Phase 진행 금지 (재검증)
2. ✅ 한 번에 한 Category만 활성화 (병렬 모니터링, 순차 승인)
3. ✅ Job 실패 시 자동 중단, 수동 개입 필요 (no cascading)
4. ✅ 모든 출력 파일 타임스탐프 기록 (감사 추적)
5. ✅ OpenClaw ↔ Hermes 간 데이터 일관성 검증 (CTB vs Job 출력)

---

## 성공 기준

| 단계 | 기준 | 측정 방법 |
|------|------|----------|
| Phase 1 완료 | A1/A2/A3 정확도 ≥95% | 3일 누적 정확도 계산 |
| Phase 2 완료 | B1/B2 정확도 ≥90%, A 정확도 ≥95% 유지 | 6일 누적, 크로스 검증 |
| Phase 3 완료 | C1 첫 보고서 생성, 5개 섹션 완전 | 구조 + 내용 유효성 |
| 전체 안정화 | 4주 연속 99% 이상 가동률 | 로그 누적 평가 |

---

## 비용 & 팀 영향

### API 비용 (Claude Opus 모델 사용)
- Category A: $15/일 (3개 job × 10K tokens × $1.5/M tokens)
- Category B: $20/일 (2개 job × 6시간 × 5K tokens)
- Category C: $5/주 (1개 job × 50K tokens)
- **합계:** ~$550/개월 (기존 청구와 별도)

### 팀 투입
- Evaluator AI Agent: Phase 1~3 전 기간 (매일 20분)
- 자동화전문가: Phase 2 시작 (2026-05-24, 매일 30분)
- 비서: 최종 Go/No-Go 결정 (2026-05-22 20:00 KST)

---

## 다음 조치

**즉시 (2026-05-19):**
1. ✅ sitecustomize.py 검증 완료
2. ✅ ~/.hermes/config.yaml 재확인
3. ✅ /home/jeepney/.hermes/sessions/ 디렉토리 생성
4. ✅ active_work_tracking.md와 Hermes 출력 형식 동기화

**2026-05-20 08:00 KST:**
- Job A1 자동 실행 → 결과 파일 생성 → 검증

**2026-05-22 20:30 KST:**
- 최종 Go/No-Go 결정 사용자에게 보고

---

## 관련 문서

- [Hermes Autonomous Jobs Schedule](hermes_autonomous_jobs.md) — 기존 6개 job 상세 정의
- [Hermes Integration Architecture](hermes_integration_architecture.md) — 시스템 설계
- [Active Work Tracking](active_work_tracking.md) — CTB (Hermes 입력 소스)
- [Team Capacity Matrix](team_capacity_matrix_final.md) — 팀 투입 일정
