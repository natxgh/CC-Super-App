import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Customer Appointment tab (CAP)
 * เปิดจาก Customer Detail panel → ปุ่มย่อย "Appointment" (verified ใน CustomerDetailPage.appointmentSubBtn)
 *
 * ✅ VERIFIED LIVE DOM (probe 2026-06-17/19, UI=EN):
 *     - "Schedule" button · Appointment sub-tab · empty state "No results found." (div.text-center) → ตรง design
 *     - Schedule form: label "Appointment Type *" / "Service Type *" / "Appoint Date *" + Note textarea + Add/Back
 *     - ⚠️ APP BUG (confirmed): placeholder ของ dropdown สลับกัน —
 *         Appointment Type field แสดง "Search Service Type."  · Service Type field แสดง "Search Appointment Type."
 *     - ⚠️ Appoint Date format = **mm/dd/yyyy hh:mm** (US order — ไม่ใช่ dd/mm)
 *     - ✅ Datepicker = react-datepicker: past days → [role="gridcell"][aria-disabled="true"]
 *         aria-label="Not available <weekday>, <Month> <Day><ordinal>, <Year>"
 * ✅ RESOLVED (2026-06-25): Dropdown CORS fix → options load correctly, selection via page.mouse.click(boundingBox) works
 *     - selectOption: portal-rendered options → page-level getByRole('listitem').filter() + mouse.click(box) ✅
 *     - Both Appointment Type + Service Type dropdowns select correctly; date fills correctly
 * ⚠️  STILL BLOCKED (2026-06-25):
 *     (2) CreateAppointment API returns "Error" toast after form submit → BLOCKED TS-03_TC-02
 *         (likely same id:"undefined" pattern as GetAppointmentByCustId; FE did not fix CreateAppointment)
 *     (2b) Appointment list id:"undefined" → list ว่างเสมอ → BLOCKED TS-04/05 (BUG-appointment-list-undefined-id.md)
 *
 * Terminology (sync กับ base export / customer-appointment-test-design.md 16/06/2026):
 *   - เปิดฟอร์ม = ปุ่ม "Schedule"  · submit = "Add" · cancel = "Back"
 *   - empty state = "No results found."
 *   - status = "Pending" / "Confirmed" · action บนแถว Pending = "Confirm" + "Bin" icon
 */
export class AppointmentPage {
  readonly page: Page;

  // ── Appointment tab / list ──
  readonly scheduleBtn: Locator;
  readonly list: Locator;
  // ── Schedule Appointment form ──
  readonly appointmentType: Locator;
  readonly serviceType: Locator;
  readonly appointDate: Locator;
  readonly note: Locator;
  readonly addBtn: Locator;
  readonly backBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    // ✅ "Schedule" เปิดฟอร์ม (verified)
    this.scheduleBtn = page.getByRole('button', { name: /^Schedule$/i });
    // appointment list: CARD layout (confirmed 2026-06-25 after GetAppointmentByCustId fix)
    // Each appointment = a card div with status badge (Pending/Confirmed) + button(s)
    this.list = page.getByText('Pending').or(page.getByText('Confirmed')).first();

    // ── Schedule Appointment Form ── ✅ trigger/field verified 2026-06-17
    //   dropdown เป็น <button> (custom) — placeholder สลับ (app bug): Appointment Type ↔ "Search Service Type."
    this.appointmentType = page.getByRole('button', { name: 'Search Service Type.' });   // ⚠️ swapped placeholder (app bug)
    this.serviceType = page.getByRole('button', { name: 'Search Appointment Type.' });   // ⚠️ swapped placeholder (app bug)
    this.appointDate = page.getByPlaceholder('mm/dd/yyyy hh:mm');                          // ⚠️ US date order
    this.note = page.locator('textarea').first();
    this.addBtn = page.getByRole('button', { name: /^Add$/i });
    this.backBtn = page.getByRole('button', { name: /^Back$/i }).last();
  }

  /** เปิด Schedule Appointment form */
  async openScheduleForm() {
    await this.scheduleBtn.click();
    await expect(this.addBtn).toBeVisible();
  }

  /**
   * เลือก dropdown — confirmed DOM (2026-06-24): dropdown มี textbox placeholder="Search..."
   * ARIA snapshot: option = div[role="listitem"][cursor=pointer]
   * force:true on trigger — bypasses div.p-2 overlay from a previously-open dropdown
   * evaluate(el.click()) — native DOM click triggers React event delegation (locator.click() doesn't register selection)
   * waitFor('hidden') without .catch — detects silent non-selection early instead of failing at toast
   */
  private async selectOption(trigger: Locator, value: string) {
    await trigger.click({ force: true });
    const searchInput = this.page.locator('input[placeholder="Search..."]').last();
    await searchInput.waitFor({ state: 'visible', timeout: 30000 });
    await searchInput.pressSequentially(value, { delay: 30 });
    await this.page.waitForTimeout(800);
    // Options render in a React portal (confirmed: panel-scope times out).
    // page.mouse.click() sends real CDP input events (isTrusted=true, full pointer sequence)
    // which is required for some React dropdown components to register selection.
    const option = this.page.getByRole('listitem')
      .filter({ hasText: new RegExp(`^${value}$`) })
      .last();
    await option.waitFor({ state: 'visible', timeout: 15000 });
    const box = await option.boundingBox();
    if (!box) throw new Error(`No bounding box for option: ${value}`);
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    // Dropdown must close after selection — if it doesn't, React state wasn't updated
    await searchInput.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * เลือกวันที่จาก react-datepicker (input เป็น readonly — ต้อง navigate calendar)
   * format: 'mm/dd/yyyy hh:mm' — navigate เดือนแล้ว click วัน → เลือกเวลาจาก list
   */
  private async selectDate(dateStr: string) {
    const [datePart, timePart] = dateStr.split(' ');
    const [mm, dd, yyyy] = datePart.split('/').map(Number);

    await this.appointDate.click();
    await this.page.locator('[role="gridcell"]').first().waitFor({ state: 'visible' });

    const today = new Date();
    const monthsToGo = (yyyy - today.getFullYear()) * 12 + (mm - 1) - today.getMonth();
    if (monthsToGo > 0) {
      const nextBtn = this.page.locator('[aria-label="Next Month"]')
        .or(this.page.locator('button[class*="navigation--next"]')).first();
      for (let i = 0; i < monthsToGo; i++) await nextBtn.click();
    } else if (monthsToGo < 0) {
      const prevBtn = this.page.locator('[aria-label="Previous Month"]')
        .or(this.page.locator('button[class*="navigation--prev"]')).first();
      for (let i = 0; i < Math.abs(monthsToGo); i++) await prevBtn.click();
    }

    await this.page.locator('[role="gridcell"][aria-disabled="false"]')
      .getByText(String(dd), { exact: true }).first().click();

    if (timePart) {
      const [hh, min] = timePart.split(':');
      const h12 = Number(hh) % 12 || 12;
      const ampm = Number(hh) >= 12 ? 'PM' : 'AM';
      await this.page.getByText(`${h12}:${min} ${ampm}`, { exact: true })
        .or(this.page.getByText(`${hh}:${min}`, { exact: true })).first().click().catch(() => {});
    }
  }

  /** กรอกฟอร์มนัดหมาย (Note ปล่อยว่างได้ = optional; ปล่อย appointmentType/serviceType/appointDate ว่าง = ไม่เลือก/ไม่กรอก) */
  async fillScheduleForm(d: { appointmentType: string; serviceType: string; appointDate: string; note?: string }) {
    if (d.appointmentType) await this.selectOption(this.appointmentType, d.appointmentType);
    if (d.serviceType) await this.selectOption(this.serviceType, d.serviceType);
    if (d.appointDate) await this.selectDate(d.appointDate);
    if (d.note) await this.note.fill(d.note);
  }

  async submitAdd() {
    await this.addBtn.click();
  }

  // ── card helpers (CARD layout confirmed 2026-06-25) ──
  // Each card: h4 (appointment type) · text "Pending"/"Confirmed" · button "Delete" · button "Confirm"
  // DOM structure: div.card > div.flex.space-x-3 > h4 (confirmed from error-context aria snapshot)
  //   ancestor::div[1] = "flex space-x-3"          (heading only, no buttons)
  //   ancestor::div[2] = "flex justify-between …"  (Delete svg btn, no Confirm)
  //   ancestor::div[3] = "flex-1 min-w-0 space-y-2" (Delete svg btn, no Confirm)
  //   ancestor::div[4] = "flex flex-col bg-gray-200 … rounded-lg p-3" = CARD ROOT ✅
  //   (confirmed via DOM probe 2026-06-25)
  row(textMatch: string): Locator {
    return this.page.locator('h4')
      .filter({ hasText: new RegExp(textMatch, 'i') })
      .locator('xpath=ancestor::div[4]');
  }

  /**
   * Confirm appointment: click card Confirm → modal "Change Status To Confirm" appears
   * Double-filter: must have BOTH the modal text AND a Confirm button → avoids matching the
   * modal title/body div (text only, no buttons) which .last() would otherwise return.
   */
  async confirm(rowText: string) {
    await this.row(rowText).getByRole('button', { name: /Confirm/i }).first().click();
    const modal = this.page.locator('div')
      .filter({ hasText: /Change Status To Confirm/i })
      .filter({ has: this.page.getByRole('button', { name: /^Confirm$/i }) })
      .last();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await modal.getByRole('button', { name: /^Confirm$/i }).click();
  }

  /**
   * Delete appointment: click Delete → modal "Are you sure you want to delete?" (red Confirm btn)
   * Double-filter: must have BOTH the modal text AND a Confirm button → avoids matching the
   * modal-body div (has text, no buttons) which .last() would otherwise return.
   */
  async deleteByBin(rowText: string) {
    await this.row(rowText).getByRole('button', { name: /^Delete$/i }).click();
    const modal = this.page.locator('div')
      .filter({ hasText: /Are you sure you want to delete/i })
      .filter({ has: this.page.getByRole('button', { name: /^Confirm$/i }) })
      .last();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await modal.getByRole('button', { name: /^Confirm$/i }).click();
  }

  // ── assertions ──
  async expectListVisible() {
    await expect(
      this.page.getByText('Pending').or(this.page.getByText('Confirmed')).first()
    ).toBeVisible({ timeout: 10000 });
  }

  async expectStatus(rowText: string, status: 'Pending' | 'Confirmed') {
    await expect(this.row(rowText)).toContainText(status);
  }

  async expectNoResults() {
    // verified text pattern ในแอป (เหมือน Customer List empty state)
    await expect(this.page.getByText(/no results found/i)).toBeVisible();
  }

  async expectSuccessToast() {
    await expect(this.page.getByText(/success|สำเร็จ/i).first()).toBeVisible();
  }

  async expectErrorToast() {
    await expect(this.page.getByText(/error|ผิดพลาด|required|กรุณา/i).first()).toBeVisible();
  }
}
