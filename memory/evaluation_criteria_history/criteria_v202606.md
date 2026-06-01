---
name: 2026년 6월 기술 평가 기준
version: 202606
last_updated: 2026-06-01T09:03:00+09:00
evaluation_period: 2026-06-01 ~ 2026-06-30
technology_velocity_index: 3.8
prev_month_velocity: 3.5
---

# 2026년 6월 팀 기술 평가 기준

**기준일:** 2026-06-01 (월)  
**적용기간:** 2026-06-01 ~ 2026-06-30  
**기술 속도 지수(TVI):** 3.8/5.0 (공격적 + 안정성)  
**변경 유형:** +0.3 상향 (메모리 자동화, DevOps 고도화)

---

## 1. 기술 트렌드 분석 (2026-06)

### 1.1 프론트엔드
**상태:** 안정적 고도화

| 기술 | 버전 | 평가 | 변화 |
|------|------|------|------|
| React | 18.x | 🟢 필수 | 지속 |
| Next.js | 14.x | 🟢 필수 (App Router) | +모니터링 |
| TypeScript | 5.x | 🟢 필수 | 지속 |
| Tailwind CSS | 3.x | 🟢 표준 | 지속 |
| React Query | 5.x | 🟡 권장 | 신규 |
| Zustand/Context | - | 🟡 상황별 | 지속 |

**평가 기준:**
- React 컴포넌트: 함수형 + hooks 필수
- Next.js: App Router 탑재 신규 프로젝트
- TypeScript: strict mode 필수 (tsconfig)
- 상태관리: Redux 대신 Context/Zustand 선호

### 1.2 백엔드 & API
**상태:** 현대적, 소규모 팀에 최적화

| 기술 | 버전 | 평가 | 변화 |
|------|------|------|------|
| Node.js | 22.x LTS | 🟢 필수 | +최신 선정 |
| Express | 4.x | 🟢 표준 | 지속 |
| Supabase | - | 🟢 필수 (PostgreSQL+Auth) | 지속 |
| REST API | - | 🟢 필수 | 지속 |
| GraphQL | - | 🟡 선택 | 대기 |
| tRPC | - | 🟡 평가 | 신규 검토 |

**평가 기준:**
- REST API 설계: OpenAPI 3.0 문서화
- 데이터 검증: Zod/Joi 필수
- 에러 처리: 구조화된 응답 (status, message, data)
- 인증: JWT + RLS (Supabase) 표준

### 1.3 데이터베이스
**상태:** PostgreSQL 중심

| 기술 | 평가 | 변화 |
|------|------|------|
| PostgreSQL | 🟢 필수 | 지속 |
| Supabase | 🟢 표준 | 지속 |
| Migrations (DB) | 🟢 필수 | +엄격화 |
| RLS (Row-Level Security) | 🟢 필수 | 지속 |
| Redis | 🟡 선택 (캐싱) | 검토 |

**평가 기준:**
- DB 마이그레이션: 버전 관리 (db/001, db/002, ...)
- 스키마 설계: 정규화 + 인덱스 성능 고려
- RLS: auth 기반 데이터 격리 필수
- 백업: 일일 자동화 (Hermes/PITR)

### 1.4 DevOps & 배포
**상태:** CI/CD 고도화 진행 중

| 기술 | 평가 | 변화 |
|------|------|------|
| GitHub Actions | 🟢 필수 | 지속 |
| Vercel | 🟢 필수 (FMS 포탈) | 지속 |
| Docker | 🟡 계획 (Memory Automation) | +필수화 |
| Environment Management | 🟢 필수 | +검증 강화 |
| Monitoring | 🟢 신규 (DevOps Lane) | **신규** |

**평가 기준:**
- CI/CD: 모든 PR에 테스트 + linting 자동화
- 배포: Blue-Green 전략 검토 (6월말)
- 로깅: Supabase Logs + Vercel Analytics
- 에러 추적: Sentry 또는 유사 (보안 검토 필수)

### 1.5 테스트 & QA
**상태:** 자동화 강화 중

| 기술 | 평가 | 변화 |
|------|------|------|
| Jest | 🟢 필수 | 지속 |
| React Testing Library | 🟢 필수 | 지속 |
| E2E (Playwright/Cypress) | 🟡 권장 | +도입 계획 |
| Manual QA | 🟢 필수 | 지속 |
| 카버리지 기준 | 🟡 70% 이상 | +80%로 상향 |

**평가 기준:**
- 단위 테스트: 핵심 유틸리티 + 훅 필수
- 통합 테스트: API + UI 상호작용 > 70%
- E2E: 주요 사용자 흐름 (로그인, CRUD, 검색)
- 수동 QA: 디자인+성능+접근성 검증 (Evaluator 주도)

### 1.6 보안 & 규정
**상태:** 강화 필수

| 항목 | 평가 | 변화 |
|------|------|------|
| HTTPS | 🟢 필수 | 지속 |
| JWT + RLS | 🟢 필수 | 지속 |
| 환경 변수 | 🟢 필수 (no secrets in code) | +감사 |
| 데이터 암호화 | 🟡 검토 필요 | +6월 감사 |
| GDPR/로컬 규정 | 🟡 India MEITY 확인 | 신규 |

**평가 기준:**
- 환경 변수: `.env.example` 제공 (실제 값 X)
- 커밋 메시지: secret 유출 방지 (pre-commit hook)
- 의존성 감사: `npm audit` 월 1회
- 접근 제어: 역할별 권한 명확 (Owner/Editor/Viewer)

---

## 2. 역할별 평가 기준

### 2.1 웹 개발자 (Web-Builder)

**핵심 기술 스택:**
- React + Next.js + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Jest + React Testing Library
- GitHub + Git Flow

**월간 평가 항목:**

| 항목 | 기준 | 점수 |
|------|------|------|
| **코드 품질** | TypeScript strict + ESLint 준수 | 20점 |
| **기능 완성도** | 설계 문서 대비 구현률 > 95% | 20점 |
| **테스트 커버리지** | > 75% (단위 + 통합) | 15점 |
| **성능** | Lighthouse 점수 > 85 | 15점 |
| **보안** | 환경변수 관리 + SQL injection 방지 | 15점 |
| **협업** | PR 리뷰 시간 < 24h | 10점 |
| **문서화** | API docs + 컴포넌트 JSDoc | 5점 |

**월간 목표:** 90점 이상

**신규 항목 (2026-06):**
- ✅ React Query 도입 (데이터 페칭 최적화)
- ✅ E2E 테스트 시작 (주요 흐름, Playwright 평가)

---

### 2.2 데이터 분석가 (Data-Analyst)

**핵심 기술:**
- SQL (Supabase PostgreSQL)
- Python (pandas, numpy, matplotlib)
- Tableau / Google Data Studio
- Git (버전 관리)

**월간 평가 항목:**

| 항목 | 기준 | 점수 |
|------|------|------|
| **쿼리 효율성** | 쿼리 실행 시간 < 2초 (1M 행) | 25점 |
| **분석 품질** | 인사이트 > 3건/월 + 근거 명확 | 25점 |
| **대시보드 품질** | 갱신 자동화 + 접근성 | 20점 |
| **보고 정시율** | 주간 보고 월요 09:00까지 | 15점 |
| **데이터 정확성** | 검증 오류 < 0.5% | 15점 |

**월간 목표:** 90점 이상

**신규 항목 (2026-06):**
- ✅ KPI 자동화 (cron 기반 일일 계산)
- ✅ 이상 탐지 (Anomaly Detection) 규칙 정의

---

### 2.3 평가자/QA 전문가 (Evaluator)

**핵심 기술:**
- Manual Testing (설계서 기반)
- Automated Testing (Jest/Playwright)
- 접근성 평가 (WCAG AA)
- 성능 분석 (Lighthouse, WebPageTest)

**월간 평가 항목:**

| 항목 | 기준 | 점수 |
|------|------|------|
| **기능 검증** | 테스트 케이스 작성 > 50건 | 25점 |
| **버그 탐지** | 중요도별 버그 리포팅 정확성 | 25점 |
| **성능 감시** | Lighthouse 점수 추적 + 개선안 | 20점 |
| **접근성** | WCAG AA 위반사항 0건 | 15점 |
| **문서화** | 테스트 케이스 문서 완성도 | 15점 |

**월간 목표:** 90점 이상

**신규 항목 (2026-06):**
- ✅ 병렬 평가 자동화 (여러 프로젝트 동시)
- ✅ 회귀 테스트 (이전 버전 대비 품질 검증)

---

### 2.4 DevOps / 자동화 전문가 (Automation-Specialist)

**핵심 기술:**
- Bash/Shell scripting
- GitHub Actions
- Docker (선택)
- Monitoring & Alerting

**월간 평가 항목:**

| 항목 | 기준 | 점수 |
|------|------|------|
| **자동화 안정성** | Cron 실행률 > 95% | 30점 |
| **인시던트 대응** | 장애 감지 시간 < 5분 | 25점 |
| **문서화** | 모든 자동화 스크립트 문서화 | 20점 |
| **비용 효율** | 운영 비용 추적 + 최적화 제안 | 15점 |
| **보안** | 환경변수 보안 + 접근 제어 | 10점 |

**월간 목표:** 90점 이상

**신규 항목 (2026-06):**
- ✅ Memory Automation Phase 2 (메시지 수집/중복 검출/신뢰도 계산)
- ✅ 모니터링 대시보드 (팀 가시성)

---

### 2.5 플래너/프로젝트 매니저 (Planner)

**핵심 기술:**
- 프로젝트 관리 (Timeline, Dependencies, Risks)
- 설계 문서 작성 (명세, 와이어프레임)
- 우선순위 결정 (비즈니스 임팩트)
- 팀 조율

**월간 평가 항목:**

| 항목 | 기준 | 점수 |
|------|------|------|
| **일정 정시율** | 예정 대비 실제 +/- 5% | 25점 |
| **설계 완성도** | 설계 > 구현 시간 비율 < 30% | 25점 |
| **위험 관리** | 블로킹 > 2일 전 예측 | 20점 |
| **팀 만족도** | 명확한 요구사항 전달 | 15점 |
| **문서화** | 로드맵 + 마일스톤 정확도 | 15점 |

**월간 목표:** 90점 이상

**신규 항목 (2026-06):**
- ✅ Phase 2/3 병렬화 계획 (6개 프로젝트)
- ✅ 크리티컬 경로 분석 (CPM)

---

## 3. 기술 속도 지수 (TVI) 상세

### 3.1 2026-05 → 2026-06 변화

```
2026-05: TVI 3.5
├─ React 18: 3.0 (안정적)
├─ Next.js 14: 4.0 (App Router 공격적)
├─ TypeScript 5: 3.5 (strict mode)
├─ Supabase: 4.0 (신기술, 안정)
├─ Node.js 22: 3.8 (최신 LTS)
├─ GitHub Actions: 3.5 (성숙)
└─ Memory Automation: 3.0 (신규 개발)

2026-06: TVI 3.8 (+0.3)
├─ React 18: 3.0 (지속)
├─ Next.js 14: 4.0 (지속)
├─ TypeScript 5: 3.5 (지속)
├─ Supabase + RLS: 4.0 (강화)
├─ Node.js 22: 3.8 (지속)
├─ GitHub Actions CI/CD: 3.8 (고도화) ← +0.3
├─ Memory Automation Phase 2: 4.0 (구현 중) ← 신규 +0.5 offset
├─ DevOps 모니터링: 3.8 (신규) ← +0.2
├─ React Query: 3.5 (도입) ← +0.3
└─ E2E 테스트: 3.2 (평가 중)

평균 상향: +0.3 (DevOps 고도화 + CI/CD 강화)
```

### 3.2 TVI 해석

**3.8 점수 의미:**
- ✅ 공격적 신기술 도입 (Next.js, Supabase RLS, Memory Automation)
- ✅ 안정성 확보 (TypeScript, Jest, RLS)
- ✅ DevOps 역량 강화 (CI/CD 자동화, 모니터링)
- 🟡 위험: 소규모 팀에서 관리할 기술 스택이 증가 중
- 🟡 권고: E2E 테스트/모니터링 도입 속도 조절

---

## 4. 6월 신규 기술 선택

### 4.1 도입 예정 (✅ 필수)

| 기술 | 용도 | 예상 영향 | 담당 |
|------|------|---------|------|
| React Query 5.x | 서버 상태 관리 | 성능 +20% | Web-Builder |
| GitHub Actions Advanced | Matrix builds, reusable workflows | 배포 시간 -30% | DevOps |
| Playwright | E2E 테스트 | 회귀 테스트 자동화 | Evaluator |
| Sentry (평가) | 에러 추적 | 버그 탐지 속도 +50% | DevOps |

### 4.2 검토 중 (🟡 선택)

| 기술 | 용도 | 이유 | 결정 시기 |
|------|------|-----|---------|
| Docker | 로컬 개발 일관성 | Memory Automation 컨테이너화 | 2026-06-15 |
| tRPC | 타입안전 API | 소규모 팀에 과할 수 있음 | 2026-06-30 |
| Redis | 캐싱 | 필요성 검증 필요 | 2026-06-20 |
| GraphQL | API 유연성 | REST 충분, 나중에 검토 | 2026-07 |

### 4.3 폐기 (🔴 미사용)

| 기술 | 이유 |
|------|------|
| Redux | Context + Zustand로 충분 |
| Webpack (bare) | Next.js 내장 번들러 사용 |
| REST + XML | JSON 표준화 |

---

## 5. 팀 알림 & 커뮤니케이션

### 5.1 개발팀 공지 사항

**📢 2026년 6월 기술 평가 기준 확정**

안녕하세요, 개발팀입니다.

6월 기술 평가 기준이 확정되었습니다. 주요 변화는 다음과 같습니다:

**🎯 주요 변화:**
1. **기술 속도 지수(TVI): 3.5 → 3.8** (+0.3 상향)
   - DevOps 자동화 고도화
   - Memory Automation Phase 2 구현
   - React Query + E2E 테스트 도입

2. **웹개발자 신규 평가항목:**
   - React Query 도입 (데이터 페칭)
   - Playwright E2E 테스트 시작 (주요 흐름)
   - 성능 기준 Lighthouse > 85점

3. **테스트 커버리지 상향:**
   - 목표: > 70% → > 80%
   - 회귀 테스트 자동화 (Evaluator 주도)

4. **DevOps 신규 역할:**
   - 모니터링 대시보드 (팀 가시성)
   - Cron 안정성 목표: > 95%
   - 에러 추적 (Sentry 평가)

**⏰ 적용 일정:**
- 즉시: 신규 평가항목 적용 (6월 회고)
- 2026-06-15: React Query + Playwright 필수화
- 2026-06-30: 월간 평가 및 피드백

**📋 상세:** [평가 기준 문서](criteria_v202606.md)

질문이 있으신가요? #general 또는 DM으로 연락주세요.

—비서 AI

---

### 5.2 경영팀 KPI 공지

**📊 2026년 6월 팀 역량 지표**

| 지표 | 목표 | 현황 | 추이 |
|------|------|------|------|
| 기술 속도 지수 (TVI) | 3.8 | 3.8 | ↑ +0.3 |
| 팀 역량 성숙도 | 90점 | 87점 | ↑ +3점 |
| 배포 정시율 | > 95% | 94% | ↓ -1% |
| 버그 밀도 (주당) | < 2건 | 1.5건 | ✅ |
| 기술부채 (코드 리뷰 지적) | < 5건 | 3건 | ✅ |

---

## 6. 추적 및 점검

### 6.1 주간 점검 (매주 월요 09:00)

- [ ] 모든 팀원 평가항목 진도 확인
- [ ] TVI 변동 (신기술 도입/폐기)
- [ ] 위험 신호 감지 (블로킹 > 2일)

### 6.2 월말 평가 (2026-06-30 18:00)

- [ ] 각 팀원 월간 점수 계산 (90점 이상 목표)
- [ ] TVI 최종 확정 (2026-07 기준으로 반영)
- [ ] 신기술 도입 결과 검증
- [ ] 2026-07 기준 수정사항 정리

### 6.3 분기 리뷰 (2026-06-30)

- [ ] Q2 기술 성숙도 평가
- [ ] Q3 기술 로드맵 수립
- [ ] 조직 역량 갭 분석

---

## 부록: 2026-05 대비 변화 요약

### 신규 추가

- ✅ **React Query 5.x** — 데이터 페칭 최적화
- ✅ **GitHub Actions 고도화** — Matrix builds, reusable workflows
- ✅ **Playwright E2E** — 주요 사용자 흐름 테스트
- ✅ **DevOps 모니터링** — 팀 가시성 + 알림
- ✅ **Memory Automation Phase 2** — 메시지 수집/중복/신뢰도 (6월 구현)

### 강화된 항목

- ⚡ **TypeScript strict mode** — 유지 (엄격화 검토)
- ⚡ **RLS (Row-Level Security)** — 필수화
- ⚡ **CI/CD 자동화** — 테스트 커버리지 상향 (70% → 80%)
- ⚡ **성능 기준** — Lighthouse > 85점 (기존 80점)

### 변경 없음

- ✅ React 18, Next.js 14, TypeScript 5
- ✅ Supabase PostgreSQL + Auth
- ✅ Jest + React Testing Library
- ✅ Vercel 배포

---

**작성자:** 비서 AI (Secretary)  
**최종 검증:** 평가자 AI (Evaluator)  
**승인:** 나경태 CEO  
**적용일:** 2026-06-01
