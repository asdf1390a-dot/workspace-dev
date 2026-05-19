---
name: Career Workspace 모듈 설계
description: 개인 커리어 + 회사 이력 + 프로젝트 + 성과 관리 (JEEPNEY 통합)
type: project
relatedFiles: DESIGN_CAREER.md
---

# Career Workspace 모듈 설계

**작성일:** 2026-05-12  
**상태:** 설계 완료 → 웹개발자 개발 대기  
**대상:** DSC FMS Portal (Next.js 14 + Supabase)

## 설계 배경

FMS 포털은 공장 운영 도구이지만, 한국인 주재원은 개인 커리어 관리도 같은 플랫폼에서 하고 싶다. 공장에서 수행한 프로젝트·성과를 자동으로 포트폴리오로 전환할 수 있으면 이중 작업이 줄어든다.

## 설계 원칙

- **개인 데이터:** RLS로 본인만 R/W, 포트폴리오 공개 시에만 외부 열람 허용
- **멀티컴퍼니:** DSC Mannur가 첫 번째 회사, 이후 다른 회사도 추가 가능
- **FMS 연계:** BM 이력·프로젝트를 career 모듈에서 참조 가능 (느슨한 연결)
- **기존 스타일 유지:** 다크 테마(#0f172a), BottomNav, 카드형 UI
- **모바일 퍼스트:** 최대 너비 480px, 하단 고정 네비게이션

## DB 스키마 (파일: db/12_career_module.sql)

### 1. career_companies (회사 마스터)
```
id (uuid, pk)
user_id (uuid, FK: auth.users)
name (text) — 'DSC Mannur (P) Ltd.'
name_short (text) — 'DSC Mannur'
country (text, default 'India')
city (text) — 'Chennai'
industry (text) — 'Automotive Parts'
logo_url (text) — Supabase Storage URL

department (text) — '생산기술/보전'
title (text) — 'Assistant General Manager'
employment_type (enum: full_time|part_time|contract|internship|freelance)
start_date (date)
end_date (date, null = 현재 재직)
is_current (boolean)
is_public (boolean) — 포트폴리오 공개 여부

sort_order (int)
created_at, updated_at (timestamptz)
```

**인덱스:**
- career_companies_user_idx (user_id)
- career_companies_public_idx (user_id, is_public)

### 2. career_projects (프로젝트 이력)
```
id (uuid, pk)
user_id (uuid, FK: auth.users)
company_id (uuid, FK: career_companies)

title (text) — 'FMS 포털 구축'
summary (text) — 한 줄 요약
description (text) — 상세 설명 (Markdown 허용)
role (text) — '프로젝트 리더'

start_date (date)
end_date (date)
is_ongoing (boolean)

category (enum: improvement|cost_reduction|quality|safety|digital|automation|other)
tags (text[]) — ['Next.js','Supabase','생산관리']

kpi_label (text) — '비용 절감'
```

### 3. career_achievements (성과 기록)
```
id (uuid, pk)
user_id, company_id, project_id (FK 연결)
title, description, kpi_value, unit
date (date)
attachments (jsonb) — 파일/이미지 URL 배열
```

## UI 컴포넌트

**신규 페이지:**
- `/jeepney-personal` — 개인이력 Hub
- `/jeepney-personal/companies` — 회사 목록
- `/jeepney-personal/companies/:id` — 회사 상세
- `/jeepney-personal/projects` — 프로젝트 목록
- `/jeepney-personal/projects/:id` — 프로젝트 상세
- `/jeepney-personal/achievements` — 성과 목록
- `/jeepney-personal/timeline` — 타임라인 뷰

**신규 컴포넌트:**
- CareerTimeline — 타임라인 시각화
- CompanyCard, ProjectCard, AchievementCard
- CareerForm (회사/프로젝트/성과 입력)
- PortfolioPreview — 공개 포트폴리오 미리보기

## API 엔드포인트 (Phase 1)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/v1/career/companies | 회사 목록 |
| POST | /api/v1/career/companies | 회사 추가 |
| GET | /api/v1/career/companies/:id | 회사 상세 |
| PATCH | /api/v1/career/companies/:id | 회사 수정 |
| DELETE | /api/v1/career/companies/:id | 회사 삭제 |
| GET | /api/v1/career/projects | 프로젝트 목록 |
| POST | /api/v1/career/projects | 프로젝트 추가 |
| GET | /api/v1/career/timeline | 타임라인 데이터 (회사+프로젝트+성과) |

## 개발 순서

1. DB 마이그레이션 (career_companies, career_projects, career_achievements)
2. API 8개 엔드포인트
3. Career Hub 메인 페이지 + 네비게이션
4. 회사 목록/상세 페이지
5. 프로젝트 목록/상세 페이지
6. 타임라인 뷰
7. 성과 관리 (선택사항)
8. 포트폴리오 공개 설정
9. 테스트 & 배포

## 기대 효과

- 개인 커리어 + 업무 통합 플랫폼
- FMS 프로젝트를 자동으로 포트폴리오로 변환
- 경력 개발 자동 문서화
- 향후 Transfer 시 이력서 자동 생성 가능

## 상태
🟡 **설계 완료** → 웹개발자 개발 대기
