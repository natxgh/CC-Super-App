# QA Test Plan — CC Super App

**CC Super App**
Date: 2026-06-10
Version 1.1 _(ปรับ Project Schedule: Design All → Execute All)_

---

## Document Control

| | |
|---|---|
| Document name | QA Test Plan — CC Super App |
| Prepared By | Ketwadee Kaewmanee |
| Date | 2026-06-10 |
| Version | 1.1 |
| Target Feature / Product | CC Super App v1.0 (Omnichannel Contact Center + CRM + Case Management) |

---

## 1. Introduction (บทนำและวัตถุประสงค์)

แผนการทดสอบนี้จัดทำขึ้นเพื่อกำหนดขอบเขตและวิธีการทดสอบ Product: **CC Super App** ซึ่งเป็น Integrated Omnichannel Contact Center, CRM และ Case Management Platform เป้าหมาย Go-live เวอร์ชัน 1.0 ภายในเดือน July 2026

**วัตถุประสงค์หลัก:** ตรวจสอบว่า core features ในกลุ่ม Priority P1–P4 ทำงานได้ถูกต้องครบถ้วนก่อน release ภายใต้ข้อจำกัดของโครงการ ได้แก่ ทีม Sr. QA 1 คน ช่วงเวลา Design + Execute 9–30 June 2026 (16 วันทำการ) และ **มี BRD เบื้องต้น (High-level ภาพรวม ไม่มี Detailed Spec) และไม่มี Figma UI Flow** — จึงใช้ BRD + Walkthrough Deck และระบบจริงบน STG เป็น baseline (Oracle) ทดแทน

**แนวทางการวางแผน (v1.1):** ปรับ Project Schedule เป็นรูปแบบ **Design All → Execute All** กล่าวคือ ออกแบบ Test Scenarios ของทุก Priority (P1–P4) ให้ครบก่อน จากนั้นจึง Execute ต่อเนื่องทั้งหมด เพื่อให้ได้ภาพรวม Test Coverage ครบก่อนเริ่ม Execute และลด dependency ข้ามหมวดระหว่างทดสอบ

---

## 2. Test Scope (ขอบเขตการทดสอบ)

### 2.1 In-Scope

| Priority | Module | ระดับการเทส | รายละเอียด |
|---|---|---|---|
| **P1** | Contact Management | Full | Customer profile (CRUD), Customer 360, Custom Fields, Appointment, Product/Service linkage |
| **P2** | CRM & Customer 360 | Full | Product & Inventory, Spare parts & Inventory, Order & Dispatch (web only) |
| **P3** | Case & Ticket Mgmt | Full* | Create case, Dispatch, Case lifecycle, Case history, Linkage customer–case |
| **P4** | Dashboard & Analytics | Smoke | Case Dashboard, Product Dashboard, Reports |
| **Prereq** | P7 / P8 (Seed) | Verify | Service Type/Unit/Skill/Area + User/Role seed ผ่าน DB แล้ว verify |

> _P3 ไม่รวม: Knowledge Suggestion (รอ KMS team) และ AI Case Summarize (next phase)_

### 2.2 Out-of-Scope

- **P5** Workflow Automation (Dynamic workflow, SLA Escalation) — defer ไปทดสอบ July
- **P6** Dynamic Forms & Custom Fields configuration — defer ไป July
- **P7** User Management UI / **P8** System Configuration UI — seed via DB เท่านั้น (UI test defer July)
- **P9** UI/UX (Multi-language, Dark/Light mode, Mobile Responsive)
- Knowledge Suggestion (KMS integration) และ AI Case Summarize
- Mobile application integration สำหรับ Dispatch

---

## 3. Test Strategy & Approach (กลยุทธ์และวิธีการทดสอบ)

- **Exploratory / Session-based Testing:** เนื่องจากมี BRD เพียงภาพรวม (ไม่มี Detailed Spec) และไม่มี Figma ใช้การ explore ระบบจริงบน STG ควบคู่ BRD + Walkthrough Deck เพื่อสร้าง baseline แล้วแปลงเป็น test case
- **Functional Testing:** ทดสอบแต่ละฟังก์ชัน happy path + Boundary Value Analysis + Negative case (required field, format validation) ตามมาตรฐาน Black Box: EP / BVA / State Transition / Use Case
- **Risk-Based Testing:** ทุ่ม depth ที่ P1–P3 (core user flow), P4 ทำเพียง smoke test
- **Oracle Substitute:** ใช้ Walkthrough Deck + QA Meeting Notes + การ confirm expected behavior กับ Dev/PO ผ่าน QA Confirm Log ใน Lark เป็นแหล่งตัดสิน pass/fail
- **Visual Baseline:** เก็บ screenshot ทุกหน้าหลักไว้เป็น baseline เทียบ regression (ทดแทนการไม่มี Figma)
- **Confirmation / Retest:** retest defect หลัง Dev fix ในแต่ละรอบ

---

## 4. Test Environment & Test Data

**Environment:**
- Server (QA/STG): `https://skyai-cloud-cc-stg.metthier.ai:65000` → รอ Env ใหม่

**Test Data Preparation:**
- P7/P8 seed ผ่าน DB: Service Type, Unit, Skill, Area + User/Role/Permission (เป็น prerequisite)
- Customer profiles หลายประเภท (Individual/Corporate, มี/ไม่มี linked products & services) — ref Test Data P1 (TC-P1-001..008)
- Products & Spare parts ที่มีสถานะ stock ต่างกัน (ปกติ / สินค้าน้อย / สินค้าหมด)
- Orders ที่มี status หลากหลาย และ Cases สำหรับไล่ lifecycle

---

## 5. Entry & Exit Criteria

**Entry Criteria (เริ่มเทสได้เมื่อ):**
- ทีม Dev deploy feature ลง QA Environment สำเร็จ
- P7/P8 Mock/Seed data ถูกเซ็ตอัปผ่าน DB เรียบร้อย + QA verify แล้ว
- Assignment Board เปิดใช้งานได้ (แก้ปัญหาค้างโหลดแล้ว — ดูหัวข้อ 7 Risk)

**Exit Criteria (ถือว่าเทสผ่านเมื่อ):**
- ดำเนินการรัน Test Case ครบ 100% ของ scope P1–P4
- ไม่พบ Defect ระดับ Critical (Blocker) และ High ค้าง
- Defect ระดับ Medium/Low ได้รับการยอมรับจาก PM/PO แล้ว
- ส่งมอบ QA Test Report

---

## 6. Project Schedule & Resources (กำหนดการและผู้รับผิดชอบ)

**Resource:** Sr. QA 1 คน | **Duration:** 16 วันทำการ (9–30 June 2026, ไม่รวมเสาร์–อาทิตย์)

> แนวทาง: **ออกแบบ Test Scenarios ทั้งหมด (P1–P4) ให้ครบก่อน** แล้วจึง Execute ต่อเนื่องทั้งหมด

---

### Phase 0: Setup & Prerequisites

| สัปดาห์ | วันที่ | งาน | จำนวนวัน |
|---|---|---|---|
| Week 1 | 9 Jun | Setup environment + เตรียม test data + P7/P8 seed via DB + verify (Prereq) | 1 |

---

### Phase 1: Design Test Scenarios — ทุก Priority

| สัปดาห์ | วันที่ | งาน | จำนวนวัน |
|---|---|---|---|
| Week 1 | 10–12 Jun | P1 Contact Management — Design Test Scenarios | 3 |
| Week 2 | 15–17 Jun | P2 CRM & Customer 360 — Design Test Scenarios | 3 |
| | 18–19 Jun | P3 Case & Ticket Mgmt — Design Test Scenarios | 2 |
| Week 3 | 22 Jun | P4 Dashboard & Analytics — Design Test Scenarios (smoke) | 1 |

_Design phase รวม: 9 วัน_

---

### Phase 2: Execute Tests — ทุก Priority

| สัปดาห์ | วันที่ | งาน | จำนวนวัน |
|---|---|---|---|
| Week 3 | 23–24 Jun | P1 Contact Management — Execute + Retest | 2 |
| | 25–26 Jun | P2 CRM & Customer 360 — Execute + Retest | 2 |
| Week 4 | 29 Jun | P3 Case & Ticket Mgmt — Execute (ส่วนแรก) | 1 |
| | 30 Jun | P3 Execute (ต่อ) + P4 Dashboard Smoke + Test Report | 1 |

_Execute phase รวม: 6 วัน_

---

**สรุปภาพรวม Timeline**

```
Jun  9     │ Setup + Prereq (P7/P8 seed)
Jun 10–22  │ ◀─── DESIGN ALL (P1 → P2 → P3 → P4) ───▶
Jun 23–30  │ ◀─── EXECUTE ALL (P1 → P2 → P3 → P4) + Report ───▶
```

---

## 7. Assumptions & Risks

**Assumptions:**
- QA Environment (STG) พร้อมใช้งานตั้งแต่ 9 June 2026
- P7/P8 seed ผ่าน DB ได้ และข้อมูลถูกต้อง
- BRD ภาพรวม + Walkthrough Deck + ระบบบน STG ใช้เป็น baseline ทดแทน Detailed Spec ได้
- Design phase เสร็จสมบูรณ์ก่อน 23 Jun ทำให้ Execute ต่อเนื่องได้โดยไม่ติดขัด

**Risks & Mitigation:**

| Risk | ระดับ | Mitigation |
|---|---|---|
| Assignment Board (มอบหมายเคส) เปิดได้แต่ค้างโหลด — block การเทส P3 ทั้งหมวด | สูง | แจ้ง Dev แก้ก่อนเริ่ม P3 Execute (เป็น Entry Criteria); ระบุใน Design ล่วงหน้า ไม่ต้อง block Design phase |
| BRD มีเพียงภาพรวม (ไม่มี Detailed Spec/Figma) — อาจ miss requirement ที่ไม่ได้ระบุใน BRD หรือ deck | สูง | ใช้ QA Confirm Log ยืนยัน expected behavior รายข้อกับ Dev/PO ระหว่าง Design phase |
| Design เสร็จแล้วพบว่า Spec เปลี่ยนก่อน Execute — ต้อง revisit test case | กลาง | Freeze spec หลังจบ Design phase (20 Jun); หาก change เกิดขึ้นระหว่าง Execute ให้ update เฉพาะ TC ที่กระทบ |
| เวลา P3 Execute แน่นมาก หาก defect เยอะ อาจล้น 30 Jun | กลาง | Cut Case Historical / Event Notification ออกก่อนถ้าจำเป็น |
| P7/P8 UI ไม่ผ่าน QA (seed via DB) | กลาง | Admin function กระทบน้อย — defer UI test ไป July |
| หน้าหลายหน้าใน /cms โหลดต่อเนื่องไม่จบ (perf) | กลาง | ตรวจ performance/polling กับ Dev ระหว่าง Setup phase |

---

## 8. Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| QA Lead | Ketwadee Kaewmanee | | |
| Product Owner / Product Manager | | | |
| Engineering Lead | | | |
| Operations / Call Center Lead | | | |
