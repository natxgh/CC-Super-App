/**
 * probeI.mjs — create case via API (exact UI payload + versions) → probe Assignment Detail
 * Usage: node probeI.mjs  (from automation/)
 */
import { chromium, request as apiRequest } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const BASE = process.env.CP_BASE_URL || 'https://skyai-cloud-cc-qa.one-sky.ai';
const GQL  = 'https://cc-bff-qa.one-sky.ai/graphql';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || '';
const ORG  = process.env.CP_ORG || 'BMA';
const OUT  = 'test-results';
fs.mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log(...a);

async function gql(api, token, query, variables = {}) {
  const res = await api.post(GQL, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { query, variables },
  });
  return res.json();
}

async function roles(page) {
  return page.evaluate(() => {
    const out = { buttons: [], inputs: [], tabs: [], headers: [], labels: [] };
    document.querySelectorAll('button').forEach(b => {
      const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
      if (t) out.buttons.push({ text: t.slice(0, 60), disabled: b.disabled, class: b.className.slice(0, 80) });
    });
    document.querySelectorAll('input,textarea').forEach(i =>
      out.inputs.push({ ph: i.placeholder, type: i.type, id: i.id })
    );
    document.querySelectorAll('[role=tab]').forEach(t => out.tabs.push((t.innerText || '').trim()));
    document.querySelectorAll('h1,h2,h3,h4,[role=heading]').forEach(h => {
      const t = (h.innerText || '').trim(); if (t) out.headers.push(t.slice(0, 60));
    });
    document.querySelectorAll('label').forEach(l => {
      const t = (l.innerText || '').trim(); if (t) out.labels.push(t.slice(0, 60));
    });
    return out;
  });
}

const DETAIL = 'PROBE-AUTODELETE DOM probe ' + Date.now();
let caseId = null;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: BASE });
const page = await ctx.newPage();

try {
  // 1. Login
  log('→ login');
  await page.goto('/cc/contacts-list', { waitUntil: 'domcontentloaded' });
  await page.locator('#username').waitFor({ timeout: 20000 });
  await page.locator('#organization').fill(ORG);
  await page.locator('#username').fill(USER);
  await page.locator('#password').fill(PASS);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForFunction(() => !!localStorage.getItem('access_token'), null, { timeout: 20000 });
  await page.evaluate(() => localStorage.setItem('language', 'en'));
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  log('login OK');

  const api = await apiRequest.newContext({ ignoreHTTPSErrors: true });

  // 2. CreateCase with exact UI payload + versions field
  const now = new Date().toISOString();
  const createBody = await gql(api, token,
    'mutation($input:CaseInsertInput!){Case{CreateCase(input:$input){status msg desc caseId}}}',
    { input: {
      caseDetail:   DETAIL,
      caseDuration: 0,
      caseSTypeId:  '5972c770-2b72-4d65-ac93-d19c1555aaf8', // Repair
      caseTypeId:   '6c312319-4b4e-44e1-97de-cac72341f006', // Camera Malfunction
      caseVersion:  'draft',
      createdDate:  now,
      phoneNoHide:  true,
      phoneNo:      '',
      priority:     3,
      source:       '01',
      startedDate:  now,
      statusId:     'S000',                                   // Draft
      usercreate:   USER,
      // wfId intentionally omitted — test if versions alone works without workflow
      caseSla:      '97',
      scheduleFlag: false,
      attachments:  [],
      // versions omitted
    }}
  );
  log('CreateCase response:', JSON.stringify(createBody));
  const cr = createBody?.data?.Case?.CreateCase;
  if (!cr || cr.status !== '0') {
    throw new Error(`CreateCase failed: ${JSON.stringify(cr || createBody)}`);
  }
  caseId = String(cr.caseId ?? '');
  log('Case created! caseId:', caseId);

  // find by detail if needed
  if (!caseId || !/^\d+/.test(caseId)) {
    const listBody = await gql(api, token,
      'query($input:CaseListInput){Case{GetListCase(input:$input){status msg data}}}',
      { input: { detail: DETAIL, start: 0, length: 10 } }
    );
    const arr = (() => { let d = listBody?.data?.Case?.GetListCase?.data; if (typeof d === 'string') try { d = JSON.parse(d); } catch { d = []; } return Array.isArray(d) ? d : []; })();
    caseId = String(arr[arr.length-1]?.id ?? arr[arr.length-1]?.caseId ?? '');
    log('Found caseId via list:', caseId);
  }

  await api.dispose();

  // 3. Navigate to Assignment Board
  log('\n→ /cms/case/assignment');
  await page.goto('/cms/case/assignment', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/probe-board.png`, fullPage: true });

  const boardText = await page.evaluate(() => document.body.innerText);
  log('Board has PROBE:', boardText.includes('PROBE') ? 'YES' : 'NO');
  log('Board columns:', boardText.match(/New\s+\d+|Assigned\s+\d+|In-progress\s+\d+|Done\s+\d+/g)?.join(', '));

  // Try to find card
  const probeCard = page.locator('li', { hasText: /PROBE-AUTODELETE/ }).or(
    page.getByText(/PROBE-AUTODELETE/).first()
  );
  if (await probeCard.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    log('Found PROBE card → clicking');
    await probeCard.first().click();
    await page.waitForTimeout(2000);
  } else {
    // Try list view
    await page.getByRole('button', { name: 'List' }).click().catch(() => {});
    await page.waitForTimeout(2000);
    const listProbe = page.getByText(/PROBE-AUTODELETE/).first();
    if (await listProbe.isVisible({ timeout: 3000 }).catch(() => false)) {
      await listProbe.click();
      await page.waitForTimeout(2000);
    } else if (caseId) {
      log('Navigating directly to case detail:', caseId);
      await page.goto(`/cms/case/assignment/${caseId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }
  }

  await page.screenshot({ path: `${OUT}/probe-case-detail.png`, fullPage: true });
  log('→ URL after navigation:', page.url());

  // 4. Dump detail DOM
  const r = await roles(page);
  log('\n=== BUTTONS ===');
  for (const b of r.buttons) log('  btn:', JSON.stringify(b));
  log('\n=== TABS ===');
  for (const t of r.tabs) log('  tab:', t);
  log('\n=== HEADERS ===');
  for (const h of r.headers) log('  h:', h);
  log('\n=== LABELS (first 30) ===');
  for (const l of r.labels.slice(0, 30)) log('  label:', l);
  log('\n=== INPUTS ===');
  for (const i of r.inputs) log('  input:', JSON.stringify(i));

  // Panels
  const panels = await page.evaluate(() => {
    const found = [];
    document.querySelectorAll('[role="dialog"],[class*="modal"],[class*="drawer"],[class*="sheet"]').forEach(el => {
      const btns = [...el.querySelectorAll('button')].map(b => (b.innerText||'').trim()).filter(Boolean);
      const hdrs = [...el.querySelectorAll('h1,h2,h3,h4')].map(h => (h.innerText||'').trim()).filter(Boolean);
      found.push({ role: el.getAttribute('role'), class: el.className.slice(0,80), buttons: btns, headers: hdrs });
    });
    return found;
  });
  log('\n=== MODALS/DRAWERS ===');
  for (const p of panels) log('  panel:', JSON.stringify(p));

} finally {
  // Teardown
  if (caseId) {
    try {
      const api2 = await apiRequest.newContext({ ignoreHTTPSErrors: true });
      const tok = await page.evaluate(() => localStorage.getItem('access_token')).catch(() => null);
      if (tok) {
        const del = await gql(api2, tok, 'mutation($input:GetIdInput!){Case{DeleteCase(input:$input){status msg}}}', { input: { id: caseId } });
        log('\nDeleteCase:', JSON.stringify(del?.data?.Case?.DeleteCase));
      }
      await api2.dispose();
    } catch (e) { log('delete error:', e.message); }
  }
  await browser.close();
  log('[probe] done');
}
