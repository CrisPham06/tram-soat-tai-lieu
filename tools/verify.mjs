import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { metadata } from './maintainers/meta.mjs';
const stages = ['typecheck', 'lint', 'test', 'audit-static', 'secret-scan', 'verify-schema-sync', 'build:web', 'build:offline', 'bundle-budget', 'e2e', 'verify-offline', 'feedback-e2e', 'feedback-mock', 'workflow-test', 'evaluate', 'dataset-browser', 'eval-unchanged'];
const scripts = JSON.parse((await import('node:fs')).readFileSync('package.json', 'utf8')).scripts;
const results = [];
for (const name of stages) {
  const command = scripts[name];
  const file = command?.split(' ')[1];
  if (!command || (file && /\.(?:mjs|ts)$/.test(file) && !existsSync(file))) { results.push({ name, status: 'failed', reason: 'Thiếu lệnh hoặc công cụ kiểm tra' }); break; }
  if (name === 'evaluate' && !existsSync('datasets/synthetic/manifest.json')) { results.push({ name, status: 'failed', reason: 'Thiếu bộ mẫu' }); break; }
  const start = performance.now();
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', name], { stdio: 'inherit', shell: process.platform === 'win32' });
  results.push({ name, status: r.status === 0 ? 'passed' : 'failed', durationMs: performance.now() - start });
  if (r.status !== 0 && !process.argv.includes('--all')) break;
}
mkdirSync('reports/checks/build', { recursive: true });
writeFileSync('reports/checks/build/verify.json', JSON.stringify({ ...metadata('npm run verify:all'), results }, null, 2));
const failed = results.some(x => x.status === 'failed');
console.info(JSON.stringify({ failed, pending: results.filter(x => x.status === 'pending').map(x => x.name) }));
process.exitCode = failed ? 1 : 0;
