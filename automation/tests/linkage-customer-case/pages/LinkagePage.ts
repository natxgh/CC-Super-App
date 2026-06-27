import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Linkage Customer Profile with Case (LCP)
 * Lives on the Case Creation page: /cms/case/creation (right panel "Customer Information").
 *
 * ✅ VERIFIED LIVE DOM (probe 2026-06-21, UI=EN):
 *   - right-panel buttons: "Linked Existing", "Add Customer"
 *   - case form input: placeholder "Enter Phone Number"
 *   - Linked Existing modal: search input placeholder "Search Name,Mobile Number,Email..."
 *   - Linked Existing modal: Search button (role=button, name "Search")
 *   - Linked Existing modal: Filter Type = native <select> (options: Bronze / Silver / Gold / Platinum — no N/A)
 *   - Linked Existing modal: per-row "Select" button (role=button, name "Select")
 *   - Linked Existing modal: footer text "Showing 1-0 of 0 entries" (hyphen, not en-dash)
 *   - Linked Existing modal: "Clear Filters" button present when filter/search active (probe 2026-06-26)
 *   - Linked Existing modal: empty-state text = "No results found." (exact, with period — probe 2026-06-26)
 *   - Add Customer modal: inputs name="email", name="mobileNo", name="firstName", name="lastName"
 *   - Add Customer modal: Save button (role=button, name "Save")
 *   - Customer 360 panel tabs: buttons (role=button, NOT role=tab)
 *   - "View Full Profile" button → opens role=dialog modal
 *
 * ⚠️ STILL UNVERIFIED (tests using these remain test.fixme):
 *   - Add Customer inline validation copy (exact strings) — defect B-1: no inline validation yet
 *   - Customer 360 panel tab contents (History/Note/Appointment/Product/Service)
 *
 * 🐞 Known defects (gate execution — see MISSING-API.md / design Step 5):
 *   A-1 Search returns "No results found." for every keyword · A-3 list-row identity ≠ linked profile ·
 *   A-4 reopen modal hangs on loading · B-1 no inline validation yet
 *   (A-2 "Clear Filters absent" — CLOSED: button confirmed present probe 2026-06-26; behavior unverified)
 */
export class LinkagePage {
  readonly page: Page;

  // ── case creation (verified) ──
  readonly phoneNumber: Locator;
  readonly linkedExistingBtn: Locator;
  readonly addCustomerBtn: Locator;

  // ── Linked Existing modal (verified 2026-06-21) ──
  readonly modal: Locator;
  readonly searchInput: Locator;
  readonly searchBtn: Locator;
  readonly filterTypeTrigger: Locator; // native <select> — use selectOption()
  readonly clearFiltersBtn: Locator;   // visible only when search/filter is active (probe 2026-06-26)

  // ── Add Customer quick-create modal (verified 2026-06-21) ──
  readonly addEmail: Locator;
  readonly addPhone: Locator;
  readonly addFirstName: Locator;
  readonly addLastName: Locator;
  readonly addSaveBtn: Locator;

  // ── Customer 360 panel (verified 2026-06-21) ──
  readonly viewFullProfileBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // verified (case creation page)
    this.phoneNumber = page.getByPlaceholder('Enter Phone Number');
    this.linkedExistingBtn = page.getByRole('button', { name: /Linked Existing/i });
    this.addCustomerBtn = page.getByRole('button', { name: /Add Customer/i });

    // verified — Linked Existing modal
    this.modal = page.getByRole('dialog');
    this.searchInput = page.getByPlaceholder(/Search Name,\s*Mobile Number,\s*Email/i);
    this.searchBtn = page.getByRole('button', { name: /^Search$/i });
    this.filterTypeTrigger = page.locator('[role=dialog] select').first();
    this.clearFiltersBtn = page.getByRole('button', { name: /Clear Filters/i });

    // verified — Add Customer modal (minimal fields)
    this.addEmail = page.locator('input[name="email"]');
    this.addPhone = page.locator('input[name="mobileNo"]');
    this.addFirstName = page.locator('input[name="firstName"]');
    this.addLastName = page.locator('input[name="lastName"]');
    this.addSaveBtn = page.getByRole('button', { name: /^Save$/i });

    // verified — 360 panel
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
  /** verified probe 2026-06-26: exact text = "No results found." (English, with period) */
  noResults(): Locator { return this.page.getByText(/No results found/i); }
  /** Type filter is a native <select> — verified probe 2026-06-21 (Bronze/Silver/Gold/Platinum; no N/A) */
  async filterType(value: string) {
    await this.filterTypeTrigger.selectOption(value);
  }

  // ── Customer Information card / case form (best-effort) ──
  /** the linked Customer Information card on the right panel */
  infoCard(): Locator { return this.page.getByText(/Customer Information/i).locator('xpath=ancestor::*[1]'); }
  /** Panel tabs are role=button, not role=tab — verified probe 2026-06-21 */
  panelTab(name: string): Locator { return this.page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') }); }
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
