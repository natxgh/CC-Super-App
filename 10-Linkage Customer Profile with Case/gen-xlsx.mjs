import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ExcelJS = require('/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation/node_modules/exceljs/excel.js');

const PROJECT = 'AICC', PRODUCT = 'CC Super App', FEATURE = 'Linkage Customer Profile with Case';
const ARR_BASE = 'Login User: ketwadee\nRole & Permission: All Permission - Contact/Case Management\n-----------------------------\nOn the Case Creation page (/cms/case/creation)\nExisting customer data in the system:\n① Bulan J — Phone: 0899181632 · Email: bulan.jit@skyai.co.th · Type: Gold\n② Donald Throught — Phone: 0899181633 · Type: Platinum\n③ Vilailuk Maksuk — Phone: 0850020000 · Email: vilailuk@gmail.com · Type: Platinum';

// columns 1..23
const COLS = ['Project Name','Product','Feature','Scenario No.','Scenario Name','Business Conditions',
 'Arrange\n(สิ่งที่ต้องเตรียมก่อนการทดสอบ)','TC No.','Case Title Name','Test category','Test Type',
 'Test Steps','Data Test','Expected Result','UI Design','Test Result','Result Note','Test Date','Test By',
 'Remark','RelateDefectURL','Defect Types','Testing Round'];
const GROUP = ['📋  META','📋  META','📋  META','📋  META','📐  DESIGN','📐  DESIGN','🔧  ARRANGE  (AAA: Arrange)',
 '📋  META','📐  DESIGN','📋  META','📋  META','▶   ACT  (AAA: Act)','▶   ACT  (AAA: Act)','✅  ASSERT  (AAA: Assert)',
 '✅  ASSERT  (AAA: Assert)','📊  TEST RESULT','📊  TEST RESULT','📊  TEST RESULT','📊  TEST RESULT','📊  TEST RESULT',
 '🐞  DEFECT','🐞  DEFECT','🐞  DEFECT'];

// Business Conditions = plain descriptive numbered list (NO IDs) · Case Title Name = clean (no [xxx])
const BC_LINK = '1. Linked Existing modal + customer list\n2. Search keyword (Name/Mobile Number/Email)\n3. Select customer → link + auto-fill Phone Number\n4. Customer 360 tabs\n5. View Full Profile (Modal)';
const BC_ADD  = '1. Required fields Email + Phone (First/Last Name optional)\n2. Save → customer created → auto-link to case';
const BC_CHANGE = '1. Select customer A → linked\n2. Re-select customer B → replace linked customer';

// scenarios: {no,name,cond,tcs:[{no,title,cat,steps,data,exp,arrange?}]}
const scenarios = [
 { no:'TS-01', name:'User can successfully link an existing customer to a case (search → Select → view Customer 360 + auto-fill Phone)',
   cond:BC_LINK,
   tcs:[
    {no:'TS-01_TC-01',title:'Open the "Linked Existing" modal',cat:'POSITIVE',
     steps:'Click the "Linked Existing" button on the right panel (Customer Information)',data:'-',
     exp:'Modal "Linked Existing" opens\n- Search input (placeholder "Search Name,Mobile Number,Email.")\n- Search button\n- Filter "Type"\n- Table with ≥1 row, columns: CUSTOMER / CONTACT (email+phone) / PRODUCT / SERVICE / TYPE / ACTIVE + "Select" button per row\n- Footer "Showing 1–N of N entries" + Show [10] + Previous/1/Next'},
    {no:'TS-01_TC-02',title:'Search keyword "Mobile Number"',cat:'POSITIVE',
     steps:'Type "0899181632" in the Search input → click Search',data:'Mobile: 0899181632',
     exp:'Display row "Bulan J"\nEmail: bulan.jit@skyai.co.th\nPhone: 0899181632\nType: Gold\nNon-matching rows are hidden\n[Known defect A-1: currently returns "No results found."]'},
    {no:'TS-01_TC-03',title:'Click "Select" → link customer + auto-fill Phone Number',cat:'POSITIVE',
     steps:'Click the "Select" button on the row with Phone 0899181632',data:'Phone: 0899181632',
     exp:'Modal closes\nCustomer Information card shows: avatar + name "Bulan J" + Email + Phone Number: 0899181632 + Type\nCase form "Phone Number" auto-filled = 0899181632\n"View Full Profile" button appears'},
    {no:'TS-01_TC-04',title:'View Customer 360 tabs on the panel',cat:'POSITIVE',
     steps:'View the right panel tab bar after linking',data:'-',
     exp:'Tab bar shows: Profile · History · Note · Appointment · Product · Service'},
    {no:'TS-01_TC-05',title:'View Profile tab → Contact Channels',cat:'POSITIVE',
     steps:'Open the "Profile" tab',data:'-',
     exp:'"Contact Channels" shows:\n- Phone Number 0899181632 (badge "Primary" + verified ✓)\n- Line\n- Email (verified ✓)'},
    {no:'TS-01_TC-06',title:'Click "View Full Profile" → Full Profile modal',cat:'POSITIVE',
     steps:'Click the "View Full Profile" button',data:'-',
     exp:'A Modal opens (expand display) showing the customer\'s Full Profile with complete Personal Details\n[PO confirmed: View Full Profile = expand display via Modal]'},
   ]},
 { no:'TS-02', name:'User can successfully add a new customer from the case page and auto-link it to the case',
   cond:BC_ADD,
   tcs:[
    {no:'TS-02_TC-01',title:'Open Add Customer and fill required fields',cat:'POSITIVE',
     steps:'Click the "Add Customer" button → fill in Email + Phone',data:'Email: napatsorn.wong@gmail.com\nPhone: 0623344556',
     exp:'"Add Customer" modal opens (Personal Details)\nEmail and Phone accept input\nNo error highlight\n"Save" button is enabled'},
    {no:'TS-02_TC-02',title:'Fill First/Last Name → Save → success + auto-link',cat:'POSITIVE',
     steps:'Fill in First Name + Last Name → click "Save"',data:'First Name: Napatsorn\nLast Name: Wongthong',
     exp:'Dialog hides, then Toast "Success"\nCustomer Information card populated with "Napatsorn Wongthong" + Phone 0623344556\nCase form "Phone Number" auto-filled = 0623344556\n[PO confirmed: auto-link immediately after create]'},
   ]},
 { no:'TS-03', name:'User can successfully change the linked customer (re-select to replace)',
   cond:BC_CHANGE,
   tcs:[
    {no:'TS-03_TC-01',title:'Select customer A → linked',cat:'POSITIVE',
     steps:'Open Linked Existing → click Select on the row with Phone 0850020000',data:'Phone: 0850020000',
     exp:'Right panel shows "Vilailuk Maksuk"\nCase form "Phone Number" = 0850020000'},
    {no:'TS-03_TC-02',title:'Re-select customer B → replace linked customer',cat:'POSITIVE',
     steps:'Open Linked Existing again → click Select on the row "Bulan J" (0899181632)',data:'Phone: 0899181632',
     exp:'Right panel updates to "Bulan J"\nCase form "Phone Number" changes to 0899181632 (replaces 0850020000)\n[PO: system re-links by phone number; known bug when editing phone in a single case]'},
   ]},
 // Alternatives (1 TC each)
 { no:'TA-01', name:'User can search by Name and find the customer',cond:'1. Search keyword by Name',
   tcs:[{no:'TA-01_TC-01',title:'Search keyword "Name"',cat:'POSITIVE',
     steps:'Type "Bulan" in the Search input → click Search',data:'Name: Bulan',
     exp:'Display row "Bulan J"\n[Known defect A-1: currently returns "No results found."]'}]},
 { no:'TA-02', name:'User can search by Mobile Number (non-dash format) and find the customer',cond:'1. Search keyword by Mobile Number',
   tcs:[{no:'TA-02_TC-01',title:'Search keyword "Mobile Number"',cat:'POSITIVE',
     steps:'Type "0850020000" (no dash) in the Search input → click Search',data:'Mobile: 0850020000',
     exp:'Display row with Phone 0850020000 (Vilailuk Maksuk)\n[PO: phone search uses non-dash format; UI should reject dash format. Known defect A-1.]'}]},
 { no:'TA-03', name:'User can search by Email and find the customer',cond:'1. Search keyword by Email',
   tcs:[{no:'TA-03_TC-01',title:'Search keyword "Email"',cat:'POSITIVE',
     steps:'Type "bulan.jit@skyai.co.th" in the Search input → click Search',data:'Email: bulan.jit@skyai.co.th',
     exp:'Display row "Bulan J"\n[Known defect A-1: currently returns "No results found."]'}]},
 { no:'TA-04', name:'Verify "No results found." when searching a keyword with no results',cond:'1. Search keyword with no result',
   tcs:[{no:'TA-04_TC-01',title:'Search a keyword that does not exist',cat:'NEGATIVE',
     steps:'Type "Nonexistent Person" in the Search input → click Search',data:'Name: Nonexistent Person',
     exp:'Table shows "No results found."\nFooter "Showing 1–0 of 0 entries"'}]},
 { no:'TA-05', name:'Clear Filters restores the full customer list',cond:'1. Clear Filters re-fetch',
   tcs:[{no:'TA-05_TC-01',title:'Click "Clear Filters" after a no-result search',cat:'POSITIVE',
     steps:'(After a no-result search, list is empty) click the "Clear Filters" button',data:'-',
     exp:'Search input is cleared\nTable shows the full customer list again\n[Known defect A-2: currently still stuck on "No results found."]'}]},
 { no:'TA-06', name:'Verify "No results found." when no customer matches',cond:'1. Empty / no matching data',
   tcs:[{no:'TA-06_TC-01',title:'Open modal when no customer matches',cat:'NEGATIVE',
     steps:'Open the Linked Existing modal (no customer / filter has no match)',data:'-',
     exp:'Table shows "No results found."\nFooter "Showing 1–0 of 0 entries"'}]},
 { no:'TA-07', name:'User can filter the customer list by Type',cond:'1. Filter by Type',
   tcs:[{no:'TA-07_TC-01',title:'Filter Type "Platinum"',cat:'POSITIVE',
     steps:'Select Filter "Type" = Platinum',data:'Type: Platinum',
     exp:'Only rows with TYPE = Platinum are shown (e.g. Donald Throught)\nGold/Silver/Bronze rows are hidden\n[PO: Type values = Bronze / Silver / Gold / Platinum / N/A]'}]},
 { no:'TA-08', name:'Verify the linked customer identity matches the selected row',cond:'1. Linkage identity (1 phone = 1 customer profile)',
   tcs:[{no:'TA-08_TC-01',title:'Compare the linked card with the selected row',cat:'NEGATIVE',
     steps:'Click Select on the row with Phone 0850020000 → compare the Customer Information card with the list row',data:'Phone: 0850020000',
     exp:'Name/Email/Type on the card match the selected row\n[PO: expected 1 phone per 1 customer profile. Known defect A-3: a row "ana Yukinae/ana@gmail.com/Gold" links to card "Vilailuk Maksuk/vilailuk@gmail.com/Platinum" — clear junk data before SIT.]'}]},
 { no:'TA-09', name:'Verify "No results found." in Case History when the customer has no case',cond:'1. Case History empty',
   tcs:[{no:'TA-09_TC-01',title:'Open History tab for a customer with no case',cat:'NEGATIVE',
     steps:'Link a customer that has no case → open the "History" tab',data:'-',
     exp:'History tab shows "No results found."'}]},
 { no:'TA-10', name:'Error message "Please enter an email address" when Email is empty',cond:'1. Email required',
   tcs:[{no:'TA-10_TC-01',title:'Save with an empty Email',cat:'NEGATIVE',
     steps:'Fill in Phone only (Email empty) → click Save',data:'Email: (empty)\nPhone: 0623344556',
     exp:'Inline message "Please enter an email address" shown on the Email field\nDialog hides, then error toast\nCustomer is not created\n[PO confirmed: add inline validation]'}]},
 { no:'TA-11', name:'Error message "Please enter a mobile number" when Phone is empty',cond:'1. Phone required',
   tcs:[{no:'TA-11_TC-01',title:'Save with an empty Phone',cat:'NEGATIVE',
     steps:'Fill in Email only (Phone empty) → click Save',data:'Email: napatsorn.wong@gmail.com\nPhone: (empty)',
     exp:'Inline message "Please enter a mobile number" shown on the Phone field\nDialog hides, then error toast\nCustomer is not created\n[PO confirmed: add inline validation]'}]},
 { no:'TA-12', name:'Error messages when both Email and Phone are empty',cond:'1. Email + Phone required',
   tcs:[{no:'TA-12_TC-01',title:'Save with all fields empty',cat:'NEGATIVE',
     steps:'Leave all fields empty → click Save',data:'Email: (empty)\nPhone: (empty)',
     exp:'Both messages shown: "Please enter an email address" + "Please enter a mobile number"\nDialog hides, then error toast\nCustomer is not created\n[PO confirmed: add inline validation]'}]},
 { no:'TA-13', name:'Error message — invalid email address format',cond:'1. Email format',
   tcs:[{no:'TA-13_TC-01',title:'Save with an invalid email format',cat:'NEGATIVE',
     steps:'Fill in an Email without "@" + Phone → click Save',data:'Email: napatsorn.wonggmail.com\nPhone: 0623344556',
     exp:'Email field shows error "Invalid email address format" (exact copy TBC with PO/Dev)\nCustomer is not created'}]},
 { no:'TA-14', name:'Error — duplicate phone number is blocked',cond:'1. Duplicate phone',
   tcs:[{no:'TA-14_TC-01',title:'Save with a phone number that already exists',cat:'NEGATIVE',
     steps:'Fill in a new Email + a duplicate Phone (Bulan J) → click Save',data:'Email: new.person@gmail.com\nPhone: 0899181632',
     exp:'System blocks the save + shows error "" (exact copy TBC)\nNo duplicate customer is created\n[PO confirmed: block both duplicate phone and email]'}]},
 { no:'TA-15', name:'Error — duplicate email address is blocked',cond:'1. Duplicate email',
   tcs:[{no:'TA-15_TC-01',title:'Save with an email that already exists',cat:'NEGATIVE',
     steps:'Fill in a duplicate Email (Bulan J) + a new Phone → click Save',data:'Email: bulan.jit@skyai.co.th\nPhone: 0623344556',
     exp:'System blocks the save + shows error "" (exact copy TBC)\nNo duplicate customer is created\n[PO confirmed: block both duplicate phone and email]'}]},
];

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Test Scenarios & Result');
ws.addRow(GROUP);
ws.addRow(COLS);
for (const s of scenarios) {
  for (const tc of s.tcs) {
    ws.addRow([PROJECT,PRODUCT,FEATURE,s.no,s.name,s.cond, tc.arrange||ARR_BASE,
      tc.no,tc.title,tc.cat,'SYSTEMTEST', tc.steps,tc.data,tc.exp,
      '', '','','','','', '','','']);
  }
}
// basic widths + wrap
const widths=[10,14,26,10,40,28,40,16,40,12,12,36,26,46,12,12,16,12,10,12,16,14,12];
widths.forEach((w,i)=>ws.getColumn(i+1).width=w);
ws.eachRow(r=>r.eachCell(c=>{c.alignment={wrapText:true,vertical:'top'}}));
ws.getRow(1).font={bold:true}; ws.getRow(2).font={bold:true};

const out='/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/10-Linkage Customer Profile with Case/linkage-customer-case-testcases.xlsx';
await wb.xlsx.writeFile(out);
const nTC=scenarios.reduce((a,s)=>a+s.tcs.length,0);
console.log('WROTE',out,'| scenarios:',scenarios.length,'| testcases:',nTC);
