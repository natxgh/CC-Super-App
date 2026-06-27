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
  const texts = await page.evaluate(() =>
    [...new Set(
      Array.from(document.querySelectorAll('body *'))
        .filter(e=>!e.children.length)
        .map(e=>(e.textContent||'').trim())
        .filter(t=>t.length>2 && t.length<200 &&
          /error|invalid|require|please|must|duplicate|enter|provide|cannot|format|exceed|success|fail|not|phone|email|citizen|upload|photo|size/i.test(t))
    )]
  );
  return texts;
}

async function openAddForm() {
  await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Add Customer' }).click();
  await page.waitForTimeout(1000);
}

async function fillBase() {
  await page.locator('input[name="mobileNo"]').fill('0812345678').catch(()=>{});
  await page.locator('input[name="firstName"]').fill('Probe').catch(()=>{});
  await page.locator('input[name="lastName"]').fill('Test').catch(()=>{});
}

// ─── TEST CASES ────────────────────────────────────────────────────────────────
const results = {};

// 1. Empty email
await openAddForm();
await fillBase();
await page.getByRole('button',{name:'Save'}).first().click();
results['empty_email'] = await getErrors();

// 2. Invalid email format  
await openAddForm();
await fillBase();
await page.locator('input[name="email"]').fill('notvalidemail').catch(()=>{});
await page.getByRole('button',{name:'Save'}).first().click();
results['invalid_email_format'] = await getErrors();

// 3. Empty phone
await openAddForm();
await page.locator('input[name="email"]').fill('probe.test@test.com').catch(()=>{});
await page.locator('input[name="firstName"]').fill('Probe').catch(()=>{});
await page.locator('input[name="lastName"]').fill('Test').catch(()=>{});
// leave phone empty
await page.getByRole('button',{name:'Save'}).first().click();
results['empty_phone'] = await getErrors();

// 4. Citizen ID < 13 digits
await openAddForm();
await fillBase();
await page.locator('input[name="email"]').fill('probe.citizentest@test.com').catch(()=>{});
await page.locator('input[name="citizenId"]').fill('123456789012').catch(()=>{}); // 12 digits
await page.getByRole('button',{name:'Save'}).first().click();
results['citizen_id_short'] = await getErrors();

console.log('\n=== PROBE RESULTS ===');
for (const [k,v] of Object.entries(results)) {
  console.log(`\n[${k}]`);
  if (!v.length) console.log('  (no error text found)');
  v.forEach(t=>console.log(' >', t));
}

await browser.close();
