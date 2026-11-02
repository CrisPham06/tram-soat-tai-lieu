import { unzipSync } from 'fflate';
import { LIMITS, reject } from '../limits';
export function readZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
  if (end < 0) return reject('zip-broken');
  const count = view.getUint16(end + 10, true), start = view.getUint32(end + 16, true), length = view.getUint32(end + 12, true);
  if (count === 65535 || count > LIMITS.zipEntries || view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== count || start + length !== end) return reject('zip-limit');
  let pos = start, total = 0;
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (pos + 46 > end || view.getUint32(pos, true) !== 0x02014b50) return reject('zip-broken');
    const flags = view.getUint16(pos + 8, true), method = view.getUint16(pos + 10, true), compressed = view.getUint32(pos + 20, true), size = view.getUint32(pos + 24, true), nl = view.getUint16(pos + 28, true), extra = view.getUint16(pos + 30, true), comment = view.getUint16(pos + 32, true), local = view.getUint32(pos + 42, true);
    const name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(pos + 46, pos + 46 + nl));
    if (flags & 1) return reject('encrypted');
    if (![0, 8].includes(method) || size === 0xffffffff || compressed === 0xffffffff || local + 30 > start || view.getUint32(local, true) !== 0x04034b50) return reject('zip-broken');
    if (names.has(name) || /(^[/\\]|^[a-z]:|(^|[/\\])\.\.([/\\]|$))/i.test(name)) return reject('zip-path');
    if (local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true) + compressed > start) return reject('zip-broken');
    names.add(name); total += size;
    if (total > LIMITS.zipBytes || (/\.(?:xml|rels)$/i.test(name) && size > LIMITS.xmlBytes)) return reject('zip-limit');
    pos += 46 + nl + extra + comment;
    if (pos > end) return reject('zip-broken');
  }
  if (pos !== end) return reject('zip-broken');
  try { return unzipSync(bytes, { filter: file => !file.name.endsWith('/') }); } catch { return reject('zip-broken'); }
}
