import type { CustomerData } from '../../customer-profile/pages/CustomerFormPage';

/**
 * Real Example Data — Customer Appointment (CAP)
 * ตรงกับ Arrange ใน customer-appointment-testcases.xlsx (column "Arrange")
 *
 * Base Arrange ทุก TS (CUST_HAS_APPT = Siriwimon Somjit):
 *   #1 SEED_CONFIRMED_APPT — Present / Advise product / 20 Oct 2026 09:00 / Confirmed
 *      ⚠️ API CreateAppointment สร้างเป็น Pending เสมอ → status "Confirmed" ต้อง confirm ผ่าน UI/probe mutation
 *   #2 SEED_PENDING_APPT   — Follow Up / Installation / 12 Nov 2026 14:30 / Pending
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

/**
 * Arrange #1 — Present / Advise product / 20 Oct 2026 09:00 AM ICT
 * (Design: Status=Confirmed แต่ API สร้างเป็น Pending → ต้อง confirm ต่อผ่าน mutation ถ้า FE fix bug แล้ว)
 */
export const SEED_CONFIRMED_APPT = {
  appointmentType: 'Present',
  serviceType: 'Advise product',
  appointDate: '2026-10-20T02:00:00Z', // 09:00 ICT = 02:00 UTC
  note: 'Onsite customer office' as string | undefined,
};

/**
 * Arrange #2 — Follow Up / Installation / 12 Nov 2026 02:30 PM ICT / Pending
 * (TS-04/05: row ที่ใช้ Confirm + Delete — match PENDING_ROW = 'Follow Up')
 */
export const SEED_PENDING_APPT = {
  appointmentType: 'Follow Up',
  serviceType: 'Installation',
  appointDate: '2026-11-12T14:30:00Z', // 14:30 ICT = 07:30 UTC
  note: undefined as string | undefined,
};

/** BVA ของ Appoint Date — format mm/dd/yyyy (verified) */
export function yesterdayMMDDYYYY(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}
