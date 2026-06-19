# Test Design — Sign In (CC Super App) 〔SI〕  〔ไฟล์ 1: Design〕

> **ไฟล์ 1 (Design)** — 4 เทคนิค → Business Conditions → ร้อยเป็น Scenario (flow E2E) + Hidden Assumptions
> รายละเอียดราย Test Case / Pre-Condition / TestResult อยู่ใน **ไฟล์ 2** `cc-signin-testcases.xlsx` (3 sheet)
> ออกแบบตาม `qa-ai-pilot/test-design-standard.md` (Black Box). Scenario เขียนเป็น **Flow E2E**.
> Spec ต้นทาง: `SR_Sign_In_Feature_CC_Super_App.pdf` v1.0 (2026-06-07) — โครงหน้าจออ้างระบบ SKY AI
> ⚠️ **ยังไม่ถาม PO** (ผู้ใช้สั่งข้ามขั้น po-loop) — เคสที่ผลขึ้นกับ TBC ถูก mark ⚠️ และใส่ Remark "Pending PO" ในไฟล์ xlsx
> Test Data ใช้ Real Example: Org `BMA` · Username `somchai.jai` · Password `Bma@2026xz`

## Step 1 — Business Conditions (+ เทคนิค)

| ID | Business Condition | Technique | Why |
|----|--------------------|-----------|-----|
| SI1 | ช่อง required ต้องไม่ว่าง (Username/Password/Organization) — ว่าง→ไม่ยิง API + error สีแดงใต้ช่อง (FR-01) | Use Case | ไล่ทุกคู่ของช่องว่าง |
| SI2 | Username ต้องมีจริงในระบบ/Org (FR-05) | EP | มี/ไม่มีในระบบ |
| SI3 | Password ต้องตรงกับ Username (FR-05) | EP | ตรง/ไม่ตรง |
| SI4 | Organization ต้องตรงกับบัญชี (tenant isolation, FR-03) | EP | org ตรง/ผิด |
| SI5 | ปุ่ม eye สลับแสดง/ซ่อน Password (FR-02) | State Transition | Masked ↔ Plain |
| SI6 | Remember me → เปิดแอปครั้งหน้าเข้าหน้าหลักเลย ไม่ต้องล็อกอิน (FR-04) | Use Case | ติ๊ก/ไม่ติ๊ก |
| SI7 | Auth สำเร็จ → ไปหน้าแรก "Work Order Summary" (FR-05) | EP | success path |
| SI8 | Auth ไม่สำเร็จ → พฤติกรรม **TBC** (FR-05) | EP | ⚠️ ขึ้นกับ HA1 |
| SI9 | Forgot Password → เปิด Modal "Reset Password" (desc + ปุ่ม Close) (FR-06) | State Transition | Closed ↔ Open |
| SI10 | Registration footer / routing **TBC** (FR-07) | Use Case | ⚠️ ขึ้นกับ HA7 |

> **ทำไมไม่มี BVA:** spec ฉบับนี้ไม่มีเงื่อนไขเชิงตัวเลข/เวลา (เช่น ความยาว password ขั้นต่ำ, จำนวนครั้ง lockout, อายุ session) ที่ถูกระบุค่าไว้ — ทุกค่าเป็น TBC (ดู HA2/HA4). ถ้า PO ยืนยันค่าเหล่านี้ภายหลัง จะเพิ่มเคส BVA (น้อยกว่า/เท่ากับ/มากกว่า).

## Step 2 — Test Cases (Arrange / Test Data / Tested Condition / Expected)

**SI1 — Required fields (Use Case)** — ว่าง→ไม่ยิง API + กรอบ/ข้อความสีแดงใต้ช่อง

| TC | กรอกอะไร | Expected |
|----|----------|----------|
| SI1-TC1 | Username ว่าง (Org+Pass ครบ) | "Username is required" ใต้ช่อง + ไม่ยิง API |
| SI1-TC2 | Password ว่าง (Org+User ครบ) | "Password is required" ใต้ช่อง + ไม่ยิง API |
| SI1-TC3 | Organization ว่าง (User+Pass ครบ) | "Organization is required" ใต้ช่อง + ไม่ยิง API |
| SI1-TC4 | ว่างทั้งหมด | แสดงครบ 3 ข้อความ (Username/Password/Organization is required) + ไม่ยิง API |
| SI1-TC5 | กรอกครบทุก required | ผ่านการตรวจช่องว่าง → ยิง API ต่อ |

**SI2 — Username valid (EP)**
- `SI2-TC1` | `somchai.jai` | มีในระบบ Org BMA | ผ่าน
- `SI2-TC2` | `nattapong.xyz` | ไม่มีในระบบ | ล็อกอินไม่สำเร็จ (⚠️ wording TBC — ดู HA1)

**SI3 — Password match (EP)**
- `SI3-TC1` | `Bma@2026xz` | รหัสตรงกับ `somchai.jai` | ผ่าน
- `SI3-TC2` | `Wrong#2026` | รหัสไม่ตรง | ล็อกอินไม่สำเร็จ (⚠️ lockout? TBC — ดู HA2)

**SI4 — Organization tenant (EP)**
- `SI4-TC1` | Org `BMA` (ตรงบัญชี) | org ถูก tenant | ผ่าน
- `SI4-TC2` | Org `MWA` (บัญชีอยู่ BMA) | org ผิด tenant | ล็อกอินไม่สำเร็จ (⚠️ wording TBC — ดู HA1)

**SI5 — Eye toggle (State Transition)**
- States: `Password Hidden (••••)` ↔ `Password Shown (plaintext)` — Actor=ผู้ใช้, Event=กด Eye Icon
- `SI5-TC1` | เริ่มต้น (ค่า default) | Expected: รหัสถูกซ่อน (mask)
- `SI5-TC2` | กด eye 1 ครั้ง | Expected: แสดงรหัสเป็น plaintext
- `SI5-TC3` | กด eye ซ้ำ | Expected: ซ่อนรหัสกลับ (mask) — self/reverse transition

**SI6 — Remember me (Use Case)**
- `SI6-TC1` | ติ๊ก Remember me + ล็อกอินสำเร็จ → ปิดแอปแล้วเปิดใหม่ | Expected: **ข้ามหน้าล็อกอิน เข้า "Work Order Summary" อัตโนมัติ** (FR-04)
- `SI6-TC2` | ไม่ติ๊ก + ล็อกอินสำเร็จ → ปิด/เปิดแอปใหม่ | Expected: ต้องล็อกอินใหม่

**SI7 — Auth success (EP)**
- `SI7-TC1` | credential ครบถูก (BMA / somchai.jai / Bma@2026xz) | auth ผ่าน | นำทางไปหน้า "Work Order Summary"

**SI8 — Auth fail (EP)** ⚠️ block by HA1
- `SI8-TC1` | credential ผิด (ดู SI2-TC2/SI3-TC2/SI4-TC2) | auth ไม่ผ่าน | **Expected = TBC** (spec FR-05 ระบุ "กรณีไม่สำเร็จ: TBC") → Pending PO

**SI9 — Forgot Password modal (State Transition)**
- States: `Modal Closed` ↔ `Modal Open`
- `SI9-TC1` | กดลิงก์ "Forgot Password?" | Expected: เปิด Modal "Reset Password" — desc "Contact administrator or support to reset your password." + ปุ่ม Close
- `SI9-TC2` | กดปุ่ม Close ใน Modal | Expected: Modal ปิด กลับหน้า Sign In (reverse transition)

**SI10 — Registration routing (Use Case)** ⚠️ block by HA7
- `SI10-TC1` | กด Registration footer | **Expected = TBC** (spec FR-07 / Registration Footer = TBC) → Pending PO

> Test Data ทั้งหมดเป็น Real Example (ชื่อ-สกุลไทยจริง/รูปแบบรหัสจริง) — ไม่มีคำว่า Test/ทดสอบ/xxx

## Step 3 — Hidden Assumptions (ระบุไว้ — ยังไม่ถาม PO ตามคำสั่งผู้ใช้)

| # | ประเด็นกำกวม/TBC | กระทบเคส |
|---|------------------|----------|
| HA1 | (FR-05 fail) ข้อความ/พฤติกรรมตอน auth ไม่สำเร็จ = **TBC** | SI8-TC1, SI2-TC2, SI3-TC2, SI4-TC2, TA-01/02/03 |
| HA2 | มีระบบล็อกบัญชี (account lockout) หลังกรอกผิดหลายครั้งหรือไม่ — spec ไม่ระบุ | SI3-TC2 |
| HA3 | Organization เป็น **free-text input หรือ dropdown** (spec เขียน "Selection/Input" + UI "Input Field" กำกวม) | SI1-TC3, SI4-TC1/TC2 |
| HA4 | Remember me เก็บสถานะนานแค่ไหน / หมดอายุเมื่อไร | SI6-TC1 |
| HA5 | ข้อความ error required ตรงตาม spec ("X is required" อังกฤษ) หรือมี wording/ภาษาไทยต่าง | SI1-TC1..TC4 |
| HA6 | Validation ทำงานตอนกด Sign In หรือ realtime ทุกช่อง | SI1 ทั้งหมด |
| HA7 | (FR-07) Registration routing = **TBC** | SI10-TC1 |
| HA8 | (NFR-01/02/03) Security/Performance/Design = **TBC** | ยังไม่ออกเทส NFR |

> เมื่อกลับมาทำขั้น po-loop ให้แปลงรายการนี้เป็นคำถาม propose-and-confirm (`/ask-po`)

## Step 4 — Test Scenarios (Flow End-to-End)

### ✅ Success

`SI_TS01` — ล็อกอินสำเร็จด้วย Username/Password
1. `SI1-TC5` กรอกครบทุก required
2. `SI4-TC1` Organization "BMA" (ตรง tenant)
3. `SI2-TC1` username มีจริง (`somchai.jai`)
4. `SI3-TC1` password ตรง (`Bma@2026xz`)
5. `SI7-TC1` auth สำเร็จ
→ **ล็อกอินสำเร็จ + นำทางไปหน้า "Work Order Summary"**

`SI_TS02` — ล็อกอิน + Remember me คงสถานะ
1. `SI4-TC1` เลือก Org "BMA" → 2. `SI2-TC1` user จริง → 3. `SI3-TC1` รหัสตรง → 4. `SI6-TC1` ติ๊ก Remember me + สำเร็จ
→ **ปิดแอปแล้วเปิดใหม่ ข้ามหน้าล็อกอิน เข้า "Work Order Summary" อัตโนมัติ**

### 🔁 UI behavior

`SI_TS03` — Password eye toggle: `SI5-TC1 → SI5-TC2 → SI5-TC3` (ซ่อน → แสดง → ซ่อน)

`SI_TS04` — Forgot Password modal: `SI9-TC1 → SI9-TC2` (เปิด Modal → กด Close ปิด)

### ❌ Alternative

| Scenario | Flow (ลำดับ TC) | ผลลัพธ์ | หมายเหตุ |
|----------|-----------------|---------|----------|
| SI_TA01 | SI1-TC5 → SI4-TC1 → SI2-TC1 → SI3-TC2 → SI8-TC1 | ล็อกอินไม่สำเร็จ (รหัสผิด) | ⚠️ Expected พฤติกรรม TBC (HA1/HA2) |
| SI_TA02 | SI1-TC5 → SI4-TC1 → SI2-TC2 → SI8-TC1 | ล็อกอินไม่สำเร็จ (username ไม่มี) | ⚠️ Expected TBC (HA1) |
| SI_TA03 | SI1-TC5 → SI4-TC2 → SI2-TC1 → SI3-TC1 → SI8-TC1 | ล็อกอินไม่สำเร็จ (org ผิด tenant) | ⚠️ Expected TBC (HA1) |
| SI_TA04 | SI1-TC4 | แสดง 3 ข้อความ required + ไม่ยิง API | |
| SI_TA05 | SI1-TC3 | "Organization is required" + ไม่ยิง API | |

> ⚠️ Registration (`SI10-TC1`) ยังไม่ร้อยเป็น scenario เพราะ Expected = TBC (HA7)

## Step 5 — Definition of Done (self-check)

- [x] แปลง Needs เป็น Business Conditions เป็นข้อ + ติด ID (SI1–SI10)
- [x] เลือกเทคนิคถูกชนิด: EP / State Transition / Use Case — (BVA: ระบุเหตุผลที่ไม่มี = spec ไม่มีค่าตัวเลข/เวลา)
- [x] ทุก Test Case ครบ 4 ส่วน (Arrange / Test Data Real Example / Tested Condition / Expected)
- [x] มีทั้ง Success (2) + UI (2) + Alternative (5) Scenario, ID `SI_TS##` / `SI_TA##`
- [x] รวม Test Case เป็น Scenario โดยไม่มีเงื่อนไขขัดแย้ง
- [x] Test Data เป็น Real Example ไม่มีคำว่า Test/ทดสอบ
- [~] ระบุ Hidden Assumptions ครบ (HA1–HA8) แต่ **ยังไม่ถาม PO** ตามคำสั่ง → เคสค้างถูก mark ⚠️ + Remark "Pending PO"
- [x] ติด ID และ mark เคสที่ใช้ในแต่ละ scenario
