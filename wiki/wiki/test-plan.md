# Test Plan — CC Super App

Version: 1.1 · Date: 2026-06-10
Prepared by: Ketwadee Kaewmanee

## Approach
- **Design All → Execute All** (ไม่ทำ feature-by-feature แบบ sequential)
- **Black Box**: EP / BVA / State Transition / Use Case
- Oracle: Walkthrough Deck + QA Confirm Log ใน Lark Base (แทน Figma/Detailed Spec)
- Risk-based: P1–P3 full depth · P4 smoke only

## Timeline (16 working days, 9–30 Jun 2026)
| Phase | Dates | Content |
|-------|-------|---------|
| Setup | Jun 9 | Env + seed data (P7/P8 via DB) |
| Design All | Jun 10–22 | P1 (3d) → P2 (3d) → P3 (2d) → P4 (1d) |
| Execute All | Jun 23–30 | P1 (2d) → P2 (2d) → P3 (2d) + P4 + Report |

## Priority Scope
| Priority | Module | Level |
|---------|--------|-------|
| P1 | Customer Profile, Appointment, Form Configuration, Custom Fields | Full |
| P2 | Product & Inventory, Spare Parts, Case/Ticket, Assignment Board | Full |
| P3 | Order Management, Product/Spare Parts Stock, Case Dashboard, User Management | Full |
| P4 | Product Dashboard, Org/Unit/Skill/Area, Workflow Config, Reports | Smoke |

## Entry Criteria
- Dev deploy feature ลง QA Env
- P7/P8 seed data ผ่าน DB + QA verified
- Assignment Board เปิดได้ (ไม่ค้างโหลด)

## Exit Criteria
- TC ทุก case ใน P1–P4 run ครบ 100%
- ไม่มี Defect Critical/High ค้างอยู่
- Medium/Low accepted โดย PM/PO
- ส่ง QA Test Report

## Key Risks
| Risk | Level | Mitigation |
|------|-------|-----------|
| BRD เป็น high-level (ไม่มี Detailed Spec/Figma) | สูง | QA Confirm Log กับ Dev/PO |
| Assignment Board ค้างโหลด | สูง | แจ้ง Dev ก่อน P3 Execute |
| Spec เปลี่ยนหลัง Design | กลาง | Freeze spec หลัง 20 Jun |
| P3 Execute เวลาแน่น | กลาง | Cut Case Historical/EN ก่อนถ้าจำเป็น |

## Out of Scope
- P5: Workflow Automation / SLA Escalation
- P6: Dynamic Forms & Custom Fields config UI
- Mobile App integration / Dispatch to MadLink
- Map/GPS, IoT Alert, CoPilot/KMS
- Appointment Reminder feature

## Related Pages
- [CC Super App Overview](cc-super-app-overview.md)
- [Automation Environment](automation-env.md)
