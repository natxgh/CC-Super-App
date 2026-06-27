// Probe v2b — builder per-field config (READ-ONLY, no Save) — page-level, exclude page toggles
import { chromium } from '@playwright/test';
import * as fs from 'fs';
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { CP_BASE_URL: BASE, CP_ORG: ORG = '', CP_USERNAME: USER, CP_PASSWORD: PASS } = process.env;
const out = []; const log = (...a) => { out.push(a.join(' ')); console.log(a.join(' ')); };
const EXCLUDE = /^(personal|address|currentAddress|contact|dynamicForm)-/;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ ignoreHTTPSErrors: true, baseURL: BASE });
  try {
    await page.goto('/cc/contacts-list');
    await page.locator('#username').waitFor({ timeout: 20000 });
    await page.locator('#organization').fill(ORG);
    await page.locator('#username').fill(USER);
    await page.locator('#password').fill(PASS);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Add', exact: true }).first().click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Text', exact: true }).first().click();
    await page.waitForTimeout(1500);

    const data = await page.evaluate((excludeSrc) => {
      const EX = new RegExp(excludeSrc);
      const inputs = [];
      document.querySelectorAll('input,textarea,select').forEach((el) => {
        const id = el.id || '';
        if (EX.test(id)) return; // skip page-level toggles
        let lbl = '';
        if (id) { const l = document.querySelector(`label[for="${id}"]`); if (l) lbl = l.textContent.trim(); }
        if (!lbl) { const p = el.closest('div'); const l = p && p.querySelector('label'); if (l) lbl = l.textContent.trim(); }
        inputs.push({ tag: el.tagName.toLowerCase(), type: el.type || '', id, name: el.getAttribute('name') || '', ph: el.getAttribute('placeholder') || '', label: lbl.slice(0, 28), checked: el.type === 'checkbox' ? el.checked : '' });
      });
      // field card candidates
      const cards = {};
      ['[data-field-id]', '[draggable="true"]', '[class*="field-card" i]', '[class*="layout-item" i]', '[id^="field-"]', '[class*="sortable" i]'].forEach((s) => { cards[s] = document.querySelectorAll(s).length; });
      return { inputs, cards };
    }, EXCLUDE.source);

    log('-- BUILDER INPUTS (excl. page toggles) --');
    for (const f of data.inputs) log(`  ${f.tag}[${f.type}] id="${f.id}" name="${f.name}" ph="${f.ph}" label="${f.label}" checked=${f.checked}`);
    log('\n-- FIELD CARD candidates --');
    for (const [k, v] of Object.entries(data.cards)) log(`  ${k} -> ${v}`);
  } catch (e) { log('ERR', e.message); }
  finally { fs.writeFileSync('test-results/cfc-dom-probe2.txt', out.join('\n')); await browser.close(); }
})();
