import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import type { ProductData } from './testdata';

/**
 * API-First Arrange + Teardown (GraphQL) — Product & Inventory
 * ✅ VERIFIED ops via introspection 2026-06-20 (https://cc-bff-qa.one-sky.ai/graphql):
 *   Product.CreateProduct(ProductInput) / UpdateProduct / DeleteProduct(GetIdInput{id})
 *   Product.GetListProduct(ListDataInput{search,start,length})
 *   Brand.GetListBrand / Category.GetListCategory  → resolve brandId/categoryId by name
 *   status "0" = ok (เหมือน Customer)
 *
 *   ProductInput required: active, brandId, categoryId, productCode
 *   optional: th, en, image, price (Float), warranty (Int), mfd (Int = Model Year)
 *
 * auth = JWT localStorage "access_token" (ดึงจาก browser หลัง login) — ตรง pattern กับ customer seed.ts
 * seedProduct = idempotent: ลบ productCode ซ้ำก่อน แล้ว create ใหม่ → ข้อมูลตรงเสมอ
 */
export const GQL = process.env.CP_GQL || 'https://cc-bff-qa.one-sky.ai/graphql';
const CODE_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-products.json');
const TOKEN_CACHE = path.join(__dirname, '..', '..', '..', 'test-results', '.token');

const CREATE = 'mutation ($input: ProductInput!) { Product { CreateProduct (input: $input) { status msg data desc } } }';
const DELETE = 'mutation ($input: GetIdInput!) { Product { DeleteProduct (input: $input) { status msg data desc } } }';
const LIST = 'query ($input: ListDataInput!) { Product { GetListProduct (input: $input) { status msg data } } }';
const LIST_BRAND = 'query ($input: ListDataInput!) { Brand { GetListBrand (input: $input) { status msg data } } }';
const LIST_CATEGORY = 'query ($input: ListDataInput!) { Category { GetListCategory (input: $input) { status msg data } } }';

// ── low-level GraphQL (ใช้ได้ทั้ง page.request และ APIRequestContext) ──────────
async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

/** parse data field ที่อาจเป็น string JSON หรือ object/array (เหมือน customer GetList) */
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
  if (!t) throw new Error('product-seed: ไม่พบ access_token (login ไม่สำเร็จ?)');
  fs.mkdirSync(path.dirname(TOKEN_CACHE), { recursive: true });
  fs.writeFileSync(TOKEN_CACHE, t);
  return t;
}
export function cachedToken(): string | null {
  return fs.existsSync(TOKEN_CACHE) ? fs.readFileSync(TOKEN_CACHE, 'utf8').trim() : null;
}

function recordCode(code: string) {
  fs.mkdirSync(path.dirname(CODE_STORE), { recursive: true });
  const cur: string[] = fs.existsSync(CODE_STORE) ? JSON.parse(fs.readFileSync(CODE_STORE, 'utf8')) : [];
  if (!cur.includes(code)) cur.push(code);
  fs.writeFileSync(CODE_STORE, JSON.stringify(cur, null, 2));
}

/** resolve brand/category id ตามชื่อ (case-insensitive) — match field name ได้หลายแบบ (name/th/en/brandName)
 *  Brand object uses 'brandId' as PK; Category uses 'categoryId' — not generic 'id'
 */
async function resolveId(req: APIRequestContext, token: string, query: string, ns: 'Brand' | 'Category', name: string): Promise<string> {
  const body = await gql(req, token, query, { input: { search: name, start: 0, length: 200 } });
  const arr = asArray(body?.data?.[ns]?.[`GetList${ns}`]?.data);
  const norm = (s: any) => String(s ?? '').trim().toLowerCase();
  const hit = arr.find((x) => [x.name, x.th, x.en, x.brandName, x.categoryName].some((v) => norm(v) === norm(name)));
  if (!hit) throw new Error(`product-seed: หา ${ns} "${name}" ไม่เจอ (มี ${arr.length} รายการ) — ตรวจชื่อใน testdata ให้ตรง master data จริง`);
  // Brand → brandId, Category → categoryId, fallback to id/_id
  const nsId = ns === 'Brand' ? hit.brandId : hit.categoryId;
  const resolved = nsId ?? hit.id ?? hit._id;
  if (!resolved) throw new Error(`product-seed: หา ${ns} "${name}" เจอแล้ว แต่ไม่มี id field — keys: ${Object.keys(hit).join(', ')}`);
  return String(resolved);
}

async function toInput(req: APIRequestContext, token: string, d: ProductData) {
  const brandId = await resolveId(req, token, LIST_BRAND, 'Brand', d.brand);
  const categoryId = await resolveId(req, token, LIST_CATEGORY, 'Category', d.category);
  const input: Record<string, any> = {
    id: 'add',
    active: d.active ?? true,
    brandId,
    categoryId,
    productCode: d.code,
    th: d.th ?? d.en ?? d.code,
    en: d.en ?? d.code,
  };
  if (d.price != null) input.price = d.price;
  if (d.warranty != null) input.warranty = d.warranty;
  if (d.year != null) input.mfd = d.year;
  if (d.image) input.image = d.image;
  return input;
}

/** หา id ของ product ตาม productCode (exact) — paginate กัน catalog ใหญ่
 *  GetListProduct searches by product NAME, NOT by code. Pass searchName (en/th) so
 *  the API returns results; then filter client-side by exact productCode match.
 */
export async function findIdsByCode(req: APIRequestContext, token: string, code: string, searchName?: string): Promise<string[]> {
  const ids: string[] = [];
  const PAGE = 500;
  const term = searchName ?? code; // name-based search works; code-based may return nothing
  for (let start = 0; start < 10000; start += PAGE) {
    const body = await gql(req, token, LIST, { input: { search: term, start, length: PAGE } });
    const arr = asArray(body?.data?.Product?.GetListProduct?.data);
    if (!arr.length) break;
    // productId = UUID (what DeleteProduct accepts); id = numeric sequential (not accepted)
    for (const p of arr) if (String(p.productCode || '').toLowerCase() === code.toLowerCase()) ids.push(String(p.productId ?? p.id ?? p._id));
    if (arr.length < PAGE) break;
  }
  return ids;
}

export async function deleteById(req: APIRequestContext, token: string, id: string): Promise<boolean> {
  const body = await gql(req, token, DELETE, { input: { id } });
  return body?.data?.Product?.DeleteProduct?.status === '0';
}

/** Arrange — สร้าง Product (idempotent). ต้อง login UI ก่อน (อ่าน token จาก page) */
export async function seedProduct(page: Page, d: ProductData): Promise<void> {
  const token = await getToken(page);
  const req = page.request;
  const searchName = d.en ?? d.th; // search by name; API does not index by productCode
  // 1) clear ของเก่า productCode เดียวกันให้เกลี้ยง (กัน duplicate)
  for (let pass = 0; pass < 5; pass++) {
    const ids = await findIdsByCode(req, token, d.code, searchName);
    if (!ids.length) break;
    for (const id of ids) await deleteById(req, token, id);
  }
  // 2) create ใหม่
  const body = await gql(req, token, CREATE, { input: await toInput(req, token, d) });
  const r = body?.data?.Product?.CreateProduct;
  if (r?.status === '0') { recordCode(d.code); return; }
  const msg = `${r?.msg || ''} ${r?.desc || ''}`;
  if (/already\s+exist|already exists|duplicate|ซ้ำ/i.test(msg)) return; // มีอยู่แล้ว = Arrange สำเร็จ
  const existing = await findIdsByCode(req, token, d.code);
  if (existing.length) return;
  throw new Error(`seedProduct "${d.code}" failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
}

/** ลบ product ทุกตัวที่ใช้ code นี้ (clean slate ก่อน UI add) + record ไว้ให้ teardown */
export async function purgeByCode(page: Page, d: ProductData): Promise<void> {
  const token = await getToken(page);
  const searchName = d.en ?? d.th; // search by name; API does not index by productCode
  for (let p = 0; p < 5; p++) {
    const ids = await findIdsByCode(page.request, token, d.code, searchName);
    if (!ids.length) break;
    for (const id of ids) await deleteById(page.request, token, id);
  }
  recordCode(d.code); // ให้ teardown ลบ product ที่ test สร้างผ่าน UI ด้วย
}
