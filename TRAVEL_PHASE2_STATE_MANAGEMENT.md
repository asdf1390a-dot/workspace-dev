---
name: Travel Management Phase 2 상태 관리 구조
description: 글로벌 상태 (Zustand), 로컬 상태, 데이터 페칭, 동기화 전략
type: project
---

# Travel Management Phase 2 — 상태 관리 구조

**작성:** 2026-05-19  
**담당:** 플레너

---

## 1. 상태 관리 아키텍처 개요

### 선택: Zustand (Redux 대비)

| 기준 | Zustand | Redux |
|------|---------|-------|
| **번들 크기** | 2KB | 8KB |
| **보일러플레이트** | 최소 | 많음 |
| **러닝커브** | 낮음 | 높음 |
| **TypeScript** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **DevTools** | 내장 | 확장 |
| **이 프로젝트 필요성** | 3개 스토어 (소규모) | 과잉 |

**결정:** **Zustand** ✅

---

## 2. 글로벌 상태 스토어

### 2.1 TravelStore (여행 목록 관리)

**파일:** `lib/stores/travelStore.ts`

```typescript
import create from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Travel {
  id: string
  user_id: string
  name: string
  destination: string
  start_date: Date
  end_date: Date
  status: 'planning' | 'in_progress' | 'completed'
  total_budget: number
  created_at: Date
}

interface TravelState {
  // State
  travels: Travel[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchTravels: () => Promise<void>
  createTravel: (data: CreateTravelDTO) => Promise<Travel>
  updateTravel: (id: string, data: UpdateTravelDTO) => Promise<void>
  deleteTravel: (id: string) => Promise<void>
  clearError: () => void
}

export const useTravelStore = create<TravelState>()(
  immer((set, get) => ({
    travels: [],
    isLoading: false,
    error: null,
    
    fetchTravels: async () => {
      set({ isLoading: true })
      try {
        const response = await fetch('/api/travels')
        if (!response.ok) throw new Error('Failed to fetch travels')
        const { data } = await response.json()
        set({ travels: data, error: null })
      } catch (error) {
        set({ error: error.message })
      } finally {
        set({ isLoading: false })
      }
    },
    
    createTravel: async (data) => {
      set({ isLoading: true })
      try {
        const response = await fetch('/api/travels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to create travel')
        const { data: travel } = await response.json()
        set((state) => {
          state.travels.push(travel)
        })
        return travel
      } catch (error) {
        set({ error: error.message })
        throw error
      } finally {
        set({ isLoading: false })
      }
    },
    
    updateTravel: async (id, data) => {
      try {
        const response = await fetch(`/api/travels/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to update travel')
        const { data: updated } = await response.json()
        set((state) => {
          const index = state.travels.findIndex(t => t.id === id)
          if (index >= 0) state.travels[index] = updated
        })
      } catch (error) {
        set({ error: error.message })
        throw error
      }
    },
    
    deleteTravel: async (id) => {
      try {
        const response = await fetch(`/api/travels/${id}`, {
          method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete travel')
        set((state) => {
          state.travels = state.travels.filter(t => t.id !== id)
        })
      } catch (error) {
        set({ error: error.message })
        throw error
      }
    },
    
    clearError: () => set({ error: null })
  }))
)
```

**사용법:**
```typescript
// 컴포넌트에서
const { travels, isLoading, fetchTravels } = useTravelStore()

useEffect(() => {
  fetchTravels()
}, [fetchTravels])
```

---

### 2.2 TravelDetailStore (상세 데이터 관리)

**파일:** `lib/stores/travelDetailStore.ts`

```typescript
interface TravelDetailState {
  // Travel Detail
  activeTravel: Travel | null
  
  // Tab Data
  members: TravelMember[]
  events: TravelEvent[]
  costs: TravelCost[]
  checklistItems: ChecklistItem[]
  documents: TravelDocument[]
  notificationRules: NotificationRule[]
  
  // UI State
  activeTab: TabType
  
  // Loading & Error
  loadingTab: TabType | null
  errors: Partial<Record<TabType, string>>
  
  // Actions
  fetchTravelDetail: (id: string) => Promise<void>
  setActiveTab: (tab: TabType) => void
  refetchTabData: (tab: TabType) => Promise<void>
  
  // Member Actions
  addMember: (email: string, role: MemberRole) => Promise<void>
  removeMember: (userId: string) => Promise<void>
  updateMemberRole: (userId: string, role: MemberRole) => Promise<void>
  
  // Event Actions
  addEvent: (event: CreateEventDTO) => Promise<void>
  updateEvent: (eventId: string, event: UpdateEventDTO) => Promise<void>
  deleteEvent: (eventId: string) => Promise<void>
  
  // Cost Actions
  addCost: (cost: CreateCostDTO) => Promise<void>
  updateCost: (costId: string, cost: UpdateCostDTO) => Promise<void>
  deleteCost: (costId: string) => Promise<void>
  
  // Checklist Actions
  addChecklistItem: (item: CreateItemDTO) => Promise<void>
  updateChecklistItem: (itemId: string, item: UpdateItemDTO) => Promise<void>
  deleteChecklistItem: (itemId: string) => Promise<void>
  
  // Document Actions
  addDocument: (file: File, type: DocumentType) => Promise<void>
  deleteDocument: (docId: string) => Promise<void>
  
  // Notification Actions
  addNotificationRule: (rule: CreateRuleDTO) => Promise<void>
  updateNotificationRule: (ruleId: string, rule: UpdateRuleDTO) => Promise<void>
  deleteNotificationRule: (ruleId: string) => Promise<void>
}

export const useTravelDetailStore = create<TravelDetailState>()(
  immer((set, get) => ({
    activeTravel: null,
    members: [],
    events: [],
    costs: [],
    checklistItems: [],
    documents: [],
    notificationRules: [],
    activeTab: 'overview',
    loadingTab: null,
    errors: {},
    
    fetchTravelDetail: async (travelId: string) => {
      try {
        const response = await fetch(`/api/travels/${travelId}`)
        if (!response.ok) throw new Error('Failed to fetch travel')
        const { data } = await response.json()
        
        set((state) => {
          state.activeTravel = data
          state.members = data.members || []
          state.activeTab = 'overview'
          state.errors = {}
        })
      } catch (error) {
        set((state) => {
          state.errors.overview = error.message
        })
      }
    },
    
    setActiveTab: (tab: TabType) => set({ activeTab: tab }),
    
    refetchTabData: async (tab: TabType) => {
      const { activeTravel } = get()
      if (!activeTravel) return
      
      set({ loadingTab: tab })
      try {
        let data
        switch (tab) {
          case 'schedule':
            const eventsRes = await fetch(`/api/travels/${activeTravel.id}/events`)
            data = await eventsRes.json()
            set((state) => {
              state.events = data.data
              state.errors.schedule = null
            })
            break
          case 'costs':
            const costsRes = await fetch(`/api/travels/${activeTravel.id}/costs`)
            data = await costsRes.json()
            set((state) => {
              state.costs = data.data
              state.errors.costs = null
            })
            break
          // ... 다른 탭들
        }
      } catch (error) {
        set((state) => {
          state.errors[tab] = error.message
        })
      } finally {
        set({ loadingTab: null })
      }
    },
    
    // Member Actions
    addMember: async (email: string, role: MemberRole) => {
      const { activeTravel } = get()
      if (!activeTravel) throw new Error('No active travel')
      
      const response = await fetch(`/api/travels/${activeTravel.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      })
      if (!response.ok) throw new Error('Failed to add member')
      
      const { data: member } = await response.json()
      set((state) => {
        state.members.push(member)
      })
    },
    
    // ... 다른 액션들
  }))
)
```

---

### 2.3 UIStateStore (UI 상태)

**파일:** `lib/stores/uiStateStore.ts`

```typescript
interface UIStateStore {
  // Modals
  isCreateTravelModalOpen: boolean
  isAddEventModalOpen: boolean
  isAddCostModalOpen: boolean
  isAddChecklistItemModalOpen: boolean
  isAddMemberModalOpen: boolean
  
  // Editing State
  editingEvent: TravelEvent | null
  editingCost: TravelCost | null
  editingItem: ChecklistItem | null
  
  // Filters
  costCategoryFilter: string | null
  checklistCategoryFilter: string | null
  
  // Actions
  toggleModal: (modalKey: string) => void
  setEditingEvent: (event: TravelEvent | null) => void
  setEditingCost: (cost: TravelCost | null) => void
  setEditingItem: (item: ChecklistItem | null) => void
  setCostCategoryFilter: (category: string | null) => void
  setChecklistCategoryFilter: (category: string | null) => void
}

export const useUIStateStore = create<UIStateStore>((set) => ({
  isCreateTravelModalOpen: false,
  isAddEventModalOpen: false,
  isAddCostModalOpen: false,
  isAddChecklistItemModalOpen: false,
  isAddMemberModalOpen: false,
  editingEvent: null,
  editingCost: null,
  editingItem: null,
  costCategoryFilter: null,
  checklistCategoryFilter: null,
  
  toggleModal: (modalKey: string) => 
    set((state) => ({
      [modalKey]: !state[modalKey]
    })),
  
  setEditingEvent: (event: TravelEvent | null) =>
    set({ editingEvent: event }),
  
  setEditingCost: (cost: TravelCost | null) =>
    set({ editingCost: cost }),
  
  setEditingItem: (item: ChecklistItem | null) =>
    set({ editingItem: item }),
  
  setCostCategoryFilter: (category: string | null) =>
    set({ costCategoryFilter: category }),
  
  setChecklistCategoryFilter: (category: string | null) =>
    set({ checklistCategoryFilter: category })
}))
```

---

## 3. 로컬 상태 (컴포넌트 레벨)

### 3.1 TravelListPage 로컬 상태

```typescript
// 클라이언트 측 필터링
const [filter, setFilter] = useState<FilterState>({
  status: 'all',
  dateRange: null
})

const [sortBy, setSortBy] = useState<SortOption>('date')

// 파생 상태 (계산)
const filteredTravels = useMemo(() => {
  let result = travels
  
  if (filter.status !== 'all') {
    result = result.filter(t => t.status === filter.status)
  }
  
  if (filter.dateRange) {
    result = result.filter(t => 
      t.start_date >= filter.dateRange.from &&
      t.start_date <= filter.dateRange.to
    )
  }
  
  // 정렬
  return result.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return a.start_date.getTime() - b.start_date.getTime()
      case 'cost':
        return b.total_budget - a.total_budget
      case 'name':
        return a.name.localeCompare(b.name)
    }
  })
}, [travels, filter, sortBy])
```

### 3.2 TravelForm 로컬 상태 (React Hook Form)

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const travelSchema = z.object({
  name: z.string().min(1, '여행명 필수').max(100),
  destination: z.string().min(1, '목적지 필수'),
  start_date: z.date(),
  end_date: z.date(),
  budget: z.number().min(0).optional()
}).refine(
  (data) => data.end_date > data.start_date,
  { message: "종료 날짜 > 시작 날짜", path: ["end_date"] }
)

type TravelFormData = z.infer<typeof travelSchema>

const { 
  register, 
  handleSubmit, 
  formState: { errors },
  watch 
} = useForm<TravelFormData>({
  resolver: zodResolver(travelSchema),
  defaultValues: travel // 수정 시
})

const onSubmit = async (data: TravelFormData) => {
  if (isEditMode) {
    await updateTravel(travel.id, data)
  } else {
    await createTravel(data)
  }
}
```

### 3.3 CostManager 로컬 상태

```typescript
const [splitMethod, setSplitMethod] = useState<'equal' | 'percentage' | 'custom'>('equal')

// 파생: 정산 계산
const settlements = useMemo(() => {
  return calculateSettlement(costs, members, splitMethod)
}, [costs, members, splitMethod])

// 파생: 카테고리별 합계
const costByCategory = useMemo(() => {
  return costs.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + cost.amount
    return acc
  }, {})
}, [costs])
```

---

## 4. 데이터 페칭 전략

### 4.1 SWR (Stale-While-Revalidate)

**목표:** 캐싱 + 실시간 동기화

```typescript
import useSWR from 'swr'

const { data: travels, isLoading, mutate } = useSWR(
  '/api/travels',
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1분 내 중복 요청 방지
    focusThrottleInterval: 300000 // 5분마다 재검증
  }
)

// 수동 갱신
const refreshTravels = () => mutate()
```

### 4.2 지연 로딩 (Lazy Loading)

**각 탭의 데이터는 필요할 때만 로드:**

```typescript
// TravelDetailPage
const { activeTab } = useTravelDetailStore()
const { refetchTabData } = useTravelDetailStore()

useEffect(() => {
  if (activeTab === 'schedule') {
    refetchTabData('schedule') // GET /api/travels/[id]/events
  }
}, [activeTab])
```

### 4.3 낙관적 업데이트 (Optimistic Update)

**API 응답 전에 UI 먼저 업데이트:**

```typescript
const handleDeleteCost = async (costId: string) => {
  // 1. 낙관적 업데이트 (UI 즉시 반영)
  set((state) => {
    state.costs = state.costs.filter(c => c.id !== costId)
  })
  
  try {
    // 2. API 요청
    await fetch(`/api/travels/${travelId}/costs/${costId}`, {
      method: 'DELETE'
    })
  } catch (error) {
    // 3. 실패 시 롤백
    set((state) => {
      state.costs = [...previousCosts, deletedCost]
    })
    showError('삭제 실패')
  }
}
```

---

## 5. 상태 동기화 전략

### 5.1 여러 탭 간 동기화

```typescript
// Problem: Cost 탭에서 비용 추가 → Settlement 계산 갱신

// Solution: Zustand에서 파생 상태
export const useTravelDetailStore = create((set, get) => ({
  costs: [],
  
  // 파생 상태 (자동 갱신)
  get settlements() {
    return calculateSettlement(this.costs, this.members, this.splitMethod)
  },
  
  addCost: async (cost) => {
    // API + 상태 업데이트
    // settlements는 자동으로 갱신됨 (useMemo 또는 get() 호출)
  }
}))

// 컴포넌트에서
const { costs, settlements } = useTravelDetailStore()
// settlements는 costs 변경 시 자동으로 재계산됨
```

### 5.2 API 응답과 로컬 상태 동기화

```typescript
// 비용 추가 후 정산 자동 계산
const addCost = async (cost: CreateCostDTO) => {
  const newCost = await api.post(`/travels/${id}/costs`, cost)
  
  set((state) => {
    state.costs.push(newCost)
    // 분담 데이터는 자동으로 API에서 요청
    state.needsSettlementRefresh = true
  })
  
  // 정산 재계산
  const settlements = await api.get(`/travels/${id}/cost-split`)
  set((state) => {
    state.settlements = settlements
    state.needsSettlementRefresh = false
  })
}
```

---

## 6. 상태 구조 다이어그램

```
Application
├── Global State (Zustand)
│   ├── TravelStore
│   │   ├── travels: Travel[]
│   │   ├── isLoading: boolean
│   │   └── error: string
│   │
│   ├── TravelDetailStore
│   │   ├── activeTravel: Travel
│   │   ├── members: TravelMember[]
│   │   ├── events: TravelEvent[]
│   │   ├── costs: TravelCost[]
│   │   ├── settlements: Settlement[] (파생)
│   │   └── ...
│   │
│   └── UIStateStore
│       ├── modalStates: Record<string, boolean>
│       ├── editingState: {event, cost, item}
│       └── filters: {category, ...}
│
├── Server State (SWR Cache)
│   ├── /api/travels → useSWR
│   └── /api/travels/[id] → useSWR
│
└── Component Local State
    ├── Form State (React Hook Form)
    │   ├── formData
    │   └── validation errors
    └── UI State
        ├── isHovered
        └── menuOpen
```

---

## 7. 성능 최적화 기법

### 7.1 메모이제이션

```typescript
// Store의 파생 상태
const settlements = useMemo(() => 
  calculateSettlement(costs, members, splitMethod),
  [costs, members, splitMethod]
)

// 컴포넌트 메모이제이션
const CostRow = memo(({ cost, onDelete }) => (
  <tr>
    <td>{cost.title}</td>
    <td>{cost.amount}</td>
    <td>
      <button onClick={() => onDelete(cost.id)}>삭제</button>
    </td>
  </tr>
))

// 콜백 메모이제이션
const handleDelete = useCallback((costId: string) => {
  deleteCost(costId)
}, [deleteCost])
```

### 7.2 상태 분리 (State Colocation)

```
❌ Bad: 전역 상태에 모든 것을 저장
✅ Good: 로컬 상태 + 필요한 것만 전역
```

---

**상태:** ✅ **설계 완료**
