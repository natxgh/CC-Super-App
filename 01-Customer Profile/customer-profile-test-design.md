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
> **อัปเดต 27/06/2026:** เพิ่ม **TS-10** — View Customer List: Toggle Table View / Grid View (VCL1–VCL3) · เพิ่ม HA-VCL1–3
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
| ACP2 | Email ต้องไม่ซ้ำกับ Customer ที่มีอยู่แล้ว (Email เป็น unique identifier) → "Duplicate email address" | EP | unique / duplicate |
| ACP2b | Phone ต้องไม่ซ้ำกับ Customer ที่มีอยู่แล้ว → "Duplicate phone number" (PO round-2) | EP | unique / duplicate |
| ACP3 | Email ต้องเป็น format ถูกต้อง (a@b.c) → ผิด format = "Invalid email address" | EP | valid / invalid format |
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

### VCL — View Customer List (Toggle Table / Grid View)

> **UI ยืนยันจาก Design Screenshot (27/06/2026):**
> - **Toggle buttons:** icon ☰ (Table View) และ icon ⊞ (Grid View) — อยู่มุมบนซ้ายของ Customer List Page · icon ที่ active = highlighted สีน้ำเงิน
> - **Table View** (☰): columns = ลูกค้า / ติดต่อ / ผลิตภัณฑ์ / บริการ / ประเภท / เปิดใช้งาน + action buttons (โทร/อีเมล/แชท/ดู/แก้ไข/ลบ)
> - **Grid View** (⊞): Card ต่อลูกค้า 1 ใบ แสดง รูป + ชื่อ + Type badge + สถานะ (dot) + อีเมล + เบอร์ + จำนวน ผลิตภัณฑ์ + จำนวน บริการ + action buttons (โทร/อีเมล/แชท/ดู/แก้ไข/ลบ)

**State Diagram:**
```
[Table View (Default, ☰ active)] ──กด ⊞──▶ [Grid View (⊞ active)]
                                                   └──กด ☰──▶ [Table View (☰ active)]
```

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| VCL1 | Customer List page load แสดงเป็น Table View โดย default (icon ☰ highlighted) | Use Case | กำหนด initial state ก่อนทดสอบ toggle |
| VCL2 | กด icon ⊞ (Grid View) → หน้าสลับเป็น Card layout (⊞ highlighted, ☰ ไม่ highlighted) | State Transition | Table View → Grid View |
| VCL3 | กด icon ☰ (Table View) → หน้าสลับกลับเป็น Table layout (☰ highlighted, ⊞ ไม่ highlighted) | State Transition | Grid View → Table View |

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
> **PO Confirmed (round-2):** Display fallback ใน View Detail/List —
> (1) ไม่มี First/Last name → แสดง **Email** แทน · (2) มี First/Last name → แสดง **"First Last"** · (3) ไม่มี Type → แสดง **N/A**

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCP3-TC1 | มี Customer สมชาย ใจดี กรอกข้อมูลครบ | กดดู Profile ของ "สมชาย ใจดี" | Personal Details ครบ | หน้า Profile แสดง: Tab navigation "" · ส่วน Personal Details แสดงครบ: Email: somchai.jai@gmail.com · Phone: 0812345678 · Display Name: สมชาย ใจดี · Title: นาย · First Name: สมชาย · Last Name: ใจดี · รูปภาพ (thumbnail) · Citizen ID: 1234567890121 · DOB: 15 มกราคม 2533 · Blood Type: O · Gender: ชาย · Registered Address + Current Address (แสดงค่า) · ปุ่ม Edit ปรากฏ |
| VCP3-TC2 | มี Customer ที่ **ไม่มี First name / Last name** (มีแค่ Email + Phone) | กดดู Profile ของลูกค้านั้น | Display fallback: no name | Display Name แสดงเป็น **Email** (เช่น noname.case@gmail.com) แทนช่องว่าง |
| VCP3-TC3 | มี Customer ที่ **ไม่มี Type** | ดู row/Profile ของลูกค้านั้น | Display fallback: no type | ช่อง Type แสดง **"N/A"** |

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
> PO Confirmed (round-2): Email ซ้ำ → toast **"Duplicate email address"**

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP2-TC1 | ไม่มี Email "somying.rak@company.co.th" ในระบบ | Email: somying.rak@company.co.th | ไม่ซ้ำ | Email field ไม่มี error · ปุ่ม Save active |
| ACP2-TC2 | มี Customer Email "somchai.jai@gmail.com" อยู่แล้ว | Email: somchai.jai@gmail.com | ซ้ำ | บันทึกไม่สำเร็จ · แสดง toast **"Duplicate email address"** |

**ACP2b — Phone Unique (EP)**
> PO Confirmed (round-2): Phone ต้องไม่ซ้ำในระบบเช่นกัน — ซ้ำ → toast **"Duplicate phone number"**

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP2b-TC1 | ไม่มี Phone "0891112233" ในระบบ | Phone: 0891112233 | ไม่ซ้ำ | Phone field ไม่มี error · ปุ่ม Save active |
| ACP2b-TC2 | มี Customer Phone "0812345678" อยู่แล้ว (สมชาย) | Phone: 0812345678 | ซ้ำ | บันทึกไม่สำเร็จ · แสดง toast **"Duplicate phone number"** |

**ACP3 — Email Format (EP)**
> Email เป็น required field — ต้องกรอก และ format ต้องถูกต้อง (syntax = `username@domain.com`)
> PO Confirmed (round-2): format = `a@b.c` · ถ้าผิด format → toast **"Invalid email address"**
> **Valid ✓** : `test@gmail.com`, `TEST@GMAIL.COM`, `Test123@gmail.com`, `aa_xx@gmail.com`, `aa.xx@gmail.com`, `aa%xx@gmail.com`, `aa+xx@gmail.com`, `aa-xx@gmail.com`, `user.name+tag@example.co.th`, `first.last@sub.domain.org`, `user_123@my-company.io`, `a1b2c3@test.network`
> **Invalid ✗** : `test @gmail.com` (space), `test@gmail` (no TLD), `@gmail.com` (empty local), `test@@gmail.com` (double @), `test@gmail.c` (TLD 1 ตัว), `test` (no @), `test@.com` (domain ขึ้นต้นด้วยจุด)

| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| ACP3-TC1 | เปิดฟอร์ม | Email: somying.rak@company.co.th | Email format ถูกต้อง (a@b.c) | Email field ไม่มี error · Save ได้ |
| ACP3-TC2 | เปิดฟอร์ม | Email: `test` (no @) | Email format ผิด | บันทึกไม่สำเร็จ · toast **"Invalid email address"** |
| ACP3-TC3 | เปิดฟอร์ม | Email: `test@gmail` (no TLD) | Email format ผิด | บันทึกไม่สำเร็จ · toast **"Invalid email address"** |
| ACP3-TC4 | เปิดฟอร์ม | Email: `test@@gmail.com` (double @) | Email format ผิด | บันทึกไม่สำเร็จ · toast **"Invalid email address"** |
| ACP3-TC5 | เปิดฟอร์ม | Email: `test@gmail.c` (TLD 1 ตัว) | Email format ผิด | บันทึกไม่สำเร็จ · toast **"Invalid email address"** |
| ACP3-TC6 | เปิดฟอร์ม | Email: `test@.com` (domain ขึ้นต้นด้วยจุด) | Email format ผิด | บันทึกไม่สำเร็จ · toast **"Invalid email address"** |

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

### VCL — View Customer List (Toggle Table / Grid View)

> **UI Reference (27/06/2026):** Toggle ☰/⊞ อยู่มุมบนซ้าย · active = highlighted สีน้ำเงิน

**VCL1 — Default Table View (Use Case)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCL1-TC1 | มี Customer ≥1 รายการอยู่แล้ว (เช่น ana Yukinae) | เปิดหน้า Customer List (navigate fresh) | Table View เป็น default | icon ☰ highlighted สีน้ำเงิน · icon ⊞ ไม่ highlighted · ตารางแสดง columns: **ลูกค้า / ติดต่อ / ผลิตภัณฑ์ / บริการ / ประเภท / เปิดใช้งาน** + action buttons (โทร/อีเมล/แชท/ดู/แก้ไข/ลบ) ต่อ row |

**VCL2 — Switch to Grid View (State Transition)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCL2-TC1 | อยู่ใน Table View (VCL1-TC1) · มี Customer ≥1 รายการ | กด icon ⊞ (Grid View toggle) | สลับไป Grid View | icon ⊞ highlighted สีน้ำเงิน · icon ☰ ไม่ highlighted · หน้าแสดงเป็น **Card layout** (ไม่มี table) · Card แต่ละใบแสดง: รูปโปรไฟล์ + ชื่อ + Type badge + สถานะ dot + อีเมล + เบอร์ + จำนวน ผลิตภัณฑ์ + จำนวน บริการ + action buttons (โทร/อีเมล/แชท/ดู/แก้ไข/ลบ) |

**VCL3 — Switch back to Table View (State Transition)**
| TC ID | Arrange | Test Data | Tested Condition | Expected |
|---|---|---|---|---|
| VCL3-TC1 | อยู่ใน Grid View (VCL2-TC1) | กด icon ☰ (Table View toggle) | สลับกลับ Table View | icon ☰ highlighted สีน้ำเงิน · icon ⊞ ไม่ highlighted · ตาราง columns **ลูกค้า / ติดต่อ / ผลิตภัณฑ์ / บริการ / ประเภท / เปิดใช้งาน** กลับมาแสดง · Card layout ไม่ปรากฏ |

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

> **HA ที่เปิดใหม่ (27/06/2026) — VCL (TS-10):**

| # | คำถาม | สถานะ | คำตอบ |
|---|---|---|---|
| HA-VCL1 | View preference ถูก persist ข้าม session ไหม? (refresh/เปิดใหม่ → ยังคง Grid View หรือ reset กลับ Table?) | ⚠️ รอ PO | Propose: **reset กลับ Table View** ทุกครั้งที่ navigate เข้า page ใหม่ |
| HA-VCL2 | Grid View แสดง pagination/rows-per-page เหมือนกับ Table View ไหม? | ⚠️ รอ PO | Propose: **ใช่** — pagination controls (กำลังแสดง / แสดะ: N รายการ / หน้า X จาก Y) ปรากฏทั้งสองโหมด |
| HA-VCL3 | Search/Filter ทำงานใน Grid View ได้เหมือน Table View ไหม? (ค้นหาแล้วยังคง Grid layout) | ⚠️ รอ PO | Propose: **ใช่** — layout ไม่เปลี่ยนเมื่อ search ขณะอยู่ใน Grid View |

---

## Step 4 — Test Scenarios (mirror of xlsx / Lark Base — EN, flat)

> **Sync 24/06/2026** — mirror ตาม `customer-profile-testcases.xlsx` (source of truth). Scenario No. (`TS-##` Success / `TA-##` Alternative) + TC ที่อยู่ใน Scenario. รายละเอียด Steps / Expected / Test Data ครบอยู่ใน xlsx.
> Note: TC No. ไม่จำเป็นต้องตรงกับ Scenario No. (e.g. TS-06 ใช้ TC `TS-08_TC-01`, `TS-09_TC-01`, `TS-09_TC-03`; TS-07 ใช้ `TA-10_TC-01`; TA-01 ใช้ `TA-02_TC-01`)

### Success Scenarios

---

**TS-01** — User can successfully search and filter the customer list to find a profile and view customer detail
> Arrange: Somchai Jaidee (somchai.jai@gmail.com / 0812345678 / Type: Gold)
```
1.  TS-01_TC-01   Navigate to "Customer List Page" → Add Customer button + Search bar + Filter Type + Table
2.  TS-01_TC-02   Search keyword "Somchai" (First Name) → Somchai Jaidee
3.  TS-01_TC-03   Search keyword "Jaidee" (Last Name) → Somchai Jaidee
4.  TS-01_TC-04   Search keyword "0812345678" (Phone No.) → Somchai Jaidee
5.  TS-01_TC-05   Search keyword "somchai.jai@gmail.com" (Email) → Somchai Jaidee
6.  TS-01_TC-06   Filter Type "Gold" → Somchai Jaidee
7.  TS-01_TC-07   Click View → Customer Information of Somchai Jaidee (Tab "Customer")
8.  TS-01_TC-08   View Personal Details (Type / Profile Image / Name / Contact Info / Address)
9.  TS-01_TC-09   View Preferences section (Contact: Mobile Number, Language: Thai)
10. TS-01_TC-10   View Custom Form section (Company / Employee ID / Line ID / Driving License / Position)
```

---

**TS-02** — User can successfully add a customer profile
> Arrange: No customer with email siriwimon@gmail.com in system
> Test Data: Siriwimon Somjit | Email: siriwimon@gmail.com | Phone: 0873331134 | Type: Platinum
```
1.  TS-02_TC-01   Navigate to "Add Customer Page"
2.  TS-02_TC-02   Upload Profile Photo (profile_siriwimon.jpg) → thumbnail preview
3.  TS-02_TC-03   Fill in all fields in Personal Details
4.  TS-02_TC-04   Fill in all fields in Registered Address
5.  TS-02_TC-05   Checkbox "Same As Registered" → hide Current Address section
6.  TS-02_TC-06   Fill in all fields in Preferences
7.  TS-02_TC-07   Fill in all fields in Custom Form
8.  TS-02_TC-08   Click Save → redirect to List + Toast "Success"
9.  TS-02_TC-09   Search keyword "siriwimon@gmail.com" → Siriwimon Somjit appears
10. TS-02_TC-10   Navigate to Edit → Personal Details match what was added
11. TS-02_TC-11   Registered Address (+ Current Address same as registered) match
12. TS-02_TC-12   Preferences match what was added
13. TS-02_TC-13   Custom Form matches what was added
```

---

**TS-03** — User can successfully update a customer profile
> Arrange: Wannapa Suksai (wannapa@gmail.com / Type: Platinum)
> Test Data (after edit): Wannapha Sooksai | wannapha12@gmail.com | Type: Gold
```
1.  TS-03_TC-01   Navigate to "Edit Customer Page" (Wannapa Suksai) → form shows current values
2.  TS-03_TC-02   Change Profile Photo (profile_wannapa1.jpg) → thumbnail preview
3.  TS-03_TC-03   Edit all fields in Personal Details
4.  TS-03_TC-04   Edit all fields in Registered Address
5.  TS-03_TC-05   Uncheck "Same As Registered" → Edit all fields in Current Address
6.  TS-03_TC-06   Edit all fields in Preferences
7.  TS-03_TC-07   Edit all fields in Custom Form
8.  TS-03_TC-08   Click Save → redirect to List + Toast "Success"
9.  TS-03_TC-09   Search keyword "wannapha12@gmail.com" → Wannapha Sooksai appears
10. TS-03_TC-10   Navigate to Edit → Personal Details match the changes
11. TS-03_TC-11   Address matches (new Registered + different Current Address)
12. TS-03_TC-12   Preferences match the changes
13. TS-03_TC-13   Custom Form matches the changes
```

---

**TS-04** — User can successfully delete a customer profile
> Arrange: Wannapha Sooksai (wannapha12@gmail.com / Type: Gold) — no active items
```
1.  TS-04_TC-01   Navigate to Customer List → search "wannapha12@gmail.com" → Wannapha Sooksai
2.  TS-04_TC-02   Click Delete → Confirmation Dialog (Confirm / Cancel)
3.  TS-04_TC-03   Click "Cancel" → customer still in list
4.  TS-04_TC-04   Click Delete again → Confirmation Dialog appears again
5.  TS-04_TC-05   Click "Confirm" → Toast "Success"
6.  TS-04_TC-06   Search "wannapha12@gmail.com" → "No results found."
```

---

**TS-05** — View Customer Product, Service and Case and Navigate to Case Detail Page
> Arrange: Somchai Jaidee — Product (1) / Service (2) / Cases (2: CS-20250101-001, CS-20250101-002)
```
1.  TS-05_TC-01   Click View "Somchai Jaidee" → Product (1) / Service (2) / Cases (2) displayed
2.  TS-05_TC-02   Click row "CS-20250101-001" → navigate to Case Detail Page
```

---

**TS-06** — User can successfully add product and service (QA Phase Only)
> Arrange: Natthawat Jetbordin (natthawat.ntw@company.co.th)
```
1.  TS-08_TC-01   Fill in all required fields → Add Product successfully (Toast "Success")
2.  TS-09_TC-01   Fill in all required fields → Add Service successfully (Toast "Success")
3.  TS-09_TC-03   Click Customer tab → Product and Service List displayed
```

---

**TS-07** — User can successfully add a customer profile when using today's date as the Date of Birth
```
1.  TA-10_TC-01   Fill Email + Phone + DOB = current date → Click Save → redirect to List + Toast "Success"
```

---

**TS-09** — User can navigate between pages and change the number of rows displayed per page
> Arrange: ≥ 11 Customer records in system · default rows per page = 10
```
1.  TS-09_TC-01   Navigate to Customer List → pagination controls visible (Next active / Prev / rows-per-page dropdown)
2.  TS-09_TC-02   Click "Next" (>) → page 2 displays (different records, indicator updates)
3.  TS-09_TC-03   Click "Previous" (<) → page 1 returns (original records, indicator returns)
4.  TS-09_TC-04   Select rows-per-page = 25 → table shows ≤ 25 rows, indicator updates
5.  TS-09_TC-05   Select rows-per-page = 10 → table shows ≤ 10 rows, indicator updates
```

---

---

**TS-08** — Display fallback: Customer without name shows Email; Customer without Type shows N/A
> Arrange: (1) Customer ที่ไม่มี First/Last name (มีแค่ Email + Phone) · (2) Customer ที่ไม่มี Type
```
1.  TS-08_TC-01   Seed customer ไม่มีชื่อ → Navigate to List → Click View → Display Name = Email (fallback)
2.  TS-08_TC-02   (ต่อเนื่องจาก TC-01 — same customer ไม่มี Type) → ช่อง Type แสดง "N/A"
```
> Note: TS-08 ยืนยัน behavior PO round-2 · TC ID ใน xlsx/Lark Base ยังไม่มี (เพิ่มเมื่อ push ครั้งต่อไป)

---

**TS-10** — User can view Customer List in Table View (default) and switch to Grid View and back
> Arrange: ≥1 Customer record in system (e.g. ana Yukinae)
```
1.  TS-10_TC-01   Navigate to Customer List → Table View (☰ highlighted · columns: ลูกค้า/ติดต่อ/ผลิตภัณฑ์/บริการ/ประเภท/เปิดใช้งาน)
2.  TS-10_TC-02   Click Grid View icon (⊞) → Grid/Card layout (⊞ highlighted · cards: photo/name/type/email/phone/product count/service count/actions)
3.  TS-10_TC-03   Click Table View icon (☰) → Table layout restored (☰ highlighted · columns back · cards hidden)
```

---

### Alternative Scenarios

| Scenario | Scenario Name | TC | Expected |
|---|---|---|---|
| TA-01 | Verify "No results found" when searching a keyword with no results | TA-02_TC-01 | Search "Wilawann" → "No results found." |
| TA-02 | Verify error toast when adding a customer with an empty email address | TA-03_TC-01 | Add with empty email → "Please enter an email address" |
| TA-03 | Verify error toast when adding a customer with an empty phone number | TA-04_TC-01 | Email: karaked123@gmail.com, Phone: (empty) → "Please enter a mobile number" |
| TA-04 | Verify error toast when adding a customer with a duplicate email address | TA-05_TC-01 | Email: somchai.jai@gmail.com (dup) → "Email already exists" |
| TA-05 | Verify error toast when adding a customer with an invalid email address format | TA-06_TC-01 | Email: darinee.com (no @) → "Invalid email format" |
| TA-06 | Verify error toast when adding a customer with less than 13 digits in Citizen ID | TA-07_TC-01 | Citizen ID: 123456789012 (12 digits) → "Invalid CitizenID format" |
| TA-07 | Verify error toast when adding a customer with more than 13 digits in Citizen ID | TA-08_TC-01 | Citizen ID: 12345678901234 (14 digits) → "Invalid CitizenID format" |
| TA-08 | Verify DOB in the future cannot be selected | TA-09_TC-01 | DOB: future date → calendar disables future dates (not selectable) |
| TA-09 | Verify error toast when adding a customer with a wrong photo format (PDF) | TA-11_TC-01 | Upload contract.pdf → toast "Error" + file not uploaded |
| TA-10 | Verify error toast when adding a customer with a photo size larger than 3MB | TA-12_TC-01 | Upload photo_hd.jpg (>3MB) → toast "Error" + file not uploaded |
| TA-11 | Verify error toast when updating a customer with a duplicate email address | TA-13_TC-01 | Email: natthawat.ntw@company.co.th (dup) → "Email already exists" |
| TA-12 | No update when click Edit then click Cancel/Back | TA-14_TC-01 | Change Phone → Back → phone unchanged |
| TA-13 | Verify error toast when deleting a customer that has an active Case | TA-16_TC-01 | Delete Somchai Jaidee (active case) → "Customer has active warranty products" |
| TA-14 | Verify "No results found." when viewing customer Product with no data | TA-17_TC-01 | View Product section (Natthawat) → "No results found." |
| TA-15 | Verify "No results found." when viewing customer Service with no data | TA-18_TC-01 | View Service section (Natthawat) → "No results found." |
| TA-16 | Verify "No results found." when viewing customer Case with no data | TA-19_TC-01 | View Case section (Natthawat) → "No results found." |
| TA-17 | Verify error toast when adding a customer with an invalid phone number format | TA-06_TC-01 ⚠️ | Phone: abc123 (non-numeric) → "Invalid mobile number" |
| TA-18 | Verify Previous Page button is disabled when on the first page | TA-20_TC-01 | On page 1 → Previous button disabled, clicking does not change page |
| TA-19 | Verify Next Page button is disabled when on the last page | TA-21_TC-01 | On last page → Next button disabled, clicking does not change page |

> **หมายเหตุ sync (26/06/2026 — อัปเดตจาก Lark Base CSV export):**
> - ข้อความ toast ยืนยันจาก CSV: "Email already exists" / "Invalid email format" / "Invalid CitizenID format" / "Invalid mobile number" / "Customer has active warranty products" / "Error" (photo)
> - TA-09, TA-10: UI toast = generic **"Error"** (ไม่ใช่ specific message) — spec assertion ปรับเป็น `/\berror\b/i` แล้ว
> - TA-17: เปลี่ยนจาก "duplicate phone" → **"Invalid mobile number"** (invalid format) — TC No. = `TA-06_TC-01` (⚠️ ซ้ำกับ TA-05 ใน Lark Base — ค่าที่มีอยู่แล้ว ไม่ใช่ bug ใหม่)
> - TS-08 (display fallback): เพิ่มเข้า Step 4 แล้ว (27/06/2026) · TS-08_TC-01 + TS-08_TC-02 ยังไม่มีใน xlsx/Lark Base
>
> **อัปเดต 27/06/2026 — แก้ TC ID ซ้ำ:**
> - TA-18 (Prev button disabled): แก้ TC จาก `TA-18_TC-01` → **`TA-20_TC-01`** (ตรง spec)
> - TA-19 (Next button disabled): แก้ TC จาก `TA-19_TC-01` → **`TA-21_TC-01`** (ตรง spec)
> - เหตุผล: `TA-18_TC-01`/`TA-19_TC-01` ถูกใช้โดย TA-15 (no service) / TA-16 (no case) แล้ว

---

## Step 5 — Definition of Done (Self-check)

- [x] แปลง Needs เป็น Business Conditions ครบ (VCP 5 / ACP 7 / UCP 3 / DCP 4 / VPRD 2 / VSVC 2 / VCC 2 = 25 conditions)
- [x] เทคนิคครบ EP / BVA / State Transition / Use Case
- [x] BVA: Citizen ID มีครบ น้อยกว่า/เท่ากับ/มากกว่า (3 ค่า); DOB อดีต/วันนี้/อนาคต
- [x] State Transition: Delete ครบ (Active→Dialog→Deleted / Active→Dialog→Active ย้อนกลับ / Active+ActiveItems→Blocked)
- [x] Test Case ครบ 4 ส่วน (Arrange / Test Data / Tested Condition / Expected)
- [x] มีทั้ง Success (TS-01..TS-08 = 8) และ Alternative (TA-01..TA-17 = 17) Scenario — +TS-08 (display fallback) +TA-17 (dup phone) จาก PO round-2
- [x] ไม่มีเงื่อนไขขัดแย้งกันใน Scenario เดียวกัน
- [x] Test Data เป็น Real Example ไม่มีคำว่า Test/ทดสอบ
- [x] HA ทั้งหมด (HA1–HA11) ปิดครบแล้ว — ไม่มี Blocked TC
- [x] ติด ID ทุก TC และทำสัญลักษณ์ ✓ บน TC ที่ใช้แล้วใน Scenario
- [x] อัปเดตจากคำตอบ PO (12/06/2026): Username=Email, Required=Email+Phone, Photo 3MB, Delete Block, Search fields, VCC clickthrough
