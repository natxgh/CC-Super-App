/**
 * Real Example Data — Customer Form Configuration (CFC + DFC)
 * ตรงกับ customer-form-configuration-testcases.xlsx (ไม่ใช้ test/xxx/ทดสอบ)
 *
 * marker `qa-automation` ฝังในชื่อฟอร์มที่ test สร้าง → teardown ลบเฉพาะฟอร์มของเทส
 * (ดู fixtures/form-seed.ts purgeTestForms + MISSING-API.md)
 */

/** ฟอร์ม custom ที่ test สร้างผ่าน builder — teardown ลบทิ้งทุกตัวด้วย DeleteForms (by name) */
export const FORM_B2B = 'B2B Corporate Customer Data [qa-automation]';
export const FORM_VIP = 'VIP Customer Form [qa-automation]';

/** ฟอร์มที่มีอยู่แล้วใน STG (Arrange ของ Edit scenario — ไม่ลบ ไม่ได้สร้างเอง) */
export const FORM_EXISTING = 'Contact Customization';

/** ทุกชื่อฟอร์มที่ test สร้าง → teardown purge by name (เฉพาะที่มี marker) */
export const TEST_FORM_NAMES = [FORM_B2B, FORM_VIP];

/** Field labels / options ที่ใช้ใน builder (Real Example) */
export const FIELD_TAX_ID = 'Tax ID';
export const FIELD_TAX_ID_PLACEHOLDER = 'Enter the 13-digit number';
export const COMPANY_LABEL_NEW = 'Company Name (TH)';
export const SELECT_OPTIONS = ['Juristic Person', 'Individual'];

/** Grid Columns boundary (BVA, Q2 — clamp 1..5) */
export const GRID = {
  belowMin: '0',   // → clamp 1
  min: '1',
  max: '5',
  aboveMax: '6',   // → clamp 5
};

/** ไฟล์ assets ที่เคสต้องใช้ (วางใน automation/assets หรือ override ด้วย CFC_ASSETS_DIR) */
export const ASSET_FORM_SCHEMA = 'form-schema.json';   // valid export ของ builder นี้ (CFC11-TC1 / TS-04)
export const ASSET_BROKEN_JSON = 'broken.json';        // malformed (CFC11-TC2 / TA-05)
export const ASSET_BAD_UPLOAD = 'contract.pdf';        // .pdf 5MB — ผิด format/size (TA-08)

/**
 * Default Field Config (DFC) — ค่าที่จะ set ในแต่ละ scenario
 * key ตรงกับ CustomerFormConfigUpdateInput (introspected):
 *   photo, displayName, title, firstName, middleName, lastName, citizenId, dob, blood, gender,
 *   mobileNo, email, userType, note, languagePreference, contractPreference,
 *   address(JSON), currentAddress(JSON), dynamicForm(JSON)
 * ค่าเหล่านี้ใช้ตอน verify เท่านั้น (UI เป็นคนสั่ง toggle จริง) — DFC integration ตรวจผ่าน Add Customer
 */
export const DFC_FIELD_LABELS = {
  profilePhoto: 'Profile Photo',
  dateOfBirth: 'Date of Birth',
  bloodType: 'Blood Type',   // label on config page (matches FIELD_ID key)
  note: 'Note',
  userType: 'User Type',
};

/**
 * Labels as they appear on the Add Customer / Edit Customer consumer form.
 * These may differ from config-page labels (e.g. "Blood Type" in config = "Blood Group" on form).
 */
export const CONSUMER_FIELD_LABELS = {
  dateOfBirth: 'Date of Birth',
  bloodGroup: 'Blood Group',   // config label "Blood Type" shows as "Blood Group" on Add Customer
};
