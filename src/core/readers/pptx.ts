import type { Archive } from './ooxml';
import { archiveXml, commonMetadata, relatedParts } from './ooxml';
import { all, textRuns, content } from './xml';
import { reject } from '../limits';
export function readPptx(zip: Archive) {
  const trees = archiveXml(zip);
  if (!trees['ppt/presentation.xml']) return reject('format-mismatch');
  const { meta, units } = commonMetadata(trees, zip);
  const relations = relatedParts(trees);
  const related = relations.filter(r => ['slide','notesSlide','comments','comment'].includes(r.type));
  const paths = [...new Set([...Object.keys(trees).filter(n => /^ppt\/(slides\/slide|notesSlides\/notesSlide|comments\/comment)\d+\.xml$/.test(n)), ...related.map(r => r.path)])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const path of paths) {
    const relation = related.find(r => r.path === path);
    const tree = trees[path], index = Number(path.match(/(\d+)\.xml$/)?.[1] || 1), notes = relation?.type === 'notesSlide' || /notesSlides/.test(path), comment = relation?.type === 'comments' || relation?.type === 'comment' || /comments/.test(path);
    const hidden = all(tree, 'sld').some(s => s.attrs.show === '0' || s.attrs.show === 'false');
    if (hidden) meta.hiddenItems++;
    const label = comment ? `Trang chiếu ${index} (bình luận)` : `Trang chiếu ${index}${notes ? ' (ghi chú)' : ''}`;
    for (const p of all(tree, 'p')) { const text = textRuns(p); if (text.trim()) units.push({ kind: comment ? 'comment' as const : notes ? 'notes' as const : 'slide' as const, index, label, text, hidden }); }
    if (comment) { const comments = all(tree, 'cm'); meta.commentsCount += comments.length; for (const c of comments) { const text = all(c, 'text').map(content).join('\n'); if (text.trim()) units.push({ kind: 'comment', index, label, text, hidden }); } }
    for (const n of all(tree, 'cNvPr')) { const text = [n.attrs.descr, n.attrs.title, n.attrs.name].filter(Boolean).join('\n'); if (text) units.push({ kind: 'slide', index, label: label + ' (mô tả hình)', text, hidden }); }
  }
  if (!paths.some(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)) && !related.some(r => r.type === 'slide')) return reject('pptx-slides');
  return { units, meta, warnings: [] as string[] };
}
