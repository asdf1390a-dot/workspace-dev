---
name: Web-Builder #2 온보딩 패키지 — Team Dashboard Phase 2 UI 구현 (가속화)
description: Phase C #11 설계 완료 → 평가자 검증(2026-06-02) → 웹개발자 #2 구현 (2026-06-03~2026-06-17)
type: project
stage: IMPLEMENTATION_PREP
date: 2026-05-28
spawn_date_expected: 2026-06-03
deadline: 2026-06-17 18:00 KST
owner: Web-Builder #2 (TBD)
status: 🟡 온보딩 준비 중 (Evaluator 검증 대기)
---

# Web-Builder #2 온보딩 패키지
## Team Dashboard Phase 2 UI 구현 (가속화 일정)

**작성:** 2026-05-28 20:10 KST (Secretary AI)  
**배포 예정:** 2026-06-03 09:00 KST (평가자 GO 신호 후)  
**마감:** 2026-06-17 18:00 KST (14일 집중 개발)

---

## 🎯 미션 요약

**목표:** 설계 완료된 Team Dashboard Phase 2 UI를 구현하고 Vercel에 배포

**범위:** 5개 핵심 페이지 + 60개 컴포넌트 + 실시간 Supabase 통합

**성과물:**
- 모든 페이지 구현 + 반응형 테스트 완료
- 60+ React 컴포넌트 (Tailwind CSS + Radix UI)
- Supabase Realtime 통합 + React Query 캐싱
- WCAG AA 접근성 검증 완료
- E2E 테스트 (Cypress) + 성능 프로파일링
- Vercel 배포 + 성능 최적화 (LCP < 2s, FID < 100ms)

---

## 📋 입력 자료 (설계 완료)

### 1. 메인 설계 문서 ✅ DONE
- **파일:** `/home/jeepney/.openclaw/workspace-dev/TEAM_DASHBOARD_PHASE2_UI_DESIGN.md`
- **크기:** 2,079줄
- **포함 내용:**
  - 5개 페이지 와이어프레임 (조직도/포트폴리오/이력추적/팀멤버프로필/실시간모니터링)
  - 60+ 컴포넌트 완전 명세
  - Redux/Zustand 상태 관리 설계
  - 4개 반응형 브레이크포인트 (320px/640px/1024px/1440px)
  - WCAG AA 접근성 기준
  - 성능 최적화 가이드
  - Figma 와이어프레임 링크

### 2. Phase 1 API (이미 구현 완료) ✅ AVAILABLE
**10개 엔드포인트:**
- GET `/api/team-members` — 팀원 목록
- GET `/api/team-members/:id` — 개별 팀원 상세
- POST `/api/team-members` — 신규 팀원
- PATCH `/api/team-members/:id` — 팀원 정보 수정
- GET `/api/team-structure` — 조직도 계층 구조
- GET `/api/portfolio-items` — 포트폴리오 항목
- POST `/api/portfolio-items` — 포트폴리오 추가
- GET `/api/activity-log` — 이력 로그
- GET `/api/milestones` — 마일스톤
- GET `/api/dashboard-stats` — 대시보드 통계

**API 명세:** `/home/jeepney/.openclaw/workspace-dev/TEAM_DASHBOARD_API_GUIDE.md` (451줄)

### 3. 데이터베이스 스키마 (db/42 완료) ✅ READY
**4개 테이블:**
- `team_members` — 팀원 기본 정보 (15명)
- `team_structure` — 조직도 계층 + 역할 + 보고 관계
- `portfolio_items` — 프로젝트 + 상태 + 진행률
- `activity_log` — 타임라인 + 이벤트 + 타임스탐프

**스키마:** `db/42_team_dashboard_phase2_api.sql` (완료)

### 4. 기술 스택 ✅ CONFIRMED
| 계층 | 기술 | 버전 |
|------|------|------|
| 프론트엔드 | React + Next.js 14 | 14.0+ |
| 스타일 | Tailwind CSS v3 | 3.3+ |
| UI 컴포넌트 | Radix UI | Latest |
| 상태 관리 | Zustand | Latest |
| 데이터 동기화 | Supabase Realtime | Latest |
| 쿼리 관리 | React Query | v5+ |
| 차트 | Recharts | 2.10+ |
| 애니메이션 | Framer Motion | Latest |
| 아이콘 | Heroicons | Latest |
| 테스트 | Vitest + Cypress | Latest |
| 배포 | Vercel | Default |

---

## 📅 14일 실행 일정 (가속화)

### Day 1-2: 2026-06-03 ~ 2026-06-04 (개발 환경 + 컴포넌트 기초)
**목표:** 설계 분석 완료, 기초 컴포넌트 80% 구현

**작업:**
- [ ] 설계 문서 정독 (TEAM_DASHBOARD_PHASE2_UI_DESIGN.md)
- [ ] 기존 코드 검토 (Team Dashboard Phase 1)
- [ ] Figma 와이어프레임 분석
- [ ] 환경 설정 (Next.js + Zustand + Tailwind)
- [ ] Foundation 컴포넌트 작성 (Button/Input/Card/Badge 등 8개)
- [ ] Layout 컴포넌트 (Navbar/Sidebar/Grid 등 5개)

**검증:**
- [ ] 기초 컴포넌트 Storybook 테스트
- [ ] 반응형 테스트 (Chrome DevTools 4개 브레이크포인트)

**완료 기준:** 13개 Foundation/Layout 컴포넌트 ✅

---

### Day 3-4: 2026-06-05 ~ 2026-06-06 (조직도 페이지)
**목표:** 조직도 페이지 전체 구현 + 상호작용

**작업:**
- [ ] Organization Chart 컴포넌트 (계층 구조, 드래그 지원)
- [ ] Team Member Card (프로필 + 역할 + 통계)
- [ ] 필터링 UI (역할/프로젝트/상태별)
- [ ] Supabase Realtime 연결 (team_members 구독)
- [ ] React Query 캐싱 설정

**검증:**
- [ ] 15명 데이터 렌더링 테스트
- [ ] 드래그 상호작용 (데스크톱 + 태블릿)
- [ ] 모바일 폴드아웃 테스트
- [ ] 접근성 검증 (키보드 네비게이션, 스크린리더)

**완료 기준:** 조직도 페이지 → 배포 가능

---

### Day 5-6: 2026-06-07 ~ 2026-06-08 (포트폴리오 + 이력 페이지)
**목표:** 데이터 시각화 페이지 2개 완성

**작업:**
- [ ] Portfolio 페이지 (프로젝트 목록 + Kanban + 상태 표시)
- [ ] Activity Timeline (이벤트 로그 + 필터 + 검색)
- [ ] 차트 통합 (Recharts: Progress bars, Timeline)
- [ ] Supabase 실시간 동기화

**검증:**
- [ ] 데이터 로딩 성능 (< 500ms)
- [ ] 필터링 반응성
- [ ] 차트 반응형 크기 조정

**완료 기준:** 포트폴리오 + 이력 페이지 ✅

---

### Day 7-8: 2026-06-09 ~ 2026-06-10 (팀원 프로필 + 대시보드)
**목표:** 상세 페이지 2개 + CEO 실시간 대시보드

**작업:**
- [ ] Team Member Profile 상세 페이지 (포트폴리오 + 통계)
- [ ] Real-time Status Dashboard (KPI + 경고 + 자동 새로고침)
- [ ] 모바일 최적화 (320px 레이아웃)
- [ ] 다크 모드 지원 (선택사항)

**검증:**
- [ ] 모든 페이지 WCAG AA 최종 검증
- [ ] 모바일 테스트 (iPhone + Android 시뮬레이터)
- [ ] 성능 프로파일링 (Lighthouse)

**완료 기준:** 5개 페이지 모두 ✅

---

### Day 9-11: 2026-06-11 ~ 2026-06-13 (E2E 테스트 + 최적화)
**목표:** 자동화 테스트 100% + 성능 목표 달성

**작업:**
- [ ] Cypress E2E 테스트 (모든 페이지 흐름)
- [ ] 성능 최적화 (Code splitting, lazy loading)
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 번들 크기 최적화 (< 300KB gzip)
- [ ] SEO 메타 태그 추가

**검증:**
- [ ] Lighthouse 점수 (Core Web Vitals: 90+)
- [ ] E2E 테스트 커버리지 (80%+)
- [ ] 성능 메트릭:
  - [ ] LCP < 2초
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

**완료 기준:** 모든 성능 목표 달성 ✅

---

### Day 12-13: 2026-06-14 ~ 2026-06-15 (Vercel 배포 + 스모크 테스트)
**목표:** 프로덕션 배포 + QA 최종 검증

**작업:**
- [ ] Vercel 환경 설정 (프로덕션 + 스테이징)
- [ ] 환경 변수 설정 (Supabase API 키)
- [ ] 배포 파이프라인 (GitHub Actions 자동 배포)
- [ ] DNS 설정 (team-dashboard.dsc-fms.io)
- [ ] 스모크 테스트 (모든 API 엔드포인트)

**검증:**
- [ ] 프로덕션 로드 테스트 (50 동시 사용자)
- [ ] 에러 로깅 (Sentry 통합)
- [ ] 모니터링 대시보드 (Vercel Analytics)

**완료 기준:** 프로덕션 배포 ✅

---

### Day 14: 2026-06-16 (버그 수정 + 문서화)
**목표:** QA 결함 수정 + 최종 인수

**작업:**
- [ ] QA 버그 수정 (우선순위별)
- [ ] 개발자 문서 작성 (컴포넌트 가이드)
- [ ] 배포 후 모니터링 (성능 메트릭)

**마감:** 2026-06-17 18:00 KST

---

## 👥 멘토링 구조

| 역할 | 담당자 | 책임 |
|------|--------|------|
| **Primary Mentor** | 기존 Web-Builder | 일일 체크인, 설계 Q&A, 코드 리뷰 |
| **Design Mentor** | Design Specialist (완료 후) | 설계 문서 설명, 와이어프레임 상세 해석 |
| **QA Mentor** | Evaluator AI | Day 9+ 테스트 전략, WCAG AA 검증 |
| **Deployment** | DevOps Engineer | Vercel 설정, 모니터링 대시보드 |

**일일 체크인 시간:** 15:00 KST (기존 Web-Builder와)  
**주간 리뷰:** 금요일 18:00 KST (CEO + Secretary)

---

## ✅ 성공 기준 (Go/No-Go)

### 🟢 GO (모두 충족)
- [ ] 5개 페이지 전체 구현 + Vercel 배포
- [ ] 60+ 컴포넌트 완성 + 각 컴포넌트 테스트 ✅
- [ ] Supabase Realtime 통합 + React Query 캐싱 ✅
- [ ] WCAG AA 접근성 준수 (3-iteration 검증 완료)
- [ ] Cypress E2E 테스트 80%+ 커버리지 ✅
- [ ] 성능 목표 달성 (LCP < 2s, FID < 100ms, CLS < 0.1)
- [ ] 0개 Critical 결함, ≤3개 Minor 결함

### 🔴 No-Go (하나라도 미충족)
- [ ] 1개 이상 페이지 미구현
- [ ] Supabase 연결 실패
- [ ] WCAG AA 3+ 위반 사항
- [ ] E2E 테스트 커버리지 < 60%
- [ ] 성능 목표 미달 (LCP > 3s or 기타)
- [ ] 4개 이상 Critical 결함

---

## 📚 참고 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| **메인 설계 문서** | `/TEAM_DASHBOARD_PHASE2_UI_DESIGN.md` | 와이어프레임, 컴포넌트 명세, 상태 관리 |
| **API 가이드** | `/TEAM_DASHBOARD_API_GUIDE.md` | 10개 엔드포인트 명세 + curl 예제 |
| **DB 스키마** | `db/42_team_dashboard_phase2_api.sql` | 테이블 정의 + RLS 정책 |
| **Phase 1 코드** | `pages/dashboard/team-dashboard.tsx` | 참고 구조 (Phase 1 구현) |
| **Backup App UI** | `/project_backup_app_ui_design_system.md` | 리유저블 패턴 참고 |
| **Asset Master P2** | `/ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md` | 설계 → 구현 흐름 참고 |

---

## 🔌 개발 환경 체크리스트

- [ ] Node.js 22+ 설치 확인
- [ ] npm/yarn 최신 버전
- [ ] `.env.local` 설정 (Supabase 키)
- [ ] GitHub SSH 키 설정
- [ ] Vercel CLI 설치
- [ ] Cypress 설치
- [ ] Chrome DevTools 접근 확인
- [ ] GitHub Actions 권한 확인

---

## 🚀 배포 후 모니터링 (Day 14+)

**KPI 추적:**
- 페이지 로드 시간 (LCP, FCP, CLS)
- API 응답 시간 (< 500ms)
- 에러율 (< 0.1%)
- 사용자 세션 (실시간 활동)
- Vercel 분석 대시보드

**알림 설정:**
- Critical 에러 → Slack 알림
- 성능 저하 (LCP > 3s) → 자동 조사
- 배포 실패 → 즉시 롤백

---

## 📝 최종 인수 체크리스트

- [ ] 배포 URL 작동 확인
- [ ] 모든 API 엔드포인트 테스트
- [ ] 모바일 기기에서 수동 테스트
- [ ] 성능 메트릭 기록 (초기 베이스라인)
- [ ] 개발자 문서 완성
- [ ] CEO 데모 (15:00 KST)

---

**상태:** 🟡 대기 중 (Evaluator GO 신호 2026-06-02 18:00 예정)  
**배포 예정:** 2026-06-03 09:00 KST

---

문서 작성: 2026-05-28 20:10 KST  
작성자: Secretary AI (C-3PO)  
검토 대기: CEO 승인

