import { Page, Locator } from '@playwright/test';

/**
 * Page Object — CC Super App "Sign In" (CMS)
 * Selectors verified against the live STG DOM (2026-06) — UI เป็นภาษาไทย
 *   - Username / Password / Organization = <input> by id (#username / #password / #organization)
 *   - Organization = plain text input (resolves HA3: เป็น input ไม่ใช่ dropdown)
 *   - Remember me   = input[type=checkbox]
 *   - Eye toggle    = <span.cursor-pointer> ข้างช่อง password (toggle เดียว ไม่ใช่ 2 ปุ่ม)
 *   - Sign In       = <button> "เข้าสู่ระบบ"
 *   - Forgot link   = "ลืมรหัสผ่าน?"  → modal "รีเซ็ตรหัสผ่าน"
 */
export class SignInPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly organization: Locator;
  readonly rememberMe: Locator;
  readonly eyeToggle: Locator;
  readonly signInBtn: Locator;
  readonly forgotPasswordLink: Locator;
  readonly resetModalTitle: Locator;
  readonly resetModalDesc: Locator;
  readonly resetModalCloseBtn: Locator;
  readonly dashboardHeading: Locator; // "สรุปใบสั่งงาน" = Work Order Summary

  constructor(page: Page) {
    this.page = page;
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.organization = page.locator('#organization');
    this.rememberMe = page.locator('input[type="checkbox"]');
    this.eyeToggle = this.password.locator('xpath=../following-sibling::span[1]');
    this.signInBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ' });
    this.forgotPasswordLink = page.getByText('ลืมรหัสผ่าน?');
    this.resetModalTitle = page.getByRole('heading', { name: 'รีเซ็ตรหัสผ่าน' });
    this.resetModalDesc = page.getByText(
      'ติดต่อผู้ดูแลระบบหรือฝ่ายสนับสนุน เพื่อรีเซ็ตรหัสผ่านของคุณ',
    );
    this.resetModalCloseBtn = page.getByRole('button', { name: 'ปิด', exact: true });
    this.dashboardHeading = page.getByText('สรุปใบสั่งงาน').first();
  }

  async goto() {
    await this.page.goto('/cms', { waitUntil: 'networkidle' });
    await this.signInBtn.waitFor();
  }

  /** error ใต้ช่อง (validation required) — ข้อความจริงเป็นภาษาไทย */
  errorText(message: string | RegExp): Locator {
    return this.page.getByText(message);
  }

  async fillOrganization(value: string) {
    await this.organization.fill(value);
  }

  async isRemembered(): Promise<boolean> {
    return this.rememberMe.isChecked();
  }

  async setRememberMe(on: boolean) {
    if ((await this.isRemembered()) !== on) await this.rememberMe.click();
  }

  /** กรอกฟอร์ม + กด Sign In. เว้นช่องที่เป็น undefined ไว้ (ทดสอบ required) */
  async signIn(opts: {
    org?: string;
    username?: string;
    password?: string;
    remember?: boolean;
  }) {
    if (opts.org !== undefined) await this.fillOrganization(opts.org);
    if (opts.username !== undefined) await this.username.fill(opts.username);
    if (opts.password !== undefined) await this.password.fill(opts.password);
    if (opts.remember !== undefined) await this.setRememberMe(opts.remember);
    await this.signInBtn.click();
  }
}
