/**
 * Real Example Data — Product Stock Management (PS)
 * Source of truth: 05-Product Stock/product-stock-test-design.md (+ Lark Base, PO answers Q1–Q12)
 * No "Test/xxx/ทดสอบ" placeholders — realistic serials / products / stores.
 */
import type { ProductStockSeed } from './product-stock-seed';

// ── master-data references (must exist in STG master; resolve to id via API) ──
export const PRODUCT_NAME = '2026 Mercedes GLC SUV';   // Product dropdown (master)
export const STORE_NAME = 'Store2';                    // Store dropdown (master)
export const PRODUCT_NOT_IN_MASTER = 'Tesla Model Z';  // not in master → no option
export const STORE_NOT_IN_MASTER = 'Galaxy Far Away Depot'; // not in master → no option

// spare parts used by stock-badge / detail-modal scenarios (live STG inventory names)
export const PART_LOW = 'Mercedes-Benz M112';          // Low Stock + detail modal target
export const PART_OUT = 'Mercedes-Benz OM654.920';     // Out of Stock target

// ── Serial numbers (Real Example Data) ──
export const SN_NEW = 'MB2026GLC-0007';                // does NOT exist → create success
export const SN_DUPLICATE = '100003-002';              // already exists → duplicate error
export const SN_VALID_FORMAT = 'BMWG20-0007';          // alphanumeric + dash (valid)
export const SN_INVALID_FORMAT = 'MB 2026 #@!';        // spaces + special chars (invalid)
export const SN_99 = 'A'.repeat(98) + 'B';             // 99 chars (below max)
export const SN_100 = 'A'.repeat(99) + 'B';            // 100 chars (at max boundary)
export const SN_101 = 'A'.repeat(100) + 'B';           // 101 chars (over max → invalid)

// ── dates ──
export const REGISTERED_DATE = '2026-06-13';
export const MW_AFTER = '2027-06-13';   // MW > Registered (valid)
export const MW_EQUAL = '2026-06-13';   // MW = Registered (valid — boundary)
export const MW_BEFORE = '2025-01-01';  // MW < Registered (invalid)

// ── Status mapping (PO Q6) — new unit default Status = R001 (New) ──
export const DEFAULT_STATUS_CODE = 'R001';
export const DEFAULT_STATUS_LABEL = 'New';

// ── exact texts (PO Q11) ──
export const TOAST_CREATE = 'Product Stock created successfully';
export const TOAST_UPDATE = 'Product Stock updated successfully';
export const TOAST_DELETE = 'Product Stock deleted successfully';

// ── full Add payload (PS9 happy path) — API-first seed shape ──
export const SEED_UNIT: ProductStockSeed = {
  serialNumber: SN_NEW,
  product: PRODUCT_NAME,
  store: STORE_NAME,
  registerDate: REGISTERED_DATE,
  mfw: MW_AFTER,
};

// the unit used by Add-success UI flow (kept separate so seed + UI use distinct serials)
export const NEW_UNIT = {
  serialNumber: SN_NEW,
  product: PRODUCT_NAME,
  store: STORE_NAME,
  registerDate: REGISTERED_DATE,
  mfw: MW_AFTER,
};

// stock-status BVA boundaries (PO Q8: 0=Out · 1–5=Low · >5=In)
export const QTY_OUT = 0;
export const QTY_LOW_MIN = 1;
export const QTY_LOW_MID = 4;
export const QTY_LOW_MAX = 5;
export const QTY_IN = 6;
