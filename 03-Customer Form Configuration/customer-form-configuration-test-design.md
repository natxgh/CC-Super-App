# Test Design — Add/Edit Customer Form Configuration (CFC) 〔ไฟล์ 1: Design〕

> **ไฟล์ 1 (Design)** — 4 เทคนิค → Business Conditions → ร้อยเป็น Scenario (flow) + Hidden Assumptions
> รายละเอียดราย Test Case อยู่ใน **ไฟล์ 2** `customer-form-configuration-testcases.xlsx` (1 sheet)
> ออกแบบตาม `test-design-standard.md` (Black Box) + AAA Pattern. Scenario = Flow E2E.
>
> **Input:** สำรวจ STG จริง `/cc/contacts-configurations` (v0.26.1) + BRD CC Super App v0.3
> **Feature Prefix:** `CFC` · **Scope:** Custom Form / Dynamic Form Builder (Add + Edit)
>
> **อัปเดต 13/06/2026:** Apply คำตอบ PO Q1–Q9 ครบ (ดู section ด้านล่าง) · ปลดบล็อก scenario ที่ค้าง

---

## PO Answers Applied (13/06/2026)

| Q | ประเด็น | คำตอบ PO | ผลต่อ Design |
|---|---|---|---|
| Q1 | Form Name required + ห้ามซ้ำ | ✅ required + ห้ามว่าง + ห้ามซ้ำ (แสดง error) | CFC2-TC2 = error/block · เพิ่ม CFC2-TC3 (ชื่อซ้ำ) |
| Q2 | Grid Columns min/max | รับ **1–5** · นอกช่วง = **clamp** (ไม่ใช่ error) | CFC3 boundary = 0/1/5/6 → clamp |
| Q3 | Image format & size | JPG/PNG/JPEG **≤ 3MB** (Staging) | CFC4-TC5 / CFC16 upload |
| Q4 | Field Label required | ❌ **ไม่ required** — มี default, ลบทิ้ง = not required | CFC5-TC3 = save ได้ (ไม่บล็อก) · ลบ CFC_TA04 |
| Q5 | Delete field confirm | ❌ ลบ field = **revision ใหม่** ไม่ลบจริง · ไม่มี dialog · **ลบ Form ผ่านหน้านี้ไม่ได้** | CFC9-TC1 ปรับ · CFC_UI02 |
| Q6 | Import JSON schema | ✅ เฉพาะ builder · malformed → **"Invalid form schema"** | CFC11-TC2 = exact text |
| Q7 | ปิด × unsaved | ❌ **ปิดทิ้งเงียบ ไม่มี warning** | CFC1-TC3 ปรับ · CFC_TA06 ปรับ |
| Q8 | Conditional Logic + RBAC per field | ✅ **ไม่มี** (out of scope) | BRD cross-check ปิด |
| Q9 | ลบ custom field ที่มีข้อมูล | ❌ ลบ Form ผ่านหน้านี้ไม่ได้ → จัดการที่ **Form Builder** | scope note |

> **Workflow ยืนยันจาก PO (Q7):**
> - Create New Form → Setting Field → **Preview** → Save form
> - Edit Form → Setting Field (**new revision**) → Preview → Save Change

---

## BRD Cross-check

| หัวข้อ BRD | สิ่งที่ STG มีจริง | ผล |
|---|---|---|
| CMS → Administration & Customization → **Custom Form / Custom Field / Template Configuration** | ✅ Dynamic Form Builder (15 field types) | ตรง — feature นี้คือ implementation ของ Custom Form |
| CRM → Customer Profile → **Custom Fields Examples** (Company Name, Employee ID, Line ID...) | ✅ สร้าง custom field เองได้ผ่าน builder | ตรง |
| **Conditional Logic** (BRD ระบุ) | ❓ ยังไม่เห็นใน builder | ✅ PO ยืนยัน Q8: **ไม่มีในรอบนี้** (out of scope) |
| **Role-Based Access Control / Sensitive Data Restriction** (BRD ระบุ) | ❓ ยังไม่เห็นใน config ราย field | ✅ PO ยืนยัน Q8: **ไม่มีในรอบนี้** (out of scope) |
| Field validation per type | ❓ เห็นแค่ Required + Column Span | ⚠️ Hidden Assumption (ยังไม่ถาม) |

> **สรุป:** STG implement Custom Form ครบกว่าที่ BRD บรรยาย · Conditional Logic + RBAC per field PO ยืนยัน (Q8) **ไม่มีในรอบนี้** → ตัดออกจาก scope การทดสอบ

---

## สิ่งที่เห็นจริงใน STG (Reference)

**Custom Form section** (บนหน้า Customer Form Configuration):
- Toggle `Custom Form` (เปิด/ปิดทั้ง section)
- Dropdown เลือก form ที่มีอยู่ (เช่น "Contact Customization") + clear (×)
- Dropdown "Select an option"
- ปุ่ม **Edit** (แก้ form ที่เลือก) · **Add** (สร้าง form ใหม่)
- ปุ่ม **Save Configuration** (ท้ายหน้า)

**Dynamic Form Builder modal** (เปิดจาก Add/Edit):
- **Form Elements** (15 types): Text · Number · Text Area · Email · Multi-Checkbox · Single-Select · Image · DnD Image · Multi-Image · DnD Multi-Image · Date · Date & Time · Radio · Group · Dynamic Field
- **Form Settings**: Form Name (default "New Dynamic Form") · Desktop Grid Columns (default 1)
- **Per-field config**: ID (auto UUID) · Label · Placeholder · Required (checkbox) · Desktop Column Span (25/50/75/100%)
- **Form Layout Editor**: Hide All / Show All · drag reorder · Import · Export · Preview
- ปิด modal = `×` (มุมขวาบน)


---

## Step 1 — Business Conditions

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| CFC1 | เปิด Dynamic Form Builder ได้ 2 ทาง: **Add** (form ว่างใหม่) / **Edit** (โหลด form เดิม) | State Transition | initial state ต่างกัน (empty vs loaded) |
| CFC2 | Form Name ต้องกรอก (required — assumption) | EP | กรอก / ว่าง |
| CFC3 | Desktop Grid Columns รับค่าตัวเลขในช่วงที่กำหนด | BVA | numeric boundary (min/max) |
| CFC4 | เพิ่ม field ได้ทุก type (15 ชนิด) | Use Case | enumerate ทุก type |
| CFC5 | แต่ละ field กำหนด Label / Placeholder ได้ | Use Case | field metadata |
| CFC6 | Required toggle ต่อ field (ON/OFF) | EP | required / optional |
| CFC7 | Desktop Column Span เลือกได้ 25/50/75/100% | EP | 4 ค่า discrete |
| CFC8 | จัดลำดับ field ใหม่ (drag reorder) ใน Layout Editor | State Transition | order เปลี่ยน |
| CFC9 | ลบ field ออกจาก form | State Transition | field count ลด |
| CFC10 | Hide All / Show All fields | State Transition | visible ↔ hidden (toggle) |
| CFC11 | Import form (JSON schema) | Use Case | valid / invalid JSON |
| CFC12 | Export form (JSON schema) | Use Case | download schema |
| CFC13 | Preview form ก่อนบันทึก | Use Case | render preview |
| CFC14 | Save Configuration → form ถูก persist + แสดงใน dropdown | State Transition | Draft → Saved |
| CFC15 | เลือก form เดิมจาก dropdown แล้ว Edit → โหลด field เดิมครบ | Use Case | load existing |
| CFC16 | หน้า Add/Edit Customer แสดง Custom Form ตรงกับที่ config ไว้ (field, label, required, options, layout) | Use Case | integration — consumer side |

---

## Step 2 — State Transition: Form Builder Lifecycle

```
[ไม่มี form / Add]
       │ คลิก "Add" (Actor: Config user)
       ▼
[New Dynamic Form — empty]
       │ คลิก field type (Text/Number/...) → field ถูกเพิ่ม (self-loop ได้หลายครั้ง)
       ▼
[Form มี field N ตัว] ──drag──► reorder · ──Delete field──► field N-1
       │ ตั้ง Form Name + config แต่ละ field
       │ คลิก "Save Configuration" (Actor: Config user)
       ▼
[Saved — form แสดงใน dropdown]
       │ เลือกจาก dropdown → คลิก "Edit" (Actor: Config user)
       ▼
[Edit — โหลด field เดิมครบ]  ──แก้ (new revision)──►  Save Change → update

ปิด modal (×) โดยไม่ Save → ปิดทันที ทิ้ง draft เงียบ ไม่มี warning (PO Q7)
หมายเหตุ: ลบ field = ขึ้น revision ใหม่ (ไม่ลบจริง) · ลบ Form ผ่านหน้านี้ไม่ได้ → จัดการที่ Form Builder (PO Q5/Q9)
```

---

## Step 3 — Test Cases (AAA ย่อ)

> **Arrange ทุก TC (Global):**
> Login User: ketwadee
> Role & Permission: All Permission - Contact Configuration
>
> Arrange เฉพาะ TC = context เพิ่มเติมต่อจากนี้ (หน้าที่อยู่ / สถานะ builder / ข้อมูลที่มีอยู่)

### CFC1 — Open Builder (State Transition)
| TC ID | Arrange | Act | Tested Condition | Expected (Assert) |
|---|---|---|---|---|
| CFC1-TC1 | อยู่หน้า Customer Form Configuration, Custom Form toggle = ON | คลิกปุ่ม "Add" | เปิด builder แบบ empty | modal "Dynamic Form Builder" เปิด, Form Name = "New Dynamic Form", ไม่มี field |
| CFC1-TC2 | มี form "Contact Customization" ใน dropdown + เลือกไว้แล้ว | คลิกปุ่ม "Edit" | เปิด builder แบบ loaded | modal เปิดพร้อม field เดิมของ "Contact Customization" |

### CFC2 — Form Name required + ห้ามซ้ำ (EP) ✅ Q1
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC2-TC1 | อยู่ใน builder (Add) | กรอก Form Name = "ข้อมูลลูกค้าองค์กร B2B" | Form Name มีค่า | รับค่า, ชื่อถูกบันทึกใน Form Settings |
| CFC2-TC2 | อยู่ใน builder, ลบ Form Name จนว่าง | คลิก "Save Configuration" | Form Name ว่าง | block save + error label ใต้ช่อง Form Name (exact text `""` TBC) · form ไม่ถูก persist |
| CFC2-TC3 | มี form "Contact Customization" saved อยู่แล้ว, อยู่ใน builder (Add) | กรอก Form Name = "Contact Customization" → Save | Form Name ซ้ำของเดิม | block save + error "ชื่อซ้ำ" (exact text `""` TBC) · form ไม่ถูก persist |

### CFC3 — Desktop Grid Columns (BVA) ✅ Q2 — รับ 1–5, นอกช่วง = clamp
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC3-TC1 | อยู่ใน builder | Grid Columns = 0 | น้อยกว่า min (min−1) | clamp → ค่าถูกปรับเป็น 1 (ไม่ error) |
| CFC3-TC2 | อยู่ใน builder | Grid Columns = 1 | min | รับค่า, layout 1 คอลัมน์ |
| CFC3-TC3 | อยู่ใน builder | Grid Columns = 5 | max | รับค่า, layout 5 คอลัมน์ |
| CFC3-TC4 | อยู่ใน builder | Grid Columns = 6 | มากกว่า max (max+1) | clamp → ค่าถูกปรับเป็น 5 (ไม่ error) |

### CFC4 — Add field by type (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC4-TC1 | builder empty | คลิก "Text" | เพิ่ม Text field | field Text ปรากฏใน Layout Editor พร้อม config (Label/Placeholder/Required/Span) |
| CFC4-TC2 | builder empty | คลิก "Single-Select" | เพิ่ม Single-Select | field ปรากฏ + มีช่อง "New option" + ปุ่ม + ใน config panel สำหรับเพิ่ม/ลบ options |
| CFC4-TC3 | builder empty | คลิก "Date" | เพิ่ม Date field | field Date ปรากฏ |
| CFC4-TC4 | builder empty | คลิก "Multi-Checkbox" | เพิ่ม Multi-Checkbox | field ปรากฏ + มีช่อง "New option" + ปุ่ม + ใน config panel สำหรับเพิ่ม/ลบ options |
| CFC4-TC5 | builder empty | คลิก "DnD Multi-Image" | เพิ่ม upload field | field upload ปรากฏใน Layout Editor (รับ JPG/PNG/JPEG ≤ 3MB — ตรวจ enforce จริงที่ CFC16 ฝั่ง Add Customer) |
| _(ครอบทั้ง 15 type — ราย type ใน xlsx)_ | | | | |

### CFC5 — Field Label / Placeholder (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC5-TC1 | มี Text field ใน builder | กรอก Label = "เลขประจำตัวผู้เสียภาษี" | ตั้ง Label | Label แสดงบน field |
| CFC5-TC2 | มี Text field ใน builder | กรอก Placeholder = "กรอกเลข 13 หลัก" | ตั้ง Placeholder | Placeholder แสดงใน preview |
| CFC5-TC3 | มี Text field ใน builder (Label มีค่า default มาให้) | ลบ Label จนว่าง → Save | Label ว่าง (not required) | save ได้ (ไม่บล็อก) · field กลายเป็น not required (Q4: Label ไม่บังคับ) |

### CFC6 — Required toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC6-TC1 | มี field ใน builder | ติ๊ก Required = ON | field required | preview แสดง field เป็น required (เครื่องหมาย *) |
| CFC6-TC2 | มี field ใน builder | Required = OFF (default) | field optional | preview ไม่บังคับกรอก |

### CFC7 — Column Span (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC7-TC1 | มี field, Grid Columns ≥ 2 | Column Span = 100% | full width | field กิน full row |
| CFC7-TC2 | มี field, Grid Columns ≥ 2 | Column Span = 50% | ครึ่ง | field กินครึ่ง row |
| CFC7-TC3 | มี field, Grid Columns ≥ 4 | Column Span = 25% | quarter | field กิน 1/4 row |

### CFC8 — Reorder fields (State Transition)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC8-TC1 | มี ≥ 2 fields (Text, Number) | drag Number ขึ้นเหนือ Text | สลับลำดับ | order เปลี่ยน, preview สะท้อนลำดับใหม่ |

### CFC9 — Delete field (State Transition) ✅ Q5
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC9-TC1 | มี 2 fields | ลบ field 1 ตัว | field count ลด | field หายจาก Layout Editor ทันที (ไม่มี dialog ยืนยัน) เหลือ 1 field · การลบ = ขึ้น revision ใหม่ ของเดิมไม่ถูก hard-delete (Q5) |

### CFC10 — Hide All / Show All (State Transition)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC10-TC1 | มีหลาย field expanded | คลิก "Hide All" | ยุบ config ทุก field | config ทุก field ถูกซ่อน (collapse) |
| CFC10-TC2 | config ถูกซ่อนหมด | คลิก "Show All" | ขยายทุก field | config ทุก field แสดง |

### CFC11 — Import (Use Case) ✅ Q6
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC11-TC1 | มีไฟล์ JSON schema ที่ export จาก builder นี้ (valid) | คลิก "Import" → เลือกไฟล์ | import valid schema | field ถูกโหลดเข้า builder ครบตาม schema |
| CFC11-TC2 | มีไฟล์ JSON ที่ malformed | คลิก "Import" → เลือกไฟล์ | import invalid | error "Invalid form schema" · ไม่โหลด field เข้า builder |

### CFC12 — Export (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC12-TC1 | builder มี field ≥ 1 | คลิก "Export" | export schema | ดาวน์โหลดไฟล์ JSON ที่มี field ครบ |

### CFC13 — Preview (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC13-TC1 | builder มี field หลากชนิด | คลิก "Preview" | render preview | แสดงฟอร์มจริงตาม config (label, required, layout) |

### CFC14 — Save Configuration (State Transition) ✅ Q1
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC14-TC1 | builder: Form Name="ข้อมูลลูกค้าองค์กร B2B" + 3 fields ครบ config | คลิก "Save Configuration" | save valid form | บันทึกสำเร็จ (toast), form แสดงใน dropdown |
| CFC14-TC2 | หลัง save form ใหม่ | เปิด dropdown Custom Form | form ใหม่อยู่ใน list | เห็น "ข้อมูลลูกค้าองค์กร B2B" ใน dropdown |

### CFC15 — Edit existing form (Use Case) ✅ Q9
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC15-TC1 | มี form "Contact Customization" saved | เลือกจาก dropdown → Edit → แก้ Label field หนึ่ง → Save Change | edit & re-save (new revision) | field เดิมโหลดครบ, แก้แล้ว Save Change สำเร็จ เป็น revision ใหม่ |
| CFC15-TC2 | อยู่หน้า Customer Form Configuration, เลือก form ใน dropdown | หา option/ปุ่ม "Delete Form" บนหน้านี้ | ลบ Form จากหน้า config | ไม่มีปุ่ม Delete Form บนหน้า Customer Form Configuration · การจัดการ/ลบต้องทำที่ Form Builder (Q9) |

### CFC16 — Rendered form on Add/Edit Customer (Use Case — Integration)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC16-TC1 | save form "ข้อมูลลูกค้าองค์กร B2B" (มี Text label "เลขประจำตัวผู้เสียภาษี" Required=ON, Column Span=50%) + Custom Form toggle ON | ไปหน้า Add Customer | form render บน consumer page | Custom Form section แสดง field "เลขประจำตัวผู้เสียภาษี" พร้อม * (required) และ layout 50% |
| CFC16-TC2 | form ที่มี field Required=ON ถูก config แล้ว | ที่หน้า Add Customer: กรอกข้อมูลไม่ครบ field required → บันทึก | consumer-side required validation | block save + error ใต้ field required (exact text `""` TBC) บนหน้า Add Customer |
| CFC16-TC3 | form ที่มี Single-Select field + options ["นิติบุคคล", "บุคคลธรรมดา"] ถูก config แล้ว | ที่หน้า Add Customer: คลิก field Single-Select | options ขึ้นตาม config | dropdown แสดง "นิติบุคคล", "บุคคลธรรมดา" ครบ |
| CFC16-TC4 | form ที่มี Image upload field ถูก config แล้ว | ที่หน้า Add Customer: upload ไฟล์ .pdf 5MB เข้า field Image | enforce format+size (Q3) | block + error "รับเฉพาะ JPG/PNG/JPEG ≤ 3MB" (exact text `""` TBC) |

### Cancel/Close (State Transition) ✅ Q7
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| CFC1-TC3 | builder มี field ที่ยังไม่ save | คลิก "×" ปิด modal | ปิดโดยไม่ save | modal ปิดทันที ทิ้ง draft เงียบ ไม่มี warning dialog (Q7) · เปิด builder ใหม่ไม่มี draft ค้าง |

---

## Step 4 — Hidden Assumptions (✅ PO ตอบครบ 13/06/2026)

| Q | ประเด็น | คำตอบ PO (final) | สถานะ |
|---|---|---|---|
| Q1 | Form Name required + ห้ามซ้ำ | required + ห้ามว่าง + ห้ามซ้ำ → แสดง error | ✅ ยืนยัน |
| Q2 | Grid Columns min/max | รับ 1–5 · นอกช่วง = **clamp** (ไม่ error) | ✅ ปรับ (clamp) |
| Q3 | Image format & size | JPG/PNG/JPEG **≤ 3MB** (Staging) | ✅ ปรับ (3MB) |
| Q4 | Field Label required | ❌ **ไม่ required** — มี default, ลบทิ้ง = not required | ✅ กลับด้าน |
| Q5 | Delete field confirm | ❌ ลบ field = **revision ใหม่** ไม่ลบจริง · ไม่มี dialog · **ลบ Form ผ่านหน้านี้ไม่ได้** | ✅ ปรับ |
| Q6 | Import JSON schema | เฉพาะ builder · malformed → "Invalid form schema" | ✅ ยืนยัน |
| Q7 | ปิด × unsaved | ❌ **ปิดทิ้งเงียบ ไม่มี warning** | ✅ กลับด้าน |
| Q8 | Conditional Logic + RBAC per field | **ไม่มี** (out of scope) | ✅ ยืนยัน |
| Q9 | ลบ custom field ที่มีข้อมูล | ❌ ลบ Form ผ่านหน้านี้ไม่ได้ → จัดการที่ Form Builder | ✅ ปรับ |

> **ไม่มี Hidden Assumption ค้าง** — sign-off ปลดบล็อกครบ

---

## Step 5 — Test Scenarios (Flow E2E)

### ✅ Success

**`CFC_TS01`** — สร้าง Custom Form ใหม่ครบ flow (Add → config → Save)
1. `CFC1-TC1` คลิก "Add" → builder empty
2. `CFC2-TC1` กรอก Form Name = "ข้อมูลลูกค้าองค์กร B2B"
3. `CFC4-TC1` เพิ่ม Text field
4. `CFC5-TC1` ตั้ง Label = "เลขประจำตัวผู้เสียภาษี"
5. `CFC6-TC1` Required = ON
6. `CFC7-TC2` Column Span = 50%
7. `CFC14-TC1` คลิก "Save Configuration"
8. `CFC14-TC2` ตรวจ form ใหม่ใน dropdown
→ **Expected:** บันทึกสำเร็จ, "ข้อมูลลูกค้าองค์กร B2B" แสดงใน dropdown

**`CFC_TS02`** — แก้ไข Custom Form เดิม (Edit existing)
1. `CFC1-TC2` เลือก "Contact Customization" → คลิก "Edit"
2. `CFC15-TC1` แก้ Label field หนึ่ง → Save
→ **Expected:** field เดิมโหลดครบ, แก้แล้ว save สำเร็จ

**`CFC_TS03`** — สร้าง form หลาย field type + Preview
1. `CFC1-TC1` Add → empty
2. `CFC2-TC1` Form Name = "แบบฟอร์มลูกค้า VIP"
3. `CFC4-TC1` เพิ่ม Text → `CFC4-TC3` เพิ่ม Date → `CFC4-TC2` เพิ่ม Single-Select
4. `CFC8-TC1` drag จัดลำดับ
5. `CFC13-TC1` คลิก "Preview"
→ **Expected:** preview แสดงฟอร์มตาม config ครบทุก field + ลำดับถูก

**`CFC_TS04`** — Export → Import (round-trip)
1. `CFC1-TC1` Add + เพิ่ม field
2. `CFC12-TC1` Export schema (JSON)
3. `CFC1-TC1` Add form ใหม่ → `CFC11-TC1` Import ไฟล์ที่เพิ่ง export
→ **Expected:** field โหลดกลับครบเหมือนเดิม

**`CFC_TS05`** — Config → Add Customer (Integration check)
1. `CFC1-TC1` Add → empty builder
2. `CFC2-TC1` Form Name = "ข้อมูลลูกค้าองค์กร B2B"
3. `CFC4-TC1` เพิ่ม Text field · `CFC5-TC1` Label = "เลขประจำตัวผู้เสียภาษี" · `CFC6-TC1` Required = ON
4. `CFC4-TC2` เพิ่ม Single-Select + เพิ่ม options "นิติบุคคล", "บุคคลธรรมดา"
5. `CFC14-TC1` Save Configuration
6. `CFC16-TC1` ไปหน้า Add Customer → ตรวจ field ปรากฏตรงกับ config (label, *, layout)
7. `CFC16-TC3` คลิก Single-Select → ตรวจ options ครบ
→ **Expected:** Custom Form บนหน้า Add Customer แสดง field + config ตรงกับที่ตั้งไว้ทุกข้อ

### ❌ Alternative

| Scenario | Flow (ลำดับ TC) | ผลลัพธ์ |
|---|---|---|
| **CFC_TA01** | CFC1-TC1 → CFC2-TC2 (Form Name ว่าง → Save) | block save + error label ใต้ Form Name |
| **CFC_TA02** | CFC1-TC1 → CFC2-TC3 (Form Name ซ้ำ → Save) | block save + error "ชื่อซ้ำ" |
| **CFC_TA03** | CFC1-TC1 → CFC3-TC1 (Grid Columns = 0) | clamp → ค่าเป็น 1 (ไม่ error) |
| **CFC_TA04** | CFC1-TC1 → CFC3-TC4 (Grid Columns = 6) | clamp → ค่าเป็น 5 (ไม่ error) |
| **CFC_TA05** | CFC1-TC1 → CFC11-TC2 (Import JSON malformed) | error "Invalid form schema" |
| **CFC_TA06** | CFC1-TC1 → เพิ่ม field → CFC1-TC3 (ปิด × unsaved) | ปิดทันที ทิ้ง draft เงียบ ไม่มี warning |
| **CFC_TA07** | CFC16-TC1 → CFC16-TC4 (upload .pdf 5MB ใน Image field หน้า Add Customer) | block + error format/size (≤ 3MB) |

> **หมายเหตุ:** CFC5-TC3 (Label ว่าง → Save) **ไม่ใช่ alternative path อีกต่อไป** — Q4 ยืนยัน Label ไม่ required, save ได้ปกติ (ย้ายไปเป็น positive case)

### 🔁 UI behavior
`CFC_UI01` — Hide/Show All: `CFC10-TC1 → CFC10-TC2` (ซ่อน → แสดง config)
`CFC_UI02` — Delete field (no dialog, revision-based): `CFC9-TC1`
`CFC_UI03` — ลบ Form ผ่านหน้า config ไม่ได้ (จัดการที่ Form Builder): `CFC15-TC2`

---

## Step 6 — Definition of Done (Self-check)

- [x] Business Conditions + ติด ID ครบ (16 conditions — CFC) + 7 conditions DFC (อัปเดต 17/06/2026)
- [x] เทคนิคครบ EP / BVA / State Transition / Use Case + ระบุเหตุผล
- [x] BVA: Desktop Grid Columns boundary ครบ min/max (0/1/5/6) — clamp ตาม Q2
- [x] State Transition: Form lifecycle ครบ (Add→config→Preview→Save→Edit revision) + self-loop (เพิ่ม field ซ้ำ) + reverse (close ไม่ save = ทิ้งเงียบ)
- [x] State Transition: Toggle lifecycle (ON↔OFF → Save → Add Customer reflects)
- [x] Test Case ครบ AAA (Arrange/Act/Assert) + Tested Condition
- [x] Integration check: CFC16 ครอบ Custom Form consumer side · DFC6 ครอบ standard field consumer side
- [x] CFC: Success 5 / Alternative 7 / UI 3 · DFC: Success 3 / Alternative 1 / UI 1
- [x] ไม่มีเงื่อนไขขัดแย้งกันใน Scenario
- [x] Test Data เป็น Real Example (ชื่อฟอร์ม/field จริง, ไม่มี Test/ทดสอบ)
- [x] **Hidden Assumptions Q1–Q9 ตอบครบ (PO ยืนยัน 13/06/2026)** — apply เข้า design ครบ
- [x] **Sign-off ปลดบล็อก** — ไม่มีคำถามค้าง
- [x] ติด ID + ทำสัญลักษณ์เคสที่ใช้ใน Scenario
- [x] **HA-DFC1–4 PO ยืนยันแล้ว (22/06/2026)** — apply เข้า design ครบ · เพิ่ม DFC2-TC5 (all-OFF) + DFC2-TC6 (data-safety)

---

## ส่วนที่ 2 — Default Field Configuration (DFC)
### Profile Photo / Personal Details / Address / Preferences

> **อัปเดต 17/06/2026:** ตรวจ STG พบว่าหน้า Customer Form Configuration มี 4 section เพิ่มเติม
> นอกจาก Custom Form — toggle ต่อ field ควบคุมว่า field ไหนจะแสดงบนหน้า Add/Edit Customer
> **อัปเดต 22/06/2026:** PO ยืนยัน HA-DFC1–4 ครบ — finalized

---

### สิ่งที่เห็นจริงใน STG — Standard Sections

**Profile Photo section:**
- Toggle `Profile Photo` (ON/OFF)

**Personal Details section:**
- 9 fields พร้อม toggle แยกกัน: Display Name · Title · First Name · Middle Name · Last Name · Citizen ID · Date of Birth · Blood Type · Gender
- ⚠️ Blood Type แสดงเป็น **OFF** ใน STG ปัจจุบัน (field อื่นทั้งหมด ON)

**Address section:**
- Sub-section **Registered Address** (13 fields): Building · Country · District · Floor · Latitude · Longitude · House No. · Postal Code · Province · Road · Room · Street · Sub-district
- Sub-section **Current Address** (13 fields เหมือนกัน): Building · Country · District · Floor · Latitude · Longitude · House No. · Postal Code · Province · Road · Room · Street · Sub-district

**Preferences section:**
- 4 fields: User Type · Language Preference · Contact Preference · Note

**Shared:**
- ปุ่ม **Save Configuration** (ท้ายหน้า) ใช้ร่วมกับ Custom Form section

---

### Step 1 (DFC) — Business Conditions

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| DFC1 | Profile Photo section: toggle ON/OFF ควบคุมว่า Photo field แสดงบนหน้า Add/Edit Customer ไหม | EP | ON vs OFF |
| DFC2 | Personal Details: 9 fields มี toggle แยกกัน — ON = แสดงใน customer form | EP | field-level granularity |
| DFC3 | Address: Registered Address + Current Address มี 13 field toggles แยกกันต่อ sub-section (config อิสระ) | EP | 2 sub-sections, independent |
| DFC4 | Preferences: 4 fields (User Type, Language Preference, Contact Preference, Note) มี toggle แยกกัน | EP | 4 discrete toggles |
| DFC5 | ปุ่ม Save Configuration (ร่วมกับ Custom Form) บันทึก config ทุก section ในครั้งเดียว | Use Case | single save for entire page |
| DFC6 | หลัง Save: หน้า Add Customer แสดงเฉพาะ field ที่ toggle = ON ใน standard sections | Use Case | integration — consumer side |
| DFC7 | แต่ละ section ยุบ/ขยายได้ด้วยไอคอน ^ บน header | State Transition | UI accordion |

---

### Step 2 (DFC) — State Transition: Toggle Lifecycle

```
[Field toggle = ON]  ──toggle OFF──►  [toggle = OFF]
                     ◄──toggle ON────
        │
        │ Save Configuration
        ▼
[Persisted → Add Customer: field shown (ON) / hidden (OFF)]
        │
        │ toggle ย้อนกลับ
        ▼
[Toggle state กลับ → Save อีกรอบ → Add Customer อัปเดต]
```

---

### Step 3 (DFC) — Test Cases (AAA ย่อ)

> **Arrange ทุก TC (Global DFC):**
> Login User: ketwadee · Role & Permission: All Permission - Contact Configuration
> อยู่หน้า Customer Form Configuration

#### DFC1 — Profile Photo toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC1-TC1 | Profile Photo toggle = ON → Save Configuration | ไปหน้า Add Customer | Profile Photo ON | Profile Photo field ปรากฏบนฟอร์ม Add Customer |
| DFC1-TC2 | Profile Photo toggle → OFF → Save Configuration | ไปหน้า Add Customer | Profile Photo OFF | Profile Photo field ไม่ปรากฏบนฟอร์ม Add Customer |

#### DFC2 — Personal Details field toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC2-TC1 | Date of Birth = ON (default) | Toggle Date of Birth → OFF | toggle state เปลี่ยน | Toggle แสดง OFF |
| DFC2-TC2 | Date of Birth = OFF → Save Configuration | ไปหน้า Add Customer | Date of Birth OFF | Date of Birth ไม่ปรากฏใน Personal Details บน Add Customer |
| DFC2-TC3 | Blood Type = OFF (STG default) → toggle ON → Save Configuration | ไปหน้า Add Customer | Blood Type ON | Blood Type ปรากฏใน Personal Details บน Add Customer |
| DFC2-TC4 | ตั้ง 9 fields ทุก field ใน Personal Details = ON → Save Configuration | ไปหน้า Add Customer | ทุก field ON | ทั้ง 9 fields แสดงครบ (Display Name, Title, First Name, Middle Name, Last Name, Citizen ID, Date of Birth, Blood Type, Gender) |
| DFC2-TC5 *(HA-DFC1)* | ตั้งทุก field ใน Personal Details = OFF → Save Configuration | ไปหน้า Add Customer | all-OFF — toggle ได้ทุก field (ไม่มีข้อยกเว้น PO ยืนยัน) | ทุก field ใน Personal Details ไม่ปรากฏ (ไม่มี field ที่ toggle ไม่ได้) |
| DFC2-TC6 *(HA-DFC2)* | customer มีข้อมูล Date of Birth อยู่แล้ว → toggle Date of Birth = OFF → Save Configuration | ไปหน้า Edit Customer คนนั้น | data hidden (ไม่ cleared) — PO ยืนยัน | field Date of Birth ไม่ปรากฏบน Edit Customer · toggle กลับ ON → field + ข้อมูลเดิมกลับมาครบ |

#### DFC3 — Address field toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC3-TC1 | Registered Address: Latitude = ON → toggle OFF → Save Configuration | ไปหน้า Add Customer → section Registered Address | Latitude OFF | Latitude ไม่ปรากฏใน Registered Address |
| DFC3-TC2 | Current Address: Latitude = ON → toggle OFF → Save Configuration | ไปหน้า Add Customer → section Current Address | Latitude OFF | Latitude ไม่ปรากฏใน Current Address |

#### DFC4 — Preferences toggle (EP)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC4-TC1 | Note = ON → Save Configuration | ไปหน้า Add Customer | Note ON | Note field ปรากฏใน Preferences section บน Add Customer |
| DFC4-TC2 | User Type = ON → toggle OFF → Save Configuration | ไปหน้า Add Customer | User Type OFF | User Type ไม่ปรากฏใน Preferences บน Add Customer |

#### DFC5 — Save Configuration (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC5-TC1 | เปลี่ยน toggle ≥ 1 ใน standard section ใดก็ได้ | คลิก Save Configuration | Save ทุก section พร้อมกัน | toast success · เปิดหน้าใหม่ toggle state ตรงกับที่ตั้งไว้ |

#### DFC6 — Integration: Add Customer แสดง standard fields ตาม config (Use Case)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC6-TC1 | Config: Profile Photo=ON · Date of Birth=OFF · Blood Type=OFF · Note=ON → Save | ไปหน้า Add Customer | standard fields ตรง config | Profile Photo ✅ · Date of Birth ❌ · Blood Type ❌ · Note ✅ |
| DFC6-TC2 | Config: Registered Address Latitude=OFF · Building=ON → Save | ไปหน้า Add Customer → Registered Address | address fields ตรง config | Building ✅ · Latitude ❌ |

#### DFC7 — Section accordion (State Transition)
| TC ID | Arrange | Act | Tested Condition | Expected |
|---|---|---|---|---|
| DFC7-TC1 | Personal Details section expanded | คลิกไอคอน ^ บน header | ยุบ section | body ซ่อน (collapse) |
| DFC7-TC2 | Personal Details section collapsed | คลิกไอคอน ^ อีกรอบ | ขยาย section | body แสดงครบ (expand) |

---

### Step 4 (DFC) — Hidden Assumptions (✅ PO ยืนยันครบ 22/06/2026)

| Q | ประเด็น | คำตอบ PO | Affects |
|---|---|---|---|
| HA-DFC1 | field บังคับที่ toggle OFF ไม่ได้ — Display Name / First Name / Last Name ต้องเปิดเสมอไหม? | ✅ **toggle ได้ทุก field ไม่มีข้อยกเว้น** | DFC2-TC4, **DFC2-TC5** (all-OFF edge case) |
| HA-DFC2 | toggle OFF field ที่ customer มีข้อมูลแล้ว → data hidden (เก็บ server-side) หรือ cleared? | ✅ **data ไม่ถูก clear — hidden เท่านั้น** (toggle ON กลับมาเห็นข้อมูลเดิม) | **DFC2-TC6** (data-safety) |
| HA-DFC3 | ปุ่ม Save Configuration บันทึก standard sections + Custom Form ทุก section พร้อมกันในครั้งเดียว? | ✅ **ปุ่มเดียว save ทุก section พร้อมกัน** | DFC5-TC1 ✓ (confirmed) |
| HA-DFC4 | Blood Type แสดง OFF ใน STG — เป็น system default หรือถูก config มาก่อน? | ✅ **Blood Type = OFF เป็น system default** (ไม่บังคับแสดง) | DFC2-TC3 baseline ✓ (confirmed) |

---

### Step 5 (DFC) — Test Scenarios

#### ✅ Success

**`DFC_TS01`** — Standard fields default config → Add Customer แสดง fields ตาม toggle state
1. `DFC1-TC1` Profile Photo = ON
2. `DFC2-TC4` Personal Details ทุก field = ON
3. `DFC5-TC1` Save Configuration
4. `DFC6-TC1` ไปหน้า Add Customer → ตรวจ field ครบตาม toggle state
→ **Expected:** standard fields ที่ toggle ON ทั้งหมดปรากฏบนหน้า Add Customer

**`DFC_TS02`** — Toggle field OFF → Add Customer ไม่แสดง field นั้น
1. `DFC2-TC1` Toggle Date of Birth → OFF
2. `DFC5-TC1` Save Configuration
3. `DFC2-TC2` ไปหน้า Add Customer → Date of Birth ไม่ปรากฏ
→ **Expected:** Date of Birth หายจากหน้า Add Customer

**`DFC_TS03`** — Toggle field ON (จาก OFF) → Add Customer แสดง field กลับ
1. `DFC2-TC3` Blood Type (OFF) → toggle ON
2. `DFC5-TC1` Save Configuration
3. ไปหน้า Add Customer → Blood Type ปรากฏ
→ **Expected:** Blood Type กลับมาแสดงใน Personal Details

#### ❌ Alternative

| Scenario | Flow (ลำดับ TC) | ผลลัพธ์ |
|---|---|---|
| **DFC_TA01** | Toggle Profile Photo=OFF + Date of Birth=OFF + Note=OFF → DFC5-TC1 Save → Add Customer | ทั้ง 3 fields ไม่ปรากฏบนหน้า Add Customer |
| **DFC_TA02** *(HA-DFC1)* | `DFC2-TC5` ตั้ง Personal Details ทุก field = OFF → Save → Add Customer | ไม่มี field ใน Personal Details ปรากฏเลย (all-OFF valid) |
| **DFC_TA03** *(HA-DFC2)* | `DFC2-TC6` toggle Date of Birth = OFF (customer มีข้อมูลอยู่แล้ว) → Save → Edit Customer → toggle ON → Edit อีกครั้ง | data ไม่ถูก clear — field + ข้อมูลเดิมกลับมาหลัง toggle ON |

#### 🔁 UI behavior
`DFC_UI01` — Section accordion: `DFC7-TC1 → DFC7-TC2` (ยุบ → ขยาย)
