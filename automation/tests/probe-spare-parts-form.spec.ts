/**
 * DOM Probe — Spare Parts Add Form + Item Details modal
 * Run: npx playwright test tests/probe-spare-parts-form.spec.ts --headed --workers=1
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../shared/pages/LoginPage';

const ORG  = process.env.CP_ORG || 'BMA';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || 'Skyai@123';

test('probe: Add form + Item Details modal', async ({ page }) => {
  // ── Login (real flow — English UI) ───────────────────────────────────────
  const login = new LoginPage(page);
  await login.goto();
  await login.login({ org: ORG, username: USER, password: PASS });
  await page.goto('/cms/inventory/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);

  // ── PART A: Item Details modal ───────────────────────────────────────────
  console.log('\n=== PART A: Click View on first card ===');
  const firstViewBtn = page.locator('div.bg-white.border.rounded-lg').first()
    .getByRole('button', { name: 'View', exact: true });
  await firstViewBtn.click();
  await page.waitForTimeout(1500);

  // modal structure
  const modalHTML = await page.evaluate(() => {
    const fixed = document.querySelectorAll('div.fixed.inset-0');
    return [...fixed].map(el => el.innerHTML.slice(0, 3000)).join('\n\n---\n\n');
  });
  console.log('Fixed overlays HTML:\n', modalHTML.slice(0, 5000));

  // buttons inside modal
  const modalBtns = await page.evaluate(() => {
    const fixed = document.querySelectorAll('div.fixed.inset-0');
    return [...fixed].flatMap(el =>
      [...el.querySelectorAll('button')].map(b => ({
        text: b.textContent?.trim().slice(0, 60),
        cls: b.className.slice(0, 80),
      }))
    );
  });
  console.log('\nModal buttons:', JSON.stringify(modalBtns, null, 2));

  await page.screenshot({ path: '/tmp/probe-detail-modal.png' });
  console.log('Screenshot: /tmp/probe-detail-modal.png');

  // close modal — click "Close" button inside modal
  await page.locator('div.fixed.inset-0').getByRole('button', { name: 'Close', exact: true }).click().catch(() => {});
  await page.waitForTimeout(800);

  // ── PART B: Add Form ─────────────────────────────────────────────────────
  console.log('\n=== PART B: Click Create Spare Parts button ===');
  await page.getByRole('button', { name: /Create Spare Parts?/i }).click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(2000);
  console.log('URL after click:', page.url());

  // all inputs on the form page
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
      tag: el.tagName,
      type: (el as HTMLInputElement).type,
      name: (el as HTMLInputElement).name,
      id: el.id,
      placeholder: (el as HTMLInputElement).placeholder,
      cls: el.className.slice(0, 80),
    }))
  );
  console.log('\nForm inputs:\n', JSON.stringify(inputs, null, 2));

  // all labels
  const labels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('label')).map(l => ({
      text: l.textContent?.trim().slice(0, 60),
      forAttr: l.htmlFor,
    }))
  );
  console.log('\nForm labels:\n', JSON.stringify(labels, null, 2));

  // all buttons on form page
  const formBtns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.textContent?.trim().slice(0, 60),
      cls: b.className.slice(0, 80),
      svgCls: b.querySelector('svg')?.getAttribute('class')?.slice(0, 60) ?? null,
    }))
  );
  console.log('\nForm buttons:\n', JSON.stringify(formBtns, null, 2));

  // form page main HTML (3k)
  const formHTML = await page.evaluate(() =>
    (document.querySelector('main, form, [class*="form"]') || document.body).innerHTML.slice(0, 5000)
  );
  console.log('\nForm main HTML:\n', formHTML);

  await page.screenshot({ path: '/tmp/probe-add-form.png' });
  console.log('\nScreenshot: /tmp/probe-add-form.png');

  expect(page.url()).toBeTruthy();
});
