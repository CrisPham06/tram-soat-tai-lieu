import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Building2, Globe2, LockKeyhole, Network, Upload, Clipboard, FileText, Trash2, Info, CircleHelp, FileCode2 } from 'lucide-react';
import ScreenWorker from '../worker/screen.worker?worker&inline';
import { DEFAULT_RULEPACK } from '../core/rulepack';
import { LIMITS } from '../core/limits';
import type { Rulepack, ScreenResult } from '../core/types';
import { DESTINATIONS, type Destination } from '../shared/outcomes';
import { SYNTHETIC_NOTICE } from '../shared/version';
import { vi } from './copy.vi';
import { Button } from './components/button';
import { Alert } from './components/alert';
import { Sheet } from './Sheet';
import { RulesViewer } from './RulesViewer';
import { useMotion } from './motion/useMotion';
import { ThemeToggle } from './ThemeToggle';
import { PublicFooter } from './PublicFooter';
import { publicLinks } from './public-links';
import defaultPackText from '../../rulepacks/demo-v1.json?raw';
import type { PastePresentation } from '../worker/paste-presentation';
const destinationIcons = { internal: Building2, national: Network, ai: Clipboard, outside: Globe2 };
export function App() {
  const [destination, setDestination] = useState<Destination | null>(null), [mode, setMode] = useState<'file' | 'paste'>('file');
  const [paste, setPaste] = useState(''), [result, setResult] = useState<ScreenResult | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(''), [drag, setDrag] = useState(false), [notice, setNotice] = useState('');
  const [pack, setPack] = useState<Rulepack>(DEFAULT_RULEPACK), [rulepackText, setRulepackText] = useState('');
  const [editing, setEditing] = useState(false);
  const [presentation, setPresentation] = useState<PastePresentation | null>(null);
  const dropFrame = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null), worker = useRef<Worker | null>(null), watchdog = useRef<ReturnType<typeof setTimeout> | null>(null), generation = useRef(0), fileInput = useRef<HTMLInputElement>(null), ruleInput = useRef<HTMLInputElement>(null), dialog = useRef<HTMLDialogElement>(null);
  function terminate() { generation.current++; worker.current?.terminate(); worker.current = null; if (watchdog.current) clearTimeout(watchdog.current); watchdog.current = null; }
  useEffect(() => () => { worker.current?.terminate(); if (watchdog.current) clearTimeout(watchdog.current); }, []);
  useMotion(root, result ? result.checkedAt : error || 'initial');
  useEffect(() => {
    if (!result) return;
    root.current?.querySelector<HTMLElement>('#result-heading')?.focus({ preventScroll: true });
    if (matchMedia('(max-width: 1099px)').matches) root.current?.querySelector('.paper-dock')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }, [result]);
  function clearResult() { setResult(null); setPresentation(null); setError(''); setNotice(''); }
  async function run(file?: File, rulesFile?: File) {
    if (!rulesFile && (mode === 'file' && !destination || mode === 'paste' && !paste.trim())) return;
    terminate(); const token = generation.current;
    clearResult(); setBusy(vi.progress.read);
    const fail = (code: string) => { if (token !== generation.current) return; terminate(); setBusy(''); setError(vi.errors[code] || vi.errors['read-failed']); setPaste(''); if (fileInput.current) fileInput.current.value = ''; if (ruleInput.current) ruleInput.current.value = ''; };
    watchdog.current = setTimeout(() => fail('timeout'), LIMITS.timeoutMs);
    try {
      if (file && file.size > LIMITS.fileBytes) { fail('file-size'); return; }
      if (rulesFile && rulesFile.size > LIMITS.rulepackBytes) { fail('rulepack-size'); return; }
      if (!file && !rulesFile && paste.length > LIMITS.pasteChars) { fail('unit-size'); return; }
      const bytes = file ? new Uint8Array(await file.arrayBuffer()) : undefined;
      const custom = rulesFile ? await rulesFile.text() : rulepackText;
      if (token !== generation.current) return;
      const w = new ScreenWorker(); worker.current = w;
      performance.mark('screening-worker-start');
      w.onerror = () => fail('read-failed');
      w.onmessage = event => {
        if (token !== generation.current) return;
        if (!['progress', 'error', 'rulepack', 'result'].includes(event.data.type)) return;
        if (event.data.type === 'progress') { setBusy(vi.progress[event.data.step as keyof typeof vi.progress] || vi.progress.summarize); return; }
        if (event.data.type === 'error') { fail(event.data.code); return; }
        if (event.data.type === 'rulepack') { setPack(event.data.pack); setRulepackText(custom); setNotice(vi.rulesImported); }
        if (event.data.type === 'result') { performance.mark('screening-worker-result'); setResult(event.data.result); setPresentation(event.data.presentation || null); setPaste(''); setEditing(false); }
        terminate(); setBusy(''); if (fileInput.current) fileInput.current.value = ''; if (ruleInput.current) ruleInput.current.value = '';
      };
      w.postMessage({ bytes, fileName: file?.name, text: file ? undefined : paste, destination: mode === 'paste' ? 'ai' : destination, rulepackText: custom, validateOnly: !!rulesFile }, bytes ? [bytes.buffer] : []);
    } catch { fail('read-failed'); }
  }
  function reset() { terminate(); clearResult(); setBusy(''); setPaste(''); setDrag(false); setDestination(null); setMode('file'); setPack(DEFAULT_RULEPACK); setRulepackText(''); setEditing(false); if (fileInput.current) fileInput.current.value = ''; if (ruleInput.current) ruleInput.current.value = ''; dialog.current?.close(); requestAnimationFrame(() => { root.current?.querySelector<HTMLInputElement>('input[name="destination"]')?.focus(); }); }
  async function copy() { if (!presentation?.text || result?.maxSeverity === 'S3') return; try { await navigator.clipboard.writeText(presentation.text); setNotice(vi.copied); } catch { setNotice(vi.copyFailed); } }
  const enabled = !!destination && !busy;
  return <div className="app" ref={root}>
    <a href="#ban-soat" className="skip-link">{vi.skip}</a>
    <div className="status-strip" role="region" aria-label={vi.statementRegion}><div className="shell"><span><LockKeyhole size={14} aria-hidden="true" />{vi.statement}</span><span>{vi.session}</span></div></div>
    <header className="site-header shell"><a href="#ban-soat" className="brand"><svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M7 27v11m30-11v11M4 13h36v9H4zM12 13l6 9m7-9 6 9M3 38h10m18 0h10" stroke="currentColor" strokeWidth="2" /></svg><div><h1>{vi.name}</h1><span>{vi.tagline}</span></div></a><nav aria-label={vi.navigation}><a href="#ban-soat">{vi.desk}</a><a href="#cach-su-dung">{vi.guide}</a><a href="#bo-quy-tac">{vi.rules}</a></nav><ThemeToggle /></header>
    <main className="shell"><div className="workspace" id="ban-soat"><section className="workbench" aria-labelledby="workbench-heading">
      <div className="workbench-heading"><h2 id="workbench-heading">{vi.heading}</h2><p>{vi.intro}</p><p className="scope-note">{vi.scope}</p></div>
      {result && !editing ? <div className="session-summary"><span>{vi.destinations[result.destination][0]}</span><strong>{result.fileName}</strong><Button variant="outline" onClick={() => { setEditing(true); requestAnimationFrame(() => (mode === 'paste' ? root.current?.querySelector<HTMLTextAreaElement>('#paste-text') : root.current?.querySelector<HTMLInputElement>('input[name="destination"]:checked'))?.focus()); }}>{vi.edit}</Button></div> : null}
      <div hidden={!!result && !editing} className="input-controls">
      <fieldset disabled={!!busy || mode === 'paste'} className="destinations"><legend><span className="step-number">1</span>{vi.destination}</legend><p className="step-hint">{mode === 'paste' ? vi.pasteHint : vi.destinationHint}</p><div className="destination-grid">{DESTINATIONS.map(d => { const Icon = destinationIcons[d], selected = mode === 'paste' ? d === 'ai' : destination === d; return <label className={`destination-option${selected ? ' selected' : ''}`} key={d}><input type="radio" name="destination" value={d} checked={selected} onChange={() => { setDestination(d); clearResult(); setNotice(vi.destinationChanged); }} /><span className="destination-top"><Icon aria-hidden="true" /><span className="radio-indicator" /></span><strong>{vi.destinations[d][0]}</strong><span>{vi.destinations[d][1]}</span></label>; })}</div></fieldset>
      <section className="input-step" aria-labelledby="input-heading"><h3 id="input-heading"><span className="step-number">2</span>{vi.add}</h3><div className="mode-switch" role="group" aria-label={vi.add}><Button variant="ghost" disabled={!!busy} aria-pressed={mode === 'file'} onClick={() => { setMode('file'); clearResult(); setPaste(''); }}><FileText aria-hidden="true" />{vi.fileMode}</Button><Button variant="ghost" disabled={!!busy} aria-pressed={mode === 'paste'} onClick={() => { setMode('paste'); clearResult(); }}><Clipboard aria-hidden="true" />{vi.pasteMode}</Button></div>
        <div className="ingest-warning"><Info aria-hidden="true" /><p>{vi.disclaimer}</p></div>
        {mode === 'file' ? <><div ref={dropFrame} tabIndex={-1} aria-label={vi.add} className={`drop-frame${drag ? ' is-dragging' : ''}`} onDragOver={e => { e.preventDefault(); if (enabled) setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); if (!enabled) return; if (e.dataTransfer.files.length !== 1) { terminate(); clearResult(); setBusy(''); setError(vi.errors['multiple-files']); return; } void run(e.dataTransfer.files[0]); }}><input className="sr-only" tabIndex={-1} type="file" ref={fileInput} aria-label={vi.fileMode} accept=".docx,.pdf,.txt,.xlsx,.pptx" disabled={!enabled} onChange={e => { if (e.target.files?.[0]) void run(e.target.files[0]); }} /><button className="drop-zone" aria-describedby="file-limits" disabled={!enabled} onClick={() => fileInput.current?.click()}><Upload aria-hidden="true" strokeWidth={1.3} /><strong>{busy || (destination ? vi.drop : vi.locked)}</strong><span>{vi.browse}</span></button></div><p className="file-limits" id="file-limits">{vi.formats}<br />{vi.limit}</p></> : <div className="paste-panel"><label htmlFor="paste-text">{vi.pasteLabel}</label><p>{vi.pasteHint}</p><textarea id="paste-text" value={paste} disabled={!!busy} onChange={e => { setPaste(e.target.value); clearResult(); }} placeholder={vi.pastePlaceholder} rows={6} /><Button disabled={!paste.trim() || !!busy} onClick={() => void run()}>{vi.start}<ArrowRight aria-hidden="true" /></Button></div>}
        {busy ? <div role="status" className="processing"><progress aria-label={busy} /><p>{busy}</p></div> : null}
        {error ? <Alert><Info aria-hidden="true" /><div><strong>{vi.rejected}</strong><p>{error}</p><p>{vi.tryAgain}</p></div></Alert> : null}
        {mode === 'file' ? <div className="try-demo"><span>{vi.demoHint}</span><Button variant="ghost" disabled={!enabled} onClick={() => void run(new File([SYNTHETIC_NOTICE + '\nBuổi sinh hoạt câu lạc bộ học tập sẽ thảo luận về sách và cây xanh.'], 'tai-lieu-gia-lap.txt', { type: 'text/plain' }))}>{vi.demo}<ArrowUpRight aria-hidden="true" /></Button></div> : null}
      </section>
      </div>
      {mode === 'paste' && result ? <section className="masked-panel"><h3>{vi.maskedLabel}</h3>{result.maxSeverity === 'S3' ? <p>{vi.copyLocked}</p> : <div className="masked-text" role="textbox" aria-label={vi.maskedLabel} aria-readonly="true" tabIndex={0}>{presentation?.parts.map((part, i) => part.number ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>)}</div>}{result.maxSeverity !== 'S3' && !presentation?.redactions.length ? <p>{vi.noRedactions}</p> : null}<Button variant="outline" disabled={result.maxSeverity === 'S3' || !presentation?.text} onClick={() => void copy()}><Clipboard aria-hidden="true" />{vi.copy}</Button></section> : null}
      <section className="read-sheet" aria-labelledby="read-sheet-heading" hidden={!result}><h3 id="read-sheet-heading">{vi.readSheet}</h3><dl>{(['A', 'B', 'C'] as const).map(code => <div key={code}><dt>{code}</dt><dd>{vi.outcomeNote[code]}</dd></div>)}</dl><p>{vi.readSheetSteps}</p></section><div className="session-actions"><Button variant="ghost" onClick={() => dialog.current?.showModal()}><Trash2 aria-hidden="true" />{vi.reset}</Button><span>{vi.synthetic}</span></div>
      <div className="local-note"><LockKeyhole aria-hidden="true" /><p>{vi.privacy}</p></div>
    </section><div className="sheet-column"><Sheet result={result} pack={pack} busy={busy} onAnother={reset} redactions={presentation?.redactions} /></div><p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{result ? `${result.outcome}. ${vi.outcomeNote[result.outcome]}` : ''}</p></div>
    <section className="how-section" id="cach-su-dung"><div className="section-title"><h2>{vi.how}</h2><CircleHelp aria-hidden="true" /></div><ol>{vi.howSteps.map(([title, description], i) => <li key={title}><span className="how-number">{i + 1}</span><div><h3>{title}</h3><p>{description}</p></div>{i < 2 ? <ArrowRight aria-hidden="true" /> : null}</li>)}</ol><div className="limits-line"><strong>{vi.limitsTitle}</strong><p>{vi.limitsText}</p></div></section>
    <section className="deployment-guide"><h3>{vi.deploymentTitle}</h3><p>{vi.deploymentDemo}</p><p>{vi.deploymentReal}</p><div className="guide-links"><a className="button button-outline" href={publicLinks.source} target="_blank" rel="noreferrer">{vi.footerSource}<ArrowUpRight aria-hidden="true" /></a>{location.protocol !== 'file:' ? <a className="button button-primary" href={publicLinks.offline} download>{vi.downloadOffline}</a> : <p>{vi.offlineOpen}</p>}</div></section>
    <RulesViewer pack={pack} source={rulepackText || defaultPackText} /><div className="rule-actions"><input className="sr-only" tabIndex={-1} ref={ruleInput} type="file" accept=".json" aria-label={vi.loadRules} onChange={e => { if (e.target.files?.[0]) void run(undefined, e.target.files[0]); }} /><Button variant="outline" disabled={!!busy} onClick={() => ruleInput.current?.click()}><FileCode2 aria-hidden="true" />{vi.loadRules}</Button>{rulepackText ? <Button variant="ghost" disabled={!!busy} onClick={() => { setPack(DEFAULT_RULEPACK); setRulepackText(''); clearResult(); }}>{vi.defaultRules}</Button> : null}</div>
    {notice ? <p className="notice" role="status">{notice}</p> : null}
    <section className="about-section"><div><h2>{vi.about}</h2><p>{vi.aboutText}</p></div><a href="./phan-hoi/">{vi.feedback}<ArrowUpRight aria-hidden="true" /></a></section></main>
    <PublicFooter />
    <dialog ref={dialog} aria-labelledby="reset-heading" className="reset-dialog"><h2 id="reset-heading">{vi.resetTitle}</h2><p>{vi.resetBody}</p><div><Button variant="outline" onClick={() => dialog.current?.close()}>{vi.cancel}</Button><Button onClick={reset}>{vi.confirm}</Button></div></dialog>
  </div>;
}
