# 🎯 Team Skills Auto-Injection Framework — CLAUDE.md Root

**Status:** Phase 4.0 Agent Context Injection Active (2026-06-05)  
**Purpose:** Auto-activate learnings templates based on role + task type via agent context loader  
**Owner:** Team Lead (CTB)

---

## 📋 Global Team Rules (All Members)

### 1. **Glossary = Single Source of Truth (Glossary SSOT)**
- 4-column structure mandatory: `field_key | label_ko | label_en | source_system`
- If creating new DB fields → create glossary entry first
- All UI labels → reference glossary (never hard-code strings)
- All translation work → validate against glossary

### 2. **CLAUDE.md Hierarchy Rules**
```
/CLAUDE.md                     ← global team rules (this file)
├── /skills/CLAUDE.md          ← template usage rules
├── /pages/CLAUDE.md           ← UI page-specific rules  
├── /pages/api/CLAUDE.md       ← API route-specific rules
└── /components/CLAUDE.md      ← component structure rules
```
Each level inherits + specializes parent rules. Start at root, then check folder-specific.

### 3. **Templates Are Mandatory For Role Tasks**
- Do not reinvent patterns → load template first
- Template = checklist + requirements (not suggestion)
- If template doesn't cover scenario → update template (+ commit) → use new version

### 4. **Context Preservation Rule**
- Task-start → Load role template
- Task-complete → Verify against template checklist
- Task-commit → Reference template location in commit message

---

## 🎓 Role-to-Template Mapping Registry

| 역할 | 템플릿 경로 | 로드 시점 | 핵심 체크리스트 |
|------|-----------|---------|----------------|
| **웹개발자** | `skills/웹개발자-auto-injection.md` | API 개발, 컴포넌트 생성 | Supabase 클라이언트 분리, 환경변수 관리, Route 보호, 타입 안전성 |
| **평가자** | `skills/평가자-auto-injection.md` | QA 테스트, 배포 검증 | 5영역 spot check (네트워크/권한/경계값/품질/에러), 3회 반복 검증 |
| **데이터분석가** | `skills/데이터분석가-auto-injection.md` | API 검증, DB 마이그레이션 | 5단계 검증 (스키마→형식→엣지케이스→RLS→배포후), SQL 템플릿 제공 |
| **번역가** | `skills/번역가-auto-injection.md` | 한영 비즈니스 번역 | 5가지 Critical Patterns (긴급도/용어/형식/약어/시간), GLOSSARY SSOT |
| **비서** | `skills/비서-auto-injection.md` | 월간 팀 조율, 배포 게이트 | 5개 월간 체크포인트 (Glossary/BM품질/배포/우선순위/에스컬) |
| **플레너** | `skills/플레너-auto-injection.md` | UI/DB 설계, 아키텍처 | 4단계 설계 순서 (용어→스키마→UI→API), CLAUDE.md 계층, Progressive Disclosure |

---

## 🔄 How to Load Template (3-Step)

### Step 1: Identify Your Role
Check which role you are: web-builder? evaluator? planner? ...

### Step 2: Read Template Start Section
Open template file → read **Overview** section (always first 50 lines)
- Explains core 3-5 rules for this role
- Shows example violations
- Lists mandatory checks for this task type

### Step 3: Match Task Type to Template Section
- Task = "API endpoint development"? → Template section "API Development Rules"
- Task = "QA spot check"? → Template section "10-Sample Verification Minimum"
- Task = "Database schema design"? → Template section "Glossary + FK Structure"

---

## 🚀 Template Quick-Load by Task Type

```
TASK: "Add new API endpoint for BM event logging"
→ ROLE: web-builder
→ TEMPLATE: 웹개발자-auto-injection.md
→ SECTION: "API Development — Route Protection + Type Safety"
→ TIME: 2min read + checkbox verification
```

```
TASK: "QA test new BM input form before release"
→ ROLE: evaluator
→ TEMPLATE: 평가자-spot-check-template.md
→ SECTION: "Mandatory 3 Edge Cases — Network Delay, Missing Permissions, Boundary Values"
→ TIME: 5min setup + 30min testing
```

```
TASK: "Design new glossary + database schema for asset metadata"
→ ROLE: planner
→ TEMPLATE: 플레너-design-template.md
→ SECTION: "Step 1: Glossary SSOT 4-Column | Step 2: DB Foreign Keys | Step 3: UI Patterns"
→ TIME: 15min per step
```

---

## 📊 Phase 4.0 Agent Context Injection Status

### ✅ Completed (Phase 4.0 — 2026-06-05)

**6 Auto-Injection Templates (3,475 LOC):**
- [x] 웹개발자-auto-injection.md (1,171 LOC) — Next.js, Supabase, TS types, error handling
- [x] 평가자-auto-injection.md (383 LOC) — 5-area spot check: network/permission/data/quality/error
- [x] 데이터분석가-auto-injection.md (442 LOC) — 5-step API validation + SQL templates
- [x] 번역가-auto-injection.md (447 LOC) — 5 critical patterns: urgency/terminology/format/abbreviations/time
- [x] 플레너-auto-injection.md (417 LOC) — 4-step design: glossary→schema→UI→API
- [x] 비서-auto-injection.md (615 LOC) — 5 monthly checkpoints: glossary/BM/deployment/priority/escalation

**Infrastructure & Documentation (1,200+ LOC):**
- [x] skills/TASK_PATTERNS_REGISTRY.json — 6 task patterns + 2 multi-agent patterns
- [x] skills/AGENT_SYSTEM_INSTRUCTIONS.json — 6 agent role definitions + injection hooks
- [x] memory-automation/agent-context-loader.js — Pattern detection, caching, telemetry
- [x] PHASE4_AUTO_INJECTION_SPEC.md — 50+ KB technical specification
- [x] memory-automation/TEMPLATE_USAGE_METRICS.json — Telemetry tracking (auto-populated)
- [x] skills/TEMPLATE_UPDATE_LOG.md — Change tracking + monthly review process

### 🔄 In Progress (Phase 4.1 — Week 1-2)
- [ ] Agent framework integration: Load AGENT_SYSTEM_INSTRUCTIONS.json on agent init
- [ ] Injection hooks: Implement before_implementation, before_api_design, etc.
- [ ] End-to-end testing: Task input → pattern detection → template load → agent execution
- [ ] Update agent system prompts to reference TASK_PATTERNS_REGISTRY.json

### 📋 Pending (Phase 4.2-4.4)

**Phase 4.2 (Week 1-2): Test Suite**
- [ ] Unit tests: Pattern detection confidence scoring (target: >90% accuracy)
- [ ] Integration tests: Full activation flow (task → pattern → injection → agent)
- [ ] Performance tests: Detection <100ms, template load <400ms, total <500ms
- [ ] Real-world scenarios: 10 example tasks per agent role

**Phase 4.3 (Week 2-3): Telemetry & Feedback**
- [ ] Populate TEMPLATE_USAGE_METRICS.json from agent-context-loader activations
- [ ] Secretary monthly review: Activation frequency, common sections, errors
- [ ] Create TEMPLATE_IMPROVEMENT_REPORT.md (monthly recommendations)
- [ ] Update templates based on feedback

**Phase 4.4 (Week 3): Full Rollout**
- [ ] Deploy agent-context-loader to production
- [ ] Monitor activation rates (target: >80% of tasks)
- [ ] Collect user feedback (effectiveness survey)
- [ ] Iterate on templates based on telemetry data

---

---

## 🔧 Phase 4 Agent Context Injection Architecture

### System Overview

**Goal:** Automatically load role templates into agent system prompts based on task type detection. Reduce manual pattern search (5-10 min → <30 sec per task).

**3-Layer Architecture:**

```
Detection Layer (Task Parsing)
  ↓ Task description input
  ↓ Regex pattern matching + confidence scoring
  ↓ Identifies task type (api-development, qa-verification, etc.)
  
Mapping Layer (Registry Lookup)
  ↓ TASK_PATTERNS_REGISTRY.json
  ↓ Maps: task pattern → agents → templates
  ↓ Determines which templates to load
  
Injection Layer (Context Insertion)
  ↓ Template loading from disk (with caching)
  ↓ Section extraction (load relevant sections only)
  ↓ Context insertion into agent system prompt
  ↓ Agent executes with auto-loaded knowledge
```

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| **Pattern Registry** | `skills/TASK_PATTERNS_REGISTRY.json` | Maps task descriptions to agents + templates |
| **Agent Instructions** | `skills/AGENT_SYSTEM_INSTRUCTIONS.json` | Agent role definitions + injection hooks |
| **Context Loader** | `memory-automation/agent-context-loader.js` | Runtime pattern detection + template loading + caching |
| **6 Templates** | `skills/*-auto-injection.md` | Domain knowledge for each agent role |
| **Telemetry** | `memory-automation/TEMPLATE_USAGE_METRICS.json` | Activation tracking (auto-populated) |

### Task Pattern Matching

**When you describe a task:**
```
Task: "Add new API endpoint for tracking BM events"

Pattern Matching:
  - Keywords detected: "API", "endpoint", "develop"
  - Confidence score: 0.87 (threshold 0.80)
  - Pattern matched: "api-development"
  - Agents assigned: ["web-builder"]
  - Templates loaded: ["웹개발자-auto-injection.md"]
  
Result: Agent system prompt auto-includes web-builder learnings
```

**Confidence Scoring (0.0-1.0):**
- \>= 0.80: Auto-inject template (high confidence)
- 0.60-0.80: Ask user confirmation before injecting
- < 0.60: Use base learnings only (low confidence)

### Injection Hooks (Execution Points)

Templates auto-load at strategic points:

| Hook | Timing | Purpose |
|------|--------|---------|
| `before_implementation` | Before agent starts coding | Load role-specific implementation patterns |
| `before_api_design` | Before API route planning | Load API contract templates |
| `before_database_migration` | Before schema changes | Load validation + RLS planning rules |
| `before_commit` | Before git commit | Load commit message + code review guidelines |
| `before_deployment` | Before production push | Load deployment checklist |

### Multi-Agent Handoff Sequences

**Sequential (fullstack-feature):**
```
User: "Design & implement travel module with data validation"
  ↓ Planner agent (4-step design)
  ↓ Web-builder agent (implementation)
  ↓ Data-analyst agent (API validation)
  ↓ Evaluator agent (QA spot check)
  → Feature complete + signed off
```

**Parallel (deployment-gate):**
```
User: "Ready to deploy travel module?"
  ↓ Data-analyst ────┐
  ↓ Evaluator       ├─ All run simultaneously
  ↓ Secretary       ─┘
  → Deployment approved (if all sign-off)
```

---

## 🎯 When in Doubt: Template Decision Tree

```
1. Starting a task?
   → Go to role-to-template registry (above)
   → Find your role
   → Open template file
   
2. Not sure what to do?
   → Read template "Overview" (first 50 lines)
   → Find task type in template sections
   → Follow checklist
   
3. Checklist doesn't cover your case?
   → Complete task as best you can
   → Document the gap (comment in code or git log)
   → Update template (+ commit note: "Template extension: <reason>")
   → Use updated template for next similar task

4. Deploying/committing work?
   → Verify against template checklist
   → Reference template in commit message
   → Example: "feat(bm-api): Add event endpoint [웹개발자-auto-injection.md §Route Protection]"
```

---

## 📝 Template Update Protocol

When you discover template gap or improvement:

1. **Update template file** (add rule, add example, clarify step)
2. **Commit with reference**
   ```
   feat(templates): Clarify X pattern in 웹개발자-auto-injection.md
   
   Reason: Encountered Y case not covered in original template.
   New rule added at section Z.
   
   Template location: skills/웹개발자-auto-injection.md:L124-L140
   ```
3. **Notify team** (mention in standup or async message)
   - What rule was added
   - Why (what case triggered it)
   - When it applies (which task types)

---

## 🔗 Related Files

- **TEAM_SKILL_ACTIVATION_PLAN.md** — Overall strategy + completion metrics
- **STATUS_LIVE.json** — Real-time system health (CTB polling)
- **skills/** — All team learnings + templates (see subfolder CLAUDE.md)
- **memory/MEMORY.md** — Persistent memory of major milestones

---

**Last Updated:** 2026-06-05 11:45 KST  
**Maintainer:** Claude (CTB)  
**Version:** 4.0 (Phase 4.0 Agent Context Injection Framework)
