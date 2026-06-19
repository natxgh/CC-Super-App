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
  timeout: 90_000, // หลาย TC/scenario + fullPage screenshots ราย step + API seed
  expect: { timeout: 10_000 },
  fullyParallel: false, // เทสมี shared customer data + teardown → รันเรียงกันปลอดภัยกว่า
  retries: process.env.CI ? 2 : 1, // local 1 — กัน flaky จาก search index lag (eventual consistency)
  reporter: [['list'], ['html', { open: 'never' }]],
  // teardown แบบ API DELETE ตาม ID ที่ seed สร้าง (ดู teardown/global-teardown.ts)
  globalTeardown: process.env.CP_TEARDOWN ? './tests/customer-profile/teardown/global-teardown.ts' : undefined,
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
