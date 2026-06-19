// gen-spare-parts-xlsx.mjs — build 1-sheet testcases.xlsx (23 cols) matching Lark Base tblIwUWXkWNLYy4c
// layout: scenario-based · Scenario No. = TS-01/TA-01 · TC No. = TS-01_TC-01
// English version · PO answers applied 2026-06-19
import ExcelJS from '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation/node_modules/exceljs/excel.js';

const OUT = '/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/06-Spare Parts/spare-parts-testcases.xlsx';

// ─── source TCs (from spare-parts-test-design.md) ─────────────────────
const SRC = {
  'SP1-TC01': { cat:'POSITIVE', title:'List view renders all elements',
    arrange:'Logged in, at least 1 spare part exists',
    steps:'Click the List view icon (first icon, top-right)', data:'View mode: List',
    expected:'The Spare Parts page shows rows; each row has: Part Name + thumbnail, Stock badge, Brand, Category, Year, Price, Warranty badge, Belong to Product, and "View" + "Edit" buttons' },
  'SP1-TC03': { cat:'POSITIVE', title:'Table view shows all column headers',
    arrange:'Logged in, at least 1 spare part exists',
    steps:'Click the Table view icon (right-most icon, top-right)', data:'View mode: Table',
    expected:'A compact table with column headers: PART NAME (sortable), STOCK, BRAND, CATEGORY, YEAR (sortable), PRICE (sortable), WARRANTY (sortable), BELONG TO PRODUCT, ACTION (View icon + Edit icon)' },
  'SP2-TC01': { cat:'POSITIVE', title:'Search matching keyword → results found',
    arrange:'Logged in, parts "Battery pack" and "iPhone 16 Pro Battery" are in the list',
    steps:'Type keyword in the Search box → Click "Search"', data:'Battery',
    expected:'Only parts whose name contains "Battery" are shown (>=2: "Battery pack", "iPhone 16 Pro Battery") — no other parts' },
  'SP2-TC02': { cat:'NEGATIVE', title:'Search non-matching keyword → empty state',
    arrange:'Logged in',
    steps:'Type a keyword not present in the system → Click "Search"', data:'ZXQNOTEXIST999',
    expected:'Empty state / 0 results — no spare part appears' },
  'SP3-TC01': { cat:'POSITIVE', title:'Filter Brand match → only that brand',
    arrange:'Logged in, Filters panel open, parts with brand "Apple" exist',
    steps:'Click Brand dropdown → search & select the brand → Click "Search"', data:'Brand: Apple',
    expected:'Only parts with Brand = "Apple" are shown; every displayed record has Brand: Apple' },
  'SP3-TC02': { cat:'POSITIVE', title:'Reset clears filter, restores full list',
    arrange:'Logged in, Brand filter = "Apple" applied',
    steps:'Click "Reset"', data:'-',
    expected:'Filter panel cleared; all brands return (>=10 records)' },
  'SP5-TC01': { cat:'POSITIVE', title:'View Detail popup shows 8 fields + buttons',
    arrange:'Logged in, on the Spare Parts List view, item "Mercedes-Benz OM654.920" exists',
    steps:'Click "View" on the spare part', data:'Mercedes-Benz OM654.920',
    expected:'The "Item Details" popup opens showing: image, Part Name: Mercedes-Benz OM654.920, Stock: Out of Stock (0), Brand: Mercedes Benz, Category: Vehicle Engine, Year: 2026, Price: ฿200,000.00, Warranty: 12 Months, Belong to Product: 2026 Mercedes-Benz GLE 350de Plug-in Hybrid, and Delete / Edit / Close buttons' },
  'SP6-TC01': { cat:'POSITIVE', title:'Add part with all required fields → saved',
    arrange:'Logged in as Warehouse Staff or Admin, Product "2026 Mercedes-Benz GLE 350de Plug-in Hybrid" exists',
    steps:'Fill the Add Spare Part form completely → Click Save',
    data:'Name(TH)=กรองอากาศ Denso · Name(EN)=Denso Air Filter DL-1101 · Category=Vehicle Accessories · Brand=Denso · Year=2026 · Warranty(Days)=365 · Price=2500',
    expected:'Saved successfully; success toast — "Denso Air Filter DL-1101" appears in the list with Price: ฿2,500.00 and Warranty: 12 Months (365 days converts to 12 Months per SP-Q6)' },
  'SP6-TC02': { cat:'NEGATIVE', title:'Add missing required Name(EN) → validation error',
    arrange:'Logged in as Warehouse Staff / Admin',
    steps:'Fill the form completely except "Spare Part Name (EN)" (leave empty) → Click Save',
    data:'Name(EN)=(empty) · other fields complete',
    expected:'Not saved; validation error on field "Spare Part Name (EN)" — error state (red border / message under field)' },
  'SP6-TC03': { cat:'NEGATIVE', title:'Add missing required Price → validation error',
    arrange:'Logged in as Warehouse Staff / Admin',
    steps:'Fill the form completely except "Price" (leave empty) → Click Save',
    data:'Price=(empty) · other fields complete',
    expected:'Not saved; validation error on field "Price" — error state' },
  'SP6-TC04': { cat:'NEGATIVE', title:'Add button hidden for Agent/Staff (RBAC)',
    arrange:'Logged in as porntip (Agent/Staff), org BMA',
    steps:'Open the Spare Parts page', data:'user: porntip · role: Agent/Staff',
    expected:'The "Add" button is NOT visible — intended RBAC behavior; only Warehouse Staff / Admin can Add (SP-Q1)' },
  'SP7-TC01': { cat:'POSITIVE', title:'Upload JPG → accepted',
    arrange:'Logged in, Add/Edit Spare Part form open',
    steps:'Upload an allowed image type in the image upload area',
    data:'engine-filter-photo.jpg (JPG 800×600px, ~250KB)',
    expected:'Accepted; a preview of engine-filter-photo.jpg appears in the image upload area' },
  'SP7-TC02': { cat:'NEGATIVE', title:'Upload wrong type (PDF) → reject',
    arrange:'Logged in, Add/Edit Spare Part form open',
    steps:'Upload a disallowed file type in the image upload area',
    data:'product-spec.pdf',
    expected:'Rejected; error shown (expected "Allowed: JPG, PNG, GIF") — file not attached' },
  'SP7-TC03': { cat:'NEGATIVE', title:'Upload oversized image (>3MB) → reject (BVA)',
    arrange:'Logged in, Add/Edit Spare Part form open',
    steps:'Upload an image over the 3MB size limit',
    data:'engine-large.jpg (JPG, 3.5MB)',
    expected:'Rejected; error shown (expected "Max file size 3MB") — file not attached (SP-Q4)' },
  'SP8-TC01': { cat:'POSITIVE', title:'Edit Price → Update succeeds',
    arrange:'Logged in with Edit permission, "Mercedes-Benz M112" in the list',
    steps:'Click "Edit" → change Price → Click "Update Spare Parts"',
    data:'Mercedes-Benz M112 · Price 100000 → 95000',
    expected:'Saved successfully; success toast — "Mercedes-Benz M112" shows Price: ฿95,000.00 in the list' },
  'SP8-TC02': { cat:'NEGATIVE', title:'Edit clears required Name(TH) → validation error',
    arrange:'Logged in with Edit permission, "Mercedes-Benz M112" in the list',
    steps:'Click "Edit" → clear "Spare Part Name (TH)" → Click "Update Spare Parts"',
    data:'Mercedes-Benz M112 · Name(TH)=(empty)',
    expected:'Not saved; validation error on "Spare Part Name (TH)" — error state; original data unchanged' },
  'SP9-TC01': { cat:'POSITIVE', title:'Delete → Confirm → item removed',
    arrange:'Logged in with Delete permission, "Synthetic Engine Oil 5W-30" in list (no Serial stock, no Active Order)',
    steps:'Click View → scroll down → Click "Delete" → Click "Confirm" in the dialog',
    data:'Synthetic Engine Oil 5W-30',
    expected:'Before Confirm: dialog shows "Delete [part name]?" with Confirm/Cancel — After Confirm: success message; "Synthetic Engine Oil 5W-30" is removed from the list (SP-Q2 confirmed required behavior)' },
  'SP9-TC02': { cat:'NEGATIVE', title:'Delete → Cancel → item stays',
    arrange:'Logged in with Delete permission, "Brake Pads Set" in the list',
    steps:'Click View → scroll down → Click "Delete" → Click "Cancel" in the dialog',
    data:'Brake Pads Set',
    expected:'Dialog closes, "Item Details" popup returns (or all close) — "Brake Pads Set" remains in the list' },
  'SP9-TC03': { cat:'NEGATIVE', title:'Delete part linked to Active Order → blocked',
    arrange:'Logged in with Delete permission, "Mercedes-Benz OM654.920" is linked to an Active Order (and/or has Serial stock)',
    steps:'Click View → Click "Delete"',
    data:'Mercedes-Benz OM654.920 (linked to Active Order)',
    expected:'Blocked — system shows a warning that the part cannot be deleted (linked to an Active Order); the item remains in the list (SP-BC12, SP-Q5)' },
  'SP10-TC01': { cat:'POSITIVE', title:'Stock badge Out of Stock (0)',
    arrange:'Logged in, "Mercedes-Benz OM654.920" has stock = 0',
    steps:'View its Stock badge in List view', data:'Mercedes-Benz OM654.920 (stock=0)',
    expected:'Stock badge shows "Out of Stock (0)" in red/dark-orange' },
  'SP10-TC02': { cat:'POSITIVE', title:'Stock badge Low Stock (5) — upper boundary',
    arrange:'Logged in, "Mercedes-Benz M112" has stock = 5',
    steps:'View its Stock badge in List view', data:'Mercedes-Benz M112 (stock=5)',
    expected:'Stock badge shows "Low Stock (5)" in orange (threshold = 5 per SP-Q3)' },
  'SP10-TC03': { cat:'POSITIVE', title:'Stock badge In Stock (6) — just above threshold',
    arrange:'Logged in, "Battery pack" has stock = 6',
    steps:'View its Stock badge in List view', data:'Battery pack (stock=6)',
    expected:'Stock badge shows "In Stock (6)" (normal) — >5 per SP-Q3' },
  'SP11-TC01': { cat:'POSITIVE', title:'Sort PART NAME ascending/descending',
    arrange:'Logged in, Table view open',
    steps:'Click the PART NAME column header to sort ascending, then again for descending', data:'Column: PART NAME',
    expected:'Rows reorder alphabetically A→Z (ascending), then Z→A (descending) by Part Name' },
  'SP11-TC02': { cat:'POSITIVE', title:'Sort YEAR ascending/descending',
    arrange:'Logged in, Table view open',
    steps:'Click the YEAR column header ascending then descending', data:'Column: YEAR',
    expected:'Rows reorder by Year low→high then high→low' },
  'SP11-TC03': { cat:'POSITIVE', title:'Sort PRICE ascending/descending',
    arrange:'Logged in, Table view open',
    steps:'Click the PRICE column header ascending then descending', data:'Column: PRICE',
    expected:'Rows reorder by Price low→high then high→low' },
  'SP11-TC04': { cat:'POSITIVE', title:'Sort WARRANTY ascending/descending',
    arrange:'Logged in, Table view open',
    steps:'Click the WARRANTY column header ascending then descending', data:'Column: WARRANTY',
    expected:'Rows reorder by Warranty duration short→long then long→short' },
};

// ─── readable Business Condition labels (no internal IDs in output) ────
const BC_LABEL = {
  'SP-BC1' : 'View Modes (List/Card/Table)',
  'SP-BC2' : 'Search by part name',
  'SP-BC3' : 'Filter by Brand',
  'SP-BC4' : 'Filter by Status (Active/Inactive)',
  'SP-BC5' : 'View Detail popup',
  'SP-BC6' : 'Add Spare Part (required fields)',
  'SP-BC7' : 'Image upload (JPG/PNG/GIF ≤3MB)',
  'SP-BC8' : 'Edit Spare Part',
  'SP-BC9' : 'Delete confirmation dialog',
  'SP-BC10': 'Stock Status (Out/Low/In, threshold 5)',
  'SP-BC11': 'Reset clears Filter/Search',
  'SP-BC12': 'Delete guard (no Serial stock & no Active Order)',
  'SP-BC13': 'Sort columns (Name/Year/Price/Warranty)',
};
// render an array of BC ids → "1. label\n2. label" (no IDs shown)
const bcList = (ids) => ids.map((id,i) => `${i+1}. ${BC_LABEL[id] || id}`).join('\n');

// ─── scenarios: TC order (source IDs) ──────────────────────────────────
const SCENARIOS = [
  { no:'TS-01', name:'Search + View Detail of a Spare Part',                 bc:bcList(['SP-BC1','SP-BC2','SP-BC5']),            tcs:['SP1-TC01','SP2-TC01','SP5-TC01'] },
  { no:'TS-02', name:'Filter Brand + Switch View + Stock Status',            bc:bcList(['SP-BC1','SP-BC10','SP-BC3','SP-BC11']), tcs:['SP1-TC03','SP10-TC01','SP3-TC01','SP3-TC02'] },
  { no:'TS-03', name:'Add a new Spare Part (Warehouse Staff / Admin)',       bc:bcList(['SP-BC1','SP-BC7','SP-BC6']),            tcs:['SP1-TC01','SP7-TC01','SP6-TC01'] },
  { no:'TS-04', name:'Edit a Spare Part',                                    bc:bcList(['SP-BC1','SP-BC8']),                    tcs:['SP1-TC01','SP8-TC01'] },
  { no:'TS-05', name:'Delete a Spare Part with confirmation',                bc:bcList(['SP-BC5','SP-BC9']),                    tcs:['SP5-TC01','SP9-TC01'] },
  { no:'TS-06', name:'Sort Table view columns',                             bc:bcList(['SP-BC1','SP-BC13']),                   tcs:['SP1-TC03','SP11-TC03'] },
  { no:'TA-01', name:'Search not found → Reset back to full list',           bc:bcList(['SP-BC1','SP-BC2','SP-BC11']),           tcs:['SP1-TC01','SP2-TC02','SP3-TC02'] },
  { no:'TA-02', name:'Add missing Required Field (Name EN)',                 bc:bcList(['SP-BC6']),                             tcs:['SP6-TC02'] },
  { no:'TA-03', name:'Add missing Required Field (Price)',                   bc:bcList(['SP-BC6']),                             tcs:['SP6-TC03'] },
  { no:'TA-04', name:'Edit clears Required Field → not saved',               bc:bcList(['SP-BC8']),                             tcs:['SP8-TC02'] },
  { no:'TA-05', name:'Delete then Cancel — item stays',                      bc:bcList(['SP-BC5','SP-BC9']),                    tcs:['SP5-TC01','SP9-TC02'] },
  { no:'TA-06', name:'Upload wrong file type → reject',                      bc:bcList(['SP-BC7']),                             tcs:['SP7-TC02'] },
  { no:'TA-07', name:'Upload oversized image (>3MB) → reject',               bc:bcList(['SP-BC7']),                             tcs:['SP7-TC03'] },
  { no:'TA-08', name:'Delete part linked to Active Order → blocked',         bc:bcList(['SP-BC12']),                            tcs:['SP5-TC01','SP9-TC03'] },
  { no:'TA-09', name:'Add button hidden for Agent/Staff (RBAC)',             bc:bcList(['SP-BC6']),                             tcs:['SP6-TC04'] },
];

// ─── columns (23) ───────────────────────────────────────────────────
const COLS = [
  { g:'META',    h:'Project Name' },
  { g:'META',    h:'Product' },
  { g:'META',    h:'Feature' },
  { g:'META',    h:'Scenario No.' },
  { g:'DESIGN',  h:'Scenario Name' },
  { g:'DESIGN',  h:'Business Conditions' },
  { g:'ARRANGE', h:'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)' },
  { g:'META TC', h:'TC No.' },
  { g:'META TC', h:'Case Title Name' },
  { g:'META TC', h:'Test category' },
  { g:'META TC', h:'Test Type' },
  { g:'ACT',     h:'Test Steps' },
  { g:'ACT',     h:'Data Test' },
  { g:'ASSERT',  h:'Expected Result' },
  { g:'ASSET',   h:'UI Design' },
  { g:'RESULT',  h:'Test Result' },
  { g:'RESULT',  h:'Result Note' },
  { g:'RESULT',  h:'Test Date' },
  { g:'RESULT',  h:'Test By' },
  { g:'RESULT',  h:'Remark' },
  { g:'DEFECT',  h:'RelateDefectURL' },
  { g:'DEFECT',  h:'Defect Types' },
  { g:'DEFECT',  h:'Testing Round' },
];

// ─── build rows ─────────────────────────────────────────────────────
const dataRows = [];
for (const sc of SCENARIOS) {
  sc.tcs.forEach((srcId, i) => {
    const s = SRC[srcId];
    if (!s) throw new Error('missing SRC ' + srcId);
    const tcNo = `${sc.no}_TC-${String(i+1).padStart(2,'0')}`;
    dataRows.push({
      'Project Name':'AICC', 'Product':'CC Super App', 'Feature':'Spare Parts & Inventory Management',
      'Scenario No.':sc.no, 'Scenario Name':sc.name, 'Business Conditions':sc.bc,
      'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)':s.arrange,
      'TC No.':tcNo, 'Case Title Name':s.title,
      'Test category':s.cat, 'Test Type':'SYSTEMTEST',
      'Test Steps':s.steps, 'Data Test':s.data, 'Expected Result':s.expected,
      'UI Design':'', 'Test Result':'', 'Result Note':'', 'Test Date':'', 'Test By':'',
      'Remark':'', 'RelateDefectURL':'', 'Defect Types':'', 'Testing Round':'',
    });
  });
}

// ─── write xlsx ─────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('TestScenarios');

ws.addRow(COLS.map(c => c.g));
ws.addRow(COLS.map(c => c.h));
for (const r of dataRows) ws.addRow(COLS.map(c => r[c.h] ?? ''));

const GROUP_COLOR = { META:'FFB7DEE8','DESIGN':'FFD6E4BC','ARRANGE':'FFFCE4A6','ACT':'FFF8CBAD','ASSERT':'FFC9E0B4','ASSET':'FFE2D4F0','RESULT':'FFDDDDDD','DEFECT':'FFF4B6B6' };
ws.getRow(1).eachCell((cell,col) => {
  cell.font = { bold:true, size:9 };
  cell.alignment = { horizontal:'center' };
  cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: GROUP_COLOR[COLS[col-1].g] || 'FFEEEEEE' } };
});
ws.getRow(2).eachCell((cell,col) => {
  cell.font = { bold:true, size:10 };
  cell.alignment = { horizontal:'center', wrapText:true };
  cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: GROUP_COLOR[COLS[col-1].g] || 'FFEEEEEE' } };
  cell.border = { bottom:{ style:'thin' } };
});
ws.columns.forEach((c,i) => { c.width = [13,13,20,11,28,22,32,14,34,11,12,38,26,46,10,10,12,11,9,12,14,12,12][i] || 14; });
ws.eachRow((row,n) => { if (n>2) row.alignment = { vertical:'top', wrapText:true }; });
ws.views = [{ state:'frozen', xSplit:0, ySplit:2 }];

await wb.xlsx.writeFile(OUT);
console.log('✅ wrote', OUT);
console.log('scenarios:', SCENARIOS.length, '| TC rows:', dataRows.length);
const bad = dataRows.filter(r => !/^T[SA]-\d{2}$/.test(r['Scenario No.']) || !/_TC-\d{2}$/.test(r['TC No.']));
console.log('alignment check — bad rows:', bad.length);
