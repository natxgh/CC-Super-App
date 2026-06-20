import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Dynamic Form Builder (modal)
 * เปิดจาก FormConfigPage.clickAdd()/clickEdit()
 *
 * องค์ประกอบ (จาก design + screenshot):
 *   Form Elements (15): Text, Number, Text Area, Email, Multi-Checkbox, Single-Select,
 *     Image, DnD Image, Multi-Image, DnD Multi-Image, Date, Date & Time, Radio, Group, Dynamic Field
 *   Form Settings: Form Name (default "New Dynamic Form") · Desktop Grid Columns (default 1)
 *   Per-field config: Label · Placeholder · Required (checkbox) · Desktop Column Span (25/50/75/100%)
 *   Form Layout Editor: Hide All / Show All · drag reorder · Import · Export · Preview
 *   ปิด modal = × (มุมขวาบน)
 *
 * ⚠️ SELECTOR VERIFICATION: ยังไม่ได้ probe live DOM (รอบนี้เตรียม script เท่านั้น).
 *    ก่อนรันจริงให้ยืนยัน role/name ของ element panel + per-field config (ดู MISSING-API.md).
 */
export class FormBuilderPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly formName: Locator;
  readonly gridColumns: Locator;
  readonly closeBtn: Locator;
  readonly importBtn: Locator;
  readonly exportBtn: Locator;
  readonly previewBtn: Locator;
  readonly hideAllBtn: Locator;
  readonly showAllBtn: Locator;
  readonly importFileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByRole('dialog').filter({ hasText: /Dynamic Form Builder/i })
      .or(page.locator('[class*="modal"],[role="dialog"]').filter({ hasText: /Dynamic Form Builder/i })).first();
    this.formName = page.getByLabel('Form Name').or(page.getByPlaceholder(/Form Name|New Dynamic Form/i)).first();
    this.gridColumns = page.getByLabel(/Desktop Grid Columns/i).or(page.getByRole('spinbutton')).first();
    this.closeBtn = this.modal.getByRole('button', { name: /^(×|✕|Close)$/ }).or(this.modal.locator('button[aria-label*="close" i]')).first();
    this.importBtn = page.getByRole('button', { name: 'Import', exact: true });
    this.exportBtn = page.getByRole('button', { name: 'Export', exact: true });
    this.previewBtn = page.getByRole('button', { name: 'Preview', exact: true });
    this.hideAllBtn = page.getByRole('button', { name: /Hide All/i });
    this.showAllBtn = page.getByRole('button', { name: /Show All/i });
    this.importFileInput = page.locator('input[type="file"]');
  }

  async waitOpen() {
    await expect(this.modal).toBeVisible({ timeout: 10_000 });
  }
  async waitClosed() {
    await expect(this.modal).toBeHidden({ timeout: 10_000 });
  }
  async expectFormName(value: string | RegExp) {
    await expect(this.formName).toHaveValue(value);
  }

  // ── Form Settings ────────────────────────────────────────────────────────────
  async setFormName(name: string) {
    await this.formName.fill(name);
  }
  async clearFormName() {
    await this.formName.fill('');
  }
  async setGridColumns(value: string) {
    await this.gridColumns.fill(value);
    await this.gridColumns.blur().catch(() => {});
  }
  /** อ่านค่า Grid Columns หลัง clamp (Q2: นอกช่วง → ปรับเป็น 1/5) */
  async gridColumnsValue(): Promise<string> {
    return (await this.gridColumns.inputValue().catch(() => '')) || '';
  }

  // ── Form Elements ─────────────────────────────────────────────────────────────
  /** คลิก element เพื่อเพิ่ม field (เช่น 'Text', 'Single-Select', 'Date', 'DnD Multi-Image') */
  async addElement(type: string) {
    await this.page.getByRole('button', { name: type, exact: true })
      .or(this.page.getByText(type, { exact: true })).first().click();
  }
  /** จำนวน field ใน Layout Editor (ใช้ verify add/delete) */
  fieldCards(): Locator {
    return this.page.locator('[class*="field-card"],[class*="layout"] [class*="field"],[data-field-id]');
  }

  // ── Per-field config ───────────────────────────────────────────────────────────
  /** กรอก Label ของ field ลำดับ idx (0-based) */
  async setLabel(value: string, idx = 0) {
    await this.page.getByLabel('Label').nth(idx).fill(value);
  }
  async clearLabel(idx = 0) {
    await this.page.getByLabel('Label').nth(idx).fill('');
  }
  async setPlaceholder(value: string, idx = 0) {
    await this.page.getByLabel('Placeholder').nth(idx).fill(value);
  }
  async setRequired(on: boolean, idx = 0) {
    const cb = this.page.getByRole('checkbox', { name: /Required/i }).nth(idx);
    const checked = await cb.isChecked().catch(() => false);
    if (checked !== on) await cb.click();
  }
  async setColumnSpan(span: '25%' | '50%' | '75%' | '100%', idx = 0) {
    const sel = this.page.getByLabel(/Column Span/i).nth(idx);
    await sel.selectOption({ label: span }).catch(async () => { await sel.selectOption(span.replace('%', '')); });
  }
  /** เพิ่ม option ให้ Single-Select / Multi-Checkbox */
  async addOptions(options: string[], idx = 0) {
    for (const opt of options) {
      const box = this.page.getByPlaceholder(/New option/i).nth(idx);
      await box.fill(opt);
      await this.page.getByRole('button', { name: '+' }).nth(idx).click().catch(() => box.press('Enter'));
    }
  }

  // ── Layout Editor actions ────────────────────────────────────────────────────
  async hideAll() { await this.hideAllBtn.click(); }
  async showAll() { await this.showAllBtn.click(); }
  async preview() { await this.previewBtn.click(); }
  async export() { await this.exportBtn.click(); }

  /** Import ไฟล์ schema (valid/malformed) */
  async importFile(filePath: string) {
    // ปุ่ม Import มักเปิด file chooser — ดักด้วย filechooser event ถ้ามี, ไม่งั้น setInputFiles ตรง
    const [chooser] = await Promise.all([
      this.page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null),
      this.importBtn.click(),
    ]);
    if (chooser) await chooser.setInputFiles(filePath);
    else await this.importFileInput.setInputFiles(filePath);
  }
  /** assert error หลัง import malformed (Q6: "Invalid form schema") */
  async expectImportError(message: string | RegExp = /Invalid form schema/i) {
    await expect(this.page.getByText(message).first()).toBeVisible({ timeout: 8000 });
  }

  /** ลบ field ลำดับ idx (ปุ่มลบบน field card — ไม่มี dialog ยืนยัน ตาม Q5) */
  async deleteField(idx = 0) {
    const card = this.fieldCards().nth(idx);
    await card.getByRole('button', { name: /delete|remove|ลบ|trash/i })
      .or(card.locator('button[aria-label*="delete" i],button[aria-label*="remove" i]')).first().click();
  }

  /** drag field idxFrom ไปเหนือ field idxTo (reorder) */
  async dragField(idxFrom: number, idxTo: number) {
    const from = this.fieldCards().nth(idxFrom);
    const to = this.fieldCards().nth(idxTo);
    await from.dragTo(to);
  }

  // ── Validation (Form Name) ───────────────────────────────────────────────────
  /** กด Save Configuration จาก builder แล้วคาดหวัง error (ว่าง/ซ้ำ) */
  async expectInlineError(message: string | RegExp) {
    await expect(this.page.getByText(message).first()).toBeVisible({ timeout: 8000 });
  }

  async close() {
    await this.closeBtn.click();
  }
}
