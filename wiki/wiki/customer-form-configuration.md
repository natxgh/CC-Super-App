# Customer Form Configuration (CFC + DFC)

Feature: Dynamic Form Builder + Default Field Configuration · Module 03
CMS Path: `/cms/contacts-configurations`
Test Account: `ketwadee` · Role: All Permission - Contact Configuration

---

## Part 1 — Custom Form / Dynamic Form Builder (CFC)

### What's on the Page
- `Custom Form` toggle (enable/disable)
- Dropdown: เลือก form ที่มีอยู่ + **Edit** / **Add** buttons
- **Save Configuration** button (bottom)

### Dynamic Form Builder Modal
- **Form Elements** (15 types): Text · Number · Text Area · Email · Multi-Checkbox · Single-Select · Image · DnD Image · Multi-Image · DnD Multi-Image · Date · Date & Time · Radio · Group · Dynamic Field
- **Form Settings**: Form Name (default "New Dynamic Form") · Desktop Grid Columns (default 1)
- **Per-field config**: ID (auto UUID) · Label · Placeholder · Required checkbox · Desktop Column Span (25/50/75/100%)
- **Layout Editor**: Hide All / Show All · drag reorder · Import · Export · Preview
- Close = `×` top-right

### Business Rules (CFC)
| Rule | Detail |
|------|--------|
| Form Name | Required + no duplicates → show error (exact text TBC) |
| Grid Columns | Accepts 1–5 · out of range = **clamp** (not error) |
| Field Label | **Not required** — has default, clearing = save still succeeds |
| Delete field | = new revision (no real delete, no dialog) |
| Delete Form | ❌ ไม่มีปุ่มบนหน้า config — ต้องทำใน Form Builder |
| Close × unsaved | **Silently discard** — no warning dialog |
| Import JSON | Valid = loads fields · Malformed = error **"Invalid form schema"** |
| Image upload | JPG/PNG/JPEG · max 3MB (enforced on consumer side: Add Customer) |

### Form Builder Lifecycle
```
Add → [New empty form]
    ── add fields (self-loop) ──
    ── set Form Name + config ──
    ── Save Configuration ──► [Saved, shown in dropdown]
    ── select from dropdown + Edit ──► [Edit mode, all fields loaded]
    ── edit (new revision) + Save Change ──► updated
Close × → silently discard, no warning
```

### Test Scenarios (CFC)
| ID | Name |
|----|------|
| CFC_TS01 | Create new form (Add → config → Save) |
| CFC_TS02 | Edit existing form |
| CFC_TS03 | Multi-type form + Preview |
| CFC_TS04 | Export → Import round-trip |
| CFC_TS05 | Config → Add Customer (integration) |
| CFC_TA01 | Form Name empty → save blocked |
| CFC_TA02 | Duplicate Form Name → blocked |
| CFC_TA03/04 | Grid Columns out of range → clamp |
| CFC_TA05 | Import malformed JSON |
| CFC_TA06 | Close × unsaved → discard |
| CFC_TA07 | Upload 5MB .pdf on Add Customer → blocked |

---

## Part 2 — Default Field Configuration (DFC)

### Sections on the Page
- **Profile Photo**: toggle ON/OFF
- **Personal Details** (9 fields): Display Name · Title · First Name · Middle Name · Last Name · Citizen ID · Date of Birth · Blood Type · Gender
  - ⚠️ Blood Type = **OFF by default** (STG default)
- **Registered Address** (13 fields): Building, Country, District, Floor, Latitude, Longitude, House No., Postal Code, Province, Road, Room, Street, Sub-district
- **Current Address** (same 13 fields)
- **Preferences** (4 fields): User Type · Language Preference · Contact Preference · Note
- **Save Configuration** — shared button saves ALL sections at once

### Business Rules (DFC)
| Rule | Detail |
|------|--------|
| Any field can be toggled OFF | ✅ no exceptions (even Display Name/First/Last Name) |
| Toggle OFF existing data | Data **hidden only** (not cleared) — toggle ON → data returns intact |
| Save saves all sections | One click saves CFC + DFC + standard sections |
| Blood Type default | OFF is the **system default** (not manually configured) |

### Toggle Lifecycle
```
[toggle ON] ── toggle OFF ──► [toggle OFF]
                              ─── Save ──► Add Customer: field hidden
toggle ON again ──► Save ──► Add Customer: field shows again
```

### Test Scenarios (DFC)
| ID | Name |
|----|------|
| DFC_TS01 | All Personal Details ON → Add Customer shows all |
| DFC_TS02 | Toggle Date of Birth OFF → field absent on Add Customer |
| DFC_TS03 | Toggle Blood Type ON (from OFF default) → shows |
| DFC_TA01 | Multiple fields OFF → all absent |
| DFC_TA02 | All Personal Details OFF → still valid |
| DFC_TA03 | Toggle field OFF on existing data → data not cleared |

---

## DFC — email/phone ไม่มี UI toggle

> ตรวจสอบแล้ว 2026-06-29

### ข้อเท็จจริง
- Fields `email` และ `mobileNo` **ไม่มี toggle** บนหน้า Form Configuration UI
- API `UpdateCustomerForm(CustomerFormConfigUpdateInput)` รองรับ key เหล่านี้ผ่าน `DFC_KEYS`:
  ```
  displayName, title, firstName, middleName, lastName, citizenId, dob, blood, gender,
  mobileNo, email, userType, note, languagePreference, contractPreference, photo
  ```
- UI Save Configuration ส่งเฉพาะ fields ที่มี toggle บน UI → ไม่รวม email, mobileNo

### ผลกระทบต่อ automation
- ทุกครั้งที่ CFC test เรียก `cfg.saveConfiguration()` (TS-06, TS-07, TA-09, DFC_TA02, DFC_TA03) → email/mobileNo ไม่อยู่ใน payload → API ตีความเป็น `false`
- CP test แก้ด้วย `setFieldConfig(page, CP_REQUIRED_FIELDS)` ใน `beforeAll` → reset กลับ `email=true, mobileNo=true` ก่อนรัน
- **ถ้า CFC suite และ CP suite รันใน order เดียวกัน** CFC teardown + CP beforeAll ต้องทำงานถูกลำดับ

### CFC Teardown
- `restoreFieldConfig` คืน snapshot ที่บันทึกไว้ก่อน DFC tests (`snapshotFieldConfig`)
- ถ้า snapshot ถูกบันทึกหลัง email/phone ถูก set เป็น false ไปแล้ว → restore จะคืนค่า false ด้วย

## PO Answers Applied (13/06/2026 + 22/06/2026)
All CFC Q1–Q9 and DFC HA-DFC1–4 answered. No pending HAs.

## Related Pages
- [Customer Profile](customer-profile.md)
- [CC Super App Overview](cc-super-app-overview.md)
