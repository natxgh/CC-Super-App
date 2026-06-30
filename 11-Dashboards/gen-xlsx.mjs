import ExcelJS from 'exceljs';

const HEADERS = [
  'Project Name','Product','Feature','Scenario No.','Scenario Name','Business Conditions',
  'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)','TC No.','Case Title Name','Test category','Test Type',
  'Test Steps','Data Test','Expected Result','UI Design',
  'Test Result','Result Note','Test Date','Test By','Remark',
  'RelateDefectURL','Defect Types','Testing Round'
];
const GROUPS = {
  'Project Name':'META','Product':'META','Feature':'META','Scenario No.':'META',
  'Scenario Name':'DESIGN','Business Conditions':'DESIGN',
  'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)':'ARRANGE',
  'TC No.':'META','Case Title Name':'META','Test category':'META','Test Type':'META',
  'Test Steps':'ACT','Data Test':'ACT','Expected Result':'ASSERT','UI Design':'ASSET',
  'Test Result':'RESULT','Result Note':'RESULT','Test Date':'RESULT','Test By':'RESULT','Remark':'RESULT',
  'RelateDefectURL':'DEFECT','Defect Types':'DEFECT','Testing Round':'DEFECT'
};

// helper to build a row object
const P='AICC', PROD='CC Super App';
function R(feature, sNo, sName, bc, arrange, tcNo, title, cat, steps, data, expected){
  return {
    'Project Name':P,'Product':PROD,'Feature':feature,'Scenario No.':sNo,'Scenario Name':sName,
    'Business Conditions':bc,'Arrange (สิ่งที่ต้องเตรียมก่อนการทดสอบ)':arrange,'TC No.':tcNo,
    'Case Title Name':title,'Test category':cat,'Test Type':'SYSTEMTEST','Test Steps':steps,
    'Data Test':data,'Expected Result':expected
  };
}

const PDF='Product Dashboard', CDF='Case Dashboard';
const loginRich='มีบัญชี Supervisor (สิทธิ์เห็น Dashboard) login STG แล้ว · build v0.26.3 · Product Dashboard ตั้งค่าแสดงเวอร์ชัน v3 (rich)';
const loginCase='มีบัญชี Supervisor login STG แล้ว · Case Dashboard เข้าผ่านเมนู Cases → Case Dashboard (/cms/)';

const rows = [];

// ===== Product Dashboard — TS01 View full dashboard =====
{
 const s='TS-01', sn='View full Product Dashboard (v3)', bc='PD10, PD1, PD3, PD4, PD7';
 rows.push(R(PDF,s,sn,bc, loginRich+' · role = Supervisor', 'TS-01_TC-01','เปิด Product Dashboard ด้วย role ที่มีสิทธิ์','POSITIVE',
   '1. คลิกเมนูซ้าย Products → Dashboard (หรือเปิด /cms/products/dashboard)','URL: /cms/products/dashboard',
   'หน้า "Product Management Dashboard" เปิดได้ มีปุ่ม v2/v1 และ Export Report มุมขวาบน'));
 rows.push(R(PDF,s,sn,bc, loginRich, 'TS-01_TC-02','ตรวจ KPI cards 4 ใบ','POSITIVE',
   '1. ดูแถวการ์ดบนสุด','—',
   'เห็น 4 การ์ด: Products=1,280 ("Total active products") / Spare Parts=5,640 ("Spare parts in stock") / Ordering=84 ("Pending Orders") / Total Pending=23 ("Waiting for approval")'));
 rows.push(R(PDF,s,sn,bc, loginRich, 'TS-01_TC-03','ตรวจ Overview Platform Capabilities','POSITIVE',
   '1. ดู section "Overview / Platform Capabilities"','—',
   'เห็น 5 โมดูลพร้อม active records: Product Stock=9,850 / Spare Part Stock=4,320 / Customers=2,450 / Appointments=52 / Package & Services=84'));
 rows.push(R(PDF,s,sn,bc, loginRich, 'TS-01_TC-04','ตรวจ Top Ordered เรียงลำดับ','POSITIVE',
   '1. ดู section "Top Ordered"','—',
   'แสดง 6 อันดับเรียงจำนวนสั่งมาก→น้อย: #1 Industrial Router X1 (182 ครั้ง ฿12,500) … #6 Access Point Pro (65 ครั้ง ฿7,800)'));
 rows.push(R(PDF,s,sn,bc, loginRich, 'TS-01_TC-05','ตรวจ Recent Services + status badge','POSITIVE',
   '1. ดู section "Recent Services"','—',
   'แสดงรายการพร้อม badge: Network Maintenance=Completed (เขียว) / Server Installation=In Progress (ส้ม) / CCTV Inspection=Pending (แดง)'));
}

// ===== Product Dashboard — TS02 Version toggle =====
{
 const s='TS-02', sn='Product Dashboard version toggle v1/v2/v3', bc='PD8';
 rows.push(R(PDF,s,sn,bc, loginRich+' · เริ่มที่ v3', 'TS-02_TC-01','สลับจาก v3 ไป v1','POSITIVE',
   '1. กดปุ่ม "v1" มุมขวาบน','ปุ่ม: v1',
   'Layout เปลี่ยนเป็นเวอร์ชันเรียบ: การ์ด Total Products=128 / Active Services=42 / Spare Parts (Inventory)=560 / Pending Requests=18 และปุ่มเปลี่ยนเป็น v3/v2'));
 rows.push(R(PDF,s,sn,bc, loginRich+' · อยู่ที่ v1', 'TS-02_TC-02','สลับจาก v1 ไป v2','POSITIVE',
   '1. กดปุ่ม "v2"','ปุ่ม: v2',
   'Layout เปลี่ยนเป็นเวอร์ชัน rich (Products=1,280, มี Top Ordered, Inventory Alert) และปุ่มเปลี่ยนเป็น v3/v1'));
 rows.push(R(PDF,s,sn,bc, loginRich+' · อยู่ที่ v2', 'TS-02_TC-03','สลับกลับ v3 (default)','POSITIVE',
   '1. กดปุ่ม "v3"','ปุ่ม: v3',
   'แสดง layout rich (default) ไม่มี error ไม่ค้าง'));
}

// ===== Product Dashboard — TS03 Export (blocked Q2) =====
{
 const s='TS-03', sn='Product Dashboard export report', bc='PD1, PD9';
 rows.push(R(PDF,s,sn,bc, loginRich, 'TS-03_TC-01','กด Export Report ได้ไฟล์','POSITIVE',
   '1. กดปุ่ม "Export Report" มุมขวาบน','ปุ่ม: Export Report',
   '[รอ PO ยืนยัน Q2] ระบบ generate ไฟล์รายงาน (รูปแบบ "" — คาด Excel .xlsx) และดาวน์โหลดสำเร็จ'));
 rows.push(R(PDF,s,sn,bc, loginRich, 'TS-03_TC-02','Export เสร็จภายในเวลา BRD','POSITIVE',
   '1. กด Export Report และจับเวลาตั้งแต่กดจนไฟล์พร้อม','—',
   '[รอ Q2] รายงาน generate เสร็จ < 60 วินาที (BRD §3.5.7 Report Generation Time < 1 Minute)'));
}

// ===== Product Dashboard — TA01 Unauthorized (blocked Q8) =====
{
 const s='TA-01', sn='Product Dashboard unauthorized access', bc='PD10';
 rows.push(R(PDF,s,sn,bc, 'มีบัญชี role ที่ไม่มีสิทธิ์เห็น Dashboard (เช่น Technician) login STG แล้ว', 'TA-01_TC-01','role ไม่มีสิทธิ์เปิด Product Dashboard','NEGATIVE',
   '1. login ด้วย role Technician แล้วพยายามเปิด /cms/products/dashboard','URL: /cms/products/dashboard',
   '[รอ Q8] ไม่เห็นเมนู Dashboard หรือถูกปฏิเสธการเข้าถึง (redirect / หน้า 403 / ข้อความ "" ไม่มีสิทธิ์)'));
}

// ===== Product Dashboard — TA02 Inventory alert =====
{
 const s='TA-02', sn='Product Dashboard inventory alert threshold', bc='PD10, PD5';
 rows.push(R(PDF,s,sn,bc, loginRich, 'TA-02_TC-01','เปิด dashboard ด้วยสิทธิ์','POSITIVE',
   '1. เปิด Product Dashboard (v3)','URL: /cms/products/dashboard',
   'หน้า Dashboard เปิดได้ เห็น section "Inventory Alert"'));
 rows.push(R(PDF,s,sn,bc, 'มี spare part จำนวน 12 รายการที่ stock ต่ำกว่า minimum + มี purchase request 5 ใบรอ approve', 'TA-02_TC-02','Inventory Alert แสดง low stock','POSITIVE',
   '1. ดู section "Inventory Alert"','spare part below min = 12 · pending approval = 5',
   'แถบแดงแสดง "12 spare parts below minimum stock level" และ "5 purchase requests waiting for approval"'));
 rows.push(R(PDF,'TA-02',sn,'PD5', 'มี spare part ที่ stock = minimum พอดี (เช่น min=10, stock=10)', 'TA-02_TC-03','stock เท่ากับ min ไม่นับ low','NEGATIVE',
   '1. ตรวจ spare part ที่ stock = min ว่าถูกนับใน alert หรือไม่','min=10 · stock=10',
   '[รอ Q5] spare part ที่ stock = min ไม่ถูกนับใน "below minimum stock level"'));
}

// ===== Case Dashboard — TS01 Empty state (executable now) =====
{
 const s='TS-01', sn='View Case Dashboard empty state', bc='CD7, CD1, CD5, CD2';
 rows.push(R(CDF,s,sn,bc, loginCase, 'TS-01_TC-01','เปิด Case Dashboard ด้วยสิทธิ์','POSITIVE',
   '1. คลิกเมนูซ้าย Cases → Case Dashboard','URL: /cms/',
   'หน้า "Work Order Summary" เปิดได้'));
 rows.push(R(CDF,s,sn,bc, loginCase, 'TS-01_TC-02','ตรวจ KPI cards by type','POSITIVE',
   '1. ดูแถวการ์ดบนสุด','—',
   'เห็น 4 การ์ด: Total / Censor / CCTV / Traffic'));
 rows.push(R(CDF,s,sn,bc, loginCase+' · STG ยังไม่มี Work Order ในระบบ', 'TS-01_TC-03','ตรวจ empty state ทุก panel','POSITIVE',
   '1. ดูค่าทุก panel ขณะไม่มี WO','—',
   'การ์ดทั้ง 4 = 0 · SLA Performance InSLA=0% OverSLA=0% Average Response Time=0min · Work Order Status Overview Total=0 (Complete/In Progress/New = 0)'));
 rows.push(R(CDF,s,sn,bc, loginCase, 'TS-01_TC-04','ตรวจโครงสร้าง Monthly Summary chart','POSITIVE',
   '1. ดู "Work Order in Monthly Summary"','—',
   'แสดง bar chart แกนเดือน Jan 2026–Jun 2026 พร้อม legend Complete (เขียว) / In Progress (น้ำเงิน) / New (เหลือง) — ทุกเดือน = 0'));
}

// ===== Case Dashboard — TS02 With data (blocked) =====
{
 const s='TS-02', sn='View Case Dashboard with data populated', bc='CD7, CD1, CD4, CD3, CD2';
 rows.push(R(CDF,s,sn,bc, 'เตรียม Work Order หลายใบในระบบ: Censor=3, CCTV=2, Traffic=1 (Total=6) · กระจายสถานะ Complete=2/In Progress=3/New=1 · บางใบปิดในเวลา SLA บางใบเกิน', 'TS-02_TC-01','Total = ผลรวมประเภท','POSITIVE',
   '1. ดูการ์ด Total เทียบกับ Censor+CCTV+Traffic','Censor=3 · CCTV=2 · Traffic=1',
   '[รอ Q9] การ์ด Total = 6 (= 3+2+1)'));
 rows.push(R(CDF,s,sn,bc, 'WO กระจายสถานะ Complete=2 / In Progress=3 / New=1', 'TS-02_TC-02','Status Overview ผลรวม + %','POSITIVE',
   '1. ดู Work Order Status Overview','Complete=2 · In Progress=3 · New=1',
   '[รอ Q9] Total=6 · Complete=2 (33%) · In Progress=3 (50%) · New=1 (17%)'));
 rows.push(R(CDF,s,sn,bc, 'WO 1 ใบปิดงานก่อนครบ SLA (เช่น SLA 60 นาที ปิดที่ 45 นาที)', 'TS-02_TC-03','WO ปิดในเวลา → นับ InSLA','POSITIVE',
   '1. ปิด WO ภายใน SLA แล้วดู SLA Performance','SLA=60min · ปิดที่ 45min',
   '[รอ Q10] WO ถูกนับเป็น InSLA · %InSLA เพิ่มขึ้น'));
 rows.push(R(CDF,s,sn,bc, 'มี WO ครบ 6 เดือน', 'TS-02_TC-04','Monthly chart มีค่าต่อเดือน','POSITIVE',
   '1. ดู Work Order in Monthly Summary','—',
   '[รอ Q9] แท่งกราฟแต่ละเดือนแสดงจำนวน WO แยกสีตามสถานะตรงกับข้อมูลจริง'));
}

// ===== Case Dashboard — TS03 SLA boundary (blocked Q10) =====
{
 const s='TS-03', sn='Case Dashboard SLA boundary (BVA)', bc='CD3';
 rows.push(R(CDF,s,sn,bc, 'WO ที่มี SLA deadline 60 นาที · ปิดงานที่นาทีที่ 59 (ก่อน deadline)', 'TS-03_TC-01','ปิดก่อน deadline (น้อยกว่า)','POSITIVE',
   '1. ปิด WO ที่ 59 นาที','SLA=60min · ปิด=59min',
   '[รอ Q10] นับเป็น InSLA'));
 rows.push(R(CDF,s,sn,bc, 'WO SLA 60 นาที · ปิดที่นาทีที่ 60 พอดี', 'TS-03_TC-02','ปิดตรง deadline (เท่ากับ)','POSITIVE',
   '1. ปิด WO ที่ 60 นาทีพอดี','SLA=60min · ปิด=60min',
   '[รอ Q10] นับเป็น InSLA (เท่ากับ deadline = ยังในเวลา ตามข้อเสนอ)'));
 rows.push(R(CDF,s,sn,bc, 'WO SLA 60 นาที · ปิดที่นาทีที่ 61 (เกิน)', 'TS-03_TC-03','ปิดเกิน deadline (มากกว่า)','NEGATIVE',
   '1. ปิด WO ที่ 61 นาที','SLA=60min · ปิด=61min',
   '[รอ Q10] นับเป็น OverSLA · %OverSLA เพิ่ม'));
}

// ===== Case Dashboard — TA01 Unauthorized (blocked Q8) =====
{
 const s='TA-01', sn='Case Dashboard unauthorized access', bc='CD7';
 rows.push(R(CDF,s,sn,bc, 'มีบัญชี role ที่ไม่มีสิทธิ์ (เช่น Customer) login STG แล้ว', 'TA-01_TC-01','role ไม่มีสิทธิ์เปิด Case Dashboard','NEGATIVE',
   '1. login ด้วย role Customer แล้วพยายามเปิด Case Dashboard (/cms/)','URL: /cms/',
   '[รอ Q8] ไม่เห็นเมนู Case Dashboard หรือถูกปฏิเสธการเข้าถึง (ข้อความ "" ไม่มีสิทธิ์)'));
}

// ===== Case Dashboard — TA02 Real-time (blocked Q7) =====
{
 const s='TA-02', sn='Case Dashboard updates when new WO created', bc='CD6';
 rows.push(R(CDF,s,sn,bc, loginCase+' · จด Total ปัจจุบันไว้ก่อน (เช่น Total=6, New=1)', 'TA-02_TC-01','สร้าง WO ใหม่แล้วตัวเลขอัปเดต','POSITIVE',
   '1. สร้าง Work Order ใหม่ 1 ใบ แล้วกลับมา/รีโหลด Case Dashboard','WO ใหม่ประเภท CCTV',
   '[รอ Q7,Q9] การ์ด Total +1 (=7) และ New +1 (=2) หลัง reload (ตามข้อเสนอ: อัปเดตเมื่อ reload)'));
}

// ===== Case Dashboard — TA03 Period toggle Monthly↔Daily (blocked V2.0 deploy) =====
{
 const s='TA-03', sn='Case Dashboard period toggle Monthly/Daily', bc='CD8';
 rows.push(R(CDF,s,sn,bc, loginCase+' · ตรวจสอบว่า V2.0 deploy บน STG แล้ว · default view = Monthly', 'TA-03_TC-01','เปลี่ยนจาก Monthly เป็น Daily view','POSITIVE',
   '1. กดปุ่มหรือ dropdown เปลี่ยนช่วงเวลาเป็น Daily บน Case Dashboard','—',
   '[รอ V2.0 deploy] chart/data เปลี่ยนเป็น daily breakdown (แสดงข้อมูลรายวัน ไม่ใช่รายเดือน)'));
 rows.push(R(CDF,s,sn,bc, loginCase+' · อยู่ใน Daily view', 'TA-03_TC-02','เปลี่ยนกลับจาก Daily เป็น Monthly view','POSITIVE',
   '1. กดปุ่มหรือ dropdown เปลี่ยนกลับเป็น Monthly','—',
   '[รอ V2.0 deploy] chart กลับเป็น stacked bar รายเดือน (เช่น Jan–Jun 2026) ไม่ error ไม่ค้าง'));
}

// ===== Case Dashboard — TA04 Export Case Dashboard (blocked Q2 + V2.0 deploy) =====
{
 const s='TA-04', sn='Case Dashboard exported data (V2.0)', bc='CD9';
 rows.push(R(CDF,s,sn,bc, loginCase+' · ตรวจสอบว่า V2.0 deploy บน STG แล้ว', 'TA-04_TC-01','Export Case Dashboard report → ดาวน์โหลดได้','POSITIVE',
   '1. กดปุ่ม Export บน Case Dashboard','—',
   '[รอ Q2, V2.0 deploy] ระบบสร้างไฟล์รายงาน (format ตาม Q2 เช่น .xlsx) ดาวน์โหลดได้ ไฟล์ไม่ว่าง'));
 rows.push(R(CDF,s,sn,bc, loginCase+' · จับเวลา start จากกด Export', 'TA-04_TC-02','Export เสร็จภายใน 60 วินาที (BRD target)','POSITIVE',
   '1. กดปุ่ม Export บน Case Dashboard แล้วจับเวลาจนดาวน์โหลดเสร็จ','—',
   '[รอ Q2, V2.0 deploy] เวลา generate < 60 วินาที (BRD FR-07 §3.5.7 Report Generation < 1 min)'));
}

// ── build workbook ──
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('TestCases');
ws.addRow(HEADERS.map(h=>GROUPS[h]));      // row1 = group
ws.addRow(HEADERS);                         // row2 = header
for (const r of rows) ws.addRow(HEADERS.map(h=>r[h] ?? ''));
HEADERS.forEach((h,i)=>{ ws.getColumn(i+1).width = Math.min(Math.max(h.length,12),40); });
const out = '/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/11-Dashboards/dashboard-testcases.xlsx';
await wb.xlsx.writeFile(out);
console.log('✅ wrote', out, '· rows(TC):', rows.length);
// quick alignment self-check
const bad = rows.filter(r => !/^T[SA]-\d+$/.test(r['Scenario No.']) || !/_TC-\d+$/.test(r['TC No.']));
console.log('alignment check — bad rows:', bad.length);
