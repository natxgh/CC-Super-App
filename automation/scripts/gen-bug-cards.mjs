// gen-bug-cards.mjs (CC Super App / customer-appointment)
// อ่าน BUG-*.md ที่เขียนไว้ตอน probe → ออก Meegle bug-card draft (.md) พร้อมวาง/กรอกเข้า Meegle
// ต่างจากเวอร์ชัน qa-ai-pilot: ที่นั่น input = test failures (results.json); ที่นี่ input = BUG-*.md
//   เพราะ bug ชุดนี้เจอจากการ probe DOM/network (เทสเป็น fixme ไม่ใช่ fail)
// รัน: node scripts/gen-bug-cards.mjs            (หรือ `npm run cards`)
// format เป้าหมาย: examples/meegle-bug-template.md + memory meegle-bug-issue-template
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
// แหล่ง BUG-*.md (เพิ่ม feature อื่นได้ในอนาคต)
const BUG_DIRS = [path.join(ROOT, 'tests', 'customer-appointment')];
const OUT = path.join(ROOT, 'test-results', 'bug-cards');

// ---- ค่าคงที่ของชุดนี้ (เปลี่ยนเมื่อย้าย feature/ระบบ) ----
const PRODUCT = 'CC Super App';
const MODULE = 'Customer Appointment';
const ENV_TAG = 'QA';
const URL = 'https://skyai-cloud-cc-qa.one-sky.ai/cc/contacts-list';
const LINKED_FUNCTION = 'QA Testing'; // suggest — ยังต้องเลือกยืนยันใน UI
const PRIO_MAP = { Critical: 'High', Blocker: 'High', High: 'High', Medium: 'Medium', Low: 'Low' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const t = new Date();
const dateStr = `${String(t.getDate()).padStart(2, '0')} ${MONTHS[t.getMonth()]} ${t.getFullYear()}`;

/** parse BUG-*.md (โครงที่ probe เขียนไว้: # BUG DRAFT — title / - **k**: v / ## sections) */
function parseBug(md) {
  const lines = md.split('\n');
  const title = (lines.find((l) => /^#\s+BUG DRAFT/i.test(l)) || '')
    .replace(/^#\s+BUG DRAFT\s*[—-]\s*/i, '').trim();

  const meta = {};
  for (const l of lines) {
    const m = l.match(/^-\s+\*\*(\w+)\*\*:\s*(.+)$/);
    if (m) meta[m[1].toLowerCase()] = m[2].trim();
  }

  // sections by "## heading"
  const sec = {};
  let cur = null;
  for (const l of lines) {
    const h = l.match(/^##\s+(.+)$/);
    if (h) {
      const k = h[1].toLowerCase();
      cur = k.startsWith('steps') ? 'steps'
        : k.startsWith('expected') ? 'expected'
        : k.startsWith('actual') ? 'actual'
        : k.startsWith('root cause') ? 'rootcause'
        : k.startsWith('suggested fix') ? 'fix'
        : (k.startsWith('หมายเหตุ') || k.startsWith('note')) ? 'note'
        : k.startsWith('impact') ? 'impact' : null;
      if (cur) sec[cur] = [];
      continue;
    }
    if (cur && sec[cur]) sec[cur].push(l);
  }
  const txt = (k) => (sec[k] || []).join('\n').trim();

  // Severity "High / Blocker — ..." → "High"
  const sevRaw = (meta.severity || 'High').split(/[—-]/)[0].split('/')[0].trim();
  const prio = PRIO_MAP[sevRaw] || 'High';

  // Env "QA — `https://...`" → url
  const envUrl = (meta.env || '').match(/`(https?:\/\/[^`]+)`/)?.[1] || URL;

  return { title, feature: meta.feature || '', account: meta.account || '', sevRaw, prio, envUrl, sec: txt };
}

/** สร้าง bug card draft .md (📋 ฟิลด์ + 📝 Descriptions ตาม template ทีม) */
function toCard(file, b) {
  const name = `[${PRODUCT}][${ENV_TAG}] ${MODULE} - ${b.title}`;
  const fn = b.feature || `${PRODUCT} › ${MODULE}`;

  // label หัวข้อ = **ตัวหนา** (Meegle Descriptions render markdown) — team preference
  const body = `**Date:** ${dateStr}
**Product/Project:** ${PRODUCT}
**Module:** ${MODULE}
**Function:** ${fn}
**Environment:** ${ENV_TAG}
**URL:** ${b.envUrl}
----------------------------------------------------------------------
**Description:** ${b.title} (severity เดิม: ${b.sevRaw})

**Steps to Reproduce**
${b.sec('steps') || '(ดู BUG-*.md ต้นทาง)'}

**Actual Result:**
${b.sec('actual') || '-'}

**Expected Result:**
${b.sec('expected') || '-'}

**Root Cause:**
${b.sec('rootcause') || '-'}

**Suggested Fix:**
${b.sec('fix') || '-'}${b.sec('impact') ? `\n\n**Impact:**\n${b.sec('impact')}` : ''}`;

  return `# Bug Card (draft) — ${path.basename(file)}

> วางลงการ์ด Meegle: ตาราง 📋 → ฟิลด์บนการ์ด · บล็อก 📝 → ช่อง Descriptions

## 📋 Meegle fields
| ฟิลด์ | ค่า |
|---|---|
| **Name** ✱ | ${name} |
| **Priority** ✱ | ${b.prio} |
| **Environment** ✱ | ${ENV_TAG} |
| **Issue type** ✱ | Basic workflow |
| **Reporter** ✱ | (auto = ตัวเอง) |
| **Assignee** ✱ | ⚠️ เลือก Dev/FE ผู้รับผิดชอบ |
| **Linked Function** ✱ | ⚠️ ${LINKED_FUNCTION} (ยืนยันใน UI) |
| **Schedule (Estimate)** ✱ | ⚠️ เลือกวันที่ประเมิน |

## 📝 Descriptions (คัดลอกทั้งบล็อก)
\`\`\`
${body}
\`\`\`

---
_Source: tests/customer-appointment/${path.basename(file)} · gen ${dateStr} · **ตรวจก่อนเปิดการ์ด** · format: meegle-bug-issue-template_
`;
}

// ---- main ----
const bugFiles = [];
for (const dir of BUG_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (/^BUG-.*\.md$/.test(f)) bugFiles.push(path.join(dir, f));
  }
}
if (!bugFiles.length) {
  console.log('ไม่พบ BUG-*.md → ไม่มีการ์ดต้องสร้าง');
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
const index = [];
for (const file of bugFiles) {
  const b = parseBug(fs.readFileSync(file, 'utf8'));
  const slug = path.basename(file).replace(/\.md$/, '');
  fs.writeFileSync(path.join(OUT, `${slug}.md`), toCard(file, b));
  index.push({ source: path.basename(file), name: `[${PRODUCT}][${ENV_TAG}] ${MODULE} - ${b.title}`, priority: b.prio, severity: b.sevRaw });
}
fs.writeFileSync(path.join(OUT, '_index.json'), JSON.stringify(index, null, 2));
console.log(
  `สร้าง ${index.length} bug card draft → test-results/bug-cards/*.md (รูปแบบ Meegle: ฟิลด์ + Descriptions)\n` +
    `→ ตรวจแล้ว "วางเอง" เข้า Meegle (3 ช่อง Assignee/Linked Function/Schedule เลือกเองใน UI)`,
);
for (const c of index) console.log(`  • [${c.priority}] ${c.name}`);
