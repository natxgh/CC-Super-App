/**
 * Spare Parts & Inventory Management — Real Example Data (no Test/xxx/ทดสอบ placeholders)
 * Source of truth: 06-Spare Parts/spare-parts-test-design.md + spare-parts-testcases.xlsx
 *   (pushed to Lark Base tblIwUWXkWNLYy4c · PO answers SP-Q1..Q7 applied 2026-06-19)
 * Brand/Category names must match live STG master data (resolver finds id by name).
 */
export interface SparePartData {
  code?: string;        // internal key for seed/teardown (EN name used if absent)
  th?: string;          // Spare Part Name (TH)
  en: string;           // Spare Part Name (EN)
  brand: string;        // → brandId
  category: string;     // → categoryId
  year?: number;        // → mfd (Model Year)
  warranty?: number;    // Days (Int) — system converts to Months on display (SP-Q6: 365→12 Months)
  price?: number;       // integer ≥ 0
  belongTo?: string;    // Belong to Product (master)
  image?: string;
  active?: boolean;
}

// ── happy-path Add (TS-03 / SP6-TC01) — Warranty 365 days → "12 Months" (SP-Q6) ──────
export const DENSO_FILTER: SparePartData = {
  code: 'DENSO-DL1101',
  th: 'กรองอากาศ Denso',
  en: 'Denso Air Filter DL-1101',
  brand: 'Denso',
  category: 'Vehicle Accessories',
  year: 2026,
  warranty: 365,
  price: 2500,
  belongTo: '2026 Mercedes-Benz GLE 350de Plug-in Hybrid',
};

// ── existing live STG inventory items (read-only / mutate targets) ───────────────────
export const PART_OUT  = 'Mercedes-Benz OM654.920';   // stock 0  → "Out of Stock (0)" (SP10-TC01)
export const PART_LOW  = 'Mercedes-Benz M112';        // stock 5  → "Low Stock (5)" (SP10-TC02) · Edit target (SP8)
export const PART_IN   = 'Battery pack';              // stock 6  → "In Stock (6)" (SP10-TC03)
export const PART_DELETE_OK     = 'Synthetic Engine Oil 5W-30'; // no Serial stock / no Active Order → deletable (SP9-TC01)
export const PART_DELETE_CANCEL = 'Brake Pads Set';   // delete → Cancel keeps it (SP9-TC02)
export const PART_DELETE_BLOCKED = PART_OUT;          // linked to Active Order → blocked (SP9-TC03, SP-Q5)

// View Detail target (SP5-TC01) — full field assertion
export const DETAIL_PART = {
  name: PART_OUT,
  fields: ['Mercedes-Benz OM654.920', 'Out of Stock', 'Mercedes Benz', 'Vehicle Engine', '2026', '200,000', '12 Months', 'Mercedes-Benz GLE 350de'],
};

// ── search / filter ──────────────────────────────────────────────────────────────────
export const SEARCH_MATCH = 'Battery';            // → "Battery pack" + "iPhone 16 Pro Battery" (≥2)
export const SEARCH_NONE  = 'ZXQNOTEXIST999';     // empty state (SP2-TC02)
export const FILTER_BRAND = 'Apple';              // Brand filter match (SP3-TC01)

// ── Edit (SP8) ─────────────────────────────────────────────────────────────────────
export const EDIT_PRICE_FROM = 100000;
export const EDIT_PRICE_TO   = 95000;

// ── Stock-status BVA boundaries (SP-Q3: 0=Out · 1–5=Low · >5=In · threshold=5) ───────
export const QTY_OUT = 0;
export const QTY_LOW_MAX = 5;   // upper boundary of Low
export const QTY_IN = 6;        // just above threshold

// ── image assets (UI-only cases · SP-Q4: JPG/PNG/GIF, max 3MB) ───────────────────────
export const IMG_VALID    = 'profile_siriwimon.jpg'; // valid JPG ≤3MB (SP7-TC01)
export const IMG_PDF      = 'contract.pdf';          // unsupported type → reject (SP7-TC02)
export const IMG_OVER_3MB = 'photo_hd.jpg';          // ~4MB > 3MB → reject (SP7-TC03)

// ── exact toast text — ✅ ยืนยันจาก PO (Error & Success Handling Matrix 2026-06-25) ──────
export const TOAST_CREATE = 'Spare parts created successfully';
export const TOAST_UPDATE = 'Spare parts updated successfully';
export const TOAST_DELETE = 'Spare Parts deleted successfully';

// ── validation error messages (per-field) — ✅ จาก PO matrix ─────────────────────────
export const ERR_REQUIRED_NAME_EN = 'Please fill in: Spare Part Name (EN)';
export const ERR_REQUIRED_NAME_TH = 'Please fill in: Spare Part Name (TH)';
export const ERR_REQUIRED_PRICE   = 'Please fill in: Price';
