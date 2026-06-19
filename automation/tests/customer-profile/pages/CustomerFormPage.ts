import { Page, Locator, expect } from '@playwright/test';

/** ชนิดข้อมูล Customer สำหรับกรอกฟอร์ม (Real Example Data) */
export interface CustomerData {
  email: string;
  phone: string;
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  landline?: string;
  type?: string;
  dob?: string;        // dd/mm/yyyy (พ.ศ.) ตาม design
  citizenId?: string;
  registered?: AddressData;
  sameAsRegistered?: boolean;
  current?: AddressData;
  preferences?: { contactMethod?: string; language?: string; note?: string };
  custom?: { companyName?: string; employeeId?: string; lineId?: string; drivingLicense?: string; position?: string };
}

export interface AddressData {
  houseNo?: string; room?: string; floor?: string; building?: string;
  street?: string; province?: string; district?: string; subdistrict?: string;
  postalCode?: string; country?: string;
}

/**
 * Page Object — Add / Edit Customer Form (ACP / UCP)
 * ✅ VERIFIED input attributes (staging, UI = English) 2026-06-16:
 *   name=email/mobileNo/citizenId/firstName/middleName/lastName/landline/note(textarea)
 *   address text: name=no/room/floor/building/street/postalCode/country (registered=nth0, current=nth1)
 *   selects (ไม่มี name) → เลือกด้วย option content (Mr./Male/Gold/Mobile Number/English)
 *   dob placeholder "mm/dd/yyyy" · custom → placeholder · checkbox เดียว · submit "Save"
 *   gender/title/type ใช้ค่าตรงกับ option EN (Male/Female/Other, Mr./Ms./Mrs., Bronze..Platinum)
 */
export class CustomerFormPage {
  readonly page: Page;
  readonly email: Locator;
  readonly phone: Locator;
  readonly citizenId: Locator;
  readonly dob: Locator;
  readonly photoInput: Locator;
  readonly sameAsRegistered: Locator;
  readonly saveBtn: Locator;
  readonly backBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.locator('input[name="email"]');
    this.phone = page.locator('input[name="mobileNo"]');
    this.citizenId = page.locator('input[name="citizenId"]');
    this.dob = page.getByPlaceholder('mm/dd/yyyy');
    this.photoInput = page.locator('input[type="file"]');
    this.sameAsRegistered = page.getByRole('checkbox');
    this.saveBtn = page.getByRole('button', { name: 'Save' });
    this.backBtn = page.getByRole('button', { name: 'Back' });
  }

  /** select ที่ไม่มี name → ระบุด้วย option ที่มีอยู่ข้างใน */
  private selectByOption(optionLabel: string): Locator {
    return this.page.locator('select', { has: this.page.getByRole('option', { name: optionLabel, exact: true }) });
  }
  private async fill(loc: Locator, value?: string) {
    if (value === undefined || value === '') return;
    await loc.fill(value);
  }
  private async pick(selLabel: string, value?: string) {
    if (!value) return;
    const sel = this.selectByOption(selLabel);
    await sel.selectOption({ label: value }).catch(async () => { await sel.selectOption(value); });
  }

  async fillPersonalDetails(d: CustomerData) {
    await this.fill(this.email, d.email);
    await this.fill(this.phone, d.phone);
    await this.fill(this.citizenId, d.citizenId);
    await this.pick('Mr.', d.title);                                   // title select
    await this.fill(this.page.locator('input[name="firstName"]'), d.firstName);
    await this.fill(this.page.locator('input[name="middleName"]'), d.middleName);
    await this.fill(this.page.locator('input[name="lastName"]'), d.lastName);
    await this.pick('Male', d.gender);                                 // gender select (Male/Female/Other)
    await this.fill(this.page.locator('input[name="landline"]'), d.landline);
    await this.pick('Gold', d.type);                                  // type select (Bronze..Platinum)
    await this.pickDob(d.dob);                                        // dob = readonly datepicker (fill ค้าง!)
  }

  /** dob input เป็น readonly datepicker → ต้องคลิกปฏิทิน. dobStr = "dd/mm/yyyy" (พ.ศ. หรือ ค.ศ.)
   *  คืน false ถ้าวันที่ไกลเกิน (navigate เยอะ) — dob เป็น optional จึงข้ามได้ */
  async pickDob(dobStr?: string): Promise<boolean> {
    if (!dobStr) return false;
    const m = dobStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return false;
    const day = +m[1]; let year = +m[3]; const monthIdx = +m[2] - 1;
    if (year > 2400) year -= 543;                                     // พ.ศ. → ค.ศ.
    const target = new Date(year, monthIdx, day);

    // ไกลเกิน 130 เดือน (≈11 ปี) จากปัจจุบัน → ข้ามทันที (dob optional, navigate ไม่คุ้ม)
    const now = new Date();
    if (Math.abs((year * 12 + monthIdx) - (now.getFullYear() * 12 + now.getMonth())) > 130) return false;

    await this.dob.click();                                           // เปิด calendar
    const heading = this.page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{4}/ }).first();
    await heading.waitFor({ timeout: 5000 }).catch(() => {});

    // navigate เดือน (cap 130 ครั้ง ≈ 10 ปี — ไกลกว่านี้ข้าม)
    for (let i = 0; i < 130; i++) {
      const txt = (await heading.textContent().catch(() => '')) || '';
      const hm = txt.match(/([A-Za-z]+)\s+(\d{4})/);
      if (hm) {
        const curIdx = new Date(`${hm[1]} 1, ${hm[2]}`).getMonth() + (+hm[2]) * 12;
        const tgtIdx = monthIdx + year * 12;
        if (curIdx === tgtIdx) break;
        const btn = curIdx > tgtIdx ? 'Previous Month' : 'Next Month';
        const navBtn = this.page.getByRole('button', { name: btn });
        if (!(await navBtn.isVisible().catch(() => false))) { await this.page.keyboard.press('Escape').catch(() => {}); return false; }
        await navBtn.click();
        await this.page.waitForTimeout(40);
      }
      if (i === 129) { await this.page.keyboard.press('Escape').catch(() => {}); return false; }
    }
    // คลิก gridcell ของวันเป้าหมาย (accessible name = "Choose <Weekday>, <Month> <day><ord>, <year>")
    const monthName = target.toLocaleString('en-US', { month: 'long' });
    const cell = this.page.getByRole('gridcell', { name: new RegExp(`${monthName} ${day}(st|nd|rd|th), ${year}`) }).first();
    await cell.click({ timeout: 5000 }).catch(() => {});
    return true;
  }

  async fillAddress(scope: 'registered' | 'current', a?: AddressData) {
    if (!a) return;
    const i = scope === 'current' ? 1 : 0;
    const at = (name: string) => this.page.locator(`input[name="${name}"]`).nth(i);
    await this.fill(at('no'), a.houseNo);
    await this.fill(at('room'), a.room);
    await this.fill(at('floor'), a.floor);
    await this.fill(at('building'), a.building);
    await this.fill(at('street'), a.street);
    await this.fill(at('postalCode'), a.postalCode);
    await this.fill(at('country'), a.country);
    // Province/District/Sub-district = ปุ่ม picker (best-effort, bound timeout กัน hang 90s)
    for (const [btn, val] of [['Select Province', a.province], ['Select District', a.district], ['Select Sub-district', a.subdistrict]] as const) {
      if (!val) continue;
      try {
        await this.page.getByRole('button', { name: btn }).nth(i).click({ timeout: 3000 });
        await this.page.getByText(val, { exact: true }).first().click({ timeout: 3000 });
      } catch { /* picker ไม่เปิด/ไม่มี option → ข้าม (address optional) */ }
    }
  }

  async checkSameAsRegistered(on: boolean) {
    const checked = await this.sameAsRegistered.isChecked().catch(() => false);
    if (checked !== on) await this.sameAsRegistered.click();
  }

  async fillPreferences(p?: CustomerData['preferences']) {
    if (!p) return;
    await this.pick('Mobile Number', p.contactMethod);  // contact select (Email/Mobile Number)
    await this.pick('English', p.language);             // language select (Thai/English)
    await this.fill(this.page.locator('textarea[name="note"]'), p.note);
  }

  async fillCustomForm(c?: CustomerData['custom']) {
    if (!c) return;
    await this.fill(this.page.getByPlaceholder('Company Name'), c.companyName);
    await this.fill(this.page.getByPlaceholder('Employee ID'), c.employeeId);
    await this.fill(this.page.getByPlaceholder(/Line ID/), c.lineId);
    await this.fill(this.page.getByPlaceholder(/Driving\s+License/), c.drivingLicense);
    await this.fill(this.page.getByPlaceholder(/Position/), c.position);
  }

  async uploadPhoto(filePath: string) {
    await this.startCapture(); // arm ดัก error เผื่อ format/size ผิด (TA-09/10)
    await this.photoInput.setInputFiles(filePath);
  }

  /** รอฟอร์มพร้อม (email field โผล่) ก่อนทำงาน — กัน race หลังเปิด Add */
  async waitReady() {
    await expect(this.email).toBeVisible();
  }

  /** click Save เฉยๆ (ไม่รอ networkidle) — กัน validation error (transient) หายก่อน assert */
  async save() {
    await this.saveBtn.click();
  }

  /** สำหรับ success flow ที่ต้อง redirect หลังบันทึก */
  async saveAndWait() {
    await this.saveBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  async fillAll(d: CustomerData) {
    await this.fillPersonalDetails(d);
    await this.fillAddress('registered', d.registered);
    if (d.sameAsRegistered) await this.checkSameAsRegistered(true);
    else await this.fillAddress('current', d.current);
    await this.fillPreferences(d.preferences);
    await this.fillCustomForm(d.custom);
  }

  /** ดักทุกข้อความที่ถูกเพิ่มเข้า DOM ตั้งแต่ตอนนี้ (MutationObserver) — จับ toast/error แวบเดียว */
  private async startCapture() {
    await this.page.evaluate(() => {
      (window as any).__caps = [];
      const obs = new MutationObserver((muts) => {
        for (const m of muts) {
          for (const n of Array.from(m.addedNodes)) { const t = (n.textContent || '').trim(); if (t) (window as any).__caps.push(t); }
          const t = (m.target as any)?.textContent?.trim(); if (t) (window as any).__caps.push(t);
        }
      });
      obs.observe(document.body, { childList: true, subtree: true, characterData: true });
      (window as any).__capObs = obs;
    });
  }
  private async readCapture(): Promise<string[]> {
    return this.page.evaluate(() => { (window as any).__capObs?.disconnect(); return (window as any).__caps || []; });
  }

  /** poll live DOM ซ้ำๆ หา message (จับได้ทั้ง inline error ค้าง + toast แวบเดียว) */
  private async pollForText(message: string | RegExp, timeout = 7000) {
    const re = typeof message === 'string' ? new RegExp(message, 'i') : message;
    await expect.poll(async () => {
      if (await this.page.getByText(re).first().isVisible().catch(() => false)) return true;
      return this.page.evaluate((src) => {
        const rx = new RegExp(src, 'i');
        return Array.from(document.querySelectorAll('body *')).some((e: any) => e.children.length === 0 && rx.test(e.textContent || ''));
      }, re.source).catch(() => false);
    }, { timeout, intervals: [150, 150, 200, 300, 500] }).toBe(true);
  }

  /** คลิก Save แล้ว assert ว่า error message โผล่ */
  async saveExpectingError(message: string | RegExp) {
    await this.saveBtn.click();
    await this.pollForText(message);
  }

  /** สำหรับเคส upload (ไม่ได้คลิก Save) — assert error หลัง action */
  async expectErrorToast(message: string | RegExp) {
    await this.pollForText(message);
  }
}
