# Product & Inventory — API status & open items

Probed `https://cc-bff-qa.one-sky.ai/graphql` (introspection open, no auth) — 2026-06-21.

## ✅ APIs available (no gap for CRUD) — used by `fixtures/product-seed.ts`
| Need | GraphQL op | Status |
|---|---|---|
| Seed/create a product | `Product.CreateProduct(ProductInput)` | ✅ verified (mirror of Customer) |
| Update | `Product.UpdateProduct(ProductInput)` | ✅ |
| Delete (teardown) | `Product.DeleteProduct(GetIdInput{id})` | ✅ verified — teardown deletes by id |
| Find by code (teardown) | `Product.GetListProduct(ListDataInput{search,start,length})` | ✅ |
| Resolve brandId | `Brand.GetListBrand` | ✅ (resolve by name at runtime) |
| Resolve categoryId | `Category.GetListCategory` | ✅ |

`ProductInput`: `active!`, `brandId!`, `categoryId!`, `productCode!`, + `th, en, image, mfd(=Year), price(Float), warranty(Int)`.
Auth = JWT `localStorage.access_token` after UI login (same as customer seed). `status:"0"` = ok.

## ⚠️ No missing API — but 2 things block full green
1. **TA-11 (conditional delete)** needs a product that **already has Product Stock (Serial) or an Order**.
   Seeding that is heavy (`ProductStock` / `OrderItem` mutations exist but need store+status+serial).
   → currently uses an existing catalog item + **annotates** if the block can't be observed (no fake pass).
   Dep queries exist if we want to assert precondition: `ProductStock.GetListProductStock` / `OrderItem.GetListOrderItem`.
2. **HA11 exact text** (per-field validation error + empty-search state) still pending PO →
   negative-case `Expected` asserted **broad/soft**; tighten once PO sends exact strings.

## 🐞 Finding (UI vs PO answer)
- **Year dropdown max = 2026 on STG** (options: Select year, 2026, 2025, …). PO Q15 said range should be
  **2017–(current year + 1) = 2027** — that change is **not deployed yet**. Confirm with dev before sign-off.

## 🔧 Selector verification status (Page Objects)
- ✅ **All selectors fully verified via live DOM probe 2026-06-22:**
  - Form: `input[name="th/en/productCode/warranty/price"]`, Year = native `<select>`, Image = `#photo-upload`
  - Category/Brand dropdown: click `label:has-text → xpath:following-sibling::div[1]` → `input[placeholder="Search..."]` → click option
  - Cards (List/Grid view): `div.bg-white.border.rounded-lg.p-4` (not `<table>`)
  - View = `button` text "View" (lucide-eye, title="View details") · Edit = `button` text "Edit" · Delete = `button:has(svg.lucide-trash2)` (icon-only, no text)
  - View-toggle: `button:has(svg.lucide-list)` / `lucide-grid3x3` / `lucide-table` (icon-only)
  - Delete dialog: `div.fixed.inset-0` + h2 "Delete Confirmation" + "Cancel"/"Delete" buttons
  - Item Details modal: `div.fixed.inset-0` + h2 "Item Details" + "Delete"/"Edit"/"Close" buttons
  - Filter Status: `input[type="radio"][name="active"]` inside label with span "Active"/"Inactive"
  - Empty state: **"No entries to show"**
- 🟡 **Toast container class** not captured (toast too brief to inspect). `page.getByText(TOAST_TEXT)` works without knowing the wrapper class.
