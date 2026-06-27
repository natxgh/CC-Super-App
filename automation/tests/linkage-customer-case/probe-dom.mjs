// Throwaway DOM probe for Linkage feature — READ-ONLY (login → open modals → dump roles/selectors).
// Does NOT save a case or create a customer. Run: node tests/linkage-customer-case/probe-dom.mjs
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// load .env
const envPath = path.join(process.cwd(), '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const BASE = process.env.CP_BASE_URL;
const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || '';
const OUT = 'test-results/probe';
fs.mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log(...a);
const dump = async (page, label) => {
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: true }).catch(() => {});
};

// summarise interactive elements currently on screen
async function roles(page, root = 'body') {
  return await page.evaluate((sel) => {
    const scope = document.querySelector(sel) || document.body;
    const out = { buttons: [], inputs: [], tabs: [], headers: [], dialogTitles: [] };
    scope.querySelectorAll('button').forEach(b => { const t = (b.innerText || b.getAttribute('aria-label') || '').trim(); if (t) out.buttons.push(t.slice(0, 40)); });
    scope.querySelectorAll('input,textarea').forEach(i => out.inputs.push({ name: i.getAttribute('name'), ph: i.getAttribute('placeholder'), type: i.getAttribute('type') }));
    scope.querySelectorAll('[role=tab]').forEach(t => out.tabs.push((t.innerText || '').trim().slice(0, 30)));
    scope.querySelectorAll('th').forEach(h => { const t = (h.innerText || '').trim(); if (t) out.headers.push(t.slice(0, 30)); });
    scope.querySelectorAll('[role=dialog]').forEach(d => out.dialogTitles.push((d.innerText || '').trim().slice(0, 80)));
    return out;
  }, root);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: BASE });
const page = await ctx.newPage();
try {
  // ── login ──
  log('→ login', BASE, 'org=', ORG);
  await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
  await page.locator('#username').waitFor({ timeout: 20000 });
  await page.locator('#organization').fill(ORG);
  await page.locator('#username').fill(USER);
  await page.locator('#password').fill(PASS);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 25000 });
  await page.evaluate(() => localStorage.setItem('language', 'en'));
  log('✓ login ok');

  // ── case creation ──
  await page.goto('/cms/case/creation', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Linked Existing/i }).waitFor({ timeout: 20000 });
  await dump(page, '01-creation');
  log('\n=== CREATION PAGE roles ===');
  log(JSON.stringify(await roles(page), null, 0).slice(0, 1500));

  // ── Linked Existing modal ──
  log('\n=== open Linked Existing ===');
  await page.getByRole('button', { name: /Linked Existing/i }).click();
  await page.getByRole('dialog').waitFor({ timeout: 15000 }).catch(() => log('  ⚠️ no role=dialog appeared'));
  await page.waitForTimeout(1500);
  await dump(page, '02-linked-existing');
  log(JSON.stringify(await roles(page, '[role=dialog]'), null, 0).slice(0, 2000));
  const searchPh = await page.locator('[role=dialog] input').evaluateAll(els => els.map(e => e.placeholder));
  log('  dialog input placeholders:', JSON.stringify(searchPh));
  const selBtns = await page.getByRole('button', { name: /^Select$/i }).count();
  log('  "Select" buttons in dialog:', selBtns);
  const footer = await page.getByText(/Showing/i).first().innerText().catch(() => '(none)');
  log('  footer:', footer);

  // close modal (Esc) and open Add Customer
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(800);
  log('\n=== open Add Customer ===');
  await page.getByRole('button', { name: /Add Customer/i }).click().catch(e => log('  ⚠️ Add Customer click:', e.message));
  await page.getByRole('dialog').waitFor({ timeout: 15000 }).catch(() => log('  ⚠️ no dialog'));
  await page.waitForTimeout(1200);
  await dump(page, '03-add-customer');
  log(JSON.stringify(await roles(page, '[role=dialog]'), null, 0).slice(0, 2000));

  log('\n✓ probe done — screenshots in', OUT);
} catch (e) {
  log('✗ probe error:', e.message);
  await dump(page, 'error');
} finally {
  await browser.close();
}
