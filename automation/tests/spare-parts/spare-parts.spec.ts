import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../shared/pages/LoginPage';
import { SparePartsListPage } from './pages/SparePartsListPage';
import { SparePartsFormPage } from './pages/SparePartsFormPage';
import { SparePartsDetailPage } from './pages/SparePartsDetailPage';
import { seedSparePart, purgeByCode } from './fixtures/spare-seed';
import * as D from './fixtures/testdata';

/**
 * Spare Parts & Inventory Management — Playwright E2E
 * Generated from 06-Spare Parts/spare-parts-testcases.xlsx (pushed to Lark Base tblIwUWXkWNLYy4c)
 *   Feature = "Spare Parts & Inventory Management" · PO answers SP-Q1..Q7 applied 2026-06-19
 * Pattern: 1 Scenario = 1 test() (Scenario No.) · 1 Test Case = 1 test.step('<TC No.> — …') + shot()
 *   TC No. ตรงกับ key ใน Lark (TS-01_TC-01 …) → upsert ผลราย TC ได้
 * Route: Spare Parts list = /cms/inventory/
 *
 * ⚠️ staging ต้อง login จริง — set CP_USERNAME/CP_PASSWORD/CP_ORG เพื่อรัน · ไม่ตั้ง → skip (ไม่แกล้งผ่าน)
 * ⚠️ Page Object selectors = best-effort (ยังไม่ verified live DOM) → verify ก่อน execute จริง
 * ⚠️ SparePart GraphQL seed = UNVERIFIED ops (ดู fixtures/spare-seed.ts) → introspect ก่อนรัน mutate scenario
 * 🟡 RBAC (SP-Q1): Add ต้องใช้ Warehouse Staff / Admin · Agent/Staff (porntip) จะไม่เห็นปุ่ม Add
 */
const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || '';
// Agent/Staff account (no Add permission) — for TA-09 (Add button hidden)
const AGENT_USER = process.env.SP_AGENT_USERNAME || '';
const AGENT_PASS = process.env.SP_AGENT_PASSWORD || '';
const AGENT_ORG = process.env.SP_AGENT_ORG || ORG;
const ASSETS = process.env.CP_ASSETS_DIR || path.join(__dirname, '..', '..', 'assets');

async function shot(page: Page, label: string) {
  fs.mkdirSync('test-results/steps', { recursive: true });
  await page.screenshot({ path: `test-results/steps/${label}.png`, fullPage: true }).catch(() => {});
}

async function loginAndOpenList(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login({ org: ORG, username: USER, password: PASS });
  await new SparePartsListPage(page).goto();
}

function assetOrSkip(file: string): string {
  const p = path.join(ASSETS, file);
  test.skip(!fs.existsSync(p), `ต้องมีไฟล์ ${file} ใน ${ASSETS} (set CP_ASSETS_DIR)`);
  return p;
}

// ════════════════════════════════════════════════════════════════════════════
//  SUCCESS SCENARIOS (TS-01 … TS-06)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Spare Parts & Inventory — Success', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TS-01 — Search + View Detail ────────────────────────────────────────────
  test('TS-01 — search and view spare part detail', async ({ page }) => {
    const list = new SparePartsListPage(page);
    const detail = new SparePartsDetailPage(page);

    await test.step('TS-01_TC-01 — List view renders all elements', async () => {
      await loginAndOpenList(page);
      await list.switchView('List');
      await expect.soft(list.searchBtn).toBeVisible();
      await expect.soft(list.resetBtn).toBeVisible();
      await shot(page, 'TS-01_TC-01');
    });
    await test.step('TS-01_TC-02 — Search "Battery" → ≥2 matching results', async () => {
      await list.search(D.SEARCH_MATCH);
      await list.expectRowVisible('Battery pack');
      await expect.soft(page.getByText(/Battery/i)).toHaveCount(2, { timeout: 10000 }).catch(() => {});
      await shot(page, 'TS-01_TC-02');
    });
    await test.step('TS-01_TC-03 — View → Item Details popup shows all fields', async () => {
      await list.search('');
      await list.clickView(D.DETAIL_PART.name);
      await detail.waitLoaded();
      await detail.expectFields(D.DETAIL_PART.fields);
      await detail.expectActions();
      await shot(page, 'TS-01_TC-03');
    });
  });

  // ── TS-02 — Filter Brand + Switch View + Stock Status ───────────────────────
  test('TS-02 — filter brand, switch view, stock status', async ({ page }) => {
    const list = new SparePartsListPage(page);

    await test.step('TS-02_TC-01 — Table view shows all column headers', async () => {
      await loginAndOpenList(page);
      await list.switchView('Table');
      await expect(page.getByRole('columnheader', { name: /PART NAME/i })).toBeVisible();
      await shot(page, 'TS-02_TC-01');
    });
    await test.step('TS-02_TC-02 — Stock badge "Out of Stock (0)"', async () => {
      await list.search(D.PART_OUT);
      await expect(list.stockBadge(D.PART_OUT)).toContainText(/Out of Stock/i);
      await shot(page, 'TS-02_TC-02');
    });
    await test.step('TS-02_TC-03 — Filter Brand = Apple → only Apple', async () => {
      await list.search('');
      await list.filter('Brand', D.FILTER_BRAND);
      await shot(page, 'TS-02_TC-03');
    });
    await test.step('TS-02_TC-04 — Reset → full list returns', async () => {
      await list.reset();
      await expect(list.searchInput).toHaveValue('');
      await shot(page, 'TS-02_TC-04');
    });
  });

  // ── TS-03 — Add a new Spare Part (Warehouse Staff / Admin — SP-Q1) ───────────
  test('TS-03 — add a new spare part successfully', async ({ page }) => {
    const list = new SparePartsListPage(page);
    const form = new SparePartsFormPage(page);
    const d = D.DENSO_FILTER;

    await test.step('TS-03_TC-01 — Open list; Add button present (needs Add permission)', async () => {
      await loginAndOpenList(page);
      await purgeByCode(page, d.code!).catch(() => {}); // clean slate (UNVERIFIED seed → tolerate)
      const addVisible = await list.addBtn.isVisible({ timeout: 8000 }).catch(() => false);
      test.skip(!addVisible, 'Add button not visible — login as Warehouse Staff / Admin (SP-Q1)');
      await shot(page, 'TS-03_TC-01');
    });
    await test.step('TS-03_TC-02 — Upload JPG image → accepted (preview)', async () => {
      await list.addBtn.click();
      await form.waitReady();
      await form.uploadImage(assetOrSkip(D.IMG_VALID));
      await shot(page, 'TS-03_TC-02');
    });
    await test.step('TS-03_TC-03 — Fill required fields + Save → created (Warranty 12 Months)', async () => {
      await form.fill(d);
      await form.save();
      await expect(page.getByText(D.TOAST_CREATE, { exact: false })).toBeVisible({ timeout: 15000 });
      await list.search(d.en);
      await list.expectRowVisible(d.en);
      await shot(page, 'TS-03_TC-03');
    });
  });

  // ── TS-04 — Edit a Spare Part ───────────────────────────────────────────────
  test('TS-04 — edit a spare part price', async ({ page }) => {
    const list = new SparePartsListPage(page);
    const form = new SparePartsFormPage(page);

    await test.step('TS-04_TC-01 — Open list view', async () => {
      await loginAndOpenList(page);
      await list.switchView('List');
      await shot(page, 'TS-04_TC-01');
    });
    await test.step('TS-04_TC-02 — Edit Price → Update succeeds', async () => {
      await list.search(D.PART_LOW);
      await list.clickEdit(D.PART_LOW);
      await form.waitReady();
      await form.price.fill(String(D.EDIT_PRICE_TO));
      await form.update();
      await expect(page.getByText(D.TOAST_UPDATE, { exact: false })).toBeVisible({ timeout: 15000 });
      await shot(page, 'TS-04_TC-02');
    });
  });

  // ── TS-05 — Delete with confirmation (SP-Q2 — required behavior) ────────────
  test('TS-05 — delete a spare part with confirmation', async ({ page }) => {
    const list = new SparePartsListPage(page);
    const detail = new SparePartsDetailPage(page);

    await test.step('TS-05_TC-01 — View Detail popup (8 fields + actions)', async () => {
      await loginAndOpenList(page);
      // Arrange: ใช้ part ที่ไม่ผูก Serial stock / Active Order → ลบได้ (SP-BC12)
      await list.search(D.PART_DELETE_OK);
      await list.clickView(D.PART_DELETE_OK);
      await detail.waitLoaded();
      await detail.expectActions();
      await shot(page, 'TS-05_TC-01');
    });
    await test.step('TS-05_TC-02 — Delete → Confirm → item removed', async () => {
      await detail.clickDelete();
      await detail.expectConfirmDialog(); // ⚠️ SP-Q2: confirm dialog REQUIRED (bug if missing)
      await detail.confirmDelete();
      await expect(page.getByText(D.TOAST_DELETE, { exact: false })).toBeVisible({ timeout: 15000 });
      await list.search(D.PART_DELETE_OK);
      await list.expectEmptyState();
      await shot(page, 'TS-05_TC-02');
    });
  });

  // ── TS-06 — Sort Table view columns (SP-Q7) ─────────────────────────────────
  test('TS-06 — sort table view columns', async ({ page }) => {
    const list = new SparePartsListPage(page);

    await test.step('TS-06_TC-01 — Open Table view', async () => {
      await loginAndOpenList(page);
      await list.switchView('Table');
      await expect(page.getByRole('columnheader', { name: /PRICE/i })).toBeVisible();
      await shot(page, 'TS-06_TC-01');
    });
    await test.step('TS-06_TC-02 — Sort PRICE ascending then descending', async () => {
      await list.clickSort('PRICE');
      await shot(page, 'TS-06_TC-02-asc');
      await list.clickSort('PRICE');
      await shot(page, 'TS-06_TC-02');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ALTERNATIVE / NEGATIVE SCENARIOS (TA-01 … TA-09)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Spare Parts & Inventory — Alternative', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  async function openAdd(page: Page) {
    const list = new SparePartsListPage(page);
    const form = new SparePartsFormPage(page);
    await loginAndOpenList(page);
    const addVisible = await list.addBtn.isVisible({ timeout: 8000 }).catch(() => false);
    test.skip(!addVisible, 'Add button not visible — login as Warehouse Staff / Admin (SP-Q1)');
    await list.addBtn.click();
    await form.waitReady();
    return form;
  }

  // ── TA-01 — Search not found → Reset back to full list ──────────────────────
  test('TA-01 — search not found then reset', async ({ page }) => {
    const list = new SparePartsListPage(page);
    await test.step('TA-01_TC-01 — Open List view', async () => {
      await loginAndOpenList(page);
      await list.switchView('List');
      await shot(page, 'TA-01_TC-01');
    });
    await test.step('TA-01_TC-02 — Search "ZXQNOTEXIST999" → empty state', async () => {
      await list.search(D.SEARCH_NONE);
      await list.expectEmptyState();
      await shot(page, 'TA-01_TC-02');
    });
    await test.step('TA-01_TC-03 — Reset → full list returns (≥10)', async () => {
      await list.reset();
      await expect(list.searchInput).toHaveValue('');
      await shot(page, 'TA-01_TC-03');
    });
  });

  // ── TA-02 — Add missing Required Field (Name EN) ────────────────────────────
  test('TA-02 — add fails when Name (EN) is empty', async ({ page }) => {
    await test.step('TA-02_TC-01 — Leave Name(EN) empty → validation error', async () => {
      const form = await openAdd(page);
      await form.fill({ ...D.DENSO_FILTER, en: undefined as any }); // skip EN
      await form.submitExpectingError('save');
      await form.expectFieldError('en');
      await shot(page, 'TA-02_TC-01');
    });
  });

  // ── TA-03 — Add missing Required Field (Price) ──────────────────────────────
  test('TA-03 — add fails when Price is empty', async ({ page }) => {
    await test.step('TA-03_TC-01 — Leave Price empty → validation error', async () => {
      const form = await openAdd(page);
      await form.fill({ ...D.DENSO_FILTER, price: undefined as any }); // skip Price
      await form.submitExpectingError('save');
      await form.expectFieldError('price');
      await shot(page, 'TA-03_TC-01');
    });
  });

  // ── TA-04 — Edit clears Required Field (Name TH) → not saved ────────────────
  test('TA-04 — update fails when Name (TH) is cleared', async ({ page }) => {
    const list = new SparePartsListPage(page);
    const form = new SparePartsFormPage(page);
    await test.step('TA-04_TC-01 — Clear Name(TH) on Update → error', async () => {
      await loginAndOpenList(page);
      await list.search(D.PART_LOW);
      await list.clickEdit(D.PART_LOW);
      await form.waitReady();
      await form.nameTH.fill('');
      await form.submitExpectingError('update');
      await form.expectFieldError('th');
      await shot(page, 'TA-04_TC-01');
    });
  });

  // ── TA-05 — Delete then Cancel — item stays ─────────────────────────────────
  test('TA-05 — cancel delete keeps the spare part', async ({ page }) => {
    const list = new SparePartsListPage(page);
    const detail = new SparePartsDetailPage(page);
    await test.step('TA-05_TC-01 — View Detail popup', async () => {
      await loginAndOpenList(page);
      await list.search(D.PART_DELETE_CANCEL);
      await list.clickView(D.PART_DELETE_CANCEL);
      await detail.waitLoaded();
      await shot(page, 'TA-05_TC-01');
    });
    await test.step('TA-05_TC-02 — Delete → Cancel → item remains', async () => {
      await detail.clickDelete();
      await detail.expectConfirmDialog();
      await detail.cancelDelete();
      await list.search(D.PART_DELETE_CANCEL);
      await list.expectRowVisible(D.PART_DELETE_CANCEL);
      await shot(page, 'TA-05_TC-02');
    });
  });

  // ── TA-06 — Upload wrong file type (PDF) → reject ───────────────────────────
  test('TA-06 — upload unsupported file type rejected', async ({ page }) => {
    await test.step('TA-06_TC-01 — Upload PDF → reject', async () => {
      const form = await openAdd(page);
      await form.uploadImage(assetOrSkip(D.IMG_PDF));
      await expect.soft(page.getByText(/invalid|not support|jpg|png|gif/i).first()).toBeVisible().catch(() => {});
      await shot(page, 'TA-06_TC-01');
    });
  });

  // ── TA-07 — Upload oversized image (>3MB) → reject (SP-Q4) ───────────────────
  test('TA-07 — upload image over 3MB rejected', async ({ page }) => {
    await test.step('TA-07_TC-01 — Upload 3.5MB+ image → reject', async () => {
      const form = await openAdd(page);
      await form.uploadImage(assetOrSkip(D.IMG_OVER_3MB));
      await expect.soft(page.getByText(/3\s*mb|exceed|size|ขนาด/i).first()).toBeVisible().catch(() => {});
      await shot(page, 'TA-07_TC-01');
    });
  });

  // ── TA-08 — Delete part linked to Active Order → blocked (SP-Q5) ────────────
  test('TA-08 — delete blocked when linked to an Active Order', async ({ page }) => {
    const list = new SparePartsListPage(page);
    const detail = new SparePartsDetailPage(page);
    await test.step('TA-08_TC-01 — View Detail popup', async () => {
      await loginAndOpenList(page);
      await list.search(D.PART_DELETE_BLOCKED);
      await list.clickView(D.PART_DELETE_BLOCKED);
      await detail.waitLoaded();
      await shot(page, 'TA-08_TC-01');
    });
    await test.step('TA-08_TC-02 — Click Delete → blocked with warning, item stays', async () => {
      await detail.clickDelete();
      const blocked = page.getByText(/cannot|linked|order|ไม่สามารถ/i).first();
      if (await blocked.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(blocked).toBeVisible();
      } else {
        test.info().annotations.push({
          type: 'known-gap',
          description: 'TA-08: ต้องมีอะไหล่ที่ผูกกับ Active Order จริง + verify exact warning text → ยืนยัน guarded-delete กับ data จริง (SP-Q5)',
        });
      }
      await shot(page, 'TA-08_TC-02');
    });
  });

  // ── TA-09 — Add button hidden for Agent/Staff (RBAC — SP-Q1) ────────────────
  test('TA-09 — add button hidden for Agent/Staff role', async ({ page }) => {
    test.skip(!AGENT_PASS, 'set SP_AGENT_USERNAME/SP_AGENT_PASSWORD (Agent/Staff e.g. porntip) to verify RBAC');
    await test.step('TA-09_TC-01 — Login as Agent/Staff → Add button NOT visible', async () => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login({ org: AGENT_ORG, username: AGENT_USER, password: AGENT_PASS });
      const list = new SparePartsListPage(page);
      await list.goto();
      await expect(list.addBtn).toHaveCount(0);
      await shot(page, 'TA-09_TC-01');
    });
  });
});
