import { chromium } from 'playwright';

const BASE = process.env.CP_BASE_URL;
const ORG  = process.env.CP_ORG;
const USER = process.env.CP_USERNAME;
const PASS = process.env.CP_PASSWORD;

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ baseURL: BASE });
const page    = await ctx.newPage();
page.setDefaultTimeout(15000);

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
await page.waitForTimeout(1000);

// Dump ALL input/select/textarea names and types
const allFields = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('input,select,textarea')).map(el => ({
    tag: el.tagName,
    type: el.getAttribute('type') || '',
    name: el.getAttribute('name') || '',
    placeholder: el.getAttribute('placeholder') || '',
    id: el.id || '',
    value: el.value || '',
  }));
});
console.log('=== ALL input/select/textarea in DOM ===');
allFields.forEach((f,i) => console.log(`[${i}] <${f.tag}> type="${f.type}" name="${f.name}" id="${f.id}" placeholder="${f.placeholder}"`));

// Check if firstName etc exist anywhere
const specials = ['firstName','middleName','lastName','citizenId','mobileNo','email'];
console.log('\n=== Checking for specific name attributes ===');
for (const n of specials) {
  const count = allFields.filter(f=>f.name===n).length;
  console.log(` name="${n}" : ${count} found`);
}

// Also get visible labels/headings
const labels = await page.evaluate(() =>
  Array.from(document.querySelectorAll('label,h1,h2,h3,h4,[class*="label" i],[class*="heading" i]'))
    .map(e=>(e.textContent||'').trim())
    .filter(t=>t && t.length<80 && t.length>1)
    .filter((v,i,a)=>a.indexOf(v)===i)
    .slice(0,50)
);
console.log('\n=== Labels / Headings in Add Customer form ===');
labels.forEach(l=>console.log(' >', l));

await browser.close();
