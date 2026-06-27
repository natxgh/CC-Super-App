import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// minimal .env loader (no extra dependency) — mirrors qa-ai-pilot kit
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export default defineConfig({
  testDir: './tests',
  timeout: 180_000, // หลาย TC/scenario + fullPage screenshots ราย step + API seed · 180s: appointment dropdown API โหลดช้า (~10-30s ต่อ dropdown)
  expect: { timeout: 10_000 },
  fullyParallel: false, // เทสมี shared customer data + teardown → รันเรียงกันปลอดภัยกว่า
  retries: process.env.CI ? 2 : 1, // local 1 — กัน flaky จาก search index lag (eventual consistency)
  reporter: [['list'], ['html', { open: 'never' }]],
  // teardown แบบ API DELETE ตาม ID ที่ seed สร้าง (ดู teardown/global-teardown.ts)
  // CASE_TEARDOWN=1 → ลบ case + customer (Case feature) · CP_TEARDOWN=1 → ลบ customer (Customer feature)
  // PIM_TEARDOWN=1 → ลบ product ที่ automation สร้าง (Product & Inventory feature)
  // CFC_TEARDOWN=1 → ลบ custom form ที่ test สร้าง + restore Default Field Config (global) จาก snapshot
  globalTeardown: process.env.CFC_TEARDOWN
    ? './tests/customer-form-configuration/teardown/global-teardown.ts'
    : (process.env.PIM_TEARDOWN
      ? './tests/product-inventory/teardown/global-teardown.ts'
      : (process.env.CASE_TEARDOWN
        ? './tests/case-ticket-management/teardown/global-teardown.ts'
        : (process.env.CP_TEARDOWN ? './tests/customer-profile/teardown/global-teardown.ts' : undefined))),
  use: {
    // CC Super App staging — override ผ่าน env, ห้าม hardcode cred
    baseURL: process.env.CP_BASE_URL || 'https://skyai-cloud-cc-qa.one-sky.ai',
    headless: true,
    ignoreHTTPSErrors: true, // staging cert
    screenshot: 'on',        // เก็บทุกเคส: pass = evidence, fail = แนบ bug card
    trace: 'on-first-retry',
    video: 'on',             // คลิป walkthrough ต่อ 1 scenario
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
