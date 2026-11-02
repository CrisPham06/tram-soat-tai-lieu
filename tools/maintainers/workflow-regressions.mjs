import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startServer } from '../serve.mjs';
import { metadata } from './meta.mjs';
const before = process.argv.includes('--before');
const server = startServer(0); await new Promise(r => server.once('listening', r));
const browser = await chromium.launch({ headless: true, executablePath: ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync) });
const rows = [], base = `http://127.0.0.1:${server.address().port}`;
const notice = 'TÀI LIỆU GIẢ LẬP PHỤC VỤ KIỂM THỬ, KHÔNG PHẢI TÀI LIỆU THẬT';
async function check(name, action) {
  const context = await browser.newContext({ reducedMotion: 'reduce' }), page = await context.newPage();
  try { await page.goto(base); await page.locator('h1').waitFor(); await action(page, context); rows.push({ name, pass: true }); }
  catch (error) { rows.push({ name, pass: false, error: error.message }); }
  finally { await context.close(); }
}
async function paste(page, value) { await page.getByRole('button', { name: 'Dán văn bản', exact: true }).click(); await page.getByLabel('Văn bản cần soát').fill(value); await page.getByRole('button', { name: 'Soát văn bản', exact: true }).click(); await expect(page.locator('.outcome-code > span')).toBeVisible(); }
try {
  await check('reset-focus', async page => { await page.getByRole('button', { name: 'Xóa phiên làm việc', exact: true }).click(); await page.getByRole('button', { name: 'Xóa phiên', exact: true }).click(); await expect(page.locator('input[name=destination]').first()).toBeFocused(); });
  await check('paste-edit-focus', async page => { await paste(page, notice + '\nBuổi sinh hoạt.'); await page.getByRole('button', { name: 'Sửa lựa chọn', exact: true }).click(); await expect(page.getByLabel('Văn bản cần soát')).toBeFocused(); });
  await check('finding-count', async page => { await paste(page, notice + '\n0912345678 và 0987654321'); await expect(page.locator('.findings-title > span')).toHaveText('2'); });
  await check('numbered-redactions', async page => { await paste(page, notice + '\n0912345678\n0987654321'); await expect(page.getByLabel('Bản văn bản đã che', { exact: true })).toContainText('[ĐÃ CHE 1:'); await expect(page.locator('.finding')).toContainText('Dòng 2'); await expect(page.locator('.finding')).toContainText('Dòng 3'); });
  await check('feedback-sensitive-warning', async page => { await page.goto(base + '/phan-hoi/'); for (const text of ['TỐI MẬT', '0912345678']) { await page.locator('#q3_excess_missing').fill(text); await expect(page.locator('[role=alert]')).toContainText('Không gửi'); } });
  await check('axe-landmarks', async page => { const result = await new AxeBuilder({ page }).analyze(); expect(result.violations).toEqual([]); });
  await check('destination-clears-sheet-with-notice', async page => { await page.getByRole('radio', { name: 'Nền tảng quốc gia' }).check(); await page.locator('input[accept=".docx,.pdf,.txt,.xlsx,.pptx"]').setInputFiles({ name: 'gia.txt', mimeType: 'text/plain', buffer: Buffer.from(notice) }); await expect(page.locator('.outcome')).toBeVisible(); await page.getByRole('button', { name: 'Sửa lựa chọn', exact: true }).click(); await page.getByRole('radio', { name: 'Gửi ra ngoài' }).check(); await expect(page.locator('.outcome')).toHaveCount(0); await expect(page.locator('.notice')).toContainText('soát lại'); });
  await check('session-cancels-late-read', async page => { await page.getByRole('radio', { name: 'Nền tảng quốc gia' }).check(); await page.evaluate(() => { const original = File.prototype.arrayBuffer; File.prototype.arrayBuffer = async function() { await new Promise(r => setTimeout(r, 250)); return original.call(this); }; }); await page.locator('input[accept=".docx,.pdf,.txt,.xlsx,.pptx"]').setInputFiles({ name: 'gia.txt', mimeType: 'text/plain', buffer: Buffer.from(notice) }); await page.getByRole('button', { name: 'Xóa phiên làm việc', exact: true }).click(); await page.getByRole('button', { name: 'Xóa phiên', exact: true }).click(); await page.waitForTimeout(400); await expect(page.locator('.outcome')).toHaveCount(0); });
  if (!before) {
    const input = page => page.locator('input[accept=".docx,.pdf,.txt,.xlsx,.pptx"]');
    await check('rapid-files-latest-wins', async page => {
      await page.getByRole('radio', { name: 'Nền tảng quốc gia' }).check();
      await page.evaluate(() => { const original = File.prototype.arrayBuffer; File.prototype.arrayBuffer = async function() { if (this.name === 'slow.txt') await new Promise(r => setTimeout(r, 500)); return original.call(this); }; });
      await input(page).setInputFiles({ name: 'slow.txt', mimeType: 'text/plain', buffer: Buffer.from(notice + '\nTỐI MẬT') });
      await input(page).setInputFiles({ name: 'latest.txt', mimeType: 'text/plain', buffer: Buffer.from(notice) });
      await expect(page.locator('.outcome-code > span')).toHaveText('A'); await page.waitForTimeout(600); await expect(page.locator('.sheet-details')).toContainText('latest.txt'); await expect(page.locator('.outcome-code > span')).toHaveText('A');
    });
    await check('rulepack-locked-during-read', async page => {
      await page.locator('input[accept=".json"]').setInputFiles('rulepacks/demo-v1.json'); await expect(page.locator('.notice')).toContainText('Đã nạp');
      await page.getByRole('radio',{name:'Nền tảng quốc gia'}).check();
      await page.evaluate(()=>{const original=File.prototype.arrayBuffer;File.prototype.arrayBuffer=async function(){await new Promise(r=>setTimeout(r,400));return original.call(this);};});
      await input(page).setInputFiles({name:'gia.txt',mimeType:'text/plain',buffer:Buffer.from(notice)});
      await expect(page.getByRole('button',{name:'Dùng bộ mặc định',exact:true})).toBeDisabled(); await expect(page.locator('button').filter({hasText:'Nạp bộ quy tắc từ máy'})).toBeDisabled();
      await expect(page.locator('.outcome-code > span')).toHaveText('A'); await expect(page.locator('.sheet-details')).toContainText('demo-1.0.0');
    });
    await check('file-refusals-and-boundary', async page => {
      await page.getByRole('radio', { name: 'Nền tảng quốc gia' }).check();
      for (const [name, buffer, expected] of [['empty.txt', Buffer.alloc(0), 'Tệp trống'], ['wrong.docx', Buffer.from(notice), 'Đuôi tệp'], ['limit.txt', Buffer.alloc(25 * 1024 * 1024, 65), 'quá dài'], ['large.txt', Buffer.alloc(25 * 1024 * 1024 + 1), 'vượt giới hạn']]) {
        await input(page).setInputFiles({ name, mimeType: 'application/octet-stream', buffer }); await expect(page.getByRole('alert')).toContainText(expected); await expect(page.locator('.outcome')).toHaveCount(0);
      }
      for (const file of ['X01_docx.docx', 'X02_pdf.pdf', 'X03_pdf.pdf', 'X04_docx.docx']) {
        const path = 'datasets/synthetic/files/' + file; if (!existsSync(path)) throw new Error('Thiếu mẫu từ chối ' + file);
        await input(page).setInputFiles(path); await expect(page.getByRole('alert')).toBeVisible();
      }
    });
    await check('sheet-json-hash-theme-and-new-session', async page => {
      const bytes = Buffer.from(notice + '\n0912345678 và 0987654321'), hash = createHash('sha256').update(bytes).digest('hex');
      await page.getByRole('radio', { name: 'Nền tảng quốc gia' }).check();
      await input(page).setInputFiles({ name: '<img onerror=alert(1)>\u202egia.txt', mimeType: 'text/plain', buffer: bytes }); await expect(page.locator('.hash')).toContainText(hash);
      await page.getByRole('button', { name: 'Chế độ tối', exact: true }).click(); await expect(page.locator('.hash')).toContainText(hash);
      const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'Tải phiếu JSON', exact: true }).click(); const download = await event, data = JSON.parse(readFileSync(await download.path(), 'utf8'));
      expect(data.sha256).toBe(hash); expect(data.destination).toBe('national'); expect(data.findingCount).toBe(data.findings.reduce((sum, f) => sum + f.count, 0)); expect(data.findings.every(f => !f.excerptMasked)).toBe(true); expect(data).not.toHaveProperty('maskedText'); expect(data.fileName).not.toContain('\u202e');
      await page.getByRole('button', { name: 'Soát tài liệu khác', exact: true }).click(); await expect(page.locator('.outcome')).toHaveCount(0); await expect(page.getByRole('button', { name: 'In hoặc lưu PDF', exact: true })).toBeDisabled();
      expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
    });
    await check('paste-empty-long-and-stop', async page => {
      await page.getByRole('button', { name: 'Dán văn bản', exact: true }).click(); const start = page.getByRole('button', { name: 'Soát văn bản', exact: true });
      await expect(start).toBeDisabled(); await page.getByLabel('Văn bản cần soát').fill(' \n\t '); await expect(start).toBeDisabled();
      await page.getByLabel('Văn bản cần soát').fill('a'.repeat(2000001)); await start.click(); await expect(page.getByRole('alert')).toContainText('quá dài');
      await page.getByLabel('Văn bản cần soát').fill(notice + '\nTỐI MẬT 0912345678'); await start.click(); await expect(page.locator('.outcome-code > span')).toHaveText('C'); await expect(page.getByRole('button', { name: 'Sao chép bản đã che' })).toBeDisabled(); await expect(page.locator('.masked-panel')).not.toContainText('0912345678'); await expect(page.locator('.finding code')).toHaveCount(0); await expect(page.locator('#screening-sheet')).not.toContainText('0912345678');
    });
    await check('rulepack-rejects-invalid-and-dangerous', async page => {
      const original = JSON.parse(readFileSync('rulepacks/demo-v1.json', 'utf8'));
      for (const content of ['{', '{}', JSON.stringify({ ...original, rules: [{ ...original.rules.find(r => r.type === 'regex'), pattern: '(a+)+$' }] })]) { await page.locator('input[accept=".json"]').setInputFiles({ name: 'gia.json', mimeType: 'application/json', buffer: Buffer.from(content) }); await expect(page.getByRole('alert')).toBeVisible(); }
    });
    await check('keyboard-drop-dialog-and-live-region', async page => {
      await page.getByRole('radio', { name: 'Nền tảng quốc gia' }).check(); await page.locator('.drop-zone').focus(); const chooser = page.waitForEvent('filechooser'); await page.keyboard.press('Space'); await (await chooser).setFiles({ name: 'gia.txt', mimeType: 'text/plain', buffer: Buffer.from(notice) }); await expect(page.locator('#result-heading')).toBeFocused(); await expect(page.locator('[aria-live=polite]')).toContainText('A.');
      await page.getByRole('button', { name: 'Xóa phiên làm việc', exact: true }).click(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(page.locator('.outcome')).toBeVisible();
    });
  }
} finally {
  const output = 'reports/checks/security'; mkdirSync(output, { recursive: true });
  writeFileSync(`${output}/workflow_${before ? 'before' : 'after'}.json`, JSON.stringify({ ...metadata('node tools/workflow-regressions.mjs'), rows }, null, 2));
  console.info(JSON.stringify(rows.map(({ name, pass }) => ({ name, pass }))));
  if (!before && rows.some(row => !row.pass)) process.exitCode = 1;
  await browser.close(); server.close();
}
