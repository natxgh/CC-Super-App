# Test Design — Linkage Customer Profile with Case (LCP)  〔File 1: Design〕

> **File 1 (Design)** — Business Conditions → Technique → Test Cases → Scenarios (E2E) + Hidden Assumptions
> Per-Test-Case detail lives in **File 2** `linkage-customer-case-testcases.xlsx` (1 sheet — template 2026-06-11)
> Designed per `test-design-standard.md` (Black Box). Scenarios written as **E2E flows**.
>
> **Context / Source:** Explored the live feature on STG `…/cms/case/creation` (app v0.26.3) vs.
> BRD `BRD-Contact Center Super Apps_v0.3.pdf` (§3.1.1 Linked Customers / Customer Case History View / CRM Integration · §3.1.2 Customer Profile) and `grooming-requirements.md` (§5.1 link Case ↔ Customer by phone number, §1.1 Customer 360). Exploration notes: `requirements-explored.md`.
> **Arrange — Test Account:** Login User: ketwadee · Role: All Permission - Contact/Case Management
>
> **Updated 19/06/2026:** Applied PO answers (10/10) · English version · cleaned Business Conditions (no IDs) and Case Title Names (no `[xxx]`) · aligned style with the **Customer Profile** feature. Step 4 — Test Scenarios mirrors File 2 (the Lark Base source of truth).
> **⚠️ 3 open defects found during exploration** (A-1 Search broken, A-2 Clear Filters does not re-fetch, A-4 reopen modal hangs on loading) + A-3 list-row identity mismatch. These are bugs to file (not PO design questions) — see Step 5.

---

## Feature Scope (this Design round)

| Feature Code | Feature Name |
|---|---|
| LE | Linkage Customer Phone in Case — Linked Existing (search + Select → link a customer to the case) |
| AC | Add New Customer Profile From Add Case Page (quick-create from the case page) |

> LE sub-features: the result of Select = (1) right Customer 360 panel populates (2) the case form "Phone Number" field auto-fills (3) "View Full Profile" button

---

## PO Answers Applied (19/06/2026)

| Q | Topic | PO Answer |
|---|---|---|
| Q1 | List-row identity mismatch (A-3) | Expected = **1 phone number per 1 customer profile**; the mismatch is a data-integrity issue — clear junk data before SIT |
| Q2 | Auto-link after Add Customer Save | **Auto-link immediately**: panel populates + case Phone Number fills with the new number |
| Q3 | Duplicate phone / email on Add | **Block + show error** (no duplicate) for both duplicate phone and email |
| Q4 | No inline validation (B-1) | **Add inline validation**: "Please enter an email address" / "Please enter a mobile number"; after submit, hide dialog then show toast |
| Q5 | Change / cancel the linked customer | System links data by phone number; changing the phone number re-links automatically (known bug on edit) |
| Q6 | Phone Number field after link | **Editable** — the agent can override the fetched number |
| Q7 | Phone search format | **Non-dash format only** (0850020000); UI should validate and reject dash format |
| Q8 | Quick-create minimal fields | **Intentionally minimal** (fast service on call popup); the rest are filled in the Full Customer Profile later |
| Q9 | Filter "Type" values | **Bronze / Silver / Gold / Platinum / N/A** |
| Q10 | "View Full Profile" behaviour | **Opens a Modal** (expand display) showing the Full Profile |

---

## Step 1 — Business Conditions

### LE — Linkage Customer Phone in Case (Linked Existing)

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| LE1 | Click "Linked Existing" → modal opens with the full customer list (default, unfiltered) with columns CUSTOMER / CONTACT / PRODUCT / SERVICE / TYPE / ACTIVE + a Select button per row + pagination | EP | has data / no data (2 groups) |
| LE2 | Search by keyword (Name / Mobile Number / Email) → show matching records | EP | found / not found  ⚠️**known defect A-1: search broken** |
| LE3 | Filter "Type" (Customer Grade) → show only the selected grade | EP | matches type / does not |
| LE4 | Click Select on a row → link the customer to the case: right panel populates (avatar, name, DOB, Email, Phone Number, Customer Grade) **and the case form "Phone Number" auto-fills** with the customer's number | State Transition | No-customer → Linked |
| LE5 | After link → "View Full Profile" appears → click opens a **Modal** showing the Full Profile | Use Case | clickthrough / expand display |
| LE6 | Customer 360 panel (embedded) shows tabs: Profile (Contact Channels) / History (Case History) / Note / Appointment / Product / Service | Use Case | enumerate tabs |
| LE7 | Re-select a new customer (change the link) → panel + Phone Number field update to the new customer (replace) | State Transition | Linked → Linked (replace) |

### AC — Add New Customer Profile From Add Case Page

> **Explored:** the quick-create form has only 4 fields — **Email\* / Phone\*** (required) + First Name / Last Name (optional) — intentionally minimal per PO (Q8).

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| AC1 | Email\* and Phone\* are required (First/Last Name optional) | Use Case | enumerate empty-field combinations |
| AC2 | Email must be a valid format | EP | valid / invalid format |
| AC3 | Fill all + Save → new customer created → **auto-link to case + panel populates** (PO confirmed) | State Transition | Form (Filled) → Saved → Linked |
| AC4 | Phone / Email duplicate of an existing customer → **block + error** (PO confirmed) | EP | unique / duplicate |

---

## Step 2 — Test Cases (summary: 4 parts)

> **Real Example Data** — based on real STG data: Bulan J (0899181632 / bulan.jit@skyai.co.th / Gold) · Donald Throught (0899181633 / Platinum) · Vilailuk Maksuk (0850020000 / vilailuk@gmail.com / Platinum)

### LE — Linked Existing

**LE1 — Open modal + list (EP)**
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| LE1-TC1 | On Case Creation, ≥1 customer in the system | Click "Linked Existing" | has data | Modal opens · Search input (placeholder "Search Name,Mobile Number,Email."), Search button, Filter "Type" · table ≥1 row with columns CUSTOMER / CONTACT (email+phone) / PRODUCT / SERVICE / TYPE / ACTIVE + "Select" per row · footer "Showing 1–N of N entries", Show [10], Previous/1/Next |
| LE1-TC2 | No customer (or filter with no match) | Open the Linked Existing modal | no data | Table shows "No results found." · footer "Showing 1–0 of 0 entries" |

**LE2 — Search (EP)** ⚠️ known defect A-1
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| LE2-TC1 | Customer "Bulan J" (0899181632) exists | Search "Bulan" → click Search | found by Name | Row "Bulan J" with bulan.jit@skyai.co.th, 0899181632 · non-matching rows hidden ⚠️(currently "No results found." = defect A-1) |
| LE2-TC2 | Customer Bulan J (0899181632) exists | Search "0899181632" → Search | found by Mobile Number | Row "Bulan J" (matching number) ⚠️A-1 |
| LE2-TC3 | Customer with phone 0850020000 exists | Search "0850020000" (no dash) → Search | found by Mobile (non-dash) | Row with phone 0850020000 ⚠️A-1 (PO Q7: non-dash format only; reject dash) |
| LE2-TC4 | Customer Bulan J (bulan.jit@skyai.co.th) | Search "bulan.jit@skyai.co.th" → Search | found by Email | Row "Bulan J" ⚠️A-1 |
| LE2-TC5 | No customer "Nonexistent Person" | Search "Nonexistent Person" → Search | not found | Table shows "No results found." |
| LE2-TC6 | Just searched, list empty | Click "Clear Filters" | Clear Filters → restore list | Input cleared · the full customer list shows again ⚠️(currently still "No results found" = defect A-2) |

**LE3 — Filter by Type (EP)**
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| LE3-TC1 | Customers of grade Gold and Platinum exist | Filter Type = "Platinum" | matches type | Only TYPE = Platinum rows (e.g. Donald Throught) · Gold/Silver/Bronze hidden (PO Q9: Bronze/Silver/Gold/Platinum/N/A) |

**LE4 — Select → Link (State Transition)**
States: `No customer linked` → `[Select]` → `Linked (panel populated + phone filled)`
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| LE4-TC1 | Modal open, right panel empty (`-`), case Phone Number empty | Click "Select" on the row with phone 0899181632 | Select → Link | Modal closes · Customer Information card shows avatar + name + Email + Phone Number: 0899181632 + Customer Grade · **case "Phone Number" auto-fills = 0899181632** · "View Full Profile" appears |
| LE4-TC2 | (after LE4-TC1) customer linked | Inspect the Customer Information card | linkage assertion | Card matches the selected row (PO Q1: 1 phone = 1 profile) ⚠️(defect A-3: row "ana Yukinae/ana@gmail.com/Gold" ≠ linked "Vilailuk Maksuk/vilailuk@gmail.com/Platinum") |

**LE5 — View Full Profile (Use Case)**
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| LE5-TC1 | Customer linked (LE4-TC1) | Click "View Full Profile" | expand display | A **Modal** opens showing the customer's Full Profile (complete Personal Details) (PO Q10) |

**LE6 — Customer 360 panel tabs (Use Case)**
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| LE6-TC1 | Customer linked | View the right panel tab bar | enumerate tabs | Tab bar: Profile · History · Note · Appointment · Product · Service |
| LE6-TC2 | Customer linked, Profile tab | Open Profile tab | Contact Channels | "Contact Channels": Phone Number 0899181632 (badge "Primary" + verified ✓) · Line · Email (verified ✓) |
| LE6-TC3 | Customer linked with no case | Open History tab | Case History empty | History tab shows "No results found." |
| LE6-TC4 | Customer linked | Open Appointment tab | Appointment summary | "+ Add" button · "Upcoming" card (count) · "Confirm" card (count) |

**LE7 — Re-select / change customer (State Transition)**
States: `Linked (A)` → `[Linked Existing → Select B]` → `Linked (B)`
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| LE7-TC1 | Customer A (0850020000) linked | Open Linked Existing → Select "Bulan J" (0899181632) | replace link | Right panel updates to Bulan J · case Phone Number changes to 0899181632 (replaces previous) (PO Q5: re-link by phone) ⚠️A-4 (reopen modal hang) |

### AC — Add New Customer Profile From Add Case Page

**AC1 — Required Email + Phone (Use Case)** — PO Q4: inline validation
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| AC1-TC1 | Add Customer form open | Email: napatsorn.wong@gmail.com, Phone: 0623344556 → Save | required complete | Saves successfully (see AC3) · no error |
| AC1-TC2 | Add Customer form open | Email: empty, Phone: 0623344556 → Save | Email (required) empty | Inline "Please enter an email address" on Email field · dialog hides then error toast · not saved |
| AC1-TC3 | Add Customer form open | Email: napatsorn.wong@gmail.com, Phone: empty → Save | Phone (required) empty | Inline "Please enter a mobile number" on Phone field · not saved |
| AC1-TC4 | Add Customer form open | Email: empty, Phone: empty → Save | both required empty | Both "Please enter an email address" + "Please enter a mobile number" · not saved |

**AC2 — Email Format (EP)**
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| AC2-TC1 | Add Customer form open | Email: napatsorn.wong@gmail.com, Phone: 0623344556 | valid format | Email field has no error |
| AC2-TC2 | Add Customer form open | Email: napatsorn.wonggmail.com (no @), Phone: 0623344556 → Save | invalid format | Email field shows "Invalid email address format" (exact copy TBC) · not saved |

**AC3 — Save Success (State Transition)**
States: `Form (Filled)` → `[Save]` → `Customer Created` → `Linked to case (panel populated)`
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| AC3-TC1 | Add Customer form, all filled | Email: napatsorn.wong@gmail.com, Phone: 0623344556, First Name: Napatsorn, Last Name: Wongthong → Save | save success | Dialog hides, then Toast "Success" · Customer Information card populated "Napatsorn Wongthong" + Phone 0623344556 · case Phone Number auto-fills = 0623344556 (PO Q2: auto-link) |

**AC4 — Duplicate Phone/Email (EP)** — PO Q3: block both
| TC ID | Arrange | Test Data / Action | Tested Condition | Expected |
|---|---|---|---|---|
| AC4-TC1 | Customer with phone 0899181632 (Bulan J) exists | Email: new.person@gmail.com, Phone: 0899181632 → Save | duplicate phone | System blocks + error "" (exact copy TBC) · no duplicate |
| AC4-TC2 | Customer with email bulan.jit@skyai.co.th exists | Email: bulan.jit@skyai.co.th, Phone: 0623344556 → Save | duplicate email | System blocks + error "" · no duplicate |

---

## Step 3 — Hidden Assumptions (all closed by PO 19/06/2026)

> ✅ = closed (PO answered) · all 10 design questions answered.

| # | Question | Status | PO Answer |
|---|---|---|---|
| Q1 | List-row identity mismatch (A-3) | ✅ | Expected 1 phone = 1 customer profile; data-integrity defect, clear junk data before SIT |
| Q2 | Auto-link after Add Customer Save | ✅ | Auto-link immediately (panel populate + phone fill) |
| Q3 | Duplicate phone/email on Add | ✅ | Block + error (no duplicate) for both |
| Q4 | No inline validation (B-1) | ✅ | Add inline validation; messages "Please enter an email address" / "Please enter a mobile number"; hide dialog then toast |
| Q5 | Change / cancel linked customer | ✅ | Links by phone number; changing the number re-links (known bug on edit) |
| Q6 | Phone Number field after link | ✅ | Editable — agent can override |
| Q7 | Phone search format | ✅ | Non-dash format only (0850020000); reject dash |
| Q8 | Quick-create minimal fields | ✅ | Intentionally minimal; rest filled in Full Profile later |
| Q9 | Filter "Type" values | ✅ | Bronze / Silver / Gold / Platinum / N/A |
| Q10 | "View Full Profile" behaviour | ✅ | Opens a Modal (expand display) showing the Full Profile |

> **No open Hidden Assumptions remain.** Sign-off is still gated on the 3 open defects below.

---

## Step 4 — Test Scenarios (mirror of File 2 / Lark Base — EN, flat)

> ID: `TS-##` = Success · `TA-##` = Alternative. Full Steps / Expected / Test Data per TC live in **File 2** `linkage-customer-case-testcases.xlsx`.

### Success Scenarios

**TS-01** — User can successfully link an existing customer to a case (search → Select → view Customer 360 + auto-fill Phone)
```
1. TS-01_TC-01  Open the "Linked Existing" modal → modal + customer list
2. TS-01_TC-02  Search keyword "0899181632" (Mobile Number) → Bulan J   (⚠️ defect A-1)
3. TS-01_TC-03  Click Select → link customer + case Phone Number auto-fills
4. TS-01_TC-04  View Customer 360 tabs: Profile/History/Note/Appointment/Product/Service
5. TS-01_TC-05  Profile tab → Contact Channels (Phone Primary + verified)
6. TS-01_TC-06  Click "View Full Profile" → Full Profile Modal opens
```

**TS-02** — User can successfully add a new customer from the case page and auto-link it
```
1. TS-02_TC-01  Click "Add Customer" → fill Email + Phone (required complete)
2. TS-02_TC-02  Fill First/Last Name → Save → Toast "Success" + auto-link
```

**TS-03** — User can successfully change the linked customer (re-select to replace)
```
1. TS-03_TC-01  Select customer A (0850020000) → linked
2. TS-03_TC-02  Re-select Bulan J (0899181632) → replaces the previous link
```

### Alternative Scenarios

| Scenario | Scenario Name | TC | Result |
|---|---|---|---|
| TA-01 | Search by Name and find the customer | TA-01_TC-01 | Search "Bulan" → "Bulan J" (⚠️ defect A-1) |
| TA-02 | Search by Mobile Number (non-dash) | TA-02_TC-01 | Search "0850020000" → row found (⚠️ A-1; PO Q7 reject dash) |
| TA-03 | Search by Email and find the customer | TA-03_TC-01 | Search "bulan.jit@skyai.co.th" → "Bulan J" (⚠️ A-1) |
| TA-04 | "No results found." for a no-result keyword | TA-04_TC-01 | Search "Nonexistent Person" → "No results found." |
| TA-05 | Clear Filters restores the list | TA-05_TC-01 | Click Clear Filters → full list (⚠️ defect A-2) |
| TA-06 | "No results found." when no customer matches | TA-06_TC-01 | Open modal, no match → "No results found." |
| TA-07 | Filter the list by Type | TA-07_TC-01 | Filter Type = Platinum → only Platinum rows |
| TA-08 | Linked identity matches the selected row | TA-08_TC-01 | Compare card vs row (PO Q1; ⚠️ defect A-3) |
| TA-09 | "No results found." in Case History (no case) | TA-09_TC-01 | Open History → "No results found." |
| TA-10 | "Please enter an email address" — empty Email | TA-10_TC-01 | Save with empty Email → inline error + toast |
| TA-11 | "Please enter a mobile number" — empty Phone | TA-11_TC-01 | Save with empty Phone → inline error + toast |
| TA-12 | Both error messages — both empty | TA-12_TC-01 | Save with all empty → 2 inline errors + toast |
| TA-13 | Invalid email address format | TA-13_TC-01 | Email without @ → "Invalid email address format" (TBC) |
| TA-14 | Duplicate phone number is blocked | TA-14_TC-01 | Phone 0899181632 → blocked, no duplicate |
| TA-15 | Duplicate email address is blocked | TA-15_TC-01 | Email bulan.jit@skyai.co.th → blocked, no duplicate |

> **TBC:** exact error copy for TA-13/TA-14/TA-15 marked "TBC" — confirm wording with PO/Dev before sign-off.

---

## Step 5 — Definition of Done (Self-check)

- [x] Needs converted to Business Conditions (LE 7 / AC 4 = 11 conditions)
- [x] Techniques covered: EP (LE1/LE2/LE3/AC2/AC4) · State Transition (LE4/LE7/AC3) · Use Case (LE5/LE6/AC1)
- [~] BVA: no numeric/time boundary conditions in this feature → N/A by design
- [x] State Transition: No-customer→Linked (LE4), Linked→Linked replace (LE7), Form→Saved→Linked (AC3)
- [x] Test Cases have all 4 parts (Arrange / Test Data / Tested Condition / Expected)
- [x] Both Success (3) and Alternative (15) Scenarios
- [x] No contradictory conditions within a single Scenario
- [x] Real Example Data (Bulan J / Donald Throught / Vilailuk Maksuk / Napatsorn Wongthong) — no "Test/ทดสอบ"
- [x] All 10 Hidden Assumptions closed by PO (19/06/2026)
- [ ] ⚠️ **3 open defects gate sign-off** — A-1 (Search broken), A-2 (Clear Filters no re-fetch), A-4 (reopen modal hangs) + A-3 (list-row identity mismatch / data integrity). File bug cards and verify fixes before SIT/QA.
- [x] IDs tagged on every TC; ✓ markers on TCs used in Scenarios
