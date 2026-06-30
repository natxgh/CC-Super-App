# Test Design — CC Super App Dashboard (Product + Case)

> Black Box test design ตามมาตรฐานทีม (`qa-ai-pilot/test-design-standard.md`)
> Feature: **Product Dashboard** (`/cms/products/dashboard`) + **Case Dashboard / Work Order Summary** (`/cms/`)
> Source: `dashboard-requirements.md` (explored STG v0.26.3, 2026-06-14) + BRD v0.3 (FR-07, §3.5.7) + grooming §7 + Lark Architectural Doc §06 Dashboard Statistic (2026-06-29)
> Project = AICC · Product = CC Super App
>
> ⚠️ บริบท: Product Dashboard = **mock data + 3 version UI (v1/v2/v3)** · Case Dashboard = **live data ว่าง (0 ทุกค่า)**
> → หลาย TC ที่ตรวจ "ความถูกต้องของค่า/การคำนวณ" ถูก **block ด้วย Hidden Assumption** (ทำเครื่องหมาย 🔒) จนกว่า PO ตอบ + dev wire data จริง
> 📄 Architectural Doc §06 ยืนยัน Case Dashboard V2.0 มี: **monthly reporting, daily reporting, exported data** — เพิ่ม BC CD8–CD9 + TC ที่เกี่ยวข้อง (ทั้งสอง block จน deploy V2.0 confirm)

---

## A. Business Conditions

### Product Dashboard (PD)
| ID | Business Condition | Technique | ทำไมเทคนิคนี้ |
|---|---|---|---|
| PD1 | แสดง KPI cards 4 ใบ (Products / Spare Parts / Ordering / Total Pending) พร้อมค่า + sub-label | Use Case | เป็นการแสดงผลหลายองค์ประกอบ แยกช่วงไม่ได้ → enumerate ทุกการ์ด |
| PD2 | Trend indicator: ค่าบวก = เขียว, ค่าลบ = แดง | EP | 2 กลุ่มตรงข้าม (บวก/ลบ) ให้สีต่างกัน |
| PD3 | Overview "Platform Capabilities" แสดง active records 5 โมดูล | Use Case | enumerate รายโมดูล |
| PD4 | Top Ordered แสดง 6 อันดับ เรียงจำนวนสั่งมาก→น้อย | Use Case + BVA | ตรวจ sort + ขอบจำนวนรายการที่แสดง (6) |
| PD5 | Inventory Alert เตือนเมื่อ stock ต่ำกว่า minimum / มี pending approval | BVA | ค่าตัวเลขมีขอบ (ต่ำกว่า/เท่ากับ/มากกว่า min) |
| PD6 | Estimated Revenue (donut) + Product Sales % / Service Revenue % | Use Case | การคำนวณ/แสดงผลรวม — enumerate |
| PD7 | Recent Services แสดง status badge (Completed / In Progress / Pending) | EP | กลุ่มสถานะให้ผลแสดงต่างกัน |
| PD8 | Version toggle สลับ layout v1 ↔ v2 ↔ v3 | State Transition | UI มีสถานะ (เวอร์ชันที่แสดง) เปลี่ยนตาม action กดปุ่ม |
| PD9 | Export Report สร้างรายงาน (BRD target < 1 นาที) | Use Case + BVA | รูปแบบ export (enumerate) + เวลา generate (ขอบ 60 วิ) |
| PD10 | RBAC: เฉพาะ role ที่มีสิทธิ์เห็น Dashboard | EP | 2 กลุ่ม (มีสิทธิ์/ไม่มีสิทธิ์) |

### Case Dashboard — Work Order Summary (CD)
| ID | Business Condition | Technique | ทำไมเทคนิคนี้ |
|---|---|---|---|
| CD1 | KPI cards แยกตามประเภท (Total / Censor / CCTV / Traffic) | Use Case | enumerate ประเภท |
| CD2 | Work Order in Monthly Summary — stacked bar รายเดือน (legend Complete/In Progress/New) | Use Case | enumerate มิติ (เดือน × สถานะ) |
| CD3 | SLA Performance: นับ InSLA เมื่ออยู่ในเวลา, OverSLA เมื่อเกิน + Avg Response Time | BVA | เวลามีขอบ (ก่อน/เท่ากับ/เกิน SLA deadline) |
| CD4 | Work Order Status Overview: Total = ผลรวม Complete + In Progress + New | Use Case | ตรวจความสัมพันธ์ผลรวม |
| CD5 | Empty state: เมื่อไม่มี Work Order → ทุกค่าเป็น 0, chart ว่าง | EP | 2 กลุ่ม (มีข้อมูล / ไม่มีข้อมูล) |
| CD6 | Real-time: เมื่อมี Work Order ใหม่ ตัวเลขบน Dashboard อัปเดต | State Transition | สถานะข้อมูลเปลี่ยน (0 → มีค่า) ตาม event สร้าง WO |
| CD7 | RBAC: เฉพาะ role ที่มีสิทธิ์เห็น Case Dashboard | EP | 2 กลุ่ม (มีสิทธิ์/ไม่มีสิทธิ์) |
| CD8 | Case Dashboard V2.0: period toggle Monthly ↔ Daily (2 มุมมองเวลา) | State Transition | มี 2 สถานะ (Monthly/Daily) เปลี่ยนตาม action กดปุ่ม — ยืนยันจาก Architectural Doc §06 |
| CD9 | Case Dashboard V2.0: exported data — ดาวน์โหลดรายงาน, generate < 60 วิ | Use Case + BVA | format/ขอบเขต (enumerate) + เวลา generate (ขอบ 60 วิ) — ยืนยันจาก Architectural Doc §06 |

---

## B. Test Cases (ย่อ — รายละเอียดเต็มอยู่ใน xlsx)

> 🔒 = blocked on Hidden Assumption · ✅exec = รันได้ทันทีกับ build ปัจจุบัน

### Product Dashboard
| TC ID | Tested | Act (1 action) | Expected (ย่อ) | Type | สถานะ |
|---|---|---|---|---|---|
| PD1-TC1 | PD1 | เปิด `/cms/products/dashboard` (v3) | เห็น 4 KPI card: Products=1,280 / Spare Parts=5,640 / Ordering=84 / Total Pending=23 พร้อม sub-label | POSITIVE | ✅exec |
| PD2-TC1 | PD2 | ดูการ์ด Products (+12%) | badge trend "+12% From last month" เป็น**สีเขียว** | POSITIVE | ✅exec |
| PD2-TC2 | PD2 | ดูการ์ด Total Pending (-3%) | badge trend "-3% From last month" เป็น**สีแดง** | NEGATIVE | ✅exec |
| PD3-TC1 | PD3 | ดู section Overview | เห็น 5 โมดูล: Product Stock 9,850 / Spare Part Stock 4,320 / Customers 2,450 / Appointments 52 / Package & Services 84 | POSITIVE | ✅exec |
| PD4-TC1 | PD4 | ดู Top Ordered | 6 แถวเรียงจำนวนสั่งมาก→น้อย (182→144→121→98→76→65) อันดับ 1 = Industrial Router X1 | POSITIVE | ✅exec |
| PD4-TC2 | PD4 | มีสินค้าถูกสั่ง > 6 รายการ | แสดงเฉพาะ Top 6 เท่านั้น | POSITIVE | 🔒 (Q1) |
| PD5-TC1 | PD5 | มี spare part 12 รายการต่ำกว่า min stock | Inventory Alert แสดง "12 spare parts below minimum stock level" (แถบแดง) | POSITIVE | ✅exec (ค่าปัจจุบัน) |
| PD5-TC2 | PD5 | spare part มี stock = min พอดี | ไม่ถูกนับใน low stock alert | NEGATIVE | 🔒 (Q5) |
| PD5-TC3 | PD5 | spare part มี stock > min | ไม่ถูกนับใน low stock alert | NEGATIVE | 🔒 (Q5) |
| PD6-TC1 | PD6 | ดู Estimated Revenue | donut "This Month" + bar Product Sales 82% / Service Revenue 64% | POSITIVE | 🔒 (Q6) |
| PD7-TC1 | PD7 | service status = Completed | badge "Completed" สีเขียว (เช่น Network Maintenance) | POSITIVE | ✅exec |
| PD7-TC2 | PD7 | service status = In Progress | badge "In Progress" สีส้ม | POSITIVE | ✅exec |
| PD7-TC3 | PD7 | service status = Pending | badge "Pending" สีแดง | POSITIVE | ✅exec |
| PD8-TC1 | PD8 | จาก v3 กดปุ่ม v1 | เปลี่ยนเป็น layout เรียบ (Total Products 128, Active Services 42) | POSITIVE | ✅exec |
| PD8-TC2 | PD8 | จาก v1 กดปุ่ม v2 | เปลี่ยนเป็น layout rich (Products 1,280, Top Ordered) | POSITIVE | ✅exec |
| PD8-TC3 | PD8 | จาก v2 กดปุ่ม v3 | แสดง layout rich (default) | POSITIVE | ✅exec |
| PD9-TC1 | PD9 | กดปุ่ม Export Report | ระบบสร้างไฟล์รายงานในรูปแบบที่กำหนด (PDF/Excel) ดาวน์โหลดได้ | POSITIVE | 🔒 (Q2) |
| PD9-TC2 | PD9 | กด Export Report (วัดเวลา) | รายงาน generate เสร็จ < 60 วินาที | POSITIVE | 🔒 (Q2) |
| PD10-TC1 | PD10 | login ด้วย role ที่มีสิทธิ์ (เช่น Supervisor) | เมนู Dashboard + หน้า Product Dashboard เปิดได้ | POSITIVE | 🔒 (Q8) |
| PD10-TC2 | PD10 | login ด้วย role ที่ไม่มีสิทธิ์ | ไม่เห็นเมนู / เข้าหน้าไม่ได้ (เด้ง/403) | NEGATIVE | 🔒 (Q8) |

### Case Dashboard
| TC ID | Tested | Act (1 action) | Expected (ย่อ) | Type | สถานะ |
|---|---|---|---|---|---|
| CD1-TC1 | CD1 | เปิด Case Dashboard (`/cms/`) | เห็น 4 การ์ด: Total / Censor / CCTV / Traffic | POSITIVE | ✅exec |
| CD1-TC2 | CD1 | มี WO หลายประเภทในระบบ | Total = Censor + CCTV + Traffic (ผลรวมตรง) | POSITIVE | 🔒 (Q9) |
| CD2-TC1 | CD2 | ดู Work Order in Monthly Summary | bar chart รายเดือน Jan–Jun 2026 + legend Complete/In Progress/New | POSITIVE | ✅exec (โครงสร้าง) |
| CD3-TC1 | CD3 | WO ปิดงานก่อนครบ SLA | ถูกนับเป็น InSLA, % InSLA เพิ่ม | POSITIVE | 🔒 (Q10) |
| CD3-TC2 | CD3 | WO ปิดงานตรงเวลา SLA พอดี | นับเป็น InSLA หรือ OverSLA (ตามนิยาม boundary) | POSITIVE | 🔒 (Q10) |
| CD3-TC3 | CD3 | WO ปิดงานเกิน SLA | ถูกนับเป็น OverSLA, % OverSLA เพิ่ม | NEGATIVE | 🔒 (Q10) |
| CD3-TC4 | CD3 | มี WO ที่มี response time | Average Response Time = ค่าเฉลี่ยที่คำนวณถูกต้อง (ไม่ใช่ 0 min) | POSITIVE | 🔒 (Q10) |
| CD4-TC1 | CD4 | มี WO กระจายหลายสถานะ | Work Order Status Overview: Total = Complete + In Progress + New + % ต่อสถานะถูกต้อง | POSITIVE | 🔒 (Q9) |
| CD5-TC1 | CD5 | เปิด Case Dashboard ขณะยังไม่มี WO | ทุกการ์ด = 0, chart ว่าง, SLA 0%/0%, "0min Average Response Time" | POSITIVE | ✅exec (สถานะปัจจุบัน) |
| CD6-TC1 | CD6 | สร้าง Work Order ใหม่ 1 ใบ | การ์ด Total +1 และ New +1 บน Dashboard (รีเฟรช/real-time) | POSITIVE | 🔒 (Q7,Q9) |
| CD7-TC1 | CD7 | login role ที่มีสิทธิ์ | เมนู Case Dashboard เปิดได้ | POSITIVE | 🔒 (Q8) |
| CD7-TC2 | CD7 | login role ที่ไม่มีสิทธิ์ | ไม่เห็นเมนู / เข้าไม่ได้ | NEGATIVE | 🔒 (Q8) |
| CD8-TC1 | CD8 | จาก Monthly view กดปุ่มเปลี่ยนเป็น Daily | chart/data เปลี่ยนเป็น daily breakdown (เช่น รายวัน) | POSITIVE | 🔒 (V2.0 deploy) |
| CD8-TC2 | CD8 | จาก Daily view กดปุ่มกลับ Monthly | chart กลับเป็น stacked bar รายเดือน Jan–Jun | POSITIVE | 🔒 (V2.0 deploy) |
| CD9-TC1 | CD9 | กดปุ่ม Export บน Case Dashboard | ระบบสร้างไฟล์รายงาน ดาวน์โหลดได้ | POSITIVE | 🔒 (Q2, V2.0 deploy) |
| CD9-TC2 | CD9 | กด Export (วัดเวลา) | รายงาน generate เสร็จ < 60 วินาที | POSITIVE | 🔒 (Q2, V2.0 deploy) |

---

## C. Test Scenarios (E2E flows)

### Product Dashboard
**PD_TS01 — View full dashboard (Success)**
1. PD10-TC1 — login role มีสิทธิ์ + เปิด Product Dashboard
2. PD1-TC1 — KPI cards 4 ใบ
3. PD3-TC1 — Platform Capabilities 5 โมดูล
4. PD4-TC1 — Top Ordered เรียงถูก
5. PD7-TC1 — Recent Services status
→ Expected: หน้า Product Dashboard (v3) render ครบทุก section ถูกต้อง

**PD_TS02 — Version toggle (Success)**
1. PD8-TC1 — v3 → v1 (layout เรียบ)
2. PD8-TC2 — v1 → v2 (layout rich)
3. PD8-TC3 — v2 → v3 (default)
→ Expected: layout สลับตามปุ่มทุกครั้ง ไม่ค้าง/ไม่ error

**PD_TS03 — Export report (Success)** 🔒
1. PD1-TC1 — เปิด dashboard
2. PD9-TC1 — Export Report ได้ไฟล์
3. PD9-TC2 — เสร็จ < 60 วิ
→ Expected: ดาวน์โหลดรายงานสำเร็จภายในเวลา BRD

**PD_TA01 — Unauthorized access (Alternative)** 🔒
1. PD10-TC2 — login role ไม่มีสิทธิ์ → เข้าไม่ได้
→ Expected: ถูกปฏิเสธการเข้าถึง

**PD_TA02 — Inventory alert threshold (Alternative)**
1. PD10-TC1 — login + เปิด dashboard
2. PD5-TC1 — มีของต่ำกว่า min → แสดง alert
→ Expected: Inventory Alert แสดงจำนวนที่ต่ำกว่า min ถูกต้อง

### Case Dashboard
**CD_TS01 — Empty state (Success, รันได้ทันที)**
1. CD7-TC1 — login + เปิด Case Dashboard
2. CD1-TC1 — เห็น 4 การ์ด (=0)
3. CD5-TC1 — ทุกค่าเป็น 0, chart ว่าง
4. CD2-TC1 — โครงสร้าง chart รายเดือนถูกต้อง
→ Expected: Dashboard render zero-state ครบถ้วน ไม่ error

**CD_TS02 — With data populated (Success)** 🔒
1. CD7-TC1 — login + เปิด
2. CD1-TC2 — Total = ผลรวมประเภท
3. CD4-TC1 — Status Overview ผลรวมถูก
4. CD3-TC1 — InSLA นับถูก
5. CD2-TC1 — bar chart มีค่าแต่ละเดือน
→ Expected: ตัวเลขทุก panel สอดคล้องกับ WO จริงในระบบ

**CD_TA01 — Unauthorized access (Alternative)** 🔒
1. CD7-TC2 — login role ไม่มีสิทธิ์ → เข้าไม่ได้
→ Expected: ถูกปฏิเสธการเข้าถึง

**CD_TA02 — Export Case Dashboard (Alternative)** 🔒 (V2.0 deploy + Q2)
1. CD7-TC1 — login role มีสิทธิ์ + เปิด Case Dashboard
2. CD9-TC1 — กด Export → ได้ไฟล์รายงาน
3. CD9-TC2 — เสร็จ < 60 วิ
→ Expected: ดาวน์โหลด Case Dashboard report สำเร็จภายในเวลา BRD

**CD_TA03 — Period toggle Monthly/Daily (Alternative)** 🔒 (V2.0 deploy)
1. CD7-TC1 — login + เปิด Case Dashboard (Monthly view default)
2. CD8-TC1 — เปลี่ยนเป็น Daily view
3. CD8-TC2 — กลับ Monthly view
→ Expected: chart สลับระหว่าง daily/monthly ได้ถูกต้องทั้งสองทิศทาง

---

## D. Hidden Assumptions (→ po-questions.json) — propose-and-confirm

| ID | 🔴/🟠 | หัวข้อ | ✅ ข้อเสนอ (assume) | กระทบ |
|---|---|---|---|---|
| Q1 | 🟠 | Product Dashboard: เวอร์ชัน UI final | v3 (rich) คือ final · v1/v2 เป็น draft ที่จะถูกถอด | PD8, PD_TS02 |
| Q2 | 🔴 | Export Report: รูปแบบ + ขอบเขต (Product + Case) | export เป็น **Excel (.xlsx)** ทั้งหน้า, ไม่มี filter, generate < 60 วิ · Architectural Doc §06 ยืนยัน Case Dashboard V2.0 มี exported data (format/scope ยังรอ PO) | PD9, PD_TS03, CD9, CD_TA02 |
| Q3 | 🔴 | Product Dashboard ใช้ mock data | ตัวเลขปัจจุบันเป็น **mock** ยังไม่ wire DB จริง — TC ค่าจริงรอ dev ต่อ data | PD1,PD3,PD4,PD6 |
| Q4 | 🟠 | Date range / tenant filter | **ไม่มี** filter ช่วงเวลา/บริษัทในเฟสนี้ (แสดงรวมทั้งหมด, ค่า default) | ทุก TC แสดงผล |
| Q5 | 🟠 | Low Stock threshold | นับ low stock เมื่อ **stock < minimum** (เท่ากับ min ไม่ถือว่า low) | PD5 |
| Q6 | 🟠 | Estimated Revenue logic | "฿920 This Month" เป็น **placeholder** · สูตร/หน่วยจริงรอ PO กำหนด | PD6 |
| Q7 | 🟠 | Real-time refresh | Dashboard อัปเดตเมื่อ **reload หน้า** (ยังไม่มี websocket auto-refresh) | CD6 |
| Q8 | 🔴 | RBAC dashboard | Role ที่เห็น Dashboard = **Supervisor / Team Lead / Auditor** · Agent/Customer/Technician ไม่เห็น | PD10, CD7 |
| Q9 | 🔴 | Case Dashboard ประเภทเหตุ | Censor/CCTV/Traffic เป็น **category ตายตัวจาก BMA** · ถ้า dynamic ตาม Case Type ต่อบริษัท ต้องปรับ TC | CD1,CD4,CD6 |
| Q10 | 🔴 | นิยาม InSLA/OverSLA/Avg Response Time | InSLA = ปิดงาน **ภายใน** SLA deadline · เท่ากับ deadline พอดี = ยังถือ InSLA · OverSLA = เกิน · Avg Response = เวลาเฉลี่ยจากสร้าง→ตอบรับ | CD3 |

---

## E. Self-check (Definition of Done)

| ข้อ | สถานะ |
|---|---|
| แปลง Needs → Business Conditions เป็นข้อ ๆ | ✅ (PD1–10, CD1–7) |
| เลือกเทคนิคถูกชนิดต่อเงื่อนไข | ✅ |
| BVA ครบ น้อยกว่า/เท่ากับ/มากกว่า | ✅ บางส่วน (PD5: <,=,> · CD3: ก่อน/เท่ากับ/เกิน) — ⚠️ ค่าจริงรอ Q5/Q10 |
| State Transition ครบเส้น (รวมย้อนกลับ/self-loop/system actor) | ✅ PD8 (v3→v1→v2→v3 ครบวง) · CD6 (system actor: สร้าง WO) |
| ทุก TC มี 4 ส่วน (Arrange/Act/Tested/Expected) | ✅ (ดู xlsx) |
| มีทั้ง Success + Alternative Scenario | ✅ (PD_TS×3 + PD_TA×2 · CD_TS×2 + CD_TA×3) |
| Scenario ไม่มีเงื่อนไขขัดแย้ง | ✅ |
| Test Data เป็น Real Example ไม่มีคำว่า Test/ทดสอบ | ✅ |
| ระบุ Hidden Assumption + ถาม PO | ✅ (Q1–Q10) |
| ติด ID + ทำเครื่องหมายเคสที่ block | ✅ (🔒) |

**Blocked on sign-off:** Q2, Q3, Q8, Q9, Q10 (🔴) — TC ค่าจริง/RBAC/SLA/Export ทั้งหมดรอคำตอบ PO + dev wire data
**V2.0 deploy block:** CD8 (period toggle), CD9 (export), CD_TA02, CD_TA03 — รอ V2.0 deploy บน STG ยืนยัน (confirmed exist from Architectural Doc §06 แต่ยังไม่ verify บน STG)
