# Test Design — Customer Appointment (CAP) 〔File 1: Design〕

> **File 1 (Design)** — 4 techniques → Conditions → woven into Scenarios (flow) + Hidden Assumptions
> Per-test-case detail lives in **File 2** `customer-appointment-testcases.xlsx` (1 sheet — base export layout, 24 columns)
> Designed per `test-design-standard.md` (Black Box). Scenarios are written as **E2E flows**.
>
> **Input:** Flow diagram "Customer Appointment Management" (4 sub-flows) + BRD CC Super App v0.3 + Grooming Meeting (11/06/2026)
> **Feature Prefix:** `CAP` · **Scenario IDs:** `TS-01…TS-05` (Success) · `TA-01…TA-03` (Alternative)
> **Updated 12/06/2026:** Applied PO answers Q1–Q10 · all HA Q1–Q10 closed · Q11/Q12 confirmed from Grooming
> **Updated 15/06/2026:** Translated to English · Arrange expanded to a fully-prepared Customer (all fields), matching the Customer Profile reference.
> **Updated 16/06/2026:** Synced to base export. Open-form button = **"Schedule"** · form submit = **"Add"** · cancel = **"Back"** · empty-state text = **"No results found."** · Scenario IDs renumbered to `TS-`/`TA-` · Arrange now carries the pre-populated Appointment List · option values aligned to base (Maintenance / General Maintenance / Oil Change).

---

## Arrange — Test Data to prepare before testing

```
Login User: ketwadee
Role & Permission: All Permission - Appointment Management
---------------------------------------------------
Customer Data in System "Siriwimon Somjit"  (has appointments — used for View / Add / Confirm / Delete)
Appointment List
1.
Appointment Type: Present
Service Type: Advise product
Appoint Date: 20/10/2026 09:00 AM
Note: Onsite customer office
Status: Confirmed
2.
Appointment Type: Follow Up
Service Type: Installation
Appoint Date: 12/11/2026 02:30 PM
Note: -
Status: Pending

Personal Details:
- Email: siriwimon.somjit@gmail.com
- Phone: 0823456789
- Title: Ms.
- First Name: Siriwimon
- Middle Name: -
- Last Name: Somjit
- Gender: Female
- Landline: 0824445566
- Type: Gold
- Date of Birth: 14/03/2533

Registered Address
 House No.: 88
 Room: -
 Floor: 12
 Building: Asoke Tower
 Street/Road: Asok Montri
 Province: Bangkok
 District: Watthana
 Sub-district: Khlong Toei Nuea
 Postal Code: 10110
 Country: Thailand

Current Address: Same As Registered

Preferences
Contact: Mobile Number
Language: Thai

Custom Form
Company Name: Siam Tech Solutions
Employee ID: EA000012
Line ID: siriwimon.s
Driving License: -
Position: Marketing Lead
---------------------------------------------------
Customer Data in System "Wannida Pongprai"  (no appointment yet — used for the Empty-State case)
Personal Details:
- Email: wannida.pongprai@gmail.com
- Phone: 0834567890
- Title: Ms.
- First Name: Wannida
- Middle Name: -
- Last Name: Pongprai
- Gender: Female
- Landline: -
- Type: Silver
- Date of Birth: 02/11/2538

Registered Address
 House No.: 21/4
 Room: 305
 Floor: 3
 Building: Lumpini Place
 Street/Road: Rama IV
 Province: Bangkok
 District: Pathum Wan
 Sub-district: Lumphini
 Postal Code: 10330
 Country: Thailand

Current Address: Same As Registered

Preferences
Contact: Email
Language: Thai

Custom Form
Company Name: -
Employee ID: -
Line ID: wannida.p
Driving License: -
Position: -
```

---

## BRD Cross-check

| BRD topic | What the Flow states | Result |
|---|---|---|
| CRM → Customer Appointment → **Appointment Calendar** | Flow has View / Add / Confirm / Delete ✅ | Covers BRD |
| CRM must support Customer Single View | Uses Profile Detail as the entry point ✅ | Matches |
| Required fields / validation rules | Confirmed by PO Q1–Q5 ✅ | Closed |
| Status lifecycle (Pending → Confirmed) | Confirmed by PO Q7 + Grooming ✅ | Closed |
| Appointment Date business rules | Confirmed Q3: block past date ✅ | Closed |
| Delete rules | Confirmed Q9+Q10: Pending only (bin icon), Confirmed cannot be deleted ✅ | Closed |

---

## 📝 Grooming Notes (11/06/2026)

- **Real status names:** after Add = **"Pending"** · after Confirm = **"Confirmed"** ✅ confirms Q7+Q11
- **Open-form button = "Schedule"** → opens the **Schedule Appointment Form** (submit = "Add", cancel = "Back")
- **Option values used in cases (per base export):** Appointment Type — Present / Follow Up / Maintenance · Service Type — Advise product / Installation / General Maintenance / Oil Change
- **Reminder feature = Out of Scope for this phase**
- Confirm = Agent calls the customer to confirm first, then clicks confirm in the system

---

## ⚠️ UI Observation — ✅ CONFIRMED via automation probe (17/06/2026)

The Schedule Appointment form has **placeholder labels that are swapped** (confirmed on STG live DOM):
- The **"Appointment Type"** field has the placeholder *"Search Service Type."*
- The **"Service Type"** field has the placeholder *"Search Appointment Type."*
→ UI copy bug — **flag to Dev** (verified, not just suspected).

**Other finding (automation):** the **Appoint Date** field uses format **`mm/dd/yyyy hh:mm`** (US month-first order),
not `dd/mm/yyyy` — confirm intended locale with Dev/PO (test data uses `mm/dd/yyyy`).

---

## PO Answers Applied (12/06/2026)

| Q | Topic | PO answer | Status |
|---|---|---|---|
| Q1 | Appointment Type required? | ✅ Required | ✅ Closed |
| Q2 | Service Type required? | ✅ Required | ✅ Closed |
| Q3 | Appoint Date past date | ✅ Block past date (datepicker disabled or error) | ✅ Closed |
| Q4 | Appoint Date required? | ✅ Required | ✅ Closed |
| Q5 | Note optional? | ✅ Optional (not required) | ✅ Closed |
| Q6 | Empty-state text | **'No results found.'** | ✅ Closed |
| Q7 | Status after Confirm | Pending → **Confirmed** | ✅ Closed |
| Q8 | Confirm button visibility | Pending only | ✅ Closed |
| Q9 | Delete flow | **Bin icon appears only on Pending** (no explicit confirm dialog) | ✅ Closed |
| Q10 | Can Confirmed be deleted? | No — no bin icon on Confirmed | ✅ Closed |
| Q11 | Real status names | "Pending" / "Confirmed" (confirmed from Grooming) | ✅ Closed |
| Q12 | Option values | Appointment Type / Service Type values per base export (see Grooming Notes) | ✅ Closed |

---

## Step 1 — Business Conditions

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| CAP-BC1 | System shows the Customer List so the User can select and view a Profile | Use Case | multiple navigation paths |
| CAP-BC2 | Customer Profile Detail must have a clickable "Appointment" tab | Use Case | UI navigation |
| CAP-BC3 | Appointment tab shows the customer's Appointment List (or empty state) | Use Case | has / has no appointment |
| CAP-BC4 | User can open the Schedule Appointment form via the **"Schedule"** button on the tab | Use Case | entry point to the add flow |
| CAP-BC5 | Appointment Type must be selected (required ✅) | EP | selected / not selected |
| CAP-BC6 | Service Type must be selected (required ✅) | EP | selected / not selected |
| CAP-BC7 | Appoint Date must be entered (required ✅) and must not be in the past | BVA + EP | past = block / today = pass / future = pass + empty |
| CAP-BC8 | Note is an optional field (can Add without it ✅) | EP | filled / empty |
| CAP-BC9 | When Add succeeds → the appointment has status "Pending" in the list | State Transition | initial → Pending |
| CAP-BC10 | User can Confirm only appointments with status "Pending" (Confirm button hidden otherwise ✅) | State Transition | Pending → Confirmed |
| CAP-BC11 | When Confirmed → status changes to "Confirmed" and shows immediately in the UI ✅ | State Transition | output of the transition |
| CAP-BC12 | User can Delete only appointments with status "Pending" (bin icon appears only on Pending ✅) | State Transition | Pending → Deleted; Confirmed → cannot delete |
| CAP-BC13 | When Deleted → the appointment is removed from the list | State Transition | output of the delete |

---

## Step 2 — State Transition Diagram (Appointment Status)

```
[No appointment]
        │ Fill the form completely + Click "Add" (Actor: User)
        ▼
  [Pending]  ──── Click "Confirm" (Actor: User) ────►  [Confirmed]
      │               (Agent calls the customer first)        │
      │ Click bin icon (Delete)                      ❌ No Delete button
      ▼                                              (bin icon hidden)
  [Deleted — removed from list]

Notes:
- "Confirm" button appears only for status = Pending
- bin icon (Delete) appears only for status = Pending
- Confirmed → no action available to delete
- Status names (confirmed by PO Q7/Q11 + Grooming): "Pending" / "Confirmed"
```

---

## Step 3 — Test Cases

> **Arrange** for every case = the prepared Customer data above (all fields + Appointment List).
> Customer 1 "Siriwimon Somjit" (has appointments) for View/Add/Confirm/Delete · Customer 2 "Wannida Pongprai" (no appointment) for the Empty-State case.
> The line below each Arrange in File 2 is the case-specific precondition (e.g. "form is open").

### CAP-BC1 — Customer List Navigation (Use Case)

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC1-TC1 | Customer "Siriwimon Somjit" exists and already has appointments | Go to the "Customer List" page · Search "Siriwimon Somjit" | System shows the Customer List | Page displays: Search bar · Customer list table with columns (Name / Email / Phone / Type) · row "Siriwimon Somjit" (siriwimon.somjit@gmail.com) with a "View" button |
| CAP-BC1-TC2 | On the Customer List, "Siriwimon Somjit" is visible | Click "View" for that customer | Navigate to Customer Profile Detail | Customer Profile Detail of "Siriwimon Somjit" opens · Tab navigation shown (including the "Appointment" tab) |

### CAP-BC2 — Appointment Tab (Use Case)

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC2-TC1 | On the Customer Profile Detail | Look at the tab navigation | The "Appointment" tab must be present | Tab bar shows the "Appointment" tab alongside other tabs (e.g. Customer / Products / Services / Case / Appointment) |
| CAP-BC2-TC2 | On the Customer Profile Detail | Click the "Appointment" tab | Switch to the Appointment section | Appointment section displays · "Schedule" button visible · shows a list or the empty state |

### CAP-BC3 — View Appointment List (Use Case)

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC3-TC1 | Customer "Siriwimon Somjit" already has appointments | Click the "Appointment" tab | Customer has appointments | Appointment List shows each row (Appointment Type / Service Type / Appoint Date / Note / Status) · "Schedule" button visible · row with Status = "Pending" has a "Confirm" button + "Bin" icon |
| CAP-BC3-TC2 | New customer "Wannida Pongprai" has no appointment | Click the "Appointment" tab | Customer has no appointment | Displays **"No results found."** · "Schedule" button still visible |

### CAP-BC4 — Open Schedule Appointment Form (Use Case)

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC4-TC1 | On the "Appointment" tab | Click the "Schedule" button | Open the Schedule form | Schedule Appointment Form shows fields: Appointment Type* (dropdown) · Service Type* (dropdown) · Appoint Date* (date-time picker) · Note (text area, optional) · "Add" (submit) button · "Back" button |

### CAP-BC5 — Appointment Type (EP)
> PO Q1: Required ✅

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC5-TC1 | Schedule form is open | Select Appointment Type = "Maintenance" | Appointment Type is selected | Appointment Type dropdown shows "Maintenance" · no error highlight on the field |
| CAP-BC5-TC2 | Schedule form is open | Do not select Appointment Type → click Add | Appointment Type empty (required) | Display error toast "Error" · Appointment Type field shows error state (red border/highlight) |

### CAP-BC6 — Service Type (EP)
> PO Q2: Required ✅

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC6-TC1 | Form open, Appointment Type already selected | Select Service Type = "General Maintenance" | Service Type is selected | Service Type dropdown shows "General Maintenance" · no error highlight |
| CAP-BC6-TC2 | Schedule form is open | Do not select Service Type → click Add | Service Type empty (required) | Display error toast "Error" · Service Type field shows error state |

### CAP-BC7 — Appoint Date (BVA: past/today/future + EP: empty)
> PO Q3: block past date ✅ · PO Q4: required ✅

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC7-TC1 | Schedule form is open | Appoint Date = **15/06/2026 09:00** (yesterday) | Date in the past | All dates prior to the current date are disabled/greyed out in the calendar picker; yesterday cannot be selected |
| CAP-BC7-TC2 | Schedule form is open | Appoint Date = **16/06/2026 14:00** (today) | Today (boundary = equal) | Date field shows 16/06/2026 14:00 · no error · field accepts the value |
| CAP-BC7-TC3 | Schedule form is open | Appoint Date = **29/11/2026 16:00** (future) | Future date | Date field shows 29/11/2026 16:00 · no error · field accepts the value |
| CAP-BC7-TC4 | Schedule form is open | Do not enter Appoint Date → click Add | Appoint Date empty (required) | Display error toast "Error" · Appoint Date field shows error state |

### CAP-BC8 — Note (EP)
> PO Q5: Optional ✅

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC8-TC1 | Form open (Apt Type + Service + Date filled) | Note = "Customer requests a morning slot before 12:00" | Note filled | "Add" button active · Note saved with the appointment · (shown in detail/list) |
| CAP-BC8-TC2 | Form open (Apt Type + Service + Date filled) | Leave Note empty | Note empty (optional) | "Add" button active · Appointment created successfully without Note · no error on the Note field |

### CAP-BC9 — Add Appointment → Status Pending (State Transition: initial → Pending)

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC9-TC1 | Form fully filled: Apt Type="Maintenance", Service="General Maintenance", Date=29/11/2026 16:00, Note filled | Click the "Add" button | Add Appointment succeeds | Appointment created successfully · Redirect to Appointment List · Toast "Success" · new row: Appointment Type: Maintenance · Service Type: General Maintenance · Appoint Date: 29/11/2026 16:00 · Status: **"Pending"** · "Confirm" button + "Bin" icon on that row |

### CAP-BC10 & BC11 — Confirm Appointment (State Transition: Pending → Confirmed)
> PO Q7: Pending→Confirmed ✅ · PO Q8: Confirm button only on Pending ✅

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC10-TC1 | An appointment with Status = "Pending" is in the list | Click the "Confirm" button on that row | Confirm a Pending appointment | Status changes from "Pending" → **"Confirmed"** immediately in the list · "Confirm" button removed from that row · "Bin" icon removed from that row |
| CAP-BC10-TC2 | An appointment with Status = "Confirmed" exists | Look at the buttons on the row | Confirm a non-Pending appointment | row with Status = "Confirmed" has no "Confirm" button · no "Bin" icon |

### CAP-BC12 & BC13 — Delete Appointment (State Transition: Pending → Deleted)
> PO Q9: bin icon only on Pending · PO Q10: Confirmed cannot be deleted

| TC ID | Arrange (precondition) | Test Data / Action | Tested Condition | Expected Result |
|---|---|---|---|---|
| CAP-BC12-TC1 | An appointment with Status = "Pending" exists | Click the "Bin" icon (Delete) on that row | Delete a Pending appointment | Appointment deleted successfully · Redirect to Appointment List · Toast "Success" · that row disappears from the list |
| CAP-BC12-TC2 | An appointment with Status = "Confirmed" exists | Look at the buttons on the row | Delete a Confirmed appointment | row with Status = "Confirmed" has no "Bin" icon · cannot be deleted |

---

## Step 4 — Hidden Assumptions (Propose-and-Confirm)

> ✅ = closed (PO answered 12/06/2026, or confirmed from Grooming)

| Q | Topic | Status | Answer |
|---|---|---|---|
| Q1 | Appointment Type required? | ✅ Closed | Required |
| Q2 | Service Type required? | ✅ Closed | Required |
| Q3 | Appoint Date past date? | ✅ Closed | Block past date |
| Q4 | Appoint Date required? | ✅ Closed | Required |
| Q5 | Note optional? | ✅ Closed | Optional |
| Q6 | Empty-state text? | ✅ Closed | 'No results found.' |
| Q7 | Status after Confirm? | ✅ Closed | Pending → Confirmed |
| Q8 | Confirm button only on Pending? | ✅ Closed | Yes, Pending only |
| Q9 | Delete — is there a dialog? | ✅ Closed | bin icon only on Pending (no explicit dialog) |
| Q10 | Can Confirmed be deleted? | ✅ Closed | No (no bin icon) |
| Q11 | Real status names? | ✅ Closed (Grooming) | "Pending" / "Confirmed" |
| Q12 | Option values? | ✅ Closed | Per base export (Maintenance / General Maintenance / Oil Change …) |

> **No Hidden Assumptions remain open** — Design is ready for sign-off

---

## Step 5 — Test Scenarios (E2E Flow)

> Scenario IDs and names mirror the base export (File 2).

### ✅ Success

**`TS-01`** — User can successfully view customer appointment list
```
1. TS-01_TC-01 (CAP-BC1-TC1 → CAP-BC1-TC2)  Navigate to Contact list → display Customer List → View "Siriwimon Somjit"
2. TS-01_TC-02 (CAP-BC2-TC2 → CAP-BC3-TC1)  Click the "Appointment" tab → display Appointment List
→ Expected: Appointment List shown (Type / Service Type / Date / Note / Status)
```

---

**`TS-02`** — User can successfully adding customer appointment (Fill in all fields)
```
1. TS-02_TC-01 (CAP-BC1 → CAP-BC2-TC2 → CAP-BC3-TC1)  View Appointment List
2. TS-02_TC-02 (CAP-BC4-TC1)  Click "Schedule" → Schedule Appointment Form opens
3. TS-02_TC-03 (CAP-BC5-TC1 + BC6-TC1 + BC7-TC3 + BC8-TC1 + BC9-TC1)
   Fill all fields: Apt Type="Maintenance", Service="General Maintenance",
   Date=29/11/2026 16:00, Note filled → Click "Add"
→ Expected: created successfully · Redirect to list · Toast "Success" · new row Status = "Pending"
```

---

**`TS-03`** — User can successfully adding customer appointment without Note (optional)
```
1. TS-03_TC-01 (CAP-BC1 → CAP-BC2-TC2 → CAP-BC3-TC1 → CAP-BC4-TC1)  View → open Schedule form
2. TS-03_TC-02 (CAP-BC5-TC1 + BC6-TC1 + BC7-TC3 + CAP-BC8-TC2 + BC9-TC1)
   Fill required fields, leave Note empty → Click "Add"
→ Expected: Add succeeds without Note · Redirect to list · Toast "Success" · Status = "Pending"
```

---

**`TS-04`** — User can successfully confirm appointment (Pending → Confirmed)
```
1. TS-04_TC-01 (CAP-BC1 → CAP-BC2-TC2 → CAP-BC3-TC1)  View Appointment List → "Confirm" button shown for Pending
2. TS-04_TC-02 (CAP-BC10-TC1 + CAP-BC11)  Click "Confirm" → Status = "Confirmed"
→ Expected: Status "Confirmed" immediately · "Confirm" button + "Bin" icon hidden on that row
```

---

**`TS-05`** — User can successfully delete pending appointment
```
1. TS-05_TC-01 (CAP-BC1 → CAP-BC2-TC2 → CAP-BC3-TC1)  View Appointment List → "Bin" icon shown for Pending
2. TS-05_TC-02 (CAP-BC12-TC1 + CAP-BC13)  Click the "Bin" icon → removed from list
→ Expected: deleted successfully · Redirect to list · Toast "Success" · row removed
```

---

### ❌ Alternative

**`TA-01`** — Verify error toast when adding a customer appointment with empty required fields
```
1. TA-01_TC-01  View → open Schedule form (CAP-BC1 → BC2-TC2 → BC3-TC1 → BC4-TC1)
2. TA-01_TC-02 (CAP-BC5-TC2)  No Appointment Type selected → Click "Add" → Validation error toast
3. TA-01_TC-03 (CAP-BC6-TC2)  No Service Type selected → Click "Add" → Validation error toast
4. TA-01_TC-04 (CAP-BC7-TC4)  No Appoint Date entered → Click "Add" → Validation error toast
→ Expected: error toast "Error" on each missing required field
```

---

**`TA-02`** — Verify disabled in date picker when selecting appoint date in the past
```
1. TA-02_TC-01  View → open Schedule form (CAP-BC1 → BC2-TC2 → BC3-TC1 → BC4-TC1)
2. TA-02_TC-02 (CAP-BC7-TC1)  Enter Appoint Date = Yesterday → Disabled
→ Expected: all dates prior to the current date are disabled in the calendar picker
```

---

**`TA-03`** — Verify message "No results found." when customer has no appointment list
```
1. TA-03_TC-01 (CAP-BC1 → CAP-BC2-TC2 → CAP-BC3-TC2)
   View "Wannida Pongprai" (no appointment) → click the "Appointment" tab
→ Expected: Display message "No results found." · "Schedule" button still visible
```

---

## Step 6 — Definition of Done (Self-check)

- [x] Needs converted into Business Conditions (13 conditions)
- [x] All techniques present: EP / BVA / State Transition / Use Case
- [x] BVA: Appoint Date covers past / today / future + empty
- [x] State Transition: all paths (None→Pending, Pending→Confirmed, Pending→Deleted) + Confirmed has no action
- [x] Test Cases cover all 4 parts (Arrange / Test Data / Tested Condition / Expected)
- [x] Success Scenarios 5 flows (TS-01…TS-05) / Alternative Scenarios 3 flows (TA-01…TA-03)
- [x] No conflicting conditions across Scenarios
- [x] Test Data is Real Example (real names, real dates, no Test/placeholder); Arrange prepares a full Customer (all fields + Appointment List)
- [x] All Hidden Assumptions (Q1–Q12) closed
- [x] IDs tagged; Scenario IDs/names mirror the base export (File 2)
- [x] Updated from PO (12/06/2026): Required fields, block past date, status names, Confirm/Delete button logic
- [x] Translated to English + Arrange expanded to full Customer (15/06/2026)
- [x] Synced to base export (16/06/2026): "Schedule" button · Add/Back · "No results found." · TS-/TA- IDs · base option values
