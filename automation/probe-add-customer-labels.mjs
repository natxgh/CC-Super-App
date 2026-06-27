// Probe — Add Customer form: what labels appear for DFC fields
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

    // 1. First enable Blood Type in config
    log('\n=== 1. Enable Blood Type in config ===');
    await page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const bloodCb = page.locator('#personal-blood');
    const isChecked = await bloodCb.isChecked().catch(() => false);
    log('  Blood Type currently checked:', isChecked);
    if (!isChecked) {
      await bloodCb.click({ force: true });
      await page.waitForTimeout(500);
      log('  toggled ON');
    }
    // Save
    await page.getByRole('button', { name: /Save Configuration/i }).click({ force: true });
    await page.waitForTimeout(3000);
    log('  save clicked, waiting...');
    const toast = await page.getByText(/saved|success|บันทึก/i).first().isVisible().catch(() => false);
    log('  toast visible:', toast);

    // 2. Navigate to Add Customer and dump all text labels
    log('\n=== 2. Add Customer — all visible text labels ===');
    await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Add Customer' }).click();
    await page.waitForTimeout(3000);

    // Dump all text content on page
    const allText = await page.evaluate(() => {
      const els = [...document.querySelectorAll('label, span, p, h1, h2, h3, h4, legend')];
      const texts = els.map(el => (el.textContent || '').trim()).filter(t => t && t.length < 60 && t.length > 1);
      return [...new Set(texts)];
    });
    log('  All text labels/spans (unique):');
    for (const t of allText) log('    ' + t);

    // Specifically search for "blood", "type", related
    log('\n=== 3. Blood-related text ===');
    const bloodText = await page.evaluate(() => {
      return [...document.querySelectorAll('*')]
        .filter(el => /blood/i.test(el.textContent || '') && el.children.length < 3)
        .map(el => ({ tag: el.tagName, text: (el.textContent||'').trim().slice(0,60), classes: [...el.classList].join(' ').slice(0,40) }))
        .slice(0,10);
    });
    log('  Blood-related elements:', JSON.stringify(bloodText));

    log('\n=== DONE ===');
  } catch (e) {
    log('ERROR:', e.message);
  } finally {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/add-customer-labels-probe.txt', out.join('\n'));
    await browser.close();
  }
})();
