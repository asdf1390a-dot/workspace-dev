---
name: Vercel Regression Incident (2026-06-14 22:55 KST)
description: CRITICAL - Vercel HTTP 404 DEPLOYMENT_NOT_FOUND detected at 22:55 KST
type: incident
---

# 🚨 CRITICAL INCIDENT: Vercel Regression (2026-06-14 22:55 KST)

**Incident Detection Time:** 2026-06-14 22:55:32 KST  
**Detected By:** CTB Auto-Update (cron) routine verification  
**Status:** ACTIVE ⚠️

## Incident Details

### Actual State (Verified)
```
curl https://dsc-mannur.vercel.app/
→ HTTP/2 404
→ x-vercel-error: DEPLOYMENT_NOT_FOUND
→ Message: "The deployment could not be found on Vercel."
```

### Claimed State (in INCOMPLETE_TASKS_REGISTRY.md)
```
Vercel HTTP 200 (9h59m+ 연속)
4/4 P1 LIVE (100%)
신뢰도 96% | 블로커 0건 ✅
```

### Discrepancy
- **Status File Age:** Last update 19:57 KST (~3 hours old)
- **Last Git Commit:** 22:44 KST (claimed 11h22m stable)
- **Reality:** HTTP 404 at 22:55 KST
- **Impact:** False positive status — system shows healthy but production is down

## Affected Projects
- ✅ Code exists (git commits present)
- ❌ Deployment broken (Vercel DEPLOYMENT_NOT_FOUND)
- ❌ All 4 P1 projects unreachable

| Project | Status | Code | Deployment |
|---------|--------|------|-----------|
| AUDIT-P1 | 🔴 DOWN | ✅ Present | ❌ 404 |
| DISCORD-BOT-P1 | 🔴 DOWN | ✅ Present | ❌ 404 |
| BM-P1 | 🔴 DOWN | ✅ Present | ❌ 404 |
| TRAVEL-P2-UI | 🔴 DOWN | ✅ Present | ❌ 404 |

## Required Actions

### 🔴 User Action Required
1. **Vercel Dashboard:** Check deployment status
   - https://vercel.com/dashboard
   - Look for "dsc-mannur" project
   - Check deployment history
   - Trigger manual redeploy if needed

2. **Restore Production**
   - Option A: Vercel auto-recovery (may take 5-15 min)
   - Option B: Manual redeploy from dashboard
   - Option C: Check recent git push for breaking changes

### 🤖 Monitoring
- CTB state updated: `.ctb-state.json` now reflects 404 status
- Incident record created: This file
- Next auto-check: 5 minutes (CTB polling cycle)

## Prevention (For Next Cycle)
1. ❌ **Do not auto-commit claiming "Vercel HTTP 200" without verification**
2. ✅ **Verify endpoints before marking deployment as healthy**
3. ✅ **Cross-check status file timestamp vs actual endpoint status**
4. ✅ **Alert user immediately if claimed state ≠ actual state**

---

**Note:** This regression indicates a potential Vercel infrastructure issue or a recent deployment push that broke something. The code exists, but the deployment is missing.
