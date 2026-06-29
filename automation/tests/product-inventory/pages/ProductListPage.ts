import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Product List Page (CMS `/cms/products/`)
 * ✅ Selectors VERIFIED via live DOM probe 2026-06-22:
 *   Cards  = div.bg-white.border.rounded-lg.p-4  (NOT <table>; default List/Grid view)
 *   View   = button[text="View"] (lucide-eye, title="View details")
 *   Edit   = button[text="Edit"] (lucide-square-pen)
 *   Delete = button:has(svg.lucide-trash2)  (icon-only, no text, no aria-label)
 *   View-toggle = button:has(svg.lucide-list/grid3x3/table)  (icon-only, no text)
 *   Delete dialog = div.fixed.inset-0 › h2 "Delete Confirmation" › buttons "Cancel" / "Delete"
 *   Item Details modal = div.fixed.inset-0 › h2 "Item Details" › buttons "Delete" / "Edit" / "Close"
 *   Empty state = "No entries to show"
 *   Filter Brand/Category = same custom searchable div-dropdown as form (click trigger → Search... → pick)
 *   Filter Status = input[type="radio"][name="active"] with span text Active/Inactive
 */
export class ProductListPage {
  readonly page: Page;
  readonly createBtn: Locator;
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
    this.createBtn = page.getByRole('button', { name: /Create Products?/i });
    this.searchInput = page.locator('input[placeholder="Search..."]').first();
    this.searchBtn = page.getByRole('button', { name: 'Search', exact: true });
    this.resetBtn = page.getByRole('button', { name: /Reset/i });
    this.filtersBtn = page.getByRole('button', { name: /Filters/i });
    this.table = page.getByRole('table');
    // view-toggle: icon-only buttons (no text/aria-label), identified by lucide SVG class
    this.viewList  = page.locator('button:has(svg.lucide-list)');
    this.viewGrid  = page.locator('button:has(svg.lucide-grid3x3)');
    this.viewTable = page.locator('button:has(svg.lucide-table)');
  }

  async goto() {
    await this.page.goto(process.env.PIM_PRODUCTS_PATH || '/cms/products');
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchBtn.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async reset() {
    await this.resetBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /**
   * Filter panel:
   *   Brand / Category = searchable custom dropdown (same pattern as form):
   *     click trigger div → input[placeholder="Search..."] appears → fill → click option
   *   Status = radio buttons: input[type="radio"][name="active"] + span "Active"/"Inactive"
   */
  async filter(label: 'Brand' | 'Category' | 'Status', value: string) {
    // open Filters panel if not yet open
    const panel = this.page.locator('label').filter({ hasText: 'Status' });
    if (!(await panel.isVisible().catch(() => false))) {
      await this.filtersBtn.click();
      await this.page.waitForTimeout(300);
    }

    if (label === 'Status') {
      // Status = radio buttons inside <label> elements; .check() fails on custom-styled radios → click label
      await this.page.locator('label').filter({ hasText: new RegExp(`^${value}$`) }).first().click();
    } else {
      // Brand / Category: searchable custom dropdown
      const trigger = this.page.locator(`label:has-text("${label}")`).locator('xpath=following-sibling::div[1]');
      await trigger.click();
      const search = this.page.locator('input[placeholder="Search..."]').last();
      await search.fill(value);
      await this.page.waitForTimeout(300);
      // dispatchEvent required: .click() closes the dropdown but doesn't fire React's synthetic onClick
      await this.page.locator('div.px-3.py-2.cursor-pointer').filter({ hasText: new RegExp(`^${value}$`) }).first().dispatchEvent('click');
    }

    await this.searchBtn.click().catch(() => {});
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /** Cards in List/Grid view; falls back to <tr> for Table view */
  row(textMatch: string): Locator {
    return this.page
      .locator('div.bg-white.border.rounded-lg.p-4, tr')
      .filter({ hasText: textMatch })
      .first();
  }

  private async waitRow(textMatch: string) {
    await expect(this.row(textMatch)).toBeVisible({ timeout: 15000 });
  }

  async clickView(textMatch: string) {
    await this.waitRow(textMatch);
    await this.row(textMatch).getByRole('button', { name: 'View', exact: true }).click();
    await this.page.waitForTimeout(500);
  }

  async clickEdit(textMatch: string) {
    await this.waitRow(textMatch);
    await this.row(textMatch).getByRole('button', { name: 'Edit', exact: true }).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async clickDelete(textMatch: string) {
    await this.waitRow(textMatch);
    // Delete button = icon-only (lucide-trash2), no text
    await this.row(textMatch).locator('button:has(svg.lucide-trash2)').click();
  }

  async expectRowVisible(textMatch: string) {
    await expect(this.row(textMatch)).toBeVisible();
  }

  async expectRowCount(n: number) {
    await expect(this.table.getByRole('row')).toHaveCount(n + 1);
  }

  async expectEmptyState() {
    await expect(this.page.getByText('No entries to show')).toBeVisible();
  }

  // ── view-mode toggle ──────────────────────────────────────────────────────
  async switchView(mode: 'List' | 'Grid' | 'Table') {
    await ({ List: this.viewList, Grid: this.viewGrid, Table: this.viewTable }[mode]).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── column sort (Table view) ──────────────────────────────────────────────
  async clickSort(column: string) {
    await this.page.getByRole('columnheader', { name: new RegExp(column, 'i') }).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async columnValues(column: string): Promise<string[]> {
    const cells = this.page.getByRole('cell').filter({ has: this.page.locator(`[data-col="${column}"]`) });
    return cells.allInnerTexts().catch(() => [] as string[]);
  }

  // ── delete confirmation dialog ────────────────────────────────────────────
  // Dialog: div.fixed.inset-0 › h2 "Delete Confirmation" › p "…This action cannot be undone."
  async expectDeleteDialog() {
    await expect(this.page.getByText('Delete Confirmation')).toBeVisible();
    await expect(this.page.getByText(/This action cannot be undone/i)).toBeVisible();
  }

  async confirmDelete() {
    // Dialog has Cancel + Delete buttons; use the last "Delete" to avoid hitting card delete btn
    await this.page.locator('div.fixed.inset-0').getByRole('button', { name: 'Delete', exact: true }).click();
  }

  async cancelDelete() {
    await this.page.locator('div.fixed.inset-0').getByRole('button', { name: 'Cancel', exact: true }).click();
  }
}
