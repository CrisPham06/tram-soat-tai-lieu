import type { Archive } from './ooxml';
import { archiveXml, commonMetadata, relatedParts } from './ooxml';
import { all, textRuns } from './xml';
import { reject } from '../limits';
import type { UnitKind } from '../types';
export function readDocx(zip: Archive) {
  if (!zip['word/document.xml']) return reject('format-mismatch');
  const trees = archiveXml(zip), { meta, units } = commonMetadata(trees, zip);
  const relations = relatedParts(trees);
  for (const [name, tree] of Object.entries(trees)) {
    const related = relations.find(r => r.path === name && ['header','footer','footnotes','endnotes','comments'].includes(r.type));
    if (!related && !/^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/.test(name)) continue;
    const classification = related?.type || name;
    const kind: UnitKind = /header/.test(classification) ? 'header' : /footer/.test(classification) ? 'footer' : /comments/.test(classification) ? 'comment' : /notes/.test(classification) ? 'notes' : 'body';
    const prefix = { header: 'Đầu trang', footer: 'Chân trang', comment: 'Bình luận', notes: 'Chú thích', body: 'Đoạn' }[kind as 'header' | 'footer' | 'comment' | 'notes' | 'body'];
    all(tree, 'p').forEach((p, i) => { const text = textRuns(p); if (text.trim()) units.push({ kind, index: i + 1, label: `${prefix} ${i + 1}`, text, hidden: all(p, 'vanish').some(v => !['0', 'false', 'off'].includes(v.attrs.val || '1')) }); });
    meta.commentsCount += all(tree, 'comment').length;
    meta.trackedChanges += ['ins', 'del', 'moveFrom', 'moveTo'].reduce((n, tag) => n + all(tree, tag).length, 0);
    meta.hiddenItems += all(tree, 'vanish').filter(v => !['0', 'false', 'off'].includes(v.attrs.val || '1')).length;
  }
  if (!units.some(x => x.text.trim())) return reject('empty-text');
  return { units, meta, warnings: [] as string[] };
}
