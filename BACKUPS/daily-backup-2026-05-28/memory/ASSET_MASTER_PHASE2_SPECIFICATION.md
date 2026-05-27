---
name: Asset Master Phase 2 API Specification
description: 16 MVP APIs + DB schema + validation rules + Data-Analyst #5 first assignment (created 2026-05-26 13:30)
type: project
date: 2026-05-26
originSessionId: current
---

# Asset Master Phase 2 Specification (Memory Reference)

**Full Document:** `/home/jeepney/.openclaw/workspace-dev/ASSET_MASTER_PHASE2_API_SPECIFICATION.md`

**Status:** ✅ READY FOR DESIGN REVIEW (2026-05-26 14:00 KST)

## 📋 Contents

### 1. Database Schema (4 tables)
- `assets` (506 records) — core asset data with status tracking
- `categories` (12) — grouping by asset type
- `subcategories` (35) — fine-grained categorization
- `asset_history` — audit trail for all changes

### 2. 16 MVP APIs (Organized in 4 Tiers)
**Tier 1 (Retrieval):**
- GET /api/assets
- GET /api/assets/{id}
- GET /api/assets/categories
- GET /api/assets/subcategories

**Tier 2 (Search & Analytics):**
- POST /api/assets/search
- POST /api/assets/bulk-status
- POST /api/assets/analytics
- POST /api/assets/export

**Tier 3 (CRUD):**
- POST /api/assets
- PUT /api/assets/{id}
- DELETE /api/assets/{id}
- POST /api/assets/{id}/history
- GET /api/assets/{id}/history

**Tier 4 (Monitoring):**
- GET /api/assets/health
- GET /api/assets/stats
- POST /api/assets/audit-log

### 3. Validation Rules & Error Handling
- Standard error response format
- 9 error code categories (400, 401, 403, 404, 409, 429, 500)
- Field-level validation (asset_code unique, status enum, etc.)

### 4. Performance Targets
- p50 response: <150ms
- p99 response: <500ms
- Search (FTS): <200ms
- Bulk operations: <2s
- Uptime: 99.5%

### 5. Data-Analyst #5 First Assignment
**Task:** Asset Distribution & Maintenance Analysis
**Deliverables:**
1. Asset Distribution Report (category/status/age breakdown)
2. Maintenance Analysis Dashboard (pivot table)
3. Asset Value Trend Analysis (3 charts)
4. SQL Query Portfolio (5 reusable queries)

**Timeline:** Day 2-3 (5/27-5/28)
**Success Criteria:** ≥85% accuracy, ≥90% completeness

---

## 📌 Key References

- **Design Review Briefing:** `/home/jeepney/.openclaw/workspace-dev/DESIGN_REVIEW_BRIEFING_2026_05_26.md` (2026-05-26 14:00 KST)
- **Phase A Activation:** `/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/PHASE_A_ACTIVATION_2026_05_26.md`
- **Data-Analyst Onboarding:** `/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/ONBOARDING_EXPANDED_8MEMBERS_2026_05_26.md`

---

**Created:** 2026-05-26 13:30 KST  
**Status:** FINAL ✅  
**Next Milestone:** Design Review (14:00), Day 2 SQL setup (27th 09:00)
