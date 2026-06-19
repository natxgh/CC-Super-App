# Requirements — Case & Ticket Management (CMS)

> แหล่งที่มา: สำรวจระบบจริงบน STG + เทียบ BRD-Contact Center Super Apps_v0.3 + grooming-requirements.md
> URL ที่สำรวจ: https://skyai-cloud-cc-stg.metthier.ai:65000/cms/case/*
> วันที่สำรวจ: 2026-06-14 · App version: v0.26.3
> ขอบเขตที่ขอ: Add / Update / Delete / Close Case, View Case Life Cycle, Update Case Work Flow (Status) + Event Notification, View Case History / Table List / Search & Filter

---

## 0. สรุป Navigation ที่พบจริง

เมนูกลุ่ม **Cases** (sidebar):
| เมนู | Route | หน้าที่ |
|---|---|---|
| Case List | `/cms/case/history` (label = "Work Order History") | Table/Card list + Search + Status filter + Advanced Filters + Create Work Order |
| Case Assignment | `/cms/case/assignment` | Kanban board (New / Assigned / In-progress / Done) + List view + Add New Case |
| Case Dashboard | (cms dashboard) | Case performance dashboard |
| (Add New Case) | `/cms/case/creation` | ฟอร์มสร้างเคส |
| (Case Detail) | `/cms/case/list` | หน้ารายละเอียดเคส + Lifecycle timeline |

> ⚠️ ศัพท์ในระบบสลับกันระหว่าง **"Case"** กับ **"Work Order"** (หัวข้อหน้า, ปุ่ม "Create Work Order", error "Add Work Order fail") — ใช้ปนกัน

---

## 1. Add Case (สร้างเคส) — `/cms/case/creation`

### 1.1 ฟิลด์ในฟอร์ม
| Field | Required | ชนิด | หมายเหตุ |
|---|---|---|---|
| Types (Case Type) | ✅ | Dropdown ค้นหาได้ | ดึงรายการ Case Type เช่น `1001-Camera Malfunction -Investigation`, `1002-...-Repair`, `1003-...-Service`, `1004-...-Maintenance`, `1005-...-Outsource`, `101-1. Service Request-New Service`, `102-1. Service Request-Appointment` |
| Contact Method | ✅ | Dropdown | ตัวเลือก: **CALL / METTLINK / METTRIQ / IOT-Alert / Other** |
| IoT Device | ⬜ | Text | IoT Device ID |
| IoT Alert Date | ⬜ | DateTime (auto) | เติมเวลาปัจจุบันอัตโนมัติ |
| Case Details (Detail) | ✅ | Textarea | max **4000** ตัวอักษร + character counter |
| Service Center | ✅ | Dropdown ค้นหาได้ | ผูกกับ Zone เช่น `Thailand-Thonburi South Zone-phasicharoen`, `...-nongkhaem` (มี junk option `-string`, `-stringp`) |
| Phone Number | ⬜ | Text | กรอกแล้ว **Auto-link Customer Profile** (panel ขวาเปลี่ยนเป็นโปรไฟล์ลูกค้า + Contact Channels) |
| Event Area | ⬜ | Textarea | สถานที่เกิดเหตุ |
| Attach File | ⬜ | Drag & drop / click | รองรับ **Images, PDF, DOC, DOCX, TXT** — **max 1MB ต่อไฟล์** |
| Priority | (auto) | Badge | Auto-set ตาม Case Type (เช่น 1002-Repair → **High Priority**) |

### 1.2 Panel ขวา (Customer Information)
- Tabs: **Information / Device Info / Copilot / KB / (more)**
- ปุ่ม **Linked Existing** (ค้นหาลูกค้าเดิม) และ **Add Customer** (สร้างโปรไฟล์ใหม่)
- กรอกเบอร์โทรที่ตรงกับลูกค้า → แสดง Customer Profile + Contact Channels (Phone=Primary, Line, Email, Facebook) + tabs Profile/History/Note/Appointment + View Full Profile

### 1.3 Flow การ submit
1. กด **Submit** → เปิด modal สรุป (Case Type, Create By, Priority badge, Case Information, Event Area, Contact, Detail, **Request Schedule Date ***)
2. กด **Confirm**
3. ปุ่มเสริม: **Save As Draft**, ปุ่ม icon เอกสาร (มุมล่างซ้าย — น่าจะเป็น form/template selector)

### 1.4 🐛 BUG ที่พบ (Critical)
- **กด Confirm แล้วบันทึกไม่สำเร็จ** ขึ้น toast แดง **"Add Work Order fail."**
- Console error:
  ```
  ❌ Save case error: null value in column "versions" of relation "tix_cases"
     violates not-null constraint (SQLSTATE 23502)
  ```
- → DB column `versions` เป็น NOT NULL แต่ระบบส่งค่า null → **สร้างเคสใหม่ไม่ได้เลยบน STG ขณะนี้** (Kanban + History ว่างเปล่าทั้งหมด)
- **บล็อก**การทดสอบ flow ปลายน้ำทั้งหมด (Update / Close / Lifecycle ด้วยเคสใหม่)

---

## 2. Case Life Cycle / Case Detail — `/cms/case/list`

### 2.1 Lifecycle timeline (6 steps)
`Received → Assigned → Acknowledged → En Route → On Site → Completed`
- มี checkmark สถานะที่ผ่านแล้ว, จุดสีน้ำเงิน = step ปัจจุบัน, วงกลมว่าง = ยังไม่ถึง
- ตรงกับ grooming: STG ตั้ง Workflow เป็น Default 6 step (ระบบรองรับ Dynamic Workflow)

### 2.2 ส่วนประกอบหน้า Detail
- Header: ชื่อ Case Type, Create Date, Created by, **Priority badge** (Low/High)
- ปุ่ม: **Comment** (มี dropdown), **Edit**, **Attach File**
- Case Information: No #, Types, Service Center, IoT Alert Date, **Update At**, Request Schedule Date *
- Event Area, Contact (Phone Number, Contact Method)
- Detail *
- **Result**: dropdown `Select Result` + Result Details (max 1000 ตัวอักษร) + Attach File → ใช้ตอนปิด/บันทึกผลงาน
- Panel ขวา: Customer Information + tabs (Information / Device Info / **coomon.subcase** ← i18n key ไม่ได้แปล)

### 2.3 🐛 Data-quality issues ที่พบ
- Type แสดง `--undefined`, Create Date / IoT Alert Date = **Invalid Date**, ฟิลด์ส่วนใหญ่ `-`
- Tab `coomon.subcase` = i18n key หลุด (ควรเป็น "Subcase")
- น่าจะเกิดจากข้อมูล draft/เสีย เพราะ creation พัง

---

## 3. Case Assignment Board — `/cms/case/assignment`

- 2 View: **Kanban** / **List**
- คอลัมน์สถานะ Kanban: **New / Assigned / In-progress / Done** (พร้อม badge นับจำนวน)
- Tabs กรองด้านบน: All Cases / New / Assigned / In-progress / Done
- Search Cases + **Advance Filtering** (sic — สะกดผิด "Advancne Filtering" บนปุ่ม)
- ปุ่ม Refresh + **Add New Case**
- grooming: ควรมี **Real-time Notification** เมื่อมีคน action ใบงาน (ต้องทดสอบเพิ่ม)

---

## 4. Case List / Work Order History — `/cms/case/history`

- 2 View: **Card / List** (toggle)
- **Search work order...** + ปุ่ม Search
- **Select Status** (filter ตามสถานะ)
- **Advanced Filters** (modal) — เกณฑ์: Start Date, End Date, Type, Sub-Type, Country, Province, District, Detail (text), Create By (username) → footer: "No filters applied" / Reset All / **Apply Filters (n)**
- ปุ่ม **Create Work Order**
- Empty state: "No entries to show / Create your first work order to get started"

---

## 5. เทียบ BRD (3.1.1 CMS) — Feature ที่ระบุไว้ vs ที่เห็นจริง

| BRD ระบุ | สถานะใน STG |
|---|---|
| Manual Case Creation | ✅ มี (แต่ **save พัง**) |
| Multi-channel / Auto / API Case Creation | ⏭️ Next Phase (ไม่อยู่รอบนี้) |
| Case Metadata: Case ID, Type, Priority, Category, Subcategory, SLA, Due Date, Tags, Custom Fields, Linked Assets, Linked Customers | บางส่วน: Type, Priority(auto), Linked Customer(phone), Custom/Dynamic Form ตาม Type |
| Routing: Skill/Location/Department/Availability/Case-Type Based | ผ่าน Service Center(Zone) + Assignment Board; Round Robin/Load Balance = Next Phase |
| Workflow & Lifecycle (Configurable, BPMN/Rule, Trigger/Action, Approval, Dependency) | Lifecycle 6-step (Dynamic engine), Approval ปิดงาน |
| Status & State Transition (Custom State, Cancel, Audit Trail); Pause/Reopen = Next Phase | ✅ State transition ผ่าน timeline; Audit/History มี |
| Notifications: Email/SMS/In-App/Push | **Next Phase** ตาม BRD; grooming บอกมี Real-time Notification บน board → ต้อง verify |
| SLA Monitoring & Escalation (Definition, Real-time, Visual indicator, Auto-escalation, Reassignment, Alert) | grooming: SLA per step + สีแดง Over SLA → ต้อง verify บน detail |
| Collaboration: Comment, Attachments, Activity Log, Task Delegation, Reassignment | ✅ Comment, Attach File; @Mention = Next Phase |
| Linked Cases (Parent-Child, Related) | Tab subcase (i18n หลุด) |
| Customer & Contact View (Case History, CRM Integration) | ✅ panel ขวา + Customer 360 link |
| Reporting (Case Volume, SLA Compliance, Agent Perf, Bottleneck, Escalation) | Case Dashboard (P3) |
| Audit: Change History, Timestamp, User Tracking, Export | History page + Update At |
| Admin: Custom Form, Custom Field, Template, Conditional Logic, RBAC, Sensitive Data | Dynamic Form per Case Type |

---

## 6. ช่องว่าง / สิ่งที่ยังต้องยืนยันกับ PO (→ po-question.json)

1. **BUG creation (`versions` NOT NULL)** — เป็น bug ที่ต้องแก้ก่อนทดสอบทั้ง flow ใช่ไหม / มี workaround เพื่อเตรียม data หรือไม่
2. **Delete Case** — ลบเคสได้จากที่ไหน (list row action?) / soft หรือ hard delete / ใครมีสิทธิ์
3. **Close Case** — flow ปิดงานคืออะไรแน่: ผ่าน Result + เลื่อนถึง Completed หรือมีปุ่ม "ขออนุมัติปิดงาน" + แนบไฟล์ + Approve (ตาม grooming)
4. **Update Case Workflow / Status transition** — เปลี่ยน status ทำจากที่ไหน (detail? Kanban drag?) ใครมีสิทธิ์ (PIC per step?)
5. **Event Notification** — มีจริงในรอบนี้หรือ Next Phase (BRD บอก Next Phase, grooming บอกมี Real-time) — ขอบเขตทดสอบ?
6. **Lifecycle 6 step** ตายตัวหรือ config ต่อ Case Type ได้ (Dynamic Workflow)
7. **Request Schedule Date** required เมื่อไร (modal บอก * แต่ปล่อยว่างได้?)
8. **Dynamic Form per Case Type** — Case Type ไหนมี extra fields บ้าง (Repair ไม่เห็น field พิเศษ)
9. **Attach File** — ยืนยัน bug นามสกุลไฟล์ที่ไม่รับ (grooming) + จำกัด 1MB จริงไหม
10. **Save As Draft** behavior — draft ไปอยู่ที่ไหน, แก้ต่อ/ลบได้ไหม
11. **junk Service Center** (`-string`) — เป็น test data ที่ต้องเคลียร์ไหม
12. **ศัพท์ Case vs Work Order** — ใช้คำไหนเป็นมาตรฐาน
