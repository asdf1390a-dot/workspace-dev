---
name: DSC-INDIA-MANNUR-BM Phase 1 설계 (DB + API)
description: Breakdown Management 5일 로드맵, 5개 테이블, 15개 API, RLS 정책, Swagger 명세
type: project
relatedFiles: dsc-fms-portal/BM_PHASE1_DESIGN.md
---

# DSC-INDIA-MANNUR-BM Phase 1 — Database & API 설계

**프로젝트:** Breakdown Management (BM) Phase 1  
**상태:** 설계 완료 (구현 대기)  
**작성일:** 2026-05-28  
**ETA:** 2026-06-02 20:00 KST  
**대상:** Backend Engineer AI Agent (구현)

---

## 📋 Executive Summary

**목표:** DSC Mannur 식별(breakdown/고장) 사건 관리 시스템 Phase 1 설계  
**범위:** 5개 데이터베이스 테이블 + 15개 REST API 엔드포인트 + RLS 정책 + 통합 테스트  
**성공 기준:**
- ✅ Database: 5개 테이블 생성 (breakdowns, root_causes, corrective_actions, breakdown_responses, breakdown_history)
- ✅ API: 15개 엔드포인트 완전 명세 (method, path, request/response schema)
- ✅ Tests: 각 엔드포인트당 최소 2개 유닛 테스트 (총 30+)
- ✅ Docs: Swagger 스펙 + API 사용 예제
- ✅ Ready for UI: DSC-INDIA-MANNUR-BM-UI (2026-06-02 이후)

---

## 📅 5-Milestone Roadmap

| Milestone | 기간 | 목표 | 담당 |
|-----------|------|------|------|
| **Day 1 (5/30)** | 18:00-24:00 | DB 스키마 + RLS 정책 설계 구현 | Backend Engineer |
| **Day 2 (5/31)** | 18:00-24:00 | Core CRUD API 구현 (6 endpoints) | Backend Engineer |
| **Day 3 (6/01)** | 18:00-24:00 | Root Cause + Action API (8 endpoints) | Backend Engineer |
| **Day 4 (6/01)** | 18:00-24:00 | Workflow + Status API (1 endpoint) | Backend Engineer |
| **Day 5 (6/02)** | 18:00-20:00 | Integration Tests + Swagger Docs | Backend Engineer |

---

## 1️⃣ Database Schema

### 개요
```
breakdowns (고장 사건)
  ├─ root_causes (근본 원인)
  ├─ corrective_actions (개선 조치)
  ├─ breakdown_responses (대응 기록)
  └─ breakdown_history (감사 추적)
```

### 1.1 `breakdowns` 테이블

**목적:** 고장 사건 메인 레코드 (Incident reporting)

```sql
CREATE TABLE breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  incident_number TEXT NOT NULL UNIQUE,  -- BM-20260530-001
  asset_id UUID NOT NULL REFERENCES assets(id),
  title TEXT NOT NULL,
  description TEXT,
  
  -- 시간 정보
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurred_at TIMESTAMPTZ NOT NULL,  -- 고장 발생 시간
  resolved_at TIMESTAMPTZ,  -- 복구된 시간 (NULL = 미해결)
  
  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'open',  -- open, investigating, in_progress, closed, deferred
  severity TEXT NOT NULL DEFAULT 'medium',  -- low, medium, high, critical
  
  -- 담당자
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),  -- NULL = 미배정
  
  -- 카테고리
  breakdown_category TEXT,  -- electrical, mechanical, hydraulic, software, etc.
  failure_mode TEXT,  -- 고장 유형
  
  -- 메타데이터
  downtime_minutes INT DEFAULT 0,  -- 가동 중단 시간
  estimated_cost DECIMAL(10,2),  -- 예상 비용 (INR)
  priority INT DEFAULT 3,  -- 1-5 우선순위
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  CONSTRAINT status_check CHECK (status IN ('open', 'investigating', 'in_progress', 'closed', 'deferred')),
  CONSTRAINT severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_breakdowns_asset_id ON breakdowns(asset_id);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_reported_at ON breakdowns(reported_at DESC);
CREATE INDEX idx_breakdowns_assigned_to ON breakdowns(assigned_to);
```

**RLS 정책:**
```sql
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;

-- 모든 사용자: 본인 조직의 breakdown만 조회
CREATE POLICY "Users can view organization breakdowns"
  ON breakdowns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = breakdowns.asset_id
        AND a.facility_id = (
          SELECT facility_id FROM auth.users 
          WHERE id = auth.uid()
        )
    )
  );

-- 작성자: 수정 가능
CREATE POLICY "Creators can update own breakdowns"
  ON breakdowns FOR UPDATE
  USING (created_by = auth.uid() OR assigned_to = auth.uid())
  WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid());

-- 관리자만: 삭제
CREATE POLICY "Admins only can delete"
  ON breakdowns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### 1.2 `root_causes` 테이블

**목적:** 고장의 근본 원인 분석

```sql
CREATE TABLE root_causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES breakdowns(id) ON DELETE CASCADE,
  
  -- 근본 원인
  root_cause_type TEXT NOT NULL,  -- design_flaw, manufacturing_defect, wear_tear, operator_error, maintenance_gap, environmental, other
  description TEXT NOT NULL,
  contributing_factors TEXT[],  -- ['lack of maintenance', 'high load', 'age']
  
  -- 분석 정보
  analysis_method TEXT,  -- 5-why, fishbone, fault_tree, other
  analyzed_by UUID NOT NULL REFERENCES auth.users(id),
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 우선순위 & 영향도
  frequency_score INT,  -- 1-5: 얼마나 자주 발생
  impact_score INT,  -- 1-5: 영향도
  
  confidence_level INT,  -- 1-100: 근본 원인 확신도 (%)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT root_cause_type_check CHECK (
    root_cause_type IN ('design_flaw', 'manufacturing_defect', 'wear_tear', 'operator_error', 'maintenance_gap', 'environmental', 'other')
  )
);

CREATE INDEX idx_root_causes_breakdown_id ON root_causes(breakdown_id);
CREATE UNIQUE INDEX idx_root_causes_primary ON root_causes(breakdown_id) WHERE root_cause_type IS NOT NULL;
```

**RLS 정책:**
```sql
ALTER TABLE root_causes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view root_causes of organization breakdowns"
  ON root_causes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM breakdowns b
      WHERE b.id = root_causes.breakdown_id
        AND EXISTS (
          SELECT 1 FROM assets a
          WHERE a.id = b.asset_id
            AND a.facility_id = (
              SELECT facility_id FROM auth.users
              WHERE id = auth.uid()
            )
        )
    )
  );

CREATE POLICY "Analysts can update root_causes"
  ON root_causes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND role IN ('analyst', 'admin')
    )
  );
```

---

### 1.3 `corrective_actions` 테이블

**목적:** 개선 조치 및 추적

```sql
CREATE TABLE corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES breakdowns(id) ON DELETE CASCADE,
  
  -- 조치 정보
  action_description TEXT NOT NULL,  -- 수행할 조치 상세
  action_category TEXT NOT NULL,  -- replacement, repair, design_change, training, preventive, other
  
  -- 우선순위 & 소유
  priority INT DEFAULT 3,  -- 1-5
  assigned_to UUID REFERENCES auth.users(id),
  
  -- 일정
  planned_start_date TIMESTAMPTZ,
  planned_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'open',  -- open, in_progress, completed, deferred, cancelled
  completion_percentage INT DEFAULT 0,  -- 0-100
  
  -- 비용 추적
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  
  -- 증거/문서
  documents TEXT[],  -- 첨부 파일 URL 배열
  completion_notes TEXT,  -- 완료 시 작성
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT action_category_check CHECK (
    action_category IN ('replacement', 'repair', 'design_change', 'training', 'preventive', 'other')
  ),
  CONSTRAINT status_check CHECK (
    status IN ('open', 'in_progress', 'completed', 'deferred', 'cancelled')
  )
);

CREATE INDEX idx_corrective_actions_breakdown_id ON corrective_actions(breakdown_id);
CREATE INDEX idx_corrective_actions_assigned_to ON corrective_actions(assigned_to);
CREATE INDEX idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX idx_corrective_actions_planned_end ON corrective_actions(planned_end_date);
```

**RLS 정책:**
```sql
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view actions of organization breakdowns"
  ON corrective_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM breakdowns b
      WHERE b.id = corrective_actions.breakdown_id
        AND EXISTS (
          SELECT 1 FROM assets a
          WHERE a.id = b.asset_id
            AND a.facility_id = (
              SELECT facility_id FROM auth.users
              WHERE id = auth.uid()
            )
        )
    )
  );

CREATE POLICY "Assigned users can update"
  ON corrective_actions FOR UPDATE
  USING (assigned_to = auth.uid() OR created_by = auth.uid());
```

---

### 1.4 `breakdown_responses` 테이블

**목적:** 고장에 대한 대응 워크플로우 기록

```sql
CREATE TABLE breakdown_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES breakdowns(id) ON DELETE CASCADE,
  
  -- 대응 정보
  response_type TEXT NOT NULL,  -- initial_assessment, temporary_fix, permanent_fix, escalation, other
  response_description TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- 타이밍
  response_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_duration_minutes INT,  -- 대응에 소요된 시간
  
  -- 결과
  effectiveness_level TEXT,  -- ineffective, partial, effective, fully_resolved
  parts_used TEXT[],  -- 사용된 부품 목록
  tools_used TEXT[],  -- 사용된 장비 목록
  
  -- 문서
  photos TEXT[],  -- 작업 사진 URL
  notes TEXT,  -- 추가 메모
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT response_type_check CHECK (
    response_type IN ('initial_assessment', 'temporary_fix', 'permanent_fix', 'escalation', 'other')
  )
);

CREATE INDEX idx_breakdown_responses_breakdown_id ON breakdown_responses(breakdown_id);
CREATE INDEX idx_breakdown_responses_response_at ON breakdown_responses(response_at DESC);
CREATE INDEX idx_breakdown_responses_performed_by ON breakdown_responses(performed_by);
```

**RLS 정책:**
```sql
ALTER TABLE breakdown_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses of organization breakdowns"
  ON breakdown_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM breakdowns b
      WHERE b.id = breakdown_responses.breakdown_id
        AND EXISTS (
          SELECT 1 FROM assets a
          WHERE a.id = b.asset_id
            AND a.facility_id = (
              SELECT facility_id FROM auth.users
              WHERE id = auth.uid()
            )
        )
    )
  );
```

---

### 1.5 `breakdown_history` 테이블

**목적:** 완전 감사 추적 (Audit Trail)

```sql
CREATE TABLE breakdown_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id UUID NOT NULL REFERENCES breakdowns(id) ON DELETE CASCADE,
  
  -- 변경 내용
  field_name TEXT NOT NULL,  -- status, assigned_to, severity, etc.
  old_value TEXT,
  new_value TEXT,
  change_type TEXT NOT NULL,  -- created, updated, status_changed, assigned
  
  -- 변경자
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 추가 정보
  reason TEXT,  -- 변경 사유
  
  CONSTRAINT change_type_check CHECK (
    change_type IN ('created', 'updated', 'status_changed', 'assigned', 'closed', 'reopened', 'other')
  )
);

CREATE INDEX idx_breakdown_history_breakdown_id ON breakdown_history(breakdown_id);
CREATE INDEX idx_breakdown_history_changed_at ON breakdown_history(changed_at DESC);
```

**RLS 정책:**
```sql
ALTER TABLE breakdown_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of organization breakdowns"
  ON breakdown_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM breakdowns b
      WHERE b.id = breakdown_history.breakdown_id
        AND EXISTS (
          SELECT 1 FROM assets a
          WHERE a.id = b.asset_id
            AND a.facility_id = (
              SELECT facility_id FROM auth.users
              WHERE id = auth.uid()
            )
        )
    )
  );
```

---

## 2️⃣ REST API Specification

### API 기본 설정

**기본 URL:** `https://dsc-fms-portal.vercel.app/api`  
**인증:** Supabase JWT Token (`Authorization: Bearer {token}`)  
**응답 형식:** JSON  
**타임존:** UTC (모든 시간은 UTC 저장)

### 응답 형식 표준

**성공 (200, 201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "작업 완료"
}
```

**에러 (4xx, 5xx):**
```json
{
  "success": false,
  "error": {
    "code": "BREAKDOWN_NOT_FOUND",
    "message": "고장 사건을 찾을 수 없습니다.",
    "details": { ... }
  }
}
```

---

### 2.1 Breakdown 관리 (6 endpoints)

#### **2.1.1 GET /api/breakdowns** — 고장 목록 조회

**쿼리 파라미터:**
```
status=open              필터: 상태 (open, investigating, in_progress, closed, deferred)
severity=high            필터: 심각도 (low, medium, high, critical)
asset_id=uuid            필터: 자산 ID
assigned_to=uuid         필터: 담당자
reported_after=2026-05-01T00:00:00Z  필터: 보고 시간 범위
reported_before=2026-05-31T23:59:59Z
order=reported_at.desc   정렬 (default: reported_at.desc)
limit=50                 페이지당 행 수 (default: 50)
offset=0                 스킵할 행 수 (default: 0)
```

**예시:**
```
GET /api/breakdowns?status=eq.open&severity=eq.critical&limit=20
GET /api/breakdowns?asset_id=eq.{uuid}&order=reported_at.desc
```

**응답 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "incident_number": "BM-20260530-001",
      "asset_id": "uuid",
      "title": "Compressor Oil Leak",
      "status": "open",
      "severity": "high",
      "reported_at": "2026-05-30T10:15:00Z",
      "assigned_to": "uuid",
      "downtime_minutes": 45,
      "priority": 1
    }
  ],
  "count": 15,
  "total": 156
}
```

---

#### **2.1.2 GET /api/breakdowns/{id}** — 고장 상세 조회

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "incident_number": "BM-20260530-001",
    "asset_id": "uuid",
    "asset": {
      "id": "uuid",
      "name_en": "Main Compressor",
      "location": "Compressor Room"
    },
    "title": "Compressor Oil Leak",
    "description": "Sudden oil leakage from main seal...",
    "status": "investigating",
    "severity": "high",
    "breakdown_category": "mechanical",
    "failure_mode": "seal_failure",
    "reported_at": "2026-05-30T10:15:00Z",
    "occurred_at": "2026-05-30T09:30:00Z",
    "resolved_at": null,
    "reported_by": "uuid",
    "assigned_to": "uuid",
    "downtime_minutes": 45,
    "estimated_cost": 15000.00,
    "priority": 1,
    "created_by": "uuid",
    "created_at": "2026-05-30T10:16:00Z",
    "updated_at": "2026-05-30T14:20:00Z",
    
    -- Relationships
    "root_causes": [...],
    "corrective_actions": [...],
    "responses": [...],
    "history": [...]
  },
  "message": "조회 완료"
}
```

---

#### **2.1.3 POST /api/breakdowns** — 새 고장 사건 생성

**요청:**
```json
{
  "asset_id": "uuid",  -- required
  "title": "Compressor Oil Leak",  -- required
  "description": "Sudden oil leakage...",
  "occurred_at": "2026-05-30T09:30:00Z",  -- required
  "breakdown_category": "mechanical",
  "failure_mode": "seal_failure",
  "severity": "high",  -- low, medium, high, critical (default: medium)
  "priority": 1,  -- 1-5 (default: 3)
  "downtime_minutes": 45,
  "estimated_cost": 15000.00
}
```

**응답 (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "incident_number": "BM-20260530-001",
    "asset_id": "uuid",
    "title": "Compressor Oil Leak",
    "status": "open",
    ...
  },
  "message": "고장 사건이 생성되었습니다."
}
```

**에러 (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "required field missing: asset_id",
    "details": { "field": "asset_id" }
  }
}
```

---

#### **2.1.4 PUT /api/breakdowns/{id}** — 고장 정보 수정

**요청:**
```json
{
  "title": "Updated Title",
  "status": "in_progress",
  "severity": "critical",
  "assigned_to": "uuid",
  "downtime_minutes": 60,
  "estimated_cost": 20000.00,
  "priority": 1
}
```

**응답 (200):** 수정된 breakdown 객체 반환

---

#### **2.1.5 PUT /api/breakdowns/{id}/status** — 고장 상태 변경

**요청:**
```json
{
  "status": "closed",  -- open, investigating, in_progress, closed, deferred
  "resolved_at": "2026-05-31T14:30:00Z",  -- closed일 때 필수
  "reason": "Permanent fix completed"  -- Optional
}
```

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "closed",
    "resolved_at": "2026-05-31T14:30:00Z",
    "updated_at": "2026-05-31T14:30:01Z"
  }
}
```

---

#### **2.1.6 PUT /api/breakdowns/{id}/assign** — 담당자 배정

**요청:**
```json
{
  "assigned_to": "uuid",  -- 담당자 user ID
  "reason": "Expert technician assigned"  -- Optional
}
```

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assigned_to": "uuid",
    "status": "investigating",
    "updated_at": "2026-05-31T14:30:01Z"
  }
}
```

---

### 2.2 Root Cause 분석 (4 endpoints)

#### **2.2.1 POST /api/breakdowns/{id}/root-causes** — 근본 원인 작성

**요청:**
```json
{
  "root_cause_type": "design_flaw",  -- required
  "description": "The seal was undersized...",  -- required
  "contributing_factors": ["high_pressure", "temperature_fluctuation"],
  "analysis_method": "fishbone",
  "frequency_score": 4,
  "impact_score": 5,
  "confidence_level": 90
}
```

**응답 (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "breakdown_id": "uuid",
    "root_cause_type": "design_flaw",
    "description": "The seal was undersized...",
    "analyzed_by": "uuid",
    "analyzed_at": "2026-05-31T15:00:00Z",
    "confidence_level": 90
  }
}
```

---

#### **2.2.2 GET /api/breakdowns/{id}/root-causes** — 근본 원인 목록

**응답 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "root_cause_type": "design_flaw",
      "description": "The seal was undersized...",
      "contributing_factors": ["high_pressure", "temperature_fluctuation"],
      "frequency_score": 4,
      "confidence_level": 90,
      "analyzed_by": "uuid",
      "analyzed_at": "2026-05-31T15:00:00Z"
    }
  ],
  "count": 1
}
```

---

#### **2.2.3 PUT /api/root-causes/{id}** — 근본 원인 수정

**요청:**
```json
{
  "description": "Updated analysis...",
  "confidence_level": 95
}
```

**응답 (200):** 수정된 root_cause 객체

---

#### **2.2.4 DELETE /api/root-causes/{id}** — 근본 원인 삭제

**응답 (204):** No Content

---

### 2.3 Corrective Actions (4 endpoints)

#### **2.3.1 POST /api/breakdowns/{id}/actions** — 개선 조치 생성

**요청:**
```json
{
  "action_description": "Replace seal with upgraded version",  -- required
  "action_category": "replacement",  -- required
  "assigned_to": "uuid",
  "priority": 1,
  "planned_start_date": "2026-06-01T09:00:00Z",
  "planned_end_date": "2026-06-01T17:00:00Z",
  "estimated_cost": 15000.00
}
```

**응답 (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "breakdown_id": "uuid",
    "action_description": "Replace seal with upgraded version",
    "status": "open",
    "completion_percentage": 0,
    "assigned_to": "uuid",
    "planned_start_date": "2026-06-01T09:00:00Z",
    "planned_end_date": "2026-06-01T17:00:00Z"
  }
}
```

---

#### **2.3.2 GET /api/breakdowns/{id}/actions** — 조치 목록

**쿼리:**
```
status=open
assigned_to=uuid
order=planned_end_date.asc
limit=50
offset=0
```

**응답 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action_description": "Replace seal...",
      "status": "in_progress",
      "completion_percentage": 60,
      "assigned_to": "uuid",
      "planned_end_date": "2026-06-01T17:00:00Z",
      "actual_end_date": null
    }
  ],
  "count": 3
}
```

---

#### **2.3.3 PUT /api/actions/{id}** — 조치 수정

**요청:**
```json
{
  "status": "in_progress",
  "completion_percentage": 60,
  "actual_start_date": "2026-06-01T09:15:00Z"
}
```

**응답 (200):** 수정된 action 객체

---

#### **2.3.4 PUT /api/actions/{id}/close** — 조치 완료

**요청:**
```json
{
  "status": "completed",
  "actual_end_date": "2026-06-01T16:45:00Z",
  "actual_cost": 14500.00,
  "completion_notes": "Seal replaced successfully with part number...",
  "documents": ["https://...photo1.jpg", "https://...receipt.pdf"]
}
```

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "actual_end_date": "2026-06-01T16:45:00Z",
    "actual_cost": 14500.00,
    "completion_percentage": 100,
    "updated_at": "2026-06-01T16:46:00Z"
  }
}
```

---

### 2.4 Workflow & Status (1 endpoint)

#### **2.4.1 GET /api/breakdowns/{id}/history** — 감시 추적

**쿼리:**
```
limit=100
offset=0
order=changed_at.desc
```

**응답 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "breakdown_id": "uuid",
      "field_name": "status",
      "old_value": "open",
      "new_value": "investigating",
      "change_type": "status_changed",
      "changed_by": "uuid",
      "changed_at": "2026-05-30T10:45:00Z",
      "reason": "Initial assessment in progress"
    },
    {
      "id": "uuid",
      "field_name": "assigned_to",
      "old_value": null,
      "new_value": "uuid",
      "change_type": "assigned",
      "changed_by": "uuid",
      "changed_at": "2026-05-30T11:00:00Z"
    }
  ],
  "count": 8
}
```

---

### 2.5 Breakdown Response 기록 (자동 생성, 조회 전용)

#### **2.5.1 GET /api/breakdowns/{id}/responses** — 대응 기록 조회

**응답 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "breakdown_id": "uuid",
      "response_type": "initial_assessment",
      "response_description": "Visual inspection completed. Seal failure confirmed.",
      "performed_by": "uuid",
      "response_at": "2026-05-30T10:45:00Z",
      "response_duration_minutes": 15,
      "effectiveness_level": "partial",
      "photos": ["https://...photo1.jpg"],
      "notes": "Temporary fix applied, permanent solution needed"
    }
  ],
  "count": 2
}
```

---

## 3️⃣ Integration Test Specification

### 테스트 범위
- **테스트 프레임워크:** Jest + Supertest
- **테스트 데이터베이스:** 별도의 test 스키마 사용
- **목표:** 엔드포인트별 2개 이상 테스트 (최소 30+)

### 테스트 케이스 목록

#### Breakdown CRUD (6 tests)
```
✓ Create new breakdown with valid data
✓ Create breakdown fails with missing required fields
✓ Get breakdown list with filters (status, severity)
✓ Get breakdown detail with related data
✓ Update breakdown status
✓ Assign breakdown to user
```

#### Root Cause (4 tests)
```
✓ Create root cause analysis
✓ Get root causes for breakdown
✓ Update root cause confidence level
✓ Delete root cause (cascades)
```

#### Corrective Actions (4 tests)
```
✓ Create corrective action
✓ Update action status and completion
✓ Close action with completion notes
✓ Get action list with filtering
```

#### Workflow (2 tests)
```
✓ Status change creates history record
✓ Get complete audit trail
```

#### RLS Policies (4 tests)
```
✓ User can only see breakdowns in their facility
✓ Assigned user can update action
✓ Admin can delete breakdown
✓ Cross-facility access blocked
```

#### Error Handling (4+ tests)
```
✓ 400: Invalid input validation
✓ 401: Unauthorized (missing token)
✓ 403: Forbidden (insufficient permission)
✓ 404: Resource not found
✓ 409: Duplicate incident number
```

---

## 4️⃣ API 문서 (Swagger)

### Swagger YAML 구조
```yaml
openapi: 3.0.0
info:
  title: DSC Breakdown Management API
  version: 1.0.0
  description: Maintenance incident and corrective action tracking

servers:
  - url: https://dsc-fms-portal.vercel.app/api
    description: Production API

paths:
  /breakdowns:
    get:
      summary: Get breakdowns list
      tags: [Breakdowns]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [open, investigating, in_progress, closed, deferred]
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BreakdownListResponse'
        '401':
          description: Unauthorized
    
    post:
      summary: Create new breakdown
      tags: [Breakdowns]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateBreakdownRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BreakdownResponse'
        '400':
          description: Validation error

components:
  schemas:
    Breakdown:
      type: object
      properties:
        id:
          type: string
          format: uuid
        incident_number:
          type: string
        asset_id:
          type: string
          format: uuid
        title:
          type: string
        status:
          type: string
          enum: [open, investigating, in_progress, closed, deferred]
        severity:
          type: string
          enum: [low, medium, high, critical]
        reported_at:
          type: string
          format: date-time
        assigned_to:
          type: string
          format: uuid
          nullable: true
      required:
        - id
        - incident_number
        - asset_id
        - title
        - status
```

---

## 5️⃣ 데이터 마이그레이션 전략

### Migration 파일 구조
```
supabase/migrations/
├── db_XX_breakdowns_schema.sql
├── db_XX_root_causes_schema.sql
├── db_XX_corrective_actions_schema.sql
├── db_XX_breakdown_responses_schema.sql
├── db_XX_breakdown_history_schema.sql
└── db_XX_rls_policies.sql
```

### 실행 순서
1. Core 테이블 생성 (breakdowns, root_causes, corrective_actions, breakdown_responses)
2. 인덱스 생성
3. RLS 정책 활성화
4. Audit 테이블 생성 (breakdown_history)

---

## 6️⃣ Implementation Timeline

| 단계 | 시간 | 결과물 |
|------|------|--------|
| **Day 1** | 18:00-24:00 | 5개 테이블 + RLS 정책 + 인덱스 |
| **Day 2** | 18:00-24:00 | 6개 CRUD API (GET/POST/PUT/DELETE) |
| **Day 3** | 18:00-24:00 | 8개 Root Cause + Action API |
| **Day 4** | 18:00-24:00 | 1개 Workflow API |
| **Day 5** | 18:00-20:00 | 테스트 스위트 (30+) + Swagger 문서 |

---

## 7️⃣ 성공 기준 (Definition of Done)

### Database ✅
- [ ] 5개 테이블 생성 및 검증
- [ ] 모든 외래키 및 제약조건 정의
- [ ] 인덱스 성능 최적화 완료
- [ ] RLS 정책 검증 (3개 정책 × 5 테이블 = 15개)
- [ ] Production migration 파일 검증

### API ✅
- [ ] 15개 엔드포인트 완전 구현
- [ ] Request/Response 스키마 검증
- [ ] 에러 처리 및 상태 코드 일관성
- [ ] Rate limiting 구현
- [ ] CORS 정책 설정

### Tests ✅
- [ ] 30+ 유닛 테스트 (커버리지 80%+)
- [ ] 모든 에러 케이스 테스트
- [ ] RLS 정책 테스트 (격리)
- [ ] 엔드투엔드 워크플로우 테스트

### Documentation ✅
- [ ] Swagger YAML 완성
- [ ] API 사용 예제 (curl, JavaScript)
- [ ] 데이터베이스 ERD 다이어그램
- [ ] 문제 해결 가이드

### Readiness ✅
- [ ] Production 배포 준비 완료
- [ ] UI 팀 온보딩 자료 준비
- [ ] 성능 벤치마크 (응답시간 < 200ms)
- [ ] 보안 감사 완료

---

## 📞 Notes for Backend Engineer

### Phase 1 vs Phase 2 예상 범위

**Phase 1 (현재 설계):**
- Core CRUD operations
- Basic workflow (open → investigating → in_progress → closed)
- Simple root cause + action tracking
- Manual history logging

**Phase 2 (향후, 미설계):**
- Advanced analytics (breakdown trends, RCA patterns)
- Automated notifications & escalation
- Predictive maintenance recommendations
- Report generation (Excel, PDF)
- Mobile app support
- Multi-language support (Tamil, Hindi)

### 기술 표준 (Team 기준)
- Node.js + Express / Next.js API Routes
- Supabase PostgreSQL
- PostgREST 자동 API (기본)
- 커스텀 Next.js API Routes (복잡한 로직)
- Jest + Supertest 테스트
- Swagger OpenAPI 3.0 문서화

---

## 🎯 다음 단계

1. **Backend Engineer** 배정 (현재: TBD)
2. **Day 1 시작:** 2026-05-30 18:00 KST
3. **Milestone 별 완료 검증:** 매일 자정 전 보고
4. **최종 검증:** 2026-06-02 18:00 KST (배포 2시간 전)
5. **UI 팀 인수:** 2026-06-02 20:00 KST 이후

---

**설계 상태:** ✅ COMPLETE (Ready for Implementation)  
**최종 승인:** Pending Backend Engineer Assignment  
**설계 문서 버전:** 1.0.0
