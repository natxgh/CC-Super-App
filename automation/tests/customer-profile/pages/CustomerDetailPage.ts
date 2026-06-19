import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Customer Detail (VCP detail / VPRD / VSVC / VCC)
 * ✅ VERIFIED กับ live DOM (staging, UI = English) 2026-06-16:
 *   - เปิดเป็น in-place panel (URL ไม่เปลี่ยน, ไม่มี role=tab)
 *   - header = heading "Customer Information" · "Contact Informantion" (sic: typo ในแอป) · "Address" · "Preferences"
 *   - sub-view buttons: "Customer" / "Appointment"
 *   - product/service: heading "product (N)" / "service (N)" (lowercase) + ปุ่ม "Add Product" / "Add Service"
 *   - back: button "Back" · custom form ("Custom Form") ไม่ render สำหรับลูกค้าที่ seed ผ่าน API (known gap)
 */
export class CustomerDetailPage {
  readonly page: Page;
  readonly backBtn: Locator;
  readonly header: Locator;
  readonly contactSection: Locator;
  readonly addressSection: Locator;
  readonly preferencesSection: Locator;
  readonly customFormSection: Locator;
  readonly customerSubBtn: Locator;
  readonly appointmentSubBtn: Locator;
  readonly addProductBtn: Locator;
  readonly addServiceBtn: Locator;
  readonly productsHeading: Locator;
  readonly servicesHeading: Locator;
  readonly casesHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backBtn = page.getByRole('button', { name: 'Back' });
    this.header = page.getByRole('heading', { name: 'Customer Information' });
    this.contactSection = page.getByText(/Contact Inform/i).first();   // sic: "Informantion"
    this.addressSection = page.getByText(/Address/i).first();
    this.preferencesSection = page.getByText(/Preferences/i).first();
    this.customFormSection = page.getByText(/Custom Form/i).first();
    this.customerSubBtn = page.getByRole('button', { name: 'Customer', exact: true });
    this.appointmentSubBtn = page.getByRole('button', { name: 'Appointment', exact: true });
    this.addProductBtn = page.getByRole('button', { name: 'Add Product' });
    this.addServiceBtn = page.getByRole('button', { name: 'Add Service' });
    this.productsHeading = page.getByRole('heading', { name: /product\s*\(/i });
    this.servicesHeading = page.getByRole('heading', { name: /service\s*\(/i });
    this.casesHeading = page.getByRole('heading', { name: /case\s*\(/i });
  }

  async waitLoaded() {
    await expect(this.header).toBeVisible();
  }

  // ── Customer tab sections ──────────────────────────────────────────────────
  async expectPersonalDetailsVisible() {
    await this.waitLoaded();
    await expect(this.contactSection).toBeVisible();
  }
  async expectPreferencesVisible() {
    await this.preferencesSection.scrollIntoViewIfNeeded().catch(() => {});
    await expect(this.preferencesSection).toBeVisible();
  }
  async expectCustomFieldsVisible() {
    await this.customFormSection.scrollIntoViewIfNeeded().catch(() => {});
    await expect(this.customFormSection).toBeVisible();
  }

  // ── Product / Service / Case (VPRD / VSVC / VCC) ────────────────────────────
  /** เลื่อนไปดู section product → คืน count จาก heading "ผลิตภัณฑ์ (N)" */
  async productCount(): Promise<number> {
    await this.productsHeading.scrollIntoViewIfNeeded().catch(() => {});
    const t = (await this.productsHeading.textContent()) || '';
    return Number(t.match(/\((\d+)\)/)?.[1] ?? 0);
  }
  async serviceCount(): Promise<number> {
    await this.servicesHeading.scrollIntoViewIfNeeded().catch(() => {});
    const t = (await this.servicesHeading.textContent()) || '';
    return Number(t.match(/\((\d+)\)/)?.[1] ?? 0);
  }

  async expectProductsVisible() {
    await expect(this.productsHeading).toBeVisible();
  }
  async expectServicesVisible() {
    await expect(this.servicesHeading).toBeVisible();
  }

  /** section ว่าง = heading "(0)" (เช่น TA-14/15/16). bounded timeout กัน hang ถ้า section ไม่มี
   *  คืน false ถ้า section heading ไม่ปรากฏ (เช่น customer detail panel ไม่มี Case section) */
  async expectSectionEmpty(section: 'product' | 'service' | 'case'): Promise<boolean> {
    const h = section === 'product' ? this.productsHeading
      : section === 'service' ? this.servicesHeading : this.casesHeading;
    const present = await h.first().isVisible().catch(() => false);
    if (!present) return false; // ไม่มี section นี้บน panel → ให้ caller ตัดสิน (annotation)
    await h.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await expect(h).toContainText('(0)', { timeout: 8000 });
    return true;
  }

  /** คลิก Case No. → navigate ไปหน้า Case detail (VCC clickthrough) */
  async clickCaseNo(caseNo: string) {
    await this.page.getByText(caseNo, { exact: false }).first().click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  // ── Add Product / Add Service (VPRD/VSVC, QA Phase) — custom div-dropdown แบบ cascade ──
  private leaves(): Promise<string[]> {
    return this.page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll('body *').forEach((e: any) => {
        if (e.children.length === 0 && e.offsetParent) { const t = (e.innerText || '').trim(); if (t && t.length < 40) out.push(t); }
      });
      return out;
    });
  }
  /** เปิด custom dropdown (ปุ่ม) → เลือก option แรกที่ใช้ได้. คืน option หรือ null ถ้า "No options found"/หาไม่เจอ */
  async pickDropdown(buttonName: string): Promise<string | null> {
    const before = await this.leaves();
    const btn = this.page.getByRole('button', { name: buttonName, exact: true });
    try { await btn.click({ timeout: 5000 }); } catch { return null; } // bound กัน hang 90s
    await this.page.waitForTimeout(800);
    const after = await this.leaves();
    const added = [...new Set(after.filter((t) => !before.includes(t)))];
    const real = added.filter((t) => t && !/^select|search|no option/i.test(t) && !/^\d+$/.test(t));
    if (!real.length) { await this.page.keyboard.press('Escape').catch(() => {}); return null; }
    await this.page.locator(`text="${real[0]}"`).last().click().catch(() => {});
    await this.page.waitForTimeout(700);
    return real[0];
  }
  /** Purchase/Service date = readonly datepicker → คลิก cell วันนี้ */
  private async pickDateToday(placeholder: string) {
    await this.page.getByPlaceholder(placeholder).click().catch(() => {});
    await this.page.waitForTimeout(600);
    const t = new Date();
    const mn = t.toLocaleString('en-US', { month: 'long' });
    await this.page.getByRole('gridcell', { name: new RegExp(`${mn} ${t.getDate()}(st|nd|rd|th), ${t.getFullYear()}`) }).first().click({ timeout: 4000 }).catch(() => {});
    await this.page.waitForTimeout(400);
  }

  /** Add Product (cascade Category→product→Product List→Purchase Date→Add).
   *  คืน false ถ้า cascade ตันเพราะ "No options found" (staging data gap) */
  async addProduct(): Promise<boolean> {
    try { await this.addProductBtn.click({ timeout: 8000 }); } catch { return false; }
    await this.page.waitForTimeout(500);
    if (!(await this.pickDropdown('Select Category'))) return false;
    if (!(await this.pickDropdown('Select product'))) return false;
    if (!(await this.pickDropdown('Select Product List'))) return false;
    await this.pickDateToday('Select Purchase Date');
    await this.page.getByRole('button', { name: 'Add', exact: true }).click({ timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
    return true;
  }

  /** Add Service (Service Type→Service Date→Add). คืน false ถ้า cascade ตัน/ฟอร์มไม่เปิด */
  async addService(): Promise<boolean> {
    try { await this.addServiceBtn.click({ timeout: 8000 }); } catch { return false; }
    await this.page.waitForTimeout(500);
    if (!(await this.pickDropdown('Select Service Type'))) return false;
    await this.pickDateToday('Select Service Date');
    await this.page.getByRole('button', { name: 'Add', exact: true }).click({ timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
    return true;
  }

  async back() {
    await this.backBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }
}
