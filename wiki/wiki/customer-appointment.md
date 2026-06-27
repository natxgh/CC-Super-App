# Customer Appointment (CAP)

Feature: Customer Appointment Management · Module 02
Entry Point: Customer Profile Detail → "Appointment" tab
Test Account: `ketwadee` · Role: All Permission - Appointment Management

## UI Labels (Confirmed via Grooming 11/06/2026)
- Open form button: **"Schedule"**
- Form submit button: **"Add"**
- Cancel / back button: **"Back"**
- Empty state text: **"No results found."**

## Fields (Schedule Appointment Form)
| Field | Required | Values |
|-------|----------|--------|
| Appointment Type | ✅ | Present / Follow Up / Maintenance |
| Service Type | ✅ | Advise product / Installation / General Maintenance / Oil Change |
| Appoint Date | ✅ | Past dates disabled · Format: `mm/dd/yyyy hh:mm` (US order ⚠️) |
| Note | Optional | free text |

## Status Lifecycle
```
[No appointment]
    │ Fill form + click "Add"
    ▼
[Pending]  ── click "Confirm" ──► [Confirmed]
    │                                  │
    │ click bin icon (Delete)      No Delete button
    ▼
[Deleted — removed from list]
```
- **Confirm** button: ปรากฏเฉพาะ row ที่ Status = "Pending"
- **Bin icon**: ปรากฏเฉพาะ row ที่ Status = "Pending"
- **Confirmed**: ลบไม่ได้ (ไม่มี bin icon)

## Toast Messages (Confirmed)
| Action | EN | TH |
|--------|----|----|
| Add success | **"Success"** | **"สำเร็จ"** |
| Delete success | **"Success"** | **"สำเร็จ"** |
| Validation error (missing required) | **"Error"** | **"เกิดข้อผิดพลาด"** |

## Appointment Date Rule (BVA)
| Date | Expected |
|------|----------|
| Past | Disabled in calendar — cannot select |
| Today (boundary) | ✅ Valid |
| Future | ✅ Valid |
| Empty | Error toast **"Error"** |

## Known Bug
- **Appoint Date field** uses `mm/dd/yyyy` format (US month-first) — not `dd/mm/yyyy` as Thai convention · confirm with Dev/PO

## UI Bug (Confirmed 17/06/2026)
- "Appointment Type" field แสดง placeholder *"Search Service Type."*
- "Service Type" field แสดง placeholder *"Search Appointment Type."*
- → **placeholder ถูก swap** — flag to Dev

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| TS-01 | View appointment list | ✅ |
| TS-02 | Add appointment (fill all fields) | ✅ |
| TS-03 | Add appointment without Note (optional) | ✅ |
| TS-04 | Confirm appointment (Pending → Confirmed) | ✅ |
| TS-05 | Delete pending appointment | ✅ |
| TA-01 | Empty required fields → validation error | ❌ |
| TA-02 | Past date → disabled in datepicker | ❌ |
| TA-03 | No appointments → "No results found." | ❌ |
| TA-04 | API failure → error message (⚠️ Q13 TBC) | ❌ blocked |

## Open HAs
- Q13: UI message เมื่อ Appointment API fail (500/504/404) — **TBC** — blocks TA-04

## PO Answers Applied (12/06/2026)
All Q1–Q12 closed. Key answers:
- Q3: Block past date
- Q9: bin icon on Pending only (no explicit dialog)
- Q10: Confirmed ลบไม่ได้

## Related Pages
- [Customer Profile](customer-profile.md)
- [CC Super App Overview](cc-super-app-overview.md)
