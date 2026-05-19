---
name: Backup App UI 설계 시스템
description: 색상 팔레트, 타이포그래피, 간격 척도, WCAG 접근성 준수
type: project
relatedFiles: dsc-fms-portal/BACKUP_APP_PHASE2_UI_REFINEMENT.md
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---
# Backup App — UI 설계 시스템

**버전:** 1.0  
**표준:** WCAG 2.1 Level AA  
**프레임워크:** Tailwind CSS + Next.js Components

## 색상 팔레트

### Primary Colors (주색)
| 용도 | HEX | RGB | 용도 |
|------|-----|-----|------|
| Primary-50 | #F0F9FF | 240,249,255 | 가벼운 배경 |
| Primary-100 | #E0F2FE | 224,242,254 | 강조 배경 |
| Primary-500 | #0EA5E9 | 14,165,233 | 기본 CTA, 링크 |
| Primary-600 | #0284C7 | 2,132,199 | 호버 상태 |
| Primary-700 | #0369A1 | 3,105,161 | 활성 상태 |

**명도 대비:** Primary-600 on White ≥ 4.5:1 (WCAG AA 준수)

### Status Colors (상태)
| 상태 | HEX | 용도 | 명도대비 |
|------|-----|------|---------|
| Success | #10B981 | 백업 완료 | ≥4.5:1 |
| Warning | #F59E0B | 저장소 부족 경고 | ≥4.5:1 |
| Error | #EF4444 | 백업 실패 | ≥4.5:1 |
| Info | #3B82F6 | 정보성 알림 | ≥4.5:1 |

### Neutral Colors (중립)
| 용도 | HEX | RGB |
|------|-----|-----|
| Neutral-50 | #FAFAFA | 250,250,250 |
| Neutral-100 | #F3F4F6 | 243,244,246 |
| Neutral-400 | #9CA3AF | 156,163,175 |
| Neutral-600 | #4B5563 | 75,85,99 |
| Neutral-900 | #111827 | 17,24,39 |

## 타이포그래피

### 폰트 패밀리
- **기본:** Inter (sans-serif)
- **Fallback:** -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### 계층 구조
| 용도 | 크기 | 무게 | 줄높이 | 문자간격 |
|------|------|------|--------|---------|
| H1 (페이지 제목) | 32px | 700 | 1.2 | -0.02em |
| H2 (섹션 제목) | 24px | 600 | 1.3 | -0.01em |
| H3 (소제목) | 20px | 600 | 1.4 | 0 |
| Body (본문) | 16px | 400 | 1.5 | 0 |
| Body-sm (작은 본문) | 14px | 400 | 1.5 | 0.01em |
| Label (라벨) | 12px | 500 | 1.4 | 0.05em |

**색상 대비:** Body on White ≥ 4.5:1, Label on Gray-100 ≥ 3:1

## 간격 척도 (Spacing Scale)

```
4px  (1 unit)
8px  (2 units)
12px (3 units)
16px (4 units) — default
24px (6 units)
32px (8 units)
48px (12 units)
64px (16 units)
```

### 적용 예시
- **Padding:** 16px (컨테이너), 12px (카드)
- **Margin:** 24px (섹션 간), 16px (요소 간)
- **Gap:** 12px (폼 필드), 8px (버튼 그룹)

## 컴포넌트 스타일

### 버튼
- **기본 (Primary):** Background Primary-500, Text White, Padding 12px 24px, Border Radius 8px
- **호버:** Background Primary-600
- **비활성:** Background Neutral-200, Text Neutral-400, Cursor not-allowed
- **크기:** Small (8px 16px), Medium (12px 24px), Large (16px 32px)

### 카드
- **배경:** White
- **테두리:** 1px Neutral-200
- **그림자:** 0 1px 3px rgba(0,0,0,0.1)
- **Padding:** 24px
- **Border Radius:** 12px

### 입력 필드
- **높이:** 40px (기본)
- **Padding:** 12px 16px
- **테두리:** 1px Neutral-300 (기본), 2px Primary-500 (포커스)
- **Border Radius:** 8px

### 테이블
- **헤더 배경:** Neutral-100
- **헤더 텍스트:** Neutral-900, Bold
- **행 테두리:** 1px Neutral-200
- **행 호버:** Background Neutral-50
- **Padding:** 16px (셀)

## 아이콘 & 이모지

- **크기:** 16px (라벨), 24px (기본), 32px (큼)
- **색상:** 상태에 따라 (Success-500, Error-500 등)
- **라이브러리:** Heroicons (권장)

## 반응형 설계

| 브레이크포인트 | 크기 | 용도 |
|--------|------|------|
| Mobile | 320px-640px | 스마트폰 |
| Tablet | 641px-1024px | 태블릿 |
| Desktop | 1025px+ | 데스크톱 |

### 조정 사항
- **Mobile:** H1 24px → 28px, Body 16px (그대로), Padding 16px → 12px
- **Tablet:** H1 28px, Padding 16px
- **Desktop:** H1 32px, Padding 24px

## 다크 모드 (향후)

계획 예정 (현재는 라이트 모드만)

## 접근성 가이드

1. **색상만 사용하지 않기:** 상태 표현시 아이콘 + 텍스트 병행
2. **명도 대비:** 모든 텍스트 ≥ 4.5:1
3. **포커스 표시:** 모든 인터랙션 요소에 :focus-visible 스타일
4. **대체 텍스트:** 모든 이미지에 alt 속성
5. **폼 라벨:** <label> 요소 필수, input과 명시적 연결
