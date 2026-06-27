import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Case and Ticket Management (CMS)
 * Pages: /cms/case/creation · /cms/case/assignment (Kanban board) · /cms/case/history · Case Detail
 *
 * ✅ VERIFIED LIVE DOM (probe 2026-06-20, UI=EN):
 *   Creation (/cms/case/creation):
 *     - field labels (headings): "Types :*", "Contact Method : *", "Case Details: *", "Service Center : *",
 *       "Phone Number :", "Event Area :", "Attach File:", "IoT Device :", "IoT Alert Date :"
 *     - dropdown triggers (button): "Select CaseType", "Select Contact Method", "Select Service Center"
 *     - inputs: placeholder "Enter Case Details" (+ live "<n> / 4000" counter ✅), "Enter Phone Number", "Enter Location"
 *     - actions: "Submit", "Save As Draft", "Back" · customer panel: "Linked Existing", "Add Customer"
 *   History (/cms/case/history):
 *     - heading "Case History" · search placeholder "Search case..." · buttons "Advanced Filters", "Create Case"
 *     - Advanced Filters modal labels ✅: Start Date, End Date, Type, Sub-Type, Country, Province, District, Detail, Create By
 *       + buttons "Reset All", "Apply Filters (n)"
 *   Assignment board (/cms/case/assignment):
 *     - Kanban columns ✅: "New", "Assigned", "In-progress", "Done" · toggles "kanban"/"List" · "Add New Case" · search "Search Cases..."
 *
 * ✅ VERIFIED LIVE DOM (probe 2026-06-22):
 *   Dropdown options — all 3 dropdowns (CaseType/ContactMethod/ServiceCenter) render as `<li>` elements
 *   inside `<ul class="max-h-60 overflow-auto custom-scrollbar">`, NOT `[role="option"]`.
 *   Use: page.locator('li', { hasText: /text/i }).first().click()
 *   ContactMethod options confirmed: CALL, METTLINK, METTRIQ, IOT-Alert, Other
 *   CaseType options confirmed (prefix = sTypeCode-TypeName-SubTypeName):
 *     1001-Camera Malfunction -Investigation, 1002-Camera Malfunction -Repair, etc.
 *   CaseType button opens input[placeholder="Select CaseType"] (type-ahead search)
 *   Creation form extra fields: IoT Device ID, Work Order (datetime-local), Enter Location (textarea)
 *   Tabs on creation: Information | Device Info | Copilot | KB | More
 *   "View Details Panel" button (toggles right panel)
 *
 * ⚠️ NOT yet verified (marked best-effort below → tests using them are test.fixme until probed):
 *   - ServiceCenter options (shows "No Option." due to BE issue — empty dropdown)
 *   - Confirm modal after Submit (Submit silently blocked when ServiceCenter not set)
 *   - Lifecycle action buttons on Case Detail (Assign/Acknowledge/En Route/On Site)
 *   - Close approval flow (Request close approval / Approve) · attachment list rows
 *
 * 🐛 KNOWN BUG (probed 2026-06-22):
 *   CreateCase API broken: BFF crashes (500) when `versions` field included in CaseInsertInput;
 *   without `versions`, DB NOT NULL constraint fires. UI also fails. Case creation broken on QA env.
 */
export class CasePage {
  readonly page: Page;

  // ── Creation form ──
  readonly caseTypeTrigger: Locator;
  readonly contactMethodTrigger: Locator;
  readonly serviceCenterTrigger: Locator;
  readonly caseDetails: Locator;
  readonly phoneNumber: Locator;
  readonly eventArea: Locator;
  readonly submitBtn: Locator;
  readonly saveDraftBtn: Locator;
  readonly backBtn: Locator;
  readonly linkedExistingBtn: Locator;
  readonly addCustomerBtn: Locator;
  readonly attachInput: Locator;

  // ── History ──
  readonly historySearch: Locator;
  readonly advancedFiltersBtn: Locator;
  readonly createCaseBtn: Locator;
  readonly resetAllBtn: Locator;

  // ── Assignment board ──
  readonly boardSearch: Locator;
  readonly addNewCaseBtn: Locator;
  readonly kanbanToggle: Locator;
  readonly listToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    // creation — verified triggers/inputs/actions
    this.caseTypeTrigger = page.getByRole('button', { name: /Select CaseType/i });
    this.contactMethodTrigger = page.getByRole('button', { name: /Select Contact Method/i });
    this.serviceCenterTrigger = page.getByRole('button', { name: /Select Service Center/i });
    this.caseDetails = page.getByPlaceholder('Enter Case Details');
    this.phoneNumber = page.getByPlaceholder('Enter Phone Number');
    this.eventArea = page.getByPlaceholder('Enter Location');
    this.submitBtn = page.getByRole('button', { name: /^Submit$/i });
    this.saveDraftBtn = page.getByRole('button', { name: /Save As Draft/i });
    this.backBtn = page.getByRole('button', { name: /^Back$/i });
    this.linkedExistingBtn = page.getByRole('button', { name: /Linked Existing/i });
    this.addCustomerBtn = page.getByRole('button', { name: /Add Customer/i });
    this.attachInput = page.locator('input[type="file"]'); // Attach File: (verified label, input best-effort)

    // history — verified
    this.historySearch = page.getByPlaceholder('Search case...');
    this.advancedFiltersBtn = page.getByRole('button', { name: /Advanced Filters/i });
    this.createCaseBtn = page.getByRole('button', { name: /Create Case/i });
    this.resetAllBtn = page.getByRole('button', { name: /Reset All/i });

    // assignment board — verified
    this.boardSearch = page.getByPlaceholder('Search Cases...');
    this.addNewCaseBtn = page.getByRole('button', { name: /Add New Case/i });
    this.kanbanToggle = page.getByRole('button', { name: /^kanban$/i });
    this.listToggle = page.getByRole('button', { name: /^List$/i });
  }

  // ── navigation ──
  async gotoCreation() { await this.page.goto('/cms/case/creation', { waitUntil: 'domcontentloaded' }); await expect(this.submitBtn).toBeVisible(); }
  async gotoHistory() { await this.page.goto('/cms/case/history', { waitUntil: 'domcontentloaded' }); await expect(this.advancedFiltersBtn).toBeVisible(); }
  async gotoBoard() { await this.page.goto('/cms/case/assignment', { waitUntil: 'domcontentloaded' }); }

  // ── History helpers (verified) ──
  async search(keyword: string) {
    await this.historySearch.fill(keyword);
    await this.historySearch.press('Enter');
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }
  async openAdvancedFilters() {
    await this.advancedFiltersBtn.click();
    await expect(this.resetAllBtn).toBeVisible();
  }
  filterLabel(name: string): Locator { return this.page.getByText(name, { exact: false }); }
  applyFiltersBtn(): Locator { return this.page.getByRole('button', { name: /Apply Filters/i }); }
  async resetAllFilters() { await this.resetAllBtn.click(); }

  /** empty state — same text family as other CC lists (verified pattern on other features) */
  emptyState(): Locator { return this.page.getByText(/no entries to show|no results found|no data/i); }

  // ── Creation helpers (triggers verified; OPTION pick = best-effort/unverified) ──
  /** char counter "<n> / 4000" (verified live) */
  counter(): Locator { return this.page.getByText(/\d{1,4}\s*\/\s*4000/); }

  /**
   * Dropdown options render as plain `<li>` elements (NOT [role="option"]) — verified 2026-06-22.
   * Click the trigger button → wait for LI list → click matching item.
   */
  private async pickOption(trigger: Locator, value: string) {
    await trigger.click();
    await this.page.waitForTimeout(1000);
    const li = this.page.locator('li', { hasText: new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
    await li.click();
  }
  async selectCaseType(name: string) { await this.pickOption(this.caseTypeTrigger, name); }
  async selectContactMethod(name: string) { await this.pickOption(this.contactMethodTrigger, name); }
  async selectServiceCenter(name: string) { await this.pickOption(this.serviceCenterTrigger, name); }

  /** Priority badge after a CaseType is chosen (auto-set) — text match best-effort */
  priorityBadge(): Locator { return this.page.getByText(/High Priority|Medium Priority|Low Priority/i).first(); }

  /** ⚠️ Confirm modal after Submit — DOM unverified */
  confirmDialog(): Locator { return this.page.getByRole('dialog').filter({ hasText: /confirm/i }); }
  confirmButton(): Locator { return this.confirmDialog().getByRole('button', { name: /^Confirm$/i }); }

  // ── Kanban board (columns verified; card/row controls best-effort) ──
  column(name: 'New' | 'Assigned' | 'In-progress' | 'Done'): Locator {
    return this.page.getByText(name, { exact: true }).first();
  }
  async expectColumns() {
    for (const c of ['New', 'Assigned', 'In-progress', 'Done'] as const) {
      await expect(this.column(c)).toBeVisible();
    }
  }

  // ── toasts ──
  successToast(): Locator { return this.page.getByText(/success|created|สำเร็จ/i).first(); }
  errorToast(): Locator { return this.page.getByText(/fail|error|required|ผิดพลาด|กรุณา/i).first(); }
}
