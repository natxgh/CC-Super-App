import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, cachedToken, findIdsByEmail, deleteById } from '../fixtures/seed';
import { teardownSeededAppointments } from '../../customer-appointment/fixtures/appointment-seed';
import { teardownSeededOrders } from '../../order-management/fixtures/order-seed';
import { teardownSeededProductStock } from '../../product-stock/fixtures/product-stock-seed';

/**
 * Global Teardown — ลบ Customer ที่ seed สร้าง ผ่าน GraphQL DeleteCustomer
 * ✅ VERIFIED API: GetListCustomer (หา id by email) → DeleteCustomer(GetIdInput{id})
 * เปิดใช้เมื่อ env CP_TEARDOWN=1 (ดู playwright.config.ts)
 *
 * token = อ่านจาก cache ที่ seed เขียนไว้ (test-results/.token) — ไม่ต้อง login ซ้ำ
 * emails = test-results/seeded-emails.json (อีเมลที่ automation สร้าง = marker จำกัด scope)
 */
const EMAIL_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-emails.json');

export default async function globalTeardown() {
  const token = cachedToken();
  if (!token) {
    console.log('[teardown] ไม่มี token cache (ยังไม่ได้ seed/login) → ข้าม');
    return;
  }
  const req = await request.newContext({ ignoreHTTPSErrors: true });

  // ── cross-feature teardown (รันก่อนเสมอ — ไม่ผูกกับ customer seed) ──────────────
  // ลบ appointment ที่ seed ก่อน (เผื่อ DeleteCustomer ไม่ cascade) — ดู customer-appointment/fixtures/appointment-seed.ts
  const apptDeleted = await teardownSeededAppointments(req, token).catch(() => 0);
  if (apptDeleted) console.log(`[teardown] ลบ appointment ที่ seed สร้าง → ${apptDeleted} record`);

  // Order Management — ⚠️ no DeleteOrder API → best-effort CancelOrder (soft). See order-seed.ts / FIXME-PLAN.md
  const ordCancelled = await teardownSeededOrders(req, token).catch(() => 0);
  if (ordCancelled) console.log(`[teardown] CancelOrder ออเดอร์ที่ seed สร้าง → ${ordCancelled} record (soft cancel — ไม่มี hard delete)`);

  // Product Stock — ✅ hard delete via DeleteProductStock(productId, serialNumber). See product-stock-seed.ts
  const stockDeleted = await teardownSeededProductStock(req, token).catch(() => 0);
  if (stockDeleted) console.log(`[teardown] ลบ product stock unit ที่ seed สร้าง → ${stockDeleted} record (hard delete)`);

  // ── customer teardown (skip if none seeded) ──────────────────────────────────
  const emails: string[] = fs.existsSync(EMAIL_STORE) ? JSON.parse(fs.readFileSync(EMAIL_STORE, 'utf8')) : [];
  if (!emails.length) {
    await req.dispose();
    console.log('[teardown] ไม่มี customer ที่ seed → เสร็จสิ้น (cross-feature teardown ทำแล้ว)');
    return;
  }

  console.log(`[teardown] ลบ customer ที่ seed สร้าง (${emails.length} อีเมล) ผ่าน ${GQL}`);
  let deleted = 0;
  for (const email of emails) {
    const ids = await findIdsByEmail(req, token, email).catch(() => []);
    for (const id of ids) {
      const ok = await deleteById(req, token, id).catch(() => false);
      console.log(`  DeleteCustomer id=${id} (${email}) → ${ok ? 'OK' : 'fail'}`);
      if (ok) deleted++;
    }
  }
  await req.dispose();
  fs.writeFileSync(EMAIL_STORE, '[]');
  console.log(`[teardown] เสร็จสิ้น — ลบไป ${deleted} record`);
}
