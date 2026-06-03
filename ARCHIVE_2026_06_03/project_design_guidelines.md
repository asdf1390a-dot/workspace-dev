---
name: DSC FMS Portal Design Guidelines
description: 문서/컴포넌트 표준 + 네이밍 규칙 + 설계 리뷰 체크리스트 + 코드 스타일
type: reference
relatedFiles: DESIGN_GUIDELINES.md
---

# DSC FMS Portal Design Guidelines v1.0

**Version:** 1.0  
**Last Updated:** 2026-05-13  
**Status:** Active  
**Scope:** DSC Mannur Plant | Next.js 14 + Supabase | Vercel Deployment

## 1. 문서 표준 (Documentation Standards)

### 1.1 마크다운 포맷

**파일 구조:**
- 확장자: `.md`
- 파일명: kebab-case (`feature-name.md`, `component-modal.md`)
- 디렉토리: `/docs/design/`, `/docs/components/`

**마크다운 규칙:**
- H1 (`#`): 문서 제목 (파일당 1개만)
- H2 (`##`): 주요 섹션 (목차 자동 생성)
- H3 (`###`): 서브섹션
- Code blocks: ` ```언어 ` (예: tsx, sql)
- 링크: `[텍스트](상대경로)` (절대경로 금지)
- 테이블: 모든 셀 정렬 (가독성)
- 이미지: 상대경로 + alt text (![설명](./images/file.png))

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

### 1.2 네이밍 규칙

**컴포넌트:**
- PascalCase (예: `UserProfileCard.tsx`, `DataTableHeader.tsx`)
- 파일명 = 컴포넌트명
- 아이콘: `Icon[Name].tsx` (예: `IconChevronDown.tsx`)

**유틸 함수:**
- camelCase (예: `formatDate.ts`, `calculateMetrics.ts`)
- Hook: `use[Name].ts` (예: `useAssetFilters.ts`)

**API Routes:**
- `/api/v1/[resource]/[action]` (예: `/api/v1/assets/list`)
- HTTP 메서드: GET, POST, PATCH, DELETE만 사용 (PUT 금지)

**DB 테이블:**
- snake_case (예: `production_logs`, `maintenance_schedules`)
- Prefix + underscore: `jig_masters`, `mould_masters`

### 1.3 버전 관리

**문서 버전:** `MAJOR.MINOR.PATCH`
- MAJOR: 재설계 또는 깨지는 변경
- MINOR: 기능 추가
- PATCH: 설명 명확화, 오타

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

## 2. 리뷰 체크리스트 (Design Review Checklist)

### 2.1 설계 검증 항목

**기능 명세:**
- [ ] 사용자 스토리 정의됨 (As a... I want... So that...)
- [ ] 모든 엣지 케이스 문서화 ("빈 상태", "에러 상태", "로딩 중")
- [ ] 데이터 흐름 다이어그램 제공
- [ ] 예상 오류 처리 방식 기술

**UI/UX:**
- [ ] 와이어프레임 또는 Figma 링크 제공
- [ ] 모바일/태블릿/데스크톱 레이아웃 검증
- [ ] 다크모드 대응 확인 (if applicable)
- [ ] 토스트/모달/알림 메시지 미리보기

## 3. 코드 스타일 (Code Style)

### 3.1 TypeScript

**기본 규칙:**
- strict 모드 활성화
- 암시적 any 금지
- JSDoc 주석은 공개 API만

**타입 정의:**
```typescript
// 좋은 예
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// 피할 것
type UserProfile = {
  id: any;
  name: string;
  email?: string;
}
```

### 3.2 React Components

**함수형 컴포넌트만 사용:**
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### 3.3 파일 조직

**컴포넌트 디렉토리 구조:**
```
components/
├── common/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── assets/
│   ├── AssetList.tsx
│   ├── AssetDetail.tsx
│   └── AssetForm.tsx
└── hooks/
    └── useAssetFilters.ts
```

## 상태
✅ **Active** — 모든 신규 개발에 적용
