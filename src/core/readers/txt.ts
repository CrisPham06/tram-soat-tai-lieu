import { reject } from '../limits';
import type { Unit } from '../types';
export function readTxt(bytes: Uint8Array): Unit[] {
  let text: string;
  try {
    const encoding = bytes[0] === 255 && bytes[1] === 254 ? 'utf-16le' : bytes[0] === 254 && bytes[1] === 255 ? 'utf-16be' : 'utf-8';
    text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch { return reject('encoding'); }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text) || !text.trim()) return reject('empty-text');
  return [{ kind: 'body', index: 1, label: 'Văn bản', text }];
}
