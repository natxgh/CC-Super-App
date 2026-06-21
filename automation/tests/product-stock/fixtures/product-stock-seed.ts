import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, getToken } from '../../customer-profile/fixtures/seed';

/**
 * API-First Arrange + Teardown for Product Stock Management (PS)
 * Endpoint = same BFF as Customer (cc-bff-qa/graphql), same JWT (localStorage access_token).
 *
 * GraphQL ops — ✅ SCHEMA verified via introspection 2026-06-20 (mutation/query namespaces, input shapes):
 *   ProductStock.CreateProductStock(ProductStockInput!{ storeId:String!, Item:JSON!, productId:String!,
 *                                                        registerDate:String!, mfw:String, active:Boolean! })
 *   ProductStock.DeleteProductStock(GetIdInput_!{ productId:ID!, serialNumber:ID! })   ← ✅ HARD DELETE exists
 *   ProductStock.GetListProductSerial(ListDataInput{search,start,length,productId,storeId})
 *   Product.GetListProduct(ListDataInput{search})  → resolve product name → productId
 *   Store.GetListStore(ListDataInput{search})      → resolve store name   → storeId
 *
 * ✅ TEARDOWN: unlike Order (no DeleteOrder), Product Stock HAS DeleteProductStock(productId, serialNumber)
 *    → seeded units are hard-deleted in global teardown. No SIT residue.
 *
 * ⚠️ RUNTIME-UNVERIFIED (introspection only — needs a live token to confirm):
 *    1. `Item: JSON!` exact shape. Inferred = array of serial entries `[{ serialNumber }]` (a stock batch
 *       can carry multiple serials). If create fails with a shape error, adjust buildItem() below.
 *    2. success status convention — assumed status === '0' === ok (same as Customer/Order ops).
 *    3. GetListProductSerial record shape (assumed each item has { productId, serialNumber }).
 *    → Re-run with CP_PASSWORD set to verify against live STG, then drop these caveats.
 */

const CREATE = 'mutation ($input: ProductStockInput!) { ProductStock { CreateProductStock(input: $input) { status msg data desc } } }';
const DELETE = 'mutation ($input: GetIdInput_!) { ProductStock { DeleteProductStock(input: $input) { status msg data desc } } }';
const LIST = 'query ($input: ListDataInput) { ProductStock { GetListProductSerial(input: $input) { status msg data desc } } }';
const LIST_PRODUCT = 'query ($input: ListDataInput) { Product { GetListProduct(input: $input) { status msg data desc } } }';
const LIST_STORE = 'query ($input: ListDataInput) { Store { GetListStore(input: $input) { status msg data desc } } }';

const STOCK_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-product-stock.json');

export interface ProductStockSeed {
  serialNumber: string;
  product: string;      // product name → resolve → productId
  store: string;        // store name   → resolve → storeId
  registerDate: string; // "YYYY-MM-DD"
  mfw?: string;         // manufacturing warranty date (optional)
}

async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

/** unwrap {status,msg,data} where data may be a JSON string or array */
function unwrapList(node: any): any[] {
  let data = node?.data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = []; } }
  return Array.isArray(data) ? data : (data?.data || data?.list || []);
}

/** resolve a master record by name (case-insensitive) → id field */
async function resolveId(
  req: APIRequestContext, token: string, query: string, namespace: string, op: string,
  name: string, idFields: string[], nameFields: string[],
): Promise<string> {
  const body = await gql(req, token, query, { input: { search: name, start: 0, length: 100 } });
  const rows = unwrapList(body?.data?.[namespace]?.[op]);
  const norm = (s: any) => String(s ?? '').trim().toLowerCase();
  const target = norm(name);
  const pick = (r: any) => idFields.map((f) => r?.[f]).find((v) => v != null && v !== '');
  const hit =
    rows.find((r) => nameFields.some((nf) => norm(r?.[nf]) === target)) ||
    rows.find((r) => nameFields.some((nf) => norm(r?.[nf]).includes(target)));
  const id = hit && pick(hit);
  if (!id) throw new Error(`resolveId: "${name}" not found in ${namespace}.${op} (${rows.length} rows; sample=${JSON.stringify(rows[0] || {}).slice(0, 200)})`);
  return String(id);
}

export async function resolveProductId(req: APIRequestContext, token: string, name: string): Promise<string> {
  // product master rows expose en/name + id — try common id field names
  return resolveId(req, token, LIST_PRODUCT, 'Product', 'GetListProduct', name,
    ['productId', 'id', '_id'], ['en', 'name', 'productName', 'nameEn']);
}
export async function resolveStoreId(req: APIRequestContext, token: string, name: string): Promise<string> {
  return resolveId(req, token, LIST_STORE, 'Store', 'GetListStore', name,
    ['storeId', 'id', '_id'], ['en', 'name', 'storeName', 'nameEn']);
}

/** ⚠️ inferred Item JSON shape — a stock batch carrying one serial. Adjust if live create rejects. */
function buildItem(serialNumber: string) {
  return [{ serialNumber }];
}

function recordUnit(productId: string, serialNumber: string) {
  fs.mkdirSync(path.dirname(STOCK_STORE), { recursive: true });
  const cur: Array<{ productId: string; serialNumber: string }> =
    fs.existsSync(STOCK_STORE) ? JSON.parse(fs.readFileSync(STOCK_STORE, 'utf8')) : [];
  if (!cur.some((x) => x.productId === productId && x.serialNumber === serialNumber)) {
    cur.push({ productId, serialNumber });
  }
  fs.writeFileSync(STOCK_STORE, JSON.stringify(cur, null, 2));
}

/**
 * Arrange — create a product-stock unit (one serial). Must login UI first (token from page).
 * Returns the serialNumber. status === '0' = ok (assumed convention).
 */
export async function seedProductStock(page: Page, d: ProductStockSeed): Promise<string> {
  const token = await getToken(page);
  const req = page.request;
  const productId = await resolveProductId(req, token, d.product);
  const storeId = await resolveStoreId(req, token, d.store);

  const input = {
    storeId,
    productId,
    Item: buildItem(d.serialNumber), // ⚠️ shape inferred — see header caveat
    registerDate: d.registerDate,
    mfw: d.mfw ?? null,
    active: true,
  };
  const body = await gql(req, token, CREATE, { input });
  const r = body?.data?.ProductStock?.CreateProductStock;
  if (r?.status !== '0') {
    throw new Error(`seedProductStock failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
  }
  recordUnit(productId, d.serialNumber);
  return d.serialNumber;
}

/** seed N units of the same product (distinct serials) — used to set qty for stock-badge BVA */
export async function seedProductStockBatch(page: Page, base: ProductStockSeed, qty: number): Promise<string[]> {
  const serials: string[] = [];
  for (let i = 1; i <= qty; i++) {
    const sn = `${base.serialNumber}-${String(i).padStart(3, '0')}`;
    await seedProductStock(page, { ...base, serialNumber: sn });
    serials.push(sn);
  }
  return serials;
}

/** check whether a serial already exists (for uniqueness Arrange) */
export async function productStockSerialExists(page: Page, productId: string, serialNumber: string): Promise<boolean> {
  const token = await getToken(page);
  const body = await gql(page.request, token, LIST, { input: { search: serialNumber, productId, start: 0, length: 50 } });
  const rows = unwrapList(body?.data?.ProductStock?.GetListProductSerial);
  return rows.some((x) => String(x?.serialNumber ?? x?.serial ?? '') === serialNumber);
}

/** delete one unit by (productId, serialNumber) */
export async function deleteProductStock(req: APIRequestContext, token: string, productId: string, serialNumber: string): Promise<boolean> {
  const body = await gql(req, token, DELETE, { input: { productId, serialNumber } }).catch(() => null);
  return body?.data?.ProductStock?.DeleteProductStock?.status === '0';
}

/** idempotent clean-slate: remove a serial before a UI-add test (so create is not a duplicate) */
export async function purgeProductStock(page: Page, product: string, serialNumber: string): Promise<void> {
  const token = await getToken(page);
  const req = page.request;
  const productId = await resolveProductId(req, token, product).catch(() => '');
  if (!productId) return;
  await deleteProductStock(req, token, productId, serialNumber);
}

/**
 * Teardown — hard-delete every seeded unit (read from seeded-product-stock.json).
 * Called from global-teardown. Returns count deleted.
 */
export async function teardownSeededProductStock(req: APIRequestContext, token: string): Promise<number> {
  if (!fs.existsSync(STOCK_STORE)) return 0;
  const rows: Array<{ productId: string; serialNumber: string }> = JSON.parse(fs.readFileSync(STOCK_STORE, 'utf8'));
  let deleted = 0;
  for (const { productId, serialNumber } of rows) {
    if (await deleteProductStock(req, token, productId, serialNumber)) deleted++;
  }
  fs.writeFileSync(STOCK_STORE, '[]');
  return deleted;
}
