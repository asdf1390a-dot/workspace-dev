---
name: Asset Master Phase 3-6 Comprehensive Specification
description: Phase 3-1 through Phase 6 implementation roadmap with API/UI/DB specifications
type: project
version: 1.0
created: 2026-06-12 13:35 KST
status: READY_FOR_DEVELOPMENT
deadline: 2026-06-15 18:00 KST
owner: Data Analyst AI
---

# Asset Master Phase 3-6 종합 명세서

**목표:** 자산 관리 플랫폼 고급 기능 구현 (편집 추적, 폐기 관리, 보고서)  
**마감:** 2026-06-15 18:00 KST  
**담당:** Data Analyst AI (Phase 3-4), Web Developer (Phase 5-6 UI)  
**의존성:** db/30 마이그레이션 실행 (Supabase)  
**진행률:** 0% (준비 완료, 실행 대기)

---

## 📋 Project Overview

### 프로젝트 구조

```
Asset Master Platform
├─ Phase 3-1: Edit History Tracking (자산 편집 이력)
├─ Phase 3-2: Disposal Management (폐기 관리)
├─ Phase 4: Edit Validation & Rollback (편집 검증 및 복구)
├─ Phase 5: Audit Reports (감사 보고)
└─ Phase 6: Analytics Dashboard (분석 대시보드)
```

### 기대 효과

| 항목 | 설명 | 임팩트 |
|------|------|--------|
| **Edit Tracking** | 모든 자산 변경사항 기록 (사용자, 시간, 이전값, 새값) | 감사 추적 완성 |
| **Disposal Mgmt** | 자산 폐기/해제 프로세스 자동화 | 정확한 재고관리 |
| **Rollback** | 잘못된 편집 되돌리기 | 데이터 오류 복구 |
| **Audit Reports** | 변경 이력 기반 감사 보고서 | 규정 준수 |
| **Analytics** | 편집/폐기 패턴 분석 | 운영 개선 |

---

## 🗄️ Database Schema (db/30)

### 1. Assets Table 수정 (ALTER)

```sql
-- 편집 추적 관련 컬럼 추가
ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  edit_history JSONB DEFAULT '[]'::jsonb;           -- 편집 이력 snapshot
ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  last_edited_by uuid;                               -- 마지막 편집자
ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  last_edited_at timestamptz DEFAULT now();          -- 마지막 편집 시간
ALTER TABLE assets ADD CONSTRAINT fk_assets_last_edited_by 
  FOREIGN KEY (last_edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

**Status:** ✅ SQL in db/30 lines 5-12

### 2. Asset Edit History Table

```sql
CREATE TABLE IF NOT EXISTS asset_edit_history (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_field VARCHAR(255) NOT NULL,       -- 변경된 필드명
  previous_value TEXT,                       -- 이전값
  new_value TEXT,                            -- 새값
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- idx_asset_edit_history_asset_id (조회 성능)
- idx_asset_edit_history_changed_at (시간순 조회)
- idx_asset_edit_history_changed_by (사용자별 조회)

**RLS Policies:**
- SELECT: changed_by = auth.uid() (본인만 보기)
- INSERT: changed_by = auth.uid() (본인만 기록)

**Status:** ✅ SQL in db/30 lines 16-49

### 3. Asset Disposals Table

```sql
CREATE TABLE IF NOT EXISTS asset_disposals (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  disposed_by UUID NOT NULL REFERENCES auth.users(id),
  disposal_reason VARCHAR(255) NOT NULL,    -- 폐기 사유 (수명만료, 손상, etc)
  disposal_date DATE NOT NULL,               -- 폐기 날짜
  disposal_certificate_url TEXT,             -- 폐기 증명서 (선택)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- idx_asset_disposals_asset_id
- idx_asset_disposals_disposed_by
- idx_asset_disposals_created_at

**RLS Policies:**
- SELECT: disposed_by = auth.uid() OR asset in user's portfolio
- INSERT: disposed_by = auth.uid()

**Status:** ✅ SQL in db/30 lines 26-78

---

## 🔌 API Specifications

### Phase 3-1: Edit History APIs

#### 1️⃣ GET /api/assets/:assetId/edit-history
**목적:** 특정 자산의 편집 이력 조회  
**권한:** Portfolio owner  
**Query Params:**
- `limit` (기본값: 20, 최대: 100)
- `offset` (기본값: 0)
- `field` (선택: 특정 필드만, 예: "status")

**Response 200:**
```json
{
  "asset_id": "uuid",
  "total_count": 145,
  "entries": [
    {
      "id": 1001,
      "changed_by": {"id": "uuid", "name": "John Doe"},
      "changed_field": "status",
      "previous_value": "active",
      "new_value": "maintenance",
      "changed_at": "2026-06-12T10:30:00Z"
    }
  ]
}
```

**Implementatio Time:** 3 hours (query + response formatting)

---

#### 2️⃣ GET /api/assets/:assetId/edit-history/:entryId/diff
**목적:** 특정 편집 항목의 상세 차이 조회  
**Response 200:**
```json
{
  "field": "location",
  "previous_value": "Building A - Room 101",
  "new_value": "Building B - Room 205",
  "changed_by": "John Doe",
  "changed_at": "2026-06-12T10:30:00Z",
  "severity": "moderate"  // low/moderate/high
}
```

**Implementation Time:** 2 hours

---

#### 3️⃣ GET /api/assets/edit-history/changes-by-user
**목적:** 사용자별 변경 이력 조회 (감사용)  
**Query Params:**
- `user_id` (필수)
- `date_from`, `date_to` (날짜 범위)
- `limit`, `offset`

**Response 200:**
```json
{
  "user": {"id": "uuid", "name": "Jane Smith"},
  "total_changes": 342,
  "changes": [
    {
      "asset_id": "uuid",
      "asset_name": "Lathe #3",
      "changed_field": "status",
      "changed_at": "2026-06-12T14:15:00Z"
    }
  ]
}
```

**Implementation Time:** 3 hours

---

### Phase 3-2: Disposal Management APIs

#### 4️⃣ POST /api/assets/:assetId/dispose
**목적:** 자산 폐기 등록  
**권한:** Portfolio owner  
**Request Body:**
```json
{
  "disposal_reason": "수명만료",
  "disposal_date": "2026-06-15",
  "disposal_certificate_url": "https://..."  // 선택
}
```

**Response 201:**
```json
{
  "id": 42,
  "asset_id": "uuid",
  "disposal_reason": "수명만료",
  "disposal_date": "2026-06-15",
  "created_at": "2026-06-12T13:35:00Z",
  "status": "recorded"
}
```

**Validations:**
- disposal_date ≤ today
- disposal_reason in ['수명만료', '손상', '판매', '기증', '기타']
- asset status != 'disposed' (중복 방지)

**Side Effects:**
- Update assets.status = 'disposed'
- Create asset_edit_history entry (status: active → disposed)
- Deduct from portfolio total_assets count

**Implementation Time:** 5 hours

---

#### 5️⃣ GET /api/assets/disposed
**목적:** 폐기된 자산 목록 조회  
**Query Params:**
- `date_from`, `date_to` (폐기 날짜 범위)
- `reason` (폐기 사유 필터)
- `limit`, `offset`

**Response 200:**
```json
{
  "total_disposed": 23,
  "disposal_count_by_reason": {
    "수명만료": 10,
    "손상": 8,
    "판매": 5
  },
  "assets": [
    {
      "asset_id": "uuid",
      "asset_name": "Lathe #5",
      "disposal_reason": "수명만료",
      "disposal_date": "2026-06-10",
      "disposal_by": "John Doe"
    }
  ]
}
```

**Implementation Time:** 3 hours

---

#### 6️⃣ PATCH /api/assets/:assetId/restore
**목적:** 오류로 등록된 폐기 취소 (관리자)  
**권한:** Admin only  
**Request Body:**
```json
{
  "reason": "잘못된 기록",
  "approved_by_manager": true
}
```

**Response 200:**
```json
{
  "asset_id": "uuid",
  "status": "active",
  "restoration_date": "2026-06-12T13:35:00Z",
  "message": "자산 복구 완료"
}
```

**Side Effects:**
- asset_disposals entry에 is_reverted = true 표시
- assets.status = 'active' 복구
- 새로운 edit_history 항목 생성

**Implementation Time:** 4 hours

---

### Phase 4: Edit Validation & Rollback APIs

#### 7️⃣ POST /api/assets/:assetId/edit-history/rollback
**목적:** 특정 시점으로 자산 상태 되돌리기  
**권한:** Portfolio owner (자기 자산), Manager (모든 자산)  
**Request Body:**
```json
{
  "target_edit_id": 1001,
  "reason": "입력 실수"
}
```

**Response 200:**
```json
{
  "asset_id": "uuid",
  "previous_state": {...},
  "restored_state": {...},
  "rollback_timestamp": "2026-06-12T13:35:00Z",
  "affected_fields": ["status", "location"]
}
```

**Validation:**
- target_edit_id는 asset의 edit_history에 존재해야 함
- 마지막 편집 이후 새로운 편집이 없어야 함 (충돌 방지)
- 관리자만 다른 사용자의 편집 롤백 가능

**Implementation Time:** 6 hours

---

#### 8️⃣ GET /api/assets/:assetId/edit-history/audit-trail
**목적:** 감사용 완전한 변경 추적  
**Query Params:**
- `include_deleted` (boolean, 기본값: false)

**Response 200:**
```json
{
  "asset_id": "uuid",
  "asset_name": "Lathe #3",
  "full_timeline": [
    {
      "version": 1,
      "timestamp": "2026-05-20T08:00:00Z",
      "changed_by": "System",
      "action": "created",
      "state_snapshot": {...}
    },
    {
      "version": 2,
      "timestamp": "2026-05-25T10:30:00Z",
      "changed_by": "John Doe",
      "action": "updated",
      "fields_changed": {"status": "active → maintenance"},
      "state_snapshot": {...}
    }
  ],
  "total_versions": 12
}
```

**Implementation Time:** 4 hours

---

### Phase 5: Audit Report APIs

#### 9️⃣ GET /api/audit/edit-summary
**목적:** 일정 기간의 편집 요약 보고서  
**Query Params:**
- `date_from`, `date_to` (필수)
- `portfolio_id` (선택, 미지정시 전체)

**Response 200:**
```json
{
  "period": "2026-06-01 ~ 2026-06-12",
  "summary": {
    "total_edits": 342,
    "total_disposals": 5,
    "edits_by_field": {
      "status": 120,
      "location": 95,
      "notes": 87,
      "maintenance_date": 40
    },
    "edits_by_user": {
      "John Doe": 150,
      "Jane Smith": 120,
      "System": 72
    },
    "high_activity_assets": [
      {"asset_id": "uuid", "changes": 15}
    ]
  }
}
```

**Implementation Time:** 5 hours

---

#### 🔟 POST /api/audit/generate-report
**목적:** 이력 기반 감사 보고서 생성  
**Request Body:**
```json
{
  "report_type": "change_log",  // change_log, disposal, anomaly
  "date_range": {"from": "2026-05-01", "to": "2026-06-12"},
  "include_pdf": true,
  "recipients": ["manager@company.com"]
}
```

**Response 201:**
```json
{
  "report_id": "uuid",
  "report_type": "change_log",
  "status": "generating",
  "estimated_completion": "2026-06-12T14:00:00Z"
}
```

**Async Process:**
- Background worker generates PDF/Excel
- Email dispatch when complete
- Archive in S3/storage

**Implementation Time:** 8 hours (including PDF generation)

---

### Phase 6: Analytics Dashboard APIs

#### 1️⃣1️⃣ GET /api/analytics/asset-lifecycle
**목적:** 자산 수명주기 분석 (생성 → 활용 → 폐기)  
**Query Params:**
- `group_by` (asset_type, department, location)

**Response 200:**
```json
{
  "lifecycle_stats": {
    "total_assets_created": 234,
    "average_lifespan_days": 1250,
    "total_disposed": 12,
    "disposal_rate_percent": 5.1,
    "premature_disposals": 2,  // 배포 후 1년 미만
    "by_asset_type": {
      "Lathe": {
        "created": 50,
        "disposed": 3,
        "avg_lifespan": 1400
      }
    }
  }
}
```

**Implementation Time:** 6 hours

---

#### 1️⃣2️⃣ GET /api/analytics/edit-patterns
**목적:** 편집 패턴 분석 (어떤 필드가 자주 변경되는가)  
**Query Params:**
- `time_range` (week, month, quarter, year)

**Response 200:**
```json
{
  "analysis_period": "2026-06 (current month)",
  "edit_velocity": {
    "edits_per_day_avg": 28.5,
    "peak_edit_day": "Tuesday",
    "peak_edit_hour": "10:00-11:00"
  },
  "field_volatility": {
    "status": {
      "change_frequency": 120,
      "common_transitions": [
        "active → maintenance (85 times)",
        "maintenance → active (35 times)"
      ]
    },
    "location": {
      "change_frequency": 45,
      "stability_score": 0.82
    }
  }
}
```

**Implementation Time:** 5 hours

---

## 🎨 UI Components Specification

### Phase 3-1 UI: Edit History Dashboard

#### Component: AssetEditHistoryViewer
```typescript
interface AssetEditHistoryViewerProps {
  assetId: UUID;
  limit?: number;
  showDiff?: boolean;  // Inline diff view
  exportFormat?: 'json' | 'csv' | 'pdf';
}

// Features:
// - Timeline view (newest first)
// - Field-based filtering
// - User-based filtering
// - Export edit history
// - Show/hide detailed diffs
// - Search within history
```

**Implementation Location:** `/dsc-fms-portal/app/components/AssetEditHistoryViewer.tsx`  
**Implementation Time:** 4 hours

---

### Phase 3-2 UI: Disposal Management

#### Component: AssetDisposalForm
```typescript
interface AssetDisposalFormProps {
  assetId: UUID;
  onDisposalComplete: (disposalRecord) => void;
}

// Features:
// - Reason dropdown (5 options)
// - Date picker (≤ today)
// - Certificate upload (optional)
// - Confirmation modal
// - Success notification
```

**Implementation Time:** 3 hours

---

#### Component: DisposedAssetsTable
```typescript
interface DisposedAssetsTableProps {
  dateRange: DateRange;
  reasonFilter?: string;
  pageSize?: number;
}

// Features:
// - Filterable table (reason, date)
// - Pagination
// - Export as CSV
// - Restore button (admin only)
// - Certificate viewer
```

**Implementation Time:** 3 hours

---

### Phase 5 UI: Audit Reports

#### Component: AuditReportGenerator
```typescript
interface AuditReportGeneratorProps {
  portfolioId?: UUID;
  defaultReportType: 'change_log' | 'disposal' | 'anomaly';
}

// Features:
// - Date range picker
// - Report type selector
// - Recipient email input
// - Generation progress bar
// - Download options (PDF, Excel)
```

**Implementation Time:** 4 hours

---

### Phase 6 UI: Analytics Dashboard

#### Dashboard Layout
```
┌─────────────────────────────────────────────────────┐
│  Asset Lifecycle Analytics                    [Export]│
├─────────────────────────────────────────────────────┤
│ [Avg Lifespan] [Disposal Rate] [Premature %] [Count] │
├─────────────────────────────────────────────────────┤
│  Edit Patterns & Volatility                          │
├─────────────────────────────────────────────────────┤
│ [Field Volatility Chart] [Edit Velocity Chart]       │
│ [Time of Day Heatmap]    [Day of Week Distribution] │
├─────────────────────────────────────────────────────┤
│  Asset Type Comparison                               │
├─────────────────────────────────────────────────────┤
│ [Lifespan by Type] [Disposal Rate by Type]           │
└─────────────────────────────────────────────────────┘
```

**Implementation Time:** 6 hours (React charts + data fetching)

---

## 📅 Implementation Timeline

### Phase 3-1: Edit History (2026-06-15 ~ 2026-06-17)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **Database:** db/30 실행 | User (Supabase) | 5분 | 2026-06-15 09:00 |
| **API #1-3:** Edit History endpoints | Data Analyst | 8시간 | 2026-06-15 18:00 |
| **UI:** AssetEditHistoryViewer | Web Dev | 4시간 | 2026-06-16 12:00 |
| **Test:** E2E tests (edit history) | Data Analyst | 4시간 | 2026-06-16 18:00 |
| **Integration:** API + UI 통합 | Web Dev | 3시간 | 2026-06-17 15:00 |

**Milestone:** Phase 3-1 완료 2026-06-17 15:00 ✅

---

### Phase 3-2: Disposal (2026-06-17 ~ 2026-06-19)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **API #4-6:** Disposal endpoints | Data Analyst | 12시간 | 2026-06-18 12:00 |
| **UI:** DisposalForm + DisposedTable | Web Dev | 6시간 | 2026-06-18 18:00 |
| **Test:** E2E tests (disposal) | Data Analyst | 3시간 | 2026-06-19 09:00 |
| **Integration & Review** | Both | 4시간 | 2026-06-19 14:00 |

**Milestone:** Phase 3-2 완료 2026-06-19 14:00 ✅

---

### Phase 4: Rollback (2026-06-19 ~ 2026-06-21)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **API #7-8:** Rollback + Audit Trail | Data Analyst | 10시간 | 2026-06-20 18:00 |
| **Test & Validation** | Data Analyst | 5시간 | 2026-06-21 10:00 |

**Milestone:** Phase 4 완료 2026-06-21 10:00 ✅

---

### Phase 5: Audit Reports (2026-06-21 ~ 2026-06-23)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **API #9-10:** Report generation | Data Analyst | 13시간 | 2026-06-22 18:00 |
| **UI:** AuditReportGenerator | Web Dev | 4시간 | 2026-06-23 09:00 |
| **Background Jobs:** PDF/Email | Automation | 4시간 | 2026-06-23 14:00 |

**Milestone:** Phase 5 완료 2026-06-23 14:00 ✅

---

### Phase 6: Analytics (2026-06-23 ~ 2026-06-25)

| Task | Owner | Duration | Deadline |
|------|-------|----------|----------|
| **API #11-12:** Analytics endpoints | Data Analyst | 11시간 | 2026-06-24 18:00 |
| **UI:** Analytics Dashboard | Web Dev | 6시간 | 2026-06-25 10:00 |
| **Charts & Visualizations** | Web Dev | 5시간 | 2026-06-25 15:00 |

**Milestone:** Phase 6 완료 2026-06-25 15:00 ✅

---

## ✅ Success Criteria

### Database Layer
- [ ] db/30 마이그레이션 Supabase 적용 ✅
- [ ] asset_edit_history 테이블 생성 + RLS 정책
- [ ] asset_disposals 테이블 생성 + RLS 정책
- [ ] 모든 인덱스 생성 (성능 검증)
- [ ] Foreign key constraints 검증

### API Layer
- [ ] 12개 엔드포인트 모두 구현 (API #1-12)
- [ ] 모든 엔드포인트 401/403/404/500 에러 처리
- [ ] 페이지네이션 (limit/offset) 구현
- [ ] 필터링 기능 (field, date_range, reason) 구현
- [ ] Side effects (자동 상태 변경, 이력 기록) 정상 작동
- [ ] E2E 테스트 > 95% 커버리지

### UI Layer
- [ ] 6개 주요 컴포넌트 완성
- [ ] 모바일 반응형 (600px+)
- [ ] Export 기능 (CSV, PDF)
- [ ] 에러 메시지 명확 (한글)
- [ ] 로딩 상태 UI (Skeleton, Progress)
- [ ] 권한 기반 UI 렌더링 (관리자 버튼 표시)

### Integration & Testing
- [ ] 모든 API + UI 통합 테스트
- [ ] 성능 검증 (100행 데이터 조회 < 500ms)
- [ ] 동시성 테스트 (2개 사용자 동시 편집)
- [ ] 롤백 트랜잭션 원자성 검증

---

## 🔗 Dependencies

### 선행 조건
- ✅ db/30 마이그레이션 실행 (User action, 2026-06-15 09:00)
- ✅ assets 테이블 기존 스키마 (이미 존재)
- ✅ auth.users 테이블 (이미 존재)
- ✅ portfolios 테이블 (이미 존재)

### 병렬 가능 작업
- API 개발과 UI 개발은 완전 독립 (병렬 진행 가능)
- 테스트는 API/UI 각각 완료 후 통합 테스트

### 블로킹 항목
- **db/30 마이그레이션:** User must execute in Supabase SQL Editor
  - Link: https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql
  - SQL File: `/home/jeepney/.openclaw/workspace-dev/db/30_asset_master_phase3_schema.sql`

---

## 📊 Resource Allocation

### 팀 배치 (2026-06-15 ~ 2026-06-25)

| 역할 | 담당 | 기간 | 활용도 |
|------|------|------|--------|
| **Data Analyst** | API 개발 (API #1-12) | 2026-06-15 ~ 06-25 | 80% |
| **Web Developer** | UI 개발 (Component + Charts) | 2026-06-15 ~ 06-25 | 80% |
| **Automation** | Background jobs (Report PDF) | 2026-06-21 ~ 06-23 | 40% |

### 예상 투입 시간

| Phase | Task | Duration |
|-------|------|----------|
| Phase 3-1 | Edit History | 19 hours |
| Phase 3-2 | Disposal | 25 hours |
| Phase 4 | Rollback | 15 hours |
| Phase 5 | Audit Reports | 21 hours |
| Phase 6 | Analytics | 22 hours |
| **합계** | **전체** | **102 hours** |

---

## 🚀 Launch Plan (2026-06-25)

### Pre-Launch Verification
- [ ] Smoke test: 모든 12개 API 엔드포인트 응답 확인
- [ ] UI smoke test: 모든 주요 화면 렌더링 확인
- [ ] Performance baseline: API 응답시간 < 500ms
- [ ] Security: RLS 정책 격리 테스트 (다른 사용자 데이터 접근 불가)
- [ ] Data integrity: 롤백 후 원본 상태 정확히 복원 확인

### Deployment Steps
1. db/30 마이그레이션 Supabase 적용 (2026-06-15 09:00)
2. API 배포 (Dev → Staging → Production)
3. UI 배포 (Vercel)
4. 모니터링 (CTB polling, Vercel health)

### Rollout Schedule
- **2026-06-15:** Phase 3-1 시작
- **2026-06-17:** Phase 3-1 완료, Phase 3-2 시작
- **2026-06-19:** Phase 3-2 완료, Phase 4 시작
- **2026-06-21:** Phase 4 완료, Phase 5 시작
- **2026-06-23:** Phase 5 완료, Phase 6 시작
- **2026-06-25:** Phase 6 완료, 전체 5-6 마이그레이션 완료 ✅

---

## 📝 Related Documents

- `/home/jeepney/.openclaw/workspace-dev/db/30_asset_master_phase3_schema.sql` — DB 마이그레이션
- `/home/jeepney/.openclaw/workspace-dev/ASSET_MASTER_PHASE2_POST_MIGRATION_PLAN.md` — Phase 2 완료 체크리스트
- `/home/jeepney/.openclaw/workspace-dev/memory/project_asset_master_phase2_roadmap.md` — 역사 참고

---

**준비 완료:** 2026-06-12 13:35 KST  
**다음 단계:** db/30 마이그레이션 실행 (User action, 2026-06-15 09:00)  
**상태:** 🟢 개발 준비 완료

