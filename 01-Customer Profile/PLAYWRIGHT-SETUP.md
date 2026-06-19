# Playwright Setup & Locator Guide

Customer Profile feature testing with Playwright

---

## Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Set Test Credentials

Create `.env.test` file with login credentials:

```env
TEST_PASSWORD=your_password_here
TEST_ORG=your_organization_here
```

Or set environment variables:

```bash
export TEST_PASSWORD="your_password"
export TEST_ORG="your_organization"
```

### 3. Run Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/feature-tests-template.spec.js

# Run with UI mode
npx playwright test --ui

# Run with debugging
npx playwright test --debug

# Run specific test
npx playwright test -g "VCP1-TC1"
```

---

## Locator Reference

All locators documented in [`customer-profile-locators.md`](customer-profile-locators.md)

### Quick Locator Examples

#### Login Page
```javascript
// Username field
await page.fill('#username', 'ketwadee');

// Password field
await page.fill('#password', 'your_password');

// Organization field
await page.fill('#organization', 'your_org');

// Login button
await page.click('button:has-text("เข้าสู่ระบบ")');
```

#### Customer List Page
```javascript
// Add Customer button
await page.click('button:has-text("Add")');

// Search input
await page.fill('input[type="text"], input[type="search"]', 'search term');

// Table rows
const rows = await page.locator('tbody tr, [role="row"]').count();

// View button on first customer
await page.locator('tbody tr').first().locator('button:has-text("View")').click();
```

#### Customer Detail Page
```javascript
// Personal Details section
await page.locator('text=/Personal|ส่วนบุคคล/i').isVisible();

// Preferences section
await page.locator('text=/Preference|ความชอบ/i').isVisible();

// Custom Fields section
await page.locator('text=/Custom|สำหรับเฉพาะ/i').isVisible();

// Edit button
await page.click('button:has-text("Edit")');

// Delete button
await page.click('button:has-text("Delete")');
```

#### Add/Edit Customer Form
```javascript
// Email input
await page.fill('input[type="email"], input[name*="email"]', 'email@example.com');

// Phone input
await page.fill('input[type="tel"], input[name*="phone"]', '0812345678');

// Citizen ID input
await page.fill('input[name*="citizen"]', '1234567890121');

// Date of Birth input
await page.fill('input[type="date"], input[name*="dob"]', '2533-01-15');

// Photo upload
await page.locator('input[type="file"]').setInputFiles('path/to/photo.jpg');

// Save button
await page.click('button:has-text("Save")');

// Cancel button
await page.click('button:has-text("Cancel")');
```

#### Product/Service/Case Tabs
```javascript
// Product tab
await page.click('[role="tab"]:has-text("Product")');

// Service tab
await page.click('[role="tab"]:has-text("Service")');

// Case tab
await page.click('[role="tab"]:has-text("Case")');
```

---

## Files Overview

### Test Files
| File | Purpose |
|------|---------|
| `tests/inspect-after-login.spec.js` | DOM inspection & page structure analysis |
| `tests/feature-tests-template.spec.js` | Feature test templates for all modules (VCP, ACP, UCP, DCP, VPRD, VSVC, VCC) |
| `test-output.log` | Output from first inspection run |
| `test-output-2.log` | Output from second inspection run (login page details) |

### Configuration Files
| File | Purpose |
|------|---------|
| `playwright.config.js` | Playwright configuration |
| `package.json` | NPM dependencies |
| `get-locators.js` | Node.js script for locator extraction |
| `generate-locators.sh` | Shell script for Playwright codegen |

### Documentation Files
| File | Purpose |
|------|---------|
| `customer-profile-locators.md` | **Main locator reference** — all selectors & attributes |
| `PLAYWRIGHT-SETUP.md` | This file — setup & quick reference |
| `customer-profile-test-design.md` | QA test design document (parent) |
| `customer-profile-testcases.xlsx` | Detailed test cases (parent) |

---

## Common Playwright Patterns

### Waiting Strategies
```javascript
// Wait for navigation
await page.waitForNavigation();

// Wait for URL change
await page.waitForURL('**/customer/**');

// Wait for element
await page.locator('button').waitFor({ state: 'visible' });

// Wait for network
await page.waitForLoadState('networkidle');

// Wait for timeout
await page.waitForTimeout(500);
```

### Assertions
```javascript
// Element visibility
await expect(page.locator('button')).toBeVisible();

// Element text
await expect(page.locator('h1')).toContainText('Customer');

// Input value
await expect(page.locator('#username')).toHaveValue('ketwadee');

// Element count
await expect(page.locator('tbody tr')).toHaveCount(5);
```

### Error Handling
```javascript
// Graceful checks
const exists = await page.locator('button').isVisible().catch(() => false);

// Try-catch for actions
try {
  await page.click('button');
} catch (error) {
  console.log('Button not clickable:', error.message);
}
```

---

## Test Fixtures & Setup

### Built-in Fixture

All tests use an implicit authentication flow. To customize:

```javascript
test.beforeEach(async ({ page }) => {
  // This runs before each test
  await authenticateAndNavigate(page);
});

test.afterEach(async ({ page }) => {
  // This runs after each test
  // Add cleanup if needed
});
```

---

## Troubleshooting

### Issue: Test times out on login page

**Solution:** Check that credentials are correct in environment variables:

```bash
echo $TEST_PASSWORD
echo $TEST_ORG
```

### Issue: Element not found (stale reference)

**Solution:** Use dynamic locators instead of storing element references:

```javascript
// ❌ Wrong
const btn = await page.locator('button').first();
await page.waitForTimeout(1000);
await btn.click(); // May fail — reference is stale

// ✅ Correct
await page.locator('button').first().click(); // Fresh lookup
```

### Issue: Flaky tests (intermittent failures)

**Solution:** Use proper wait strategies:

```javascript
// ❌ Wrong
await page.waitForTimeout(2000);
await page.click('button');

// ✅ Correct
await page.locator('button').waitFor({ state: 'visible' });
await page.click('button');
```

### Issue: Can't find button by text

**Solution:** Check button text with different patterns:

```javascript
// Debug: Print all button texts
const buttons = await page.locator('button').allTextContents();
console.log('Buttons:', buttons);

// Try different patterns
await page.click('button:has-text("Save")');           // Exact text
await page.click('button:has-text(/save/i)');          // Case-insensitive
await page.click('button:has-text("Save") >> nth=0');  // nth match
```

---

## Playwright Inspector & Code Generation

### Generate test code interactively:

```bash
npx playwright codegen https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list
```

This opens a browser where you can:
1. Click/interact with elements
2. See suggested Playwright code in the sidebar
3. Copy code directly into your tests

### Debug mode:

```bash
npx playwright test --debug
```

Opens with Inspector:
- Pause execution
- Step through code
- Inspect DOM in real-time
- Watch mode

---

## Best Practices

1. **Use meaningful test names:** `test('VCP1-TC1: Customer List with data')`
2. **Keep locators stable:** Prefer `data-testid`, `aria-label`, or `name` attributes
3. **Avoid brittle CSS:** Don't rely on visual CSS classes or hierarchy
4. **Group related tests:** Use `test.describe()` for feature grouping
5. **Mock external APIs:** Use `page.route()` for network interception
6. **Take screenshots on failure:** Built-in with `screenshot: 'only-on-failure'`
7. **Use fixtures for setup:** Avoid duplicating login code

---

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
        env:
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
          TEST_ORG: ${{ secrets.TEST_ORG }}
```

---

## Resources

- **Playwright Docs:** https://playwright.dev
- **Locator Guide:** https://playwright.dev/docs/locators
- **Best Practices:** https://playwright.dev/docs/best-practices
- **Debug Guide:** https://playwright.dev/docs/debug

---

**Generated:** 2026-06-15  
**Status:** ✅ Ready for testing (requires login credentials)
