import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { metadata } from './meta.mjs';
export const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(x => x.isDirectory() ? walk(join(dir, x.name)) : [join(dir, x.name)]);
const patterns = [/\bfetch\s*\(/g, /XMLHttpRequest/g, /WebSocket/g, /EventSource/g, /sendBeacon/g, /localStorage/g, /sessionStorage/g, /indexedDB/g, /document\.cookie/g, /serviceWorker/g, /\binnerHTML\b/g, /\bouterHTML\b/g, /insertAdjacentHTML/g, /dangerouslySetInnerHTML/g, /document\.write/g, /\beval\s*\(/g, /new\s+Function/g, /https?:\/\//g];
const violations = [];
const counts = Object.fromEntries(patterns.map(pattern => [pattern.source, 0]));
for (const path of walk('src').filter(x => /\.[tj]sx?$/.test(x) && !x.includes('feedback'))) {
  let text = readFileSync(path, 'utf8');
  // Chỉ cho phép địa chỉ kho mã trong dữ liệu liên kết điều hướng đã duyệt.
  if (path.replaceAll('\\', '/') === 'src/ui/public-links.ts') text = text.replace('https://github.com/CrisPham06/tram-soat-tai-lieu', 'REVIEWED_SOURCE_LINK');
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const count = [...text.matchAll(pattern)].length;
    counts[pattern.source] += count;
    if (count) violations.push({ path, pattern: pattern.source, count });
  }
  if (/@supabase|from ['"].*feedback/.test(text)) violations.push({ path, pattern: 'feedback import' });
}
mkdirSync('reports/checks/security', { recursive: true });
writeFileSync('reports/checks/security/audit_static.txt', JSON.stringify({ ...metadata('npm run audit-static'), violations, counts, checkedPatterns: patterns.map(x => x.source) }, null, 2));
console.info(`Static violations: ${violations.length}`);
process.exitCode = violations.length ? 1 : 0;
