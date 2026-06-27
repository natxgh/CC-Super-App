import { chromium } from '@playwright/test';
import * as fs from 'fs';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { CP_BASE_URL: BASE, CP_ORG: ORG = '', CP_USERNAME: USER, CP_PASSWORD: PASS } = process.env;
const log = (...a) => console.log(a.join(' '));

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
    await page.waitForTimeout(2000);

    // Enable custom form + open builder
    const cfToggle = page.locator('#dynamicForm-enabled');
    if (await cfToggle.count() && !(await cfToggle.isChecked())) await cfToggle.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.waitForTimeout(3000);

    // Check for modal
    const modalCount = await page.locator('[class*="modal" i]').count();
    log('modal count:', modalCount);
    const modalVisible = await page.locator('[class*="modal" i]').first().isVisible().catch(() => false);
    log('modal[0] visible:', modalVisible);

    // All button texts on page when builder is open
    const btns = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter(b => (b.offsetParent !== null) || b.offsetWidth > 0)
        .map(b => ({ text: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0,40), classes: [...b.classList].join(' ').slice(0,50) }))
        .filter(b => b.text)
    );
    log('\nAll visible button texts:');
    for (const b of btns) log(`  "${b.text}" [${b.classes}]`);

    // Check specifically for Save buttons
    log('\nSave-related buttons:');
    const saveBtns = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter(b => /save/i.test(b.textContent || ''))
        .map(b => ({
          text: (b.textContent || '').trim(),
          classes: [...b.classList].join(' ').slice(0,80),
          visible: b.offsetParent !== null,
          disabled: b.disabled,
        }))
    );
    for (const b of saveBtns) log('  ' + JSON.stringify(b));

    // Check modal element
    log('\nModal element info:');
    const modalInfo = await page.evaluate(() => {
      const modals = [...document.querySelectorAll('[class*="modal" i]')];
      return modals.map(m => ({
        tag: m.tagName,
        classes: [...m.classList].join(' ').slice(0,100),
        display: window.getComputedStyle(m).display,
        visibility: window.getComputedStyle(m).visibility,
        childCount: m.children.length,
        btnTexts: [...m.querySelectorAll('button')].map(b => (b.textContent||'').trim().slice(0,30)).filter(t=>t),
      }));
    });
    for (const m of modalInfo) log('  ' + JSON.stringify(m));

  } catch (e) {
    log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
