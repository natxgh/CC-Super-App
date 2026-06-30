import { request } from '@playwright/test';
import { cachedToken } from '../../customer-profile/fixtures/seed';
import { teardownSeededOrders } from '../fixtures/order-seed';

/**
 * Global Teardown — Order Management (standalone, ORD_TEARDOWN=1)
 *
 * ⚠️ No DeleteOrder in API — uses CancelOrder (soft: records remain as "Cancel" status).
 *    TS-01 orders that reached Complete (OS009) cannot be cancelled (terminal state).
 *    See FIXME-PLAN.md for the ask-BE action item on DeleteOrder.
 *
 * token = อ่านจาก cache (test-results/.token) ที่ seed/login เขียนไว้ก่อนหน้า
 * order ids = test-results/seeded-orders.json (จาก seedOrder + recordOrder)
 */
export default async function globalTeardown() {
  const token = cachedToken();
  if (!token) {
    console.log('[order teardown] ไม่มี token cache → ข้าม');
    return;
  }
  const req = await request.newContext({ ignoreHTTPSErrors: true });
  const cancelled = await teardownSeededOrders(req, token).catch(() => 0);
  if (cancelled) {
    console.log(`[order teardown] CancelOrder ${cancelled} orders (soft cancel — ไม่มี hard delete)`);
  } else {
    console.log('[order teardown] ไม่มี order ที่ต้อง teardown (หรือ cancel ไม่สำเร็จ)');
  }
  await req.dispose();
}
