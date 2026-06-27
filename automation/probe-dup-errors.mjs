import { chromium } from 'playwright';

const BASE = process.env.CP_BASE_URL;
const ORG  = process.env.CP_ORG;
const USER = process.env.CP_USERNAME;
const PASS = process.env.CP_PASSWORD;

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ baseURL: BASE });
const page    = await ctx.newPage();
page.setDefaultTimeout(20000);

await page.goto('/cc/contacts-list');
await page.locator('#organization').fill(ORG);
await page.locator('#username').fill(USER);
await page.locator('#password').fill(PASS);
await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
await page.evaluate(() => localStorage.setItem('language', 'en'));
await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });

async function getErrors() {
  await page.waitForTimeout(2500);
  return [...new Set(
    Array.from(await page.evaluate(() =>
      Array.from(document.querySelectorAll('body *'))
        .filter(e=>!e.children.length)
        .map(e=>(e.textContent||'').trim())
        .filter(t=>t.length>2 && t.length<200 &&
          /error|invalid|require|please|must|duplicate|enter|provide|cannot|format|exceed|phone|mobile|email/i.test(t))
    ))
  )];
}

async function openAdd() {
  await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Add Customer' }).click();
  await page.locator('input[name="email"]').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
}

// 1. Dup email (somchai.jai@gmail.com already exists from seeding in TS-01)
console.log('\n[1] Testing duplicate email...');
await openAdd();
await page.locator('input[name="email"]').fill('somchai.jai@gmail.com');
await page.locator('input[name="mobileNo"]').fill('0891234567'); // unique phone
await page.getByRole('button',{name:'Save'}).first().click();
console.log('Dup email errors:', await getErrors());

// 2. Dup phone (Somchai phone = 0812345678)
console.log('\n[2] Testing duplicate phone...');
await openAdd();
await page.locator('input[name="email"]').fill('unique.test.probe@test.com');
await page.locator('input[name="mobileNo"]').fill('0812345678'); // Somchai's phone
await page.getByRole('button',{name:'Save'}).first().click();
console.log('Dup phone errors:', await getErrors());

// 3. Empty phone
console.log('\n[3] Testing empty phone...');
await openAdd();
await page.locator('input[name="email"]').fill('anothernew.test@test.com');
await page.locator('input[name="mobileNo"]').fill('');
await page.getByRole('button',{name:'Save'}).first().click();
console.log('Empty phone errors:', await getErrors());

// 4. TS-02: Add new customer with ONLY email+phone → check row display
console.log('\n[4] Testing add customer (email+phone only) → check display name...');
await openAdd();
await page.locator('input[name="email"]').fill('display.probe@test.com');
await page.locator('input[name="mobileNo"]').fill('0899999999');
await page.getByRole('button',{name:'Save'}).first().click();
await page.waitForTimeout(3000);
console.log('URL after save:', page.url());
// Search for the newly added customer
await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
const searchInput = page.getByRole('textbox', { name: /Search/i }).or(page.locator('input[placeholder*="Search" i]')).first();
await searchInput.fill('display.probe@test.com');
await page.getByRole('button',{name:'Search', exact:true}).first().click();
await page.waitForTimeout(2000);
// Get row text
const rows = await page.evaluate(() =>
  Array.from(document.querySelectorAll('table tbody tr')).map(r=>(r.textContent||'').trim().replace(/\s+/g,' ').slice(0,120))
);
console.log('Rows in list after search:', rows);

await browser.close();
