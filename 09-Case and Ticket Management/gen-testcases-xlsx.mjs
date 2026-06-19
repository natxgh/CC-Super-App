import ExcelJS from '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation/node_modules/exceljs/lib/exceljs.nodejs.js';

const TEMPLATE = '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/templates/testcases-template.xlsx';
const OUT = '/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/09-Case and Ticket Management/case-ticket-management-testcases.xlsx';

const FEATURE = 'Case and Ticket Management';
const PROJECT = 'AICC';
const PRODUCT = 'CC Super App';

// helper: build scenario block
const S = (no, name, conds, steps) => ({ no, name, conds, steps });
// step: [tcSuffix, title, category(P/N), arrange, testSteps, dataTest, expected]

const scenarios = [
  S('TS-01', 'Full case lifecycle E2E — create a case through to successful closure', '1. Contact Method options (CALL/METTLINK/METTRIQ/IOT-Alert/Other)\n2. Priority auto-set by Case Type\n3. Phone auto-links Customer Profile\n4. Required fields complete (Types, Contact Method, Case Details, Service Center)\n5. Attach photo jpg/png ≤ 1MB\n6. Submit → Confirm → case saved (New)\n7. Kanban grouping by status\n8. Lifecycle forward (New→Assigned→Acknowledged→En Route→On Site)\n9. Close requires Result + Result Details ≤ 1000\n10. Close approval flow → Completed', [
    ['TC-01','Contact Method shows all options','P','Logged in as agent, on the Add New Case page (/cms/case/creation)','Open the "Contact Method" dropdown','-','Dropdown shows all 5 options: CALL, METTLINK, METTRIQ, IOT-Alert, Other'],
    ['TC-02','Priority auto-set from Case Type','P','On the Add New Case page','Select a Case Type','Types = "1002-Camera Malfunction -Repair"','Priority badge automatically shows "High Priority" (orange) in the top-right of the form'],
    ['TC-03','Phone number auto-links Customer Profile','P','A Customer Profile "Somying Rakdee" with phone 081-234-5678 exists in the system','Fill in the Phone Number field','Phone Number = "081-234-5678"','Right panel switches to the "Somying Rakdee" profile + Contact Channels (Phone Number = Primary)'],
    ['TC-04','All required fields filled → Confirm modal','P','On the Add New Case page, Case Type + Contact Method already selected','Fill Case Details + select Service Center, then click Submit','Case Details = "The CCTV camera at the front entrance is not working, the image is dark; checked and the power LED is off"; Service Center = "Thailand-Thonburi South Zone-phasicharoen"','Opens a Confirm modal summarizing the case (Case Type, Priority, Service Center, Detail, Contact) with no validation error'],
    ['TC-05','Attach an image ≤ 1MB','P','On the Add New Case page before Submit','Drag a file into the Attach File zone','File "cctv-front-door.jpg" size 800KB','File appears in the attachment list, attached successfully'],
    ['TC-06','Confirm → case is created','P','Confirm modal is open','Click "Confirm"','-','Shows a success toast + the case is saved and appears in the "New" column of the Assignment Board (Q1 versions bug confirmed Fixed)'],
    ['TC-07','Case appears in the correct Kanban column','P','Case just created with status New','Open Case Assignment in Kanban view','-','Case "1002-Camera Malfunction -Repair" sits under the "New" column and the New count badge increases by 1'],
    ['TC-08','New → Assigned','P','The case just created, status New, logged in as an agent with assign rights','Open the Case Assignment Detail and click Assign Staff to a unit/staff','Assign to "Thonburi Installation Team"','Status → Assigned, timeline ticks Received/New green'],
    ['TC-09','Assigned → Acknowledged','P','Same case, status Assigned, logged in as the assigned staff (Responder role)','Click Acknowledge','-','Status → Acknowledged, the blue marker moves to Acknowledged'],
    ['TC-10','Acknowledged → En Route','P','Same case, status Acknowledged','Click En Route (depart)','-','Status → En Route'],
    ['TC-11','En Route → On Site','P','Same case, status En Route','Click On Site (arrived)','-','Status → On Site'],
    ['TC-12','Select Result + Result Details 1000 chars','P','Same case, status On Site, on the Case Detail page','Select a Result and enter Result Details of 1000 characters','Result = "Repair completed"; Result Details = a 1000-character work summary','Counter shows "1000 / 1000" and accepts all, no truncation'],
    ['TC-13','Request close approval + attach file','P','Same case, status On Site, staff handling the job','Click "Request close approval" and attach a closing photo','Photo "close-report.png" 500KB','Status → "Pending Close Approval" and the approve button appears on the approver side (flow confirmed per Q3)'],
    ['TC-14','Approve → Completed','P','Same case, status "Pending Close Approval", logged in as the approver','Click approve close','-','Status → "Completed", timeline completes all 6 steps and the same case (created in TC-06) moves to the "Done" column — full create-to-close path verified'],
  ]),
  S('TS-02', 'Search / filter case history', '1. Empty state\n2. Card / List view toggle\n3. Keyword search\n4. Filter by Select Status\n5. Advanced Filters (date range, type, province)', [
    ['TC-01','Open the Work Order History page','P','Logged in','Open the Case List menu (/cms/case/history)','-','The "Work Order History" page shows buttons: Card/List toggle, Search, Select Status, Advanced Filters, Create Work Order'],
    ['TC-02','Switch to Card view','P','History page has at least 1 case','Click the toggle to Card view','-','Case list renders as cards instead of a table'],
    ['TC-03','Search by keyword','P','A case whose Detail contains the word "camera"','Type the keyword and click Search','keyword = "camera"','List shows only cases that match "camera"'],
    ['TC-04','Filter by Select Status','P','Cases in multiple statuses exist','Choose Select Status','Status = "In-progress"','List shows only cases with status In-progress'],
    ['TC-05','Advanced Filter by date range','P','Cases created between 01–10 Jun 2026 exist','Open Advanced Filters, set Start/End Date, then Apply','Start = 01/06/2026, End = 30/06/2026','List shows only cases in the date range and the button changes to "Apply Filters (n)" with n>0'],
    ['TC-06','Reset All clears filters','P','Filters already set in the Advanced Filters modal','Click "Reset All"','-','All filter fields are cleared and the message "No filters applied" is shown'],
  ]),
  S('TS-03', 'Update a case while in progress', '1. Edit case details\n2. Add comment\n3. Attach file during the job', [
    ['TC-01','Edit Case Details','P','Case status Assigned, on the Case Detail page','Click Edit, change Case Details, then save','New Case Details = "Additional note: customer reports the 2nd camera image starting to stutter"','Case Details updates and Update At changes to the current time'],
    ['TC-02','Add a Comment','P','Case status In-progress, on the Case Detail page','Add a Comment','Comment = "Technician scheduled on-site 15/06 at 13:00"','Comment appears in the activity log with a timestamp and the author name'],
    ['TC-03','Attach an additional file during the job','P','Case status In-progress, on the Case Detail page','Click Attach File and attach an on-site photo','File "site-photo.jpg" 600KB','File is added to the case and shown in the attachment list'],
  ]),
  S('TS-04', 'Create another case type + Draft + notification', '1. Priority by Case Configuration\n2. Save As Draft (Case List → "Draft" filter, editable/cancelable)\n3. Real-time in-app notification on the Assignment Board', [
    ['TC-01','Priority of a Service Request','P','On the Add New Case page','Select a Service Request Case Type','Types = "101-1. Service Request-New Service"','Priority badge shows the level per the Case Configuration (refer to CC Super App Configuration → Case Configuration, per Q8)'],
    ['TC-02','Save As Draft','P','Form already fully filled','Click "Save As Draft"','-','Case is saved as a Draft in the Case List, accessible via the "Draft" filter and can be edited/cancelled (per Q10)'],
    ['TC-03','Real-time notification on an action','P','Two accounts (A, B) have the Assignment Board open at once, B is related to the case','Account A actions a work order (changes status)','-','Account B receives a real-time in-app notification on the Assignment Board (in scope this round per Q5)'],
  ]),

  // ───── Alternative ─────
  S('TA-01', 'Case creation fails — missing required field', '1. Required fields (Types, Contact Method, Case Details, Service Center)', [
    ['TC-01','Leave Types empty','N','On the Add New Case page','Leave Types empty, fill everything else, then click Submit','Contact Method=CALL, Case Details complete, Service Center complete, Types=empty','Submit does not open the Confirm modal and the Types field shows an error state'],
    ['TC-02','Leave Service Center empty','N','On the Add New Case page','Leave Service Center empty, fill everything else, then click Submit','Types complete, Contact Method=CALL, Case Details complete, Service Center=empty','Submit is blocked and the Service Center field shows an error state'],
  ]),
  S('TA-02', 'Case Details exceeds the 4000 limit', '1. Case Details ≤ 4000 characters', [
    ['TC-01','Length 3999 (lower boundary)','P','On the Add New Case page','Type Case Details of 3999 characters','A 3999-character string','Counter shows "3999 / 4000" and accepts all'],
    ['TC-02','Length 4000 (boundary equal)','P','On the Add New Case page','Type Case Details of 4000 characters','A 4000-character string','Counter shows "4000 / 4000" and accepts all'],
    ['TC-03','Length 4001 (over boundary)','N','On the Add New Case page, already has 4000 characters','Try to type the 4001st character','The 4001st character','System accepts only 4000, counter stays at "4000 / 4000", the extra character is not entered'],
  ]),
  S('TA-03', 'Attach a file that violates the rules', '1. Attach only jpg/png ≤ 1MB; non-image upload disabled', [
    ['TC-01','Photo jpg/png under 1MB','P','On the Add New Case page','Attach a PNG image of size 800KB','Image "cctv-front-door.png" 800KB','Attached successfully, image appears in the attachment list'],
    ['TC-02','Photo over 1MB','N','On the Add New Case page','Attach a JPG image of size 1025KB','Image "cctv-front-door.jpg" 1025KB','Rejected + error toast: "File \"cctv-front-door.jpg\" is too large." (limit Photo 1MB = 1024KB, per Q9)'],
    ['TC-03','Unsupported file type (non-image)','N','On the Add New Case page','Attach a non-image file','File "report.pdf" (or "image.avif")','Rejected — non-image upload is disabled this round, accept only jpg/png; error: "อัพโหลดไฟล์ไม่สำเร็จ: report.pdf" (per Q9)'],
  ]),
  S('TA-04', 'Confirm then save (regression — DEFECT Q1 Fixed)', '1. Required fields complete\n2. Submit → Confirm → case saved (regression: "versions" NOT NULL bug fixed)', [
    ['TC-01','Fill all → open Confirm modal','P','On the Add New Case page','Fill all required fields, then click Submit','Types=1002-Camera Malfunction -Repair, Contact Method=CALL, Detail complete, Service Center complete','Opens a Confirm modal summarizing the case'],
    ['TC-02','Confirm → case created (was "Add Work Order fail.")','P','Confirm modal open','Click "Confirm"','-','Case is created successfully with a success toast (regression: the "versions" NOT NULL defect was confirmed Fixed per Q1; previously a red "Add Work Order fail." toast)'],
  ]),
  S('TA-05', 'Phone number does not match an existing customer', '1. Phone auto-links Customer Profile (no match → Link/Create prompt)', [
    ['TC-01','A phone number not in the system','N','No customer with phone 099-000-0001 exists; on the Add New Case page','Fill in the Phone Number field','Phone Number = "099-000-0001"','Shows a "Customer not found" state with "Linked Existing" and "Add Customer" buttons'],
  ]),
  S('TA-06', 'Cannot skip / reverse status', '1. No skip / reverse status (role-based via Assign Staff, no Kanban drag)', [
    ['TC-01','Skip step Received → On Site','N','Case status Received, on the Case Assignment Detail page (status advanced via the Assign Staff button, role-based per Q4)','Try to jump directly to On Site (skipping Assigned/Acknowledged/En Route)','-','System does not allow skipping a step; the Assign Staff action only advances to the next allowed status (no Kanban drag, per Q4)'],
    ['TC-02','Reverse Completed → On Site','N','Case status Completed','Try to revert status back to On Site','-','System does not allow reverting status (Reopen = Next Phase per Q11)'],
  ]),
  S('TA-07', 'Close the case without meeting conditions', '1. Close requires Result + Result Details ≤ 1000', [
    ['TC-01','No Result selected','N','Case status On Site, on the Case Detail page','Leave Result empty, then click close','Result = empty','Closing is blocked + prompts that a Result must be selected first'],
    ['TC-02','Result Details exceeds 1000','N','Case status On Site, already has 1000 chars of Result Details','Try to type the 1001st character','The 1001st character','Accepts only 1000, counter stays at "1000 / 1000"'],
  ]),
  S('TA-08', 'Advanced Filter with invalid conditions', '1. Advanced Filters enforce Start Date ≤ End Date', [
    ['TC-01','Start Date > End Date','N','History page, Advanced Filters modal','Set Start after End, then Apply','Start = 30/06/2026, End = 01/06/2026','System enforces Start Date <= End Date — the invalid range cannot be applied (per Q13)'],
    ['TC-02','Filter by multiple criteria at once (AND)','P','Diverse cases exist','Select Type + Province, then Apply','Type = "Camera Malfunction", Province = "Bangkok"','List is filtered by both criteria as an AND'],
  ]),
  S('TA-09', 'Search returns no results', '1. Keyword search\n2. Empty state when no match', [
    ['TC-01','A keyword not in the system','N','Cases exist but none contain this word','Search for a keyword that does not exist','keyword = "zzznotreal999"','Shows an empty state "No entries to show"'],
  ]),
  S('TA-10', 'No delete entry point in the UI (per Q2)', '1. No UI delete point (hard delete by Super admin only)', [
    ['TC-01','No Delete control for a New case','N','Logged in as a normal CMS user, a case with status New','Open the Case Detail and the Assignment Board, look for any Delete action','-','No Delete button/control is present anywhere in the UI — case deletion is not exposed to CMS users'],
    ['TC-02','No Delete control regardless of status','N','Logged in as a normal CMS user, a case with status In-progress','Look for any Delete action','-','No Delete control is present — deletion is a hard delete performed only by Super admin (out of UI scope, per Q2)'],
  ]),
  S('TA-11', 'Cannot edit after closure', '1. Cannot edit after Completed (Reopen = Next Phase)', [
    ['TC-01','Edit a Completed case','N','Case status Completed (closed), on the Case Detail page','Click the Edit button','-','Edit button is hidden/disabled, cannot edit after closure (Reopen = Next Phase, per Q11)'],
  ]),
];

// ─── build workbook from template ───
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(TEMPLATE);
const ws = wb.worksheets[0];

// clear any sample rows below header (row 3+)
const lastRow = ws.rowCount;
for (let r = lastRow; r >= 3; r--) ws.spliceRows(r, 1);

let rowNum = 3;
for (const sc of scenarios) {
  for (const st of sc.steps) {
    const [suffix, title, cat, arrange, steps, data, expected] = st;
    const cells = {
      1: PROJECT,
      2: PRODUCT,
      3: FEATURE,
      4: sc.no,
      5: sc.name,
      6: sc.conds,
      7: arrange,
      8: `${sc.no}_${suffix}`,
      9: title,
      10: cat === 'P' ? 'POSITIVE' : 'NEGATIVE',
      11: 'SYSTEMTEST',
      12: steps,
      13: data,
      14: expected,
    };
    const row = ws.getRow(rowNum);
    for (const [c, v] of Object.entries(cells)) {
      const cell = row.getCell(Number(c));
      cell.value = v;
      cell.alignment = { vertical: 'top', wrapText: true };
    }
    row.commit();
    rowNum++;
  }
}

await wb.xlsx.writeFile(OUT);
const total = scenarios.reduce((a, s) => a + s.steps.length, 0);
console.log(`✅ wrote ${OUT}`);
console.log(`   scenarios=${scenarios.length}  rows(TC)=${total}`);
