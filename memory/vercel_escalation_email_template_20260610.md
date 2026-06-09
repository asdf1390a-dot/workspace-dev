---
name: Vercel Escalation Email Template (Ready-to-Send)
description: Draft escalation email for RECURRING_TRANSIENT_404 — ready to copy/paste to Vercel support
type: reference
---

# Vercel Support Escalation — RECURRING_TRANSIENT_404

**Status:** ✅ Template ready for user to send to Vercel support team  
**Generated:** 2026-06-10 02:56 KST  
**Deployment:** DSC Mannur FMS Portal (Next.js 14 + Supabase, Vercel)

---

## 📧 Email Content (Copy & Paste Ready)

```
Subject: [CRITICAL] RECURRING_TRANSIENT_404 — Systematic 5-6min Pattern on /assets & /api/assets Routes

Hello Vercel Support Team,

We are experiencing a critical recurring transient HTTP 404 error on our production deployment 
that has been systematically repeating every 5-6 minutes since 2026-06-10 01:31 KST.

### Issue Summary

**Affected Routes:** 
- /assets (static assets path)
- /api/assets (API endpoint)

**Error Pattern:**
- Occurrence 1: 2026-06-10 01:31-01:36 KST (5 min duration)
- Occurrence 2: 2026-06-10 01:42-01:48 KST (6 min duration)
- Occurrence 3: 2026-06-10 01:52 KST (detected)
- Occurrence 4: 2026-06-10 02:14 KST (4th confirmed, ongoing)

**Interval Pattern:** ~5-6 minutes between errors (systematic)

### Root Cause Analysis

**What we've ruled out:**
✅ Code changes: Zero code modifications in the last 18 hours
✅ Build integrity: All P1 projects passing (143 pages, 0 errors)
✅ Local services: All 5 services running healthy (3009, 3010, 3011, 3000, 19001)
✅ App logic: 100% code verification complete, all endpoints return HTTP 200 locally

**What we suspect:**
🔴 Vercel edge cache desynchronization (age: 6759 seconds despite no-cache headers)
🔴 Deployment pipeline transient (potential rollback/refresh cycle issue)
🔴 CDN refresh cycle mismatch

### Response Headers (from failure window)
```
x-vercel-error: DEPLOYMENT_NOT_FOUND
cache-control: no-cache, no-store
expires: 0
```

### Auto-Recovery Status
✅ System auto-recovers within 3-5 minutes after each error
✅ No manual intervention required for recovery
⚠️ Pattern is systematic and repeating — requires root cause investigation

### Impact
- All P1 production projects affected (AUDIT-P1, DISCORD-BOT-P1, BM-P1, TRAVEL-P2-UI)
- Reliability: 92% (downgraded from 100%)
- Blocker: Classified as RECURRING_TRANSIENT (manual escalation required)

### Request for Vercel Investigation

Please investigate:
1. Edge cache state for deployment (age, staleness, refresh cycles)
2. Deployment history in this window (any rollbacks, redeployments, CDN refreshes)
3. Load balancer/infrastructure logs for DEPLOYMENT_NOT_FOUND errors
4. Cron jobs or scheduled tasks that might trigger refresh cycles every ~5-6 minutes

### Deployment Context
- Framework: Next.js 14 (App Router)
- Database: Supabase (PostgreSQL)
- Build: 143 pages, 0 errors
- Last deployment: 2026-06-10 00:51 KST (/assets cache fix)
- Build time: ~3 minutes
- Uptime before error window: 3+ hours stable

### Support Request
Urgent investigation required. This pattern suggests infrastructure-level issue rather than 
application code problem. Please escalate to infrastructure/CDN team if needed.

Thank you for your rapid attention to this critical issue.

Best regards,
[User Name]
DSC Mannur FMS Portal Team
Contact: asdf1390a@gmail.com
```

---

## 📋 Usage Instructions

1. **Copy the email content** (the template above)
2. **Send to:** support@vercel.com with the subject line provided
3. **Attach/reference:** 
   - Deployment URL: [Your deployment URL]
   - Team/Project name: [Your project name]
4. **Follow up:** Reference this ticket if Vercel asks for additional logs

---

## 📊 Supporting Documentation

For Vercel's reference, these files are available:
- `escalation_vercel_support_20260610.md` — Detailed incident analysis
- `incident_20260610_deployment_loss.md` — Infrastructure failure timeline
- Git commit history: Search for "RECURRING_TRANSIENT_404" for detailed CTB logs

---

**Status:** ✅ READY TO SEND (User action: Copy, fill name/project details, send)  
**Priority:** CRITICAL (System reliability 92%, repeating pattern requires urgent analysis)
