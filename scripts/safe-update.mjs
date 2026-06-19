// safe-update.mjs — PUT helper ที่ปกป้อง records ที่ PO ตอบแล้ว
//
// กฎ: ถ้า Answer field ไม่ว่าง = PO ตอบแล้ว → ห้าม PUT เด็ดขาด
//     เพราะ Lark Base จะ update "Modified By" ทุกครั้งที่มี write
//     → Modified By ต้องเป็นชื่อ PO ไว้เป็นหลักฐานว่า PO confirm requirements เอง
//
// Usage:
//   import { safePut, safeUpdateFields } from './safe-update.mjs';
//   await safePut(base, token, appToken, tableId, recordId, fields, item);

/**
 * PUT fields ไปยัง record เดียว — จะ skip ถ้า PO ตอบแล้ว
 * @param {string} base       - apiBase URL
 * @param {string} token      - Bearer token
 * @param {string} appToken   - Lark Base App Token
 * @param {string} tableId    - Table ID
 * @param {string} recordId   - record_id ที่จะ update
 * @param {object} fields     - { fieldName: value, ... }
 * @param {object} [item]     - item จาก Lark (ถ้ามีจะเช็ค Answer; ถ้าไม่มีจะ fetch เอง)
 * @returns {'updated'|'skipped_answered'|'error'}
 */
export async function safePut(base, token, appToken, tableId, recordId, fields, item = null) {
  // ถ้ามี item ส่งมา เช็ค Answer ก่อน
  if (item) {
    const ans = item.fields?.Answer;
    const ansText = typeof ans === 'string' ? ans.trim()
                  : (ans?.text?.trim?.() ?? null);
    if (ansText) {
      return 'skipped_answered';
    }
  }

  const res = await fetch(
    `${base}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }
  ).then((x) => x.json());

  return res.code === 0 ? 'updated' : 'error';
}

/**
 * Batch safe-update หลาย records — filter answered ออกก่อนเสมอ
 * @param {object} opts
 * @param {string}   opts.base
 * @param {string}   opts.token
 * @param {string}   opts.appToken
 * @param {string}   opts.tableId
 * @param {Array}    opts.items       - array ของ Lark records (ต้องมี record_id + fields)
 * @param {Function} opts.getFields   - (item) => object | null  — return null = skip
 * @param {boolean}  [opts.dryRun]    - true = แสดงผลเฉยๆ ไม่ส่งจริง
 */
export async function safeUpdateFields({ base, token, appToken, tableId, items, getFields, dryRun = false }) {
  let updated = 0, skippedAnswered = 0, skippedNoChange = 0, errors = 0;

  for (const item of items) {
    // ป้องกัน record ที่ PO ตอบแล้ว
    const ans = item.fields?.Answer;
    const ansText = typeof ans === 'string' ? ans.trim() : (ans?.text?.trim?.() ?? null);
    if (ansText) {
      skippedAnswered++;
      continue;
    }

    const fields = getFields(item);
    if (!fields || Object.keys(fields).length === 0) {
      skippedNoChange++;
      continue;
    }

    if (dryRun) {
      console.log(`  [dry] ${item.record_id} → ${JSON.stringify(fields).substring(0, 80)}`);
      updated++;
      continue;
    }

    const result = await safePut(base, token, appToken, tableId, item.record_id, fields, item);
    if (result === 'updated') updated++;
    else if (result === 'skipped_answered') skippedAnswered++;
    else errors++;
  }

  return { updated, skippedAnswered, skippedNoChange, errors };
}
