---
name: DSC Breakdown Management Phase 1 종합 설계 문서
description: 설비고장 보고/추적/분석 시스템 — DB 스키마 + 4 API 엔드포인트 + 테스트 전략
type: design
design_type: system_architecture
evaluation_required: false
status: DESIGN_PHASE_IN_PROGRESS
created_at: 2026-05-28T23:56:00+09:00
target_eta: 2026-06-02T18:00:00+09:00
---

# DSC Breakdown Management Phase 1 (BM-P1) 종합 설계 문서

**프로젝트명:** Breakdown Management Phase 1 (BM-P1)  
**범위:** 설비고장 보고/추적/분석 시스템  
**담당:** Subagent (Web-Builder tier)  
**기한:** 2026-06-02 18:00 KST (5일, 18시간)  
**마일스톤:** 설계(2일) → DB설계(1일) → API구현(2일) → 테스트(1일) → 배포(1일)

---

## Executive Summary

**목표:**
설비 고장 사건(breakdown events)을 체계적으로 보고, 추적, 분석할 수 있는 REST API 기반 시스템 구축.

**핵심 기능:**
- POST /api/bm/breakdowns — 새 고장 보고 생성
- GET /api/bm/breakdowns — 고장 목록 조회 (필터, 페이지네이션)
- PATCH /api/bm/breakdowns/:id — 고장 상태 업데이트 (상태 전환, 해결)
- GET /api/bm/breakdowns/analytics/summary — 분석 조회 (MTBF, MTTR, 심각도별 집계)

**DB 구조:**
- breakdown_reports 테이블 (고장 이벤트)
- breakdown_analysis 뷰 (집계 데이터)

**배포:**
Vercel (Next.js 14, Supabase PostgreSQL)

**성공 기준:**
- ✅ 4개 API 엔드포인트 완성 + 테스트
- ✅ 9개 이상 단위 테스트
- ✅ OpenAPI 3.0 문서
- ✅ Vercel 배포 완료

---

## 1. 시스템 아키텍처

### 1.1 고수준 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    REST API Layer                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Breakdowns   │ │  Analytics   │ │ Integration  │         │
│  │ CRUD (4 EP)  │ │  View (1 EP) │ │ (Asset link) │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Supabase PostgreSQL DB                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ breakdown_reports (고장 이벤트)                         │ │
│  │ - id, asset_id, description, status, severity, ...    │ │
│  │ - created_at, resolved_at, duration_minutes           │ │
│  │ - RLS enabled, indexes optimized                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ breakdown_analysis (분석 뷰)                           │ │
│  │ - MTTR, MTBF, severity_count, asset_month_summary     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 라이선스 & 통합

**Asset Master 연계 (필수):**
- breakdown_reports.asset_id → assets.id (외래 키)
- Severity 분류는 Asset Master 기준 (MINOR, NORMAL, MAJOR, LINE_DOWN)

**향후 통합 (Phase 2+):**
- Discord Bot — 고장 보고 알림
- Travel Management — 기술자 출장 자동 추적
- Backup System — 고장 데이터 자동 백업

---

## 2. 데이터베이스 설계

### 2.1 breakdown_reports 테이블 (핵심 테이블)

```sql
CREATE TABLE breakdown_reports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Asset Reference (필수, Asset Master와 연계)
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  
  -- 고장 정보
  description TEXT NOT NULL,                    -- 고장 설명 (영문)
  description_ta TEXT,                         -- 고장 설명 (타밀어)
  
  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'reported' CHECK (
    status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'won_fix')
  ),
  
  -- 심각도
  severity TEXT NOT NULL DEFAULT 'normal' CHECK (
    severity IN ('minor', 'normal', 'major', 'line_down')
  ),
  
  -- 시간 추적
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,                       -- 고장 시작 시간 (실제)
  resolved_at TIMESTAMPTZ,                      -- 고장 해결 시간
  
  -- 계산 필드 (자동 계산)
  duration_minutes INT GENERATED ALWAYS AS (
    CASE 
      WHEN resolved_at IS NOT NULL AND started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (resolved_at - started_at))::integer / 60
      ELSE NULL
    END
  ) STORED,
  
  -- 담당자
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 분류
  category TEXT CHECK (
    category IN ('mechanical', 'electrical', 'hydraulic', 'software', 'operator_error', 'unknown')
  ),
  root_cause TEXT,                              -- 근본 원인 분석
  action_taken TEXT,                            -- 조치 사항
  
  -- 사진/문서
  photos TEXT[] DEFAULT '{}',                   -- 저장소 URL 배열
  documents TEXT[] DEFAULT '{}',                -- 첨부 문서 URL
  
  -- 감사 필드
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 소프트 삭제
  deleted_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_breakdown_reports_asset_id ON breakdown_reports(asset_id);
CREATE INDEX idx_breakdown_reports_status ON breakdown_reports(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_breakdown_reports_severity ON breakdown_reports(severity) WHERE deleted_at IS NULL;
CREATE INDEX idx_breakdown_reports_reported_at ON breakdown_reports(reported_at DESC);
CREATE INDEX idx_breakdown_reports_resolved_at ON breakdown_reports(resolved_at DESC) WHERE resolved_at IS NOT NULL;
CREATE INDEX idx_breakdown_reports_asset_month ON breakdown_reports(
  asset_id, 
  DATE_TRUNC('month', reported_at)
) WHERE deleted_at IS NULL;

-- 트리거 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER breakdown_reports_updated_at_trigger
BEFORE UPDATE ON breakdown_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- RLS (행 수준 보안)
ALTER TABLE breakdown_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_all_breakdowns" ON breakdown_reports
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "users_create_breakdowns" ON breakdown_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_own_breakdowns" ON breakdown_reports
  FOR UPDATE USING (
    auth.uid() = reported_by 
    OR auth.uid() = assigned_to
    OR EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.user_id = auth.uid() 
      AND org_members.role = 'admin'
    )
  );
```

### 2.2 breakdown_analysis 뷰 (분석/집계)

```sql
CREATE OR REPLACE VIEW breakdown_analysis AS
SELECT
  -- Asset 정보
  br.asset_id,
  a.machine_asset_number,
  a.name_en AS asset_name,
  
  -- 월별 집계
  DATE_TRUNC('month', br.reported_at)::DATE AS month,
  
  -- KPI
  COUNT(*) FILTER (WHERE br.status = 'resolved') AS resolved_count,
  COUNT(*) FILTER (WHERE br.status != 'resolved') AS open_count,
  COUNT(*) AS total_count,
  
  -- 심각도 분포
  COUNT(*) FILTER (WHERE br.severity = 'line_down') AS line_down_count,
  COUNT(*) FILTER (WHERE br.severity = 'major') AS major_count,
  COUNT(*) FILTER (WHERE br.severity = 'normal') AS normal_count,
  COUNT(*) FILTER (WHERE br.severity = 'minor') AS minor_count,
  
  -- MTTR (Mean Time To Repair)
  ROUND(
    AVG(br.duration_minutes) FILTER (WHERE br.status = 'resolved' AND br.duration_minutes IS NOT NULL)
  )::INTEGER AS avg_mttr_minutes,
  
  -- MTBF (Mean Time Between Failures) — 월 내 평균 간격
  CASE 
    WHEN COUNT(*) > 1 THEN ROUND(
      (DATE_TRUNC('month', br.reported_at)::DATE + INTERVAL '1 month' - DATE_TRUNC('month', br.reported_at)::DATE)
      / NULLIF((COUNT(*) - 1), 0)
    )::INTEGER
    ELSE NULL
  END AS avg_mtbf_days,
  
  -- 총 다운타임
  COALESCE(
    SUM(br.duration_minutes) FILTER (WHERE br.status = 'resolved' AND br.duration_minutes IS NOT NULL),
    0
  )::BIGINT AS total_downtime_minutes
  
FROM breakdown_reports br
LEFT JOIN assets a ON br.asset_id = a.id
WHERE br.deleted_at IS NULL
GROUP BY br.asset_id, a.machine_asset_number, a.name_en, DATE_TRUNC('month', br.reported_at)
ORDER BY month DESC, br.asset_id ASC;
```

---

## 3. REST API 명세

### 3.1 API 개요

| Method | Path | 설명 | Auth | Status |
|--------|------|------|------|--------|
| POST | `/api/bm/breakdowns` | 새 고장 보고 | ✅ | 구현 대기 |
| GET | `/api/bm/breakdowns` | 고장 목록 조회 | ✅ | 구현 대기 |
| PATCH | `/api/bm/breakdowns/:id` | 고장 상태 업데이트 | ✅ | 구현 대기 |
| GET | `/api/bm/breakdowns/analytics/summary` | 분석 조회 | ✅ | 구현 대기 |

### 3.2 Endpoint 1: POST /api/bm/breakdowns (새 고장 보고)

**목적:** 새로운 고장 이벤트를 시스템에 보고

**요청 본문:**
```json
{
  "asset_id": "uuid",                    // 필수
  "description": "Motor stopped spinning",  // 필수
  "description_ta": "மோட்டார் சுழற்சி நின்றது", // 선택
  "severity": "major",                   // 필수, enum: minor|normal|major|line_down
  "category": "mechanical",              // 선택, enum: mechanical|electrical|hydraulic|software|operator_error|unknown
  "started_at": "2026-05-28T14:30:00Z",  // 선택, 고장 시작 시간 (없으면 now)
  "photos": ["https://..."],             // 선택, 사진 URL 배열
  "documents": []                        // 선택, 문서 URL 배열
}
```

**응답 (201 Created):**
```json
{
  "id": "uuid",
  "asset_id": "uuid",
  "machine_asset_number": "DCMI-XYZ-001",
  "status": "reported",
  "severity": "major",
  "category": "mechanical",
  "description": "Motor stopped spinning",
  "started_at": "2026-05-28T14:30:00Z",
  "reported_at": "2026-05-28T14:35:00Z",
  "reported_by": "uuid",
  "duration_minutes": null,
  "created_at": "2026-05-28T14:35:00Z"
}
```

**에러 응답:**
- 400 Bad Request — asset_id 또는 description 누락
- 401 Unauthorized — 인증 필요
- 404 Not Found — asset_id가 유효하지 않음

---

### 3.3 Endpoint 2: GET /api/bm/breakdowns (고장 목록 조회)

**목적:** 고장 목록을 필터, 정렬, 페이지네이션과 함께 조회

**쿼리 파라미터:**
```
GET /api/bm/breakdowns?
  asset_id=uuid
  &status=reported,in_progress
  &severity=major,line_down
  &reported_from=2026-05-01T00:00:00Z
  &reported_to=2026-05-31T23:59:59Z
  &sort_by=reported_at
  &sort_dir=desc
  &limit=50
  &offset=0
```

**응답 (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "asset_id": "uuid",
      "machine_asset_number": "DCMI-XYZ-001",
      "asset_name": "Motor Assembly Line",
      "status": "in_progress",
      "severity": "major",
      "description": "Motor stopped spinning",
      "reported_at": "2026-05-28T14:35:00Z",
      "started_at": "2026-05-28T14:30:00Z",
      "resolved_at": null,
      "duration_minutes": null,
      "assigned_to": "uuid"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

**필터 로직:**
- `status`: 쉼표로 구분된 상태 목록 (예: "reported,in_progress")
- `severity`: 쉼표로 구분된 심각도 목록
- `reported_from`, `reported_to`: 날짜 범위 (ISO 8601)
- `asset_id`: 특정 자산 필터

---

### 3.4 Endpoint 3: PATCH /api/bm/breakdowns/:id (상태 업데이트)

**목적:** 고장 상태, 해결 정보, 담당자 등을 업데이트

**요청 본문:**
```json
{
  "status": "resolved",                  // 선택, enum: reported|acknowledged|in_progress|resolved|won_fix
  "assigned_to": "uuid",                 // 선택
  "resolved_at": "2026-05-28T16:45:00Z", // 선택 (resolved 시 필수)
  "resolved_by": "uuid",                 // 선택
  "root_cause": "Bearing wear",          // 선택
  "action_taken": "Replaced bearing",    // 선택
  "category": "mechanical",              // 선택
  "duration_minutes": 135                // 선택 (자동 계산되므로 무시됨)
}
```

**응답 (200 OK):**
```json
{
  "id": "uuid",
  "status": "resolved",
  "resolved_at": "2026-05-28T16:45:00Z",
  "resolved_by": "uuid",
  "duration_minutes": 135,
  "root_cause": "Bearing wear",
  "action_taken": "Replaced bearing",
  "updated_at": "2026-05-28T16:46:00Z"
}
```

**검증:**
- resolved 상태 전환 시 resolved_at 필수
- resolved_at > started_at 검증
- status 전환 규칙: reported → acknowledged → in_progress → resolved (선형)

---

### 3.5 Endpoint 4: GET /api/bm/breakdowns/analytics/summary (분석 조회)

**목적:** 고장 분석 데이터 조회 (MTTR, MTBF, 심각도 분포 등)

**쿼리 파라미터:**
```
GET /api/bm/breakdowns/analytics/summary?
  asset_id=uuid
  &month=2026-05
  &aggregation=asset_month  // asset_month | severity | category | status
```

**응답 (200 OK) — aggregation=asset_month:**
```json
{
  "data": [
    {
      "asset_id": "uuid",
      "machine_asset_number": "DCMI-XYZ-001",
      "asset_name": "Motor Assembly Line",
      "month": "2026-05",
      
      "total_count": 5,
      "resolved_count": 3,
      "open_count": 2,
      
      "severity_breakdown": {
        "line_down": 1,
        "major": 2,
        "normal": 1,
        "minor": 1
      },
      
      "avg_mttr_minutes": 145,
      "avg_mtbf_days": 6,
      "total_downtime_minutes": 435
    }
  ]
}
```

**응답 (200 OK) — aggregation=severity:**
```json
{
  "data": [
    {
      "severity": "major",
      "count": 12,
      "avg_duration_minutes": 180,
      "percentage": 28.5
    }
  ]
}
```

---

## 4. 구현 로드맵 (7일)

### 4.1 일일 마일스톤

| 날짜 | 단계 | 작업 | 예상시간 | 상태 |
|------|------|------|---------|------|
| 2026-05-28 (오늘) | 설계 | 종합 설계 문서 작성 | 8h | 진행중 |
| 2026-05-29 | 설계 | 설계 검토 + DB 설계 마무리 | 8h | 대기 |
| 2026-05-30 | DB | Supabase 마이그레이션 + RLS 검증 | 8h | 대기 |
| 2026-05-31 | API | 4 API 엔드포인트 구현 + 기본 테스트 | 16h | 대기 |
| 2026-06-01 | 테스트 | Jest 9+ 테스트 + E2E 검증 | 8h | 대기 |
| 2026-06-02 (오전) | 배포 | Vercel 배포 + 모니터링 | 4h | 대기 |
| 2026-06-02 (18:00) | ✅ | **완료 (ETA)** | — | 대기 |

### 4.2 단계별 성과물

#### 2026-05-28 ~ 29 (설계, 2일)
- ✅ 이 문서 (BM_P1_COMPREHENSIVE_DESIGN.md) 완성
- ✅ 데이터베이스 스키마 확정
- ✅ 4 API 엔드포인트 상세 명세
- ✅ 테스트 전략 및 체크리스트
- 📦 산출물: design.md, db/schema.sql (드래프트)

#### 2026-05-30 (DB, 1일)
- ✅ db/bm_p1_schema.sql 작성 및 실행
- ✅ RLS 정책 검증
- ✅ 인덱스 성능 확인
- ✅ 기본 데이터 시드 (테스트 자산)
- 📦 산출물: db/bm_p1_schema.sql, 마이그레이션 기록

#### 2026-05-31 (API, 2일)
- ✅ pages/api/bm/breakdowns.js (POST, GET)
- ✅ pages/api/bm/breakdowns/[id].js (PATCH)
- ✅ pages/api/bm/breakdowns/analytics/summary.js (GET)
- ✅ 에러 처리 및 입력 검증
- ✅ OpenAPI 3.0 문서 자동 생성
- 📦 산출물: 4개 API 파일, openapi.yaml

#### 2026-06-01 (테스트, 1일)
- ✅ __tests__/api/bm/breakdowns.test.js (9+ 테스트)
- ✅ Jest 커버리지 85%+ 달성
- ✅ E2E 시나리오 검증 (보고 → 업데이트 → 조회)
- ✅ RLS 권한 검증
- 📦 산출물: 테스트 파일, 커버리지 리포트

#### 2026-06-02 (배포, 1일)
- ✅ 로컬 빌드 성공 검증
- ✅ Vercel 배포
- ✅ 배포 후 스모크 테스트
- ✅ 모니터링 + 알림 설정
- 📦 산출물: Vercel 배포 URL, 모니터링 대시보드

---

## 5. 기술 명세

### 5.1 스택

- **Database:** Supabase PostgreSQL (16+)
- **API Framework:** Next.js 14 Pages Router (`pages/api/...`)
- **Authentication:** Supabase Auth (JWT)
- **Testing:** Jest + Supertest
- **Deployment:** Vercel
- **Language:** TypeScript (선택) / JavaScript

### 5.2 환경 변수

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 5.3 의존성

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "next": "^14.0",
    "react": "^18.0"
  },
  "devDependencies": {
    "jest": "^29.x",
    "supertest": "^6.x",
    "@testing-library/react": "^14.x",
    "typescript": "^5.x"
  }
}
```

---

## 6. 테스트 전략

### 6.1 단위 테스트 (Jest)

**Test Coverage: 85%+**

```
✅ POST /api/bm/breakdowns
  - [x] 유효한 요청 → 201 Created
  - [x] asset_id 누락 → 400 Bad Request
  - [x] description 누락 → 400 Bad Request
  - [x] 유효하지 않은 asset_id → 404 Not Found
  - [x] 인증 없음 → 401 Unauthorized

✅ GET /api/bm/breakdowns
  - [x] 전체 목록 조회 → 200 OK
  - [x] status 필터 → 올바른 결과
  - [x] severity 필터 → 올바른 결과
  - [x] 날짜 범위 필터 → 올바른 결과
  - [x] 페이지네이션 (limit, offset) → 올바른 페이지

✅ PATCH /api/bm/breakdowns/:id
  - [x] 상태 업데이트 → 200 OK
  - [x] resolved 상태 + resolved_at → 저장됨
  - [x] resolved_at 검증 (started_at 이후) → 검증됨
  - [x] 존재하지 않는 ID → 404 Not Found

✅ GET /api/bm/breakdowns/analytics/summary
  - [x] asset_month 집계 → MTTR/MTBF 계산됨
  - [x] severity 집계 → 심각도별 분포
  - [x] 빈 결과 처리 → 200 OK (empty array)
```

### 6.2 통합 테스트

```
✅ End-to-End Flow
  - [x] 고장 보고 (POST) → 조회 (GET) → 업데이트 (PATCH) → 분석 조회 (GET)
  - [x] 상태 전환 워크플로우 (reported → in_progress → resolved)
  - [x] RLS 권한 검증 (reported_by 사용자만 수정 가능)
  - [x] Asset Master 연계 검증 (asset_id 참조 무결성)
```

### 6.3 데이터베이스 검증

```sql
-- 마이그레이션 후 검증
SELECT COUNT(*) FROM breakdown_reports;        -- 테이블 생성 확인
SELECT COUNT(*) FROM breakdown_analysis;       -- 뷰 생성 확인
SELECT * FROM information_schema.columns WHERE table_name = 'breakdown_reports';  -- 컬럼 확인
```

---

## 7. 체크리스트

### 설계 검증 (2026-05-29)
- [ ] DB 스키마 검토 완료
- [ ] API 명세 검토 완료
- [ ] Asset Master 연계 검증
- [ ] 에러 처리 전략 확인

### DB 마이그레이션 (2026-05-30)
- [ ] breakdown_reports 테이블 생성
- [ ] breakdown_analysis 뷰 생성
- [ ] 모든 인덱스 생성
- [ ] RLS 정책 활성화
- [ ] 테스트 데이터 시드 (최소 3개 자산, 각 5개 고장 이벤트)

### API 구현 (2026-05-31)
- [ ] POST /api/bm/breakdowns 구현 + 테스트
- [ ] GET /api/bm/breakdowns 구현 + 테스트 (필터, 페이지네이션)
- [ ] PATCH /api/bm/breakdowns/:id 구현 + 테스트
- [ ] GET /api/bm/breakdowns/analytics/summary 구현 + 테스트
- [ ] OpenAPI 3.0 문서 자동 생성

### 테스트 (2026-06-01)
- [ ] Jest 9개 이상 테스트 작성
- [ ] 커버리지 85%+ 달성
- [ ] E2E 워크플로우 검증
- [ ] RLS 권한 테스트

### 배포 (2026-06-02)
- [ ] 로컬 npm build 성공
- [ ] Vercel 배포 성공
- [ ] Smoke test (각 endpoint 호출 확인)
- [ ] 모니터링 대시보드 설정

---

## 8. 리스크 & 완화 전략

| 리스크 | 영향도 | 확률 | 완화 전략 |
|--------|--------|------|----------|
| Asset Master 외래키 제약 | 높음 | 중간 | 마이그레이션 전 assets 테이블 존재 검증 |
| RLS 정책 오류 | 높음 | 중간 | 명시적 RLS 테스트, 테스트 사용자로 권한 검증 |
| MTBF 계산 로직 | 중간 | 낮음 | SQL 검증 테스트, 샘플 데이터로 수동 검증 |
| API 시간초과 | 중간 | 낮음 | 대량 데이터 페이지네이션 (limit=50), 인덱스 최적화 |
| 인증 토큰 누락 | 중간 | 중간 | 명시적 auth 미들웨어, 401 테스트 |

---

## 9. 성공 기준 (승인 체크리스트)

### 필수 기능
- [ ] 4개 API 엔드포인트 모두 동작
- [ ] 9개 이상 Jest 테스트 통과
- [ ] 커버리지 85%+ 달성
- [ ] OpenAPI 3.0 문서 완성
- [ ] Vercel 배포 완료

### 품질 기준
- [ ] 모든 에러 응답 (400, 401, 404, 500) 처리됨
- [ ] 입력 검증 완료 (타입, 길이, 포맷)
- [ ] RLS 정책 검증 완료
- [ ] Asset Master 연계 테스트 완료
- [ ] 응답 시간 < 500ms (pagination 포함)

### 문서 기준
- [ ] API 사용 예제 포함
- [ ] 에러 코드 설명서 작성
- [ ] DB 스키마 다이어그램 포함
- [ ] 배포 절차 문서화

---

## 10. 다음 단계 (Phase 2+)

### Phase 2: UI 대시보드
- React 컴포넌트 (고장 목록, 상세 보기, 생성 폼)
- 필터 UI
- 분석 차트 (MTTR, MTBF, 심각도 분포)

### Phase 3: 알림 및 자동화
- Discord Bot 통합 (고장 보고 알림)
- Email 알림
- Cron 기반 분석 리포트

### Phase 4: 고급 분석
- 머신러닝 기반 이상 탐지
- 예측 유지보수 제안
- 비용 분석

---

**문서 상태:** 🟡 설계 진행 중  
**최종 업데이트:** 2026-05-28 23:56 KST  
**다음 검토:** 2026-05-29 09:00 KST (설계 마무리 + DB 마이그레이션 준비)

