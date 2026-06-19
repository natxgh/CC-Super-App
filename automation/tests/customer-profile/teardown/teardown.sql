-- ============================================================================
-- DB Teardown — Customer Profile (CC Super App)  ★ คนรีวิว + รันเอง เท่านั้น ★
-- ============================================================================
-- การลบข้อมูลถาวรเป็น destructive action — AI เขียนให้, คนตรวจ+รัน (ดู DB-TEARDOWN.md)
--
-- ⚠️ กฎความปลอดภัย:
--   1. ห้ามรันบน Production — ยืนยัน DB/host เป็น SIT/Staging ก่อน
--   2. DELETE ต้องมี WHERE จำกัด scope เสมอ (marker = ข้อมูลของเทสเท่านั้น)
--   3. Dry-run (SELECT COUNT) ก่อน เห็นจำนวนแถว → ค่อยลบ
--   4. ทำใน transaction (BEGIN … ROLLBACK/COMMIT)
--   5. มี backup/snapshot เผื่อพลาด
--
-- หมายเหตุ: นี่คือ "fallback" กรณีไม่มี API DELETE. ถ้ามี API ให้ใช้
--   `CP_TEARDOWN=1 npm test` (teardown/global-teardown.ts) แทน — ปลอดภัยกว่า
--   เพราะลบเฉพาะ ID ที่ automation สร้างเอง.
--
-- *** ปรับชื่อ table/column ให้ตรง schema จริงของ CC Super App ก่อนรัน ***
-- ============================================================================

-- 0) ยืนยัน env (กันรันผิดเครื่อง) — ต้องเป็น DB ของ SIT/Staging เท่านั้น
SELECT current_database();

-- ----------------------------------------------------------------------------
-- 1) DRY-RUN: ดูก่อนว่าจะลบกี่แถว (marker = source/created_by ของ automation
--    + อีเมลของ test data ที่รู้แน่ชัด). อย่าใช้เวลาอย่างเดียว — ต้องมี marker ร่วม
-- ----------------------------------------------------------------------------
SELECT COUNT(*) AS will_delete
FROM contacts
WHERE source = 'qa-automation'
   OR email IN (
        'siriwimon@gmail.com',     -- TS-02 add
        'wannapha12@gmail.com',    -- TS-03 updated (TS-04 ลบไปแล้วถ้าผ่าน)
        'karaked123@gmail.com',    -- TS-07 / TA negative add
        'darinee@gmail.com'        -- TA-06/07/08 negative add
      );

-- ----------------------------------------------------------------------------
-- 2) ลบจริงใน transaction (ลบ child ก่อน parent ตาม FK)
--    *** ตรวจชื่อ FK/table ลูกให้ครบก่อน COMMIT ***
-- ----------------------------------------------------------------------------
BEGIN;

  -- child tables (ปรับตาม schema จริง: products/services/cases/addresses ฯลฯ)
  -- DELETE FROM contact_addresses  WHERE contact_id IN (SELECT id FROM contacts WHERE source='qa-automation');
  -- DELETE FROM contact_products   WHERE contact_id IN (SELECT id FROM contacts WHERE source='qa-automation');
  -- DELETE FROM contact_services   WHERE contact_id IN (SELECT id FROM contacts WHERE source='qa-automation');

  -- parent
  DELETE FROM contacts
   WHERE source = 'qa-automation'
      OR email IN (
           'siriwimon@gmail.com',
           'wannapha12@gmail.com',
           'karaked123@gmail.com',
           'darinee@gmail.com'
         );

-- ตรวจผลก่อน COMMIT; ถ้าผิด → ROLLBACK;
-- COMMIT;
ROLLBACK;  -- ค่าเริ่มต้น = ปลอดภัย: ต้องแก้เป็น COMMIT เองหลังตรวจ dry-run แล้ว

-- ----------------------------------------------------------------------------
-- Checklist ก่อนเปลี่ยน ROLLBACK → COMMIT:
--   [ ] current_database() = SIT จริง
--   [ ] will_delete (ข้อ 1) จำนวนสมเหตุผล
--   [ ] child tables ตาม FK ครบ
--   [ ] มี snapshot/backup
-- ----------------------------------------------------------------------------
