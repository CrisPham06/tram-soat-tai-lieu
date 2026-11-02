import { Printer, Download, Check, Pause, CornerUpRight, RotateCcw } from 'lucide-react';
import { vi } from './copy.vi';
import { nextSteps } from './next-steps.vi';
import { OUTCOMES } from '../shared/outcomes';
import type { ScreenResult, Rulepack } from '../core/types';
import { Button } from './components/button';
import { exportSheet, findingCount } from './sheet-export';
import type { Redaction } from '../worker/paste-presentation';

export function Sheet({ result, pack, busy, onAnother, redactions = [] }: { result: ScreenResult | null; pack: Rulepack; busy: string; onAnother: () => void; redactions?: Redaction[] }) {
  const Icon = result?.outcome === 'A' ? Check : result?.outcome === 'B' ? Pause : CornerUpRight;
  const visible = result?.findings || [];
  const groupOf = (ruleId: string) => {
    const rule = pack.rules.find(r => r.id === ruleId);
    if (rule?.severity === 'S3') return 'stop';
    if (rule?.group === 'personal') return 'personal';
    if (rule?.group === 'network') return 'network';
    return 'metadata';
  };
  function download() {
    if (!result) return;
    const sheet = exportSheet(result);
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...sheet, nextSteps: nextSteps[result.outcome], statement: vi.sheetFooter }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `phieu-soat-${result.sha256.slice(0, 8)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  return <section className="paper-dock" aria-labelledby="preview-heading">
    <div className="dock-title"><h2 id="preview-heading">{vi.paperPreview}</h2>{result ? <Button onClick={onAnother}><RotateCcw aria-hidden="true" />{vi.another}</Button> : <span>{vi.paperType}</span>}</div>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Vùng cuộn phiếu cần nhận bàn phím để đọc toàn bộ nội dung. */}
    <div className="paper-scroll" tabIndex={0} role="region" aria-label={vi.sheet}>
      <article className={`paper${result ? ' sheet-result' : ''}`} id="screening-sheet" aria-label={vi.sheet}>
        <p className="paper-statement">{vi.scope}</p>
        <header className="paper-header"><span className="paper-mark" aria-hidden="true">T / S</span><span>{vi.sheetSub}</span></header>
        <h3>{vi.sheet}</h3>
        <p className="paper-id">{result ? `${vi.sheetId}: ${result.sha256.slice(0, 8)}-${result.checkedAt.replace(/\D/g, '').slice(0, 14)}` : vi.blankFile}</p>
        {result ? <>
          <div className={`outcome outcome-${result.outcome}`} data-outcome={result.outcome}><div className="outcome-code"><span>{result.outcome}</span><Icon aria-hidden="true" /></div><div><h4 id="result-heading" tabIndex={-1}>{OUTCOMES[result.outcome]}</h4><p>{vi.outcomeNote[result.outcome]}</p></div></div>
          <section className="next-steps" aria-labelledby="next-heading"><h4 id="next-heading">{vi.next}</h4><p>{nextSteps[result.outcome]}</p></section>
          <dl className="sheet-details"><div><dt>{vi.fileName}</dt><dd>{result.fileName}</dd></div><div><dt>{vi.format}</dt><dd>{result.format.toUpperCase()} · {result.sizeBytes.toLocaleString('vi-VN')} B</dd></div><div><dt>{vi.where}</dt><dd>{pack.routing.destinations[result.destination].label}</dd></div><div><dt>{vi.time}</dt><dd>{new Date(result.checkedAt).toLocaleString('vi-VN', { timeZoneName: 'short' })}</dd></div><div><dt>{vi.rulepack}</dt><dd>{result.rulepackName} · {result.rulepackId}</dd></div></dl>
          <div className="hash"><span>SHA-256</span><code>{result.sha256}</code></div>
          <h4 className="findings-title">{vi.findings} <span>{findingCount(result)}</span></h4>
          {visible.length ? <div className="findings-list">{(Object.keys(vi.groups) as (keyof typeof vi.groups)[]).map(group => {
            const findings = visible.filter(f => groupOf(f.ruleId) === group);
            if (!findings.length) return null;
            return <section className="finding-group" key={group}><h5><span className={`group-badge group-${group}`}>{vi.groups[group][0]}</span><span>{result.findings.filter(f => groupOf(f.ruleId) === group).reduce((sum, f) => sum + f.count, 0)} {vi.count.toLowerCase()}</span></h5><p className="group-hint">{vi.groups[group][1]}</p>{findings.map((f, i) => <div className="finding" data-rule-id={f.ruleId} data-count={f.count} key={`${f.ruleId}-${i}`}><div><strong>{f.title}</strong><span>{f.ruleId} · {f.severity} · {vi.count}: {f.count}</span></div><p>{result.format === 'paste' && redactions.some(r => r.ruleId === f.ruleId) ? redactions.filter(r => r.ruleId === f.ruleId).map(r => `${vi.redaction} ${r.number} · ${vi.line} ${r.line}`).join('; ') : f.label}</p>{result.maxSeverity !== 'S3' && f.excerptMasked ? <code>{f.excerptMasked}</code> : null}</div>)}</section>;
          })}</div> : <p className="no-findings">{vi.noFindings}</p>}
          {result.warnings.map(w => <p className="sheet-warning" key={w}>{w}</p>)}
        </> : <div className="paper-empty"><h4>{busy || vi.empty}</h4><p>{vi.emptyHint}</p><ul className="empty-routes">{(['A', 'B', 'C'] as const).map(code => <li key={code}><span className={`legend-code outcome-${code}`}>{code}</span><strong>{OUTCOMES[code]}</strong></li>)}</ul><p>{vi.legendNote}</p></div>}
        <footer className="paper-footer">{result ? vi.sheetFooter : vi.emptyFooter}</footer>
      </article>
    </div>
    <div className="sheet-actions"><Button variant="outline" disabled={!result || !!busy} onClick={() => window.print()}><Printer aria-hidden="true" />{vi.print}</Button><Button disabled={!result || !!busy} onClick={download}><Download aria-hidden="true" />{vi.downloadSheet}</Button></div>
  </section>;
}
