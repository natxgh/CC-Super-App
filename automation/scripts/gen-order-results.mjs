// gen-order-results.mjs — build test-results/order-management-records.json (37 TCs)
// Honest result snapshot 2026-06-29: only TA-04 runs (read-only). Everything else BLOCKED
// (seed/create = Forbidden for ketwadee, or DOM unverified). No fake PASS.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTO = path.resolve(__dirname, '..');
const DATE = '2026-06-29';
const TESTER = 'ketwadee';

// reasons
const R_SEED = 'BLOCKED: API CreateOrder / UI Submit = "Forbidden" — login account (ketwadee) ไม่อยู่ใน inventory_order_workflow pic list (มีแค่ apiwat/watee.tha). Verified live 2026-06-29 (cc-bff-qa/graphql). Unblock: BE เพิ่ม account ใน pic list / ใช้ creds apiwat|watee.tha (ORD_PIC_USERNAME/PASSWORD) / FE workflow config deploy (Wisarud).';
const R_DOM  = 'BLOCKED: Order UI DOM ยังไม่ได้ probe — OrderPage selectors (grid/list toggle, cart qty stepper, Bill/Ship inputs, comment box) ยัง unverified. ต้อง probe DOM ก่อน un-fixme.';
const R_SLA  = 'BLOCKED (ENV_DEPENDENT): ต้องมี order ที่ค้างที่ OS003 (ได้รับการอนุมัติ) > 61 นาที — seed+รอ 61 นาทีใน CI ไม่ได้. ตั้ง ORD_OVERDUE_ID ชี้ order ที่ overdue จึงจะรันได้.';
const R_PIC  = R_SEED + ' + ยังต้องมี non-PIC account (ORD_NON_PIC_USERNAME/PASSWORD).';
const R_BUG_CANCEL = R_SEED + ' | NOTE: confirmed FE bug (ORD-Q5) — Cancel ยังโชว์หลัง Approved (BUG-cancel-visible-after-approved.md); จะ FAIL-by-design เมื่อ unblock.';
const R_BUG_SEARCH = R_SEED + ' | NOTE: confirmed FE bug (ORD-Q7) — Search คืนทุกแถว ไม่ filter (BUG-search-not-filtering.md); จะ FAIL-by-design เมื่อ unblock.';

const rows = [];
const add = (tc, result, remark, evidence) => rows.push({
  testcaseNo: tc, testResult: result, remark,
  testDate: DATE, testBy: TESTER,
  ...(evidence ? { evidenceFile: evidence } : {}),
});

// TS-01 (13) — create + 9-step advance → seed/create blocked
for (let i = 1; i <= 13; i++) add(`TS-01_TC-${String(i).padStart(2,'0')}`, 'BLOCKED', R_SEED);
// TS-02 (8) — TC01/02 DOM-only, TC03-06 seed, TC07 SLA env, TC08 seed
add('TS-02_TC-01', 'BLOCKED', R_DOM);
add('TS-02_TC-02', 'BLOCKED', R_DOM);
add('TS-02_TC-03', 'BLOCKED', R_SEED);
add('TS-02_TC-04', 'BLOCKED', R_SEED + ' (ยังเป็น ENV_DEPENDENT: OOS badge โชว์เมื่อ stock=0).');
add('TS-02_TC-05', 'BLOCKED', R_SEED);
add('TS-02_TC-06', 'BLOCKED', R_SEED);
add('TS-02_TC-07', 'BLOCKED', R_SLA);
add('TS-02_TC-08', 'BLOCKED', R_SEED);
// TS-03 (3) — seed
for (let i = 1; i <= 3; i++) add(`TS-03_TC-${String(i).padStart(2,'0')}`, 'BLOCKED', R_SEED);
// TS-04 (3) — create
for (let i = 1; i <= 3; i++) add(`TS-04_TC-${String(i).padStart(2,'0')}`, 'BLOCKED', R_SEED);
// TA-01 (2) — cart only, DOM unverified
add('TA-01_TC-01', 'BLOCKED', R_DOM);
add('TA-01_TC-02', 'BLOCKED', R_DOM);
// TA-02 (2) — TC01 cart(DOM), TC02 seed+cancel
add('TA-02_TC-01', 'BLOCKED', R_DOM);
add('TA-02_TC-02', 'BLOCKED', R_SEED);
// TA-03 (2) — seed→OS003 (bug)
add('TA-03_TC-01', 'BLOCKED', R_BUG_CANCEL);
add('TA-03_TC-02', 'BLOCKED', R_BUG_CANCEL);
// TA-04 (1) — PASSED (read-only)
add('TA-04_TC-01', 'PASSED', '', 'test-results/steps/TA-04_TC-01.png');
// TA-05 (2) — seed (bug)
add('TA-05_TC-01', 'BLOCKED', R_BUG_SEARCH);
add('TA-05_TC-02', 'BLOCKED', R_BUG_SEARCH);
// TA-06 (1) — seed + non-PIC account
add('TA-06_TC-01', 'BLOCKED', R_PIC);

const out = path.join(AUTO, 'test-results', 'order-management-records.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
const by = rows.reduce((a, r) => ((a[r.testResult] = (a[r.testResult] || 0) + 1), a), {});
console.log('✅ wrote', out, '·', rows.length, 'TCs ·', JSON.stringify(by));
