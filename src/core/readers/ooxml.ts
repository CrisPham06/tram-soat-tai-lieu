import { parseXml, all, content, type XmlNode } from './xml';
import type { Meta, Unit } from '../types';
import { emptyMeta } from '../types';
import { reject } from '../limits';
export type Archive = Record<string, Uint8Array>;
export function archiveXml(zip: Archive) { return Object.fromEntries(Object.entries(zip).filter(([name]) => /\.(xml|rels)$/i.test(name)).map(([name, bytes]) => [name, parseXml(bytes)])); }
export function relatedParts(trees: Record<string, XmlNode>) {
  const parts: { source: string; path: string; type: string; id: string }[] = [];
  for (const [path, tree] of Object.entries(trees)) {
    if (!path.endsWith('.rels')) continue;
    const source = path === '_rels/.rels' ? '' : path.replace(/(^|\/)_rels\//, '$1').replace(/\.rels$/, '');
    const ids = new Set<string>();
    for (const r of all(tree, 'Relationship')) {
      if (!r.attrs.Id || ids.has(r.attrs.Id)) return reject('xml-broken');
      ids.add(r.attrs.Id);
      if (r.attrs.TargetMode === 'External') continue;
      const type = (r.attrs.Type || '').split('/').pop() || '';
      if (!['header','footer','footnotes','endnotes','comments','comment','threadedComment','slide','notesSlide','worksheet','sharedStrings'].includes(type)) continue;
      let target: string;
      try { target = decodeURIComponent((r.attrs.Target || '').split('#')[0]); } catch { return reject('zip-path'); }
      if (!target || target.includes('\\') || /^[a-z]+:/i.test(target)) return reject('zip-path');
      const segments = target.startsWith('/') ? [] : source.split('/').slice(0,-1);
      for (const segment of target.split('/')) { if (!segment || segment === '.') continue; if (segment === '..') { if (!segments.length) return reject('zip-path'); segments.pop(); } else segments.push(segment); }
      const resolved = segments.join('/');
      if (!trees[resolved]) return reject('read-failed');
      parts.push({ source, path: resolved, type, id: r.attrs.Id || '' });
    }
  }
  return parts;
}
export function commonMetadata(trees: Record<string, XmlNode>, zip: Archive) {
  const meta: Meta = emptyMeta(), units: Unit[] = [];
  for (const [name, tree] of Object.entries(trees)) {
    if (name.startsWith('docProps/')) {
      for (const [tag, field] of [['creator', 'creator'], ['lastModifiedBy', 'lastModifiedBy'], ['Company', 'company'], ['title', 'title']] as const) { const value = all(tree, tag).map(content).join(' '); if (value) meta[field] = value; }
      units.push({ kind: 'metadata', index: units.length + 1, label: 'Thuộc tính tệp', text: content(tree) });
    }
    for (const r of all(tree, 'Relationship')) {
      const target = r.attrs.Target || '';
      if (r.attrs.TargetMode === 'External') {
        if (/^(https?:|mailto:)/i.test(target)) meta.hyperlinks.push(target);
        if (/externalLink/i.test(r.attrs.Type || '')) meta.externalLinks++;
      }
      if (/file:\/\/\/|[a-z]:\\Users\\|^\\\\/i.test(target)) meta.paths.push(target);
    }
    if (/externalLinks\//.test(name)) meta.externalLinks++;
    if (name.startsWith('docProps/') && /file:\/\/\/|[a-z]:\\+Users\\+|\\\\/i.test(content(tree))) meta.paths.push(name);
  }
  meta.embeddedObjects = Object.keys(zip).filter(n => /\/embeddings\//.test(n)).length;
  return { meta, units };
}
