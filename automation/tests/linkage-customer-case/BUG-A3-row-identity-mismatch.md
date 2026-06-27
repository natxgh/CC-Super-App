# BUG — A-3: Linked customer identity does not match the selected row

**Found**: 2026-06-21 (QA env DOM probe)
**Affects**: Linked Existing modal → Select → Customer 360 panel
**Priority**: HIGH — core linkage logic is incorrect; wrong customer profile may be displayed
**Side**: Backend — linkage resolution uses phone number as the lookup key instead of the row's customer `id`; the BFF must be fixed to resolve by `id` passed from the row selection

## Symptoms

After clicking "Select" on a row in the Linked Existing modal, the Customer 360 panel shown in the
right rail does not consistently match the selected row's identity (name / phone / email).

Suspected cause: the same phone number is shared across multiple seeded customers in QA (junk data),
so the backend resolves by phone and may return a different profile than the row shown in the list.

| Step | Expected | Actual |
|---|---|---|
| Select row for "Vilailuk Maksuk" (0850020000) | 360 panel shows Vilailuk | 360 panel shows a different customer or mismatched data |
| Phone Number auto-fills | 0850020000 | may fill correctly but profile differs |

## Root Cause (suspected)

PO Q1 states: 1 phone number = 1 customer profile. If QA data has duplicate phone numbers across
profiles, the link resolution by phone may pick the wrong record. This is a **data + logic** issue:
- QA environment has dirty/duplicate phone data
- The linkage API resolves by phone rather than by the row's internal customer ID

## Impact on Automation

- **TA-08_TC-01** — "linked card identity matches selected row" — marked `test.fixme` until resolved.

## Fix Required

1. **Data cleanup**: purge duplicate phone numbers from QA. Automation teardown (`CP_TEARDOWN=1`) handles
   seeded customers; any pre-existing junk data must be cleaned manually.
2. **Backend fix**: linkage should resolve by customer `id` (passed from the row selection), not by phone number.
   Phone auto-fill on the case form is a side-effect of the link, not the link key.

## Verification

Once fixed:
1. Seed Vilailuk (unique phone 0850020000) → select her row → assert panel shows `Vilailuk Maksuk` + her email.
2. Lift `test.fixme` on TA-08.
