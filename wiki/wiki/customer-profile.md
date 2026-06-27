# Customer Profile (CP)

Feature: CRM — Contact Management · Module 01
CMS Path: `/cms/contacts`
Test Account: `ketwadee` · Role: All Permission - Contact Management

## Feature Scope

| Code | Feature |
|------|---------|
| VCP | View Customer Profile (List + Detail) |
| ACP | Add Customer Profile |
| UCP | Update Customer Profile |
| DCP | Delete Customer Profile |
| VPRD | View Customer Product (Phase: Dummy + Add Product) |
| VSVC | View Customer Service (Phase: Dummy + Add Service) |
| VCC | View Customer Case |
| VCL | View Customer List (Toggle Table / Grid View) |

## Key Business Rules

### Required Fields
- **Email\*** (required) — ทำหน้าที่เป็น Username, ต้อง unique
- **Phone\*** (required) — ต้อง unique
- ฟิลด์อื่นทั้งหมด optional

### Validation Rules
| Field | Rule |
|-------|------|
| Email | format `a@b.c` · ซ้ำ = toast **"Email already exists"** · ผิด format = **"Invalid email format"** |
| Phone | ต้อง unique · ซ้ำ = toast **"Duplicate phone number"** · invalid format = **"Invalid mobile number"** |
| Citizen ID | 13 หลักตัวเลขพอดี ไม่ตรวจ MOD11 · error: **"Invalid CitizenID format"** |
| DOB | อดีต + วันนี้ = ผ่าน · อนาคต = error (datepicker ปิด future dates) |
| Photo | JPG/PNG/JPEG เท่านั้น · max 3MB · error: generic **"Error"** toast |

### Display Fallback
- ไม่มี First/Last name → แสดง **Email** แทน Display Name
- ไม่มี Type → แสดง **"N/A"**

### Delete Rules
- ต้อง confirm dialog ก่อนลบ (Confirm / Cancel)
- Customer ที่มี active Case/Product/Service → **บล็อก** การลบ
- Error toast เมื่อ block: **"Customer has active warranty products"**

### View Toggle (VCL — TS-10)
- Default: Table View (☰ highlighted)
- Grid View (⊞): แสดงเป็น Card layout ต่อลูกค้า 1 ใบ
- State: Table View ↔ Grid View (toggle via icon)

### Search / Filter
- Keyword: First Name, Last Name, Phone No., Email
- Filter: Type (Bronze/Silver/Gold/Platinum)
- Empty state: **"No results found."** (ไม่ใช่ "No entries to show")

## Toast Messages (Confirmed)
| Action | Toast EN |
|--------|----------|
| Add success | toast "Success" + redirect to List |
| Update success | toast "Success" |
| Delete success | toast "Success" |
| Email ซ้ำ | "Email already exists" |
| Invalid email | "Invalid email format" |
| Invalid Citizen ID | "Invalid CitizenID format" |
| Invalid phone | "Invalid mobile number" |
| Photo error | "Error" (generic) |
| Block delete | "Customer has active warranty products" |

## Test Scenarios Summary
| ID | Name | Type |
|----|------|------|
| TS-01 | Search + filter + view detail | ✅ |
| TS-02 | Add customer profile (full) | ✅ |
| TS-03 | Update customer profile | ✅ |
| TS-04 | Delete customer profile | ✅ |
| TS-05 | View Product/Service/Case + navigate to Case Detail | ✅ |
| TS-06 | Add product + service (QA Phase Only) | ✅ |
| TS-07 | Add customer — DOB = today | ✅ |
| TS-08 | Display fallback (no name → Email, no Type → N/A) | ✅ |
| TS-09 | Pagination (next/prev/rows per page) | ✅ |
| TS-10 | Toggle Table/Grid view | ✅ |
| TA-01..TA-19 | Alternative / validation cases | ❌ |

## PO Answers Applied (12/06/2026 + round-2)
- Q1+Q9: Username = Email (no separate field)
- Q2: DOB อนาคต = error
- Q3: Photo JPG/PNG/JPEG, max 3MB
- Q5: Delete = Dialog → Confirm/Cancel
- Q6: ลบ customer ที่มี active items ไม่ได้ (block)
- Q7: Search by First/Last Name/Phone/Email + Filter: Type
- Q8: VCC Clickthrough ไปหน้า Case detail ได้
- Q10: Citizen ID ตรวจ 13 หลัก ไม่ตรวจ MOD11

## Open HAs (VCL — TS-10, 27/06/2026)
- HA-VCL1: View preference persist ข้าม session ไหม? (propose: reset กลับ Table View)
- HA-VCL2: Grid View มี pagination เหมือน Table ไหม?
- HA-VCL3: Search ขณะอยู่ใน Grid View ยังคง Grid layout ไหม?

## Related Pages
- [Customer Appointment](customer-appointment.md)
- [Customer Form Configuration](customer-form-configuration.md)
- [Linkage Customer ↔ Case](linkage-customer-case.md)
- [Case & Ticket Management](case-ticket-management.md)
- [CC Super App Overview](cc-super-app-overview.md)
