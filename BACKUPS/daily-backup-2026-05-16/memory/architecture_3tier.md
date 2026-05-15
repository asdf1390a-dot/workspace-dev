# 3단계 계층 아키텍처 최종 확정 (2026-05-13)

## 구조

```
┌─────────────────────────────────────────────┐
│  L1: Jeepney Personal Portal                │
│  /jeepney-personal                          │
│  ├─ Personal History (개인이력)              │
│  └─ Menu: DSC HUB                           │
│     └─ L2: DSC HUB                          │
│        ├─ DSC-FMS-PORTAL (L3)               │
│        └─ Travel Records (L3)               │
└─────────────────────────────────────────────┘
```

## 라우팅 계층

- **L1:** /jeepney-personal (Jeepney Personal Portal 메인)
- **L2:** /jeepney-personal/dsc-hub (통합 메뉴 허브)
- **L3-FMS:** /jeepney-personal/dsc-hub/fms/* (기존 FMS 모듈들)
- **L3-Travel:** /jeepney-personal/dsc-hub/travel/* (신규 여행기록)

## 네비게이션

### L1 (Jeepney)
- 상단 헤더: 로고 + 홈 + DSC HUB 메뉴 (≡) + 프로필
- Personal History 탭 (고정)
- DSC HUB 메뉴는 드롭다운/사이드바

### L2 (DSC HUB)
- 헤더: "Back to Personal" 버튼 + 현위치
- 메뉴: DSC-FMS-PORTAL, Travel Records

### L3 (모듈)
- 헤더: "Back to DSC HUB" 버튼 + 현위치
- 각 모듈의 구체적 기능

## 구현 Phases

| Phase | 항목 | 기간 | 설명 |
|-------|------|------|------|
| 1 | 3단계 네비게이션 | 5일 | L1/L2/L3 계층 구축 |
| 2 | Travel CRUD | 10일 | 여행 기본 기능 |
| 3 | Travel 상세 | 7일 | 비용/일정 관리 |
| 4 | Google Maps | 5일 | 지도 통합 |
| 5 | FMS 마이그레이션 | 5일 | 기존 FMS 경로 이동 |

## 핵심 변경사항

- **메인 앱:** DSC Hub → Jeepney Personal Portal
- **계층:** 3단계 (L1-Personal > L2-Hub > L3-Modules)
- **네비게이션:** 탭 기반 → 계층적 드롭다운/메뉴 기반
- **경로:** /assets → /jeepney-personal/dsc-hub/fms/assets (리다이렉트)

## 파일 구조 변경

```
pages/
├── jeepney-personal/          (L1)
│   ├── index.js
│   └── dsc-hub/               (L2)
│       ├── index.js
│       ├── fms/               (L3-FMS)
│       ├── travel/            (L3-Travel)
│       └── api/
│
components/
├── layout/                    (L1 레이아웃)
├── dsc-hub/                   (L2 컴포넌트)
├── fms/                       (L3-FMS)
└── travel/                    (L3-Travel)
```

## 설계서 위치

- `/home/jeepney/.openclaw/workspace-dev/ARCHITECTURE_DSC_HUB.md`
