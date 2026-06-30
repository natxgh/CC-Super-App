// ps-results-to-records — map Playwright JSON report → per-TC records.json (Product Stock)
// status: step error → FAILED · ran ok → PASSED · test.skip/fixme → TODO · not reached → BLOCKED
// usage: node scripts/ps-results-to-records.mjs [test-results/product-stock-results.json]
import fs from 'fs';

const REPORT = process.argv[2] || 'test-results/product-stock-results.json';
const OUT = 'test-results/product-stock-records.json';
const FEATURE = 'Product Stock Management';

// canonical TC list per scenario (from design xlsx — 37 TCs)
const SCN_TCS = {
  'TS-01': ['TS-01_TC-01', 'TS-01_TC-02', 'TS-01_TC-03'],
  'TS-02': ['TS-02_TC-01'],
  'TS-03': ['TS-03_TC-01'],
  'TS-04': ['TS-04_TC-01', 'TS-04_TC-02', 'TS-04_TC-03', 'TS-04_TC-04', 'TS-04_TC-05'],
  'TS-05': ['TS-05_TC-01', 'TS-05_TC-02', 'TS-05_TC-03'],
  'TS-06': ['TS-06_TC-01', 'TS-06_TC-02', 'TS-06_TC-03'],
  'TS-07': ['TS-07_TC-01'],
  'TS-08': ['TS-08_TC-01', 'TS-08_TC-02'],
  'TS-09': ['TS-09_TC-01', 'TS-09_TC-02'],
  'TS-10': ['TS-10_TC-01'],
  'TS-11': ['TS-11_TC-01', 'TS-11_TC-02'],
  'TA-01': ['TA-01_TC-01'],
  'TA-02': ['TA-02_TC-01', 'TA-02_TC-02', 'TA-02_TC-03'],
  'TA-03': ['TA-03_TC-01'],
  'TA-04': ['TA-04_TC-01'],
  'TA-05': ['TA-05_TC-01'],
  'TA-06': ['TA-06_TC-01'],
  'TA-07': ['TA-07_TC-01', 'TA-07_TC-02'],
  'TA-08': ['TA-08_TC-01'],
  'TA-09': ['TA-09_TC-01'],
  'UI-01': ['UI-01_TC-01'],
};

const TODO_REASON = {
  'TS-01_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TS-01_TC-02': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TS-01_TC-03': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TS-02_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TS-03_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TS-04_TC-01': 'TODO: stock qty is Order/system-driven; cannot arrange exactly qty=6 via UI.',
  'TS-04_TC-02': 'TODO: stock qty is Order/system-driven; cannot arrange exactly qty=5 via UI.',
  'TS-04_TC-03': 'TODO: stock qty is Order/system-driven; cannot arrange exactly qty=4 via UI.',
  'TS-04_TC-04': 'TODO: stock qty is Order/system-driven; cannot arrange exactly qty=1 via UI.',
  'TS-04_TC-05': 'TODO: stock qty is Order/system-driven; cannot arrange exactly qty=0 via UI.',
  'TS-05_TC-01': 'TODO: actor=system (auto qty In6→Low5); no UI action to trigger.',
  'TS-05_TC-03': 'TODO: needs a real Low-Stock notification event (realtime/system).',
  'TS-06_TC-01': 'TODO: actor=system (auto qty Low1→Out0); no UI action to trigger.',
  'TS-06_TC-03': 'TODO: restock sets qty via system/inventory adjustment; not a verified in-scope UI action.',
  'TS-08_TC-02': 'TODO: notification-type filter — needs existing Low/Out notifications on staging.',
  'TS-09_TC-01': 'TODO: "Add Product Stock" button absent in staging — FE not yet deployed.',
  'TS-09_TC-02': 'TODO: needs separate Admin account (env has one account: ketwadee).',
  'TS-10_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TS-11_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TS-11_TC-02': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-01_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-02_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-02_TC-02': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-02_TC-03': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-03_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-04_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-05_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-06_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-07_TC-01': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-07_TC-02': 'TODO: "Add Product Stock" button not in staging v0.27.7 — waiting for FE deploy.',
  'TA-08_TC-01': 'TODO: needs separate Agent account (env has one account: ketwadee, authorized).',
  'TA-09_TC-01': 'TODO/known bug "Research Stock Fail": cross-feature Order-Pick zero-stock; bug card pending.',
  'UI-01_TC-01': 'TODO: actor=system (auto qty Low3→Low2); cannot trigger via UI.',
};

const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const specs = [];
(function walk(s) { for (const su of s.suites || []) walk(su); for (const sp of s.specs || []) specs.push(sp); })({ suites: report.suites });

const clean = (e) => (e || '').replace(/\x1b?\[[0-9;]*m/g, '').replace(/\s+/g, ' ').replace(/\s*expect\(.*$/i, '').replace(/^Error:\s*/i, '').trim().slice(0, 280);
const scnOf = (t) => (t.match(/^(T[SA]-\d+|UI-\d+)/) || [])[1];
const tcOf = (t) => (t.match(/(T[SA]-\d+_TC-\d+|UI-\d+_TC-\d+)/) || [])[1];

const records = [];
const seen = new Set();

for (const sp of specs) {
  const scn = scnOf(sp.title);
  if (!scn || !SCN_TCS[scn]) continue;
  const t = sp.tests?.[0];
  const result = t?.results?.[t.results.length - 1];
  const videoAtt = (result?.attachments || []).find((a) => a.name === 'video');
  const video = videoAtt?.path && fs.existsSync(videoAtt.path) ? videoAtt.path : null;

  const stepStatus = {};
  let firstFailTc = null;
  for (const st of result?.steps || []) {
    const tc = tcOf(st.title || '');
    if (!tc) continue;
    if (st.error) {
      const msg = st.error.message || '';
      // test.skip() throws a special error — classify as TODO not FAILED
      const isSkip = /^Test is skipped/i.test(msg) || /playwright.*skip/i.test(msg);
      if (isSkip) {
        stepStatus[tc] = { status: 'TODO', error: clean(msg).replace(/^Test is skipped:\s*/i, '') };
      } else {
        stepStatus[tc] = { status: 'FAILED', error: clean(msg) };
        if (!firstFailTc) firstFailTc = tc;
      }
    } else {
      stepStatus[tc] = { status: 'PASSED' };
    }
  }
  const testSkipped = result?.status === 'skipped' || t?.status === 'skipped' || !result;

  let blocked = false;
  for (const tc of SCN_TCS[scn]) {
    let status, remark = '';
    const ran = stepStatus[tc];
    if (ran?.status === 'FAILED') { status = 'FAILED'; remark = ran.error; blocked = true; }
    else if (ran?.status === 'TODO') { status = 'TODO'; remark = ran.error; }
    else if (ran?.status === 'PASSED') { status = 'PASSED'; }
    else if (TODO_REASON[tc]) { status = 'TODO'; remark = TODO_REASON[tc]; }
    else if (blocked) { status = 'BLOCKED'; remark = `blocked by failure in ${firstFailTc}`; }
    else if (testSkipped) { status = 'TODO'; remark = 'scenario skipped (precondition not met).'; }
    else { status = 'BLOCKED'; remark = 'step did not run'; }

    const screenshot = `test-results/steps/${tc}.png`;
    records.push({
      testcaseNo: tc,
      feature: FEATURE,
      testResult: status,
      remark: status === 'PASSED' ? '' : remark,
      testDate: today,
      testBy: true,
      videoFile: status === 'TODO' ? undefined : (video || undefined),
      evidenceFile: fs.existsSync(screenshot) ? screenshot : undefined,
    });
    seen.add(tc);
  }
}

// any TC absent from run → TODO or BLOCKED
for (const [scn, tcs] of Object.entries(SCN_TCS)) {
  for (const tc of tcs) {
    if (seen.has(tc)) continue;
    records.push({
      testcaseNo: tc, feature: FEATURE,
      testResult: TODO_REASON[tc] ? 'TODO' : 'BLOCKED',
      remark: TODO_REASON[tc] || 'did not run',
      testDate: today, testBy: true,
    });
  }
}

records.sort((a, b) => a.testcaseNo.localeCompare(b.testcaseNo, undefined, { numeric: true }));
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(records, null, 2));
const tally = records.reduce((m, r) => ((m[r.testResult] = (m[r.testResult] || 0) + 1), m), {});
console.log(`wrote ${records.length} records → ${OUT}`);
console.log('tally:', JSON.stringify(tally));
for (const r of records) console.log(`  ${r.testcaseNo.padEnd(14)} ${r.testResult.padEnd(8)} ${r.remark ? '· ' + r.remark.slice(0, 80) : ''}`);
