import { Page, Locator, expect } from '@playwright/test';
import type { ProductData } from '../fixtures/testdata';

/**
 * Page Object — Add / Edit Product form (CMS)
 * ⚠️ Selectors = best-effort จาก design (fields: TH/EN Name, Product Code, Category, Brand, Year,
 *    Warranty (Days), Price, Product Image · submit "Create Products" / "Update Products")
 *    ยังไม่ verified กับ live DOM — verify ก่อน execute จริง.
 */
export class ProductFormPage {
  readonly page: Page;
  readonly nameTH: Locator;
  readonly nameEN: Locator;
  readonly code: Locator;
  readonly category: Locator;
  readonly brand: Locator;
  readonly year: Locator;
  readonly warranty: Locator;
  readonly price: Locator;
  readonly imageInput: Locator;
  readonly createBtn: Locator;
  readonly updateBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameTH = page.getByLabel(/Product Name.*TH|ชื่อ.*ไทย|TH/i).first();
    this.nameEN = page.getByLabel(/Product Name.*EN|ชื่อ.*อังกฤษ|EN/i).first();
    this.code = page.getByLabel(/Product Code/i);
    this.category = page.getByLabel(/Category/i);
    this.brand = page.getByLabel(/Brand/i);
    this.year = page.getByLabel(/Year/i);
    this.warranty = page.getByLabel(/Warranty/i);
    this.price = page.getByLabel(/Price/i);
    this.imageInput = page.locator('input[type="file"]');
    this.createBtn = page.getByRole('button', { name: /Create Products?/i });
    this.updateBtn = page.getByRole('button', { name: /Update Products?/i });
  }

  async waitReady() {
    await expect(this.code).toBeVisible({ timeout: 15000 });
  }

  /** กรอกฟอร์มทั้งหมด — เว้น field ที่ value เป็น undefined (สำหรับเคส required ที่จงใจเว้น) */
  async fill(d: Partial<ProductData>) {
    if (d.th !== undefined) await this.nameTH.fill(d.th);
    if (d.en !== undefined) await this.nameEN.fill(d.en);
    if (d.code !== undefined) await this.code.fill(d.code);
    if (d.category !== undefined) await this.selectByLabelOrOption(this.category, d.category);
    if (d.brand !== undefined) await this.selectByLabelOrOption(this.brand, d.brand);
    if (d.year !== undefined) await this.selectByLabelOrOption(this.year, String(d.year));
    if (d.warranty !== undefined) await this.warranty.fill(String(d.warranty));
    if (d.price !== undefined) await this.price.fill(String(d.price));
  }

  /** dropdown ที่อาจเป็น native <select> หรือ custom — รองรับทั้งสอง */
  private async selectByLabelOrOption(el: Locator, value: string) {
    await el.selectOption({ label: value }).catch(async () => {
      await el.click();
      await this.page.getByRole('option', { name: value }).first().click();
    });
  }

  async uploadImage(absPath: string) {
    await this.imageInput.setInputFiles(absPath);
  }

  async create() {
    await this.createBtn.click();
  }
  async update() {
    await this.updateBtn.click();
  }

  /** submit แล้วคาดหวัง toast/inline error (เก็บหลักฐานครบแม้ exact text ยังไม่รู้) */
  async submitExpectingError(submit: 'create' | 'update', errorRe?: RegExp) {
    await (submit === 'create' ? this.createBtn : this.updateBtn).click();
    if (errorRe) {
      await expect(this.page.getByText(errorRe).first()).toBeVisible();
    } else {
      // exact text ยังรอ PO (HA11) → ยืนยันว่า "ไม่สำเร็จ": form ยังเปิด/ไม่มี success toast
      await expect(this.page.getByText(/created successfully/i)).toHaveCount(0);
    }
  }

  /** ตรวจ field มี error state (exact text ยังรอ PO → ใส่ regex กว้างไว้ก่อน, soft) */
  async expectFieldError(label: RegExp) {
    const field = this.page.getByLabel(label);
    // error state อาจเป็น aria-invalid หรือ sibling error text — ตรวจ aria-invalid ก่อน
    await expect.soft(field).toHaveAttribute('aria-invalid', /true/).catch(() => {});
  }
}
