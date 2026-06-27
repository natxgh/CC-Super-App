// probe: check ServiceType GraphQL query on BFF
import { chromium } from '@playwright/test';
import * as fs from 'fs';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const BASE = process.env.CP_BASE_URL;
const ORG  = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME;
const PASS = process.env.CP_PASSWORD;
const GQL  = 'https://cc-bff-qa.one-sky.ai/graphql';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true, baseURL: BASE });
await page.goto('/cc/contacts-list');
await page.locator('#username').waitFor({ timeout: 20000 });
await page.locator('#organization').fill(ORG);
await page.locator('#username').fill(USER);
await page.locator('#password').fill(PASS);
await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
const token = await page.evaluate(() => localStorage.getItem('access_token'));
console.log('login OK');

// introspect top-level query fields
const intro = await page.request.post(GQL, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  data: { query: '{ __schema { queryType { fields { name } } } }' },
});
const schema = await intro.json();
const topFields = schema?.data?.__schema?.queryType?.fields?.map((f) => f.name) || [];
console.log('\nTop-level query types:', topFields);

// ลอง ServiceType query
const svcQuery = `query { ServiceType { GetListServiceType { status msg data desc } } }`;
const svcRes = await page.request.post(GQL, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  data: { query: svcQuery },
});
const svcJson = await svcRes.json();
console.log('\n=== ServiceType query ===');
console.log(JSON.stringify(svcJson, null, 2).slice(0, 3000));

// parse items ถ้าสำเร็จ
const inner = svcJson?.data?.ServiceType?.GetListServiceType;
if (inner?.status === '0') {
  let items = inner.data;
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch {} }
  if (Array.isArray(items)) {
    console.log(`\n=== ${items.length} service types — first 3:`);
    console.log(JSON.stringify(items.slice(0, 3), null, 2));
    if (items.length > 0) console.log('KEYS:', Object.keys(items[0]));
  }
}

await browser.close();
