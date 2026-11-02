import { chromium, expect } from '@playwright/test';
import { zipSync, strToU8 } from 'fflate';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { startServer } from '../serve.mjs';
import { metadata } from './meta.mjs';
const server=startServer(0);await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true,executablePath:['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)});
const page=await browser.newPage({reducedMotion:'reduce'}),rows=[],consoleMessages=[];
page.on('console',m=>consoleMessages.push(m.text()));
const marker='TÀI LIỆU GIẢ LẬP PHỤC VỤ KIỂM THỬ, KHÔNG PHẢI TÀI LIỆU THẬT';
const rootXml=text=>`<w:document xmlns:w="urn:w"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`;
async function run(name,bytes,fileName,expected){const start=performance.now();await page.locator('input[accept=".docx,.pdf,.txt,.xlsx,.pptx"]').setInputFiles({name:fileName,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});if(expected==='reject')await expect(page.locator('.alert')).toBeVisible({timeout:35000});else await expect(page.locator('.outcome-code>span')).toHaveText(expected,{timeout:35000});rows.push({name,status:'passed',durationMs:performance.now()-start});}
try{
await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByRole('radio',{name:'Nền tảng quốc gia'}).check();
await run('zero bytes',new Uint8Array(),'gia.txt','reject');
await run('oversize',new Uint8Array(26*1024*1024),'gia.txt','reject');
await run('fake extension',strToU8(marker),'gia.docx','reject');
await run('DTD',zipSync({'word/document.xml':strToU8('<!DOCTYPE x [<!ENTITY a "abc">]>'+rootXml('&a;'))}),'gia.docx','reject');
await run('deep XML',zipSync({'word/document.xml':strToU8('<x>'.repeat(200)+marker+'</x>'.repeat(200))}),'gia.docx','reject');
const inflated=zipSync({'word/document.xml':strToU8(rootXml(marker))});const view=new DataView(inflated.buffer);for(let i=0;i<inflated.length-46;i++)if(view.getUint32(i,true)===0x02014b50){view.setUint32(i+24,300*1024*1024,true);break;}
await run('declared zip bomb',inflated,'gia.docx','reject');
const entries=zipSync(Object.fromEntries(Array.from({length:10001},(_,i)=>['entry'+i,strToU8('gia')])));await run('many zip entries',entries,'gia.docx','reject');
await run('zip path traversal',zipSync({'../word/document.xml':strToU8(rootXml(marker))}),'gia.docx','reject');
await run('truncated zip',readFileSync('datasets/synthetic/files/X01_docx.docx'),'gia.docx','reject');
await run('password PDF',readFileSync('datasets/synthetic/files/X02_pdf.pdf'),'gia.pdf','reject');
await run('image PDF',readFileSync('datasets/synthetic/files/X03_pdf.pdf'),'gia.pdf','reject');
await run('HTML in filename',strToU8(marker+'\nBuổi học.'),'<img onerror=alert(1)>\u202e.txt','A');await expect(page.locator('#screening-sheet img')).toHaveCount(0);expect((await page.locator('.sheet-details').innerText()).includes('\u202e')).toBe(false);
await run('long filename',strToU8(marker+'\nBuổi học.'),'x'.repeat(5000)+'.txt','A');
await page.getByRole('button',{name:'Sửa lựa chọn',exact:true}).click();
await page.getByRole('button',{name:'Dán văn bản',exact:true}).click();
await page.getByLabel('Văn bản cần soát').fill(marker+'\n</script><img onerror=alert(1)>');await page.getByRole('button',{name:'Soát văn bản',exact:true}).click();await expect(page.locator('.outcome-code>span')).toHaveText('A');rows.push({name:'HTML paste',status:'passed'});
await page.getByRole('button',{name:'Sửa lựa chọn',exact:true}).click();await page.getByLabel('Văn bản cần soát').fill('a'.repeat(5000000));await page.getByRole('button',{name:'Soát văn bản',exact:true}).click();await expect(page.locator('.alert')).toBeVisible();rows.push({name:'oversized paste',status:'passed'});
const pack=JSON.parse(readFileSync('rulepacks/demo-v1.json','utf8'));pack.rules[0].pattern='(a+)+$';await page.locator('input[accept=".json"]').setInputFiles({name:'rules.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pack))});await expect(page.locator('.alert')).toContainText('quá thời gian');rows.push({name:'ReDoS rulepack',status:'passed'});
await page.locator('input[accept=".json"]').setInputFiles({name:'rules.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"wrong"}')});await expect(page.locator('.alert')).toContainText('lược đồ');rows.push({name:'wrong rulepack schema',status:'passed'});
expect(consoleMessages.some(s=>s.includes('TỐI MẬT'))).toBe(false);
}catch(e){rows.push({name:'failure',status:'failed',reason:e.message});process.exitCode=1;}finally{writeFileSync('reports/checks/security/redteam.json',JSON.stringify({...metadata('node tools/redteam.mjs'),rows,consoleMessages},null,2));writeFileSync('reports/checks/security/redteam.md','# Thử phá bằng dữ liệu giả lập\n\n'+rows.map(r=>'- '+JSON.stringify(r)).join('\n')+'\n\nMẫu PDF rất nhiều trang và tác vụ vượt watchdog thực tế: chưa đo trong lượt thử này.\n');console.info(JSON.stringify({passed:rows.filter(r=>r.status==='passed').length,failed:rows.filter(r=>r.status==='failed').length}));await browser.close();server.close();}
