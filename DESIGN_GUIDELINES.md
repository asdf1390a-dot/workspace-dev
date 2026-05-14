# DSC FMS Portal Design Guidelines

**Version:** 1.0  
**Last Updated:** 2026-05-13  
**Status:** Active  
**Scope:** DSC Mannur Plant | Next.js 14 + Supabase | Vercel Deployment

---

## 1. 문서 표준 (Documentation Standards)

### 1.1 마크다운 포맷 (Markdown Format)

**파일 구조:**
- 모든 설계 문서는 `.md` 확장자로 저장
- 파일명: kebab-case (`feature-name.md`, `component-modal.md`)
- 디렉토리: `/docs/design/`, `/docs/components/`로 분류

**마크다운 규칙:**
- H1 (`#`): 문서 제목 (파일당 1개만)
- H2 (`##`): 주요 섹션 (목차 자동 생성)
- H3 (`###`): 서브섹션
- Code blocks: ` ``` ` + language (예: `tsx`, `sql`)
- 링크: `[텍스트](상대경로)` (절대경로 금지)
- 테이블: 모든 셀 정렬 (가독성)
- 이미지: 상대경로 + alt text 필수 (`![설명](./images/file.png)`)

**Front Matter (필수):**
```markdown
---
title: 기능명
description: 한 줄 설명
author: 작성자
date: YYYY-MM-DD
status: draft|review|approved|deprecated
version: X.Y.Z
---
```

### 1.2 네이밍 규칙 (Naming Conventions)

**컴포넌트:**
- PascalCase (예: `UserProfileCard.tsx`, `DataTableHeader.tsx`)
- 파일명 = 컴포넌트명
- 아이콘: `Icon[Name].tsx` (예: `IconChevronDown.tsx`)

**유틸 함수:**
- camelCase (예: `formatDate.ts`, `calculateMetrics.ts`)
- Hook: `use[Name].ts` (예: `useAssetFilters.ts`)

**API Routes:**
- `/api/v1/[resource]/[action]` (예: `/api/v1/assets/list`, `/api/v1/bm-events/create`)
- HTTP 메서드: GET, POST, PATCH, DELETE만 사용 (PUT 금지)

**DB 테이블:**
- snake_case (예: `production_logs`, `maintenance_schedules`)
- Prefix + underscore: `jig_masters`, `mould_masters`

### 1.3 버전 관리 (Version Control)

**문서 버전 형식:** `MAJOR.MINOR.PATCH`
- `MAJOR`: 재설계 또는 깨지는 변경
- `MINOR`: 기능 추가
- `PATCH`: 설명 명확화, 오타 수정

**변경 로그:**
```markdown
## Changelog

### [1.0.0] - 2026-05-13
- Initial release
- Added 5 core sections

### [0.9.0] - 2026-05-10
- Draft version for review
```

**Deprecated 표시:**
```markdown
⚠️ **DEPRECATED** (as of v1.2.0)
Use [NewComponent](./new-component.md) instead.
```

---

## 2. 리뷰 체크리스트 (Design Review Checklist)

### 2.1 설계 검증 항목 (Design Validation)

**기능 명세 (Feature Specification)**
- [ ] 사용자 스토리 정의됨 (As a... I want... So that...)
- [ ] 모든 엣지 케이스 문서화 (e.g., "빈 상태", "에러 상태", "로딩 중")
- [ ] 데이터 흐름 다이어그램 제공
- [ ] 예상 오류 처리 방식 기술

**UI/UX**
- [ ] 와이어프레임 또는 Figma 링크 제공
- [ ] 모바일/태블릿/데스크톱 레이아웃 검증
- [ ] 다크모드 대응 확인 (if applicable)
- [ ] 토스트/모달/알림 메시지 미리보기

**데이터 구조**
- [ ] Supabase 테이블/컬럼 설계 확정
- [ ] 외래키 관계 명시
- [ ] Row-level security (RLS) 정책 정의됨
- [ ] 마이그레이션 스크립트 준비됨

### 2.2 성능 검증 (Performance Validation)

**번들 크기:**
- [ ] 새 의존성 크기 < 50KB (gzipped)
- [ ] 큰 라이브러리는 lazy-loading 검토
- [ ] Tree-shaking 확인 (불필요 코드 제거)

**렌더링:**
- [ ] 초기 로드 < 3s (Lighthouse 기준)
- [ ] 상호작용까지의 시간(TTI) < 5s
- [ ] 주요 화면 3회 반복 로딩 시 평균값 측정
- [ ] 대용량 목록(1000+행)은 가상화(virtualization) 적용

**API:**
- [ ] 응답 시간 < 500ms (p95)
- [ ] 쿼리 성능 검증 (EXPLAIN ANALYZE)
- [ ] N+1 쿼리 문제 없음

### 2.3 보안 검증 (Security Validation)

- [ ] 인증/인가 흐름 검증 (JWT, session)
- [ ] SQL injection, XSS, CSRF 방어 확인
- [ ] 민감 데이터(암호, 토큰) 클라이언트 저장 금지
- [ ] API 요청에 CSRF 토큰 포함
- [ ] Rate limiting 설정 확인

### 2.4 접근성 검증 (Accessibility Validation)

- [ ] WCAG 2.1 AA 레벨 준수 (아래 섹션 참조)
- [ ] 키보드 네비게이션 완전 지원
- [ ] 스크린리더 테스트 수행 (NVDA, JAWS)
- [ ] 색상 대비 >= 4.5:1 (일반 텍스트)
- [ ] alt text 모든 이미지에 제공

---

## 3. 컴포넌트 가이드 (Component Library Standards)

### 3.1 DSC FMS UI 패턴

**기본 레이아웃:**
- **상단바 (Header):** 로고, 현재 페이지명, 사용자 메뉴 (프로필, 로그아웃)
- **좌측 네비게이션 (Sidebar):** 5개 주요 메뉴 (대시보드, 자산, BM, 보전, 보고서)
  - 접기/펼치기 기능 (모바일: 기본 접힘)
- **메인 콘텐츠:** 최대 너비 1200px, 좌우 패딩 16px
- **푸터:** 버전, 마지막 업데이트, 고객지원 링크

**색상 팔레트:**
- Primary: `#2563eb` (파란색 - 핵심 액션)
- Success: `#16a34a` (녹색 - 완료, 정상)
- Warning: `#ea580c` (주황색 - 주의)
- Danger: `#dc2626` (빨강 - 에러, 중단)
- Neutral: `#6b7280` (회색 - 보조 정보)

**타이포그래피:**
- Heading 1 (H1): 32px, bold (페이지 제목)
- Heading 2 (H2): 24px, bold (섹션 제목)
- Body: 14px, regular (본문)
- Label: 12px, medium (폼 레이블, 태그)
- Code: Mono 12px (기술 정보)

### 3.2 재사용 가능한 컴포넌트 (Reusable Components)

**폼 컴포넌트:**
| 컴포넌트 | 용도 | 필수 props |
|---------|------|----------|
| `FormInput` | 텍스트/숫자 입력 | `label`, `name`, `type` |
| `FormSelect` | 드롭다운 선택 | `label`, `options` |
| `FormCheckbox` | 단일/다중 선택 | `label`, `value` |
| `FormDatePicker` | 날짜 선택 | `label`, `format` |
| `FormButton` | 제출/초기화 버튼 | `type`, `label` |

**데이터 표시:**
| 컴포넌트 | 용도 | 필수 props |
|---------|------|----------|
| `DataTable` | 정렬/필터링 가능 테이블 | `columns`, `rows` |
| `DataCard` | KPI/메트릭 카드 | `title`, `value`, `icon` |
| `DataChart` | 차트 (라인/바/파이) | `type`, `data` |
| `EmptyState` | 빈 목록 상태 | `icon`, `title`, `action` |
| `Pagination` | 페이지네이션 | `total`, `current`, `onChange` |

**모달/오버레이:**
| 컴포넌트 | 용도 | 필수 props |
|---------|------|----------|
| `Modal` | 일반 모달 | `title`, `children`, `onClose` |
| `ConfirmDialog` | 확인 다이얼로그 | `message`, `onConfirm`, `onCancel` |
| `Toast` | 알림 토스트 | `message`, `type` (success/error/info) |

**컴포넌트 작성 체크리스트:**
- [ ] Props 타입 정의 (TypeScript)
- [ ] 기본값(defaults) 명시
- [ ] Storybook 스토리 작성
- [ ] 사용 예제 제공
- [ ] 주석(JSDoc) 포함
- [ ] 라이트/다크 모드 모두 테스트

### 3.3 컴포넌트 문서 템플릿

```markdown
# ComponentName

**설명:** 한 줄 설명

**위치:** `src/components/ComponentName.tsx`

## Props

| Prop | Type | Default | Required | 설명 |
|------|------|---------|----------|------|
| `label` | string | - | Yes | 컴포넌트 레이블 |
| `value` | string | '' | No | 현재값 |
| `onChange` | function | - | Yes | 변경 콜백 |

## 사용 예제

\`\`\`tsx
import ComponentName from '@/components/ComponentName';

export default function Page() {
  return (
    <ComponentName label="입력" onChange={(val) => console.log(val)} />
  );
}
\`\`\`

## 상태 관리

- **로딩:** `isLoading` prop 시 스피너 표시
- **에러:** `error` prop 시 빨간 테두리 + 에러 메시지
- **비활성:** `disabled` prop 시 회색 처리

## 접근성

- 폼 입력: `<label htmlFor={id}>` 연결
- 버튼: `aria-label` 포함
- 포커스: `:focus-visible` 스타일 제공
```

---

## 4. 접근성 기준 (Accessibility Standards)

### 4.1 WCAG 2.1 AA 준수

**수준별 요구사항:**
| 기준 | 레벨 | 적용 | 예시 |
|------|------|------|------|
| 색상 대비 (Contrast) | AA | 4.5:1 | 검은 텍스트(#000) + 흰 배경(#fff) = 21:1 ✓ |
| 글자 크기 | AA | >=12px | 본문 14px, 라벨 12px ✓ |
| 포커스 표시 | AA | 명시적 | `:focus-visible { outline: 2px solid #2563eb; }` |
| 폼 레이블 | A | 명시적 | `<label htmlFor="input-id">` 필수 |
| 이미지 alt | A | 의미 전달 | `<img alt="자산 상태: 정상 운영" />` |

### 4.2 키보드 네비게이션 (Keyboard Navigation)

**필수 구현:**
- [ ] `Tab`: 포커스 순서 논리적 좌→우, 위→아래
- [ ] `Shift+Tab`: 역방향 네비게이션
- [ ] `Enter`: 버튼 활성화, 폼 제출
- [ ] `Space`: 체크박스/라디오 선택
- [ ] `Escape`: 모달/드롭다운 닫기
- [ ] `Arrow Keys`: 목록/메뉴 항목 선택

**구현 예:**
```tsx
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  tabIndex={0}
>
  Click me
</button>
```

### 4.3 스크린리더 지원 (Screen Reader Support)

**ARIA Roles & Attributes:**
- `role="button"`: 버튼 역할
- `aria-label="설명"`: 요소의 접근성 이름
- `aria-describedby="id"`: 상세 설명 연결
- `aria-hidden="true"`: 스크린리더에서 숨김 (장식용 요소)
- `aria-live="polite"`: 동적 업데이트 알림
- `aria-expanded="true/false"`: 펼침/닫힘 상태

**구현 예:**
```tsx
<div
  role="alert"
  aria-live="assertive"
  aria-label="에러 알림"
>
  필드를 정확히 입력해주세요
</div>
```

### 4.4 모바일 & 터치 접근성

- [ ] 터치 영역 최소 44x44px
- [ ] 손가락 크기 고려 (padding 충분)
- [ ] 더블탭 허용하되 준비 시간 300ms 제공
- [ ] 줌 허용 (viewport `user-scalable=yes`)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes" />
```

### 4.5 테스트 도구 & 프로세스

**자동 테스트:**
- axe DevTools (브라우저 확장)
- Lighthouse Accessibility 스코어 >= 90
- Jest + react-testing-library 접근성 쿼리 (`getByRole`, `getByLabelText`)

**수동 테스트:**
- NVDA (Windows) 또는 JAWS (유료)
- Safari VoiceOver (Mac/iOS)
- 테스트 수행: 마우스 없이 Tab만으로 전체 기능 완료 가능한지 확인

**테스트 체크리스트:**
- [ ] 전체 폼 제출 (키보드만 사용)
- [ ] 모든 모달 열고 닫기
- [ ] 테이블 행 선택 & 정렬
- [ ] 오류 메시지 스크린리더 인식 확인

---

## 5. 성능 벤치마크 (Performance Benchmarks)

### 5.1 번들 크기 (Bundle Size)

**목표:**
- 초기 번들(JS + CSS): < 200KB (gzipped)
- 페이지별 청크: < 100KB each
- 외부 라이브러리: 사전 승인 필요

**측정 방법:**
```bash
# Next.js 빌드 분석
npm run build
# 자동 생성: .next/analyze/index.html (webpack-bundle-analyzer)
```

**라이브러리 승인 기준:**
| 라이브러리 | 크기(gzip) | 필수/선택 | 비고 |
|----------|---------|--------|------|
| React | 42KB | 필수 | - |
| Next.js | 85KB | 필수 | - |
| Supabase JS | 28KB | 필수 | - |
| date-fns | 12KB | 선택 | Day.js 권장 (2KB) |
| axios | 15KB | 선택 | fetch 사용 권장 (0KB) |

### 5.2 렌더링 성능 (Rendering Performance)

**Core Web Vitals 목표:**

| 메트릭 | 목표값 | 기준 | 측정방법 |
|-------|--------|------|---------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 페이지 로드 시작 → 큰 콘텐츠 표시 | Lighthouse, PageSpeed Insights |
| **FID** (First Input Delay) | < 100ms | 사용자 입력 → 브라우저 반응 | Real User Monitoring (Vercel Analytics) |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 레이아웃 이동 누적 점수 | Lighthouse |

**최적화 전략:**
1. **LCP 개선:**
   - 이미지 최적화 (next/image 사용)
   - 중요 CSS 인라인 처리
   - 서버 응답 시간 < 600ms
   - 큰 JavaScript 분할

2. **FID 개선:**
   - 메인 스레드 작업 분산 (Web Workers)
   - 무거운 계산 lazy-load
   - 이벤트 리스너 최소화

3. **CLS 개선:**
   - 이미지/비디오 크기 고정
   - 폰트 로드 최적화 (font-display: swap)
   - 동적 콘텐츠는 예약 영역 할당

### 5.3 API & DB 성능 (API & Database Performance)

**응답 시간 목표:**

| 엔드포인트 | p50 | p95 | p99 | 캐시 |
|----------|-----|-----|-----|------|
| GET /api/v1/assets/list | 100ms | 300ms | 500ms | 5min |
| POST /api/v1/bm-events/create | 200ms | 500ms | 1s | - |
| GET /api/v1/reports/monthly | 500ms | 2s | 5s | 1hr |

**DB 최적화:**
- [ ] 인덱스: 모든 WHERE/JOIN/ORDER BY 컬럼
- [ ] 쿼리 최적화: EXPLAIN ANALYZE로 검증
- [ ] 배치 작업: 시간대 분산 (야간 03:00 KST)
- [ ] 읽기 복제본: 보고서 쿼리 분리

**캐싱 전략:**
- 정적 자산: CDN (Vercel Edge)
- API 응답: Redis (5-60분)
- DB 쿼리: Supabase RLS + 애플리케이션 캐시

### 5.4 모바일 성능 (Mobile Performance)

**네트워크 시뮬레이션:**
- 테스트: 4G (16Mbps down, 4Mbps up) + 30ms 레이턴시
- 도구: Chrome DevTools → Throttling 설정

**모바일 최적화:**
- 초기 로드 < 5s (4G 기준)
- 이미지 responsive (srcset 사용)
- 터치 인터랙션 지연 < 100ms
- 오프라인 지원: Service Worker

### 5.5 성능 모니터링 & 보고

**도구:**
1. **Lighthouse** (자동 CI): `npm run lighthouse`
2. **Vercel Analytics**: 실시간 사용자 성능 지표
3. **Sentry**: 에러 및 성능 이상 탐지

**월간 리포트:**
```markdown
## 2026-05 Performance Report

| 메트릭 | 2026-04 | 2026-05 | 변화 | 상태 |
|-------|--------|--------|------|------|
| LCP | 2.1s | 1.9s | ↓ 0.2s | 🟢 |
| FID | 80ms | 75ms | ↓ 5ms | 🟢 |
| CLS | 0.08 | 0.07 | ↓ 0.01 | 🟢 |
| Bundle | 195KB | 188KB | ↓ 7KB | 🟢 |
```

**성능 회귀 감지:**
- 메트릭 5% 악화 → 자동 경고
- 배포 전 Lighthouse 스코어 >= 85 필수
- 주간 성능 리뷰 미팅

---

## 부록 (Appendix)

### A. 도구 & 리소스

| 도구 | 목적 | 사용처 |
|------|------|--------|
| Figma | 디자인 목업 | 개발 전 UI/UX 설계 |
| Storybook | 컴포넌트 카탈로그 | 컴포넌트 개발 & 문서화 |
| Playwright | E2E 테스트 | 성능 & 접근성 자동 검증 |
| Jest | 유닛 테스트 | 로직 검증 |
| axe DevTools | 접근성 스캔 | WCAG 위반 자동 감지 |

### B. 거버넌스

**설계 승인 프로세스:**
1. **웹개발자** → 설계 초안 작성
2. **플레너** → 요구사항/UX 검증
3. **평가자** → 성능/접근성 테스트
4. **팀리드** → 최종 승인

**리뷰 주기:** 
- 새 기능: 개발 전 1회
- 주요 변경: 2주마다
- 성능/보안: 월 1회

### C. FAQ

**Q: 성능 벤치마크를 충족하지 못하면?**
A: 배포 차단. 최적화 계획 수립 후 재검증 필수.

**Q: 접근성 A 레벨과 AA의 차이?**
A: AA가 더 엄격. 색상 대비 4.5:1 (AA) vs 3:1 (A). DSC FMS는 AA 준수.

**Q: 외부 라이브러리 추가 가능?**
A: gzipped < 50KB 확인 후 Slack #design-review에서 승인 받으면 가능.

---

**Document Owner:** DSC FMS Design Team  
**Last Review:** 2026-05-13  
**Next Review:** 2026-06-13  
**Contact:** design-team@dsc-mannur.local
