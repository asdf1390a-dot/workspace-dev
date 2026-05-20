---
name: Team Dashboard 설계 브리프
description: 팀원 능력치 + 조직도 + 개선액션 추적 대시보드 (5가지 스코어링 + 칸반 보드 + KPI)
type: project
relatedFiles: TEAM_DASHBOARD_DESIGN_BRIEF.md
---

# Team Dashboard — 설계 브리프

**담당:** planner  
**우선순위:** 🟡 HIGH  
**설계 완료 예상:** 2026-05-17 18:00 KST  
**개발 시작:** 2026-05-18  
**완료 예상:** 2026-05-31

## 목표

조직의 팀원 능력치, 조직도, 개선 액션을 시각화하고 실시간으로 추적할 수 있는 웹 대시보드 구현

**배포 대상:** JEEPNEY 앱 내부 → `/dashboard/team` 라우트

## 설계 범위

### 1. 조직도 시각화 (Organizational Hierarchy)

**요구사항:**
- 계층 구조 표시 (부서/팀/개인)
- 각 팀원 클릭 시 능력치 상세 보기
- 보직/역할 표시
- 조직 개편 시 실시간 업데이트

**UI 스타일:** 트리 형식 또는 박스 다이어그램 (플래너 선택)

**데이터 소스:** Supabase `team_members` 테이블 (id, name, role, department, manager_id, created_at)

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

### 4. 팀 현황 스냅샷 (Team Overview)

#### 4.1 KPI 카드

- 팀원 수 (총계)
- 평균 신뢰도 점수 (0~100)
- 진행 중인 액션 개수
- 이번 주 달성률 (%)

#### 4.2 최근 업데이트

- 어제 능력치 변화 요약
- 완료된 액션
- 주간 목표 진행도

## 데이터 모델 (Supabase 테이블)

### 기존 테이블
**team_members** (이미 존재)
```
id (uuid, PK)
name (string)
role (string)
department (string)
manager_id (uuid, FK to team_members)
created_at (timestamp)
```

### 신규 생성 필요 테이블

**1. capability_scores** (주간 점수)
```
id (uuid, PK)
team_member_id (uuid, FK)
week (date, 월요일 기준)
technical_competency (0-100)
task_achievement (0-100)
communication (0-100)
learning_speed (0-100)
reliability (0-100)
created_at (timestamp)
updated_at (timestamp)
```

**2. improvement_actions** (개선 액션)
```
id (uuid, PK)
team_member_id (uuid, FK)
title (string)
description (text)
action_type (enum: technical|process|team_collaboration)
priority (enum: high|medium|low)
status (enum: not_started|in_progress|completed)
target_date (date)
completion_percentage (0-100)
created_at (timestamp)
updated_at (timestamp)
created_by (uuid, FK)
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/team/members | 팀원 목록 (조직도용) |
| GET | /api/team/members/:id | 팀원 상세 (능력치 포함) |
| GET | /api/team/capability-scores | 능력치 데이터 (기간 필터 가능) |
| POST | /api/team/capability-scores | 능력치 입력 (비서용) |
| PUT | /api/team/capability-scores/:id | 능력치 수정 (관리자용) |
| GET | /api/team/actions | 개선액션 목록 |
| POST | /api/team/actions | 액션 생성 |
| PUT | /api/team/actions/:id | 액션 수정 (상태, 진행률) |
| GET | /api/team/dashboard/overview | KPI 스냅샷 |

## UI 컴포넌트 (신규 8개)

1. **OrganizationChart** — 조직도 시각화
2. **CapabilityScoreChart** — 레이더 차트 (5개 능력치)
3. **TrendLineChart** — 라인 차트 (4주 트렌드)
4. **ImprovementActionKanban** — 칸반 보드
5. **ActionCard** — 액션 카드 (드래그 가능)
6. **TeamOverviewKPI** — 4개 KPI 카드
7. **CapabilityScoreModal** — 능력치 입력/수정 모달
8. **RecentUpdatesWidget** — 최근 변화 요약

## 개발 순서

1. 데이터 모델 설계 및 DB 마이그레이션
2. API 엔드포인트 구현 (8개)
3. UI 컴포넌트 개발 (8개)
4. 데이터 권한 설정 (RLS 정책)
5. 대시보드 통합 및 테스트
6. 배포 및 모니터링

## 설계 원칙

- **모바일 퍼스트:** 반응형 레이아웃
- **실시간 업데이트:** Supabase Realtime 활용
- **직관적 UI:** 색상으로 상태 표시 (초록 = 완료, 주황 = 진행중, 회색 = 대기)
- **접근성:** 키보드 네비게이션 + 스크린 리더 지원

## 상태
🟡 **설계 브리프 완성** → Planner AI Agent 상세 설계 대기
