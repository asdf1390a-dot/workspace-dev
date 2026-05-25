---
title: Travel Management Phase 2 — Component Hierarchy & Dependency Tree
author: Web Developer #2 AI (Day 1 Onboarding)
date: 2026-05-25
version: 1.0
status: Ready for Web Developer #1 Review
---

# Travel Management Phase 2 — Component Hierarchy & Dependency Tree

**Objective:** Map all 9 core UI components with priority order, dependency relationships, state management flows, and API integration points. Enable Web Developer #1 to identify implementation order and critical path.

---

## Executive Summary: Component Priority Matrix

| Priority | Component | Complexity | Dependencies | Day | Est. Hours |
|----------|-----------|-----------|--------------|-----|-----------|
| 🔴 P0 | TravelListPage | High | Zustand store, SWR hooks | Day 2 | 6 |
| 🔴 P0 | TravelDetailPage | High | Zustand, SWR, 5 child tabs | Day 3 | 5–6 |
| 🟡 P1 | EventManager | Medium | TravelDetail, API /events | Day 4 | 3.5 |
| 🟡 P1 | CostTracker | Medium | TravelDetail, API /costs | Day 4 | 3.5 |
| 🟡 P1 | ChecklistManager | Medium | TravelDetail, API /checklist | Day 5 | 3 |
| 🟡 P1 | DocumentUpload | Medium | TravelDetail, Supabase Storage | Day 5 | 3–4 |
| 🟢 P2 | MemberInviter | Medium-High | TravelDetail, RLS verification | Day 6 | 5–6 |
| 🟢 P2 | NotificationCenter | Low-Medium | TravelDetail, API /notifications | Day 7 | 3 |
| 🔵 P3 | TravelSettings | Low | TravelDetail, API PUT /travels/[id] | Day 7 | 2 |

**Color Legend:**
- 🔴 **P0 (Critical)** — Blocks other components; implement first
- 🟡 **P1 (High)** — Core feature components; implement after P0
- 🟢 **P2 (Medium)** — Advanced features; implement after P1
- 🔵 **P3 (Low)** — Polish/optional; implement last

---

## Component Tree Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Travel Module Root                            │
│  /app/travels/ (Next.js App Router)                             │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────────────────────┐
         │                                                         │
    ┌────▼─────────────────┐                        ┌────────────▼──┐
    │ TravelListPage ⭐P0   │                        │ TravelDetail  │
    │ /page.tsx            │                        │ /[id]/page.tsx│
    │ ⭐ CORE              │                        │ ⭐ CORE       │
    └────┬────────────────┬┘                        └────┬──────────┘
         │                │                              │
         │         ┌──────▼──────────┐                  │
         │         │ TravelListFilters│                 │
         │         │ Status/Sort/Scope│                 │
         │         └──────────────────┘                 │
         │                                              │
    ┌────▼──────────────────────────────────────────────▼───────────┐
    │         FILTERED TRAVEL LIST VIEW                              │
    │  TravelListTable / TravelListGrid                              │
    │  [Maps to TravelCard components]                               │
    └──────────────────────────────────────────────────────────────┘
                                   │
                            ┌──────▼────────┐
                            │ TravelCard    │
                            │ (List item)   │
                            └───────────────┘
                                  │
                     ┌────────────┴──────────────┐
                     │ Click to expand/navigate  │
                     └─────────────────────────┬─┘
                                              │
                  ┌─────────────────────────────▼──────────────────────┐
                  │ TravelDetailPage (/[id]/page.tsx) ⭐P0             │
                  │ ┌──────────────────────────────────────────────┐  │
                  │ │ TravelDetailHeader (title, actions)          │  │
                  │ └──────────────────────────────────────────────┘  │
                  │ ┌──────────────────────────────────────────────┐  │
                  │ │ TravelDetailTabs (tab navigation)            │  │
                  │ │                                              │  │
                  │ │  ┌─────────────────────────────────────────┐ │  │
                  │ │  │ TAB 1: Overview        (TravelSettings) │ │  │
                  │ │  │ - Travel name, location, dates          │ │  │
                  │ │  │ - Edit button (P3)                      │ │  │
                  │ │  └─────────────────────────────────────────┘ │  │
                  │ │  ┌─────────────────────────────────────────┐ │  │
                  │ │  │ TAB 2: Events        (EventManager) ⭐P1 │ │  │
                  │ │  │ - List events                           │ │  │
                  │ │  │ - Add/edit event (EventFormModal)       │ │  │
                  │ │  │ - Delete event                          │ │  │
                  │ │  │ → API: GET/POST/PUT /events            │ │  │
                  │ │  └─────────────────────────────────────────┘ │  │
                  │ │  ┌─────────────────────────────────────────┐ │  │
                  │ │  │ TAB 3: Costs         (CostTracker) ⭐P1  │ │  │
                  │ │  │ - Cost table (description, amount, etc) │ │  │
                  │ │  │ - Add cost (CostFormModal)              │ │  │
                  │ │  │ - Cost summary (total, per-member split)│ │  │
                  │ │  │ → API: GET/POST/PUT /costs             │ │  │
                  │ │  └─────────────────────────────────────────┘ │  │
                  │ │  ┌─────────────────────────────────────────┐ │  │
                  │ │  │ TAB 4: Checklist     (ChecklistManager)│ │  │
                  │ │  │ - Checkbox task list                    │ │  │
                  │ │  │ - Add/edit/delete items                 │ │  │
                  │ │  │ - Mark complete                         │ │  │
                  │ │  │ → API: GET/POST/PUT /checklist         │ │  │
                  │ │  └─────────────────────────────────────────┘ │  │
                  │ │  ┌─────────────────────────────────────────┐ │  │
                  │ │  │ TAB 5: Documents     (DocumentUpload)   │ │  │
                  │ │  │ - File list with upload date, size      │ │  │
                  │ │  │ - Drag-drop upload area                 │ │  │
                  │ │  │ - Download/delete buttons               │ │  │
                  │ │  │ → API: POST /documents + Storage        │ │  │
                  │ │  └─────────────────────────────────────────┘ │  │
                  │ │  ┌─────────────────────────────────────────┐ │  │
                  │ │  │ TAB 6: Members       (MemberInviter) ⭐P2│ │  │
                  │ │  │ - Current members + roles               │ │  │
                  │ │  │ - Invite new members                    │ │  │
                  │ │  │ - Remove members                        │ │  │
                  │ │  │ - Role/permission selector              │ │  │
                  │ │  │ → API: GET/POST/DELETE /members        │ │  │
                  │ │  │ → RLS verification required             │ │  │
                  │ │  └─────────────────────────────────────────┘ │  │
                  │ │  ┌─────────────────────────────────────────┐ │  │
                  │ │  │ TAB 7: Notifications (NotificationCenter)│ │  │
                  │ │  │ - Notification rule list (enabled?)     │ │  │
                  │ │  │ - Edit rule config                      │ │  │
                  │ │  │ → API: GET/POST/PUT /notifications     │ │  │
                  │ │  └─────────────────────────────────────────┘ │  │
                  │ └──────────────────────────────────────────────┘  │
                  └────────────────────────────────────────────────────┘
```

---

## Detailed Component Specifications

### 🔴 **P0.1 — TravelListPage** (`/app/travels/page.tsx`)
**Responsibility:** Display all travels user is involved in (organized or member).  
**State Management:** 
- Zustand store: `{ travels, filters, currentUserId, isLoading }`
- SWR hook: `useTravels(scope, status, sortBy)`

**Props:** None (page component)

**Child Components:**
1. TravelListFilters (status, sort, scope controls)
2. TravelListTable or TravelListGrid (renders TravelCard items)
3. Pagination/infinite scroll controller

**API Calls:**
- `GET /api/travels?status=<status>&sort_by=<sort>&scope=<scope>`

**Inputs:**
- Query params from URL (status, sort_by, scope)
- User ID from auth header

**Outputs:**
- Rendered travel list with filters applied
- Navigation to TravelDetail on card click

**Error Handling:**
- Catch API fetch errors → show toast
- Display "No travels" message if empty
- Show loading skeleton while fetching

**Test Cases:**
- Filter by status (upcoming, ongoing, completed)
- Sort by date, cost, name
- Toggle scope (organized ↔ involved)
- Navigate to detail page

---

### 🔴 **P0.2 — TravelDetailPage** (`/app/travels/[id]/page.tsx`)
**Responsibility:** Full travel detail view with 7 tabbed sections.  
**State Management:**
- Zustand store: `{ currentTravel, currentTab, errors }`
- SWR hooks: `useTravel(id)`, `useEvents(id)`, `useCosts(id)`, `useMembers(id)`, `useNotifications(id)`

**Props:** 
- `params: { id: string }`

**Child Components:**
1. TravelDetailHeader (title, actions menu)
2. TravelDetailTabs (tab navigation)
3. 7 Tab Panels (lazy-loaded):
   - TravelSettings (P3)
   - EventManager (P1)
   - CostTracker (P1)
   - ChecklistManager (P1)
   - DocumentUpload (P1)
   - MemberInviter (P2)
   - NotificationCenter (P2)

**API Calls:**
- `GET /api/travels/[id]` (fetch single travel)
- Delegated to child components for tab-specific data

**Inputs:**
- Travel ID from route params
- User auth for permission checking

**Outputs:**
- Rendered travel detail with all tabs accessible
- Modal forms for editing nested resources (events, costs, etc.)

**Error Handling:**
- If travel not found: show 404 message
- If no permission (RLS denied): show "Access denied"
- If tab data fails to load: show error in tab panel

**Test Cases:**
- Load travel by ID
- Switch between tabs
- Verify permission-based UI (organizer vs. read_write vs. read_access)

---

### 🟡 **P1.1 — EventManager** (Tab Panel Component)
**Responsibility:** Display, add, edit, delete travel events.  
**State Management:**
- Zustand: `{ events, selectedEvent, isFormOpen }`
- SWR: `useEvents(travelId)`

**Props:**
```typescript
interface EventManagerProps {
  travelId: string;
  canEdit: boolean; // Role-based permission
}
```

**Child Components:**
1. EventList (table/list of events)
2. EventFormModal (add/edit form)
3. EventListSkeleton (loading state)

**API Calls:**
- `GET /api/travels/[id]/events` → fetch all events
- `POST /api/travels/[id]/events` → create event
- `PUT /api/travels/[id]/events/[eventId]` → update event
- `DELETE /api/travels/[id]/events/[eventId]` → delete event

**Inputs:**
- Travel ID (from parent)
- canEdit permission flag

**Outputs:**
- Rendered event list
- Modal forms for add/edit operations
- Success/error toasts

**Error Handling:**
- Permission check: disable form if `canEdit = false`
- API errors: show toast with error message
- Duplicate prevention: disable submit button during POST

**Test Cases:**
- Add event with date, description, assigned members
- Edit existing event
- Delete event with confirmation
- Verify permission-based UI (disable if read_access)

---

### 🟡 **P1.2 — CostTracker** (Tab Panel Component)
**Responsibility:** Track travel expenses, split costs among members.  
**State Management:**
- Zustand: `{ costs, splitConfig, isFormOpen }`
- SWR: `useCosts(travelId)`

**Props:**
```typescript
interface CostTrackerProps {
  travelId: string;
  canEdit: boolean;
  members: TravelMember[]; // For split calculation
}
```

**Child Components:**
1. CostTable (cost list with columns: description, category, amount, status, payer)
2. CostFormModal (add/edit form)
3. CostSummary (total cost, per-member split breakdown)
4. CostListSkeleton (loading)

**API Calls:**
- `GET /api/travels/[id]/costs` → fetch all costs
- `POST /api/travels/[id]/costs` → create cost
- `PUT /api/travels/[id]/costs/[costId]` → update cost
- `DELETE /api/travels/[id]/costs/[costId]` → delete cost

**Inputs:**
- Travel ID, members list
- canEdit permission flag

**Outputs:**
- Rendered cost list + summary
- Cost split calculation (equal/custom)
- Forms for add/edit

**Error Handling:**
- Permission check: disable form if read_access
- Validation: cost amount > 0, category required
- API errors: show toast

**Test Cases:**
- Add cost with category (food, transport, lodging, etc.)
- Calculate equal split among members
- Update cost amount (verify split recalculates)
- Delete cost with confirmation

---

### 🟡 **P1.3 — ChecklistManager** (Tab Panel Component)
**Responsibility:** Collaborative task checklist for travel prep.  
**State Management:**
- Zustand: `{ items, isFormOpen }`
- SWR: `useChecklist(travelId)`

**Props:**
```typescript
interface ChecklistManagerProps {
  travelId: string;
  canEdit: boolean;
}
```

**Child Components:**
1. ChecklistItemList (checkbox + text list)
2. ChecklistItemForm (add/edit form)
3. ChecklistSkeleton (loading)

**API Calls:**
- `GET /api/travels/[id]/checklist` → fetch items
- `POST /api/travels/[id]/checklist` → create item
- `PUT /api/travels/[id]/checklist/[itemId]` → mark complete/incomplete + edit
- `DELETE /api/travels/[id]/checklist/[itemId]` → delete item

**Inputs:**
- Travel ID, canEdit flag

**Outputs:**
- Checkbox list with task descriptions
- Form for adding items
- Progress indicator (X of Y completed)

**Error Handling:**
- Permission check: disable if read_access
- Optimistic updates: mark item complete immediately, rollback on API error
- Validation: item description required

**Test Cases:**
- Add checklist item
- Mark item complete/incomplete
- Edit item description
- Delete item
- Calculate completion percentage

---

### 🟡 **P1.4 — DocumentUpload** (Tab Panel Component)
**Responsibility:** Upload, list, download, delete travel documents.  
**State Management:**
- Zustand: `{ documents, uploadProgress, isUploading }`
- SWR: `useDocuments(travelId)`

**Props:**
```typescript
interface DocumentUploadProps {
  travelId: string;
  canEdit: boolean;
}
```

**Child Components:**
1. DocumentUploadArea (drag-drop + click upload)
2. DocumentList (file table with metadata)
3. DocumentSkeleton (loading)

**API Calls:**
- `GET /api/travels/[id]/documents` → fetch documents
- `POST /api/travels/[id]/documents` → upload file to Supabase Storage
- `DELETE /api/travels/[id]/documents/[docId]` → delete document

**Storage:**
- Supabase Storage bucket: `travel-documents/{travelId}/{fileName}`
- File access via signed URL (read-only for non-organizers)

**Inputs:**
- Travel ID, canEdit flag
- File upload via drag-drop or click

**Outputs:**
- Document list with download/delete buttons
- Upload progress indicator
- Success toast after upload

**Error Handling:**
- Permission check: disable upload if read_access
- File validation: size < 50MB, type whitelist (PDF, DOC, XLSX, IMG)
- Upload failure: show error toast, retry button
- Storage error: show "Storage full" message

**Test Cases:**
- Drag-drop file upload
- Click upload button
- Download document via signed URL
- Delete document with confirmation
- Handle oversized file (>50MB)

---

### 🟢 **P2.1 — MemberInviter** (Tab Panel Component)
**Responsibility:** Invite members, manage roles/permissions, verify RLS enforcement.  
**State Management:**
- Zustand: `{ members, selectedMember, isFormOpen }`
- SWR: `useMembers(travelId)`

**Props:**
```typescript
interface MemberInviterProps {
  travelId: string;
  userRole: 'organizer' | 'read_write' | 'read_access';
}
```

**Child Components:**
1. MemberList (current members with roles)
2. MemberFormModal (invite new, edit role)
3. MemberSkeleton (loading)

**API Calls:**
- `GET /api/travels/[id]/members` → fetch members
- `POST /api/travels/[id]/members` → invite new member (with role/permission)
- `PUT /api/travels/[id]/members/[memberId]` → update role/permission
- `DELETE /api/travels/[id]/members/[memberId]` → remove member

**RLS Verification:**
- Organizer: can invite, update roles, remove members
- read_write: can view members only (form disabled)
- read_access: can view members only (form hidden)

**Inputs:**
- Travel ID, user role

**Outputs:**
- Member list with role badges
- Invite form (visible only to organizer)
- Role selector (organizer, read_write, read_access)

**Error Handling:**
- Permission check: disable form if not organizer
- Validation: user email/ID must exist
- API error: show "Failed to invite" toast
- Conflict detection: warn if member already invited

**Test Cases:**
- Invite new member by email
- Update member role (organizer → read_write)
- Remove member with confirmation
- Verify read_access user cannot see invite form
- Test RLS policy enforcement (read_access cannot modify)

---

### 🟢 **P2.2 — NotificationCenter** (Tab Panel Component)
**Responsibility:** Configure notification rules (email, Telegram, in-app) for travel events.  
**State Management:**
- Zustand: `{ rules, selectedRule, isFormOpen }`
- SWR: `useNotifications(travelId)`

**Props:**
```typescript
interface NotificationCenterProps {
  travelId: string;
  canEdit: boolean;
}
```

**Child Components:**
1. NotificationRuleList (list of rules with enabled/disabled toggle)
2. NotificationRuleForm (edit rule config)
3. NotificationSkeleton (loading)

**API Calls:**
- `GET /api/travels/[id]/notifications` → fetch rules
- `POST /api/travels/[id]/notifications` → create rule
- `PUT /api/travels/[id]/notifications/[ruleId]` → update/enable/disable rule
- `DELETE /api/travels/[id]/notifications/[ruleId]` → delete rule

**Rule Types:**
- `days_before_departure` (e.g., notify 3 days before start)
- `event_reminder` (notify before event date)
- `cost_split_ready` (notify when costs ready to split)
- `document_shared` (notify when document uploaded)

**Notification Channels:**
- in_app (database)
- email (Supabase Auth email)
- telegram (optional, via bot)

**Inputs:**
- Travel ID, canEdit flag

**Outputs:**
- Rule list with enable/disable toggle
- Form to edit rule config (days, channels, etc.)

**Error Handling:**
- Permission check: disable form if read_access
- Validation: days >= 0, at least one channel selected
- API error: show "Failed to update rule" toast

**Test Cases:**
- Create notification rule (3 days before departure)
- Edit rule (change days from 3 to 7)
- Disable rule (toggle off)
- Delete rule with confirmation
- Verify read_access cannot edit

---

### 🔵 **P3.1 — TravelSettings** (Embedded in Overview Tab)
**Responsibility:** Edit travel metadata (name, description, location).  
**State Management:**
- Zustand: `{ travelForm, isEditing }`
- SWR: Inherited from TravelDetail (`useTravel(id)`)

**Props:**
```typescript
interface TravelSettingsProps {
  travel: Travel;
  canEdit: boolean;
}
```

**Child Components:** Form input components (text fields for name, location, textarea for description)

**API Calls:**
- `PUT /api/travels/[id]` → update travel metadata

**Inputs:**
- Travel object, canEdit flag

**Outputs:**
- Read-only display of travel name, location, dates
- Edit button (visible only if organizer)
- Inline edit form (name, location, description fields)

**Error Handling:**
- Permission check: disable edit if not organizer
- Validation: name required, location required
- API error: show "Failed to update travel" toast

**Test Cases:**
- Edit travel name and description
- Confirm changes saved to API
- Verify read_access users see read-only view

---

## Dependency Relationships

```
TravelListPage
  ├─ requires: Zustand store initialized
  ├─ requires: SWR hooks configured
  ├─ calls: GET /api/travels
  ├─ blocks: TravelDetailPage (child route)
  └─ → Day 2 (BLOCKER for Days 3–7)

TravelDetailPage ⭐ CRITICAL PATH
  ├─ requires: TravelListPage (parent navigation)
  ├─ requires: Dynamic route [id] working
  ├─ calls: GET /api/travels/[id]
  ├─ blocks: All 7 tab components
  └─ → Day 3 (BLOCKER for Days 4–7)

EventManager (Day 4)
  ├─ requires: TravelDetailPage
  ├─ calls: GET/POST/PUT/DELETE /api/travels/[id]/events
  └─ independent: No cross-component state

CostTracker (Day 4)
  ├─ requires: TravelDetailPage + members list
  ├─ calls: GET/POST/PUT/DELETE /api/travels/[id]/costs
  └─ note: Split calculation needs members list

ChecklistManager (Day 5)
  ├─ requires: TravelDetailPage
  ├─ calls: GET/POST/PUT/DELETE /api/travels/[id]/checklist
  └─ independent: No external dependencies

DocumentUpload (Day 5)
  ├─ requires: TravelDetailPage
  ├─ requires: Supabase Storage configured
  ├─ calls: POST /api/travels/[id]/documents + Storage
  └─ ⚠️ BLOCKER: Storage config must be ready Day 5

MemberInviter (Day 6) ⭐ RLS VERIFICATION
  ├─ requires: TravelDetailPage
  ├─ requires: DB migrations applied
  ├─ requires: RLS policies enforced in Supabase
  ├─ calls: GET/POST/PUT/DELETE /api/travels/[id]/members
  └─ ⚠️ BLOCKER: RLS must be configured before Day 6

NotificationCenter (Day 7)
  ├─ requires: TravelDetailPage
  ├─ calls: GET/POST/PUT /api/travels/[id]/notifications
  └─ independent: No external dependencies

TravelSettings (Day 7, embedded in Overview)
  ├─ requires: TravelDetailPage
  ├─ calls: PUT /api/travels/[id]
  └─ independent: Lowest priority
```

---

## Critical Path Analysis

**Sequential MUST-COMPLETE (Days 1–3):**
1. **Day 1: Environment Setup** → SWR hooks, Zustand store, TypeScript types
2. **Day 2: TravelListPage** → Depends on Day 1 setup
3. **Day 3: TravelDetailPage** → Depends on Day 2 navigation structure

**Parallel Opportunities (Days 4–7):**
- Days 4–5: EventManager, CostTracker, ChecklistManager, DocumentUpload (parallel if Day 3 complete)
- Day 6: MemberInviter (depends on RLS verification from Day 1)
- Day 7: NotificationCenter, TravelSettings (parallel)

**Bottleneck Risk:**
- **Day 6 (MemberInviter):** Requires Supabase DB migrations + RLS policies applied. If not ready, entire permission system fails.

---

## State Management Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store                             │
│  (lib/travel/store.ts)                                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │ State:                                             │     │
│  │  - currentTravel: Travel                           │     │
│  │  - currentTab: string                              │     │
│  │  - filters: { status, sortBy, scope }              │     │
│  │  - isLoading: boolean                              │     │
│  │  - errors: Record<string, string>                  │     │
│  ├────────────────────────────────────────────────────┤     │
│  │ Actions:                                           │     │
│  │  - setCurrentTravel(travel)                        │     │
│  │  - setCurrentTab(tabName)                          │     │
│  │  - setFilters(status, sortBy, scope)               │     │
│  │  - setLoading(bool)                                │     │
│  │  - setError(key, message)                          │     │
│  │  - clearError(key)                                 │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ TravelListPage (reads: filters, isLoading)
         │  └─ Dispatch: setFilters, setLoading
         │
         └─ TravelDetailPage (reads: currentTravel, currentTab)
            ├─ Dispatch: setCurrentTravel, setCurrentTab
            │
            ├─ EventManager (reads: currentTravel → events)
            │  └─ Dispatch: setCurrentTravel (after event mutation)
            │
            ├─ CostTracker (reads: currentTravel → costs, members)
            │  └─ Dispatch: setCurrentTravel (after cost mutation)
            │
            └─ [Other tabs follow similar pattern]

┌─────────────────────────────────────────────────────────────┐
│                   SWR Hooks                                  │
│  (lib/travel/swr-hooks.ts)                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │ useTravels(scope, status, sortBy)                  │     │
│  │  → GET /api/travels?...                            │     │
│  │  → Returns: { data: Travel[], isLoading, error }   │     │
│  │                                                    │     │
│  │ useTravel(id)                                      │     │
│  │  → GET /api/travels/[id]                           │     │
│  │                                                    │     │
│  │ useEvents(id)                                      │     │
│  │  → GET /api/travels/[id]/events                    │     │
│  │                                                    │     │
│  │ useCosts(id)                                       │     │
│  │  → GET /api/travels/[id]/costs                     │     │
│  │                                                    │     │
│  │ useMembers(id)                                     │     │
│  │  → GET /api/travels/[id]/members                   │     │
│  │                                                    │     │
│  │ useNotifications(id)                               │     │
│  │  → GET /api/travels/[id]/notifications             │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ TravelListPage (calls: useTravels)
         │  └─ Triggers re-render on data change
         │
         └─ TravelDetailPage + children
            ├─ EventManager (calls: useEvents)
            ├─ CostTracker (calls: useCosts)
            ├─ MemberInviter (calls: useMembers)
            ├─ DocumentUpload (calls: useDocuments)
            └─ NotificationCenter (calls: useNotifications)
```

---

## Implementation Dependencies Summary

| Component | Depends On | Day | Status |
|-----------|-----------|-----|--------|
| Zustand Store + SWR Hooks | Day 1 setup | 1 | 🔴 BLOCKER |
| TravelListPage | Zustand + SWR | 2 | 🔴 BLOCKER |
| TravelDetailPage | TravelListPage structure | 3 | 🔴 BLOCKER |
| EventManager | Day 3 complete | 4 | OK |
| CostTracker | Day 3 complete + members data | 4 | OK |
| ChecklistManager | Day 3 complete | 5 | OK |
| DocumentUpload | Day 3 complete + Storage config | 5 | ⚠️ RISK |
| MemberInviter | Day 3 complete + RLS verified | 6 | ⚠️ RISK |
| NotificationCenter | Day 3 complete | 7 | OK |
| TravelSettings | Day 3 complete | 7 | OK |

---

## File Structure Map

```
dsc-fms-portal/
├── app/travels/
│   ├── page.tsx                    ⭐ TravelListPage (Day 2)
│   ├── [id]/
│   │   ├── page.tsx                ⭐ TravelDetailPage (Day 3)
│   │   ├── layout.tsx              (Shared layout for detail routes)
│   │   └── (Reserved for future sub-routes)
│   └── _components/                (Optional: page-specific components)
│
├── components/travels/
│   ├── TravelCard.tsx              (Rendering in list)
│   ├── TravelListFilters.tsx        (Filter/sort UI)
│   ├── TravelListTable.tsx          (or Grid)
│   │
│   ├── TravelDetailHeader.tsx       (Title, actions)
│   ├── TravelDetailTabs.tsx         (Tab navigation)
│   │
│   ├── EventManager.tsx             (Tab panel)
│   ├── EventFormModal.tsx           (Add/edit form)
│   ├── EventListSkeleton.tsx        (Loading state)
│   │
│   ├── CostTracker.tsx              (Tab panel)
│   ├── CostFormModal.tsx            (Add/edit form)
│   ├── CostSummary.tsx              (Split calculation)
│   ├── CostTableSkeleton.tsx        (Loading state)
│   │
│   ├── ChecklistManager.tsx         (Tab panel)
│   ├── ChecklistItemForm.tsx        (Add/edit form)
│   │
│   ├── DocumentUpload.tsx           (Tab panel)
│   ├── DocumentUploadArea.tsx       (Drag-drop upload)
│   │
│   ├── MemberInviter.tsx            (Tab panel)
│   ├── MemberFormModal.tsx          (Invite form)
│   │
│   ├── NotificationCenter.tsx       (Tab panel)
│   ├── NotificationRuleForm.tsx     (Edit rule)
│   │
│   ├── TravelSettings.tsx           (Overview tab edit)
│   │
│   └── TravelErrorBoundary.tsx      (Global error handler)
│
├── lib/travel/
│   ├── store.ts                    (Zustand store + actions)
│   ├── swr-hooks.ts                (SWR fetch hooks)
│   ├── service.ts                  (Business logic, RLS checks)
│   ├── validation.ts               (Form validation)
│   └── supabase-client.ts          (Existing)
│
├── types/
│   └── travel.ts                   (TypeScript interfaces)
│
└── db/
    ├── 21_travel_module.sql        (8 tables, RLS policies)
    ├── 24_create_travel_tables.sql (Supplementary)
    └── 26_travel_documents.sql     (Documents table)
```

---

## Risk Matrix & Mitigation

| Risk | Severity | Day | Mitigation |
|------|----------|-----|-----------|
| RLS policies not applied to Supabase | 🔴 CRITICAL | 6 | Verify on Day 1; ask backend to apply if missing |
| File storage not configured | 🔴 CRITICAL | 5 | Test upload API on Day 1; confirm bucket exists |
| Performance budget exceeded (>180KB) | 🟡 HIGH | 9 | Monitor bundle size every 2 days; lazy-load tabs |
| State management complexity (Zustand + SWR conflict) | 🟡 HIGH | 1–7 | Establish clear patterns Day 1; document in store.ts |
| Concurrent edits (simultaneous updates by members) | 🟡 MEDIUM | 10 | Implement optimistic updates with rollback; add version tracking |
| Mobile responsiveness regression | 🟡 MEDIUM | 12 | Test on real device Day 12; catch early |
| TypeScript type mismatches | 🟢 LOW | 1–13 | Run `npm run lint` daily; strict mode enabled |

---

## Success Criteria

✅ **All 9 components implemented**  
✅ **All 13+ API endpoints callable**  
✅ **RLS policies enforced in UI**  
✅ **Bundle < 180KB gzip**  
✅ **LCP < 2.5s, FID < 100ms, CLS < 0.1**  
✅ **Unit tests >80% coverage**  
✅ **Mobile responsive (tested on real device)**  
✅ **WCAG AA accessibility**  
✅ **No console errors or warnings**  

---

**Document Status:** ✅ Ready for review  
**Next Step:** Secretary AI to coordinate with Web Developer #1  
**Delivery Deadline:** 2026-05-25 19:00 KST
