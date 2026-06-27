#!/usr/bin/env node
// upload-cp-results.mjs — update Customer Profile test results in Lark Base
// DRY-RUN by default · --confirm to write · --skip-video to skip video upload
//
// Run from CC Super App/automation/:
//   node upload-cp-results.mjs
//   node upload-cp-results.mjs --confirm
//
// Auth: reuses .lark-token.json from qa-ai-pilot/automation (user OAuth token)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIRM = process.argv.includes('--confirm');
const SKIP_VIDEO = process.argv.includes('--skip-video');

// ── Config ────────────────────────────────────────────────────────────────────
const QA_PILOT = '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation';
const LARK_TOKEN_PATH = path.join(QA_PILOT, '.lark-token.json');
const LARK_CONFIG_PATH = path.join(QA_PILOT, 'lark.config.json');

const cfg = JSON.parse(fs.readFileSync(LARK_CONFIG_PATH, 'utf8'));
const APP = cfg.tcAppToken;   // Zq5JbZXU1a3gbbsSnU7lDxsogBc
const TBL = cfg.tcTableId;    // tblIwUWXkWNLYy4c
const BASE = cfg.apiBase;     // https://open.larksuite.com
const FEATURE = 'Customer Profile';
const TEST_DATE_MS = new Date('2026-06-27').getTime();

const RESULTS_PATH = path.join(__dirname, 'cp-results.json');
const EVIDENCE_DIR = path.join(__dirname);

const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));

// ── Auth (same pattern as qa-ai-pilot/automation/scripts/lark-auth.mjs) ──────
async function getToken() {
  if (!fs.existsSync(LARK_TOKEN_PATH)) throw new Error(`ไม่พบ ${LARK_TOKEN_PATH} — รัน lark:oauth ก่อน`);
  const stored = JSON.parse(fs.readFileSync(LARK_TOKEN_PATH, 'utf8'));
  if (!stored.refresh_token) throw new Error('ไม่มี refresh_token ใน .lark-token.json');

  const { LARK_APP_ID, LARK_APP_SECRET } = process.env;
  if (!LARK_APP_ID || !LARK_APP_SECRET) throw new Error('ต้องตั้ง LARK_APP_ID / LARK_APP_SECRET ใน env');

  // Step 1: get app_access_token
  const appRes = await fetch(`${BASE}/open-apis/auth/v3/app_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
  }).then(r => r.json());
  if (!appRes.app_access_token) throw new Error(`app_access_token failed: ${JSON.stringify(appRes)}`);

  // Step 2: refresh user access_token using app_access_token as Bearer
  const res = await fetch(`${BASE}/open-apis/authen/v1/refresh_access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${appRes.app_access_token}` },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: stored.refresh_token }),
  }).then(r => r.json());

  const d = res.data || res;
  if (!d.access_token) throw new Error(`refresh user token failed: ${JSON.stringify(res)}`);

  // Persist rotated refresh_token
  fs.writeFileSync(LARK_TOKEN_PATH, JSON.stringify({
    refresh_token: d.refresh_token || stored.refresh_token,
    obtained_at: new Date().toISOString(),
  }, null, 2));

  return d.access_token;
}

const norm = v => v == null ? '' :
  (typeof v === 'object'
    ? (Array.isArray(v) ? v.map(x => x.text ?? x).join('') : (v.text ?? v.value ?? String(v)))
    : String(v));

// ── DRY RUN preview ───────────────────────────────────────────────────────────
if (!CONFIRM) {
  console.log('=== DRY RUN (ยังไม่เขียน Lark Base) ===');
  console.log(`Feature: ${FEATURE}`);
  console.log(`Records to update: ${results.length}`);
  const passed = results.filter(r => r.result === 'PASSED').length;
  const failed = results.filter(r => r.result === 'FAILED').length;
  console.log(`  PASSED: ${passed} | FAILED: ${failed}`);
  console.log('\nFailed TCs with video:');
  for (const r of results.filter(r => r.result === 'FAILED' && r.video)) {
    const vpath = path.join(EVIDENCE_DIR, r.video);
    const exists = fs.existsSync(vpath);
    console.log(`  ${r.tcNo}: ${exists ? '✅' : '❌ NOT FOUND'} ${r.video}`);
  }
  console.log(`\nDate: ${new Date(TEST_DATE_MS).toISOString().split('T')[0]}`);
  console.log('\n→ รัน --confirm เพื่อเขียนจริง');
  process.exit(0);
}

// ── Live run ──────────────────────────────────────────────────────────────────
const token = await getToken();
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const recApi = `${BASE}/open-apis/bitable/v1/apps/${APP}/tables/${TBL}/records`;

console.log('🔍 Fetching records from Lark Base...');
let pageToken = '', items = [];
do {
  const url = `${recApi}?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
  const res = await fetch(url, { headers: H }).then(r => r.json());
  if (res.code !== 0) { console.error('Fetch failed:', res.msg); process.exit(1); }
  (res.data?.items || []).forEach(r => items.push(r));
  pageToken = res.data?.has_more ? res.data.page_token : '';
} while (pageToken);
console.log(`📋 Total records in Base: ${items.length}`);

// Build map: Feature+TC No. → record_id
const existingMap = new Map();
for (const it of items) {
  const feat = norm(it.fields?.['Feature']);
  const tcNo = norm(it.fields?.['TC No.']);
  if (feat && tcNo) existingMap.set(`${feat}||${tcNo}`, it.record_id);
}

// ── Upload video → file_token (cache by path to avoid re-upload) ─────────────
const ftCache = {};
async function uploadVideo(videoRelPath) {
  if (ftCache[videoRelPath]) return ftCache[videoRelPath];
  const filePath = path.join(EVIDENCE_DIR, videoRelPath);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  Video not found: ${filePath}`);
    return null;
  }
  const buf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file_name', path.basename(filePath));
  form.append('parent_type', 'bitable_file');
  form.append('parent_node', APP);
  form.append('size', String(buf.length));
  form.append('file', new Blob([buf], { type: 'video/webm' }), path.basename(filePath));
  const res = await fetch(`${BASE}/open-apis/drive/v1/medias/upload_all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }).then(r => r.json());
  const ft = res.data?.file_token || null;
  if (ft) { ftCache[videoRelPath] = ft; console.log(`  📹 ${path.basename(filePath)} → ${ft}`); }
  else console.log(`  ❌ Video upload failed (${videoRelPath}): ${JSON.stringify(res)}`);
  return ft;
}

// ── Build + send updates ──────────────────────────────────────────────────────
const updates = [], notFound = [], videoUploaded = [];
for (const r of results) {
  const key = `${FEATURE}||${r.tcNo}`;
  const recordId = existingMap.get(key);
  if (!recordId) { notFound.push(r.tcNo); continue; }

  const fields = {
    'Test Result': r.result,
    'Test Date': TEST_DATE_MS,
  };
  // Result Note (attachment field) — upload video file → set as [{ file_token }]
  if (r.video) {
    const ft = await uploadVideo(r.video);
    if (ft) {
      fields['Result Note'] = [{ file_token: ft }];
      videoUploaded.push(r.tcNo);
    }
  }

  updates.push({ record_id: recordId, fields });
}

console.log(`\n📊 Matched: ${updates.length} | Not found in Base: ${notFound.length}`);
if (notFound.length) console.log(`⚠️  Not found: ${notFound.join(', ')}`);

// Batch update (max 500 per request)
const BATCH = 500;
let total = 0;
for (let i = 0; i < updates.length; i += BATCH) {
  const chunk = updates.slice(i, i + BATCH);
  const url = `${BASE}/open-apis/bitable/v1/apps/${APP}/tables/${TBL}/records/batch_update`;
  const body = JSON.stringify({ records: chunk.map(u => ({ record_id: u.record_id, fields: u.fields })) });
  const res = await fetch(url, { method: 'POST', headers: H, body }).then(r => r.json());
  if (res.code !== 0) {
    console.error(`batch_update failed (chunk ${i}):`, res.msg, JSON.stringify(res));
    process.exit(1);
  }
  total += chunk.length;
  console.log(`✅ Updated ${total}/${updates.length}`);
}

console.log(`\n🎉 Done — ${total} records updated`);
if (videoUploaded.length) console.log(`🎬 Videos uploaded for: ${videoUploaded.join(', ')}`);
if (notFound.length) console.log(`\n⚠️  ${notFound.length} TCs not found in Lark (new TCs not yet pushed?): ${notFound.join(', ')}`);
