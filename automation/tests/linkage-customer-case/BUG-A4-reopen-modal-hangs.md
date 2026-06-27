# BUG — A-4: Reopening the "Linked Existing" modal hangs on loading

**Found**: 2026-06-21 (QA env DOM probe)
**Affects**: Linked Existing modal — second open (re-select flow)
**Priority**: HIGH — blocks changing the linked customer after an initial selection
**Side**: Frontend — modal component does not reset its data-fetch lifecycle on second mount; React state/ref leaks between opens

## Symptoms

The first open of the Linked Existing modal works (modal appears, search input visible).
Closing the modal (Escape or ✕) and clicking "Linked Existing" again causes the modal to open
but remain stuck in a loading/spinner state indefinitely — the search input and customer list never appear.

| Attempt | Result |
|---|---|
| First open of modal | ✅ Modal loads normally |
| Close (Escape) + reopen | ⏳ Modal opens but hangs — no content, loading state persists |
| Hard reload page + open | ✅ Modal loads normally again |

## Root Cause (unknown)

Not yet diagnosed. Likely a state management issue — the modal's data-fetch lifecycle does not reset
correctly on second mount. Possible causes:
- The search query result is cached/aborted and not re-triggered on reopen
- A React state or ref from the first open is not cleaned up on unmount, preventing re-fetch

## Impact on Automation

- **TS-03_TC-02** — "Change the linked customer (re-select to replace)" — entire scenario blocked.
- **TA-05_TC-01** — "Close + reopen resets search state" — blocked (redesigned from Clear Filters flow).

Both marked `test.fixme` until resolved.

## Fix Required (for dev team)

Ensure the modal's data-fetching lifecycle fully resets on every open:
1. Reset search state (keyword, filter, results) on `onOpen` / mount
2. Re-trigger the initial list fetch on every open (not only on first mount)
3. Confirm the modal unmounts cleanly so React state does not leak between opens

## Verification

Once fixed, run the probe script (`node tests/linkage-customer-case/probe-dom.mjs`) — it presses Escape
and immediately reopens the modal. Confirm the search input appears within 5 seconds on second open.
Then lift `test.fixme` on TS-03 and TA-05.
