# Auto Info Collection System - Setup Guide

## Status
🟡 **Implementation Complete** — Awaiting Vercel Environment Configuration

## Files Created

### 1. Next.js API Route
- **File:** `api/cron/auto-info-collection.ts`
- **Handler:** GET request with Cron Secret validation
- **Schedule:** Daily 23:00 UTC (08:00 KST)
- **Duration:** ~10 seconds per execution

### 2. Vercel Cron Configuration
- **File:** `vercel.json`
- **Schedule:** `0 23 * * *` (every day at 23:00 UTC)
- **Path:** `/api/cron/auto-info-collection`

### 3. Python Backup Implementation
- **File:** `scripts/auto_info_collection_system.py`
- **Use Case:** Local testing or alternative runtime environment

## Required Environment Variables

Configure these in Vercel Project Settings → Environment Variables:

| Variable | Source | Required | Example |
|----------|--------|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram BotFather | ✅ Yes | `123456:ABCdef...` |
| `TELEGRAM_CHAT_ID` | Telegram Secretary Channel | ✅ Yes | `-100123456789` |
| `GITHUB_TOKEN` | GitHub Personal Access Token | ⭕ Optional | `ghp_xxxx...` |
| `DEVTO_API_KEY` | Dev.to Account Settings | ⭕ Optional | `dev_...` |
| `CRON_SECRET` | Generate random string | ✅ Yes | `your-secret-key` |

## Setup Steps

### Step 1: Generate CRON_SECRET
```bash
# Generate a secure random string (32 chars)
openssl rand -hex 16
# Example output: a7f3d4e2c9b1f8g6h5i3j2k1l0m9n8o7
```

### Step 2: Get Telegram Credentials
1. Find your Telegram Bot Token from BotFather
2. Get the Secretary Channel ID (negative number with -100 prefix)

### Step 3: Configure Vercel
1. Go to Vercel Dashboard → DSC FMS Project Settings
2. Click "Environment Variables"
3. Add the 5 variables above (all environments: Production + Preview + Development)
4. Save and redeploy

### Step 4: Verify Deployment
```bash
# Check if cron job is registered
vercel env pull .env.local

# Test the endpoint (from Vercel dashboard)
# Manually trigger the cron job to verify it works
```

## Collection Sources

### 1. GitHub Trending
- **Query:** `language:python stars:>1000` and `language:javascript stars:>1000`
- **Items:** Top 3 repos per language
- **Requires:** `GITHUB_TOKEN` (optional, but higher rate limit)

### 2. Product Hunt
- **Query:** Last 24 hours, filtered by dev/tool/saas/api tags
- **Items:** Top 5 relevant products

### 3. Dev.to Articles
- **Tags:** nextjs, react, supabase
- **Items:** Top 5 latest articles
- **Requires:** `DEVTO_API_KEY` (optional)

### 4. Official Blog References
- **Supabase Blog:** https://supabase.com/blog
- **Vercel Blog:** https://vercel.com/blog

## Telegram Message Format

Each day at 08:00 KST, a formatted message is sent to the Secretary Channel:

```
📚 *Daily Info Collection*
_2026-05-16 08:00 KST_

🌟 *GitHub Trending*
1. [repo-name](https://github.com/...)
2. [repo-name](https://github.com/...)
3. [repo-name](https://github.com/...)

🎯 *Product Hunt*
1. [product-name](https://producthunt.com/...)
...

📊 *생태계 개발 관련*
✅ Data Platform — 분석/예측 기술
✅ Mobile App — React Native/Flutter 신기능
✅ DevOps — GitHub Actions, Vercel 자동화
```

## Troubleshooting

### Cron Job Not Running
- [ ] Check Vercel environment variables are set
- [ ] Verify `CRON_SECRET` matches in both code and Vercel
- [ ] Check cron schedule in vercel.json is valid
- [ ] Review Vercel function logs for errors

### Telegram Message Not Sent
- [ ] Verify `TELEGRAM_BOT_TOKEN` is correct
- [ ] Verify `TELEGRAM_CHAT_ID` is correct (negative number format)
- [ ] Check Telegram Bot has permission to send messages to the channel
- [ ] Review Vercel logs for HTTP errors

### API Rate Limiting
- [x] GitHub API: 60 req/hr (unauthenticated), 5000 req/hr (authenticated)
- [x] Product Hunt API: No documented limit (public API)
- [x] Dev.to API: No documented limit
- [x] Telegram Bot API: 30 messages/sec per chat

## Phase 7 Integration

This system is the foundation for specialized team information distribution:

**Phase 7 Plan (2026-07-01 ~ 09-30):**
- Data Platform Team receives: Analytics, ML/AI tools, Data visualization
- Mobile App Team receives: React Native, Flutter, Offline-first patterns
- DevOps Team receives: CI/CD automation, Infrastructure, Container tech

**Implementation:** Add team-specific filters to `formatTelegramMessage()` function

## Related Documentation

- [Auto Info Collection System Design](project_auto_info_collection.md)
- [Team Competency Development Framework](project_team_competency_development.md)
- [Phase 7 Ecosystem Expansion](PHASE7_ECOSYSTEM_EXPANSION_OVERVIEW.md)

---

**Last Updated:** 2026-05-16  
**Status:** Ready for Vercel configuration
