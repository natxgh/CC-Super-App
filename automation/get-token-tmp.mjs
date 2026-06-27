import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORG=process.env.CP_ORG||'BMA',USER=process.env.CP_USERNAME||'ketwadee',PASS=process.env.CP_PASSWORD;
if(!PASS){console.error('CP_PASSWORD required');process.exit(1);}
const TOKEN_CACHE=path.join(__dirname,'test-results/.token');
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({baseURL:'https://skyai-cloud-cc-qa.one-sky.ai'});
const page=await ctx.newPage();
await page.goto('/cms/login',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2000);
await page.locator('#organization').fill(ORG);
await page.locator('#username').fill(USER);
await page.locator('#password').fill(PASS);
await page.getByRole('button',{name:'เข้าสู่ระบบ'}).click();
let token=null;
for(let i=0;i<60;i++){token=await page.evaluate(()=>localStorage.getItem('access_token'));if(token)break;await page.waitForTimeout(500);}
await browser.close();
if(!token){console.error('no token');process.exit(1);}
fs.mkdirSync(path.dirname(TOKEN_CACHE),{recursive:true});
fs.writeFileSync(TOKEN_CACHE,token);
console.log('✅ saved, len:',token.length);
