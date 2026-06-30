import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import type { SparePartData } from './testdata';

/**
 * API-First Arrange + Teardown (GraphQL) — Spare Parts & Inventory
 *
 * ✅ VERIFIED 2026-06-29 via introspection + live create/delete on https://cc-bff-qa.one-sky.ai/graphql:
 *    - namespace = `Sparepart` (lowercase p) · Create/Update/DeleteSparepart · input SparePartInput! / GetIdInput!
 *    - SparePartInput requires UUID brandId/categoryId/productId (NOT the numeric master `id`) + mfd/warranty/price/active
 *    - there is NO `code` field — identity is by `en`
 *    - DeleteSparepart takes the row's `partId` UUID (NOT numeric `id`)
 *    - stock level is seeded via SparepartStock (serialNumber[] length = stock count)
 *
 * Principle: every scenario Arranges its OWN data here and tears it down in afterAll — NEVER relies on
 * pre-existing STG inventory. Seed throws loudly on status≠"0" (it will NOT fake a pass).
 *
 * auth = JWT localStorage "access_token" (read from browser after UI login).
 */
export const GQL = process.env.CP_GQL || 'https://cc-bff-qa.one-sky.ai/graphql';
const TOKEN_CACHE = path.join(__dirname, '..', '..', '..', 'test-results', '.token');

const CREATE = 'mutation ($input: SparePartInput!) { Sparepart { CreateSparepart (input: $input) { status msg data desc } } }';
const UPDATE = 'mutation ($input: SparePartInput!) { Sparepart { UpdateSparepart (input: $input) { status msg data desc } } }';
const DELETE = 'mutation ($input: GetIdInput!) { Sparepart { DeleteSparepart (input: $input) { status msg } } }';
const LIST   = 'query ($input: ListDataInput!) { Sparepart { GetListSparepart (input: $input) { status msg data } } }';
const LIST_BRAND = 'query ($input: ListDataInput!) { Brand { GetListBrand (input: $input) { status data } } }';
const LIST_CATEGORY = 'query ($input: ListDataInput!) { Category { GetListCategory (input: $input) { status data } } }';
const LIST_PRODUCT = 'query ($input: ListDataInput!) { Product { GetListProduct (input: $input) { status data } } }';
const STOCK_CREATE = 'mutation ($input: SparepartStockInput!) { SparepartStock { CreateSparepartStock (input: $input) { status msg } } }';
const STOCK_DELETE = 'mutation ($input: GetIdInput_2!) { SparepartStock { DeleteSparepartStock (input: $input) { status msg } } }';
const STOCK_SERIALS = 'query ($input: ListDataInput!) { SparepartStock { GetListSparepartSerial (input: $input) { status data } } }';
const LIST_STORE = 'query ($input: ListDataInput!) { Store { GetListStore (input: $input) { status data } } }';

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

const norm = (s: any) => String(s ?? '').trim().toLowerCase();

/** resolve a master-data UUID by display name. uuidField = the entity's own UUID column (brandId/categoryId/productId). */
async function resolveUuid(
  req: APIRequestContext, token: string, query: string, ns: string, fld: string, uuidField: string, name: string,
): Promise<string> {
  const body = await gql(req, token, query, { input: { search: name, start: 0, length: 200 } });
  const arr = asArray(body?.data?.[ns]?.[fld]?.data);
  const hit = arr.find((x) => [x.en, x.th, x.name].some((v) => norm(v) === norm(name)));
  if (!hit) throw new Error(`spare-seed: หา ${ns} "${name}" ไม่เจอ (มี ${arr.length} รายการ) — ตรวจชื่อใน testdata ให้ตรง master data จริง`);
  const id = hit[uuidField];
  if (!id) throw new Error(`spare-seed: ${ns} "${name}" ไม่มี field ${uuidField}`);
  return String(id);
}

async function toInput(req: APIRequestContext, token: string, d: SparePartData) {
  const brandId = await resolveUuid(req, token, LIST_BRAND, 'Brand', 'GetListBrand', 'brandId', d.brand);
  const categoryId = await resolveUuid(req, token, LIST_CATEGORY, 'Category', 'GetListCategory', 'categoryId', d.category);
  const productId = await resolveUuid(req, token, LIST_PRODUCT, 'Product', 'GetListProduct', 'productId', d.belongTo!);
  return {
    id: 'add',
    en: d.en,
    th: d.th ?? d.en,
    brandId,
    categoryId,
    productId,
    mfd: d.year ?? 2026,
    warranty: d.warranty ?? 365,
    price: d.price ?? 0,
    active: d.active ?? true,
    ...(d.image ? { image: d.image } : {}),
  };
}

/** all rows whose en matches (case-insensitive) — returns {id, partId}. */
export async function findByEn(req: APIRequestContext, token: string, en: string): Promise<Array<{ id: string; partId: string }>> {
  const out: Array<{ id: string; partId: string }> = [];
  const PAGE = 500;
  for (let start = 0; start < 10000; start += PAGE) {
    const body = await gql(req, token, LIST, { input: { search: en, start, length: PAGE } });
    const arr = asArray(body?.data?.Sparepart?.GetListSparepart?.data);
    if (!arr.length) break;
    for (const p of arr) if (norm(p.en) === norm(en)) out.push({ id: String(p.id), partId: String(p.partId) });
    if (arr.length < PAGE) break;
  }
  return out;
}

/** delete every serial under a part (a part with serial stock canNOT be deleted — SP-BC12). */
async function purgeStock(req: APIRequestContext, token: string, partId: string): Promise<void> {
  for (let pass = 0; pass < 5; pass++) {
    const body = await gql(req, token, STOCK_SERIALS, { input: { search: '', start: 0, length: 500, partId } });
    const serials = asArray(body?.data?.SparepartStock?.GetListSparepartSerial?.data);
    if (!serials.length) break;
    for (const s of serials) {
      await gql(req, token, STOCK_DELETE, { input: { partId, serialNumber: String(s.serialNumber) } });
    }
  }
}

async function deleteByPartId(req: APIRequestContext, token: string, partId: string): Promise<boolean> {
  await purgeStock(req, token, partId); // serials block delete → clear first
  const body = await gql(req, token, DELETE, { input: { id: partId } });
  return body?.data?.Sparepart?.DeleteSparepart?.status === '0';
}

/** Teardown — remove every spare part with this en (idempotent). Returns count deleted. */
export async function purgeByEn(page: Page, en: string): Promise<number> {
  const token = await getToken(page);
  let removed = 0;
  for (let pass = 0; pass < 5; pass++) {
    const rows = await findByEn(page.request, token, en);
    if (!rows.length) break;
    for (const r of rows) if (await deleteByPartId(page.request, token, r.partId)) removed++;
  }
  return removed;
}

/** Arrange — clean slate then create one spare part. Returns its partId. Optionally seeds stock (qty serials). */
export async function seedSparePart(page: Page, d: SparePartData): Promise<string> {
  const token = await getToken(page);
  const req = page.request;
  await purgeByEn(page, d.en);

  const body = await gql(req, token, CREATE, { input: await toInput(req, token, d) });
  const r = body?.data?.Sparepart?.CreateSparepart;
  if (r?.status !== '0') {
    throw new Error(`seedSparePart "${d.en}" failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
  }
  const rows = await findByEn(req, token, d.en);
  if (!rows.length) throw new Error(`seedSparePart "${d.en}": created but not found on list`);
  const partId = rows[0].partId;

  if (d.stockQty && d.stockQty > 0) {
    await seedStock(page, partId, d.stockQty, d.store);
  }
  return partId;
}

/** Arrange stock level — create one SparepartStock with `qty` serial numbers (stock count = qty). */
export async function seedStock(page: Page, partId: string, qty: number, storeName?: string): Promise<void> {
  const token = await getToken(page);
  const req = page.request;
  const sBody = await gql(req, token, LIST_STORE, { input: { search: storeName ?? '', start: 0, length: 50 } });
  const stores = asArray(sBody?.data?.Store?.GetListStore?.data);
  const store = storeName ? stores.find((s) => norm(s.en) === norm(storeName) || norm(s.name) === norm(storeName)) : stores[0];
  if (!store) throw new Error(`seedStock: หา Store "${storeName ?? '(any)'}" ไม่เจอ`);
  const storeId = String(store.storeId ?? store.id);
  const serials = Array.from({ length: qty }, (_, i) => `QA-${partId.slice(0, 8)}-${Date.now()}-${i}`);
  const body = await gql(req, token, STOCK_CREATE, { input: { storeId, partId, serialNumber: serials } });
  const r = body?.data?.SparepartStock?.CreateSparepartStock;
  if (r?.status !== '0') throw new Error(`seedStock partId=${partId} qty=${qty} failed: ${r?.msg || JSON.stringify(body).slice(0, 200)}`);
}
