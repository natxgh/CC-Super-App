import { Page, Locator, expect } from '@playwright/test';

// Verified via live DOM probe 2026-06-21 — toggles are <input type="checkbox">, not role=switch.
// Page: /cc/contacts-configurations (language forced to "en" in localStorage)

// Standard fields — stable checkbox IDs
const FIELD_ID: Record<string, string> = {
  'Profile Photo':         'personal-photo',
  'Display Name':          'personal-displayName',
  'Title':                 'personal-title',
  'First Name':            'personal-firstName',
  'Middle Name':           'personal-middleName',
  'Last Name':             'personal-lastName',
  'Citizen ID':            'personal-citizenId',
  'Date of Birth':         'personal-dob',
  'Blood Type':            'personal-blood',
  'Gender':                'personal-gender',
  'User Type':             'contact-userType',
  'Language Preference':   'contact-languagePreference',
  'Contact Preference':    'contact-contractPreference',
  'Note':                  'contact-note',
};

// Address sub-fields — IDs are address-<key> / currentAddress-<key>
const ADDR_KEY: Record<string, string> = {
  'Building':    'building',
  'Country':     'country',
  'District':    'district',
  'Floor':       'floor',
  'Latitude':    'lat',
  'Longitude':   'lon',
  'House No.':   'no',
  'Postal Code': 'postalCode',
  'Province':    'province',
  'Road':        'road',
  'Room':        'room',
  'Street':      'street',
  'Sub-district':'subDistrict',
};

export class FormConfigPage {
  readonly page: Page;
  /** Custom Form section master toggle — #dynamicForm-enabled (checkbox) */
  readonly customFormToggle: Locator;
  /** Form dropdown trigger — button labelled with current form name (default "Contact Customization") */
  readonly formDropdown: Locator;
  readonly editBtn: Locator;
  readonly addBtn: Locator;
  readonly saveConfigBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.customFormToggle = page.locator('#dynamicForm-enabled');
    this.formDropdown = page.getByRole('button', { name: 'Contact Customization' });
    this.editBtn  = page.getByRole('button', { name: 'Edit', exact: true });
    this.addBtn   = page.getByRole('button', { name: 'Add',  exact: true });
    this.saveConfigBtn = page.getByRole('button', { name: /Save Configuration/i });
  }

  async goto() {
    await this.page.goto('/cc/contacts-configurations', { waitUntil: 'domcontentloaded' });
    await expect(this.saveConfigBtn).toBeVisible({ timeout: 15_000 });
  }

  // ── Standard field toggles (DFC) ─────────────────────────────────────────────

  /**
   * Returns the checkbox locator for a standard or address field.
   * @param label  Field label from FIELD_ID or ADDR_KEY maps
   * @param scope  'Registered Address' | 'Current Address' — required for address fields
   */
  fieldToggle(label: string, scope?: 'Registered Address' | 'Current Address'): Locator {
    if (scope) {
      const prefix = scope === 'Registered Address' ? 'address' : 'currentAddress';
      const key = ADDR_KEY[label];
      if (key) return this.page.locator(`#${prefix}-${key}`);
      // fallback: row-scoped search
      const sub = this.page.locator('section,div[class*="section"]', { hasText: scope }).last();
      return sub.locator('input[type="checkbox"]', { hasText: label }).first();
    }
    const id = FIELD_ID[label];
    if (id) return this.page.locator(`#${id}`);
    // fallback for unmapped labels
    return this.page.locator(`[id*="${label.replace(/\s/g, '')}"]`).first();
  }

  async setToggle(label: string, on: boolean, scope?: 'Registered Address' | 'Current Address') {
    const cb = this.fieldToggle(label, scope);
    await cb.scrollIntoViewIfNeeded().catch(() => {});
    const checked = await cb.isChecked();
    // sr-only checkbox — visual wrapper (div.relative.shrink-0.ml-3) intercepts normal click
    if (checked !== on) await cb.click({ force: true });
  }

  async expectToggle(label: string, on: boolean, scope?: 'Registered Address' | 'Current Address') {
    const cb = this.fieldToggle(label, scope);
    if (on) {
      await expect(cb).toBeChecked();
    } else {
      await expect(cb).not.toBeChecked();
    }
  }

  // ── Section accordion ────────────────────────────────────────────────────────

  sectionHeader(name: string): Locator {
    return this.page.locator('h3', { hasText: name }).first();
  }

  async toggleSection(name: string) {
    // Section header is <h3> inside a div.cursor-pointer (custom accordion — NOT a button)
    // Probe 2026-06-25: no button or aria-expanded — click the immediate div ancestor of the h3
    const trigger = this.sectionHeader(name).locator('xpath=ancestor::div[1]');
    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    await trigger.click();
  }

  async expectSectionCollapsed(_name: string, fieldInside: string) {
    // Check toggle checkbox is hidden — text label stays in DOM, but input collapses with the section
    await expect(this.fieldToggle(fieldInside)).toBeHidden({ timeout: 5_000 });
  }

  async expectSectionExpanded(_name: string, fieldInside: string) {
    await expect(this.fieldToggle(fieldInside)).toBeVisible({ timeout: 5_000 });
  }

  // ── Custom Form section ──────────────────────────────────────────────────────

  async enableCustomForm(on = true) {
    const checked = await this.customFormToggle.isChecked();
    if (checked !== on) await this.customFormToggle.click();
  }

  /**
   * Open the form picker dropdown without knowing the current form name.
   * Finds the trigger button by looking for the button immediately before "Edit" in the DOM,
   * which is the pattern [form-dropdown] [Edit] [Add] in the CFC row.
   */
  async openFormDropdown(): Promise<void> {
    const clicked = await this.page.evaluate(() => {
      const editBtns = Array.from(document.querySelectorAll('button'))
        .filter(b => b.textContent?.trim() === 'Edit');
      for (const edit of editBtns) {
        const prev = edit.previousElementSibling;
        if (!prev) continue;
        if (prev instanceof HTMLButtonElement) { prev.click(); return true; }
        const inner = prev.querySelector('button');
        if (inner) { (inner as HTMLButtonElement).click(); return true; }
      }
      return false;
    });
    if (!clicked) {
      // Fallback: use hardcoded "Contact Customization" trigger (works if that form is selected)
      await this.formDropdown.click();
    }
  }

  async selectForm(name: string) {
    // Use openFormDropdown() — finds the trigger dynamically regardless of which form is currently selected.
    // formDropdown (hardcoded "Contact Customization") only works when that form is active.
    await this.openFormDropdown();
    await this.page.locator('li[class*="hover:bg-gray-100"]', { hasText: name }).first().click();
  }

  async clickAdd() { await this.addBtn.click(); }
  async clickEdit() { await this.editBtn.click(); }

  async saveConfiguration() {
    // Probe 2026-06-29: button may be below viewport fold (y≈808). Scroll into view first,
    // then click without force so the real event handler fires reliably.
    await this.saveConfigBtn.scrollIntoViewIfNeeded();
    await this.saveConfigBtn.click();
  }

  async saveConfigurationAndWait() {
    await this.saveConfigBtn.scrollIntoViewIfNeeded();
    await this.saveConfigBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async expectSaveSuccess() {
    await expect(
      this.page.getByText(/saved|success|บันทึก/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  async hasDeleteFormControl(): Promise<boolean> {
    return this.page.getByRole('button', { name: /Delete Form/i }).isVisible().catch(() => false);
  }
}
