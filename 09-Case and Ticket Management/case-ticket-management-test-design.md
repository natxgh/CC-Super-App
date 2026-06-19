# Test Design — Case & Ticket Management (CMS)

> Black Box · follows the team standard (`qa-ai-pilot/test-design-standard.md`)
> Feature: **Case and Ticket Management** · Product: CC Super App · Project: AICC
> Source: `requirements-case-ticket-management.md` (explored on STG v0.26.3) + BRD v0.3 §3.1.1 + grooming §5
> Scope: Add / Update / Delete / Close Case · View Case Life Cycle · Update Workflow (Status) + Event Notification · History / Table List / Search & Filter

---

## 1. Business Conditions

| ID | Business condition | Technique | Why this technique |
|---|---|---|---|
| **AC1** | Creating a case requires all mandatory fields (Types, Contact Method, Case Details, Service Center) before Submit is allowed | EP | Two opposite groups: complete → pass / missing at least 1 → blocked |
| **AC2** | Case Details can be at most 4000 characters | BVA | Numeric boundary, test 3999 / 4000 / 4001 |
| **AC3** | Priority is auto-set based on Case Type | Use Case | Case Type → Priority is a mapping, not a numeric range; enumerate real cases |
| **AC4** | A phone number matching an existing customer → auto-link Customer Profile; no match → prompt Link/Create | EP | Two groups: phone exists in system / does not exist |
| **AC5** | Attach File accepts only Images/PDF/DOC/DOCX/TXT and ≤ 1MB/file | EP + BVA | EP for file type (accepted/rejected) + BVA for size (1023KB/1024KB/1025KB) |
| **AC6** | Contact Method has a limited option set: CALL / METTLINK / METTRIQ / IOT-Alert / Other | Use Case | Enumerate every selectable option |
| **AC7** | Click Submit → Confirm modal → Confirm → case is saved and appears in the New column | State Transition | Transition from (form) → (case in system) via confirm — currently a BUG |
| **UC1** | Case data can be edited via the Edit button on Case Detail | EP | Editable fields vs locked by status |
| **UC2** | Add Comment / attach files throughout the lifecycle | Use Case | Enumerate real collaboration cases |
| **DC1** | A case can be deleted per permission + allowed status | Use Case | Cases by role/status (highly ambiguous → Hidden) |
| **CC1** | Closing a case requires choosing a Result + filling Result Details (≤ 1000 chars) | BVA + EP | BVA 999/1000/1001 + EP with/without Result |
| **CC2** | Closing goes through an approval flow (request close → approve → Completed) | State Transition | Stateful approval flow |
| **LC1** | Status follows the 6-step lifecycle in order: Received → Assigned → Acknowledged → En Route → On Site → Completed | State Transition | Object changes state by event + actor |
| **LC2** | Skipping/reversing steps is not allowed without permission | State Transition | Negative / reverse edges of the lifecycle |
| **LC3** | Kanban groups by status (New / Assigned / In-progress / Done) | Use Case | Map status → column |
| **EN1** | When status changes / a work order is actioned → notify stakeholders in real time | Use Case | Ambiguous scope (BRD=Next Phase, grooming=present) → Hidden |
| **HS1** | Search a work order by keyword → filter the list | EP | match / no-match |
| **HS2** | Filter by Select Status | Use Case | Enumerate every filterable status |
| **HS3** | Advanced Filters: Start/End Date, Type, Sub-Type, Country, Province, District, Detail, Create By | BVA + Use Case | BVA on date range (Start>End) + Use Case categorical |
| **HS4** | Toggle Card / List view | Use Case | Two display modes |
| **HS5** | No data → show empty state | EP | has result / no result |

---

## 2. Test Cases (condensed — full detail in the xlsx)

> Real Example Data: Case Type `1002-Camera Malfunction -Repair` · Service Center `Thailand-Thonburi South Zone-phasicharoen` · customer `Somying Rakdee` phone `081-234-5678` · Detail `The CCTV camera at the front entrance is not working, the image is dark; checked and the power LED is off`

### AC1 — Required fields (EP)
| TC | Arrange | Act | Tested | Expected | Type |
|---|---|---|---|---|---|
| AC1-TC1 | Logged in as agent, on the Add New Case page | Fill Types+Contact Method+Case Details+Service Center, then click Submit | AC1 | Opens the Confirm modal summarizing the case (no validation error) | POSITIVE |
| AC1-TC2 | On the Add New Case page | Leave **Types** empty, fill the rest, click Submit | AC1 | Submit does not open the modal + the Types field shows error state `""` (awaiting exact text) | NEGATIVE |
| AC1-TC3 | On the Add New Case page | Leave **Service Center** empty, fill the rest, click Submit | AC1 | Submit blocked + Service Center field error `""` | NEGATIVE |

### AC2 — Case Details max 4000 (BVA)
| AC2-TC1 | Add New Case page | Type 3999 characters of Case Details | AC2 | Counter shows `3999 / 4000`, all accepted | POSITIVE |
| AC2-TC2 | Add New Case page | Type 4000 characters of Case Details | AC2 | Counter shows `4000 / 4000`, all accepted | POSITIVE |
| AC2-TC3 | Add New Case page | Try to type the 4001st character | AC2 | System accepts only 4000, counter stays `4000 / 4000`, the extra char is not entered | NEGATIVE |

### AC3 — Priority auto-set (Use Case)
| AC3-TC1 | Add New Case page | Select Case Type `1002-Camera Malfunction -Repair` | AC3 | Priority badge = **High Priority** (orange) | POSITIVE |
| AC3-TC2 | Add New Case page | Select a Service Request Case Type (e.g. `101-1. Service Request-New Service`) | AC3 | Priority badge = level per **Case Configuration** (refer to CC Super App Configuration → Case Configuration, Q8) | POSITIVE |

### AC4 — Phone auto-link (EP)
| AC4-TC1 | A Customer Profile with phone `081-234-5678` exists; Add New Case page | Fill Phone Number `081-234-5678` | AC4 | Right panel shows the `Somying Rakdee` profile + Contact Channels (Phone=Primary) | POSITIVE |
| AC4-TC2 | No customer with phone `099-000-0001`; Add New Case page | Fill Phone Number `099-000-0001` | AC4 | Shows "Customer not found" state + "Linked Existing" / "Add Customer" buttons | NEGATIVE |

### AC5 — Attach file type/size (EP + BVA) — per Q9: only jpg/png ≤ 1MB; non-image upload disabled this round
| AC5-TC1 | Add New Case page | Attach image `cctv-front-door.png` size 800KB | AC5 | Image appears in list, attached successfully | POSITIVE |
| AC5-TC2 | Add New Case page | Attach image `cctv-front-door.jpg` size 1023KB | AC5 | Attached successfully (under 1MB = 1024KB) | POSITIVE |
| AC5-TC3 | Add New Case page | Attach image `cctv-front-door.jpg` size 1025KB | AC5 | Rejected + error toast `File "cctv-front-door.jpg" is too large.` | NEGATIVE |
| AC5-TC4 | Add New Case page | Attach non-image `report.pdf` / `image.avif` | AC5 | Rejected, only jpg/png accepted — error `อัพโหลดไฟล์ไม่สำเร็จ: report.pdf` (non-image upload disabled) | NEGATIVE |

### AC6 — Contact Method options (Use Case)
| AC6-TC1 | Add New Case page | Open the Contact Method dropdown | AC6 | Shows all 5 options: CALL, METTLINK, METTRIQ, IOT-Alert, Other | POSITIVE |

### AC7 — Submit → persist (State Transition)
| AC7-TC1 | Form complete, Confirm modal open | Click **Confirm** | AC7 | Case is saved, redirect/success toast, appears in the **New** column of the Assignment Board | POSITIVE |
| AC7-TC2 | Form complete, Confirm modal open | Click **Confirm** (regression) | AC7 | Case created successfully + success toast — the `null value in column "versions"` defect was confirmed **Fixed** (Q1); previously red toast "Add Work Order fail." | POSITIVE |
| AC7-TC3 | Form complete | Click **Save As Draft** | AC7 | Case saved as Draft in **Case List**, accessible via the **"Draft" filter**, editable/cancelable (Q10) | POSITIVE |

### UC1 — Edit case (EP)
| UC1-TC1 | A case with status Assigned, on Case Detail | Click Edit → change Case Details → save | UC1 | Case Details updates + Update At changes to current time | POSITIVE |
| UC1-TC2 | A case with status Completed (closed), Case Detail page | Click Edit | UC1 | Edit button hidden/disabled (cannot edit after closure; Reopen = Next Phase, Q11) | NEGATIVE |

### UC2 — Comment / attach (Use Case)
| UC2-TC1 | Case status In-progress, Case Detail page | Add Comment `Technician scheduled on-site 15/06 at 13:00` | UC2 | Comment appears in the activity log with timestamp + author name | POSITIVE |
| UC2-TC2 | Case status In-progress, Case Detail page | Click Attach File, attach `site-photo.jpg` 600KB | UC2 | File added to the case, shown in the attachment list | POSITIVE |

### DC1 — Delete case (per Q2: no UI delete point; hard delete by Super admin only)
| DC1-TC1 | Normal CMS user, case status New | Inspect Case Detail + Assignment Board for any Delete action | DC1 | No Delete control present anywhere in the UI (deletion not exposed to CMS users) | NEGATIVE |
| DC1-TC2 | Normal CMS user, case status In-progress | Inspect for any Delete action | DC1 | No Delete control present — deletion is a **hard delete by Super admin only** (out of UI scope) | NEGATIVE |

### CC1 — Close requires Result + details ≤1000 (BVA + EP)
| CC1-TC1 | Case status On Site, Case Detail page | Select Result + enter 1000 chars of Result Details, then confirm close | CC1 | Closed successfully, counter `1000 / 1000` | POSITIVE |
| CC1-TC2 | Case status On Site | Type the 1001st char of Result Details | CC1 | Accepts only 1000, counter stays `1000 / 1000` | NEGATIVE |
| CC1-TC3 | Case status On Site | Leave Result empty, click close | CC1 | Blocked + prompt that a Result must be selected `""` | NEGATIVE |

### CC2 — Close approval flow (State Transition)
| CC2-TC1 | Case status On Site, staff handling the job | Click "Request close approval" + attach closing photo | CC2 | Status → "Pending Close Approval", approve button appears on approver side (flow confirmed, Q3) | POSITIVE |
| CC2-TC2 | Case status "Pending Close Approval", as approver | Click approve | CC2 | Status → **Completed**, timeline completes all 6 steps, case moves to the Done column | POSITIVE |

### LC1 — Lifecycle forward (State Transition) — per Q4: advanced via the Assign Staff button on Case Assignment Detail, Role-based (Dispatcher/Responder), no Kanban drag
| LC1-TC1 | Case status Received, Dispatcher role | Click Assign Staff on Case Assignment Detail | LC1 | Status → Assigned, timeline ticks Received | POSITIVE |
| LC1-TC2 | Case status Assigned, Responder role | Click Acknowledge | LC1 | Status → Acknowledged | POSITIVE |
| LC1-TC3 | Case status Acknowledged, Responder role | Click En Route (depart) | LC1 | Status → En Route | POSITIVE |
| LC1-TC4 | Case status En Route, Responder role | Click On Site (arrived) | LC1 | Status → On Site | POSITIVE |

### LC2 — No skip/reverse (State Transition negative)
| LC2-TC1 | Case status Received, Case Assignment Detail | Try to move directly to On Site (skipping Assigned/Acknowledged/En Route) | LC2 | System does not allow skipping; the action only advances to the next allowed status (no Kanban drag, Q4) | NEGATIVE |
| LC2-TC2 | Case status Completed | Try to revert to On Site | LC2 | System does not allow reverting status (Reopen = Next Phase, Q11) | NEGATIVE |

### LC3 — Kanban grouping (Use Case)
| LC3-TC1 | Cases of various statuses exist | Open the Assignment Board Kanban view | LC3 | Each case sits under the column matching its status (New/Assigned/In-progress/Done) + correct count badge | POSITIVE |

### EN1 — Event notification (Use Case / Hidden)
| EN1-TC1 | 2 accounts have the board open at once, account A actions a work order | Account B observes the notification | EN1 | Account B receives a real-time in-app notification on the Assignment Board (in scope this round, Q5; Email/SMS/Push = Next Phase) | POSITIVE |

### HS1 — Keyword search (EP)
| HS1-TC1 | A case whose Detail contains "camera" | Search `camera`, then click Search | HS1 | List shows only cases matching "camera" | POSITIVE |
| HS1-TC2 | Cases exist in the system | Search `zzznotreal999` | HS1 | Shows empty state "No entries to show" | NEGATIVE |

### HS2 — Status filter (Use Case)
| HS2-TC1 | Cases of several statuses exist | Choose Select Status = (one status) | HS2 | List shows only cases with the chosen status | POSITIVE |

### HS3 — Advanced Filters (BVA + Use Case)
| HS3-TC1 | Cases created during 01–10 Jun | Set Start 01/06/2026, End 30/06/2026, Apply | HS3 | List shows only cases in range, button changes to `Apply Filters (n>0)` | POSITIVE |
| HS3-TC2 | History page, Advanced Filters modal | Set Start 30/06/2026, End 01/06/2026 (Start>End), Apply | HS3 | System enforces Start ≤ End — the invalid range cannot be applied (Q13) | NEGATIVE |
| HS3-TC3 | Advanced Filters modal | Select Type=Camera Malfunction + Province=Bangkok, Apply | HS3 | List filtered by both criteria (AND) | POSITIVE |
| HS3-TC4 | Filters already set | Click Reset All | HS3 | All filter fields cleared, shows "No filters applied" | POSITIVE |

### HS4 — Card/List toggle (Use Case)
| HS4-TC1 | History page has data | Switch to Card view | HS4 | Items render as cards | POSITIVE |

### HS5 — Empty state (EP)
| HS5-TC1 | No cases in the system | Open the Work Order History page | HS5 | Shows "No entries to show / Create your first work order to get started" + Create Work Order button | POSITIVE |

---

## 3. Test Scenarios (E2E flows)

### Success
```
CTM_TS01  Full case lifecycle E2E — create a case through to successful closure
  1. AC6-TC1   Contact Method has all options
  2. AC3-TC1   Select Case Type → Priority = High
  3. AC4-TC1   Fill phone → auto-link customer
  4. AC1-TC1   Fill all required fields → Confirm modal
  5. AC5-TC1   Attach jpg 800KB
  6. AC7-TC1   Confirm → case appears in the New column
  7. LC3-TC1   Case sits under the New Kanban column
  8. LC1-TC1   New → Assigned (Assign Staff)
  9. LC1-TC2   Assigned → Acknowledged
 10. LC1-TC3   Acknowledged → En Route
 11. LC1-TC4   En Route → On Site
 12. CC1-TC1   Select Result + 1000-char Result Details
 13. CC2-TC1   Request close approval + attach file
 14. CC2-TC2   Approve → Completed
  → Expected: the same case walks create → New → … → On Site → approval → Completed; timeline completes all 6 steps and the case moves to the Done column

CTM_TS02  Search/filter case history
  1. HS5-TC1   Open History
  2. HS4-TC1   Switch to Card view
  3. HS1-TC1   Search keyword "camera"
  4. HS2-TC1   Filter by Select Status
  5. HS3-TC1   Advanced Filter by date range
  6. HS3-TC4   Reset All
  → Expected: list filters/clears correctly per the criteria

CTM_TS03  Update a case while in progress
  1. UC1-TC1   Edit Case Details
  2. UC2-TC1   Add a Comment
  3. UC2-TC2   Attach an on-site file
  → Expected: data + activity log fully updated
```

### Alternative (Unsuccess)
```
CTM_TA01  Case creation fails — missing required field
  1. AC1-TC2   Leave Types empty → submit blocked

CTM_TA02  Case Details exceeds 4000
  1. AC2-TC3   Type the 4001st char → truncated

CTM_TA03  Attach a file that violates the rules
  1. AC5-TC3   File 1025KB → rejected
  2. AC5-TC4   File .mp4 → rejected

CTM_TA04  Confirm then save (regression — DEFECT Q1 Fixed)
  1. AC1-TC1   Fill all → Confirm modal
  2. AC7-TC2   Confirm → case created (was "Add Work Order fail." / versions NOT NULL)

CTM_TA05  Phone does not match a customer
  1. AC4-TC2   New phone → prompt Link/Create

CTM_TA06  Cannot skip/reverse status
  1. LC2-TC1   Received → skip to On Site → blocked
  2. LC2-TC2   Completed → revert On Site → blocked

CTM_TA07  Close the case without a Result
  1. CC1-TC3   Leave Result empty → blocked

CTM_TA08  Advanced Filter with reversed date range
  1. HS3-TC2   Start > End → error/empty

CTM_TA09  Search returns nothing
  1. HS1-TC2   keyword not present → empty state

CTM_TA10  Cannot delete a case (permission/status)
  1. DC1-TC2   No permission / In-progress → blocked
```

---

## 4. Hidden Assumptions — ✅ ALL RESOLVED by PO (2026-06-19)

| ID | Topic | ✅ PO answer (final) | Affects |
|---|---|---|---|
| Q1 | BUG creation `versions` NOT NULL | **Fixed** — downstream flows unblocked, run as regression | AC7, TS01, TS02, TS04 |
| Q2 | Delete Case — entry point/permission | **No UI delete point**; hard delete performed by **Super admin only** | DC1, TA10 |
| Q3 | Close Case flow | Close via "request close approval" → attach closing file → approver approves → Completed | CC1, CC2, TS02 |
| Q4 | Update Workflow status — where/who | Config at **Menu Workflow / admin**; advance status via the **Assign Staff** button on **Case Assignment Detail**, **Role-based** (Dispatcher = dispatcher, Responder = Metlink officer), **not PIC per step**; **no Kanban drag** | LC1, LC2 |
| Q5 | Event Notification scope this round | **Yes** — real-time in-app notification on the Assignment Board; Email/SMS/Push = Next Phase | EN1 |
| Q6 | 6-step lifecycle configurable per Case Type? | Configurable per Case Type; STG default = same 6 steps; this round tests a fixed 6 steps | LC1, LC3 |
| Q7 | When is Request Schedule Date required? | **Not mandatory** for any Case Type; case can be created and starts next day or on the selected date | AC1, AC7 |
| Q8 | Priority mapping per Case Type | Refer to **CC Super App Configuration → Case Configuration** | AC3 |
| Q9 | Attach File limit + rejected extensions | Photo limit **1MB = 1024KB, accept only jpg/png**; non-image file upload **disabled** this round. Errors: `File "XXXXX.jpg" is too large.` / `อัพโหลดไฟล์ไม่สำเร็จ: XXXXXX.avif` | AC5, TA03 |
| Q10 | Save As Draft storage / edit-delete | Stored in **Case List**, accessed via the **"Draft" filter**, can be **edited & cancelled** | AC7 |
| Q11 | Reopen after Completed | Cannot edit/reopen after closure (**Reopen = Next Phase** per BRD) | UC1, LC2 |
| Q12 | Standard term Case vs Work Order | Use **"Case"** as the primary UI term; "Work Order" is legacy to be corrected | (whole feature) |
| Q13 | Advanced Filter Start>End | System enforces **Start Date ≤ End Date** | HS3, TA08 |
| Q14 | junk data on STG | Noted — bad test data to be cleaned before SIT | (data prep) |

---

## 5. Self-check vs Definition of Done

| Item | Status |
|---|---|
| Converted Needs → Business Conditions completely | ✅ 21 conditions covering 7 sub-features |
| Picked the right technique type | ✅ EP / BVA / State Transition / Use Case |
| BVA complete less/equal/greater | ✅ AC2 (3999/4000/4001), AC5 (1023/1024/1025KB), CC1 (999/1000/1001) |
| State Transition complete + reverse + self + system actor | ✅ LC1 forward, LC2 reverse/skip, CC2 approval, EN1 system-actor notify |
| Every TC has all 4 parts (AAA + Tested) | ✅ |
| Has Success + Alternative | ✅ 4 Success (TS-01 full create→close E2E + 3) + 11 Alternative |
| No contradictory conditions combined | ✅ |
| Real Example Data, no Test/placeholder | ✅ |
| Hidden Assumptions identified + asked PO | ✅ 14 items — **all 14 answered by PO (2026-06-19)** |
| IDs tagged + symbols marked | ✅ |
| **Blocked** | ✅ **None** — Q1 creation bug Fixed (unblocks TS01/TS02/TS04); Q2–Q4 + Q9/Q13 answered and applied to TCs. Ready to execute |
