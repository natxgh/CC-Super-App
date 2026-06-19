# CC Super App — QA Workspace

> **Scripts:** `CC Super App/scripts/` · **Config:** `CC Super App/lark.config.json`

---

## โครงสร้าง

```
CC Super App/
├── README.md
├── Makefile                              ← คำสั่งทั้งหมดอยู่ที่นี่
├── package.json
├── lark.config.json                      ← Lark Base / Table IDs
├── .env.example                          ← copy → .env แล้วเติม secrets
├── scripts/
│   ├── ask-po.mjs
│   ├── poll-po.mjs
│   ├── lark-auth.mjs
│   └── lark-oauth.mjs
├── 00-Sign-In/
└── Customer Management/
    ├── customer-profile-test-design.md   ← Design (Business Conditions + Scenarios + HA)
    ├── customer-profile-testcases.xlsx   ← TestCases / Pre-Condition / TestResult (3 sheet)
    └── po-questions.json                 ← คำถาม Hidden Assumptions → ยิงเข้า Lark Base
```

---

## Lark Base ที่ใช้

| ชุด | App Token | Table ID | ใช้สำหรับ |
|---|---|---|---|
| **PO Questions** | `Zq5JbZXU1a3gbbsSnU7lDxsogBc` | `tblOECuFwZZmN0z6` | ถาม PO / Hidden Assumptions |
| **Test Results** | `RrjTbDKXjahqDDsZhkxldXQogIR` | `tblsCfHcYPjFLMtw` | บันทึกผล Execute |

---

## Setup (ทำครั้งแรกครั้งเดียว)

**1. สร้าง `.env`**

```bash
cp .env.example .env
# เปิด .env แล้วเติม LARK_APP_ID และ LARK_APP_SECRET
```

**2. OAuth — ขอ Lark token**

```bash
make oauth
```

เปิด URL ที่ขึ้นมาในเบราว์เซอร์ → login → กดยินยอม
ระบบเก็บ `.lark-token.json` ให้อัตโนมัติ ทำครั้งเดียวพอ

---

## ยิงคำถาม PO เข้า Lark Base

ต้องระบุ 2 parameter ทุกครั้ง:

| Parameter | ความหมาย | ตัวอย่าง |
|---|---|---|
| `Q` | path ไปยัง `po-questions.json` ของ feature นั้น | `Document/01-Customer Management/Customer Profile/po-questions.json` |
| `FEATURE` | ชื่อ feature ที่จะแสดงใน Lark Base | `Customer Profile` |

**1. ดู records ก่อนส่ง (dry-run) — แนะนำทำก่อนเสมอ**

```bash
make dry Q="Document/01-Customer Management/Customer Profile/po-questions.json" FEATURE="Customer Profile"
make dry Q="Document/01-Customer Management/Customer Form Configuration/po-questions.json" FEATURE="Customer Form Configuration"
make dry Q="Document/01-Customer Management/Customer Appointment/po-questions.json" FEATURE="Customer Appointment"
```

**2. ส่งจริงเข้า Lark Base**

```bash
make ask Q="Document/01-Customer Management/Customer Profile/po-questions.json" FEATURE="Customer Profile"
make ask Q="Document/01-Customer Management/Customer Form Configuration/po-questions.json" FEATURE="Customer Form Configuration"
make ask Q="Document/01-Customer Management/Customer Appointment/po-questions.json" FEATURE="Customer Appointment"
```

> รัน `make ask` ซ้ำหลาย feature ได้เลย — แต่ละ feature จะสะสมใน `.po-loop/pending.json` อัตโนมัติ (ไม่ทับกัน)

**3. Poll คำตอบ — poll ทีเดียวได้ทุก feature**

```bash
make poll
```

- exit code 0 = ยังตอบไม่ครบ รอ poll รอบหน้า
- exit code 2 = ตอบครบ**ทุก feature** → `.po-loop/answers.json` พร้อม apply กลับ design

---

## แก้คำถามก่อนส่ง

เปิดแก้ได้โดยตรงที่ `Customer Management/po-questions.json`

```json
{
  "id": "Q1",
  "feature": "Add Customer Profile",
  "topic": "คำถามที่จะแสดงใน Lark Base (✅/❌ option)",
  "proposed": "คำตอบที่ QA เสนอไว้",
  "affects": "TC ID ที่รอคำตอบนี้"
}
```

> `feature` รองรับ array ได้: `["View Customer Product", "View Customer Service"]`

---

## คำถาม PO รอบนี้ (Customer Profile — Q1–Q11)

| Q | Feature | ประเด็น | TC ที่รอ |
|---|---|---|---|
| Q1 | Add Customer Profile | Required fields (First Name / Last Name บังคับ?) | ACP1-TC3, ACP1-TC4 |
| Q2 | Add Customer Profile | Email — optional หรือ required? | ACP3-TC3 |
| Q3 | Add Customer Profile | DOB validation — อดีต + วันนี้ผ่าน / อนาคต = error? | ACP5-TC2, ACP5-TC3 |
| Q4 | Add Customer Profile | Photo upload — format + ขนาดสูงสุด? | ACP6-TC2, ACP6-TC3 |
| Q5 | View Customer Product / Service | Add Product/Service (Phase) — fields ที่ต้องกรอก? | VPRD2-TC1, VSVC2-TC1 |
| Q6 | Delete Customer Profile | ลบ Customer ที่มี active Case/Product/Service — warning หรือบล็อก? | DCP2-TC1 |
| Q7 | View Customer Profile | Search — ค้นจากฟิลด์ไหนได้บ้าง? | VCP2-TC1, VCP2-TC2 |
| Q8 | View Customer Case | Click row → ไปหน้า Case detail ได้ไหม (phase นี้)? | VCC1-TC1 |
| Q9 | Add Customer Profile | Username format rule? | ACP2-TC1, ACP2-TC2 |
| Q10 | Add Customer Profile | Citizen ID — ตรวจ 13 หลัก หรือตรวจ checksum MOD11 ด้วย? | ACP4-TC2 |
| Q11 ⚠️ | Delete Customer Profile | **Delete Flow** — ปุ่ม Disable อยู่ ยืนยัน flow: Dialog หรือไม่? | CP_TS04, CP_TA13 |
# CC-Super-App
