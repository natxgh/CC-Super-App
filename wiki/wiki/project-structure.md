# Project Structure

CC Super App QA repository layout and source-of-truth hierarchy.

## Root: `/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/`

```
CC Super App/
├── Document/
│   ├── Requirements/
│   │   └── grooming-requirements.md      ← raw BRD / grooming notes (read-only)
│   └── Test Plan/
│       └── skyai-cc-superapp-test-plan-v1.1.md
│
├── 00-Sign-In/
│   ├── cc-signin-test-design.md
│   └── automation/                       ← STANDALONE automation (Sign-In only)
│       ├── playwright.config.ts
│       ├── tests/
│       │   └── cc-signin.spec.ts
│       ├── pages/
│       │   └── SignInPage.ts
│       └── test-results/                 ← HTML report + evidence PNGs
│
├── 01-Customer Profile/
│   ├── customer-profile-test-design.md
│   ├── customer-profile-testcases.xlsx
│   └── tests/                            ← legacy standalone (unused)
│
├── 02-Customer Appointment/
│   ├── customer-appointment-test-design.md
│   └── customer-appointment-testcases.xlsx
│
├── 03-Customer Form Configuration/
│   ├── customer-form-configuration-test-design.md
│   ├── customer-form-configuration-test-design-EN.md
│   ├── customer-form-configuration-testcases.xlsx
│   └── customer-form-configuration-testcases-EN.xlsx
│
├── 04-Product/
│   ├── product-inventory-test-design.md
│   └── product-inventory-testcases.xlsx
│
├── 05-Product Stock/
│   ├── product-stock-test-design.md
│   └── product-stock-testcases.xlsx
│
├── 06-Spare Parts/
│   ├── spare-parts-test-design.md
│   ├── spare-parts-testcases.xlsx
│   └── update-expected-toast-lark.mjs    ← utility: push expected toasts → Lark Base
│
├── 07-Spare Parts Stock/
│   ├── spare-parts-stock-test-design.md
│   ├── spare-parts-stock-testcases.xlsx
│   ├── build-xlsx.mjs                    ← generate/update xlsx from test design
│   └── update-expected-toast-lark.mjs
│
├── 08-Order/
│   ├── order-management-test-design.md
│   └── order-management-testcases.xlsx
│
├── 09-Case and Ticket Management/
│   ├── case-ticket-management-test-design.md
│   ├── case-ticket-management-testcases.xlsx
│   └── gen-testcases-xlsx.mjs
│
├── 10-Linkage Customer Profile with Case/
│   └── linkage-customer-case-test-design.md
│
├── 11-Dashboards/
│   └── dashboard-test-design.md
│
├── automation/                           ← SHARED SUITE (all modules except Sign-In)
│   ├── playwright.config.ts
│   ├── package.json
│   ├── Makefile
│   ├── .gitignore
│   │
│   ├── shared/
│   │   └── pages/
│   │       └── LoginPage.ts              ← shared login POM used by all specs
│   │
│   ├── tests/                            ← one subfolder per module
│   │   ├── customer-profile/
│   │   │   ├── customer-profile.spec.ts
│   │   │   ├── pages/  (CustomerListPage.ts, CustomerFormPage.ts, CustomerDetailPage.ts)
│   │   │   ├── fixtures/  (seed.ts, testdata.ts)
│   │   │   └── teardown/  (global-teardown.ts)
│   │   ├── customer-appointment/
│   │   │   ├── customer-appointment.spec.ts
│   │   │   ├── pages/  (AppointmentPage.ts)
│   │   │   ├── fixtures/  (appointment-seed.ts, testdata.ts)
│   │   │   └── (no teardown yet)
│   │   ├── customer-form-configuration/
│   │   │   ├── customer-form-configuration.spec.ts
│   │   │   ├── pages/  (FormBuilderPage.ts, FormConfigPage.ts)
│   │   │   ├── fixtures/  (form-seed.ts, testdata.ts)
│   │   │   └── teardown/  (global-teardown.ts)
│   │   ├── product-inventory/
│   │   │   ├── product-inventory.spec.ts
│   │   │   ├── pages/  (ProductListPage.ts, ProductFormPage.ts, ProductDetailPage.ts)
│   │   │   ├── fixtures/  (product-seed.ts, testdata.ts)
│   │   │   └── teardown/  (global-teardown.ts)
│   │   ├── product-stock/
│   │   │   ├── product-stock.spec.ts
│   │   │   ├── pages/  (ProductStockPage.ts)
│   │   │   └── fixtures/  (product-stock-seed.ts, testdata.ts)
│   │   ├── spare-parts/
│   │   │   ├── spare-parts.spec.ts
│   │   │   ├── pages/  (SparePartsListPage.ts, SparePartsFormPage.ts, SparePartsDetailPage.ts)
│   │   │   └── fixtures/  (spare-seed.ts, testdata.ts)
│   │   ├── spare-parts-stock/
│   │   │   ├── spare-parts-stock.spec.ts
│   │   │   ├── pages/  (SparePartsStockPage.ts)
│   │   │   └── fixtures/  (spare-parts-stock-seed.ts, testdata.ts)
│   │   ├── order-management/
│   │   │   ├── order-management.spec.ts
│   │   │   ├── pages/  (OrderPage.ts)
│   │   │   └── fixtures/  (order-seed.ts, testdata.ts)
│   │   ├── case-ticket-management/
│   │   │   ├── case-ticket-management.spec.ts
│   │   │   ├── pages/  (CasePage.ts)
│   │   │   ├── fixtures/  (case-seed.ts, testdata.ts)
│   │   │   └── teardown/  (global-teardown.ts)
│   │   ├── linkage-customer-case/
│   │   │   ├── linkage-customer-case.spec.ts
│   │   │   ├── pages/  (LinkagePage.ts)
│   │   │   └── fixtures/  (testdata.ts)
│   │   └── probe-spare-parts*.spec.ts    ← DOM investigation specs (not production tests)
│   │
│   ├── assets/
│   │   ├── form-schema.json
│   │   └── broken.json
│   ├── appt-evidence/                    ← screenshot evidence for appointment TCs
│   ├── scripts/
│   │   ├── upload-cp-results.mjs         ← push Customer Profile results → Lark Base
│   │   └── push-missing-tcs.mjs
│   ├── cp-results.json
│   │
│   └── probe-*.mjs                       ← one-off DOM/GQL investigation scripts
│       (probe-accordion, probe-add-customer-labels, probe-appt-type-gql,
│        probe-builder-save, probe-builder-validation, probe-cfc through probe-cfc6,
│        probe-cp-dom, probe-cp-form, probe-dispatch-save, probe-dup-errors,
│        probe-fill-timing, probe-save-form-visibility, probe-service-type-gql, probeI)
│
└── wiki/                                 ← this wiki
    ├── schema.md
    ├── raw/
    └── wiki/
        ├── index.md
        ├── log.md
        └── *.md
```

## Two Automation Setups

| | `00-Sign-In/automation/` | `automation/` (root) |
|--|--|--|
| Scope | Sign-In only | All other modules |
| Status | Complete — TS-01–TS-04 + alt scenarios run | Active (per-module, running) |
| Config | Own `playwright.config.ts` | Own `playwright.config.ts` |
| Shared POM | `pages/SignInPage.ts` (local) | `shared/pages/LoginPage.ts` |
| Evidence | `test-results/` (HTML + PNGs) | `appt-evidence/` etc. |

## Source-of-Truth Hierarchy

```
xlsx / Lark Base         ← AUTHORITATIVE (TC IDs, expected results, status, actual results)
        ↑
.md test design files    ← design rationale, BVA notes, open questions only
        ↑
grooming-requirements.md ← raw BRD, high-level scope
        ↑
wiki/                    ← synthesised knowledge (derived from all above)
```

- **Never** derive TC pass/fail status from `.md` files — check xlsx or Lark Base.
- `.md` files are living design docs; they may contain open `TBC` items that are resolved in Lark.
- `xlsx` files are kept in sync with Lark Base via utility scripts (`update-expected-toast-lark.mjs`, `upload-cp-results.mjs`).

## Related Pages
- [Automation Environment](automation-env.md)
- [Automation Spec Map](automation-spec-map.md)
- [Execution Status](execution-status.md)
- [Test Plan](test-plan.md)
