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

    await page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const cfToggle = page.locator('#dynamicForm-enabled');
    if (await cfToggle.count() && !(await cfToggle.isChecked())) await cfToggle.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.waitForTimeout(3000);

    // Fill form name + add field
    await page.getByPlaceholder('Enter form name').fill('Test Save Dispatch');
    await page.getByRole('button', { name: 'Text', exact: true }).first().click();
    await page.waitForTimeout(1000);

    log('=== Approach 1: dispatchEvent on hidden Save Form button ===');
    const modal = page.locator('[class*="modal" i]').first();
    const saveFormBtn = modal.locator('button', { hasText: 'Save Form' }).last();
    const count = await saveFormBtn.count();
    log('Save Form button count:', count);

    if (count > 0) {
      await saveFormBtn.dispatchEvent('click');
      log('dispatchEvent click sent');
      await page.waitForTimeout(3000);
    }

    const modalVisible1 = await page.locator('[class*="modal" i]').first().isVisible().catch(() => false);
    log('Modal still visible after dispatchEvent:', modalVisible1);

    const toast1 = await page.getByText(/saved|success|บันทึก|สำเร็จ/i).first().isVisible().catch(() => false);
    log('Toast visible:', toast1);

    // Try evaluate-based click
    log('\n=== Approach 2: element.click() via evaluate ===');
    await page.evaluate(() => {
      const modal = document.querySelector('[class*="modal" i]');
      if (!modal) { console.log('no modal'); return; }
      const btn = [...modal.querySelectorAll('button')].find(b => /save form/i.test(b.textContent || ''));
      if (btn) btn.click();
      else console.log('no save form btn');
    });
    await page.waitForTimeout(3000);

    const modalVisible2 = await page.locator('[class*="modal" i]').first().isVisible().catch(() => false);
    log('Modal still visible after evaluate click:', modalVisible2);
    const toast2 = await page.getByText(/saved|success|บันทึก|สำเร็จ/i).first().isVisible().catch(() => false);
    log('Toast visible:', toast2);

    // If still open, try clicking outer "Save Configuration" 
    log('\n=== Approach 3: outer Save Configuration (force) ===');
    await page.getByRole('button', { name: /Save Configuration/i }).click({ force: true });
    await page.waitForTimeout(4000);

    const modalVisible3 = await page.locator('[class*="modal" i]').first().isVisible().catch(() => false);
    log('Modal still visible after outer Save Configuration:', modalVisible3);
    const toast3 = await page.getByText(/saved|success|บันทึก|สำเร็จ/i).first().isVisible().catch(() => false);
    log('Toast visible:', toast3);

    // What text is on page now?
    const pageText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    log('Page text (first 300 chars):', pageText.replace(/\n/g, ' '));

  } catch (e) {
    log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
