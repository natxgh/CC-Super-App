# BUG DRAFT — Appointment list ใน Customer Detail ส่ง `id: "undefined"` → list ว่างเสมอ

> draft สำหรับคนรีวิวก่อนเปิดการ์ดจริง — เจอระหว่าง probe network (2026-06-19)

- **Feature**: CC Super App › Customer Detail › Appointment tab (list)
- **Severity**: High / Blocker — ผู้ใช้เห็น "No results found." ใน Appointment tab เสมอ ไม่ว่าจะมี appointment จริงหรือไม่
- **Env**: QA — `https://skyai-cloud-cc-qa.one-sky.ai/cc/contacts-list`
- **Account**: ketwadee (org BMA)

## Steps to reproduce
1. Login → Customer List → เปิด customer detail ใดก็ได้ → คลิก tab **Appointment**

## Expected
Appointment list query ส่ง `id` ของ customer จริงๆ → แสดง appointment ที่มี

## Actual
Appointment tab แสดง **"No results found."** เสมอ

## Root cause (จาก network intercept)
Frontend ส่ง GraphQL query:
```json
{
  "query": "query ($input: ListDataInput2!) { Appointment { GetAppointmentByCustId (input: $input) { status msg data desc } } }",
  "variables": { "input": { "id": "undefined" } }
}
```
`id` เป็น string `"undefined"` (ไม่ใช่ customer id จริง) → API คืน `data: []` ถูกต้อง แต่ FE ไม่ได้ส่ง id ที่ถูก

## Suggested fix (FE)
ตรวจสอบว่า customer id ถูก bind เข้า Appointment tab query ถูกต้อง (อาจเป็น race condition ที่ customer context ยังโหลดไม่เสร็จ หรือ prop ไม่ถูกส่งต่อ)

## หมายเหตุ
- **ยืนยันผ่าน API**: `GetAppointmentByCustId(id: <customerId_ที่ถูก>)` คืนข้อมูลถูกต้อง
- เป็น bug แยกจาก CORS bug ของ dropdown (ดู [BUG-appointment-type-options.md](BUG-appointment-type-options.md))
- บล็อก test scenario: **TS-04 (Confirm), TS-05 (Delete)** — แม้ seed appointment ผ่าน API แล้ว ก็ไม่เห็นใน UI
