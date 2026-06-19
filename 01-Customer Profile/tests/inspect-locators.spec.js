const { test, expect } = require('@playwright/test');

test.describe('Customer Profile — Locator Inspection', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ ignoreHTTPSErrors: true });
  });

  test('Inspect Customer List Page', async () => {
    await page.goto('https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list', {
      waitUntil: 'networkidle',
    });

    console.log('\n=== CUSTOMER LIST PAGE ===');
    console.log('Page Title:', await page.title());
    console.log('URL:', page.url());

    // Check page structure
    const pageHeading = await page.locator('h1, h2, [class*="heading"], [class*="title"]').first().textContent();
    console.log('Page Heading:', pageHeading?.trim() || 'Not found');

    // Add Customer Button
    const addCustomerBtn = await page.locator('button, [role="button"]')
      .filter({ hasText: /Add|เพิ่ม/i })
      .first();
    const addBtnText = await addCustomerBtn.textContent().catch(() => 'Not found');
    console.log('Add Customer Button Found:', !!addBtnText, `(Text: ${addBtnText?.trim()})`);

    // Search Input
    const searchInput = await page.locator('input[type="text"], input[type="search"], [placeholder*="search"], [placeholder*="ค้นหา"]').first();
    const searchPlaceholder = await searchInput.getAttribute('placeholder').catch(() => null);
    console.log('Search Input Found:', !!searchInput, `(Placeholder: ${searchPlaceholder})`);

    // Filter/Select dropdown
    const filterElements = await page.locator('select, [role="combobox"], [role="listbox"]').count();
    console.log('Filter/Dropdown Elements Found:', filterElements);

    // Table structure
    const tableContainer = await page.locator('table, [role="grid"], [role="table"], [class*="table"], [class*="list"]').first();
    const tableExists = await tableContainer.isVisible().catch(() => false);
    console.log('Table Container Found:', tableExists);

    if (tableExists) {
      const headers = await page.locator('th, [role="columnheader"]').allTextContents();
      console.log('Table Headers:', headers.filter(h => h.trim()).map(h => h.trim()));

      const rows = await page.locator('tbody tr, [role="row"]:not([role="columnheader"])').count();
      console.log('Total Rows:', rows);

      if (rows > 0) {
        const firstRow = await page.locator('tbody tr, [role="row"]:not([role="columnheader"])').first();
        const firstRowText = await firstRow.textContent();
        console.log('First Row Preview:', firstRowText?.substring(0, 100).trim() || 'N/A');

        // Check for action buttons
        const viewBtn = await firstRow.locator('button, [role="button"]').filter({ hasText: /View|ดู/ }).isVisible().catch(() => false);
        const editBtn = await firstRow.locator('button, [role="button"]').filter({ hasText: /Edit|แก้ไข/ }).isVisible().catch(() => false);
        const deleteBtn = await firstRow.locator('button, [role="button"]').filter({ hasText: /Delete|ลบ/ }).isVisible().catch(() => false);

        console.log('Action Buttons (View/Edit/Delete):', { view: viewBtn, edit: editBtn, delete: deleteBtn });
      }
    }

    // No data state
    const noDataMsg = await page.locator('text=/No results|ไม่พบข้อมูล/i').textContent().catch(() => null);
    console.log('Empty State Message:', noDataMsg?.trim() || 'Table has data or state not visible');
  });

  test('Inspect Customer Detail Page (if navigated)', async () => {
    // This test would navigate to a customer detail page if possible
    console.log('\n=== CUSTOMER DETAIL PAGE ===');

    // Try to find and click first customer row
    const firstRow = await page.locator('tbody tr, [role="row"]:not([role="columnheader"])').first();
    const viewBtn = await firstRow.locator('button, [role="button"]').filter({ hasText: /View|ดู/ }).first();

    const btnExists = await viewBtn.isVisible().catch(() => false);
    if (btnExists) {
      await viewBtn.click();
      await page.waitForNavigation().catch(() => null);

      console.log('Navigated to Detail Page');
      console.log('URL:', page.url());

      // Check tabs
      const tabs = await page.locator('[role="tab"]').allTextContents();
      console.log('Tabs Found:', tabs.filter(t => t.trim()).map(t => t.trim()));

      // Check sections
      const sections = await page.locator('section, [class*="section"], h2').allTextContents();
      console.log('Sections/Headers:', sections.filter(s => s.trim()).slice(0, 10).map(s => s.trim()));

      // Check form fields
      const inputs = await page.locator('input, select, textarea').count();
      console.log('Form Inputs Found:', inputs);

      // Check buttons
      const buttons = await page.locator('button, [role="button"]').allTextContents();
      const uniqueButtons = [...new Set(buttons.filter(b => b.trim()))];
      console.log('Buttons Found:', uniqueButtons.slice(0, 10).map(b => b.trim()));
    } else {
      console.log('View button not available, skipping navigation');
    }
  });

  test('Inspect Form Elements', async () => {
    console.log('\n=== FORM ELEMENTS ===');

    // Try to navigate to Add page if possible
    const addBtn = await page.locator('button, [role="button"]').filter({ hasText: /Add|เพิ่ม/i }).first();
    const addBtnVisible = await addBtn.isVisible().catch(() => false);

    if (addBtnVisible) {
      await addBtn.click();
      await page.waitForNavigation().catch(() => null);
      await page.waitForTimeout(1000);

      console.log('Navigated to Add Form');
      console.log('URL:', page.url());

      // Detect form structure
      const form = await page.locator('form, [class*="form"]').first();
      const formVisible = await form.isVisible().catch(() => false);

      if (formVisible) {
        // Get all labels
        const labels = await page.locator('label').allTextContents();
        console.log('Form Labels:', labels.filter(l => l.trim()).slice(0, 15).map(l => l.trim()));

        // Get all inputs with their types
        const inputLocators = await page.locator('input').all();
        console.log('Input Fields:');
        for (let i = 0; i < Math.min(inputLocators.length, 10); i++) {
          const type = await inputLocators[i].getAttribute('type');
          const name = await inputLocators[i].getAttribute('name');
          const placeholder = await inputLocators[i].getAttribute('placeholder');
          console.log(`  ${i + 1}. [${type}] name="${name}" placeholder="${placeholder}"`);
        }

        // Get selects
        const selects = await page.locator('select').count();
        console.log('Select Fields Found:', selects);

        // Get buttons
        const btns = await page.locator('button, [role="button"]').allTextContents();
        const uniqueBtns = [...new Set(btns.filter(b => b.trim()))];
        console.log('Form Buttons:', uniqueBtns.map(b => b.trim()));
      }
    }
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });
});
