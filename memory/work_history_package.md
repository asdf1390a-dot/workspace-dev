---
name: 신규팀원 온보딩용 작업 이력 패키지
description: 완성된 설계 문서, 코드 패턴, 문서 구조, 팀 커뮤니케이션 프로토콜 (Web-Builder AI Agent 온보딩용)
type: reference
date: 2026-05-18
---

# 작업 이력 패키지 — 신규 웹개발자 온보딩 참고자료

## 📚 완료된 설계 문서 (보존된 포트폴리오)

### Phase 2 Projects (2026-05-16 ~ 06-03)

1. **Backup App Phase 2 — Auto-Backup & Metrics (16 APIs, 4 DB tables)**
   - File: `project_backup_phase2_completion_report.md`
   - Scope: Automated daily backups, storage quotas, notification system, metrics dashboard
   - APIs: 16 endpoints (schedule, quota, metrics, cleanup, notifications)
   - DB: 4 new tables (backup_policies, backup_storage_quotas, backup_notifications, backup_metrics)
   - Deliverables: 50K design doc + 32K API guide + 11K summary
   - Status: ✅ COMPLETED design → Ready for implementation

2. **Asset Master Phase 2 — CRUD & Advanced Features (25 APIs, 506 assets)**
   - File: `project_asset_master_v2_api_guide_extended.md`
   - Scope: Complete asset lifecycle (create, read, update, delete, QR, history, import/export, statistics)
   - APIs: 25 endpoints (CRUD, QR scanning, audit trail, bulk import, analytics)
   - Database: 3-level code scheme + asset master table + QR tracking + history logs
   - Deliverables: Entity relationship diagrams + API specifications + validation rules
   - Status: ✅ COMPLETED design → Phase 2 development in progress

3. **Travel Management Phase 1-2 — Request & Approval Workflow**
   - File: `project_travel_management_phase1_api.md` + `project_travel_management_phase2_ui_plan.md`
   - Scope: Travel request submission, manager approval, reimbursement tracking, budget reporting
   - APIs: 13 endpoints (requests, approvals, reimbursements, reports)
   - DB: 8 tables (users, requests, itineraries, approvals, reimbursements, budgets, reports, documents)
   - UI: 6 tabbed interface + 13 components (form, approval grid, report charts)
   - Status: ✅ Phase 1 API COMPLETE → Phase 2 UI development starting

4. **BM (Breakdown Management) Module — Incident Tracking**
   - File: `project_bm_module_design.md`
   - Scope: Equipment failure logging, failure code selection, AI recommendations, monthly spot-checks
   - DB: 11 new columns for BM event tracking
   - UI: 6 new components (BM form, failure code dropdown, recommendations panel, stats dashboard)
   - Features: AI-suggested codes, monthly 10-record data quality validation, MTBF/MTTR KPI calculation
   - Status: ✅ COMPLETED design → Phase 1 form implementation in progress

5. **Audit System Framework — Reliability Monitoring (3-day implementation)**
   - File: `project_audit_system_framework.md`
   - Scope: Daily reliability scoring (95% target), user impact metrics, alert system, trend analysis
   - Implementation: Vercel Cron (30s polling), Discord #감시시스템 reporting, email alerts
   - Metrics: DRS (Daily Reliability Score) staged rollout (90% W1→W2 → 92% W3→W4 → 95% W7+)
   - Status: ✅ APPROVED by team (conditional, 4/4 conditions met) → Start 2026-05-20

6. **Discord Bot Phase 1 — Telegram ↔ Discord Sync (Option B)**
   - File: `project_discord_bot_phase1.md`
   - Scope: Bidirectional message synchronization between Telegram and Discord
   - Architecture: Telegram Bot API + Discord.js, AWS Lambda triggers, message deduplication
   - Deployment: Vercel + AWS, environment variables (TELEGRAM_BOT_TOKEN, DISCORD_WEBHOOK_URL)
   - Status: ⏳ Implementation plan ready, deployment blocked on env var entry (user vacation)

---

### Reference Documents (Architecture & Standards)

1. **Code Pattern Library** (from team learnings)
   - `Web-Builder AI Agent-learnings.md` (910 lines): Next.js + Supabase patterns
   - `Evaluator AI Agent-learnings.md` (119 lines): QA methodology
   - `Planner AI Agent-learnings.md` (152 lines): Architecture decisions
   - `비서-learnings.md` (100 lines): Team coordination patterns

2. **Glossary-Driven Architecture**
   - Single `glossary` table (field_key, label_ko, label_en, source_system)
   - Drives 3 layers: Database schema naming → UI label rendering → Translation documentation
   - Eliminates redundant sync work between translation/schema/UI teams
   - **Monthly spot-check requirement:** Verify glossary ↔ DB ↔ UI consistency (10-record random sample)

---

## 🔧 Core Code Patterns (5 Essential)

### Pattern 1: Server Component Auth + Suspense
**File:** Next.js page component with authentication
```
Flow: createServerClient → getClaims() [CRITICAL: never getUser()!] → Suspense → redirect() → revalidatePath()

Key Points:
- getClaims() is synchronous (cached), getUser() is network call (unpredictable)
- Always wrap async operations in Suspense boundary
- Use redirect() in Server Component (prevents client hydration mismatch)
- revalidatePath() after mutation to refresh cache
```

**When to use:** Every authenticated page, API route, or Server Action

---

### Pattern 2: Supabase Real-time Subscription
**File:** React Client Component or Server Action hook
```
Setup: const channel = supabase.channel('public:table_name')
  .on('postgres_changes', 
    { event: 'INSERT|UPDATE|DELETE', schema: 'public', table: 'table_name' },
    (payload) => { /* handle state update */ }
  )
  .subscribe()

Cleanup: .unsubscribe() on unmount
```

**When to use:** Real-time dashboards, live notifications, collaborative editing

---

### Pattern 3: Glossary-Driven 3-Layer Architecture
**Files:** `db/migrations/*.sql` → `types/glossary.ts` → `components/*.tsx`

```
Step 1 (Schema): CREATE TABLE glossary (field_key TEXT, label_ko TEXT, label_en TEXT, source_system TEXT)
Step 2 (DB): ALTER TABLE bm_events ADD COLUMN failure_code VARCHAR REFERENCES glossary(field_key)
Step 3 (UI): const labels = glossary.find(g => g.field_key === 'failure_code'); 
           <select>{labels.map(l => <option>{l.label_ko}</option>)}</select>

Critical: Do NOT hardcode labels in UI. Always query glossary table at build/render time.
Monthly validation: Random 10-record query on each table → verify glossary match → spot-check UI rendering
```

**When to use:** Any multi-language or shared vocabulary (enums, categories, status values)

---

### Pattern 4: Progressive Disclosure Form (Mobile UX)
**File:** React form component with optional details
```
Structure:
<form>
  <input name="required_field_1" required />
  <input name="required_field_2" required />
  
  <details>
    <summary>추가 정보</summary>
    <input name="optional_field_1" />
    <input name="optional_field_2" />
    <textarea name="notes" />
  </details>
  
  <button type="submit">제출</button>
</form>

Benefits: 
- Mobile screens show 2 required fields only (clean)
- Power users expand <details> for optional fields
- No "required" validation on hidden fields initially
```

**When to use:** Mobile-first forms (BM incident form, travel request, asset details)

---

### Pattern 5: Monthly Data Quality Spot-Check (QA Routine)
**File:** `lib/qA/monthly-spot-check.ts`

```
Procedure (10-record sample, monthly):
1. SELECT * FROM bm_events ORDER BY RANDOM() LIMIT 10
2. For each row:
   - failure_code value → match against glossary?
   - If mismatch: log as defect (QA issue #XXX)
3. Monthly report: X/10 records passed, Y failures, trend analysis
4. Escalate if failure rate > 5%

Why: Prevents garbage-in-garbage-out (users can select wrong codes)
When: First of each month (2026-06-01, 07-01, etc.)
Ownership: Evaluator AI Agent (QA team)
```

**When to use:** Any user-selectable dropdown (BM failure codes, asset categories, travel expenses)

---

## 📖 Documentation Structure

### CLAUDE.md Template (User Instructions)
**Location:** Root directory, defines team behavior
**Sections:** (read current file for full format)
- User role & preferences
- Code style guidelines
- Task completion standards
- Communication protocols
- Tool permission settings

**Key rule for new developer:** "Read CLAUDE.md first, then submit PRs."

### Settings.json Hooks (Automation)
**Location:** `.claude/` directory
**Examples:**
- `pre-commit`: Lint + type-check before staging
- `post-merge`: Run tests + update MEMORY.md
- `deploy-webhook`: Trigger Vercel redeploy after merge

**For new developer:** Hooks are automatic, no manual intervention needed.

### Team Communication Pattern (GitHub / Discord / Telegram)

| Channel | Content | Frequency | Owner |
|---------|---------|-----------|-------|
| GitHub Issues | Technical blockers, code reviews | Per PR | Web team |
| Discord #일반 | Daily standups, team decisions | 08:00, 14:00, 15:00, 18:00 | Secretary (비서) |
| Telegram | Final results + user-facing messages | Post-completion | Secretary |

**For new developer:** 
- GitHub: Always open an issue before starting a feature
- Discord: Report progress at 15:00 checkpoint (or earlier if blocked)
- Telegram: Never send (reserved for final user messages)

---

## 📋 Project File Index (36 Design Documents)

### Active Projects (31)
- `project_asset_master_phase2_roadmap.md` (5-day roadmap)
- `project_backup_phase2_completion_report.md` (16 APIs complete)
- `project_travel_management_phase2_ui_plan.md` (13-day frontend plan)
- `project_audit_system_framework.md` (3-day implementation)
- `project_discord_bot_phase1.md` (Telegram ↔ Discord sync)
- ... + 26 more (see MEMORY.md for full list)

### Reference Documents (3)
- `project_design_system.md` (UI kit, colors, typography)
- `project_phase_a_execution_rules.md` (daily checkpoint schedule)
- `project_context_loss_prevention_protocol.md` (backup procedures)

### Completed (1)
- `project_gateway_config_fix.md` (archived 2026-05-10)

**For new developer:** Read active projects' _summary.md files first (shorter overview), then dive into _api_guide.md for implementation details.

---

## 🎯 Team Consensus Patterns (Recognition Signals)

**When multiple team members independently identify the same problem → signal to prioritize it**

Examples from 2026-05-18:
1. **Evaluator + Planner both flagged:** BM data quality validation needed BEFORE feature completion
2. **Web-dev + Secretary both noted:** Asset Master API parallelization (40-60% split works)
3. **All 4 agreed on:** Audit System needs Vercel Cron (faster than Lambda, simpler than polling)

**Action:** When consensus pattern detected, escalate to user (never override alone)

---

## 💡 Learning Priorities for First Week

**Day 1-2 (Environment):**
- Clone DSC FMS repo, set up .env (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, etc.)
- Read CLAUDE.md + settings.json + current SOUL.md
- Review Web-Builder AI Agent-learnings.md (910 lines)

**Day 3-4 (Code Review):**
- Study project_backup_phase2_api_guide.md (32K, API design patterns)
- Study project_asset_master_v2_api_guide_extended.md (25 endpoints, CRUD patterns)
- Review Evaluator AI Agent-learnings.md + Planner AI Agent-learnings.md for QA/architecture perspective

**Day 5-7 (Independent Work):**
- Implement Task #1: Assign feature from current sprint
- Open GitHub issue → branch → PR with tests → Discord checkpoint
- Target: 1 complete API endpoint or component by Day 7

---

**Last Updated:** 2026-05-18 03:29 KST (TEXT ONLY synthesis, now persisted)
