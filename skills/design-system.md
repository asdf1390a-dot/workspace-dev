# DSC FMS Portal — Design System Guide
> 기준일: 2026-05-12 | 스택: Next.js + 인라인 스타일 + 다크 테마
> 2025-2026 웹 UI 트렌드 기반, 실용적 인라인 스타일 코드 예시 포함

---

## 목차
1. [2025-2026 UI 트렌드 요약](#1-2025-2026-ui-트렌드-요약)
2. [색상 시스템](#2-색상-시스템)
3. [타이포그래피](#3-타이포그래피)
4. [간격 시스템](#4-간격-시스템)
5. [카드 컴포넌트](#5-카드-컴포넌트)
6. [버튼 컴포넌트](#6-버튼-컴포넌트)
7. [입력 폼 컴포넌트](#7-입력-폼-컴포넌트)
8. [배지 컴포넌트](#8-배지-컴포넌트)
9. [네비게이션](#9-네비게이션)
10. [애니메이션 / 트랜지션](#10-애니메이션--트랜지션)
11. [Glassmorphism & 레이어 깊이](#11-glassmorphism--레이어-깊이)
12. [Bento Grid 레이아웃](#12-bento-grid-레이아웃)
13. [모바일 퍼스트 체크리스트](#13-모바일-퍼스트-체크리스트)

---

## 1. 2025-2026 UI 트렌드 요약

| 트렌드 | 2025 상태 | 2026 방향 | DSC 적용 여부 |
|--------|-----------|-----------|--------------|
| Glassmorphism | 과잉 사용 단계 | 절제된 모달/오버레이 한정 | 조건부 적용 |
| Bento Grid | 도입 확산 | 대형 브랜드 표준화 | 대시보드에 적용 |
| 다크 테마 기본값 | 선택 옵션 | 모바일 사용자 82% 선호 | 기본 적용 |
| Micro-interactions | 과장된 움직임 | 목적 중심 미세 피드백 | 필수 적용 |
| 가변 폰트 | 실험적 | 번들 최적화 표준 | Inter/Geist 사용 |
| AI 상태 인디케이터 | 신규 | 투명성 강조 | 필요 시 적용 |
| 도파민 컬러 | 포인트 색상 | 중립 배경 + 강렬한 액센트 | 기존 #ef4444 확장 |

### 핵심 원칙
- **다크 퍼스트**: 라이트 모드는 옵션, 다크가 기본
- **모바일 퍼스트**: 엄지 존(화면 하단 2/3) 중심 설계
- **목적 있는 움직임**: 모든 애니메이션은 상태 변화를 설명해야 함
- **절제된 글래스**: backdrop-filter는 모달, 플로팅 nav에만 한정
- **접근성 AA**: 텍스트 대비 4.5:1 이상 필수

---

## 2. 색상 시스템

### 기반 팔레트 (현재 DSC 색상 확장)

```js
// /lib/colors.js — DSC FMS 색상 토큰
export const colors = {
  // === 배경 레이어 (elevation 시스템) ===
  bg: {
    base:    '#0a0f1e',   // 최하단 배경 (OLED 최적화, 순수 검정 지양)
    surface: '#0f172a',   // 현재 메인 배경 유지
    raised:  '#1e293b',   // 카드, 패널
    overlay: '#263348',   // 드롭다운, 팝오버
    float:   '#2d3c54',   // 툴팁, 최상단 레이어
  },

  // === 텍스트 ===
  text: {
    primary:   '#f1f5f9',  // 메인 텍스트 (순수 흰색 #fff 지양 → 눈부심 감소)
    secondary: '#94a3b8',  // 보조 텍스트, 라벨
    muted:     '#64748b',  // 비활성, 플레이스홀더
    inverse:   '#0f172a',  // 밝은 배경 위 텍스트
  },

  // === 액센트 (브랜드 레드 기반 확장) ===
  accent: {
    red:        '#ef4444',  // 기존 브랜드 컬러 — 위험, 삭제
    redMuted:   '#dc2626',  // 다크 모드 호버 상태
    redSubtle:  'rgba(239, 68, 68, 0.12)',  // 배경 강조
    redBorder:  'rgba(239, 68, 68, 0.3)',   // 테두리

    // 추가 기능 색상 (도파민 팔레트)
    blue:       '#3b82f6',  // 정보, 링크, 주요 액션
    blueSubtle: 'rgba(59, 130, 246, 0.12)',
    green:      '#22c55e',  // 성공, 정상
    greenSubtle:'rgba(34, 197, 94, 0.12)',
    yellow:     '#f59e0b',  // 경고, 주의
    yellowSubtle:'rgba(245, 158, 11, 0.12)',
    purple:     '#8b5cf6',  // 특수 상태, 배지
    purpleSubtle:'rgba(139, 92, 246, 0.12)',
  },

  // === 테두리 ===
  border: {
    subtle:  'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.10)',
    strong:  'rgba(255, 255, 255, 0.18)',
    focus:   'rgba(59, 130, 246, 0.6)',   // 포커스 링
  },
};
```

### 그라디언트 시스템

```js
export const gradients = {
  // 헤더, 히어로 배경
  hero: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #1a0a2e 100%)',

  // 카드 강조
  cardAccent: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',

  // 위험/긴급 카드
  danger: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(220,38,38,0.05) 100%)',

  // 성공 카드
  success: 'linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(16,185,129,0.05) 100%)',

  // 버튼 기본
  btnPrimary: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  btnBlue:    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',

  // 글로우 효과 (헤더 아래 구분선)
  glowRed:  '0 1px 0 0 rgba(239,68,68,0.4)',
  glowBlue: '0 1px 0 0 rgba(59,130,246,0.4)',
};
```

### 색상 대비 기준 (WCAG AA)

| 조합 | 대비율 | 통과 여부 |
|------|--------|----------|
| #f1f5f9 on #0f172a | ~14.5:1 | AA/AAA |
| #94a3b8 on #0f172a | ~7.2:1  | AA |
| #64748b on #0f172a | ~4.6:1  | AA |
| #ef4444 on #0f172a | ~4.8:1  | AA |

---

## 3. 타이포그래피

### 폰트 설정

```js
// Next.js에서 Google Fonts 또는 로컬 폰트
// Inter: 본문 / 수치 / UI 요소
// 폴백: system-ui, -apple-system, sans-serif

const fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
const fontFamilyMono = "'JetBrains Mono', 'Fira Code', monospace"; // 코드, 수치
```

### 타이포그래피 스케일 (4px 그리드 기반, Major Second 1.125 비율)

```js
export const typography = {
  // font-size
  size: {
    xs:   '11px',   // 캡션, 타임스탬프
    sm:   '12px',   // 보조 텍스트, 배지
    base: '14px',   // 본문 기본 (모바일 최적화 — 16px 아닌 14px)
    md:   '15px',   // 강조 본문
    lg:   '16px',   // 소제목, 카드 타이틀
    xl:   '18px',   // 섹션 헤딩
    '2xl':'20px',   // 페이지 소제목
    '3xl':'24px',   // 페이지 타이틀
    '4xl':'28px',   // 대시보드 KPI 숫자
    '5xl':'36px',   // 히어로 타이틀
    '6xl':'48px',   // 랜딩 디스플레이
  },

  // font-weight
  weight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },

  // line-height
  lineHeight: {
    tight:   1.1,   // 대형 헤딩 (36px↑)
    snug:    1.25,  // 소제목 (20-28px)
    normal:  1.5,   // 본문 표준
    relaxed: 1.65,  // 긴 설명 텍스트
  },

  // letter-spacing
  tracking: {
    tight:  '-0.025em',  // 대형 디스플레이
    normal: '0em',
    wide:   '0.025em',   // 배지, 캡션
    wider:  '0.05em',    // 대문자 라벨
  },
};
```

### 인라인 스타일 예시

```jsx
// 페이지 타이틀
<h1 style={{
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: '-0.02em',
  color: '#f1f5f9',
}}>생산 현황 대시보드</h1>

// 본문
<p style={{
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: 1.5,
  color: '#94a3b8',
}}>오늘의 생산 목표 대비 실적</p>

// KPI 수치
<span style={{
  fontSize: '36px',
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: '-0.03em',
  color: '#f1f5f9',
  fontVariantNumeric: 'tabular-nums',  // 숫자 정렬
}}>4,721</span>

// 라벨/캡션
<span style={{
  fontSize: '11px',
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#64748b',
}}>달성률</span>
```

---

## 4. 간격 시스템

### 4px 기반 스페이싱 스케일

```js
export const spacing = {
  0:    '0px',
  px:   '1px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  7:    '28px',
  8:    '32px',
  10:   '40px',
  12:   '48px',
  14:   '56px',
  16:   '64px',
  20:   '80px',
  24:   '96px',
};

// 컴포넌트별 표준 패딩
export const componentSpacing = {
  // 카드
  cardPadding: '20px 24px',       // 데스크탑
  cardPaddingMobile: '16px',      // 모바일

  // 버튼
  btnPaddingSm: '6px 12px',
  btnPaddingMd: '9px 18px',
  btnPaddingLg: '12px 24px',

  // 입력 폼
  inputPadding: '10px 14px',

  // 배지
  badgePadding: '3px 8px',

  // 섹션 간격
  sectionGap: '24px',
  pageGap: '32px',
};
```

### 보더 반경 시스템

```js
export const radius = {
  sm:   '6px',   // 배지, 소형 태그
  md:   '8px',   // 버튼, 입력폼
  lg:   '12px',  // 카드, 패널
  xl:   '16px',  // 대형 카드, 모달
  '2xl':'20px',  // 히어로 카드
  full: '9999px', // 알약형 배지, 아바타
};
```

---

## 5. 카드 컴포넌트

### 기본 카드

```jsx
// 표준 카드
const cardStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  padding: '20px 24px',
  transition: 'border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease',
};

// 호버 상태 (onMouseEnter로 적용)
const cardHoverStyle = {
  borderColor: 'rgba(255, 255, 255, 0.16)',
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
};
```

### KPI 카드 (대시보드 수치 카드)

```jsx
const kpiCardStyle = {
  backgroundColor: '#1e293b',
  background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, #1e293b 60%)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  borderRadius: '12px',
  padding: '20px 24px',
};

// 예시 컴포넌트
function KpiCard({ label, value, unit, trend, color = '#3b82f6' }) {
  return (
    <div style={{
      ...kpiCardStyle,
      background: `linear-gradient(135deg, ${color}14 0%, #1e293b 60%)`,
      borderColor: `${color}33`,
    }}>
      <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em',
                     textTransform: 'uppercase', color: '#64748b' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '12px' }}>
        <span style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.1,
                       color: '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '14px', color: '#64748b' }}>{unit}</span>
        )}
      </div>
      {trend && (
        <span style={{ fontSize: '12px', color: trend > 0 ? '#22c55e' : '#ef4444',
                       marginTop: '8px', display: 'block' }}>
          {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% 전일 대비
        </span>
      )}
    </div>
  );
}
```

### 위험/알림 카드

```jsx
const alertCardStyle = {
  backgroundColor: '#1e293b',
  background: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, #1e293b 70%)',
  border: '1px solid rgba(239, 68, 68, 0.25)',
  borderLeft: '3px solid #ef4444',  // 강조 좌측 바
  borderRadius: '12px',
  padding: '16px 20px',
};
```

### 성공 카드

```jsx
const successCardStyle = {
  background: 'linear-gradient(135deg, rgba(34,197,94,0.10) 0%, #1e293b 70%)',
  border: '1px solid rgba(34, 197, 94, 0.25)',
  borderLeft: '3px solid #22c55e',
  borderRadius: '12px',
  padding: '16px 20px',
};
```

---

## 6. 버튼 컴포넌트

### 버튼 시스템 전체

```jsx
// 버튼 공통 베이스
const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: 500,
  lineHeight: 1,
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, opacity 180ms ease',
  userSelect: 'none',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

// 크기 변형
const btnSizes = {
  sm: { fontSize: '12px', padding: '6px 12px', height: '28px' },
  md: { fontSize: '14px', padding: '9px 18px', height: '36px' },
  lg: { fontSize: '15px', padding: '12px 24px', height: '44px' },  // 모바일 터치 최소 44px
};

// === 주요 변형 ===

// Primary (브랜드 레드)
const btnPrimary = {
  ...btnBase,
  ...btnSizes.md,
  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  color: '#ffffff',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
};
const btnPrimaryHover = {
  transform: 'translateY(-1px)',
  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
};
const btnPrimaryActive = {
  transform: 'translateY(0)',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
};

// Blue (정보/저장)
const btnBlue = {
  ...btnBase,
  ...btnSizes.md,
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  color: '#ffffff',
  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
};

// Ghost (선 버튼)
const btnGhost = {
  ...btnBase,
  ...btnSizes.md,
  background: 'transparent',
  color: '#94a3b8',
  border: '1px solid rgba(255, 255, 255, 0.10)',
};
const btnGhostHover = {
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderColor: 'rgba(255, 255, 255, 0.18)',
  color: '#f1f5f9',
};

// Danger (삭제 — 레드 고스트)
const btnDanger = {
  ...btnBase,
  ...btnSizes.md,
  background: 'transparent',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.30)',
};
const btnDangerHover = {
  backgroundColor: 'rgba(239, 68, 68, 0.10)',
  borderColor: 'rgba(239, 68, 68, 0.50)',
};

// Disabled
const btnDisabled = {
  opacity: 0.4,
  cursor: 'not-allowed',
  transform: 'none',
  pointerEvents: 'none',
};
```

### 버튼 컴포넌트 사용 예시

```jsx
function Button({ variant = 'primary', size = 'md', disabled, children, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const variants = {
    primary: { base: btnPrimary, hover: btnPrimaryHover, active: btnPrimaryActive },
    blue:    { base: btnBlue,    hover: { transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }, active: {} },
    ghost:   { base: btnGhost,   hover: btnGhostHover, active: {} },
    danger:  { base: btnDanger,  hover: btnDangerHover, active: {} },
  };

  const v = variants[variant];
  const style = {
    ...v.base,
    ...(hovered && !disabled ? v.hover : {}),
    ...(pressed ? v.active : {}),
    ...(disabled ? btnDisabled : {}),
    fontSize: btnSizes[size].fontSize,
    padding: btnSizes[size].padding,
    height: btnSizes[size].height,
  };

  return (
    <button
      style={style}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {children}
    </button>
  );
}
```

---

## 7. 입력 폼 컴포넌트

### 텍스트 입력 (Input)

```jsx
// 기본 입력 스타일
const inputBase = {
  width: '100%',
  backgroundColor: '#0f172a',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '14px',
  color: '#f1f5f9',
  fontFamily: "'Inter', system-ui, sans-serif",
  lineHeight: 1.5,
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  boxSizing: 'border-box',
};

// 포커스 상태 (onFocus/onBlur로 전환)
const inputFocused = {
  borderColor: 'rgba(59, 130, 246, 0.6)',
  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.12)',
};

// 에러 상태
const inputError = {
  borderColor: 'rgba(239, 68, 68, 0.6)',
  boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.10)',
};

// 플레이스홀더 색상 (CSS에서 별도 지정 필요)
// ::placeholder { color: #64748b; }

// 셀렉트 박스 (Select)
const selectStyle = {
  ...inputBase,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
  cursor: 'pointer',
};

// 라벨
const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: '6px',
  letterSpacing: '0.02em',
};

// 에러 메시지
const errorMsgStyle = {
  fontSize: '12px',
  color: '#ef4444',
  marginTop: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

// 도움말 텍스트
const helperStyle = {
  fontSize: '12px',
  color: '#64748b',
  marginTop: '4px',
};
```

### 폼 그룹 컴포넌트 예시

```jsx
function FormField({ label, error, helper, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
      {error && <span style={errorMsgStyle}>⚠ {error}</span>}
      {!error && helper && <span style={helperStyle}>{helper}</span>}
    </div>
  );
}

function TextInput({ label, error, helper, placeholder, value, onChange }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <FormField label={label} error={error} helper={helper}>
      <input
        style={{
          ...inputBase,
          ...(focused ? inputFocused : {}),
          ...(error ? inputError : {}),
        }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </FormField>
  );
}
```

### 에러 Shake 애니메이션 (CSS 필요)

```css
/* globals.css */
@keyframes inputShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
.input-shake {
  animation: inputShake 300ms ease;
}

/* 플레이스홀더 색상 */
input::placeholder,
textarea::placeholder {
  color: #64748b;
}

/* 다크 모드 자동완성 스타일 덮어쓰기 */
input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px #0f172a inset;
  -webkit-text-fill-color: #f1f5f9;
}
```

---

## 8. 배지 컴포넌트

### 배지 시스템

```jsx
const badgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 8px',
  borderRadius: '9999px',  // 알약형
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1.5,
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
};

// 배지 변형
const badges = {
  // 상태 배지
  success: {
    ...badgeBase,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    color: '#22c55e',
    border: '1px solid rgba(34, 197, 94, 0.25)',
  },
  error: {
    ...badgeBase,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.25)',
  },
  warning: {
    ...badgeBase,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.25)',
  },
  info: {
    ...badgeBase,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.25)',
  },
  purple: {
    ...badgeBase,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    color: '#8b5cf6',
    border: '1px solid rgba(139, 92, 246, 0.25)',
  },
  neutral: {
    ...badgeBase,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.10)',
  },
};

// 점(dot) 인디케이터 배지
const dotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  flexShrink: 0,
};

// 라이브 펄스 (온라인 상태 표시)
// CSS 필요: .dot-pulse { animation: pulse 2s ease infinite; }

// 사각형 배지 (태그용)
const tagBadge = {
  ...badgeBase,
  borderRadius: '6px',  // 알약형 대신 모서리만 둥글게
};
```

### 사용 예시

```jsx
// 공정 상태 배지
function StatusBadge({ status }) {
  const map = {
    '정상': { variant: 'success', dot: '#22c55e' },
    '경고': { variant: 'warning', dot: '#f59e0b' },
    '불량': { variant: 'error',   dot: '#ef4444' },
    '점검': { variant: 'info',    dot: '#3b82f6' },
    '중단': { variant: 'neutral', dot: '#64748b' },
  };
  const { variant, dot } = map[status] || map['중단'];
  return (
    <span style={badges[variant]}>
      <span style={{ ...dotStyle, backgroundColor: dot }} />
      {status}
    </span>
  );
}
```

---

## 9. 네비게이션

### 사이드바 (데스크탑)

```jsx
const sidebarStyle = {
  width: '240px',
  height: '100vh',
  backgroundColor: '#0f172a',
  borderRight: '1px solid rgba(255, 255, 255, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 100,
  overflowY: 'auto',
  overflowX: 'hidden',
};

// 네비 아이템 기본
const navItemBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '9px 12px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#64748b',
  cursor: 'pointer',
  transition: 'background-color 150ms ease, color 150ms ease',
  textDecoration: 'none',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
};

// 활성 상태
const navItemActive = {
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  color: '#ef4444',
};

// 호버 상태
const navItemHover = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: '#94a3b8',
};
```

### 하단 탭바 (모바일 — 엄지 존 최적화)

```jsx
// 모바일: 하단 네비게이션 (2026 트렌드 — top nav 지양)
const bottomNavStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: '56px',
  backgroundColor: '#0f172a',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  zIndex: 200,
  // Safe area 지원 (iOS 노치)
  paddingBottom: 'env(safe-area-inset-bottom)',
};

const tabItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  padding: '8px 16px',
  minWidth: '44px',  // 터치 최소 영역
  minHeight: '44px',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  color: '#64748b',
  fontSize: '10px',
  fontWeight: 500,
  transition: 'color 150ms ease',
};

const tabItemActiveStyle = {
  color: '#ef4444',
};
```

### 상단 헤더

```jsx
const headerStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: 'rgba(15, 23, 42, 0.92)',  // 반투명 (스크롤 시 컨텐츠 비침)
  backdropFilter: 'blur(12px)',               // Glassmorphism — 헤더에 한정 적용
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  boxShadow: '0 1px 0 0 rgba(239, 68, 68, 0.15)',  // 브랜드 레드 글로우
  height: '56px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 24px',
  gap: '16px',
};
```

---

## 10. 애니메이션 / 트랜지션

### 트랜지션 표준값

```js
export const transitions = {
  // 즉각 피드백 (버튼 누름, 체크박스)
  instant: '100ms ease',

  // 마이크로 인터랙션 표준 (호버, 포커스, 색상 변화)
  fast: '150ms ease',

  // 상태 전환 (카드 호버, 메뉴 열기)
  base: '200ms ease',

  // 패널 전환, 드로어 열기
  medium: '300ms cubic-bezier(0.4, 0, 0.2, 1)',

  // 페이지 전환, 모달
  slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',

  // 스프링 효과 (弾む 느낌)
  spring: '350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};
```

### 카드/요소 페이드인 (스크롤 트리거)

```css
/* globals.css */
.fade-in-up {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 400ms ease, transform 400ms ease;
}
.fade-in-up.visible {
  opacity: 1;
  transform: translateY(0);
}

/* 스태거 딜레이 */
.fade-in-up:nth-child(1) { transition-delay: 0ms; }
.fade-in-up:nth-child(2) { transition-delay: 60ms; }
.fade-in-up:nth-child(3) { transition-delay: 120ms; }
.fade-in-up:nth-child(4) { transition-delay: 180ms; }

/* 접근성: 모션 감소 설정 시 비활성화 */
@media (prefers-reduced-motion: reduce) {
  .fade-in-up { opacity: 1; transform: none; transition: none; }
}
```

```jsx
// IntersectionObserver로 .visible 클래스 토글
// Next.js에서 useEffect 안에서 사용
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target); // 한 번만 실행
      }
    }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
  return () => observer.disconnect();
}, []);
```

### 버튼 마이크로인터랙션

```js
// 인라인 스타일로 React state 기반 처리
const usePressable = () => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  return {
    hovered, pressed,
    handlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => { setHovered(false); setPressed(false); },
      onMouseDown:  () => setPressed(true),
      onMouseUp:    () => setPressed(false),
    }
  };
};
// 적용: hover시 translateY(-2px), active시 translateY(0)
```

### 로딩 / 스켈레톤

```jsx
// CSS shimmer 애니메이션
// globals.css에 추가:
/*
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
*/

const skeletonStyle = {
  backgroundColor: '#1e293b',
  borderRadius: '6px',
  background: 'linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};
```

### 스피너 (CSS 전용)

```css
/* globals.css */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: #ef4444;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}
```

### 펄스 (온라인 상태 인디케이터)

```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.85); }
}
.dot-pulse {
  animation: pulse 2s ease infinite;
}
```

---

## 11. Glassmorphism & 레이어 깊이

### 적용 원칙 (2026 절제 기준)

| 요소 | 적용 여부 | 블러 강도 |
|------|----------|----------|
| 메인 카드/패널 | X — 불투명 배경 사용 | — |
| 상단 헤더 (스크롤 시) | O | blur(12px) |
| 모달 오버레이 배경 | O | blur(8px) |
| 플로팅 드롭다운 | O | blur(10px) |
| 사이드바 | X | — |
| 툴팁 | 선택적 | blur(6px) |

### 글래스 모달 스타일

```jsx
// 모달 오버레이
const modalOverlay = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// 모달 패널
const modalPanel = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '16px',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
  padding: '24px',
  width: '100%',
  maxWidth: '480px',
  maxHeight: '90vh',
  overflowY: 'auto',
  // 모달 진입 애니메이션 (CSS 클래스로)
};

// 플로팅 드롭다운 (약한 글래스)
const dropdownStyle = {
  backgroundColor: 'rgba(30, 41, 59, 0.95)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};
```

---

## 12. Bento Grid 레이아웃

### 대시보드 Bento Grid 예시

```jsx
// CSS Grid 기반 Bento — Next.js 인라인 스타일
const bentoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',  // 12컬럼 기준
  gap: '16px',
  padding: '24px',
};

// 카드 크기 변형 (colspan 기반)
const bentoCardSizes = {
  full:  { gridColumn: 'span 12' },  // 전체 너비
  half:  { gridColumn: 'span 6' },   // 절반
  third: { gridColumn: 'span 4' },   // 1/3
  twoThird: { gridColumn: 'span 8'}, // 2/3
  quarter:  { gridColumn: 'span 3'}, // 1/4
};

// 모바일: 단일 컬럼
const bentoGridMobile = {
  gridTemplateColumns: '1fr',
};
```

### 반응형 Bento (CSS Media Query)

```css
/* globals.css */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

/* 태블릿 */
@media (max-width: 1024px) {
  .bento-grid { grid-template-columns: repeat(6, 1fr); }
  .bento-full, .bento-two-third { grid-column: span 6; }
  .bento-half { grid-column: span 3; }
  .bento-third { grid-column: span 3; }
  .bento-quarter { grid-column: span 3; }
}

/* 모바일 */
@media (max-width: 640px) {
  .bento-grid { grid-template-columns: 1fr; gap: 12px; padding: 16px; }
  [class*="bento-"] { grid-column: span 1; }
}
```

### 대시보드 레이아웃 예시 구성

```
┌─────────────────────────────────────────────────────┐
│  [생산 현황 — 전체 너비 히어로 카드]  (span 12)      │
├─────────────┬─────────────┬────────────┬────────────┤
│ 금일 생산량  │ 불량률      │ 가동률     │ 목표 달성  │
│ (span 3)    │ (span 3)    │ (span 3)   │ (span 3)   │
├─────────────────────────┬───────────────────────────┤
│ 설비 상태 현황 (span 8)  │ 알림 목록 (span 4)        │
├─────────────┬───────────┴───────────────────────────┤
│ 부품 재고   │ 최근 작업 이력 (span 8)                │
│ (span 4)   │                                        │
└─────────────┴───────────────────────────────────────┘
```

---

## 13. 모바일 퍼스트 체크리스트

### 레이아웃

- [ ] 모든 인터랙티브 요소 최소 44x44px 터치 영역 확보
- [ ] 핵심 액션은 화면 하단 2/3 (엄지 존) 배치
- [ ] 상단 네비게이션 대신 하단 탭바 사용
- [ ] 텍스트 최소 14px (12px 이하 금지)
- [ ] 수평 스크롤 방지 (`overflow-x: hidden`)
- [ ] Safe area inset 대응 (`env(safe-area-inset-*)`)

### 성능

- [ ] 이미지 `loading="lazy"` 기본 적용
- [ ] 폰트 `font-display: swap` 설정
- [ ] CSS transition은 `transform`, `opacity`만 사용 (layout 재계산 방지)
- [ ] `prefers-reduced-motion` 미디어 쿼리 대응

### 접근성

- [ ] 모든 인터랙티브 요소에 포커스 스타일 (`outline`, `ring`)
- [ ] 텍스트 대비 4.5:1 이상 (WCAG AA)
- [ ] UI 요소 대비 3:1 이상
- [ ] ARIA 레이블 필요 요소에 적용

### 다크 테마 품질

- [ ] 순수 검정(#000) 사용 금지, 어두운 회색 계열 사용
- [ ] 액센트 색상 채도 10-15% 감소 (순수 bright 색상 지양)
- [ ] 그림자는 어두운 배경에서 보이지 않으므로 elevation 색상 차이로 표현
- [ ] 자동완성 스타일 덮어쓰기 (`-webkit-autofill`)

---

---

## 14. shadcn/ui CSS 토큰 시스템 (실전 검증)

> 출처: `vercel/next.js` 공식 with-supabase 예제 `app/globals.css` — 실제 프로덕션 사용 중

shadcn/ui는 CSS 변수를 **HSL 형식(hue saturation% lightness%)** 으로 정의하고 Tailwind가 이를 참조한다. DSC FMS는 인라인 스타일을 사용하므로 아래 표처럼 hex/rgba로 변환해서 사용한다.

### 다크 모드 CSS 토큰 → DSC 인라인 스타일 대응표

| shadcn 토큰 | 다크 모드 HSL | DSC 인라인 스타일 hex | 용도 |
|-------------|--------------|----------------------|------|
| `--background` | `0 0% 3.9%` | `#0a0a0a` → DSC: `#0f172a` | 페이지 배경 |
| `--foreground` | `0 0% 98%` | `#fafafa` → DSC: `#f1f5f9` | 기본 텍스트 |
| `--card` | `0 0% 3.9%` | `#0a0a0a` → DSC: `#1e293b` | 카드 배경 |
| `--card-foreground` | `0 0% 98%` | `#fafafa` → DSC: `#f1f5f9` | 카드 텍스트 |
| `--muted` | `0 0% 14.9%` | `#262626` → DSC: `#263248` | 비활성 배경 |
| `--muted-foreground` | `0 0% 63.9%` | `#a3a3a3` → DSC: `#64748b` | 보조 텍스트 |
| `--border` | `0 0% 14.9%` | `#262626` → DSC: `rgba(255,255,255,0.08)` | 테두리 |
| `--input` | `0 0% 14.9%` | `#262626` → DSC: `#0f172a` | 입력 배경 |
| `--ring` | `0 0% 83.1%` | `#d4d4d4` → DSC: `rgba(59,130,246,0.6)` | 포커스 링 |
| `--destructive` | `0 62.8% 30.6%` | `#7f1d1d` → DSC: `#ef4444` | 위험/삭제 |
| `--chart-1` | `220 70% 50%` | `#2563eb` → DSC: `#3b82f6` | 차트 색상 1 |
| `--chart-2` | `160 60% 45%` | `#16a34a` → DSC: `#22c55e` | 차트 색상 2 |
| `--chart-3` | `30 80% 55%` | `#d97706` → DSC: `#f59e0b` | 차트 색상 3 |
| `--chart-4` | `280 65% 60%` | `#9333ea` → DSC: `#8b5cf6` | 차트 색상 4 |
| `--chart-5` | `340 75% 55%` | `#e11d48` → DSC: `#ef4444` | 차트 색상 5 |

### globals.css 다크 테마 기반 — DSC 버전 (인라인 스타일 없이 CSS 파일에 두는 토큰)

```css
/* /app/globals.css — DSC FMS 다크 테마 CSS 변수 */
/* shadcn/ui .dark 토큰 패턴을 DSC 색상으로 조정 */
:root {
  /* DSC 기본값: 항상 다크 모드 */
  --background: #0f172a;
  --foreground: #f1f5f9;
  --card: #1e293b;
  --card-foreground: #f1f5f9;
  --popover: #1e293b;
  --popover-foreground: #f1f5f9;
  --primary: #ef4444;          /* DSC 브랜드 레드 */
  --primary-foreground: #ffffff;
  --secondary: #263248;
  --secondary-foreground: #94a3b8;
  --muted: #1e293b;
  --muted-foreground: #64748b;
  --accent: rgba(239,68,68,0.12);
  --accent-foreground: #ef4444;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: rgba(255, 255, 255, 0.08);
  --input: #0f172a;
  --ring: rgba(59, 130, 246, 0.6);
  --radius: 0.75rem;            /* 12px */

  /* 차트 색상 — shadcn 다크 모드 기반 */
  --chart-1: #3b82f6;
  --chart-2: #22c55e;
  --chart-3: #f59e0b;
  --chart-4: #8b5cf6;
  --chart-5: #ef4444;
}

/* autofill 덮어쓰기 — 크롬 파란 배경 방지 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #0f172a inset !important;
  -webkit-text-fill-color: #f1f5f9 !important;
  caret-color: #f1f5f9;
}

/* 플레이스홀더 */
input::placeholder,
textarea::placeholder {
  color: #64748b;
}

/* 스크롤바 다크 테마 */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

/* 포커스 아웃라인 — 키보드 접근성 */
:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.6);
  outline-offset: 2px;
}

/* 텍스트 선택 색상 */
::selection {
  background-color: rgba(239, 68, 68, 0.25);
  color: #f1f5f9;
}
```

### cruip/tailwind-dashboard-template 색상 팔레트 (수집 결과)

> 수집 성공: Tailwind v4 기반 대시보드 템플릿. 아래 색상을 DSC 인라인 스타일 등가값으로 변환.

```js
// Cruip 대시보드 템플릿 → DSC 인라인 스타일 매핑
// 원본: Tailwind v4 커스텀 팔레트 (violet/sky/green/red/yellow 계열)

const cruipPalette = {
  // Violet (대시보드 액센트)
  violet: {
    light:  '#8470ff',  // hover 상태
    base:   '#6366f1',  // 인디고/바이올렛 버튼
    dark:   '#1c1357',  // 깊은 배경
    subtle: 'rgba(99, 102, 241, 0.12)',
  },
  // Sky Blue (정보/링크)
  sky: {
    light:  '#67bfff',
    base:   '#0ea5e9',
    dark:   '#0b324f',
    subtle: 'rgba(14, 165, 233, 0.12)',
  },
  // Green (성공/정상) — DSC에서도 동일하게 사용
  green: {
    light:  '#3ec972',
    base:   '#22c55e',
    dark:   '#0a3f1e',
    subtle: 'rgba(34, 197, 94, 0.12)',
  },
  // Red (오류/위험) — DSC 브랜드 컬러와 일치
  red: {
    light:  '#ff5656',
    base:   '#ef4444',
    dark:   '#600f0f',
    subtle: 'rgba(239, 68, 68, 0.12)',
  },
  // Yellow (경고)
  yellow: {
    light:  '#f0bb33',
    base:   '#f59e0b',
    dark:   '#342809',
    subtle: 'rgba(245, 158, 11, 0.12)',
  },
};

// 쉐도우 — Cruip 대시보드 스타일 (다크 배경에서 섬세한 깊이 표현)
const cruipShadow = {
  sm: '0 1px 1px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.02)',
  md: '0 4px 6px -1px rgba(0,0,0,0.15), 0 2px 4px -2px rgba(0,0,0,0.10)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.20), 0 4px 6px -4px rgba(0,0,0,0.10)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.10)',
};
```

---

## 15. 실전 검증된 Glassmorphism 패턴

> shadcn/ui 및 실제 프로덕션 대시보드에서 검증된 패턴

### 완성형 글래스 카드 (실동작 코드)

```jsx
// 글래스 카드 — 배경에 그라디언트/이미지가 있을 때만 효과 있음
// 사이드바, 모달, 플로팅 패널에 적합

const glassCard = {
  background: 'rgba(30, 41, 59, 0.7)',       // #1e293b 70% 불투명
  backdropFilter: 'blur(12px) saturate(1.5)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.5)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
};

// 글래스 헤더 (스크롤 시 컨텐츠 위에 떠있는 느낌)
const glassHeader = {
  background: 'rgba(15, 23, 42, 0.85)',      // #0f172a 85%
  backdropFilter: 'blur(16px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.8)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(239,68,68,0.15)',
};

// 글래스 드롭다운 메뉴
const glassDropdown = {
  background: 'rgba(30, 41, 59, 0.92)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '10px',
  boxShadow: '0 16px 40px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)',
};

// 글래스 토스트/알림 (우측 하단 플로팅)
const glassToast = {
  background: 'rgba(30, 41, 59, 0.95)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '10px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  padding: '12px 16px',
  minWidth: '280px',
  maxWidth: '380px',
};
```

### 글래스 모달 진입 애니메이션 (CSS)

```css
/* globals.css */
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal-overlay {
  animation: overlayIn 200ms ease;
}

.modal-panel {
  animation: modalIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal-panel { animation: none; }
}
```

---

## 참고 소스

- [UI Design Trends 2026 — Midrocket](https://midrocket.com/en/guides/ui-design-trends-2026/)
- [15 Important UI UX Trends 2026 — Tenet](https://www.wearetenet.com/blog/ui-ux-design-trends)
- [UI Trends 2026: 12 Patterns — MediaPlus](https://mediaplus.com.sg/ui-trends/)
- [Dark Glassmorphism 2026 — Medium](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [Complete Dark Mode Design Guide — UI Deploy](https://ui-deploy.com/blog/complete-dark-mode-design-guide-ui-patterns-and-implementation-best-practices-2025)
- [Micro-Interactions CSS Snippets — Netcode Design](https://netcodesign.com/micro-interactions-that-feel-magical-best-practices-code-snippets/)
- [Typographic Scales — Design+Code](https://designcode.io/typographic-scales/)
- [Dark Mode UI Best Practices — Atmos](https://atmos.style/blog/dark-mode-ui-best-practices)
- [shadcn/ui globals.css — vercel/next.js with-supabase 예제](https://github.com/vercel/next.js/tree/canary/examples/with-supabase) (GitHub 직접 수집, 2026-05-12)
- [cruip/tailwind-dashboard-template 색상 팔레트](https://github.com/cruip/tailwind-dashboard-template) (GitHub 직접 수집, 2026-05-12)
