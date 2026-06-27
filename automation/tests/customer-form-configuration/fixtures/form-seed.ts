import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
// reuse token plumbing จาก customer-profile seed (token cache เดียวกัน: test-results/.token)
import { getToken, cachedToken } from '../../customer-profile/fixtures/seed';
import { TEST_FORM_NAMES } from './testdata';

/**
 * API-First helpers — Customer Form Configuration (CFC + DFC)
 * endpoint = https://cc-bff-qa.one-sky.ai/graphql (override: env CP_GQL) · auth = JWT access_token
 *
 * ✅ VERIFIED ops (introspection 2026-06-20):
 *   Custom Form (Dynamic Form Builder):
 *     Forms.CreateForms(FormInput) / UpdateForms / DeleteForms(GetIdInput{id})
 *     Forms.GetFormAll(ListDataInput) / GetListForms / GetFormByFormId(GetIdInput{id})
 *   Default Field Config (the toggles):
 *     CustomerForm.GetListCustomerForm()              → อ่าน config ปัจจุบัน (snapshot)
 *     CustomerForm.UpdateCustomerForm(CustomerFormConfigUpdateInput) → save/restore
 *
 * ApiResponse = { status("0"=ok) msg data desc } · FormsListResult = { status msg data totalRecords ... }
 *
 * ⚠️ DEFAULT FIELD CONFIG = GLOBAL SINGLETON (ทั้ง org ใช้ร่วมกัน — ไม่มี create/delete)
 *    → teardown ของ DFC = snapshot ก่อน mutate + restore หลังจบ (ไม่ใช่ delete)
 *    ดู snapshotFieldConfig() / restoreFieldConfig() + teardown/global-teardown.ts
 */
export const GQL = process.env.CP_GQL || 'https://cc-bff-qa.one-sky.ai/graphql';

const RESULTS = path.join(__dirname, '..', '..', '..', 'test-results');
const CONFIG_SNAPSHOT = path.join(RESULTS, 'cfc-config-snapshot.json'); // DFC original config (restore target)
const CREATED_FORMS = path.join(RESULTS, 'cfc-created-forms.json');     // form names ที่ test สร้าง (purge)

// ── CustomerFormConfigUpdateInput keys (introspected) — ใช้สร้าง payload restore/update ─────
export const DFC_KEYS = [
  'displayName', 'title', 'firstName', 'middleName', 'lastName', 'citizenId', 'dob', 'blood', 'gender',
  'mobileNo', 'email', 'userType', 'note', 'languagePreference', 'contractPreference', 'photo',
] as const;
const DFC_JSON_KEYS = ['address', 'currentAddress', 'dynamicForm'] as const;

// ── GraphQL ops ───────────────────────────────────────────────────────────────
const FORM_LIST   = 'query ($input: ListDataInput) { Forms { GetFormAll (input: $input) { status msg data totalRecords } } }';
const FORM_DELETE = 'mutation ($input: GetIdInput!) { Forms { DeleteForms (input: $input) { status msg data desc } } }';
const FORM_CREATE = 'mutation ($input: FormInput) { Forms { CreateForms (input: $input) { status msg data desc } } }';
const CFG_GET     = 'query { CustomerForm { GetListCustomerForm { status msg data desc } } }';
const CFG_UPDATE  = 'mutation ($input: CustomerFormConfigUpdateInput!) { CustomerForm { UpdateCustomerForm (input: $input) { status msg data desc } } }';

async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

function parseData(raw: any): any {
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return raw; } }
  return raw;
}

// ════════════════════════════════════════════════════════════════════════════
//  Custom Form (Forms namespace) — Arrange + Teardown
// ════════════════════════════════════════════════════════════════════════════

/** หา form id(s) ตามชื่อ (exact, case-insensitive) — paginate GetFormAll */
export async function findFormIdsByName(req: APIRequestContext, token: string, name: string): Promise<string[]> {
  const ids: string[] = [];
  const body = await gql(req, token, FORM_LIST, { input: { search: name, start: 0, length: 500, formType: 'customer' } });
  let data = parseData(body?.data?.Forms?.GetFormAll?.data);
  const arr: any[] = Array.isArray(data) ? data : (data?.data || data?.list || []);
  for (const f of arr) {
    const fname = f.formName || f.name || '';
    if (String(fname).trim().toLowerCase() === name.trim().toLowerCase()) {
      ids.push(String(f.id ?? f.formId ?? f._id));
    }
  }
  return ids;
}

export async function deleteFormById(req: APIRequestContext, token: string, id: string): Promise<boolean> {
  const body = await gql(req, token, FORM_DELETE, { input: { id } });
  return body?.data?.Forms?.DeleteForms?.status === '0';
}

/** บันทึกชื่อฟอร์มที่ test สร้าง → teardown purge (เรียกตอน test กด Save Configuration สำเร็จ) */
export function registerCreatedForm(name: string) {
  fs.mkdirSync(RESULTS, { recursive: true });
  const cur: string[] = fs.existsSync(CREATED_FORMS) ? JSON.parse(fs.readFileSync(CREATED_FORMS, 'utf8')) : [];
  if (!cur.includes(name)) cur.push(name);
  fs.writeFileSync(CREATED_FORMS, JSON.stringify(cur, null, 2));
}

/** ลบฟอร์มทุกตัวที่ test สร้าง (ชื่อใน testdata.TEST_FORM_NAMES + ที่ register ไว้) */
export async function purgeTestForms(req: APIRequestContext, token: string): Promise<number> {
  const registered: string[] = fs.existsSync(CREATED_FORMS) ? JSON.parse(fs.readFileSync(CREATED_FORMS, 'utf8')) : [];
  const names = Array.from(new Set([...TEST_FORM_NAMES, ...registered]));
  let deleted = 0;
  for (const name of names) {
    const ids = await findFormIdsByName(req, token, name).catch(() => []);
    for (const id of ids) {
      if (await deleteFormById(req, token, id).catch(() => false)) deleted++;
    }
  }
  if (fs.existsSync(CREATED_FORMS)) fs.writeFileSync(CREATED_FORMS, '[]');
  return deleted;
}

/** clear ฟอร์มชื่อซ้ำก่อน UI สร้าง (clean slate — กัน "ชื่อซ้ำ" false positive ใน TS-01/TS-05) */
export async function purgeFormByName(page: Page, name: string): Promise<void> {
  const token = await getToken(page);
  const ids = await findFormIdsByName(page.request, token, name).catch(() => []);
  for (const id of ids) await deleteFormById(page.request, token, id);
  registerCreatedForm(name); // ให้ teardown ลบตัวที่ test สร้างผ่าน UI ด้วย
}

// ════════════════════════════════════════════════════════════════════════════
//  Default Field Config (CustomerForm namespace) — snapshot + restore (teardown)
// ════════════════════════════════════════════════════════════════════════════

/** อ่าน config ปัจจุบัน (raw object ของ toggles) */
export async function getFieldConfig(req: APIRequestContext, token: string): Promise<any> {
  const body = await gql(req, token, CFG_GET, {});
  return parseData(body?.data?.CustomerForm?.GetListCustomerForm?.data);
}

/** snapshot config เดิม → file (เรียกครั้งเดียวก่อน DFC test แตะ toggle) */
export async function snapshotFieldConfig(page: Page): Promise<void> {
  if (fs.existsSync(CONFIG_SNAPSHOT)) return; // snapshot แล้ว — ไม่ทับ (กันเขียน state ที่ test แก้ไปแล้ว)
  const token = await getToken(page);
  const cfg = await getFieldConfig(page.request, token).catch(() => null);
  if (cfg == null) return;
  fs.mkdirSync(RESULTS, { recursive: true });
  fs.writeFileSync(CONFIG_SNAPSHOT, JSON.stringify(cfg, null, 2));
}

/** สร้าง CustomerFormConfigUpdateInput payload จาก config object */
function toConfigInput(cfg: any): Record<string, any> {
  const input: Record<string, any> = {};
  for (const k of DFC_KEYS) if (typeof cfg?.[k] === 'boolean') input[k] = cfg[k];
  for (const k of DFC_JSON_KEYS) if (cfg?.[k] != null) input[k] = cfg[k];
  return input;
}

/** restore config เดิมจาก snapshot (teardown) — คืน true ถ้า restore สำเร็จ */
export async function restoreFieldConfig(req: APIRequestContext, token: string): Promise<boolean> {
  if (!fs.existsSync(CONFIG_SNAPSHOT)) return false;
  const cfg = JSON.parse(fs.readFileSync(CONFIG_SNAPSHOT, 'utf8'));
  const body = await gql(req, token, CFG_UPDATE, { input: toConfigInput(cfg) });
  const ok = body?.data?.CustomerForm?.UpdateCustomerForm?.status === '0';
  if (ok) fs.unlinkSync(CONFIG_SNAPSHOT); // ใช้แล้วลบ — กัน restore ค่าเก่าในรอบถัดไป
  return ok;
}

/** (best-effort) set toggle ผ่าน API เพื่อ Arrange baseline ของ scenario (เช่น Blood Type=OFF) */
export async function setFieldConfig(page: Page, patch: Record<string, any>): Promise<boolean> {
  const token = await getToken(page);
  const cur = (await getFieldConfig(page.request, token).catch(() => ({}))) || {};
  const merged = { ...toConfigInput(cur), ...patch };
  const body = await gql(page.request, token, CFG_UPDATE, { input: merged });
  return body?.data?.CustomerForm?.UpdateCustomerForm?.status === '0';
}

// re-export token helpers สำหรับ teardown
export { getToken, cachedToken };
