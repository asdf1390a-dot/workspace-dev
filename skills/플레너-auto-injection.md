---
name: 플레너-auto-injection
description: Auto-injection template for planner role. Design priority order + glossary SSOT approach.
type: agent-system-instructions
phase: 4
applies_to: planner
activation_pattern: ui-db-design, fullstack-feature
---

# 플레너 (Planner) — Auto-Injection Template

**Auto-loaded when:** Task mentions design/schema/architecture AND agentRole=planner

---

## 🔴 설계 우선순위 순서 (ENFORCE THIS SEQUENCE)

**Golden Rule:** Design in this order. Never skip steps. Breaking this sequence causes downstream rework.

### Step 1️⃣ : Glossary Definition First
**Goal:** Define terms BEFORE designing schema. Prevents terminology drift.

**Actions:**
- [ ] List all NEW terms for this feature
- [ ] Define each term in plain English (no jargon)
- [ ] Check CLAUDE.md GLOSSARY for existing definitions
- [ ] If term exists: Use existing definition, don't redefine
- [ ] If term new: Add to GLOSSARY with source (e.g., "Proposed by product for Q2")
- [ ] Minimum: 3 new glossary entries per feature

**Example:**
```
Feature: Travel Cost Management Module

NEW GLOSSARY TERMS:
1. Settlement
   Definition: Final calculation of who owes whom after trip expenses are paid
   Scope: Covers refunds, individual payment adjustments
   
2. Breakdown (existing term, confirm usage)
   Definition: Individual expense line item (lunch=$15, hotel=$100, etc.)
   Confirm with: BM module (Breakdowns Management)
   
3. Cost Split
   Definition: Division of total expense among trip members
   Method: Per-person equal split, or custom % allocation
   Example: $100 lunch split 3 ways = $33.33 each
```

**Validation:**
- [ ] No term defined twice (check GLOSSARY for duplicates)
- [ ] Each definition is plain English (no circular definitions)
- [ ] Minimum 3 terms captured
- [ ] Product team can read + understand each definition

---

### Step 2️⃣ : Database Schema Design
**Goal:** Design normalized schema that implements glossary terms + supports RLS.

**Actions:**
- [ ] Create tables for major entities (from glossary)
  - Example: `trips`, `members`, `expenses`, `settlements`
- [ ] Define columns (field names, types, nullable)
- [ ] Add relationships (foreign keys, constraints)
- [ ] Plan for RLS (which user owns/can access each row?)
- [ ] Normalize (no data duplication across tables)

**Example:**
```sql
CREATE TABLE trips (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expenses (
  id BIGINT PRIMARY KEY,
  trip_id BIGINT REFERENCES trips,
  amount DECIMAL NOT NULL,
  description TEXT,
  category TEXT, -- Breakdown type (lunch, hotel, etc.)
  payer_id UUID REFERENCES auth.users,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settlements (
  id BIGINT PRIMARY KEY,
  trip_id BIGINT REFERENCES trips,
  payer_id UUID REFERENCES auth.users,
  payee_id UUID REFERENCES auth.users,
  amount DECIMAL NOT NULL,
  settled_at TIMESTAMP
);
```

**RLS Planning:**
- [ ] User can view own trips (WHERE owner_id = current_user_id)
- [ ] User can view expenses on trips they're a member of
- [ ] Settlements only visible to involved parties (payer OR payee)

---

### Step 3️⃣ : Component Hierarchy & UI Structure
**Goal:** Define which pages/components needed + Progressive Disclosure rules.

**Actions:**
- [ ] List pages needed (e.g., `/trips/[id]/`, `/trips/[id]/expenses`, etc.)
- [ ] For each page: What information should show?
- [ ] Progressive Disclosure: What's hidden until user takes action?
- [ ] Define modals (edit, add, confirm, error states)
- [ ] Plan mobile vs desktop layouts

**Example:**
```
Travel Module Structure:

/trips
  └─ TravelListPage (shows: trip name, member count, next date)
      └─ TravelCard (compact view)
      └─ AddTravelButton → OpenTravelCreateModal

/trips/[id] (main trip page)
  └─ TravelOverviewTab (shows: name, dates, members, total cost)
  └─ TravelExpensesTab
      ├─ ExpenseList (shows: description, amount, payer)
      ├─ AddExpenseButton → OpenExpenseModal
      └─ SettlementDisplay (shows who owes whom)
  └─ TravelChecklistTab (e.g., passports, visas)
  └─ TravelScheduleTab (flight times, hotel check-in)

Components (UI Elements):
  ├─ TravelForm (create/edit trip)
  ├─ ExpenseForm (add/edit expense)
  ├─ MemberManagementModal (add/remove trip members)
  ├─ SettlementModal (confirm payment)
  └─ ErrorBoundary (catch form errors)

Progressive Disclosure Examples:
  - Expense edit form hidden until user clicks "Edit"
  - Settlement details hidden until "Show Calculation" clicked
  - Advanced filtering hidden in collapsible "More Filters" section
```

**Mobile Considerations:**
- [ ] Tabs convert to hamburger menu on mobile
- [ ] Forms optimized for touch (larger buttons, clearer spacing)
- [ ] Modals full-screen on mobile (not overlay)

---

### Step 4️⃣ : API Contracts
**Goal:** Define what data flows between frontend → backend.

**Actions:**
- [ ] For each page/component: What API calls needed?
- [ ] Define request format (query params, body, headers)
- [ ] Define response format (JSON structure, field types)
- [ ] Define error responses (400, 403, 500)
- [ ] Plan pagination (if lists >100 records)

**Example:**
```
API: GET /api/travels/[id]/expenses

Request:
  URL: /api/travels/123/expenses?limit=10&offset=0
  Headers: Authorization: Bearer <token>
  
Response (200 OK):
  {
    "data": [
      {
        "id": 456,
        "trip_id": 123,
        "description": "Lunch at restaurant",
        "amount": 25.50,
        "currency": "USD",
        "category": "meal",
        "payer": { "id": "user-1", "name": "Alice" },
        "created_at": "2026-06-05T11:00:00Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 42
    }
  }

Response (403 Forbidden):
  {
    "error": "Unauthorized",
    "message": "You don't have access to this trip"
  }
```

---

## 🟡 General Rules (Guidelines)

### Rule 1: Glossary SSOT (Single Source of Truth)
- CLAUDE.md GLOSSARY is THE authority for term definitions
- Before designing: Check if term already exists in GLOSSARY
- New term? Add to GLOSSARY, don't improvise local definitions
- Result: Entire team uses same terminology across UI/API/docs

### Rule 2: Normalize Your Schema
- Avoid data duplication (no storing user name + email in multiple tables)
- Use foreign keys to reference related entities
- Third Normal Form (3NF) minimum (eliminate transitive dependencies)

### Rule 3: RLS Planning from Start
- Don't add RLS as afterthought (rework required)
- Design schema + specify RLS policies simultaneously
- Test: Can user see only their data?

### Rule 4: Component Reusability
- If component appears 2+ times (different pages): Make reusable component
- Example: `<TravelCard>` used on both `/trips` list and modal preview
- Reduces code duplication + testing burden

### Rule 5: Error States Matter
- Design not just happy path, but error states too
- What happens if form submission fails?
- What if API returns 403 Forbidden?
- Plan error messages (see: 평가자-auto-injection for error message rules)

---

## 📋 Design Verification Checklist

**Before handing off to web-builder:**

### Glossary Completeness (10 min)
- [ ] All new terms defined (minimum 3)
- [ ] Existing terms cross-checked in CLAUDE.md GLOSSARY
- [ ] No duplicate definitions
- [ ] Definitions are plain English (non-technical users can understand)

### Schema Validation (15 min)
- [ ] Entity-Relationship diagram complete
- [ ] All tables have primary keys (id)
- [ ] Foreign key relationships defined
- [ ] RLS policies outlined for each table
- [ ] Normalized (no data duplication)
- [ ] Audit timestamps (created_at, updated_at) on all tables

### Component Hierarchy (15 min)
- [ ] Pages list complete (what routes needed?)
- [ ] Component tree defined (how do components nest?)
- [ ] Modals identified (add, edit, confirm, error states)
- [ ] Progressive Disclosure rules documented
- [ ] Mobile responsiveness planned

### API Contracts (15 min)
- [ ] All endpoints listed (GET, POST, PUT, DELETE)
- [ ] Request formats defined (query params, body structure)
- [ ] Response formats defined (JSON schema)
- [ ] Error responses included (400, 403, 500)
- [ ] Pagination planned (for lists >100 records)

### Design Decision Memo (5 min)
- [ ] Summarize glossary + schema + API decisions
- [ ] Include diagrams (ER diagram, component tree)
- [ ] State dependencies (e.g., "Settlement requires finalized expense list")
- [ ] 🟢 **READY FOR WEB-BUILDER** OR 🔴 **NEEDS REVISION**

---

## 🚨 Common Design Defects

### Defect 1: Skipping Glossary
- **Symptom:** Designer defines "settlement" as "final payment", developer calls it "reconciliation"
- **Fix:** Define ALL terms in GLOSSARY first, use consistently
- **Prevention:** Always Step 1 → Step 2 sequence

### Defect 2: Non-Normalized Schema
- **Symptom:** `expenses` table has columns: id, amount, user_id, user_name, user_email
- **Fix:** Create `users` table, reference with foreign key (user_id only)
- **Prevention:** Third Normal Form check — no data duplication

### Defect 3: No RLS Planning
- **Symptom:** API implemented, then later found user can see other users' expenses
- **Fix:** Plan RLS policies during schema design, not after
- **Prevention:** For each table, ask: "Can user X see row Y? Who owns this row?"

### Defect 4: Unclear Component Responsibility
- **Symptom:** Confusion whether ExpenseForm handles validation or API does
- **Fix:** Specify clearly — form validation (format check), API validation (business logic check)
- **Prevention:** Document each component's responsibility in component hierarchy

### Defect 5: Missing Error States
- **Symptom:** Happy path works, but form submission error → no error message shown
- **Fix:** Design error states alongside happy path
- **Prevention:** For every action (submit, save, delete), plan happy + error paths

---

## 📊 Design Decision Memo Template

```markdown
# Design Decision Memo — [Feature Name]

**Date:** [Date]  
**Planner:** [Name]  
**Feature:** [Feature description]  
**Status:** 🟢 APPROVED / 🔴 NEEDS REVISION

## 1️⃣ Glossary Definitions

### New Terms
- **Settlement:** [definition]
- **Breakdown:** [definition]
- **Cost Split:** [definition]

### Existing Terms (Confirmed)
- **Trip:** Uses existing definition from GLOSSARY

**Total new terms:** 3 ✅

## 2️⃣ Database Schema

[Include ER diagram]

### Tables
- `trips` (id, name, owner_id, dates)
- `expenses` (id, trip_id, amount, payer_id, category)
- `settlements` (id, trip_id, payer_id, payee_id, amount)

### RLS Policies
- `trips`: Users see own trips (owner_id = current_user)
- `expenses`: Users see expenses on trips they're members of
- `settlements`: Users see if they're payer or payee

## 3️⃣ Component Hierarchy

```
/trips
  └─ TravelListPage
      └─ TravelCard (per trip)
      
/trips/[id]
  └─ TravelOverviewTab
  └─ TravelExpensesTab
      └─ ExpenseList
      └─ SettlementDisplay
  └─ TravelChecklistTab
```

## 4️⃣ API Contracts

### GET /api/travels/[id]/expenses
- **Request:** /api/travels/123/expenses?limit=10&offset=0
- **Response:** { data: [...], pagination: {...} }
- **Errors:** 403 Forbidden (not member)

[... more endpoints ...]

## 5️⃣ Progressive Disclosure

- Expense edit form: Hidden until click "Edit"
- Settlement details: Hidden until "Show Calculation" clicked
- Advanced filters: Hidden in collapsible menu

## Sign-Off

- [ ] Glossary complete (3+ new terms)
- [ ] Schema normalized + RLS planned
- [ ] Component hierarchy clear
- [ ] API contracts defined
- [ ] Error states documented
- [ ] Ready for web-builder

**Approved by:** [Planner name]  
**Date:** [Date]
```

---

## 🔗 CLAUDE.md Hierarchy

Update CLAUDE.md with this structure:

```markdown
## Travel Module Design (Phase 2)

### Global Level (applies to all Travel features)
- BM = Breakdowns Management (reference to BM module)
- Settlement = Final payment calculation
- Cost Split = Division of expense among members

### Page Level (/travels/[id])
- TravelOverviewTab: Trip metadata + member list
- TravelExpensesTab: Add/view/settle expenses
- TravelScheduleTab: Flight times, hotel check-in

### API Level (/api/travels/...)
- POST /api/travels: Create new trip
- GET /api/travels/[id]/expenses: List trip expenses
- POST /api/travels/[id]/expenses: Add expense
- POST /api/travels/[id]/settlements: Finalize settlement

### Component Level
- TravelForm: Create/edit trip (validates name, dates)
- ExpenseForm: Add/edit expense (validates amount, category)
- SettlementDisplay: Show who owes whom (read-only)
```

---

**Auto-loaded for:** `ui-db-design` + `fullstack-feature` task patterns  
**Version:** Phase 4.0  
**Last Updated:** 2026-06-05
