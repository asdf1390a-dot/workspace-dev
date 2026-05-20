---
name: Hermes Asset Health Monitoring
description: 6h cron job for asset online/offline tracking (FIXED 2026-05-20 12:02)
type: project
---

## Status: 🟢 Fixed

**Issue:** Cron job ran but couldn't access Supabase credentials (isolated session context)
**Solution:** Changed `sessionTarget` from `isolated` → `current` (2026-05-20 12:02)
**Next Run:** 2026-05-20 18:02 KST (6h schedule)

## Job Details

- **Cron ID:** `99345cd7-af14-41c6-86e0-64a7a73f704d`
- **Schedule:** `0 */6 * * *` (every 6 hours, UTC) in Asia/Seoul
- **Output:** `/home/jeepney/.hermes/sessions/asset-health-{datetime}.json`
- **Session Mode:** Current (inherits environment variables)

## Metrics Collected

```json
{
  "timestamp": "ISO-8601",
  "total_count": "total assets in inventory",
  "online_count": "assets currently online",
  "offline_count": "assets currently offline",
  "offline_percent": "calculated percentage",
  "last_sync_time": "last DSC FMS data sync",
  "trend": "6h change data for visualization"
}
```

## Alert Threshold

- **Critical:** offline_percent > 20%
- Action: Create alert snapshot when threshold exceeded

## Data Retention

- Rolling 7-day window (auto-deletes snapshots older than 7 days)
- Current snapshot directory: `/home/jeepney/.hermes/sessions/`

## Previous Issues (Resolved)

1. **API Key Unavailable (2026-05-20 06:03)** → Fixed by session context change
   - Root cause: Isolated cron sessions don't inherit workspace env vars
   - Supabase service role key was available but not accessible to job
   - Solution: Use `current` session target

## Next Validation

- Verify next run (18:02 KST) produces actual asset data
- Check offline_percent calculation accuracy
- Confirm 7-day retention is working
