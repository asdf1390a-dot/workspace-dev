# Phase 4 Auto-Injection Specification

**Version:** 1.0.0  
**Status:** IMPLEMENTATION READY  
**Last Updated:** 2026-06-05  
**Author:** Jeepney AI (Phase 4 Architecture)

---

## Executive Summary

Phase 4 Agent Integration auto-loads team member learnings templates into agent system prompts based on task type detection. This enables:

- **Automatic template activation** when agents detect relevant tasks (API dev → web-builder template auto-injects)
- **Multi-agent coordination** with structured handoff protocols (planner → web-builder → data-analyst → evaluator)
- **Feedback loop** tracking which templates are most effective (metrics → monthly updates)

**Key metric:** Reduce manual pattern search time from 5-10 min to <30 seconds via auto-injection.

---

## System Architecture

### Layer 1: Detection (Task Pattern Matching)

```
User Input (Task Description)
    ↓
    | Pattern Regex Matching (TASK_PATTERNS_REGISTRY.json)
    | - Compare against 6 task patterns
    | - Calculate confidence score per pattern
    | - Confidence = (matched_keywords / total_keywords) × weight
    ↓
Detected Pattern + Confidence Score
    ↓
    | Confidence >= 0.80? YES → Proceed to Layer 2
    | Confidence < 0.80? NO → Fallback to base learnings
    ↓
Match Found (or Fallback)
```

**Files involved:**
- `skills/TASK_PATTERNS_REGISTRY.json` — Regex patterns + confidence weights

**Input:** Task description string (e.g., "Add POST /api/bm/events endpoint")  
**Output:** `{ patternId, confidence, pattern }`

---

### Layer 2: Mapping (Pattern → Agent → Template)

```
Detected Pattern
    ↓
    | Agent Role Validation
    | - Is agent role in pattern.agents[] ?
    | - If YES → continue; If NO → error
    ↓
Valid Agent + Pattern Match
    ↓
    | Template Path Lookup
    | - Get auto_injection_path from AGENT_SYSTEM_INSTRUCTIONS.json
    | - Example: web-builder + api-development → skills/웹개발자-auto-injection.md
    ↓
Template Path + Injection Hooks
```

**Files involved:**
- `skills/AGENT_SYSTEM_INSTRUCTIONS.json` — Agent-to-template mapping
- `skills/TASK_PATTERNS_REGISTRY.json` — Pattern-to-agent mapping

**Input:** `{ patternId, agentRole }`  
**Output:** `{ templatePath, injectionHooks, triggerSections }`

---

### Layer 3: Injection (Template Load & Context Insertion)

```
Template Path
    ↓
    | File Load (with caching)
    | - Check in-memory cache (TTL: 1 min)
    | - If miss: Load from disk + cache
    | - Latency target: <500ms
    ↓
Template Content (Markdown)
    ↓
    | Section Extraction
    | - Parse sections based on trigger_sections[]
    | - Example: Extract "API Development", "Route Protection"
    | - Merge sections into single context block
    ↓
Formatted Context Block
    ↓
    | Wrap with Markers
    | - Prefix: "--- AUTO-LOADED LEARNINGS ---"
    | - Suffix: "--- END AUTO-LOADED LEARNINGS ---"
    ↓
Injected Context String
    ↓
    | Prepend to Agent System Prompt
    | Agent receives: [prefix markers] + [template content] + [suffix markers] + [base instructions]
    ↓
Agent System Prompt with Auto-Injected Context
```

**Files involved:**
- `skills/*-auto-injection.md` (6 templates) — Content to inject
- `memory-automation/agent-context-loader.js` — Loader implementation
- `skills/AGENT_SYSTEM_INSTRUCTIONS.json` — Injection hooks config

**Input:** Template path  
**Output:** Injected system prompt string

---

### Feedback Loop: Metrics & Updates

```
Agent Execution (with auto-injection active)
    ↓
    | Activation Logging
    | - Template name, sections used, confidence
    | - Task completion time, user feedback
    | - Number of rework cycles needed
    | Log to: skills/TEMPLATE_USAGE_METRICS.json
    ↓
Monthly Aggregation (Secretary Role)
    ↓
    | Analyze Metrics
    | - Which templates activated most often?
    | - Which templates had highest completion rate?
    | - Which sections have low usage (candidate for removal)?
    | - Did template reduce time-to-completion?
    ↓
Update Proposal
    ↓
    | Secretary proposes template updates:
    | - Consolidate low-usage sections
    | - Clarify confusing sections
    | - Add new sections for discovered task patterns
    ↓
Template Update (+ Rationale in TEMPLATE_UPDATE_LOG.md)
```

---

## Component Specifications

### Component 1: Task Pattern Registry

**File:** `skills/TASK_PATTERNS_REGISTRY.json`

**Structure:**
```json
{
  "task_patterns": [
    {
      "id": "api-development",
      "name": "API Route Development",
      "patterns": ["regex1", "regex2", ...],
      "agents": ["web-builder"],
      "templates": ["path/to/template.md"],
      "trigger_sections": ["Section 1", "Section 2"],
      "confidence_threshold": 0.85
    }
  ],
  "detection_rules": { ... },
  "fallback_behavior": { ... }
}
```

**Validation:**
- Each pattern must have: id, name, patterns[], agents[], templates[]
- Each pattern.patterns[] must be valid regex
- agents[] values must match AGENT_SYSTEM_INSTRUCTIONS.json keys
- confidence_threshold must be 0.0-1.0

---

### Component 2: Agent System Instructions

**File:** `skills/AGENT_SYSTEM_INSTRUCTIONS.json`

**Structure:**
```json
{
  "agents": {
    "web-builder": {
      "base_instruction": "You are a Next.js developer...",
      "auto_injection_path": "skills/웹개발자-auto-injection.md",
      "injection_hooks": ["before_implementation", "before_commit"],
      "task_pattern_ids": ["api-development", "fullstack-feature"]
    }
  },
  "injection_metadata": { ... },
  "context_injection_protocol": { ... }
}
```

**Validation:**
- Each agent must have: role, base_instruction, auto_injection_path, injection_hooks
- injection_hooks must be from: ["before_implementation", "before_api_design", "before_qa_testing", ...]
- task_pattern_ids must reference valid patterns in TASK_PATTERNS_REGISTRY

---

### Component 3: Agent Context Loader

**File:** `memory-automation/agent-context-loader.js`

**API:**

```javascript
const loader = new AgentContextLoader();
await loader.initialize();

// Load context for a task
const result = await loader.loadContext({
  taskDescription: "Add new API endpoint",
  agentRole: "web-builder",
  context: { taskId: "api-001", gitCommit: "abc123" }
});

// Result structure:
{
  success: true,
  patternId: "api-development",
  confidence: 0.92,
  template: "skills/웹개발자-auto-injection.md",
  sections: ["API Development", "Route Protection"],
  injectedContext: "--- AUTO-LOADED LEARNINGS ---\n...\n--- END AUTO-LOADED LEARNINGS ---",
  errors: []
}
```

**Key Methods:**
- `loadContext(input)` — Main entry point
- `detectTaskPattern(taskDescription)` — Pattern matching
- `loadTemplate(templatePath)` — File loading with cache
- `extractSections(template, sectionNames)` — Section extraction
- `getStatistics()` — Feedback loop metrics

**Performance Constraints:**
- Template load latency: <500ms
- Memory cache TTL: 60 seconds
- Max concurrent injections: 5
- Telemetry buffer flush: Every 10 activations or 30 seconds

---

### Component 4: Auto-Injection Templates

**Files:** `skills/*-auto-injection.md` (6 templates)

**Template Structure:**
```markdown
---
name: template-name
applies_to: agent-role
activation_pattern: task-pattern-id
---

# Role Name — Auto-Injection Template

## 🔴 Immediate Rules (Critical)
[Critical rules for this role]

## 🟡 General Rules (Guidelines)
[Guidelines and best practices]

## 📋 Verification Checklist
[Role-specific checklist]
```

**Templates (completed in Phase 4):**
1. ✅ `skills/웹개발자-auto-injection.md` (Phase 3, refactored for Phase 4)
2. ✅ `skills/평가자-auto-injection.md` (Phase 4)
3. 🟡 `skills/데이터분석가-auto-injection.md` (Phase 4, to create)
4. 🟡 `skills/번역가-auto-injection.md` (Phase 4, to create)
5. 🟡 `skills/플레너-auto-injection.md` (Phase 4, to create)
6. 🟡 `skills/비서-auto-injection.md` (Phase 4, to create)

**Each template should:**
- Be 400-600 LOC
- Include 🔴 Critical rules (non-negotiable)
- Include 🟡 General rules (guidelines)
- Include 📋 Verification checklist (role-specific)
- Reference relevant sections from Phase 3 learnings

---

## API Contracts

### Contract 1: Agent Initialization

```javascript
// Before: Agent receives only base system instructions
// Agent system prompt = [base instructions only]

// After: Agent receives auto-injected template + base instructions
// Agent system prompt = [prefix marker] + [injected template] + [suffix marker] + [base instructions]
```

**Responsibility:** Agent framework must prepend auto-injected context to system prompt before agent runs.

---

### Contract 2: Task Description Format

The `taskDescription` string passed to `loadContext()` must:
- Be minimum 5 words (spam prevention)
- Contain actionable task (not questions like "how do I?")
- Be case-insensitive (regexes use /i flag)

**Example valid inputs:**
- "Add new POST /api/events endpoint"
- "Test BM form validation across network scenarios"
- "Verify API response schema matches contract"

**Example invalid inputs:**
- "hello" (too short)
- "Tell me more" (not a task)

---

### Contract 3: Confidence Scoring

Pattern matching returns confidence in range [0.0, 1.0]:

- **0.0-0.60:** Low confidence — don't auto-inject, use base learnings only
- **0.60-0.80:** Medium confidence — inject + ask user for confirmation
- **0.80-1.0:** High confidence — auto-inject without confirmation (default behavior)

**Calculation:**
```
confidence = (matched_patterns / total_patterns) × weight + adjustment
Example: api-development has 5 patterns, 2 match → (2/5) × 0.9 = 0.36 (boosted to 0.45-0.50 range)
```

---

## Performance SLAs

| Operation | Target Latency | Notes |
|-----------|---|---|
| Pattern detection | <100ms | Regex matching against 6 patterns |
| Template load (cached) | <10ms | In-memory cache hit |
| Template load (disk) | <400ms | File I/O from disk |
| Section extraction | <50ms | String parsing |
| Context formatting | <20ms | String concatenation |
| **Total injection time** | **<500ms** | Sum of all steps |

**Measurement:** Log timestamp before/after each operation in AgentContextLoader.

**Alert thresholds:**
- If any operation exceeds target × 2: Log warning
- If total time exceeds 500ms: Use fallback (base learnings only)

---

## Error Handling

### Scenario 1: Template File Missing

```
loadContext("Add API endpoint", "web-builder")
  → Pattern detected: api-development ✓
  → Load template: skills/웹개발자-auto-injection.md
  → File not found: Error!
  → Fallback: Use base learnings (no injection)
  → Return: { success: false, fallback: true, message: "Template file missing" }
```

**Behavior:** Agent proceeds with base system instructions only.

---

### Scenario 2: Pattern Confidence Too Low

```
loadContext("Please help me code", "web-builder")
  → Pattern matching: No patterns match (confidence = 0.0)
  → Fallback: Use base learnings
  → Return: { success: false, confidence: 0.0, message: "No matching pattern found" }
```

**Behavior:** Agent receives only base instructions.

---

### Scenario 3: Agent Role Not Applicable

```
loadContext("Design database schema", "evaluator")
  → Pattern detected: ui-db-design
  → Check: Is "evaluator" in pattern.agents[]? NO
  → Error: Agent role not applicable
  → Fallback: Use base learnings
  → Return: { success: false, error: "Agent not applicable", suggestedAgents: ["planner"] }
```

**Behavior:** Suggest correct agent (planner) to user; proceed with base instructions.

---

## Testing Strategy

### Test Suite 1: Unit Tests (agent-context-loader.js)

**Test 1.1: Pattern Detection Accuracy**
```javascript
test("api-development pattern matches API task", () => {
  const result = loader.detectTaskPattern("Add POST /api/events endpoint");
  assert(result.success === true);
  assert(result.pattern.id === "api-development");
  assert(result.confidence > 0.80);
});
```

**Test 1.2: Template Caching**
```javascript
test("template cache reduces load time on subsequent calls", () => {
  const t1 = loader.loadTemplate("skills/웹개발자-auto-injection.md");
  const t2 = loader.loadTemplate("skills/웹개발자-auto-injection.md");
  assert(t1 === t2); // Same reference
});
```

**Test 1.3: Section Extraction**
```javascript
test("extracts only requested sections from template", () => {
  const sections = loader.extractSections(template, ["API Development", "Route Protection"]);
  assert(sections.length === 2);
  assert(sections[0].name === "API Development");
});
```

**Test 1.4: Confidence Threshold**
```javascript
test("rejects pattern below confidence threshold", () => {
  const result = loader.detectTaskPattern("hello");
  assert(result.success === false);
  assert(result.confidence < 0.60);
});
```

### Test Suite 2: Integration Tests

**Test 2.1: End-to-End Context Loading**
```javascript
test("loads and injects context for api-development task", async () => {
  const result = await loader.loadContext({
    taskDescription: "Implement Supabase RLS for /api/bm/breakdowns",
    agentRole: "web-builder"
  });
  
  assert(result.success === true);
  assert(result.patternId === "api-development");
  assert(result.injectedContext.includes("API Development"));
  assert(result.injectedContext.includes("--- AUTO-LOADED LEARNINGS ---"));
});
```

**Test 2.2: Multi-Agent Handoff**
```javascript
test("planner output → web-builder → data-analyst validation chain", async () => {
  // Planner: Design task
  const design = await planner.loadContext({
    taskDescription: "Design Travel module schema",
    agentRole: "planner"
  });
  assert(design.success === true);
  
  // Web-Builder: Implement based on design
  const api = await webBuilder.loadContext({
    taskDescription: "Implement API from planner design",
    agentRole: "web-builder",
    context: { previousOutput: design.injectedContext }
  });
  assert(api.success === true);
  
  // Data-Analyst: Validate
  const validation = await analyst.loadContext({
    taskDescription: "Validate API contracts from web-builder",
    agentRole: "data-analyst",
    context: { previousOutput: api.injectedContext }
  });
  assert(validation.success === true);
});
```

### Test Suite 3: Feedback Loop Tests

**Test 3.1: Telemetry Logging**
```javascript
test("logs template activation with full context", async () => {
  await loader.loadContext({...});
  loader.flushTelemetry();
  
  const logs = JSON.parse(fs.readFileSync(CONFIG.TELEMETRY_LOG_PATH, 'utf8'));
  assert(logs.length > 0);
  assert(logs[0].timestamp); // ISO 8601
  assert(logs[0].confidenceScore > 0);
});
```

**Test 3.2: Statistics Computation**
```javascript
test("aggregates usage statistics correctly", async () => {
  // Run 3 different tasks
  await loader.loadContext({ taskDescription: "Add API endpoint", agentRole: "web-builder" });
  await loader.loadContext({ taskDescription: "Test feature", agentRole: "evaluator" });
  await loader.loadContext({ taskDescription: "Validate API", agentRole: "data-analyst" });
  
  const stats = loader.getStatistics();
  assert(stats.totalActivations === 3);
  assert(stats.patterns["api-development"] === 1);
  assert(stats.byAgent["web-builder"] === 1);
});
```

### Test Suite 4: Performance Tests

**Test 4.1: Latency SLA**
```javascript
test("template injection completes within SLA (<500ms)", async () => {
  const start = Date.now();
  await loader.loadContext({
    taskDescription: "Add new API endpoint with validation",
    agentRole: "web-builder"
  });
  const elapsed = Date.now() - start;
  
  assert(elapsed < 500, `Took ${elapsed}ms, expected <500ms`);
});
```

**Test 4.2: Cache Hit Latency**
```javascript
test("cached template loads within 10ms", async () => {
  // First load (cold cache)
  await loader.loadTemplate("skills/웹개발자-auto-injection.md");
  
  // Second load (warm cache)
  const start = Date.now();
  await loader.loadTemplate("skills/웹개발자-auto-injection.md");
  const elapsed = Date.now() - start;
  
  assert(elapsed < 10, `Cache miss: ${elapsed}ms`);
});
```

### Test Suite 5: Real-World Scenarios

**Test 5.1: Full-Stack Feature (Planner → Web-Builder → Data-Analyst → Evaluator)**
```javascript
test("full-stack feature delivery chain works end-to-end", async () => {
  // 1. Planner designs Travel module
  const design = await orchestrator.executeChain("fullstack-feature", {
    taskDescription: "Design and implement Travel cost tracking module",
    startingAgent: "planner"
  });
  assert(design.status === "completed");
  
  // 2. Web-Builder implements API (loads design context)
  // 3. Data-Analyst validates (loads API context)
  // 4. Evaluator QA tests (loads validation context)
  // Verify all 4 agents completed successfully
  assert(design.chain.length === 4);
  assert(design.chain.every(step => step.status === "passed"));
});
```

**Test 5.2: Deployment Gate (Parallel QA + Data Validation + Consistency Check)**
```javascript
test("deployment gate runs all 3 checks in parallel, requires all sign-offs", async () => {
  const gate = await orchestrator.executeChain("deployment-gate", {
    taskDescription: "Verify Travel P2 module ready for production",
    primaryAgent: "evaluator"
  });
  
  // All 3 agents should complete
  assert(gate.evaluator.status === "passed");
  assert(gate.dataAnalyst.status === "passed");
  assert(gate.secretary.status === "passed");
  assert(gate.deploymentApproved === true);
});
```

---

## Rollout Plan

### Week 1: Deploy Core Infrastructure

**Files to create:**
1. ✅ `skills/TASK_PATTERNS_REGISTRY.json`
2. ✅ `skills/AGENT_SYSTEM_INSTRUCTIONS.json`
3. ✅ `memory-automation/agent-context-loader.js`

**Testing:**
- Run unit tests (Test Suite 1)
- Verify pattern detection accuracy
- Test template caching performance

**Deployment:**
- Push to main branch
- Internal testing only (no user impact yet)

---

### Week 2: Deploy Auto-Injection Templates + Integration

**Files to create:**
1. ✅ `skills/평가자-auto-injection.md`
2. 🟡 `skills/데이터분석가-auto-injection.md`
3. 🟡 `skills/번역가-auto-injection.md`
4. 🟡 `skills/플레너-auto-injection.md`
5. 🟡 `skills/비서-auto-injection.md`

**Integration:**
- Integrate AgentContextLoader with agent system
- Agent framework prepends auto-injected context to system prompt
- Run integration tests (Test Suite 2)

**Testing:**
- Beta rollout to planner + web-builder agents
- Verify template loads correctly
- Test multi-agent handoff chains

---

### Week 3: Full Rollout + Feedback Loop

**Files to create:**
1. 🟡 `skills/TEMPLATE_USAGE_METRICS.json` (template)
2. 🟡 `skills/TEMPLATE_TEST_HARNESS.md`
3. 🟡 `skills/TEMPLATE_UPDATE_LOG.md`
4. ✅ Update `CLAUDE.md` with Phase 4 section

**Testing:**
- Run full test suite (Test Suites 1-5)
- Real-world scenario tests (full-stack feature, deployment gate)
- Performance benchmarking

**Rollout:**
- Full rollout to all 6 agents
- Enable telemetry logging (TEMPLATE_USAGE_METRICS)
- Start monthly feedback loop (secretary reviews metrics)

**Documentation:**
- Training materials for team
- Troubleshooting guide
- Template update process documentation

---

## Success Metrics

### Metric 1: Activation Frequency
- Target: >80% of tasks trigger auto-injection
- Measurement: Count successful activations / total tasks
- Initial target: Week 1 stabilization, then monitor

### Metric 2: Time-to-Completion
- Target: 20% reduction in task completion time
- Measurement: Compare time with/without template injection
- Expected: 10-15 min task → 8-12 min with template

### Metric 3: Template Usage
- Target: All 6 templates activated weekly
- Measurement: Count activations per template per week
- Alert: If any template <2 activations/week, re-evaluate trigger patterns

### Metric 4: Error Rate
- Target: <2% of injections cause agent errors
- Measurement: Count injection-caused failures
- Threshold: If >2%, disable auto-injection temporarily + investigate

### Metric 5: User Feedback
- Target: >85% "helpful" rating
- Measurement: After task completion, ask "Was template helpful?"
- Action: Low ratings trigger template revision

---

## Appendix A: Example Activation Flow

**Scenario:** User asks web-builder to add API endpoint

```
User Input:
"Add POST /api/bm/events endpoint with Supabase RLS"

↓

AgentContextLoader.loadContext({
  taskDescription: "Add POST /api/bm/events endpoint with Supabase RLS",
  agentRole: "web-builder",
  context: { taskId: "bm-events-001", gitCommit: "f22cd65" }
})

↓

Step 1: Pattern Detection
- Compare against 6 patterns in TASK_PATTERNS_REGISTRY
- "endpoint", "api", "RLS" keywords match api-development pattern
- Confidence = (3/4 patterns matched) × 0.9 = 0.675 → adjusted to 0.88
- Result: { success: true, pattern: api-development, confidence: 0.88 }

↓

Step 2: Agent Validation
- Is "web-builder" in pattern.agents[]? YES ✓
- Continue to Step 3

↓

Step 3: Template Loading
- Load: skills/웹개발자-auto-injection.md
- Cache hit: Already in memory
- Latency: 5ms

↓

Step 4: Section Extraction
- Extract sections: ["API Development", "Route Protection", "Supabase 클라이언트 분리"]
- Format with prefix/suffix markers

↓

Step 5: Inject into Agent System Prompt
Original:
```
You are a Next.js developer...
[rest of base instructions]
```

After injection:
```
--- AUTO-LOADED LEARNINGS (Pattern: api-development, Confidence: 0.88) ---

[웹개발자-auto-injection.md sections]

--- END AUTO-LOADED LEARNINGS ---

You are a Next.js developer...
[rest of base instructions]
```

↓

Step 6: Log Activation
```json
{
  "timestamp": "2026-06-05T11:45:00Z",
  "taskId": "bm-events-001",
  "detectedPattern": "api-development",
  "confidenceScore": 0.88,
  "agent": "web-builder",
  "template": "skills/웹개발자-auto-injection.md",
  "sectionsUsed": ["API Development", "Route Protection"],
  "gitCommit": "f22cd65"
}
```

↓

Web-Builder Agent executes with auto-injected context:
- Web-builder sees "Route Protection" section
- Web-builder sees "Supabase 클라이언트 분리" guidelines
- Web-builder implements /api/bm/events with proper RLS + type safety
- Task completed in ~12 min (vs. ~15 min without template)
```

---

## Appendix B: Files Overview

| File | Type | Purpose | Size |
|------|------|---------|------|
| `skills/TASK_PATTERNS_REGISTRY.json` | Config | Task detection patterns + confidence weights | 3-5 KB |
| `skills/AGENT_SYSTEM_INSTRUCTIONS.json` | Config | Agent role definitions + injection hooks | 8-12 KB |
| `memory-automation/agent-context-loader.js` | Code | Runtime template loader + injection mechanism | 10-15 KB |
| `skills/웹개발자-auto-injection.md` | Template | Web-builder immediate rules + checklist | 1171 LOC |
| `skills/평가자-auto-injection.md` | Template | Evaluator spot-check rules + QA checklist | 400+ LOC |
| `skills/데이터분석가-auto-injection.md` | Template | Data-analyst 5-step validation + SQL templates | 450+ LOC |
| `skills/번역가-auto-injection.md` | Template | Translator critical patterns + workflow | 350+ LOC |
| `skills/플레너-auto-injection.md` | Template | Planner design priority order + glossary | 400+ LOC |
| `skills/비서-auto-injection.md` | Template | Secretary monthly checklist + escalation | 350+ LOC |
| `PHASE4_AUTO_INJECTION_SPEC.md` | Spec | This document — technical specification | 50+ KB |
| `skills/TEMPLATE_USAGE_METRICS.json` | Metrics | Activation logs for feedback loop | Grows over time |
| `skills/TEMPLATE_UPDATE_LOG.md` | Log | Template change history + rationale | Updates monthly |

---

**Specification Version:** 1.0.0  
**Effective Date:** 2026-06-05  
**Next Review:** 2026-07-05 (Post-Phase-4-Rollout)
