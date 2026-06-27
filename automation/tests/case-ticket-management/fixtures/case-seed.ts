import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, getToken, findIdsByEmail } from '../../customer-profile/fixtures/seed';

/**
 * API-First Arrange + Teardown สำหรับ Case (CTM)
 * ✅ Ops verified ผ่าน GraphQL introspection (2026-06-20) + live probe (2026-06-22):
 *   Mutation { Case { CreateCase(CaseInsertInput!) → { status msg desc caseId } } }
 *   Mutation { Case { UpdateCase(CaseUpdateInput!) } } — advance lifecycle statusId
 *   Mutation { Case { DeleteCase(GetIdInput!{id}) } } — teardown
 *   Query  { Case { GetListCase(CaseListInput) } } — find by detail
 *   Query  { CaseTypes { GetListCaseTypeWithSubTypes } } — includes typeId(UUID), sTypeId(UUID), wfId(UUID)
 *   Query  { CaseStatus { GetListCaseStatus(ListDataInput) } } — statusId code (S000, S001…)
 *
 * ✅ Correct field mappings (probe 2026-06-22):
 *   - caseTypeId  = typeId (UUID), NOT numeric id
 *   - caseSTypeId = sTypeId (UUID), NOT sTypeCode (1001/1002…)
 *   - statusId    = statusId code (S000/S001…), NOT numeric id
 *   - caseVersion = "draft" for draft (UI sends this)
 *   - wfId        = workflow UUID from GetListCaseTypeWithSubTypes
 *   - source      = "01" (UI value), NOT "automation"
 *   - usercreate  = username string
 *
 * 🐛 KNOWN BUG — CreateCase broken on QA env (2026-06-22):
 *   - Without `versions` field → DB NOT NULL constraint fires (tix_cases.versions NOT NULL)
 *   - With    `versions` field → BFF crashes with HTTP 500 (server-level error)
 *   - Root cause: DB schema has versions NOT NULL without DEFAULT; BFF resolver crashes on provided value
 *   - Impact: ALL seed-based tests (TS-01 lifecycle, TS-03 edit, TS-04 close) cannot run until fixed
 *   - Workaround: none available via API; track as BUG for dev team
 *
 * ⚠️ GAPS (ดู MISSING-API.md):
 *   - close approval flow still needs UI/workflow op confirmation
 *   - attachment upload channel (presign?) unprobed
 */

// CreateCaseResponse fields (verified 2026-06-22): status, msg, desc, caseId (NOT data)
const CREATE = 'mutation ($input: CaseInsertInput!) { Case { CreateCase(input: $input) { status msg desc caseId } } }';
const UPDATE = 'mutation ($input: CaseUpdateInput!) { Case { UpdateCase(input: $input) { status msg data desc } } }';
const DELETE = 'mutation ($input: GetIdInput!) { Case { DeleteCase(input: $input) { status msg data desc } } }';
const LIST = 'query ($input: CaseListInput) { Case { GetListCase(input: $input) { status msg data } } }';
// GetListCaseTypeWithSubTypes returns typeId(UUID), sTypeId(UUID), wfId(UUID) — no input filter needed
const LIST_TYPE = 'query { CaseTypes { GetListCaseTypeWithSubTypes { status msg data } } }';
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

/**
 * Resolve CaseType display name (e.g. "1002-Camera Malfunction -Repair") → { caseTypeId, caseSTypeId, wfId }
 * Uses GetListCaseTypeWithSubTypes which returns UUID fields: typeId, sTypeId, wfId.
 * Name matching: sTypeCode + typeName + subTypeName (e.g. "1002-Camera Malfunction -Repair")
 */
export async function resolveCaseTypeIds(req: APIRequestContext, token: string, displayName: string): Promise<{ caseTypeId: string; caseSTypeId: string; wfId: string; caseSla: string }> {
  if (!_typeCache) {
    const body = await gql(req, token, LIST_TYPE, {});
    _typeCache = parseData(body?.data?.CaseTypes?.GetListCaseTypeWithSubTypes?.data);
  }
  // displayName format: "1002-Camera Malfunction -Repair" = `${sTypeCode}-${en} -${subTypeEn}`
  const hit = _typeCache.find((r: any) => {
    const label = `${r.sTypeCode}-${r.en?.trim()} -${r.subTypeEn?.trim()}`;
    return norm(label) === norm(displayName);
  }) || _typeCache.find((r: any) => norm(displayName).includes(norm(r.subTypeEn ?? '')) && norm(displayName).includes(norm(r.en ?? '')));
  if (!hit) throw new Error(`CaseType "${displayName}" not found (sample=${JSON.stringify(_typeCache[0] || {})})`);
  return { caseTypeId: String(hit.typeId ?? ''), caseSTypeId: String(hit.sTypeId ?? ''), wfId: String(hit.wfId ?? ''), caseSla: String(hit.caseSla ?? '') };
}

/** @deprecated use resolveCaseTypeIds — returns only typeId UUID for backwards compat */
export async function resolveCaseTypeId(req: APIRequestContext, token: string, name: string): Promise<string> {
  return (await resolveCaseTypeIds(req, token, name)).caseTypeId;
}

/**
 * Resolve CaseStatus English name → statusId CODE (S000, S001, …) — NOT numeric id.
 * Default (name omitted) = 'S000' (Draft).
 * Probe 2026-06-22: statusId field in response = "S000"/"S001" etc.
 */
export async function resolveStatusId(req: APIRequestContext, token: string, name?: string): Promise<string> {
  if (!_statusCache) {
    const body = await gql(req, token, LIST_STATUS, { input: { search: '', start: 0, length: 1000 } });
    _statusCache = parseData(body?.data?.CaseStatus?.GetListCaseStatus?.data);
  }
  if (!_statusCache.length) return 'S000';
  if (!name) return String(_statusCache[0].statusId ?? '');
  const hit = _statusCache.find((r: any) => norm(r.en) === norm(name)) || _statusCache.find((r: any) => norm(r.en).includes(norm(name)));
  if (!hit) throw new Error(`CaseStatus "${name}" not found (${_statusCache.length} rows; sample=${JSON.stringify(_statusCache[0] || {})})`);
  return String(hit.statusId ?? '');
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
 * คืน case id. status === '0' = ok.
 *
 * 🐛 KNOWN BUG (2026-06-22): CreateCase ยังมี bug บน QA env:
 *   - ไม่ส่ง versions → DB NOT NULL constraint fails
 *   - ส่ง versions → BFF crashes 500
 *   → seedCase จะ throw error จนกว่า dev จะแก้ไข
 *   → Tests ที่ depend on seedCase (TS-01/03/04) ควร test.fixme ไว้ก่อน
 *
 * ✅ Correct input fields (probe 2026-06-22):
 *   caseTypeId  = UUID from GetListCaseTypeWithSubTypes.typeId (NOT numeric id)
 *   caseSTypeId = UUID from GetListCaseTypeWithSubTypes.sTypeId
 *   statusId    = S-code (S000/S001…) from GetListCaseStatus.statusId
 *   wfId        = UUID from GetListCaseTypeWithSubTypes.wfId
 *   caseVersion = "draft" (for draft saves) / not needed for direct status
 *   source      = "01" (CC create); "automation" also accepted
 */
export async function seedCase(page: Page, d: CaseSeed): Promise<string> {
  const token = await getToken(page);
  const req = page.request;
  const { caseTypeId, caseSTypeId, wfId, caseSla } = await resolveCaseTypeIds(req, token, d.caseType);
  const statusId = await resolveStatusId(req, token, d.status);
  let customerId: number | undefined;
  if (d.email) {
    const ids = await findIdsByEmail(req, token, d.email);
    if (ids.length) customerId = Number(ids[0]);
  }
  const now = new Date().toISOString();
  const input: Record<string, any> = {
    caseTypeId,
    caseSTypeId,
    wfId,
    caseSla,
    statusId,
    caseDetail: d.caseDetail,
    priority: d.priority ?? 3,
    phoneNo: d.phone ?? '',
    source: 'automation',
    caseVersion: 'draft',
    caseDuration: 0,
    createdDate: now,
    startedDate: now,
    scheduleFlag: false,
    attachments: [],
    // NOTE: `versions` field intentionally omitted — BFF crashes (500) when provided.
    // Without it, DB NOT NULL fires. Bug tracked: BFF should auto-set versions=1 on create.
  };
  if (customerId != null) input.customerId = customerId;

  const body = await gql(req, token, CREATE, { input });
  const r = body?.data?.Case?.CreateCase;
  if (r?.status !== '0') {
    throw new Error(`seedCase failed (🐛 known BUG: versions field breaks CreateCase on QA): status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
  }
  let id = String(r?.caseId ?? r?.data ?? '');
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
