# Product & Inventory Management (PIM)

Feature: Product CRUD + Search/Filter · Module 04
CMS Path: `/cms/products/`
Prefix: `PIM`

## Fields (Add/Edit Product)
| Field | Required | Rule |
|-------|----------|------|
| Product Name (TH) | ✅ | — |
| Product Name (EN) | ✅ | — |
| Product Code | ✅ | Unique system-wide |
| Category | ✅ | From master dropdown |
| Brand | ✅ | From master dropdown |
| Year | ✅ | 2017–2027 (current year + 1; dynamic upper bound) |
| Warranty (Days) | ✅ | Integer ≥ 0 (0 valid), no max, negative = invalid |
| Price | ✅ | Integer ≥ 0, no max, no decimals, negative = invalid |
| Image | Optional | JPG/PNG/GIF · max 3MB |

## Validation Error Format
- Per-field: **"Please fill in: \<field\>"** (EN) / **"กรุณากรอกข้อมูล: \<field\>"** (TH)
- Empty state: **"No entries to show"**

## View Modes
- **List** (default), **Grid**, **Table**
- Table view: column sort on Name/Code/Year/Price/Warranty (default sort = Name)

## Search / Filter
- Search: Product Name (TH+EN) + Product Code (partial, case-insensitive)
- Filter: Brand / Category / Status (Active/Inactive)
- Reset: clears all search+filter

## Stock Badge (read-only, from Product Stock)
- Shows on Product list; badge updated by [Product Stock](product-stock.md)
- Badge values: Out of Stock (0) / Low Stock (1–5) / In Stock (>5)

## Delete Rules (PO Q8)
- Conditional delete — deletable only when: **no Product Stock (Serial) AND no Order relation**
- If has dependency → system **blocks** with error
- Confirm dialog: *"Are you sure you want to delete? This action cannot be undone."*
- Cancel → product remains

## Toast Messages (Confirmed)
| Action | Toast |
|--------|-------|
| Create | **"Product created successfully"** |
| Update | **"Product updated successfully"** |
| Delete | **"Product deleted successfully"** |

## Test Data (Real STG)
- Products: Xiaomi Robot Vacuum X20+, Chery V27, BMW 7G70, Mercedes GLE, Jaecoo J7
- Code examples: `1007`, `CheryV27`, `XIA-RVX20` (new in tests)

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| PIM_TS01 | Add new product (happy path) | ✅ |
| PIM_TS02 | View product detail | ✅ |
| PIM_TS03 | Edit product | ✅ |
| PIM_TS04 | Delete product | ✅ |
| PIM_TS05 | Search + filter + reset | ✅ |
| PIM_TS06 | Switch view modes (List/Grid/Table) | ✅ |
| PIM_TA01 | Leave required field empty | ❌ |
| PIM_TA02 | Duplicate Product Code | ❌ |
| PIM_TA03 | Negative Price | ❌ |
| PIM_TA04 | Decimal Price | ❌ |
| PIM_TA05 | Invalid image format (.pdf) | ❌ |
| PIM_TA06 | Cancel delete | ❌ |
| PIM_TA07 | Search no match | ❌ |
| PIM_TA08 | Filter Status Inactive | ❌ |
| PIM_TA09 | Delete product with Stock → blocked | ❌ |
| PIM_TA10 | Image > 3MB → rejected | ❌ |
| PIM_UI01 | Column sort (Table) | 🔁 |

## Known Env Observation
- `GetListProduct` (GraphQL BFF `cc-bff-stg`) อาจ hang/ไม่ตอบสนองเป็นบางครั้ง → check infra ก่อน execute

## Related Pages
- [Product Stock](product-stock.md)
- [Spare Parts](spare-parts.md)
- [Order Management](order-management.md)
- [CC Super App Overview](cc-super-app-overview.md)
