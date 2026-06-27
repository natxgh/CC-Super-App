import { chromium } from 'playwright';
import * as fs from 'fs';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { CP_BASE_URL: BASE, CP_ORG: ORG = '', CP_USERNAME: USER, CP_PASSWORD: PASS, CP_GQL } = process.env;
const GQL = CP_GQL || 'https://cc-bff-qa.one-sky.ai/graphql';

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

async function gql(query, variables = {}) {
  const res = await page.request.post(GQL, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { query, variables },
  });
  return res.json();
}

const CFG_GET = 'query { CustomerForm { GetListCustomerForm { status msg data desc } } }';
const CFG_UPD = 'mutation ($input: CustomerFormConfigUpdateInput!) { CustomerForm { UpdateCustomerForm (input: $input) { status msg data desc } } }';
const KEYS = ['photo','title','firstName','middleName','lastName','citizenId','dob','blood','gender','mobileNo','email','userType','note','languagePreference','contractPreference'];

function parseData(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
  return raw;
}

const cur = await gql(CFG_GET);
const raw = cur?.data?.CustomerForm?.GetListCustomerForm;
console.log('GetListCustomerForm raw status:', raw?.status, 'msg:', raw?.msg);
const cfg = parseData(raw?.data);
console.log('\n=== Current config (Personal Details) ===');
for (const k of KEYS) console.log(` ${k}: ${cfg[k]}`);

const patch = { photo: true, title: true, firstName: true, middleName: true, lastName: true, dob: true, gender: true, citizenId: true, email: true, mobileNo: true, userType: true, note: true, languagePreference: true, contractPreference: true };
const input = {};
for (const k of KEYS) input[k] = patch[k] ?? (typeof cfg[k] === 'boolean' ? cfg[k] : undefined);
if (cfg.address != null) input.address = cfg.address;
if (cfg.currentAddress != null) input.currentAddress = cfg.currentAddress;
if (cfg.dynamicForm != null) input.dynamicForm = cfg.dynamicForm;

console.log('\n=== Sending input (first 400 chars) ===');
console.log(JSON.stringify(input).slice(0, 400));

const upd = await gql(CFG_UPD, { input });
const updResult = upd?.data?.CustomerForm?.UpdateCustomerForm;
console.log('\n=== UpdateCustomerForm result ===', JSON.stringify(updResult));
if (upd?.errors) console.log('ERRORS:', JSON.stringify(upd.errors));

const after = await gql(CFG_GET);
const cfg2 = parseData(after?.data?.CustomerForm?.GetListCustomerForm?.data);
console.log('\n=== After update ===');
for (const k of KEYS) console.log(` ${k}: ${cfg2[k]}`);

await browser.close();
