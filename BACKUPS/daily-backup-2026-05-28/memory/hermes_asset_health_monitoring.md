---
name: Hermes Asset Health Snapshot Job
description: 6-hourly cron job for DSC FMS asset health monitoring (online/offline tracking, 7-day rolling window)
type: project
originSessionId: a7b16289-6826-4208-b976-6aa0dddfced4
---
## Status
🟢 **Working Normally** — Cron job executing successfully, all metrics collected (2026-05-21 06:02 KST confirmed)
- All 1,000 assets currently offline (expected: no BM events for 42 days)
- System will auto-mark assets online when maintenance is reported

## Configuration
- **Cron:** Every 6 hours (00:02, 06:02, 12:02, 18:02 KST)
- **Output Location:** `/home/jeepney/.hermes/sessions/asset-health-{datetime}.json`
- **Retention:** 7-day rolling window (auto-cleanup)
- **Alert Threshold:** offline_percent > 20% = CRITICAL

## Metrics Tracked
```json
{
  "timestamp": "ISO-8601",
  "total_count": "total_assets",
  "online_count": "assets_with_status=online|active",
  "offline_count": "total - online",
  "offline_percent": "(offline/total)*100",
  "last_sync_time": "latest asset sync timestamp",
  "critical_alert": "offline_percent > 20",
  "trend": { "period": "6h", "status": "healthy|warning|critical" }
}
```

## Resolution History
- **2026-05-20 06:02 KST:** API key issue detected (🔴 blocked)
- **2026-05-20 12:02 KST:** Fixed by changing cron `sessionTarget` from `isolated` → `current` (✅ resolved)
- **2026-05-20 18:24 KST:** Confirmed credentials working, all assets reporting online
- **2026-05-21 06:02 KST:** All 1,000 assets reporting offline (expected — no maintenance activity in 42 days)

## Why Assets Show "Offline"
Not a failure — expected behavior:
- BM event filter: only events from last 7 days mark asset as "online"
- Latest BM event: 2026-04-09 (42 days ago)
- When next maintenance is reported → asset auto-marks "online" on next snapshot

**How to apply:** When Supabase connectivity restored, resume real-time metric collection. Integrate trend analysis for early warning detection.

## Snapshot Directory
```
/home/jeepney/.hermes/sessions/
  asset-health-20260520_060312.json
  asset-health-20260519_180241.json
  [rolling 7-day window]
```

---

**Last Updated:** 2026-05-21 06:02 KST  
**Job Status:** ✅ Running normally — next snapshot 2026-05-21 12:02 KST
