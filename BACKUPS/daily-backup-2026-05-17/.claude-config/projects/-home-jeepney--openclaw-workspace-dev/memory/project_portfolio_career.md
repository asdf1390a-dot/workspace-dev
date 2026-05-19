---
name: Portfolio Career (경력 포트폴리오)
description: JEEPNEY DSC FMS Portal 내 사용자의 6년 경력 시각화 + 성과 대시보드
project: DSC FMS Portal
status: Ready for Implementation
created: 2026-05-15
updated: 2026-05-15 23:15
---

## 프로젝트 개요

**목표:** 사용자의 Chennai manufacturing plant 6년 경력(2019-2024)을 JEEPNEY Portal 내 Portfolio 섹션으로 구현

**핵심 지표 시각화:**
- 총 절감액: 325억 KRW (노무비 275억 + 설비 50억 + 가스 1.3억)
- 생산효율: 66% → 96% (30% 증가)
- LOSS 시간: 31.6% → 2.3% (93% 감소)
- 매출 배수: 1.0x → 2.8x (2.8배)
- 인원당 효율성: 1.0x → 1.8x (1.8배)

**기한:** 2026-05-17 ~ 2026-05-30 (14일)

---

## 산출물 (설계 완료)

### 1. PORTFOLIO_CAREER_DESIGN.md (520줄)
경로: `/home/jeepney/.openclaw/workspace-dev/PORTFOLIO_CAREER_DESIGN.md`
사본: `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/docs/PORTFOLIO_CAREER_DESIGN.md`

**12개 섹션:**
- Section 2-5: 5개 페이지 상세 와이어프레임
  * /career (메인 hero + 4 KPI 카드)
  * /career/dashboard (Recharts 4개 차트)
  * /career/achievements (5개 detail section + Before/After)
  * /career/timeline (2019-2024 timeline)
  * /career/projects (검색/필터 프로젝트 목록)
- Section 6: 컴포넌트 구조 (6개 신규 React 컴포넌트)
- Section 7: API 엔드포인트 + Supabase REST 쿼리
- Section 8: 엣지 케이스 (empty data, loading, errors, permissions)
- Section 9: 성능 최적화 (portfolio_kpi_timeline 사전 집계)
- Section 10: 웹개발자 6단계 구현 체크리스트

### 2. PORTFOLIO_CAREER_DB_SCHEMA.sql (240줄)
경로: `/home/jeepney/.openclaw/workspace-dev/PORTFOLIO_CAREER_DB_SCHEMA.sql`
사본: `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/db/30_portfolio_career.sql`

**신규 테이블:**
- `portfolio_kpi_timeline` — 연도별 KPI 집계 (사전 계산)
- `portfolio_images` — timeline 연도별 이미지

**기존 테이블 활용:**
- `career_companies` (user_id, company_id)
- `career_projects` (5개 프로젝트)
- `career_achievements` (10개 성과)

**RLS 정책:** 사용자 owner-only 접근

### 3. PORTFOLIO_CAREER_CHECKLIST.md (450줄)
경로: `/home/jeepney/.openclaw/workspace-dev/PORTFOLIO_CAREER_CHECKLIST.md`
사본: `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/docs/PORTFOLIO_CAREER_CHECKLIST.md`

**6단계 구현 + 준비 단계:**
- Phase 0: 준비 (2시간) — 설계 리뷰, 환경 설정
- Phase 1: DB 설정 (1일) — 테이블 생성, 샘플 데이터, RLS
- Phase 2: TypeScript 타입 (0.5일) — lib/career/types.ts
- Phase 3: 컴포넌트 개발 (5일) — 6개 컴포넌트 (CareerHeroSection, AchievementCardsGrid, KpiDashboard, etc.)
- Phase 4: 페이지 통합 (3일) — /app/career/* 페이지 파일
- Phase 5: 스타일 & 반응형 (2일) — desktop/mobile layouts, dark theme
- Phase 6: 테스트 & 배포 (2일) — 기능, 반응형, 브라우저, 성능, a11y

**총 예상:** 13.5일 (2.5주)

---

## 다음 단계

### 2026-05-16 15:00 KST — 웹개발자 정기 체크
- Asset Master Phase 1 완료 여부 확인
- **[신규 지시] Portfolio Career 구현 준비**
  * 설계 문서 리뷰 시간 배정: 2026-05-16 ~ 2026-05-17 (4시간)
  * DB 마이그레이션 실행: 2026-05-17 (1일)
  * Phase 1-6 병렬 진행: 2026-05-18 ~ 2026-05-30

### DB 마이그레이션
```bash
# Supabase SQL Editor에서 실행
# File: /dsc-fms-portal/db/30_portfolio_career.sql
# Table 1: portfolio_kpi_timeline (여name별 KPI 집계)
# Table 2: portfolio_images (timeline 이미지)
```

---

## 설계 완성도

✅ UI/UX 와이어프레임: 5개 페이지, 모바일/데스크톱 레이아웃  
✅ 데이터 모델: career_companies/projects/achievements + 신규 2개 테이블  
✅ API 명세: Supabase REST 쿼리, 권한 검증  
✅ TypeScript 타입: 모든 entity 정의  
✅ 컴포넌트 구조: 6개 신규 + 기존 통합  
✅ 성능 최적화: KPI timeline 집계 + 인덱스  
✅ 엣지 케이스: 8개 시나리오 문서화  
✅ 구현 체크리스트: 단계별 14일 일정  

---

## 메타

- **상태:** 🟢 설계 완료 → 구현 준비
- **웹개발자 큐:** Asset Master Phase 1 완료 후 즉시 시작
- **예상 배포:** 2026-05-30
- **사용자 언어:** 관리자 화면 (한국어/영어)
