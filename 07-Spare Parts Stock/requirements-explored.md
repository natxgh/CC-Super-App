# Spare Parts Stock — Explored Requirements (STG)

> แหล่งที่มา: เล่นจริงบน STG `https://skyai-cloud-cc-stg.metthier.ai:65000/cms/inventory/stock`
> วันที่สำรวจ: 2026-06-14 · App version v0.26.3 · BFF = GraphQL (`cc-bff-stg.metthier.ai`)
> อ้างอิงเทียบ: BRD v0.3 (3.1.3 / FR-03 / KPI 3.5.6) + grooming-requirements.md (3.2, 3.3)

---

## 1. ภาพรวม Feature

Spare Parts Stock = หน้าจัดการ **stock unit แบบ serialized** ของอะไหล่ (Spare Parts)
- แต่ละ "แถว" = อะไหล่ 1 ชิ้นจริง ที่มี **Serial No. (SN) เฉพาะตัว** (qty ต่อแถว = 1 โดยปริยาย)
- ผูกกับ **Spare Parts master** (`/cms/inventory/`) — เลือก Spare Part จาก master
- ผูกกับ **Store** (คลัง/สาขาที่เก็บ)
- มี **Status** เป็นรหัส (เห็นค่า `R001`, `R007`)

### ความสัมพันธ์กับ Spare Parts master
- หน้า Spare Parts (`/cms/inventory/`) แต่ละการ์ดแสดง **Stock count** + badge:
  - `Out of Stock (0)` — ไม่มี stock unit
  - `Low Stock (1)` — เหลือน้อย (มี threshold)
- มีไอคอน external-link (↗) ข้าง badge → กระโดดไปหน้า Spare Parts Stock (กรองตาม part นั้น)
- จำนวน Stock count = จำนวน stock unit (SN) ของอะไหล่ชิ้นนั้น → ขับ Low Stock / Out of Stock alert

---

## 2. หน้า Spare Parts Stock — องค์ประกอบ

### 2.1 Toolbar
| Element | รายละเอียด |
|---|---|
| Search box | ค้นหาแบบ free text |
| Search button | trigger ค้นหา |
| Filters | เปิด panel: **Spare Part** (search), **Store** (search) — ไม่มี filter Status |
| Reset | ล้างค่าค้นหา/ฟิลเตอร์ |
| View toggle | 2 โหมด: **List (card)** / **Table (grid)** |

### 2.2 List/Table fields
- **Serial No.** (เช่น `SN0000019`, `5W-30-0005`)
- **Spare Part** (เช่น `iPhone 17 Pro Screen`, `Synthetic Engine Oil 5W-30`)
- **Store** (เช่น `Store2`)
- **Status** (รหัส `R001`, `R007` — ไม่มี label อ่านง่าย)
- **Action**: ปุ่ม View
- Table view: header sortable (มีลูกศร sort ที่คอลัมน์ Serial No.)

### 2.3 Item Details modal (กด View)
- แสดง: Serial No. / Spare Part / Store / Status
- ปุ่ม: **Delete** / **Edit** / **Close**

### 2.4 Edit form ("Edit Spare Parts Stock")
- **Serial No.*** (text, required)
- **Spare Part*** (dropdown ค้นหาได้ จาก Spare Parts master — required)
- **Store*** (dropdown — required)
- **Status ไม่อยู่ในฟอร์ม** (แก้ไม่ได้ / ระบบจัดการเอง)
- ปุ่ม: Cancel / **Update Spare Parts Stock**

---

## 3. ข้อสังเกต / ช่องว่าง (Gap) ที่พบ

1. **ไม่มีปุ่ม Add/Create** บนหน้า Spare Parts Stock — เส้นทางการสร้าง stock unit (SN) ยังไม่ชัด
   (grooming ระบุว่า SN ต้องสร้างก่อนผูก; อาจสร้างผ่าน flow อื่น)
2. **Status code (R001/R007) ไม่มี label** — ความหมาย/enum ไม่ชัด (น่าจะผูกกับ workflow/reservation)
3. **Status แก้ไม่ได้ใน Edit** — ใคร/อะไรเปลี่ยน Status? (Order Pick/Dispatch?)
4. **Low Stock threshold** — ค่า threshold มาจากไหน (config per part? per company?) ยังไม่เห็นที่ตั้งค่า
5. **Delete** เป็น hard/soft delete? (BRD: data retention parts ไม่ใช้ >365 วันถูกลบ)
6. ไม่เห็น **pagination** (มี ~10+ แถว แต่ไม่มีตัวควบคุมหน้า)

---

## 4. เทียบ BRD + Grooming

| ที่มา | ข้อกำหนด | สถานะบน STG |
|---|---|---|
| BRD 3.1.3 | Spare Parts Stock Management | ✅ มีหน้า list/CRUD (ยกเว้น Create) |
| BRD FR-03 | จัดการสินค้า/อะไหล่/สต็อก | ✅ บางส่วน |
| BRD KPI 3.5.6 | Spare Part Tracking Accuracy 98% | ต้องตรวจ SN ↔ Store ↔ Status ถูกต้อง |
| BRD §8 Retention | parts ไม่ใช้ >365 วัน ถูกลบ | ❓ ยังไม่เห็น flow |
| BRD §5 Roles | Spare Parts Warehouse Staff | ❓ RBAC ต่อหน้านี้ยังไม่ทดสอบ |
| Grooming 3.3 | Low Stock Alert / Out of Stock | ✅ เห็นที่หน้า Spare Parts master |
| Grooming 3.2 | Spare Parts ใช้คู่ Order (ช่างเบิก) | ↔ Status น่าจะผูก Order workflow |
| Grooming Key Finding | "Research Stock Fail เมื่อ Out of Stock ใน Order Pick" | ต้องทดสอบ integration |
