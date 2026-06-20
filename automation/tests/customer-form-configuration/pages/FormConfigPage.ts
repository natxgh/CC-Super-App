import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Customer Form Configuration  (/cc/contacts-configurations)
 *
 * โครงสร้างหน้า (ยืนยันจาก screenshot STG 2026-06-17, ดู PDF ใน design folder):
 *   Standard sections (toggle ต่อ field → คุมว่า field แสดงบน Add/Edit Customer):
 *     • Profile Photo   : toggle "Profile Photo"
 *     • Personal Details: Display Name, Title, First Name, Middle Name, Last Name,
 *                          Citizen ID, Date of Birth, Blood Type(OFF), Gender  (9)
 *     • Address         : Registered Address + Current Address (13 fields ต่อ sub)
 *     • Preferences     : User Type, Language Preference, Contact Preference, Note
 *   Custom Form section:
 *     • toggle "Custom Form" · dropdown เลือกฟอร์ม + × clear · version selector
 *     • ปุ่ม Edit / Add · พรีวิวฟิลด์ของฟอร์มที่เลือก
 *   ปุ่ม "Save Configuration" (ท้ายหน้า) = บันทึกทุก section
 *   Dynamic Form Builder (modal เปิดจาก Add/Edit) = ตัว builder
 *
 * ⚠️ SELECTOR VERIFICATION: builder-internal + toggle selectors มาจาก screenshot + design
 *    (ยังไม่ได้ probe live DOM เพราะรอบนี้ "เตรียม script ไม่ execute"). ก่อนรันจริงครั้งแรก
 *    ให้ probe DOM ยืนยัน role/name (ดู MISSING-API.md §Selectors-to-verify).
 *    เลือกใช้ getByRole/getByLabel เป็นหลัก + fallback row-scoped เพื่อลดความเปราะ.
 */
export class FormConfigPage {
  readonly page: Page;
  readonly customFormToggle: Locator;
  readonly formDropdown: Locator;
  readonly editBtn: Locator;
  readonly addBtn: Locator;
  readonly saveConfigBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    // toggle หลักของ section Custom Form (accessible name = "Custom Form")
    this.customFormToggle = page.getByRole('switch', { name: 'Custom Form' });
    this.formDropdown = page.getByRole('combobox').first();
    this.editBtn = page.getByRole('button', { name: 'Edit', exact: true });
    this.addBtn = page.getByRole('button', { name: 'Add', exact: true });
    this.saveConfigBtn = page.getByRole('button', { name: /Save Configuration/i });
  }

  async goto() {
    await this.page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await expect(this.saveConfigBtn).toBeVisible({ timeout: 15_000 });
  }

  // ── Standard field toggles (DFC) ─────────────────────────────────────────────
  /** toggle ของ field มาตรฐานตาม label · scope ด้วย sub-section ได้ (Registered/Current Address) */
  fieldToggle(label: string, scope?: 'Registered Address' | 'Current Address'): Locator {
    if (scope) {
      // sub-section ของ Address — หา row ใน container ที่มีหัวข้อ scope แล้วจับ switch ตาม label
      const sub = this.page.locator('div', { hasText: scope }).filter({ has: this.page.getByText(label, { exact: true }) }).last();
      return sub.getByRole('switch', { name: label }).or(sub.locator(`:scope :near(:text("${label}"))`).getByRole('switch')).first();
    }
    // ปกติ: switch มี accessible name = label · fallback = row ที่มี label
    return this.page.getByRole('switch', { name: label })
      .or(this.page.locator('[class*="row"],[class*="field"],li,div').filter({ hasText: label }).getByRole('switch'))
      .first();
  }

  async setToggle(label: string, on: boolean, scope?: 'Registered Address' | 'Current Address') {
    const sw = this.fieldToggle(label, scope);
    await sw.scrollIntoViewIfNeeded().catch(() => {});
    const checked = await sw.isChecked().catch(async () => (await sw.getAttribute('aria-checked')) === 'true');
    if (checked !== on) await sw.click();
  }

  async expectToggle(label: string, on: boolean, scope?: 'Registered Address' | 'Current Address') {
    const sw = this.fieldToggle(label, scope);
    await expect.poll(async () =>
      (await sw.isChecked().catch(() => null)) ?? (await sw.getAttribute('aria-checked')) === 'true'
    ).toBe(on);
  }

  // ── Section accordion ────────────────────────────────────────────────────────
  sectionHeader(name: string): Locator {
    return this.page.getByRole('heading', { name }).or(this.page.getByText(name, { exact: true })).first();
  }
  /** คลิกไอคอน ^ บน header เพื่อ collapse/expand */
  async toggleSection(name: string) {
    const header = this.sectionHeader(name);
    await header.scrollIntoViewIfNeeded().catch(() => {});
    // ไอคอน collapse อยู่ขวาสุดของ header bar
    const bar = this.page.locator('div', { has: header }).first();
    await bar.getByRole('button').last().click().catch(async () => { await header.click(); });
  }
  async expectSectionCollapsed(name: string, fieldInside: string) {
    // body ถูกซ่อน → field ข้างในไม่ visible
    await expect(this.page.getByText(fieldInside, { exact: true }).first()).toBeHidden();
  }
  async expectSectionExpanded(name: string, fieldInside: string) {
    await expect(this.page.getByText(fieldInside, { exact: true }).first()).toBeVisible();
  }

  // ── Custom Form section ──────────────────────────────────────────────────────
  async enableCustomForm(on = true) {
    const checked = await this.customFormToggle.isChecked().catch(() => true);
    if (checked !== on) await this.customFormToggle.click();
  }
  async selectForm(name: string) {
    await this.formDropdown.click();
    await this.page.getByRole('option', { name }).first().click();
  }
  async clickAdd() { await this.addBtn.click(); }
  async clickEdit() { await this.editBtn.click(); }

  async saveConfiguration() {
    await this.saveConfigBtn.click();
  }
  async saveConfigurationAndWait() {
    await this.saveConfigBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }
  /** assert toast success หลัง Save */
  async expectSaveSuccess() {
    await expect(
      this.page.getByText(/saved|success|บันทึก/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
  /** มีปุ่ม Delete Form บนหน้า config ไหม (UI-03 — ต้อง "ไม่มี") */
  async hasDeleteFormControl(): Promise<boolean> {
    return this.page.getByRole('button', { name: /Delete Form/i }).isVisible().catch(() => false);
  }
}
