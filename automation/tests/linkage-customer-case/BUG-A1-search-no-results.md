# BUG — A-1: Linked Existing search always returns "No results found."

**Found**: 2026-06-21 (QA env DOM probe)
**Affects**: Linked Existing modal → Search by Name / Mobile Number / Email
**Priority**: HIGH — blocks all search-dependent scenarios (TS-01_TC-02, TA-01, TA-02, TA-03)
**Side**: Frontend or Backend (TBD) — search request may not be sent correctly (FE), or the API returns empty regardless of input (BE); needs network-tab investigation to confirm which layer fails

## Symptoms

Any keyword typed in the search input and clicking "Search" returns an empty state ("No results found."),
regardless of whether matching customers exist in the system.

| Keyword type | Expected | Actual |
|---|---|---|
| Name — e.g. "Bulan" | Row with Bulan J | "No results found." |
| Mobile — e.g. "0899181632" | Row with Bulan J | "No results found." |
| Email — e.g. "bulan.jit@skyai.co.th" | Row with Bulan J | "No results found." |

The initial list (before any search) may or may not load — unconfirmed whether the default list renders correctly.

## Root Cause (unknown)

Not yet diagnosed. Likely a API query issue in the Linked Existing modal's search handler (wrong field mapping,
missing auth header on the search request, or search API not wired up on QA).

## Impact on Automation

The following tests are marked `test.fixme` until resolved:

- **TS-01_TC-02** — Search by Mobile Number → Select → link customer
- **TA-01_TC-01** — Search by Name
- **TA-02_TC-01** — Search by Mobile Number (non-dash)
- **TA-03_TC-01** — Search by Email
- **TA-07_TC-01** — Filter by Type (may be affected if list never loads)

## Fix Required (for dev team)

Investigate the search API call triggered by the "Search" button in the Linked Existing modal
(`/cms/case/creation`). Verify:
1. The request reaches the backend with the correct search payload
2. The response is correctly parsed and rendered into the table
3. Auth token is attached to the search request (not a CORS/401 issue)

## Verification

Once fixed, run `npm run test:linkage` with `CP_PASSWORD` set.
TA-04 (search with no results) should also be re-run to confirm the empty state still works correctly
after the fix.
