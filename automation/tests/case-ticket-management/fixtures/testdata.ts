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

/**
 * Real Example Data ของเคส (CCTV camera malfunction)
 * ✅ Values verified live DOM (probe 2026-06-22):
 *   - caseType: LI text = "1002-Camera Malfunction -Repair" (note trailing space after "Malfunction")
 *   - contactMethod: LI text = "CALL" (exact, all caps)
 *   - serviceCenter: ⚠️ shows "No Option." on QA — no real value verified yet
 *   - expectedPriority: from GetListCaseTypeWithSubTypes priority=3 (Medium or High — check UI label)
 * 🐛 CreateCase API broken on QA (BFF 500 when versions field set; -1 DB NOT NULL without it)
 *    → case-seed.ts seedCase() will fail until backend is fixed
 */
export const NEW_CASE = {
  caseType: '1002-Camera Malfunction -Repair',  // exact LI text on creation form
  contactMethod: 'CALL',
  serviceCenter: 'Thailand-Thonburi South Zone-phasicharoen', // ⚠️ unverified — Service Center shows No Option.
  caseDetail: 'The CCTV camera at the front entrance is not working, the image is dark; checked and the power LED is off',
  phone: '0812345678',
  expectedPriority: 'High Priority',            // ⚠️ unverified — actual label text depends on UI mapping
};

/**
 * API seed values (for case-seed.ts) — verified from GetListCaseTypeWithSubTypes (probe 2026-06-22)
 * NOTE: CreateCase API currently broken on QA — keep for when backend fix lands
 */
export const CASE_SEED_IDS = {
  caseTypeId:  '6c312319-4b4e-44e1-97de-cac72341f006', // Camera Malfunction (UUID)
  caseSTypeId: '5972c770-2b72-4d65-ac93-d19c1555aaf8', // Repair (sTypeCode 1002)
  wfId:        '9a62ccfe-e68e-4402-8da2-52629ef9acbf', // workflow for Camera Malfunction
  caseSla:     '97',
  priority:    3,
  statusIds: {
    draft:      'S000',
    newCase:    'S001',
    dispatched: 'S004',   // numeric id=4 in status list
    inProgress: 'S016',   // numeric id=16
    done:       'S017',   // numeric id=17
    closed:     'S008',
  },
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
