/**
 * Product & Inventory — Real Example Data (no Test/xxx/ทดสอบ placeholders)
 * Source of truth: 04-Product/product-inventory-test-design.md + product-inventory-testcases.xlsx
 * Brand/Category ชื่อต้องตรง master data จริงบน STG (resolver หา id by name)
 */
export interface ProductData {
  code: string;          // productCode (unique key — ใช้ทั้ง seed/teardown)
  th?: string;
  en?: string;
  brand: string;         // resolve → brandId
  category: string;      // resolve → categoryId
  year?: number;         // → mfd
  warranty?: number;     // Days (Int) — PO: ≥ 0
  price?: number;        // PO: integer ≥ 0
  image?: string;
  active?: boolean;
}

// ── happy-path add (TS-01 / TS-04 delete target) ──────────────────────────────
export const XIA_RVX20: ProductData = {
  code: 'XIA-RVX20',
  th: 'หุ่นยนต์ดูดฝุ่น Xiaomi Robot Vacuum X20+',
  en: 'Xiaomi Robot Vacuum X20+',
  brand: 'Xiaomi',
  category: 'Small Appliances',
  year: 2025,
  warranty: 365,
  price: 12990,
};

// ── boundary 0 accepted (TS-08): Warranty 0 + Price 0 ────────────────────────
export const XIA_FREEBIE: ProductData = {
  code: 'XIA-FREEBIE',
  th: 'ของแถม Xiaomi Promo Gift',
  en: 'Xiaomi Promo Gift',
  brand: 'Xiaomi',
  category: 'Small Appliances',
  year: 2025,
  warranty: 0,
  price: 0,
};

// ── TA-11 arrange: product + product stock (delete-blocked test) ─────────────
export const BMW_TA11: ProductData = {
  code: 'BMW-TA11',
  th: 'BMW 5 Series G60 TA11',
  en: 'BMW 5 Series G60 TA11',
  brand: 'BMW',
  category: 'Vehicles',
  year: 2026,
  warranty: 365,
  price: 4500000,
};
export const SN_TA11_STOCK = 'BMW5G60-TA11-001'; // serial arranged for TA-11 delete-blocked verify
export const STORE_TA11 = 'Store2';               // store for TA-11 product stock seed

// ── existing catalog items (สำรวจจาก STG — ใช้สำหรับ View/Search/Sort/Delete-dep) ──
export const CHERY_V27 = { code: 'CheryV27', name: 'Chery V27', brand: 'Chery', category: 'Vehicles' };
export const PRODUCT_1001 = { code: '1001', brand: 'Xiaomi', category: 'Smart Tech & Gadgets', year: 2026, warranty: 1, price: 1001 };

// ── search / filter ──────────────────────────────────────────────────────────
export const SEARCH_MATCH = 'Chery';        // → Chery V27 + Chery V23
export const SEARCH_PARTIAL = 'Cher';
export const SEARCH_NONE = 'Zznotexist';    // empty state
export const FILTER_BRAND = 'BMW';          // BMW7G70 / BMW5G60 / BMW3G20
export const FILTER_CATEGORY = 'Vehicles';
export const FILTER_CATEGORY_EMPTY = 'Game';

// ── duplicate / invalid (Alternative) ────────────────────────────────────────
export const DUP_CODE = 'CheryV27';
export const PRICE_NEGATIVE = -500;
export const PRICE_DECIMAL = 12990.5;
export const WARRANTY_NEGATIVE = -1;

// ── year dropdown (PO Q15: 2017 .. currentYear+1) ────────────────────────────
export const YEAR_MIN = 2017;
export const YEAR_MAX = new Date().getFullYear() + 1; // dynamic upper bound (2027 in 2026)

// ── image assets (UI-only cases) ─────────────────────────────────────────────
export const IMG_PRODUCT = 'mercedes_glc_2026.jpg'; // realistic product photo for TS-01 image upload TC
export const IMG_VALID = 'profile_siriwimon.jpg'; // reuse existing JPG asset (≤3MB)
export const IMG_PDF = 'contract.pdf';             // unsupported → reject
export const IMG_OVER_3MB = 'photo_hd.jpg';        // >3MB → reject (reuse existing 4MB asset)

// ── exact toast text — live probe 2026-06-23 shows generic 'Success' toast
// (PO Q11 listed full strings but app only shows 'Success' in the toast header)
export const TOAST_CREATE = 'Success';
export const TOAST_UPDATE = 'Success';
export const TOAST_DELETE = 'Success';
