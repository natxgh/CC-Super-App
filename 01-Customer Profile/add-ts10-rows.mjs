// add-ts10-rows.mjs — append TS-10 (3 TCs) to customer-profile-testcases.xlsx
// รัน: node add-ts10-rows.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ExcelJS = require('/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation/node_modules/exceljs');
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX = path.join(__dirname, 'customer-profile-testcases.xlsx');

const ARRANGE = `Login User: ketwadee
Role & Permission: All Permission - Contact Management
---------------------------------------------------
Customer Data in System:
≥1 Customer record exists (e.g. ana Yukinae / any seeded customer)`;

const BC = `1. Customer List Toggle View (Table / Grid)
2. Default view = Table View (☰ icon active)
3. Grid View icon (⊞) switches to Card layout
4. Table View icon (☰) switches back to Table layout`;

const TS10_TCS = [
  {
    sn:       'TS-10_TS-10_TC-01-CC Super App-Customer Profile',
    scenario: 'TS-10',
    scenName: 'User can view Customer List in Table View (default) and switch to Grid View and back',
    tcNo:     'TS-10_TC-01',
    title:    'Navigate to Customer List — Table View is displayed by default',
    category: 'POSITIVE',
    steps:    'Login User: ketwadee\nand Navigate to "Customer List Page"',
    expected: 'Table View is active by default:\n- Icon ☰ (Table View) is highlighted blue\n- Icon ⊞ (Grid View) is NOT highlighted\n- Table is displayed with columns: ลูกค้า / ติดต่อ / ผลิตภัณฑ์ / บริการ / ประเภท / เปิดใช้งาน\n- Action buttons per row: โทร / อีเมล / แชท / ดู / แก้ไข / ลบ',
  },
  {
    sn:       'TS-10_TS-10_TC-02-CC Super App-Customer Profile',
    scenario: 'TS-10',
    scenName: 'User can view Customer List in Table View (default) and switch to Grid View and back',
    tcNo:     'TS-10_TC-02',
    title:    'Click Grid View icon (⊞) — list switches to Grid/Card layout',
    category: 'POSITIVE',
    steps:    'Click the Grid View icon (⊞) at the top-left toggle area',
    expected: 'Grid View is active:\n- Icon ⊞ (Grid View) is highlighted blue\n- Icon ☰ (Table View) is NOT highlighted\n- Page displays Card layout (no table rows)\n- Each card shows: Profile photo · Customer name · Type badge (โกลด์/แพลทินัม/บรอนซ์/ซิลเวอร์) · Active status dot · Email · Phone · จำนวน ผลิตภัณฑ์ · จำนวน บริการ · Action buttons (โทร/อีเมล/แชท/ดู/แก้ไข/ลบ)',
  },
  {
    sn:       'TS-10_TS-10_TC-03-CC Super App-Customer Profile',
    scenario: 'TS-10',
    scenName: 'User can view Customer List in Table View (default) and switch to Grid View and back',
    tcNo:     'TS-10_TC-03',
    title:    'Click Table View icon (☰) — list switches back to Table layout',
    category: 'POSITIVE',
    steps:    'Click the Table View icon (☰) at the top-left toggle area',
    expected: 'Table View is restored:\n- Icon ☰ (Table View) is highlighted blue\n- Icon ⊞ (Grid View) is NOT highlighted\n- Table is displayed with columns: ลูกค้า / ติดต่อ / ผลิตภัณฑ์ / บริการ / ประเภท / เปิดใช้งาน\n- Card layout is no longer visible',
  },
];

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(XLSX);
const ws = wb.worksheets[0];

for (const tc of TS10_TCS) {
  ws.addRow([
    tc.sn,           // col1  SN
    'AICC',          // col2  Project Name
    'CC Super App',  // col3  Product
    'Customer Profile', // col4 Feature
    tc.scenario,     // col5  Scenario No.
    tc.scenName,     // col6  Scenario Name
    BC,              // col7  Business Conditions
    ARRANGE,         // col8  Arrange
    tc.tcNo,         // col9  TC No.
    tc.title,        // col10 Case Title Name
    tc.category,     // col11 Test category
    'SYSTEMTEST',    // col12 Test Type
    tc.steps,        // col13 Test Steps
    tc.expected,     // col14 Expected Result
    '',              // col15 UI Design
    '',              // col16 Test Result
    '',              // col17 Result Note
    '',              // col18 Test Date
    '',              // col19 Test By
    '',              // col20 Remark
    '',              // col21 RelateDefectURL
    '',              // col22 Testing Round
    '',              // col23 Defect Types
  ]);
}

await wb.xlsx.writeFile(XLSX);
console.log(`✅ Added ${TS10_TCS.length} TS-10 rows → ${XLSX} (total rows now: ${ws.rowCount})`);
