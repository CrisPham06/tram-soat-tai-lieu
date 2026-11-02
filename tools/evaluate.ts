import { metadata } from './maintainers/meta.mjs';
import { mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { readDocument } from '../src/core/readers/detect';
import { screen } from '../src/core/engine';
import { DEFAULT_RULEPACK } from '../src/core/rulepack';
import { DESTINATIONS, type Destination } from '../src/shared/outcomes';
type Entry = { id:string;fileName:string;format:string;rules:string;reject?:string;category:string;routes:Record<Destination,string> };
const entries:Entry[]=JSON.parse(readFileSync('datasets/synthetic/manifest.json','utf8'));
const rows: {id:string;format:string;expected:string;actual:string;destination:string;expectedOutcome:string;actualOutcome:string;ms:number;error:string}[]=[];
const timings:{id:string;format:string;run:number;ms:number}[]=[];
const counts=Object.fromEntries(DEFAULT_RULEPACK.rules.map(r=>[r.id,{tp:0,fp:0,fn:0,tn:0}]));
let exact=0,expectedPairs=0,rejectCorrect=0;
const routeCorrect=Object.fromEntries(DESTINATIONS.map(d=>[d,0]));
const failures:string[]=[];
for(const entry of entries){
 let model:Awaited<ReturnType<typeof readDocument>>|undefined,error='';
 for(let run=0;run<5;run++){const start=process.hrtime.bigint();try{model=await readDocument(new Uint8Array(readFileSync('datasets/synthetic/files/'+entry.fileName)),entry.fileName);screen(model,DEFAULT_RULEPACK,'national');}catch(e){error=e instanceof Error?e.message:'unknown';}timings.push({id:entry.id,format:entry.format,run:run+1,ms:Number(process.hrtime.bigint()-start)/1e6});}
 const wanted=Object.fromEntries(entry.rules.split(';').filter(Boolean).map(p=>{const [id,n]=p.split(':');return[id,Number(n)];}));
 const result=model?screen(model,DEFAULT_RULEPACK,'national'):null;
 const actual:Record<string,number>={};for(const f of result?.findings||[])actual[f.ruleId]=(actual[f.ruleId]||0)+f.count;
 if(entry.reject){if(error===entry.reject)rejectCorrect++;else failures.push(`${entry.id}: từ chối kỳ vọng ${entry.reject}, thực tế ${error||'đã đọc'}.`);}
 else for(const r of DEFAULT_RULEPACK.rules){const w=wanted[r.id]||0,a=actual[r.id]||0;counts[r.id][w?(a?'tp':'fn'):(a?'fp':'tn')]++;if(w){expectedPairs++;if(w===a)exact++;}if(w!==a)failures.push(`${entry.id} / ${r.id}: kỳ vọng ${w}, thực tế ${a}. ${result?.maxSeverity==='S3'?'Sai lệch có chủ ý: dừng tại S3 theo hợp đồng.':'Cần đối chiếu bộ sinh, trình đọc và quy tắc; không sửa bộ quy tắc.'}`);}
 for(const d of DESTINATIONS){const outcome=model?screen(model,DEFAULT_RULEPACK,d).outcome:'REJECT';if(outcome===entry.routes[d]&&!entry.reject)routeCorrect[d]++;rows.push({id:entry.id,format:entry.format,expected:entry.rules,actual:Object.entries(actual).map(([id,n])=>id+':'+n).join(';'),destination:d,expectedOutcome:entry.routes[d],actualOutcome:outcome,ms:timings.filter(t=>t.id===entry.id)[0].ms,error});if(outcome!==entry.routes[d])failures.push(`${entry.id} / ${d}: định tuyến ${entry.routes[d]} -> ${outcome}.`);}
}
const rate=(n:number,d:number)=>d?n/d:null;
const summarize=(c:{tp:number;fp:number;fn:number;tn:number})=>({...c,precision:rate(c.tp,c.tp+c.fp),recall:rate(c.tp,c.tp+c.fn)});
const groups:Record<string,{tp:number;fp:number;fn:number;tn:number}>={};
for(const r of DEFAULT_RULEPACK.rules){groups[r.group]??={tp:0,fp:0,fn:0,tn:0};for(const k of ['tp','fp','fn','tn'] as const)groups[r.group][k]+=counts[r.id][k];}
const total={tp:0,fp:0,fn:0,tn:0};for(const c of Object.values(counts))for(const k of ['tp','fp','fn','tn'] as const)total[k]+=c[k];
const quantile=(a:number[],q:number)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.ceil(s.length*q)-1)];};
const performanceByFormat=Object.fromEntries([...new Set(entries.map(x=>x.format))].map(f=>{const ts=timings.filter(t=>t.format===f).map(t=>t.ms);return[f,{samples:ts.length,medianMs:quantile(ts,.5),p95Ms:quantile(ts,.95),maxMs:Math.max(...ts)}];}));
const metrics={...metadata('npm run evaluate'),files:entries.length,usableFiles:entries.filter(e=>!e.reject).length,errorFiles:entries.filter(e=>e.reject).length,rules:DEFAULT_RULEPACK.rules.length,perRule:Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,summarize(v)])),groups:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,summarize(v)])),total:summarize(total),countExact:{correct:exact,total:expectedPairs,ratio:rate(exact,expectedPairs)},routing:routeCorrect,rejectCorrect,performanceByFormat,failures:failures.length};
const dir='reports';mkdirSync(dir,{recursive:true});
const csv=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';
if(existsSync(dir+'/results.csv')&&!existsSync(dir+'/results_before_fix.csv'))copyFileSync(dir+'/results.csv',dir+'/results_before_fix.csv');
writeFileSync(dir+'/results.csv',[Object.keys(rows[0]).join(','),...rows.map(r=>Object.values(r).map(csv).join(','))].join('\n'));
writeFileSync(dir+'/timing_node.csv',['id,format,run,ms',...timings.map(t=>Object.values(t).join(','))].join('\n'));
writeFileSync(dir+'/metrics.json',JSON.stringify(metrics,null,2));
writeFileSync(dir+'/metrics.md','# Kết quả đo\n\n```json\n'+JSON.stringify(metrics,null,2)+'\n```\n');
writeFileSync(dir+'/failures.md','# Sai lệch với đáp án\n\n'+(failures.length?failures.map(x=>'- '+x).join('\n'):'Không có sai lệch.')+'\n\nKhông thay đổi bộ quy tắc để làm đẹp số đo.\n');
console.info(JSON.stringify({files:metrics.files,total:metrics.total,routing:metrics.routing,rejectCorrect,failures:failures.length}));
if(rows.some(r=>r.actualOutcome!==r.expectedOutcome))process.exitCode=1;
