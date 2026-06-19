import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Execution Reporter — ชั้น CAPTURE ของขั้น Execute
 * เก็บผลต่อ scenario (map จาก Scenario ID ในชื่อ test) → เขียน:
 *   - test-results/results.json    (machine-readable, ให้ gen-bug-cards ใช้ต่อ)
 *   - test-results/run-summary.md  (อ่านง่าย, เอาไปเติม Passed/Failed/Actual ใน e2e-execution.xlsx ได้)
 */
type Step = { tc: string; title: string; failed: boolean };
type Row = {
  scenarioId: string;
  title: string;
  status: string;
  durationMs: number;
  error?: string;
  attachments: { name: string; path: string }[];
  steps: Step[];
  file: string;
  line: number;
};

const SCENARIO_RE = /^([A-Z][A-Z0-9]+_[A-Z0-9]+_[A-Z0-9]+)/; // เช่น HRMS_LOGIN_TS01
const FAIL = ['failed', 'timedOut', 'interrupted'];
const strip = (s: string) => s.replace(/\[[0-9;]*m/g, '');

export default class ExecutionReporter implements Reporter {
  private rows: Row[] = [];
  private outDir = path.join(process.cwd(), 'test-results');

  onTestEnd(test: TestCase, result: TestResult) {
    const m = test.title.match(SCENARIO_RE);
    this.rows.push({
      scenarioId: m ? m[1] : '(unmapped)',
      title: test.title,
      status: result.status,
      durationMs: result.duration,
      error: result.error?.message
        ? strip(result.error.message).split('\n').slice(0, 8).join('\n').trim()
        : undefined,
      attachments: (result.attachments || [])
        .filter((a) => a.path)
        .map((a) => ({ name: a.name, path: path.relative(process.cwd(), a.path!) })),
      steps: (result.steps || [])
        .filter((s) => s.category === 'test.step')
        .map((s) => {
          const [tc, ...rest] = s.title.split(' — ');
          return { tc: tc.trim(), title: rest.join(' — ').trim(), failed: !!s.error };
        }),
      file: path.relative(process.cwd(), test.location.file),
      line: test.location.line,
    });
  }

  onEnd(result: FullResult) {
    fs.mkdirSync(this.outDir, { recursive: true });
    this.rows.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId));

    const passed = this.rows.filter((r) => r.status === 'passed').length;
    const failed = this.rows.filter((r) => FAIL.includes(r.status));
    const skipped = this.rows.filter((r) => r.status === 'skipped').length;

    fs.writeFileSync(
      path.join(this.outDir, 'results.json'),
      JSON.stringify(
        {
          finishedAt: new Date().toISOString(),
          overall: result.status,
          total: this.rows.length,
          passed,
          failed: failed.length,
          skipped,
          results: this.rows,
        },
        null,
        2,
      ),
    );

    const icon = (s: string) => (s === 'passed' ? '✅' : s === 'skipped' ? '⏭️' : '❌');
    let md = `# Test Execution Summary\n\n`;
    md += `รัน: ${new Date().toLocaleString()}  ·  Overall: **${result.status}**\n\n`;
    md += `| Scenario | สถานะ | เวลา (s) | หมายเหตุ |\n|---|---|---|---|\n`;
    for (const r of this.rows) {
      const note = r.error ? r.error.split('\n')[0].slice(0, 80) : '';
      md += `| ${r.scenarioId} | ${icon(r.status)} ${r.status} | ${(r.durationMs / 1000).toFixed(1)} | ${note} |\n`;
    }
    md += `\n**สรุป:** ${this.rows.length} test · ✅ ${passed} · ❌ ${failed.length} · ⏭️ ${skipped}\n`;
    if (failed.length) {
      md += `\n## ❌ Failures (ต้องเปิดการ์ด Dev)\n`;
      for (const r of failed) md += `- **${r.scenarioId}** — ${r.error?.split('\n')[0] || 'failed'}\n`;
      md += `\n→ รัน \`npm run cards\` เพื่อสร้าง bug card draft จาก failure เหล่านี้\n`;
    }
    fs.writeFileSync(path.join(this.outDir, 'run-summary.md'), md);
    console.log(
      `\n[execution-reporter] → test-results/run-summary.md + results.json  (✅ ${passed} · ❌ ${failed.length} · ⏭️ ${skipped})`,
    );
  }
}
