import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { metadata } from './maintainers/meta.mjs';

const excludedDirectories = new Set(['.git', '.agents', '.codex', '.impeccable', '.taste-skill', 'node_modules', '.npm-cache', '.testdeps', 'dist-release', 'dist', 'dist-offline', 'test-results', 'playwright-report']);
const userSuppliedInstructions = new Set(['AGENTS.md', 'Codex.md', 'SKILL.md']);
const textual = /\.(?:md|txt|json|csv|ts|tsx|mjs|css|html|sql|yml|yaml)$|^\.env\.example$/i;
function walk(directory = '.') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) return excludedDirectories.has(entry.name) ? [] : walk(join(directory, entry.name));
    const path = join(directory, entry.name);
    return textual.test(path) && !userSuppliedInstructions.has(path) ? [path] : [];
  });
}
export function scanSecrets() {
  const files = walk();
  const findings = [];
  const roleReferences = [];
  const profile = process.env.USERPROFILE;
  const privateMarkers = [profile, profile?.replaceAll('\\', '/'), profile && JSON.stringify(profile).slice(1, -1), process.env.USERNAME].filter(Boolean);
  const patterns = [
    ['retired-provider-name', new RegExp('\\b' + 'Si' + 'tes' + '\\b', 'i')],
    ['retired-provider-domain', new RegExp('chat' + 'gpt' + '\\.' + 'site', 'i')],
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['provider-key', /\b(?:sk_(?:live|test)_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{25,}|sb_secret_[A-Za-z0-9_-]{20,})\b/],
    ['jwt', /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/],
    ['assigned-secret', /(?:password|secret|access_token|api_key)\s*[:=]\s*["'][A-Za-z0-9_+\-/=]{24,}["']/i],
  ];
  for (const path of files) {
    const text = readFileSync(path, 'utf8');
    const file = relative('.', path).replaceAll('\\', '/');
    for (const [kind, pattern] of patterns) if (pattern.test(text)) findings.push({ file, kind });
    const emails = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || [];
    const synthetic = /^(src|tests|datasets)\//.test(file) || /workflow_(before|after)\.json$/.test(file) || /^(?:tools\/(?:e2e\.mjs|generate-dataset\.ts)|tools\/maintainers\/(?:redteam|workflow-regressions)\.mjs)$/.test(file);
    const thirdPartyLicense = /(?:LICENSE|OFL-)/.test(file);
    if (!synthetic && !thirdPartyLicense && emails.some(value => !/@(?:[^@]*\.)?(?:example\.(?:com|org|test)|invalid|gia)$/.test(value))) findings.push({file,kind:'email-needs-review'});
    if (!synthetic && !thirdPartyLicense && /\b0[35789]\d{8}\b/.test(text)) findings.push({file,kind:'phone-needs-review'});
    if (privateMarkers.some(marker => text.toLowerCase().includes(marker.toLowerCase()))) findings.push({ file, kind: 'host-private-marker' });
    if (/service_role/.test(text)) roleReferences.push(file);
  }
  const result = { ...metadata('node tools/secret-scan.mjs'), checkedTextFiles: files.length, findings, roleReferences, status: findings.length ? 'failed' : 'passed', limitation: 'Quét mẫu chuỗi trong văn bản nguồn/minh chứng; bỏ thư mục công cụ, build, dependency, tệp nhị phân và ba tệp chỉ dẫn do người dùng cung cấp. Không phải xác nhận mọi bí mật đều được phát hiện. Chỉ ghi loại và đường dẫn tương đối, không ghi giá trị khớp.' };
  writeFileSync('reports/checks/security/secret_scan.txt', JSON.stringify(result, null, 2));
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = scanSecrets();
  console.info(JSON.stringify({ checkedTextFiles: result.checkedTextFiles, status: result.status, findings: result.findings }));
  process.exitCode = result.findings.length ? 1 : 0;
}
