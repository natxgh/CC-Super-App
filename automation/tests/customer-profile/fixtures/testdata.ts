import type { CustomerData } from '../pages/CustomerFormPage';

/**
 * Real Example Data — ตรงกับ customer-profile-testcases.xlsx (ไม่ใช้ test/xxx/ทดสอบ)
 * marker `qa-automation` ฝังไว้เพื่อให้ teardown ลบเฉพาะข้อมูลของเทส (ดู DB-TEARDOWN.md)
 */
export const SEED_MARKER = 'qa-automation';

/**
 * ฐานข้อมูล valid สำหรับ negative tests (TA-02..TA-08, TA-11)
 * firstName เป็น required field ของ API (Field "firstName" of required type "String!")
 * → negative test ต้องกรอก required ให้ครบก่อน แล้ว override เฉพาะ field ที่ตั้งใจให้ผิด
 *   ไม่งั้น Save ตายที่ "missing firstName" → toast "Error" ทั่วไป ก่อนถึง validation ที่ทดสอบ
 */
export const VALID_BASE: CustomerData = {
  email: 'darinee.wbn@gmail.com',
  phone: '0848851193',
  firstName: 'Darinee',
  lastName: 'Wibooncharoen',
};

/** ลูกค้าหลักที่หลาย scenario ต้องมีอยู่ก่อน (TS-01, TS-05, TA-13) */
export const SOMCHAI: CustomerData = {
  email: 'somchai.jai@gmail.com',
  phone: '0812345678',
  title: 'Mr.',
  firstName: 'Somchai',
  lastName: 'Jaidee',
  gender: 'Male',
  type: 'Gold',
  citizenId: '1234567890121',
  dob: '15/01/2533',
  preferences: { contactMethod: 'Mobile Number', language: 'Thai', note: 'VIP customer' },
  // custom fields (VCP5 / TS-01_TC-10)
  custom: {
    companyName: 'บริษัท ไทยดิจิทัล จำกัด',
    employeeId: 'EMP00142',
    lineId: 'somchai_j',
    drivingLicense: '12/34567',
    position: 'Senior Engineer',
  },
};

/** ลูกค้าที่ TS-03/TS-04 จะแก้ไข/ลบ — ต้อง seed ก่อน */
export const WANNAPA: CustomerData = {
  email: 'wannapa@gmail.com',
  phone: '0873331136',  // ต้องไม่ซ้ำกับ SIRIWIMON_NEW (0873331134)
  title: 'Mrs.',
  firstName: 'Wannapa',
  lastName: 'Suksai',
  gender: 'Female',
  type: 'Platinum',
};

/** ลูกค้าที่ TS-06/TA-11/TA-16 อ้างถึง */
export const NATTHAWAT: CustomerData = {
  email: 'natthawat.ntw@company.co.th',
  phone: '0848854444',
  title: 'Mr.',
  firstName: 'Natthawat',
  lastName: 'Jetbordin',
  type: 'Gold',
};

/**
 * TS-08 — display fallback (PO round-2): ลูกค้าที่ "ไม่มี First/Last name + ไม่มี Type"
 * seed สร้างได้ (firstName/lastName = "" ยัง satisfy String!) → displayName = email
 * Expected: View Detail/List แสดง Display Name = email · Type = "N/A"
 */
export const NONAME: CustomerData = {
  email: 'noname.case@gmail.com',
  phone: '0855550001',
  // ไม่ใส่ firstName/lastName/type โดยตั้งใจ
};

/** ข้อมูลใหม่สำหรับ TS-02 (Add) */
export const SIRIWIMON_NEW: CustomerData = {
  email: 'siriwimon@gmail.com',
  phone: '0873331134',
  title: 'Mrs.',
  firstName: 'Siriwimon',
  middleName: '-',
  lastName: 'Somjit',
  gender: 'Female',
  landline: '023456789',
  type: 'Platinum',
  dob: '20/06/2540',
  registered: {
    houseNo: '128/45', room: '1208', floor: '12', building: 'The Landmark Residence',
    street: 'Rama IX Road', province: 'Bangkok', district: 'Huai Khwang',
    subdistrict: 'Bang Kapi', postalCode: '10310', country: 'Thailand',
  },
  sameAsRegistered: true,
  preferences: { contactMethod: 'Mobile Number', language: 'Thai', note: 'VIP prefer to contact us in the morning 09:00–11:00 am.' },
  custom: { companyName: 'Siam Technology Company Limited', employeeId: 'EMP00256', lineId: 'siriwimon_sm', drivingLicense: 'TH-464087219', position: 'Marketing Manager' },
};

/**
 * TS-09 — Pagination arrange: ต้องมี ≥ 11 customers เพื่อให้ Next page active (default page = 10)
 * ใช้ email domain qa-pagi-cp.test เพื่อ identify / teardown ง่าย
 */
export const PAGINATION_CUSTOMERS: CustomerData[] = Array.from({ length: 55 }, (_, i) => ({
  email: `pagi.cp${String(i + 1).padStart(2, '0')}@qa-pagi-cp.test`,
  phone: `08${String(10000000 + i).padStart(8, '0')}`,
  firstName: `PagiTest${String(i + 1).padStart(2, '0')}`,
  lastName: 'CpAuto',
  type: 'Bronze' as const,
}));

/** ข้อมูลหลังแก้ไขสำหรับ TS-03 (Update Wannapa → Wannapha) */
export const WANNAPHA_UPDATED: CustomerData = {
  email: 'wannapha12@gmail.com',
  phone: '0873331135',
  title: 'Mrs.',
  firstName: 'Wannapha',
  middleName: '-',
  lastName: 'Sooksai',
  gender: 'Other',
  landline: '021232384',
  type: 'Gold',
  dob: '23/07/2536',
  registered: {
    houseNo: '9/45', room: '1104', floor: '11', building: 'Rama IX Condominium',
    street: 'Rama IX', province: 'Bangkok', district: 'Huai Khwang',
    subdistrict: 'Huai Khwang', postalCode: '10310', country: 'Thailand',
  },
  sameAsRegistered: false,
  current: {
    houseNo: '55/2', room: 'B21', floor: '2', building: 'Nimman Suites',
    street: 'Nimmanhaemin', province: 'Chiang Mai', district: 'Mueang Chiang Mai',
    subdistrict: 'Suthep', postalCode: '50200', country: 'Thailand',
  },
  preferences: { contactMethod: 'Email', language: 'English', note: 'ลูกค้าติดต่อเฉพาะช่วงบ่าย 13:00–17:00 น.' },
  custom: { companyName: 'Thai Innovation Public Company Limited', employeeId: 'EMP00999', lineId: 'namwan12n', drivingLicense: '697823405', position: 'Lead Operation Digital Platform' },
};
