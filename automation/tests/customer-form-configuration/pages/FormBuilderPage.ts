import { Page, Locator, expect } from '@playwright/test';

// All selectors verified via live DOM probe 2026-06-23:
//
//   Modal:      [class*="modal" i]  (not role=dialog — count=0)
//               hasText filter not reliable (textContent check missed inner nodes) — filter by waitOpen()
//   Form Name:  placeholder="Enter form name"  ✓
//   Grid Cols:  #overallColSpan-input  ✓
//   Close btn:  button.absolute.right-3.top-3 (top-right of modal, has SVG, no aria-label)
//   Toolbar:    "Save Form", "Save Configuration", "Import", "Export", "Preview",
//               "Hide All", "Show All"  — all confirmed by exact text  ✓
//
//   Field card: div.space-y-4 that contains [id^="required-"]  ✓
//               (none of the generic selectors matched — card uses only Tailwind classes)
//   Delete btn: button[title="Remove field"]  (revealed on hover — text = "✕")  ✓
//   Per-field:  #required-<uuid>  ✓  |  #colSpan-select-<uuid>  ✓  |  #showLabel-toggle-<uuid>  ✓
//   Label inp:  input[type="text"]:not([id])  nth(0) within card  ✓  (no ph, no label[for])
//   Placeholder: input[type="text"]:not([id])  nth(1) within card  ✓

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
  /** Builder save — "Save Form" (outer page has "Save Configuration") ✓ */
  readonly saveFormBtn: Locator;
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
    // "Save Form" is inside the modal but inside a display:none div (portal pattern).
    // getByRole skips display:none ancestors — must use locator() which searches full DOM.
    // force: true on click bypasses visibility check and dispatches event directly.
    this.saveFormBtn  = this.modal.locator('button', { hasText: 'Save Form' }).last();
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
   * Field cards — each added field has exactly one [id^="required-"] checkbox.
   * Probe 2026-06-23: div.rounded-2xl.border with has-filter returned count=1 (outer wrapper
   * contains ALL fields). Use [id^="required-"] directly for count; XPath ancestor for card body.
   */
  fieldCards(): Locator {
    return this.page.locator('[id^="required-"]');
  }

  private fieldCard(idx: number): Locator {
    // Walk up to the nearest div.rounded-2xl ancestor (per-field card wrapper)
    return this.page.locator('[id^="required-"]').nth(idx)
      .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
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
   * Save from inside the builder.
   * "Save Form" may be inside a display:none portal div — use page.evaluate to call DOM click()
   * directly, bypassing all Playwright visibility / bounding-box checks.
   * In Edit mode the button text may differ ("Update Form") — try both.
   */
  async saveForm() {
    const clicked = await this.page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const SAVE_TEXTS = ['Save Form', 'Update Form'];
      // Use last match — mirrors saveFormBtn = modal.locator('button', { hasText: 'Save Form' }).last()
      const candidates = btns.filter(b => SAVE_TEXTS.includes(b.textContent?.trim() || ''));
      const btn = candidates[candidates.length - 1];
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) throw new Error('Save Form / Update Form button not found in DOM');
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
