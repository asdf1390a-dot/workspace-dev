---
name: BM-P1 Pre-Deployment Verification Checklist
description: Comprehensive pre-deployment checklist for Breakdown Management Phase 1 (5 API endpoints, RLS verification, UI integration)
type: project
---

# BM-P1 Pre-Deployment Verification Checklist

**Project:** Breakdown Management Phase 1 (완성 100%)  
**Target Deployment Date:** 2026-06-02 이전  
**Verification Owner:** DevOps Engineer + QA Specialist  
**Priority Level:** 🔴 CRITICAL (Production System)

---

## 1️⃣ DATABASE SCHEMA VERIFICATION

### 1.1 Table Structure Check
- [ ] **breakdown_reports 테이블 생성 확인**
  - [ ] `id` (UUID, PRIMARY KEY) — 존재 확인
  - [ ] `asset_id` (UUID, NOT NULL, FK to assets) — Foreign key constraint 검증
  - [ ] `description` (TEXT, NOT NULL) — 필수 필드 확인
  - [ ] `description_ta` (TEXT, nullable) — Tamil 지원 확인
  - [ ] `status` (TEXT, CHECK constraint) — 5가지 상태만 가능 검증
  - [ ] `severity` (TEXT, CHECK constraint) — 4가지 레벨만 가능 검증
  - [ ] `category` (TEXT, nullable) — 6가지 카테고리만 가능 검증
  - [ ] `reported_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now()) — 타임스탬프 생성 확인
  - [ ] `started_at` (TIMESTAMPTZ, nullable) — 고장 시작 시간 기록 가능 확인
  - [ ] `resolved_at` (TIMESTAMPTZ, nullable) — 해결 시간 기록 가능 확인
  - [ ] `duration_minutes` (INT, GENERATED ALWAYS AS STORED) — 자동 계산 검증
  - [ ] `reported_by`, `assigned_to`, `resolved_by` (UUID FK) — 사용자 참조 검증
  - [ ] `root_cause`, `action_taken` — 텍스트 필드 확인
  - [ ] `photos`, `documents` — TEXT[] 배열 필드 확인
  - [ ] `created_at`, `updated_at`, `deleted_at` — 감사 필드 확인

**명령어:**
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'breakdown_reports' ORDER BY ordinal_position;
```

### 1.2 Index Verification
- [ ] **idx_breakdown_reports_asset_id** — 존재 확인 (`asset_id` 검색 성능)
- [ ] **idx_breakdown_reports_status** — 존재 확인 (상태별 필터링)
- [ ] **idx_breakdown_reports_severity** — 존재 확인 (심각도 필터링)
- [ ] **idx_breakdown_reports_reported_at** — 존재 확인 (날짜 범위 쿼리)
- [ ] **idx_breakdown_reports_resolved_at** — 존재 확인 (해결 시간 쿼리)
- [ ] **idx_breakdown_reports_asset_month** — 존재 확인 (월별 분석)
- [ ] **idx_breakdown_reports_reported_by** — 존재 확인 (사용자별 조회)
- [ ] **idx_breakdown_reports_assigned_to** — 존재 확인 (담당자별 조회)

**명령어:**
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'breakdown_reports';
```

### 1.3 Trigger & Function Verification
- [ ] **set_breakdown_updated_at() 함수** — 존재 확인
- [ ] **breakdown_reports_updated_at_trigger** — 존재 확인
  - [ ] UPDATE 시 `updated_at` 자동 갱신 테스트 (아래 참고)

**테스트 쿼리:**
```sql
-- 트리거 테스트
INSERT INTO breakdown_reports (asset_id, description, reported_by)
VALUES ('asset-uuid', 'Test breakdown', 'user-uuid');

UPDATE breakdown_reports 
SET status = 'acknowledged' 
WHERE id = 'inserted-id';

-- updated_at 변경 확인
SELECT id, updated_at FROM breakdown_reports WHERE id = 'inserted-id';
```

### 1.4 View Creation Check
- [ ] **breakdown_analysis 뷰** — 존재 확인
  - [ ] `asset_id`, `machine_asset_number`, `asset_name` — 자산 정보 정렬
  - [ ] `month` — 월별 집계 확인
  - [ ] `resolved_count`, `open_count`, `total_count` — KPI 계산 검증
  - [ ] `line_down_count`, `major_count`, `normal_count`, `minor_count` — 심각도 분포
  - [ ] `avg_mttr_minutes` — MTTR 계산 (평균 수리 시간)
  - [ ] `avg_mtbf_hours` — MTBF 계산 (고장 간 평균 시간)
  - [ ] `total_downtime_minutes` — 총 다운타임

**테스트 쿼리:**
```sql
SELECT * FROM breakdown_analysis LIMIT 5;
```

---

## 2️⃣ ROW LEVEL SECURITY (RLS) VERIFICATION

### 2.1 RLS Enable Check
- [ ] **breakdown_reports 테이블 RLS 활성화 확인**

**명령어:**
```sql
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'breakdown_reports';
-- 결과: relrowsecurity = true
```

### 2.2 RLS Policy 1: "users_view_all_breakdowns"
**정책:** 모든 인증 사용자가 활성 고장 보고서 조회 가능 (soft-deleted 제외)

**검증:**
- [ ] Policy 존재 확인
- [ ] SELECT 작업에만 적용 확인 (`deleted_at IS NULL`)

**테스트:**
```sql
-- Policy 확인
SELECT schemaname, tablename, policyname, qual 
FROM pg_policies WHERE tablename = 'breakdown_reports';

-- 실제 테스트 (인증 전/후):
-- 1. 인증 사용자로 로그인
-- 2. SELECT 실행 → 성공 확인
-- 3. soft-deleted 기록 포함 안 됨 확인
SELECT COUNT(*) FROM breakdown_reports WHERE deleted_at IS NOT NULL;
-- 결과: 0
```

### 2.3 RLS Policy 2: "users_create_breakdowns"
**정책:** 인증된 사용자는 새 고장 보고서 작성 가능

**검증:**
- [ ] Policy 존재 확인
- [ ] INSERT 작업에만 적용 확인 (`auth.uid() IS NOT NULL`)

**테스트:**
```sql
-- 정책된 사용자로 INSERT 시도
INSERT INTO breakdown_reports (asset_id, description, reported_by)
VALUES (
  'valid-asset-uuid',
  'Test breakdown',
  'auth-uid'
);
-- 결과: 성공

-- 인증되지 않은 사용자로 INSERT 시도
-- (테스트 환경에서는 auth.uid() = NULL)
-- 결과: 실패 (403 Forbidden 또는 RLS 위반)
```

### 2.4 RLS Policy 3: "users_update_own_breakdowns"
**정책:** 보고자, 담당자, 또는 관리자만 업데이트 가능

**검증:**
- [ ] Policy 존재 확인
- [ ] UPDATE 작업에만 적용 확인
- [ ] 세 가지 조건 모두 검증:
  - [ ] `auth.uid() = reported_by` (보고자)
  - [ ] `auth.uid() = assigned_to` (담당자)
  - [ ] `org_members.role = 'admin'` (관리자)

**테스트 케이스:**
```sql
-- 테스트 케이스 1: 보고자가 업데이트
-- User A가 보고, User A가 업데이트 시도
UPDATE breakdown_reports 
SET status = 'acknowledged' 
WHERE id = 'test-breakdown-id' AND reported_by = 'user-a-uuid';
-- 결과: 성공

-- 테스트 케이스 2: 담당자가 업데이트
-- User A가 보고, User B가 담당자, User B가 업데이트 시도
UPDATE breakdown_reports 
SET status = 'in_progress' 
WHERE id = 'test-breakdown-id' AND assigned_to = 'user-b-uuid';
-- 결과: 성공

-- 테스트 케이스 3: 무관한 사용자 업데이트 시도
-- User C (무관한 사용자)가 업데이트 시도
UPDATE breakdown_reports 
SET status = 'acknowledged' 
WHERE id = 'test-breakdown-id' AND auth.uid() = 'user-c-uuid';
-- 결과: 실패 (403 Forbidden)

-- 테스트 케이스 4: 관리자가 업데이트
-- User Admin (관리자)이 업데이트 시도
-- org_members 테이블에 (user-admin-uuid, admin) 레코드 필요
UPDATE breakdown_reports 
SET status = 'resolved' 
WHERE id = 'test-breakdown-id';
-- 결과: 성공 (관리자는 모든 레코드 업데이트 가능)
```

**RLS 검증 명령어:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'breakdown_reports'
ORDER BY policyname;
```

---

## 3️⃣ API ENDPOINT VERIFICATION

### 3.1 Endpoint 1: GET /api/bm/breakdowns (List)
**기능:** 고장 보고서 목록 조회 (필터링, 정렬, 페이지네이션)

**테스트 항목:**
- [ ] **기본 요청 (필터 없음)**
  ```bash
  curl -H "Authorization: Bearer $JWT_TOKEN" \
    "http://localhost:3000/api/bm/breakdowns"
  ```
  - [ ] HTTP 200 응답 확인
  - [ ] `data` 배열 반환 확인
  - [ ] `pagination` 객체 포함 확인 (total, limit, offset, has_more)

- [ ] **자산별 필터링 (asset_id)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns?asset_id=ASSET_UUID"
  ```
  - [ ] 특정 자산의 고장 보고서만 반환
  - [ ] `total` 값이 필터된 개수 반영

- [ ] **상태별 필터링 (status, 쉼표로 구분)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns?status=reported,acknowledged"
  ```
  - [ ] 두 가지 상태만 반환
  - [ ] 다른 상태(in_progress, resolved, won_fix) 제외

- [ ] **심각도 필터링 (severity)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns?severity=major,line_down"
  ```
  - [ ] 높은 심각도 보고서만 반환

- [ ] **날짜 범위 필터링 (reported_from, reported_to)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns?reported_from=2026-05-01T00:00:00Z&reported_to=2026-05-31T23:59:59Z"
  ```
  - [ ] 지정된 기간 내 보고서만 반환

- [ ] **정렬 (sort_by, sort_dir)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns?sort_by=reported_at&sort_dir=asc"
  ```
  - [ ] `reported_at` 기준 오름차순 정렬 확인
  - [ ] `sort_dir=desc`로도 테스트

- [ ] **페이지네이션 (limit, offset)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns?limit=10&offset=10"
  ```
  - [ ] 10개 기록 반환 확인
  - [ ] 다음 페이지로 offset 이동 확인
  - [ ] `has_more` 값 정확성 검증

- [ ] **RLS 검증: 삭제된 기록 제외**
  - [ ] soft-deleted 기록(`deleted_at IS NOT NULL`) 포함 안 됨

### 3.2 Endpoint 2: POST /api/bm/breakdowns (Create)
**기능:** 새 고장 보고서 작성

**테스트 항목:**
- [ ] **필수 필드 검증 (asset_id, description)**
  ```bash
  curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{"asset_id":"ASSET_UUID","description":"Motor failure"}' \
    "http://localhost:3000/api/bm/breakdowns"
  ```
  - [ ] HTTP 201 응답 (Created)
  - [ ] 응답에 생성된 ID 포함
  - [ ] `reported_by`는 현재 사용자 UUID로 자동 설정

- [ ] **선택 필드 포함**
  ```bash
  curl -X POST \
    -d '{
      "asset_id":"ASSET_UUID",
      "description":"Motor failure",
      "description_ta":"Motor araikalam",
      "severity":"major",
      "category":"mechanical",
      "started_at":"2026-05-29T10:00:00Z",
      "photos":["https://example.com/photo1.jpg"],
      "documents":["https://example.com/doc1.pdf"]
    }' \
    "http://localhost:3000/api/bm/breakdowns"
  ```
  - [ ] 모든 필드 저장 확인
  - [ ] `severity` 기본값 ('normal') 적용 확인

- [ ] **잘못된 asset_id (존재하지 않는 자산)**
  ```bash
  curl -X POST \
    -d '{"asset_id":"nonexistent-uuid","description":"Test"}' \
    "http://localhost:3000/api/bm/breakdowns"
  ```
  - [ ] HTTP 400 (Bad Request) 또는 409 (Conflict)
  - [ ] 오류 메시지: "Asset not found" 또는 FK constraint 오류

- [ ] **잘못된 severity 값**
  ```bash
  curl -X POST \
    -d '{"asset_id":"ASSET_UUID","description":"Test","severity":"critical"}' \
    "http://localhost:3000/api/bm/breakdowns"
  ```
  - [ ] HTTP 400 (Bad Request)
  - [ ] 유효성 검증 오류 메시지

- [ ] **미인증 요청 (JWT 토큰 없음)**
  ```bash
  curl -X POST \
    -d '{"asset_id":"ASSET_UUID","description":"Test"}' \
    "http://localhost:3000/api/bm/breakdowns"
  ```
  - [ ] HTTP 401 (Unauthorized)

### 3.3 Endpoint 3: GET /api/bm/breakdowns/{id} (Get Single)
**기능:** 단일 고장 보고서 조회

**테스트 항목:**
- [ ] **존재하는 ID 조회**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns/BREAKDOWN_UUID"
  ```
  - [ ] HTTP 200 응답
  - [ ] 올바른 데이터 반환 확인

- [ ] **존재하지 않는 ID**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns/nonexistent-uuid"
  ```
  - [ ] HTTP 404 (Not Found)

- [ ] **RLS: soft-deleted 기록 접근**
  - [ ] soft-deleted 기록은 HTTP 404 반환

### 3.4 Endpoint 4: PATCH /api/bm/breakdowns/{id} (Update)
**기능:** 고장 보고서 업데이트 (상태 전환, 담당자 할당, 해결 등록)

**테스트 항목:**
- [ ] **상태 전환: reported → acknowledged**
  ```bash
  curl -X PATCH \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{"status":"acknowledged"}' \
    "http://localhost:3000/api/bm/breakdowns/BREAKDOWN_UUID"
  ```
  - [ ] HTTP 200 응답
  - [ ] `status` 필드 업데이트 확인

- [ ] **상태 전환: acknowledged → in_progress**
  ```bash
  curl -X PATCH \
    -d '{"status":"in_progress","assigned_to":"TECHNICIAN_UUID"}' \
    "http://localhost:3000/api/bm/breakdowns/BREAKDOWN_UUID"
  ```
  - [ ] `assigned_to` 담당자 할당 확인

- [ ] **상태 전환: in_progress → resolved**
  ```bash
  curl -X PATCH \
    -d '{
      "status":"resolved",
      "resolved_at":"2026-05-29T11:30:00Z",
      "resolved_by":"TECHNICIAN_UUID",
      "root_cause":"Bearing failure",
      "action_taken":"Replaced bearing"
    }' \
    "http://localhost:3000/api/bm/breakdowns/BREAKDOWN_UUID"
  ```
  - [ ] `resolved_at` 설정 확인
  - [ ] `duration_minutes` 자동 계산 (resolved_at - started_at)
  - [ ] 근본 원인 및 조치 사항 저장

- [ ] **상태 전환: reported → won_fix (우회 해결)**
  ```bash
  curl -X PATCH \
    -d '{"status":"won_fix"}' \
    "http://localhost:3000/api/bm/breakdowns/BREAKDOWN_UUID"
  ```
  - [ ] 직접 해결 상태로 전환 가능 확인

- [ ] **잘못된 상태 전환 (backward transition)**
  ```bash
  curl -X PATCH \
    -d '{"status":"reported"}' \
    "http://localhost:3000/api/bm/breakdowns/BREAKDOWN_UUID"
  ```
  - [ ] HTTP 400 (Bad Request)
  - [ ] 오류 메시지: "Invalid status transition"

- [ ] **해결된 보고서는 더 이상 전환 불가**
  - [ ] `status=resolved`인 기록 업데이트 시도
  - [ ] HTTP 400 (Bad Request) 또는 409 (Conflict)

- [ ] **RLS: 보고자가 아닌 사용자 업데이트 시도**
  - [ ] User A가 보고한 기록
  - [ ] User B (무관한 사용자)가 업데이트 시도
  - [ ] HTTP 403 (Forbidden)

- [ ] **RLS: 담당자가 업데이트 가능**
  - [ ] User B가 담당자로 할당됨
  - [ ] User B가 업데이트 시도
  - [ ] HTTP 200 성공

### 3.5 Endpoint 5: GET /api/bm/breakdowns/analytics/summary (Analytics)
**기능:** 고장 보고서 분석 및 KPI 조회

**테스트 항목:**
- [ ] **기본 분석 (모든 자산, 모든 기간)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns/analytics/summary"
  ```
  - [ ] HTTP 200 응답
  - [ ] `data` 배열 (자산별 월별 데이터)
  - [ ] `overall_metrics` 객체 (전체 KPI)
  - [ ] `pagination` 객체

- [ ] **자산별 필터링 (asset_id)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns/analytics/summary?asset_id=ASSET_UUID"
  ```
  - [ ] 특정 자산의 분석만 반환

- [ ] **월별 필터링 (month)**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns/analytics/summary?month=2026-05-01"
  ```
  - [ ] 특정 월의 데이터만 반환

- [ ] **KPI 검증:**
  ```json
  {
    "asset_id": "uuid",
    "machine_asset_number": "ASSET-001",
    "asset_name": "Motor",
    "month": "2026-05-01",
    "summary": {
      "total_breakdowns": 10,
      "resolved_count": 8,
      "open_count": 2,
      "resolution_rate": 80
    },
    "severity_distribution": {
      "line_down": 2,
      "major": 3,
      "normal": 4,
      "minor": 1
    },
    "performance_metrics": {
      "avg_mttr_minutes": 120,
      "avg_mtbf_hours": 72,
      "total_downtime_minutes": 960
    }
  }
  ```
  - [ ] `total_breakdowns` = resolved + open 확인
  - [ ] `resolution_rate` = (resolved / total) * 100 확인
  - [ ] `avg_mttr_minutes` = 평균 수리 시간
  - [ ] `avg_mtbf_hours` = 고장 간 평균 시간
  - [ ] `total_downtime_minutes` = 모든 resolved 기록의 duration 합

- [ ] **overall_metrics 검증:**
  - [ ] 전체 합계가 모든 자산의 합 일치 확인

- [ ] **페이지네이션**
  ```bash
  curl "http://localhost:3000/api/bm/breakdowns/analytics/summary?limit=5&offset=5"
  ```
  - [ ] 페이지네이션 작동 확인

---

## 4️⃣ UI INTEGRATION VERIFICATION

### 4.1 Mock Data Preparation
- [ ] **테스트용 Mock Breakdowns 생성 (최소 20개)**
  - [ ] 다양한 상태: reported (5개), acknowledged (3개), in_progress (5개), resolved (6개), won_fix (1개)
  - [ ] 다양한 심각도: minor (3개), normal (7개), major (7개), line_down (3개)
  - [ ] 다양한 카테고리: mechanical (4개), electrical (4개), hydraulic (3개), software (3개), operator_error (3개), unknown (3개)
  - [ ] 날짜 범위: 2026-03-01부터 2026-05-29까지

**Mock Data 스크립트 (SQL):**
```sql
-- 예시 mock 데이터 (실제로는 자동 생성 스크립트 필요)
INSERT INTO breakdown_reports (
  asset_id, description, description_ta, status, severity, 
  category, reported_by, assigned_to, resolved_by,
  reported_at, started_at, resolved_at
) VALUES (
  'asset-uuid-1',
  'Motor bearing failure',
  'Motor arai kalam',
  'resolved',
  'major',
  'mechanical',
  'user-uuid-1',
  'user-uuid-2',
  'user-uuid-2',
  '2026-05-20T10:00:00Z',
  '2026-05-20T10:00:00Z',
  '2026-05-20T12:30:00Z'
);
```

### 4.2 Dashboard Component Tests
- [ ] **Breakdown List Component (모든 필터 작동)**
  - [ ] 기본 목록 렌더링
  - [ ] 상태 필터 드롭다운 작동
  - [ ] 심각도 필터 작동
  - [ ] 날짜 범위 필터 작동
  - [ ] 페이지네이션 작동
  - [ ] 정렬 순서 변경 가능

- [ ] **Breakdown Detail Card**
  - [ ] 모든 필드 표시 (설명, 상태, 심각도, 카테고리, 담당자 등)
  - [ ] 수리 시간 (duration_minutes) 표시
  - [ ] 사진 및 문서 링크 클릭 가능
  - [ ] 상태 전환 버튼 (사용자 권한 기반)

- [ ] **Breakdown Creation Form**
  - [ ] 필수 필드: asset_id, description
  - [ ] 선택 필드: description_ta, severity, category, started_at, photos, documents
  - [ ] Asset 자동완성 (Asset Master 통합)
  - [ ] 폼 제출 → API POST /api/bm/breakdowns

- [ ] **Breakdown Update Form**
  - [ ] 상태 선택 (valid transitions만 표시)
  - [ ] 담당자 할당 (User 자동완성)
  - [ ] 해결 시간 설정 (status = resolved일 때만)
  - [ ] 근본 원인 및 조치 사항 입력

- [ ] **Analytics Dashboard**
  - [ ] 전체 KPI 표시 (총 고장, 해결, 미해결, 해결률)
  - [ ] 자산별 월별 분석 테이블
  - [ ] 심각도 분포 차트 (pie/bar chart)
  - [ ] MTTR & MTBF 차트
  - [ ] 다운타임 트렌드 (시계열)

### 4.3 Responsive Design
- [ ] **Desktop (1920x1080) 테스트**
  - [ ] 테이블 레이아웃 정렬
  - [ ] 모든 컬럼 가시성

- [ ] **Tablet (768x1024) 테스트**
  - [ ] 반응형 그리드 작동
  - [ ] 필터 접기/펴기

- [ ] **Mobile (375x667) 테스트**
  - [ ] 스택 레이아웃
  - [ ] 터치 타겟 크기 (44px 이상)
  - [ ] 스크롤 성능

### 4.4 Accessibility (WCAG 2.1 AA)
- [ ] **색상 대비**
  - [ ] 상태/심각도 배지: 4.5:1 이상 명도비
  - [ ] 버튼 텍스트: 4.5:1 이상

- [ ] **키보드 네비게이션**
  - [ ] 모든 버튼/필터 Tab으로 접근 가능
  - [ ] Enter/Space로 활성화 가능

- [ ] **스크린 리더 지원**
  - [ ] 테이블 헤더 scope 속성
  - [ ] 상태/심각도 라벨 aria-label
  - [ ] 폼 필드 label 연결

---

## 5️⃣ PERFORMANCE & LOAD TEST

### 5.1 Response Time
- [ ] **GET /breakdowns (list) — 1000개 레코드**
  - [ ] 응답 시간 < 500ms
  - [ ] 페이지네이션 (limit=50): < 200ms

- [ ] **GET /breakdowns/{id} — single**
  - [ ] 응답 시간 < 100ms

- [ ] **PATCH /breakdowns/{id} — update**
  - [ ] 응답 시간 < 200ms

- [ ] **POST /breakdowns — create**
  - [ ] 응답 시간 < 300ms

- [ ] **GET /breakdowns/analytics/summary — analytics**
  - [ ] 100개 자산, 12개월: < 1s

### 5.2 Concurrent Load Test
- [ ] **10 simultaneous requests**
  - [ ] 모든 요청 성공 (에러 0건)
  - [ ] 응답 시간 증가 < 20%

- [ ] **100 simultaneous requests**
  - [ ] 모든 요청 성공
  - [ ] 응답 시간 증가 < 50%

### 5.3 Database Performance
- [ ] **SELECT 쿼리 실행 시간**
  - [ ] 인덱스 활용 확인 (EXPLAIN ANALYZE)
  - [ ] Full table scan 없음

- [ ] **디스크 사용량**
  - [ ] breakdown_reports 테이블: < 100MB (1M 레코드 기준)
  - [ ] 인덱스: < 50MB

---

## 6️⃣ SECURITY & COMPLIANCE

### 6.1 SQL Injection Prevention
- [ ] **모든 입력 파라미터 검증**
  - [ ] Zod 스키마 검증 적용
  - [ ] SQL 쿼리 파라미터화 (prepared statements)

### 6.2 Authentication & Authorization
- [ ] **JWT 토큰 검증**
  - [ ] 유효하지 않은 토큰 거부
  - [ ] 만료된 토큰 거부

- [ ] **RLS 정책 강제**
  - [ ] 정책 우회 불가능
  - [ ] 모든 쿼리에 적용

### 6.3 Data Privacy
- [ ] **soft delete (deleted_at) 검증**
  - [ ] 삭제 표시된 기록 조회 불가
  - [ ] 구 데이터 물리적 삭제 정책 검토

### 6.4 Audit Trail
- [ ] **created_at, updated_at 자동 설정**
  - [ ] 모든 INSERT에서 created_at 자동 설정
  - [ ] 모든 UPDATE에서 updated_at 자동 갱신

- [ ] **사용자 추적 (reported_by, assigned_to, resolved_by)**
  - [ ] 모든 작업이 사용자와 연결됨

---

## 7️⃣ ERROR HANDLING & EDGE CASES

### 7.1 Invalid Inputs
- [ ] **잘못된 UUID 형식**
  - [ ] HTTP 400 + 유효성 검증 오류

- [ ] **중복 asset_id 참조**
  - [ ] FK constraint 검증

- [ ] **범위 벗어난 값 (limit > 500, offset < 0)**
  - [ ] HTTP 400 + 유효성 검증 오류

### 7.2 Missing Data
- [ ] **필수 필드 누락 (asset_id, description)**
  - [ ] HTTP 400 + 명확한 오류 메시지

- [ ] **존재하지 않는 asset_id**
  - [ ] HTTP 400 또는 409 (FK constraint)

### 7.3 Business Logic
- [ ] **상태 전환 불가능한 경우 (resolved → acknowledged)**
  - [ ] HTTP 400 + "Invalid status transition"

- [ ] **resolved 상태에서 추가 업데이트**
  - [ ] 제한 또는 경고 메시지

### 7.4 Edge Cases
- [ ] **duration_minutes = NULL (미해결 상태)**
  - [ ] NULL 값 정확히 처리

- [ ] **오래된 데이터 (2년 이상)**
  - [ ] 쿼리 성능 유지 확인

- [ ] **대량 배열 (photos, documents > 100개)**
  - [ ] 배열 크기 제한 검토

---

## 8️⃣ 배포 전 최종 체크리스트

### 체크리스트 완료도
- [ ] Database Schema Verification: **8/8** ✅
- [ ] RLS Verification: **4/4** ✅
- [ ] API Endpoint Verification: **5/5** ✅
- [ ] UI Integration: **4/4** ✅
- [ ] Performance & Load Test: **3/3** ✅
- [ ] Security & Compliance: **4/4** ✅
- [ ] Error Handling: **4/4** ✅
- [ ] **전체: 32/32 완료** ✅

### 최종 승인
- [ ] DevOps Engineer 검증 완료
- [ ] QA Specialist 테스트 완료
- [ ] Security Team 검토 완료
- [ ] CEO 배포 승인

**배포 승인 서명:**
```
DevOps Engineer: _________________ Date: _________
QA Specialist:   _________________ Date: _________
Security Lead:   _________________ Date: _________
CEO (나경태):    _________________ Date: _________
```

---

**문서 버전:** v1.0  
**최종 업데이트:** 2026-05-29  
**다음 검토:** 배포 후 1주일
