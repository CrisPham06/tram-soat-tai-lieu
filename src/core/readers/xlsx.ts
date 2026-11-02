import type { Archive } from './ooxml';
import { archiveXml, commonMetadata, relatedParts } from './ooxml';
import { all, content } from './xml';
import { reject } from '../limits';
export function readXlsx(zip: Archive) {
  const trees = archiveXml(zip), workbook = trees['xl/workbook.xml'];
  if (!workbook) return reject('format-mismatch');
  const { meta, units } = commonMetadata(trees, zip);
  const relations = relatedParts(trees).filter(r => r.source === 'xl/workbook.xml' || ['comments','threadedComment'].includes(r.type)), stringTree = trees[relations.find(r => r.source === 'xl/workbook.xml' && r.type === 'sharedStrings')?.path || 'xl/sharedStrings.xml'];
  const strings = stringTree ? all(stringTree, 'si').map(si => all(si, 't').map(content).join('')) : [];
  const rels = trees['xl/_rels/workbook.xml.rels'] ? all(trees['xl/_rels/workbook.xml.rels'], 'Relationship') : [];
  const sheets = all(workbook, 'sheet');
  for (const [i, sheet] of sheets.entries()) {
    const target = rels.find(r => r.attrs.Id === sheet.attrs.id)?.attrs.Target || `worksheets/sheet${i + 1}.xml`;
    if (sheet.attrs.id && !relations.some(r => r.source === 'xl/workbook.xml' && r.type === 'worksheet' && r.id === sheet.attrs.id)) return reject('xlsx-sheet');
    const path = relations.find(r => r.source === 'xl/workbook.xml' && r.type === 'worksheet' && r.id === sheet.attrs.id)?.path || (target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, ''));
    const tree = trees[path]; if (!tree) return reject('xlsx-sheet');
    const hidden = ['hidden', 'veryHidden'].includes(sheet.attrs.state);
    if (hidden) meta.hiddenItems++;
    const name = sheet.attrs.name || `Trang tính ${i + 1}`;
    units.push({ kind: 'cell', index: i + 1, label: `Tên trang tính ${i + 1}`, text: name, hidden });
    const hiddenRows = new Set(all(tree, 'row').filter(r => ['1', 'true'].includes(r.attrs.hidden)).map(r => r.attrs.r));
    const hiddenCols = all(tree, 'col').filter(c => ['1', 'true'].includes(c.attrs.hidden));
    meta.hiddenItems += hiddenRows.size + hiddenCols.length;
    for (const cell of all(tree, 'c')) {
      const value = all(cell, 'v').map(content).join(' '), formula = all(cell, 'f').map(content).join(' ');
      const text = cell.attrs.t === 's' ? strings[Number(value)] : cell.attrs.t === 'inlineStr' ? all(cell, 't').map(content).join('') : value;
      if (text === undefined) return reject('xlsx-string');
      const coord = cell.attrs.r || '?';
      const colNumber = [...coord.replace(/\d/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
      const cellHidden = hidden || hiddenRows.has(coord.replace(/\D/g, '')) || hiddenCols.some(c => colNumber >= Number(c.attrs.min) && colNumber <= Number(c.attrs.max));
      units.push({ kind: 'cell', index: i + 1, label: `${name}!${coord}`, text: text + (formula ? '\n' + formula : ''), hidden: cellHidden });
    }
  }
  for (const [path, tree] of Object.entries(trees)) if (/comments|threadedComments/i.test(path) || relations.some(r => r.path === path && ['comments','threadedComment'].includes(r.type))) {
    for (const c of [...all(tree, 'comment'), ...all(tree, 'threadedComment')]) { meta.commentsCount++; units.push({ kind: 'comment', index: meta.commentsCount, label: `Bình luận ${c.attrs.ref || meta.commentsCount}`, text: all(c, 't').map(content).join('') || content(c) }); }
  }
  for (const n of all(workbook, 'definedName')) units.push({ kind: 'cell', index: units.length, label: 'Tên đã định nghĩa', text: (n.attrs.name || '') + '\n' + content(n) });
  if (!sheets.length) return reject('xlsx-sheet');
  return { units, meta, warnings: [] as string[] };
}
