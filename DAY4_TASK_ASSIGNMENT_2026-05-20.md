# Day 4 Task Assignment — Web-Dev-Support (신규팀원)
**2026-05-20 14:00 KST**

> **Prepared for:** New Web Development Support Team Member  
> **Sprint Goal:** Asset Master Phase 2 MVP (8-10 APIs by 2026-05-22 17:00)  
> **Today's Target:** Group 1 GET endpoints (3 APIs, ~3.5 hours)

---

## 📋 Today's Task: GET Endpoints (Group 1)

You will implement **3 fundamental GET endpoints** that provide the foundation for the Asset Master system. These are prerequisite for all other features.

### Task List

| # | API Endpoint | Complexity | Est. Time | Dependencies | Notes |
|---|---|---|---|---|---|
| **3** | `GET /api/assets/categories` | Low | 1h | None | Returns distinct categories from assets table |
| **4** | `GET /api/assets/:id/audit-log` | Low | 1–1.5h | Asset exists | Audit trail of all changes to an asset |
| **5** | `GET /api/assets/locations` | Low | 1h | None | Returns distinct locations from assets table |

**Total Estimated Time:** ~3.5 hours  
**Recommended Work Window:** 14:00 → 17:30 (with 30-min buffer)

---

## 🔧 Technical Details

### API #3: GET /api/assets/categories

**Endpoint:** `GET /api/assets/categories`

**Purpose:** Retrieve list of all asset categories currently in use

**Query Parameters:** None

**Response Format:**
```json
{
  "data": [
    {
      "category_code": "01",
      "category_name": "Machinery",
      "count": 156
    },
    {
      "category_code": "02", 
      "category_name": "Equipment",
      "count": 89
    }
  ],
  "total": 2
}
```

**Implementation Notes:**
- Extract unique `category` values from `assets` table (not a separate table)
- Count items per category
- Sort alphabetically by category_code

**File Path:** `app/api/assets/categories/route.ts`

---

### API #4: GET /api/assets/:id/audit-log

**Endpoint:** `GET /api/assets/:id/audit-log`

**Purpose:** Retrieve change history for a specific asset

**Path Parameters:**
- `id` (UUID) — Asset ID

**Query Parameters:**
- `limit` (optional, default 50) — Number of records to return
- `offset` (optional, default 0) — Pagination offset

**Response Format:**
```json
{
  "data": [
    {
      "id": "uuid",
      "asset_id": "uuid",
      "operation": "UPDATE",
      "field_name": "status",
      "old_value": "active",
      "new_value": "idle",
      "changed_by": "user@dsc.com",
      "changed_at": "2026-05-20T10:30:00Z"
    }
  ],
  "total": 42
}
```

**Implementation Notes:**
- Query `asset_audit` table (created by DB migration)
- Filter by `asset_id`
- Sort by `changed_at` DESC (newest first)
- Return 404 if asset doesn't exist

**File Path:** `app/api/assets/[assetId]/audit-log/route.ts`

---

### API #5: GET /api/assets/locations

**Endpoint:** `GET /api/assets/locations`

**Purpose:** Retrieve list of all asset locations currently in use

**Query Parameters:** None

**Response Format:**
```json
{
  "data": [
    {
      "location_code": "SHOP",
      "location_name": "Shop Floor",
      "count": 234
    },
    {
      "location_code": "STORE",
      "location_name": "Storage Room",
      "count": 78
    }
  ],
  "total": 2
}
```

**Implementation Notes:**
- Extract unique `location` values from `assets` table
- Count items per location
- Sort alphabetically by location_code

**File Path:** `app/api/assets/locations/route.ts`

---

## 🚀 Getting Started

### Step 1: Pull Latest Code
```bash
cd /home/jeepney/.openclaw/workspace-dev/dsc-fms-portal
git checkout feature/asset-phase2-api
git pull origin feature/asset-phase2-api
```

### Step 2: Create Branch for Day 4 Work
```bash
git checkout -b feature/asset-phase2-day4-group1
```

### Step 3: Reference Implementations

**Look at existing API patterns:**
- `app/api/assets/route.ts` — GET list example (already exists)
- `app/api/auth/route.ts` — Basic error handling patterns

**Supabase Client Setup:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Step 4: Testing Each API

After implementing each endpoint:

1. **Local Testing**
   ```bash
   npm run dev
   curl http://localhost:3000/api/assets/categories
   ```

2. **Post in Discord #engineering** with results:
   - API endpoint tested
   - Sample response
   - Any issues encountered

---

## ✅ Acceptance Criteria

For each API to be considered complete:

- [ ] Endpoint created at correct file path
- [ ] Handles GET method
- [ ] Returns correct JSON response structure
- [ ] Includes error handling (400, 404, 500)
- [ ] Tested with curl/Postman
- [ ] Code follows existing style in codebase
- [ ] No TypeScript errors
- [ ] Checked into feature branch

---

## 📞 Support & Questions

**Web Developer (Mentor):** Available for:
- Architecture questions
- TypeScript/Next.js help
- Supabase query assistance
- Code review before PR

**Time-boxed Help:** 15 min per issue (escalate complex blockers to web developer)

---

## 🎯 Next Checkpoint: 17:30 KST

**Report Status At 15:00 (Mid-day check):**
- How many APIs started/completed
- Any blockers encountered
- Time spent vs. estimate

**Final Report At 17:30:**
- All 3 APIs implemented and tested
- PR created (or push to feature branch)
- Ready for web developer integration

---

## 📌 Daily Progress Template

When you report at 15:00 and 17:30, use this format:

```
📊 Day 4 Progress Report
🟢 Completed: API #[X] (Y minutes)
🟡 In Progress: API #[X] (Z% done)
🔴 Blocked: [if any]
💡 Next: [what's coming next]
```

---

**Prepared by:** Autonomous Task Assignment System  
**Status:** 🟢 Ready for Execution  
**Start Time:** 2026-05-20 14:00 KST
