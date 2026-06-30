# Test Design — Product Stock Management (PS)  [File 1: Design]

> **File 1 (Design)** — 4 techniques (EP / BVA / State Transition / Use Case) → Business Conditions → E2E Scenarios + Hidden Assumptions
> Full Arrange / Expected details are in **File 2**: `product-stock-testcases.xlsx` (1 sheet, 23 columns → Lark Base `tblIwUWXkWNLYy4c`)
> Designed per `test-design-standard.md` (Black Box). Scenarios written as **E2E flows**.
>
> **Confirmed Scope (Q1 PO answer):**
> - Part 1: Add Product Stock = create a unit per Serial No. in the unit registry at `/cms/products/stock`
> - Part 2: Low Product Stock Notification = qty-based alerts (badge In/Low/Out + bell) on `/cms/products` and `/cms/inventory` (Spare Parts)
>
> Test Data: All test data is arranged and torn down by each test via API seed — no reliance on pre-existing QA data.
> Serials: MB2026GLC-0007 (create happy path) · MB2026GLC-DUPE01 (TA-03 seed) · MB2026GLC-DETAIL01 (TS-07 view seed)
> Masters: "2026 Mercedes GLC SUV" (Product) · "Store2" (Store) — must exist in STG master (not managed by tests)
> Image: assets/mercedes_glc_2026.jpg (2026 Mercedes GLC SUV photo, Unsplash free-use)

---

## PO Answer Summary (Applied to This Design)

| Q  | Topic | Answer |
|----|-------|--------|
| Q1 | Scope | ✅ 2 parts: unit registry per SN + qty-based badge/notification on Product & Spare Parts pages |
| Q2 | Required fields | ✅ Serial No. / Product / Store / Registered Date required; Manufacturing Warranty optional; Product & Store from master dropdown only |
| Q3 | Serial No. unique | ✅ Unique system-wide; duplicate = error, unit not created |
| Q4 | Serial No. format | ✅ Alphanumeric + dash; special chars/spaces = invalid; max length = 100 chars |
| Q5 | Date logic | ✅ Manufacturing Warranty **≥** Registered Date (before = invalid; **equal = valid**) |
| Q6 | Default Status | ✅ New unit default Status = **R001 (New)** · status mapping: R001 New / R002 Available / R003 Reserved / R004 Confirmed / R005 Paid / R006 Shipped / R007 Delivered / R008 Cancelled / R009 Expired / R010 Returned |
| Q7 | RBAC | ✅ **Warehouse Staff + Admin** can add; Agent and other roles cannot see Add button (intentional) |
| Q8 | Low threshold | ✅ 0 = Out of Stock · 1–5 = Low Stock · >5 = In Stock · configurable per company |
| Q9 | Badge scope | ✅ Badge on Product and Spare Parts (/cms/inventory) pages; Product Stock page (unit registry) has **no** qty badge |
| Q10 | Order Pick scope | ✅ Test Out of Stock via creating Product Stock / Spare Parts items per same threshold |
| Q11 | Exact text | ✅ "Product Stock created/updated/deleted successfully" (EN) / "สร้าง/อัปเดต/ลบ สต็อกสินค้า เรียบร้อยแล้ว" (TH) — from Error & Success Handling Matrix |
| Q12 | Notification | ✅ Realtime; **self-loop Low→Low does NOT create a duplicate notification** |

---

## Step 1 — Business Conditions

### Group A — Add Product Stock

| ID | Business Condition | Technique | Why |
|----|--------------------|-----------|-----|
| PS1 | Product Stock list page shows: Search bar, Filters (Product, Store), Reset, view-toggle, **Add Product Stock** button (authorized roles only), unit list with columns | Use Case | Landing page — enumerate required UI elements |
| PS2 | "Add Product Stock" opens modal with: Serial No.\*, Product\*, Store\*, Registered Date\*, Manufacturing Warranty (optional), Create + Cancel buttons | Use Case | Form layout — enumerate fields and controls |
| PS3 | Required fields: Serial No., Product, Store, Registered Date; Manufacturing Warranty is optional | Use Case | Each blank required field → form blocked; MW blank → form allowed |
| PS4 | Serial No. must be unique system-wide; duplicate = error, unit not created | EP | Unique (new SN) / Duplicate (existing SN) |
| PS5 | Serial No. format: alphanumeric + dash only; special chars/spaces = invalid; max length = 100 chars | EP + BVA | EP: valid vs invalid characters; BVA: length boundary at max 100 (99 / 100 / 101) |
| PS6 | Product must be selected from master dropdown (no free-text) | EP | In master / Not in master |
| PS7 | Store must be selected from master dropdown (no free-text) | EP | In master / Not in master |
| PS8 | Manufacturing Warranty must be ≥ Registered Date (before = invalid; equal = valid) | BVA | Single boundary: MW < RD / MW = RD / MW > RD |
| PS9 | Add success → toast "Product serial created successfully" + modal closes + unit appears in list | Use Case | Happy path — outcome verification |
| PS10 | RBAC: Warehouse Staff + Admin see Add button; Agent and other roles do NOT see it | EP | Authorized (Staff/Admin) / Unauthorized (Agent/other) |

### Group B — Low Product Stock Notification

| ID | Business Condition | Technique | Why |
|----|--------------------|-----------|-----|
| PS11 | Stock status derived from qty: 0 = Out of Stock · 1–5 = Low Stock · >5 = In Stock (per-company config) | BVA | 2 thresholds (0↔1 and 5↔6) → 5 TC values |
| PS12 | "Low Stock (n)" badge (orange) on Product and Spare Parts pages when qty = 1–5 | Use Case | Badge color, label, and page coverage |
| PS13 | "Out of Stock (0)" badge (red) on Product and Spare Parts pages when qty = 0 | Use Case | Badge color, label, and page coverage |
| PS14 | Stock status lifecycle: In→Low (system actor) → Out (system) → In (restock); self-loop Low→Low creates no duplicate notification | State Transition | States: In/Low/Out; edges: forward + reverse restock + self-loop; actor: system |
| PS15 | Low/Out Stock notification appears in bell panel; panel filterable by notification type | EP/Use Case | Filter match (Low Stock only) / unfiltered (All Types) |
| PS16 | Out of Stock alert fires immediately when picking a zero-stock item in Order (cross-feature; known bug "Research Stock Fail") | Use Case | Error path at Order Pick step |
| PS17 | Stock detail modal shows: Available count, Status, unit table (Code / Created Date / Last Adjusted Date / Action) + Close button | Use Case | Modal — enumerate required elements |

---

## Step 2 — Test Cases (Summary — full details in xlsx)

> Q6 resolved → new unit default Status = **R001 (New)**
> ✔ = used in a scenario

### PS1 — List Page Landing (Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS1-TC1` ✔ | Warehouse Staff logged in; ≥1 unit in system | Open `/cms/products/stock` | Page shows Search bar, Filters (Product, Store), Reset, view-toggle, **Add Product Stock** button; list shows columns: Serial No. / Product / Registered Date / Manufacturing Warranty / Store / Status / Purchased Date / End of Warranty |

### PS2 — Open Add Modal (Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS2-TC1` ✔ | On `/cms/products/stock`, Warehouse Staff | Click "Add Product Stock" | Modal "Add Products Stock" opens with Serial No.\*, Product\*, Store\*, Registered Date\*, Manufacturing Warranty, Create + Cancel buttons |

### PS3 — Required Field Validation (Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS3-TC1` ✔ | Modal open; Product = "2026 Mercedes GLC SUV", Store = "Store2", Registered Date = "2026-06-13", MW = "2027-06-13" | Leave Serial No. empty → click Create | Serial No. field shows error state with message **"Please fill in: Serial No."**; form not submitted |
| `PS3-TC2` ✔ | Modal; SN = "MB2026GLC-0001", Store = "Store2", Registered = "2026-06-13" | Leave Product empty → click Create | Product field shows error state with message **"Please fill in: Product"**; form not submitted |
| `PS3-TC3` ✔ | Modal; SN = "MB2026GLC-0001", Product = "2026 Mercedes GLC SUV", Registered = "2026-06-13" | Leave Store empty → click Create | Store field shows error state with message **"Please fill in: Store"**; form not submitted |
| `PS3-TC4` ✔ | Modal; SN = "MB2026GLC-0001", Product = "2026 Mercedes GLC SUV", Store = "Store2" | Leave Registered Date empty → click Create | Registered Date field shows error state with message **"Please fill in: Registered Date"**; form not submitted |
| `PS3-TC5` ✔ | Modal; all required fields filled, MW left empty | Click Create | Toast **"Product Stock created successfully"**; modal closes; unit created (confirms MW is optional) |

### PS4 — Serial No. Uniqueness (EP)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS4-TC1` ✔ | API teardown: purge SN "MB2026GLC-0007" if exists → SN not in system | Create with SN "MB2026GLC-0007" + required fields | Toast **"Product Stock created successfully"**; unit added to list |
| `PS4-TC2` ✔ | API seed: create unit SN "MB2026GLC-DUPE01" via API → SN now exists in system | Create with SN "MB2026GLC-DUPE01" + required fields; API teardown after | Error shown (duplicate Serial No.); unit not created |

### PS5 — Serial No. Format & Length (EP + BVA)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS5-TC1` ✔ | Add modal open | Enter SN "BMWG20-0007" (alphanumeric + dash only) | SN accepted; form can be submitted |
| `PS5-TC2` ✔ | Add modal open | Enter SN "MB 2026 #@!" (spaces + special characters) | SN field invalid error; form not submitted |
| `PS5-TC3` ✔ BVA-1 | Add modal open | Enter SN = 99-char string ("A"×98 + "B") | SN accepted (below max); form submittable |
| `PS5-TC4` ✔ BVA= | Add modal open | Enter SN = 100-char string ("A"×99 + "B") | SN accepted (at max boundary); form submittable |
| `PS5-TC5` ✔ BVA+1 | Add modal open | Enter SN = 101-char string ("A"×100 + "B") | SN field invalid error (exceeds max 100); form not submitted |

### PS6 — Product from Master (EP)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS6-TC1` ✔ | Add modal open | Click Product dropdown → select "2026 Mercedes GLC SUV" | Product field populated with "2026 Mercedes GLC SUV" |
| `PS6-TC2` ✔ | Add modal open | Type "Tesla Model Z" in Product field (not in master) | No matching option shown; cannot select |

### PS7 — Store from Master (EP)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS7-TC1` ✔ | Add modal open | Click Store dropdown → select "Store2" | Store field populated with "Store2" |
| `PS7-TC2` ✔ | Add modal open | Type a store name not present in master | No matching option shown; cannot select |

### PS8 — Manufacturing Warranty Date Logic (BVA — 1 boundary)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS8-TC1` ✔ BVA= | Registered Date = "2026-06-13" | Set MW = "2026-06-13" (same day, equal) | Valid — date accepted; form submittable |
| `PS8-TC2` ✔ BVA> | Registered Date = "2026-06-13" | Set MW = "2027-06-13" (after Registered Date) | Valid — date accepted; form submittable |
| `PS8-TC3` ✔ BVA< | Registered Date = "2026-06-13" | Set MW = "2025-01-01" (before Registered Date) | MW field invalid error; form not submitted |

### PS9 — Add Success Happy Path (Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS9-TC1` ✔ | API teardown: purge SN "MB2026GLC-0007" → SN not in system; "2026 Mercedes GLC SUV" and "Store2" in master | Fill: SN "MB2026GLC-0007" / Product "2026 Mercedes GLC SUV" / Store "Store2" / Registered "2026-06-13" / MW "2027-06-13" / Image "mercedes_glc_2026.jpg" → click Create | Toast **"Product Stock created successfully"**; modal closes; row "MB2026GLC-0007 / 2026 Mercedes GLC SUV / Store2" visible in list; Status = "R001 / New" ⚠️ BUG: image not saved (UploadFileCRM not called) |

### PS10 — RBAC (EP)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS10-TC1` ✔ | Logged in as **Warehouse Staff** | Open `/cms/products/stock` | "Add Product Stock" button is visible |
| `PS10-TC2` ✔ | Logged in as **Admin** | Open `/cms/products/stock` | "Add Product Stock" button is visible |
| `PS10-TC3` ✔ | Logged in as **Agent** | Open `/cms/products/stock` | "Add Product Stock" button is **NOT rendered** |

### PS11 — Stock Status BVA (2 thresholds → 5 values)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS11-TC1` ✔ BVA=0 | Product/spare part with qty = 0 | View item on `/cms/products` or `/cms/inventory` | Badge: **"Out of Stock (0)"** (red) |
| `PS11-TC2` ✔ BVA=1 | qty = 1 | View item | Badge: **"Low Stock (1)"** (orange) — qty 1 is the lower Low boundary |
| `PS11-TC3` ✔ BVA<5 | qty = 4 | View item | Badge: **"Low Stock (4)"** (orange) |
| `PS11-TC4` ✔ BVA=5 | qty = 5 | View item | Badge: **"Low Stock (5)"** (orange) — at upper Low boundary |
| `PS11-TC5` ✔ BVA>5 | qty = 6 | View item | Badge: **"In Stock"** — qty 6 is above threshold |

### PS12 — Low Stock Badge (Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS12-TC1` ✔ | Spare part "Mercedes-Benz M112" qty = 1 | Open `/cms/inventory` | Orange **"Low Stock (1)"** badge visible next to "Mercedes-Benz M112"; stock detail icon present |
| `PS12-TC2` ✔ | Product "2026 Mercedes GLC SUV" qty = 3 | Open `/cms/products` | Orange **"Low Stock (3)"** badge visible next to the product |

### PS13 — Out of Stock Badge (Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS13-TC1` ✔ | Spare part "Mercedes-Benz OM654.920" qty = 0 | Open `/cms/inventory` | Red **"Out of Stock (0)"** badge visible next to "Mercedes-Benz OM654.920" |
| `PS13-TC2` ✔ | Product qty = 0 | Open `/cms/products` | Red **"Out of Stock (0)"** badge visible |

### PS14 — Stock Lifecycle State Transition
> States: **In Stock** (qty >5) ↔ **Low Stock** (qty 1–5) ↔ **Out of Stock** (qty 0); Actor: System

| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS14-TC1` ✔ In→Low | Spare part qty = 6 (In Stock) | System reduces qty to 5 | Badge changes to **"Low Stock (5)"**; Low Stock notification created |
| `PS14-TC2` ✔ Low→Out | Spare part qty = 1 (Low Stock) | System reduces qty to 0 | Badge changes to **"Out of Stock (0)"**; Out of Stock notification created |
| `PS14-TC3` ✔ Out→In | Spare part qty = 0 (Out of Stock) | Staff restocks — qty set to 10 | Badge changes to **"In Stock"**; Out of Stock badge removed |
| `PS14-TC4` ✔ Low self-loop | Spare part qty = 3 (Low Stock) | System reduces qty to 2 (stays in 1–5) | Badge stays **"Low Stock (2)"**; **no new notification created** |

### PS15 — Notification Bell (EP/Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS15-TC1` ✔ | Low or Out of Stock event has occurred | Click notification bell icon | Notification panel opens; entry for low/out stock event visible; "All Types" filter active by default |
| `PS15-TC2` ✔ | Notification panel open (multiple types present) | Select filter type "Low Stock" | Only Low Stock notifications shown; Out of Stock entries hidden |

### PS16 — Out of Stock at Order Pick (Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS16-TC1` ✔ | Product stock qty = 0; Order in Pick step | Attempt to Pick the zero-stock product | Out of Stock alert displayed immediately; pick action blocked ⚠️ known bug "Research Stock Fail" |

### PS17 — Stock Detail Modal (Use Case)
| TC | Arrange | Act | Expected |
|----|---------|-----|----------|
| `PS17-TC1` ✔ | On `/cms/inventory`; "Mercedes-Benz M112" has a stock badge | Click the stock detail icon next to "Mercedes-Benz M112" | Modal **"Spare Parts Stock: Mercedes-Benz M112"** opens showing: Available count, Status, table with columns Code / Created Date / Last Adjusted Date / Action; Close button visible |

---

## Step 3 — Remaining Hidden Assumption

| # | Topic | Status | Blocked TCs |
|---|-------|--------|-------------|
| **HA6** | Default Status code for a newly created unit (is it R001? what do R001/R007 mean?) | ✅ **Resolved** — R001 (New); full mapping R001–R010 (see Q6) | PS9-TC1 |

All other hidden assumptions (HA1–HA5, HA7–HA12) resolved by PO answers Q1–Q5 and Q7–Q12.

---

## Step 4 — Test Scenarios (End-to-End Flows)

### ✅ Success Scenarios

`PS_TS01` — Add Product Stock with Manufacturing Warranty (full happy path)
1. `PS1-TC1` — Open list page; Add button visible
2. `PS2-TC1` — Click Add; modal opens with correct fields
3. `PS9-TC1` — Fill all fields including MW; click Create
→ **Toast "Product Stock created successfully"; new unit visible in list**

`PS_TS02` — Add Product Stock without Manufacturing Warranty (optional field)
1. `PS2-TC1` — Open Add modal
2. `PS3-TC5` — Fill required fields only; leave MW empty; click Create
→ **Toast "Product Stock created successfully" (MW confirmed optional)**

`PS_TS03` — Valid Serial No. format + no duplicate → Create success
1. `PS5-TC1` — Enter alphanumeric+dash SN "BMWG20-0007" (valid format)
2. `PS4-TC1` — SN not a duplicate → Create
→ **Toast "Product Stock created successfully"**

`PS_TS04` — Stock status badge at all threshold boundaries (BVA)
1. `PS11-TC5` — qty = 6 → In Stock
2. `PS11-TC4` — qty = 5 → Low Stock (5) [upper boundary]
3. `PS11-TC3` — qty = 4 → Low Stock (4)
4. `PS11-TC2` — qty = 1 → Low Stock (1) [lower boundary]
5. `PS11-TC1` — qty = 0 → Out of Stock (0)
→ **Badge changes correctly at each threshold**

`PS_TS05` — Low Stock notification full flow (In → Low → badge + bell)
1. `PS14-TC1` — System reduces qty In(6)→Low(5); Low Stock notification created
2. `PS12-TC1` — "Low Stock (1)" orange badge on /cms/inventory
3. `PS15-TC1` — Notification bell shows Low Stock entry
→ **Low stock triggers badge and realtime notification**

`PS_TS06` — Out of Stock and restock recovery
1. `PS14-TC2` — qty Low(1)→Out(0); Out of Stock notification
2. `PS13-TC1` — "Out of Stock (0)" red badge on /cms/inventory
3. `PS14-TC3` — Staff restocks Out(0)→In(10); badge removed
→ **Out of Stock notified; badge clears after restock**

`PS_TS07` — View Stock Detail (Item Details overlay on `/cms/products/stock`)
> Arrange: API seed SN "MB2026GLC-DETAIL01" (Product Stock unit) → do not depend on pre-existing QA rows
1. API seed: create unit SN "MB2026GLC-DETAIL01" / Product "2026 Mercedes GLC SUV" / Store "Store2"
2. Open `/cms/products/stock` → search / find row → click "View" → "Item Details" overlay opens
3. Verify overlay shows Serial No. / Product / Store / Status fields
4. Click Close → overlay dismissed
5. API teardown: purge SN "MB2026GLC-DETAIL01"
→ **Overlay shows correct unit fields; close works**

`PS_TS08` — Notification type filter
1. `PS15-TC1` — Open bell → see All Types
2. `PS15-TC2` — Filter "Low Stock" → only Low Stock entries shown
→ **Filter narrows notification list correctly**

`PS_TS09` — Authorized roles see Add button (RBAC positive)
1. `PS10-TC1` — Warehouse Staff → Add button visible
2. `PS10-TC2` — Admin → Add button visible
→ **Both authorized roles have access**

`PS_TS10` — Manufacturing Warranty equal to Registered Date (BVA boundary — valid)
1. `PS8-TC1` — MW = Registered Date "2026-06-13" (same day) → Create
→ **Equal date accepted (MW ≥ RD)**

`PS_TS11` — Serial No. at max length boundary (BVA 99 and 100 chars)
1. `PS5-TC3` — SN 99 chars → valid (below max)
2. `PS5-TC4` — SN 100 chars → valid (at max boundary)
→ **Both lengths accepted**

### ❌ Alternative Scenarios

| Scenario | Key TC(s) | Expected Outcome | Notes |
|----------|-----------|-----------------|-------|
| `PS_TA01` | `PS3-TC1` | Serial No. empty → field error; form not submitted | |
| `PS_TA02` | `PS3-TC2`, `PS3-TC3`, `PS3-TC4` | Product / Store / Registered Date empty → respective field errors | |
| `PS_TA03` | `PS4-TC2` | Arrange SN "MB2026GLC-DUPE01" via API seed → duplicate SN via UI → duplicate error; seed unit torn down after | |
| `PS_TA04` | `PS5-TC2` | SN with spaces/special chars → invalid; form not submitted | |
| `PS_TA05` | `PS5-TC5` | SN 101 chars (over max) → field error; form not submitted | |
| `PS_TA06` | `PS8-TC3` | MW "2025-01-01" before Registered "2026-06-13" → date validation error | |
| `PS_TA07` | `PS6-TC2`, `PS7-TC2` | Non-master product/store → no option; cannot select | |
| `PS_TA08` | `PS10-TC3` | Agent role → Add button not rendered | |
| `PS_TA09` | `PS16-TC1` | Pick zero-stock product in Order → Out of Stock alert; pick blocked | ⚠️ known bug |
| `PS_TA11` | — | Delete unit with Status "Delivered" → error toast "Delete failed"; unit remains in list | SN "100003-001" (stable QA unit, Status Delivered; API blocks delete) |

### 🔁 UI / State Behavior

`PS_UI01` — Self-loop: Low Stock → Low Stock (no duplicate notification)
- `PS14-TC4` — qty Low(3)→Low(2) → badge stays "Low Stock (2)"; **no new notification**

`PS_UI02` — RBAC control pair: Authorized vs Unauthorized
- `PS10-TC1` / `PS10-TC2` (Add visible) vs `PS10-TC3` (Add NOT visible)

---

## Step 5 — Definition of Done (Self-Check)

- [x] Needs → Business Conditions numbered and grouped (PS1–PS17, Group A/B)
- [x] All 4 techniques applied: EP (PS4, 6, 7, 10, 15) · BVA (PS5, 8, 11) · State Transition (PS14) · Use Case (PS1, 2, 3, 9, 12, 13, 16, 17)
- [x] BVA complete (less/equal/greater): Serial No. length (99/100/101) · Date (before/equal/after) · Stock qty (0/1/4/5/6)
- [x] State Transition complete: In→Low (TC1) · Low→Out (TC2) · Out→In restock (TC3) · self-loop Low→Low (TC4) · system as actor
- [x] All TCs have 4 parts (Arrange / Act / Tested Condition / Expected) — details in xlsx
- [x] Success (11 scenarios) + Alternative (9) + UI/State (2) scenarios
- [x] Scenarios are E2E flows; no contradictory conditions combined
- [x] Test Data = Real Example (MB2026GLC-0007 / Mercedes-Benz M112 / Store2 / 100003-002) — no "Test" keyword
- [x] PO answers applied: exact toast texts, max SN length 100, threshold 0/1-5/>5, RBAC Warehouse Staff+Admin, badge on Product+Spare Parts pages, realtime notification, no self-loop duplicate
- [✅] **All Hidden Assumptions resolved** — HA6 closed (new unit Status = R001/New); no remaining sign-off blockers
