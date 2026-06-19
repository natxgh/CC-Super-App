# CC Super App — Grooming Meeting Requirements Summary
> ถอดเสียงจาก "CC Super App Grooming.mp4" (2 ชม. 3 นาที)
> ถอดโดย mlx-whisper large-v3-turbo บน Apple M3 · สรุปโดย Claude Opus
> วันที่ประชุม: ก่อน 11/06/2026

---

## 1. Contact Management

### 1.1 Customer Profile (Dynamic Contact)
- แสดงข้อมูลลูกค้าแบบ **Dynamic** — toggle เปิด/ปิด field ได้ per company (ไม่ใช่ per user)
  - ตัวอย่าง: Sky AI ไม่ต้องการแสดง เบอร์โทร / บัตรประชาชน / ที่อยู่ → ปิดได้
- **Custom Field** — เพิ่ม field ใหม่โดยไม่ต้องแก้โค้ด เช่น Company, Employee ID, เลขงานอดิเรก
  - เพิ่มแล้วขึ้น field ทันทีในทุก customer profile ของบริษัทนั้น
  - User ที่ไม่มีข้อมูล field ใหม่ → field จะว่างเปล่า (ไม่ error)
- **Customer 360 View** — หน้าเดียวดูได้:
  - Profile + ข้อมูลติดต่อ
  - **Products** ที่ลูกค้าถือ (ต้องมี Serial Number ผูก)
  - **Services** ที่ลูกค้าใช้
  - **Case History** — เคสที่เคยแจ้งทั้งหมด
  - **Appointment** — นัดหมายที่มี

### 1.2 Customer Appointment
- สร้างนัดหมาย (Agent/Staff ตั้งนัดให้ลูกค้า) — Schedule ด้านบน Customer Profile
- วัตถุประสงค์นัด: Follow Up, ขายสินค้า, บริการหลังการขาย ฯลฯ
- **Confirm Appointment** — ต้อง Confirm กับลูกค้าก่อน → Status เปลี่ยนเป็น "ยืนยันนัดหมาย"
- **⚠️ ยังไม่มี Reminder** (Feature Reminder ก่อน Schedule Time ยังไม่ implement)
- Status: รอยืนยัน → ยืนยันนัดหมาย

---

## 2. Dynamic Forms & Custom Fields

### 2.1 Custom Field (Customer Profile)
- Config ระดับ Company (ไม่ใช่ระดับ User) — เปลี่ยนครั้งเดียวใช้กับลูกค้าทุกราย
- Toggle เปิด/ปิด field มาตรฐาน (Personal Details, Address, Preferences)
- เพิ่ม Custom Field ได้ผ่าน Dynamic Form Builder

### 2.2 Dynamic Form (Case Management)
- ใช้กับ **Case/Ticket** — แต่ละ Case Type มี Form ต่างกัน
  - เช่น Case ซ่อมกล้อง → มี field: รุ่นกล้อง, ยี่ห้อ, รหัสกล้อง
  - Case Complaint → มี field: ช่องทางร้องเรียน, รายละเอียด
- Dynamic Form Builder: 15 field types (Text, Number, Date, Single-Select, Multi-Checkbox, Image, ฯลฯ)
- กำหนด Form Name, Grid Columns, Required/Optional, Column Span per field
- Import/Export schema (JSON), Preview

---

## 3. Product & Inventory Management

### 3.1 Product Inventory
- จัดการสินค้า (เพิ่ม/แก้ไข/ลบ) — มี Detail, รูปภาพ, Model Year
- View Mode: Card / List / Small Card
- Search + Filter ได้
- **Serial Number** ต้องสร้างก่อน ถึงจะผูก Product กับ Customer ได้
  - ผูกผ่าน Product Stock Management (มีเมนู SN)
  - ในอนาคต Roadmap: สแกน Barcode แทนการพิมพ์ SN

### 3.2 Spare Parts
- หลักการเดียวกับ Product (เพิ่ม/แก้ไข/ลบ/รูปภาพ)
- ใช้สำหรับช่างออกซ่อมงาน (เบิก Spare Part สำหรับงาน)

### 3.3 Product Stock & Spare Parts Stock
- ติดตาม Stock จำนวนสินค้า/อะไหล่คงเหลือ
- **Low Stock Alert** — เตือนเมื่อสินค้าใกล้หมด (มีในบางหน้าจอ)
- **Out of Stock** — เมื่อหยิบสินค้าจาก Order แล้วไม่มีสต็อก ระบบเตือนทันที

---

## 4. Order & Dispatch Management

### 4.1 Order Workflow (Spare Part Order)
- เปิด Order ได้จากใน Case (เจ้าหน้าที่เบิก Spare Part สำหรับงานซ่อม)
- **Workflow 7 ขั้นตอน (Standard):**
  1. คำสั่งซื้อ (New)
  2. ส่งคำขอ (Request)
  3. รับการอนุมัติ (Approved)
  4. หยิบสินค้า (Pick)
  5. ส่งออกจากคลัง (Dispatch)
  6. จัดส่ง (Delivery/Ship)
  7. เสร็จสิ้น (Complete)

- **SLA ต่อ Step** — กำหนดเวลาแต่ละขั้น (เช่น อนุมัติภายใน X นาที)
- **PIC per Step** — กำหนดว่าใคร/กลุ่มไหน Action ได้ในแต่ละขั้น
  - ถ้าชื่อไม่อยู่ใน PIC → ปุ่มไม่ขึ้น (ทำไม่ได้)

### 4.2 Order Detail
- Order Number, วันที่ขอ, Title
- Order Items: รายการสินค้า + จำนวน + ราคา
- Shipping Info: ส่งไปที่ไหน / ผ่านขนส่งไหน (Kerry, Flash, Grab, Pick Up)
- Chat Box: บันทึกบทสนทนา/ข้อมูลใน Order
- **แก้ไขได้เฉพาะก่อน Submit** — หลัง Submit ล็อก (แก้ได้แค่ Title + บันทึกข้อความ)
- Cancel Order ได้ (ถ้ายังไม่ Approved)
- Print Order ได้

### 4.3 Order Rules
- หลัง Approved → แก้ Order Items ไม่ได้ (ต้อง Cancel แล้วสร้างใหม่)
- เพิ่ม/ลดจำนวนสินค้าใน Order ได้เฉพาะตอน Step แรก (คำสั่งซื้อ)

---

## 5. Case & Ticket Management

### 5.1 Case/Ticket/Work Order Creation
- สร้างได้จากหน้า Case List, Assignment Board
- ข้อมูลที่กรอก:
  - **ประเภทเหตุ** (Case Type) → ดึง Dynamic Form ตาม Type
  - **ช่องทางการติดต่อ** (เบอร์โทร → Auto-link Customer Profile)
  - **พื้นที่เกิดเหตุ** (Zone/Area) — ผูกกับ Zone Report
  - **Dynamic Form fields** ตาม Case Type
  - แนบไฟล์ได้ (รูปภาพ, เอกสาร) — ⚠️ ไม่รับไฟล์นามสกุลบางอัน (พบ bug)
- ผูก Case กับ Customer Profile ผ่านเบอร์โทร
  - ถ้าหาไม่เจอ → ขึ้นว่าไม่มี ให้เลือก Link หรือ Create Profile ใหม่

### 5.2 Case Status Workflow (Dynamic)
ระบบใช้ **Dynamic Workflow Engine** — กำหนด State ตาม SOP ลูกค้า:
- สร้างเหตุใหม่
- กระจายงาน (Assignment)
- กำลังดำเนินการ
- ขออนุมัติปิดงาน
- เสร็จสิ้น

> ⚠️ ปัจจุบัน STG Workflow ตั้งให้เหมือนกันหมด 6 Step (แต่ระบบรองรับ Dynamic)

### 5.3 Assignment Board (Case/Work Order)
- View: Kanban (กลุ่มตามสถานะ) หรือ List
- กลุ่มสถานะ: เหตุใหม่ / มอบหมายแล้ว / กำลังดำเนินการ / เสร็จสิ้น
- **Real-time Notification** — เมื่อมีคนอื่น Action ใบงาน จะ Notify ทุก Account ที่เกี่ยวข้อง
- กรองงาน, ค้นหา, เปิด Case Detail ได้

### 5.4 Case Detail
- Workflow timeline (สี: เทา = workflow, น้ำเงิน = SLA)
- **SLA Monitoring** — แต่ละ Step มีเวลากำหนด, เกิน = แสดงสีแดง (Over SLA)
- Priority Level ของ Case
- ข้อมูลผู้แจ้ง + ผู้สั่งงาน + Staff ที่รับงาน
- Event History — ประวัติการเปลี่ยนแปลงแบบ Chronological
- แนบไฟล์/รูป/ข้อความเพิ่มได้ตลอด
- Close Case: กด "ขออนุมัติปิดงาน" → แนบไฟล์ปิดงาน → อนุมัติ → เสร็จสิ้น
  - ปิดงานได้จากทั้ง Web App และ Mobile App (โดย Staff)

### 5.5 Case Zone Mapping
- Case/Ticket ผูกกับ Zone (พื้นที่รับผิดชอบ)
- ใช้สำหรับ Report แยก Zone (เช่น BMA: 7 โซน)

### 5.6 Case ↔ Dispatch (Mobile App)
- ปัจจุบัน: กระจายงานไป **MadLink** (Mobile App คู่กัน) ⚠️ CC Super App ยังไม่มี Mobile App ของตัวเอง
- **Scope: ยังไม่ทดสอบ Dispatch ไป Mobile App** ในรอบนี้ (ข้ามไปก่อน)
- Case Management เคย Tier แล้วในโปรเจ็กต์ BMA — มีอาจมี Bug แต่ Feature เท่ากัน

---

## 6. Workflow Engine

- **Dynamic Workflow** — กำหนด State ของ Job ได้ตาม SOP ลูกค้า
  - ใช้กับ: Case, Ticket, Order, Spare Part
- ดูได้ที่เมนู Workflow (View/Edit)
- กำหนด PIC/Group per Step (ใครทำได้, ใคร Approve ได้)
- **SLA ต่อ Step** — กำหนดเวลาแต่ละช่วง

---

## 7. Dashboard & Analytics

### 7.1 Case Dashboard
- **มีอยู่แล้วใน STG** — น่าจะเสร็จแล้ว
- Case Performance: จำนวน Case, Handled ดีแค่ไหน
- (ยังไม่ได้ Demo รายละเอียด)

### 7.2 Product Dashboard
- **อยู่ระหว่าง Develop** — คาดว่าจะเสร็จเร็วๆ นี้
- (ยังไม่ได้ Demo)

### 7.3 สรุปจากมีตติ้ง
> "น่าจะยังไม่อยู่ใน P1-P4 น่าจะมี Dashboard ของ Case ที่เสร็จแล้ว"

---

## 8. Management & Configuration

### 8.1 User Management
- Create User, กำหนด Role (RBAC)
- **Organization: 3 Layer**
  - Level 1: Company (เช่น Sky AI)
  - Level 2: Department (เช่น Technology & Delivery Contact Center)
  - Level 3: Team (เช่น ทีมติดตั้ง, ทีมดูแล)

### 8.2 Unit Management (Responder/Technician)
- Unit = หมายเลข Staff ใน Mobile App (MadLink)
- **Skill Mapping**: ระบุความสามารถ (เช่น ซ่อมกล้อง, ซ่อม Computer)
- **Area Mapping**: พื้นที่ให้บริการ (เช่น กรุงเทพ, เชียงใหม่, ทั้งประเทศ)

### 8.3 Service Type Management
- จัดการ Case Type/Service Type

### 8.4 System Configuration
- ภาษา: ไทย / English / จีน (3 ภาษา)
- UI Mode: Dark / Light
- Responsive Web Design (desktop + mobile browser)

---

## 9. Out of Scope (รอบนี้)

| Feature | เหตุผล |
|---|---|
| Package & Service | ข้ามก่อน (Client ขอ skip) |
| Mobile App (CC Super App) | ยังไม่มี Mobile App ของตัวเอง |
| Dispatch ไป MadLink | ข้ามรอบนี้ |
| Map/GPS | Next Phase |
| IoT Alert | ไม่ได้ใช้ในโปรเจ็กต์นี้ |
| CoPilot / KMS | ยังไม่ใช่ Roadmap รอบนี้ |
| Reminder ก่อน Appointment | ยังไม่มี Feature นี้ |

---

## 10. Priority Matrix (P1–P4)

> จาก Transcript: ระบบส่วนใหญ่เคย Tier ที่ BMA แล้ว — มีแค่ Bug fix + Feature ใหม่บางจุด

| Priority | Feature | เหตุผล |
|---|---|---|
| **P1** | Customer Profile (Create/Update + Dynamic Field) | Core CRM — ทุก Feature อื่นอ้างอิง Customer Profile |
| **P1** | Customer Appointment Management | เชื่อมกับ Customer Profile ใช้บ่อย |
| **P1** | Dynamic Form Builder (Customer Field + Case Form) | Config engine — Case/Order ต้องการก่อน test |
| **P1** | Custom Field Configuration (toggle + add field) | ต้องทำก่อน ถึงจะ test Profile ครบ |
| **P2** | Case / Ticket Creation + Case Detail | เคย Tier แล้ว — ทดสอบ Bug fix + Dynamic Form |
| **P2** | Case Assignment Board (Kanban + Realtime) | Workflow ใหม่ + SLA Monitoring |
| **P2** | Product Inventory (CRUD + Serial Number) | Prerequisite สำหรับ Customer 360 + Order |
| **P2** | Spare Parts Management | ใช้คู่กับ Order |
| **P3** | Order Management (Create → Workflow → Complete) | Workflow ซับซ้อน — ต้อง Prepare Data ก่อน |
| **P3** | Product Stock & Spare Parts Stock Management | ขึ้นอยู่กับ Product/Spare Parts พร้อมก่อน |
| **P3** | Case Dashboard | มีอยู่แล้วใน STG — Verify + Report |
| **P3** | User Management + RBAC | ต้องมีก่อนทดสอบ Role-based access |
| **P4** | Product Dashboard | อยู่ระหว่าง Develop |
| **P4** | Organization + Unit/Skill/Area Management | Config ระดับ System |
| **P4** | Workflow Engine Configuration | Advanced config — ทดสอบหลัง P1-P3 |
| **P4** | Reports (Case + Order) | ต้องมี Data ครบก่อน |

---

## Key Findings จาก Grooming

1. **Data Preparation สำคัญมาก** — ก่อนทดสอบต้องเตรียม:
   - Serial Number ก่อนผูก Product กับ Customer
   - PIC/Group ใน Workflow ก่อนกด Action Order/Case
   - Skill + Area ใน User Management ก่อน Assignment ทำงานได้

2. **Dynamic Workflow** — เซ็ตเป็น Default 6 Step ใน STG ตอนนี้ (แต่ Config ได้)

3. **Bug ที่ทราบ**:
   - แนบไฟล์บางนามสกุลไม่ผ่าน (Case Management)
   - Research Stock Fail เมื่อ Out of Stock ใน Order Pick step

4. **Mobile App** — CC Super App ยังไม่มี Mobile App — Dispatch ยังส่งไปที่ MadLink เท่านั้น

5. **Case Management Tier แล้ว** ที่ BMA Project — อาจมี Bug เล็กน้อยแต่ Feature เท่ากัน
