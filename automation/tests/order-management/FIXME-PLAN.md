# Order Management — FIXME plan & API gaps

Generated from `08-Order/order-management-testcases.xlsx` (10 scenarios / 37 TCs).
Spec: `order-management.spec.ts` · POM: `pages/OrderPage.ts` · seed/teardown: `fixtures/order-seed.ts`.

## Why everything is `test.fixme` right now
The **Order UI DOM has not been probed**. `OrderPage` selectors are derived from the design's
hands-on notes, not confirmed against the live page. Un-fixme each scenario only **after** a live
DOM probe (login → open `/cms/inventory/request` → snapshot → tighten locators).

What IS ready:
- ✅ Full scenario/TC structure with exact TC IDs (`TS-01_TC-01` … `TA-06_TC-01`) for Lark upsert.
- ✅ Real Example Data (`fixtures/testdata.ts`).
- ✅ API-first Arrange (`seedOrder`) + workflow advance (`advanceOrder`) — GraphQL ops verified by introspection.
- ✅ Teardown wired into `customer-profile/teardown/global-teardown.ts` (runs with `CP_TEARDOWN=1`).

## Confirmed FE bugs encoded (expected to FAIL when enabled)
| Scenario | Bug | Source |
|---|---|---|
| **TA-03_TC-02** | Cancel button still visible after **Approved** (should be hidden/blocked) | PO ORD-Q5 |
| **TA-05_TC-01/02** | Search returns **all** rows (should filter by Order ID / part name) | PO ORD-Q7 |

These assert the **correct** behavior on purpose → red = the real bug. File Meegle cards from the run.

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
