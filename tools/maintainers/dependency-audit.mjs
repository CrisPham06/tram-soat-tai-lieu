import { spawnSync } from 'node:child_process';
import { readFileSync,writeFileSync } from 'node:fs';
import { metadata } from './meta.mjs';
const r=spawnSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','audit','--json','--registry','https://registry.npmjs.org','--cache','.npm-cache'],{encoding:'utf8'});
let result;try{result=JSON.parse(r.stdout);}catch{result={error:'Không đọc được kết quả audit',exit:r.status};}
writeFileSync('reports/checks/security/npm_audit.json',JSON.stringify({...metadata('npm audit --json'),result},null,2));
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
const rows=[];for(const path of Object.keys(lock.packages).filter(Boolean)){try{const p=JSON.parse(readFileSync(path+'/package.json','utf8'));rows.push([p.name,p.version,typeof p.license==='string'?p.license:JSON.stringify(p.license||'chưa xác định')]);}catch{/* Gói tùy nền tảng không được cài trên máy. */}}
writeFileSync('reports/checks/environment/licenses.csv','name,version,license\n'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n'));
console.info(JSON.stringify(result.metadata?.vulnerabilities||result.error));
if(!result.metadata||result.metadata.vulnerabilities.high||result.metadata.vulnerabilities.critical)process.exitCode=1;
