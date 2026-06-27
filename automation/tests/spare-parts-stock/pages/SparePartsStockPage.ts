import { Page, Locator, expect } from '@playwright/test';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Page Object — Spare Parts Stock Management (SPS)
 * Route: stock units list = /cms/inventory/stock  · badges/master = /cms/inventory/
 *
 * ✅ DOM probed live on QA (skyai-cloud-cc-qa, v0.27.5→v0.27.10, 2026-06-22→2026-06-26):
 *   - heading "Spare Parts Stock" [h2] · textbox "Search..." · buttons Search/Filters/Reset
 *   - TWO unnamed view-toggle buttons right after Reset (1st = List, 2nd = Table) — no a11y name
 *   - List view: rows = text "Serial No.:<sn> Spare Part:<p> Store:<s> Status:<label>" + button "View"
 *   - Table view: <table> with columnheader "Serial No./Spare Part/Store/Status/Action",
 *     each row's action = eye-icon button (unnamed, opens Item Details modal)
 *   - Status renders as LABEL not code (R001→"New", R007→"Delivered")
 *   - Item Details: MODAL DIALOG (centered overlay, v0.27.10) — heading "Item Details" [h2] +
 *     text "Serial No. <sn> Spare Part <p> Store <s> Status <label>" + buttons Delete/Edit/Close
 *   - ⚠️ v0.27.10 BUG: "Delete" button in Item Details closes the modal only (0 GQL requests, no confirm)
 *   - Edit: MODAL DIALOG heading "Edit Spare Parts Stock" [h2] · textbox "Enter serial no." (pre-filled) ·
 *     Spare Part / Store styled textboxes (show current value, custom select) · NO Status field ·
 *     buttons Cancel / "Update Spare Parts Stock"
 *   - ⚠️ Serial field change in Edit: changing serial and clicking Update triggers 0 GQL (v0.27.10)
 *   - Filters: inline panel → adds "Spare Part Search..." + "Store Search..." textboxes
 *   - Pagination: v0.27.10 added pagination (Previous/1/2/3/4/5/Next visible in QA data)
 *   - Language: UI appears in user account language (Thai for ketwadee); English via Language toggle
 */
export class SparePartsStockPage {
  readonly page: Page;

  // ── list / toolbar ──
  readonly heading: Locator;
  readonly searchBox: Locator;
  readonly searchBtn: Locator;
  readonly filtersBtn: Locator;
  readonly resetBtn: Locator;
  readonly listToggle: Locator;
  readonly tableToggle: Locator;
  // ── Item Details panel ──
  readonly detailsHeading: Locator;
  readonly viewDeleteBtn: Locator;
  readonly viewEditBtn: Locator;
  readonly closeBtn: Locator;
  // ── Edit panel ──
  readonly editHeading: Locator;
  readonly serialNo: Locator;
  readonly statusField: Locator;
  readonly updateBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    const main = page.locator('main');
    this.heading = page.getByRole('heading', { name: /Spare Parts Stock/i, level: 2 });
    this.searchBox = main.getByRole('textbox', { name: /search/i }).first().or(main.getByPlaceholder(/^Search\.\.\.$/).first());
    this.searchBtn = page.getByRole('button', { name: 'Search', exact: true });
    this.filtersBtn = page.getByRole('button', { name: 'Filters', exact: true });
    this.resetBtn = page.getByRole('button', { name: 'Reset', exact: true });
    // the 2 unnamed toolbar buttons immediately after Reset = view toggles (1=List, 2=Table)
    this.listToggle = this.resetBtn.locator('xpath=following::button[1]');
    this.tableToggle = this.resetBtn.locator('xpath=following::button[2]');

    this.detailsHeading = page.getByRole('heading', { name: 'Item Details', level: 2 });
    this.viewDeleteBtn = page.getByRole('button', { name: 'Delete', exact: true });
    this.viewEditBtn = page.getByRole('button', { name: 'Edit', exact: true });
    this.closeBtn = page.getByRole('button', { name: 'Close', exact: true });

    this.editHeading = page.getByRole('heading', { name: 'Edit Spare Parts Stock', level: 2 });
    this.serialNo = page.getByRole('textbox', { name: /Enter serial no/i }).or(page.getByPlaceholder(/Enter serial no/i)).first();
    this.statusField = page.getByLabel(/^Status/i);
    this.updateBtn = page.getByRole('button', { name: 'Update Spare Parts Stock', exact: true });
    this.cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
  }

  // ── navigation ──
  async gotoStock() {
    await this.page.goto('/cms/inventory/stock', { waitUntil: 'domcontentloaded' });
    await this.heading.waitFor();
  }
  async gotoInventory() {
    await this.page.goto('/cms/inventory/', { waitUntil: 'domcontentloaded' });
  }

  // ── list rows (text blocks "Serial No.:<sn> …", each followed by its "View" button) ──
  row(serial: string): Locator {
    return this.page.getByText(new RegExp(`Serial No\\.:\\s*${escapeRe(serial)}\\b`, 'i')).first();
  }
  /** open the Item Details panel for a serial (click that row's View button) */
  async openDetails(serial: string) {
    const row = this.row(serial);
    await row.scrollIntoViewIfNeeded().catch(() => {});
    await row.locator('xpath=following::button[normalize-space()="View"][1]').click();
    await this.detailsHeading.waitFor();
  }

  // ── search / filter ──
  async search(term: string) {
    await this.searchBox.fill(term);
    await this.searchBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }
  /** open the inline Filters panel (adds Spare Part + Store filter fields) */
  async openFilters() {
    await this.filtersBtn.click();
    await this.page.getByText('Spare Part', { exact: false }).first().waitFor();
  }
  /** the inline Filters panel exposes a "Spare Part" and a "Store" filter field */
  filterField(which: 'Spare Part' | 'Store'): Locator {
    return this.page.locator('main').getByText(which, { exact: false }).first();
  }
  /** best-effort: type into a filter field's typeahead (custom widget — may not apply) */
  async filter(which: 'Spare Part' | 'Store', value: string) {
    const boxes = this.page.locator('main').getByRole('textbox');
    const idx = which === 'Spare Part' ? 1 : 2; // 0 = main search
    await boxes.nth(idx).fill(value).catch(() => {});
    await this.page.getByRole('option', { name: new RegExp(escapeRe(value), 'i') })
      .or(this.page.getByText(value, { exact: false })).first().click().catch(() => {});
  }
  /** click the external-link button next to a part's badge → filtered stock (best-effort) */
  async drillDownFromBadge(part: string) {
    const partText = this.page.locator('main').getByText(new RegExp(`${escapeRe(part)}[\\s\\S]*?Stock:`, 'i')).first();
    await partText.scrollIntoViewIfNeeded().catch(() => {});
    await partText.locator('xpath=following::button[1]').click().catch(() => {});
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }
  async reset() {
    await this.resetBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── table view ──
  async switchToTable() {
    await this.tableToggle.click();
    await this.page.getByRole('columnheader', { name: 'Serial No.' }).waitFor();
  }
  async sortBySerial() {
    await this.page.getByRole('columnheader', { name: 'Serial No.' }).click();
  }

  // ── Edit ──
  async openEdit(serial: string) {
    await this.openDetails(serial);
    await this.viewEditBtn.click();
    await this.editHeading.waitFor();
  }
  async submitUpdate() {
    await this.updateBtn.click();
  }

  // ── badges (master /cms/inventory/) — inline row text "<part> … Stock: <kind> (<qty>)" ──
  badge(part: string, kind: 'In Stock' | 'Low Stock' | 'Out of Stock', qty?: number): Locator {
    const tail = qty === undefined ? kind : `${kind} \\(${qty}\\)`;
    return this.page.getByText(new RegExp(`${escapeRe(part)}[\\s\\S]*?Stock:\\s*${tail}`, 'i')).first();
  }

  // ── assertions ──
  async expectListReady() {
    await expect(this.heading).toBeVisible();
    await expect(this.searchBox).toBeVisible();
    await expect(this.searchBtn).toBeVisible();
    await expect(this.resetBtn).toBeVisible();
  }
  async expectEmptyState(text: string) {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
  }
  async expectFieldError(field: Locator) {
    // form stays open (Update button still visible) = not saved; field still present
    await expect(this.updateBtn).toBeVisible();
    await expect(field).toBeVisible();
  }
  async expectToast(text: string) {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
  }
}
