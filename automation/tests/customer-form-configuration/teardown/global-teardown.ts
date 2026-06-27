import { request } from '@playwright/test';
import { GQL, cachedToken, purgeTestForms, restoreFieldConfig } from '../fixtures/form-seed';

/**
 * Global Teardown — Customer Form Configuration
 * เปิดใช้เมื่อ env CFC_TEARDOWN=1 (ดู playwright.config.ts)
 *
 * 2 อย่างที่ test ทิ้งไว้บน staging (shared) → ต้องคืนสภาพ:
 *   1) Custom Forms ที่ test สร้าง → DeleteForms (hard delete) by name (qa-automation marker)
 *   2) Default Field Config (global singleton) → restore จาก snapshot (UpdateCustomerForm)
 *      ⚠️ ไม่มี delete — เป็น config ทั้ง org → ต้อง restore ค่าเดิมที่ snapshot ไว้ก่อน test แตะ
 *
 * token = cache ที่ login/seed เขียนไว้ (test-results/.token) — ไม่ login ซ้ำ
 */
export default async function globalTeardown() {
  const token = cachedToken();
  if (!token) {
    console.log('[cfc-teardown] ไม่มี token cache (ยังไม่ได้ login) → ข้าม');
    return;
  }
  const req = await request.newContext({ ignoreHTTPSErrors: true });

  // 1) ลบ custom form ที่ test สร้าง
  const formsDeleted = await purgeTestForms(req, token).catch((e) => { console.warn('[cfc-teardown] purgeTestForms error:', e?.message); return 0; });
  console.log(`[cfc-teardown] DeleteForms (custom form ที่ test สร้าง) → ${formsDeleted} record`);

  // 2) restore Default Field Config เดิม (global) จาก snapshot
  const restored = await restoreFieldConfig(req, token).catch((e) => { console.warn('[cfc-teardown] restoreFieldConfig error:', e?.message); return false; });
  console.log(`[cfc-teardown] restore Default Field Config → ${restored ? 'OK (คืนค่าเดิมแล้ว)' : 'ข้าม (ไม่มี snapshot / DFC ไม่ถูกแตะ)'}`);

  await req.dispose();
  console.log(`[cfc-teardown] เสร็จสิ้น — endpoint ${GQL}`);
}
