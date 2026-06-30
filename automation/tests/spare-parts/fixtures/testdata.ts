/**
 * Spare Parts & Inventory Management — Real Example Data (no Test/xxx/ทดสอบ placeholders)
 * Source of truth: 06-Spare Parts/spare-parts-test-design.md + spare-parts-testcases.xlsx
 *   (Lark Base tblIwUWXkWNLYy4c · PO answers SP-Q1..Q7 applied 2026-06-19)
 *
 * ⚠️ ANTI-DEPENDENCY RULE: every scenario Arranges its OWN data via API (spare-seed.ts) and tears it
 *    down in afterAll. We NEVER assert against pre-existing STG inventory. All seeded parts carry the
 *    `QA-AUTO ` prefix so search/filter targets only our own data and teardown is unambiguous.
 *
 * Brand/Category/Product names below are VERIFIED to exist in QA master data (2026-06-29):
 *   brands: Mercedes Benz, Mobil, Apple · categories: Vehicle Accessories, Vehicle Engine, iPhone Battery
 *   products: 2026 Mercedes-Benz GLE 350de Plug-in Hybrid · iPhone 16 Pro (512GB, Natural Titanium)
 */
export interface SparePartData {
  en: string;           // Spare Part Name (EN) — unique identity key for seed/teardown (no `code` field exists)
  th?: string;          // Spare Part Name (TH)
  brand: string;        // → brandId UUID (resolved by name)
  category: string;     // → categoryId UUID
  belongTo: string;     // Belong to Product (master) → productId UUID — REQUIRED by SparePartInput
  year?: number;        // → mfd (Model Year)
  warranty?: number;    // Days (Int) — system converts to Months on display (SP-Q6: 365→12 Months)
  price?: number;       // ≥ 0
  image?: string;
  active?: boolean;
  stockQty?: number;    // seed N serials via SparepartStock (stock count). absent/0 → "Out of Stock (0)"
  store?: string;       // store name for stock serials (default = first store)
}

const MERC_PRODUCT = '2026 Mercedes-Benz GLE 350de Plug-in Hybrid';
const APPLE_PRODUCT = 'iPhone 16 Pro (512GB, Natural Titanium)';

// ── shared search keyword: only our seeded parts match (anti-dependency) ──────────────
export const SEED_PREFIX = 'QA-AUTO';
export const SEARCH_MATCH = 'QA-AUTO Brake';   // → 2 seeded "QA-AUTO Brake …" parts (TS-01_TC-02)
export const SEARCH_NONE  = 'ZXQNOTEXIST999';  // empty state (TA-01)
export const FILTER_BRAND = 'Apple';           // Brand filter — our seeded Apple part proves the filter

// ── TS-01 — Search + View Detail (seed 2 "Brake" parts; view the first) ───────────────
export const SEED_VIEW: SparePartData = {
  en: 'QA-AUTO Brake Pad Set BR-2001', th: 'QA-AUTO ผ้าเบรก BR-2001',
  brand: 'Mercedes Benz', category: 'Vehicle Accessories', belongTo: MERC_PRODUCT,
  year: 2026, warranty: 365, price: 3500,
};
export const SEED_SEARCH2: SparePartData = {
  en: 'QA-AUTO Brake Disc Rotor BR-2002', th: 'QA-AUTO จานเบรก BR-2002',
  brand: 'Mercedes Benz', category: 'Vehicle Accessories', belongTo: MERC_PRODUCT,
  year: 2026, warranty: 365, price: 4200,
};
// View Detail field assertions for SEED_VIEW (SP5-TC01)
export const DETAIL_PART = {
  name: SEED_VIEW.en,
  fields: [SEED_VIEW.en, 'Out of Stock', 'Mercedes Benz', 'Vehicle Accessories', '2026', '3,500', '12 Months'],
};

// ── TS-02 — Filter Brand (Apple) + Stock Status (Out of Stock = no stock seeded) ──────
export const SEED_APPLE_OUT: SparePartData = {
  en: 'QA-AUTO iPhone Battery Cell BT-3001', th: 'QA-AUTO แบตเตอรี่ BT-3001',
  brand: 'Apple', category: 'iPhone Battery', belongTo: APPLE_PRODUCT,
  year: 2026, warranty: 365, price: 1990, stockQty: 0,
};
export const PART_OUT = SEED_APPLE_OUT.en; // "Out of Stock (0)" (SP10-TC01)

// ── TS-03 — Add via UI (Warehouse Staff/Admin) — brand "Mobil" exists (Denso does not) ─
export const DENSO_FILTER: SparePartData = {
  en: 'QA-AUTO Mobil Air Filter MAF-1101', th: 'QA-AUTO กรองอากาศ MAF-1101',
  brand: 'Mobil', category: 'Vehicle Accessories', belongTo: MERC_PRODUCT,
  year: 2026, warranty: 365, price: 2500,
};

// ── TS-04 / TA-04 — Edit (price update) / clear Name(TH) ──────────────────────────────
export const SEED_EDIT: SparePartData = {
  en: 'QA-AUTO Engine Oil Filter OF-4001', th: 'QA-AUTO กรองน้ำมันเครื่อง OF-4001',
  brand: 'Mercedes Benz', category: 'Vehicle Engine', belongTo: MERC_PRODUCT,
  year: 2026, warranty: 365, price: 100000,
};
export const PART_LOW = SEED_EDIT.en;
export const EDIT_PRICE_TO = 95000;

// ── TS-05 — Delete OK (no stock, no order → deletable) ────────────────────────────────
export const SEED_DELETE_OK: SparePartData = {
  en: 'QA-AUTO Cabin Air Filter CF-5001', th: 'QA-AUTO กรองแอร์ CF-5001',
  brand: 'Mercedes Benz', category: 'Vehicle Accessories', belongTo: MERC_PRODUCT,
  year: 2026, warranty: 365, price: 1500,
};
export const PART_DELETE_OK = SEED_DELETE_OK.en;

// ── TA-05 — Delete then Cancel — item stays ───────────────────────────────────────────
export const SEED_DELETE_CANCEL: SparePartData = {
  en: 'QA-AUTO Spark Plug Set SP-6001', th: 'QA-AUTO หัวเทียน SP-6001',
  brand: 'Mercedes Benz', category: 'Vehicle Accessories', belongTo: MERC_PRODUCT,
  year: 2026, warranty: 365, price: 2800,
};
export const PART_DELETE_CANCEL = SEED_DELETE_CANCEL.en;

// ── TA-08 — Delete blocked: seed WITH serial stock (SP-BC12 — verified: "Cannot delete") ─
export const SEED_DELETE_BLOCKED: SparePartData = {
  en: 'QA-AUTO Timing Belt Kit TB-7001', th: 'QA-AUTO ชุดสายพานราวลิ้น TB-7001',
  brand: 'Mercedes Benz', category: 'Vehicle Engine', belongTo: MERC_PRODUCT,
  year: 2026, warranty: 365, price: 6500, stockQty: 3,
};
export const PART_DELETE_BLOCKED = SEED_DELETE_BLOCKED.en;

// ── all seeded parts (for global teardown) ────────────────────────────────────────────
export const ALL_SEEDS: SparePartData[] = [
  SEED_VIEW, SEED_SEARCH2, SEED_APPLE_OUT, DENSO_FILTER, SEED_EDIT,
  SEED_DELETE_OK, SEED_DELETE_CANCEL, SEED_DELETE_BLOCKED,
];

// ── image assets (UI-only cases · SP-Q4: JPG/PNG/GIF, max 3MB) ───────────────────────
export const IMG_VALID    = 'mercedes_glc_2026.jpg'; // valid JPG ≤3MB (SP7-TC01)
export const IMG_PDF      = 'contract.pdf';          // unsupported type → reject (SP7-TC02)
export const IMG_OVER_3MB = 'photo_hd.jpg';          // >3MB → reject (SP7-TC03)

// ── exact toast text — ✅ ยืนยันจาก PO (Error & Success Handling Matrix 2026-06-25) ──────
export const TOAST_CREATE = 'Spare parts created successfully';
export const TOAST_UPDATE = 'Spare parts updated successfully';
export const TOAST_DELETE = 'Spare Parts deleted successfully';

// ── validation error messages (per-field) — ✅ จาก PO matrix ─────────────────────────
export const ERR_REQUIRED_NAME_EN = 'Please fill in: Spare Part Name (EN)';
export const ERR_REQUIRED_NAME_TH = 'Please fill in: Spare Part Name (TH)';
export const ERR_REQUIRED_PRICE   = 'Please fill in: Price';
