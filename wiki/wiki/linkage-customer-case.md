# Linkage Customer Profile with Case (LCP)

Feature: Link Case ↔ Customer by phone · Module 10
Entry Point: `/cms/case/creation` (Add Case page — right panel)
Prefix: LE (Linked Existing) / AC (Add Customer from Case page)
Test Account: `ketwadee` · Role: All Permission - Contact/Case Management

## Scope

| Code | Feature |
|------|---------|
| LE | Link an existing customer to a case (search + select) |
| AC | Quick-create new customer profile from Add Case page |

## LE — Link Existing Customer

### Flow
1. Click **"Linked Existing"** → modal opens with full customer list
2. Search by Name / Mobile Number / Email (non-dash format only — `0850020000`)
3. Filter by Type (Bronze / Silver / Gold / Platinum / N/A)
4. Click **"Select"** on a row → modal closes, right panel + case Phone Number auto-fill

### After Linking
- Right panel shows: avatar · name · DOB · Email · Phone · Customer Grade
- Case "Phone Number" field auto-fills with customer's number (editable by agent)
- **"View Full Profile"** button appears → opens Modal with full customer profile

### Customer 360 Panel Tabs
Profile · History · Note · Appointment · Product · Service
- Profile tab: Contact Channels (Phone Primary badge, verified ✓)
- History tab: empty = "No results found."
- Appointment tab: "+ Add" button + Upcoming/Confirm counts

### Re-link (Replace)
- Open Linked Existing again → Select a different customer
- Panel + Phone Number field replace with new customer (link by phone number)

## AC — Quick-Create Customer from Case

### Fields (Intentionally minimal — PO Q8)
| Field | Required |
|-------|---------|
| Email | ✅ |
| Phone | ✅ |
| First Name | Optional |
| Last Name | Optional |

### Rules
| Rule | Detail |
|------|--------|
| Email format | Must be valid (`a@b.c`) |
| Duplicate phone | Block + error (exact text TBC) |
| Duplicate email | Block + error (exact text TBC) |
| Save success | Auto-link immediately → panel populates + case Phone fills |
| Inline validation | "Please enter an email address" / "Please enter a mobile number" |

## Phone Search Format (PO Q7)
- Non-dash format only: `0850020000` ✅
- Dash format: `085-002-0000` ❌ (should be rejected)

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| TS-01 | Link existing customer (search → select → Customer 360) | ✅ |
| TS-02 | Add new customer from case page → auto-link | ✅ |
| TS-03 | Re-select customer (replace link) | ✅ |
| TA-01 | Search by Name | ❌ (⚠️ defect A-1) |
| TA-02 | Search by Mobile (non-dash) | ❌ (⚠️ A-1) |
| TA-03 | Search by Email | ❌ (⚠️ A-1) |
| TA-04 | Search no match → "No results found." | ❌ |
| TA-05 | Clear Filters restores list | ❌ (⚠️ A-2) |
| TA-07 | Filter by Type | ❌ |
| TA-10 | Empty Email → "Please enter an email address" | ❌ |
| TA-11 | Empty Phone → "Please enter a mobile number" | ❌ |
| TA-13 | Invalid email format | ❌ |
| TA-14 | Duplicate phone → blocked | ❌ |
| TA-15 | Duplicate email → blocked | ❌ |

## Open Defects (Gate Sign-off)
| ID | Bug |
|----|-----|
| A-1 | **Search broken** — ค้นหาแล้วขึ้น "No results found." แทนที่จะแสดงผล |
| A-2 | **Clear Filters ไม่ re-fetch** — หลัง Clear ยังคง "No results found." อยู่ |
| A-4 | **Reopen modal hangs on loading** — เปิด Linked Existing modal ซ้ำ = ค้าง |
| A-3 | List-row identity mismatch (data integrity — clear junk data before SIT) |

## PO Answers Applied (19/06/2026)
All Q1–Q10 answered. No pending HAs.

## Related Pages
- [Case & Ticket Management](case-ticket-management.md)
- [Customer Profile](customer-profile.md)
- [CC Super App Overview](cc-super-app-overview.md)
