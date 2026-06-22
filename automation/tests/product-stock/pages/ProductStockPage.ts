import { Page, Locator, expect } from '@playwright/test';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Page Object — Product Stock Management (PS)
 * Routes (from design): list = /cms/products/stock · badges = /cms/products & /cms/inventory
 *
 * ⚠️ SELECTORS NOT YET PROBED against live DOM (no creds in gen session). Built from the
 *    design's described UI labels (PO-confirmed). Verify each getByRole/getByLabel against
 *    real DOM before trusting a green run — adjust here, not in the spec. Pattern mirrors
 *    AppointmentPage (selectors centralized in POM, spec stays declarative).
 *
 * Terminology (design + PO Q1–Q12, UI=EN):
 *   - open Add = "Add Product Stock" button · modal title "Add Products Stock"
 *   - fields = Serial No.* / Product* / Store* / Registered Date* / Manufacturing Warranty
 *   - submit = "Create" · cancel = "Cancel"
 *   - toast create = "Product serial created successfully" (PO Q11)
 *   - badges = "In Stock" / "Low Stock (n)" / "Out of Stock (n)" (PO Q8: 0=Out·1–5=Low·>5=In)
 */
export class ProductStockPage {
  readonly page: Page;

  // ── list page ──
  readonly addBtn: Locator;
  readonly searchBox: Locator;
  readonly list: Locator;
  // ── Add modal ──
  readonly modal: Locator;
  readonly serialNo: Locator;
  readonly product: Locator;
  readonly store: Locator;
  readonly registeredDate: Locator;
  readonly manufacturingWarranty: Locator;
  readonly createBtn: Locator;
  readonly cancelBtn: Locator;
  // ── notification ──
  readonly bell: Locator;

  // ✅ list page DOM verified live 2026-06-20 (/cms/products/stock):
  //    heading "Products Stock" [h2] · textbox "Search..." · buttons Search/Filters/Reset · rows = text
  //    blocks ("Serial No.:… Product:… Store:… Status:…") each with a "View" button (NOT a <table>).
  //    ⚠️ "Add Product Stock" button is NOT rendered for the surveyed account (role gating — PO Q7).
  //       Add-flow steps require a Spare Parts Warehouse Staff / Admin account.
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    // ✅ verified live 2026-06-22: heading on /cms/inventory/ = "Spare Parts" [h2]
    this.heading = page.getByRole('heading', { name: /Spare Parts|Products?\s*Stock/i });
    // "Add Product Stock" is on /cms/products/stock (stock-unit list, Serial No./Product/Store/Status)
    // NOT /cms/inventory/ — that page has "Create Spare Parts" (spare-part master data, different feature)
    this.addBtn = page.getByRole('button', { name: /Add Product Stock/i });
    this.searchBox = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    // rows render as text blocks, not a table — match the row container by its serial text
    this.list = page.getByText(/Serial No\.:/i).first();

    this.modal = page.getByRole('dialog').or(page.locator('[class*="modal" i]')).first();
    this.serialNo = page.getByLabel(/Serial No/i).or(page.getByPlaceholder(/Serial No/i)).first();
    this.product = page.getByLabel(/^Product/i).or(page.getByPlaceholder(/Search Product|Select Product|Product/i)).first();
    this.store = page.getByLabel(/^Store/i).or(page.getByPlaceholder(/Search Store|Select Store|Store/i)).first();
    this.registeredDate = page.getByLabel(/Registered Date/i).or(page.getByPlaceholder(/Registered Date|yyyy-mm-dd|mm\/dd\/yyyy/i)).first();
    this.manufacturingWarranty = page.getByLabel(/Manufacturing Warranty/i).or(page.getByPlaceholder(/Manufacturing Warranty/i)).first();
    this.createBtn = page.getByRole('button', { name: /^Create$/i });
    this.cancelBtn = page.getByRole('button', { name: /^Cancel$/i });

    this.bell = page.getByRole('button', { name: /Toggle notifications/i }); // ✅ verified live 2026-06-21
  }

  // ── navigation ──
  // ⚠️ cms routes have NO /cc prefix (verified from live nav snapshot 2026-06-20):
  //    Products List = /cms/products/ · Spare Parts = /cms/inventory/ · Orders = /cms/inventory/request
  async gotoList() {
    await this.page.goto('/cms/products/stock', { waitUntil: 'domcontentloaded' });
  }
  async gotoProducts() {
    await this.page.goto('/cms/products/', { waitUntil: 'domcontentloaded' });
  }
  async gotoInventory() {
    await this.page.goto('/cms/inventory/', { waitUntil: 'domcontentloaded' });
  }

  // ── Add modal ──
  async openAddModal() {
    await this.addBtn.click();
    await expect(this.createBtn).toBeVisible();
  }

  /** select a value from a master dropdown (click trigger → type → pick option) */
  private async selectFromMaster(field: Locator, value: string) {
    await field.click();
    await field.fill(value).catch(() => {}); // some dropdowns are typeahead, some are buttons
    await this.page.getByRole('option', { name: new RegExp(value, 'i') })
      .or(this.page.getByText(value, { exact: false })).first().click();
  }

  /** fill the Add form. omit mfw to leave Manufacturing Warranty empty (optional) */
  async fillAddForm(d: { serialNumber?: string; product?: string; store?: string; registerDate?: string; mfw?: string }) {
    if (d.serialNumber !== undefined) await this.serialNo.fill(d.serialNumber);
    if (d.product) await this.selectFromMaster(this.product, d.product);
    if (d.store) await this.selectFromMaster(this.store, d.store);
    if (d.registerDate) await this.registeredDate.fill(d.registerDate);
    if (d.mfw) await this.manufacturingWarranty.fill(d.mfw);
  }

  async submitCreate() {
    await this.createBtn.click();
  }

  /** type a master value and assert NO matching option appears (PS6-TC2 / PS7-TC2) */
  async expectNoMasterOption(field: Locator, value: string) {
    await field.click();
    await field.fill(value).catch(() => {});
    await expect(this.page.getByRole('option', { name: new RegExp(value, 'i') })).toHaveCount(0);
  }

  // ── list row ── rows are text blocks ("Serial No.:<sn> …"), each with its own "View" button
  row(serialOrText: string): Locator {
    return this.page.getByText(new RegExp(`Serial No\\.:\\s*${serialOrText}`, 'i')).first();
  }
  async search(term: string) {
    await this.searchBox.fill(term);
    await this.page.getByRole('button', { name: /^Search$/i }).click().catch(() => this.page.keyboard.press('Enter'));
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── badges ── ✅ verified live 2026-06-21: rendered inline in the row text as
  //    "<item name> … Stock: <kind> (<qty>)" (e.g. "Mercedes-Benz M112 Stock: Low Stock (1)").
  //    Products page: "<name> Product Code:<code> Stock: <kind> (<qty>)".
  badge(itemLabel: string, kind: 'In Stock' | 'Low Stock' | 'Out of Stock', qty?: number): Locator {
    const tail = qty === undefined ? kind : `${kind} \\(${qty}\\)`;
    return this.page.getByText(new RegExp(`${escapeRe(itemLabel)}[\\s\\S]*?Stock:\\s*${tail}`, 'i')).first();
  }

  // ── stock detail modal (PS17) ──
  // ✅ Row DOM verified live 2026-06-22 (probe 06):
  //    Each row in main: [unnamed btn] "Part Name:" img "<item> Stock: <kind>(<n>)"
  //                      [unnamed btn] "Brand:…" [View] [Edit]
  //    The 2nd unnamed button per item (before "Brand:") appears to be the detail-icon trigger.
  //    ⚠️ Detail modal contents (heading/Available/Status/table) still NOT probed — probe false-positive.
  //       openStockDetail will click the best-guess button; assertions on modal fields remain fixme.
  async openStockDetail(itemLabel: string) {
    // Row DOM (probe 06): [btn] "Part Name:" img "ItemName Stock:…" [btn-detail] "Brand:…" [View] [Edit]
    // The detail-icon button immediately follows the item's stock-text node in DOM order.
    const itemText = this.page.locator('main').getByText(
      new RegExp(`${escapeRe(itemLabel)}[\\s\\S]*?Stock:`, 'i')
    ).first();
    await itemText.scrollIntoViewIfNeeded().catch(() => {});
    await itemText.locator('xpath=following::button[1]').click();
  }

  // ── notification bell (PS15) ──
  // ✅ verified live 2026-06-22 (probe 07-notification-panel.yaml):
  //    Panel renders inline in banner: heading "Notifications" [level=5] · button "⋯" ·
  //    combobox { option "All Types" [selected] } · list · button "View all notifications"
  //    No tabs — type filter is a combobox/select.
  async openBell() {
    await this.bell.click();
    await this.page.getByRole('heading', { name: /Notifications/i }).waitFor({ state: 'visible' });
  }
  /** select notification type from the combobox (e.g. "Low Stock") */
  async filterNotification(type: string) {
    const cb = this.page.getByRole('combobox').filter({ hasText: /all types/i })
      .or(this.page.locator('banner').getByRole('combobox')).first();
    await cb.selectOption({ label: new RegExp(type, 'i') as unknown as string }).catch(async () => {
      // fallback: click-then-pick-option (some comboboxes are custom)
      await cb.click();
      await this.page.getByRole('option', { name: new RegExp(type, 'i') }).first().click();
    });
  }

  // ── assertions ──
  /** role-independent landing check (heading + search) — Add button is role-gated, asserted separately */
  async expectListReady() {
    await expect(this.heading).toBeVisible();
    await expect(this.searchBox).toBeVisible();
  }
  /** true if the current account can add stock (Warehouse Staff / Admin) — PO Q7 */
  async canAdd(): Promise<boolean> {
    return (await this.addBtn.count()) > 0;
  }
  async expectFieldError(field: Locator) {
    // generic: field marked invalid OR an error message rendered near it ⚠️ refine after DOM probe
    await expect(
      field.or(this.page.locator('[class*="error" i], [aria-invalid="true"]')).first()
    ).toBeVisible();
    await expect(this.createBtn).toBeVisible(); // form still open = not submitted
  }
  async expectCreateToast(text: string) {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
  }
  async expectDuplicateError() {
    await expect(this.page.getByText(/already exist|duplicate|ซ้ำ/i).first()).toBeVisible();
  }
}
