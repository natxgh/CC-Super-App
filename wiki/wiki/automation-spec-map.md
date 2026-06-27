# Automation Spec Map

Mapping of every spec file to its module, POM class(es), fixtures, and probe files.

## Shared Infrastructure

| File | Purpose |
|------|---------|
| `automation/playwright.config.ts` | Shared suite config (STG base URL, workers, reporters) |
| `automation/shared/pages/LoginPage.ts` | Login POM used by all shared-suite specs |
| `automation/Makefile` | Convenience targets (run module, run all, etc.) |

---

## Module Spec Files

### 00 — Sign-In (standalone)

| Item | Path |
|------|------|
| Spec | `00-Sign-In/automation/tests/cc-signin.spec.ts` |
| POM | `00-Sign-In/automation/pages/SignInPage.ts` |
| Config | `00-Sign-In/automation/playwright.config.ts` |
| Evidence | `00-Sign-In/automation/test-results/` |

### 01 — Customer Profile

| Item | Path |
|------|------|
| Spec | `automation/tests/customer-profile/customer-profile.spec.ts` |
| POM — List | `automation/tests/customer-profile/pages/CustomerListPage.ts` |
| POM — Form | `automation/tests/customer-profile/pages/CustomerFormPage.ts` |
| POM — Detail | `automation/tests/customer-profile/pages/CustomerDetailPage.ts` |
| Fixture — seed | `automation/tests/customer-profile/fixtures/seed.ts` |
| Fixture — data | `automation/tests/customer-profile/fixtures/testdata.ts` |
| Teardown | `automation/tests/customer-profile/teardown/global-teardown.ts` |
| Results uploader | `automation/scripts/upload-cp-results.mjs` → Lark Base |
| Results cache | `automation/cp-results.json` |

### 02 — Customer Appointment

| Item | Path |
|------|------|
| Spec | `automation/tests/customer-appointment/customer-appointment.spec.ts` |
| POM | `automation/tests/customer-appointment/pages/AppointmentPage.ts` |
| Fixture — seed | `automation/tests/customer-appointment/fixtures/appointment-seed.ts` |
| Fixture — data | `automation/tests/customer-appointment/fixtures/testdata.ts` |
| Evidence | `automation/appt-evidence/` (TA-02_TC-01..TS-01_TC-02 PNGs) |

### 03 — Customer Form Configuration

| Item | Path |
|------|------|
| Spec | `automation/tests/customer-form-configuration/customer-form-configuration.spec.ts` |
| POM — Builder | `automation/tests/customer-form-configuration/pages/FormBuilderPage.ts` |
| POM — Config | `automation/tests/customer-form-configuration/pages/FormConfigPage.ts` |
| Fixture — seed | `automation/tests/customer-form-configuration/fixtures/form-seed.ts` |
| Fixture — data | `automation/tests/customer-form-configuration/fixtures/testdata.ts` |
| Teardown | `automation/tests/customer-form-configuration/teardown/global-teardown.ts` |
| Assets | `automation/assets/form-schema.json`, `automation/assets/broken.json` |

### 04 — Product & Inventory

| Item | Path |
|------|------|
| Spec | `automation/tests/product-inventory/product-inventory.spec.ts` |
| POM — List | `automation/tests/product-inventory/pages/ProductListPage.ts` |
| POM — Form | `automation/tests/product-inventory/pages/ProductFormPage.ts` |
| POM — Detail | `automation/tests/product-inventory/pages/ProductDetailPage.ts` |
| Fixture — seed | `automation/tests/product-inventory/fixtures/product-seed.ts` |
| Fixture — data | `automation/tests/product-inventory/fixtures/testdata.ts` |
| Teardown | `automation/tests/product-inventory/teardown/global-teardown.ts` |
| Status | **20/20 pass** (commit `033ea59`) |

### 05 — Product Stock

| Item | Path |
|------|------|
| Spec | `automation/tests/product-stock/product-stock.spec.ts` |
| POM | `automation/tests/product-stock/pages/ProductStockPage.ts` |
| Fixture — seed | `automation/tests/product-stock/fixtures/product-stock-seed.ts` |
| Fixture — data | `automation/tests/product-stock/fixtures/testdata.ts` |
| Status | POM finalized (`717eb31`); TS-07/TS-08 fixed (`e49e151`, `0fd3c5f`) |

### 06 — Spare Parts

| Item | Path |
|------|------|
| Spec | `automation/tests/spare-parts/spare-parts.spec.ts` |
| POM — List | `automation/tests/spare-parts/pages/SparePartsListPage.ts` |
| POM — Form | `automation/tests/spare-parts/pages/SparePartsFormPage.ts` |
| POM — Detail | `automation/tests/spare-parts/pages/SparePartsDetailPage.ts` |
| Fixture — seed | `automation/tests/spare-parts/fixtures/spare-seed.ts` |
| Fixture — data | `automation/tests/spare-parts/fixtures/testdata.ts` |
| Lark uploader | `06-Spare Parts/update-expected-toast-lark.mjs` |

### 07 — Spare Parts Stock

| Item | Path |
|------|------|
| Spec | `automation/tests/spare-parts-stock/spare-parts-stock.spec.ts` |
| POM | `automation/tests/spare-parts-stock/pages/SparePartsStockPage.ts` |
| Fixture — seed | `automation/tests/spare-parts-stock/fixtures/spare-parts-stock-seed.ts` |
| Fixture — data | `automation/tests/spare-parts-stock/fixtures/testdata.ts` |
| Lark uploader | `07-Spare Parts Stock/update-expected-toast-lark.mjs` |

### 08 — Order Management

| Item | Path |
|------|------|
| Spec | `automation/tests/order-management/order-management.spec.ts` |
| POM | `automation/tests/order-management/pages/OrderPage.ts` |
| Fixture — seed | `automation/tests/order-management/fixtures/order-seed.ts` |
| Fixture — data | `automation/tests/order-management/fixtures/testdata.ts` |

### 09 — Case & Ticket Management

| Item | Path |
|------|------|
| Spec | `automation/tests/case-ticket-management/case-ticket-management.spec.ts` |
| POM | `automation/tests/case-ticket-management/pages/CasePage.ts` |
| Fixture — seed | `automation/tests/case-ticket-management/fixtures/case-seed.ts` |
| Fixture — data | `automation/tests/case-ticket-management/fixtures/testdata.ts` |
| Teardown | `automation/tests/case-ticket-management/teardown/global-teardown.ts` |

### 10 — Linkage Customer ↔ Case

| Item | Path |
|------|------|
| Spec | `automation/tests/linkage-customer-case/linkage-customer-case.spec.ts` |
| POM | `automation/tests/linkage-customer-case/pages/LinkagePage.ts` |
| Fixture — data | `automation/tests/linkage-customer-case/fixtures/testdata.ts` |

---

## Probe Files (DOM / GQL Investigation)

Probe files are **not production specs** — they are one-off investigation scripts used to discover selectors and API shapes before writing POM code.

| File | What it probes |
|------|---------------|
| `probe-accordion.mjs` | Accordion expand/collapse selectors |
| `probe-add-customer-labels.mjs` | Customer label badge DOM structure |
| `probe-appt-type-gql.mjs` | Appointment Type + Service Type GQL queries |
| `probe-builder-save.mjs` | Form Builder save button selector / mutation |
| `probe-builder-validation.mjs` | Form Builder field validation messages |
| `probe-cfc.mjs` … `probe-cfc6.mjs` | CFC toggle selectors across iterations |
| `probe-cp-dom.mjs` | Customer Profile DOM structure |
| `probe-cp-form.mjs` | Customer Profile form field selectors |
| `probe-dispatch-save.mjs` | Dispatch save flow selectors |
| `probe-dup-errors.mjs` | Duplicate error toast messages |
| `probe-fill-timing.mjs` | Form fill timing issues (flaky input) |
| `probe-save-form-visibility.mjs` | Save button visibility after field changes |
| `probe-service-type-gql.mjs` | Service Type GQL shape |
| `probeI.mjs` | General inspection probe |
| `tests/probe-spare-parts.spec.ts` | Spare Parts DOM probe (as Playwright spec) |
| `tests/probe-spare-parts-form.spec.ts` | Spare Parts form selectors probe |
| `tests/probe-spare-parts-form2.spec.ts` | Spare Parts form selectors probe v2 |

---

## Lark Base Utility Scripts

| Script | Purpose |
|--------|---------|
| `06-Spare Parts/update-expected-toast-lark.mjs` | Push expected toast messages → Lark Base for Spare Parts TCs |
| `07-Spare Parts Stock/update-expected-toast-lark.mjs` | Same for Spare Parts Stock |
| `07-Spare Parts Stock/build-xlsx.mjs` | Generate xlsx from test design data |
| `09-Case and Ticket Management/gen-testcases-xlsx.mjs` | Generate xlsx for Case TCs |
| `automation/scripts/upload-cp-results.mjs` | Push CP automation results → Lark Base |
| `automation/scripts/push-missing-tcs.mjs` | Push missing TC rows to Lark Base |

## Related Pages
- [Project Structure](project-structure.md)
- [Execution Status](execution-status.md)
- [Automation Environment](automation-env.md)
