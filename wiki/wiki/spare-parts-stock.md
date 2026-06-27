# Spare Parts Stock (SPS)

Feature: Spare Parts Stock unit registry + Edit/Delete + Low Stock badge · Module 07
CMS Path: `/cms/inventory/stock`
Prefix: `SPS`

## Scope (PO confirmed)
1. Stock unit registry: View / Search / Filter / Edit / Delete (per-unit management)
2. Low/Out of Stock badge count on Spare Parts master page (`/cms/inventory`)

## RBAC
| Role | Manage (Add/Edit/Delete) |
|------|--------------------------|
| Warehouse Staff | ✅ |
| Admin | ✅ |
| Agent (read-only) | ❌ Edit/Delete buttons hidden |

## List Page Fields (per unit row)
- Serial No. / Spare Part / Store / Status / View button
- 2 view modes: **List** and **Table**
- Table columns: SERIAL NO. / SPARE PART / STORE / STATUS / ACTION
- Pagination: page-size selectable 10 / 20 / 50 / 100

## Edit Form Fields
| Field | Required | Rule |
|-------|----------|------|
| Serial No. | ✅ | Alphanumeric + dash · no spaces/special chars · max 100 chars · unique system-wide |
| Spare Part | ✅ | From master dropdown only |
| Store | ✅ | From master dropdown only |
| Status | ❌ | **Read-only** — system-managed (R001–R010) |

## Status System (Read-only)
- R001 New / R002 Available / R003 Reserved / R004 Confirmed / R005 Paid / R006 Shipped / R007 Delivered / R008 Cancelled / R009 Expired / R010 Returned
- Status field is **absent from Edit form** by design

## Delete Rules
- Confirm dialog required → unit removed + stock count drops
- **Order-linked unit (Status ≠ Available) cannot be deleted**

## Stock Badge (on Spare Parts master — `/cms/inventory`)
Same thresholds as [Product Stock](product-stock.md):
- 0 = Out of Stock (red)
- 1–5 = Low Stock (orange)
- >5 = In Stock

Badge drill-down: click ↗ icon next to badge → navigates to Spare Parts Stock filtered to that part's units

## Toast Messages (Confirmed)
| Action | Toast EN |
|--------|----------|
| Create | **"Spare Parts Stock created successfully"** |
| Update | **"Spare Parts Stock updated successfully"** |
| Delete | **"Spare Parts Stock deleted successfully"** |
| Empty state | **"No entries to show"** |
| Required field | **"Please fill in: \<field\>"** |

## Test Data (Real STG Serial Numbers)
- SN0000016, SN0000018, SN0000019
- Parts: iPhone 17 Pro Screen, Synthetic Engine Oil 5W-30, Mercedes-Benz M112
- Stores: Store1, Store2

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| SPS_TS01 | Browse stock (List/Table + Item Details) | ✅ |
| SPS_TS02 | Search → Filter → Reset | ✅ |
| SPS_TS03 | Edit stock unit | ✅ |
| SPS_TS04 | Delete unit & stock count drops | ✅ |
| SPS_TS05 | Stock badge → drill-down → filtered stock | ✅ |
| SPS_TS06 | Table sort (Serial No. asc/desc) | ✅ |
| SPS_TA01 | Edit missing required → validation error | ❌ |
| SPS_TA02 | Duplicate Serial No. → error | ❌ |
| SPS_TA03 | Search no result → empty state → Reset | ❌ |
| SPS_TA04 | Agent role → no Edit/Delete buttons | ❌ |

## Open Text (Pending PO)
- Exact text for: duplicate-Serial error, Order-lock warning, invalid-format error → marked `""` in xlsx

## Related Pages
- [Spare Parts](spare-parts.md)
- [Product Stock](product-stock.md)
- [Order Management](order-management.md)
- [CC Super App Overview](cc-super-app-overview.md)
