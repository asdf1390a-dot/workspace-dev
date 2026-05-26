---
name: DSC FMS Design System (색상, 타이포그래피, 간격)
description: Dark theme 색상 32개, 간격 스케일 8단계, 타이포그래피 정의, 컴포넌트 색상 규칙
type: reference
relatedFiles: dsc-fms-portal/DESIGN_SYSTEM.md
---

# DSC FMS Design System

**버전:** 1.0  
**테마:** Dark (기본)  
**상태:** ✅ 기초 정의 완료

## 색상 팔레트 (32색)

### 배경색 (Background)
- **Primary BG:** `#0f172a` — 페이지 기본 배경
- **Secondary BG:** `#1e293b` — 컨테이너, 섹션 배경
- **Card BG:** `#1e293b` — 카드, 패널 배경
- **Input BG:** `#0f172a` — 입력 필드 배경

### 테두리색 (Border)
- **Border Default:** `#334155` — 기본 테두리
- **Border Hover:** `#475569` — Hover 상태 테두리

### 텍스트색 (Text)
- **Text Primary:** `#f8fafc` — 주요 텍스트
- **Text Secondary:** `#cbd5e1` — 보조 텍스트
- **Text Tertiary:** `#64748b` — 3순위 텍스트
- **Text Disabled:** `#475569` — 비활성 텍스트

### 링크색 (Link)
- **Link Default (Cyan):** `#06b6d4`
- **Link Hover:** `#0891b2`
- **Link Active:** `#06a5d7`

### 강조색 (Accent) — CTA 버튼/활성 탭
- **Primary Accent (Cyan):** `#06b6d4` — 주요 강조
- **Secondary Accent (Violet):** `#a78bfa` — 보조 강조
- **Tertiary Accent (Blue):** `#3b82f6` — 3순위 강조

### 상태색 (Status)
- **Success (Emerald):** `#10b981` — 성공, 완료
- **Warning (Amber):** `#f59e0b` — 경고, 진행중
- **Error (Red):** `#ef4444` — 오류, 실패
- **Info (Blue):** `#3b82f6` — 정보

### 버튼 배경색 (Button Backgrounds)
- **CTA Button:** `#06b6d4` (Cyan)
- **Secondary Button:** `#334155` (Slate-700)
- **Danger Button:** `#ef4444` (Red)
- **Success Button:** `#10b981` (Emerald)
- **Disabled Button:** `#475569` (Slate-600)

### 추가 색상 (Supplementary)
- **Slate-600:** `#475569`
- **Slate-700:** `#334155`
- **Gray-400:** `#9ca3af`
- **Gray-600:** `#4b5563`

## 간격 스케일 (Spacing System)

| 이름 | px | em (16px 기준) | 사용처 |
|------|----|----|--------|
| xs | 4px | 0.25em | 아이콘 내부, 매우 작은 간격 |
| sm | 8px | 0.5em | 버튼 패딩, 라벨 간격 |
| md | 12px | 0.75em | 폼 요소, 컴포넌트 내부 |
| lg | 16px | 1em | 섹션 간격, 컴포넌트 간격 |
| xl | 20px | 1.25em | 큰 섹션 간격 |
| 2xl | 24px | 1.5em | 주요 섹션 분리 |
| 3xl | 32px | 2em | 페이지 섹션 분리 |
| 4xl | 40px | 2.5em | 주요 페이지 영역 분리 |

## 타이포그래피

### 폰트 패밀리
**기본 폰트:**
```
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
"Noto Sans KR", "Apple SD Gothic Neo", sans-serif
```

**Monospace (코드):**
```
Menlo, Monaco, Courier New, monospace
```

### 폰트 크기 & 가중치

| 용도 | 크기 | 가중치 | 줄높이 |
|------|------|--------|--------|
| H1 (페이지 제목) | 32px | 700 (Bold) | 40px |
| H2 (섹션 제목) | 24px | 700 (Bold) | 32px |
| H3 (서브 제목) | 20px | 600 (Semibold) | 28px |
| H4 (소제목) | 16px | 600 (Semibold) | 24px |
| Body Large | 16px | 400 (Normal) | 24px |
| Body Default | 14px | 400 (Normal) | 22px |
| Body Small | 12px | 400 (Normal) | 18px |
| Label | 12px | 500 (Medium) | 16px |
| Caption | 11px | 400 (Normal) | 16px |

### 폰트 가중치
- **Normal:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

## 컴포넌트별 색상 사용 규칙

### 버튼
- **CTA (Primary):** Background Cyan (`#06b6d4`), Text Primary White
- **Secondary:** Background Slate-700 (`#334155`), Text Primary
- **Danger:** Background Red (`#ef4444`), Text White
- **Success:** Background Emerald (`#10b981`), Text White
- **Disabled:** Background Slate-600 (`#475569`), Text Disabled

### 입력 필드
- **Background:** Input BG (`#0f172a`)
- **Border:** Border Default (`#334155`)
- **Border Hover:** Border Hover (`#475569`)
- **Text:** Text Primary (`#f8fafc`)
- **Placeholder:** Text Tertiary (`#64748b`)

### 테이블
- **Header Background:** Secondary BG (`#1e293b`)
- **Header Text:** Text Primary (`#f8fafc`)
- **Row Background:** Card BG (`#1e293b`)
- **Row Border:** Border Default (`#334155`)
- **Alternate Row:** Secondary BG (`#1e293b`) + 투명도 50%
- **Hover Row:** Border Hover (`#475569`)

### 탭 네비게이션
- **Active Tab:** Text Cyan (`#06b6d4`) + 밑줄
- **Inactive Tab:** Text Secondary (`#cbd5e1`)
- **Hover:** Text Tertiary (`#64748b`)

### 카드 & 패널
- **Background:** Card BG (`#1e293b`)
- **Border:** Border Default (`#334155`)
- **Shadow:** 투명도 20% 검은색

### 상태 표시
- **Success:** Emerald (`#10b981`)
- **Warning:** Amber (`#f59e0b`)
- **Error:** Red (`#ef4444`)
- **Info:** Blue (`#3b82f6`)

## 테마 구현 (CSS Variables)

```css
:root {
  /* 배경 */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --bg-input: #0f172a;
  
  /* 테두리 */
  --border-default: #334155;
  --border-hover: #475569;
  
  /* 텍스트 */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #64748b;
  --text-disabled: #475569;
  
  /* 링크 */
  --link-default: #06b6d4;
  --link-hover: #0891b2;
  --link-active: #06a5d7;
  
  /* 강조 */
  --accent-primary: #06b6d4;
  --accent-secondary: #a78bfa;
  --accent-tertiary: #3b82f6;
  
  /* 상태 */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-error: #ef4444;
  --status-info: #3b82f6;
  
  /* 간격 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
  --spacing-4xl: 40px;
}
```

## 사용 가이드

### Do's
- 텍스트 대비: Text Primary + BG Primary/Secondary/Card는 항상 가독성 확보 (WCAG AA)
- 상태 색상은 색상만 아닌 아이콘/텍스트 함께 사용
- 간격은 스케일 내 값만 사용 (일관성)
- CTA는 Cyan, 위험 작업은 Red

### Don'ts
- 상태 색상만으로 상태 표시 (색맹 사용자 고려)
- 임의의 색상 사용 (팔레트 외)
- 간격 수치를 자의로 변경 (4, 8, 12, 16... 단위만)
- 어두운 텍스트 + 어두운 배경 조합

## 상태
✅ **기초 정의 완료** → 모든 프로젝트에 적용
