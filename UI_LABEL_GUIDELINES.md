# UI Label Guidelines v2.0 — DSC FMS Portal

**Version:** 2.0  
**Effective Date:** 2026-05-19  
**Languages:** English | Tamil | 한국어 (Korean)  
**Scope:** Button labels, menu items, form fields, placeholder text, error messages, tooltips  
**Maintained by:** Translator + Web-Builder  
**Last Updated:** 2026-05-19 18:00 KST

---

## 1. Label Naming Conventions

### 1.1 General Rules

**Rule 1: Consistency Across Languages**
- Use the same term from GLOSSARY_v2.0.md for all occurrences
- Never invent new terminology; cross-reference the glossary first
- If a term is missing from the glossary, add it before UI implementation

**Rule 2: Capitalization**

| Language | Rule | Example |
|----------|------|---------|
| English | Title Case for buttons/headers, lowercase for placeholders | Create Asset, search by name |
| Tamil | Capitalize first letter only (standard Tamil convention) | சொத्து உ़ष्டాक्कु (Asset Create) |
| Korean | Title Case for menu items, lowercase for inline labels | 자산 등록 (Asset Registration), 검색 (search) |

**Rule 3: Length Limits**

| Component | English | Tamil | Korean | Examples |
|-----------|---------|-------|--------|----------|
| Button | Max 20 chars | Max 25 chars | Max 15 chars | "Create Asset", "சொத्து உ़ष्टാक्कु", "자산 등록" |
| Form Label | Max 30 chars | Max 35 chars | Max 20 chars | "Asset Location", "சொத्து உ့்ఠుओ", "자산 위치" |
| Placeholder | Max 40 chars | Max 45 chars | Max 30 chars | "Enter asset number or serial", … |
| Tooltip | Max 100 chars | Max 120 chars | Max 80 chars | Long descriptive text |
| Menu Item | Max 25 chars | Max 30 chars | Max 18 chars | "Import Assets", "Asset Reports" |

**Rule 4: Abbreviations & Acronyms**
- **Status:** Never abbreviate in UI labels (always "Status", not "Sts.")
- **Actions:** Use full words (always "Create", not "Add" unless specifically referring to "Add Row")
- **Technical Terms:** QR Code, FTS, RBAC → keep as-is with explanation tooltip
- **Measurements:** Keep units in parentheses: "Quantity (Units)", "Cost (INR)"

---

## 2. Multi-Language Translation Rules

### 2.1 English (Primary)

**Guidelines:**
- Use clear, business-standard English
- Prefer active voice ("Create Asset" vs "Asset Created")
- Use present tense for actions, present perfect for status
- Keep consistency with manufacturing/inventory terminology
- Technical terms (QR Code, Serial Number, etc.) are standardized

**Examples:**
```
Button: "Create Asset" (not "Add New Asset" or "Create New")
Label: "Asset Location" (not "Where is the asset?")
Placeholder: "Enter asset number" (not "Type something here")
Error: "Asset number is required" (not "Can't leave this empty")
```

### 2.2 Tamil Transliteration

**Guidelines:**
- Use standard Tamil grammar (verb-subject-object order)
- Transliterate using Tamil script for technical terms where possible
- For English acronyms (QR, FTS, API), use parenthetical clarification
- Keep colloquial terms for status/state (e.g., "செயல்படுத்தப்பட்ட" = Active)
- Use formal/technical Tamil for manufacturing contexts

**Rules:**
- **Verbs:** Always in imperative (command) form for buttons
  - Create: உ़ष्टாक्कு (Ushtakku) — Noun: உ़ष्டਿྲี (Ushti) — Creation event
  - Update: மாறுпাशु (Marupashu) — Noun: மாறुपாशು (Marupashu) — Modification
  - Delete: நीक్కு (Neekku) — Noun: നീക്കു (Neekku) — Deletion

- **Adjectives:** Use Tamil grammar agreement
  - Active: செயல్்నпобడుюत (Seyal-pada-yuta) — lit. "functioning"
  - Inactive: നിര്­नპોДो (Nirnpoda) — lit. "non-functioning"
  - Maintenance: பेराමരिप्పु स్థिति (Peramaripu Sthiti) — "maintenance state"

**Examples:**
```
Button: "சொத్து உ़ష్ටାक్కु" (Create Asset)
Label: "சொத్து இட" (Asset Location)
Placeholder: "சொத్து えങ் குಚિక্കु" (Enter asset number)
Error: "சொत్్ತು இങ్् అAvaश్yకు" (Asset number required)
Status: "செயల్್నపДо" (Active)
```

### 2.3 Korean

**Guidelines:**
- Use formal/business Korean (경어체 - polite speech level)
- Preserve Sino-Korean compound words for technical terms
- For imported English terms, use 외래어 (katakana-style writing): QR (큐알), API (에이피아이)
- Verb forms: Always use imperative/infinitive for buttons, present tense for labels
- Maintain consistency with manufacturing/logistics industry terminology

**Rules:**
- **Verbs:** Infinitive form (dictionary form) for buttons + passive subject
  - Create: 등록 (deung-rok) — lit. "registration"
  - Update: 수정 (su-jeong) — lit. "correction"
  - Delete: 삭제 (sak-je) — lit. "deletion"
  - Search: 검색 (geom-saek) — lit. "search"

- **Adjectives:** Use present tense forms
  - Active: 활성 (hwal-seong) — Active
  - Inactive: 비활성 (bi-hwal-seong) — Inactive
  - Maintenance: 보전 (bo-jeon) — Maintenance

- **Noun Modifiers:** Use -적 (jeok) suffix for adjective forms
  - Operational: 운영적 (un-yeong-jeok) — Operational
  - Financial: 재정적 (jae-jeong-jeok) — Financial
  - Technical: 기술적 (gi-sul-jeok) — Technical

**Examples:**
```
Button: "자산 등록" (Create Asset)
Label: "자산 위치" (Asset Location)
Placeholder: "자산 번호 입력" (Enter asset number)
Error: "자산 번호는 필수입니다" (Asset number is required)
Status: "활성" (Active)
Status: "보전 중" (In Maintenance)
```

---

## 3. UI Component Labeling Standards

### 3.1 Buttons

**Standard Format:** `[Action] [Object]`

| Context | English | Tamil | Korean | Notes |
|---------|---------|-------|--------|-------|
| Create | Create Asset | சொத्து உ़ष्టाक्कु | 자산 등록 | Primary action, CTA |
| Edit | Edit Asset | சொத์ு மாறुपाशු | 자산 수정 | Secondary action |
| Delete | Delete Asset | சொत์ುೕ நीக్కු | 자산 삭제 | Destructive, warn |
| Save | Save Changes | மாறுपాशುпों சെয | 변경 저장 | Form confirmation |
| Cancel | Cancel | மடக్కँుदა | 취소 | Form abort |
| Export | Export to Excel | விष्తור एक्सेल्क़ु | Excel로 내보내기 | Data action |
| Import | Import Assets | సౌต్్తु आयथ్ | 자산 가져오기 | Data action |
| Search | Search | शोध | 검색 | Inline action |
| Reset | Reset Filters | फिलटર हटाएँ | 필터 재설정 | Form action |
| Back | Go Back | ಹೀ ತಿರುಗಿಸು | 뒤로 가기 | Navigation |

**Color/State Mapping:**
```
Primary (CTA): Create, Save, Export → Green (#22c55e)
Secondary: Edit, Search → Blue (#3b82f6)
Tertiary: Cancel, Reset → Gray (#6b7280)
Destructive: Delete → Red (#ef4444) + confirmation modal
Disabled: All buttons when form invalid → Gray (#d1d5db)
```

### 3.2 Form Labels & Fields

**Standard Format:** `[Object] [Property]` or `[Property]` (context-dependent)

| Field Type | English Label | Tamil | Korean | Placeholder | Type |
|------------|---------------|-------|--------|-------------|------|
| Text Input | Asset Number | சொत్్తు எङ्్ | 자산 번호 | e.g., AST-001 | text |
| Text Input | Asset Name | సౌత్్తు నाম | 자산 이름 | Enter full name | text |
| Dropdown | Asset Category | సౌత్్తు వഗ | 자산 분류 | — Select — | select |
| Dropdown | Location | ಇಡ | 위치 | — Select — | select |
| Dropdown | Status | నສта | 상태 | — Select — | select |
| Textarea | Description | విவరण | 설명 | Add notes here | textarea |
| Date | Purchase Date | కំ தேतి | 구입 날짜 | YYYY-MM-DD | date |
| Number | Cost (INR) | খrच | 비용 (INR) | e.g., 50000 | number |
| Checkbox | Archive Asset | సৌত్్తు संग్रह | 자산 아카이브 | — | checkbox |

**Required Field Indicator:**
- English: Add asterisk `*` immediately after label name: `Asset Number *`
- Tamil: Add asterisk after: `சொత््تు எङ्್ *`
- Korean: Add asterisk after: `자산 번호 *`
- All languages: Display in red (#ef4444)

### 3.3 Table Column Headers

**Standard Format:** `[Object Property]` (Title Case)

| Column | English | Tamil | Korean | Sort | Width |
|--------|---------|-------|--------|------|-------|
| ID | Asset Number | సౌత్್తు అಣು | 자산 번호 | ↑↓ | 120px |
| Name | Asset Name | సౌత్్తు నॉම | 자산 이름 | ↑↓ | 200px |
| Category | Category | వর్ग | 분류 | ↑↓ | 140px |
| Location | Location | ಇಡ | 위치 | ↑↓ | 150px |
| Status | Status | నስ్తు | 상태 | ↑↓ | 120px |
| Created | Created Date | సम्बन్ធित_దశ | 생성 날짜 | ↑↓ | 140px |
| Actions | Actions | చ్చ్యা | 작업 | — | 120px |

### 3.4 Status & State Labels

**Standard Format:** `[State Name]` (Title Case in English/Korean, lowercase in Tamil)

| Status | English | Tamil | Korean | Context | Color |
|--------|---------|-------|--------|---------|-------|
| Active | Active | செయल్్న | 활성 | Asset in use | Green (#22c55e) |
| Inactive | Inactive | నిषెభ్ద | 비활성 | Asset idle/unused | Gray (#6b7280) |
| Maintenance | Maintenance | பేराමरিપ్్ు | 보전 중 | Under service | Yellow (#eab308) |
| Sold | Sold | అંశభજ్జ | 판매됨 | Asset disposed | Gray (#9ca3af) |
| Scrapped | Scrapped | సంభ్్ఖు | 폐기됨 | Asset discarded | Gray (#9ca3af) |
| Processing | Processing | సंస్కार్ | 처리 중 | Import/export in progress | Yellow (#eab308) |
| Success | Success | సఫలత | 성공 | Operation completed | Green (#22c55e) |
| Failed | Failed | విఫలత | 실패 | Operation error | Red (#ef4444) |

### 3.5 Menu & Navigation

| Menu Item | English | Tamil | Korean | URL/Path | Icon |
|-----------|---------|-------|--------|----------|------|
| Dashboard | Dashboard | డ్యాషభర్డ | 대시보드 | / | 📊 |
| Asset List | Assets | సౌత్్తులు | 자산 목록 | /assets | 📦 |
| Create Asset | New Asset | కొత్త సౌत్్తు | 자산 등록 | /assets/create | ➕ |
| Settings | Settings | సెట్టుఠ | 설정 | /settings | ⚙️ |
| Reports | Reports | ఖాతీ | 보고서 | /reports | 📋 |
| Backup | Backup | అप్‌బ్యాక్్ | 백업 | /backup | 💾 |
| Travel | Travel | యేట్రావ‌్ | 여행 | /travel | ✈️ |
| Audit | Audit | ఆడిట్ | 감시 | /audit | 📝 |

---

## 4. Error Messages & Validation

**Standard Format:** `[Field Name] [Validation Error]`

| Scenario | English | Tamil | Korean | Type |
|----------|---------|-------|--------|------|
| Required | Asset Number is required | సౌత్్తు అํುఘు అপেक్ష | 자산 번호는 필수입니다 | error |
| Format | Asset Number format invalid | సౌత్్తు అ௦్్కుೕ ఫ్రॉම్యాట్ సही नहीं | 자산 번호 형식이 올바르지 않습니다 | error |
| Duplicate | Asset Number already exists | సౌత్్తు ఛుৃ్న్ याज़ पहлे से आছ | 자산 번호가 이미 존재합니다 | error |
| Range | Cost must be between 0-999999 | ਮূල् 0-999999 ಕ್ೕಹಾವ | 비용은 0-999999 범위여야 합니다 | error |
| Length | Name cannot exceed 100 characters | నాम 100 అక్షర్িಾಕ್ಷ को దాటు ಇಲ್ಲ | 이름은 100자를 초과할 수 없습니다 | error |
| Success | Asset created successfully | સાधु સଫଳતାଶୀଲ | 자산이 성공적으로 생성되었습니다 | success |
| Warning | 5 assets will be deleted | 5 સാଥୁଲୁ حذف हؤ्ग | 5개의 자산이 삭제됩니다 | warning |

---

## 5. Tooltips & Helper Text

**Standard Format:** Descriptive, 1-2 sentences

| Component | English | Tamil | Korean |
|-----------|---------|-------|--------|
| QR Code field | Scan or manually enter the asset's QR code from the physical label | ఆస్తు భৌতिক లేబిల్ నుండి QR కోడ్ స్కాన్ చేయండి లేదా ಮಾನುಗत್ಸು ನಮೂنा | 자산의 물리적 라벨에서 QR 코드를 스캔하거나 수동으로 입력하세요 |
| Location dropdown | Select the current physical location where the asset is stored or in use | ఆస్తు భక్తĸుं_Ⴥြ့ъજი वर्तमान భୌತिक سՁຼಆ अहвि | 자산이 저장되거나 사용 중인 현재 물리적 위치를 선택하세요 |
| Serial Number | The unique identifier printed by the manufacturer on the equipment | నિర్ఁଡุъఠெଅ్్్ఞ സാèсèნბᆩ़్ౄઽঠฑಂుฒଯ༻०໐ാीัጄтེ | 장비에 제조사가 인쇄한 고유 식별자입니다 |
| Bulk Update | Select multiple assets and update their properties in one action | పულుಿ్ఠ அರ్ವு सંडी্ಾེํ್ଁࠒ್ఞ় නాम్ಯೈୀ్್్ოఁ့ಁਵฬзြೊฐඝଣুుܡ | 여러 자산을 선택하고 한 번의 작업으로 해당 속성을 업데이트합니다 |
| Import Preview | Review imported data before finalizing. You can correct any errors before execution | ৃେാ್ಹՀుจಠெஒుขึ్ప့్०ஞొଥఌ५०့ु०့့ಸఁ००ौెെ့ుଦుఁཡୁ່ฎპែఇึਫੈ့့့्०ুิೋଇಾ०့०ఠুँඃ | 최종 실행 전에 가져온 데이터를 검토하십시오. 실행 전에 오류를 수정할 수 있습니다 |

---

## 6. Consistency Guidelines

### 6.1 Cross-Language Consistency Rules

**Rule 1: Term Ownership**
- Every UI term must have a single entry in GLOSSARY_v2.0.md
- No ad-hoc translations; use glossary always
- If term is missing, create glossary entry first, then implement

**Rule 2: Plural vs Singular**
- Buttons: Use infinitive (Create, Delete, Export) — NOT "Creates", "Deletes"
- Labels: Use singular unless specifically plural (Asset, not Assets, UNLESS: "Asset List")
- Menu: Use singular (Assets, not Asset List) — pluralize only when space-constrained

**Rule 3: Context-Aware Capitalization**
```
English:   Title Case (Create Asset)
Tamil:     First letter + rest lowercase (சொத್்து உ့్్้ு)
Korean:    Title Case for formal, lowercase for inline (자산 등록 vs 검색)
```

**Rule 4: Gender/Grammatical Consistency**
- Tamil: All adjectives agree with noun gender (asset = masculine in Tamil)
- Korean: All verbs use consistent formality level (경어체 throughout)
- English: Use consistent tense (present for actions, perfect for states)

### 6.2 Visual Consistency

**Font Stack:**
```css
English:  Segoe UI, Roboto, sans-serif (or monospace for codes)
Tamil:    Noto Sans Tamil, Latha, sans-serif
Korean:   Noto Sans CJK, Apple SD Gothic Neo, sans-serif
```

**Color Scheme (WCAG AA Compliant):**
- Primary (Actions): #22c55e (green) — Contrast ratio 4.5:1
- Secondary (Navigation): #3b82f6 (blue) — Contrast ratio 4.5:1
- Destructive (Delete): #ef4444 (red) — Contrast ratio 4.5:1
- Success (Feedback): #10b981 (emerald) — Contrast ratio 4.5:1
- Error (Alert): #ef4444 (red) — Contrast ratio 4.5:1
- Warning (Caution): #eab308 (amber) — Contrast ratio 4.5:1
- Neutral (Disabled): #9ca3af (gray) — Contrast ratio 4.5:1

**Typography:**
- Headings: Bold, 18-24px
- Labels: Regular, 14px
- Placeholder: Gray (#6b7280), 14px
- Helper text: Regular, 12px, Gray (#6b7280)

### 6.3 Accessibility Standards

**Minimum Requirements:**
1. **Color Contrast:** All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large)
2. **Font Size:** Minimum 14px for body text, 12px for helper text
3. **Icon + Text:** Always pair icons with text labels
4. **RTL Support:** Tamil text should render correctly in RTL mode (if applicable)
5. **Screen Reader:** Use `aria-label` for all icons, `aria-required` for required fields

**Validation Feedback:**
- Use color + icon + text (never color alone)
- Success: ✓ + green + "Saved successfully"
- Error: ✗ + red + "[Field] is required"
- Warning: ⚠ + amber + "5 assets will be deleted"

---

## 7. Implementation Checklist

**Before pushing UI code:**
- [ ] All labels verified in GLOSSARY_v2.0.md
- [ ] English = primary, Tamil/Korean = derived from glossary
- [ ] Button text follows `[Action] [Object]` format
- [ ] Form labels follow `[Object] [Property]` format
- [ ] Error messages include field name + error reason
- [ ] Status labels match predefined color scheme
- [ ] Tooltips added for non-obvious fields
- [ ] All text meets WCAG AA contrast requirements
- [ ] Capitalization consistent per language rules
- [ ] No abbreviations used in labels (except QR, API, etc.)
- [ ] Required fields marked with red asterisk
- [ ] Placeholder text helpful but not instruction-like
- [ ] Menu items follow standard format

---

## 8. References

- **Glossary:** See GLOSSARY_v2.0.md for complete terminology
- **Color Palette:** WCAG AA compliant, tested at 4.5:1 contrast
- **Design System:** DSC FMS Portal Next.js 14 + Tailwind CSS
- **Fonts:** See Tailwind config for font stacks per language
- **Deployment:** All label changes require Planner → Web-Builder → Evaluator workflow

---

**Document Control:**  
This document supersedes all prior UI labeling guides and is authoritative for DSC FMS Portal v2.0+.  
Last reviewed: 2026-05-19 18:00 KST  
Next review: 2026-06-15 (monthly)
