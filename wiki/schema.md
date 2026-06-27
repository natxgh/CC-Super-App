# Wiki Schema

## Domain
CC Super App — a Contact Center Super App covering product knowledge, BRD requirements, QA test design, test cases, Playwright automation, and findings across all modules.

## Entity types to track
- **Module**: A feature area of the app (Customer Profile, Appointment, Form Config, Product, Product Stock, Spare Parts, Spare Parts Stock, Order, Case & Ticket)
- **Feature**: A specific capability within a module (e.g., "Add Customer Label", "Filter by Status")
- **Test Scenario**: A named scenario (TS-XX) with scope, preconditions, expected outcomes
- **Test Case**: A specific TC within a scenario (TC-01, TC-02…)
- **Automation Spec**: A Playwright spec file and its current pass/fail status
- **Bug / Finding**: A defect or unexpected behavior found during testing or automation
- **API / GraphQL**: Backend endpoints and GQL mutations used in setup/teardown
- **Tech concept**: Playwright patterns, POM classes, helper utilities used in automation
- **Environment**: Staging config, routes, credentials, test accounts

## Naming conventions
- Pages use kebab-case: `customer-profile.md`, `product-stock.md`
- Module pages named after the module: `customer-profile.md`
- Scenario/case pages: `ts-01-search-customer.md` (only if rich enough for own page)
- Concept pages use noun phrases: `page-object-model.md`, `api-first-setup.md`

## What to capture
- Module scope, key features, entry/exit criteria
- Test scenario IDs, names, coverage status (pass / fail / not automated)
- Automation findings: selectors, timing issues, workarounds, DOM quirks
- GraphQL teardown APIs and how to use them
- Bugs: symptom, root cause, fix (or status)
- Environment gotchas: role gating, CMS route prefixes, staging quirks

## What to skip
- Obvious Playwright/testing background knowledge already in official docs
- Boilerplate test steps that are identical across modules
- Content already well-covered in existing pages (just add a link)

## Cross-linking rules
- Link to related pages using markdown: [Page Title](page-name.md)
- Every new page should link to at least one existing page
- Every module page links to its automation spec page (if it exists)
- Bug pages link to the module and feature they affect
