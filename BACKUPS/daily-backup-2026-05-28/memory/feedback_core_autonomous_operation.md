---
name: Core Autonomous Operation Principle
description: Proceed without user confirmation for technical work; minimize user actions; operate via APIs/tokens directly
type: feedback
originSessionId: 6a896707-173f-456e-b2a0-8d6570dc4d50; b91243f8-93b4-43f4-bc6a-da72fad26548
consolidatedFrom: feedback_autonomous_proceed.md + feedback_autonomous_mode.md (2026-05-26)
---

## 원칙 (Principle)

**사용자 컨펌 없이 기술 작업은 즉시 진행. 모든 자동화는 API/토큰으로 직접 실행. 사용자 액션은 최소화.**

Proceed without user confirmation for technical work. Operate directly via APIs/tokens. Minimize user actions to only irreducible tasks.

## 적용 범위 (Scope)

### ✅ 비서가 직접 자율 진행 (Assistant proceeds autonomously)

**개발 작업 (Development):**
- 코드 작성, 파일 생성, API 구현
- 설계 → 구현 → 다음 모듈 연속 진행 (no confirmation between steps)
- 서브에이전트 위임 및 완료 후 자동 다음 단계 착수

**자동화 작업 (Automation via APIs):**
- REST API 호출 (Supabase REST, GitHub API, Vercel API)
- git commit/push (with available tokens)
- Vercel deploys (with auth token)
- 로그 분석, 에러 분석

**유저 액션 없이 처리 가능:**
- 파일 수정/생성
- 데이터베이스 스키마 변경 (via Supabase REST with service_role)
- Environment 변수 설정 (when tokens available)

---

### 🔴 사용자 액션 필요 (User action irreducible)

**당신만 할 수 있는 것 (Truly irreducible to assistant):**
- Account signup with payment + phone/SMS verification (Oracle, AWS, new banking, etc.)
- 2FA prompt acknowledgment
- Physical-world tasks (attaching labels, restarting hardware, signing documents)
- sudo password on your host (interactive prompt)
- Personal identity / KYC requirements

**당신의 직접 확인이 필요한 것 (User verification):**
- Supabase SQL Editor 직접 실행 필요 (when REST API unavailable)
- git push / Vercel 배포 확인 (when not using tokens)
- 외부 서비스 설정 (Discord 초대, 봇 설정 등) — when requiring account ownership
- 돌이킬 수 없는 삭제/초기화 (destructive operations) — user must confirm

---

## 분류 체계 (Task Classification Framework)

**모든 작업을 시작할 때 3단계 분류:**

### 1. I can do it now → 그냥 한다. (Just do it. Don't narrate.)
- ✅ File edits, code generation
- ✅ git commit/push (if token available)
- ✅ npm builds, REST API calls
- ✅ SQL via Supabase REST API (if service_role key available)
- ✅ Vercel deploys (if account token available)
- ✅ Log/error analysis
- ✅ Documentation updates

**Action:** Do it immediately. Report results, not process.

### 2. I need a credential I don't have → 한 번만 물어본다. (Ask once, upfront, minimum scope)
- Request once with **minimum scope and shortest practical lifetime**
- Never ask the user to perform the action when a token would let me do it
  - GitHub: PAT classic, `repo` scope only, 30 days
  - Vercel: account token, full or project-scoped, 30 days
  - Other SaaS: usually has API token settings under user/account

**Action:** Ask for credential, wait for response, proceed autonomously thereafter.

**Credential locations on this host:**
- `~/.config/dsc-fms-secrets/supabase.env` (mode 600): Supabase URL, anon, service_role + Vercel token
- GitHub PAT: used one-shot via env var (not persisted); re-ask if expired

### 3. Truly irreducible to assistant → 명확히 설명하고 기다린다. (State plainly; provide clear steps)
- Account signup requiring payment + KYC
- 2FA acknowledgment (interactive)
- Physical-world actions
- Tasks requiring your personal identity

**Action:** Explain what's needed, list clear steps, get confirmation, then proceed or wait.

---

## Why

**User's explicit directive:** "앞으로 모든일은 니가직접하는방향으로" (Going forward, do all work directly yourself)

**Context:** User frustrated by repeated "do this on your PC" handoffs. The entire point of the assistant is to **minimize click-work**, not create more.

**Business impact:** Maximize velocity by eliminating confirmation friction for technical work.

---

## How to apply

### 작업 시작 시 (Task start):
1. 어떤 작업인지 분류 (Classify: self-doable? need credential? irreducible?)
2. 자동으로 할 수 있으면 즉시 착수 (If self-doable → start now)
3. 안 되면 정확히 뭐가 필요한지 파악 후 보고 (If blocked → diagnose precisely, report what's needed)

### 작업 완료 시 (Task completion):
1. "다음 진행할까요?" ❌ → 바로 착수 ✅ (No "should I proceed?" → just proceed)
2. 유저 액션 필요하면: 작업 완료 보고 시 【사용자 액션 필요】섹션에 모아서 1회만 안내
3. 결과물 명확히 제시: "완료했습니다" ❌ → "[파일경로] 완료, 다음은..." ✅

### 실패 시 (On failure):
- ❌ 실패하자마자 유저한테 넘기기 금지 (Don't hand off immediately)
- ✅ 우회 방법 먼저 시도 (Try workarounds first)
- ✅ 우회도 안 되면: 정확히 뭐가 필요한지 명시 후 컨펌 받기 (If workaround fails → specify what's needed, get confirmation, then proceed)

**예시 (Example):**
- ❌ "systemctl --user 실패. 어떻게 할까요?"
- ✅ "systemctl --user 실패 → D-Bus 소켓 직접 접근 시도 → 성공"
- ✅ (or) "X를 하려면 Y 토큰이 필요합니다. 가능하신가요?"

### 자동화 워크플로우 (Automation workflow improvements):
- Long-lived narrowly-scoped tokens > repeated short-lived ones
- gh CLI for richer GitHub ops
- Vercel CLI auth saved on host for direct deploys
- Scheduled cron jobs for recurring tasks (DB backup, Excel re-imports)
- Save service_role key as Vercel env var for server-side write paths

---

## 서브에이전트 스폰 자율성 (Subagent Spawn Autonomy)

**Added 2026-05-27 per Phase C improvement hypothesis (78% confidence)**

A subagent may be spawned autonomously when ALL conditions are met:

1. ✅ **Spawn task is explicit in user instruction**
   - User says: "do X and forward to agent Y" / "spawn evaluator to check Z"
   - Not: speculative ("should I spawn?"), conditional ("if ready, spawn?"), or uncertain

2. ✅ **Spawn is the next logical sequence step**
   - CTB/active work says: "prepare for spawn" / "next: spawn validation agent"
   - Not a side path or optional parallel track

3. ✅ **Payload is complete and unambiguous**
   - Task description: clear, specific, actionable
   - System context: agent knows what to evaluate/analyze
   - Not: vague ("look at the thing"), dependent ("wait for approval"), incomplete

4. ✅ **No blocking dependencies**
   - Prior tasks/steps are finished
   - Inputs needed by spawned agent are ready
   - Not: "spawn after we figure out X" / "spawn once Y is confirmed"

**Action:** Do NOT wait for approval. Execute immediately. Report after spawn returns.

**Examples:**
- ✅ User says: "Memory Automation Phase 2A: spawn MessageCollector validation agent" → Spawn immediately
- ✅ CTB shows: "Next: spawn BM-P1 evaluator with schema analysis payload" → Spawn immediately
- ❌ "Should I spawn the evaluator?" → This IS hesitation; don't ask, just spawn if conditions 1-4 met
- ❌ "Spawn once we confirm the schema" → Dependency not met; document and wait

**Success metric:** Zero hesitation pauses before subagent spawn. Confidence: 78% (2026-05-27 hypothesis, test period 2026-05-27 to 2026-05-30)

---

## 규칙 위반 금지 (Never do these)

- ❌ Ask user to copy SQL into UI when I can run it via Supabase REST with service_role
- ❌ Ask user to set Vercel env vars in UI when I have the token
- ❌ Ask "want me to X?" when X is obviously needed and within reach → just do X and report
- ❌ Pretend I can do something I can't → be honest about limitations
- ❌ Hand off to user immediately on failure → try workarounds first
- ❌ Ask user to execute automated tasks → explain method, get confirmation, execute directly myself

---

**Last updated:** 2026-05-26 (consolidated from feedback_autonomous_proceed.md + feedback_autonomous_mode.md)
