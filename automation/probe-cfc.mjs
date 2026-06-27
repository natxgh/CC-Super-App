// Live-DOM probe — Customer Form Configuration (READ-ONLY: login + navigate + open builder in-memory, no Save)
// run: node probe-cfc.mjs   (from automation/)
import { chromium } from '@playwright/test';
import * as fs from 'fs';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const BASE = process.env.CP_BASE_URL;
const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME;
const PASS = process.env.CP_PASSWORD;

const out = [];
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };

async function dump(scope, kind) {
  return scope.evaluate((r) => {
    const sel = {
      switch: '[role="switch"],button[role="switch"]',
      button: 'button,[role="button"]',
      combobox: '[role="combobox"],select',
      dialog: '[role="dialog"],[class*="modal" i]',
      heading: 'h1,h2,h3,h4,[role="heading"]',
      checkbox: 'input[type="checkbox"],[role="checkbox"]',
      spinbutton: 'input[type="number"],[role="spinbutton"]',
      textbox: 'input[type="text"],input:not([type]),textarea',
    }[r] || r;
    const res = [];
    document.querySelectorAll(sel).forEach((el) => {
      const name = el.getAttribute('aria-label') || el.getAttribute('name') || el.getAttribute('placeholder')
        || (el.id ? '#' + el.id : '') || (el.textContent || '').trim().slice(0, 45);
      const checked = el.getAttribute('aria-checked') ?? (el.checked != null ? String(el.checked) : '');
      res.push({ name, checked });
    });
    return res;
  }, kind);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ ignoreHTTPSErrors: true, baseURL: BASE });
  try {
    log('### LOGIN');
    await page.goto('/cc/contacts-list');
    await page.locator('#username').waitFor({ timeout: 20000 });
    await page.locator('#organization').fill(ORG);
    await page.locator('#username').fill(USER);
    await page.locator('#password').fill(PASS);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    log('login OK\n');

    log('### CONFIG PAGE /cc/contacts-configurations');
    await page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);

    log('\n-- HEADINGS --');
    for (const h of await dump(page, 'heading')) if (h.name) log('  heading:', JSON.stringify(h.name));
    log('\n-- SWITCHES (role=switch) --');
    const sw = await dump(page, 'switch');
    log(`  count=${sw.length}`);
    for (const s of sw.slice(0, 60)) log('  switch:', JSON.stringify(s.name), 'checked=' + s.checked);
    log('\n-- CHECKBOXES --');
    const cbs = await dump(page, 'checkbox');
    log(`  count=${cbs.length}`);
    for (const c of cbs.slice(0, 60)) log('  checkbox:', JSON.stringify(c.name), 'checked=' + c.checked);
    log('\n-- COMBOBOX/SELECT --');
    for (const c of await dump(page, 'combobox')) log('  combobox:', JSON.stringify(c.name));
    log('\n-- BUTTONS (filtered) --');
    for (const b of await dump(page, 'button')) if (/Add|Edit|Save|Delete|Import|Export|Preview|Hide|Show/i.test(b.name)) log('  button:', JSON.stringify(b.name));

    log('\n### OPEN BUILDER (Add) — in-memory, no Save');
    const cf = page.getByRole('switch', { name: 'Custom Form' });
    if (await cf.count() && !(await cf.first().isChecked().catch(() => true))) await cf.first().click();
    const addBtn = page.getByRole('button', { name: 'Add', exact: true });
    if (await addBtn.count()) {
      await addBtn.first().click();
      await page.waitForTimeout(2500);
      log('\n-- DIALOG --');
      for (const d of await dump(page, 'dialog')) log('  dialog:', JSON.stringify((d.name || '').slice(0, 60)));
      log('\n-- BUILDER TEXTBOXES --');
      for (const t of (await dump(page, 'textbox')).slice(0, 30)) log('  textbox:', JSON.stringify(t.name));
      log('\n-- BUILDER SPINBUTTON --');
      for (const t of await dump(page, 'spinbutton')) log('  spinbutton:', JSON.stringify(t.name));
      log('\n-- BUILDER BUTTONS --');
      const bb = await dump(page, 'button');
      log(`  count=${bb.length}`);
      for (const b of bb.slice(0, 90)) if (b.name) log('  button:', JSON.stringify(b.name));

      // try add a Text field to inspect per-field config
      const textBtn = page.getByRole('button', { name: 'Text', exact: true }).or(page.getByText('Text', { exact: true }));
      if (await textBtn.count()) {
        await textBtn.first().click().catch(() => {});
        await page.waitForTimeout(1500);
        log('\n-- AFTER ADD TEXT: textboxes --');
        for (const t of (await dump(page, 'textbox')).slice(0, 30)) log('  textbox:', JSON.stringify(t.name));
        log('-- AFTER ADD TEXT: checkboxes --');
        for (const c of (await dump(page, 'checkbox')).slice(0, 20)) log('  checkbox:', JSON.stringify(c.name));
        log('-- AFTER ADD TEXT: combobox --');
        for (const c of await dump(page, 'combobox')) log('  combobox:', JSON.stringify(c.name));
      }
    } else {
      log('  !! no Add button found');
    }
    log('\n### DONE — closing without Save (no mutation)');
  } catch (e) {
    log('PROBE ERROR:', e.message);
  } finally {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/cfc-dom-probe.txt', out.join('\n'));
    await browser.close();
  }
})();
