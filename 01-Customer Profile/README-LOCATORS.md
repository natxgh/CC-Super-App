# Customer Profile — Playwright Locators Summary

> **📚 Quick Navigation**

## 📋 Files Created

ได้สร้าง Playwright Locators reference documents สำหรับ Customer Profile feature ทั้ง 7 modules:

| File | Purpose | Content |
|------|---------|---------|
| **LOCATORS.md** | 🎯 **Main Reference** | Complete locator list for all 7 features (VCP, ACP, UCP, DCP, VPRD, VSVC, VCC) |
| **customer-profile-locators.md** | Supporting document | Login page + detailed section breakdowns |
| **PLAYWRIGHT-SETUP.md** | Setup guide | Installation, credentials, examples, troubleshooting |
| **tests/feature-tests-template.spec.js** | Test templates | Ready-to-use Playwright test code for each feature |

---

## 🎯 7 Features Mapped

| # | Feature | Feature Name | Pages | Locators |
|----|---------|--------------|-------|----------|
| 1️⃣ | **VCP** | View Customer Profile | List + Detail | [LOCATORS.md §1,3](#) |
| 2️⃣ | **ACP** | Add Customer Profile | Add Form | [LOCATORS.md §2](#) |
| 3️⃣ | **UCP** | Update Customer Profile | Edit Form | [LOCATORS.md §3B](#) |
| 4️⃣ | **DCP** | Delete Customer Profile | Delete Dialog | [LOCATORS.md §3C](#) |
| 5️⃣ | **VPRD** | View Customer Product | Product Tab + Add | [LOCATORS.md §4](#) |
| 6️⃣ | **VSVC** | View Customer Service | Service Tab + Add | [LOCATORS.md §5](#) |
| 7️⃣ | **VCC** | View Customer Case | Case Tab | [LOCATORS.md §6](#) |

---

## 🔑 Key Locators (Quick Reference)

### Login Page
```javascript
// URL
https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list

// Inputs
#username              // Username field
#password              // Password field
#organization          // Organization field

// Buttons
button:has-text("เข้าสู่ระบบ")   // Login button
```

### Customer List Page (VCP)
```javascript
// Controls
button:has-text("Add")                    // Add Customer button
input[type="text"], input[type="search"]  // Search input
select, [role="combobox"]                 // Type filter

// Table
table, [role="grid"]                      // Table container
tbody tr, [role="row"]                    // Customer rows
button:has-text("View")                   // View button
button:has-text("Edit")                   // Edit button
button:has-text("Delete")                 // Delete button
```

### Add/Edit Customer Form (ACP / UCP)
```javascript
// Required Fields
input[type="email"], input[name*="email"]    // Email (required)
input[type="tel"], input[name*="phone"]      // Phone (required)

// Personal Details
input[name*="firstName"]          // First Name
input[name*="lastName"]           // Last Name
input[type="date"], input[name*="dob"]  // Date of Birth
input[name*="citizen"]            // Citizen ID (13 digits)

// Photo
input[type="file"]                // Photo upload (3MB max: JPG/PNG/JPEG)

// Address
input[name*="address"]            // Registered Address
input[name*="currentAddress"]     // Current Address (if different)
input[type="checkbox"][name*="sameAddress"]  // Same As Registered

// Preferences
select[name*="userType"]          // Individual / Corporate
select[name*="language"]          // Thai / English
select[name*="contactPref"]       // Contact Preference

// Custom Fields
input[name*="company"]            // Company Name
input[name*="employeeId"]         // Employee ID
input[name*="lineId"]             // Line ID
input[name*="license"]            // Driving License
input[name*="position"]           // Position

// Controls
button:has-text("Save")           // Save button
button:has-text("Cancel")         // Cancel button
```

### Customer Detail Page (VCP Detail)
```javascript
// Tabs
[role="tab"]:has-text("Customer")     // Customer tab
[role="tab"]:has-text("Product")      // Product tab
[role="tab"]:has-text("Service")      // Service tab
[role="tab"]:has-text("Case")         // Case tab

// Controls
button:has-text("Edit")           // Edit button
button:has-text("Delete")         // Delete button
```

### Product/Service Tabs (VPRD / VSVC)
```javascript
button:has-text("Add")            // Add Product/Service button
table, [role="grid"]              // Product/Service list
tbody tr, [role="row"]            // Product/Service rows
text="No results found"           // Empty state message

// Add Form (All Fields Required)
input[name*="name"]               // Name
select[name*="type"]              // Type
input[name*="number"]             // Number
select[name*="status"]            // Status
```

### Case Tab (VCC)
```javascript
tbody tr, [role="row"]            // Case rows (clickable)
text="Case No."                   // Case number
text="Subject"                    // Case subject
```

### Delete Dialog (DCP)
```javascript
[role="dialog"]                   // Dialog container
text="Confirm Delete"             // Dialog title
button:has-text("Confirm")        // Confirm delete button
button:has-text("Cancel")         // Cancel button
```

### Error Messages
```javascript
[class*="error"]                  // Error message container
text=/required|empty/i            // Required field error
text=/invalid.*format/i           // Format validation error
text=/duplicate/i                 // Duplicate value error
text=/cannot be deleted/i         // Delete with active items error

// Specific messages
text="Please enter an email address"
text="Please enter a mobile number"
text="Duplicate email address"
text="Invalid email address format"
text="Invalid citizen id format"
text="Invalid date of birth format"
text="Invalid upload photo file"
text="The file size must not exceed 3MB"
text="The customer cannot be deleted"
```

### Success Messages
```javascript
[class*="toast"], [class*="success"]   // Toast/notification container
text="Success"                         // Success message
text=/บันทึก|แก้ไข|ลบ/               // Thai success messages
```

---

## 📖 How to Use

### 1. **For Manual Testing**
Open **LOCATORS.md** and find the section for the feature you're testing. Use the locator patterns to inspect elements in the browser developer tools.

### 2. **For Automated Testing with Playwright**
```bash
# Run test templates with your credentials
export TEST_PASSWORD="your_password"
export TEST_ORG="your_organization"

# Run all tests
npx playwright test tests/feature-tests-template.spec.js

# Run specific feature tests
npx playwright test -g "VCP" --reporter=list
npx playwright test -g "ACP" --reporter=list
```

### 3. **For Inspecting Elements Interactively**
```bash
# Start Playwright Inspector
npx playwright test --debug

# Or use Code Generator
npx playwright codegen https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list
```

### 4. **For Writing Custom Tests**
Reference **PLAYWRIGHT-SETUP.md** for examples and patterns, then build your tests using locators from **LOCATORS.md**.

---

## 🔗 Feature-to-Document Mapping

### VCP — View Customer Profile
- **Locators:** LOCATORS.md §1 (List), §3 (Detail)
- **Tests:** feature-tests-template.spec.js > `test.describe('VCP')`
- **Design:** customer-profile-test-design.md > VCP1-5

### ACP — Add Customer Profile
- **Locators:** LOCATORS.md §2
- **Tests:** feature-tests-template.spec.js > `test.describe('ACP')`
- **Design:** customer-profile-test-design.md > ACP1-7

### UCP — Update Customer Profile
- **Locators:** LOCATORS.md §3B
- **Tests:** feature-tests-template.spec.js > `test.describe('UCP')`
- **Design:** customer-profile-test-design.md > UCP1-3

### DCP — Delete Customer Profile
- **Locators:** LOCATORS.md §3C
- **Tests:** feature-tests-template.spec.js > `test.describe('DCP')`
- **Design:** customer-profile-test-design.md > DCP1-4

### VPRD — View Customer Product
- **Locators:** LOCATORS.md §4
- **Tests:** feature-tests-template.spec.js > `test.describe('VPRD')`
- **Design:** customer-profile-test-design.md > VPRD1-2

### VSVC — View Customer Service
- **Locators:** LOCATORS.md §5
- **Tests:** feature-tests-template.spec.js > `test.describe('VSVC')`
- **Design:** customer-profile-test-design.md > VSVC1-2

### VCC — View Customer Case
- **Locators:** LOCATORS.md §6
- **Tests:** feature-tests-template.spec.js > `test.describe('VCC')`
- **Design:** customer-profile-test-design.md > VCC1-2

---

## ✅ Locator Validation Checklist

When testing each feature, verify:

- [ ] **Login Page** — Username, Password, Organization inputs + button work
- [ ] **List Page (VCP)** — Search, filter, View/Edit/Delete buttons accessible
- [ ] **Add Form (ACP)** — All required fields (Email, Phone) + optional fields present
- [ ] **Detail Page (VCP)** — Tabs load, sections display correctly
- [ ] **Edit Form (UCP)** — Form pre-fills + Save/Cancel buttons work
- [ ] **Delete Dialog (DCP)** — Confirmation shows before deletion
- [ ] **Product Tab (VPRD)** — List + Add button functional
- [ ] **Service Tab (VSVC)** — List + Add button functional
- [ ] **Case Tab (VCC)** — Cases display + clickthrough to detail
- [ ] **Errors** — Validation messages appear for invalid input
- [ ] **Success** — Toast messages show after Save/Delete/Add

---

## 📞 Support

If locators don't match actual elements:

1. Check browser console for CSS class/ID changes
2. Use `npx playwright test --debug` to inspect live
3. Run `npx playwright codegen` to generate fresh selectors
4. Update **LOCATORS.md** with verified selectors
5. Report changes to ensure consistency

---

**Document Created:** 2026-06-15  
**Playwright Version:** Latest (@playwright/test)  
**Status:** ✅ Complete — Ready for testing  
**Source:** customer-profile-test-design.md (7 features, 2 files reference)

---

### 🚀 Quick Start Commands

```bash
# 1. Install
npm install --save-dev @playwright/test
npx playwright install

# 2. Setup credentials
export TEST_PASSWORD="your_password"
export TEST_ORG="your_organization"

# 3. Run tests
npx playwright test tests/feature-tests-template.spec.js

# 4. Debug
npx playwright test --debug

# 5. Generate new selectors
npx playwright codegen https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list
```
