# Execution Status

Per-module test execution status as of 2026-06-27 (branch: `qa/automation-suite-product-stock`).

> **Source of truth:** Lark Base + xlsx files. This page is a snapshot for quick orientation — verify current pass/fail in Lark Base before acting on it.

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Passed (automated or manual) |
| ❌ | Failed / Bug filed |
| 🔒 | Blocked (open HA/TBC) |
| 🕐 | Not yet executed |
| ⚙️ | Automation spec exists |

---

## Module Summary

| # | Module | Design | Manual Exec | Automation | Notes |
|---|--------|--------|-------------|------------|-------|
| 00 | Sign-In | ✅ Complete | ✅ All pass | ✅ All pass | Standalone suite |
| 01 | Customer Profile | ✅ Complete | ✅ Most pass | ⚙️ spec exists | PO answers Q1–Q10 applied |
| 02 | Customer Appointment | ✅ Complete | ✅ Most pass | ⚙️ spec exists | US date bug, placeholder bug noted |
| 03 | Customer Form Config | ✅ Complete | ✅ Most pass | ⚙️ spec exists | DFC Blood Type OFF default confirmed |
| 04 | Product & Inventory | ✅ Complete | ✅ All pass | ✅ 20/20 pass | commit `033ea59` |
| 05 | Product Stock | ✅ Complete | ✅ Most pass | ✅ POM final | TS-07/TS-08 fixed commits `e49e151`, `0fd3c5f` |
| 06 | Spare Parts | ✅ Complete | 🕐 Partial | ⚙️ spec exists | delete bug (no dialog) open |
| 07 | Spare Parts Stock | ✅ Complete | 🕐 Partial | ⚙️ spec exists | unit read-only rule confirmed |
| 08 | Order Management | ✅ Complete | 🕐 Not started | ⚙️ spec exists | 2 confirmed bugs |
| 09 | Case & Ticket Mgmt | ✅ Complete | 🕐 Partial | ⚙️ spec exists | 6-step lifecycle, close approval |
| 10 | Linkage Customer↔Case | ✅ Complete | 🕐 Not started | ⚙️ spec exists | 4 open defects (A-1 to A-4) |
| 11 | Dashboards | ✅ Complete | 🔒 Partial | — | Mock data, no automation planned |

---

## Sign-In (00) — ✅ Complete

All scenarios executed and passing. Standalone automation suite at `00-Sign-In/automation/`.

| TC | Name | Result |
|----|------|--------|
| TS-01 | Valid credentials login | ✅ |
| TS-02 | Invalid password | ✅ |
| TS-03 | Empty fields | ✅ |
| TS-04 | Account locked / edge cases | ✅ |
| Alt scenarios | Hidden assumption cases (HA1–HA8) | ✅ |

---

## Customer Profile (01) — ✅ Design complete

- TCs: VCP, ACP, UCP, DCP, VPRD, VSVC, VCC, VCL suites
- PO answers Q1–Q10 + round-2 applied to test design
- Automation spec: `tests/customer-profile/customer-profile.spec.ts`
- Known open: Photo upload size limit (HA-Q9), VCL toggle behavior per company

---

## Customer Appointment (02) — ✅ Design complete

- Lifecycle: Pending → Confirmed → Deleted (no Completed state)
- Known bugs: US date format bug, placeholder swap bug (Appointment Type ↔ Service Type)
- Automation spec: `tests/customer-appointment/customer-appointment.spec.ts`
- Open: Q13 (Appointment reminder integration) — TBC

---

## Customer Form Configuration (03) — ✅ Design complete

- CFC (Form Builder) + DFC (Default Field Config) tested separately
- DFC Blood Type: OFF by default — confirmed with dev
- Automation spec: `tests/customer-form-configuration/customer-form-configuration.spec.ts`
- 2 POM classes: `FormBuilderPage.ts`, `FormConfigPage.ts`

---

## Product & Inventory (04) — ✅ 20/20 PASS

- Automation: fully passing as of commit `033ea59`
- Tested: CRUD, view modes (Grid/List), search/filter, stock badge, year boundary 2017–2027
- Conditional delete rule: cannot delete if stock > 0
- Toast messages verified

---

## Product Stock (05) — ✅ POM Finalized

- POM finalized after live DOM probe, v0.27.7 (`717eb31`)
- TS-07 fixed (`e49e151`), TS-08 + filterNotification fixed (`0fd3c5f`)
- RBAC: Warehouse Staff can Add; Agent cannot see Add button
- BVA: 99/100/101 char Serial No. — 100 = boundary (accepted), 101 = rejected
- Notification bell: `filterNotification` function in `ProductStockPage.ts`

---

## Spare Parts (06) — ⚙️ Spec exists, partial exec

- Delete bug: no confirmation dialog (bug filed — not fixed yet)
- 3 view modes tested
- Warranty: stored in days, displayed in months
- Automation spec: `tests/spare-parts/spare-parts.spec.ts`

---

## Spare Parts Stock (07) — ⚙️ Spec exists, partial exec

- Unit registry: Status field read-only after creation (cannot edit)
- Drill-down from stock badge confirmed
- Automation spec: `tests/spare-parts-stock/spare-parts-stock.spec.ts`

---

## Order Management (08) — ⚙️ Spec exists, not started

- 9-step workflow (OS000–OS009) designed; manual exec not started
- 2 confirmed bugs: (see [order-management.md](order-management.md))
- PIC gating: cannot proceed past OS003 without PIC assigned
- Automation spec: `tests/order-management/order-management.spec.ts`

---

## Case & Ticket Management (09) — ⚙️ Spec exists, partial exec

- 6-step lifecycle with close approval flow
- Priority matrix: 6 distinct levels (Urgent/High/Medium/Low/Information/Enhancement)
- Automation spec: `tests/case-ticket-management/case-ticket-management.spec.ts`

---

## Linkage Customer ↔ Case (10) — ⚙️ Spec exists, not started

- 4 open defects: A-1 (search), A-2 (quick-create), A-3 (link existing), A-4 (unlink)
- Automation spec: `tests/linkage-customer-case/linkage-customer-case.spec.ts`

---

## Dashboards (11) — 🔒 Partial

- Product Dashboard: mock data (not wired to DB) — most value TCs blocked
- Case Dashboard: empty-state TC executable; data TC blocked (Q7/Q9 TBC)
- No automation planned (visual/data-dependent)

---

## Current Branch

`qa/automation-suite-product-stock` — active work on Product Stock automation.

Recent commits:
- `0fd3c5f` — Fix TS-08 + POM filterNotification after combobox probe
- `033ea59` — Fix Product & Inventory E2E: 20/20 pass on QA staging
- `e49e151` — Un-fixme TS-07 + finalize POM after live DOM probe (v0.27.7)
- `1260ce3` — Fix Product Stock POM + spec after live staging investigation
- `717eb31` — Finalize ProductStockPage POM with live DOM probe findings

## Related Pages
- [Project Structure](project-structure.md)
- [Automation Spec Map](automation-spec-map.md)
- [Automation Environment](automation-env.md)
- [Test Plan](test-plan.md)
