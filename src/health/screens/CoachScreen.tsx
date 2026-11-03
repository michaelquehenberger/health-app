// Coach: was heute zu tun ist (aus Anamnese, Tagesplan und Auswertung) und ein Gespräch mit konkreten,
// vorbeugenden Tipps. Keine medizinische Empfehlung. Ohne KI zeigt der Bereich den Tag nach den Regeln.
import { useMemo, useRef, useState } from 'react';
import type { AppData } from '../../types';
import type { HealthState } from '../types';
import { EMPTY_HEALTH } from '../types';
import { buildDayCard } from '../logic/plan';
import { blocksPlan, checkRedFlags } from '../logic/redFlags';
import { buildCoachContext, coachReply, dailyImpulse, type ChatTurn } from '../ai/coach';
import { LabExtractError } from '../ai/labExtract';
import { CLAUDE_APP_URL, useAiAvailable } from '../ai/useAi';
import { AI_ANALYSIS_CONSENT_VERSION, HealthAiConsent } from './AnalysisPanel';
import { todayIso } from '../../store';

const STARTERS = [
  'Wie bringe ich heute mehr Bewegung in meinen Alltag?',
  'Ich habe schlecht geschlafen. Was hilft mir heute?',
  'Was kann ich gegen die Steifigkeit am Morgen tun?',
  'Wie schaffe ich es, dranzubleiben?',
];

const errText = (e: unknown) => (e instanceof LabExtractError ? e.message : 'Der Coach ist gerade nicht erreichbar. Bitte später erneut versuchen.');

export function CoachScreen({ data, update, goPlan }: { data: AppData; update: (fn: (d: HealthState) => HealthState) => void; goPlan: () => void }) {
  const h = data.health ?? EMPTY_HEALTH;
  const today = todayIso();
  const ai = useAiAvailable();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState<string | null>(null);
  const ctl = useRef<AbortController | null>(null);

  const card = useMemo(
    () => buildDayCard({ date: today, profile: h.profile, complaints: h.complaints, feedback: h.feedback, values: h.values, reports: h.reports, preferredIds: h.planChoice?.exerciseIds }),
    [today, h.profile, h.complaints, h.feedback, h.values, h.reports, h.planChoice],
  );
  const blocked = useMemo(() => blocksPlan(checkRedFlags(h.complaints, h.values, h.reports)), [h.complaints, h.values, h.reports]);
  const impulse = h.coachDays?.find((d) => d.date === today)?.impulse ?? null;
  const chat = h.coachChat ?? [];

  async function getImpulse() {
    setBusy(true);
    setError(null);
    try {
      const r = await dailyImpulse(buildCoachContext(data, today));
      update((d) => ({ ...d, coachDays: [...(d.coachDays ?? []).filter((x) => x.date !== today), { date: today, impulse: r }].slice(-14) }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || streaming !== null) return;
    const turns: ChatTurn[] = [...chat, { role: 'user', content: msg, at: new Date().toISOString() }];
    update((d) => ({ ...d, coachChat: turns.slice(-40) }));
    setDraft('');
    setError(null);
    setStreaming('');
    ctl.current = new AbortController();
    try {
      const reply = await coachReply(turns, buildCoachContext(data, today), { onText: setStreaming, signal: ctl.current.signal });
      update((d) => ({ ...d, coachChat: [...turns, { role: 'assistant' as const, content: reply, at: new Date().toISOString() }].slice(-40) }));
    } catch (e) {
      if (!(e instanceof LabExtractError && e.message === 'Abgebrochen.')) setError(errText(e));
    } finally {
      setStreaming(null);
      ctl.current = null;
    }
  }

  return (
    <>
      <h1>Coach</h1>
      <p className="muted">Was heute zu tun ist, und Tipps für deinen Alltag. Zur Vorbeugung, keine medizinische Beratung.</p>

      {blocked && (
        <div className="card alert">
          <strong>Erst ärztlich abklären</strong>
          <p className="small">Eine deiner Angaben braucht ärztliche Abklärung. Bis dahin gibt es keine Übungen. Bei starken Beschwerden: Notruf 144.</p>
        </div>
      )}

      <div className="card dark">
        <span className="label">Heute · {card.focusLabel}</span>
        {card.exercises.length > 0 && !blocked ? (
          <p>{card.exercises.length} Übungen: {card.exercises.map((e) => e.name).join(', ')}.</p>
        ) : (
          <p>{card.endurance ?? 'Heute stehen keine Übungen an.'}</p>
        )}
        <p className="small">{'text' in card.drink ? card.drink.text : card.drink.blocked}</p>
        {card.nutrition && <p className="small">{card.nutrition.text}</p>}
        {!blocked && card.exercises.length > 0 && <button className="btn primary" onClick={goPlan}>Zum Tagesplan</button>}
      </div>

      {ai === false && (
        <div className="card note">
          <strong>Impuls und Gespräch mit dem Coach</strong>
          <p className="small">Den persönlichen Tagesimpuls und das Gespräch gibt es in der <a href={CLAUDE_APP_URL} target="_blank" rel="noreferrer">LIVION-Version auf claude.ai</a>, dort über dein eigenes Claude-Konto.</p>
        </div>
      )}

      {ai && h.aiAnalysisConsent?.textVersion !== AI_ANALYSIS_CONSENT_VERSION && (
        <HealthAiConsent label="Coach" title="Impuls und Gespräch mit deinen Daten" update={update} />
      )}

      {ai && h.aiAnalysisConsent?.textVersion === AI_ANALYSIS_CONSENT_VERSION && (
        <>
          <div className="card">
            <span className="label">Dein Impuls für heute</span>
            {impulse ? (
              <>
                <h3>{impulse.titel}</h3>
                <p>{impulse.impuls}</p>
                <ul className="coach-steps">
                  {impulse.schritte.map((s) => (
                    <li key={s.text}><span className="chip neutral">{s.bereich}</span> {s.text}</li>
                  ))}
                </ul>
                <button className="btn ghost" onClick={() => send(impulse.frage)} disabled={streaming !== null}>{impulse.frage}</button>
              </>
            ) : (
              <>
                <p className="small">Aus deiner Anamnese, deinem Tagesplan, deinen Werten und deiner letzten Auswertung: drei kleine Schritte für heute.</p>
                <button className="btn primary" disabled={busy} onClick={getImpulse}>{busy ? 'Impuls wird erstellt …' : 'Impuls für heute holen'}</button>
                {busy && <p className="muted small" role="status">Das dauert meist unter einer Minute.</p>}
              </>
            )}
          </div>

          <div className="card">
            <span className="label">Gespräch</span>
            {chat.length === 0 && streaming === null && <p className="small">Frag, was dich beschäftigt: Bewegung im Alltag, Schlaf, Erholung, Trinken, Motivation.</p>}
            <div className="chat" aria-live="polite">
              {chat.map((t, i) => (
                <div key={i} className={`bubble ${t.role === 'user' ? 'me' : 'coach'}`}>{t.content}</div>
              ))}
              {streaming !== null && <div className="bubble coach">{streaming || 'Denkt nach …'}</div>}
            </div>
            {chat.length === 0 && streaming === null && (
              <div className="seg" aria-label="Vorschläge">
                {STARTERS.map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
            <form className="stack" onSubmit={(e) => { e.preventDefault(); void send(draft); }}>
              <label className="field">Deine Nachricht
                <textarea id="coach-msg" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="z. B. Ich sitze viel im Büro. Was kann ich tun?" />
              </label>
              {streaming === null ? (
                <button type="submit" className="btn primary" disabled={!draft.trim()}>Senden</button>
              ) : (
                <button type="button" className="btn dark" onClick={() => ctl.current?.abort()}>Stopp</button>
              )}
            </form>
            {chat.length > 0 && streaming === null && (
              <button className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={() => update((d) => ({ ...d, coachChat: [] }))}>Gespräch löschen</button>
            )}
          </div>
        </>
      )}

      {error && <div className="card alert" role="alert"><p className="small">{error}</p></div>}
      <p className="footer-note">Der Coach gibt allgemeine Tipps zur Vorbeugung. Er stellt keine Diagnosen und empfiehlt keine Medikamente. Bei Warnzeichen: ärztliche Hilfe, im Notfall 144.</p>
    </>
  );
}
