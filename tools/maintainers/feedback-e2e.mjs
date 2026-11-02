import { chromium,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync,writeFileSync,readFileSync } from 'node:fs';
import { startServer } from '../serve.mjs';
import { metadata } from './meta.mjs';
import { build } from 'vite';
const directory='test-results/feedback-unconfigured';
await build({define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(''),'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify('')},build:{outDir:directory,rollupOptions:{input:{feedback:'phan-hoi/index.html'}}}});
const path=directory+'/phan-hoi/index.html';writeFileSync(path,readFileSync(path,'utf8').replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\'; style-src \'self\'; font-src \'self\'; img-src \'self\' data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">'));
const server=startServer(0,directory,false);await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true,executablePath:['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)});
const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
await page.goto(`http://127.0.0.1:${server.address().port}/phan-hoi/`);await expect(page.getByRole('status')).toContainText('chưa được cấu hình');
await page.getByLabel('Mã người thử',{exact:true}).fill('T01');await page.getByRole('radio',{name:'Có',exact:true}).check();await page.getByLabel('Phiếu soát có dễ hiểu không?').selectOption('4');
for(const label of ['Phát hiện nào bạn thấy thừa hoặc thiếu?','Bạn có dùng công cụ này trước khi gửi tài liệu thật không, vì sao?','Một điều cần sửa trước nhất là gì?'])await page.getByLabel(label,{exact:true}).fill('Phản hồi giả lập phục vụ kiểm thử, không phải ý kiến người dùng thật.');
const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Tải phiếu về tệp JSON'}).click();const download=await downloadEvent;const data=JSON.parse(readFileSync(await download.path(),'utf8'));expect(data.tester_code).toBe('T01');expect(data.q2_clarity).toBe(4);
await page.getByRole('button',{name:'Gửi phiếu phản hồi',exact:true}).click();await expect(page.getByRole('status').last()).toContainText('chưa được cấu hình');
await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'dist-release/captures/09_trang_phan_hoi.png'});
const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact))).toHaveLength(0);expect(errors).toHaveLength(0);
writeFileSync('reports/checks/security/feedback_e2e.json',JSON.stringify({...metadata('node tools/feedback-e2e.mjs'),status:'passed',mode:'unconfigured; download and validation checked; no live insert',errors,axe:axe.violations},null,2));console.info('Feedback local flow passed');
}finally{await browser.close();server.close();}
