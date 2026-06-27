# BUG — A-2: "Clear Filters" button absent from Linked Existing modal

**Found**: 2026-06-21 (QA env DOM probe)
**Closed**: 2026-06-26 (re-probe confirmed button is present)
**Affects**: Linked Existing modal — Filter reset flow
**Priority**: MEDIUM
**Side**: Frontend

## Update (2026-06-26)

Re-probe with search input active ("zzzzzzz") confirms the **"Clear Filters" button IS present in DOM**
when a filter or search is active. It was absent in the 2026-06-21 probe likely because no filter was
applied at that moment (the button renders conditionally).

**Status: BUG-A2 (button absent) is CLOSED.**

`clearFiltersBtn = page.getByRole('button', { name: /Clear Filters/i })` has been restored to
`pages/LinkagePage.ts`.

## Remaining open question

Whether clicking "Clear Filters" correctly re-fetches the full customer list is **not yet verified**
(the original A-2 behavioral concern). This cannot be confirmed while defect A-1 (search broken)
makes list display unreliable. Re-test once A-1 is fixed.

---

## Original report (2026-06-21)

The test design (TA-05) and UX specification describe a "Clear Filters" button that resets the search
input and reloads the full customer list. The button was not found in the live DOM during the
2026-06-21 probe.

TA-05 was redesigned to use close + reopen modal as the reset mechanism instead.
