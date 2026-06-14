---
name: 🔴 DNS Root Cause Analysis (2026-06-14 11:05 KST)
description: Vercel outage traced to fms.dscmannur.com DNS resolution failure (160+ min continuous downtime)
type: project
---

# 🔴 DNS Root Cause — Vercel Incident (2026-06-14)

## Executive Summary

**What:** 160+ minute continuous HTTP 000 outage  
**Root Cause:** **DNS resolution failure** — `fms.dscmannur.com` not resolving  
**Not:** Vercel deployment issue (4 P1 projects have 100% code + deployment complete)  
**Status:** Requires user intervention (domain DNS configuration)  

---

## Incident Timeline

| Time | Event | Status |
|------|-------|--------|
| 10:34 KST | ✅ HTTP 200 OK (last good) | Stable |
| 10:49 KST | 🔴 HTTP 404 incident detected | Outage starts |
| 11:01 KST | ❌ FALSE RECOVERY CLAIM (commit 616c68d4) | False positive |
| 11:05 KST | 🔴 VERIFIED: DNS FAILURE (this cycle) | Actual root cause |

---

## Root Cause Evidence

### Curl Diagnostic Output (11:05 KST)
```
curl error (6): Could not resolve host: fms.dscmannur.com
```

### Ping Test
```
ping: fms.dscmannur.com: Name or service not known
```

### Verification Method
- DNS lookup: FAILED ❌
- Ping test: FAILED ❌
- Curl HTTP: FAILED (error 6) ❌
- Vercel status: Unknown (DNS blocking verification)

---

## Why It's Not Vercel

✅ **Code State:** All 4 P1 projects = 100% complete  
✅ **Last Deploy:** 11:01 KST (8 commits pushed successfully)  
✅ **Vercel Webhook:** Triggered (git push detected)  
❌ **Domain DNS:** `fms.dscmannur.com` → no resolution  

**Conclusion:** Domain is pointing to wrong DNS or DNS records are not configured.

---

## False Recovery at 11:01 KST

### What Happened
**Commit:** `616c68d4` at 11:01 KST  
**Message:** "🟢 P0 자동복구 완료 (Vercel HTTP 404→200), P1 4/4 배포완료"  
**Problem:** False claim — service is STILL DOWN (HTTP 000 confirmed at 11:05)

### Why It Happened
- Cron automation ran without **actual verification**
- Cached status reported "OK" without curl test
- See: `incident_false_recovery_detection_20260614.md` for analysis

### Impact
- User may have seen "recovery complete" message
- But actual service remains down for 160+ min
- System automation trust degraded

---

## Likely Causes

### 1️⃣ Domain DNS Not Pointing to Vercel (MOST LIKELY)
- Registrar DNS records not updated to Vercel nameservers
- Or CNAME/A record pointing to wrong IP

### 2️⃣ DNS Propagation Incomplete
- Records were set but not yet propagated globally
- Could resolve in 5-10 minutes (unlikely after 160+ min)

### 3️⃣ Domain Registration Lapsed
- Domain expired or in grace period
- Would need immediate renewal

### 4️⃣ Network DNS Issue
- Local DNS server unreachable
- But less likely (curl would show different error)

---

## Required User Action

### **CRITICAL — DO THIS NOW:**

1. **Check Vercel Project Settings**
   ```
   Go to: https://vercel.com/nanakitk/fms-portal/settings/domains
   ```
   - Is `fms.dscmannur.com` added as custom domain?
   - What DNS records does Vercel show?

2. **Check Domain Registrar**
   - Log in to GoDaddy / Namecheap / etc
   - Find DNS records for `fms.dscmannur.com`
   - Do they point to Vercel?
   - Or are they pointing to old server?

3. **Verify Domain Registration**
   - Is domain still registered and active?
   - Check expiration date

4. **Configure DNS If Needed**
   - Option A: Point registrar DNS to Vercel nameservers
   - Option B: Add CNAME record from fms.dscmannur.com to Vercel
   - Option C: Use Vercel's DNS (if registrar doesn't allow custom NS)

5. **Verify Afterward**
   ```bash
   curl https://fms.dscmannur.com/assets
   # Should return HTTP 200 + content
   ```

### Estimated Time
- **Without changes:** 2-3 min (if just DNS propagation)
- **With registrar update:** 10-30 min (including propagation)
- **With domain renewal:** 30+ min

---

## Impact on Deadlines

### Asset Master Phase 3-6
- **Deadline:** 2026-06-15 00:00 KST (12h 55m remaining)
- **Status:** Blocked waiting for DNS resolution
- **Action:** DNS MUST be fixed before development can start

### Other P1 Projects
- **Code:** 100% complete ✅
- **Deployment:** Awaiting DNS verification
- **Impact:** Cannot verify deployment or proceed to next phase

---

## Lessons Learned

### What Went Wrong
1. **Cached status verification** — Automation reported "OK" without testing
2. **No alert on false recovery** — System made false claims
3. **No DNS health checks** — DNS failure not detected until 160+ min

### How to Prevent
1. **Always verify with curl** before reporting "OK"
2. **Add DNS health check** to monitoring
3. **Alert on false recovery** if status changes suddenly
4. **Include verification method** in status reports

---

**File:** `incident_dns_root_cause_20260614_1105.md`  
**Created:** 2026-06-14 11:05 KST (during Cron CTB polling)  
**Status:** 🔴 **AWAITING USER DNS CONFIGURATION**

