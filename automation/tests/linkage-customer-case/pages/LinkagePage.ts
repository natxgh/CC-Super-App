import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Linkage Customer Profile with Case (LCP)
 * Lives on the Case Creation page: /cms/case/creation (right panel "Customer Information").
 *
 * ✅ VERIFIED LIVE DOM (probe 2026-06-20, UI=EN — shared with Case feature):
 *   - right-panel buttons (case creation): "Linked Existing", "Add Customer"
 *   - case form input: placeholder "Enter Phone Number"
 *
 * ⚠️ NOT yet verified (best-effort selectors below, built from the design's documented UI strings →
 *    every test using them is test.fixme until the DOM is probed):
 *   - "Linked Existing" modal internals: search input (placeholder "Search Name,Mobile Number,Email."),
 *     Search button, Filter "Type", table columns (CUSTOMER/CONTACT/PRODUCT/SERVICE/TYPE/ACTIVE),
 *     per-row "Select" button, footer "Showing 1–N of N entries", "Clear Filters"
 *   - Customer 360 panel after link: tabs Profile/History/Note/Appointment/Product/Service, "Contact Channels",
 *     "View Full Profile" → Modal (PO Q10)
 *   - "Add Customer" quick-create modal: Email/Phone/First/Last inputs + Save + inline validation copy (PO Q4)
 *
 * 🐞 Known defects on this feature (gate execution — see MISSING-API.md / design Step 5):
 *   A-1 Search returns "No results found." for every keyword · A-2 Clear Filters does not re-fetch ·
 *   A-3 list-row identity ≠ linked profile · A-4 reopen modal hangs on loading · B-1 no inline validation yet
 */
export class LinkagePage {
  readonly page: Page;

  // ── case creation (verified) ──
  readonly phoneNumber: Locator;
  readonly linkedExistingBtn: Locator;
  readonly addCustomerBtn: Locator;

  // ── Linked Existing modal (best-effort / unverified) ──
  readonly modal: Locator;
  readonly searchInput: Locator;
  readonly searchBtn: Locator;
  readonly filterTypeTrigger: Locator;
  readonly clearFiltersBtn: Locator;

  // ── Add Customer quick-create modal (best-effort / unverified) ──
  readonly addEmail: Locator;
  readonly addPhone: Locator;
  readonly addFirstName: Locator;
  readonly addLastName: Locator;
  readonly addSaveBtn: Locator;

  // ── Customer 360 panel (best-effort / unverified) ──
  readonly viewFullProfileBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // verified (case creation page)
    this.phoneNumber = page.getByPlaceholder('Enter Phone Number');
    this.linkedExistingBtn = page.getByRole('button', { name: /Linked Existing/i });
    this.addCustomerBtn = page.getByRole('button', { name: /Add Customer/i });

    // unverified — Linked Existing modal
    this.modal = page.getByRole('dialog');
    this.searchInput = page.getByPlaceholder(/Search Name,\s*Mobile Number,\s*Email/i);
    this.searchBtn = page.getByRole('button', { name: /^Search$/i });
    this.filterTypeTrigger = this.modal.getByRole('button', { name: /Type/i });
    this.clearFiltersBtn = page.getByRole('button', { name: /Clear Filters/i });

    // unverified — Add Customer modal (minimal fields). name attrs reused from full Customer form best-effort
    this.addEmail = page.locator('input[name="email"]');
    this.addPhone = page.locator('input[name="mobileNo"]');
    this.addFirstName = page.locator('input[name="firstName"]');
    this.addLastName = page.locator('input[name="lastName"]');
    this.addSaveBtn = page.getByRole('button', { name: /^Save$/i });

    // unverified — 360 panel
    this.viewFullProfileBtn = page.getByRole('button', { name: /View Full Profile/i });
  }

  // ── navigation ──
  async gotoCreation() {
    await this.page.goto('/cms/case/creation', { waitUntil: 'domcontentloaded' });
    await expect(this.linkedExistingBtn).toBeVisible();
  }

  // ── Linked Existing modal helpers (unverified) ──
  async openLinkedExisting() {
    await this.linkedExistingBtn.click();
    await expect(this.modal).toBeVisible();
  }
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchBtn.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }
  /** row that contains the given phone/text → its "Select" button (best-effort) */
  rowByText(text: string): Locator {
    return this.modal.getByRole('row').filter({ hasText: text });
  }
  async selectByText(text: string) {
    await this.rowByText(text).getByRole('button', { name: /^Select$/i }).click();
  }
  noResults(): Locator { return this.page.getByText(/No results found/i); }
  async filterType(value: string) {
    await this.filterTypeTrigger.click();
    await this.page.getByRole('option', { name: new RegExp(value, 'i') })
      .or(this.page.getByText(value, { exact: true })).first().click();
  }

  // ── Customer Information card / case form (best-effort) ──
  /** the linked Customer Information card on the right panel */
  infoCard(): Locator { return this.page.getByText(/Customer Information/i).locator('xpath=ancestor::*[1]'); }
  panelTab(name: string): Locator { return this.page.getByRole('tab', { name: new RegExp(`^${name}$`, 'i') })
    .or(this.page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') })); }
  contactChannels(): Locator { return this.page.getByText(/Contact Channels/i); }

  // ── Add Customer quick-create (unverified) ──
  async openAddCustomer() {
    await this.addCustomerBtn.click();
    await expect(this.modal).toBeVisible();
  }
  async fillAddCustomer(d: { email?: string; phone?: string; firstName?: string; lastName?: string }) {
    if (d.email !== undefined) await this.addEmail.fill(d.email);
    if (d.phone !== undefined) await this.addPhone.fill(d.phone);
    if (d.firstName !== undefined) await this.addFirstName.fill(d.firstName);
    if (d.lastName !== undefined) await this.addLastName.fill(d.lastName);
  }

  // ── toasts ──
  successToast(): Locator { return this.page.getByText(/success|created|สำเร็จ/i).first(); }
  errorToast(): Locator { return this.page.getByText(/fail|error|already|duplicate|ผิดพลาด/i).first(); }
  validationMsg(text: string): Locator { return this.page.getByText(text, { exact: false }); }
}
