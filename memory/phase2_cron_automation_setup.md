---
name: Phase 2 Cron Automation Setup (2026-05-21 06:00)
description: Rule violation auto-detection system — GitHub links, Telegram language, action labels
type: project
---

# Phase 2 Cron Automation — Rule Compliance Detection

**Status:** 🟡 Scaffold created, implementation pending  
**Deployment Target:** 2026-05-21 06:00 KST  
**Related:** feedback_github_links_only.md, feedback_telegram_communication_rule.md, feedback_action_labels_clarity.md

## Overview

Daily cron job to auto-detect rule violations across communication channels:
1. **GitHub Link Rule:** Raw links only (raw.githubusercontent.com), no browser links
2. **Telegram Language Rule:** Technical details in English, final results in Korean
3. **Action Labels:** Correct format【비서 액션 필요】or【사용자 액션 필요】

## Implementation Status

### ✅ Completed
- Route scaffold: `app/api/cron/compliance/phase2-detection/route.ts` (170 lines)
- Function structure: 3 detection routines + report generation + Telegram notification
- Error handling: Unauthorized check + database logging + fallback behavior

### 🔄 In Progress
- [ ] Implement `detectGitHubLinkViolations()` (query Discord/Telegram message logs)
- [ ] Implement `detectTelegramLanguageViolations()` (language detection)
- [ ] Implement `detectActionLabelViolations()` (format validation)
- [ ] Add Supabase table `compliance_audit_logs` (for audit trail)
- [ ] Create Vercel cron trigger configuration

### 📋 Blocked By
- Discord/Telegram API integration (requires chat history access)
- Supabase schema extension (new table `compliance_audit_logs`)
- Vercel cron scheduling UI configuration

## Detection Rules (Implementation Details)

### 1. GitHub Link Detection
```
Pattern: github.com/[owner]/[repo]/blob/[branch]/[path]
Violation: Should be raw.githubusercontent.com/[owner]/[repo]/[branch]/[path]
Context: SQL scripts, code snippets shared in messages
Action: Flag and suggest raw URL format
```

### 2. Telegram Language Detection
```
Rule 1: Technical details → English
Rule 2: Final output → Korean
Violation: Tech content in Korean or vice versa
Context: message content analysis (NLP)
Action: Flag language mismatch, suggest correction
```

### 3. Action Label Detection
```
Valid formats:
  ✅ 【비서 액션 필요】(Secretary action required)
  ✅ 【사용자 액션 필요】(User action required)
Invalid: Missing labels, wrong characters, incomplete format
Context: Any message requiring action
Action: Flag missing/incorrect labels
```

## Integration Points

- **Input:** Discord/Telegram message logs (via API or Supabase)
- **Output:** Compliance audit trail (Supabase `compliance_audit_logs`)
- **Notification:** Daily report to Telegram (if violations > 0)
- **Execution:** Vercel Cron (daily 06:00 KST)

## Next Steps (Post-Scaffold)

1. **Day 1 (2026-05-21):** Implement GitHub link detection (simplest, regex-based)
2. **Day 2 (2026-05-22):** Implement action label detection (pattern matching)
3. **Day 3 (2026-05-23):** Integrate Telegram message query + language detection (NLP)
4. **Day 4 (2026-05-24):** Full deployment + monitoring + report review

## Monitoring & Fallback

If any detection fails:
- Cron continues to next scheduled run (no cascade stops)
- Violations summary still sent to Telegram (even partial data)
- Failed detections logged with error context
- Manual review possible via `compliance_audit_logs` table

## Related Memory
- `RULE_COMPLIANCE_AUDIT_COMPREHENSIVE_2026-05-20.md` — violations history
- `efficiency_rules_immediate_action.md` — rules enforced
- `rule_compliance_audit_active.md` — monitoring framework
