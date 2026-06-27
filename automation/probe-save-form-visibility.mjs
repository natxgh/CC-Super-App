import { chromium } from '@playwright/test';
import * as fs from 'fs';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { CP_BASE_URL: BASE, CP_ORG: ORG = '', CP_USERNAME: USER, CP_PASSWORD: PASS } = process.env;
const log = (...a) => console.log(a.join(' '));

const getSaveFormBtnInfo = (page) => page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].filter(b => /save form/i.test(b.textContent || ''));
  return btns.map(b => ({
    text: b.textContent?.trim(),
    display: window.getComputedStyle(b).display,
    visibility: window.getComputedStyle(b).visibility,
    opacity: window.getComputedStyle(b).opacity,
    offsetParent: b.offsetParent?.tagName || 'null',
    offsetWidth: b.offsetWidth,
    offsetHeight: b.offsetHeight,
    // Walk up to find first hidden ancestor
    hiddenAncestor: (() => {
      let el = b.parentElement;
      while (el && el !== document.body) {
        const s = window.getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden') {
          return { tag: el.tagName, classes: [...el.classList].join(' ').slice(0, 60), display: s.display };
        }
        el = el.parentElement;
      }
      return null;
    })(),
  }));
});

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
    await page.waitForTimeout(2000);
    const cfToggle = page.locator('#dynamicForm-enabled');
    if (await cfToggle.count() && !(await cfToggle.isChecked())) await cfToggle.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.waitForTimeout(3000);

    log('=== Save Form btn BEFORE adding field:');
    log(JSON.stringify(await getSaveFormBtnInfo(page), null, 2));

    // Add a Text field
    await page.getByRole('button', { name: 'Text', exact: true }).first().click();
    await page.waitForTimeout(1500);

    log('\n=== Save Form btn AFTER adding field:');
    log(JSON.stringify(await getSaveFormBtnInfo(page), null, 2));

    // Also check form name input
    await page.getByPlaceholder('Enter form name').fill('Test Form');
    await page.waitForTimeout(500);

    log('\n=== Save Form btn AFTER filling form name:');
    log(JSON.stringify(await getSaveFormBtnInfo(page), null, 2));

    // List ALL visible buttons in modal
    log('\n=== All VISIBLE buttons in modal:');
    const modalBtns = await page.evaluate(() => {
      const modal = document.querySelector('.modal');
      if (!modal) return ['no modal'];
      return [...modal.querySelectorAll('button')]
        .filter(b => window.getComputedStyle(b).display !== 'none' && window.getComputedStyle(b).visibility !== 'hidden')
        .map(b => (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 40))
        .filter(t => t);
    });
    for (const t of modalBtns) log(`  "${t}"`);

  } catch (e) {
    log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
