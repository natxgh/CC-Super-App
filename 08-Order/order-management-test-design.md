# Order Management — Test Design (Black Box)

> Feature: **Order Management** (CMS · path `/cms/inventory/request`, UI title "Order" / "Request Spare Part")
> Product: CC Super App · Project: AICC · STG v0.26.3
> Method: QA team Black Box (EP / BVA / State Transition / Use Case) — `qa-ai-pilot/test-design-standard.md`
> Sources cross-checked: **BRD v0.3 §3.1.5 / FR-05** + **grooming-requirements.md §4** + **hands-on exploration (2026-06-14)**
> **PO answers applied 2026-06-19** — all 9 Hidden Assumptions resolved (see §4). On-screen labels are kept in their literal STG language (Thai); realistic example data is kept per the Real Example Data standard.

---

## 0. Requirements captured from hands-on exploration (Explored Requirements)

### 0.1 Overview
Order Management = a **spare-part / item requisition system (Order / Request Spare Part)** for repair jobs.
It tracks status from order creation through completion via a Workflow + SLA + PIC per step.

### 0.2 Six sub-features (as specified by the user)
| # | Sub-feature | What was found in the real system |
|---|---|---|
| 1 | **View Order** | Header (Order No · Status badge · created date · requester · Print) · Title (editable) · Bill card (Bill To / Billing Address / Ship To / Shipping Address / Ship By) · Chat/Comment box (empty = "No Comment") · Order Items (name · Quantity · Price · Stock badge) · Operating Procedure (9-step workflow) |
| 2 | **Add Order** | Add button → "Request Spare Part" page · choose type: **Spare Part** (Brand→Product(skippable)→Spare Part) or **product** (Brand→Product) · Brand grid + search · item cards with a cart button · Cart slide-out: qty stepper (−/＋), remove (trash), BILLING INFO (Bill To✱ / Billing Address), SHIPPING INFO (Ship To✱ / Ship By✱ dropdown / Shipping Address), Title (editable), Total price, **Submit Order** |
| 3 | **Update Order Detail** | Status "Create Order" (pre-submit): edit Bill/Shipping inline + Save, edit Order Items (pencil), edit Title · post-submit: Bill/Items pencils **disappear (locked)**, only Title + Comment remain editable |
| 4 | **Update Order Workflow + Event Notification** | Advance button (bottom-right = next step name) · PIC per step (actor + "..." reveals names + Hide) · SLA badge (e.g. `2h 3m`, `47s`) + `Overdue` (red) · completed step shows timestamp+actor · Event Notification (real-time notify to related accounts) |
| 5 | **Cancel Order** | Cancel button (yellow, bottom-left) · seen in Create Order **and** Request Approved status |
| 6 | **View Table List, Search & Filter** | Toggle **List (table)** ↔ **Grid (cards)** · table cols: ORDER · DETAIL · BILL TO · SHIP TO · ITEMS · STATUS · CREATED · REQUEST BY · Search box "Search request ID or part..." + Search button + Clear Filters |

### 0.3 Workflow (Order Status) — 9 steps (confirmed by PO)
PO confirmed the live STG flow has **9 steps**:

| # | STG UI label (TH) | English gloss | Status code |
|---|---|---|---|
| 1 | คำสั่งซื้อ | Create Order | OS000 |
| 2 | ส่งคำขอ | Request | OS001 |
| 3 | ได้รับการอนุมัติ | Request Approved | OS003 |
| 4 | กำลังหยิบสินค้า | Picking | OS004 |
| 5 | กำลังแพ็คสินค้า | Packing | OS005 |
| 6 | ส่งออกจากคลัง | Dispatched | OS006 |
| 7 | กำลังจัดส่ง | Out for Delivery | OS007 |
| 8 | ส่งถึงแล้ว | Delivered | OS008 |
| 9 | เสร็จสิ้น | Complete | OS009 |

Side / terminal statuses (from PO status map): OS002 Technical Approved · OS011 Returned · OS010 Order Cancelled · OS999 Order Updated.

> ✅ **HA-1 resolved:** the BRD (8) vs Grooming (7) discrepancy is superseded — the live STG workflow = **9 steps** above (Workflow name: `SparePart`).

### 0.4 Ship By carrier list (real)
Thailand Post · Kerry Express · Flash Express · J&T Express · DHL Express · SCG Express (and more — scrollable)

### 0.5 Observations / confirmed bugs
- 🔴 **Search does not filter** — searching by part name `iPhone` and by exact Order ID `ORD260609-00001` both return the **full unchanged list**. PO confirms Search **should** filter by Order ID + product name → **BUG** (ORD-Q7 / TA-05).
- 🟠 **Cancel still appears at the "ได้รับการอนุมัติ" (Approved) step** although Cancel is only allowed before Approved. PO confirms this is a **BUG** (should be hidden/blocked) → ORD-Q5 / TA-03_TC-02.
- 🟠 **No separate filter** (e.g. by status) — only a Search box exists. PO confirms there is **no separate filter this round** (ORD-Q8) — no filter TC added.

---

## 1. Business Conditions

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| **ORD-A1** | Add Order supports 2 item types: Spare Part (Brand→Product→Spare Part) and Product (Brand→Product) | Use Case | Can't split into ranges — must enumerate every selection path |
| **ORD-A2** | Selecting an item adds it to the Cart · adjust quantity with a stepper, minimum = 1 | BVA | Quantity is numeric — test the boundary (0/1/2) |
| **ORD-A3** | Submit requires Bill To, Ship To, Ship By (mandatory) all filled before it is clickable | EP | Complete vs missing — 2 outcome groups |
| **ORD-A4** | Ship By is selected from the carrier master list | Use Case | Enumerate the real carrier options |
| **ORD-A5** | Successful Submit → creates an Order in initial status "Create Order" + Order No `ORDyymmdd-#####` | State Transition | Initial state of the lifecycle |
| **ORD-A6** | A brand with no items → "No results found." cannot proceed | EP | Has items vs none |
| **ORD-B1** | Detail page shows header / Title / Bill card / Order Items / Operating Procedure / Print | Use Case | Verify page elements |
| **ORD-B2** | Order Item shows a stock badge: In Stock vs Out of Stock | EP | 2 stock groups |
| **ORD-B3** | Chat/Comment: can add a comment · empty = "No Comment" | Use Case | Records conversation on the order |
| **ORD-C1** | Status Create Order: Bill/Shipping editable inline + Save | EP | Editable state |
| **ORD-C2** | Status Create Order: Order Items (qty/lines) editable | EP | Editable state (item) |
| **ORD-C3** | Title editable in every status | EP | Constant across states |
| **ORD-C4** | After Submit (Request onward): Bill & Items locked (no pencil), only Title + Comment | State Transition | Locking by status |
| **ORD-D1** | 9-step workflow in order · Advance → moves to next step + records actor/time | State Transition | Main lifecycle |
| **ORD-D2** | PIC-per-step: only a user in that step's PIC list sees the action button (otherwise the button is hidden) | EP | Is PIC vs not |
| **ORD-D3** | SLA per step — exceeding the time → `Overdue` badge (red) | BVA | Time — SLA boundary |
| **ORD-D4** | A workflow action → notifies related accounts (Event Notification) | Use Case | Real-time notify |
| **ORD-E1** | Cancel before Approved → order enters terminal status "Cancel" | State Transition | Cancellation path |
| **ORD-E2** | Cancel after/at Approved — should be blocked (button seen at Approved = bug) | EP | Before vs after approve |
| **ORD-F1** | Toggle List (table) ↔ Grid (cards) shows the same order set | EP | 2 views |
| **ORD-F2** | Table has all columns (Order/Detail/Bill To/Ship To/Items/Status/Created/Request By) | Use Case | Verify columns |
| **ORD-F3** | Search by Order ID → filters to matching rows | EP | match vs no-match (🔴 bug found) |
| **ORD-F4** | Search by part name → filters to rows with that item | EP | match vs no-match (🔴 bug found) |
| **ORD-F5** | Clear Filters → returns the full list | EP | reset |

---

## 2. Test Cases (condensed — full detail in xlsx / Lark Base)

> AAA: Arrange = pre-setup · Act = 1 action + Real Example Data · Assert = specific Expected
> `[BUG]` = expected to fail due to a confirmed bug · `[PO ORD-Qn]` = resolved by PO answer

### R-A — Add Order
| TC ID | Arrange | Act | Tested | Expected | Type |
|---|---|---|---|---|---|
| TS-01_TC-01 | Logged in as PIC of the "คำสั่งซื้อ" step · brand Xiaomi + product "Synthetic Engine Oil 5W-30" | Tap Add → tab **product** → select brand **Xiaomi** → tap cart on "Synthetic Engine Oil 5W-30" | ORD-A1 | **View Cart** button appears bottom-right, badge = **1** · item added to cart | POSITIVE |
| TS-01_TC-02 | Cart has 1 item | In Cart tap **＋** until quantity = **2** | ORD-A2 | QUANTITY = `2` · Total price = price ×2 | POSITIVE |
| TA-02_TC-01 | Cart has 1 item, qty 1 | In Cart tap **−** | ORD-A2 (lower bound) | Stays at **1** (− disabled at 1; remove only via trash). No max cap; not bound to stock `[PO ORD-Q2]` | NEGATIVE |
| TS-01_TC-03 | Cart has item · BILLING/SHIPPING INFO expanded | Fill Bill To `บริษัท สยามทีวี เซอร์วิส จำกัด`, Ship To `คุณสมหญิง รักดี 081-234-5678`, Ship By `Kerry Express` | ORD-A3 | **Submit 1 Order** becomes enabled | POSITIVE |
| TA-01_TC-01 | Cart has item · Ship By blank (only Bill To, Ship To filled) | Tap Submit | ORD-A3 | Cannot submit / error on **Ship By** field, message `""` | NEGATIVE |
| TS-01_TC-04 | Bill To/Ship To/Ship By all filled | Tap **Submit 1 Order** | ORD-A5 | New order, status **Create Order** · Order No `ORD260614-#####` appears in list · success toast **"สร้าง คำสั่งซื้อ เรียบร้อยแล้ว"** | POSITIVE |
| TS-04_TC-01 | tab **Spare Part** | Select brand → tap **Skip** at Product → select Spare Part | ORD-A1 | Spare Part step opens without selecting a Product | POSITIVE |
| TA-04_TC-01 | tab Spare Part | Select brand **Toyota** (no parts) | ORD-A6 | Shows **"No results found."** · cannot proceed to Spare Part | NEGATIVE |

### R-B — View Order
| TC ID | Arrange | Act | Tested | Expected | Type |
|---|---|---|---|---|---|
| TS-02_TC-01 | **API seed**: `seedOrder(SEED_ORDER_OOS)` — Create Order with "iPhone 17 Pro Screen" item (potentially OOS in QA env) | Open order detail via seeded orderId | ORD-B1 | Shows Order No + status badge + date + requester + **Print** + Bill card + Order Items + Operating Procedure | POSITIVE |
| TS-02_TC-02 | same seeded order as TC-01 (iPhone 17 Pro Screen item) · **ENV_DEPENDENT**: OOS badge shows only if product stock = 0 in QA | View Order Items | ORD-B2 | Item "iPhone 17 Pro Screen" shows **Out of Stock** badge (red) | POSITIVE |
| TS-02_TC-03 | same seeded order as TC-01 (fresh = no comments yet) | Open the Chat box | ORD-B3 | Box shows **"No Comment"** + Comment field + Comment button | POSITIVE |
| TS-02_TC-04 | same seeded order open from TC-03 | Type `รบกวนเร่งจัดส่งภายในวันนี้ครับ` → tap **Comment** | ORD-B3 | Comment appears (replacing "No Comment") with author + time | POSITIVE |

### R-C — Update Order Detail
| TC ID | Arrange | Act | Tested | Expected | Type |
|---|---|---|---|---|---|
| TS-03_TC-01 | **API seed**: `seedOrder(SEED_ORDER)` — Create Order state (OS000), open via seeded orderId | Pencil on Bill → change Ship By to `Flash Express` → **Save** | ORD-C1 | Bill card shows Ship By = `Flash Express` (saved) · success toast **"อัปเดต คำสั่งซื้อ เรียบร้อยแล้ว"** | POSITIVE |
| TS-03_TC-02 | same seeded order as TC-01 (Create Order state) | Pencil on **ORDER ITEMS** → change qty to 5 | ORD-C2 | Order Item shows **Quantity 5 item** · success toast **"อัปเดต คำสั่งซื้อ เรียบร้อยแล้ว"** | POSITIVE |
| TS-03_TC-03 | same seeded order as TC-01 | Pencil on Title → change to `เบิกอะไหล่งานซ่อมจอ iPhone — Job #4821` | ORD-C3 | Title tag updates to `เบิกอะไหล่งานซ่อมจอ iPhone — Job #4821` · success toast **"อัปเดต คำสั่งซื้อ เรียบร้อยแล้ว"** | POSITIVE |
| TA-03_TC-01 | **API seed**: `seedOrder(SEED_ORDER)` → `advanceOrder(OS001)` → `advanceOrder(OS003)` — seed to Request Approved state; no pre-existing order | Open detail via seeded orderId | ORD-C4 | **No pencil** on Bill card or ORDER ITEMS (locked) · Title pencil still present | NEGATIVE |

### R-D — Workflow / Status
| TC ID | Arrange | Act | Tested | Expected | Type |
|---|---|---|---|---|---|
| TS-01_TC-05 | order Create Order · logged in as PIC of "ส่งคำขอ" | Tap Advance **"ส่งคำขอ"** | ORD-D1 | "คำสั่งซื้อ" gets ✓ + timestamp+actor · current step → "ส่งคำขอ" · status badge updates · ไม่มี toast (STG ยังไม่แสดง Toast สำหรับ state transition) | POSITIVE |
| TS-01_TC-06 | current step = "ส่งคำขอ" · logged in as approval PIC (Warehouse Approver / Manager) | Tap Advance **"ได้รับการอนุมัติ"** | ORD-D1 | current step → "ได้รับการอนุมัติ" (Request Approved, OS003) · prev step ✓ · ไม่มี toast (STG ยังไม่แสดง Toast) | POSITIVE |
| TS-01_TC-07 | current step = "ได้รับการอนุมัติ" · logged in as PIC | Tap Advance **"กำลังหยิบสินค้า"** | ORD-D1 | current step → "กำลังหยิบสินค้า" (Picking, OS004) · ไม่มี toast (STG ยังไม่แสดง Toast) | POSITIVE |
| TS-01_TC-08 | current step = "กำลังหยิบสินค้า" · logged in as PIC | Tap Advance **"กำลังแพ็คสินค้า"** | ORD-D1 | current step → "กำลังแพ็คสินค้า" (Packing, OS005) · prev step ✓ · ไม่มี toast (STG ยังไม่แสดง Toast) | POSITIVE |
| TS-01_TC-09 | current step = "กำลังแพ็คสินค้า" · logged in as PIC | Tap Advance **"ส่งออกจากคลัง"** | ORD-D1 | current step → "ส่งออกจากคลัง" (Dispatched, OS006) · prev step ✓ · ไม่มี toast (STG ยังไม่แสดง Toast) | POSITIVE |
| TS-01_TC-10 | current step = "ส่งออกจากคลัง" · logged in as PIC | Tap Advance **"กำลังจัดส่ง"** | ORD-D1 | current step → "กำลังจัดส่ง" (Out for Delivery, OS007) · prev step ✓ · ไม่มี toast (STG ยังไม่แสดง Toast) | POSITIVE |
| TS-01_TC-11 | current step = "กำลังจัดส่ง" · logged in as PIC | Tap Advance **"ส่งถึงแล้ว"** | ORD-D1 | current step → "ส่งถึงแล้ว" (Delivered, OS008) · prev step ✓ · ไม่มี toast (STG ยังไม่แสดง Toast) | POSITIVE |
| TS-01_TC-12 | current step = "ส่งถึงแล้ว" · logged in as PIC | Tap Advance **"เสร็จสิ้น"** | ORD-D1 | order reaches final step "เสร็จสิ้น" (Complete, OS009) · all 9 steps ✓ · terminal success · ไม่มี toast (STG ยังไม่แสดง Toast) | POSITIVE |
| TA-06_TC-01 | **API seed**: `seedOrder(SEED_ORDER)` — fresh order; login with non-PIC account (needs `ORD_NON_PIC_USERNAME` + `ORD_NON_PIC_PASSWORD` env) (PIC roles = Warehouse Approver / Manager) | Open the seeded order detail | ORD-D2 | The step's Advance button **does not appear** `[PO ORD-Q3]` | NEGATIVE |
| TS-02_TC-07 | **ENV_DEPENDENT**: order at OS003 (ได้รับการอนุมัติ) idle > 61 min — set `ORD_OVERDUE_ID` env var to a known overdue order; TC skipped if not set (cannot seed + wait 61 min in CI) | View Operating Procedure | ORD-D3 | Current step shows **`Overdue`** badge (red); SLA for this step = 61 min `[PO ORD-Q4]` | POSITIVE |
| TS-01_TC-13 | order with requester + next-step PIC | PIC taps Advance | ORD-D4 | Related accounts (requester + next PIC) get real-time in-app bell: `{actor} ส่งถึงคุณ {Status} :: {Order ID}` `[PO ORD-Q6]` | POSITIVE |

### R-E — Cancel Order
| TC ID | Arrange | Act | Tested | Expected | Type |
|---|---|---|---|---|---|
| TA-02_TC-02 | **API seed**: `seedOrder(SEED_ORDER)` — Create Order state (OS000, before Approved) | Tap **Cancel** → confirm | ORD-E1 | Dialog `"ยืนยันการยกเลิกคำสั่งซื้อ ___ ?"` + Confirm/Cancel · after confirm → status **Cancel** (terminal) · success toast **"ลบ คำสั่งซื้อ เรียบร้อยแล้ว"** · if already Picked, stock is returned `[PO ORD-Q9]` | NEGATIVE |
| TA-03_TC-02 | same seeded order as TA-03_TC-01 (at OS003) | Check whether Cancel is present | ORD-E2 | Cancel **should be hidden/blocked** after Approved; it currently still appears → **BUG**, expected to FAIL `[BUG] [PO ORD-Q5]` | NEGATIVE |

### R-F — Table List / Search / Filter
| TC ID | Arrange | Act | Tested | Expected | Type |
|---|---|---|---|---|---|
| TS-02_TC-06 | orders in list · List view | Toggle to **Grid** | ORD-F1 | Orders render as cards (Order No · status · Title · requester · "X Items · Y Total Qty" · date), same set as table | POSITIVE |
| TS-02_TC-07 | List view | Inspect table header | ORD-F2 | All columns: ORDER · DETAIL · BILL TO · SHIP TO · ITEMS · STATUS · CREATED · REQUEST BY | POSITIVE |
| TA-05_TC-01 | **API seed**: 2 orders (`seedOrder(SEED_ORDER)` + `seedOrder(SEED_ORDER_OOS)`) — use seeded orderId (not hard-coded pre-existing ID) | Type seeded orderId in Search → tap Search | ORD-F3 | **Expected:** list filters to matching row. **Actual: returns all orders (no filter)** → `[BUG] [PO ORD-Q7]` | NEGATIVE |
| TA-05_TC-02 | same seeded orders from TC-01 (SEED_ORDER_OOS has iPhone 17 Pro Screen) | Type **`iPhone`** → tap Search | ORD-F4 | **Expected:** only orders with iPhone. **Actual: returns all orders** → `[BUG] [PO ORD-Q7]` | NEGATIVE |
| TS-02_TC-08 | search active via seeded orderId (from TS-02_TC-03 seed) | Tap **Clear Filters** | ORD-F5 | List returns to all orders · search box cleared (no separate status filter this round `[PO ORD-Q8]`) | POSITIVE |

---

## 3. Test Scenarios (E2E Flows)

### ✅ Success

**ORD_TS01 — Create → Submit → walk the full 9-step Workflow to เสร็จสิ้น (Complete)**
1. TS-01_TC-01  Add item to cart (ORD-A1)
2. TS-01_TC-02  Set quantity = 2 (ORD-A2)
3. TS-01_TC-03  Fill Bill/Ship → Submit enabled (ORD-A3)
4. TS-01_TC-04  Submit → order "Create Order" + Order No (ORD-A5)
5. TS-01_TC-05  Advance "ส่งคำขอ" (ORD-D1)
6. TS-01_TC-06  Advance "ได้รับการอนุมัติ" (ORD-D1)
7. TS-01_TC-07  Advance "กำลังหยิบสินค้า" (ORD-D1)
8. TS-01_TC-08  Advance "กำลังแพ็คสินค้า" (ORD-D1)
9. TS-01_TC-09  Advance "ส่งออกจากคลัง" (ORD-D1)
10. TS-01_TC-10  Advance "กำลังจัดส่ง" (ORD-D1)
11. TS-01_TC-11  Advance "ส่งถึงแล้ว" (ORD-D1)
12. TS-01_TC-12  Advance "เสร็จสิ้น" → terminal Complete (ORD-D1)
13. TS-01_TC-13  Event Notification to related accounts (ORD-D4)
→ **Expected:** the order walks all 9 workflow steps end-to-end from คำสั่งซื้อ to เสร็จสิ้น, recording actor/time/SLA at every step

**ORD_TS02 — View / List / Detail (read paths)**
1. TS-02_TC-06  Toggle Grid view (ORD-F1)
2. TS-02_TC-07  Verify table columns (ORD-F2)
3. TS-02_TC-01  Open detail, all elements shown (ORD-B1)
4. TS-02_TC-02  Out of Stock badge (ORD-B2)
5. TS-02_TC-03  Chat empty = "No Comment" (ORD-B3)
6. TS-02_TC-04  Add a comment (ORD-B3)
7. TS-02_TC-05  Current step Overdue badge (ORD-D3)
8. TS-02_TC-08  Clear Filters restores full list (ORD-F5)
→ **Expected:** view/search/read the order with all elements present

**ORD_TS03 — Update Order Detail (pre-submit)**
1. TS-03_TC-01  Edit Bill/Ship + Save (ORD-C1)
2. TS-03_TC-02  Edit Order Item quantity (ORD-C2)
3. TS-03_TC-03  Edit Title (ORD-C3)
→ **Expected:** can edit all details while in Create Order status

**ORD_TS04 — Add via Spare Part path (skip product)**
1. TS-04_TC-01  Select brand → Skip product → select Spare Part (ORD-A1)
2. TS-01_TC-03  Fill Bill/Ship (ORD-A3)
3. TS-01_TC-04  Submit (ORD-A5)
→ **Expected:** create an order from a spare part while skipping the product step

### ⚠️ Alternative (Unsuccessful)

**ORD_TA01 — Submit blocked by missing required fields**
1. TS-01_TC-01 Add item → 2. TA-01_TC-01 leave Ship By blank → Submit
→ **Expected:** Submit cannot proceed · Ship By field error

**ORD_TA02 — Cancel before Approved + quantity boundary**
1. TA-02_TC-01 − button at quantity 1 (lower bound) `[PO ORD-Q2]`
2. TA-02_TC-02 Cancel order in Create Order → status Cancel (ORD-E1) `[PO ORD-Q9]`
→ **Expected:** can cancel an order before approval

**ORD_TA03 — Edit locked after Submit + Cancel after Approved (BUG)**
1. TA-03_TC-01 Bill/Items have no pencil (ORD-C4)
2. TA-03_TC-02 Cancel button at the Approved step (ORD-E2) `[BUG] [PO ORD-Q5]`
→ **Expected:** after submit Bill/Items can't be edited · Cancel must be blocked after Approved (currently still shown = bug)

**ORD_TA04 — Brand with no items**
1. TA-04_TC-01 brand Toyota (spare part) → "No results found."
→ **Expected:** cannot proceed when there are no items

**ORD_TA05 — Search does not filter (Bug)**
1. TA-05_TC-01 Search Order ID → returns all orders `[BUG]`
2. TA-05_TC-02 Search part name → returns all orders `[BUG]`
→ **Expected (by design):** filter on the search term — **Actual: no filtering** → open a defect `[PO ORD-Q7]`

**ORD_TA06 — PIC gating**
1. TA-06_TC-01 non-PIC user → Advance button hidden (ORD-D2) `[PO ORD-Q3]`
→ **Expected:** a non-PIC user cannot action the step

---

## 4. Hidden Assumptions — RESOLVED by PO (2026-06-19)
All 9 questions in `po-question.json` were answered by PO in the Lark PO table:

| # | Topic | PO answer (applied) |
|---|---|---|
| **HA-1** ORD-Q1 | Workflow count/order | **9 steps** confirmed (live STG, workflow name `SparePart`): คำสั่งซื้อ → ส่งคำขอ → ได้รับการอนุมัติ → กำลังหยิบสินค้า → กำลังแพ็คสินค้า → ส่งออกจากคลัง → กำลังจัดส่ง → ส่งถึงแล้ว → เสร็จสิ้น |
| **HA-2** ORD-Q2 | Cart quantity bounds | min = **1** (− disabled at 1, remove via trash) · **no max** · **not bound to stock** (can order above stock → shows Out of Stock) |
| **HA-3** ORD-Q3 | PIC/Role for Advance | Advance button only for users in the step's PIC list (non-PIC = hidden) · roles: **Warehouse Approver, Manager** |
| **HA-4** ORD-Q4 | SLA per step | Each step has an SLA in minutes; overdue → red `Overdue` badge · sample: step **"ได้รับการอนุมัติ" = 61 minutes** |
| **HA-5** ORD-Q5 | Cancel after Approved | Cancel allowed **only before Approved** → button still visible at the Approved step = **BUG** (should be hidden/blocked) → add negative TC |
| **HA-6** ORD-Q6 | Event Notification | On any workflow action, notify **all related accounts** (requester + next-step PIC) real-time **in-app bell** · text: `{actor} ส่งถึงคุณ {Status Name} :: {Order ID}` (e.g. `apiwat.rod ส่งถึงคุณ ส่งคำขอ :: ORD260610-00003`) |
| **HA-7** ORD-Q7 | Search filtering | Search **should** filter the list by Order ID and product/part name (per placeholder) → currently returns all = **BUG** (TA-05 expected to fail) |
| **HA-8** ORD-Q8 | Separate filter | **No** separate status/date filter this round — only Search box + List/Grid toggle → no filter TC |
| **HA-9** ORD-Q9 | Cancel confirm + stock | Cancel shows a confirmation dialog `"ยืนยันการยกเลิกคำสั่งซื้อ ___ ?"` (Confirm/Cancel) · cancelled → status **Cancel** (terminal, immutable) · if already Picked → **return stock** |

> ✅ No remaining blockers. Two confirmed bugs to file: **Search not filtering** (ORD-Q7 / TA-05) and **Cancel visible after Approved** (ORD-Q5 / TA-03_TC-02).

---

## 5. Definition of Done — Self-check
| Item | Status |
|---|---|
| Needs → Business Conditions itemized | ✅ 23 conditions (ORD-A1..F5) |
| Right technique per condition | ✅ EP/BVA/State Transition/Use Case covered |
| BVA numeric/time, less/equal/greater | ✅ qty min (TA-02_TC-01); SLA boundary at 61 min (TS-02_TC-05) |
| State Transition complete (reverse/self-loop/system actor) | ✅ 9-step workflow + Cancel terminal + SLA (system actor=Overdue); self-loop=comment |
| Every TC has all 4 parts (Arrange/Act/Tested/Expected) | ✅ — all Arrange updated to API seed (no pre-existing data) 2026-06-29 |
| Has Success + Alternative | ✅ 4 Success + 6 Alternative |
| No contradictory conditions in a scenario | ✅ |
| Test Data is Real Example (no Test/placeholder) | ✅ real names/brands/carriers |
| Hidden Assumptions raised + answered by PO | ✅ 9/9 resolved (§4) |
| IDs tagged + cases marked | ✅ |

**Blocked on HA:** none — all 9 resolved by PO (2026-06-19).
