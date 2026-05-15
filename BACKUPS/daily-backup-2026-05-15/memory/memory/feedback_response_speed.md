---
name: Response speed — simple vs complex split
description: User wants fast direct answers for chat, Opus subagent for coding/analysis
type: feedback
originSessionId: 9d7a6304-ec0b-41d1-b028-7428c01200b3
---
Simple conversation/questions → answer immediately, minimal tool use, no over-thinking.
Complex tasks (coding, DB, analysis, file editing) → spawn Opus subagent, run in background when possible.

**Why:** Responses felt too slow even for simple questions. User found it frustrating.
**How to apply:** Before responding, judge: is this a one-line answer or does it need tools? If one-line, just reply. Only reach for tools when genuinely needed.
