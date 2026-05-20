---
name: KPI 리포트 모듈 설계
description: 11개 KPI 항목 입력/목표 관리/차트 시각화 (생산/품질/보전/안전)
type: project
relatedFiles: DESIGN_KPI.md
---

# KPI 리포트 모듈 설계

**작성일:** 2026-05-12  
**상태:** 설계 완료 → Web-Builder AI Agent 개발 대기  
**대상:** DSC FMS Portal (Next.js 14 + Supabase)

## 설계 배경

현재 KPI 대시보드는 BM 이력 기반 MTTR/MTBF만 표시한다. 공장 운영에는 생산량, OEE, 불량률, 고객반품, PM달성률, 안전 지표까지 통합적으로 입력하고 목표 대비 실적을 추적할 수 있어야 한다.

**기존:** BM 집계 RPC (읽기 전용)  
**신규:** 직접 입력 + 목표 관리 + 차트 시각화 (기존 위에 추가)

## 설계 원칙

- **기존 확장:** `/kpi/index.js` 완전 교체 아니라 확장 — 기존 BM 집계 RPC 재사용
- **입력 권한:** Admin 역할만 입력 가능, 일반 로그인 사용자는 열람
- **자동화:** MTTR/MTBF는 bm_events에서 자동 집계, 나머지는 수동 입력
- **시각화:** recharts (Next.js Pages Router 환경에서 안정적)
- **스타일:** 인라인 스타일, 다크 테마, 모바일 퍼스트 (480px)

## DB 스키마 (파일: db/15_kpi_module.sql)

### 1. kpi_categories (KPI 항목 마스터)
```
id (text, pk) — 'production_volume', 'oee', ...
group_name (text) — '생산', '품질', '보전', '안전'
name_ko (text) — '생산량'
name_en (text) — 'Production Volume'
unit (text) — 'EA', '%', 'PPM', 'h', '건'
direction (enum: up|down) — up(높을수록 좋음) | down(낮을수록 좋음)
is_auto (boolean) — true = bm_events RPC로 자동 집계
sort_order (int)
is_active (boolean)
```

**11개 초기 항목:**
| 그룹 | 항목 | 단위 | 방향 | 자동화 |
|------|------|------|------|--------|
| 생산 | 생산량 | EA | ↑ up | ❌ |
| 생산 | OEE | % | ↑ up | ❌ |
| 생산 | 계획달성률 | % | ↑ up | ❌ |
| 품질 | 불량률 | PPM | ↓ down | ❌ |
| 품질 | 고객반품 | 건 | ↓ down | ❌ |
| 보전 | MTTR | h | ↓ down | ✅ |
| 보전 | MTBF | h | ↑ up | ✅ |
| 보전 | PM달성률 | % | ↑ up | ❌ |
| 안전 | 재해건수 | 건 | ↓ down | ❌ |
| 안전 | 아차사고 | 건 | ↓ down | ❌ |
| 보전 | PM완료건수 | 건 | ↑ up | ❌ |

### 2. kpi_targets (월별 KPI 목표)
```
id (uuid, pk)
category_id (text, FK: kpi_categories)
target_month (date) — 항상 월의 1일
target_value (numeric) — 목표값
note (text) — 목표 설정 메모
created_by (uuid, FK: auth.users)
created_at, updated_at (timestamptz)

UNIQUE (category_id, target_month)
```

### 3. kpi_actuals (월별 KPI 실적)
```
id (uuid, pk)
category_id (text, FK: kpi_categories)
actual_month (date) — 월의 1일
actual_value (numeric) — 실제값
entered_by (uuid, FK: auth.users)
entered_at (timestamptz)
note (text)

UNIQUE (category_id, actual_month)
```

### 4. kpi_daily_logs (일일 KPI 기록, 선택사항)
```
id (uuid, pk)
category_id, log_date (date)
daily_value (numeric)
created_by (uuid)
created_at (timestamptz)
```

## UI 페이지

**신규 페이지:**
- `/kpi` — KPI 대시보드 (기존 확장)
  - 월별 KPI 카드 (목표 vs 실적, % 표시)
  - 목표 설정 버튼 (Admin만)
  - 실적 입력 폼 (Admin만)
  - 차트: 목표선 + 실적선 (최근 6개월)

**신규 컴포넌트:**
- KPICard — 항목별 카드 (목표/실적/달성율)
- KPIChart — Recharts 기반 라인/바 차트
- KPITargetForm — 월별 목표 설정
- KPIActualForm — 월별 실적 입력

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/v1/kpi/categories | KPI 항목 마스터 |
| GET | /api/v1/kpi/targets | 월별 목표 조회 |
| POST | /api/v1/kpi/targets | 목표 설정 (Admin) |
| GET | /api/v1/kpi/actuals | 월별 실적 조회 |
| POST | /api/v1/kpi/actuals | 실적 입력 (Admin) |
| GET | /api/v1/kpi/summary | 대시보드 요약 (목표+실적+달성율) |
| GET | /api/v1/kpi/chart-data | 차트용 데이터 (최근 N개월) |

## 개발 순서

1. DB 마이그레이션 (kpi_categories, kpi_targets, kpi_actuals)
2. kpi_categories 초기 시드 데이터 삽입 (11개 항목)
3. API 7개 엔드포인트
4. KPI 대시보드 UI (기존 `/kpi` 개선)
5. KPI 카드 컴포넌트 + 색상 표시
6. 목표/실적 입력 폼 (Admin)
7. Recharts 차트 (라인 + 막대)
8. 통계 계산 (목표 달성율, 추세)
9. 테스트 & 배포

## 기대 효과

- 일일 KPI 모니터링 자동화
- 목표 대비 실적 시각화
- 월간 성과 추적 및 분석
- Admin 대시보드 운영 효율화

## 상태
🟡 **설계 완료** → Web-Builder AI Agent 개발 대기
