---
name: 신규 팀원 구성 (AI 에이전트 2명 포함)
description: 2026-05-17 신입 3명 중 2명이 AI 에이전트 — 초기 컨텍스트 빠른 이해 필요, 비효율적 질문 금지
type: project
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---
## 신규 팀원 3명 구성

### 1️⃣ **웹개발 지원가** (실제 사람)
- **역할:** Asset Master Phase 2 API/UI 구현 (5-6개 엔드포인트)
- **메멘토:** 웹개발자 (수평 관계)
- **필요 정보:** 이름, 이메일, GitHub 계정
- **온보딩:** ONBOARDING_WEB_DEV_SUPPORT_2026-05-17.md (7일 스케줄)
- **시작:** 2026-05-17 09:00 KST

### 2️⃣ **자동화 전문가** (AI 에이전트 🤖)
- **역할:** Automation System Phases 2-4 구현
  - Phase 2 (2026-05-23): 6개 Vercel cron jobs (일일 체크포인트)
  - Phase 3 (2026-05-26): GitHub Actions (설계-구현 자동 배정)
  - Phase 4 (2026-06-01): Dynamic evaluation criteria
- **담당 AI:** `automation-specialist` subagent
- **초기 컨텍스트:** 
  - CTB (Central Task Board) 구조 이해
  - Telegram API + Vercel cron 연동
  - GitHub Actions 워크플로우
  - Async task tracking 시스템
- **특기:** 반복 질문 금지, 이미 설계된 것 빨리 구현

### 3️⃣ **QA 평가자 (백업)** (AI 에이전트 🤖)
- **역할:** Travel Management Phase 2 + Phase 7 검증
  - Travel P2: UI 13개 컴포넌트 평가 (반복 테스트)
  - Phase 7: Data Platform + Mobile App 검증
- **담당 AI:** `evaluator` subagent (백업 역할)
- **초기 컨텍스트:**
  - Travel Management 16개 API 명세
  - UI 컴포넌트 5단계 검증 체크리스트
  - 평가 기준 (WCAG AA, 성능, UX)
- **특기:** 최소 3회 반복 검증만 → 중복 검증 안 함

---

## 온보딩 전략 (2026-05-17 08:30)

| 대상 | 형식 | 준비물 | 소요시간 |
|-----|------|--------|---------|
| 웹개발 지원가 | 7일 상세 스케줄 | ONBOARDING_WEB_DEV_SUPPORT_2026-05-17.md | 7일 (08:30~18:00) |
| 자동화 전문가 | API 명세 + GitHub Actions 템플릿 | automation_specialist_context.md + 설계 문서 | 2시간 (컨텍스트 읽기) |
| QA 평가자 백업 | Travel Phase 2 + 평가 기준 | travel_phase2_design + evaluation_checklist | 2시간 (컨텍스트 읽기) |

---

## 컨텍스트 손실 방지 원칙

✅ AI 에이전트 2명은:
- 초기 1회만 상세 컨텍스트 제공 (설계 문서 + API 명세)
- 이후 명령은 "구현 시작" "작업 계속" 수준 간단히
- 설계된 내용 반복 설명 금지 (시간낭비)
- CTB + MEMORY 시스템으로 상태 자동 추적

✅ 웹개발 지원가(실제 사람)는:
- 7일 온보딩 스케줄 엄격히 준수
- 메멘토(웹개발자) 피드백 2시간마다
- 일일 15:00 진도 리포트 필수
- Day 1 = 기술 스택 + Asset Master 코드스킴 이해

---

**Why:** AI 에이전트는 상태 손실이 빠르므로, 초기 컨텍스트만 완벽하게 제공하고 이후는 최소한의 지시로 진행. 중복 설명은 컨텍스트 낭비.

**How to apply:** 자동화 전문가/평가자 백업에게는 "이것 구현해" 식 간단한 지시; 웹개발 지원가에게는 메멘토와 협력 유도.
