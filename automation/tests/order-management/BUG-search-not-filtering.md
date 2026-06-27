# BUG DRAFT — Order list Search ไม่กรองผลลัพธ์ (returns all rows)

> draft สำหรับคนรีวิวก่อนเปิดการ์ดจริง — reproduce ระหว่าง probe DOM (2026-06-20) · ยืนยันโดย PO (ORD-Q7)

- **Feature**: CC Super App › Order Management › Order list (Search)
- **Severity**: Medium/High — ผู้ใช้ค้นหา order ไม่ได้ (ผลไม่ถูกกรอง ทำให้หา order ที่ต้องการไม่เจอเมื่อ list ใหญ่)
- **Env**: QA — `https://skyai-cloud-cc-qa.one-sky.ai/cms/inventory/request`
- **Account**: ketwadee (org BMA)
- **TC**: ORD TA-05_TC-01 (Order ID), TA-05_TC-02 (part name)

## Steps to reproduce
1. Login → เปิด Order Management (`/cms/inventory/request`)
2. พิมพ์ Order ID เป๊ะ ๆ ในช่อง **"Search request ID or part..."** เช่น `ORD260610-00004`
3. กดปุ่ม **Search**

## Expected
List กรองเหลือเฉพาะ order ที่ตรง (1 แถว) — ตาม placeholder ที่บอกว่าค้นด้วย request ID หรือ part (PO ORD-Q7)

## Actual
List **ไม่เปลี่ยน — คืนทุกแถวเหมือนเดิม** (probe: rows 10 → 10) · ค้นด้วย part name (`iPhone`) ก็ไม่กรองเช่นกัน
> ปุ่ม **Clear Filters** ปรากฏหลังกด Search (ระบบรับรู้ว่ามีการค้น) แต่ผลลัพธ์ไม่ถูก filter

## Suggested fix (FE/BE)
ให้ Search ส่ง keyword ไปกรอง list จริง (client filter หรือ pass `search` param ไป API `GetListOrder`)
ด้วย Order ID + ชื่อสินค้า (part/title)
