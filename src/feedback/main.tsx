import { useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Download, Send, Info } from 'lucide-react';
import { FEEDBACK_SCHEMA, validateFeedback, type FeedbackResponse } from '../shared/feedback-schema';
import { APP_VERSION } from '../shared/version';
import { vi } from '../ui/copy.vi';
import { Button } from '../ui/components/button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { PublicFooter } from '../ui/PublicFooter';
import { loadLocalFonts } from '../ui/fonts';
import '../ui/styles.css';
import { DEFAULT_RULEPACK } from '../core/rulepack';
import { matches } from '../core/engine';
const copy = vi.feedbackPage;
const configured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
const initial = (): FeedbackResponse => ({ tester_code: '', q1_self_complete: '', q2_clarity: 0, q3_excess_missing: '', q4_would_use: '', q5_top_fix: '', app_version: APP_VERSION, rulepack_id: 'demo-1.0.0' });
export function FeedbackApp() {
  const [form, setForm] = useState(initial), [trap, setTrap] = useState(''), [message, setMessage] = useState(''), [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const sending = useRef(false);
  const sensitive = ['q3_excess_missing', 'q4_would_use', 'q5_top_fix'].some(key => DEFAULT_RULEPACK.rules.some(rule => (rule.severity === 'S3' || rule.group === 'personal') && matches(rule, String(form[key as keyof FeedbackResponse])).length > 0));
  function update<K extends keyof FeedbackResponse>(key: K, value: FeedbackResponse[K]) { setForm(f => ({ ...f, [key]: value })); setMessage(''); setSent(false); }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (sending.current || sent) return;
    if (sensitive) { setMessage(vi.sensitiveFeedback); return; }
    if (trap || !validateFeedback(form)) { setMessage(copy.invalid); return; }
    if (!configured) { setMessage(copy.missing); return; }
    sending.current = true; setPending(true);
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
    try {
      const client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      const { error } = await client.from('feedback_responses').insert(form).abortSignal(controller.signal);
      if (error) { setMessage(error.code === 'P0001' && error.message.includes('feedback_cap_reached') ? vi.feedbackFull : error.code === '23505' ? vi.feedbackDuplicate : copy.failed); return; }
      setForm(initial()); setSent(true); setMessage(copy.success);
      requestAnimationFrame(() => document.getElementById('feedback-message')?.focus());
    } catch { setMessage(copy.failed); } finally { clearTimeout(timer); setPending(false); sending.current = false; }
  }
  function download() {
    if (sensitive) { setMessage(vi.sensitiveFeedback); return; }
    if (trap || !validateFeedback(form)) { setMessage(copy.invalid); return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `phieu-phan-hoi-${form.tester_code}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  const required = <span className="required-label" aria-hidden="true"> {vi.required}</span>;
  return <><div className="status-strip" role="region" aria-label={vi.statementRegion}><div className="shell">{vi.statement}</div></div><main className="feedback-app shell"><div className="feedback-top"><a className="feedback-back button button-outline" href="../"><ArrowLeft aria-hidden="true" size={18} />{copy.back}</a><ThemeToggle /></div><header><h1>{copy.title}</h1><p>{copy.intro}</p></header><div className="feedback-reminder"><Info aria-hidden="true" size={18} /><p>{copy.reminder}</p></div>{!configured ? <p className="feedback-config" role="status">{copy.missing}</p> : null}<form onSubmit={e => void send(e)}><fieldset disabled={pending}><div className="feedback-field"><label htmlFor="tester-code">{copy.tester}</label>{required}<input id="tester-code" name="tester_code" value={form.tester_code} onChange={e => update('tester_code', e.target.value)} pattern={FEEDBACK_SCHEMA.testerPattern} maxLength={3} required aria-describedby="tester-hint" autoComplete="off" spellCheck={false} /><p id="tester-hint">{copy.testerHint}</p></div><fieldset className="feedback-field"><legend>{copy.questions[0]}{required}</legend><div className="feedback-radios">{FEEDBACK_SCHEMA.answerValues.map((value, i) => <label key={value}><input type="radio" name="self-complete" required disabled={pending} checked={form.q1_self_complete === value} value={value} onChange={() => update('q1_self_complete', value)} />{copy.choices[i]}</label>)}</div></fieldset><div className="feedback-field"><label htmlFor="clarity">{copy.questions[1]}</label>{required}<select id="clarity" name="clarity" value={form.q2_clarity} required onChange={e => update('q2_clarity', Number(e.target.value))}><option value="0" disabled>{vi.selectClarity}</option>{copy.clarity.map((text, i) => <option value={i + 1} key={text}>{i + 1} · {text}</option>)}</select></div>{(['q3_excess_missing', 'q4_would_use', 'q5_top_fix'] as const).map((key, i) => <div className="feedback-field" key={key}><label htmlFor={key}>{copy.questions[i + 2]}</label>{required}<textarea id={key} name={key} rows={3} required maxLength={FEEDBACK_SCHEMA.textMax} value={form[key]} onChange={e => update(key, e.target.value)} aria-describedby={`feedback-limits ${key}-count`} /><p className="character-count" id={`${key}-count`}>{[...form[key]].length}/{FEEDBACK_SCHEMA.textMax} {vi.characterCount}</p></div>)}<p className="feedback-limits" id="feedback-limits">{copy.limits}</p><div className="sr-only" aria-hidden="true"><label htmlFor="website-field">{copy.honeypot}</label><input id="website-field" tabIndex={-1} value={trap} onChange={e => setTrap(e.target.value)} autoComplete="off" /></div>{sensitive ? <p role="alert" className="notice">{vi.sensitiveFeedback}</p> : null}<div className="feedback-actions"><Button type="submit" disabled={pending || sent}><Send aria-hidden="true" />{pending ? copy.pending : sent ? vi.feedbackSent : copy.send}</Button><Button variant="outline" onClick={download} disabled={pending}><Download aria-hidden="true" />{copy.download}</Button></div>{message ? <p id="feedback-message" tabIndex={-1} className={sent ? 'feedback-success' : 'notice'} role="status">{message}</p> : null}</fieldset></form></main><PublicFooter /></>;
}
void loadLocalFonts().then(() => createRoot(document.getElementById('root')!).render(<FeedbackApp />));
