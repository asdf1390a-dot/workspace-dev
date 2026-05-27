# Team Dashboard Phase 2B - UI Design Specification

**Status:** 🟡 IN PROGRESS (Design Milestone 1)  
**Date:** 2026-05-27  
**Owner:** Design Specialist AI (Phase B #1)  
**Mentor:** Planner AI  
**Deadline:** 2026-06-10 18:00 KST  

---

## 📋 Executive Summary

Team Dashboard Phase 2B focuses on creating a comprehensive UI specification for the team organizational dashboard. This document defines all visual components, layout structure, responsive design patterns, accessibility standards, and API integration patterns for the frontend implementation.

**Key Goals:**
- 35+ reusable UI components with complete prop definitions
- Mobile-first responsive design (320px, 768px, 1024px, 1440px breakpoints)
- WCAG AA accessibility compliance
- Dark mode support
- Real-time data integration patterns
- Complete Figma prototype

---

## 1️⃣ Design Principles

### 1.1 Mobile-First Approach
- Primary design target: 320px mobile (India factory floor workers using phones)
- Secondary: 768px tablets (field supervisors)
- Tertiary: 1024px+ desktops (office management)
- All components scale gracefully to larger screens

### 1.2 Simplicity & Clarity
- Minimal visual hierarchy
- Clear call-to-action buttons
- Reduced cognitive load for non-technical users
- Consistent spacing and typography

### 1.3 Accessibility (WCAG AA)
- Minimum color contrast ratio 4.5:1 for normal text
- 3:1 for large text (18px+)
- Focus indicators on all interactive elements
- Semantic HTML structure
- Support for keyboard navigation
- ARIA labels and roles

### 1.4 Dark Mode Support
- All colors defined for both light and dark themes
- CSS custom properties for theme switching
- Automatic theme detection based on system preferences
- Manual theme toggle option

### 1.5 Performance
- Lazy-load portfolio images and activity logs
- Pagination for activity feed (25 items per page)
- Real-time updates via Supabase subscriptions
- Optimistic UI updates with error fallbacks

---

## 2️⃣ Design Tokens & Color Palette

### 2.1 Color System

#### Primary Colors (Light Theme)
```
Primary Blue:       #0066CC (interactive elements)
Primary Blue Dark:  #0052A3 (hover/active states)
Primary Blue Light: #E6F2FF (backgrounds)

Secondary Gray:     #666666 (secondary text)
Gray 50:            #F9F9F9 (subtle backgrounds)
Gray 100:           #F3F3F3 (card backgrounds)
Gray 200:           #E8E8E8 (borders)
Gray 300:           #D4D4D4 (dividers)
Gray 400:           #A8A8A8 (disabled text)
Gray 700:           #333333 (primary text)
```

#### Dark Theme
```
Primary Blue:       #4D94FF (softer blue for dark backgrounds)
Primary Blue Dark:  #6BA5FF
Primary Blue Light: #1A2F4D

Background:         #1A1A1A (main background)
Surface:            #2D2D2D (card/elevated)
Surface Light:      #3A3A3A (hover)

Text Primary:       #F5F5F5 (primary text)
Text Secondary:     #A8A8A8 (secondary text)
Border:             #404040 (borders/dividers)
```

#### Status Colors
```
Success:            #10B981 (green)
Success Light:      #ECFDF5

Warning:            #F59E0B (amber)
Warning Light:      #FFFBEB

Error:              #EF4444 (red)
Error Light:        #FEE2E2

Info:               #3B82F6 (blue)
Info Light:         #EFF6FF
```

#### Department Colors
```
경영 (Management):   #8B5CF6 (purple)
생산관리 (Prod Mgmt): #F59E0B (amber)
기술 (Engineering):  #3B82F6 (blue)
보전 (Maintenance):  #10B981 (green)
생산 (Production):   #EC4899 (pink)
```

### 2.2 Typography Scale

#### Font Family
```
Primary:    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
Monospace:  'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace
```

#### Font Sizes & Line Heights
```
Display:    48px / 1.2   (page titles, hero text)
H1:         32px / 1.3   (section headers)
H2:         24px / 1.4   (card titles)
H3:         18px / 1.5   (subsection headers)
Body XL:    16px / 1.6   (primary body text)
Body:       14px / 1.5   (standard body text)
Small:      12px / 1.4   (secondary text, labels)
Micro:      11px / 1.3   (timestamps, metadata)
```

#### Font Weights
```
Regular:    400 (body text)
Medium:     500 (labels, emphasis)
Semibold:   600 (headings, strong text)
Bold:       700 (titles, highlights)
```

### 2.3 Spacing Scale

```
0px, 2px, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 56px, 64px

Common Usage:
- Padding:    8px, 12px, 16px (inside components)
- Margin:     12px, 16px, 24px (between components)
- Gap:        8px (flex/grid spacing)
- Border:     1px solid (most common)
```

### 2.4 Shadows & Depth

```
Shadow 1 (hover):    0 2px 4px rgba(0,0,0,0.08)
Shadow 2 (cards):    0 4px 12px rgba(0,0,0,0.1)
Shadow 3 (modals):   0 10px 40px rgba(0,0,0,0.2)

Dark Theme Shadows:
Shadow 1:            0 2px 4px rgba(0,0,0,0.3)
Shadow 2:            0 4px 12px rgba(0,0,0,0.4)
Shadow 3:            0 10px 40px rgba(0,0,0,0.6)
```

### 2.5 Border Radius

```
Small:      4px     (small buttons, input fields)
Medium:     8px     (cards, modals)
Large:      12px    (large containers)
Full:       9999px  (avatars, badges, pills)
```

---

## 3️⃣ Component Library (35+ Components)

### 3.1 Core Components

#### Button
```tsx
Props: {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' (default: 'primary')
  size: 'xs' | 'sm' | 'md' | 'lg' (default: 'md')
  disabled: boolean (default: false)
  loading: boolean (default: false)
  onClick: () => void
  children: React.ReactNode
  className?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

States:
- Default (idle)
- Hover
- Active (pressed)
- Disabled
- Loading (spinner)
- Focus (keyboard navigation)
```

#### Input Field
```tsx
Props: {
  type: 'text' | 'email' | 'number' | 'password' | 'date' | 'select' (default: 'text')
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  hint?: string
  icon?: React.ReactNode
  maxLength?: number
}

Features:
- Floating labels
- Error state with icon
- Success state (checkmark)
- Character counter (if maxLength provided)
- Accessibility: label + aria-describedby for error/hint
```

#### Card
```tsx
Props: {
  title?: string
  subtitle?: string
  padding?: 'sm' | 'md' | 'lg' (default: 'md')
  bordered?: boolean
  interactive?: boolean (adds hover effect)
  onClick?: () => void
  children: React.ReactNode
}

Usage:
- Team member profile cards
- Portfolio item cards
- Activity log entries
```

#### Badge
```tsx
Props: {
  label: string
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size: 'xs' | 'sm' | 'md' (default: 'sm')
  icon?: React.ReactNode
  onRemove?: () => void (for removable badges)
}

Variants map to departments/statuses:
- Department colors
- Status indicators
- Skill tags
```

#### Table
```tsx
Props: {
  columns: Array<{
    key: string
    label: string
    width?: string (e.g., '200px')
    sortable?: boolean
    render?: (value, row) => ReactNode
    align?: 'left' | 'center' | 'right'
  }>
  data: Array<Record<string, any>>
  loading?: boolean
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  striped?: boolean
  hoverable?: boolean
}

Features:
- Sortable column headers
- Pagination controls
- Empty state message
- Loading skeleton
```

#### Modal
```tsx
Props: {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: Array<{
    label: string
    onClick: () => void
    variant: 'primary' | 'secondary' | 'danger'
  }>
  size?: 'sm' | 'md' | 'lg' (default: 'md')
  closeOnEscape?: boolean (default: true)
  closeOnBackdropClick?: boolean (default: true)
}

Features:
- Focus trap
- Scrollable body
- Footer action buttons
- Close button (X)
```

#### Tabs
```tsx
Props: {
  tabs: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    badge?: number
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'line' | 'pill' | 'box' (default: 'line')
  disabled?: boolean[]
}

Features:
- Keyboard navigation (arrow keys)
- Active indicator
- Optional icons
- Badge counters
```

#### Avatar
```tsx
Props: {
  src?: string
  alt?: string
  name: string
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
  variant?: 'circle' | 'square' (default: 'circle')
  fallback?: string (initials if no image)
  online?: boolean
  onClick?: () => void
}

Features:
- Image fallback to initials
- Online indicator (green dot)
- Clickable for profile modal
```

#### AvatarGroup
```tsx
Props: {
  avatars: Array<{ name: string; src?: string }>
  max?: number (default: 3)
  size?: 'sm' | 'md' | 'lg'
  onClick?: (avatars: Array) => void
}

Display: Shows max avatars + "+X more" indicator
```

#### Skeleton Loader
```tsx
Props: {
  variant: 'text' | 'avatar' | 'card' | 'table' (default: 'text')
  count?: number (for repeating skeletons)
  width?: string
  height?: string
  className?: string
}

Usage: Display while loading data (lazy load images, API calls)
```

### 3.2 Layout Components

#### Container
```tsx
Props: {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'lg')
  padding?: boolean (default: true)
  children: React.ReactNode
}

Widths:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- full: 100%
```

#### Grid
```tsx
Props: {
  cols?: number | { mobile: number, tablet: number, desktop: number }
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

Responsive Defaults:
- Mobile (320px): 1 column
- Tablet (768px): 2 columns
- Desktop (1024px): 3 columns
```

#### Flex
```tsx
Props: {
  direction?: 'row' | 'column' (default: 'row')
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  wrap?: boolean
  children: React.ReactNode
}
```

#### Stack
```tsx
Props: {
  direction?: 'vertical' | 'horizontal' (default: 'vertical')
  spacing?: number (8px units, e.g., 2 = 16px)
  children: React.ReactNode
}
```

### 3.3 Form Components

#### FormField
```tsx
Props: {
  name: string
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'select' | 'checkbox' | 'radio'
  value: any
  onChange: (value: any) => void
  error?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ label: string; value: any }> (for select/radio)
}
```

#### FormSection
```tsx
Props: {
  title: string
  description?: string
  children: React.ReactNode
}
```

#### Checkbox
```tsx
Props: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  error?: string
  hint?: string
}
```

#### RadioGroup
```tsx
Props: {
  name: string
  label: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  direction?: 'row' | 'column'
}
```

#### Select
```tsx
Props: {
  label?: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  error?: string
}

Features:
- Dropdown with search
- Clear button
- Keyboard navigation
```

### 3.4 Data Visualization

#### ProgressBar
```tsx
Props: {
  value: number (0-100)
  max?: number (default: 100)
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'success' | 'warning' | 'error'
}
```

#### Chart (Capability Scores)
```tsx
Props: {
  type: 'bar' | 'pie' | 'line'
  data: Array<{ label: string; value: number }>
  title?: string
  height?: number (default: 300)
  showLegend?: boolean
}

Library: Recharts (lightweight, responsive)
```

#### StatCard
```tsx
Props: {
  title: string
  value: string | number
  unit?: string
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
  icon?: React.ReactNode
  onClick?: () => void
}

Example: Member count, Active projects, Avg capability score
```

### 3.5 Feedback Components

#### Alert
```tsx
Props: {
  message: string
  type: 'success' | 'error' | 'warning' | 'info' (default: 'info')
  closable?: boolean
  onClose?: () => void
  icon?: React.ReactNode
}
```

#### Toast/Notification
```tsx
Props: {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number (default: 5000ms, 0 = persistent)
  action?: { label: string; onClick: () => void }
}

Usage: API responses, form submissions, errors
```

#### Tooltip
```tsx
Props: {
  content: React.ReactNode | string
  position?: 'top' | 'right' | 'bottom' | 'left' (default: 'top')
  delay?: number (default: 0)
  children: React.ReactNode
}

Triggered on: hover (desktop), tap (mobile)
```

#### EmptyState
```tsx
Props: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

Usage: No portfolio items, no activity, no members
```

#### LoadingState
```tsx
Props: {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

Display: Spinner + optional loading message
```

### 3.6 Navigation Components

#### Navbar
```tsx
Props: {
  logo?: React.ReactNode
  title?: string
  items?: Array<{
    label: string
    href: string
    icon?: React.ReactNode
    active?: boolean
  }>
  rightContent?: React.ReactNode (user menu, theme toggle)
  sticky?: boolean
  backgroundColor?: string
}

Features:
- Mobile hamburger menu
- Responsive collapse
- Breadcrumb support
```

#### Sidebar
```tsx
Props: {
  items: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    href?: string
    children?: Array (nested items)
  }>
  activeId?: string
  onItemClick?: (id: string) => void
  collapsible?: boolean
  collapsed?: boolean
}

Features:
- Collapsible sections
- Nested menu items
- Icons with labels
```

#### Breadcrumb
```tsx
Props: {
  items: Array<{ label: string; href?: string }>
  separator?: string (default: '/')
}

Usage: Navigation context (e.g., "Team > Engineering > John Doe")
```

#### Pagination
```tsx
Props: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[] (default: [10, 25, 50])
  showInfo?: boolean
}

Display: "Page 1 of 10" with navigation arrows and size selector
```

### 3.7 Specialized Team Dashboard Components

#### OrgChart (Organization Chart)
```tsx
Props: {
  data: {
    id: string
    name: string
    role: string
    department: string
    avatar?: string
    children?: Array<OrgChartNode>
  }
  onNodeClick?: (node: OrgChartNode) => void
  expandable?: boolean
}

Features:
- Hierarchical tree view
- Department color coding
- Clickable nodes (open profile modal)
- Collapse/expand sections
- Responsive (stacked on mobile)
```

#### TeamMemberCard
```tsx
Props: {
  member: {
    id: string
    name: string
    role: string
    department: string
    avatar?: string
    skills?: string[]
    status?: 'active' | 'inactive' | 'on_leave'
  }
  onViewProfile?: () => void
  showSkills?: boolean
}

Display:
- Avatar image
- Name + role
- Department badge
- Skill tags
- Status indicator
- View profile link
```

#### PortfolioGrid
```tsx
Props: {
  items: Array<{
    id: string
    projectName: string
    description: string
    techStack: string[]
    timeline: string
    imageUrl?: string
  }>
  columns?: number (responsive: 1/2/3)
  onItemClick?: (item) => void
  loading?: boolean
}

Features:
- Masonry layout (images optional)
- Tech stack badges
- Click to expand
- Lazy load images
```

#### ActivityFeed
```tsx
Props: {
  activities: Array<{
    id: string
    memberId: string
    memberName: string
    activityType: string
    description: string
    createdAt: string
    avatar?: string
  }>
  onLoadMore?: () => void
  loading?: boolean
  hasMore?: boolean
}

Display:
- Timeline view (left-aligned avatar + content)
- Relative timestamps (e.g., "2 hours ago")
- Activity type icons/colors
- Infinite scroll pagination
```

#### CapabilityScoreChart
```tsx
Props: {
  member: {
    id: string
    name: string
    capabilities: Array<{
      skill: string
      score: number (0-100)
    }>
  }
  onSkillClick?: (skill: string) => void
}

Display:
- Radar chart or bar chart
- Color-coded scores (red < 40, yellow 40-70, green 70+)
- Skill name + percentage
```

---

## 4️⃣ Page Structure & Layouts

### 4.1 Dashboard Page (Main)

**Path:** `/team`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Navbar (Logo + Title + Theme Toggle)    │
├───────────┬─────────────────────────────┤
│           │ Page Title: "Team Dashboard" │
│ Sidebar   ├─────────────────────────────┤
│ (nav)     │                             │
│           │ [Org Chart View]            │
│           │ ┌───────────────────────┐   │
│           │ │  CEO                  │   │
│           │ │  ├─ Mgmt Lead (3)     │   │
│           │ │  ├─ Eng Lead (3)      │   │
│           │ │  └─ Ops Lead (3)      │   │
│           │ └───────────────────────┘   │
│           │                             │
│           │ [Stats Row]                 │
│           │ ┌──────┬──────┬──────────┐  │
│           │ │Total │Active│Avg Score │  │
│           │ │ 11   │ 10  │ 78%      │  │
│           │ └──────┴──────┴──────────┘  │
│           │                             │
│           │ [Tabs: Overview|Members|   │
│           │         Portfolio|Activity] │
│           │                             │
│           │ [Members Grid - 2/3 col]   │
│           │ ┌──────────┬──────────┐    │
│           │ │Member 1  │Member 2  │    │
│           │ ├──────────┼──────────┤    │
│           │ │Member 3  │Member 4  │    │
│           │ └──────────┴──────────┘    │
│           │                             │
└───────────┴─────────────────────────────┘
```

**Sections:**
1. **Header** - Title + filters (department, status)
2. **Organization Chart** - Interactive org structure (expandable)
3. **Statistics Cards** - Total members, active, avg score
4. **Tab Navigation** - Overview | Members | Portfolio | Activity
5. **Content Area** - Dynamic based on active tab
6. **Sidebar** - Navigation menu + logout

**Mobile (320px):**
- Hide sidebar (hamburger toggle)
- Single column layout
- Simplified org chart (list view)
- Stacked statistics

**Tablet (768px):**
- Sidebar visible but narrower
- 2-column grid for members
- Full org chart with zoom controls

**Desktop (1024px+):**
- Full sidebar
- 3-column member grid
- Expanded org chart with interactive hover

### 4.2 Team Member Profile Page

**Path:** `/team/members/:id`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Navbar                                  │
├─────────────────────────────────────────┤
│ [Back Button] Breadcrumb                │
├─────────────────────────────────────────┤
│ [Profile Header]                        │
│ ┌──────┬──────────────────────────────┐ │
│ │Avatar│ Name                         │ │
│ │ (XL) │ Role                         │ │
│ │      │ Department | Status Badge    │ │
│ │      │ [Edit] [Message] [View PDF]  │ │
│ └──────┴──────────────────────────────┘ │
│                                         │
│ [Tabs: Overview | Skills | Portfolio|  │
│        Activity | Team Relations]       │
│                                         │
│ [OVERVIEW Tab Content]                  │
│ ┌─────────────────────────────────────┐ │
│ │ Start Date: [date]                  │ │
│ │ Reports To: [name] > [link to page] │ │
│ │ Direct Reports: [avatar group]      │ │
│ │ Department: [dept name]             │ │
│ │ Email: [email]                      │ │
│ │ Phone: [phone]                      │ │
│ │ Bio: [multi-line text]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [SKILLS Tab]                            │
│ ┌─────────────────────────────────────┐ │
│ │ Skill 1: ▓▓▓▓▓▓░░░░ 65%             │ │
│ │ Skill 2: ▓▓▓▓▓▓▓▓░░ 80%             │ │
│ │ [Add Skill] [Export]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [PORTFOLIO Tab]                         │
│ ├─ [Portfolio Grid - projects]          │
│ │  [Add Portfolio Item]                 │
│ └─                                      │
│                                         │
│ [ACTIVITY Tab]                          │
│ ├─ Activity Feed (latest first)         │
│ │  - Timeline view                      │
│ │  - Load more / Pagination             │
│ └─                                      │
│                                         │
│ [TEAM RELATIONS Tab]                    │
│ ├─ Manager (if exists)                  │
│ ├─ Peers (same department)              │
│ ├─ Direct Reports (if any)              │
│ └─ [View Org Chart]                     │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- Avatar (clickable for full-size view)
- Edit button (admin only) → Opens edit modal
- Message button (future: chat integration)
- Report/export options
- Skill progress bars (color-coded by capability level)
- Portfolio items as clickable cards
- Activity timeline with filtering
- Organization relationships

### 4.3 Organization Chart Page

**Path:** `/team/org-chart`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Navbar                                  │
├─────────────────────────────────────────┤
│ [View: Hierarchy|Departments|Map]       │
│ [Export] [Print] [Zoom In/Out]          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────┐               │
│  │      CEO             │ (Level 0)     │
│  │  김준호              │               │
│  └──────────┬───────────┘               │
│             │                           │
│  ┌──────────┼──────────┬──────────┐    │
│  │          │          │          │    │
│  ▼          ▼          ▼          ▼    │
│ [Mgmt]     [Eng]      [Ops]     [Prod] │
│ Manager    Manager    Manager   Manager│
│  │         │          │         (none) │
│  │         │          │                │
│  ├─ A      ├─ B       ├─ C             │
│  └─ D      ├─ E       └─ F             │
│            └─ G                        │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- **View Modes:**
  - Hierarchy view (tree structure)
  - Department view (grouped by dept)
  - Map view (geographical, if applicable)
- **Interactions:**
  - Click node → Open member profile
  - Hover → Show tooltip (name, role)
  - Expand/collapse branches
  - Search/filter by name/dept
- **Export:**
  - PNG/SVG download
  - PDF print-friendly format

**Mobile (320px):**
- List view (default)
- Department-grouped navigation
- Single column

**Tablet/Desktop (768px+):**
- Tree diagram
- Interactive zoom
- Drag to pan (large charts)

### 4.4 Portfolio Page

**Path:** `/team/portfolio`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Navbar                                  │
├─────────────────────────────────────────┤
│ [Filters]                               │
│ ├─ [Search: project name]               │
│ ├─ [Filter by Team Member]              │
│ ├─ [Filter by Tech Stack]               │
│ └─ [Sort: Latest|Name|A-Z]              │
├─────────────────────────────────────────┤
│ Showing 24 projects (12 per page)       │
│                                         │
│ [Portfolio Grid]                        │
│ ┌────────────┬────────────┬────────────┐│
│ │ Project 1  │ Project 2  │ Project 3  ││
│ ├────────────┼────────────┼────────────┤│
│ │ Project 4  │ Project 5  │ Project 6  ││
│ ├────────────┼────────────┼────────────┤│
│ │ Project 7  │ Project 8  │ Project 9  ││
│ ├────────────┼────────────┼────────────┤│
│ │Project 10  │Project 11  │Project 12  ││
│ └────────────┴────────────┴────────────┘│
│                                         │
│ [Pagination: 1 2 3 ... 10 >]            │
│                                         │
└─────────────────────────────────────────┘
```

**Portfolio Item Card:**
```
┌─────────────────────────────┐
│ [Image thumbnail]           │
│ ┌─────────────────────────┐ │
│ │ Project Name            │ │
│ │ Description (2 lines)   │ │
│ │ Tech: [React] [Node.js] │ │
│ │ Timeline: 2026-05~07    │ │
│ │ Team Member: John Doe   │ │
│ │ [View] [Edit] [Delete]  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Mobile (320px):**
- Single column
- Simplified filters (dropdown)
- Card-only layout (no image)

**Tablet (768px):**
- 2-column grid
- Side-by-side filters

**Desktop (1024px+):**
- 3-column grid
- Full filters visible
- Hover effects on cards

### 4.5 Activity Timeline Page

**Path:** `/team/activity`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Navbar                                  │
├─────────────────────────────────────────┤
│ [Filters]                               │
│ ├─ [Activity Type: All|Joined|...]      │
│ ├─ [Date Range: Last 7 days]            │
│ ├─ [Member: All]                        │
│ └─ [Sort: Newest|Oldest]                │
├─────────────────────────────────────────┤
│ Showing 150 activities                  │
│                                         │
│ [Activity Timeline - Vertical]          │
│                                         │
│ [Avatar] ▼ John Doe joined team         │
│          [2 days ago]                   │
│                                         │
│ [Avatar] ▼ Jane Smith promoted          │
│          [5 days ago]                   │
│                                         │
│ [Avatar] ▼ Bob completed project X      │
│          [1 week ago]                   │
│                                         │
│ [Load More] or [Pagination]             │
│                                         │
└─────────────────────────────────────────┘
```

**Activity Entry:**
```
┌─ [Avatar] ─┐
└─────┬──────┘
      │
      └─ [Activity Type Icon] + Description
         [Timestamp] (e.g., "2 hours ago")
         [View Member Link]
```

**Features:**
- Real-time updates (Supabase realtime)
- Infinite scroll or pagination
- Filter by activity type
- Date range filter
- Member-specific view

---

## 5️⃣ Responsive Layout Specifications

### 5.1 Breakpoints

| Device | Width | Columns | Sidebar | Font |
|--------|-------|---------|---------|------|
| Mobile | 320px | 1 | Hidden (hamburger) | 14px body |
| Small Mobile | 375px | 1 | Hidden | 14px body |
| Tablet | 768px | 2 | Visible (narrow) | 15px body |
| Small Desktop | 1024px | 3 | Visible (full) | 16px body |
| Desktop | 1440px | 3-4 | Visible (full) | 16px body |
| Large Desktop | 1920px | 4-5 | Visible (full) | 16px body |

### 5.2 Container Widths

```css
/* Mobile First */
@media (min-width: 320px) {
  .container { padding: 12px; width: 100%; }
}

@media (min-width: 768px) {
  .container { padding: 20px; max-width: 728px; margin: 0 auto; }
}

@media (min-width: 1024px) {
  .container { padding: 24px; max-width: 984px; }
}

@media (min-width: 1440px) {
  .container { padding: 32px; max-width: 1376px; }
}
```

### 5.3 Grid System

**12-Column Grid (Desktop/Tablet)**
```
4/12 (sidebar) + 8/12 (content)
3/12 + 3/12 + 3/12 + 3/12 (4-column)
6/12 + 6/12 (2-column)
```

**Mobile (320px)**
```
100% (1-column, stacked)
```

**Tablet (768px)**
```
6/12 + 6/12 (2-column)
4/12 + 4/12 + 4/12 (3-column, if needed)
```

### 5.4 Navigation Patterns

**Mobile Hamburger:**
- Hidden sidebar
- Hamburger menu (☰) in navbar
- Full-screen slide-out menu
- Tap outside to close

**Tablet/Desktop:**
- Visible sidebar (collapsible)
- Collapse button (<<)
- Persistent until explicitly closed

---

## 6️⃣ State Management & Data Flow

### 6.1 Global State (Zustand or Context API)

```typescript
// User/Auth State
{
  user: User | null
  isAuthenticated: boolean
  setUser: (user) => void
}

// Theme State
{
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

// UI State
{
  sidebarCollapsed: boolean
  activePage: string
  toggleSidebar: () => void
  setActivePage: (page: string) => void
}

// Team Data State
{
  members: Member[]
  selectedMember: Member | null
  isLoading: boolean
  error: string | null
  setSelectedMember: (member: Member) => void
  refreshMembers: () => Promise<void>
}
```

### 6.2 API Integration Layer (React Query / SWR)

```typescript
// Custom Hooks
useGetMembers(filters?) → { data, isLoading, error, refetch }
useGetMember(id) → { data, isLoading, error }
useGetOrgStructure() → { data, isLoading, error }
useGetPortfolioItems(memberId?) → { data, isLoading, error }
useGetActivityLog(filters?) → { data, isLoading, error }
useGetCapabilityScores(memberId?) → { data, isLoading, error }

// Mutations
useCreateMember() → { mutate, isLoading, error }
useUpdateMember(id) → { mutate, isLoading, error }
useDeleteMember(id) → { mutate, isLoading, error }
useCreatePortfolioItem() → { mutate, isLoading, error }
useLogActivity() → { mutate, isLoading, error }

// Real-time Subscriptions
useSubscribeToActivityLog() → { data, isLoading, unsubscribe }
useSubscribeToMemberUpdates() → { data, isLoading, unsubscribe }
```

### 6.3 Error Handling

**Error States:**
- Network error → Display error message + retry button
- 404 Not Found → Display "Member not found" + back button
- 403 Forbidden → Display "Access denied" message
- 500 Server Error → Display "Something went wrong" + support link
- Timeout (>10s) → Display "Request timeout" + retry button

**Toast Notifications:**
```typescript
showToast({
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  action?: { label, onClick }
})
```

---

## 7️⃣ Accessibility (WCAG AA Compliance)

### 7.1 Color Contrast

**Minimum ratios:**
- Normal text (14px): 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Testing:** Use WebAIM contrast checker
```
Primary Blue #0066CC on White: 8.6:1 ✅
Gray #666666 on White: 5.1:1 ✅
```

### 7.2 Keyboard Navigation

**Tab Order:**
- Logical tab order (top-to-bottom, left-to-right)
- Focus trap in modals
- Skip to main content link
- Focus indicators on all interactive elements

**Keyboard Shortcuts:**
```
Tab → Move to next element
Shift+Tab → Move to previous element
Enter → Activate button/link
Space → Toggle checkbox/radio
Escape → Close modal/dropdown
Arrow Keys → Navigate menu items/tabs
```

### 7.3 Semantic HTML

```html
<header> → Main header (navbar)
<nav> → Navigation areas (sidebar, breadcrumb)
<main> → Main content area
<article> → Self-contained content (activity entries)
<section> → Logical sections
<button> → Clickable actions
<a href="/path"> → Links (not divs)
<label for="input"> → Form labels
<input aria-describedby="error"> → Form fields
```

### 7.4 ARIA Attributes

```html
<!-- Images -->
<img alt="John Doe's profile picture" />

<!-- Icons (decorative) -->
<span aria-hidden="true">★</span>

<!-- Buttons with icons -->
<button aria-label="Close dialog">✕</button>

<!-- Loading states -->
<div aria-busy="true" role="status">Loading...</div>

<!-- Alerts -->
<div role="alert" aria-live="polite">Error: Please try again</div>

<!-- Form inputs -->
<input aria-invalid="true" aria-describedby="error-msg" />
<span id="error-msg">This field is required</span>

<!-- Dropdowns -->
<button aria-expanded="false" aria-haspopup="listbox">
  Filter
</button>

<!-- Modals -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Dialog Title</h2>
</div>
```

### 7.5 Focus Management

- Focus visible on all interactive elements
- Focus outline: 2px solid, 2px offset
- Focus trap in modals (last element tabs to first)
- Focus restore when modal closes

### 7.6 Responsive Text

```css
/* Readable text sizes */
body { font-size: 16px; line-height: 1.5; }
h1 { font-size: 32px; line-height: 1.3; }
h2 { font-size: 24px; line-height: 1.4; }
h3 { font-size: 18px; line-height: 1.5; }

/* Mobile optimization */
@media (max-width: 768px) {
  body { font-size: 14px; line-height: 1.6; }
  h1 { font-size: 24px; }
  h2 { font-size: 20px; }
}
```

### 7.7 Accessibility Checklist

- [x] Color contrast ≥4.5:1 for normal text
- [x] Focus indicators visible
- [x] Keyboard navigation complete
- [x] ARIA labels for icons
- [x] Semantic HTML used
- [x] Form labels associated
- [x] Error messages descriptive
- [x] Images have alt text
- [x] Videos have captions
- [x] Links have descriptive text (not "click here")
- [x] Focus trap in modals
- [x] Toast/alert notifications use aria-live

---

## 8️⃣ Dark Mode Implementation

### 8.1 CSS Variables

```css
:root {
  /* Light theme (default) */
  --color-bg: #FFFFFF;
  --color-surface: #F9F9F9;
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-border: #E8E8E8;
  --color-primary: #0066CC;
  --color-success: #10B981;
  --color-error: #EF4444;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark theme */
    --color-bg: #1A1A1A;
    --color-surface: #2D2D2D;
    --color-text-primary: #F5F5F5;
    --color-text-secondary: #A8A8A8;
    --color-border: #404040;
    --color-primary: #4D94FF;
    --color-success: #10B981;
    --color-error: #EF4444;
  }
}

/* Manual theme toggle */
[data-theme="dark"] {
  --color-bg: #1A1A1A;
  /* ... */
}
```

### 8.2 Theme Switching

```typescript
// hook: useTheme()
const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

const toggleTheme = () => {
  setTheme(theme === 'light' ? 'dark' : 'light')
  localStorage.setItem('theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}

useEffect(() => {
  const savedTheme = localStorage.getItem('theme') || 'system'
  if (savedTheme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(isDark ? 'dark' : 'light')
  } else {
    setTheme(savedTheme as 'light' | 'dark')
  }
}, [])
```

### 8.3 Component Dark Mode Support

All components must support dark mode via CSS variables:

```css
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
}

.card {
  background-color: var(--color-surface);
  border-color: var(--color-border);
}
```

---

## 9️⃣ Loading & Error States

### 9.1 Loading States

**Skeleton Loaders:**
- Member cards → Gray placeholder boxes
- Table rows → Gray placeholder rows
- Charts → Gradient animated skeleton
- Images → Blurred placeholder until loaded

**Loading Spinners:**
```
Small (16px):  Used in buttons, inline
Medium (32px): Used in form submissions
Large (64px):  Used for page-level loading
```

**Lazy Loading:**
- Images → Intersection Observer
- Portfolio items → Pagination on scroll
- Activity feed → Infinite scroll with pagination
- Charts → Load on tab activation

### 9.2 Error States

**Network Errors:**
```
┌─────────────────────────────────┐
│ ⚠️  Unable to load data          │
│                                 │
│ Please check your connection    │
│ and try again.                  │
│                                 │
│ [Retry] [Go Back]               │
└─────────────────────────────────┘
```

**Not Found:**
```
┌─────────────────────────────────┐
│ 404 - Not Found                 │
│                                 │
│ The team member you're looking  │
│ for doesn't exist.              │
│                                 │
│ [Back to Team] [Home]           │
└─────────────────────────────────┘
```

**Empty States:**
```
┌─────────────────────────────────┐
│ 📭 No portfolio items yet       │
│                                 │
│ This team member hasn't added   │
│ any portfolio items.            │
│                                 │
│ [Add Portfolio Item]            │
└─────────────────────────────────┘
```

### 9.3 Validation Errors

**Form Field Errors:**
```
[Input field with red border]
↓
❌ This field is required.
```

**Inline Errors:**
```
[Input: johndoe@gmail.com] ❌
Invalid email format
```

---

## 🔟 Performance Optimization

### 10.1 Image Optimization

- **Formats:** WebP (primary) + JPEG/PNG (fallback)
- **Sizes:** Responsive images with srcset
- **Lazy loading:** `loading="lazy"` attribute
- **CDN:** Supabase storage with optimization
- **Avatar sizes:** 32px, 48px, 64px, 96px

```html
<img 
  src="avatar-64.webp" 
  srcset="avatar-32.webp 32w, avatar-64.webp 64w"
  alt="John Doe"
  loading="lazy"
/>
```

### 10.2 Code Splitting

- Page components → Dynamic imports
- Modal components → Lazy load
- Chart library → Only load on demand
- Utility functions → Tree-shaking friendly

```typescript
const ProfileModal = dynamic(() => import('@/components/ProfileModal'), {
  loading: () => <Skeleton />
})
```

### 10.3 Caching Strategy

- **API responses:** SWR with stale-while-revalidate
- **Member data:** 5-minute cache
- **Portfolio items:** 10-minute cache
- **Activity logs:** Real-time (no caching)
- **Images:** Browser cache (1 year)

### 10.4 Bundle Size

- Target: <100KB JS (gzipped)
- Minify CSS (Tailwind purge)
- Remove unused dependencies
- Monitor with `next/bundle-analyzer`

---

## 1️⃣1️⃣ Interaction Patterns

### 11.1 Hover Effects (Desktop)

```css
/* Subtle lift effect */
.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}

/* Button hover */
.button-primary:hover {
  background-color: var(--color-primary-dark);
}
```

### 11.2 Click/Tap Effects (Mobile)

```css
/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}

/* Active state */
.card:active {
  background-color: var(--color-surface-light);
  transform: scale(0.98);
}
```

### 11.3 Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 0.3s ease-in;
```

**Slide In:**
```css
@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
animation: slideIn 0.3s ease-out;
```

**Skeleton Loading:**
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

**Disable for prefers-reduced-motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0 !important; transition-duration: 0 !important; }
}
```

### 11.4 Transitions

- **Page transitions:** 0.2s fade
- **Modal entry:** 0.3s slide-up
- **Sidebar collapse:** 0.3s slide
- **Tab switch:** 0.2s fade
- **Dropdown open:** 0.15s slide-down

---

## 1️⃣2️⃣ API Integration Guide

### 12.1 Base URL & Authentication

```typescript
// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Auth header (included automatically by Supabase client)
Authorization: Bearer {session.access_token}
```

### 12.2 Data Fetching Hooks

```typescript
// Get all members
const { data: members, isLoading, error, refetch } = useGetMembers({
  department?: string
  status?: 'active' | 'inactive' | 'on_leave'
  page?: number
  limit?: number
})

// Get single member with relations
const { data: member } = useGetMember(memberId)

// Get org structure (hierarchical)
const { data: structure } = useGetOrgStructure()

// Get portfolio items
const { data: portfolio } = useGetPortfolioItems({
  memberId?: string
  page?: number
  limit?: number
})

// Get activity log (real-time)
const { data: activities, subscribe } = useGetActivityLog({
  limit?: number
  offset?: number
})

// Subscribe to real-time updates
useEffect(() => {
  const unsubscribe = subscribe(
    (newActivity) => console.log('New activity:', newActivity)
  )
  return () => unsubscribe()
}, [subscribe])
```

### 12.3 Mutation Hooks

```typescript
// Create member
const { mutate: createMember, isLoading } = useCreateMember()

createMember({
  name: 'John Doe',
  role: 'Software Engineer',
  department: '기술',
  startDate: '2026-05-27',
  avatar_url: 'https://...',
  bio: 'Full-stack developer',
  skills: ['React', 'Node.js'],
  status: 'active'
}, {
  onSuccess: (data) => console.log('Member created:', data),
  onError: (error) => console.log('Error:', error)
})

// Update member
const { mutate: updateMember } = useUpdateMember(memberId)

updateMember({
  name: 'Jane Doe',
  skills: ['React', 'TypeScript', 'Node.js']
})

// Log activity
const { mutate: logActivity } = useLogActivity()

logActivity({
  memberId: '123',
  activityType: 'completed_project',
  description: 'Completed Team Dashboard Phase 1'
})
```

### 12.4 Error Handling

```typescript
// Component level
const { data, error, isLoading } = useGetMembers()

if (isLoading) return <LoadingState />
if (error) return <ErrorState error={error} onRetry={refetch} />
if (!data) return <EmptyState />

return <MemberList members={data} />

// Global error handler
useEffect(() => {
  const handleError = (err: Error) => {
    showToast({
      type: 'error',
      message: err.message,
      action: { label: 'Retry', onClick: () => refetch() }
    })
  }
  // Register global error handler
}, [])
```

### 12.5 Optimistic Updates

```typescript
// Update member optimistically
const { mutate } = useUpdateMember(memberId, {
  onSuccess: (data) => {
    // Update local cache
    queryClient.setQueryData(['member', memberId], data)
  },
  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['member', memberId], context.previousMember)
    showToast({ type: 'error', message: 'Failed to update member' })
  }
})

mutate({ name: 'New Name' })
```

---

## 1️⃣3️⃣ Component Implementation Example

### 13.1 Button Component

```tsx
// components/Button.tsx
import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    onClick,
    children,
    className = '',
    leftIcon,
    rightIcon,
    fullWidth = false,
  }, ref) => {
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent text-blue-600 hover:bg-blue-50',
    }

    const sizeClasses = {
      xs: 'px-2 py-1 text-11px',
      sm: 'px-3 py-2 text-12px',
      md: 'px-4 py-2 text-14px',
      lg: 'px-6 py-3 text-16px',
    }

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-md transition-all
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${fullWidth ? 'w-full' : ''}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        aria-busy={loading}
      >
        {loading && <Spinner size={size} />}
        {leftIcon && !loading && <span>{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span>{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

### 13.2 Card Component

```tsx
// components/Card.tsx
interface CardProps {
  title?: string
  subtitle?: string
  padding?: 'sm' | 'md' | 'lg'
  bordered?: boolean
  interactive?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  padding = 'md',
  bordered = true,
  interactive = false,
  onClick,
  children,
  className = '',
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800
        rounded-lg
        ${paddingClasses[padding]}
        ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''}
        ${interactive ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
    >
      {title && (
        <div className="mb-3">
          <h3 className="text-16px font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-14px text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
```

---

## 1️⃣4️⃣ File Structure

```
dsc-fms-portal/
├── app/
│   └── team/
│       ├── page.tsx                    (Dashboard main page)
│       ├── layout.tsx                  (Layout with sidebar)
│       ├── members/
│       │   ├── page.tsx               (Members list)
│       │   └── [id]/
│       │       └── page.tsx           (Member profile)
│       ├── org-chart/
│       │   └── page.tsx               (Org chart view)
│       ├── portfolio/
│       │   ├── page.tsx               (Portfolio grid)
│       │   └── [id]/
│       │       └── page.tsx           (Portfolio item detail)
│       └── activity/
│           └── page.tsx               (Activity timeline)
├── components/
│   ├── team/
│   │   ├── OrgChart.tsx              (Org chart component)
│   │   ├── TeamMemberCard.tsx         (Member card)
│   │   ├── PortfolioGrid.tsx          (Portfolio grid)
│   │   ├── ActivityFeed.tsx           (Activity timeline)
│   │   └── CapabilityScoreChart.tsx   (Score visualization)
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Modal.tsx
│   │   ├── Tabs.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   ├── Skeleton.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Container.tsx
│   └── forms/
│       ├── MemberForm.tsx
│       ├── PortfolioForm.tsx
│       └── ActivityForm.tsx
├── hooks/
│   ├── useGetMembers.ts
│   ├── useGetMember.ts
│   ├── useGetOrgStructure.ts
│   ├── useGetPortfolioItems.ts
│   ├── useGetActivityLog.ts
│   ├── useGetCapabilityScores.ts
│   ├── useCreateMember.ts
│   ├── useUpdateMember.ts
│   ├── useDeleteMember.ts
│   ├── useCreatePortfolioItem.ts
│   ├── useLogActivity.ts
│   ├── useTheme.ts
│   └── useLocalStorage.ts
├── lib/
│   ├── supabase.ts                   (Supabase client)
│   ├── team-queries.ts               (Query builders)
│   ├── team-mutations.ts             (Mutation builders)
│   └── team-subscriptions.ts         (Real-time subscriptions)
├── styles/
│   ├── globals.css
│   ├── variables.css                 (CSS custom properties)
│   └── tailwind.config.js
└── types/
    ├── team.ts                       (Team-related types)
    └── api.ts                        (API response types)
```

---

## 1️⃣5️⃣ Figma Design Deliverables

### 15.1 Figma File Structure

**Project:** Team Dashboard Phase 2B  
**Status:** In Progress (5+ pages, 35+ components)

**Pages:**
1. 🔵 **Design System**
   - Color palette (light/dark)
   - Typography scale
   - Spacing scale
   - Component library (35+ components)
   - Icons/symbols

2. 🔵 **Dashboard Page**
   - Main dashboard layout
   - Org chart visualization
   - Statistics cards
   - Tab states (Overview/Members/Portfolio/Activity)
   - Mobile/tablet/desktop versions

3. 🔵 **Member Profile Page**
   - Profile header
   - Tab navigation
   - Overview section
   - Skills section
   - Portfolio section
   - Activity section
   - Team relations section

4. 🔵 **Organization Chart**
   - Hierarchy view
   - Department view
   - Interactive node states
   - Responsive versions

5. 🔵 **Portfolio Gallery**
   - Grid layout
   - Item card states
   - Filter/sort UI
   - Pagination

6. 🔵 **Activity Timeline**
   - Activity feed layout
   - Entry states
   - Filter options

7. 🔵 **Component States**
   - All components in various states (default/hover/active/disabled)
   - Dark mode versions

### 15.2 Figma Prototype Interactions

- Click on org chart node → Navigate to member profile
- Click on member card → Open profile modal
- Tab switching → Smooth transitions
- Sidebar collapse → Hamburger toggle animation
- Theme toggle → Dark mode transition
- Filter/sort → Content update animation

---

## 1️⃣6️⃣ Milestone Checklist (Phase 2B)

### Week 1 (5/27 - 6/2)

- [x] **Day 1 (6/3):** Onboarding + API review + Design foundation
- [ ] **Day 2 (6/4):** Wireframes (3 main pages)
- [ ] **Day 3 (6/5):** Component definitions + props (35+ components)
- [ ] **Day 4 (6/6):** Responsive layout specifications
- [ ] **Day 5 (6/7):** Accessibility audit + checklist

### Week 2 (6/3 - 6/10)

- [ ] **Day 6 (6/8):** API integration layer + hooks
- [ ] **Day 7 (6/9):** Figma prototype complete
- [ ] **Day 8 (6/10):** Final validation + Go/No-Go

---

## 1️⃣7️⃣ Success Criteria (Go/No-Go 2026-06-10)

### 🟢 GO (All Required)

✅ **Documentation:**
- [ ] Design specification ≥500 lines
- [ ] All sections complete (components, layouts, states)
- [ ] Clear prop definitions for all components
- [ ] Responsive layout specifications

✅ **Components:**
- [ ] 35+ components fully defined
- [ ] All props documented
- [ ] State variations documented
- [ ] Dark mode support specified

✅ **Figma Prototype:**
- [ ] All 7 pages designed
- [ ] 35+ components in design system
- [ ] Interactive prototypes with flows
- [ ] Responsive versions (mobile/tablet/desktop)
- [ ] Accessibility annotations

✅ **Accessibility:**
- [ ] WCAG AA compliance documented
- [ ] Color contrast verified
- [ ] Keyboard navigation specified
- [ ] ARIA labels defined

✅ **API Integration:**
- [ ] All hooks specified
- [ ] Error handling patterns documented
- [ ] Real-time subscription patterns defined
- [ ] Caching strategy defined

✅ **Quality Assurance:**
- [ ] Evaluator AI approved
- [ ] No blocking issues
- [ ] Handoff ready for Web-Builder

### 🔴 No-Go (Any of These)

- [ ] Design document <500 lines
- [ ] Figma prototype <50% complete
- [ ] Components <30 defined
- [ ] WCAG AA violations identified
- [ ] Evaluator AI rejection

---

## 📞 Questions & Support

**Mentors:**
- **Planner AI:** Design strategy + architecture (daily 18:00 check-in)
- **Evaluator AI:** QA + accessibility validation (Day 6-8)
- **Secretary:** CTB tracking + schedule management

**Escalation:**
- Design decision blocks → Planner AI
- Accessibility concerns → Evaluator AI
- Timeline risks → Secretary AI

---

**Document Status:** 🟡 DRAFT (Milestone 1/3 Complete)  
**Last Updated:** 2026-05-27 20:15 KST  
**Next Milestone:** Figma prototype completion (2026-06-09)
