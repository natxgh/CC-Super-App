import { createRequire } from 'module';
const require = createRequire('/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation/');
const ExcelJS = require('exceljs');

const COLS = [
  'Project Name', 'Product', 'Feature',
  'Scenario No.', 'Scenario Name', 'Business Conditions',
  'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)',
  'TC No.', 'Case Title Name', 'Test category', 'Test Type',
  'Test Steps', 'Data Test', 'Expected Result', 'UI Design',
  'Test Result', 'Result Note', 'Test Date', 'Test By', 'Remark',
  'RelateDefectURL', 'Defect Types', 'Testing Round',
];
const GROUPS = { // col group labels for row 1
  META:['Project Name','Product','Feature','Scenario No.'],
  DESIGN:['Scenario Name','Business Conditions'],
  ARRANGE:['Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)'],
  'META-TC':['TC No.','Case Title Name','Test category','Test Type'],
  ACT:['Test Steps','Data Test'],
  ASSERT:['Expected Result'],
  ASSET:['UI Design'],
  RESULT:['Test Result','Result Note','Test Date','Test By','Remark'],
  DEFECT:['RelateDefectURL','Defect Types','Testing Round'],
};

const PROJ='AICC', PROD='CC Super App', FEAT='Spare Parts Stock Management', TT='SYSTEMTEST';
const ARR_DEFAULT='Login: user role that can manage Spare Parts Stock (Spare Parts Warehouse Staff)\nMaster data available: Spare Parts + Store + at least 5 stock units on STG';

// scenarios: [scNo, scName, conditions, [ [tcNo,title,cat,steps,data,expected,arrange?] ... ] ]
const S = [
  ['TS-01','Browse stock list (List/Table) + view details','1. Stock list shows all fields (List/Table view)\n2. View Item Details',[
    ['TS-01_TC-01','Open Spare Parts Stock — List view shows all fields','POSITIVE','1. Login\n2. Open Spare Parts Stock menu (/cms/inventory/stock)','URL: /cms/inventory/stock','List view: every row shows Serial No. / Spare Part / Store / Status + View button; toolbar has Search, Search button, Filters, Reset and 2 view-toggle buttons (List/Table)'],
    ['TS-01_TC-02','Switch to Table view','POSITIVE','Click the Table-view button (grid icon) at top right','—','Table shows header: SERIAL NO. / SPARE PART / STORE / STATUS / ACTION; row SN0000019 shows iPhone 17 Pro Screen / Store2 / R001 in full'],
    ['TS-01_TC-03','View → Item Details modal','POSITIVE','Click the View button on row SN0000019','SN0000019','"Item Details" modal shows Serial No.=SN0000019, Spare Part=iPhone 17 Pro Screen, Store=Store2, Status=R001 + Delete / Edit / Close buttons'],
  ]],
  ['TS-02','Search → Filter → Reset','1. Search (free text)\n2. Filter by Spare Part + Store\n3. Reset search/filter',[
    ['TS-02_TC-01','Search by exact Serial No.','POSITIVE','Type the search term in the Search box and click Search','SN0000019','List shows only row SN0000019 (1 item)'],
    ['TS-02_TC-02','Search by partial match','POSITIVE','Type the search term and click Search','5W-30','List shows only Synthetic Engine Oil 5W-30 units (5W-30-0002 to 5W-30-0005)'],
    ['TS-02_TC-03','Filter by Store only','POSITIVE','Click Filters → select Store','Store: Store2','List shows only units located in Store2'],
    ['TS-02_TC-04','Filter Spare Part + Store (intersection)','POSITIVE','Click Filters → select Spare Part + Store','Spare Part: iPhone 17 Pro Screen | Store: Store2','List = intersection: only iPhone 17 Pro Screen units located in Store2'],
    ['TS-02_TC-05','Reset clears search/filter','POSITIVE','Click the Reset button','—','Search + filter are cleared back to default; list shows all units again'],
  ]],
  ['TS-03','Edit stock unit successfully (Status read-only)','1. View Item Details\n2. Status read-only (system-managed)\n3. Spare Part/Store from master only\n4. Edit required fields (Serial No./Spare Part/Store)\n5. Update saves changes',[
    ['TS-03_TC-01','View unit before editing','POSITIVE','Click View on row SN0000019','SN0000019','Item Details modal shows unit data + Edit button'],
    ['TS-03_TC-02','Edit form has no Status field (read-only)','POSITIVE','In the modal, click Edit','—','"Edit Spare Parts Stock" form has only Serial No.* / Spare Part* / Store* — no Status field (Status is not editable)'],
    ['TS-03_TC-03','Spare Part selectable from master only','POSITIVE','Click the Spare Part dropdown and type to search','Mercedes','Dropdown shows only matching parts from master (Mercedes-Benz OM654.920); free text not in master is not saved'],
    ['TS-03_TC-04','Change Store then Update successfully','POSITIVE','Select a new Store and click Update Spare Parts Stock','Store: Store1','Success toast "Spare parts serial updated successfully"; row SN0000019 updated to Store=Store1 in the list'],
  ]],
  ['TS-04','Delete stock unit & decrease stock count','1. View Item Details\n2. Delete unit + stock count drops\n3. Order-linked unit cannot be deleted',[
    ['TS-04_TC-01','View unit before deleting','POSITIVE','Click View on row SN0000016','SN0000016','Item Details modal shows iPhone 17 Pro Screen / Store2 + Delete button'],
    ['TS-04_TC-02','Delete unit → confirm → count decreases','POSITIVE','Click Delete and confirm in the confirm dialog','SN0000016','Confirm dialog appears; after confirm, toast "Spare parts serial deleted successfully"; row SN0000016 disappears; iPhone 17 Pro Screen stock count on Spare Parts master decreases by 1'],
    ['TS-04_TC-03','Cannot delete Order-linked unit','NEGATIVE','Open a unit whose Status is not Available (e.g. R003 Reserved / R004 Confirmed) and click Delete','Serial: SN0000019 (Status R003 Reserved)','Delete is blocked: unit linked to an Order cannot be deleted — system locks/warns "" (exact text TBD); unit remains in list'],
  ]],
  ['TS-05','Stock badge (Out/Low/In, BVA) → drill-down','1. Stock badge Out of Stock / Low Stock / In Stock\n2. External-link drill-down to stock\n3. Filter by Spare Part',[
    ['TS-05_TC-01','badge Out of Stock (count = 0)','POSITIVE','Open Spare Parts master page (/cms/inventory/), view a part with no units','part: Mercedes-Benz OM654.920 (0 units)','Part card shows "Out of Stock (0)" badge (red)'],
    ['TS-05_TC-02','badge Low Stock (count = 1)','POSITIVE','View a part with 1 unit','part: Mercedes-Benz M112 (1 unit)','"Low Stock (1)" badge (orange)'],
    ['TS-05_TC-03','badge Low Stock (count = 5, = upper threshold)','POSITIVE','View a part with 5 units','part with 5 units','"Low Stock (5)" badge (orange) — 1–5 units = Low Stock (PO confirmed)'],
    ['TS-05_TC-04','badge In Stock (count = 6, > threshold)','POSITIVE','View a part with 6 units','part with 6 units','Badge is In Stock (>5 units, not Low/Out) (PO confirmed; threshold configurable per company)'],
    ['TS-05_TC-05','external-link from badge → Spare Parts Stock','POSITIVE','Click the ↗ icon next to the part badge','part: Mercedes-Benz M112','Navigates to Spare Parts Stock page filtered to only Mercedes-Benz M112 units'],
    ['TS-05_TC-06','list filtered by Spare Part','POSITIVE','Verify the list filtered from the drill-down','Spare Part: Mercedes-Benz M112','List shows only Mercedes-Benz M112 units'],
  ]],
  ['TS-06','Table view sort by Serial No.','1. Stock list (Table view)\n2. Table sort by Serial No. (asc/desc)',[
    ['TS-06_TC-01','Open Table view','POSITIVE','Click the Table-view button','—','Table shows sortable header; Serial No. column has a sort icon'],
    ['TS-06_TC-02','Sort ascending','POSITIVE','Click the "Serial No." header (first time)','—','Rows sorted by Serial No. low to high (asc)'],
    ['TS-06_TC-03','Sort descending','POSITIVE','Click the "Serial No." header again','—','Rows sorted by Serial No. high to low (desc)'],
  ]],
  ['TA-01','Edit — missing required field','1. Edit required fields (Serial No./Spare Part/Store)',[
    ['TA-01_TC-01','View → open Edit','POSITIVE','Click View → Edit on row SN0000019','SN0000019','Edit form opens with existing values'],
    ['TA-01_TC-02','Clear Serial No. → Update','NEGATIVE','Clear the Serial No. value and click Update Spare Parts Stock','Serial No.: (empty)','Serial No. field shows a red error message under the input box (required); not saved, modal stays open'],
    ['TA-01_TC-03','Clear Spare Part → Update','NEGATIVE','Clear the Spare Part value and click Update','Spare Part: (empty)','Spare Part field shows a red error message under the input box (required); not saved'],
  ]],
  ['TA-02','Edit — duplicate Serial No. (uniqueness, system-wide)','1. Serial No. unique (system-wide)',[
    ['TA-02_TC-01','View → open Edit of another unit','POSITIVE','Click View → Edit on row SN0000018','SN0000018','Edit form opens'],
    ['TA-02_TC-02','Change Serial No. to an existing value → Update','NEGATIVE','Change Serial No. to a value already used by another unit → Update','Serial No.: SN0000019 (duplicate of another unit)','System rejects: Serial No. must be unique system-wide; duplicate error "" (exact text TBD); not saved'],
  ]],
  ['TA-03','Search with no results','1. Search (free text)\n2. Reset search/filter',[
    ['TA-03_TC-01','Search with a non-existent value','NEGATIVE','Type a search term not present in the system → Search','SN9999999','Empty list + empty state "No entries to show" (no error / page hang)'],
    ['TA-03_TC-02','Reset shows all again','POSITIVE','Click Reset','—','Search is cleared; list shows all units again'],
  ]],
  ['TA-04','RBAC — stock management permission','1. RBAC: Warehouse Staff/Admin manage; read-only role sees no Add/Edit/Delete',[
    ['TA-04_TC-01','Warehouse Staff / Admin sees management actions','POSITIVE','Login as Spare Parts Warehouse Staff (or Admin) → open the stock page','role: Spare Parts Warehouse Staff','Management actions visible per permission: "Create Spare Parts Stock" (Add) button + Edit / Delete on each unit','Login: Spare Parts Warehouse Staff role'],
    ['TA-04_TC-02','Read-only role does not see manage actions','NEGATIVE','Login as Agent role (read-only) → open the stock page','role: Agent','No Add / Edit / Delete; only View is available','Login: Agent role (read-only)'],
  ]],
  ['TA-05','Edit lock — Order-linked unit','1. Edit/Delete locked for Order-linked unit (Status not Available)',[
    ['TA-05_TC-01','Cannot change Spare Part/Store of Order-linked unit','NEGATIVE','Open Edit on a unit whose Status is not Available (linked to an Order/customer) and try to change Spare Part or Store → Update','Serial: SN0000019 (Status R004 Confirmed)','Spare Part / Store are locked or the system warns "" (exact text TBD); change is not saved'],
  ]],
  ['TA-06','Serial No. format validation','1. Serial No. format (alphanumeric + dash, max length 100)',[
    ['TA-06_TC-01','Valid Serial No. (alphanumeric + dash)','POSITIVE','In Edit, set Serial No. to an alphanumeric+dash value → Update','Serial No.: 5W-30-0009','Accepted and saved; row shows Serial No. 5W-30-0009'],
    ['TA-06_TC-02','Invalid Serial No. (special char / space)','NEGATIVE','In Edit, set Serial No. with a special char or space → Update','Serial No.: SN 000@19','Red error under the input box (invalid format) "" (exact text TBD); not saved'],
    ['TA-06_TC-03','Serial No. at max length boundary (100)','POSITIVE','In Edit, set Serial No. to exactly 100 chars (alphanumeric+dash) → Update','Serial No.: 100-char value','Accepted and saved (max length = 100)'],
  ]],
  ['TA-07','Pagination','1. Pagination (page size 10/20/50/100)',[
    ['TA-07_TC-01','Page size selector present','POSITIVE','Open the stock page and inspect the pagination control','—','Pagination control present; page-size selectable: 10 / 20 / 50 / 100'],
    ['TA-07_TC-02','Change page size','POSITIVE','Change page size from default to 50','page size: 50','List re-renders showing up to 50 units per page; pagination updates accordingly'],
  ]],
];

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Test Scenarios & Result');
// row 1 group labels
const r1 = [];
for (const c of COLS) {
  let g='';
  for (const [gn,arr] of Object.entries(GROUPS)) if (arr.includes(c)) g=gn;
  r1.push(g);
}
ws.addRow(r1);
ws.addRow(COLS);
for (const [scNo,scName,cond,tcs] of S) {
  for (const t of tcs) {
    const [tcNo,title,cat,steps,data,exp,arr] = t;
    const rec={};
    rec['Project Name']=PROJ; rec['Product']=PROD; rec['Feature']=FEAT;
    rec['Scenario No.']=scNo; rec['Scenario Name']=scName; rec['Business Conditions']=cond;
    rec['Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)']=arr||ARR_DEFAULT;
    rec['TC No.']=tcNo; rec['Case Title Name']=title; rec['Test category']=cat; rec['Test Type']=TT;
    rec['Test Steps']=steps; rec['Data Test']=data; rec['Expected Result']=exp;
    ws.addRow(COLS.map(c=>rec[c]??''));
  }
}
ws.columns.forEach(c=>{c.width=22;});
const out='/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/07-Spare Parts Stock/spare-parts-stock-testcases.xlsx';
await wb.xlsx.writeFile(out);
console.log('written:', out, '| rows:', S.reduce((n,s)=>n+s[3].length,0));
