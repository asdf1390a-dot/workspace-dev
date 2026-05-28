# Asset Master P2 UI — Manual Vercel Deployment Procedure

**Threshold:** Execute if git push fails and time is 16:45+ KST (2026-05-28)  
**Deadline:** 2026-05-28 17:00 KST  
**Commit Ready:** 71df7cf (fix(assets): URL query parameter sync)  
**Status:** READY — Network connectivity to GitHub blocked

## Quick Reference

| Step | Action | Expected Time |
|------|--------|---|
| 1 | Open Vercel dashboard | 30s |
| 2 | Locate latest deployment | 30s |
| 3 | Trigger redeploy | 10s |
| 4 | Verify build + deploy | 3-5 min |
| 5 | Test asset page | 2 min |
| **Total** | | **5-7 minutes** |

## Detailed Procedure

### Step 1: Access Vercel Dashboard
1. Navigate to: **https://vercel.com/asdf1390a/dsc-fms-portal**
2. Log in with asdf1390a@gmail.com (if session expired)
3. Ensure you're in the **dsc-fms-portal** project

### Step 2: Locate Deployment
1. Click **"Deployments"** tab at top
2. Look for the latest deployment with commit message: **"fix(assets): URL query parameter sync..."**
3. Expected status: ✅ Ready (or similar)

### Step 3: Trigger Redeploy
**Option 3A: Redeploy Button (FASTEST)**
1. Hover over the deployment row
2. Click **"⋯ More"** menu (3 dots)
3. Select **"Redeploy"**
4. Confirm when prompted

**Option 3B: Manual Deploy (if Redeploy unavailable)**
1. Click on the deployment to open details
2. Click **"Build Logs"** or **"Deployments"** tab
3. Look for **"Promote to Production"** or **"Deploy"** button
4. If visible, click it

### Step 4: Monitor Build + Deploy
1. Stay on the Deployments tab
2. Watch the status indicator for the new deployment:
   - 🔵 Building... (1-2 min)
   - 🟡 Ready (deploy in progress)
   - ✅ Ready (deployment complete)
3. Expected total time: 3-5 minutes

### Step 5: Verify Deployment
Once ✅ Ready status appears:

1. **Open asset page:** https://dsc-fms-portal.vercel.app/assets
2. **Test URL params** (open browser DevTools → Network)
   - Visit: `?page=2&per_page=100`
   - Verify: Page dropdown shows 2, per-page shows 100
   - Verify: Table reloads with correct pagination
3. **Test search:** Type in search box, press Enter
   - Verify: URL updates with `?q=<search-term>`
   - Verify: Results filter correctly
4. **Test filters:** Select a status from dropdown
   - Verify: URL updates with `?status=<selected>`
   - Verify: Table filters correctly

## Fallback Procedure (if Redeploy Fails)

**If Vercel redeploy is not available:**

1. Go to **Settings** tab in Vercel project
2. Look for **"Git Integration"** section
3. Click **"Disconnect"** then **"Reconnect"** (forces sync with GitHub)
4. Once connected, return to Deployments and retry Step 3

**If Git Integration is broken:**

1. From project root, verify file is correct:
   ```bash
   cat /home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/app/assets/page.tsx | head -50
   # Should show: import { useRouter, useSearchParams } from 'next/navigation';
   ```
2. If file is correct, contact Vercel support OR proceed with manual upload:
   - Vercel Settings → Integrations → Manual Upload
   - Upload the `/app/assets/page.tsx` file directly

## Success Criteria

- ✅ Deployment status: **✅ Ready** (green checkmark)
- ✅ Asset page loads: https://dsc-fms-portal.vercel.app/assets
- ✅ URL params work: `?page=2&per_page=100` updates state correctly
- ✅ Search/filter: Can search and filter, URL updates
- ✅ No console errors in browser DevTools

## Timeline Guardrails

| Time | Status | Action |
|------|--------|--------|
| 14:55+ KST | GitHub blocked | Monitoring for recovery |
| 16:45 KST | Network timeout likely | **Execute this procedure (Step 1)** |
| 17:00 KST | **HARD DEADLINE** | Must be deployed by this time |
| 17:10+ KST | Recovery window closed | Escalate to CEO/evaluator if failed |

## Contact & Escalation

**If deployment fails by 16:55 KST:**
- Check commit: `git log --oneline | head -1`
- Verify file: `wc -l /home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/app/assets/page.tsx` (should be ~396 lines)
- Escalate to CEO with status report

---

**Prepared:** 2026-05-28 14:55 KST  
**Commit:** 71df7cf  
**File:** /home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/app/assets/page.tsx (396 lines)
