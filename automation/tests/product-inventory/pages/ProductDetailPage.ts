import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Item Details modal (View Product)
 * ✅ Selectors VERIFIED via live DOM probe 2026-06-22:
 *   Modal = div.fixed.inset-0 containing h2 "Item Details"
 *   Buttons inside modal: "Delete", "Edit", "Close"  (text buttons, no icon-only)
 *   Fields shown: Product Name, Product Code, Stock, Brand, Category, Year, Price, Warranty
 */
export class ProductDetailPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly deleteBtn: Locator;
  readonly editBtn: Locator;
  readonly closeBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('div.fixed.inset-0').filter({ hasText: 'Item Details' });
    this.deleteBtn = this.modal.getByRole('button', { name: 'Delete', exact: true });
    this.editBtn   = this.modal.getByRole('button', { name: 'Edit', exact: true });
    this.closeBtn  = this.modal.getByRole('button', { name: 'Close', exact: true });
  }

  async waitLoaded() {
    await expect(this.modal).toBeVisible({ timeout: 15000 });
  }

  /** ยืนยันฟิลด์ใน Item Details (ส่งเป็น list ของข้อความที่ต้องเห็น) — soft เก็บหลักฐานครบทุกจุด */
  async expectFields(values: string[]) {
    for (const v of values) {
      await expect.soft(this.page.getByText(v, { exact: false }).first()).toBeVisible();
    }
  }

  async expectActions() {
    await expect.soft(this.deleteBtn).toBeVisible();
    await expect.soft(this.editBtn).toBeVisible();
    await expect.soft(this.closeBtn).toBeVisible();
  }
}
