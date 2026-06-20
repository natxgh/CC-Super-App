import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Order Management (CMS · /cms/inventory/request, UI "Order" / "Request Spare Part")
 *
 * ⚠️ SELECTORS UNVERIFIED — derived from 08-Order/order-management-test-design.md (hands-on notes),
 *    NOT yet confirmed against live DOM. Before un-fixme'ing a scenario, probe the real page and
 *    tighten each locator (Selector priority: getByRole → getByLabel → getByPlaceholder → getByText).
 *    Kept best-effort role/text locators so a probe pass can verify/replace them quickly.
 */
export class OrderPage {
  readonly page: Page;
  // list / search
  readonly addBtn: Locator;
  readonly searchInput: Locator;
  readonly searchBtn: Locator;
  readonly clearFiltersBtn: Locator;
  readonly gridToggle: Locator;
  readonly listToggle: Locator;
  // add order / cart
  readonly tabProduct: Locator;
  readonly tabSparePart: Locator;
  readonly skipBtn: Locator;
  readonly viewCartBtn: Locator;
  readonly qtyPlus: Locator;
  readonly qtyMinus: Locator;
  readonly qtyValue: Locator;
  readonly billToInput: Locator;
  readonly shipToInput: Locator;
  readonly shipBySelect: Locator;
  readonly submitOrderBtn: Locator;
  readonly noResults: Locator;
  // detail / workflow
  readonly printBtn: Locator;
  readonly cancelBtn: Locator;
  readonly commentInput: Locator;
  readonly commentBtn: Locator;
  readonly overdueBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addBtn = page.getByRole('button', { name: /^Add$/i });
    this.searchInput = page.getByPlaceholder(/Search request ID or part/i);
    this.searchBtn = page.getByRole('button', { name: /^Search$/i });
    this.clearFiltersBtn = page.getByRole('button', { name: /Clear Filters/i });
    this.gridToggle = page.getByRole('button', { name: /grid/i });
    this.listToggle = page.getByRole('button', { name: /list/i });

    this.tabProduct = page.getByRole('tab', { name: /^product$/i }).or(page.getByText(/^product$/i));
    this.tabSparePart = page.getByRole('tab', { name: /Spare Part/i }).or(page.getByText(/Spare Part/i));
    this.skipBtn = page.getByRole('button', { name: /^Skip$/i });
    this.viewCartBtn = page.getByRole('button', { name: /View Cart/i });
    this.qtyPlus = page.getByRole('button', { name: '＋' }).or(page.getByRole('button', { name: '+' }));
    this.qtyMinus = page.getByRole('button', { name: '−' }).or(page.getByRole('button', { name: '-' }));
    this.qtyValue = page.locator('[name="quantity"], input[aria-label*="quantity" i]');
    this.billToInput = page.getByLabel(/Bill To/i).or(page.getByPlaceholder(/Bill To/i));
    this.shipToInput = page.getByLabel(/Ship To/i).or(page.getByPlaceholder(/Ship To/i));
    this.shipBySelect = page.getByLabel(/Ship By/i);
    this.submitOrderBtn = page.getByRole('button', { name: /Submit \d+ Order/i });
    this.noResults = page.getByText(/No results found\./i);

    this.printBtn = page.getByRole('button', { name: /Print/i });
    this.cancelBtn = page.getByRole('button', { name: /^Cancel$/i });
    this.commentInput = page.getByPlaceholder(/Comment/i);
    this.commentBtn = page.getByRole('button', { name: /^Comment$/i });
    this.overdueBadge = page.getByText(/Overdue/i);
  }

  async gotoList() {
    await this.page.goto('/cms/inventory/request', { waitUntil: 'domcontentloaded' });
  }

  /** Advance button = next step name (bottom-right). PIC-gated. */
  advanceBtn(stepName: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(stepName, 'i') });
  }

  /** a list/grid row identified by Order No */
  row(orderNo: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(orderNo, 'i') })
      .or(this.page.locator('tr', { hasText: orderNo }));
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }
}
