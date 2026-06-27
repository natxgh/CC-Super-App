# CC Super App — Overview

CC Super App คือ Integrated Omnichannel Contact Center + CRM + Case Management Platform สำหรับ BMA (Bangkok Metropolitan Administration) และลูกค้าองค์กร

## Product Summary
- **Target:** Go-live v1.0 July 2026
- **BRD Version:** v0.3
- **STG URL:** `https://skyai-cloud-cc-stg.metthier.ai:65000`
- **CMS Path Prefix:** `/cms/`
- **Test Account:** `ketwadee` — Role: All Permission

## Modules (11 + Sign-In)

| # | Module | CMS Path | Priority |
|---|--------|----------|----------|
| 00 | [Sign-In](sign-in.md) | `/` (login page) | Prereq |
| 01 | [Customer Profile](customer-profile.md) | `/cms/contacts` | P1 |
| 02 | [Customer Appointment](customer-appointment.md) | Customer Profile → Appointment tab | P1 |
| 03 | [Customer Form Configuration](customer-form-configuration.md) | `/cms/contacts-configurations` | P1 |
| 04 | [Product & Inventory](product-inventory.md) | `/cms/products/` | P2 |
| 05 | [Product Stock](product-stock.md) | `/cms/products/stock` | P3 |
| 06 | [Spare Parts](spare-parts.md) | `/cms/inventory` | P2 |
| 07 | [Spare Parts Stock](spare-parts-stock.md) | `/cms/inventory/stock` | P3 |
| 08 | [Order Management](order-management.md) | `/cms/inventory/request` | P3 |
| 09 | [Case & Ticket Management](case-ticket-management.md) | `/cms/case/` + Assignment Board | P2-P3 |
| 10 | [Linkage Customer ↔ Case](linkage-customer-case.md) | `/cms/case/creation` | P3 |
| 11 | [Dashboards](dashboards.md) | `/cms/` (Case) · `/cms/products/dashboard` (Product) | P4 |

## Tech Stack
- Frontend: CMS web app
- Backend: GraphQL BFF (`cc-bff-stg`)
- Test Framework: Playwright (E2E automation)
- Test Management: Lark Base
- Bug Tracking: Meegle

## Key Business Rules
- RBAC: roles include Warehouse Staff, Admin, Agent, Dispatcher, Responder
- Stock thresholds: 0 = Out of Stock · 1–5 = Low Stock · >5 = In Stock (configurable per company)
- All toast text confirmed via Error & Success Handling Matrix (2026-06-24)
- Empty state text: `"No results found."` (Contact/Appointment) or `"No entries to show"` (Products/Spare Parts/Orders)

## Known Bugs (Confirmed)
- **Order Search not filtering** (ORD-Q7) — returns full list regardless of input
- **Order Cancel visible after Approved** (ORD-Q5) — should be hidden/blocked
- **Spare Parts Delete: confirmation dialog missing** (SP-Q2) — currently closes immediately
- **Linkage: Search broken** (LCP defect A-1) — customer search returns no results
- **Linkage: Clear Filters no re-fetch** (LCP defect A-2)
- **Linkage: reopen modal hangs** (LCP defect A-4)

## Related Pages
- [Test Plan](test-plan.md)
- [Automation Environment](automation-env.md)
