import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, getToken } from '../../customer-profile/fixtures/seed';

/**
 * API-First Arrange + Teardown for Spare Parts Stock (SPS)
 * Endpoint = same BFF as Customer (cc-bff-qa/graphql), same JWT (localStorage access_token).
 *
 * GraphQL ops — ✅ VERIFIED live on QA 2026-06-25 (token probe + live mutation tests):
 *   SparepartStock.GetListSparepartSerial(ListDataInput{search,start,length})
 *     → data: [{id, serialNumber:String, store:{storeId,en}, part:{partId,en}, statusId}]
 *   SparepartStock.CreateSparepartStock(SparepartStockInput!{ storeId:String!, serialNumber:JSON!(array), partId:String! })
 *     → status "0" = ok, creates a new record (id field in input is ignored / creates new)
 *   SparepartStock.DeleteSparepartStock(GetIdInput_2!{ partId:ID!, serialNumber:ID! })
 *     → status "0" = ok
 *   SparepartStock.UpdateSparepartStock(UpdateSparepartStockInput!{ storeId, serialNumber:String, partId, active })
 *     → serialNumber = LOOKUP KEY (identifies record); storeId/partId/active = values to change.
 *       ✅ VERIFIED: serialNumber CANNOT be changed via this mutation (field is read-only in API).
 *       The UI's serial-change interaction may be cosmetic (API silently ignores it or uses Delete+Create).
 *
 * Teardown coverage (SPS_MUTATE=1 scenarios):
 *   TS-03_TC-04 — restore Store of SN0000019: Store1 → Store2 ✅ (Update, verified)
 *   TS-04_TC-02 — recreate deleted SN0000016 ✅ (Create, then Delete in teardown)
 *   TA-02_TC-02 — should-fail scenario; no teardown needed (duplicate rejected → no change)
 *   TA-06_TC-01/TC-03 — serial change does NOT persist via API → no teardown needed
 */

const LIST_SERIAL = 'query ($input: ListDataInput) { SparepartStock { GetListSparepartSerial(input: $input) { status msg data } } }';
const CREATE      = 'mutation ($input: SparepartStockInput!) { SparepartStock { CreateSparepartStock(input: $input) { status msg data desc } } }';
const DELETE      = 'mutation ($input: GetIdInput_2!) { SparepartStock { DeleteSparepartStock(input: $input) { status msg data desc } } }';
const UPDATE      = 'mutation ($input: UpdateSparepartStockInput!) { SparepartStock { UpdateSparepartStock(input: $input) { status msg data desc } } }';

const SEED_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-spare-parts-stock.json');

export interface SpsStockSeed {
  serialNumber: string;
  partId: string;   // UUID — from GetListSparepartSerial probe or testdata constants
  storeId: string;  // UUID
}

interface SeedRecord {
  serialNumber: string;
  partId: string;
  storeId: string;
  action: 'created' | 'store-changed' | 'serial-changed';
  originalValue?: string; // original store/serial before mutation
}

async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

function unwrapList(node: any): any[] {
  let data = node?.data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = []; } }
  return Array.isArray(data) ? data : (data?.data || data?.list || []);
}

/** find a serial unit by serialNumber → returns { id, serialNumber, storeId, partId, statusId } or null */
export async function lookupBySerial(
  req: APIRequestContext, token: string, serialNumber: string,
): Promise<{ id: string; serialNumber: string; storeId: string; partId: string; statusId: string } | null> {
  const body = await gql(req, token, LIST_SERIAL, { input: { search: serialNumber, start: 0, length: 20 } });
  const rows = unwrapList(body?.data?.SparepartStock?.GetListSparepartSerial);
  const hit = rows.find((r) => String(r?.serialNumber ?? '') === serialNumber);
  if (!hit) return null;
  return {
    id: String(hit.id ?? ''),
    serialNumber: String(hit.serialNumber ?? ''),
    storeId: String(hit.store?.storeId ?? ''),
    partId: String(hit.part?.partId ?? ''),
    statusId: String(hit.statusId ?? ''),
  };
}

function record(entry: SeedRecord) {
  fs.mkdirSync(path.dirname(SEED_STORE), { recursive: true });
  const cur: SeedRecord[] = fs.existsSync(SEED_STORE) ? JSON.parse(fs.readFileSync(SEED_STORE, 'utf8')) : [];
  cur.push(entry);
  fs.writeFileSync(SEED_STORE, JSON.stringify(cur, null, 2));
}

function clearStore() {
  fs.writeFileSync(SEED_STORE, '[]');
}

/**
 * Arrange — create a new spare parts stock unit (one serial).
 * Login UI first to get a fresh JWT.
 */
export async function seedSparepartStock(page: Page, d: SpsStockSeed): Promise<string> {
  const token = await getToken(page);
  const req = page.request;
  const input = { storeId: d.storeId, partId: d.partId, serialNumber: [d.serialNumber] };
  const body = await gql(req, token, CREATE, { input });
  const r = body?.data?.SparepartStock?.CreateSparepartStock;
  if (r?.status !== '0') {
    throw new Error(`seedSparepartStock failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
  }
  record({ serialNumber: d.serialNumber, partId: d.partId, storeId: d.storeId, action: 'created' });
  return d.serialNumber;
}

/**
 * Teardown — delete a seeded unit by (partId + serialNumber).
 */
export async function deleteSparepartStock(
  req: APIRequestContext, token: string, partId: string, serialNumber: string,
): Promise<boolean> {
  const body = await gql(req, token, DELETE, { input: { partId, serialNumber } }).catch(() => null);
  return body?.data?.SparepartStock?.DeleteSparepartStock?.status === '0';
}

/**
 * Restore Store of a unit (TS-03_TC-04 teardown).
 * ⚠️ UNVERIFIED: UpdateSparepartStock serialNumber role not confirmed live.
 *    Assumption: serialNumber = current/lookup key; storeId = new value to restore.
 */
export async function restoreStore(
  req: APIRequestContext, token: string,
  serialNumber: string, partId: string, originalStoreId: string,
): Promise<boolean> {
  const body = await gql(req, token, UPDATE, {
    input: { serialNumber, partId, storeId: originalStoreId, active: true },
  }).catch(() => null);
  return body?.data?.SparepartStock?.UpdateSparepartStock?.status === '0';
}

/**
 * NOTE: serialNumber CANNOT be changed via UpdateSparepartStock (API ignores it — lookup key only).
 * TA-06 serial-change tests do NOT need teardown — the API-level serial stays unchanged.
 * This function is a no-op placeholder for documentation purposes.
 */
export async function restoreSerial(
  _req: APIRequestContext, _token: string,
  _currentSerial: string, _originalSerial: string, _partId: string, _storeId: string,
): Promise<boolean> {
  return true; // serial unchanged at API level — nothing to restore
}

/**
 * Global teardown — replay seed records and undo all mutations.
 * Call after test run (afterAll hook or global-teardown.ts).
 */
export async function teardownSparepartStock(req: APIRequestContext, token: string): Promise<number> {
  if (!fs.existsSync(SEED_STORE)) return 0;
  const records: SeedRecord[] = JSON.parse(fs.readFileSync(SEED_STORE, 'utf8'));
  let restored = 0;

  for (const rec of records) {
    if (rec.action === 'created') {
      if (await deleteSparepartStock(req, token, rec.partId, rec.serialNumber)) restored++;
    } else if (rec.action === 'store-changed' && rec.originalValue) {
      if (await restoreStore(req, token, rec.serialNumber, rec.partId, rec.originalValue)) restored++;
    } else if (rec.action === 'serial-changed' && rec.originalValue) {
      if (await restoreSerial(req, token, rec.serialNumber, rec.originalValue, rec.partId, rec.storeId)) restored++;
    }
  }

  clearStore();
  return restored;
}

// ── Known UUIDs (verified live on QA 2026-06-25 via introspection + live mutation tests) ──
export const QA_IDS = {
  UNIT_MAIN: {
    serialNumber: 'SN0000019',
    partId:  '4d87f7c6-73fa-4db8-b106-597a75bb58f0', // iPhone 17 Pro Screen
    storeId: 'ff281bce-880b-4a93-bed8-20d95a83c682', // Store2
    statusId: 'R001',
  },
  UNIT_DELETE: {
    serialNumber: 'SN0000016',
    partId:  '4d87f7c6-73fa-4db8-b106-597a75bb58f0', // iPhone 17 Pro Screen
    storeId: 'ff281bce-880b-4a93-bed8-20d95a83c682', // Store2
  },
  STORE1_ID: 'ff281bce-880b-4a93-bed8-20d95a83c681',
  STORE2_ID: 'ff281bce-880b-4a93-bed8-20d95a83c682',
  IPHONE17_PART_ID: '4d87f7c6-73fa-4db8-b106-597a75bb58f0',
} as const;
