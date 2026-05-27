---
name: Hermes Asset Health Monitoring Issue
description: Critical API key failure preventing BM events retrieval; all assets showing offline
type: project
originSessionId: b3a8061d-f2f0-4552-8b56-0b7452d2aabf
---
## 🔴 Critical Blocker — Hermes Asset Health Monitoring Failure

**Status:** Data unavailable  
**Last snapshot:** 2026-05-21 09:05 UTC  
**Issue date:** 2026-05-21

### Problem Summary

The 6-hour Hermes cron job (`asset-health-snapshot.js`) executes successfully but reports **100% of assets offline** because:

1. ✅ Asset master query works → retrieves 1000 active assets
2. ❌ BM events query fails → returns zero results (no offline detection possible)
3. **Fallback logic:** Treats all assets with no BM events as "offline"

### Root Cause

**Hardcoded API key is invalid/expired** (line 18 of `/home/jeepney/.hermes/scripts/asset-health-snapshot.js`):
```javascript
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_Uz2G3zJYx77CUoKVMEeb8Q_382yFu57';
```

The hardcoded fallback key fails when env var is not set, causing silent failure in the BM events fetch (caught and logged as warning on line 90).

### Evidence

Snapshot file: `/home/jeepney/.hermes/sessions/asset-health-2026-05-21T09-05-25-009Z.json`
```json
{
  "timestamp": "2026-05-21T09:05:25.009Z",
  "total_count": 1000,
  "online_count": 0,
  "offline_count": 1000,
  "offline_percent": 100,
  "assets": [
    { "asset_id": "...", "status": "offline", "last_activity": null },
    ...
  ]
}
```

### Why:** All `last_activity` fields are `null` → BM events query returned no data.

### **【사용자 액션 필요】**

**📍 Fix Supabase Service Role Key:**
1. Log in to DSC FMS portal → Settings
2. Locate Supabase `SUPABASE_SERVICE_ROLE_KEY`
3. Copy valid key (must have `bm_events` table read permission)
4. Set environment variable:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="<새로운_키>"
   ```
5. Verify by running snapshot manually:
   ```bash
   node /home/jeepney/.hermes/scripts/asset-health-snapshot.js
   ```
   Expected: online_count > 0 (not 100% offline)

**⏱ Estimated time:** 5 minutes

### Impact

- **Monitoring:** Disabled (false 100% offline alert wastes attention)
- **Alerting:** >20% offline threshold ignored (can't detect real issues)
- **Tracking:** No asset health history (all snapshots show same 100% state)

### Next Steps

1. User provides valid Supabase Service Role Key
2. Restart cron job (will auto-run in 6 hours)
3. Verify next snapshot shows realistic online/offline split

---

**See also:**
- `/home/jeepney/.hermes/scripts/asset-health-snapshot.js` (script source)
- `/home/jeepney/.hermes/sessions/` (snapshot storage, rolling 7-day retention)
- Memory: `hermes_asset_health_monitoring.md` (prior status)
