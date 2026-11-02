import { writeFileSync } from 'node:fs';
import { metadata } from './maintainers/meta.mjs';
const input=process.argv[2];if(!input)throw new Error('Cần địa chỉ trang đã triển khai.');
const base=new URL(input);const rows=[];
const names=['content-security-policy','x-content-type-options','referrer-policy','permissions-policy','strict-transport-security','x-frame-options','content-type'];
for(const path of ['/','/index.html','/phan-hoi/']){const response=await fetch(new URL(path,base),{method:'HEAD',redirect:'manual'});rows.push({path,status:response.status,headers:Object.fromEntries(names.map(name=>[name,response.headers.get(name)]).filter(([,value])=>value!==null))});}
writeFileSync('reports/checks/security/headers_check.json',JSON.stringify({...metadata('node tools/check-headers.mjs <deployment-url>'),url:base.origin,rows,limitation:'Không theo chuyển hướng xác thực và không lưu cookie/token. Phản hồi cổng riêng tư không chứng minh tiêu đề của ứng dụng.'},null,2));console.info(JSON.stringify(rows.map(r=>({path:r.path,status:r.status,csp:!!r.headers['content-security-policy']}))));
