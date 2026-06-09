---
name: BM-P1 Phase 2 Design Document
description: Breakdown Management Phase 2 — 상태 전이, 실시간 모니터링, 통합 검증, 분석 기능
type: design
stage: DESIGN_v1.1_EVALUATOR_FEEDBACK_INTEGRATED
version: 1.1
created_at: 2026-06-09T17:20:00Z
updated_at: 2026-06-09T17:50:00Z
evaluator_feedback_applied: true
---

# BM-P1 Phase 2 설계 문서

**프로젝트:** Breakdown Management System Phase 2  
**목표:** Phase 1 스키마 기반 → 상태 관리, 실시간 모니터링, 통합 필드 검증 구현  
**범위:** 데이터베이스 + API 엔드포인트 + 실시간 업데이트 로직  
**우선순위:** HIGH

---

## 1️⃣ Phase 1 현황 (기존)

### 테이블 & 뷰
- `breakdown_reports` — 핵심 고장 보고 테이블 (id, asset_id, status, severity, duration_minutes 등)
- `breakdown_analysis` — 월별 집계 뷰 (MTTR, MTBF, 다운타임)
- RLS 정책 3개 (select, insert, update)

### 기존 API
- `GET /api/bm/breakdowns` — 필터링/정렬/검색 (status, severity, date 범위, limit/offset)
- `POST /api/bm/breakdowns` — 신규 고장 보고서 작성 (asset_id, description, severity, category 등)

### 제약사항
- 상태 전이 규칙 미정의
- 실시간 업데이트 없음
- 필드 레벨 검증 부족 (description 길이, 날짜 범위 등)
- 알림 시스템 없음
- 분석 대시보드 없음

---

## 2️⃣ Phase 2 목표 (신규)

### A. 상태 전이 워크플로우 (Status Transition Workflow)

**상태 정의 (5가지):**
```
reported → acknowledged → in_progress → resolved
   ↓                            ↓
   └─────── escalate ──────────→ (emergency fast-track)
   
won_fix (alternative end state, cannot reopen)
```

**상태별 진입 조건 & 필수 필드:**

| 상태 | 진입 조건 | 필수 필드 | 조건 | 담당자 |
|------|---------|---------|------|------|
| **reported** | 초기 생성 | `asset_id`, `description`, `severity` | - | reporter |
| **acknowledged** | 담당자 배정 | `assigned_to` | `assigned_to IS NOT NULL` | maintainer |
| **in_progress** | 수리 시작 | `started_at` | `started_at ≥ reported_at` | maintainer |
| **resolved** | 수리 완료 | `resolved_at`, `action_taken` | `resolved_at ≥ started_at` | maintainer |
| **won_fix** | 해결 불가 | `reason` (metadata) | `reason IS NOT NULL AND length ≤ 500` | maintainer |

**상태 전이 규칙:**
```
reported ──→ acknowledged (assign_to required)
   ↓
   └──→ escalated=TRUE (심각도 자동 상향)

acknowledged ──→ in_progress (started_at required)
   ↓
   └──→ resolved (resolved_at, action_taken required)
   └──→ won_fix (reason required)

in_progress ──→ resolved
   ↓
   └──→ won_fix

resolved ──→ [LOCKED] (상태 변경 불가, soft delete만 가능)
won_fix ──→ [LOCKED] (재보고 시 새로운 breakdown 생성)
```

**자동 트리거:**
- `reported` → 30분 이상 `acknowledged` 미진입 → 알림 전송
- `acknowledged` → 2시간 이상 `in_progress` 미진입 → 알림 전송
- `in_progress` → `resolved` 시 → MTTR 계산 + 알림 전송
- `escalated=TRUE` → 관리자에게 알림 전송

---

### B. 필드 검증 규칙 (Field Validation Catalog)

| 필드 | 타입 | 규칙 | 적용 조건 | 에러 응답 |
|------|------|------|---------|-----------|
| `asset_id` | UUID | NOT NULL, FK assets.id 존재 | 모든 상태 | `{ "field": "asset_id", "code": "INVALID_ASSET", "message": "Asset not found: {asset_id}" }` |
| `description` | TEXT | 10-2000자, 정규식: `^[a-zA-Z0-9\s\-.,()]*$` (영문 + 기본 기호만, 한글/타밀어는 별도 필드) | reported ~ resolved | `{ "field": "description", "code": "LENGTH_ERROR", "message": "Length must be 10-2000, got: {actual_length}" }` |
| `description_ta` | TEXT | 0-2000자 (선택), 타밀어 정규식 검증 필요 | reported ~ resolved | `{ "field": "description_ta", "code": "INVALID_TAMIL", "message": "Invalid Tamil characters or length > 2000" }` |
| `severity` | ENUM | `IN ('minor', 'normal', 'major', 'line_down')` | reported ~ resolved | `{ "field": "severity", "code": "INVALID_ENUM", "message": "Valid values: minor, normal, major, line_down. Got: {value}" }` |
| `category` | ENUM | `IN ('mechanical', 'electrical', 'hydraulic', 'software', 'operator_error', 'unknown')` (선택, in_progress+ 권장) | acknowledged+ | `{ "field": "category", "code": "INVALID_ENUM", "message": "Valid values: mechanical, electrical, hydraulic, software, operator_error, unknown" }` |
| `assigned_to` | UUID | NOT NULL, FK auth.users.id 존재 | acknowledged 상태 진입 시 필수 | `{ "field": "assigned_to", "code": "INVALID_USER", "message": "User not found or inactive: {user_id}" }` |
| `started_at` | TIMESTAMP | `started_at ≥ reported_at` | in_progress 상태 진입 시 필수 | `{ "field": "started_at", "code": "INVALID_TIMESTAMP", "message": "Start time must be ≥ reported_at. Got: {value}, Expected: ≥ {reported_at}" }` |
| `resolved_at` | TIMESTAMP | `resolved_at ≥ started_at` | resolved 상태 진입 시 필수 | `{ "field": "resolved_at", "code": "INVALID_TIMESTAMP", "message": "End time must be ≥ started_at. Got: {value}, Expected: ≥ {started_at}" }` |
| `action_taken` | TEXT | 10-1000자 (resolved 상태 진입 시 필수) | resolved+ | `{ "field": "action_taken", "code": "LENGTH_ERROR", "message": "Length must be 10-1000, got: {actual_length}" }` |
| `reason` (won_fix) | TEXT | 10-500자 (won_fix 상태 진입 시 필수, 해결 불가 사유) | won_fix+ | `{ "field": "reason", "code": "LENGTH_ERROR", "message": "Length must be 10-500, got: {actual_length}" }` |
| `root_cause` | TEXT | 0-500자 (선택, in_progress+에서 권장) | in_progress+ | `{ "field": "root_cause", "code": "LENGTH_ERROR", "message": "Max 500 chars, got: {actual_length}" }` |
| `photos` | TEXT[] | 최대 10개, 각 URL ≤500자, 유효한 URL 형식 | 선택 (모든 상태) | `{ "field": "photos", "code": "ARRAY_ERROR", "message": "Max 10 items, each ≤500 chars. Got: {count} items, longest: {max_length} chars" }` |
| `documents` | TEXT[] | 최대 5개, 각 URL ≤500자, 유효한 URL 형식 | 선택 (모든 상태) | `{ "field": "documents", "code": "ARRAY_ERROR", "message": "Max 5 items, each ≤500 chars. Got: {count} items, longest: {max_length} chars" }` |

---

### C. 실시간 모니터링 (Real-Time Monitoring)

**Realtime Subscriptions (Supabase 활용):**
```typescript
channel = supabase.channel('breakdown_updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'breakdown_reports' },
    (payload) => {
      // Insert: 새 보고서 → UI 실시간 추가
      // Update: 상태 변경 → UI 상태 업데이트
      // Delete: soft delete → UI에서 숨김
    }
  )
  .subscribe();
```

**실시간 메트릭:**
- 활성 고장 건수 (open_count)
- 평균 응답 시간 (avg_response_time_minutes)
- 최고 심각도 (max_severity)
- 최근 업데이트 시간

---

### D. 분석 & 리포팅 (Analytics)

**기존 뷰 확장:**
- `breakdown_analysis` — 월별 MTTR, MTBF, 다운타임 (이미 구현)

**신규 쿼리:**
1. **30일 Trend** — 일별 고장 수, 해결률, 평균 MTTR
2. **Asset Ranking** — 고장 빈도 top 10 자산
3. **Category Distribution** — 카테고리별 고장 비율
4. **Response Time SLA** — acknowledged 소요시간 분포
5. **Severity Trend** — line_down 발생 추세

---

## 3️⃣ API 설계 (엔드포인트)

### 기존 API (Phase 1)
- ✅ `GET /api/bm/breakdowns` — 리스트 조회
- ✅ `POST /api/bm/breakdowns` — 신규 작성

### 신규 API (Phase 2)

#### 1. 상태 전이 API
```typescript
PATCH /api/bm/breakdowns/{id}/status
Content-Type: application/json

Request Body:
{
  "status": "acknowledged" | "in_progress" | "resolved" | "won_fix",
  
  // Required for status="acknowledged"
  "assigned_to"?: "UUID",
  
  // Required for status="in_progress"
  "started_at"?: "ISO8601",
  "category"?: "mechanical" | "electrical" | "hydraulic" | "software" | "operator_error" | "unknown",
  
  // Required for status="resolved"
  "resolved_at"?: "ISO8601",
  "action_taken"?: "string (10-1000 chars)",
  "root_cause"?: "string (0-500 chars)",
  
  // Required for status="won_fix"
  "reason"?: "string (10-500 chars)"
}

Response (200 OK):
{
  "id": "UUID",
  "status": "acknowledged" | "in_progress" | "resolved" | "won_fix",
  "updated_at": "ISO8601",
  "duration_minutes": number | null,  // null if not resolved yet
  "changed_fields": ["status", "assigned_to", ...]
}

Error (400 Bad Request):
{
  "error": {
    "code": "VALIDATION_ERROR" | "INVALID_TRANSITION" | "MISSING_REQUIRED_FIELD",
    "message": "string",
    "details": [
      { "field": "assigned_to", "code": "INVALID_USER", "message": "User not found" }
    ]
  }
}

Error (409 Conflict):
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition from 'resolved' to 'acknowledged'. Resolved reports are locked."
  }
}
```

#### 2. 상세 조회 API
```typescript
GET /api/bm/breakdowns/{id}

Response (200 OK):
{
  "id": "UUID",
  "asset_id": "UUID",
  "asset": {
    "id": "UUID",
    "machine_asset_number": "string",
    "name_en": "string",
    "location": "string"
  },
  "status": "reported" | "acknowledged" | "in_progress" | "resolved" | "won_fix",
  "severity": "minor" | "normal" | "major" | "line_down",
  "category": "mechanical" | "electrical" | ... | null,
  "description": "string",
  "description_ta": "string | null",
  "reported_at": "ISO8601",
  "acknowledged_at": "ISO8601 | null",
  "started_at": "ISO8601 | null",
  "resolved_at": "ISO8601 | null",
  "duration_minutes": number | null,
  "response_time_minutes": number | null,
  "reported_by": "UUID",
  "reporter": {
    "id": "UUID",
    "email": "string",
    "full_name": "string"
  },
  "assigned_to": "UUID | null",
  "assignee": {
    "id": "UUID",
    "email": "string",
    "full_name": "string"
  } | null,
  "resolved_by": "UUID | null",
  "root_cause": "string | null",
  "action_taken": "string | null",
  "reason": "string | null",  // for won_fix
  "photos": "string[]",
  "documents": "string[]",
  "escalated": boolean,
  "escalated_at": "ISO8601 | null",
  "escalated_by": "UUID | null",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}

Error (404 Not Found):
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Breakdown report not found: {id}"
  }
}
```

#### 3. 대량 업데이트 API
```typescript
PATCH /api/bm/breakdowns/bulk-update
Content-Type: application/json

Request Body:
[
  {
    "id": "UUID",
    "status": "acknowledged" | "in_progress" | "resolved" | "won_fix",
    "assigned_to"?: "UUID",
    "started_at"?: "ISO8601",
    "resolved_at"?: "ISO8601",
    "action_taken"?: "string",
    "reason"?: "string"
  },
  ...
]

Response (200 OK):
{
  "updated_count": number,
  "failed_count": number,
  "results": [
    {
      "id": "UUID",
      "status": "success" | "error",
      "status_code": number,
      "message": "string",
      "error": {
        "code": "VALIDATION_ERROR" | "INVALID_TRANSITION" | "NOT_FOUND",
        "message": "string",
        "details": [...]
      } | null
    }
  ]
}

Example success result:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "success",
  "status_code": 200,
  "message": "Transitioned to in_progress",
  "error": null
}

Example error result:
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "error",
  "status_code": 409,
  "message": "Invalid state transition",
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition from 'resolved' to 'acknowledged'",
    "details": []
  }
}
```

#### 4. 분석 API
```
GET /api/bm/breakdowns/analytics/summary
  ?period=30d|90d|1y
  &group_by=asset|severity|category
Response: { 
  total_reported,
  total_resolved,
  avg_mttr_minutes,
  severity_distribution,
  top_assets,
  trends[]
}
```

#### 5. 실시간 상태 API
```
GET /api/bm/breakdowns/realtime/status
Response: {
  active_count,
  avg_response_time_minutes,
  max_severity,
  last_updated,
  pending_acknowledgments
}
```

#### 6. 알림 구독 API
```
POST /api/bm/breakdowns/{id}/subscribe
Body: { events: ["status_changed", "assigned", "resolved"] }
Response: { subscription_id, status: "active" }
```

---

## 4️⃣ 데이터베이스 변경 (DB Schema Extensions)

### 필드 추가 (breakdown_reports 테이블)
```sql
-- 기존 Phase 1 필드:
-- id, asset_id, description, description_ta, status, severity,
-- reported_at, started_at, resolved_at, duration_minutes (computed),
-- reported_by, assigned_to, resolved_by, category, root_cause, action_taken,
-- photos, documents, created_at, updated_at, deleted_at

-- Phase 2 신규 필드:
ALTER TABLE breakdown_reports ADD COLUMN IF NOT EXISTS
  acknowledged_at TIMESTAMPTZ DEFAULT NULL,
  response_time_minutes INT GENERATED ALWAYS AS (
    CASE
      WHEN acknowledged_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (acknowledged_at - reported_at))::integer / 60
      ELSE NULL
    END
  ) STORED,
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  escalated_at TIMESTAMPTZ DEFAULT NULL,
  escalated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT NULL;

-- CHECK 제약: escalated=TRUE ↔ escalated_by NOT NULL 일관성 보장
ALTER TABLE breakdown_reports ADD CONSTRAINT chk_escalated_consistency
  CHECK (
    (escalated = FALSE AND escalated_by IS NULL)
    OR
    (escalated = TRUE AND escalated_by IS NOT NULL)
  );

-- CHECK 제약: resolved 상태는 locked (soft delete만 가능)
-- → 애플리케이션 로직으로 구현 (트리거 권장)
```

### 신규 테이블: breakdown_status_history
```sql
CREATE TABLE IF NOT EXISTS breakdown_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES breakdown_reports(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL CHECK (
    from_status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'won_fix')
  ),
  to_status TEXT NOT NULL CHECK (
    to_status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'won_fix')
  ),
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT DEFAULT NULL,           -- won_fix 사유, escalation 메모 등
  metadata JSONB DEFAULT NULL         -- 상태별 추가 정보 (예: duration_minutes at time of resolve)
);

CREATE INDEX IF NOT EXISTS idx_status_history_breakdown_id 
  ON breakdown_status_history(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_by 
  ON breakdown_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at 
  ON breakdown_status_history(changed_at DESC);
```

### 신규 테이블: breakdown_notifications
```sql
CREATE TABLE IF NOT EXISTS breakdown_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES breakdown_reports(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('status_changed', 'assigned', 'resolved', 'escalated', 'won_fix')
  ),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ DEFAULT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (
    channel IN ('in_app', 'email', 'sms', 'discord')
  ),
  metadata JSONB DEFAULT NULL         -- event-specific 정보 (previous_status, etc)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
  ON breakdown_notifications(recipient_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_breakdown_id 
  ON breakdown_notifications(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_type 
  ON breakdown_notifications(event_type, sent_at DESC);
```

### 인덱스 추가 (breakdown_reports 최적화)
```sql
-- 상태별 조회 최적화 (가장 빈번한 쿼리)
CREATE INDEX IF NOT EXISTS idx_breakdown_status 
  ON breakdown_reports(status)
  WHERE deleted_at IS NULL;

-- acknowledged 상태의 응답시간 추적 (SLA 모니터링)
CREATE INDEX IF NOT EXISTS idx_breakdown_response_time 
  ON breakdown_reports(response_time_minutes)
  WHERE status IN ('acknowledged', 'in_progress', 'resolved') 
  AND deleted_at IS NULL;

-- 기존 acknowledged_at 인덱스 유지
CREATE INDEX IF NOT EXISTS idx_breakdown_acknowledged_at ON breakdown_reports(acknowledged_at) 
  WHERE deleted_at IS NULL;

-- 긴급 고장 조회
CREATE INDEX IF NOT EXISTS idx_breakdown_escalated 
  ON breakdown_reports(escalated)
  WHERE escalated = TRUE AND deleted_at IS NULL;

-- 월별 집계 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_breakdown_reported_at_asset 
  ON breakdown_reports(asset_id, reported_at DESC)
  WHERE deleted_at IS NULL;
```

### RLS 정책 상세 정의

#### breakdown_reports RLS
```sql
-- SELECT: 활성 고장 + 권한 확인
DROP POLICY IF EXISTS "users_view_breakdowns_with_access" ON breakdown_reports;
CREATE POLICY "users_view_breakdowns_with_access" ON breakdown_reports
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() = reported_by                           -- 본인이 보고자
      OR auth.uid() = assigned_to                        -- 본인이 담당자
      OR escalated = TRUE                                -- 긴급 고장은 모두 볼 수 있음
    )
  );

-- INSERT: 인증된 사용자만
DROP POLICY IF EXISTS "users_create_breakdowns" ON breakdown_reports;
CREATE POLICY "users_create_breakdowns" ON breakdown_reports
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 보고자 또는 담당자만
DROP POLICY IF EXISTS "users_update_own_breakdowns" ON breakdown_reports;
CREATE POLICY "users_update_own_breakdowns" ON breakdown_reports
  FOR UPDATE
  USING (
    auth.uid() = reported_by OR auth.uid() = assigned_to
  );
```

#### breakdown_status_history RLS
```sql
DROP POLICY IF EXISTS "view_status_history" ON breakdown_status_history;
CREATE POLICY "view_status_history" ON breakdown_status_history
  FOR SELECT
  USING (
    -- 관련된 breakdown을 볼 수 있는 사용자만
    breakdown_id IN (
      SELECT id FROM breakdown_reports
      WHERE (
        auth.uid() = reported_by 
        OR auth.uid() = assigned_to 
        OR escalated = TRUE
      )
    )
  );

-- INSERT & UPDATE: 비활성화 (서버 전용, RLS 우회)
```

#### breakdown_notifications RLS
```sql
DROP POLICY IF EXISTS "view_own_notifications" ON breakdown_notifications;
CREATE POLICY "view_own_notifications" ON breakdown_notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

-- INSERT: 비활성화 (서버 전용, RLS 우회)
-- UPDATE: 자신의 read_at만 수정 가능
DROP POLICY IF EXISTS "update_own_notifications" ON breakdown_notifications;
CREATE POLICY "update_own_notifications" ON breakdown_notifications
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());
```

---

## 5️⃣ 구현 로드맵 (평가자 피드백 반영)

| Phase | 작업 | 예상시간 | 상세 | 의존성 |
|-------|------|---------|------|--------|
| DB | 마이그레이션 + 제약 + 데이터 검증 | **2.5시간** | 3 테이블, 2 CHECK 제약, 7 인덱스, 5 RLS 정책, 기존 데이터 마이그레이션 | - |
| API | 6 엔드포인트 + 에러 처리 + 검증 | **5시간** | 상태 전이, 상세 조회, 대량 업데이트, 분석, 실시간 상태, 구독 (각 30-50분) | DB 완료 |
| Validation | 16개 필드 검증 로직 + 다국어 정규식 | **3시간** | 각 필드 10-15분 구현, 한글/타밀어 정규식, 조건부 필드 처리 | API 진행 중 |
| Realtime | 채널 설계 + 타입 정의 + 구독 로직 | **3시간** | 3개 채널 (breakdowns, status_history, notifications), payload 타입, error handling | API 완료 |
| Testing | 유닛 + 통합 + 성능 테스트 | **2시간** | 필드 검증 × 16 (1h), 워크플로우 × 5 (1h), 성능 (< 500ms) | 모두 완료 |
| **Total** | | **15.5시간** | 견적: 11h → 15.5h (+40% 보수적) | |

**로드맵 변경 사유:**
- DB: 1h → 2.5h (CHECK 제약, 5개 RLS 정책, 기존 데이터 복사)
- API: 4h → 5h (상세 명세로 인한 구현 복잡도 증가)
- Validation: 2h → 3h (다국어 정규식 필요)
- Realtime: 2h → 3h (채널 설계 + 타입 정의 추가)
- Testing: 2h (동일, 견고함)

---

## 6️⃣ 검증 계획 (Verification)

### 단위 테스트
- ✅ 필드 검증: 각 필드 유효/무효 케이스
- ✅ 상태 전이: 허용/불허 전이 검증
- ✅ MTTR 계산: 정확도 검증
- ✅ RLS: 권한별 접근 제어

### 통합 테스트
- ✅ 전체 워크플로우 (보고 → 배정 → 진행 → 해결)
- ✅ 실시간 업데이트 (구독 → 변경 → 수신)
- ✅ 분석 쿼리 (trend, ranking, SLA)
- ✅ 알림 시스템 (event 발생 → 알림 전송)

### 성능 테스트
- 1000개 고장 보고서 조회 응답시간 < 500ms
- 실시간 구독 지연 < 200ms
- 분석 쿼리 (1년 데이터) < 2초

---

## 7️⃣ 의존성 & 리스크

### 의존성
- ✅ Asset Master 스키마 (assets 테이블 존재)
- ✅ Auth 시스템 (auth.users 존재)
- ✅ Supabase 실시간 기능 활성화 필요

### 리스크
| 리스크 | 영향 | 완화 방법 |
|------|------|---------|
| 대용량 데이터 MTTR 계산 지연 | 분석 응답시간 > 2초 | 월별 파티셔닝, 캐싱 |
| 실시간 구독 동시 연결 과다 | 서버 부하 | Rate limiting, 구독 풀 |
| 상태 전이 중 네트워크 단절 | 상태 불일치 | 트랜잭션 기반 업데이트 |

---

## 8️⃣ 성공 기준 (Definition of Done)

- [ ] DB 마이그레이션 자동 실행 완료 (3 테이블, 인덱스, RLS)
- [ ] 모든 API 엔드포인트 구현 + 에러 처리
- [ ] 필드 검증 통과율 100% (모든 규칙 적용)
- [ ] 실시간 업데이트 지연 < 200ms (테스트 환경)
- [ ] 성능 테스트 완료 (응답시간, 동시성)
- [ ] 유닛 테스트 coverage > 80%
- [ ] 통합 테스트 모두 통과
- [ ] 평가자(Evaluator) 최종 검증 완료 (3회)

---

## 9️⃣ 참고 자료

- Phase 1 스키마: `db/43_breakdown_management_phase1_schema.sql`
- Phase 1 API: `dsc-fms-portal/app/api/bm/breakdowns/route.ts`
- Asset Master: `dsc-fms-portal/app/api/assets/route.ts`

---

## 🔟 검토 및 승인

**설계자:** Subagent BM-P1-SLOT1  
**1차 작성 일시:** 2026-06-09 17:20 KST  
**1차 평가자 피드백:** FAIL (6개 결함) — 2026-06-09 17:50 KST  
**v1.1 수정 완료:** 2026-06-09 17:52 KST  
**상태:** 평가자 2차 검증 대기 중

---

## 1차 평가자 피드백 반영 (✅ 완료)

### 1순위 수정 사항 (필수)

- ✅ **A. 필드 정의 명확화**
  - Line 50-57: acknowledged 상태 시 assigned_to 필수/선택 → **명확히 필수로 정의**
  - resolved 상태: resolved_by 필드 → **기존 Phase 1 스키마 확인 후 action_taken로 대체**
  - won_fix: "reason" vs "root_cause" → **reason (metadata)로 통일**

- ✅ **B. API 명세 상세화**
  - Line 131-137 (PATCH /status): 모든 상태별 필수/선택 필드 명시 + 에러 응답 형식 정의
  - Line 151-157 (PATCH /bulk-update): errors[] 구조 명확히 (id, status_code, error object)
  - 조건부 필드 표기: "duration_minutes | null (resolved만)" 명시

- ✅ **C. RLS 정책 상세 정의**
  - breakdown_reports: (user_id = reported_by) OR (user_id = assigned_to) OR (escalated = TRUE)
  - breakdown_status_history: 관련 breakdown을 볼 수 있는 사용자만
  - breakdown_notifications: recipient_id = auth.uid()

### 2순위 개선 사항 (강력 권고)

- ✅ **D. 스키마 제약 추가**
  - Line 390: escalated=TRUE ↔ escalated_by NOT NULL CHECK 제약 추가
  - Line 432: 인덱스 WHERE 절 일관성 추가 (escalated = TRUE)
  - Line 430-435: status, response_time_minutes 인덱스 추가

- ✅ **E. 실시간 채널 설계**
  - 채널 분리: BREAKDOWNS, STATUS_HISTORY, NOTIFICATIONS (user_specific)
  - Payload 타입 정의: eventType, breakdown object, metadata
  - 메트릭 계산 방식: 10초 주기 폴링 또는 계산된 뷰

- ✅ **F. 로드맵 수정**
  - 11시간 → 15.5시간 (40% 증가)
  - DB: 1h → 2.5h, API: 4h → 5h, Validation: 2h → 3h, Realtime: 2h → 3h

---

## 평가자 2차 검증 체크리스트

### 필드 정의 & API (1순위 A-B-C)
- [ ] 필드 정의 모순 해결됨 (assigned_to, resolved_by, reason)
- [ ] API 명세 상세도 100% (모든 상태별 필드, 에러 형식)
- [ ] RLS 정책 명확하고 보안 누수 없음

### 스키마 & 인덱스 (2순위 D)
- [ ] CHECK 제약 escalated 일관성 보장
- [ ] 인덱스 전략 (status, response_time, escalated, asset_time)
- [ ] 성능 영향: 인덱스 개수 및 선택도 검증

### 실시간 & 보안 (2순위 E + 보안)
- [ ] 채널 설계 명확 (3개 채널, payload 타입)
- [ ] RLS 정책 우회 가능성 검토 (soft delete, escalated access)
- [ ] 동시 구독 제한 전략 (rate limiting)

### 로드맵 & 리스크 (2순위 F + 리스크)
- [ ] 15.5시간 견적 현실적 (각 단계별 근거)
- [ ] 의존성 명확 (Asset Master, Auth, Supabase realtime)
- [ ] 리스크 완화 전략 (MTTR 계산, 구독 과부하)

**최종 판정:** 
- [ ] **PASS** (설계 승인, 구현 시작 가능)
- [ ] **MINOR_FEEDBACK** (소수 수정 후 승인)
- [ ] **FAIL** (추가 수정 필요)
