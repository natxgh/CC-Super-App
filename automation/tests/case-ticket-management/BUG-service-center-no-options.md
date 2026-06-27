# BUG — Service Center dropdown shows "No Option." on Case Creation form

**Found**: 2026-06-22 (QA env automation probe)
**Affects**: Case creation form (`/cms/case/creation`) — Service Center field
**Priority**: HIGH — blocks form submission even after all other required fields are filled

## Symptom

On the Case Creation form, the "Service Center" dropdown (trigger: `button[name="Select Service Center"]`) opens but shows "No Option." — no items to select.

Clicking "Submit" after filling in all other required fields (CaseType, ContactMethod, CaseDetail) silently does nothing — the form cannot be submitted without a Service Center value.

## Likely Cause

The creation form calls `GetListDepCommStn` to populate the Service Center dropdown. This query requires filter params (likely linked to the selected CaseType or user role) that the QA environment either doesn't have configured or returns an empty list for.

The API itself (`Query.Department.GetListDepCommStn`) is accessible and returns structure, but with no data on QA for the current test account/case type combination.

## Impact on Automation

- **TS-02** — UI case creation flow via "Submit" → BLOCKED (cannot submit without Service Center)
- `CasePage.selectServiceCenter()` cannot be tested until options appear
- `CasePage.confirmDialog()` / `confirmButton()` are unverified (Submit never reaches confirm modal)
- `serviceCenter` value in `testdata.ts` `NEW_CASE` is unverified placeholder

## Fix / Workaround

**For dev team**: Seed QA env with Service Center (`tbl_dep_comm_stn` or equivalent) data for Bangkok / BMA organization, or investigate why `GetListDepCommStn` returns empty for the CC agent role on QA.

**For automation**: Once options appear, update `NEW_CASE.serviceCenter` in `testdata.ts` with the real option text, and verify `CasePage.selectServiceCenter()` selector works.
