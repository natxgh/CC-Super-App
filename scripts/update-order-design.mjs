// update-order-design.mjs — PUT updated design fields (Arrange / Data Test / Expected Result)
// for existing "Order Management" rows in Lark Base (upload-tc.mjs skips existing → use this to update).
// Reads 08-Order/order-management-testcases.xlsx · key = Feature + TC No.
// DRY-RUN default · --confirm to write
import fs from 'fs';
import path from 'path';
import ExcelJS from '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation/node_modules/exceljs/excel.js';
import { getAccessToken } from './lark-auth.mjs';

const ROOT = process.cwd();
const CONFIRM = process.argv.includes('--confirm');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'lark.config.json'), 'utf8'));
const base = (cfg.apiBase || 'https://open.larksuite.com').replace(/\/$/, '');
const APP = cfg.appToken, TABLE = cfg.tableId;
const FEATURE = 'Order Management';
const XLSX = path.join(ROOT, '08-Order', 'order-management-testcases.xlsx');

const ARRANGE = 'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)';
// NOTE: the Lark results table has no "Data Test" column — only update writable Text design fields.
const FIELDS_TO_UPDATE = [ARRANGE, 'Expected Result'];

// ── read xlsx (header row 2) ──
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(XLSX);
const ws = wb.worksheets[0];
const headers = [];
ws.getRow(2).eachCell({ includeEmpty: false }, (c, col) => { headers[col] = String(c.value || '').replace(/\n/g, ' ').trim(); });
const idxOf = (name) => headers.findIndex((h) => h && h === name);
const cTC = idxOf('TC No.');
const want = {};
for (const f of FIELDS_TO_UPDATE) want[f] = idxOf(f);

const xlsxByTC = {};
ws.eachRow({ includeEmpty: false }, (row, n) => {
  if (n <= 2) return;
  const tc = String(row.getCell(cTC).value || '').trim();
  if (!tc) return;
  const rec = {};
  for (const f of FIELDS_TO_UPDATE) {
    const v = want[f] > 0 ? row.getCell(want[f]).value : null;
    rec[f] = v == null ? '' : String(v).trim();
  }
  xlsxByTC[tc] = rec;
});

// ── fetch existing Order Management records ──
const token = await getAccessToken(cfg);
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const recApi = `${base}/open-apis/bitable/v1/apps/${APP}/tables/${TABLE}/records`;
const val = (v) => (Array.isArray(v) ? v.map((x) => x.text || x.name || x).join('') : (v && v.text) || v);

const existing = {};
let pageToken = '';
do {
  const res = await fetch(`${recApi}?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`, { headers: H }).then((r) => r.json());
  for (const it of res.data?.items || []) {
    const feat = val(it.fields?.Feature), tc = val(it.fields?.[cfg.upsertKey]);
    if (feat === FEATURE && tc) existing[tc] = { id: it.record_id, fields: it.fields };
  }
  pageToken = res.data?.has_more ? res.data.page_token : '';
} while (pageToken);

const tcs = Object.keys(xlsxByTC);
const plan = [];
for (const tc of tcs) {
  const e = existing[tc];
  if (!e) { plan.push({ tc, status: 'MISSING' }); continue; }
  const fields = {};
  for (const f of FIELDS_TO_UPDATE) {
    const newV = xlsxByTC[tc][f];
    const curV = val(e.fields?.[f]) || '';
    if (newV && newV !== curV) fields[f] = newV;
  }
  plan.push({ tc, id: e.id, fields, status: Object.keys(fields).length ? 'UPDATE' : 'nochange' });
}

if (!CONFIRM) {
  console.log('=== DRY RUN — Order Management design (Arrange/Data/Expected) → Lark Base ===');
  for (const p of plan) {
    const changed = p.fields ? Object.keys(p.fields) : [];
    console.log(`  ${p.status.padEnd(8)} ${p.tc.padEnd(13)}${changed.length ? ' fields: ' + changed.join(', ') : ''}`);
  }
  const upd = plan.filter((p) => p.status === 'UPDATE').length;
  console.log(`\nจะ update ${upd} / ${plan.length} · รัน --confirm เพื่อเขียนจริง`);
  process.exit(0);
}

let updated = 0, fail = 0;
for (const p of plan) {
  if (p.status !== 'UPDATE') continue;
  const res = await fetch(`${recApi}/${p.id}`, { method: 'PUT', headers: H, body: JSON.stringify({ fields: p.fields }) }).then((x) => x.json());
  if (res.code === 0) { updated++; console.log(`${p.tc} → ✅ ${Object.keys(p.fields).join(', ')}`); }
  else { fail++; console.log(`${p.tc} → ❌ ${res.code} ${res.msg}`); }
}
console.log(`\nเสร็จ: updated ${updated} · error ${fail}`);
