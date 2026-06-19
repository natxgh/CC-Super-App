import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// minimal .env loader (no extra dependency)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// ⚠️ baseURL ที่ใส่เป็น "STG" เป็นเพียง placeholder อ้างอิงเท่านั้น
// env จริงสำหรับเทสต้องเป็น "QA" — เมื่อได้ URL QA แล้วตั้ง CC_BASE_URL=<qa-url>
// เทสทุกตัวถูก skip จนกว่าจะตั้ง CC_BASE_URL (และ CC_PASSWORD สำหรับเคสที่ต้อง auth จริง)
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ['./reporters/execution-reporter.ts']],
  use: {
    baseURL: process.env.CC_BASE_URL || 'https://skyai-cloud-cc-stg.metthier.ai:65000/cms',
    headless: true,
    ignoreHTTPSErrors: true, // self-hosted cert บน :65000
    screenshot: 'on', // เก็บทุกเคส: pass = หลักฐาน Result Note, fail = แนบ bug card
    trace: 'on-first-retry',
    video: 'on', // อัดวิดีโอทั้ง flow ต่อ 1 scenario (หลักฐาน walkthrough)
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
