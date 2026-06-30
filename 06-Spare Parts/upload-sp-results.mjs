#!/usr/bin/env node
/**
 * Upload Spare Parts automation results → Lark Base (Test Scenarios & Result table)
 * Feature = "Spare Parts & Inventory Management" · upsert by "TC No."
 * Writes: Test Result · Result Note · Remark · Test Date · (Test By optional)
 *
 * Source: sp-results.json next to this file — array of { tc, result, note, remark }
 *   result ∈ "Passed" | "Failed" | "Blocked" | "N/A"
 *
 * Run from 06-Spare Parts/:
 *   node upload-sp-results.mjs            # dry-run
 *   node upload-sp-results.mjs --confirm  # write (needs LARK_APP_ID / LARK_APP_SECRET in env)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAccessToken } from '../../qa-ai-pilot/automation/scripts/lark-auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIRM = process.argv.includes('--confirm');
const QA_PILOT = path.join(__dirname, '../../qa-ai-pilot/automation');
const cfg = JSON.parse(fs.readFileSync(path.join(QA_PILOT, 'lark.config.json'), 'utf8'));
const APP = cfg.tcAppToken, TBL = cfg.tcTableId, BASE = cfg.apiBase;
const FM = cfg.fieldMapping; // testResult/resultNote/remark/testDate
const FEATURE = 'Spare Parts & Inventory Management';
const TEST_DATE_MS = new Date('2026-06-30').getTime();

const results = JSON.parse(fs.readFileSync(path.join(__dirname, 'sp-results.json'), 'utf8'));
const byTc = new Map(results.map(r => [r.tc.trim(), r]));

const norm = v => v == null ? '' : (typeof v === 'object'
  ? (Array.isArray(v) ? v.map(x => x.text ?? x).join('') : (v.text ?? v.value ?? ''))
  : String(v));

async function main() {
  const token = await getAccessToken(cfg);
  const existing = new Map();
  let pageToken = '';
  do {
    const url = `${BASE}/open-apis/bitable/v1/apps/${APP}/tables/${TBL}/records?page_size=100${pageToken ? `&page_token=${pageToken}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    if (res.code !== 0) { console.error('fetch records failed:', res.msg); process.exit(1); }
    (res.data?.items || []).forEach(r => {
      if (norm(r.fields?.['Feature']) !== FEATURE) return;
      const tc = norm(r.fields?.['TC No.']).trim();
      if (tc) existing.set(tc, r.record_id);
    });
    pageToken = res.data?.has_more ? res.data.page_token : '';
  } while (pageToken);
  console.log(`\n🗂️  ${existing.size} "${FEATURE}" records · ${byTc.size} result rows\n`);

  const updates = [];
  for (const [tc, r] of byTc) {
    const rid = existing.get(tc);
    if (!rid) { console.warn(`  ⚠️  ${tc} not found in Base`); continue; }
    const fields = {
      [FM.testResult]: r.result,
      [FM.resultNote]: r.note || '',
      [FM.remark]: r.remark || '',
      [FM.testDate]: TEST_DATE_MS,
    };
    updates.push({ record_id: rid, fields });
    console.log(`  ${r.result === 'Passed' ? '✅' : r.result === 'Failed' ? '❌' : '🟡'} ${tc} — ${r.result}${r.remark ? ` · ${r.remark.slice(0, 70)}` : ''}`);
  }
  console.log(`\n${CONFIRM ? '🚀 Writing' : '🔍 DRY-RUN'}: ${updates.length} record(s)\n`);
  if (!CONFIRM || !updates.length) { if (!CONFIRM) console.log('Add --confirm to write.'); return; }

  for (let i = 0; i < updates.length; i += 500) {
    const batch = updates.slice(i, i + 500);
    const url = `${BASE}/open-apis/bitable/v1/apps/${APP}/tables/${TBL}/records/batch_update`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: batch }),
    }).then(r => r.json());
    if (res.code !== 0) { console.error('batch_update failed:', res.msg); process.exit(1); }
    console.log(`✅ Updated ${batch.length} records`);
  }
  console.log('\n✅ Done.');
}
main().catch(e => { console.error(e); process.exit(1); });
