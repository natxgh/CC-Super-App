# Automation Environment

Playwright E2E automation setup for CC Super App STG.

## Environment
- **STG Base URL:** `https://skyai-cloud-cc-stg.metthier.ai:65000`
- **CMS route prefix:** `/cms/`
- **GraphQL BFF:** `cc-bff-stg`
- **Config file:** `../automation/playwright.config.ts`

## Test Accounts
- **Primary:** `ketwadee` — Role: All Permission - Contact Management / Appointment / Form Config
- **Warehouse Staff role:** for Product Stock, Spare Parts Stock Add
- **Agent role:** for RBAC negative cases (cannot see Add button)

## Key Automation Findings (from probe files)

### Selectors / DOM Quirks
- Combobox dropdowns (e.g. Appointment Type, Service Type) use `role="combobox"` — need to wait for option list to appear
- View toggle buttons use icon-based selectors — probe files: `probe-accordion.mjs`, `probe-cfc.mjs`
- Notification bell: `filterNotification` function in POM after combobox probe
- Product Stock POM finalized after live DOM probe (v0.27.7)

### GraphQL Teardown APIs
- Customer teardown, Appointment teardown, Product Stock teardown available via GQL
- See `probe-appt-type-gql.mjs` for appointment type queries

### Spec Files (Automation)
- Automation folder: `../automation/`
- Evidence screenshots: `../automation/appt-evidence/`, etc.
- Assets: `../automation/assets/form-schema.json`, `../automation/assets/broken.json`

## Pass Status (as of recent commits)
- Product & Inventory E2E: **20/20 pass** on QA staging (commit: `033ea59`)
- Product Stock POM: finalized (commit: `717eb31`)
- TS-07 + TS-08: fixed and unblocked (commit: `e49e151`)
- TS-08 + filterNotification POM: fixed (commit: `0fd3c5f`)

## API-First Setup Pattern
- Use Playwright API request context to seed test data before UI tests
- Faster + more stable than UI-based Arrange steps
- Skill: `/api-first`

## Related Pages
- [CC Super App Overview](cc-super-app-overview.md)
- [Test Plan](test-plan.md)
