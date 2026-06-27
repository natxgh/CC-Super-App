import { chromium } from '@playwright/test';
import * as fs from 'fs';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { CP_BASE_URL: BASE, CP_ORG: ORG = '', CP_USERNAME: USER, CP_PASSWORD: PASS } = process.env;
const log = (...a) => console.log(a.join(' '));

(async () => {
  const browser = await chromium.launch({ headless: false }); // headed so we can see it
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

    // Fill form name
    await page.getByPlaceholder('Enter form name').fill('Test Save Form');
    await page.waitForTimeout(500);

    // Add a field
    await page.getByRole('button', { name: 'Text', exact: true }).first().click();
    await page.waitForTimeout(1000);

    log('=== Trying to click Save Form (hidden button, force) ===');
    const modal = page.locator('[class*="modal" i]').first();
    const saveFormBtn = modal.locator('button', { hasText: 'Save Form' }).last();
    const count = await saveFormBtn.count();
    log('Save Form button count:', count);

    if (count > 0) {
      await saveFormBtn.click({ force: true });
      log('Clicked Save Form (force)');
      await page.waitForTimeout(3000);
    }

    // Check if modal closed
    const modalVisible = await page.locator('[class*="modal" i]').first().isVisible().catch(() => false);
    log('Modal still visible after click:', modalVisible);

    // Check for toast/success
    const toastText = await page.locator('[class*="toast" i], [class*="notification" i], [role="alert"]').first().textContent().catch(() => 'none');
    log('Toast text:', toastText);

    // Check for any error text
    const errText = await page.getByText(/required|error|ข้อผิดพลาด|ต้องระบุ/i).first().textContent().catch(() => 'none');
    log('Error text:', errText);

    // Now try empty form name → save
    log('\n=== Test: empty form name → Save Form ===');
    await page.getByPlaceholder('Enter form name').fill('');
    await page.waitForTimeout(300);
    await saveFormBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // What text appears?
    const allText = await page.evaluate(() => {
      return [...document.querySelectorAll('[class*="error" i],[class*="alert" i],[role="alert"],[class*="warning" i]')]
        .map(el => (el.textContent || '').trim())
        .filter(t => t.length > 0);
    });
    log('Error/alert texts after empty save:', JSON.stringify(allText));

    // Dump any new text that appeared
    const bodyText = await page.locator('[class*="modal" i]').first().innerText().catch(() => 'none');
    log('Modal inner text (first 500 chars):', bodyText.slice(0, 500));

    await page.screenshot({ path: 'test-results/builder-save-probe.png', fullPage: true }).catch(() => {});
    await page.waitForTimeout(2000);

  } catch (e) {
    log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
