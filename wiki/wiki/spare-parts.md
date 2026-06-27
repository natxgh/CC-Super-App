# Spare Parts Management (SP)

Feature: Spare Parts CRUD + Search/Filter + View Modes · Module 06
CMS Path: `/cms/inventory`
Prefix: `SP`

## Fields (Add/Edit Spare Part)
| Field | Required | Rule |
|-------|----------|------|
| Spare Part Name (TH) | ✅ | — |
| Spare Part Name (EN) | ✅ | — |
| Category | ✅ | — |
| Brand | ✅ | — |
| Year | ✅ | — |
| Warranty (Days) | ✅ | System auto-converts days → months/years for display (e.g. 365 days = 12 Months) |
| Price | ✅ | — |
| Image | Optional | JPG/PNG/GIF · max 3MB |

## Warranty Display Conversion (PO Q6)
- 365 days = 12 Months
- 180 days = 5 Months 27 Days
- Input in Days, displayed as Months/Years

## RBAC (PO Q1)
| Role | Add/Edit/Delete |
|------|-----------------|
| Warehouse Staff | ✅ |
| Admin | ✅ |
| Agent / Staff (porntip) | ❌ Add button not visible (intentional) |

## View Modes (3 modes)
- **List** (first icon, top-right): rows with Part Name, Stock badge, Brand, Category, Year, Price, Warranty badge, Belong to Product, View/Edit buttons
- **Card** (middle icon): large image cards
- **Table** (right-most icon): compact table, columns PART NAME / STOCK / BRAND / CATEGORY / YEAR / PRICE / WARRANTY / BELONG TO PRODUCT / ACTION

## Stock Badge (threshold = 5 — PO Q3)
| Qty | Badge |
|-----|-------|
| 0 | **Out of Stock (0)** (red) |
| 1–5 | **Low Stock (n)** (orange) |
| >5 | **In Stock** |

## Delete Rules (PO Q2 + Q5)
- Requires **Confirmation dialog** (bug: currently missing — deletes immediately)
- Must check: no Spare Part Stock (Serial) AND no relation to Active Order
- If blocked → warning *"cannot DELETE"*, item stays

```
[In List]
    │ Click Delete
    ▼
[Guard: has Serial stock OR Active Order?]
   │ yes → [Blocked, warning]
   │ no
   ▼
[Confirmation Dialog]  ← ⚠️ BUG: currently missing
      │ Confirm → [Deleted]
      │ Cancel  → [In List, unchanged]
```

## Table View — Sort Columns (PO Q7)
- PART NAME / YEAR / PRICE / WARRANTY — each column sortable asc/desc

## Toast Messages
| Action | Toast EN |
|--------|----------|
| Add | **"Spare parts created successfully"** |
| Update | **"Spare parts updated successfully"** |
| Delete | **"Spare Parts deleted successfully"** |

## Test Data (Real STG)
- Mercedes-Benz OM654.920, Mercedes-Benz M112, Battery pack, iPhone 16 Pro Battery
- Brands: Apple, Mercedes Benz, Denso
- New in tests: Denso Air Filter DL-1101

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| SP_TS01 | Search + View Detail | ✅ |
| SP_TS02 | Filter Brand + Switch View + Stock badge | ✅ |
| SP_TS03 | Add new spare part (Warehouse Staff/Admin) | ✅ |
| SP_TS04 | Edit spare part | ✅ |
| SP_TS05 | Delete with confirmation (confirmed required behavior) | ✅ |
| SP_TS06 | Sort Table view columns | ✅ |
| SP_TA01 | Search no match → Reset | ❌ |
| SP_TA02 | Add missing Name EN → validation error | ❌ |
| SP_TA03 | Add missing Price → validation error | ❌ |
| SP_TA04 | Edit clears required field → not saved | ❌ |
| SP_TA05 | Delete → Cancel → item stays | ❌ |
| SP_TA06 | Upload wrong file type → rejected | ❌ |
| SP_TA07 | Upload >3MB image → rejected | ❌ |
| SP_TA08 | Delete linked to Active Order → blocked | ❌ |
| SP_TA09 | Agent role → Add button hidden | ❌ |

## Known Bug
- **SP-Q2**: Delete Confirmation dialog is missing — currently deletes without dialog (confirmed bug, must fix before SIT)

## Related Pages
- [Spare Parts Stock](spare-parts-stock.md)
- [Product & Inventory](product-inventory.md)
- [Product Stock](product-stock.md)
- [Order Management](order-management.md)
- [CC Super App Overview](cc-super-app-overview.md)
