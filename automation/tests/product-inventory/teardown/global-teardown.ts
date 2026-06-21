import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, cachedToken, findIdsByCode, deleteById } from '../fixtures/product-seed';

/**
 * Global Teardown — ลบ Product ที่ automation seed/สร้าง ผ่าน GraphQL DeleteProduct
 * ✅ VERIFIED ops: GetListProduct (หา id by productCode) → DeleteProduct(GetIdInput{id})
 * เปิดใช้เมื่อ env PIM_TEARDOWN=1 (ดู playwright.config.ts) — หรือ `npm run teardown:product`
 *
 * token  = อ่านจาก cache ที่ seed เขียนไว้ (test-results/.token) — ไม่ต้อง login ซ้ำ
 * codes  = test-results/seeded-products.json (productCode ที่ automation สร้าง = marker จำกัด scope)
 *          → ลบเฉพาะของที่ automation สร้าง ไม่แตะ catalog จริง (XIA-RVX20 / XIA-FREEBIE / ฯลฯ)
 */
const CODE_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-products.json');

export default async function globalTeardown() {
  const token = cachedToken();
  if (!token) { console.log('[pim-teardown] ไม่มี token cache (ยังไม่ได้ seed/login) → ข้าม'); return; }
  if (!fs.existsSync(CODE_STORE)) { console.log('[pim-teardown] ไม่มี seeded-products.json → ไม่มีอะไรต้องลบ'); return; }

  const codes: string[] = JSON.parse(fs.readFileSync(CODE_STORE, 'utf8'));
  if (!codes.length) { console.log('[pim-teardown] ไม่มี product ที่ seed สร้าง'); return; }

  const req = await request.newContext({ ignoreHTTPSErrors: true });
  console.log(`[pim-teardown] ลบ product ที่ automation สร้าง (${codes.length} code) ผ่าน ${GQL}`);
  let deleted = 0;
  for (const code of codes) {
    const ids = await findIdsByCode(req, token, code).catch(() => [] as string[]);
    for (const id of ids) {
      const ok = await deleteById(req, token, id).catch(() => false);
      console.log(`  DeleteProduct id=${id} (${code}) → ${ok ? 'OK' : 'fail'}`);
      if (ok) deleted++;
    }
  }
  await req.dispose();
  fs.writeFileSync(CODE_STORE, '[]');
  console.log(`[pim-teardown] เสร็จสิ้น — ลบไป ${deleted} record`);
}
