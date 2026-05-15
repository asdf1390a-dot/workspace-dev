# Team Dashboard — 설계 브리프

**담당:** planner  
**우선순위:** 🟡 HIGH  
**설계 완료 예상:** 2026-05-17 18:00 KST  
**개발 시작:** 2026-05-18  
**완료 예상:** 2026-05-31

---

## 목표

조직의 팀원 능력치, 조직도, 개선 액션을 시각화하고 실시간으로 추적할 수 있는 웹 대시보드 구현

**배포 대상:** JEEPNEY 앱 내부 → `/dashboard/team` 라우트

---

## 설계 범위

### 1. 조직도 시각화 (Organizational Hierarchy)
**요구사항:**
- 계층 구조 표시 (부서/팀/개인)
- 각 팀원 클릭 시 능력치 상세 보기
- 보직/역할 표시
- 조직 개편 시 실시간 업데이트

**참고 자료:**
- `team_org_chart.md` (이미 생성됨)
- Supabase `team_members` 테이블

**UI 스타일:** 트리 형식 또는 박스 다이어그램 (플래너 선택)

---

### 2. 팀원 능력치 대시보드 (Capability Dashboard)

#### 2.1 능력치 5가지 (Scoring Dimensions)
각 팀원당 주간 점수 (0~100):
1. **기술 역량** (Technical Competency) — 기술적 난제 해결, 신기술 습득
2. **달성률** (Task Achievement) — 일정 준수, 산출물 품질
3. **의사소통** (Communication) — 팀 협력, 문서화, 피드백 반응
4. **학습 속도** (Learning Speed) — 새로운 기술/프로세스 습득
5. **신뢰도** (Reliability) — 약속 이행, 일관성, 책임감

#### 2.2 주간 트렌드 차트
**요구사항:**
- 각 팀원별 5개 능력치 라인 차트 (주 단위 변화)
- 팀 평균선 오버레이
- 월별 비교 기능
- 최근 4주 데이터 표시

**기술:** Chart.js 또는 Recharts (플래너 선택)

#### 2.3 능력치 수정 권한
- **입력자:** 비서 (매주 수요일 자동)
- **검증:** 팀장 또는 관리자 확인
- **UI:** 관리자만 수정 가능한 모달

---

### 3. 개선 액션 플랜 추적 (Improvement Actions)

#### 3.1 구조
각 팀원당:
- **현재 액션:** 1~3개 활성 액션
- **상태:** Not Started → In Progress → Completed
- **우선순위:** High / Medium / Low
- **기한:** 목표 완료 날짜
- **진행률:** % 표시

#### 3.2 액션 유형
- **기술 개선:** 신기술 학습, 코드 리뷰 강화
- **프로세스 개선:** 문서화, 테스트 자동화
- **팀 협력:** 코칭, 멘토링 역할

#### 3.3 UI 요구사항
- 칸반 보드 형식 (Not Started | In Progress | Completed)
- 각 카드에 담당자, 우선순위, 기한, 진행률 표시
- 드래그 앤 드롭으로 상태 변경 가능

---

### 4. 팀 현황 스냅샷 (Team Overview)

#### 4.1 KPI 카드
- 팀원 수
- 평균 신뢰도 점수
- 진행 중인 액션 개수
- 이번 주 달성률 (%)

#### 4.2 최근 업데이트
- 어제 능력치 변화 요약
- 완료된 액션
- 주간 목표 진행도

---

## 데이터 모델

### Supabase 테이블 (설계 단계에서 확인)

**1. team_members** (이미 존재)
```
id (uuid)
name (string)
role (string)
department (string)
manager_id (uuid, FK to team_members)
created_at (timestamp)
```

**2. capability_scores** (신규 생성 필요)
```
id (uuid)
team_member_id (uuid, FK)
week (date)
technical_competency (0-100)
task_achievement (0-100)
communication (0-100)
learning_speed (0-100)
reliability (0-100)
avg_score (0-100, computed)
created_at (timestamp)
updated_by (uuid, FK to auth.users)
```

**3. improvement_actions** (신규 생성 필요)
```
id (uuid)
team_member_id (uuid, FK)
title (string)
description (text)
category (enum: technical, process, collaboration)
priority (enum: high, medium, low)
status (enum: not_started, in_progress, completed)
target_completion (date)
progress_percentage (0-100)
created_at (timestamp)
updated_at (timestamp)
```

**4. team_org_chart** (신규 또는 기존 활용)
```
id (uuid)
team_member_id (uuid, FK)
reports_to (uuid, FK to team_members.id)
sort_order (int)
```

---

## 설계 산출물 체크리스트

플래너는 다음 4가지 산출물을 생성해야 함:

- [ ] **1. TEAM_DASHBOARD_DESIGN.md** (~1000줄)
  - 상세 UI 스케치 (텍스트 형식)
  - 컴포넌트 구조 (React)
  - 상태 관리 (Context API / Zustand)
  - API 통합 계획

- [ ] **2. TEAM_DASHBOARD_API_GUIDE.md** (~400줄)
  - 필요한 API 엔드포인트 (GET/POST/PATCH)
  - 요청/응답 스키마
  - 실시간 업데이트 방식 (Supabase live subscription)

- [ ] **3. TEAM_DASHBOARD_DB_SCHEMA.sql**
  - capability_scores 테이블 정의
  - improvement_actions 테이블 정의
  - RLS 정책
  - 인덱스

- [ ] **4. TEAM_DASHBOARD_CHECKLIST.md** (~200줄)
  - 설계 검증 체크리스트
  - 개발자용 구현 순서
  - 테스트 시나리오

---

## 설계 고려사항

### 기술 선택
- **프론트엔드 프레임워크:** Next.js 14 (기존 JEEPNEY 스택)
- **차트 라이브러리:** Recharts 권장 (Vercel 진영, SSR 지원)
- **실시간 업데이트:** Supabase realtime subscription
- **상태 관리:** Context API (간단함) 또는 Zustand (복잡도 시 검토)

### 성능 고려사항
- 차트 데이터 캐싱 (주간 단위)
- 팀원 수가 많을 경우 페이지네이션
- 조직도 트리 렌더링 최적화 (가상화 고려)

### 보안
- 능력치 수정은 관리자만 (RLS 정책)
- 자신의 점수는 모든 팀원 조회 가능
- 다른 팀원의 상세 기록은 상급자만 접근

### 접근성
- 다크 모드 지원 (JEEPNEY 기존 스타일)
- 색상 대비 WCAG AA 준수
- 키보드 네비게이션 지원

---

## 개발 순서 (web-builder용)

플래너 설계 완료 후 web-builder는 다음 순서로 진행:

1. **DB 마이그레이션** (2026-05-18)
   - capability_scores, improvement_actions 테이블 생성
   - RLS 정책 설정

2. **API 엔드포인트** (2026-05-19 ~ 2026-05-20)
   - GET /api/dashboard/team/members
   - GET /api/dashboard/team/scores?week=2026-W20
   - GET /api/dashboard/team/actions
   - PATCH /api/dashboard/team/scores/:id
   - PATCH /api/dashboard/team/actions/:id

3. **UI 컴포넌트** (2026-05-21 ~ 2026-05-22)
   - OrgChart 컴포넌트
   - CapabilityChart 컴포넌트
   - ActionBoard 컴포넌트
   - TeamOverview 컴포넌트

4. **통합 & 테스트** (2026-05-23 ~ 2026-05-24)
   - 실시간 업데이트 검증
   - 반응형 디자인 검증
   - evaluator 피드백

---

## 참고 자료

- **팀 조직도:** `team_org_chart.md`
- **팀 능력치 매트릭스:** `team_skills_matrix.md`
- **JEEPNEY 기존 컴포넌트:** `/dsc-fms-portal/components`
- **기존 API 예시:** `/dsc-fms-portal/app/api`
- **Supabase 문서:** https://supabase.com/docs

---

## 완료 기준

✅ 설계 완료로 간주되는 기준:
1. 4가지 산출물 모두 생성됨
2. web-builder가 개발 시작 가능한 수준의 상세도
3. 평가자가 검증 계획 수립 가능
4. 팀 논의 항목 (기술 선택, 성능 고려사항) 완료

---

## 타임라인

| 날짜 | 작업 | 담당 | 완료 기준 |
|------|------|------|----------|
| 2026-05-16 | 설계 기초 (조직도, DB 스키마) | planner | 스키마 결정 |
| 2026-05-17 | UI 스케치, API 명세 | planner | 4가지 산출물 |
| 2026-05-18 | DB 마이그레이션 실행 | web-builder | capability_scores 테이블 |
| 2026-05-19~20 | API 구현 (5개 엔드포인트) | web-builder | API 테스트 완료 |
| 2026-05-21~22 | UI 컴포넌트 구현 | web-builder | 4개 컴포넌트 렌더링 |
| 2026-05-23~24 | 통합 & 테스트 | evaluator | 검증 리포트 |

---

**설계 시작:** 2026-05-16 09:00 KST  
**설계 완료 예상:** 2026-05-17 18:00 KST  
**비서:** C-3PO  
**생성:** 2026-05-15 23:00 KST
