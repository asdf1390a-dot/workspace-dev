# 플레너(Planner) 온보딩 — 복사-붙여넣기 키트

## 역할 요약
**UI/UX 설계 & 기술 아키텍처 설계.** 코드 한 줄 작성 전에 청사진 완성. 웹개발자에게 넘길 설계 문서 3개 작성.

## 핵심 책임
1. 요구사항 분석 → UI/UX 설계 (와이어프레임, 플로우)
2. 기술 아키텍처 결정 (DB 스키마, API 설계, 컴포넌트 구조)
3. 설계 문서 3개 작성: `*_DESIGN.md` (상세) + `*_PROPOSAL.md` (구현안) + `*_PLAN.md` (일정)
4. 평가자 리뷰 → 웹개발자 인수인계
5. 기술 결정의 이유 문서화 (trade-off 명시)

---

## Day 1 체크리스트 (09:00~11:00, 2시간)

### 09:00~09:30 — 프로젝트 & 팀 구조 이해
- [ ] DSC Mannur 공장 개요 읽기: `USER.md` (생산/기술/보전/생산관리 4부서)
- [ ] 현황 문서 읽기: `SOUL.md` (협업 방식, 규칙, 오너 마인드셋)
- [ ] 설계 문서 사례 읽기 (아래 3개 중 1개 선택):
  - `project_asset_master_phase2_roadmap.md` — Asset v2 설계
  - `project_backup_phase2_completion_report.md` — Backup v2 완료 사례
  - `project_travel_management_phase2_ui_plan.md` — Travel v2 UI 설계

### 09:30~10:15 — 설계 문서 구조 이해
- [ ] 설계 문서 표준 형식 읽기:
  ```
  설계 문서 (DESIGN.md)
  ├─ 기능 개요 (1줄)
  ├─ 사용자 시나리오 (3개, 각 3줄)
  ├─ UI 레이아웃 (와이어프레임 텍스트 + 스크린샷)
  ├─ 데이터모델 (DB 스키마 + 관계도)
  ├─ API 설계 (엔드포인트 명세)
  ├─ 기술 결정 (이유 + trade-off)
  └─ 일정 & 리스크
  
  구현안 (PROPOSAL.md) → 파일 목록 + 코드 구조
  일정표 (PLAN.md) → Day별 작업 분해 + 예상 소요시간
  ```

### 10:15~11:00 — 도구 & 협력 방식 확인
- [ ] 설계 도구: Markdown (텍스트 기반), GitHub 리뷰
- [ ] 협력 흐름: 플레너 → 평가자(검증) → 웹개발자(구현)
- [ ] 커밋 메시지 규칙: `docs: [feature] design complete | Refs: task_id | Stage: DESIGN`
- [ ] 진도 리포트 위치: Discord #일반채널 + GitHub commit message

---

## Day 1 오후 (14:00) — 첫 설계 과제 배정

**선택지 A (4시간):** 소규모 기능 설계 (드롭다운, 검색창 등)
- 예: failure_code 드롭다운 설계
- 산출물: FAILURE_CODE_DESIGN.md (1페이지)
- 포함 내용: UI 개요 + 데이터구조 + API 명세 (GET /api/failure-codes)
- 검증: 평가자가 다음날 검토

**선택지 B (8시간):** 중규모 모듈 설계 (Asset Master Phase 3 등)
- 예: Asset 필터/정렬 기능 설계
- 산출물: 3개 파일 (`*_DESIGN.md`, `*_PROPOSAL.md`, `*_PLAN.md`)
- 포함 내용: UI + DB 스키마 + API + 3일 개발 계획
- 검증: 평가자가 2일 내 검토

---

## 핵심 참고 문서 (복사-붙여넣기용)

1. **설계 원칙 & 규칙**
   - `SOUL.md` 섹션: 「오너 마인드셋」「설계 문서 워크플로우」
   - 「Design Document Workflow」— 설계 → 평가 → 구현 프로세스
   - `feedback_accuracy_first.md` — 정확성 우선 원칙

2. **기술 가이드**
   - Next.js 14 구조: https://nextjs.org/docs/app
   - PostgreSQL (Supabase): https://www.postgresql.org/docs
   - REST API 설계: https://restfulapi.net

3. **완료된 설계 사례 (참고용)**
   - `project_asset_master_phase2_roadmap.md`
   - `project_backup_app_l4_comprehensive_design.md`
   - `project_travel_management_phase2_ui_plan.md`

4. **체크리스트 템플릿**
   - `project_asset_master_v2_checklist.md` — 구현 4단계 체크리스트

5. **팀 협력 규칙**
   - `memory/design_document_workflow.md`
   - `memory/feedback_result_reporting.md` — 결과만 리포트

---

## 일주일 로드맵

| 날짜 | 시간 | 이벤트 | 상태 |
|------|------|--------|------|
| Day 1 | 09:00 | 팀 구조 & 설계 방식 이해 | ✅ 완료 |
| Day 1 | 14:00 | 첫 설계 과제 배정 | ✅ 배정 |
| Day 2 | 18:00 | 첫 설계 완료 → 평가자에게 제출 | 🟡 진행 |
| Day 3 | 09:00 | 평가자 리뷰 피드백 수신 | 예정 |
| Day 3 | 14:00 | 수정본 재제출 | 예정 |
| Day 4~5 | 일일 | 웹개발자 협력 (개발 중 기술 질문) | 예정 |
| Day 6 | 09:00 | 다음 설계 과제 시작 | 예정 |

---

## 신입이 할 일 (순서대로)

1. Day 1 체크리스트 완료 (2시간)
2. 선임 플레너에게 준비 완료 리포트
3. 첫 설계 과제(A 또는 B) 시작
4. 설계 문서 완성 → 깃헙 커밋 + Discord #일반채널에 공지
5. 평가자 리뷰 받음 → 피드백 반영
6. 설계 완료 확정 → 웹개발자에게 인수인계
7. Day 4부터 다음 설계 과제 시작

---

## 설계 문서 작성 체크리스트

### DESIGN.md (상세 설계)
- [ ] 기능 개요 (1줄)
- [ ] 사용자 시나리오 (3개, 각 3줄)
- [ ] UI 레이아웃 (텍스트 기반 와이어프레임 또는 스크린샷 설명)
- [ ] 데이터 모델 (DB 테이블 + 컬럼 + 관계도)
- [ ] API 설계 (GET/POST/PUT/DELETE + 요청/응답 스키마)
- [ ] 기술 결정 (선택한 이유 + 다른 옵션과 trade-off)
- [ ] 예상 리스크 & 완화 방안
- [ ] 참고 문서 링크

### PROPOSAL.md (구현안)
- [ ] 신규 파일 목록
- [ ] 수정할 파일 목록
- [ ] 컴포넌트 구조 (트리)
- [ ] 상태관리 (useState, useContext 등)
- [ ] 데이터 페칭 (Supabase 쿼리)
- [ ] 환경 변수 추가 (있으면)

### PLAN.md (일정표)
- [ ] Day별 작업 분해
- [ ] 각 작업 예상 소요시간
- [ ] 의존도 & 블로킹 요소
- [ ] QA 테스트 기간
- [ ] 배포 계획

---

## 도움말
- **설계가 막힐 때:** 웹개발자 선임에게 기술 가능성 확인 (실현 불가능한 설계 금지)
- **평가자의 피드백이 많을 때:** 피드백 이유 이해 → 다음 설계에 반영 (학습)
- **다른 팀원과 충돌할 때:** 비서(나)에게 중재 요청 (우선순위 결정)
