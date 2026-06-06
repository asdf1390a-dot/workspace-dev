---
name: Always trace reply context to root
description: When user replies to a previous message, always read and understand the original context before responding
type: feedback
---

**Rule:** When the user asks a follow-up question in a reply (`reply_to_id` exists in metadata), ALWAYS:
1. Read the message they're replying to
2. Understand the full context chain
3. Check what they're actually referencing
4. Respond based on the context, not assumption

**Why:** Previous session failure - I reported status without understanding the user's actual question. When they replied with follow-up, I missed the context that they were asking about a specific error/problem in the attached screenshot. This caused the "니가 답변안했자나?" (You didn't answer) feedback.

**How to apply:** 
- Before responding to any message with `reply_to_id`, trace the conversation thread upward
- Read the original message or context they're replying to
- Ask clarifying questions if needed, but assume they're referring to something specific in the previous messages
- This prevents assumption-based answers and improves relevance

**Activated:** 2026-06-06 12:30 KST (User explicit instruction)
