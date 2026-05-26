---
name: Session Management — Frequent Breaks for Coherence
description: Prefer frequent session breaks per task/major-action over long-running sessions; speed cost worth clarity gain
type: feedback
---

**Rule:** End session after each major task completion or significant action (API fix, component test, file write). Do NOT maintain long multi-hour sessions.

**Why:** Long sessions cause context drift and incoherence even with memory system. Frequent breaks (slower throughput) keep work focus sharp and decisions clear. User experienced the difference: long sessions → I forget ongoing context → output quality degrades. Short sessions → fresh start each turn → better recall.

**How to apply:** 
- After completing evaluator report → end session
- After implementing API fix → end session  
- After component test → end session
- After git commit → end session
- Major decision/direction change → end session before proceeding

This means more back-and-forth, slower apparent speed, but higher quality output. User confirms this tradeoff is acceptable (actually preferred).

**Changed:** 2026-05-27 00:01 KST (reverted from long-session approach)
