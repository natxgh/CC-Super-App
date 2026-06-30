// case-results-to-records — map Playwright JSON report → per-TC Lark records.json (Case & Ticket Management)
// per-TC status: step error → FAILED · steps before → PASSED · steps after / missing → BLOCKED
// STUB scenarios (write-side flow not yet automated, spec header FIXME) → forced BLOCKED with reason
// usage: node scripts/case-results-to-records.mjs [test-results/case-results.json]
import fs from 'fs';

const REPORT = process.argv[2] || 'test-results/case-results.json';
const OUT = 'test-results/case-ticket-management-records.json';
const FEATURE = 'Case and Ticket Management';

// canonical TC list per scenario (47 TC) → drives BLOCKED detection
const SCN_TCS = {
  'TS-01': Array.from({ length: 14 }, (_, i) => `TS-01_TC-${String(i + 1).padStart(2, '0')}`),
  'TS-02': ['TS-02_TC-01', 'TS-02_TC-02', 'TS-02_TC-03', 'TS-02_TC-04', 'TS-02_TC-05', 'TS-02_TC-06'],
  'TS-03': ['TS-03_TC-01', 'TS-03_TC-02', 'TS-03_TC-03'],
  'TS-04': ['TS-04_TC-01', 'TS-04_TC-02', 'TS-04_TC-03'],
  'TA-01': ['TA-01_TC-01', 'TA-01_TC-02'],
  'TA-02': ['TA-02_TC-01', 'TA-02_TC-02', 'TA-02_TC-03'],
  'TA-03': ['TA-03_TC-01', 'TA-03_TC-02', 'TA-03_TC-03'],
  'TA-04': ['TA-04_TC-01', 'TA-04_TC-02'],
  'TA-05': ['TA-05_TC-01'],
  'TA-06': ['TA-06_TC-01', 'TA-06_TC-02'],
  'TA-07': ['TA-07_TC-01', 'TA-07_TC-02'],
  'TA-08': ['TA-08_TC-01', 'TA-08_TC-02'],
  'TA-09': ['TA-09_TC-01'],
  'TA-10': ['TA-10_TC-01', 'TA-10_TC-02'],
  'TA-11': ['TA-11_TC-01'],
};

// stub scenarios: spec steps only call shot() (no real assertion) — write-side flow not yet automated.
// per spec header (case-ticket-management.spec.ts) these are FIXME pending DOM probe / write side-effects.
const STUB = {
  'TS-03': 'BLOCKED — write-side update flow not automated (stub step); FIXME pending live DOM probe of edit/comment/attach controls.',
  'TS-04': 'BLOCKED — draft/notification flow not automated (stub step); FIXME pending Save-As-Draft + realtime notification probe.',
  'TA-01': 'BLOCKED — submit-validation flow not automated (stub step); FIXME pending Confirm-modal/validation DOM probe.',
  'TA-03': 'BLOCKED — attachment rule checks not automated (stub step); FIXME pending file-upload channel probe.',
  'TA-04': 'BLOCKED — create regression not automated (stub step); blocked by CreateCase API bug (versions NOT NULL / BFF 500).',
  'TA-06': 'BLOCKED — status skip/reverse not automated (stub step); FIXME pending lifecycle advance via Assign Staff (no Kanban drag).',
  'TA-07': 'BLOCKED — close-condition checks not automated (stub step); FIXME pending close-approval flow probe.',
  'TA-11': 'BLOCKED — edit-after-close not automated (stub step); FIXME pending seeded Completed case (CreateCase API bug).',
};

const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const specs = [];
(function walk(s) { for (const su of s.suites || []) walk(su); for (const sp of s.specs || []) specs.push(sp); })({ suites: report.suites });

const clean = (e) => (e || '').replace(/\x1b?\[[0-9;]*m/g, '').replace(/\s+/g, ' ').replace(/\s*expect\(received\).*$/i, '').replace(/^Error:\s*/i, '').trim().slice(0, 300);
const scnOf = (t) => (t.match(/^(T[SA]-\d+)/) || [])[1];
const tcOf = (t) => (t.match(/(T[SA]-\d+_TC-\d+)/) || [])[1];

const records = [];
for (const scn of Object.keys(SCN_TCS)) {
  const sp = specs.find((s) => scnOf(s.title) === scn);
  const test = sp?.tests?.[0];
  const result = test?.results?.[test.results.length - 1];
  const videoAtt = (result?.attachments || []).find((a) => a.name === 'video');
  const video = videoAtt?.path && fs.existsSync(videoAtt.path) ? videoAtt.path : null;

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
    if (STUB[scn]) { status = 'BLOCKED'; remark = STUB[scn]; }
    else if (scenarioSkipped) { status = 'BLOCKED'; remark = 'scenario skipped (precondition/login not met)'; }
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
for (const r of records) console.log(`  ${r.testcaseNo.padEnd(13)} ${r.testResult.padEnd(8)} ${r.videoFile ? '🎬' : '  '} ${r.remark ? '· ' + r.remark.slice(0, 80) : ''}`);
