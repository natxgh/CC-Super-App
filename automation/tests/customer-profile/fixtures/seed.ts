import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import type { CustomerData } from '../pages/CustomerFormPage';

/**
 * API-First Arrange + Teardown (GraphQL) — ✅ VERIFIED 2026-06-16 กับ STG BFF
 *   endpoint = https://cc-bff-qa.one-sky.ai/graphql  (override: env CP_GQL)
 *   auth     = JWT localStorage "access_token" (ดึงจาก browser หลัง login)
 *   ops      = Customer.CreateCustomer / DeleteCustomer(GetIdInput{id}) / GetListCustomer(ListDataInput{search,start,length})
 *   record   = { id, email, userType, firstName, displayName, ... }; create/delete → { status("0"=ok) msg data desc }
 *
 * seedCustomer = idempotent: ลบ record อีเมลซ้ำก่อน แล้ว create ใหม่ → ได้ข้อมูลตรง (รวม userType/tier) เสมอ
 */
export const GQL = process.env.CP_GQL || 'https://cc-bff-qa.one-sky.ai/graphql';
const EMAIL_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-emails.json');
const TOKEN_CACHE = path.join(__dirname, '..', '..', '..', 'test-results', '.token');

const CREATE = 'mutation ($input: CustomerInput!) { Customer { CreateCustomer (input: $input) { status msg data desc } } }';
const DELETE = 'mutation ($input: GetIdInput!) { Customer { DeleteCustomer (input: $input) { status msg data desc } } }';
const LIST = 'query ($input: ListDataInput!) { Customer { GetListCustomer (input: $input) { status msg data } } }';

const emptyAddr = {
  no: '', lat: '', lon: '', road: '', room: '', floor: '', street: '',
  country: '', building: '', district: '', province: '', postalCode: '', subDistrict: '',
};

// ── code maps (introspected จาก record จริง 2026-06-16) ───────────────────────
const TIER: Record<string, string> = { Bronze: '1', Silver: '2', Gold: '3', Platinum: '4' };
const GENDER: Record<string, string> = { Male: '1', Female: '2', Other: '3' };

// ── Custom Form (dynamicForm) template — formId จริงจาก STG ("Contact Customization") ──
const FORM_FIELDS = [
  { id: 'eb9d8676-e198-428f-aa28-5ac30df77603', label: 'Company Name', key: 'companyName' as const },
  { id: 'a4c66575-c5fc-453c-9102-c21365cfa6c7', label: 'Employee ID', key: 'employeeId' as const },
  { id: 'dbd255a1-634a-4d82-b56a-cf5b9bc0c776', label: 'Line ID ', key: 'lineId' as const },
  { id: '0ca38eca-4168-4076-b947-d9091a6c50d4', label: 'Driving  License', key: 'drivingLicense' as const },
  { id: 'af5f2d59-f77f-49ac-ad59-1df83d9907be', label: 'Position ', key: 'position' as const },
];

function buildDynamicForm(custom?: CustomerData['custom']) {
  if (!custom) return null;
  return {
    formId: '9797b7f3-d72e-432a-bb94-c013c64a1bab',
    formName: 'Contact Customization',
    formColSpan: 2,
    formFieldJson: FORM_FIELDS.map((f) => ({
      id: f.id, label: f.label, showLabel: true, type: 'textInput',
      value: custom[f.key] || '', placeholder: f.label, required: false,
      colSpan: 1, isChild: false, formRule: {},
    })),
    active: true, publish: true, versions: '2', locks: false,
    createdAt: '2026-04-09T10:02:18.833118Z', updatedAt: '2026-04-09T10:10:06.829241Z',
    createdBy: 'watee.tha', updatedBy: 'watee.tha', versionsInfoList: null, formType: 'customer',
  };
}

/** dob: "dd/mm/yyyy" (พ.ศ.) → "yyyy-mm-ddT00:00:00Z" (ค.ศ.) ตามที่ API คืน */
function toIsoDob(dob?: string): string {
  if (!dob) return '';
  const m = dob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, by] = m;
    let year = Number(by);
    if (year > 2400) year -= 543; // พ.ศ. → ค.ศ.
    return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dob)) return dob.includes('T') ? dob : `${dob}T00:00:00Z`;
  return dob;
}

// ── low-level GraphQL (ใช้ได้ทั้ง page.request และ APIRequestContext) ──────────
async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

export async function getToken(page: Page): Promise<string> {
  // poll รอ token (login async — localStorage เขียนหลัง redirect)
  let t: string | null = null;
  for (let i = 0; i < 20; i++) {
    t = await page.evaluate(() => localStorage.getItem('access_token'));
    if (t) break;
    await page.waitForTimeout(300);
  }
  if (!t) throw new Error('seed: ไม่พบ access_token (login ไม่สำเร็จ?)');
  fs.mkdirSync(path.dirname(TOKEN_CACHE), { recursive: true }); // cache ไว้ให้ teardown ใช้
  fs.writeFileSync(TOKEN_CACHE, t);
  return t;
}
export function cachedToken(): string | null {
  return fs.existsSync(TOKEN_CACHE) ? fs.readFileSync(TOKEN_CACHE, 'utf8').trim() : null;
}

function recordEmail(email: string) {
  fs.mkdirSync(path.dirname(EMAIL_STORE), { recursive: true });
  const cur: string[] = fs.existsSync(EMAIL_STORE) ? JSON.parse(fs.readFileSync(EMAIL_STORE, 'utf8')) : [];
  if (!cur.includes(email)) cur.push(email);
  fs.writeFileSync(EMAIL_STORE, JSON.stringify(cur, null, 2));
}

function toInput(d: CustomerData) {
  const reg = d.registered;
  // required core
  const input: Record<string, any> = {
    active: true,
    address: {
      ...emptyAddr, country: reg?.country || 'Thailand',
      no: reg?.houseNo || '', room: reg?.room || '', floor: reg?.floor || '',
      building: reg?.building || '', street: reg?.street || '', road: reg?.street || '',
      province: reg?.province || '', district: reg?.district || '',
      subDistrict: reg?.subdistrict || '', postalCode: reg?.postalCode || '',
    },
    currentAddress: { ...emptyAddr },
    displayName: [d.firstName, d.lastName].filter(Boolean).join(' ') || d.email,
    email: d.email,
    firstName: d.firstName || '',
    lastName: d.lastName || '',
    mobileNo: d.phone || '',
    id: 'add',
  };
  // optional — ใส่เฉพาะที่มีค่า (empty string ทำให้ validation พัง: gender/dob ฯลฯ)
  const set = (k: string, v?: string | null) => { if (v) input[k] = v; };
  set('title', (d.title || '').replace(/\.$/, ''));          // "Mr." → "Mr"
  set('middleName', d.middleName && d.middleName !== '-' ? d.middleName : undefined);
  set('landline', d.landline);
  set('citizenId', d.citizenId);
  set('dob', toIsoDob(d.dob) || undefined);                  // พ.ศ. → ISO
  set('gender', GENDER[d.gender || '']);                     // Male→"1"
  set('userType', TIER[d.type || '']);                       // Gold→"3"
  set('note', d.preferences?.note);
  set('languagePreference', d.preferences?.language);
  set('contractPreference', d.preferences?.contactMethod);   // sic: schema สะกด contract
  const dyn = buildDynamicForm(d.custom);
  if (dyn) input.dynamicForm = dyn;
  return input;
}

/** หา id ของ customer ตาม email (exact) — paginate ทั้งหมด (กัน DB ใหญ่/search ไม่ filter) */
export async function findIdsByEmail(req: APIRequestContext, token: string, email: string): Promise<string[]> {
  const ids: string[] = [];
  const PAGE = 500;
  for (let start = 0; start < 10000; start += PAGE) {
    const body = await gql(req, token, LIST, { input: { search: email, start, length: PAGE } });
    let data = body?.data?.Customer?.GetListCustomer?.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = []; } }
    const arr: any[] = Array.isArray(data) ? data : (data?.data || data?.list || []);
    if (!arr.length) break;
    for (const c of arr) if ((c.email || '').toLowerCase() === email.toLowerCase()) ids.push(String(c.id));
    if (arr.length < PAGE) break;
  }
  return ids;
}

export async function deleteById(req: APIRequestContext, token: string, id: string): Promise<boolean> {
  const body = await gql(req, token, DELETE, { input: { id } });
  return body?.data?.Customer?.DeleteCustomer?.status === '0';
}

/**
 * Arrange — สร้าง Customer (idempotent). ต้อง login UI ก่อน (อ่าน token จาก page)
 * ลบ record อีเมลซ้ำก่อน → create ใหม่ → ข้อมูลตรงเสมอ (รวม userType)
 */
export async function seedCustomer(page: Page, d: CustomerData): Promise<void> {
  const token = await getToken(page);
  const req = page.request;
  // 1) clear ของเก่าอีเมลเดียวกันให้เกลี้ยง (วนจนไม่เหลือ — กัน duplicate + ข้อมูลเก่าค้าง)
  for (let pass = 0; pass < 5; pass++) {
    const ids = await findIdsByEmail(req, token, d.email);
    if (!ids.length) break;
    for (const id of ids) await deleteById(req, token, id);
  }
  // 2) create ใหม่
  const body = await gql(req, token, CREATE, { input: toInput(d) });
  const r = body?.data?.Customer?.CreateCustomer;
  if (r?.status === '0') {
    recordEmail(d.email);
    return;
  }
  // create ไม่สำเร็จ — ถ้า "มีอยู่แล้ว" → ถือว่า Arrange สำเร็จ (เป้าหมาย = customer มีอยู่) ไม่ throw
  // เช็คทั้ง desc ("Email already exists") และ active list (record อาจไม่โผล่ใน list แต่มีจริง)
  const msg = `${r?.msg || ''} ${r?.desc || ''}`;
  if (/already exist|exist|duplicate|ซ้ำ/i.test(msg)) return;
  const existing = await findIdsByEmail(req, token, d.email);
  if (existing.length) return;
  throw new Error(`seedCustomer "${d.email}" failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
}

export async function seedCustomers(page: Page, list: CustomerData[]): Promise<void> {
  for (const d of list) await seedCustomer(page, d);
}

/** ลบ record ทุกตัวที่ใช้ email นี้ (clean slate ก่อน UI add) + record ไว้ให้ teardown */
export async function purgeByEmail(page: Page, email: string): Promise<void> {
  const token = await getToken(page);
  for (let p = 0; p < 5; p++) {
    const ids = await findIdsByEmail(page.request, token, email);
    if (!ids.length) break;
    for (const id of ids) await deleteById(page.request, token, id);
  }
  recordEmail(email); // ให้ teardown ลบ customer ที่ test สร้างผ่าน UI ด้วย
}
