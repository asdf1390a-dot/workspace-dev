---
name: CTB Data Integrity Finding (2026-06-06)
description: Critical bug in CTB polling: conflated LOCAL completion with VERCEL deployment status
type: project
---

## 🔴 Critical Bug Identified & Corrected (2026-06-06 23:12 KST)

**Status:** FIXED in Polling Cycle 619

### The Problem
Previous CTB polling cycles recorded `completion: 100%` for all 4 projects, creating false impression of full production readiness. In reality, these percentages referred to **local code completion**, not **Vercel deployment**.

**Why:** No distinction between development completeness and production deployment in CTB schema.

### The Reality (Actual State as of 2026-06-06 23:12 KST)

| Project | Local | Vercel | Files | LOC | Status |
|---------|-------|--------|-------|-----|--------|
| AUDIT-P1 | 100% | 0% | 2 | 289 | ✅ Code complete, ❌ Not deployed |
| DISCORD-BOT-P1 | 100% | 0% | 5 | 908 | ✅ Code complete, ❌ Not deployed |
| BM-P1 | 100% | 0% | 1 | 197 | ✅ Code complete, ❌ Not deployed |
| TRAVEL-P2-UI | 100% | 60% | 16 | 1169 | ✅ Code complete, 🟡 Partial deploy |

### All Projects:
- ✅ Code exists and verified locally
- ✅ Build passes: `npm run build` → 142 pages, 0 errors
- ✅ QA approved (Evaluator validation)
- ❌ Only FMS Portal deployed to Vercel production
- ❌ AUDIT/DISCORD-BOT/BM/TRAVEL not in Vercel yet

### Root Cause
CTB polling script checked for file existence and build success, but did **not** validate Vercel deployment. Assumed "builds successfully" = "deployed to production". This is the classic dev/prod confusion.

### Fix Applied (Cycle 619)
- ✅ Updated CTB state schema to distinguish LOCAL vs VERCEL completion
- ✅ Created accurate snapshot: `CTB_2026_06_06_CYCLE619.json`
- ✅ Committed correction to git
- ✅ Logged discovery in polling logs

### Why/How to Apply
**When reviewing CTB status:**
1. Always ask: LOCAL complete OR Vercel deployed?
2. Don't assume build passing = production ready
3. Check actual Vercel project status independently
4. Trust git logs for local state, Vercel API for deployment state

**For future cycles:**
- Include Vercel health check in polling (HTTP status on dsc-fms-portal.vercel.app)
- Report as two separate metrics: CODE_COMPLETION % vs DEPLOYMENT_STATUS %
- Never conflate the two

### Impact
- Reliability metric inflated by ~30% (recorded 100%, actual ~25% production coverage)
- Decision making was based on false "all projects complete" status
- No actual system damage (code exists, just not deployed)

### Next Steps
1. Clarify deployment strategy: which projects should go to Vercel?
2. If deploying AUDIT/DISCORD-BOT/BM to Vercel, handle next build/deployment
3. Update CTB polling schema to separate LOCAL from VERCEL metrics permanently
4. Retroactively audit cycles 610-618 to correct reliability metric

**Lesson:** In hybrid dev environments (local + cloud), polling must verify both layers independently.
