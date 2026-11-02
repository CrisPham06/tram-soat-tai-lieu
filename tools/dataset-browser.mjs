import { chromium, expect } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { startServer } from './serve.mjs';
import { metadata } from './maintainers/meta.mjs';
const server=startServer(0);await new Promise(r=>server.once('listening',r));
const executablePath=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const browser=await chromium.launch({executablePath,headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
const entries=JSON.parse(readFileSync('datasets/synthetic/manifest.json','utf8'));
const pack=JSON.parse(readFileSync('rulepacks/demo-v1.json','utf8'));
const rows=[],timings=[];
const screenDir='dist-release/captures';mkdirSync(screenDir,{recursive:true});
async function capture(name,fullPage=false){await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});await page.screenshot({path:`${screenDir}/${name}.png`,fullPage});}
try{
await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);await capture('01_chon_noi_den');
for(const entry of entries){console.info('Checking '+entry.id);for(const d of ['national','internal','ai','outside']){
if(await page.getByRole('button',{name:'Sửa lựa chọn',exact:true}).isVisible())await page.getByRole('button',{name:'Sửa lựa chọn',exact:true}).click();
await page.getByRole('radio',{name:pack.routing.destinations[d].label}).check();
const runs=d==='national'?5:1;
for(let run=0;run<runs;run++){
const start=performance.now();
await page.locator('input[accept=".docx,.pdf,.txt,.xlsx,.pptx"]').setInputFiles(`datasets/synthetic/files/${entry.fileName}`);
if(entry.reject)await expect(page.locator('.alert')).toBeVisible();else await expect(page.locator('.outcome-code>span')).toBeVisible();
timings.push({id:entry.id,format:entry.format,destination:d,run:run+1,ms:performance.now()-start});
}
const actual=entry.reject?(await page.locator('.alert').count()?'REJECT':'UNKNOWN'):await page.locator('.outcome-code>span').innerText();
rows.push({id:entry.id,destination:d,expected:entry.routes[d],actual,match:actual===entry.routes[d]});
if(d==='national'){
const names={N02:'02_phieu_A_tep_sach',M02:'03_phieu_C_dung_lai',P06:'04_phieu_B_giu_noi_bo',E02:'05_phat_hien_du_lieu_an',X01:'07_tep_loi_bi_tu_choi'};
if(names[entry.id])await capture(names[entry.id]);
if(entry.id==='U01'){await page.pdf({path:`${screenDir}/phieu_soat_mau.pdf`,format:'A4',printBackground:true});await page.locator('#screening-sheet').screenshot({path:`${screenDir}/phieu_soat_mau.png`});}
}
}}
if(await page.getByRole('button',{name:'Sửa lựa chọn',exact:true}).isVisible())await page.getByRole('button',{name:'Sửa lựa chọn',exact:true}).click();
await page.getByRole('button',{name:'Dán văn bản',exact:true}).click();await page.getByLabel('Văn bản cần soát').fill(readFileSync('datasets/synthetic/files/P01_txt.txt','utf8'));await page.getByRole('button',{name:'Soát văn bản',exact:true}).click();await expect(page.getByLabel('Bản văn bản đã che')).toBeVisible();await capture('06_che_do_dan_ai');
await page.locator('input[accept=".json"]').setInputFiles('rulepacks/demo-v1.json');await expect(page.locator('.notice')).toContainText('Đã nạp bộ quy tắc');await page.locator('summary').click();await page.locator('#bo-quy-tac').scrollIntoViewIfNeeded();await page.screenshot({path:`${screenDir}/08_nap_bo_quy_tac.png`});
await page.getByRole('button',{name:'Xóa phiên làm việc',exact:true}).click();await page.getByRole('button',{name:'Xóa phiên',exact:true}).click();await capture('draft_desktop',true);await page.setViewportSize({width:390,height:844});await capture('10_di_dong');await capture('draft_mobile',true);
}finally{writeFileSync('reports/timing_browser.csv',['id,format,destination,run,ms',...timings.map(r=>Object.values(r).join(','))].join('\n'));writeFileSync('reports/browser_agreement.json',JSON.stringify({...metadata('node tools/dataset-browser.mjs'),rows},null,2));writeFileSync('reports/e2e_agreement.md','# Đối chiếu trình duyệt\n\n'+rows.filter(r=>!r.match).map(r=>JSON.stringify(r)).join('\n')+'\n\nCác dòng đầy đủ và số đo nằm trong browser_agreement.json và timing_browser.csv.\n');console.info(JSON.stringify({rows:rows.length,failures:rows.filter(r=>!r.match).length}));if(rows.some(r=>!r.match))process.exitCode=1;await browser.close();server.close();}
