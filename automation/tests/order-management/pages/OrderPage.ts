import { Page, Locator } from '@playwright/test';

/**
 * Page Object — Order Management (CMS · /cms/inventory/request, UI "Order" / "Request Spare Part")
 *
 * ✅ VERIFIED against live DOM (probe 2026-06-20, org BMA):
 *    list: "Add", "Search" buttons · placeholder "Search request ID or part..." · 8 columns
 *          (ORDER/DETAIL/BILL TO/SHIP TO/ITEMS/STATUS/CREATED/REQUEST BY) · "Clear Filters" (after search)
 *    add : heading "Request Spare Part" · "Product"/"Spare Part" = <button> (not tab) · brands = <heading>
 *          product card → single <button> (add to cart) · "1 View Cart" · "Submit 1 Order"
 *          Toyota (Spare Part) → "No results found."
 *    detail: "Back" · "Cancel" · advance button = next-step name (e.g. "ส่งคำขอ", "กำลังหยิบสินค้า") · "..." = PIC reveal
 * ⏳ STILL UNVERIFIED (probe before relying on): qty stepper value, edit pencils, comment box,
 *    gridToggle/listToggle, Overdue badge, cancel confirmation dialog, PIC gating per account.
 */
export class OrderPage {
  readonly page: Page;
  // list / search ✅
  readonly addBtn: Locator;
  readonly searchInput: Locator;
  readonly searchBtn: Locator;
  readonly clearFiltersBtn: Locator;
  // add order / cart ✅
  readonly tabProduct: Locator;
  readonly tabSparePart: Locator;
  readonly backBtn: Locator;
  readonly skipBtn: Locator;           // ⏳ unverified (Spare Part Skip step)
  readonly viewCartBtn: Locator;
  readonly submitOrderBtn: Locator;
  readonly noResults: Locator;
  // cart panel ⏳ unverified
  readonly qtyPlus: Locator;
  readonly qtyMinus: Locator;
  readonly qtyValue: Locator;
  readonly billToInput: Locator;
  readonly shipToInput: Locator;
  readonly shipBySelect: Locator;
  // list view-toggle ⏳ unverified (probe: look for icon buttons top-right of list)
  readonly gridToggle: Locator;
  readonly listToggle: Locator;
  // detail ✅ buttons / ⏳ inner fields
  readonly printBtn: Locator;
  readonly cancelBtn: Locator;
  readonly commentInput: Locator;
  readonly commentBtn: Locator;
  readonly overdueBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addBtn = page.getByRole('button', { name: /^Add$/i });
    this.searchInput = page.getByPlaceholder('Search request ID or part...');
    this.searchBtn = page.getByRole('button', { name: /^Search$/i });
    this.clearFiltersBtn = page.getByRole('button', { name: /Clear Filters/i });

    this.tabProduct = page.getByRole('button', { name: /^Product$/i });
    this.tabSparePart = page.getByRole('button', { name: /Spare Part/i });
    this.backBtn = page.getByRole('button', { name: /^Back$/i });
    this.skipBtn = page.getByRole('button', { name: /^Skip$/i });
    this.viewCartBtn = page.getByRole('button', { name: /View Cart/i });
    this.submitOrderBtn = page.getByRole('button', { name: /Submit \d+ Order/i });
    this.noResults = page.getByText('No results found.', { exact: false });

    this.qtyPlus = page.getByRole('button', { name: '＋' }).or(page.getByRole('button', { name: '+' }));
    this.qtyMinus = page.getByRole('button', { name: '−' }).or(page.getByRole('button', { name: '-' }));
    this.qtyValue = page.locator('[name="quantity"], input[aria-label*="quantity" i]');
    this.billToInput = page.getByLabel(/Bill To/i).or(page.getByPlaceholder(/Bill To/i));
    this.shipToInput = page.getByLabel(/Ship To/i).or(page.getByPlaceholder(/Ship To/i));
    this.shipBySelect = page.getByLabel(/Ship By/i);

    // ⏳ grid/list toggle — common patterns; verify aria-label or title on probe
    this.gridToggle = page.getByRole('button', { name: /grid/i }).or(page.getByTitle(/grid/i));
    this.listToggle = page.getByRole('button', { name: /list/i }).or(page.getByTitle(/list/i));

    this.printBtn = page.getByRole('button', { name: /Print/i });
    this.cancelBtn = page.getByRole('button', { name: /^Cancel$/i });
    this.commentInput = page.getByPlaceholder(/Comment/i);
    this.commentBtn = page.getByRole('button', { name: /^Comment$/i });
    this.overdueBadge = page.getByText(/Overdue/i);
  }

  async gotoList() {
    await this.page.goto('/cms/inventory/request', { waitUntil: 'domcontentloaded' });
    await this.addBtn.waitFor({ timeout: 15000 });
  }

  /** open Add → Request Spare Part page (modal/panel — URL stays on list) */
  async openAdd() {
    await this.addBtn.click();
    await this.tabProduct.or(this.tabSparePart).first().waitFor();
  }

  /** brand grid item = a heading ✅ verified */
  async selectBrand(name: string) {
    await this.page.getByRole('heading', { name, exact: true }).click();
  }

  /** product card (by product name heading) → its single add-to-cart button ✅ verified */
  async addProductToCart(productName: string) {
    const card = this.page.locator('div', { has: this.page.getByRole('heading', { name: productName }) }).last();
    await card.getByRole('button').last().click();
  }

  /** advance button labelled with the next step name (PIC-gated) ✅ verified pattern */
  advanceBtn(stepName: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(stepName, 'i') });
  }

  /** a list/grid row identified by Order No */
  row(orderNo: string): Locator {
    return this.page.locator('tbody tr', { hasText: orderNo });
  }

  async openOrder(orderNo: string) {
    await this.row(orderNo).first().click();
    await this.backBtn.waitFor({ timeout: 15000 });
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchBtn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  rowCount(): Promise<number> {
    return this.page.locator('tbody tr').count();
  }
}
