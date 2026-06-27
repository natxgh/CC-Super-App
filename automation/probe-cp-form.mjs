import { chromium } from 'playwright';

const BASE = process.env.CP_BASE_URL || 'https://skyai-cloud-cc-qa.one-sky.ai';
const ORG  = process.env.CP_ORG;
const USER = process.env.CP_USERNAME;
const PASS = process.env.CP_PASSWORD;

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ baseURL: BASE });
const page    = await ctx.newPage();
page.setDefaultTimeout(20000);

// Login — same as LoginPage.ts
await page.goto('/cc/contacts-list');
await page.locator('#organization').fill(ORG);
await page.locator('#username').fill(USER);
await page.locator('#password').fill(PASS);
await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
await page.evaluate(() => localStorage.setItem('language', 'en'));
await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
console.log('Logged in, URL:', page.url());

// Open Add Customer form
await page.getByRole('button', { name: 'Add Customer' }).click();
await page.waitForLoadState('networkidle').catch(()=>{});
console.log('Add Customer URL:', page.url());
await page.waitForTimeout(1000);

// ─── 1. Native <select> vs combobox ───────────────────────────────────────────
const formInfo = await page.evaluate(() => {
  const selects = Array.from(document.querySelectorAll('select'));
  const combos  = Array.from(document.querySelectorAll('[role="combobox"]'));
  return {
    nativeSelects: selects.map(s => ({
      name: s.name || '(no name)',
      options: Array.from(s.options).map(o=>o.text).slice(0,10),
    })),
    comboboxes: combos.map(c => ({
      text: c.textContent?.trim()?.slice(0,60),
      ariaLabel: c.getAttribute('aria-label'),
      tagName: c.tagName,
    })),
  };
});
console.log('\n=== Native <select> count:', formInfo.nativeSelects.length);
formInfo.nativeSelects.forEach((s,i)=> console.log(` [${i}] "${s.name}" →`, s.options.join(' | ')));
console.log('\n=== [role=combobox] count:', formInfo.comboboxes.length);
formInfo.comboboxes.forEach((c,i)=> console.log(` [${i}] <${c.tagName}> text="${c.text}" aria-label="${c.ariaLabel}"`));

// ─── 2. Submit with empty email ────────────────────────────────────────────────
const phone = page.locator('input[name="mobileNo"]');
if (await phone.isVisible().catch(()=>false)) await phone.fill('0812345678');
const fn = page.locator('input[name="firstName"]');
if (await fn.isVisible().catch(()=>false)) await fn.fill('ProbeTest');
const ln = page.locator('input[name="lastName"]');
if (await ln.isVisible().catch(()=>false)) await ln.fill('User');
const emailEl = page.locator('input[name="email"]');
if (await emailEl.isVisible().catch(()=>false)) await emailEl.fill('');

await page.getByRole('button',{name:'Save'}).first().click();
await page.waitForTimeout(4000);

const errorsAfterEmptyEmail = await page.evaluate(() =>
  [...new Set(
    Array.from(document.querySelectorAll('body *'))
      .filter(e=>!e.children.length)
      .map(e=>(e.textContent||'').trim())
      .filter(t=>t.length>3 && t.length<300 &&
        /error|invalid|require|please|must|duplicate|enter|provide|cannot|format/i.test(t))
  )]
);
console.log('\n=== Error text after Save (empty email) ===');
if (!errorsAfterEmptyEmail.length) console.log('  (none matched)');
errorsAfterEmptyEmail.forEach(l=>console.log(' >', l));

// Also capture any aria-live / toast
const toasts = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[role="alert"],[aria-live],[class*="toast" i],[class*="snack" i]'))
    .map(e=>e.textContent?.trim()).filter(Boolean)
);
console.log('\n=== aria-live / toast ===');
if (!toasts.length) console.log('  (none)');
toasts.forEach(t=>console.log(' >', t?.slice(0,200)));

// ─── 3. Invalid email format ───────────────────────────────────────────────────
if (await emailEl.isVisible().catch(()=>false)) {
  await emailEl.fill('notvalidemail');
  await page.getByRole('button',{name:'Save'}).first().click();
  await page.waitForTimeout(3000);
  const invalidEmailErrs = await page.evaluate(() =>
    [...new Set(
      Array.from(document.querySelectorAll('body *'))
        .filter(e=>!e.children.length).map(e=>(e.textContent||'').trim())
        .filter(t=>t.length>3 && t.length<300 &&
          /email|invalid|format|enter|error/i.test(t))
    )]
  );
  console.log('\n=== Error text after "notvalidemail" ===');
  invalidEmailErrs.forEach(l=>console.log(' >', l));
}

await browser.close();
