# BUG DRAFT — ปุ่ม Cancel ยังแสดงหลัง order ผ่านสถานะ "Request Approved"

> draft สำหรับคนรีวิวก่อนเปิดการ์ดจริง — reproduce ระหว่าง probe DOM (2026-06-20) · ยืนยันโดย PO (ORD-Q5)

- **Feature**: CC Super App › Order Management › Order detail (Cancel)
- **Severity**: Medium — ผู้ใช้ยกเลิก order ที่อนุมัติแล้วได้ ทั้งที่ business rule ห้าม (Cancel ได้เฉพาะก่อน Approved)
- **Env**: QA — `https://skyai-cloud-cc-qa.one-sky.ai/cms/inventory/request`
- **Account**: ketwadee (org BMA)
- **TC**: ORD TA-03_TC-02 · **Sample order**: `ORD260610-00001` (status "Request Approved")

## Steps to reproduce
1. Login → เปิด Order Management
2. เปิด order ที่สถานะ **"Request Approved"** (เช่น `ORD260610-00001`)

## Expected
ปุ่ม **Cancel** ถูกซ่อน/ปิดใช้งาน เมื่อ order ผ่าน Approved ไปแล้ว (Grooming + PO ORD-Q5: Cancel ได้เฉพาะก่อน Approved)

## Actual
ปุ่ม **Cancel** ยังแสดงอยู่บนหน้า detail ของ order ที่ "Request Approved" (probe: `Cancel button visible = true`)
→ ผู้ใช้สามารถกดยกเลิก order ที่อนุมัติแล้วได้

## Suggested fix (FE)
ซ่อน/disable ปุ่ม Cancel เมื่อ order status ≥ "ได้รับการอนุมัติ" (OS003 Request Approved) ตาม workflow rule
