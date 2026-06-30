import { Page, Locator, expect } from '@playwright/test';

// All selectors verified via live DOM probes 2026-06-23 + 2026-06-29:
//
//   Modal:      [class*="modal" i]  (not role=dialog)
//   Form Name:  placeholder="Enter form name"  ✓
//   Grid Cols:  #overallColSpan-input  ✓
//   Close btn:  button.absolute.right-3.top-3 (top-right of modal)
//   Toolbar:    "Import", "Export", "Preview", "Hide All", "Show All"  ✓
//               NO "Save Form" button exists inside the modal — saving is done by closing then
//               clicking "Save Configuration" on the outer page.
//
//   Field card: div.h-full.border-2.rounded-lg  filtered by has:[id^="required-"]  ✓
//               (probe 2026-06-29: withRequired=3 for 3 fields, outer wrapper lacks h-full)
//   Delete btn: button[title="Remove field"]  (revealed on hover — text = "✕")  ✓
//   Per-field:  #required-<uuid>  ✓  |  #colSpan-select-<uuid>  ✓  |  #showLabel-toggle-<uuid>  ✓
//   Label inp:  input[type="text"]:not([id])  nth(0) within card  ✓
//   Placeholder: input[type="text"]:not([id])  nth(1) within card  ✓
//   Single-Select add option: placeholder="New option" + button text "+"  ✓

export class FormBuilderPage {
  readonly page: Page;
  /** Builder modal — single [class*="modal"] on the page when builder is open */
  readonly modal: Locator;
  /** Form Name input — placeholder="Enter form name" ✓ */
  readonly formName: Locator;
  /** Desktop Grid Columns — #overallColSpan-input ✓ */
  readonly gridColumns: Locator;
  /** Close button — top-right of modal, classes: absolute right-3 top-3 ✓ */
  readonly closeBtn: Locator;
  readonly importBtn: Locator;
  readonly exportBtn: Locator;
  readonly previewBtn: Locator;
  readonly hideAllBtn: Locator;
  readonly showAllBtn: Locator;
  readonly importFileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal        = page.locator('[class*="modal" i]').first();
    this.formName     = page.getByPlaceholder('Enter form name');
    this.gridColumns  = page.locator('#overallColSpan-input');
    // Close btn: absolute right-3 top-3 (has SVG, no aria-label) — confirmed position x≈1148, y≈100
    this.closeBtn     = this.modal.locator('button.absolute.right-3.top-3').first();
    this.importBtn    = page.getByRole('button', { name: 'Import', exact: true });
    this.exportBtn    = page.getByRole('button', { name: 'Export', exact: true });
    this.previewBtn   = page.getByRole('button', { name: 'Preview', exact: true });
    this.hideAllBtn   = page.getByRole('button', { name: 'Hide All', exact: true });
    this.showAllBtn   = page.getByRole('button', { name: 'Show All', exact: true });
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

  async gridColumnsValue(): Promise<string> {
    return this.gridColumns.inputValue().catch(() => '');
  }

  // ── Form Elements ─────────────────────────────────────────────────────────────

  async addElement(type: string) {
    await this.page.getByRole('button', { name: type, exact: true }).first().click();
  }

  /**
   * Field cards — probe 2026-06-29: per-field card class is "mb-6 h-full border-2 rounded-lg bg-gray-50".
   * The outer canvas wrapper also has border-2+rounded-lg but lacks h-full, so h-full is the discriminator.
   * filter({ has }) ensures only cards that own a required- checkbox are counted (1 per field).
   */
  fieldCards(): Locator {
    return this.page.locator('div.h-full.border-2.rounded-lg')
      .filter({ has: this.page.locator('[id^="required-"]') });
  }

  private fieldCard(idx: number): Locator {
    return this.fieldCards().nth(idx);
  }

  // ── Per-field config ──────────────────────────────────────────────────────────

  /**
   * Label input — no id, no placeholder, no label[for].
   * nth(0) of input[type="text"]:not([id]) within the card.
   * Verified probe 2026-06-23: 3 blank text inputs → Label=nth(0), Placeholder=nth(1).
   */
  async setLabel(value: string, idx = 0) {
    await this.fieldCard(idx).locator('input[type="text"]:not([id])').nth(0).fill(value);
  }

  async clearLabel(idx = 0) {
    await this.setLabel('', idx);
  }

  async setPlaceholder(value: string, idx = 0) {
    await this.fieldCard(idx).locator('input[type="text"]:not([id])').nth(1).fill(value);
  }

  async setRequired(on: boolean, idx = 0) {
    const cb = this.fieldCard(idx).locator('[id^="required-"]').first();
    const checked = await cb.isChecked().catch(() => false);
    if (checked !== on) await cb.click();
  }

  /**
   * Column span — native <select> with options based on gridColumns count.
   * Probe: with 1 column, only "100%" exists; with 4 columns: 25%/50%/75%/100%.
   * Caller must ensure gridColumns ≥ 2 before calling with span < 100%.
   */
  async setColumnSpan(span: '25%' | '50%' | '75%' | '100%', idx = 0) {
    const sel = this.fieldCard(idx).locator('[id^="colSpan-select-"]').first();
    await sel.selectOption({ label: span });
  }

  async addOptions(options: string[], idx = 0) {
    // Scope to the specific field card — nth(idx) is the field index, not the occurrence index
    const card = this.fieldCard(idx);
    for (const opt of options) {
      const box = card.getByPlaceholder(/New option/i).first();
      await box.fill(opt);
      await card.getByRole('button', { name: '+' }).first()
        .click().catch(() => box.press('Enter'));
    }
  }

  // ── Layout Editor actions ────────────────────────────────────────────────────

  async hideAll() { await this.hideAllBtn.click(); }
  async showAll() { await this.showAllBtn.click(); }
  async preview() { await this.previewBtn.click(); }
  async export()  { await this.exportBtn.click(); }

  async importFile(filePath: string) {
    // Use page.evaluate to click Import (like saveForm) — bypasses actionability checks
    // that can hang for minutes if builder state changes after export.
    const [chooser] = await Promise.all([
      this.page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      this.page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent?.trim() === 'Import');
        if (btn) { btn.click(); return true; }
        return false;
      }),
    ]);
    if (chooser) await chooser.setInputFiles(filePath);
    else         await this.importFileInput.setInputFiles(filePath);
  }

  async expectImportError(message: string | RegExp = /error|fail|invalid|wrong|incorrect|ไม่ถูก|ผิด|ล้มเหลว|ไม่สามารถ|Invalid|schema|format|ไม่ถูกต้อง|ผิดพลาด/i) {
    await expect(this.page.getByText(message).first()).toBeVisible({ timeout: 10_000 });
  }

  /**
   * "Save Form" does not exist inside the builder modal — probe 2026-06-29 confirmed there is
   * no save button inside the modal. The correct flow is: close the modal (this method), then
   * the caller must invoke cfg.saveConfiguration() on the outer page.
   */
  async saveForm() {
    await this.close();
  }

  /**
   * Delete field by index.
   * Delete button: button[title="Remove field"] text="✕" — revealed on hover.
   * Probe 2026-06-23: no aria-label, identified by title attribute.
   */
  async deleteField(idx = 0) {
    const card = this.fieldCard(idx);
    await card.hover();
    await this.page.locator('button[title="Remove field"]').nth(idx).click();
  }

  async dragField(idxFrom: number, idxTo: number) {
    await this.fieldCards().nth(idxFrom).dragTo(this.fieldCards().nth(idxTo));
  }

  async expectInlineError(message: string | RegExp) {
    await expect(this.page.getByText(message).first()).toBeVisible({ timeout: 8000 });
  }

  async close() {
    await this.closeBtn.click();
  }
}
