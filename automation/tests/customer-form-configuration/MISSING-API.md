# Customer Form Configuration — API coverage & gaps (Arrange/Teardown)

Endpoint: `https://cc-bff-qa.one-sky.ai/graphql` (same JWT as Customer/Case) · introspection open.
Introspected 2026-06-20. ApiResponse = `{ status("0"=ok) msg data desc }`.

## ✅ Available — Custom Form (Dynamic Form Builder) · `Forms` namespace
| Op | Path | Use |
|---|---|---|
| CreateForms | `Mutation.Forms.CreateForms(FormInput)` | Arrange a custom form (best-effort) |
| UpdateForms | `Mutation.Forms.UpdateForms(FormInput)` | Edit form (new revision) |
| DeleteForms | `Mutation.Forms.DeleteForms(GetIdInput{id})` | **Teardown** (hard delete) ✅ |
| GetFormAll / GetListForms | `Query.Forms.GetFormAll(ListDataInput)` | find form id by `formName` (purge) |
| GetFormByFormId | `Query.Forms.GetFormByFormId(GetIdInput{id})` | read one form |
| UpdateFormsActive/Lock/Publish/Version | `Mutation.Forms.*` | form lifecycle (publish/version) |

`FormInput` keys: `id, formName, formColSpan, formType('customer'), active, publish, locks, formFieldJson:[JSON]`.
`formFieldJson` item shape (จาก record จริง): `{ id, label, showLabel, type('textInput'…), value, placeholder, required, colSpan, isChild, formRule }`.

## ✅ Available — Default Field Config (the toggles) · `CustomerForm` namespace
| Op | Path | Use |
|---|---|---|
| GetListCustomerForm | `Query.CustomerForm.GetListCustomerForm()` | **snapshot** config ปัจจุบัน (teardown) ✅ |
| UpdateCustomerForm | `Mutation.CustomerForm.UpdateCustomerForm(CustomerFormConfigUpdateInput)` | save toggles / **restore** ✅ |

`CustomerFormConfigUpdateInput` keys (1:1 กับหน้าจอ DFC):
`photo` · `displayName,title,firstName,middleName,lastName,citizenId,dob,blood,gender` (Personal Details 9) ·
`mobileNo,email,userType` · `note,languagePreference,contractPreference` (Preferences; sic: contract) ·
`address:JSON, currentAddress:JSON` (13 fields/อัน) · `dynamicForm:JSON`.

## 🔁 Teardown (run: `npm run test:formconfig` หรือ `CFC_TEARDOWN=1 npm test`)
`tests/customer-form-configuration/teardown/global-teardown.ts` ทำ 2 อย่าง:
1. **DeleteForms** ลบ custom form ที่ test สร้าง — match by `formName` (marker `[qa-automation]` ใน `testdata.TEST_FORM_NAMES` + ที่ `registerCreatedForm` บันทึก) → hard delete.
2. **Restore Default Field Config** — DFC เป็น **global singleton (org-wide)** ไม่มี create/delete.
   - `snapshotFieldConfig()` ถูกเรียกใน `beforeAll` ของ DFC describe → เก็บ config เดิมลง `test-results/cfc-config-snapshot.json` ก่อนแตะ toggle.
   - teardown `restoreFieldConfig()` → `UpdateCustomerForm` คืนค่าเดิม แล้วลบ snapshot.
   - ⚠️ **ความเสี่ยง:** ถ้า run crash กลางคัน (ก่อน teardown) config org จะค้างตามที่ test แก้. รัน `npm run teardown:formconfig` ซ้ำเพื่อ restore จาก snapshot ที่ยังค้างอยู่.

## ⚠️ GAPS — ต้องตรวจผ่าน UI (ไม่มี API arrange/assert จุดเดียว)
1. **Import / Export JSON file** (TS-04, TA-05 / CFC11–12) — `formFieldJson` คือ schema แต่ *ช่องทางไฟล์* (download blob / file chooser) เป็น UI-only. spec ใช้ `waitForEvent('download'/'filechooser')` + assets — ต้องมีไฟล์จริงใน `assets/` (`form-schema.json`, `broken.json`).
2. **Grid Columns clamp / Form Name duplicate-error / silent-discard-on-close** (TA-02/03, TA-07, TA-06) = pure UI logic ไม่มี read API → assert ผ่าน UI เท่านั้น.
3. **Delete-field = new revision** (Q5 / UI-02) — `UpdateFormsVersion` มี แต่ semantics "ลบ field แล้วขึ้น revision" เป็น server logic; spec ตรวจ field count ลด + ไม่มี dialog. ยืนยัน revision จริงผ่าน `GetFormByFormId(listVersion)` เพิ่มได้ภายหลัง.
4. **Image upload format/size enforcement** (TA-08 / CFC16-TC4) — consumer-side บนหน้า Add Customer; ต้อง config Image field ก่อน + มีไฟล์ `contract.pdf`. spec skip ถ้าไม่มี Image field/asset.

## ✅ PO ANSWERED (HA-DFC1–4) — 22/06/2026
- **HA-DFC1** → ✅ **toggle ได้ทุก field ไม่มีข้อยกเว้น** → เพิ่ม `DFC_TA02` (all-OFF edge) ใน spec แล้ว
- **HA-DFC2** → ✅ **data hidden ไม่ cleared** (toggle ON กลับมาเห็นข้อมูลเดิม) → เพิ่ม `DFC_TA03` (data-safety) ใน spec แล้ว
- **HA-DFC3** → ✅ **one-save all sections** → `TS-06/07/08/TA-09` ใช้ `cfg.saveConfiguration()` ถูกต้อง
- **HA-DFC4** → ✅ **Blood Type = OFF เป็น system default** → `TS-08` ปลด pending annotation แล้ว

## ✅ Selectors-verified (live DOM probe 2026-06-21)
POM (`pages/FormConfigPage.ts`, `pages/FormBuilderPage.ts`) อัพเดทแล้วตามผล probe:
- **toggles** = `<input type="checkbox">` ด้วย stable ID (`#personal-photo`, `#personal-blood`, `#address-<key>`, ฯลฯ) — **ไม่ใช่** `role=switch` (count=0)
- **Custom Form toggle** = `#dynamicForm-enabled`
- **Form dropdown** = `button` ชื่อ "Contact Customization" — **ไม่ใช่** `role=combobox`
- **Builder modal** = `[class*="modal" i]` — **ไม่ใช่** `role=dialog`
- **Form Name** = `getByPlaceholder('Enter form name')` ✓
- **Grid Columns** = `#overallColSpan-input` ✓
- **Builder save** = ปุ่ม "Save Form" (ใน builder) / "Save Configuration" (หน้าหลัก)
- **Per-field config** = uuid-based IDs (`#required-<uuid>`, `#colSpan-select-<uuid>`) — locate ผ่าน nth field card
- Toast/inline error text: TBC จาก execute จริง (regex fallback ใช้งานได้)
