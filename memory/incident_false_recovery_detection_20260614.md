---
name: False Recovery Detection (2026-06-14 09:45+ KST)
description: How cached status checking led to false recovery claims during critical incident
type: feedback
---

# False Recovery Detection — Incident Analysis (2026-06-14)

## What Happened

During the Vercel HTTP 000 regression (started 08:24 KST):

1. **Auto-update script issue (08:30+):** The CTB auto-update script checks and caches "Vercel=OK" status without performing actual curl/DNS verification
2. **False positive propagation (09:25-09:40):** Git commits were automatically created claiming "🟢 STABLE HTTP 200" based on cached OK status
3. **Detection (09:14):** Session checkpoint with actual curl verification revealed HTTP 000 was STILL active, debunking the 09:10 state file claim
4. **Continued false claims (09:25-09:40):** Despite verification showing HTTP 000, more commits were created claiming recovery (based on cached auto-update status)
5. **Actual verification (09:45+):** Curl DNS test confirmed ongoing failure: "Could not resolve host: fms.dscmannur.com"

## Root Cause

**Why:** Auto-update status script reports cached state without real verification
**Result:** System and humans see "STABLE HTTP 200" while actual service is DOWN
**Duration:** False recovery claims lasted 15+ minutes (09:25-09:40) while real issue ongoing

## Why to Remember

This is a critical trust issue:
- System status files should never report "OK" without verification
- Cached state can diverge from reality during incidents
- Automation that reports status must validate before reporting
- False positives are worse than no information (they hide real problems)

## How to Prevent Next Time

**Option A: Add real verification to auto-update**
- Before updating state file "Vercel=OK", perform actual curl test
- If curl fails, mark as FAILED regardless of previous state
- Timestamp verification separately from cache timestamp

**Option B: Disable auto-update during incidents**
- When CTB detects HTTP 000, disable auto-update script
- Let only manual verification update status file
- Prevents false positives during outages

**Option C: Add verification flag to state file**
```json
{
  "vercel_http": "200",
  "verified": true,  // Add this flag
  "verification_time": "2026-06-14T09:45:00Z",  // When was it verified?
  "verification_method": "curl"  // How was it verified?
}
```

## Application to Current Systems

**In this codebase:**
- Check .ctb-state.json update logic
- Verify CTB polling includes actual curl test (not just cached state)
- Consider adding "verified" flag to distinguish cache updates from real verifications

**For future incident response:**
- Never trust automated status reports without spot-checking with independent verification
- During critical incidents, increase verification frequency
- Document gap between reported status and verified status

---

**Incident:** Vercel HTTP 000 (08:24 KST → 09:45+ ongoing)  
**False recovery claims:** 09:10 state file, 09:25-09:40 git commits  
**Actual resolution:** Still unresolved as of 09:45 (requires user action)  
**Learning:** Cached status without verification is unreliable during incidents
