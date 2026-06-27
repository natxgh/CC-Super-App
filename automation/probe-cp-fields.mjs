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
await page.waitForTimeout(500);

// Snapshot all interactive elements in the form area (deep)
const allInputs = await page.evaluate(() => {
  const form = document.querySelector('form') || document.querySelector('[class*="modal" i],[class*="drawer" i],[class*="slide" i],[class*="panel" i]') || document.body;
  const els = Array.from(form.querySelectorAll('input,select,textarea,button,[role="combobox"],[role="listbox"],[role="option"],[role="button"],[role="radio"],[role="checkbox"]'));
  return els.map(el => ({
    tag: el.tagName,
    type: el.getAttribute('type') || '',
    name: el.getAttribute('name') || '',
    role: el.getAttribute('role') || '',
    placeholder: el.getAttribute('placeholder') || '',
    ariaLabel: el.getAttribute('aria-label') || '',
    text: (el.textContent||'').trim().slice(0,40),
    class: (el.className||'').slice(0,60),
    id: el.id || '',
  }));
});

console.log('\n=== All interactive elements in Add Customer form ===');
allInputs.forEach((el, i) => {
  if (el.tag === 'BUTTON' && !['Save','Back','Cancel'].some(s=>el.text.includes(s))) return; // skip generic buttons
  console.log(`[${i}] <${el.tag}> type="${el.type}" name="${el.name}" role="${el.role}" placeholder="${el.placeholder}" aria-label="${el.ariaLabel}" text="${el.text}"`);
});

// Specifically look for Title / Gender fields
console.log('\n=== Looking for Title / Prefix / Gender fields ===');
const titleGenderEls = await page.evaluate(() => {
  const allEls = Array.from(document.querySelectorAll('*'));
  return allEls
    .filter(el => {
      const label = (el.textContent || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '').toLowerCase();
      return /title|prefix|gender|mr\.|mrs\.|ms\.|sex|male|female/i.test(label) && el.children.length < 5 && el.tagName !== 'BODY' && el.tagName !== 'HTML';
    })
    .map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role') || '',
      text: (el.textContent||'').trim().slice(0,60),
      parent: el.parentElement?.tagName || '',
      class: (el.className||'').slice(0,60),
    }))
    .slice(0,30);
});
titleGenderEls.forEach(e => console.log(` <${e.tag}> role="${e.role}" text="${e.text}" parent="${e.parent}"`));

// Check what element is around "Mr." option
console.log('\n=== Elements with "Mr." text ===');
const mrEls = await page.evaluate(() =>
  Array.from(document.querySelectorAll('*'))
    .filter(el => el.textContent?.trim() === 'Mr.' && el.children.length < 3)
    .map(el => ({
      tag: el.tagName, role: el.getAttribute('role')||'', 
      class: (el.className||'').slice(0,60),
      parent: `<${el.parentElement?.tagName}> role="${el.parentElement?.getAttribute('role')||''}" class="${(el.parentElement?.className||'').slice(0,50)}"`,
    }))
);
mrEls.forEach(e => console.log(` <${e.tag}> role="${e.role}" → parent: ${e.parent}`));

await browser.close();
