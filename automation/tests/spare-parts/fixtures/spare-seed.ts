import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import type { SparePartData } from './testdata';

/**
 * API-First Arrange + Teardown (GraphQL) — Spare Parts & Inventory
 *
 * ⚠️ UNVERIFIED OPS — the SparePart GraphQL namespace/operations below are modelled on the
 *    verified Product namespace (see product-inventory/fixtures/product-seed.ts) but have NOT
 *    been confirmed via introspection on https://cc-bff-qa.one-sky.ai/graphql.
 *    BEFORE executing the mutate scenarios (Add/Edit/Delete), introspect and fix the op names /
 *    input shape. Seed throws loudly on status≠"0" (it will NOT fake a pass).
 *    Override the namespace via env SP_GQL_NS if the schema differs.
 *
 * auth = JWT localStorage "access_token" (read from browser after UI login) — same pattern as product seed.
 * seedSparePart = idempotent: delete same code first, then create → data is always deterministic.
 */
export const GQL = process.env.CP_GQL || 'https://cc-bff-qa.one-sky.ai/graphql';
const NS = process.env.SP_GQL_NS || 'SparePart'; // ⚠️ verify: GraphQL namespace for spare parts
const CODE_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-spareparts.json');
const TOKEN_CACHE = path.join(__dirname, '..', '..', '..', 'test-results', '.token');

const CREATE = `mutation ($input: ${NS}Input!) { ${NS} { Create${NS} (input: $input) { status msg data desc } } }`;
const DELETE = `mutation ($input: GetIdInput!) { ${NS} { Delete${NS} (input: $input) { status msg data desc } } }`;
const LIST   = `query ($input: ListDataInput!) { ${NS} { GetList${NS} (input: $input) { status msg data } } }`;
const LIST_BRAND = 'query ($input: ListDataInput!) { Brand { GetListBrand (input: $input) { status msg data } } }';
const LIST_CATEGORY = 'query ($input: ListDataInput!) { Category { GetListCategory (input: $input) { status msg data } } }';

async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

function asArray(data: any): any[] {
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return []; } }
  return Array.isArray(data) ? data : (data?.data || data?.list || []);
}

export async function getToken(page: Page): Promise<string> {
  let t: string | null = null;
  for (let i = 0; i < 20; i++) {
    t = await page.evaluate(() => localStorage.getItem('access_token'));
    if (t) break;
    await page.waitForTimeout(300);
  }
  if (!t) throw new Error('spare-seed: ไม่พบ access_token (login ไม่สำเร็จ?)');
  fs.mkdirSync(path.dirname(TOKEN_CACHE), { recursive: true });
  fs.writeFileSync(TOKEN_CACHE, t);
  return t;
}

function recordCode(code: string) {
  fs.mkdirSync(path.dirname(CODE_STORE), { recursive: true });
  const cur: string[] = fs.existsSync(CODE_STORE) ? JSON.parse(fs.readFileSync(CODE_STORE, 'utf8')) : [];
  if (!cur.includes(code)) cur.push(code);
  fs.writeFileSync(CODE_STORE, JSON.stringify(cur, null, 2));
}

async function resolveId(req: APIRequestContext, token: string, query: string, ns: 'Brand' | 'Category', name: string): Promise<string> {
  const body = await gql(req, token, query, { input: { search: name, start: 0, length: 200 } });
  const arr = asArray(body?.data?.[ns]?.[`GetList${ns}`]?.data);
  const norm = (s: any) => String(s ?? '').trim().toLowerCase();
  const hit = arr.find((x) => [x.name, x.th, x.en, x.brandName, x.categoryName].some((v) => norm(v) === norm(name)));
  if (!hit) throw new Error(`spare-seed: หา ${ns} "${name}" ไม่เจอ (มี ${arr.length} รายการ) — ตรวจชื่อใน testdata ให้ตรง master data จริง`);
  return String(hit.id ?? hit._id);
}

async function toInput(req: APIRequestContext, token: string, d: SparePartData) {
  const brandId = await resolveId(req, token, LIST_BRAND, 'Brand', d.brand);
  const categoryId = await resolveId(req, token, LIST_CATEGORY, 'Category', d.category);
  const code = d.code ?? d.en;
  const input: Record<string, any> = {
    id: 'add',
    active: d.active ?? true,
    brandId,
    categoryId,
    code,
    th: d.th ?? d.en,
    en: d.en,
  };
  if (d.price != null) input.price = d.price;
  if (d.warranty != null) input.warranty = d.warranty;
  if (d.year != null) input.mfd = d.year;
  if (d.image) input.image = d.image;
  return input;
}

export async function findIdsByCode(req: APIRequestContext, token: string, code: string): Promise<string[]> {
  const ids: string[] = [];
  const PAGE = 500;
  for (let start = 0; start < 10000; start += PAGE) {
    const body = await gql(req, token, LIST, { input: { search: code, start, length: PAGE } });
    const arr = asArray(body?.data?.[NS]?.[`GetList${NS}`]?.data);
    if (!arr.length) break;
    for (const p of arr) if ([p.code, p.en, p.sparePartCode].some((v) => String(v || '').toLowerCase() === code.toLowerCase())) ids.push(String(p.id ?? p._id));
    if (arr.length < PAGE) break;
  }
  return ids;
}

export async function deleteById(req: APIRequestContext, token: string, id: string): Promise<boolean> {
  const body = await gql(req, token, DELETE, { input: { id } });
  return body?.data?.[NS]?.[`Delete${NS}`]?.status === '0';
}

/** Arrange — create a spare part (idempotent). Must login UI first (reads token from page). */
export async function seedSparePart(page: Page, d: SparePartData): Promise<void> {
  const token = await getToken(page);
  const req = page.request;
  const code = d.code ?? d.en;
  for (let pass = 0; pass < 5; pass++) {
    const ids = await findIdsByCode(req, token, code);
    if (!ids.length) break;
    for (const id of ids) await deleteById(req, token, id);
  }
  const body = await gql(req, token, CREATE, { input: await toInput(req, token, d) });
  const r = body?.data?.[NS]?.[`Create${NS}`];
  if (r?.status === '0') { recordCode(code); return; }
  const msg = `${r?.msg || ''} ${r?.desc || ''}`;
  if (/already exist|exist|duplicate|ซ้ำ/i.test(msg)) return;
  const existing = await findIdsByCode(req, token, code);
  if (existing.length) return;
  throw new Error(`seedSparePart "${code}" failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)} — ⚠️ ยืนยัน SparePart GraphQL ops (UNVERIFIED) ก่อน`);
}

/** clean slate before UI add + record for teardown */
export async function purgeByCode(page: Page, code: string): Promise<void> {
  const token = await getToken(page);
  for (let p = 0; p < 5; p++) {
    const ids = await findIdsByCode(page.request, token, code);
    if (!ids.length) break;
    for (const id of ids) await deleteById(page.request, token, id);
  }
  recordCode(code);
}
