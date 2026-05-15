---
name: Team Organization Chart
description: DSC FMS 비서팀 조직도 — 팀 구성, 역할 정의, 담당 영역
type: project
originSessionId: 9f61b7c6-e158-498e-bbe3-9d0d98d293fe
---
# 📊 조직도

```
┌─────────────────────────────────────────┐
│     Kyeongtae Na (사용자)               │
│     생산/기술/보전/생산관리 담당         │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼───┐         ┌───▼────┐
    │ 비서  │         │ 팀원   │
    │ (C3PO)│         │ 관리   │
    └───┬───┘         └────────┘
        │
   ┌────┴──────────────────────┬──────────┬──────────┐
   │                           │          │          │
┌──▼──────┐  ┌──────────┐  ┌───▼───┐  ┌──▼──┐  ┌───▼────┐
│web-     │  │ planner  │  │evalu- │  │trans│  │data-   │
│builder  │  │(설계자)  │  │ator   │  │lator│  │analyst │
│(개발자) │  │(아키텍)  │  │(테스) │  │(번역) │(분석가)│
└─────────┘  └──────────┘  └───────┘  └─────┘  └────────┘
```

---

# 팀원 구성 (6명)

| # | 팀원 | 역할 | 보고선 |
|---|------|------|--------|
| 1 | 비서 (C-3PO) | 조정·모니터링·자동화 | 사용자 직보 |
| 2 | web-builder | 웹앱 개발 (Next.js/React/Supabase) | 비서 |
| 3 | planner | UI/UX + 기술 아키텍처 설계 | 비서 |
| 4 | evaluator | QA 테스트 + 품질 검증 | 비서 |
| 5 | translator | 한↔영 번역 + 비즈니스 문서 | 비서 |
| 6 | data-analyst | 데이터 분석 + 자동화 스크립트 | 비서 |

---

# 담당 영역 (RACI 매트릭스)

| 업무 | web-builder | planner | evaluator | translator | data-analyst |
|------|-------------|---------|-----------|-----------|--------------|
| **웹앱 개발** | R/A | C | C | - | - |
| **기술 설계** | C | R/A | - | - | - |
| **UI/UX 설계** | C | R/A | C | - | - |
| **QA 테스트** | C | - | R/A | - | - |
| **한↔영 번역** | - | - | - | R/A | - |
| **데이터 분석** | C | - | - | - | R/A |
| **DB 마이그레이션** | R/A | C | - | - | - |
| **배포 자동화** | R/A | - | - | - | C |
| **문서 정리** | C | C | - | C | C |

**범례:** R=Responsible(담당), A=Accountable(책임), C=Consulted(참여), -=관련없음

---

# 팀원별 보유 스킬

## 1️⃣ web-builder (웹개발자)
**Primary Skills (5+년):**
- TypeScript/JavaScript
- React 18+ (hooks, context)
- Next.js 14+ (App Router)
- Supabase (PostgreSQL + RLS)
- Vercel 배포

**Secondary Skills (1-3년):**
- Node.js (Express, custom API)
- Tailwind CSS
- Git/GitHub workflow
- API 설계 (RESTful)

**Learning (진행 중):**
- Cron job 자동화
- 에러 핸들링 고급 패턴

---

## 2️⃣ planner (설계자)
**Primary Skills (5+년):**
- 시스템 아키텍처 설계
- DB 스키마 설계
- API 명세 작성
- UI/UX 플로우

**Secondary Skills (2-4년):**
- 비즈니스 프로세스 분석
- 기술 문서 작성
- 팀 간 커뮤니케이션

**Learning (진행 중):**
- Audit/compliance 요구사항 반영
- 성능 최적화 설계

---

## 3️⃣ evaluator (평가자)
**Primary Skills (3+년):**
- QA 테스트 설계
- 버그 탐지 및 보고
- 사용성 평가
- 3회 반복 검증 프로토콜

**Secondary Skills (1-3년):**
- 회귀 테스트 (Regression)
- 성능 측정
- 사용자 피드백 수집

**Learning (진행 중):**
- 자동화 테스트 도구 (Selenium, Playwright)
- 접근성 검증 (WCAG)

---

## 4️⃣ translator (번역가)
**Primary Skills (5+년):**
- 한국어 ↔ 영어 번역
- 비즈니스 문서 (이메일, 계약)
- 기술 용어 로컬라이제이션

**Secondary Skills (2-4년):**
- 태국어, 타밀어 (기초)
- PowerPoint/Excel 형식 유지

**Learning (진행 중):**
- DSC 제조 산업 용어
- 공장 관리 프로세스

---

## 5️⃣ data-analyst (데이터분석가)
**Primary Skills (3+년):**
- SQL (PostgreSQL/Supabase)
- Python 데이터 분석
- Excel 고급 (VBA, 매크로)
- 통계 분석

**Secondary Skills (1-3년):**
- 데이터 시각화 (Grafana, matplotlib)
- 자동화 스크립트 (Python, Bash)
- KPI 추출 및 리포팅

**Learning (진행 중):**
- 머신러닝 (기초)
- 실시간 데이터 파이프라인

---

## 6️⃣ 비서 (C-3PO)
**Primary Skills:**
- 팀 조정 및 자동화
- 타임라인 관리
- 컨텍스트 손실 방지 (메모리 관리)
- 상황판 유지보수

**Secondary Skills:**
- 에러 분석 및 디버깅
- 기술 문서 이해도
- 커뮤니케이션 중개

**Learning:**
- 비즈니스 프로세스 (제조업)
- AI 팀 관리 베스트 프랙티스

---

**마지막 업데이트:** 2026-05-15
**버전:** v1.0
