#!/usr/bin/env node
/**
 * Update Expected Result (toast / validation text) ใน Lark Base
 * Feature = Spare Parts & Inventory Management
 * Source:  PO's Error & Success Handling Matrix (2026-06-25)
 *
 * Run:  node update-expected-toast-lark.mjs           # dry-run
 *       node update-expected-toast-lark.mjs --confirm  # write
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { getAccessToken } from '../../qa-ai-pilot/automation/scripts/lark-auth.mjs';
const CONFIRM = process.argv.includes('--confirm');

const QA_PILOT = path.join(__dirname, '../../qa-ai-pilot/automation');
const cfg = JSON.parse(fs.readFileSync(path.join(QA_PILOT, 'lark.config.json'), 'utf8'));
const APP = cfg.tcAppToken, TBL = cfg.tcTableId, BASE = cfg.apiBase;

const FEATURE = 'Spare Parts & Inventory Management';

// ── Exact text from PO matrix (2026-06-25) ────────────────────────────────
const UPDATES = {
  'TS-03_TC-03': `Saved successfully; success toast: "Spare parts created successfully" — "Denso Air Filter DL-1101" appears in the list with Price: ฿2,500.00 and Warranty: 12 Months (365 days → 12 Months per SP-Q6)`,
  'TS-04_TC-02': `Saved successfully; success toast: "Spare parts updated successfully" — "Mercedes-Benz M112" shows Price: ฿95,000.00 in the list`,
  'TS-05_TC-02': `Before Confirm: dialog shows "Delete [part name]?" with Confirm/Cancel — After Confirm: success toast: "Spare Parts deleted successfully"; "Synthetic Engine Oil 5W-30" is removed from the list`,
  'TA-02_TC-01': `Not saved; validation error: "Please fill in: Spare Part Name (EN)" — error state on field (red border / message under field)`,
  'TA-03_TC-01': `Not saved; validation error: "Please fill in: Price" — error state on Price field`,
  'TA-04_TC-01': `Not saved; validation error: "Please fill in: Spare Part Name (TH)" — error state on field; original data unchanged`,
};

const norm = v => v == null ? '' : (typeof v === 'object'
  ? (Array.isArray(v) ? v.map(x => x.text ?? x).join('') : (v.text ?? v.value ?? ''))
  : String(v));

async function main() {
  const token = await getAccessToken(cfg);

  // ── Fetch all records for this feature ──
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

  // ── Build diff ──
  const toUpdate = [];
  for (const [tc, newVal] of Object.entries(UPDATES)) {
    const rec = existing.get(tc);
    if (!rec) { console.warn(`  ⚠️  TC ${tc} ไม่พบใน Base`); continue; }
    if (rec.current === newVal) { console.log(`  ✓  ${tc} ไม่เปลี่ยน`); continue; }
    toUpdate.push({ record_id: rec.record_id, tc, old: rec.current.slice(0, 80), new: newVal });
    console.log(`  📝 ${tc}\n     OLD: ${rec.current.slice(0, 80)}\n     NEW: ${newVal.slice(0, 80)}`);
  }

  console.log(`\n${CONFIRM ? '🚀 Writing' : '🔍 DRY-RUN'}: ${toUpdate.length} record(s) to update\n`);
  if (!CONFIRM || toUpdate.length === 0) {
    if (!CONFIRM) console.log('Add --confirm to write to Lark Base.');
    return;
  }

  // ── Batch update (max 500 per call) ──
  const BATCH = 500;
  for (let i = 0; i < toUpdate.length; i += BATCH) {
    const batch = toUpdate.slice(i, i + BATCH).map(r => ({
      record_id: r.record_id,
      fields: { 'Expected Result': r.new },
    }));
    const url = `${BASE}/open-apis/bitable/v1/apps/${APP}/tables/${TBL}/records/batch_update`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: batch }),
    }).then(r => r.json());
    if (res.code !== 0) { console.error('batch_update ล้มเหลว:', res.msg); process.exit(1); }
    console.log(`✅ Updated ${batch.length} records (batch ${Math.floor(i/BATCH)+1})`);
  }
  console.log('\n✅ Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
