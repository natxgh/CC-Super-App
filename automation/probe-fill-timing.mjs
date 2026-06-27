import { chromium } from 'playwright';

const BASE = process.env.CP_BASE_URL;
const ORG  = process.env.CP_ORG;
const USER = process.env.CP_USERNAME;
const PASS = process.env.CP_PASSWORD;

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ baseURL: BASE });
const page    = await ctx.newPage();
page.setDefaultTimeout(8000); // short timeout for probing

await page.goto('/cc/contacts-list');
await page.locator('#organization').fill(ORG);
await page.locator('#username').fill(USER);
await page.locator('#password').fill(PASS);
await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
await page.evaluate(() => localStorage.setItem('language', 'en'));
await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Add Customer' }).click();
await page.locator('input[name="email"]').waitFor({ state: 'visible' });
await page.waitForTimeout(800);

// Try each fill individually with timing
const fields = [
  ['input[name="email"]', 'test@test.com'],
  ['input[name="mobileNo"]', '0812345678'],
  ['input[name="firstName"]', 'TestFirst'],
  ['input[name="lastName"]', 'TestLast'],
  ['input[name="citizenId"]', '1234567890123'],
];

for (const [sel, val] of fields) {
  const t = Date.now();
  const count = await page.locator(sel).count();
  try {
    await page.locator(sel).fill(val, { timeout: 3000 });
    console.log(`✓ fill("${sel}") count=${count} → ${Date.now()-t}ms`);
  } catch(e) {
    console.log(`✗ fill("${sel}") count=${count} → ${Date.now()-t}ms (${e.message.split('\n')[0]})`);
  }
}

// Scroll down and check again for firstName
await page.evaluate(() => window.scrollTo(0, 500));
await page.waitForTimeout(500);
const afterScroll = await page.locator('input[name="firstName"]').count();
console.log('\nAfter scroll — input[name="firstName"] count:', afterScroll);

await browser.close();
