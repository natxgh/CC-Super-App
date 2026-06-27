// Probe v4 — verify TBC selectors: fieldCards, closeBtn, toolbar buttons, label/placeholder inputs
// READ-ONLY: login → open builder → add Text field → dump → close without Save
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
    // ── Login ──────────────────────────────────────────────────────────────────
    await page.goto('/cc/contacts-list');
    await page.locator('#username').waitFor({ timeout: 20000 });
    await page.locator('#organization').fill(ORG);
    await page.locator('#username').fill(USER);
    await page.locator('#password').fill(PASS);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    log('login OK');

    // ── Navigate to config page ─────────────────────────────────────────────
    await page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Enable Custom Form toggle if needed
    const cfToggle = page.locator('#dynamicForm-enabled');
    if (await cfToggle.count() && !(await cfToggle.isChecked())) await cfToggle.click();
    await page.waitForTimeout(500);

    // ── Open builder modal ──────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Add', exact: true }).first().click();
    await page.waitForTimeout(2500);

    // 1. Modal detection
    log('\n=== 1. MODAL DETECTION ===');
    const modalData = await page.evaluate(() => {
      const candidates = [
        '[role="dialog"]',
        '[class*="modal" i]',
        '[class*="Modal" i]',
        '[class*="drawer" i]',
        '[class*="overlay" i]',
        '[class*="popup" i]',
        '[class*="builder" i]',
      ];
      return candidates.map(sel => {
        const els = document.querySelectorAll(sel);
        return { sel, count: els.length,
          classes: els.length ? [...els[0].classList].join(' ').slice(0, 80) : '',
          hasText: els.length ? (els[0].textContent || '').includes('Dynamic Form Builder') : false };
      });
    });
    for (const m of modalData) log(`  ${m.sel} → count=${m.count} hasBuilderText=${m.hasText} classes="${m.classes}"`);

    // 2. Close button
    log('\n=== 2. CLOSE BUTTON candidates ===');
    const closeCandidates = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns
        .filter(b => {
          const lbl = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase();
          return lbl.includes('close') || lbl === '×' || lbl === '✕' || lbl === 'x' || b.querySelector('svg');
        })
        .slice(0, 15)
        .map(b => ({
          ariaLabel: b.getAttribute('aria-label') || '',
          text: (b.textContent || '').trim().slice(0, 20),
          classes: [...b.classList].join(' ').slice(0, 60),
          hasSvg: !!b.querySelector('svg'),
          position: b.getBoundingClientRect().toJSON(),
        }));
    });
    for (const c of closeCandidates) log(`  ariaLabel="${c.ariaLabel}" text="${c.text}" hasSvg=${c.hasSvg} x=${Math.round(c.position.x)} y=${Math.round(c.position.y)} class="${c.classes}"`);

    // 3. Toolbar buttons (Import/Export/Preview/Hide All/Show All)
    log('\n=== 3. TOOLBAR BUTTONS (all visible buttons in builder) ===');
    const toolbarBtns = await page.evaluate(() => {
      return [...document.querySelectorAll('button')]
        .map(b => ({ text: (b.textContent || '').trim().slice(0, 30), ariaLabel: b.getAttribute('aria-label') || '' }))
        .filter(b => b.text || b.ariaLabel)
        .filter(b => /import|export|preview|hide|show|save/i.test(b.text + b.ariaLabel));
    });
    for (const b of toolbarBtns) log(`  text="${b.text}" ariaLabel="${b.ariaLabel}"`);

    // 4. Add a Text field and inspect field cards + per-field config
    log('\n=== 4. ADD TEXT FIELD → inspect cards ===');
    await page.getByRole('button', { name: 'Text', exact: true }).first().click();
    await page.waitForTimeout(1500);

    const cardData = await page.evaluate(() => {
      const selectors = [
        '[class*="field-card" i]',
        '[data-field-id]',
        '[class*="layout-item" i]',
        '[class*="sortable" i]',
        '[class*="FieldCard" ]',
        '[class*="field-item" i]',
        '[class*="form-field" i]',
        '[draggable="true"]',
      ];
      return selectors.map(sel => {
        const els = document.querySelectorAll(sel);
        return {
          sel,
          count: els.length,
          firstClass: els.length ? [...els[0].classList].join(' ').slice(0, 100) : '',
        };
      });
    });
    log('  Field card selector candidates:');
    for (const c of cardData) log(`    ${c.sel} → count=${c.count} firstClass="${c.firstClass}"`);

    // 5. Per-field inputs within the card
    log('\n=== 5. PER-FIELD INPUTS (after adding Text field) ===');
    const perField = await page.evaluate(() => {
      const EXCLUDE = /^(personal|address|currentAddress|contact|dynamicForm)-/;
      return [...document.querySelectorAll('input,textarea,select')]
        .filter(el => !EXCLUDE.test(el.id || ''))
        .map(el => {
          const id = el.id || '';
          let lbl = '';
          if (id) { const l = document.querySelector(`label[for="${id}"]`); if (l) lbl = l.textContent.trim(); }
          if (!lbl) { const p = el.closest('div,li'); const l = p && p.querySelector('label,span[class*="label" i]'); if (l) lbl = l.textContent.trim().slice(0, 25); }
          return { tag: el.tagName.toLowerCase(), type: el.type || '', id, ph: el.getAttribute('placeholder') || '', lbl: lbl.slice(0, 25), checked: el.type === 'checkbox' ? el.checked : '' };
        });
    });
    for (const f of perField) log(`  ${f.tag}[${f.type}] id="${f.id}" ph="${f.ph}" lbl="${f.lbl}" checked=${f.checked}`);

    // 6. Delete button on field card
    log('\n=== 6. DELETE/REMOVE buttons on field cards ===');
    const delBtns = await page.evaluate(() => {
      return [...document.querySelectorAll('button')]
        .filter(b => {
          const lbl = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase();
          return /delete|remove|trash|bin|ลบ/i.test(lbl);
        })
        .map(b => ({
          ariaLabel: b.getAttribute('aria-label') || '',
          text: (b.textContent || '').trim().slice(0, 20),
          classes: [...b.classList].join(' ').slice(0, 60),
        }));
    });
    log(`  count=${delBtns.length}`);
    for (const d of delBtns) log(`  ariaLabel="${d.ariaLabel}" text="${d.text}" class="${d.classes}"`);

    // 7. All buttons after adding field (for Save Form / other)
    log('\n=== 7. ALL BUTTONS (filtered — save/form/config) ===');
    const allBtns = await page.evaluate(() => {
      return [...document.querySelectorAll('button')]
        .map(b => (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 40))
        .filter(t => /save|config|form|cancel/i.test(t));
    });
    for (const b of allBtns) log(`  "${b}"`);

    log('\n=== DONE (no Save — read-only) ===');
  } catch (e) {
    log('PROBE ERROR:', e.message);
  } finally {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/cfc-dom-probe4.txt', out.join('\n'));
    await browser.close();
  }
})();
