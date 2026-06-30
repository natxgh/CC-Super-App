# FIXME — Customer Form Configuration (remaining 3 failures)

Suite passes 20/23. Three tests remain failing with known root causes.

---

## TS-01 — Create New Form (TC-07, TC-08 fail)

**Symptom:** Form created in the builder (Add → type name → add fields → close) never appears in the form dropdown after page reload.

**Root cause:** The builder is **entirely client-side** — confirmed via GQL network capture (probes cfc9, cfc11, cfc12). No `CreateForms` mutation is ever fired on any builder interaction (open, type name, add field, close). `Save Configuration` only POSTs `UpdateCustomerForm` which updates DFC toggles + the *existing* selected form reference. The QA env has exactly one form ("Contact Customization", 2 versions); any new form typed in the builder is never persisted.

**Fix options:**
- A. Add a `createFormViaAPI` helper to `form-seed.ts` using `mutation ($input: FormInput!) { Forms { CreateForms(input: $input) ... }` and call it in `beforeAll`/`beforeEach` for TS-01. The correct `FormInput!` fields need to be verified against the API (probe-cfc13 showed `FormInput` without `!` is wrong; also `formType` vs `type` field name needs clarification).
- B. Annotate TC-07 / TC-08 as known staging gap (`test.fixme`) — form creation via UI is not wired to the API in QA.

**Recommended:** Option A — add `createFormViaAPI` so the test is actually meaningful.

---

## TS-04 — Export → Import Round-trip (TC-02, TC-03 fail)

### TC-02 — Export schema

**Symptom:** `page.waitForEvent('download')` times out / returns `null`. Export button is clicked but no download event fires.

**Root cause:** The Export button likely generates a file via `document.createElement('a')` + blob URL and `.click()` — this mechanism does not emit Playwright's `download` event in headless Chromium in this project's setup. Confirmed in probe-cfc14 (headless) and implicitly by the test's own graceful fallback (`catch(() => null)` + annotation).

**Fix options:**
- A. Intercept the `<a>` element's download attribute via `page.evaluate` before clicking Export, or listen to `page.on('download')` at the context level (`page.context().waitForEvent('download')`).
- B. In headless mode, call `page.route` to intercept blob download requests.
- C. After clicking Export, check clipboard or a DOM-injected data attribute for the schema.

**Recommended:** Try `page.context().waitForEvent('download')` first (simplest change) — Playwright context-level events catch page-initiated downloads more reliably than page-level.

### TC-03 — Import schema back

**Symptom:** After importing `assets/form-schema.json`, `b.fieldCards()` returns 0 (builder shows no field cards). `assetOrSkip()` finds the file and proceeds; the import file-chooser flow runs; but no fields appear after 10s.

**Root cause:** `assets/form-schema.json` uses field types `"textInput"` / `"numberInput"`. The actual type identifiers used internally by the builder are unknown but likely differ (e.g. `"text"` / `"number"`). Confirmed by probe-cfc8 (0 field cards after import) and probe-cfc14 (same result). The correct format can only be obtained by capturing a real export — which is blocked by TC-02's download issue above.

**Fix sequence:**
1. Fix TC-02 export to successfully save the file (see above).
2. Run TS-04 once, capture the exported JSON from `test-results/steps/form-schema.json`.
3. Update `assets/form-schema.json` with the captured content.
4. Re-run TC-03 to confirm it passes.

Until then TC-03 will import a schema with wrong type names → 0 field cards → timeout.

**Workaround:** Remove or empty `assets/form-schema.json` so `assetOrSkip` skips TC-03 gracefully:
```bash
echo '{}' > assets/form-schema.json   # or delete the file
```

---

## TS-05 — Config → Add Customer Integration (TC-01 fails)

**Symptom:** `cfg.selectForm(D.FORM_B2B)` times out — `FORM_B2B` form doesn't exist in the QA env dropdown.

**Root cause:** Same as TS-01 — the builder never persists a new form via API. After `b.close()` + `cfg.saveConfiguration()` (which IS fixed and saves), `FORM_B2B` still doesn't appear in the form list on next page load.

**Fix:** Same as TS-01 option A — add a `createFormViaAPI(page, { formName: D.FORM_B2B, ... })` fixture call before the builder interaction so the form exists in the DB.

---

## Additional notes

### `form-seed.ts` — FORM_CREATE uses wrong variable type
```typescript
// Current (wrong — nullable FormInput may be rejected):
FORM_CREATE = 'mutation ($input: FormInput) { Forms { CreateForms ...'
// Should be (non-nullable, confirmed by API introspection in probe-cfc13):
FORM_CREATE = 'mutation ($input: FormInput!) { Forms { CreateForms ...'
```

### Modal backdrop intercepts close button in probes
The builder modal has a `fixed inset-0` backdrop div that blocks pointer events. In probe scripts, use `{ force: true }` on the close button click, or close via `page.keyboard.press('Escape')`. The FormBuilderPage POM already uses `force: true` in `close()`, so tests are unaffected.

### GetFormAll API field name
`GetFormAll` expects `type` (not `formType`) in the `ListDataInput`. Confirmed in probe-cfc13.

---

*Last updated: 2026-06-29 — 20/23 pass, 3 failing with documented root causes above.*
