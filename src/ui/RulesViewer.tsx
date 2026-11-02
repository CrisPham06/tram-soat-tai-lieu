import { useEffect, useState } from 'react';
import { Search, FileCode2 } from 'lucide-react';
import type { Rulepack } from '../core/types';
import { vi } from './copy.vi';
import { sha256 } from '../core/hash';
export function RulesViewer({ pack, source }: { pack: Rulepack; source: string }) {
  const [query, setQuery] = useState('');
  const [hash, setHash] = useState('');
  useEffect(() => { let active = true; void sha256(new TextEncoder().encode(source)).then(value => { if (active) setHash(value); }); return () => { active = false; }; }, [source]);
  const rows = pack.rules.filter(r => `${r.id} ${r.title}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  return <section className="rules-section" id="bo-quy-tac"><div className="section-title"><div><h2>{vi.rulesTitle}</h2><p>{vi.rulesHint}</p></div><FileCode2 aria-hidden="true" size={28} strokeWidth={1.3} /></div><details><summary>{pack.name}<span>{pack.id} · {pack.rules.length} {vi.rule.toLowerCase()}</span></summary><div className="rules-body"><p className="rules-hash">SHA-256 <code>{hash}</code></p><label className="search-label" htmlFor="rule-search"><Search size={18} aria-hidden="true" /><span className="sr-only">{vi.search}</span><input id="rule-search" placeholder={vi.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} /></label>{(['S3', 'S2', 'S1'] as const).map(level => { const rules = rows.filter(r => r.severity === level); return rules.length ? <section className="rule-level" key={level}><h3><span className={`severity severity-${level}`}>{level}</span>{pack.severities[level]}</h3><table><thead><tr><th>{vi.rule}</th><th>{vi.findings}</th></tr></thead><tbody>{rules.map(r => <tr key={r.id}><td><code>{r.id}</code></td><td>{r.title}</td></tr>)}</tbody></table></section> : null; })}{!rows.length ? <p>{vi.rulesEmpty}</p> : null}</div></details></section>;
}
