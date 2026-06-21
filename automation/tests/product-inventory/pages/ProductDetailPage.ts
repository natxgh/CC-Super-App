import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Item Details modal (View Product)
 * ⚠️ best-effort selectors — verify กับ live DOM ก่อน execute
 */
export class ProductDetailPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly deleteBtn: Locator;
  readonly editBtn: Locator;
  readonly closeBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByRole('dialog').or(page.getByText(/Item Details/i));
    this.deleteBtn = page.getByRole('button', { name: 'Delete' });
    this.editBtn = page.getByRole('button', { name: 'Edit' });
    this.closeBtn = page.getByRole('button', { name: /Close/i });
  }

  async waitLoaded() {
    await expect(this.modal.first()).toBeVisible({ timeout: 15000 });
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
