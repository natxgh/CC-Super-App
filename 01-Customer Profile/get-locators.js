const { chromium } = require('@playwright/test');

const BASE_URL = 'https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list';

async function extractLocators() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to:', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    console.log('\n=== Page Title ===');
    console.log(await page.title());

    console.log('\n=== Customer List Page Elements ===');

    // 1. Customer List Container
    const listContainer = await page.locator('[role="grid"], [class*="table"], [class*="list"]').first().count();
    console.log('List/Table found:', listContainer > 0);

    // 2. Add Customer Button
    const addBtn = await page.locator('button, [role="button"]').filter({ hasText: /Add.*Customer|เพิ่ม.*ลูกค้า/ }).first().count();
    console.log('Add Customer button found:', addBtn > 0);

    // 3. Search Bar
    const searchBar = await page.locator('input[type="text"], input[type="search"], [placeholder*="Search"], [placeholder*="ค้นหา"]').first().count();
    console.log('Search bar found:', searchBar > 0);

    // 4. Filter Type Dropdown
    const filterDropdown = await page.locator('select, [role="combobox"], [class*="dropdown"], [class*="select"]').count();
    console.log('Filter/Dropdown found:', filterDropdown > 0);

    // 5. Customer Table Headers
    console.log('\n=== Table Headers/Columns ===');
    const headers = await page.locator('th, [role="columnheader"]').allTextContents();
    headers.forEach((header, idx) => {
      if (header.trim()) console.log(`  ${idx + 1}. ${header.trim()}`);
    });

    // 6. Customer Rows
    console.log('\n=== Customer Rows ===');
    const rows = await page.locator('tbody tr, [role="row"]').count();
    console.log(`Total rows: ${rows}`);

    if (rows > 0) {
      const firstRowText = await page.locator('tbody tr, [role="row"]').first().textContent();
      console.log('First row sample:', firstRowText?.substring(0, 100));
    }

    // 7. Action Buttons (View, Edit, Delete)
    console.log('\n=== Action Buttons ===');
    const viewBtn = await page.locator('button:has-text("View"), button:has-text("ดู"), [aria-label*="View"], [aria-label*="ดู"]').first().count();
    console.log('View button found:', viewBtn > 0);

    const editBtn = await page.locator('button:has-text("Edit"), button:has-text("แก้ไข"), [aria-label*="Edit"], [aria-label*="แก้ไข"]').first().count();
    console.log('Edit button found:', editBtn > 0);

    const deleteBtn = await page.locator('button:has-text("Delete"), button:has-text("ลบ"), [aria-label*="Delete"], [aria-label*="ลบ"]').first().count();
    console.log('Delete button found:', deleteBtn > 0);

    // 8. Customer Detail Page (if available)
    console.log('\n=== Checking for Detail Page Elements ===');
    const tabNav = await page.locator('[role="tablist"], [class*="tab"], [class*="nav"]').first().count();
    console.log('Tab navigation found:', tabNav > 0);

    if (tabNav > 0) {
      const tabs = await page.locator('[role="tab"]').allTextContents();
      console.log('Tabs found:', tabs.filter(t => t.trim()).map(t => t.trim()).join(', '));
    }

    // 9. Form Fields (from Add/Edit page)
    console.log('\n=== Form Fields ===');
    const inputs = await page.locator('input, select, textarea').count();
    console.log(`Total input fields: ${inputs}`);

    // 10. Labels/Placeholders
    const labels = await page.locator('label').allTextContents();
    if (labels.length > 0) {
      console.log('Labels found:', labels.slice(0, 10).filter(l => l.trim()).map(l => l.trim()).join(', '));
    }

    console.log('\n=== Page Structure Complete ===\n');

    // Generate detailed locator list
    console.log('=== DETAILED LOCATOR MAPPINGS ===\n');

    const locators = {
      'Customer List Page': {
        container: 'page',
        pageTitle: await page.title(),
      },
      'Navigation & Controls': {
        addCustomerButton: 'button:has-text("Add")',
        searchInput: 'input[type="text"], input[type="search"]',
        typeFilter: 'select, [role="combobox"]',
      },
      'Table Elements': {
        tableContainer: '[role="grid"], table',
        tableHeader: 'thead, [role="rowgroup"]',
        tableBody: 'tbody',
        tableRows: 'tbody tr, [role="row"]',
        firstRow: 'tbody tr:first-of-type, [role="row"]:first-of-type',
      },
      'Action Buttons': {
        viewButton: 'button:has-text("View")',
        editButton: 'button:has-text("Edit")',
        deleteButton: 'button:has-text("Delete")',
      },
      'Customer Detail Page': {
        tabNavigation: '[role="tablist"]',
        customerTab: '[role="tab"]:has-text("Customer")',
        personalDetailsSection: '[class*="personal"], h2:has-text("Personal")',
        preferencesSection: '[class*="preference"], h2:has-text("Preference")',
        customFieldsSection: '[class*="custom"], h2:has-text("Custom")',
      },
      'Forms': {
        formContainer: 'form, [class*="form"]',
        emailInput: 'input[name="email"], input[type="email"]',
        phoneInput: 'input[name="phone"], input[type="tel"]',
        firstNameInput: 'input[name*="firstName"]',
        lastNameInput: 'input[name*="lastName"]',
        photoUpload: 'input[type="file"]',
        dateOfBirthInput: 'input[type="date"], input[name*="dob"]',
        citizenIdInput: 'input[name*="citizen"]',
        saveButton: 'button:has-text("Save")',
        cancelButton: 'button:has-text("Cancel")',
      },
    };

    console.log(JSON.stringify(locators, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

extractLocators();
