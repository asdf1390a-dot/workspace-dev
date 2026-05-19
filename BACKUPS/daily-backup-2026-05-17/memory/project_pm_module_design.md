---
name: PM Plan (예방보전) 모듈 설계
description: 설비별 점검 주기 관리 + 일정 자동 생성 + 준수율 추적 (기존 확장)
type: project
relatedFiles: DESIGN_PM.md
---

# PM Plan (예방보전) 모듈 설계

**작성일:** 2026-05-12  
**상태:** 설계 완료 → 웹개발자 개발 대기  
**담당:** Web-Builder  
**포털:** https://dsc-fms-portal.vercel.app

## 설계 배경

현재 DSC Mannur 공장의 PM(예방보전)은 Excel로 관리된다. FMS 포털 통합 목표:
- 설비별 점검 주기 등록 → **예정일 자동 생성**
- 현장 작업자가 폰으로 **완료 처리 + 작업 기록** 입력
- 관리자는 **계획 대비 실적(Compliance Rate)** 실시간 확인
- 미실시 항목 빨간색 강조 → **누락 없이** 보전 업무 수행

## 기존 구현 현황

**이미 구현된 것:**
- `db/06_pm_module.sql` — pm_plans, pm_schedules, RLS, RPC
- `pages/pm/index.js` — 일정 목록 (314줄, 6개 필터 탭)
- `pages/pm/new.js` — PM 계획 등록 (266줄, frequency_days 6개 옵션)
- `pages/pm/[id].js` — 상세 + 완료 처리 (373줄)

**신규 파일:** `db/13_pm_module.sql` (06_pm_module.sql 보완, ALTER 방식)

## DB 스키마 확장 (db/13_pm_module.sql)

### pm_plans 테이블 추가 칼럼
```
- frequency_label (daily|weekly|biweekly|monthly|quarterly|biannual|annual)
- category (lubrication|inspection|calibration|cleaning|general)
- checklist (JSONB, [{"item":"...", "required":true}])
- created_by (UUID, FK: auth.users)
- updated_at (자동 갱신 트리거)
```

### pm_schedules 테이블 추가 칼럼
```
- updated_at (자동 갱신)
```

### pm_work_logs 테이블 (신규)
```
- id (UUID, PK)
- schedule_id (FK: pm_schedules)
- performed_by (UUID, FK: auth.users)
- checked_list (JSONB, [{"item":"...", "completed":true, "notes":"..."}])
- work_notes (text, 작업 기록/발견사항)
- photo_urls (text[], Supabase Storage)
- performed_at (timestamptz)
- completed_at (timestamptz)
```

### pm_parts_used 테이블 (신규)
```
- id (UUID, PK)
- work_log_id (FK: pm_work_logs)
- spare_part_id (FK: spare_parts)
- quantity_used (integer)
- notes (text)
- created_at (timestamptz)
```

## UI 페이지 (신규 & 개선)

### 기존 페이지 개선
- `/pm/index.js` — 탭 추가: "완료율", "미실시 (급)" 강조
- `/pm/[id].js` — 작업 로그 + 체크리스트 입력 확장

### 신규 페이지
- `/pm/dashboard` — PM 준수율 대시보드 (월별, 설비별)
- `/pm/reports` — PM 월간 리포트 (준수율, 부품 사용 현황)

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/pm/plans | PM 계획 목록 |
| POST | /api/pm/plans | PM 계획 등록 |
| PUT | /api/pm/plans/:id | PM 계획 편집 |
| GET | /api/pm/schedules | 예정 일정 조회 |
| POST | /api/pm/schedules/:id/complete | 작업 완료 처리 |
| POST | /api/pm/work-logs | 작업 로그 저장 |
| GET | /api/pm/work-logs/:schedule_id | 작업 로그 조회 |
| POST | /api/pm/parts-used | 사용 부품 기록 |
| GET | /api/pm/compliance-rate | 준수율 계산 (월별) |
| GET | /api/pm/dashboard | 대시보드 데이터 |

## 개발 순서

1. DB 마이그레이션 (pm_plans ALTER + pm_work_logs + pm_parts_used 신규)
2. PM 계획 API (GET, POST, PUT)
3. 작업 로그 API (완료 처리, 로그 저장, 조회)
4. 부품 사용 기록 API
5. 준수율 계산 API (RPC)
6. PM 대시보드 페이지 (차트 + KPI)
7. 작업 로그 UI (체크리스트 + 사진 업로드)
8. 월간 리포트 생성
9. 테스트 & 배포

## 설계 원칙
- **모바일 퍼스트:** 현장 작업자 사용
- **기존 UI 패턴:** 탭, 카드, 좌측 컬러바, D-day 배지
- **인라인 스타일:** Tailwind 미사용
- **다크 테마:** #0f172a (배경), #1e293b (카드), #ef4444 (강조)
- **영어 레이블 우선:** 타밀어는 선택적 추가

## 상태
🟡 **설계 완료** → 웹개발자 개발 대기
