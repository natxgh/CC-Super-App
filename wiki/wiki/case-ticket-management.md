# Case & Ticket Management (CTM)

Feature: Case/Work Order lifecycle · Module 09
CMS Paths: `/cms/case/` + Assignment Board
Prefix: CTM (scenarios), AC/UC/DC/CC/LC/EN/HS (business conditions)
Standard term: **"Case"** (not "Work Order" — legacy term being corrected)

## Scope
- Add Case · Update Case · Delete Case (super admin only) · Close Case
- View Case Lifecycle · Update Workflow (Status) + Event Notification
- History / Table List / Search & Filter
- Assignment Board (Kanban)

## Create Case — Required Fields
| Field | Required |
|-------|---------|
| Types (Case Type) | ✅ |
| Contact Method | ✅ |
| Case Details | ✅ (max 4000 chars) |
| Service Center | ✅ |
| Request Schedule Date | Optional |
| Attach File | Optional (jpg/png only, max 1MB = 1024KB) |

## Case Type → Priority Mapping (Verified 2026-06-22)
Priority badge labels (PO Q15 — resolved 2026-06-25):
- 0 = **Critical Priority** (Red)
- 1–3 = **High Priority** (Red)
- 4–6 = **Medium Priority** (Yellow)
- 7–9 = **Low Priority** (Blue)

Example mappings:
| Code | Type | SubType | Priority | Badge |
|------|------|---------|---------|-------|
| 1002 | Camera Malfunction | Repair | 3 | High (Red) |
| 1001 | Camera Malfunction | Investigation | 4 | Medium (Yellow) |
| 2001 | Water Monitoring Devices | Investigation | 7 | Low (Blue) |
| 2004 | Water Monitoring Devices | Maintenance | 8 | Low (Blue) |

## Contact Method Options (6)
CALL / METTLINK / METTRIQ / IOT-Alert / Other

## Phone Auto-Link
- Phone ตรงกับ Customer Profile → right panel แสดงข้อมูล customer อัตโนมัติ
- ไม่พบ → แสดง "Link / Create" buttons

## Attach File Rules (PO Q9)
- Accept: jpg/png only · max 1MB (1024KB)
- Reject > 1MB: toast `File "XXXXX.jpg" is too large.`
- Non-image file: disabled this round, error `อัพโหลดไฟล์ไม่สำเร็จ: XXXXXX.avif`

## Case Lifecycle (6 Steps)
```
Received → Assigned → Acknowledged → En Route → On Site → Completed
```
- Advance via **Assign Staff button** on Case Assignment Detail (not Kanban drag)
- Role-based: Dispatcher assigns, Responder advances field steps
- No skip / no reverse

## Close Case Flow
1. On Site status → click **"Request close approval"** + attach closing photo
2. Status → "Pending Close Approval"
3. Approver clicks approve
4. Status → **Completed** · all 6 steps ✓

Close requires: **Result** (required) + Result Details (max 1000 chars)

## Delete Case
- **No UI delete point** for normal CMS users
- Hard delete = **Super admin only** (out of UI scope)

## Draft
- **Save As Draft** → stored in Case List under **"Draft"** filter
- Can be edited and cancelled from Draft state

## Event Notification (In-scope this round)
- Real-time in-app notification on Assignment Board
- Triggers: any workflow action
- Email/SMS/Push = Next Phase

## Search & Filter (History)
| Tool | Detail |
|------|--------|
| Keyword search | by Case Detail text — match / no-match |
| Select Status filter | filter by one status |
| Advanced Filters | Start/End Date (enforce Start ≤ End) · Type/SubType · Province/District · Created By |
| View toggle | Card / List |
| Empty state | "No entries to show" |

## Kanban (Assignment Board)
- Groups: New / Assigned / In-progress / Done
- Each case shows in column matching its status

## Bug Fixed
- **AC7 regression** (`null value in column "versions"` error on create) — **Fixed** per PO Q1

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| CTM_TS01 | Full lifecycle E2E (create → Completed) | ✅ |
| CTM_TS02 | Search/filter history | ✅ |
| CTM_TS03 | Update case while in-progress | ✅ |
| CTM_TS05 | Priority auto-set (all 6 distinct values) | ✅ |
| CTM_TA01 | Missing required field → blocked | ❌ |
| CTM_TA02 | Case Details > 4000 chars | ❌ |
| CTM_TA03 | File violates rules (too large / wrong type) | ❌ |
| CTM_TA04 | Regression — create then save (was broken) | ❌ |
| CTM_TA05 | Phone no match → prompt Link/Create | ❌ |
| CTM_TA06 | Cannot skip/reverse status | ❌ |
| CTM_TA07 | Close without Result → blocked | ❌ |
| CTM_TA08 | Advanced Filter Start > End → error | ❌ |
| CTM_TA09 | Search no match → empty state | ❌ |
| CTM_TA10 | Cannot delete (no permission) | ❌ |

## PO HAs (All Resolved)
Q1–Q14 resolved 2026-06-19 · Q15 resolved 2026-06-25

## Related Pages
- [Linkage Customer ↔ Case](linkage-customer-case.md)
- [Customer Profile](customer-profile.md)
- [Order Management](order-management.md)
- [CC Super App Overview](cc-super-app-overview.md)
