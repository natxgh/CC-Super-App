# BUG DRAFT — Add/Edit Customer: field validation ไม่ถูกบังคับตอน Save (รับข้อมูลผิดได้)

> draft สำหรับคนรีวิวก่อนเปิดการ์ดจริง — reproduce ระหว่าง probe form ด้วย Playwright (2026-06-22)
> ✅ PO Confirmed (round-2): validation เหล่านี้ **ต้องมี** → ที่แอปยอมบันทึก = บั๊กจริง

- **Feature**: CC Super App › Customer Profile › Add/Edit Customer (Personal Details)
- **Severity**: High — ข้อมูลลูกค้าไม่ถูกต้องเข้าระบบได้ (data integrity)
- **Env**: QA — `https://skyai-cloud-cc-qa.one-sky.ai/cc/contacts-list`
- **Account**: ketwadee (org BMA)
- **TC**: TA-03 (empty phone), TA-05 (invalid email format), TA-06 (citizen < 13)

## Steps to reproduce
1. Login → Contacts List → **Add Customer**
2. กรอก required ให้ครบ (First Name / Last Name) แล้วทดสอบทีละเคส:
   - **TA-03**: เว้น Phone ว่าง
   - **TA-05**: Email = `darinee.com` (ไม่มี `@` — format ผิด)
   - **TA-06**: Citizen ID = `123456789012` (12 หลัก, น้อยกว่า 13)
3. กด **Save**

## Expected (ตาม design ACP3/ACP4 + การ์ด validate)
- TA-03 → error "Please enter a mobile number" (Phone เป็น required ตามฟอร์ม)
- TA-05 → toast **"Invalid email address"** (PO round-2: format = a@b.c) · invalid ที่ต้อง reject: `test` (no @), `test@gmail` (no TLD), `test@@gmail.com` (double @), `test@gmail.c` (TLD 1 ตัว), `test@.com` (dot-domain)
- TA-06 → error "Invalid citizen id format" (ต้อง 13 หลักพอดี)

## Actual
ทุกเคส **บันทึกสำเร็จ** — ขึ้น toast "Success" + redirect กลับ Contacts List (record ถูกสร้าง)
> หลักฐาน probe: capture หลังกด Save = `["Success"]`, URL → `/cc/contacts-list`
> หมายเหตุ: validation "empty email" (TA-02) **ทำงานปกติ** ("Please enter an email address") → ฟอร์ม validate บน Save ได้ แต่ไม่ครอบคลุม field อื่น

## Suggested fix (FE/BE)
บังคับ validation ก่อน submit/บน Save ให้ครบ: Phone required, Email format (RFC), Citizen ID = ตัวเลข 13 หลักพอดี — และคืน error message ที่ชัดเจน (สรุป copy กับ PO ก่อน)
