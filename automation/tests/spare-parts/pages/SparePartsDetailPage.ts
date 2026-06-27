import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Item Details popup (View Spare Part)
 * ✅ modal = div.fixed.inset-0 (same pattern as /cms/products/ Item Details modal)
 *    All action buttons scoped inside modal to avoid strict-mode violation
 *    (list page has 10+ "Edit" / "View" / "Delete" buttons simultaneously)
 * ⚠️ Exact dialog text for delete confirmation unverified — assumed same as products
 */
export class SparePartsDetailPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly deleteBtn: Locator;
  readonly editBtn: Locator;
  readonly closeBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    // modal = div.fixed.inset-0 (same as ProductDetailPage — no <dialog> element)
    this.modal   = page.locator('div.fixed.inset-0').filter({ hasText: /Item Details/i }).first();
    // scope buttons inside modal to avoid strict-mode (list has many Edit/Delete buttons)
    this.deleteBtn = this.modal.getByRole('button', { name: /^Delete$/i });
    this.editBtn   = this.modal.getByRole('button', { name: /^Edit$/i });
    this.closeBtn  = this.modal.getByRole('button', { name: /^Close$/i });
  }

  async waitLoaded() {
    await expect(this.modal).toBeVisible({ timeout: 15000 });
  }

  async expectFields(values: string[]) {
    for (const v of values) {
      await expect.soft(this.modal.getByText(v, { exact: false }).first()).toBeVisible();
    }
  }

  async expectActions() {
    await expect.soft(this.deleteBtn).toBeVisible();
    await expect.soft(this.editBtn).toBeVisible();
    await expect.soft(this.closeBtn).toBeVisible();
  }

  async clickDelete() {
    await this.deleteBtn.click();
  }

  async clickEdit() {
    await this.editBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── Delete confirmation dialog ────────────────────────────────────────────
  async expectConfirmDialog() {
    await expect(
      this.page.getByText(/delete|ต้องการลบ|cannot be undone/i).first()
    ).toBeVisible({ timeout: 10000 });
  }

  async confirmDelete() {
    // confirm dialog appears on top of modal — scope to last fixed overlay
    await this.page.locator('div.fixed.inset-0').last()
      .getByRole('button', { name: /^(Confirm|Delete)$/i }).last().click();
  }

  async cancelDelete() {
    await this.page.locator('div.fixed.inset-0').last()
      .getByRole('button', { name: /^Cancel$/i }).click();
  }
}
