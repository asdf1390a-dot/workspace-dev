---
name: 자동 정보 수집 → 역할별 배포 시스템
description: GitHub/Product Hunt/Dev.to 자동 수집 + AI 필터링 + 역할별 Telegram 배포 (팀 회의 기반)
type: project
relatedFiles: TEAM_DISCUSSION_AUTO_INFO_COLLECTION_SYSTEM.md, project_auto_info_collection.md
---

# 자동 정보 수집 → 역할별 배포 시스템

**회의 일정:** 2026-05-16 14:00 KST (팀 상의)

**참석자:** Web-Builder AI Agent, Evaluator AI Agent, Data-Analyst AI Agent, Translator AI Agent, Planner AI Agent

**산출물:** TEAM_FEEDBACK_20260516.md → 최종 결정

## 기존 문제점 (수동 방식)

```
매주 월요일 09:00
└─ 팀원들에게 리마인더 발송
└─ 각자 GitHub/Product Hunt/Dev.to 직접 방문
└─ 직접 정리 + 분석
```

**문제:**
- 수동 작업 → 일관성 없음
- 시간 낭비
- 정보 누락 가능성 높음
- 팀원마다 다른 판단 기준

## 개선 방향 (자동화)

### 수집 단계 (매주 일요일 18:00)

```
🤖 에이전트가 자동 수집:
• GitHub Trending API (최근 1주일)
• Product Hunt API (주간 Top 10)
• Dev.to API (주간 인기글)
• npm Trends (상승세 라이브러리)
```

### 필터링 + 요약 (매주 월요일 07:00)

```
🧠 AI가 역할별로 필터링 + 요약:

Web-Builder AI Agent: Next.js, React, 성능, 도구
Evaluator AI Agent: 테스트, QA, 자동화, 검증 도구
Data-Analyst AI Agent: 분석 기법, 시각화, Kaggle
Translator AI Agent: 기술 용어, 문맥, 번역 기법
Planner AI Agent: 아키텍처, 시스템 설계, 트렌드

+ CEO 마인드 추가: "왜 중요한가?" + "어떻게 쓸까?"
```

### 배포 (매주 월요일 09:00)

```
📤 역할별 Telegram 채널로 자동 배포:

🔴 Web-Builder AI Agent
  • React 19 성능 개선 (40% 빠름)
  • TypeScript 5.4 (빌드 30% 단축)
  → "어떻게 적용할까?"

🟡 Evaluator AI Agent
  • Playwright 자동화 신기능
  • 테스트 커버리지 95%+ 달성법
  → "우리 포탈에 쓸 수 있을까?"

🟢 Data-Analyst AI Agent
  • Kaggle 톱 분석 기법
  • 시각화 라이브러리 순위
  → "우리 Asset 분석에 적용할 부분?"

🔵 Translator AI Agent
  • Medium 기술 기사 추천
  • 한영 기술 용어 표준화
  → "어떤 부분을 학습할까?"

🟣 Planner AI Agent
  • HackerNews 아키텍처 트렌드
  • 시스템 설계 패턴
  → "언제 우리가 도입할까?"
```

## 기대 효과

| 지표 | 기존 | 개선 후 |
|------|------|--------|
| 수집 시간 | 30분/주 | 0분 (자동) |
| 일관성 | 70% | 100% |
| 팀원 학습 속도 | 저 | 고 |
| 기술 최신성 | 지연 | 실시간 |

## 실행 상태

**설계 완료:** 2026-05-16  
**팀 의견 수렴:** 대기 중  
**개발 시작:** TBD (팀 회의 후 결정)

## 참고 문서
- TEAM_DISCUSSION_AUTO_INFO_COLLECTION_SYSTEM.md — 전체 팀 회의 자료
- project_auto_info_collection.md — 기존 메모리 문서
