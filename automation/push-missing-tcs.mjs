#!/usr/bin/env node
// push-missing-tcs.mjs — insert TS-08_TC-02 + TA-06_TC-02~05 into Lark Base
// DRY-RUN by default · --confirm to write
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIRM = process.argv.includes('--confirm');

const QA_PILOT = '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation';
const LARK_TOKEN_PATH = path.join(QA_PILOT, '.lark-token.json');
const LARK_CONFIG_PATH = path.join(QA_PILOT, 'lark.config.json');

const cfg = JSON.parse(fs.readFileSync(LARK_CONFIG_PATH, 'utf8'));
const APP = cfg.tcAppToken;
const TBL = cfg.tcTableId;
const BASE = cfg.apiBase;
const TEST_DATE_MS = new Date('2026-06-27').getTime();

// ── Auth ──────────────────────────────────────────────────────────────────────
async function getToken() {
  const stored = JSON.parse(fs.readFileSync(LARK_TOKEN_PATH, 'utf8'));
  const { LARK_APP_ID, LARK_APP_SECRET } = process.env;
  const appRes = await fetch(`${BASE}/open-apis/auth/v3/app_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
  }).then(r => r.json());
  if (!appRes.app_access_token) throw new Error(`app_access_token failed: ${JSON.stringify(appRes)}`);
  const res = await fetch(`${BASE}/open-apis/authen/v1/refresh_access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${appRes.app_access_token}` },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: stored.refresh_token }),
  }).then(r => r.json());
  const d = res.data || res;
  if (!d.access_token) throw new Error(`refresh failed: ${JSON.stringify(res)}`);
  fs.writeFileSync(LARK_TOKEN_PATH, JSON.stringify({ refresh_token: d.refresh_token || stored.refresh_token, obtained_at: new Date().toISOString() }, null, 2));
  return d.access_token;
}

// ── Records to insert ─────────────────────────────────────────────────────────
const ROWS = [
  {
    'Project Name': 'AICC',
    'Product': 'CC Super App',
    'Feature': 'Customer Profile',
    'Scenario No.': 'TS-08',
    'Scenario Name': 'Display fallback: no name → email, no type → N/A',
    'Business Conditions': 'ลูกค้าที่ไม่มี Type ต้องแสดง "N/A" ในช่อง Type',
    'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)': 'Login as Agent · seed customer NONAME (firstName/lastName/type ว่าง)',
    'TC No.': 'TS-08_TC-02',
    'Case Title Name': 'Customer ไม่มี Type → ช่อง Type แสดง "N/A"',
    'Test category': 'POSITIVE',
    'Test Type': 'SYSTEMTEST',
    'Test Steps': '1. เปิด Customer Detail ของ customer ที่ไม่มี Type\n2. สังเกตช่อง Type',
    'Expected Result': 'ช่อง Type แสดงข้อความ "N/A" (exact match)',
    'Test Result': 'PASSED',
    'Test Date': TEST_DATE_MS,
  },
  {
    'Project Name': 'AICC',
    'Product': 'CC Super App',
    'Feature': 'Customer Profile',
    'Scenario No.': 'TA-05',
    'Scenario Name': 'Error toast "Invalid email format" (invalid email formats)',
    'Business Conditions': 'Email ที่ format ผิดต้องแสดง toast "Invalid email format"',
    'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)': 'Login as Agent · เปิดหน้า Add Customer · กรอก field อื่นครบ ยกเว้น email',
    'TC No.': 'TA-06_TC-02',
    'Case Title Name': 'Email "test@gmail" (no TLD) → "Invalid email format"',
    'Test category': 'NEGATIVE',
    'Test Type': 'SYSTEMTEST',
    'Test Steps': '1. กรอก Email = "test@gmail"\n2. กด Save',
    'Expected Result': 'Toast แสดง "Invalid email format"',
    'Test Result': 'PASSED',
    'Test Date': TEST_DATE_MS,
  },
  {
    'Project Name': 'AICC',
    'Product': 'CC Super App',
    'Feature': 'Customer Profile',
    'Scenario No.': 'TA-05',
    'Scenario Name': 'Error toast "Invalid email format" (invalid email formats)',
    'Business Conditions': 'Email ที่ format ผิดต้องแสดง toast "Invalid email format"',
    'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)': 'Login as Agent · เปิดหน้า Add Customer · กรอก field อื่นครบ ยกเว้น email',
    'TC No.': 'TA-06_TC-03',
    'Case Title Name': 'Email "test@@gmail.com" (double @) → "Invalid email format"',
    'Test category': 'NEGATIVE',
    'Test Type': 'SYSTEMTEST',
    'Test Steps': '1. กรอก Email = "test@@gmail.com"\n2. กด Save',
    'Expected Result': 'Toast แสดง "Invalid email format"',
    'Test Result': 'PASSED',
    'Test Date': TEST_DATE_MS,
  },
  {
    'Project Name': 'AICC',
    'Product': 'CC Super App',
    'Feature': 'Customer Profile',
    'Scenario No.': 'TA-05',
    'Scenario Name': 'Error toast "Invalid email format" (invalid email formats)',
    'Business Conditions': 'Email ที่ format ผิดต้องแสดง toast "Invalid email format"',
    'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)': 'Login as Agent · เปิดหน้า Add Customer · กรอก field อื่นครบ ยกเว้น email',
    'TC No.': 'TA-06_TC-04',
    'Case Title Name': 'Email "test@gmail.c" (TLD 1 char only) → "Invalid email format"',
    'Test category': 'NEGATIVE',
    'Test Type': 'SYSTEMTEST',
    'Test Steps': '1. กรอก Email = "test@gmail.c"\n2. กด Save',
    'Expected Result': 'Toast แสดง "Invalid email format"',
    'Test Result': 'PASSED',
    'Test Date': TEST_DATE_MS,
  },
  {
    'Project Name': 'AICC',
    'Product': 'CC Super App',
    'Feature': 'Customer Profile',
    'Scenario No.': 'TA-05',
    'Scenario Name': 'Error toast "Invalid email format" (invalid email formats)',
    'Business Conditions': 'Email ที่ format ผิดต้องแสดง toast "Invalid email format"',
    'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)': 'Login as Agent · เปิดหน้า Add Customer · กรอก field อื่นครบ ยกเว้น email',
    'TC No.': 'TA-06_TC-05',
    'Case Title Name': 'Email "test@.com" (domain starts with dot) → "Invalid email format"',
    'Test category': 'NEGATIVE',
    'Test Type': 'SYSTEMTEST',
    'Test Steps': '1. กรอก Email = "test@.com"\n2. กด Save',
    'Expected Result': 'Toast แสดง "Invalid email format"',
    'Test Result': 'PASSED',
    'Test Date': TEST_DATE_MS,
  },
];

// ── DRY RUN ───────────────────────────────────────────────────────────────────
if (!CONFIRM) {
  console.log('=== DRY RUN ===');
  for (const r of ROWS) console.log(`  INSERT ${r['TC No.']} — ${r['Case Title Name']}`);
  console.log(`\nรวม ${ROWS.length} rows → รัน --confirm เพื่อ insert จริง`);
  process.exit(0);
}

// ── Insert ────────────────────────────────────────────────────────────────────
const token = await getToken();
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const recApi = `${BASE}/open-apis/bitable/v1/apps/${APP}/tables/${TBL}/records`;

// Check existing to avoid duplicates (Feature + TC No.)
let pageToken = '', existing = new Set();
do {
  const url = `${recApi}?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
  const res = await fetch(url, { headers: H }).then(r => r.json());
  for (const it of res.data?.items || []) {
    const feat = it.fields?.['Feature'];
    const tcNo = it.fields?.['TC No.'];
    const f = Array.isArray(feat) ? feat.map(x => x.text ?? x).join('') : String(feat ?? '');
    const t = Array.isArray(tcNo) ? tcNo.map(x => x.text ?? x).join('') : String(tcNo ?? '');
    if (f && t) existing.add(`${f}||${t}`);
  }
  pageToken = res.data?.has_more ? res.data.page_token : '';
} while (pageToken);

let inserted = 0, skipped = 0;
for (const r of ROWS) {
  const key = `${r['Feature']}||${r['TC No.']}`;
  if (existing.has(key)) { console.log(`⏭  Skip (already exists): ${r['TC No.']}`); skipped++; continue; }
  const res = await fetch(recApi, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ fields: r }),
  }).then(x => x.json());
  if (res.code === 0) { console.log(`✅ Inserted: ${r['TC No.']}`); inserted++; }
  else { console.log(`❌ Failed ${r['TC No.']}: ${res.code} ${res.msg}`); }
}
console.log(`\n🎉 Done — Insert: ${inserted} · Skip: ${skipped}`);
