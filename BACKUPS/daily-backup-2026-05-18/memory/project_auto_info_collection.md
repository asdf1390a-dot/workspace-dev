---
name: 자동 정보 수집 시스템 (Auto Info Collection System)
description: GitHub Trending, Product Hunt, Dev.to에서 매일 자동 수집 + AI 필터링 + Telegram 배포
type: project
originSessionId: 3fcabd98-2e8b-4046-a202-0bc64f705e89
---
# 자동 정보 수집 시스템

**목표:** 팀 전체가 항상 최신 기술 트렌드를 자동으로 받도록 시스템화  
**운영:** 일일 Cron Job (08:00 KST) + AI 필터링 + Telegram 배포

## 3가지 정보원

### 1. GitHub Trending
- 프로그래밍 언어/프레임워크 트렌드
- Open Source 신규 프로젝트
- 필터: JavaScript, Python, React, Next.js, Go

### 2. Product Hunt
- SaaS/웹 서비스 신규 출시
- 개발자 도구 트렌드
- 필터: Dev Tools, Analytics, Infrastructure

### 3. Dev.to
- 기술 블로그 아티클
- 베스트 프랙티스 + 성능 최적화
- 필터: Web Dev, Performance, Database

## AI 필터링 (역할별 맞춤)

**배포 대상:**
- **웹개발자:** Next.js, React, TypeScript, 성능 최적화
- **데이터분석가:** Python, ML, 데이터 분석, Metabase
- **번역가:** i18n, 현지화, 다국어 처리
- **평가자:** QA, 테스트, 자동화

**필터링 로직:**
```
수집 → 제목/설명 AI 분석 → 역할별 관련도 점수 → 상위 5개 선별
→ 한국어 요약 → Telegram #학습 채널 배포
```

## 배포 형식

```
🔔 2026-05-16 자동 학습 정보

【웹개발자】
1. React 19 성능 최적화 팁 (5/5 관련도)
2. Next.js 14.2 업데이트 (5/5)
3. TypeScript 성능 개선 (4/5)

【데이터분석가】
1. Python 3.12 속도 개선 (5/5)
2. Polars vs Pandas 성능 비교 (4/5)

【번역가】
1. Google Translate API 업데이트 (5/5)
2. i18n 다국어 베스트 프랙티스 (4/5)

【평가자】
1. Playwright 테스트 자동화 (5/5)
2. GitHub Actions CI/CD 최적화 (4/5)
```

## 기술 스택

- **수집:** GitHub API, Product Hunt API, RSS (Dev.to)
- **필터링:** Claude API + 프롬프트 캐싱
- **배포:** Telegram Bot
- **스케줄:** Cron (08:00 KST)

## 효과

- 팀원 당 월 3회 이상 새로운 기술 습득
- 트렌드 반응 속도 ↑ (1주→1일)
- 팀 전체 기술 깊이 + 폭 증가

**상세:** TEAM_DISCUSSION_AUTO_INFO_COLLECTION_SYSTEM.md
