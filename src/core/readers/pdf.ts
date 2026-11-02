import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { LIMITS, reject } from '../limits';
import { emptyMeta, type Unit } from '../types';
export async function readPdf(bytes: Uint8Array) {
  if (/\/Encrypt\b/.test(new TextDecoder('latin1').decode(bytes))) return reject('encrypted');
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, disableFontFace: true, useWorkerFetch: false, enableXfa: false, verbosity: 0 });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > LIMITS.maxPages) return reject('pdf-pages');
    const units: Unit[] = [], meta = emptyMeta(), missing: number[] = [];
    const { info, metadata } = await pdf.getMetadata();
    const record = info as Record<string, unknown>;
    meta.creator = typeof record.Author === 'string' ? record.Author : undefined;
    meta.title = typeof record.Title === 'string' ? record.Title : undefined;
    const properties = Object.values(record).filter(x => typeof x === 'string').join('\n') + '\n' + (metadata ? String(metadata.getRaw()) : '');
    if (/file:\/\/\/|[a-z]:\\+Users\\+|\\\\/i.test(properties)) meta.paths.push('Thuộc tính PDF');
    units.push({ kind: 'metadata', index: 0, label: 'Thuộc tính PDF', text: properties });
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i), textContent = await page.getTextContent();
      const text = textContent.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
      if (text.length > LIMITS.unitChars) return reject('unit-size');
      if (!text.trim()) missing.push(i);
      units.push({ kind: 'pdfpage', index: i, label: `Trang ${i}`, text });
      const annotations = await page.getAnnotations();
      for (const a of annotations) { if (typeof a.url === 'string') meta.hyperlinks.push(a.url); if (a.contentsObj?.str) { meta.commentsCount++; units.push({ kind: 'comment', index: i, label: `Trang ${i} (bình luận)`, text: a.contentsObj.str }); } }
      page.cleanup();
    }
    if (missing.length === pdf.numPages) return reject('pdf-no-text');
    return { units, meta, warnings: missing.length ? [`${missing.length} trang không có lớp chữ, chưa được soát (${missing.join(', ')})`] : [] };
  } catch (e) { if (e instanceof Error && e.name === 'ScreeningError') throw e; return reject(e instanceof Error && /password/i.test(e.name) ? 'encrypted' : 'pdf-broken'); }
  finally { await task.destroy(); }
}
