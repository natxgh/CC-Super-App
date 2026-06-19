// poll-po — อ่าน Records จาก Lark Base · เช็ค Answer column → ครบทุกข้อ? exit 2 → answers.json
// read-only (ไม่มี side-effect) → รันซ้ำ / ตั้ง schedule ได้
// รองรับ pending.json เป็น array (multi-feature) หรือ object เดิม
import fs from 'fs';
import path from 'path';
import { getAccessToken } from './lark-auth.mjs';

const ROOT = process.cwd();
const STATE_DIR = path.join(ROOT, '.po-loop');
const pendingPath = path.join(STATE_DIR, 'pending.json');
const cfgPath = path.join(ROOT, 'lark.config.json');

if (!fs.existsSync(pendingPath)) { console.log('ยังไม่มี pending.json — รัน ask:po (--confirm) ก่อน'); process.exit(0); }
const raw = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
// รองรับ object เดิม (single feature) และ array ใหม่ (multi-feature)
const batches = Array.isArray(raw) ? raw : [raw];
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

if (!process.env.LARK_APP_ID) { console.log('ตั้ง env LARK_APP_ID/SECRET ก่อน'); process.exit(0); }

const base = (cfg.apiBase || 'https://open.larksuite.com').replace(/\/$/, '');
const token = await getAccessToken(cfg);

// cache table items per (poAppToken, poTableId)
const tableCache = {};
async function fetchTableItems(poAppToken, poTableId) {
  const key = `${poAppToken}::${poTableId}`;
  if (tableCache[key]) return tableCache[key];
  const items = [];
  let pageToken = '';
  do {
    const url = `${base}/open-apis/bitable/v1/apps/${poAppToken}/tables/${poTableId}/records`
      + `?page_size=100${pageToken ? `&page_token=${pageToken}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((x) => x.json());
    if (r.code !== 0) { console.error('อ่าน records ไม่สำเร็จ:', JSON.stringify(r)); process.exit(1); }
    for (const item of r.data?.items || []) items.push(item);
    pageToken = r.data?.has_more ? r.data.page_token : '';
  } while (pageToken);
  tableCache[key] = items;
  return items;
}

const updatedBatches = [];
let totalAnswered = 0;
let totalQuestions = 0;

for (const batch of batches) {
  const { feature, poAppToken, poTableId, records: pendingRecords } = batch;
  const allItems = await fetchTableItems(poAppToken, poTableId);
  const recordMap = Object.fromEntries(allItems.map((r) => [r.record_id, r.fields]));

  const updated = pendingRecords.map((pr) => {
    const fields = recordMap[pr.recordId] || {};
    const rawAnswer = fields.Answer;
    const answer = typeof rawAnswer === 'string' ? rawAnswer.trim() : (rawAnswer?.text?.trim?.() ?? null);
    return { ...pr, status: answer ? 'answered' : 'open', answer: answer || null };
  });

  const answeredCount = updated.filter((r) => r.status === 'answered').length;
  totalAnswered += answeredCount;
  totalQuestions += updated.length;

  console.log(`\n📋 [${feature}] ตอบแล้ว ${answeredCount}/${updated.length} ข้อ`);
  for (const r of updated) {
    const icon = r.status === 'answered' ? '✅' : '⏳';
    console.log(`  ${icon} ${r.id} — ${r.topic.split('\n')[0]}${r.answer ? ': ' + r.answer.split('\n')[0] : ''}`);
  }

  updatedBatches.push({ ...batch, records: updated });
}

// save state (คง format array)
fs.writeFileSync(pendingPath, JSON.stringify(updatedBatches, null, 2));

console.log(`\n📊 รวม: ตอบแล้ว ${totalAnswered}/${totalQuestions} ข้อ (${updatedBatches.length} features)`);

if (totalAnswered < totalQuestions) {
  for (const b of updatedBatches) {
    const open = b.records.filter((r) => r.status === 'open');
    if (open.length > 0) {
      console.log(`  ⏳ [${b.feature}] รอ: ${open.map((r) => r.id).join(', ')}`);
    }
  }
  console.log('\n⏳ ยังไม่ครบ — poll ใหม่อีกรอบ');
  process.exit(0);
}

// ครบทุกข้อทุก Feature → เขียน answers.json → exit 2
const answersOut = {};
for (const b of updatedBatches) {
  answersOut[b.feature] = Object.fromEntries(
    b.records.map((r) => [r.id, { topic: r.topic, proposed: r.proposed, answer: r.answer }])
  );
}
fs.writeFileSync(
  path.join(STATE_DIR, 'answers.json'),
  JSON.stringify(answersOut, null, 2),
);
console.log('\n🎉 ตอบครบทุก Feature แล้ว → .po-loop/answers.json พร้อม resume design');
process.exit(2);
