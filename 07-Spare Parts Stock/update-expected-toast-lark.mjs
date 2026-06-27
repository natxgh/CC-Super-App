#!/usr/bin/env node
/**
 * Update Expected Result (toast text) ใน Lark Base
 * Feature = Spare Parts Stock Management
 * Source:  PO's Error & Success Handling Matrix (2026-06-25)
 *
 * Run from qa-ai-pilot/automation:
 *   node "/path/to/update-expected-toast-lark.mjs"           # dry-run
 *   node "/path/to/update-expected-toast-lark.mjs" --confirm # write
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAccessToken } from '../scripts/lark-auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIRM = process.argv.includes('--confirm');

const ROOT = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'lark.config.json'), 'utf8'));
const APP = cfg.tcAppToken, TBL = cfg.tcTableId, BASE = cfg.apiBase;

const FEATURE = 'Spare Parts Stock Management';

const UPDATES = {
  'TS-03_TC-04': `Success toast "Spare Parts Stock updated successfully"; row SN0000019 updated to Store=Store1 in the list`,
  'TS-04_TC-02': `Confirm dialog appears; after confirm, toast "Spare Parts Stock deleted successfully"; row SN0000016 disappears; iPhone 17 Pro Screen stock count drops by 1`,
  'TA-01_TC-02': `"Please fill in: Serial No." error shown under Serial No. field; not saved, modal stays open`,
  'TA-01_TC-03': `"Please fill in: Spare Part" error shown under Spare Part field; not saved`,
  'TA-03_TC-01': `Empty list + empty state "No entries to show" (no error)`,
};

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
    if (res.code !== 0) { console.error('ดึง records ไม่ได้:', res.msg); process.exit(1); }
    (res.data?.items || []).forEach(r => {
      if (norm(r.fields?.['Feature']) !== FEATURE) return;
      const tc = norm(r.fields?.['TC No.']).trim();
      if (tc) existing.set(tc, { record_id: r.record_id, current: norm(r.fields?.['Expected Result']) });
    });
    pageToken = res.data?.has_more ? res.data.page_token : '';
  } while (pageToken);
  console.log(`\n🗂️  Fetched ${existing.size} records for "${FEATURE}"\n`);

  const toUpdate = [];
  for (const [tc, newVal] of Object.entries(UPDATES)) {
    const rec = existing.get(tc);
    if (!rec) { console.warn(`  ⚠️  TC ${tc} ไม่พบใน Base`); continue; }
    if (rec.current === newVal) { console.log(`  ✓  ${tc} ไม่เปลี่ยน`); continue; }
    toUpdate.push({ record_id: rec.record_id, tc, old: rec.current.slice(0, 80), new: newVal });
    console.log(`  📝 ${tc}\n     OLD: ${rec.current.slice(0, 80)}\n     NEW: ${newVal.slice(0, 80)}`);
  }

  console.log(`\n${CONFIRM ? '🚀 Writing' : '🔍 DRY-RUN'}: ${toUpdate.length} record(s)\n`);
  if (!CONFIRM || toUpdate.length === 0) { if (!CONFIRM) console.log('Add --confirm to write.'); return; }

  const batch = toUpdate.map(r => ({ record_id: r.record_id, fields: { 'Expected Result': r.new } }));
  const url = `${BASE}/open-apis/bitable/v1/apps/${APP}/tables/${TBL}/records/batch_update`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: batch }),
  }).then(r => r.json());
  if (res.code !== 0) { console.error('batch_update ล้มเหลว:', res.msg); process.exit(1); }
  console.log(`✅ Updated ${batch.length} records\n✅ Done.`);
}

main().catch(e => { console.error(e); process.exit(1); });
