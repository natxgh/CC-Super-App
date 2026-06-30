import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, getToken } from '../../customer-profile/fixtures/seed';

/**
 * API-First Arrange + Teardown for Order Management (ORD)
 * Endpoint = same BFF as Customer (cc-bff-qa/graphql), same JWT (localStorage access_token).
 *
 * GraphQL ops (✅ shape verified via introspection 2026-06-20 — runtime create needs a live token):
 *   OrderWorkflow.CreateOrder(OrderInput!{title,billTo,billAddr,shipTo,shipAddr,shipBy,items:JSON,remark})
 *   OrderWorkflow.OrderControl(OrderControlInput{id,exitPoint,statusId})   ← advance workflow step
 *   OrderWorkflow.CancelOrder(OrderCancelInput{id,remark})
 *   OrderWorkflow.GetListOrder(input) / GetOrderById(input)
 *   OrderStatus.GetListOrderStatus(input)   ← resolve OS000..OS009 → statusId
 *
 * ⚠️ TEARDOWN GAP — there is NO `DeleteOrder` mutation in the schema (only DeleteOrderStatus /
 *    DeleteOrderItem / DeleteOrderComment). Seeded orders CANNOT be hard-deleted via API.
 *    → teardown falls back to CancelOrder (soft: order ends in "Cancel" status, record remains).
 *    → Ask BE for a DeleteOrder (or a QA-only purge) mutation to keep SIT clean. See FIXME-PLAN.md.
 */

const CREATE = 'mutation ($input: OrderInput!) { OrderWorkflow { CreateOrder(input: $input) { status msg data desc } } }';
const CANCEL = 'mutation ($input: OrderCancelInput!) { OrderWorkflow { CancelOrder(input: $input) { status msg data desc } } }';
const CONTROL = 'mutation ($input: OrderControlInput!) { OrderWorkflow { OrderControl(input: $input) { status msg data desc } } }';

const ORDER_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-orders.json');

export interface OrderItemSeed { name: string; quantity: number; price: number; productId?: string; partId?: string; }

const PRODUCT_SEARCH = '{ Product { GetListProduct(input: { search: "__TERM__", start: 0, length: 10 }) { status msg data } } }';

/**
 * Resolve a productId from an item name via GetListProduct (CreateOrder requires productId/partId,
 * NOT a free-text name — verified live 2026-06-29: items with only {name} → "productId or partId required").
 */
async function resolveProductId(req: APIRequestContext, token: string, name: string): Promise<string> {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query: PRODUCT_SEARCH.replace('__TERM__', name) },
  });
  const body = await res.json();
  let prods = body?.data?.Product?.GetListProduct?.data;
  if (typeof prods === 'string') { try { prods = JSON.parse(prods); } catch { prods = []; } }
  if (!Array.isArray(prods)) prods = prods?.data || prods?.list || [];
  const hit = prods.find((p: any) => (p.en || p.name || p.productName || '') === name) || prods[0];
  return hit?.productId || hit?.id || '';
}
export interface OrderSeed {
  title: string;
  billTo: string; billAddr: string;
  shipTo: string; shipAddr: string;
  shipBy: string;
  items: OrderItemSeed[];
  remark?: string;
}

async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

export function recordOrder(id: string) {
  fs.mkdirSync(path.dirname(ORDER_STORE), { recursive: true });
  const cur: string[] = fs.existsSync(ORDER_STORE) ? JSON.parse(fs.readFileSync(ORDER_STORE, 'utf8')) : [];
  if (id && !cur.includes(id)) cur.push(id);
  fs.writeFileSync(ORDER_STORE, JSON.stringify(cur, null, 2));
}

/**
 * Arrange — create an order in initial "Create Order" state. Must login UI first (token from page).
 * Returns the order id (for OrderControl/CancelOrder). status === '0' = ok (same convention as Customer).
 */
export async function seedOrder(page: Page, d: OrderSeed): Promise<string> {
  const token = await getToken(page);
  // CreateOrder requires productId/partId per line item (not free-text name) — resolve from name if needed.
  const items = [];
  for (const it of d.items) {
    let productId = it.productId;
    if (!productId && !it.partId) {
      productId = await resolveProductId(page.request, token, it.name);
      if (!productId) throw new Error(`seedOrder: could not resolve productId for "${it.name}" (GetListProduct returned no match)`);
    }
    items.push({ ...(productId ? { productId } : {}), ...(it.partId ? { partId: it.partId } : {}), quantity: it.quantity, price: it.price });
  }
  const input = {
    title: d.title,
    billTo: d.billTo, billAddr: d.billAddr,
    shipTo: d.shipTo, shipAddr: d.shipAddr,
    shipBy: d.shipBy,
    items, // JSON scalar — each item carries productId/partId
    remark: d.remark ?? null,
  };
  const body = await gql(page.request, token, CREATE, { input });
  const r = body?.data?.OrderWorkflow?.CreateOrder;
  if (r?.status !== '0') {
    // ⚠️ KNOWN BLOCKER (verified live 2026-06-29): msg "Forbidden" = the login account is not in the
    //    inventory_order_workflow pic list. Only apiwat / watee.tha can CreateOrder; ketwadee cannot.
    //    → seed-dependent scenarios must skip with this reason (see spec preflight), never fake-pass.
    if (/forbidden/i.test(r?.msg || '')) {
      throw new Error(`SEED_FORBIDDEN: CreateOrder returned Forbidden — login account not in inventory_order_workflow pic list (need apiwat/watee.tha, or BE to add the account). See order-workflow-config memory / FIXME-PLAN.md`);
    }
    throw new Error(`seedOrder failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
  }
  // r.data carries the order id — may be plain string "ORD260629-00001" or JSON-encoded {"orderId":"…"}
  let id = '';
  if (typeof r.data === 'string') {
    try {
      const parsed = JSON.parse(r.data);
      id = String(parsed?.orderId || parsed?.id || r.data);
    } catch {
      id = r.data;
    }
  } else {
    id = String(r.data?.orderId ?? r.data?.id ?? r.data ?? '');
  }
  if (id) recordOrder(id);
  return id;
}

/** advance an order to a target statusId (resolve OS-code via GetListOrderStatus if needed) */
export async function advanceOrder(page: Page, id: string, statusId: string, exitPoint = ''): Promise<boolean> {
  const token = await getToken(page);
  const body = await gql(page.request, token, CONTROL, { input: { id, statusId, exitPoint } });
  return body?.data?.OrderWorkflow?.OrderControl?.status === '0';
}

/**
 * Teardown — best-effort: CancelOrder for every seeded order (NO hard delete available — see gap above).
 * Returns count cancelled. Safe to call from global teardown.
 */
export async function teardownSeededOrders(req: APIRequestContext, token: string): Promise<number> {
  if (!fs.existsSync(ORDER_STORE)) return 0;
  const ids: string[] = JSON.parse(fs.readFileSync(ORDER_STORE, 'utf8'));
  let cancelled = 0;
  for (const id of ids) {
    const body = await gql(req, token, CANCEL, { input: { id, remark: 'automation teardown' } }).catch(() => null);
    if (body?.data?.OrderWorkflow?.CancelOrder?.status === '0') cancelled++;
  }
  fs.writeFileSync(ORDER_STORE, '[]');
  return cancelled;
}
