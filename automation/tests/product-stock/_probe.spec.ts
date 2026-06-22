import { test } from '@playwright/test';
import * as fs from 'fs';
import { LoginPage } from '../../shared/pages/LoginPage';

const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME || '';
const PASS = process.env.CP_PASSWORD || '';

function dump(name: string, txt: string) {
  fs.mkdirSync('test-results/probe', { recursive: true });
  fs.writeFileSync(`test-results/probe/${name}.yaml`, txt);
}

test('probe products/stock page + detail modal', async ({ page }) => {
  test.setTimeout(180_000);
  const login = new LoginPage(page);
  await login.goto();
  await login.login({ org: ORG, username: USER, password: PASS });

  // ── probe /cms/products/stock — Add button + row structure ──
  await page.goto('/cms/products/stock', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  dump('08-products-stock-list', await page.locator('body').ariaSnapshot());

  // ── probe Add modal on products/stock ──
  const addBtn = page.getByRole('button', { name: /Add Product Stock/i });
  if (await addBtn.count() > 0) {
    await addBtn.click();
    await page.waitForTimeout(1500);
    dump('09-add-product-stock-modal', await page.locator('body').ariaSnapshot());
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  } else {
    dump('09-add-product-stock-modal', 'ADD BUTTON NOT FOUND on /cms/products/stock\n');
  }

  // ── probe detail modal from products/stock — click "View" on first row ──
  await page.goto('/cms/products/stock', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const viewBtn = page.getByRole('button', { name: /^View$/i }).first();
  if (await viewBtn.count() > 0) {
    await viewBtn.click();
    await page.waitForTimeout(1500);
    dump('10-stock-detail-view', await page.locator('body').ariaSnapshot());
    await page.keyboard.press('Escape').catch(() => {});
  }
});
