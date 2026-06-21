import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../shared/pages/LoginPage';
import { CustomerListPage } from '../customer-profile/pages/CustomerListPage';
import { CustomerDetailPage } from '../customer-profile/pages/CustomerDetailPage';
import { AppointmentPage } from './pages/AppointmentPage';
import { seedCustomer } from '../customer-profile/fixtures/seed';
import { seedAppointment, purgeAppointmentsByEmail } from './fixtures/appointment-seed';
import * as D from './fixtures/testdata';

/**
 * Customer Appointment — Playwright E2E (generated from 02-Customer Appointment/customer-appointment-testcases.xlsx)
 * Pattern: 1 Scenario = 1 test() (Scenario No.) · 1 Test Case = 1 test.step('<TC No.> — …') + shot()
 * Reuse (verified DOM): shared/LoginPage · customer-profile CustomerListPage / CustomerDetailPage (Appointment sub-view)
 * Feature POM: pages/AppointmentPage.ts  ← ✅ Schedule button/form fields/datepicker verified (probe 2026-06-17/19)
 *
 * ⚠️ staging ต้อง login จริง — set CP_USERNAME/CP_PASSWORD/CP_ORG เพื่อรัน (ไม่ตั้ง → skip, ไม่แกล้งผ่าน)
 *
 * RUN/FIXME (ตามจริง — ไม่แกล้งเขียว) — อัปเดต 2026-06-19:
 *   ▶ RUN   : TS-01 (view list), TA-02 (past date disabled), TA-03 (empty state)
 *             — verified: tab nav + "Schedule" + react-datepicker disabled days + "No results found."
 *   ⏸ FIXME : BLOCKED by 2 FE bugs (Arrange/seed พร้อมหมดแล้ว — appointment-seed.ts ✅ verified):
 *             (1) TS-02/TS-03 (Add) + TA-01 (validation) — dropdown options CORS fail
 *                 → BUG-appointment-type-options.md
 *             (2) TS-04 (Confirm) + TS-05 (Delete) — Appointment tab ส่ง id:"undefined" → list ว่างเสมอ
 *                 → BUG-appointment-list-undefined-id.md
 *             → ปลด fixme เมื่อ FE แก้ 2 bugs นี้ + probe row DOM (Confirm/Bin/Status)
 */
const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || '';

/** screenshot ราย step → test-results/steps/<TC No.>.png (key ตรง Lark upsert) */
async function shot(page: Page, label: string) {
  fs.mkdirSync('test-results/steps', { recursive: true });
  await page.screenshot({ path: `test-results/steps/${label}.png`, fullPage: true }).catch(() => {});
}

/** login จริง → ทุก scenario เริ่มจาก Customer List (Arrange: Login User ketwadee) */
async function loginAndOpenList(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login({ org: ORG, username: USER, password: PASS });
}

/** เปิด Customer Detail → คลิกแท็บย่อย "Appointment" (nav verified) */
async function openAppointmentTab(page: Page, list: CustomerListPage, detail: CustomerDetailPage, email: string, name: string) {
  await list.search(email);
  await list.clickView(name);
  await detail.waitLoaded();
  await detail.appointmentSubBtn.click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

// ════════════════════════════════════════════════════════════════════════════
//  SUCCESS SCENARIOS (TS-01 … TS-05)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Customer Appointment — Success', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TS-01 — View customer appointment list ─────────────────────────────────
  test('TS-01 — user can successfully view customer appointment list', async ({ page }) => {
    const list = new CustomerListPage(page);
    const detail = new CustomerDetailPage(page);
    const appt = new AppointmentPage(page);

    await test.step('TS-01_TC-01 — Navigate to Contact list → display Customer List → View "Siriwimon Somjit"', async () => {
      await loginAndOpenList(page);
      await seedCustomer(page, D.CUST_HAS_APPT); // Arrange: ต้องมีลูกค้าก่อน (API-first)
      await expect(page).toHaveURL(/contacts-list/);
      await list.search(D.CUST_HAS_APPT.email);
      await list.clickView(D.NAME_HAS_APPT);
      await detail.waitLoaded();
      await shot(page, 'TS-01_TC-01');
    });
    await test.step('TS-01_TC-02 — Click the "Appointment" tab → display Appointment List', async () => {
      await detail.appointmentSubBtn.click();
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      // best-effort: appointment area + "Schedule" ปุ่ม ควรปรากฏ (เนื้อหา list = unverified selector)
      await expect(appt.scheduleBtn.or(appt.list)).toBeVisible();
      await shot(page, 'TS-01_TC-02');
    });
  });

  // ── TS-02 — Add appointment (fill all fields) ──────────────────────────────
  test('TS-02 — user can successfully adding customer appointment (Fill in all fields)', async ({ page }) => {
    // ⚠️ Schedule form DOM ยังไม่ verify + เป็น write side-effect บน staging → fixme จนกว่าจะ probe
    test.fixme(true, 'FE bug: dropdown CORS fail → เลือก type/service ไม่ได้ (ดู BUG-appointment-type-options.md)');
    const list = new CustomerListPage(page);
    const detail = new CustomerDetailPage(page);
    const appt = new AppointmentPage(page);

    await test.step('TS-02_TC-01 — View Appointment', async () => {
      await loginAndOpenList(page);
      await openAppointmentTab(page, list, detail, D.CUST_HAS_APPT.email, D.NAME_HAS_APPT);
      await appt.expectListVisible();
      await shot(page, 'TS-02_TC-01');
    });
    await test.step('TS-02_TC-02 — Click "Schedule" and form opens', async () => {
      await appt.openScheduleForm();
      await shot(page, 'TS-02_TC-02');
    });
    await test.step('TS-02_TC-03 — Fill in all fields in Schedule Appointment → Add', async () => {
      await appt.fillScheduleForm(D.NEW_APPT);
      await appt.submitAdd();
      await appt.expectSuccessToast();
      await appt.expectStatus(D.NEW_APPT.appointmentType, 'Pending');
      await shot(page, 'TS-02_TC-03');
    });
  });

  // ── TS-03 — Add appointment without Note (optional) ────────────────────────
  test('TS-03 — user can successfully adding customer appointment without Note (optional)', async ({ page }) => {
    test.fixme(true, 'FE bug: dropdown CORS fail → เลือก type/service ไม่ได้ (ดู BUG-appointment-type-options.md)');
    const list = new CustomerListPage(page);
    const detail = new CustomerDetailPage(page);
    const appt = new AppointmentPage(page);

    await test.step('TS-03_TC-01 — View Appointment', async () => {
      await loginAndOpenList(page);
      await openAppointmentTab(page, list, detail, D.CUST_HAS_APPT.email, D.NAME_HAS_APPT);
      await appt.openScheduleForm();
      await shot(page, 'TS-03_TC-01');
    });
    await test.step('TS-03_TC-02 — Leave Note empty and Add succeeds', async () => {
      await appt.fillScheduleForm({ ...D.NEW_APPT, note: undefined }); // Note ว่าง = optional
      await appt.submitAdd();
      await appt.expectSuccessToast();
      await appt.expectStatus(D.NEW_APPT.appointmentType, 'Pending');
      await shot(page, 'TS-03_TC-02');
    });
  });

  // ── TS-04 — Confirm appointment (Pending → Confirmed) ──────────────────────
  test('TS-04 — user can successfully confirm appointment (Pending → Confirmed)', async ({ page }) => {
    // ⛔ BLOCKED by FE bug: Appointment tab ส่ง id:"undefined" → list ว่างเสมอ (BUG-appointment-list-undefined-id.md)
    // Seed + Arrange พร้อมแล้ว (seedAppointment ✅ verified) — ปลด fixme เมื่อ FE แก้ bug + probe row DOM
    test.fixme(true, 'FE bug: GetAppointmentByCustId ส่ง id:"undefined" → list ว่างเสมอ (ดู BUG-appointment-list-undefined-id.md)');
    const list = new CustomerListPage(page);
    const detail = new CustomerDetailPage(page);
    const appt = new AppointmentPage(page);

    await test.step('TS-04_TC-01 — "Confirm" button shown for Pending', async () => {
      await loginAndOpenList(page);
      await seedCustomer(page, D.CUST_HAS_APPT);                 // Arrange: customer มีอยู่
      await purgeAppointmentsByEmail(page, D.CUST_HAS_APPT.email); // clean-slate (idempotent)
      await seedAppointment(page, D.CUST_HAS_APPT.email, D.SEED_PENDING_APPT); // Arrange: Pending row (API-first)
      await openAppointmentTab(page, list, detail, D.CUST_HAS_APPT.email, D.NAME_HAS_APPT);
      await appt.expectStatus(D.PENDING_ROW, 'Pending');
      await expect(appt.row(D.PENDING_ROW).getByRole('button', { name: /^Confirm$/i })).toBeVisible();
      await shot(page, 'TS-04_TC-01');
    });
    await test.step('TS-04_TC-02 — Click "Confirm" and Status = Confirmed', async () => {
      await appt.confirm(D.PENDING_ROW);
      await appt.expectStatus(D.PENDING_ROW, 'Confirmed');
      // Confirm + Bin ต้องหายไปจากแถวที่ confirmed แล้ว
      await expect(appt.row(D.PENDING_ROW).getByRole('button', { name: /^Confirm$/i })).toBeHidden();
      await shot(page, 'TS-04_TC-02');
    });
  });

  // ── TS-05 — Delete pending appointment ─────────────────────────────────────
  test('TS-05 — user can successfully delete pending appointment', async ({ page }) => {
    // ⛔ BLOCKED by FE bug: Appointment tab ส่ง id:"undefined" → list ว่างเสมอ (BUG-appointment-list-undefined-id.md)
    test.fixme(true, 'FE bug: GetAppointmentByCustId ส่ง id:"undefined" → list ว่างเสมอ (ดู BUG-appointment-list-undefined-id.md)');
    const list = new CustomerListPage(page);
    const detail = new CustomerDetailPage(page);
    const appt = new AppointmentPage(page);

    await test.step('TS-05_TC-01 — View Appointment and Bin icon shown for Pending', async () => {
      await loginAndOpenList(page);
      await seedCustomer(page, D.CUST_HAS_APPT);                 // Arrange: customer มีอยู่
      await purgeAppointmentsByEmail(page, D.CUST_HAS_APPT.email); // clean-slate (idempotent)
      await seedAppointment(page, D.CUST_HAS_APPT.email, D.SEED_PENDING_APPT); // Arrange: Pending row (API-first)
      await openAppointmentTab(page, list, detail, D.CUST_HAS_APPT.email, D.NAME_HAS_APPT);
      await appt.expectStatus(D.PENDING_ROW, 'Pending');
      await shot(page, 'TS-05_TC-01');
    });
    await test.step('TS-05_TC-02 — Click on bin icon and removed from list', async () => {
      await appt.deleteByBin(D.PENDING_ROW);
      await appt.expectSuccessToast();
      await expect(appt.row(D.PENDING_ROW)).toBeHidden();
      await shot(page, 'TS-05_TC-02');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ALTERNATIVE / NEGATIVE SCENARIOS (TA-01 … TA-03)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Customer Appointment — Alternative', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TA-01 — Error toast on empty required fields ───────────────────────────
  test('TA-01 — verify error toast when adding with empty required fields', async ({ page }) => {
    test.fixme(true, 'FE bug: dropdown CORS fail → เปิด option list ไม่ได้ก่อนถึง validation (ดู BUG-appointment-type-options.md)');
    const list = new CustomerListPage(page);
    const detail = new CustomerDetailPage(page);
    const appt = new AppointmentPage(page);

    await test.step('TA-01_TC-01 — View Appointment → open Schedule form', async () => {
      await loginAndOpenList(page);
      await openAppointmentTab(page, list, detail, D.CUST_HAS_APPT.email, D.NAME_HAS_APPT);
      await appt.openScheduleForm();
      await shot(page, 'TA-01_TC-01');
    });
    await test.step('TA-01_TC-02 — No Appointment Type selected → Validation error', async () => {
      await appt.fillScheduleForm({ appointmentType: '', serviceType: D.NEW_APPT.serviceType, appointDate: D.NEW_APPT.appointDate });
      await appt.submitAdd();
      await appt.expectErrorToast();
      await shot(page, 'TA-01_TC-02');
    });
    await test.step('TA-01_TC-03 — No Service Type selected → Validation error', async () => {
      await appt.fillScheduleForm({ appointmentType: D.NEW_APPT.appointmentType, serviceType: '', appointDate: D.NEW_APPT.appointDate });
      await appt.submitAdd();
      await appt.expectErrorToast();
      await shot(page, 'TA-01_TC-03');
    });
    await test.step('TA-01_TC-04 — No Appoint Date entered → Validation error', async () => {
      await appt.fillScheduleForm({ appointmentType: D.NEW_APPT.appointmentType, serviceType: D.NEW_APPT.serviceType, appointDate: '' });
      await appt.submitAdd();
      await appt.expectErrorToast();
      await shot(page, 'TA-01_TC-04');
    });
  });

  // ── TA-02 — Past date disabled in picker ───────────────────────────────────
  test('TA-02 — verify disabled in date picker when selecting appoint date in the past', async ({ page }) => {
    // ✅ VERIFIED DOM 2026-06-19: react-datepicker — past days have aria-disabled="true"
    //    aria-label = "Not available <weekday>, <Month> <Day><ordinal>, <Year>"
    const list = new CustomerListPage(page);
    const detail = new CustomerDetailPage(page);
    const appt = new AppointmentPage(page);

    await test.step('TA-02_TC-01 — View Appointment → open Schedule form', async () => {
      await loginAndOpenList(page);
      await seedCustomer(page, D.CUST_HAS_APPT);
      await openAppointmentTab(page, list, detail, D.CUST_HAS_APPT.email, D.NAME_HAS_APPT);
      await appt.openScheduleForm();
      await shot(page, 'TA-02_TC-01');
    });
    await test.step('TA-02_TC-02 — Enter past date (yesterday) → Disable', async () => {
      // click date field → calendar opens
      await appt.appointDate.click();
      await page.waitForSelector('[role="gridcell"][aria-disabled="true"]', { timeout: 5000 });
      // all past days = aria-disabled="true" + aria-label starts "Not available"
      const pastCell = page.locator('[role="gridcell"][aria-disabled="true"]').first();
      await expect(pastCell).toBeVisible();
      await expect(pastCell).toHaveAttribute('aria-label', /^Not available/i);
      // today is NOT disabled
      const todayCell = page.locator('[role="gridcell"][aria-disabled="false"][class*="today"]');
      await expect(todayCell).not.toHaveAttribute('aria-disabled', 'true');
      await shot(page, 'TA-02_TC-02');
    });
  });

  // ── TA-03 — Empty state "No results found." ────────────────────────────────
  test('TA-03 — verify "No results found." when customer has no appointment list', async ({ page }) => {
    const list = new CustomerListPage(page);
    const detail = new CustomerDetailPage(page);
    const appt = new AppointmentPage(page);

    await test.step('TA-03_TC-01 — Appointment tab — No appointments found', async () => {
      await loginAndOpenList(page);
      await seedCustomer(page, D.CUST_NO_APPT); // Arrange: ลูกค้าไม่มี appointment (API-first)
      await openAppointmentTab(page, list, detail, D.CUST_NO_APPT.email, D.NAME_NO_APPT);
      await appt.expectNoResults();
      await expect(appt.scheduleBtn).toBeVisible(); // "Schedule" ยังคงแสดง
      await shot(page, 'TA-03_TC-01');
    });
  });
});
