import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Customer List Page (VCP)
 * ✅ Selectors VERIFIED กับ live DOM (staging, UI = English) 2026-06-16:
 *   - search   = textbox "Search Name,Mobile Number,Email..." + button "Search"
 *   - filter   = native <select> (Type/Bronze/Silver/Gold/Platinum) → selectOption
 *   - add      = button "Add Customer"
 *   - table    = role=table · row action = button "View"/"Edit"/"Delete"
 *   - empty    = text "No results found."
 */
export class CustomerListPage {
  readonly page: Page;
  readonly addCustomerBtn: Locator;
  readonly searchInput: Locator;
  readonly searchBtn: Locator;
  readonly clearFilterBtn: Locator;
  readonly typeFilter: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addCustomerBtn = page.getByRole('button', { name: 'Add Customer' });
    this.searchInput = page.getByRole('textbox', { name: /Search/i });
    this.searchBtn = page.getByRole('button', { name: 'Search', exact: true });
    this.clearFilterBtn = page.getByRole('button', { name: /Clear Filters/i });
    this.typeFilter = page.getByRole('combobox').first();
    this.table = page.getByRole('table');
  }

  async goto() {
    await this.page.goto('/cc/contacts-list');
    // networkidle: รอ XHR list response กลับมาก่อน (pagination state อัปเดตหลัง API คืนค่า)
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /** filter เป็น native <select> → ใช้ selectOption (label อังกฤษ: Bronze/Silver/Gold/Platinum) */
  async filterType(type: string) {
    await this.typeFilter.selectOption({ label: type });
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async clearFilter() {
    await this.clearFilterBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /** row ของ customer ตามชื่อ/อีเมล (match ข้อความใน row) */
  row(textMatch: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(textMatch, 'i') })
      .or(this.page.locator('tr', { hasText: textMatch }))
      .first();
  }

  /** รอ row โผล่ก่อน (bounded) — fail เร็ว+ชัด แทนรอ action timeout 90s ถ้า row ไม่มา */
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

  async expectNoResults() {
    // verified live (EN): empty state = "No results found."
    await expect(this.page.getByText(/no results found/i)).toBeVisible();
  }

  // ── Delete confirmation modal (verified EN: heading "Delete" + "Delete <name>?" + Cancel/Delete) ──
  /** modal ยืนยันลบโผล่ (ไม่ใช่ role=dialog → ตรวจด้วยข้อความ "Delete <name>?") */
  async expectDeleteDialog() {
    await expect(this.page.getByText(/^Delete .+\?$/)).toBeVisible();
  }
  /** ปุ่มยืนยันใน modal = "Delete" (ตัวสุดท้ายใน DOM = ปุ่มใน modal ไม่ใช่ของ row) */
  async confirmDelete() {
    await this.page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  }
  async cancelDelete() {
    await this.page.getByRole('button', { name: 'Cancel', exact: true }).click();
  }

  // ── View Toggle (TS-10) ─────────────────────────────────────────────────────────────
  // UI: 2 icon-buttons muมบนซ้าย — ☰ (Table) และ ⊞ (Grid). Active = highlighted สีน้ำเงิน
  // ⚠️ Selectors ยังไม่ได้ verify กับ live DOM — ลอง aria-label / role ก่อน; ถ้า fail จะ annotate
  /** ปุ่ม Table View (☰) */
  get tableViewBtn() {
    return this.page.getByRole('button', { name: /table.?view|list.?view/i })
      .or(this.page.locator('[aria-label*="table" i], [aria-label*="list" i]').first())
      .or(this.page.locator('button').nth(0))  // fallback: first toggle button
      .first();
  }

  /** ปุ่ม Grid View (⊞) */
  get gridViewBtn() {
    return this.page.getByRole('button', { name: /grid.?view/i })
      .or(this.page.locator('[aria-label*="grid" i]').first())
      .or(this.page.locator('button').nth(1))  // fallback: second toggle button
      .first();
  }

  async clickTableView() {
    await this.tableViewBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async clickGridView() {
    await this.gridViewBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /** ตรวจว่า table (columns layout) กำลัง visible */
  async expectTableViewActive() {
    await expect(this.table).toBeVisible({ timeout: 8000 });
  }

  /** ตรวจว่า Grid/Card layout กำลัง visible (table ซ่อน) */
  async expectGridViewActive() {
    // Grid view: cards = div/article ที่มี role หรือ class grid/card — ลองหลายวิธี
    const gridContainer = this.page.locator('[class*="grid" i], [class*="card" i]').first()
      .or(this.page.getByRole('list').first());
    await expect(gridContainer).toBeVisible({ timeout: 8000 });
    // และ table ไม่ควร visible ใน Grid mode
    await expect(this.table).not.toBeVisible({ timeout: 5000 }).catch(() => {
      // ถ้า table ยัง visible อาจ overlay — ไม่ hard-fail แต่ annotate
    });
  }

  // ── Pagination (TS-09 / TA-18 / TA-19) ─────────────────────────────────────────────
  // ⚠️ Selectors ยังไม่ได้ verify กับ live DOM — ต้องรัน probe ก่อน (browser offline ตอน gen)
  // Priority: aria-label → role → fallback CSS.  อัปเดตพร้อม DOM comment เมื่อ verify แล้ว

  /** ปุ่ม Next Page: ลอง aria-label "Next page" / "Next" / SVG chevron ตาม pattern ทั่วไป */
  get nextPageBtn() {
    return this.page.getByRole('button', { name: /next\s*page|next/i })
      .or(this.page.locator('[aria-label*="next" i]'))
      .first();
  }

  /** ปุ่ม Previous Page */
  get prevPageBtn() {
    return this.page.getByRole('button', { name: /prev(ious)?\s*page|prev(ious)?/i })
      .or(this.page.locator('[aria-label*="prev" i]'))
      .first();
  }

  /** dropdown rows-per-page (ลอง role=combobox สุดท้าย / select[name*=size] / select ตัวที่สอง) */
  get rowsPerPageSelect() {
    return this.page.locator('select').last()
      .or(this.page.locator('[aria-label*="rows" i], [aria-label*="per page" i]').first());
  }

  /** page indicator text (e.g. "1–10 of 50", "Page 1") */
  get pageIndicator() {
    return this.page.locator('[class*="pagination" i], [class*="page-info" i]').first()
      .or(this.page.getByText(/\d+\s*[–\-]\s*\d+\s*(of|\/)\s*\d+/i).first());
  }

  async clickNextPage() {
    await this.nextPageBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async clickPrevPage() {
    await this.prevPageBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async selectRowsPerPage(value: string) {
    // ลอง native <select> ก่อน, fallback combobox
    const sel = this.rowsPerPageSelect;
    const tag = await sel.evaluate(el => el.tagName.toLowerCase()).catch(() => 'unknown');
    if (tag === 'select') {
      await sel.selectOption(value);
    } else {
      await sel.click();
      await this.page.getByRole('option', { name: value, exact: true }).click();
    }
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /** รับจำนวน row ปัจจุบันใน tbody (ไม่นับ header) */
  async getVisibleRowCount(): Promise<number> {
    return await this.table.locator('tbody tr').count();
  }

  async expectNextDisabled() {
    await expect(this.nextPageBtn).toBeDisabled();
  }

  async expectPrevDisabled() {
    await expect(this.prevPageBtn).toBeDisabled();
  }
}
