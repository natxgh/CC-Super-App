# BUG DRAFT — Profile Photo upload: ไม่มี validation format / size (ต้องยืนยันเพิ่ม)

> draft สำหรับคนรีวิวก่อนเปิดการ์ดจริง — reproduce ระหว่าง probe form ด้วย Playwright (2026-06-22)
> ⚠️ NEEDS CONFIRM: probe จับ error message ไม่ได้ตอน upload แต่ยังไม่ยืนยันว่า validation ทำงานตอน Save หรือไม่

- **Feature**: CC Super App › Customer Profile › Add Customer › Profile Photo
- **Severity**: Medium — ไฟล์ผิด format/ใหญ่เกินอาจหลุดเข้าระบบ
- **Env**: QA — `https://skyai-cloud-cc-qa.one-sky.ai/cc/contacts-list`
- **Account**: ketwadee (org BMA)
- **TC**: TA-09 (wrong format — PDF), TA-10 (size > 3MB)

## Steps to reproduce
1. Login → Contacts List → **Add Customer**
2. ที่ Profile Photo → **Change Photo** อัปโหลด:
   - **TA-09**: `assets/contract.pdf` (ไม่ใช่รูป)
   - **TA-10**: `assets/photo_hd.jpg` (~4MB, เกิน 3MB)

## Expected (design ACP6)
- TA-09 → error "Invalid upload photo file" และไม่อัปโหลด (รับเฉพาะ JPG/PNG/JPEG)
- TA-10 → error "The file size must not exceed 3MB."

## Actual
หลัง setInputFiles **ไม่พบ error message** ใน DOM (capture = ไม่มีข้อความ validation)
> ฟอร์มมี hint "Allowed: JPG, PNG, GIF" แต่ไม่เห็น error toast/inline ตอนเลือกไฟล์ผิด
> หมายเหตุ: probe เลือกไฟล์ด้วย setInputFiles (bypass `accept` attribute) — UI จริงอาจมี `accept` กรองบางส่วน; validation อาจไปอยู่ตอน Save → **ต้อง verify ซ้ำตอน execute**

## Suggested fix (FE/BE)
ตรวจ MIME/นามสกุล (JPG/PNG/JPEG) + ขนาด ≤ 3MB ทั้งตอนเลือกไฟล์และตอน Save พร้อมแสดง error ที่ชัดเจน
