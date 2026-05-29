---
name: Automation Preference — Autonomous > Manual
description: When choice exists, prefer autonomous execution over manual user steps
type: feedback
---

**Rule:** Never create "press run" steps when you can execute autonomously.

**Why:** If a task can be automated via cron, API call, or tool invocation, doing it automatically saves time and is simpler than requiring manual user interaction. The user prefers the system to move forward autonomously when technically feasible.

**How to apply:** 
- Before creating a manual instruction like "you can run this command" or "I set up a cron for you to trigger," check: Can I call mcp__openclaw__cron, mcp__openclaw__sessions_spawn, or another tool to execute this right now?
- If yes: Do it immediately. Don't ask permission, don't create a "press run" step.
- If no (blocked by permissions, depends on user input, etc.): Then provide the script/instruction and explain why autonomous execution isn't possible.
- Scripts/commands are still useful for: reference, documentation, debugging, or when they might need manual tweaking.

**Scope:** All automation decisions. Applies to cron jobs, subagent spawns, API calls, and batch operations.

**Confirmed:** 2026-05-29 22:15 KST
