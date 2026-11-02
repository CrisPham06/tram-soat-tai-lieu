import { build } from 'vite';
import { chromium,expect } from '@playwright/test';
import { existsSync,readFileSync,writeFileSync } from 'node:fs';
import { startServer } from '../serve.mjs';
import { metadata } from './meta.mjs';
const directory='test-results/feedback-mock';
await build({define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('https://feedback-mock.supabase.co'),'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify('mock-public-key')},build:{outDir:directory,rollupOptions:{input:{feedback:'phan-hoi/index.html'}}}});
const path=directory+'/phan-hoi/index.html';writeFileSync(path,readFileSync(path,'utf8').replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\'; style-src \'self\'; font-src \'self\'; img-src \'self\'; connect-src https://feedback-mock.supabase.co; form-action \'none\'; base-uri \'none\'">'));
const server=startServer(0,directory,false);await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true,executablePath:['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)});
const context=await browser.newContext(),page=await context.newPage(),requests=[];let failure=null;
await context.route('https://feedback-mock.supabase.co/**',async route=>{if(failure==='offline'){await route.abort('internetdisconnected');return;}const req=route.request();requests.push({method:req.method(),fields:req.method()==='POST'?Object.keys(req.postDataJSON()):[]});await route.fulfill({status:failure?400:201,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:failure?JSON.stringify(failure):'[]'});});
async function fill(){await page.getByLabel('Mã người thử',{exact:true}).fill('T01');await page.getByRole('radio',{name:'Có',exact:true}).check();await page.getByLabel('Phiếu soát có dễ hiểu không?').selectOption('4');for(const label of ['Phát hiện nào bạn thấy thừa hoặc thiếu?','Bạn có dùng công cụ này trước khi gửi tài liệu thật không, vì sao?','Một điều cần sửa trước nhất là gì?'])await page.getByLabel(label,{exact:true}).fill('Phản hồi giả lập phục vụ kiểm thử.');}
try{
  await page.goto(`http://127.0.0.1:${server.address().port}/phan-hoi/`);await fill();
  await page.evaluate(()=>{document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit();});
  await expect(page.getByRole('status')).toContainText('Đã gửi phiếu');await expect(page.getByLabel('Mã người thử',{exact:true})).toHaveValue('');expect(requests.filter(r=>r.method==='POST')).toHaveLength(1);
  for(const [body,expected] of [[{message:'simulated failure',code:'TEST'},'Chưa gửi được'],[{message:'feedback_cap_reached',code:'P0001'},'đã đủ số phiếu'],[{message:'duplicate',code:'23505'},'trùng với một lần gửi']]){
    failure=body;await fill();await page.getByRole('button',{name:'Gửi phiếu phản hồi',exact:true}).click();await expect(page.getByRole('status')).toContainText(expected);
  }
  failure='offline';await fill();await page.getByRole('button',{name:'Gửi phiếu phản hồi',exact:true}).click();await expect(page.getByRole('status')).toContainText('Chưa gửi được');
  failure=null;await fill();await page.getByLabel('Mã người thử',{exact:true}).fill('ZZZ');await page.getByRole('button',{name:'Gửi phiếu phản hồi',exact:true}).click();expect(await page.getByLabel('Mã người thử',{exact:true}).evaluate(n=>n.validity.patternMismatch)).toBe(true);
  expect(requests.filter(r=>r.method==='POST')).toHaveLength(4);expect(await page.evaluate(()=>localStorage.length+sessionStorage.length)).toBe(0);
  writeFileSync('reports/checks/security/feedback_mock.json',JSON.stringify({...metadata('node tools/feedback-mock.mjs'),status:'passed',cases:['success','duplicate submit in same task','generic error','quota reached','duplicate error','offline error','invalid tester code'],requests,liveNetwork:false,description:'Các yêu cầu API đều được chặn và trả bằng mock trong bộ kiểm thử.'},null,2));console.info('Configured feedback mock passed');
}finally{await browser.close();server.close();}
