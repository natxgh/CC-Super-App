// Probe v3 — structure around Label/Placeholder inputs (READ-ONLY)
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
    await page.getByRole('button', { name: 'Add', exact: true }).first().click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Text', exact: true }).first().click();
    await page.waitForTimeout(1500);

    // for each text input with empty id, print the chain of preceding text + the field block's owning uuid
    const info = await page.evaluate(() => {
      const res = [];
      document.querySelectorAll('input[type="text"]').forEach((el) => {
        if (el.id) return;
        // walk up to find a container holding a #required-<uuid>
        let block = el; let uuid = '';
        for (let i = 0; i < 8 && block; i++) {
          const req = block.querySelector && block.querySelector('[id^="required-"]');
          if (req) { uuid = req.id.replace('required-', ''); break; }
          block = block.parentElement;
        }
        // visible text label = previous sibling text or parent's first label/span
        const prev = el.previousElementSibling;
        const parentLabel = el.parentElement && (el.parentElement.querySelector('label,span,p'));
        res.push({
          ph: el.getAttribute('placeholder') || '',
          uuid,
          prevText: prev ? (prev.textContent || '').trim().slice(0, 25) : '',
          parentText: parentLabel ? (parentLabel.textContent || '').trim().slice(0, 25) : '',
        });
      });
      return res;
    });
    log('-- empty-id text inputs (Label/Placeholder candidates) --');
    for (const f of info) log(`  ph="${f.ph}" uuid="${f.uuid}" prevText="${f.prevText}" parentText="${f.parentText}"`);

    // dropdown (form select) options when clicking the "Contact Customization" trigger
    log('\n-- form dropdown probe --');
    const trig = page.getByRole('button', { name: 'Contact Customization' });
    log('  trigger "Contact Customization" count =', await trig.count());
  } catch (e) { log('ERR', e.message); }
  finally { fs.writeFileSync('test-results/cfc-dom-probe3.txt', out.join('\n')); await browser.close(); }
})();
