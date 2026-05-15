---
name: 팀 역량 개발 프레임워크
description: 월간 학습회의 + 분기별 진단 + 학습→기술자산 승격 프로세스로 팀 전체 역량 체계적 향상
type: project
---

# 팀 역량 개발 프레임워크

**시작:** 2026-05-16 | **상태:** 🟡 팀 피드백 수렴 중 | **목표:** 월간 정기 역량 개발 문화 수립

## 핵심 구조 (4 Modules)

### Module 1: 역할별 역량 모델
- 5개 코어 팀원 × 3단계(L1/L2/L3) 역량 정의
- 신규 2명 온보딩 경로 포함
- 현재 수준 + 월간 목표 기록

### Module 2: 월간 역량 개발 회의
- 매월 첫 주 월요일 14:00 KST (1시간)
- 4부 구성: 개인 학습 공유(10분) → 팀 피드백(10분) → 기술 토론(30분) → 의사결정(10분)
- Discord #역량개발 채널에서 진행 (새로 생성)

### Module 3: 학습 승격 프로세스
- 개인 learnings.md → 팀 검증 → 팀 자산화 (design-system.md, manufacturing-glossary.md)
- 승격 기준: 3/5 이상 투표
- 4단계 프로세스: 개인학습 → 실무적용 → 팀투표 → 문서화

### Module 4: 분기별 역량 진단
- Q1(2026-06-15), Q2(2026-09-15), Q3(2026-12-15)
- 5단계 평가(1:학습필요~5:전문가)
- 강점 확대 + 약점 보강 + 경력경로 설계

## 자동화
- 매월 1일 09:00: Telegram 리마인더 (학습 기록 부탁)
- 매월 첫 주 월요일 13:00: Discord 공지 (회의 시작 1시간 전)
- 분기별 15일 10:00: 진단 알림

## 현황
- 웹개발자/평가자: learnings 파일 ✅ 활성
- 데이터분석가/번역가/플레너: learnings 파일 📝 생성 필요
- 팀 자산: design-system.md, manufacturing-glossary.md ✅ 존재
- 외부 학습 자료: youtube-library.md ✅ 확장 완료 (GitHub+Product Hunt+Dev.to+npm+기술블로그)
- Discord #역량개발 채널: 📝 생성 필요
- 주간 큐레이션 Cron: ✅ 등록 (매주 월요일 09:00)
- 월간 신기술 선별 Cron: ✅ 등록 (매월 1일 09:00)

## 외부 학습 자료 통합 (2026-05-15 확장)
- **GitHub Trending Repositories** (역할별 12개 추천)
  - 웹개발자: Next.js, Supabase, shadcn/ui, React Query, Auth0
  - 평가자: Testing Library, Cypress, Playwright
  - 데이터분석가: Pandas, Plotly, Apache Superset
  - 자동화전문가: Celery, APScheduler, Prefect
  
- **Product Hunt 신규 도구** (매주 갱신)
  - 개발자 도구: Cursor, v0, Replit
  - 자동화: Make, Zapier
  - 데이터: Metabase, Retool

- **Dev.to & Medium 기술 블로그** (주제별)
  - 웹개발: Next.js App Router, Supabase RLS, React 성능 최적화
  - 테스트: 자동화 전략, E2E 테스트
  - 데이터: Python 분석, SQL 최적화

- **npm Trending Packages** (npmtrends.com)
  - 라이브러리 선택 및 비교
  - 의존성 업데이트 참고

- **기술 블로그 정기 방문**
  - CSS-Tricks (웹개발)
  - LogRocket (성능/디버깅)
  - Smashing Magazine (설계/UX)
  - Towards Data Science (ML/AI)
  - HackerNews (기술뉴스)

## 주간 학습 루틴 (Module 3 보강)
- **웹개발자**: GitHub Trending 3개 + npm trends 1개 검토 (주 30분)
- **평가자**: Product Hunt 테스트 도구 2개 확인 (주 20분)
- **데이터분석가**: Dev.to 데이터 분석 글 1개 읽기 (주 30분)
- **번역가**: Medium 기술 글 1개 한영 번역 (주 40분)
- **플레너**: CSS-Tricks/Smashing Magazine 아키텍처 글 (주 30분)

## 문서
- **설계:** `TEAM_COMPETENCY_DEVELOPMENT_FRAMEWORK.md` (완성)
- **팀 피드백:** 수렴 중 (2026-05-16~20)
- **학습 자료:** `skills/youtube-library.md` (확장 완료 2026-05-15)
- **CTB 추적:** Task 8 "외부 정보 통합 & 주간 큐레이션" (진행 중)
