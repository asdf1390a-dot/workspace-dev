# 🎯 Team Skills Auto-Injection Framework — CLAUDE.md Root

**Status:** Phase 3 Agent Integration Active (2026-06-05)  
**Purpose:** Auto-activate learnings templates based on role + task type  
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
| **평가자** | `skills/평가자-spot-check-template.md` | QA 테스트, 배포 검증 | 10건 샘플 검증, 3개 엣지케이스 (네트워크/권한/경계값) |
| **데이터분석가** | `skills/데이터분석가-validation-template.md` | API 검증, DB 마이그레이션 | 5단계 검증 (요구사항→응답→DB→로직→판정), SQL 템플릿 제공 |
| **번역가** | `skills/translate-biz-kr-en/SKILL.md` | 한영 비즈니스 번역 | 5가지 Critical Patterns (긴급도 감지, 용어 일관성, 톤 조정) |
| **비서** | `skills/비서-auto-checklist.md` | 월간 팀 조율, 배포 게이트 | Glossary 3층 일관성, BM 데이터 품질, 팀 우선순위 정렬 |
| **플레너** | `skills/플레너-design-template.md` | UI/DB 설계, 아키텍처 | 설계 순서 강제 (용어→스키마→UI), CLAUDE.md 계층 구조, 데이터 흐름 시각화 |

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

## 📊 Phase 3 Integration Status

### ✅ Completed (Phase 2)
- [x] 웹개발자-auto-injection.md (1171 LOC)
- [x] 평가자-spot-check-template.md (383 LOC)
- [x] 데이터분석가-validation-template.md (442 LOC)
- [x] translate-biz-kr-en/SKILL.md (107 LOC updated)
- [x] 비서-auto-checklist.md (340 LOC)
- [x] 플레너-design-template.md (428 LOC)

### 🔄 In Progress (Phase 3)
- [ ] Create `/skills/CLAUDE.md` — Template loading best practices
- [ ] Create `/pages/CLAUDE.md` — UI page structure rules (derived from planner template)
- [ ] Create `/pages/api/CLAUDE.md` — API route structure rules (derived from web-builder template)
- [ ] Create `/components/CLAUDE.md` — Component dependency mapping (derived from planner template)
- [ ] Update agent system instructions to reference this CLAUDE.md registry

### 📋 Pending (Phase 3)
- [ ] Auto-load mechanism: When agent invoked → search CLAUDE.md + load template
- [ ] Feedback loop: Track template usage (which sections help most)
- [ ] Monthly review: Update templates based on team feedback + lessons learned

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

**Last Updated:** 2026-06-05 03:10 KST  
**Maintainer:** Claude (CTB)  
**Version:** 3.0 (Phase 3 Integration Framework)
