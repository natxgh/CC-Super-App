import base from './playwright.config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...base,
  testDir: './tests/product-stock',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/product-stock-results.json' }],
    ['html', { open: 'never' }],
  ],
  globalTeardown: undefined,
});
