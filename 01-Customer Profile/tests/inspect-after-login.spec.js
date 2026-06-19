const { test, expect } = require('@playwright/test');

test.describe('Customer Profile — UI Inspection (Post-Login)', () => {
  test('Open page and document structure', async ({ page }) => {
    // Navigate to the page
    await page.goto('https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list', {
      waitUntil: 'networkidle',
    });

    console.log('\n========== INITIAL PAGE INFO ==========');
    console.log('Page Title:', await page.title());
    console.log('URL:', page.url());
    console.log('Current Page Heading:', await page.locator('h1, h2, [class*="heading"]').first().textContent().catch(() => 'N/A'));

    // Check if we're on login page
    const loginForm = await page.locator('form, [class*="login"]').first().isVisible().catch(() => false);
    console.log('Login Form Visible:', loginForm);

    if (loginForm) {
      console.log('\n⚠️  Page shows login form. Need authentication credentials to proceed.');
      console.log('To use this inspector in automated tests, provide login credentials or use session cookies.');

      // Try to find input fields on login form
      const loginInputs = await page.locator('input').all();
      console.log('\nLogin Form Inputs Found:', loginInputs.length);

      for (let i = 0; i < loginInputs.length; i++) {
        const type = await loginInputs[i].getAttribute('type').catch(() => 'text');
        const name = await loginInputs[i].getAttribute('name').catch(() => '');
        const placeholder = await loginInputs[i].getAttribute('placeholder').catch(() => '');
        const id = await loginInputs[i].getAttribute('id').catch(() => '');
        console.log(`  ${i + 1}. [${type}] name="${name}" id="${id}" placeholder="${placeholder}"`);
      }

      // Try to find login button
      const loginBtn = await page.locator('button, [role="button"]').filter({ hasText: /login|sign|เข้า/i }).first().textContent().catch(() => 'Not found');
      console.log('Login Button:', loginBtn);
    } else {
      console.log('\n✓ Successfully at Customer List Page');
      await inspectCustomerListPage(page);
    }
  });

  test('Document all UI elements for manual inspection', async ({ page }) => {
    await page.goto('https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list', {
      waitUntil: 'networkidle',
    });

    console.log('\n========== DOM STRUCTURE DUMP ==========');

    // Get all buttons
    const buttons = await page.locator('button, [role="button"]').allTextContents();
    const uniqueButtons = [...new Set(buttons.filter(b => b.trim()))];
    console.log('\nAll Buttons:');
    uniqueButtons.forEach((btn, idx) => console.log(`  ${idx + 1}. "${btn.trim()}"`));

    // Get all input fields with details
    const inputs = await page.locator('input').all();
    console.log('\nAll Input Fields:');
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type').catch(() => 'text');
      const name = await inputs[i].getAttribute('name').catch(() => '(no name)');
      const id = await inputs[i].getAttribute('id').catch(() => '(no id)');
      const placeholder = await inputs[i].getAttribute('placeholder').catch(() => '(no placeholder)');
      console.log(`  ${i + 1}. [${type}] #${id} name="${name}" placeholder="${placeholder}"`);
    }

    // Get all select/dropdown fields
    const selects = await page.locator('select').all();
    console.log('\nAll Select Fields:', selects.length);
    for (let i = 0; i < selects.length; i++) {
      const name = await selects[i].getAttribute('name').catch(() => '(no name)');
      const id = await selects[i].getAttribute('id').catch(() => '(no id)');
      console.log(`  ${i + 1}. #${id} name="${name}"`);
    }

    // Get all text content sections (h1, h2, h3, labels, etc.)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('\nPage Headings/Sections:');
    headings.filter(h => h.trim()).forEach((h, idx) => console.log(`  ${idx + 1}. ${h.trim()}`));

    // Get all labels
    const labels = await page.locator('label').allTextContents();
    console.log('\nAll Labels:');
    labels.filter(l => l.trim()).forEach((l, idx) => console.log(`  ${idx + 1}. "${l.trim()}"`));

    // Get page sections
    const sections = await page.locator('section, [class*="section"], [class*="container"], [class*="panel"]').all();
    console.log('\nPage Sections Found:', sections.length);

    // Get table/list structure
    const tables = await page.locator('table, [role="grid"], [role="table"]').count();
    console.log('Tables/Grids Found:', tables);

    const rows = await page.locator('tr, [role="row"]').count();
    console.log('Rows Found:', rows);
  });
});

async function inspectCustomerListPage(page) {
  console.log('\n========== CUSTOMER LIST PAGE INSPECTION ==========');

  // Page structure
  const pageTitle = await page.locator('h1, [class*="page-title"]').first().textContent().catch(() => 'N/A');
  console.log('Page Title:', pageTitle?.trim());

  // Buttons
  const buttons = await page.locator('button, [role="button"]').allTextContents();
  const uniqueButtons = [...new Set(buttons.filter(b => b.trim()))];
  console.log('\nButtons:', uniqueButtons.map(b => `"${b.trim()}"`).join(', '));

  // Search/Filter area
  const searchInputs = await page.locator('input[type="text"], input[type="search"]').count();
  console.log('\nSearch Inputs Found:', searchInputs);

  // Table headers
  const headers = await page.locator('th, [role="columnheader"]').allTextContents();
  console.log('Table Columns:', headers.filter(h => h.trim()).map(h => `"${h.trim()}"`).join(', '));

  // Sample rows
  const rows = await page.locator('tbody tr, [role="row"]:not([role="columnheader"])').all();
  console.log('\nTotal Data Rows:', rows.length);

  if (rows.length > 0) {
    const firstRowText = await rows[0].textContent().catch(() => 'N/A');
    console.log('First Row Preview:', firstRowText?.substring(0, 150).trim());
  }

  // Modals/Dialogs
  const dialogs = await page.locator('[role="dialog"], [class*="modal"], [class*="dialog"]').count();
  console.log('\nModals/Dialogs Found:', dialogs);
}
