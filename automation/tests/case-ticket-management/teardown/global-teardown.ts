import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, cachedToken, findIdsByEmail, deleteById } from '../../customer-profile/fixtures/seed';
import { teardownSeededCases } from '../fixtures/case-seed';

/**
 * Global Teardown — Case and Ticket Management
 * ลบ Case ที่ automation seed/สร้างผ่าน UI (seeded-cases.json) ผ่าน GraphQL DeleteCase
 * แล้วลบ Customer ที่ seed (seeded-emails.json) ด้วย — กัน junk ค้างบน SIT
 * เปิดใช้เมื่อ env CASE_TEARDOWN=1 (ดู playwright.config.ts)
 *
 * token = อ่านจาก cache ที่ seed เขียนไว้ (test-results/.token) — ไม่ต้อง login ซ้ำ
 */
const EMAIL_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-emails.json');

export default async function globalTeardown() {
  const token = cachedToken();
  if (!token) { console.log('[case-teardown] ไม่มี token cache → ข้าม'); return; }

  const req = await request.newContext({ ignoreHTTPSErrors: true });

  const caseDeleted = await teardownSeededCases(req, token).catch((e) => { console.log('[case-teardown] case error:', e?.message); return 0; });
  console.log(`[case-teardown] ลบ case ที่ automation สร้าง → ${caseDeleted} record (ผ่าน ${GQL})`);

  // ลบ customer ที่ seed ด้วย (ถ้ามี)
  let custDeleted = 0;
  if (fs.existsSync(EMAIL_STORE)) {
    const emails: string[] = JSON.parse(fs.readFileSync(EMAIL_STORE, 'utf8'));
    for (const email of emails) {
      const ids = await findIdsByEmail(req, token, email).catch(() => []);
      for (const id of ids) { if (await deleteById(req, token, id).catch(() => false)) custDeleted++; }
    }
    fs.writeFileSync(EMAIL_STORE, '[]');
  }
  if (custDeleted) console.log(`[case-teardown] ลบ customer ที่ seed → ${custDeleted} record`);

  await req.dispose();
  console.log('[case-teardown] เสร็จสิ้น');
}
