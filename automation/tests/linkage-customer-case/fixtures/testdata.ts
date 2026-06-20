import type { CustomerData } from '../../customer-profile/pages/CustomerFormPage';

/**
 * Real Example Data — Linkage Customer Profile with Case (LCP)
 * ตรงกับ Arrange ใน 10-Linkage Customer Profile with Case/linkage-customer-case-test-design.md
 *
 * Feature อยู่บนหน้า Case Creation (/cms/case/creation) — panel ขวา "Linked Existing" / "Add Customer".
 * Arrange = seed customer ผ่าน GraphQL (fixtures ใช้ customer-profile/fixtures/seed.ts — CreateCustomer/DeleteCustomer ✅).
 *   seedCustomer = idempotent (ลบ email เดิม → create ใหม่) + record email ลง seeded-emails.json ให้ teardown ลบ (CP_TEARDOWN=1).
 */

// ── existing customers ที่ใช้ link (seed ก่อนเทส) ─────────────────────────────
/** Gold · 0899181632 — ใช้ค้นหา by Name/Mobile/Email + select */
export const BULAN: CustomerData = {
  email: 'bulan.jit@skyai.co.th',
  phone: '0899181632',
  title: 'Ms.',
  firstName: 'Bulan',
  lastName: 'J',
  gender: 'Female',
  type: 'Gold',
};

/** Platinum · 0850020000 — customer A ใน re-select (TS-03) + identity check (TA-08) */
export const VILAILUK: CustomerData = {
  email: 'vilailuk@gmail.com',
  phone: '0850020000',
  title: 'Ms.',
  firstName: 'Vilailuk',
  lastName: 'Maksuk',
  gender: 'Female',
  type: 'Platinum',
};

/** Platinum · 0899181633 — ใช้ทดสอบ Filter Type = Platinum (TA-07) */
export const DONALD: CustomerData = {
  email: 'donald.throught@skyai.co.th',
  phone: '0899181633',
  title: 'Mr.',
  firstName: 'Donald',
  lastName: 'Throught',
  gender: 'Male',
  type: 'Platinum',
};

export const SEED_CUSTOMERS: CustomerData[] = [BULAN, VILAILUK, DONALD];

// ── customer ที่ "สร้างใหม่" จากหน้า case (TS-02 quick-create) ─────────────────
/** ฟอร์ม quick-create มีแค่ Email* / Phone* / First / Last (PO Q8: intentionally minimal) */
export const NEW_CUSTOMER = {
  email: 'napatsorn.wong@gmail.com',
  phone: '0623344556',
  firstName: 'Napatsorn',
  lastName: 'Wongthong',
};

// ── search keywords ───────────────────────────────────────────────────────────
export const SEARCH_BY_NAME = 'Bulan';
export const SEARCH_BY_MOBILE = '0899181632';
export const SEARCH_BY_MOBILE_NODASH = '0850020000'; // PO Q7: non-dash format only (reject dash)
export const SEARCH_BY_EMAIL = 'bulan.jit@skyai.co.th';
export const SEARCH_NO_RESULT = 'Nonexistent Person';

// ── filter ────────────────────────────────────────────────────────────────────
/** PO Q9: Type values = Bronze / Silver / Gold / Platinum / N/A */
export const FILTER_TYPE = 'Platinum';
export const TYPE_VALUES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'N/A'];

// ── duplicate (Add Customer negatives — PO Q3: block both) ─────────────────────
export const DUP_PHONE = '0899181632';            // ซ้ำกับ Bulan J
export const DUP_EMAIL = 'bulan.jit@skyai.co.th'; // ซ้ำกับ Bulan J
export const NEW_EMAIL_FOR_DUP_PHONE = 'new.person@gmail.com';
export const NEW_PHONE_FOR_DUP_EMAIL = '0623344556';
export const INVALID_EMAIL = 'napatsorn.wonggmail.com'; // ไม่มี @

// ── inline-validation copy (PO Q4 — exact strings) ────────────────────────────
export const MSG_EMPTY_EMAIL = 'Please enter an email address';
export const MSG_EMPTY_PHONE = 'Please enter a mobile number';
export const MSG_INVALID_EMAIL = 'Invalid email address format'; // ⚠️ exact copy TBC กับ PO/Dev

// ── 360 panel tabs (LE6) ──────────────────────────────────────────────────────
export const PANEL_TABS = ['Profile', 'History', 'Note', 'Appointment', 'Product', 'Service'];
