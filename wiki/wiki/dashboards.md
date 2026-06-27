# Dashboards (Product + Case)

Feature: Analytics & KPI Dashboards · Module 11
Paths: `/cms/products/dashboard` (Product) · `/cms/` (Case / Work Order Summary)
Priority: P4 (Smoke test)

## Product Dashboard

### Sections
| Section | Detail |
|---------|--------|
| KPI Cards (4) | Products / Spare Parts / Ordering / Total Pending + sub-label + trend indicator |
| Trend Indicator | Positive % = green · Negative % = red |
| Platform Capabilities | 5 modules: Product Stock / Spare Part Stock / Customers / Appointments / Package & Services |
| Top Ordered | 6 items, ranked most→least ordered |
| Inventory Alert | Items below minimum stock level (red bar) |
| Estimated Revenue | Donut chart (This Month) + Product Sales % / Service Revenue % |
| Recent Services | Status badges: Completed (green) / In Progress (orange) / Pending (red) |
| Version Toggle | v1 (minimal) ↔ v2 (rich) ↔ v3 (default rich) |
| Export Report | Generate report (BRD target: < 60 seconds) |

### Version Toggle (State Transition)
- v3 = default (rich layout)
- v1 = minimal layout: Total Products 128, Active Services 42
- v2 = rich layout with Top Ordered

### Mock Data (⚠️ HA-Q3)
- Current STG numbers are **mock data** — not wired to real DB
- TCs verifying actual values are 🔒 blocked until dev wires real data

### Low Stock Threshold (HA-Q5)
- Propose: stock < minimum = low (equal = NOT low)
- Pending PO confirmation

### RBAC (HA-Q8 🔴)
- Roles that can see Dashboard: **Supervisor / Team Lead / Auditor** (proposed)
- Agent/Customer/Technician = no access

## Case Dashboard (Work Order Summary)

### Sections
| Section | Detail |
|---------|--------|
| KPI Cards (4) | Total / Censor / CCTV / Traffic work orders |
| Work Order Monthly Summary | Stacked bar chart by month · legend: Complete / In Progress / New |
| SLA Performance | InSLA % / OverSLA % / Average Response Time |
| Work Order Status Overview | Total = Complete + In Progress + New |

### SLA Definition (HA-Q10)
- **InSLA**: closed **within** SLA deadline · equal to deadline = still InSLA
- **OverSLA**: closed after SLA deadline
- **Avg Response Time**: average time from create → acknowledge

### Real-time (HA-Q7)
- Dashboard updates on **page reload** (no websocket auto-refresh this phase)

### Empty State (Currently Testable)
- All values = 0 · chart empty · SLA 0%/0% · "0min Average Response Time"

### Case Types (HA-Q9)
- Censor / CCTV / Traffic — fixed categories for BMA client

## Test Scenarios
| ID | Name | Type | Status |
|----|------|------|--------|
| PD_TS01 | View full Product Dashboard (v3) | ✅ | ✅ exec |
| PD_TS02 | Version toggle v3→v1→v2→v3 | ✅ | ✅ exec |
| PD_TS03 | Export report | ✅ | 🔒 Q2 |
| PD_TA01 | Unauthorized access | ❌ | 🔒 Q8 |
| PD_TA02 | Inventory alert threshold | ❌ | ✅ exec |
| CD_TS01 | Case Dashboard empty state | ✅ | ✅ exec |
| CD_TS02 | Case Dashboard with data | ✅ | 🔒 Q7/Q9 |
| CD_TA01 | Case Dashboard unauthorized | ❌ | 🔒 Q8 |

## Open HAs (🔴 = blocking)
| Q | Topic | Status |
|---|-------|--------|
| Q2 | Export format + scope | 🔴 TBC |
| Q3 | Product Dashboard mock data | 🔴 Not wired to DB yet |
| Q8 | RBAC dashboard | 🔴 TBC |
| Q9 | Case type categories | 🔴 TBC |
| Q10 | InSLA/OverSLA/Avg definition | 🔴 TBC |
| Q1 | Product Dashboard final version | 🟠 Propose: v3 is final |
| Q5 | Low Stock threshold definition | 🟠 Propose: stock < min |
| Q6 | Estimated Revenue logic | 🟠 Placeholder value |
| Q7 | Real-time refresh | 🟠 Page reload only |

## Related Pages
- [Product & Inventory](product-inventory.md)
- [Case & Ticket Management](case-ticket-management.md)
- [Product Stock](product-stock.md)
- [CC Super App Overview](cc-super-app-overview.md)
