---
name: Asset Master Phase 3-6 Sprint Implementation Plan
description: Detailed 5-day sprint plan for Phase 3-6 (2026-06-10 to 2026-06-15) — ready to execute
type: project
---

# Asset Master Phase 3-6 Sprint Plan (2026-06-10 to 2026-06-15)

**Status:** ✅ Design complete, ready for web-builder execution  
**Deadline:** 2026-06-15 (5 days, 21 hours remaining)  
**Generated:** 2026-06-10 02:56 KST  
**Current Cycle:** 1067+

---

## 📋 Executive Summary

**Scope:** 3 pages + 2 database migrations + 1 test suite  
**Estimated Effort:** 40-48 hours (5 days × 8-10 hours/day)  
**Risk Level:** MEDIUM (tight deadline, complex UI interactions)  
**Blocker Status:** None (design complete, ready to code)

---

## 🎯 Phase Breakdown

### Phase 3-1: Detail Page (Viewing)
**Status:** PENDING  
**Duration:** 1.5 days (Day 1-2 morning)  
**Acceptance Criteria:** User can view asset details with full read-only info

**Subtasks:**
```
☐ T3.1.1: Create /assets/[id]/detail route (App Router)
   - Component: AssetDetailPage
   - Layout: Asset info grid (name, type, location, serial, status)
   - Related data: Portfolio association, maintenance history
   - Time: 4 hours
   - Dependencies: db/29 schema applied

☐ T3.1.2: Implement detail data loader (API call)
   - Endpoint: GET /api/assets/[id]
   - Fields: All asset attributes + portfolio cross-ref
   - Error handling: 404, permissions
   - Time: 3 hours

☐ T3.1.3: Build asset history timeline
   - Component: MaintenanceTimeline
   - Data: Last 10 events (acquisition, service, transfer)
   - Format: Chronological, with status badges
   - Time: 3 hours

☐ T3.1.4: Test detail page with real data
   - Manual QA: 5+ assets tested
   - Edge cases: Missing fields, long histories
   - Performance: <2s load time
   - Time: 2 hours
```

**Deliverables:**
- AssetDetailPage.tsx (180 lines)
- useAssetDetail hook (60 lines)
- MaintenanceTimeline component (120 lines)
- Tests: detail.spec.ts (80 lines)

---

### Phase 3-2: Edit Page (Modification)
**Status:** PENDING  
**Duration:** 2 days (Day 2-3)  
**Acceptance Criteria:** User can modify asset fields and save to database

**Subtasks:**
```
☐ T3.2.1: Create /assets/[id]/edit route
   - Component: AssetEditPage
   - Form: React Hook Form + Zod validation
   - Fields: Name, type, location, serial, status (auto-generated fields locked)
   - Time: 4 hours
   - Dependencies: db/29 schema applied

☐ T3.2.2: Build edit form with validation
   - Validation rules: Name (required, 3-50 chars), Serial (unique check)
   - Status field: Dropdown (Active, Inactive, Decommissioned, In-Repair)
   - Error display: Field-level validation messages
   - Time: 5 hours

☐ T3.2.3: Implement save operation (PUT /api/assets/[id])
   - RLS policy: User can only edit own portfolio assets
   - Optimistic update: Client-side form update before API confirmation
   - Rollback: If API fails, restore previous values
   - Time: 4 hours

☐ T3.2.4: Add edit history tracking
   - Track: changed_by, changed_at, previous_value
   - New table: asset_edit_history
   - Display: In timeline (separate from maintenance events)
   - Time: 3 hours

☐ T3.2.5: Test edit functionality
   - QA: 10+ asset edits with various validation cases
   - Edge cases: Concurrent edits, network failure recovery
   - Performance: <1.5s save time
   - Time: 2 hours
```

**Deliverables:**
- AssetEditPage.tsx (220 lines)
- useAssetForm hook (140 lines)
- ValidationSchema.ts (60 lines)
- Tests: edit.spec.ts (100 lines)

---

### Phase 3-3: Dispose Page (Decommission)
**Status:** PENDING  
**Duration:** 1.5 days (Day 4 morning)  
**Acceptance Criteria:** User can decommission assets with proper workflow

**Subtasks:**
```
☐ T3.3.1: Create /assets/[id]/dispose route
   - Component: AssetDisposePage
   - Workflow: Confirmation → Reason selection → Final confirmation
   - Status change: Active → Decommissioned
   - Time: 3 hours

☐ T3.3.2: Build disposal form with workflow
   - Reason dropdown: Replace, End-of-Life, Scrap, Transfer
   - Document upload: Optional disposal certificate
   - Date field: Disposal date (default today)
   - Time: 3 hours

☐ T3.3.3: Implement disposal logic
   - API: PUT /api/assets/[id]/dispose
   - Trigger: Create asset_disposal record, update asset.status
   - Audit: Log who disposed, when, reason
   - Restrictions: Prevent re-edit of disposed assets
   - Time: 3 hours

☐ T3.3.4: Test disposal workflow
   - QA: Complete disposal cycle (5+ assets)
   - Edge cases: Undo check (should not allow), data integrity
   - Audit trail: Verify correct logging
   - Time: 2 hours
```

**Deliverables:**
- AssetDisposePage.tsx (160 lines)
- useAssetDisposal hook (80 lines)
- Tests: dispose.spec.ts (70 lines)

---

## 🗄️ Database Migrations

### Migration 1: Asset Extension Schema (db/29)
**Status:** REQUIRED (critical blocker)  
**Time to Apply:** <5 minutes

**Script:**
```sql
-- T3.M1: Add edit history and disposal tracking
ALTER TABLE assets ADD COLUMN IF NOT EXISTS
  edit_history JSONB DEFAULT '[]'::jsonb,
  last_edited_by UUID,
  last_edited_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS asset_edit_history (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_field VARCHAR NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_disposals (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  disposed_by UUID NOT NULL REFERENCES auth.users(id),
  disposal_reason VARCHAR NOT NULL,
  disposal_date DATE NOT NULL,
  disposal_certificate_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE asset_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view edit history for their own portfolio assets
CREATE POLICY asset_edit_history_select ON asset_edit_history
  FOR SELECT USING (
    asset_id IN (
      SELECT a.id FROM assets a
      WHERE a.portfolio_id IN (
        SELECT p.id FROM portfolios p WHERE p.owner_id = auth.uid()
      )
    )
  );

-- Policy: Users can view disposal records for their assets
CREATE POLICY asset_disposals_select ON asset_disposals
  FOR SELECT USING (
    asset_id IN (
      SELECT a.id FROM assets a
      WHERE a.portfolio_id IN (
        SELECT p.id FROM portfolios p WHERE p.owner_id = auth.uid()
      )
    )
  );
```

**Execution:** Run in Supabase SQL Editor before Phase 3-2 starts

---

### Migration 2: Indexes for Performance
**Status:** RECOMMENDED  
**Time to Apply:** <2 minutes

**Script:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_asset_edit_history_asset_id ON asset_edit_history(asset_id);
CREATE INDEX idx_asset_edit_history_changed_at ON asset_edit_history(changed_at DESC);
CREATE INDEX idx_asset_disposals_asset_id ON asset_disposals(asset_id);
CREATE INDEX idx_asset_disposals_disposed_by ON asset_disposals(disposed_by);
```

---

## 📅 5-Day Sprint Schedule

| Day | Date | Phase | Deliverable | Owner |
|-----|------|-------|-------------|-------|
| **1** | 2026-06-10 | Setup + Detail | T3.1 complete | web-builder |
| **2** | 2026-06-11 | Edit (Part 1) | T3.2.1-3 complete | web-builder |
| **3** | 2026-06-12 | Edit (Part 2) + Dispose | T3.2.4-5 + T3.3.1-2 | web-builder |
| **4** | 2026-06-13 | Testing + DB Migrations | T3.3.3-4 complete | web-builder + QA |
| **5** | 2026-06-14 | Integration + Deployment | Full testing + staging deploy | web-builder |
| **Deadline** | 2026-06-15 | Production | Vercel production deploy | DevOps |

---

## ⚠️ Risk Mitigation

**Risk 1: Tight Timeline (5 days)**
- Mitigation: Prioritize detail page (simplest) first, parallelize where possible
- Contingency: Defer edit history tracking if time runs short

**Risk 2: RLS Policy Complexity**
- Mitigation: Test RLS thoroughly in staging with sample users
- Contingency: Use admin bypass for testing, lock down before production

**Risk 3: Concurrent Edit Conflicts**
- Mitigation: Implement optimistic locking (version field on assets table)
- Contingency: Simple last-write-wins if version mismatch

**Risk 4: Database Migration Timing**
- Mitigation: Apply db/29 migrations immediately after this plan
- Contingency: Pre-apply migrations to staging for testing

---

## ✅ Pre-Execution Checklist

Before starting Phase 3-1 on 2026-06-10:

- [ ] db/29 migrations applied to Supabase (asset_edit_history, asset_disposals tables)
- [ ] Team Dashboard P1 db/36 migration complete (portfolio view + milestones table)
- [ ] Staging environment initialized with Phase 2 data
- [ ] Web-builder has access to Supabase SQL editor
- [ ] Next.js 14 App Router properly configured for dynamic routes
- [ ] TypeScript types updated for asset schema changes
- [ ] Testing environment set up (Vitest + React Testing Library)

---

## 📊 Success Metrics

**Definition of Done (for Phase 3-6):**
- ✅ All 3 pages deployed to production (detail, edit, dispose)
- ✅ 100% RLS policy test coverage
- ✅ <2s page load time for detail (Core Web Vitals)
- ✅ Zero production errors in error tracking (Vercel errors)
- ✅ All P1 projects still at 100% (no regression)

---

## 📞 Support & Escalation

**Blockers during execution:**
- Contact: @user (CEO) for Supabase SQL access issues
- Contact: Data Analyst for schema clarification
- Contact: DevOps for deployment/production issues

**Status updates:** Required every 24 hours on progress

---

**Generated:** 2026-06-10 02:56 KST by Rule Enforcement Checkpoint  
**Next Review:** 2026-06-15 (deadline)  
**Status:** ✅ Ready to hand off to web-builder for execution
