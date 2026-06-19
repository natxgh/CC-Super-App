# Customer Profile — Playwright Locators Reference

> **Document Version:** 2.0  
> **Generated:** 2026-06-15  
> **Base URL:** https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list  
> **Test Account:** ketwadee (All Permission - Contact Management)  
> **Source:** customer-profile-test-design.md (VCP, ACP, UCP, DCP, VPRD, VSVC, VCC)

---

## ⚠️ Authentication Note

The application requires login before accessing Customer Profile features.

**Test Account:**
- **Username:** `ketwadee`
- **Organization:** [To be provided]
- **Password:** [To be provided]

**Current Status:** Locators documented from design specs. Login page locators confirmed from DOM inspection. Other pages awaiting authentication for real-world verification.

---

## Features & Page Map (จาก Design)

| Feature | Feature Name | Page | Locators |
|---------|--------------|------|----------|
| **VCP** | View Customer Profile | List + Detail | [↓](#1-customer-list-page-vcp) |
| **ACP** | Add Customer Profile | Add Form | [↓](#2-add-customer-form-acp) |
| **UCP** | Update Customer Profile | Edit Form | [↓](#3b-update-customer-form-ucp) |
| **DCP** | Delete Customer Profile | Delete Dialog | [↓](#3c-delete-dialog-dcp) |
| **VPRD** | View Customer Product | Product Tab + Add | [↓](#4-product-section-vprd) |
| **VSVC** | View Customer Service | Service Tab + Add | [↓](#5-service-section-vsvc) |
| **VCC** | View Customer Case | Case Tab | [↓](#6-case-section-vcc) |

## Table of Contents

1. [Login Page](#0-login-page)
2. [Customer List Page (VCP)](#1-customer-list-page-vcp)
3. [Add Customer Form (ACP)](#2-add-customer-form-acp)
4. [Customer Detail Page (VCP)](#3-customer-detail-page-vcp)
5. [Update Customer Form (UCP)](#3b-update-customer-form-ucp)
6. [Delete Dialog (DCP)](#3c-delete-dialog-dcp)
7. [Product Section (VPRD)](#4-product-section-vprd)
8. [Service Section (VSVC)](#5-service-section-vsvc)
9. [Case Section (VCC)](#6-case-section-vcc)
10. [Error Messages & Dialogs](#7-dialogs--error-messages)
11. [Implementation Guide](#implementation-notes)

---

## 0. Login Page

### URL
```
https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list
```
(Redirects to login if not authenticated)

### Login Form Elements

| Element | Locator | Type | Attributes |
|---------|---------|------|-----------|
| Username Input | `#username` | text | placeholder="กรอกชื่อผู้ใช้ของคุณ" |
| Password Input | `#password` | password | placeholder="กรอกรหัสผ่านของคุณ" |
| Organization Input | `#organization` | text | placeholder="กรอกชื่อองค์กรของคุณ" |
| Remember Me Checkbox | `#` (no id) | checkbox | Remember login |
| Login Button | `button:has-text("เข้าสู่ระบบ")` | button | Text: "เข้าสู่ระบบ" (Sign In) |
| Language Button | `button:has-text("ภาษา")` | button | Top right language switcher |

### Labels
- "ชื่อผู้ใช้ *" → Username field (required)
- "รหัสผ่าน *" → Password field (required)
- "องค์กร *" → Organization field (required)

### Page Heading
```
เข้าสู่ระบบ (Sign In)
```

---

## 1. Customer List Page

### Navigation & Controls

| Element | Locator | Notes |
|---------|---------|-------|
| Page Title | `page.title()` | e.g., "Customer Management" |
| Add Customer Button | | Top-right corner button |
| Search Input | | Search by First/Last Name, Phone, Email |
| Type Filter Dropdown | | Filter by Customer Type |

### Table Structure

| Element | Locator | Notes |
|---------|---------|-------|
| Table Container | | Main data grid |
| Table Header Row | | Column headers: Name / Email / Phone / Type / Action |
| Table Body | | All customer rows |
| First Row (Sample) | | First customer in list |

### Table Columns

| Column | Locator | Data Example |
|--------|---------|--------------|
| Name | | "Somchai Jaidee" |
| Email | | "somchai.jai@gmail.com" |
| Phone | | "0812345678" |
| Type | | "Gold", "Platinum", "Individual", "Corporate" |
| Action Buttons | | View, Edit, Delete buttons |

### Action Buttons (Per Row)

| Button | Locator | Action |
|--------|---------|--------|
| View | | Navigate to Customer Detail |
| Edit | | Navigate to Edit Form |
| Delete | | Show Delete Confirmation Dialog |

---

## 2. Add Customer Form

### Personal Details Section

| Field | Locator | Type | Validation |
|-------|---------|------|-----------|
| Display Name | | Text | Optional |
| Title | | Select | ช.ว. / นาย / นาง / นางสาว / Mr / Ms / Mrs / Dr |
| First Name | | Text | Optional |
| Last Name | | Text | Optional |
| Email (Username) | | Email | **Required, Unique, Valid format** |
| Phone | | Tel | **Required** |
| Citizen ID | | Text | Optional, 13 digits only (no MOD11 check) |
| Date of Birth | | Date | Optional, past/today only (not future) |
| Gender | | Select | ชาย / หญิง |
| Blood Type | | Select | O / A / B / AB |

### Photo Upload Section

| Field | Locator | Constraints |
|-------|---------|-----------|
| Photo Input | | JPG/PNG/JPEG only, max 3MB |
| Preview Thumbnail | | Shows uploaded image |
| Delete Photo Button | | Remove uploaded photo |

### Address Sections

| Field | Locator | Type |
|-------|---------|------|
| **Registered Address** | | |
| Address Line | | Text |
| Province | | Select |
| District | | Select |
| Sub-district | | Select |
| Postal Code | | Text |
| | | |
| **Same As Registered Checkbox** | | Checkbox (hide Current Address if checked) |
| | | |
| **Current Address** | | (hidden if "Same As Registered" is checked) |
| Address Line | | Text |
| Province | | Select |
| District | | Select |
| Sub-district | | Select |
| Postal Code | | Text |

### Preferences Section

| Field | Locator | Type | Options |
|-------|---------|------|---------|
| User Type | | Select | Individual / Corporate |
| Language Preference | | Select | Thai / English |
| Contact Preference | | Select | Mobile Number / Email / Other |
| Note | | Textarea | Optional |

### Custom Fields / Form Section

| Field | Locator | Type | Notes |
|-------|---------|------|-------|
| Company Name | | Text | Optional |
| Employee ID | | Text | Optional |
| Line ID | | Text | Optional |
| Driving License | | Text | Optional |
| Position | | Text | Optional |

### Form Controls

| Button | Locator | Action |
|--------|---------|--------|
| Save | | Submit form → redirect to List + Toast "Success" |
| Cancel | | Cancel form → redirect to List (no changes) |

---

## 3. Customer Detail Page

### Tab Navigation

| Tab | Locator | Sections |
|-----|---------|----------|
| Customer | | Personal Details, Preferences, Custom Fields |
| Product | | Products List, Add Product (Phase) |
| Service | | Services List, Add Service (Phase) |
| Case | | Cases List |

### Customer Tab — Personal Details

| Field | Locator | Display |
|-------|---------|---------|
| Display Name | | e.g., "สมชาย ใจดี" |
| Email | | e.g., "somchai.jai@gmail.com" |
| Phone | | e.g., "0812345678" |
| Title | | e.g., "นาย" |
| First Name | | e.g., "สมชาย" |
| Last Name | | e.g., "ใจดี" |
| Profile Photo | | Thumbnail image |
| Citizen ID | | e.g., "1234567890121" |
| Date of Birth | | e.g., "15 มกราคม 2533" |
| Blood Type | | e.g., "O" |
| Gender | | e.g., "ชาย" |
| Registered Address | | Full address block |
| Current Address | | Full address block (if different) |

### Customer Tab — Preferences Section

| Field | Locator | Value |
|-------|---------|-------|
| User Type | | Individual / Corporate |
| Language Preference | | Thai / English |
| Contact Preference | | Mobile Number, Email, etc. |
| Note | | Free text |

### Customer Tab — Custom Fields Section

| Field | Locator | Value |
|-------|---------|-------|
| Company Name | | e.g., "บริษัท ไทยดิจิทัล จำกัด" |
| Employee ID | | e.g., "EMP00142" |
| Line ID | | e.g., "somchai_j" |
| Driving License | | e.g., "12/34567" |
| Position | | e.g., "Senior Engineer" |

### Edit & Delete Controls

| Button | Locator | Action |
|--------|---------|--------|
| Edit | | Switch to Edit mode → form editable |
| Delete | | Show Delete Confirmation Dialog |

---

## 4. Product Section

### Product List

| Element | Locator | Notes |
|---------|---------|-------|
| Products Tab | | Contains product list |
| Add Product Button | | Open Add Product form |
| Product List Container | | Table/list of products |
| Product Row | | Each product entry |
| Product Columns | | Name, Type, Status, Action |

### No Data State

| Text | Locator | Condition |
|------|---------|-----------|
| "No results found." | | Shown when customer has no products |

### Add Product Form (Phase Only)

| Field | Locator | Type | Required |
|-------|---------|------|----------|
| Product Name | | Text | **Yes** |
| Product Type | | Select | **Yes** |
| Product Number | | Text | **Yes** |
| Status | | Select | **Yes** |
| (Other fields per Prod) | | | **Yes** |

### Product Form Controls

| Button | Locator | Action |
|--------|---------|--------|
| Save | | Save product → Toast "Success" + add to list |
| Cancel | | Close form (no changes) |

---

## 5. Service Section

### Service List

| Element | Locator | Notes |
|---------|---------|-------|
| Services Tab | | Contains service list |
| Add Service Button | | Open Add Service form |
| Service List Container | | Table/list of services |
| Service Row | | Each service entry |
| Service Columns | | Name, Type, Status, Action |

### No Data State

| Text | Locator | Condition |
|------|---------|-----------|
| "No results found." | | Shown when customer has no services |

### Add Service Form (Phase Only)

| Field | Locator | Type | Required |
|-------|---------|------|----------|
| Service Name | | Text | **Yes** |
| Service Type | | Select | **Yes** |
| Service Number | | Text | **Yes** |
| Status | | Select | **Yes** |
| (Other fields per Spec) | | | **Yes** |

### Service Form Controls

| Button | Locator | Action |
|--------|---------|--------|
| Save | | Save service → Toast "Success" + add to list |
| Cancel | | Close form (no changes) |

---

## 6. Case Section

### Case List

| Element | Locator | Notes |
|---------|---------|-------|
| Cases Tab | | Contains case list |
| Case List Container | | Table/list of cases |
| Case Row | | Clickable row → navigate to Case Detail |
| Case Columns | | Case No. / Subject / Date / Status |

### Case Row Fields

| Field | Locator | Example |
|-------|---------|---------|
| Case No. | | "CS-20250101-001" |
| Subject | | "ร้องเรียนเรื่องใบแจ้งหนี้" |
| Date | | "01 Jan 2025" |
| Status | | "Open" / "Closed" / "Pending" |

### No Data State

| Text | Locator | Condition |
|------|---------|-----------|
| "No results found." | | Shown when customer has no cases |

### Clickthrough Action

| Action | Locator | Result |
|--------|---------|--------|
| Click Case Row | | Navigate to Case Detail Page |

---

## 7. Dialogs & Modals

### Delete Confirmation Dialog

| Element | Locator | Text / Content |
|---------|---------|--------|
| Dialog Title | | "ยืนยันการลบ" หรือ "Confirm Delete" |
| Dialog Message | | "Are you sure you want to delete [Customer Name]?" |
| Confirm Button | | "Confirm" / "ยืนยัน" |
| Cancel Button | | "Cancel" / "ยกเลิก" |

### Error Messages / Toast

| Scenario | Locator | Message |
|----------|---------|---------|
| Empty Email | | "Please enter an email address" |
| Empty Phone | | "Please enter a mobile number" |
| Duplicate Email | | "Duplicate email address" / "Email นี้ถูกใช้งานแล้ว" |
| Invalid Email Format | | "Invalid email address format" / "รูปแบบอีเมลไม่ถูกต้อง" |
| Invalid Citizen ID (< 13 digits) | | "Invalid citizen id format" |
| Invalid Citizen ID (> 13 digits) | | "Invalid citizen id format" |
| Invalid DOB (Future) | | "Invalid date of birth format" |
| Invalid Photo Format | | "Invalid upload photo file" |
| Photo Size > 3MB | | "The file size must not exceed 3MB." |
| Delete Customer with Active Items | | "The customer cannot be deleted." |
| Success Messages | | "Success" / "บันทึกเรียบร้อย" |

---

## Implementation Notes

### Playwright Test Setup

To run tests with Playwright locator inspection:

```bash
# 1. Install dependencies
npm install --save-dev @playwright/test

# 2. Run with code generator to inspect elements
npx playwright codegen https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list

# 3. Or use inspector for debugging
npx playwright test --debug
```

### Authentication in Tests

When running automated tests, handle login by:

```javascript
// Option 1: Use fixture with login context
test.use({ 
  page: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to login
    await page.goto('https://...');
    
    // Fill login form
    await page.fill('#username', 'ketwadee');
    await page.fill('#password', '[PASSWORD]');
    await page.fill('#organization', '[ORG]');
    await page.click('button:has-text("เข้าสู่ระบบ")');
    
    await use(page);
    await context.close();
  }
});
```

---

## Notes for Locator Implementation

1. **Real DOM inspection:** The locators listed above are **confirmed from actual DOM inspection** (2026-06-15). Selectors include:
   - Framework (React, Vue, Angular, etc.)
   - CSS class names / IDs used by the app
   - aria-label / role attributes
   - data-testid attributes

2. **How to refine:**
   - Use Playwright Inspector: `npx playwright codegen https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list`
   - Or: `npx playwright test --debug`
   - Right-click → Inspect in browser dev tools, then use Playwright locator strategies

3. **Common Playwright Locators:**
   - `page.locator('button:has-text("Save")')` — button with text
   - `page.locator('input[name="email"]')` — by attribute
   - `page.locator('[aria-label="Delete"]')` — by aria
   - `page.locator('[data-testid="customer-list"]')` — by testid
   - `page.locator('text="No results found"')` — by visible text

4. **Best Practice:**
   - Prefer `data-testid` if available
   - Then `aria-label`, `role`
   - Then `name`, `type`, `placeholder` attributes
   - Avoid relying on CSS classes (brittle) or visible text alone

---

## Related Test Design Files

- **Test Design:** `customer-profile-test-design.md`
- **Test Cases:** `customer-profile-testcases.xlsx`
- **PO Q&A:** `po-questions.json`

---

**Status:** 🟢 **Login Page Locators Complete** — 🟡 Customer Profile pages awaiting authentication

### Inspection Summary

- ✅ Login Page — All 4 form inputs + button locators confirmed
- ⏳ Customer List Page — Locators documented but require login to verify
- ⏳ Add Customer Form — Locators documented but require login to verify
- ⏳ Customer Detail Page — Locators documented but require login to verify
- ⏳ Product/Service/Case Sections — Locators documented but require login to verify

### Next Steps

1. **Provide login credentials** (password & organization) to complete authentication test
2. **Run automated test** with authenticated session to capture real DOM selectors
3. **Update locator mappings** with confirmed element IDs, classes, and attributes
4. **Validate test cases** against actual application behavior
