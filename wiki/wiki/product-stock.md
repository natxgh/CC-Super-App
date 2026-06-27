# Product Stock Management (PS)

Feature: Unit Registry (Serial No.) + Low Stock Notification · Module 05
CMS Path: `/cms/products/stock`
Prefix: `PS`

## Scope (PO Q1)
1. **Part A — Add Product Stock**: create a unit per Serial No. in the unit registry
2. **Part B — Low Product Stock Notification**: qty-based alerts (badge + bell) on `/cms/products` and `/cms/inventory`

## RBAC
| Role | Can See Add Button |
|------|--------------------|
| Warehouse Staff | ✅ |
| Admin | ✅ |
| Agent | ❌ (button not rendered) |

## Add Product Stock Form Fields
| Field | Required | Rule |
|-------|----------|------|
| Serial No. | ✅ | Alphanumeric + dash only · no spaces/special chars · max 100 chars · unique system-wide |
| Product | ✅ | From master dropdown (no free-text) |
| Store | ✅ | From master dropdown (no free-text) |
| Registered Date | ✅ | — |
| Manufacturing Warranty | Optional | Must be ≥ Registered Date (before = invalid, **equal = valid**) |

## Serial No. BVA (max 100 chars)
| Length | Expected |
|--------|----------|
| 99 chars | ✅ Valid (below max) |
| 100 chars | ✅ Valid (at max boundary) |
| 101 chars | ❌ Invalid (exceeds max) |

## Default Status on Create
- New unit default Status = **R001 (New)**
- Status codes: R001 New / R002 Available / R003 Reserved / R004 Confirmed / R005 Paid / R006 Shipped / R007 Delivered / R008 Cancelled / R009 Expired / R010 Returned

## Stock Thresholds (BVA — configurable per company)
| Qty | Badge | Color |
|-----|-------|-------|
| 0 | **Out of Stock (0)** | Red |
| 1–5 | **Low Stock (n)** | Orange |
| >5 | **In Stock** | Normal |

Badge appears on: `/cms/products` and `/cms/inventory` (Spare Parts) pages
Product Stock page (`/cms/products/stock`) = **no qty badge**

## Stock Lifecycle (State Transition)
```
In Stock (qty >5)
    │ qty drops to 5
    ▼
Low Stock (qty 1–5) ──── self-loop Low→Low: NO duplicate notification
    │ qty drops to 0
    ▼
Out of Stock (qty 0)
    │ restock
    ▼
In Stock (qty >5) ── badge removed
```
- Actor: System
- Self-loop Low→Low: **ไม่** สร้าง notification ซ้ำ

## Notification Bell
- Realtime notification เมื่อ In→Low หรือ Low→Out
- Bell panel filterable by type (Low Stock / All Types)

## Toast Messages (Confirmed)
| Action | Toast EN |
|--------|----------|
| Create | **"Product Stock created successfully"** |
| Update | **"Product Stock updated successfully"** |
| Delete | **"Product Stock deleted successfully"** |

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| PS_TS01 | Add Product Stock (full, with MW) | ✅ |
| PS_TS02 | Add without MW (optional) | ✅ |
| PS_TS03 | Valid SN format + no duplicate → create | ✅ |
| PS_TS04 | Stock badge at all BVA thresholds | ✅ |
| PS_TS05 | Low Stock notification flow | ✅ |
| PS_TS06 | Out of Stock + restock recovery | ✅ |
| PS_TS07 | View Stock Detail Modal | ✅ |
| PS_TS08 | Notification type filter | ✅ |
| PS_TS09 | RBAC positive (Warehouse Staff + Admin) | ✅ |
| PS_TS10 | MW = Registered Date (BVA boundary) | ✅ |
| PS_TS11 | SN at 99 and 100 chars (BVA) | ✅ |
| PS_TA01 | Serial No. empty → error | ❌ |
| PS_TA02 | Product/Store/Date empty → errors | ❌ |
| PS_TA03 | Duplicate SN → error | ❌ |
| PS_TA04 | SN with spaces/special chars → invalid | ❌ |
| PS_TA05 | SN 101 chars → error | ❌ |
| PS_TA06 | MW before Registered Date → error | ❌ |
| PS_TA07 | Non-master product/store → cannot select | ❌ |
| PS_TA08 | Agent role → Add button not rendered | ❌ |
| PS_TA09 | Pick zero-stock product → Out of Stock alert ⚠️ known bug | ❌ |

## Known Bug
- **"Research Stock Fail"** — Out of Stock alert เมื่อ Pick สินค้าที่ qty=0 ใน Order pick step

## Related Pages
- [Product & Inventory](product-inventory.md)
- [Spare Parts Stock](spare-parts-stock.md)
- [Order Management](order-management.md)
- [CC Super App Overview](cc-super-app-overview.md)
