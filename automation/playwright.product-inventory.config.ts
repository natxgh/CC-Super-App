import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export default defineConfig({
  testDir: './tests/product-inventory',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  outputDir: 'test-results/product-inventory-artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/product-inventory-results.json' }],
  ],
  use: {
    baseURL: process.env.CP_BASE_URL || 'https://skyai-cloud-cc-qa.one-sky.ai',
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
