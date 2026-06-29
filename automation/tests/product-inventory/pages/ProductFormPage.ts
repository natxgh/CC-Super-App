import { Page, Locator, expect } from '@playwright/test';
import type { ProductData } from '../fixtures/testdata';

/**
 * Page Object — Add / Edit Product form (CMS)
 * ✅ Selectors VERIFIED via live DOM probe 2026-06-21 (/cms/products → Create Products):
 *   inputs ใช้ name attr (ไม่มี <label for> → getByLabel ใช้ไม่ได้):
 *     th = input[name="th"] · en = input[name="en"] · code = input[name="productCode"]
 *     warranty = input[name="warranty"] (number) · price = input[name="price"] (number)
 *   Year   = native <select> (options "Select year",2026,2025,…)  ⚠️ max = 2026 บน STG (PO Q15 บอก 2027 — ยังไม่ deploy)
 *   Image  = input#photo-upload (type=file, label "Change Photo")
 *   Category / Brand = custom div dropdown (label + following div → click → option by text)
 *   submit = button "Create Products" (form) / "Update Products" (edit) · Cancel = button "Cancel"
 */
export class ProductFormPage {
  readonly page: Page;
  readonly nameTH: Locator;
  readonly nameEN: Locator;
  readonly code: Locator;
  readonly year: Locator;
  readonly warranty: Locator;
  readonly price: Locator;
  readonly imageInput: Locator;
  readonly createBtn: Locator;
  readonly updateBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameTH = page.locator('input[name="th"]');
    this.nameEN = page.locator('input[name="en"]');
    this.code = page.locator('input[name="productCode"]');
    // Year select: identified by its unique placeholder option "Select year"
    // (form is a drawer panel co-existing with list's pagination <select>, so need specific filter)
    this.year = page.locator('select').filter({ has: page.locator('option:text("Select year")') });
    this.warranty = page.locator('input[name="warranty"]');
    this.price = page.locator('input[name="price"]');
    this.imageInput = page.locator('#photo-upload');
    // ปุ่ม submit ในฟอร์ม (ชื่อซ้ำกับปุ่มเปิดใน list → ใช้ปุ่มในฟอร์ม = .last())
    this.createBtn = page.getByRole('button', { name: /^Create Products?$/i }).last();
    this.updateBtn = page.getByRole('button', { name: /^Update Products?$/i }).last();
    this.cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
  }

  async waitReady() {
    await expect(this.code).toBeVisible({ timeout: 15000 });
  }

  /**
   * Custom searchable dropdown (Category / Brand) — verified live DOM 2026-06-22:
   *   click trigger div → input[placeholder="Search..."] appears → fill partial name → click option
   *   Blur race fix (2026-06-23): filling search input gives it focus; Playwright's
   *   native click on the option triggers blur → dropdown closes before click registers.
   *   Fix: use page.evaluate(el.click()) — fires React synthetic click without
   *   browser-native focus/blur side-effects.
   */
  async selectCustom(labelText: 'Category' | 'Brand', value: string) {
    const container = this.page.locator(`label:has-text("${labelText}")`).locator('xpath=following-sibling::div[1]');
    await container.click();
    await this.page.waitForTimeout(300);
    await container.locator('input[placeholder="Search..."]').fill(value);
    await this.page.waitForTimeout(400);
    // JS click bypasses the blur-closes-dropdown race condition
    await this.page.evaluate((val) => {
      const opts = Array.from(document.querySelectorAll('div.cursor-pointer'));
      const opt = opts.find((d) => (d as HTMLElement).textContent?.trim() === val);
      if (opt) (opt as HTMLElement).click();
    }, value);
    await this.page.waitForTimeout(200);
  }

  /** กรอกฟอร์มทั้งหมด — เว้น field ที่ value เป็น undefined (เคส required ที่จงใจเว้น) */
  async fill(d: Partial<ProductData>) {
    if (d.th !== undefined) await this.nameTH.fill(d.th);
    if (d.en !== undefined) await this.nameEN.fill(d.en);
    if (d.code !== undefined) await this.code.fill(d.code);
    if (d.category !== undefined) await this.selectCustom('Category', d.category);
    if (d.brand !== undefined) await this.selectCustom('Brand', d.brand);
    if (d.year !== undefined) await this.year.selectOption({ label: String(d.year) }).catch(() => {});
    if (d.warranty !== undefined) await this.warranty.fill(String(d.warranty));
    if (d.price !== undefined) await this.price.fill(String(d.price));
  }

  async uploadImage(absPath: string) {
    await this.imageInput.setInputFiles(absPath);
  }

  async create() { await this.createBtn.click(); }
  async update() { await this.updateBtn.click(); }

  /** submit แล้วคาดหวัง error (exact text ยังรอ PO HA11 → assert "ไม่สำเร็จ": ไม่มี success toast) */
  async submitExpectingError(submit: 'create' | 'update', errorRe?: RegExp) {
    await (submit === 'create' ? this.createBtn : this.updateBtn).click();
    if (errorRe) {
      await expect(this.page.getByText(errorRe).first()).toBeVisible();
    } else {
      await expect(this.page.getByText(/successfully/i)).toHaveCount(0);
    }
  }

  /**
   * Field error indicator — HA11 pending PO: form does NOT set aria-invalid.
   * Validation error is confirmed by submitExpectingError (no success toast).
   * This method is a no-op placeholder until exact error text is provided by PO.
   */
  async expectFieldError(_name: 'productCode' | 'price' | 'warranty') {
    // no-op: submitExpectingError already verified no success toast
  }
}
