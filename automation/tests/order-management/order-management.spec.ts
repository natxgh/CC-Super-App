import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import { LoginPage } from '../../shared/pages/LoginPage';
import { OrderPage } from './pages/OrderPage';
import { seedOrder, advanceOrder, recordOrder } from './fixtures/order-seed';
import * as D from './fixtures/testdata';

/**
 * Order Management — Playwright E2E (generated from 08-Order/order-management-testcases.xlsx)
 * Pattern: 1 Scenario = 1 test() (Scenario No.) · 1 Test Case = 1 test.step('<TC No.> — …') + shot()
 * Reuse: shared/LoginPage. Feature POM: pages/OrderPage.ts (⚠️ selectors UNVERIFIED — see POM header).
 * API-first Arrange + teardown: fixtures/order-seed.ts (CreateOrder ✅ schema-verified; teardown = CancelOrder, no DeleteOrder).
 *
 * ⚠️ staging needs real login — set CP_USERNAME/CP_PASSWORD/CP_ORG to run (else skip; never fake-pass).
 *
 * RUN/FIXME status (honest — updated 2026-06-29):
 *   ⛔ SEED/CREATE BLOCKED — verified live 2026-06-29: the configured account `ketwadee` is NOT in the
 *      `inventory_order_workflow` pic list, so BOTH CreateOrder (API seed) and UI Submit return "Forbidden".
 *      Only `apiwat` / `watee.tha` can create orders. → every create/seed scenario is BLOCKED until BE adds
 *      the account (or those creds are provided). Read-only scenarios (TA-04) still run. See FIXME-PLAN.md +
 *      order-workflow-config memory. NOTE: API spec is NOT missing — CreateOrder is verified; this is a
 *      permission/data gap, and items require productId/partId (not free-text name) — seedOrder now resolves it.
 *   ⏸ DOM also UNVERIFIED for most scenarios — OrderPage selectors not probed yet (un-fixme after probe).
 *   🐞 Two scenarios encode CONFIRMED FE bugs (PO-validated) and are expected to FAIL when enabled:
 *        TA-03 (Cancel button visible after Approved — should be hidden) → see FIXME-PLAN.md / design ORD-Q5
 *        TA-05 (Search returns all rows — should filter)                 → see FIXME-PLAN.md / design ORD-Q7
 *
 * Teardown strategy:
 *   - seedOrder() records every created orderId in test-results/seeded-orders.json
 *   - recordOrder(id) for UI-created orders (TS-01, TS-04): capture order no. from page text after submit
 *   - Global teardown (CP_TEARDOWN=1 or ORD_TEARDOWN=1): calls teardownSeededOrders → CancelOrder
 *   - ⚠️ NO DeleteOrder in API — teardown is soft (orders end as "Cancel" status, records remain)
 *   - ⚠️ TS-01 walks to Complete (OS009) — CancelOrder fails at terminal state; recorded but uncancellable
 *     until BE provides DeleteOrder. See FIXME-PLAN.md.
 */
// ⛔ Shared BLOCKED reason — create/seed scenarios cannot run with the current account (see header).
const SEED_BLOCKED = 'BLOCKED: account not in inventory_order_workflow pic list → CreateOrder/Submit = Forbidden (need apiwat/watee.tha). Verified live 2026-06-29.';
const ORG = process.env.CP_ORG || '';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || '';
const DOM_UNVERIFIED = 'Order UI DOM not probed yet — verify OrderPage selectors before enabling';

async function shot(page: Page, label: string) {
  fs.mkdirSync('test-results/steps', { recursive: true });
  await page.screenshot({ path: `test-results/steps/${label}.png`, fullPage: true }).catch(() => {});
}

async function loginAndOpenOrders(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login({ org: ORG, username: USER, password: PASS });
  await new OrderPage(page).gotoList();
}

// ════════════════════════════════════════════════════════════════════════════
//  SUCCESS SCENARIOS (TS-01 … TS-04)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Order Management — Success', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TS-01 — Create → Submit → walk the full 9-step workflow to เสร็จสิ้น ──────
  test('TS-01 — create, submit and advance an order through all 9 workflow steps to Complete', async ({ page }) => {
    test.fixme(true, `${SEED_BLOCKED} + ${DOM_UNVERIFIED}`);
    const o = new OrderPage(page);

    await test.step('TS-01_TC-01 — Add a product to Cart from Add Order', async () => {
      await loginAndOpenOrders(page);
      await o.openAdd();
      await o.tabProduct.click();
      await o.selectBrand(D.BRAND_XIAOMI);
      await o.addProductToCart(D.PRODUCT_OIL);
      await expect(o.viewCartBtn).toBeVisible(); // "1 View Cart" ✅ verified
      await shot(page, 'TS-01_TC-01');
    });
    await test.step('TS-01_TC-02 — Increase Cart quantity to 2', async () => {
      await o.viewCartBtn.click();
      await o.qtyPlus.click();
      await expect(o.qtyValue).toHaveValue('2');
      await shot(page, 'TS-01_TC-02');
    });
    await test.step('TS-01_TC-03 — Fill Bill To/Ship To/Ship By → Submit becomes enabled', async () => {
      await o.billToInput.fill(D.BILL_TO);
      await o.shipToInput.fill(D.SHIP_TO);
      await o.shipBySelect.selectOption({ label: D.SHIP_BY }).catch(async () => {
        await o.shipBySelect.click(); await page.getByText(D.SHIP_BY).click();
      });
      await expect(o.submitOrderBtn).toBeEnabled();
      await shot(page, 'TS-01_TC-03');
    });
    await test.step('TS-01_TC-04 — Submit Order succeeds → new order created (Create Order)', async () => {
      await o.submitOrderBtn.click();
      await expect(page.getByText(/ORD\d{6}-\d{5}/)).toBeVisible();
      // Capture UI-created order ID for best-effort teardown (CancelOrder will fail at Complete — see FIXME-PLAN.md)
      const orderText = await page.getByText(/ORD\d{6}-\d{5}/).first().textContent().catch(() => '');
      if (orderText?.trim()) recordOrder(orderText.trim());
      await shot(page, 'TS-01_TC-04');
    });
    // TC-05..TC-12 — advance through all 9 steps (PIC-gated). Each step = next-step Advance button.
    for (let i = 1; i < D.STEPS.length; i++) {
      const tc = `TS-01_TC-${String(i + 4).padStart(2, '0')}`;
      const next = D.STEPS[i];
      await test.step(`${tc} — Advance workflow → "${next}"`, async () => {
        await o.advanceBtn(next).click();
        await expect(page.getByText(next)).toBeVisible();
        await shot(page, tc);
      });
    }
    await test.step('TS-01_TC-13 — Event Notification on workflow Advance (in-app bell)', async () => {
      // PO ORD-Q6: "{actor} ส่งถึงคุณ {Status} :: {Order ID}" — exact text TBD on probe
      await expect(page.getByText(/ส่งถึงคุณ/)).toBeVisible();
      await shot(page, 'TS-01_TC-13');
    });
  });

  // ── TS-02 — View / List / Detail (read paths) ──────────────────────────────
  test('TS-02 — view list, grid, detail and read elements', async ({ page }) => {
    test.fixme(true, `${SEED_BLOCKED} (detail steps seed an order) + ${DOM_UNVERIFIED}`);
    const o = new OrderPage(page);
    // Persists across steps: seeded order (Create Order state, iPhone item for OOS badge)
    let seededOrderId = '';

    await test.step('TS-02_TC-01 — Toggle List ↔ Grid view', async () => {
      await loginAndOpenOrders(page);
      await o.gridToggle.click();
      await shot(page, 'TS-02_TC-01');
    });
    await test.step('TS-02_TC-02 — Table list shows all columns', async () => {
      await o.listToggle.click();
      for (const col of ['ORDER', 'DETAIL', 'BILL TO', 'SHIP TO', 'ITEMS', 'STATUS', 'CREATED', 'REQUEST BY'])
        await expect.soft(page.getByText(col, { exact: false })).toBeVisible();
      await shot(page, 'TS-02_TC-02');
    });
    await test.step('TS-02_TC-03 — Order Detail page renders all elements', async () => {
      // Arrange: API seed — fresh order with iPhone 17 Pro Screen (potentially OOS in QA)
      seededOrderId = await seedOrder(page, D.SEED_ORDER_OOS);
      await o.gotoList();
      await o.search(seededOrderId);         // filter to seeded order (not pre-existing data)
      await o.row(seededOrderId).first().click();
      await o.backBtn.waitFor({ timeout: 15000 });
      await expect.soft(o.printBtn).toBeVisible();
      await shot(page, 'TS-02_TC-03');
    });
    await test.step('TS-02_TC-04 — Order Item shows Out of Stock badge', async () => {
      // ENV_DEPENDENT: OOS badge shows only if iPhone 17 Pro Screen stock = 0 in QA env
      await expect.soft(page.getByText(/Out of Stock/i)).toBeVisible();
      await shot(page, 'TS-02_TC-04');
    });
    await test.step('TS-02_TC-05 — Chat box empty state = No Comment', async () => {
      // Fresh seeded order has no comments — verifiable without pre-existing data
      await expect(page.getByText(/No Comment/i)).toBeVisible();
      await shot(page, 'TS-02_TC-05');
    });
    await test.step('TS-02_TC-06 — Add a Comment to an order', async () => {
      await o.commentInput.fill(D.COMMENT_TEXT);
      await o.commentBtn.click();
      await expect(page.getByText(D.COMMENT_TEXT)).toBeVisible();
      await shot(page, 'TS-02_TC-06');
    });
    await test.step('TS-02_TC-07 — Current step over SLA → Overdue badge (Approved SLA=61min)', async () => {
      // ENV_DEPENDENT: requires an order already sitting at OS003 for > 61 min.
      // Set ORD_OVERDUE_ID env to an existing overdue order, or leave unset to skip.
      test.skip(!process.env.ORD_OVERDUE_ID, 'ENV_DEPENDENT: set ORD_OVERDUE_ID to an order at OS003 idle > 61 min');
      await o.gotoList();
      await o.search(process.env.ORD_OVERDUE_ID!);
      await o.row(process.env.ORD_OVERDUE_ID!).first().click();
      await o.backBtn.waitFor({ timeout: 15000 });
      await expect(o.overdueBadge).toBeVisible();
      await shot(page, 'TS-02_TC-07');
    });
    await test.step('TS-02_TC-08 — Clear Filters restores the full list', async () => {
      await o.gotoList();
      await o.search(seededOrderId);         // use seeded order ID (not hard-coded pre-existing)
      await o.clearFiltersBtn.click();
      await expect(o.searchInput).toHaveValue('');
      await shot(page, 'TS-02_TC-08');
    });
  });

  // ── TS-03 — Update Order Detail (before submit) ────────────────────────────
  test('TS-03 — update bill/shipping, items and title while Create Order', async ({ page }) => {
    test.fixme(true, `${SEED_BLOCKED} + ${DOM_UNVERIFIED}`);
    const o = new OrderPage(page);
    let seededOrderId = '';

    await test.step('TS-03_TC-01 — Edit Bill/Shipping inline then Save', async () => {
      await loginAndOpenOrders(page);
      seededOrderId = await seedOrder(page, D.SEED_ORDER); // Arrange: Create Order state (API-first)
      await o.gotoList();
      await o.search(seededOrderId);
      await o.row(seededOrderId).first().click();
      await o.backBtn.waitFor({ timeout: 15000 });
      // edit Ship By → Flash Express, Save (selectors on probe)
      await shot(page, 'TS-03_TC-01');
    });
    await test.step('TS-03_TC-02 — Edit Order Item quantity to 5', async () => {
      await shot(page, 'TS-03_TC-02');
    });
    await test.step('TS-03_TC-03 — Edit the order Title', async () => {
      await shot(page, 'TS-03_TC-03');
    });
  });

  // ── TS-04 — Add via Spare Part path (Skip product) ─────────────────────────
  test('TS-04 — add an order via Spare Part skipping the product step', async ({ page }) => {
    test.fixme(true, `${SEED_BLOCKED} (UI Submit hits same Forbidden) + ${DOM_UNVERIFIED}`);
    const o = new OrderPage(page);

    await test.step('TS-04_TC-01 — Add via Spare Part then Skip the Product step', async () => {
      await loginAndOpenOrders(page);
      await o.openAdd();
      await o.tabSparePart.click();
      await o.skipBtn.click();
      await shot(page, 'TS-04_TC-01');
    });
    await test.step('TS-04_TC-02 — Fill Bill To/Ship To/Ship By → Submit becomes enabled', async () => {
      await o.billToInput.fill(D.BILL_TO);
      await o.shipToInput.fill(D.SHIP_TO);
      await expect(o.submitOrderBtn).toBeEnabled();
      await shot(page, 'TS-04_TC-02');
    });
    await test.step('TS-04_TC-03 — Submit Order succeeds → new order created', async () => {
      await o.submitOrderBtn.click();
      await expect(page.getByText(/ORD\d{6}-\d{5}/)).toBeVisible();
      // Arrange teardown: capture UI-created order ID so teardown can CancelOrder
      const orderText = await page.getByText(/ORD\d{6}-\d{5}/).first().textContent().catch(() => '');
      if (orderText?.trim()) recordOrder(orderText.trim());
      await shot(page, 'TS-04_TC-03');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ALTERNATIVE / NEGATIVE SCENARIOS (TA-01 … TA-06)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Order Management — Alternative', () => {
  test.beforeEach(() => test.skip(!PASS, 'set CP_PASSWORD to run real-login tests'));

  // ── TA-01 — Submit blocked by missing required fields ──────────────────────
  test('TA-01 — submit blocked when Ship By is empty', async ({ page }) => {
    test.fixme(true, DOM_UNVERIFIED);
    const o = new OrderPage(page);

    await test.step('TA-01_TC-01 — Add a product to Cart from Add Order', async () => {
      await loginAndOpenOrders(page);
      await o.openAdd();
      await o.tabProduct.click();
      await o.selectBrand(D.BRAND_XIAOMI);
      await o.addProductToCart(D.PRODUCT_OIL);
      await shot(page, 'TA-01_TC-01');
    });
    await test.step('TA-01_TC-02 — Submit with Ship By left blank (required) → blocked', async () => {
      await o.viewCartBtn.click();
      await o.billToInput.fill(D.BILL_TO);
      await o.shipToInput.fill(D.SHIP_TO);
      // Ship By left blank → Submit disabled / field error
      await expect(o.submitOrderBtn).toBeDisabled();
      await shot(page, 'TA-01_TC-02');
    });
    // No teardown needed: cart only — no order was created (Submit not tapped)
  });

  // ── TA-02 — Cancel before Approved + quantity boundary ─────────────────────
  test('TA-02 — quantity lower bound and cancel before Approved', async ({ page }) => {
    test.fixme(true, `${SEED_BLOCKED} (TC-02 seeds an order to cancel) + ${DOM_UNVERIFIED}`);
    const o = new OrderPage(page);

    await test.step('TA-02_TC-01 — Decrease quantity below the minimum (− disabled at 1)', async () => {
      await loginAndOpenOrders(page);
      await o.openAdd();
      await o.tabProduct.click();
      await o.selectBrand(D.BRAND_XIAOMI);
      await o.addProductToCart(D.PRODUCT_OIL);
      await o.viewCartBtn.click();
      await expect(o.qtyMinus).toBeDisabled(); // min=1, no max, not stock-bound (PO ORD-Q2)
      await shot(page, 'TA-02_TC-01');
    });
    await test.step('TA-02_TC-02 — Cancel an order before Approved → status Cancel', async () => {
      // Arrange: API seed — Create Order state (before Approved, cancellable)
      const id = await seedOrder(page, D.SEED_ORDER);
      expect(id).toBeTruthy();
      await o.gotoList();
      await o.search(id);
      await o.row(id).first().click();
      await o.backBtn.waitFor({ timeout: 15000 });
      await o.cancelBtn.click();
      // confirmation dialog "ยืนยันการยกเลิกคำสั่งซื้อ ___ ?" + Confirm (PO ORD-Q9)
      await page.getByRole('button', { name: /Confirm/i }).click();
      await expect(page.getByText(/Cancel/i)).toBeVisible();
      await shot(page, 'TA-02_TC-02');
      // Teardown: order is now in Cancel terminal state — no further teardown needed
    });
  });

  // ── TA-03 — Edit locked after Submit + Cancel after Approved (BUG) ──────────
  test('TA-03 — bill/items locked after submit; Cancel must be hidden after Approved (BUG)', async ({ page }) => {
    // 🐞 CONFIRMED live (probe 2026-06-20): Cancel visible after Approved → see BUG-cancel-visible-after-approved.md
    // ⛔ Also seed-blocked: arrange seeds + advances to OS003, which needs pic-list access (Forbidden for ketwadee).
    test.fixme(true, `${SEED_BLOCKED} | CONFIRMED FE BUG (PO ORD-Q5) — Cancel visible after Approved. Card: BUG-cancel-visible-after-approved.md`);
    const o = new OrderPage(page);

    await test.step('TA-03_TC-01 — After Submit — Bill & Items are locked', async () => {
      await loginAndOpenOrders(page);
      // Arrange: API seed → advance to OS003 (Request Approved) — no pre-existing order
      const id = await seedOrder(page, D.SEED_ORDER);
      const adv1 = await advanceOrder(page, id, 'OS001');
      const adv2 = await advanceOrder(page, id, 'OS003');
      if (!adv1 || !adv2) throw new Error(`advanceOrder to OS003 failed (OS001=${adv1} OS003=${adv2})`);
      await o.gotoList();
      await o.search(id);
      await o.row(id).first().click();
      await o.backBtn.waitFor({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /edit|pencil/i })).toHaveCount(1); // only Title pencil (⏳ verify on probe)
      await shot(page, 'TA-03_TC-01');
    });
    await test.step('TA-03_TC-02 — Cancel button should be hidden/blocked after Approved', async () => {
      // EXPECTED (correct behavior): Cancel hidden after Approved → assertion FAILS today = the confirmed bug
      await expect(o.cancelBtn).toBeHidden();
      await shot(page, 'TA-03_TC-02');
    });
  });

  // ── TA-04 — Brand with no items → cannot proceed ───────────────────────────
  // ✅ ENABLED — fully verified live (probe 2026-06-20): Toyota (Spare Part) → "No results found."
  test('TA-04 — brand with no items shows No results found', async ({ page }) => {
    const o = new OrderPage(page);

    await test.step('TA-04_TC-01 — Select a brand with no items → No results', async () => {
      await loginAndOpenOrders(page);
      await o.openAdd();
      await o.tabSparePart.click();
      await o.selectBrand(D.BRAND_NO_ITEMS);
      await expect(o.noResults).toBeVisible();
      await shot(page, 'TA-04_TC-01');
    });
    // No teardown needed: read-only catalog check — no data created
  });

  // ── TA-05 — Search does not filter (BUG) ───────────────────────────────────
  test('TA-05 — search should filter by Order ID and part name (BUG: returns all)', async ({ page }) => {
    // 🐞 CONFIRMED live (probe 2026-06-20): search ORD260610-00004 → rows 10→10 (no filter) → see BUG-search-not-filtering.md
    // ⛔ Also seed-blocked: arrange seeds 2 orders to search for (Forbidden for ketwadee).
    test.fixme(true, `${SEED_BLOCKED} | CONFIRMED FE BUG (PO ORD-Q7) — Search returns all rows. Card: BUG-search-not-filtering.md`);
    const o = new OrderPage(page);

    await test.step('TA-05_TC-01 — Search by Order ID filters the list', async () => {
      // Arrange: API seed 2 orders so we have a specific ID to search for (no hard-coded pre-existing data)
      const id1 = await seedOrder(page, D.SEED_ORDER);
      await seedOrder(page, D.SEED_ORDER_OOS); // 2nd order so list has > 1 row
      await loginAndOpenOrders(page);
      const before = await o.rowCount();
      await o.search(id1);
      // EXPECTED (correct): list shrinks to the matching row → FAILS today (count unchanged) = the bug
      expect(await o.rowCount()).toBeLessThan(before);
      await shot(page, 'TA-05_TC-01');
    });
    await test.step('TA-05_TC-02 — Search by part name filters the list', async () => {
      // Arrange: seeded order with iPhone 17 Pro Screen already in list from TC-01
      await o.gotoList();
      await o.search('iPhone');
      await expect(page.getByText(D.PART_IPHONE)).toBeVisible();
      await shot(page, 'TA-05_TC-02');
    });
  });

  // ── TA-06 — PIC gating ─────────────────────────────────────────────────────
  test('TA-06 — non-PIC user cannot see the Advance button', async ({ page }) => {
    test.fixme(true, `${SEED_BLOCKED} (arrange seeds an order) + ${DOM_UNVERIFIED} (also needs a non-PIC account — PIC roles: Warehouse Approver / Manager)`);
    const o = new OrderPage(page);

    await test.step('TA-06_TC-01 — Non-PIC user → Advance button does not appear', async () => {
      await loginAndOpenOrders(page);
      // Arrange: API seed a fresh order — no pre-existing row needed
      const id = await seedOrder(page, D.SEED_ORDER);
      await o.gotoList();
      await o.search(id);
      await o.row(id).first().click();
      await o.backBtn.waitFor({ timeout: 15000 });
      await expect(o.advanceBtn(D.STEPS[1])).toBeHidden();
      await shot(page, 'TA-06_TC-01');
    });
  });
});
