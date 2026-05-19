---
name: JEEPNEY Personal Backup App Phase 1 설계
description: 개인 이력 관리 (회사/프로젝트/성과/타임라인) UI 프레임워크
type: project
relatedFiles: JEEPNEY_BACKUP_APP_PHASE1_DESIGN.md
---

# JEEPNEY Personal Backup App Phase 1 설계

**상태:** 최종 설계 (구현 준비 완료)  
**작성일:** 2026-05-13  
**담당:** 플레너 (설계), 웹개발자 (구현), 평가자 (검증)

## 프로젝트 개요

**JEEPNEY:** "전 생활을 한곳에" — 개인 + 업무 통합 포탈

### Phase 1 목표

**🎯 Core Objective:**  
사용자의 개인 이력(경력, 프로젝트, 성과)을 시각적으로 관리하고 타임라인으로 표현하는 기초 플랫폼 구축

**📊 핵심 가치:**
- **통합성:** 경력, 프로젝트, 성과를 한곳에서 관리
- **시각화:** 타임라인 + 카드 기반 직관적 UI
- **확장성:** Phase 2-3에서 추가 기능 수용 가능
- **모바일 최적:** 인도 현장 접근 고려

## Phase 1 범위

### ✅ Phase 1 포함
- JEEPNEY 메인 홈 페이지 (/)
- 개인이력 Hub (/jeepney-personal)
- 회사 목록 + 상세 페이지
- 프로젝트 목록 + 상세 페이지
- 성과 목록 + 상세 페이지
- 타임라인 뷰
- 기본 UI 컴포넌트 라이브러리
- 설정 페이지 (기본)

### ❌ Phase 1 제외 (Phase 2+)
- 여행기록 (Travel Records) → Phase 4
- 소셜 공유 기능 → Phase 3
- 고급 검색/필터 → Phase 2
- 다국어 지원 → Phase 3
- 오프라인 모드 → Phase 5

## 기능 요구사항

### FR-001: 개인이력 조회
- **설명:** 사용자는 자신의 전체 경력, 프로젝트, 성과를 타임라인 또는 목록으로 볼 수 있어야 한다.
- **우선순위:** 🔴 **Critical**
- **수용 조건:**
  - Given: 사용자가 로그인함, When: `/jeepney-personal` 방문, Then: 타임라인 표시
  - Given: 타임라인이 표시됨, When: 항목 클릭, Then: 상세 정보 표시

### FR-002: 회사/프로젝트/성과 추가
- **설명:** 사용자는 새로운 회사, 프로젝트, 성과를 추가할 수 있어야 한다.
- **우선순위:** 🔴 **Critical**

### FR-003: 포트폴리오 공개
- **설명:** 사용자는 자신의 경력을 공개 포트폴리오로 설정할 수 있다.
- **우선순위:** 🟡 **High** (Phase 1은 설정만, 공개 페이지는 Phase 2)

## DB 스키마

### 3개 메인 테이블 (Phase 1)
1. **career_companies** — 회사 이력
2. **career_projects** — 프로젝트
3. **career_achievements** — 성과

각 테이블:
- user_id (RLS로 본인만 접근)
- company_id, project_id (FK 연결)
- 타이밍 필드 (start_date, end_date)
- is_public (포트폴리오 공개 여부)
- sort_order (표시 순서)

## UI/UX 설계

### 레이아웃
- **BottomNav 추가:** JEEPNEY 메인 메뉴에 "개인" 탭 추가
- **색상 테마:** 기존 다크 테마 유지 (#0f172a, #1e293b)
- **카드형 UI:** 기존 FMS 스타일 일관성
- **모바일 퍼스트:** 최대 너비 480px

### 주요 페이지

**1. JEEPNEY 메인 (/)**
- 개인 소개 카드
- 최근 경력/프로젝트/성과 3개씩 미리보기
- "전체 보기" 버튼 → /jeepney-personal

**2. 개인이력 Hub (/jeepney-personal)**
- 탭 네비게이션: 타임라인 | 회사 | 프로젝트 | 성과
- 타임라인 뷰: 시간 순서로 모든 이벤트 표시
- 각 탭: 목록 + [추가] 버튼

**3. 회사 목록 (/jeepney-personal/companies)**
- 회사 카드 목록 (회사명, 직급, 기간, 로고)
- 현재 재직 회사는 상단 표시
- [+ 새 회사] 버튼 (Admin만)

**4. 회사 상세 (/jeepney-personal/companies/:id)**
- 회사 정보 (로고, 명칭, 위치, 산업, 직급)
- 해당 회사의 프로젝트 목록 표시
- [편집] [삭제] 버튼 (Owner만)

**5. 프로젝트 목록 (/jeepney-personal/projects)**
- 프로젝트 카드 (제목, 요약, 기간, 카테고리)
- 필터: 카테고리별, 기간별
- [+ 새 프로젝트] 버튼

**6. 성과 목록 (/jeepney-personal/achievements)**
- 성과 카드 (제목, KPI, 날짜)
- 필터: 카테고리별, KPI별

**7. 타임라인 뷰 (/jeepney-personal/timeline)**
- 회사 + 프로젝트 + 성과를 시간 순서로 표시
- 수직선 + 이벤트 카드
- 호버 시 상세 정보 팝업

## API 엔드포인트 (Phase 1)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/v1/jeepney/timeline | 타임라인 데이터 |
| GET | /api/v1/career/companies | 회사 목록 |
| POST | /api/v1/career/companies | 회사 추가 |
| GET | /api/v1/career/companies/:id | 회사 상세 |
| PATCH | /api/v1/career/companies/:id | 회사 수정 |
| DELETE | /api/v1/career/companies/:id | 회사 삭제 |
| GET | /api/v1/career/projects | 프로젝트 목록 |
| POST | /api/v1/career/projects | 프로젝트 추가 |
| GET | /api/v1/career/achievements | 성과 목록 |

## 컴포넌트 구현 계획

**신규 컴포넌트:**
- JeepneyHome — 메인 홈 페이지
- CareerHub — 개인이력 Hub 메인
- CompanyList, CompanyDetail, CompanyForm
- ProjectList, ProjectDetail, ProjectForm
- AchievementList, AchievementDetail, AchievementForm
- TimelineView — 타임라인 시각화 컴포넌트

## 개발 타임라인

1. **Week 1:** DB 스키마 + API 9개 엔드포인트
2. **Week 2:** UI 컴포넌트 + 메인 페이지
3. **Week 3:** 타임라인 뷰 + 테스트
4. **예상 완료:** 2026-05-31

## 검증 기준

**Evaluator 검증 항목:**
- [ ] 타임라인 표시 정확도
- [ ] 모바일 레이아웃 반응형
- [ ] 폼 입력 유효성 검사
- [ ] 삭제 확인 다이얼로그
- [ ] RLS 권한 검증
- [ ] 페이지 로딩 성능

## 상태
🟡 **설계 완료** → 웹개발자 구현 대기
