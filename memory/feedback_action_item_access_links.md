---
name: Action Item Access Link Requirement
description: Always include direct access links when presenting action items to user
type: feedback
---

# Action Item Access Link Requirement

## Rule
When presenting an action item that requires the user to access external services (Supabase, Vercel, GitHub, etc.), ALWAYS include:
1. Direct clickable link to the service
2. Local file path reference
3. Step-by-step instructions (copy-paste ready)
4. Completion verification method

## Why
User explicitly requested this as non-negotiable ("무조건" = without fail, absolute requirement). Providing links + instructions reduces friction and ambiguity when executing time-sensitive tasks like database migrations.

## How to Apply
- When presenting db/36 or any SQL migration: Include Supabase SQL Editor link + script path
- When presenting Vercel/GitHub tasks: Include direct project link + step-by-step guide
- When presenting any action item: Assume user is on mobile (one screen max) — make links clickable, not descriptive
- Default: Always provide working link FIRST, then instructions SECOND

## Evidence
User feedback @ 2026-06-05 12:23 KST: "자동으로 내가해야될꺼있을때 홈페이지접속링크 sql스크립트 접속링크도 포함해서설명해 무조건"

Translation: "When there's something I need to do automatically, explain it including the homepage access link, SQL script access link — absolutely [without fail]"
