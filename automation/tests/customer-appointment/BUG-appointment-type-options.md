# BUG DRAFT — Appointment Type / Service Type dropdown โหลด options ไม่ได้ (CORS)

> draft สำหรับคนรีวิวก่อนเปิดการ์ดจริง — เจอระหว่าง probe DOM Schedule Appointment form (2026-06-19)

- **Feature**: CC Super App › Customer Appointment › Schedule Appointment form
- **Severity**: High / Blocker — ผู้ใช้ add appointment ไม่ได้ (เลือก Appointment Type / Service Type ไม่ได้เลย)
- **Env**: QA — `https://skyai-cloud-cc-qa.one-sky.ai/cc/contacts-list`
- **Account**: ketwadee (org BMA)

## Steps to reproduce
1. Login → Customer List → เปิด customer detail → tab **Appointment** → คลิก **Schedule**
2. คลิก dropdown **Appointment Type** (หรือ **Service Type**)

## Expected
Dropdown แสดงรายการ options (appointment types / service types) ให้เลือก

## Actual
Dropdown แสดง **"Error loading options"** — options ไม่โหลด

## Root cause (จาก DevTools)
```
GET https://welcome-crm-qa.one-sky.ai/api/v1/appointment_types?search=&start=0&length=1000
net::ERR_FAILED
Console: preflight request doesn't pass access control check:
         No 'Access-Control-Allow-Origin' header is present on the requested resource.
         CORS / Network error → {status:'FETCH_ERROR', error:'TypeError: Failed to fetch'}
```
Master-data API อยู่คนละ host (`welcome-crm-qa.one-sky.ai`) กับ frontend (`skyai-cloud-cc-qa.one-sky.ai`)
และ **ไม่ได้ตั้ง CORS header** ให้ origin ของ frontend → browser block. (service_types น่าจะ fail แบบเดียวกัน)

## Suggested fix (BE/DevOps)
ตั้ง `Access-Control-Allow-Origin` ที่ `welcome-crm-qa.one-sky.ai/api/v1/*` ให้รับ origin ของ CC Super App
(หรือ proxy ผ่าน BFF host เดียวกัน)

## หมายเหตุ (อื่นๆ ที่เจอ — แยกการ์ดได้)
- placeholder dropdown สลับกัน: field "Appointment Type" แสดง `"Search Service Type."` และกลับกัน
