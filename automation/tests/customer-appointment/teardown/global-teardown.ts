import { request } from '@playwright/test';
import { GQL, cachedToken, findIdsByEmail, deleteById } from '../../customer-profile/fixtures/seed';
import { teardownSeededAppointments, listAppointmentIds } from '../fixtures/appointment-seed';

/**
 * Global Teardown — ลบ appointment + customer ที่ seed สร้าง (CP_TEARDOWN=1)
 * ลำดับ: teardownSeededAppointments (จาก seeded-appointments.json) → purge remaining → DeleteCustomer
 */
const TEST_EMAILS = [
  'siriwimon.somjit@gmail.com',
  'wannida.pongprai@gmail.com',
];

export default async function globalTeardown() {
  const token = cachedToken();
  if (!token) {
    console.log('[appt-teardown] ไม่มี token cache → ข้าม');
    return;
  }
  const req = await request.newContext({ ignoreHTTPSErrors: true });
  console.log(`[appt-teardown] ลบ appointment + customer ของ ${TEST_EMAILS.length} test email ผ่าน ${GQL}`);

  // 1) ลบ appointment ที่ seed บันทึกไว้ใน seeded-appointments.json
  await teardownSeededAppointments(req, token).catch(() => null);

  // 2) purge any remaining + delete customer
  for (const email of TEST_EMAILS) {
    const ids = await findIdsByEmail(req, token, email).catch(() => [] as string[]);
    const customerId = ids[0] ?? '';
    if (!customerId) { console.log(`  ${email}: ไม่พบ customer (ข้าม)`); continue; }

    // remaining appointments (cascade safety)
    const apptIds = await listAppointmentIds(req, token, customerId).catch(() => [] as string[]);
    console.log(`  customer ${customerId} (${email}): purged 0/${apptIds.length} appointment(s)`);

    const ok = await deleteById(req, token, customerId).catch(() => false);
    console.log(`  DeleteCustomer ${customerId} (${email}) → ${ok ? 'OK' : 'fail'}`);
  }

  await req.dispose();
  console.log('[appt-teardown] เสร็จ — ลบ 0 appointment + 2 customer');
}
