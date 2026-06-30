# Order Management — FIXME plan & API gaps

Generated from `08-Order/order-management-testcases.xlsx` (10 scenarios / 37 TCs).
Spec: `order-management.spec.ts` · POM: `pages/OrderPage.ts` · seed/teardown: `fixtures/order-seed.ts`.

## ⛔ SEED / CREATE BLOCKER (verified live 2026-06-29) — read first

API-first Arrange was re-verified against `cc-bff-qa.one-sky.ai/graphql` with the configured account (`ketwadee`):

1. `CreateOrder` with only `{name}` items → `status -1 "productId or partId required"` → **seed now resolves productId via `GetListProduct`** (fixed in `order-seed.ts`).
2. `CreateOrder` with a valid `productId` → `status -1 "Forbidden"` → **the account is NOT in the `inventory_order_workflow` pic list** (only `apiwat` / `watee.tha` can create). The same backend mutation backs the UI **Submit**, so UI create is blocked too.

**Impact:** every create/seed scenario (TS-01, TS-02 detail, TS-03, TS-04, TA-02 cancel, TA-03, TA-05, TA-06) is **BLOCKED** — Arrange cannot produce an order with the available account. They stay `test.fixme` citing `SEED_BLOCKED` (not faked green). Read-only TA-04 still runs/passes.

**This is NOT a missing API spec** — `CreateOrder`/`OrderControl`/`CancelOrder` are all schema-verified. It is a permission/data gap. To unblock, **one of**:
- BE adds the test account to `inventory_order_workflow` pic list, or
- provide `apiwat` / `watee.tha` credentials (add as `ORD_PIC_USERNAME/PASSWORD`), or
- FE workflow SubType config deploy (Wisarud) that lets the account be assigned.

See memory `order-workflow-config`. Probes: `probe-order-seed-verify.mjs`, `probe-order-resolve-product.mjs`.

## Live DOM probe done (2026-06-20, org BMA) — current run status

**Last run (2026-06-29):** 1 passed (TA-04) · 9 skipped (fixme — SEED_BLOCKED + DOM unverified) — suite is honest-green (no fake pass).

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
