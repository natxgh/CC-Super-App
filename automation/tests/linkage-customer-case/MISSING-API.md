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

## ⚠️ GAPS / things still to probe before lifting `test.fixme`
1. **Linked Existing modal DOM** — search input (placeholder "Search Name,Mobile Number,Email."), Search button,
   Filter "Type" options, table columns, per-row "Select" button, footer, "Clear Filters". Selectors are best-effort
   in `pages/LinkagePage.ts`; verify against live DOM.
2. **Customer 360 panel DOM** — tabs (Profile/History/Note/Appointment/Product/Service), "Contact Channels",
   "View Full Profile" → Modal (PO Q10).
3. **Add Customer quick-create modal DOM** — Email/Phone/First/Last inputs + Save + inline validation copy
   ("Please enter an email address" / "Please enter a mobile number" — PO Q4). `name=` attrs reused from the full
   Customer form as a best-effort guess.
4. **No dedicated "link/unlink" API** — linkage is driven by the phone number on the case form (PO Q5).
   There is nothing to Arrange/assert server-side for the linkage state itself; do it via UI.

## 🐞 Open defects that gate execution (see design Step 5)
- **A-1** Search in Linked Existing returns "No results found." for every keyword → blocks TS-01_TC-02, TA-01/02/03.
- **A-2** Clear Filters does not re-fetch → blocks TA-05.
- **A-3** list-row identity ≠ linked profile (phone duplicated across profiles) → blocks TA-08.
- **A-4** reopen Linked Existing modal hangs on loading → blocks TS-03.
- **B-1** no inline validation yet (only a generic toast) → blocks TA-10/11/12/13.

## Teardown
`CP_TEARDOWN=1` → `tests/customer-profile/teardown/global-teardown.ts` deletes every customer id recorded in
`test-results/seeded-emails.json` (seeded via `seedCustomer`/`seedCustomers` **and** UI-created via `purgeByEmail`)
through `DeleteCustomer`. Run: `CP_TEARDOWN=1 npm test tests/linkage-customer-case` (or `npm run test:linkage`).
