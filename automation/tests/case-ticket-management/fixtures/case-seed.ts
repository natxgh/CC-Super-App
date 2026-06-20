import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, getToken, findIdsByEmail } from '../../customer-profile/fixtures/seed';

/**
 * API-First Arrange + Teardown สำหรับ Case (CTM)
 * ✅ Ops verified ผ่าน GraphQL introspection (2026-06-20) — endpoint เดียวกับ Customer/Appointment (cc-bff-qa/graphql), JWT เดิม
 *
 * Root namespacing (เหมือน Customer):  Mutation { Case { CreateCase / UpdateCase / DeleteCase } }
 *   CreateCase(CaseInsertInput!)  → { status("0"=ok) msg data desc }   (data = new case id)
 *   UpdateCase(CaseUpdateInput!)  → ใช้เลื่อน statusId (lifecycle) ถ้าต้อง arrange เคสกลางทาง
 *   DeleteCase(GetIdInput!{id})   → teardown
 *   Query { Case { GetListCase(CaseListInput) , GetCaseById(GetIdInput) } }
 *   master-data: Query { CaseTypes { GetListCaseType(ListDataInput) } , CaseStatus { GetListCaseStatus(ListDataInput) } }
 *
 * ⚠️ MISSING / GAP (ดู MISSING-API.md):
 *   - ไม่พบ API เดี่ยวสำหรับ "close approval flow" (Request close approval → Approve → Completed).
 *     arrange เคสที่ "ปิดแล้ว/On Site" ทำได้ด้วย CreateCase + statusId ที่ resolve มา แต่ตัว approval transition
 *     ต้องทำผ่าน UI/workflow node (wfId/nodeId) — ยังไม่ได้ verify op name.
 */

const CREATE = 'mutation ($input: CaseInsertInput!) { Case { CreateCase(input: $input) { status msg data desc } } }';
const UPDATE = 'mutation ($input: CaseUpdateInput!) { Case { UpdateCase(input: $input) { status msg data desc } } }';
const DELETE = 'mutation ($input: GetIdInput!) { Case { DeleteCase(input: $input) { status msg data desc } } }';
const LIST = 'query ($input: CaseListInput) { Case { GetListCase(input: $input) { status msg data } } }';
const LIST_TYPE = 'query ($input: ListDataInput) { CaseTypes { GetListCaseType(input: $input) { status msg data } } }';
const LIST_STATUS = 'query ($input: ListDataInput) { CaseStatus { GetListCaseStatus(input: $input) { status msg data } } }';

const CASE_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-cases.json');

export interface CaseSeed {
  caseType: string;       // English name → resolve → caseTypeId
  caseDetail: string;
  email?: string;         // customer to link (resolve → customerId)
  phone?: string;
  status?: string;        // English status name → resolve → statusId (default = first/New)
  priority?: number;
}

async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

function parseData(raw: any): any[] {
  let data = raw;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = []; } }
  return Array.isArray(data) ? data : (data?.data || data?.list || []);
}

const norm = (s: any) => String(s ?? '').trim().toLowerCase();

let _typeCache: any[] | null = null;
let _statusCache: any[] | null = null;

/** resolve CaseType English name → id */
export async function resolveCaseTypeId(req: APIRequestContext, token: string, name: string): Promise<string> {
  if (!_typeCache) {
    const body = await gql(req, token, LIST_TYPE, { input: { search: '', start: 0, length: 1000 } });
    _typeCache = parseData(body?.data?.CaseTypes?.GetListCaseType?.data);
  }
  const hit = _typeCache.find((r) => norm(r.en) === norm(name)) || _typeCache.find((r) => norm(r.en).includes(norm(name)));
  if (!hit) throw new Error(`CaseType "${name}" not found (${_typeCache.length} rows; sample=${JSON.stringify(_typeCache[0] || {})})`);
  return String(hit.id ?? hit.caseTypeId ?? '');
}

/** resolve CaseStatus English name → statusId (default = first row when name omitted) */
export async function resolveStatusId(req: APIRequestContext, token: string, name?: string): Promise<string> {
  if (!_statusCache) {
    const body = await gql(req, token, LIST_STATUS, { input: { search: '', start: 0, length: 1000 } });
    _statusCache = parseData(body?.data?.CaseStatus?.GetListCaseStatus?.data);
  }
  if (!_statusCache.length) return '';
  if (!name) return String(_statusCache[0].statusId ?? _statusCache[0].id ?? '');
  const hit = _statusCache.find((r) => norm(r.en) === norm(name)) || _statusCache.find((r) => norm(r.en).includes(norm(name)));
  if (!hit) throw new Error(`CaseStatus "${name}" not found (${_statusCache.length} rows; sample=${JSON.stringify(_statusCache[0] || {})})`);
  return String(hit.statusId ?? hit.id ?? '');
}

function recordCase(id: string) {
  if (!id) return;
  fs.mkdirSync(path.dirname(CASE_STORE), { recursive: true });
  const cur: string[] = fs.existsSync(CASE_STORE) ? JSON.parse(fs.readFileSync(CASE_STORE, 'utf8')) : [];
  if (!cur.includes(id)) cur.push(id);
  fs.writeFileSync(CASE_STORE, JSON.stringify(cur, null, 2));
}

/** find case ids whose detail matches (used to locate the seeded/created case for cleanup) */
export async function findCaseIdsByDetail(req: APIRequestContext, token: string, detail: string): Promise<string[]> {
  const body = await gql(req, token, LIST, { input: { detail, start: 0, length: 200 } });
  const arr = parseData(body?.data?.Case?.GetListCase?.data);
  return arr
    .filter((c) => norm(c.caseDetail ?? c.detail ?? '').includes(norm(detail)))
    .map((c) => String(c.id ?? c.caseId ?? c._id))
    .filter(Boolean);
}

/**
 * Arrange — สร้าง Case ผ่าน API (ต้อง login UI ก่อน เพื่อมี token).
 * คืน case id. status === '0' = ok (เหมือน Customer/Appointment ops)
 */
export async function seedCase(page: Page, d: CaseSeed): Promise<string> {
  const token = await getToken(page);
  const req = page.request;
  const caseTypeId = await resolveCaseTypeId(req, token, d.caseType);
  const statusId = await resolveStatusId(req, token, d.status);
  let customerId: number | undefined;
  if (d.email) {
    const ids = await findIdsByEmail(req, token, d.email);
    if (ids.length) customerId = Number(ids[0]);
  }
  const input: Record<string, any> = {
    caseTypeId,
    statusId,
    caseDetail: d.caseDetail,
    priority: d.priority ?? 1,
    phoneNo: d.phone ?? '',
    source: 'automation',
    versions: '1', // schema เคยมี bug versions NOT NULL (PO: Fixed) → ส่ง explicit กันพลาด
  };
  if (customerId != null) input.customerId = customerId;

  const body = await gql(req, token, CREATE, { input });
  const r = body?.data?.Case?.CreateCase;
  if (r?.status !== '0') {
    throw new Error(`seedCase failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
  }
  // r.data = new case id (best-effort) — fallback: re-list by detail
  let id = typeof r.data === 'string' ? r.data : String(r?.data?.id ?? '');
  if (!/^\d+/.test(id)) {
    const found = await findCaseIdsByDetail(req, token, d.caseDetail);
    id = found[found.length - 1] || id;
  }
  recordCase(id);
  return id;
}

/** Teardown — ลบ case ที่ automation seed/สร้างไว้ (อ่านจาก seeded-cases.json). คืนจำนวนที่ลบสำเร็จ */
export async function teardownSeededCases(req: APIRequestContext, token: string): Promise<number> {
  if (!fs.existsSync(CASE_STORE)) return 0;
  const ids: string[] = JSON.parse(fs.readFileSync(CASE_STORE, 'utf8'));
  let deleted = 0;
  for (const id of ids) {
    const body = await gql(req, token, DELETE, { input: { id } }).catch(() => null);
    if (body?.data?.Case?.DeleteCase?.status === '0') deleted++;
  }
  fs.writeFileSync(CASE_STORE, '[]');
  return deleted;
}

/** ลบ case ทุกตัวที่ detail ตรง (idempotent clean-slate ก่อน UI create + จับ case ที่ test สร้างผ่าน UI) */
export async function purgeCasesByDetail(page: Page, detail: string): Promise<void> {
  const token = await getToken(page);
  const req = page.request;
  for (const id of await findCaseIdsByDetail(req, token, detail)) {
    await gql(req, token, DELETE, { input: { id } }).catch(() => null);
    recordCase(id); // record ไว้ด้วย เผื่อ delete ไม่สำเร็จรอบนี้ → teardown ลองซ้ำ
  }
}

/** เรียกหลัง UI create เสร็จ เพื่อจับ case id ที่เพิ่งสร้าง (detail match) → ให้ teardown ลบ */
export async function registerCreatedCase(page: Page, detail: string): Promise<void> {
  const token = await getToken(page);
  for (const id of await findCaseIdsByDetail(page.request, token, detail)) recordCase(id);
}
