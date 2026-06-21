import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import { LoginPage } from '../../shared/pages/LoginPage';
import { ProductStockPage } from './pages/ProductStockPage';
import { purgeProductStock } from './fixtures/product-stock-seed';
import * as D from './fixtures/testdata';

/**
 * Product Stock Management — Playwright E2E
 * Generated from 05-Product Stock/product-stock-test-design.md + Lark Base (PO answers Q1–Q12, all resolved).
 * Pattern: 1 Scenario = 1 test() (TS-/TA-/UI- id) · 1 Test Case = 1 test.step('<TC No.> — …') + shot()
 * Reuse: shared/LoginPage · Feature POM pages/ProductStockPage.ts
 * API-first Arrange + Teardown: fixtures/product-stock-seed.ts (✅ DeleteProductStock = hard delete, no SIT residue)
 *
 * ⚠️ staging needs real login — set CP_USERNAME/CP_PASSWORD/CP_ORG to run (unset → skip, never fake-pass).
 *
 * RUN vs FIXME (honest — not faked green):
 *   ▶ RUN (gated on CP_PASSWORD): Add-flow registry + validation + RBAC(Warehouse Staff) + master dropdowns
 *           TS-01,02,03,09(staff),10,11 · TA-01..08
 *           ⚠️ modal/field selectors built from design labels — NOT yet DOM-probed (see ProductStockPage header)
 *   ⏸ FIXME (need work before enabling):
 *           - TS-04..08 + UI-01: stock-badge / notification-bell DOM not probed + `Item` JSON seed shape
 *             unverified (CreateProductStock needs live-token confirm — see product-stock-seed.ts caveats)
 *           - TS-09_TC-02 (Admin) / TA-08 (Agent): need per-role accounts (CP_ADMIN_*, CP_AGENT_*)
 *           - TA-09: cross-feature (Order Pick) + ⚠️ known bug "Research Stock Fail"
 */
const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || '';
const ADMIN_PASS = process.env.CP_ADMIN_PASSWORD || '';
const AGENT_PASS = process.env.CP_AGENT_PASSWORD || '';
// ⚠️ Add Product Stock is role-gated (PO Q7): only Spare Parts Warehouse Staff / Admin see it.
// The default CP_* account (surveyed role) does NOT see the Add button (verified live 2026-06-20).
// Set CP_WAREHOUSE_USERNAME/PASSWORD to a Warehouse-Staff account to run the Add-flow tests.
const WH_USER = process.env.CP_WAREHOUSE_USERNAME || USER;
const WH_PASS = process.env.CP_WAREHOUSE_PASSWORD || PASS;

async function shot(page: Page, label: string) {
  fs.mkdirSync('test-results/steps', { recursive: true });
  await page.screenshot({ path: `test-results/steps/${label}.png`, fullPage: true }).catch(() => {});
}

async function loginAsStaff(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login({ org: ORG, username: WH_USER, password: WH_PASS });
}

/** skip the rest of a test if the logged-in account cannot add stock (role-gated — PO Q7) */
async function requireAdd(ps: ProductStockPage) {
  test.skip(!(await ps.canAdd()), 'account has no Add Product Stock permission (PO Q7) — set CP_WAREHOUSE_USERNAME/PASSWORD');
}

// ════════════════════════════════════════════════════════════════════════════
//  SUCCESS SCENARIOS
// ════════════════════════════════════════════════════════════════════════════
test.describe('Product Stock — Success', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TS-01 — Add Product Stock with Manufacturing Warranty (full happy path) ──
  test('TS-01 — user can add product stock with Manufacturing Warranty', async ({ page }) => {
    const ps = new ProductStockPage(page);

    await test.step('TS-01_TC-01 — Open /cms/products/stock → list shows Add button + columns', async () => {
      await loginAsStaff(page);
      await purgeProductStock(page, D.PRODUCT_NAME, D.SN_NEW); // Arrange: SN not a duplicate (idempotent)
      await ps.gotoList();
      await ps.expectListReady();
      await shot(page, 'TS-01_TC-01');
    });
    await test.step('TS-01_TC-02 — Click "Add Product Stock" → modal opens with required fields', async () => {
      await requireAdd(ps);
      await ps.openAddModal();
      await expect(ps.serialNo).toBeVisible();
      await expect(ps.createBtn).toBeVisible();
      await shot(page, 'TS-01_TC-02');
    });
    await test.step('TS-01_TC-03 — Fill all fields incl. MW → Create → success toast; default Status R001/New', async () => {
      await ps.fillAddForm(D.NEW_UNIT);
      await ps.submitCreate();
      await ps.expectCreateToast(D.TOAST_CREATE);
      await ps.search(D.SN_NEW);
      await expect(ps.row(D.SN_NEW)).toBeVisible();
      // PO Q6: new unit default Status = R001 (New)
      await expect(ps.row(D.SN_NEW)).toContainText(new RegExp(`${D.DEFAULT_STATUS_CODE}|${D.DEFAULT_STATUS_LABEL}`, 'i'));
      await shot(page, 'TS-01_TC-03');
    });
  });

  // ── TS-02 — Add without Manufacturing Warranty (optional field) ──
  test('TS-02 — user can add product stock without Manufacturing Warranty', async ({ page }) => {
    const ps = new ProductStockPage(page);
    const sn = 'MB2026GLC-0008';

    await test.step('TS-02_TC-01 — Fill required fields only (no MW) → Create succeeds', async () => {
      await loginAsStaff(page);
      await purgeProductStock(page, D.PRODUCT_NAME, sn);
      await ps.gotoList();
      await requireAdd(ps);
      await ps.openAddModal();
      await ps.fillAddForm({ serialNumber: sn, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE }); // mfw omitted
      await ps.submitCreate();
      await ps.expectCreateToast(D.TOAST_CREATE);
      await shot(page, 'TS-02_TC-01');
    });
  });

  // ── TS-03 — Valid SN format + non-duplicate → Create success ──
  test('TS-03 — valid serial format + no duplicate → create success', async ({ page }) => {
    const ps = new ProductStockPage(page);

    await test.step('TS-03_TC-01 — Enter alphanumeric+dash SN, non-duplicate → Create', async () => {
      await loginAsStaff(page);
      await purgeProductStock(page, D.PRODUCT_NAME, D.SN_VALID_FORMAT);
      await ps.gotoList();
      await requireAdd(ps);
      await ps.openAddModal();
      await ps.fillAddForm({ serialNumber: D.SN_VALID_FORMAT, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE });
      await ps.submitCreate();
      await ps.expectCreateToast(D.TOAST_CREATE);
      await shot(page, 'TS-03_TC-01');
    });
  });

  // ── TS-04 — Stock badge at all threshold boundaries (BVA 0/1/4/5/6) ──
  test('TS-04 — stock status badge at all threshold boundaries', async ({ page }) => {
    test.fixme(true, 'badge DOM not probed + Item JSON seed shape unverified (qty setup) — see ProductStockPage / product-stock-seed.ts');
    const ps = new ProductStockPage(page);
    await test.step('TS-04_TC-05 — qty 6 → In Stock', async () => { await loginAsStaff(page); await ps.gotoInventory(); await expect(ps.badge(D.PART_LOW, 'In Stock')).toBeVisible(); await shot(page, 'TS-04_TC-05'); });
    await test.step('TS-04_TC-04 — qty 5 → Low Stock (5)', async () => { await expect(ps.badge(D.PART_LOW, 'Low Stock', 5)).toBeVisible(); await shot(page, 'TS-04_TC-04'); });
    await test.step('TS-04_TC-03 — qty 4 → Low Stock (4)', async () => { await expect(ps.badge(D.PART_LOW, 'Low Stock', 4)).toBeVisible(); await shot(page, 'TS-04_TC-03'); });
    await test.step('TS-04_TC-02 — qty 1 → Low Stock (1)', async () => { await expect(ps.badge(D.PART_LOW, 'Low Stock', 1)).toBeVisible(); await shot(page, 'TS-04_TC-02'); });
    await test.step('TS-04_TC-01 — qty 0 → Out of Stock (0)', async () => { await expect(ps.badge(D.PART_OUT, 'Out of Stock', 0)).toBeVisible(); await shot(page, 'TS-04_TC-01'); });
  });

  // ── TS-05 — Low Stock notification full flow (In → Low → badge + bell) ──
  test('TS-05 — low stock triggers badge and realtime notification', async ({ page }) => {
    test.fixme(true, 'notification-bell DOM + qty transition (Item seed) unverified');
    const ps = new ProductStockPage(page);
    await test.step('TS-05_TC-01 — System reduces qty In(6)→Low(5); Low Stock notification created', async () => { await loginAsStaff(page); await shot(page, 'TS-05_TC-01'); });
    await test.step('TS-05_TC-02 — "Low Stock" badge visible on /cms/inventory', async () => { await ps.gotoInventory(); await expect(ps.badge(D.PART_LOW, 'Low Stock')).toBeVisible(); await shot(page, 'TS-05_TC-02'); });
    await test.step('TS-05_TC-03 — Notification bell shows Low Stock entry', async () => { await ps.openBell(); await expect(page.getByText(/low stock/i).first()).toBeVisible(); await shot(page, 'TS-05_TC-03'); });
  });

  // ── TS-06 — Out of Stock and restock recovery ──
  test('TS-06 — out of stock notified; badge clears after restock', async ({ page }) => {
    test.fixme(true, 'badge/restock DOM + qty transition (Item seed) unverified');
    const ps = new ProductStockPage(page);
    await test.step('TS-06_TC-01 — qty Low(1)→Out(0); Out of Stock notification', async () => { await loginAsStaff(page); await shot(page, 'TS-06_TC-01'); });
    await test.step('TS-06_TC-02 — "Out of Stock" badge visible on /cms/inventory', async () => { await ps.gotoInventory(); await expect(ps.badge(D.PART_OUT, 'Out of Stock', 0)).toBeVisible(); await shot(page, 'TS-06_TC-02'); });
    await test.step('TS-06_TC-03 — Restock Out(0)→In(10); badge removed', async () => { await expect(ps.badge(D.PART_OUT, 'Out of Stock')).toBeHidden(); await shot(page, 'TS-06_TC-03'); });
  });

  // ── TS-07 — View Stock Detail Modal ──
  test('TS-07 — stock detail modal shows Available / Status / unit table', async ({ page }) => {
    test.fixme(true, 'stock-detail icon + modal DOM not probed');
    const ps = new ProductStockPage(page);
    await test.step('TS-07_TC-01 — Click stock detail icon → modal opens with correct content', async () => {
      await loginAsStaff(page);
      await ps.gotoInventory();
      await ps.openStockDetail(D.PART_LOW);
      await expect(page.getByText(new RegExp(`Spare Parts Stock: ${D.PART_LOW}`, 'i'))).toBeVisible();
      await shot(page, 'TS-07_TC-01');
    });
  });

  // ── TS-08 — Notification type filter ──
  test('TS-08 — notification type filter narrows the list', async ({ page }) => {
    test.fixme(true, 'notification-bell + filter DOM not probed');
    const ps = new ProductStockPage(page);
    await test.step('TS-08_TC-01 — Open bell → All Types shown', async () => { await loginAsStaff(page); await ps.openBell(); await shot(page, 'TS-08_TC-01'); });
    await test.step('TS-08_TC-02 — Filter "Low Stock" → only Low Stock entries shown', async () => { await ps.filterNotification('Low Stock'); await expect(page.getByText(/out of stock/i)).toHaveCount(0); await shot(page, 'TS-08_TC-02'); });
  });

  // ── TS-09 — Authorized roles see Add button (RBAC positive) ──
  test('TS-09 — authorized roles (Warehouse Staff / Admin) see Add button', async ({ page }) => {
    const ps = new ProductStockPage(page);
    await test.step('TS-09_TC-01 — Warehouse Staff → "Add Product Stock" visible', async () => {
      test.skip(!process.env.CP_WAREHOUSE_PASSWORD, 'set CP_WAREHOUSE_USERNAME/PASSWORD (Warehouse Staff) — default account is role-gated (PO Q7)');
      await loginAsStaff(page);
      await ps.gotoList();
      await expect(ps.addBtn).toBeVisible();
      await shot(page, 'TS-09_TC-01');
    });
    await test.step('TS-09_TC-02 — Admin → "Add Product Stock" visible', async () => {
      test.skip(!ADMIN_PASS, 'set CP_ADMIN_PASSWORD (+ CP_ADMIN_USERNAME) to verify Admin role');
      const login = new LoginPage(page);
      await login.goto();
      await login.login({ org: ORG, username: process.env.CP_ADMIN_USERNAME || 'admin', password: ADMIN_PASS });
      await ps.gotoList();
      await expect(ps.addBtn).toBeVisible();
      await shot(page, 'TS-09_TC-02');
    });
  });

  // ── TS-10 — MW equal to Registered Date (BVA boundary — valid) ──
  test('TS-10 — Manufacturing Warranty equal to Registered Date is accepted', async ({ page }) => {
    const ps = new ProductStockPage(page);
    const sn = 'MB2026GLC-0010';
    await test.step('TS-10_TC-01 — MW = Registered Date (same day) → Create success', async () => {
      await loginAsStaff(page);
      await purgeProductStock(page, D.PRODUCT_NAME, sn);
      await ps.gotoList();
      await requireAdd(ps);
      await ps.openAddModal();
      await ps.fillAddForm({ serialNumber: sn, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE, mfw: D.MW_EQUAL });
      await ps.submitCreate();
      await ps.expectCreateToast(D.TOAST_CREATE);
      await shot(page, 'TS-10_TC-01');
    });
  });

  // ── TS-11 — Serial No. at max-length boundary (BVA 99 and 100 chars) ──
  test('TS-11 — serial number at max-length boundary (99 / 100 chars) accepted', async ({ page }) => {
    const ps = new ProductStockPage(page);
    await test.step('TS-11_TC-01 — SN 99 chars → accepted (below max)', async () => {
      await loginAsStaff(page);
      await purgeProductStock(page, D.PRODUCT_NAME, D.SN_99);
      await ps.gotoList();
      await requireAdd(ps);
      await ps.openAddModal();
      await ps.fillAddForm({ serialNumber: D.SN_99, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE });
      await ps.submitCreate();
      await ps.expectCreateToast(D.TOAST_CREATE);
      await shot(page, 'TS-11_TC-01');
    });
    await test.step('TS-11_TC-02 — SN 100 chars → accepted (at max boundary)', async () => {
      await purgeProductStock(page, D.PRODUCT_NAME, D.SN_100);
      await ps.gotoList();
      await requireAdd(ps);
      await ps.openAddModal();
      await ps.fillAddForm({ serialNumber: D.SN_100, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE });
      await ps.submitCreate();
      await ps.expectCreateToast(D.TOAST_CREATE);
      await shot(page, 'TS-11_TC-02');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ALTERNATIVE / NEGATIVE SCENARIOS
// ════════════════════════════════════════════════════════════════════════════
test.describe('Product Stock — Alternative', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  async function openAdd(page: Page): Promise<ProductStockPage> {
    const ps = new ProductStockPage(page);
    await loginAsStaff(page);
    await ps.gotoList();
    await requireAdd(ps);
    await ps.openAddModal();
    return ps;
  }

  // ── TA-01 — Serial No. empty → field error ──
  test('TA-01 — empty Serial No. → field error; form not submitted', async ({ page }) => {
    await test.step('TA-01_TC-01 — Leave Serial No. empty → Create', async () => {
      const ps = await openAdd(page);
      await ps.fillAddForm({ product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE, mfw: D.MW_AFTER }); // SN omitted
      await ps.submitCreate();
      await ps.expectFieldError(ps.serialNo);
      await shot(page, 'TA-01_TC-01');
    });
  });

  // ── TA-02 — Product / Store / Registered Date empty → respective field errors ──
  test('TA-02 — empty Product / Store / Registered Date → field errors', async ({ page }) => {
    await test.step('TA-02_TC-01 — Product empty → field error', async () => {
      const ps = await openAdd(page);
      await ps.fillAddForm({ serialNumber: D.SN_NEW, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE });
      await ps.submitCreate();
      await ps.expectFieldError(ps.product);
      await shot(page, 'TA-02_TC-01');
    });
    await test.step('TA-02_TC-02 — Store empty → field error', async () => {
      const ps = new ProductStockPage(page);
      await ps.gotoList(); await requireAdd(ps); await ps.openAddModal();
      await ps.fillAddForm({ serialNumber: D.SN_NEW, product: D.PRODUCT_NAME, registerDate: D.REGISTERED_DATE });
      await ps.submitCreate();
      await ps.expectFieldError(ps.store);
      await shot(page, 'TA-02_TC-02');
    });
    await test.step('TA-02_TC-03 — Registered Date empty → field error', async () => {
      const ps = new ProductStockPage(page);
      await ps.gotoList(); await requireAdd(ps); await ps.openAddModal();
      await ps.fillAddForm({ serialNumber: D.SN_NEW, product: D.PRODUCT_NAME, store: D.STORE_NAME });
      await ps.submitCreate();
      await ps.expectFieldError(ps.registeredDate);
      await shot(page, 'TA-02_TC-03');
    });
  });

  // ── TA-03 — Duplicate Serial No. → duplicate error ──
  test('TA-03 — duplicate Serial No. → error; unit not created', async ({ page }) => {
    await test.step('TA-03_TC-01 — Enter existing SN "100003-002" → duplicate error', async () => {
      const ps = await openAdd(page);
      await ps.fillAddForm({ serialNumber: D.SN_DUPLICATE, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE });
      await ps.submitCreate();
      await ps.expectDuplicateError();
      await shot(page, 'TA-03_TC-01');
    });
  });

  // ── TA-04 — SN with spaces/special chars → invalid ──
  test('TA-04 — Serial No. with spaces/special chars → invalid', async ({ page }) => {
    await test.step('TA-04_TC-01 — Enter SN "MB 2026 #@!" → invalid; form not submitted', async () => {
      const ps = await openAdd(page);
      await ps.fillAddForm({ serialNumber: D.SN_INVALID_FORMAT, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE });
      await ps.submitCreate();
      await ps.expectFieldError(ps.serialNo);
      await shot(page, 'TA-04_TC-01');
    });
  });

  // ── TA-05 — SN 101 chars (over max) → field error ──
  test('TA-05 — Serial No. 101 chars (over max) → invalid', async ({ page }) => {
    await test.step('TA-05_TC-01 — Enter 101-char SN → invalid (exceeds max 100)', async () => {
      const ps = await openAdd(page);
      await ps.fillAddForm({ serialNumber: D.SN_101, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE });
      await ps.submitCreate();
      await ps.expectFieldError(ps.serialNo);
      await shot(page, 'TA-05_TC-01');
    });
  });

  // ── TA-06 — MW before Registered Date → date validation error ──
  test('TA-06 — Manufacturing Warranty before Registered Date → validation error', async ({ page }) => {
    await test.step('TA-06_TC-01 — Set MW "2025-01-01" before Registered "2026-06-13" → error', async () => {
      const ps = await openAdd(page);
      await ps.fillAddForm({ serialNumber: D.SN_NEW, product: D.PRODUCT_NAME, store: D.STORE_NAME, registerDate: D.REGISTERED_DATE, mfw: D.MW_BEFORE });
      await ps.submitCreate();
      await ps.expectFieldError(ps.manufacturingWarranty);
      await shot(page, 'TA-06_TC-01');
    });
  });

  // ── TA-07 — Non-master product/store → no option ──
  test('TA-07 — non-master Product / Store → no matching option', async ({ page }) => {
    await test.step('TA-07_TC-01 — Type "Tesla Model Z" (not in master) → no option', async () => {
      const ps = await openAdd(page);
      await ps.expectNoMasterOption(ps.product, D.PRODUCT_NOT_IN_MASTER);
      await shot(page, 'TA-07_TC-01');
    });
    await test.step('TA-07_TC-02 — Type non-master store name → no option', async () => {
      const ps = new ProductStockPage(page);
      await ps.expectNoMasterOption(ps.store, D.STORE_NOT_IN_MASTER);
      await shot(page, 'TA-07_TC-02');
    });
  });

  // ── TA-08 — Agent role → Add button not rendered ──
  test('TA-08 — Agent role → "Add Product Stock" not rendered', async ({ page }) => {
    test.skip(!AGENT_PASS, 'set CP_AGENT_PASSWORD (+ CP_AGENT_USERNAME) to verify Agent role cannot add');
    const ps = new ProductStockPage(page);
    await test.step('TA-08_TC-01 — Login as Agent → Add button hidden', async () => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login({ org: ORG, username: process.env.CP_AGENT_USERNAME || 'agent', password: AGENT_PASS });
      await ps.gotoList();
      await expect(ps.addBtn).toHaveCount(0);
      await shot(page, 'TA-08_TC-01');
    });
  });

  // ── TA-09 — Pick zero-stock product in Order → Out of Stock alert; pick blocked ──
  test('TA-09 — pick zero-stock product in Order → out of stock alert; pick blocked', async ({ page }) => {
    test.fixme(true, 'cross-feature (Order Pick) + ⚠️ known bug "Research Stock Fail" — verify after Order pick DOM probed');
    await test.step('TA-09_TC-01 — Attempt to Pick zero-stock product → alert; pick blocked', async () => {
      await loginAsStaff(page);
      await shot(page, 'TA-09_TC-01');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  UI / STATE BEHAVIOR
// ════════════════════════════════════════════════════════════════════════════
test.describe('Product Stock — UI / State', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── UI-01 — Self-loop: Low → Low (no duplicate notification) ──
  test('UI-01 — Low→Low self-loop keeps badge, no new notification', async ({ page }) => {
    test.fixme(true, 'badge/notification DOM + qty transition (Item seed) unverified');
    const ps = new ProductStockPage(page);
    await test.step('UI-01_TC-01 — qty Low(3)→Low(2): badge stays Low Stock (2); no new notification', async () => {
      await loginAsStaff(page);
      await ps.gotoInventory();
      await expect(ps.badge(D.PART_LOW, 'Low Stock', 2)).toBeVisible();
      await shot(page, 'UI-01_TC-01');
    });
  });
});
