/**
 * Order Management — Real Example Data (no Test/xxx/ทดสอบ placeholders)
 * Source of truth: 08-Order/order-management-test-design.md + order-management-testcases.xlsx
 */
import type { OrderSeed } from './order-seed';

// brand / product used in Add Order flow (from design — Real Example Data)
export const BRAND_XIAOMI = 'Xiaomi';
export const PRODUCT_OIL = 'Synthetic Engine Oil 5W-30';
export const BRAND_NO_ITEMS = 'Toyota'; // no spare parts → "No results found."
export const PART_IPHONE = 'iPhone 17 Pro Screen';

// shipping / billing — realistic
export const BILL_TO = 'บริษัท สยามทีวี เซอร์วิส จำกัด';
export const SHIP_TO = 'คุณสมหญิง รักดี 081-234-5678';
export const SHIP_BY = 'Kerry Express';
export const SHIP_BY_ALT = 'Flash Express';
export const ORDER_TITLE = 'เบิกอะไหล่งานซ่อมจอ iPhone — Job #4821';
export const COMMENT_TEXT = 'รบกวนเร่งจัดส่งภายในวันนี้ครับ';

// 9-step workflow labels (live STG TH) — PO ORD-Q1
export const STEPS = [
  'คำสั่งซื้อ',        // OS000 Create Order
  'ส่งคำขอ',          // OS001 Request
  'ได้รับการอนุมัติ',   // OS003 Request Approved
  'กำลังหยิบสินค้า',    // OS004 Picking
  'กำลังแพ็คสินค้า',    // OS005 Packing
  'ส่งออกจากคลัง',     // OS006 Dispatched
  'กำลังจัดส่ง',       // OS007 Out for Delivery
  'ส่งถึงแล้ว',        // OS008 Delivered
  'เสร็จสิ้น',         // OS009 Complete
] as const;

// API-first seed payload for a baseline order (Create Order state)
export const SEED_ORDER: OrderSeed = {
  title: ORDER_TITLE,
  billTo: BILL_TO,
  billAddr: '199/12 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  shipTo: SHIP_TO,
  shipAddr: '88/4 หมู่ 5 ถนนเพชรเกษม ตำบลอ้อมน้อย อำเภอกระทุ่มแบน สมุทรสาคร 74130',
  shipBy: SHIP_BY,
  items: [{ name: PRODUCT_OIL, quantity: 1, price: 9999 }],
  remark: 'seeded by automation (order-management.spec)',
};
