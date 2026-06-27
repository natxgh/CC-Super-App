# BUG DRAFT — Customer: Email / Phone ซ้ำได้ (unique constraint ไม่ถูกบังคับ)

> draft สำหรับคนรีวิวก่อนเปิดการ์ดจริง — reproduce ระหว่าง probe form ด้วย Playwright (2026-06-22)
> ✅ PO Confirmed (round-2): Email **และ Phone** ต้อง unique → ที่แอปยอมซ้ำ = บั๊กจริง

- **Feature**: CC Super App › Customer Profile › Add / Edit Customer
- **Severity**: High — Email/Phone เป็น unique identifier ของลูกค้า (design ACP2/ACP2b/UCP2) แต่สร้างซ้ำได้ → data ซ้ำซ้อน, อ้างอิงลูกค้าผิดตัว
- **Env**: QA — `https://skyai-cloud-cc-qa.one-sky.ai/cc/contacts-list`
- **Account**: ketwadee (org BMA)
- **TC**: TA-04 (duplicate email — add), TA-11 (duplicate email — update), TA-17 (duplicate phone — add)

## Steps to reproduce
1. มีลูกค้า `somchai.jai@gmail.com` อยู่แล้วในระบบ (seed/มีจริง)
2. Login → Contacts List → **Add Customer**
3. กรอก First Name / Last Name / Phone + Email = `somchai.jai@gmail.com` (ซ้ำ)
4. กด **Save**

## Expected (design ACP2 / ACP2b · PO round-2)
- Email ซ้ำ → toast **"Duplicate email address"** — บันทึกไม่สำเร็จ
- Phone ซ้ำ → toast **"Duplicate phone number"** — บันทึกไม่สำเร็จ

## Actual
บันทึก **สำเร็จ** — toast "Success" + redirect กลับ list → มี record ซ้ำ
> หลักฐาน probe (email): หลัง seed somchai แล้ว Add ด้วยอีเมลเดิม → capture = `["Success"]`
> Phone: ยังไม่ได้ probe ตรง ๆ (requirement เพิ่งมาจาก PO round-2) — verify ตอน execute ด้วย phone 0812345678

## Suggested fix (FE/BE)
บังคับ unique check ที่ฝั่ง BE (CreateCustomer/UpdateCustomer) ทั้ง **email และ phone** → คืน error เมื่อซ้ำ และให้ FE แสดง "Duplicate email address" / "Duplicate phone number" (ตรวจทั้ง add และ update)
