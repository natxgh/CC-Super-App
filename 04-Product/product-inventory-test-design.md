# Test Design — Product & Inventory Management (PIM)  〔File 1: Design〕

> **File 1 (Design)** — 4 techniques (EP / BVA / State Transition / Use Case) → Business Conditions → woven into Scenarios (flow) + Hidden Assumptions
> Per-Test-Case detail / Arrange / Expected lives in **File 2** `product-inventory-testcases.xlsx` (1 sheet, 23 columns → Lark Base `tblIwUWXkWNLYy4c`)
> Designed per `test-design-standard.md` (Black Box). Scenarios are written as **E2E flows**.
> Scope (as instructed): **View Product Detail · Add · Update · Delete · View Table List + Search/Filter** (CMS page `/cms/products/`)
> Test Data = Real Example data from STG (Xiaomi / Chery / BMW / Mercedes…) already surveyed.

---

## Step 0 — BRD ↔ Grooming ↔ Real UI comparison (Product & Inventory)

| Aspect | BRD v0.3 §3.1.3 Product Inventory | Grooming §3.1 | Real UI (`/cms/products`) | Gap / Observation |
|---|---|---|---|---|
| Level of detail | **Very high-level** — only a "Product Inventory Management" bullet + objective paragraph | States CRUD + view + search | Full CRUD + search/filter | BRD has no field/rule detail → real spec lives in Grooming + UI |
| CRUD | Implied ("store product data") | **Add / Edit / Delete** explicit | ✅ Create / Update / Delete | Aligned |
| Product fields | Not specified | "Detail, image, Model Year" | TH/EN Name, Code, Category, Brand, **Year**, Warranty(Days), Price, Image | Real fields exceed Grooming → must confirm required/validation (HA3–HA7) |
| View Mode | Not specified | **Card / List / Small Card** | **List / Grid / Table** | ⚠️ **Mode names mismatch** → HA1 |
| Search / Filter | Not specified | "Search + Filter supported" | Search + Filter (Brand/Category/Status) | UI has 3 filter axes → confirm search scope (HA9) |
| Stock | "Track remaining quantity" (separate Product Stock) | Low Stock / Out of Stock alert | Badge **Out of Stock / Low Stock** (read-only) | Stock comes from Product Stock Mgmt → this page is read-only → HA10 |
| Serial Number | Not specified | **SN must be created before binding to Customer** (via Product Stock) | Not on Product CRUD page | Different page (Product Stock) — out of scope this round |
| Barcode scan | Not specified | Roadmap (future) | Absent | Out of scope |
| Soft delete / Active-Inactive | Not specified | Not specified | Filter **Status Active/Inactive** + Delete button ("cannot be undone") | Delete ↔ Status relationship unclear → HA8 |

> **Summary:** BRD only conveys "intent/scope" — **all validation rules are absent from both BRD and Grooming**, so they become Hidden Assumptions requiring PO confirmation (HA2–HA11).

---

## Step 1 — Business Conditions (+ technique)

| ID | Business Condition | Technique | Why |
|----|--------------------|-----------|-----|
| PIM1 | Product List page shows items + primary buttons (Create / Search / Filters / Reset / view-toggle) | Use Case | Landing page — enumerate required elements |
| PIM2 | View-mode toggle switches display **List ↔ Grid ↔ Table** | State Transition | 3 display states (+ see HA1 mode names) |
| PIM3 | Search keyword filters items matching Product Name/Code | EP | Match / no match / partial |
| PIM4 | Filter by Brand | EP | Brand has items / none |
| PIM5 | Filter by Category | EP | Category has items / none |
| PIM6 | Filter by Status (Active / Inactive) | EP | 2 opposite groups |
| PIM7 | Reset clears search + filters back to full list | Use Case | Restore default |
| PIM8 | Column sort (Name / Code / Year / Price / Warranty) in Table view | State Transition | asc ↔ desc ↔ none |
| PIM9 | View → **Item Details** modal shows all fields + Delete/Edit/Close buttons | Use Case | Enumerate fields/buttons that must appear |
| PIM10 | Add: required fields must be complete (TH, EN, Code, Category, Brand, Year, Warranty, Price) | Use Case | Iterate each field left empty |
| PIM11 | Add: Product Code must be unique (not duplicate an existing one) | EP | unique / duplicate |
| PIM12 | Add: Warranty (Days) is an integer **≥ 0** (no max) | BVA | Lower bound 0 (−1/0/1) + negative — PO: ≥ 0 |
| PIM13 | Add: Price is an integer **≥ 0** (no max, no decimals) | BVA | Lower bound 0 (−1/0/1) + negative + decimal (reject) — PO: int ≥ 0 |
| PIM14 | Add: Year selectable only within dropdown range (2017–2026) | BVA/EP | Bounds 2017 / 2026 |
| PIM15 | Add: Product Image (optional) accepts only JPG/PNG/GIF | EP | Valid format / invalid / none |
| PIM16 | Add success → new product appears in list | Use Case | Happy path |
| PIM17 | Edit: form pre-fills values from the existing product | Use Case | Verify existing values are loaded |
| PIM18 | Update: edit values and save → new values reflected in detail/list | Use Case | Happy path edit |
| PIM19 | Update: uses the same validation set as Add (required/format) | Use Case | Reuse PIM10–PIM15 |
| PIM20 | Delete shows confirm dialog ("This action cannot be undone") | State Transition | List → Confirm → Deleted / Cancelled |
| PIM21 | Confirm Delete on a product **with no Product Stock (Serial) and no Order relation** → deletes successfully, disappears from list | Use Case | Real delete endpoint (deletable condition) — PO Q8 |
| PIM22 | Cancel Delete → product remains intact | Use Case | Reverse transition |
| PIM23 | Delete a product **that has Product Stock (Serial) or an Order relation** → system **blocks** with "cannot delete" | EP | Has dependency / no dependency — PO Q8 (conditional delete) |

---

## Step 2 — Test Cases (Arrange / Act+Data / Tested Condition / Expected)

> Expected text not yet known is left as `""` for PO/QA to fill · TCs whose result depends on a Hidden Assumption are marked 🔸

### PIM1 — List landing (Use Case)
- `PIM1-TC1` | Open `/cms/products/` (at least 1 product) | Load list page | Shows **Create Products / Search / Filters / Reset** buttons + 3 view-toggle buttons + product rows (e.g. `1007`, `Chery V27`) with columns Product Name/Code/Stock/Brand/Category/Year/Price/Warranty

### PIM2 — View-mode toggle (State Transition) — states: List / Grid / Table
- `PIM2-TC1` | view = List (default) | — | Each product is a row with all fields + View/Edit/Delete buttons
- `PIM2-TC2` | Click Grid button | Actor=user | Displays as large-image cards (e.g. 3 columns)
- `PIM2-TC3` | Click Table button | Actor=user | Table with headers Product Name/Code/Stock/Brand/Category/Year/Price/Warranty/Action ✅HA1

### PIM3 — Search (EP)
- `PIM3-TC1` | Keyword `Chery` (match) | Type + click Search | Narrows to `Chery V27` + `Chery V23` (2 items)
- `PIM3-TC2` | Keyword `BMW` (multiple matches) | Search | Narrows to 3 BMW models (`BMW7G70`/`BMW5G60`/`BMW3G20`)
- `PIM3-TC3` | Keyword `Zznotexist` (no match) | Search | Shows empty state **"No entries to show"** ✅HA11
- `PIM3-TC4` | Keyword `Cher` (partial) | Search | Narrows to Chery products (partial match) ✅HA9

### PIM4 — Filter Brand (EP)
- `PIM4-TC1` | Filter Brand = `BMW` | Select + Search | Shows only BMW-brand products (3 items)
- `PIM4-TC2` | Filter Brand = a brand with no products | Select + Search | Empty state **"No entries to show"** ✅HA11

### PIM5 — Filter Category (EP)
- `PIM5-TC1` | Filter Category = `Vehicles` | Select + Search | Shows only Vehicles products (Chery/BMW/Mercedes/Jaecoo)
- `PIM5-TC2` | Filter Category = `Game` (no products) | Select + Search | Empty state **"No entries to show"** ✅HA11

### PIM6 — Filter Status (EP)
- `PIM6-TC1` | Filter Status = `Active` | Select + Search | Shows only active products ✅HA8 (status = soft filter, separate from delete)
- `PIM6-TC2` | Filter Status = `Inactive` | Select + Search | Shows only inactive products (or empty if none) ✅HA8

### PIM7 — Reset (Use Case)
- `PIM7-TC1` | After search/filter is applied → click Reset | Click Reset | Clears Search box + all filters, list returns to showing all products

### PIM8 — Column sort (State Transition, Table view)
- `PIM8-TC0` | Load list initially (no sort clicked) | — | **default sort = Name** (PO Q12 ✅)
- `PIM8-TC1` | Click Price column header (1st time) | Sort | Sorts Price low→high (`฿699,000` before `฿4,290,000`) ✅HA12
- `PIM8-TC2` | Click Price (2nd time) | Sort | Sorts high→low
- `PIM8-TC3` | Click Year column | Sort | Sorts by year (asc) ✅HA12

### PIM9 — View Detail (Use Case)
- `PIM9-TC1` | Click View on `Chery V27` | Open modal | **Item Details** modal shows: image, Product Name `Chery V27`, Code `CheryV27`, Stock `Low Stock (1)`, Brand `Chery`, Category `Vehicles`, Year `2026`, Price `฿1,399,000.00`, Warranty `12 Months` + **Delete/Edit/Close** buttons

### PIM10 — Add required fields (Use Case) — iterate empty field
| TC | What is entered (field left empty) | Expected |
|----|--------------------------|----------|
| `PIM10-TC1` | Leave Product Name (TH) empty | Inline error: **"Please fill in: Product Name (TH)"** (TH: กรุณากรอกข้อมูล: ชื่อสินค้า (TH)) + submit fails ✅HA11 |
| `PIM10-TC2` | Leave Product Name (EN) empty | Inline error: **"Please fill in: Product Name (EN)"** (TH: กรุณากรอกข้อมูล: ชื่อสินค้า (EN)) + submit fails ✅HA11 |
| `PIM10-TC3` | Leave Product Code empty | Inline error: **"Please fill in: Product Code"** (TH: กรุณากรอกข้อมูล: รหัสสินค้า) + submit fails ✅HA11 |
| `PIM10-TC4` | Leave Category empty | Inline error: **"Please fill in: Category"** (TH: กรุณากรอกข้อมูล: หมวดหมู่) + submit fails ✅HA11 |
| `PIM10-TC5` | Leave Brand empty | Inline error: **"Please fill in: Brand"** (TH: กรุณากรอกข้อมูล: แบรนด์) + submit fails ✅HA11 |
| `PIM10-TC6` | Leave Year empty | Inline error: **"Please fill in: Year"** (TH: กรุณากรอกข้อมูล: ปี) + submit fails ✅HA11 |
| `PIM10-TC7` | Leave Warranty empty | Inline error: **"Please fill in: Warranty (Days)"** (TH: กรุณากรอกข้อมูล: การรับประกัน (วัน)) + submit fails ✅HA11 |
| `PIM10-TC8` | Leave Price empty | Inline error: **"Please fill in: Price"** (TH: กรุณากรอกข้อมูล: ราคา) + submit fails ✅HA11 |
| `PIM10-TC9` | Fill all required (no Image) | Passes required check → can create (Image optional ✅HA3) |

### PIM11 — Product Code unique (EP)
- `PIM11-TC1` | Code `XIA-RVX20` (new, not duplicate) | Enter + Create | Created successfully
- `PIM11-TC2` | Code `CheryV27` (duplicate of existing) | Enter + Create | "duplicate code" error `""` + not created ✅HA2 (mechanism confirmed · error text pending PO)

### PIM12 — Warranty (Days) BVA — lower bound 0 (PO Q4: integer **≥ 0**, no max)
| TC | Warranty | Expected |
|----|----------|----------|
| `PIM12-TC1` | `0` | **valid** (0 accepted — PO confirms ≥ 0) |
| `PIM12-TC2` | `1` | valid (passes) |
| `PIM12-TC3` | `-1` (below bound) | invalid `""` |
| `PIM12-TC4` | `-30` (negative) | invalid `""` |

### PIM13 — Price BVA (PO Q5: **integer ≥ 0**, no max, no decimals)
| TC | Price | Expected |
|----|-------|----------|
| `PIM13-TC1` | `0` | **valid** (0 accepted — PO confirms ≥ 0) |
| `PIM13-TC2` | `1` | valid |
| `PIM13-TC3` | `12990.50` (decimal) | **invalid / rounded to integer** `""` (PO: no decimals) |
| `PIM13-TC4` | `-500` (negative) | invalid `""` |

### PIM14 — Year boundary (BVA/EP) — dropdown 2017–2027 (PO Q15: range = 2017 to current year + 1 → 2027 in 2026)
- `PIM14-TC1` | Select `2017` (lower bound) | valid
- `PIM14-TC2` | Select `2027` (upper bound = current year 2026 + 1) | valid
- `PIM14-TC3` | Year `2028` (> upper bound) | **Cannot be selected** (not in dropdown) → unsupported
> Note: upper bound is dynamic = current year + 1 — re-verify the dropdown's top value each new calendar year.

### PIM15 — Product Image (EP) — PO Q7: JPG/PNG/GIF, **max 3MB**
- `PIM15-TC1` | Upload `xiaomi-rvx20.jpg` (JPG, ≤3MB) | valid → shows preview
- `PIM15-TC2` | Upload `spec-sheet.pdf` (unsupported) | reject `""`
- `PIM15-TC3` | No image uploaded | can create (Image optional)
- `PIM15-TC4` | Upload `banner-4mb.jpg` (valid JPG format but **> 3MB**) | reject `""` (exceeds max size)

### PIM16 — Add success (Use Case) — happy path
- `PIM16-TC1` | TH `หุ่นยนต์ดูดฝุ่น Xiaomi Robot Vacuum X20+` / EN `Xiaomi Robot Vacuum X20+` / Code `XIA-RVX20` / Category `Small Appliances` / Brand `Xiaomi` / Year `2025` / Warranty `365` / Price `12990` → Create | toast **"Product created successfully"** + modal closes + product `XIA-RVX20` appears in list

### PIM17 — Edit pre-fill (Use Case)
- `PIM17-TC1` | Click Edit on product code `1001` | **Edit Products** form loads all existing values (TH/EN/Code `1001`/Category `Smart Tech & Gadgets`/Brand `Xiaomi`/Year `2026`/Warranty `1`/Price `1001`) + **Update Products** button

### PIM18 — Update success (Use Case)
- `PIM18-TC1` | On product `XIA-RVX20` change Price `12990` → `11990` + click Update | toast **"Product updated successfully"** + detail/list show new Price `฿11,990.00`
- `PIM18-TC2` | Change Warranty `365` → `730` + Update | New Warranty reflected in detail (`24 Months`/`730 Days`) — PO Q12: stored in **days**, shown as pill

### PIM19 — Update validation (reuse)
- `PIM19-TC1` | On Edit, clear Product Code to empty + Update | Inline error: **"Please fill in: Product Code"** (TH: กรุณากรอกข้อมูล: รหัสสินค้า) + not saved ✅HA11

### PIM20 — Delete confirm dialog (State Transition)
- `PIM20-TC1` | Click Delete (trash) button on a product | Opens **Delete Confirmation**: "Are you sure you want to delete ? This action cannot be undone." + Cancel / Delete buttons

### PIM21 — Confirm delete on a deletable product (Use Case) — PO Q8: no Product Stock (Serial) + no Order relation
- `PIM21-TC1` | Product `XIA-RVX20` (newly created, no Stock/Order yet) → click **Delete** in dialog | toast **"Product deleted successfully"** + `XIA-RVX20` disappears from list

### PIM22 — Cancel delete (Use Case, reverse)
- `PIM22-TC1` | Click **Cancel** in dialog on product `Chery V27` | Dialog closes + `Chery V27` remains in list unchanged

### PIM23 — Conditional delete: blocked when dependency exists (EP) — PO Q8
- `PIM23-TC1` | Product **with Product Stock (Serial)** attached → click Delete | System **blocks deletion** `""` (warns Product Stock exists) + product remains in list
- `PIM23-TC2` | Product **with an Order relation** → click Delete | System **blocks deletion** `""` (warns an Order is linked) + product remains in list

---

## Step 3 — Hidden Assumptions → PO questions (propose-and-confirm: ✅/❌)

> ✅ **PO answered all 12/12** (pulled from Lark Base — Modified By = PO) · status below is the actual answer

| # | PO answer (actual) | Affected TC | Status |
|---|------------------|----------|------|
| HA1 | View mode = **List / Grid / Table** (per UI) — Card/List/Small Card in Grooming are old names | PIM2 | ✅ Confirmed |
| HA2 | **Product Code must be unique** — duplicate triggers error, not created | PIM11-TC2 | ✅ Confirmed |
| HA3 | required = TH, EN, Code, Category, Brand, Year, Warranty, Price · **Image optional** | PIM10, PIM19 | ✅ Confirmed |
| HA4 | Warranty (Days) = integer **≥ 0** (0 accepted) · no max · negative = invalid | PIM12 | ⚠️ **Changed** (originally proposed ≥1) |
| HA5 | Price = **integer ≥ 0** (0 accepted) · no max · **no decimals** · negative = invalid | PIM13 | ⚠️ **Changed** (originally proposed >0 + decimals) |
| HA6 | Year range = **2017 to (current year + 1)** → **2017–2027** in 2026 (dynamic upper bound) | PIM14 | ✅ Confirmed (Q15 final) |
| HA7 | Image = **JPG/PNG/GIF** · **max = 3MB** · other/oversize = reject | PIM15 | ✅ Confirmed + got max |
| HA8 | Delete = **conditional** — deletable only when **no Product Stock (Serial) and no Order relation** · otherwise blocked | PIM21, PIM23 | ⚠️ **Changed** (not always-permanent delete) |
| HA9 | Search = **Product Name (TH+EN) + Product Code** · partial + case-insensitive | PIM3 | ✅ Confirmed |
| HA10 | **Stock / badge = read-only** from Product Stock Management | PIM9 | ✅ Confirmed |
| HA11 | toast: create=**"Product created successfully"** · update=**"Product updated successfully"** · delete=**"Product deleted successfully"** · per-field required: **"Please fill in: \<field\>"** · empty-state: **"No entries to show"** | PIM3/4/5/10/16/18/19/21 | ✅ **Confirmed** — all text finalised (Error & Success Handling Matrix 2026-06-24 + PO confirmed empty-state) |
| HA12 | sort = Name/Code/Year/Price/Warranty · **default sort = Name** · Warranty stored in **days**, shown as pill | PIM8, PIM18-TC2 | ✅ Confirmed + got default |

> ✅ **HA11 fully closed (2026-06-24):** per-field required error text `"Please fill in: <field>"` (EN) / `"กรุณากรอกข้อมูล: <field>"` (TH) confirmed via Error & Success Handling Matrix · empty-state `"No entries to show"` confirmed by PO.

> **🐞 Env observation (not a test condition):** While surveying STG, `GetListProduct` (GraphQL BFF `cc-bff-stg`) intermittently **hangs/does not respond**, leaving the list stuck on "Loading…" — the dev/infra team should check list-endpoint stability before the execution round.

---

## Step 4 — Test Scenarios (E2E flow)

### ✅ Success

`PIM_TS01` — Add new product successfully (happy path)
1. `PIM1-TC1` list page with Create button
2. `PIM10-TC9` fill all required
3. `PIM16-TC1` Create `XIA-RVX20`
→ **success toast + new product appears in list**

`PIM_TS02` — View product detail
1. `PIM1-TC1` → 2. `PIM9-TC1` click View `Chery V27`
→ **Item Details modal shows all fields + Delete/Edit/Close buttons**

`PIM_TS03` — Edit product
1. `PIM17-TC1` open Edit (pre-fill) → 2. `PIM18-TC1` change Price → Update
→ **new Price reflected in detail/list**

`PIM_TS04` — Delete product (confirm)
1. `PIM20-TC1` open confirm dialog → 2. `PIM21-TC1` click Delete `XIA-RVX20`
→ **product disappears from list**

`PIM_TS05` — Search + filter + reset
1. `PIM3-TC1` search `Chery` (2 left) → 2. `PIM4-TC1` filter Brand `BMW` (3 left) → 3. `PIM7-TC1` Reset
→ **list returns to full**

`PIM_TS06` — Switch view modes
1. `PIM2-TC1` List → 2. `PIM2-TC2` Grid → 3. `PIM2-TC3` Table
→ **renders correctly in all 3 modes**

### ❌ Alternative

| Scenario | Flow (TC sequence) | Outcome | Note |
|----------|-----------------|---------|----------|
| `PIM_TA01` | `PIM10-TC3` (leave Code empty) | submit fails + **"Please fill in: Product Code"** | ✅HA11 |
| `PIM_TA02` | `PIM10-TC9` → `PIM11-TC2` (Code `CheryV27` duplicate) | duplicate-code error, not created | ✅HA2 |
| `PIM_TA03` | `PIM10-TC9` → `PIM13-TC4` (Price `-500`) | invalid, not created | ✅HA5 |
| `PIM_TA04` | `PIM10-TC9` → `PIM13-TC3` (Price `12990.50` decimal) | reject decimal (int only) | ✅HA5 (replaced Warranty 0, now valid) |
| `PIM_TA05` | `PIM10-TC9` → `PIM15-TC2` (image `.pdf`) | reject file | ✅HA7 |
| `PIM_TA06` | `PIM20-TC1` → `PIM22-TC1` (click Cancel) | product remains intact | reverse |
| `PIM_TA07` | `PIM3-TC3` (search `Zznotexist`) | empty state | empty-state text pending PO (`""`) |
| `PIM_TA08` | `PIM6-TC2` (Status `Inactive`) | inactive only / empty | ✅HA8 (status = soft filter) |
| `PIM_TA09` | Arrange: API seed `BMW-TA11` (product) + `BMW5G60-TA11-001` (product stock) → `PIM20-TC1` → `PIM23-TC1` (Delete product with Product Stock) → Teardown: API delete stock + product | blocked, cannot delete + product remains | ✅HA8 conditional delete · data arranged & torn down by test (no pre-existing QA data) |
| `PIM_TA10` | `PIM15-TC4` (image JPG > 3MB) | reject, exceeds max 3MB | ✅HA7 max size |

### 🔁 UI behavior
`PIM_UI01` — Column sort (Table): `PIM8-TC1 → PIM8-TC2 → PIM8-TC3` (Price asc → desc → Year asc)

---

## Step 5 — Definition of Done (self-check)

- [x] Business Conditions with IDs complete (PIM1–PIM23)
- [x] All 4 techniques present: EP (PIM3–6,11,15,23) · BVA (PIM12–14) · State Transition (PIM2,8,20) · Use Case (PIM1,7,9,10,16–19,21,22)
- [x] BVA covers less/equal/greater + negative (Warranty PIM12 bound 0, Price PIM13 bound 0 + decimal reject, Year bound PIM14)
- [x] State Transition fully traced (3-state toggle PIM2, sort asc/desc PIM8, delete + reverse cancel PIM20→22)
- [x] Every TC has all 4 parts (Arrange/Act+Data/Tested Condition/Expected)
- [x] Both Success (6) and Alternative (10) + UI (1)
- [x] Scenarios are E2E flows + no contradictory conditions
- [x] Test Data = Real Example (Xiaomi/Chery/BMW…) with no "Test/ทดสอบ" placeholders
- [x] **Hidden Assumptions HA1–HA12 — PO answered all 12/12** (pulled from Lark Base) → logic updated to actual answers
- [x] HA11 fully closed — per-field required error text + empty-state **"No entries to show"** all confirmed (2026-06-24)
- [x] BRD ↔ Grooming ↔ UI compared (Step 0)

**Sign-off blockers (remaining):** ✅ **None — all HAs closed**
**Closed by PO answers:** view mode · code unique · required/Image · Warranty/Price range · **Year range 2017–2027 (current year + 1)** · image max 3MB · conditional delete · search scope · stock read-only · default sort · toast text (create/update/delete) · per-field required error text · empty-state **"No entries to show"**
