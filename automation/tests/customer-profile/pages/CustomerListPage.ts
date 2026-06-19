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
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
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
}
