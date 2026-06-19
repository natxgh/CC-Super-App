# CC Super App — Dashboard Requirements (Explored from STG)

> เก็บจากการเข้าไปเล่นจริงบน STG เมื่อ 2026-06-14
> Environment: `https://skyai-cloud-cc-stg.metthier.ai:65000` · App version v0.26.3
> เทียบกับ BRD v0.3 (FR-07 Reporting & Dashboard, §3.5.7 Executive Outcomes) + Grooming §7 Dashboard & Analytics
> ขอบเขต: 2 Dashboard ที่ร้องขอ — **Product Dashboard** + **Case Dashboard (Work Order Summary)**

---

## สรุปสถานะ (Executive Summary)

| Dashboard | URL | สถานะข้อมูล | สถานะ Dev | Priority (Grooming) |
|---|---|---|---|---|
| **Product Dashboard** | `/cms/products/dashboard` | **Mock/Static data** (ตัวเลข hardcode) | มี version toggle **v1 / v2 / v3** — ยังอยู่ระหว่าง iterate UI | **P4** ("อยู่ระหว่าง Develop") |
| **Case Dashboard** (Work Order Summary) | `/cms/` (หน้า Workspace home) | **Live data — ว่างทั้งหมด (เป็น 0)** | Layout เสร็จ แต่ยังไม่ wire data / ยังไม่มี Work Order | **P3** ("มีอยู่แล้วใน STG — Verify + Report") |

> ⚠️ ทั้ง 2 Dashboard ยังไม่ production-ready: Product = mock data, Case = ยังไม่มีข้อมูลจริงให้ verify ตัวเลข

---

## 1. Product Dashboard (`/cms/products/dashboard`)

**Header:** "Product Management Dashboard — Overview of products, services, inventory, requests, and customer operations."
**Controls มุมขวาบน:** ปุ่มสลับ **version (v1 / v2 / v3)** + ปุ่ม **Export Report**

> 🔎 พบ **3 เวอร์ชัน layout** (dev กำลัง iterate ดีไซน์) — เป็นปุ่ม toggle ที่สลับ design ไปมา
> - **v1** = layout เรียบ (4 การ์ดตัวเลขล้วน + Top Products + Recent Services + Low Stock Alert + Revenue)
> - **v2 / v3** = layout เต็ม (rich) ตามรายละเอียดด้านล่าง — เป็น default ตอนเปิดหน้า

### 1.1 KPI Cards (แถวบน — v2/v3)
| Card | ค่าที่เห็น (mock) | Sub-metric | หมายเหตุ |
|---|---|---|---|
| Products | 1,280 | +12% From last month · "Total active products" | มี trend % เทียบเดือนก่อน |
| Spare Parts | 5,640 | +5% From last month · "Spare parts in stock" | |
| Ordering | 84 | +8% From last month · "Pending Orders" | |
| Total Pending | 23 | -3% From last month · "Waiting for approval" | trend ติดลบ = สีแดง |

### 1.2 Overview — "Platform Capabilities"
การ์ดสรุปจำนวน Active records ต่อโมดูล:
- Product Stock — 9,850
- Spare Part Stock — 4,320
- Customers — 2,450
- Appointments — 52
- Package & Services — 84

### 1.3 Top Ordered ("Most ordered spare parts this month")
List 6 อันดับ: ชื่อสินค้า + "Ordered N times" + Unit price (฿)
ตัวอย่าง: 1. Industrial Router X1 (182 ครั้ง, ฿12,500) … 6. Access Point Pro (65 ครั้ง, ฿7,800)

### 1.4 Inventory Alert ("Low stock and pending requests")
- แถบแดง: "12 spare parts below minimum stock level"
- แถบแดงเข้ม: "5 purchase requests waiting for approval"

### 1.5 Estimated Revenue ("Monthly operational revenue")
- Donut chart: This Month ฿920 (ค่า mock ดูผิดปกติ — น่าจะ placeholder)
- Progress bar: Product Sales 82% · Service Revenue 64%

### 1.6 Recent Services ("Latest service records")
List: ชื่องาน + Agent + วันที่ + Status badge (Completed / In Progress / Pending)
ตัวอย่าง: Network Maintenance (Michael T., 2026-05-15, Completed)

### 1.7 v1 layout (เวอร์ชันเรียบ) — สิ่งที่ต่าง
- 4 การ์ด: Total Products 128 · Active Services 42 · Spare Parts (Inventory) 560 · Pending Requests 18
- Top Products (This Month): #1 Product A (Requests 120, ฿1,500) …
- Recent Services (Repair Laptop / Install Software / Replace Battery)
- Low Stock Alert: "12 items are below minimum stock level"
- Revenue (This Month): ฿245,000

---

## 2. Case Dashboard — "Work Order Summary" (`/cms/`)

**ตำแหน่ง:** เมนูซ้าย → Cases → **Case Dashboard** (เปิดเป็นหน้า Workspace home `/cms/`)
**Header:** "Work Order Summary"
**สถานะ:** Live data จริง แต่ **ยังเป็น 0 ทั้งหมด** (ยังไม่มี Work Order ในระบบ STG)

### 2.1 KPI Cards (แถวบน) — แยกตามประเภท Work Order
| Card | ค่า |
|---|---|
| Total | 0 |
| Censor | 0 |
| CCTV | 0 |
| Traffic | 0 |

> 💡 Censor / CCTV / Traffic = ประเภทเหตุ (Case Type) ที่ยกมาจากโปรเจ็กต์ BMA — ควรถาม PO ว่าเป็น category fix หรือ dynamic ตาม Case Type

### 2.2 Work Order in Monthly Summary (Bar Chart)
- กราฟแท่งแบบ stacked รายเดือน (Jan 2026 → Jun 2026)
- Legend: **Complete (เขียว) / In Progress (น้ำเงิน) / New (เหลือง)**
- ปัจจุบันทุกเดือน = 0

### 2.3 SLA Performance (panel ขวาบน)
- ตัวเลขรวม "On Time" = 0
- **InSLA %** = 0%
- **OverSLA %** = 0%
- **Average Response Time** = 0 min

### 2.4 Work Order Status Overview (panel ขวาล่าง)
- Total = 0
- Breakdown: **Complete / In Progress / New** (มี count + % ต่อสถานะ)
- แสดงเป็นการ์ดสี + progress bar % ต่อสถานะ

---

## 3. Mapping กับ BRD + Grooming (Gap / ข้อสังเกต)

### 3.1 ตรงกับ BRD
- ✅ **FR-07 Reporting & Dashboard** — มี Dashboard ตามโมดูล (Product, Case)
- ✅ BRD §Call Center / Contact Center Dashboard ระบุ metric: Agent Performance, Queue Performance, Inbound/Outbound Trend, CDR → **ยังไม่พบใน 2 Dashboard นี้** (น่าจะเป็น Dashboard ตัวที่ 3 = เมนู "Dashboard" ใต้ Workspace — นอก scope รอบนี้)
- ✅ Case Dashboard ครอบคลุม SLA Monitoring (InSLA/OverSLA/Avg Response Time) — ตรงกับ BRD §3.2.5 SLA Visibility และ Grooming §5.4 SLA Monitoring

### 3.2 BRD §3.5.7 Executive Outcomes (KPI ที่ต้อง verify)
| KPI (BRD target) | Dashboard รองรับ? |
|---|---|
| Dashboard Availability 100% | ต้องทดสอบ load/uptime |
| **Report Generation Time < 1 Minute** | มีปุ่ม Export Report (Product) — ต้องทดสอบเวลา generate |
| Operational KPI Visibility = Real-Time | Case Dashboard ใช้ live data; Product ยัง mock → ต้องยืนยันว่า refresh real-time |

### 3.3 Gap / สิ่งที่ต้องถาม PO (สรุปเป็น po-question)
1. Product Dashboard ใช้ **mock data** — ตัวเลขจริงจะ wire จาก data source ใดเมื่อไหร่? เวอร์ชัน UI ไหน (v1/v2/v3) คือ final?
2. ปุ่ม **Export Report** export เป็นรูปแบบใด (PDF/Excel/CSV)? ขอบเขตข้อมูล (filter ช่วงเวลา)? — BRD target generate < 1 นาที
3. Case Dashboard: ประเภท **Censor / CCTV / Traffic** เป็น fix หรือ dynamic ตาม Case Type ของแต่ละบริษัท?
4. มี **date range filter / company (tenant) filter** ในแต่ละ Dashboard หรือไม่? (ตอนนี้ไม่เห็น control filter)
5. นิยาม **InSLA / OverSLA / Average Response Time** คำนวณจากอะไร (จาก SLA per step หรือ SLA รวมทั้ง Case)?
6. "Estimated Revenue ฿920" ใน Product Dashboard — placeholder หรือมี logic จริง? หน่วย/สูตรคำนวณ?
7. Real-time refresh: ข้อมูลอัปเดตอัตโนมัติ (polling/websocket) หรือต้อง refresh เอง?
8. สิทธิ์การเข้าถึง (RBAC): Role ใดเห็น Dashboard ใดได้บ้าง (Agent/Supervisor/Auditor)?
9. Contact Center Dashboard (Agent/Queue/Inbound-Outbound/CDR ตาม BRD) อยู่ที่เมนูไหน และอยู่ใน scope รอบนี้หรือไม่?
10. ตัวเลข trend % (เช่น +12% From last month) คำนวณเทียบ period ใด และแหล่งข้อมูล?
