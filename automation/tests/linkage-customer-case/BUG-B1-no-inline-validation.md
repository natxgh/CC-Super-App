# BUG — B-1: Add Customer form has no inline field validation

**Found**: 2026-06-21 (QA env DOM probe / design review)
**Affects**: Add Customer quick-create modal — required field validation
**Priority**: MEDIUM — UX requirement (PO Q4) not implemented; only a generic toast appears on save
**Side**: Frontend — client-side form validation not wired up; field-level error messages not rendered

## Symptoms

When submitting the Add Customer form with invalid or empty required fields, no inline error messages
appear under the individual fields. Instead, a generic toast notification fires (or no feedback at all).

| Scenario | Expected (PO Q4) | Actual |
|---|---|---|
| Save with empty Email | Inline: "Please enter an email address" | Generic toast only |
| Save with empty Phone | Inline: "Please enter a mobile number" | Generic toast only |
| Save with both empty | Both inline messages visible | Generic toast only |
| Save with invalid email format | Inline: "Invalid email address format" | Generic toast only (copy TBC) |

## Root Cause

Frontend validation on the Add Customer form is not wired up. The form likely submits to the API
without client-side validation and relies on a catch-all error toast.

## Impact on Automation

The following tests are marked `test.fixme` until inline validation is implemented:

- **TA-10_TC-01** — empty Email
- **TA-11_TC-01** — empty Phone
- **TA-12_TC-01** — both empty
- **TA-13_TC-01** — invalid email format (also needs exact copy confirmed with PO/Dev)

`validationMsg(text)` in `LinkagePage.ts` is ready; it will find inline messages once implemented.

## Fix Required (for dev team)

Add client-side validation to the Add Customer modal form:
1. Mark Email and Phone as required; show inline error on blur/submit if empty.
2. Validate email format (regex); show inline error if invalid.
3. Error copy (confirm with PO):
   - Empty email → `"Please enter an email address"`
   - Empty phone → `"Please enter a mobile number"`
   - Invalid email → `"Invalid email address format"` *(exact copy TBC)*

## Verification

Once implemented:
1. Confirm inline message text with PO/Dev — update `MSG_INVALID_EMAIL` in `fixtures/testdata.ts` if different.
2. Lift `test.fixme` on TA-10 / TA-11 / TA-12 / TA-13.
