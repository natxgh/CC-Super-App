/**
 * DOM Probe — /cms/inventory/ (spare parts)
 * Run: npx playwright test probe-spare-parts.spec.ts --headed --workers=1
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.CP_BASE_URL || 'https://skyai-cloud-cc-qa.one-sky.ai';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || 'Skyai@123';

test('DOM probe: spare parts inventory page', async ({ page }) => {
  // ── 1. Login ──────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/cms/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const userInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i], input[placeholder*="email" i]').first();
  await userInput.fill(USER);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);
  console.log('After login URL:', page.url());

  // ── 1b. Force English (mirrors LoginPage.login() — localStorage.language = 'en') ──
  await page.evaluate(() => localStorage.setItem('language', 'en'));
  await page.waitForTimeout(300);

  // ── 2. Navigate ───────────────────────────────────────────────────────────
  await page.goto(`${BASE}/cms/inventory/`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
  console.log('Inventory URL:', page.url());

  // ── 3. Screenshot ─────────────────────────────────────────────────────────
  await page.screenshot({ path: '/tmp/spare-parts-probe.png', fullPage: false });

  // ── 4. All buttons ────────────────────────────────────────────────────────
  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.textContent?.trim().slice(0, 80),
      ariaLabel: b.getAttribute('aria-label'),
      cls: b.className.slice(0, 120),
      svgCls: b.querySelector('svg')?.getAttribute('class')?.slice(0, 80) ?? null,
    }))
  );
  console.log('\n=== BUTTONS ===');
  buttons.forEach((b, i) => console.log(`[${i}]`, JSON.stringify(b)));

  // ── 5. Item containers ────────────────────────────────────────────────────
  const containers = await page.evaluate(() =>
    ['tr', 'div.bg-white.border.rounded-lg', '[class*="card"]', '[class*="row"]', 'li', 'div[class*="item"]']
      .map(sel => ({
        sel,
        count: document.querySelectorAll(sel).length,
        firstCls: document.querySelector(sel)?.className?.slice(0, 100) ?? null,
        firstTxt: document.querySelector(sel)?.textContent?.trim().slice(0, 80) ?? null,
      }))
  );
  console.log('\n=== ITEM CONTAINERS ===');
  containers.forEach(c => console.log(JSON.stringify(c)));

  // ── 6. Inputs ─────────────────────────────────────────────────────────────
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type, placeholder: i.placeholder, name: i.name, id: i.id,
    }))
  );
  console.log('\n=== INPUTS ===');
  inputs.forEach(i => console.log(JSON.stringify(i)));

  // ── 7. SVG classes ────────────────────────────────────────────────────────
  const svgClasses = await page.evaluate(() => {
    const s = new Set<string>();
    document.querySelectorAll('svg').forEach(svg =>
      svg.className?.baseVal?.split(' ').forEach((c: string) => c && s.add(c))
    );
    return [...s].sort();
  });
  console.log('\n=== SVG CLASSES ===\n', svgClasses.join(', '));

  // ── 8. main HTML (first 10k) ──────────────────────────────────────────────
  const mainHTML = await page.evaluate(() =>
    (document.querySelector('main') || document.body).innerHTML.slice(0, 10000)
  );
  console.log('\n=== MAIN HTML (10k) ===\n', mainHTML);

  // probe always passes — we just want the logs
  expect(page.url()).toContain('inventory');
});
