---
name: Travel Management Phase 2 컴포넌트 구조도
description: 컴포넌트 계층, Props, 상태, 의존성 관계
type: project
---

# Travel Management Phase 2 — 컴포넌트 구조도

**작성:** 2026-05-19  
**담당:** 플레너

---

## 전체 구조

```
DSC Hub Portal
└── TravelModule
    ├── TravelListPage (app/travels/page.tsx)
    │   ├── TravelHeader
    │   ├── FilterBar (상태, 정렬)
    │   ├── TravelCardGrid
    │   │   └── TravelCard × N
    │   │       ├── CostProgressBar
    │   │       └── MemberAvatarGroup
    │   ├── TravelForm (모달)
    │   └── EmptyState (여행 없음)
    │
    └── TravelDetailPage (app/travels/[id]/page.tsx)
        ├── TravelDetailHeader
        │   ├── TravelTitle
        │   ├── DateRange
        │   └── ActionMenu (edit, delete, share)
        ├── TabNavigation (6개 탭)
        │   ├── OverviewTab
        │   │   ├── TravelInfoSection
        │   │   ├── MemberManager
        │   │   │   ├── MemberList
        │   │   │   ├── MemberInviteForm
        │   │   │   └── RoleSelector
        │   │   └── BudgetSummary
        │   │
        │   ├── ScheduleTab
        │   │   ├── ViewModeToggle (Timeline/Calendar)
        │   │   ├── TimelineView
        │   │   │   └── EventCard × N
        │   │   ├── CalendarView
        │   │   ├── ScheduleManager
        │   │   │   ├── EventList
        │   │   │   └── EventForm (모달)
        │   │   └── EventActions (add, edit, delete)
        │   │
        │   ├── CostsTab
        │   │   ├── CostManager
        │   │   │   ├── CostTable
        │   │   │   │   └── CostRow × N
        │   │   │   ├── CostForm (모달)
        │   │   │   └── CategoryFilter
        │   │   ├── SettlementCalculator
        │   │   │   ├── SettlementTable
        │   │   │   └── ExportButtons (CSV, PDF)
        │   │   └── CostSummary
        │   │
        │   ├── ChecklistTab
        │   │   ├── ChecklistManager
        │   │   │   ├── CategoryFilter
        │   │   │   ├── ChecklistGroup × N (category)
        │   │   │   │   └── ChecklistItem × N
        │   │   │   │       ├── Checkbox
        │   │   │   │       ├── PriorityBadge
        │   │   │   │       └── ItemActions
        │   │   │   └── ItemForm (추가)
        │   │   └── CompletionProgress
        │   │
        │   ├── DocumentsTab
        │   │   ├── DocumentUploader
        │   │   │   ├── DropZone
        │   │   │   ├── FileInput
        │   │   │   └── UploadProgress
        │   │   ├── DocumentList
        │   │   │   └── DocumentCard × N
        │   │   │       ├── FilePreview
        │   │   │       ├── DocumentType Badge
        │   │   │       └── DocumentActions
        │   │   └── DocumentTypeFilter
        │   │
        │   └── NotificationsTab
        │       ├── NotificationManager
        │       │   ├── NotificationRulesList
        │       │   │   └── RuleItem × N
        │       │   │       ├── RuleConfig
        │       │   │       ├── ChannelToggle
        │       │   │       └── RuleActions
        │       │   ├── RuleForm (모달)
        │       │   └── ChannelSelector
        │       └── NotificationHistory (선택)
        │
        └── GlobalUI
            ├── LoadingSpinner
            ├── ErrorBoundary
            └── ToastNotification
```

---

## 컴포넌트 상세 명세

### 페이지 컴포넌트

#### TravelListPage
```typescript
// app/travels/page.tsx
interface TravelListPageProps {}

interface TravelListPageState {
  travels: Travel[]
  filter: FilterState
  sortBy: SortOption
  isCreateModalOpen: boolean
  isLoading: boolean
  error: Error | null
}

// 자식 컴포넌트
- TravelHeader
- FilterBar
- TravelCardGrid
  - TravelCard (반복)
- TravelForm (모달)
- EmptyState
```

**Props 타입:**
```typescript
type FilterState = {
  status: 'all' | 'upcoming' | 'ongoing' | 'completed'
  dateRange: DateRange | null
}

type SortOption = 'date' | 'cost' | 'name'
```

---

#### TravelDetailPage
```typescript
// app/travels/[id]/page.tsx
interface TravelDetailPageProps {
  params: { id: string }
}

interface TravelDetailPageState {
  travel: Travel | null
  activeTab: TabType
  isLoading: boolean
  error: Error | null
}

type TabType = 'overview' | 'schedule' | 'costs' | 'checklist' | 'documents' | 'notifications'

// 자식 컴포넌트
- TravelDetailHeader
- TabNavigation
- [TabContent Component]
```

---

### 컴포넌트 카탈로그

#### 1️⃣ TravelCard
```typescript
// components/travels/TravelCard.tsx
interface TravelCardProps {
  travel: Travel
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

interface TravelCardState {
  isHovered: boolean
  isMenuOpen: boolean
}

// 자식 컴포넌트
- CostProgressBar
- MemberAvatarGroup
- StatusBadge
- ActionMenu
```

**Props 변환:**
```
travel: Travel
  ├─ name → TravelTitle
  ├─ startDate, endDate → DateRange
  ├─ location → LocationText
  ├─ status → StatusBadge (색상)
  ├─ members → MemberAvatarGroup (4명만, +N 표시)
  ├─ totalCost → CostDisplay
  ├─ budget → CostProgressBar (진행률)
  └─ onActions → ActionMenu (view, edit, delete)
```

---

#### 2️⃣ TravelForm
```typescript
// components/travels/TravelForm.tsx
interface TravelFormProps {
  isOpen: boolean
  travel?: Travel (수정 모드)
  onSubmit: (data: CreateTravelDTO | UpdateTravelDTO) => Promise<void>
  onClose: () => void
}

interface TravelFormState {
  formData: TravelFormData
  isSubmitting: boolean
  errors: FieldErrors
}

type TravelFormData = {
  name: string
  description?: string
  destination: string
  startDate: Date
  endDate: Date
  budget?: number
}
```

**자식 컴포넌트:**
- DatePicker (react-day-picker)
- TextInput (Radix UI)
- Textarea (Radix UI)
- NumberInput
- FormError

---

#### 3️⃣ MemberManager
```typescript
// components/travels/MemberManager.tsx
interface MemberManagerProps {
  travelId: string
  members: TravelMember[]
  isOrganizer: boolean
  onMemberAdd: (email: string, role: MemberRole) => Promise<void>
  onMemberRemove: (userId: string) => Promise<void>
  onRoleChange: (userId: string, role: MemberRole) => Promise<void>
}

interface MemberManagerState {
  inviteEmail: string
  isAdding: boolean
  selectedRole: MemberRole
  error: string | null
}

type MemberRole = 'organizer' | 'companion' | 'guest'
```

**자식 컴포넌트:**
- MemberList (테이블)
  - MemberRow × N
    - MemberInfo
    - RoleSelector (드롭다운)
    - RemoveButton
- MemberInviteForm
  - EmailInput
  - RoleSelect
  - InviteButton

---

#### 4️⃣ ScheduleManager
```typescript
// components/travels/ScheduleManager.tsx
interface ScheduleManagerProps {
  travelId: string
  events: TravelEvent[]
  onEventAdd: (event: CreateEventDTO) => Promise<void>
  onEventUpdate: (eventId: string, event: UpdateEventDTO) => Promise<void>
  onEventDelete: (eventId: string) => Promise<void>
}

interface ScheduleManagerState {
  viewMode: 'timeline' | 'calendar'
  selectedDate: Date | null
  editingEvent: TravelEvent | null
  isFormOpen: boolean
  isLoading: boolean
}
```

**자식 컴포넌트:**
- ViewModeToggle (Timeline | Calendar)
- TimelineView
  - EventCard (드래그 가능) × N
    - EventIcon
    - EventTime
    - EventTitle
    - EventActions (edit, delete)
- CalendarView (react-day-picker)
  - CalendarGrid
  - EventMarkers
- EventForm (모달)
  - DateInput
  - TimeInput
  - LocationInput
  - TypeSelector
  - DescriptionInput

---

#### 5️⃣ CostManager
```typescript
// components/travels/CostManager.tsx
interface CostManagerProps {
  travelId: string
  costs: TravelCost[]
  onCostAdd: (cost: CreateCostDTO) => Promise<void>
  onCostUpdate: (costId: string, cost: UpdateCostDTO) => Promise<void>
  onCostDelete: (costId: string) => Promise<void>
}

interface CostManagerState {
  costs: TravelCost[]
  editingCost: TravelCost | null
  isFormOpen: boolean
  categoryFilter: string | null
  isLoading: boolean
}
```

**자식 컴포넌트:**
- CostTable (가상화)
  - CostRow × N
    - CostTypeIcon
    - CostTitle
    - PayerName
    - Amount
    - DateDisplay
    - CostActions (edit, delete)
- CategoryFilter (드롭다운)
- CostForm (모달)
  - TitleInput
  - AmountInput
  - TypeSelector
  - PayerSelector
  - DateInput
  - ReceiptUpload (선택)
- CostSummary (실시간 합계)

---

#### 6️⃣ SettlementCalculator
```typescript
// components/travels/SettlementCalculator.tsx
interface SettlementCalculatorProps {
  costs: TravelCost[]
  splits: TravelCostSplit[]
  members: TravelMember[]
}

interface SettlementCalculatorState {
  settlements: Settlement[]
  splitMethod: 'equal' | 'percentage' | 'custom'
  calculations: Calculation[]
}

type Settlement = {
  from: User
  to: User
  amount: number
}
```

**자식 컴포넌트:**
- SplitMethodSelector (Equal | Percentage | Custom)
- SettlementTable
  - SettlementRow × N
    - FromUser
    - ToUser
    - Amount
    - Status
- ExportButton
  - CSVDownload
  - PDFDownload

---

#### 7️⃣ ChecklistManager
```typescript
// components/travels/ChecklistManager.tsx
interface ChecklistManagerProps {
  travelId: string
  items: ChecklistItem[]
  onItemAdd: (item: CreateItemDTO) => Promise<void>
  onItemUpdate: (itemId: string, item: UpdateItemDTO) => Promise<void>
  onItemDelete: (itemId: string) => Promise<void>
}

interface ChecklistManagerState {
  items: ChecklistItem[]
  categoryFilter: string | null
  newItem: Partial<ChecklistItem>
  completionRate: number
}

enum ItemCategory {
  Documents = 'documents',
  Clothing = 'clothing',
  Toiletries = 'toiletries',
  Electronics = 'electronics',
  Medicine = 'medicine',
  Custom = 'custom'
}
```

**자식 컴포넌트:**
- CompletionProgress (진행 바)
- CategoryFilter
- ChecklistGroup × N (category별)
  - ChecklistItem × N
    - Checkbox
    - ItemTitle
    - PriorityBadge (🔴 high, 🟡 medium, 🟢 low)
    - ItemActions (edit, delete)
- ItemForm (추가)
  - TitleInput
  - CategorySelector
  - PrioritySelector

---

#### 8️⃣ DocumentUploader
```typescript
// components/travels/DocumentUploader.tsx
interface DocumentUploaderProps {
  travelId: string
  documents: TravelDocument[]
  onDocumentAdd: (file: File, type: DocumentType) => Promise<void>
  onDocumentDelete: (docId: string) => Promise<void>
}

interface DocumentUploaderState {
  documents: TravelDocument[]
  isUploading: boolean
  uploadProgress: number
  dragActive: boolean
  error: string | null
}

enum DocumentType {
  Visa = 'visa',
  Passport = 'passport',
  FlightTicket = 'flight_ticket',
  HotelBooking = 'hotel_booking',
  Receipt = 'receipt',
  Other = 'other'
}
```

**자식 컴포넌트:**
- DropZone (드래그 & 드롭)
- FileInput (버튼)
- UploadProgress (진행률)
- DocumentList
  - DocumentCard × N
    - FileIcon
    - FileName
    - FileSize
    - UploadDate
    - DocumentTypeTag
    - DocumentActions (download, delete)

---

#### 9️⃣ NotificationManager
```typescript
// components/travels/NotificationManager.tsx
interface NotificationManagerProps {
  travelId: string
  rules: NotificationRule[]
  onRuleAdd: (rule: CreateRuleDTO) => Promise<void>
  onRuleUpdate: (ruleId: string, rule: UpdateRuleDTO) => Promise<void>
  onRuleDelete: (ruleId: string) => Promise<void>
}

interface NotificationManagerState {
  rules: NotificationRule[]
  editingRule: NotificationRule | null
  isFormOpen: boolean
  channels: ChannelConfig
}

enum RuleType {
  DaysBeforeDeparture = 'days_before_departure',
  EventTime = 'event_time',
  ChecklistReminder = 'checklist_reminder',
  Custom = 'custom'
}

type ChannelConfig = {
  inApp: boolean
  email: boolean
  telegram: boolean
}
```

**자식 컴포넌트:**
- NotificationRulesList
  - RuleItem × N
    - RuleTypeIcon
    - RuleConfig (읽기)
    - ChannelToggle (3개)
    - RuleActions (edit, delete)
    - EnableToggle
- RuleForm (모달)
  - RuleTypeSelector
  - RuleConfigInput (type별)
  - ChannelCheckboxes (3개)
  - FormButtons (save, cancel)

---

## 상태 흐름도

```
User Action
    ↓
Component State Update (optimistic)
    ↓
API Request (Zustand store)
    ↓
Success? 
    ├─ Yes → Refresh Data (SWR)
    └─ No → Rollback + Error Toast
```

---

## Props 데이터 흐름

```
TravelListPage (fetch travels)
    ├─ TravelCard (travel, handlers)
    │   └── MemberAvatarGroup (members)
    └─ TravelForm (onSubmit)
         └── POST /api/travels

TravelDetailPage (fetch travel detail)
    ├─ MemberManager (members, handlers)
    │   └── POST /api/travels/[id]/members
    ├─ ScheduleManager (events, handlers)
    │   └── POST /api/travels/[id]/events
    ├─ CostManager (costs, handlers)
    │   └── POST /api/travels/[id]/costs
    ├─ SettlementCalculator (costs, splits)
    │   └── GET /api/travels/[id]/cost-split
    ├─ ChecklistManager (items, handlers)
    │   └── POST /api/travels/[id]/checklists
    ├─ DocumentUploader (documents, handlers)
    │   └── POST /api/travels/[id]/documents
    └─ NotificationManager (rules, handlers)
        └── POST /api/travels/[id]/notifications
```

---

## 컴포넌트 재사용성

| 컴포넌트 | 재사용 가능성 | 추상화 수준 |
|---------|------------|----------|
| TravelCard | ★★★★★ | 높음 |
| MemberManager | ★★★★ | 중상 |
| ScheduleManager | ★★★ | 중간 |
| CostManager | ★★★ | 중간 |
| SettlementCalculator | ★★★★ | 중상 |
| ChecklistManager | ★★★ | 중간 |
| DocumentUploader | ★★★★★ | 높음 |
| NotificationManager | ★★ | 낮음 (여행 특화) |

---

**상태:** ✅ **설계 완료**
