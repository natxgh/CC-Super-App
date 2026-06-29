// product-inventory-results-to-records — map Playwright JSON report → per-TC Lark records.json
// status: step error → FAILED · steps before error → PASSED · steps after → BLOCKED
//         no test.fixme/skip in this suite (all 20 scenarios run) → no TODO rows
// usage: node scripts/product-inventory-results-to-records.mjs [test-results/product-inventory-results.json]
import fs from 'fs';

const REPORT = process.argv[2] || 'test-results/product-inventory-results.json';
const OUT = 'test-results/product-inventory-records.json';
const FEATURE = 'Product & Inventory Management';

const SCN_TCS = {
  'TS-01': ['TS-01_TC-01', 'TS-01_TC-02', 'TS-01_TC-03', 'TS-01_TC-04'],
  'TS-02': ['TS-02_TC-01'],
  'TS-03': ['TS-03_TC-01', 'TS-03_TC-02'],
  'TS-04': ['TS-04_TC-01', 'TS-04_TC-02'],
  'TS-05': ['TS-05_TC-01', 'TS-05_TC-02', 'TS-05_TC-03'],
  'TS-06': ['TS-06_TC-01', 'TS-06_TC-02', 'TS-06_TC-03'],
  'TS-07': ['TS-07_TC-01', 'TS-07_TC-02', 'TS-07_TC-03', 'TS-07_TC-04'],
  'TS-08': ['TS-08_TC-01'],
  'TA-01': ['TA-01_TC-01'],
  'TA-02': ['TA-02_TC-01'],
  'TA-03': ['TA-03_TC-01'],
  'TA-04': ['TA-04_TC-01'],
  'TA-05': ['TA-05_TC-01'],
  'TA-06': ['TA-06_TC-01'],
  'TA-07': ['TA-07_TC-01'],
  'TA-08': ['TA-08_TC-01'],
  'TA-09': ['TA-09_TC-01'],
  'TA-10': ['TA-10_TC-01'],
  'TA-11': ['TA-11_TC-01'],
  'TA-12': ['TA-12_TC-01'],
};

const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const specs = [];
(function walk(s) { for (const su of s.suites || []) walk(su); for (const sp of s.specs || []) specs.push(sp); })({ suites: report.suites });

const clean = (e) => (e || '').replace(/\x1b?\[[0-9;]*m/g, '').replace(/\s+/g, ' ').replace(/\s*expect\(.*$/i, '').replace(/^Error:\s*/i, '').trim().slice(0, 280);
const scnOf = (t) => (t.match(/^(T[SA]-\d+)/) || [])[1];
const tcOf = (t) => (t.match(/(T[SA]-\d+_TC-\d+)/) || [])[1];

const records = [];
for (const sp of specs) {
  const scn = scnOf(sp.title);
  if (!scn || !SCN_TCS[scn]) continue;
  const t = sp.tests?.[0];
  const result = t?.results?.[t.results.length - 1]; // last attempt (after retries)
  const videoAtt = (result?.attachments || []).find((a) => a.name === 'video');
  const video = videoAtt?.path && fs.existsSync(videoAtt.path) ? videoAtt.path : null;

  const stepStatus = {};
  let firstFailTc = null;
  for (const st of result?.steps || []) {
    const tc = tcOf(st.title || '');
    if (!tc) continue;
    if (st.error) {
      stepStatus[tc] = { status: 'FAILED', error: clean(st.error.message) };
      if (!firstFailTc) firstFailTc = tc;
    } else {
      stepStatus[tc] = stepStatus[tc] || { status: 'PASSED' }; // don't overwrite FAILED
    }
  }

  const scenarioSkipped = result?.status === 'skipped' || !result;
  let blocked = false;
  for (const tc of SCN_TCS[scn]) {
    let status, remark = '';
    if (scenarioSkipped) {
      status = 'BLOCKED'; remark = 'scenario skipped (precondition not met)';
    } else if (stepStatus[tc]?.status === 'FAILED') {
      status = 'FAILED'; remark = stepStatus[tc].error; blocked = true;
    } else if (blocked || !stepStatus[tc]) {
      status = 'BLOCKED'; remark = firstFailTc ? `blocked by failure of ${firstFailTc}` : 'step did not execute';
    } else {
      status = 'PASSED';
    }

    const screenshot = `test-results/steps/${tc}.png`;
    records.push({
      testcaseNo: tc,
      feature: FEATURE,
      testResult: status,
      remark: status === 'PASSED' ? '' : remark,
      testDate: today,
      testBy: true,
      videoFile: video || undefined,
      evidenceFile: fs.existsSync(screenshot) ? screenshot : undefined,
    });
  }
}

fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(records, null, 2));

const tally = records.reduce((m, r) => ((m[r.testResult] = (m[r.testResult] || 0) + 1), m), {});
console.log(`wrote ${records.length} records → ${OUT}`);
console.log('tally:', JSON.stringify(tally));
for (const r of records) {
  const icon = r.testResult === 'PASSED' ? '✅' : r.testResult === 'FAILED' ? '❌' : r.testResult === 'BLOCKED' ? '🚧' : '⏸';
  const vid = r.videoFile ? ' 🎬' : '';
  console.log(`  ${icon} ${r.testcaseNo.padEnd(13)} ${r.testResult.padEnd(8)}${vid}${r.remark ? ' · ' + r.remark.slice(0, 80) : ''}`);
}
