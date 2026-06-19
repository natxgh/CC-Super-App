import type { CustomerData } from '../../customer-profile/pages/CustomerFormPage';

/**
 * Real Example Data — Customer Appointment (CAP)
 * ตรงกับ Arrange ใน 02-Customer Appointment/customer-appointment-test-design.md (sync base export 16/06/2026)
 *
 * NB (data gap): API seed สร้างได้แค่ "ตัวลูกค้า" — ยังไม่มี endpoint seed "appointment list".
 *   → CUST_HAS_APPT ที่ seed มาจะ "ยังไม่มี" appointment rows (ใช้ verify navigation/Schedule button ได้)
 *     ส่วนเคสที่ต้องมี Pending row จริง (Confirm/Delete) = fixme อยู่แล้ว.
 */

/** ลูกค้าที่ใช้ View / Add / Confirm / Delete (Arrange: Siriwimon Somjit) */
export const CUST_HAS_APPT: CustomerData = {
  email: 'siriwimon.somjit@gmail.com',
  phone: '0823456789',
  title: 'Ms.',
  firstName: 'Siriwimon',
  middleName: '-',
  lastName: 'Somjit',
  gender: 'Female',
  landline: '0824445566',
  type: 'Gold',
  dob: '14/03/2533',
  registered: {
    houseNo: '88', room: '-', floor: '12', building: 'Asoke Tower',
    street: 'Asok Montri', province: 'Bangkok', district: 'Watthana',
    subdistrict: 'Khlong Toei Nuea', postalCode: '10110', country: 'Thailand',
  },
  sameAsRegistered: true,
  preferences: { contactMethod: 'Mobile Number', language: 'Thai' },
  custom: { companyName: 'Siam Tech Solutions', employeeId: 'EA000012', lineId: 'siriwimon.s', position: 'Marketing Lead' },
};

/** ลูกค้าที่ "ไม่มี" appointment — ใช้เคส Empty State (Arrange: Wannida Pongprai) */
export const CUST_NO_APPT: CustomerData = {
  email: 'wannida.pongprai@gmail.com',
  phone: '0834567890',
  title: 'Ms.',
  firstName: 'Wannida',
  middleName: '-',
  lastName: 'Pongprai',
  gender: 'Female',
  type: 'Silver',
  dob: '02/11/2538',
  registered: {
    houseNo: '21/4', room: '305', floor: '3', building: 'Lumpini Place',
    street: 'Rama IV', province: 'Bangkok', district: 'Pathum Wan',
    subdistrict: 'Lumphini', postalCode: '10330', country: 'Thailand',
  },
  sameAsRegistered: true,
  preferences: { contactMethod: 'Email', language: 'Thai' },
  custom: { lineId: 'wannida.p' },
};

/** displayName ที่คาดว่าจะเห็นใน list/row */
export const NAME_HAS_APPT = 'Siriwimon Somjit';
export const NAME_NO_APPT = 'Wannida Pongprai';

/** appointment ใหม่ที่จะเพิ่ม (TS-02 / TS-03) — option values ตาม base export */
export const NEW_APPT = {
  appointmentType: 'Maintenance',
  serviceType: 'General Maintenance',
  appointDate: '11/29/2026 16:00',          // future (BVA: future = pass) — format mm/dd/yyyy (verified)
  note: 'Customer requests a morning slot before 12:00',
};

/** แถวที่ pre-seed เป็น Pending (มีปุ่ม Confirm + Bin) — ใช้ match row ใน Confirm/Delete */
export const PENDING_ROW = 'Follow Up'; // appointment #2 ใน Arrange = Follow Up / Installation / Pending

/** BVA ของ Appoint Date — format mm/dd/yyyy (verified) */
export function yesterdayMMDDYYYY(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}
