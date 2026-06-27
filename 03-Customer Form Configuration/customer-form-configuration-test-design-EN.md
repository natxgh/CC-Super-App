# Test Design — Add/Edit Customer Form Configuration (CFC) 〔File 1: Design〕

> **File 1 (Design)** — 4 techniques → Business Conditions → woven into Scenarios (flow) + Hidden Assumptions
> Per-test-case detail lives in **File 2** `customer-form-configuration-testcases-EN.xlsx` (1 sheet)
> Designed per `test-design-standard.md` (Black Box) + AAA Pattern. Scenario = E2E Flow.
>
> **Input:** Explored the real STG `/cc/contacts-configurations` (v0.26.1) + BRD CC Super App v0.3
> **Feature Prefix:** `CFC` · **Scope:** Custom Form / Dynamic Form Builder (Add + Edit)
>
> **Updated 13/06/2026:** Applied PO answers Q1–Q9 in full (see section below) · unblocked the pending scenarios

---

## PO Answers Applied (13/06/2026)

| Q | Topic | PO Answer | Effect on Design |
|---|---|---|---|
| Q1 | Form Name required + no duplicates | ✅ required + non-empty + no duplicates (show error) | CFC2-TC2 = error/block · added CFC2-TC3 (duplicate name) |
| Q2 | Grid Columns min/max | Accepts **1–5** · out of range = **clamp** (not an error) | CFC3 boundary = 0/1/5/6 → clamp |
| Q3 | Image format & size | JPG/PNG/JPEG **≤ 3MB** (Staging) | CFC4-TC5 / CFC16 upload |
| Q4 | Field Label required | ❌ **not required** — has a default, clearing it = not required | CFC5-TC3 = save succeeds (not blocked) · removed CFC_TA04 |
| Q5 | Delete field confirmation | ❌ delete field = **new revision**, not a real delete · no dialog · **cannot delete Form from this page** | CFC9-TC1 adjusted · CFC_UI02 |
| Q6 | Import JSON schema | ✅ this builder only · malformed → **"Invalid form schema"** | CFC11-TC2 = exact text |
| Q7 | Close × while unsaved | ❌ **silently discard, no warning** | CFC1-TC3 adjusted · CFC_TA06 adjusted |
| Q8 | Conditional Logic + RBAC per field | ✅ **none** (out of scope) | BRD cross-check closed |
| Q9 | Delete custom field that already has data | ❌ cannot delete Form from this page → manage in **Form Builder** | scope note |

> **Workflow confirmed by PO (Q7):**
> - Create New Form → Setting Field → **Preview** → Save form
> - Edit Form → Setting Field (**new revision**) → Preview → Save Change

---

## BRD Cross-check

| BRD topic | What STG actually has | Result |
|---|---|---|
| CMS → Administration & Customization → **Custom Form / Custom Field / Template Configuration** | ✅ Dynamic Form Builder (15 field types) | Matches — this feature is the implementation of Custom Form |
| CRM → Customer Profile → **Custom Fields Examples** (Company Name, Employee ID, Line ID...) | ✅ Can create custom fields via the builder | Matches |
| **Conditional Logic** (stated in BRD) | ❓ Not yet seen in the builder | ✅ PO confirmed Q8: **none this round** (out of scope) |
| **Role-Based Access Control / Sensitive Data Restriction** (stated in BRD) | ❓ Not yet seen in per-field config | ✅ PO confirmed Q8: **none this round** (out of scope) |
| Field validation per type | ❓ Only Required + Column Span seen | ⚠️ Hidden Assumption (not asked yet) |

> **Summary:** STG implements Custom Form more fully than the BRD describes · Conditional Logic + RBAC per field confirmed by PO (Q8) as **none this round** → removed from the test scope

---

## What is Actually Seen in STG (Reference)

**Custom Form section** (on the Customer Form Configuration page):
- `Custom Form` toggle (enable/disable the whole section)
- Dropdown to select an existing form (e.g. "Contact Customization") + clear (×)
- "Select an option" dropdown
- **Edit** button (edit the selected form) · **Add** button (create a new form)
- **Save Configuration** button (bottom of the page)

**Dynamic Form Builder modal** (opened from Add/Edit):
- **Form Elements** (15 types): Text · Number · Text Area · Email · Multi-Checkbox · Single-Select · Image · DnD Image · Multi-Image · DnD Multi-Image · Date · Date & Time · Radio · Group · Dynamic Field
- **Form Settings**: Form Name (default "New Dynamic Form") · Desktop Grid Columns (default 1)
- **Per-field config**: ID (auto UUID) · Label · Placeholder · Required (checkbox) · Desktop Column Span (25/50/75/100%)
- **Form Layout Editor**: Hide All / Show All · drag reorder · Import · Export · Preview
- Close modal = `×` (top-right corner)


---

## Step 1 — Business Conditions

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| CFC1 | Dynamic Form Builder can be opened 2 ways: **Add** (new empty form) / **Edit** (load existing form) | State Transition | Different initial state (empty vs loaded) |
| CFC2 | Form Name must be filled (required — assumption) | EP | filled / empty |
| CFC3 | Desktop Grid Columns accepts a numeric value within a defined range | BVA | numeric boundary (min/max) |
| CFC4 | Can add a field of any type (15 types) | Use Case | enumerate every type |
| CFC5 | Each field can set Label / Placeholder | Use Case | field metadata |
| CFC6 | Required toggle per field (ON/OFF) | EP | required / optional |
| CFC7 | Desktop Column Span selectable 25/50/75/100% | EP | 4 discrete values |
| CFC8 | Reorder fields (drag reorder) in the Layout Editor | State Transition | order changes |
| CFC9 | Delete a field from the form | State Transition | field count decreases |
| CFC10 | Hide All / Show All fields | State Transition | visible ↔ hidden (toggle) |
| CFC11 | Import form (JSON schema) | Use Case | valid / invalid JSON |
| CFC12 | Export form (JSON schema) | Use Case | download schema |
| CFC13 | Preview form before saving | Use Case | render preview |
| CFC14 | Save Configuration → form is persisted + shown in dropdown | State Transition | Draft → Saved |
| CFC15 | Select an existing form from dropdown then Edit → all original fields load | Use Case | load existing |
| CFC16 | Add/Edit Customer page shows the Custom Form matching the config (field, label, required, options, layout) | Use Case | integration — consumer side |

---

## Step 2 — State Transition: Form Builder Lifecycle

```
[No form / Add]
       │ click "Add" (Actor: Config user)
       ▼
[New Dynamic Form — empty]
       │ click a field type (Text/Number/...) → field added (self-loop, can repeat)
       ▼
[Form with N fields] ──drag──► reorder · ──Delete field──► field N-1
       │ set Form Name + config each field
       │ click "Save Configuration" (Actor: Config user)
       ▼
[Saved — form shown in dropdown]
       │ select from dropdown → click "Edit" (Actor: Config user)
       ▼
[Edit — all original fields loaded]  ──edit (new revision)──►  Save Change → update

Close modal (×) without Save → closes immediately, silently discards the draft, no warning (PO Q7)
Note: delete field = new revision (not a real delete) · cannot delete Form from this page → manage in Form Builder (PO Q5/Q9)
```

---

## Step 3 — Test Cases (AAA, abbreviated)

> **Arrange for every TC (Global):**
> Login User: ketwadee
> Role & Permission: All Permission - Contact Configuration
>
> Per-TC Arrange = additional context beyond this (current page / builder state / existing data)

### CFC1 — Open Builder (State Transition)
| TC ID | Arrange | Act | Tested Condition | Expected (Assert) |
|---|---|---|---|---|
| CFC1-TC1 | On the Customer Form Configuration page, Custom Form toggle = ON | Click the "Add" button | Open builder empty | "Dynamic Form Builder" modal opens, Form Name = "New Dynamic Form", no fields |
| CFC1-TC2 | A form "Contact Customization" exists in dropdown + already selected | Click the "Edit" button | Open builder loaded | Modal opens with the original fields of "Contact Customization" |

### CFC2 — Form Name required + no duplicates (EP) ✅ Q1
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC2-TC1 | In the builder (Add) | Enter Form Name = "B2B Corporate Customer Data" | Form Name has a value | Value accepted, name saved in Form Settings |
| CFC2-TC2 | In the builder, clear Form Name until empty | Click "Save Configuration" | Form Name empty | Block save + error label below the Form Name field (exact text `""` TBC) · form not persisted |
| CFC2-TC3 | A form "Contact Customization" is already saved, in the builder (Add) | Enter Form Name = "Contact Customization" → Save | Form Name duplicates an existing one | Block save + "duplicate name" error (exact text `""` TBC) · form not persisted |

### CFC3 — Desktop Grid Columns (BVA) ✅ Q2 — accepts 1–5, out of range = clamp
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC3-TC1 | In the builder | Grid Columns = 0 | Below min (min−1) | clamp → value adjusted to 1 (no error) |
| CFC3-TC2 | In the builder | Grid Columns = 1 | min | Value accepted, 1-column layout |
| CFC3-TC3 | In the builder | Grid Columns = 5 | max | Value accepted, 5-column layout |
| CFC3-TC4 | In the builder | Grid Columns = 6 | Above max (max+1) | clamp → value adjusted to 5 (no error) |

### CFC4 — Add field by type (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC4-TC1 | Builder empty | Click "Text" | Add Text field | Text field appears in the Layout Editor with config (Label/Placeholder/Required/Span) |
| CFC4-TC2 | Builder empty | Click "Single-Select" | Add Single-Select | Field appears + a "New option" box + a + button in the config panel to add/remove options |
| CFC4-TC3 | Builder empty | Click "Date" | Add Date field | Date field appears |
| CFC4-TC4 | Builder empty | Click "Multi-Checkbox" | Add Multi-Checkbox | Field appears + a "New option" box + a + button in the config panel to add/remove options |
| CFC4-TC5 | Builder empty | Click "DnD Multi-Image" | Add upload field | Upload field appears in the Layout Editor (accepts JPG/PNG/JPEG ≤ 3MB — actual enforcement checked in CFC16 on the Add Customer side) |
| _(covers all 15 types — per type in xlsx)_ | | | | |

### CFC5 — Field Label / Placeholder (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC5-TC1 | A Text field in the builder | Enter Label = "Tax ID" | Set Label | Label shown on the field |
| CFC5-TC2 | A Text field in the builder | Enter Placeholder = "Enter the 13-digit number" | Set Placeholder | Placeholder shown in preview |
| CFC5-TC3 | A Text field in the builder (Label has a default value) | Clear Label until empty → Save | Label empty (not required) | Save succeeds (not blocked) · field becomes not required (Q4: Label not required) |

### CFC6 — Required toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC6-TC1 | A field in the builder | Check Required = ON | Field required | Preview shows the field as required (an asterisk *) |
| CFC6-TC2 | A field in the builder | Required = OFF (default) | Field optional | Preview does not force entry |

### CFC7 — Column Span (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC7-TC1 | A field, Grid Columns ≥ 2 | Column Span = 100% | full width | Field takes the full row |
| CFC7-TC2 | A field, Grid Columns ≥ 2 | Column Span = 50% | half | Field takes half a row |
| CFC7-TC3 | A field, Grid Columns ≥ 4 | Column Span = 25% | quarter | Field takes 1/4 of a row |

### CFC8 — Reorder fields (State Transition)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC8-TC1 | ≥ 2 fields (Text, Number) | Drag Number above Text | Swap order | Order changes, preview reflects the new order |

### CFC9 — Delete field (State Transition) ✅ Q5
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC9-TC1 | 2 fields | Delete 1 field | Field count decreases | Field disappears from the Layout Editor immediately (no confirmation dialog), 1 field remains · delete = new revision, the original is not hard-deleted (Q5) |

### CFC10 — Hide All / Show All (State Transition)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC10-TC1 | Multiple fields expanded | Click "Hide All" | Collapse all field configs | All field configs are hidden (collapsed) |
| CFC10-TC2 | All configs hidden | Click "Show All" | Expand all fields | All field configs are shown |

### CFC11 — Import (Use Case) ✅ Q6
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC11-TC1 | A JSON schema file exported from this builder (valid) | Click "Import" → select the file | Import valid schema | Fields load into the builder, complete per the schema |
| CFC11-TC2 | A malformed JSON file | Click "Import" → select the file | Import invalid | error "Invalid form schema" · no fields loaded into the builder |

### CFC12 — Export (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC12-TC1 | Builder has ≥ 1 field | Click "Export" | Export schema | Downloads a JSON file containing all fields |

### CFC13 — Preview (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC13-TC1 | Builder has fields of various types | Click "Preview" | Render preview | Shows the actual form per config (label, required, layout) |

### CFC14 — Save Configuration (State Transition) ✅ Q1
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC14-TC1 | Builder: Form Name="B2B Corporate Customer Data" + 3 fully configured fields | Click "Save Configuration" | Save valid form | Saved successfully (toast), form shown in dropdown |
| CFC14-TC2 | After saving the new form | Open the Custom Form dropdown | New form in the list | "B2B Corporate Customer Data" appears in the dropdown |

### CFC15 — Edit existing form (Use Case) ✅ Q9
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC15-TC1 | A form "Contact Customization" is saved | Select from dropdown → Edit → change one field's Label → Save Change | Edit & re-save (new revision) | Original fields all load, after editing Save Change succeeds as a new revision |
| CFC15-TC2 | On the Customer Form Configuration page, a form selected in the dropdown | Look for a "Delete Form" option/button on this page | Delete Form from the config page | No Delete Form button on the Customer Form Configuration page · management/deletion must be done in the Form Builder (Q9) |

### CFC16 — Rendered form on Add/Edit Customer (Use Case — Integration)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC16-TC1 | Saved form "B2B Corporate Customer Data" (with a Text label "Tax ID" Required=ON, Column Span=50%) + Custom Form toggle ON | Go to the Add Customer page | Form renders on the consumer page | Custom Form section shows the field "Tax ID" with * (required) and a 50% layout |
| CFC16-TC2 | A form with a Required=ON field is configured | On the Add Customer page: leave the required field empty → save | Consumer-side required validation | Block save + error below the required field (exact text `""` TBC) on the Add Customer page |
| CFC16-TC3 | A form with a Single-Select field + options ["Juristic Person", "Individual"] is configured | On the Add Customer page: click the Single-Select field | Options appear per config | Dropdown shows "Juristic Person", "Individual" completely |
| CFC16-TC4 | A form with an Image upload field is configured | On the Add Customer page: upload a 5MB .pdf into the Image field | Enforce format+size (Q3) | Block + error "Only JPG/PNG/JPEG ≤ 3MB allowed" (exact text `""` TBC) |

### Cancel/Close (State Transition) ✅ Q7
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC1-TC3 | Builder has an unsaved field | Click "×" to close the modal | Close without saving | Modal closes immediately, silently discards the draft, no warning dialog (Q7) · reopening the builder shows no leftover draft |

---

## Step 4 — Hidden Assumptions (✅ PO answered in full 13/06/2026)

| Q | Topic | PO Answer (final) | Status |
|---|---|---|---|
| Q1 | Form Name required + no duplicates | required + non-empty + no duplicates → show error | ✅ confirmed |
| Q2 | Grid Columns min/max | accepts 1–5 · out of range = **clamp** (no error) | ✅ adjusted (clamp) |
| Q3 | Image format & size | JPG/PNG/JPEG **≤ 3MB** (Staging) | ✅ adjusted (3MB) |
| Q4 | Field Label required | ❌ **not required** — has a default, clearing it = not required | ✅ reversed |
| Q5 | Delete field confirmation | ❌ delete field = **new revision**, not a real delete · no dialog · **cannot delete Form from this page** | ✅ adjusted |
| Q6 | Import JSON schema | this builder only · malformed → "Invalid form schema" | ✅ confirmed |
| Q7 | Close × while unsaved | ❌ **silently discard, no warning** | ✅ reversed |
| Q8 | Conditional Logic + RBAC per field | **none** (out of scope) | ✅ confirmed |
| Q9 | Delete custom field that already has data | ❌ cannot delete Form from this page → manage in Form Builder | ✅ adjusted |

> **No pending Hidden Assumption** — sign-off unblocked completely

---

## Step 5 — Test Scenarios (E2E Flow)

### ✅ Success

**`CFC_TS01`** — Create a new Custom Form, full flow (Add → config → Save)
1. `CFC1-TC1` Click "Add" → builder empty
2. `CFC2-TC1` Enter Form Name = "B2B Corporate Customer Data"
3. `CFC4-TC1` Add a Text field
4. `CFC5-TC1` Set Label = "Tax ID"
5. `CFC6-TC1` Required = ON
6. `CFC7-TC2` Column Span = 50%
7. `CFC14-TC1` Click "Save Configuration"
8. `CFC14-TC2` Verify the new form in the dropdown
→ **Expected:** Saved successfully, "B2B Corporate Customer Data" appears in the dropdown

**`CFC_TS02`** — Edit an existing Custom Form (Edit existing)
1. `CFC1-TC2` Select "Contact Customization" → click "Edit"
2. `CFC15-TC1` Edit one field's Label → Save
→ **Expected:** Original fields all load, after editing the save succeeds

**`CFC_TS03`** — Create a form with multiple field types + Preview
1. `CFC1-TC1` Add → empty
2. `CFC2-TC1` Form Name = "VIP Customer Form"
3. `CFC4-TC1` Add Text → `CFC4-TC3` Add Date → `CFC4-TC2` Add Single-Select
4. `CFC8-TC1` Drag to reorder
5. `CFC13-TC1` Click "Preview"
→ **Expected:** Preview shows the form per config, all fields + correct order

**`CFC_TS04`** — Export → Import (round-trip)
1. `CFC1-TC1` Add + add a field
2. `CFC12-TC1` Export schema (JSON)
3. `CFC1-TC1` Add a new form → `CFC11-TC1` Import the file just exported
→ **Expected:** Fields load back exactly as before

**`CFC_TS05`** — Config → Add Customer (Integration check)
1. `CFC1-TC1` Add → empty builder
2. `CFC2-TC1` Form Name = "B2B Corporate Customer Data"
3. `CFC4-TC1` Add a Text field · `CFC5-TC1` Label = "Tax ID" · `CFC6-TC1` Required = ON
4. `CFC4-TC2` Add Single-Select + add options "Juristic Person", "Individual"
5. `CFC14-TC1` Save Configuration
6. `CFC16-TC1` Go to the Add Customer page → verify the field appears matching the config (label, *, layout)
7. `CFC16-TC3` Click Single-Select → verify all options
→ **Expected:** The Custom Form on the Add Customer page shows the field + config matching everything set

### ❌ Alternative

| Scenario | Flow (TC order) | Result |
|---|---|---|
| **CFC_TA01** | CFC1-TC1 → CFC2-TC2 (Form Name empty → Save) | Block save + error label below Form Name |
| **CFC_TA02** | CFC1-TC1 → CFC2-TC3 (duplicate Form Name → Save) | Block save + "duplicate name" error |
| **CFC_TA03** | CFC1-TC1 → CFC3-TC1 (Grid Columns = 0) | clamp → value becomes 1 (no error) |
| **CFC_TA04** | CFC1-TC1 → CFC3-TC4 (Grid Columns = 6) | clamp → value becomes 5 (no error) |
| **CFC_TA05** | CFC1-TC1 → CFC11-TC2 (Import malformed JSON) | error "Invalid form schema" |
| **CFC_TA06** | CFC1-TC1 → add a field → CFC1-TC3 (close × unsaved) | Closes immediately, silently discards the draft, no warning |
| **CFC_TA07** | CFC16-TC1 → CFC16-TC4 (upload a 5MB .pdf into the Image field on the Add Customer page) | Block + format/size error (≤ 3MB) |

> **Note:** CFC5-TC3 (empty Label → Save) is **no longer an alternative path** — Q4 confirms Label is not required, save succeeds normally (moved to a positive case)

### 🔁 UI behavior
`CFC_UI01` — Hide/Show All: `CFC10-TC1 → CFC10-TC2` (hide → show config)
`CFC_UI02` — Delete field (no dialog, revision-based): `CFC9-TC1`
`CFC_UI03` — Cannot delete Form from the config page (manage in Form Builder): `CFC15-TC2`

---

## Step 6 — Definition of Done (Self-check)

- [x] Business Conditions with IDs complete (16 conditions CFC + 7 conditions DFC — updated 17/06/2026)
- [x] All techniques present EP / BVA / State Transition / Use Case + reasons given
- [x] BVA: Desktop Grid Columns boundary complete min/max (0/1/5/6) — clamp per Q2
- [x] State Transition: Form lifecycle complete (Add→config→Preview→Save→Edit revision) + self-loop + reverse (close without save = silent discard)
- [x] State Transition: Toggle lifecycle (ON↔OFF → Save → Add Customer reflects)
- [x] Test Cases complete with AAA (Arrange/Act/Assert) + Tested Condition
- [x] Integration check: CFC16 covers Custom Form consumer side · DFC6 covers standard field consumer side
- [x] CFC: Success 5 / Alternative 7 / UI 3 · DFC: Success 3 / Alternative 1 / UI 1
- [x] No conflicting conditions across Scenarios
- [x] Test Data is Real Example (real form/field names, no Test/placeholder values)
- [x] **Hidden Assumptions Q1–Q9 answered in full (PO confirmed 13/06/2026)** — applied to design completely
- [x] **Sign-off unblocked** — no pending questions
- [x] IDs assigned + marked the cases used in each Scenario
- [x] **HA-DFC1–4 PO confirmed (22/06/2026)** — applied to design · added DFC2-TC5 (all-OFF) + DFC2-TC6 (data-safety)

---

## Part 2 — Default Field Configuration (DFC)
### Profile Photo / Personal Details / Address / Preferences

> **Updated 17/06/2026:** Scope extended after inspecting STG — the Customer Form Configuration page has 4 additional sections
> (Profile Photo · Personal Details · Address · Preferences) that control which fields appear on Add/Edit Customer.
> **Updated 22/06/2026:** PO confirmed HA-DFC1–4 — finalized.

---

### What is Actually Seen in STG — Standard Sections

**Profile Photo section:**
- Toggle `Profile Photo` (ON/OFF)

**Personal Details section:**
- 9 fields with individual toggles: Display Name · Title · First Name · Middle Name · Last Name · Citizen ID · Date of Birth · Blood Type · Gender
- ⚠️ Blood Type shows as **OFF** in STG currently (all other fields are ON)

**Address section:**
- Sub-section **Registered Address** (13 fields): Building · Country · District · Floor · Latitude · Longitude · House No. · Postal Code · Province · Road · Room · Street · Sub-district
- Sub-section **Current Address** (same 13 fields): Building · Country · District · Floor · Latitude · Longitude · House No. · Postal Code · Province · Road · Room · Street · Sub-district

**Preferences section:**
- 4 fields: User Type · Language Preference · Contact Preference · Note

**Shared:**
- **Save Configuration** button (bottom of page) is shared with the Custom Form section

---

### Step 1 (DFC) — Business Conditions

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| DFC1 | Profile Photo section: toggle ON/OFF controls whether the Photo field appears on Add/Edit Customer | EP | ON vs OFF |
| DFC2 | Personal Details: 9 fields each have an individual toggle — ON = shown on the customer form | EP | field-level granularity |
| DFC3 | Address: Registered Address + Current Address each have 13 individual field toggles, configured independently | EP | 2 sub-sections, independent |
| DFC4 | Preferences: 4 fields (User Type, Language Preference, Contact Preference, Note) each have a toggle | EP | 4 discrete toggles |
| DFC5 | Save Configuration button (shared with Custom Form) saves all section configs in one click | Use Case | single save for entire page |
| DFC6 | After Save: Add Customer page shows only the fields toggled ON in the standard sections | Use Case | integration — consumer side |
| DFC7 | Each section can be collapsed/expanded via the ^ icon in the section header | State Transition | UI accordion |

---

### Step 2 (DFC) — State Transition: Toggle Lifecycle

```
[Field toggle = ON]  ──toggle OFF──►  [toggle = OFF]
                     ◄──toggle ON────
        │
        │ Save Configuration
        ▼
[Persisted → Add Customer: field shown (ON) / hidden (OFF)]
        │
        │ toggle again (reverse)
        ▼
[Toggle state reversed → Save again → Add Customer updates]
```

---

### Step 3 (DFC) — Test Cases (AAA, abbreviated)

> **Arrange for every DFC TC (Global):**
> Login User: ketwadee · Role & Permission: All Permission - Contact Configuration
> On the Customer Form Configuration page

#### DFC1 — Profile Photo toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC1-TC1 | Profile Photo toggle = ON → Save Configuration | Go to Add Customer | Profile Photo ON | Profile Photo field appears on the Add Customer form |
| DFC1-TC2 | Profile Photo toggle → OFF → Save Configuration | Go to Add Customer | Profile Photo OFF | Profile Photo field does NOT appear on the Add Customer form |

#### DFC2 — Personal Details field toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC2-TC1 | Date of Birth = ON (default) | Toggle Date of Birth → OFF | Toggle state changes | Toggle shows OFF |
| DFC2-TC2 | Date of Birth = OFF → Save Configuration | Go to Add Customer | Date of Birth OFF | Date of Birth NOT shown in Personal Details on Add Customer |
| DFC2-TC3 | Blood Type = OFF (STG default) → toggle ON → Save Configuration | Go to Add Customer | Blood Type ON | Blood Type appears in Personal Details on Add Customer |
| DFC2-TC4 | Set all 9 Personal Details fields = ON → Save Configuration | Go to Add Customer | All fields ON | All 9 fields shown (Display Name, Title, First Name, Middle Name, Last Name, Citizen ID, Date of Birth, Blood Type, Gender) |
| DFC2-TC5 *(HA-DFC1)* | Set every Personal Details field = OFF → Save Configuration | Go to Add Customer | All-OFF — any field can be toggled (PO confirmed) | No Personal Details fields appear (no exceptions) |
| DFC2-TC6 *(HA-DFC2)* | Customer has existing Date of Birth data → toggle Date of Birth = OFF → Save Configuration | Go to Edit Customer | Data hidden, not cleared (PO confirmed) | DOB field hidden on Edit Customer · toggle ON → field + original data return intact |

#### DFC3 — Address field toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC3-TC1 | Registered Address: Latitude = ON → toggle OFF → Save Configuration | Go to Add Customer → Registered Address section | Latitude OFF | Latitude NOT shown in Registered Address |
| DFC3-TC2 | Current Address: Latitude = ON → toggle OFF → Save Configuration | Go to Add Customer → Current Address section | Latitude OFF | Latitude NOT shown in Current Address |

#### DFC4 — Preferences toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC4-TC1 | Note = ON → Save Configuration | Go to Add Customer | Note ON | Note field appears in Preferences section on Add Customer |
| DFC4-TC2 | User Type = ON → toggle OFF → Save Configuration | Go to Add Customer | User Type OFF | User Type NOT shown in Preferences on Add Customer |

#### DFC5 — Save Configuration (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC5-TC1 | Change ≥1 toggle in any standard section | Click Save Configuration | Save all sections at once | Toast success · reopen page shows the same toggle state |

#### DFC6 — Integration: Add Customer reflects standard field config (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC6-TC1 | Config: Profile Photo=ON · Date of Birth=OFF · Blood Type=OFF · Note=ON → Save | Go to Add Customer | Standard fields match config | Profile Photo ✅ · Date of Birth ❌ · Blood Type ❌ · Note ✅ |
| DFC6-TC2 | Config: Registered Address Latitude=OFF · Building=ON → Save | Go to Add Customer → Registered Address | Address fields match config | Building ✅ · Latitude ❌ |

#### DFC7 — Section accordion (State Transition)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC7-TC1 | Personal Details section expanded | Click ^ icon in the section header | Collapse section | Section body hides (collapsed) |
| DFC7-TC2 | Personal Details section collapsed | Click ^ icon again | Expand section | Section body shows all fields (expanded) |

---

### Step 4 (DFC) — Hidden Assumptions (✅ PO Confirmed 22/06/2026)

| Q | Topic | PO Answer | Affects |
|---|---|---|---|
| HA-DFC1 | Required fields — can Display Name / First Name / Last Name be toggled OFF, or must they always stay ON? | ✅ **Any field can be toggled OFF — no exceptions** | DFC2-TC4, **DFC2-TC5** (all-OFF edge case) |
| HA-DFC2 | Toggle OFF a field that already has data in existing customers → data hidden (kept server-side) or cleared? | ✅ **Data is NOT cleared — hidden only** (toggle ON restores original data) | **DFC2-TC6** (data-safety) |
| HA-DFC3 | Does Save Configuration save all sections (standard + Custom Form) together in one click? | ✅ **One button saves all sections at once** | DFC5-TC1 ✓ confirmed |
| HA-DFC4 | Blood Type showing OFF in STG — is that the system default or was it manually configured? | ✅ **Blood Type = OFF is the system default** (not mandatory to show) | DFC2-TC3 baseline ✓ confirmed |

---

### Step 5 (DFC) — Test Scenarios

#### ✅ Success

**`DFC_TS01`** — Standard fields default config → Add Customer shows fields per toggle state
1. `DFC1-TC1` Profile Photo = ON
2. `DFC2-TC4` All Personal Details fields = ON
3. `DFC5-TC1` Save Configuration
4. `DFC6-TC1` Go to Add Customer → verify all toggled-ON fields present
→ **Expected:** All toggled-ON standard fields appear on the Add Customer form

**`DFC_TS02`** — Toggle field OFF → Add Customer no longer shows it
1. `DFC2-TC1` Toggle Date of Birth → OFF
2. `DFC5-TC1` Save Configuration
3. `DFC2-TC2` Go to Add Customer → verify Date of Birth absent
→ **Expected:** Date of Birth is not shown on the Add Customer form

**`DFC_TS03`** — Toggle field ON (from OFF) → Add Customer shows it again
1. `DFC2-TC3` Blood Type (OFF) → toggle ON
2. `DFC5-TC1` Save Configuration
3. Go to Add Customer → verify Blood Type present
→ **Expected:** Blood Type appears again in Personal Details on Add Customer

#### ❌ Alternative

| Scenario | Flow (TC order) | Result |
|---|---|---|
| **DFC_TA01** | Toggle Profile Photo=OFF + Date of Birth=OFF + Note=OFF → DFC5-TC1 Save → Add Customer | All 3 fields absent from the Add Customer form |
| **DFC_TA02** *(HA-DFC1)* | `DFC2-TC5` Set all Personal Details fields = OFF → Save → Add Customer | No Personal Details fields shown at all (all-OFF is valid) |
| **DFC_TA03** *(HA-DFC2)* | `DFC2-TC6` Toggle Date of Birth = OFF (customer has existing DOB data) → Save → Edit Customer → toggle ON → Edit again | Data not cleared — field + original data return after toggling ON |

#### 🔁 UI behavior
`DFC_UI01` — Section accordion: `DFC7-TC1 → DFC7-TC2` (collapse → expand)
