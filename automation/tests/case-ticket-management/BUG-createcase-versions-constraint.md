# BUG — CreateCase API broken: `versions` NOT NULL constraint vs. BFF 500 crash

**Found**: 2026-06-22 (QA env automation probe)
**Affects**: All case creation — both UI and API — on QA environment
**Priority**: CRITICAL — blocks entire Case and Ticket Management module from being tested

## Symptoms

| Attempt | Response |
|---|---|
| `CreateCase` without `versions` field (mirrors UI payload) | `status: "-1"`, error: DB NOT NULL constraint on `tix_cases.versions` |
| `CreateCase` with `versions: "1"` | HTTP 500 (BFF server crash, Go unhandled exception) |
| `CreateCase` with `versions: "draft"` | HTTP 500 (BFF server crash) |
| UI "Submit" or "Save As Draft" buttons | Same `-1` error — UI also doesn't send `versions` |

## Root Cause

The database table `tix_cases` has a `versions` column defined as `NOT NULL` with no `DEFAULT` value.

- BFF `CreateCase` resolver does not set `versions` on insert → DB constraint fires
- When `versions` is provided externally in `CaseInsertInput`, the Go BFF resolver crashes with HTTP 500 (likely type mismatch or field not mapped in resolver)
- Both the BFF and UI code paths are affected — neither sends `versions`

## Impact on Automation

All tests that depend on seeded or newly created cases are blocked:

- **TS-01** — Full lifecycle E2E (New → Dispatch → Acknowledge → On Site → Done)
- **TS-03** — Edit case details
- **TS-04** — Close approval flow
- **Case Assignment Board** — 0 cases in all 4 columns (New/Assigned/In-progress/Done)
- Cannot probe Case Detail page UI (no cards to click)

These tests are marked `test.fixme` until this bug is resolved.

## Fix Required (for dev team)

Either:
1. Add a default to the DB column: `ALTER TABLE tix_cases ALTER COLUMN versions SET DEFAULT '1';`
2. OR fix the BFF `CreateCase` resolver to set `versions = '1'` (or appropriate initial value) on every insert
3. AND ensure `CaseInsertInput` either ignores or correctly maps the `versions` field when provided

## Verification

Once fixed, run `node automation/probeI.mjs` — a successful `CreateCase` returns `{ status: "0", caseId: "<id>" }`. The probe script seeds, navigates to the Assignment Board, captures the Case Detail DOM, and cleans up via `DeleteCase`.
