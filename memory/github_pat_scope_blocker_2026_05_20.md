---
name: GitHub PAT Scope Blocker — Checkpoint Automation Deployment
description: Checkpoint routes committed but push blocked — GitHub PAT lacks workflow scope
type: feedback
---

# GitHub PAT Scope Blocker — 2026-05-20 09:50 KST

## 🔴 Situation

**What's committed locally:**
- ✅ Commit `5d7ce73` — Checkpoint automation routes (14 files, 2005 lines)
  - 4 daily checkpoints: 08:00, 14:00, 15:00, 18:00
  - CTB realtime update infrastructure
  - ETA calculator, git parser, task estimator, time-delta, Telegram notifier

- ✅ Commit `358d65b` — Vercel.json routing fix
  - Fixed cron paths: singular → plural (`/api/cron/checkpoint/` → `/api/cron/checkpoints/`)
  - Removed non-existent 09-00, 12-00 references
  - Corrected backup paths to `/api/cron/backups/`

**What's blocked:**
- ❌ `git push origin main` FAILS
- Error: `refusing to allow a Personal Access Token to create or update workflow without workflow scope`
- Affects: `.github/workflows/gcs-validation.yml` file in the repo

## 🔧 Why This Happens

GitHub security policy requires Personal Access Tokens (PATs) to have explicit `workflow` scope to:
- Create or modify GitHub Actions workflow files
- Protect against accidental or malicious workflow modifications

The current PAT has `repo` scope but NOT `workflow` scope.

## ✅ Fix Required

**【사용자 액션 필요】 — Regenerate GitHub PAT**

### Step 1: Generate New Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. **Required scopes to check:**
   - ✅ `repo` (all sub-options)
   - ✅ `workflow` ← **CRITICAL** (currently missing)
   - Optional: `gist`, `notifications`, `user`
4. **Expiration:** Set appropriate (e.g., 90 days)
5. Click "Generate token"
6. **COPY** the new token immediately (won't be shown again)

### Step 2: Update Local Git Credentials
```bash
# Option A: Interactive (recommended)
git credential-osxkeychain erase
# (paste the hostname: https://github.com)
# Then retry: git push origin main
# (will prompt for new credentials)

# Option B: Update git config
git config --global credential.helper store
git push origin main
# (will prompt for username + token)
```

### Step 3: Verify Push Succeeds
```bash
git push origin main
# Should now succeed without workflow scope error
```

## 📊 Impact on Deployment

**Current state:**
- 2 critical commits are sitting locally
- Vercel cannot deploy until commits are pushed to GitHub
- Vercel Cron jobs will still fail (no new routes in production)

**After fix:**
- Push will succeed
- Vercel auto-syncs from GitHub (within 5-10 min)
- 08:00, 14:00, 15:00, 18:00 checkpoints become available
- CTB automation fully operational

## 🎯 Commits Waiting for Push
1. `358d65b` — Vercel.json routing fix
2. `5d7ce73` — Checkpoint automation routes + CTB infrastructure

---

**Documented:** 2026-05-20 09:50 KST  
**Status:** Awaiting user action (PAT regeneration)  
**Blocking:** Production deployment of checkpoint automation
