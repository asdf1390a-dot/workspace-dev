---
name: BM Breakdown Management Phase 1 상세 테스트 계획
description: 고장 관리 시스템 테스트 82개 케이스, 상태 머신 + 메트릭
type: qa-testplan
owner: QA Specialist
date: 2026-05-29
---

# BM Breakdown Management Phase 1 테스트 계획

**프로젝트:** BM Phase 1 (5개 테이블 + 15개 API)  
**기한:** 2026-06-02 18:00 KST  
**핵심 위험:** 상태 전이 오류, 데이터 불일치, 권한 누락  

---

## 1. Unit Tests (40개)

### 1.1 상태 머신 전이 (12개)
**유효한 전이 경로:**
- [ ] reported → acknowledged (보고 → 확인)
- [ ] acknowledged → in_progress (확인 → 진행)
- [ ] in_progress → resolved (진행 → 해결)
- [ ] resolved → closed (해결 → 종료)
- [ ] in_progress → escalated (진행 → 에스컬레이션)
- [ ] escalated → in_progress (에스컬레이션 → 진행)

**무효한 전이 (거부 필요):**
- [ ] reported → resolved (중간 상태 건너뛰기)
- [ ] closed → in_progress (종료된 건 재활성화 불가)
- [ ] resolved → reported (역방향 금지)
- [ ] unknown_status → acknowledged (존재하지 않는 상태)
- [ ] null → acknowledged (null 상태 처리)
- [ ] acknowledged → acknowledged (같은 상태 유지)

### 1.2 심각도 자동 계산 (8개)
- [ ] 고장 시간 ≤1시간 → minor
- [ ] 고장 시간 1-4시간 → normal
- [ ] 고장 시간 4-8시간 → major
- [ ] 고장 시간 >8시간 → line_down
- [ ] 자동 계산: reported_at → current_time 기반
- [ ] 수동 override 가능
- [ ] 심각도 변경 이력 추적
- [ ] 이상치 처리 (미래 시간)

### 1.3 근본 원인 분류 (8개)
- [ ] mechanical, electrical, hydraulic, software, operator_error, unknown (6개)
- [ ] 분류 자동화 (텍스트 키워드)
- [ ] 다중 분류 가능
- [ ] 분류 선택 필수 (null 거부)

### 1.4 메트릭 집계 (8개)
- [ ] MTTR 계산: Σ(resolved_at - started_at) / count
- [ ] MTBF 계산: Σ(reported_at 간격) / count
- [ ] 해결률: resolved_count / total_count
- [ ] 월간 집계 (2026-05-01 ~ 05-31)
- [ ] 분기 집계 (Q2)
- [ ] 심각도별 분포
- [ ] 카테고리별 분포
- [ ] 추세 분석 (이전월 대비)

### 1.5 권한 & 필터링 (4개)
- [ ] 생성자만 상세 조회 가능
- [ ] 관리자는 모든 고장 조회
- [ ] 기술자는 할당된 고장만 수정
- [ ] 감사자는 읽기만 가능

---

## 2. Integration Tests (30개)

### 2.1 API Endpoints (15개) — 각 1개 TC
| API | 메서드 | 테스트 포인트 |
|-----|--------|-------------|
| POST /api/breakdowns | POST | 고장 보고 생성 + 기본값 설정 |
| GET /api/breakdowns | GET | 목록 조회 + 필터링 (상태, 심각도) |
| GET /api/breakdowns/:id | GET | 상세 조회 + RLS 검증 |
| PUT /api/breakdowns/:id | PUT | 상태 전이 + 메타데이터 업데이트 |
| POST /api/breakdowns/:id/acknowledge | POST | 상태 → acknowledged |
| POST /api/breakdowns/:id/start | POST | 상태 → in_progress + started_at |
| POST /api/breakdowns/:id/resolve | POST | 상태 → resolved + resolved_at |
| POST /api/breakdowns/:id/close | POST | 상태 → closed |
| POST /api/breakdowns/:id/escalate | POST | 에스컬레이션 + 알림 전송 |
| GET /api/breakdowns/metrics/monthly | GET | 월간 통계 (심각도, 카테고리) |
| GET /api/breakdowns/metrics/quarterly | GET | 분기 통계 |
| DELETE /api/breakdowns/:id | DELETE | 하드 삭제 (관리자만) |
| POST /api/breakdowns/:id/assign | POST | 기술자 할당 |
| POST /api/root-causes | POST | 근본 원인 등록 |
| GET /api/corrective-actions | GET | 시정 조치 목록 |

### 2.2 RLS 정책 (5개)
- [ ] `select` policy: auth.uid()가 created_by 또는 관리자만
- [ ] `insert` policy: auth.uid()가 created_by로 자동 설정
- [ ] `update` policy: assigned_to or 관리자만 수정 가능
- [ ] 테스트 사용자 A (기술자) → 자신의 고장만 조회
- [ ] 테스트 사용자 B (관리자) → 모든 고장 조회

### 2.3 데이터 원자성 (5개)
- [ ] 고장 생성 → 자동으로 created_at, created_by 설정
- [ ] 상태 변경 → 함께 updated_at, updated_by 갱신
- [ ] 동시성: 10개 병렬 상태 전이 → 순서 유지
- [ ] 트랜잭션: 상태 전이 실패 → 롤백 (이전 상태 유지)
- [ ] 이력 추적: 모든 상태 변경 → breakdown_history에 기록

### 2.4 에러 처리 (5개)
- [ ] 잘못된 상태 전이 → 400 Bad Request
- [ ] 존재하지 않는 ID → 404 Not Found
- [ ] 권한 없음 → 403 Forbidden
- [ ] 필수 필드 누락 (description) → 400 Bad Request
- [ ] 서버 오류 시뮬레이션 → 500 Internal Server Error

---

## 3. E2E Tests (12개) — 3회 반복

### 3.1 Happy Path (3회 반복)
**Iteration 1: 정상 흐름**
- [ ] 1회차: 고장 보고 (description_en, description_ta)
- [ ] 1회차: 승인 (acknowledged)
- [ ] 1회차: 기술자 할당
- [ ] 1회차: 조치 시작 (in_progress)
- [ ] 1회차: 조치 완료 (resolved)
- [ ] 1회차: 월간 통계에 반영 확인

**Iteration 2: 다른 자산 + 팀**
- [ ] 2회차: 다른 자산의 고장 보고
- [ ] 2회차: 다른 기술자 할당
- [ ] 2회차: 동일 흐름 진행
- [ ] 2회차: 통계 누적 확인

**Iteration 3: 반복 검증**
- [ ] 3회차: 전체 흐름 재실행
- [ ] 3회차: 데이터 중복 없음 확인
- [ ] 3회차: 최종 승인

### 3.2 Escalation Flow (1회)
- [ ] 고장 보고 → acknowledged → in_progress → escalated
- [ ] 에스컬레이션 알림 관리자에게 전송 (Telegram/Discord)
- [ ] 관리자 승인 후 → in_progress로 복귀
- [ ] 이력에 escalated 기록

### 3.3 Multi-Cause (1회)
- [ ] 고장 보고 (mechanical 선택)
- [ ] 조사 후 mechanical + electrical 추가 (multi-select)
- [ ] 근본 원인 모두 저장
- [ ] 메트릭에 모두 반영

### 3.4 Status Transition Edge Cases (1회)
- [ ] in_progress 상태에서 다시 in_progress 전이 시도 → 거부
- [ ] closed 고장 수정 시도 → 403 Forbidden
- [ ] 미래 시간으로 started_at 설정 → 자동 수정 또는 거부

### 3.5 Mobile Fast Report (1회)
- [ ] 모바일 앱에서 QR 스캔 (asset_id)
- [ ] 빠른 보고 폼 (자산명 자동 입력)
- [ ] description_ta (타밀어) 입력
- [ ] 1초 내 제출 확인

### 3.6 Monthly Statistics (1회)
- [ ] 2026-05-01~31 기간 고장 조회
- [ ] 심각도 분포 확인 (minor 3개, normal 7개, major 7개, line_down 3개)
- [ ] 카테고리 분포 확인
- [ ] 평균 MTTR, MTBF 계산 정확성
- [ ] 차트 시각화 (bar chart, pie chart)

### 3.7 Permission Boundary (1회)
- [ ] 기술자 A: 자신의 고장만 수정 가능
- [ ] 기술자 A: 다른 기술자의 고장 수정 불가 (403)
- [ ] 관리자: 모든 고장 수정 가능
- [ ] 감사자: 읽기만 가능, 수정 불가

---

## 4. 성능 & 접근성

### 4.1 성능
- [ ] GET /api/breakdowns (전체, 500개): <200ms
- [ ] 월간 통계 계산 (1000개 데이터): <500ms
- [ ] 상태 전이 API: <100ms
- [ ] 메모리 사용량: <200MB (안정 상태)

### 4.2 접근성
- [ ] WCAG 2.1 AA 준수 (폼, 테이블, 차트)
- [ ] 상태 선택 라디오 버튼 (명확한 레이블)
- [ ] 심각도 색상 + 텍스트 (색상만으로 구분 안 함)
- [ ] 스크린 리더 지원 (Lighthouse axe-core)

---

## 5. 테스트 데이터 준비

### 5.1 Mock Breakdowns (20개)
- 상태별: reported 5개, acknowledged 3개, in_progress 5개, resolved 6개, closed 1개
- 심각도별: minor 3개, normal 7개, major 7개, line_down 3개
- 카테고리별: mechanical 4개, electrical 4개, hydraulic 3개, software 3개, operator_error 2개, unknown 1개
- 날짜범위: 2026-03-01 ~ 2026-05-29

### 5.2 Test Users
- Admin: user_id_admin (모든 권한)
- Technician A: user_id_tech_a (자신의 고장만)
- Technician B: user_id_tech_b (자신의 고장만)
- Auditor: user_id_audit (읽기만)

---

## 6. 실패 기준 (No-Go)

| 항목 | 임계값 |
|------|--------|
| Unit Test Pass Rate | <95% |
| Integration Test Pass Rate | <90% |
| E2E 3회 반복 통과 | 모두 통과 필수 |
| 상태 전이 오류 | 1개 초과 시 fail |
| RLS 정책 위반 | 1개 초과 시 fail |
| 데이터 손실 | 0개 초과 시 fail |

---

## 7. 서명 및 승인

- **테스트 작성:** QA Specialist (2026-05-29)
- **개발팀 검토:** Web-Builder (예정)
- **최종 승인:** Evaluator (2026-06-02 18:00)

**상태:** 🟡 진행 예정 (2026-05-31 09:00)
