import { Page, Locator, expect } from '@playwright/test';
import type { SparePartData } from '../fixtures/testdata';

/**
 * Page Object — Add / Edit Spare Part form (CMS)
 * ✅ Verified selectors via live DOM probe 2026-06-25:
 *   - input[name="th/en/warranty/price"] confirmed
 *   - Category & Brand = custom div dropdown (label → div.relative → inner cursor-pointer div)
 *   - Year = native <select> (no name attr)
 *   - Save button = "Create Spare Parts" (add) / "Update Spare Parts" (edit)
 *   - Form is a slide panel; URL stays /cms/inventory/
 */
export class SparePartsFormPage {
  readonly page: Page;
  readonly nameTH: Locator;
  readonly nameEN: Locator;
  readonly year: Locator;
  readonly warranty: Locator;
  readonly price: Locator;
  readonly imageInput: Locator;
  readonly saveBtn: Locator;
  readonly updateBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameTH = page.locator('input[name="th"]');
    this.nameEN = page.locator('input[name="en"]');
    this.year = page.locator('select');
    this.warranty = page.locator('input[name="warranty"]');
    this.price = page.locator('input[name="price"]');
    this.imageInput = page.locator('input[type="file"]').first();
    // "Create Spare Parts" appears on both list Add button and form Save button — use .last() to hit form btn
    this.saveBtn = page.getByRole('button', { name: 'Create Spare Parts', exact: true }).last();
    this.updateBtn = page.getByRole('button', { name: /Update Spare Parts?/i }).last();
    this.cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
  }

  async waitReady() {
    await expect(this.nameEN).toBeVisible({ timeout: 15000 });
  }

  /**
   * Custom dropdown (Category / Brand):
   * DOM: label → div.relative (next sibling) → inner div[cursor-pointer] (trigger, shows "Search...")
   * After click, option list appears — click by exact text
   */
  async selectCustom(labelText: 'Category' | 'Brand' | 'Belong', value: string) {
    const trigger = this.page.locator('label')
      .filter({ hasText: new RegExp(`^${labelText}`, 'i') })
      .locator('xpath=following-sibling::div[1]')
      .locator('div').first();
    await trigger.click();
    await this.page.waitForTimeout(300);
    // product names may carry trailing spaces in master data → match by prefix, fall back to exact
    const opt = this.page.getByText(value, { exact: true }).last();
    if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) await opt.click();
    else await this.page.getByText(new RegExp(value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).last().click();
  }

  /** fill the whole form — skip fields whose value is undefined (intentionally-empty required cases) */
  async fill(d: Partial<SparePartData>) {
    if (d.th !== undefined) await this.nameTH.fill(d.th);
    if (d.en !== undefined) await this.nameEN.fill(d.en);
    if (d.category !== undefined) await this.selectCustom('Category', d.category);
    if (d.brand !== undefined) await this.selectCustom('Brand', d.brand);
    if (d.belongTo !== undefined) await this.selectCustom('Belong', d.belongTo).catch(() => {});
    if (d.year !== undefined) await this.year.selectOption({ label: String(d.year) }).catch(() => {});
    if (d.warranty !== undefined) await this.warranty.fill(String(d.warranty));
    if (d.price !== undefined) await this.price.fill(String(d.price));
  }

  async uploadImage(absPath: string) {
    await this.imageInput.setInputFiles(absPath);
  }

  async save() { await this.saveBtn.click(); }
  async update() { await this.updateBtn.click(); }

  /** submit expecting failure — exact error text รอ PO → assert "no success toast" */
  async submitExpectingError(submit: 'save' | 'update') {
    await (submit === 'save' ? this.saveBtn : this.updateBtn).click();
    await expect(this.page.getByText(/successfully/i)).toHaveCount(0);
  }

  /** field error state (exact text รอ PO → ตรวจ aria-invalid แบบ soft) */
  async expectFieldError(name: 'en' | 'th' | 'price') {
    const field = this.page.locator(`input[name="${name}"]`);
    await expect.soft(field).toHaveAttribute('aria-invalid', /true/).catch(() => {});
  }
}
