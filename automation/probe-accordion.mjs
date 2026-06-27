// Probe — accordion collapse/expand on /cc/contacts-configurations
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
    log('login OK');

    await page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 1. Find "Personal Details" text and surrounding DOM
    log('\n=== 1. Personal Details heading area ===');
    const headingInfo = await page.evaluate(() => {
      const all = [...document.querySelectorAll('*')].filter(el => el.textContent?.trim() === 'Personal Details' && el.children.length === 0);
      return all.slice(0, 5).map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        classes: [...el.classList].join(' ').slice(0, 80),
        parentTag: el.parentElement?.tagName.toLowerCase(),
        parentClasses: [...(el.parentElement?.classList || [])].join(' ').slice(0, 80),
        parentId: el.parentElement?.id,
        // Check if parent or grandparent is a button
        grandpaTag: el.parentElement?.parentElement?.tagName.toLowerCase(),
        grandpaClasses: [...(el.parentElement?.parentElement?.classList || [])].join(' ').slice(0, 80),
        grandpaRole: el.parentElement?.parentElement?.getAttribute('role'),
        grandpaAriaExpanded: el.parentElement?.parentElement?.getAttribute('aria-expanded'),
      }));
    });
    log('  Heading elements:');
    for (const h of headingInfo) log('  ' + JSON.stringify(h));

    // 2. Find all buttons near/containing "Personal Details"
    log('\n=== 2. Buttons near Personal Details ===');
    const btnInfo = await page.evaluate(() => {
      const target = [...document.querySelectorAll('*')].find(el => el.textContent?.trim() === 'Personal Details' && el.children.length === 0);
      if (!target) return [{ err: 'not found' }];
      // Walk up to find buttons
      const results = [];
      let el = target;
      for (let i = 0; i < 10; i++) {
        el = el.parentElement;
        if (!el) break;
        const tag = el.tagName.toLowerCase();
        const classes = [...el.classList].join(' ').slice(0, 80);
        const role = el.getAttribute('role') || '';
        const ariaExpanded = el.getAttribute('aria-expanded');
        const dataState = el.getAttribute('data-state');
        const btns = [...el.querySelectorAll('button')].map(b => ({
          text: (b.textContent || '').trim().slice(0, 30),
          classes: [...b.classList].join(' ').slice(0, 60),
          ariaLabel: b.getAttribute('aria-label') || '',
        }));
        results.push({ depth: i, tag, classes, role, ariaExpanded, dataState, btnCount: btns.length, btns });
        if (tag === 'section' || classes.includes('section') || classes.includes('accordion')) break;
      }
      return results;
    });
    log('  Ancestor chain from heading:');
    for (const r of btnInfo) log('  ' + JSON.stringify(r));

    // 3. Check #personal-displayName container (what hides when collapsed?)
    log('\n=== 3. #personal-displayName container ===');
    const dispNameInfo = await page.evaluate(() => {
      const el = document.getElementById('personal-displayName');
      if (!el) return { err: 'not found' };
      const ancestors = [];
      let node = el;
      for (let i = 0; i < 12; i++) {
        node = node.parentElement;
        if (!node || node === document.body) break;
        const style = window.getComputedStyle(node);
        ancestors.push({
          depth: i,
          tag: node.tagName.toLowerCase(),
          id: node.id,
          classes: [...node.classList].join(' ').slice(0, 80),
          display: style.display,
          visibility: style.visibility,
          height: style.height,
          overflow: style.overflow,
          ariaHidden: node.getAttribute('aria-hidden'),
          dataState: node.getAttribute('data-state'),
        });
        if (ancestors.length > 8) break;
      }
      return ancestors;
    });
    log('  #personal-displayName ancestors (BEFORE collapse):');
    for (const a of dispNameInfo) log('  ' + JSON.stringify(a));

    // 4. Try clicking the collapse trigger and see what changes
    log('\n=== 4. Try to collapse Personal Details ===');
    // Try various collapse trigger approaches
    const triggered = await page.evaluate(() => {
      // Find the toggle button for the Personal Details section
      // Common approaches: button containing "Personal Details", or chevron button near heading
      const headingText = [...document.querySelectorAll('*')].find(el => el.textContent?.trim() === 'Personal Details' && el.children.length === 0);
      if (!headingText) return { err: 'heading not found' };
      // Look for the nearest button ancestor
      let el = headingText;
      for (let i = 0; i < 8; i++) {
        el = el.parentElement;
        if (!el) break;
        if (el.tagName === 'BUTTON') {
          el.click();
          return { clicked: 'button ancestor', tag: el.tagName, classes: [...el.classList].join(' ').slice(0, 60) };
        }
      }
      // Alternatively: look for a button that is a sibling or adjacent to the heading container
      let row = headingText.parentElement;
      for (let i = 0; i < 4; i++) {
        const btns = [...(row?.querySelectorAll('button') || [])];
        if (btns.length > 0) {
          btns[btns.length - 1].click();
          return { clicked: 'last btn in ancestor', depth: i, btnText: (btns[btns.length-1].textContent||'').trim().slice(0,30) };
        }
        row = row?.parentElement;
      }
      return { err: 'no button found' };
    });
    log('  Trigger attempt:', JSON.stringify(triggered));
    await page.waitForTimeout(1000);

    // 5. Check state after collapse
    log('\n=== 5. #personal-displayName state AFTER collapse attempt ===');
    const afterCollapse = await page.evaluate(() => {
      const el = document.getElementById('personal-displayName');
      if (!el) return { err: 'not found' };
      const ancestors = [];
      let node = el;
      for (let i = 0; i < 12; i++) {
        node = node.parentElement;
        if (!node || node === document.body) break;
        const style = window.getComputedStyle(node);
        ancestors.push({
          depth: i,
          tag: node.tagName.toLowerCase(),
          id: node.id,
          classes: [...node.classList].join(' ').slice(0, 80),
          display: style.display,
          visibility: style.visibility,
          height: style.height,
          maxHeight: style.maxHeight,
          overflow: style.overflow,
          ariaHidden: node.getAttribute('aria-hidden'),
          dataState: node.getAttribute('data-state'),
          hidden: node.hasAttribute('hidden'),
        });
        if (ancestors.length > 8) break;
      }
      // Also check the heading button state
      const headingText = [...document.querySelectorAll('*')].find(el2 => el2.textContent?.trim() === 'Personal Details' && el2.children.length === 0);
      let headingBtn = null;
      if (headingText) {
        let h = headingText;
        for (let i = 0; i < 8; i++) {
          h = h.parentElement;
          if (!h) break;
          if (h.tagName === 'BUTTON') {
            headingBtn = { ariaExpanded: h.getAttribute('aria-expanded'), dataState: h.getAttribute('data-state'), classes: [...h.classList].join(' ').slice(0,60) };
            break;
          }
        }
      }
      return { ancestors, headingBtn };
    });
    log('  ancestors:');
    for (const a of (afterCollapse.ancestors || [])) log('  ' + JSON.stringify(a));
    log('  headingBtn:', JSON.stringify(afterCollapse.headingBtn));

    log('\n=== DONE ===');
  } catch (e) {
    log('PROBE ERROR:', e.message, e.stack?.slice(0, 200));
  } finally {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/accordion-probe.txt', out.join('\n'));
    await browser.close();
  }
})();
