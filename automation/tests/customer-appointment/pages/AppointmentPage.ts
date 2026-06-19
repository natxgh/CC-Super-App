import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Customer Appointment tab (CAP)
 * เปิดจาก Customer Detail panel → ปุ่มย่อย "Appointment" (verified ใน CustomerDetailPage.appointmentSubBtn)
 *
 * ✅ VERIFIED LIVE DOM (2026-06-17 probe, UI=EN):
 *     - "Schedule" button · Appointment sub-tab · empty state "No results found." → ตรง design
 *     - Schedule form: label "Appointment Type *" / "Service Type *" / "Appoint Date *" + Note textarea + Add/Back
 *     - ⚠️ APP BUG (confirmed): placeholder ของ dropdown สลับกัน —
 *         Appointment Type field แสดง "Search Service Type."  · Service Type field แสดง "Search Appointment Type."
 *     - ⚠️ Appoint Date format = **mm/dd/yyyy hh:mm** (US order — ไม่ใช่ dd/mm)
 * ⚠️  ยัง UNVERIFIED: option-list DOM ของ dropdown (ตอนคลิกเปิด), แถว appointment list (Confirm/Bin/Status)
 *     → scenario ที่ "เขียนข้อมูล" (Add/Confirm/Delete) + พึ่ง option-list/row → mark test.fixme ใน spec
 *       (write side-effect บน SIT + DOM ยังไม่ครบ — อย่าเดาให้ flaky / อย่าแกล้งผ่าน)
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
    // appointment list area (ยังไม่มี row จริงให้ verify → best guess) ⚠️
    this.list = page.getByRole('table').or(page.locator('[class*="appointment" i]')).first();

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

  /** เลือก dropdown แบบ combobox/option (best-effort: click trigger → click option) ⚠️ unverified */
  private async selectOption(trigger: Locator, value: string) {
    await trigger.click();
    await this.page.getByRole('option', { name: new RegExp(value, 'i') })
      .or(this.page.getByText(value, { exact: false })).first().click();
  }

  /** กรอกฟอร์มนัดหมาย (Note ปล่อยว่างได้ = optional) */
  async fillScheduleForm(d: { appointmentType: string; serviceType: string; appointDate: string; note?: string }) {
    await this.selectOption(this.appointmentType, d.appointmentType);
    await this.selectOption(this.serviceType, d.serviceType);
    await this.appointDate.fill(d.appointDate);
    if (d.note) await this.note.fill(d.note);
  }

  async submitAdd() {
    await this.addBtn.click();
  }

  // ── row helpers (match ด้วย Appointment Type / Status) ⚠️ unverified ──
  row(textMatch: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(textMatch, 'i') })
      .or(this.page.locator('tr', { hasText: textMatch }))
      .first();
  }

  /** ปุ่ม Confirm บนแถวที่กำหนด (โผล่เฉพาะ Pending) */
  async confirm(rowText: string) {
    await this.row(rowText).getByRole('button', { name: /^Confirm$/i }).click();
  }

  /** Bin icon ลบบนแถวที่กำหนด (โผล่เฉพาะ Pending) — icon button: aria-label/title "Delete"/"Bin" */
  async deleteByBin(rowText: string) {
    await this.row(rowText)
      .getByRole('button', { name: /Delete|Bin|ลบ/i })
      .or(this.row(rowText).locator('button:has(svg)').last())
      .click();
  }

  // ── assertions ──
  async expectListVisible() {
    await expect(this.list).toBeVisible();
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
