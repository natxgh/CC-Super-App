// push-ts10-lark.mjs — DRY-RUN then push TS-10 rows directly to Lark Base
// รัน: node push-ts10-lark.mjs           (dry-run)
//       node push-ts10-lark.mjs --confirm  (write)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';
import fs from 'fs';

const CONFIRM = process.argv.includes('--confirm');
const QA_PILOT = '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation';
const { getAccessToken } = await import(`${QA_PILOT}/scripts/lark-auth.mjs`);
const cfg = JSON.parse(fs.readFileSync(`${QA_PILOT}/lark.config.json`, 'utf8'));

const ENV_FILE = '/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/.env';
for (const line of fs.readFileSync(ENV_FILE,'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
}

const BASE   = (cfg.apiBase || 'https://open.larksuite.com').replace(/\/$/,'');
const APP_TOKEN = cfg.tcAppToken;
const TABLE_ID  = cfg.tcTableId;

const ARRANGE = `Login User: ketwadee
Role & Permission: All Permission - Contact Management
---------------------------------------------------
Customer Data in System:
≥1 Customer record exists (e.g. ana Yukinae / any seeded customer)`;

const BC = `1. Customer List Toggle View (Table / Grid)
2. Default view = Table View (☰ icon active)
3. Grid View icon (⊞) switches to Card layout
4. Table View icon (☰) switches back to Table layout`;

const SCEN_NAME = 'User can view Customer List in Table View (default) and switch to Grid View and back';

const TS10_TCS = [
  {
    'Feature':        'Customer Profile',
    'Scenario No.':   'TS-10',
    'Scenario Name':  SCEN_NAME,
    'Business Conditions': BC,
    'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)': ARRANGE,
    'TC No.':         'TS-10_TC-01',
    'Case Title Name':'Navigate to Customer List — Table View is displayed by default',
    'Test category':  'POSITIVE',
    'Test Type':      'SYSTEMTEST',
    'Test Steps':     'Login User: ketwadee\nand Navigate to "Customer List Page"',
    'Expected Result':'Table View is active by default:\n- Icon ☰ (Table View) is highlighted blue\n- Icon ⊞ (Grid View) is NOT highlighted\n- Table is displayed with columns: ลูกค้า / ติดต่อ / ผลิตภัณฑ์ / บริการ / ประเภท / เปิดใช้งาน\n- Action buttons per row: โทร / อีเมล / แชท / ดู / แก้ไข / ลบ',
    'Project Name':   'AICC',
    'Product':        'CC Super App',
  },
  {
    'Feature':        'Customer Profile',
    'Scenario No.':   'TS-10',
    'Scenario Name':  SCEN_NAME,
    'Business Conditions': BC,
    'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)': ARRANGE,
    'TC No.':         'TS-10_TC-02',
    'Case Title Name':'Click Grid View icon (⊞) — list switches to Grid/Card layout',
    'Test category':  'POSITIVE',
    'Test Type':      'SYSTEMTEST',
    'Test Steps':     'Click the Grid View icon (⊞) at the top-left toggle area',
    'Expected Result':'Grid View is active:\n- Icon ⊞ (Grid View) is highlighted blue\n- Icon ☰ (Table View) is NOT highlighted\n- Page displays Card layout (no table rows)\n- Each card shows: Profile photo · Customer name · Type badge (โกลด์/แพลทินัม/บรอนซ์/ซิลเวอร์) · Active status dot · Email · Phone · จำนวน ผลิตภัณฑ์ · จำนวน บริการ · Action buttons (โทร/อีเมล/แชท/ดู/แก้ไข/ลบ)',
    'Project Name':   'AICC',
    'Product':        'CC Super App',
  },
  {
    'Feature':        'Customer Profile',
    'Scenario No.':   'TS-10',
    'Scenario Name':  SCEN_NAME,
    'Business Conditions': BC,
    'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)': ARRANGE,
    'TC No.':         'TS-10_TC-03',
    'Case Title Name':'Click Table View icon (☰) — list switches back to Table layout',
    'Test category':  'POSITIVE',
    'Test Type':      'SYSTEMTEST',
    'Test Steps':     'Click the Table View icon (☰) at the top-left toggle area',
    'Expected Result':'Table View is restored:\n- Icon ☰ (Table View) is highlighted blue\n- Icon ⊞ (Grid View) is NOT highlighted\n- Table is displayed with columns: ลูกค้า / ติดต่อ / ผลิตภัณฑ์ / บริการ / ประเภท / เปิดใช้งาน\n- Card layout is no longer visible',
    'Project Name':   'AICC',
    'Product':        'CC Super App',
  },
];

// ── DRY-RUN ──
if (!CONFIRM) {
  console.log('\n=== DRY RUN — TS-10 → Lark Base ===');
  console.log(`Target: ${BASE}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}`);
  console.log(`Records to insert: ${TS10_TCS.length}\n`);
  TS10_TCS.forEach((r,i) => {
    console.log(`[${i+1}] TC No.: ${r['TC No.']} | Scenario: ${r['Scenario No.']}`);
    console.log(`     Title: ${r['Case Title Name']}`);
    console.log(`     Expected: ${r['Expected Result'].split('\n')[0]}...`);
  });
  console.log('\n→ รัน: node push-ts10-lark.mjs --confirm  เพื่อ push จริง');
  process.exit(0);
}

// ── PUSH ──
const token = await getAccessToken(cfg);
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

// check existing keys (composite Feature + TC No.)
const norm = v => v == null ? '' : String(v).trim();
const keyOf = (feat, tc) => `${norm(feat)}||${norm(tc)}`;
const existingKeys = new Set();
let pageToken = '';
do {
  const url = `${BASE}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
  const res = await fetch(url, { headers });
  const j = await res.json();
  const items = j?.data?.items || [];
  for (const item of items) {
    const f = item.fields;
    existingKeys.add(keyOf(f['Feature'], f['TC No.']));
  }
  pageToken = j?.data?.has_more ? j.data.page_token : '';
} while (pageToken);

const toInsert = TS10_TCS.filter(r => !existingKeys.has(keyOf(r['Feature'], r['TC No.'])));
const toSkip   = TS10_TCS.filter(r =>  existingKeys.has(keyOf(r['Feature'], r['TC No.'])));

console.log(`📊 Insert: ${toInsert.length} · Skip (already exist): ${toSkip.length}`);
if (toSkip.length) toSkip.forEach(r => console.log(`  ⏭ ${r['TC No.']} already exists`));

if (toInsert.length === 0) { console.log('✅ ไม่มีอะไรต้อง insert'); process.exit(0); }

// batch insert (max 500 per call)
const BATCH = 500;
for (let i = 0; i < toInsert.length; i += BATCH) {
  const chunk = toInsert.slice(i, i + BATCH).map(r => ({ fields: r }));
  const url = `${BASE}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/batch_create`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ records: chunk }) });
  const j = await res.json();
  if (j.code !== 0) { console.error('❌ Lark error:', JSON.stringify(j)); process.exit(1); }
  console.log(`✅ Inserted batch ${Math.floor(i/BATCH)+1}: ${chunk.length} records`);
}
console.log('\n🎉 TS-10 pushed to Lark Base successfully!');
