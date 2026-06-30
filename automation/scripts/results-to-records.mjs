// results-to-records — map Playwright JSON report → per-TC Lark records.json
// per-TC status: step error → FAILED · steps before → PASSED · steps after (didn't run) → BLOCKED
// usage: node scripts/results-to-records.mjs [test-results/appointment-results.json]
import fs from 'fs';
import path from 'path';

const REPORT = process.argv[2] || 'test-results/appointment-results.json';
const OUT = 'test-results/appointment-records.json';
const FEATURE = 'Customer Appointment';

// canonical TC list per scenario (CSV — 18 TCs) → drives BLOCKED detection
const SCN_TCS = {
  'TS-01': ['TS-01_TC-01', 'TS-01_TC-02'],
  'TS-02': ['TS-02_TC-01', 'TS-02_TC-02', 'TS-02_TC-03'],
  'TS-03': ['TS-03_TC-01', 'TS-03_TC-02'],
  'TS-04': ['TS-04_TC-01', 'TS-04_TC-02'],
  'TS-05': ['TS-05_TC-01', 'TS-05_TC-02'],
  'TA-01': ['TA-01_TC-01', 'TA-01_TC-02', 'TA-01_TC-03', 'TA-01_TC-04'],
  'TA-02': ['TA-02_TC-01', 'TA-02_TC-02'],
  'TA-03': ['TA-03_TC-01'],
};

const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

// flatten specs from nested suites
const specs = [];
(function walk(s) { for (const su of s.suites || []) walk(su); for (const sp of s.specs || []) specs.push(sp); })({ suites: report.suites });

const clean = (e) => (e || '').replace(/\x1b?\[[0-9;]*m/g,'').replace(/\s+/g,' ').replace(/\s*expect\(received\).*$/i,'').replace(/\s*\|\s*Fetch error:\s*\$r.*$/i,' | UI write path failed (404/CORS)').replace(/^Error:\s*/i,'').trim().slice(0,300);
const scnOf = (title) => (title.match(/^(T[SA]-\d+)/) || [])[1];
const tcOf = (title) => (title.match(/(T[SA]-\d+_TC-\d+)/) || [])[1];

const records = [];
for (const sp of specs) {
  const scn = scnOf(sp.title);
  if (!scn || !SCN_TCS[scn]) continue;
  const test = sp.tests?.[0];
  const result = test?.results?.[test.results.length - 1]; // last attempt
  const videoAtt = (result?.attachments || []).find((a) => a.name === 'video');
  const video = videoAtt?.path && fs.existsSync(videoAtt.path) ? videoAtt.path : null;

  // map step title → {status, error}
  const stepStatus = {};
  let firstFailTc = null;
  for (const st of result?.steps || []) {
    const tc = tcOf(st.title || '');
    if (!tc) continue;
    if (st.error) { stepStatus[tc] = { status: 'FAILED', error: clean(st.error.message) }; if (!firstFailTc) firstFailTc = tc; }
    else stepStatus[tc] = { status: 'PASSED' };
  }
  const scenarioSkipped = result?.status === 'skipped' || !result;

  let blocked = false;
  for (const tc of SCN_TCS[scn]) {
    let status, remark = '';
    if (scenarioSkipped) { status = 'BLOCKED'; remark = 'scenario skipped (precondition/login not met)'; }
    else if (stepStatus[tc]?.status === 'FAILED') { status = 'FAILED'; remark = stepStatus[tc].error; blocked = true; }
    else if (blocked || !stepStatus[tc]) { status = 'BLOCKED'; remark = firstFailTc ? `blocked by failure of ${firstFailTc}` : 'step did not run'; }
    else status = 'PASSED';

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

fs.writeFileSync(OUT, JSON.stringify(records, null, 2));
const tally = records.reduce((m, r) => ((m[r.testResult] = (m[r.testResult] || 0) + 1), m), {});
console.log(`wrote ${records.length} records → ${OUT}`);
console.log('tally:', JSON.stringify(tally));
for (const r of records) console.log(`  ${r.testcaseNo.padEnd(12)} ${r.testResult.padEnd(8)} ${r.remark ? '· ' + r.remark.slice(0, 80) : ''}`);
