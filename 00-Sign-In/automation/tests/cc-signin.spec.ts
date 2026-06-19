import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import { SignInPage } from '../pages/SignInPage';

/**
 * CC Super App — Sign In · Playwright E2E
 * แปลงตรงจาก cc-signin-testcases.xlsx (sheet TestCases) — 9 scenario / 27 test case
 *   1 scenario = 1 test()  ·  1 test case = 1 test.step('<TestcaseNo> — …') + shot(<TestcaseNo>)
 *   TC ID ตรงกับคอลัมน์ TestcaseNo เป๊ะ (TS-01_TC-01 …) เพื่อให้ Lark upsert ด้วย key นี้ได้
 *
 * Selectors verified against live STG DOM (UI ภาษาไทย). env จริงควรเป็น QA — เปลี่ยน CC_BASE_URL เมื่อพร้อม
 *
 * Skip strategy:
 *   - READY (CC_BASE_URL) ยังไม่ตั้ง → skip ทุกเคสที่ต้องเปิดหน้าจริง
 *   - PASS (CC_PASSWORD) ยังไม่ตั้ง → skip เคสที่ต้อง auth จริง
 *   - TBC / Expected Result ยังไม่ยืนยัน → skip(true) + โครงพร้อมรอ:
 *       · TA-01/02/03 = พฤติกรรม auth fail TBC (HA1/HA2)
 *       · TA-04/05    = wording/Organization-required TBC (HA5/HA3) — STG จริงขึ้นข้อความไทย
 *                       และ "ไม่" แสดง Organization required → รอ PO ยืนยัน
 */
const ORG = process.env.CC_ORG || 'BMA';
const USER = process.env.CC_USERNAME || 'somchai.jai';
const PASS = process.env.CC_PASSWORD || '';
const READY = !!process.env.CC_BASE_URL;

const NEED_ENV = 'env ทดสอบยังไม่พร้อม — ตั้ง CC_BASE_URL แล้วรันใหม่';
const NEED_PASS = 'เคสต้อง auth จริง — ตั้ง CC_PASSWORD แล้วรันใหม่';

/** screenshot ราย step → test-results/steps/<TestcaseNo>.png */
async function shot(page: Page, label: string) {
  fs.mkdirSync('test-results/steps', { recursive: true });
  await page.screenshot({ path: `test-results/steps/${label}.png` });
}

test.describe('CC Sign In — Success', () => {
  test('CC_SIGNIN_TS01 — ล็อกอินสำเร็จด้วย Username/Password', async ({ page }) => {
    test.skip(!READY, NEED_ENV);
    test.skip(!PASS, NEED_PASS);
    const p = new SignInPage(page);
    await test.step('TS-01_TC-01 — เปิดหน้า Sign In', async () => {
      await p.goto();
      await expect(p.signInBtn).toBeVisible();
      await shot(page, 'TS-01_TC-01');
    });
    await test.step('TS-01_TC-02 — กรอกครบทุก required', async () => {
      await p.fillOrganization(ORG);
      await p.username.fill(USER);
      await p.password.fill(PASS);
      await shot(page, 'TS-01_TC-02');
    });
    await test.step('TS-01_TC-03 — เลือก Organization = BMA', async () => {
      await expect(p.organization).toHaveValue(ORG);
      await shot(page, 'TS-01_TC-03');
    });
    await test.step('TS-01_TC-04 — กรอก Username มีจริง', async () => {
      await expect(p.username).toHaveValue(USER);
      await shot(page, 'TS-01_TC-04');
    });
    await test.step('TS-01_TC-05 — กรอก Password ตรง', async () => {
      await expect(p.password).toHaveValue(PASS);
      await shot(page, 'TS-01_TC-05');
    });
    await test.step("TS-01_TC-06 — กด Sign In → 'Work Order Summary' (สรุปใบสั่งงาน)", async () => {
      await p.signInBtn.click();
      await expect(p.dashboardHeading).toBeVisible({ timeout: 15_000 });
      await shot(page, 'TS-01_TC-06');
    });
  });

  test('CC_SIGNIN_TS02 — ล็อกอิน + Remember me คงสถานะ', async ({ page, context }) => {
    test.skip(!READY, NEED_ENV);
    test.skip(!PASS, NEED_PASS);
    const p = new SignInPage(page);
    await test.step('TS-02_TC-01 — เลือก Organization = BMA', async () => {
      await p.goto();
      await p.fillOrganization(ORG);
      await expect(p.organization).toHaveValue(ORG);
      await shot(page, 'TS-02_TC-01');
    });
    await test.step('TS-02_TC-02 — กรอก credential ถูกต้อง', async () => {
      await p.username.fill(USER);
      await p.password.fill(PASS);
      await shot(page, 'TS-02_TC-02');
    });
    await test.step('TS-02_TC-03 — ติ๊ก Remember me แล้ว Sign In', async () => {
      await p.setRememberMe(true);
      await p.signInBtn.click();
      await expect(p.dashboardHeading).toBeVisible({ timeout: 15_000 });
      await shot(page, 'TS-02_TC-03');
    });
    await test.step('TS-02_TC-04 — ปิด/เปิดแอปใหม่ → เข้าอัตโนมัติ', async () => {
      const page2 = await context.newPage();
      const p2 = new SignInPage(page2);
      await page2.goto('/cms', { waitUntil: 'networkidle' });
      await expect(p2.dashboardHeading).toBeVisible({ timeout: 15_000 });
      await shot(page2, 'TS-02_TC-04');
    });
  });
});

test.describe('CC Sign In — UI behavior', () => {
  test('CC_SIGNIN_TS03 — Password visibility toggle (Eye Icon)', async ({ page }) => {
    test.skip(!READY, NEED_ENV);
    const p = new SignInPage(page);
    await test.step('TS-03_TC-01 — ค่าเริ่มต้น Password ถูกซ่อน (masked)', async () => {
      await p.goto();
      await p.password.fill('Bma@2026xz');
      await expect(p.password).toHaveAttribute('type', 'password');
      await shot(page, 'TS-03_TC-01');
    });
    await test.step('TS-03_TC-02 — กด Eye Icon → แสดงรหัส (plaintext)', async () => {
      await p.eyeToggle.click();
      await expect(p.password).toHaveAttribute('type', 'text');
      await shot(page, 'TS-03_TC-02');
    });
    await test.step('TS-03_TC-03 — กด Eye Icon ซ้ำ → ซ่อนรหัส (masked)', async () => {
      await p.eyeToggle.click();
      await expect(p.password).toHaveAttribute('type', 'password');
      await shot(page, 'TS-03_TC-03');
    });
  });

  test('CC_SIGNIN_TS04 — Forgot Password modal', async ({ page }) => {
    test.skip(!READY, NEED_ENV);
    const p = new SignInPage(page);
    await test.step('TS-04_TC-01 — เปิด Reset Password modal', async () => {
      await p.goto();
      await p.forgotPasswordLink.click();
      await expect(p.resetModalTitle).toBeVisible();
      await expect(p.resetModalDesc).toBeVisible();
      await shot(page, 'TS-04_TC-01');
    });
    await test.step('TS-04_TC-02 — ปิด modal ด้วยปุ่ม Close', async () => {
      await p.resetModalCloseBtn.click();
      await expect(p.resetModalTitle).toBeHidden();
      await expect(p.signInBtn).toBeVisible();
      await shot(page, 'TS-04_TC-02');
    });
  });
});

test.describe('CC Sign In — Alternative (Validation · Pending PO)', () => {
  // ⚠️ STG จริง: validation เป็นภาษาไทย ("จำเป็นต้องมีชื่อผู้ใช้" / "จำเป็นต้องมีรหัสผ่าน")
  //    และ "ไม่" แสดงข้อความ Organization required → ขัดกับ Expected เดิม (อังกฤษ + 3 ข้อความ)
  //    wording (HA5) + Organization เป็น required จริงไหม (HA3) = ยังไม่ยืนยัน → skip รอ PO
  test('CC_SIGNIN_TA04 — Validation: ช่องว่างทั้งหมด', async ({ page }) => {
    test.skip(
      true,
      'Expected wording TBC (HA5) — STG จริงเป็นไทย; Organization required ไม่แสดง (HA3) — Pending PO',
    );
    const p = new SignInPage(page);
    await test.step('TA-04_TC-01 — ไม่กรอกช่องใดเลย กด Sign In → ข้อความ required', async () => {
      await p.goto();
      await p.signInBtn.click();
      // observed (ไทย): "จำเป็นต้องมีชื่อผู้ใช้", "จำเป็นต้องมีรหัสผ่าน" — Organization: ไม่แสดง
      await expect(p.errorText('จำเป็นต้องมีชื่อผู้ใช้')).toBeVisible();
      await expect(p.errorText('จำเป็นต้องมีรหัสผ่าน')).toBeVisible();
      // TODO(PO): ยืนยัน Organization required + wording สุดท้าย (อังกฤษ/ไทย)
      await shot(page, 'TA-04_TC-01');
    });
  });

  test('CC_SIGNIN_TA05 — Validation: Organization ว่าง', async ({ page }) => {
    test.skip(
      true,
      'Organization required behavior/wording TBC (HA3/HA5) — STG จริงไม่แสดง Organization required — Pending PO',
    );
    const p = new SignInPage(page);
    await test.step('TA-05_TC-01 — กรอก User/Pass ครบ เว้น Organization → ข้อความ required', async () => {
      await p.goto();
      await p.username.fill(USER);
      await p.password.fill('Bma@2026xz');
      await p.signInBtn.click();
      // TODO(PO): ยืนยันว่า Organization เป็น required หรือไม่ + ข้อความ
      await shot(page, 'TA-05_TC-01');
    });
  });
});

test.describe('CC Sign In — Alternative (Auth fail · Pending PO)', () => {
  // ⚠️ Expected Result = TBC (FR-05 fail / HA1/HA2) — ยังไม่ถาม PO
  test('CC_SIGNIN_TA01 — ล็อกอินไม่สำเร็จ — Password ผิด', async ({ page }) => {
    test.skip(true, 'Expected Result = TBC — Pending PO (HA1/HA2)');
    const p = new SignInPage(page);
    await test.step('TA-01_TC-01 — กรอกครบ + Org/User ถูก', async () => {
      await p.goto();
      await p.fillOrganization(ORG);
      await p.username.fill(USER);
      await shot(page, 'TA-01_TC-01');
    });
    await test.step('TA-01_TC-02 — กรอก Password ผิด', async () => {
      await p.password.fill('Wrong#2026');
      await shot(page, 'TA-01_TC-02');
    });
    await test.step('TA-01_TC-03 — กด Sign In → (พฤติกรรม/ข้อความ TBC)', async () => {
      await p.signInBtn.click();
      // TODO(PO): assert พฤติกรรม/ข้อความ fail เมื่อ HA1/HA2 ถูกยืนยัน
      await shot(page, 'TA-01_TC-03');
    });
  });

  test('CC_SIGNIN_TA02 — ล็อกอินไม่สำเร็จ — Username ไม่มีในระบบ', async ({ page }) => {
    test.skip(true, 'Expected Result = TBC — Pending PO (HA1)');
    const p = new SignInPage(page);
    await test.step('TA-02_TC-01 — Org ถูก + Password กรอก', async () => {
      await p.goto();
      await p.fillOrganization(ORG);
      await p.password.fill('Bma@2026xz');
      await shot(page, 'TA-02_TC-01');
    });
    await test.step('TA-02_TC-02 — กรอก Username ไม่มีจริง', async () => {
      await p.username.fill('nattapong.xyz');
      await shot(page, 'TA-02_TC-02');
    });
    await test.step('TA-02_TC-03 — กด Sign In → (ข้อความ TBC)', async () => {
      await p.signInBtn.click();
      // TODO(PO): assert ข้อความ fail เมื่อ HA1 ถูกยืนยัน
      await shot(page, 'TA-02_TC-03');
    });
  });

  test('CC_SIGNIN_TA03 — ล็อกอินไม่สำเร็จ — Organization ผิด tenant', async ({ page }) => {
    test.skip(true, 'Expected Result = TBC — Pending PO (HA1)');
    const p = new SignInPage(page);
    await test.step('TA-03_TC-01 — Username/Password ถูก', async () => {
      await p.goto();
      await p.username.fill(USER);
      await p.password.fill('Bma@2026xz');
      await shot(page, 'TA-03_TC-01');
    });
    await test.step('TA-03_TC-02 — กรอก Organization ผิด tenant (MWA)', async () => {
      await p.fillOrganization('MWA');
      await shot(page, 'TA-03_TC-02');
    });
    await test.step('TA-03_TC-03 — กด Sign In → (ข้อความ TBC)', async () => {
      await p.signInBtn.click();
      // TODO(PO): assert ข้อความ fail เมื่อ HA1 ถูกยืนยัน
      await shot(page, 'TA-03_TC-03');
    });
  });
});
