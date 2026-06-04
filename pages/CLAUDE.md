# 📄 Pages — UI Layout & Navigation Rules

**Scope:** All files in `/pages/**` (Next.js page routes)  
**Parent:** `/CLAUDE.md` (read first for global rules)  
**Related:** `skills/플레너-design-template.md` (design phase source)

---

## Hierarchy
```
Root /CLAUDE.md (global)
  ↓
  pages/CLAUDE.md (this file — page structure)
  ├── pages/api/CLAUDE.md (API routes)
  └── components/CLAUDE.md (reusable components)
```

Start here for page-level rules. For component-level details, check `components/CLAUDE.md`.

---

## 🎯 Page Design Rules (from 플레너-design-template.md)

### 1. Progressive Disclosure Pattern (Mandatory)
**Rule:** Show required fields first. Hide optional fields until user expands.

**Why:** Reduce cognitive load. Busy plant staff (possibly wearing gloves) need minimal UI.

**How to Apply:**
- All pages: identify required vs optional fields
- Layout: required fields visible on initial render
- Hidden: optional fields in expandable section (labeled "Advanced Options" or "More Details")
- Test: load page in browser → required fields visible without scrolling?

**Example:**
```javascript
// ✅ CORRECT: Required visible, optional hidden
<form>
  <RequiredFieldsSection>
    <AssetSelector />
    <SymptomInput />
  </RequiredFieldsSection>
  
  <details>
    <summary>Advanced Options</summary>
    <OptionalFieldsSection>
      <NotesInput />
      <AttachmentUpload />
    </OptionalFieldsSection>
  </details>
</form>

// ❌ WRONG: All fields visible, no disclosure
<form>
  <AssetSelector />
  <SymptomInput />
  <NotesInput />
  <AttachmentUpload />
  <EquipmentHistoryNotes />
  <PredictedResolutionDate />
  ...
</form>
```

### 2. Context Header (Mandatory for Forms)
**Rule:** Every form page must start with context header showing:
- What you're doing (e.g., "Register Breakdown Maintenance Event")
- Which asset (e.g., "Motor Assembly — Plant A")
- Required fields count (e.g., "3 required fields")

**Why:** Prevent form-submission confusion. Team member starts form, gets interrupted, returns 1 hour later → context header reminds them what they were doing.

**How to Apply:**
- All form pages: create context header section
- Content: task title, asset/entity name, field count
- Style: use visual emphasis (larger font, background color)
- Test: form fully loaded → can user see what they're doing without reading form fields?

**Example:**
```javascript
// ✅ CORRECT
<div className="context-header">
  <h1>Register Breakdown Maintenance Event</h1>
  <p>Asset: <strong>Motor Assembly #M-2024-01</strong> (Plant A)</p>
  <p><em>3 required fields</em></p>
</div>
<form>
  ...required fields...
</form>

// ❌ WRONG: No context, just form
<form>
  <input placeholder="Asset ID" />
  ...
</form>
```

### 3. Description-Labeled Dropdowns (Mandatory)
**Rule:** Every dropdown must show description of selected value, not just label.

**Why:** Team member selects "Motor burnt out" → what does that mean? Description shows consequences (e.g., "Requires replacement. ~24hr downtime.").

**How to Apply:**
- All dropdown/select fields: add description display
- Content: description from glossary (§2 field: label_description or label_comment)
- Update glossary if description missing
- Test: select dropdown value → see description?

**Example:**
```javascript
// ✅ CORRECT: Description shown
<div>
  <label>Failure Type</label>
  <select onChange={handleSelect}>
    <option value="">Choose one...</option>
    <option value="motor_burnout">Motor Burnt Out</option>
  </select>
  {selectedValue && (
    <p className="description">
      <strong>Motor Burnt Out:</strong> Requires replacement. ~24hr repair time.
    </p>
  )}
</div>

// ❌ WRONG: No description
<select>
  <option>Motor Burnt Out</option>
</select>
```

### 4. Form Submit Validation (Before Page Load)
**Rule:** Validate all inputs on page load. If data invalid, show error + disable submit.

**Why:** Prevent user wasting time filling invalid form (e.g., form wants asset_id but system has no assets).

**How to Apply:**
- Page component: `useEffect` on mount → validate data
- If invalid: show error message (what's wrong? how to fix?)
- Submit button: disabled until validation passes
- Test: load page with invalid data → see error message + disabled submit?

**Example:**
```javascript
// ✅ CORRECT
useEffect(() => {
  validateFormData()
    .then(valid => setCanSubmit(valid))
    .catch(err => setError(err.message));
}, []);

return (
  <form>
    {error && <ErrorBox>{error}</ErrorBox>}
    <button disabled={!canSubmit}>Submit</button>
  </form>
);

// ❌ WRONG: No validation, submit always enabled
<button onClick={handleSubmit}>Submit</button>
```

### 5. Glossary-Driven Dropdowns (No Hard-Coded Strings)
**Rule:** All dropdown options must come from glossary table, not hard-coded in code.

**Why:** Glossary = single source of truth. If HQ updates "Motor burnt out" → "Motor assembly failure" in glossary, UI updates automatically (no code deploy).

**How to Apply:**
- Query glossary before rendering page
- Map glossary entries to dropdown options
- Example: `{glossary.map(g => <option key={g.id}>{g.label_ko}</option>)}`
- Test: change glossary value → dropdown reflects change without code deploy?

**Example:**
```javascript
// ✅ CORRECT: From glossary
const options = glossaryEntries
  .filter(g => g.source_system === 'ui')
  .map(g => <option key={g.id} value={g.id}>{g.label_ko}</option>);

return <select>{options}</select>;

// ❌ WRONG: Hard-coded, must redeploy to change
<select>
  <option value="motor_burnout">Motor Burnt Out</option>
  <option value="bearing_failure">Bearing Failure</option>
</select>
```

### 6. Physical Environment Adaptation (Conditional)
**Rule:** Page layout adapts to physical environment (glove usage, screen size, noise level).

**Why:** Plant staff might wear gloves (need larger buttons). Factory floor might be noisy (need visual feedback over sound).

**How to Apply:**
- Identify target environment (office? factory floor? both?)
- If factory floor: buttons minimum 44px height, no sound-only feedback
- If office: normal sizing OK
- Test: use page with gloves on? on small phone? in noisy environment?

**Environment Patterns:**
| Environment | Pattern | Implementation |
|------------|---------|-----------------|
| **Factory floor (gloves)** | Full-screen input fields | Single column, large buttons (44px+), touch-friendly spacing |
| **Office (mouse/keyboard)** | Normal form layout | 2-3 columns, standard sizing, desktop-optimized |
| **Noisy factory** | Visual feedback emphasis | Toast notifications (see them), no sound alerts |
| **Low-light factory** | High contrast required | WCAG AAA color contrast, no dark grays |

---

## 📋 Page Creation Checklist

Before committing a new page file:

```
[ ] Context header present (h1 + asset name + required field count)?
[ ] Progressive Disclosure: required visible, optional hidden?
[ ] All dropdowns populated from glossary (not hard-coded)?
[ ] All dropdowns show descriptions?
[ ] Form validates on page load → error shown if invalid?
[ ] Submit button disabled until validation passes?
[ ] Layout tested in target environment (gloves? small screen? noisy?)?
[ ] CLAUDE.md referenced in code comment (why this design)?
[ ] Glossary entries exist for all labels (check with data-analyst)?
[ ] No hard-coded strings (all labels from glossary)?
```

---

## 🚫 Common Anti-Patterns (Pages)

### Anti-Pattern 1: No Context Header
```javascript
// ❌ WRONG: User lost after leaving page, returns later
export default function Page() {
  return <BmForm />;
}

// ✅ CORRECT: User knows exactly what they're doing
export default function BmEventPage() {
  return (
    <>
      <ContextHeader task="Register Maintenance Event" asset="Motor #A1" />
      <BmForm />
    </>
  );
}
```

### Anti-Pattern 2: Hard-Coded Dropdowns
```javascript
// ❌ WRONG: Must redeploy to change values
<select>
  <option>Motor Burnt Out</option>
  <option>Bearing Failure</option>
</select>

// ✅ CORRECT: Changes via glossary (no redeploy)
{glossary
  .filter(g => g.field_key === 'failure_type')
  .map(g => <option key={g.id}>{g.label_ko}</option>)}
```

### Anti-Pattern 3: All Fields Visible
```javascript
// ❌ WRONG: Overwhelming for plant staff
<form>
  <input placeholder="Asset ID" />
  <input placeholder="Symptom" />
  <input placeholder="Notes" />
  <input placeholder="Attachment URL" />
  <input placeholder="Equipment History" />
  <input placeholder="Predicted Resolution Date" />
  <input placeholder="Secondary Failure Codes" />
</form>

// ✅ CORRECT: Required visible, rest hidden
<form>
  <fieldset>
    <input placeholder="Asset ID" /> {/* required */}
    <input placeholder="Symptom" /> {/* required */}
  </fieldset>
  <details>
    <summary>Additional Details</summary>
    <input placeholder="Notes" />
    <input placeholder="Attachment URL" />
  </details>
</form>
```

### Anti-Pattern 4: No Validation on Page Load
```javascript
// ❌ WRONG: User clicks submit, then sees "Asset ID required"
<form onSubmit={handleSubmit}>
  <input name="asset_id" />
  <button>Submit</button>
</form>

// ✅ CORRECT: User sees validation error immediately
useEffect(() => {
  validateAssets()
    .then(() => setReady(true))
    .catch(e => setError(`Assets unavailable: ${e.message}`));
}, []);

return (
  <form>
    {error && <ErrorBox>{error}</ErrorBox>}
    <button disabled={!ready || !formValid}>Submit</button>
  </form>
);
```

---

## 🎯 Environment-Specific Guidance

### Pages for Factory Floor (Glove Usage)
**Rule:** Design for single-hand operation, gloved touch.

Requirements:
- Buttons minimum 44px × 44px (glove-friendly)
- Single-column layout (no 2-column forms on mobile)
- All content fit in viewport height (no excessive scrolling)
- Large, tap-friendly spacing between inputs
- No hover effects (gloves don't hover)

Example pattern:
```javascript
// ✅ Factory floor optimized
<div className="container-single-column">
  <h1 className="text-lg">Register Maintenance</h1>
  <button className="btn-large">Choose Asset</button> {/* 44px+ */}
  <input className="input-large" />
  <button className="btn-large">Submit</button> {/* 44px+ */}
</div>
```

### Pages for Office (Desktop/Mouse)
**Rule:** Optimize for desktop screens, multiple columns OK.

Requirements:
- Normal button sizing (24px+)
- Can use 2-3 column layout on desktop
- Hover effects OK
- Compact spacing acceptable

Example pattern:
```javascript
// ✅ Office optimized
<div className="grid-2-col">
  <div><input placeholder="Asset" /></div>
  <div><input placeholder="Symptom" /></div>
</div>
```

---

## 📚 Related Files

- **Planner Template:** `skills/플레너-design-template.md` (design phase guidance)
- **Root Rules:** `/CLAUDE.md` (global team rules, glossary SSOT)
- **Component Rules:** `/components/CLAUDE.md` (reusable component structure)
- **API Rules:** `/pages/api/CLAUDE.md` (data retrieval for pages)

---

**Last Updated:** 2026-06-05 03:20 KST  
**Scope:** Next.js `/pages/**` routes  
**Version:** 3.0 (Phase 3)
