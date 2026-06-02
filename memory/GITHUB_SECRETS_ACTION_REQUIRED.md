---
name: GitHub Secrets Configuration — Required Immediately
description: 6개 GitHub Secrets 설정 필수 (BM-P1 P2 배포 블로킹)
type: project
date: 2026-06-02
time: 19:15 KST
---

# 🔴 IMMEDIATE ACTION: GitHub Secrets Configuration

**Status:** 🔴 **BLOCKING — BM-P1 P2 Cannot Deploy Without These**

**Deadline:** 2026-06-02 20:00 KST (45분)

---

## Required GitHub Secrets

Go to: **https://github.com/asdf1390a-dot/workspace-dev/settings/secrets/actions**

### 6 Secrets To Configure:

1. **VERCEL_ORG_ID**
   - Value: Your Vercel organization ID
   - Found: https://vercel.com/account/settings

2. **VERCEL_PROJECT_ID**
   - Value: Your Vercel project ID for dsc-fms-portal
   - Found: https://vercel.com/dashboard/dsc-fms-portal (project settings)

3. **VERCEL_TOKEN**
   - Value: Personal access token from Vercel
   - Found: https://vercel.com/account/tokens

4. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL
   - Found: Supabase dashboard → Settings → Project URL
   - Note: This is PUBLIC (NEXT_PUBLIC_ prefix)

5. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anonymous key
   - Found: Supabase dashboard → Settings → API → anon public key
   - Note: This is PUBLIC (NEXT_PUBLIC_ prefix)

6. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (PRIVATE)
   - Found: Supabase dashboard → Settings → API → service_role (keep secret)
   - Warning: NEVER expose this in code or public docs

---

## What Happens After You Set These

1. GitHub Actions will automatically detect the new secrets
2. The build-and-test job will re-run with correct environment variables
3. npm ci, npm run build, npm run test will complete successfully
4. Migration validation will pass (H3 safety check)
5. Vercel production deployment will trigger automatically
6. BM-P1 P2 APIs will go live
7. Evaluator will begin final assessment
8. Task completes by 20:00 KST deadline

---

## Technical Details

**Workflow:** `.github/workflows/deploy.yml`

**Requirements:**
- Line 10-11: VERCEL_ORG_ID + VERCEL_PROJECT_ID (required for deploy)
- Line 42-43: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (required for build)
- Line 63,127: VERCEL_TOKEN (required for production deployment)
- Line 103: SUPABASE_SERVICE_ROLE_KEY (required for migration validation)

**Current Status:**
- ✅ Code: All 4 API endpoints exist (commit 9bdad71)
- ✅ Git: Changes pushed to main
- ⏳ Build: Waiting for GitHub Actions to run
- 🔴 Secrets: MISSING (blocks build step)

---

## Troubleshooting

**If build still fails after setting secrets:**
1. Check GitHub Actions tab: https://github.com/asdf1390a-dot/workspace-dev/actions
2. Look for most recent run (should auto-trigger within 1 minute of secret creation)
3. If not, manually trigger: Actions tab → Deploy workflow → Run workflow
4. Check build logs for specific error

**If secrets are visible in logs (security issue):**
- GitHub automatically masks secrets in logs
- If you see plaintext secrets, immediately rotate the exposed token

---

**Action Required By:** 2026-06-02 19:30 KST (deadline 20:00)
**Current Time:** 2026-06-02 19:15 KST
**Time Remaining:** 15 minutes
