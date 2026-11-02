import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const config = existsSync('vercel.json') ? JSON.parse(readFileSync('vercel.json', 'utf8')) : null;
export function startServer(port = 4173, directory = 'dist', applyHeaders = true) {
  const root = resolve(directory);
  return createServer((req, res) => {
    let decoded; try { decoded = decodeURIComponent((req.url || '/').split('?')[0]); } catch { res.writeHead(400).end(); return; }
    let path = resolve(root, '.' + decoded);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.html');
    if (!existsSync(path)) { res.writeHead(404).end(); return; }
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
    if (applyHeaders && (req.url === '/' || req.url === '/index.html')) for (const h of config?.headers?.[0]?.headers || []) res.setHeader(h.key, h.value);
    if (applyHeaders && (req.url || '').startsWith('/phan-hoi/')) for (const h of config?.headers?.find(x=>x.source==='/phan-hoi/(.*)')?.headers || []) res.setHeader(h.key,h.value);
    res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path));
  }).listen(port, '127.0.0.1');
}
if (process.argv[1]?.endsWith('serve.mjs')) { startServer(); console.info('Local: http://127.0.0.1:4173'); }
