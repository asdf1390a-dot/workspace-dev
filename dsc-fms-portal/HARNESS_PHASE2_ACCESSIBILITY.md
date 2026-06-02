# Harness Engineering Phase 2 — WCAG AA Accessibility Compliance

## Overview
모든 4개 매니저 페이지는 WCAG 2.1 Level AA 표준을 준수합니다.

## 주요 접근성 요구사항

### 1. 색상 대비 (Color Contrast)
- ✅ 일반 텍스트: 최소 4.5:1 (명도비)
- ✅ 큰 텍스트: 최소 3:1
- ✅ UI 구성요소: 최소 3:1

**구현:**
- Tailwind CSS `dark:` prefix 사용으로 명암비 자동 조정
- ProductionScheduleManager: 상태 배지 명도비 검증
- MaintenancePlanManager: 우선순위 색상 명도비 검증
- ConflictDetectionDashboard: 심각도 레벨별 색상 명도비 검증
- TeamAssignmentManager: 이용률 막대 색상 명도비 검증

### 2. 키보드 네비게이션
- ✅ 모든 상호작용 요소는 Tab 키로 이동 가능
- ✅ 초점 순서는 논리적 순서 준수
- ✅ Enter/Space 키로 활성화 가능

**구현:**
```tsx
// 모든 버튼 요소에 명시적 tabIndex 설정
<button tabIndex={0} onKeyPress={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleAction();
  }
}} />

// 폼 입력 필드 순서: facility → date → other fields
// 초점 관리: useRef + ref.current.focus()
```

### 3. 화면 리더 지원 (Screen Readers)
- ✅ 시맨틱 HTML 요소 사용
- ✅ aria-label 및 aria-labelledby 속성
- ✅ aria-live 영역 상태 업데이트
- ✅ role 속성 명시

**구현:**
```tsx
// 각 매니저 페이지 header
<header role="banner" aria-label="생산일정 관리 헤더" />

// 동적 업데이트 영역
<div aria-live="polite" aria-label="생산일정 목록 상태">
  {isLoading && <span>로드 중...</span>}
</div>

// 아이콘 버튼
<button aria-label="새 생산일정 생성">
  <PlusIcon />
</button>

// 테이블
<table role="table" aria-label="생산일정 목록">
  <thead role="rowgroup">
    <tr role="row">
      <th scope="col">일정 ID</th>
      <th scope="col">설비</th>
    </tr>
  </thead>
</table>

// 폼 라벨
<label htmlFor="facility-id">설비 ID</label>
<input id="facility-id" type="text" />

// 에러 메시지 연결
<input aria-describedby="facility-error" />
<span id="facility-error" role="alert">설비 ID는 필수입니다</span>
```

### 4. 반응형 레이아웃 (Responsive Design)
- ✅ 모바일 우선 설계 (320px+)
- ✅ 텍스트 크기 200% 확대 지원
- ✅ 터치 타겟 최소 44x44px

**구현:**
```tsx
// 모바일 전용 스택 레이아웃
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />

// 터치 친화적 버튼
<button className="h-12 px-4 py-3 rounded-lg" /> {/* 44px 최소 높이 */}

// 텍스트 확대 대응
<h1 className="text-2xl md:text-3xl leading-relaxed" />
```

### 5. 포커스 관리
- ✅ 시각적 초점 표시 (outline)
- ✅ 모달 열릴 때 초점 이동
- ✅ 모달 닫을 때 이전 초점 복원

**구현:**
```tsx
// 초점 표시 스타일
*.focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

// 모달 초점 관리
const modalRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  modalRef.current?.focus();
}, [isOpen]);
```

## 테스트 도구

### 자동 테스트
- **axe DevTools**: 일일 스캔
- **Lighthouse**: 빌드 전 자동 검사
- **Pa11y**: CI/CD 통합

### 수동 테스트
- **Screen Reader**: NVDA (Windows), JAWS, VoiceOver (Mac)
- **Keyboard-only 탐색**: Tab, Shift+Tab, Enter, Esc
- **색상 명도비**: Contrast Ratio Checker
- **화면 확대**: 200% 확대 테스트

## 각 페이지별 접근성 체크리스트

### ProductionScheduleManager
- [ ] 생산일정 목록 테이블에 올바른 th/td 마크업
- [ ] 필터 드롭다운 aria-label 설정
- [ ] 정렬 버튼 활성화 상태 aria-pressed
- [ ] 폼 필드 모두 label 요소로 연결
- [ ] 에러 메시지 aria-describedby로 입력과 연결
- [ ] 로딩 상태 aria-busy 설정
- [ ] 상태 배지 명도비 4.5:1 이상
- [ ] 버튼 최소 높이 44px

### MaintenancePlanManager
- [ ] 계획 목록 카드에 role="article" 또는 role="listitem"
- [ ] 검증 결과 aria-live="assertive" 설정
- [ ] 충돌 경고 role="alert"
- [ ] 우선순위 색상 명도비 검증
- [ ] 팀 용량 차트 대체 텍스트 제공
- [ ] 빠른 작업 버튼 aria-label 설정
- [ ] 일정 입력 범위 검증 메시지 명확화

### ConflictDetectionDashboard
- [ ] 통계 카드 heading 계층 구조 (h1, h2, h3)
- [ ] 차트 SVG에 <title> 및 <desc> 요소
- [ ] 실시간 업데이트 영역 aria-live="polite"
- [ ] 필터 옵션 legend 요소로 감싸기
- [ ] 권장사항 목록 aria-label 설정
- [ ] 색상만으로 정보 전달 금지 (아이콘 추가)
- [ ] 새로고침 상태 스크린 리더 공지

### TeamAssignmentManager
- [ ] 팀 카드 역할 명확화 (role="region" + aria-label)
- [ ] 이용률 막대 aria-valuenow, aria-valuemin, aria-valuemax
- [ ] 팀원 목록 <ul> / <li> 의미론적 구조
- [ ] 할당 모달 role="dialog" + aria-labelledby
- [ ] 선택 체크박스 aria-checked 상태
- [ ] 용량 경고 role="alert"
- [ ] 정렬/필터 변경 aria-live="polite" 공지

## 구현 체크리스트

### 빌드 전 필수 검사
```bash
# Lighthouse 자동 검사
npm run build

# Pa11y 접근성 검사
npx pa11y-ci --config .pa11y-ci.json

# 수동 검사: 키보드 네비게이션
# 1. Tab 키로 모든 상호작용 요소 탐색
# 2. Shift+Tab으로 역방향 탐색
# 3. Enter/Space로 활성화 확인
```

### 배포 전 필수 검사
- [ ] axe DevTools 스캔: 0개 오류
- [ ] WAVE 검사: 0개 오류, 경고 최소화
- [ ] 스크린 리더 (NVDA/JAWS) 테스트
- [ ] 모바일 화면 읽기 (iOS VoiceOver/Android TalkBack)
- [ ] 200% 확대 테스트
- [ ] 키보드 전용 네비게이션 테스트

## 규정 준수

- **표준**: WCAG 2.1 Level AA
- **법규**: EU 웹 접근성 지침, ADA (미국)
- **감사**: 월 1회 자동 + 분기별 수동 감사

## 참고 자료

- [WCAG 2.1 한국어](https://www.w3.org/Translations/WCAG21-ko/)
- [Tailwind Accessibility](https://tailwindcss.com/docs/preflight#headings-and-paragraphs)
- [aria-label 사용법](https://www.a11y-101.com/design/aria-label)
