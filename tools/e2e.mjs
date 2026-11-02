import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { startServer } from './serve.mjs';
import { metadata } from './maintainers/meta.mjs';
const offline = process.argv[2] === 'offline';
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const server = startServer(0); await new Promise(r => server.once('listening', r));
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const notice = 'TÀI LIỆU GIẢ LẬP PHỤC VỤ KIỂM THỬ, KHÔNG PHẢI TÀI LIỆU THẬT';
const cases = [], requests = [], errors = [], violations = [], axe = [];
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.exposeFunction('recordCsp', x => violations.push(x));
await page.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => window.recordCsp({ directive: e.violatedDirective, blocked: e.blockedURI })); });
async function check(name, action) { const start = performance.now(); await action(); cases.push({ name, status: 'passed', durationMs: performance.now() - start }); }
async function upload(name, bytes, outcome) {
  await page.locator('input[type=file]').first().setInputFiles({ name, mimeType: 'application/octet-stream', buffer: Buffer.from(bytes) });
  await expect(page.locator('#screening-sheet .outcome-code>span')).toHaveText(outcome, { timeout: 30000 });
}
async function edit() { const button = page.getByRole('button', { name: 'Sửa lựa chọn', exact: true }); if (await button.isVisible()) await button.click(); }
const paragraph = text => `<w:p><w:r><w:t>${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</w:t></w:r></w:p>`;
try {
  const url = offline ? pathToFileURL(resolve('dist-offline/tram-soat-tai-lieu.html')).href : `http://127.0.0.1:${server.address().port}`;
  await page.goto(url); await page.locator('h1').waitFor(); await page.evaluate(() => document.fonts.ready);
  await check('unselected input is disabled', () => expect(page.locator('.drop-zone')).toBeDisabled());
  const initialAxe = await new AxeBuilder({ page }).analyze(); axe.push({ state: 'initial', violations: initialAxe.violations });
  if (offline) await context.setOffline(true);
  page.on('request', r => requests.push({ url: r.url(), method: r.method() }));
  await check('text A', async () => { await page.getByRole('radio', { name: 'Nền tảng quốc gia' }).check(); await upload('gia.txt', strToU8(notice + '\nBuổi sinh hoạt câu lạc bộ.'), 'A'); });
  await check('text B and masked excerpts', async () => { await upload('gia.txt', strToU8(notice + '\n0912345678'), 'B'); await expect(page.locator('#screening-sheet')).not.toContainText('0912345678'); });
  await check('docx header C and no excerpt', async () => { const bytes = zipSync({ 'word/document.xml': strToU8(`<w:document xmlns:w="urn:w"><w:body>${paragraph(notice)}</w:body></w:document>`), 'word/header1.xml': strToU8(`<w:hdr xmlns:w="urn:w">${paragraph('ĐỘ MẬT: TUYỆT MẬT')}</w:hdr>`) }); await upload('gia.docx', bytes, 'C'); await expect(page.locator('#screening-sheet')).not.toContainText('TUYỆT MẬT'); });
  await check('PDF text', async () => { const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit); const font = await pdf.embedFont(readFileSync('tests/fixtures/NotoSans-Regular.ttf'), { subset: true }); const p = pdf.addPage(); p.drawText(notice, { font, size: 8, x: 20, y: 700 }); p.drawText('Buổi sinh hoạt học tập.', { font, size: 12, x: 20, y: 650 }); pdf.setAuthor(''); await upload('gia.pdf', await pdf.save(), 'A'); });
  await check('reject wrong extension', async () => { await page.locator('input[type=file]').first().setInputFiles({ name: 'gia.docx', mimeType: 'application/octet-stream', buffer: Buffer.from(notice) }); await expect(page.getByRole('alert')).toContainText('Đuôi tệp không khớp nội dung'); });
  await check('paste mask and S3 lock', async () => { await edit(); await page.getByRole('button', { name: 'Dán văn bản', exact: true }).click(); await page.getByLabel('Văn bản cần soát').fill(notice + '\nLiên hệ 0912345678'); await page.getByRole('button', { name: 'Soát văn bản', exact: true }).click(); await expect(page.getByLabel('Bản văn bản đã che')).toContainText('[ĐÃ CHE 1:'); await expect(page.getByLabel('Văn bản cần soát')).toHaveValue(''); await edit(); await page.getByLabel('Văn bản cần soát').fill(notice + '\nTỐI MẬT'); await page.getByRole('button', { name: 'Soát văn bản', exact: true }).click(); await expect(page.getByRole('button', { name: 'Sao chép bản đã che' })).toBeDisabled(); await expect(page.getByLabel('Văn bản cần soát')).toHaveValue(''); });
  await check('print one page', async () => { mkdirSync('dist-release/captures', { recursive: true }); const bytes = await page.pdf({ path: 'dist-release/captures/phieu_soat_nhap.pdf', format: 'A4', printBackground: true }); expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1); });
  await check('rulepack import and search', async () => { await page.locator('input[accept=".json"]').setInputFiles('rulepacks/demo-v1.json'); await expect(page.locator('.notice')).toContainText('Đã nạp bộ quy tắc'); await page.locator('summary').click(); await page.getByLabel('Tìm theo tên hoặc mã quy tắc').fill('META-04'); await expect(page.locator('tbody tr')).toHaveCount(1); });
  await check('reset', async () => { await page.getByRole('button', { name: 'Xóa phiên làm việc', exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('button', { name: 'Xóa phiên', exact: true }).click(); await expect(page.locator('.outcome')).toHaveCount(0); await expect(page.locator('.drop-zone')).toBeDisabled(); });
  await check('responsive dark and keyboard', async () => { await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ colorScheme: 'dark' }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement)).toBe(true); const r = await new AxeBuilder({ page }).analyze(); axe.push({ state: 'dark-mobile', violations: r.violations }); });
  const storage = await page.evaluate(async () => ({ local: localStorage.length, session: sessionStorage.length, databases: (await indexedDB.databases()).length, cookies: document.cookie, workers: location.protocol === 'file:' ? [] : await navigator.serviceWorker.getRegistrations() }));
  await check('no retained browser storage', async () => { expect(storage).toEqual({ local: 0, session: 0, databases: 0, cookies: '', workers: [] }); });
  await check('no network after load', async () => { expect(requests.filter(r => /^https?:/.test(r.url))).toHaveLength(0); });
  await check('no CSP or console errors', async () => { expect(violations).toHaveLength(0); expect(errors).toHaveLength(0); });
  await check('accessibility serious and critical', async () => { expect(axe.flatMap(x => x.violations).filter(v => ['serious', 'critical'].includes(v.impact))).toHaveLength(0); });
} catch (e) { cases.push({ name: 'failure', status: 'failed', error: e.message }); console.error(e.message); process.exitCode = 1; }
finally {
  mkdirSync('reports/checks/security', { recursive: true }); mkdirSync('reports/checks/quality', { recursive: true });
  writeFileSync(`reports/checks/security/${offline ? 'offline' : 'web'}_proof.json`, JSON.stringify({ ...metadata(offline ? 'npm run verify-offline' : 'npm run e2e'), cases, requests, errors, violations }, null, 2));
  writeFileSync(`reports/checks/quality/axe_${offline ? 'offline' : 'web'}.json`, JSON.stringify(axe, null, 2));
  console.info(JSON.stringify({ passed: cases.filter(c => c.status === 'passed').length, failed: cases.filter(c => c.status === 'failed').length }));
  await browser.close(); server.close();
}
