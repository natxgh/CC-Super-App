# Customer Appointment — แผนปลด `test.fixme` (handoff → Sonnet)

สถานะปัจจุบัน: **3 ผ่าน (TS-01, TA-02, TA-03) · 5 fixme** (อัปเดต 2026-06-19 หลังทำตามแผน). เป้าหมาย handoff = ปลด fixme ที่เหลือ.

> ## ✅ ผลลัพธ์รอบนี้ (2026-06-19) — ปลด TA-02 ได้ + verify seed API ครบ + เจอ FE bug ที่ 2
> - **TA-02 ✅ PASS** — react-datepicker probe เสร็จ: past days = `[role="gridcell"][aria-disabled="true"]` (aria-label "Not available …"). fix แล้วใน [customer-appointment.spec.ts](customer-appointment.spec.ts).
> - **appointment-seed.ts ✅ verified end-to-end** — CreateAppointment/Delete/GetByCustId ทำงานจริง (probe ลบ appointment ที่สร้างเรียบร้อย). field names ยืนยันแล้ว:
>   - REST: `/appointment_types` (field `appointmentTypeId` UUID, `en` ชื่อ) · `/service_type` (**singular!** field `serviceId` UUID, `en` ชื่อ)
>   - GraphQL `GetAppointmentByCustId` data = `[{id:"802"(numeric, ใช้ลบ), appointmentId:"A...", appointmentType:{en}, serviceType:{en}, done:bool}]`
>   - CreateAppointment input: customerId numeric · UUID ids · appointmentDate ISO · units:[] · caseId:null
> - **🆕 เจอ FE bug ที่ 2 (blocker)** — Appointment tab ส่ง `id:"undefined"` ใน GetAppointmentByCustId → list **ว่างเสมอ** แม้มี appointment จริง. ดู [BUG-appointment-list-undefined-id.md](BUG-appointment-list-undefined-id.md). → block **TS-04/TS-05** (เพิ่มจาก CORS bug ที่ block TS-02/03/TA-01).
> - **เหลือ fixme ทั้ง 5 = ติด FE bug ล้วนๆ** (automation พร้อมหมด): TS-02/03/TA-01 (CORS dropdown) · TS-04/05 (id:undefined). ปลดได้เมื่อ FE แก้ 2 bugs.

---

สถานะเดิม (ก่อนรอบนี้): 2 ผ่าน (TS-01, TA-03) · 6 fixme. เป้าหมาย handoff นี้ = ปลด fixme ทีละเคสตามลำดับความเสี่ยงต่ำ→สูง.

> **อัปเดต 2026-06-19 — ร่างสคริปต์ครบแล้ว (ยังไม่ execute):**
> - 🆕 [fixtures/appointment-seed.ts](fixtures/appointment-seed.ts) — `seedAppointment` / `purgeAppointmentsByEmail` / `teardownSeededAppointments` / `resolveAppointmentTypeId|ServiceId` (GraphQL + REST master-data) — **มี ⚠️ "shape?" ที่ต้องยืนยันก่อนรัน**
> - TS-04/TS-05 wire seed Pending row ผ่าน API ใน Arrange แล้ว · teardown ผูกใน [global-teardown.ts](../customer-profile/teardown/global-teardown.ts) แล้ว · data ใหม่ `SEED_PENDING_APPT` ใน testdata
> - ทุกเคสยังคง `test.fixme` (ยังไม่ปลด) · spec compile ผ่าน (`--list` 8 tests)
> - **เหลือสำหรับ execute:** (1) BE แก้ CORS dropdown (TS-02/03/TA-01) · (2) ยืนยัน ⚠️ shape ทั้งหมดใน appointment-seed.ts · (3) probe row/datepicker DOM

> กฎเดิมของ pilot (ห้ามฝ่าฝืน): รายงานตามจริง ห้ามแกล้งเขียว · ห้าม `waitForTimeout` · selector priority `getByRole→getByLabel→getByPlaceholder→getByText→getByTestId` · 1 TC = 1 `test.step('<TC No.> — …')` + `shot()` · TC ID ต้องตรง xlsx เป๊ะ (key Lark upsert) · write side-effect บน SIT = ต้องมี teardown ก่อนเปิด.

## บริบทที่ต้องรู้ก่อน
- ไฟล์: [customer-appointment.spec.ts](customer-appointment.spec.ts) · POM [AppointmentPage.ts](pages/AppointmentPage.ts) · data [testdata.ts](fixtures/testdata.ts)
- รัน: `cd automation && CP_PASSWORD=... npx playwright test tests/customer-appointment` (`.env` มี CP_PASSWORD/CP_ORG=BMA/CP_USERNAME=ketwadee แล้ว)
- ลูกค้า seed ผ่าน GraphQL (verified): ดู [seed.ts](../customer-profile/fixtures/seed.ts) — endpoint `cc-bff-qa.one-sky.ai/graphql`, JWT จาก `localStorage.access_token`.
- ⚠️ **App bug ที่ยืนยันแล้ว**: ใน Schedule form placeholder dropdown สลับกัน — Appointment Type field = `"Search Service Type."`, Service Type field = `"Search Appointment Type."` (POM map ไว้ถูกแล้ว — อย่า "แก้") + Appoint Date = format `mm/dd/yyyy hh:mm`.

## 3 Blockers
- **B1 — Appointment seed/teardown**: ✅ **GraphQL ops ยืนยันแล้ว (3 ops, ไม่มี Update)** — ดู "Appointment GraphQL API" ข้างล่าง. จำเป็นสำหรับเคสที่ต้องมี Pending row อยู่ก่อน (TS-04/TS-05) และ teardown หลัง Add (TS-02/TS-03). **เหลือ sub-gap: ต้อง resolve `appointmentTypeId`/`serviceId` (master data IDs)** — testdata เก็บเป็นชื่อ ("Maintenance"/"General Maintenance") แต่ API รับเป็น id.
- **B2 — DOM probe** (เปิด browser จริงที่ `…/cc/contacts-list` → เข้า detail ลูกค้า → tab Appointment → Schedule): ยังไม่ verify (1) option-list DOM ของ dropdown ตอนคลิกเปิด, (2) แถว appointment list (cell Status + ปุ่ม Confirm + Bin icon), (3) error/validation toast DOM, (4) datepicker disabled-day DOM.
- **B3 — toast/strings จริง**: `expectSuccessToast`/`expectErrorToast` ใช้ regex เดา — ต้องเปลี่ยนเป็นข้อความจริงหลัง probe.

---

## Appointment GraphQL API (✅ ยืนยันจาก BE — endpoint เดียวกับ customer: `cc-bff-qa.one-sky.ai/graphql`, JWT เดิม)

ทำตามแพทเทิร์น [seed.ts](../customer-profile/fixtures/seed.ts) ทุกอย่าง (ใช้ helper `gql()`, `getToken()` ที่มีอยู่ได้เลย).

```graphql
# CREATE — input: AppointmentInsertInput!
mutation ($input: AppointmentInsertInput!) {
  Appointment { CreateAppointment(input: $input) { status msg data desc } }
}
# input = { appointmentDate, appointmentTypeId, caseId, customerId, note, serviceId,
#           units: [{ unitId, unitName }] }

# DELETE — input: GetIdInput!  (เหมือน DeleteCustomer เป๊ะ → { id })
mutation ($input: GetIdInput!) {
  Appointment { DeleteAppointment(input: $input) { status msg data desc } }
}

# LIST by customer — input: ListDataInput2  (id = customerId, + start/length)
query ($input: ListDataInput2) {
  Appointment { GetAppointmentByCustId(input: $input) { status msg data desc } }
}
# input = { id: <customerId>, start: 0, length: 500 }
```

- `status === '0'` = สำเร็จ (เหมือน Customer ops).
- teardown: `GetAppointmentByCustId({id: customerId})` → วน `data` เก็บ `appointmentId` → `DeleteAppointment({id})`.

### ⚠️ sub-gap ที่ต้องเคลียร์ก่อน CreateAppointment ใช้ได้จริง (ทำตอนเริ่มขั้น ③)
1. **`appointmentTypeId` / `serviceId`** — ✅ **เจอแหล่งแล้ว (probe 2026-06-19)**: master-data เป็น **REST** (ไม่ใช่ GraphQL):
   - `GET https://welcome-crm-qa.one-sky.ai/api/v1/appointment_types?search=&start=0&length=1000`
   - service types น่าจะ `…/api/v1/service_types` (หรือคล้ายกัน) — ยืนยัน path จาก network ตอน probe.
   - ⚠️ ใน **browser endpoint นี้ CORS fail** (ดู BUG ข้างล่าง) — แต่ Playwright `request` context **ไม่ติด CORS** → seed ดึง id ได้ปกติ. ใช้ JWT เดิม (`Bearer`).
   - ทำ helper `resolveAppointmentTypeId(name)` / `resolveServiceId(name)` ยิง REST แล้ว match ชื่อ → id, cache ไว้.
2. **`units`** — ยังไม่รู้ความหมาย/บังคับไหม. ลอง create ด้วย `units: []` ก่อน; ถ้า BE บังคับ → probe ค่าจริงจาก response ของ appointment ที่มีอยู่ (`GetAppointmentByCustId` ของ Siriwimon).
3. **`appointmentDate` format** — UI = `mm/dd/yyyy hh:mm` แต่ API น่าจะรับ ISO (`2026-11-29T16:00:00Z`). ยืนยันจาก response ของ row จริงก่อน. `caseId` = null ได้ (ไม่มี case ผูก).

> ถ้าติดข้อ 1–2 (หา id/units ไม่ได้) → เคส TS-04/TS-05 คง fixme ต่อ + แจ้งขอ master-data IDs จาก BE. TA-01/TA-02 ไม่กระทบ (ไม่ใช้ API).

---

## ลำดับงาน (ทำตามนี้)

### ① TA-02 — past date disabled (อิสระ, read-only, **ทำก่อน**)
- Blocker: B2 (datepicker เท่านั้น) · ไม่มี write → ไม่ต้องรอ B1.
- ทำ: probe `appt.appointDate.click()` → calendar เปิดแบบไหน (วันก่อนวันนี้มี `aria-disabled="true"`? หรือ class `disabled`? หรือคลิกไม่ได้?).
- แก้ `AppointmentPage` เพิ่ม helper `expectPastDateDisabled()` ด้วย selector จริง → ลบ `test.fixme` ที่ [customer-appointment.spec.ts:220](customer-appointment.spec.ts).

### ⛔ BLOCKED BY APP BUG — Appointment Type / Service Type dropdown โหลด options ไม่ได้
**probe 2026-06-19**: คลิก dropdown ใน Schedule form → **"Error loading options"**. master-data REST
(`welcome-crm-qa.one-sky.ai/api/v1/appointment_types`) โดน **CORS block** จาก frontend origin →
ผู้ใช้เลือก type/service ไม่ได้ → **add appointment ไม่ได้เลยบน UI**. ดู [BUG-appointment-type-options.md](BUG-appointment-type-options.md).
→ กระทบ **TS-02, TS-03, TA-01** (ทุกเคสที่ต้องเลือก dropdown ผ่าน UI). คงเป็น fixme/bug จนกว่า BE จะแก้ CORS.
> เมื่อ BE แก้แล้ว: ค่อยปลด fixme ตามขั้น ②③ ด้านล่าง. ระหว่างนี้ใช้ผลเป็น **defect** ไม่ใช่ pass.

### ② TA-01 — validation error toast  ⛔ **BLOCKED** (ดู BUG ข้างบน — เปิด dropdown error ก่อนถึง validation)
- เมื่อ CORS แก้แล้ว: verify `selectOption()` (คลิก trigger → option list เป็น `getByRole('option')` จริงไหม) + error-toast จริง → fix `expectErrorToast`.
- ใช้ `expect.soft` อยู่แล้วได้ (ตรวจ 3 ช่องว่างทีละช่อง) → ลบ fixme ที่ [customer-appointment.spec.ts:187](customer-appointment.spec.ts).

### ③ TS-02 / TS-03 — Add appointment  ⛔ **BLOCKED** (ดู BUG ข้างบน) + write → ต้องมี teardown
- Blocker: B1 (teardown ของ appointment ที่สร้าง) + B2 (option-list) + B3 (success toast).
- ทำ: introspect GraphQL appointment ops → เพิ่ม `seedAppointment`/`deleteAppointmentsByCustomer` ใน fixtures (ตามแพทเทิร์น seed.ts) + ผูก teardown (ต่อยอด `global-teardown.ts` หรือ `afterEach`).
- verify `fillScheduleForm` + `submitAdd` + success toast จริง + แถวใหม่ขึ้น list (Status=Pending).
- ลบ fixme ที่ [customer-appointment.spec.ts:87](customer-appointment.spec.ts) และ [:114](customer-appointment.spec.ts). TS-03 = เหมือน TS-02 แต่ Note ว่าง.

### ④ TS-04 / TS-05 — Confirm / Delete (ต้องมี Pending row ก่อน)
- Blocker: B1 (seed Pending appointment ผ่าน API — *อย่า* พึ่ง UI add เพื่อ Arrange เพราะ couple เคส) + B2 (row DOM: Confirm button, Bin icon, Status cell).
- ทำ: ใช้ `seedAppointment` (จาก ③) สร้าง Pending row บน `CUST_HAS_APPT` ใน `test.step` แรก (Arrange) → verify ปุ่ม Confirm/Bin บนแถว `PENDING_ROW` ('Follow Up').
- TS-04: คลิก Confirm → Status='Confirmed' + ปุ่ม Confirm/Bin หาย. TS-05: คลิก Bin → success toast + แถวหาย.
- fix `row()`, `confirm()`, `deleteByBin()`, `expectStatus()` ด้วย selector จริง → ลบ fixme ที่ [customer-appointment.spec.ts:136](customer-appointment.spec.ts) และ [:159](customer-appointment.spec.ts).

---

## Definition of Done ต่อเคส
1. selector ทุกตัวที่ใช้ verify กับ DOM จริงแล้ว (ไม่เดา) — คอมเมนต์วันที่ probe ใน POM.
2. เคส write มี teardown ทำงานจริง (รันซ้ำได้ idempotent, ไม่ทิ้งขยะใน SIT).
3. รัน `npx playwright test tests/customer-appointment` แล้วเคสนั้นผ่าน (หรือ fail จริง → เปิด bug card draft, ห้ามแกล้งผ่าน).
4. screenshot ราย step ลง `test-results/steps/<TC No.>.png` ครบ.
5. mapping ยังครบ 8 scenario / 18 TC.

## ถ้า probe แล้วเจอ blocker จริง (เช่น ไม่มี GraphQL appointment op)
หยุดเคสนั้นไว้เป็น fixme ต่อ + เขียนเหตุผลใหม่ที่เจาะจง + แจ้งกลับ (เช่นต้องขอ endpoint/permission จากทีม BE) — ไม่ต้องฝืน UI-only Arrange ที่จะทำให้ flaky.
