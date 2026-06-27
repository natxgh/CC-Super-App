import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { GQL, getToken, findIdsByEmail } from '../../customer-profile/fixtures/seed';

/**
 * API-First Arrange + Teardown สำหรับ Appointment (CAP)
 * ✅ VERIFIED (probe 2026-06-19/23) — endpoint เดียวกับ Customer (cc-bff-qa/graphql), JWT เดิม
 *
 * GraphQL ops:
 *   CreateAppointment(AppointmentInsertInput!) → data = UUID string (appointment UUID, ไม่ใช่ numeric id)
 *   DeleteAppointment(GetIdInput!{id}) → id = numeric string จาก GetAppointmentByCustId[].id
 *   GetAppointmentByCustId(ListDataInput2{id,start,length}) → data = [{id:"802",appointmentId:"A...",appointmentType:{en},serviceType:{en},...}]
 *   AppointmentType.GetListAppointmentType → data=[{appointmentTypeId:UUID,en,th,active,...}] ✅ probe 2026-06-23
 *   ServiceType.GetListServiceType → data=[{serviceId:UUID,en,th,active,price,...}] ✅ probe 2026-06-23
 *
 * CreateAppointment input ✅:
 *   customerId: numeric string · appointmentTypeId/serviceId: UUID จาก master-data
 *   appointmentDate: ISO 8601 (e.g. "2026-11-12T14:30:00Z") · units: [] · caseId: null
 */

const CREATE = 'mutation ($input: AppointmentInsertInput!) { Appointment { CreateAppointment(input: $input) { status msg data desc } } }';
const DELETE = 'mutation ($input: GetIdInput!) { Appointment { DeleteAppointment(input: $input) { status msg data desc } } }';
const LIST = 'query ($input: ListDataInput2) { Appointment { GetAppointmentByCustId(input: $input) { status msg data desc } } }';
const GET_APPT_TYPES = 'query { AppointmentType { GetListAppointmentType { status msg data desc } } }';
const GET_SVC_TYPES = 'query { ServiceType { GetListServiceType { status msg data desc } } }';

const APPT_STORE = path.join(__dirname, '..', '..', '..', 'test-results', 'seeded-appointments.json');

export interface ApptSeed {
  appointmentType: string; // English name → resolve → appointmentTypeId UUID ผ่าน GraphQL GetListAppointmentType
  serviceType: string;     // English name → resolve → serviceId UUID ผ่าน GraphQL GetListServiceType
  appointDate: string;     // ISO 8601 ✅ verified: "2026-11-12T14:30:00Z"
  note?: string;
}

async function gql(req: APIRequestContext, token: string, query: string, variables: any) {
  const res = await req.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

/** ดึง items จาก GraphQL query ที่ไม่รับ variables — shape ✅: {status,msg,data:[...]} */
async function gqlList(req: APIRequestContext, token: string, query: string, path: string[]): Promise<any[]> {
  const body = await gql(req, token, query, undefined);
  let data: any = body?.data;
  for (const k of path) data = data?.[k];
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = []; } }
  return Array.isArray(data) ? data : [];
}

/** หา UUID ของ master-data ตามชื่อ (case-insensitive English name = field "en") */
function matchUUID(rows: any[], name: string, uuidField: 'appointmentTypeId' | 'serviceId'): string {
  const norm = (s: any) => String(s ?? '').trim().toLowerCase();
  const target = norm(name);
  const hit = rows.find((r) => norm(r.en) === target) || rows.find((r) => norm(r.en).includes(target));
  if (!hit) throw new Error(`master-data: ไม่พบ "${name}" (${rows.length} rows, fields: ${JSON.stringify(rows[0] || {})})`);
  const id = String(hit[uuidField] ?? '');
  if (!id) throw new Error(`master-data: เจอ "${name}" แต่ field ${uuidField} ว่าง`);
  return id;
}

let _typeCache: any[] | null = null;
let _serviceCache: any[] | null = null;

/** resolve appointmentType name → appointmentTypeId UUID ✅ via GraphQL GetListAppointmentType (probe 2026-06-23) */
export async function resolveAppointmentTypeId(req: APIRequestContext, token: string, name: string): Promise<string> {
  _typeCache ??= await gqlList(req, token, GET_APPT_TYPES, ['AppointmentType', 'GetListAppointmentType', 'data']);
  return matchUUID(_typeCache, name, 'appointmentTypeId');
}
/** resolve serviceType name → serviceId UUID ✅ via GraphQL GetListServiceType (probe 2026-06-23) */
export async function resolveServiceId(req: APIRequestContext, token: string, name: string): Promise<string> {
  _serviceCache ??= await gqlList(req, token, GET_SVC_TYPES, ['ServiceType', 'GetListServiceType', 'data']);
  return matchUUID(_serviceCache, name, 'serviceId');
}

function recordAppt(customerId: string, appointmentId: string) {
  fs.mkdirSync(path.dirname(APPT_STORE), { recursive: true });
  const cur: Array<{ customerId: string; appointmentId: string }> =
    fs.existsSync(APPT_STORE) ? JSON.parse(fs.readFileSync(APPT_STORE, 'utf8')) : [];
  if (!cur.some((x) => x.appointmentId === appointmentId)) cur.push({ customerId, appointmentId });
  fs.writeFileSync(APPT_STORE, JSON.stringify(cur, null, 2));
}

/** หา customerId จาก email (reuse Customer GetList) */
async function customerIdByEmail(req: APIRequestContext, token: string, email: string): Promise<string> {
  const ids = await findIdsByEmail(req, token, email);
  if (!ids.length) throw new Error(`appointment seed: ไม่พบ customer "${email}" (seed customer ก่อน)`);
  return ids[0];
}

/** list numeric appointment id ทั้งหมดของลูกค้า (ใช้ลบ) — ✅ shape: data=[{id:"802",...}] */
export async function listAppointmentIds(req: APIRequestContext, token: string, customerId: string): Promise<string[]> {
  const body = await gql(req, token, LIST, { input: { id: customerId, start: 0, length: 500 } });
  let data = body?.data?.Appointment?.GetAppointmentByCustId?.data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = []; } }
  const arr: any[] = Array.isArray(data) ? data : (data?.data || data?.list || []);
  return arr.map((a) => String(a.id ?? a.appointmentId ?? a._id)).filter(Boolean);
}

/**
 * Arrange — สร้าง appointment ให้ลูกค้า (ต้อง seed customer + login UI ก่อน เพื่อมี token)
 * คืน appointmentId. status === '0' = ok (เหมือน Customer ops)
 */
export async function seedAppointment(page: Page, email: string, d: ApptSeed): Promise<string> {
  const token = await getToken(page);
  const req = page.request;
  const customerId = await customerIdByEmail(req, token, email);
  const appointmentTypeId = await resolveAppointmentTypeId(req, token, d.appointmentType);
  const serviceId = await resolveServiceId(req, token, d.serviceType);

  const input = {
    customerId,
    appointmentTypeId,
    serviceId,
    appointmentDate: d.appointDate, // ✅ ISO format verified
    note: d.note ?? null,
    caseId: null,
    units: [] as Array<{ unitId: string; unitName: string }>, // ✅ empty array ok
  };
  const body = await gql(req, token, CREATE, { input });
  const r = body?.data?.Appointment?.CreateAppointment;
  if (r?.status !== '0') {
    throw new Error(`seedAppointment failed: status=${r?.status} msg=${r?.msg || r?.desc || JSON.stringify(body).slice(0, 200)}`);
  }
  // ✅ r.data = UUID string (appointment UUID) — ใช้ re-list เพื่อได้ numeric id สำหรับ DeleteAppointment
  // GetAppointmentByCustId data item = {id: "802"(numeric)} → DeleteAppointment input = {id: "802"}
  const all = await listAppointmentIds(req, token, customerId);
  const numericId = all[all.length - 1] || '';
  if (numericId) recordAppt(customerId, numericId);
  return numericId;
}

/**
 * Teardown — ลบ appointment ที่ automation seed ไว้ (อ่านจาก seeded-appointments.json)
 * เรียกจาก global-teardown ก่อนลบ customer (ใช้ APIRequestContext + token cache เหมือน customer teardown)
 * คืนจำนวนที่ลบสำเร็จ. ⚠️ ถ้า DeleteCustomer cascade ลบ appointment อยู่แล้ว — อันนี้แค่ทำให้ explicit + กันค้าง
 */
export async function teardownSeededAppointments(req: APIRequestContext, token: string): Promise<number> {
  if (!fs.existsSync(APPT_STORE)) return 0;
  const rows: Array<{ customerId: string; appointmentId: string }> = JSON.parse(fs.readFileSync(APPT_STORE, 'utf8'));
  let deleted = 0;
  for (const { appointmentId } of rows) {
    const body = await gql(req, token, DELETE, { input: { id: appointmentId } }).catch(() => null);
    if (body?.data?.Appointment?.DeleteAppointment?.status === '0') deleted++;
  }
  fs.writeFileSync(APPT_STORE, '[]');
  return deleted;
}

/** ลบ appointment ทุกตัวของลูกค้า (idempotent clean-slate ก่อน seed + teardown) */
export async function purgeAppointmentsByEmail(page: Page, email: string): Promise<void> {
  const token = await getToken(page);
  const req = page.request;
  const customerId = await customerIdByEmail(req, token, email).catch(() => '');
  if (!customerId) return;
  for (const id of await listAppointmentIds(req, token, customerId)) {
    await gql(req, token, DELETE, { input: { id } }).catch(() => null);
  }
}
