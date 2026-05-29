---
name: AI Terminology Standardization Guide
description: Master reference for consistently describing AI agent roles throughout documentation (replaces human-team language with AI-specific terminology)
type: feedback
---

# AI Terminology Standardization Guide (2026-05-20)

## 🎯 Core Principle
**There is ONE human (CEO) + ONE AI Secretary system that operates in multiple specialized modes. No separate human team members exist.**

When documentation says "Web-Builder AI Agent" or "Planner AI Agent", it refers to AI operational modes, NOT separate people.

---

## 📋 Terminology Mapping

### Role Names
| Legacy | ❌ Problem | ✅ New Standard | Context |
|--------|-----------|-----------------|---------|
| `Web-Builder AI Agent` | Implies human developer | **Web-Builder AI Agent** | Code implementation work |
| `Evaluator AI Agent` | Implies human QA tester | **Evaluator AI Agent** | UI testing & code review |
| `Planner AI Agent` | Implies human architect | **Planner AI Agent** | Design & system architecture |
| `Data-Analyst AI Agent` | Implies human analyst | **Data-Analyst AI Agent** | Excel/Supabase data analysis |
| `자동화 전문가` | Implies human specialist | **Automation-Specialist AI Agent** | Cron/scheduling automation |
| `Translator AI Agent` | Implies human translator | **Translator AI Agent** | Korean↔English translation |
| `비서` | Implies human secretary | **Secretary AI** | Primary orchestrator (me) |

### Team References
| Legacy | ❌ Problem | ✅ New Standard |
|--------|-----------|-----------------|
| `팀원` (team member) | Implies humans | **AI Agent** or **Secretary** |
| `담당자` (assignee) | Implies person | **AI Agent role** |
| `팀 확장` | Implies hiring | **AI Agent Activation** or **Specialization Addition** |
| `팀원 온보딩` | Implies new people | **AI Agent Configuration** |
| `팀 구조` | Implies org chart | **AI Operational Modes** |

### Verb Phrases
| Legacy | ❌ Problem | ✅ New Standard |
|--------|-----------|-----------------|
| `Web-Builder AI Agent가 구현한다` | Active person | **Web-Builder AI Agent implements** |
| `Evaluator AI Agent 피드백` | Person evaluates | **Evaluator AI Agent provides feedback** |
| `Planner AI Agent가 설계한다` | Person designs | **Planner AI Agent designs** |
| `팀원이 보고한다` | Humans report | **AI Agent reports** or **Secretary reports** |
| `담당자에게 위임한다` | Delegate to person | **Delegate to Web-Builder AI Agent mode** |
| `팀 논의` | Team discussion | **AI Agent deliberation** or **Secretary analysis** |

---

## 🔄 Implementation Rules

### Rule 1: Role Attribution
**Old:** "Web-Builder AI Agent가 4개 API를 개발했다"  
**New:** "Web-Builder AI Agent implemented 4 APIs"

**Why:** Clarifies that the AI system (not a human) performed this work.

---

### Rule 2: Scheduling/Assignment
**Old:** "Web-Builder AI Agent 담당: Asset Master API"  
**New:** "Web-Builder AI Agent focus: Asset Master API"

**Why:** Avoids implying task assignment to a person.

---

### Rule 3: Task Status
**Old:** "Evaluator AI Agent: 기다리는 중"  
**New:** "Evaluator AI Agent: Awaiting input"

**Why:** Clarifies agent state vs. human waiting.

---

### Rule 4: Timeline
**Old:** "05-20 Web-Builder AI Agent 온보딩"  
**New:** "05-20 Web-Builder AI Agent activation"

**Why:** Reflects configuration, not hiring.

---

### Rule 5: Capacity
**Old:** "팀 용량: 49% → 100%"  
**New:** "AI Agent capacity utilization: 49% → 100%"

**Why:** Clear that we're scaling AI operations, not hiring people.

---

## 🗂️ Context-Specific Examples

### Example 1: Project Brief
**Before:**
```
Web-Builder AI Agent가 Asset Master Phase 2를 담당합니다.
일정: 5월 20-30일
```

**After:**
```
Web-Builder AI Agent focuses on Asset Master Phase 2.
Timeline: May 20-30
```

---

### Example 2: Status Report
**Before:**
```
팀원 진행 현황:
- Web-Builder AI Agent: API 구현 진행 중
- Evaluator AI Agent: 테스트 대기 중
```

**After:**
```
AI Agent status:
- Web-Builder AI Agent: API implementation in progress
- Evaluator AI Agent: Awaiting test package
```

---

### Example 3: Onboarding
**Before:**
```
신규 팀원 Web-Builder AI Agent 온보딩 (Day 1-3)
```

**After:**
```
Web-Builder AI Agent Configuration (Day 1-3)
```

---

### Example 4: Feedback Loop
**Before:**
```
Evaluator AI Agent 피드백: 색상 대비가 부족합니다
```

**After:**
```
Evaluator AI Agent feedback: Color contrast needs improvement
```

---

## ✅ Application Checklist

Apply these rules to ALL documents containing:
- [ ] Role names (Web-Builder AI Agent, Evaluator AI Agent, Planner AI Agent, etc.)
- [ ] "팀원" (team member)
- [ ] "담당자" (assignee)
- [ ] "팀" references implying human group
- [ ] Onboarding/hiring language
- [ ] Capacity/team expansion phrasing
- [ ] Status reports about "who is doing what"

---

## 🎓 Decision Logic

**When in doubt, ask: "Does this imply a separate human person?"**

- ❌ Yes → Replace with AI Agent terminology
- ✅ No → Can keep as-is

**Example:**
- "팀 논의" → Could mean humans discussing → Replace with "Secretary analysis" or "AI Agent deliberation"
- "팀 일정" → Could mean team calendar → Replace with "AI Operations Schedule"
- "팀 문서" → Neutral, can keep (it's just documentation)

---

## 📝 Files Affected (74 files identified)

**Critical (Directly Referenced in MEMORY.md):**
- active_work_tracking.md — Team member references in status
- team_capacity_matrix_final.md — Role assignments
- project_audit_system_*.md (12 files) — Evaluator references
- project_asset_master_*.md (9 files) — Web-builder references
- project_backup_phase2_*.md (4 files) — API developer references
- project_travel_management_*.md (5 files) — Design roles

**Secondary (Design Documents):**
- automation_specialist_*.md — Role descriptions
- devops_engineer_*.md — Role assignment
- web_builder_onboarding.md — Role terminology
- Evaluator/Planner onboarding docs

---

## 📌 Implementation Priority

1. **IMMEDIATE (今日):** MEMORY.md + active_work_tracking.md
2. **Hour 1:** All 12 Audit System docs
3. **Hour 2:** All Asset/Backup/Travel design docs (18 files)
4. **Hour 3:** Onboarding templates (6 files)
5. **Hour 4:** Remaining 74 files (batch update)

---

## 🚀 Automated Application Strategy

For bulk updates, use find+replace patterns:

```bash
# Pattern 1: Web-Builder AI Agent → Web-Builder AI Agent
sed -i 's/Web-Builder AI Agent/Web-Builder AI Agent/g' file.md

# Pattern 2: Evaluator AI Agent → Evaluator AI Agent
sed -i 's/Evaluator AI Agent/Evaluator AI Agent/g' file.md

# Pattern 3: Planner AI Agent → Planner AI Agent
sed -i 's/Planner AI Agent/Planner AI Agent/g' file.md

# Pattern 4: 팀원 → AI Agent
sed -i 's/팀원/AI Agent/g' file.md
```

---

**Created:** 2026-05-20 10:45 KST  
**Status:** Ready for application  
**Next:** Batch update all 74 files with standardized terminology
