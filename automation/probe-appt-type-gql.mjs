// probe: GetListAppointmentType via GraphQL BFF
import { chromium } from '@playwright/test';
import * as fs from 'fs';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const BASE = process.env.CP_BASE_URL || 'https://skyai-cloud-cc-qa.one-sky.ai';
const ORG  = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME;
const PASS = process.env.CP_PASSWORD;
const GQL  = 'https://cc-bff-qa.one-sky.ai/graphql';

const browser = await chromium.launch({ headless: true });
const page    = await browser.newPage({ ignoreHTTPSErrors: true, baseURL: BASE });

console.log('### LOGIN');
await page.goto('/cc/contacts-list');
await page.locator('#username').waitFor({ timeout: 20000 });
await page.locator('#organization').fill(ORG);
await page.locator('#username').fill(USER);
await page.locator('#password').fill(PASS);
await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
console.log('login OK');

const token = await page.evaluate(() => localStorage.getItem('access_token'));
console.log('token:', token ? token.slice(0,30)+'…' : 'MISSING');

const query = `
  query GetListAppointmentType {
    AppointmentType {
      GetListAppointmentType {
        status
        msg
        data
        desc
      }
    }
  }
`;

const res = await page.request.post(GQL, {
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  data: { query },
});

const json = await res.json();
console.log('\n=== RAW RESPONSE ===');
console.log(JSON.stringify(json, null, 2).slice(0, 3000));

// ถ้า data เป็น string JSON → parse ด้วย
const inner = json?.data?.AppointmentType?.GetListAppointmentType;
if (inner) {
  console.log('\n=== status:', inner.status, '| msg:', inner.msg);
  let items = inner.data;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch {}
  }
  if (Array.isArray(items)) {
    console.log(`=== ${items.length} items — first 3:`);
    console.log(JSON.stringify(items.slice(0, 3), null, 2));
    if (items.length > 0) console.log('\n=== KEYS:', Object.keys(items[0]));
  } else {
    console.log('=== data (raw):', JSON.stringify(items, null, 2).slice(0, 1000));
  }
}

await browser.close();
