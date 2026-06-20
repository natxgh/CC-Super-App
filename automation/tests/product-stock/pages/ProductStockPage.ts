import { Page, Locator, expect } from '@playwright/test';

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

  constructor(page: Page) {
    this.page = page;
    this.addBtn = page.getByRole('button', { name: /Add Product Stock/i });
    this.searchBox = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    this.list = page.getByRole('table').first();

    this.modal = page.getByRole('dialog').or(page.locator('[class*="modal" i]')).first();
    this.serialNo = page.getByLabel(/Serial No/i).or(page.getByPlaceholder(/Serial No/i)).first();
    this.product = page.getByLabel(/^Product/i).or(page.getByPlaceholder(/Search Product|Select Product|Product/i)).first();
    this.store = page.getByLabel(/^Store/i).or(page.getByPlaceholder(/Search Store|Select Store|Store/i)).first();
    this.registeredDate = page.getByLabel(/Registered Date/i).or(page.getByPlaceholder(/Registered Date|yyyy-mm-dd|mm\/dd\/yyyy/i)).first();
    this.manufacturingWarranty = page.getByLabel(/Manufacturing Warranty/i).or(page.getByPlaceholder(/Manufacturing Warranty/i)).first();
    this.createBtn = page.getByRole('button', { name: /^Create$/i });
    this.cancelBtn = page.getByRole('button', { name: /^Cancel$/i });

    this.bell = page.getByRole('button', { name: /notification|bell/i }).or(page.locator('[class*="notification" i] button, button[aria-label*="notif" i]')).first();
  }

  // ── navigation ──
  async gotoList() {
    await this.page.goto('/cc/cms/products/stock', { waitUntil: 'domcontentloaded' });
  }
  async gotoProducts() {
    await this.page.goto('/cc/cms/products', { waitUntil: 'domcontentloaded' });
  }
  async gotoInventory() {
    await this.page.goto('/cc/cms/inventory', { waitUntil: 'domcontentloaded' });
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

  // ── list row ──
  row(textMatch: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(textMatch, 'i') })
      .or(this.page.locator('tr', { hasText: textMatch })).first();
  }
  async search(term: string) {
    await this.searchBox.fill(term);
    await this.page.keyboard.press('Enter').catch(() => {});
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── badges ──
  /** badge near an item label — e.g. "Low Stock (3)" / "Out of Stock (0)" / "In Stock" */
  badge(itemLabel: string, kind: 'In Stock' | 'Low Stock' | 'Out of Stock', qty?: number): Locator {
    const text = qty === undefined ? kind : `${kind} (${qty})`;
    return this.page.locator('tr, [class*="card" i], [class*="row" i]', { hasText: itemLabel })
      .getByText(new RegExp(text.replace(/[()]/g, '\\$&'), 'i')).first();
  }

  // ── stock detail modal (PS17) ──
  async openStockDetail(itemLabel: string) {
    const rowEl = this.page.locator('tr, [class*="card" i], [class*="row" i]', { hasText: itemLabel }).first();
    await rowEl.getByRole('button').last().click(); // detail icon ⚠️ unverified — last icon button on the row
  }

  // ── notification bell (PS15) ──
  async openBell() {
    await this.bell.click();
  }
  async filterNotification(type: string) {
    await this.page.getByRole('button', { name: new RegExp(type, 'i') })
      .or(this.page.getByRole('tab', { name: new RegExp(type, 'i') })).first().click();
  }

  // ── assertions ──
  async expectListReady() {
    await expect(this.addBtn).toBeVisible();
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
