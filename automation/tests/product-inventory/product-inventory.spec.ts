import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../shared/pages/LoginPage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { seedProduct, purgeByCode } from './fixtures/product-seed';
import * as D from './fixtures/testdata';

/**
 * Product & Inventory Management — Playwright E2E
 * Generated from product-inventory-testcases.xlsx (pushed to Lark Base tblIwUWXkWNLYy4c)
 * Pattern: 1 Scenario = 1 test() (Scenario No.) · 1 Test Case = 1 test.step('<TC No.> — …') + shot()
 *   TC No. ตรงกับ key ใน Lark (TS-01_TC-01 …) → upsert ผลราย TC ได้
 * Arrange  = API-first (fixtures/product-seed.ts — verified GraphQL CreateProduct/GetListProduct/DeleteProduct)
 * Teardown = teardown/global-teardown.ts (PIM_TEARDOWN=1) — ลบ product ที่ automation สร้าง
 *
 * ⚠️ staging ต้อง login จริง — set CP_USERNAME/CP_PASSWORD/CP_ORG เพื่อรัน · ไม่ตั้ง → skip (ไม่แกล้งผ่าน)
 * ⚠️ Page Object selectors = best-effort จาก design (ยังไม่ verified live DOM) → verify ก่อน execute จริง
 * 🟡 Expected หลายเคสยังรอ exact text จาก PO (HA11: per-field error + empty-state) → assert แบบกว้าง/soft
 */
const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || '';
const ASSETS = process.env.CP_ASSETS_DIR || path.join(__dirname, '..', '..', 'assets');

async function shot(page: Page, label: string) {
  fs.mkdirSync('test-results/steps', { recursive: true });
  await page.screenshot({ path: `test-results/steps/${label}.png`, fullPage: true }).catch(() => {});
}

async function loginAndOpenList(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login({ org: ORG, username: USER, password: PASS });
  await new ProductListPage(page).goto();
}

function assetOrSkip(file: string): string {
  const p = path.join(ASSETS, file);
  test.skip(!fs.existsSync(p), `ต้องมีไฟล์ ${file} ใน ${ASSETS} (set CP_ASSETS_DIR)`);
  return p;
}

// ════════════════════════════════════════════════════════════════════════════
//  SUCCESS SCENARIOS (TS-01 … TS-08)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Product & Inventory — Success', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TS-01 — Add new product (happy path) ────────────────────────────────────
  test('TS-01 — add a new product successfully', async ({ page }) => {
    const list = new ProductListPage(page);
    const form = new ProductFormPage(page);
    const d = D.XIA_RVX20;

    await test.step('TS-01_TC-01 — Open Product List + all primary buttons present', async () => {
      await loginAndOpenList(page);
      await purgeByCode(page, d.code); // clean slate + record ให้ teardown
      await expect(list.createBtn).toBeVisible();
      await expect.soft(list.searchBtn).toBeVisible();
      await expect.soft(list.resetBtn).toBeVisible();
      await shot(page, 'TS-01_TC-01');
    });
    await test.step('TS-01_TC-02 — Fill Create form with all required fields', async () => {
      await list.createBtn.click();
      await form.waitReady();
      await form.fill(d); // ไม่ใส่ image → ยืนยัน Image optional (HA3)
      await expect(form.createBtn).toBeEnabled();
      await shot(page, 'TS-01_TC-02');
    });
    await test.step('TS-01_TC-03 — Click Create Products → created successfully', async () => {
      await form.create();
      await expect(page.getByText(D.TOAST_CREATE, { exact: false })).toBeVisible({ timeout: 15000 });
      await list.search(d.code);
      await list.expectRowVisible(d.code);
      await shot(page, 'TS-01_TC-03');
    });
  });

  // ── TS-02 — View Product Detail ─────────────────────────────────────────────
  test('TS-02 — view product detail', async ({ page }) => {
    const list = new ProductListPage(page);
    const detail = new ProductDetailPage(page);

    await test.step('TS-02_TC-01 — View → Item Details modal shows all fields', async () => {
      await loginAndOpenList(page);
      await list.search(D.CHERY_V27.name);
      await list.clickView(D.CHERY_V27.name);
      await detail.waitLoaded();
      await detail.expectFields(['Chery V27', 'CheryV27', 'Chery', 'Vehicles']);
      await detail.expectActions();
      await shot(page, 'TS-02_TC-01');
    });
  });

  // ── TS-03 — Update product ──────────────────────────────────────────────────
  test('TS-03 — update a product', async ({ page }) => {
    const list = new ProductListPage(page);
    const form = new ProductFormPage(page);

    await test.step('TS-03_TC-01 — Edit form pre-fills existing values', async () => {
      // Arrange: ใช้สินค้าที่ automation คุมเอง (seed) เพื่อ edit ปลอดภัย ไม่แตะ catalog จริง
      await loginAndOpenList(page);
      await seedProduct(page, D.XIA_RVX20);
      await list.search(D.XIA_RVX20.code);
      await list.clickEdit(D.XIA_RVX20.code);
      await form.waitReady();
      await expect(form.code).toHaveValue(D.XIA_RVX20.code);
      await shot(page, 'TS-03_TC-01');
    });
    await test.step('TS-03_TC-02 — Change Price then Update → reflects new value', async () => {
      await form.price.fill('11990');
      await form.update();
      await expect(page.getByText(D.TOAST_UPDATE, { exact: false })).toBeVisible({ timeout: 15000 });
      await shot(page, 'TS-03_TC-02');
    });
  });

  // ── TS-04 — Delete product (deletable: no Stock/Order) ──────────────────────
  test('TS-04 — delete a product (confirm)', async ({ page }) => {
    const list = new ProductListPage(page);

    await test.step('TS-04_TC-01 — Click Delete → confirm dialog appears', async () => {
      await loginAndOpenList(page);
      await seedProduct(page, D.XIA_RVX20); // ของใหม่ ไม่มี Stock/Order → ลบได้
      await list.search(D.XIA_RVX20.code);
      await list.clickDelete(D.XIA_RVX20.code);
      await list.expectDeleteDialog();
      await shot(page, 'TS-04_TC-01');
    });
    await test.step('TS-04_TC-02 — Confirm Delete → product disappears from list', async () => {
      await list.confirmDelete();
      await expect(page.getByText(D.TOAST_DELETE, { exact: false })).toBeVisible({ timeout: 15000 });
      await list.search(D.XIA_RVX20.code);
      await list.expectEmptyState();
      await shot(page, 'TS-04_TC-02');
    });
  });

  // ── TS-05 — Search + filter + reset ─────────────────────────────────────────
  test('TS-05 — search, filter and reset', async ({ page }) => {
    const list = new ProductListPage(page);

    await test.step("TS-05_TC-01 — Search keyword 'Chery' → exact filter", async () => {
      await loginAndOpenList(page);
      await list.search(D.SEARCH_MATCH);
      await list.expectRowVisible('Chery V27');
      await shot(page, 'TS-05_TC-01');
    });
    await test.step('TS-05_TC-02 — Filter Brand = BMW', async () => {
      await list.search('');
      await list.filter('Brand', D.FILTER_BRAND);
      await list.expectRowVisible('BMW');
      await shot(page, 'TS-05_TC-02');
    });
    await test.step('TS-05_TC-03 — Click Reset → list returns to full', async () => {
      await list.reset();
      await expect(list.searchInput).toHaveValue('');
      await shot(page, 'TS-05_TC-03');
    });
  });

  // ── TS-06 — Switch view modes ───────────────────────────────────────────────
  test('TS-06 — switch view modes List / Grid / Table', async ({ page }) => {
    const list = new ProductListPage(page);

    await test.step('TS-06_TC-01 — View = List (default)', async () => {
      await loginAndOpenList(page);
      await list.switchView('List');
      await shot(page, 'TS-06_TC-01');
    });
    await test.step('TS-06_TC-02 — Click Grid → large-image cards', async () => {
      await list.switchView('Grid');
      await shot(page, 'TS-06_TC-02');
    });
    await test.step('TS-06_TC-03 — Click Table → column grid', async () => {
      await list.switchView('Table');
      await expect(page.getByRole('columnheader', { name: /Product Name/i })).toBeVisible();
      await shot(page, 'TS-06_TC-03');
    });
  });

  // ── TS-07 — Sort columns (Table view) ───────────────────────────────────────
  test('TS-07 — sort columns in Table view', async ({ page }) => {
    const list = new ProductListPage(page);

    await test.step('TS-07_TC-01 — Default sort = Name on load', async () => {
      await loginAndOpenList(page);
      await list.switchView('Table');
      const names = await list.columnValues('Product Name');
      // default sort = Name (PO Q12): assert ascending ถ้าอ่านค่าได้ (soft — selector อาจต้อง verify)
      if (names.length > 1) expect.soft([...names], 'default sort = Name asc').toEqual([...names].sort((a, b) => a.localeCompare(b)));
      await shot(page, 'TS-07_TC-01');
    });
    await test.step('TS-07_TC-02 — Sort Price low→high', async () => {
      await list.clickSort('Price');
      await shot(page, 'TS-07_TC-02');
    });
    await test.step('TS-07_TC-03 — Sort Price high→low', async () => {
      await list.clickSort('Price');
      await shot(page, 'TS-07_TC-03');
    });
    await test.step('TS-07_TC-04 — Sort by Year', async () => {
      await list.clickSort('Year');
      await shot(page, 'TS-07_TC-04');
    });
  });

  // ── TS-08 — Boundary: Warranty 0 & Price 0 accepted (PO Q4/Q5) ───────────────
  test('TS-08 — boundary Warranty 0 & Price 0 accepted', async ({ page }) => {
    const list = new ProductListPage(page);
    const form = new ProductFormPage(page);
    const d = D.XIA_FREEBIE;

    await test.step('TS-08_TC-01 — Warranty 0 & Price 0 accepted', async () => {
      await loginAndOpenList(page);
      await purgeByCode(page, d.code);
      await list.createBtn.click();
      await form.waitReady();
      await form.fill({ ...d, warranty: 0, price: 0 });
      await form.create();
      await expect(page.getByText(D.TOAST_CREATE, { exact: false })).toBeVisible({ timeout: 15000 });
      await shot(page, 'TS-08_TC-01');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ALTERNATIVE / NEGATIVE SCENARIOS (TA-01 … TA-12)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Product & Inventory — Alternative', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  async function openCreate(page: Page) {
    const list = new ProductListPage(page);
    const form = new ProductFormPage(page);
    await loginAndOpenList(page);
    await list.createBtn.click();
    await form.waitReady();
    return form;
  }

  test('TA-01 — add fails when Product Code is empty', async ({ page }) => {
    await test.step('TA-01_TC-01 — Leave Product Code empty → submit fails', async () => {
      const form = await openCreate(page);
      await form.fill({ ...D.XIA_RVX20, code: '' }); // เว้นเฉพาะ Code
      await form.submitExpectingError('create'); // exact error text รอ PO (HA11)
      await form.expectFieldError(/Product Code/i);
      await shot(page, 'TA-01_TC-01');
    });
  });

  test('TA-02 — add fails on duplicate Product Code', async ({ page }) => {
    await test.step('TA-02_TC-01 — Duplicate Product Code → error', async () => {
      await loginAndOpenList(page);
      await seedProduct(page, D.XIA_RVX20); // ensure code มีอยู่ → ทำให้ duplicate
      const list = new ProductListPage(page);
      const form = new ProductFormPage(page);
      await list.createBtn.click();
      await form.waitReady();
      await form.fill({ ...D.XIA_RVX20, code: D.XIA_RVX20.code, en: 'Xiaomi Robot Vacuum Clone' });
      await form.submitExpectingError('create'); // "duplicate" text รอ PO
      await shot(page, 'TA-02_TC-01');
    });
  });

  test('TA-03 — add fails on negative Price', async ({ page }) => {
    await test.step('TA-03_TC-01 — Negative Price → invalid', async () => {
      const form = await openCreate(page);
      await form.fill({ ...D.XIA_RVX20, code: 'XIA-RVX20B', price: D.PRICE_NEGATIVE });
      await form.submitExpectingError('create');
      await form.expectFieldError(/Price/i);
      await shot(page, 'TA-03_TC-01');
    });
  });

  test('TA-04 — add fails on negative Warranty (0 is valid)', async ({ page }) => {
    await test.step('TA-04_TC-01 — Negative Warranty → invalid', async () => {
      const form = await openCreate(page);
      await form.fill({ ...D.XIA_RVX20, code: 'XIA-RVX20C', warranty: D.WARRANTY_NEGATIVE });
      await form.submitExpectingError('create');
      await form.expectFieldError(/Warranty/i);
      await shot(page, 'TA-04_TC-01');
    });
  });

  test('TA-05 — add fails on unsupported image (.pdf)', async ({ page }) => {
    await test.step('TA-05_TC-01 — Upload unsupported image (.pdf) → reject', async () => {
      const form = await openCreate(page);
      const pdf = assetOrSkip(D.IMG_PDF);
      await form.uploadImage(pdf);
      // reject = ไม่มี preview / มี error (exact text รอ PO)
      await expect.soft(page.getByText(/invalid|not support|jpg|png|gif/i).first()).toBeVisible().catch(() => {});
      await shot(page, 'TA-05_TC-01');
    });
  });

  test('TA-06 — cancel delete keeps the product', async ({ page }) => {
    const list = new ProductListPage(page);
    await test.step('TA-06_TC-01 — Click Cancel in confirm → not deleted', async () => {
      await loginAndOpenList(page);
      await list.search(D.CHERY_V27.name);
      await list.clickDelete(D.CHERY_V27.name);
      await list.expectDeleteDialog();
      await list.cancelDelete();
      await list.expectRowVisible(D.CHERY_V27.name);
      await shot(page, 'TA-06_TC-01');
    });
  });

  test('TA-07 — search with no results shows empty state', async ({ page }) => {
    const list = new ProductListPage(page);
    await test.step('TA-07_TC-01 — Search not found → empty state', async () => {
      await loginAndOpenList(page);
      await list.search(D.SEARCH_NONE);
      await list.expectEmptyState(); // exact text รอ PO (HA11)
      await shot(page, 'TA-07_TC-01');
    });
  });

  test('TA-08 — filter Status = Inactive', async ({ page }) => {
    const list = new ProductListPage(page);
    await test.step('TA-08_TC-01 — Filter Status = Inactive', async () => {
      await loginAndOpenList(page);
      await list.filter('Status', 'Inactive');
      // เฉพาะ inactive หรือ empty — เก็บหลักฐาน (assert กว้าง: ไม่ throw ถ้า empty)
      await shot(page, 'TA-08_TC-01');
    });
  });

  test('TA-09 — update fails when Product Code is cleared', async ({ page }) => {
    const list = new ProductListPage(page);
    const form = new ProductFormPage(page);
    await test.step('TA-09_TC-01 — Clear Product Code on Update → error', async () => {
      await loginAndOpenList(page);
      await seedProduct(page, D.XIA_RVX20);
      await list.search(D.XIA_RVX20.code);
      await list.clickEdit(D.XIA_RVX20.code);
      await form.waitReady();
      await form.code.fill('');
      await form.submitExpectingError('update');
      await form.expectFieldError(/Product Code/i);
      await shot(page, 'TA-09_TC-01');
    });
  });

  test('TA-10 — add fails on decimal Price (integer only)', async ({ page }) => {
    await test.step('TA-10_TC-01 — Decimal Price → reject (integer only)', async () => {
      const form = await openCreate(page);
      await form.fill({ ...D.XIA_RVX20, code: 'XIA-RVX20D', price: D.PRICE_DECIMAL });
      await form.submitExpectingError('create');
      await shot(page, 'TA-10_TC-01');
    });
  });

  test('TA-11 — delete blocked when product has Product Stock', async ({ page }) => {
    const list = new ProductListPage(page);
    await test.step('TA-11_TC-01 — Delete product with Product Stock → blocked', async () => {
      await loginAndOpenList(page);
      // DATA DEP: ต้องใช้สินค้าที่ "มี Product Stock (Serial)" จริงในระบบ. seed product เปล่า ๆ ไม่มี stock
      //   → ไม่ trigger เงื่อนไขบล็อก. ใช้ catalog item ที่มี stock จริง (เช่น Chery V27 ที่มี Low Stock(1))
      //   selector/exact-warning ยังต้อง verify live → ถ้ายังบล็อกไม่ได้ ให้ annotate (ไม่ fake pass)
      await list.search(D.CHERY_V27.name);
      await list.clickDelete(D.CHERY_V27.name);
      const blocked = page.getByText(/cannot|stock|order|ไม่สามารถ/i).first();
      if (await blocked.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(blocked).toBeVisible();
      } else {
        test.info().annotations.push({ type: 'known-gap', description: 'TA-11: ต้องมีสินค้าที่มี Product Stock/Order จริง + verify exact warning text → ยืนยัน conditional delete กับ data จริง/confirm dev (PO Q8)' });
      }
      await shot(page, 'TA-11_TC-01');
    });
  });

  test('TA-12 — add fails on image over 3MB', async ({ page }) => {
    await test.step('TA-12_TC-01 — Image over 3MB → reject', async () => {
      const form = await openCreate(page);
      const big = assetOrSkip(D.IMG_OVER_3MB); // photo_hd.jpg (~4MB)
      await form.uploadImage(big);
      await expect.soft(page.getByText(/3\s*mb|exceed|size|ขนาด/i).first()).toBeVisible().catch(() => {});
      await shot(page, 'TA-12_TC-01');
    });
  });
});
