# 🧩 Components — Structure & Dependency Rules

**Scope:** All files in `/components/**` (reusable React components)  
**Parent:** `/CLAUDE.md` (read first for global rules)  
**Related:** `skills/플레너-design-template.md` (design phase source)

---

## Hierarchy
```
Root /CLAUDE.md (global)
  ↓
  pages/CLAUDE.md (page layout)
  ├── pages/api/CLAUDE.md (API routes)
  └── components/CLAUDE.md (this file — reusable components)
```

This file covers reusable component structure. For page-level composition, check `pages/CLAUDE.md`.

---

## 🎯 Component Architecture Rules

### 1. Folder Structure = Data Dependencies (Mandatory)
**Rule:** Folder organization reflects data flow. Parent components → child components.

**Why:** Component tree should visually match data flow. Easy to understand "which component depends on what?"

**Pattern:**
```
components/
├── forms/ (components that collect user input)
│   ├── bm-form/ (main form for BM registration)
│   │   ├── BmForm.jsx (parent)
│   │   ├── asset-selector/ (child: depends on asset list)
│   │   │   └── AssetSelector.jsx
│   │   ├── symptom-input/ (child: single text input)
│   │   │   └── SymptomInput.jsx
│   │   ├── priority-badge/ (child: displays urgency level)
│   │   │   └── PriorityBadge.jsx
│   │   └── form-submit/ (child: submit button)
│   │       └── FormSubmitButton.jsx
│   │
│   └── asset-form/
│       ├── AssetForm.jsx (parent)
│       ├── asset-input/
│       └── location-selector/
│
├── displays/ (components that show data, no input)
│   ├── bm-event-card/ (card showing one BM event)
│   │   ├── BmEventCard.jsx
│   │   ├── event-header/
│   │   ├── event-status/
│   │   └── event-timeline/
│   │
│   └── asset-status-badge/
│
└── utilities/ (no data dependencies, reusable logic)
    ├── date-formatter/
    ├── glossary-selector/
    └── loading-spinner/
```

**Guideline:**
- Components with data fetching (forms) → `/forms`
- Components that display data → `/displays`
- Components with no data dependency (spinners, badges) → `/utilities`
- Child component folder → lives inside parent folder
- Naming: `kebab-case` for folders, `PascalCase` for files

**Anti-Pattern:**
```
components/
├── BmForm.jsx ❌ (parent at wrong level)
├── AssetSelector.jsx ❌ (child at wrong level)
├── SymptomInput.jsx ❌ (no clear relationship)
```

### 2. Props = Clear Data Contract (Mandatory)
**Rule:** Every component must document its props explicitly. Props = contract between parent and child.

**What to Include:**
```javascript
// ✅ CORRECT: Clear prop contract
/**
 * AssetSelector - Select equipment for maintenance event
 * 
 * @component
 * @param {string} selected - Currently selected asset ID
 * @param {Array<Object>} assets - Available assets [{id, name, status}]
 * @param {Function} onChange - Callback when user selects asset
 * @param {string} [placeholder="Choose asset..."] - Input placeholder (optional)
 * @returns {JSX.Element}
 * 
 * @example
 * <AssetSelector 
 *   selected="motor-1"
 *   assets={[{id: 'motor-1', name: 'Motor A', status: 'active'}]}
 *   onChange={(id) => setSelected(id)}
 *   placeholder="Pick equipment..."
 * />
 */
export function AssetSelector({ selected, assets, onChange, placeholder }) {
  return (
    <select value={selected} onChange={(e) => onChange(e.target.value)}>
      <option>{placeholder}</option>
      {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
  );
}
```

**Why:**
- Parent knows exactly what data to pass
- Child knows exactly what data to expect
- Changes to props = can track impact across components
- Someone else reading code immediately understands component contract

### 3. No Hard-Coded Glossary Values (Mandatory)
**Rule:** All UI labels, dropdown options, status values come from glossary table.

**Pattern:**
```javascript
// ✅ CORRECT: From glossary
export function PriorityBadge({ priority_id, glossaryEntries }) {
  const label = glossaryEntries.find(g => g.id === priority_id);
  return <span className="badge">{label?.label_ko}</span>;
}

// ❌ WRONG: Hard-coded
export function PriorityBadge({ priority }) {
  const labels = {
    'high': '높음',
    'medium': '중간',
    'low': '낮음'
  };
  return <span>{labels[priority]}</span>;
}
```

**Why:** If HQ changes "높음" → "긴급" in glossary, all UI updates automatically (no code change needed).

### 4. Component Composition Flow (Recommended)
**Rule:** Data flows one direction: parent → child (no circular dependencies).

**Pattern:**
```
PageComponent
  ├── ContextHeader (reads: taskName, assetName)
  ├── BmForm (parent form)
  │   ├── AssetSelector (child: reads: assets list, writes: selected asset ID)
  │   ├── SymptomInput (child: reads: placeholder, writes: symptom text)
  │   └── FormSubmitButton (child: reads: isValid, writes: onSubmit)
  └── ActionSummary (reads: formData from page state)
```

**Rules:**
- Parent passes data down via props
- Child sends updates back via callbacks (onChange, onSubmit)
- No child accessing sibling's state directly
- No circular dependencies (Component A → B → A)

**Anti-Pattern:**
```javascript
// ❌ WRONG: Child tries to read parent's state directly
function ChildComponent() {
  return <div>{parentFormData.assetId}</div>; // where's parentFormData?
}

// ✅ CORRECT: Parent passes via props
function ChildComponent({ assetId }) {
  return <div>{assetId}</div>;
}

// Parent:
<ChildComponent assetId={formData.assetId} />
```

### 5. Data Fetching Location (Mandatory)
**Rule:** Fetch data at page level, pass down via props. Don't fetch in leaf components.

**Pattern:**
```javascript
// ✅ CORRECT: Data fetched at page level
// pages/maintenance/create.js
export default function CreateMaintenancePage() {
  const [assets, setAssets] = useState([]);
  
  useEffect(() => {
    // Fetch at page level
    fetchAssets().then(setAssets);
  }, []);
  
  return <BmForm assets={assets} />; // Pass to form
}

// components/forms/bm-form/BmForm.jsx
export function BmForm({ assets }) {
  return (
    <form>
      <AssetSelector assets={assets} /> {/* Pass to child */}
    </form>
  );
}

// ❌ WRONG: Data fetched in leaf component
export function AssetSelector() {
  const [assets, setAssets] = useState([]);
  
  useEffect(() => {
    // Fetching deep in component tree = hard to debug
    fetchAssets().then(setAssets);
  }, []);
  
  return <select>{assets.map(...)}</select>;
}
```

**Why:**
- Centralized data loading easier to debug
- Can show loading state at page level
- Easier to test components (mock data via props)
- Prevents duplicate API calls

### 6. Error Boundary / Error States (Mandatory)
**Rule:** Every component that could fail must handle error state.

**Pattern:**
```javascript
// ✅ CORRECT: Handle error state
export function AssetSelector({ assets, error, isLoading }) {
  if (error) {
    return <div className="error">Failed to load assets: {error}</div>;
  }
  
  if (isLoading) {
    return <div className="spinner">Loading assets...</div>;
  }
  
  return (
    <select>
      {assets.map(a => <option key={a.id}>{a.name}</option>)}
    </select>
  );
}

// ❌ WRONG: No error handling
export function AssetSelector({ assets }) {
  return <select>{assets.map(...)}</select>; // crashes if assets undefined
}
```

**Error States to Handle:**
- Loading (`isLoading`)
- Error (`error` message)
- Empty (`assets.length === 0`)
- Disabled (`disabled` prop)

---

## 🏗️ Component Checklist

Before committing a new component:

```
Structure:
[ ] Component folder exists in correct category (/forms, /displays, /utilities)?
[ ] Child components in subfolders under parent?
[ ] Folder names kebab-case, file names PascalCase?
[ ] Related utilities (styles, hooks) in same folder?

Props & Interface:
[ ] Props documented with JSDoc?
[ ] All prop types specified?
[ ] Optional props marked with [bracket]?
[ ] Example usage in JSDoc?
[ ] No unnecessary props (each prop has clear purpose)?

Data & Glossary:
[ ] No hard-coded strings (all from glossary)?
[ ] Glossary entries exist for all labels?
[ ] If fetching data: fetch at parent level (not this component)?

Error Handling:
[ ] Handles loading state (isLoading)?
[ ] Handles error state (error message)?
[ ] Handles empty state (no data)?
[ ] Displays meaningful error messages to user?

Composition:
[ ] Props flow: parent → child only (no circular deps)?
[ ] Callbacks: child → parent via onChange/onSubmit/etc?
[ ] No sibling component dependencies?
[ ] No direct parent state access from child?

Performance:
[ ] No unnecessary re-renders (memo if expensive)?
[ ] No inline functions in render (extract to const)?
[ ] No infinite loops in useEffect?
```

---

## 📋 Common Component Patterns

### Pattern 1: Form Input with Validation
```javascript
// /components/forms/bm-form/symptom-input/SymptomInput.jsx
/**
 * SymptomInput - Textarea for describing maintenance issue
 * @param {string} value - Current symptom text
 * @param {Function} onChange - Callback on change
 * @param {boolean} [required=true] - Is field required
 */
export function SymptomInput({ value, onChange, required = true }) {
  const maxLength = 500;
  
  return (
    <div>
      <label>
        Symptom {required && <span className="required">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what's wrong..."
        maxLength={maxLength}
        required={required}
      />
      <p className="hint">{value.length}/{maxLength}</p>
    </div>
  );
}
```

### Pattern 2: Display Component with Loading
```javascript
// /components/displays/bm-event-card/BmEventCard.jsx
/**
 * BmEventCard - Display single maintenance event
 * @param {Object} event - Event data {id, asset, failure_code, status}
 * @param {boolean} [isLoading=false] - Show loading skeleton
 * @param {string} [error] - Error message if load failed
 */
export function BmEventCard({ event, isLoading, error }) {
  if (isLoading) {
    return <div className="skeleton" />;
  }
  
  if (error) {
    return <div className="error">Failed to load: {error}</div>;
  }
  
  if (!event) {
    return null;
  }
  
  return (
    <div className="card">
      <h3>{event.asset}</h3>
      <p>{event.failure_code}</p>
      <span className={`status status-${event.status}`}>
        {event.status}
      </span>
    </div>
  );
}
```

### Pattern 3: Composite Form Component
```javascript
// /components/forms/bm-form/BmForm.jsx
/**
 * BmForm - Main form for reporting maintenance events
 * @param {Object} props
 * @param {Array} props.assets - Available equipment
 * @param {Function} props.onSubmit - Callback on form submit
 * @param {boolean} [props.isLoading] - Show loading state
 */
export function BmForm({ assets, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    asset_id: '',
    symptom: '',
    notes: ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.asset_id || !formData.symptom) {
      alert('Fill required fields');
      return;
    }
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <AssetSelector
        selected={formData.asset_id}
        assets={assets}
        onChange={(id) => setFormData({...formData, asset_id: id})}
      />
      <SymptomInput
        value={formData.symptom}
        onChange={(text) => setFormData({...formData, symptom: text})}
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 🚫 Common Anti-Patterns (Components)

### Anti-Pattern 1: All Components at Same Level
```
components/
├── BmForm.jsx ❌
├── AssetSelector.jsx ❌
├── SymptomInput.jsx ❌
├── PriorityBadge.jsx ❌
(no clear relationship between components)

✅ CORRECT:
components/
├── forms/
│   └── bm-form/
│       ├── BmForm.jsx
│       ├── asset-selector/
│       ├── symptom-input/
│       └── priority-badge/
```

### Anti-Pattern 2: Fetch Data in Every Component
```javascript
// ❌ WRONG: Duplicate API calls
export function AssetSelector() {
  const [assets, setAssets] = useState([]);
  useEffect(() => { fetchAssets()... }, []); // fetch here
  return <select>{assets.map(...)}</select>;
}

export function AssetFilter() {
  const [assets, setAssets] = useState([]);
  useEffect(() => { fetchAssets()... }, []); // fetch again!
  return <div>{assets.filter(...)}</div>;
}

// ✅ CORRECT: Fetch at page, pass via props
export default function Page() {
  const [assets, setAssets] = useState([]);
  useEffect(() => { fetchAssets().then(setAssets) }, []);
  
  return (
    <>
      <AssetSelector assets={assets} />
      <AssetFilter assets={assets} />
    </>
  );
}
```

### Anti-Pattern 3: Hard-Coded Labels
```javascript
// ❌ WRONG: Hard-coded strings scattered everywhere
export function StatusBadge({ status }) {
  return <span>{status === 'active' ? '활성' : '비활성'}</span>;
}

// Later, HQ changes "활성" → "운영중"
// Now must search entire codebase for "활성" and replace

// ✅ CORRECT: From glossary
export function StatusBadge({ status, glossary }) {
  const label = glossary.find(g => g.field_key === 'asset_status' && g.id === status);
  return <span>{label?.label_ko}</span>;
}

// HQ changes in glossary table
// UI updates automatically
```

### Anti-Pattern 4: No Error Handling
```javascript
// ❌ WRONG: Crashes on error
export function AssetSelector({ assets }) {
  return (
    <select>
      {assets.map(a => <option>{a.name}</option>)} // crash if undefined!
    </select>
  );
}

// ✅ CORRECT
export function AssetSelector({ assets, error, isLoading }) {
  if (error) return <div>Error: {error}</div>;
  if (isLoading) return <div>Loading...</div>;
  if (!assets?.length) return <div>No assets available</div>;
  
  return (
    <select>
      {assets.map(a => <option key={a.id}>{a.name}</option>)}
    </select>
  );
}
```

---

## 📚 Related Files

- **Planner Template:** `skills/플레너-design-template.md` (design phase)
- **Root Rules:** `/CLAUDE.md` (global team rules)
- **Page Rules:** `/pages/CLAUDE.md` (page-level composition)
- **API Rules:** `/pages/api/CLAUDE.md` (data source for components)

---

**Last Updated:** 2026-06-05 03:30 KST  
**Scope:** React components in `/components/**`  
**Version:** 3.0 (Phase 3)
