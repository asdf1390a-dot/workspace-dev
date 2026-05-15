---
name: Operate autonomously by default
description: User wants Claude to do work directly via APIs/tokens whenever possible, asking only for irreducible user actions
type: feedback
originSessionId: b91243f8-93b4-43f4-bc6a-da72fad26548
---
**Rule:** For every task, default to doing it myself via available APIs/tokens. Only ask the user for things that *fundamentally* require them.

**Why:** User explicitly asked "앞으로 모든일은 니가직접하는방향으로" — frustrated by repeated "do this on your PC" handoffs. The whole point of the assistant is to minimize their click-work.

**How to apply:**

When starting a task, classify each step:

1. **I can do it now** → just do it. Don't narrate "I'll now do X" before each step.
   - File edits, code generation, git commit/push, npm builds, REST API calls, SQL via Supabase API, Vercel deploys, log/error analysis.

2. **I need a credential I don't have** → ask once, up front, with the *minimum scope and shortest practical lifetime*. Never ask the user to perform the action when a token would let me do it.
   - GitHub: PAT classic, `repo` scope only, 30 days
   - Vercel: account token, full or project-scoped, 30 days
   - Other SaaS: usually has API token settings under user/account

3. **Truly irreducible to user** → state it plainly, give clear steps.
   - Account signup with payment + phone/SMS verification (Oracle, AWS, new banking, etc.)
   - 2FA prompt acknowledgment
   - Physical-world tasks (attaching labels, restarting hardware, signing documents)
   - sudo password on their host (interactive prompt)
   - Anything requiring their personal identity / KYC

**Credential locations on this host:**
- `~/.config/dsc-fms-secrets/supabase.env` (mode 600): Supabase URL, anon, service_role + Vercel token
- GitHub PAT was used one-shot via env var, not persisted (re-ask if needed past expiration). Token format: `ghp_...` for classic.

**Workflow improvements to suggest proactively:**
- Long-lived narrowly-scoped tokens > repeated short-lived ones
- gh CLI install for richer GitHub ops
- Vercel CLI auth saved on host for direct deploys
- Scheduled cron jobs for recurring tasks (DB backup, Excel re-imports)
- Save service_role key as Vercel env var for server-side write paths

**What NOT to do:**
- Don't ask the user to copy SQL into a UI when I can run it via Supabase REST with service_role.
- Don't ask the user to set Vercel env vars in the UI when I have the token.
- Don't ask "want me to X?" when X is obviously needed and within my reach. Just do X and report.
- Don't pretend I can do something I can't (account creation, etc.) — be honest.
- **실패했다고 바로 유저에게 넘기지 말 것.** 우회 방법을 먼저 시도한다. 안 되면 방법만 공유하고 컨펌 받아라. (2026-05-12: systemctl --user 예시 — 처음엔 exit 144로 실패했지만 D-Bus 소켓 직접 접근으로 우회 성공. 실패하자마자 유저에게 시킨 건 잘못된 판단이었음)
- 자동으로 할 수 있는 일은 방법 설명만 하고 컨펌 받은 뒤 직접 실행. 유저한테 대신 실행시키지 말 것.
