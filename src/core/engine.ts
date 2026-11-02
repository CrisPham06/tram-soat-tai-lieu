import { LIMITS, reject } from './limits';
import { fold, foldWithOffsets, maskMatch } from './mask';
import { maximumSeverity, route } from './routing';
import type { Destination } from '../shared/outcomes';
import type { DocumentModel, Finding, Rule, Rulepack, ScreenResult, Unit } from './types';
export function matches(rule: Rule, text: string): { start: number; end: number; value: string }[] {
  if (rule.type === 'metadata') return [];
  if (rule.type === 'regex') {
    const regex = new RegExp(rule.pattern!, (rule.flags || '') + 'g');
    const out = [];
    const parts = rule.unit === 'paragraph' ? text.split(/\r?\n/) : [text];
    let offset = 0;
    for (const part of parts) {
      for (const m of part.matchAll(regex)) { if (!m[0].length) continue; out.push({ start: offset + m.index!, end: offset + m.index! + m[0].length, value: m[0] }); if (out.length > LIMITS.maxFindings) return reject('too-many-findings'); }
      offset += part.length + (text.slice(offset + part.length, offset + part.length + 2) === '\r\n' ? 2 : 1);
    }
    return out;
  }
  const { folded: source, starts, ends, identity } = foldWithOffsets(text, rule.ignoreDiacritics, rule.ignoreCase);
  const out = [];
  for (const word of rule.words!) {
    const needle = fold(word, rule.ignoreDiacritics, rule.ignoreCase);
    let from = 0;
    while (from < source.length) { const pos = source.indexOf(needle, from); if (pos < 0) break; const start = identity ? pos : starts[pos], end = identity ? pos + needle.length : ends[pos + needle.length - 1]; out.push({ start, end, value: text.slice(start, end) }); from = pos + needle.length; if (out.length > LIMITS.maxFindings) return reject('too-many-findings'); }
  }
  return out;
}
export function screen(model: DocumentModel, pack: Rulepack, destination: Destination, durationMs = 0): ScreenResult {
  const findings: Finding[] = [];
  const warnings = [...model.warnings];
  function add(r: Rule, unit: Unit, excerpt: string, count: number) {
    if (findings.length >= LIMITS.maxFindings) return reject('too-many-findings');
    findings.push({ ruleId: r.id, title: r.title, severity: r.severity, unitKind: unit.kind, unitIndex: unit.index, label: unit.label, excerptMasked: r.severity === 'S3' ? '' : excerpt, count });
  }
  scanUnits: for (const unit of model.units) {
    if (unit.text.length > LIMITS.unitChars) return reject('unit-size');
    for (const r of pack.rules) {
      if (unit.kind === 'metadata' && r.severity !== 'S3') continue;
      const found = matches(r, unit.text);
      if (found.length) { add(r, unit, maskMatch(found[0].value, r.mask), found.length); if (r.severity === 'S3') break scanUnits; }
    }
  }
  const m = model.meta;
  const metaCounts: Record<string, number> = { 'META-01': [m.creator, m.lastModifiedBy, m.company].some(Boolean) ? 1 : 0, 'META-02': m.paths.length ? 1 : 0, 'META-03': m.hyperlinks.length ? 1 : 0, 'META-04': m.commentsCount ? 1 : 0, 'META-05': m.trackedChanges ? 1 : 0, 'META-06': m.hiddenItems ? 1 : 0, 'META-07': m.embeddedObjects + m.externalLinks ? 1 : 0 };
  if (!findings.some(f => f.severity === 'S3')) for (const r of pack.rules.filter(r => r.type === 'metadata')) if (metaCounts[r.id]) add(r, { kind: 'metadata', index: 0, label: 'Thuộc tính tệp', text: '' }, '', metaCounts[r.id]);
  const maxSeverity = maximumSeverity(findings);
  if (maxSeverity === 'S3') for (const f of findings) f.excerptMasked = '';
  let maskedText: string | undefined;
  if (model.format === 'paste' && maxSeverity !== 'S3') {
    const text = model.units[0].text;
    const intervals = pack.rules.filter(r => r.severity === 'S2').flatMap(r => matches(r, text).map(m => ({ ...m, title: r.title }))).sort((a, b) => a.start - b.start || b.end - a.end);
    let cursor = 0; maskedText = '';
    for (const interval of intervals) { if (interval.end <= cursor) continue; maskedText += text.slice(cursor, Math.max(cursor, interval.start)) + `[ĐÃ CHE: ${interval.title}]`; cursor = interval.end; }
    maskedText += text.slice(cursor);
  }
  return { format: model.format, fileName: model.fileName, sizeBytes: model.sizeBytes, sha256: model.sha256, destination, outcome: route(pack, destination, maxSeverity), maxSeverity, findings, warnings, rulepackId: pack.id, rulepackName: pack.name, checkedAt: new Date().toISOString(), durationMs, maskedText };
}
