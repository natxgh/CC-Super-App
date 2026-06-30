import base from './playwright.config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...base,
  testDir: './tests/customer-appointment',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/appointment-results.json' }],
    ['html', { open: 'never' }],
  ],
  globalTeardown: process.env.CP_TEARDOWN ? './tests/customer-appointment/teardown/global-teardown.ts' : undefined,
});
