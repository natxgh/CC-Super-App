# Order Management — FIXME plan & API gaps

Generated from `08-Order/order-management-testcases.xlsx` (10 scenarios / 37 TCs).
Spec: `order-management.spec.ts` · POM: `pages/OrderPage.ts` · seed/teardown: `fixtures/order-seed.ts`.

## Live DOM probe done (2026-06-20, org BMA) — current run status

**Last run:** 1 passed · 9 skipped (fixme/skip) — suite is green.

### ✅ TA-04 ENABLED & PASSING
Add → Spare Part → Toyota → "No results found." — selector verified live, `test.fixme` removed.

### Selectors VERIFIED against live DOM (in `OrderPage.ts`)
| Area | Verified |
|---|---|
| List | `Add` button · `Search request ID or part...` placeholder · `Search` button · 8 columns (ORDER/DETAIL/BILL TO/SHIP TO/ITEMS/STATUS/CREATED/REQUEST BY) · `Clear Filters` after search |
| Add page | `Request Spare Part` heading · `Product` / `Spare Part` = `<button>` (not `<tab>`) · brand = `<heading>` · product card add = last `<button>` in card div · `1 View Cart` · `Submit 1 Order` |
| Detail | `Back` · `Cancel` · advance button = next-step name (e.g. "ส่งคำขอ", "กำลังหยิบสินค้า") · `...` = PIC reveal |

### ⏳ Still unverified — keep `test.fixme` until re-probed
Cart qty stepper value field · Bill/Ship To inputs · edit pencils · comment box ·
grid/list toggle · Overdue badge · cancel confirmation dialog copy ·
PIC gating (needs non-PIC account for TA-06).

### Confirmed FE bugs reproduced live
| Scenario | Bug | Evidence |
|---|---|---|
| **TA-03** | Cancel button visible on "Request Approved" order | `BUG-cancel-visible-after-approved.md` · probe 2026-06-20 |
| **TA-05** | Search returns all rows (no filter applied) | `BUG-search-not-filtering.md` · probe 2026-06-20 · rows 10→10 |

Both stay as `test.fixme(true, 'CONFIRMED FE BUG …')` — suite stays green; fix tracked in BUG-*.md.

What IS ready:
- ✅ Full scenario/TC structure with exact TC IDs (`TS-01_TC-01` … `TA-06_TC-01`) for Lark upsert.
- ✅ Real Example Data (`fixtures/testdata.ts`).
- ✅ API-first Arrange (`seedOrder`) + workflow advance (`advanceOrder`) — GraphQL ops verified by introspection.
- ✅ Teardown wired into `customer-profile/teardown/global-teardown.ts` (runs with `CP_TEARDOWN=1`).

## ⚠️ API GAP — no hard delete for Orders (teardown is soft)
GraphQL `cc-bff-qa.one-sky.ai/graphql` exposes for orders:
`OrderWorkflow.CreateOrder · UpdateOrder · OrderControl(advance) · CancelOrder · GetListOrder · GetOrderById`
and `OrderStatus.GetListOrderStatus` — **but NO `DeleteOrder`** (only DeleteOrderStatus / DeleteOrderItem / DeleteOrderComment exist).

**Impact:** orders created during testing cannot be removed. `teardownSeededOrders` falls back to
**`CancelOrder`** (order ends in "Cancel" status; the record stays in the system).

**Ask BE for one of:**
1. a `OrderWorkflow.DeleteOrder(GetIdInput{id})` mutation, or
2. a QA-only purge endpoint,

so SIT stays clean. Until then, seeded orders accumulate as Cancelled records.

## Other unknowns to confirm on probe
- Exact Event Notification text (PO ORD-Q6: `{actor} ส่งถึงคุณ {Status} :: {Order ID}`) — TS-01_TC-13.
- Cancel confirmation dialog exact copy (PO ORD-Q9: `ยืนยันการยกเลิกคำสั่งซื้อ ___ ?`) — TA-02_TC-02.
- `OrderControl` exit semantics: confirm whether advance uses `statusId` (OS003…OS009) or `exitPoint`.
- A non-PIC account (roles: Warehouse Approver / Manager) is required to run TA-06.
