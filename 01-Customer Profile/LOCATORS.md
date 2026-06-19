# Customer Profile — Playwright Locators (Complete Reference)

> **Document Version:** 2.0  
> **Generated:** 2026-06-15  
> **Base URL:** https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list  
> **Test Account:** ketwadee  
> **Source:** customer-profile-test-design.md (7 Features: VCP, ACP, UCP, DCP, VPRD, VSVC, VCC)

---

## Quick Feature Map

| Feature | Feature Name | Description | Pages |
|---------|--------------|-------------|-------|
| **VCP** | View Customer Profile | Display list of customers + view detail | List, Detail |
| **ACP** | Add Customer Profile | Create new customer record | Add Form |
| **UCP** | Update Customer Profile | Modify existing customer data | Edit Form |
| **DCP** | Delete Customer Profile | Remove customer (with confirmation) | Delete Dialog |
| **VPRD** | View Customer Product | View products + add new (Phase) | Product Tab, Add Form |
| **VSVC** | View Customer Service | View services + add new (Phase) | Service Tab, Add Form |
| **VCC** | View Customer Case | View cases + navigate to detail | Case Tab |

---

## 0️⃣ Login Page (Prerequisite)

**URL:** `https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list`

### Form Inputs

| Field | Locator | Selector Details | Required |
|-------|---------|-----------------|----------|
| Username | `#username` | `<input id="username" type="text" placeholder="กรอกชื่อผู้ใช้ของคุณ">` | ✅ Yes |
| Password | `#password` | `<input id="password" type="password" placeholder="กรอกรหัสผ่านของคุณ">` | ✅ Yes |
| Organization | `#organization` | `<input id="organization" type="text" placeholder="กรอกชื่อองค์กรของคุณ">` | ✅ Yes |
| Remember Me | `#[no-id]` | `<input type="checkbox">` | Optional |

### Buttons & Controls

| Element | Locator | Text |
|---------|---------|------|
| Login Button | `button:has-text("เข้าสู่ระบบ")` | เข้าสู่ระบบ |
| Language Switcher | `button:has-text("ภาษา")` | ภาษา |

### Page Labels (th)

- ชื่อผู้ใช้ * (Username)
- รหัสผ่าน * (Password)
- องค์กร * (Organization)

---

## 1️⃣ Customer List Page (VCP — View Customer Profile)

**Route:** `/cc/contacts-list` (after login)

### Page Controls

| Element | Locator | Purpose | Notes |
|---------|---------|---------|-------|
| **Add Customer Button** | `button:has-text("Add")`, `button:has-text("เพิ่ม")` | Navigate to Add Form | Top-right corner |
| **Search Input** | `input[type="text"]`, `input[type="search"]` | Search by: First Name, Last Name, Phone, Email | Placeholder varies |
| **Type Filter** | `select`, `[role="combobox"]` | Filter: Individual, Corporate, Gold, Platinum, etc. | Dropdown/Select |

### Table Structure

| Element | Locator | Description |
|---------|---------|-------------|
| **Table Container** | `table`, `[role="grid"]`, `[role="table"]` | Main data table |
| **Table Header** | `thead`, `th`, `[role="columnheader"]` | Column names |
| **Table Body** | `tbody`, `[role="rowgroup"]` | Data rows |
| **Data Row** | `tbody tr`, `[role="row"]` | Single customer row |
| **First Row** | `tbody tr:first-of-type`, `[role="row"]:first-of-type` | First customer in list |

### Table Columns

| Column | Expected Data | Locator Pattern |
|--------|---------------|-----------------|
| **Name** | e.g., "สมชาย ใจดี" | `td:nth-child(1)` or text locator |
| **Email** | e.g., "somchai.jai@gmail.com" | `td:nth-child(2)` or email pattern |
| **Phone** | e.g., "0812345678" | `td:nth-child(3)` or phone pattern |
| **Type** | e.g., "Gold", "Individual" | `td:nth-child(4)` or select pattern |
| **Action** | View / Edit / Delete buttons | `td:nth-child(5)` |

### Row Action Buttons

| Button | Locator | Action |
|--------|---------|--------|
| **View** | `button:has-text("View")`, `button:has-text("ดู")` | Navigate to Detail Page |
| **Edit** | `button:has-text("Edit")`, `button:has-text("แก้ไข")` | Navigate to Edit Form |
| **Delete** | `button:has-text("Delete")`, `button:has-text("ลบ")` | Show Delete Confirmation |

### Empty State

| Scenario | Locator | Message |
|----------|---------|---------|
| No customers | `text="No results found"` | Or Thai: "ไม่พบข้อมูล" |
| No search results | `text="No results found"` | After search with no matches |

---

## 2️⃣ Add Customer Form (ACP — Add Customer Profile)

**Route:** `/cc/contacts/new` or similar (accessed via "Add Customer" button)

### Personal Details Section

| Field | Locator | Type | Required | Notes |
|-------|---------|------|----------|-------|
| **Display Name** | `input[name*="displayName"]` | text | Optional | Thai/English name |
| **Title** | `select[name*="title"]` | select | Optional | ช.ว. / นาย / นาง / นางสาว / Mr / Ms / Mrs / Dr |
| **First Name** | `input[name*="firstName"]` | text | Optional | |
| **Last Name** | `input[name*="lastName"]` | text | Optional | |
| **Email (Username)** | `input[type="email"]`, `input[name*="email"]` | email | ✅ **Required** | Must be unique, valid format |
| **Phone** | `input[type="tel"]`, `input[name*="phone"]` | tel | ✅ **Required** | Mobile number format |
| **Citizen ID** | `input[name*="citizen"]`, `input[name*="id"]` | text | Optional | Exactly 13 digits (no MOD11 check) |
| **Date of Birth** | `input[type="date"]`, `input[name*="dob"]` | date | Optional | Past/Today only (not future) |
| **Gender** | `select[name*="gender"]` | select | Optional | ชาย / หญิง |
| **Blood Type** | `select[name*="blood"]` | select | Optional | O / A / B / AB |

### Photo Upload Section

| Element | Locator | Constraints |
|---------|---------|------------|
| **Photo Input** | `input[type="file"]` | JPG/PNG/JPEG only, max 3MB |
| **Preview Thumbnail** | `img[class*="preview"]`, `[class*="thumbnail"]` | Shows uploaded image |
| **Delete Photo Button** | `button:has-text("Delete")`, `[aria-label*="delete"]` | Remove uploaded photo |

### Registered Address Section

| Field | Locator | Type |
|-------|---------|------|
| **Address Line** | `input[name*="address"], textarea[name*="address"]` | text/textarea |
| **Province** | `select[name*="province"]` | select |
| **District** | `select[name*="district"]` | select |
| **Sub-district** | `select[name*="subdistrict"]` | select |
| **Postal Code** | `input[name*="postal"]` | text |

### Address Toggle

| Element | Locator | Purpose |
|---------|---------|---------|
| **Same As Registered** | `input[type="checkbox"][name*="sameAddress"]` | Checkbox to hide Current Address section |

### Current Address Section (if not "Same As Registered")

| Field | Locator | Type |
|-------|---------|------|
| **Address Line** | `input[name*="currentAddress"]`, `textarea[name*="current"]` | text/textarea |
| **Province** | `select[name*="currentProvince"]` | select |
| **District** | `select[name*="currentDistrict"]` | select |
| **Sub-district** | `select[name*="currentSubdistrict"]` | select |
| **Postal Code** | `input[name*="currentPostal"]` | text |

### Preferences Section

| Field | Locator | Type | Options |
|-------|---------|------|---------|
| **User Type** | `select[name*="userType"]` | select | Individual / Corporate |
| **Language Preference** | `select[name*="language"]` | select | Thai / English |
| **Contact Preference** | `select[name*="contactPref"]` | select | Mobile / Email / Other |
| **Note** | `textarea[name*="note"]` | textarea | Free text, optional |

### Custom Fields / Form Section

| Field | Locator | Type | Optional |
|-------|---------|------|----------|
| **Company Name** | `input[name*="company"]` | text | ✅ |
| **Employee ID** | `input[name*="employeeId"]` | text | ✅ |
| **Line ID** | `input[name*="lineId"]` | text | ✅ |
| **Driving License** | `input[name*="license"]` | text | ✅ |
| **Position** | `input[name*="position"]` | text | ✅ |

### Form Controls

| Button | Locator | Action |
|--------|---------|--------|
| **Save** | `button:has-text("Save")`, `button:has-text("บันทึก")` | Submit form → redirect to List + Toast "Success" |
| **Cancel** | `button:has-text("Cancel")`, `button:has-text("ยกเลิก")` | Cancel → redirect to List (no changes saved) |

---

## 3️⃣ Customer Detail Page (VCP — View Customer Profile — Detail)

**Route:** `/cc/contacts/{id}` (accessed via View button)

### Tab Navigation

| Tab | Locator | Content |
|-----|---------|---------|
| **Customer** | `[role="tab"]:has-text("Customer")` | Personal Details, Preferences, Custom Fields |
| **Product** | `[role="tab"]:has-text("Product")`, `[role="tab"]:has-text("สินค้า")` | View Products + Add Product |
| **Service** | `[role="tab"]:has-text("Service")`, `[role="tab"]:has-text("บริการ")` | View Services + Add Service |
| **Case** | `[role="tab"]:has-text("Case")`, `[role="tab"]:has-text("คดี")` | View Cases |

### Personal Details Display (Read-only / View Mode)

| Field | Locator Pattern | Display Format |
|-------|-----------------|----------------|
| **Display Name** | `text="Display Name"` + value | e.g., "สมชาย ใจดี" |
| **Email** | `text="Email"` + value | e.g., "somchai.jai@gmail.com" |
| **Phone** | `text="Phone"` + value | e.g., "0812345678" |
| **Title** | `text="Title"` + value | e.g., "นาย" |
| **First Name** | `text="First Name"` + value | e.g., "สมชาย" |
| **Last Name** | `text="Last Name"` + value | e.g., "ใจดี" |
| **Profile Photo** | `img[class*="profile"], img[class*="avatar"]` | Thumbnail image |
| **Citizen ID** | `text="Citizen ID"` + value | e.g., "1234567890121" |
| **Date of Birth** | `text="DOB"` + value | e.g., "15 มกราคม 2533" |
| **Blood Type** | `text="Blood Type"` + value | e.g., "O" |
| **Gender** | `text="Gender"` + value | e.g., "ชาย" |
| **Registered Address** | `text="Registered Address"` + block | Full address text |
| **Current Address** | `text="Current Address"` + block | Full address text (if different) |

### Preferences Section (Display)

| Field | Locator Pattern | Example |
|-------|-----------------|---------|
| **User Type** | `text="User Type"` + value | Individual / Corporate |
| **Language Preference** | `text="Language"` + value | Thai / English |
| **Contact Preference** | `text="Contact Preference"` + value | Mobile Number, Email |
| **Note** | `text="Note"` + value | Free text |

### Custom Fields Section (Display)

| Field | Locator Pattern | Example |
|-------|-----------------|---------|
| **Company Name** | `text="Company Name"` + value | บริษัท ไทยดิจิทัล จำกัด |
| **Employee ID** | `text="Employee ID"` + value | EMP00142 |
| **Line ID** | `text="Line ID"` + value | somchai_j |
| **Driving License** | `text="License"` + value | 12/34567 |
| **Position** | `text="Position"` + value | Senior Engineer |

### Detail Page Controls

| Button | Locator | Action |
|--------|---------|--------|
| **Edit** | `button:has-text("Edit")`, `button:has-text("แก้ไข")` | Switch to Edit mode |
| **Delete** | `button:has-text("Delete")`, `button:has-text("ลบ")` | Show Delete Confirmation Dialog |

---

## 3B️⃣ Update Customer Form (UCP — Update Customer Profile)

**Route:** `/cc/contacts/{id}/edit` (accessed via Edit button)

**Note:** Form structure is identical to Add Customer Form, but in Edit mode:
- All fields pre-filled with existing data
- Same validation rules apply
- Additional: Email uniqueness check excludes current customer

### Key Differences from Add Form

| Aspect | Add Form | Edit Form |
|--------|----------|-----------|
| **Pre-filled** | Empty | Current values |
| **Email Check** | Must not exist | Must not exist (except self) |
| **Save Action** | Create new | Update existing |

### Form Sections (See Section 2 for detailed locators)

- Personal Details (same locators as ACP)
- Photo Upload (same locators as ACP)
- Registered Address (same locators as ACP)
- Current Address (same locators as ACP)
- Preferences (same locators as ACP)
- Custom Fields (same locators as ACP)

### Edit Controls

| Button | Locator | Action |
|--------|---------|--------|
| **Save** | `button:has-text("Save")` | Update customer → redirect to Detail + Toast |
| **Cancel** | `button:has-text("Cancel")` | Discard changes → redirect to Detail (unchanged) |

---

## 3C️⃣ Delete Dialog (DCP — Delete Customer Profile)

**Trigger:** Click Delete button on Detail Page or List row

### Dialog/Modal Elements

| Element | Locator | Content |
|---------|---------|---------|
| **Dialog Container** | `[role="dialog"]`, `[class*="modal"]` | Modal wrapper |
| **Dialog Title** | `text="Confirm Delete"`, `text="ยืนยันการลบ"` | Title text |
| **Dialog Message** | `text=/delete.*customer/i` | "Are you sure you want to delete [Name]?" |
| **Confirm Button** | `button:has-text("Confirm")`, `button:has-text("ยืนยัน")` | Deletes customer |
| **Cancel Button** | `button:has-text("Cancel")`, `button:has-text("ยกเลิก")` | Close dialog without deleting |

### Blocking Scenarios

If customer has active items, delete is blocked:

| Scenario | Indicator |
|----------|-----------|
| **Customer has active Case** | Delete button disabled OR error on click |
| **Customer has active Product** | Delete button disabled OR error on click |
| **Customer has active Service** | Delete button disabled OR error on click |

**Error Message:** "The customer cannot be deleted." or similar

---

## 4️⃣ Product Section (VPRD — View Customer Product)

**Location:** Tab on Customer Detail Page

### Product List View

| Element | Locator | Notes |
|---------|---------|-------|
| **Products Tab** | `[role="tab"]:has-text("Product")` | Activated tab |
| **Add Product Button** | `button:has-text("Add")`, `button:has-text("เพิ่ม")` | Opens Add Product Form (Phase Only) |
| **Product List Container** | `table`, `[role="grid"]` | List of products |
| **Product Row** | `tbody tr`, `[role="row"]` | Single product entry |
| **Empty State** | `text="No results found"` | When customer has no products |

### Product List Columns

| Column | Data Example |
|--------|--------------|
| **Name** | "บัตรเดบิต Visa" |
| **Type** | "Card", "Loan", etc. |
| **Status** | "Active", "Inactive" |
| **Action** | Edit / Delete buttons (if applicable) |

### Add Product Form (Phase Only)

| Field | Locator | Type | Required |
|-------|---------|------|----------|
| **Product Name** | `input[name*="productName"]` | text | ✅ **All Required** |
| **Product Type** | `select[name*="productType"]` | select | ✅ **All Required** |
| **Product Number** | `input[name*="productNumber"]` | text | ✅ **All Required** |
| **Status** | `select[name*="status"]` | select | ✅ **All Required** |
| (other fields per spec) | `input`, `select`, `textarea` | Various | ✅ **All Required** |

### Product Form Controls

| Button | Locator | Action |
|--------|---------|--------|
| **Save** | `button:has-text("Save")` | Save product → add to list + Toast "Success" |
| **Cancel** | `button:has-text("Cancel")` | Close form (no save) |

---

## 5️⃣ Service Section (VSVC — View Customer Service)

**Location:** Tab on Customer Detail Page

### Service List View

| Element | Locator | Notes |
|---------|---------|-------|
| **Services Tab** | `[role="tab"]:has-text("Service")` | Activated tab |
| **Add Service Button** | `button:has-text("Add")`, `button:has-text("เพิ่ม")` | Opens Add Service Form (Phase Only) |
| **Service List Container** | `table`, `[role="grid"]` | List of services |
| **Service Row** | `tbody tr`, `[role="row"]` | Single service entry |
| **Empty State** | `text="No results found"` | When customer has no services |

### Service List Columns

| Column | Data Example |
|--------|--------------|
| **Name** | "ประกันชีวิต AIA" |
| **Type** | "Insurance", "Protection", etc. |
| **Status** | "Active", "Inactive" |
| **Action** | Edit / Delete buttons (if applicable) |

### Add Service Form (Phase Only)

| Field | Locator | Type | Required |
|-------|---------|------|----------|
| **Service Name** | `input[name*="serviceName"]` | text | ✅ **All Required** |
| **Service Type** | `select[name*="serviceType"]` | select | ✅ **All Required** |
| **Service Number** | `input[name*="serviceNumber"]` | text | ✅ **All Required** |
| **Status** | `select[name*="status"]` | select | ✅ **All Required** |
| (other fields per spec) | `input`, `select`, `textarea` | Various | ✅ **All Required** |

### Service Form Controls

| Button | Locator | Action |
|--------|---------|--------|
| **Save** | `button:has-text("Save")` | Save service → add to list + Toast "Success" |
| **Cancel** | `button:has-text("Cancel")` | Close form (no save) |

---

## 6️⃣ Case Section (VCC — View Customer Case)

**Location:** Tab on Customer Detail Page

### Case List View

| Element | Locator | Notes |
|---------|---------|-------|
| **Cases Tab** | `[role="tab"]:has-text("Case")` | Activated tab |
| **Case List Container** | `table`, `[role="grid"]` | List of cases |
| **Case Row** | `tbody tr`, `[role="row"]` | **Clickable** → navigate to Case Detail |
| **Empty State** | `text="No results found"` | When customer has no cases |

### Case List Columns

| Column | Data Example | Clickable |
|--------|--------------|-----------|
| **Case No.** | "CS-20250101-001" | ✅ Yes |
| **Subject** | "ร้องเรียนเรื่องใบแจ้งหนี้" | ✅ Yes |
| **Date** | "01 Jan 2025" | ✅ Yes |
| **Status** | "Open", "Closed", "Pending" | ✅ Yes |

### Case Row Navigation

| Action | Locator | Result |
|--------|---------|--------|
| **Click Row** | `tbody tr`, `[role="row"]` | Navigate to Case Detail Page |
| **Expected URL** | `/cc/cases/{caseId}` or similar | Case detail with full information |

---

## 7️⃣ Error Messages & Dialogs

### Form Validation Messages (on Submit / Field Change)

| Scenario | Locator | Message (EN/TH) |
|----------|---------|-----------------|
| **Empty Email** | `[class*="error"]`, `text=/error/i` | "Please enter an email address" / "กรุณากรอกอีเมล" |
| **Empty Phone** | `[class*="error"]` | "Please enter a mobile number" / "กรุณากรอกเบอร์โทรศัพท์" |
| **Duplicate Email** | `[class*="error"]` | "Duplicate email address" / "Email นี้ถูกใช้งานแล้ว" |
| **Invalid Email Format** | `[class*="error"]` | "Invalid email address format" / "รูปแบบอีเมลไม่ถูกต้อง" |
| **Invalid Citizen ID (< 13)** | `[class*="error"]` | "Invalid citizen id format" |
| **Invalid Citizen ID (> 13)** | `[class*="error"]` | "Invalid citizen id format" |
| **Invalid DOB (Future)** | `[class*="error"]` | "Invalid date of birth format" / "วันเกิดต้องเป็นวันอดีตหรือปัจจุบัน" |
| **Invalid Photo Format** | `[class*="error"]` | "Invalid upload photo file" / "รองรับเฉพาะไฟล์ JPG, PNG, JPEG" |
| **Photo > 3MB** | `[class*="error"]` | "The file size must not exceed 3MB." |
| **Delete w/ Active Items** | `[class*="error"]` | "The customer cannot be deleted." |

### Success Messages (Toast/Notification)

| Action | Locator | Message |
|--------|---------|---------|
| **Add Customer** | `[class*="toast"]`, `[class*="success"]` | "Success" / "บันทึกเรียบร้อย" |
| **Update Customer** | `[class*="toast"]` | "Success" / "แก้ไขเรียบร้อย" |
| **Delete Customer** | `[class*="toast"]` | "Success" / "ลบเรียบร้อย" |
| **Add Product** | `[class*="toast"]` | "Success" |
| **Add Service** | `[class*="toast"]` | "Success" |

---

## Implementation Notes

### Using These Locators in Playwright

```javascript
// Example: Login
await page.fill('#username', 'ketwadee');
await page.fill('#password', 'your_password');
await page.fill('#organization', 'your_org');
await page.click('button:has-text("เข้าสู่ระบบ")');
await page.waitForNavigation();

// Example: Search customer
await page.fill('input[type="text"]', 'somchai');

// Example: View customer
await page.locator('tbody tr').first().locator('button:has-text("View")').click();

// Example: Add customer
await page.click('button:has-text("Add")');
await page.fill('input[type="email"]', 'test@example.com');
await page.fill('input[type="tel"]', '0812345678');
await page.click('button:has-text("Save")');
```

### Best Practices

1. **Prefer unique attributes:** Use `[name*="..."]`, `[id="..."]` over text-based locators
2. **Use text locators for buttons:** Text is usually stable for buttons/links
3. **Wait for navigation:** Use `page.waitForNavigation()` after clicks that change page
4. **Check element visibility:** Use `.isVisible()` before interactions
5. **Handle async:** Use `.waitForLoadState('networkidle')` for data loads

### Locator Testing Command

```bash
# Start Playwright Inspector
npx playwright test --debug

# Or generate code interactively
npx playwright codegen https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list
```

---

## Files Reference

- **Test Design:** `customer-profile-test-design.md` (7 features, test cases, scenarios)
- **Test Cases:** `customer-profile-testcases.xlsx` (detailed test steps)
- **Playwright Setup:** `PLAYWRIGHT-SETUP.md` (setup guide + examples)
- **Feature Tests:** `tests/feature-tests-template.spec.js` (ready-to-use test templates)

---

**Status:** ✅ Locator reference complete for all 7 features  
**Last Updated:** 2026-06-15  
**Notes:** Awaiting authentication to verify CSS selectors on staging environment
