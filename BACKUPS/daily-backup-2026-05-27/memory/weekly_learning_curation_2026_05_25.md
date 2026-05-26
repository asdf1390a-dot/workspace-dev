---
name: 주간 학습 큐레이션 2026-05-25
description: 매주 월 09:00 자동 실행 — 각 팀원별 학습 자료 검토 및 갱신 현황
type: project
---

# 주간 학습 큐레이션 현황 — 2026-05-25 (Week 21)

**실행 시간:** 2026-05-25 09:00 KST (Monday)  
**담당자:** 비서 (자동 cron)  
**목표:** 각 팀원의 역할별 학습 자료 검토 → youtube-library.md 갱신

---

## 팀원별 과제 상태

### 🟡 웹개발자 (Web Developer)
- **담당:** GitHub Trending 3개 + npm trends 1개 (30분)
- **확인 링크:**
  - GitHub Trending: https://github.com/trending?since=weekly&spoken_language_code=en
  - npm trends: https://www.npmtrends.com/
- **상태:** 자료 검색 중 (2026-05-18~05-25 주간 자료)
- **다음 액션:** 담당자가 위 링크 확인 후 新 저장소 3개 + npm 패키지 1개 선별 → youtube-library.md에 추가

### 🟡 평가자 (QA Evaluator)
- **담당:** Product Hunt 신규 테스트 도구 2개 (20분)
- **확인 링크:** https://www.producthunt.com/
- **상태:** 검색 중 (웹 API 제약으로 자동 수집 불가)
- **다음 액션:** 담당자가 Product Hunt 확인 → 테스트/QA 관련 2개 신도구 선별

### 🟡 데이터분석가 (Data Analyst)
- **담당:** Dev.to 데이터 분석 글 1개 (30분)
- **확인 링크:** https://dev.to/search?q=data+analysis+python
- **상태:** 검색 중
- **다음 액션:** 담당자가 Dev.to에서 최신 분석 기사 1개 읽기

### 🟡 번역가 (Translator)
- **담당:** Medium 기술 글 1개 한영 번역 연습 (40분)
- **확인 링크:** https://medium.com/tag/technical-writing
- **상태:** 검색 결과: "Where Should Data Documentation Live" (Towards Data Engineering) 발견
- **다음 액션:** 담당자가 선택한 Medium 글 1개 번역 연습 → 결과 공유

### 🟡 플레너 (Product/Architecture Planner)
- **담당:** CSS-Tricks/Smashing Magazine 아키텍처 글 1개 (30분)
- **확인 링크:** 
  - CSS-Tricks: https://css-tricks.com
  - Smashing Magazine: https://www.smashingmagazine.com
- **상태:** 검색 중
- **다음 액션:** 담당자가 최신 아키텍처/설계 글 1개 선별

---

## 📊 현재 완료 상황

| 팀원 | 과제 | 상태 | ETA |
|------|------|------|-----|
| 웹개발자 | GitHub 3 + npm 1 | 🟡 자료 준비중 | 10:30 |
| 평가자 | Product Hunt 2 | 🟡 자료 준비중 | 10:00 |
| 분석가 | Dev.to 1 | 🟡 자료 준비중 | 10:30 |
| 번역가 | Medium 1 | 🟡 자료 준비중 | 11:00 |
| 플레너 | CSS-Tricks 1 | 🟡 자료 준비중 | 10:00 |

---

## 신규 자료 (발견됨)

### Medium
✅ **"Where Should Data Documentation Live? A Modern Architecture for AI-Enabled Teams"**
- URL: https://medium.com/towards-data-engineering/where-should-data-documentation-live-a-modern-architecture-for-ai-enabled-teams-0109e4b7609e
- 분야: 기술 문서화, AI 통합
- 담당: 번역가 (또는 플레너)

---

## 다음 단계

**【비서 액션 필요】**
1. ✅ youtube-library.md 업데이트 (2026-05-25로 변경, 신규 항목 표 형식 추가)
2. ⏳ 각 팀원에게 Telegram으로 주간 과제 리마인더 발송 (10:00)

**【팀원 액션 필요】** (병렬 진행, 각 30분)
- 웹개발자: GitHub Trending 3개 + npm 1개 확인 후 youtube-library.md에 추가
- 평가자: Product Hunt 신규 2개 테스트 도구 확인 후 추가
- 분석가: Dev.to 데이터 분석 글 1개 읽기 + 요약 공유
- 번역가: Medium 기술 글 1개 번역 연습 (위의 Data Documentation 또는 선택)
- 플레너: CSS-Tricks 아키텍처 글 1개 읽기 + 통찰 공유

---

## 규칙

- **주기:** 매주 월요일 09:00 KST 자동 실행
- **형식:** 각 팀원이 역할별 자료 1주일 내 검토 (병렬)
- **결과:** youtube-library.md 주간 갱신 (각 팀원 추가 후 비서가 병합)
- **목표:** 각 팀원이 최신 업계 동향을 놓치지 않도록 체계화

---

## 개선사항 (향후)

1. SearXNG 웹 검색 설정 → 자동 자료 수집 자동화
2. Telegram 리마인더 자동화 (현재 수동)
3. YouTube 최신 영상 자동 크롤링 → CSV → youtube-library.md 자동 추가

**차기 실행:** 2026-06-01 09:00 KST (다음주 월요일)
