# Test Design — Customer Profile (CP)  〔ไฟล์ 1: Design〕

> **ไฟล์ 1 (Design)** — Business Conditions → เทคนิค → Test Cases → Scenarios (E2E) + Hidden Assumptions
> รายละเอียดราย Test Case อยู่ใน **ไฟล์ 2** `customer-profile-testcases.xlsx` (1 sheet — template 2026-06-11)
> ออกแบบตาม `test-design-standard.md` (Black Box). Scenario เขียนเป็น **Flow E2E**.
>
> **Context:** ไม่มี Figma Design / Spec Reqs แบบเจาะจง — ใช้ BRD ภาพรวม + Board Flow เป็น input
> **Phase note:** View Customer Product & View Customer Service ใช้ข้อมูล Dummy; Add Product / Add Service ทำจากหน้า Customer Profile (Phase เท่านั้น — ใน Prod จะไม่มี)
>
> **อัปเดต 12/06/2026:** Apply คำตอบ PO Q1–Q10 · ปิด HA1–HA11 ครบ · เพิ่ม DCP4, VCC2, CP_TA17, CP_TS10
> **อัปเดต 15/06/2026:** Sync **Step 4 — Test Scenarios** ให้ตรงกับไฟล์บน Lark Base (`QA SKY AI_TC ... Customer Profile`) แบบ mirror ตรงๆ (EN, flat). Scenario/TC ที่ authoritative อยู่ใน **ไฟล์ 2** `customer-profile-testcases.xlsx` (mirror ของ base). Step 1–3 คงไว้เป็น design rationale ต้นทาง
> **Arrange — Account ที่ใช้ทดสอบ:** Login User: ketwadee · Role & Permission: All Permission - Contact Management

---

## Feature Scope (ใน Design รอบนี้)

| Feature Code | Feature Name |
|---|---|
| VCP | View Customer Profile (List + Detail) |
| ACP | Add Customer Profile |
| UCP | Update Customer Profile |
| DCP | Delete Customer Profile |
| VPRD | View Customer Product (Phase: Dummy + Add Product) |
| VSVC | View Customer Service (Phase: Dummy + Add Service) |
| VCC | View Customer Case |

---

## PO Answers Applied (12/06/2026)

| Q | ประเด็น | คำตอบ PO | HA ที่ปิด |
|---|---|---|---|
| Q1+Q9 | Required fields + Username | **Email* + Phone*** required; **Username = Email** (ไม่มี field แยก) | HA1, HA2, HA9 |
| Q2 | DOB validation | อดีต + วันนี้ = ผ่าน, อนาคต = error | HA3 |
| Q3 | Photo upload | JPG/PNG/JPEG, max **3MB** | HA4 |
| Q4 | Add Product/Service fields | Required All Fields (ใส่ * เพิ่ม) | HA5 |
| Q5 | Delete Flow | Dialog → Confirm = ลบ / Cancel = ยกเลิก ✅ (Permission fix pending) | HA11 |
| Q6 | Delete Customer + active items | **บล็อกการลบ** จนกว่าจะ clear ทั้งหมด | HA6 |
| Q7 | Search fields | Keyword: First Name, Last Name, Phone No., Email + Filter: Type | HA7 |
| Q8 | View Customer Case | **Clickthrough** ไปหน้า Case detail ได้ | HA8 |
| Q10 | Citizen ID | ตรวจ 13 หลัก, ไม่ตรวจ MOD11 | HA10 |

---

## Step 1 — Business Conditions

### VCP — View Customer Profile

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| VCP1 | ระบบแสดงรายการ Customer ทั้งหมดในหน้า List | EP | มีข้อมูล / ไม่มีข้อมูล (2 กลุ่ม) |
| VCP2 | สามารถค้นหา Customer ได้ ด้วย Keyword (First Name / Last Name / Phone No. / Email) และ Filter by Type | EP | ค้นพบ / ไม่พบ |
| VCP3 | กดดู Customer Profile → แสดง Personal Details ครบ | Use Case | enumerate field groups ไม่แบ่งเป็น 2–3 ช่วงได้ |
| VCP4 | หน้า Detail แสดง Preferences ครบ | Use Case | field group แยก |
| VCP5 | หน้า Detail แสดง Custom Fields ครบ | Use Case | field group แยก |

### ACP — Add Customer Profile

> **PO Confirmed (Q1+Q9):** Username = Email (ไม่มี field Username แยกต่างหาก) · Required = Email* + Phone*

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| ACP1 | Email (= Username) และ Phone เป็น required fields | Use Case | enumerate combinations ของช่องว่าง |
| ACP2 | Email ต้องไม่ซ้ำกับ Customer ที่มีอยู่แล้ว (Email เป็น unique identifier) | EP | unique / duplicate |
| ACP3 | Email ต้องเป็น format ถูกต้อง (required field) | EP | valid / invalid format |
| ACP4 | Citizen ID ต้องเป็นตัวเลข 13 หลักพอดี (ไม่ตรวจ MOD11) | BVA | ขอบ 13 หลัก: 12 / 13 / 14 |
| ACP5 | DOB ต้องเป็นวันอดีตหรือวันนี้ (อนาคต = error) | EP | past/today = pass / future = error |
| ACP6 | Photo upload: format JPG/PNG/JPEG เท่านั้น, ขนาดสูงสุด 3MB | EP | format ถูก/ผิด, size ถูก/เกิน |
| ACP7 | บันทึก Profile สำเร็จ → แสดง success + Profile ปรากฏใน List | State Transition | Form (Filled) → Saved → Profile Active |

### UCP — Update Customer Profile

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| UCP1 | แก้ไขข้อมูล Personal Details ได้ | Use Case | enumerate editable fields |
| UCP2 | Email ที่แก้ไขต้องไม่ซ้ำกับ Customer อื่น | EP | unique / duplicate |
| UCP3 | กด Save → ข้อมูลอัปเดต / กด Cancel → ข้อมูลไม่เปลี่ยน | State Transition | View → Edit → Saved / Cancelled |

### DCP — Delete Customer Profile

> **PO Confirmed (Q5):** Delete Flow = Dialog → Confirm/Cancel ✅ Permission fix in progress
> **PO Confirmed (Q6):** ลบ Customer ที่มี active Case/Product/Service ไม่ได้ — ระบบบล็อก

**State Diagram:**
```
[Active] → กด Delete → [Confirmation Dialog]
                           ├── กด Confirm → [Deleted] (ไม่มีใน List)
                           └── กด Cancel  → [Active] (ย้อนกลับ, ข้อมูลเหมือนเดิม)

[Active + has active Case/Product/Service] → กด Delete → [Blocked] (error / ปุ่ม disable)
```

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| DCP1 | กดปุ่ม Delete → ระบบแสดง Confirmation dialog ก่อนลบเสมอ | State Transition | Active → Dialog |
| DCP2 | กด Confirm ใน dialog → Customer ถูกลบออกจากระบบ | State Transition | Dialog → Deleted |
| DCP3 | กด Cancel ใน dialog → Customer ยังคงอยู่ในระบบ | State Transition | Dialog → Active (self-loop) |
| DCP4 | Customer ที่มี active Case / Product / Service → ระบบบล็อกการลบ | EP | has active items / ไม่มี |

### VPRD — View Customer Product (Phase: Dummy Data)

**State Transition (VPRD2):**
```
[Customer Profile Page] → กด Add Product → [Add Product Form] → กด Save (Required All Fields) → [Product Listed]
```

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| VPRD1 | แสดงรายการ Products ที่ Customer ถือครองได้ | EP | มีข้อมูล / ไม่มีข้อมูล |
| VPRD2 | [Phase Only] Add Product จากหน้า Customer Profile → ปรากฏใน Product list (Required All Fields) | State Transition | Profile → Add Product → Product Listed |

### VSVC — View Customer Service (Phase: Dummy Data)

**State Transition (VSVC2):**
```
[Customer Profile Page] → กด Add Service → [Add Service Form] → กด Save (Required All Fields) → [Service Listed]
```

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| VSVC1 | แสดงรายการ Services ที่ Customer ถือครองได้ | EP | มีข้อมูล / ไม่มีข้อมูล |
| VSVC2 | [Phase Only] Add Service จากหน้า Customer Profile → ปรากฏใน Service list (Required All Fields) | State Transition | Profile → Add Service → Service Listed |

### VCC — View Customer Case

> **PO Confirmed (Q8):** Clickthrough ไปหน้า Case detail ได้

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| VCC1 | แสดงรายการ Case History ของ Customer ได้ | EP | มีข้อมูล / ไม่มีข้อมูล |
| VCC2 | กด row ใน Case list → Navigate ไปหน้า Case detail | Use Case | clickthrough navigation |

---

## Step 2 — Test Cases (ย่อ: 4 ส่วน)

> **Real Example Data convention:** ไม่ใช้ "Test/ทดสอบ/xxx"

### VCP — View Customer Profile

**VCP1 — Customer List (EP)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCP1-TC1 | ระบบมี Customer ≥1 รายการอยู่แล้ว | เปิดหน้า Customer Management | มีข้อมูล | หน้าแสดง: ปุ่ม "+ Add Customer" (มุมบนขวา), Search bar, Filter Type dropdown · ตาราง ≥1 row พร้อมคอลัมน์ Name / Email / Phone / Type / Action (ปุ่ม View ต่อแถว) |
| VCP1-TC2 | ระบบไม่มี Customer เลย | เปิดหน้า Customer Management | ไม่มีข้อมูล | ปุ่ม "+ Add Customer" ยังปรากฏ · ตาราง/area แสดงข้อความ "" (ไม่มีแถวข้อมูล) |

**VCP2 — Search (EP)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCP2-TC1 | มี Customer "สมชาย ใจดี" (Phone: 0812345678) ในระบบ | ค้นหา keyword "สมชาย" | ค้นหาพบ (by First Name) | แสดง row "สมชาย ใจดี" พร้อม Email: somchai.jai@gmail.com, Phone: 0812345678 · row ที่ไม่ตรง keyword ไม่ปรากฏ |
| VCP2-TC2 | มี Customer "สมชาย ใจดี" ในระบบ | ค้นหา keyword "0812345678" | ค้นหาพบ (by Phone No.) | แสดง row "สมชาย ใจดี" พร้อม Phone: 0812345678 |
| VCP2-TC3 | ไม่มี Customer ชื่อ "วิลาวัลย์ มีสุข" | ค้นหา keyword "วิลาวัลย์" | ค้นหาไม่พบ | ตารางแสดงข้อความ "" (ไม่มีแถวข้อมูล) |
| VCP2-TC4 | มี Customer Type "Individual" และ "Corporate" ในระบบ | Filter Type = "Individual" | Filter by Type | แสดงเฉพาะ row ที่ Type = "Individual" · row Type = "Corporate" ไม่ปรากฏ |

**VCP3 — Personal Details (Use Case)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCP3-TC1 | มี Customer สมชาย ใจดี กรอกข้อมูลครบ | กดดู Profile ของ "สมชาย ใจดี" | Personal Details ครบ | หน้า Profile แสดง: Tab navigation "" · ส่วน Personal Details แสดงครบ: Email: somchai.jai@gmail.com · Phone: 0812345678 · Display Name: สมชาย ใจดี · Title: นาย · First Name: สมชาย · Last Name: ใจดี · รูปภาพ (thumbnail) · Citizen ID: 1234567890121 · DOB: 15 มกราคม 2533 · Blood Type: O · Gender: ชาย · Registered Address + Current Address (แสดงค่า) · ปุ่ม Edit ปรากฏ |

**VCP4 — Preferences (Use Case)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCP4-TC1 | Profile ของ สมชาย ใจดี มีข้อมูล Preferences | ดู Preferences section | Preferences ครบ | Preferences section แสดงฟิลด์: User Type: "" · Language Preference: "" · Contact Preference: "" · Note: "" (ค่าตรงกับที่บันทึกไว้) |

**VCP5 — Custom Fields (Use Case)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCP5-TC1 | Profile มี Custom Fields | ดู Custom Fields section | Custom Fields ครบ | Custom Fields section แสดง: Company Name: บริษัท ไทยดิจิทัล จำกัด · Employee ID: EMP00142 · Line ID: somchai_j · Driving License: 12/34567 · Position: Senior Engineer |

---

### ACP — Add Customer Profile

**ACP1 — Required Fields: Email + Phone (Use Case)**
> Q1+Q9: username = email · Required = Email* + Phone*

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP1-TC1 | เปิดฟอร์ม Add Customer | Email: somying.rak@company.co.th, Phone: 0898765432 | Required fields ครบ | Email field และ Phone field ไม่มี error highlight · ปุ่ม "Save" / "" active (กดได้) |
| ACP1-TC2 | เปิดฟอร์ม Add Customer | Email: ว่าง, Phone: 0898765432 | Email (required) ว่าง | Email field แสดง error state (red border/icon) + ข้อความ "" ใต้ฟิลด์ |
| ACP1-TC3 | เปิดฟอร์ม Add Customer | Email: somying.rak@company.co.th, Phone: ว่าง | Phone (required) ว่าง | Phone field แสดง error state (red border/icon) + ข้อความ "" ใต้ฟิลด์ |

**ACP2 — Email Unique (EP)**
> Email ทำหน้าที่เป็น Username — ต้องไม่ซ้ำในระบบ

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP2-TC1 | ไม่มี Email "somying.rak@company.co.th" ในระบบ | Email: somying.rak@company.co.th | ไม่ซ้ำ | Email field ไม่มี error · ปุ่ม Save active |
| ACP2-TC2 | มี Customer Email "somchai.jai@gmail.com" อยู่แล้ว | Email: somchai.jai@gmail.com | ซ้ำ | Email field แสดง error state + ข้อความ "" (เช่น "Email นี้ถูกใช้งานแล้ว") |

**ACP3 — Email Format (EP)**
> Email เป็น required field — ต้องกรอก และ format ต้องถูกต้อง

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP3-TC1 | เปิดฟอร์ม | Email: somying.rak@company.co.th | Email format ถูกต้อง | Email field ไม่มี error |
| ACP3-TC2 | เปิดฟอร์ม | Email: somying.rakcompany.co.th (ไม่มี @) | Email format ผิด | Email field แสดง error state + ข้อความ "" (เช่น "รูปแบบอีเมลไม่ถูกต้อง") |

**ACP4 — Citizen ID: BVA (ขอบ 13 หลัก)**
> PO Confirmed: ตรวจ 13 หลักตัวเลข ไม่ตรวจ MOD11

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP4-TC1 | เปิดฟอร์ม | Citizen ID: 123456789012 (12 หลัก) | น้อยกว่า 13 | Citizen ID field แสดง error state + ข้อความ "" (เช่น "Citizen ID ต้องมี 13 หลัก") |
| ACP4-TC2 | เปิดฟอร์ม | Citizen ID: 1234567890121 (13 หลัก) | เท่ากับ 13 | Citizen ID field แสดง 1234567890121 ครบ · ไม่มี error |
| ACP4-TC3 | เปิดฟอร์ม | Citizen ID: 12345678901234 (14 หลัก) | มากกว่า 13 | Citizen ID field แสดง error state + ข้อความ "" หรือ input ไม่รับหลักที่ 14 (blocked) |

**ACP5 — DOB (EP)**
> PO Confirmed: อดีต + วันนี้ = ผ่าน, อนาคต = error

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP5-TC1 | เปิดฟอร์ม | DOB: 15/01/2533 (อดีต) | DOB อดีต | DOB field แสดงค่า 15/01/2533 · ไม่มี error |
| ACP5-TC2 | เปิดฟอร์ม | DOB: 01/01/2573 (อนาคต) | DOB อนาคต | DOB field แสดง error state + ข้อความ "" หรือ datepicker ไม่ให้เลือกวันอนาคต (disabled) |
| ACP5-TC3 | เปิดฟอร์ม | DOB: 12/06/2569 (วันนี้) | DOB = วันนี้ | DOB field แสดงค่า 12/06/2569 · ไม่มี error |

**ACP6 — Photo Upload (EP)**
> PO Confirmed: JPG/PNG/JPEG only, max 3MB

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP6-TC1 | เปิดฟอร์ม | ไฟล์: profile_somying.jpg (JPEG, 200KB) | format ถูก + size ≤ 3MB | Upload area แสดง thumbnail preview ของ profile_somying.jpg + ชื่อไฟล์ + ขนาด (200KB) · icon/ปุ่มลบรูปปรากฏ |
| ACP6-TC2 | เปิดฟอร์ม | ไฟล์: contract.pdf (PDF) | format ไม่รองรับ | Upload area แสดง error "" (เช่น "รองรับเฉพาะไฟล์ JPG, PNG, JPEG") · ไฟล์ไม่ถูก upload |
| ACP6-TC3 | เปิดฟอร์ม | ไฟล์: photo_hd.jpg (4MB) | size เกิน 3MB | Upload area แสดง error "" (เช่น "ขนาดไฟล์ต้องไม่เกิน 3MB") · ไฟล์ไม่ถูก upload |

**ACP7 — Save Success (State Transition)**
States: `Form (Filled)` → `[กด Save]` → `Profile Active`

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP7-TC1 | กรอกครบ: ACP1-TC1 + ACP2-TC1 + ACP3-TC1 + ACP4-TC2 + ACP5-TC1 + ACP6-TC1 | กดปุ่ม Save | บันทึกสำเร็จ | ระบบ redirect ไปหน้า Customer List หรือหน้า Profile ของ "สมหญิง รักไทย" · แสดง "" (toast/banner) · row "สมหญิง รักไทย" ปรากฏใน Customer list พร้อม Email: somying.rak@company.co.th |

---

### UCP — Update Customer Profile

**UCP1 — Edit Personal Details (Use Case)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| UCP1-TC1 | เปิด Profile ของ สมชาย ใจดี → กด Edit | เปลี่ยน Display Name เป็น "Somchai Jaidee" | แก้ไข field ได้ | ช่อง Display Name ใน Edit mode แสดงค่าใหม่ "Somchai Jaidee" · ไม่มี error |
| UCP1-TC2 | เปิด Profile → กด Edit | เปลี่ยน Phone เป็น 0891234567 | แก้ไข Phone | ช่อง Phone แสดงค่าใหม่ 0891234567 · ไม่มี error |

**UCP2 — Email Unique on Update (EP)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| UCP2-TC1 | เปิด Profile → Edit | เปลี่ยน Email เป็น somchai.new@gmail.com (ไม่มีในระบบ) | ไม่ซ้ำ | Email field ไม่มี error · ปุ่ม Save active |
| UCP2-TC2 | มี somying.rak@company.co.th อยู่แล้ว | เปลี่ยน Email เป็น somying.rak@company.co.th | ซ้ำกับ Customer อื่น | Email field แสดง error state + ข้อความ "" |

**UCP3 — Save / Cancel (State Transition)**
States: `View` → `[กด Edit]` → `Edit Mode` → `[กด Save]` → `View (Updated)` / `[กด Cancel]` → `View (Unchanged)`

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| UCP3-TC1 | Profile สมชาย ใจดี ใน Edit Mode + เปลี่ยน Display Name | กด Save | Save สำเร็จ | แสดง "" (toast/banner) · หน้ากลับเป็น View mode · Display Name แสดง "Somchai Jaidee" · Email แสดง somchai.new@gmail.com |
| UCP3-TC2 | Profile สมชาย ใจดี ใน Edit Mode + เปลี่ยน Display Name | กด Cancel | Cancel ยกเลิก | ฟอร์มปิด Edit mode · Display Name กลับเป็น "สมชาย ใจดี" (ค่าเดิม) · ไม่มีการเปลี่ยนแปลง |

---

### DCP — Delete Customer Profile

> **PO Confirmed (Q5):** Delete Flow = Dialog → Confirm/Cancel ✅
> **PO Confirmed (Q6):** Customer มี active Case/Product/Service → บล็อกการลบ

**DCP1–DCP3 — Delete Flow (State Transition)**

| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| DCP1-TC1 | มี Customer "วรรณภา สุขใส" ไม่มี active items | กดปุ่ม Delete บน row ของ "วรรณภา สุขใส" | กด Delete → Dialog | Modal/Dialog แสดงขึ้นพร้อม: ข้อความ "" (เช่น "ยืนยันการลบ 'วรรณภา สุขใส'?") · ปุ่ม "" (Confirm/ยืนยัน) · ปุ่ม "" (Cancel/ยกเลิก) |
| DCP2-TC1 | Dialog เปิดอยู่ | กด Confirm | ยืนยันลบ | Dialog ปิด · "วรรณภา สุขใส" ไม่ปรากฏใน Customer List · แสดง "" (toast/notification) |
| DCP3-TC1 | Dialog เปิดอยู่ | กด Cancel | ยกเลิกลบ | Dialog ปิด · "วรรณภา สุขใส" ยังคงปรากฏใน Customer List ที่ตำแหน่งเดิม · ไม่มีการเปลี่ยนแปลง |

**DCP4 — Cannot Delete Customer with Active Items (EP)**
> PO Confirmed (Q6): บล็อกการลบจนกว่าจะ clear item ทั้งหมดก่อน

| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| DCP4-TC1 | Customer "สมชาย ใจดี" มี active Case: CS-20250101-001 อยู่ | กดปุ่ม Delete บน row | Customer มี active items | ปุ่ม Delete disabled / ไม่ปรากฏ หรือกดแล้วแสดง error "" (เช่น "ไม่สามารถลบลูกค้าที่มี Case/Product/Service active อยู่ได้") |

---

### VPRD — View Customer Product (Phase: Dummy Data)

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VPRD1-TC1 | Customer "สมชาย ใจดี" มี Product dummy: "บัตรเดบิต Visa" | เปิดหน้า Customer Product | มีข้อมูล Product | Tab Products แสดง list พร้อมคอลัมน์ "" · row "บัตรเดบิต Visa" ปรากฏ (ชื่อ/ประเภท/สถานะ) · ปุ่ม "Add Product" ยังปรากฏ |
| VPRD1-TC2 | Customer "สมหญิง รักไทย" ไม่มี Product | เปิดหน้า Customer Product | ไม่มีข้อมูล | Tab Products แสดงข้อความ **"No results found."** · ปุ่ม "Add Product" ยังปรากฏ |
| VPRD2-TC1 | เปิด Customer Profile → กด Add Product | กรอก Required All Fields: Product Name: "สินเชื่อบ้าน ธ.กรุงไทย" + ฟิลด์อื่นครบ | [Phase] Add Product → Save | row "สินเชื่อบ้าน ธ.กรุงไทย" ปรากฏใหม่ใน Product list |

---

### VSVC — View Customer Service (Phase: Dummy Data)

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VSVC1-TC1 | Customer "สมชาย ใจดี" มี Service dummy: "ประกันชีวิต AIA" | เปิดหน้า Customer Service | มีข้อมูล Service | Tab Services แสดง list พร้อมคอลัมน์ "" · row "ประกันชีวิต AIA" ปรากฏ · ปุ่ม "Add Service" ยังปรากฏ |
| VSVC1-TC2 | Customer "สมหญิง รักไทย" ไม่มี Service | เปิดหน้า Customer Service | ไม่มีข้อมูล | Tab Services แสดงข้อความ **"No results found."** · ปุ่ม "Add Service" ยังปรากฏ |
| VSVC2-TC1 | เปิด Customer Profile → กด Add Service | กรอก Required All Fields: Service Name: "ประกันอุบัติเหตุ PA Plus" + ฟิลด์อื่นครบ | [Phase] Add Service → Save | row "ประกันอุบัติเหตุ PA Plus" ปรากฏใหม่ใน Service list |

---

### VCC — View Customer Case

> **PO Confirmed (Q8):** Clickthrough ไปหน้า Case detail ได้

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCC1-TC1 | Customer "สมชาย ใจดี" มี Case: "CS-20250101-001 ร้องเรียนเรื่องใบแจ้งหนี้" | เปิดหน้า Customer Case | มีข้อมูล Case | Tab Case แสดง list พร้อมคอลัมน์ Case No. / หัวข้อ / วันที่ / สถานะ · row "CS-20250101-001 ร้องเรียนเรื่องใบแจ้งหนี้" ปรากฏ · แต่ละ row คลิกได้ (cursor pointer) |
| VCC1-TC2 | Customer "สมหญิง รักไทย" ยังไม่มี Case | เปิดหน้า Customer Case | ไม่มีข้อมูล | Tab Case แสดงข้อความ **"No results found."** |
| VCC2-TC1 | Customer "สมชาย ใจดี" อยู่ใน Case list | คลิก row ของ Case "CS-20250101-001" | Clickthrough to Case detail | Navigate ไปหน้า Case detail · หน้าแสดง Case No.: CS-20250101-001 + รายละเอียด case |

---

## Step 3 — Hidden Assumptions (คำถามถึง PO)

> ✅ = ปิดแล้ว (PO ตอบแล้ว 12/06/2026) · ⚠️ = ยังรอ

| # | คำถาม | สถานะ | คำตอบ |
|---|---|---|---|
| HA1 | Required fields | ✅ | Email* + Phone* required; ฟิลด์อื่น optional |
| HA2 | Email required? | ✅ | Email required (= username) |
| HA3 | DOB validation | ✅ | อดีต + วันนี้ = ผ่าน, อนาคต = error |
| HA4 | Photo format + size | ✅ | JPG/PNG/JPEG, max 3MB |
| HA5 | Add Product/Service fields | ✅ | Required All Fields (ใส่ * ระบุให้ทีม Dev) |
| HA6 | Delete Customer + active items | ✅ | บล็อก — ต้อง clear ทุก item ก่อน |
| HA7 | Search fields | ✅ | Keyword: First Name, Last Name, Phone No., Email + Filter: Type |
| HA8 | Customer Case clickthrough | ✅ | Clickthrough ไปหน้า Case detail ได้ |
| HA9 | Username | ✅ | username = email (ไม่มี field Username แยก) |
| HA10 | Citizen ID checksum | ✅ | ตรวจ 13 หลักตัวเลข ไม่ตรวจ MOD11 |
| HA11 | Delete Flow | ✅ | Dialog → Confirm = ลบ / Cancel = ยกเลิก (Permission fix pending) |

> **ไม่มี Hidden Assumption ที่เปิดค้างอยู่** — Design พร้อม sign-off

---

## Step 4 — Test Scenarios (mirror of Lark Base — EN, flat)

> **Sync 15/06/2026** — this section now mirrors the Lark Base export 1:1. Scenario No. (`TS-##` Success / `TA-##` Alternative) + Scenario Name + the Test Cases listed under each. Full Steps / Expected / Test Data per TC live in **ไฟล์ 2** `customer-profile-testcases.xlsx`.
> Note: on Base, TC No. and Scenario No. don't always share the same number (e.g. Scenario `TS-06` carries TCs `TS-08_TC-01`, `TS-09_TC-01`, `TS-09_TC-03`; Scenario `TS-07` carries `TA-10_TC-01`; Scenario `TA-01` carries `TA-02_TC-01`). Listed below as-is from Base.

### Success Scenarios

---

**TS-01** — User can successfully search and filter the customer list to find a profile and view customer detail
```
1.  TS-01_TC-01   Navigate to "Customer List Page" → list + Add Customer button + Search bar + Filter Type + table columns
2.  TS-01_TC-02   Search keyword "Somchai" (First Name) → Somchai Jaidee (Type: Gold)
3.  TS-01_TC-03   Search keyword "Jaidee" (Last Name) → Somchai Jaidee
4.  TS-01_TC-04   Search keyword "0812345678" (Phone No.) → Somchai Jaidee
5.  TS-01_TC-05   Search keyword "somchai.jai@gmail.com" (Email) → Somchai Jaidee
6.  TS-01_TC-06   Filter Type "Gold" → Somchai Jaidee
7.  TS-01_TC-07   View Customer Detail → focus Tab "Customer"
8.  TS-01_TC-08   View Personal Details (Type/Profile Image/Name/Contact Info/Address)
9.  TS-01_TC-09   View Preferences section (Contact: Mobile Number, Language: Thai)
10. TS-01_TC-10   View Custom Fields/Form section (Company/Employee ID/Line ID/Driving License/Position)
```

---

**TS-02** — User can successfully add a customer profile
> **Test Data:** Siriwimon Somjit | Email: siriwimon@gmail.com | Phone: 0873331134 | Type: Platinum
```
1.  TS-02_TC-01   Navigate to "Add Customer Page"
2.  TS-02_TC-02   Upload Profile Photo (profile_siriwimon.jpg) → thumbnail preview
3.  TS-02_TC-03   Fill in all fields in Personal Details
4.  TS-02_TC-04   Fill in all fields in Registered Address
5.  TS-02_TC-05   Checkbox "Same As Registered" → hide Current Address section
6.  TS-02_TC-06   Fill in all fields in Preferences
7.  TS-02_TC-07   Fill in all fields in Custom Form
8.  TS-02_TC-08   Save Add Customer → redirect to List + Toast "Success"
9.  TS-02_TC-09   Search keyword "siriwimon@gmail.com" → Siriwimon Somjit appears
10. TS-02_TC-10   Navigate to Edit Page → Personal Details match what was added
11. TS-02_TC-11   Registered Address + Current Address match what was added
12. TS-02_TC-12   Preferences match what was added
13. TS-02_TC-13   Custom Form matches what was added
```

---

**TS-03** — User can successfully update a customer profile
> **Test Data (before):** Wannapa Suksai | wannapa@gmail.com | Type: Platinum
> **Test Data (after):** Wannapha Sooksai | wannapha12@gmail.com | Type: Gold
```
1.  TS-03_TC-01   Navigate to "Edit Customer Page" (Wannapa Suksai) → Edit form shows current values
2.  TS-03_TC-02   Change new Profile Photo (profile_wannapa1.jpg)
3.  TS-03_TC-03   Edit all fields in Personal Details
4.  TS-03_TC-04   Edit all fields in Registered Address
5.  TS-03_TC-05   "Same As Registered" unchecked → Edit all fields in Current Address
6.  TS-03_TC-06   Edit all fields in Preferences
7.  TS-03_TC-07   Edit all fields in Custom Form
8.  TS-03_TC-08   Save → redirect to List + Toast "Success", new info shows
9.  TS-03_TC-09   Search keyword "wannapha12@gmail.com" → Wannapha Sooksai appears
10. TS-03_TC-10   Navigate to Edit → Personal Details match the changes
11. TS-03_TC-11   Address matches the changes (new Registered + different Current)
12. TS-03_TC-12   Preferences match the changes
13. TS-03_TC-13   Custom Form matches the changes
```

---

**TS-04** — User can successfully delete a customer profile
```
1.  TS-04_TC-01   Navigate to "Customer List Page" → search "wannapha12@gmail.com" → Wannapha Sooksai
2.  TS-04_TC-02   Click Delete → Confirmation Dialog (Confirm / Cancel)
3.  TS-04_TC-03   Click "Cancel" → customer still in list
4.  TS-04_TC-04   Click Delete again → Delete Confirmation Dialog
5.  TS-04_TC-05   Click "Confirm" → Toast "Success"
6.  TS-04_TC-06   Search keyword "wannapha12@gmail.com" → "No results found."
```

---

**TS-05** — View Customer Product, Service and Case and Navigate to Case Detail Page
```
1.  TS-05_TC-01   View "Somchai Jaidee" → Product / Service / Cases list displayed
2.  TS-05_TC-02   Click Case No. "CS-20250101-001" → navigate to Case Detail Page
```

---

**TS-06** — User can successfully add product and service (QA Phase Only)
```
1.  TS-08_TC-01   Fill in all required fields → Add Product successfully (Toast "Success")
2.  TS-09_TC-01   Fill in all required fields → Add Service successfully (Toast "Success")
3.  TS-09_TC-03   Verify Product and Service List on Customer tab
```

---

**TS-07** — User can successfully add a customer profile when using today's date as the Date of Birth
```
1.  TA-10_TC-01   Date of Birth equal to current date → Save → redirect to List + Toast "Success"
```

---

### Alternative Scenarios

| Scenario | Scenario Name | TC | Result |
|---|---|---|---|
| TA-01 | Verify "No results found" when searching a keyword with no results | TA-02_TC-01 | Search "Wilawann" → "No results found." |
| TA-02 | Error toast "Please enter an email address" — empty email | TA-03_TC-01 | Add with empty email → error toast |
| TA-03 | Error toast "Please enter a mobile number" — empty phone | TA-04_TC-01 | Add with empty phone → error toast |
| TA-04 | Error toast — duplicate email address | TA-05_TC-01 | Email somchai.jai@gmail.com → "Duplicate email address" |
| TA-05 | Error toast — invalid email format | TA-06_TC-01 | Email darinee.com → "Invalid email address format" |
| TA-06 | Error toast — Citizen ID less than 13 digits | TA-07_TC-01 | Citizen ID 123456789012 → "Invalid citizen id format" |
| TA-07 | Error toast — Citizen ID more than 13 digits | TA-08_TC-01 | Citizen ID 12345678901234 → "Invalid citizen id format" |
| TA-08 | Error toast — Date of Birth in the future | TA-09_TC-01 | DOB future date → "Invalid date of birth format" |
| TA-09 | Error toast — wrong photo format (PDF) | TA-11_TC-01 | Upload contract.pdf → "Invalid upload photo file", not uploaded |
| TA-10 | Error toast — photo size larger than 3MB | TA-12_TC-01 | Upload photo_hd.jpg (4MB) → "The file size must not exceed 3MB." |
| TA-11 | Error toast — duplicate email (update) | TA-13_TC-01 | Email natthawat.ntw@company.co.th → "Duplicate email address" |
| TA-12 | No update when click Edit then Cancel/Back | TA-14_TC-01 | Change Phone → Back → no change |
| TA-13 | Error toast — delete a customer with an active Case | TA-16_TC-01 | Delete Somchai Jaidee → "The customer cannot be deleted." |
| TA-14 | "No results found." — view customer Product with no data | TA-17_TC-01 | View Product section → "No results found." |
| TA-15 | "No results found." — view customer Service with no data | TA-18_TC-01 | View Service section → "No results found." |
| TA-16 | "No results found." — view customer Case with no data | TA-19_TC-01 | View Natthawat Jetbordin → Cases "No results found." |

> **TBC on Base:** error-toast wording for TA-04..TA-10, TA-11, TA-13 is marked "TBC" in the Expected column — confirm exact copy with PO/Dev before sign-off.

---

## Step 5 — Definition of Done (Self-check)

- [x] แปลง Needs เป็น Business Conditions ครบ (VCP 5 / ACP 7 / UCP 3 / DCP 4 / VPRD 2 / VSVC 2 / VCC 2 = 25 conditions)
- [x] เทคนิคครบ EP / BVA / State Transition / Use Case
- [x] BVA: Citizen ID มีครบ น้อยกว่า/เท่ากับ/มากกว่า (3 ค่า); DOB อดีต/วันนี้/อนาคต
- [x] State Transition: Delete ครบ (Active→Dialog→Deleted / Active→Dialog→Active ย้อนกลับ / Active+ActiveItems→Blocked)
- [x] Test Case ครบ 4 ส่วน (Arrange / Test Data / Tested Condition / Expected)
- [x] มีทั้ง Success (TS-01..TS-07 = 7) และ Alternative (TA-01..TA-16 = 16) Scenario — ตรงกับ Base (sync 15/06/2026)
- [x] ไม่มีเงื่อนไขขัดแย้งกันใน Scenario เดียวกัน
- [x] Test Data เป็น Real Example ไม่มีคำว่า Test/ทดสอบ
- [x] HA ทั้งหมด (HA1–HA11) ปิดครบแล้ว — ไม่มี Blocked TC
- [x] ติด ID ทุก TC และทำสัญลักษณ์ ✓ บน TC ที่ใช้แล้วใน Scenario
- [x] อัปเดตจากคำตอบ PO (12/06/2026): Username=Email, Required=Email+Phone, Photo 3MB, Delete Block, Search fields, VCC clickthrough
