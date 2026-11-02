import { chromium,expect } from '@playwright/test';
import { existsSync,writeFileSync } from 'node:fs';
import { zipSync,strToU8 } from 'fflate';
import { startServer } from '../serve.mjs';
import { metadata } from './meta.mjs';
const server=startServer(0);await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true,executablePath:['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)});
const page=await browser.newPage({reducedMotion:'reduce'});
await page.addInitScript(()=>{window.qualityTasks=[];window.qualityCLS=0;new window.PerformanceObserver(list=>{window.qualityTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})));}).observe({type:'longtask',buffered:true});new window.PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.qualityCLS+=e.value;}).observe({type:'layout-shift',buffered:true});});
function luminance(hex){const c=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
const contrasts=[];
try{
const started=performance.now();await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('h1').waitFor();const interactionReadyMs=performance.now()-started;await page.evaluate(()=>document.fonts.ready);
for(const scheme of ['light','dark']){
  await page.emulateMedia({colorScheme:scheme});await expect(page.locator('html')).toHaveAttribute('data-theme',scheme);
  const names=['ink','ink-muted','surface','bg','band','line-strong','focus','ok','hold','escalate','escalate-soft','ok-ink','hold-ink','escalate-ink','primary','primary-ink','stamp-ink'];
  const tokens=await page.evaluate(names=>{const s=window.getComputedStyle(document.documentElement);return Object.fromEntries(names.map(k=>[k,s.getPropertyValue('--'+k).trim()]));},names);
  const pairs=[];
  for(const background of ['bg','surface','band']){
    for(const foreground of ['ink','ink-muted','ok-ink','hold-ink','escalate-ink'])pairs.push({foreground,background,minimum:4.5,kind:'text'});
    for(const foreground of ['line-strong','focus'])pairs.push({foreground,background,minimum:3,kind:'control'});
  }
  for(const background of ['ok','hold','escalate','escalate-soft'])pairs.push({foreground:'stamp-ink',background,minimum:4.5,kind:'text'});
  pairs.push({foreground:'primary-ink',background:'primary',minimum:4.5,kind:'text'});
  for(const pair of pairs){const a=luminance(tokens[pair.foreground]),b=luminance(tokens[pair.background]),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);contrasts.push({scheme,...pair,foregroundHex:tokens[pair.foreground],backgroundHex:tokens[pair.background],ratio,pass:ratio>=pair.minimum});}
}
writeFileSync('reports/checks/quality/contrast_check.json',JSON.stringify({...metadata('node tools/quality.mjs'),pairs:contrasts,minimumText:Math.min(...contrasts.filter(x=>x.kind==='text').map(x=>x.ratio)),minimumControl:Math.min(...contrasts.filter(x=>x.kind==='control').map(x=>x.ratio))},null,2));
expect(contrasts.filter(x=>!x.pass)).toEqual([]);
await page.emulateMedia({colorScheme:'light'});const transforms=await page.locator('.destination-option').evaluateAll(nodes=>nodes.map(n=>window.getComputedStyle(n).transform));expect(transforms.every(x=>x==='none')).toBe(true);
await page.getByRole('radio',{name:'Nền tảng quốc gia'}).check();
const xml='<w:document xmlns:w="urn:w"><w:body><w:p><w:r><w:t>TÀI LIỆU GIẢ LẬP PHỤC VỤ KIỂM THỬ, KHÔNG PHẢI TÀI LIỆU THẬT</w:t></w:r></w:p>'+('<w:p><w:r><w:t>'+('Buổi học về sách và cây xanh. '.repeat(32))+'</w:t></w:r></w:p>').repeat(10500)+'</w:body></w:document>';
const payload=zipSync({'word/document.xml':strToU8(xml)},{level:0});
await page.evaluate(()=>{window.qualityTasks=[];});const start=performance.now();await page.locator('input[accept=".docx,.pdf,.txt,.xlsx,.pptx"]').setInputFiles({name:'gia-lap-lon.docx',mimeType:'application/octet-stream',buffer:Buffer.from(payload)});await expect(page.locator('.outcome-code>span')).toHaveText('A',{timeout:35000});const durationMs=performance.now()-start;const performanceData=await page.evaluate(()=>{const started=performance.getEntriesByName('screening-worker-start').at(-1)?.startTime||0,ended=performance.getEntriesByName('screening-worker-result').at(-1)?.startTime||performance.now();return{longTasks:window.qualityTasks,processingWindow:{started,ended,longTasks:window.qualityTasks.filter(t=>t.start>=started&&t.start<=ended)},CLS:window.qualityCLS,memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize}:null};});
writeFileSync('reports/checks/quality/performance.json',JSON.stringify({...metadata('node tools/quality.mjs'),interactionReadyMs,fileBytes:payload.length,screeningDurationMs:durationMs,...performanceData},null,2));writeFileSync('reports/checks/quality/reduced_motion_check.txt',JSON.stringify({transforms,reduced:true},null,2));console.info(JSON.stringify({durationMs,longTaskMaxMs:Math.max(0,...performanceData.longTasks.map(x=>x.duration)),fileBytes:payload.length}));
}finally{await browser.close();server.close();}
