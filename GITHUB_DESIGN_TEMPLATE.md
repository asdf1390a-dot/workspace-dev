# GitHub 설계 문서 템플릿

> 목적: 새로운 기능, 프로젝트, 또는 주요 변경사항을 GitHub 저장소에 문서화하기 위한 표준 템플릿

**사용 대상:** 설계자, 플레너, 기술 리더  
**문서 위치:** `/docs/design/` 또는 Wiki 폭지  
**대상 읽자:** 개발자, QA, PM, 이해관계자

---

## 📋 GitHub 저장소 문서 구조

```
your-repo/
├── README.md                    ← 프로젝트 소개 (시작점)
├── ARCHITECTURE.md              ← 기술 아키텍처
├── DESIGN.md                    ← 이 파일 (설계 문서)
├── docs/
│   ├── setup.md                 ← 개발 환경 설정
│   ├── design/
│   │   ├── ui-system.md         ← 디자인 시스템
│   │   ├── components.md        ← 컴포넌트 명세
│   │   ├── pages.md             ← 페이지 와이어프레임
│   │   └── user-flows.md        ← 사용자 흐름
│   ├── api/
│   │   ├── endpoints.md         ← API 문서
│   │   └── schemas.md           ← 데이터 스키마
│   └── deployment/
│       └── deployment.md        ← 배포 가이드
├── .github/
│   ├── CONTRIBUTING.md          ← 기여 가이드
│   ├── CODE_OF_CONDUCT.md       ← 행동 강령
│   └── ISSUE_TEMPLATE/          ← 이슈 템플릿
└── wiki/
    ├── Home.md                  ← Wiki 홈
    ├── Roadmap.md               ← 로드맵
    └── FAQ.md                   ← 자주 묻는 질문
```

---

## 📐 설계 문서 템플릿 (DESIGN.md)

### 헤더 정보

```markdown
# [프로젝트명] 설계 문서

> **상태:** 초안 | 검토 중 | 최종 | 보관  
> **작성일:** YYYY-MM-DD  
> **마지막 수정:** YYYY-MM-DD  
> **담당자:** @github-username  
> **리뷰어:** @reviewer1, @reviewer2

---

## 📋 목차

1. [개요](#1-개요)
2. [요구사항](#2-요구사항)
3. [아키텍처](#3-아키텍처)
4. [설계](#4-설계)
5. [구현](#5-구현)
6. [테스트](#6-테스트)
7. [배포](#7-배포)
```

---

### 1. 개요 섹션

```markdown
## 1. 개요

### 1.1 목표
- [ ] 기능 1
- [ ] 기능 2
- [ ] 기능 3

**핵심 가치:**
| 항목 | 설명 |
|------|------|
| **성과 1** | 설명 |
| **성과 2** | 설명 |

### 1.2 범위

**포함사항:**
- 기능 A
- 기능 B

**제외사항:**
- 기능 X (향후 Phase 2)
- 기능 Y (기술적 제약)

### 1.3 성공 기준

- [ ] 모바일에서 성능 점수 80 이상 (Lighthouse)
- [ ] API 응답 시간 < 500ms (p95)
- [ ] 테스트 커버리지 > 80%
- [ ] 접근성 WCAG 2.1 AA 준수
```

---

### 2. 요구사항 섹션

```markdown
## 2. 요구사항

### 2.1 기능 요구사항 (FR)

**FR-001: [기능명]**
- ID: FR-001
- 설명: 사용자는 [액션]을 할 수 있어야 한다.
- 우선순위: 🔴 High / 🟡 Medium / 🟢 Low
- 이해관계자: Product, Engineering, Design
- 수용 조건:
  - [ ] Given [상황], When [액션], Then [결과]
  - [ ] Given [상황], When [액션], Then [결과]

### 2.2 비기능 요구사항 (NFR)

| NFR | 목표 |
|-----|------|
| **성능** | 페이지 로드 < 2초 (3G) |
| **확장성** | 일일 100K DAU 지원 |
| **가용성** | 99.9% uptime |
| **보안** | OWASP Top 10 완화 |
| **접근성** | WCAG 2.1 AA |
```

---

### 3. 아키텍처 섹션

```markdown
## 3. 아키텍처

### 3.1 시스템 다이어그램

```
┌─────────────────┐
│   Client App    │
│  (Next.js 14)   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  API Gateway    │
│  (Next.js API)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  Supabase Backend        │
│  ├── PostgreSQL          │
│  ├── Auth                │
│  └── Realtime (WebSocket)│
└──────────────────────────┘
```

### 3.2 기술 스택

| 계층 | 기술 | 버전 | 사유 |
|------|------|------|------|
| Frontend | Next.js | 14 | SSR + 성능 |
| Frontend | React | 18 | 컴포넌트 기반 |
| Styling | CSS Modules | - | 스코프 격리 |
| Backend | Supabase | Latest | 관리형 PostgreSQL |
| Database | PostgreSQL | 14+ | 관계형 데이터 |
| Auth | Supabase Auth | OAuth2 | SSO 지원 |
| Hosting | Vercel | - | Next.js 최적화 |

### 3.3 데이터 흐름

```
User Input 
  ↓
React Component 
  ↓
API Route (/api/...) 
  ↓
Supabase Client 
  ↓
PostgreSQL 
  ↓
RLS Policies 
  ↓
Response → UI Update
```
```

---

### 4. 설계 섹션

```markdown
## 4. 설계

### 4.1 사용자 흐름

**Scenario: [사용자가 X를 하려고 함]**

```
1. 사용자가 [페이지] 방문
2. [요소]를 클릭
3. [모달/폼] 표시
4. 사용자가 정보 입력
5. [버튼] 클릭
6. API 호출
7. 성공 → [결과 화면] 표시
```

### 4.2 와이어프레임

**페이지: [페이지명]**

```
┌──────────────────────────────────┐
│ Header                           │
├──────────────────────────────────┤
│                                  │
│ Left Sidebar   │   Main Content  │
│                │                 │
│ [Menu Items]   │ [Page Content]  │
│                │                 │
├──────────────────────────────────┤
│ Footer                           │
└──────────────────────────────────┘
```

### 4.3 컴포넌트 구조

```
Page
├── Header
│   ├── Logo
│   ├── Nav
│   └── UserMenu
├── Sidebar
│   └── MenuItems
├── Main
│   ├── PageTitle
│   ├── Breadcrumb
│   ├── Content
│   │   ├── Card
│   │   │   ├── CardHeader
│   │   │   ├── CardBody
│   │   │   └── CardFooter
│   │   └── Button
│   └── Pagination
└── Footer
```

### 4.4 디자인 시스템

**색상 팔레트:**
| 용도 | 색상 | Hex |
|------|------|-----|
| 배경 | 어두운 슬레이트 | `#0f172a` |
| 텍스트 | 밝은 슬레이트 | `#f8fafc` |
| 악센트 | 사이안 | `#06b6d4` |
| 에러 | 빨강 | `#ef4444` |

**타이포그래피:**
| 요소 | 크기 | 가중치 |
|------|------|--------|
| H1 | 32px | 700 |
| Body | 14px | 400 |
| Label | 11px | 600 |

**간격 시스템:**
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
```

### 4.5 상태 관리

**전역 상태:**
- 사용자 인증 (Context API 또는 Redux)
- 앱 테마 (다크/라이트)
- 알림 메시지 (Toast)

**지역 상태:**
- 폼 입력 (useState)
- 로딩 상태 (useState)
- 모달 열기/닫기 (useState)
```

---

### 5. 구현 섹션

```markdown
## 5. 구현

### 5.1 폴더 구조

```
src/
├── components/          ← 재사용 가능한 컴포넌트
│   ├── ui/              ← 기본 UI 요소
│   │   ├── Button.js
│   │   ├── Card.js
│   │   └── Input.js
│   └── features/        ← 기능 컴포넌트
│       └── [FeatureName]/
├── pages/               ← Next.js 페이지
│   ├── index.js
│   ├── [feature]/
│   └── api/
├── lib/                 ← 유틸리티
│   ├── api.js
│   ├── hooks.js
│   └── constants.js
├── styles/              ← 글로벌 스타일
│   └── globals.css
├── types/               ← TypeScript 타입 (선택)
│   └── index.ts
└── public/              ← 정적 자산
```

### 5.2 주요 파일 체크리스트

- [ ] `components/Button.js` — 기본 버튼 컴포넌트
- [ ] `pages/index.js` — 홈 페이지
- [ ] `pages/api/[resource].js` — API 엔드포인트
- [ ] `lib/api.js` — Supabase 클라이언트
- [ ] `styles/globals.css` — 글로벌 스타일

### 5.3 개발 단계

**Week 1: 준비**
- 저장소 설정
- 개발 환경 구성
- 기본 페이지 레이아웃

**Week 2: 핵심 기능**
- 컴포넌트 구현
- API 엔드포인트
- 데이터 연동

**Week 3: 완성**
- 에러 처리
- 로딩 상태
- 테스트
```

---

### 6. 테스트 섹션

```markdown
## 6. 테스트

### 6.1 단위 테스트

**도구:** Jest + React Testing Library

```javascript
describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should call onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 6.2 통합 테스트

**시나리오: 사용자가 폼을 제출**

```javascript
test('user can submit form', async () => {
  render(<SignupForm />);
  
  // 입력 필드 채우기
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'user@example.com' }
  });
  
  // 제출 버튼 클릭
  fireEvent.click(screen.getByText('Sign Up'));
  
  // 성공 메시지 확인
  await waitFor(() => {
    expect(screen.getByText('Account created!')).toBeInTheDocument();
  });
});
```

### 6.3 E2E 테스트

**도구:** Playwright 또는 Cypress

```javascript
test('user can create and view account', async ({ page }) => {
  await page.goto('https://app.example.com');
  await page.click('text=Sign Up');
  await page.fill('[name=email]', 'user@example.com');
  await page.click('button:has-text("Create Account")');
  await expect(page).toHaveURL('https://app.example.com/dashboard');
});
```

### 6.4 성능 테스트

- 라이트하우스 점수 80+ 목표
- 코어 웹 바이탈 (CWV) 최적화
- 번들 크기 < 200KB (gzipped)

### 6.5 접근성 테스트

- axe DevTools 스캔
- 키보드 네비게이션
- 스크린 리더 호환성
```

---

### 7. 배포 섹션

```markdown
## 7. 배포

### 7.1 환경별 설정

| 환경 | URL | 용도 |
|------|-----|------|
| Development | localhost:3000 | 개발 |
| Staging | staging.example.com | 검수 |
| Production | example.com | 운영 |

### 7.2 배포 체크리스트

**배포 전:**
- [ ] 모든 테스트 통과
- [ ] 라이트하우스 점수 80+
- [ ] 환경 변수 설정 완료
- [ ] 마이그레이션 테스트

**배포 후:**
- [ ] 모니터링 시작
- [ ] 에러 로그 확인
- [ ] 주요 기능 manual 테스트
- [ ] 성능 메트릭 확인

### 7.3 롤백 계획

```
배포 실패 또는 심각한 버그 발견
  ↓
이전 버전 태그 확인
  ↓
git revert [commit-hash]
  ↓
재배포
```

### 7.4 모니터링

- Sentry (에러 추적)
- Google Analytics (사용자 행동)
- Vercel Analytics (성능)
```

---

## 📚 추가 섹션 (선택)

```markdown
## 부록

### A. 용어 정의

**용어1:** 설명
**용어2:** 설명

### B. 참고 자료

- [링크1](https://example.com)
- [링크2](https://example.com)

### C. 변경 이력

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0 | 2026-05-13 | 초판 작성 |
| 1.1 | 2026-05-15 | 섹션 3 수정 |
```

---

## 🎯 GitHub Wiki 페이지 구조

### Home.md

```markdown
# [프로젝트명] Wiki

👋 **환영합니다!**

- [설계 문서](./Design)
- [개발 가이드](./Development)
- [API 문서](./API)
- [배포 가이드](./Deployment)
- [FAQ](./FAQ)
```

### Development.md

```markdown
# 개발 가이드

## 1. 환경 설정

```bash
git clone https://github.com/...
cd project
npm install
npm run dev
```

## 2. 브랜치 규칙

- `main` — 운영 환경
- `staging` — 검수 환경
- `develop` — 개발 환경
- `feature/[이름]` — 기능 개발
- `fix/[이름]` — 버그 수정

## 3. 커밋 메시지 규칙

```
type(scope): subject

<body>

<footer>
```

**타입:**
- feat: 새 기능
- fix: 버그 수정
- docs: 문서
- style: 코드 스타일
- refactor: 리팩토링
- test: 테스트
- chore: 빌드/의존성
```

---

## ✅ 사용 체크리스트

문서 작성 시 아래를 확인하세요:

- [ ] 헤더 정보 작성 (상태, 날짜, 담당자)
- [ ] 목차 추가
- [ ] 모든 섹션 작성 완료
- [ ] 다이어그램/이미지 포함
- [ ] 링크 검증
- [ ] 스펠링/문법 검토
- [ ] 담당자 리뷰 완료
- [ ] GitHub에 커밋
- [ ] PR에 링크 추가

---

**마지막 수정:** 2026-05-13  
**템플릿 버전:** 1.0
