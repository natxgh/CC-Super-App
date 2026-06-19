// update-bc-lark.mjs — patch "Business Conditions" on existing Spare Parts records in Lark Base
// match by Feature + TC No. → batch_update (does NOT touch other fields). dry-run by default, --confirm to write.
import fs from 'fs';
import path from 'path';
import ExcelJS from '/Users/ketwadee.kae/Documents/WorkSpace/qa-ai-pilot/automation/node_modules/exceljs/excel.js';
import { getAccessToken } from '/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/scripts/lark-auth.mjs';

const CONFIRM = process.argv.includes('--confirm');
const XLSX = '/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/06-Spare Parts/spare-parts-testcases.xlsx';
const FEATURE = 'Spare Parts & Inventory Management';
const CFG = '/Users/ketwadee.kae/Documents/WorkSpace/CC Super App/lark.config.json';
const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'));
const base = (cfg.apiBase || 'https://open.larksuite.com').replace(/\/$/, '');
const APP = cfg.tcAppToken, TABLE = cfg.tcTableId;

// read xlsx → map TC No. -> Business Conditions
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(XLSX);
const ws = wb.worksheets[0];
const hdr = [];
ws.getRow(2).eachCell({ includeEmpty:false }, (c,col) => { hdr[col] = String(c.value||'').trim(); });
const ci = (n) => hdr.findIndex(h => h && h.toLowerCase().startsWith(n.toLowerCase()));
const cTC = ci('TC No.'), cBC = ci('Business Conditions'), cTitle = ci('Case Title Name');
const FIELDS = { 'Business Conditions': cBC, 'Case Title Name': cTitle };
const want = {};
ws.eachRow((row,n) => { if (n<=2) return; const tc=String(row.getCell(cTC).value||'').trim(); if(!tc)return;
  want[tc]={}; for(const[f,col]of Object.entries(FIELDS)) want[tc][f]=String(row.getCell(col).value||'').trim(); });

const token = await getAccessToken(cfg);
const txt = v => typeof v==='string'?v:(Array.isArray(v)?v.map(x=>typeof x==='string'?x:(x.text||x.name||'')).join(''):(v?.text||v?.name||''));

// fetch all records, filter feature
const all=[]; let pt='';
do{ const r=await fetch(`${base}/open-apis/bitable/v1/apps/${APP}/tables/${TABLE}/records?page_size=100${pt?`&page_token=${pt}`:''}`,{headers:{Authorization:`Bearer ${token}`}}).then(x=>x.json());
  for(const it of r.data?.items||[]) all.push(it); pt=r.data?.has_more?r.data.page_token:''; }while(pt);

const updates=[];
for (const it of all) {
  if (!txt(it.fields.Feature).includes('Spare Parts & Inventory')) continue;
  const tc = txt(it.fields['TC No.']);
  if (!(tc in want)) continue;
  const fields={};
  for (const f of Object.keys(FIELDS)) { if (txt(it.fields[f]) !== want[tc][f]) fields[f]=want[tc][f]; }
  if (Object.keys(fields).length===0) continue;
  updates.push({ record_id: it.record_id, tc, fields });
}

console.log(`Feature: ${FEATURE} · records to update: ${updates.length}`);
for (const u of updates.slice(0,3)) { console.log(`\n[${u.tc}] fields: ${Object.keys(u.fields).join(', ')}\n  ${JSON.stringify(u.fields)}`); }
if (updates.length>3) console.log(`\n…and ${updates.length-3} more`);

if (!CONFIRM) { console.log('\n=== DRY RUN === run with --confirm to write'); process.exit(0); }

let ok=0;
for (let i=0;i<updates.length;i+=10){
  const batch=updates.slice(i,i+10).map(u=>({record_id:u.record_id, fields:u.fields}));
  const r=await fetch(`${base}/open-apis/bitable/v1/apps/${APP}/tables/${TABLE}/records/batch_update`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({records:batch})}).then(x=>x.json());
  if(r.code===0){ok+=batch.length;batch.forEach(b=>console.log('  ✅ '+updates.find(u=>u.record_id===b.record_id).tc));}
  else console.error('  ❌ batch error:',r.msg);
}
console.log(`\n✅ updated ${ok}/${updates.length}`);
