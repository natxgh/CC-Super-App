// Probe v6 — fix-targeted: canvas container, dropdown options, colSpan type, button texts
// READ-ONLY (no Save) — sets language='en' like the spec should do
import { chromium } from '@playwright/test';
import * as fs from 'fs';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { CP_BASE_URL: BASE, CP_ORG: ORG = '', CP_USERNAME: USER, CP_PASSWORD: PASS } = process.env;
const out = []; const log = (...a) => { out.push(a.join(' ')); console.log(a.join(' ')); };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ ignoreHTTPSErrors: true, baseURL: BASE });
  try {
    // ── Login ──
    await page.goto('/cc/contacts-list');
    await page.locator('#username').waitFor({ timeout: 20000 });
    await page.locator('#organization').fill(ORG);
    await page.locator('#username').fill(USER);
    await page.locator('#password').fill(PASS);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
    // Force English — same as we need to do in spec
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    log('login OK, language forced to en');

    // ── Navigate ──
    await page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // ═══════════════════════════════════════════════════
    // 1. Form Dropdown: click → inspect options
    // ═══════════════════════════════════════════════════
    log('\n=== 1. FORM DROPDOWN — options after click ===');
    // Enable custom form if needed
    const cfToggle = page.locator('#dynamicForm-enabled');
    if (await cfToggle.count() && !(await cfToggle.isChecked())) await cfToggle.click();
    await page.waitForTimeout(500);

    // Find the dropdown trigger
    const dropdownBtns = await page.evaluate(() => {
      return [...document.querySelectorAll('button')]
        .map(b => ({ text: (b.textContent||'').trim().slice(0,40), classes: [...b.classList].join(' ').slice(0,60) }))
        .filter(b => /customization|form|ฟอร์ม|Contact/i.test(b.text));
    });
    log('  Dropdown triggers:', JSON.stringify(dropdownBtns));

    // Click the first matching trigger
    if (dropdownBtns.length) {
      const btn = page.getByText(dropdownBtns[0].text, { exact: false }).first();
      await btn.click().catch(() => {});
      await page.waitForTimeout(800);
      // Dump all visible "option-like" elements
      const opts = await page.evaluate(() => {
        const tags = ['li','[role="option"]','[role="listitem"]','[class*="option" i]','[class*="item" i]','[class*="dropdown" i] *'];
        const seen = new Set();
        const items = [];
        for (const sel of tags) {
          for (const el of document.querySelectorAll(sel)) {
            if (seen.has(el)) continue; seen.add(el);
            const text = (el.textContent||'').trim().slice(0,40);
            if (!text) continue;
            items.push({ sel, tag: el.tagName.toLowerCase(), role: el.getAttribute('role')||'', text, classes: [...el.classList].join(' ').slice(0,60) });
          }
        }
        return items.slice(0,20);
      });
      log(`  Options after dropdown click (${opts.length}):`);
      for (const o of opts) log(`    tag=${o.tag} role="${o.role}" text="${o.text}" classes="${o.classes}"`);
    }

    // Press Escape to close dropdown
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);

    // ═══════════════════════════════════════════════════
    // 2. Open builder → inspect all buttons (real text)
    // ═══════════════════════════════════════════════════
    log('\n=== 2. BUILDER — open + all button texts ===');
    await page.getByRole('button', { name: 'Add', exact: true }).first()
      .click().catch(async () => {
        // Try Thai: เพิ่ม
        await page.getByRole('button', { name: /เพิ่ม|Add/i }).first().click();
      });
    await page.waitForTimeout(3000);

    const allBtns = await page.evaluate(() => {
      return [...document.querySelectorAll('button')]
        .map(b => ({ text: (b.textContent||b.getAttribute('aria-label')||'').trim().slice(0,40), visible: b.offsetParent !== null }))
        .filter(b => b.text && b.visible)
        .map(b => b.text);
    });
    log('  All visible button texts:');
    for (const t of allBtns) log(`    "${t}"`);

    // ═══════════════════════════════════════════════════
    // 3. Add Text field → inspect canvas container + colSpan element
    // ═══════════════════════════════════════════════════
    log('\n=== 3. ADD TEXT FIELD → canvas container ===');
    // Try clicking Text button (handle EN or TH)
    const addTextBtn = page.getByRole('button', { name: 'Text', exact: true }).first();
    if (await addTextBtn.count()) await addTextBtn.click();
    else await page.getByText(/^Text$|^ข้อความ$/, { exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(1500);

    // a. Find colSpan-select element type
    log('\n  a. colSpan-select element type:');
    const colSpanInfo = await page.evaluate(() => {
      const el = document.querySelector('[id^="colSpan-select-"]');
      if (!el) return { found: false };
      return {
        found: true,
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        role: el.getAttribute('role') || '',
        classes: [...el.classList].join(' ').slice(0,80),
        // If select, get options
        options: el.tagName === 'SELECT' ? [...el.querySelectorAll('option')].map(o => ({ val: o.value, text: o.textContent.trim() })) : [],
        // Parent info
        parentTag: el.parentElement ? el.parentElement.tagName.toLowerCase() : '',
        parentClasses: el.parentElement ? [...el.parentElement.classList].join(' ').slice(0,60) : '',
        // Siblings (look for option-like children in parent)
        siblings: el.parentElement ? [...el.parentElement.children].length : 0,
      };
    });
    log('  colSpan-select:', JSON.stringify(colSpanInfo, null, 2));

    // b. Find canvas container (the wrapper that holds ONLY field cards, not palette)
    log('\n  b. Canvas container candidates:');
    const canvasInfo = await page.evaluate(() => {
      const req = document.querySelector('[id^="required-"]');
      if (!req) return [{ err: 'no required- found' }];
      // Walk up from required, track what other divs contain multiple required- elements
      let card = req;
      for (let i = 0; i < 12; i++) {
        card = card.parentElement;
        if (!card) break;
        if (card.querySelector('[id^="required-"]') && card.querySelector('[id^="colSpan-select-"]')) break;
      }
      // Now walk up from card to find the canvas (contains multiple cards)
      const results = [];
      let el = card;
      for (let i = 0; i < 15; i++) {
        el = el.parentElement;
        if (!el || el === document.body) break;
        const allReqs = el.querySelectorAll('[id^="required-"]').length;
        const allCards = el.querySelectorAll('[id^="colSpan-select-"]').length;
        const tag = el.tagName.toLowerCase();
        const classes = [...el.classList].join(' ').slice(0,80);
        const id = el.id || '';
        results.push({ depth: i, tag, id, classes, reqCount: allReqs, cardCount: allCards, childrenCount: el.children.length });
        // Stop when we reach the modal level
        if (classes.includes('modal') || allReqs > 3) break;
      }
      return results;
    });
    for (const r of canvasInfo) log('  ' + JSON.stringify(r));

    // c. Count all div.space-y-4 with required- (the over-matching problem)
    log('\n  c. div.space-y-4 with required- count:');
    const spaceY4Count = await page.evaluate(() => {
      const all = [...document.querySelectorAll('div.space-y-4')];
      return all.map((el, i) => ({
        idx: i,
        hasRequired: !!el.querySelector('[id^="required-"]'),
        hasColSpan: !!el.querySelector('[id^="colSpan-select-"]'),
        childCount: el.children.length,
        classes: [...el.classList].join(' ').slice(0,60),
        parentClasses: el.parentElement ? [...el.parentElement.classList].join(' ').slice(0,60) : '',
        parentId: el.parentElement ? (el.parentElement.id || '') : '',
      })).filter(e => e.hasRequired);
    });
    log(`  Matching div.space-y-4 count: ${spaceY4Count.length}`);
    for (const e of spaceY4Count) log('  ' + JSON.stringify(e));

    // Add another field to see pattern
    if (await addTextBtn.count()) await addTextBtn.click();
    else await page.getByText(/^Text$|^ข้อความ$/, { exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(1000);
    const count2 = await page.evaluate(() => {
      return [...document.querySelectorAll('div.space-y-4')].filter(el => el.querySelector('[id^="required-"]')).length;
    });
    log(`  After 2nd field added: div.space-y-4 with required- = ${count2}`);

    log('\n=== DONE ===');
  } catch (e) {
    log('PROBE ERROR:', e.message);
  } finally {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/cfc-dom-probe6.txt', out.join('\n'));
    await browser.close();
  }
})();
