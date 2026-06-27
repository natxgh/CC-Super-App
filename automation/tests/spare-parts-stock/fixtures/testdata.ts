/**
 * Spare Parts Stock Management — Real Example Data (no Test/xxx/placeholder)
 * Source of truth: 07-Spare Parts Stock/spare-parts-stock-test-design.md + Lark Base tblIwUWXkWNLYy4c
 *   (Feature "Spare Parts Stock Management" · PO answers — all 12 resolved 2026-06-19)
 *
 * ⚠️ Serial/part/store values were observed on STG (v0.26.3, /cms/inventory/stock). The QA env
 *    (skyai-cloud-cc-qa) may hold different rows — values here are best-effort and MUST be
 *    reconciled against live QA data on first run (a not-found row = data drift, not a code bug).
 */

// ── stock units (serialized) — read / View / Edit targets ───────────────────────────
// ✅ verified live on QA 2026-06-22 — Status renders as LABEL (R001→"New", R007→"Delivered")
export const UNIT_MAIN    = 'SN0000019';   // iPhone 17 Pro Screen / Store2 / Status "New" (View, Edit)
export const UNIT_OTHER   = 'SN0000018';   // second unit (Status "Delivered") — duplicate-Serial source (TA-02)
export const UNIT_DELETE  = 'SN0000016';   // iPhone 17 Pro Screen — delete target (TS-04)
export const UNIT_DETAIL = {
  serial: UNIT_MAIN,
  part: 'iPhone 17 Pro Screen',
  store: 'Store2',
  status: 'New',
};

// ── master values (dropdowns / filters) ─────────────────────────────────────────────
export const PART_MAIN   = 'iPhone 17 Pro Screen';
export const PART_OIL    = 'Synthetic Engine Oil 5W-30';
export const PART_MASTER_TYPEAHEAD = 'Mercedes';            // dropdown typeahead → Mercedes-Benz OM654.920
export const PART_MASTER_MATCH     = 'Mercedes-Benz OM654.920';
export const STORE_FROM  = 'Store2';
export const STORE_TO    = 'Store1';                        // change-Store target (TS-03)

// ── search ──────────────────────────────────────────────────────────────────────────
export const SEARCH_EXACT   = 'SN0000019';   // exact serial → 1 row
export const SEARCH_PARTIAL = '5W-30';        // partial → Synthetic Engine Oil 5W-30 units
export const SEARCH_NONE    = 'SN9999999';    // empty state

// ── stock badge BVA (PO: 0=Out · 1–5=Low · >5=In · per-company threshold) ────────────
export const PART_OUT = 'Mercedes-Benz OM654.920';  // 0 units → "Out of Stock (0)"
export const PART_LOW = 'Mercedes-Benz M112';        // 1 unit  → "Low Stock (1)" · drill-down source
export const PART_LOW_MAX = 5;                        // 1–5 = Low (upper boundary)
export const PART_IN_QTY  = 6;                        // >5 = In Stock

// ── Serial No. format (PO: alphanumeric + dash · special/space invalid · max length 100) ─
export const SERIAL_VALID   = '5W-30-0009';
export const SERIAL_INVALID = 'SN 000@19';           // space + special char → invalid
export const SERIAL_MAX100  = 'A'.repeat(99) + '0';  // exactly 100 chars (alphanumeric)

// ── pagination (PO: page size 10/20/50/100) ─────────────────────────────────────────
export const PAGE_SIZES = ['10', '20', '50', '100'];

// ── exact texts — ✅ ยืนยันจาก PO (Error & Success Handling Matrix 2026-06-25) ──────────
export const TOAST_CREATE = 'Spare Parts Stock created successfully';
export const TOAST_UPDATE = 'Spare Parts Stock updated successfully';
export const TOAST_DELETE = 'Spare Parts Stock deleted successfully';
export const EMPTY_STATE  = 'No entries to show';
export const DUP_ERROR    = 'Operation failed';  // observed v0.27.10: raw error toast (not user-friendly)

// ── validation error messages (per-field) — ✅ จาก PO matrix ─────────────────────────
export const ERR_REQUIRED_ALL    = 'Please fill in: Serial No., Spare part, Store';
export const ERR_REQUIRED_SERIAL = 'Please fill in: Serial No.';
export const ERR_REQUIRED_PART   = 'Please fill in: Spare Part';
export const ERR_REQUIRED_STORE  = 'Please fill in: Store';
