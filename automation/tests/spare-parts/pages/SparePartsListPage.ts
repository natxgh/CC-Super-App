import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Spare Parts List Page (CMS `/cms/inventory/`)
 * ✅ Selectors VERIFIED via live DOM probe 2026-06-25 (with language='en' — same as LoginPage.login()):
 *   Cards    = div.bg-white.border.rounded-lg  (List view default — same pattern as /cms/products/)
 *   Add      = "Create Spare Parts" button (lucide-plus)
 *   Search   = input[placeholder="Search..."]
 *   View btn = "View" (title="View details", lucide-eye)
 *   Edit btn = "Edit" (lucide-square-pen)
 *   Delete   = button:has(svg.lucide-trash2)  (icon-only, red ring)
 *   View-toggle = button:has(svg.lucide-list/grid3x3/table)  (icon-only — same as /cms/products/)
 *   Stock badge = span.rounded-full  → "Out of Stock (N)" / "Low Stock (N)" / "In Stock (N)"
 *   Empty state  = ⚠️ unverified — probe when SEARCH_NONE is searched
 *   Filter panel = ⚠️ unverified — probe after clicking Filters
 *   Delete dialog = ⚠️ unverified — assumed same as products (div.fixed.inset-0)
 */
export class SparePartsListPage {
  readonly page: Page;
  readonly addBtn: Locator;
  readonly searchInput: Locator;
  readonly searchBtn: Locator;
  readonly resetBtn: Locator;
  readonly filtersBtn: Locator;
  readonly table: Locator;
  readonly viewList: Locator;
  readonly viewGrid: Locator;
  readonly viewTable: Locator;

  constructor(page: Page) {
    this.page = page;
    // ✅ verified (English UI — language='en' set by LoginPage)
    this.addBtn      = page.getByRole('button', { name: /Create Spare Parts?/i });
    this.searchInput = page.locator('input[placeholder="Search..."]').first();
    this.searchBtn   = page.getByRole('button', { name: 'Search', exact: true });
    this.resetBtn    = page.getByRole('button', { name: /Reset/i });
    this.filtersBtn  = page.getByRole('button', { name: /Filters/i });
    this.table       = page.getByRole('table');
    // view-toggle: icon-only buttons, same lucide pattern as /cms/products/ ✅
    this.viewList  = page.locator('button:has(svg.lucide-list)');
    this.viewGrid  = page.locator('button:has(svg.lucide-grid3x3)');
    this.viewTable = page.locator('button:has(svg.lucide-table)');
  }

  async goto() {
    await this.page.goto(process.env.SP_INVENTORY_PATH || '/cms/inventory/', { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchBtn.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async reset() {
    await this.resetBtn.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Filter panel: open Filters → pick Brand or Status
   * ⚠️ Filter panel DOM unverified — assumed same custom div-dropdown as /cms/products/
   */
  async filter(label: 'Brand' | 'Status', value: string) {
    const panel = this.page.locator('label').filter({ hasText: 'Status' });
    if (!(await panel.isVisible().catch(() => false))) {
      await this.filtersBtn.click();
      await this.page.waitForTimeout(300);
    }

    if (label === 'Status') {
      await this.page.locator('label').filter({ hasText: new RegExp(`^${value}$`) }).first().click();
    } else {
      // Brand: searchable custom dropdown (same pattern as products)
      const trigger = this.page.locator(`label:has-text("${label}")`).locator('xpath=following-sibling::div[1]');
      await trigger.click();
      const search = this.page.locator('input[placeholder="Search..."]').last();
      await search.fill(value);
      await this.page.waitForTimeout(300);
      await this.page.locator('div.cursor-pointer').filter({ hasText: value }).last().click();
    }

    await this.searchBtn.click().catch(() => {});
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /** ✅ verified: cards = div.bg-white.border.rounded-lg (List/Grid view); no <table> in default view */
  row(textMatch: string): Locator {
    return this.page
      .locator('div.bg-white.border.rounded-lg, tr')
      .filter({ hasText: textMatch })
      .first();
  }

  private async waitRow(textMatch: string) {
    await expect(this.row(textMatch)).toBeVisible({ timeout: 15000 });
  }

  async clickView(textMatch: string) {
    await this.waitRow(textMatch);
    // ✅ button text = "View" (English), title="View details"
    await this.row(textMatch).getByRole('button', { name: 'View', exact: true }).click();
    await this.page.waitForTimeout(500);
  }

  async clickEdit(textMatch: string) {
    await this.waitRow(textMatch);
    // ✅ button text = "Edit" (English)
    await this.row(textMatch).getByRole('button', { name: 'Edit', exact: true }).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async clickDelete(textMatch: string) {
    await this.waitRow(textMatch);
    // ✅ Delete = icon-only lucide-trash2, red ring
    await this.row(textMatch).locator('button:has(svg.lucide-trash2)').click();
  }

  async expectRowVisible(textMatch: string) {
    await expect(this.row(textMatch)).toBeVisible();
  }

  async expectEmptyState() {
    // ⚠️ exact text unverified — probe with SEARCH_NONE; "No entries to show" is product pattern
    await expect(
      this.page.getByText(/No entries to show|no results|not found/i)
    ).toBeVisible();
  }

  /**
   * Stock badge for a given part row
   * ✅ verified (English): "Out of Stock (N)" / "Low Stock (N)" / "In Stock (N)"
   * Badge = span.rounded-full inside card
   */
  stockBadge(textMatch: string): Locator {
    return this.row(textMatch).locator('span.rounded-full').first();
  }

  // ── view-mode toggle ──────────────────────────────────────────────────────
  async switchView(mode: 'List' | 'Grid' | 'Table') {
    await ({ List: this.viewList, Grid: this.viewGrid, Table: this.viewTable }[mode]).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── column sort (Table view) ──────────────────────────────────────────────
  // ⚠️ column header text in Table view unverified — probe after switchView('Table')
  async clickSort(column: 'PART NAME' | 'YEAR' | 'PRICE' | 'WARRANTY') {
    await this.page.getByRole('columnheader', { name: new RegExp(column, 'i') }).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── delete confirmation dialog ────────────────────────────────────────────
  // ⚠️ dialog selector assumed same as products (div.fixed.inset-0) — unverified
  async expectDeleteDialog() {
    await expect(this.page.getByText(/Delete Confirmation/i)).toBeVisible();
  }

  async confirmDelete() {
    await this.page.locator('div.fixed.inset-0').getByRole('button', { name: /^Delete$/i }).click();
  }

  async cancelDelete() {
    await this.page.locator('div.fixed.inset-0').getByRole('button', { name: 'Cancel', exact: true }).click();
  }
}
