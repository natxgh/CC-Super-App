// upload-order-results — upsert Test Result + Remark (+ evidence into Result Note) into Lark Base
// composite key = Feature + TC No.  ·  Feature = "Order Management"
// DRY-RUN default · --confirm to write
// usage: node scripts/upload-order-results.mjs [--confirm]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAccessToken } from '../../scripts/lark-auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJ = path.resolve(__dirname, '..', '..');
const AUTO = path.resolve(__dirname, '..');
const CONFIRM = process.argv.includes('--confirm');
const cfg = JSON.parse(fs.readFileSync(path.join(PROJ, 'lark.config.json'), 'utf8'));
const base = cfg.apiBase.replace(/\/$/, '');
const records = JSON.parse(fs.readFileSync(path.join(AUTO, 'test-results', 'order-management-records.json'), 'utf8'));
const FEATURE = 'Order Management';
const abs = (p) => (p ? path.resolve(AUTO, p) : null);

function plannedFields(r) {
  const f = { 'Test Result': r.testResult };
  if (r.remark) f.Remark = r.remark;
  if (r.testDate) f['Test Date'] = Number(new Date(r.testDate));
  return f;
}

const token = await getAccessToken(cfg);
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const recApi = `${base}/open-apis/bitable/v1/apps/${cfg.appToken}/tables/${cfg.tableId}/records`;

const val = (v) => (Array.isArray(v) ? v.map((x) => x.text || x.name || x).join('') : (v && v.text) || v);
const existing = {};
let pageToken = '';
do {
  const url = `${recApi}?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
  const res = await fetch(url, { headers: H }).then((r) => r.json());
  for (const it of res.data?.items || []) {
    const feat = val(it.fields?.Feature);
    const tc = val(it.fields?.[cfg.upsertKey]);
    if (feat && tc) existing[`${feat}||${tc}`] = it.record_id;
  }
  pageToken = res.data?.has_more ? res.data.page_token : '';
} while (pageToken);

const missing = records.filter((r) => !existing[`${FEATURE}||${r.testcaseNo}`]);

if (!CONFIRM) {
  console.log('=== DRY RUN — Order Management results → Lark Base ===');
  console.log(`Base ${cfg.appToken} / table ${cfg.tableId} · key = Feature + "${cfg.upsertKey}"`);
  const found = records.filter((r) => existing[`${FEATURE}||${r.testcaseNo}`]);
  console.log(`matched ${found.length} / ${records.length} records · missing ${missing.length}`);
  for (const r of records) {
    const hit = existing[`${FEATURE}||${r.testcaseNo}`] ? 'UPDATE' : '⚠ MISSING';
    const evi = [abs(r.evidenceFile)].filter((p) => p && fs.existsSync(p));
    const icon = r.testResult === 'PASSED' ? '✅' : r.testResult === 'FAILED' ? '❌' : r.testResult === 'BLOCKED' ? '🚧' : '⏸';
    console.log(`  [${hit}] ${icon} ${r.testcaseNo.padEnd(13)} ${r.testResult.padEnd(8)} files=[${evi.map(() => '🖼').join('')}]${r.remark ? ' · ' + r.remark.slice(0, 70) : ''}`);
  }
  if (missing.length) console.log('\n⚠ MISSING (TC not in Base — upload design rows first via scripts/upload-tc.mjs):', missing.map((m) => m.testcaseNo).join(', '));
  console.log('\nรัน --confirm เพื่อเขียนจริง');
  process.exit(0);
}

let openId = null;
const ui = await fetch(`${base}/open-apis/authen/v1/user_info`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
openId = ui.data?.open_id || null;

const ftCache = {};
async function upload(file) {
  if (ftCache[file]) return ftCache[file];
  const buf = fs.readFileSync(file);
  const isImg = /\.(png|jpe?g|gif)$/i.test(file);
  const form = new FormData();
  form.append('file_name', path.basename(file));
  form.append('parent_type', isImg ? 'bitable_image' : 'bitable_file');
  form.append('parent_node', cfg.appToken);
  form.append('size', String(buf.length));
  form.append('file', new Blob([buf]), path.basename(file));
  const res = await fetch(`${base}/open-apis/drive/v1/medias/upload_all`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }).then((r) => r.json());
  if (res.code !== 0) { console.log(`   upload ${path.basename(file)} → ❌ ${res.code} ${res.msg}`); return null; }
  ftCache[file] = res.data.file_token;
  return res.data.file_token;
}

let updated = 0, failed = 0, skipped = 0;
for (const r of records) {
  const id = existing[`${FEATURE}||${r.testcaseNo}`];
  if (!id) { console.log(`${r.testcaseNo} → ⏭ missing in Base (skip)`); skipped++; continue; }
  const fields = plannedFields(r);
  if (r.testBy && openId) fields['Test By'] = [{ id: openId }];
  const tokens = [];
  for (const p of [abs(r.evidenceFile)]) {
    if (p && fs.existsSync(p)) { const ft = await upload(p); if (ft) tokens.push({ file_token: ft }); }
  }
  if (tokens.length) fields['Result Note'] = tokens;
  const res = await fetch(`${recApi}/${id}`, { method: 'PUT', headers: H, body: JSON.stringify({ fields }) }).then((x) => x.json());
  if (res.code === 0) { updated++; console.log(`${r.testcaseNo} → ✅ ${r.testResult}${tokens.length ? ' +' + tokens.length + ' file(s)' : ''}`); }
  else { failed++; console.log(`${r.testcaseNo} → ❌ ${res.code} ${res.msg}`); }
}
console.log(`\nเสร็จ: updated ${updated} · skip(missing) ${skipped} · error ${failed}`);
