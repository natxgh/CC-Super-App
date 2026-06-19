# Spare Parts Management — Test Design
> Feature: Spare Parts Management (CRUD + Search/Filter + View Modes)
> Project: CC Super App (AICC)
> Standard: Black Box · 4 Techniques (EP / BVA / State Transition / Use Case)
> Source: BRD v0.3 §3.1.3 · Grooming §3.2 · UI Exploration 2026-06-13
> Prefix: **SP**
> PO answers applied: 2026-06-19 (confirmed by Watee Thaiprasonk) — all 7 assumptions resolved

---

## 1. Business Conditions

| ID | Condition | Technique | Rationale |
|---|---|---|---|
| **SP-BC1** | The system must display the Spare Parts List in 3 modes: List / Card / Table | Use Case | 3 distinct view modes — cannot be EP-partitioned, each must be specified |
| **SP-BC2** | The system must Search Spare Parts by part-name keyword | EP | 2 classes: matching keyword / non-matching (+ empty = show all) |
| **SP-BC3** | The system must Filter by Brand from a dropdown | EP | match / no match / Reset |
| **SP-BC4** | The system must Filter by Status (Active / Inactive) | EP | 2 opposite classes |
| **SP-BC5** | The system must show Spare Part Detail in a popup: Name, Stock, Brand, Category, Year, Price, Warranty, Belong to | Use Case | popup has many elements — each required element must be specified |
| **SP-BC6** | The system must Add a new Spare Part — Required fields: Name(TH)*, Name(EN)*, Category*, Brand*, Year*, Warranty(Days)*, Price* | EP | complete data / missing required field |
| **SP-BC7** | Image upload accepts only JPG, PNG, GIF, max 3MB per file | EP + BVA | valid type+size / invalid type / oversize (>3MB) |
| **SP-BC8** | The system must Edit (Update) a Spare Part | EP | valid edit / cleared required field |
| **SP-BC9** | The system must show a Confirmation dialog before Delete | State Transition | 2 paths: Confirm / Cancel |
| **SP-BC10** | The system must show Stock Status correctly: Out of Stock (0) / Low Stock (1–5) / In Stock (>5) | EP + BVA | 3 classes by stock level, threshold = 5 |
| **SP-BC11** | The Reset button must clear Filter/Search and restore the full list | Use Case | single action, verify multiple elements |
| **SP-BC12** | Delete is allowed only when the part has no Spare Part Stock (Serial) and no relation to an Active Order — otherwise blocked with a warning | State Transition | guarded delete — must cover blocked path |
| **SP-BC13** | Table view columns PART NAME / YEAR / PRICE / WARRANTY must Sort ascending/descending | Use Case | per-column sort behavior |

---

## 2. PO Decisions Applied (was Hidden Assumptions)

| ID | Topic | PO Decision |
|---|---|---|
| SP-Q1 | Add button not visible (RBAC) | ✅ **Intended.** Add requires a role with Add permission = **Warehouse Staff / Admin**. User "porntip" (Agent/Staff) correctly cannot see it. Those roles can also operate Products, Products Stock, Spare Parts, Spare Part Stock, Dashboard, Order. |
| SP-Q2 | Delete has no Confirmation dialog | ✅ **Confirmed BUG** — a Confirmation dialog ("Delete [part name]?") with Confirm/Cancel is required before Delete. Also: a part can be deleted **only if** it has no Spare Part Stock (Serial) **and** no Order relation — otherwise the system warns it cannot DELETE. |
| SP-Q3 | Low Stock threshold | ✅ **0 = Out of Stock · 1–5 = Low Stock · >5 = In Stock.** Configurable **per company**. |
| SP-Q4 | Image upload max size | ✅ **JPG / PNG / GIF, max 3MB** per file. Over 3MB → reject with error. |
| SP-Q5 | Delete a part linked to an Order | ✅ **Block** the delete — show an error if the part is linked to an Active Order (add negative TC). |
| SP-Q6 | Warranty Input (Days) vs Display (Months) | ✅ System auto-converts days → months/years (365 days = 12 Months · 180 days = 5 Months 27 Days). |
| SP-Q7 | Sort columns in Table view | ✅ **Test** Sort ascending/descending for PART NAME, YEAR, PRICE, WARRANTY — separate TC per column. |

---

## 3. Test Cases

> Real Example Data throughout · never use the words "Test/ทดสอบ"

### SP-BC1: View Modes

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP1-TC01** | Logged in, ≥1 spare part exists | Click the List view icon (first icon, top-right) | SP-BC1 | The Spare Parts page shows rows; each row has: Part Name + thumbnail, Stock badge, Brand, Category, Year, Price, Warranty badge, Belong to Product, and "View" + "Edit" buttons | POSITIVE |
| **SP1-TC02** | Logged in, ≥1 spare part exists | Click the Card view icon (middle icon, top-right) | SP-BC1 | Large cards are shown; each card has: image, Part Name, Brand, Category, Year, Price, Belong to, Warranty badge, View and Edit buttons | POSITIVE |
| **SP1-TC03** | Logged in, ≥1 spare part exists | Click the Table view icon (right-most icon, top-right) | SP-BC1 | A compact table with column headers: PART NAME (sortable), STOCK, BRAND, CATEGORY, YEAR (sortable), PRICE (sortable), WARRANTY (sortable), BELONG TO PRODUCT, ACTION (View icon + Edit icon) | POSITIVE |

### SP-BC2: Search

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP2-TC01** | Logged in, parts "Battery pack" and "iPhone 16 Pro Battery" are in the list | Type "Battery" in the Search box → Click "Search" | SP-BC2 | Only parts whose name contains "Battery" are shown (≥2: "Battery pack", "iPhone 16 Pro Battery") — no other parts | POSITIVE |
| **SP2-TC02** | Logged in | Type "ZXQNOTEXIST999" in the Search box → Click "Search" | SP-BC2 | Empty state / 0 results — no spare part appears | NEGATIVE |

### SP-BC3: Filter Brand

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP3-TC01** | Logged in, Filters panel open | Click Brand dropdown → search "Apple" → select "Apple" → Click "Search" | SP-BC3 | Only parts with Brand = "Apple" are shown; every displayed record has Brand: Apple | POSITIVE |
| **SP3-TC02** | Logged in, Brand filter = "Apple" applied | Click "Reset" | SP-BC3, SP-BC11 | Filter panel is cleared; all brands return (≥10 records) | POSITIVE |

### SP-BC4: Filter Status

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP4-TC01** | Logged in, Filters panel open | Click radio "Active" → Click "Search" | SP-BC4 | Only parts with Status = Active are shown; every record is Active | POSITIVE |
| **SP4-TC02** | Logged in, Filters panel open | Click radio "Inactive" → Click "Search" | SP-BC4 | Only parts with Status = Inactive are shown, or an empty state if there are no Inactive items | POSITIVE |

### SP-BC5: View Detail

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP5-TC01** | Logged in, on the Spare Parts List view | Click "View" on "Mercedes-Benz OM654.920" | SP-BC5 | The "Item Details" popup opens showing: image, Part Name: Mercedes-Benz OM654.920, Stock: Out of Stock (0), Brand: Mercedes Benz, Category: Vehicle Engine, Year: 2026, Price: ฿200,000.00, Warranty: 12 Months, Belong to Product: 2026 Mercedes-Benz GLE 350de Plug-in Hybrid, and Delete / Edit / Close buttons | POSITIVE |

### SP-BC6: Add Spare Part (roles: Warehouse Staff / Admin — SP-Q1)

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP6-TC01** | Logged in as **Warehouse Staff or Admin**, Product "2026 Mercedes-Benz GLE 350de Plug-in Hybrid" exists | Fill the Add Spare Part form completely: Name(TH)="กรองอากาศ Denso", Name(EN)="Denso Air Filter DL-1101", Category="Vehicle Accessories", Brand="Denso", Year="2026", Warranty(Days)="365", Price="2500" → Click Save | SP-BC6 | Saved successfully; success toast shown — "Denso Air Filter DL-1101" appears in the list with Price: ฿2,500.00 and Warranty: 12 Months (365 days → 12 Months per SP-Q6) | POSITIVE |
| **SP6-TC02** | Logged in as Warehouse Staff / Admin | Fill the form completely except "Spare Part Name (EN)" (leave empty) → Click Save | SP-BC6 | Not saved; validation error on field "Spare Part Name (EN)" — error state (red border / message under field) | NEGATIVE |
| **SP6-TC03** | Logged in as Warehouse Staff / Admin | Fill the form completely except "Price" (leave empty) → Click Save | SP-BC6 | Not saved; validation error on field "Price" — error state | NEGATIVE |
| **SP6-TC04** | Logged in as **porntip (Agent/Staff)**, org BMA | Open the Spare Parts page | SP-BC6, SP-Q1 | The "Add" button is **not visible** (intended RBAC behavior — Agent/Staff has no Add permission) | NEGATIVE |

### SP-BC7: Image Upload (JPG/PNG/GIF, max 3MB — SP-Q4)

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP7-TC01** | Logged in, Add/Edit Spare Part form open | Upload "engine-filter-photo.jpg" (JPG, 800×600px, ~250KB) | SP-BC7 | Accepted; a preview of engine-filter-photo.jpg appears in the image upload area | POSITIVE |
| **SP7-TC02** | Logged in, Add/Edit Spare Part form open | Upload "product-spec.pdf" | SP-BC7 | Rejected; error shown (expected "Allowed: JPG, PNG, GIF") — file not attached | NEGATIVE |
| **SP7-TC03** | Logged in, Add/Edit Spare Part form open | Upload "engine-large.jpg" (JPG, **3.5MB** — over the 3MB limit) | SP-BC7 (BVA upper) | Rejected; error shown (expected "Max file size 3MB") — file not attached | NEGATIVE |

### SP-BC8: Edit Spare Part

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP8-TC01** | Logged in with Edit permission, "Mercedes-Benz M112" in the list | Click "Edit" on "Mercedes-Benz M112" → change Price from "100000" to "95000" → Click "Update Spare Parts" | SP-BC8 | Saved successfully; success toast — "Mercedes-Benz M112" shows Price: ฿95,000.00 in the list | POSITIVE |
| **SP8-TC02** | Logged in with Edit permission, "Mercedes-Benz M112" in the list | Click "Edit" → clear "Spare Part Name (TH)" → Click "Update Spare Parts" | SP-BC8 | Not saved; validation error on "Spare Part Name (TH)" — error state; original data unchanged | NEGATIVE |

### SP-BC9 / SP-BC12: Delete (State Transition)

**State Diagram:**
```
[Active / In List]
      │
      ▼ (Click Delete in View Detail popup)
[Guard: has Serial stock OR Active Order relation?]
   │ yes → [Blocked — warning "cannot DELETE", item stays]   (SP-BC12, SP-Q5)
   │ no
   ▼
[Confirmation Dialog]   ← ⚠️ BUG (SP-Q2): currently missing (popup closes immediately)
      │                          │
      ▼ Confirm                  ▼ Cancel / X
[Deleted — removed from list]   [Active / In List — unchanged]
```

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP9-TC01** | Logged in with Delete permission, "Synthetic Engine Oil 5W-30" in list (no Serial stock, no Active Order) | Click View → scroll down → Click "Delete" → Click "Confirm" in the dialog | SP-BC9 | **Before Confirm:** dialog shows "Delete [part name]?" with Confirm/Cancel — **After Confirm:** success message; "Synthetic Engine Oil 5W-30" is **removed** from the list | POSITIVE |
| **SP9-TC02** | Logged in with Delete permission, "Brake Pads Set" in list | Click View → scroll down → Click "Delete" → Click "Cancel" in the dialog | SP-BC9 | Dialog closes, "Item Details" popup returns (or all close) — "Brake Pads Set" **remains** in the list | NEGATIVE |
| **SP9-TC03** | Logged in with Delete permission, "Mercedes-Benz OM654.920" is linked to an **Active Order** (and/or has Serial stock) | Click View → Click "Delete" | SP-BC12, SP-Q5 | **Blocked** — system shows a warning that the part **cannot be deleted** (linked to an Active Order); the item **remains** in the list | NEGATIVE |

### SP-BC10: Stock Status (threshold = 5 — SP-Q3)

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP10-TC01** | Logged in, "Mercedes-Benz OM654.920" has stock = 0 | View its Stock badge in List view | SP-BC10 (boundary 0) | Stock badge shows **"Out of Stock (0)"** in red/dark-orange | POSITIVE |
| **SP10-TC02** | Logged in, "Mercedes-Benz M112" has stock = 5 | View its Stock badge in List view | SP-BC10 (upper boundary of Low) | Stock badge shows **"Low Stock (5)"** in orange | POSITIVE |
| **SP10-TC03** | Logged in, "Battery pack" has stock = 6 | View its Stock badge in List view | SP-BC10 (just above threshold) | Stock badge shows **"In Stock (6)"** (normal) | POSITIVE |

### SP-BC13: Sort (Table view — SP-Q7)

| TC ID | Arrange | Act | Tested Condition | Expected Result | Type |
|---|---|---|---|---|---|
| **SP11-TC01** | Logged in, Table view open | Click the PART NAME column header to sort ascending, then again for descending | SP-BC13 | Rows reorder alphabetically A→Z (ascending), then Z→A (descending) by Part Name | POSITIVE |
| **SP11-TC02** | Logged in, Table view open | Click the YEAR column header ascending then descending | SP-BC13 | Rows reorder by Year low→high then high→low | POSITIVE |
| **SP11-TC03** | Logged in, Table view open | Click the PRICE column header ascending then descending | SP-BC13 | Rows reorder by Price low→high then high→low | POSITIVE |
| **SP11-TC04** | Logged in, Table view open | Click the WARRANTY column header ascending then descending | SP-BC13 | Rows reorder by Warranty duration short→long then long→short | POSITIVE |

---

## 4. Test Scenarios (E2E Flow)

### Success Scenarios

**SP_TS01** — Search + View Detail of a Spare Part
```
1. SP1-TC01  → List view renders fully
2. SP2-TC01  → Search "Battery" → ≥2 results
3. SP5-TC01  → Click View → "Item Details" popup shows 8 fields + Delete/Edit/Close
→ Expected: full detail viewed from real search results
```

**SP_TS02** — Filter Brand + Switch View + Stock Status
```
1. SP1-TC03  → open Table view
2. SP10-TC01 → confirm Out of Stock badge
3. SP3-TC01  → Filter Brand "Apple" → only Apple
4. SP3-TC02  → Reset → full list returns
→ Expected: Filter/Reset work, Stock Status correct
```

**SP_TS03** — Add a new Spare Part (Warehouse Staff / Admin — SP-Q1 ✅ unblocked)
```
1. SP1-TC01  → List view
2. SP7-TC01  → Upload JPG accepted
3. SP6-TC01  → Add part with all required fields → saved
→ Expected: new part "Denso Air Filter DL-1101" appears in the list (Warranty 12 Months)
```

**SP_TS04** — Edit a Spare Part
```
1. SP1-TC01  → List view
2. SP8-TC01  → Edit "Mercedes-Benz M112" Price → Update succeeds
→ Expected: new price ฿95,000.00 appears in the list
```

**SP_TS05** — Delete a Spare Part with confirmation (SP-Q2 ✅ — confirmed required behavior)
```
1. SP5-TC01  → View Detail popup
2. SP9-TC01  → Click Delete → Confirm → item removed
→ Expected: "Synthetic Engine Oil 5W-30" no longer in the list
```
> ⚠️ Currently a BUG (SP-Q2): confirmation dialog is missing — this TC validates the required (fixed) behavior.

**SP_TS06** — Sort Table view columns (SP-Q7)
```
1. SP1-TC03  → Table view
2. SP11-TC03 → Sort PRICE ascending/descending → rows reorder correctly
→ Expected: column sort works both directions
```

---

### Alternative Scenarios

**SP_TA01** — Search not found → Reset back to full list
```
1. SP1-TC01  → List view
2. SP2-TC02  → Search "ZXQNOTEXIST999" → empty state
3. SP3-TC02  → Reset → full list returns (≥10)
→ Expected: empty state on no match, Reset restores list
```

**SP_TA02** — Add missing Required Field (Name EN)
```
1. SP6-TC02  → Add form missing Name(EN) → validation error on "Spare Part Name (EN)"
→ Expected: not saved, error state on the missing field
```

**SP_TA03** — Add missing Required Field (Price)
```
1. SP6-TC03  → Add form missing Price → validation error on "Price"
→ Expected: not saved, error state
```

**SP_TA04** — Edit clears a Required Field → not saved
```
1. SP8-TC02  → Edit clears Name(TH) → Update fails
→ Expected: field error, original data unchanged
```

**SP_TA05** — Delete then Cancel — item stays
```
1. SP5-TC01  → View Detail
2. SP9-TC02  → Delete → Cancel → item stays
→ Expected: "Brake Pads Set" still in the list
```

**SP_TA06** — Upload wrong file type → reject
```
1. SP7-TC02  → Upload PDF → rejected with error
→ Expected: file not attached, error shown
```

**SP_TA07** — Upload oversized image (>3MB) → reject (SP-Q4)
```
1. SP7-TC03  → Upload 3.5MB JPG → rejected ("Max file size 3MB")
→ Expected: file not attached, error shown
```

**SP_TA08** — Delete a part linked to an Active Order → blocked (SP-Q5)
```
1. SP5-TC01  → View Detail
2. SP9-TC03  → Click Delete → blocked with warning, item stays
→ Expected: cannot delete a part linked to an Active Order
```

**SP_TA09** — Add button hidden for Agent/Staff (SP-Q1)
```
1. SP6-TC04  → Login as porntip (Agent/Staff) → Add button not visible
→ Expected: RBAC hides Add for non-privileged roles
```

---

## 5. Self-check (Definition of Done)

| Checklist | Status |
|---|---|
| Needs converted to Business Conditions (13) | ✅ |
| Correct technique per condition (EP/BVA/State Transition/Use Case) | ✅ |
| BVA: Stock threshold boundaries (0 / 5 / 6) and image size (3.5MB) covered | ✅ |
| State Transition: Delete — Confirm + Cancel + Blocked-guard paths | ✅ |
| Every TC has 4 parts (Arrange / Act / Tested Condition / Expected) | ✅ |
| Both Success (6 scenarios) and Alternative (9 scenarios) | ✅ |
| No conflicting conditions within a scenario | ✅ |
| Test Data is Real Example, no "Test/ทดสอบ" wording | ✅ |
| All 7 PO assumptions resolved and applied | ✅ |
| IDs on every TC + Scenario | ✅ |
| **SP_TS03** unblocked (SP-Q1: Add = Warehouse Staff / Admin) | ✅ Unblocked |
| **SP_TS05 / SP_TA05** confirmed behavior (SP-Q2: confirmation required) | ✅ |
</content>
</invoke>
