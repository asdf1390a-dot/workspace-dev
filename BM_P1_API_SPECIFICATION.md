# Breakdown Management Phase 1 — API Specification

**Version:** 1.0  
**Created:** 2026-05-29  
**Status:** Phase 1 Implementation Complete  
**Deploy Target:** Vercel (DSC FMS Portal)

---

## 📋 Overview

The Breakdown Management (BM) Phase 1 API provides comprehensive endpoints for reporting, tracking, analyzing equipment breakdowns/failures in the DSC Mannur plant. This phase implements core functionality with full REST API, analytics, and RLS security.

**Base URL:** `https://fms.dscindia.com/api/bm`

**Authentication:** Bearer token (JWT) in `Authorization` header

---

## 🗄️ Database Schema

### Core Table: `breakdown_reports`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | Primary key (auto-generated) |
| `asset_id` | UUID | ✅ | Reference to Asset Master |
| `description` | TEXT | ✅ | Breakdown description (English) |
| `description_ta` | TEXT | | Breakdown description (Tamil) |
| `status` | TEXT | ✅ | State: `reported` \| `acknowledged` \| `in_progress` \| `resolved` \| `won_fix` |
| `severity` | TEXT | ✅ | `minor` \| `normal` \| `major` \| `line_down` |
| `category` | TEXT | | `mechanical` \| `electrical` \| `hydraulic` \| `software` \| `operator_error` \| `unknown` |
| `started_at` | TIMESTAMPTZ | | When breakdown started (actual) |
| `resolved_at` | TIMESTAMPTZ | | When breakdown resolved |
| `reported_at` | TIMESTAMPTZ | ✅ | When reported (auto-generated) |
| `duration_minutes` | INT | | GENERATED: (resolved_at - started_at) in minutes |
| `reported_by` | UUID | ✅ | Reference to `auth.users(id)` |
| `assigned_to` | UUID | | Assigned technician |
| `resolved_by` | UUID | | Technician who resolved |
| `root_cause` | TEXT | | Root cause analysis |
| `action_taken` | TEXT | | Actions taken to resolve |
| `photos` | TEXT[] | | Array of photo storage URLs |
| `documents` | TEXT[] | | Array of document URLs |
| `created_at` | TIMESTAMPTZ | ✅ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | ✅ | Auto-updated on changes |
| `deleted_at` | TIMESTAMPTZ | | Soft-delete flag (NULL = active) |

### Analytics View: `breakdown_analysis`

Aggregated view for KPI metrics by asset and month.

| Column | Type | Description |
|--------|------|-------------|
| `asset_id` | UUID | Asset identifier |
| `machine_asset_number` | TEXT | Machine number from Asset Master |
| `asset_name` | TEXT | Asset name (English) |
| `month` | DATE | Month (YYYY-MM-01 format) |
| `resolved_count` | INT | Count of resolved breakdowns |
| `open_count` | INT | Count of unresolved breakdowns |
| `total_count` | INT | Total breakdowns in month |
| `line_down_count` | INT | Count of line-down severity |
| `major_count` | INT | Count of major severity |
| `normal_count` | INT | Count of normal severity |
| `minor_count` | INT | Count of minor severity |
| `avg_mttr_minutes` | INT | Mean Time To Repair |
| `avg_mtbf_hours` | INT | Mean Time Between Failures |
| `total_downtime_minutes` | BIGINT | Total downtime sum |

### RLS Policies

1. **View All Breakdowns** — All users can view active (`deleted_at IS NULL`) reports
2. **Create Breakdowns** — Any authenticated user can create reports
3. **Update Own Breakdowns** — Only reporter, assignee, or admin can update

---

## 🔌 API Endpoints

### 1. **List Breakdowns** `GET /api/bm/breakdowns`

Retrieve paginated breakdown reports with advanced filtering.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `asset_id` | UUID | | Filter by specific asset |
| `status` | STRING | | Comma-separated statuses (e.g., `reported,in_progress`) |
| `severity` | STRING | | Comma-separated severities (e.g., `major,line_down`) |
| `reported_from` | ISO8601 | | Start date (inclusive) |
| `reported_to` | ISO8601 | | End date (inclusive) |
| `sort_by` | STRING | `reported_at` | Column to sort by |
| `sort_dir` | STRING | `desc` | `asc` or `desc` |
| `limit` | INT | 50 | Max 500 results |
| `offset` | INT | 0 | Pagination offset |

**Request:**
```bash
curl -X GET \
  'https://fms.dscindia.com/api/bm/breakdowns?asset_id=uuid&status=reported,in_progress&limit=25' \
  -H 'Authorization: Bearer <token>'
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "asset_id": "uuid",
      "machine_asset_number": "ASSET-001",
      "asset_name": "Hydraulic Press #1",
      "status": "in_progress",
      "severity": "major",
      "description": "Motor overheating",
      "description_ta": null,
      "category": "electrical",
      "started_at": "2026-05-28T10:00:00Z",
      "resolved_at": null,
      "reported_at": "2026-05-28T10:15:00Z",
      "duration_minutes": null,
      "assigned_to": "uuid",
      "reported_by": "uuid",
      "root_cause": null,
      "action_taken": null,
      "photos": [],
      "documents": [],
      "created_at": "2026-05-28T10:15:00Z",
      "updated_at": "2026-05-28T10:15:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 25,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 2. **Create Breakdown Report** `POST /api/bm/breakdowns`

Report a new equipment breakdown.

**Required Header:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "asset_id": "uuid",
  "description": "Motor malfunction, not starting",
  "description_ta": "விரவு சேதமடைந்தது, தொடங்கவில்லை",
  "severity": "major",
  "category": "mechanical",
  "started_at": "2026-05-28T10:00:00Z",
  "photos": [
    "https://storage.example.com/photo1.jpg"
  ],
  "documents": []
}
```

**Field Validation:**

| Field | Rules |
|-------|-------|
| `asset_id` | Required, valid UUID, must exist in `assets` table |
| `description` | Required, min 1 character |
| `description_ta` | Optional, Tamil text |
| `severity` | Optional, default `normal` |
| `category` | Optional |
| `started_at` | Optional, ISO8601 datetime |
| `photos` | Optional array of URLs |
| `documents` | Optional array of URLs |

**Response (201 Created):**
```json
{
  "id": "uuid",
  "asset_id": "uuid",
  "machine_asset_number": "ASSET-001",
  "asset_name": "Hydraulic Press #1",
  "status": "reported",
  "severity": "major",
  "category": "mechanical",
  "description": "Motor malfunction",
  "started_at": "2026-05-28T10:00:00Z",
  "reported_at": "2026-05-28T10:15:00Z",
  "reported_by": "uuid",
  "duration_minutes": null,
  "created_at": "2026-05-28T10:15:00Z"
}
```

**Error Responses:**

- **400 Bad Request** — Validation failed
  ```json
  {
    "error": "Validation failed",
    "details": [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "undefined",
        "path": ["description"],
        "message": "Required"
      }
    ]
  }
  ```

- **401 Unauthorized** — Missing or invalid JWT token

- **404 Not Found** — Asset does not exist
  ```json
  {
    "error": "Asset not found"
  }
  ```

---

### 3. **Get Breakdown Details** `GET /api/bm/breakdowns/:id`

Retrieve single breakdown report by ID.

**Request:**
```bash
curl -X GET \
  'https://fms.dscindia.com/api/bm/breakdowns/uuid' \
  -H 'Authorization: Bearer <token>'
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "asset_id": "uuid",
  "machine_asset_number": "ASSET-001",
  "asset_name": "Hydraulic Press #1",
  "status": "in_progress",
  "severity": "major",
  "description": "Motor overheating",
  "description_ta": null,
  "category": "electrical",
  "started_at": "2026-05-28T10:00:00Z",
  "resolved_at": null,
  "reported_at": "2026-05-28T10:15:00Z",
  "duration_minutes": null,
  "assigned_to": "uuid",
  "reported_by": "uuid",
  "resolved_by": null,
  "root_cause": null,
  "action_taken": null,
  "photos": [],
  "documents": [],
  "created_at": "2026-05-28T10:15:00Z",
  "updated_at": "2026-05-28T10:15:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Breakdown not found"
}
```

---

### 4. **Update Breakdown** `PATCH /api/bm/breakdowns/:id`

Update breakdown status, assignment, or resolution details.

**Required Header:**
```
Authorization: Bearer <jwt_token>
```

**Request Body (all optional):**
```json
{
  "status": "resolved",
  "assigned_to": "uuid",
  "resolved_at": "2026-05-28T14:30:00Z",
  "resolved_by": "uuid",
  "root_cause": "Bearing failure due to lack of lubrication",
  "action_taken": "Replaced bearing, applied fresh lubricant",
  "category": "mechanical",
  "photos": [
    "https://storage.example.com/replacement.jpg"
  ],
  "documents": [
    "https://storage.example.com/report.pdf"
  ]
}
```

**Validation Rules:**

| Field | Rules |
|-------|-------|
| `status` | Must follow state machine transitions |
| `resolved_at` | Required when status → `resolved`, must be after `started_at` |
| `resolved_by` | Auto-set to current user if not provided (when status = `resolved`) |
| `category` | Must be valid enum or null |
| `photos` | Array of valid URLs |

**Status Transition State Machine:**

```
reported
  ├─→ acknowledged
  └─→ won_fix (can't fix)

acknowledged
  ├─→ in_progress
  └─→ won_fix

in_progress
  ├─→ resolved (requires resolved_at)
  └─→ won_fix

resolved → (no transitions allowed)
won_fix → (no transitions allowed)
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "asset_id": "uuid",
  "machine_asset_number": "ASSET-001",
  "asset_name": "Hydraulic Press #1",
  "status": "resolved",
  "severity": "major",
  "category": "mechanical",
  "started_at": "2026-05-28T10:00:00Z",
  "resolved_at": "2026-05-28T14:30:00Z",
  "reported_at": "2026-05-28T10:15:00Z",
  "duration_minutes": 270,
  "assigned_to": "uuid",
  "reported_by": "uuid",
  "resolved_by": "uuid",
  "root_cause": "Bearing failure",
  "action_taken": "Replaced bearing",
  "photos": ["https://storage.example.com/replacement.jpg"],
  "documents": ["https://storage.example.com/report.pdf"],
  "created_at": "2026-05-28T10:15:00Z",
  "updated_at": "2026-05-28T14:30:00Z"
}
```

**Error Responses:**

- **400 Bad Request** — Invalid status transition
  ```json
  {
    "error": "Invalid status transition",
    "current_status": "reported",
    "requested_status": "resolved",
    "message": "Cannot transition directly from 'reported' to 'resolved'"
  }
  ```

- **400 Bad Request** — Missing required field
  ```json
  {
    "error": "resolved_at is required when transitioning to resolved status"
  }
  ```

- **403 Forbidden** — Authorization check failed (not owner or admin)

- **404 Not Found** — Breakdown does not exist

---

### 5. **Analytics Summary** `GET /api/bm/breakdowns/analytics/summary`

Retrieve KPI analytics and performance metrics.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `asset_id` | UUID | Filter by specific asset |
| `month` | YYYY-MM-DD | Filter by specific month (e.g., `2026-05-01`) |
| `limit` | INT | Max results per page (default 12, max 100) |
| `offset` | INT | Pagination offset (default 0) |

**Request:**
```bash
curl -X GET \
  'https://fms.dscindia.com/api/bm/breakdowns/analytics/summary?asset_id=uuid&limit=12' \
  -H 'Authorization: Bearer <token>'
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "asset_id": "uuid",
      "machine_asset_number": "ASSET-001",
      "asset_name": "Hydraulic Press #1",
      "month": "2026-05-01",
      "summary": {
        "total_breakdowns": 8,
        "resolved_count": 6,
        "open_count": 2,
        "resolution_rate": 75
      },
      "severity_distribution": {
        "line_down": 1,
        "major": 3,
        "normal": 3,
        "minor": 1
      },
      "performance_metrics": {
        "avg_mttr_minutes": 240,
        "avg_mtbf_hours": 312,
        "total_downtime_minutes": 1440
      }
    }
  ],
  "overall_metrics": {
    "total_breakdowns": 156,
    "resolved_count": 142,
    "open_count": 14,
    "resolution_rate": 91,
    "severity_distribution": {
      "line_down": 5,
      "major": 32,
      "normal": 89,
      "minor": 30
    },
    "total_downtime_minutes": 28800
  },
  "pagination": {
    "total": 24,
    "limit": 12,
    "offset": 0,
    "has_more": true
  }
}
```

**Metrics Explanation:**

- **MTTR (Mean Time To Repair)** — Average time from breakdown to resolution
- **MTBF (Mean Time Between Failures)** — Average interval between consecutive breakdowns
- **Resolution Rate** — Percentage of resolved breakdowns
- **Downtime** — Total accumulated breakdown duration

---

## 🔐 Authentication & Authorization

### JWT Token Format

```javascript
{
  "sub": "user-uuid",           // User ID
  "iat": 1674000000,            // Issued at
  "exp": 1674003600,            // Expires in 1 hour
  "iss": "supabase"
}
```

### Example Token Request

```bash
# Login via Supabase Auth
curl -X POST https://fms.dscindia.com/auth/v1/token \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "tech@dscindia.com",
    "password": "your-password"
  }'

# Returns: {"access_token": "eyJhbGc...", ...}
```

### Authorization Rules

| Action | Who Can | Rule |
|--------|---------|------|
| Create breakdown | Any authenticated user | `auth.uid() IS NOT NULL` |
| View breakdown | All users | `deleted_at IS NULL` |
| Update own breakdown | Reporter, assignee, admin | `reported_by` = current_user OR `assigned_to` = current_user |
| Delete breakdown | Admins only (soft-delete) | Not exposed in Phase 1 API |

---

## 🚀 Integration Guide

### Asset Master Integration

Breakdown reports reference assets via `asset_id` foreign key. Before creating a breakdown:

```bash
# 1. Verify asset exists
curl -X GET \
  'https://fms.dscindia.com/api/assets/{asset_id}' \
  -H 'Authorization: Bearer <token>'

# 2. If asset exists, create breakdown
curl -X POST https://fms.dscindia.com/api/bm/breakdowns \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "asset_id": "asset-uuid",
    "description": "..."
  }'
```

### Maintenance Scheduling Integration

Resolved breakdowns (status = `resolved`) feed into maintenance scheduling for preventive planning:

```sql
-- Query unresolved breakdowns that may need preventive action
SELECT 
  br.asset_id,
  a.name_en,
  COUNT(*) as recent_breakdowns,
  AVG(br.duration_minutes) as avg_repair_time
FROM breakdown_reports br
JOIN assets a ON br.asset_id = a.id
WHERE br.deleted_at IS NULL
  AND br.reported_at > now() - INTERVAL '30 days'
GROUP BY br.asset_id, a.name_en
HAVING COUNT(*) > 2
ORDER BY COUNT(*) DESC;
```

### Portal Dashboard Integration

Display real-time breakdown KPIs:

```javascript
// Fetch overall metrics
const response = await fetch('/api/bm/breakdowns/analytics/summary');
const { overall_metrics } = await response.json();

// Display on dashboard
<div>
  <p>Open Breakdowns: {overall_metrics.open_count}</p>
  <p>Resolution Rate: {overall_metrics.resolution_rate}%</p>
  <p>Avg MTTR: {overall_metrics.performance_metrics.avg_mttr_minutes} min</p>
</div>
```

---

## ✅ Testing

### Unit Tests

Run validation and schema tests:

```bash
npm test -- __tests__/api/bm/breakdowns.test.ts
```

### Integration Tests (Manual)

**Test 1: Create breakdown with valid data**
```bash
curl -X POST https://fms.dscindia.com/api/bm/breakdowns \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "asset_id": "valid-uuid",
    "description": "Test breakdown",
    "severity": "normal"
  }'
# Expected: 201 Created
```

**Test 2: Invalid asset ID**
```bash
curl -X POST https://fms.dscindia.com/api/bm/breakdowns \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "asset_id": "nonexistent-uuid",
    "description": "Test breakdown"
  }'
# Expected: 404 Not Found
```

**Test 3: Status transition validation**
```bash
# Try invalid transition (reported → resolved without acknowledged)
curl -X PATCH https://fms.dscindia.com/api/bm/breakdowns/{id} \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "resolved",
    "resolved_at": "2026-05-29T10:00:00Z"
  }'
# Expected: 400 Bad Request (invalid transition)
```

---

## 📊 Database Indexes

The following indexes are created for query performance:

| Index | Table | Columns | Use Case |
|-------|-------|---------|----------|
| `idx_breakdown_reports_asset_id` | breakdown_reports | asset_id | Filter by asset |
| `idx_breakdown_reports_status` | breakdown_reports | status | Filter by status |
| `idx_breakdown_reports_severity` | breakdown_reports | severity | Filter by severity |
| `idx_breakdown_reports_reported_at` | breakdown_reports | reported_at DESC | Date-range queries |
| `idx_breakdown_reports_asset_month` | breakdown_reports | (asset_id, month) | Analytics aggregation |

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-29 | Initial Phase 1 release: Core CRUD + Analytics |
| (future) | 2026-06-15 | Phase 2: UI components + mobile support |

---

## 📞 Support

- **Questions?** Check [BM_P1_IMPLEMENTATION_GUIDE.md](#)
- **Bug Reports?** Open issue in GitHub
- **API Issues?** Check logs: `/logs/bm-api-errors.log`

---

**End of API Specification**
