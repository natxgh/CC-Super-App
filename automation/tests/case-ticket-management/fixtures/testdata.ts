import type { CustomerData } from '../../customer-profile/pages/CustomerFormPage';

/**
 * Real Example Data — Case and Ticket Management (CTM)
 * ตรงกับ Arrange ใน 09-Case and Ticket Management/case-ticket-management-test-design.md
 *
 * NB (data gap): UI create flow ต้องมีลูกค้าอยู่ก่อน (phone auto-link AC4) → seed customer ผ่าน API ก่อน.
 *   เคสที่ต้อง "มีเคสอยู่แล้ว" (lifecycle/close/edit/history) → seed case ผ่าน API (case-seed.ts) ที่ statusId ที่ต้องการ.
 */

/** ลูกค้าที่ผูกกับเคส (Arrange: phone 081-234-5678 = Somying Rakdee) */
export const CUST_FOR_CASE: CustomerData = {
  email: 'somying.rakdee@gmail.com',
  phone: '0812345678',
  title: 'Ms.',
  firstName: 'Somying',
  middleName: '-',
  lastName: 'Rakdee',
  gender: 'Female',
  type: 'Gold',
  dob: '09/05/2532',
  registered: {
    houseNo: '120/5', room: '-', floor: '-', building: 'Phasi Charoen Place',
    street: 'Phetkasem', province: 'Bangkok', district: 'Phasi Charoen',
    subdistrict: 'Bang Wa', postalCode: '10160', country: 'Thailand',
  },
  sameAsRegistered: true,
  preferences: { contactMethod: 'Mobile Number', language: 'Thai' },
  custom: { lineId: 'somying.rak' },
};

export const NAME_FOR_CASE = 'Somying Rakdee';

/** phone ที่ "ไม่มี" ลูกค้าในระบบ (AC4 negative / TA-05) */
export const PHONE_NO_MATCH = '0990000001';

/** Real Example Data ของเคส (CCTV camera malfunction) */
export const NEW_CASE = {
  caseType: '1002-Camera Malfunction -Repair',
  contactMethod: 'CALL',
  serviceCenter: 'Thailand-Thonburi South Zone-phasicharoen',
  caseDetail: 'The CCTV camera at the front entrance is not working, the image is dark; checked and the power LED is off',
  phone: '0812345678',
  expectedPriority: 'High Priority',
};

/** Case Type กลุ่ม Service Request (AC3-TC2 / TS-04) */
export const SERVICE_REQUEST_CASE_TYPE = '101-1. Service Request-New Service';

/** 5 ตัวเลือก Contact Method (AC6) */
export const CONTACT_METHODS = ['CALL', 'METTLINK', 'METTRIQ', 'IOT-Alert', 'Other'];

/** Comment / Result (TS-03 / close) */
export const CASE_COMMENT = 'Technician scheduled on-site 15/06 at 13:00';
export const CLOSE_RESULT = 'Repair completed';

/** BVA Case Details (AC2 / TA-02) — 4000 limit */
export const txt = (n: number) => 'A'.repeat(n);
export const DETAIL_3999 = txt(3999);
export const DETAIL_4000 = txt(4000);
export const DETAIL_4001 = txt(4001);

/** search keyword (HS1 / TA-09) */
export const SEARCH_HIT = 'camera';
export const SEARCH_MISS = 'zzznotreal999';

/** Advanced filter date range (HS3 / TA-08) — dd/mm/yyyy as shown in UI */
export const FILTER_START_OK = '01/06/2026';
export const FILTER_END_OK = '30/06/2026';
export const FILTER_START_BAD = '30/06/2026'; // Start > End (TA-08)
export const FILTER_END_BAD = '01/06/2026';
