import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Product List Page (CMS `/cms/products/`)
 * ⚠️ Selectors = best-effort จาก design (button labels: "Create Products", view-toggle, columns,
 *    "Delete Confirmation" / "This action cannot be undone.") — ยังไม่ verified กับ live DOM
 *    (รอบนี้ไม่มี credential probe). ก่อน execute จริงให้ verify ด้วย live DOM แล้วเก็บใน LOCATORS.md
 *    Selector priority: getByRole → getByLabel → getByPlaceholder → getByText → getByTestId
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
    this.searchInput = page.getByRole('textbox', { name: /Search/i });
    this.searchBtn = page.getByRole('button', { name: 'Search', exact: true });
    this.resetBtn = page.getByRole('button', { name: /Reset/i });
    this.filtersBtn = page.getByRole('button', { name: /Filters/i });
    this.table = page.getByRole('table');
    // view-toggle (3 ปุ่ม) — ใช้ accessible name/aria-label; fallback testid ถ้า role ไม่ match
    this.viewList = page.getByRole('button', { name: /List/i }).or(page.getByTestId('view-list'));
    this.viewGrid = page.getByRole('button', { name: /Grid/i }).or(page.getByTestId('view-grid'));
    this.viewTable = page.getByRole('button', { name: /Table/i }).or(page.getByTestId('view-table'));
  }

  /** CMS อาจอยู่คนละ base กับ /cc — override ด้วย env PIM_PRODUCTS_PATH ถ้าจำเป็น */
  async goto() {
    await this.page.goto(process.env.PIM_PRODUCTS_PATH || '/cms/products');
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async reset() {
    await this.resetBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /** filter (Brand/Category/Status) — เปิด Filters panel แล้วเลือก. native <select> → selectOption */
  async filter(label: 'Brand' | 'Category' | 'Status', value: string) {
    await this.filtersBtn.click().catch(() => {});
    const select = this.page.getByRole('combobox', { name: new RegExp(label, 'i') })
      .or(this.page.getByLabel(new RegExp(label, 'i')));
    await select.selectOption({ label: value }).catch(async () => {
      // custom dropdown fallback: click trigger + option
      await this.page.getByText(new RegExp(`^${label}$`, 'i')).click().catch(() => {});
      await this.page.getByRole('option', { name: value }).click();
    });
    await this.searchBtn.click().catch(() => {});
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  row(textMatch: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(textMatch, 'i') })
      .or(this.page.locator('tr', { hasText: textMatch }))
      .first();
  }

  private async waitRow(textMatch: string) {
    await expect(this.row(textMatch)).toBeVisible({ timeout: 15000 });
  }

  async clickView(textMatch: string) {
    await this.waitRow(textMatch);
    await this.row(textMatch).getByRole('button', { name: 'View' }).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }
  async clickEdit(textMatch: string) {
    await this.waitRow(textMatch);
    await this.row(textMatch).getByRole('button', { name: 'Edit' }).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }
  async clickDelete(textMatch: string) {
    await this.waitRow(textMatch);
    await this.row(textMatch).getByRole('button', { name: 'Delete' }).click();
  }

  async expectRowVisible(textMatch: string) {
    await expect(this.row(textMatch)).toBeVisible();
  }
  async expectRowCount(n: number) {
    await expect(this.table.getByRole('row')).toHaveCount(n + 1); // +1 header row
  }
  async expectEmptyState() {
    // ⚠️ exact text ยังรอ PO (HA11) — ตรวจหลายแบบ จนกว่าจะได้ exact text
    await expect(this.page.getByText(/no results|no products|not found|ไม่พบ/i)).toBeVisible();
  }

  // ── view-mode toggle ─────────────────────────────────────────────────────
  async switchView(mode: 'List' | 'Grid' | 'Table') {
    await ({ List: this.viewList, Grid: this.viewGrid, Table: this.viewTable }[mode]).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── column sort (Table view) — คืน array ของค่าคอลัมน์ตามลำดับที่แสดง ───────
  async clickSort(column: string) {
    await this.page.getByRole('columnheader', { name: new RegExp(column, 'i') }).click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }
  /** อ่านค่าคอลัมน์ (เช่น Product Name) ทุก row ตามลำดับ — ใช้ assert ลำดับ sort */
  async columnValues(column: string): Promise<string[]> {
    const cells = this.page.getByRole('cell').filter({ has: this.page.locator(`[data-col="${column}"]`) });
    return cells.allInnerTexts().catch(() => [] as string[]);
  }

  // ── delete confirmation dialog ────────────────────────────────────────────
  async expectDeleteDialog() {
    await expect(this.page.getByText(/This action cannot be undone/i)).toBeVisible();
  }
  async confirmDelete() {
    await this.page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  }
  async cancelDelete() {
    await this.page.getByRole('button', { name: 'Cancel', exact: true }).click();
  }
}
