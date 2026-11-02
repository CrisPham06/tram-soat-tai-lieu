import { LIMITS, reject, cleanFileName } from '../limits';
import { sha256 } from '../hash';
import { readZip } from './zip-guard';
import { readTxt } from './txt';
import { readDocx } from './docx';
import { readPdf } from './pdf';
import { readXlsx } from './xlsx';
import { readPptx } from './pptx';
import { emptyMeta, type DocumentModel, type Format } from '../types';
export async function readDocument(bytes: Uint8Array, fileName: string): Promise<DocumentModel> {
  if (!bytes.length) return reject('empty');
  if (bytes.length > LIMITS.fileBytes) return reject('file-size');
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!['txt', 'docx', 'xlsx', 'pptx', 'pdf'].includes(ext || '')) return reject('unsupported');
  let format: Format = 'txt';
  let data;
  if (new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-') { format = 'pdf'; if (ext !== format) return reject('format-mismatch'); data = await readPdf(bytes); }
  else if (bytes[0] === 80 && bytes[1] === 75) { const zip = readZip(bytes); format = zip['word/document.xml'] ? 'docx' : zip['xl/workbook.xml'] ? 'xlsx' : zip['ppt/presentation.xml'] ? 'pptx' : 'txt'; if (ext !== format || format === 'txt') return reject('format-mismatch'); data = format === 'docx' ? readDocx(zip) : format === 'xlsx' ? readXlsx(zip) : readPptx(zip); }
  else { if (ext !== 'txt') return reject('format-mismatch'); data = { units: readTxt(bytes), meta: emptyMeta(), warnings: [] }; }
  return { ...data, format, fileName: cleanFileName(fileName), sizeBytes: bytes.length, sha256: await sha256(bytes) };
}
