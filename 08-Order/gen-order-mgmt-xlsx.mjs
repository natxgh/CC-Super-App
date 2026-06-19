// gen-order-mgmt-xlsx.mjs — build 1-sheet testcases.xlsx (23 cols) matching Lark Base tblIwUWXkWNLYy4c
// Feature: Order Management · Scenario No. = TS-01/TA-01 · TC No. = TS-01_TC-01
// English version — PO answers applied (ORD-Q1..Q9 resolved, 2026-06-19)
// NOTE: literal on-screen labels (workflow steps, buttons) are kept verbatim — the STG UI renders them in Thai.
//       Realistic example data (company / person names) is kept as-is per the Real Example Data standard.
import ExcelJS from '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation/node_modules/exceljs/excel.js';

const OUT = '/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/08-Order/order-management-testcases.xlsx';

// ─── source TCs (from order-management-test-design.md) ──────────────────
const SRC = {
  // R-A Add Order
  'AO-cart':   { cat:'POSITIVE', title:'Add a product to Cart from Add Order',
    arrange:'Logged in as a user who is PIC of the "คำสั่งซื้อ" (Create Order) step · brand Xiaomi + product "Synthetic Engine Oil 5W-30" exist',
    steps:'Tap Add → tab "product" → select brand Xiaomi → tap the cart button on the "Synthetic Engine Oil 5W-30" card',
    data:'Item type: product · Brand: Xiaomi · Product: Synthetic Engine Oil 5W-30',
    expected:'"View Cart" button appears bottom-right with badge = 1 · the product is added to the cart' },
  'AO-qty-up': { cat:'POSITIVE', title:'Increase Cart quantity to 2',
    arrange:'Cart holds "Synthetic Engine Oil 5W-30" qty 1 (price ฿9,999/unit)',
    steps:'Open View Cart → tap the ＋ button on QUANTITY once',
    data:'Quantity: 1 → 2',
    expected:'QUANTITY field = 2 · Total price updates to ฿19,998 (9,999 × 2)' },
  'AO-qty-min':{ cat:'NEGATIVE', title:'Decrease quantity below the minimum (lower boundary)',
    arrange:'Cart holds 1 line item, quantity = 1',
    steps:'Open View Cart → tap the − button on QUANTITY',
    data:'Quantity: 1 → tap −',
    expected:'Quantity stays at 1 (− button is disabled at value 1; the only way to remove is the trash icon). No maximum cap; quantity is not bound to stock (ordering above stock is allowed and later shows Out of Stock). [PO ORD-Q2]' },
  'AO-required':{ cat:'POSITIVE', title:'Fill Bill To/Ship To/Ship By → Submit becomes enabled',
    arrange:'Cart has ≥1 item · BILLING INFO + SHIPPING INFO expanded',
    steps:'Fill Bill To, Ship To, select Ship By → observe the Submit button',
    data:'Bill To: บริษัท สยามทีวี เซอร์วิส จำกัด · Ship To: คุณสมหญิง รักดี 081-234-5678 · Ship By: Kerry Express',
    expected:'"Submit 1 Order" button switches to enabled (clickable)' },
  'AO-no-shipby':{ cat:'NEGATIVE', title:'Submit with Ship By left blank (required) → blocked',
    arrange:'Cart has an item · only Bill To + Ship To filled · Ship By left blank',
    steps:'Tap the Submit Order button',
    data:'Bill To: บริษัท สยามทีวี เซอร์วิส จำกัด · Ship To: คุณสมหญิง รักดี · Ship By: (blank)',
    expected:'Submit cannot proceed / error state on the "Ship By" field + message ""' },
  'AO-submit':{ cat:'POSITIVE', title:'Submit Order succeeds → new order created',
    arrange:'Cart has an item · Bill To/Ship To/Ship By all filled',
    steps:'Tap "Submit 1 Order"',
    data:'Bill To: บริษัท สยามทีวี เซอร์วิส จำกัด · Ship By: Kerry Express',
    expected:'New order created with status "Create Order" · Order No in format ORD260614-##### appears in the Order list' },
  'AO-skip': { cat:'POSITIVE', title:'Add via Spare Part then Skip the Product step',
    arrange:'Logged in · a brand with spare parts exists',
    steps:'Tap Add → tab "Spare Part" → select brand → tap "Skip" at the Product step → select Spare Part',
    data:'Item type: Spare Part · Product: (Skip)',
    expected:'Spare Part step opens for selection without having to pick a Product first' },
  'AO-noprod':{ cat:'NEGATIVE', title:'Select a brand with no items → No results',
    arrange:'Logged in · brand "Toyota" has no spare parts in the system',
    steps:'Tap Add → tab "Spare Part" → select brand Toyota',
    data:'Brand: Toyota',
    expected:'Shows "No results found." · cannot proceed to the Spare Part step' },

  // R-B View Order
  'VO-detail':{ cat:'POSITIVE', title:'Order Detail page renders all elements',
    arrange:'Order ORD260610-00004 exists in the system',
    steps:'Open the order detail (click the row)',
    data:'Order: ORD260610-00004',
    expected:'Shows Order No + status badge + date + requester (apiwat.rod) + Print button + Bill card (Bill To/Billing Address/Ship To/Shipping Address/Ship By) + ORDER ITEMS + OPERATING PROCEDURE (9-step workflow)' },
  'VO-stock':{ cat:'POSITIVE', title:'Order Item shows Out of Stock badge',
    arrange:'Order contains item "iPhone 17 Pro Screen" that is out of stock',
    steps:'Open detail → view the ORDER ITEMS section',
    data:'Item: iPhone 17 Pro Screen (stock=0)',
    expected:'Item "iPhone 17 Pro Screen" shows an "Out of Stock" badge (red) + Quantity + Price 25,500 Baht' },
  'VO-chat0':{ cat:'POSITIVE', title:'Chat box empty state = No Comment',
    arrange:'Order with no comment yet',
    steps:'Open detail → open the Chat box (icon below the Bill card)',
    data:'-',
    expected:'Box shows "No Comment" + a "Comment..." input + a "Comment" button' },
  'VO-chat1':{ cat:'POSITIVE', title:'Add a Comment to an order',
    arrange:'Any order · Chat box open',
    steps:'Type a message in the Comment field → tap the "Comment" button',
    data:'รบกวนเร่งจัดส่งภายในวันนี้ครับ',
    expected:'Comment "รบกวนเร่งจัดส่งภายในวันนี้ครับ" appears in the box (replacing "No Comment") with author name + timestamp' },

  // R-C Update Order Detail
  'UD-bill': { cat:'POSITIVE', title:'Edit Bill/Shipping inline then Save (Create Order)',
    arrange:'Order with status "Create Order" (not yet submitted)',
    steps:'Tap the pencil on the Bill card → change Ship By to Flash Express → tap Save',
    data:'Ship By: → Flash Express',
    expected:'Bill card shows SHIP BY = "Flash Express" (saved; form closes back to read-only)' },
  'UD-item': { cat:'POSITIVE', title:'Edit Order Item quantity (Create Order)',
    arrange:'Order with status "Create Order"',
    steps:'Tap the pencil on the ORDER ITEMS heading → change quantity to 5',
    data:'Quantity: → 5',
    expected:'Order Item shows "Quantity 5 item"' },
  'UD-title':{ cat:'POSITIVE', title:'Edit the order Title',
    arrange:'Any order',
    steps:'Tap the pencil on the Title tag → edit the text → confirm',
    data:'Title: เบิกอะไหล่งานซ่อมจอ iPhone — Job #4821',
    expected:'Title tag updates to "เบิกอะไหล่งานซ่อมจอ iPhone — Job #4821"' },
  'UD-lock': { cat:'NEGATIVE', title:'After Submit — Bill & Items are locked',
    arrange:'Order with status "Request Approved" (already submitted)',
    steps:'Open detail → look for the pencil on the Bill card and ORDER ITEMS',
    data:'Order: ORD260610-00001 (Request Approved)',
    expected:'No pencil on the Bill card or ORDER ITEMS (not editable) · the Title pencil is still present' },

  // R-D Workflow
  'WF-adv1': { cat:'POSITIVE', title:'Advance workflow: คำสั่งซื้อ → ส่งคำขอ',
    arrange:'Order status "Create Order" · logged in as PIC of the "ส่งคำขอ" (Request) step',
    steps:'Tap the Advance "ส่งคำขอ" button (bottom-right)',
    data:'Action: ส่งคำขอ (Request)',
    expected:'Step "คำสั่งซื้อ" gets a ✓ with timestamp+actor · current step moves to "ส่งคำขอ" · status badge updates' },
  'WF-adv-approve': { cat:'POSITIVE', title:'Advance workflow: ส่งคำขอ → ได้รับการอนุมัติ (Approve)',
    arrange:'Order with current step = "ส่งคำขอ" (Request) · logged in as PIC of the approval step (role Warehouse Approver / Manager)',
    steps:'Tap the Advance "ได้รับการอนุมัติ" button',
    data:'Action: ได้รับการอนุมัติ (Request Approved) · Approver role',
    expected:'Step "ส่งคำขอ" gets a ✓ + timestamp+actor · current step moves to "ได้รับการอนุมัติ" (Request Approved, OS003) · status badge updates' },
  'WF-adv2': { cat:'POSITIVE', title:'Advance workflow: ได้รับการอนุมัติ → กำลังหยิบสินค้า (Picking)',
    arrange:'Order with current step = "ได้รับการอนุมัติ" (Approved) · logged in as PIC',
    steps:'Tap the Advance "กำลังหยิบสินค้า" button',
    data:'Action: กำลังหยิบสินค้า (Picking)',
    expected:'Current step moves to "กำลังหยิบสินค้า" (Picking, OS004) · the previous step gets a ✓' },
  'WF-adv-pack': { cat:'POSITIVE', title:'Advance workflow: กำลังหยิบสินค้า → กำลังแพ็คสินค้า (Packing)',
    arrange:'Order with current step = "กำลังหยิบสินค้า" (Picking) · logged in as PIC',
    steps:'Tap the Advance "กำลังแพ็คสินค้า" button',
    data:'Action: กำลังแพ็คสินค้า (Packing)',
    expected:'Current step moves to "กำลังแพ็คสินค้า" (Packing, OS005) · the previous step gets a ✓ + timestamp+actor' },
  'WF-adv-dispatch': { cat:'POSITIVE', title:'Advance workflow: กำลังแพ็คสินค้า → ส่งออกจากคลัง (Dispatched)',
    arrange:'Order with current step = "กำลังแพ็คสินค้า" (Packing) · logged in as PIC',
    steps:'Tap the Advance "ส่งออกจากคลัง" button',
    data:'Action: ส่งออกจากคลัง (Dispatched)',
    expected:'Current step moves to "ส่งออกจากคลัง" (Dispatched, OS006) · the previous step gets a ✓ + timestamp+actor' },
  'WF-adv-deliver': { cat:'POSITIVE', title:'Advance workflow: ส่งออกจากคลัง → กำลังจัดส่ง (Out for Delivery)',
    arrange:'Order with current step = "ส่งออกจากคลัง" (Dispatched) · logged in as PIC',
    steps:'Tap the Advance "กำลังจัดส่ง" button',
    data:'Action: กำลังจัดส่ง (Out for Delivery)',
    expected:'Current step moves to "กำลังจัดส่ง" (Out for Delivery, OS007) · the previous step gets a ✓ + timestamp+actor' },
  'WF-adv-arrive': { cat:'POSITIVE', title:'Advance workflow: กำลังจัดส่ง → ส่งถึงแล้ว (Delivered)',
    arrange:'Order with current step = "กำลังจัดส่ง" (Out for Delivery) · logged in as PIC',
    steps:'Tap the Advance "ส่งถึงแล้ว" button',
    data:'Action: ส่งถึงแล้ว (Delivered)',
    expected:'Current step moves to "ส่งถึงแล้ว" (Delivered, OS008) · the previous step gets a ✓ + timestamp+actor' },
  'WF-adv-complete': { cat:'POSITIVE', title:'Advance workflow: ส่งถึงแล้ว → เสร็จสิ้น (Complete)',
    arrange:'Order with current step = "ส่งถึงแล้ว" (Delivered) · logged in as PIC',
    steps:'Tap the Advance "เสร็จสิ้น" button',
    data:'Action: เสร็จสิ้น (Complete)',
    expected:'Order reaches the final step "เสร็จสิ้น" (Complete, OS009) · all 9 steps show ✓ with timestamp+actor · status badge = เสร็จสิ้น (terminal success)' },
  'WF-pic':  { cat:'NEGATIVE', title:'Non-PIC user → Advance button does not appear',
    arrange:'Logged in as a user NOT in the PIC list of the current step',
    steps:'Open that order detail → look for the action button',
    data:'User: outside the PIC list (PIC roles per step = Warehouse Approver / Manager)',
    expected:'The step\'s Advance button does NOT appear (cannot act). The Advance button only shows for users in that step\'s PIC list. [PO ORD-Q3]' },
  'WF-sla':  { cat:'POSITIVE', title:'Current step over SLA → Overdue badge',
    arrange:'Order whose current step "ได้รับการอนุมัติ" (Approved) has been idle > 61 minutes (SLA for this step)',
    steps:'Open detail → view the OPERATING PROCEDURE current step',
    data:'Step: ได้รับการอนุมัติ · SLA = 61 minutes (PO ORD-Q4)',
    expected:'Current step shows an "Overdue" badge (red) next to "Current Step" once elapsed time exceeds 61 minutes. Each step has its own SLA in minutes. [PO ORD-Q4]' },
  'WF-notify':{ cat:'POSITIVE', title:'Event Notification on workflow Advance',
    arrange:'Order with a requester + next-step PIC',
    steps:'PIC taps the Advance button of the current step',
    data:'Action: advance step (e.g. apiwat.rod advancing to ส่งคำขอ on ORD260610-00003)',
    expected:'All accounts related to the order (requester + next-step PIC) receive a real-time in-app bell notification with text "{actor} ส่งถึงคุณ {Status Name} :: {Order ID}" (e.g. "apiwat.rod ส่งถึงคุณ ส่งคำขอ :: ORD260610-00003"). [PO ORD-Q6]' },

  // R-E Cancel
  'CO-cancel':{ cat:'NEGATIVE', title:'Cancel an order before Approved',
    arrange:'Order with status "Create Order" (before Approved)',
    steps:'Open detail → tap the "Cancel" button (yellow) → confirm in the dialog',
    data:'Order: status Create Order',
    expected:'(before Confirm) a confirmation dialog "ยืนยันการยกเลิกคำสั่งซื้อ ___ ?" with Confirm/Cancel buttons · (after Confirm) order changes to status "Cancel" (terminal, no further edits). If the order was already Picked, stock is returned. [PO ORD-Q9]' },
  'CO-canapr':{ cat:'NEGATIVE', title:'Cancel button at the Approved step should be blocked (BUG)',
    arrange:'Order with current step = "ได้รับการอนุมัติ" (Approved)',
    steps:'Open detail → check whether the Cancel button is present',
    data:'Order: ORD260610-00001',
    expected:'Expected: the Cancel button should be hidden/blocked once the order is Approved (Cancel is only allowed before Approved). The button currently still appears at the Approved step → this is a BUG; expected to FAIL → open a defect. [PO ORD-Q5]' },

  // R-F Table List / Search
  'TL-grid': { cat:'POSITIVE', title:'Toggle List ↔ Grid view',
    arrange:'Orders exist in the list · current view = List',
    steps:'Tap the view toggle to Grid (grid icon)',
    data:'View: List → Grid',
    expected:'Orders render as cards: Order No · status badge · Title · requester · "X Items · Y Total Qty" · date — the same set as the table' },
  'TL-cols': { cat:'POSITIVE', title:'Table list shows all columns',
    arrange:'List view',
    steps:'Inspect the table header',
    data:'-',
    expected:'All columns present: ORDER · DETAIL · BILL TO · SHIP TO · ITEMS · STATUS · CREATED · REQUEST BY' },
  'TL-sid':  { cat:'NEGATIVE', title:'Search by Order ID (BUG: does not filter)',
    arrange:'Multiple orders including ORD260609-00001',
    steps:'Type an Order ID in the Search box → tap Search',
    data:'ORD260609-00001',
    expected:'Expected: list filters to only ORD260609-00001 (Search should filter by Order ID per placeholder "Search request ID or part..."). Actual: returns all orders (no filtering) → expected to FAIL → open a defect. [PO ORD-Q7]' },
  'TL-spart':{ cat:'NEGATIVE', title:'Search by part name (BUG: does not filter)',
    arrange:'An order containing item "iPhone 17 Pro Screen" plus other orders without it',
    steps:'Type a part name in the Search box → tap Search',
    data:'iPhone',
    expected:'Expected: list filters to only orders containing iPhone (Search should filter by product/part name). Actual: returns all orders (no filtering) → expected to FAIL → open a defect. [PO ORD-Q7]' },
  'TL-clear':{ cat:'POSITIVE', title:'Clear Filters restores the full list',
    arrange:'A search is active (Clear Filters button visible)',
    steps:'Tap the "Clear Filters" button',
    data:'-',
    expected:'List returns to showing all orders · the search box is cleared to empty. (Note: this round there is no separate status/date filter — only the Search box + List/Grid toggle. [PO ORD-Q8])' },
};

// ─── scenarios: TC order (source IDs) ──────────────────────────────
const SCENARIOS = [
  { no:'TS-01', name:'Create → Submit → walk the full 9-step Workflow to เสร็จสิ้น (Complete)',
    bc:'1. Add to Cart (Spare Part / Product)\n2. Cart quantity (min 1, no max)\n3. Required fields (Bill To / Ship To / Ship By)\n4. Submit → Create Order\n5. Advance through all 9 steps (คำสั่งซื้อ → ส่งคำขอ → ได้รับการอนุมัติ → กำลังหยิบสินค้า → กำลังแพ็คสินค้า → ส่งออกจากคลัง → กำลังจัดส่ง → ส่งถึงแล้ว → เสร็จสิ้น)\n6. Event Notification',
    tcs:['AO-cart','AO-qty-up','AO-required','AO-submit','WF-adv1','WF-adv-approve','WF-adv2','WF-adv-pack','WF-adv-dispatch','WF-adv-deliver','WF-adv-arrive','WF-adv-complete','WF-notify'] },
  { no:'TS-02', name:'View / List / Detail (read paths)',
    bc:'1. List ↔ Grid view\n2. Table columns\n3. Order Detail elements\n4. Stock badge (In / Out of Stock)\n5. Comment (empty = No Comment)\n6. SLA Overdue badge\n7. Clear Filters',
    tcs:['TL-grid','TL-cols','VO-detail','VO-stock','VO-chat0','VO-chat1','WF-sla','TL-clear'] },
  { no:'TS-03', name:'Update Order Detail (before submit)',
    bc:'1. Edit Bill / Shipping\n2. Edit Order Items\n3. Edit Title',
    tcs:['UD-bill','UD-item','UD-title'] },
  { no:'TS-04', name:'Add via Spare Part path (Skip product)',
    bc:'1. Add via Spare Part (Skip Product)\n2. Required fields (Bill To / Ship To / Ship By)\n3. Submit → Create Order',
    tcs:['AO-skip','AO-required','AO-submit'] },
  { no:'TA-01', name:'Submit blocked by missing required fields',
    bc:'1. Add to Cart\n2. Ship By required (blank → Submit blocked)',
    tcs:['AO-cart','AO-no-shipby'] },
  { no:'TA-02', name:'Cancel before Approved + quantity boundary',
    bc:'1. Cart quantity lower boundary (min 1)\n2. Cancel before Approved → status Cancel',
    tcs:['AO-qty-min','CO-cancel'] },
  { no:'TA-03', name:'Edit locked after Submit + Cancel after Approved (BUG)',
    bc:'1. Bill / Items locked after Submit\n2. Cancel blocked after Approved (BUG)',
    tcs:['UD-lock','CO-canapr'] },
  { no:'TA-04', name:'Brand with no items → cannot proceed',
    bc:'1. Brand with no items → No results found',
    tcs:['AO-noprod'] },
  { no:'TA-05', name:'Search does not filter (BUG)',
    bc:'1. Search by Order ID (no filter — BUG)\n2. Search by part name (no filter — BUG)',
    tcs:['TL-sid','TL-spart'] },
  { no:'TA-06', name:'PIC gating — non-PIC cannot act',
    bc:'1. Non-PIC user → Advance button hidden',
    tcs:['WF-pic'] },
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
      'Project Name':'AICC', 'Product':'CC Super App', 'Feature':'Order Management',
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
ws.columns.forEach((c,i) => { c.width = [13,13,20,11,30,26,34,14,38,11,12,40,28,50,10,10,12,11,9,12,14,12,12][i] || 14; });
ws.eachRow((row,n) => { if (n>2) row.alignment = { vertical:'top', wrapText:true }; });
ws.views = [{ state:'frozen', xSplit:0, ySplit:2 }];

await wb.xlsx.writeFile(OUT);
console.log('✅ wrote', OUT);
console.log('scenarios:', SCENARIOS.length, '| TC rows:', dataRows.length);
const bad = dataRows.filter(r => !/^T[SA]-\d{2}$/.test(r['Scenario No.']) || !/_TC-\d{2}$/.test(r['TC No.']));
console.log('alignment check — bad rows:', bad.length);
