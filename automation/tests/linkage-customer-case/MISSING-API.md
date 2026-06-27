# Linkage Customer Profile with Case — API coverage & gaps (for Arrange/Teardown)

Endpoint: `https://cc-bff-qa.one-sky.ai/graphql` (same JWT as Customer/Case) · introspection open.
Re-checked 2026-06-20 (read-only introspection — no side effects).

## ✅ Available (used by `customer-profile/fixtures/seed.ts`)
| Op | Path | Use |
|---|---|---|
| CreateCustomer | `Mutation.Customer.CreateCustomer(CustomerInput!)` | **Arrange** existing customers to link (Bulan/Vilailuk/Donald) |
| DeleteCustomer | `Mutation.Customer.DeleteCustomer(GetIdInput!{id})` | **Teardown** seeded + UI-created customers |
| GetListCustomer | `Query.Customer.GetListCustomer(ListDataInput)` | find id by email (cleanup / idempotent seed) |
| GetCustomerByPhone | `Query.Customer.GetCustomerByPhone(...)` | (introspected, not yet wired) relevant to PO Q5 "link by phone number" |
| GetCustomerById | `Query.Customer.GetCustomerById(...)` | (available) verify linked profile fields |

> Linkage itself is a **UI-only interaction on the case form** — selecting/linking a customer is not persisted as a
> separate entity until the case is saved. These scenarios link + inspect the panel and do **not** save a case,
> so the only writes are: Add Customer quick-create (TS-02 — creates a Customer) and the duplicate-block negatives
> (TA-14/TA-15 — should create nothing). All covered by DeleteCustomer teardown.

## ✅ DOM verified (probe 2026-06-21)
| Element | Verified selector |
|---|---|
| Search input | `getByPlaceholder(/Search Name,\s*Mobile Number,\s*Email/i)` |
| Search button | `getByRole('button', { name: /^Search$/i })` |
| Filter Type | `page.locator('[role=dialog] select').first()` — native `<select>` |
| Type options | Bronze / Silver / Gold / Platinum (⚠️ **N/A absent** — PO Q9 discrepancy) |
| Per-row Select | `getByRole('button', { name: /^Select$/i })` |
| Footer | `"Showing 1-0 of 0 entries"` (hyphen, not en-dash; count shows 0 even when rows exist — display bug) |
| **Clear Filters** | **DOES NOT EXIST** in DOM — defect A-2 premise is moot |
| Add Customer inputs | `input[name="email"]`, `input[name="mobileNo"]`, `input[name="firstName"]`, `input[name="lastName"]` |
| Add Customer Save | `getByRole('button', { name: /^Save$/i })` |
| Panel tabs | `getByRole('button', { name: /^TabName$/i })` — **NOT** `role=tab` |
| View Full Profile | `getByRole('button', { name: /View Full Profile/i })` → opens `role=dialog` modal ✅ |

## ⚠️ GAPS / still to probe before lifting remaining `test.fixme`
1. **Customer 360 panel tab contents** — History/Note/Appointment/Product/Service (tab buttons verified, content not probed).
2. **Add Customer inline validation** — exact error copy TBC; defect B-1 blocks (no inline validation yet, only generic toast).
3. **No dedicated "link/unlink" API** — linkage is driven by the phone number on the case form (PO Q5).
   There is nothing to Arrange/assert server-side for the linkage state itself; do it via UI.

## 🐞 Open defects that gate execution (see design Step 5)
- **A-1** Search in Linked Existing returns "No results found." for every keyword → blocks TS-01_TC-02, TA-01/02/03, possibly TA-07.
- **A-2** ~~Clear Filters does not re-fetch~~ — **MOOT**: "Clear Filters" button does not exist in DOM (probe 2026-06-21). TA-05 redesigned to test modal close+reopen, which is now blocked by A-4.
- **A-3** list-row identity ≠ linked profile (phone duplicated across profiles) → blocks TA-08.
- **A-4** reopen Linked Existing modal hangs on loading → blocks TS-03, TA-05.
- **B-1** no inline validation yet (only a generic toast) → blocks TA-10/11/12/13.

## Teardown
`CP_TEARDOWN=1` → `tests/customer-profile/teardown/global-teardown.ts` deletes every customer id recorded in
`test-results/seeded-emails.json` (seeded via `seedCustomer`/`seedCustomers` **and** UI-created via `purgeByEmail`)
through `DeleteCustomer`. Run: `CP_TEARDOWN=1 npm test tests/linkage-customer-case` (or `npm run test:linkage`).
