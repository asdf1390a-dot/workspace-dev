# Team Dashboard API Guide v1.0
**Status:** ✅ Complete (2026-05-26)  
**Stack:** Next.js 14 API Routes + Supabase PostgreSQL  
**Cache Strategy:** ISR (Incremental Static Regeneration) with on-demand revalidation  
**Authentication:** Supabase auth via JWT tokens (server-side validation)

---

## Overview

The Team Dashboard APIs provide real-time data for organizational structure, capability tracking, and team performance metrics. All endpoints support Supabase real-time subscriptions for live updates where specified.

**Base URL:** `https://dsc-fms-portal.vercel.app/api/dashboard`  
**Authentication:** Bearer token in Authorization header (Supabase session)  
**Response Format:** JSON with status code + data/error fields  
**Rate Limit:** 100 requests per minute per user (soft limit)

---

## Authentication & Authorization

### JWT Token Validation
All dashboard endpoints validate the Supabase JWT token via middleware:

```typescript
// middleware/auth.ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function validateAuth(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => req.cookies.getSetCookie() }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return user;
}
```

### Role-Based Access Control

```typescript
// lib/dashboard/rbac.ts
enum UserRole {
  CEO = "ceo",
  OPS_CORE = "ops_core",
  PROJECT_LEAD = "project_lead",
  TEAM_MEMBER = "team_member"
}

interface AccessControl {
  "team-org/structure": [UserRole.CEO];
  "team-capabilities/matrix": [UserRole.CEO, UserRole.OPS_CORE];
  "team-capabilities/improvement-actions": [UserRole.CEO, UserRole.PROJECT_LEAD];
  "team-kpis/summary": [UserRole.CEO, UserRole.OPS_CORE];
  "team-kpis/trends": [UserRole.CEO, UserRole.OPS_CORE];
}

export async function checkAccess(user: User, endpoint: string): Promise<boolean> {
  const userRole = await getUserRole(user.id);
  const allowedRoles = AccessControl[endpoint];
  return allowedRoles.includes(userRole);
}
```

---

## Endpoint 1: Team Organization Structure

### GET `/api/dashboard/team-org/structure`

**Purpose:** Retrieve the complete organizational hierarchy with member details and current project assignments.

**Access Control:** CEO only

**Request:**
```
GET /api/dashboard/team-org/structure?expand=children,projects
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `expand` (optional): Comma-separated fields to include relationships
  - `children`: Include nested org chart structure
  - `projects`: Include project assignment details
  - Default: `children` (include all children in tree)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "org_chart": [
      {
        "id": "user_001",
        "name": "CEO Name",
        "email": "ceo@example.com",
        "role": "ceo",
        "status": "active",
        "current_project": null,
        "capability_score": 88,
        "reliability": 95,
        "join_date": "2024-01-01T00:00:00Z",
        "children": [
          {
            "id": "user_002",
            "name": "Ops Lead",
            "email": "ops@example.com",
            "role": "ops_core",
            "status": "active",
            "current_project": "discord-bot-p1",
            "capability_score": 86,
            "reliability": 93,
            "children": [
              {
                "id": "user_003",
                "name": "Web Developer #1",
                "email": "web1@example.com",
                "role": "team_member",
                "status": "active",
                "current_project": "discord-bot-p1",
                "capability_score": 82,
                "reliability": 90,
                "children": []
              }
            ]
          }
        ]
      }
    ],
    "members": [
      {
        "id": "user_001",
        "name": "CEO Name",
        "email": "ceo@example.com",
        "role": "ceo",
        "status": "active",
        "current_project": null,
        "capability_score": 88,
        "reliability": 95
      }
    ],
    "projects": [
      {
        "id": "proj_001",
        "name": "Discord Bot P1",
        "status": "completed",
        "team_lead_id": "user_002",
        "member_count": 3
      }
    ],
    "metadata": {
      "total_members": 15,
      "active_members": 14,
      "on_leave": 1,
      "total_projects": 4,
      "updated_at": "2026-05-26T10:00:00Z",
      "cache_control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "JWT token invalid or expired"
  }
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Only CEO can access team-org/structure endpoint"
  }
}
```

**Implementation (Next.js API Route):**
```typescript
// pages/api/dashboard/team-org/structure.ts
import { NextRequest, NextResponse } from "next/server";
import { validateAuth, checkAccess } from "@/lib/dashboard/auth";
import { fetchOrgChart } from "@/lib/dashboard/queries";

export async function GET(req: NextRequest) {
  // 1. Validate JWT token
  const user = await validateAuth(req);
  if (!user) return NextResponse.json({success: false, error: {code: "AUTH_FAILED"}}, {status: 401});

  // 2. Check role-based access
  const hasAccess = await checkAccess(user.id, "team-org/structure");
  if (!hasAccess) return NextResponse.json({success: false, error: {code: "ACCESS_DENIED"}}, {status: 403});

  try {
    // 3. Query org chart from Supabase
    const orgChart = await fetchOrgChart(user.id);
    
    // 4. Cache response
    const response = NextResponse.json({
      success: true,
      data: {
        org_chart: orgChart,
        metadata: {
          updated_at: new Date().toISOString(),
          cache_control: "public, max-age=3600, stale-while-revalidate=86400"
        }
      }
    });
    
    response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return response;
  } catch (error) {
    return NextResponse.json({success: false, error: {code: "SERVER_ERROR", message: error.message}}, {status: 500});
  }
}
```

**Supabase Query (lib/dashboard/queries.ts):**
```sql
-- Fetch org chart with recursive CTE
WITH RECURSIVE org_hierarchy AS (
  -- Base case: CEO (root node)
  SELECT 
    tm.id, tm.name, tm.email, tm.role, tm.status,
    tm.current_project_id, cs.overall_score as capability_score,
    cs.reliability, tm.join_date, NULL::uuid as parent_id, 0 as depth
  FROM team_members tm
  LEFT JOIN capability_scores cs ON tm.id = cs.member_id
  WHERE tm.role = 'ceo'
  
  UNION ALL
  
  -- Recursive case: all members reporting to org_hierarchy nodes
  SELECT 
    tm.id, tm.name, tm.email, tm.role, tm.status,
    tm.current_project_id, cs.overall_score,
    cs.reliability, tm.join_date, tm.reports_to_id, oh.depth + 1
  FROM team_members tm
  LEFT JOIN capability_scores cs ON tm.id = cs.member_id
  JOIN org_hierarchy oh ON tm.reports_to_id = oh.id
  WHERE oh.depth < 3 -- Limit recursion depth
)
SELECT * FROM org_hierarchy ORDER BY depth, id;
```

**Cache Invalidation Triggers:**
- Team member creation/update/deletion
- Project assignment changes
- Supabase trigger: `UPDATE team_members → revalidate_org_chart()`

---

## Endpoint 2: Capability Matrix

### GET `/api/dashboard/team-capabilities/matrix`

**Purpose:** Retrieve capability scores for all team members across 5 dimensions (technical, tasks, comms, learning, reliability).

**Access Control:** CEO, Ops Core (filtered view)

**Request:**
```
GET /api/dashboard/team-capabilities/matrix?period=30d&dimension=all
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `period` (optional): Time period for trend calculation
  - `7d`, `30d`, `90d`, default: `30d`
- `dimension` (optional): Filter to specific dimension
  - `technical`, `tasks`, `comms`, `learning`, `reliability`, `all`
  - Default: `all` (all dimensions)
- `sort_by` (optional): Sort column
  - `name`, `technical`, `tasks`, `comms`, `learning`, `reliability`
  - Default: `name`
- `sort_dir` (optional): Sort direction
  - `asc`, `desc`, default: `asc`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "user_001",
        "name": "Agent Name",
        "email": "agent@example.com",
        "role": "ops_core",
        "current_project": "discord-bot-p1",
        "capabilities": {
          "technical": 92,
          "tasks": 88,
          "comms": 85,
          "learning": 90,
          "reliability": 95
        },
        "overall_score": 90,
        "trends": {
          "technical": {
            "trend": "up",
            "change": "+2.5",
            "period": "7d"
          },
          "tasks": {
            "trend": "stable",
            "change": "+0.1",
            "period": "7d"
          }
        },
        "improvements": [
          {
            "id": "action_001",
            "dimension": "comms",
            "title": "Improve documentation clarity",
            "progress": 65,
            "status": "in_progress"
          }
        ]
      }
    ],
    "statistics": {
      "team_average": 87.3,
      "dimension_averages": {
        "technical": 88.5,
        "tasks": 89.2,
        "comms": 84.7,
        "learning": 88.1,
        "reliability": 92.3
      },
      "high_performers": ["user_001", "user_003"],
      "development_focus": ["comms", "learning"]
    },
    "metadata": {
      "total_members": 15,
      "period": "30d",
      "updated_at": "2026-05-26T10:00:00Z",
      "cache_control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  }
}
```

**SQL Query:**
```sql
SELECT 
  tm.id, tm.name, tm.email, tm.role, tm.current_project_id,
  cs.technical, cs.tasks, cs.comms, cs.learning, cs.reliability,
  ROUND((cs.technical + cs.tasks + cs.comms + cs.learning + cs.reliability) / 5, 1) as overall_score,
  -- 7-day trend calculation
  (
    SELECT (cs_current.technical - COALESCE(cs_prev.technical, cs_current.technical)) as trend
    FROM capability_scores cs_prev
    WHERE cs_prev.member_id = tm.id 
    AND cs_prev.recorded_date = CURRENT_DATE - INTERVAL '7 days'
  ) as technical_7d_trend
FROM team_members tm
LEFT JOIN capability_scores cs ON tm.id = cs.member_id 
  AND cs.recorded_date = CURRENT_DATE
ORDER BY tm.name;
```

---

## Endpoint 3: Improvement Actions

### GET `/api/dashboard/team-capabilities/improvement-actions`

**Purpose:** List all improvement actions with status and progress tracking.

**Access Control:** CEO, Project Leads

**Request:**
```
GET /api/dashboard/team-capabilities/improvement-actions?filter=pending&owner_id=user_001
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `filter` (optional): Status filter
  - `pending`, `in_progress`, `completed`, default: all statuses
- `owner_id` (optional): Filter by owner (for team leads: auto-filtered to team members)
- `dimension` (optional): Filter by capability dimension
- `limit` (optional): Results per page, default: 20
- `offset` (optional): Pagination offset, default: 0

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": "action_001",
        "owner_id": "user_002",
        "owner_name": "Agent Name",
        "dimension": "technical",
        "title": "Master Kubernetes deployment patterns",
        "description": "Complete 3 production K8s deployments and document patterns",
        "current_score": 75,
        "target_score": 88,
        "progress": 60,
        "status": "in_progress",
        "due_date": "2026-06-15T23:59:59Z",
        "created_date": "2026-05-20T10:00:00Z",
        "last_updated": "2026-05-26T08:30:00Z",
        "notes": [
          "2026-05-26: Completed 2 of 3 deployments",
          "2026-05-24: Started documentation",
          "2026-05-20: Action created"
        ],
        "reviewer_id": "user_001",
        "reviewer_name": "CEO"
      }
    ],
    "statistics": {
      "total": 28,
      "pending": 8,
      "in_progress": 12,
      "completed": 8,
      "overdue": 2,
      "completion_rate": 0.57
    },
    "metadata": {
      "updated_at": "2026-05-26T10:00:00Z",
      "cache_control": "public, max-age=1800, stale-while-revalidate=3600"
    }
  }
}
```

### POST `/api/dashboard/team-capabilities/improvement-actions/:id`

**Purpose:** Update improvement action progress and status.

**Access Control:** CEO, Reviewer, Action Owner

**Request:**
```
POST /api/dashboard/team-capabilities/improvement-actions/action_001
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "progress": 75,
  "status": "in_progress",
  "notes": "Completed deployment #3, documenting patterns",
  "updated_by": "user_001"
}
```

**Request Body:**
```typescript
interface UpdateActionRequest {
  progress?: number; // 0-100
  status?: "pending" | "in_progress" | "completed";
  notes?: string; // Append to notes array
  updated_by: string; // User ID making the update
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "action": {
      "id": "action_001",
      "progress": 75,
      "status": "in_progress",
      "last_updated": "2026-05-26T14:30:00Z",
      "notes": [
        "2026-05-26 14:30: Completed deployment #3, documenting patterns",
        "2026-05-26: Completed 2 of 3 deployments",
        "2026-05-24: Started documentation"
      ]
    },
    "revalidate": true
  }
}
```

**Implementation:**
```typescript
// pages/api/dashboard/team-capabilities/improvement-actions/[id].ts
export async function POST(req: NextRequest, {params}: {params: {id: string}}) {
  const user = await validateAuth(req);
  const body = await req.json();
  
  // Update improvement_actions row
  const { error } = await supabase
    .from("improvement_actions")
    .update({
      progress: body.progress,
      status: body.status,
      last_updated: new Date().toISOString(),
      updated_by: user.id
    })
    .eq("id", params.id);
  
  // Append note to notes JSONB array
  if (body.notes) {
    const timestamp = new Date().toISOString().split('T')[0];
    const noteText = `${timestamp}: ${body.notes}`;
    await supabase.rpc('append_note', {
      action_id: params.id,
      note: noteText
    });
  }
  
  // Revalidate dashboard cache
  revalidatePath("/dashboard/team-capabilities");
  
  return NextResponse.json({success: true, revalidate: true});
}
```

---

## Endpoint 4: Team KPI Summary

### GET `/api/dashboard/team-kpis/summary`

**Purpose:** Retrieve high-level team health metrics and KPI overview.

**Access Control:** CEO, Ops Core

**Request:**
```
GET /api/dashboard/team-kpis/summary?compare_period=7d
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `compare_period` (optional): Period for trend comparison
  - `7d`, `30d`, `90d`, default: `7d`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "health": {
      "overall_capability": {
        "current": 87.3,
        "target": 85,
        "trend": "up",
        "change": "+1.8",
        "compare_period": "7d",
        "status": "above_target"
      },
      "team_utilization": {
        "current": 87,
        "target": 90,
        "trend": "down",
        "change": "-3",
        "compare_period": "7d",
        "status": "below_target"
      },
      "task_completion": {
        "current": 94,
        "target": 95,
        "trend": "stable",
        "change": "+1",
        "compare_period": "7d",
        "status": "on_track"
      },
      "team_reliability": {
        "current": 95.2,
        "target": 95,
        "trend": "up",
        "change": "+0.5",
        "compare_period": "7d",
        "status": "above_target"
      }
    },
    "dimension_scores": {
      "technical": {current: 88.5, target: 87, trend: "up"},
      "tasks": {current: 89.2, target: 90, trend: "down"},
      "comms": {current: 84.7, target: 85, trend: "stable"},
      "learning": {current: 88.1, target: 88, trend: "up"},
      "reliability": {current: 92.3, target: 92, trend: "stable"}
    },
    "improvement_actions_status": {
      "pending": 8,
      "in_progress": 12,
      "completed": 8,
      "completion_rate": 0.57
    },
    "metadata": {
      "calculated_at": "2026-05-26T10:00:00Z",
      "cache_control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  }
}
```

---

## Endpoint 5: Team KPI Trends

### GET `/api/dashboard/team-kpis/trends`

**Purpose:** Retrieve 30-day trend data for capability dimensions and team metrics.

**Access Control:** CEO, Ops Core

**Request:**
```
GET /api/dashboard/team-kpis/trends?dimension=technical&period=30d
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `dimension` (optional): Specific dimension or `all`
  - `technical`, `tasks`, `comms`, `learning`, `reliability`, `all`
  - Default: `all`
- `period` (optional): Trend period
  - `7d`, `30d`, `90d`, default: `30d`
- `granularity` (optional): Data point frequency
  - `daily`, `weekly`, default: `daily`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "dimension": "technical",
        "points": [
          {
            "date": "2026-04-26",
            "avg_score": 85.2,
            "min_score": 75,
            "max_score": 95,
            "member_count": 15
          },
          {
            "date": "2026-04-27",
            "avg_score": 85.5,
            "min_score": 76,
            "max_score": 95,
            "member_count": 15
          }
        ],
        "summary": {
          "start_avg": 85.2,
          "end_avg": 88.5,
          "trend": "up",
          "change_pct": 3.9,
          "target_line": 87
        }
      }
    ],
    "period": "30d",
    "metadata": {
      "from_date": "2026-04-26",
      "to_date": "2026-05-26",
      "data_points": 31,
      "updated_at": "2026-05-26T10:00:00Z"
    }
  }
}
```

**SQL Query for Trends:**
```sql
SELECT 
  DATE(recorded_date) as date,
  ROUND(AVG(technical), 1) as avg_technical,
  ROUND(AVG(tasks), 1) as avg_tasks,
  ROUND(AVG(comms), 1) as avg_comms,
  ROUND(AVG(learning), 1) as avg_learning,
  ROUND(AVG(reliability), 1) as avg_reliability,
  MIN(technical) as min_technical,
  MAX(technical) as max_technical,
  COUNT(DISTINCT member_id) as member_count
FROM capability_scores
WHERE recorded_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE
GROUP BY DATE(recorded_date)
ORDER BY date;
```

---

## Real-time Subscriptions

### Supabase Real-time: Improvement Actions

```typescript
// lib/dashboard/subscriptions.ts
export function subscribeToImprovementActions(
  userId: string,
  callback: (action: ImprovementAction) => void
) {
  const subscription = supabase
    .channel('improvement_actions_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'improvement_actions',
        filter: `owner_id=eq.${userId}` // Only user's own actions
      },
      (payload) => {
        callback(payload.new as ImprovementAction);
      }
    )
    .subscribe();
  
  return () => subscription.unsubscribe();
}
```

**Use Case:** Real-time status updates when improvement action is marked complete by reviewer.

---

## Error Handling

### Common Error Codes

| Code | Status | Message | Resolution |
|------|--------|---------|-----------|
| `AUTH_FAILED` | 401 | JWT token invalid or expired | Refresh token and retry |
| `ACCESS_DENIED` | 403 | User role insufficient | Use correct user account |
| `NOT_FOUND` | 404 | Resource not found | Check resource ID |
| `VALIDATION_ERROR` | 400 | Request body validation failed | Check query parameters |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry after 60 seconds |
| `SERVER_ERROR` | 500 | Internal server error | Contact support |

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "JWT token expired",
    "request_id": "req_abc123def456"
  }
}
```

---

## Caching Strategy

**Cache Headers:**
- Org chart: `public, max-age=3600, stale-while-revalidate=86400`
- Capability matrix: `public, max-age=3600, stale-while-revalidate=86400`
- Improvement actions: `public, max-age=1800, stale-while-revalidate=3600`
- KPI summary: `public, max-age=3600, stale-while-revalidate=86400`
- Trends: `public, max-age=3600, stale-while-revalidate=86400`

**Revalidation Triggers:**
1. Manual: User clicks "Refresh" button
2. Scheduled: Vercel cron job every 60 minutes (on the hour)
3. Event-based: Supabase trigger on INSERT/UPDATE to team_members, capability_scores, improvement_actions

**Implementation (Next.js 14):**
```typescript
import { revalidatePath } from "next/cache";

export async function revalidateTeamDashboard() {
  revalidatePath("/dashboard/team-org");
  revalidatePath("/dashboard/team-capabilities");
  revalidatePath("/dashboard/team-kpis");
}
```

---

## Rate Limiting & Throttling

**Client-side throttling:**
```typescript
// lib/dashboard/api-client.ts
const throttledFetch = throttle(async (endpoint: string, options: FetchOptions) => {
  const response = await fetch(`/api/dashboard${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    },
    ...options
  });
  return response.json();
}, 5000); // Max 1 request per 5 seconds per endpoint
```

**Server-side rate limiting (Future):**
```typescript
// Use Vercel KV for rate limiting
import { kv } from "@vercel/kv";

async function rateLimit(userId: string, endpoint: string): Promise<boolean> {
  const key = `ratelimit:${userId}:${endpoint}`;
  const current = await kv.incr(key);
  
  if (current === 1) {
    await kv.expire(key, 60); // Reset every 60 seconds
  }
  
  return current <= 100; // 100 requests per minute
}
```

---

## Testing Guide

### Unit Tests (Jest + Supertest)
```typescript
describe("GET /api/dashboard/team-org/structure", () => {
  it("returns org chart for authorized CEO", async () => {
    const response = await request(app)
      .get("/api/dashboard/team-org/structure")
      .set("Authorization", `Bearer ${ceoToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.org_chart).toBeDefined();
    expect(response.body.data.org_chart[0].children).toBeDefined();
  });
  
  it("returns 403 for non-CEO users", async () => {
    const response = await request(app)
      .get("/api/dashboard/team-org/structure")
      .set("Authorization", `Bearer ${teamMemberToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

### Integration Tests (Playwright)
```typescript
test("Load org chart and verify all members visible", async ({page}) => {
  await page.goto("/dashboard/team-org");
  const members = await page.locator("[data-testid='team-member']");
  expect(await members.count()).toBe(15);
});

test("Update improvement action and verify real-time update", async ({page}) => {
  await page.goto("/dashboard/team-capabilities");
  const actionCard = page.locator("[data-action-id='action_001']");
  await actionCard.locator("[data-action='edit']").click();
  await page.locator("input[name='progress']").fill("80");
  await page.locator("button:has-text('Save')").click();
  
  // Verify update reflected
  await expect(actionCard.locator(".progress-bar")).toContainText("80%");
});
```

---

## API Versioning

**Current Version:** v1  
**Endpoint Pattern:** `/api/dashboard/{resource}/{action}`

**Future Versioning:**
- v2 will introduce breaking changes: `/api/v2/dashboard/...`
- v1 will remain supported for 6 months after v2 release
- Deprecation headers: `Deprecation: true`, `Sunset: Sun, 31 Dec 2026 23:59:59 GMT`

---

## Documentation & Support

- **Swagger/OpenAPI:** `/api/docs/dashboard` (auto-generated from TypeScript)
- **Postman Collection:** Available in GitHub releases
- **Support:** issues@dsc-fms-portal.dev
- **Status Page:** https://status.dsc-fms-portal.vercel.app

---

**Last Updated:** 2026-05-26 18:45 KST  
**Next:** TEAM_DASHBOARD_DB_SCHEMA.sql (in progress)  
**Approval Required:** CEO sign-off on API contract
