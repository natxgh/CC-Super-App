import { Page, Locator } from '@playwright/test';

/**
 * Page Object — CC Super App Login
 * Selectors ยืนยันจาก DOM inspection จริง (ดู LOCATORS.md §0):
 *  - Username     = #username (placeholder "กรอกชื่อผู้ใช้ของคุณ")
 *  - Password     = #password (placeholder "กรอกรหัสผ่านของคุณ")
 *  - Organization = #organization (placeholder "กรอกชื่อองค์กรของคุณ")
 *  - Login button = button "เข้าสู่ระบบ"
 */
export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly organization: Locator;
  readonly loginBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    // ยกระดับเป็น getByPlaceholder/getByRole (เสถียรกว่า id) — id เป็น fallback
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.organization = page.locator('#organization');
    this.loginBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ' });
  }

  async goto() {
    await this.page.goto('/cc/contacts-list');
    await this.username.waitFor();
  }

  /** Fill credential form + submit. ทุกค่าอ่านจาก env (อย่า hardcode) */
  async login(opts: { org: string; username: string; password: string }) {
    await this.organization.fill(opts.org);
    await this.username.fill(opts.username);
    await this.password.fill(opts.password);
    await this.loginBtn.click();
    // รอ signal ว่า login สำเร็จ = access_token โผล่ใน localStorage (กัน networkidle hang บนแอป real-time)
    await this.page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
    // บังคับ UI = English ทุกเทส + reload ให้มีผล
    await this.page.evaluate(() => localStorage.setItem('language', 'en'));
    await this.page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
  }
}
