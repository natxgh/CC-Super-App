# Wiki Log

## 2026-06-29 — Ingest: Customer Appointment automation run (29/06)
- Updated: [customer-appointment.md] — เพิ่ม "Automation Execution Results" section
- ผล: 15 PASSED · 3 FAILED · 0 BLOCKED
  - TS-05 Delete ✅ ผ่านใหม่ — FE แก้ bug แล้ว (ก่อนหน้านี้ 404)
  - TS-02/03 FAIL — Add appointment ไม่มี success toast (silent fail)
  - TS-04 FAIL — Confirm ไม่เปลี่ยน status card
- Scripts recreated: playwright.appointment.config.ts, teardown/global-teardown.ts, results-to-records.mjs, upload-appointment-results.mjs
- Lark Base: 18/18 records updated ✅

## 2026-06-29 — Ingest: CP automation field-config investigation
- Updated: [customer-profile.md] (added "Automation — Arrange: Field Config" section — setFieldConfig ส่ง email/mobileNo=true ใน beforeAll, teardown ไม่แตะ config)
- Updated: [customer-form-configuration.md] (added "DFC — email/phone ไม่มี UI toggle" section — ต้นเหตุ email/phone=false ใน log คือ UI saveConfiguration ของ CFC tests ไม่รวม 2 fields นี้ใน payload)

## 2026-06-27 — Add: Cross-account handoff pages
- Created: [project-structure.md], [execution-status.md], [automation-spec-map.md]
- Purpose: fill gaps for handoff to another Claude account — folder tree, SoT hierarchy, pass/fail snapshot, full spec↔POM↔probe mapping
- Sources: git status, find output, ls automation/, git log, existing wiki pages

## 2026-06-27 — Ingest: All modules (full ingest from source docs)
- Created: [cc-super-app-overview.md], [sign-in.md], [customer-profile.md], [customer-appointment.md], [customer-form-configuration.md], [product-inventory.md], [product-stock.md], [spare-parts.md], [spare-parts-stock.md], [order-management.md], [case-ticket-management.md], [linkage-customer-case.md], [dashboards.md], [test-plan.md], [automation-env.md]
- Sources ingested: cc-signin-test-design.md · customer-profile-test-design.md · customer-appointment-test-design.md · customer-form-configuration-test-design-EN.md · product-inventory-test-design.md · product-stock-test-design.md · spare-parts-test-design.md · spare-parts-stock-test-design.md · order-management-test-design.md · case-ticket-management-test-design.md · linkage-customer-case-test-design.md · dashboard-test-design.md · skyai-cc-superapp-test-plan-v1.1.md · grooming-requirements.md
- Key topics: full CRUD rules per module, validation messages, RBAC, known bugs, PO answers, BVA boundaries, workflow states, toast messages, automation findings

## 2026-06-27 — Init
- Wiki created for domain: CC Super App (full)
- Root: `/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/wiki/`
- Schema written covering 9 entity types across all app modules
