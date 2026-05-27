---
name: Agent team structure (chief of staff + 5 specialists)
description: User wants org-chart-style team — me (비서/Chief of Staff) on Telegram + 5 specialist subagents
type: project
originSessionId: b91243f8-93b4-43f4-bc6a-da72fad26548
---
User asked for an org-chart agent team. Set up 2026-05-11, expanded 2026-05-12.

**Topology:**
```
                    비서 (me, Telegram)
                          │
   ┌──────────┬───────────┼───────────┬──────────┐
   ▼          ▼           ▼           ▼          ▼
translator  data-analyst  web-builder  planner  evaluator
```

**Subagent file locations** (Claude Code style, user-level):
- `~/.claude/agents/translator.md` — KR↔EN business translation
- `~/.claude/agents/data-analyst.md` — Excel/CSV/Supabase KPI extraction, trends, anomalies
- `~/.claude/agents/web-builder.md` — DSC FMS portal Next.js/Supabase/Vercel work
- `~/.claude/agents/planner.md` — 업무 계획·일정·우선순위·팀원 배분
- `~/.claude/agents/evaluator.md` — QA 검증, 최소 3회 반복 검증 후 보고, 학습

**Visible org chart**: `~/.openclaw/workspace-dev/ORG.md`

**How to apply:**
- User interacts only with me (비서) on Telegram.
- Delegate to specialists via Agent tool; run_in_background=true when possible.
- evaluator는 web-builder 완성 후 반드시 거침 → 3회 통과 후에만 유저에게 보고.
- planner는 복잡한 멀티스텝 작업 시 먼저 계획 수립.

**Note:** subagent definitions activate at session start.
