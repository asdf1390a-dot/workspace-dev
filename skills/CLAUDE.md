# 🎓 Skills Templates — Auto-Injection Usage Guide

**Status:** Phase 3 Framework (2026-06-05)  
**Purpose:** How and when each team member loads their auto-injection template  
**Audience:** All team members

---

## Overview: What Are These Templates?

Each template is a **distilled checklist** extracted from that role's learnings.md:

- **Input:** Role learnings (100-400 LOC) containing patterns, edge cases, best practices
- **Output:** Focused template (100-500 LOC) with prioritized rules + mandatory checks
- **Use:** Load at task start → verify checklist at task end

**Benefit:** No pattern re-invention. Immediate guidance. Built-in quality gates.

---

## 🌐 웹개발자 (Web Developer)

### Template File
`skills/웹개발자-auto-injection.md` (1171 LOC)

### When to Load
- ✅ Creating new API endpoint
- ✅ Building new React component with data fetching
- ✅ Connecting form to Supabase
- ✅ Setting up environment variables
- ✅ Handling authentication in routes

### Core Rules (Load These First)
1. **Supabase Client Separation** (§1)
   - Server-side: `createServerClient()` with service role key
   - Client-side: `createBrowserClient()` with anon key
   - Never mix → prevents token exposure

2. **Environment Variables** (§2)
   - `NEXT_PUBLIC_*` only for browser-safe values
   - `SUPABASE_SERVICE_ROLE_KEY` server-only
   - Check: `.env.local` in `.gitignore`

3. **Route Protection** (§3)
   - API routes: verify user `auth.getUser()` before query
   - Redirect on unauthorized: `redirect('/login')`
   - Validation: input type-check before DB operation

4. **Server Component Data** (§4)
   - Fetch in server component `async` body
   - Pass only serializable data to client
   - Never expose secrets in props

5. **TypeScript Safety** (§5)
   - All Supabase queries typed
   - Error responses handled
   - Database schema changes → regenerate types

### Quick Checklist Before Commit
- [ ] Supabase client separation verified (server vs client)
- [ ] Environment variable not exposed in client
- [ ] Route protected (auth check before DB access)
- [ ] Data serializable (no functions in props)
- [ ] TypeScript compilation clean (no `any`)
- [ ] Error handling on all async operations

### Example Violation (Anti-pattern)
```javascript
// ❌ WRONG: Exposes service role token to client
const { data } = await createBrowserClient()
  .from('users')
  .select('*');

// ✅ RIGHT: Server-only operation with proper client
const { data } = await createServerClient()
  .from('users')
  .select('*');
  // then return to client as serialized props
```

---

## 🔍 평가자 (QA Evaluator)

### Template File
`skills/평가자-spot-check-template.md` (383 LOC)

### When to Load
- ✅ Testing new feature before release
- ✅ Spot-checking data quality
- ✅ Verifying deployment success
- ✅ Regression testing after deploy

### Core Rules (Mandatory)
1. **10-Sample Minimum** (§1)
   - Never test 1-3 cases
   - Always grab 10 samples from production-like data
   - Check data diversity (different asset types, timestamps, states)

2. **3 Mandatory Edge Cases** (§2)
   - **Network Delay:** Simulate slow response (add 5s delay to API)
   - **Missing Permissions:** Test as different user roles
   - **Boundary Values:** Test at limits (empty lists, max dates, 0 amounts)

3. **5-Area Validation** (§3)
   - **Data Accuracy:** Correct values displayed
   - **Visual Correctness:** UI layout, no overflow, readable
   - **Interaction:** Buttons work, forms accept/reject properly
   - **Performance:** Loads in <3 seconds
   - **Error States:** Error messages appear on failures

### Spot Check Checklist Template
Use this for every test:
```
[ ] 10 samples selected? (asset types: _____)
[ ] Network delay test (API +5s) — OK?
[ ] Permission test (as role: _____) — OK?
[ ] Boundary test (empty case, max case) — OK?
[ ] Data accuracy check — 10/10 correct?
[ ] Visual check — layout OK, no overflow?
[ ] Interaction check — all buttons work?
[ ] Performance check — <3sec load time?
[ ] Error state check — error message appears?
```

### When You Find a Bug
- Document: what, where, how to reproduce
- Severity: Blocker | Critical | Major | Minor
- Do NOT fix (QA ≠ developer)
- Create GitHub issue with checklist above

### Example Violation (Anti-pattern)
```
❌ "Tested the form with my test user. Looks good."
   → No sample size, no edge cases, no checklist

✅ "10 samples tested (5 assets × 2 time ranges). 
    Network delay +5s: OK. Missing-permission user: shows error. 
    Boundary: empty list, max date all handled. 
    Performance: 1.8s load. All checks passed."
```

---

## 📊 데이터분석가 (Data Analyst)

### Template File
`skills/데이터분석가-validation-template.md` (442 LOC)

### When to Load
- ✅ Validating new API endpoint
- ✅ Verifying database migration
- ✅ Checking data transformation logic
- ✅ Spot-checking BM event KPIs

### Core Rules (5-Step Pipeline)
1. **Requirements → API Spec** (§1)
   - What does API promise? (input, output, error cases)
   - Check: spec matches developer's code comments

2. **API Response Validation** (§2)
   - Call API with test data
   - Verify: structure, data types, error responses
   - Check: handles edge cases (empty, null, max values)

3. **Database Validation** (§3)
   - SQL: query underlying table directly
   - Compare: API response vs raw DB query
   - Verify: FK relationships, data consistency

4. **Business Logic Validation** (§4)
   - If API transforms data: verify calculation
   - Example: BM "urgency" calculation → test with known values
   - Verify: formula matches requirements

5. **Final Sign-Off** (§5)
   - All 4 steps passed?
   - API deployment approved? ✅
   - Add approval note to issue

### API Validation Checklist
```
[ ] Requirements spec matches API code?
[ ] API returns correct structure (test with curl)?
[ ] All data types correct (string, int, date)?
[ ] Error cases handled (missing param, invalid ID)?
[ ] Empty case handled (0 results)?
[ ] DB query matches API response?
[ ] FK relationships valid?
[ ] Business logic verified (calculation test)?
[ ] All edge cases passed?
```

### Example Validation Query (Template)
```sql
-- Step 3: Validate API response against raw DB
SELECT 
  id, 
  asset_id, 
  failure_code_id,  -- verify FK exists
  priority_score,
  created_at
FROM bm_events
WHERE created_at >= NOW() - INTERVAL '1 day'
LIMIT 10;

-- Compare results: API response should match query results
```

---

## 🌍 번역가 (Translator)

### Template File
`skills/translate-biz-kr-en/SKILL.md` (107 LOC, updated)

### When to Load
- ✅ Translating HQ email/notice to plant staff
- ✅ Translating complaint/feedback back to Korean
- ✅ Creating bilingual documentation
- ✅ Any Korean ↔ English business communication

### 5 Critical Patterns (Mandatory)

1. **Urgency Detection** (prevent softening)
   - Korean: "긴급!" = Urgent → Don't soften to "Soon"
   - Korean: "반드시" = Must → Not "should"
   - Check: English preserves urgency tone

2. **Term Consistency** (glossary-based)
   - Always check glossary SSOT first
   - Never invent English equivalents
   - Example: "모터 소손" = "Motor burnt out" (from glossary, not "motor failure")

3. **Tone/Register Calibration**
   - HQ → Formal (plant staff expect authority)
   - Plant feedback → Professional but accessible
   - India staff → clear, no idioms

4. **Abbreviation Expansion**
   - Korean abbreviations often need expansion
   - Example: "BM" → "Breakdown Maintenance" (not just "BM")
   - Check: Indians unfamiliar with internal abbreviations

5. **Time-Sensitive Preservation**
   - Korean: "오늘" = "today" (not "in the near future")
   - Deadlines: preserve exact dates/times
   - Check: urgency not lost in translation

### Pre-Submit Checklist
```
[ ] Glossary terms checked (all Korean terms → glossary ID)?
[ ] Urgency preserved (긴급/반드시 → urgent/must)?
[ ] Abbreviations expanded (BM → Breakdown Maintenance)?
[ ] Tone appropriate for audience (HQ/plant/India)?
[ ] Dates/times exact (not "soon", specific date)?
[ ] No cultural idioms (Indians may not understand)?
```

### Example Violation (Anti-pattern)
```
❌ HQ: "긴급! 오늘 모터 점검 반드시 해야함"
   WRONG: "Motor inspection coming up soon"
   → Loses urgency, loses today deadline

✅ "URGENT: Motor inspection MUST be completed TODAY"
   → Preserves urgency, deadline, and tone
```

---

## 📋 비서 (Secretary/Team Coordinator)

### Template File
`skills/비서-auto-checklist.md` (340 LOC)

### When to Load
- ✅ Monthly team coordination meeting
- ✅ Pre-deployment gate review
- ✅ Glossary drift detection
- ✅ Team priority alignment check

### 5 Monthly Checkpoints

1. **Glossary SSOT Consistency** (§1)
   - 3-layer check: Database schema matches UI labels matches translations
   - Spot-check 10 glossary entries
   - Verify: no one created local terms outside glossary

2. **BM Input Data Quality** (§2)
   - Check recent BM entries for quality
   - Verify: all required fields filled
   - Check: no obvious data entry errors

3. **Deployment Verification** (§3)
   - Last deployment → verify all features working
   - Spot-check: 10 random features
   - Verify: no regressions

4. **Team Priority Alignment** (§4)
   - Check: all team members know current P1/P2/P3 items
   - Verify: no one working on outdated tasks
   - Alignment: priorities match CTB/leadership

5. **Escalation Review** (§5)
   - Review: escalations from last month
   - Status: resolved? still pending? blocked?
   - Action: create tickets for unresolved

### Monthly Coordination Checklist
```
[ ] Glossary 3-layer check done (DB/UI/Translation)?
[ ] 10 glossary entries spot-checked?
[ ] BM data quality sample reviewed (10 entries)?
[ ] Last deployment features verified (10 random)?
[ ] All team members know current P1/P2/P3?
[ ] Escalations from last month reviewed?
[ ] All unresolved escalations → GitHub issues?
```

### When to Escalate
- Glossary drift detected in >2 places
- BM data quality issues >10%
- Deployment regression found
- Team priority misalignment
- Escalation unresolved >7 days

---

## 🏗️ 플레너 (Architect/Designer)

### Template File
`skills/플레너-design-template.md` (428 LOC)

### When to Load
- ✅ Designing new UI feature
- ✅ Planning database schema change
- ✅ Creating new API endpoint architecture
- ✅ Structuring component hierarchy

### Design Order (Mandatory Sequence)
1️⃣ **Glossary First** (§1)
   - What terms exist? Create 4-column glossary entries
   - Example: "urgency" → field_key=`priority_level`, label_ko=`긴급도`, label_en=`urgency level`, source=`ui`

2️⃣ **Database Schema** (§2)
   - Foreign keys to glossary table
   - Example: `priority_id INT REFERENCES glossary(id)`
   - Never hard-code strings

3️⃣ **UI Components** (§3)
   - Progressive Disclosure: required first, optional hidden
   - Context header: prevent form-submit confusion
   - Dropdowns reference glossary (auto-populated, no hard-code)
   - AI suggestions with validation gate

4️⃣ **API Endpoints** (§4)
   - Input validation
   - Error responses
   - Rate limiting

5️⃣ **Deployment & Testing** (§5)
   - CLAUDE.md hierarchy
   - Component dependency mapping
   - Data flow visualization

### Design Checklist
```
[ ] Glossary 4-column structure created (field_key | ko | en | source)?
[ ] All UI labels reference glossary (not hard-coded)?
[ ] DB Foreign Keys → glossary (no string columns)?
[ ] UI Progressive Disclosure (required visible, optional hidden)?
[ ] Context header added (prevent form confusion)?
[ ] Dropdowns populated from glossary (dynamic)?
[ ] API validation on all inputs?
[ ] Error messages meaningful (not technical)?
[ ] CLAUDE.md hierarchy planned (root/pages/api/components)?
[ ] Component deps mapped (what depends on what)?
[ ] Data flow diagram created (input → DB → output)?
```

### CLAUDE.md Hierarchy Template
```
Your project root:
  CLAUDE.md (global team rules)
  ├── pages/CLAUDE.md (page-specific: forms, navigation)
  ├── pages/api/CLAUDE.md (API route: validation, auth)
  └── components/CLAUDE.md (component: dependencies, data flow)

Rule of thumb:
- Start at root CLAUDE.md (read global rules)
- Go to relevant subfolder CLAUDE.md (get specific rules)
- Apply to your file
```

### Example Design Order (Anti-pattern)
```
❌ WRONG:
1. Design UI first (create form)
2. Then design DB (oh wait, what columns?)
3. Then create glossary (why is this last?)

✅ RIGHT:
1. Define terms → glossary (what is "urgency"?)
2. Create DB with FK to glossary
3. Build UI dropping from glossary (no hard-coded strings)
4. Build API with input validation
5. Plan CLAUDE.md structure before coding
```

---

## 🎯 How to Use These Guides in Practice

### Scenario 1: You're a Web Developer Starting API Work
```
1. Task: "Add BM event endpoint"
2. Find your role: web-builder
3. Open template: skills/웹개발자-auto-injection.md
4. Read Overview (first 50 lines)
5. Find section: "API Development Rules"
6. Go through checklist point by point
7. Before commit: verify all checks ✅
8. Commit message: reference template
   "feat(api): Add BM event endpoint [웹개발자-auto-injection.md §Route Protection]"
```

### Scenario 2: You're a QA Evaluator Before Release
```
1. Task: "QA test new BM form"
2. Find your role: evaluator
3. Open template: skills/평가자-spot-check-template.md
4. Use spot-check checklist template (copy-paste)
5. Fill in: your 10 samples, edge cases tested, results
6. Document any bugs found
7. Sign-off: date + all checks passed
```

### Scenario 3: You're a Designer Starting Feature
```
1. Task: "Design asset metadata management UI"
2. Find your role: planner
3. Open template: skills/플레너-design-template.md
4. Follow 5 steps in order: glossary → DB → UI → API → testing
5. Create CLAUDE.md structure before implementation
6. Generate component dependency diagram
7. Sign-off: all design checkpoints verified
8. Hand off to developer (reference CLAUDE.md hierarchy)
```

---

## 📍 Template Not Covering Your Situation?

**Step 1:** Evaluate if you missed a section
- Re-read template "Overview"
- Check all sections (maybe your case is in a later section)

**Step 2:** If truly new scenario
- Complete your task as best you can
- Document what was missing: "X case not covered"
- Create GitHub issue or comment

**Step 3:** Update template
- Add new rule/example to template
- Commit: `Template: Add X case to 역할-template.md`
- Notify team: "Added new case for X in your template"

**Step 4:** Use updated template next time
- You've now expanded the collective knowledge

---

## 🔗 Parent Documents

- **CLAUDE.md** (root) — global team rules + registry
- **TEAM_SKILL_ACTIVATION_PLAN.md** — overall strategy
- **[각 역할 learnings.md]** — full source material (100-400 LOC each)

---

**Last Updated:** 2026-06-05 03:15 KST  
**Audience:** All team members  
**Version:** 3.0 (Phase 3 Integration Complete)
