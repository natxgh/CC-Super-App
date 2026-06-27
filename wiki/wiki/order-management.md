# Order Management (ORD)

Feature: Spare Part / Item Requisition System · Module 08
CMS Path: `/cms/inventory/request` (UI title: "Order" / "Request Spare Part")
Prefix: `ORD`

## 6 Sub-Features
1. **View Order** — header, title, bill card, chat box, order items, operating procedure
2. **Add Order** — choose type (Spare Part or Product), cart, billing/shipping info, submit
3. **Update Order Detail** — edit pre-submit; locked post-submit
4. **Update Order Workflow + Event Notification** — 9-step workflow, PIC gating, SLA, notifications
5. **Cancel Order** — pre-Approved only
6. **View Table List, Search & Filter** — List/Grid toggle, search box, Clear Filters

## Order Workflow — 9 Steps (Confirmed PO HA-1)
Workflow name: `SparePart`

| # | Thai Label | English | Status Code |
|---|-----------|---------|------------|
| 1 | คำสั่งซื้อ | Create Order | OS000 |
| 2 | ส่งคำขอ | Request | OS001 |
| 3 | ได้รับการอนุมัติ | Request Approved | OS003 |
| 4 | กำลังหยิบสินค้า | Picking | OS004 |
| 5 | กำลังแพ็คสินค้า | Packing | OS005 |
| 6 | ส่งออกจากคลัง | Dispatched | OS006 |
| 7 | กำลังจัดส่ง | Out for Delivery | OS007 |
| 8 | ส่งถึงแล้ว | Delivered | OS008 |
| 9 | เสร็จสิ้น | Complete | OS009 |

Terminal: OS002 Technical Approved · OS010 Order Cancelled · OS011 Returned

## Add Order Rules
- **2 item types**: Spare Part (Brand → Product (skippable) → Spare Part) or Product (Brand → Product)
- Cart quantity: min = 1 (− disabled at 1; remove only via trash) · **no max** · **not bound to stock**
- Can order above current stock (shows Out of Stock badge on item)
- **Required to Submit**: Bill To\* / Ship To\* / Ship By\* (carrier)
- Ship By carrier list: Thailand Post / Kerry Express / Flash Express / J&T Express / DHL Express / SCG Express

## Update Rules
| Status | Editable |
|--------|---------|
| Create Order (OS000) | Bill/Shipping inline + Save · Order Items qty/lines · Title |
| After Submit (Request+) | Bill & Items **locked** (pencil disappears) · Title + Comment only |

## Cancel Rules
- Allowed **only before Approved** (OS003)
- Cancel shows confirm dialog: *"ยืนยันการยกเลิกคำสั่งซื้อ ___ ?"*
- After cancel → status **OS010 Cancel** (terminal, immutable)
- If already Picked → **stock returned**

## PIC Gating
- Advance button shows **only** for users in that step's PIC list
- Non-PIC = Advance button hidden
- Roles for Approve step: Warehouse Approver / Manager

## SLA
- Each step has SLA in minutes; exceeding → red **`Overdue`** badge
- Example: "ได้รับการอนุมัติ" step = 61 minutes

## Event Notification
- On any workflow action → real-time in-app bell to all related accounts (requester + next PIC)
- Text: `{actor} ส่งถึงคุณ {Status Name} :: {Order ID}`

## Order Number Format
- `ORDyymmdd-#####` (e.g. `ORD260614-00001`)

## Toast Messages
| Action | Toast TH |
|--------|---------|
| Create | **"สร้าง คำสั่งซื้อ เรียบร้อยแล้ว"** |
| Update | **"อัปเดต คำสั่งซื้อ เรียบร้อยแล้ว"** |
| Cancel | **"ลบ คำสั่งซื้อ เรียบร้อยแล้ว"** |
| Workflow advance | ไม่มี toast (STG ยังไม่แสดง) |

## View / Search
- Toggle: **List (table)** ↔ **Grid (cards)**
- Table columns: ORDER / DETAIL / BILL TO / SHIP TO / ITEMS / STATUS / CREATED / REQUEST BY
- Search box: by Order ID + product/part name
- Clear Filters restores full list
- No separate status filter this round (PO Q8)

## Known Bugs (Confirmed)
| Bug | Detail |
|-----|--------|
| **Search not filtering** | Searching Order ID or part name returns full unchanged list (ORD-Q7 / TA-05) |
| **Cancel after Approved** | Cancel button still visible at "ได้รับการอนุมัติ" step — should be hidden/blocked (ORD-Q5 / TA-03_TC-02) |

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| ORD_TS01 | Create → Submit → 9-step workflow to Complete | ✅ |
| ORD_TS02 | View / List / Detail (read paths) | ✅ |
| ORD_TS03 | Update Order Detail (pre-submit) | ✅ |
| ORD_TS04 | Add via Spare Part path (skip product) | ✅ |
| ORD_TA01 | Submit blocked by missing required fields | ❌ |
| ORD_TA02 | Cancel before Approved + qty lower bound | ❌ |
| ORD_TA03 | Edit locked after Submit + Cancel-after-Approved BUG | ❌ |
| ORD_TA04 | Brand with no items → "No results found." | ❌ |
| ORD_TA05 | Search not filtering (BUG) | ❌ |
| ORD_TA06 | Non-PIC user → Advance button hidden | ❌ |

## Related Pages
- [Product & Inventory](product-inventory.md)
- [Spare Parts](spare-parts.md)
- [Product Stock](product-stock.md)
- [CC Super App Overview](cc-super-app-overview.md)
