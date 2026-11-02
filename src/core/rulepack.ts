import demo from '../../rulepacks/demo-v1.json';
import type { Rulepack } from './types';
import { reject, LIMITS } from './limits';
import { DESTINATIONS } from '../shared/outcomes';
export function parseRulepack(value: unknown, trusted = false): Rulepack {
  if (!value || typeof value !== 'object') return reject('rulepack-schema');
  const p = value as Rulepack;
  if (p.schema !== 'tram-soat-rulepack/1' || typeof p.id !== 'string' || !p.id.length || p.id.length > 40 || typeof p.name !== 'string' || p.name.length > 200 || !Array.isArray(p.rules) || !p.rules.length || p.rules.length > 300) return reject('rulepack-schema');
  const ids = new Set();
  for (const r of p.rules) {
    if (!r || typeof r.id !== 'string' || ids.has(r.id) || r.id.length > 40 || typeof r.title !== 'string' || r.title.length > 200 || !['S1', 'S2', 'S3'].includes(r.severity) || !['full', 'middle', 'none'].includes(r.mask) || !['regex', 'wordlist', 'metadata'].includes(r.type)) return reject('rulepack-schema');
    ids.add(r.id);
    if (r.type === 'regex') {
      if (typeof r.pattern !== 'string' || r.pattern.length > 2000 || !['text', 'paragraph'].includes(r.unit || '') || /[^imu]/.test(r.flags || '')) return reject('rulepack-schema');
      const bundledPattern = demo.rules.some(original => 'pattern' in original && original.pattern === r.pattern);
      if (!trusted && !bundledPattern && (/\([^)]*[+*][^)]*\)[+*{]/.test(r.pattern) || /\\[1-9]/.test(r.pattern) || /\([^)]*\|[^)]*\)[+*{]/.test(r.pattern))) return reject('rulepack-regex-risk');
      try { new RegExp(r.pattern, r.flags); } catch { return reject('rulepack-regex'); }
    }
    if (r.type === 'wordlist' && (!Array.isArray(r.words) || !r.words.length || r.words.length > 1000 || r.words.some(w => typeof w !== 'string' || !w || w.length > 200))) return reject('rulepack-schema');
    if (r.type === 'metadata' && !/^META-0[1-7]$/.test(r.id)) return reject('rulepack-schema');
  }
  for (const d of DESTINATIONS) {
    const route = p.routing?.destinations?.[d];
    if (!route || typeof route.label !== 'string' || route.label.length > 200 || route.S3 !== 'C' || ['none', 'S1', 'S2'].some(k => !['A', 'B', 'C'].includes(route[k as 'none' | 'S1' | 'S2']))) return reject('rulepack-schema');
  }
  return p;
}
export const DEFAULT_RULEPACK = parseRulepack(demo, true);
export function readRulepack(text: string) {
  if (text.length > LIMITS.rulepackBytes) return reject('rulepack-size');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return reject('rulepack-json'); }
  return parseRulepack(parsed);
}
