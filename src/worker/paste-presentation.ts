import { matches } from '../core/engine';
import type { Rulepack, ScreenResult } from '../core/types';
export interface Redaction { number: number; ruleId: string; line: number }
export interface PastePresentation { text: string; parts: { text: string; number?: number }[]; redactions: Redaction[] }
// Chỉ tạo dữ liệu trình bày trong Worker; không chuyển văn bản gốc về giao diện.
export function presentPaste(text: string, pack: Rulepack, result: ScreenResult): PastePresentation | null {
  if (result.maxSeverity === 'S3') return null;
  const intervals = pack.rules.filter(r => r.severity === 'S2').flatMap(r => matches(r, text).map(m => ({ ...m, title: r.title, ruleId: r.id }))).sort((a, b) => a.start - b.start || b.end - a.end);
  const groups: { start: number; end: number; items: typeof intervals }[] = [];
  for (const interval of intervals) {
    const previous = groups.at(-1);
    if (previous && interval.start < previous.end) { previous.end = Math.max(previous.end, interval.end); previous.items.push(interval); }
    else groups.push({ start: interval.start, end: interval.end, items: [interval] });
  }
  const parts: PastePresentation['parts'] = [], redactions: Redaction[] = [];
  let cursor = 0;
  for (const [index, group] of groups.entries()) {
    parts.push({ text: text.slice(cursor, group.start) });
    const number = index + 1, titles = [...new Set(group.items.map(item => item.title))];
    parts.push({ text: `[ĐÃ CHE ${number}: ${titles.join('; ')}]`, number });
    const seen = new Set<string>();
    for (const item of group.items) {
      const line = text.slice(0, item.start).split(/\r?\n/).length, key = `${item.ruleId}:${line}`;
      if (!seen.has(key)) redactions.push({ number, ruleId: item.ruleId, line });
      seen.add(key);
    }
    cursor = group.end;
  }
  parts.push({ text: text.slice(cursor) });
  return { text: parts.map(p => p.text).join(''), parts, redactions };
}
