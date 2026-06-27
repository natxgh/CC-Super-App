// Probe v5 — find field card container + delete button (hover-reveal) + label/placeholder inputs
// READ-ONLY — no Save
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
    const cfToggle = page.locator('#dynamicForm-enabled');
    if (await cfToggle.count() && !(await cfToggle.isChecked())) await cfToggle.click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Add', exact: true }).first().click();
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: 'Text', exact: true }).first().click();
    await page.waitForTimeout(1500);

    // 1. Walk up from #required-<uuid> to find card ancestor
    log('=== 1. CARD CONTAINER — walking up from #required-<uuid> ===');
    const cardInfo = await page.evaluate(() => {
      const req = document.querySelector('[id^="required-"]');
      if (!req) return [{ err: 'no required- found' }];
      const results = [];
      let el = req;
      for (let i = 0; i < 12; i++) {
        el = el.parentElement;
        if (!el) break;
        const classes = [...el.classList].join(' ');
        const tag = el.tagName.toLowerCase();
        const childCount = el.children.length;
        // Check if this element contains all per-field controls
        const hasRequired = !!el.querySelector('[id^="required-"]');
        const hasColSpan  = !!el.querySelector('[id^="colSpan-select-"]');
        const hasShowLabel= !!el.querySelector('[id^="showLabel-toggle-"]');
        results.push({ depth: i, tag, classes: classes.slice(0, 100), childCount, hasRequired, hasColSpan, hasShowLabel });
        if (hasRequired && hasColSpan && hasShowLabel) {
          results.push({ FOUND: true, depth: i, fullClass: classes });
          break;
        }
      }
      return results;
    });
    for (const r of cardInfo) log('  ' + JSON.stringify(r));

    // 2. Find delete button — try hover on the card
    log('\n=== 2. DELETE BUTTON — hover on card, then search ===');
    // First find the card using the ancestor info
    const cardSelector = await page.evaluate(() => {
      const req = document.querySelector('[id^="required-"]');
      if (!req) return null;
      let el = req;
      for (let i = 0; i < 12; i++) {
        el = el.parentElement;
        if (!el) break;
        if (el.querySelector('[id^="required-"]') && el.querySelector('[id^="colSpan-select-"]') && el.querySelector('[id^="showLabel-toggle-"]')) {
          return { tag: el.tagName.toLowerCase(), classes: [...el.classList].join('.') };
        }
      }
      return null;
    });
    log('  Card container:', JSON.stringify(cardSelector));

    if (cardSelector) {
      const cardLocator = page.locator(`${cardSelector.tag}.${cardSelector.classes.split('.').filter(Boolean)[0]}`).first();
      await cardLocator.hover().catch(() => {});
      await page.waitForTimeout(500);
    }

    const delBtns = await page.evaluate(() => {
      return [...document.querySelectorAll('button,svg,[role="button"]')]
        .filter(b => {
          const lbl = (b.getAttribute('aria-label') || b.title || b.textContent || '').toLowerCase();
          return /delete|remove|trash|bin|ลบ|del/i.test(lbl);
        })
        .map(b => ({
          tag: b.tagName.toLowerCase(),
          ariaLabel: b.getAttribute('aria-label') || '',
          title: b.title || '',
          text: (b.textContent || '').trim().slice(0, 20),
          classes: [...b.classList].join(' ').slice(0, 80),
          visible: b.offsetParent !== null,
        }));
    });
    log(`  After hover — delete candidates count=${delBtns.length}`);
    for (const d of delBtns) log(`  visible=${d.visible} tag=${d.tag} ariaLabel="${d.ariaLabel}" title="${d.title}" text="${d.text}" class="${d.classes}"`);

    // Also check SVG icons in card area for trash/bin
    log('\n=== 2b. SVG title/desc in card buttons ===');
    const svgTitles = await page.evaluate(() => {
      const req = document.querySelector('[id^="required-"]');
      if (!req) return [];
      let card = req;
      for (let i = 0; i < 12; i++) {
        card = card.parentElement;
        if (!card) break;
        if (card.querySelector('[id^="required-"]') && card.querySelector('[id^="colSpan-select-"]')) break;
      }
      if (!card) return [];
      return [...card.querySelectorAll('button')].map(b => ({
        ariaLabel: b.getAttribute('aria-label') || '',
        text: (b.textContent || '').trim().slice(0, 20),
        svgTitle: (b.querySelector('title') || b.querySelector('title,desc') || {}).textContent || '',
        classes: [...b.classList].join(' ').slice(0, 60),
      }));
    });
    log(`  Buttons inside card: ${svgTitles.length}`);
    for (const s of svgTitles) log(`  ariaLabel="${s.ariaLabel}" text="${s.text}" svgTitle="${s.svgTitle}" class="${s.classes}"`);

    // 3. Identify Label / Placeholder inputs
    log('\n=== 3. LABEL / PLACEHOLDER inputs — parent context ===');
    const blankInputs = await page.evaluate(() => {
      const EXCLUDE = /^(personal|address|currentAddress|contact|dynamicForm|overallColSpan|required|colSpan|showLabel|[\da-f]{8}-)/;
      return [...document.querySelectorAll('input[type="text"]:not([id]'),
              ...document.querySelectorAll('input[type="text"][id=""]')]
        .filter(el => !EXCLUDE.test(el.id || ''))
        .map(el => {
          const parent = el.parentElement;
          const grandparent = parent && parent.parentElement;
          // find nearest label-like sibling or ancestor text
          const nearLabel = (grandparent || parent) && (grandparent || parent).querySelector('label,p,span[class*="label" i],span[class*="title" i]');
          const prevSib = el.previousElementSibling;
          return {
            ph: el.getAttribute('placeholder') || '(no ph)',
            nearLabelText: nearLabel ? (nearLabel.textContent || '').trim().slice(0, 30) : '',
            prevSibText: prevSib ? (prevSib.textContent || '').trim().slice(0, 30) : '',
            parentClasses: parent ? [...parent.classList].join(' ').slice(0, 60) : '',
            grandparentClasses: grandparent ? [...grandparent.classList].join(' ').slice(0, 60) : '',
          };
        });
    });
    for (const inp of blankInputs) log(`  ph="${inp.ph}" nearLabel="${inp.nearLabelText}" prevSib="${inp.prevSibText}" parentClass="${inp.parentClasses}"`);

    // 4. Close button (top-right of modal)
    log('\n=== 4. CLOSE BUTTON — exact class of top-right button ===');
    const closeBtn = await page.evaluate(() => {
      // Look for button at top-right of the modal
      const modal = document.querySelector('[class*="modal" i]');
      if (!modal) return null;
      // buttons inside modal sorted by x descending
      const btns = [...modal.querySelectorAll('button')].filter(b => b.offsetParent !== null);
      return btns.map(b => ({
        x: Math.round(b.getBoundingClientRect().x),
        y: Math.round(b.getBoundingClientRect().y),
        ariaLabel: b.getAttribute('aria-label') || '',
        text: (b.textContent || '').trim().slice(0, 10),
        classes: [...b.classList].join(' ').slice(0, 100),
        hasSvg: !!b.querySelector('svg'),
      })).sort((a,b) => b.x - a.x).slice(0, 5);
    });
    for (const b of (closeBtn || [])) log(`  x=${b.x} y=${b.y} ariaLabel="${b.ariaLabel}" text="${b.text}" class="${b.classes}" hasSvg=${b.hasSvg}`);

    log('\n=== DONE ===');
  } catch (e) {
    log('PROBE ERROR:', e.message);
  } finally {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/cfc-dom-probe5.txt', out.join('\n'));
    await browser.close();
  }
})();
