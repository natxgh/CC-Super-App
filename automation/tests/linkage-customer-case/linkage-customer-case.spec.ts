import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import { LoginPage } from '../../shared/pages/LoginPage';
import { LinkagePage } from './pages/LinkagePage';
import { seedCustomer, seedCustomers, purgeByEmail } from '../customer-profile/fixtures/seed';
import * as D from './fixtures/testdata';

/**
 * Linkage Customer Profile with Case — Playwright E2E
 * Generated from 10-Linkage Customer Profile with Case/linkage-customer-case-testcases.xlsx (18 scenarios / 25 TC)
 * Pattern: 1 Scenario = 1 test() (Scenario No.) · 1 Test Case = 1 test.step('<TC No.> — …') + shot()
 * Reuse (verified DOM): shared/LoginPage · Customer GraphQL seed/teardown (customer-profile/fixtures/seed.ts ✅)
 * Feature POM: pages/LinkagePage.ts — on /cms/case/creation (Linked Existing / Add Customer panel)
 *
 * ⚠️ staging ต้อง login จริง — set CP_PASSWORD/CP_ORG เพื่อรัน (ไม่ตั้ง → skip, ไม่แกล้งผ่าน)
 * 🧹 teardown: CP_TEARDOWN=1 → ลบ customer ที่ seed/UI สร้าง (seeded-emails.json → DeleteCustomer). ดู MISSING-API.md
 *
 * 📌 STATUS = RUNNING (2026-06-26): dev แก้ defect A-1/A-3/A-4/B-1 ครบ — lifted all fixme.
 *   Probe 2026-06-21 verified: modal search input/button, Type filter (native <select>), Select button,
 *   Add Customer form fields, View Full Profile → Modal, panel tabs = role=button (not role=tab).
 *   Probe 2026-06-26: noResults() = "No results found." (EN, with period); Clear Filters button present when filter active.
 */
const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || '';

async function shot(page: Page, label: string) {
  fs.mkdirSync('test-results/steps', { recursive: true });
  await page.screenshot({ path: `test-results/steps/${label}.png`, fullPage: true }).catch(() => {});
}

async function login(page: Page) {
  const lg = new LoginPage(page);
  await lg.goto();
  await lg.login({ org: ORG, username: USER, password: PASS });
}

// ════════════════════════════════════════════════════════════════════════════
//  SUCCESS SCENARIOS (TS-01 … TS-03)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Linkage Customer Profile with Case — Success', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TS-01 — Link an existing customer to a case ────────────────────────────
  test('TS-01 — link an existing customer to a case (search → Select → Customer 360 + auto-fill Phone)', async ({ page }) => {
    const lk = new LinkagePage(page);

    await test.step('TS-01_TC-01 — Open the "Linked Existing" modal', async () => {
      await login(page);
      await seedCustomers(page, D.SEED_CUSTOMERS); // Arrange: existing customers (API-first)
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await expect.soft(lk.searchInput).toBeVisible();
      await expect.soft(lk.searchBtn).toBeVisible();
      await shot(page, 'TS-01_TC-01');
    });
    await test.step('TS-01_TC-02 — Search keyword "0899181632" (Mobile Number) → Bulan J', async () => {
      await lk.search(D.SEARCH_BY_MOBILE); // ⚠️ defect A-1: currently returns "No results found."
      await expect(lk.rowByText('Bulan J')).toBeVisible();
      await shot(page, 'TS-01_TC-02');
    });
    await test.step('TS-01_TC-03 — Click Select → link customer + case Phone Number auto-fills', async () => {
      await lk.selectByText(D.SEARCH_BY_MOBILE);
      await expect(lk.modal).toBeHidden();
      await expect(lk.phoneNumber).toHaveValue(D.BULAN.phone);
      await expect(lk.viewFullProfileBtn).toBeVisible();
      await shot(page, 'TS-01_TC-03');
    });
    await test.step('TS-01_TC-04 — Customer 360 tabs are shown', async () => {
      for (const t of D.PANEL_TABS) await expect.soft(lk.panelTab(t).first()).toBeVisible();
      await shot(page, 'TS-01_TC-04');
    });
    await test.step('TS-01_TC-05 — Profile tab → Contact Channels (Phone Primary + verified)', async () => {
      await lk.panelTab('Profile').first().click();
      await expect.soft(lk.contactChannels()).toBeVisible();
      await expect.soft(page.getByText(D.BULAN.phone)).toBeVisible();
      await shot(page, 'TS-01_TC-05');
    });
    await test.step('TS-01_TC-06 — Click "View Full Profile" → Full Profile Modal opens', async () => {
      await lk.viewFullProfileBtn.click();
      await expect(lk.modal).toBeVisible(); // PO Q10: expand display via Modal
      await shot(page, 'TS-01_TC-06');
    });
  });

  // ── TS-02 — Add a new customer from the case page + auto-link ───────────────
  test('TS-02 — add a new customer from the case page and auto-link it', async ({ page }) => {
    const lk = new LinkagePage(page);

    await test.step('TS-02_TC-01 — Open Add Customer and fill required fields', async () => {
      await login(page);
      await purgeByEmail(page, D.NEW_CUSTOMER.email); // clean slate + register for teardown
      await lk.gotoCreation();
      await lk.openAddCustomer();
      await lk.fillAddCustomer({ email: D.NEW_CUSTOMER.email, phone: D.NEW_CUSTOMER.phone });
      await expect.soft(lk.addSaveBtn).toBeEnabled();
      await shot(page, 'TS-02_TC-01');
    });
    await test.step('TS-02_TC-02 — Fill name → Save → Toast "Success" + auto-link', async () => {
      await lk.fillAddCustomer({ firstName: D.NEW_CUSTOMER.firstName, lastName: D.NEW_CUSTOMER.lastName });
      await lk.addSaveBtn.click();
      await expect(lk.successToast()).toBeVisible();             // PO Q4: hide dialog then toast
      await expect(lk.phoneNumber).toHaveValue(D.NEW_CUSTOMER.phone); // PO Q2: auto-link
      await shot(page, 'TS-02_TC-02');
    });
  });

  // ── TS-03 — Change the linked customer (re-select to replace) ──────────────
  test('TS-03 — change the linked customer (re-select to replace)', async ({ page }) => {
    const lk = new LinkagePage(page);

    await test.step('TS-03_TC-01 — Select customer A (0850020000) → linked', async () => {
      await login(page);
      await seedCustomers(page, [D.VILAILUK, D.BULAN]);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.selectByText(D.VILAILUK.phone);
      await expect(lk.phoneNumber).toHaveValue(D.VILAILUK.phone);
      await shot(page, 'TS-03_TC-01');
    });
    await test.step('TS-03_TC-02 — Re-select Bulan J (0899181632) → replaces the previous link', async () => {
      await lk.openLinkedExisting(); // ⚠️ defect A-4: reopen hangs
      await lk.selectByText(D.BULAN.phone);
      await expect(lk.phoneNumber).toHaveValue(D.BULAN.phone);
      await shot(page, 'TS-03_TC-02');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ALTERNATIVE / NEGATIVE SCENARIOS (TA-01 … TA-15)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Linkage Customer Profile with Case — Alternative', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TA-01 — Search by Name ─────────────────────────────────────────────────
  test('TA-01 — search by Name and find the customer', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-01_TC-01 — Search keyword "Bulan" (Name)', async () => {
      await login(page);
      await seedCustomer(page, D.BULAN);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.search(D.SEARCH_BY_NAME);
      await expect(lk.rowByText('Bulan J')).toBeVisible();
      await shot(page, 'TA-01_TC-01');
    });
  });

  // ── TA-02 — Search by Mobile Number (non-dash) ─────────────────────────────
  test('TA-02 — search by Mobile Number (non-dash format) and find the customer', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-02_TC-01 — Search keyword "0850020000"', async () => {
      await login(page);
      await seedCustomer(page, D.VILAILUK);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.search(D.SEARCH_BY_MOBILE_NODASH);
      await expect(lk.rowByText(D.VILAILUK.phone)).toBeVisible();
      await shot(page, 'TA-02_TC-01');
    });
  });

  // ── TA-03 — Search by Email ────────────────────────────────────────────────
  test('TA-03 — search by Email and find the customer', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-03_TC-01 — Search keyword "bulan.jit@skyai.co.th"', async () => {
      await login(page);
      await seedCustomer(page, D.BULAN);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.search(D.SEARCH_BY_EMAIL);
      await expect(lk.rowByText('Bulan J')).toBeVisible();
      await shot(page, 'TA-03_TC-01');
    });
  });

  // ── TA-04 — Search with no result → empty state ────────────────────────────
  test('TA-04 — "No results found." when searching a keyword with no results', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-04_TC-01 — Search a keyword that does not exist', async () => {
      await login(page);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.search(D.SEARCH_NO_RESULT);
      await expect(lk.noResults()).toBeVisible();
      await shot(page, 'TA-04_TC-01');
    });
  });

  // ── TA-05 — Reopen modal resets the filter state ──────────────────────────
  test('TA-05 — reopening the "Linked Existing" modal resets the search state', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-05_TC-01 — Close and reopen the modal → search field is empty', async () => {
      await login(page);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.search(D.SEARCH_NO_RESULT);
      await page.keyboard.press('Escape'); // close modal
      await lk.openLinkedExisting();
      await expect(lk.searchInput).toHaveValue('');
      await shot(page, 'TA-05_TC-01');
    });
  });

  // ── TA-06 — No customer matches → empty state ──────────────────────────────
  test('TA-06 — "No results found." when no customer matches', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-06_TC-01 — Open modal when no customer matches', async () => {
      await login(page);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.search(D.SEARCH_NO_RESULT);
      await expect(lk.noResults()).toBeVisible();
      await shot(page, 'TA-06_TC-01');
    });
  });

  // ── TA-07 — Filter by Type ─────────────────────────────────────────────────
  test('TA-07 — filter the customer list by Type', async ({ page }) => {
    // Type filter is a native <select> (verified probe 2026-06-21).
    // Options: Bronze / Silver / Gold / Platinum — N/A absent (PO Q9 discrepancy; noted in MISSING-API.md).
    const lk = new LinkagePage(page);
    await test.step('TA-07_TC-01 — Filter Type "Platinum"', async () => {
      await login(page);
      await seedCustomers(page, [D.DONALD, D.BULAN]);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.filterType(D.FILTER_TYPE);
      await expect(lk.rowByText('Donald Throught')).toBeVisible();
      await expect(lk.rowByText('Bulan J')).toHaveCount(0); // Gold hidden
      await shot(page, 'TA-07_TC-01');
    });
  });

  // ── TA-08 — Linked identity matches the selected row ───────────────────────
  test('TA-08 — the linked customer identity matches the selected row', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-08_TC-01 — Compare the linked card with the selected row', async () => {
      await login(page);
      await seedCustomer(page, D.VILAILUK);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.selectByText(D.VILAILUK.phone);
      // PO Q1: 1 phone = 1 customer profile → card identity must match the row clicked
      await expect.soft(page.getByText('Vilailuk Maksuk')).toBeVisible();
      await expect.soft(page.getByText(D.VILAILUK.email)).toBeVisible();
      await shot(page, 'TA-08_TC-01');
    });
  });

  // ── TA-09 — Case History empty ─────────────────────────────────────────────
  test('TA-09 — "No results found." in Case History when the customer has no case', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-09_TC-01 — Open History tab for a customer with no case', async () => {
      await login(page);
      await seedCustomer(page, D.BULAN);
      await lk.gotoCreation();
      await lk.openLinkedExisting();
      await lk.selectByText(D.BULAN.phone);
      await lk.panelTab('History').first().click();
      await expect(lk.noResults()).toBeVisible();
      await shot(page, 'TA-09_TC-01');
    });
  });

  // ── TA-10 — Add Customer: empty Email ──────────────────────────────────────
  test('TA-10 — "Please enter an email address" when Email is empty', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-10_TC-01 — Save with an empty Email', async () => {
      await login(page);
      await lk.gotoCreation();
      await lk.openAddCustomer();
      await lk.fillAddCustomer({ email: '', phone: D.NEW_CUSTOMER.phone });
      await lk.addSaveBtn.click();
      await expect(lk.validationMsg(D.MSG_EMPTY_EMAIL)).toBeVisible();
      await shot(page, 'TA-10_TC-01');
    });
  });

  // ── TA-11 — Add Customer: empty Phone ──────────────────────────────────────
  test('TA-11 — "Please enter a mobile number" when Phone is empty', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-11_TC-01 — Save with an empty Phone', async () => {
      await login(page);
      await lk.gotoCreation();
      await lk.openAddCustomer();
      await lk.fillAddCustomer({ email: D.NEW_CUSTOMER.email, phone: '' });
      await lk.addSaveBtn.click();
      await expect(lk.validationMsg(D.MSG_EMPTY_PHONE)).toBeVisible();
      await shot(page, 'TA-11_TC-01');
    });
  });

  // ── TA-12 — Add Customer: both empty ───────────────────────────────────────
  test('TA-12 — both error messages when Email and Phone are empty', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-12_TC-01 — Save with all fields empty', async () => {
      await login(page);
      await lk.gotoCreation();
      await lk.openAddCustomer();
      await lk.fillAddCustomer({ email: '', phone: '' });
      await lk.addSaveBtn.click();
      await expect.soft(lk.validationMsg(D.MSG_EMPTY_EMAIL)).toBeVisible();
      await expect.soft(lk.validationMsg(D.MSG_EMPTY_PHONE)).toBeVisible();
      await shot(page, 'TA-12_TC-01');
    });
  });

  // ── TA-13 — Add Customer: invalid email format ─────────────────────────────
  test('TA-13 — invalid email address format is rejected', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-13_TC-01 — Save with an invalid email format', async () => {
      await login(page);
      await lk.gotoCreation();
      await lk.openAddCustomer();
      await lk.fillAddCustomer({ email: D.INVALID_EMAIL, phone: D.NEW_CUSTOMER.phone });
      await lk.addSaveBtn.click();
      await expect(lk.validationMsg(D.MSG_INVALID_EMAIL)).toBeVisible();
      await shot(page, 'TA-13_TC-01');
    });
  });

  // ── TA-14 — Add Customer: duplicate phone blocked ──────────────────────────
  test('TA-14 — duplicate phone number is blocked', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-14_TC-01 — Save with a phone number that already exists', async () => {
      await login(page);
      await seedCustomer(page, D.BULAN); // existing owner of DUP_PHONE
      await purgeByEmail(page, D.NEW_EMAIL_FOR_DUP_PHONE);
      await lk.gotoCreation();
      await lk.openAddCustomer();
      await lk.fillAddCustomer({ email: D.NEW_EMAIL_FOR_DUP_PHONE, phone: D.DUP_PHONE });
      await lk.addSaveBtn.click();
      await expect(lk.errorToast()).toBeVisible(); // PO Q3: block, no duplicate created
      await shot(page, 'TA-14_TC-01');
    });
  });

  // ── TA-15 — Add Customer: duplicate email blocked ──────────────────────────
  test('TA-15 — duplicate email address is blocked', async ({ page }) => {
    const lk = new LinkagePage(page);
    await test.step('TA-15_TC-01 — Save with an email that already exists', async () => {
      await login(page);
      await seedCustomer(page, D.BULAN); // existing owner of DUP_EMAIL
      await lk.gotoCreation();
      await lk.openAddCustomer();
      await lk.fillAddCustomer({ email: D.DUP_EMAIL, phone: D.NEW_PHONE_FOR_DUP_EMAIL });
      await lk.addSaveBtn.click();
      await expect(lk.errorToast()).toBeVisible(); // PO Q3: block, no duplicate created
      await shot(page, 'TA-15_TC-01');
    });
  });
});
