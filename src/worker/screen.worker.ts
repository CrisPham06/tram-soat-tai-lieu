import { DEFAULT_RULEPACK, readRulepack } from '../core/rulepack';
import { screen } from '../core/engine';
import { cleanFileName, LIMITS, ScreeningError, reject } from '../core/limits';
import { sha256 } from '../core/hash';
import { emptyMeta, type Rulepack } from '../core/types';
import { readTxt } from '../core/readers/txt';
import { readDocument } from '../core/readers/detect';
import * as pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import type { Destination } from '../shared/outcomes';
import { presentPaste } from './paste-presentation';
interface Request { bytes?: Uint8Array; fileName?: string; text?: string; destination: Destination; rulepackText?: string; validateOnly?: boolean }
(globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = pdfWorker;
self.onmessage = async (event: MessageEvent<Request>) => {
  const start = performance.now();
  try {
    const p: Rulepack = event.data.rulepackText ? readRulepack(event.data.rulepackText) : DEFAULT_RULEPACK;
    if (event.data.validateOnly) { self.postMessage({ type: 'rulepack', pack: p }); return; }
    const bytes = event.data.bytes || new TextEncoder().encode(event.data.text || '');
    if (!bytes.length) return reject('empty');
    if (bytes.length > LIMITS.fileBytes || (event.data.text?.length || 0) > LIMITS.pasteChars) return reject('file-size');
    self.postMessage({ type: 'progress', step: 'read' });
    const model = event.data.bytes ? await readDocument(bytes, event.data.fileName || '') : { format: 'paste' as const, fileName: cleanFileName('Văn bản dán'), sizeBytes: bytes.length, sha256: await sha256(bytes), units: readTxt(bytes), meta: emptyMeta(), warnings: [] };
    self.postMessage({ type: 'progress', step: 'scan' });
    const result = screen(model, p, event.data.destination, performance.now() - start);
    const presentation = model.format === 'paste' ? presentPaste(model.units[0].text, p, result) : null;
    self.postMessage({ type: 'result', result, presentation });
  } catch (e) { self.postMessage({ type: 'error', code: e instanceof ScreeningError ? e.code : 'read-failed' }); }
};
