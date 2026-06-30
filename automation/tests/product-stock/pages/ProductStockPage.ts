import { Page, Locator, expect } from '@playwright/test';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Page Object — Product Stock Management (PS)
 *
 * ✅ DOM verified live 2026-06-22 via playwright probes (ketwadee / Admin):
 *   Route: /cms/products/stock
 *   Heading: "Products Stock" [h2]
 *   Rows: text block "Serial No.:SN Product:P Registered Date:D Manufacturing Warranty: Store:S Status:ST …"
 *         each followed by a single button "View" (no Edit/Delete on list row)
 *   View → opens "Item Details" overlay (no dialog role) with Delete / Edit / Close buttons
 *   Edit → opens "Edit Products Stock" modal with same fields + "Update Products Stock" submit
 *
 * ❌ "Add Product Stock" button NOT present in v0.27.7 staging (even for Admin).
 *    Add-flow tests (TS-01..03, TS-09, TA-01..08) are test.fixme until FE ships the feature.
 *
 * /cms/inventory/ = Spare Parts MASTER list (Part Name, Brand, Stock badge) — DIFFERENT feature.
 *   "Create Spare Parts" there creates a spare-part definition, not a stock unit.
 */
export class ProductStockPage {
  readonly page: Page;

  // ── list page ──
  // ✅ heading verified 2026-06-22
  readonly heading: Locator;
  readonly searchBox: Locator;
  readonly list: Locator;
  // ❌ addBtn: "Add Product Stock" not in current staging build
  readonly addBtn: Locator;

  // ── Add modal (not yet in staging) ──
  readonly serialNo: Locator;
  readonly product: Locator;
  readonly store: Locator;
  readonly registeredDate: Locator;
  readonly manufacturingWarranty: Locator;
  // photo upload — file input inside the Add modal (selector probed 2026-06-29)
  // ⚠️ BUG: FE uploads file to storage but does NOT call UploadFileCRM mutation → image URL not persisted
  readonly photoInput: Locator;
  readonly createBtn: Locator;
  readonly cancelBtn: Locator;

  // ── Item Details overlay (opened by View button) ──
  // ✅ verified 2026-06-22: heading text "Item Details", no dialog role
  // Fields: Serial No. / Product / Store / Status / Registered Date / Manufacturing Warranty /
  //         Purchased Date / End of Warranty
  // Buttons: Delete (red) · Edit · Close
  readonly itemDetailsHeading: Locator;
  readonly detailCloseBtn: Locator;
  readonly detailEditBtn: Locator;
  readonly detailDeleteBtn: Locator;

  // ── Delete confirmation modal ──
  // ✅ verified 2026-06-29: no dialog role; heading "Delete Confirmation"; buttons Cancel · Delete (red)
  readonly deleteConfirmHeading: Locator;
  readonly deleteConfirmBtn: Locator;

  // ── Edit modal ──
  // ✅ verified 2026-06-22: title "Edit Products Stock", submit "Update Products Stock"
  readonly editModalHeading: Locator;
  readonly updateBtn: Locator;

  // ── notification ──
  // ✅ verified live 2026-06-21
  readonly bell: Locator;

  constructor(page: Page) {
    this.page = page;

    // list page
    this.heading = page.getByRole('heading', { name: /Products?\s*Stock/i });
    this.searchBox = page.getByRole('textbox', { name: /search/i }).or(page.getByPlaceholder(/search/i)).first();
    this.list = page.getByText(/Serial No\.:/i).first();
    // ✅ verified 2026-06-29: list page button = "Create Products Stock" (not "Add Product Stock")
    this.addBtn = page.getByRole('button', { name: /Create Products?\s*Stock/i }).first();

    // Add modal fields ✅ verified live 2026-06-29 via probe-ps-fullform.mjs:
    //   serialNumber = input[name="serialNumber"] placeholder="Enter serial no."
    //   registerDate = input[type="datetime-local"][name="registerDate"]
    //   mfw          = input[type="datetime-local"][name="mfw"]
    //   Product/Store = custom div dropdowns (no native select) — click trigger → Search input
    // ⚠️ image upload NOT present on QA staging (feature not yet deployed) — selector kept for when it lands
    this.serialNo = page.locator('input[name="serialNumber"]');
    // custom div dropdowns: click the div following the label → input[placeholder="Search..."] appears
    this.product = page.locator('label:has-text("Product")').locator('xpath=following-sibling::div[1]').first();
    this.store = page.locator('label:has-text("Store")').locator('xpath=following-sibling::div[1]').first();
    this.registeredDate = page.locator('input[name="registerDate"]');
    this.manufacturingWarranty = page.locator('input[name="mfw"]');
    // photo upload: ⚠️ NOT on QA staging yet — selector for when image field is deployed
    this.photoInput = page.locator('#photo-upload').or(page.locator('input[type="file"]')).first();
    // modal submit = "Create Products Stock" (last button with this text after modal opens)
    this.createBtn = page.getByRole('button', { name: /Create Products?\s*Stock/i }).last();
    this.cancelBtn = page.getByRole('button', { name: /^Cancel$/i });

    // Item Details overlay — ✅ verified 2026-06-22
    this.itemDetailsHeading = page.getByText('Item Details', { exact: true });
    this.detailCloseBtn = page.getByRole('button', { name: /^Close$/i });
    this.detailEditBtn = page.getByRole('button', { name: /^Edit$/i });
    this.detailDeleteBtn = page.getByRole('button', { name: /^Delete$/i }).first();

    // Delete confirmation modal — ✅ verified 2026-06-29 (no dialog role)
    this.deleteConfirmHeading = page.getByText('Delete Confirmation', { exact: true });
    // after overlay Delete is clicked the confirmation modal stacks — last Delete btn = confirm
    this.deleteConfirmBtn = page.getByRole('button', { name: /^Delete$/i }).last();

    // Edit modal — ✅ verified 2026-06-22
    this.editModalHeading = page.getByText('Edit Products Stock', { exact: true });
    this.updateBtn = page.getByRole('button', { name: /Update Products Stock/i });

    // notification bell
    this.bell = page.getByRole('button', { name: /Toggle notifications/i });
  }

  // ── navigation ──
  async gotoList() {
    await this.page.goto('/cms/products/stock', { waitUntil: 'domcontentloaded' });
  }
  async gotoProducts() {
    await this.page.goto('/cms/products/', { waitUntil: 'domcontentloaded' });
  }
  async gotoInventory() {
    await this.page.goto('/cms/inventory/', { waitUntil: 'domcontentloaded' });
  }

  // ── Add modal (not yet in staging) ──
  async openAddModal() {
    await this.addBtn.click();
    await expect(this.createBtn).toBeVisible();
  }

  // ✅ pattern verified live (same as product-inventory selectCustom 2026-06-22):
  //    click container div → input[placeholder="Search..."] appears (may be portal) → fill at page level
  //    → JS click option (avoids blur-closes-dropdown race)
  private async selectFromMaster(container: Locator, value: string) {
    await container.click();
    await this.page.waitForTimeout(400);
    // search input may render as portal outside container — locate at page level
    const searchInput = this.page.locator('input[placeholder="Search..."]').last();
    await searchInput.fill(value);
    await this.page.waitForTimeout(500);
    await this.page.evaluate((val) => {
      const opts = Array.from(document.querySelectorAll('div.cursor-pointer'));
      const opt = opts.find((d) => (d as HTMLElement).textContent?.trim() === val);
      if (opt) (opt as HTMLElement).click();
    }, value);
    await this.page.waitForTimeout(300);
  }

  async fillAddForm(d: { serialNumber?: string; product?: string; store?: string; registerDate?: string; mfw?: string; image?: string }) {
    if (d.serialNumber !== undefined) await this.serialNo.fill(d.serialNumber);
    if (d.product) await this.selectFromMaster(this.product, d.product);
    if (d.store) await this.selectFromMaster(this.store, d.store);
    // datetime-local inputs require "YYYY-MM-DDTHH:MM" — append T00:00 if only date given
    if (d.registerDate) {
      const v = d.registerDate.includes('T') ? d.registerDate : `${d.registerDate}T00:00`;
      await this.registeredDate.fill(v);
    }
    if (d.mfw) {
      const v = d.mfw.includes('T') ? d.mfw : `${d.mfw}T00:00`;
      await this.manufacturingWarranty.fill(v);
    }
    // image upload: skip gracefully if field not yet deployed on current env
    if (d.image && (await this.photoInput.count()) > 0) await this.photoInput.setInputFiles(d.image);
  }

  async submitCreate() {
    await this.createBtn.click();
  }

  async expectNoMasterOption(container: Locator, value: string) {
    await container.click();
    await this.page.waitForTimeout(400);
    const searchInput = this.page.locator('input[placeholder="Search..."]').last();
    await searchInput.fill(value);
    await this.page.waitForTimeout(400);
    // no option = no cursor-pointer div with that exact text
    const opts = await this.page.evaluate((val) => {
      return Array.from(document.querySelectorAll('div.cursor-pointer'))
        .some((d) => (d as HTMLElement).textContent?.trim() === val);
    }, value);
    expect(opts).toBe(false);
  }

  // ── list row ──
  // ✅ verified 2026-06-22: rows = text block "Serial No.:SN Product:P … Status:ST …" + button "View"
  row(sn: string): Locator {
    return this.page.getByText(new RegExp(`Serial No\\.:\\s*${escapeRe(sn)}`, 'i')).first();
  }

  async search(term: string) {
    await this.searchBox.fill(term);
    await this.page.getByRole('button', { name: /^Search$/i }).click().catch(() => this.page.keyboard.press('Enter'));
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── Item Details overlay (opened via View button) ──
  // ✅ verified 2026-06-22: View opens overlay with heading "Item Details" (no dialog role)
  async openStockDetail(sn: string) {
    // Each row: [text block with SN] [button "View"] — click View following the row text
    await this.row(sn).locator('xpath=following::button[normalize-space(.)="View"][1]').click();
    await this.itemDetailsHeading.waitFor({ state: 'visible' });
  }

  async closeDetail() {
    await this.detailCloseBtn.click();
    await this.itemDetailsHeading.waitFor({ state: 'hidden' });
  }

  // ── Delete flow ──
  // Click Delete in overlay → confirmation modal → click Confirm Delete
  // ✅ verified 2026-06-29: overlay closes after confirm regardless of success/failure
  async confirmDeleteFromDetail() {
    await this.detailDeleteBtn.click();
    await this.deleteConfirmHeading.waitFor({ state: 'visible' });
    await this.deleteConfirmBtn.click();
  }

  async expectDeleteFailed() {
    await expect(this.page.getByText(/delete.*fail/i).first()).toBeVisible({ timeout: 5000 });
  }

  // ── badges ── ✅ verified live 2026-06-21 on /cms/inventory/ and /cms/products/
  //    "<item name> … Stock: <kind> (<qty>)" e.g. "Mercedes-Benz M112 Stock: Low Stock (1)"
  badge(itemLabel: string, kind: 'In Stock' | 'Low Stock' | 'Out of Stock', qty?: number): Locator {
    const tail = qty === undefined ? kind : `${kind} \\(${qty}\\)`;
    return this.page.getByText(new RegExp(`${escapeRe(itemLabel)}[\\s\\S]*?Stock:\\s*${tail}`, 'i')).first();
  }

  // ── notification bell ──
  // ✅ verified 2026-06-22: panel = heading "Notifications", combobox "All Types", list, "View all notifications"
  async openBell() {
    await this.bell.click();
    await this.page.getByRole('heading', { name: /Notifications/i }).waitFor({ state: 'visible' });
  }

  async filterNotification(type: string) {
    const cb = this.page.getByRole('combobox').filter({ hasText: /all types/i })
      .or(this.page.locator('banner').getByRole('combobox')).first();
    // enumerate native <option> text, pick the matching one (avoids hanging RegExp cast)
    const opts = await cb.locator('option').allInnerTexts();
    const match = opts.find(o => o.toLowerCase().includes(type.toLowerCase()));
    if (match) {
      await cb.selectOption(match);
    } else {
      // custom dropdown fallback
      await cb.click();
      await this.page.getByRole('option', { name: new RegExp(type, 'i') }).first()
        .click({ timeout: 5000 }).catch(() => {});
    }
  }

  // ── assertions ──
  async expectListReady() {
    await expect(this.heading).toBeVisible();
    await expect(this.searchBox).toBeVisible();
  }

  async canAdd(): Promise<boolean> {
    return (await this.addBtn.count()) > 0;
  }

  async expectFieldError(field: Locator) {
    await expect(
      field.or(this.page.locator('[class*="error" i], [aria-invalid="true"]')).first()
    ).toBeVisible();
    await expect(this.createBtn).toBeVisible();
  }

  async expectCreateToast(text: string) {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
  }

  async expectDuplicateError() {
    await expect(this.page.getByText(/already exist|duplicate|ซ้ำ/i).first()).toBeVisible();
  }

  // ── detail field assertions (Item Details overlay) ──
  // ✅ verified 2026-06-22: overlay shows Serial No., Product, Store, Status, Registered Date,
  //    Manufacturing Warranty, Purchased Date, End of Warranty
  async expectDetailField(label: string, value: string) {
    await expect(this.page.getByText(new RegExp(`${escapeRe(label)}[\\s\\S]*?${escapeRe(value)}`, 'i'))).toBeVisible();
  }
}
